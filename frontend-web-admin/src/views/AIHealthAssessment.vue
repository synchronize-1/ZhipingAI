<template>
  <div class="ai-health-assessment-page">
    <div class="page-header">
      <h1>AI健康评估</h1>
      <p class="subtitle">管理员查看全校健康数据概览</p>
      <p class="meta">{{ todayText }} · {{ semesterWeekText }}</p>
    </div>

    <el-card class="data-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>首页概览</span>
          <span class="updated-at">更新时间：{{ overview.updatedAt || '-' }}</span>
        </div>
      </template>

      <div v-if="loading" class="state-text">数据加载中...</div>
      <div v-else-if="error" class="state-text error">{{ error }}</div>
      <ul v-else class="overview-list">
        <li>班级总人数：{{ overview.classTotal }}</li>
        <li>教师总人数：{{ overview.teacherTotal }}</li>
        <li>AI使用时长（周）：{{ overview.aiUsageHoursWeekly }} 小时</li>
        <li>本周预警学生：{{ overview.warningCount }} 人</li>
      </ul>
    </el-card>

    <div v-if="!loading && !error" class="chart-grid">
      <el-card class="chart-card" shadow="hover">
        <template #header>AI使用时长柱状图</template>
        <div ref="usageBarRef" class="chart-box"></div>
      </el-card>
      <el-card class="chart-card" shadow="hover">
        <template #header>学生成绩折线图（周均）</template>
        <div ref="scoreLineRef" class="chart-box"></div>
      </el-card>
      <el-card class="chart-card" shadow="hover">
        <template #header>学习时长折线图（周均）</template>
        <div ref="studyLineRef" class="chart-box"></div>
      </el-card>
      <el-card class="chart-card" shadow="hover">
        <template #header>学生依赖程度分布</template>
        <div ref="dependencyPieRef" class="chart-box"></div>
      </el-card>
    </div>

    <el-card v-if="!loading && !error" class="data-card" shadow="hover">
      <template #header>
        <span>学生详情查询</span>
      </template>
      <div class="student-query">
        <div class="query-tools">
          <el-input
            v-model="studentKeyword"
            placeholder="输入姓名/学号搜索学生"
            clearable
            class="query-input"
            @keyup.enter="fetchStudents"
          />
          <el-button type="primary" @click="fetchStudents">查询</el-button>
        </div>
        <div class="query-content">
          <ul class="student-list">
            <li
              v-for="item in students"
              :key="item.id"
              class="student-item"
              :class="{ active: selectedStudent?.id === item.id }"
              @click="loadStudentDetail(item.id)"
            >
              <span>{{ item.name }}</span>
              <small>{{ item.studentId }}</small>
            </li>
            <li v-if="!students.length" class="empty-item">暂无学生数据</li>
          </ul>
          <div v-if="selectedStudent" class="student-detail">
            <p>学生：{{ selectedStudent.name }}（{{ selectedStudent.studentId }}）</p>
            <p>AI依赖指数：{{ selectedStudent.dependenceIndex }}（{{ selectedStudent.dependenceLevel }}）</p>
            <p>作业相似度：{{ selectedStudent.homeworkSimilarity }}%</p>
            <p>目标进度反馈：{{ selectedStudent.goalProgress }}%</p>
            <div class="detail-chart-grid">
              <div ref="studentScoreRef" class="chart-box detail-chart"></div>
              <div ref="studentUsagePieRef" class="chart-box detail-chart"></div>
            </div>
          </div>
          <div v-else class="empty-detail">请选择一位学生查看详情</div>
        </div>
      </div>
    </el-card>

    <el-card v-if="!loading && !error" class="data-card" shadow="hover">
      <template #header>
        <span>预警干预</span>
      </template>
      <div class="warning-list">
        <div v-for="item in warnings" :key="item.id" class="warning-item">
          <div class="warning-head">
            <span class="warning-student">{{ item.studentName }}</span>
            <span class="warning-level" :class="`level-${item.level}`">{{ item.level }}依赖</span>
          </div>
          <p class="warning-line">触发条件：{{ item.trigger }}</p>
          <p class="warning-line">建议：{{ item.suggestion }}</p>
          <div class="warning-actions">
            <el-button size="small" type="primary" plain>{{ item.action }}</el-button>
            <el-button size="small">查看详情</el-button>
          </div>
        </div>
        <div v-if="!warnings.length" class="empty-detail">暂无预警数据</div>
      </div>
    </el-card>

    <el-card v-if="!loading && !error" class="data-card" shadow="hover">
      <template #header>
        <span>替代性学习方案推荐</span>
      </template>
      <div class="plan-list">
        <div v-for="plan in recommendations" :key="plan.id" class="plan-item">
          <h4>{{ plan.title }}</h4>
          <p>{{ plan.description }}</p>
          <small>适用对象：{{ plan.target }}</small>
        </div>
        <div v-if="!recommendations.length" class="empty-detail">暂无推荐方案</div>
      </div>
    </el-card>

    <el-card v-if="!loading && !error" class="data-card" shadow="hover">
      <template #header>
        <span>干预闭环反馈</span>
      </template>
      <div class="feedback-wrap">
        <div class="feedback-chart-grid">
          <div ref="funnelChartRef" class="chart-box detail-chart"></div>
          <div ref="beforeAfterChartRef" class="chart-box detail-chart"></div>
        </div>
        <div v-if="interventionFeedback.reassessment" class="feedback-summary">
          <p>降级人数：{{ interventionFeedback.reassessment.downgradedCount }}</p>
          <p>升级人数：{{ interventionFeedback.reassessment.escalatedCount }}</p>
          <p>不变人数：{{ interventionFeedback.reassessment.unchangedCount }}</p>
          <p class="rule-hint">{{ interventionFeedback.reassessment.ruleHint }}</p>
        </div>
      </div>
    </el-card>

    <el-card v-if="!loading && !error" class="data-card" shadow="hover">
      <template #header>
        <span>综合指标分析</span>
      </template>
      <div class="analytics-wrap">
        <div class="analytics-kpis">
          <div class="kpi-item">
            <div class="kpi-label">不及格率与AI使用相关性</div>
            <div class="kpi-value">{{ percentText(analytics.failRateCorrelation) }}</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">成绩与AI使用时长相关系数</div>
            <div class="kpi-value">{{ analytics.usageScoreCorrelation?.toFixed(2) }}</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">过度依赖学生中成绩下滑比例</div>
            <div class="kpi-value">{{ percentText(analytics.declineRatioInOverDependence) }}</div>
          </div>
        </div>
        <div class="feedback-chart-grid">
          <div ref="analyticsTrendRef" class="chart-box detail-chart"></div>
          <div ref="analyticsScatterRef" class="chart-box detail-chart"></div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import api from '@/api'

