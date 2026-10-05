<template>
  <!-- 图表区域 -->
  <el-row :gutter="16" class="chart-row">
    <el-col :lg="14" :md="24">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <span class="chart-title">历次考试成绩趋势</span>
          <el-radio-group v-model="trendType" size="small" style="margin-left: 16px">
            <el-radio-button value="total">总分</el-radio-button>
            <el-radio-button value="average">平均分</el-radio-button>
            <el-radio-button value="rank">排名</el-radio-button>
          </el-radio-group>
        </template>
        <div ref="trendChartRef" class="chart-container"></div>
      </el-card>
    </el-col>
    <el-col :lg="10" :md="24">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <span class="chart-title">各科成绩雷达图（最近一次考试）</span>
        </template>
        <div ref="subjectRadarRef" class="chart-container"></div>
      </el-card>
    </el-col>
  </el-row>

  <el-row :gutter="16" class="chart-row">
    <el-col :lg="12" :md="24">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <span class="chart-title">班级排名趋势</span>
        </template>
        <div ref="classRankTrendRef" class="chart-container chart-container--short"></div>
      </el-card>
    </el-col>
    <el-col :lg="12" :md="24">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <span class="chart-title">年级排名趋势</span>
        </template>
        <div ref="gradeRankTrendRef" class="chart-container chart-container--short"></div>
      </el-card>
    </el-col>
  </el-row>

  <!-- 历次成绩对比 -->
  <el-row :gutter="16" class="chart-row">
    <el-col :lg="12" :md="24">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <span class="chart-title">历次成绩对比</span>
        </template>
        <el-empty
          v-if="trendData.length <= 1"
          description="暂无足够数据用于趋势对比"
          :image-size="80"
        />
        <div v-else ref="examCompareRef" class="chart-container"></div>
      </el-card>
    </el-col>
    <el-col :lg="12" :md="24">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <span class="chart-title">各科成绩趋势</span>
        </template>
        <el-empty
          v-if="subjectTrendSubjects.length === 0"
          description="暂无学科趋势数据"
          :image-size="80"
        />
        <div v-else ref="subjectTrendChartRef" class="chart-container"></div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { useECharts } from '@/composables/useECharts'
import {
  buildTrendOption,
  buildSubjectRadarOption,
  buildRankTrendOption,
  buildExamCompareOption,
  buildSubjectTrendOption
} from '../utils/analysisCharts'

const props = defineProps({
  examHistory: { type: Array, default: () => [] },
  trendData: { type: Array, default: () => [] },
  subjectScores: { type: Array, default: () => [] },
  subjectTrendSubjects: { type: Array, default: () => [] }
})

const trendType = ref('total')

const trendChartRef = ref(null)
const subjectRadarRef = ref(null)
const classRankTrendRef = ref(null)
const gradeRankTrendRef = ref(null)
const examCompareRef = ref(null)
const subjectTrendChartRef = ref(null)

const trendChart = useECharts(trendChartRef, null)
const subjectRadarChart = useECharts(subjectRadarRef, null)
const classRankTrendChart = useECharts(classRankTrendRef, null)
const gradeRankTrendChart = useECharts(gradeRankTrendRef, null)
const examCompareChart = useECharts(examCompareRef, null)
const subjectTrendChart = useECharts(subjectTrendChartRef, null)

const renderCharts = () => {
  if (trendChartRef.value) {
    trendChart.setOption(buildTrendOption({ exams: props.examHistory, trendType: trendType.value }), true)
  }

  if (subjectRadarRef.value) {
    subjectRadarChart.setOption(buildSubjectRadarOption({ subjects: props.subjectScores }), true)
  }

  if (classRankTrendRef.value) {
    classRankTrendChart.setOption(buildRankTrendOption({
      exams: props.examHistory,
      name: '班级排名',
      dataKey: 'classRank',
      color: '#409eff',
      areaColor: 'rgba(64, 158, 255, 0.1)',
      yName: '班级排名'
    }), true)
  }

  if (gradeRankTrendRef.value) {
    gradeRankTrendChart.setOption(buildRankTrendOption({
      exams: props.examHistory,
      name: '年级排名',
      dataKey: 'gradeRank',
      color: '#f59e0b',
      areaColor: 'rgba(245, 158, 11, 0.1)',
      yName: '年级排名'
    }), true)
  }

  // 容器因空状态未渲染时销毁旧实例，避免复用已卸载的 DOM
  if (examCompareRef.value) {
    examCompareChart.setOption(buildExamCompareOption({ exams: props.trendData }), true)
  } else {
    examCompareChart.dispose()
  }

  if (subjectTrendChartRef.value && props.subjectTrendSubjects.length > 0) {
    subjectTrendChart.setOption(buildSubjectTrendOption({
      subjects: props.subjectTrendSubjects,
      exams: props.trendData
    }), true)
  } else {
    subjectTrendChart.dispose()
  }
}

watch(
  [() => props.examHistory, () => props.trendData, () => props.subjectScores, () => props.subjectTrendSubjects, trendType],
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

      &--short {
        height: 240px;
      }
    }
  }
}
</style>