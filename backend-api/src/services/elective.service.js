const pool = require('../config/database');
const ElectiveCourse = require('../models/ElectiveCourse.model');
const { ErrorCode } = require('../utils/response');
const { withTransaction } = require('../utils/transaction');

const CATEGORIES = ['人文社科', '自然科学', '艺术体育', '信息技术', '语言文化', '实践技能', '其他'];
const STATUSES = ['draft', 'open', 'closed'];

function validationError(message) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.code = ErrorCode.PARAM_VALIDATION;
  return error;
}

function notFoundError(message) {
  const error = new Error(message);
  error.name = 'NotFoundError';
  error.status = 404;
  return error;
}

function forbiddenError(message) {
  const error = new Error(message);
  error.name = 'ForbiddenError';
  error.code = ErrorCode.FORBIDDEN;
  return error;
}

class ElectiveService {
  static getCategories() {
    return CATEGORIES;
  }

  // 公开筛选选项（学生选课中心使用）：类别 + 学期
  static async filters() {
    const semesters = await ElectiveCourse.getSemesters();
    return { categories: CATEGORIES, semesters };
  }

  // 补全派生字段：已选人数 / 剩余名额 / 是否已选 / 是否可选
  static decorate(row, { studentGrade = null } = {}) {
    if (!row) return null;
    const capacity = Number(row.capacity) || 0;
    const selectedCount = Number(row.selectedCount) || 0;
    const hasSelected = !!row.hasSelected;
    const now = new Date();
    const withinWindow =
      (!row.selectStart || now >= new Date(row.selectStart)) &&
      (!row.selectEnd || now <= new Date(row.selectEnd));
    const gradeMatched = !row.grade || !studentGrade || row.grade === studentGrade;

    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      category: row.category,
      teacherId: row.teacherId,
      teacherName: row.teacherName,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      semester: row.semester,
      grade: row.grade,
      capacity,
      credit: row.credit === null || row.credit === undefined ? null : Number(row.credit),
      location: row.location,
      scheduleText: row.scheduleText,
      selectStart: row.selectStart,
      selectEnd: row.selectEnd,
      status: row.status,
      selectedCount,
      remaining: Math.max(0, capacity - selectedCount),
      isFull: selectedCount >= capacity,
      hasSelected,
      withinWindow,
      canSelect:
        row.status === 'open' && withinWindow && gradeMatched && !hasSelected && selectedCount < capacity,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  static normalizeInput(input, { partial = false } = {}) {
    const data = { ...input };

    if (data.name !== undefined) data.name = String(data.name).trim();
    if (data.code !== undefined && data.code !== null) data.code = String(data.code).trim();
    if (data.semester !== undefined) data.semester = String(data.semester).trim();

    if (data.capacity !== undefined) {
      const n = Number(data.capacity);
      if (!Number.isInteger(n) || n < 1) {
        throw validationError('选课容量必须为大于 0 的整数');
      }
      data.capacity = n;
    }

    if (data.credit !== undefined && data.credit !== null && data.credit !== '') {
      const c = Number(data.credit);
      if (Number.isNaN(c) || c < 0 || c > 99) {
        throw validationError('学分必须为 0-99 之间的数字');
      }
      data.credit = c;
    } else if (data.credit === '' || data.credit === null) {
      data.credit = null;
    }

    if (data.status !== undefined && data.status !== null) {
      if (!STATUSES.includes(data.status)) throw validationError('课程状态不合法');
    }

    if (data.category !== undefined && data.category !== null && data.category !== '') {
      if (!CATEGORIES.includes(data.category)) throw validationError('课程类别不合法');
    }

    if (!partial) {
      if (!data.name) throw validationError('请填写课程名称');
      if (!data.semester) throw validationError('请选择学期');
      if (data.capacity === undefined) throw validationError('请填写选课容量');
    }

    if (data.selectStart && data.selectEnd && new Date(data.selectEnd) < new Date(data.selectStart)) {
      throw validationError('选课结束时间不能早于开始时间');
    }

    return data;
  }

  // ==================== 查询 ====================

  static async list(query = {}, user = null) {
    const role = user ? user.role : null;
    let { semester, status, category, keyword, teacherId, grade, page, pageSize } = query;

    const filters = { semester, status, category, keyword, teacherId, grade, page, pageSize };

    // 学生视角：只看开放课程，且按本人年级过滤；教师视角默认看自己发布的
    if (role === 'student' && user) {
      const studentGrade = await this.getStudentGrade(user.id);
      filters.grade = studentGrade;
      if (!status) filters.status = 'open';
    } else if (role === 'teacher' && !teacherId && query.mine === '1') {
      filters.teacherId = user.id;
    }

    const result = await ElectiveCourse.findList({ ...filters, studentId: user ? user.id : null });
    return {
      list: result.list.map((row) => this.decorate(row, { studentGrade: filters.grade })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    };
  }

  static async detail(id, user = null) {
    const row = await ElectiveCourse.findById(id, user ? user.id : null);
    if (!row) throw notFoundError('选修课不存在');
    const studentGrade = user && user.role === 'student' ? await this.getStudentGrade(user.id) : null;
    return this.decorate(row, { studentGrade });
  }

  static async stats() {
    return ElectiveCourse.getStats();
  }

  static async options() {
    const [semesters, subjects, teachers, grades] = await Promise.all([
      ElectiveCourse.getSemesters(),
      pool.execute("SELECT id, name, code FROM subjects ORDER BY id"),
      pool.execute("SELECT id, name FROM users WHERE role = 'teacher' ORDER BY name"),
      pool.execute("SELECT DISTINCT grade FROM classes WHERE grade IS NOT NULL AND grade <> '' ORDER BY grade")
    ]);

    return {
      semesters,
      subjects: subjects[0],
      teachers: teachers[0],
      grades: grades[0].map((r) => r.grade),
      categories: CATEGORIES,
      statuses: STATUSES
    };
  }

  static async students(courseId, { status } = {}) {
    const course = await ElectiveCourse.findById(courseId);
    if (!course) throw notFoundError('选修课不存在');

    const list = await ElectiveCourse.findCourseStudents(courseId, { status });
    return {
      course: this.decorate(course),
      list,
      total: list.length
    };
  }

  static async mySelections(user) {
    const list = await ElectiveCourse.findStudentSelections(user.id);
    const selectedCount = list.filter((r) => r.status === 'selected').length;
    const totalCredit = list
      .filter((r) => r.status === 'selected')
      .reduce((sum, r) => sum + (Number(r.credit) || 0), 0);

    return {
      list,
      selectedCount,
      totalCredit: parseFloat(totalCredit.toFixed(1))
    };
  }

  // ==================== 管理端 ====================

  static async create(input, operator) {
    const data = this.normalizeInput(input);
    const id = await ElectiveCourse.create({
      ...data,
      status: data.status || 'draft',
      createdBy: operator.id
    });
    return this.detail(id, operator);
  }

  static async update(id, input, operator) {
    const existing = await ElectiveCourse.findById(id);
    if (!existing) throw notFoundError('选修课不存在');

    if (operator.role !== 'admin' && existing.createdBy !== operator.id) {
      throw forbiddenError('只能修改自己创建的选修课');
    }

    const merged = this.normalizeInput(
      {
        code: existing.code,
        name: existing.name,
        description: existing.description,
        category: existing.category,
        teacherId: existing.teacherId,
        subjectId: existing.subjectId,
        semester: existing.semester,
        grade: existing.grade,
        capacity: existing.capacity,
        credit: existing.credit,
        location: existing.location,
        scheduleText: existing.scheduleText,
        selectStart: existing.selectStart,
        selectEnd: existing.selectEnd,
        status: existing.status,
        ...input
      },
      { partial: true }
    );

    // 容量不得小于已选人数
    if (merged.capacity !== undefined) {
      const selected = await ElectiveCourse.countSelected(id);
      if (merged.capacity < selected) {
        throw validationError(`选课容量不能小于已选人数（${selected} 人）`);
      }
    }

    await ElectiveCourse.update(id, merged);
    return this.detail(id, operator);
  }

  static async remove(id, operator) {
    const existing = await ElectiveCourse.findById(id);
    if (!existing) throw notFoundError('选修课不存在');

    if (operator.role !== 'admin' && existing.createdBy !== operator.id) {
      throw forbiddenError('只能删除自己创建的选修课');
    }

    await ElectiveCourse.delete(id);
  }

  // ==================== 学生选课 ====================

  static async select(courseId, user) {
    const course = await ElectiveCourse.findById(courseId);
    if (!course) throw notFoundError('选修课不存在');

    if (course.status === 'draft') throw validationError('该课程尚未开放选课');
    if (course.status === 'closed') throw validationError('该课程已关闭选课');

    const now = new Date();
    if (course.selectStart && now < new Date(course.selectStart)) {
      throw validationError('选课尚未开始');
    }
    if (course.selectEnd && now > new Date(course.selectEnd)) {
      throw validationError('选课已结束');
    }

    if (course.grade) {
      const studentGrade = await this.getStudentGrade(user.id);
      if (studentGrade && studentGrade !== course.grade) {
        throw validationError('该课程仅限指定年级选修');
      }
    }

    // 名额校验与写入放在同一事务内，并对课程行加锁，避免并发超选
    await withTransaction(async (conn) => {
      await ElectiveCourse.lockById(courseId, conn);

      const existing = await ElectiveCourse.findSelection(courseId, user.id, conn);
      if (existing && existing.status === 'selected') {
        throw validationError('您已选修该课程');
      }

      const count = await ElectiveCourse.countSelected(courseId, conn);
      if (count >= Number(course.capacity)) {
        throw validationError('该课程名额已满');
      }

      if (existing) {
        await ElectiveCourse.reactivateSelection(existing.id, null, conn);
      } else {
        await ElectiveCourse.createSelection(courseId, user.id, null, conn);
      }
    });

    return this.detail(courseId, user);
  }

  static async drop(courseId, user) {
    const course = await ElectiveCourse.findById(courseId);
    if (!course) throw notFoundError('选修课不存在');

    if (course.status === 'closed') throw validationError('该课程已关闭，无法退选');

    const affected = await ElectiveCourse.dropSelection(courseId, user.id);
    if (!affected) throw validationError('您尚未选修该课程');

    return this.detail(courseId, user);
  }

  // ==================== 内部工具 ====================

  static async getStudentGrade(studentId) {
    const [rows] = await pool.execute(
      `SELECT c.grade
         FROM users u
         LEFT JOIN classes c ON u.class_id = c.id
        WHERE u.id = ?`,
      [studentId]
    );
    return rows[0] ? rows[0].grade : null;
  }
}

module.exports = ElectiveService;