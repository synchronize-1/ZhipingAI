// backend-api/src/scripts/seed-test-students.js
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

// 学科映射配置
const disciplineConfig = {
    'Computer Science': { prefix: 'cs_student', count: 5, department: '计算机学院' },
    'Psychology': { prefix: 'psy_student', count: 3, department: '心理学院' },
    'Business': { prefix: 'biz_student', count: 3, department: '商学院' },
    'Biology': { prefix: 'bio_student', count: 3, department: '生物学院' },
    'Engineering': { prefix: 'eng_student', count: 3, department: '工程学院' },
    'History': { prefix: 'his_student', count: 3, department: '历史学院' },
    'Math': { prefix: 'math_student', count: 3, department: '数学学院' }
};

async function seedTestStudents() {
    console.log('🚀 开始创建测试学生账号...\n');

    try {
        // 先检查是否已有学生
        const [existing] = await pool.execute(
            "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
        );

        if (existing[0].count > 10) {
            console.log(`✅ 已有 ${existing[0].count} 名学生账号，跳过创建`);
            return;
        }

        const hashedPassword = await bcrypt.hash('123456', 10);
        let createdCount = 0;
        const createdStudents = [];

        for (const [discipline, config] of Object.entries(disciplineConfig)) {
            for (let i = 1; i <= config.count; i++) {
                const username = `${config.prefix}${i}`;
                const name = `${discipline === 'Computer Science' ? '计算机' :
                    discipline === 'Psychology' ? '心理' :
                        discipline === 'Business' ? '商科' :
                            discipline === 'Biology' ? '生物' :
                                discipline === 'Engineering' ? '工程' :
                                    discipline === 'History' ? '历史' : '数学'}学生${i}`;

                // 检查是否已存在
                const [check] = await pool.execute(
                    'SELECT id FROM users WHERE username = ?',
                    [username]
                );

                if (check.length === 0) {
                    const [result] = await pool.execute(
                        `INSERT INTO users (username, password, name, role, email, department, student_id, created_at) 
             VALUES (?, ?, ?, 'student', ?, ?, CONCAT('S', LPAD(?, 6, '0')), NOW())`,
                        [username, hashedPassword, name, `${username}@campus.edu`, config.department, createdCount + i]
                    );

                    createdStudents.push({
                        id: result.insertId,
                        username,
                        name,
                        discipline
                    });
                    createdCount++;
                    console.log(`✅ 创建学生: ${username} (${name}) - ${discipline}`);
                } else {
                    createdStudents.push({
                        id: check[0].id,
                        username,
                        discipline
                    });
                }
            }
        }

        console.log(`\n✨ 共创建/确认 ${createdCount} 名学生账号`);
        return createdStudents;

    } catch (error) {
        console.error('❌ 创建失败:', error.message);
        throw error;
    }
}

// 获取所有学生及其学科映射
async function getStudentDisciplineMapping() {
    const [rows] = await pool.execute(`
    SELECT id, username, name, department 
    FROM users 
    WHERE role = 'student'
  `);

    // 根据 department 判断学科
    const mapping = [];
    for (const student of rows) {
        let discipline = null;
        if (student.department === '计算机学院') discipline = 'Computer Science';
        else if (student.department === '心理学院') discipline = 'Psychology';
        else if (student.department === '商学院') discipline = 'Business';
        else if (student.department === '生物学院') discipline = 'Biology';
        else if (student.department === '工程学院') discipline = 'Engineering';
        else if (student.department === '历史学院') discipline = 'History';
        else if (student.department === '数学学院') discipline = 'Math';

        if (discipline) {
            mapping.push({ id: student.id, username: student.username, discipline });
        }
    }

    return mapping;
}

module.exports = { seedTestStudents, getStudentDisciplineMapping };

// 直接运行
if (require.main === module) {
    seedTestStudents()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}