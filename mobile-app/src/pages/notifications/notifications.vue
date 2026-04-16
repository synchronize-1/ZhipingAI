<template>
  <view class="notifications-page">
    <view class="header-actions">
      <view class="action-btn" @tap="markAllRead">全部已读</view>
    </view>

    <view v-for="notification in notifications" :key="notification.id" 
          class="notification-item" :class="{ unread: !notification.is_read }"
          @tap="markRead(notification)">
      <view class="notification-icon" :class="notification.type">
        <text>{{ getIcon(notification.type) }}</text>
      </view>
      <view class="notification-content">
        <text class="notification-title">{{ notification.title }}</text>
        <text class="notification-text">{{ notification.content }}</text>
        <text class="notification-time">{{ formatTime(notification.created_at) }}</text>
      </view>
    </view>

    <view v-if="!notifications.length" class="empty-state">
      <text class="empty-icon">📭</text>
      <text class="empty-text">暂无通知</text>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  data() {
    return {
      notifications: []
    }
  },
  onShow() {
    this.fetchNotifications()
  },
  methods: {
    async fetchNotifications() {
      try {
        const res = await api.notifications.list()
        if (res.success) this.notifications = res.data?.notifications || []
      } catch (e) {}
      
      // 合并本地通知（点餐、活动报名等）
      const localNotifications = uni.getStorageSync('localNotifications') || []
      if (localNotifications.length > 0) {
        this.notifications = [...localNotifications, ...this.notifications]
      }
    },
    getIcon(type) {
      const icons = { system: '🔔', course: '📚', activity: '🎉', service: '🔧', emergency: '⚠️' }
      return icons[type] || '🔔'
    },
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    async markRead(notification) {
      if (notification.is_read) return
      try {
        await api.notifications.markRead(notification.id)
        notification.is_read = true
      } catch (e) {}
    },
    async markAllRead() {
      try {
        await api.notifications.markAllRead()
        this.notifications.forEach(n => n.is_read = true)
        uni.showToast({ title: '已全部标记为已读', icon: 'success' })
      } catch (e) {}
    }
  }
}
</script>

<style scoped>
.notifications-page { background: #faf8f5; min-height: 100vh; }

.header-actions { padding: 20rpx; display: flex; justify-content: flex-end; }
.action-btn { padding: 15rpx 30rpx; background: #fff; border-radius: 30rpx; font-size: 26rpx; color: #d4a574; }

.notification-item { display: flex; gap: 20rpx; padding: 30rpx; background: #fff; margin: 0 20rpx 2rpx; }
.notification-item:first-of-type { border-radius: 20rpx 20rpx 0 0; margin-top: 0; }
.notification-item:last-of-type { border-radius: 0 0 20rpx 20rpx; }
.notification-item.unread { background: #faf5eb; }

.notification-icon { width: 80rpx; height: 80rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36rpx; background: #e5e7eb; }
.notification-icon.system { background: #f5e6d3; }
.notification-icon.course { background: #d1fae5; }
.notification-icon.activity { background: #fae8ff; }
.notification-icon.emergency { background: #fee2e2; }

.notification-content { flex: 1; }
.notification-title { display: block; font-size: 30rpx; font-weight: 500; color: #333; margin-bottom: 8rpx; }
.notification-text { display: block; font-size: 26rpx; color: #666; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.notification-time { display: block; font-size: 24rpx; color: #999; margin-top: 10rpx; }

.empty-state { text-align: center; padding: 100rpx; }
.empty-icon { font-size: 80rpx; display: block; }
.empty-text { font-size: 28rpx; color: #999; display: block; margin-top: 20rpx; }
</style>
