-- ============================================================
-- V1.0.4 活动报名表
--
-- 面向「校园活动」的报名数据（管理员/教师发布活动，学生在线报名）。
-- 复用既有的 activities 表（旧模块遗留，字段已满足需求），
-- 新建 activity_registrations 表承载报名关系，与旧代码解耦。
--
-- 唯一约束 uk_activity_user：同一用户对同一活动只能有一条报名记录，
-- 取消后可复用同一条记录（状态置为 cancelled），避免重复报名。
--
-- 幂等：activities 的补列先探测表与列是否存在，重复运行安全。
-- ============================================================

-- 1. 补齐 activities 表字段（封面图、更新时间）
SET @has_activities := (
  SELECT COUNT(*) FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activities'
);
SET @has_cover := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activities' AND COLUMN_NAME = 'cover'
);
SET @ddl := IF(
  @has_activities = 0 OR @has_cover > 0,
  'DO 0',
  'ALTER TABLE activities ADD COLUMN cover VARCHAR(500) DEFAULT NULL COMMENT ''封面图URL'' AFTER images'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_updated_at := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activities' AND COLUMN_NAME = 'updated_at'
);
SET @ddl := IF(
  @has_activities = 0 OR @has_updated_at > 0,
  'DO 0',
  'ALTER TABLE activities ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''更新时间'' AFTER created_at'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 活动报名表
CREATE TABLE IF NOT EXISTS activity_registrations (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '报名记录ID',
  activity_id INT NOT NULL COMMENT '活动ID',
  user_id INT NOT NULL COMMENT '报名用户ID',
  status ENUM('registered','checked_in','cancelled') NOT NULL DEFAULT 'registered' COMMENT '报名状态',
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
  checked_in_at DATETIME DEFAULT NULL COMMENT '签到时间',
  remark VARCHAR(200) DEFAULT NULL COMMENT '备注',
  UNIQUE KEY uk_activity_user (activity_id, user_id),
  INDEX idx_user_status (user_id, status),
  INDEX idx_activity_status (activity_id, status),
  CONSTRAINT fk_ar_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  CONSTRAINT fk_ar_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动报名表';