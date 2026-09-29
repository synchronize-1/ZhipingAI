/**
 * 测试成绩种子脚本
 *
 * 用法: node src/migrations/seed/seed_test_scores.js
 *
 * 前置：
 *   1. node src/migrations/index.js
 *   2. node src/migrations/seed/seed_core_data.js
 *   3. node src/migrations/seed/seed_test_users.js
 *
 * 目的：
 *   为测试学生补齐成绩数据，使「班级/年级学情分析、学生历次成绩对比、
 *   AI 学情诊断」等功能有可用数据。
 *
 * 设计：
 *   - 每个年级补齐到 3 次考试（同年级科目集合一致，保证总分可比、可看趋势）
 *   - 分数按「学生基础能力 + 学科偏好 + 随考试小幅提升」确定性生成，可重复执行
 *   - 已存在的成绩（如 student1/student2 的期中成绩）保留不动，仅补缺失组合
 *   - 生成后按 (考试, 科目) 重算班级排名 / 年级排名
 *
 * 幂等：重复执行不会重复插入，仅补齐缺失数据并重算排名
 */

const { createConnection: createAutoConnection } = require('../index');

// 班级 -> 年级
const CLASS_GRADE = { 1: '高一', 2: '高一', 3: '高二', 4: '高二', 5: '高三' };

