import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { commentAPI } from '@/api/portfolio'
import { useTable } from '@/composables/useTable'
import { useDialog } from '@/composables/useDialog'

export function useCommentList() {
  const route = useRoute()
  const userStore = useUserStore()

  // 判断角色
  const isStudentRole = computed(() => userStore.user?.role === 'student')
  const isTeacherOrAdmin = computed(() => ['teacher', 'admin'].includes(userStore.user?.role))

  // 学生选择表单
  const studentSelectForm = reactive({
    studentId: ''
  })

  // 当前学生ID
  const currentStudentId = computed(() => {
    if (isStudentRole.value) {
      return userStore.user?.id || userStore.user?.studentId
    }
    return studentSelectForm.studentId
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

  const formDialogVisible = formDialog.visible
  const formDialogTitle = computed(() => formDialog.title.value)
  const formData = formDialog.formData
  const formRef = formDialog.formRef
  const submitLoading = formDialog.loading
  const dialogMode = computed(() => formDialog.mode.value)
  // 供表单弹窗子组件把 el-form 实例回填到 useDialog 的 formRef
  const setFormRef = (el) => { formRef.value = el }

  // 查看弹窗
  const viewDialogVisible = ref(false)
  const viewData = ref({})
  const aiGenerating = ref(false)

  // AI 生成评语弹窗
  const aiDialogVisible = ref(false)
  const aiSaveLoading = ref(false)
  const aiFormData = reactive({
    studentId: '',
    semester: '',
    style: 'warm',
    length: 'medium'
  })
  const aiGeneratedComment = ref('')

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

  // 打开 AI 生成评语弹窗
  const openAIGenerateDialog = () => {
    aiFormData.studentId = currentStudentId.value || ''
    aiFormData.semester = ''
    aiFormData.style = 'warm'
    aiFormData.length = 'medium'
    aiGeneratedComment.value = ''
    aiDialogVisible.value = true
  }

  // 生成 AI 评语
  const handleGenerateComment = async () => {
    if (!aiFormData.studentId) {
      ElMessage.warning('请选择学生')
      return
    }
    if (!aiFormData.semester) {
      ElMessage.warning('请输入学期')
      return
    }

    aiGenerating.value = true
    try {
      const res = await commentAPI.generate(aiFormData.studentId, {
        semester: aiFormData.semester,
        style: aiFormData.style,
        length: aiFormData.length
      })
      aiGeneratedComment.value = res.data?.comment || ''
      if (!aiGeneratedComment.value) {
        ElMessage.warning('生成的评语内容为空，请重试')
      } else {
        ElMessage.success('评语生成成功，您可以编辑修改后保存')
      }
    } catch (error) {
      ElMessage.error('生成失败，请稍后重试')
      console.error('AI 生成评语失败:', error)
    } finally {
      aiGenerating.value = false
    }
  }

  // 检查学生该学期是否已有评语
  const checkExistingComment = async () => {
    try {
      const res = await commentAPI.list(aiFormData.studentId, {
        semester: aiFormData.semester,
        pageSize: 10,
        page: 1
      })
      // 兼容多种响应格式（与 useTable 保持一致）
      let list = []
      if (res.data?.list !== undefined) {
        list = res.data.list
      } else if (res.data?.data) {
        list = res.data.data
      } else if (Array.isArray(res.data)) {
        list = res.data
      }
      return list.length > 0
    } catch (error) {
      console.error('检查评语失败:', error)
      return false
    }
  }

  // 保存 AI 生成的评语
  const handleSaveAIGenerated = async () => {
    if (!aiGeneratedComment.value || aiGeneratedComment.value.trim().length < 10) {
      ElMessage.warning('评语内容至少需要10个字符')
      return
    }

    aiSaveLoading.value = true
    try {
      // 检查该学期是否已有评语
      const hasExisting = await checkExistingComment()
      if (hasExisting) {
        try {
          await ElMessageBox.confirm(
            '该学生在该学期已有评语，是否覆盖原有评语？',
            '覆盖确认',
            {
              confirmButtonText: '覆盖',
              cancelButtonText: '取消',
              type: 'warning'
            }
          )
        } catch {
          return
        }
      }

      const saveData = {
        studentId: aiFormData.studentId,
        semester: aiFormData.semester,
        type: 'semester',
        style: aiFormData.style,
        source: 'ai',
        content: aiGeneratedComment.value
      }

      await commentAPI.create(saveData)
      ElMessage.success('评语保存成功')
      aiDialogVisible.value = false
      fetchData()
    } catch (error) {
      ElMessage.error('保存失败，请稍后重试')
      console.error('保存 AI 评语失败:', error)
    } finally {
      aiSaveLoading.value = false
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

  return {
    // 角色 / 学生
    isStudentRole,
    isTeacherOrAdmin,
    studentSelectForm,
    studentOptions,
    currentStudentId,
    // 筛选 / 列表
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
    // 表单弹窗
    formDialogVisible,
    formDialogTitle,
    formData,
    formRef,
    setFormRef,
    submitLoading,
    dialogMode,
    formRules,
    // 查看弹窗
    viewDialogVisible,
    viewData,
    // AI 弹窗
    aiGenerating,
    aiDialogVisible,
    aiSaveLoading,
    aiFormData,
    aiGeneratedComment,
    // 事件
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
  }
}