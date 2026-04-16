const pool = require('../config/database');

class Room {
  // 获取空闲教室
  static async getAvailableRooms(building = null, date = null, timeSlot = null) {
    let query = `
      SELECT r.*, 
             CASE WHEN rs.id IS NULL THEN 1 ELSE 0 END as is_available
      FROM rooms r
      LEFT JOIN room_schedules rs ON r.id = rs.room_id 
        AND rs.date = COALESCE(?, CURDATE())
        AND rs.time_slot = COALESCE(?, 1)
      WHERE r.status = 'active'
    `;
    const params = [date, timeSlot];
    
    if (building) {
      query += ' AND r.building = ?';
      params.push(building);
    }
    
    query += ' ORDER BY r.building, r.name';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // 获取教室详情
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM rooms WHERE id = ?', [id]);
    return rows[0];
  }

  // 获取所有教学楼
  static async getBuildings() {
    const [rows] = await pool.execute('SELECT DISTINCT building FROM rooms ORDER BY building');
    return rows.map(row => row.building);
  }

  // 预约教室
  static async reserve(roomId, userId, date, timeSlot, purpose) {
    const [result] = await pool.execute(
      `INSERT INTO room_reservations (room_id, user_id, date, time_slot, purpose, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
      [roomId, userId, date, timeSlot, purpose]
    );
    return result.insertId;
  }

  // 获取教室使用率统计
  static async getUsageStatistics(startDate, endDate) {
    const [rows] = await pool.execute(`
      SELECT r.building, 
             COUNT(DISTINCT r.id) as total_rooms,
             COUNT(rs.id) as used_slots,
             ROUND(COUNT(rs.id) * 100.0 / (COUNT(DISTINCT r.id) * 12), 2) as usage_rate
      FROM rooms r
      LEFT JOIN room_schedules rs ON r.id = rs.room_id 
        AND rs.date BETWEEN ? AND ?
      GROUP BY r.building
      ORDER BY r.building
    `, [startDate, endDate]);
    
    return rows;
  }

  // 获取实时教室占用状态
  static async getRealTimeStatus() {
    const now = new Date();
    const currentHour = now.getHours();
    const timeSlot = Math.max(1, Math.min(12, currentHour - 7)); // 8:00-20:00 映射到 1-12
    
    const [rows] = await pool.execute(`
      SELECT r.*, 
             CASE WHEN rs.id IS NOT NULL THEN 'occupied' ELSE 'available' END as status,
             rs.course_name
      FROM rooms r
      LEFT JOIN room_schedules rs ON r.id = rs.room_id 
        AND rs.date = CURDATE()
        AND rs.time_slot = ?
      ORDER BY r.building, r.name
    `, [timeSlot]);
    
    return rows;
  }
}

module.exports = Room;
