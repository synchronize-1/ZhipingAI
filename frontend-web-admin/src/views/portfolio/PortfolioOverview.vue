<template>
  <div class="portfolio-overview" :class="{ 'pdf-exporting': exporting }">
    <PageHeader
      title="成长档案总览"
      description="查看学生成长档案的综合数据概览"
      :breadcrumbs="breadcrumbs"
    >
      <template #extra>
        <el-button
          class="export-pdf-btn"
          type="primary"
          :icon="Download"
          :loading="exporting"
          :disabled="!canExport"
          @click="handleExportPdf"
        >
          {{ exporting ? '导出中…' : '导出PDF' }}
        </el-button>
      </template>
    </PageHeader>

    <!-- 学生选择器（教师/管理员可见） -->
    <PortfolioOverviewStudentSelect
      v-if="!isStudentRole"
      v-model:student-id="selectForm.studentId"
      v-model:class-id="selectForm.classId"
      :student-options="studentOptions"
      :class-list="classList"
      @student-change="handleStudentChange"
      @class-change="handleClassChange"
    />

    <div
      v-loading="loading"
      ref="exportContentRef"
      class="overview-content"
      :class="{ 'pdf-exporting': exporting }"
    >
      <!-- 学生基本信息卡片 -->
      <PortfolioOverviewStudentInfo :student-info="studentInfo" />

      <!-- 数据概览卡片 -->
      <PortfolioOverviewStats :overview-data="overviewData" :comment-summary="latestCommentSummary" />

      <!-- 图表区域 -->
      <PortfolioOverviewCharts
        :skill-category-data="skillCategoryData"
        :honor-level-data="honorLevelData"
        :exam-score-data="examScoreData"
        :ready="chartsReady"
      />

      <!-- 心理健康和评语 -->
      <el-row :gutter="16" class="bottom-row">
        <!-- 最近一次心理健康记录摘要 -->
        <el-col :lg="12" :md="24">
          <PortfolioOverviewMental :mental-health="latestMentalHealth" @view-detail="goToMentalHealth" />
        </el-col>

        <!-- 最新学期评语展示 -->
        <el-col :lg="12" :md="24">
          <PortfolioOverviewComment :comment="latestComment" @view-all="goToComments" />
        </el-col>
      </el-row>
    </div>

    <!-- 未选择学生时的占位 -->
    <el-empty v-if="!currentStudentId && !isStudentRole" description="请先选择学生" :image-size="120">
      <template #description>
        <span style="color: #909399">选择学生后查看成长档案详情</span>
      </template>
    </el-empty>
  </div>
</template>

<script setup>
import { Download } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { usePortfolioOverview } from './usePortfolioOverview'
import PortfolioOverviewStudentSelect from './components/PortfolioOverviewStudentSelect.vue'
import PortfolioOverviewStudentInfo from './components/PortfolioOverviewStudentInfo.vue'
import PortfolioOverviewStats from './components/PortfolioOverviewStats.vue'
import PortfolioOverviewCharts from './components/PortfolioOverviewCharts.vue'
import PortfolioOverviewMental from './components/PortfolioOverviewMental.vue'
import PortfolioOverviewComment from './components/PortfolioOverviewComment.vue'

defineOptions({ name: 'PortfolioOverview' })

const breadcrumbs = [
  { label: '成长档案' },
  { label: '档案总览' }
]

const {
  isStudentRole,
  currentStudentId,
  selectForm,
  loading,
  classList,
  studentOptions,
  studentInfo,
  overviewData,
  latestMentalHealth,
  latestComment,
  latestCommentSummary,
  skillCategoryData,
  honorLevelData,
  examScoreData,
  chartsReady,
  exportContentRef,
  exporting,
  canExport,
  handleExportPdf,
  handleClassChange,
  handleStudentChange,
  goToMentalHealth,
  goToComments
} = usePortfolioOverview()
</script>

<style scoped lang="scss">
.portfolio-overview {
  padding: 20px;

  // 导出 PDF 期间：隐藏「导出PDF」按钮本身，避免被截入图片
  &.pdf-exporting {
    .export-pdf-btn {
      visibility: hidden;
    }
  }

  .overview-content {
    // 导出 PDF 期间：隐藏卡片内的文字按钮（查看详情/查看全部）等非内容元素
    &.pdf-exporting {
      :deep(.card-header .el-button) {
        display: none;
      }
    }
  }
}
</style>