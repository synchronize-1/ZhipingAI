<template>
  <div class="comment-list">
    <PageHeader
      title="评语管理"
      description="管理学生学期评语和各类评价"
      :breadcrumbs="breadcrumbs"
    >
      <template #extra>
        <el-button v-if="isTeacherOrAdmin" type="primary" :icon="Plus" @click="handleAdd">
          新增评语
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

    <!-- 评语列表 -->
    <el-card shadow="never" class="list-card">
      <div v-loading="loading" class="comment-list-container">
        <el-empty v-if="dataList.length === 0 && !loading" description="暂无评语记录" :image-size="80" />

        <div v-for="item in dataList" :key="item.id" class="comment-item">
          <div class="comment-header">
            <div class="comment-tags">
              <el-tag type="primary" size="small">{{ item.semester || '--' }}</el-tag>
              <el-tag size="small" :type="getTypeTagType(item.type)">
                {{ getTypeText(item.type) }}
              </el-tag>
              <el-tag size="small" :type="getSourceTagType(item.source)" effect="plain">
                {{ getSourceText(item.source) }}
              </el-tag>
            </div>
            <div class="comment-meta">
              <span class="comment-author">{{ item.teacherName || '系统' }}</span>
              <span class="comment-time">{{ item.createTime }}</span>
            </div>
          </div>

          <div class="comment-body">
            <p class="content-summary">{{ getContentSummary(item.content) }}</p>
          </div>

          <div class="comment-footer">
            <div class="comment-stats">
              <span v-if="item.wordCount" class="stat-item">
                <el-icon :size="14"><Document /></el-icon>
                {{ item.wordCount }} 字
              </span>
            </div>
            <div class="comment-actions">
              <el-button type="primary" link size="small" @click="handleView(item)">
                查看全文
              </el-button>
              <el-button v-if="isTeacherOrAdmin" type="primary" link size="small" @click="handleEdit(item)">
                编辑
              </el-button>
              <el-button v-if="isTeacherOrAdmin" type="danger" link size="small" @click="handleDelete(item)">
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="showPagination" class="pagination-wrapper">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          :disabled="loading"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 查看详情弹窗 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="评语详情"
      width="600px"
      :close-on-click-modal="true"
    >
      <div class="view-detail">
        <div class="detail-header">
          <div class="detail-tags">
            <el-tag type="primary">{{ viewData.semester || '--' }}</el-tag>
            <el-tag :type="getTypeTagType(viewData.type)">
              {{ getTypeText(viewData.type) }}
            </el-tag>
            <el-tag :type="getSourceTagType(viewData.source)" effect="plain">
              {{ getSourceText(viewData.source) }}
            </el-tag>
          </div>
          <div class="detail-meta">
            <span>{{ viewData.teacherName || '系统' }} · {{ viewData.createTime }}</span>
          </div>
        </div>
        <div class="detail-content">
          <p v-html="viewData.content"></p>
        </div>
        <div v-if="viewData.updateTime && viewData.updateTime !== viewData.createTime" class="detail-update">
          <span class="update-label">最后更新：</span>
          <span class="update-time">{{ viewData.updateTime }}</span>
        </div>
      </div>

      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
        <el-button v-if="isTeacherOrAdmin" type="primary" @click="handleEditFromView">
          编辑
        </el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="formDialogTitle"
      width="680px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item v-if="isTeacherOrAdmin && dialogMode === 'add'" label="选择学生" prop="studentId">
          <el-select
            v-model="formData.studentId"
            placeholder="请选择学生"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="stu in studentOptions"
              :key="stu.id"
              :label="`${stu.name} (${stu.studentNo})`"
              :value="stu.id"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="学期" prop="semester">
              <el-select
                v-model="formData.semester"
                placeholder="请选择学期"
                style="width: 100%"
              >
                <el-option label="2024-2025学年第一学期" value="2024-2025-1" />
                <el-option label="2024-2025学年第二学期" value="2024-2025-2" />
                <el-option label="2023-2024学年第一学期" value="2023-2024-1" />
                <el-option label="2023-2024学年第二学期" value="2023-2024-2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="评语类型" prop="type">
              <el-select
                v-model="formData.type"
                placeholder="请选择评语类型"
                style="width: 100%"
              >
                <el-option label="学期评语" value="semester" />
                <el-option label="月度评语" value="monthly" />
                <el-option label="事件评语" value="event" />
                <el-option label="综合评语" value="comprehensive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="评语风格" prop="style">
          <el-radio-group v-model="formData.style">
            <el-radio value="formal">正式严谨</el-radio>
            <el-radio value="warm">温暖鼓励</el-radio>
            <el-radio value="concise">简洁明了</el-radio>
            <el-radio value="detailed">详细全面</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="isTeacherOrAdmin" label="来源" prop="source">
          <el-radio-group v-model="formData.source">
            <el-radio value="teacher">教师撰写</el-radio>
            <el-radio value="ai">AI生成</el-radio>
            <el-radio value="edited">AI+人工编辑</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="评语内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="10"
            placeholder="请输入评语内容..."
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>

        <div v-if="isTeacherOrAdmin" class="ai-generate-section">
          <el-button type="success" :icon="MagicStick" :loading="aiGenerating" @click="handleAIGenerate">
            AI 生成评语
          </el-button>
          <span class="generate-tip">根据学生表现数据自动生成评语草稿</span>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="handleFormClose">取消</el-button>
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
import { Plus, Document, MagicStick } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { commentAPI } from '@/api/portfolio'
import { useTable } from '@/composables/useTable'
import { useDialog } from '@/composables/useDialog'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchForm from '@/components/common/SearchForm.vue'

