-- V1.0.1 回滚：移除 users.class_id 外键与字段
SET @has_fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
     AND CONSTRAINT_NAME = 'fk_users_class'
);
SET @ddl := IF(@has_fk > 0, 'ALTER TABLE users DROP FOREIGN KEY fk_users_class', 'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_class_id := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'class_id'
);
SET @ddl := IF(@has_class_id > 0, 'ALTER TABLE users DROP COLUMN class_id', 'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;