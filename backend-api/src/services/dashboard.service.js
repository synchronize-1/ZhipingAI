const pool = require('../config/database');
const { ErrorCode } = require('../utils/response');

/**
 * Dashboard 首页聚合服务
 * 提供管理员、教师、学生三种角色的首页数据
 */
class DashboardService {
  // ==================== 管理员首页 ====================
  static async getAdminDashboard() {
    // 1. 基础统计（一条 SQL 搞定所有计数）
    const [statsRows] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as totalUsers,
        (SELECT COUNT(*) FROM users WHERE role = 'student') as studentCount,
        (SELECT COUNT(*) FROM users WHERE role = 'teacher') as teacherCount,
        (SELECT COUNT(*) FROM classes) as classCount,
        (SELECT COUNT(*) FROM exams) as examCount,
        (SELECT COUNT(*) FROM subjects) as subjectCount
    `);
    const stats = statsRows[0];

    // 2. 最近5次考试（含参与班级数）
    const [recentExams] = await pool.query(`
      SELECT
        e.id,
        e.name,
        e.exam_date as examDate,
        e.exam_type as examType,
        e.status,
        COUNT(DISTINCT es.class_id) as classParticipantCount
      FROM exams e
      LEFT JOIN exam_scores es ON es.exam_id = e.id
      GROUP BY e.id
      ORDER BY e.exam_date DESC, e.created_at DESC
      LIMIT 5
    `);

    // 3. 各班学生人数排名（前8个）
    const [classStats] = await pool.query(`
      SELECT
        c.id as classId,
        c.name as className,
        c.student_count as studentCount,
        c.grade
      FROM classes c
      ORDER BY c.student_count DESC, c.id ASC
      LIMIT 8
    `);

    // 4. 最近5条通知
    const [recentNotifications] = await pool.query(`
      SELECT
        id,
        title,
        content,
        type,
        target_role as targetRole,
        created_at as createdAt
      FROM notifications
      ORDER BY created_at DESC
      LIMIT 5
    `);

    return {
      stats: {
        totalUsers: stats.totalUsers || 0,
        studentCount: stats.studentCount || 0,
        teacherCount: stats.teacherCount || 0,
        classCount: stats.classCount || 0,
        examCount: stats.examCount || 0,
        subjectCount: stats.subjectCount || 0
      },
      recentExams: recentExams || [],
      classStats: classStats || [],
      recentNotifications: recentNotifications || [],
      quickActions: []
    };
  }

  // ==================== 教师首页 ====================
  static async getTeacherDashboard(teacherId) {
    // 1. 先获取教师任教的班级ID列表
    const [teacherClasses] = await pool.query(`
      SELECT DISTINCT cst.class_id as classId
      FROM class_subject_teachers cst
      WHERE cst.teacher_id = ?
    `, [teacherId]);

    const classIds = teacherClasses.map(c => c.classId);
    const classIdsStr = classIds.length > 0 ? classIds.join(',') : '0';

    // 2. 任教班级数
    const classCount = classIds.length;

    // 3. 任教学生总数
    const [studentCountRows] = await pool.query(`
      SELECT COUNT(*) as studentCount
      FROM users u
      WHERE u.role = 'student' AND u.class_id IN (${classIdsStr})
    `);
    const studentCount = studentCountRows[0]?.studentCount || 0;

    // 4. 相关考试数（任教班级参与过的考试）
    const [examCountRows] = await pool.query(`
      SELECT COUNT(DISTINCT es.exam_id) as examCount
      FROM exam_scores es
      WHERE es.class_id IN (${classIdsStr})
    `);
    const examCount = examCountRows[0]?.examCount || 0;

    // 5. 待写评语数（本学期任教班级学生中还没有评语的数量）
    // 获取当前学期（简单处理：根据月份判断）
    const currentSemester = getCurrentSemester();
    const [pendingCommentsRows] = await pool.query(`
      SELECT COUNT(*) as pendingComments
      FROM users u
      WHERE u.role = 'student'
        AND u.class_id IN (${classIdsStr})
        AND u.id NOT IN (
          SELECT pc.student_id
          FROM portfolio_comments pc
          WHERE pc.semester = ? AND pc.comment_type = 'general'
        )
    `, [currentSemester]);
    const pendingComments = pendingCommentsRows[0]?.pendingComments || 0;

    // 6. 我任教的班级列表（含班主任姓名、学生数）
    const [myClasses] = await pool.query(`
      SELECT
        c.id as classId,
        c.name as className,
        c.grade,
        c.student_count as studentCount,
        u.name as headTeacherName
      FROM classes c
      LEFT JOIN users u ON u.id = c.head_teacher_id
      WHERE c.id IN (${classIdsStr})
      ORDER BY c.grade, c.name
    `);

    // 7. 最近3次我班级参与的考试
    const [recentExams] = await pool.query(`
      SELECT DISTINCT
        e.id,
        e.name,
        e.exam_date as examDate,
        e.exam_type as examType,
        e.status,
        e.created_at
      FROM exams e
      INNER JOIN exam_scores es ON es.exam_id = e.id
      WHERE es.class_id IN (${classIdsStr})
      ORDER BY e.exam_date DESC, e.created_at DESC
      LIMIT 3
    `);

    // 8. 最近一次考试的班级成绩概览
    let recentScores = [];
    if (classIds.length > 0) {
      // 先找到最近一次考试
      const [latestExamRows] = await pool.query(`
        SELECT DISTINCT e.id as examId, e.name as examName, e.exam_date as examDate, e.created_at
        FROM exams e
        INNER JOIN exam_scores es ON es.exam_id = e.id
        WHERE es.class_id IN (${classIdsStr})
        ORDER BY e.exam_date DESC, e.created_at DESC
        LIMIT 1
      `);

      if (latestExamRows.length > 0) {
        const latestExamId = latestExamRows[0].examId;
        // 按班级统计平均分、最高分、最低分
        const [scoreStats] = await pool.query(`
          SELECT
            es.class_id as classId,
            c.name as className,
            AVG(es.score) as avgScore,
            MAX(es.score) as maxScore,
            MIN(es.score) as minScore
          FROM exam_scores es
          INNER JOIN classes c ON c.id = es.class_id
          WHERE es.exam_id = ? AND es.class_id IN (${classIdsStr})
          GROUP BY es.class_id
          ORDER BY avgScore DESC
        `, [latestExamId]);

        recentScores = scoreStats.map(s => ({
          examId: latestExamId,
          examName: latestExamRows[0].examName,
          examDate: latestExamRows[0].examDate,
          classId: s.classId,
          className: s.className,
          avgScore: Math.round(s.avgScore * 100) / 100,
          maxScore: s.maxScore,
          minScore: s.minScore
        }));
      }
    }

    // 9. 待办事项
    const toDoList = [];
    if (pendingComments > 0) {
      toDoList.push({
        id: 'pending_comments',
        title: '待写评语',
        count: pendingComments,
        type: 'comment',
        description: `本学期还有 ${pendingComments} 名学生的评语待撰写`
      });
    }
    // 待批改（最近考试中还没有成绩的学生，简化为有考试但成绩不全的情况）
    // 这里暂时用合理的占位逻辑

    return {
      stats: {
        classCount,
        studentCount,
        examCount,
        pendingComments
      },
      myClasses: myClasses || [],
      recentExams: recentExams || [],
      recentScores,
      toDoList
    };
  }

  // ==================== 学生首页 ====================
  static async getStudentDashboard(studentId) {
    // 1. 基础统计
    const [statsRows] = await pool.query(`
      SELECT
        (SELECT COUNT(DISTINCT exam_id) FROM exam_scores WHERE student_id = ?) as examCount,
        (SELECT COUNT(*) FROM portfolio_skills WHERE student_id = ?) as skillCount,
        (SELECT COUNT(*) FROM portfolio_honors WHERE student_id = ?) as honorCount
    `, [studentId, studentId, studentId]);
    const stats = statsRows[0];

    // 2. 最近一次考试情况
    let latestExam = null;
    const [latestExamRows] = await pool.query(`
      SELECT
        e.id as examId,
        e.name as examName,
        e.exam_date as examDate
      FROM exams e
      INNER JOIN exam_scores es ON es.exam_id = e.id
      WHERE es.student_id = ?
      ORDER BY e.exam_date DESC, e.created_at DESC
      LIMIT 1
    `, [studentId]);

    if (latestExamRows.length > 0) {
      const exam = latestExamRows[0];
      // 获取该考试的各科成绩
      const [subjectScores] = await pool.query(`
        SELECT
          s.name as subjectName,
          es.score,
          es.score_level as scoreLevel,
          es.rank_in_class as rankInClass,
          es.rank_in_grade as rankInGrade
        FROM exam_scores es
        INNER JOIN subjects s ON s.id = es.subject_id
        WHERE es.exam_id = ? AND es.student_id = ?
        ORDER BY s.id
      `, [exam.examId, studentId]);

      // 计算总分
      const totalScore = subjectScores.reduce((sum, s) => sum + (s.score || 0), 0);

      // 计算班级排名和年级排名（取所有科目总分的排名）
      // 简化处理：从第一条记录的班级排名和年级排名推断
      // 更准确的方式是计算总分后排名，但这里先用第一条的 rankInClass 和 rankInGrade 作为参考
      // 实际上总分排名需要重新计算，这里用近似方式
      const [classRankRows] = await pool.query(`
        SELECT
          student_id,
          SUM(score) as total
        FROM exam_scores
        WHERE exam_id = ? AND class_id = (SELECT class_id FROM exam_scores WHERE exam_id = ? AND student_id = ? LIMIT 1)
        GROUP BY student_id
        ORDER BY total DESC
      `, [exam.examId, exam.examId, studentId]);

      let classRank = null;
      let gradeRank = null;
      for (let i = 0; i < classRankRows.length; i++) {
        if (classRankRows[i].student_id === studentId) {
          classRank = i + 1;
          break;
        }
      }

      // 最近一次考试平均分
      const avgScore = subjectScores.length > 0
        ? Math.round(totalScore / subjectScores.length * 100) / 100
        : 0;

      latestExam = {
        examId: exam.examId,
        examName: exam.examName,
        examDate: exam.examDate,
        totalScore: Math.round(totalScore * 100) / 100,
        classRank,
        gradeRank: subjectScores[0]?.rankInGrade || null,
        avgScore,
        subjects: subjectScores
      };

      // 更新 stats 中的 avgScore
      stats.avgScore = avgScore;
    } else {
      stats.avgScore = 0;
    }

    // 3. 最近3个荣誉
    const [recentHonors] = await pool.query(`
      SELECT
        id,
        title,
        honor_type as honorType,
        level,
        awarding_org as awardingOrg,
        awarded_date as awardedDate,
        semester
      FROM portfolio_honors
      WHERE student_id = ?
      ORDER BY awarded_date DESC, created_at DESC
      LIMIT 3
    `, [studentId]);

    // 4. 技能分类统计
    const [skillSummary] = await pool.query(`
      SELECT
        skill_category as category,
        COUNT(*) as count,
        AVG(level) as avgLevel
      FROM portfolio_skills
      WHERE student_id = ?
      GROUP BY skill_category
      ORDER BY count DESC
    `, [studentId]);

    // 5. 最近心理状态
    let mentalHealth = null;
    const [mentalHealthRows] = await pool.query(`
      SELECT
        assessment_date as latestDate,
        overall_score as overallScore,
        stress_level as stressLevel,
        mood_score as moodScore
      FROM portfolio_mental_health
      WHERE student_id = ?
      ORDER BY assessment_date DESC
      LIMIT 2
    `, [studentId]);

    if (mentalHealthRows.length > 0) {
      const latest = mentalHealthRows[0];
      const previous = mentalHealthRows[1];
      let trend = 'stable';
      if (previous && previous.overallScore !== null && latest.overallScore !== null) {
        if (latest.overallScore > previous.overallScore) {
          trend = 'improving';
        } else if (latest.overallScore < previous.overallScore) {
          trend = 'declining';
        }
      }

      mentalHealth = {
        latestDate: latest.latestDate,
        overallScore: latest.overallScore,
        stressLevel: latest.stressLevel,
        moodScore: latest.moodScore,
        trend
      };
    }

    return {
      stats: {
        examCount: stats.examCount || 0,
        skillCount: stats.skillCount || 0,
        honorCount: stats.honorCount || 0,
        avgScore: stats.avgScore || 0
      },
      latestExam,
      recentHonors: recentHonors || [],
      skillSummary: skillSummary || [],
      mentalHealth
    };
  }
}

/**
 * 获取当前学期（根据月份简单判断）
 * @returns {string} 学期字符串，如 "2024-2025-1"
 */
function getCurrentSemester() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 9月-次年1月为第一学期，2月-8月为第二学期
  if (month >= 9) {
    return `${year}-${year + 1}-1`;
  } else if (month <= 1) {
    return `${year - 1}-${year}-1`;
  } else {
    return `${year - 1}-${year}-2`;
  }
}

module.exports = DashboardService;