defineOptions({ name: 'CommentList' })

const route = useRoute()
const userStore = useUserStore()

const breadcrumbs = [
  { label: '成长档案' },
  { label: '评语管理' }
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
    prop: 'semester',
    label: '学期',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '2024-2025学年第一学期', value: '2024-2025-1' },
      { label: '2024-2025学年第二学期', value: '2024-2025-2' },
      { label: '2023-2024学年第一学期', value: '2023-2024-1' },
      { label: '2023-2024学年第二学期', value: '2023-2024-2' }
    ],
    placeholder: '请选择学期'
  },
  {
    prop: 'type',
    label: '评语类型',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '学期评语', value: 'semester' },
      { label: '月度评语', value: 'monthly' },
      { label: '事件评语', value: 'event' },
      { label: '综合评语', value: 'comprehensive' }
    ],
    placeholder: '请选择类型'
  }
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
  return commentAPI.list(currentStudentId.value, params)
}, {
  semester: '',
  type: ''
})

const showPagination = computed(() => pagination.total > 0)

// 表单弹窗
const formDialog = useDialog({
  studentId: '',
  semester: '',
  type: 'semester',
  style: 'warm',
  source: 'teacher',
  content: ''
})

const formDialogVisible = computed(() => formDialog.visible.value)
const formDialogTitle = computed(() => formDialog.title.value)
const formData = formDialog.formData
const formRef = formDialog.formRef
const submitLoading = formDialog.loading
const dialogMode = computed(() => formDialog.mode.value)

// 查看弹窗
const viewDialogVisible = ref(false)
const viewData = ref({})
const aiGenerating = ref(false)

// 表单验证规则
const formRules = {
  studentId: [
    { required: true, message: '请选择学生', trigger: 'change' }
  ],
  semester: [
    { required: true, message: '请选择学期', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择评语类型', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入评语内容', trigger: 'blur' },
    { min: 10, message: '评语内容至少10个字符', trigger: 'blur' },
    { max: 2000, message: '评语内容不能超过2000个字符', trigger: 'blur' }
  ]
}

// 获取类型文字
const getTypeText = (type) => {
  const map = {
    semester: '学期评语',
    monthly: '月度评语',
    event: '事件评语',
    comprehensive: '综合评语'
  }
  return map[type] || type
}

// 获取类型标签类型
const getTypeTagType = (type) => {
  const map = {
    semester: 'primary',
    monthly: 'success',
    event: 'warning',
    comprehensive: 'danger'
  }
  return map[type] || 'info'
}

// 获取来源文字
const getSourceText = (source) => {
  const map = {
    teacher: '教师撰写',
    ai: 'AI生成',
    edited: '已编辑'
  }
  return map[source] || '未知'
}

// 获取来源标签类型
const getSourceTagType = (source) => {
  const map = {
    teacher: 'primary',
    ai: 'success',
    edited: 'warning'
  }
  return map[source] || 'info'
}

