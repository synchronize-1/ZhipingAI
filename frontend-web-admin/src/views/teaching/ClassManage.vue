<template>
  <div class="class-manage">
    <PageHeader title="班级管理" description="管理学校班级信息" :breadcrumbs="breadcrumbs">
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增班级</el-button>
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
        <template #action="{ row }">
          <el-button type="primary" link @click="handleViewTeachers(row)">学科教师</el-button>
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </DataTable>
    </el-card>

    <!-- 班级表单弹窗 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="dialog.formData"
        :rules="formRules"
        label-width="100px"
        :disabled="dialog.mode.value === 'view'"
      >
        <el-form-item label="班级名称" prop="name">
          <el-input v-model="dialog.formData.name" placeholder="请输入班级名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-select v-model="dialog.formData.grade" placeholder="请选择年级" style="width: 100%">
            <el-option label="一年级" value="grade1" />
            <el-option label="二年级" value="grade2" />
            <el-option label="三年级" value="grade3" />
            <el-option label="四年级" value="grade4" />
            <el-option label="五年级" value="grade5" />
            <el-option label="六年级" value="grade6" />
            <el-option label="七年级" value="grade7" />
            <el-option label="八年级" value="grade8" />
            <el-option label="九年级" value="grade9" />
            <el-option label="高一" value="grade10" />
            <el-option label="高二" value="grade11" />
            <el-option label="高三" value="grade12" />
          </el-select>
        </el-form-item>
        <el-form-item label="学院/系" prop="college">
          <el-input v-model="dialog.formData.college" placeholder="请输入学院/系名称" />
        </el-form-item>
        <el-form-item label="班主任" prop="headTeacher">
          <el-input v-model="dialog.formData.headTeacher" placeholder="请输入班主任姓名" />
        </el-form-item>
        <el-form-item label="学生人数" prop="studentCount">
          <el-input-number v-model="dialog.formData.studentCount" :min="0" :max="200" style="width: 100%" />
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

    <!-- 学科教师配置弹窗 -->
    <el-dialog
      title="学科教师配置"
      v-model="teacherDialogVisible"
      width="600px"
    >
      <div v-loading="teacherLoading" class="teacher-list">
        <el-table :data="teacherList" border stripe>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="subjectName" label="学科" min-width="120" />
          <el-table-column prop="teacherName" label="任课教师" min-width="120" />
          <el-table-column prop="teacherTitle" label="职称" width="120" />
        </el-table>
        <el-empty v-if="teacherList.length === 0" description="暂无教师配置信息" :image-size="80" />
      </div>
      <template #footer>
        <el-button @click="teacherDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { classAPI } from '@/api/teaching'
import { useTable } from '@/composables/useTable'
import { useDialog } from '@/composables/useDialog'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchForm from '@/components/common/SearchForm.vue'
import DataTable from '@/components/common/DataTable.vue'

const breadcrumbs = [
  { label: '教学管理' },
  { label: '班级管理' }
]

const searchFields = [
  { prop: 'name', label: '班级名称', type: 'input', placeholder: '请输入班级名称' },
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
  { prop: 'college', label: '学院', type: 'input', placeholder: '请输入学院名称' }
]

const columns = [
  { prop: 'name', label: '班级名称', minWidth: 140, showOverflowTooltip: true },
  { prop: 'grade', label: '年级', width: 100, formatter: (row) => getGradeLabel(row.grade) },
  { prop: 'college', label: '学院/系', width: 140, showOverflowTooltip: true },
  { prop: 'headTeacher', label: '班主任', width: 100 },
  { prop: 'studentCount', label: '学生人数', width: 100, align: 'center' },
  { prop: 'createdAt', label: '创建时间', width: 180 }
]

const defaultParams = {
  name: '',
  grade: '',
  college: ''
}

const { loading, dataList, pagination, searchParams, handleSearch, handleReset, handlePageChange, handleSizeChange, refresh } = useTable(classAPI.list, defaultParams)

const dialog = useDialog({
  id: null,
  name: '',
  grade: '',
  college: '',
  headTeacher: '',
  studentCount: 0,
  remark: ''
})

const dialogVisible = computed({
  get: () => dialog.visible.value,
  set: (val) => { if (!val) dialog.close() }
})

const formRef = ref(null)
const formRules = {
  name: [{ required: true, message: '请输入班级名称', trigger: 'blur' }],
  grade: [{ required: true, message: '请选择年级', trigger: 'change' }]
}

// 教师配置弹窗
const teacherDialogVisible = ref(false)
const teacherLoading = ref(false)
const teacherList = ref([])

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

const handleAdd = () => {
  dialog.openAdd()
}

const handleEdit = (row) => {
  dialog.openEdit(row)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除班级「${row.name}」吗？删除后数据无法恢复。`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await classAPI.delete(row.id)
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
      await classAPI.create(dialog.formData)
      ElMessage.success('创建成功')
    } else {
      await classAPI.update(dialog.formData.id, dialog.formData)
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

const handleViewTeachers = async (row) => {
  teacherDialogVisible.value = true
  teacherLoading.value = true
  try {
    const res = await classAPI.getSubjectTeachers(row.id)
    if (res.data) {
      teacherList.value = res.data
    }
  } catch (error) {
    ElMessage.error('加载教师配置失败')
  } finally {
    teacherLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.class-manage {
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

  .teacher-list {
    min-height: 200px;
  }
}
</style>
