-- ============================================================
-- V1.0.8 通知中心增强
--
-- 1) 扩展 notifications.type 枚举，新增 elective（选课），
--    与「系统 / 教学 / 活动 / 服务 / 紧急」共同构成通知分类；
-- 2) 增加可见范围查询索引（target_role, user_id, is_read），
--    支撑按角色收敛 + 未读筛选的列表查询。
--
-- 兼容性：notifications 表由 initDatabase 创建，历史库可能尚未执行过建表，
-- 因此所有 DDL 先探测再执行，表不存在时安全跳过。
-- ============================================================

SET @has_table := (
  SELECT COUNT(*) FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'
);

-- 扩展类型枚举
SET @ddl := IF(
  @has_table > 0,
  'ALTER TABLE notifications MODIFY COLUMN type ENUM(''system'',''course'',''activity'',''service'',''emergency'',''elective'') DEFAULT ''system'' COMMENT ''通知类型''',
  'DO 0'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 可见范围索引
SET @has_idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'
     AND INDEX_NAME = 'idx_notifications_scope'
);
SET @ddl := IF(
  @has_idx > 0,
  'DO 0',
  'ALTER TABLE notifications ADD INDEX idx_notifications_scope (target_role, user_id, is_read)'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;