const pool = require('../config/database');

class Exam {
  // 创建考试
  static async create(examData) {
    const { name, examType, grade, examDate, semester, status, createdBy } = examData;

    const [result] = await pool.execute(
      `INSERT INTO exams (name, exam_type, grade, exam_date, semester, status, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name, examType || 'regular', grade, examDate, semester, status !== undefined ? status : 1, createdBy || null]
    );

    return result.insertId;
  }

  // 根据ID查询
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM exams WHERE id = ?', [id]);
    return rows[0];
  }

  // 分页查询列表
  static async getAll({ page = 1, pageSize = 10, examType, grade, status, keyword }) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(pageSize) || 10;
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT * FROM exams';
    let countQuery = 'SELECT COUNT(*) as total FROM exams';
    const whereConditions = [];
    const params = [];

    if (examType) {
      whereConditions.push('exam_type = ?');
      params.push(examType);
    }
    if (grade) {
      whereConditions.push('grade = ?');
      params.push(grade);
    }
    if (status !== undefined && status !== null && status !== '') {
      whereConditions.push('status = ?');
      params.push(status);
    }
    if (keyword) {
      whereConditions.push('name LIKE ?');
      params.push(`%${keyword}%`);
    }

    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY exam_date DESC, created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, params);

    return {
      list: rows,
      total: countResult[0].total,
      page: pageNum,
      pageSize: limitNum
    };
  }

  // 更新考试
  static async update(id, examData) {
    const { name, examType, grade, examDate, semester, status } = examData;

    const fields = [];
    const params = [];

    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }
    if (examType !== undefined) {
      fields.push('exam_type = ?');
      params.push(examType);
    }
    if (grade !== undefined) {
      fields.push('grade = ?');
      params.push(grade);
    }
    if (examDate !== undefined) {
      fields.push('exam_date = ?');
      params.push(examDate);
    }
    if (semester !== undefined) {
      fields.push('semester = ?');
      params.push(semester);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      params.push(status);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = NOW()');
    params.push(id);

    await pool.execute(
      `UPDATE exams SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
  }

  // 删除考试
  static async delete(id) {
    await pool.execute('DELETE FROM exams WHERE id = ?', [id]);
  }

  // 按年级查询考试
  static async getByGrade(grade) {
    const [rows] = await pool.execute(
      'SELECT * FROM exams WHERE grade = ? ORDER BY exam_date DESC',
      [grade]
    );
    return rows;
  }

  // 获取考试科目列表
  static async getExamSubjects(examId) {
    const [rows] = await pool.execute(
      `SELECT es.*, s.name as subject_name, s.code as subject_code
       FROM exam_subjects es
       INNER JOIN subjects s ON es.subject_id = s.id
       WHERE es.exam_id = ?
       ORDER BY s.id`,
      [examId]
    );
    return rows;
  }

  // 添加考试科目
  static async addSubject(examId, subjectData) {
    const { subjectId, fullScore, passScore, examDuration } = subjectData;

    const [result] = await pool.execute(
      `INSERT INTO exam_subjects (exam_id, subject_id, full_score, pass_score, exam_duration)
       VALUES (?, ?, ?, ?, ?)`,
      [examId, subjectId, fullScore || 100, passScore || 60, examDuration || null]
    );

    return result.insertId;
  }

  // 移除考试科目
  static async removeSubject(examId, subjectId) {
    await pool.execute(
      'DELETE FROM exam_subjects WHERE exam_id = ? AND subject_id = ?',
      [examId, subjectId]
    );
  }
}

module.exports = Exam;
