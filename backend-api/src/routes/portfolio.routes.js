const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { success, fail, paginate, ErrorCode } = require('../utils/response');
const PortfolioService = require('../services/portfolio.service');

// ==================== 成长档案总览 ====================

// 获取学生成长档案总览
router.get('/overview/:studentId', verifyToken, checkRole('admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  // 学生只能查看自己的成长档案
  if (req.user.role === 'student' && String(req.params.studentId) !== String(req.user.id)) {
    return fail(res, '无权查看他人成长档案', ErrorCode.FORBIDDEN);
  }

  const overview = await PortfolioService.getPortfolioOverview(req.params.studentId);
  success(res, overview);
}));

// ==================== 技能管理 ====================

// 获取学生技能列表
router.get('/skills/student/:studentId', verifyToken, checkRole('admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  // 学生只能查看自己的技能
  if (req.user.role === 'student' && String(req.params.studentId) !== String(req.user.id)) {
    return fail(res, '无权查看他人技能记录', ErrorCode.FORBIDDEN);
  }

  const { page, pageSize, category } = req.query;
  const result = await PortfolioService.getStudentSkills(req.params.studentId, {
    page, pageSize, category
  });
  paginate(res, result.list, result.total, result.page, result.pageSize);
}));

// 添加技能记录
router.post('/skills', verifyToken, checkRole('admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  const { studentId } = req.body;

  // 学生只能给自己添加技能
  if (req.user.role === 'student') {
    if (studentId && String(studentId) !== String(req.user.id)) {
      return fail(res, '无权为他人添加技能记录', ErrorCode.FORBIDDEN);
    }
    const targetStudentId = studentId || req.user.id;
    const result = await PortfolioService.addSkill(targetStudentId, req.body, null);
    return success(res, result, '技能添加成功，等待教师审核');
  }

  // 教师/管理员添加（直接认证）
  if (!studentId) {
    return fail(res, '学生ID不能为空', ErrorCode.PARAM_VALIDATION);
  }
  const result = await PortfolioService.addSkill(studentId, req.body, req.user.id);
  success(res, result, '技能添加成功');
}));

// 更新技能
router.put('/skills/:id', verifyToken, checkRole('admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  await PortfolioService.updateSkill(req.params.id, req.body, req.user.id, req.user.role);
  success(res, null, '技能更新成功');
}));

// 删除技能
router.delete('/skills/:id', verifyToken, checkRole('admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  await PortfolioService.deleteSkill(req.params.id, req.user.id, req.user.role);
  success(res, null, '技能删除成功');
}));

// 技能统计
router.get('/skills/stats/:studentId', verifyToken, checkRole('admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  // 学生只能查看自己的统计
  if (req.user.role === 'student' && String(req.params.studentId) !== String(req.user.id)) {
    return fail(res, '无权查看他人技能统计', ErrorCode.FORBIDDEN);
  }

  const stats = await PortfolioService.getSkillStats(req.params.studentId);
  success(res, stats);
}));

// ==================== 荣誉管理 ====================

// 获取学生荣誉列表
router.get('/honors/student/:studentId', verifyToken, checkRole('admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  // 学生只能查看自己的荣誉
  if (req.user.role === 'student' && String(req.params.studentId) !== String(req.user.id)) {
    return fail(res, '无权查看他人荣誉记录', ErrorCode.FORBIDDEN);
  }

  const { page, pageSize, honorType, level } = req.query;
  const result = await PortfolioService.getStudentHonors(req.params.studentId, {
    page, pageSize, honorType, level
  });
  paginate(res, result.list, result.total, result.page, result.pageSize);
}));

// 添加荣誉记录
router.post('/honors', verifyToken, checkRole('admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  const { studentId } = req.body;

  // 学生只能给自己添加荣誉
  if (req.user.role === 'student') {
    if (studentId && String(studentId) !== String(req.user.id)) {
      return fail(res, '无权为他人添加荣誉记录', ErrorCode.FORBIDDEN);
    }
    const targetStudentId = studentId || req.user.id;
    const result = await PortfolioService.addHonor(targetStudentId, req.body, null);
    return success(res, result, '荣誉添加成功，等待教师审核');
  }

  // 教师/管理员添加（直接认证）
  if (!studentId) {
    return fail(res, '学生ID不能为空', ErrorCode.PARAM_VALIDATION);
  }
  const result = await PortfolioService.addHonor(studentId, req.body, req.user.id);
  success(res, result, '荣誉添加成功');
}));

// 更新荣誉
router.put('/honors/:id', verifyToken, checkRole('admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  await PortfolioService.updateHonor(req.params.id, req.body, req.user.id, req.user.role);
  success(res, null, '荣誉更新成功');
}));

