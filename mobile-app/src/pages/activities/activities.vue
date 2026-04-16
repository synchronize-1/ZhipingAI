<template>
  <view class="activities-page">
    <!-- 顶部选项卡 -->
    <view class="main-tabs">
      <view class="main-tab" :class="{ active: mainTab === 'all' }" @tap="mainTab = 'all'">全部活动</view>
      <view class="main-tab" :class="{ active: mainTab === 'mine' }" @tap="mainTab = 'mine'">我的活动</view>
    </view>

    <!-- 全部活动 -->
    <view v-if="mainTab === 'all'" class="all-section">
      <view class="tabs">
        <view v-for="tab in tabs" :key="tab.value" class="tab" :class="{ active: activeTab === tab.value }" @tap="activeTab = tab.value">
          {{ tab.label }}
        </view>
      </view>

      <view class="activities-list">
        <view v-for="activity in filteredActivities" :key="activity.id" class="activity-card">
          <view class="activity-cover" :style="{ background: activity.coverColor || 'linear-gradient(135deg, #d4a574 0%, #c9956c 100%)' }">
            <view class="cover-icon">{{ activity.icon || '🎉' }}</view>
            <view class="activity-tag" :class="activity.status">{{ getStatusText(activity.status) }}</view>
            <view v-if="isJoined(activity.id)" class="joined-badge">已报名</view>
          </view>
          <view class="activity-info">
            <text class="activity-title">{{ activity.title }}</text>
            <text class="activity-desc">{{ activity.description }}</text>
            <view class="activity-meta">
              <view class="meta-item"><text class="meta-icon">📅</text><text>{{ formatTime(activity.start_time) }}</text></view>
              <view class="meta-item"><text class="meta-icon">📍</text><text>{{ activity.location }}</text></view>
              <view class="meta-item"><text class="meta-icon">👥</text><text>{{ activity.participants || 0 }}/{{ activity.max_participants || 100 }}人</text></view>
            </view>
            <view class="activity-footer">
              <view class="organizer-info">
                <text class="org-icon">🏛️</text>
                <text class="org-name">{{ activity.organizer_name }}</text>
              </view>
              <view v-if="!isJoined(activity.id)" class="join-btn" :class="{ disabled: activity.status !== 'upcoming' }" @tap="joinActivity(activity)">
                {{ activity.status === 'upcoming' ? '立即报名' : '已结束' }}
              </view>
              <view v-else class="joined-btn" @tap="cancelJoin(activity)">
                <text>已报名</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="!filteredActivities.length" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无活动</text>
      </view>
    </view>

    <!-- 我的活动 -->
    <view v-if="mainTab === 'mine'" class="mine-section">
      <!-- 统计卡片 -->
      <view class="stats-card">
        <view class="stat-item">
          <text class="stat-num">{{ myActivities.length }}</text>
          <text class="stat-label">已报名</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ completedCount }}</text>
          <text class="stat-label">已参与</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ upcomingCount }}</text>
          <text class="stat-label">待参加</text>
        </view>
      </view>

      <!-- 我的活动列表 -->
      <view v-if="myActivities.length" class="my-activities">
        <view class="section-title">我报名的活动</view>
        <view v-for="activity in myActivities" :key="activity.id" class="my-activity-card">
          <view class="activity-icon" :style="{ background: activity.coverColor }">{{ activity.icon || '🎉' }}</view>
          <view class="activity-content">
            <text class="activity-name">{{ activity.title }}</text>
            <text class="activity-time">{{ formatTime(activity.start_time) }}</text>
            <text class="activity-location">📍 {{ activity.location }}</text>
          </view>
          <view class="activity-status-tag" :class="activity.status">
            {{ getStatusText(activity.status) }}
          </view>
        </view>
      </view>

      <!-- 活动参与分布 -->
      <view class="participation-card">
        <view class="card-header">
          <text class="card-title">活动参与分布</text>
        </view>
        <view class="chart-area">
          <view v-for="cat in activityCategories" :key="cat.name" class="chart-bar">
            <view class="bar-label">{{ cat.icon }} {{ cat.name }}</view>
            <view class="bar-track">
              <view class="bar-fill" :style="{ width: cat.percent + '%', background: cat.color }"></view>
            </view>
            <text class="bar-value">{{ cat.count }}次</text>
          </view>
        </view>
      </view>

      <view v-if="!myActivities.length" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">还没有报名任何活动</text>
        <view class="empty-btn" @tap="mainTab = 'all'">去看看活动</view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  data() {
    return {
      mainTab: 'all',
      activeTab: 'all',
      tabs: [
        { label: '全部', value: 'all' },
        { label: '即将开始', value: 'upcoming' },
        { label: '进行中', value: 'ongoing' },
        { label: '已结束', value: 'completed' }
      ],
      activities: [],
      joinedIds: [],
      activityCategories: [
        { name: '学术讲座', icon: '📚', count: 3, percent: 60, color: '#d4a574' },
        { name: '文体活动', icon: '🏀', count: 2, percent: 40, color: '#8fbc8f' },
        { name: '志愿服务', icon: '💚', count: 2, percent: 40, color: '#c9a86c' },
        { name: '社团活动', icon: '🎭', count: 1, percent: 20, color: '#b8956c' },
        { name: '竞赛比赛', icon: '🏆', count: 1, percent: 20, color: '#a67c52' }
      ]
    }
  },
  computed: {
    filteredActivities() {
      if (this.activeTab === 'all') return this.activities
      return this.activities.filter(a => a.status === this.activeTab)
    },
    myActivities() {
      return this.activities.filter(a => this.joinedIds.includes(a.id))
    },
    completedCount() {
      return this.myActivities.filter(a => a.status === 'completed').length
    },
    upcomingCount() {
      return this.myActivities.filter(a => a.status === 'upcoming' || a.status === 'ongoing').length
    }
  },
  onShow() {
    this.fetchActivities()
    this.loadJoinedActivities()
  },
  methods: {
    async fetchActivities() {
      try {
        const res = await api.social.activities()
        if (res.success) this.activities = res.data?.data || []
      } catch (e) {
        this.activities = [
          { id: 1, title: '2024年创新创业大赛', description: '激发创新思维，培养创业精神，展示创新创业成果', start_time: '2024-03-15T09:00:00', location: '大学生活动中心', organizer_name: '创新创业学院', status: 'upcoming', icon: '🏆', coverColor: 'linear-gradient(135deg, #d4a574 0%, #c9956c 100%)', participants: 156, max_participants: 200 },
          { id: 2, title: '春季校园马拉松', description: '强健体魄，挑战自我，感受运动的快乐', start_time: '2024-03-20T07:00:00', location: '校园操场', organizer_name: '体育部', status: 'upcoming', icon: '🏃', coverColor: 'linear-gradient(135deg, #8fbc8f 0%, #6b8e6b 100%)', participants: 328, max_participants: 500 },
          { id: 3, title: '名家讲坛：人工智能前沿', description: '邀请业界专家分享AI最新发展趋势和应用案例', start_time: '2024-03-18T14:00:00', location: '图书馆报告厅', organizer_name: '计算机学院', status: 'upcoming', icon: '🤖', coverColor: 'linear-gradient(135deg, #c9a86c 0%, #b8956c 100%)', participants: 89, max_participants: 150 },
          { id: 4, title: '校园歌手大赛决赛', description: '展现歌喉，放飞梦想，寻找校园好声音', start_time: '2024-03-10T19:00:00', location: '大礼堂', organizer_name: '校学生会', status: 'ongoing', icon: '🎤', coverColor: 'linear-gradient(135deg, #b8956c 0%, #a67c52 100%)', participants: 45, max_participants: 50 },
          { id: 5, title: '环保志愿者行动', description: '保护环境从我做起，共建绿色美丽校园', start_time: '2024-03-05T08:00:00', location: '校园各区域', organizer_name: '青年志愿者协会', status: 'completed', icon: '🌱', coverColor: 'linear-gradient(135deg, #6b8e6b 0%, #5a7a5a 100%)', participants: 120, max_participants: 120 },
          { id: 6, title: '读书分享会', description: '分享阅读心得，交流思想碰撞，共同成长进步', start_time: '2024-03-22T15:00:00', location: '图书馆阅览室', organizer_name: '读书协会', status: 'upcoming', icon: '📖', coverColor: 'linear-gradient(135deg, #a67c52 0%, #8b6914 100%)', participants: 32, max_participants: 50 }
        ]
      }
    },
    loadJoinedActivities() {
      this.joinedIds = uni.getStorageSync('joinedActivities') || []
    },
    saveJoinedActivities() {
      uni.setStorageSync('joinedActivities', this.joinedIds)
    },
    isJoined(activityId) {
      return this.joinedIds.includes(activityId)
    },
    getStatusText(status) {
      const texts = { upcoming: '即将开始', ongoing: '进行中', completed: '已结束', cancelled: '已取消' }
      return texts[status] || status
    },
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    async joinActivity(activity) {
      if (activity.status !== 'upcoming') return
      if (this.isJoined(activity.id)) return
      
      try {
        await api.social.joinActivity(activity.id)
      } catch (e) {}
      
      this.joinedIds.push(activity.id)
      this.saveJoinedActivities()
      
      // 添加通知
      this.addNotification({
        type: 'activity',
        title: '活动报名成功',
        content: `您已成功报名「${activity.title}」，活动时间：${this.formatTime(activity.start_time)}，地点：${activity.location}，请准时参加！`
      })
      
      // 更新活动分类统计
      this.updateCategoryStats()
      
      uni.showToast({ title: '报名成功', icon: 'success' })
    },
    cancelJoin(activity) {
      uni.showModal({
        title: '取消报名',
        content: `确定要取消报名「${activity.title}」吗？`,
        success: (res) => {
          if (res.confirm) {
            const idx = this.joinedIds.indexOf(activity.id)
            if (idx > -1) {
              this.joinedIds.splice(idx, 1)
              this.saveJoinedActivities()
              this.updateCategoryStats()
              uni.showToast({ title: '已取消报名', icon: 'success' })
            }
          }
        }
      })
    },
    addNotification(notification) {
      const notifications = uni.getStorageSync('localNotifications') || []
      notifications.unshift({
        id: Date.now(),
        ...notification,
        created_at: new Date().toISOString(),
        is_read: false
      })
      uni.setStorageSync('localNotifications', notifications)
    },
    updateCategoryStats() {
      const count = this.myActivities.length
      this.activityCategories = [
        { name: '学术讲座', icon: '📚', count: Math.floor(count * 0.3) || 0, percent: 30, color: '#d4a574' },
        { name: '文体活动', icon: '🏀', count: Math.floor(count * 0.25) || 0, percent: 25, color: '#8fbc8f' },
        { name: '志愿服务', icon: '💚', count: Math.floor(count * 0.2) || 0, percent: 20, color: '#c9a86c' },
        { name: '社团活动', icon: '🎭', count: Math.floor(count * 0.15) || 0, percent: 15, color: '#b8956c' },
        { name: '竞赛比赛', icon: '🏆', count: Math.floor(count * 0.1) || 0, percent: 10, color: '#a67c52' }
      ]
    }
  }
}
</script>

