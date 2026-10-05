<template>
  <!-- AI健康概览组件 -->
  <div class="content-card ai-overview">
    <div class="card-header">
      <div class="header-left">
        <div class="header-icon blue">
          <el-icon><DataAnalysis /></el-icon>
        </div>
        <div>
          <h3>AI健康概览</h3>
          <p>全校AI使用健康度</p>
        </div>
      </div>
      <el-button type="primary" text size="small" @click="emit('detail')">
        详情
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
    </div>
    <!-- 简化的 AI 健康概览 -->
    <div class="ai-overview-stats">
      <div class="overview-stat">
        <span class="stat-label">预警学生</span>
        <span class="stat-value">{{ warningsCount }}</span>
      </div>
      <div class="overview-stat">
        <span class="stat-label">AI使用时长(周)</span>
        <span class="stat-value">{{ aiUsageHoursWeekly }}</span>
      </div>
      <div class="overview-stat">
        <span class="stat-label">依赖指数(平均)</span>
        <span class="stat-value">{{ avgDependenceScore }}</span>
      </div>
    </div>
    <div class="mini-chart">
      <div ref="miniChartRef" class="mini-chart-box"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { DataAnalysis, ArrowRight } from '@element-plus/icons-vue'

defineProps({
  warningsCount: { type: Number, default: 0 },
  aiUsageHoursWeekly: { type: Number, default: 0 },
  avgDependenceScore: { type: Number, default: 0 }
})

const emit = defineEmits(['detail'])

// 迷你图表
const miniChartRef = ref(null)
let miniChart = null

// 渲染迷你图表
const renderMiniChart = () => {
  if (!miniChartRef.value) return
  if (miniChart) miniChart.dispose()

  miniChart = echarts.init(miniChartRef.value)
  miniChart.setOption({
    tooltip: { show: false },
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { show: false, type: 'category', data: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周'] },
    yAxis: { show: false },
    series: [{
      type: 'line',
      smooth: true,
      data: [62, 58, 56, 52, 49, 46],
      lineStyle: { color: '#ef4444', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
          { offset: 1, color: 'rgba(239, 68, 68, 0.05)' }
        ])
      },
      symbol: 'none'
    }]
  })
}

// 窗口自适应
const handleResize = () => {
  miniChart?.resize()
}

onMounted(() => {
  setTimeout(renderMiniChart, 100)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  miniChart?.dispose()
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

.header-icon.blue { background: linear-gradient(135deg, #667eea, #764ba2); }

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

/* AI概览统计 */
.ai-overview-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.overview-stat {
  flex: 1;
  text-align: center;
  padding: 8px;
  background: #f1f5f9;
  border-radius: 10px;
}

.overview-stat .stat-label {
  display: block;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
}

.overview-stat .stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.mini-chart-box {
  height: 60px;
}
</style>