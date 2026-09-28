const XLSX = require('xlsx');
const Exam = require('../models/Exam.model');
const Subject = require('../models/Subject.model');
const Class = require('../models/Class.model');
const User = require('../models/User');
const ExamScore = require('../models/ExamScore.model');
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

    return {
      exam: { id: exam.id, name: exam.name, examType: exam.exam_type, grade: exam.grade },
      class: { id: cls.id, name: cls.name, grade: cls.grade },
      subjectStats,
      topStudents,
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
      const total = scores.reduce((sum, s) => sum + (s.score || 0), 0);
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
        const avg = validScores.reduce((sum, s) => sum + s.score, 0) / validScores.length;
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
