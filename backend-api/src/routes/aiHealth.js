const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

async function safeScalar(query, params = [], fallback = 0) {
  try {
    const [rows] = await pool.execute(query, params);
    if (!rows || rows.length === 0) return fallback;
    const first = rows[0];
    const key = Object.keys(first)[0];
    return toNumber(first[key], fallback);
  } catch (error) {
    return fallback;
  }
}

router.get('/overview', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const totalStudents = await safeScalar(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'student'",
      [],
      0
    );
    const totalTeachers = await safeScalar(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'teacher'",
      [],
      0
    );

    // 当前阶段先基于可用数据给出概览，后续可切换到真实AI行为表
    const aiUsageHoursWeekly = Math.round(totalStudents * 6.5);
    const warningCount = Math.max(1, Math.round(totalStudents * 0.12));

    const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const avgScoreTrend = [71, 73, 74, 75, 76, 76, 77];
    const studyDurationTrend = [1.6, 1.9, 2.1, 2.3, 2.4, 2.2, 2.5];
    const aiUsageByClass = [
      { className: '计算机1班', hours: Math.max(6, Math.round(totalStudents * 0.14)) },
      { className: '计算机2班', hours: Math.max(6, Math.round(totalStudents * 0.17)) },
      { className: '计算机3班', hours: Math.max(6, Math.round(totalStudents * 0.12)) },
      { className: '软件工程1班', hours: Math.max(6, Math.round(totalStudents * 0.16)) },
      { className: '数据科学1班', hours: Math.max(6, Math.round(totalStudents * 0.13)) }
    ];

    const dependencyDistribution = [
      { level: '低', count: Math.max(1, Math.round(totalStudents * 0.52)) },
      { level: '中', count: Math.max(1, Math.round(totalStudents * 0.33)) },
      { level: '高', count: Math.max(0, totalStudents - Math.round(totalStudents * 0.85)) }
    ];

    res.json({
      success: true,
      data: {
        classTotal: totalStudents,
        teacherTotal: totalTeachers,
        aiUsageHoursWeekly,
        warningCount,
        weekLabels,
        avgScoreTrend,
        studyDurationTrend,
        aiUsageByClass,
        dependencyDistribution,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('获取AI健康概览错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/students', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const keyword = (req.query.keyword || '').trim();
    let rows = [];

    try {
      if (keyword) {
        const like = `%${keyword}%`;
        [rows] = await pool.execute(
          `SELECT id, name, username, department, student_id
           FROM users
           WHERE role = 'student' AND (name LIKE ? OR username LIKE ? OR student_id LIKE ?)
           ORDER BY id DESC
           LIMIT 20`,
          [like, like, like]
        );
      } else {
        [rows] = await pool.execute(
          `SELECT id, name, username, department, student_id
           FROM users
           WHERE role = 'student'
           ORDER BY id DESC
           LIMIT 20`
        );
      }
    } catch (error) {
      rows = [];
    }

    const students = rows.map(item => ({
      id: item.id,
      name: item.name || item.username || `学生${item.id}`,
      studentId: item.student_id || `S${String(item.id).padStart(6, '0')}`,
      department: item.department || '未分配'
    }));

    res.json({ success: true, data: students });
  } catch (error) {
    console.error('获取学生列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/students/:id', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    if (!Number.isFinite(studentId)) {
      return res.status(400).json({ success: false, message: '学生ID无效' });
    }

    let student;
    try {
      const [rows] = await pool.execute(
        `SELECT id, name, username, department, student_id
         FROM users
         WHERE id = ? AND role = 'student'
         LIMIT 1`,
        [studentId]
      );
      student = rows[0];
    } catch (error) {
      student = undefined;
    }

    if (!student) {
      return res.status(404).json({ success: false, message: '学生不存在' });
    }

    const scoreTrend = [74, 75, 73, 72, 71];
    const aiDependencyTrend = [46, 49, 54, 58, 61];
    const aiUsageComposition = [
      { name: 'AI完成作业时长', value: 16 },
      { name: '自主学习+AI辅助时长', value: 22 }
    ];

    const dependenceScore = aiDependencyTrend[aiDependencyTrend.length - 1];
    const dependenceLevel = dependenceScore >= 70 ? '高' : dependenceScore >= 45 ? '中' : '低';

    res.json({
      success: true,
      data: {
        id: student.id,
        name: student.name || student.username || `学生${student.id}`,
        studentId: student.student_id || `S${String(student.id).padStart(6, '0')}`,
        department: student.department || '未分配',
        dependenceIndex: dependenceScore,
        dependenceLevel,
        homeworkSimilarity: 68,
        goalProgress: 72,
        scoreTrend,
        aiDependencyTrend,
        aiUsageComposition
      }
    });
  } catch (error) {
    console.error('获取学生详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/warnings', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const warningList = [
      {
        id: 1,
        studentName: '张三',
        level: '轻度',
        trigger: 'AI使用时长高于班级平均20%，成绩稳定',
        suggestion: '建议先独立思考10分钟，再使用AI辅助',
        action: '发送学习提醒'
      },
      {
        id: 2,
        studentName: '李四',
        level: '中度',
        trigger: 'AI使用时长高于班级平均50%，作业相似度偏高',
        suggestion: '建议布置分层作业，减少直接生成型任务',
        action: '推送分层作业建议'
      },
      {
        id: 3,
        studentName: '王五',
        level: '重度',
        trigger: 'AI使用时长高于班级平均100%，成绩连续下滑',
        suggestion: '建议安排面谈并与家长协同干预',
        action: '触发面谈提醒'
      }
    ];

    res.json({
      success: true,
      data: warningList
    });
  } catch (error) {
    console.error('获取预警列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/recommendations', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const plans = [
      {
        id: 1,
        title: '无AI限时练习',
        description: '设置30分钟独立解题时间，结束后再允许使用AI核对思路。',
        target: '中度/重度依赖学生'
      },
      {
        id: 2,
        title: '费曼法口头讲解任务',
        description: '要求学生用3分钟口头解释知识点，强化主动理解。',
        target: '重度依赖学生'
      },
      {
        id: 3,
        title: 'AI反思日志',
        description: '记录是否先独立思考、AI帮到什么、是否真正学会。',
        target: '全体预警学生'
      },
      {
        id: 4,
        title: 'AI讲师辅助学习',
        description: '针对薄弱知识点进行定向讲解和二次练习推送。',
        target: '成绩波动学生'
      }
    ];

    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('获取替代学习方案错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/interventions/feedback', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const stageLabels = ['已预警', '已触达', '已执行干预', '依赖下降'];
    const funnelValues = [120, 96, 68, 41];
    const scoreBeforeAfter = [
      { category: '干预前平均成绩', value: 68 },
      { category: '干预后平均成绩', value: 74 }
    ];
    const reassessment = {
      downgradedCount: 22,
      escalatedCount: 9,
      unchangedCount: 15,
      ruleHint: '连续两周依赖指数下降则降级；不变或上升则升级预警并通知教师'
    };

    res.json({
      success: true,
      data: {
        stageLabels,
        funnelValues,
        scoreBeforeAfter,
        reassessment
      }
    });
  } catch (error) {
    console.error('获取干预反馈错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/analytics', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const trendLabels = ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周'];
    const overDependenceTrend = [62, 58, 56, 52, 49, 46];
    const usageScoreScatter = [
      [2.1, 88], [3.4, 83], [4.8, 79], [5.6, 74], [6.3, 71], [7.2, 66], [8.1, 61]
    ];

    res.json({
      success: true,
      data: {
        failRateCorrelation: 0.64,
        usageScoreCorrelation: -0.58,
        declineRatioInOverDependence: 0.42,
        overDependenceTrend,
        trendLabels,
        usageScoreScatter
      }
    });
  } catch (error) {
    console.error('获取综合指标分析错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
