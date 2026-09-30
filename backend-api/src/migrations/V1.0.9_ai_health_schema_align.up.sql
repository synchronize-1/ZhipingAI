-- ============================================================
-- V1.0.9 对齐 AI 健康模块表结构
--
-- 背景：routes/aiHealth.js 与 services/dashboard.service.js 按下列结构编写：
--   - ai_survey_responses.dependence_level（依赖等级：轻度 / 中度 / 重度）
--   - users.dependence_score / users.dependence_level
-- 但现有库中这三列均不存在，导致 /api/ai-health/* 系列接口 500。
--
-- 处理：以 dependence_score 为唯一数据源，用「存储生成列」派生 dependence_level，
--       避免冗余字段失步；users.dependence_score 由最近一次 AI 使用记录回填。
--
-- 幂等：列存在则跳过，重复运行安全。
-- ============================================================

-- 1) ai_survey_responses.dependence_level
SET @has_survey_level := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'ai_survey_responses'
     AND COLUMN_NAME = 'dependence_level'
);
SET @ddl := IF(@has_survey_level > 0, 'DO 0',
  'ALTER TABLE ai_survey_responses ADD COLUMN dependence_level VARCHAR(10) GENERATED ALWAYS AS (CASE WHEN dependence_score IS NULL THEN NULL WHEN dependence_score >= 80 THEN ''重度'' WHEN dependence_score >= 50 THEN ''中度'' ELSE ''轻度'' END) STORED COMMENT ''依赖等级（由 dependence_score 派生）''');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) users.dependence_score
SET @has_user_score := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'dependence_score'
);
SET @ddl := IF(@has_user_score > 0, 'DO 0',
  'ALTER TABLE users ADD COLUMN dependence_score INT NULL COMMENT ''AI依赖指数（0-100）''');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) users.dependence_level
SET @has_user_level := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'dependence_level'
);
SET @ddl := IF(@has_user_level > 0, 'DO 0',
  'ALTER TABLE users ADD COLUMN dependence_level VARCHAR(10) GENERATED ALWAYS AS (CASE WHEN dependence_score IS NULL THEN NULL WHEN dependence_score >= 80 THEN ''重度'' WHEN dependence_score >= 50 THEN ''中度'' ELSE ''轻度'' END) STORED COMMENT ''依赖等级（由 dependence_score 派生）''');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) 回填 users.dependence_score：取每位学生最近一次 AI 使用记录的依赖指数
UPDATE users u
JOIN (
  SELECT l.user_id, l.dependence_score
  FROM ai_usage_logs l
  WHERE l.dependence_score IS NOT NULL
    AND l.id = (
      SELECT MAX(l2.id) FROM ai_usage_logs l2
       WHERE l2.user_id = l.user_id AND l2.dependence_score IS NOT NULL
    )
) x ON x.user_id = u.id
SET u.dependence_score = x.dependence_score
WHERE u.dependence_score IS NULL;