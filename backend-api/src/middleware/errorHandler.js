const { ErrorCode } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  // 默认错误
  let statusCode = 500;
  let errorCode = ErrorCode.SERVER_ERROR;
  let message = '服务器内部错误';

  // 根据错误类型设置响应
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = ErrorCode.PARAM_VALIDATION;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = ErrorCode.UNAUTHORIZED;
    message = err.message || '未认证';
  } else if (err.status === 404 || err.name === 'NotFoundError') {
    statusCode = 404;
    errorCode = ErrorCode.NOT_FOUND;
    message = err.message || '资源不存在';
  } else if (err.status === 403 || err.name === 'ForbiddenError') {
    statusCode = 403;
    errorCode = ErrorCode.FORBIDDEN;
    message = err.message || '权限不足';
  } else if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    errorCode = ErrorCode.CONFLICT;
    message = '数据已存在';
  }

  // 开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      code: errorCode,
      message,
      data: null,
      error: err.message,
      stack: err.stack
    });
  }

  return res.status(statusCode).json({
    code: errorCode,
    message,
    data: null
  });
}

// 404 处理
function notFoundHandler(req, res) {
  return res.status(404).json({
    code: ErrorCode.NOT_FOUND,
    message: `接口不存在: ${req.method} ${req.path}`,
    data: null
  });
}

module.exports = { errorHandler, notFoundHandler };
