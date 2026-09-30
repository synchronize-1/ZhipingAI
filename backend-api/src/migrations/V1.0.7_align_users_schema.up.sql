-- ============================================================
-- V1.0.7 对齐 users 表结构（补齐 status 字段）
--
-- 背景：users 表存在两条建表链路——
--   1. initDatabase.js（早期脚本）：不含 status 字段
--   2. V0.0.1 迁移：含 status，但为 CREATE TABLE IF NOT EXISTS，
--      在 initDatabase 已建表时不会生效
-- 结果是「init:db + migrate」路径下的 users 缺少 status，
-- 导致 User.js（u.status）与种子脚本执行失败。
--
-- 本次迁移：探测并补齐 status 字段，使两条链路结构一致。
--
-- 幂等：字段存在则跳过，重复运行安全。
-- ============================================================

SET @has_status := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status'
);

SET @ddl := IF(
  @has_status > 0,
  'DO 0',
  'ALTER TABLE users ADD COLUMN status TINYINT DEFAULT 1 COMMENT ''状态：0=禁用，1=正常'' AFTER avatar'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 兜底：历史数据若为 NULL 则视为正常
UPDATE users SET status = 1 WHERE status IS NULL;