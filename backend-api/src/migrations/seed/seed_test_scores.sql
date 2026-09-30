-- ============================================================
-- seed_test_scores：补充考试与成绩
--
-- 内容：为每个年级补齐 3 次考试（同年级科目集合一致，便于总分对比与趋势分析），
--       并为全部 9 场考试（V1.0.0 的 1~3 场 + 本脚本的 4~9 场）生成确定性成绩，
--       最后重算班级 / 年级排名。
--
-- 前置：npm run init:db && npm run migrate && npm run seed:core && npm run seed:users
--
-- 幂等：成绩由 CRC32 哈希确定性生成，配合 INSERT IGNORE 与唯一键
--       (exam_id, student_id, subject_id)，重复执行结果完全一致。
-- ============================================================

-- ---------- 1. 补充考试 ----------
INSERT IGNORE INTO exams (id, name, exam_type, grade, exam_date, semester, status, created_by) VALUES
  (4, '2024年春季高一第一次月考', 'monthly', '高一', '2024-03-10', '2023-2024-2', 2, 1),
  (5, '2024年春季高一期末考试',   'final',   '高一', '2024-06-20', '2023-2024-2', 2, 1),
  (6, '2024年春季高二期中考试',   'midterm', '高二', '2024-04-25', '2023-2024-2', 2, 1),
  (7, '2024年春季高二期末考试',   'final',   '高二', '2024-06-25', '2023-2024-2', 2, 1),
  (8, '2024年高三模拟考试（二）', 'mock',    '高三', '2024-06-05', '2023-2024-2', 2, 1),
  (9, '2024年高三模拟考试（三）', 'mock',    '高三', '2024-06-25', '2023-2024-2', 2, 1);

-- ---------- 2. 考试科目（高一 9 科，高二/高三 4 科） ----------
INSERT IGNORE INTO exam_subjects (exam_id, subject_id, full_score, pass_score, exam_duration)
SELECT e.id, s.id, s.full_score, ROUND(s.full_score * 0.6), IF(s.full_score >= 150, 120, 90)
  FROM exams e
  JOIN subjects s ON s.id BETWEEN 1 AND IF(e.grade = '高一', 9, 4)
 WHERE e.id BETWEEN 4 AND 9;

-- ---------- 3. 生成成绩 ----------
-- 分数由 CRC32(考试, 学生, 学科) 确定性映射到满分 45%~98%，可重复执行且分布自然
INSERT IGNORE INTO exam_scores
  (exam_id, student_id, subject_id, class_id, score, score_level, is_absent, created_at)
SELECT r.exam_id, r.student_id, r.subject_id, r.class_id, r.score,
       CASE
         WHEN r.score / r.full_score >= 0.90 THEN '优秀'
         WHEN r.score / r.full_score >= 0.80 THEN '良好'
         WHEN r.score / r.full_score >= 0.70 THEN '中等'
         WHEN r.score / r.full_score >= 0.60 THEN '及格'
         ELSE '不及格'
       END AS score_level,
       0, NOW()
  FROM (
    SELECT es.exam_id, u.id AS student_id, es.subject_id, u.class_id,
           es.full_score,
           ROUND(es.full_score * (0.45 + 0.53 * (CRC32(CONCAT('sc:', es.exam_id, ':', u.id, ':', es.subject_id)) % 1000) / 1000)) AS score
      FROM exam_subjects es
      JOIN exams   e ON e.id = es.exam_id AND e.id BETWEEN 1 AND 9
      JOIN users   u ON u.role = 'student' AND u.class_id IS NOT NULL
      JOIN classes c ON c.id = u.class_id AND c.grade = e.grade
  ) r;

-- ---------- 4. 重算班级 / 年级排名（并列同名次） ----------
CREATE TEMPORARY TABLE tmp_exam_ranks AS
SELECT id,
       RANK() OVER (PARTITION BY exam_id, subject_id ORDER BY score DESC)             AS rk_grade,
       RANK() OVER (PARTITION BY exam_id, subject_id, class_id ORDER BY score DESC)   AS rk_class
  FROM exam_scores
 WHERE is_absent = 0;

UPDATE exam_scores es
  JOIN tmp_exam_ranks r ON r.id = es.id
   SET es.rank_in_grade = r.rk_grade,
       es.rank_in_class = r.rk_class,
       es.updated_at = NOW();

DROP TEMPORARY TABLE tmp_exam_ranks;