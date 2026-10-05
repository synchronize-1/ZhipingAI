<template>
  <div class="class-analysis">
    <PageHeader title="班级学情分析" description="查看班级整体学情数据与分析" :breadcrumbs="breadcrumbs" />

    <!-- 筛选区 -->
    <ClassAnalysisFilter
      v-model:exam-id="filterForm.examId"
      v-model:class-id="filterForm.classId"
      :exam-list="examList"
      :class-list="classList"
      :loading="loading"
      @query="loadAnalysisData"
      @exam-change="handleExamChange"
      @class-change="handleClassChange"
      @diagnose="openDiagnosis"
    />

    <div v-loading="loading" class="analysis-content">
      <!-- 核心指标卡片 -->
      <ClassAnalysisMetrics :overall-metrics="overallMetrics" />

      <!-- 图表区域 -->
      <ClassAnalysisCharts :subject-stats="subjectStats" :score-distribution="scoreDistribution" />

      <el-row :gutter="16" class="chart-row">
        <el-col :lg="12" :md="24">
          <ClassAnalysisRateChart :subject-stats="subjectStats" />
        </el-col>
        <el-col :lg="12" :md="24">
          <ClassAnalysisTopStudents :top-students="topStudents" />
        </el-col>
      </el-row>

      <!-- 薄弱科目识别与建议 -->
      <ClassAnalysisWeakSuggestions :weak-subjects="weakSubjects" :suggestions="suggestions" />

      <!-- 进步 / 退步学生识别 -->
      <ClassAnalysisProgress
        v-model:base-exam-id="filterForm.baseExamId"
        :progress-data="progressData"
        :progress-loading="progressLoading"
        :base-exam-options="baseExamOptions"
        @change="loadProgressData"
      />
    </div>

    <!-- AI 学情诊断抽屉 -->
    <AIDiagnosisDrawer
      v-model="diagnosisVisible"
      drawer-title="AI 学情诊断"
      loading-text="AI 正在分析班级学情，请稍候…"
      loading-tip="报告生成通常需要 10-40 秒，请勿关闭窗口"
      empty-text="暂无诊断报告，点击下方按钮生成"
      history-title-default="班级学情诊断报告"
      :loading="diagnosisLoading"
      :content="diagnosisContent"
      :report-title="diagnosisTitle"
      :created-at="diagnosisCreatedAt"
      :history-list="diagnosisHistoryList"
      :history-loading="historyLoading"
      :active-report-id="activeReportId"
      @generate="generateDiagnosis"
      @refresh-history="loadDiagnosisHistory"
      @select-history="handleHistoryClick"
    />
  </div>
</template>

<script setup>
import { useClassAnalysis } from './useClassAnalysis'
import PageHeader from '@/components/common/PageHeader.vue'
import ClassAnalysisFilter from './components/ClassAnalysisFilter.vue'
import ClassAnalysisMetrics from './components/ClassAnalysisMetrics.vue'
import ClassAnalysisCharts from './components/ClassAnalysisCharts.vue'
import ClassAnalysisRateChart from './components/ClassAnalysisRateChart.vue'
import ClassAnalysisTopStudents from './components/ClassAnalysisTopStudents.vue'
import ClassAnalysisWeakSuggestions from './components/ClassAnalysisWeakSuggestions.vue'
import ClassAnalysisProgress from './components/ClassAnalysisProgress.vue'
import AIDiagnosisDrawer from './components/AIDiagnosisDrawer.vue'

defineOptions({ name: 'ClassAnalysis' })

const breadcrumbs = [
  { label: '教学管理' },
  { label: '班级学情分析' }
]

const {
  filterForm,
  examList,
  classList,
  baseExamOptions,
  loading,
  topStudents,
  weakSubjects,
  suggestions,
  subjectStats,
  overallMetrics,
  scoreDistribution,
  progressData,
  progressLoading,
  handleExamChange,
  handleClassChange,
  loadAnalysisData,
  loadProgressData,
  diagnosisVisible,
  diagnosisLoading,
  diagnosisContent,
  diagnosisTitle,
  diagnosisCreatedAt,
  diagnosisHistoryList,
  historyLoading,
  activeReportId,
  openDiagnosis,
  generateDiagnosis,
  loadDiagnosisHistory,
  handleHistoryClick
} = useClassAnalysis()
</script>

<style scoped lang="scss">
.class-analysis {
  padding: 20px;

  .chart-row {
    margin-bottom: 16px;
  }
}
</style>