-- ============================================================
-- V0.0.2 插入基础用户
--
-- 为 V1.0.0 及种子数据提供外键引用所需的用户记录，
-- id 显式为 1~5，后续种子脚本依赖这些 id。
--
-- 兼容两种历史 users 结构：
--   - 迁移建表（V0.0.1）：姓名字段为 real_name
--   - 早期 initDatabase 建表：姓名字段为 name（NOT NULL）
-- 通过 information_schema 探测后动态拼装列名，保证两条链路都能执行。
-- ============================================================

SET @has_real_name := (
  SELECT COUNT(*)
    FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'real_name'
);
SET @name_col := IF(@has_real_name > 0, 'real_name', 'name');

SET @seed_users := CONCAT(
  'INSERT IGNORE INTO users (id, username, password, ', @name_col, ', role) VALUES ',
  "(1, 'admin',    'admin123',   '管理员', 'admin'),",
  "(2, 'teacher1', 'teacher123', '张教授', 'teacher'),",
  "(3, 'teacher2', 'teacher123', '李教授', 'teacher'),",
  "(4, 'student1', 'student123', '王小明', 'student'),",
  "(5, 'student2', 'student123', '李小红', 'student')"
);

PREPARE seed_stmt FROM @seed_users;
EXECUTE seed_stmt;
DEALLOCATE PREPARE seed_stmt;