const { ErrorCode } = require('../utils/response');

function httpError(name, message, code, status) {
  const error = new Error(message);
  error.name = name;
  error.code = code;
  error.status = status;
  return error;
}

const validationError = (message) => httpError('ValidationError', message, ErrorCode.PARAM_VALIDATION, 400);
const unauthorizedError = (message = '未认证') => httpError('UnauthorizedError', message, ErrorCode.UNAUTHORIZED, 401);
const forbiddenError = (message = '权限不足') => httpError('ForbiddenError', message, ErrorCode.FORBIDDEN, 403);
const notFoundError = (message = '资源不存在') => httpError('NotFoundError', message, ErrorCode.NOT_FOUND, 404);
const conflictError = (message = '数据已存在') => httpError('ConflictError', message, ErrorCode.CONFLICT, 409);

module.exports = {
  httpError,
  validationError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  conflictError
};