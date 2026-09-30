const pool = require('../config/database');
const { getIo } = require('../websockets/io');

// 通知类型白名单，与 notifications.type 枚举保持一致
const NOTIFICATION_TYPES = ['system', 'course', 'activity', 'service', 'emergency', 'elective'];

/**
 * 通知中心服务
 *
 * 统一负责通知的落库与实时推送：
 * - 业务动作（选课、报名等）调用 create() 生成通知，同时向对应用户/角色房间推送；
 * - 列表查询按角色收敛可见范围（管理员看全部，其他用户看本人 / 本角色 / 全局）。
 */
class NotificationService {
  static get types() {
    return NOTIFICATION_TYPES;
  }

  /**
   * 创建一条通知并推送。
   * @param {Object} payload
   * @param {string} payload.title
   * @param {string} [payload.content]
   * @param {string} [payload.type]        system | course | activity | service | emergency | elective
   * @param {string} [payload.targetRole]  目标角色；与 userId 互斥，为空表示全局
   * @param {number} [payload.userId]      目标用户
   * @param {number} [payload.createdBy]   创建人
   */
  static async create({ title, content = null, type = 'system', targetRole = null, userId = null, createdBy = null }) {
    const safeType = NOTIFICATION_TYPES.includes(type) ? type : 'system';
    const [result] = await pool.execute(
      `INSERT INTO notifications (title, content, type, target_role, user_id, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [title, content, safeType, targetRole, userId, createdBy]
    );

    const notification = {
      id: result.insertId,
      title,
      content,
      type: safeType,
      target_role: targetRole,
      user_id: userId,
      is_read: 0,
      created_at: new Date()
    };

    NotificationService.push(notification);
    return notification;
  }

  /**
   * 通过 socket.io 推送通知。无连接实例（如脚本环境）时静默跳过。
   */
  static push(notification) {
    const io = getIo();
    if (!io) return;

    const payload = { ...notification, timestamp: new Date() };
    if (notification.user_id) {
      io.to(`user:${notification.user_id}`).emit('notification', payload);
    } else if (notification.target_role && notification.target_role !== 'all') {
      io.to(`role:${notification.target_role}`).emit('notification', payload);
    } else {
      io.emit('notification', payload);
    }
  }

  // 可见范围条件（管理员不限，其他用户：本人 / 本角色 / 全局）
  static _scope(user) {
    if (user.role === 'admin') return { sql: '', params: [] };
    return {
      sql: "(user_id = ? OR target_role = ? OR target_role = 'all')",
      params: [user.id, user.role]
    };
  }

  /**
   * 分页查询当前用户可见的通知。
   * @returns {{ notifications: Array, unreadCount: number, total: number, page: number, pageSize: number }}
   */
  static async listForUser(user, { page = 1, limit = 20, unreadOnly = false, type = null } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;
    const onlyUnread = unreadOnly === true || unreadOnly === 'true';

    const scope = NotificationService._scope(user);

    const conditions = [];
    const params = [...scope.params];
    if (scope.sql) conditions.push(scope.sql);
    if (onlyUnread) conditions.push('is_read = 0');
    if (type && NOTIFICATION_TYPES.includes(type)) {
      conditions.push('type = ?');
      params.push(type);
    }
    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // LIMIT / OFFSET 使用已校验的整数内联，不参与参数绑定
    const [notifications] = await pool.execute(
      `SELECT * FROM notifications ${whereSql} ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`,
      params
    );

    const [totalRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM notifications ${whereSql}`,
      params
    );

    // 未读数只受可见范围约束，不受类型 / 已读筛选影响
    const unreadConditions = [];
    if (scope.sql) unreadConditions.push(scope.sql);
    unreadConditions.push('is_read = 0');
    const [unreadRows] = await pool.execute(
      `SELECT COUNT(*) as count FROM notifications WHERE ${unreadConditions.join(' AND ')}`,
      scope.params
    );

    return {
      notifications,
      unreadCount: unreadRows[0] ? unreadRows[0].count : 0,
      total: totalRows[0] ? totalRows[0].total : 0,
      page: pageNum,
      pageSize: limitNum
    };
  }

  static async markRead(id, user) {
    const scope = NotificationService._scope(user);
    const conditions = ['id = ?'];
    const params = [id];
    if (scope.sql) {
      conditions.push(scope.sql);
      params.push(...scope.params);
    }
    const [result] = await pool.execute(
      `UPDATE notifications SET is_read = 1, read_at = NOW() WHERE ${conditions.join(' AND ')}`,
      params
    );
    return result.affectedRows > 0;
  }

  static async markAllRead(user) {
    const scope = NotificationService._scope(user);
    const conditions = ['is_read = 0'];
    const params = [];
    if (scope.sql) {
      conditions.push(scope.sql);
      params.push(...scope.params);
    }
    const [result] = await pool.execute(
      `UPDATE notifications SET is_read = 1, read_at = NOW() WHERE ${conditions.join(' AND ')}`,
      params
    );
    return result.affectedRows;
  }

  static async remove(id, user) {
    const scope = NotificationService._scope(user);
    const conditions = ['id = ?'];
    const params = [id];
    if (scope.sql) {
      conditions.push(scope.sql);
      params.push(...scope.params);
    }
    const [result] = await pool.execute(
      `DELETE FROM notifications WHERE ${conditions.join(' AND ')}`,
      params
    );
    return result.affectedRows > 0;
  }
}

module.exports = NotificationService;