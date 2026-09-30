-- ============================================================
-- V1.0.7 回滚：移除 users.status 字段
--
-- 说明：仅当该字段存在时删除；V0.0.1 建表路径本就不含此列时为空操作。
-- ============================================================

SET @has_status := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status'
);

SET @ddl := IF(
  @has_status = 0,
  'DO 0',
  'ALTER TABLE users DROP COLUMN status'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;