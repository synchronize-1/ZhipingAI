const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const TimetableService = require('../services/timetable.service');
const TimetableEntry = require('../models/TimetableEntry.model');

// 节次 / 星期定义（前端渲染周课表网格）
router.get('/periods', verifyToken, asyncHandler(async (req, res) => {
  success(res, {
    periods: TimetableService.getPeriods(),
    days: TimetableService.getDays()
  });
}));

// 排课表单选项（班级 / 学科 / 教师 / 教室 / 学期）
router.get('/options', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const options = await TimetableService.getOptions();
  success(res, options);
}));

// 当前登录用户的课表（教师=自己的课表，学生=本班课表，管理员=班级概览）
router.get('/my', verifyToken, asyncHandler(async (req, res) => {
  const data = await TimetableService.getMyTimetable(req.user, { semester: req.query.semester });
  success(res, data);
}));

// 冲突预检（排课前调用，返回结构化冲突）
router.post('/check-conflict', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const result = await TimetableService.checkConflict(req.body);
  success(res, result);
}));

// 周课表视图（按班级 / 教师 / 教室查询）
router.get('/', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const { semester, classId, teacherId, roomId } = req.query;
  const data = await TimetableService.getWeekView({ semester, classId, teacherId, roomId });
  success(res, data);
}));

// 新增排课
router.post('/', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  const result = await TimetableService.createEntry(req.body, req.user.id);
  success(res, result, '排课成功');
}));

// 清空某班级课表
router.delete('/class/:classId', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  const removed = await TimetableEntry.deleteByClass(req.params.classId, req.query.semester);
  success(res, { removed }, `已清空 ${removed} 条排课`);
}));

// 修改排课
router.put('/:id', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  const entry = await TimetableService.updateEntry(req.params.id, req.body);
  success(res, entry, '排课已更新');
}));

// 删除排课
router.delete('/:id', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  await TimetableService.deleteEntry(req.params.id);
  success(res, null, '排课已删除');
}));

module.exports = router;