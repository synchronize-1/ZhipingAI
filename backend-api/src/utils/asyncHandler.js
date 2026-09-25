// 包装异步路由处理函数，自动捕获错误并传递给错误处理中间件
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
