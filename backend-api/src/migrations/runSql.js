const fs = require('fs');
const path = require('path');
const { createConnection } = require('./index');

/**
 * SQL 脚本执行器
 *
 * 用于执行种子脚本等一次性 SQL 文件，复用迁移器的自动建库连接。
 *
 * 用法: node src/migrations/runSql.js src/migrations/seed/seed_core_data.sql
 */

async function runSqlFile(file, options = {}) {
    const absPath = path.resolve(file);
    if (!fs.existsSync(absPath)) {
        throw new Error(`SQL 文件不存在: ${absPath}`);
    }

    const sql = fs.readFileSync(absPath, 'utf8');
    const connection = options.connection || (await createConnection());
    const ownConnection = !options.connection;

    try {
        await connection.query(sql);
        return { file: absPath, bytes: Buffer.byteLength(sql, 'utf8') };
    } finally {
        if (ownConnection) {
            await connection.end();
        }
    }
}

module.exports = { runSqlFile };

if (require.main === module) {
    const file = process.argv[2];
    if (!file) {
        console.error('用法: node src/migrations/runSql.js <sql文件>');
        process.exit(1);
    }

    runSqlFile(file)
        .then((r) => console.log(`✅ 已执行 ${path.basename(r.file)}`))
        .catch((err) => {
            console.error('❌ SQL 执行失败:', err.message);
            process.exit(1);
        });
}