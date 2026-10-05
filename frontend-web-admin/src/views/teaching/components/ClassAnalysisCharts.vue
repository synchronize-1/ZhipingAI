<template>
  <!-- 图表区域：各科成绩对比 + 分数段分布 -->
  <el-row :gutter="16" class="chart-row">
    <el-col :lg="12" :md="24">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <span class="chart-title">各科成绩对比</span>
        </template>
        <div ref="subjectBarChartRef" class="chart-container"></div>
      </el-card>
    </el-col>
    <el-col :lg="12" :md="24">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <span class="chart-title">分数段分布</span>
        </template>
        <div ref="scorePieChartRef" class="chart-container"></div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { useECharts } from '@/composables/useECharts'
import { buildSubjectBarOption, buildScorePieOption } from '../utils/analysisCharts'

const props = defineProps({
  subjectStats: { type: Array, default: () => [] },
  scoreDistribution: { type: Array, default: () => [] }
})

const subjectBarChartRef = ref(null)
const scorePieChartRef = ref(null)

const subjectBarChart = useECharts(subjectBarChartRef, null)
const scorePieChart = useECharts(scorePieChartRef, null)

const renderCharts = () => {
  if (subjectBarChartRef.value) {
    subjectBarChart.setOption(buildSubjectBarOption({ subjects: props.subjectStats }), true)
  }
  if (scorePieChartRef.value) {
    scorePieChart.setOption(buildScorePieOption({ distribution: props.scoreDistribution }), true)
  }
}

watch(
  [() => props.subjectStats, () => props.scoreDistribution],
  () => { nextTick(renderCharts) },
  { deep: true }
)

onMounted(() => { nextTick(renderCharts) })
</script>

<style scoped lang="scss">
.chart-row {
  margin-bottom: 16px;

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
}
</style>