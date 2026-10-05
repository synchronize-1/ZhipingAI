<template>
  <div class="teacher-home" v-loading="loading">
    <!-- 顶部欢迎横幅 -->
    <TeacherWelcomeBanner
      :user="userStore.user"
      :user-avatar-url="userAvatarUrl"
      :greeting-text="greetingText"
      :current-date="currentDate"
      :current-weekday="currentWeekday"
      :class-count="classCount"
      :total-students="totalStudents"
      :pending-homework="pendingHomework"
      :exam-count="examCount"
    />

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧内容 -->
      <div class="left-section">
        <!-- 今日授课卡片 -->
        <TeacherTodayCourses
          :today-class-list="todayClassList"
          :total-students-today="totalStudentsToday"
          v-model:show-checkin-dialog="showCheckinDialog"
          :current-checkin-class="currentCheckinClass"
          v-model:checkin-duration="checkinDuration"
          v-model:checkin-method="checkinMethod"
          :checkin-started="checkinStarted"
          :checkin-progress="checkinProgress"
          :checkin-countdown="checkinCountdown"
          :checked-in-count="checkedInCount"
          @start-checkin="startCheckin"
          @view-detail="viewClassDetail"
          @confirm-start-checkin="confirmStartCheckin"
          @end-checkin-session="endCheckinSession"
        />

        <!-- 教学数据分析 -->
        <TeacherTeachingAnalysis
          v-model:analytics-view="analyticsView"
          :teaching-hours="teachingHours"
          :avg-attendance="avgAttendance"
          :course-rating="courseRating"
          :interaction-count="interactionCount"
          :set-attendance-chart-el="setAttendanceChartEl"
        />

        <!-- 我的班级 -->
        <TeacherMyClasses :my-classes="myClasses" />
      </div>

      <!-- 右侧内容 -->
      <div class="right-section">
        <!-- 待办事项 -->
        <TeacherTodoCard
          :todo-list="todoList"
          :pending-todos="pendingTodos"
          v-model:show-todo-dialog="showTodoDialog"
          :current-todo="currentTodo"
          :homework-list="homeworkList"
          :student-questions="studentQuestions"
          v-model:show-grade-dialog="showGradeDialog"
          :current-grade-homework="currentGradeHomework"
          v-model:grade-form="gradeForm"
          @handle-todo="handleTodo"
          @complete-todo="completeTodo"
          @reply-question="replyQuestion"
          @grade-homework="gradeHomework"
          @submit-grade="submitGrade"
        />

        <!-- 学生提问 -->
        <TeacherStudentQuestions
          :student-questions="studentQuestions"
          :pending-questions="pendingQuestions"
        />

        <!-- 最近考试 -->
        <TeacherRecentExam :recent-exams="recentExams" />

        <!-- 快捷功能 -->
        <TeacherQuickActions
          :quick-actions="quickActions"
          :today-class-list="todayClassList"
          v-model:show-homework-dialog="showHomeworkDialog"
          v-model:homework-form="homeworkForm"
          @action="handleAction"
          @submit-homework="submitHomework"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTeacherHome } from './useTeacherHome'
import TeacherWelcomeBanner from './components/TeacherWelcomeBanner.vue'
import TeacherTodayCourses from './components/TeacherTodayCourses.vue'
import TeacherTeachingAnalysis from './components/TeacherTeachingAnalysis.vue'
import TeacherMyClasses from './components/TeacherMyClasses.vue'
import TeacherTodoCard from './components/TeacherTodoCard.vue'
import TeacherStudentQuestions from './components/TeacherStudentQuestions.vue'
import TeacherRecentExam from './components/TeacherRecentExam.vue'
import TeacherQuickActions from './components/TeacherQuickActions.vue'

defineOptions({ name: 'TeacherHome' })

const {
  loading,
  userStore,
  userAvatarUrl,
  greetingText,
  currentDate,
  currentWeekday,
  classCount,
  totalStudents,
  pendingHomework,
  examCount,
  todayClassList,
  totalStudentsToday,
  analyticsView,
  teachingHours,
  avgAttendance,
  courseRating,
  interactionCount,
  setAttendanceChartEl,
  myClasses,
  todoList,
  pendingTodos,
  showTodoDialog,
  currentTodo,
  homeworkList,
  showGradeDialog,
  currentGradeHomework,
  gradeForm,
  studentQuestions,
  recentExams,
  quickActions,
  showHomeworkDialog,
  homeworkForm,
  showCheckinDialog,
  currentCheckinClass,
  checkinDuration,
  checkinMethod,
  checkinStarted,
  checkinProgress,
  checkinCountdown,
  checkedInCount,
  startCheckin,
  viewClassDetail,
  confirmStartCheckin,
  endCheckinSession,
  handleTodo,
  completeTodo,
  replyQuestion,
  gradeHomework,
  submitGrade,
  handleAction,
  submitHomework
} = useTeacherHome()
</script>

<style scoped>
.teacher-home {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%);
}

/* 主内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 24px;
  padding: 0 24px 24px;
}

.left-section, .right-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}
</style>