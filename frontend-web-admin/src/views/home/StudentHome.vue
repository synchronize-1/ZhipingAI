<template>
  <div class="student-home" v-loading="loading">
    <!-- 顶部欢迎横幅（含荣誉榜） -->
    <StudentWelcomeBanner
      :user-avatar-url="userAvatarUrl"
      :user-name="userName"
      :greeting-text="greetingText"
      :current-date="currentDate"
      :weather-info="weatherInfo"
      :motivation-quote="motivationQuote"
      :exam-count="examCount"
      :honor-count="honorCount"
      :avg-score="avgScore"
      :recent-honors="recentHonors"
    />

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧内容 -->
      <div class="left-section">
        <!-- 今日课程卡片 -->
        <StudentTodayCourses
          :today-courses="todayCourses"
          :current-weekday="currentWeekday"
          @checkin="quickCheckin"
        />

        <!-- 待办事项卡片（含添加对话框） -->
        <StudentTodoCard
          v-model:show-add-todo="showAddTodo"
          :todo-list="todoList"
          :pending-tasks="pendingTasks"
          :todo-form="todoForm"
          @toggle="toggleTodo"
          @delete="deleteTodo"
          @add="addTodo"
        />
      </div>

      <!-- 右侧内容 -->
      <div class="right-section">
        <!-- 最近考试卡片 -->
        <StudentRecentExam :latest-exam="latestExam" />

        <!-- 技能与成长 -->
        <StudentSkillGrowth :skill-summary="skillSummary" :mental-health="mentalHealth" />

        <!-- 快捷服务卡片 -->
        <StudentQuickServices :quick-services="quickServices" @navigate="navigateService" />

        <!-- 通知消息卡片 -->
        <StudentNotices :notifications="notifications" :unread-notifications="unreadNotifications" />
      </div>
    </div>

    <!-- AI智能助手悬浮按钮 -->
    <AIAssistantFloat />
  </div>
</template>

<script setup>
import { useStudentHome } from './useStudentHome'
import AIAssistantFloat from './components/AIAssistantFloat.vue'
import StudentWelcomeBanner from './components/StudentWelcomeBanner.vue'
import StudentTodayCourses from './components/StudentTodayCourses.vue'
import StudentTodoCard from './components/StudentTodoCard.vue'
import StudentRecentExam from './components/StudentRecentExam.vue'
import StudentSkillGrowth from './components/StudentSkillGrowth.vue'
import StudentQuickServices from './components/StudentQuickServices.vue'
import StudentNotices from './components/StudentNotices.vue'

defineOptions({ name: 'StudentHome' })

const {
  loading,
  userAvatarUrl,
  userName,
  greetingText,
  currentDate,
  currentWeekday,
  weatherInfo,
  motivationQuote,
  examCount,
  honorCount,
  avgScore,
  recentHonors,
  todayCourses,
  pendingTasks,
  todoList,
  showAddTodo,
  todoForm,
  latestExam,
  skillSummary,
  mentalHealth,
  quickServices,
  notifications,
  unreadNotifications,
  quickCheckin,
  toggleTodo,
  deleteTodo,
  addTodo,
  navigateService
} = useStudentHome()
</script>

<style scoped>
.student-home {
  min-height: 100vh;
  background: linear-gradient(135deg, #faf8f5 0%, #f5f0e8 100%);
}

/* 主内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
  padding: 0 24px 24px;
}

.left-section, .right-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 学习数据（历史遗留，当前模板未使用） */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  justify-content: center;
}

.percentage-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
}

.percentage-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
}

.study-hours {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
}

.hours-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  color: #6b7280;
}

.hours-value {
  font-weight: 600;
  color: #1a1a2e;
}

.hours-comparison {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.text-green { color: #10b981; }
.text-orange { color: #f59e0b; }

/* 响应式 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}
</style>