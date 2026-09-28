const pool = require('../config/database');
const PortfolioSkill = require('../models/PortfolioSkill.model');
const PortfolioHonor = require('../models/PortfolioHonor.model');
const PortfolioMentalHealth = require('../models/PortfolioMentalHealth.model');
const PortfolioComment = require('../models/PortfolioComment.model');
const DeepSeekService = require('./deepseek.service');
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

  // ==================== AI 智能评语生成 ====================

  /**
   * 获取学生最近两次考试成绩数据（用于比较进步退步）
   * @param {number} studentId
   * @returns {Promise<Object>} 最新考试成绩、各科详情、排名及与上次对比
   */
  static async getLatestExamDataForComment(studentId) {
    // 获取最近两次考试
    const [examRows] = await pool.execute(
      `SELECT DISTINCT e.id, e.name, e.exam_date, e.semester
       FROM exam_scores es
       INNER JOIN exams e ON es.exam_id = e.id
       WHERE es.student_id = ?
       ORDER BY e.exam_date DESC, e.id DESC
       LIMIT 2`,
      [studentId]
    );

    if (examRows.length === 0) {
      return null;
    }

    const latestExam = examRows[0];
    const previousExam = examRows[1] || null;

    // 获取最新考试的各科成绩
    const [latestScores] = await pool.execute(
      `SELECT es.subject_id, es.score, es.score_level, es.is_absent, 
              es.rank_in_class, es.rank_in_grade,
              s.name as subject_name
       FROM exam_scores es
       INNER JOIN subjects s ON es.subject_id = s.id
       WHERE es.exam_id = ? AND es.student_id = ?
       ORDER BY s.id`,
      [latestExam.id, studentId]
    );

    // 计算最新考试总分和平均分
    const validScores = latestScores.filter(s => !s.is_absent && s.score !== null);
    const totalScore = validScores.reduce((sum, s) => sum + parseFloat(s.score), 0);
    const avgScore = validScores.length > 0
      ? parseFloat((totalScore / validScores.length).toFixed(2))
      : null;

    // 估算班级总分排名（取各科班级排名的平均值近似）
    const classRanks = validScores
      .filter(s => s.rank_in_class !== null)
      .map(s => s.rank_in_class);
    const avgClassRank = classRanks.length > 0
      ? parseFloat((classRanks.reduce((a, b) => a + b, 0) / classRanks.length).toFixed(1))
      : null;

    let previousTotalScore = null;
    let previousAvgScore = null;
    let previousAvgClassRank = null;
    let scoreChange = null;
    let rankChange = null;

    if (previousExam) {
      const [prevScores] = await pool.execute(
        `SELECT es.score, es.is_absent, es.rank_in_class
         FROM exam_scores es
         WHERE es.exam_id = ? AND es.student_id = ?`,
        [previousExam.id, studentId]
      );

      const prevValidScores = prevScores.filter(s => !s.is_absent && s.score !== null);
      previousTotalScore = prevValidScores.reduce((sum, s) => sum + parseFloat(s.score), 0);
      previousAvgScore = prevValidScores.length > 0
        ? parseFloat((previousTotalScore / prevValidScores.length).toFixed(2))
        : null;

      const prevClassRanks = prevValidScores
        .filter(s => s.rank_in_class !== null)
        .map(s => s.rank_in_class);
      previousAvgClassRank = prevClassRanks.length > 0
        ? parseFloat((prevClassRanks.reduce((a, b) => a + b, 0) / prevClassRanks.length).toFixed(1))
        : null;

      if (avgScore !== null && previousAvgScore !== null) {
        scoreChange = parseFloat((avgScore - previousAvgScore).toFixed(2));
      }
      if (avgClassRank !== null && previousAvgClassRank !== null) {
        // 排名数字越小表示越靠前，所以用 previous - latest
        rankChange = parseFloat((previousAvgClassRank - avgClassRank).toFixed(1));
      }
    }

    return {
      exam: {
        id: latestExam.id,
        name: latestExam.name,
        examDate: latestExam.exam_date,
        semester: latestExam.semester
      },
      subjects: latestScores.map(s => ({
        subjectName: s.subject_name,
        score: s.score,
        scoreLevel: s.score_level,
        isAbsent: s.is_absent ? true : false,
        rankInClass: s.rank_in_class,
        rankInGrade: s.rank_in_grade
      })),
      totalScore: parseFloat(totalScore.toFixed(2)),
      avgScore,
      avgClassRank,
      previousExam: previousExam ? {
        id: previousExam.id,
        name: previousExam.name,
        examDate: previousExam.exam_date,
        avgScore: previousAvgScore,
        avgClassRank: previousAvgClassRank
      } : null,
      scoreChange,
      rankChange
    };
  }

  /**
   * 获取学生已认证的技能列表
   * @param {number} studentId
   * @returns {Promise<Array>}
   */
  static async getVerifiedSkillsForComment(studentId) {
    const [rows] = await pool.execute(
      `SELECT skill_name, skill_category, level, verified_at
       FROM portfolio_skills
       WHERE student_id = ? AND verified_by IS NOT NULL
       ORDER BY level DESC, verified_at DESC
       LIMIT 20`,
      [studentId]
    );
    return rows.map(r => ({
      skillName: r.skill_name,
      skillCategory: r.skill_category,
      level: r.level,
      verifiedAt: r.verified_at
    }));
  }

  /**
   * 获取学生近期荣誉（最近1学期或最近5条）
   * @param {number} studentId
   * @param {string} semester
   * @returns {Promise<Array>}
   */
  static async getRecentHonorsForComment(studentId, semester = null) {
    let query = `
      SELECT title, honor_type, level, awarding_org, awarded_date, semester
      FROM portfolio_honors
      WHERE student_id = ? AND verified_by IS NOT NULL
    `;
    const params = [studentId];

    if (semester) {
      query += ' AND semester = ?';
      params.push(semester);
    }

    query += ' ORDER BY awarded_date DESC, created_at DESC LIMIT 10';

    const [rows] = await pool.execute(query, params);
    return rows.map(r => ({
      title: r.title,
      honorType: r.honor_type,
      level: r.level,
      awardingOrg: r.awarding_org,
      awardedDate: r.awarded_date,
      semester: r.semester
    }));
  }

  /**
   * 获取最近的心理健康测评结果
   * @param {number} studentId
   * @returns {Promise<Object|null>}
   */
  static async getLatestMentalHealthForComment(studentId) {
    const [rows] = await pool.execute(
      `SELECT assessment_date, assessment_type, overall_score, stress_level, mood_score, notes
       FROM portfolio_mental_health
       WHERE student_id = ?
       ORDER BY assessment_date DESC, created_at DESC
       LIMIT 1`,
      [studentId]
    );
    if (rows.length === 0) return null;
    return {
      assessmentDate: rows[0].assessment_date,
      assessmentType: rows[0].assessment_type,
      overallScore: rows[0].overall_score,
      stressLevel: rows[0].stress_level,
      moodScore: rows[0].mood_score,
      notes: rows[0].notes
    };
  }

  /**
   * 构造评语生成的系统提示词
   * @param {Object} options
   * @param {string} options.style - 风格：formal/warm/encouraging/concise
   * @param {string} options.length - 长度：short/medium/long
   * @returns {string}
   */
  static buildCommentSystemPrompt(options = {}) {
    const { style = 'warm', length = 'medium' } = options;

    const styleDescriptions = {
      formal: '语言正式规范，措辞严谨，评价客观公正，符合传统教师评语的正式风格。',
      warm: '语言温暖亲切，充满人文关怀，像一位关爱学生的班主任在与学生谈心，语气真诚动人。',
      encouraging: '语言积极向上，以鼓励为主，善于发现学生的闪光点，给予学生信心和动力，充满正能量。',
      concise: '语言简洁明了，重点突出，不拖泥带水，直接点明优缺点和改进方向。'
    };

    const lengthRequirements = {
      short: '字数控制在300-400字左右，精炼扼要。',
      medium: '字数控制在400-600字左右，内容充实。',
      long: '字数控制在600-800字左右，详尽全面。'
    };

    return `你是一位经验丰富、充满爱心的资深班主任老师，擅长根据学生的综合表现写出个性化、有温度的学期评语。

你的写作原则：
1. 客观真实：基于提供的学生数据进行评价，不编造不存在的事实
2. 以鼓励为主：善于发现学生的闪光点和进步，用积极的语言激励学生
3. 指出不足：诚恳地指出学生需要改进的地方，但要注意方式方法
4. 给出建议：针对学生的情况，提出具体、可操作的改进建议
5. 符合身份：你就是一位真实的老师，绝对不能出现"作为AI"、"作为人工智能"、"根据算法"等表述
6. 人称使用：用"你"称呼学生，像老师对学生说话的口吻

写作风格要求：
${styleDescriptions[style] || styleDescriptions.warm}

篇幅要求：
${lengthRequirements[length] || lengthRequirements.medium}

评语结构建议（可灵活调整）：
- 开头：总体评价，点明学生本学期的整体表现
- 学习方面：结合成绩数据，分析学习状态、进步与不足
- 综合素质：结合技能、荣誉等，评价学生的全面发展
- 心理状态：结合心理健康数据，关注学生的情绪和压力（如数据可用）
- 结尾：总结期望，鼓励学生继续努力

请直接输出评语内容，不要加标题或其他说明文字。`;
  }

  /**
   * 构造评语生成的用户消息（包含学生数据）
   * @param {Object} studentData
   * @param {string} semester
   * @returns {string}
   */
  static buildCommentUserMessage(studentData, semester) {
    const { basicInfo, examData, skills, honors, mentalHealth } = studentData;
    const lines = [];

    lines.push(`【学生基本信息】`);
    lines.push(`姓名：${basicInfo.name || '未知'}`);
    if (basicInfo.className) lines.push(`班级：${basicInfo.className}`);
    if (basicInfo.grade) lines.push(`年级：${basicInfo.grade}`);
    lines.push(`学期：${semester || '本学期'}`);
    lines.push('');

    // 成绩数据
    lines.push(`【学习成绩情况】`);
    if (examData) {
      lines.push(`最近考试：${examData.exam.name}`);
      lines.push(`考试日期：${examData.exam.exam_date ? new Date(examData.exam.exam_date).toLocaleDateString('zh-CN') : '未知'}`);
      lines.push(`总分数：${examData.totalScore}`);
      if (examData.avgScore !== null) lines.push(`平均分：${examData.avgScore}`);
      if (examData.avgClassRank !== null) lines.push(`班级平均排名：第${examData.avgClassRank}名`);
      lines.push('');
      lines.push('各科成绩：');
      for (const subject of examData.subjects) {
        if (subject.isAbsent) {
          lines.push(`  ${subject.subjectName}：缺考`);
        } else {
          let scoreInfo = `  ${subject.subjectName}：${subject.score}分（${subject.scoreLevel || '未评级'}）`;
          if (subject.rankInClass) scoreInfo += `，班级第${subject.rankInClass}名`;
          lines.push(scoreInfo);
        }
      }
      lines.push('');

      // 与上次考试对比
      if (examData.previousExam) {
        lines.push(`与上次考试（${examData.previousExam.name}）对比：`);
        if (examData.scoreChange !== null) {
          const direction = examData.scoreChange > 0 ? '上升' : (examData.scoreChange < 0 ? '下降' : '持平');
          lines.push(`  平均分变化：${direction} ${Math.abs(examData.scoreChange)}分`);
        }
        if (examData.rankChange !== null) {
          const direction = examData.rankChange > 0 ? '进步' : (examData.rankChange < 0 ? '退步' : '持平');
          lines.push(`  班级排名变化：${direction} ${Math.abs(examData.rankChange)}名`);
        }
      }
    } else {
      lines.push('暂无考试成绩数据');
    }
    lines.push('');

    // 技能数据
    lines.push(`【技能特长】`);
    if (skills && skills.length > 0) {
      for (const skill of skills) {
        lines.push(`  ${skill.skillName}（等级：${skill.level}级${skill.skillCategory ? '，类别：' + skill.skillCategory : ''}）`);
      }
    } else {
      lines.push('暂无已认证的技能记录');
    }
    lines.push('');

    // 荣誉数据
    lines.push(`【荣誉获奖】`);
    if (honors && honors.length > 0) {
      for (const honor of honors) {
        let honorInfo = `  ${honor.title}`;
        if (honor.level) honorInfo += `（${honor.level}）`;
        if (honor.awardingOrg) honorInfo += ` - ${honor.awardingOrg}`;
        if (honor.awardedDate) honorInfo += `，${new Date(honor.awardedDate).toLocaleDateString('zh-CN')}`;
        lines.push(honorInfo);
      }
    } else {
      lines.push('暂无荣誉获奖记录');
    }
    lines.push('');

    // 心理健康数据
    lines.push(`【心理健康状况】`);
    if (mentalHealth) {
      if (mentalHealth.moodScore !== null && mentalHealth.moodScore !== undefined) {
        lines.push(`情绪指数：${mentalHealth.moodScore}/100`);
      }
      if (mentalHealth.stressLevel) {
        lines.push(`压力水平：${mentalHealth.stressLevel}`);
      }
      if (mentalHealth.overallScore !== null && mentalHealth.overallScore !== undefined) {
        lines.push(`综合评分：${mentalHealth.overallScore}/100`);
      }
      if (mentalHealth.assessmentDate) {
        lines.push(`测评日期：${new Date(mentalHealth.assessmentDate).toLocaleDateString('zh-CN')}`);
      }
      if (mentalHealth.notes) {
        lines.push(`备注：${mentalHealth.notes}`);
      }
    } else {
      lines.push('暂无心理健康测评数据');
    }
    lines.push('');

    lines.push('请根据以上学生信息，为该学生写一份学期评语。');

    return lines.join('\n');
  }

  /**
   * AI 生成学生学期评语
   * @param {number} studentId - 学生ID
   * @param {Object} options - 配置选项
   * @param {string} options.semester - 学期（如"2024-2025第一学期"）
   * @param {string} options.style - 风格：formal/warm/encouraging/concise
   * @param {string} options.length - 长度：short/medium/long
   * @returns {Promise<string>} - 生成的评语文本
   */
  static async generateComment(studentId, options = {}) {
    const { semester, style = 'warm', length = 'medium' } = options;

    // 1. 验证参数
    if (!studentId) {
      const error = new Error('学生ID不能为空');
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    const validStyles = ['formal', 'warm', 'encouraging', 'concise'];
    if (!validStyles.includes(style)) {
      const error = new Error(`无效的评语风格，可选值：${validStyles.join(', ')}`);
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    const validLengths = ['short', 'medium', 'long'];
    if (!validLengths.includes(length)) {
      const error = new Error(`无效的评语长度，可选值：${validLengths.join(', ')}`);
      error.name = 'ValidationError';
      error.code = ErrorCode.PARAM_VALIDATION;
      throw error;
    }

    // 2. 并行收集学生数据
    const [
      basicInfo,
      examData,
      skills,
      honors,
      mentalHealth
    ] = await Promise.all([
      this.getStudentBasicInfo(studentId).catch(() => ({ name: '未知学生' })),
      this.getLatestExamDataForComment(studentId).catch(() => null),
      this.getVerifiedSkillsForComment(studentId).catch(() => []),
      this.getRecentHonorsForComment(studentId, semester).catch(() => []),
      this.getLatestMentalHealthForComment(studentId).catch(() => null)
    ]);

    // 3. 构造消息
    const systemPrompt = this.buildCommentSystemPrompt({ style, length });
    const userMessage = this.buildCommentUserMessage(
      { basicInfo, examData, skills, honors, mentalHealth },
      semester
    );

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    // 4. 调用 DeepSeek API
    try {
      const comment = await DeepSeekService.chat(messages, {
        model: 'deepseek-chat',
        temperature: 0.8,
        maxTokens: length === 'long' ? 1200 : (length === 'short' ? 600 : 900)
      });

      // 清理可能的多余空行和首尾空格
      return comment.trim();
    } catch (error) {
      console.error('AI 评语生成失败:', error.message);
      const apiError = new Error(`AI评语生成失败：${error.message}`);
      apiError.name = 'AIServiceError';
      apiError.code = ErrorCode.SERVICE_UNAVAILABLE;
      apiError.cause = error;
      throw apiError;
    }
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
