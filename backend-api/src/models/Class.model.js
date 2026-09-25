const pool = require('../config/database');

class Class {
  // 创建班级
  static async create(classData) {
    const { name, grade, headTeacherId, studentCount, department } = classData;

    const [result] = await pool.execute(
      `INSERT INTO classes (name, grade, head_teacher_id, student_count, department, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [name, grade || null, headTeacherId || null, studentCount || 0, department || null]
    );

    return result.insertId;
  }

  // 根据ID查询
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM classes WHERE id = ?', [id]);
    return rows[0];
  }

  // 分页查询
  static async getAll({ page = 1, pageSize = 10, grade, department, keyword }) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(pageSize) || 10;
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT * FROM classes';
    let countQuery = 'SELECT COUNT(*) as total FROM classes';
    const whereConditions = [];
    const params = [];

    if (grade) {
      whereConditions.push('grade = ?');
      params.push(grade);
    }
    if (department) {
      whereConditions.push('department = ?');
      params.push(department);
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

    query += ` ORDER BY grade, id ASC LIMIT ${limitNum} OFFSET ${offset}`;

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
  static async update(id, classData) {
    const { name, grade, headTeacherId, studentCount, department } = classData;

    const fields = [];
    const params = [];

    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }
    if (grade !== undefined) {
      fields.push('grade = ?');
      params.push(grade);
    }
    if (headTeacherId !== undefined) {
      fields.push('head_teacher_id = ?');
      params.push(headTeacherId);
    }
    if (studentCount !== undefined) {
      fields.push('student_count = ?');
      params.push(studentCount);
    }
    if (department !== undefined) {
      fields.push('department = ?');
      params.push(department);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = NOW()');
    params.push(id);

    await pool.execute(
      `UPDATE classes SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
  }

  // 删除
  static async delete(id) {
    await pool.execute('DELETE FROM classes WHERE id = ?', [id]);
  }

  // 按年级查询班级列表
  static async getByGrade(grade) {
    const [rows] = await pool.execute(
      'SELECT * FROM classes WHERE grade = ? ORDER BY id ASC',
      [grade]
    );
    return rows;
  }

  // 获取所有班级精简列表
  static async getAllSimple() {
    const [rows] = await pool.execute(
      'SELECT id, name, grade FROM classes ORDER BY grade, id ASC'
    );
    return rows;
  }

  // 获取班级各学科教师
  static async getSubjectTeachers(classId) {
    const [rows] = await pool.execute(
      `SELECT cst.id, cst.subject_id, s.name as subject_name, s.code as subject_code,
              cst.teacher_id, u.name as teacher_name
       FROM class_subject_teachers cst
       INNER JOIN subjects s ON cst.subject_id = s.id
       INNER JOIN users u ON cst.teacher_id = u.id
       WHERE cst.class_id = ?
       ORDER BY s.id`,
      [classId]
    );
    return rows;
  }
}

module.exports = Class;
