-- ============================================================
-- V1.0.5 选修课与选课记录表
--
-- 面向「选课系统」：管理员发布选修课并设置容量/选课时间窗口，
-- 学生在开放期内在线选课、退选。
--
-- 与旧的 courses / course_enrollments（按课程维度的旧模块）解耦，
-- 采用新的三层架构，独立承载选修课业务。
--
-- 唯一约束 uk_course_student：同一学生对同一选修课只能有一条记录，
-- 退选后复用同一条记录（状态置为 dropped），避免重复选课。
-- ============================================================

CREATE TABLE IF NOT EXISTS elective_courses (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '选修课ID',
  code VARCHAR(50) DEFAULT NULL COMMENT '课程编号',
  name VARCHAR(100) NOT NULL COMMENT '课程名称',
  description VARCHAR(500) DEFAULT NULL COMMENT '课程简介',
  category VARCHAR(30) DEFAULT NULL COMMENT '课程类别',
  teacher_id INT DEFAULT NULL COMMENT '授课教师ID',
  subject_id INT DEFAULT NULL COMMENT '关联学科ID（可空）',
  semester VARCHAR(20) NOT NULL COMMENT '学期，如 2024-2025-1',
  grade VARCHAR(20) DEFAULT NULL COMMENT '限定年级，空表示不限',
  capacity INT NOT NULL DEFAULT 30 COMMENT '选课容量',
  credit DECIMAL(3,1) DEFAULT NULL COMMENT '学分',
  location VARCHAR(100) DEFAULT NULL COMMENT '上课地点',
  schedule_text VARCHAR(100) DEFAULT NULL COMMENT '上课时间描述',
  select_start DATETIME DEFAULT NULL COMMENT '选课开始时间',
  select_end DATETIME DEFAULT NULL COMMENT '选课结束时间',
  status ENUM('draft','open','closed') NOT NULL DEFAULT 'draft' COMMENT '状态：草稿/开放选课/已关闭',
  created_by INT DEFAULT NULL COMMENT '创建人',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_semester_status (semester, status),
  INDEX idx_teacher (teacher_id),
  CONSTRAINT fk_ec_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_ec_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  CONSTRAINT fk_ec_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='选修课表';

CREATE TABLE IF NOT EXISTS elective_selections (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '选课记录ID',
  course_id INT NOT NULL COMMENT '选修课ID',
  student_id INT NOT NULL COMMENT '学生ID',
  status ENUM('selected','dropped') NOT NULL DEFAULT 'selected' COMMENT '选课状态',
  selected_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '选课时间',
  dropped_at DATETIME DEFAULT NULL COMMENT '退选时间',
  remark VARCHAR(200) DEFAULT NULL COMMENT '备注',
  UNIQUE KEY uk_course_student (course_id, student_id),
  INDEX idx_student_status (student_id, status),
  INDEX idx_course_status (course_id, status),
  CONSTRAINT fk_es_course FOREIGN KEY (course_id) REFERENCES elective_courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_es_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='选课记录表';

-- 幂等兜底：旧库若缺少 credit 字段则补齐（保持向后兼容）
SET @has_credit := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'elective_courses' AND COLUMN_NAME = 'credit'
);
SET @ddl := IF(
  @has_credit > 0,
  'DO 0',
  'ALTER TABLE elective_courses ADD COLUMN credit DECIMAL(3,1) DEFAULT NULL COMMENT ''学分'' AFTER capacity'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;