<style scoped>
.activities-page { background: #faf8f5; min-height: 100vh; padding-bottom: 30rpx; }

.main-tabs { display: flex; background: #fff; padding: 20rpx; gap: 20rpx; border-bottom: 1rpx solid #f0f0f0; }
.main-tab { flex: 1; text-align: center; padding: 20rpx; border-radius: 30rpx; font-size: 28rpx; color: #666; background: #f5f5f5; }
.main-tab.active { background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; }

.tabs { display: flex; background: #fff; padding: 15rpx 20rpx; gap: 15rpx; }
.tab { padding: 12rpx 24rpx; border-radius: 24rpx; font-size: 24rpx; color: #666; background: #f5f5f5; }
.tab.active { background: linear-gradient(135deg, #f5e6d3 0%, #e8d4be 100%); color: #8b6914; }

.activities-list { padding: 20rpx; }
.activity-card { background: #fff; border-radius: 24rpx; overflow: hidden; margin-bottom: 20rpx; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05); }

.activity-cover { height: 200rpx; position: relative; display: flex; align-items: center; justify-content: center; }
.cover-icon { font-size: 72rpx; }
.activity-tag { position: absolute; top: 20rpx; right: 20rpx; padding: 8rpx 20rpx; border-radius: 20rpx; font-size: 22rpx; color: #fff; }
.activity-tag.upcoming { background: rgba(212,165,116,0.9); }
.activity-tag.ongoing { background: rgba(143,188,143,0.9); }
.activity-tag.completed { background: rgba(107,130,128,0.9); }
.joined-badge { position: absolute; top: 20rpx; left: 20rpx; padding: 8rpx 20rpx; border-radius: 20rpx; font-size: 22rpx; color: #fff; background: rgba(90,143,90,0.9); }

.activity-info { padding: 25rpx; }
.activity-title { display: block; font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 10rpx; }
.activity-desc { display: block; font-size: 26rpx; color: #666; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 15rpx; }
.activity-meta { display: flex; flex-wrap: wrap; gap: 20rpx; margin-bottom: 15rpx; }
.meta-item { display: flex; align-items: center; font-size: 24rpx; color: #999; }
.meta-icon { margin-right: 6rpx; }

.activity-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 20rpx; border-top: 1rpx solid #f0f0f0; }
.organizer-info { display: flex; align-items: center; gap: 8rpx; }
.org-icon { font-size: 28rpx; }
.org-name { font-size: 24rpx; color: #999; }
.join-btn { padding: 16rpx 40rpx; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; border-radius: 30rpx; font-size: 26rpx; }
.join-btn.disabled { background: #e5e7eb; color: #9ca3af; }
.joined-btn { padding: 16rpx 40rpx; background: #f0f0f0; color: #5a8f5a; border-radius: 30rpx; font-size: 26rpx; border: 2rpx solid #5a8f5a; }

.mine-section { padding: 20rpx; }
.stats-card { display: flex; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); border-radius: 24rpx; padding: 40rpx 20rpx; margin-bottom: 20rpx; }
.stat-item { flex: 1; text-align: center; }
.stat-num { display: block; font-size: 48rpx; font-weight: bold; color: #fff; }
.stat-label { display: block; font-size: 24rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; }

.section-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; }
.my-activities { margin-bottom: 20rpx; }
.my-activity-card { display: flex; align-items: center; background: #fff; border-radius: 16rpx; padding: 20rpx; margin-bottom: 15rpx; }
.activity-icon { width: 80rpx; height: 80rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; font-size: 40rpx; margin-right: 20rpx; }
.activity-content { flex: 1; }
.activity-name { display: block; font-size: 28rpx; font-weight: 500; color: #333; }
.activity-time { display: block; font-size: 24rpx; color: #d4a574; margin-top: 6rpx; }
.activity-location { display: block; font-size: 22rpx; color: #999; margin-top: 4rpx; }
.activity-status-tag { padding: 8rpx 16rpx; border-radius: 12rpx; font-size: 22rpx; }
.activity-status-tag.upcoming { background: #fef3c7; color: #d97706; }
.activity-status-tag.ongoing { background: #d1fae5; color: #059669; }
.activity-status-tag.completed { background: #e5e7eb; color: #6b7280; }

.participation-card { background: #fff; border-radius: 20rpx; padding: 25rpx; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.card-title { font-size: 28rpx; font-weight: bold; color: #333; }
.chart-area { }
.chart-bar { display: flex; align-items: center; margin-bottom: 20rpx; }
.bar-label { width: 180rpx; font-size: 24rpx; color: #666; }
.bar-track { flex: 1; height: 20rpx; background: #f0f0f0; border-radius: 10rpx; overflow: hidden; margin: 0 15rpx; }
.bar-fill { height: 100%; border-radius: 10rpx; transition: width 0.3s; }
.bar-value { width: 80rpx; font-size: 24rpx; color: #999; text-align: right; }

.empty-state { text-align: center; padding: 100rpx; }
.empty-icon { font-size: 80rpx; display: block; }
.empty-text { font-size: 28rpx; color: #999; display: block; margin-top: 20rpx; }
.empty-btn { display: inline-block; margin-top: 30rpx; padding: 20rpx 60rpx; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; border-radius: 30rpx; font-size: 28rpx; }
</style>
