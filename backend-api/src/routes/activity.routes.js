const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { success, paginate } = require('../utils/response');
const ActivityService = require('../services/activity.service');
const NotificationService = require('../services/notification.service');

// 活动类型字典
router.get('/categories', verifyToken, asyncHandler(async (req, res) => {
  success(res, { categories: ActivityService.getCategories() });
}));

// 活动统计（管理员 / 教师看板）
router.get('/stats', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const data = await ActivityService.stats();
  success(res, data);
}));

// 当前登录用户的报名记录
router.get('/my', verifyToken, asyncHandler(async (req, res) => {
  const list = await ActivityService.myActivities(req.user);
  success(res, list);
}));

// 活动列表（全体角色，学生可看到 hasJoined / canRegister）
router.get('/', verifyToken, asyncHandler(async (req, res) => {
  const { page, pageSize, category, status, keyword } = req.query;
  const result = await ActivityService.list({ page, pageSize, category, status, keyword }, req.user);
  paginate(res, result.list, result.total, result.page, result.pageSize);
}));

// 报名管理：某活动的报名名单（管理员 / 教师）
router.get('/:id/registrations', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const data = await ActivityService.registrations(req.params.id, { status: req.query.status });
  success(res, data);
}));

// 活动详情
router.get('/:id', verifyToken, asyncHandler(async (req, res) => {
  const data = await ActivityService.detail(req.params.id, req.user);
  success(res, data);
}));

// 发布活动
router.post('/', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const data = await ActivityService.create(req.body, req.user);
  success(res, data, '活动发布成功');
}));

// 修改活动
router.put('/:id', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const data = await ActivityService.update(req.params.id, req.body, req.user);
  success(res, data, '活动已更新');
}));

// 删除活动
router.delete('/:id', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  await ActivityService.remove(req.params.id, req.user);
  success(res, null, '活动已删除');
}));

// 报名
router.post('/:id/register', verifyToken, asyncHandler(async (req, res) => {
  const data = await ActivityService.register(req.params.id, req.user);
  NotificationService.create({
    title: '活动报名成功',
    content: `你已成功报名《${data.title || '校园活动'}》，请留意活动时间准时参加。`,
    type: 'activity',
    userId: req.user.id,
    createdBy: req.user.id
  }).catch(() => { /* 通知失败不影响报名主流程 */ });
  success(res, data, '报名成功');
}));

// 取消报名
router.delete('/:id/register', verifyToken, asyncHandler(async (req, res) => {
  const data = await ActivityService.cancel(req.params.id, req.user);
  NotificationService.create({
    title: '已取消报名',
    content: `你已取消《${data.title || '校园活动'}》的报名。`,
    type: 'activity',
    userId: req.user.id,
    createdBy: req.user.id
  }).catch(() => { /* 通知失败不影响取消报名主流程 */ });
  success(res, data, '已取消报名');
}));

// 签到（管理员 / 教师）
router.put('/registrations/:registrationId/check-in', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const data = await ActivityService.checkIn(req.params.registrationId);
  success(res, data, '签到成功');
}));

module.exports = router;