<template>
  <view class="growth-page">
    <!-- 顶部个人信息卡 -->
    <view class="profile-header">
      <view class="avatar-section">
        <view class="avatar">{{ user?.name?.charAt(0) || '原' }}</view>
        <view class="level-badge">Lv.{{ level }}</view>
      </view>
      <view class="user-info">
        <text class="user-name">{{ user?.name || '原神大王' }}</text>
        <text class="user-title">{{ currentTitle }}</text>
        <view class="exp-bar">
          <view class="exp-fill" :style="{ width: expPercent + '%' }"></view>
        </view>
        <text class="exp-text">{{ currentExp }}/{{ nextLevelExp }} 成长值</text>
      </view>
    </view>

    <!-- 节日问候 -->
    <view v-if="festivalGreeting" class="greeting-card">
      <text class="greeting-icon">{{ festivalGreeting.icon }}</text>
      <view class="greeting-content">
        <text class="greeting-title">{{ festivalGreeting.title }}</text>
        <text class="greeting-text">{{ festivalGreeting.message }}</text>
      </view>
    </view>

    <!-- 学习鼓励 -->
    <view class="encourage-card">
      <text class="encourage-icon">💪</text>
      <text class="encourage-text">{{ encourageMessage }}</text>
    </view>

    <!-- 选项卡 -->
    <view class="tabs">
      <view class="tab" :class="{ active: activeTab === 'academic' }" @tap="activeTab = 'academic'">学业档案</view>
      <view class="tab" :class="{ active: activeTab === 'activity' }" @tap="activeTab = 'activity'">活动参与</view>
      <view class="tab" :class="{ active: activeTab === 'mental' }" @tap="activeTab = 'mental'">心理健康</view>
      <view class="tab" :class="{ active: activeTab === 'social' }" @tap="activeTab = 'social'">社交互动</view>
    </view>

    <!-- 学业档案 -->
    <view v-if="activeTab === 'academic'" class="content-section">
      <!-- 学期成绩趋势 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">📊 学期成绩趋势</text>
        </view>
        <view class="chart-container">
          <view class="line-chart">
            <view v-for="(item, idx) in gradeData" :key="idx" class="chart-point" :style="{ left: idx * 16.6 + 8 + '%', bottom: item.score - 50 + '%' }">
              <view class="point-dot"></view>
              <text class="point-label">{{ item.score }}</text>
            </view>
            <svg class="chart-line">
              <polyline :points="gradeLinePoints" fill="none" stroke="#d4a574" stroke-width="2"/>
            </svg>
          </view>
          <view class="chart-labels">
            <text v-for="item in gradeData" :key="item.semester">{{ item.semester }}</text>
          </view>
        </view>
      </view>

      <!-- 课程成绩分布 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">📚 课程成绩分布</text>
        </view>
        <view class="course-grades">
          <view v-for="course in courseGrades" :key="course.name" class="course-item">
            <view class="course-info">
              <text class="course-name">{{ course.name }}</text>
              <text class="course-score" :class="getScoreClass(course.score)">{{ course.score }}</text>
            </view>
            <view class="score-bar">
              <view class="score-fill" :style="{ width: course.score + '%', background: getScoreColor(course.score) }"></view>
            </view>
          </view>
        </view>
      </view>

      <!-- 学习时长统计 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">⏱️ 本周学习时长</text>
          <text class="card-value">{{ totalStudyHours }}小时</text>
        </view>
        <view class="study-chart">
          <view v-for="(day, idx) in weekStudyData" :key="idx" class="day-bar">
            <view class="bar-fill" :style="{ height: day.hours * 10 + '%' }"></view>
            <text class="bar-label">{{ day.day }}</text>
          </view>
        </view>
      </view>

      <!-- 学业成就 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">🏅 学业成就</text>
        </view>
        <view class="achievements">
          <view v-for="ach in academicAchievements" :key="ach.id" class="achievement-item" :class="{ locked: !ach.unlocked }">
            <text class="ach-icon">{{ ach.icon }}</text>
            <text class="ach-name">{{ ach.name }}</text>
            <text class="ach-desc">{{ ach.description }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 活动参与 -->
    <view v-if="activeTab === 'activity'" class="content-section">
      <!-- 活动统计 -->
      <view class="stats-row">
        <view class="stat-card">
          <text class="stat-num">{{ activityStats.total }}</text>
          <text class="stat-label">参与活动</text>
        </view>
        <view class="stat-card">
          <text class="stat-num">{{ activityStats.volunteer }}</text>
          <text class="stat-label">志愿时长</text>
        </view>
        <view class="stat-card">
          <text class="stat-num">{{ activityStats.awards }}</text>
          <text class="stat-label">获得荣誉</text>
        </view>
      </view>

      <!-- 活动类型分布 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">🎯 活动类型分布</text>
        </view>
        <view class="pie-legend">
          <view v-for="cat in activityCategories" :key="cat.name" class="legend-item">
            <view class="legend-dot" :style="{ background: cat.color }"></view>
            <text class="legend-name">{{ cat.name }}</text>
            <text class="legend-value">{{ cat.count }}次 ({{ cat.percent }}%)</text>
          </view>
        </view>
      </view>

      <!-- 活动时间线 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">📅 活动时间线</text>
        </view>
        <view class="timeline">
          <view v-for="event in activityTimeline" :key="event.id" class="timeline-item">
            <view class="timeline-dot" :style="{ background: event.color }"></view>
            <view class="timeline-content">
              <text class="event-title">{{ event.title }}</text>
              <text class="event-date">{{ event.date }}</text>
              <text class="event-result">{{ event.result }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 兴趣小组 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">👥 我的兴趣小组</text>
        </view>
        <view class="groups-list">
          <view v-for="group in interestGroups" :key="group.id" class="group-item">
            <text class="group-icon">{{ group.icon }}</text>
            <view class="group-info">
              <text class="group-name">{{ group.name }}</text>
              <text class="group-members">{{ group.members }}名成员</text>
            </view>
            <view class="group-status" :class="group.status">{{ group.status === 'joined' ? '已加入' : '申请中' }}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 心理健康 -->
    <view v-if="activeTab === 'mental'" class="content-section">
      <!-- 心情记录 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">😊 今日心情</text>
        </view>
        <view class="mood-selector">
          <view v-for="mood in moods" :key="mood.value" class="mood-item" :class="{ active: todayMood === mood.value }" @tap="selectMood(mood.value)">
            <text class="mood-icon">{{ mood.icon }}</text>
            <text class="mood-label">{{ mood.label }}</text>
          </view>
        </view>
      </view>

      <!-- 心情趋势 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">📈 心情趋势（近7天）</text>
        </view>
        <view class="mood-chart">
          <view v-for="(day, idx) in moodHistory" :key="idx" class="mood-day">
            <text class="mood-emoji">{{ getMoodEmoji(day.mood) }}</text>
            <text class="mood-date">{{ day.date }}</text>
          </view>
        </view>
      </view>

      <!-- 压力指数 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">🎯 压力指数</text>
          <text class="stress-level" :class="stressLevel">{{ stressText }}</text>
        </view>
        <view class="stress-meter">
          <view class="meter-fill" :style="{ width: stressPercent + '%', background: stressColor }"></view>
        </view>
        <view class="stress-tips">
          <text class="tip-title">💡 减压建议</text>
          <text class="tip-text">{{ stressTip }}</text>
        </view>
      </view>

      <!-- 心理资源 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">🌈 心理资源</text>
        </view>
        <view class="resource-list">
          <view class="resource-item" @tap="openResource('hotline')">
            <text class="res-icon">📞</text>
            <text class="res-name">心理援助热线</text>
            <text class="res-info">24小时在线</text>
          </view>
          <view class="resource-item" @tap="openResource('counseling')">
            <text class="res-icon">💬</text>
            <text class="res-name">预约心理咨询</text>
            <text class="res-info">专业心理咨询师</text>
          </view>
          <view class="resource-item" @tap="openResource('test')">
            <text class="res-icon">📝</text>
            <text class="res-name">心理自测</text>
            <text class="res-info">了解自己的心理状态</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 社交互动 -->
    <view v-if="activeTab === 'social'" class="content-section">
      <!-- 社交数据 -->
      <view class="stats-row">
        <view class="stat-card">
          <text class="stat-num">{{ socialStats.friends }}</text>
          <text class="stat-label">校园好友</text>
        </view>
        <view class="stat-card">
          <text class="stat-num">{{ socialStats.groups }}</text>
          <text class="stat-label">加入小组</text>
        </view>
        <view class="stat-card">
          <text class="stat-num">{{ socialStats.posts }}</text>
          <text class="stat-label">发布动态</text>
        </view>
      </view>

      <!-- 推荐好友 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">👋 可能认识的人</text>
        </view>
        <view class="friends-recommend">
          <view v-for="friend in recommendedFriends" :key="friend.id" class="friend-item">
            <view class="friend-avatar">{{ friend.name.charAt(0) }}</view>
            <view class="friend-info">
              <text class="friend-name">{{ friend.name }}</text>
              <text class="friend-reason">{{ friend.reason }}</text>
            </view>
            <view class="add-btn" @tap="addFriend(friend)">加好友</view>
          </view>
        </view>
      </view>

      <!-- 热门话题 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">🔥 校园热门话题</text>
        </view>
        <view class="topics-list">
          <view v-for="topic in hotTopics" :key="topic.id" class="topic-item" @tap="viewTopic(topic)">
            <text class="topic-tag">#</text>
            <text class="topic-name">{{ topic.name }}</text>
            <text class="topic-heat">{{ topic.heat }}热度</text>
          </view>
        </view>
      </view>

      <!-- 我的动态 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">📝 我的动态</text>
          <view class="add-post-btn" @tap="showPostModal = true">+ 发布</view>
        </view>
        <view v-if="myPosts.length" class="posts-list">
          <view v-for="post in myPosts" :key="post.id" class="post-item">
            <text class="post-content">{{ post.content }}</text>
            <view class="post-footer">
              <text class="post-time">{{ post.time }}</text>
              <view class="post-stats">
                <text>❤️ {{ post.likes }}</text>
                <text>💬 {{ post.comments }}</text>
              </view>
            </view>
          </view>
        </view>
        <view v-else class="empty-posts">
          <text>还没有发布动态，快来分享吧~</text>
        </view>
      </view>
    </view>

    <!-- 发布动态弹窗 -->
    <view v-if="showPostModal" class="modal-mask" @tap="showPostModal = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">发布动态</text>
          <view class="close-btn" @tap="showPostModal = false">✕</view>
        </view>
        <textarea v-model="newPostContent" placeholder="分享你的校园生活..." class="post-textarea" />
        <view class="modal-footer">
          <view class="post-btn" @tap="publishPost">发布</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      user: null,
      activeTab: 'academic',
      level: 8,
      currentExp: 2350,
      nextLevelExp: 3000,
      currentTitle: '学业精进者',
      encourageMessage: '今天也是充满活力的一天！保持专注，你离目标又近了一步！',
      festivalGreeting: null,
      todayMood: 4,
      showPostModal: false,
      newPostContent: '',
      moods: [
        { value: 1, icon: '😢', label: '难过' },
        { value: 2, icon: '😔', label: '低落' },
        { value: 3, icon: '😐', label: '一般' },
        { value: 4, icon: '😊', label: '开心' },
        { value: 5, icon: '😄', label: '很棒' }
      ],
      gradeData: [
        { semester: '大一上', score: 78 },
        { semester: '大一下', score: 82 },
        { semester: '大二上', score: 85 },
        { semester: '大二下', score: 83 },
        { semester: '大三上', score: 88 },
        { semester: '大三下', score: 91 }
      ],
      courseGrades: [
        { name: '高等数学', score: 92 },
        { name: '大学英语', score: 88 },
        { name: '数据结构', score: 95 },
        { name: '计算机网络', score: 86 },
        { name: '操作系统', score: 90 },
        { name: '软件工程', score: 93 }
      ],
      weekStudyData: [
        { day: '一', hours: 6 },
        { day: '二', hours: 8 },
        { day: '三', hours: 5 },
        { day: '四', hours: 7 },
        { day: '五', hours: 4 },
        { day: '六', hours: 9 },
        { day: '日', hours: 6 }
      ],
      academicAchievements: [
        { id: 1, icon: '🏆', name: '学霸之路', description: '单科成绩达到95分', unlocked: true },
        { id: 2, icon: '📚', name: '勤学苦读', description: '累计学习时长100小时', unlocked: true },
        { id: 3, icon: '⭐', name: '优秀学员', description: '获得学期优秀奖', unlocked: true },
        { id: 4, icon: '🎯', name: '全能发展', description: '所有科目均达到85分', unlocked: false }
      ],
      activityStats: { total: 12, volunteer: 48, awards: 3 },
      activityCategories: [
        { name: '学术讲座', count: 5, percent: 42, color: '#d4a574' },
        { name: '文体活动', count: 3, percent: 25, color: '#8fbc8f' },
        { name: '志愿服务', count: 2, percent: 17, color: '#c9a86c' },
        { name: '社团活动', count: 2, percent: 16, color: '#b8956c' }
      ],
      activityTimeline: [
        { id: 1, title: '创新创业大赛', date: '2024-03-15', result: '获得三等奖', color: '#d4a574' },
        { id: 2, title: '志愿者服务日', date: '2024-03-10', result: '服务时长4小时', color: '#8fbc8f' },
        { id: 3, title: 'AI技术讲座', date: '2024-03-08', result: '获得结业证书', color: '#c9a86c' },
        { id: 4, title: '校园马拉松', date: '2024-03-01', result: '完成5公里', color: '#b8956c' }
      ],
      interestGroups: [
        { id: 1, icon: '💻', name: '编程爱好者', members: 156, status: 'joined' },
        { id: 2, icon: '📷', name: '摄影协会', members: 89, status: 'joined' },
        { id: 3, icon: '🎸', name: '音乐社', members: 234, status: 'pending' }
      ],
      moodHistory: [
        { date: '周一', mood: 4 },
        { date: '周二', mood: 3 },
        { date: '周三', mood: 5 },
        { date: '周四', mood: 4 },
        { date: '周五', mood: 4 },
        { date: '周六', mood: 5 },
        { date: '周日', mood: 4 }
      ],
      stressPercent: 35,
      socialStats: { friends: 28, groups: 5, posts: 12 },
      recommendedFriends: [
        { id: 1, name: '李明', reason: '同班同学', avatar: '' },
        { id: 2, name: '王芳', reason: '共同参加3个活动', avatar: '' },
        { id: 3, name: '张伟', reason: '同一兴趣小组', avatar: '' }
      ],
      hotTopics: [
        { id: 1, name: '期末复习攻略', heat: 2341 },
        { id: 2, name: '食堂新菜推荐', heat: 1856 },
        { id: 3, name: '图书馆占座神器', heat: 1523 }
      ],
      myPosts: [
        { id: 1, content: '今天在图书馆学习了一整天，感觉效率超高！💪', time: '2小时前', likes: 12, comments: 3 },
        { id: 2, content: '参加了创新创业大赛，收获满满~', time: '1天前', likes: 28, comments: 8 }
      ]
    }
  },
  computed: {
    expPercent() {
      return (this.currentExp / this.nextLevelExp) * 100
    },
    totalStudyHours() {
      return this.weekStudyData.reduce((sum, d) => sum + d.hours, 0)
    },
    gradeLinePoints() {
      return this.gradeData.map((item, idx) => {
        const x = 30 + idx * 55
        const y = 150 - (item.score - 50) * 3
        return `${x},${y}`
      }).join(' ')
    },
    stressLevel() {
      if (this.stressPercent < 30) return 'low'
      if (this.stressPercent < 60) return 'medium'
      return 'high'
    },
    stressText() {
      if (this.stressPercent < 30) return '轻松'
      if (this.stressPercent < 60) return '适中'
      return '较大'
    },
    stressColor() {
      if (this.stressPercent < 30) return '#8fbc8f'
      if (this.stressPercent < 60) return '#d4a574'
      return '#c97c5d'
    },
    stressTip() {
      if (this.stressPercent < 30) return '保持良好状态，继续加油！'
      if (this.stressPercent < 60) return '适当休息，劳逸结合效果更好哦~'
      return '压力有点大，建议进行一些放松活动，或寻求帮助'
    }
  },
  onShow() {
    this.user = uni.getStorageSync('user') || { name: '原神大王' }
    this.checkFestival()
    this.loadMoodHistory()
  },
  methods: {
    checkFestival() {
      const now = new Date()
      const month = now.getMonth() + 1
      const day = now.getDate()
      if (month === 1 && day === 1) {
        this.festivalGreeting = { icon: '🎊', title: '新年快乐！', message: '新的一年，新的起点，愿你学业有成，前程似锦！' }
      } else if (month === 3 && day === 8) {
        this.festivalGreeting = { icon: '🌸', title: '女神节快乐！', message: '愿你永远保持自信与美丽！' }
      } else if (month === 5 && day === 4) {
        this.festivalGreeting = { icon: '🔥', title: '青年节快乐！', message: '青春无限，未来可期，继续闪耀吧！' }
      } else if (month === 9 && day === 10) {
        this.festivalGreeting = { icon: '🍎', title: '教师节快乐！', message: '感谢每一位辛勤付出的老师们！' }
      }
    },
    loadMoodHistory() {
      const saved = uni.getStorageSync('moodHistory') || []
      if (saved.length > 0) {
        this.moodHistory = saved.slice(-7)
      }
    },
    selectMood(mood) {
      this.todayMood = mood
      const history = uni.getStorageSync('moodHistory') || []
      const today = new Date().toLocaleDateString()
      const idx = history.findIndex(h => h.fullDate === today)
      if (idx > -1) {
        history[idx].mood = mood
      } else {
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        history.push({ date: days[new Date().getDay()], mood, fullDate: today })
      }
      uni.setStorageSync('moodHistory', history.slice(-30))
      uni.showToast({ title: '心情已记录', icon: 'success' })
    },
    getMoodEmoji(mood) {
      const emojis = { 1: '😢', 2: '😔', 3: '😐', 4: '😊', 5: '😄' }
      return emojis[mood] || '😊'
    },
    getScoreClass(score) {
      if (score >= 90) return 'excellent'
      if (score >= 80) return 'good'
      if (score >= 70) return 'average'
      return 'poor'
    },
    getScoreColor(score) {
      if (score >= 90) return '#8fbc8f'
      if (score >= 80) return '#d4a574'
      if (score >= 70) return '#c9a86c'
      return '#c97c5d'
    },
    openResource(type) {
      const messages = {
        hotline: '心理援助热线: 400-XXX-XXXX\n24小时为您服务',
        counseling: '预约咨询请前往学生心理咨询中心\n地址: 行政楼3楼',
        test: '心理自测功能开发中，敬请期待~'
      }
      uni.showModal({ title: '心理资源', content: messages[type], showCancel: false })
    },
    addFriend(friend) {
      uni.showToast({ title: `已向${friend.name}发送好友申请`, icon: 'none' })
    },
    viewTopic(topic) {
      uni.showToast({ title: `查看话题: #${topic.name}`, icon: 'none' })
    },
    publishPost() {
      if (!this.newPostContent.trim()) {
        uni.showToast({ title: '请输入内容', icon: 'none' })
        return
      }
      this.myPosts.unshift({
        id: Date.now(),
        content: this.newPostContent,
        time: '刚刚',
        likes: 0,
        comments: 0
      })
      this.newPostContent = ''
      this.showPostModal = false
      uni.showToast({ title: '发布成功', icon: 'success' })
    }
  }
}
</script>

