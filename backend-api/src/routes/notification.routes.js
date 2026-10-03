// backend-api/src/routes/notification.routes.js
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const NotificationService = require('../services/notification.service');

const listSchema = {
  query: {
    page: { type: 'integer', min: 1, default: 1 },
    limit: { type: 'integer', min: 1, max: 100, default: 20 },
    unreadOnly: { type: 'string', enum: ['true', 'false'] },
    type: { type: 'string', enum: NotificationService.types }
  }
};

const createSchema = {
  body: {
    title: { required: true, type: 'string', min: 2, max: 200 },
    content: { type: 'string', max: 2000 },
    type: { type: 'string', enum: NotificationService.types },
    targetRole: { type: 'string', enum: ['all', 'student', 'teacher', 'admin'] },
    targetUserId: { type: 'integer', min: 1 }
  }
};

// 通知列表（按角色收敛可见范围，支持未读与类型筛选、分页）
router.get('/', verifyToken, validate(listSchema), asyncHandler(async (req, res) => {
  const { page, limit, unreadOnly, type } = req.query;
  const data = await NotificationService.listForUser(req.user, { page, limit, unreadOnly, type });
  success(res, data);
}));

// 标记单条已读
router.put('/:id/read', verifyToken, asyncHandler(async (req, res) => {
  res.locals.targetType = 'notification';
  const ok = await NotificationService.markRead(req.params.id, req.user);
  if (!ok) {
    const error = new Error('通知不存在或无权操作');
    error.name = 'NotFoundError';
    throw error;
  }
  success(res, null, '已标记为已读');
}));

// 全部已读
router.put('/read-all', verifyToken, asyncHandler(async (req, res) => {
  res.locals.targetType = 'notification';
  const affected = await NotificationService.markAllRead(req.user);
  success(res, { affected }, '已全部标记为已读');
}));

// 发布通知（管理员）
router.post('/', verifyToken, checkRole('admin'), validate(createSchema), asyncHandler(async (req, res) => {
  res.locals.targetType = 'notification';
  const { title, content, type, targetRole, targetUserId } = req.body;
  const notification = await NotificationService.create({
    title,
    content: content || null,
    type: type || 'system',
    targetRole: targetRole || null,
    userId: targetUserId || null,
    createdBy: req.user.id
  });
  res.status(201);
  success(res, { notificationId: notification.id }, '通知已发送');
}));

// 删除通知
router.delete('/:id', verifyToken, asyncHandler(async (req, res) => {
  res.locals.targetType = 'notification';
  const ok = await NotificationService.remove(req.params.id, req.user);
  if (!ok) {
    const error = new Error('通知不存在或无权操作');
    error.name = 'NotFoundError';
    throw error;
  }
  success(res, null, '通知已删除');
}));

module.exports = router;