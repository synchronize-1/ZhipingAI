const pool = require('../config/database');

class PortfolioMentalHealth {
  // 创建心理健康记录
  static async create(recordData) {
    const { studentId, assessmentDate, assessmentType, overallScore, stressLevel, moodScore, details, notes, assessedBy } = recordData;

    const [result] = await pool.execute(
      `INSERT INTO portfolio_mental_health (student_id, assessment_date, assessment_type, overall_score, stress_level, mood_score, details, notes, assessed_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        studentId,
        assessmentDate,
        assessmentType || null,
        overallScore || null,
        stressLevel || null,
        moodScore || null,
        details ? JSON.stringify(details) : null,
        notes || null,
        assessedBy || null
      ]
    );

    return result.insertId;
  }

  // 根据ID查询
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM portfolio_mental_health WHERE id = ?', [id]);
    if (rows[0] && rows[0].details) {
      try {
        rows[0].details = JSON.parse(rows[0].details);
      } catch (e) {
        // 解析失败保持原样
      }
    }
    return rows[0];
  }

  // 查询学生心理健康记录（分页）
  static async getByStudentId(studentId, { page = 1, pageSize = 10, assessmentType } = {}) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(pageSize) || 10;
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT * FROM portfolio_mental_health WHERE student_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM portfolio_mental_health WHERE student_id = ?';
    const params = [studentId];

    if (assessmentType) {
      query += ' AND assessment_type = ?';
      countQuery += ' AND assessment_type = ?';
      params.push(assessmentType);
    }

    query += ` ORDER BY assessment_date DESC, created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, params);

    // 解析 details JSON 字段
    const list = rows.map(row => {
      if (row.details) {
        try {
          row.details = JSON.parse(row.details);
        } catch (e) {
          // 解析失败保持原样
        }
      }
      return row;
    });

    return {
      list,
      total: countResult[0].total,
      page: pageNum,
      pageSize: limitNum
    };
  }

  // 更新心理健康记录
  static async update(id, recordData) {
    const { assessmentDate, assessmentType, overallScore, stressLevel, moodScore, details, notes, assessedBy } = recordData;

    const fields = [];
    const params = [];

    if (assessmentDate !== undefined) {
      fields.push('assessment_date = ?');
      params.push(assessmentDate);
    }
    if (assessmentType !== undefined) {
      fields.push('assessment_type = ?');
      params.push(assessmentType);
    }
    if (overallScore !== undefined) {
      fields.push('overall_score = ?');
      params.push(overallScore);
    }
    if (stressLevel !== undefined) {
      fields.push('stress_level = ?');
      params.push(stressLevel);
    }
    if (moodScore !== undefined) {
      fields.push('mood_score = ?');
      params.push(moodScore);
    }
    if (details !== undefined) {
      fields.push('details = ?');
      params.push(details ? JSON.stringify(details) : null);
    }
    if (notes !== undefined) {
      fields.push('notes = ?');
      params.push(notes);
    }
    if (assessedBy !== undefined) {
      fields.push('assessed_by = ?');
      params.push(assessedBy);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = NOW()');
    params.push(id);

    await pool.execute(
      `UPDATE portfolio_mental_health SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
  }

  // 删除心理健康记录
  static async delete(id) {
    await pool.execute('DELETE FROM portfolio_mental_health WHERE id = ?', [id]);
  }

  // 获取学生心理趋势（最近N次记录的情绪指数、压力水平变化）
  static async getStudentTrend(studentId, limit = 6) {
    const limitNum = parseInt(limit) || 6;

    const [rows] = await pool.query(
      `SELECT id, assessment_date, assessment_type, overall_score, stress_level, mood_score
       FROM portfolio_mental_health
       WHERE student_id = ?
       ORDER BY assessment_date ASC, created_at ASC
       LIMIT ${limitNum}`,
      [studentId]
    );

    return rows;
  }
}

module.exports = PortfolioMentalHealth;
