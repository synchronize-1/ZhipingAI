/**
 * V1.0.1 为用户表补充班级关联字段
 *
 * 背景：V1.0.0 迁移创建了 classes 表，但 users 表未同步补充 class_id 字段，
 * 导致用户列表、班级筛选、成绩导入等依赖 u.class_id 的查询报错
 * Unknown column 'u.class_id' in 'field list'。
 *
 * 本次迁移：
 * - users 表新增 class_id 字段（学生所属班级）
 * - 新增索引 idx_class_id
 * - 新增外键约束（classes.id，删除班级时置空）
 */

exports.up = async (connection) => {
  const [columns] = await connection.execute(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'class_id'`
  );

  if (columns.length > 0) {
    console.log('  ℹ️  users.class_id 已存在，跳过');
    return;
  }

  await connection.execute(
    `ALTER TABLE users
     ADD COLUMN class_id INT DEFAULT NULL COMMENT '所属班级ID（学生）' AFTER employee_id`
  );

  const [indexes] = await connection.execute(
    `SELECT INDEX_NAME FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_class_id'`
  );
  if (indexes.length === 0) {
    await connection.execute('ALTER TABLE users ADD INDEX idx_class_id (class_id)');
  }

  const [fks] = await connection.execute(
    `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
       AND CONSTRAINT_NAME = 'fk_users_class'`
  );
  if (fks.length === 0) {
    await connection.execute(
      `ALTER TABLE users
       ADD CONSTRAINT fk_users_class FOREIGN KEY (class_id)
       REFERENCES classes(id) ON DELETE SET NULL`
    );
  }

  console.log('  ✅ users.class_id 字段、索引、外键已添加');
};

exports.down = async (connection) => {
  const [fks] = await connection.execute(
    `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
       AND CONSTRAINT_NAME = 'fk_users_class'`
  );
  if (fks.length > 0) {
    await connection.execute('ALTER TABLE users DROP FOREIGN KEY fk_users_class');
  }

  const [columns] = await connection.execute(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'class_id'`
  );
  if (columns.length > 0) {
    await connection.execute('ALTER TABLE users DROP COLUMN class_id');
  }

  console.log('  ✅ users.class_id 已移除');
};