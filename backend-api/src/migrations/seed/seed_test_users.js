/**
 * 测试账号种子脚本
 *
 * 用法: node src/migrations/seed/seed_test_users.js
 *
 * 前置：
 *   1. node src/migrations/index.js          （建表 + 补 class_id 字段）
 *   2. node src/migrations/seed/seed_core_data.js （学科/班级/考试基础数据）
 *
 * 生成内容：
 *   - 8 个教师账号（teacher1~teacher8），工号 T2024001~T2024008
 *   - 50 个学生账号，分布于 5 个班级，学号 2024XXNN
 *   - 所有测试账号密码统一为 123456
 *
 * 幂等：重复执行只会补齐缺失账号，不会重复插入
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { createConnection: createAutoConnection } = require('../index');

const TEST_PASSWORD = '123456';

const TEACHERS = [
  { username: 'teacher1', name: '张教授', department: '语文组', employeeId: 'T2024001' },
  { username: 'teacher2', name: '李教授', department: '数学组', employeeId: 'T2024002' },
  { username: 'teacher3', name: '王老师', department: '英语组', employeeId: 'T2024003' },
  { username: 'teacher4', name: '赵老师', department: '物理组', employeeId: 'T2024004' },
  { username: 'teacher5', name: '陈老师', department: '化学组', employeeId: 'T2024005' },
  { username: 'teacher6', name: '刘老师', department: '生物组', employeeId: 'T2024006' },
  { username: 'teacher7', name: '孙老师', department: '历史组', employeeId: 'T2024007' },
  { username: 'teacher8', name: '周老师', department: '体育组', employeeId: 'T2024008' }
];

// 班级 ID -> 学号前缀（2024 + 班级序号两位）
const CLASS_IDS = [1, 2, 3, 4, 5];

const SURNAMES = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
  '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗',
  '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹'];
const GIVEN_NAMES = ['小明', '小红', '志强', '思远', '雨欣', '浩然', '子涵', '佳怡', '宇航', '欣怡',
  '梓萱', '俊杰', '诗涵', '嘉豪', '雨桐', '泽宇', '晨曦', '雅静', '一鸣', '梦琪',
  '博文', '若曦', '天佑', '静怡', '明轩', '紫萱', '子豪', '悦心', '昊天', '嘉怡'];

function buildStudentName(classIndex, seq) {
  const s = SURNAMES[(classIndex * 7 + seq) % SURNAMES.length];
  const g = GIVEN_NAMES[(classIndex * 5 + seq * 3) % GIVEN_NAMES.length];
  return s + g;
}

async function seedTestUsers() {
  const connection = await createAutoConnection();

  try {
    console.log('🌱 开始生成测试账号...\n');
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

    // ============================================
    // 1. 教师账号
    // ============================================
    console.log('👨‍🏫 生成教师账号...');
    let teacherInserted = 0;
    let teacherUpdated = 0;

    for (const t of TEACHERS) {
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE username = ?',
        [t.username]
      );

      if (existing.length > 0) {
        await connection.execute(
          `UPDATE users SET name = ?, role = 'teacher', department = ?, employee_id = ?,
                            password = ?, status = 1, updated_at = NOW()
           WHERE id = ?`,
          [t.name, t.department, t.employeeId, hashedPassword, existing[0].id]
        );
        teacherUpdated++;
      } else {
        await connection.execute(
          `INSERT INTO users (username, password, name, role, department, employee_id, status, created_at)
           VALUES (?, ?, ?, 'teacher', ?, ?, 1, NOW())`,
          [t.username, hashedPassword, t.name, t.department, t.employeeId]
        );
        teacherInserted++;
      }
    }
    console.log(`   ✅ 教师：新增 ${teacherInserted}，更新 ${teacherUpdated}\n`);

    // ============================================
    // 2. 学生账号
    // ============================================
    console.log('👨‍🎓 生成学生账号（每班 10 人，共 5 个班）...');

    // 已存在的学生（student1/student2）归入高一(1)班，保留原用户名
    const legacyStudents = [
      { username: 'student1', studentId: '20240101' },
      { username: 'student2', studentId: '20240102' }
    ];
    for (const s of legacyStudents) {
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE username = ?',
        [s.username]
      );
      if (existing.length > 0) {
        await connection.execute(
          `UPDATE users SET role = 'student', class_id = 1, student_id = ?, password = ?,
                            status = 1, updated_at = NOW()
           WHERE id = ?`,
          [s.studentId, hashedPassword, existing[0].id]
        );
      } else {
        await connection.execute(
          `INSERT INTO users (username, password, name, role, class_id, student_id, status, created_at)
           VALUES (?, ?, ?, 'student', 1, ?, 1, NOW())`,
          [s.username, hashedPassword, s.username === 'student1' ? '王小明' : '李小红', s.studentId]
        );
      }
    }

    // 其余学生：用户名 = 学号
    let studentInserted = 0;
    let studentUpdated = 0;
    const classStudentCount = {};

    for (const classId of CLASS_IDS) {
      classStudentCount[classId] = 0;
      const startSeq = classId === 1 ? 3 : 1; // 1 班前两位已被 student1/student2 占用

      for (let seq = startSeq; seq <= 10; seq++) {
        const studentId = `2024${String(classId).padStart(2, '0')}${String(seq).padStart(2, '0')}`;
        const name = buildStudentName(classId, seq);

        const [existing] = await connection.execute(
          'SELECT id FROM users WHERE username = ?',
          [studentId]
        );

        if (existing.length > 0) {
          await connection.execute(
            `UPDATE users SET name = ?, role = 'student', class_id = ?, student_id = ?,
                              password = ?, status = 1, updated_at = NOW()
             WHERE id = ?`,
            [name, classId, studentId, hashedPassword, existing[0].id]
          );
          studentUpdated++;
        } else {
          await connection.execute(
            `INSERT INTO users (username, password, name, role, class_id, student_id, status, created_at)
             VALUES (?, ?, ?, 'student', ?, ?, 1, NOW())`,
            [studentId, hashedPassword, name, classId, studentId]
          );
          studentInserted++;
        }
        classStudentCount[classId]++;
      }
      // 1 班额外计入 legacy 的 2 人
      if (classId === 1) classStudentCount[classId] += 2;
    }
    console.log(`   ✅ 学生：新增 ${studentInserted}，更新 ${studentUpdated}\n`);

    // ============================================
    // 3. 同步班级学生人数
    // ============================================
    console.log('🔢 同步班级学生人数...');
    for (const classId of CLASS_IDS) {
      const [countRows] = await connection.execute(
        `SELECT COUNT(*) AS cnt FROM users WHERE role = 'student' AND class_id = ?`,
        [classId]
      );
      await connection.execute(
        'UPDATE classes SET student_count = ?, updated_at = NOW() WHERE id = ?',
        [countRows[0].cnt, classId]
      );
    }
    console.log('   ✅ 班级人数已同步\n');

    // ============================================
    // 4. 汇总
    // ============================================
    const [summary] = await connection.execute(
      `SELECT role, COUNT(*) AS cnt FROM users GROUP BY role`
    );
    console.log('📊 账号汇总：');
    summary.forEach((r) => console.log(`   ${r.role}: ${r.cnt}`));

    const [perClass] = await connection.execute(
      `SELECT c.id, c.name, COUNT(u.id) AS cnt
       FROM classes c LEFT JOIN users u ON u.class_id = c.id AND u.role = 'student'
       GROUP BY c.id, c.name ORDER BY c.id`
    );
    console.log('\n📊 各班级学生数：');
    perClass.forEach((r) => console.log(`   ${r.name}: ${r.cnt} 人`));

    console.log(`\n🎉 测试账号生成完成！统一密码：${TEST_PASSWORD}`);
  } finally {
    await connection.end();
  }
}

seedTestUsers().catch((err) => {
  console.error('❌ 测试账号生成失败:', err);
  process.exit(1);
});