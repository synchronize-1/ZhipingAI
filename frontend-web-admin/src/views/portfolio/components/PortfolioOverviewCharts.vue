<template>
  <!-- 图表区域 -->
  <el-row :gutter="16" class="chart-row">
    <!-- 技能分类统计环形图 -->
    <el-col :lg="8" :md="12" :xs="24">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">技能分类统计</span>
          </div>
        </template>
        <div ref="skillChartRef" class="chart-container"></div>
      </el-card>
    </el-col>

    <!-- 荣誉级别分布柱状图 -->
    <el-col :lg="8" :md="12" :xs="24">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">荣誉级别分布</span>
          </div>
        </template>
        <div ref="honorChartRef" class="chart-container"></div>
      </el-card>
    </el-col>

    <!-- 最近3次考试成绩趋势折线图 -->
    <el-col :lg="8" :md="24" :xs="24">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">考试成绩趋势</span>
            <el-tag size="small" type="info">最近3次</el-tag>
          </div>
        </template>
        <div ref="scoreChartRef" class="chart-container"></div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { useECharts } from '@/composables/useECharts'
import {
  buildSkillPieOption,
  buildHonorBarOption,
  buildScoreTrendOption
} from '../utils/portfolioOverviewCharts'

const props = defineProps({
  skillCategoryData: { type: Array, default: () => [] },
  honorLevelData: { type: Array, default: () => [] },
  examScoreData: { type: Array, default: () => [] },
  ready: { type: Boolean, default: false }
})

const skillChartRef = ref(null)
const honorChartRef = ref(null)
const scoreChartRef = ref(null)

const skillChart = useECharts(skillChartRef, null)
const honorChart = useECharts(honorChartRef, null)
const scoreChart = useECharts(scoreChartRef, null)

const renderCharts = () => {
  if (!props.ready) return
  if (skillChartRef.value) {
    skillChart.setOption(buildSkillPieOption({ skillCategoryData: props.skillCategoryData }), true)
  }
  if (honorChartRef.value) {
    honorChart.setOption(buildHonorBarOption({ honorLevelData: props.honorLevelData }), true)
  }
  if (scoreChartRef.value) {
    scoreChart.setOption(buildScoreTrendOption({ examScoreData: props.examScoreData }), true)
  }
}

watch(
  [() => props.ready, () => props.skillCategoryData, () => props.honorLevelData, () => props.examScoreData],
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