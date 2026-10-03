<!-- frontend-web-admin/src/views/home/AIHealthAnalytics.vue -->
<template>
  <div class="ai-health-analytics" :class="{ 'is-compact': compact }">
    <div v-if="loading" class="state-text">
      <el-icon class="is-loading"><Loading /></el-icon> 加载中...
    </div>
    <div v-else-if="error" class="state-text error">
      <el-icon><CircleClose /></el-icon> {{ error }}
    </div>
    <div v-else>
      <!-- KPI 指标卡片（紧凑模式显示简化版） -->
      <div class="kpi-grid" :class="{ 'compact': compact }">
        <div class="kpi-item">
          <div class="kpi-header">
            <span class="kpi-icon blue">📊</span>
            <span class="kpi-label">成绩与AI相关性</span>
          </div>
          <div class="kpi-value">{{ formatPercent(analytics.usageScoreCorrelation, true) }}</div>
          <div class="kpi-trend" :class="getCorrelationTrendClass(analytics.usageScoreCorrelation)">
            {{ getCorrelationTrendText(analytics.usageScoreCorrelation) }}
          </div>
        </div>
        <div class="kpi-item">
          <div class="kpi-header">
            <span class="kpi-icon orange">⚠️</span>
            <span class="kpi-label">过度依赖下滑比</span>
          </div>
          <div class="kpi-value">{{ formatPercent(analytics.declineRatioInOverDependence) }}</div>
          <div class="kpi-trend down">需重点关注</div>
        </div>
      </div>

      <!-- 图表网格 -->
      <div class="charts-grid" :class="{ 'compact': compact }">
        <div class="chart-card">
          <div class="chart-title">
            <span class="title-icon">📉</span>
            <span>过度依赖人数趋势</span>
          </div>
          <div ref="trendChartRef" class="chart-box" :style="{ height: compact ? '180px' : '220px' }"></div>
        </div>

        <div class="chart-card">
          <div class="chart-title">
            <span class="title-icon">🔵</span>
            <span>成绩 vs AI使用时长</span>
          </div>
          <div ref="scatterChartRef" class="chart-box" :style="{ height: compact ? '180px' : '220px' }"></div>
        </div>
      </div>

      <!-- 干预反馈（紧凑模式下隐藏） -->
      <div v-if="!compact" class="intervention-section">
        <h4>📋 干预闭环反馈</h4>
        <div class="intervention-stats">
          <div class="stat-card-mini">
            <span class="stat-value success">{{ feedback.reassessment?.downgradedCount || 0 }}</span>
            <span class="stat-label">降级人数</span>
          </div>
          <div class="stat-card-mini">
            <span class="stat-value warning">{{ feedback.reassessment?.escalatedCount || 0 }}</span>
            <span class="stat-label">升级人数</span>
          </div>
          <div class="stat-card-mini">
            <span class="stat-value info">{{ feedback.reassessment?.unchangedCount || 0 }}</span>
            <span class="stat-label">不变人数</span>
          </div>
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
const analytics = ref({
  failRateCorrelation: 0,
  usageScoreCorrelation: 0,
  declineRatioInOverDependence: 0,
  overDependenceTrend: [],
  trendLabels: [],
  usageScoreScatter: []
})
const feedback = ref({ reassessment: {} })

// 图表引用
const trendChartRef = ref(null)
const scatterChartRef = ref(null)
let chartInstances = []

// 辅助函数
const formatPercent = (val, isCorrelation = false) => {
  if (isCorrelation) return val?.toFixed(2) || '0'
  return `${Math.round((val || 0) * 100)}%`
}

const getCorrelationTrendClass = (val) => {
  if (val < -0.4) return 'down'
  if (val < 0) return 'neutral'
  return 'up'
}

const getCorrelationTrendText = (val) => {
  if (val < -0.4) return '较强负相关'
  if (val < 0) return '弱负相关'
  return '正相关'
}

// 渲染趋势折线图
const renderTrendChart = () => {
  if (!trendChartRef.value || !analytics.value.overDependenceTrend?.length) return
  const chart = echarts.init(trendChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: analytics.value.trendLabels || [] },
    yAxis: { type: 'value', name: '过度依赖人数' },
    series: [{
      type: 'line',
      smooth: true,
      data: analytics.value.overDependenceTrend,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#ef4444', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
          { offset: 1, color: 'rgba(239, 68, 68, 0.05)' }
        ])
      },
      itemStyle: { color: '#ef4444' },
      label: { show: true, position: 'top', fontSize: 10 }
    }]
  })
  chartInstances.push(chart)
}

