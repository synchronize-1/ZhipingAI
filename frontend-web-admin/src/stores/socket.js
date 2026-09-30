import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import { ElNotification, ElMessageBox } from 'element-plus'
import { useUserStore } from './user'

export const useSocketStore = defineStore('socket', {
  state: () => ({
    socket: null,
    connected: false,
    onlineCount: 0,
    notifications: [],
    repairRequests: [],
    equipmentReservations: [],
    checkinSessions: new Map()
  }),
  
  actions: {
    connect() {
      const userStore = useUserStore()
      if (!userStore.token || this.socket) return
      
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      
      this.socket = io(baseUrl, {
        auth: { token: userStore.token },
        transports: ['websocket', 'polling']
      })
      
      this.socket.on('connect', () => {
        console.log('WebSocket已连接')
        this.connected = true
      })
      
      this.socket.on('disconnect', () => {
        console.log('WebSocket已断开')
        this.connected = false
      })
      
      this.socket.on('online-count', (count) => {
        this.onlineCount = count
      })
      
      // ========== 报修服务实时事件 ==========
      this.socket.on('new-repair-request', (data) => {
        this.repairRequests.unshift(data)
        ElNotification({
          title: '📋 新报修请求',
          message: `${data.submitter.name} 提交了报修：${data.title}`,
          type: 'warning',
          duration: 5000,
          position: 'top-right'
        })
      })
      
      this.socket.on('repair-status-updated', (data) => {
        const statusText = {
          pending: '待处理',
          processing: '处理中',
          completed: '已完成'
        }
        ElNotification({
          title: '🔧 报修状态更新',
          message: `您的报修单已更新为"${statusText[data.status]}"，处理人：${data.handler}`,
          type: data.status === 'completed' ? 'success' : 'info',
          duration: 5000
        })
      })
      
      this.socket.on('repair-list-updated', (data) => {
        // 触发列表刷新事件
        window.dispatchEvent(new CustomEvent('repair-updated', { detail: data }))
      })
      
      // ========== 设备预约实时事件 ==========
      this.socket.on('new-equipment-reservation', (data) => {
        this.equipmentReservations.unshift(data)
        ElNotification({
          title: '💻 新设备预约',
          message: `${data.applicant.name} 申请预约：${data.equipmentName}`,
          type: 'warning',
          duration: 5000
        })
      })
      
      this.socket.on('reservation-result', (data) => {
        ElNotification({
          title: data.approved ? '✅ 预约已批准' : '❌ 预约被拒绝',
          message: data.remark || (data.approved ? '您的设备预约已通过审批' : '您的设备预约未通过审批'),
          type: data.approved ? 'success' : 'error',
          duration: 5000
        })
      })
      
      // ========== 课堂签到实时事件 ==========
      this.socket.on('checkin-started', (data) => {
        ElMessageBox.confirm(
          `${data.teacher.name} 老师发起了签到，请在 ${data.duration} 秒内完成签到`,
          '📝 课堂签到',
          {
            confirmButtonText: '立即签到',
            cancelButtonText: '稍后',
            type: 'warning'
          }
        ).then(() => {
          this.studentCheckin(data.courseId, data.scheduleId)
        }).catch(() => {})
      })
      
      this.socket.on('student-checked-in', (data) => {
        // 教师端收到学生签到通知
        window.dispatchEvent(new CustomEvent('student-checkin', { detail: data }))
      })
      
      this.socket.on('checkin-ended', (data) => {
        ElNotification({
          title: '签到结束',
          message: '本次课堂签到已结束',
          type: 'info',
          duration: 3000
        })
      })
      
      // ========== 活动相关实时事件 ==========
      this.socket.on('new-activity-participant', (data) => {
        ElNotification({
          title: '🎉 新活动报名',
          message: `${data.participant.name} 报名了活动：${data.activityName}`,
          type: 'success',
          duration: 3000
        })
      })
      
      this.socket.on('activity-notification', (data) => {
        ElNotification({
          title: '📢 活动通知',
          message: data.message,
          type: 'info',
          duration: 5000
        })
      })
      
      // ========== 图书借阅实时事件 ==========
      this.socket.on('new-book-borrow', (data) => {
        ElNotification({
          title: '📚 图书借阅',
          message: `${data.borrower.name} 借阅了《${data.bookName}》`,
          type: 'info',
          duration: 3000
        })
      })
      
      this.socket.on('book-returned', (data) => {
        ElNotification({
          title: '📚 图书归还',
          message: `${data.returner.name} 归还了《${data.bookName}》`,
          type: 'success',
          duration: 3000
        })
      })
      
      // ========== 紧急通知 ==========
      this.socket.on('emergency-notification', (data) => {
        ElMessageBox.alert(data.content, `⚠️ 紧急通知: ${data.title}`, {
          confirmButtonText: '我知道了',
          type: 'error',
          center: true
        })
      })
      
      // ========== 通用通知 ==========
      this.socket.on('notification', (data) => {
        this.notifications.unshift(data)
        ElNotification({
          title: data.title || '新通知',
          message: data.content || data.message,
          type: data.type || 'info',
          duration: 4000
        })
        // 通知顶部栏刷新未读角标与通知页列表
        window.dispatchEvent(new CustomEvent('app-notification', { detail: data }))
      })
    },
    
    disconnect() {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
        this.connected = false
      }
    },
    
    // ========== 报修服务方法 ==========
    submitRepair(repairData) {
      if (this.socket && this.connected) {
        this.socket.emit('submit-repair', repairData)
      }
    },
    
    updateRepairStatus(repairId, status, remark, submitterId) {
      if (this.socket && this.connected) {
        this.socket.emit('update-repair-status', { repairId, status, remark, submitterId })
      }
    },
    
    // ========== 设备预约方法 ==========
    submitEquipmentReservation(data) {
      if (this.socket && this.connected) {
        this.socket.emit('submit-equipment-reservation', data)
      }
    },
    
    approveReservation(reservationId, approved, remark, applicantId) {
      if (this.socket && this.connected) {
        this.socket.emit('approve-reservation', { reservationId, approved, remark, applicantId })
      }
    },
    
    // ========== 课堂方法 ==========
    joinClassroom(courseId, scheduleId) {
      if (this.socket && this.connected) {
        this.socket.emit('join-classroom', { courseId, scheduleId })
      }
    },
    
    leaveClassroom(courseId, scheduleId) {
      if (this.socket && this.connected) {
        this.socket.emit('leave-classroom', { courseId, scheduleId })
      }
    },
    
    startCheckin(courseId, scheduleId, duration = 60, location = null) {
      if (this.socket && this.connected) {
        this.socket.emit('start-checkin', { courseId, scheduleId, duration, location })
      }
    },
    
    studentCheckin(courseId, scheduleId, location = null) {
      if (this.socket && this.connected) {
        this.socket.emit('student-checkin', { courseId, scheduleId, location })
      }
    },
    
    endCheckin(courseId, scheduleId) {
      if (this.socket && this.connected) {
        this.socket.emit('end-checkin', { courseId, scheduleId })
      }
    },
    
    // ========== 活动方法 ==========
    joinActivity(activityId, activityName, organizerId) {
      if (this.socket && this.connected) {
        this.socket.emit('join-activity', { activityId, activityName, organizerId })
      }
    },
    
    notifyActivityParticipants(activityId, message, participantIds) {
      if (this.socket && this.connected) {
        this.socket.emit('notify-activity-participants', { activityId, message, participantIds })
      }
    },
    
    // ========== 图书方法 ==========
    borrowBook(bookId, bookName) {
      if (this.socket && this.connected) {
        this.socket.emit('borrow-book', { bookId, bookName })
      }
    },
    
    returnBook(bookId, bookName) {
      if (this.socket && this.connected) {
        this.socket.emit('return-book', { bookId, bookName })
      }
    },
    
    // ========== 紧急广播 ==========
    emergencyBroadcast(title, content, type = 'warning') {
      if (this.socket && this.connected) {
        this.socket.emit('emergency-broadcast', { title, content, type })
      }
    },
    
    // ========== 食堂订阅 ==========
    subscribeCanteen(canteenId) {
      if (this.socket && this.connected) {
        this.socket.emit('subscribe-canteen', canteenId)
      }
    },
    
    unsubscribeCanteen(canteenId) {
      if (this.socket && this.connected) {
        this.socket.emit('unsubscribe-canteen', canteenId)
      }
    },
    
    // ========== 本地通知方法（用于前端交互后添加通知） ==========
    addLocalNotification(notification) {
      const userStore = useUserStore()
      const currentRole = userStore.user?.role || 'student'
      const userId = userStore.user?.id || 'unknown'
      
      const newNotification = {
        id: Date.now(),
        ...notification,
        time: notification.time || new Date().toISOString(),
        read: false,
        targetRole: notification.targetRole || currentRole
      }
      
      // 只有非全局通知才设置sourceUserId和sourceUserName（如果没有提供的话）
      // 全局通知（targetRole为'all'）不设置，这样所有角色都能看到
      if (notification.targetRole !== 'all') {
        if (!newNotification.sourceUserId) {
          newNotification.sourceUserId = userId
        }
        if (!newNotification.sourceUserName) {
          newNotification.sourceUserName = userStore.user?.name || '未知用户'
        }
        if (!newNotification.sourceUserRole) {
          newNotification.sourceUserRole = currentRole
        }
      }
      
      this.notifications.unshift(newNotification)
      
      // 保存到全局通知存储（所有角色共享）
      const stored = JSON.parse(localStorage.getItem('globalNotifications') || '[]')
      stored.unshift(newNotification)
      localStorage.setItem('globalNotifications', JSON.stringify(stored.slice(0, 100)))
      
      // 显示通知弹窗
      ElNotification({
        title: notification.title || '新通知',
        message: notification.content,
        type: notification.type === 'activity' ? 'success' : notification.type === 'order' ? 'warning' : 'info',
        duration: 4000
      })
    },
    
    // 获取本地通知（根据角色过滤）
    getLocalNotifications(filterRole = null) {
      const userStore = useUserStore()
      const currentRole = userStore.user?.role || 'student'
      const currentUserId = userStore.user?.id || 'unknown'
      
      // 读取全局通知
      const globalNotifications = JSON.parse(localStorage.getItem('globalNotifications') || '[]')
      // 兼容旧数据
      const oldNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]')
      
      // 合并通知，去重
      const allNotifications = [...globalNotifications]
      oldNotifications.forEach(n => {
        if (!allNotifications.find(g => g.id === n.id)) {
          // 旧通知默认为当前用户角色
          n.targetRole = n.targetRole || currentRole
          allNotifications.push(n)
        }
      })
      
      // 管理员看到所有通知（筛选在视图层完成）
      if (currentRole === 'admin') {
        return allNotifications
      }
      
      // 学生端：只看到自己创建的通知 + 针对所有学生的系统通知
      if (currentRole === 'student') {
        return allNotifications.filter(n => {
          // 自己创建的通知（签到、报名等）
          if (n.sourceUserId === currentUserId) {
            return true
          }
          // 系统通知（targetRole为all或student，且没有sourceUserId，表示是系统广播）
          if ((n.targetRole === 'all' || n.targetRole === 'student') && !n.sourceUserId) {
            return true
          }
          return false
        })
      }
      
      // 教师端：只看到自己创建的通知 + 针对所有教师的系统通知 + 学生签到等教师需要知道的通知
      if (currentRole === 'teacher') {
        return allNotifications.filter(n => {
          // 自己创建的通知
          if (n.sourceUserId === currentUserId) {
            return true
          }
          // 系统通知（targetRole为all或teacher）
          if ((n.targetRole === 'all' || n.targetRole === 'teacher') && !n.sourceUserId) {
            return true
          }
          // 学生的签到、报名等通知（targetRole为admin或teacher，表示需要通知管理员/教师）
          if ((n.targetRole === 'admin' || n.targetRole === 'teacher') && n.sourceUserId && n.sourceUserId !== currentUserId) {
            return true
          }
          return false
        })
      }
      
      // 其他角色：只能看到自己的通知和全局通知
      return allNotifications.filter(n => 
        n.targetRole === currentRole || 
        n.targetRole === 'all' ||
        n.sourceUserId === currentUserId
      )
    },
    
    // 清除已读通知
    markNotificationRead(id) {
      const stored = JSON.parse(localStorage.getItem('globalNotifications') || '[]')
      const notification = stored.find(n => n.id === id)
      if (notification) {
        notification.read = true
        localStorage.setItem('globalNotifications', JSON.stringify(stored))
      }
      // 兼容旧数据
      const oldStored = JSON.parse(localStorage.getItem('localNotifications') || '[]')
      const oldNotification = oldStored.find(n => n.id === id)
      if (oldNotification) {
        oldNotification.read = true
        localStorage.setItem('localNotifications', JSON.stringify(oldStored))
      }
    },
    
    // 清除所有本地通知（用于测试）
    clearLocalNotifications() {
      localStorage.removeItem('globalNotifications')
      localStorage.removeItem('localNotifications')
      this.notifications = []
    }
  }
})
