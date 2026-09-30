// backend-api/src/models/Service.model.js
const pool = require('../config/database');

class Service {
  // ========== 图书借阅 ==========
    static async getBooks(page = 1, limit = 10, keyword = null, category = null) {
        try {
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 10;
            const offset = (pageNum - 1) * limitNum;

            let query = 'SELECT * FROM books WHERE 1=1';
            let countQuery = 'SELECT COUNT(*) as total FROM books WHERE 1=1';
            const params = [];
            const countParams = [];

            if (keyword && keyword.trim()) {
                query += ' AND (title LIKE ? OR author LIKE ?)';
                countQuery += ' AND (title LIKE ? OR author LIKE ?)';
                const likePattern = `%${keyword.trim()}%`;
                params.push(likePattern, likePattern);
                countParams.push(likePattern, likePattern);
            }

            if (category && category.trim()) {
                query += ' AND category = ?';
                countQuery += ' AND category = ?';
                params.push(category.trim());
                countParams.push(category.trim());
            }

            // 修复：使用 LIMIT ?, ? 语法（MySQL 标准语法）
            query += ' ORDER BY created_at DESC LIMIT ?, ?';
            // 参数顺序：LIMIT offset, limitNum
            params.push(offset, limitNum);

            console.log('SQL Query:', query);
            console.log('Params:', params);

            // 使用 query 方法而不是 execute（execute 对 LIMIT 参数有时会有问题）
            const [rows] = await pool.query(query, params);
            const [countResult] = await pool.query(countQuery, countParams);

            return {
                data: rows,
                total: countResult[0]?.total || 0,
                page: pageNum,
                limit: limitNum
            };
        } catch (error) {
            console.error('getBooks 错误:', error);
            // 返回空数据，避免前端崩溃
            return {
                data: [],
                total: 0,
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10
            };
        }
    }

  static async borrowBook(userId, bookId) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30天借阅期
    
    const [result] = await pool.execute(
      `INSERT INTO book_borrowings (user_id, book_id, borrowed_at, due_date, status)
       VALUES (?, ?, NOW(), ?, 'borrowed')`,
      [userId, bookId, dueDate]
    );
    
    // 更新图书库存
    await pool.execute('UPDATE books SET available_count = available_count - 1 WHERE id = ?', [bookId]);
    
    return result.insertId;
  }

  static async returnBook(borrowingId) {
    await pool.execute(
      'UPDATE book_borrowings SET returned_at = NOW(), status = "returned" WHERE id = ?',
      [borrowingId]
    );
    
    // 更新图书库存
    const [borrowing] = await pool.execute('SELECT book_id FROM book_borrowings WHERE id = ?', [borrowingId]);
    if (borrowing[0]) {
      await pool.execute('UPDATE books SET available_count = available_count + 1 WHERE id = ?', [borrowing[0].book_id]);
    }
  }

  // ========== 食堂服务 ==========
  static async getCanteens() {
    const [rows] = await pool.execute('SELECT * FROM canteens ORDER BY name');
    return rows;
  }

  static async getCanteenCrowdLevel(canteenId) {
    // 模拟获取食堂人流数据
    const [rows] = await pool.execute(`
      SELECT c.*, 
             COALESCE(cl.current_count, 0) as current_count,
             ROUND(COALESCE(cl.current_count, 0) * 100.0 / c.capacity, 0) as crowd_level
      FROM canteens c
      LEFT JOIN canteen_crowd_logs cl ON c.id = cl.canteen_id 
        AND cl.recorded_at = (SELECT MAX(recorded_at) FROM canteen_crowd_logs WHERE canteen_id = c.id)
      WHERE c.id = ?
    `, [canteenId]);
    
    return rows[0];
  }

  static async getAllCanteenCrowdLevels() {
    const [rows] = await pool.execute(`
      SELECT c.*, 
             COALESCE(cl.current_count, 0) as current_count,
             ROUND(COALESCE(cl.current_count, 0) * 100.0 / c.capacity, 0) as crowd_level
      FROM canteens c
      LEFT JOIN (
        SELECT canteen_id, current_count, recorded_at,
               ROW_NUMBER() OVER (PARTITION BY canteen_id ORDER BY recorded_at DESC) as rn
        FROM canteen_crowd_logs
      ) cl ON c.id = cl.canteen_id AND cl.rn = 1
      ORDER BY c.name
    `);
    
    return rows;
  }

  // ========== 在线点餐 ==========
  static async getMenuItems(canteenId, category = null) {
    let query = 'SELECT * FROM menu_items WHERE canteen_id = ? AND is_available = 1';
    const params = [canteenId];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY category, name';
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async createOrder(userId, canteenId, items, totalPrice, pickupTime) {
    const [result] = await pool.execute(
      `INSERT INTO food_orders (user_id, canteen_id, items, total_price, pickup_time, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
      [userId, canteenId, JSON.stringify(items), totalPrice, pickupTime]
    );
    
    return result.insertId;
  }
}

module.exports = Service;
