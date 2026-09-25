const pool = require('../config/database');

class PortfolioHonor {
  // 创建荣誉记录
  static async create(honorData) {
    const { studentId, title, honorType, level, awardingOrg, awardedDate, description, evidenceUrl, verifiedBy, verifiedAt, semester } = honorData;

    const [result] = await pool.execute(
      `INSERT INTO portfolio_honors (student_id, title, honor_type, level, awarding_org, awarded_date, description, evidence_url, verified_by, verified_at, semester, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        studentId,
        title,
        honorType || null,
        level || null,
        awardingOrg || null,
        awardedDate || null,
        description || null,
        evidenceUrl || null,
        verifiedBy || null,
        verifiedAt || null,
        semester || null
      ]
    );

    return result.insertId;
  }

  // 根据ID查询
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM portfolio_honors WHERE id = ?', [id]);
    return rows[0];
  }

  // 查询学生荣誉（分页，支持类型和级别筛选）
  static async getByStudentId(studentId, { page = 1, pageSize = 10, honorType, level } = {}) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(pageSize) || 10;
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT * FROM portfolio_honors WHERE student_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM portfolio_honors WHERE student_id = ?';
    const params = [studentId];

    if (honorType) {
      query += ' AND honor_type = ?';
      countQuery += ' AND honor_type = ?';
      params.push(honorType);
    }
    if (level) {
      query += ' AND level = ?';
      countQuery += ' AND level = ?';
      params.push(level);
    }

    query += ` ORDER BY awarded_date DESC, created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, params);

    return {
      list: rows,
      total: countResult[0].total,
      page: pageNum,
      pageSize: limitNum
    };
  }

  // 更新荣誉
  static async update(id, honorData) {
    const { title, honorType, level, awardingOrg, awardedDate, description, evidenceUrl, verifiedBy, verifiedAt, semester } = honorData;

    const fields = [];
    const params = [];

    if (title !== undefined) {
      fields.push('title = ?');
      params.push(title);
    }
    if (honorType !== undefined) {
      fields.push('honor_type = ?');
      params.push(honorType);
    }
    if (level !== undefined) {
      fields.push('level = ?');
      params.push(level);
    }
    if (awardingOrg !== undefined) {
      fields.push('awarding_org = ?');
      params.push(awardingOrg);
    }
    if (awardedDate !== undefined) {
      fields.push('awarded_date = ?');
      params.push(awardedDate);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      params.push(description);
    }
    if (evidenceUrl !== undefined) {
      fields.push('evidence_url = ?');
      params.push(evidenceUrl);
    }
    if (verifiedBy !== undefined) {
      fields.push('verified_by = ?');
      params.push(verifiedBy);
    }
    if (verifiedAt !== undefined) {
      fields.push('verified_at = ?');
      params.push(verifiedAt);
    }
    if (semester !== undefined) {
      fields.push('semester = ?');
      params.push(semester);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = NOW()');
    params.push(id);

    await pool.execute(
      `UPDATE portfolio_honors SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
  }

  // 删除荣誉
  static async delete(id) {
    await pool.execute('DELETE FROM portfolio_honors WHERE id = ?', [id]);
  }

  // 获取学生荣誉统计（按级别、按类型的数量分布）
  static async getStudentHonorStats(studentId) {
    // 按级别统计数量
    const [levelRows] = await pool.execute(
      `SELECT level, COUNT(*) as count
       FROM portfolio_honors
       WHERE student_id = ?
       GROUP BY level
       ORDER BY count DESC`,
      [studentId]
    );

    // 按类型统计数量
    const [typeRows] = await pool.execute(
      `SELECT honor_type as type, COUNT(*) as count
       FROM portfolio_honors
       WHERE student_id = ?
       GROUP BY honor_type
       ORDER BY count DESC`,
      [studentId]
    );

    // 总数量
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM portfolio_honors WHERE student_id = ?',
      [studentId]
    );

    return {
      total: totalResult[0].total,
      byLevel: levelRows,
      byType: typeRows
    };
  }
}

module.exports = PortfolioHonor;
