-- ============================================================
-- seed_test_users：测试账号
--
-- 内容：8 位教师（teacher1~teacher8，工号 T2024001~T2024008）
--       + 50 位学生（student1/student2 保留原用户名，其余用户名 = 学号 2024XXNN）
--       统一密码 123456
--
-- 前置：npm run init:db && npm run migrate && npm run seed:core
--       （students 的 class_id 依赖 seed_core_data 建立的 classes 记录）
--
-- 幂等：以 username（唯一键）为准 ON DUPLICATE KEY UPDATE，
--       重复执行只补齐/刷新账号，不会产生重复行。
-- ============================================================

-- bcrypt('123456', 10)，避免运行时依赖 bcryptjs
SET @test_pwd := '$2a$10$aN/An1xJMFXC3vSJD5d3Zu48turzedYCUPW8TMY3aPaxUHKPFet.y';

-- ---------- 1. 教师账号 ----------
INSERT INTO users (username, password, name, role, department, employee_id, status, created_at)
VALUES
  ('teacher1', @test_pwd, '张教授', 'teacher', '语文组', 'T2024001', 1, NOW()),
  ('teacher2', @test_pwd, '李教授', 'teacher', '数学组', 'T2024002', 1, NOW()),
  ('teacher3', @test_pwd, '王老师', 'teacher', '英语组', 'T2024003', 1, NOW()),
  ('teacher4', @test_pwd, '赵老师', 'teacher', '物理组', 'T2024004', 1, NOW()),
  ('teacher5', @test_pwd, '陈老师', 'teacher', '化学组', 'T2024005', 1, NOW()),
  ('teacher6', @test_pwd, '刘老师', 'teacher', '生物组', 'T2024006', 1, NOW()),
  ('teacher7', @test_pwd, '孙老师', 'teacher', '历史组', 'T2024007', 1, NOW()),
  ('teacher8', @test_pwd, '周老师', 'teacher', '体育组', 'T2024008', 1, NOW())
AS new
ON DUPLICATE KEY UPDATE
  password    = new.password,
  name        = new.name,
  role        = new.role,
  department  = new.department,
  employee_id = new.employee_id,
  status      = 1,
  updated_at  = NOW();

