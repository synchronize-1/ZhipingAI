<template>
  <!-- 今日课程卡片 -->
  <div class="content-card today-courses">
    <div class="card-header">
      <div class="header-left">
        <div class="header-icon">
          <el-icon><Calendar /></el-icon>
        </div>
        <div>
          <h3>今日课程</h3>
          <p>{{ currentWeekday }} · 共{{ todayCourses.length }}节课</p>
        </div>
      </div>
      <el-button type="default" round @click="$router.push('/my-courses')">
        查看课表
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
    </div>
    <div class="courses-timeline" v-if="todayCourses.length > 0">
      <div
        v-for="(course, index) in todayCourses"
        :key="course.id"
        class="course-item"
        :class="{
          'is-current': course.isCurrent,
          'is-finished': course.isFinished,
          'is-upcoming': !course.isCurrent && !course.isFinished
        }"
      >
        <div class="course-time">
          <span class="time-start">{{ course.startTime }}</span>
          <span class="time-end">{{ course.endTime }}</span>
        </div>
        <div class="course-connector">
          <div class="connector-dot" :class="{ 'pulse': course.isCurrent }"></div>
          <div class="connector-line" v-if="index < todayCourses.length - 1"></div>
        </div>
        <div class="course-info">
          <div class="course-header-row">
            <h4>{{ course.name }}</h4>
            <div class="course-status" v-if="course.isCurrent">
              <el-tag type="success" effect="dark" size="small">
                <el-icon class="is-loading"><Loading /></el-icon>
                上课中
              </el-tag>
            </div>
          </div>
          <div class="course-meta">
            <span><el-icon><Location /></el-icon> {{ course.location }}</span>
            <span><el-icon><User /></el-icon> {{ course.teacher }}</span>
          </div>
          <div class="course-actions" v-if="!course.isFinished">
            <el-button
              size="small"
              type="primary"
              plain
              @click="$emit('checkin', course)"
              :disabled="course.checkedIn"
            >
              <el-icon><Checked /></el-icon>
              {{ course.checkedIn ? '已签到' : '签到' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
    <el-empty v-else description="今日没有课程，好好休息吧~" :image-size="100" />
  </div>
</template>

<script setup>
import { Calendar, ArrowRight, Loading, Location, User, Checked } from '@element-plus/icons-vue'

defineOptions({ name: 'StudentTodayCourses' })

defineProps({
  todayCourses: { type: Array, default: () => [] },
  currentWeekday: { type: String, default: '' }
})

defineEmits(['checkin'])
</script>

<style scoped>
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

/* 今日课程时间线 */
.courses-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.course-item {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  transition: all 0.3s;
}

.course-item.is-current {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  margin: 0 -24px;
  padding: 16px 24px;
  border-radius: 16px;
}

.course-item.is-finished {
  opacity: 0.5;
}

.course-time {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 50px;
}

.time-start {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

.time-end {
  font-size: 12px;
  color: #9ca3af;
}

.course-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
}

.connector-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #d1d5db;
  flex-shrink: 0;
}

.course-item.is-current .connector-dot {
  background: #667eea;
}

.connector-dot.pulse {
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(102, 126, 234, 0); }
}

.connector-line {
  flex: 1;
  width: 2px;
  background: #e5e7eb;
  margin: 4px 0;
}

.course-info {
  flex: 1;
}

.course-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.course-info h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

.course-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.course-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.course-status {
  display: inline-flex;
  align-items: center;
}

.course-status .el-tag {
  white-space: nowrap;
  overflow: visible;
}

.course-actions {
  margin-top: 8px;
}

.course-actions .el-button {
  font-weight: 500;
  background: #fff !important;
  color: #409eff !important;
  border: 1px solid #409eff !important;
}

.course-actions .el-button:hover {
  background: #ecf5ff !important;
  color: #409eff !important;
}
</style>