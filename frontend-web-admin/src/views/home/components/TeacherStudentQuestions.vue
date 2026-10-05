<template>
  <div class="content-card questions-section">
    <div class="card-header">
      <div class="header-left">
        <div class="header-icon purple">
          <el-icon><ChatDotRound /></el-icon>
        </div>
        <div>
          <h3>学生提问</h3>
          <p>{{ pendingQuestions }}条待回复</p>
        </div>
      </div>
      <el-button type="primary" text @click="$router.push('/courses')">
        全部
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
    </div>
    <div class="questions-list">
      <div v-for="question in studentQuestions" :key="question.id" class="question-item">
        <el-avatar :size="36" :src="question.avatar">{{ question.studentName.charAt(0) }}</el-avatar>
        <div class="question-content">
          <div class="question-header">
            <span class="student-name">{{ question.studentName }}</span>
            <el-tag size="small">{{ question.courseName }}</el-tag>
          </div>
          <p class="question-text">{{ question.content }}</p>
          <span class="question-time">{{ question.time }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ChatDotRound, ArrowRight } from '@element-plus/icons-vue'

defineOptions({ name: 'TeacherStudentQuestions' })

defineProps({
  studentQuestions: { type: Array, default: () => [] },
  pendingQuestions: { type: Number }
})
</script>

<style scoped>
/* 内容卡片 */
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
  background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
  color: white;
  font-size: 20px;
}

.header-icon.purple { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }

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

/* 学生提问 */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
}

.question-content {
  flex: 1;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.student-name {
  font-weight: 600;
  color: #1a1a2e;
}

.question-text {
  margin: 0;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
}

.question-time {
  font-size: 12px;
  color: #9ca3af;
}
</style>