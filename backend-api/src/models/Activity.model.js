const pool = require('../config/database');

// 活动状态由时间实时推导，避免存储值过期导致筛选错误
const STATUS_EXPR = `CASE
  WHEN a.status = 'cancelled' THEN 'cancelled'
  WHEN NOW() < a.start_time THEN 'upcoming'
  WHEN a.end_time IS NOT NULL AND NOW() > a.end_time THEN 'completed'
  ELSE 'ongoing'
END`;

function baseSelect({ withUser = false } = {}) {
  const hasJoined = withUser
    ? `,
    EXISTS(
      SELECT 1 FROM activity_registrations ar2
       WHERE ar2.activity_id = a.id AND ar2.user_id = ? AND ar2.status <> 'cancelled'
    ) AS hasJoined`
    : '';

  return `
    SELECT
      a.id,
      a.title,
      a.description,
      a.category,
      a.location,
      a.start_time        AS startTime,
      a.end_time          AS endTime,
      a.max_participants  AS maxParticipants,
      a.organizer_id      AS organizerId,
      u.name              AS organizerName,
      u.role              AS organizerRole,
      a.images,
      a.cover,
      a.status            AS rawStatus,
      (${STATUS_EXPR})    AS status,
      a.created_at        AS createdAt,
      a.updated_at        AS updatedAt,
      (SELECT COUNT(*) FROM activity_registrations ar
        WHERE ar.activity_id = a.id AND ar.status <> 'cancelled') AS registeredCount,
      (SELECT COUNT(*) FROM activity_registrations ar
        WHERE ar.activity_id = a.id AND ar.status = 'checked_in') AS checkedInCount${hasJoined}
    FROM activities a
    LEFT JOIN users u ON a.organizer_id = u.id
  `;
}

class Activity {
  static async findById(id, userId = null) {
    const params = userId ? [userId, id] : [id];
    const [rows] = await pool.execute(
      `${baseSelect({ withUser: !!userId })} WHERE a.id = ?`,
      params
    );
    return rows[0];
  }

  static async findList({ page = 1, pageSize = 10, category, status, keyword, userId } = {}) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const sizeNum = Math.min(100, Math.max(1, parseInt(pageSize) || 10));
    const offsetNum = (pageNum - 1) * sizeNum;

    const where = ['1 = 1'];
    const params = userId ? [userId] : [];

    if (category) {
      where.push('a.category = ?');
      params.push(category);
    }
    if (status) {
      where.push(`(${STATUS_EXPR}) = ?`);
      params.push(status);
    }
    if (keyword) {
      where.push('(a.title LIKE ? OR a.description LIKE ? OR a.location LIKE ?)');
      const like = `%${keyword}%`;
      params.push(like, like, like);
    }

    const whereSql = where.join(' AND ');

    const [rows] = await pool.execute(
      `${baseSelect({ withUser: !!userId })}
        WHERE ${whereSql}
        ORDER BY a.start_time DESC
        LIMIT ${sizeNum} OFFSET ${offsetNum}`,
      params
    );