-- ---------- 2. 学生账号 ----------
INSERT INTO users (username, password, name, role, class_id, student_id, status, created_at)
VALUES
  -- 高一(1)班：student1 / student2 沿用旧用户名，其余 8 人
  ('student1', @test_pwd, '王小明', 'student', 1, '20240101', 1, NOW()),
  ('student2', @test_pwd, '李小红', 'student', 1, '20240102', 1, NOW()),
  ('20240103', @test_pwd, '徐雨桐', 'student', 1, '20240103', 1, NOW()),
  ('20240104', @test_pwd, '孙雅静', 'student', 1, '20240104', 1, NOW()),
  ('20240105', @test_pwd, '马博文', 'student', 1, '20240105', 1, NOW()),
  ('20240106', @test_pwd, '朱静怡', 'student', 1, '20240106', 1, NOW()),
  ('20240107', @test_pwd, '胡子豪', 'student', 1, '20240107', 1, NOW()),
  ('20240108', @test_pwd, '郭嘉怡', 'student', 1, '20240108', 1, NOW()),
  ('20240109', @test_pwd, '何志强', 'student', 1, '20240109', 1, NOW()),
  ('20240110', @test_pwd, '高浩然', 'student', 1, '20240110', 1, NOW()),
  -- 高一(2)班
  ('20240201', @test_pwd, '郭嘉豪', 'student', 2, '20240201', 1, NOW()),
  ('20240202', @test_pwd, '何晨曦', 'student', 2, '20240202', 1, NOW()),
  ('20240203', @test_pwd, '高梦琪', 'student', 2, '20240203', 1, NOW()),
  ('20240204', @test_pwd, '林天佑', 'student', 2, '20240204', 1, NOW()),
  ('20240205', @test_pwd, '罗紫萱', 'student', 2, '20240205', 1, NOW()),
  ('20240206', @test_pwd, '郑昊天', 'student', 2, '20240206', 1, NOW()),
  ('20240207', @test_pwd, '梁小红', 'student', 2, '20240207', 1, NOW()),
  ('20240208', @test_pwd, '谢雨欣', 'student', 2, '20240208', 1, NOW()),
  ('20240209', @test_pwd, '宋佳怡', 'student', 2, '20240209', 1, NOW()),
  ('20240210', @test_pwd, '唐梓萱', 'student', 2, '20240210', 1, NOW()),
  -- 高二(1)班
  ('20240301', @test_pwd, '谢一鸣', 'student', 3, '20240301', 1, NOW()),
  ('20240302', @test_pwd, '宋若曦', 'student', 3, '20240302', 1, NOW()),
  ('20240303', @test_pwd, '唐明轩', 'student', 3, '20240303', 1, NOW()),
  ('20240304', @test_pwd, '许悦心', 'student', 3, '20240304', 1, NOW()),
  ('20240305', @test_pwd, '韩小明', 'student', 3, '20240305', 1, NOW()),
  ('20240306', @test_pwd, '冯思远', 'student', 3, '20240306', 1, NOW()),
  ('20240307', @test_pwd, '邓子涵', 'student', 3, '20240307', 1, NOW()),
  ('20240308', @test_pwd, '曹欣怡', 'student', 3, '20240308', 1, NOW()),
  ('20240309', @test_pwd, '王诗涵', 'student', 3, '20240309', 1, NOW()),
  ('20240310', @test_pwd, '李泽宇', 'student', 3, '20240310', 1, NOW()),
  -- 高二(2)班
  ('20240401', @test_pwd, '曹静怡', 'student', 4, '20240401', 1, NOW()),
  ('20240402', @test_pwd, '王子豪', 'student', 4, '20240402', 1, NOW()),
  ('20240403', @test_pwd, '李嘉怡', 'student', 4, '20240403', 1, NOW()),
  ('20240404', @test_pwd, '张志强', 'student', 4, '20240404', 1, NOW()),
  ('20240405', @test_pwd, '刘浩然', 'student', 4, '20240405', 1, NOW()),
  ('20240406', @test_pwd, '陈宇航', 'student', 4, '20240406', 1, NOW()),
  ('20240407', @test_pwd, '杨俊杰', 'student', 4, '20240407', 1, NOW()),
  ('20240408', @test_pwd, '赵雨桐', 'student', 4, '20240408', 1, NOW()),
  ('20240409', @test_pwd, '黄雅静', 'student', 4, '20240409', 1, NOW()),
  ('20240410', @test_pwd, '周博文', 'student', 4, '20240410', 1, NOW()),
  -- 高三(1)班
  ('20240501', @test_pwd, '赵昊天', 'student', 5, '20240501', 1, NOW()),
  ('20240502', @test_pwd, '黄小红', 'student', 5, '20240502', 1, NOW()),
  ('20240503', @test_pwd, '周雨欣', 'student', 5, '20240503', 1, NOW()),
  ('20240504', @test_pwd, '吴佳怡', 'student', 5, '20240504', 1, NOW()),
  ('20240505', @test_pwd, '徐梓萱', 'student', 5, '20240505', 1, NOW()),
  ('20240506', @test_pwd, '孙嘉豪', 'student', 5, '20240506', 1, NOW()),
  ('20240507', @test_pwd, '马晨曦', 'student', 5, '20240507', 1, NOW()),
  ('20240508', @test_pwd, '朱梦琪', 'student', 5, '20240508', 1, NOW()),
  ('20240509', @test_pwd, '胡天佑', 'student', 5, '20240509', 1, NOW()),
  ('20240510', @test_pwd, '郭紫萱', 'student', 5, '20240510', 1, NOW())
AS new
ON DUPLICATE KEY UPDATE
  password   = new.password,
  name       = new.name,
  role       = 'student',
  class_id   = new.class_id,
  student_id = new.student_id,
  status     = 1,
  updated_at = NOW();

-- ---------- 3. 同步班级学生人数 ----------
UPDATE classes c
  LEFT JOIN (
    SELECT class_id, COUNT(*) AS cnt
      FROM users
     WHERE role = 'student' AND class_id IS NOT NULL
     GROUP BY class_id
  ) t ON t.class_id = c.id
   SET c.student_count = COALESCE(t.cnt, 0),
       c.updated_at = NOW()
 WHERE c.id BETWEEN 1 AND 5;