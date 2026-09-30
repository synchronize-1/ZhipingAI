const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { success, paginate } = require('../utils/response');
const { validate } = require('../middleware/validate');
const ElectiveService = require('../services/elective.service');
const NotificationService = require('../services/notification.service');

const STATUSES = ['draft', 'open', 'closed'];

// 发布选修课参数校验
const createSchema = {
  body: {
    name: { required: true, type: 'string', min: 1, max: 100 },
    code: { type: 'string', max: 50 },
    category: { type: 'string', max: 30 },
    semester: { required: true, type: 'string', min: 1, max: 20 },
    teacherId: { type: 'integer', min: 1 },
    subjectId: { type: 'integer', min: 1 },
    grade: { type: 'string', max: 20 },
    capacity: { required: true, type: 'integer', min: 1, max: 9999 },
    credit: { type: 'number', min: 0, max: 99 },
    location: { type: 'string', max: 100 },
    scheduleText: { type: 'string', max: 100 },
    selectStart: { type: 'string', max: 30 },
    selectEnd: { type: 'string', max: 30 },
    status: { type: 'string', enum: STATUSES },
    description: { type: 'string', max: 500 }
  }
};

// 修改选修课参数校验（部分更新）
const updateSchema = {
  body: {
    name: { type: 'string', min: 1, max: 100 },
    code: { type: 'string', max: 50 },
    category: { type: 'string', max: 30 },
    semester: { type: 'string', min: 1, max: 20 },
    teacherId: { type: 'integer', min: 1 },
    subjectId: { type: 'integer', min: 1 },
    grade: { type: 'string', max: 20 },
    capacity: { type: 'integer', min: 1, max: 9999 },
    credit: { type: 'number', min: 0, max: 99 },
    location: { type: 'string', max: 100 },
    scheduleText: { type: 'string', max: 100 },
    selectStart: { type: 'string', max: 30 },
    selectEnd: { type: 'string', max: 30 },
    status: { type: 'string', enum: STATUSES },
    description: { type: 'string', max: 500 }
  }
};

const listSchema = {
  query: {
    page: { type: 'integer', min: 1, default: 1 },
    pageSize: { type: 'integer', min: 1, max: 100, default: 10 },
    semester: { type: 'string', max: 20 },
    status: { type: 'string', enum: STATUSES },
    category: { type: 'string', max: 30 },
    keyword: { type: 'string', max: 100 },
    teacherId: { type: 'integer', min: 1 },
    grade: { type: 'string', max: 20 }
  }
};

// 公开筛选选项（类别 / 学期）
router.get('/categories', verifyToken, asyncHandler(async (req, res) => {
  const data = await ElectiveService.filters();
  success(res, data);
}));

// 表单选项（学期 / 学科 / 教师 / 年级）
router.get('/options', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const data = await ElectiveService.options();
  success(res, data);
}));

// 选课统计（管理员 / 教师）
router.get('/stats', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const data = await ElectiveService.stats();
  success(res, data);
}));

// 当前登录学生的选课记录
router.get('/my', verifyToken, asyncHandler(async (req, res) => {
  const data = await ElectiveService.mySelections(req.user);
  success(res, data);
}));

// 选修课列表（学生仅见开放课程，含 hasSelected / canSelect）
router.get('/', verifyToken, validate(listSchema), asyncHandler(async (req, res) => {
  const { page, pageSize, semester, status, category, keyword, teacherId, grade, mine } = req.query;
  const result = await ElectiveService.list(
    { page, pageSize, semester, status, category, keyword, teacherId, grade, mine },
    req.user
  );
  paginate(res, result.list, result.total, result.page, result.pageSize);
}));

// 选课名单（管理员 / 教师）
router.get('/:id/students', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const data = await ElectiveService.students(req.params.id, { status: req.query.status });
  success(res, data);
}));

// 课程详情
router.get('/:id', verifyToken, asyncHandler(async (req, res) => {
  const data = await ElectiveService.detail(req.params.id, req.user);
  success(res, data);
}));

// 发布选修课
router.post('/', verifyToken, checkRole('admin', 'teacher'), validate(createSchema), asyncHandler(async (req, res) => {
  res.locals.targetType = 'elective_course';
  const data = await ElectiveService.create(req.body, req.user);
  success(res, data, '选修课已创建');
}));

// 修改选修课
router.put('/:id', verifyToken, checkRole('admin', 'teacher'), validate(updateSchema), asyncHandler(async (req, res) => {
  res.locals.targetType = 'elective_course';
  const data = await ElectiveService.update(req.params.id, req.body, req.user);
  success(res, data, '选修课已更新');
}));

// 删除选修课
router.delete('/:id', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  res.locals.targetType = 'elective_course';
  await ElectiveService.remove(req.params.id, req.user);
  success(res, null, '选修课已删除');
}));

// 学生选课
router.post('/:id/select', verifyToken, checkRole('student'), asyncHandler(async (req, res) => {
  res.locals.targetType = 'elective_selection';
  const data = await ElectiveService.select(req.params.id, req.user);
  NotificationService.create({
    title: '选课成功',
    content: `你已成功选修《${data.name || '选修课'}》，可在选课中心查看课程详情。`,
    type: 'elective',
    userId: req.user.id,
    createdBy: req.user.id
  }).catch(() => { /* 通知失败不影响选课主流程 */ });
  success(res, data, '选课成功');
}));

// 学生退选
router.delete('/:id/select', verifyToken, checkRole('student'), asyncHandler(async (req, res) => {
  res.locals.targetType = 'elective_selection';
  const data = await ElectiveService.drop(req.params.id, req.user);
  NotificationService.create({
    title: '退选成功',
    content: `你已退选《${data.name || '选修课'}》，名额已释放。`,
    type: 'elective',
    userId: req.user.id,
    createdBy: req.user.id
  }).catch(() => { /* 通知失败不影响退选主流程 */ });
  success(res, data, '已退选');
}));

module.exports = router;