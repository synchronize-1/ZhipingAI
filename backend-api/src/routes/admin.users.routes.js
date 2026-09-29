const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken, checkRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { success, fail, paginate, ErrorCode } = require('../utils/response');
const UserService = require('../services/user.service');

// multer 内存存储配置（Excel 文件上传，不落盘）
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 限制
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 Excel 文件（.xlsx, .xls）'));
    }
  }
});

// ==================== 1. 用户列表（分页筛选） ====================
router.get('/', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  const { page, pageSize, role, classId, keyword, status } = req.query;
  const result = await UserService.getUserList({
    page, pageSize, role, classId, keyword, status
  });
  paginate(res, result.list, result.total, result.page, result.pageSize);
}));

// ==================== 2. 下载导入模板（必须在 /:id 之前注册） ====================
router.get('/template', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  const { role } = req.query;
  const { buffer, fileName } = await UserService.generateImportTemplate(role);

  const encodedFileName = encodeURIComponent(fileName);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`);
  res.setHeader('Content-Length', buffer.length);

  res.send(buffer);
}));

// ==================== 3. 用户详情 ====================
router.get('/:id', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  const user = await UserService.getUserDetail(req.params.id);
  success(res, user);
}));

// ==================== 3. 创建用户 ====================
router.post('/', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  const result = await UserService.createUser(req.body);
  success(res, result, '用户创建成功');
}));

// ==================== 4. 更新用户 ====================
router.put('/:id', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  await UserService.updateUser(req.params.id, req.body);
  success(res, null, '用户更新成功');
}));

// ==================== 5. 删除用户 ====================
router.delete('/:id', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  await UserService.deleteUser(req.params.id, req.user.id);
  success(res, null, '用户删除成功');
}));

// ==================== 6. 重置密码 ====================
router.post('/:id/reset-password', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  const { newPassword } = req.body || {};
  const result = await UserService.resetPassword(req.params.id, newPassword || null);
  success(res, result, '密码重置成功');
}));

// ==================== 7. 批量重置密码 ====================
router.post('/batch-reset-password', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  const { userIds } = req.body;
  if (!Array.isArray(userIds)) {
    return fail(res, 'userIds 必须是数组', ErrorCode.PARAM_VALIDATION);
  }
  const result = await UserService.batchResetPassword(userIds);
  success(res, result, '批量重置密码完成');
}));

// ==================== 8. 批量分配班级 ====================
router.post('/batch-update-class', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  const { userIds, classId } = req.body;
  if (!Array.isArray(userIds)) {
    return fail(res, 'userIds 必须是数组', ErrorCode.PARAM_VALIDATION);
  }
  if (!classId) {
    return fail(res, 'classId 不能为空', ErrorCode.PARAM_VALIDATION);
  }
  const result = await UserService.batchUpdateClass(userIds, classId);
  success(res, result, '批量分配班级完成');
}));

// ==================== 9. 切换启用状态 ====================
router.put('/:id/toggle-status', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  const result = await UserService.toggleStatus(req.params.id);
  success(res, result, '状态切换成功');
}));

// ==================== 10. Excel 批量导入用户 ====================
router.post('/import', verifyToken, checkRole('admin'), upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return fail(res, '请上传 Excel 文件', ErrorCode.PARAM_VALIDATION);
  }
  const role = req.body.role;
  if (!role) {
    return fail(res, '角色不能为空', ErrorCode.PARAM_VALIDATION);
  }
  const result = await UserService.importUsers(req.file.buffer, role);
  success(res, result, '导入完成');
}));

module.exports = router;
