const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const pool = require('../config/database');

// 获取用户通知列表
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;
    
    let query = `
      SELECT * FROM notifications 
      WHERE (user_id = ? OR target_role = ?)
    `;
    const params = [req.user.id, req.user.role];
    
    if (unreadOnly === 'true') {
      query += ' AND is_read = 0';
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;
    
    const [notifications] = await pool.execute(query, params);
    
    // 获取未读数量
    const [unreadCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE (user_id = ? OR target_role = ?) AND is_read = 0',
      [req.user.id, req.user.role]
    );
    
    res.json({ 
      success: true, 
      data: { 
        notifications, 
        unreadCount: unreadCount[0].count 
      } 
    });
  } catch (error) {
    console.error('获取通知错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 标记通知为已读
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    await pool.execute(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: '已标记为已读' });
  } catch (error) {
    console.error('标记已读错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 标记所有通知为已读
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    await pool.execute(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE (user_id = ? OR target_role = ?) AND is_read = 0',
      [req.user.id, req.user.role]
    );
    res.json({ success: true, message: '已全部标记为已读' });
  } catch (error) {
    console.error('标记全部已读错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 发送通知（管理员）
router.post('/', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { title, content, type, targetRole, targetUserId } = req.body;
    
    const [result] = await pool.execute(
      `INSERT INTO notifications (title, content, type, target_role, user_id, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [title, content, type, targetRole, targetUserId, req.user.id]
    );
    
    res.status(201).json({ success: true, message: '通知已发送', data: { notificationId: result.insertId } });
  } catch (error) {
    console.error('发送通知错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 删除通知
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: '通知已删除' });
  } catch (error) {
    console.error('删除通知错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取课前提醒设置
router.get('/reminder-settings', verifyToken, async (req, res) => {
  try {
    const [settings] = await pool.execute(
      'SELECT * FROM reminder_settings WHERE user_id = ?',
      [req.user.id]
    );
    
    res.json({ 
      success: true, 
      data: settings[0] || { 
        enabled: true, 
        minutesBefore: 10, 
        locationEnabled: true 
      } 
    });
  } catch (error) {
    console.error('获取提醒设置错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新课前提醒设置
router.put('/reminder-settings', verifyToken, async (req, res) => {
  try {
    const { enabled, minutesBefore, locationEnabled } = req.body;
    
    await pool.execute(
      `INSERT INTO reminder_settings (user_id, enabled, minutes_before, location_enabled, updated_at)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE enabled = ?, minutes_before = ?, location_enabled = ?, updated_at = NOW()`,
      [req.user.id, enabled, minutesBefore, locationEnabled, enabled, minutesBefore, locationEnabled]
    );
    
    res.json({ success: true, message: '设置已更新' });
  } catch (error) {
    console.error('更新提醒设置错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
