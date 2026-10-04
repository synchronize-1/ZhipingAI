const pool = require('../config/database');

// 从连接池取连接执行 fn(conn)，成功提交、失败回滚后抛出
async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    try {
      await conn.rollback();
    } catch (rollbackError) {
      console.error('[TRANSACTION] 回滚失败:', rollbackError);
    }
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = { withTransaction };