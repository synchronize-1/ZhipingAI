<!-- frontend-web-admin/src/views/ai-health/components/AIHealthAnalytics.vue -->
<template>
  <el-card class="analytics-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>📐 综合指标分析</span>
        <el-button size="small" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>
    </template>

    <div v-if="loading" class="state-text">
      <el-icon class="is-loading"><Loading /></el-icon> 加载中...
    </div>
    <div v-else-if="error" class="state-text error">
      <el-icon><CircleClose /></el-icon> {{ error }}
    </div>
    <div v-else>
      <!-- KPI 指标卡片 -->
      <div class="kpi-grid">
        <div class="kpi-item">
          <div class="kpi-header">
            <span class="kpi-icon blue">📊</span>
            <span class="kpi-label">不及格率与AI使用相关性</span>
          </div>
          <div class="kpi-value">{{ formatPercent(analytics.failRateCorrelation) }}</div>
          <div class="kpi-trend" :class="getTrendClass(analytics.failRateCorrelation, 0.5)">
            {{ getTrendText(analytics.failRateCorrelation, 0.5) }}
          </div>
        </div>
        <div class="kpi-item">
          <div class="kpi-header">
            <span class="kpi-icon green">📈</span>
            <span class="kpi-label">成绩与AI使用时长</span>
          </div>
          <div class="kpi-value">{{ analytics.usageScoreCorrelation?.toFixed(2) }}</div>
          <div class="kpi-trend" :class="getTrendClass(analytics.usageScoreCorrelation, 0, true)">
            {{ getCorrelationText(analytics.usageScoreCorrelation) }}
          </div>
        </div>
        <div class="kpi-item">
          <div class="kpi-header">
            <span class="kpi-icon orange">⚠️</span>
            <span class="kpi-label">过度依赖学生成绩下滑比例</span>
          </div>
          <div class="kpi-value">{{ formatPercent(analytics.declineRatioInOverDependence) }}</div>
          <div class="kpi-trend down">需重点关注</div>
        </div>
      </div>

      <!-- 干预闭环反馈 -->
      <div class="intervention-section">
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
          <div class="stat-card-mini full">
            <span class="rule-hint">{{ feedback.reassessment?.ruleHint || '连续两周依赖指数下降则降级' }}</span>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-title">
            <span class="title-icon">📉</span>
            <span>过度依赖人数变化趋势</span>
          </div>
          <div ref="trendChartRef" class="chart-box"></div>
        </div>

        <div class="chart-card">
          <div class="chart-title">
            <span class="title-icon">🔵</span>
            <span>成绩 vs AI使用时长散点图</span>
          </div>
          <div ref="scatterChartRef" class="chart-box"></div>
        </div>

        <div class="chart-card">
          <div class="chart-title">
            <span class="title-icon">📊</span>
            <span>干预前后成绩对比</span>
          </div>
          <div ref="beforeAfterChartRef" class="chart-box"></div>
        </div>

        <div class="chart-card">
          <div class="chart-title">
            <span class="title-icon">🔻</span>
            <span>干预漏斗图</span>
          </div>
          <div ref="funnelChartRef" class="chart-box"></div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import api from '@/api'
import { Loading, CircleClose, Refresh } from '@element-plus/icons-vue'

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
const beforeAfterChartRef = ref(null)
const funnelChartRef = ref(null)
let chartInstances = []

// 辅助函数
const formatPercent = (val) => `${Math.round((val || 0) * 100)}%`

const getTrendClass = (val, threshold, isCorrelation = false) => {
  if (isCorrelation) {
    if (val > 0) return 'up'
    if (val < 0) return 'down'
    return 'neutral'
  }
  return val > threshold ? 'up' : 'down'
}

const getTrendText = (val, threshold) => {
  return val > threshold ? '正相关较强' : '正相关较弱'
}

