const pool = require('../config/database');

class PortfolioSkill {
  // 创建技能记录
  static async create(skillData) {
    const { studentId, skillName, skillCategory, level, description, evidenceUrl, verifiedBy, verifiedAt, semester } = skillData;

    const [result] = await pool.execute(
      `INSERT INTO portfolio_skills (student_id, skill_name, skill_category, level, description, evidence_url, verified_by, verified_at, semester, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        studentId,
        skillName,
        skillCategory || null,
        level || 1,
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
    const [rows] = await pool.execute('SELECT * FROM portfolio_skills WHERE id = ?', [id]);
    return rows[0];
  }

  // 查询学生的技能（分页，支持分类筛选）
  static async getByStudentId(studentId, { page = 1, pageSize = 10, category } = {}) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(pageSize) || 10;
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT * FROM portfolio_skills WHERE student_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM portfolio_skills WHERE student_id = ?';
    const params = [studentId];

    if (category) {
      query += ' AND skill_category = ?';
      countQuery += ' AND skill_category = ?';
      params.push(category);
    }

    query += ` ORDER BY level DESC, created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, params);

    return {
      list: rows,
      total: countResult[0].total,
      page: pageNum,
      pageSize: limitNum
    };
  }

  // 更新技能
  static async update(id, skillData) {
    const { skillName, skillCategory, level, description, evidenceUrl, verifiedBy, verifiedAt, semester } = skillData;

    const fields = [];
    const params = [];

    if (skillName !== undefined) {
      fields.push('skill_name = ?');
      params.push(skillName);
    }
    if (skillCategory !== undefined) {
      fields.push('skill_category = ?');
      params.push(skillCategory);
    }
    if (level !== undefined) {
      fields.push('level = ?');
      params.push(level);
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
      `UPDATE portfolio_skills SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
  }

  // 删除技能
  static async delete(id) {
    await pool.execute('DELETE FROM portfolio_skills WHERE id = ?', [id]);
  }

  // 获取学生技能统计（各分类数量、等级分布）
  static async getStudentSkillStats(studentId) {
    // 按分类统计数量
    const [categoryRows] = await pool.execute(
      `SELECT skill_category as category, COUNT(*) as count
       FROM portfolio_skills
       WHERE student_id = ?
       GROUP BY skill_category
       ORDER BY count DESC`,
      [studentId]
    );

    // 按等级统计数量
    const [levelRows] = await pool.execute(
      `SELECT level, COUNT(*) as count
       FROM portfolio_skills
       WHERE student_id = ?
       GROUP BY level
       ORDER BY level DESC`,
      [studentId]
    );

    // 总数量
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM portfolio_skills WHERE student_id = ?',
      [studentId]
    );

    return {
      total: totalResult[0].total,
      byCategory: categoryRows,
      byLevel: levelRows
    };
  }
}

module.exports = PortfolioSkill;
