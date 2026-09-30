const pool = require('../config/database');

const BASE_SELECT = `
  SELECT
    t.id,
    t.semester,
    t.class_id       AS classId,
    c.name           AS className,
    c.grade          AS grade,
    t.subject_id     AS subjectId,
    s.name           AS subjectName,
    t.teacher_id     AS teacherId,
    u.name           AS teacherName,
    t.room_id        AS roomId,
    r.name           AS roomName,
    r.building       AS building,
    t.day_of_week    AS dayOfWeek,
    t.period,
    t.start_time     AS startTime,
    t.end_time       AS endTime,
    t.week_start     AS weekStart,
    t.week_end       AS weekEnd,
    t.note,
    t.created_at     AS createdAt
  FROM timetable_entries t
  INNER JOIN classes  c ON t.class_id = c.id
  INNER JOIN subjects s ON t.subject_id = s.id
  INNER JOIN users    u ON t.teacher_id = u.id
  LEFT  JOIN rooms    r ON t.room_id = r.id
`;

class TimetableEntry {
  static async findById(id) {
    const [rows] = await pool.execute(`${BASE_SELECT} WHERE t.id = ?`, [id]);
    return rows[0];
  }

  // 按学期 + 班级 / 教师 / 教室 查询整周课表
  static async findWeekEntries({ semester, classId, teacherId, roomId }) {
    const where = ['t.semester = ?'];
    const params = [semester];

    if (classId) {
      where.push('t.class_id = ?');
      params.push(classId);
    }
    if (teacherId) {
      where.push('t.teacher_id = ?');
      params.push(teacherId);
    }
    if (roomId) {
      where.push('t.room_id = ?');
      params.push(roomId);
    }

    const [rows] = await pool.execute(
      `${BASE_SELECT} WHERE ${where.join(' AND ')} ORDER BY t.day_of_week, t.period`,
      params
    );
    return rows;
  }

  // 冲突查询：同学期同「星期+节次」下，班级 / 教师 / 教室 是否已被占用
  static async findConflicts({ semester, classId, teacherId, roomId, dayOfWeek, period, excludeId }) {
    const where = ['t.semester = ?', 't.day_of_week = ?', 't.period = ?'];
    const params = [semester, dayOfWeek, period];

    if (excludeId) {
      where.push('t.id <> ?');
      params.push(excludeId);
    }

    const ors = ['t.class_id = ?'];
    params.push(classId);
    if (teacherId) {
      ors.push('t.teacher_id = ?');
      params.push(teacherId);
    }
    if (roomId) {
      ors.push('t.room_id = ?');
      params.push(roomId);
    }

    const [rows] = await pool.execute(
      `${BASE_SELECT} WHERE ${where.join(' AND ')} AND (${ors.join(' OR ')})`,
      params
    );
    return rows;
  }

  static async create(data) {
    const {
      semester, classId, subjectId, teacherId, roomId,
      dayOfWeek, period, startTime, endTime, weekStart, weekEnd, note, createdBy
    } = data;

    const [result] = await pool.execute(
      `INSERT INTO timetable_entries
         (semester, class_id, subject_id, teacher_id, room_id, day_of_week, period,
          start_time, end_time, week_start, week_end, note, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [semester, classId, subjectId, teacherId, roomId || null, dayOfWeek, period,
        startTime, endTime, weekStart, weekEnd, note || null, createdBy || null]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const {
      semester, classId, subjectId, teacherId, roomId,
      dayOfWeek, period, startTime, endTime, weekStart, weekEnd, note
    } = data;

    await pool.execute(
      `UPDATE timetable_entries
       SET semester = ?, class_id = ?, subject_id = ?, teacher_id = ?, room_id = ?,
           day_of_week = ?, period = ?, start_time = ?, end_time = ?,
           week_start = ?, week_end = ?, note = ?, updated_at = NOW()
       WHERE id = ?`,
      [semester, classId, subjectId, teacherId, roomId || null, dayOfWeek, period,
        startTime, endTime, weekStart, weekEnd, note || null, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM timetable_entries WHERE id = ?', [id]);
  }

  static async deleteByClass(classId, semester) {
    const params = [classId];
    let sql = 'DELETE FROM timetable_entries WHERE class_id = ?';
    if (semester) {
      sql += ' AND semester = ?';
      params.push(semester);
    }
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  }

  // 已使用过的学期列表
  static async getSemesters() {
    const [rows] = await pool.execute(
      'SELECT DISTINCT semester FROM timetable_entries ORDER BY semester DESC'
    );
    return rows.map((r) => r.semester);
  }

  // 按学期统计各班级排课数量
  static async countByClass(semester) {
    const [rows] = await pool.execute(
      `SELECT t.class_id AS classId, c.name AS className, COUNT(*) AS count
       FROM timetable_entries t
       INNER JOIN classes c ON t.class_id = c.id
       WHERE t.semester = ?
       GROUP BY t.class_id, c.name
       ORDER BY c.id`,
      [semester]
    );
    return rows;
  }
}

module.exports = TimetableEntry;