const getCorrelationText = (val) => {
  const abs = Math.abs(val || 0)
  if (abs > 0.7) return '强负相关'
  if (abs > 0.4) return '中等负相关'
  return '弱负相关'
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
      symbolSize: 8,
      lineStyle: { color: '#ef4444', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
          { offset: 1, color: 'rgba(239, 68, 68, 0.05)' }
        ])
      },
      itemStyle: { color: '#ef4444' },
      label: { show: true, position: 'top' }
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
        symbolSize: 10,
        itemStyle: { color: '#667eea', borderColor: '#fff', borderWidth: 2 }
      },
      {
        type: 'line',
        data: trendLine,
        smooth: false,
        lineStyle: { color: '#ef4444', width: 2, type: 'dashed' },
        symbol: 'none',
        tooltip: { show: false }
      }
    ]
  })
  chartInstances.push(chart)
}

// 渲染干预前后成绩对比柱状图
const renderBeforeAfterChart = () => {
  if (!beforeAfterChartRef.value || !feedback.value.scoreBeforeAfter?.length) return

  const chart = echarts.init(beforeAfterChartRef.value)
  const data = feedback.value.scoreBeforeAfter

  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: data.map(item => item.category) },
    yAxis: { type: 'value', name: '成绩', min: 0, max: 100 },
    series: [{
      type: 'bar',
      data: data.map(item => item.value),
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#10b981' },
          { offset: 1, color: '#059669' }
        ])
      },
      label: { show: true, position: 'top', formatter: '{c}分' }
    }]
  })
  chartInstances.push(chart)
}

// 渲染漏斗图
const renderFunnelChart = () => {
  if (!funnelChartRef.value || !feedback.value.stageLabels?.length) return

  const chart = echarts.init(funnelChartRef.value)
  const data = feedback.value.stageLabels.map((label, idx) => ({
    name: label,
    value: feedback.value.funnelValues?.[idx] || 0
  }))

  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}人' },
    series: [{
      type: 'funnel',
      left: '10%',
      width: '80%',
      sort: 'descending',
      gap: 2,
      data: data,
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 2,
        borderRadius: 8
      },
      label: { show: true, position: 'inside' },
      emphasis: { scale: true }
    }]
  })
  chartInstances.push(chart)
}

// 渲染所有图表
const renderAllCharts = () => {
  nextTick(() => {
    // 清理旧图表
    chartInstances.forEach(chart => chart?.dispose())
    chartInstances = []
    // 渲染新图表
    renderTrendChart()
    renderScatterChart()
    renderBeforeAfterChart()
    renderFunnelChart()
  })
}

// 获取数据
const refreshData = async () => {
  loading.value = true
  error.value = ''
  try {
    const [analyticsRes, feedbackRes] = await Promise.all([
      api.aiHealth.analytics(),
      api.aiHealth.interventionFeedback()
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

// 窗口自适应
const handleResize = () => {
  chartInstances.forEach(chart => chart?.resize())
}

onMounted(() => {
  refreshData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstances.forEach(chart => chart?.dispose())
  chartInstances = []
})
</script>

<style scoped>
.analytics-card :deep(.el-card__header) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
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
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.kpi-item {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s;
}

.kpi-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.kpi-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.kpi-icon {
  font-size: 24px;
}

.kpi-label {
  font-size: 13px;
  color: #64748b;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.kpi-trend {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 20px;
  display: inline-block;
}

.kpi-trend.up { background: #dcfce7; color: #15803d; }
.kpi-trend.down { background: #fee2e2; color: #b91c1c; }
.kpi-trend.neutral { background: #f1f5f9; color: #475569; }

/* 干预反馈区域 */
.intervention-section {
  background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.intervention-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.intervention-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.stat-card-mini {
  background: white;
  border-radius: 12px;
  padding: 12px 20px;
  text-align: center;
  min-width: 100px;
}

.stat-card-mini .stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
}

.stat-card-mini .stat-value.success { color: #10b981; }
.stat-card-mini .stat-value.warning { color: #f59e0b; }
.stat-card-mini .stat-value.info { color: #3b82f6; }

.stat-card-mini .stat-label {
  font-size: 12px;
  color: #64748b;
}

.stat-card-mini.full {
  flex: 1;
  min-width: 200px;
}

.rule-hint {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
}

/* 图表区域 */
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
  font-size: 16px;
}

.chart-box {
  width: 100%;
  height: 280px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>