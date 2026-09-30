const pool = require('../config/database');
const TimetableEntry = require('../models/TimetableEntry.model');
const Class = require('../models/Class.model');
const Subject = require('../models/Subject.model');
const { ErrorCode } = require('../utils/response');

// 节次时间定义（可通过 /timetable/periods 获取，前端据此渲染周课表网格）
const PERIODS = [
  { period: 1, label: '第1节', startTime: '08:00', endTime: '08:45' },
  { period: 2, label: '第2节', startTime: '08:55', endTime: '09:40' },
  { period: 3, label: '第3节', startTime: '10:00', endTime: '10:45' },
  { period: 4, label: '第4节', startTime: '10:55', endTime: '11:40' },
  { period: 5, label: '第5节', startTime: '14:00', endTime: '14:45' },
  { period: 6, label: '第6节', startTime: '14:55', endTime: '15:40' },
  { period: 7, label: '第7节', startTime: '16:00', endTime: '16:45' },
  { period: 8, label: '第8节', startTime: '16:55', endTime: '17:40' }
];

const DAYS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' }
];

const PERIOD_MAP = PERIODS.reduce((acc, p) => {
  acc[p.period] = p;
  return acc;
}, {});

const DAY_MAP = DAYS.reduce((acc, d) => {
  acc[d.value] = d.label;
  return acc;
}, {});

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