const loading = ref(false)
const error = ref('')
const overview = ref({
  classTotal: 0,
  teacherTotal: 0,
  aiUsageHoursWeekly: 0,
  warningCount: 0,
  updatedAt: '',
  weekLabels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  avgScoreTrend: [],
  studyDurationTrend: [],
  aiUsageByClass: [],
  dependencyDistribution: []
})

const usageBarRef = ref(null)
const scoreLineRef = ref(null)
const studyLineRef = ref(null)
const dependencyPieRef = ref(null)
const studentScoreRef = ref(null)
const studentUsagePieRef = ref(null)
const funnelChartRef = ref(null)
const beforeAfterChartRef = ref(null)
const analyticsTrendRef = ref(null)
const analyticsScatterRef = ref(null)
let chartInstances = []
let studentChartInstances = []
let feedbackChartInstances = []
let analyticsChartInstances = []
const studentKeyword = ref('')
const students = ref([])
const selectedStudent = ref(null)
const warnings = ref([])
const recommendations = ref([])
const interventionFeedback = ref({})
const analytics = ref({
  failRateCorrelation: 0,
  usageScoreCorrelation: 0,
  declineRatioInOverDependence: 0,
  overDependenceTrend: [],
  trendLabels: [],
  usageScoreScatter: []
})

const todayText = computed(() => {
  return new Date().toLocaleDateString('zh-CN')
})

const semesterWeekText = computed(() => {
  const semesterStart = new Date('2026-02-23')
  const now = new Date()
  const diffDays = Math.max(0, Math.floor((now - semesterStart) / (24 * 3600 * 1000)))
  return `第${Math.floor(diffDays / 7) + 1}教学周`
})

const renderCharts = () => {
  if (!usageBarRef.value || !scoreLineRef.value || !studyLineRef.value || !dependencyPieRef.value) return
  chartInstances.forEach(chart => chart.dispose())
  chartInstances = []

  const usageChart = echarts.init(usageBarRef.value)
  usageChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: overview.value.aiUsageByClass.map(i => i.className) },
    yAxis: { type: 'value', name: '小时' },
    series: [{ type: 'bar', data: overview.value.aiUsageByClass.map(i => i.hours), itemStyle: { color: '#3b82f6' } }]
  })
  chartInstances.push(usageChart)

  const scoreChart = echarts.init(scoreLineRef.value)
  scoreChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: overview.value.weekLabels },
    yAxis: { type: 'value', min: 0, max: 100 },
    series: [{ type: 'line', smooth: true, data: overview.value.avgScoreTrend, itemStyle: { color: '#10b981' } }]
  })
  chartInstances.push(scoreChart)

  const studyChart = echarts.init(studyLineRef.value)
  studyChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: overview.value.weekLabels },
    yAxis: { type: 'value', name: '小时' },
    series: [{ type: 'line', smooth: true, data: overview.value.studyDurationTrend, itemStyle: { color: '#f59e0b' } }]
  })
  chartInstances.push(studyChart)

  const dependencyChart = echarts.init(dependencyPieRef.value)
  dependencyChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: overview.value.dependencyDistribution.map(item => ({ name: `${item.level}依赖`, value: item.count }))
    }]
  })
  chartInstances.push(dependencyChart)
}

