const express = require('express');
const router = express.Router();
const Security = require('../models/Security');
const Attendance = require('../models/Attendance');
const { verifyToken, checkRole } = require('../middleware/auth');

// ========== 无感考勤 ==========
router.post('/attendance/auto', verifyToken, async (req, res) => {
  try {
    const { latitude, longitude, scheduleId } = req.body;
    const result = await Attendance.autoCheckIn(req.user.id, latitude, longitude, scheduleId);
    res.json({ success: result.success, data: result });
  } catch (error) {
    console.error('自动签到错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/attendance/statistics', verifyToken, async (req, res) => {
  try {
    const { semester } = req.query;
    const statistics = await Attendance.getStudentStatistics(req.user.id, semester);
    res.json({ success: true, data: statistics });
  } catch (error) {
    console.error('获取出勤统计错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/attendance/course/:courseId', verifyToken, checkRole('admin', 'teacher'), async (req, res) => {
  try {
    const { date } = req.query;
    const attendance = await Attendance.getCourseAttendance(req.params.courseId, date);
    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('获取课程考勤错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ========== 门禁管理 ==========
router.get('/access-logs', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { userId, building, startDate, endDate } = req.query;
    const logs = await Security.getAccessLogs(userId, building, startDate, endDate);
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('获取门禁日志错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/access-logs', verifyToken, async (req, res) => {
  try {
    const { buildingId, accessType, method } = req.body;
    const logId = await Security.logAccess(req.user.id, buildingId, accessType, method);
    res.status(201).json({ success: true, data: { logId } });
  } catch (error) {
    console.error('记录门禁日志错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ========== 紧急通知 ==========
router.get('/emergency-notices', verifyToken, async (req, res) => {
  try {
    const notices = await Security.getActiveEmergencyNotices(req.user.role);
    res.json({ success: true, data: notices });
  } catch (error) {
    console.error('获取紧急通知错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/emergency-notices', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const noticeId = await Security.createEmergencyNotice({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, message: '紧急通知已发布', data: { noticeId } });
  } catch (error) {
    console.error('发布紧急通知错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ========== 监控设备 ==========
router.get('/cameras', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { building } = req.query;
    const cameras = await Security.getCameras(building);
    res.json({ success: true, data: cameras });
  } catch (error) {
    console.error('获取监控设备错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ========== 能耗监测 ==========
router.get('/energy', verifyToken, async (req, res) => {
  try {
    const { building, startDate, endDate, type } = req.query;
    const data = await Security.getEnergyData(building, startDate, endDate, type);
    res.json({ success: true, data });
  } catch (error) {
    console.error('获取能耗数据错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/energy/statistics', verifyToken, async (req, res) => {
  try {
    const { period = 'day' } = req.query;
    const statistics = await Security.getEnergyStatistics(period);
    res.json({ success: true, data: statistics });
  } catch (error) {
    console.error('获取能耗统计错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ========== 绿色校园 ==========
router.get('/green-tips', verifyToken, async (req, res) => {
  try {
    const tips = await Security.getGreenCampusTips();
    res.json({ success: true, data: tips });
  } catch (error) {
    console.error('获取绿色提示错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
