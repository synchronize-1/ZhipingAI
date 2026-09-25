const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * 数据库迁移运行器
 *
 * 功能：
 * 1. 自动创建目标数据库（如果不存在）
 * 2. 读取 migrations 目录下的所有迁移文件
 * 3. 记录已执行的迁移（schema_migrations 表）
 * 4. 按版本号顺序执行未执行的迁移
 * 5. 支持 up/down 迁移
 */

// 从迁移文件名中提取版本号和名称
function parseMigrationFilename(filename) {
    const match = filename.match(/^(V\d+\.\d+\.\d+)_(.+)\.js$/);
    if (!match) return null;
    return {
        version: match[1],
        name: match[2],
        filename: filename
    };
}

// 版本号比较函数
function compareVersions(a, b) {
    const parseVersion = (v) => v.replace('V', '').split('.').map(Number);
    const [aMajor, aMinor, aPatch] = parseVersion(a);
    const [bMajor, bMinor, bPatch] = parseVersion(b);
    if (aMajor !== bMajor) return aMajor - bMajor;
    if (aMinor !== bMinor) return aMinor - bMinor;
    return aPatch - bPatch;
}

/**
 * 创建数据库连接（自动建库）
 * 先以无 database 的方式连接，CREATE DATABASE IF NOT EXISTS，再 USE 目标库
 */
async function createConnection() {
    const dbName = process.env.DB_NAME || 'smart_campus';

    // 1. 不带 database 连接，用于建库
    const bootstrapConnection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '123456',
        multipleStatements: true
    });

    try {
        await bootstrapConnection.execute(
            `CREATE DATABASE IF NOT EXISTS \`${dbName}\`
       DEFAULT CHARACTER SET utf8mb4
       DEFAULT COLLATE utf8mb4_unicode_ci`
        );
        console.log(`🗄️  数据库 \`${dbName}\` 已就绪`);
    } finally {
        await bootstrapConnection.end();
    }

    // 2. 连接目标库
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '123456',
        database: dbName,
        multipleStatements: true
    });
    return connection;
}

