<template>
  <div class="welcome-banner">
    <div class="welcome-content">
      <div class="greeting-section">
        <div class="avatar-wrapper">
          <el-avatar :size="80" :src="userAvatarUrl" class="user-avatar">
            {{ user?.name?.charAt(0) }}
          </el-avatar>
          <div class="role-badge">👨‍🏫</div>
        </div>
        <div class="greeting-text">
          <h1 class="greeting-title">
            {{ greetingText }}，{{ user?.name || '老师' }}
          </h1>
          <p class="greeting-subtitle">
            <el-icon><Calendar /></el-icon>
            {{ currentDate }} · {{ currentWeekday }}
          </p>
          <div class="teacher-info">
            <el-tag effect="dark" type="info">{{ user?.department || '计算机学院' }}</el-tag>
            <el-tag effect="plain">工号: {{ user?.employeeId || 'T2020001' }}</el-tag>
          </div>
        </div>
      </div>
      <div class="quick-stats">
        <div class="stat-card glass-effect">
          <div class="stat-icon bg-blue">
            <el-icon><School /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ classCount }}</span>
            <span class="stat-label">任教班级</span>
          </div>
        </div>
        <div class="stat-card glass-effect">
          <div class="stat-icon bg-orange">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ totalStudents }}</span>
            <span class="stat-label">学生总数</span>
          </div>
        </div>
        <div class="stat-card glass-effect">
          <div class="stat-icon bg-green">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ pendingHomework }}</span>
            <span class="stat-label">待批作业</span>
          </div>
        </div>
        <div class="stat-card glass-effect">
          <div class="stat-icon bg-purple">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ examCount }}</span>
            <span class="stat-label">考试总数</span>
          </div>
        </div>
      </div>
    </div>
    <div class="banner-pattern"></div>
  </div>
</template>

<script setup>
import { Calendar, School, User, Document, Star } from '@element-plus/icons-vue'

defineOptions({ name: 'TeacherWelcomeBanner' })

defineProps({
  user: { type: Object, default: null },
  userAvatarUrl: { type: String, default: '' },
  greetingText: { type: String, default: '' },
  currentDate: { type: String, default: '' },
  currentWeekday: { type: String, default: '' },
  classCount: { type: Number, default: 0 },
  totalStudents: { type: Number, default: 0 },
  pendingHomework: { type: Number, default: 0 },
  examCount: { type: Number, default: 0 }
})
</script>

<style scoped>
.welcome-banner {
  background: linear-gradient(135deg, #1a365d 0%, #2c5282 50%, #2b6cb0 100%);
  border-radius: 0 0 32px 32px;
  padding: 32px;
  position: relative;
  overflow: hidden;
  margin: -24px -24px 24px -24px;
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

.role-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.greeting-text {
  color: white;
}

.greeting-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.greeting-subtitle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  opacity: 0.9;
  margin: 0 0 12px 0;
}

.teacher-info {
  display: flex;
  gap: 8px;
}

.quick-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 16px;
  min-width: 130px;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
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
.stat-icon.bg-purple { background: rgba(139, 92, 246, 0.8); }

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

.banner-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

@media (max-width: 768px) {
  .quick-stats {
    justify-content: center;
  }
}
</style>