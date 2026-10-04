const pool = require('../config/database');

class Course {
  // 创建课程
  static async create(courseData) {
    const { name, code, teacherId, teacherName, credits, description, location, semester, maxStudents } = courseData;
    
    const [result] = await pool.execute(
      `INSERT INTO courses (name, code, teacher_id, teacher_name, credits, description, location, semester, max_students, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name, code, teacherId, teacherName, credits, description, location, semester, maxStudents]
    );
    
    return result.insertId;
  }

  // 获取所有学期列表
  static async getSemesters() {
    const [rows] = await pool.execute(`
      SELECT DISTINCT semester
      FROM courses
      WHERE semester IS NOT NULL AND semester != ''
      ORDER BY semester DESC
    `);
    return rows.map(row => row.semester);
  }

  // 获取所有教师名称（取自 courses 表的唯一教师名，而非注册用户表）
  static async getTeacherNames() {
    const [rows] = await pool.execute(`
      SELECT DISTINCT teacher_name as name
      FROM courses
      WHERE teacher_name IS NOT NULL AND teacher_name != ''
      ORDER BY teacher_name
    `);
    return rows.map(row => row.name);
  }

  // 获取课程详情
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM courses WHERE id = ?', [id]);
    return rows[0];
  }

  // 获取课程列表
  static async getAll(page = 1, limit = 10, semester = null) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    
    let query = 'SELECT * FROM courses';
    let countQuery = 'SELECT COUNT(*) as total FROM courses';
    const params = [];
    
    if (semester) {
      query += ' WHERE semester = ?';
      countQuery += ' WHERE semester = ?';
      params.push(semester);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;
    
    const [rows] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, semester ? [semester] : []);
    
    return {
      data: rows,
      total: countResult[0].total,
      page: pageNum,
      limit: limitNum
    };
  }

  // 获取学生选课列表
  static async getStudentCourses(studentId) {
    const [rows] = await pool.execute(`
      SELECT c.*, sc.enrolled_at, sc.status
      FROM courses c
      INNER JOIN student_courses sc ON c.id = sc.course_id
      WHERE sc.student_id = ?
      ORDER BY sc.enrolled_at DESC
    `, [studentId]);
    
    return rows;
  }

  // 学生选课
  static async enroll(studentId, courseId) {
    const [result] = await pool.execute(
      'INSERT INTO student_courses (student_id, course_id, enrolled_at, status) VALUES (?, ?, NOW(), "enrolled")',
      [studentId, courseId]
    );
    return result.insertId;
  }

  // 获取课程学生列表
  static async getCourseStudents(courseId) {
    const [rows] = await pool.execute(`
      SELECT u.id, u.name, u.student_id, u.avatar, sc.enrolled_at
      FROM users u
      INNER JOIN student_courses sc ON u.id = sc.student_id
      WHERE sc.course_id = ?
      ORDER BY sc.enrolled_at
    `, [courseId]);
    
    return rows;
  }

  // 获取AI推荐学习资源
  static async getRecommendedResources(studentId, limit = 5) {
    const limitNum = parseInt(limit) || 5;
    const [rows] = await pool.query(`
      SELECT lr.*, c.name as course_name
      FROM learning_resources lr
      LEFT JOIN courses c ON lr.course_id = c.id
      WHERE lr.course_id IN (
        SELECT course_id FROM student_courses WHERE student_id = ?
      )
      ORDER BY lr.views DESC, lr.rating DESC
      LIMIT ${limitNum}
    `, [studentId]);
    
    return rows;
  }
}

module.exports = Course;
