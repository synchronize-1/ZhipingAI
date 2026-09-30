-- ============================================================
-- seed_test_activities：活动与报名演示数据
--
-- 内容：8 场活动，覆盖 文艺 / 学术 / 体育 / 公益 / 社团 / 就业，
--       时间分布含 已结束 / 进行中 / 报名中；
--       并为每场活动按比例生成学生报名记录（部分已签到）。
--
-- 前置：npm run init:db && npm run migrate && npm run seed:core && npm run seed:users
--       （activities 表由 initDatabase 建立，cover / updated_at 由 V1.0.4 补齐）
--
-- 幂等：先按标题删除本脚本生成的活动（报名记录随外键级联删除）再写入；
--       报名人数按「学生总数 + 活动容量 × 报名比例」确定性抽样，可重复执行。
-- ============================================================

SET @now := NOW();
SET @student_count := (SELECT COUNT(*) FROM users WHERE role = 'student');

-- ---------- 1. 清理旧数据 ----------
DELETE FROM activities
 WHERE title IN (
   '校园文化艺术节开幕演出',
   '人工智能前沿技术讲座',
   '秋季校园马拉松挑战赛',
   '社区志愿服务招募',
   '摄影社年度作品展',
   '秋季校园招聘会',
   '篮球联赛总决赛',
   '英语角：跨文化交流'
 );

-- ---------- 2. 写入活动 ----------
-- organizer_id 取 users 固定 id：1=admin，2/3/6/7/8/9=teacher1~teacher6
-- cover 由固定 prompt 生成，空格转义为 %20
INSERT INTO activities
  (title, description, category, location, start_time, end_time,
   max_participants, organizer_id, images, cover, status, created_at, updated_at)
VALUES
  ('校园文化艺术节开幕演出',
   '一年一度的校园文化艺术节开幕演出，汇聚校内外优秀文艺团队，节目涵盖民乐、交响、舞蹈、话剧等多种形式，欢迎全校师生到场观看。',
   '文艺', '大学生活动中心大礼堂',
   @now + INTERVAL '5 19' DAY_HOUR, @now + INTERVAL '5 21:30' DAY_MINUTE,
   500, 1, NULL,
   CONCAT('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=',
          REPLACE('Campus art festival opening performance, colorful stage lights, students performing music and dance, vibrant joyful atmosphere, photorealistic', ' ', '%20'),
          '&image_size=landscape_4_3'),
   'upcoming', NOW(), NOW()),

  ('人工智能前沿技术讲座',
   '邀请高校与业界专家分享人工智能最新研究进展，涵盖大语言模型、多模态学习、具身智能等前沿话题，参与者可获得学术活动学分。',
   '学术', '图书馆报告厅',
   @now + INTERVAL '3 14' DAY_HOUR, @now + INTERVAL '3 16' DAY_HOUR,
   200, 2, NULL,
   CONCAT('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=',
          REPLACE('University academic lecture hall, professor presenting artificial intelligence slides on stage, students listening attentively, modern auditorium, photorealistic', ' ', '%20'),
          '&image_size=landscape_4_3'),
   'upcoming', NOW(), NOW()),

  ('秋季校园马拉松挑战赛',
   '秋季校园马拉松设有 5 公里、10 公里两个组别，完赛可获得纪念奖牌，各组别前 20 名另有奖品。请提前做好热身准备。',
   '体育', '校园环形跑道',
   @now + INTERVAL '8 8' DAY_HOUR, @now + INTERVAL '8 12' DAY_HOUR,
   300, 3, NULL,
   CONCAT('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=',
          REPLACE('Campus marathon race, college students running on outdoor track, autumn sunny day, energetic sporty atmosphere, photorealistic', ' ', '%20'),
          '&image_size=landscape_4_3'),
   'upcoming', NOW(), NOW()),

  ('社区志愿服务招募',
   '走进周边社区开展敬老助残、环境美化等志愿服务，提供往返交通与午餐补贴。要求有责任心、有耐心，能服从统一安排。',
   '公益', '校门口集合出发',
   @now + INTERVAL '10 9' DAY_HOUR, @now + INTERVAL '10 14' DAY_HOUR,
   40, 6, NULL,
   CONCAT('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=',
          REPLACE('College student volunteers doing community service, helping elderly people, warm friendly atmosphere, daytime, photorealistic', ' ', '%20'),
          '&image_size=landscape_4_3'),
   'upcoming', NOW(), NOW()),

  ('摄影社年度作品展',
   '展出摄影社社员一年来的优秀作品，涵盖风光、人文、纪实等题材。现场设有互动体验区，可与摄影师面对面交流拍摄技巧。',
   '社团', '艺术楼展览厅',
   @now + INTERVAL '2 10' DAY_HOUR, @now + INTERVAL '9 10' DAY_HOUR,
   1000, 7, NULL,
   CONCAT('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=',
          REPLACE('University photography club exhibition, students viewing framed photos in bright art gallery, photorealistic', ' ', '%20'),
          '&image_size=landscape_4_3'),
   'upcoming', NOW(), NOW()),

  ('秋季校园招聘会',
   '汇聚 200 余家优质企业，提供数千个就业与实习岗位，覆盖互联网、金融、制造、教育等行业。请携带简历并着正装参加。',
   '就业', '体育馆',
   @now + INTERVAL '12 9' DAY_HOUR, @now + INTERVAL '12 17' DAY_HOUR,
   2000, 1, NULL,
   CONCAT('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=',
          REPLACE('University job fair in gymnasium, students talking with company recruiters at booths, busy professional atmosphere, photorealistic', ' ', '%20'),
          '&image_size=landscape_4_3'),
   'upcoming', NOW(), NOW()),

  ('篮球联赛总决赛',
   '本赛季篮球联赛巅峰对决，两支劲旅争夺总冠军。现场设置抽奖与互动环节，欢迎到场为球员加油助威。',
   '体育', '体育馆主馆',
   @now - INTERVAL 2 HOUR, @now + INTERVAL 2 HOUR,
   800, 8, NULL,
   CONCAT('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=',
          REPLACE('University basketball league final game, packed gymnasium, players competing on court, cheering crowd, photorealistic', ' ', '%20'),
          '&image_size=landscape_4_3'),
   'upcoming', NOW(), NOW()),

  ('英语角：跨文化交流',
   '与留学生面对面交流，了解不同国家的文化习俗与校园生活，全程英语交流，帮助提升口语表达与跨文化沟通能力。',
   '学术', '外语楼一层咖啡厅',
   @now - INTERVAL '6 02' DAY_HOUR, @now - INTERVAL 6 DAY,
   50, 9, NULL,
   CONCAT('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=',
          REPLACE('International students English corner gathering in a cozy campus cafe, people chatting and laughing, warm indoor light, photorealistic', ' ', '%20'),
          '&image_size=landscape_4_3'),
   'upcoming', NOW(), NOW());

