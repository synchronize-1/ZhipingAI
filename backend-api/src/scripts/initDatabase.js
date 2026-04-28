const mysql = require('mysql2/promise');
require('dotenv').config();

const initDatabase = async () => {
  const dbName = process.env.DB_NAME || 'smart_campus';
  
  console.log('🚀 开始初始化数据库...');

  // 先连接到MySQL服务器（不指定数据库）创建数据库
  const tempConnection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456'
  });

  // 创建数据库
  await tempConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await tempConnection.end();

  // 重新连接到指定数据库
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: dbName
  });

  // 创建用户表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      role ENUM('student', 'teacher', 'admin') NOT NULL,
      email VARCHAR(100),
      phone VARCHAR(20),
      avatar VARCHAR(255),
      department VARCHAR(100),
      student_id VARCHAR(50),
      employee_id VARCHAR(50),
      preferences JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // 创建课程表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS courses (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50),
      teacher_id INT,
      teacher_name VARCHAR(100),
      credits DECIMAL(3,1),
      description TEXT,
      location VARCHAR(100),
      semester VARCHAR(20),
      max_students INT DEFAULT 50,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    )
  `);

  // 创建教室表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(50) NOT NULL,
      building VARCHAR(50) NOT NULL,
      floor INT,
      capacity INT DEFAULT 50,
      type ENUM('classroom', 'lab', 'meeting', 'lecture_hall') DEFAULT 'classroom',
      facilities JSON,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      radius INT DEFAULT 50,
      status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建课程安排表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INT PRIMARY KEY AUTO_INCREMENT,
      course_id INT NOT NULL,
      user_id INT NOT NULL,
      room_id INT,
      day_of_week TINYINT NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      week_num INT,
      semester VARCHAR(20),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )
  `);

  // 创建学生选课表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS student_courses (
      id INT PRIMARY KEY AUTO_INCREMENT,
      student_id INT NOT NULL,
      course_id INT NOT NULL,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status ENUM('enrolled', 'dropped', 'completed') DEFAULT 'enrolled',
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id),
      UNIQUE KEY unique_enrollment (student_id, course_id)
    )
  `);

  // 创建考勤表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS attendances (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      course_id INT NOT NULL,
      schedule_id INT,
      check_in_time DATETIME NOT NULL,
      method ENUM('manual', 'auto', 'qrcode', 'face') DEFAULT 'manual',
      location JSON,
      status ENUM('present', 'late', 'absent', 'excused') DEFAULT 'present',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (schedule_id) REFERENCES schedules(id)
    )
  `);

  // 创建报修表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS repairs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      location VARCHAR(200),
      category ENUM('electrical', 'plumbing', 'furniture', 'network', 'other') DEFAULT 'other',
      images JSON,
      urgency ENUM('low', 'medium', 'high') DEFAULT 'medium',
      status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
      handler_id INT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (handler_id) REFERENCES users(id)
    )
  `);

  // 创建图书表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS books (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(200) NOT NULL,
      author VARCHAR(100),
      isbn VARCHAR(20),
      publisher VARCHAR(100),
      category VARCHAR(50),
      description TEXT,
      cover_image VARCHAR(255),
      total_count INT DEFAULT 1,
      available_count INT DEFAULT 1,
      location VARCHAR(100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建图书借阅表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS book_borrowings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      book_id INT NOT NULL,
      borrowed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date DATE NOT NULL,
      returned_at DATETIME,
      status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    )
  `);

  // 创建设备表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS equipments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      category VARCHAR(50),
      description TEXT,
      location VARCHAR(100),
      status ENUM('available', 'reserved', 'maintenance') DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建设备预约表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS equipment_reservations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      equipment_id INT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      purpose TEXT,
      status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (equipment_id) REFERENCES equipments(id)
    )
  `);

  // 创建食堂表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS canteens (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      location VARCHAR(200),
      capacity INT DEFAULT 500,
      open_time TIME,
      close_time TIME,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建食堂人流记录表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS canteen_crowd_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      canteen_id INT NOT NULL,
      current_count INT DEFAULT 0,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (canteen_id) REFERENCES canteens(id)
    )
  `);

  // 创建菜单表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INT PRIMARY KEY AUTO_INCREMENT,
      canteen_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      category VARCHAR(50),
      description TEXT,
      image VARCHAR(255),
      is_available BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (canteen_id) REFERENCES canteens(id)
    )
  `);

  // 创建订单表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS food_orders (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      canteen_id INT NOT NULL,
      items JSON NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL,
      pickup_time DATETIME,
      status ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (canteen_id) REFERENCES canteens(id)
    )
  `);

  // 创建活动表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS activities (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      category VARCHAR(50),
      location VARCHAR(200),
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      max_participants INT,
      organizer_id INT NOT NULL,
      images JSON,
      status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organizer_id) REFERENCES users(id)
    )
  `);

  // 创建活动参与者表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS activity_participants (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      activity_id INT NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status ENUM('joined', 'cancelled', 'attended') DEFAULT 'joined',
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (activity_id) REFERENCES activities(id),
      UNIQUE KEY unique_participation (user_id, activity_id)
    )
  `);

  // 创建兴趣小组表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS interest_groups (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      category VARCHAR(50),
      creator_id INT NOT NULL,
      avatar VARCHAR(255),
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  // 创建小组成员表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS group_members (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      group_id INT NOT NULL,
      role ENUM('creator', 'admin', 'member') DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (group_id) REFERENCES interest_groups(id),
      UNIQUE KEY unique_membership (user_id, group_id)
    )
  `);

  // 创建通知表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      type ENUM('system', 'course', 'activity', 'service', 'emergency') DEFAULT 'system',
      target_role VARCHAR(20),
      user_id INT,
      created_by INT,
      is_read BOOLEAN DEFAULT FALSE,
      read_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 创建紧急通知表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS emergency_notices (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      level ENUM('info', 'warning', 'critical') DEFAULT 'info',
      target_roles JSON,
      created_by INT NOT NULL,
      status ENUM('active', 'expired') DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 创建建筑表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS buildings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(20),
      floors INT,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建门禁日志表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS access_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      building_id INT NOT NULL,
      access_type ENUM('entry', 'exit') NOT NULL,
      method ENUM('card', 'face', 'qrcode') DEFAULT 'card',
      access_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (building_id) REFERENCES buildings(id)
    )
  `);

  // 创建学生成绩表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS grades (
      id INT PRIMARY KEY AUTO_INCREMENT,
      student_id INT NOT NULL,
      course_id INT NOT NULL,
      score DECIMAL(5, 2),
      grade_point DECIMAL(3, 2),
      semester VARCHAR(20),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id)
    )
  `);

  // 创建学生技能表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS student_skills (
      id INT PRIMARY KEY AUTO_INCREMENT,
      student_id INT NOT NULL,
      skill_name VARCHAR(100) NOT NULL,
      level INT DEFAULT 1,
      verified_at DATETIME,
      FOREIGN KEY (student_id) REFERENCES users(id)
    )
  `);

  // 创建学生荣誉表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS student_honors (
      id INT PRIMARY KEY AUTO_INCREMENT,
      student_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      level ENUM('school', 'city', 'province', 'national', 'international') DEFAULT 'school',
      awarded_at DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id)
    )
  `);

  // 创建心理健康记录表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS mental_health_records (
      id INT PRIMARY KEY AUTO_INCREMENT,
      student_id INT NOT NULL,
      assessment_date DATE NOT NULL,
      overall_score INT,
      stress_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id)
    )
  `);

  // 创建节日表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS festivals (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      month INT NOT NULL,
      day INT NOT NULL,
      greeting TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建绿色提示表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS green_tips (
      id INT PRIMARY KEY AUTO_INCREMENT,
      content TEXT NOT NULL,
      category VARCHAR(50),
      priority INT DEFAULT 1,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建课前提醒设置表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS reminder_settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT UNIQUE NOT NULL,
      enabled BOOLEAN DEFAULT TRUE,
      minutes_before INT DEFAULT 10,
      location_enabled BOOLEAN DEFAULT TRUE,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 创建学习资源表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS learning_resources (
      id INT PRIMARY KEY AUTO_INCREMENT,
      course_id INT,
      title VARCHAR(200) NOT NULL,
      type ENUM('video', 'document', 'link', 'quiz') DEFAULT 'document',
      url VARCHAR(500),
      description TEXT,
      views INT DEFAULT 0,
      rating DECIMAL(3, 2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id)
    )
  `);

  // 创建教室使用安排表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS room_schedules (
      id INT PRIMARY KEY AUTO_INCREMENT,
      room_id INT NOT NULL,
      date DATE NOT NULL,
      time_slot INT NOT NULL,
      course_name VARCHAR(100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      UNIQUE KEY unique_room_schedule (room_id, date, time_slot)
    )
  `);

  // 创建教室预约表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS room_reservations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      room_id INT NOT NULL,
      user_id INT NOT NULL,
      date DATE NOT NULL,
      time_slot INT NOT NULL,
      purpose TEXT,
      status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 插入测试数据
  console.log('📝 插入测试数据...');

  // 插入管理员账号
  const bcrypt = require('bcryptjs');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  await connection.execute(`
    INSERT IGNORE INTO users (username, password, name, role, email, department) VALUES
    ('admin', ?, '系统管理员', 'admin', 'admin@campus.edu', '信息中心'),
    ('teacher1', ?, '张教授', 'teacher', 'teacher1@campus.edu', '计算机学院'),
    ('teacher2', ?, '李教授', 'teacher', 'teacher2@campus.edu', '数学学院'),
    ('student1', ?, '王小明', 'student', 'student1@campus.edu', '计算机学院'),
    ('student2', ?, '李小红', 'student', 'student2@campus.edu', '计算机学院')
  `, [adminPassword, teacherPassword, teacherPassword, studentPassword, studentPassword]);

  // 插入建筑数据
  await connection.execute(`
    INSERT IGNORE INTO buildings (id, name, code, floors, latitude, longitude) VALUES
    (1, '教学楼A', 'TA', 6, 31.2304, 121.4737),
    (2, '教学楼B', 'TB', 5, 31.2310, 121.4742),
    (3, '图书馆', 'LIB', 4, 31.2308, 121.4730),
    (4, '实验楼', 'LAB', 3, 31.2315, 121.4745)
  `);

  // 插入教室数据
  await connection.execute(`
    INSERT IGNORE INTO rooms (id, name, building, floor, capacity, type, latitude, longitude) VALUES
    (1, 'A101', '教学楼A', 1, 60, 'classroom', 31.2304, 121.4737),
    (2, 'A102', '教学楼A', 1, 60, 'classroom', 31.2304, 121.4738),
    (3, 'A201', '教学楼A', 2, 80, 'lecture_hall', 31.2305, 121.4737),
    (4, 'B101', '教学楼B', 1, 40, 'classroom', 31.2310, 121.4742),
    (5, 'LAB101', '实验楼', 1, 30, 'lab', 31.2315, 121.4745)
  `);

  // 插入课程数据
  await connection.execute(`
    INSERT IGNORE INTO courses (id, name, code, teacher_id, teacher_name, credits, semester) VALUES
    (1, '数据结构与算法', 'CS201', 2, '张教授', 4.0, '2024-1'),
    (2, '高等数学', 'MATH101', 3, '李教授', 5.0, '2024-1'),
    (3, '计算机网络', 'CS301', 2, '张教授', 3.0, '2024-1')
  `);

  // 插入食堂数据
  await connection.execute(`
    INSERT IGNORE INTO canteens (id, name, location, capacity, open_time, close_time) VALUES
    (1, '第一食堂', '生活区A栋', 800, '06:30:00', '21:00:00'),
    (2, '第二食堂', '生活区B栋', 600, '07:00:00', '20:30:00'),
    (3, '教工食堂', '行政楼1楼', 200, '11:00:00', '13:00:00')
  `);

  // 插入食堂人流数据
  await connection.execute(`
    INSERT IGNORE INTO canteen_crowd_logs (canteen_id, current_count, recorded_at) VALUES
    (1, 320, NOW()),
    (2, 180, NOW()),
    (3, 45, NOW())
  `);

  // 插入菜单数据
  await connection.execute(`
    INSERT IGNORE INTO menu_items (canteen_id, name, price, category, is_available) VALUES
    (1, '红烧肉套餐', 15.00, '荤菜', TRUE),
    (1, '番茄炒蛋', 8.00, '素菜', TRUE),
    (1, '酸辣土豆丝', 6.00, '素菜', TRUE),
    (2, '麻辣香锅', 18.00, '特色', TRUE),
    (2, '牛肉面', 12.00, '面食', TRUE)
  `);

  // 插入节日数据
  await connection.execute(`
    INSERT IGNORE INTO festivals (name, month, day, greeting) VALUES
    ('元旦', 1, 1, '新年快乐！愿新的一年学业进步！'),
    ('教师节', 9, 10, '教师节快乐！感谢老师们的辛勤付出！'),
    ('国庆节', 10, 1, '祝祖国繁荣昌盛！国庆快乐！'),
    ('中秋节', 9, 17, '中秋快乐！月圆人团圆！')
  `);

  // 插入绿色提示数据
  await connection.execute(`
    INSERT IGNORE INTO green_tips (content, category, priority) VALUES
    ('随手关灯，节约用电，共建绿色校园', '节能', 1),
    ('双面打印，节约用纸，保护森林资源', '环保', 1),
    ('空调温度设置26度，舒适又省电', '节能', 2),
    ('使用公共交通或骑行，减少碳排放', '低碳', 2),
    ('垃圾分类，从我做起，美化校园环境', '环保', 1)
  `);

  // 插入活动数据
  await connection.execute(`
    INSERT IGNORE INTO activities (id, title, description, category, location, start_time, end_time, max_participants, organizer_id, status) VALUES
    (1, '校园歌手大赛', '展示你的歌喉，赢取丰厚奖品！', '文艺', '大礼堂', DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY), 50, 1, 'upcoming'),
    (2, '编程马拉松', '48小时极限编程挑战', '学术', '创新实验室', DATE_ADD(NOW(), INTERVAL 14 DAY), DATE_ADD(NOW(), INTERVAL 16 DAY), 100, 2, 'upcoming'),
    (3, '志愿者招募', '社区服务志愿者招募活动', '公益', '学生活动中心', DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY), 30, 1, 'upcoming')
  `);

  // 插入兴趣小组数据
  await connection.execute(`
    INSERT IGNORE INTO interest_groups (id, name, description, category, creator_id) VALUES
    (1, '算法研究社', '探索算法的奥秘，提升编程能力', '学术', 2),
    (2, '摄影爱好者', '用镜头记录校园美好时光', '艺术', 4),
    (3, '篮球俱乐部', '热爱篮球，强身健体', '体育', 5)
  `);

  console.log('✅ 数据库初始化完成！');
  console.log('');
  console.log('📋 测试账号：');
  console.log('   管理员: admin / admin123');
  console.log('   教师: teacher1 / teacher123');
  console.log('   学生: student1 / student123');

  await connection.end();
};

initDatabase().catch(console.error);
