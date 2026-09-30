-- ============================================================
-- V1.0.3 课表条目表
--
-- 面向「班级课表」的排课数据（管理员/教务排课，教师与学生查看）。
-- 与旧的 schedules 表（按用户维度的选课课表）解耦，采用新的三层架构。
--
-- 唯一约束 uk_class_slot：同一学期内，一个班级在同一「星期 + 节次」只能有一门课，
-- 从数据库层面兜底班级冲突；教师冲突与教室冲突由 Service 层检测。
-- ============================================================

CREATE TABLE IF NOT EXISTS timetable_entries (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '课表条目ID',
  semester VARCHAR(20) NOT NULL COMMENT '学期，如 2024-2025-1',
  class_id INT NOT NULL COMMENT '班级ID',
  subject_id INT NOT NULL COMMENT '学科ID',
  teacher_id INT NOT NULL COMMENT '授课教师ID',
  room_id INT DEFAULT NULL COMMENT '教室ID（可空）',
  day_of_week TINYINT NOT NULL COMMENT '星期：1=周一 ... 7=周日',
  period TINYINT NOT NULL COMMENT '节次：1..8',
  start_time TIME NOT NULL COMMENT '开始时间',
  end_time TIME NOT NULL COMMENT '结束时间',
  week_start INT NOT NULL DEFAULT 1 COMMENT '起始周',
  week_end INT NOT NULL DEFAULT 20 COMMENT '结束周',
  note VARCHAR(200) DEFAULT NULL COMMENT '备注',
  created_by INT DEFAULT NULL COMMENT '创建人',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY uk_class_slot (semester, class_id, day_of_week, period),
  INDEX idx_teacher_slot (semester, teacher_id, day_of_week, period),
  INDEX idx_room_slot (semester, room_id, day_of_week, period),
  CONSTRAINT fk_tt_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_tt_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
  CONSTRAINT fk_tt_teacher FOREIGN KEY (teacher_id) REFERENCES users(id),
  CONSTRAINT fk_tt_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  CONSTRAINT fk_tt_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课表条目表';