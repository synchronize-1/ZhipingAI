<template>
  <!-- 顶部欢迎横幅 -->
  <div class="welcome-banner">
    <div class="welcome-content">
      <div class="greeting-section">
        <div class="avatar-wrapper">
          <el-avatar :size="80" :src="userAvatarUrl" class="user-avatar">
            {{ userName?.charAt(0) }}
          </el-avatar>
          <div class="status-dot"></div>
        </div>
        <div class="greeting-text">
          <h1 class="greeting-title">
            <span class="wave-emoji">👋</span> {{ greetingText }}，{{ userName || '同学' }}
          </h1>
          <p class="greeting-subtitle">
            <el-icon><Calendar /></el-icon>
            {{ currentDate }} · {{ weatherInfo.text }} {{ weatherInfo.temp }}°C
          </p>
          <div class="motivation-quote">
            <el-icon><Sunrise /></el-icon>
            <span>{{ motivationQuote }}</span>
          </div>
        </div>
      </div>
      <div class="quick-stats">
        <div class="stat-card glass-effect">
          <div class="stat-icon bg-blue">
            <el-icon><Trophy /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ examCount }}</span>
            <span class="stat-label">考试次数</span>
          </div>
        </div>
        <div class="stat-card glass-effect">
          <div class="stat-icon bg-orange">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ honorCount }}</span>
            <span class="stat-label">荣誉数量</span>
          </div>
        </div>
        <div class="stat-card glass-effect">
          <div class="stat-icon bg-green">
            <el-icon><DataLine /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ avgScore }}</span>
            <span class="stat-label">平均分数</span>
          </div>
        </div>
      </div>

      <!-- 荣誉榜 -->
      <div class="content-card honors-section">
        <div class="card-header">
          <div class="header-left">
            <div class="header-icon orange">
              <el-icon><Trophy /></el-icon>
            </div>
            <div>
              <h3>荣誉榜</h3>
              <p>最近获得的荣誉</p>
            </div>
          </div>
          <el-button type="default" round size="small" @click="$router.push('/growth')">
            全部
            <el-icon class="el-icon--right"><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div v-if="recentHonors.length > 0" class="honors-list">
          <div v-for="honor in recentHonors.slice(0, 3)" :key="honor.id" class="honor-item">
            <div class="honor-icon">
              <el-icon><Star /></el-icon>
            </div>
            <div class="honor-info">
              <span class="honor-title">{{ honor.title }}</span>
              <span class="honor-meta">
                <el-tag size="small" type="warning">{{ honor.level }}</el-tag>
                <span class="honor-date">{{ honor.awardedAt }}</span>
              </span>
            </div>
          </div>
        </div>
        <div v-else class="empty-honor">
          <el-icon><Star /></el-icon>
          <span>暂无荣誉，继续加油！</span>
        </div>
      </div>
    </div>
    <div class="banner-decoration">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
    </div>
  </div>
</template>

<script setup>
import { Calendar, Sunrise, Trophy, Star, DataLine, ArrowRight } from '@element-plus/icons-vue'

defineOptions({ name: 'StudentWelcomeBanner' })

defineProps({
  userAvatarUrl: { type: String, default: '' },
  userName: { type: String, default: '' },
  greetingText: { type: String, default: '' },
  currentDate: { type: String, default: '' },
  weatherInfo: { type: Object, default: () => ({ text: '', temp: '' }) },
  motivationQuote: { type: String, default: '' },
  examCount: { type: Number, default: 0 },
  honorCount: { type: Number, default: 0 },
  avgScore: { type: Number, default: 0 },
  recentHonors: { type: Array, default: () => [] }
})
</script>

<style scoped>
/* 欢迎横幅 */
.welcome-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #a78bfa 100%);
  border-radius: 0 0 32px 32px;
  padding: 24px 32px;
  position: relative;
  overflow: hidden;
  margin: -24px -24px 24px -24px;
  max-width: 100%;
  box-sizing: border-box;
}

.welcome-content {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}

.greeting-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-wrapper {
  position: relative;
}

.user-avatar {
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.status-dot {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  background: #67c23a;
  border: 3px solid white;
  border-radius: 50%;
}

.greeting-text {
  color: white;
}

.greeting-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.wave-emoji {
  animation: wave 2s ease-in-out infinite;
  display: inline-block;
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(20deg); }
  75% { transform: rotate(-20deg); }
}

.greeting-subtitle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  opacity: 0.9;
  margin: 0 0 8px 0;
}

.motivation-quote {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  opacity: 0.85;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.quick-stats {
  display: flex;
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 16px;
  min-width: 140px;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.stat-icon.bg-blue { background: rgba(59, 130, 246, 0.8); }
.stat-icon.bg-orange { background: rgba(249, 115, 22, 0.8); }
.stat-icon.bg-green { background: rgba(34, 197, 94, 0.8); }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.banner-decoration {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 200px;
  height: 200px;
  top: -50px;
  right: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  bottom: -30px;
  right: 30%;
  animation-delay: 2s;
}

.shape-3 {
  width: 100px;
  height: 100px;
  top: 20%;
  right: 5%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(10deg); }
}

/* 内容卡片（通用） */
.content-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 20px;
}

.header-icon.orange { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }

.header-left h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.header-left p {
  margin: 2px 0 0 0;
  font-size: 13px;
  color: #6b7280;
}

/* 荣誉榜 */
.honors-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.honor-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%);
  border-radius: 12px;
  transition: all 0.3s;
}

.honor-item:hover {
  transform: translateX(4px);
}

.honor-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.honor-info {
  flex: 1;
  min-width: 0;
}

.honor-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.honor-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.honor-date {
  font-size: 11px;
  color: #9ca3af;
}

.empty-honor {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #9ca3af;
  font-size: 13px;
}

.empty-honor .el-icon {
  font-size: 32px;
  color: #d1d5db;
}

/* 响应式 */
@media (max-width: 1200px) {
  .quick-stats {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .welcome-banner {
    padding: 20px;
  }

  .greeting-section {
    flex-direction: column;
    text-align: center;
  }

  .greeting-title {
    font-size: 22px;
  }

  .quick-stats {
    justify-content: center;
  }

  .stat-card {
    min-width: 120px;
    padding: 12px 16px;
  }
}
</style>