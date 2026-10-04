const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User.model');
const UserService = require('../services/user.service');
const { verifyToken, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { success, fail, ErrorCode } = require('../utils/response');

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

const idParam = {
  id: { required: true, type: 'integer', min: 1 }
};

// 获取用户列表（管理员）
router.get('/', verifyToken, checkRole('admin'), validate({
  query: {
    page: { type: 'integer', min: 1, max: 200, default: 1 },
    limit: { type: 'integer', min: 1, max: 200, default: 10 },
    role: { type: 'string', enum: ['admin', 'teacher', 'student'] }
  }
}), async (req, res) => {
  try {
    const { page, limit, role } = req.query;
    const result = await User.getAll(page, limit, role);
    return success(res, result);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

// 获取用户详情
router.get('/:id', verifyToken, validate({ params: idParam }), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return fail(res, '用户不存在', ErrorCode.NOT_FOUND);
    }
    return success(res, user);
  } catch (error) {
    console.error('获取用户详情错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

// 更新用户信息
router.put('/:id', verifyToken, validate({
  params: idParam,
  body: {
    name: { type: 'string', max: 50 },
    role: { type: 'string', enum: ['admin', 'teacher', 'student'] },
    email: { type: 'string', max: 100 },
    phone: { type: 'string', max: 20 },
    avatar: { type: 'string', max: 255 },
    department: { type: 'string', max: 100 },
    class_id: { type: 'integer', min: 1 },
    classId: { type: 'integer', min: 1 },
    status: { type: 'integer', min: 0, max: 1 },
    student_id: { type: 'string', max: 50 },
    employee_id: { type: 'string', max: 50 }
  }
}), async (req, res) => {
  try {
    // 只能修改自己的信息，管理员可以修改任何人
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return fail(res, '权限不足', ErrorCode.FORBIDDEN);
    }

    await User.update(req.params.id, req.body);
    return success(res, null, '更新成功');
  } catch (error) {
    console.error('更新用户信息错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

// 更新用户偏好设置
router.put('/:id/preferences', verifyToken, validate({ params: idParam }), async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return fail(res, '权限不足', ErrorCode.FORBIDDEN);
    }

    await User.updatePreferences(req.params.id, req.body);
    return success(res, null, '偏好设置已更新');
  } catch (error) {
    console.error('更新偏好设置错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

// 获取用户的个性化首页数据
router.get('/:id/dashboard', verifyToken, validate({ params: idParam }), async (req, res) => {
  try {
    const dashboardData = await UserService.getDashboard(req.params.id);
    return success(res, dashboardData);
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return fail(res, error.message, ErrorCode.NOT_FOUND);
    }
    console.error('获取首页数据错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

// 上传头像
router.post('/:id/avatar', verifyToken, validate({ params: idParam }), upload.single('avatar'), async (req, res) => {
  try {
    // 只能修改自己的头像，管理员可以修改任何人
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return fail(res, '权限不足', ErrorCode.FORBIDDEN);
    }

    if (!req.file) {
      return fail(res, '请选择图片文件', ErrorCode.PARAM_VALIDATION);
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

    return success(res, { avatar: avatarUrl }, '头像上传成功');
  } catch (error) {
    console.error('上传头像错误:', error);
    // 如果出错，删除已上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return fail(res, error.message || '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

// 删除头像
router.delete('/:id/avatar', verifyToken, validate({ params: idParam }), async (req, res) => {
  try {
    // 只能删除自己的头像，管理员可以删除任何人
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return fail(res, '权限不足', ErrorCode.FORBIDDEN);
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return fail(res, '用户不存在', ErrorCode.NOT_FOUND);
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

    return success(res, null, '头像已删除');
  } catch (error) {
    console.error('删除头像错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

module.exports = router;