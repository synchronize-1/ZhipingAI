<template>
  <div class="content-card teaching-analytics">
    <div class="card-header">
      <div class="header-left">
        <div class="header-icon green">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div>
          <h3>教学数据分析</h3>
          <p>本学期教学概览</p>
        </div>
      </div>
      <el-radio-group v-model="analyticsView" size="small">
        <el-radio-button label="week">本周</el-radio-button>
        <el-radio-button label="month">本月</el-radio-button>
        <el-radio-button label="semester">学期</el-radio-button>
      </el-radio-group>
    </div>
    <div class="analytics-grid">
      <div class="analytics-item">
        <div class="analytics-icon blue">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="analytics-data">
          <span class="value">{{ teachingHours }}</span>
          <span class="label">授课时长</span>
        </div>
        <div class="analytics-trend up">
          <el-icon><Top /></el-icon>
          <span>+12%</span>
        </div>
      </div>
      <div class="analytics-item">
        <div class="analytics-icon green">
          <el-icon><Checked /></el-icon>
        </div>
        <div class="analytics-data">
          <span class="value">{{ avgAttendance }}%</span>
          <span class="label">平均出勤</span>
        </div>
        <div class="analytics-trend up">
          <el-icon><Top /></el-icon>
          <span>+3%</span>
        </div>
      </div>
      <div class="analytics-item">
        <div class="analytics-icon orange">
          <el-icon><Star /></el-icon>
        </div>
        <div class="analytics-data">
          <span class="value">{{ courseRating }}</span>
          <span class="label">课程评分</span>
        </div>
        <div class="analytics-trend up">
          <el-icon><Top /></el-icon>
          <span>+0.2</span>
        </div>
      </div>
      <div class="analytics-item">
        <div class="analytics-icon purple">
          <el-icon><ChatDotRound /></el-icon>
        </div>
        <div class="analytics-data">
          <span class="value">{{ interactionCount }}</span>
          <span class="label">课堂互动</span>
        </div>
        <div class="analytics-trend down">
          <el-icon><Bottom /></el-icon>
          <span>-5%</span>
        </div>
      </div>
    </div>
    <div class="chart-container" :ref="(el) => setAttendanceChartEl(el)"></div>
  </div>
</template>

<script setup>
import { TrendCharts, Clock, Checked, Star, ChatDotRound, Top, Bottom } from '@element-plus/icons-vue'

defineOptions({ name: 'TeacherTeachingAnalysis' })

defineProps({
  teachingHours: { type: [String, Number], default: '' },
  avgAttendance: { type: [String, Number], default: 0 },
  courseRating: { type: [String, Number], default: '' },
  interactionCount: { type: [String, Number], default: 0 },
  setAttendanceChartEl: { type: Function, required: true }
})

const analyticsView = defineModel('analyticsView', { type: String, default: 'week' })
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

/* 教学分析 */
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.analytics-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
}

.analytics-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.analytics-icon.blue { background: linear-gradient(135deg, #667eea, #764ba2); }
.analytics-icon.green { background: linear-gradient(135deg, #11998e, #38ef7d); }
.analytics-icon.orange { background: linear-gradient(135deg, #f093fb, #f5576c); }
.analytics-icon.purple { background: linear-gradient(135deg, #a8edea, #fed6e3); color: #1a1a2e; }

.analytics-data {
  flex: 1;
}

.analytics-data .value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
}

.analytics-data .label {
  font-size: 12px;
  color: #6b7280;
}

.analytics-trend {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 500;
}

.analytics-trend.up { color: #10b981; }
.analytics-trend.down { color: #ef4444; }

.chart-container {
  height: 200px;
}

@media (max-width: 1200px) {
  .analytics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
}
</style>