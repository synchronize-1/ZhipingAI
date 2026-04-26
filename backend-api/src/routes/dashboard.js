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
        (SELECT COUNT(*) FROM activities WHERE status = 'upcoming') as upcoming_activities
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

// GET /api/dashboard/ai-stats - AI使用统计
// 添加 AI 健康统计接口
router.get('/ai-stats', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const pool = require('../config/database');

        // 今日活跃 AI 用户
        const [activeUsers] = await pool.execute(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM ai_usage_logs
      WHERE session_date = CURDATE()
    `);

        // 总学生数
        const [totalStudents] = await pool.execute(`
      SELECT COUNT(*) as count FROM users WHERE role = 'student'
    `);

        // AI 工具覆盖率
        const coverage = totalStudents[0]?.count > 0
            ? (activeUsers[0]?.count / totalStudents[0]?.count * 100).toFixed(1)
            : 0;

        // 周 AI 使用时长
        const [weeklyUsage] = await pool.execute(`
      SELECT SUM(session_length_min) / 60 as total_hours
      FROM ai_usage_logs
      WHERE session_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `);

        // 平均依赖指数
        const [avgDependence] = await pool.execute(`
      SELECT AVG(dependence_score) as avg_score
      FROM ai_survey_responses
    `);
        // 或者从 users 表获取
        // SELECT AVG(dependence_score) as avg_score FROM users WHERE role = 'student' AND dependence_score IS NOT NULL

        res.json({
            success: true,
            data: {
                todayActiveAIUsers: activeUsers[0]?.count || 0,
                aiToolCoverage: parseFloat(coverage),
                aiUsageHoursWeekly: Math.round(weeklyUsage[0]?.total_hours || 0),
                avgDependenceScore: Math.round(avgDependence[0]?.avg_score || 58)
            }
        });
    } catch (error) {
        console.error('获取 AI 统计错误:', error);
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

module.exports = router;
