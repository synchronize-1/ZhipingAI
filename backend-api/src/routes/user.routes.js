const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User.model');
const { verifyToken, checkRole } = require('../middleware/auth');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/avatars';
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持 JPG、PNG 格式的图片'));
    }
  }
});

// 获取用户列表（管理员）
router.get('/', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const result = await User.getAll(parseInt(page), parseInt(limit), role);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取用户详情
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新用户信息
router.put('/:id', verifyToken, async (req, res) => {
  try {
    // 只能修改自己的信息，管理员可以修改任何人
    if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    
    await User.update(req.params.id, req.body);
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新用户偏好设置
router.put('/:id/preferences', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    
    await User.updatePreferences(req.params.id, req.body);
    res.json({ success: true, message: '偏好设置已更新' });
  } catch (error) {
    console.error('更新偏好设置错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取用户的个性化首页数据
router.get('/:id/dashboard', verifyToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    const pool = require('../config/database');
    let dashboardData = {};
    
    switch (user.role) {
      case 'student':
        // 学生首页：课表、通知、待办
        const Schedule = require('../models/Schedule.model');
        const todaySchedule = await Schedule.getTodaySchedule(userId);
        
        const [notifications] = await pool.execute(
          'SELECT * FROM notifications WHERE user_id = ? OR target_role = ? ORDER BY created_at DESC LIMIT 5',
          [userId, 'student']
        );
        
        const [todos] = await pool.execute(
          'SELECT * FROM todos WHERE user_id = ? AND status != "completed" ORDER BY due_date LIMIT 5',
          [userId]
        );
        
        dashboardData = { schedule: todaySchedule, notifications, todos };
        break;
        
      case 'teacher':
        // 教师首页：今日课程、待办、学生反馈
        const teacherSchedule = await require('../models/Schedule.model').getByTeacherId(userId);
        
        const [teacherTodos] = await pool.execute(
          'SELECT * FROM todos WHERE user_id = ? AND status != "completed" ORDER BY due_date LIMIT 5',
          [userId]
        );
        
        const [feedbacks] = await pool.execute(
          'SELECT * FROM course_feedbacks WHERE teacher_id = ? ORDER BY created_at DESC LIMIT 5',
          [userId]
        );
        
        dashboardData = { schedule: teacherSchedule, todos: teacherTodos, feedbacks };
        break;
        
      case 'admin':
        // 管理员首页：校园动态、统计数据
        const [stats] = await pool.execute(`
          SELECT 
            (SELECT COUNT(*) FROM users WHERE role = 'student') as student_count,
            (SELECT COUNT(*) FROM users WHERE role = 'teacher') as teacher_count,
            (SELECT COUNT(*) FROM repairs WHERE status = 'pending') as pending_repairs,
            (SELECT COUNT(*) FROM activities WHERE status = 'upcoming') as upcoming_activities
        `);
        
        const [recentLogs] = await pool.execute(
          'SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 10'
        );
        
        dashboardData = { stats: stats[0], recentLogs };
        break;
    }
    
    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('获取首页数据错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 上传头像
router.post('/:id/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    // 只能修改自己的头像，管理员可以修改任何人
    if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择图片文件' });
    }

    // 获取用户当前头像
    const user = await User.findById(req.params.id);
    
    // 删除旧头像文件
    if (user && user.avatar) {
      const oldAvatarPath = user.avatar.replace('/uploads/', 'uploads/');
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // 更新数据库中的头像路径
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await User.update(req.params.id, { ...user, avatar: avatarUrl });

    res.json({ 
      success: true, 
      message: '头像上传成功',
      data: { avatar: avatarUrl }
    });
  } catch (error) {
    console.error('上传头像错误:', error);
    // 如果出错，删除已上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message || '服务器错误' });
  }
});

// 删除头像
router.delete('/:id/avatar', verifyToken, async (req, res) => {
  try {
    // 只能删除自己的头像，管理员可以删除任何人
    if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 删除头像文件
    if (user.avatar) {
      const avatarPath = user.avatar.replace('/uploads/', 'uploads/');
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // 更新数据库
    await User.update(req.params.id, { ...user, avatar: null });

    res.json({ success: true, message: '头像已删除' });
  } catch (error) {
    console.error('删除头像错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
