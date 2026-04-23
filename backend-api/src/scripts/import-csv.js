// backend-api/src/scripts/import-csv.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const pool = require('../config/database');
const { seedTestStudents, getStudentDisciplineMapping } = require('./seed-test-students');

const CSV_PATH = path.join(__dirname, '../../../datasets/ai_assistant_usage_student_life.csv');

async function importCSV() {
    console.log('🚀 开始导入 CSV 数据...\n');

    try {
        // 1. 确保测试学生存在
        await seedTestStudents();

        // 2. 获取学生学科映射
        const studentMapping = await getStudentDisciplineMapping();
        console.log(` 学生映射: ${studentMapping.length} 名学生\n`);

        // 3. 创建学科到学生ID的映射表
        const disciplineToStudents = {};
        for (const student of studentMapping) {
            if (!disciplineToStudents[student.discipline]) {
                disciplineToStudents[student.discipline] = [];
            }
            disciplineToStudents[student.discipline].push(student.id);
        }

        console.log('学科学生分布:');
        for (const [discipline, ids] of Object.entries(disciplineToStudents)) {
            console.log(`  ${discipline}: ${ids.length} 名学生`);
        }

        // 4. 清空现有数据（可选）
        const [count] = await pool.execute('SELECT COUNT(*) as cnt FROM ai_usage_logs');
        if (count[0].cnt > 0) {
            console.log(`\n 现有 ${count[0].cnt} 条记录，将清空后重新导入`);
            await pool.execute('TRUNCATE TABLE ai_usage_logs');
        }

        // 5. 读取并处理 CSV
        const records = [];
        let rowCount = 0;
        let insertedCount = 0;
        let skipCount = 0;

        await new Promise((resolve, reject) => {
            fs.createReadStream(CSV_PATH)
                .pipe(csv())
                .on('data', (row) => {
                    rowCount++;
                    records.push(row);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`\n 读取到 ${rowCount} 条记录`);

        // 6. 批量插入数据库
        const batchSize = 500;
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            const values = [];

            for (const row of batch) {
                const discipline = row.Discipline;
                const students = disciplineToStudents[discipline] || [];

                if (students.length === 0) {
                    skipCount++;
                    continue;
                }

                // 随机选择一个该学科的学生
                const userId = students[Math.floor(Math.random() * students.length)];

                // 解析日期
                let sessionDate = null;
                if (row.SessionDate) {
                    let dateStr = row.SessionDate;
                    // 统一分隔符为 -
                    dateStr = dateStr.replace(/\//g, '-');
                    const parts = dateStr.split('-');
                    if (parts.length === 3) {
                        let year = parts[0];
                        let month = parts[1].padStart(2, '0');
                        let day = parts[2].padStart(2, '0');
                        sessionDate = `${year}-${month}-${day}`;
                    }
                }

                // 解析 UsedAgain (TRUE/FALSE)
                const usedAgain = row.UsedAgain === 'TRUE' || row.UsedAgain === 'true';

                // 解析成绩
                const scoreBefore = row['使用AI前的成绩'] ? parseInt(row['使用AI前的成绩']) : null;
                const scoreAfter = row['使用AI后的成绩'] ? parseInt(row['使用AI后的成绩']) : null;

                values.push([
                    userId,
                    row.SessionID || null,
                    row.StudentLevel || null,
                    discipline,
                    sessionDate,
                    row.SessionLengthMin ? parseFloat(row.SessionLengthMin) : null,
                    row.TotalPrompts ? parseInt(row.TotalPrompts) : null,
                    row.TaskType || null,
                    row.AI_AssistanceLevel ? parseInt(row.AI_AssistanceLevel) : null,
                    row.FinalOutcome || null,
                    usedAgain,
                    row.SatisfactionRating ? parseFloat(row.SatisfactionRating) : null,
                    scoreBefore,
                    scoreAfter
                ]);
            }

            if (values.length > 0) {
                const placeholders = values.map(() =>
                    '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
                ).join(',');

                const flatValues = values.flat();

                await pool.execute(
                    `INSERT INTO ai_usage_logs 
           (user_id, session_id, student_level, discipline, session_date, 
            session_length_min, total_prompts, task_type, ai_assistance_level, 
            final_outcome, used_again, satisfaction_rating, score_before, score_after)
           VALUES ${placeholders}`,
                    flatValues
                );

                insertedCount += values.length;
                console.log(` 已导入 ${insertedCount} / ${rowCount} 条记录`);
            }
        }

        console.log(`\n CSV 导入完成！`);
        console.log(`   总记录: ${rowCount}`);
        console.log(`   成功导入: ${insertedCount}`);
        console.log(`   跳过: ${skipCount} (无匹配学生)`);

        // 7. 验证导入结果
        const [result] = await pool.execute('SELECT COUNT(*) as cnt FROM ai_usage_logs');
        console.log(`\n 数据库现共有 ${result[0].cnt} 条 AI 使用记录`);

    } catch (error) {
        console.error(' 导入失败:', error.message);
        throw error;
    }
}

// 直接运行
if (require.main === module) {
    importCSV()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = importCSV;