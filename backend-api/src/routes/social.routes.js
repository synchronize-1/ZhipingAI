const express = require('express');
const router = express.Router();
const Social = require('../models/Social.model');
const { verifyToken, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { success, fail, ErrorCode } = require('../utils/response');

const idParam = {
  id: { required: true, type: 'integer', min: 1 }
};

// ========== 活动管理 ==========
router.get('/activities', verifyToken, validate({
  query: {
    page: { type: 'integer', min: 1, max: 200, default: 1 },
    limit: { type: 'integer', min: 1, max: 200, default: 10 },
    category: { type: 'string', max: 50 },
    status: { type: 'string', max: 20 }
  }
}), async (req, res) => {
  try {
    const { page, limit, category, status } = req.query;
    const result = await Social.getActivities(page, limit, category, status);
    return success(res, result);
  } catch (error) {
    console.error('获取活动列表错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

router.post('/activities', verifyToken, validate({
  body: {
    title: { required: true, type: 'string', min: 1, max: 200 },
    description: { type: 'string', max: 5000 },
    category: { type: 'string', max: 50 },
    location: { type: 'string', max: 200 },
    startTime: { required: true, type: 'string', min: 1, max: 30 },
    endTime: { type: 'string', max: 30 },
    maxParticipants: { type: 'integer', min: 0 }
  }
}), async (req, res) => {
  try {
    const activityId = await Social.createActivity({ ...req.body, organizerId: req.user.id });
    return success(res, { activityId }, '活动创建成功');
  } catch (error) {
    console.error('创建活动错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

router.post('/activities/:id/join', verifyToken, validate({ params: idParam }), async (req, res) => {
  try {
    const participantId = await Social.joinActivity(req.user.id, req.params.id);
    return success(res, { participantId }, '报名成功');
  } catch (error) {
    console.error('报名活动错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

router.get('/activities/:id/participants', verifyToken, validate({ params: idParam }), async (req, res) => {
  try {
    const participants = await Social.getActivityParticipants(req.params.id);
    return success(res, participants);
  } catch (error) {
    console.error('获取活动参与者错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

// ========== 兴趣小组 ==========
router.get('/groups', verifyToken, validate({
  query: { category: { type: 'string', max: 50 } }
}), async (req, res) => {
  try {
    const { category } = req.query;
    const groups = await Social.getInterestGroups(category);
    return success(res, groups);
  } catch (error) {
    console.error('获取兴趣小组错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

router.post('/groups/:id/join', verifyToken, validate({ params: idParam }), async (req, res) => {
  try {
    const memberId = await Social.joinGroup(req.user.id, req.params.id);
    return success(res, { memberId }, '加入成功');
  } catch (error) {
    console.error('加入小组错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

router.get('/groups/:id/members', verifyToken, validate({ params: idParam }), async (req, res) => {
  try {
    const members = await Social.getGroupMembers(req.params.id);
    return success(res, members);
  } catch (error) {
    console.error('获取小组成员错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

// ========== 学生成长档案 ==========
router.get('/growth/:studentId', verifyToken, validate({
  params: { studentId: { required: true, type: 'integer', min: 1 } }
}), async (req, res) => {
  try {
    // 只能查看自己的档案，管理员/教师可以查看所有
    if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
      return fail(res, '权限不足', ErrorCode.FORBIDDEN);
    }

    const growthRecord = await Social.getStudentGrowthRecord(req.params.studentId);
    return success(res, growthRecord);
  } catch (error) {
    console.error('获取成长档案错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

// ========== 情感化交互 ==========
router.get('/greeting', verifyToken, async (req, res) => {
  try {
    const greeting = await Social.getEmotionalGreeting(req.user.id);
    return success(res, greeting);
  } catch (error) {
    console.error('获取问候语错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

module.exports = router;