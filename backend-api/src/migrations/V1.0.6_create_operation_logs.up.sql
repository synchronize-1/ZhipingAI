-- ============================================================
-- V1.0.6 操作日志（审计）表
--
-- 记录管理类写操作（POST / PUT / PATCH / DELETE），用于安全审计与问题追溯。
-- 设计要点：
--   - 不建立外键约束：即使操作者被删除，历史审计记录仍需保留
--   - 仅记录写操作，读操作不入库，避免日志表膨胀
--   - request_body 存储脱敏后的请求体快照（截断至 2000 字符）
-- ============================================================

CREATE TABLE IF NOT EXISTS operation_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
  user_id INT DEFAULT NULL COMMENT '操作人ID',
  username VARCHAR(50) DEFAULT NULL COMMENT '操作人账号',
  role VARCHAR(20) DEFAULT NULL COMMENT '操作人角色',
  module VARCHAR(50) DEFAULT NULL COMMENT '业务模块，如 electives/activities/timetable',
  action VARCHAR(50) DEFAULT NULL COMMENT '动作，如 create/update/delete/login',
  method VARCHAR(10) NOT NULL COMMENT 'HTTP 方法',
  path VARCHAR(255) NOT NULL COMMENT '请求路径',
  target_type VARCHAR(50) DEFAULT NULL COMMENT '目标类型',
  target_id VARCHAR(50) DEFAULT NULL COMMENT '目标ID',
  status_code INT DEFAULT NULL COMMENT 'HTTP 状态码',
  success TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否成功',
  duration_ms INT DEFAULT NULL COMMENT '处理耗时(ms)',
  ip VARCHAR(64) DEFAULT NULL COMMENT '客户端IP',
  user_agent VARCHAR(255) DEFAULT NULL COMMENT 'User-Agent',
  request_body TEXT DEFAULT NULL COMMENT '请求体快照(已脱敏/截断)',
  error_message VARCHAR(500) DEFAULT NULL COMMENT '错误信息',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  INDEX idx_created_at (created_at),
  INDEX idx_user (user_id),
  INDEX idx_module (module),
  INDEX idx_action (action),
  INDEX idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志（审计）表';