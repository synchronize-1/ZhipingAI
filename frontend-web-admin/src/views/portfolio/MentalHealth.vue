<template>
  <div class="mental-health">
    <PageHeader
      title="心理健康"
      description="查看和管理学生心理健康测评记录"
      :breadcrumbs="breadcrumbs"
    >
      <template #extra>
        <el-button v-if="isTeacherOrAdmin" type="primary" :icon="Plus" @click="handleAdd">
          新增记录
        </el-button>
      </template>
    </PageHeader>

    <!-- 筛选区 -->
    <MentalHealthFilter
      v-model:student-id="studentSelectForm.studentId"
      :is-student-role="isStudentRole"
      :student-options="studentOptions"
      :search-fields="searchFields"
      :search-params="searchParams"
      @student-change="handleStudentChange"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 趋势图表区域 -->
    <MentalHealthCharts :trend-data="trendData" :ready="trendReady" />

    <!-- 记录列表 -->
    <MentalHealthTable
      :columns="tableColumns"
      :data="dataList"
      :loading="loading"
      :pagination="pagination"
      :is-teacher-or-admin="isTeacherOrAdmin"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      @view="handleView"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <!-- 查看详情弹窗 -->
    <MentalHealthDetailDialog
      v-model="detailDialogVisible"
      :loading="detailLoading"
      :detail-data="detailData"
      :dimension-list="dimensionList"
    />

    <!-- 新增/编辑弹窗 -->
    <MentalHealthFormDialog
      v-model="formDialogVisible"
      :title="formDialogTitle"
      :form-data="formData"
      :rules="formRules"
      :submit-loading="submitLoading"
      :set-form-ref="setFormRef"
      @submit="handleSubmit"
      @close="handleFormClose"
    />
  </div>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useMentalHealth } from './useMentalHealth'
import MentalHealthFilter from './components/MentalHealthFilter.vue'
import MentalHealthCharts from './components/MentalHealthCharts.vue'
import MentalHealthTable from './components/MentalHealthTable.vue'
import MentalHealthDetailDialog from './components/MentalHealthDetailDialog.vue'
import MentalHealthFormDialog from './components/MentalHealthFormDialog.vue'

defineOptions({ name: 'MentalHealth' })

const breadcrumbs = [
  { label: '成长档案' },
  { label: '心理健康' }
]

const {
  isStudentRole,
  isTeacherOrAdmin,
  studentSelectForm,
  studentOptions,
  searchFields,
  tableColumns,
  loading,
  dataList,
  pagination,
  searchParams,
  handleSearch,
  handleReset,
  handlePageChange,
  handleSizeChange,
  trendData,
  trendReady,
  detailDialogVisible,
  detailLoading,
  detailData,
  dimensionList,
  formDialogVisible,
  formDialogTitle,
  formData,
  setFormRef,
  submitLoading,
  formRules,
  handleStudentChange,
  handleView,
  handleAdd,
  handleEdit,
  handleDelete,
  handleSubmit,
  handleFormClose
} = useMentalHealth()
</script>

<style scoped lang="scss">
.mental-health {
  padding: 20px;
}
</style>