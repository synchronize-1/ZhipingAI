const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // 创建用户
  static async create(userData) {
    const { username, password, name, role, email, phone, avatar, department, studentId, employeeId } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      `INSERT INTO users (username, password, name, role, email, phone, avatar, department, student_id, employee_id, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [username, hashedPassword, name, role, email, phone, avatar, department, studentId, employeeId]
    );
    
    return result.insertId;
  }

  // 根据用户名查找
  static async findByUsername(username) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  }

  // 根据ID查找
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, username, name, role, email, phone, avatar, department, student_id, employee_id, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // 验证密码
  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // 更新用户信息（支持更多字段）
  static async update(id, userData) {
    const fields = [];
    const params = [];

    const allowedFields = [
      'name', 'role', 'email', 'phone', 'avatar',
      'department', 'class_id', 'status', 'student_id', 'employee_id'
    ];

    for (const field of allowedFields) {
      // 将驼峰参数映射为蛇形字段名
      const camelKey = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      const value = userData[field] !== undefined ? userData[field] : userData[camelKey];
      if (value !== undefined) {
        fields.push(`${field} = ?`);
        params.push(value);
      }
    }

    if (fields.length === 0) return;

    fields.push('updated_at = NOW()');
    params.push(id);

    await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
  }

  // 获取用户列表（分页、筛选、关联班级名称）
  static async getUserList({ page = 1, pageSize = 10, role, classId, keyword, status }) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(pageSize) || 10;
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT u.id, u.username, u.name, u.role, u.email, u.phone,
             u.avatar, u.department, u.student_id, u.employee_id,
             u.class_id, u.status, u.created_at,
             c.name as class_name
      FROM users u
      LEFT JOIN classes c ON u.class_id = c.id
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM users u';
    const whereConditions = [];
    const params = [];

    if (role) {
      whereConditions.push('u.role = ?');
      params.push(role);
    }
    if (classId) {
      whereConditions.push('u.class_id = ?');
      params.push(classId);
    }
    if (keyword) {
      whereConditions.push('(u.username LIKE ? OR u.name LIKE ? OR u.student_id LIKE ? OR u.employee_id LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw, kw);
    }
    if (status !== undefined && status !== '' && status !== null) {
      whereConditions.push('u.status = ?');
      params.push(status);
    }

    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY u.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, params);

    return {
      list: rows,
      total: countResult[0].total,
      page: pageNum,
      pageSize: limitNum
    };
  }

  // 更新用户偏好设置
  static async updatePreferences(userId, preferences) {
    await pool.execute(
      'UPDATE users SET preferences = ? WHERE id = ?',
      [JSON.stringify(preferences), userId]
    );
  }

  // 根据学号查找学生
  static async findByStudentId(studentId) {
    const [rows] = await pool.execute(
      'SELECT id, username, name, role, student_id, class_id FROM users WHERE student_id = ? AND role = ?',
      [studentId, 'student']
    );
    return rows[0];
  }

  // 获取指定班级的所有学生
  static async getStudentsByClassId(classId) {
    const [rows] = await pool.execute(
      'SELECT id, username, name, student_id, class_id FROM users WHERE class_id = ? AND role = ? ORDER BY student_id ASC',
      [classId, 'student']
    );
    return rows;
  }

  // 根据工号查找教师
  static async findByEmployeeId(employeeId) {
    const [rows] = await pool.execute(
      'SELECT id, username, name, role, employee_id, department FROM users WHERE employee_id = ? AND role = ?',
      [employeeId, 'teacher']
    );
    return rows[0];
  }

  // 获取用户详情（含班级名称）
  static async getDetailById(id) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.name, u.role, u.email, u.phone,
              u.avatar, u.department, u.student_id, u.employee_id,
              u.class_id, u.status, u.preferences, u.created_at, u.updated_at,
              c.name as class_name
       FROM users u
       LEFT JOIN classes c ON u.class_id = c.id
       WHERE u.id = ?`,
      [id]
    );
    return rows[0];
  }

  // 统计角色数量
  static async countByRole(role) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = ?',
      [role]
    );
    return rows[0].count;
  }

  // 更新状态
  static async updateStatus(id, status) {
    await pool.execute(
      'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
  }

  // 删除用户
  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // 更新密码
  static async updatePassword(id, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, id]
    );
  }

  // 批量更新班级（仅学生）
  static async batchUpdateClass(userIds, classId) {
    if (!Array.isArray(userIds) || userIds.length === 0) return 0;
    const placeholders = userIds.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE users SET class_id = ?, updated_at = NOW() WHERE id IN (${placeholders}) AND role = ?`,
      [classId, ...userIds, 'student']
    );
    return result.affectedRows;
  }

  // 根据ID列表获取用户
  static async findByIds(userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) return [];
    const placeholders = userIds.map(() => '?').join(',');
    const [rows] = await pool.execute(
      `SELECT id, username, name, role, student_id, employee_id, status FROM users WHERE id IN (${placeholders})`,
      userIds
    );
    return rows;
  }
}

module.exports = User;
