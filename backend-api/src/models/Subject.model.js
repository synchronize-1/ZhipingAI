const pool = require('../config/database');

class Subject {
  // 创建学科
  static async create(subjectData) {
    const { name, code, category, fullScore } = subjectData;

    const [result] = await pool.execute(
      `INSERT INTO subjects (name, code, category, full_score, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [name, code || null, category || null, fullScore || 100]
    );

    return result.insertId;
  }

  // 根据ID查询
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM subjects WHERE id = ?', [id]);
    return rows[0];
  }

  // 根据编码查询
  static async findByCode(code) {
    const [rows] = await pool.execute('SELECT * FROM subjects WHERE code = ?', [code]);
    return rows[0];
  }

  // 分页查询
  static async getAll({ page = 1, pageSize = 10, category, keyword }) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(pageSize) || 10;
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT * FROM subjects';
    let countQuery = 'SELECT COUNT(*) as total FROM subjects';
    const whereConditions = [];
    const params = [];

    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }
    if (keyword) {
      whereConditions.push('(name LIKE ? OR code LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY id ASC LIMIT ${limitNum} OFFSET ${offset}`;

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, params);

    return {
      list: rows,
      total: countResult[0].total,
      page: pageNum,
      pageSize: limitNum
    };
  }

  // 更新
  static async update(id, subjectData) {
    const { name, code, category, fullScore } = subjectData;

    const fields = [];
    const params = [];

    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }
    if (code !== undefined) {
      fields.push('code = ?');
      params.push(code);
    }
    if (category !== undefined) {
      fields.push('category = ?');
      params.push(category);
    }
    if (fullScore !== undefined) {
      fields.push('full_score = ?');
      params.push(fullScore);
    }

    if (fields.length === 0) return;

    params.push(id);

    await pool.execute(
      `UPDATE subjects SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
  }

  // 删除
  static async delete(id) {
    await pool.execute('DELETE FROM subjects WHERE id = ?', [id]);
  }

  // 获取所有学科的精简列表
  static async getAllSimple() {
    const [rows] = await pool.execute(
      'SELECT id, name, code, full_score FROM subjects ORDER BY id ASC'
    );
    return rows;
  }
}

module.exports = Subject;
