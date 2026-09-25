<template>
  <div class="skill-list">
    <PageHeader
      title="技能管理"
      description="管理学生技能档案信息"
      :breadcrumbs="breadcrumbs"
    >
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="handleAdd">
          新增技能
        </el-button>
      </template>
    </PageHeader>

    <!-- 筛选区 -->
    <el-card shadow="never" class="filter-card">
      <!-- 学生选择器（教师/管理员可见） -->
      <el-form v-if="!isStudentRole" :inline="true" :model="studentSelectForm" class="student-select-form">
        <el-form-item label="选择学生">
          <el-select
            v-model="studentSelectForm.studentId"
            placeholder="请选择学生"
            style="width: 260px"
            filterable
            clearable
            @change="handleStudentChange"
          >
            <el-option
              v-for="stu in studentOptions"
              :key="stu.id"
              :label="`${stu.name} (${stu.studentNo})`"
              :value="stu.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <SearchForm
        :fields="searchFields"
        v-model="searchParams"
        @search="handleSearch"
        @reset="handleReset"
      />
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never" class="table-card">
      <DataTable
        :columns="tableColumns"
        :data="dataList"
        :loading="loading"
        :pagination="pagination"
        :index="true"
        @update:page="handlePageChange"
        @update:pageSize="handleSizeChange"
      >
        <template #category="{ row }">
          <el-tag :type="getCategoryTagType(row.category)" size="small">
            {{ getCategoryText(row.category) }}
          </el-tag>
        </template>

        <template #level="{ row }">
          <div class="star-level">
            <el-icon
              v-for="i in 5"
              :key="i"
              :class="{ active: i <= row.level }"
              :size="16"
            >
              <Star />
            </el-icon>
          </div>
        </template>

        <template #status="{ row }">
          <el-tag :type="getStatusTagType(row.certStatus)" size="small">
            {{ getStatusText(row.certStatus) }}
          </el-tag>
        </template>

        <template #action="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </DataTable>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="技能名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入技能名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="技能分类" prop="category">
          <el-select
            v-model="formData.category"
            placeholder="请选择技能分类"
            style="width: 100%"
          >
            <el-option label="学术" value="academic" />
            <el-option label="体育" value="sports" />
            <el-option label="艺术" value="art" />
            <el-option label="技术" value="technology" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item label="技能等级" prop="level">
          <div class="level-select">
            <el-radio-group v-model="formData.level">
              <el-radio
                v-for="i in 5"
                :key="i"
                :value="i"
                class="level-radio"
              >
                <div class="level-stars">
                  <el-icon
                    v-for="j in 5"
                    :key="j"
                    :class="{ active: j <= i }"
                    :size="18"
                  >
                    <Star />
                  </el-icon>
                </div>
              </el-radio>
            </el-radio-group>
          </div>
        </el-form-item>

        <el-form-item label="获得学期" prop="semester">
          <el-select
            v-model="formData.semester"
            placeholder="请选择获得学期"
            style="width: 100%"
          >
            <el-option label="2024-2025学年第一学期" value="2024-2025-1" />
            <el-option label="2024-2025学年第二学期" value="2024-2025-2" />
            <el-option label="2023-2024学年第一学期" value="2023-2024-1" />
            <el-option label="2023-2024学年第二学期" value="2023-2024-2" />
          </el-select>
        </el-form-item>

        <el-form-item label="技能描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入技能描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="证明材料" prop="certificate">
          <el-upload
            :action="uploadUrl"
            :file-list="fileList"
            :on-success="handleUploadSuccess"
            :on-remove="handleUploadRemove"
            :before-upload="beforeUpload"
            list-type="picture-card"
            :limit="3"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
            <div style="margin-top: 8px; font-size: 12px">上传证明</div>
          </el-upload>
          <div class="upload-tip">支持 jpg、png 格式，最多上传3张，单张不超过 2MB</div>
        </el-form-item>

        <el-form-item v-if="isTeacherOrAdmin" label="认证状态" prop="certStatus">
          <el-radio-group v-model="formData.certStatus">
            <el-radio value="pending">待认证</el-radio>
            <el-radio value="approved">已认证</el-radio>
            <el-radio value="rejected">已驳回</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleDialogClose">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Star } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { skillAPI } from '@/api/portfolio'
import { useTable } from '@/composables/useTable'
import { useDialog } from '@/composables/useDialog'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchForm from '@/components/common/SearchForm.vue'
import DataTable from '@/components/common/DataTable.vue'

defineOptions({ name: 'SkillList' })

const route = useRoute()
const userStore = useUserStore()

const breadcrumbs = [
  { label: '成长档案' },
  { label: '技能管理' }
]

// 判断角色
const isStudentRole = computed(() => userStore.user?.role === 'student')
const isTeacherOrAdmin = computed(() => ['teacher', 'admin'].includes(userStore.user?.role))

// 当前学生ID
const currentStudentId = computed(() => {
  if (isStudentRole.value) {
    return userStore.user?.id || userStore.user?.studentId
  }
  return studentSelectForm.studentId
})

// 学生选择表单
const studentSelectForm = reactive({
  studentId: ''
})

const studentOptions = ref([])

// 搜索字段配置
const searchFields = [
  {
    prop: 'category',
    label: '分类',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '学术', value: 'academic' },
      { label: '体育', value: 'sports' },
      { label: '艺术', value: 'art' },
      { label: '技术', value: 'technology' },
      { label: '其他', value: 'other' }
    ],
    placeholder: '请选择分类'
  },
  {
    prop: 'keyword',
    label: '关键词',
    type: 'input',
    placeholder: '请输入技能名称'
  }
]

