const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authRateLimit } = require('../middleware/rateLimit');

// 用户登录
router.post(
  '/login',
  authRateLimit,
  validate({
    body: {
      username: { required: true, type: 'string', min: 1, max: 50 },
      password: { required: true, type: 'string', min: 1, max: 100, trim: false }
    }
  }),
  async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }
    
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    
    const isValid = await User.verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    
    const token = generateToken(user);
    
    // 特殊处理：将student001的用户名改为"christie"
    const displayName = user.username === 'student001' ? 'christie' : user.name;
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: displayName,
          role: user.role,
          avatar: user.avatar,
          department: user.department
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 用户注册
router.post(
  '/register',
  authRateLimit,
  validate({
    body: {
      username: { required: true, type: 'string', min: 3, max: 50 },
      password: { required: true, type: 'string', min: 6, max: 100, trim: false },
      name: { required: true, type: 'string', min: 1, max: 50 },
      role: { required: true, type: 'string', enum: ['student', 'teacher', 'admin'] },
      email: { type: 'string', max: 100 },
      phone: { type: 'string', max: 20 }
    }
  }),
  async (req, res) => {
  try {
    const { username, password, name, role, email, phone, department, studentId, employeeId } = req.body;
    
    if (!username || !password || !name || !role) {
      return res.status(400).json({ success: false, message: '必填字段不能为空' });
    }
    
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }
    
    const userId = await User.create({
      username, password, name, role, email, phone, department, studentId, employeeId
    });
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: { userId }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取当前用户信息
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    if (user.username === 'student001') {
      user.name = 'christie';
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 修改密码
router.put('/password', verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    const user = await User.findByUsername(req.user.username);
    const isValid = await User.verifyPassword(oldPassword, user.password);
    
    if (!isValid) {
      return res.status(400).json({ success: false, message: '原密码错误' });
    }
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const pool = require('../config/database');
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
    
    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 刷新Token
router.post('/refresh', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const token = generateToken(user);
    
    res.json({ success: true, data: { token } });
  } catch (error) {
    console.error('刷新Token错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
