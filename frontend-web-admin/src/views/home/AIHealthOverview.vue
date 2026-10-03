<!-- frontend-web-admin/src/views/home/AIHealthOverview.vue -->
<template>
  <div class="ai-health-overview" :class="{ 'is-compact': compact }">
    <div v-if="loading" class="state-text">
      <el-icon class="is-loading"><Loading /></el-icon> 加载中...
    </div>
    <div v-else-if="error" class="state-text error">
      <el-icon><CircleClose /></el-icon> {{ error }}
    </div>
    <div v-else>
      <!-- 统计卡片（紧凑模式下显示更紧凑） -->
      <div class="stats-row" :class="{ 'compact': compact }">
        <div class="stat-card-mini">
          <span class="stat-label">班级总人数</span>
          <span class="stat-value">{{ overview.classTotal || 0 }}</span>
        </div>
        <div class="stat-card-mini">
          <span class="stat-label">周AI使用(h)</span>
          <span class="stat-value">{{ overview.aiUsageHoursWeekly || 0 }}</span>
        </div>
        <div class="stat-card-mini">
          <span class="stat-label">预警学生</span>
          <span class="stat-value warning">{{ overview.warningCount || 0 }}</span>
        </div>
      </div>

      <!-- 图表网格 -->
      <div class="charts-grid" :class="{ 'compact': compact }">
        <div class="chart-card">
          <div class="chart-title">
            <span class="title-icon">📊</span>
            <span>AI使用时长（按班级）</span>
          </div>
          <div ref="usageBarRef" class="chart-box" :style="{ height: compact ? '200px' : '260px' }"></div>
        </div>

        <div class="chart-card">
          <div class="chart-title">
            <span class="title-icon">📈</span>
            <span>学生成绩趋势</span>
          </div>
          <div ref="scoreLineRef" class="chart-box" :style="{ height: compact ? '200px' : '260px' }"></div>
        </div>

        <div class="chart-card">
          <div class="chart-title">
            <span class="title-icon">⏰</span>
            <span>周学习时长趋势</span>
          </div>
          <div ref="studyLineRef" class="chart-box" :style="{ height: compact ? '200px' : '260px' }"></div>
        </div>

        <div class="chart-card">
          <div class="chart-title">
            <span class="title-icon">🥧</span>
            <span>依赖程度分布</span>
          </div>
          <div ref="dependencyPieRef" class="chart-box" :style="{ height: compact ? '200px' : '260px' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { aiHealthAPI } from '@/api/aiHealth'
import { Loading, CircleClose } from '@element-plus/icons-vue'

const props = defineProps({
  compact: {
    type: Boolean,
    default: false
  }
})

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
      axisLabel: { rotate: 30, interval: 0, fontSize: 10 }
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
      label: { show: true, position: 'top', formatter: '{c}h', fontSize: 10 }
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
      symbolSize: 6,
      lineStyle: { color: '#10b981', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
          { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
        ])
      },
      itemStyle: { color: '#10b981' },
      label: { show: true, position: 'top', formatter: '{c}分', fontSize: 10 }
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
      symbolSize: 6,
      lineStyle: { color: '#f59e0b', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
          { offset: 1, color: 'rgba(245, 158, 11, 0.05)' }
        ])
      },
      itemStyle: { color: '#f59e0b' },
      label: { show: true, position: 'top', formatter: '{c}h', fontSize: 10 }
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
    legend: { orient: 'vertical', right: 10, top: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['40%', '50%'],
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
    // 清理旧图表
    chartInstances.forEach(chart => chart?.dispose())
    chartInstances = []
    renderUsageBarChart()
    renderScoreLineChart()
    renderStudyLineChart()
    renderDependencyPieChart()
  })
}

// 窗口自适应
const handleResize = () => {
  chartInstances.forEach(chart => chart?.resize())
}

// 获取数据
const fetchOverview = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await aiHealthAPI.overview()
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

// 监听 compact 变化，重新调整图表大小
watch(() => props.compact, () => {
  nextTick(() => {
    chartInstances.forEach(chart => chart?.resize())
  })
})

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
.ai-health-overview {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.ai-health-overview.is-compact {
  padding: 16px;
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
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.stats-row.compact {
  margin-bottom: 12px;
}

.stat-card-mini {
  flex: 1;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  padding: 12px 16px;
  text-align: center;
  border: 1px solid #e2e8f0;
}

.stat-card-mini .stat-label {
  display: block;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px;
}

.stat-card-mini .stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.stat-card-mini .stat-value.warning {
  color: #ef4444;
}

/* 图表网格 */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.charts-grid.compact {
  gap: 12px;
}

.chart-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 12px;
  border: 1px solid #e2e8f0;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
  font-weight: 600;
  font-size: 13px;
  color: #334155;
}

.title-icon {
  font-size: 14px;
}

.chart-box {
  width: 100%;
}

/* 响应式 */
@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>