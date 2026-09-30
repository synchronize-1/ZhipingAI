-- V1.0.8 回滚：还原通知类型枚举并移除索引
-- 先将 elective 类型回退为 system，避免枚举收缩时报错。

SET @has_table := (
  SELECT COUNT(*) FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'
);

SET @ddl := IF(
  @has_table > 0,
  'UPDATE notifications SET type = ''system'' WHERE type = ''elective''',
  'DO 0'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  @has_table > 0,
  'ALTER TABLE notifications MODIFY COLUMN type ENUM(''system'',''course'',''activity'',''service'',''emergency'') DEFAULT ''system'' COMMENT ''通知类型''',
  'DO 0'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'
     AND INDEX_NAME = 'idx_notifications_scope'
);
SET @ddl := IF(
  @has_idx > 0,
  'ALTER TABLE notifications DROP INDEX idx_notifications_scope',
  'DO 0'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;