-- ---------- 3. 写入报名记录 ----------
-- 抽样规则与旧脚本一致：
--   target = min(round(容量 × 报名比例), 学生总数)
--   step   = max(1, floor(学生总数 / target))
--   取学生（按 id 升序）第 0、step、2×step … 位，共 target 人
--   前 round(picked × 签到比例) 人标记为 checked_in
-- 报名时间 = 活动开始前 (3 + i%5) 天；签到时间 = 活动开始后 (i%20) 分钟
INSERT INTO activity_registrations (activity_id, user_id, status, registered_at, checked_in_at)
SELECT s.activity_id, s.user_id,
       IF(s.idx < s.checkin_count, 'checked_in', 'registered'),
       s.start_time - INTERVAL (3 + (s.idx % 5)) DAY,
       IF(s.idx < s.checkin_count, s.start_time + INTERVAL (s.idx % 20) MINUTE, NULL)
  FROM (
    SELECT b.activity_id, b.user_id, b.start_time, b.rn, b.step, b.target,
           (b.rn - 1) DIV b.step AS idx,
           ROUND(LEAST(b.target, CEIL(@student_count / b.step)) * b.checkin_ratio) AS checkin_count
      FROM (
        SELECT a.id AS activity_id, a.start_time, u.id AS user_id,
               ROW_NUMBER() OVER (PARTITION BY a.id ORDER BY u.id) AS rn,
               sp.checkin_ratio,
               LEAST(ROUND(a.max_participants * sp.register_ratio), @student_count) AS target,
               GREATEST(1, FLOOR(@student_count / LEAST(ROUND(a.max_participants * sp.register_ratio), @student_count))) AS step
          FROM activities a
          JOIN (
            SELECT '校园文化艺术节开幕演出' AS title, 0.70 AS register_ratio, 0.00 AS checkin_ratio
            UNION ALL SELECT '人工智能前沿技术讲座', 0.75, 0.00
            UNION ALL SELECT '秋季校园马拉松挑战赛', 0.60, 0.00
            UNION ALL SELECT '社区志愿服务招募',   0.50, 0.00
            UNION ALL SELECT '摄影社年度作品展',   0.40, 0.00
            UNION ALL SELECT '秋季校园招聘会',     0.55, 0.00
            UNION ALL SELECT '篮球联赛总决赛',     0.90, 0.70
            UNION ALL SELECT '英语角：跨文化交流', 1.00, 0.90
          ) sp ON sp.title = a.title
          JOIN users u ON u.role = 'student'
         WHERE a.title IN (
           '校园文化艺术节开幕演出', '人工智能前沿技术讲座', '秋季校园马拉松挑战赛',
           '社区志愿服务招募', '摄影社年度作品展', '秋季校园招聘会',
           '篮球联赛总决赛', '英语角：跨文化交流'
         )
      ) b
  ) s
 WHERE MOD(s.rn - 1, s.step) = 0
   AND s.idx < s.target;