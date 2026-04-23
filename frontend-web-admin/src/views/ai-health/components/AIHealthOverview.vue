<!-- frontend-web-admin/src/views/ai-health/components/AIHealthOverview.vue -->
<template>
  <el-card class="overview-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>📊 AI健康概览</span>
        <span class="update-time" v-if="overview.updatedAt">更新于 {{ formatTime(overview.updatedAt) }}</span>
      </div>
    </template>

    <div v-if="loading" class="state-text">
      <el-icon class="is-loading"><Loading /></el-icon> 加载中...
    </div>
    <div v-else-if="error" class="state-text error">
      <el-icon><CircleClose /></el-icon> {{ error }}
    </div>
    <div v-else class="overview-content">
      <!-- 统计卡片 -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon blue">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ overview.classTotal || 0 }}</span>
            <span class="stat-label">班级总人数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">
            <el-icon><Avatar /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ overview.teacherTotal || 0 }}</span>
            <span class="stat-label">教师人数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange">
            <el-icon><Timer /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ overview.aiUsageHoursWeekly || 0 }}</span>
            <span class="stat-label">周AI使用时长(h)</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">
            <el-icon><WarningFilled /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value warning">{{ overview.warningCount || 0 }}</span>
            <span class="stat-label">预警学生</span>
          </div>
        </div>
      </div>

      <!-- 图表网格 -->
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-title">
            <span class="title-icon">📊</span>
            <span>AI使用时长（按班级）</span>
          </div>
          <div ref="usageBarRef" class="chart-box"></div>
        </div>

        <div class="chart-card">
          <div class="chart-title">
            <span class="title-icon">📈</span>
            <span>学生成绩趋势（周均）</span>
          </div>
          <div ref="scoreLineRef" class="chart-box"></div>
        </div>

        <div class="chart-card">
          <div class="chart-title">
            <span class="title-icon">⏰</span>
            <span>学习时长趋势（周均）</span>
          </div>
          <div ref="studyLineRef" class="chart-box"></div>
        </div>

        <div class="chart-card">
          <div class="chart-title">
            <span class="title-icon">🥧</span>
            <span>依赖程度分布</span>
          </div>
          <div ref="dependencyPieRef" class="chart-box"></div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import api from '@/api'
import { Loading, CircleClose, User, Avatar, Timer, WarningFilled } from '@element-plus/icons-vue'

const loading = ref(false)
const error = ref('')
const overview = ref({
  classTotal: 0,
  teacherTotal: 0,
  aiUsageHoursWeekly: 0,
  warningCount: 0,
  weekLabels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  avgScoreTrend: [],
  studyDurationTrend: [],
  aiUsageByClass: [],
  dependencyDistribution: [],
  updatedAt: ''
})

// 图表引用
const usageBarRef = ref(null)
const scoreLineRef = ref(null)
const studyLineRef = ref(null)
const dependencyPieRef = ref(null)
let chartInstances = []

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString()
}

// 渲染柱状图
const renderUsageBarChart = () => {
  if (!usageBarRef.value || !overview.value.aiUsageByClass?.length) return
  const chart = echarts.init(usageBarRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: {
      type: 'category',
      data: overview.value.aiUsageByClass.map(item => item.class_name),
      axisLabel: { rotate: 30, interval: 0, fontSize: 11 }
    },
    yAxis: { type: 'value', name: '使用时长 (小时)' },
    series: [{
      type: 'bar',
      data: overview.value.aiUsageByClass.map(item => item.hours),
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#764ba2' }
        ])
      },
      label: { show: true, position: 'top', formatter: '{c}h' }
    }]
  })
  chartInstances.push(chart)
}

// 渲染成绩折线图
const renderScoreLineChart = () => {
  if (!scoreLineRef.value) return
  const weekLabels = overview.value.weekLabels?.slice(0, overview.value.avgScoreTrend?.length) || []
  const chart = echarts.init(scoreLineRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: weekLabels },
    yAxis: { type: 'value', name: '成绩', min: 0, max: 100 },
    series: [{
      type: 'line',
      smooth: true,
      data: overview.value.avgScoreTrend || [],
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#10b981', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
          { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
        ])
      },
      itemStyle: { color: '#10b981' },
      label: { show: true, position: 'top', formatter: '{c}分' }
    }]
  })
  chartInstances.push(chart)
}

// 渲染学习时长折线图
const renderStudyLineChart = () => {
  if (!studyLineRef.value) return
  const weekLabels = overview.value.weekLabels?.slice(0, overview.value.studyDurationTrend?.length) || []
  const chart = echarts.init(studyLineRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: weekLabels },
    yAxis: { type: 'value', name: '学习时长 (小时)' },
    series: [{
      type: 'line',
      smooth: true,
      data: overview.value.studyDurationTrend || [],
      symbol: 'diamond',
      symbolSize: 8,
      lineStyle: { color: '#f59e0b', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
          { offset: 1, color: 'rgba(245, 158, 11, 0.05)' }
        ])
      },
      itemStyle: { color: '#f59e0b' },
      label: { show: true, position: 'top', formatter: '{c}h' }
    }]
  })
  chartInstances.push(chart)
}

// 渲染依赖程度饼图
const renderDependencyPieChart = () => {
  if (!dependencyPieRef.value) return
  const data = overview.value.dependencyDistribution || []
  const chart = echarts.init(dependencyPieRef.value)
  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {d}% ({c}人)' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['45%', '50%'],
      data: data.map(item => ({
        name: `${item.level}依赖`,
        value: item.count,
        itemStyle: { color: item.level === '低' ? '#10b981' : (item.level === '中' ? '#f59e0b' : '#ef4444') }
      })),
      label: { show: false },
      emphasis: { scale: true }
    }]
  })
  chartInstances.push(chart)
}

// 渲染所有图表
const renderAllCharts = () => {
  if (!overview.value.aiUsageByClass?.length) return
  nextTick(() => {
    renderUsageBarChart()
    renderScoreLineChart()
    renderStudyLineChart()
    renderDependencyPieChart()
  })
}

// 窗口自适应
let resizeObserver = null
const handleResize = () => {
  chartInstances.forEach(chart => chart?.resize())
}

// 获取数据
const fetchOverview = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await api.aiHealth.overview()
    if (res.success) {
      overview.value = { ...overview.value, ...res.data }
      renderAllCharts()
    } else {
      error.value = res.message || '获取数据失败'
    }
  } catch (e) {
    error.value = e.message || '网络错误'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOverview()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstances.forEach(chart => chart?.dispose())
  chartInstances = []
})
</script>

<style scoped>
.overview-card :deep(.el-card__header) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.update-time {
  font-size: 12px;
  font-weight: normal;
  color: #94a3b8;
}

.state-text {
  text-align: center;
  padding: 40px;
  color: #64748b;
}

.state-text.error {
  color: #ef4444;
}

/* 统计卡片行 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.blue { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-icon.green { background: linear-gradient(135deg, #11998e, #38ef7d); }
.stat-icon.orange { background: linear-gradient(135deg, #f093fb, #f5576c); }
.stat-icon.red { background: linear-gradient(135deg, #ef4444, #dc2626); }

.stat-info {
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.stat-value.warning {
  color: #ef4444;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
}

/* 图表网格 */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s;
}

.chart-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
  font-weight: 600;
  color: #334155;
}

.title-icon {
  font-size: 18px;
}

.chart-box {
  width: 100%;
  height: 280px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>