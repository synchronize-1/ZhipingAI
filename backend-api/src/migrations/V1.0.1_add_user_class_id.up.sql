-- ============================================================
-- V1.0.1 为用户表补充班级关联字段
--
-- 背景：V1.0.0 迁移创建了 classes 表，但 users 表未同步补充 class_id 字段，
-- 导致用户列表、班级筛选、成绩导入等依赖 u.class_id 的查询报错
-- Unknown column 'u.class_id' in 'field list'。
--
-- 本次迁移：
--   - users 表新增 class_id 字段（学生所属班级）
--   - 新增索引 idx_class_id
--   - 新增外键约束 fk_users_class（classes.id，删除班级时置空）
--
-- 幂等：字段 / 索引 / 外键均先探测再执行，重复运行安全。
-- 兼容：历史 initDatabase 建表含 employee_id，迁移建表则没有，
--       因此 AFTER 子句按实际列存在情况动态选择。
-- ============================================================

-- 1. class_id 字段
SET @has_class_id := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'class_id'
);
SET @has_employee_id := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'employee_id'
);

SET @ddl := IF(
  @has_class_id > 0,
  'DO 0',
  IF(
    @has_employee_id > 0,
    'ALTER TABLE users ADD COLUMN class_id INT DEFAULT NULL COMMENT ''所属班级ID（学生）'' AFTER employee_id',
    'ALTER TABLE users ADD COLUMN class_id INT DEFAULT NULL COMMENT ''所属班级ID（学生）'''
  )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. idx_class_id 索引
SET @has_index := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_class_id'
);
SET @ddl := IF(@has_index > 0, 'DO 0', 'ALTER TABLE users ADD INDEX idx_class_id (class_id)');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. fk_users_class 外键
SET @has_fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
     AND CONSTRAINT_NAME = 'fk_users_class'
);
SET @ddl := IF(
  @has_fk > 0,
  'DO 0',
  'ALTER TABLE users ADD CONSTRAINT fk_users_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;