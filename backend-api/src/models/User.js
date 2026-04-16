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

  // 更新用户信息
  static async update(id, userData) {
    const { name, email, phone, avatar, department } = userData;
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, phone = ?, avatar = ?, department = ?, updated_at = NOW() WHERE id = ?',
      [name, email, phone, avatar, department, id]
    );
  }

  // 获取用户列表
  static async getAll(page = 1, limit = 10, role = null) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    
    let query = 'SELECT id, username, name, role, email, phone, avatar, department, student_id, employee_id, created_at FROM users';
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    const params = [];
    
    if (role) {
      query += ' WHERE role = ?';
      countQuery += ' WHERE role = ?';
      params.push(role);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;
    
    const [rows] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, role ? [role] : []);
    
    return {
      data: rows,
      total: countResult[0].total,
      page: pageNum,
      limit: limitNum
    };
  }

  // 更新用户偏好设置
  static async updatePreferences(userId, preferences) {
    await pool.execute(
      'UPDATE users SET preferences = ? WHERE id = ?',
      [JSON.stringify(preferences), userId]
    );
  }
}

module.exports = User;