class TimetableService {
  // 当前学期（9月-次年1月为第1学期，2-8月为第2学期）
  static getDefaultSemester() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    if (month >= 9) return `${year}-${year + 1}-1`;
    if (month <= 1) return `${year - 1}-${year}-1`;
    return `${year - 1}-${year}-2`;
  }

  static getPeriods() {
    return PERIODS;
  }

  static getDays() {
    return DAYS;
  }

  // 排课表单所需的下拉选项
  static async getOptions() {
    const [classes, subjects, semesters] = await Promise.all([
      Class.getAllSimple(),
      Subject.getAllSimple(),
      TimetableEntry.getSemesters()
    ]);

    const [teacherRows] = await pool.execute(
      "SELECT id, name, department FROM users WHERE role = 'teacher' ORDER BY id"
    );
    const [roomRows] = await pool.execute(
      "SELECT id, name, building, capacity FROM rooms WHERE status = 'active' ORDER BY building, name"
    );

    const defaultSemester = this.getDefaultSemester();
    const semesterList = semesters.includes(defaultSemester)
      ? semesters
      : [defaultSemester, ...semesters];

    return {
      classes,
      subjects,
      teachers: teacherRows,
      rooms: roomRows,
      semesters: semesterList,
      defaultSemester,
      periods: PERIODS,
      days: DAYS
    };
  }

  // 冲突检测：返回结构化的冲突列表
  static async checkConflict({
    semester, classId, subjectId, teacherId, roomId,
    dayOfWeek, period, excludeId
  }) {
    const rows = await TimetableEntry.findConflicts({
      semester, classId, teacherId, roomId, dayOfWeek, period, excludeId
    });

    const conflicts = [];
    for (const row of rows) {
      if (Number(row.classId) === Number(classId)) {
        conflicts.push({
          type: 'class',
          message: `${row.className} 在 ${DAY_MAP[row.dayOfWeek]}第${row.period}节 已排《${row.subjectName}》`,
          entry: row
        });
      }
      if (teacherId && Number(row.teacherId) === Number(teacherId)) {
        conflicts.push({
          type: 'teacher',
          message: `教师 ${row.teacherName} 在 ${DAY_MAP[row.dayOfWeek]}第${row.period}节 已给 ${row.className} 上《${row.subjectName}》`,
          entry: row
        });
      }
      if (roomId && row.roomId && Number(row.roomId) === Number(roomId)) {
        conflicts.push({
          type: 'room',
          message: `教室 ${row.roomName} 在 ${DAY_MAP[row.dayOfWeek]}第${row.period}节 已被 ${row.className} 占用`,
          entry: row
        });
      }
    }

    return { hasConflict: conflicts.length > 0, conflicts };
  }

  // 参数规范化 + 校验
  static async normalizeEntryInput(input, { partial = false } = {}) {
    const data = { ...input };

    if (!partial || data.semester !== undefined) {
      data.semester = data.semester || this.getDefaultSemester();
    }

    const numericFields = ['classId', 'subjectId', 'teacherId', 'roomId', 'dayOfWeek', 'period', 'weekStart', 'weekEnd'];
    for (const field of numericFields) {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        const n = Number(data[field]);
        data[field] = Number.isNaN(n) ? data[field] : n;
      }
    }

    if (!partial) {
      if (!data.classId) throw validationError('请选择班级');
      if (!data.subjectId) throw validationError('请选择学科');
      if (!data.teacherId) throw validationError('请选择授课教师');
      if (!data.dayOfWeek || data.dayOfWeek < 1 || data.dayOfWeek > 7) {
        throw validationError('星期取值不合法（1-7）');
      }
      if (!data.period || data.period < 1 || data.period > PERIODS.length) {
        throw validationError(`节次取值不合法（1-${PERIODS.length}）`);
      }
    } else {
      if (data.dayOfWeek !== undefined && (data.dayOfWeek < 1 || data.dayOfWeek > 7)) {
        throw validationError('星期取值不合法（1-7）');
      }
      if (data.period !== undefined && (data.period < 1 || data.period > PERIODS.length)) {
        throw validationError(`节次取值不合法（1-${PERIODS.length}）`);
      }
    }

    // 未传时间则按节次取默认值
    const periodDef = PERIOD_MAP[data.period];
    if (periodDef) {
      if (!data.startTime) data.startTime = `${periodDef.startTime}:00`;
      if (!data.endTime) data.endTime = `${periodDef.endTime}:00`;
    }
    if (data.startTime && data.startTime.length === 5) data.startTime += ':00';
    if (data.endTime && data.endTime.length === 5) data.endTime += ':00';

    data.weekStart = data.weekStart || 1;
    data.weekEnd = data.weekEnd || 20;
    if (Number(data.weekStart) > Number(data.weekEnd)) {
      throw validationError('起始周不能大于结束周');
    }

    // 关联实体存在性校验
    if (data.classId) {
      const cls = await Class.findById(data.classId);
      if (!cls) throw validationError('班级不存在');
    }
    if (data.subjectId) {
      const subject = await Subject.findById(data.subjectId);
      if (!subject) throw validationError('学科不存在');
    }
    if (data.teacherId) {
      const [rows] = await pool.execute('SELECT id, role FROM users WHERE id = ?', [data.teacherId]);
      if (!rows[0]) throw validationError('教师不存在');
      if (rows[0].role !== 'teacher') throw validationError('所选用户不是教师');
    }
    if (data.roomId) {
      const [rows] = await pool.execute('SELECT id FROM rooms WHERE id = ?', [data.roomId]);
      if (!rows[0]) throw validationError('教室不存在');
    }

    return data;
  }

  // 新增排课
  static async createEntry(input, operatorId) {
    const data = await this.normalizeEntryInput(input);

    const { hasConflict, conflicts } = await this.checkConflict(data);
    if (hasConflict) {
      throw validationError(`排课冲突：${conflicts.map((c) => c.message).join('；')}`);
    }

    const id = await TimetableEntry.create({ ...data, createdBy: operatorId });
    return { id, entry: await TimetableEntry.findById(id) };
  }

  // 更新排课
  static async updateEntry(id, input) {
    const existing = await TimetableEntry.findById(id);
    if (!existing) throw notFoundError('课表条目不存在');

    const merged = await this.normalizeEntryInput({
      semester: existing.semester,
      classId: existing.classId,
      subjectId: existing.subjectId,
      teacherId: existing.teacherId,
      roomId: existing.roomId,
      dayOfWeek: existing.dayOfWeek,
      period: existing.period,
      startTime: existing.startTime,
      endTime: existing.endTime,
      weekStart: existing.weekStart,
      weekEnd: existing.weekEnd,
      note: existing.note,
      ...input
    });

    const { hasConflict, conflicts } = await this.checkConflict({ ...merged, excludeId: id });
    if (hasConflict) {
      throw validationError(`排课冲突：${conflicts.map((c) => c.message).join('；')}`);
    }

    await TimetableEntry.update(id, merged);
    return TimetableEntry.findById(id);
  }

  static async deleteEntry(id) {
    const existing = await TimetableEntry.findById(id);
    if (!existing) throw notFoundError('课表条目不存在');
    await TimetableEntry.delete(id);
  }

  // 周课表视图：按班级 / 教师 / 教室
  static async getWeekView({ semester, classId, teacherId, roomId }) {
    const useSemester = semester || this.getDefaultSemester();
    const entries = await TimetableEntry.findWeekEntries({
      semester: useSemester,
      classId, teacherId, roomId
    });

    const bySubject = {};
    for (const e of entries) {
      bySubject[e.subjectName] = (bySubject[e.subjectName] || 0) + 1;
    }

    return {
      semester: useSemester,
      classId: classId || null,
      className: entries[0]?.className || null,
      teacherId: teacherId || null,
      teacherName: entries[0]?.teacherName || null,
      roomId: roomId || null,
      roomName: entries[0]?.roomName || null,
      days: DAYS,
      periods: PERIODS,
      entries,
      stats: {
        total: entries.length,
        bySubject: Object.entries(bySubject).map(([subjectName, count]) => ({ subjectName, count }))
      }
    };
  }

  // 当前登录用户的课表：教师看自己的，学生看本班，管理员返回班级概览
  static async getMyTimetable(user, { semester } = {}) {
    const useSemester = semester || this.getDefaultSemester();

    if (user.role === 'teacher') {
      return this.getWeekView({ semester: useSemester, teacherId: user.id });
    }

    if (user.role === 'student') {
      const [rows] = await pool.execute('SELECT class_id FROM users WHERE id = ?', [user.id]);
      const classId = rows[0]?.class_id;
      if (!classId) throw notFoundError('当前学生尚未分配班级，暂无课表');
      return this.getWeekView({ semester: useSemester, classId });
    }

    // 管理员：返回各班级排课概览
    const overview = await TimetableEntry.countByClass(useSemester);
    return {
      semester: useSemester,
      role: 'admin',
      classes: overview
    };
  }
}

module.exports = TimetableService;