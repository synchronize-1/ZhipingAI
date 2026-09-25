const pool = require('../config/database');
const PortfolioSkill = require('../models/PortfolioSkill.model');
const PortfolioHonor = require('../models/PortfolioHonor.model');
const PortfolioMentalHealth = require('../models/PortfolioMentalHealth.model');
const PortfolioComment = require('../models/PortfolioComment.model');
const { ErrorCode } = require('../utils/response');

class PortfolioService {
  // ==================== 学生基本信息 ====================

  // 获取学生基本信息（个人信息、班级、班主任等）
  static async getStudentBasicInfo(studentId) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.name, u.role, u.email, u.phone, u.avatar, u.department, u.student_id,
              c.id as class_id, c.name as class_name, c.grade, c.department as class_department,
              ht.name as head_teacher_name, ht.id as head_teacher_id
       FROM users u
       LEFT JOIN exam_scores es ON es.student_id = u.id
       LEFT JOIN classes c ON es.class_id = c.id
       LEFT JOIN users ht ON c.head_teacher_id = ht.id
       WHERE u.id = ?
       LIMIT 1`,
      [studentId]
    );

    if (!rows[0]) {
      // 如果没有成绩记录关联班级，尝试其他方式获取
      const [userRows] = await pool.execute(
        `SELECT id, username, name, role, email, phone, avatar, department, student_id
         FROM users WHERE id = ? AND role = 'student'`,
        [studentId]
      );
      if (!userRows[0]) {
        const error = new Error('学生不存在');
        error.name = 'NotFoundError';
        error.status = 404;
        throw error;
      }
      return {
        ...userRows[0],
        classId: null,
        className: null,
        grade: null,
        classDepartment: null,
        headTeacherId: null,
        headTeacherName: null
      };
    }

    return {
      id: rows[0].id,
      username: rows[0].username,
      name: rows[0].name,
      role: rows[0].role,
      email: rows[0].email,
      phone: rows[0].phone,
      avatar: rows[0].avatar,
      department: rows[0].department,
      studentId: rows[0].student_id,
      classId: rows[0].class_id,
      className: rows[0].class_name,
      grade: rows[0].grade,
      classDepartment: rows[0].class_department,
      headTeacherId: rows[0].head_teacher_id,
      headTeacherName: rows[0].head_teacher_name
    };
  }

  // ==================== 技能管理 ====================

  // 获取学生技能列表
  static async getStudentSkills(studentId, params = {}) {
    const result = await PortfolioSkill.getByStudentId(studentId, params);
    return result;
  }

  // 添加技能记录
  static async addSkill(studentId, skillData, createdBy) {
    if (!skillData.skillName) {
      const error = new Error('技能名称不能为空');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    const id = await PortfolioSkill.create({
      ...skillData,
      studentId,
      verifiedBy: createdBy || null,
      verifiedAt: createdBy ? new Date() : null
    });

    return { id };
  }

  // 更新技能（学生只能提交待审核，教师可直接修改）
  static async updateSkill(id, skillData, operatorId, operatorRole) {
    const skill = await PortfolioSkill.findById(id);
    if (!skill) {
      const error = new Error('技能记录不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 学生只能修改自己的技能，且修改后需要重新审核
    if (operatorRole === 'student') {
      if (String(skill.student_id) !== String(operatorId)) {
        const error = new Error('无权修改他人的技能记录');
        error.name = 'ForbiddenError';
        error.code = ErrorCode.FORBIDDEN;
        throw error;
      }
      // 学生修改后清除认证信息
      skillData.verifiedBy = null;
      skillData.verifiedAt = null;
    }

    await PortfolioSkill.update(id, skillData);
  }

  // 删除技能
  static async deleteSkill(id, operatorId, operatorRole) {
    const skill = await PortfolioSkill.findById(id);
    if (!skill) {
      const error = new Error('技能记录不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 学生只能删除自己的技能
    if (operatorRole === 'student' && String(skill.student_id) !== String(operatorId)) {
      const error = new Error('无权删除他人的技能记录');
      error.name = 'ForbiddenError';
      error.code = ErrorCode.FORBIDDEN;
      throw error;
    }

    await PortfolioSkill.delete(id);
  }

  // 获取技能统计数据
  static async getSkillStats(studentId) {
    const stats = await PortfolioSkill.getStudentSkillStats(studentId);
    return stats;
  }

  // ==================== 荣誉管理 ====================

  // 获取学生荣誉列表
  static async getStudentHonors(studentId, params = {}) {
    const result = await PortfolioHonor.getByStudentId(studentId, params);
    return result;
  }

  // 添加荣誉记录
  static async addHonor(studentId, honorData, createdBy) {
    if (!honorData.title) {
      const error = new Error('荣誉称号不能为空');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    const id = await PortfolioHonor.create({
      ...honorData,
      studentId,
      verifiedBy: createdBy || null,
      verifiedAt: createdBy ? new Date() : null
    });

    return { id };
  }

  // 更新荣誉
  static async updateHonor(id, honorData, operatorId, operatorRole) {
    const honor = await PortfolioHonor.findById(id);
    if (!honor) {
      const error = new Error('荣誉记录不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 学生只能修改自己的荣誉，且修改后需要重新审核
    if (operatorRole === 'student') {
      if (String(honor.student_id) !== String(operatorId)) {
        const error = new Error('无权修改他人的荣誉记录');
        error.name = 'ForbiddenError';
        error.code = ErrorCode.FORBIDDEN;
        throw error;
      }
      // 学生修改后清除认证信息
      honorData.verifiedBy = null;
      honorData.verifiedAt = null;
    }

    await PortfolioHonor.update(id, honorData);
  }

  // 删除荣誉
  static async deleteHonor(id, operatorId, operatorRole) {
    const honor = await PortfolioHonor.findById(id);
    if (!honor) {
      const error = new Error('荣誉记录不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 学生只能删除自己的荣誉
    if (operatorRole === 'student' && String(honor.student_id) !== String(operatorId)) {
      const error = new Error('无权删除他人的荣誉记录');
      error.name = 'ForbiddenError';
      error.code = ErrorCode.FORBIDDEN;
      throw error;
    }

    await PortfolioHonor.delete(id);
  }

  // 获取荣誉统计数据
  static async getHonorStats(studentId) {
    const stats = await PortfolioHonor.getStudentHonorStats(studentId);
    return stats;
  }

  // ==================== 心理健康 ====================

  // 获取心理健康记录列表
  static async getMentalHealthRecords(studentId, params = {}) {
    const result = await PortfolioMentalHealth.getByStudentId(studentId, params);
    return result;
  }

  // 添加心理健康记录（仅教师/管理员）
  static async addMentalHealthRecord(studentId, recordData, assessedBy) {
    if (!recordData.assessmentDate) {
      const error = new Error('测评日期不能为空');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    const id = await PortfolioMentalHealth.create({
      ...recordData,
      studentId,
      assessedBy
    });

    return { id };
  }

  // 更新心理健康记录
  static async updateMentalHealthRecord(id, recordData, operatorRole) {
    const record = await PortfolioMentalHealth.findById(id);
    if (!record) {
      const error = new Error('心理健康记录不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 学生不能修改心理健康记录
    if (operatorRole === 'student') {
      const error = new Error('学生无权修改心理健康记录');
      error.name = 'ForbiddenError';
      error.code = ErrorCode.FORBIDDEN;
      throw error;
    }

    await PortfolioMentalHealth.update(id, recordData);
  }

  // 删除心理健康记录
  static async deleteMentalHealthRecord(id, operatorRole) {
    const record = await PortfolioMentalHealth.findById(id);
    if (!record) {
      const error = new Error('心理健康记录不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 学生不能删除心理健康记录
    if (operatorRole === 'student') {
      const error = new Error('学生无权删除心理健康记录');
      error.name = 'ForbiddenError';
      error.code = ErrorCode.FORBIDDEN;
      throw error;
    }

    await PortfolioMentalHealth.delete(id);
  }

  // 获取心理健康趋势数据（用于图表展示）
  static async getMentalHealthTrend(studentId) {
    const trend = await PortfolioMentalHealth.getStudentTrend(studentId, 6);
    return trend;
  }

  // ==================== 评语管理 ====================

  // 获取学生评语列表
  static async getStudentComments(studentId, params = {}) {
    const result = await PortfolioComment.getByStudentId(studentId, params);
    return result;
  }

  // 获取最新学期评语
  static async getLatestComment(studentId, semester = null) {
    const comment = await PortfolioComment.getLatest(studentId, semester, 'general');
    return comment;
  }

  // 添加评语
  static async addComment(studentId, commentData, createdBy) {
    if (!commentData.content) {
      const error = new Error('评语内容不能为空');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }
    if (!commentData.semester) {
      const error = new Error('学期不能为空');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    const id = await PortfolioComment.create({
      ...commentData,
      studentId,
      createdBy
    });

    return { id };
  }

  // 更新评语
  static async updateComment(id, commentData, operatorRole) {
    const comment = await PortfolioComment.findById(id);
    if (!comment) {
      const error = new Error('评语不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 学生不能修改评语
    if (operatorRole === 'student') {
      const error = new Error('学生无权修改评语');
      error.name = 'ForbiddenError';
      error.code = ErrorCode.FORBIDDEN;
      throw error;
    }

    await PortfolioComment.update(id, commentData);
  }

  // 删除评语
  static async deleteComment(id, operatorRole) {
    const comment = await PortfolioComment.findById(id);
    if (!comment) {
      const error = new Error('评语不存在');
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    // 学生不能删除评语
    if (operatorRole === 'student') {
      const error = new Error('学生无权删除评语');
      error.name = 'ForbiddenError';
      error.code = ErrorCode.FORBIDDEN;
      throw error;
    }

    await PortfolioComment.delete(id);
  }

  // ==================== 成长档案总览 ====================

  // 获取成长档案总览数据
  static async getPortfolioOverview(studentId) {
    // 并行获取各项数据
    const [
      basicInfo,
      skillStats,
      honorStats,
      mentalHealthRecords,
      latestComment,
      scoreHistory
    ] = await Promise.all([
      this.getStudentBasicInfo(studentId).catch(() => null),
      PortfolioSkill.getStudentSkillStats(studentId).catch(() => ({ total: 0, byCategory: [], byLevel: [] })),
      PortfolioHonor.getStudentHonorStats(studentId).catch(() => ({ total: 0, byLevel: [], byType: [] })),
      PortfolioMentalHealth.getByStudentId(studentId, { page: 1, pageSize: 1 }).catch(() => ({ list: [] })),
      PortfolioComment.getLatest(studentId, null, 'general').catch(() => null),
      this.getStudentScoreTrend(studentId, 3).catch(() => [])
    ]);

    return {
      basicInfo,
      skills: {
        total: skillStats.total,
        byCategory: skillStats.byCategory,
        byLevel: skillStats.byLevel
      },
      honors: {
        total: honorStats.total,
        byLevel: honorStats.byLevel,
        byType: honorStats.byType
      },
      latestMentalHealth: mentalHealthRecords.list && mentalHealthRecords.list.length > 0
        ? mentalHealthRecords.list[0]
        : null,
      latestComment,
      scoreTrend: scoreHistory
    };
  }

  // 获取学生成绩趋势（最近N次考试）
  static async getStudentScoreTrend(studentId, limit = 3) {
    const [examRows] = await pool.execute(
      `SELECT DISTINCT e.id, e.name, e.exam_date
       FROM exam_scores es
       INNER JOIN exams e ON es.exam_id = e.id
       WHERE es.student_id = ?
       ORDER BY e.exam_date DESC, e.id DESC
       LIMIT ?`,
      [studentId, limit]
    );

    if (examRows.length === 0) return [];

    // 按考试日期升序排列（用于趋势展示）
    examRows.reverse();

    const examIds = examRows.map(e => e.id);
    const placeholders = examIds.map(() => '?').join(',');

    const [scoreRows] = await pool.execute(
      `SELECT es.exam_id, es.score, es.is_absent
       FROM exam_scores es
       WHERE es.student_id = ? AND es.exam_id IN (${placeholders})`,
      [studentId, ...examIds]
    );

    const scoresByExam = {};
    for (const s of scoreRows) {
      if (!scoresByExam[s.exam_id]) scoresByExam[s.exam_id] = [];
      scoresByExam[s.exam_id].push(s);
    }

    const trend = examRows.map(exam => {
      const scores = scoresByExam[exam.id] || [];
      const validScores = scores.filter(s => !s.is_absent && s.score !== null);
      const totalScore = validScores.reduce((sum, s) => sum + parseFloat(s.score), 0);
      const avgScore = validScores.length > 0
        ? parseFloat((totalScore / validScores.length).toFixed(2))
        : null;

      return {
        examId: exam.id,
        examName: exam.name,
        examDate: exam.exam_date,
        totalScore: parseFloat(totalScore.toFixed(2)),
        avgScore,
        subjectCount: validScores.length
      };
    });

    return trend;
  }

  // ==================== 班级成长档案 ====================

  // 获取班级学生成长档案列表（教师用）
  static async getClassPortfolioList(classId, params = {}) {
    const { page = 1, pageSize = 20, keyword } = params;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(pageSize) || 20;
    const offset = (pageNum - 1) * limitNum;

    // 获取班级学生列表
    let countQuery = `
      SELECT COUNT(DISTINCT es.student_id) as total
      FROM exam_scores es
      INNER JOIN users u ON es.student_id = u.id
      WHERE es.class_id = ?
    `;
    let query = `
      SELECT DISTINCT u.id, u.name, u.student_id, u.avatar
      FROM exam_scores es
      INNER JOIN users u ON es.student_id = u.id
      WHERE es.class_id = ?
    `;
    const countParams = [classId];
    const queryParams = [classId];

    if (keyword) {
      countQuery += ' AND (u.name LIKE ? OR u.student_id LIKE ?)';
      query += ' AND (u.name LIKE ? OR u.student_id LIKE ?)';
      countParams.push(`%${keyword}%`, `%${keyword}%`);
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    query += ' ORDER BY u.name ASC LIMIT ? OFFSET ?';
    queryParams.push(limitNum, offset);

    const [countResult] = await pool.execute(countQuery, countParams);
    const [studentRows] = await pool.execute(query, queryParams);

    const studentIds = studentRows.map(s => s.id);

    if (studentIds.length === 0) {
      return {
        list: [],
        total: 0,
        page: pageNum,
        pageSize: limitNum
      };
    }

    // 批量查询各学生的技能数量、荣誉数量
    const placeholders = studentIds.map(() => '?').join(',');

    const [skillCounts] = await pool.execute(
      `SELECT student_id, COUNT(*) as count
       FROM portfolio_skills
       WHERE student_id IN (${placeholders})
       GROUP BY student_id`,
      studentIds
    );

    const [honorCounts] = await pool.execute(
      `SELECT student_id, COUNT(*) as count
       FROM portfolio_honors
       WHERE student_id IN (${placeholders})
       GROUP BY student_id`,
      studentIds
    );

    // 查询每个学生最新的心理记录
    const [mentalHealthRows] = await pool.execute(
      `SELECT pmh.student_id, pmh.mood_score, pmh.stress_level, pmh.assessment_date
       FROM portfolio_mental_health pmh
       INNER JOIN (
         SELECT student_id, MAX(assessment_date) as max_date
         FROM portfolio_mental_health
         WHERE student_id IN (${placeholders})
         GROUP BY student_id
       ) latest ON pmh.student_id = latest.student_id AND pmh.assessment_date = latest.max_date
       WHERE pmh.student_id IN (${placeholders})`,
      [...studentIds, ...studentIds]
    );

    // 组装数据
    const skillCountMap = {};
    for (const s of skillCounts) skillCountMap[s.student_id] = s.count;

    const honorCountMap = {};
    for (const h of honorCounts) honorCountMap[h.student_id] = h.count;

    const mentalMap = {};
    for (const m of mentalHealthRows) mentalMap[m.student_id] = m;

    const list = studentRows.map(student => ({
      studentId: student.id,
      studentName: student.name,
      studentNo: student.student_id,
      avatar: student.avatar,
      skillCount: skillCountMap[student.id] || 0,
      honorCount: honorCountMap[student.id] || 0,
      latestMentalHealth: mentalMap[student.id] || null
    }));

    return {
      list,
      total: countResult[0].total,
      page: pageNum,
      pageSize: limitNum
    };
  }
}

module.exports = PortfolioService;
