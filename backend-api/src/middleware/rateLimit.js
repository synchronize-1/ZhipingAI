const { ErrorCode } = require('../utils/response');

/**
 * 基于内存固定窗口的限流中间件（无第三方依赖）
 *
 * 说明：适用于单实例部署；多实例场景建议替换为 Redis 实现。
 * 用法：
 *   app.use('/api', createRateLimiter({ windowMs: 60000, max: 600 }));
 *   router.post('/login', createRateLimiter({ windowMs: 60000, max: 20 }), handler);
 */
function createRateLimiter({
  windowMs = 60 * 1000,
  max = 300,
  message = '请求过于频繁，请稍后再试',
  keyGenerator,
  skip
} = {}) {
  const hits = new Map();

  // 定期清理过期窗口，避免内存无限增长
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits) {
      if (record.resetAt <= now) hits.delete(key);
    }
  }, Math.max(windowMs, 10 * 1000));
  if (cleanupTimer.unref) cleanupTimer.unref();

  function rateLimit(req, res, next) {
    if (skip && skip(req)) return next();

    const key = keyGenerator
      ? keyGenerator(req)
      : req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';

    const now = Date.now();
    let record = hits.get(key);
    if (!record || record.resetAt <= now) {
      record = { count: 0, resetAt: now + windowMs };
      hits.set(key, record);
    }
    record.count += 1;

    const remaining = Math.max(0, max - record.count);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));

    if (record.count > max) {
      const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        code: ErrorCode.TOO_MANY_REQUESTS,
        data: null,
        message
      });
    }

    return next();
  }

  // 暴露内部状态便于测试与监控
  rateLimit.reset = () => hits.clear();
  rateLimit.size = () => hits.size;

  return rateLimit;
}

// 全局接口限流：单 IP 每分钟 600 次
const globalRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 600,
  skip: (req) => req.originalUrl === '/api/health'
});

// 登录 / 注册等敏感接口限流：单 IP 每分钟 20 次
const authRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: '登录尝试过于频繁，请稍后再试'
});

module.exports = { createRateLimiter, globalRateLimit, authRateLimit };