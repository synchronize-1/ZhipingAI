const express = require('express');
const router = express.Router();
const User = require('../models/User.model');
const { generateToken, verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authRateLimit } = require('../middleware/rateLimit');
const { success, fail, ErrorCode } = require('../utils/response');

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

    const user = await User.findByUsername(username);
    if (!user) {
      return fail(res, '用户名或密码错误', ErrorCode.UNAUTHORIZED);
    }

    const isValid = await User.verifyPassword(password, user.password);
    if (!isValid) {
      return fail(res, '用户名或密码错误', ErrorCode.UNAUTHORIZED);
    }

    const token = generateToken(user);

    // 特殊处理：将student001的用户名改为"christie"
    const displayName = user.username === 'student001' ? 'christie' : user.name;

    return success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: displayName,
        role: user.role,
        avatar: user.avatar,
        department: user.department
      }
    }, '登录成功');
  } catch (error) {
    console.error('登录错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
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

    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return fail(res, '用户名已存在', ErrorCode.CONFLICT);
    }

    const userId = await User.create({
      username, password, name, role, email, phone, department, studentId, employeeId
    });

    return success(res, { userId }, '注册成功');
  } catch (error) {
    console.error('注册错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

// 获取当前用户信息
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return fail(res, '用户不存在', ErrorCode.NOT_FOUND);
    }

    if (user.username === 'student001') {
      user.name = 'christie';
    }

    return success(res, user);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

// 修改密码
router.put(
  '/password',
  verifyToken,
  validate({
    body: {
      oldPassword: { required: true, type: 'string', min: 1, max: 100, trim: false },
      newPassword: { required: true, type: 'string', min: 1, max: 100, trim: false }
    }
  }),
  async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findByUsername(req.user.username);
    const isValid = await User.verifyPassword(oldPassword, user.password);

    if (!isValid) {
      return fail(res, '原密码错误', ErrorCode.PARAM_VALIDATION);
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const pool = require('../config/database');
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    return success(res, null, '密码修改成功');
  } catch (error) {
    console.error('修改密码错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

// 刷新Token
router.post('/refresh', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const token = generateToken(user);

    return success(res, { token });
  } catch (error) {
    console.error('刷新Token错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

module.exports = router;