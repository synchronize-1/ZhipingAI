-- V1.0.9 回滚：移除 AI 健康模块对齐时新增的列
-- 幂等：列不存在则跳过。

SET @has_user_level := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'dependence_level'
);
SET @ddl := IF(@has_user_level > 0, 'ALTER TABLE users DROP COLUMN dependence_level', 'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_user_score := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'dependence_score'
);
SET @ddl := IF(@has_user_score > 0, 'ALTER TABLE users DROP COLUMN dependence_score', 'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_survey_level := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'ai_survey_responses'
     AND COLUMN_NAME = 'dependence_level'
);
SET @ddl := IF(@has_survey_level > 0, 'ALTER TABLE ai_survey_responses DROP COLUMN dependence_level', 'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;