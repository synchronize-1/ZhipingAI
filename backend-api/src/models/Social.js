const pool = require('../config/database');

class Social {
  // ========== 活动管理 ==========
  static async getActivities(page = 1, limit = 10, category = null, status = null) {
    const offset = (page - 1) * limit;
    let query = 'SELECT a.*, u.name as organizer_name FROM activities a LEFT JOIN users u ON a.organizer_id = u.id WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM activities WHERE 1=1';
    const params = [];
    
    if (category) {
      query += ' AND a.category = ?';
      countQuery += ' AND category = ?';
      params.push(category);
    }
    if (status) {
      query += ' AND a.status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
    }
    
    const countParams = [...params];
    const limitNum = parseInt(limit) || 10;
    const offsetNum = parseInt(offset) || 0;
    query += ` ORDER BY a.start_time DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
    
    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    
    return { data: rows, total: countResult[0].total, page, limit };
  }

  static async createActivity(activityData) {
    const { title, description, category, location, startTime, endTime, maxParticipants, organizerId, images } = activityData;
    
    const [result] = await pool.execute(
      `INSERT INTO activities (title, description, category, location, start_time, end_time, max_participants, organizer_id, images, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', NOW())`,
      [title, description, category, location, startTime, endTime, maxParticipants, organizerId, JSON.stringify(images)]
    );
    
    return result.insertId;
  }

  static async joinActivity(userId, activityId) {
    const [result] = await pool.execute(
      `INSERT INTO activity_participants (user_id, activity_id, joined_at, status)
       VALUES (?, ?, NOW(), 'joined')`,
      [userId, activityId]
    );
    return result.insertId;
  }

  static async getActivityParticipants(activityId) {
    const [rows] = await pool.execute(`
      SELECT u.id, u.name, u.avatar, u.department, ap.joined_at
      FROM activity_participants ap
      LEFT JOIN users u ON ap.user_id = u.id
      WHERE ap.activity_id = ? AND ap.status = 'joined'
      ORDER BY ap.joined_at
    `, [activityId]);
    return rows;
  }

  // ========== 兴趣小组 ==========
  static async getInterestGroups(category = null) {
    let query = `
      SELECT ig.*, u.name as creator_name,
             (SELECT COUNT(*) FROM group_members WHERE group_id = ig.id) as member_count
      FROM interest_groups ig
      LEFT JOIN users u ON ig.creator_id = u.id
      WHERE ig.status = 'active'
    `;
    const params = [];
    
    if (category) {
      query += ' AND ig.category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY member_count DESC, ig.created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async joinGroup(userId, groupId) {
    const [result] = await pool.execute(
      `INSERT INTO group_members (user_id, group_id, joined_at, role)
       VALUES (?, ?, NOW(), 'member')`,
      [userId, groupId]
    );
    return result.insertId;
  }

  static async getGroupMembers(groupId) {
    const [rows] = await pool.execute(`
      SELECT u.id, u.name, u.avatar, gm.role, gm.joined_at
      FROM group_members gm
      LEFT JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
      ORDER BY gm.role DESC, gm.joined_at
    `, [groupId]);
    return rows;
  }

  // ========== 学生成长档案 ==========
  static async getStudentGrowthRecord(studentId) {
    // 学业记录
    const [academicRecords] = await pool.execute(`
      SELECT semester, AVG(score) as avg_score, COUNT(*) as course_count
      FROM grades
      WHERE student_id = ?
      GROUP BY semester
      ORDER BY semester
    `, [studentId]);
    
    // 活动参与记录
    const [activityRecords] = await pool.execute(`
      SELECT a.category, COUNT(*) as count
      FROM activity_participants ap
      LEFT JOIN activities a ON ap.activity_id = a.id
      WHERE ap.user_id = ? AND ap.status = 'joined'
      GROUP BY a.category
    `, [studentId]);
    
    // 技能标签
    const [skills] = await pool.execute(`
      SELECT skill_name, level, verified_at
      FROM student_skills
      WHERE student_id = ?
      ORDER BY level DESC
    `, [studentId]);
    
    // 荣誉奖项
    const [honors] = await pool.execute(`
      SELECT * FROM student_honors
      WHERE student_id = ?
      ORDER BY awarded_at DESC
    `, [studentId]);
    
    // 心理健康记录（概要）
    const [mentalHealth] = await pool.execute(`
      SELECT assessment_date, overall_score, stress_level
      FROM mental_health_records
      WHERE student_id = ?
      ORDER BY assessment_date DESC
      LIMIT 5
    `, [studentId]);
    
    return {
      academic: academicRecords,
      activities: activityRecords,
      skills,
      honors,
      mentalHealth
    };
  }

  // ========== 情感化交互 ==========
  static async getEmotionalGreeting(userId) {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    // 获取用户信息
    const [user] = await pool.execute('SELECT name, role FROM users WHERE id = ?', [userId]);
    const userName = user[0]?.name || '同学';
    
    // 时间问候
    let timeGreeting;
    if (hour < 6) timeGreeting = '夜深了，注意休息哦';
    else if (hour < 9) timeGreeting = '早上好';
    else if (hour < 12) timeGreeting = '上午好';
    else if (hour < 14) timeGreeting = '中午好，记得吃饭';
    else if (hour < 18) timeGreeting = '下午好';
    else if (hour < 22) timeGreeting = '晚上好';
    else timeGreeting = '夜深了，早点休息';
    
    // 节日问候
    const [festivals] = await pool.execute(`
      SELECT * FROM festivals 
      WHERE month = ? AND day = ?
      LIMIT 1
    `, [month, day]);
    
    // 学习鼓励
    const encouragements = [
      '今天也要加油哦！💪',
      '每一步努力都算数！',
      '坚持就是胜利！',
      '你是最棒的！✨',
      '相信自己，你可以的！'
    ];
    
    return {
      greeting: `${timeGreeting}，${userName}！`,
      festival: festivals[0] || null,
      encouragement: encouragements[Math.floor(Math.random() * encouragements.length)]
    };
  }
}

module.exports = Social;
