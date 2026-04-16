const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const { verifyToken, checkRole } = require('../middleware/auth');

// 获取当前用户课表
router.get('/my', verifyToken, async (req, res) => {
  try {
    const { week } = req.query;
    const schedule = await Schedule.getByUserId(req.user.id, week ? parseInt(week) : null);
    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('获取课表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取今日课程
router.get('/today', verifyToken, async (req, res) => {
  try {
    const schedule = await Schedule.getTodaySchedule(req.user.id);
    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('获取今日课程错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取即将上课的课程（课前提醒）
router.get('/upcoming', verifyToken, async (req, res) => {
  try {
    const { minutes = 30 } = req.query;
    const upcomingClass = await Schedule.getUpcomingClass(req.user.id, parseInt(minutes));
    res.json({ success: true, data: upcomingClass });
  } catch (error) {
    console.error('获取即将上课课程错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取指定用户课表（管理员）
router.get('/user/:userId', verifyToken, checkRole('admin', 'teacher'), async (req, res) => {
  try {
    const { week } = req.query;
    const schedule = await Schedule.getByUserId(req.params.userId, week ? parseInt(week) : null);
    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('获取用户课表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 创建课程安排（管理员）
router.post('/', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const scheduleId = await Schedule.create(req.body);
    res.status(201).json({ success: true, message: '课程安排创建成功', data: { scheduleId } });
  } catch (error) {
    console.error('创建课程安排错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 位置感知的课前提醒检查
router.post('/location-check', verifyToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const upcomingClass = await Schedule.getUpcomingClass(req.user.id, 30);
    
    if (!upcomingClass) {
      return res.json({ 
        success: true, 
        data: { needReminder: false, message: '暂无即将开始的课程' } 
      });
    }
    
    // 计算用户当前位置与教室的距离
    const { latitude: roomLat, longitude: roomLng, room_name, course_name, start_time } = upcomingClass;
    
    if (!roomLat || !roomLng) {
      return res.json({ 
        success: true, 
        data: { needReminder: true, message: `${course_name} 即将开始，请前往 ${room_name}` } 
      });
    }
    
    // 简化的距离计算（米）
    const distance = Math.sqrt(
      Math.pow((latitude - roomLat) * 111000, 2) + 
      Math.pow((longitude - roomLng) * 111000 * Math.cos(latitude * Math.PI / 180), 2)
    );
    
    const isNearClassroom = distance <= 100; // 100米范围内
    
    res.json({
      success: true,
      data: {
        needReminder: !isNearClassroom,
        distance: Math.round(distance),
        course: course_name,
        room: room_name,
        startTime: start_time,
        message: isNearClassroom 
          ? '您已到达教室附近' 
          : `${course_name} 即将在 ${room_name} 开始，距离您约 ${Math.round(distance)} 米`
      }
    });
  } catch (error) {
    console.error('位置检查错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
