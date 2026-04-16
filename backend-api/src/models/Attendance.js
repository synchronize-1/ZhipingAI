const pool = require('../config/database');

class Attendance {
  // 签到
  static async checkIn(userId, courseId, scheduleId, method = 'auto', location = null) {
    const [result] = await pool.execute(
      `INSERT INTO attendances (user_id, course_id, schedule_id, check_in_time, method, location, status, created_at)
       VALUES (?, ?, ?, NOW(), ?, ?, 'present', NOW())`,
      [userId, courseId, scheduleId, method, location ? JSON.stringify(location) : null]
    );
    
    return result.insertId;
  }

  // 获取课程签到记录
  static async getCourseAttendance(courseId, date = null) {
    let query = `
      SELECT a.*, u.name as student_name, u.student_id
      FROM attendances a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.course_id = ?
    `;
    const params = [courseId];
    
    if (date) {
      query += ' AND DATE(a.check_in_time) = ?';
      params.push(date);
    }
    
    query += ' ORDER BY a.check_in_time DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // 获取学生出勤统计
  static async getStudentStatistics(studentId, semester = null) {
    let query = `
      SELECT 
        c.id as course_id,
        c.name as course_name,
        COUNT(DISTINCT s.id) as total_classes,
        COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) as attended,
        COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.id END) as late,
        COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN a.id END) as absent,
        ROUND(COUNT(DISTINCT CASE WHEN a.status IN ('present', 'late') THEN a.id END) * 100.0 / 
              NULLIF(COUNT(DISTINCT s.id), 0), 2) as attendance_rate
      FROM student_courses sc
      LEFT JOIN courses c ON sc.course_id = c.id
      LEFT JOIN schedules s ON c.id = s.course_id AND s.user_id = ?
      LEFT JOIN attendances a ON s.id = a.schedule_id AND a.user_id = ?
      WHERE sc.student_id = ?
    `;
    const params = [studentId, studentId, studentId];
    
    if (semester) {
      query += ' AND c.semester = ?';
      params.push(semester);
    }
    
    query += ' GROUP BY c.id, c.name';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // 获取班级出勤统计（管理员视图）
  static async getClassStatistics(courseId, startDate, endDate) {
    const [rows] = await pool.execute(`
      SELECT 
        DATE(a.check_in_time) as date,
        COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.user_id END) as present_count,
        COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.user_id END) as late_count,
        COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN a.user_id END) as absent_count,
        (SELECT COUNT(*) FROM student_courses WHERE course_id = ?) as total_students
      FROM attendances a
      WHERE a.course_id = ? AND DATE(a.check_in_time) BETWEEN ? AND ?
      GROUP BY DATE(a.check_in_time)
      ORDER BY date
    `, [courseId, courseId, startDate, endDate]);
    
    return rows;
  }

  // 无感考勤 - 基于位置自动签到
  static async autoCheckIn(userId, latitude, longitude, scheduleId) {
    // 获取课程教室位置
    const [schedule] = await pool.execute(`
      SELECT s.*, r.latitude as room_lat, r.longitude as room_lng, r.radius
      FROM schedules s
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE s.id = ?
    `, [scheduleId]);
    
    if (!schedule[0]) return { success: false, message: '课程不存在' };
    
    const { room_lat, room_lng, radius = 50 } = schedule[0];
    
    // 计算距离（简化的距离计算）
    const distance = Math.sqrt(
      Math.pow((latitude - room_lat) * 111000, 2) + 
      Math.pow((longitude - room_lng) * 111000 * Math.cos(latitude * Math.PI / 180), 2)
    );
    
    if (distance <= radius) {
      const attendanceId = await this.checkIn(userId, schedule[0].course_id, scheduleId, 'auto', { latitude, longitude });
      return { success: true, attendanceId, distance };
    }
    
    return { success: false, message: '不在教室范围内', distance };
  }
}

module.exports = Attendance;
