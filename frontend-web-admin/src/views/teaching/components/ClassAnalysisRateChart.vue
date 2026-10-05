<template>
  <el-card shadow="never" class="chart-card">
    <template #header>
      <span class="chart-title">各科及格率/优秀率对比</span>
    </template>
    <div ref="rateBarChartRef" class="chart-container"></div>
  </el-card>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { useECharts } from '@/composables/useECharts'
import { buildRateBarOption } from '../utils/analysisCharts'

const props = defineProps({
  subjectStats: { type: Array, default: () => [] }
})

const rateBarChartRef = ref(null)
const rateBarChart = useECharts(rateBarChartRef, null)

const renderChart = () => {
  if (!rateBarChartRef.value) return
  rateBarChart.setOption(buildRateBarOption({ subjects: props.subjectStats }), true)
}

watch(() => props.subjectStats, () => { nextTick(renderChart) }, { deep: true })

onMounted(() => { nextTick(renderChart) })
</script>

<style scoped lang="scss">
.chart-card {
  height: 100%;

  .chart-title {
    font-weight: 600;
    font-size: 15px;
  }

  .chart-container {
    width: 100%;
    height: 320px;
  }
}
</style>