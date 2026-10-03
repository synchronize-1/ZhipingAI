const express = require('express');
const router = express.Router();
const Course = require('../models/Course.model');
const { verifyToken, checkRole } = require('../middleware/auth');

// 获取所有学期列表
router.get('/semesters', verifyToken, async (req, res) => {
    try {
        const pool = require('../config/database');
        const [rows] = await pool.execute(`
      SELECT DISTINCT semester 
      FROM courses 
      WHERE semester IS NOT NULL AND semester != ''
      ORDER BY semester DESC
    `);
        const semesters = rows.map(row => row.semester);
        res.json({ success: true, data: semesters });
    } catch (error) {
        console.error('获取学期列表错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取所有教师列表（从 courses 表获取唯一的教师名称,而不是从注册的用户表users中获取）
router.get('/teachers', verifyToken, async (req, res) => {
    try {
        const pool = require('../config/database');
        const [rows] = await pool.execute(`
      SELECT DISTINCT teacher_name as name 
      FROM courses 
      WHERE teacher_name IS NOT NULL AND teacher_name != ''
      ORDER BY teacher_name
    `);
        const teachers = rows.map(row => row.name);
        res.json({ success: true, data: teachers });
    } catch (error) {
        console.error('获取教师列表错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

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

// 更新课程
router.put('/:id', verifyToken, checkRole('admin', 'teacher'), async (req, res) => {
    try {
        await Course.update(req.params.id, req.body);
        res.json({ success: true, message: '课程更新成功' });
    } catch (error) {
        console.error('更新课程错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 删除课程
router.delete('/:id', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        await Course.delete(req.params.id);
        res.json({ success: true, message: '课程删除成功' });
    } catch (error) {
        console.error('删除课程错误:', error);
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
module.exports = router;