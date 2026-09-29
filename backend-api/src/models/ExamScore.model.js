const pool = require('../config/database');

// 计算分数等级
function getScoreLevel(score, fullScore = 100) {
  if (score === null || score === undefined) return null;
  const percent = (score / fullScore) * 100;
  if (percent >= 90) return '优秀';
  if (percent >= 80) return '良好';
  if (percent >= 70) return '中等';
  if (percent >= 60) return '及格';
  return '不及格';
}

class ExamScore {
  // 创建单条成绩
  static async create(scoreData) {
    const { examId, studentId, subjectId, classId, score, isAbsent, remark } = scoreData;
    const scoreLevel = isAbsent ? null : getScoreLevel(score);

    const [result] = await pool.execute(
      `INSERT INTO exam_scores (exam_id, student_id, subject_id, class_id, score, score_level, is_absent, remark, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [examId, studentId, subjectId, classId || null, score || null, scoreLevel, isAbsent ? 1 : 0, remark || null]
    );

    return result.insertId;
  }

  // 批量创建成绩
  static async batchCreate(scores) {
    if (!scores || scores.length === 0) return 0;

    const values = [];
    const placeholders = [];

    for (const s of scores) {
      const scoreLevel = s.isAbsent ? null : getScoreLevel(s.score);
      placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, NOW())');
      values.push(
        s.examId, s.studentId, s.subjectId, s.classId || null,
        s.score || null, scoreLevel, s.isAbsent ? 1 : 0, s.remark || null
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO exam_scores (exam_id, student_id, subject_id, class_id, score, score_level, is_absent, remark, created_at)
       VALUES ${placeholders.join(', ')}
       ON DUPLICATE KEY UPDATE
         score = VALUES(score),
         score_level = VALUES(score_level),
         is_absent = VALUES(is_absent),
         remark = VALUES(remark),
         updated_at = NOW()`,
      values
    );

    return result.affectedRows;
  }

