const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const courseRoutes = require('./routes/course');
const scheduleRoutes = require('./routes/schedule');
const serviceRoutes = require('./routes/service');
const securityRoutes = require('./routes/security');
const dashboardRoutes = require('./routes/dashboard');
const socialRoutes = require('./routes/social');
const notificationRoutes = require('./routes/notification');
const aiAgentRoutes = require('./routes/aiAgent');
const aiScienceRoutes = require('./routes/aiScience');

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

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiAgentRoutes);
app.use('/api/ai-science', aiScienceRoutes);

// WebSocket 实时通讯
require('./websockets/socketHandler')(io);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000||3001;
server.listen(PORT, () => {
  console.log(`🚀 智评AI后端服务已启动: http://localhost:${PORT}`);
  console.log(`📡 WebSocket服务已启动`);
});

module.exports = { app, io };
