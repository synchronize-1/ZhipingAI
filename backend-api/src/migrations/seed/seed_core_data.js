/**
 * 核心数据种子脚本
 *
 * 用法: node src/migrations/seed/seed_core_data.js
 *
 * 前置：需先执行 node src/migrations/index.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// 复用迁移器的自动建库连接
const { createConnection: createAutoConnection } = require('../index');

async function seedCoreData() {
    // 自动建库 + 连接目标库
    const connection = await createAutoConnection();

    try {
        console.log('🌱 开始插入核心种子数据...\n');

        // ============================================
        // 1. 学科
        // ============================================
        console.log('📚 插入学科数据...');
        const subjects = [
            { name: '语文', code: 'CHN', category: '文科', full_score: 150 },
            { name: '数学', code: 'MATH', category: '理科', full_score: 150 },
            { name: '英语', code: 'ENG', category: '文科', full_score: 150 },
            { name: '物理', code: 'PHY', category: '理科', full_score: 100 },
            { name: '化学', code: 'CHEM', category: '理科', full_score: 100 },
            { name: '生物', code: 'BIO', category: '理科', full_score: 100 },
            { name: '历史', code: 'HIST', category: '文科', full_score: 100 },
            { name: '地理', code: 'GEO', category: '文科', full_score: 100 },
            { name: '政治', code: 'POL', category: '文科', full_score: 100 },
            { name: '信息技术', code: 'IT', category: '工科', full_score: 100 },
            { name: '体育', code: 'PE', category: '体育', full_score: 100 },
            { name: '音乐', code: 'MUS', category: '艺术', full_score: 100 },
            { name: '美术', code: 'ART', category: '艺术', full_score: 100 }
        ];
        for (const s of subjects) {
            await connection.execute(
                `INSERT IGNORE INTO subjects (name, code, category, full_score) VALUES (?, ?, ?, ?)`,
                [s.name, s.code, s.category, s.full_score]
            );
        }
        console.log(`   ✅ 已插入 ${subjects.length} 门学科\n`);

        // ============================================
        // 2. 班级
        // ============================================
        console.log('🏫 插入班级数据...');
        const classes = [
            { name: '高一(1)班', grade: '高一', head_teacher_id: 2, student_count: 45, department: '高一年级' },
            { name: '高一(2)班', grade: '高一', head_teacher_id: 3, student_count: 48, department: '高一年级' },
            { name: '高二(1)班', grade: '高二', head_teacher_id: 2, student_count: 42, department: '高二年级' },
            { name: '高二(2)班', grade: '高二', head_teacher_id: 3, student_count: 46, department: '高二年级' },
            { name: '高三(1)班', grade: '高三', head_teacher_id: 2, student_count: 50, department: '高三年级' }
        ];
        for (const c of classes) {
            await connection.execute(
                `INSERT IGNORE INTO classes (name, grade, head_teacher_id, student_count, department) VALUES (?, ?, ?, ?, ?)`,
                [c.name, c.grade, c.head_teacher_id, c.student_count, c.department]
            );
        }
        console.log(`   ✅ 已插入 ${classes.length} 个班级\n`);

        // ============================================
        // 3. 班级学科教师关联
        // ============================================
        console.log('👨‍🏫 插入班级学科教师关联数据...');
        const classSubjectTeachers = [
            { class_id: 1, subject_id: 1, teacher_id: 2 },
            { class_id: 1, subject_id: 2, teacher_id: 3 },
            { class_id: 1, subject_id: 3, teacher_id: 2 },
            { class_id: 2, subject_id: 1, teacher_id: 3 },
            { class_id: 2, subject_id: 2, teacher_id: 2 },
            { class_id: 2, subject_id: 3, teacher_id: 3 },
            { class_id: 3, subject_id: 1, teacher_id: 2 },
            { class_id: 3, subject_id: 2, teacher_id: 3 },
            { class_id: 3, subject_id: 4, teacher_id: 2 },
            { class_id: 4, subject_id: 1, teacher_id: 3 },
            { class_id: 4, subject_id: 2, teacher_id: 2 },
            { class_id: 4, subject_id: 4, teacher_id: 3 },
            { class_id: 5, subject_id: 1, teacher_id: 2 },
            { class_id: 5, subject_id: 2, teacher_id: 3 },
            { class_id: 5, subject_id: 3, teacher_id: 2 },
            { class_id: 5, subject_id: 4, teacher_id: 3 }
        ];
        for (const cst of classSubjectTeachers) {
            await connection.execute(
                `INSERT IGNORE INTO class_subject_teachers (class_id, subject_id, teacher_id) VALUES (?, ?, ?)`,
                [cst.class_id, cst.subject_id, cst.teacher_id]
            );
        }
        console.log(`   ✅ 已插入 ${classSubjectTeachers.length} 条班级学科教师关联\n`);

        // ============================================
        // 4. 考试
        // ============================================
        console.log('📝 插入模拟考试数据...');
        const exams = [
            { name: '2024年春季高一期中考试', exam_type: 'midterm', grade: '高一', exam_date: '2024-04-15', semester: '2023-2024-2', status: 2, created_by: 1 },
            { name: '2024年春季高二第一次月考', exam_type: 'monthly', grade: '高二', exam_date: '2024-03-20', semester: '2023-2024-2', status: 2, created_by: 1 },
            { name: '2024年高三模拟考试（一）', exam_type: 'mock', grade: '高三', exam_date: '2024-05-10', semester: '2023-2024-2', status: 1, created_by: 1 }
        ];
        for (const e of exams) {
            await connection.execute(
                `INSERT IGNORE INTO exams (name, exam_type, grade, exam_date, semester, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [e.name, e.exam_type, e.grade, e.exam_date, e.semester, e.status, e.created_by]
            );
        }
        console.log(`   ✅ 已插入 ${exams.length} 场考试\n`);

        // ============================================
        // 5. 考试科目关联
        // ============================================
        console.log('📖 插入考试科目关联数据...');
        const examSubjects = [
            { exam_id: 1, subject_id: 1, full_score: 150, pass_score: 90, exam_duration: 120 },
            { exam_id: 1, subject_id: 2, full_score: 150, pass_score: 90, exam_duration: 120 },
            { exam_id: 1, subject_id: 3, full_score: 150, pass_score: 90, exam_duration: 120 },
            { exam_id: 1, subject_id: 4, full_score: 100, pass_score: 60, exam_duration: 90 },
            { exam_id: 1, subject_id: 5, full_score: 100, pass_score: 60, exam_duration: 90 },
            { exam_id: 1, subject_id: 6, full_score: 100, pass_score: 60, exam_duration: 90 },
            { exam_id: 1, subject_id: 7, full_score: 100, pass_score: 60, exam_duration: 90 },
            { exam_id: 1, subject_id: 8, full_score: 100, pass_score: 60, exam_duration: 90 },
            { exam_id: 1, subject_id: 9, full_score: 100, pass_score: 60, exam_duration: 90 },
            { exam_id: 2, subject_id: 1, full_score: 150, pass_score: 90, exam_duration: 120 },
            { exam_id: 2, subject_id: 2, full_score: 150, pass_score: 90, exam_duration: 120 },
            { exam_id: 2, subject_id: 3, full_score: 150, pass_score: 90, exam_duration: 120 },
            { exam_id: 2, subject_id: 4, full_score: 100, pass_score: 60, exam_duration: 90 },
            { exam_id: 3, subject_id: 1, full_score: 150, pass_score: 90, exam_duration: 150 },
            { exam_id: 3, subject_id: 2, full_score: 150, pass_score: 90, exam_duration: 150 },
            { exam_id: 3, subject_id: 3, full_score: 150, pass_score: 90, exam_duration: 150 },
            { exam_id: 3, subject_id: 4, full_score: 100, pass_score: 60, exam_duration: 100 }
        ];
        for (const es of examSubjects) {
            await connection.execute(
                `INSERT IGNORE INTO exam_subjects (exam_id, subject_id, full_score, pass_score, exam_duration) VALUES (?, ?, ?, ?, ?)`,
                [es.exam_id, es.subject_id, es.full_score, es.pass_score, es.exam_duration]
            );
        }
        console.log(`   ✅ 已插入 ${examSubjects.length} 条考试科目关联\n`);

        // ============================================
        // 6. 成绩
        // ============================================
        console.log('📊 插入模拟成绩数据...');
        function getScoreLevel(score, fullScore) {
            const percent = (score / fullScore) * 100;
            if (percent >= 90) return '优秀';
            if (percent >= 80) return '良好';
            if (percent >= 70) return '中等';
            if (percent >= 60) return '及格';
            return '不及格';
        }
        const scoreData = [
            { exam_id: 1, student_id: 4, subject_id: 1, class_id: 1, score: 128, rank_in_class: 5, rank_in_grade: 25, is_absent: 0 },
            { exam_id: 1, student_id: 4, subject_id: 2, class_id: 1, score: 142, rank_in_class: 2, rank_in_grade: 10, is_absent: 0 },
            { exam_id: 1, student_id: 4, subject_id: 3, class_id: 1, score: 115, rank_in_class: 8, rank_in_grade: 35, is_absent: 0 },
            { exam_id: 1, student_id: 4, subject_id: 4, class_id: 1, score: 88, rank_in_class: 3, rank_in_grade: 15, is_absent: 0 },
            { exam_id: 1, student_id: 4, subject_id: 5, class_id: 1, score: 76, rank_in_class: 10, rank_in_grade: 42, is_absent: 0 },
            { exam_id: 1, student_id: 4, subject_id: 6, class_id: 1, score: 82, rank_in_class: 6, rank_in_grade: 28, is_absent: 0 },
            { exam_id: 1, student_id: 4, subject_id: 7, class_id: 1, score: 70, rank_in_class: 12, rank_in_grade: 50, is_absent: 0 },
            { exam_id: 1, student_id: 4, subject_id: 8, class_id: 1, score: 78, rank_in_class: 7, rank_in_grade: 30, is_absent: 0 },
            { exam_id: 1, student_id: 4, subject_id: 9, class_id: 1, score: 85, rank_in_class: 4, rank_in_grade: 18, is_absent: 0 },
            { exam_id: 1, student_id: 5, subject_id: 1, class_id: 1, score: 135, rank_in_class: 2, rank_in_grade: 12, is_absent: 0 },
            { exam_id: 1, student_id: 5, subject_id: 2, class_id: 1, score: 118, rank_in_class: 6, rank_in_grade: 28, is_absent: 0 },
            { exam_id: 1, student_id: 5, subject_id: 3, class_id: 1, score: 140, rank_in_class: 1, rank_in_grade: 5, is_absent: 0 },
            { exam_id: 1, student_id: 5, subject_id: 4, class_id: 1, score: 72, rank_in_class: 10, rank_in_grade: 40, is_absent: 0 },
            { exam_id: 1, student_id: 5, subject_id: 5, class_id: 1, score: 68, rank_in_class: 15, rank_in_grade: 60, is_absent: 0 },
            { exam_id: 1, student_id: 5, subject_id: 6, class_id: 1, score: 90, rank_in_class: 3, rank_in_grade: 12, is_absent: 0 },
            { exam_id: 1, student_id: 5, subject_id: 7, class_id: 1, score: 92, rank_in_class: 1, rank_in_grade: 8, is_absent: 0 },
            { exam_id: 1, student_id: 5, subject_id: 8, class_id: 1, score: 88, rank_in_class: 3, rank_in_grade: 15, is_absent: 0 },
            { exam_id: 1, student_id: 5, subject_id: 9, class_id: 1, score: 78, rank_in_class: 8, rank_in_grade: 32, is_absent: 0 }
        ];
        for (const score of scoreData) {
            const [subjectRows] = await connection.execute(
                'SELECT full_score FROM exam_subjects WHERE exam_id = ? AND subject_id = ?',
                [score.exam_id, score.subject_id]
            );
            const fullScore = subjectRows[0] ? subjectRows[0].full_score : 100;
            const scoreLevel = getScoreLevel(score.score, fullScore);

            await connection.execute(
                `INSERT IGNORE INTO exam_scores (exam_id, student_id, subject_id, class_id, score, score_level, rank_in_class, rank_in_grade, is_absent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    score.exam_id,
                    score.student_id,
                    score.subject_id,
                    score.class_id,
                    score.score,
                    scoreLevel,
                    score.rank_in_class ?? null,
                    score.rank_in_grade ?? null,
                    score.is_absent ?? 0
                ]
            );
        }
        console.log(`   ✅ 已插入 ${scoreData.length} 条成绩记录\n`);

        // ============================================
        // 7. 成长档案
        // ============================================
        console.log('📁 插入成长档案示例数据...');

        const portfolioSkills = [
            { student_id: 4, skill_name: 'Python编程', skill_category: '技术', level: 4, description: '掌握Python基础语法和常用库', semester: '2023-2024-1' },
            { student_id: 4, skill_name: '篮球', skill_category: '体育', level: 3, description: '校篮球队成员', semester: '2023-2024-1' },
            { student_id: 4, skill_name: '钢琴', skill_category: '艺术', level: 5, description: '钢琴十级', verified_by: 2, verified_at: '2024-01-15', semester: '2023-2024-1' },
            { student_id: 5, skill_name: '英语口语', skill_category: '学术', level: 4, description: '流利的英语口语表达', semester: '2023-2024-1' },
            { student_id: 5, skill_name: '绘画', skill_category: '艺术', level: 3, description: '擅长水彩画', semester: '2023-2024-2' },
            { student_id: 5, skill_name: '羽毛球', skill_category: '体育', level: 4, description: '校羽毛球队主力', verified_by: 3, verified_at: '2024-03-20', semester: '2023-2024-2' }
        ];
        for (const skill of portfolioSkills) {
            await connection.execute(
                `INSERT IGNORE INTO portfolio_skills
           (student_id, skill_name, skill_category, level, description, verified_by, verified_at, semester)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    skill.student_id, skill.skill_name, skill.skill_category, skill.level,
                    skill.description ?? null, skill.verified_by ?? null, skill.verified_at ?? null, skill.semester ?? null
                ]
            );
        }

        const portfolioHonors = [
            { student_id: 4, title: '全国青少年信息学奥林匹克竞赛二等奖', honor_type: '竞赛获奖', level: '国家级', awarding_org: '中国计算机学会', awarded_date: '2023-11-20', semester: '2023-2024-1', verified_by: 2, verified_at: '2023-12-01' },
            { student_id: 4, title: '校三好学生', honor_type: '优秀学生', level: '校级', awarding_org: '学校', awarded_date: '2024-01-10', semester: '2023-2024-1' },
            { student_id: 5, title: '全国中学生英语能力竞赛一等奖', honor_type: '竞赛获奖', level: '国家级', awarding_org: '全国中学生英语能力竞赛组委会', awarded_date: '2023-12-15', semester: '2023-2024-1', verified_by: 3, verified_at: '2024-01-05' },
            { student_id: 5, title: '省级优秀学生干部', honor_type: '优秀学生', level: '省级', awarding_org: '省教育厅', awarded_date: '2024-02-28', semester: '2023-2024-2' },
            { student_id: 5, title: '校级奖学金一等奖', honor_type: '奖学金', level: '校级', awarding_org: '学校', awarded_date: '2024-01-15', semester: '2023-2024-1' }
        ];
        for (const honor of portfolioHonors) {
            await connection.execute(
                `INSERT IGNORE INTO portfolio_honors
           (student_id, title, honor_type, level, awarding_org, awarded_date, description, verified_by, verified_at, semester)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    honor.student_id, honor.title, honor.honor_type, honor.level, honor.awarding_org,
                    honor.awarded_date, honor.description ?? '', honor.verified_by ?? null,
                    honor.verified_at ?? null, honor.semester ?? null
                ]
            );
        }

        const mentalHealthRecords = [
            { student_id: 4, assessment_date: '2023-09-15', assessment_type: 'SCL-90', overall_score: 125.5, stress_level: '低', mood_score: 85, assessed_by: 2 },
            { student_id: 4, assessment_date: '2024-03-10', assessment_type: 'SDS', overall_score: 42.0, stress_level: '低', mood_score: 82, assessed_by: 2 },
            { student_id: 5, assessment_date: '2023-09-15', assessment_type: 'SCL-90', overall_score: 140.0, stress_level: '中', mood_score: 72, assessed_by: 3 },
            { student_id: 5, assessment_date: '2024-03-10', assessment_type: 'SAS', overall_score: 55.0, stress_level: '中', mood_score: 68, assessed_by: 3, notes: '建议适当放松，增加户外活动' }
        ];
        for (const record of mentalHealthRecords) {
            const details = JSON.stringify({
                somatization: (record.overall_score / 10).toFixed(1),
                obsessive_compulsive: (record.overall_score / 12).toFixed(1),
                interpersonal_sensitivity: (record.overall_score / 11).toFixed(1),
                depression: (record.overall_score / 13).toFixed(1),
                anxiety: (record.overall_score / 10).toFixed(1),
                hostility: (record.overall_score / 14).toFixed(1),
                phobic_anxiety: (record.overall_score / 15).toFixed(1),
                paranoid_ideation: (record.overall_score / 13).toFixed(1),
                psychoticism: (record.overall_score / 14).toFixed(1)
            });
            await connection.execute(
                `INSERT IGNORE INTO portfolio_mental_health
           (student_id, assessment_date, assessment_type, overall_score, stress_level, mood_score, details, notes, assessed_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    record.student_id, record.assessment_date, record.assessment_type,
                    record.overall_score, record.stress_level, record.mood_score,
                    details, record.notes ?? null, record.assessed_by ?? null
                ]
            );
        }

        const portfolioComments = [
            { student_id: 4, class_id: 1, semester: '2023-2024-1', comment_type: 'general', content: '该生学习态度端正，思维敏捷，尤其在理科方面表现突出。数学和物理成绩优异，多次在竞赛中获奖。性格开朗，乐于助人，是班级的骨干力量。建议继续保持学习热情，同时加强文科方面的积累，全面发展。', comment_style: '鼓励型', source: 'teacher', created_by: 2 },
            { student_id: 4, class_id: 1, semester: '2023-2024-2', comment_type: 'general', content: '本学期进步明显，各科成绩均衡发展。在信息技术竞赛中取得了优异成绩，展现了出色的编程能力。积极参加体育活动，篮球水平有所提高。希望继续保持良好的学习习惯，在英语方面多下功夫。', comment_style: '鼓励型', source: 'ai', created_by: 2 },
            { student_id: 5, class_id: 1, semester: '2023-2024-1', comment_type: 'general', content: '该生品学兼优，是班级的学习标兵。语文和英语成绩尤为突出，表达能力强。历史、地理等人文学科基础扎实。作为班干部，工作认真负责，深受同学信赖。希望继续保持优势，在理科学习上寻求突破。', comment_style: '严谨型', source: 'teacher', created_by: 3 },
            { student_id: 5, class_id: 1, semester: '2023-2024-2', comment_type: 'general', content: '本学期表现优秀，学习成绩稳居班级前列。英语竞赛获得国家级奖项，为校争光。绘画特长在校园文化节中得到展示。积极参与班级管理，组织能力强。建议适当调整学习节奏，注意劳逸结合。', comment_style: '鼓励型', source: 'edited', created_by: 3 }
        ];
        for (const comment of portfolioComments) {
            await connection.execute(
                `INSERT IGNORE INTO portfolio_comments
           (student_id, class_id, semester, comment_type, content, comment_style, source, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    comment.student_id, comment.class_id ?? null, comment.semester,
                    comment.comment_type ?? 'general', comment.content,
                    comment.comment_style ?? null, comment.source ?? 'teacher',
                    comment.created_by ?? null
                ]
            );
        }

        console.log(`   ✅ 已插入成长档案数据：`);
        console.log(`      - 技能记录: ${portfolioSkills.length} 条`);
        console.log(`      - 荣誉记录: ${portfolioHonors.length} 条`);
        console.log(`      - 心理健康记录: ${mentalHealthRecords.length} 条`);
        console.log(`      - 学生评语: ${portfolioComments.length} 条\n`);

        console.log('🎉 核心种子数据插入完成！');
    } catch (err) {
        console.error('❌ 种子数据插入失败:', err.message);
        throw err;
    } finally {
        await connection.end();
    }
}

if (require.main === module) {
    seedCoreData().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { seedCoreData };