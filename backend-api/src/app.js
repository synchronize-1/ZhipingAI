const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const courseRoutes = require('./routes/course.routes');
const serviceRoutes = require('./routes/service.routes');
const socialRoutes = require('./routes/social.routes');
const notificationRoutes = require('./routes/notification.routes');
const aiScienceRoutes = require('./routes/ai-science.routes');
const aiHealthRoutes = require('./routes/ai-health.routes');
// 新架构模块
const teachingRoutes = require('./routes/teaching.routes');
const portfolioRoutes = require('./routes/portfolio.routes');
const adminUserRoutes = require('./routes/admin-users.routes');
const dashboardV2Routes = require('./routes/dashboard.routes');
const timetableRoutes = require('./routes/timetable.routes');
const activityRoutes = require('./routes/activity.routes');
const electiveRoutes = require('./routes/elective.routes');
const operationLogRoutes = require('./routes/operation-log.routes');
const docsRoutes = require('./routes/docs.routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { globalRateLimit } = require('./middleware/rateLimit');
const auditLog = require('./middleware/auditLog');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' })); // 增加请求体大小限制，支持大图片
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件
app.use('/uploads', express.static('uploads'));

// 全局接口限流（健康检查除外）
app.use('/api', globalRateLimit);

// 操作日志审计（仅记录写操作，响应结束后异步落库）
app.use(auditLog);

// API 文档
app.use('/api/docs', docsRoutes);

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai-science', aiScienceRoutes);
app.use('/api/ai-health', aiHealthRoutes);
// 新架构模块路由
app.use('/api/teaching', teachingRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/admin/users', adminUserRoutes);
// 新版首页 Dashboard（按角色返回聚合数据）
app.use('/api/home', dashboardV2Routes);
// 课表管理
app.use('/api/timetable', timetableRoutes);
// 活动管理
app.use('/api/activities', activityRoutes);
// 选课系统（选修课）
app.use('/api/electives', electiveRoutes);
// 操作日志（审计）
app.use('/api/operation-logs', operationLogRoutes);

// WebSocket 实时通讯
require('./websockets/io').setIo(io);
require('./websockets/socketHandler')(io);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 处理
app.use('/api', notFoundHandler);

// 统一错误处理中间件
app.use(errorHandler);

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ 端口 ${PORT} 已被占用，后端可能已在运行。请先关闭占用进程后重试。`);
    } else {
      console.error('❌ 服务启动失败:', error.message);
    }
    process.exit(1);
  });
  server.listen(PORT, () => {
    console.log(`🚀 智评AI后端服务已启动: http://localhost:${PORT}`);
    console.log(`📡 WebSocket服务已启动`);
  });
}

module.exports = { app, io };
