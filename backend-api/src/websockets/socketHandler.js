const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (io) => {
  // 存储在线用户
  const onlineUsers = new Map();
  
  // 验证WebSocket连接
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('未提供认证令牌'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('令牌无效'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`用户连接: ${socket.user.name} (${socket.user.id})`);
    
    // 记录在线用户
    onlineUsers.set(socket.user.id, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date()
    });
    
    // 加入角色房间
    socket.join(`role:${socket.user.role}`);
    socket.join(`user:${socket.user.id}`);
    
    // 广播在线用户数量
    io.emit('online-count', onlineUsers.size);
    
    // ========== 课堂互动 ==========
    // 加入课堂
    socket.on('join-classroom', (data) => {
      const { courseId, scheduleId } = data;
      socket.join(`classroom:${courseId}:${scheduleId}`);
      
      // 通知教师有学生加入
      socket.to(`classroom:${courseId}:${scheduleId}`).emit('student-joined', {
        student: socket.user,
        timestamp: new Date()
      });
    });
    
    // 离开课堂
    socket.on('leave-classroom', (data) => {
      const { courseId, scheduleId } = data;
      socket.leave(`classroom:${courseId}:${scheduleId}`);
    });
    
    // 发送课堂消息
    socket.on('classroom-message', (data) => {
      const { courseId, scheduleId, message, type } = data;
      io.to(`classroom:${courseId}:${scheduleId}`).emit('classroom-message', {
        sender: socket.user,
        message,
        type,
        timestamp: new Date()
      });
    });
    
    // 课堂签到
    socket.on('classroom-checkin', (data) => {
      const { courseId, scheduleId, location } = data;
      io.to(`classroom:${courseId}:${scheduleId}`).emit('checkin-update', {
        student: socket.user,
        location,
        timestamp: new Date()
      });
    });
    
    // 实时提问
    socket.on('ask-question', (data) => {
      const { courseId, scheduleId, question, isAnonymous } = data;
      io.to(`classroom:${courseId}:${scheduleId}`).emit('new-question', {
        sender: isAnonymous ? { name: '匿名' } : socket.user,
        question,
        timestamp: new Date()
      });
    });
    
    // ========== 实时通知 ==========
    // 发送通知给特定用户
    socket.on('send-notification', (data) => {
      const { targetUserId, notification } = data;
      io.to(`user:${targetUserId}`).emit('notification', {
        ...notification,
        timestamp: new Date()
      });
    });
    
    // 发送通知给特定角色
    socket.on('broadcast-to-role', (data) => {
      const { targetRole, notification } = data;
      io.to(`role:${targetRole}`).emit('notification', {
        ...notification,
        timestamp: new Date()
      });
    });
    
    // ========== 食堂人流实时更新 ==========
    socket.on('subscribe-canteen', (canteenId) => {
      socket.join(`canteen:${canteenId}`);
    });
    
    socket.on('unsubscribe-canteen', (canteenId) => {
      socket.leave(`canteen:${canteenId}`);
    });
    
    // ========== 位置更新（用于课前提醒） ==========
    socket.on('location-update', async (data) => {
      const { latitude, longitude } = data;
      
      // 检查是否有即将上课的课程
      const Schedule = require('../models/Schedule');
      const upcomingClass = await Schedule.getUpcomingClass(socket.user.id, 30);
      
      if (upcomingClass) {
        const { latitude: roomLat, longitude: roomLng, room_name, course_name, start_time } = upcomingClass;
        
        if (roomLat && roomLng) {
          const distance = Math.sqrt(
            Math.pow((latitude - roomLat) * 111000, 2) + 
            Math.pow((longitude - roomLng) * 111000 * Math.cos(latitude * Math.PI / 180), 2)
          );
          
          if (distance > 100) {
            socket.emit('class-reminder', {
              course: course_name,
              room: room_name,
              startTime: start_time,
              distance: Math.round(distance),
              message: `${course_name} 即将在 ${room_name} 开始，距离您约 ${Math.round(distance)} 米`
            });
          }
        }
      }
    });
    
    // ========== 紧急通知 ==========
    socket.on('emergency-broadcast', (data) => {
      if (socket.user.role === 'admin') {
        io.emit('emergency-notification', {
          ...data,
          sender: socket.user,
          timestamp: new Date()
        });
      }
    });
    
    // ========== 报修服务实时交互 ==========
    // 提交报修 - 通知管理员
    socket.on('submit-repair', (data) => {
      const repairData = {
        ...data,
        submitter: socket.user,
        timestamp: new Date(),
        status: 'pending'
      };
      // 通知所有管理员
      io.to('role:admin').emit('new-repair-request', repairData);
      // 确认提交者
      socket.emit('repair-submitted', { 
        success: true, 
        message: '报修已提交，管理员将尽快处理',
        repairId: data.id 
      });
    });
    
    // 管理员处理报修 - 通知提交者
    socket.on('update-repair-status', (data) => {
      if (socket.user.role === 'admin') {
        const { repairId, status, remark, submitterId } = data;
        // 通知报修提交者
        io.to(`user:${submitterId}`).emit('repair-status-updated', {
          repairId,
          status,
          remark,
          handler: socket.user.name,
          timestamp: new Date()
        });
        // 广播给所有管理员
        io.to('role:admin').emit('repair-list-updated', { repairId, status });
      }
    });
    
    // ========== 设备预约实时交互 ==========
    // 提交预约申请
    socket.on('submit-equipment-reservation', (data) => {
      const reservationData = {
        ...data,
        applicant: socket.user,
        timestamp: new Date(),
        status: 'pending'
      };
      // 通知管理员
      io.to('role:admin').emit('new-equipment-reservation', reservationData);
      socket.emit('reservation-submitted', { 
        success: true, 
        message: '预约申请已提交，等待审批' 
      });
    });
    
    // 管理员审批预约
    socket.on('approve-reservation', (data) => {
      if (socket.user.role === 'admin') {
        const { reservationId, approved, remark, applicantId } = data;
        io.to(`user:${applicantId}`).emit('reservation-result', {
          reservationId,
          approved,
          remark,
          approver: socket.user.name,
          timestamp: new Date()
        });
      }
    });
    
    // ========== 课堂签到实时交互 ==========
    // 教师发起签到
    socket.on('start-checkin', (data) => {
      if (socket.user.role === 'teacher' || socket.user.role === 'admin') {
        const { courseId, scheduleId, duration, location } = data;
        const checkinData = {
          courseId,
          scheduleId,
          duration,
          location,
          startTime: new Date(),
          teacher: socket.user,
          checkedStudents: []
        };
        // 通知该课堂的所有学生
        io.to(`classroom:${courseId}:${scheduleId}`).emit('checkin-started', checkinData);
        // 存储签到信息
        socket.checkinData = checkinData;
      }
    });
    
    // 学生完成签到
    socket.on('student-checkin', (data) => {
      const { courseId, scheduleId, location } = data;
      const checkinResult = {
        student: socket.user,
        location,
        timestamp: new Date(),
        status: 'success'
      };
      // 通知教师
      io.to(`classroom:${courseId}:${scheduleId}`).emit('student-checked-in', checkinResult);
      // 确认学生
      socket.emit('checkin-confirmed', { success: true, message: '签到成功' });
    });
    
    // 教师结束签到
    socket.on('end-checkin', (data) => {
      if (socket.user.role === 'teacher' || socket.user.role === 'admin') {
        const { courseId, scheduleId } = data;
        io.to(`classroom:${courseId}:${scheduleId}`).emit('checkin-ended', {
          endTime: new Date(),
          teacher: socket.user
        });
      }
    });
    
    // ========== 活动报名实时交互 ==========
    socket.on('join-activity', (data) => {
      const { activityId, activityName, organizerId } = data;
      // 通知活动组织者
      io.to(`user:${organizerId}`).emit('new-activity-participant', {
        activityId,
        activityName,
        participant: socket.user,
        timestamp: new Date()
      });
      // 确认报名者
      socket.emit('activity-joined', { success: true, activityId });
    });
    
    // 活动通知
    socket.on('notify-activity-participants', (data) => {
      const { activityId, message, participantIds } = data;
      participantIds.forEach(userId => {
        io.to(`user:${userId}`).emit('activity-notification', {
          activityId,
          message,
          timestamp: new Date()
        });
      });
    });
    
    // ========== 图书借阅实时交互 ==========
    socket.on('borrow-book', (data) => {
      const { bookId, bookName } = data;
      // 通知管理员
      io.to('role:admin').emit('new-book-borrow', {
        bookId,
        bookName,
        borrower: socket.user,
        timestamp: new Date()
      });
    });
    
    socket.on('return-book', (data) => {
      const { bookId, bookName } = data;
      io.to('role:admin').emit('book-returned', {
        bookId,
        bookName,
        returner: socket.user,
        timestamp: new Date()
      });
    });
    
    // 断开连接
    socket.on('disconnect', () => {
      console.log(`用户断开: ${socket.user.name} (${socket.user.id})`);
      onlineUsers.delete(socket.user.id);
      io.emit('online-count', onlineUsers.size);
    });
  });
  
  // 定时广播食堂人流数据
  setInterval(async () => {
    try {
      const Service = require('../models/Service');
      const crowdLevels = await Service.getAllCanteenCrowdLevels();
      
      crowdLevels.forEach(canteen => {
        io.to(`canteen:${canteen.id}`).emit('canteen-crowd-update', {
          canteenId: canteen.id,
          crowdLevel: canteen.crowd_level,
          currentCount: canteen.current_count,
          timestamp: new Date()
        });
      });
    } catch (error) {
      console.error('广播食堂人流数据错误:', error);
    }
  }, 60000); // 每分钟更新一次
  
  return io;
};
