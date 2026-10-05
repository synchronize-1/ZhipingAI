<template>
  <div class="content-card recent-exams">
    <div class="card-header">
      <div class="header-left">
        <div class="header-icon orange">
          <el-icon><Star /></el-icon>
        </div>
        <div>
          <h3>最近考试</h3>
          <p>共 {{ recentExams.length }} 场</p>
        </div>
      </div>
      <el-button type="primary" text @click="$router.push('/teaching/exam-list')">
        全部
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
    </div>
    <div v-if="recentExams.length > 0" class="exams-list">
      <div v-for="exam in recentExams" :key="exam.id" class="exam-item">
        <div class="exam-info">
          <span class="exam-name">{{ exam.name }}</span>
          <div class="exam-meta">
            <span class="exam-date">{{ exam.examDate }}</span>
            <span class="exam-class">{{ exam.classCount }}个班级</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-todo">
      <el-icon><SuccessFilled /></el-icon>
      <span>暂无考试安排</span>
    </div>
  </div>
</template>

<script setup>
import { Star, ArrowRight, SuccessFilled } from '@element-plus/icons-vue'

defineOptions({ name: 'TeacherRecentExam' })

defineProps({
  recentExams: { type: Array, default: () => [] }
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

/* 空状态 */
.empty-todo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px;
  color: #9ca3af;
  font-size: 13px;
}

/* 最近考试 */
.exams-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.exam-item {
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 12px;
  transition: all 0.2s;
}

.exam-item:hover {
  background: #f3f4f6;
}

.exam-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.exam-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.exam-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}
</style>