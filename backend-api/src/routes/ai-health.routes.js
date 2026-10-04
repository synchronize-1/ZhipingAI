const express = require('express');
const router = express.Router();
const AIHealthService = require('../services/aiHealth.service');
const { verifyToken, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { success, fail, ErrorCode } = require('../utils/response');

const idParam = {
    id: { required: true, type: 'integer', min: 1 }
};

// GET /api/ai-health/overview
router.get('/overview', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const data = await AIHealthService.getOverview();
        return success(res, data);
    } catch (error) {
        console.error('GET /overview 错误:', error);
        return fail(res, '服务器错误: ' + error.message, ErrorCode.SERVER_ERROR);
    }
});

// GET /api/ai-health/students
router.get('/students', verifyToken, checkRole('admin'), validate({
    query: {
        keyword: { type: 'string', max: 100 },
        page: { type: 'integer', min: 1, max: 200, default: 1 },
        limit: { type: 'integer', min: 1, max: 200, default: 20 }
    }
}), async (req, res) => {
    try {
        const { keyword, page, limit } = req.query;
        const students = await AIHealthService.getStudents({ keyword, page, limit });
        return success(res, students);
    } catch (error) {
        console.error('GET /students 错误:', error);
        return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
    }
});

// GET /api/ai-health/students/:id
router.get('/students/:id', verifyToken, checkRole('admin'), validate({ params: idParam }), async (req, res) => {
    try {
        const detail = await AIHealthService.getStudentDetail(req.params.id);
        if (!detail) {
            return fail(res, '学生不存在', ErrorCode.NOT_FOUND);
        }
        return success(res, detail);
    } catch (error) {
        console.error('GET /students/:id 错误:', error);
        return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
    }
});

// GET /api/ai-health/warnings
router.get('/warnings', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const warnings = await AIHealthService.getWarnings();
        return success(res, warnings);
    } catch (error) {
        console.error('GET /warnings 错误:', error);
        return fail(res, '服务器错误: ' + error.message, ErrorCode.SERVER_ERROR);
    }
});

// GET /api/ai-health/recommendations
router.get('/recommendations', verifyToken, checkRole('admin'), async (req, res) => {
    return success(res, AIHealthService.getRecommendations());
});

// GET /api/ai-health/interventions/feedback
router.get('/interventions/feedback', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const data = await AIHealthService.getInterventionFeedback();
        return success(res, data);
    } catch (error) {
        console.error('GET /interventions/feedback 错误:', error);
        return fail(res, '服务器错误: ' + error.message, ErrorCode.SERVER_ERROR);
    }
});

// GET /api/ai-health/analytics
router.get('/analytics', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const data = await AIHealthService.getAnalytics();
        return success(res, data);
    } catch (error) {
        console.error('GET /analytics 错误:', error);
        return fail(res, '服务器错误: ' + error.message, ErrorCode.SERVER_ERROR);
    }
});

// GET /api/ai-health/student-warning/:id
// 获取单个学生的预警详情（供弹窗使用）
router.get('/student-warning/:id', verifyToken, checkRole('admin'), validate({ params: idParam }), async (req, res) => {
    try {
        const detail = await AIHealthService.getStudentWarning(req.params.id);
        if (!detail) {
            return fail(res, '学生不存在', ErrorCode.NOT_FOUND);
        }
        return success(res, detail);
    } catch (error) {
        console.error('GET /student-warning/:id 错误:', error);
        return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
    }
});

module.exports = router;