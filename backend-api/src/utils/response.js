// 成功响应
function success(res, data = null, message = 'success', code = 0) {
  return res.json({ code, data, message });
}

// 失败响应
function fail(res, message = '请求失败', code = 40000, data = null) {
  return res.status(code >= 50000 ? 500 : 400).json({ code, data, message });
}

// 分页响应
function paginate(res, list, total, page, pageSize, message = 'success') {
  return res.json({
    code: 0,
    data: { list, total, page: Number(page), pageSize: Number(pageSize) },
    message
  });
}

// 错误码常量
const ErrorCode = {
  SUCCESS: 0,
  BAD_REQUEST: 40000,
  PARAM_VALIDATION: 40001,
  UNAUTHORIZED: 40100,
  TOKEN_EXPIRED: 40101,
  FORBIDDEN: 40300,
  NOT_FOUND: 40400,
  CONFLICT: 40900,
  TOO_MANY_REQUESTS: 42900,
  SERVER_ERROR: 50000,
  DATABASE_ERROR: 50001,
  SERVICE_UNAVAILABLE: 50003
};

module.exports = { success, fail, paginate, ErrorCode };
