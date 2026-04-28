/**
 * 多角色测试账号初始化脚本
 * 运行方式: node src/scripts/seed-users.js
 */

const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const testUsers = [
  // 学生账号
  {
    username: 'student001',
    password: '123456',
    name: 'christie',
    role: 'student',
    email: 'zhangsan@campus.edu',
    phone: '13800138001',
    department: '计算机与软件学院',
    student_id: '2021001001',
    employee_id: null
  },
  {
    username: 'student002',
    password: '123456',
    name: '李四',
    role: 'student',
    email: 'lisi@campus.edu',
    phone: '13800138002',
    department: '计算机与软件学院',
    student_id: '2021001002',
    employee_id: null
  },
  {
    username: 'student003',
    password: '123456',
    name: '王五',
    role: 'student',
    email: 'wangwu@campus.edu',
    phone: '13800138003',
    department: '软件工程学院',
    student_id: '2021002001',
    employee_id: null
  },
  
  // 教师账号
  {
    username: 'teacher001',
    password: '123456',
    name: '王教授',
    role: 'teacher',
    email: 'wangprof@campus.edu',
    phone: '13900139001',
    department: '计算机与软件学院',
    student_id: null,
    employee_id: 'T2020001'
  },
  {
    username: 'teacher002',
    password: '123456',
    name: '李教授',
    role: 'teacher',
    email: 'liprof@campus.edu',
    phone: '13900139002',
    department: '软件工程学院',
    student_id: null,
    employee_id: 'T2020002'
  },
  
  // 管理员账号
  {
    username: 'admin',
    password: 'admin123',
    name: '系统管理员',
    role: 'admin',
    email: 'admin@campus.edu',
    phone: '13700137001',
    department: '信息中心',
    student_id: null,
    employee_id: 'A0001'
  }
];

async function seedUsers() {
  console.log('🚀 开始初始化多角色测试账号...\n');
  
  try {
    for (const user of testUsers) {
      // 检查用户是否已存在
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE username = ?',
        [user.username]
      );
      
      if (existing.length > 0) {
        console.log(`⏭️  用户 ${user.username} 已存在，跳过`);
        continue;
      }
      
      // 加密密码
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // 插入用户
      await pool.execute(
        `INSERT INTO users (username, password, name, role, email, phone, department, student_id, employee_id, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [user.username, hashedPassword, user.name, user.role, user.email, user.phone, user.department, user.student_id, user.employee_id]
      );
      
      const roleEmoji = { student: '🎓', teacher: '👨‍🏫', admin: '👨‍💼' }[user.role];
      console.log(`✅ ${roleEmoji} 创建用户: ${user.username} (${user.name}) - ${user.role}`);
    }
    
    console.log('\n✨ 多角色测试账号初始化完成！');
    console.log('\n📋 账号列表：');
    console.log('┌──────────────┬──────────────┬──────────────┬──────────────┐');
    console.log('│ 用户名       │ 密码         │ 姓名         │ 角色         │');
    console.log('├──────────────┼──────────────┼──────────────┼──────────────┤');
    console.log('│ student001   │ 123456       │ christie     │ 学生         │');
    console.log('│ student002   │ 123456       │ 李四         │ 学生         │');
    console.log('│ student003   │ 123456       │ 王五         │ 学生         │');
    console.log('│ teacher001   │ 123456       │ 王教授       │ 教师         │');
    console.log('│ teacher002   │ 123456       │ 李教授       │ 教师         │');
    console.log('│ admin        │ admin123     │ 系统管理员   │ 管理员       │');
    console.log('└──────────────┴──────────────┴──────────────┴──────────────┘');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
  } finally {
    process.exit(0);
  }
}

seedUsers();
