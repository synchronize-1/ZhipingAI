const pool = require('../config/database');

class Security {
  // ========== 门禁管理 ==========
  static async getAccessLogs(userId = null, building = null, startDate = null, endDate = null) {
    let query = `
      SELECT al.*, u.name as user_name, u.role, b.name as building_name
      FROM access_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN buildings b ON al.building_id = b.id
      WHERE 1=1
    `;
    const params = [];
    
    if (userId) {
      query += ' AND al.user_id = ?';
      params.push(userId);
    }
    if (building) {
      query += ' AND al.building_id = ?';
      params.push(building);
    }
    if (startDate) {
      query += ' AND al.access_time >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND al.access_time <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY al.access_time DESC LIMIT 100';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // 记录门禁日志
  static async logAccess(userId, buildingId, accessType, method) {
    const [result] = await pool.execute(
      `INSERT INTO access_logs (user_id, building_id, access_type, method, access_time)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, buildingId, accessType, method]
    );
    return result.insertId;
  }

  // ========== 紧急通知 ==========
  static async createEmergencyNotice(noticeData) {
    const { title, content, level, targetRoles, createdBy } = noticeData;
    
    const [result] = await pool.execute(
      `INSERT INTO emergency_notices (title, content, level, target_roles, created_by, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'active', NOW())`,
      [title, content, level, JSON.stringify(targetRoles), createdBy]
    );
    
    return result.insertId;
  }

  static async getActiveEmergencyNotices(role = null) {
    let query = 'SELECT * FROM emergency_notices WHERE status = "active"';
    const params = [];
    
    if (role) {
      query += ' AND (target_roles IS NULL OR JSON_CONTAINS(target_roles, ?))';
      params.push(JSON.stringify(role));
    }
    
    query += ' ORDER BY level DESC, created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // ========== 监控设备 ==========
  static async getCameras(building = null) {
    let query = 'SELECT * FROM cameras WHERE status = "active"';
    const params = [];
    
    if (building) {
      query += ' AND building = ?';
      params.push(building);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // ========== 能耗监测 ==========
  static async getEnergyData(building = null, startDate = null, endDate = null, type = null) {
    let query = `
      SELECT ed.*, b.name as building_name
      FROM energy_data ed
      LEFT JOIN buildings b ON ed.building_id = b.id
      WHERE 1=1
    `;
    const params = [];
    
    if (building) {
      query += ' AND ed.building_id = ?';
      params.push(building);
    }
    if (startDate) {
      query += ' AND ed.recorded_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND ed.recorded_at <= ?';
      params.push(endDate);
    }
    if (type) {
      query += ' AND ed.type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY ed.recorded_at DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // 获取能耗统计
  static async getEnergyStatistics(period = 'day') {
    let dateFormat;
    switch (period) {
      case 'hour': dateFormat = '%Y-%m-%d %H:00'; break;
      case 'day': dateFormat = '%Y-%m-%d'; break;
      case 'week': dateFormat = '%Y-%u'; break;
      case 'month': dateFormat = '%Y-%m'; break;
      default: dateFormat = '%Y-%m-%d';
    }
    
    const [rows] = await pool.execute(`
      SELECT 
        DATE_FORMAT(recorded_at, ?) as period,
        type,
        SUM(value) as total_value,
        AVG(value) as avg_value,
        building_id
      FROM energy_data
      WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY period, type, building_id
      ORDER BY period DESC
    `, [dateFormat]);
    
    return rows;
  }

  // 获取绿色校园提示
  static async getGreenCampusTips() {
    const [rows] = await pool.execute(`
      SELECT * FROM green_tips 
      WHERE status = 'active' 
      ORDER BY priority DESC, RAND() 
      LIMIT 5
    `);
    return rows;
  }
}

module.exports = Security;