// 渲染散点图
const renderScatterChart = () => {
  if (!scatterChartRef.value || !analytics.value.usageScoreScatter?.length) return
  const chart = echarts.init(scatterChartRef.value)
  const data = analytics.value.usageScoreScatter

  // 计算趋势线
  let trendLine = []
  if (data.length > 1) {
    const xValues = data.map(p => p[0])
    const yValues = data.map(p => p[1])
    const n = xValues.length
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
    for (let i = 0; i < n; i++) {
      sumX += xValues[i]
      sumY += yValues[i]
      sumXY += xValues[i] * yValues[i]
      sumX2 += xValues[i] * xValues[i]
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    const minX = Math.min(...xValues)
    const maxX = Math.max(...xValues)
    trendLine = [
      [minX, slope * minX + intercept],
      [maxX, slope * maxX + intercept]
    ]
  }

  chart.setOption({
    tooltip: { trigger: 'item', formatter: 'AI使用时长: {c[0]}h<br>成绩: {c[1]}分' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'value', name: 'AI使用时长 (小时)' },
    yAxis: { type: 'value', name: '成绩' },
    series: [
      {
        type: 'scatter',
        data: data,
        symbolSize: 8,
        itemStyle: { color: '#667eea', borderColor: '#fff', borderWidth: 1 }
      },
      {
        type: 'line',
        data: trendLine,
        smooth: false,
        lineStyle: { color: '#ef4444', width: 1, type: 'dashed' },
        symbol: 'none',
        tooltip: { show: false }
      }
    ]
  })
  chartInstances.push(chart)
}

// 渲染所有图表
const renderAllCharts = () => {
  nextTick(() => {
    chartInstances.forEach(chart => chart?.dispose())
    chartInstances = []
    renderTrendChart()
    renderScatterChart()
  })
}

// 窗口自适应
const handleResize = () => {
  chartInstances.forEach(chart => chart?.resize())
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  error.value = ''
  try {
    const [analyticsRes, feedbackRes] = await Promise.all([
      aiHealthAPI.analytics(),
      aiHealthAPI.interventionFeedback()
    ])
    if (analyticsRes.success) analytics.value = analyticsRes.data
    if (feedbackRes.success) feedback.value = feedbackRes.data
    renderAllCharts()
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
  fetchData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstances.forEach(chart => chart?.dispose())
  chartInstances = []
})
</script>

<style scoped>
.ai-health-analytics {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.ai-health-analytics.is-compact {
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

/* KPI 卡片 */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.kpi-grid.compact {
  gap: 12px;
  margin-bottom: 16px;
}

.kpi-item {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.kpi-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.kpi-icon {
  font-size: 20px;
}

.kpi-label {
  font-size: 12px;
  color: #64748b;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
}

.kpi-trend {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 12px;
  display: inline-block;
}

.kpi-trend.up { background: #dcfce7; color: #15803d; }
.kpi-trend.down { background: #fee2e2; color: #b91c1c; }
.kpi-trend.neutral { background: #f1f5f9; color: #475569; }

/* 图表区域 */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.charts-grid.compact {
  gap: 12px;
  margin-bottom: 0;
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
  margin-bottom: 10px;
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

/* 干预反馈 */
.intervention-section {
  background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%);
  border-radius: 16px;
  padding: 16px;
  margin-top: 16px;
}

.intervention-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.intervention-stats {
  display: flex;
  gap: 12px;
}

.stat-card-mini {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 10px;
  text-align: center;
}

.stat-card-mini .stat-value {
  display: block;
  font-size: 22px;
  font-weight: 700;
}

.stat-card-mini .stat-value.success { color: #10b981; }
.stat-card-mini .stat-value.warning { color: #f59e0b; }
.stat-card-mini .stat-value.info { color: #3b82f6; }

.stat-card-mini .stat-label {
  font-size: 11px;
  color: #64748b;
}

/* 响应式 */
@media (max-width: 768px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>