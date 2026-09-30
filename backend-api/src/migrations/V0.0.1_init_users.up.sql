-- ============================================================
-- V0.0.1 初始化 users 表
--
-- 所有后续迁移的前置依赖：V1.0.0 中多张表的外键引用 users(id)。
-- 幂等：CREATE TABLE IF NOT EXISTS，重复执行不会破坏已有表。
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码（加密后）',
  real_name VARCHAR(50) COMMENT '真实姓名',
  role VARCHAR(20) DEFAULT 'student' COMMENT '角色：admin/teacher/student',
  email VARCHAR(100) COMMENT '邮箱',
  phone VARCHAR(20) COMMENT '手机号',
  avatar VARCHAR(255) COMMENT '头像URL',
  status TINYINT DEFAULT 1 COMMENT '状态：0=禁用，1=正常',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_username (username),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';