// 获取内容摘要
const getContentSummary = (content) => {
  if (!content) return ''
  const text = content.replace(/<[^>]+>/g, '')
  return text.length > 150 ? text.slice(0, 150) + '...' : text
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

// 查看
const handleView = (row) => {
  viewData.value = { ...row }
  viewDialogVisible.value = true
}

// 从查看页进入编辑
const handleEditFromView = () => {
  viewDialogVisible.value = false
  formDialog.openEdit(viewData.value)
}

// 新增
const handleAdd = () => {
  formDialog.openAdd({
    studentId: currentStudentId.value || '',
    semester: '',
    type: 'semester',
    style: 'warm',
    source: 'teacher',
    content: ''
  })
}

// 编辑
const handleEdit = (row) => {
  formDialog.openEdit(row)
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除这条评语吗？',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await commentAPI.delete(row.id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }).catch(() => {})
}

// AI 生成评语
const handleAIGenerate = async () => {
  if (!formData.studentId && !currentStudentId.value) {
    ElMessage.warning('请先选择学生')
    return
  }

  aiGenerating.value = true
  try {
    // 模拟 AI 生成
    await new Promise(resolve => setTimeout(resolve, 1500))

    const studentName = studentOptions.value.find(s => s.id === (formData.studentId || currentStudentId.value))?.name || '该生'

    formData.content = `${studentName}本学期学习态度端正，能够按时完成各项学习任务。在课堂上表现积极，思维活跃，乐于与同学交流合作。

学习方面：各科成绩稳步提升，尤其在数学和物理学科上表现突出，展现出较强的逻辑思维能力。语文和英语学科还需加强阅读和写作训练。

品德方面：尊敬师长，团结同学，乐于助人，在班级活动中表现积极，具有较强的集体荣誉感。

生活方面：作息规律，能够合理安排学习和休息时间。积极参加体育锻炼，身体素质良好。

希望在今后的学习中，继续保持良好的学习习惯，加强薄弱学科的学习，争取更大进步。同时，要注意培养自己的抗压能力，以更加积极的心态面对挑战。`

    formData.source = 'ai'
    ElMessage.success('评语生成成功，请根据实际情况调整')
  } catch (error) {
    ElMessage.error('生成失败，请稍后重试')
    console.error(error)
  } finally {
    aiGenerating.value = false
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
    if (dialogMode.value === 'add') {
      await commentAPI.create(formData)
      ElMessage.success('新增成功')
    } else {
      await commentAPI.update(formData.id, formData)
      ElMessage.success('编辑成功')
    }
    formDialog.close()
    fetchData()
  } catch (error) {
    ElMessage.error(dialogMode.value === 'add' ? '新增失败' : '编辑失败')
    console.error(error)
  } finally {
    submitLoading.value = false
  }
}

// 关闭表单弹窗
const handleFormClose = () => {
  formDialog.close()
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
.comment-list {
  padding: 20px;

  .filter-card {
    margin-bottom: 16px;

    .student-select-form {
      margin-bottom: 8px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0f0f0;
    }
  }

  .list-card {
    margin-bottom: 16px;

    :deep(.el-card__body) {
      padding: 20px;
    }
  }

  .comment-list-container {
    .comment-item {
      padding: 20px;
      border: 1px solid #ebeef5;
      border-radius: 8px;
      margin-bottom: 16px;
      transition: all 0.2s;

      &:last-child {
        margin-bottom: 0;
      }

      &:hover {
        border-color: #409eff;
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
      }

      .comment-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 12px;

        .comment-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .comment-meta {
          text-align: right;
          font-size: 13px;
          color: #909399;

          .comment-author {
            margin-right: 12px;
          }
        }
      }

      .comment-body {
        margin-bottom: 12px;

        .content-summary {
          margin: 0;
          font-size: 14px;
          color: #606266;
          line-height: 1.8;
        }
      }

      .comment-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 12px;
        border-top: 1px solid #f0f0f0;

        .comment-stats {
          display: flex;
          gap: 16px;

          .stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #909399;
          }
        }

        .comment-actions {
          display: flex;
          gap: 4px;
        }
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }

  // 查看详情弹窗
  .view-detail {
    .detail-header {
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;
      margin-bottom: 16px;

      .detail-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
      }

      .detail-meta {
        font-size: 13px;
        color: #909399;
      }
    }

    .detail-content {
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;
      margin-bottom: 16px;

      p {
        margin: 0;
        font-size: 14px;
        color: #303133;
        line-height: 2;
        white-space: pre-wrap;
      }
    }

    .detail-update {
      text-align: right;
      font-size: 12px;
      color: #c0c4cc;

      .update-label {
        margin-right: 4px;
      }
    }
  }

  .ai-generate-section {
    margin-left: 100px;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 12px;

    .generate-tip {
      font-size: 12px;
      color: #909399;
    }
  }
}
</style>