// 考试规划：同年级科目集合保持一致
const EXAM_PLAN = [
  // 高一：9 科（语数英 + 物化生 + 史地政）
  { grade: '高一', name: '2024年春季高一第一次月考', type: 'monthly', date: '2024-03-10', subjects: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { grade: '高一', name: '2024年春季高一期中考试', type: 'midterm', date: '2024-04-15', subjects: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { grade: '高一', name: '2024年春季高一期末考试', type: 'final', date: '2024-06-20', subjects: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  // 高二：4 科（语数英 + 物理）
  { grade: '高二', name: '2024年春季高二第一次月考', type: 'monthly', date: '2024-03-20', subjects: [1, 2, 3, 4] },
  { grade: '高二', name: '2024年春季高二期中考试', type: 'midterm', date: '2024-04-25', subjects: [1, 2, 3, 4] },
  { grade: '高二', name: '2024年春季高二期末考试', type: 'final', date: '2024-06-25', subjects: [1, 2, 3, 4] },
  // 高三：4 科（语数英 + 物理）
  { grade: '高三', name: '2024年高三模拟考试（一）', type: 'mock', date: '2024-05-10', subjects: [1, 2, 3, 4] },
  { grade: '高三', name: '2024年高三模拟考试（二）', type: 'mock', date: '2024-06-05', subjects: [1, 2, 3, 4] },
  { grade: '高三', name: '2024年高三模拟考试（三）', type: 'mock', date: '2024-06-25', subjects: [1, 2, 3, 4] }
];

const SEMESTER = '2023-2024-2';

// ---------- 确定性伪随机 ----------
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand01(seedStr) {
  let t = (hashString(seedStr) + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function getScoreLevel(score, fullScore) {
  const percent = (score / fullScore) * 100;
  if (percent >= 90) return '优秀';
  if (percent >= 80) return '良好';
  if (percent >= 70) return '中等';
  if (percent >= 60) return '及格';
  return '不及格';
}

async function seedTestScores() {
  const connection = await createAutoConnection();

  try {
    console.log('🌱 开始生成测试成绩...\n');

    // ---------- 1. 学科满分映射 ----------
    const [subjectRows] = await connection.query('SELECT id, name, full_score FROM subjects');
    const subjectMap = {};
    subjectRows.forEach((s) => { subjectMap[s.id] = s; });

    // ---------- 2. 班级学生 ----------
    const [studentRows] = await connection.query(
      "SELECT id, class_id FROM users WHERE role = 'student' AND class_id IS NOT NULL ORDER BY class_id, id"
    );
    const studentsByGrade = { 高一: [], 高二: [], 高三: [] };
    for (const s of studentRows) {
      const grade = CLASS_GRADE[s.class_id];
      if (grade) studentsByGrade[grade].push(s);
    }
    console.log('👨‍🎓 学生分布:',
      Object.entries(studentsByGrade).map(([g, arr]) => `${g} ${arr.length} 人`).join('，'), '\n');

    // ---------- 3. 建考试 + 考试科目 ----------
    let examCreated = 0;
    const examIdMap = {}; // name -> id

    for (const plan of EXAM_PLAN) {
      const [existing] = await connection.execute(
        'SELECT id FROM exams WHERE name = ? LIMIT 1',
        [plan.name]
      );

      let examId;
      if (existing.length > 0) {
        examId = existing[0].id;
      } else {
        const [res] = await connection.execute(
          `INSERT INTO exams (name, exam_type, grade, exam_date, semester, status, created_by)
           VALUES (?, ?, ?, ?, ?, 2, 1)`,
          [plan.name, plan.type, plan.grade, plan.date, SEMESTER]
        );
        examId = res.insertId;
        examCreated++;
      }
      examIdMap[plan.name] = examId;

      // 考试科目（幂等）
      for (const subjectId of plan.subjects) {
        const fullScore = subjectMap[subjectId]?.full_score || 100;
        const passScore = Math.round(fullScore * 0.6);
        await connection.execute(
          `INSERT IGNORE INTO exam_subjects (exam_id, subject_id, full_score, pass_score, exam_duration)
           VALUES (?, ?, ?, ?, ?)`,
          [examId, subjectId, fullScore, passScore, fullScore >= 150 ? 120 : 90]
        );
      }
    }
    console.log(`📝 考试就绪: 新建 ${examCreated} 场，共 ${EXAM_PLAN.length} 场\n`);

    // ---------- 4. 生成成绩 ----------
    let inserted = 0;
    let skipped = 0;

    // 同年级考试按日期排序，用于计算「随考试提升」的进度
    const planByGrade = { 高一: [], 高二: [], 高三: [] };
    for (const plan of EXAM_PLAN) planByGrade[plan.grade].push(plan);
    for (const g of Object.keys(planByGrade)) {
      planByGrade[g].sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    for (const grade of Object.keys(planByGrade)) {
      const students = studentsByGrade[grade];
      if (students.length === 0) continue;

      for (const plan of planByGrade[grade]) {
        const examId = examIdMap[plan.name];
        const examIdx = planByGrade[grade].indexOf(plan);
        const totalExams = planByGrade[grade].length;
        // 最后一次考试为期末/三模，进度系数 0 → 1
        const progress = totalExams > 1 ? examIdx / (totalExams - 1) : 0;

        for (const stu of students) {
          const ability = 0.55 + 0.33 * rand01(`ability-${stu.id}`);

          for (const subjectId of plan.subjects) {
            const fullScore = subjectMap[subjectId]?.full_score || 100;

            const affinity = -0.09 + 0.18 * rand01(`aff-${stu.id}-${subjectId}`);
            const noise = -0.04 + 0.08 * rand01(`noise-${stu.id}-${examId}-${subjectId}`);
            // 约 60% 的学生有正向提升趋势
            const trendSign = rand01(`trend-${stu.id}`) > 0.4 ? 1 : -1;
            const growth = trendSign * 0.06 * progress;

            const ratio = clamp(ability + affinity + noise + growth, 0.32, 0.99);
            const score = Math.round(fullScore * ratio);
            const scoreLevel = getScoreLevel(score, fullScore);

            // 已存在的成绩保留（INSERT IGNORE）
            const [res] = await connection.execute(
              `INSERT IGNORE INTO exam_scores
                 (exam_id, student_id, subject_id, class_id, score, score_level, is_absent, created_at)
               VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
              [examId, stu.id, subjectId, stu.class_id, score, scoreLevel]
            );
            if (res.affectedRows > 0) inserted++;
            else skipped++;
          }
        }
      }
    }
    console.log(`📊 成绩写入: 新增 ${inserted} 条，已存在跳过 ${skipped} 条\n`);

    // ---------- 5. 重算排名 ----------
    console.log('🔢 重算班级/年级排名...');
    let rankUpdated = 0;
    for (const plan of EXAM_PLAN) {
      const examId = examIdMap[plan.name];
      for (const subjectId of plan.subjects) {
        const [rows] = await connection.query(
          `SELECT id, student_id, class_id, score
           FROM exam_scores
           WHERE exam_id = ? AND subject_id = ? AND is_absent = 0
           ORDER BY score DESC, id ASC`,
          [examId, subjectId]
        );
        if (rows.length === 0) continue;

        // 年级排名（并列同名次）
        const gradeRank = {};
        let gRank = 1;
        let prev = null;
        rows.forEach((r, i) => {
          if (prev === null || Number(r.score) !== Number(prev)) {
            gRank = i + 1;
            prev = r.score;
          }
          gradeRank[r.id] = gRank;
        });

        // 班级排名
        const byClass = {};
        rows.forEach((r) => {
          if (!byClass[r.class_id]) byClass[r.class_id] = [];
          byClass[r.class_id].push(r);
        });
        const classRank = {};
        for (const cid of Object.keys(byClass)) {
          const list = byClass[cid];
          let cRank = 1;
          let prevC = null;
          list.forEach((r, i) => {
            if (prevC === null || Number(r.score) !== Number(prevC)) {
              cRank = i + 1;
              prevC = r.score;
            }
            classRank[r.id] = cRank;
          });
        }

        for (const r of rows) {
          await connection.execute(
            'UPDATE exam_scores SET rank_in_class = ?, rank_in_grade = ?, updated_at = NOW() WHERE id = ?',
            [classRank[r.id] || null, gradeRank[r.id] || null, r.id]
          );
          rankUpdated++;
        }
      }
    }
    console.log(`   ✅ 已更新 ${rankUpdated} 条排名\n`);

    // ---------- 6. 汇总 ----------
    const [summary] = await connection.query(
      `SELECT e.grade, COUNT(DISTINCT e.id) exams, COUNT(DISTINCT es.student_id) students, COUNT(*) scores
       FROM exams e JOIN exam_scores es ON es.exam_id = e.id
       GROUP BY e.grade ORDER BY e.grade`
    );
    console.log('📊 成绩汇总（按年级）：');
    summary.forEach((r) => console.log(`   ${r.grade}: ${r.exams} 场考试 / ${r.students} 名学生 / ${r.scores} 条成绩`));

    console.log('\n🎉 测试成绩生成完成！');
  } finally {
    await connection.end();
  }
}

seedTestScores().catch((err) => {
  console.error('❌ 测试成绩生成失败:', err);
  process.exit(1);
});