  // 根据ID查询
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM exam_scores WHERE id = ?', [id]);
    return rows[0];
  }

  // 查询某次考试某学生所有科目成绩
  static async getByExamAndStudent(examId, studentId) {
    const [rows] = await pool.execute(
      `SELECT es.*, s.name as subject_name, s.code as subject_code
       FROM exam_scores es
       INNER JOIN subjects s ON es.subject_id = s.id
       WHERE es.exam_id = ? AND es.student_id = ?
       ORDER BY s.id`,
      [examId, studentId]
    );
    return rows;
  }

  // 查询某次考试某班级的成绩（可按科目筛选）
  static async getByExamAndClass(examId, classId, subjectId = null) {
    let query = `
      SELECT es.*, u.name as student_name, u.student_id as student_no,
             s.name as subject_name, s.code as subject_code
      FROM exam_scores es
      INNER JOIN users u ON es.student_id = u.id
      INNER JOIN subjects s ON es.subject_id = s.id
      WHERE es.exam_id = ? AND es.class_id = ?
    `;
    const params = [examId, classId];

    if (subjectId) {
      query += ' AND es.subject_id = ?';
      params.push(subjectId);
    }

    query += ' ORDER BY es.rank_in_class ASC, u.id ASC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // 查询某次考试某科目的所有成绩
  static async getByExamAndSubject(examId, subjectId) {
    const [rows] = await pool.execute(
      `SELECT es.*, u.name as student_name, u.student_id as student_no,
              c.name as class_name, c.grade
       FROM exam_scores es
       INNER JOIN users u ON es.student_id = u.id
       INNER JOIN classes c ON es.class_id = c.id
       WHERE es.exam_id = ? AND es.subject_id = ?
       ORDER BY es.rank_in_grade ASC, u.id ASC`,
      [examId, subjectId]
    );
    return rows;
  }

  // 查询某学生的历史成绩（分页）
  static async getByStudentId(studentId, { page = 1, pageSize = 10 }) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(pageSize) || 10;
    const offset = (pageNum - 1) * limitNum;

    // 获取考试列表（分页）
    const [examRows] = await pool.query(
      `SELECT DISTINCT e.id, e.name, e.exam_type, e.grade, e.exam_date, e.semester
       FROM exam_scores es
       INNER JOIN exams e ON es.exam_id = e.id
       WHERE es.student_id = ?
       ORDER BY e.exam_date DESC, e.id DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      [studentId]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(DISTINCT es.exam_id) as total
       FROM exam_scores es
       WHERE es.student_id = ?`,
      [studentId]
    );

    // 获取每次考试的各科成绩
    const examIds = examRows.map(e => e.id);
    let scoresByExam = {};

    if (examIds.length > 0) {
      const placeholders = examIds.map(() => '?').join(',');
      const [scoreRows] = await pool.execute(
        `SELECT es.*, s.name as subject_name, s.code as subject_code
         FROM exam_scores es
         INNER JOIN subjects s ON es.subject_id = s.id
         WHERE es.student_id = ? AND es.exam_id IN (${placeholders})
         ORDER BY s.id`,
        [studentId, ...examIds]
      );

      scoresByExam = scoreRows.reduce((acc, score) => {
        if (!acc[score.exam_id]) acc[score.exam_id] = [];
        acc[score.exam_id].push(score);
        return acc;
      }, {});
    }

    const list = examRows.map(exam => ({
      ...exam,
      subjects: scoresByExam[exam.id] || []
    }));

    return {
      list,
      total: countResult[0].total,
      page: pageNum,
      pageSize: limitNum
    };
  }

  // 更新成绩
  static async update(id, scoreData) {
    const { score, isAbsent, remark, classId } = scoreData;

    const fields = [];
    const params = [];

    if (score !== undefined) {
      fields.push('score = ?');
      params.push(score);
      const scoreLevel = isAbsent ? null : getScoreLevel(score);
      fields.push('score_level = ?');
      params.push(scoreLevel);
    }
    if (isAbsent !== undefined) {
      fields.push('is_absent = ?');
      params.push(isAbsent ? 1 : 0);
    }
    if (remark !== undefined) {
      fields.push('remark = ?');
      params.push(remark);
    }
    if (classId !== undefined) {
      fields.push('class_id = ?');
      params.push(classId);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = NOW()');
    params.push(id);

    await pool.execute(
      `UPDATE exam_scores SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
  }

  // 删除成绩
  static async delete(id) {
    await pool.execute('DELETE FROM exam_scores WHERE id = ?', [id]);
  }

  // 删除某次考试的所有成绩
  static async deleteByExamId(examId) {
    await pool.execute('DELETE FROM exam_scores WHERE exam_id = ?', [examId]);
  }

  // 班级成绩统计
  static async getClassStats(examId, classId, subjectId) {
    const [rows] = await pool.execute(
      `SELECT 
         COUNT(*) as total_count,
         SUM(CASE WHEN is_absent = 0 THEN 1 ELSE 0 END) as attend_count,
         SUM(CASE WHEN is_absent = 1 THEN 1 ELSE 0 END) as absent_count,
         AVG(CASE WHEN is_absent = 0 THEN score ELSE NULL END) as avg_score,
         MAX(score) as max_score,
         MIN(CASE WHEN is_absent = 0 THEN score ELSE NULL END) as min_score,
         SUM(CASE WHEN is_absent = 0 AND score >= 60 THEN 1 ELSE 0 END) as pass_count,
         SUM(CASE WHEN is_absent = 0 AND score >= 90 THEN 1 ELSE 0 END) as excellent_count,
         SUM(CASE WHEN is_absent = 0 AND score >= 80 AND score < 90 THEN 1 ELSE 0 END) as good_count,
         SUM(CASE WHEN is_absent = 0 AND score >= 70 AND score < 80 THEN 1 ELSE 0 END) as medium_count,
         SUM(CASE WHEN is_absent = 0 AND score >= 60 AND score < 70 THEN 1 ELSE 0 END) as pass_level_count,
         SUM(CASE WHEN is_absent = 0 AND score < 60 THEN 1 ELSE 0 END) as fail_count
       FROM exam_scores
       WHERE exam_id = ? AND class_id = ? AND subject_id = ?`,
      [examId, classId, subjectId]
    );

    const stat = rows[0];
    const attendCount = stat.attend_count || 0;

    return {
      totalCount: stat.total_count || 0,
      attendCount,
      absentCount: stat.absent_count || 0,
      avgScore: stat.avg_score !== null ? parseFloat(Number(stat.avg_score).toFixed(2)) : null,
      maxScore: stat.max_score !== null ? parseFloat(stat.max_score) : null,
      minScore: stat.min_score !== null ? parseFloat(stat.min_score) : null,
      passRate: attendCount > 0 ? parseFloat(((stat.pass_count / attendCount) * 100).toFixed(2)) : 0,
      excellentRate: attendCount > 0 ? parseFloat(((stat.excellent_count / attendCount) * 100).toFixed(2)) : 0,
      scoreDistribution: {
        excellent: stat.excellent_count || 0,
        good: stat.good_count || 0,
        medium: stat.medium_count || 0,
        pass: stat.pass_level_count || 0,
        fail: stat.fail_count || 0
      }
    };
  }

  // 年级成绩统计
  static async getGradeStats(examId, subjectId) {
    const [rows] = await pool.execute(
      `SELECT 
         COUNT(*) as total_count,
         SUM(CASE WHEN is_absent = 0 THEN 1 ELSE 0 END) as attend_count,
         SUM(CASE WHEN is_absent = 1 THEN 1 ELSE 0 END) as absent_count,
         AVG(CASE WHEN is_absent = 0 THEN score ELSE NULL END) as avg_score,
         MAX(score) as max_score,
         MIN(CASE WHEN is_absent = 0 THEN score ELSE NULL END) as min_score,
         SUM(CASE WHEN is_absent = 0 AND score >= 60 THEN 1 ELSE 0 END) as pass_count,
         SUM(CASE WHEN is_absent = 0 AND score >= 90 THEN 1 ELSE 0 END) as excellent_count,
         SUM(CASE WHEN is_absent = 0 AND score >= 80 AND score < 90 THEN 1 ELSE 0 END) as good_count,
         SUM(CASE WHEN is_absent = 0 AND score >= 70 AND score < 80 THEN 1 ELSE 0 END) as medium_count,
         SUM(CASE WHEN is_absent = 0 AND score >= 60 AND score < 70 THEN 1 ELSE 0 END) as pass_level_count,
         SUM(CASE WHEN is_absent = 0 AND score < 60 THEN 1 ELSE 0 END) as fail_count
       FROM exam_scores
       WHERE exam_id = ? AND subject_id = ?`,
      [examId, subjectId]
    );

    const stat = rows[0];
    const attendCount = stat.attend_count || 0;

    return {
      totalCount: stat.total_count || 0,
      attendCount,
      absentCount: stat.absent_count || 0,
      avgScore: stat.avg_score !== null ? parseFloat(Number(stat.avg_score).toFixed(2)) : null,
      maxScore: stat.max_score !== null ? parseFloat(stat.max_score) : null,
      minScore: stat.min_score !== null ? parseFloat(stat.min_score) : null,
      passRate: attendCount > 0 ? parseFloat(((stat.pass_count / attendCount) * 100).toFixed(2)) : 0,
      excellentRate: attendCount > 0 ? parseFloat(((stat.excellent_count / attendCount) * 100).toFixed(2)) : 0,
      scoreDistribution: {
        excellent: stat.excellent_count || 0,
        good: stat.good_count || 0,
        medium: stat.medium_count || 0,
        pass: stat.pass_level_count || 0,
        fail: stat.fail_count || 0
      }
    };
  }

  // 计算排名（班级排名、年级排名），更新到exam_scores表
  static async calculateRankings(examId, subjectId) {
    // 先获取所有成绩（非缺考），按分数降序排列
    const [scores] = await pool.execute(
      `SELECT id, student_id, class_id, score
       FROM exam_scores
       WHERE exam_id = ? AND subject_id = ? AND is_absent = 0
       ORDER BY score DESC, id ASC`,
      [examId, subjectId]
    );

    if (scores.length === 0) return { updated: 0 };

    // 计算年级排名（并列排名）
    const gradeRanking = {};
    let gradeRank = 1;
    let prevScore = null;
    let sameScoreCount = 0;

    for (let i = 0; i < scores.length; i++) {
      const s = scores[i];
      if (prevScore === null || s.score !== prevScore) {
        gradeRank = i + 1;
        prevScore = s.score;
        sameScoreCount = 1;
      } else {
        sameScoreCount++;
      }
      gradeRanking[s.id] = gradeRank;
    }

    // 按班级分组计算班级排名
    const classScoresMap = {};
    for (const s of scores) {
      if (!classScoresMap[s.class_id]) classScoresMap[s.class_id] = [];
      classScoresMap[s.class_id].push(s);
    }

    const classRanking = {};
    for (const classId in classScoresMap) {
      const classScores = classScoresMap[classId];
      // 已按分数降序排列
      let classRank = 1;
      let prevClassScore = null;

      for (let i = 0; i < classScores.length; i++) {
        const s = classScores[i];
        if (prevClassScore === null || s.score !== prevClassScore) {
          classRank = i + 1;
          prevClassScore = s.score;
        }
        classRanking[s.id] = classRank;
      }
    }

    // 批量更新排名
    let updatedCount = 0;
    for (const s of scores) {
      await pool.execute(
        `UPDATE exam_scores SET rank_in_class = ?, rank_in_grade = ?, updated_at = NOW() WHERE id = ?`,
        [classRanking[s.id] || null, gradeRanking[s.id] || null, s.id]
      );
      updatedCount++;
    }

    return { updated: updatedCount };
  }
}

module.exports = ExamScore;