const handleResize = () => {
  chartInstances.forEach(chart => chart.resize())
  studentChartInstances.forEach(chart => chart.resize())
  feedbackChartInstances.forEach(chart => chart.resize())
  analyticsChartInstances.forEach(chart => chart.resize())
}

const renderFeedbackCharts = () => {
  if (!interventionFeedback.value?.stageLabels || !funnelChartRef.value || !beforeAfterChartRef.value) return
  feedbackChartInstances.forEach(chart => chart.dispose())
  feedbackChartInstances = []

  const funnelChart = echarts.init(funnelChartRef.value)
  funnelChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: interventionFeedback.value.stageLabels },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: interventionFeedback.value.funnelValues, itemStyle: { color: '#8b5cf6' } }]
  })
  feedbackChartInstances.push(funnelChart)

  const beforeAfterChart = echarts.init(beforeAfterChartRef.value)
  beforeAfterChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: interventionFeedback.value.scoreBeforeAfter.map(i => i.category) },
    yAxis: { type: 'value', min: 0, max: 100 },
    series: [{ type: 'bar', data: interventionFeedback.value.scoreBeforeAfter.map(i => i.value), itemStyle: { color: '#06b6d4' } }]
  })
  feedbackChartInstances.push(beforeAfterChart)
}

const renderStudentCharts = () => {
  if (!selectedStudent.value || !studentScoreRef.value || !studentUsagePieRef.value) return
  studentChartInstances.forEach(chart => chart.dispose())
  studentChartInstances = []

  const scoreChart = echarts.init(studentScoreRef.value)
  scoreChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['第1周', '第2周', '第3周', '第4周', '第5周'] },
    yAxis: { type: 'value', min: 0, max: 100 },
    series: [{ type: 'line', smooth: true, data: selectedStudent.value.scoreTrend, itemStyle: { color: '#2563eb' } }]
  })
  studentChartInstances.push(scoreChart)

  const usageChart = echarts.init(studentUsagePieRef.value)
  usageChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{ type: 'pie', radius: ['40%', '70%'], data: selectedStudent.value.aiUsageComposition }]
  })
  studentChartInstances.push(usageChart)
}

const renderAnalyticsCharts = () => {
  if (!analyticsTrendRef.value || !analyticsScatterRef.value) return
  analyticsChartInstances.forEach(chart => chart.dispose())
  analyticsChartInstances = []

  const trendChart = echarts.init(analyticsTrendRef.value)
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: analytics.value.trendLabels },
    yAxis: { type: 'value', name: '人数' },
    series: [{ type: 'line', smooth: true, data: analytics.value.overDependenceTrend, itemStyle: { color: '#ef4444' } }]
  })
  analyticsChartInstances.push(trendChart)

  const scatterChart = echarts.init(analyticsScatterRef.value)
  scatterChart.setOption({
    tooltip: { trigger: 'item' },
    xAxis: { type: 'value', name: 'AI使用时长(小时)' },
    yAxis: { type: 'value', name: '成绩' },
    series: [{ type: 'scatter', data: analytics.value.usageScoreScatter, itemStyle: { color: '#6366f1' } }]
  })
  analyticsChartInstances.push(scatterChart)
}

const fetchOverview = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await api.aiHealth.overview()
    if (res.success) {
      overview.value = {
        ...overview.value,
        ...res.data,
        updatedAt: res.data.updatedAt ? new Date(res.data.updatedAt).toLocaleString() : '-'
      }
      await nextTick()
      renderCharts()
    } else {
      error.value = res.message || '获取概览失败'
    }
  } catch (e) {
    error.value = '获取概览失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const fetchStudents = async () => {
  try {
    const res = await api.aiHealth.students({ keyword: studentKeyword.value.trim() })
    if (res.success) {
      students.value = res.data || []
      if (students.value.length && !selectedStudent.value) {
        await loadStudentDetail(students.value[0].id)
      }
    }
  } catch (e) {
    students.value = []
  }
}

