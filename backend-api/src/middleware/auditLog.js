const OperationLogService = require('../services/operationLog.service');

// 仅审计写操作
const AUDIT_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// 无需审计的路径
const EXCLUDE_PATTERNS = [
  /^\/api\/health/,
  /^\/api\/docs/,
  /^\/api\/openapi/,
  /^\/api\/operation-logs/
];

/**
 * 操作日志（审计）中间件
 *
 * 在响应结束后异步落库，记录操作人、动作、目标、耗时、结果等。
 * 通过 res.locals.targetType 可让业务路由补充目标类型。
 */
function auditLog(req, res, next) {
  // 测试环境不落库，避免污染审计表与产生游离的数据库连接
  if (process.env.NODE_ENV === 'test') return next();

  if (!AUDIT_METHODS.has(req.method)) return next();

  const url = req.originalUrl || req.url || '';
  if (EXCLUDE_PATTERNS.some((re) => re.test(url))) return next();

  const startAt = Date.now();

  res.on('finish', () => {
    // 此时路由中间件已执行完毕，req.user 可用
    OperationLogService.record({
      req,
      res,
      durationMs: Date.now() - startAt,
      targetType: res.locals ? res.locals.targetType : null
    }).catch(() => {
      /* record 内部已兜底 */
    });
  });

  return next();
}

module.exports = auditLog;