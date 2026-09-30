const pool = require('../config/database');

/**
 * 操作日志数据访问层
 */
class OperationLog {
  static async create(data) {
    const {
      userId = null,
      username = null,
      role = null,
      module = null,
      action = null,
      method,
      path,
      targetType = null,
      targetId = null,
      statusCode = null,
      success = 1,
      durationMs = null,
      ip = null,
      userAgent = null,
      requestBody = null,
      errorMessage = null
    } = data;

    const [result] = await pool.execute(
      `INSERT INTO operation_logs
        (user_id, username, role, module, action, method, path, target_type, target_id,
         status_code, success, duration_ms, ip, user_agent, request_body, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, username, role, module, action, method, path, targetType, targetId,
        statusCode, success ? 1 : 0, durationMs, ip, userAgent, requestBody, errorMessage
      ]
    );
    return result.insertId;
  }

  static async findList({
    page = 1,
    pageSize = 20,
    module,
    action,
    username,
    method,
    success,
    startDate,
    endDate,
    keyword
  } = {}) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const sizeNum = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
    const offsetNum = (pageNum - 1) * sizeNum;

    const where = ['1 = 1'];
    const params = [];

    if (module) {
      where.push('module = ?');
      params.push(module);
    }
    if (action) {
      where.push('action = ?');
      params.push(action);
    }
    if (method) {
      where.push('method = ?');
      params.push(method);
    }
    if (username) {
      where.push('username LIKE ?');
      params.push(`%${username}%`);
    }
    if (success !== undefined && success !== null && success !== '') {
      where.push('success = ?');
      params.push(Number(success) ? 1 : 0);
    }
    if (startDate) {
      where.push('created_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      where.push('created_at <= ?');
      params.push(endDate);
    }
    if (keyword) {
      where.push('(path LIKE ? OR target_id LIKE ? OR error_message LIKE ?)');
      const like = `%${keyword}%`;
      params.push(like, like, like);
    }

    const whereSql = where.join(' AND ');

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM operation_logs WHERE ${whereSql}`,
      params
    );

    // LIMIT / OFFSET 使用已校验的内联整数（mysql2 预处理不支持占位符）
    const [rows] = await pool.execute(
      `SELECT * FROM operation_logs
        WHERE ${whereSql}
        ORDER BY id DESC
        LIMIT ${sizeNum} OFFSET ${offsetNum}`,
      params
    );

    return { list: rows.map((row) => this.format(row)), total: countRows[0].total, page: pageNum, pageSize: sizeNum };
  }

  static async stats({ startDate, endDate } = {}) {
    const where = ['1 = 1'];
    const params = [];
    if (startDate) {
      where.push('created_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      where.push('created_at <= ?');
      params.push(endDate);
    }
    const whereSql = where.join(' AND ');

    const [totalRows] = await pool.execute(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS failed,
              SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS today
         FROM operation_logs WHERE ${whereSql}`,
      params
    );

    const [byModule] = await pool.execute(
      `SELECT module, COUNT(*) AS count FROM operation_logs
        WHERE ${whereSql} GROUP BY module ORDER BY count DESC LIMIT 10`,
      params
    );

    const [byAction] = await pool.execute(
      `SELECT action, COUNT(*) AS count FROM operation_logs
        WHERE ${whereSql} GROUP BY action ORDER BY count DESC LIMIT 10`,
      params
    );

    const total = Number(totalRows[0].total) || 0;
    const failed = Number(totalRows[0].failed) || 0;

    return {
      total,
      failed,
      today: Number(totalRows[0].today) || 0,
      successRate: total ? Math.round(((total - failed) / total) * 100) : 100,
      byModule: byModule.map((r) => ({ module: r.module || 'unknown', count: Number(r.count) })),
      byAction: byAction.map((r) => ({ action: r.action || 'unknown', count: Number(r.count) }))
    };
  }

  static async modules() {
    const [rows] = await pool.execute(
      'SELECT DISTINCT module FROM operation_logs WHERE module IS NOT NULL ORDER BY module'
    );
    return rows.map((r) => r.module);
  }

  static format(row) {
    return {
      id: row.id,
      userId: row.user_id,
      username: row.username,
      role: row.role,
      module: row.module,
      action: row.action,
      method: row.method,
      path: row.path,
      targetType: row.target_type,
      targetId: row.target_id,
      statusCode: row.status_code,
      success: !!row.success,
      durationMs: row.duration_ms,
      ip: row.ip,
      userAgent: row.user_agent,
      requestBody: row.request_body,
      errorMessage: row.error_message,
      createdAt: row.created_at
    };
  }
}

module.exports = OperationLog;