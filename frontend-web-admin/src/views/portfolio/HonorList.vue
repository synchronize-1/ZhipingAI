<template>
  <div class="honor-list">
    <PageHeader
      title="荣誉管理"
      description="管理学生荣誉奖项信息"
      :breadcrumbs="breadcrumbs"
    >
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="handleAdd">
          新增荣誉
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
        <template #title="{ row }">
          <div class="honor-title-cell">
            <span class="honor-icon">{{ getHonorIcon(row.level) }}</span>
            <span class="honor-name">{{ row.title }}</span>
          </div>
        </template>

        <template #type="{ row }">
          <el-tag :type="getTypeTagType(row.type)" size="small">
            {{ getTypeText(row.type) }}
          </el-tag>
        </template>

        <template #level="{ row }">
          <el-tag :type="getLevelTagType(row.level)" size="small" effect="dark">
            {{ getLevelText(row.level) }}
          </el-tag>
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
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="荣誉称号" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入荣誉称号"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="荣誉类型" prop="type">
              <el-select
                v-model="formData.type"
                placeholder="请选择荣誉类型"
                style="width: 100%"
              >
                <el-option label="学科竞赛" value="academic" />
                <el-option label="文体比赛" value="sports_art" />
                <el-option label="荣誉称号" value="honor_title" />
                <el-option label="奖学金" value="scholarship" />
                <el-option label="社会实践" value="social_practice" />
                <el-option label="科技创新" value="tech_innovation" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="荣誉级别" prop="level">
              <el-select
                v-model="formData.level"
                placeholder="请选择荣誉级别"
                style="width: 100%"
              >
                <el-option label="校级" value="school" />
                <el-option label="市级" value="city" />
                <el-option label="省级" value="province" />
                <el-option label="国家级" value="national" />
                <el-option label="国际级" value="international" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="颁发机构" prop="issuingOrg">
              <el-input
                v-model="formData.issuingOrg"
                placeholder="请输入颁发机构"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="获奖日期" prop="awardDate">
              <el-date-picker
                v-model="formData.awardDate"
                type="date"
                placeholder="请选择获奖日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

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

        <el-form-item label="荣誉描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入荣誉描述"
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
            :limit="5"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
            <div style="margin-top: 8px; font-size: 12px">上传证书</div>
          </el-upload>
          <div class="upload-tip">支持 jpg、png 格式，最多上传5张，单张不超过 2MB</div>
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
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { honorAPI } from '@/api/portfolio'
import { useTable } from '@/composables/useTable'
import { useDialog } from '@/composables/useDialog'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchForm from '@/components/common/SearchForm.vue'
import DataTable from '@/components/common/DataTable.vue'

defineOptions({ name: 'HonorList' })

const route = useRoute()
const userStore = useUserStore()

const breadcrumbs = [
  { label: '成长档案' },
  { label: '荣誉管理' }
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
    prop: 'type',
    label: '荣誉类型',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '学科竞赛', value: 'academic' },
      { label: '文体比赛', value: 'sports_art' },
      { label: '荣誉称号', value: 'honor_title' },
      { label: '奖学金', value: 'scholarship' },
      { label: '社会实践', value: 'social_practice' },
      { label: '科技创新', value: 'tech_innovation' },
      { label: '其他', value: 'other' }
    ],
    placeholder: '请选择类型'
  },
  {
    prop: 'level',
    label: '荣誉级别',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '校级', value: 'school' },
      { label: '市级', value: 'city' },
      { label: '省级', value: 'province' },
      { label: '国家级', value: 'national' },
      { label: '国际级', value: 'international' }
    ],
    placeholder: '请选择级别'
  },
  {
    prop: 'keyword',
    label: '关键词',
    type: 'input',
    placeholder: '请输入荣誉名称'
  }
]

// 表格列配置
const tableColumns = [
  { prop: 'title', label: '荣誉称号', minWidth: 200, slot: 'title' },
  { prop: 'type', label: '类型', width: 110, slot: 'type' },
  { prop: 'level', label: '级别', width: 100, slot: 'level' },
  { prop: 'issuingOrg', label: '颁发机构', minWidth: 140 },
  { prop: 'awardDate', label: '获奖日期', width: 120 },
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
  return honorAPI.list(currentStudentId.value, params)
}, {
  type: '',
  level: '',
  keyword: ''
})

// 使用 useDialog
const dialog = useDialog({
  title: '',
  type: '',
  level: '',
  issuingOrg: '',
  awardDate: '',
  semester: '',
  description: '',
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
  title: [
    { required: true, message: '请输入荣誉称号', trigger: 'blur' },
    { max: 100, message: '荣誉称号不能超过100个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择荣誉类型', trigger: 'change' }
  ],
  level: [
    { required: true, message: '请选择荣誉级别', trigger: 'change' }
  ],
  issuingOrg: [
    { required: true, message: '请输入颁发机构', trigger: 'blur' },
    { max: 50, message: '颁发机构不能超过50个字符', trigger: 'blur' }
  ],
  awardDate: [
    { required: true, message: '请选择获奖日期', trigger: 'change' }
  ],
  semester: [
    { required: true, message: '请选择获得学期', trigger: 'change' }
  ],
  description: [
    { max: 500, message: '描述不能超过500个字符', trigger: 'blur' }
  ]
}

// 获取荣誉图标
const getHonorIcon = (level) => {
  const map = {
    school: '⭐',
    city: '🎖️',
    province: '🥇',
    national: '🏆',
    international: '🌍'
  }
  return map[level] || '📜'
}

// 获取类型文字
const getTypeText = (type) => {
  const map = {
    academic: '学科竞赛',
    sports_art: '文体比赛',
    honor_title: '荣誉称号',
    scholarship: '奖学金',
    social_practice: '社会实践',
    tech_innovation: '科技创新',
    other: '其他'
  }
  return map[type] || type
}

// 获取类型标签类型
const getTypeTagType = (type) => {
  const map = {
    academic: 'primary',
    sports_art: 'success',
    honor_title: 'warning',
    scholarship: 'danger',
    social_practice: 'info',
    tech_innovation: 'success',
    other: 'info'
  }
  return map[type] || 'info'
}

// 获取级别文字
const getLevelText = (level) => {
  const map = {
    school: '校级',
    city: '市级',
    province: '省级',
    national: '国家级',
    international: '国际级'
  }
  return map[level] || level
}

// 获取级别标签类型
const getLevelTagType = (level) => {
  const map = {
    school: 'success',
    city: 'primary',
    province: 'warning',
    national: 'danger',
    international: 'danger'
  }
  return map[level] || 'info'
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
    name: `证书${index + 1}`,
    url: url
  })) || []
  dialog.openEdit(row)
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除荣誉"${row.title}"吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await honorAPI.delete(row.id)
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
      await honorAPI.create({
        ...formData,
        studentId: currentStudentId.value
      })
      ElMessage.success('新增成功')
    } else {
      await honorAPI.update(formData.id, formData)
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
    if (route.query.studentId) {
      studentSelectForm.studentId = route.query.studentId
      fetchData()
    }
  }
})
</script>

<style scoped lang="scss">
.honor-list {
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

  .honor-title-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .honor-icon {
      font-size: 18px;
    }

    .honor-name {
      font-weight: 500;
    }
  }

  .upload-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}
</style>
