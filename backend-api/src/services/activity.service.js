const Activity = require('../models/Activity.model');
const { ErrorCode } = require('../utils/response');
const { withTransaction } = require('../utils/transaction');

// 活动类型（与前端下拉保持一致）
const CATEGORIES = ['文艺', '学术', '体育', '公益', '社团', '就业', '其他'];

const STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'];

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

class ActivityService {
  static getCategories() {
    return CATEGORIES;
  }

  // 补全派生字段（剩余名额、是否可报名等）
  static decorate(row) {
    if (!row) return null;
    const registered = Number(row.registeredCount) || 0;
    const max = row.maxParticipants == null ? null : Number(row.maxParticipants);
    const status = row.status;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      location: row.location,
      startTime: row.startTime,
      endTime: row.endTime,
      maxParticipants: max,
      organizerId: row.organizerId,
      organizerName: row.organizerName,
      cover: row.cover,
      status,
      registeredCount: registered,
      checkedInCount: Number(row.checkedInCount) || 0,
      remaining: max == null ? null : Math.max(0, max - registered),
      isFull: max != null && registered >= max,
      hasJoined: !!row.hasJoined,
      canRegister: status === 'upcoming' && !row.hasJoined && (max == null || registered < max),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  static normalizeInput(input, { partial = false } = {}) {
    const data = { ...input };

    if (data.title !== undefined) data.title = String(data.title).trim();

    if (data.maxParticipants !== undefined) {
      if (data.maxParticipants === '' || data.maxParticipants === null) {
        data.maxParticipants = null;
      } else {
        const n = Number(data.maxParticipants);
        if (!Number.isInteger(n) || n < 1) {
          throw validationError('人数上限必须为大于 0 的整数');
        }
        data.maxParticipants = n;
      }
    }

    if (data.category !== undefined && data.category !== null && data.category !== '') {
      if (!CATEGORIES.includes(data.category)) {
        throw validationError('活动类型不合法');
      }
    }

    if (data.status !== undefined && data.status !== null) {
      if (!STATUSES.includes(data.status)) {
        throw validationError('活动状态不合法');
      }
    }

    if (!partial) {
      if (!data.title) throw validationError('请填写活动名称');
      if (!data.startTime) throw validationError('请选择活动开始时间');
    }

    if (data.startTime && data.endTime && new Date(data.endTime) < new Date(data.startTime)) {
      throw validationError('结束时间不能早于开始时间');
    }

    return data;
  }

  static async list(query = {}, user = null) {
    const userId = user ? user.id : null;
    const result = await Activity.findList({ ...query, userId });
    return {
      list: result.list.map((row) => this.decorate(row)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    };
  }

  static async detail(id, user = null) {
    const row = await Activity.findById(id, user ? user.id : null);
    if (!row) throw notFoundError('活动不存在');
    return this.decorate(row);
  }

  static async create(input, operator) {
    const data = this.normalizeInput(input);
    const id = await Activity.create({
      ...data,
      organizerId: operator.id,
      status: 'upcoming'
    });
    return this.detail(id, operator);
  }

  static async update(id, input, operator) {
    const existing = await Activity.findById(id);
    if (!existing) throw notFoundError('活动不存在');

    if (operator.role !== 'admin' && existing.organizerId !== operator.id) {
      throw forbiddenError('只能修改自己发布的活动');
    }

    const merged = this.normalizeInput(
      {
        title: existing.title,
        description: existing.description,
        category: existing.category,
        location: existing.location,
        startTime: existing.startTime,
        endTime: existing.endTime,
        maxParticipants: existing.maxParticipants,
        cover: existing.cover,
        status: existing.rawStatus,
        ...input
      },
      { partial: true }
    );

    await Activity.update(id, merged);
    return this.detail(id, operator);
  }

  static async remove(id, operator) {
    const existing = await Activity.findById(id);
    if (!existing) throw notFoundError('活动不存在');

    if (operator.role !== 'admin' && existing.organizerId !== operator.id) {
      throw forbiddenError('只能删除自己发布的活动');
    }

    await Activity.delete(id);
  }

  // ==================== 报名 ====================

  static async register(activityId, user) {
    const activity = await Activity.findById(activityId);
    if (!activity) throw notFoundError('活动不存在');

    if (activity.status === 'cancelled') throw validationError('活动已取消，无法报名');
    if (activity.status === 'completed') throw validationError('活动已结束，无法报名');
    if (activity.status === 'ongoing') throw validationError('活动已开始，无法报名');

    // 名额校验与写入放在同一事务内，并对活动行加锁，避免并发超额报名
    await withTransaction(async (conn) => {
      await Activity.lockById(activityId, conn);

      const existing = await Activity.findRegistration(activityId, user.id, conn);
      if (existing && existing.status !== 'cancelled') {
        throw validationError('您已报名该活动');
      }

      const count = await Activity.countRegistrations(activityId, conn);
      if (activity.maxParticipants != null && count >= Number(activity.maxParticipants)) {
        throw validationError('活动名额已满');
      }

      if (existing) {
        await Activity.reactivateRegistration(existing.id, null, conn);
      } else {
        await Activity.createRegistration(activityId, user.id, null, conn);
      }
    });

    return this.detail(activityId, user);
  }

  static async cancel(activityId, user) {
    const activity = await Activity.findById(activityId);
    if (!activity) throw notFoundError('活动不存在');

    if (activity.status === 'completed') throw validationError('活动已结束，无法取消报名');

    const affected = await Activity.cancelRegistration(activityId, user.id);
    if (!affected) throw validationError('您尚未报名该活动');

    return this.detail(activityId, user);
  }

  static async registrations(activityId, { status } = {}) {
    const activity = await Activity.findById(activityId);
    if (!activity) throw notFoundError('活动不存在');

    const list = await Activity.findRegistrations(activityId, { status });
    return {
      activity: this.decorate(activity),
      list,
      total: list.length
    };
  }

  static async checkIn(registrationId) {
    const reg = await Activity.findRegistrationById(registrationId);
    if (!reg) throw notFoundError('报名记录不存在');
    if (reg.status === 'cancelled') throw validationError('该报名已取消，无法签到');
    if (reg.status === 'checked_in') throw validationError('该用户已签到');

    await Activity.checkIn(registrationId);
    return Activity.findRegistrationById(registrationId);
  }

  static async myActivities(user) {
    const list = await Activity.findUserRegistrations(user.id);
    return list.map((row) => ({
      registrationId: row.id,
      status: row.status,
      registeredAt: row.registeredAt,
      checkedInAt: row.checkedInAt,
      activityId: row.activityId,
      title: row.title,
      category: row.category,
      location: row.location,
      startTime: row.startTime,
      endTime: row.endTime,
      cover: row.cover,
      activityStatus: row.activityStatus
    }));
  }

  static async stats() {
    const [stats, categories] = await Promise.all([
      Activity.getStats(),
      Activity.getCategories()
    ]);
    return { ...stats, categories };
  }
}

module.exports = ActivityService;