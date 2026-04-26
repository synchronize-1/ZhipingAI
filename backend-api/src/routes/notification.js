// backend-api/src/routes/notifications.js
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

        const userId = req.user.id;
        const userRole = req.user.role;

        let query = '';
        let params = [];

        // 管理员：查看所有通知（不限角色）
        if (userRole === 'admin') {
            query = `SELECT * FROM notifications WHERE 1=1`;
            params = [];
        } else {
            // 学生/教师：查看发给自己的通知（user_id匹配）或角色匹配的通知
            query = `SELECT * FROM notifications WHERE (user_id = ? OR target_role = ? OR target_role = 'all')`;
            params = [userId, userRole];
        }

        if (unreadOnly === 'true') {
            query += ' AND is_read = 0';
        }

        query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

        const [notifications] = await pool.execute(query, params);

        // 获取未读数量（使用相同条件）
        let countQuery = '';
        let countParams = [];

        if (userRole === 'admin') {
            countQuery = `SELECT COUNT(*) as count FROM notifications WHERE 1=1`;
            countParams = [];
        } else {
            countQuery = `SELECT COUNT(*) as count FROM notifications WHERE (user_id = ? OR target_role = ? OR target_role = 'all') AND is_read = 0`;
            countParams = [userId, userRole];
        }

        const [unreadCount] = await pool.execute(countQuery, countParams);

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
            'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND (user_id = ? OR target_role = ? OR target_role = "all")',
            [req.params.id, req.user.id, req.user.role]
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
        const userId = req.user.id;
        const userRole = req.user.role;

        let query = '';
        let params = [];

        if (userRole === 'admin') {
            query = 'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE is_read = 0';
            params = [];
        } else {
            query = 'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE (user_id = ? OR target_role = ? OR target_role = "all") AND is_read = 0';
            params = [userId, userRole];
        }

        await pool.execute(query, params);
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

        // 将 undefined 转换为 null，避免 MySQL 绑定错误
        const safeTargetUserId = targetUserId !== undefined ? targetUserId : null;
        const safeTargetRole = targetRole !== undefined ? targetRole : null;

        const [result] = await pool.execute(
            `INSERT INTO notifications (title, content, type, target_role, user_id, created_by, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [title, content, type, safeTargetRole, safeTargetUserId, req.user.id]
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
        const userId = req.user.id;
        const userRole = req.user.role;

        let query = '';
        let params = [];

        if (userRole === 'admin') {
            query = 'DELETE FROM notifications WHERE id = ?';
            params = [req.params.id];
        } else {
            query = 'DELETE FROM notifications WHERE id = ? AND user_id = ?';
            params = [req.params.id, userId];
        }

        await pool.execute(query, params);
        res.json({ success: true, message: '通知已删除' });
    } catch (error) {
        console.error('删除通知错误:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

module.exports = router;