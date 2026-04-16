<template>
  <view class="index-page">
    <!-- 顶部区域 -->
    <view class="header gradient-primary">
      <view class="header-content">
        <view class="greeting">
          <text class="greeting-text">{{ greeting.greeting }}</text>
          <text class="greeting-sub">{{ greeting.encouragement }}</text>
        </view>
        <view class="header-actions">
          <view class="action-btn" @tap="goNotifications">
            <text>🔔</text>
            <view v-if="unreadCount" class="badge">{{ unreadCount }}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-actions card">
      <view class="action-grid">
        <view v-for="action in quickActions" :key="action.name" class="action-item" @tap="handleAction(action)">
          <view class="action-icon" :style="{ background: action.color }">
            <text>{{ action.icon }}</text>
          </view>
          <text class="action-name">{{ action.name }}</text>
        </view>
      </view>
    </view>

    <!-- 今日课程 -->
    <view class="section card">
      <view class="section-header">
        <text class="section-title">今日课程</text>
        <text class="section-more" @tap="goSchedule">查看全部 ></text>
      </view>
      <view v-if="todaySchedule.length" class="course-list">
        <view v-for="course in todaySchedule" :key="course.id" class="course-item">
          <view class="course-time">
            <text class="time-start">{{ course.start_time?.slice(0,5) }}</text>
            <text class="time-end">{{ course.end_time?.slice(0,5) }}</text>
          </view>
          <view class="course-info">
            <text class="course-name">{{ course.course_name }}</text>
            <text class="course-location">📍 {{ course.room_name || '待定' }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-tip">
        <text>今天没有课程安排 🎉</text>
      </view>
    </view>

    <!-- 校园服务 -->
    <view class="section card">
      <view class="section-header">
        <text class="section-title">校园服务</text>
      </view>
      <view class="service-grid">
        <view v-for="service in services" :key="service.name" class="service-item" @tap="goService(service)">
          <text class="service-icon">{{ service.icon }}</text>
          <text class="service-name">{{ service.name }}</text>
        </view>
      </view>
    </view>

    <!-- 绿色提示 -->
    <view class="green-tip card">
      <text class="tip-icon">🌱</text>
      <text class="tip-text">{{ greenTip }}</text>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  data() {
    return {
      user: null,
      greeting: { greeting: '你好！', encouragement: '今天也要加油哦！' },
      todaySchedule: [],
      unreadCount: 0,
      greenTip: '随手关灯，节约用电，共建绿色校园',
      quickActions: [
        { name: 'AI科普', icon: '🤖', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', url: '/pages/ai-science/index' },
        { name: '校园导航', icon: '🗺️', color: 'linear-gradient(135deg, #b8956c 0%, #a67c52 100%)', url: '/pages/map/map' },
        { name: '食堂人流', icon: '🍜', color: 'linear-gradient(135deg, #c9a86c 0%, #b8956c 100%)', url: '/pages/canteen/canteen' },
        { name: '校园活动', icon: '🎉', color: 'linear-gradient(135deg, #8fbc8f 0%, #6b8e6b 100%)', url: '/pages/activities/activities' }
      ],
      services: [
        { name: '图书借阅', icon: '📚', url: '/pages/services/services' },
        { name: '报修服务', icon: '🔧', url: '/pages/services/services' },
        { name: '设备预约', icon: '💻', url: '/pages/services/services' },
        { name: '在线点餐', icon: '🍔', url: '/pages/services/services' }
      ]
    }
  },
  onShow() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.user = uni.getStorageSync('user')
      
      try {
        const [greetingRes, scheduleRes, notifyRes, tipsRes] = await Promise.all([
          api.social.greeting(),
          api.schedules.today(),
          api.notifications.list(),
          api.security.greenTips()
        ])
        
        if (greetingRes.success) this.greeting = greetingRes.data
        if (scheduleRes.success) this.todaySchedule = scheduleRes.data || []
        if (notifyRes.success) this.unreadCount = notifyRes.data?.unreadCount || 0
        if (tipsRes.success && tipsRes.data?.length) this.greenTip = tipsRes.data[0].content
      } catch (e) {
        console.error(e)
      }
      
      // 检查课前提醒
      this.checkClassReminder()
    },
    async checkClassReminder() {
      try {
        const res = await api.schedules.upcoming(30)
        if (res.success && res.data) {
          const settings = uni.getStorageSync('reminderSettings') || { enabled: true }
          if (settings.enabled) {
            uni.showModal({
              title: '课前提醒',
              content: `${res.data.course_name} 即将在 ${res.data.room_name} 开始`,
              showCancel: false
            })
          }
        }
      } catch (e) {}
    },
    handleAction(action) {
      uni.navigateTo({ url: action.url })
    },
    goService(service) {
      uni.navigateTo({ url: service.url })
    },
    goSchedule() {
      uni.switchTab({ url: '/pages/schedule/schedule' })
    },
    goNotifications() {
      uni.navigateTo({ url: '/pages/notifications/notifications' })
    }
  }
}
</script>

