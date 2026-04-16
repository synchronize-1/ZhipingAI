<template>
  <view class="profile-page">
    <view class="header gradient-primary">
      <view class="user-info">
        <view class="avatar">{{ user?.name?.charAt(0) || '?' }}</view>
        <view class="info">
          <text class="name">{{ user?.name || '未登录' }}</text>
          <text class="role">{{ roleText }}</text>
        </view>
      </view>
    </view>

    <view class="stats-row">
      <view class="stat-item">
        <text class="stat-value">{{ stats.courses || 0 }}</text>
        <text class="stat-label">课程</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ stats.activities || 0 }}</text>
        <text class="stat-label">活动</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ stats.honors || 0 }}</text>
        <text class="stat-label">荣誉</text>
      </view>
    </view>

    <view class="menu-section">
      <view class="menu-item" @tap="goTo('/pages/notifications/notifications')">
        <text class="menu-icon">🔔</text>
        <text class="menu-text">消息通知</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @tap="openSettings">
        <text class="menu-icon">⚙️</text>
        <text class="menu-text">课前提醒设置</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @tap="goTo('/pages/activities/activities')">
        <text class="menu-icon">🎉</text>
        <text class="menu-text">我的活动</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" @tap="goTo('/pages/profile/growth')">
        <text class="menu-icon">📊</text>
        <text class="menu-text">成长档案</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item">
        <text class="menu-icon">❓</text>
        <text class="menu-text">帮助中心</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item">
        <text class="menu-icon">ℹ️</text>
        <text class="menu-text">关于我们</text>
        <text class="menu-arrow">></text>
      </view>
    </view>

    <view class="logout-btn" @tap="handleLogout">退出登录</view>

    <!-- 设置弹窗 -->
    <view v-if="showSettings" class="modal-mask" @tap="showSettings = false">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">课前提醒设置</text>
        <view class="setting-item">
          <text>启用提醒</text>
          <switch :checked="settings.enabled" @change="settings.enabled = $event.detail.value" />
        </view>
        <view class="setting-item">
          <text>提前时间</text>
          <picker :value="minutesIndex" :range="minutesOptions" @change="minutesIndex = $event.detail.value">
            <text class="picker-text">{{ minutesOptions[minutesIndex] }}分钟</text>
          </picker>
        </view>
        <view class="setting-item">
          <text>位置感知</text>
          <switch :checked="settings.locationEnabled" @change="settings.locationEnabled = $event.detail.value" />
        </view>
        <view class="modal-btns">
          <view class="modal-btn confirm" @tap="saveSettings">保存设置</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  data() {
    return {
      user: null,
      stats: { courses: 0, activities: 0, honors: 0 },
      showSettings: false,
      settings: { enabled: true, minutesBefore: 10, locationEnabled: true },
      minutesOptions: [5, 10, 15, 30],
      minutesIndex: 1
    }
  },
  computed: {
    roleText() {
      const roles = { student: '学生', teacher: '教师', admin: '管理员' }
      return roles[this.user?.role] || '用户'
    }
  },
  onShow() {
    this.user = uni.getStorageSync('user')
    this.fetchSettings()
  },
  methods: {
    goTo(url) {
      uni.navigateTo({ url })
    },
    async fetchSettings() {
      try {
        const res = await api.notifications.reminderSettings()
        if (res.success) {
          this.settings = res.data
          this.minutesIndex = this.minutesOptions.indexOf(res.data.minutesBefore) || 1
        }
      } catch (e) {}
    },
    openSettings() {
      this.showSettings = true
    },
    async saveSettings() {
      this.settings.minutesBefore = this.minutesOptions[this.minutesIndex]
      try {
        await api.notifications.updateSettings(this.settings)
        uni.setStorageSync('reminderSettings', this.settings)
        uni.showToast({ title: '设置已保存', icon: 'success' })
        this.showSettings = false
      } catch (e) {
        uni.showToast({ title: '保存失败', icon: 'none' })
      }
    },
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('token')
            uni.removeStorageSync('user')
            uni.reLaunch({ url: '/pages/login/login' })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.profile-page { background: #faf8f5; min-height: 100vh; }

.header { padding: 80rpx 30rpx 40rpx; }
.user-info { display: flex; align-items: center; gap: 30rpx; }
.avatar { width: 120rpx; height: 120rpx; background: rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 48rpx; color: #fff; font-weight: bold; }
.name { display: block; font-size: 36rpx; font-weight: bold; color: #fff; }
.role { display: block; font-size: 26rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; }

.stats-row { display: flex; background: #fff; margin: -30rpx 20rpx 20rpx; border-radius: 20rpx; padding: 30rpx; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08); }
.stat-item { flex: 1; text-align: center; }
.stat-value { display: block; font-size: 40rpx; font-weight: bold; color: #8b6914; }
.stat-label { display: block; font-size: 24rpx; color: #999; margin-top: 8rpx; }

.menu-section { background: #fff; margin: 20rpx; border-radius: 20rpx; overflow: hidden; }
.menu-item { display: flex; align-items: center; padding: 30rpx; border-bottom: 1rpx solid #f0f0f0; }
.menu-item:last-child { border-bottom: none; }
.menu-icon { font-size: 40rpx; margin-right: 20rpx; }
.menu-text { flex: 1; font-size: 30rpx; color: #333; }
.menu-arrow { font-size: 28rpx; color: #ccc; }

.logout-btn { margin: 40rpx 20rpx; background: #fff; color: #ef4444; text-align: center; padding: 30rpx; border-radius: 20rpx; font-size: 30rpx; }

.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 999; }
.modal-content { width: 80%; background: #fff; border-radius: 24rpx; padding: 40rpx; }
.modal-title { display: block; font-size: 34rpx; font-weight: bold; text-align: center; margin-bottom: 30rpx; }
.setting-item { display: flex; align-items: center; justify-content: space-between; padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.picker-text { color: #d4a574; }
.modal-btns { margin-top: 30rpx; }
.modal-btn.confirm { background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; text-align: center; padding: 24rpx; border-radius: 40rpx; }
</style>