// 确保 schema_migrations 表存在
async function ensureMigrationsTable(connection) {
    await connection.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(50) PRIMARY KEY COMMENT '迁移版本号，如 V1.0.0',
      name VARCHAR(100) COMMENT '迁移名称',
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '执行时间'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据库迁移记录表'
  `);
}

// 获取所有已执行的迁移版本
async function getExecutedMigrations(connection) {
    const [rows] = await connection.execute(
        'SELECT version, name, executed_at FROM schema_migrations ORDER BY version'
    );
    return rows;
}

// 获取所有迁移文件
function getMigrationFiles(migrationsDir) {
    const files = fs.readdirSync(migrationsDir);
    const migrations = [];

    for (const file of files) {
        const parsed = parseMigrationFilename(file);
        if (parsed) {
            const migrationModule = require(path.join(migrationsDir, file));
            migrations.push({
                ...parsed,
                up: migrationModule.up,
                down: migrationModule.down
            });
        }
    }

    migrations.sort((a, b) => compareVersions(a.version, b.version));
    return migrations;
}

// 记录迁移执行
async function recordMigration(connection, version, name) {
    await connection.execute(
        'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
        [version, name]
    );
}

// 删除迁移记录（回滚时）
async function removeMigrationRecord(connection, version) {
    await connection.execute(
        'DELETE FROM schema_migrations WHERE version = ?',
        [version]
    );
}

/**
 * 执行所有未执行的迁移（up）
 */
async function runMigrations(options = {}) {
    const migrationsDir = options.migrationsDir || path.join(__dirname);
    let connection = options.connection;
    let ownConnection = false;

    try {
        if (!connection) {
            connection = await createConnection();
            ownConnection = true;
        }

        console.log('📦 开始执行数据库迁移...\n');

        await ensureMigrationsTable(connection);

        const allMigrations = getMigrationFiles(migrationsDir);
        if (allMigrations.length === 0) {
            console.log('⚠️  未找到迁移文件');
            return [];
        }

        const executed = await getExecutedMigrations(connection);
        const executedVersions = new Set(executed.map((m) => m.version));

        const pendingMigrations = allMigrations.filter(
            (m) => !executedVersions.has(m.version)
        );

        if (pendingMigrations.length === 0) {
            console.log('✅ 所有迁移已执行，数据库已是最新版本');
            return [];
        }

        console.log(`📋 发现 ${pendingMigrations.length} 个待执行迁移：`);
        pendingMigrations.forEach((migration, index) => {
            console.log(`   ${index + 1}. ${migration.version} - ${migration.name}`);
        });
        console.log('');

        const executedList = [];
        for (const migration of pendingMigrations) {
            console.log(`⏳ 执行迁移: ${migration.version} - ${migration.name}`);

            try {
                await migration.up(connection);
                await recordMigration(connection, migration.version, migration.name);
                executedList.push(migration);
                console.log(`✅ 迁移完成: ${migration.version}`);
            } catch (err) {
                console.error(`❌ 迁移失败: ${migration.version}`);
                console.error(`   错误: ${err.message}`);
                throw err;
            }
        }

        console.log(`\n🎉 迁移完成！共执行 ${executedList.length} 个迁移`);
        return executedList;
    } finally {
        if (ownConnection && connection) {
            await connection.end();
        }
    }
}

/**
 * 回滚指定版本的迁移（down）
 */
async function rollbackMigrations(targetVersion, options = {}) {
    const migrationsDir = options.migrationsDir || path.join(__dirname);
    let connection = options.connection;
    let ownConnection = false;

    try {
        if (!connection) {
            connection = await createConnection();
            ownConnection = true;
        }

        console.log('⏪ 开始回滚数据库迁移...\n');

        await ensureMigrationsTable(connection);

        const allMigrations = getMigrationFiles(migrationsDir);
        const executed = await getExecutedMigrations(connection);
        const executedVersions = new Set(executed.map((m) => m.version));

        const toRollback = allMigrations.filter(
            (m) =>
                executedVersions.has(m.version) &&
                compareVersions(m.version, targetVersion) > 0
        );

        toRollback.sort((a, b) => compareVersions(b.version, a.version));

        if (toRollback.length === 0) {
            console.log(`✅ 没有需要回滚的迁移（目标版本: ${targetVersion}）`);
            return [];
        }

        console.log(`📋 将回滚 ${toRollback.length} 个迁移：`);
        toRollback.forEach((migration, index) => {
            console.log(`   ${index + 1}. ${migration.version} - ${migration.name}`);
        });
        console.log('');

        const rolledBack = [];
        for (const migration of toRollback) {
            console.log(`⏳ 回滚迁移: ${migration.version} - ${migration.name}`);

            try {
                await migration.down(connection);
                await removeMigrationRecord(connection, migration.version);
                rolledBack.push(migration);
                console.log(`✅ 回滚完成: ${migration.version}`);
            } catch (err) {
                console.error(`❌ 回滚失败: ${migration.version}`);
                console.error(`   错误: ${err.message}`);
                throw err;
            }
        }

        console.log(`\n🎉 回滚完成！共回滚 ${rolledBack.length} 个迁移`);
        return rolledBack;
    } finally {
        if (ownConnection && connection) {
            await connection.end();
        }
    }
}

/**
 * 获取当前数据库迁移状态
 */
async function getMigrationStatus(options = {}) {
    const migrationsDir = options.migrationsDir || path.join(__dirname);
    const connection = options.connection || (await createConnection());
    const ownConnection = !options.connection;

    try {
        await ensureMigrationsTable(connection);
        const allMigrations = getMigrationFiles(migrationsDir);
        const executed = await getExecutedMigrations(connection);
        const executedVersions = new Set(executed.map((m) => m.version));

        const pending = allMigrations.filter((m) => !executedVersions.has(m.version));
        const applied = allMigrations.filter((m) => executedVersions.has(m.version));

        return {
            total: allMigrations.length,
            applied: applied.length,
            pending: pending.length,
            currentVersion: applied.length > 0 ? applied[applied.length - 1].version : null,
            pendingMigrations: pending,
            appliedMigrations: applied
        };
    } finally {
        if (ownConnection) {
            await connection.end();
        }
    }
}

module.exports = {
    runMigrations,
    rollbackMigrations,
    getMigrationStatus,
    createConnection
};

// 如果直接运行此文件，则执行所有迁移
if (require.main === module) {
    runMigrations().catch((err) => {
        console.error('迁移执行失败:', err);
        process.exit(1);
    });
}