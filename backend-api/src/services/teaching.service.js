const XLSX = require('xlsx');
const pool = require('../config/database');
const Exam = require('../models/Exam.model');
const Subject = require('../models/Subject.model');
const Class = require('../models/Class.model');
const User = require('../models/User.model');
const ExamScore = require('../models/ExamScore.model');
const DeepSeekService = require('./deepseek.service');
const NotificationService = require('./notification.service');
const { ErrorCode } = require('../utils/response');

class TeachingService {
  // ==================== 考试管理 ====================

  // 获取考试列表（分页、筛选）
  static async getExamList(params) {
    const result = await Exam.getAll(params);
    return result;
  }

  // 获取考试详情（含科目信息）
  static async getExamDetail(id) {
    const exam = await Exam.findById(id);
    if (!exam) {
      const error = new Error('考试不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const subjects = await Exam.getExamSubjects(id);
    return { ...exam, subjects };
  }

  // 创建考试
  static async createExam(examData) {
    if (!examData.name) {
      const error = new Error('考试名称不能为空');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    const examId = await Exam.create(examData);
    return { examId };
  }

  // 更新考试
  static async updateExam(id, examData) {
    const exam = await Exam.findById(id);
    if (!exam) {
      const error = new Error('考试不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    await Exam.update(id, examData);
  }

  // 删除考试（同时删除成绩）
  static async deleteExam(id) {
    const exam = await Exam.findById(id);
    if (!exam) {
      const error = new Error('考试不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 先删除成绩（外键会级联删除，但这里显式处理更清晰）
    await ExamScore.deleteByExamId(id);
    await Exam.delete(id);
  }

  // 添加考试科目
  static async addExamSubject(examId, subjectData) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('考试不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const subject = await Subject.findById(subjectData.subjectId);
    if (!subject) {
      const error = new Error('学科不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const id = await Exam.addSubject(examId, {
      subjectId: subjectData.subjectId,
      fullScore: subjectData.fullScore || subject.full_score,
      passScore: subjectData.passScore || 60,
      examDuration: subjectData.examDuration
    });

    return { id };
  }

  // 移除考试科目
  static async removeExamSubject(examId, subjectId) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('考试不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    await Exam.removeSubject(examId, subjectId);
  }

  // ==================== 成绩管理 ====================

  // 批量导入成绩，自动计算排名和等级
  static async importScores(examId, scoresData) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('考试不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    if (!Array.isArray(scoresData) || scoresData.length === 0) {
      const error = new Error('成绩数据不能为空');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    // 为每条成绩添加 examId
    const scores = scoresData.map(s => ({ ...s, examId }));

    // 批量插入/更新
    const affectedRows = await ExamScore.batchCreate(scores);

    // 获取涉及的所有科目，重新计算排名
    const subjectIds = [...new Set(scores.map(s => s.subjectId))];
    for (const subjectId of subjectIds) {
      await ExamScore.calculateRankings(examId, subjectId);
    }

    return { affectedRows, subjectCount: subjectIds.length };
  }

  // 成绩发布后向该班级学生推送通知；通知失败不阻断导入主流程
  static async notifyScorePublished(examId, classId, createdBy) {
    if (!classId) return;

    const exam = await Exam.findById(examId);
    const [students] = await pool.execute(
      "SELECT id FROM users WHERE role = 'student' AND class_id = ?",
      [classId]
    );
    if (students.length === 0) return;

    const title = '成绩已发布';
    const content = `《${exam?.name || '考试'}》成绩已发布，可在成绩查询中查看。`;
    await Promise.allSettled(
      students.map(s => NotificationService.create({
        title,
        content,
        type: 'course',
        userId: s.id,
        createdBy
      }))
    );
  }

  // ==================== Excel 成绩导入预览 ====================

  // 解析 Excel 并校验成绩数据，返回预览结果
  static async previewScores(examId, classId, fileBuffer) {
    // 验证考试和班级是否存在
    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('考试不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const cls = await Class.findById(classId);
    if (!cls) {
      const error = new Error('班级不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 获取考试科目列表
    const examSubjects = await Exam.getExamSubjects(examId);
    if (examSubjects.length === 0) {
      const error = new Error('该考试尚未配置科目');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    // 构建科目名称到科目信息的映射
    const subjectMap = {};
    for (const es of examSubjects) {
      subjectMap[es.subject_name] = es;
    }

    // 解析 Excel
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (jsonData.length < 2) {
      const error = new Error('Excel 文件内容为空或格式不正确');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    // 解析表头（第一行）
    const headers = jsonData[0].map(h => String(h).trim());
    const studentNoIndex = headers.findIndex(h => h === '学号');
    const studentNameIndex = headers.findIndex(h => h === '姓名');

    if (studentNoIndex === -1) {
      const error = new Error('Excel 缺少"学号"列');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }
    if (studentNameIndex === -1) {
      const error = new Error('Excel 缺少"姓名"列');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    // 识别科目列
    const subjectColumns = [];
    for (let i = 0; i < headers.length; i++) {
      if (i === studentNoIndex || i === studentNameIndex) continue;
      const headerName = headers[i];
      if (subjectMap[headerName]) {
        subjectColumns.push({
          colIndex: i,
          subjectId: subjectMap[headerName].subject_id,
          subjectName: headerName,
          fullScore: subjectMap[headerName].full_score
        });
      }
    }

    if (subjectColumns.length === 0) {
      const error = new Error('Excel 中未找到该考试包含的科目列');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    // 获取班级所有学生（用于校验）
    const classStudents = await User.getStudentsByClassId(classId);
    const studentMap = {};
    for (const s of classStudents) {
      studentMap[s.student_id] = s;
    }

    // 逐行校验数据（从第二行开始）
    const rows = [];
    let validCount = 0;
    let invalidCount = 0;

    for (let rowIdx = 1; rowIdx < jsonData.length; rowIdx++) {
      const rowData = jsonData[rowIdx];
      const studentNo = String(rowData[studentNoIndex] || '').trim();
      const studentName = String(rowData[studentNameIndex] || '').trim();

      const rowResult = {
        rowIndex: rowIdx,
        studentNo,
        studentName,
        valid: true,
        message: '',
        scores: []
      };

      const rowMessages = [];

      // 校验学号
      if (!studentNo) {
        rowResult.valid = false;
        rowMessages.push('学号不能为空');
      } else {
        const student = studentMap[studentNo];
        if (!student) {
          rowResult.valid = false;
          rowMessages.push(`学号 ${studentNo} 的学生不存在或不属于该班级`);
        } else {
          rowResult.studentId = student.id;
          // 校验姓名
          if (studentName && student.name !== studentName) {
            rowMessages.push(`姓名不一致：Excel中为"${studentName}"，系统中为"${student.name}"`);
          }
        }
      }

      // 校验各科分数
      for (const subCol of subjectColumns) {
        const rawScore = rowData[subCol.colIndex];
        const scoreResult = {
          subjectId: subCol.subjectId,
          subjectName: subCol.subjectName,
          score: null,
          isAbsent: false,
          valid: true,
          message: ''
        };

        const scoreStr = String(rawScore || '').trim();

        // 处理缺考
        if (scoreStr === '' || scoreStr === '缺考' || scoreStr === '缺席' || scoreStr === 'absent') {
          scoreResult.isAbsent = true;
          scoreResult.score = null;
        } else {
          const scoreNum = parseFloat(scoreStr);
          if (isNaN(scoreNum)) {
            scoreResult.valid = false;
            scoreResult.message = `分数格式不正确："${scoreStr}"`;
          } else if (scoreNum < 0 || scoreNum > subCol.fullScore) {
            scoreResult.valid = false;
            scoreResult.message = `分数 ${scoreNum} 超出范围（0-${subCol.fullScore}）`;
          } else {
            scoreResult.score = scoreNum;
          }
        }

        if (!scoreResult.valid) {
          rowResult.valid = false;
        }

        rowResult.scores.push(scoreResult);
      }

      rowResult.message = rowMessages.join('；');

      if (rowResult.valid) {
        validCount++;
      } else {
        invalidCount++;
      }

      rows.push(rowResult);
    }

    return {
      total: rows.length,
      validCount,
      invalidCount,
      rows
    };
  }

  // ==================== Excel 成绩导出 ====================

  // 导出班级成绩为 Excel Buffer
  static async exportScores(examId, classId, subjectId = null) {
    // 验证考试和班级
    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('考试不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const cls = await Class.findById(classId);
    if (!cls) {
      const error = new Error('班级不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 获取考试科目
    const examSubjects = await Exam.getExamSubjects(examId);
    let exportSubjects = examSubjects;
    if (subjectId) {
      exportSubjects = examSubjects.filter(es => String(es.subject_id) === String(subjectId));
      if (exportSubjects.length === 0) {
        const error = new Error('该考试不包含指定科目');
        error.name = 'ValidationError';
        error.code = ErrorCode.PARAM_VALIDATION;
        throw error;
      }
    }

    if (exportSubjects.length === 0) {
      const error = new Error('该考试尚未配置科目');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    // 获取班级所有学生
    const classStudents = await User.getStudentsByClassId(classId);

    // 获取成绩数据
    const scores = await ExamScore.getByExamAndClass(examId, classId, subjectId);

    // 按学生分组成绩
    const studentScoresMap = {};
    for (const s of scores) {
      if (!studentScoresMap[s.student_id]) {
        studentScoresMap[s.student_id] = {};
      }
      studentScoresMap[s.student_id][s.subject_id] = s;
    }

    // 构建 Excel 数据
    const headers = ['学号', '姓名', ...exportSubjects.map(es => es.subject_name)];
    // 多科目时才显示总分、平均分、排名
    if (exportSubjects.length > 1) {
      headers.push('总分', '平均分', '班级排名');
    }

    const excelData = [headers];

    for (const student of classStudents) {
      const row = [student.student_id || '', student.name || ''];
      let totalScore = 0;
      let validSubjectCount = 0;
      let classRank = null;

      for (const es of exportSubjects) {
        const score = studentScoresMap[student.id]?.[es.subject_id];
        if (score) {
          if (score.is_absent) {
            row.push('缺考');
          } else {
            row.push(score.score ?? '');
            if (score.score !== null && score.score !== undefined) {
              totalScore += Number(score.score);
              validSubjectCount++;
            }
          }
          // 使用第一个科目的班级排名作为参考（多科目时按总分排名需要额外计算）
          if (classRank === null && score.rank_in_class) {
            classRank = score.rank_in_class;
          }
        } else {
          row.push('');
        }
      }

      if (exportSubjects.length > 1) {
        row.push(validSubjectCount > 0 ? parseFloat(totalScore.toFixed(2)) : '');
        row.push(validSubjectCount > 0 ? parseFloat((totalScore / validSubjectCount).toFixed(2)) : '');
        row.push(classRank || '');
      }

      excelData.push(row);
    }

    // 如果是多科目，按总分降序排列并更新排名（从第二行开始排序）
    if (exportSubjects.length > 1) {
      const dataRows = excelData.slice(1);
      dataRows.sort((a, b) => {
        const totalA = typeof a[headers.indexOf('总分')] === 'number' ? a[headers.indexOf('总分')] : -1;
        const totalB = typeof b[headers.indexOf('总分')] === 'number' ? b[headers.indexOf('总分')] : -1;
        return totalB - totalA;
      });
      // 更新排名
      const totalIdx = headers.indexOf('总分');
      const rankIdx = headers.indexOf('班级排名');
      let currentRank = 1;
      let prevTotal = null;
      for (let i = 0; i < dataRows.length; i++) {
        const currentTotal = dataRows[i][totalIdx];
        if (currentTotal === '' || currentTotal === null) {
          dataRows[i][rankIdx] = '';
        } else if (prevTotal === null || currentTotal !== prevTotal) {
          currentRank = i + 1;
          prevTotal = currentTotal;
          dataRows[i][rankIdx] = currentRank;
        } else {
          dataRows[i][rankIdx] = currentRank;
        }
      }
      excelData.splice(1, dataRows.length, ...dataRows);
    }

    // 生成 Excel Workbook
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);

    // 设置列宽
    const colWidths = headers.map(() => ({ wch: 12 }));
    colWidths[0] = { wch: 15 }; // 学号
    colWidths[1] = { wch: 10 }; // 姓名
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '成绩表');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const fileName = `${exam.name}_${cls.name}_成绩表.xlsx`;

    return { buffer, fileName };
  }

  // ==================== Excel 导入模板生成 ====================

  // 生成成绩导入模板 Excel Buffer
  static async generateImportTemplate(examId, classId) {
    // 验证考试和班级
    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('考试不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const cls = await Class.findById(classId);
    if (!cls) {
      const error = new Error('班级不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 获取考试科目
    const examSubjects = await Exam.getExamSubjects(examId);
    if (examSubjects.length === 0) {
      const error = new Error('该考试尚未配置科目');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    // 获取班级所有学生
    const students = await User.getStudentsByClassId(classId);

    // 构建表头
    const headers = ['学号', '姓名', ...examSubjects.map(es => es.subject_name)];

    // 构建数据行
    const excelData = [headers];
    for (const student of students) {
      const row = [student.student_id || '', student.name || ''];
      // 各科分数列留空
      for (let i = 0; i < examSubjects.length; i++) {
        row.push('');
      }
      excelData.push(row);
    }

    // 生成 Excel
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);

    // 设置列宽
    const colWidths = headers.map(() => ({ wch: 12 }));
    colWidths[0] = { wch: 15 }; // 学号
    colWidths[1] = { wch: 10 }; // 姓名
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '成绩导入模板');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const fileName = `${exam.name}_${cls.name}_成绩导入模板.xlsx`;

    return { buffer, fileName };
  }

  // ==================== 批量导入成绩（支持 Excel 导入后的新格式） ====================

  // 批量导入成绩 - 增强版，支持两种格式
  // 格式1（原有）：{ examId, scores: [{ studentId, subjectId, classId, score, isAbsent, remark }] }
  // 格式2（新增）：{ examId, classId, rows: [{ studentId, scores: [{ subjectId, score, isAbsent, remark }] }] }
  static async importScores(examId, scoresData, classId = null) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('考试不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 检测格式：如果有 rows 字段，使用新格式
    if (scoresData && Array.isArray(scoresData.rows)) {
      return this._importScoresFromRows(examId, classId, scoresData.rows);
    }

    // 原有格式：scores 是扁平数组
    if (!Array.isArray(scoresData) || scoresData.length === 0) {
      const error = new Error('成绩数据不能为空');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    // 为每条成绩添加 examId
    const scores = scoresData.map(s => ({ ...s, examId }));

    // 批量插入/更新
    const affectedRows = await ExamScore.batchCreate(scores);

    // 获取涉及的所有科目，重新计算排名
    const subjectIds = [...new Set(scores.map(s => s.subjectId))];
    for (const subjectId of subjectIds) {
      await ExamScore.calculateRankings(examId, subjectId);
    }

    return { affectedRows, subjectCount: subjectIds.length };
  }

  // 从 rows 格式批量导入成绩（Excel 导入后的数据格式）
  static async _importScoresFromRows(examId, classId, rows) {
    if (!classId) {
      const error = new Error('班级ID不能为空');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      const error = new Error('成绩数据不能为空');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    const cls = await Class.findById(classId);
    if (!cls) {
      const error = new Error('班级不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 将 rows 格式转换为扁平的 scores 数组
    const scores = [];
    const subjectIdsSet = new Set();

    for (const row of rows) {
      const { studentId, scores: studentScores } = row;
      if (!studentId || !Array.isArray(studentScores)) continue;

      for (const sc of studentScores) {
        scores.push({
          examId,
          studentId,
          subjectId: sc.subjectId,
          classId,
          score: sc.isAbsent ? null : sc.score,
          isAbsent: sc.isAbsent || false,
          remark: sc.remark || null
        });
        subjectIdsSet.add(sc.subjectId);
      }
    }

    if (scores.length === 0) {
      const error = new Error('有效成绩数据为空');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    // 批量插入/更新
    const affectedRows = await ExamScore.batchCreate(scores);

    // 重新计算各科排名
    const subjectIds = [...subjectIdsSet];
    for (const subjectId of subjectIds) {
      await ExamScore.calculateRankings(examId, subjectId);
    }

    return {
      affectedRows,
      subjectCount: subjectIds.length,
      studentCount: rows.length
    };
  }

  // 获取班级成绩列表
  static async getClassScores(examId, classId, subjectId) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('考试不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const cls = await Class.findById(classId);
    if (!cls) {
      const error = new Error('班级不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const scores = await ExamScore.getByExamAndClass(examId, classId, subjectId);
    return scores;
  }

  // 获取学生某次考试成绩
  static async getStudentScores(examId, studentId) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('考试不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const scores = await ExamScore.getByExamAndStudent(examId, studentId);

    // 计算总分
    const totalScore = scores.reduce((sum, s) => sum + (s.score || 0), 0);
    const avgScore = scores.length > 0 ? (totalScore / scores.length).toFixed(2) : 0;

    // 获取最高/最低班级排名和年级排名
    const classRanks = scores.map(s => s.rank_in_class).filter(r => r !== null);
    const gradeRanks = scores.map(s => s.rank_in_grade).filter(r => r !== null);

    return {
      examId,
      studentId,
      totalScore: parseFloat(totalScore.toFixed(2)),
      avgScore: parseFloat(avgScore),
      bestClassRank: classRanks.length > 0 ? Math.min(...classRanks) : null,
      worstClassRank: classRanks.length > 0 ? Math.max(...classRanks) : null,
      bestGradeRank: gradeRanks.length > 0 ? Math.min(...gradeRanks) : null,
      worstGradeRank: gradeRanks.length > 0 ? Math.max(...gradeRanks) : null,
      subjects: scores
    };
  }

  // 更新单条成绩
  static async updateScore(id, scoreData) {
    const score = await ExamScore.findById(id);
    if (!score) {
      const error = new Error('成绩记录不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    await ExamScore.update(id, scoreData);

    // 重新计算该科目的排名
    if (scoreData.score !== undefined || scoreData.isAbsent !== undefined) {
      await ExamScore.calculateRankings(score.exam_id, score.subject_id);
    }
  }

  // 删除成绩
  static async deleteScore(id) {
    const score = await ExamScore.findById(id);
    if (!score) {
      const error = new Error('成绩记录不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const { exam_id: examId, subject_id: subjectId } = score;
    await ExamScore.delete(id);

    // 重新计算该科目的排名
    await ExamScore.calculateRankings(examId, subjectId);
  }

  // 学生成绩历史
  static async getStudentScoreHistory(studentId, params) {
    const result = await ExamScore.getByStudentId(studentId, params);
    return result;
  }

  // ==================== 教学质量分析 ====================

  // 班级学情分析
  static async getClassAnalysis(examId, classId) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('考试不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const cls = await Class.findById(classId);
    if (!cls) {
      const error = new Error('班级不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 获取考试科目
    const examSubjects = await Exam.getExamSubjects(examId);

    // 对每个科目计算班级统计
    const subjectStats = [];
    const weakSubjects = [];

    for (const es of examSubjects) {
      const classStat = await ExamScore.getClassStats(examId, classId, es.subject_id);
      const gradeStat = await ExamScore.getGradeStats(examId, es.subject_id);

      const stat = {
        subjectId: es.subject_id,
        subjectName: es.subject_name,
        subjectCode: es.subject_code,
        fullScore: es.full_score,
        ...classStat,
        gradeAvgScore: gradeStat.avgScore,
        avgScoreDiff: classStat.avgScore !== null && gradeStat.avgScore !== null
          ? parseFloat((classStat.avgScore - gradeStat.avgScore).toFixed(2))
          : null
      };

      subjectStats.push(stat);

      // 识别薄弱科目（平均分低于年级平均分，或及格率低于年级平均及格率）
      if (
        (stat.avgScoreDiff !== null && stat.avgScoreDiff < 0) ||
        (classStat.passRate < gradeStat.passRate)
      ) {
        weakSubjects.push({
          subjectId: es.subject_id,
          subjectName: es.subject_name,
          avgScoreDiff: stat.avgScoreDiff,
          passRateDiff: parseFloat((classStat.passRate - gradeStat.passRate).toFixed(2))
        });
      }
    }

    // 班级排名情况：获取各科班级前10名学生
    const topStudents = {};
    for (const es of examSubjects) {
      const scores = await ExamScore.getByExamAndClass(examId, classId, es.subject_id);
      topStudents[es.subject_id] = scores.slice(0, 10).map(s => ({
        studentId: s.student_id,
        studentName: s.student_name,
        score: s.score,
        rankInClass: s.rank_in_class,
        rankInGrade: s.rank_in_grade
      }));
    }

    // 班级学生总分排名（用于"班级排名前10"展示）
    const classScores = await ExamScore.getByExamAndClass(examId, classId, null);
    const studentScoreMap = this._aggregateStudentScores(classScores);
    const totalRankMap = this._rankByTotal(studentScoreMap);
    const studentRankings = Object.values(studentScoreMap)
      .filter((s) => s.count > 0)
      .map((s) => ({
        studentId: s.studentId,
        studentName: s.studentName,
        studentNo: s.studentNo,
        totalScore: parseFloat(s.total.toFixed(2)),
        avgScore: parseFloat((s.total / s.count).toFixed(2)),
        classRank: totalRankMap[String(s.studentId)] || null
      }))
      .sort((a, b) => (a.classRank || 0) - (b.classRank || 0));

    return {
      exam: { id: exam.id, name: exam.name, examType: exam.exam_type, grade: exam.grade },
      class: { id: cls.id, name: cls.name, grade: cls.grade },
      subjectStats,
      topStudents,
      studentRankings,
      weakSubjects,
      overall: {
        subjectCount: subjectStats.length,
        avgPassRate: subjectStats.length > 0
          ? parseFloat((subjectStats.reduce((sum, s) => sum + s.passRate, 0) / subjectStats.length).toFixed(2))
          : 0,
        avgExcellentRate: subjectStats.length > 0
          ? parseFloat((subjectStats.reduce((sum, s) => sum + s.excellentRate, 0) / subjectStats.length).toFixed(2))
          : 0
      }
    };
  }

  // 年级学情分析
  static async getGradeAnalysis(examId) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('考试不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 获取考试科目
    const examSubjects = await Exam.getExamSubjects(examId);

    // 获取该年级所有班级
    const classes = await Class.getByGrade(exam.grade);

    // 各班平均分对比（按科目）
    const classComparisons = [];
    for (const cls of classes) {
      const classData = {
        classId: cls.id,
        className: cls.name,
        subjects: [],
        overallAvg: 0
      };

      let totalAvg = 0;
      let subjectCount = 0;

      for (const es of examSubjects) {
        const stat = await ExamScore.getClassStats(examId, cls.id, es.subject_id);
        classData.subjects.push({
          subjectId: es.subject_id,
          subjectName: es.subject_name,
          avgScore: stat.avgScore,
          passRate: stat.passRate,
          excellentRate: stat.excellentRate
        });

        if (stat.avgScore !== null) {
          totalAvg += stat.avgScore;
          subjectCount++;
        }
      }

      classData.overallAvg = subjectCount > 0 ? parseFloat((totalAvg / subjectCount).toFixed(2)) : 0;
      classComparisons.push(classData);
    }

    // 按总分平均分排序
    classComparisons.sort((a, b) => b.overallAvg - a.overallAvg);
    classComparisons.forEach((c, idx) => { c.rank = idx + 1; });

    // 各学科平均分对比（年级）
    const subjectStats = [];
    for (const es of examSubjects) {
      const gradeStat = await ExamScore.getGradeStats(examId, es.subject_id);
      subjectStats.push({
        subjectId: es.subject_id,
        subjectName: es.subject_name,
        fullScore: es.full_score,
        ...gradeStat
      });
    }

    // 年级分数段分布（汇总所有科目）
    const gradeDistribution = {
      excellent: 0,
      good: 0,
      medium: 0,
      pass: 0,
      fail: 0
    };
    for (const s of subjectStats) {
      gradeDistribution.excellent += s.scoreDistribution.excellent;
      gradeDistribution.good += s.scoreDistribution.good;
      gradeDistribution.medium += s.scoreDistribution.medium;
      gradeDistribution.pass += s.scoreDistribution.pass;
      gradeDistribution.fail += s.scoreDistribution.fail;
    }

    // 优秀班级/薄弱班级
    const excellentClasses = classComparisons.slice(0, 3);
    const weakClasses = classComparisons.slice(-3).reverse();

    return {
      exam: { id: exam.id, name: exam.name, examType: exam.exam_type, grade: exam.grade },
      classCount: classes.length,
      subjectCount: examSubjects.length,
      classComparisons,
      subjectStats,
      gradeDistribution,
      excellentClasses: excellentClasses.map(c => ({
        classId: c.classId,
        className: c.className,
        overallAvg: c.overallAvg,
        rank: c.rank
      })),
      weakClasses: weakClasses.map(c => ({
        classId: c.classId,
        className: c.className,
        overallAvg: c.overallAvg,
        rank: c.rank
      }))
    };
  }

  // 学生个人学情分析
  static async getStudentAnalysis(studentId, examId = null) {
    // 如果指定了考试，分析该次考试
    if (examId) {
      const exam = await Exam.findById(examId);
      if (!exam) {
        const error = new Error('考试不存在');
        error.name = 'NotFoundError';
        error.status = 404;
        throw error;
      }

      const scores = await ExamScore.getByExamAndStudent(examId, studentId);
      if (scores.length === 0) {
        const error = new Error('该学生暂无此考试的成绩');
        error.name = 'NotFoundError';
        error.status = 404;
        throw error;
      }

      // 各科成绩雷达图数据
      const radarData = scores.map(s => ({
        subject: s.subject_name,
        score: s.score || 0,
        fullScore: 100
      }));

      // 优势学科/薄弱学科识别
      const sortedScores = [...scores].filter(s => s.score !== null).sort((a, b) => b.score - a.score);
      const strongSubjects = sortedScores.slice(0, Math.ceil(sortedScores.length / 3)).map(s => ({
        subjectId: s.subject_id,
        subjectName: s.subject_name,
        score: s.score,
        rankInClass: s.rank_in_class,
        rankInGrade: s.rank_in_grade
      }));
      const weakSubjects = sortedScores.slice(-Math.ceil(sortedScores.length / 3)).reverse().map(s => ({
        subjectId: s.subject_id,
        subjectName: s.subject_name,
        score: s.score,
        rankInClass: s.rank_in_class,
        rankInGrade: s.rank_in_grade
      }));

      // 班级排名和年级排名
      const classRanks = scores.map(s => s.rank_in_class).filter(r => r !== null);
      const gradeRanks = scores.map(s => s.rank_in_grade).filter(r => r !== null);

      return {
        studentId,
        examId,
        examName: exam.name,
        radarData,
        strongSubjects,
        weakSubjects,
        classRankRange: classRanks.length > 0 ? {
          best: Math.min(...classRanks),
          worst: Math.max(...classRanks),
          avg: parseFloat((classRanks.reduce((a, b) => a + b, 0) / classRanks.length).toFixed(1))
        } : null,
        gradeRankRange: gradeRanks.length > 0 ? {
          best: Math.min(...gradeRanks),
          worst: Math.max(...gradeRanks),
          avg: parseFloat((gradeRanks.reduce((a, b) => a + b, 0) / gradeRanks.length).toFixed(1))
        } : null,
        subjects: scores
      };
    }

    // 没有指定考试，分析历史成绩趋势
    const historyResult = await ExamScore.getByStudentId(studentId, { page: 1, pageSize: 50 });
    const history = historyResult.list;

    if (history.length === 0) {
      return {
        studentId,
        totalExams: 0,
        trend: [],
        subjectTrend: {},
        strongSubjects: [],
        weakSubjects: []
      };
    }

    // 按考试日期排序
    history.sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));

    // 成绩趋势（历次考试总分/平均分）
    const trend = history.map(exam => {
      const scores = exam.subjects.filter(s => s.score !== null && s.is_absent === 0);
      const total = scores.reduce((sum, s) => sum + Number(s.score || 0), 0);
      const avg = scores.length > 0 ? parseFloat((total / scores.length).toFixed(2)) : 0;
      return {
        examId: exam.id,
        examName: exam.name,
        examDate: exam.exam_date,
        totalScore: parseFloat(total.toFixed(2)),
        avgScore: avg,
        subjectCount: scores.length
      };
    });

    // 各学科成绩趋势
    const subjectMap = {};
    for (const exam of history) {
      for (const score of exam.subjects) {
        if (score.is_absent) continue;
        if (!subjectMap[score.subject_id]) {
          subjectMap[score.subject_id] = {
            subjectId: score.subject_id,
            subjectName: score.subject_name,
            scores: []
          };
        }
        subjectMap[score.subject_id].scores.push({
          examId: exam.id,
          examName: exam.name,
          examDate: exam.exam_date,
          score: score.score,
          rankInClass: score.rank_in_class,
          rankInGrade: score.rank_in_grade
        });
      }
    }

    // 计算各学科平均分，识别优势/薄弱学科
    const subjectAverages = [];
    for (const sid in subjectMap) {
      const subj = subjectMap[sid];
      const validScores = subj.scores.filter(s => s.score !== null);
      if (validScores.length > 0) {
        const avg = validScores.reduce((sum, s) => sum + Number(s.score), 0) / validScores.length;
        subjectAverages.push({
          subjectId: subj.subjectId,
          subjectName: subj.subjectName,
          avgScore: parseFloat(avg.toFixed(2)),
          examCount: validScores.length
        });
      }
    }

    subjectAverages.sort((a, b) => b.avgScore - a.avgScore);
    const strongSubjects = subjectAverages.slice(0, Math.ceil(subjectAverages.length / 3));
    const weakSubjects = subjectAverages.slice(-Math.ceil(subjectAverages.length / 3)).reverse();

    return {
      studentId,
      totalExams: history.length,
      trend,
      subjectTrend: subjectMap,
      strongSubjects,
      weakSubjects
    };
  }

  // ==================== 进步/退步学生识别 ====================

  /**
   * 对比两次考试，识别进步 / 退步学生
   * @param {number} examId - 当前考试ID
   * @param {number} classId - 班级ID
   * @param {number|null} baseExamId - 对比基准考试ID（为空时自动取该班级上一场有成绩的考试）
   * @param {number|null} subjectId - 指定科目（为空时按总分对比）
   * @param {number} limit - 进步/退步榜单返回条数
   */
  static async getProgressComparison(examId, classId, baseExamId = null, subjectId = null, limit = 10) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      const error = new Error('考试不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const cls = await Class.findById(classId);
    if (!cls) {
      const error = new Error('班级不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const parsedLimit = Number(limit);
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(Math.floor(parsedLimit), 50)
      : 10;

    // 校验可选科目
    let subject = null;
    if (subjectId) {
      subject = await Subject.findById(subjectId);
      if (!subject) {
        const error = new Error('学科不存在');
        error.name = 'NotFoundError';
        error.status = 404;
        throw error;
      }
    }

    // 确定基准考试
    let baseExam = null;
    if (baseExamId) {
      if (String(baseExamId) === String(examId)) {
        const error = new Error('对比考试不能与当前考试相同');
        error.name = 'ValidationError';
        error.code = ErrorCode.PARAM_VALIDATION;
        throw error;
      }
      baseExam = await Exam.findById(baseExamId);
      if (!baseExam) {
        const error = new Error('对比基准考试不存在');
        error.name = 'NotFoundError';
        error.status = 404;
        throw error;
      }
    } else {
      // 默认取该班级上一场有成绩的考试
      const examList = await Exam.getExamsWithScoresForClass(classId);
      const idx = examList.findIndex((e) => String(e.id) === String(examId));
      if (idx >= 0 && idx + 1 < examList.length) {
        baseExam = examList[idx + 1];
      }
    }

    const examMeta = {
      id: exam.id,
      name: exam.name,
      examDate: exam.exam_date,
      examType: exam.exam_type
    };

    if (!baseExam) {
      return {
        exam: examMeta,
        baseExam: null,
        subject: subject ? { id: subject.id, name: subject.name } : null,
        hasComparison: false,
        summary: null,
        progressTop: [],
        declineTop: [],
        students: []
      };
    }

    const [currentRows, baseRows] = await Promise.all([
      ExamScore.getByExamAndClass(examId, classId, subjectId || null),
      ExamScore.getByExamAndClass(baseExam.id, classId, subjectId || null)
    ]);

    const currentMap = this._aggregateStudentScores(currentRows);
    const baseMap = this._aggregateStudentScores(baseRows);

    // 两次考试分别按总分计算班级排名
    const currentRanks = this._rankByTotal(currentMap);
    const baseRanks = this._rankByTotal(baseMap);

    const students = [];
    for (const studentId of Object.keys(currentMap)) {
      // 仅对比两次考试都参加的学生
      if (!baseMap[studentId]) continue;

      const cur = currentMap[studentId];
      const base = baseMap[studentId];

      const delta = parseFloat((cur.total - base.total).toFixed(2));
      const baseRank = baseRanks[studentId] ?? null;
      const currentRank = currentRanks[studentId] ?? null;

      students.push({
        studentId: Number(studentId),
        studentName: cur.studentName,
        studentNo: cur.studentNo,
        baseScore: parseFloat(base.total.toFixed(2)),
        currentScore: parseFloat(cur.total.toFixed(2)),
        delta,
        baseRank,
        currentRank,
        rankDelta: baseRank !== null && currentRank !== null ? baseRank - currentRank : null,
        level: delta > 0 ? 'progress' : (delta < 0 ? 'decline' : 'stable')
      });
    }

    // 按分差降序：进步榜取头部，退步榜取尾部并反转
    students.sort((a, b) => b.delta - a.delta);

    const progressTop = students.filter((s) => s.delta > 0).slice(0, safeLimit);
    const declineTop = students.filter((s) => s.delta < 0).slice(-safeLimit).reverse();

    const progressCount = students.filter((s) => s.delta > 0).length;
    const declineCount = students.filter((s) => s.delta < 0).length;

    return {
      exam: examMeta,
      baseExam: {
        id: baseExam.id,
        name: baseExam.name,
        examDate: baseExam.exam_date,
        examType: baseExam.exam_type
      },
      subject: subject ? { id: subject.id, name: subject.name } : null,
      hasComparison: true,
      summary: {
        comparedCount: students.length,
        progressCount,
        declineCount,
        stableCount: students.length - progressCount - declineCount,
        avgDelta: students.length > 0
          ? parseFloat((students.reduce((sum, s) => sum + s.delta, 0) / students.length).toFixed(2))
          : 0,
        maxProgress: progressTop.length > 0 ? progressTop[0].delta : 0,
        maxDecline: declineTop.length > 0 ? declineTop[0].delta : 0
      },
      progressTop,
      declineTop,
      students
    };
  }

  // 将成绩行按学生聚合为总分（缺考科目不计入）
  static _aggregateStudentScores(rows) {
    const map = {};
    for (const r of rows) {
      const key = String(r.student_id);
      if (!map[key]) {
        map[key] = {
          studentId: r.student_id,
          studentName: r.student_name,
          studentNo: r.student_no,
          total: 0,
          count: 0,
          absent: 0
        };
      }
      const item = map[key];
      if (r.is_absent) {
        item.absent++;
        continue;
      }
      if (r.score !== null && r.score !== undefined) {
        item.total += Number(r.score);
        item.count++;
      }
    }
    return map;
  }

  // 按总分降序计算班级排名（同分并列）
  static _rankByTotal(map) {
    const list = Object.values(map)
      .filter((s) => s.count > 0)
      .sort((a, b) => b.total - a.total);

    const ranks = {};
    let prevTotal = null;
    let rank = 0;
    list.forEach((s, i) => {
      if (prevTotal === null || s.total !== prevTotal) {
        rank = i + 1;
        prevTotal = s.total;
      }
      ranks[String(s.studentId)] = rank;
    });
    return ranks;
  }

  // ==================== AI 学情诊断 ====================

  /**
   * 构造班级学情诊断的 prompt
   */
  static buildClassDiagnosisMessages(analysis) {
    const { exam, class: cls, subjectStats, weakSubjects, topStudents, overall } = analysis;

    const subjectLines = subjectStats.map((s) => {
      const diff = s.avgScoreDiff === null || s.avgScoreDiff === undefined
        ? '无年级对比数据'
        : (s.avgScoreDiff >= 0 ? `高于年级平均 ${s.avgScoreDiff} 分` : `低于年级平均 ${Math.abs(s.avgScoreDiff)} 分`);
      return `${s.subjectName}：满分${s.fullScore}，班级平均${s.avgScore === null ? '无' : s.avgScore}分，` +
        `最高${s.maxScore === null ? '无' : s.maxScore}分，最低${s.minScore === null ? '无' : s.minScore}分，` +
        `及格率${s.passRate === null ? '无' : s.passRate + '%'}，优秀率${s.excellentRate === null ? '无' : s.excellentRate + '%'}，` +
        `参考人数${s.studentCount}，${diff}`;
    }).join('\n');

    const weakLines = weakSubjects.length > 0
      ? weakSubjects.map((s) => `${s.subjectName}（平均分差 ${s.avgScoreDiff === null ? '无' : s.avgScoreDiff}，及格率差 ${s.passRateDiff === null ? '无' : s.passRateDiff}%）`).join('、')
      : '无明显薄弱学科';

    // 各科前三名学生
    const topLines = subjectStats.map((s) => {
      const list = topStudents[s.subjectId] || [];
      const names = list.slice(0, 3).map((t) => `${t.studentName}(${t.score}分)`).join('、');
      return `${s.subjectName}：${names || '暂无数据'}`;
    }).join('\n');

    const systemPrompt =
      '你是一位资深的中学教学质量管理专家，擅长基于考试成绩数据撰写班级学情诊断报告。' +
      '你的分析客观、专业、有针对性，善于从数据中发现教学问题并给出可落地的改进建议。' +
      '请直接输出报告正文，使用纯文本结构化格式（小标题 + 段落），' +
      '不要使用 Markdown 语法（不要使用 #、*、-、表格、代码块等任何标记符号），小标题直接写文字即可。';

    const userMessage =
      `请根据以下班级考试数据，撰写一份班级学情诊断报告。\n\n` +
      `【基本信息】\n` +
      `考试名称：${exam.name}\n` +
      `考试类型：${exam.examType || '未标注'}\n` +
      `年级：${exam.grade || cls.grade || '未标注'}\n` +
      `班级：${cls.name}\n` +
      `考试科目数：${overall.subjectCount}\n` +
      `班级平均及格率：${overall.avgPassRate}%\n` +
      `班级平均优秀率：${overall.avgExcellentRate}%\n\n` +
      `【各学科统计】\n${subjectLines}\n\n` +
      `【薄弱学科】\n${weakLines}\n\n` +
      `【各科班级前列学生】\n${topLines}\n\n` +
      `【报告要求】\n` +
      `1. 全文 400-800 字，纯文本，使用小标题加段落的形式，不要使用 Markdown 表格。\n` +
      `2. 必须包含以下部分：\n` +
      `   一、整体评价：结合及格率、优秀率与年级平均水平，总体判断班级学习状况。\n` +
      `   二、优势学科分析：指出相对突出或高于年级平均的学科，分析可能原因。\n` +
      `   三、薄弱学科分析：指出低于年级平均或及格率偏低的学科，分析问题所在。\n` +
      `   四、班级共性问题：从数据中归纳班级整体存在的共性问题（如偏科、后进面大、尖子生不突出等）。\n` +
      `   五、改进建议：分别从「教师层面」（教学方法、作业分层、针对性辅导等）和「班级管理层面」（学习氛围、学法指导、家校协同等）给出具体可执行的建议。\n` +
      `3. 分析要结合给出的具体数据，避免空泛套话。`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];
  }

  /**
   * 构造个人学情画像的 prompt
   */
  static buildStudentDiagnosisMessages(student, analysis, examId) {
    const { name, class_name: className, grade } = student;

    let dataSection = '';
    if (examId) {
      const { examName, radarData, strongSubjects, weakSubjects, classRankRange, gradeRankRange } = analysis;
      const subjectLines = radarData.map((s) => `${s.subject}：${s.score}分`).join('、');
      const strongLines = strongSubjects.length > 0
        ? strongSubjects.map((s) => `${s.subjectName}(${s.score}分，班级第${s.rankInClass || '无'}名，年级第${s.rankInGrade || '无'}名)`).join('、')
        : '暂无';
      const weakLines = weakSubjects.length > 0
        ? weakSubjects.map((s) => `${s.subjectName}(${s.score}分，班级第${s.rankInClass || '无'}名，年级第${s.rankInGrade || '无'}名)`).join('、')
        : '暂无';
      const classRank = classRankRange
        ? `最好 ${classRankRange.best} 名，最差 ${classRankRange.worst} 名，平均 ${classRankRange.avg} 名`
        : '暂无';
      const gradeRank = gradeRankRange
        ? `最好 ${gradeRankRange.best} 名，最差 ${gradeRankRange.worst} 名，平均 ${gradeRankRange.avg} 名`
        : '暂无';

      dataSection =
        `【本次考试】\n` +
        `考试名称：${examName}\n` +
        `各科成绩：${subjectLines}\n` +
        `优势学科：${strongLines}\n` +
        `薄弱学科：${weakLines}\n` +
        `班级排名区间：${classRank}\n` +
        `年级排名区间：${gradeRank}\n`;
    } else {
      const { totalExams, trend, strongSubjects, weakSubjects } = analysis;
      const trendLines = trend.length > 0
        ? trend.map((t) => `${t.examName}(${t.examDate ? String(t.examDate).slice(0, 10) : '日期未知'})：总分${t.totalScore}，平均${t.avgScore}，科目数${t.subjectCount}`).join('\n')
        : '暂无历次成绩数据';
      const strongLines = strongSubjects.length > 0
        ? strongSubjects.map((s) => `${s.subjectName}(历次平均${s.avgScore}分，共${s.examCount}次)`).join('、')
        : '暂无';
      const weakLines = weakSubjects.length > 0
        ? weakSubjects.map((s) => `${s.subjectName}(历次平均${s.avgScore}分，共${s.examCount}次)`).join('、')
        : '暂无';

      dataSection =
        `【历次考试情况】\n` +
        `参与考试次数：${totalExams}\n` +
        `${trendLines}\n` +
        `优势学科：${strongLines}\n` +
        `薄弱学科：${weakLines}\n`;
    }

    const systemPrompt =
      '你是一位经验丰富的中学班主任兼学业规划导师，擅长基于学生成绩数据撰写个性化个人学情画像。' +
      '你的分析温和、客观、以鼓励为主，同时直指问题并给出可执行的提升建议。' +
      '请直接输出报告正文，使用纯文本结构化格式（小标题 + 段落），' +
      '不要使用 Markdown 语法（不要使用 #、*、-、表格、代码块等任何标记符号），小标题直接写文字即可。';

    const userMessage =
      `请根据以下学生成绩数据，撰写一份个人学情画像。\n\n` +
      `【学生基本信息】\n` +
      `姓名：${name}\n` +
      `班级：${className || '未分配'}\n` +
      `年级：${grade || '未标注'}\n\n` +
      `${dataSection}\n` +
      `【报告要求】\n` +
      `1. 全文 400-800 字，纯文本，使用小标题加段落的形式，不要使用 Markdown 表格。\n` +
      `2. 必须包含以下部分：\n` +
      `   一、学习特点概述：结合成绩分布与排名，概括该生的整体学习状态与特点。\n` +
      `   二、优势学科及原因：指出优势学科，分析其可能的学习优势与原因。\n` +
      `   三、薄弱环节：指出薄弱学科或环节，分析可能存在的知识漏洞与学习障碍。\n` +
      `   四、成绩变化趋势解读：若有历次成绩数据，解读其成绩变化趋势与波动原因；若无，则结合本次考试排名说明其位置。\n` +
      `   五、提升建议：给出 3-5 条具体、可执行的提升建议（如时间分配、错题整理、专项训练、心态调整等）。\n` +
      `3. 语言要贴合学生，避免空泛套话，建议要具体可落地。`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];
  }

  /**
   * 调用大模型生成文本（统一错误包装）
   */
  static async callDiagnosisAI(messages, maxTokens = 1500) {
    try {
      const content = await DeepSeekService.chat(messages, {
        model: 'deepseek-chat',
        temperature: 0.7,
        maxTokens
      });
      return (content || '').trim();
    } catch (error) {
      console.error('AI 学情诊断生成失败:', error.message);
      const apiError = new Error(`AI学情诊断生成失败：${error.message}`);
      apiError.name = 'AIServiceError';
      apiError.code = ErrorCode.SERVICE_UNAVAILABLE;
      apiError.cause = error;
      throw apiError;
    }
  }

  /**
   * 生成班级学情诊断报告
   * @param {number} examId - 考试ID
   * @param {number} classId - 班级ID
   * @param {number} userId - 生成人ID
   */
  static async generateClassDiagnosis(examId, classId, userId) {
    // 复用已有的班级学情分析（数据不存在时会抛 404，直接透传）
    const analysis = await this.getClassAnalysis(examId, classId);

    // 生成时使用的统计快照
    const metrics = {
      examId: analysis.exam.id,
      examName: analysis.exam.name,
      classId: analysis.class.id,
      className: analysis.class.name,
      overall: analysis.overall,
      subjectStats: analysis.subjectStats.map((s) => ({
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        fullScore: s.fullScore,
        avgScore: s.avgScore,
        maxScore: s.maxScore,
        minScore: s.minScore,
        passRate: s.passRate,
        excellentRate: s.excellentRate,
        studentCount: s.studentCount,
        gradeAvgScore: s.gradeAvgScore,
        avgScoreDiff: s.avgScoreDiff
      })),
      weakSubjects: analysis.weakSubjects
    };

    const messages = this.buildClassDiagnosisMessages(analysis);
    const content = await this.callDiagnosisAI(messages, 1600);

    const title = `${analysis.class.name} - ${analysis.exam.name} 学情诊断报告`;

    const [result] = await pool.execute(
      `INSERT INTO ai_diagnosis_reports
         (report_type, target_id, exam_id, title, content, metrics, generated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['class', classId, examId, title, content, JSON.stringify(metrics), userId || null]
    );

    const reportId = result.insertId;
    const [rows] = await pool.query(
      'SELECT created_at FROM ai_diagnosis_reports WHERE id = ? LIMIT 1',
      [reportId]
    );

    return {
      reportId,
      reportType: 'class',
      targetId: Number(classId),
      examId: Number(examId),
      examName: analysis.exam.name,
      className: analysis.class.name,
      content,
      metrics,
      createdAt: rows[0] ? rows[0].created_at : new Date()
    };
  }

  /**
   * 生成个人学情画像
   * @param {number} studentId - 学生ID
   * @param {number|null} examId - 考试ID（可空，为空时基于历次成绩）
   * @param {number} userId - 生成人ID
   */
  static async generateStudentDiagnosis(studentId, examId, userId) {
    const targetExamId = examId || null;

    // 查询学生基本信息（姓名、班级、年级）
    const [studentRows] = await pool.query(
      `SELECT u.id, u.name, c.name AS class_name, c.grade
       FROM users u
       LEFT JOIN classes c ON u.class_id = c.id
       WHERE u.id = ?`,
      [studentId]
    );

    if (!studentRows[0]) {
      const error = new Error('学生不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const student = studentRows[0];

    // 复用已有的学生学情分析
    const analysis = await this.getStudentAnalysis(studentId, targetExamId);

    // 生成时使用的统计快照
    const metrics = {
      studentId: Number(studentId),
      studentName: student.name,
      className: student.class_name || null,
      grade: student.grade || null,
      examId: targetExamId ? Number(targetExamId) : null,
      examName: targetExamId ? analysis.examName : null,
      strongSubjects: analysis.strongSubjects || [],
      weakSubjects: analysis.weakSubjects || []
    };

    const messages = this.buildStudentDiagnosisMessages(student, analysis, targetExamId);
    const content = await this.callDiagnosisAI(messages, 1600);

    const title = `${student.name} - 个人学情画像`;

    const [result] = await pool.execute(
      `INSERT INTO ai_diagnosis_reports
         (report_type, target_id, exam_id, title, content, metrics, generated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['student', studentId, targetExamId, title, content, JSON.stringify(metrics), userId || null]
    );

    const reportId = result.insertId;
    const [rows] = await pool.query(
      'SELECT created_at FROM ai_diagnosis_reports WHERE id = ? LIMIT 1',
      [reportId]
    );

    return {
      reportId,
      reportType: 'student',
      targetId: Number(studentId),
      studentId: Number(studentId),
      studentName: student.name,
      examId: targetExamId ? Number(targetExamId) : null,
      content,
      metrics,
      createdAt: rows[0] ? rows[0].created_at : new Date()
    };
  }

  /**
   * 查询诊断历史记录
   * @param {string} reportType - class | student
   * @param {number} targetId - 班级ID 或 学生ID
   * @param {number} limit - 返回条数，默认 10
   */
  static async getDiagnosisHistory(reportType, targetId, limit = 10) {
    const parsedLimit = Number(limit);
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(Math.floor(parsedLimit), 100)
      : 10;

    // LIMIT 使用内联整数（mysql2 execute 不支持 LIMIT 占位符）
    const [rows] = await pool.query(
      `SELECT id, report_type, target_id, exam_id, title, content, created_at
       FROM ai_diagnosis_reports
       WHERE report_type = ? AND target_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ${safeLimit}`,
      [reportType, targetId]
    );

    return rows.map((r) => ({
      id: r.id,
      reportType: r.report_type,
      targetId: r.target_id,
      examId: r.exam_id,
      title: r.title,
      content: r.content,
      createdAt: r.created_at
    }));
  }

  /**
   * 查询单条诊断报告详情
   * @param {number} id - 报告ID
   */
  static async getDiagnosisDetail(id) {
    const [rows] = await pool.query(
      `SELECT id, report_type, target_id, exam_id, title, content, metrics, generated_by, created_at
       FROM ai_diagnosis_reports
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (!rows[0]) {
      const error = new Error('诊断报告不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const r = rows[0];
    return {
      id: r.id,
      reportType: r.report_type,
      targetId: r.target_id,
      examId: r.exam_id,
      title: r.title,
      content: r.content,
      metrics: r.metrics,
      generatedBy: r.generated_by,
      createdAt: r.created_at
    };
  }

  // ==================== 班级与学科管理 ====================

  // 获取班级列表
  static async getClassList(params) {
    const result = await Class.getAll(params);
    return result;
  }

  // 获取学科列表
  static async getSubjectList(params) {
    const result = await Subject.getAll(params);
    return result;
  }

  // 获取班级各学科教师
  static async getClassSubjectTeachers(classId) {
    const cls = await Class.findById(classId);
    if (!cls) {
      const error = new Error('班级不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    const teachers = await Class.getSubjectTeachers(classId);
    return teachers;
  }
}

module.exports = TeachingService;
