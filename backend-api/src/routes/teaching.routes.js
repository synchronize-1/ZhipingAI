const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken, checkRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { success, fail, paginate, ErrorCode } = require('../utils/response');
const TeachingService = require('../services/teaching.service');

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

// ==================== 考试管理（管理员、教师） ====================

// 获取考试列表
router.get('/exams', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const { page, pageSize, examType, grade, status, keyword } = req.query;
  const result = await TeachingService.getExamList({
    page, pageSize, examType, grade, status, keyword
  });
  paginate(res, result.list, result.total, result.page, result.pageSize);
}));

// 获取考试详情
router.get('/exams/:id', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const exam = await TeachingService.getExamDetail(req.params.id);
  success(res, exam);
}));

// 创建考试
router.post('/exams', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const result = await TeachingService.createExam({
    ...req.body,
    createdBy: req.user.id
  });
  success(res, result, '考试创建成功');
}));

// 更新考试
router.put('/exams/:id', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  await TeachingService.updateExam(req.params.id, req.body);
  success(res, null, '考试更新成功');
}));

// 删除考试
router.delete('/exams/:id', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  await TeachingService.deleteExam(req.params.id);
  success(res, null, '考试删除成功');
}));

// 添加考试科目
router.post('/exams/:id/subjects', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const result = await TeachingService.addExamSubject(req.params.id, req.body);
  success(res, result, '考试科目添加成功');
}));

// 移除考试科目
router.delete('/exams/:id/subjects/:subjectId', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  await TeachingService.removeExamSubject(req.params.id, req.params.subjectId);
  success(res, null, '考试科目移除成功');
}));

// ==================== 成绩管理 ====================

// 获取成绩列表（按考试+班级+科目筛选）
router.get('/scores', verifyToken, checkRole('admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  const { examId, classId, subjectId, studentId } = req.query;

  // 学生只能查看自己的成绩
  if (req.user.role === 'student') {
    if (studentId && String(studentId) !== String(req.user.id)) {
      return fail(res, '无权查看他人成绩', ErrorCode.FORBIDDEN);
    }
    // 学生通过 studentId 查询自己的成绩
    if (!examId && !studentId) {
      return fail(res, '参数不完整', ErrorCode.PARAM_VALIDATION);
    }
  }

  if (examId && classId) {
    // 按考试+班级+科目查询
    const scores = await TeachingService.getClassScores(examId, classId, subjectId || null);
    success(res, scores);
  } else if (examId && studentId) {
    // 按考试+学生查询
    const scores = await TeachingService.getStudentScores(examId, studentId);
    success(res, scores);
  } else {
    fail(res, '参数不完整，请提供 examId 和 classId 或 examId 和 studentId', ErrorCode.PARAM_VALIDATION);
  }
}));

// 批量导入成绩（支持原有扁平格式和 Excel 导入后的 rows 格式）
router.post('/scores/import', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const { examId, scores, classId, rows } = req.body;
  if (!examId) {
    return fail(res, '参数不完整：缺少 examId', ErrorCode.PARAM_VALIDATION);
  }

  let result;
  // 新格式：rows 数组（Excel 导入后的数据格式）
  if (rows && Array.isArray(rows)) {
    if (!classId) {
      return fail(res, '参数不完整：缺少 classId', ErrorCode.PARAM_VALIDATION);
    }
    result = await TeachingService.importScores(examId, { rows }, classId);
    success(res, result, `成功导入 ${result.studentCount} 名学生、共 ${result.affectedRows} 条成绩记录`);
  } else {
    // 原有格式：scores 扁平数组
    if (!scores) {
      return fail(res, '参数不完整：缺少 scores 或 rows', ErrorCode.PARAM_VALIDATION);
    }
    result = await TeachingService.importScores(examId, scores);
    success(res, result, `成功导入 ${result.affectedRows} 条成绩`);
  }
}));