<style scoped>
.index-page { background: #faf8f5; min-height: 100vh; padding-bottom: 120rpx; }

.header { padding: 80rpx 30rpx 60rpx; border-radius: 0 0 40rpx 40rpx; }
.header-content { display: flex; justify-content: space-between; align-items: flex-start; }
.greeting-text { display: block; font-size: 40rpx; font-weight: bold; color: #fff; }
.greeting-sub { display: block; font-size: 26rpx; color: rgba(255,255,255,0.8); margin-top: 10rpx; }
.action-btn { position: relative; width: 70rpx; height: 70rpx; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36rpx; }
.badge { position: absolute; top: -5rpx; right: -5rpx; background: #ef4444; color: #fff; font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 20rpx; }

.card { background: #fff; border-radius: 24rpx; margin: 20rpx; padding: 30rpx; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05); }

.quick-actions { margin-top: -40rpx; }
.action-grid { display: flex; justify-content: space-around; }
.action-item { display: flex; flex-direction: column; align-items: center; }
.action-icon { width: 100rpx; height: 100rpx; border-radius: 24rpx; display: flex; align-items: center; justify-content: center; font-size: 44rpx; margin-bottom: 15rpx; }
.action-name { font-size: 24rpx; color: #666; }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25rpx; }
.section-title { font-size: 32rpx; font-weight: bold; color: #333; }
.section-more { font-size: 24rpx; color: #d4a574; }

.course-list { display: flex; flex-direction: column; }
.course-item { display: flex; align-items: center; padding: 20rpx; background: #f8fafc; border-radius: 16rpx; margin-bottom: 15rpx; }
.course-time { width: 120rpx; text-align: center; border-right: 2rpx solid #e5e7eb; padding-right: 20rpx; margin-right: 20rpx; }
.time-start { display: block; font-size: 30rpx; font-weight: bold; color: #8b6914; }
.time-end { display: block; font-size: 24rpx; color: #999; }
.course-name { display: block; font-size: 30rpx; font-weight: 500; color: #333; }
.course-location { display: block; font-size: 24rpx; color: #666; margin-top: 8rpx; }

.empty-tip { text-align: center; padding: 40rpx; color: #999; font-size: 28rpx; }

.service-grid { display: flex; flex-wrap: wrap; }
.service-item { width: 25%; display: flex; flex-direction: column; align-items: center; padding: 20rpx 0; }
.service-icon { font-size: 48rpx; margin-bottom: 10rpx; }
.service-name { font-size: 24rpx; color: #666; }

.green-tip { display: flex; align-items: center; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); }
.tip-icon { font-size: 40rpx; margin-right: 20rpx; }
.tip-text { flex: 1; font-size: 26rpx; color: #059669; }
</style>
