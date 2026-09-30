const OperationLog = require('../models/OperationLog.model');

// 敏感字段脱敏名单
const SENSITIVE_KEYS = ['password', 'oldpassword', 'newpassword', 'token', 'authorization', 'secret'];

const MODULE_MAP = [
  { prefix: '/api/electives', module: 'electives' },
  { prefix: '/api/activities', module: 'activities' },
  { prefix: '/api/timetable', module: 'timetable' },
  { prefix: '/api/teaching', module: 'teaching' },
  { prefix: '/api/portfolio', module: 'portfolio' },
  { prefix: '/api/admin/users', module: 'users' },
  { prefix: '/api/users', module: 'users' },
  { prefix: '/api/courses', module: 'courses' },
  { prefix: '/api/notifications', module: 'notifications' },
  { prefix: '/api/auth', module: 'auth' },
  { prefix: '/api/ai-science', module: 'ai' }
];

class OperationLogService {
  // 由请求推导业务模块
  static resolveModule(path = '') {
    const matched = MODULE_MAP.find((item) => path.startsWith(item.prefix));
    if (matched) return matched.module;
    const seg = path.replace(/^\/api\//, '').split('/')[0];
    return seg || 'other';
  }

  // 由方法与路径推导动作
  static resolveAction(method, path = '') {
    const m = String(method || '').toUpperCase();
    if (/\/login$/.test(path)) return 'login';
    if (/\/register$/.test(path)) return 'register';
    if (/\/select$/.test(path)) return m === 'DELETE' ? 'drop' : 'select';
    if (/\/check-conflict$/.test(path)) return 'check';
    if (m === 'POST') return 'create';
    if (m === 'PUT' || m === 'PATCH') return 'update';
    if (m === 'DELETE') return 'delete';
    return 'unknown';
  }

  // 提取目标资源 ID（取路径中的数字段）
  static resolveTargetId(path = '') {
    const segments = path.split('/').filter(Boolean);
    for (let i = segments.length - 1; i >= 0; i -= 1) {
      if (/^\d+$/.test(segments[i])) return segments[i];
    }
    return null;
  }

  // 请求体脱敏 + 截断
  static sanitizeBody(body) {
    if (!body || typeof body !== 'object') return null;
    try {
      const clone = JSON.parse(JSON.stringify(body));
      Object.keys(clone).forEach((key) => {
        if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
          clone[key] = '***';
        }
      });
      const text = JSON.stringify(clone);
      return text.length > 2000 ? `${text.slice(0, 2000)}…` : text;
    } catch (error) {
      return null;
    }
  }

  /**
   * 记录一次操作日志（失败不影响主流程）
   * @param {object} params { req, res, durationMs, targetType }
   */
  static async record({ req, res, durationMs = null, targetType = null }) {
    try {
      if (!req || !res) return null;
      const path = req.originalUrl ? req.originalUrl.split('?')[0] : req.path;
      const user = req.user || {};
      const statusCode = res.statusCode;
      const errorMessage = res.locals && res.locals.errorMessage ? String(res.locals.errorMessage) : null;

      return await OperationLog.create({
        userId: user.id || null,
        username: user.username || null,
        role: user.role || null,
        module: this.resolveModule(path),
        action: this.resolveAction(req.method, path),
        method: req.method,
        path,
        targetType,
        targetId: this.resolveTargetId(path),
        statusCode,
        success: statusCode < 400 ? 1 : 0,
        durationMs,
        ip: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || null,
        userAgent: req.headers['user-agent'] ? String(req.headers['user-agent']).slice(0, 255) : null,
        requestBody: this.sanitizeBody(req.body),
        errorMessage
      });
    } catch (error) {
      console.error('[审计日志] 写入失败:', error.message);
      return null;
    }
  }

  static async list(query = {}) {
    return OperationLog.findList(query);
  }

  static async stats(query = {}) {
    return OperationLog.stats(query);
  }

  static async modules() {
    return OperationLog.modules();
  }
}

module.exports = OperationLogService;