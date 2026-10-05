<template>
  <!-- 最近考试卡片 -->
  <div class="content-card recent-exams">
    <div class="card-header">
      <div class="header-left">
        <div class="header-icon orange">
          <el-icon><Trophy /></el-icon>
        </div>
        <div>
          <h3>最近考试</h3>
          <p>共 {{ recentExams.length }} 场近期考试</p>
        </div>
      </div>
      <el-button type="primary" text size="small" @click="$router.push('/teaching/exam-list')">
        全部
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
    </div>
    <div v-if="recentExams.length > 0" class="exams-list">
      <div v-for="exam in recentExams" :key="exam.id" class="exam-item">
        <div class="exam-info">
          <span class="exam-name">{{ exam.name }}</span>
          <span class="exam-meta">
            <el-tag size="small" type="info">{{ exam.examType }}</el-tag>
            <span class="exam-date">{{ exam.examDate }}</span>
            <span class="exam-class">{{ exam.classCount }}个班级</span>
          </span>
        </div>
      </div>
    </div>
    <div v-else class="empty-warning">
      <el-icon><SuccessFilled /></el-icon>
      <span>暂无考试安排</span>
    </div>
  </div>
</template>

<script setup>
import { Trophy, ArrowRight, SuccessFilled } from '@element-plus/icons-vue'

defineProps({
  recentExams: { type: Array, default: () => [] }
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

/* 最近考试 */
.exams-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exam-item {
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  transition: all 0.2s;
}

.exam-item:hover {
  background: #f1f5f9;
}

.exam-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.exam-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.exam-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #6b7280;
}

.exam-date, .exam-class {
  font-size: 11px;
  color: #9ca3af;
}

.empty-warning {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  color: #9ca3af;
  font-size: 12px;
}
</style>