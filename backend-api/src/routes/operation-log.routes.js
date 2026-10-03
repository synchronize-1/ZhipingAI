const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { success, paginate } = require('../utils/response');
const { validate } = require('../middleware/validate');
const OperationLogService = require('../services/operationLog.service');

const listSchema = {
  query: {
    page: { type: 'integer', min: 1, default: 1 },
    pageSize: { type: 'integer', min: 1, max: 100, default: 20 },
    module: { type: 'string', max: 50 },
    action: { type: 'string', max: 50 },
    username: { type: 'string', max: 50 },
    method: { type: 'string', enum: ['POST', 'PUT', 'PATCH', 'DELETE'] },
    success: { type: 'boolean' },
    startDate: { type: 'string', max: 30 },
    endDate: { type: 'string', max: 30 },
    keyword: { type: 'string', max: 100 }
  }
};

// 操作日志列表（管理员）
router.get('/', verifyToken, checkRole('admin'), validate(listSchema), asyncHandler(async (req, res) => {
  const { page, pageSize, ...filters } = req.query;
  const result = await OperationLogService.list({ page, pageSize, ...filters });
  paginate(res, result.list, result.total, result.page, result.pageSize);
}));

// 审计统计（管理员）
router.get('/stats', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  const data = await OperationLogService.stats({
    startDate: req.query.startDate,
    endDate: req.query.endDate
  });
  success(res, data);
}));

// 模块字典（管理员）
router.get('/modules', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  const data = await OperationLogService.modules();
  success(res, data);
}));

module.exports = router;