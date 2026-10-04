const pool = require('../config/database');

// 选课窗口与状态共同决定「是否可操作」，避免存储值过期
function baseSelect({ withStudent = false } = {}) {
  const hasSelected = withStudent
    ? `,
      EXISTS(
        SELECT 1 FROM elective_selections es2
         WHERE es2.course_id = ec.id AND es2.student_id = ? AND es2.status = 'selected'
      ) AS hasSelected`
    : '';

  return `
    SELECT
      ec.id,
      ec.code,
      ec.name,
      ec.description,
      ec.category,
      ec.teacher_id     AS teacherId,
      t.name            AS teacherName,
      ec.subject_id     AS subjectId,
      s.name            AS subjectName,
      ec.semester,
      ec.grade,
      ec.capacity,
      ec.credit,
      ec.location,
      ec.schedule_text  AS scheduleText,
      ec.select_start   AS selectStart,
      ec.select_end     AS selectEnd,
      ec.status,
      ec.created_by     AS createdBy,
      ec.created_at     AS createdAt,
      ec.updated_at     AS updatedAt,
      (SELECT COUNT(*) FROM elective_selections es
        WHERE es.course_id = ec.id AND es.status = 'selected') AS selectedCount${hasSelected}
    FROM elective_courses ec
    LEFT JOIN users t    ON ec.teacher_id = t.id
    LEFT JOIN subjects s ON ec.subject_id = s.id
  `;
}

class ElectiveCourse {
  static async findById(id, studentId = null) {
    const params = studentId ? [studentId, id] : [id];
    const [rows] = await pool.execute(
      `${baseSelect({ withStudent: !!studentId })} WHERE ec.id = ?`,
      params
    );
    return rows[0];
  }

  static async findList({
    page = 1, pageSize = 10, semester, status, category, keyword, teacherId, grade, studentId
  } = {}) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const sizeNum = Math.min(100, Math.max(1, parseInt(pageSize) || 10));
    const offsetNum = (pageNum - 1) * sizeNum;

    const where = ['1 = 1'];
    const params = studentId ? [studentId] : [];

    if (semester) {
      where.push('ec.semester = ?');
      params.push(semester);
    }
    if (status) {
      where.push('ec.status = ?');
      params.push(status);
    }
    if (category) {
      where.push('ec.category = ?');
      params.push(category);
    }
    if (teacherId) {
      where.push('ec.teacher_id = ?');
      params.push(teacherId);
    }
    if (grade) {
      where.push('(ec.grade IS NULL OR ec.grade = ?)');
      params.push(grade);
    }
    if (keyword) {
      where.push('(ec.name LIKE ? OR ec.code LIKE ? OR ec.description LIKE ?)');
      const like = `%${keyword}%`;
      params.push(like, like, like);
    }

    const whereSql = where.join(' AND ');

    const [rows] = await pool.execute(
      `${baseSelect({ withStudent: !!studentId })}
        WHERE ${whereSql}
        ORDER BY ec.status = 'draft', ec.semester DESC, ec.id DESC
        LIMIT ${sizeNum} OFFSET ${offsetNum}`,
      params
    );

