-- ============================================================
-- seed_test_timetable：课表演示数据
--
-- 内容：为 5 个班级生成一周课表（周一~周五 × 8 节）。
--       学科按年级课时规划展开为「课次」，按固定步长轮转分配到时隙，
--       班级 / 教师 / 教室均按规则错开，避免冲突。
--
-- 前置：npm run init:db && npm run migrate && npm run seed:core && npm run seed:users
--
-- 幂等：先按「学期 + 班级」清空旧排课再重建，重复执行结果一致。
-- ============================================================

-- 当前学期（与 TimetableService.getDefaultSemester 规则一致）
-- 显式 COLLATE：连接层为 utf8mb4_general_ci，而表列为 utf8mb4_unicode_ci，
-- 用户变量与列直接比较会触发 "Illegal mix of collations"
SET @semester := CASE
  WHEN MONTH(NOW()) >= 9 THEN CONCAT(YEAR(NOW()), '-', YEAR(NOW()) + 1, '-1')
  WHEN MONTH(NOW()) <= 1 THEN CONCAT(YEAR(NOW()) - 1, '-', YEAR(NOW()), '-1')
  ELSE CONCAT(YEAR(NOW()) - 1, '-', YEAR(NOW()), '-2')
END COLLATE utf8mb4_unicode_ci;

DELETE FROM timetable_entries
 WHERE semester = @semester
   AND class_id BETWEEN 1 AND 5;

INSERT INTO timetable_entries
  (semester, class_id, subject_id, teacher_id, room_id,
   day_of_week, period, start_time, end_time, week_start, week_end, created_by)
SELECT s.semester, s.class_id, s.subject_id, s.teacher_id, s.room_id,
       s.day_of_week, s.period, pd.start_time, pd.end_time, 1, 20, 1
  FROM (
    SELECT @semester AS semester,
           l.class_id, l.subject_id,
           t.id AS teacher_id,
           r.id AS room_id,
           FLOOR((l.slot_no - 1) / 5) + 1  AS period,
           ((l.slot_no - 1) % 5) + 1       AS day_of_week
      FROM (
        SELECT l0.class_id, l0.subject_id,
               ((l0.rn - 1 + (l0.class_id - 1) * 7) % 40) + 1 AS slot_no
          FROM (
            SELECT c.id AS class_id, p.subject_id, n.n AS seq,
                   ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY p.subject_id, n.n) AS rn
              FROM classes c
              JOIN (
                SELECT 1 AS grade_key, 1 AS subject_id, 4 AS cnt
                UNION ALL SELECT 1, 2, 4
                UNION ALL SELECT 1, 3, 4
                UNION ALL SELECT 1, 4, 3
                UNION ALL SELECT 1, 5, 3
                UNION ALL SELECT 1, 6, 3
                UNION ALL SELECT 1, 7, 2
                UNION ALL SELECT 1, 8, 2
                UNION ALL SELECT 1, 9, 2
                UNION ALL SELECT 2, 1, 6
                UNION ALL SELECT 2, 2, 6
                UNION ALL SELECT 2, 3, 5
                UNION ALL SELECT 2, 4, 5
              ) p ON p.grade_key = IF(c.grade = '高一', 1, 2)
              JOIN (
                SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3
                UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
              ) n ON n.n <= p.cnt
             WHERE c.id BETWEEN 1 AND 5
          ) l0
      ) l
      JOIN (
        SELECT id, ROW_NUMBER() OVER (ORDER BY id) - 1 AS tseq,
               COUNT(*) OVER () AS tcnt
          FROM users WHERE role = 'teacher'
      ) t ON t.tseq = (l.subject_id - 1 + l.class_id - 1) % t.tcnt
      JOIN (
        SELECT id, ROW_NUMBER() OVER (ORDER BY id) - 1 AS rseq,
               COUNT(*) OVER () AS rcnt
          FROM rooms WHERE status = 'active'
      ) r ON r.rseq = (l.class_id - 1) % r.rcnt
  ) s
  JOIN (
    SELECT 1 AS period, '08:00:00' AS start_time, '08:45:00' AS end_time
    UNION ALL SELECT 2, '08:55:00', '09:40:00'
    UNION ALL SELECT 3, '10:00:00', '10:45:00'
    UNION ALL SELECT 4, '10:55:00', '11:40:00'
    UNION ALL SELECT 5, '14:00:00', '14:45:00'
    UNION ALL SELECT 6, '14:55:00', '15:40:00'
    UNION ALL SELECT 7, '16:00:00', '16:45:00'
    UNION ALL SELECT 8, '16:55:00', '17:40:00'
  ) pd ON pd.period = s.period;