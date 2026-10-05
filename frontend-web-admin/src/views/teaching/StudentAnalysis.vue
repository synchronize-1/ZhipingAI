<template>
  <div class="student-analysis">
    <PageHeader
      title="学生学情分析"
      description="查看学生个人学习情况与分析"
      :breadcrumbs="breadcrumbs"
      show-back
      @back="handleBack"
    />

    <!-- 学生搜索 -->
    <StudentAnalysisSearch
      v-model:keyword="searchForm.keyword"
      v-model:class-id="searchForm.classId"
      v-model:selected-student-id="selectedStudentId"
      :class-list="classList"
      :student-list="studentList"
      :search-loading="searchLoading"
      @search="handleSearchStudent"
      @student-change="handleStudentChange"
    />

    <div v-if="studentInfo.id" v-loading="loading" class="analysis-content">
      <!-- 学生基本信息卡片 -->
      <StudentAnalysisInfo :student-info="studentInfo" @generate="openDiagnosis" />

      <!-- 图表区域 -->
      <StudentAnalysisCharts
        :exam-history="examHistory"
        :trend-data="trendData"
        :subject-scores="subjectScores"
        :subject-trend-subjects="subjectTrendSubjects"
      />

      <!-- 优势学科/薄弱学科分析 -->
      <StudentAnalysisSubjects
        :advantage-subjects="advantageSubjects"
        :weak-subjects="weakSubjects"
      />

      <!-- 学习建议 -->
      <StudentAnalysisSuggestions :suggestions="suggestions" />
    </div>

    <!-- 未选择学生时的占位 -->
    <el-empty v-else description="请先搜索并选择学生" :image-size="120">
      <template #description>
        <span style="color: #909399">输入学号或姓名搜索学生，查看详细学情分析</span>
      </template>
    </el-empty>

    <!-- AI 学情画像抽屉 -->
    <AIDiagnosisDrawer
      v-model="diagnosisVisible"
      drawer-title="AI 学情画像"
      loading-text="AI 正在生成学情画像，请稍候…"
      loading-tip="画像生成通常需要 10-40 秒，请勿关闭窗口"
      empty-text="暂无学情画像，点击下方按钮生成"
      history-title-default="学情画像报告"
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
    >
      <template #options>
        <div class="diagnosis-options">
          <span class="diagnosis-options__label">分析范围：</span>
          <el-select
            v-model="diagnosisExamId"
            placeholder="综合历次成绩"
            style="width: 240px"
            clearable
          >
            <el-option
              v-for="exam in examList"
              :key="exam.id"
              :label="exam.name"
              :value="exam.id"
            />
          </el-select>
          <span class="diagnosis-options__tip">不选择考试则基于历次成绩综合画像</span>
        </div>
      </template>
    </AIDiagnosisDrawer>
  </div>
</template>

<script setup>
import { useStudentAnalysis } from './useStudentAnalysis'
import PageHeader from '@/components/common/PageHeader.vue'
import StudentAnalysisSearch from './components/StudentAnalysisSearch.vue'
import StudentAnalysisInfo from './components/StudentAnalysisInfo.vue'
import StudentAnalysisCharts from './components/StudentAnalysisCharts.vue'
import StudentAnalysisSubjects from './components/StudentAnalysisSubjects.vue'
import StudentAnalysisSuggestions from './components/StudentAnalysisSuggestions.vue'
import AIDiagnosisDrawer from './components/AIDiagnosisDrawer.vue'

defineOptions({ name: 'StudentAnalysis' })

const breadcrumbs = [
  { label: '教学管理' },
  { label: '学生学情分析' }
]

const {
  searchForm,
  searchLoading,
  classList,
  studentList,
  selectedStudentId,
  handleSearchStudent,
  handleStudentChange,
  loading,
  studentInfo,
  examHistory,
  subjectScores,
  advantageSubjects,
  weakSubjects,
  suggestions,
  trendData,
  subjectTrendSubjects,
  handleBack,
  examList,
  diagnosisVisible,
  diagnosisLoading,
  diagnosisContent,
  diagnosisTitle,
  diagnosisCreatedAt,
  diagnosisExamId,
  diagnosisHistoryList,
  historyLoading,
  activeReportId,
  openDiagnosis,
  generateDiagnosis,
  loadDiagnosisHistory,
  handleHistoryClick
} = useStudentAnalysis()
</script>

<style scoped lang="scss">
.student-analysis {
  padding: 20px;
}

/* 抽屉插槽内容随抽屉一起 teleport，需独立选择器才能命中 */
.diagnosis-options {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;

  &__label {
    font-size: 14px;
    color: #606266;
  }

  &__tip {
    font-size: 12px;
    color: #909399;
  }
}
</style>