    const countParams = params.slice(studentId ? 1 : 0);
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM elective_courses ec WHERE ${whereSql}`,
      countParams
    );

    return { list: rows, total, page: pageNum, pageSize: sizeNum };
  }

  static async create(data) {
    const {
      code, name, description, category, teacherId, subjectId, semester, grade,
      capacity, credit, location, scheduleText, selectStart, selectEnd, status, createdBy
    } = data;

    const [result] = await pool.execute(
      `INSERT INTO elective_courses
         (code, name, description, category, teacher_id, subject_id, semester, grade,
          capacity, credit, location, schedule_text, select_start, select_end, status,
          created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [code || null, name, description || null, category || null, teacherId || null,
        subjectId || null, semester, grade || null, capacity, credit || null,
        location || null, scheduleText || null, selectStart || null, selectEnd || null,
        status || 'draft', createdBy || null]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const {
      code, name, description, category, teacherId, subjectId, semester, grade,
      capacity, credit, location, scheduleText, selectStart, selectEnd, status
    } = data;

    await pool.execute(
      `UPDATE elective_courses
          SET code = ?, name = ?, description = ?, category = ?, teacher_id = ?,
              subject_id = ?, semester = ?, grade = ?, capacity = ?, credit = ?,
              location = ?, schedule_text = ?, select_start = ?, select_end = ?,
              status = ?, updated_at = NOW()
        WHERE id = ?`,
      [code || null, name, description || null, category || null, teacherId || null,
        subjectId || null, semester, grade || null, capacity, credit || null,
        location || null, scheduleText || null, selectStart || null, selectEnd || null,
        status, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM elective_courses WHERE id = ?', [id]);
  }

  static async getStats() {
    const [[row]] = await pool.execute(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'draft')  AS draft,
        SUM(status = 'open')   AS open,
        SUM(status = 'closed') AS closed,
        COALESCE(SUM(capacity), 0) AS totalCapacity
      FROM elective_courses
    `);
    const [[sel]] = await pool.execute(
      "SELECT COUNT(*) AS selections FROM elective_selections WHERE status = 'selected'"
    );
    return {
      total: Number(row.total) || 0,
      draft: Number(row.draft) || 0,
      open: Number(row.open) || 0,
      closed: Number(row.closed) || 0,
      totalCapacity: Number(row.totalCapacity) || 0,
      selections: Number(sel.selections) || 0
    };
  }

  static async getSemesters() {
    const [rows] = await pool.execute(
      "SELECT DISTINCT semester FROM elective_courses WHERE semester IS NOT NULL AND semester <> '' ORDER BY semester DESC"
    );
    return rows.map((r) => r.semester);
  }

  // ==================== 选课记录 ====================

  static async countSelected(courseId, conn = pool) {
    const [[row]] = await conn.execute(
      "SELECT COUNT(*) AS c FROM elective_selections WHERE course_id = ? AND status = 'selected'",
      [courseId]
    );
    return Number(row.c) || 0;
  }

  static async findSelection(courseId, studentId, conn = pool) {
    const [rows] = await conn.execute(
      'SELECT * FROM elective_selections WHERE course_id = ? AND student_id = ?',
      [courseId, studentId]
    );
    return rows[0];
  }

  static async createSelection(courseId, studentId, remark = null, conn = pool) {
    const [result] = await conn.execute(
      `INSERT INTO elective_selections (course_id, student_id, status, selected_at, remark)
       VALUES (?, ?, 'selected', NOW(), ?)`,
      [courseId, studentId, remark]
    );
    return result.insertId;
  }

  static async reactivateSelection(id, remark = null, conn = pool) {
    await conn.execute(
      `UPDATE elective_selections
          SET status = 'selected', selected_at = NOW(), dropped_at = NULL, remark = ?
        WHERE id = ?`,
      [remark, id]
    );
  }

  // 事务内锁定课程行，串行化同一课程的并发选课，保证名额判断准确
  static async lockById(id, conn = pool) {
    const [rows] = await conn.execute(
      'SELECT id FROM elective_courses WHERE id = ? FOR UPDATE',
      [id]
    );
    return rows[0];
  }

  static async dropSelection(courseId, studentId) {
    const [result] = await pool.execute(
      `UPDATE elective_selections
          SET status = 'dropped', dropped_at = NOW()
        WHERE course_id = ? AND student_id = ? AND status = 'selected'`,
      [courseId, studentId]
    );
    return result.affectedRows;
  }

  static async findCourseStudents(courseId, { status } = {}) {
    const where = ['es.course_id = ?'];
    const params = [courseId];
    if (status) {
      where.push('es.status = ?');
      params.push(status);
    }

    const [rows] = await pool.execute(
      `SELECT
         es.id,
         es.course_id     AS courseId,
         es.student_id    AS studentId,
         es.status,
         es.selected_at   AS selectedAt,
         es.dropped_at    AS droppedAt,
         es.remark,
         u.name           AS studentName,
         u.username,
         u.student_id     AS studentNo,
         c.name           AS className,
         c.grade
       FROM elective_selections es
       INNER JOIN users u ON es.student_id = u.id
       LEFT JOIN classes c ON u.class_id = c.id
       WHERE ${where.join(' AND ')}
       ORDER BY es.status = 'dropped', es.selected_at`,
      params
    );
    return rows;
  }

  static async findStudentSelections(studentId) {
    const [rows] = await pool.execute(
      `SELECT
         es.id             AS selectionId,
         es.status,
         es.selected_at    AS selectedAt,
         es.dropped_at     AS droppedAt,
         ec.id             AS courseId,
         ec.name,
         ec.code,
         ec.category,
         ec.semester,
         ec.credit,
         ec.location,
         ec.schedule_text  AS scheduleText,
         ec.status         AS courseStatus,
         t.name            AS teacherName
       FROM elective_selections es
       INNER JOIN elective_courses ec ON es.course_id = ec.id
       LEFT JOIN users t ON ec.teacher_id = t.id
       WHERE es.student_id = ?
       ORDER BY es.status = 'dropped', es.selected_at DESC`,
      [studentId]
    );
    return rows;
  }
}

module.exports = ElectiveCourse;