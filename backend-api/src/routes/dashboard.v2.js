const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const DashboardService = require('../services/dashboard.service');

/**
 * GET /dashboard
 * 获取当前用户的首页 Dashboard 数据
 * 根据用户角色（admin/teacher/student）返回不同的数据结构
 */
router.get('/dashboard', verifyToken, asyncHandler(async (req, res) => {
  const { id, role } = req.user;
  let data;

  switch (role) {
    case 'admin':
      data = await DashboardService.getAdminDashboard();
      break;
    case 'teacher':
      data = await DashboardService.getTeacherDashboard(id);
      break;
    case 'student':
      data = await DashboardService.getStudentDashboard(id);
      break;
    default:
      const error = new Error('未知用户角色');
      error.name = 'ValidationError';
      throw error;
  }

  return success(res, data);
}));

module.exports = router;
