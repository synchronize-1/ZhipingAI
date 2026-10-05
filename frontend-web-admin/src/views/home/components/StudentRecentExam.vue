<template>
  <!-- 最近考试卡片 -->
  <div class="content-card latest-exam">
    <div class="card-header">
      <div class="header-left">
        <div class="header-icon green">
          <el-icon><Trophy /></el-icon>
        </div>
        <div>
          <h3>最近考试</h3>
          <p>{{ latestExam ? latestExam.examDate : '暂无考试' }}</p>
        </div>
      </div>
      <el-button type="default" round size="small" @click="$router.push('/growth')">
        查看详情
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
    </div>
    <template v-if="latestExam">
      <div class="exam-overview">
        <div class="exam-name">{{ latestExam.examName }}</div>
        <div class="exam-scores">
          <div class="score-item">
            <span class="score-value">{{ latestExam.totalScore }}</span>
            <span class="score-label">总分</span>
          </div>
          <div class="score-item">
            <span class="score-value">{{ latestExam.classRank }}</span>
            <span class="score-label">班级排名</span>
          </div>
          <div class="score-item">
            <span class="score-value">{{ latestExam.gradeRank }}</span>
            <span class="score-label">年级排名</span>
          </div>
        </div>
      </div>
      <div v-if="latestExam.subjects && latestExam.subjects.length > 0" class="subject-scores">
        <div v-for="subject in latestExam.subjects.slice(0, 4)" :key="subject.subjectId" class="subject-item">
          <span class="subject-name">{{ subject.subjectName }}</span>
          <div class="subject-score-info">
            <span class="subject-score">{{ subject.score }}<em>/{{ subject.fullScore }}</em></span>
            <el-tag size="small" :type="subject.scoreLevel === '优秀' ? 'success' : subject.scoreLevel === '良好' ? 'primary' : 'warning'">
              {{ subject.scoreLevel }}
            </el-tag>
          </div>
        </div>
      </div>
    </template>
    <div v-else class="empty-honor">
      <el-icon><Trophy /></el-icon>
      <span>暂无考试数据</span>
    </div>
  </div>
</template>

<script setup>
import { Trophy, ArrowRight } from '@element-plus/icons-vue'

defineOptions({ name: 'StudentRecentExam' })

defineProps({
  latestExam: { type: Object, default: null }
})
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

.header-icon.green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }

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

/* 最近考试 */
.exam-overview {
  text-align: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.exam-name {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 16px;
}

.exam-scores {
  display: flex;
  justify-content: space-around;
}

.score-item {
  text-align: center;
}

.score-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 4px;
}

.score-label {
  font-size: 12px;
  color: #6b7280;
}

.subject-scores {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.subject-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.subject-name {
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
}

.subject-score-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subject-score {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.subject-score em {
  font-style: normal;
  font-size: 11px;
  color: #9ca3af;
  font-weight: 400;
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
</style>