<style scoped>
.growth-page { background: #faf8f5; min-height: 100vh; padding-bottom: 40rpx; }

.profile-header { display: flex; padding: 40rpx 30rpx; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); }
.avatar-section { position: relative; }
.avatar { width: 120rpx; height: 120rpx; background: rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 48rpx; color: #fff; font-weight: bold; }
.level-badge { position: absolute; bottom: -10rpx; left: 50%; transform: translateX(-50%); background: #fff; color: #d4a574; font-size: 20rpx; padding: 4rpx 16rpx; border-radius: 20rpx; font-weight: bold; }
.user-info { flex: 1; margin-left: 30rpx; display: flex; flex-direction: column; justify-content: center; }
.user-name { font-size: 36rpx; font-weight: bold; color: #fff; }
.user-title { font-size: 24rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; }
.exp-bar { height: 12rpx; background: rgba(255,255,255,0.3); border-radius: 6rpx; margin-top: 15rpx; overflow: hidden; }
.exp-fill { height: 100%; background: #fff; border-radius: 6rpx; transition: width 0.3s; }
.exp-text { font-size: 20rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; }

.greeting-card { display: flex; align-items: center; margin: 20rpx; padding: 25rpx; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 20rpx; }
.greeting-icon { font-size: 48rpx; margin-right: 20rpx; }
.greeting-content { flex: 1; }
.greeting-title { display: block; font-size: 28rpx; font-weight: bold; color: #92400e; }
.greeting-text { display: block; font-size: 24rpx; color: #b45309; margin-top: 6rpx; }

.encourage-card { display: flex; align-items: center; margin: 20rpx; padding: 20rpx 25rpx; background: #fff; border-radius: 16rpx; border-left: 6rpx solid #8fbc8f; }
.encourage-icon { font-size: 36rpx; margin-right: 15rpx; }
.encourage-text { flex: 1; font-size: 26rpx; color: #666; line-height: 1.5; }

.tabs { display: flex; background: #fff; padding: 15rpx 20rpx; gap: 10rpx; margin-bottom: 20rpx; }
.tab { flex: 1; text-align: center; padding: 16rpx 10rpx; border-radius: 20rpx; font-size: 24rpx; color: #666; background: #f5f5f5; }
.tab.active { background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; }

.content-section { padding: 0 20rpx; }
.card { background: #fff; border-radius: 20rpx; padding: 25rpx; margin-bottom: 20rpx; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.card-title { font-size: 28rpx; font-weight: bold; color: #333; }
.card-value { font-size: 28rpx; font-weight: bold; color: #d4a574; }

.chart-container { position: relative; height: 200rpx; }
.line-chart { position: relative; height: 150rpx; border-bottom: 2rpx solid #f0f0f0; }
.chart-point { position: absolute; }
.point-dot { width: 16rpx; height: 16rpx; background: #d4a574; border-radius: 50%; border: 3rpx solid #fff; box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.1); }
.point-label { position: absolute; top: -30rpx; left: 50%; transform: translateX(-50%); font-size: 20rpx; color: #666; }
.chart-line { position: absolute; top: 0; left: 0; width: 100%; height: 150rpx; }
.chart-labels { display: flex; justify-content: space-around; margin-top: 10rpx; }
.chart-labels text { font-size: 20rpx; color: #999; }

.course-grades { }
.course-item { margin-bottom: 20rpx; }
.course-info { display: flex; justify-content: space-between; margin-bottom: 8rpx; }
.course-name { font-size: 26rpx; color: #333; }
.course-score { font-size: 26rpx; font-weight: bold; }
.course-score.excellent { color: #8fbc8f; }
.course-score.good { color: #d4a574; }
.course-score.average { color: #c9a86c; }
.course-score.poor { color: #c97c5d; }
.score-bar { height: 12rpx; background: #f0f0f0; border-radius: 6rpx; overflow: hidden; }
.score-fill { height: 100%; border-radius: 6rpx; transition: width 0.3s; }

.study-chart { display: flex; justify-content: space-around; align-items: flex-end; height: 200rpx; padding-top: 20rpx; }
.day-bar { display: flex; flex-direction: column; align-items: center; width: 50rpx; }
.day-bar .bar-fill { width: 30rpx; background: linear-gradient(180deg, #d4a574 0%, #c9956c 100%); border-radius: 15rpx 15rpx 0 0; min-height: 10rpx; }
.day-bar .bar-label { font-size: 22rpx; color: #999; margin-top: 10rpx; }

.achievements { display: flex; flex-wrap: wrap; gap: 15rpx; }
.achievement-item { width: calc(50% - 8rpx); padding: 20rpx; background: #faf8f5; border-radius: 16rpx; text-align: center; }
.achievement-item.locked { opacity: 0.5; }
.ach-icon { display: block; font-size: 40rpx; margin-bottom: 10rpx; }
.ach-name { display: block; font-size: 26rpx; font-weight: 500; color: #333; }
.ach-desc { display: block; font-size: 22rpx; color: #999; margin-top: 6rpx; }

.stats-row { display: flex; gap: 15rpx; margin-bottom: 20rpx; }
.stat-card { flex: 1; background: #fff; border-radius: 16rpx; padding: 25rpx 15rpx; text-align: center; }
.stat-num { display: block; font-size: 40rpx; font-weight: bold; color: #8b6914; }
.stat-label { display: block; font-size: 22rpx; color: #999; margin-top: 8rpx; }

.pie-legend { }
.legend-item { display: flex; align-items: center; padding: 15rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.legend-item:last-child { border-bottom: none; }
.legend-dot { width: 24rpx; height: 24rpx; border-radius: 6rpx; margin-right: 15rpx; }
.legend-name { flex: 1; font-size: 26rpx; color: #333; }
.legend-value { font-size: 24rpx; color: #999; }

.timeline { position: relative; padding-left: 30rpx; }
.timeline::before { content: ''; position: absolute; left: 8rpx; top: 20rpx; bottom: 20rpx; width: 4rpx; background: #f0f0f0; }
.timeline-item { position: relative; padding: 20rpx 0 20rpx 30rpx; }
.timeline-dot { position: absolute; left: -30rpx; top: 25rpx; width: 20rpx; height: 20rpx; border-radius: 50%; border: 4rpx solid #fff; box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.1); }
.timeline-content { }
.event-title { display: block; font-size: 28rpx; font-weight: 500; color: #333; }
.event-date { display: block; font-size: 22rpx; color: #999; margin-top: 6rpx; }
.event-result { display: block; font-size: 24rpx; color: #8fbc8f; margin-top: 6rpx; }

.groups-list { }
.group-item { display: flex; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.group-item:last-child { border-bottom: none; }
.group-icon { font-size: 40rpx; margin-right: 20rpx; }
.group-info { flex: 1; }
.group-name { display: block; font-size: 28rpx; color: #333; }
.group-members { display: block; font-size: 22rpx; color: #999; margin-top: 4rpx; }
.group-status { font-size: 22rpx; padding: 6rpx 16rpx; border-radius: 12rpx; }
.group-status.joined { background: #d1fae5; color: #059669; }
.group-status.pending { background: #fef3c7; color: #d97706; }

.mood-selector { display: flex; justify-content: space-around; }
.mood-item { text-align: center; padding: 20rpx; border-radius: 16rpx; }
.mood-item.active { background: linear-gradient(135deg, #f5e6d3 0%, #e8d4be 100%); }
.mood-icon { display: block; font-size: 48rpx; }
.mood-label { display: block; font-size: 22rpx; color: #666; margin-top: 8rpx; }

.mood-chart { display: flex; justify-content: space-around; }
.mood-day { text-align: center; }
.mood-emoji { display: block; font-size: 36rpx; }
.mood-date { display: block; font-size: 22rpx; color: #999; margin-top: 8rpx; }

.stress-meter { height: 20rpx; background: #f0f0f0; border-radius: 10rpx; overflow: hidden; margin-bottom: 20rpx; }
.meter-fill { height: 100%; border-radius: 10rpx; transition: width 0.3s; }
.stress-level { font-size: 24rpx; padding: 6rpx 16rpx; border-radius: 12rpx; }
.stress-level.low { background: #d1fae5; color: #059669; }
.stress-level.medium { background: #fef3c7; color: #d97706; }
.stress-level.high { background: #fee2e2; color: #dc2626; }
.stress-tips { background: #faf8f5; border-radius: 12rpx; padding: 20rpx; }
.tip-title { display: block; font-size: 24rpx; color: #666; margin-bottom: 8rpx; }
.tip-text { display: block; font-size: 26rpx; color: #333; }

.resource-list { }
.resource-item { display: flex; align-items: center; padding: 25rpx 20rpx; background: #faf8f5; border-radius: 16rpx; margin-bottom: 15rpx; }
.res-icon { font-size: 36rpx; margin-right: 20rpx; }
.res-name { flex: 1; font-size: 28rpx; color: #333; }
.res-info { font-size: 24rpx; color: #999; }

.friends-recommend { }
.friend-item { display: flex; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.friend-item:last-child { border-bottom: none; }
.friend-avatar { width: 80rpx; height: 80rpx; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32rpx; color: #fff; margin-right: 20rpx; }
.friend-info { flex: 1; }
.friend-name { display: block; font-size: 28rpx; color: #333; }
.friend-reason { display: block; font-size: 22rpx; color: #999; margin-top: 4rpx; }
.add-btn { padding: 12rpx 24rpx; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; border-radius: 20rpx; font-size: 24rpx; }

.topics-list { display: flex; flex-wrap: wrap; gap: 15rpx; }
.topic-item { display: flex; align-items: center; padding: 15rpx 20rpx; background: #faf8f5; border-radius: 30rpx; }
.topic-tag { font-size: 26rpx; color: #d4a574; margin-right: 5rpx; }
.topic-name { font-size: 26rpx; color: #333; }
.topic-heat { font-size: 22rpx; color: #999; margin-left: 10rpx; }

.add-post-btn { font-size: 26rpx; color: #d4a574; padding: 8rpx 20rpx; border: 2rpx solid #d4a574; border-radius: 20rpx; }
.posts-list { }
.post-item { padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.post-item:last-child { border-bottom: none; }
.post-content { display: block; font-size: 28rpx; color: #333; line-height: 1.6; }
.post-footer { display: flex; justify-content: space-between; margin-top: 15rpx; }
.post-time { font-size: 22rpx; color: #999; }
.post-stats { display: flex; gap: 20rpx; font-size: 22rpx; color: #999; }
.empty-posts { text-align: center; padding: 40rpx; color: #999; font-size: 26rpx; }

.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; align-items: center; justify-content: center; }
.modal-content { width: 85%; background: #fff; border-radius: 24rpx; padding: 30rpx; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25rpx; }
.modal-title { font-size: 32rpx; font-weight: bold; color: #333; }
.close-btn { font-size: 36rpx; color: #999; }
.post-textarea { width: 100%; height: 300rpx; background: #faf8f5; border-radius: 16rpx; padding: 20rpx; font-size: 28rpx; box-sizing: border-box; }
.modal-footer { margin-top: 25rpx; }
.post-btn { text-align: center; padding: 24rpx; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; border-radius: 40rpx; font-size: 30rpx; }
</style>
