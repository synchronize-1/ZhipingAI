<template>
  <!-- 今日概览卡片 -->
  <div class="content-card today-overview">
    <div class="card-header">
      <div class="header-left">
        <div class="header-icon blue">
          <el-icon><Calendar /></el-icon>
        </div>
        <div>
          <h3>今日概览</h3>
          <p>{{ currentDate }}</p>
        </div>
      </div>
    </div>
    <div class="overview-grid">
      <div class="overview-item">
        <div class="overview-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="overview-info">
          <span class="overview-label">今日课程</span>
          <span class="overview-value">{{ todayCourses }} 节</span>
        </div>
      </div>
      <div class="overview-item">
        <div class="overview-icon" style="background: linear-gradient(135deg, #10b981, #34d399);">
          <el-icon><User /></el-icon>
        </div>
        <div class="overview-info">
          <span class="overview-label">今日访问</span>
          <span class="overview-value">{{ todayVisits.toLocaleString() }} 人</span>
        </div>
      </div>
      <div class="overview-item">
        <div class="overview-icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24);">
          <el-icon><Document /></el-icon>
        </div>
        <div class="overview-info">
          <span class="overview-label">待处理服务</span>
          <span class="overview-value">{{ pendingServices }} 条</span>
        </div>
      </div>
      <div class="overview-item">
        <div class="overview-icon" style="background: linear-gradient(135deg, #ef4444, #f87171);">
          <el-icon><Bell /></el-icon>
        </div>
        <div class="overview-info">
          <span class="overview-label">未读通知</span>
          <span class="overview-value">{{ unreadNotifications }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Calendar, Clock, User, Document, Bell } from '@element-plus/icons-vue'

defineProps({
  currentDate: { type: String, default: '' },
  todayCourses: { type: Number, default: 0 },
  todayVisits: { type: Number, default: 0 },
  pendingServices: { type: Number, default: 0 },
  unreadNotifications: { type: Number, default: 0 }
})
</script>

<style scoped>
/* 内容卡片 */
.content-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  color: #1f2937;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-header .header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.header-icon.blue { background: linear-gradient(135deg, #667eea, #764ba2); }

.card-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.card-header p {
  margin: 1px 0 0 0;
  font-size: 11px;
  color: #6b7280;
}

/* 今日概览 */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 10px;
}

.overview-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
}

.overview-info {
  flex: 1;
}

.overview-label {
  display: block;
  font-size: 11px;
  color: #6b7280;
}

.overview-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

/* 响应式 */
@media (max-width: 768px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>