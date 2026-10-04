const express = require('express');
const router = express.Router();
const Course = require('../models/Course.model');
const CourseService = require('../services/course.service');
const { verifyToken, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { success, fail, ErrorCode } = require('../utils/response');

const paginationQuery = {
  page: { type: 'integer', min: 1, max: 200, default: 1 },
  limit: { type: 'integer', min: 1, max: 200, default: 10 }
};

const idParam = {
  id: { required: true, type: 'integer', min: 1 }
};

const courseBody = {
  name: { required: true, type: 'string', min: 1, max: 100 },
  code: { type: 'string', max: 50 },
  teacherId: { type: 'integer', min: 1 },
  teacherName: { type: 'string', max: 100 },
  credits: { type: 'number', min: 0 },
  description: { type: 'string', max: 5000 },
  location: { type: 'string', max: 100 },
  semester: { type: 'string', max: 20 },
  maxStudents: { type: 'integer', min: 0 }
};

// 获取所有学期列表
router.get('/semesters', verifyToken, async (req, res) => {
    try {
        const semesters = await CourseService.getSemesters();
        return success(res, semesters);
    } catch (error) {
        console.error('获取学期列表错误:', error);
        return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
    }
});

// 获取所有教师列表（从 courses 表获取唯一的教师名称,而不是从注册的用户表users中获取）
router.get('/teachers', verifyToken, async (req, res) => {
    try {
        const teachers = await CourseService.getTeachers();
        return success(res, teachers);
    } catch (error) {
        console.error('获取教师列表错误:', error);
        return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
    }
});

// 获取课程列表
router.get('/', verifyToken, validate({ query: paginationQuery }), async (req, res) => {
    try {
        const { page, limit, semester } = req.query;
        const result = await Course.getAll(page, limit, semester);
        return success(res, result);
    } catch (error) {
        console.error('获取课程列表错误:', error);
        return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
    }
});

// 获取课程详情
router.get('/:id', verifyToken, validate({ params: idParam }), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return fail(res, '课程不存在', ErrorCode.NOT_FOUND);
        }
        return success(res, course);
    } catch (error) {
        console.error('获取课程详情错误:', error);
        return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
    }
});

// 创建课程（管理员/教师）
router.post('/', verifyToken, checkRole('admin', 'teacher'), validate({ body: courseBody }), async (req, res) => {
    try {
        const courseId = await Course.create(req.body);
        return success(res, { courseId }, '课程创建成功');
    } catch (error) {
        console.error('创建课程错误:', error);
        return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
    }
});

// 更新课程
router.put('/:id', verifyToken, checkRole('admin', 'teacher'), validate({
    params: idParam,
    body: { ...courseBody, name: { type: 'string', min: 1, max: 100 } }
}), async (req, res) => {
    try {
        await Course.update(req.params.id, req.body);
        return success(res, null, '课程更新成功');
    } catch (error) {
        console.error('更新课程错误:', error);
        return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
    }
});

// 删除课程
router.delete('/:id', verifyToken, checkRole('admin'), validate({ params: idParam }), async (req, res) => {
    try {
        await Course.delete(req.params.id);
        return success(res, null, '课程删除成功');
    } catch (error) {
        console.error('删除课程错误:', error);
        return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
    }
});

// 获取学生选课列表
router.get('/student/:studentId', verifyToken, validate({
    params: { studentId: { required: true, type: 'integer', min: 1 } }
}), async (req, res) => {
    try {
        const courses = await Course.getStudentCourses(req.params.studentId);
        return success(res, courses);
    } catch (error) {
        console.error('获取学生课程错误:', error);
        return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
    }
});

// 学生选课
router.post('/:id/enroll', verifyToken, checkRole('student'), validate({ params: idParam }), async (req, res) => {
    try {
        const enrollId = await Course.enroll(req.user.id, req.params.id);
        return success(res, { enrollId }, '选课成功');
    } catch (error) {
        console.error('选课错误:', error);
        return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
    }
});

// 获取课程学生列表
router.get('/:id/students', verifyToken, validate({ params: idParam }), async (req, res) => {
    try {
        const students = await Course.getCourseStudents(req.params.id);
        return success(res, students);
    } catch (error) {
        console.error('获取课程学生列表错误:', error);
        return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
    }
});

// 获取AI推荐学习资源
router.get('/recommend/resources', verifyToken, validate({
    query: { limit: { type: 'integer', min: 1, max: 50, default: 5 } }
}), async (req, res) => {
    try {
        const resources = await Course.getRecommendedResources(req.user.id, req.query.limit);
        return success(res, resources);
    } catch (error) {
        console.error('获取推荐资源错误:', error);
        return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
    }
});
module.exports = router;