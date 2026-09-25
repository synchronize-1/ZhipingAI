/**
 * V1.0.0 初始化核心表迁移
 *
 * 创建 P0 核心模块所需的所有数据表：
 * - classes: 班级表
 * - subjects: 学科表
 * - exams: 考试表
 * - exam_subjects: 考试科目关联表
 * - exam_scores: 考试成绩表
 * - class_subject_teachers: 班级学科教师关联表
 * - portfolio_skills: 学生技能表（成长档案）
 * - portfolio_honors: 学生荣誉表（成长档案）
 * - portfolio_mental_health: 心理健康记录表（成长档案）
 * - portfolio_comments: 学生评语表（AI评语功能）
 * - notification_reads: 通知已读表
 * - schema_migrations: 迁移记录表
 */

exports.up = async (connection) => {
  // ============================================
  // 1. classes - 班级表
  // ============================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS classes (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '班级ID',
      name VARCHAR(50) NOT NULL COMMENT '班级名称，如"计算机1班"',
      grade VARCHAR(20) COMMENT '年级，如"高一"、"大二"',
      head_teacher_id INT COMMENT '班主任ID',
      student_count INT DEFAULT 0 COMMENT '学生人数',
      department VARCHAR(100) COMMENT '所属学院/系',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_head_teacher (head_teacher_id),
      INDEX idx_grade (grade),
      FOREIGN KEY (head_teacher_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级表'
  `);

  // ============================================
  // 2. subjects - 学科表
  // ============================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '学科ID',
      name VARCHAR(50) NOT NULL COMMENT '学科名称，如"数学"、"语文"',
      code VARCHAR(20) UNIQUE COMMENT '学科编码',
      category VARCHAR(20) COMMENT '分类：文科/理科/工科/艺术等',
      full_score DECIMAL(5,2) DEFAULT 100 COMMENT '满分',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      INDEX idx_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学科表'
  `);

  // ============================================
  // 3. exams - 考试表
  // ============================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS exams (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '考试ID',
      name VARCHAR(100) NOT NULL COMMENT '考试名称，如"2024年春季期中考试"',
      exam_type VARCHAR(20) DEFAULT 'regular' COMMENT '考试类型：月考/期中/期末/模拟考等',
      grade VARCHAR(20) COMMENT '参加年级',
      exam_date DATE COMMENT '考试日期',
      semester VARCHAR(20) COMMENT '学期',
      status TINYINT DEFAULT 1 COMMENT '状态：0=草稿，1=进行中，2=已完成',
      created_by INT COMMENT '创建人',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_exam_date (exam_date),
      INDEX idx_grade (grade),
      INDEX idx_status (status),
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试表'
  `);

  // ============================================
  // 4. exam_subjects - 考试科目关联表
  // ============================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS exam_subjects (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
      exam_id INT NOT NULL COMMENT '考试ID',
      subject_id INT NOT NULL COMMENT '学科ID',
      full_score DECIMAL(5,2) DEFAULT 100 COMMENT '本科满分',
      pass_score DECIMAL(5,2) DEFAULT 60 COMMENT '及格分',
      exam_duration INT COMMENT '考试时长（分钟）',
      UNIQUE KEY uk_exam_subject (exam_id, subject_id),
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试科目关联表'
  `);

  // ============================================
  // 5. exam_scores - 考试成绩表
  // ============================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS exam_scores (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '成绩ID',
      exam_id INT NOT NULL COMMENT '考试ID',
      student_id INT NOT NULL COMMENT '学生ID',
      subject_id INT NOT NULL COMMENT '学科ID',
      class_id INT COMMENT '班级ID（冗余，方便统计）',
      score DECIMAL(5,2) COMMENT '分数',
      score_level VARCHAR(10) COMMENT '分数等级：优秀/良好/中等/及格/不及格',
      rank_in_class INT COMMENT '班级排名',
      rank_in_grade INT COMMENT '年级排名',
      is_absent TINYINT DEFAULT 0 COMMENT '是否缺考',
      remark VARCHAR(255) COMMENT '备注',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      UNIQUE KEY uk_exam_student_subject (exam_id, student_id, subject_id),
      INDEX idx_exam_id (exam_id),
      INDEX idx_student_id (student_id),
      INDEX idx_class_id (class_id),
      INDEX idx_subject_id (subject_id),
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试成绩表'
  `);

  // ============================================
  // 6. class_subject_teachers - 班级学科教师关联表
  // ============================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS class_subject_teachers (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
      class_id INT NOT NULL COMMENT '班级ID',
      subject_id INT NOT NULL COMMENT '学科ID',
      teacher_id INT NOT NULL COMMENT '教师ID',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      UNIQUE KEY uk_class_subject_teacher (class_id, subject_id, teacher_id),
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级学科教师关联表'
  `);

  // ============================================
  // 7. portfolio_skills - 学生技能表（成长档案）
  // ============================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS portfolio_skills (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '技能ID',
      student_id INT NOT NULL COMMENT '学生ID',
      skill_name VARCHAR(100) NOT NULL COMMENT '技能名称',
      skill_category VARCHAR(50) COMMENT '技能分类：学术/体育/艺术/技术等',
      level INT DEFAULT 1 COMMENT '等级 1-5',
      description TEXT COMMENT '描述',
      evidence_url VARCHAR(255) COMMENT '证明材料',
      verified_by INT COMMENT '认证教师',
      verified_at DATETIME COMMENT '认证时间',
      semester VARCHAR(20) COMMENT '获得学期',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_student_id (student_id),
      INDEX idx_skill_category (skill_category),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生技能表（成长档案）'
  `);

  // ============================================
  // 8. portfolio_honors - 学生荣誉表（成长档案）
  // ============================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS portfolio_honors (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '荣誉ID',
      student_id INT NOT NULL COMMENT '学生ID',
      title VARCHAR(200) NOT NULL COMMENT '荣誉称号',
      honor_type VARCHAR(50) COMMENT '类型：奖学金/竞赛获奖/优秀学生等',
      level VARCHAR(20) COMMENT '级别：校级/市级/省级/国家级/国际级',
      awarding_org VARCHAR(200) COMMENT '颁发机构',
      awarded_date DATE COMMENT '获奖日期',
      description TEXT COMMENT '描述',
      evidence_url VARCHAR(255) COMMENT '证明材料',
      verified_by INT COMMENT '认证教师',
      verified_at DATETIME COMMENT '认证时间',
      semester VARCHAR(20) COMMENT '获得学期',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_student_id (student_id),
      INDEX idx_honor_type (honor_type),
      INDEX idx_level (level),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生荣誉表（成长档案）'
  `);

  // ============================================
  // 9. portfolio_mental_health - 心理健康记录表（成长档案）
  // ============================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS portfolio_mental_health (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
      student_id INT NOT NULL COMMENT '学生ID',
      assessment_date DATE NOT NULL COMMENT '测评日期',
      assessment_type VARCHAR(50) COMMENT '测评类型：SCL-90/SDS/SAS等',
      overall_score DECIMAL(5,2) COMMENT '总得分',
      stress_level VARCHAR(20) COMMENT '压力水平：低/中/高',
      mood_score INT COMMENT '情绪指数 0-100',
      details JSON COMMENT '详细测评数据（各维度得分）',
      notes TEXT COMMENT '备注/建议',
      assessed_by INT COMMENT '测评教师/咨询师',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_student_id (student_id),
      INDEX idx_assessment_date (assessment_date),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assessed_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='心理健康记录表（成长档案）'
  `);

  // ============================================
  // 10. portfolio_comments - 学生评语表（AI评语功能）
  // ============================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS portfolio_comments (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '评语ID',
      student_id INT NOT NULL COMMENT '学生ID',
      class_id INT COMMENT '班级ID',
      semester VARCHAR(20) NOT NULL COMMENT '学期',
      comment_type VARCHAR(20) DEFAULT 'general' COMMENT '评语类型：学期评语/月度评语/专项评语',
      content TEXT NOT NULL COMMENT '评语内容',
      comment_style VARCHAR(20) COMMENT '评语风格：鼓励型/严谨型/简洁型',
      source VARCHAR(20) DEFAULT 'teacher' COMMENT '来源：teacher/ai/edited',
      created_by INT COMMENT '创建人（教师）',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      UNIQUE KEY uk_student_semester_type (student_id, semester, comment_type),
      INDEX idx_student_id (student_id),
      INDEX idx_class_id (class_id),
      INDEX idx_semester (semester),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生评语表（AI评语功能）'
  `);

  // ============================================
  // 11. notification_reads - 通知已读表
  // ============================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS notification_reads (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
      notification_id INT NOT NULL COMMENT '通知ID',
      user_id INT NOT NULL COMMENT '用户ID',
      read_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '已读时间',
      UNIQUE KEY uk_notification_user (notification_id, user_id),
      INDEX idx_user_id (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知已读表'
  `);

  // ============================================
  // 12. schema_migrations - 迁移记录表
  // ============================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(50) PRIMARY KEY COMMENT '迁移版本号，如 V1.0.0',
      name VARCHAR(100) COMMENT '迁移名称',
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '执行时间'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据库迁移记录表'
  `);

  console.log('  ✅ 所有核心表创建完成');
};

exports.down = async (connection) => {
  // 按创建的逆序删除表（注意外键依赖关系）
  const tables = [
    'notification_reads',
    'portfolio_comments',
    'portfolio_mental_health',
    'portfolio_honors',
    'portfolio_skills',
    'class_subject_teachers',
    'exam_scores',
    'exam_subjects',
    'exams',
    'subjects',
    'classes',
    'schema_migrations'
  ];

  // 先禁用外键检查
  await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

  for (const table of tables) {
    await connection.execute(`DROP TABLE IF EXISTS ${table}`);
    console.log(`  🗑️  已删除表: ${table}`);
  }

  // 恢复外键检查
  await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

  console.log('  ✅ 所有核心表已删除');
};
