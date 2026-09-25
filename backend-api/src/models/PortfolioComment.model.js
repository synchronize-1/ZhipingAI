const pool = require('../config/database');

class PortfolioComment {
  // 创建评语
  static async create(commentData) {
    const { studentId, classId, semester, commentType, content, commentStyle, source, createdBy } = commentData;

    const [result] = await pool.execute(
      `INSERT INTO portfolio_comments (student_id, class_id, semester, comment_type, content, comment_style, source, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        studentId,
        classId || null,
        semester,
        commentType || 'general',
        content,
        commentStyle || null,
        source || 'teacher',
        createdBy || null
      ]
    );

    return result.insertId;
  }

  // 根据ID查询
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM portfolio_comments WHERE id = ?', [id]);
    return rows[0];
  }

  // 查询学生评语（分页）
  static async getByStudentId(studentId, { page = 1, pageSize = 10, semester, commentType } = {}) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(pageSize) || 10;
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT * FROM portfolio_comments WHERE student_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM portfolio_comments WHERE student_id = ?';
    const params = [studentId];

    if (semester) {
      query += ' AND semester = ?';
      countQuery += ' AND semester = ?';
      params.push(semester);
    }
    if (commentType) {
      query += ' AND comment_type = ?';
      countQuery += ' AND comment_type = ?';
      params.push(commentType);
    }

    query += ` ORDER BY semester DESC, created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, params);

    return {
      list: rows,
      total: countResult[0].total,
      page: pageNum,
      pageSize: limitNum
    };
  }

  // 获取最新学期评语
  static async getLatest(studentId, semester, commentType = 'general') {
    const [rows] = await pool.execute(
      `SELECT * FROM portfolio_comments
       WHERE student_id = ? AND comment_type = ?
       ORDER BY semester DESC, created_at DESC
       LIMIT 1`,
      [studentId, commentType]
    );

    // 如果指定了学期，优先返回该学期的
    if (semester) {
      const [semesterRows] = await pool.execute(
        `SELECT * FROM portfolio_comments
         WHERE student_id = ? AND semester = ? AND comment_type = ?
         LIMIT 1`,
        [studentId, semester, commentType]
      );
      if (semesterRows[0]) {
        return semesterRows[0];
      }
    }

    return rows[0] || null;
  }

  // 更新评语
  static async update(id, commentData) {
    const { semester, commentType, content, commentStyle, source } = commentData;

    const fields = [];
    const params = [];

    if (semester !== undefined) {
      fields.push('semester = ?');
      params.push(semester);
    }
    if (commentType !== undefined) {
      fields.push('comment_type = ?');
      params.push(commentType);
    }
    if (content !== undefined) {
      fields.push('content = ?');
      params.push(content);
    }
    if (commentStyle !== undefined) {
      fields.push('comment_style = ?');
      params.push(commentStyle);
    }
    if (source !== undefined) {
      fields.push('source = ?');
      params.push(source);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = NOW()');
    params.push(id);

    await pool.execute(
      `UPDATE portfolio_comments SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
  }

  // 删除评语
  static async delete(id) {
    await pool.execute('DELETE FROM portfolio_comments WHERE id = ?', [id]);
  }

  // 获取班级某学期评语列表
  static async getClassComments(classId, semester, commentType = 'general') {
    let query = `SELECT pc.*, u.name as student_name, u.student_id as student_no
                 FROM portfolio_comments pc
                 INNER JOIN users u ON pc.student_id = u.id
                 WHERE pc.class_id = ?`;
    const params = [classId];

    if (semester) {
      query += ' AND pc.semester = ?';
      params.push(semester);
    }
    if (commentType) {
      query += ' AND pc.comment_type = ?';
      params.push(commentType);
    }

    query += ' ORDER BY u.name ASC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }
}

module.exports = PortfolioComment;
