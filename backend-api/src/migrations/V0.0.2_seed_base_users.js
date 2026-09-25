/**
 * V0.0.2 插入基础用户
 *
 * 为 V1.0.0 及种子数据提供外键引用所需的用户记录
 * 注意：id 显式指定为 1~5，种子脚本中依赖这些 id
 */

exports.up = async (connection) => {
    const users = [
        { id: 1, username: 'admin',    password: 'admin123',   real_name: '管理员', role: 'admin' },
        { id: 2, username: 'teacher1', password: 'teacher123', real_name: '张教授', role: 'teacher' },
        { id: 3, username: 'teacher2', password: 'teacher123', real_name: '李教授', role: 'teacher' },
        { id: 4, username: 'student1', password: 'student123', real_name: '王小明', role: 'student' },
        { id: 5, username: 'student2', password: 'student123', real_name: '李小红', role: 'student' }
    ];

    for (const u of users) {
        await connection.execute(
            `INSERT IGNORE INTO users (id, username, password, real_name, role) VALUES (?, ?, ?, ?, ?)`,
            [u.id, u.username, u.password, u.real_name, u.role]
        );
    }

    console.log(`  ✅ 已插入 ${users.length} 个基础用户`);
};

exports.down = async (connection) => {
    await connection.execute(
        'DELETE FROM users WHERE id IN (1, 2, 3, 4, 5)'
    );
    console.log('  🗑️  已删除基础用户');
};