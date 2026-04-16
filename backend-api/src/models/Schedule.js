const pool = require('../config/database');

class Schedule {
  // 获取用户课表
  static async getByUserId(userId, weekNum = null) {
    let query = `
      SELECT s.*, c.name as course_name, c.teacher_name, c.location, c.credits,
             r.name as room_name, r.building
      FROM schedules s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE s.user_id = ?
    `;
    const params = [userId];
    
    if (weekNum) {
      query += ' AND s.week_num = ?';
      params.push(weekNum);
    }
    
    query += ' ORDER BY s.day_of_week, s.start_time';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // 获取教师课表
  static async getByTeacherId(teacherId, weekNum = null) {
    let query = `
      SELECT s.*, c.name as course_name, c.credits,
             r.name as room_name, r.building
      FROM schedules s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE c.teacher_id = ?
    `;
    const params = [teacherId];
    
    if (weekNum) {
      query += ' AND s.week_num = ?';
      params.push(weekNum);
    }
    
    query += ' ORDER BY s.day_of_week, s.start_time';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // 创建课程安排
  static async create(scheduleData) {
    const { courseId, userId, roomId, dayOfWeek, startTime, endTime, weekNum, semester } = scheduleData;
    
    const [result] = await pool.execute(
      `INSERT INTO schedules (course_id, user_id, room_id, day_of_week, start_time, end_time, week_num, semester, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [courseId, userId, roomId, dayOfWeek, startTime, endTime, weekNum, semester]
    );
    
    return result.insertId;
  }

  // 获取今日课程
  static async getTodaySchedule(userId) {
    const today = new Date().getDay() || 7; // 周日为7
    
    const [rows] = await pool.execute(`
      SELECT s.*, c.name as course_name, c.teacher_name, c.location,
             r.name as room_name, r.building, r.latitude, r.longitude
      FROM schedules s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE s.user_id = ? AND s.day_of_week = ?
      ORDER BY s.start_time
    `, [userId, today]);
    
    return rows;
  }

  // 获取即将上课的课程（用于课前提醒）
  static async getUpcomingClass(userId, minutesBefore = 30) {
    const now = new Date();
    const today = now.getDay() || 7;
    const currentTime = now.toTimeString().slice(0, 8);
    
    const [rows] = await pool.execute(`
      SELECT s.*, c.name as course_name, c.teacher_name,
             r.name as room_name, r.building, r.latitude, r.longitude
      FROM schedules s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE s.user_id = ? 
        AND s.day_of_week = ?
        AND s.start_time > ?
        AND TIMESTAMPDIFF(MINUTE, ?, s.start_time) <= ?
      ORDER BY s.start_time
      LIMIT 1
    `, [userId, today, currentTime, currentTime, minutesBefore]);
    
    return rows[0];
  }
}

module.exports = Schedule;
