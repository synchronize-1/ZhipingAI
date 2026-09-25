<template>
  <div class="subject-manage">
    <PageHeader title="学科管理" description="管理学校学科信息" :breadcrumbs="breadcrumbs">
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增学科</el-button>
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
        <template #category="{ row }">
          <el-tag :type="getCategoryTag(row.category)">{{ getCategoryLabel(row.category) }}</el-tag>
        </template>

        <template #action="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </DataTable>
    </el-card>

    <!-- 学科表单弹窗 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="dialog.formData"
        :rules="formRules"
        label-width="100px"
        :disabled="dialog.mode.value === 'view'"
      >
        <el-form-item label="学科名称" prop="name">
          <el-input v-model="dialog.formData.name" placeholder="请输入学科名称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="学科编码" prop="code">
          <el-input v-model="dialog.formData.code" placeholder="请输入学科编码" maxlength="20" />
        </el-form-item>
        <el-form-item label="学科分类" prop="category">
          <el-select v-model="dialog.formData.category" placeholder="请选择学科分类" style="width: 100%">
            <el-option label="语文类" value="chinese" />
            <el-option label="数学类" value="math" />
            <el-option label="外语类" value="english" />
            <el-option label="理科类" value="science" />
            <el-option label="文科类" value="arts" />
            <el-option label="综合类" value="comprehensive" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="满分" prop="fullScore">
          <el-input-number v-model="dialog.formData.fullScore" :min="1" :max="1000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="及格分" prop="passScore">
          <el-input-number v-model="dialog.formData.passScore" :min="0" :max="1000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="dialog.formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialog.close()">取消</el-button>
          <el-button
            v-if="dialog.mode.value !== 'view'"
            type="primary"
            :loading="dialog.loading.value"
            @click="handleSubmit"
          >
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { subjectAPI } from '@/api/teaching'
import { useTable } from '@/composables/useTable'
import { useDialog } from '@/composables/useDialog'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchForm from '@/components/common/SearchForm.vue'
import DataTable from '@/components/common/DataTable.vue'

const breadcrumbs = [
  { label: '教学管理' },
  { label: '学科管理' }
]

const searchFields = [
  { prop: 'name', label: '学科名称', type: 'input', placeholder: '请输入学科名称' },
  {
    prop: 'category',
    label: '分类',
    type: 'select',
    placeholder: '请选择分类',
    options: [
      { label: '语文类', value: 'chinese' },
      { label: '数学类', value: 'math' },
      { label: '外语类', value: 'english' },
      { label: '理科类', value: 'science' },
      { label: '文科类', value: 'arts' },
      { label: '综合类', value: 'comprehensive' },
      { label: '其他', value: 'other' }
    ]
  }
]

const columns = [
  { prop: 'name', label: '学科名称', minWidth: 140, showOverflowTooltip: true },
  { prop: 'code', label: '编码', width: 120 },
  { prop: 'category', label: '分类', width: 120, slot: 'category', align: 'center' },
  { prop: 'fullScore', label: '满分', width: 100, align: 'center' },
  { prop: 'createdAt', label: '创建时间', width: 180 }
]

const defaultParams = {
  name: '',
  category: ''
}

const { loading, dataList, pagination, searchParams, handleSearch, handleReset, handlePageChange, handleSizeChange, refresh } = useTable(subjectAPI.list, defaultParams)

const dialog = useDialog({
  id: null,
  name: '',
  code: '',
  category: '',
  fullScore: 100,
  passScore: 60,
  remark: ''
})

const dialogVisible = computed({
  get: () => dialog.visible.value,
  set: (val) => { if (!val) dialog.close() }
})

const formRef = ref(null)
const formRules = {
  name: [
    { required: true, message: '请输入学科名称', trigger: 'blur' },
    { max: 20, message: '学科名称不能超过20个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入学科编码', trigger: 'blur' },
    { max: 20, message: '学科编码不能超过20个字符', trigger: 'blur' }
  ],
  category: [{ required: true, message: '请选择学科分类', trigger: 'change' }],
  fullScore: [{ required: true, message: '请输入满分', trigger: 'blur' }]
}

const getCategoryLabel = (category) => {
  const map = {
    chinese: '语文类',
    math: '数学类',
    english: '外语类',
    science: '理科类',
    arts: '文科类',
    comprehensive: '综合类',
    other: '其他'
  }
  return map[category] || category
}

const getCategoryTag = (category) => {
  const map = {
    chinese: 'success',
    math: 'primary',
    english: 'warning',
    science: 'danger',
    arts: 'info',
    comprehensive: '',
    other: 'info'
  }
  return map[category] || 'info'
}

const handleAdd = () => {
  dialog.openAdd()
}

const handleEdit = (row) => {
  dialog.openEdit(row)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除学科「${row.name}」吗？删除后数据无法恢复。`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await subjectAPI.delete(row.id)
      ElMessage.success('删除成功')
      refresh()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (error) {
    ElMessage.warning('请完善表单信息')
    return
  }

  dialog.setLoading(true)
  try {
    if (dialog.mode.value === 'add') {
      await subjectAPI.create(dialog.formData)
      ElMessage.success('创建成功')
    } else {
      await subjectAPI.update(dialog.formData.id, dialog.formData)
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
.subject-manage {
  padding: 20px;

  .search-card {
    margin-bottom: 16px;
  }

  .table-card {
    margin-bottom: 16px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