    const countParams = params.slice(userId ? 1 : 0);
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM activities a WHERE ${whereSql}`,
      countParams
    );

    return { list: rows, total, page: pageNum, pageSize: sizeNum };
  }

  static async create(data) {
    const {
      title, description, category, location, startTime, endTime,
      maxParticipants, organizerId, images, cover, status
    } = data;

    const [result] = await pool.execute(
      `INSERT INTO activities
         (title, description, category, location, start_time, end_time,
          max_participants, organizer_id, images, cover, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [title, description || null, category || null, location || null, startTime, endTime || null,
        maxParticipants || null, organizerId, images ? JSON.stringify(images) : null,
        cover || null, status || 'upcoming']
    );
    return result.insertId;
  }

  static async update(id, data) {
    const {
      title, description, category, location, startTime, endTime,
      maxParticipants, images, cover, status
    } = data;

    await pool.execute(
      `UPDATE activities
          SET title = ?, description = ?, category = ?, location = ?,
              start_time = ?, end_time = ?, max_participants = ?,
              images = ?, cover = ?, status = ?, updated_at = NOW()
        WHERE id = ?`,
      [title, description || null, category || null, location || null, startTime, endTime || null,
        maxParticipants || null, images ? JSON.stringify(images) : null,
        cover || null, status, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM activities WHERE id = ?', [id]);
  }

  static async getCategories() {
    const [rows] = await pool.execute(
      "SELECT DISTINCT category FROM activities WHERE category IS NOT NULL AND category <> '' ORDER BY category"
    );
    return rows.map((r) => r.category);
  }

  static async getStats() {
    const [[row]] = await pool.execute(`
      SELECT
        COUNT(*) AS total,
        SUM((${STATUS_EXPR}) = 'upcoming') AS upcoming,
        SUM((${STATUS_EXPR}) = 'ongoing') AS ongoing,
        SUM((${STATUS_EXPR}) = 'completed') AS completed
      FROM activities a
    `);
    const [[reg]] = await pool.execute(
      "SELECT COUNT(*) AS registrations FROM activity_registrations WHERE status <> 'cancelled'"
    );
    return {
      total: Number(row.total) || 0,
      upcoming: Number(row.upcoming) || 0,
      ongoing: Number(row.ongoing) || 0,
      completed: Number(row.completed) || 0,
      registrations: Number(reg.registrations) || 0
    };
  }

  // ==================== 报名 ====================

  static async countRegistrations(activityId) {
    const [[row]] = await pool.execute(
      "SELECT COUNT(*) AS c FROM activity_registrations WHERE activity_id = ? AND status <> 'cancelled'",
      [activityId]
    );
    return Number(row.c) || 0;
  }

  static async findRegistration(activityId, userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM activity_registrations WHERE activity_id = ? AND user_id = ?',
      [activityId, userId]
    );
    return rows[0];
  }

  static async createRegistration(activityId, userId, remark = null) {
    const [result] = await pool.execute(
      `INSERT INTO activity_registrations (activity_id, user_id, status, registered_at, remark)
       VALUES (?, ?, 'registered', NOW(), ?)`,
      [activityId, userId, remark]
    );
    return result.insertId;
  }

  static async reactivateRegistration(id, remark = null) {
    await pool.execute(
      `UPDATE activity_registrations
          SET status = 'registered', registered_at = NOW(), checked_in_at = NULL, remark = ?
        WHERE id = ?`,
      [remark, id]
    );
  }

  static async cancelRegistration(activityId, userId) {
    const [result] = await pool.execute(
      `UPDATE activity_registrations
          SET status = 'cancelled', checked_in_at = NULL
        WHERE activity_id = ? AND user_id = ? AND status <> 'cancelled'`,
      [activityId, userId]
    );
    return result.affectedRows;
  }

  static async findRegistrations(activityId, { status } = {}) {
    const where = ['ar.activity_id = ?'];
    const params = [activityId];
    if (status) {
      where.push('ar.status = ?');
      params.push(status);
    }

    const [rows] = await pool.execute(
      `SELECT
         ar.id,
         ar.activity_id AS activityId,
         ar.user_id     AS userId,
         ar.status,
         ar.registered_at AS registeredAt,
         ar.checked_in_at AS checkedInAt,
         ar.remark,
         u.name         AS userName,
         u.username,
         u.student_id   AS studentId,
         u.role,
         c.name         AS className
       FROM activity_registrations ar
       INNER JOIN users u ON ar.user_id = u.id
       LEFT JOIN classes c ON u.class_id = c.id
       WHERE ${where.join(' AND ')}
       ORDER BY ar.status = 'cancelled', ar.registered_at`,
      params
    );
    return rows;
  }

  static async findRegistrationById(id) {
    const [rows] = await pool.execute(
      `SELECT ar.*, a.title AS activityTitle, u.name AS userName
         FROM activity_registrations ar
         INNER JOIN activities a ON ar.activity_id = a.id
         INNER JOIN users u ON ar.user_id = u.id
        WHERE ar.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async checkIn(id) {
    const [result] = await pool.execute(
      `UPDATE activity_registrations
          SET status = 'checked_in', checked_in_at = NOW()
        WHERE id = ? AND status = 'registered'`,
      [id]
    );
    return result.affectedRows;
  }

  static async findUserRegistrations(userId) {
    const [rows] = await pool.execute(
      `SELECT
         ar.id,
         ar.status,
         ar.registered_at AS registeredAt,
         ar.checked_in_at AS checkedInAt,
         a.id             AS activityId,
         a.title,
         a.category,
         a.location,
         a.start_time     AS startTime,
         a.end_time       AS endTime,
         a.status         AS activityStatus,
         a.cover
       FROM activity_registrations ar
       INNER JOIN activities a ON ar.activity_id = a.id
       WHERE ar.user_id = ?
       ORDER BY a.start_time DESC`,
      [userId]
    );
    return rows;
  }
}

module.exports = Activity;