// 删除荣誉
router.delete('/honors/:id', verifyToken, checkRole('admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  await PortfolioService.deleteHonor(req.params.id, req.user.id, req.user.role);
  success(res, null, '荣誉删除成功');
}));

// 荣誉统计
router.get('/honors/stats/:studentId', verifyToken, checkRole('admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  // 学生只能查看自己的统计
  if (req.user.role === 'student' && String(req.params.studentId) !== String(req.user.id)) {
    return fail(res, '无权查看他人荣誉统计', ErrorCode.FORBIDDEN);
  }

  const stats = await PortfolioService.getHonorStats(req.params.studentId);
  success(res, stats);
}));

// ==================== 心理健康 ====================

// 获取心理健康记录
router.get('/mental-health/student/:studentId', verifyToken, checkRole('admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  // 学生只能查看自己的心理健康记录
  if (req.user.role === 'student' && String(req.params.studentId) !== String(req.user.id)) {
    return fail(res, '无权查看他人心理健康记录', ErrorCode.FORBIDDEN);
  }

  const { page, pageSize, assessmentType } = req.query;
  const result = await PortfolioService.getMentalHealthRecords(req.params.studentId, {
    page, pageSize, assessmentType
  });
  paginate(res, result.list, result.total, result.page, result.pageSize);
}));

// 添加心理健康记录（仅教师/管理员）
router.post('/mental-health', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) {
    return fail(res, '学生ID不能为空', ErrorCode.PARAM_VALIDATION);
  }

  const result = await PortfolioService.addMentalHealthRecord(studentId, req.body, req.user.id);
  success(res, result, '心理健康记录添加成功');
}));

// 更新心理健康记录
router.put('/mental-health/:id', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  await PortfolioService.updateMentalHealthRecord(req.params.id, req.body, req.user.role);
  success(res, null, '心理健康记录更新成功');
}));

// 删除心理健康记录
router.delete('/mental-health/:id', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  await PortfolioService.deleteMentalHealthRecord(req.params.id, req.user.role);
  success(res, null, '心理健康记录删除成功');
}));

// 心理趋势
router.get('/mental-health/trend/:studentId', verifyToken, checkRole('admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  // 学生只能查看自己的心理趋势
  if (req.user.role === 'student' && String(req.params.studentId) !== String(req.user.id)) {
    return fail(res, '无权查看他人心理趋势数据', ErrorCode.FORBIDDEN);
  }

  const trend = await PortfolioService.getMentalHealthTrend(req.params.studentId);
  success(res, trend);
}));

// ==================== 评语管理 ====================

// 获取学生评语
router.get('/comments/student/:studentId', verifyToken, checkRole('admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  // 学生只能查看自己的评语
  if (req.user.role === 'student' && String(req.params.studentId) !== String(req.user.id)) {
    return fail(res, '无权查看他人评语', ErrorCode.FORBIDDEN);
  }

  const { page, pageSize, semester, commentType } = req.query;
  const result = await PortfolioService.getStudentComments(req.params.studentId, {
    page, pageSize, semester, commentType
  });
  paginate(res, result.list, result.total, result.page, result.pageSize);
}));

// 获取最新评语
router.get('/comments/latest/:studentId', verifyToken, checkRole('admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  // 学生只能查看自己的评语
  if (req.user.role === 'student' && String(req.params.studentId) !== String(req.user.id)) {
    return fail(res, '无权查看他人评语', ErrorCode.FORBIDDEN);
  }

  const { semester } = req.query;
  const comment = await PortfolioService.getLatestComment(req.params.studentId, semester || null);
  success(res, comment);
}));

// 添加评语（仅教师/管理员）
router.post('/comments', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) {
    return fail(res, '学生ID不能为空', ErrorCode.PARAM_VALIDATION);
  }

  const result = await PortfolioService.addComment(studentId, req.body, req.user.id);
  success(res, result, '评语添加成功');
}));

// 更新评语（仅教师/管理员）
router.put('/comments/:id', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  await PortfolioService.updateComment(req.params.id, req.body, req.user.role);
  success(res, null, '评语更新成功');
}));

// 删除评语（仅教师/管理员）
router.delete('/comments/:id', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  await PortfolioService.deleteComment(req.params.id, req.user.role);
  success(res, null, '评语删除成功');
}));

// ==================== 班级成长档案（教师/管理员） ====================

// 获取班级学生成长档案列表
router.get('/class/:classId', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const { page, pageSize, keyword } = req.query;
  const result = await PortfolioService.getClassPortfolioList(req.params.classId, {
    page, pageSize, keyword
  });
  paginate(res, result.list, result.total, result.page, result.pageSize);
}));

module.exports = router;
