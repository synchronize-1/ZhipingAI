import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { mentalHealthAPI } from '@/api/portfolio'
import { useTable } from '@/composables/useTable'
import { useDialog } from '@/composables/useDialog'
import { getAssessmentTypeText } from './utils/mentalHealthCompute'

export function useMentalHealth() {
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
      prop: 'assessmentType',
      label: '测评类型',
      type: 'select',
      options: [
        { label: '全部', value: '' },
        { label: '心理健康综合测评', value: 'comprehensive' },
        { label: '情绪状态测评', value: 'emotion' },
        { label: '压力水平测评', value: 'stress' },
        { label: '睡眠质量测评', value: 'sleep' },
        { label: '焦虑自评量表', value: 'anxiety' },
        { label: '抑郁自评量表', value: 'depression' }
      ],
      placeholder: '请选择类型'
    },
    {
      prop: 'dateRange',
      label: '测评日期',
      type: 'date',
      dateType: 'daterange',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期'
    }
  ]

  // 表格列配置
  const tableColumns = [
    { prop: 'assessmentDate', label: '测评日期', width: 120 },
    { prop: 'assessmentTypeText', label: '测评类型', minWidth: 140 },
    { prop: 'totalScore', label: '总得分', width: 100, slot: 'totalScore' },
    { prop: 'stressLevel', label: '压力水平', width: 100, slot: 'stressLevel' },
    { prop: 'emotionIndex', label: '情绪指数', width: 160, slot: 'emotionIndex' }
  ]

  // 维度列表
  const dimensionList = [
    { key: 'emotionIndex', name: '情绪指数', color: '#ec4899' },
    { key: 'sleepQuality', name: '睡眠质量', color: '#8b5cf6' },
    { key: 'anxietyLevel', name: '焦虑水平', color: '#f97316' },
    { key: 'depressionLevel', name: '抑郁水平', color: '#ef4444' },
    { key: 'interpersonalSensitivity', name: '人际敏感', color: '#3b82f6' },
    { key: 'lifeAdaptation', name: '生活适应', color: '#10b981' }
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
    return mentalHealthAPI.list(currentStudentId.value, params)
  }, {
    assessmentType: '',
    dateRange: []
  })

  // 表单弹窗
  const formDialog = useDialog({
    assessmentType: 'comprehensive',
    assessmentDate: '',
    totalScore: 80,
    stressLevel: 'medium',
    emotionIndex: 75,
    sleepQuality: 70,
    anxietyLevel: 50,
    depressionLevel: 45,
    interpersonalSensitivity: 60,
    lifeAdaptation: 75,
    notes: '',
    suggestion: ''
  })

  const formDialogVisible = formDialog.visible
  const formDialogTitle = computed(() => formDialog.title.value)
  const formData = formDialog.formData
  const formRef = formDialog.formRef
  const submitLoading = formDialog.loading
  // 供表单弹窗子组件把 el-form 实例回填到 useDialog 的 formRef
  const setFormRef = (el) => { formRef.value = el }

  // 详情弹窗
  const detailDialogVisible = ref(false)
  const detailLoading = ref(false)
  const detailData = ref({})

  // 趋势数据
  const trendData = ref([])

  // 图表就绪标记：仅在趋势数据加载完成后才渲染图表（与原页面时机一致）
  const trendReady = ref(false)

  // 表单验证规则
  const formRules = {
    assessmentType: [
      { required: true, message: '请选择测评类型', trigger: 'change' }
    ],
    assessmentDate: [
      { required: true, message: '请选择测评日期', trigger: 'change' }
    ],
    totalScore: [
      { required: true, message: '请输入总得分', trigger: 'blur' }
    ],
    stressLevel: [
      { required: true, message: '请选择压力水平', trigger: 'change' }
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
    loadTrendData()
  }

  // 加载趋势数据
  const loadTrendData = async () => {
    if (!currentStudentId.value) return

    try {
      const res = await mentalHealthAPI.trend(currentStudentId.value)
      if (res.data) {
        trendData.value = res.data
      }
    } catch (error) {
      console.error('加载趋势数据失败:', error)
      // 模拟数据
      trendData.value = [
        { date: '01-15', emotionIndex: 72, stressLevel: 55, totalScore: 78 },
        { date: '02-20', emotionIndex: 68, stressLevel: 62, totalScore: 75 },
        { date: '03-18', emotionIndex: 75, stressLevel: 50, totalScore: 80 },
        { date: '04-22', emotionIndex: 70, stressLevel: 58, totalScore: 76 },
        { date: '05-20', emotionIndex: 78, stressLevel: 48, totalScore: 82 },
        { date: '06-15', emotionIndex: 82, stressLevel: 45, totalScore: 85 }
      ]
    }

    trendReady.value = true
  }

  // 查看详情
  const handleView = async (row) => {
    detailDialogVisible.value = true
    detailLoading.value = true

    try {
      // 模拟加载详情数据
      await new Promise(resolve => setTimeout(resolve, 300))
      detailData.value = {
        ...row,
        assessmentTypeText: getAssessmentTypeText(row.assessmentType),
        emotionIndex: row.emotionIndex || 75,
        sleepQuality: row.sleepQuality || 70,
        anxietyLevel: row.anxietyLevel || 50,
        depressionLevel: row.depressionLevel || 45,
        interpersonalSensitivity: row.interpersonalSensitivity || 60,
        lifeAdaptation: row.lifeAdaptation || 75,
        notes: row.notes || '学生近期学习压力稍大，整体心理状态良好。',
        suggestion: row.suggestion || '建议保持规律作息，适当参加体育活动，注意劳逸结合。遇到问题可以主动与老师或同学沟通交流。'
      }
    } catch (error) {
      console.error(error)
    } finally {
      detailLoading.value = false
    }
  }

  // 新增
  const handleAdd = () => {
    if (!currentStudentId.value) {
      ElMessage.warning('请先选择学生')
      return
    }
    formDialog.openAdd({ studentId: currentStudentId.value })
  }

  // 编辑
  const handleEdit = (row) => {
    formDialog.openEdit(row)
  }

  // 删除
  const handleDelete = (row) => {
    ElMessageBox.confirm(
      `确定要删除该测评记录吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(async () => {
      try {
        await mentalHealthAPI.delete(row.id)
        ElMessage.success('删除成功')
        fetchData()
        loadTrendData()
      } catch (error) {
        ElMessage.error('删除失败')
        console.error(error)
      }
    }).catch(() => {})
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
      if (formDialog.mode.value === 'add') {
        await mentalHealthAPI.create({
          ...formData,
          studentId: currentStudentId.value
        })
        ElMessage.success('新增成功')
      } else {
        await mentalHealthAPI.update(formData.id, formData)
        ElMessage.success('编辑成功')
      }
      formDialog.close()
      fetchData()
      loadTrendData()
    } catch (error) {
      ElMessage.error(formDialog.mode.value === 'add' ? '新增失败' : '编辑失败')
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
      loadTrendData()
    } else {
      loadStudentList()
      if (route.query.studentId) {
        studentSelectForm.studentId = route.query.studentId
        fetchData()
        loadTrendData()
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
    tableColumns,
    loading,
    dataList,
    pagination,
    searchParams,
    handleSearch,
    handleReset,
    handlePageChange,
    handleSizeChange,
    // 趋势
    trendData,
    trendReady,
    // 详情弹窗
    detailDialogVisible,
    detailLoading,
    detailData,
    dimensionList,
    // 表单弹窗
    formDialogVisible,
    formDialogTitle,
    formData,
    formRef,
    setFormRef,
    submitLoading,
    formRules,
    // 事件
    handleStudentChange,
    handleView,
    handleAdd,
    handleEdit,
    handleDelete,
    handleSubmit,
    handleFormClose
  }
}