// Excel 成绩预览（上传 Excel 文件，解析并校验数据）
router.post('/scores/preview', verifyToken, checkRole('admin', 'teacher'), upload.single('file'), asyncHandler(async (req, res) => {
  const { examId, classId } = req.body;

  if (!examId || !classId) {
    return fail(res, '参数不完整：请提供 examId 和 classId', ErrorCode.PARAM_VALIDATION);
  }

  if (!req.file) {
    return fail(res, '请上传 Excel 文件', ErrorCode.PARAM_VALIDATION);
  }

  const result = await TeachingService.previewScores(examId, classId, req.file.buffer);
  success(res, result, '预览完成');
}));

// 成绩导出 Excel
router.get('/scores/export', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const { examId, classId, subjectId } = req.query;

  if (!examId || !classId) {
    return fail(res, '参数不完整：请提供 examId 和 classId', ErrorCode.PARAM_VALIDATION);
  }

  const { buffer, fileName } = await TeachingService.exportScores(examId, classId, subjectId || null);

  // 设置响应头，触发浏览器下载
  const encodedFileName = encodeURIComponent(fileName);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`);
  res.setHeader('Content-Length', buffer.length);

  res.send(buffer);
}));

// 下载成绩导入模板
router.get('/scores/template', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const { examId, classId } = req.query;

  if (!examId || !classId) {
    return fail(res, '参数不完整：请提供 examId 和 classId', ErrorCode.PARAM_VALIDATION);
  }

  const { buffer, fileName } = await TeachingService.generateImportTemplate(examId, classId);

  // 设置响应头，触发浏览器下载
  const encodedFileName = encodeURIComponent(fileName);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`);
  res.setHeader('Content-Length', buffer.length);

  res.send(buffer);
}));

// 更新成绩
router.put('/scores/:id', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  await TeachingService.updateScore(req.params.id, req.body);
  success(res, null, '成绩更新成功');
}));

// 删除成绩
router.delete('/scores/:id', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  await TeachingService.deleteScore(req.params.id);
  success(res, null, '成绩删除成功');
}));

// 学生历史成绩
router.get('/scores/student/:studentId', verifyToken, checkRole('admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  // 学生只能查看自己的成绩
  if (req.user.role === 'student' && String(req.params.studentId) !== String(req.user.id)) {
    return fail(res, '无权查看他人成绩', ErrorCode.FORBIDDEN);
  }

  const { page, pageSize } = req.query;
  const result = await TeachingService.getStudentScoreHistory(req.params.studentId, { page, pageSize });
  paginate(res, result.list, result.total, result.page, result.pageSize);
}));

// ==================== 教学质量分析 ====================

// 班级学情分析
router.get('/analysis/class/:examId/:classId', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const analysis = await TeachingService.getClassAnalysis(req.params.examId, req.params.classId);
  success(res, analysis);
}));

// 年级学情分析
router.get('/analysis/grade/:examId', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const analysis = await TeachingService.getGradeAnalysis(req.params.examId);
  success(res, analysis);
}));

// 学生学情分析
router.get('/analysis/student/:studentId', verifyToken, checkRole('admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  // 学生只能查看自己的分析
  if (req.user.role === 'student' && String(req.params.studentId) !== String(req.user.id)) {
    return fail(res, '无权查看他人学情分析', ErrorCode.FORBIDDEN);
  }

  const { examId } = req.query;
  const analysis = await TeachingService.getStudentAnalysis(req.params.studentId, examId || null);
  success(res, analysis);
}));

// ==================== 班级与学科（管理员） ====================

// 获取班级列表
router.get('/classes', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  const { page, pageSize, grade, department, keyword } = req.query;
  const result = await TeachingService.getClassList({ page, pageSize, grade, department, keyword });
  paginate(res, result.list, result.total, result.page, result.pageSize);
}));

// 获取学科列表
router.get('/subjects', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  const { page, pageSize, category, keyword } = req.query;
  const result = await TeachingService.getSubjectList({ page, pageSize, category, keyword });
  paginate(res, result.list, result.total, result.page, result.pageSize);
}));

// 获取班级学科教师
router.get('/classes/:id/teachers', verifyToken, checkRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const teachers = await TeachingService.getClassSubjectTeachers(req.params.id);
  success(res, teachers);
}));

module.exports = router;
