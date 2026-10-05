<template>
  <div class="comment-list">
    <PageHeader
      title="评语管理"
      description="管理学生学期评语和各类评价"
      :breadcrumbs="breadcrumbs"
    >
      <template #extra>
        <el-button v-if="isTeacherOrAdmin" type="success" :icon="MagicStick" @click="openAIGenerateDialog">
          AI生成评语
        </el-button>
        <el-button v-if="isTeacherOrAdmin" type="primary" :icon="Plus" @click="handleAdd">
          新增评语
        </el-button>
      </template>
    </PageHeader>

    <!-- 筛选区 -->
    <CommentListFilter
      v-model:student-id="studentSelectForm.studentId"
      :is-student-role="isStudentRole"
      :student-options="studentOptions"
      :search-fields="searchFields"
      :search-params="searchParams"
      @student-change="handleStudentChange"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 评语列表 -->
    <CommentListItems
      :data="dataList"
      :loading="loading"
      :pagination="pagination"
      :show-pagination="showPagination"
      :is-teacher-or-admin="isTeacherOrAdmin"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      @view="handleView"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <!-- AI 生成评语弹窗 -->
    <CommentAIGenerateDialog
      v-model="aiDialogVisible"
      v-model:generated-comment="aiGeneratedComment"
      :ai-form-data="aiFormData"
      :student-options="studentOptions"
      :ai-generating="aiGenerating"
      :ai-save-loading="aiSaveLoading"
      @generate="handleGenerateComment"
      @save="handleSaveAIGenerated"
    />

    <!-- 查看详情弹窗 -->
    <CommentViewDialog
      v-model="viewDialogVisible"
      :view-data="viewData"
      :is-teacher-or-admin="isTeacherOrAdmin"
      @edit="handleEditFromView"
    />

    <!-- 新增/编辑弹窗 -->
    <CommentFormDialog
      v-model="formDialogVisible"
      :title="formDialogTitle"
      :form-data="formData"
      :rules="formRules"
      :submit-loading="submitLoading"
      :dialog-mode="dialogMode"
      :is-teacher-or-admin="isTeacherOrAdmin"
      :student-options="studentOptions"
      :ai-generating="aiGenerating"
      :set-form-ref="setFormRef"
      @submit="handleSubmit"
      @close="handleFormClose"
      @ai-generate="handleAIGenerate"
    />
  </div>
</template>

<script setup>
import { Plus, MagicStick } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useCommentList } from './useCommentList'
import CommentListFilter from './components/CommentListFilter.vue'
import CommentListItems from './components/CommentListItems.vue'
import CommentAIGenerateDialog from './components/CommentAIGenerateDialog.vue'
import CommentViewDialog from './components/CommentViewDialog.vue'
import CommentFormDialog from './components/CommentFormDialog.vue'

defineOptions({ name: 'CommentList' })

const breadcrumbs = [
  { label: '成长档案' },
  { label: '评语管理' }
]

const {
  isStudentRole,
  isTeacherOrAdmin,
  studentSelectForm,
  studentOptions,
  searchFields,
  loading,
  dataList,
  pagination,
  searchParams,
  showPagination,
  handleSearch,
  handleReset,
  handlePageChange,
  handleSizeChange,
  formDialogVisible,
  formDialogTitle,
  formData,
  setFormRef,
  submitLoading,
  dialogMode,
  formRules,
  viewDialogVisible,
  viewData,
  aiGenerating,
  aiDialogVisible,
  aiSaveLoading,
  aiFormData,
  aiGeneratedComment,
  handleStudentChange,
  handleView,
  handleEditFromView,
  handleAdd,
  handleEdit,
  handleDelete,
  handleAIGenerate,
  openAIGenerateDialog,
  handleGenerateComment,
  handleSaveAIGenerated,
  handleSubmit,
  handleFormClose
} = useCommentList()
</script>

<style scoped lang="scss">
.comment-list {
  padding: 20px;
}
</style>