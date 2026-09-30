-- V1.0.4 回滚：删除活动报名表，并回收 activities 的补列
DROP TABLE IF EXISTS activity_registrations;

SET @has_cover := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activities' AND COLUMN_NAME = 'cover'
);
SET @ddl := IF(@has_cover > 0, 'ALTER TABLE activities DROP COLUMN cover', 'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_updated_at := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activities' AND COLUMN_NAME = 'updated_at'
);
SET @ddl := IF(@has_updated_at > 0, 'ALTER TABLE activities DROP COLUMN updated_at', 'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;