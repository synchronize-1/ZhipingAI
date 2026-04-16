const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { verifyToken, checkRole } = require('../middleware/auth');

// 获取课程列表
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, semester } = req.query;
    const result = await Course.getAll(parseInt(page), parseInt(limit), semester);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取课程列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取课程详情
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: '课程不存在' });
    }
    res.json({ success: true, data: course });
  } catch (error) {
    console.error('获取课程详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 创建课程（管理员/教师）
router.post('/', verifyToken, checkRole('admin', 'teacher'), async (req, res) => {
  try {
    const courseId = await Course.create(req.body);
    res.status(201).json({ success: true, message: '课程创建成功', data: { courseId } });
  } catch (error) {
    console.error('创建课程错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取学生选课列表
router.get('/student/:studentId', verifyToken, async (req, res) => {
  try {
    const courses = await Course.getStudentCourses(req.params.studentId);
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('获取学生课程错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 学生选课
router.post('/:id/enroll', verifyToken, checkRole('student'), async (req, res) => {
  try {
    const enrollId = await Course.enroll(req.user.id, req.params.id);
    res.status(201).json({ success: true, message: '选课成功', data: { enrollId } });
  } catch (error) {
    console.error('选课错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取课程学生列表
router.get('/:id/students', verifyToken, async (req, res) => {
  try {
    const students = await Course.getCourseStudents(req.params.id);
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('获取课程学生列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取AI推荐学习资源
router.get('/recommend/resources', verifyToken, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const resources = await Course.getRecommendedResources(req.user.id, parseInt(limit));
    res.json({ success: true, data: resources });
  } catch (error) {
    console.error('获取推荐资源错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 课堂互动 - 签到
router.post('/:id/checkin', verifyToken, async (req, res) => {
  try {
    const Attendance = require('../models/Attendance');
    const { scheduleId, location } = req.body;
    
    const attendanceId = await Attendance.checkIn(
      req.user.id, 
      req.params.id, 
      scheduleId, 
      'manual',
      location
    );
    
    res.status(201).json({ success: true, message: '签到成功', data: { attendanceId } });
  } catch (error) {
    console.error('签到错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 课堂互动 - 提交问题
router.post('/:id/questions', verifyToken, async (req, res) => {
  try {
    const pool = require('../config/database');
    const { content, isAnonymous } = req.body;
    
    const [result] = await pool.execute(
      `INSERT INTO course_questions (course_id, user_id, content, is_anonymous, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [req.params.id, req.user.id, content, isAnonymous ? 1 : 0]
    );
    
    res.status(201).json({ success: true, message: '问题已提交', data: { questionId: result.insertId } });
  } catch (error) {
    console.error('提交问题错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 课堂互动 - 课程评价
router.post('/:id/feedback', verifyToken, async (req, res) => {
  try {
    const pool = require('../config/database');
    const { rating, comment, teacherId } = req.body;
    
    const [result] = await pool.execute(
      `INSERT INTO course_feedbacks (course_id, user_id, teacher_id, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [req.params.id, req.user.id, teacherId, rating, comment]
    );
    
    res.status(201).json({ success: true, message: '评价已提交', data: { feedbackId: result.insertId } });
  } catch (error) {
    console.error('提交评价错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
