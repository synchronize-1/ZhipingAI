const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Security = require('../models/Security');
const Service = require('../models/Service');
const { verifyToken, checkRole } = require('../middleware/auth');

// 数据可视化仪表盘 - 获取综合数据
router.get('/overview', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const pool = require('../config/database');
    
    // 基础统计
    const [stats] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'teacher') as total_teachers,
        (SELECT COUNT(*) FROM courses) as total_courses,
        (SELECT COUNT(*) FROM rooms) as total_rooms,
        (SELECT COUNT(*) FROM activities WHERE status = 'upcoming') as upcoming_activities,
        (SELECT COUNT(*) FROM repairs WHERE status = 'pending') as pending_repairs
    `);
    
    res.json({ success: true, data: stats[0] });
  } catch (error) {
    console.error('获取概览数据错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 教室使用率统计
router.get('/room-usage', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    
    const usage = await Room.getUsageStatistics(start, end);
    res.json({ success: true, data: usage });
  } catch (error) {
    console.error('获取教室使用率错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 实时教室状态
router.get('/room-status', verifyToken, async (req, res) => {
  try {
    const status = await Room.getRealTimeStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('获取教室状态错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 能耗监测数据
router.get('/energy', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { period = 'day' } = req.query;
    const statistics = await Security.getEnergyStatistics(period);
    res.json({ success: true, data: statistics });
  } catch (error) {
    console.error('获取能耗数据错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 人流热力图数据
router.get('/heatmap', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const pool = require('../config/database');
    
    // 获取各区域人流数据
    const [heatmapData] = await pool.execute(`
      SELECT 
        location,
        latitude,
        longitude,
        COUNT(*) as count,
        HOUR(recorded_at) as hour
      FROM location_logs
      WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY location, latitude, longitude, HOUR(recorded_at)
      ORDER BY hour, count DESC
    `);
    
    // 食堂人流
    const canteenCrowd = await Service.getAllCanteenCrowdLevels();
    
    res.json({ 
      success: true, 
      data: { 
        locations: heatmapData,
        canteens: canteenCrowd
      } 
    });
  } catch (error) {
    console.error('获取热力图数据错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 网络负载数据
router.get('/network', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const pool = require('../config/database');
    
    const [networkData] = await pool.execute(`
      SELECT 
        building,
        AVG(bandwidth_usage) as avg_bandwidth,
        MAX(bandwidth_usage) as peak_bandwidth,
        AVG(latency) as avg_latency,
        recorded_at
      FROM network_logs
      WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY building, HOUR(recorded_at)
      ORDER BY recorded_at
    `);
    
    res.json({ success: true, data: networkData });
  } catch (error) {
    console.error('获取网络负载错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 出勤率统计
router.get('/attendance', verifyToken, checkRole('admin', 'teacher'), async (req, res) => {
  try {
    const pool = require('../config/database');
    const { startDate, endDate } = req.query;
    
    const [attendanceData] = await pool.execute(`
      SELECT 
        DATE(check_in_time) as date,
        COUNT(DISTINCT CASE WHEN status = 'present' THEN user_id END) as present,
        COUNT(DISTINCT CASE WHEN status = 'late' THEN user_id END) as late,
        COUNT(DISTINCT CASE WHEN status = 'absent' THEN user_id END) as absent
      FROM attendances
      WHERE check_in_time BETWEEN COALESCE(?, DATE_SUB(NOW(), INTERVAL 7 DAY)) AND COALESCE(?, NOW())
      GROUP BY DATE(check_in_time)
      ORDER BY date
    `, [startDate, endDate]);
    
    res.json({ success: true, data: attendanceData });
  } catch (error) {
    console.error('获取出勤统计错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 服务请求统计
router.get('/service-stats', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const pool = require('../config/database');
    
    const [repairStats] = await pool.execute(`
      SELECT 
        status,
        COUNT(*) as count,
        category
      FROM repairs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY status, category
    `);
    
    const [bookStats] = await pool.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM book_borrowings
      WHERE borrowed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY status
    `);
    
    res.json({ 
      success: true, 
      data: { 
        repairs: repairStats,
        books: bookStats
      } 
    });
  } catch (error) {
    console.error('获取服务统计错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
