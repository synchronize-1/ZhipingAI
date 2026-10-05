<template>
  <div class="admin-home" v-loading="loading">
    <!-- 欢迎横幅 -->
    <AdminWelcomeBanner
      :greeting-text="greetingText"
      :user-name="userName"
      @refresh="refreshData"
    />

    <!-- 核心数据指标 -->
    <AdminMetricsGrid
      :total-users="totalUsers"
      :student-count="studentCount"
      :teacher-count="teacherCount"
      :user-growth="userGrowth"
      :class-count="classCount"
      :exam-count="examCount"
      :subject-count="subjectCount"
      :recent-exams="recentExams"
      :system-load="systemLoad"
      :online-users="onlineUsers"
      :warnings-count="warningsCount"
      :warnings-count-heavy="warningsCountHeavy"
      :warnings-count-medium="warningsCountMedium"
      :get-load-color="getLoadColor"
    />

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧 -->
      <div class="left-section">
        <AdminQuickManage :quick-manage="quickManage" @manage="handleQuickManage" />

        <AdminWarningCard
          :warnings="warnings"
          :get-warning-tag-type="getWarningTagType"
          :get-dependence-class="getDependenceClass"
          :selected-warning="selectedWarning"
          :student-detail="studentDetail"
          :detail-loading="detailLoading"
          v-model:show-detail-dialog="showDetailDialog"
          v-model:active-tab="activeTab"
          @view-all="goToAIHealth"
          @show-detail="showStudentDetail"
          @warning-action="handleWarningAction"
        />

        <AdminClassStats :class-stats="classStats" />
      </div>

      <!-- 右侧 -->
      <div class="right-section">
        <AdminHealthOverview
          :warnings-count="warningsCount"
          :ai-usage-hours-weekly="aiUsageHoursWeekly"
          :avg-dependence-score="avgDependenceScore"
          @detail="goToAIHealth"
        />

        <AdminTodayOverview
          :current-date="currentDate"
          :today-courses="todayCourses"
          :today-visits="todayVisits"
          :pending-services="pendingServices"
          :unread-notifications="unreadNotifications"
        />

        <AdminRecentExam :recent-exams="recentExams" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAdminHome } from './useAdminHome'
import AdminWelcomeBanner from './components/AdminWelcomeBanner.vue'
import AdminMetricsGrid from './components/AdminMetricsGrid.vue'
import AdminQuickManage from './components/AdminQuickManage.vue'
import AdminWarningCard from './components/AdminWarningCard.vue'
import AdminClassStats from './components/AdminClassStats.vue'
import AdminHealthOverview from './components/AdminHealthOverview.vue'
import AdminTodayOverview from './components/AdminTodayOverview.vue'
import AdminRecentExam from './components/AdminRecentExam.vue'

defineOptions({ name: 'AdminHome' })

const {
  // 派生数据
  greetingText,
  currentDate,
  userName,
  // 加载与指标
  loading,
  totalUsers,
  studentCount,
  teacherCount,
  userGrowth,
  classCount,
  examCount,
  subjectCount,
  recentExams,
  systemLoad,
  onlineUsers,
  // AI 健康
  warnings,
  warningsCount,
  warningsCountHeavy,
  warningsCountMedium,
  aiUsageHoursWeekly,
  avgDependenceScore,
  // 今日与班级
  todayCourses,
  todayVisits,
  pendingServices,
  unreadNotifications,
  classStats,
  quickManage,
  // 弹窗
  showDetailDialog,
  selectedWarning,
  studentDetail,
  detailLoading,
  activeTab,
  // 辅助函数
  getLoadColor,
  getWarningTagType,
  getDependenceClass,
  // 方法
  refreshData,
  handleQuickManage,
  goToAIHealth,
  showStudentDetail,
  handleWarningAction
} = useAdminHome()
</script>

<style scoped>
.admin-home {
  min-height: calc(100vh - 80px);
  background: linear-gradient(135deg, #cde8f5 0%, #d4f1f9 100%);
  padding: 16px;
  border-radius: 20px;
  overflow: hidden;
}

/* 主内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 10px;
  margin-top: 10px;
}

.left-section, .right-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}
</style>