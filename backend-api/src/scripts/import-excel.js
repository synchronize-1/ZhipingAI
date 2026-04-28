// backend-api/src/scripts/import-excel.js
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const pool = require('../config/database');
const { seedTestStudents, getStudentDisciplineMapping } = require('./seed-test-students');

const EXCEL_PATH = path.join(__dirname, '../../../datasets/数据集2（AI校园研究调查回答）.xlsx');

// 依赖指数计算
const MIN_RAW = -11;
const MAX_RAW = 32;

function calculateDependence(knowledgeLevel, usageFrequency, studyUsage, careerInterest, knowsChatgpt) {
    // 了解ChatGPT数值: Yes=1, No=0
    const chatgptValue = knowsChatgpt === 'Yes' || knowsChatgpt === true ? 1 : 0;

    // 依赖原始分
    const rawScore = knowledgeLevel * (-3) + usageFrequency * 1 + studyUsage * 1 + careerInterest * 1 + chatgptValue * 5;

    // 依赖程度 (0-100)
    const dependence = ((rawScore - MIN_RAW) / (MAX_RAW - MIN_RAW)) * 100;
    const clampedDependence = Math.max(0, Math.min(100, dependence));

    // 等级划分
    let level = '轻度';
    if (clampedDependence >= 80) level = '重度';
    else if (clampedDependence >= 50) level = '中度';

    return { rawScore, dependence: clampedDependence, level };
}

async function importExcel() {
    console.log('🚀 开始导入 Excel 问卷数据...\n');

    try {
        // 1. 确保测试学生存在
        await seedTestStudents();

        // 2. 获取学生学科映射
        const studentMapping = await getStudentDisciplineMapping();

        // 创建专业到学生ID的映射 (专业 -> student_id)
        const majorToStudents = {};
        for (const student of studentMapping) {
            let major = null;
            if (student.discipline === 'Computer Science') major = 'Science, Engineering, & Technology';
            else if (student.discipline === 'Psychology') major = 'Science, Engineering, & Technology';
            else if (student.discipline === 'Business') major = 'Business';
            else if (student.discipline === 'Biology') major = 'Science, Engineering, & Technology';
            else if (student.discipline === 'Engineering') major = 'Science, Engineering, & Technology';
            else if (student.discipline === 'History') major = 'Humanities & Liberal Arts';
            else if (student.discipline === 'Math') major = 'Science, Engineering, & Technology';

            if (major) {
                if (!majorToStudents[major]) majorToStudents[major] = [];
                majorToStudents[major].push(student.id);
            }
        }

        console.log('专业学生分布:');
        for (const [major, ids] of Object.entries(majorToStudents)) {
            console.log(`  ${major}: ${ids.length} 名学生`);
        }

        // 3. 清空现有数据
        await pool.execute('TRUNCATE TABLE ai_survey_responses');

        // 4. 读取 Excel
        const workbook = XLSX.readFile(EXCEL_PATH);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // 跳过表头
        const header = rows[0];
        const dataRows = rows.slice(1);

        console.log(`\n📄 读取到 ${dataRows.length} 条问卷记录`);

        // 5. 处理每条记录
        let insertedCount = 0;
        let skipCount = 0;

        // 列索引映射
        const colIndex = {
            answerTime: 0,
            knowledgeLevel: 1,
            usageFrequency: 2,
            studyUsage: 3,
            careerInterest: 4,
            knowsChatgpt: 5,
            major: 6
        };

        const values = [];

        for (const row of dataRows) {
            if (!row || row.length < 7) continue;

            const answerTime = row[colIndex.answerTime];
            const knowledgeLevel = parseInt(row[colIndex.knowledgeLevel]);
            const usageFrequency = parseInt(row[colIndex.usageFrequency]);
            const studyUsage = parseInt(row[colIndex.studyUsage]);
            const careerInterest = parseInt(row[colIndex.careerInterest]);
            const knowsChatgpt = row[colIndex.knowsChatgpt];
            const major = row[colIndex.major];

            // 验证数据
            if (isNaN(knowledgeLevel) || isNaN(usageFrequency) || isNaN(studyUsage) || isNaN(careerInterest)) {
                skipCount++;
                continue;
            }

            // 查找匹配的学生
            const students = majorToStudents[major] || [];
            let userId = null;

            if (students.length > 0) {
                // 如果有多个学生，按顺序分配（循环）
                const idx = insertedCount % students.length;
                userId = students[idx];
            }

            // 计算依赖指数
            const { rawScore, dependence, level } = calculateDependence(
                knowledgeLevel, usageFrequency, studyUsage, careerInterest, knowsChatgpt
            );

            // 解析日期时间
            let answerDateTime = null;
            if (answerTime) {
                if (typeof answerTime === 'number') {
                    // Excel 日期数字
                    const date = new Date((answerTime - 25569) * 86400 * 1000);
                    answerDateTime = date;
                } else {
                    answerDateTime = new Date(answerTime);
                }
            }

            values.push([
                userId,
                answerDateTime,
                knowledgeLevel,
                usageFrequency,
                studyUsage,
                careerInterest,
                knowsChatgpt === 'Yes',
                major,
                dependence,
                level
            ]);

            insertedCount++;

            // 同时更新 users 表中的依赖指数
            if (userId) {
                await pool.execute(
                    `UPDATE users SET dependence_score = ?, dependence_level = ?, updated_at = NOW() 
           WHERE id = ? AND (dependence_score IS NULL OR dependence_score < ?)`,
                    [dependence, level, userId, dependence]
                );
            }
        }

        // 6. 批量插入
        if (values.length > 0) {
            const placeholders = values.map(() =>
                '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).join(',');

            const flatValues = values.flat();

            await pool.execute(
                `INSERT INTO ai_survey_responses 
         (user_id, answer_time, knowledge_level, usage_frequency, study_usage, 
          career_interest, knows_chatgpt, major, dependence_score, dependence_level)
         VALUES ${placeholders}`,
                flatValues
            );
        }

        console.log(`\n✨ Excel 导入完成！`);
        console.log(`   总记录: ${dataRows.length}`);
        console.log(`   成功导入: ${insertedCount}`);
        console.log(`   跳过: ${skipCount}`);

        // 7. 统计结果
        const [result] = await pool.execute('SELECT COUNT(*) as cnt FROM ai_survey_responses');
        console.log(`\n📊 数据库现共有 ${result[0].cnt} 条问卷记录`);

        // 依赖指数分布统计
        const [stats] = await pool.execute(`
      SELECT 
        dependence_level,
        COUNT(*) as count,
        AVG(dependence_score) as avg_score
      FROM ai_survey_responses 
      WHERE dependence_level IS NOT NULL
      GROUP BY dependence_level
    `);

        console.log('\n📊 依赖指数分布:');
        for (const stat of stats) {
            console.log(`   ${stat.dependence_level}: ${stat.count} 人 (平均 ${Math.round(stat.avg_score)}分)`);
        }

    } catch (error) {
        console.error('❌ 导入失败:', error.message);
        throw error;
    }
}

// 直接运行
if (require.main === module) {
    importExcel()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = importExcel;