const loadStudentDetail = async (id) => {
  try {
    const res = await api.aiHealth.studentDetail(id)
    if (res.success) {
      selectedStudent.value = res.data
      await nextTick()
      renderStudentCharts()
    }
  } catch (e) {
    selectedStudent.value = null
  }
}

const fetchWarnings = async () => {
  try {
    const res = await api.aiHealth.warnings()
    warnings.value = res.success ? (res.data || []) : []
  } catch (e) {
    warnings.value = []
  }
}

const fetchRecommendations = async () => {
  try {
    const res = await api.aiHealth.recommendations()
    recommendations.value = res.success ? (res.data || []) : []
  } catch (e) {
    recommendations.value = []
  }
}

const fetchInterventionFeedback = async () => {
  try {
    const res = await api.aiHealth.interventionFeedback()
    interventionFeedback.value = res.success ? (res.data || {}) : {}
    await nextTick()
    renderFeedbackCharts()
  } catch (e) {
    interventionFeedback.value = {}
  }
}

const fetchAnalytics = async () => {
  try {
    const res = await api.aiHealth.analytics()
    analytics.value = res.success ? (res.data || analytics.value) : analytics.value
    await nextTick()
    renderAnalyticsCharts()
  } catch (e) {
    // keep previous analytics values
  }
}

const percentText = value => `${Math.round((value || 0) * 100)}%`

onMounted(async () => {
  await fetchOverview()
  await fetchStudents()
  await fetchWarnings()
  await fetchRecommendations()
  await fetchInterventionFeedback()
  await fetchAnalytics()
})
onMounted(() => window.addEventListener('resize', handleResize))
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstances.forEach(chart => chart.dispose())
  studentChartInstances.forEach(chart => chart.dispose())
  feedbackChartInstances.forEach(chart => chart.dispose())
  analyticsChartInstances.forEach(chart => chart.dispose())
  chartInstances = []
  studentChartInstances = []
  feedbackChartInstances = []
  analyticsChartInstances = []
})
</script>

<style scoped>
.ai-health-assessment-page {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  min-height: 100vh;
}
.page-header {
  text-align: center;
  margin-bottom: 24px;
}
.page-header h1 {
  font-size: 28px;
  margin: 0;
}
.page-header .subtitle {
  color: #666;
  margin-top: 4px;
}
.meta {
  margin-top: 8px;
  color: #475569;
  font-size: 14px;
}
.data-card {
  border-radius: 12px;
  margin-bottom: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.updated-at {
  font-size: 12px;
  color: #666;
}
.overview-list {
  margin: 0;
  padding-left: 18px;
  line-height: 1.9;
}
.state-text {
  color: #666;
}
.state-text.error {
  color: #d9534f;
}
.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.chart-card {
  border-radius: 12px;
}
.chart-box {
  width: 100%;
  height: 320px;
}
.student-query {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.query-tools {
  display: flex;
  gap: 8px;
}
.query-input {
  max-width: 360px;
}
.query-content {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 12px;
}
.student-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  max-height: 280px;
  overflow: auto;
}
.student-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
}
.student-item.active {
  background: #e0f2fe;
}
.empty-item {
  padding: 12px;
  color: #64748b;
}
.student-detail {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}
.empty-detail {
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 20px;
  color: #64748b;
}
.detail-chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.detail-chart {
  height: 240px;
}
.warning-list {
  display: grid;
  gap: 10px;
}
.warning-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
}
.warning-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.warning-student {
  font-weight: 600;
}
.warning-level {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 999px;
}
.level-轻度 {
  background: #ecfeff;
  color: #0e7490;
}
.level-中度 {
  background: #fffbeb;
  color: #b45309;
}
.level-重度 {
  background: #fef2f2;
  color: #b91c1c;
}
.warning-line {
  margin: 6px 0;
  color: #334155;
}
.warning-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}
.plan-list {
  display: grid;
  gap: 10px;
}
.plan-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
}
.plan-item h4 {
  margin: 0 0 6px;
}
.plan-item p {
  margin: 0 0 6px;
  color: #334155;
}
.feedback-wrap {
  display: grid;
  gap: 10px;
}
.feedback-chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.feedback-summary {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
}
.feedback-summary p {
  margin: 6px 0;
}
.rule-hint {
  color: #475569;
}
.analytics-wrap {
  display: grid;
  gap: 10px;
}
.analytics-kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.kpi-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
}
.kpi-label {
  color: #475569;
  font-size: 13px;
}
.kpi-value {
  margin-top: 6px;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}
@media (max-width: 1200px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }
  .query-content {
    grid-template-columns: 1fr;
  }
  .detail-chart-grid {
    grid-template-columns: 1fr;
  }
  .feedback-chart-grid {
    grid-template-columns: 1fr;
  }
  .analytics-kpis {
    grid-template-columns: 1fr;
  }
}
</style>
