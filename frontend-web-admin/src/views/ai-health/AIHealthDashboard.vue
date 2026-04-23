<!-- frontend-web-admin/src/views/ai-health/AIHealthDashboard.vue -->
<template>
  <div class="ai-health-dashboard">
    <div class="page-header">
      <h1>🤖 AI健康评估</h1>
      <p class="subtitle">管理员查看全校AI使用健康数据概览</p>
      <p class="meta">{{ todayText }} · {{ semesterWeekText }}</p>
    </div>

    <div class="dashboard-content">
      <AIHealthOverview />
      <AIHealthStudentQuery />
      <AIHealthWarnings />
      <AIHealthAnalytics />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AIHealthOverview from './components/AIHealthOverview.vue'
import AIHealthStudentQuery from './components/AIHealthStudentQuery.vue'
import AIHealthWarnings from './components/AIHealthWarnings.vue'
import AIHealthAnalytics from './components/AIHealthAnalytics.vue'
import * as echarts from 'echarts'

const todayText = computed(() => new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}))

const semesterWeekText = computed(() => {
  // 假设学期始于 2026年2月23日
  const semesterStart = new Date('2026-02-23')
  const now = new Date()
  const diffDays = Math.max(0, Math.floor((now - semesterStart) / (24 * 3600 * 1000)))
  const weekNum = Math.floor(diffDays / 7) + 1
  return `第 ${Math.min(weekNum, 20)} 教学周`
})
</script>

<style scoped>
.ai-health-dashboard {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 28px;
}

.page-header h1 {
  font-size: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.page-header .subtitle {
  color: #64748b;
  margin: 8px 0 4px;
  font-size: 14px;
}

.page-header .meta {
  color: #94a3b8;
  font-size: 13px;
  margin: 0;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>