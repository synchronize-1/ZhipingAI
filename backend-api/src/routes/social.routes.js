const express = require('express');
const router = express.Router();
const Social = require('../models/Social.model');
const { verifyToken, checkRole } = require('../middleware/auth');

// ========== 活动管理 ==========
router.get('/activities', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status } = req.query;
    const result = await Social.getActivities(parseInt(page), parseInt(limit), category, status);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取活动列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/activities', verifyToken, async (req, res) => {
  try {
    const activityId = await Social.createActivity({ ...req.body, organizerId: req.user.id });
    res.status(201).json({ success: true, message: '活动创建成功', data: { activityId } });
  } catch (error) {
    console.error('创建活动错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/activities/:id/join', verifyToken, async (req, res) => {
  try {
    const participantId = await Social.joinActivity(req.user.id, req.params.id);
    res.status(201).json({ success: true, message: '报名成功', data: { participantId } });
  } catch (error) {
    console.error('报名活动错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/activities/:id/participants', verifyToken, async (req, res) => {
  try {
    const participants = await Social.getActivityParticipants(req.params.id);
    res.json({ success: true, data: participants });
  } catch (error) {
    console.error('获取活动参与者错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ========== 兴趣小组 ==========
router.get('/groups', verifyToken, async (req, res) => {
  try {
    const { category } = req.query;
    const groups = await Social.getInterestGroups(category);
    res.json({ success: true, data: groups });
  } catch (error) {
    console.error('获取兴趣小组错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/groups/:id/join', verifyToken, async (req, res) => {
  try {
    const memberId = await Social.joinGroup(req.user.id, req.params.id);
    res.status(201).json({ success: true, message: '加入成功', data: { memberId } });
  } catch (error) {
    console.error('加入小组错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/groups/:id/members', verifyToken, async (req, res) => {
  try {
    const members = await Social.getGroupMembers(req.params.id);
    res.json({ success: true, data: members });
  } catch (error) {
    console.error('获取小组成员错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ========== 学生成长档案 ==========
router.get('/growth/:studentId', verifyToken, async (req, res) => {
  try {
    // 只能查看自己的档案，管理员/教师可以查看所有
    if (req.user.role === 'student' && req.user.id !== parseInt(req.params.studentId)) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    
    const growthRecord = await Social.getStudentGrowthRecord(req.params.studentId);
    res.json({ success: true, data: growthRecord });
  } catch (error) {
    console.error('获取成长档案错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ========== 情感化交互 ==========
router.get('/greeting', verifyToken, async (req, res) => {
  try {
    const greeting = await Social.getEmotionalGreeting(req.user.id);
    res.json({ success: true, data: greeting });
  } catch (error) {
    console.error('获取问候语错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
