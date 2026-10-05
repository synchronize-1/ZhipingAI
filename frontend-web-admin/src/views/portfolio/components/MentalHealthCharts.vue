<template>
  <!-- 趋势图表区域 -->
  <el-row :gutter="16" class="chart-row">
    <el-col :lg="12" :md="24">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">情绪指数趋势</span>
            <el-tag type="success" size="small">近6次测评</el-tag>
          </div>
        </template>
        <div ref="emotionChartRef" class="chart-container"></div>
      </el-card>
    </el-col>
    <el-col :lg="12" :md="24">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">压力水平变化</span>
            <el-tag type="warning" size="small">近6次测评</el-tag>
          </div>
        </template>
        <div ref="stressChartRef" class="chart-container"></div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { useECharts } from '@/composables/useECharts'
import { buildEmotionTrendOption, buildStressTrendOption } from '../utils/mentalHealthCharts'

const props = defineProps({
  trendData: { type: Array, default: () => [] },
  ready: { type: Boolean, default: false }
})

const emotionChartRef = ref(null)
const stressChartRef = ref(null)

const emotionChart = useECharts(emotionChartRef, null)
const stressChart = useECharts(stressChartRef, null)

const renderCharts = () => {
  if (!props.ready) return
  if (emotionChartRef.value) {
    emotionChart.setOption(buildEmotionTrendOption({ data: props.trendData }), true)
  }
  if (stressChartRef.value) {
    stressChart.setOption(buildStressTrendOption({ data: props.trendData }), true)
  }
}

watch(
  [() => props.ready, () => props.trendData],
  () => { nextTick(renderCharts) },
  { deep: true }
)

onMounted(() => { nextTick(renderCharts) })
</script>

<style scoped lang="scss">
.chart-row {
  margin-bottom: 16px;

  .chart-card {
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .card-title {
        font-weight: 600;
        font-size: 15px;
      }
    }

    .chart-container {
      width: 100%;
      height: 260px;
    }
  }
}
</style>