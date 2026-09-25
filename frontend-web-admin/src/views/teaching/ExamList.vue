<template>
  <div class="exam-list">
    <PageHeader title="考试管理" description="管理学校各类考试信息" :breadcrumbs="breadcrumbs">
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增考试</el-button>
      </template>
    </PageHeader>

    <el-card class="search-card" shadow="never">
      <SearchForm
        v-model="searchParams"
        :fields="searchFields"
        :loading="loading"
        @search="handleSearch"
        @reset="handleReset"
      />
    </el-card>

    <el-card class="table-card" shadow="never">
      <DataTable
        :columns="columns"
        :data="dataList"
        :loading="loading"
        :pagination="pagination"
        index
        index-label="序号"
        @update:page="handlePageChange"
        @update:pageSize="handleSizeChange"
      >
        <template #type="{ row }">
          <el-tag :type="getExamTypeTag(row.type)">{{ getExamTypeLabel(row.type) }}</el-tag>
        </template>

        <template #status="{ row }">
          <el-tag :type="getStatusTag(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
        </template>

        <template #action="{ row }">
          <el-button type="primary" link @click="handleView(row)">查看</el-button>
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </DataTable>
    </el-card>

    <ExamForm
      ref="examFormRef"
      :visible="dialog.visible"
      :title="dialog.title"
      :mode="dialog.mode"
      :form-data="dialog.formData"
      :loading="dialog.loading"
      @close="dialog.close"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { examAPI } from '@/api/teaching'
import { useTable } from '@/composables/useTable'
import { useDialog } from '@/composables/useDialog'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchForm from '@/components/common/SearchForm.vue'
import DataTable from '@/components/common/DataTable.vue'
import ExamForm from './ExamForm.vue'

const breadcrumbs = [
  { label: '教学管理' },
  { label: '考试管理' }
]

const searchFields = [
  { prop: 'name', label: '考试名称', type: 'input', placeholder: '请输入考试名称' },
  {
    prop: 'type',
    label: '考试类型',
    type: 'select',
    placeholder: '请选择考试类型',
    options: [
      { label: '月考', value: 'monthly' },
      { label: '期中考试', value: 'midterm' },
      { label: '期末考试', value: 'final' },
      { label: '模拟考试', value: 'mock' },
      { label: '单元测试', value: 'unit' },
      { label: '其他', value: 'other' }
    ]
  },
  {
    prop: 'grade',
    label: '年级',
    type: 'select',
    placeholder: '请选择年级',
    options: [
      { label: '一年级', value: 'grade1' },
      { label: '二年级', value: 'grade2' },
      { label: '三年级', value: 'grade3' },
      { label: '四年级', value: 'grade4' },
      { label: '五年级', value: 'grade5' },
      { label: '六年级', value: 'grade6' },
      { label: '七年级', value: 'grade7' },
      { label: '八年级', value: 'grade8' },
      { label: '九年级', value: 'grade9' },
      { label: '高一', value: 'grade10' },
      { label: '高二', value: 'grade11' },
      { label: '高三', value: 'grade12' }
    ]
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    placeholder: '请选择状态',
    options: [
      { label: '未开始', value: 'pending' },
      { label: '进行中', value: 'ongoing' },
      { label: '已结束', value: 'finished' },
      { label: '已取消', value: 'cancelled' }
    ]
  },
  {
    prop: 'dateRange',
    label: '考试日期',
    type: 'date',
    dateType: 'daterange',
    startPlaceholder: '开始日期',
    endPlaceholder: '结束日期'
  }
]

const columns = [
  { prop: 'name', label: '考试名称', minWidth: 180, showOverflowTooltip: true },
  { prop: 'type', label: '类型', width: 120, slot: 'type', align: 'center' },
  { prop: 'grade', label: '年级', width: 100, formatter: (row) => getGradeLabel(row.grade) },
  { prop: 'semester', label: '学期', width: 120, formatter: (row) => getSemesterLabel(row.semester) },
  { prop: 'examDate', label: '考试日期', width: 120 },
  { prop: 'status', label: '状态', width: 100, slot: 'status', align: 'center' },
  { prop: 'createdAt', label: '创建时间', width: 180 }
]

const defaultParams = {
  name: '',
  type: '',
  grade: '',
  status: '',
  dateRange: []
}

const { loading, dataList, pagination, searchParams, handleSearch, handleReset, handlePageChange, handleSizeChange, refresh } = useTable(examAPI.list, defaultParams)

const dialog = useDialog({
  id: null,
  name: '',
  type: '',
  grade: '',
  semester: '',
  examDate: '',
  status: 'pending',
  remark: '',
  subjects: []
})

const examFormRef = ref(null)

const getExamTypeLabel = (type) => {
  const map = {
    monthly: '月考',
    midterm: '期中考试',
    final: '期末考试',
    mock: '模拟考试',
    unit: '单元测试',
    other: '其他'
  }
  return map[type] || type
}

const getExamTypeTag = (type) => {
  const map = {
    monthly: '',
    midterm: 'success',
    final: 'danger',
    mock: 'warning',
    unit: 'info',
    other: 'info'
  }
  return map[type] || ''
}

const getStatusLabel = (status) => {
  const map = {
    pending: '未开始',
    ongoing: '进行中',
    finished: '已结束',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getStatusTag = (status) => {
  const map = {
    pending: 'info',
    ongoing: 'success',
    finished: 'warning',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getGradeLabel = (grade) => {
  const map = {
    grade1: '一年级',
    grade2: '二年级',
    grade3: '三年级',
    grade4: '四年级',
    grade5: '五年级',
    grade6: '六年级',
    grade7: '七年级',
    grade8: '八年级',
    grade9: '九年级',
    grade10: '高一',
    grade11: '高二',
    grade12: '高三'
  }
  return map[grade] || grade
}

const getSemesterLabel = (semester) => {
  const map = {
    first: '第一学期',
    second: '第二学期'
  }
  return map[semester] || semester
}

const handleAdd = () => {
  dialog.openAdd()
}

const handleEdit = (row) => {
  dialog.openEdit(row)
}

const handleView = (row) => {
  dialog.openView(row)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除考试「${row.name}」吗？删除后数据无法恢复。`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await examAPI.delete(row.id)
      ElMessage.success('删除成功')
      refresh()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleSubmit = async (formData) => {
  dialog.setLoading(true)
  try {
    if (dialog.mode.value === 'add') {
      await examAPI.create(formData)
      ElMessage.success('创建成功')
    } else {
      await examAPI.update(formData.id, formData)
      ElMessage.success('更新成功')
    }
    dialog.close()
    refresh()
  } catch (error) {
    ElMessage.error(dialog.mode.value === 'add' ? '创建失败' : '更新失败')
  } finally {
    dialog.setLoading(false)
  }
}
</script>

<style scoped lang="scss">
.exam-list {
  padding: 20px;

  .search-card {
    margin-bottom: 16px;
  }

  .table-card {
    margin-bottom: 16px;
  }
}
</style>