// 表格列配置
const tableColumns = [
  { prop: 'name', label: '技能名称', minWidth: 140 },
  { prop: 'category', label: '分类', width: 100, slot: 'category' },
  { prop: 'level', label: '等级', width: 140, slot: 'level' },
  { prop: 'description', label: '描述', minWidth: 200, showOverflowTooltip: true },
  { prop: 'semester', label: '获得学期', width: 180 },
  { prop: 'certStatus', label: '认证状态', width: 100, slot: 'status' }
]

// 使用 useTable
const {
  loading,
  dataList,
  pagination,
  searchParams,
  handleSearch,
  handleReset,
  handlePageChange,
  handleSizeChange,
  fetchData
} = useTable((params) => {
  if (!currentStudentId.value) return Promise.resolve({ data: [] })
  return skillAPI.list(currentStudentId.value, params)
}, {
  category: '',
  keyword: ''
})

// 使用 useDialog
const dialog = useDialog({
  name: '',
  category: '',
  level: 3,
  description: '',
  semester: '',
  certificate: [],
  certStatus: 'pending'
})

const dialogVisible = computed(() => dialog.visible.value)
const dialogTitle = computed(() => dialog.title.value)
const formData = dialog.formData
const formRef = dialog.formRef
const submitLoading = dialog.loading

// 文件上传
const uploadUrl = ref('/api/upload')
const fileList = ref([])

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入技能名称', trigger: 'blur' },
    { max: 50, message: '技能名称不能超过50个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择技能分类', trigger: 'change' }
  ],
  level: [
    { required: true, message: '请选择技能等级', trigger: 'change' }
  ],
  semester: [
    { required: true, message: '请选择获得学期', trigger: 'change' }
  ],
  description: [
    { max: 500, message: '描述不能超过500个字符', trigger: 'blur' }
  ]
}

// 获取分类文字
const getCategoryText = (category) => {
  const map = {
    academic: '学术',
    sports: '体育',
    art: '艺术',
    technology: '技术',
    other: '其他'
  }
  return map[category] || category
}

// 获取分类标签类型
const getCategoryTagType = (category) => {
  const map = {
    academic: 'primary',
    sports: 'success',
    art: 'warning',
    technology: 'danger',
    other: 'info'
  }
  return map[category] || 'info'
}

// 获取状态文字
const getStatusText = (status) => {
  const map = {
    pending: '待认证',
    approved: '已认证',
    rejected: '已驳回'
  }
  return map[status] || '未知'
}

// 获取状态标签类型
const getStatusTagType = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || 'info'
}

// 加载学生列表
const loadStudentList = async () => {
  try {
    // 模拟数据
    studentOptions.value = [
      { id: '1', name: '张三', studentNo: '2024001' },
      { id: '2', name: '李四', studentNo: '2024002' },
      { id: '3', name: '王五', studentNo: '2024003' }
    ]
  } catch (error) {
    console.error('加载学生列表失败:', error)
  }
}

// 学生变化
const handleStudentChange = () => {
  pagination.page = 1
  fetchData()
}

// 新增
const handleAdd = () => {
  if (!currentStudentId.value) {
    ElMessage.warning('请先选择学生')
    return
  }
  fileList.value = []
  dialog.openAdd({ studentId: currentStudentId.value })
}

// 编辑
const handleEdit = (row) => {
  fileList.value = row.certificate?.map((url, index) => ({
    name: `证明材料${index + 1}`,
    url: url
  })) || []
  dialog.openEdit(row)
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除技能"${row.name}"吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await skillAPI.delete(row.id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }).catch(() => {})
}

// 上传前校验
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 上传成功
const handleUploadSuccess = (response, file) => {
  if (response.url) {
    formData.certificate.push(response.url)
  }
}

// 移除文件
const handleUploadRemove = (file) => {
  const index = formData.certificate.indexOf(file.url)
  if (index > -1) {
    formData.certificate.splice(index, 1)
  }
}

// 提交
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  submitLoading.value = true
  try {
    if (dialog.mode.value === 'add') {
      await skillAPI.create({
        ...formData,
        studentId: currentStudentId.value
      })
      ElMessage.success('新增成功')
    } else {
      await skillAPI.update(formData.id, formData)
      ElMessage.success('编辑成功')
    }
    dialog.close()
    fetchData()
  } catch (error) {
    ElMessage.error(dialog.mode.value === 'add' ? '新增失败' : '编辑失败')
    console.error(error)
  } finally {
    submitLoading.value = false
  }
}

// 关闭弹窗
const handleDialogClose = () => {
  dialog.close()
}

onMounted(() => {
  if (isStudentRole.value) {
    fetchData()
  } else {
    loadStudentList()
    // 如果路由中有studentId参数
    if (route.query.studentId) {
      studentSelectForm.studentId = route.query.studentId
      fetchData()
    }
  }
})
</script>

<style scoped lang="scss">
.skill-list {
  padding: 20px;

  .filter-card {
    margin-bottom: 16px;

    .student-select-form {
      margin-bottom: 8px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0f0f0;
    }
  }

  .table-card {
    margin-bottom: 16px;
  }

  .star-level {
    display: flex;
    gap: 2px;

    .el-icon {
      color: #dcdfe6;

      &.active {
        color: #f59e0b;
      }
    }
  }

  .level-select {
    .level-radio {
      margin-right: 8px;

      :deep(.el-radio__input) {
        display: none;
      }

      :deep(.el-radio__label) {
        padding-left: 0;
      }

      .level-stars {
        padding: 6px 10px;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        display: flex;
        gap: 2px;
        transition: all 0.2s;

        .el-icon {
          color: #dcdfe6;

          &.active {
            color: #f59e0b;
          }
        }

        &:hover {
          border-color: #409eff;
        }
      }

      &.is-checked .level-stars {
        border-color: #409eff;
        background: #ecf5ff;
      }
    }
  }

  .upload-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}
</style>
