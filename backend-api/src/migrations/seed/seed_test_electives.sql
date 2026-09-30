-- ============================================================
-- seed_test_electives：选修课与选课演示数据
--
-- 内容：8 门选修课，覆盖 人文 / 自然 / 艺术 / 信息 / 语言 / 实践；
--       状态分布 6 门开放（open）、1 门草稿（draft）、1 门已关闭（closed）；
--       部分课程限定年级（EL104 限高一），用于验证年级过滤；
--       为开放/已关闭课程生成学生选课记录，便于演示选课名单与统计。
--
-- 前置：npm run init:db && npm run migrate && npm run seed:core && npm run seed:users
--       （elective_courses / elective_selections 由 V1.0.5 建立）
--
-- 幂等：先按课程名删除本脚本生成的课程（选课记录随外键级联删除）再写入；
--       选课人数按「选课池 + 容量 × 选课比例」确定性抽样，可重复执行。
-- ============================================================

SET @now := NOW();

-- ---------- 1. 清理旧数据 ----------
DELETE FROM elective_courses
 WHERE name IN (
   '中国古典诗词鉴赏', 'Python 数据分析入门', '合唱与指挥基础', '生活中的物理实验',
   '英语口语强化营', '校园摄影与后期', '中国古代史专题', '机器人编程实践'
 );

-- ---------- 2. 写入选修课 ----------
-- teacher_id 取 users 固定 id：2/3/6/7/8/9/10/11 = teacher1~teacher8
-- subject_id 取 subjects 固定 id：1=语文 3=英语 4=物理 7=历史 10=信息技术
-- EL104 限定年级「高一」（classes 中年级字典序最小的年级），用于验证年级过滤
INSERT INTO elective_courses
  (code, name, description, category, teacher_id, subject_id, semester, grade,
   capacity, credit, location, schedule_text, select_start, select_end, status,
   created_by, created_at, updated_at)
VALUES
  ('EL101', '中国古典诗词鉴赏',
   '精选唐宋诗词名篇，从意象、格律与情感三个维度解读古典诗词之美，提升人文素养与审美能力。',
   '人文社科', 2, 1, '2024-2025-1', NULL,
   60, 2.0, '文科楼 201', '周三第5-6节',
   @now - INTERVAL 5 DAY, @now + INTERVAL 20 DAY, 'open', 1, NOW(), NOW()),

  ('EL102', 'Python 数据分析入门',
   '零基础学习 Python 与 pandas、matplotlib，掌握数据清洗、统计分析与可视化，完成一个小型数据分析项目。',
   '信息技术', 3, 10, '2024-2025-1', NULL,
   40, 2.0, '机房 A305', '周四第7-8节',
   @now - INTERVAL 3 DAY, @now + INTERVAL 25 DAY, 'open', 1, NOW(), NOW()),

  ('EL103', '合唱与指挥基础',
   '学习合唱发声、声部配合与基础指挥手势，课程结束举办小型汇报演出，欢迎零基础同学加入。',
   '艺术体育', 6, NULL, '2024-2025-1', NULL,
   50, 1.5, '艺术楼音乐厅', '周二第9-10节',
   @now - INTERVAL 2 DAY, @now + INTERVAL 30 DAY, 'open', 1, NOW(), NOW()),

  ('EL104', '生活中的物理实验',
   '用身边的材料完成趣味物理实验，理解力学、光学与电磁学原理，培养动手能力与科学思维。',
   '自然科学', 7, 4, '2024-2025-1', '高一',
   35, 2.0, '实验楼 B102', '周五第5-6节',
   @now - INTERVAL 1 DAY, @now + INTERVAL 28 DAY, 'open', 1, NOW(), NOW()),

  ('EL105', '英语口语强化营',
   '小班全英文互动，围绕校园生活、社会热点等主题开展情景对话与演讲训练，快速提升口语表达。',
   '语言文化', 8, 3, '2024-2025-1', NULL,
   30, 2.0, '外语楼 108', '周一第9-10节',
   @now - INTERVAL 4 DAY, @now + INTERVAL 15 DAY, 'open', 1, NOW(), NOW()),

  ('EL106', '校园摄影与后期',
   '讲授构图、用光与相机操作，并结合 Lightroom 完成照片后期调色，课程产出个人摄影作品集。',
   '实践技能', 9, NULL, '2024-2025-1', NULL,
   25, 1.5, '艺术楼 305', '周六第1-2节',
   @now - INTERVAL 6 DAY, @now + INTERVAL 22 DAY, 'open', 1, NOW(), NOW()),

  ('EL107', '中国古代史专题',
   '围绕制度变迁、社会结构与文化交流三个专题，深入理解中国古代历史的脉络与逻辑。',
   '人文社科', 10, 7, '2024-2025-1', NULL,
   45, 2.0, '文科楼 305', '周三第9-10节',
   NULL, NULL, 'draft', 1, NOW(), NOW()),

  ('EL108', '机器人编程实践',
   '基于开源硬件完成循迹、避障等机器人项目，学习传感器与嵌入式编程，课程已结束。',
   '信息技术', 11, 10, '2024-2025-1', NULL,
   20, 2.0, '创客空间', '周五第9-10节',
   @now - INTERVAL 30 DAY, @now - INTERVAL 5 DAY, 'closed', 1, NOW(), NOW());

-- ---------- 3. 写入选课记录 ----------
-- 抽样规则与旧脚本一致（仅 open / closed 课程参与，draft 不生成）：
--   pool   = 全部学生；若课程限定年级，则仅取该年级学生
--   target = min(round(容量 × 选课比例), pool 人数)
--   step   = max(1, floor(pool 人数 / target))
--   取 pool（按 id 升序）第 0、step、2×step … 位，共 target 人
-- 选课时间 = 当前时间前 (i%6) 天
INSERT INTO elective_selections (course_id, student_id, status, selected_at)
SELECT s.course_id, s.user_id, 'selected',
       @now - INTERVAL (((s.rn - 1) DIV s.step) % 6) DAY
  FROM (
    SELECT b.course_id, b.user_id, b.rn, b.step, b.target,
           (b.rn - 1) DIV b.step AS idx
      FROM (
        SELECT ec.id AS course_id, u.id AS user_id,
               ROW_NUMBER() OVER (PARTITION BY ec.id ORDER BY u.id) AS rn,
               LEAST(ROUND(ec.capacity * sp.ratio), COUNT(*) OVER (PARTITION BY ec.id)) AS target,
               GREATEST(1, FLOOR(COUNT(*) OVER (PARTITION BY ec.id)
                          / LEAST(ROUND(ec.capacity * sp.ratio), COUNT(*) OVER (PARTITION BY ec.id)))) AS step
          FROM elective_courses ec
          JOIN (
            SELECT 'EL101' AS code, 0.75 AS ratio
            UNION ALL SELECT 'EL102', 0.95
            UNION ALL SELECT 'EL103', 0.60
            UNION ALL SELECT 'EL104', 0.80
            UNION ALL SELECT 'EL105', 1.00
            UNION ALL SELECT 'EL106', 0.85
            UNION ALL SELECT 'EL108', 1.00
          ) sp ON sp.code = ec.code
          JOIN users u ON u.role = 'student'
                      AND (ec.grade IS NULL
                           OR u.class_id IN (SELECT id FROM classes WHERE grade = ec.grade))
         WHERE ec.code IN ('EL101', 'EL102', 'EL103', 'EL104', 'EL105', 'EL106', 'EL108')
      ) b
  ) s
 WHERE MOD(s.rn - 1, s.step) = 0
   AND s.idx < s.target;