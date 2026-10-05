import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { analysisAPI, examAPI, classAPI } from '@/api/teaching'
import {
  computeOverallMetrics,
  computeScoreDistribution,
  decorateWeakSubjects,
  generateClassSuggestions
} from './utils/analysisCompute'

export function useClassAnalysis() {
  const filterForm = reactive({
    examId: '',
    classId: '',
    baseExamId: ''
  })

  const loading = ref(false)
  const examList = ref([])
  const classList = ref([])
  const analysisData = ref({})
  const topStudents = ref([])
  const weakSubjects = ref([])
  const suggestions = ref([])

  // 进步/退步学生识别
  const progressData = ref({ hasComparison: false, summary: null, progressTop: [], declineTop: [] })
  const progressLoading = ref(false)
  // 对比考试候选项（排除当前考试）
  const baseExamOptions = computed(() =>
    examList.value.filter(e => String(e.id) !== String(filterForm.examId))
  )

  // 各科统计（后端 subjectStats）
  const subjectStats = computed(() => analysisData.value.subjectStats || [])

  const overallMetrics = computed(() => computeOverallMetrics(analysisData.value))

  // 汇总各科分数段分布
  const scoreDistribution = computed(() => computeScoreDistribution(subjectStats.value))

  // AI 诊断相关状态
  const diagnosisVisible = ref(false)
  const diagnosisLoading = ref(false)
  const diagnosisContent = ref('')
  const diagnosisTitle = ref('')
  const diagnosisCreatedAt = ref('')
  const diagnosisHistoryList = ref([])
  const historyLoading = ref(false)
  const activeReportId = ref('')

  const currentExamName = computed(() => examList.value.find(e => e.id === filterForm.examId)?.name || '')
  const currentClassName = computed(() => classList.value.find(c => c.id === filterForm.classId)?.name || '')

  const loadExamList = async () => {
    try {
      const res = await examAPI.list({ page: 1, pageSize: 50 })
      if (res.data?.list) {
        examList.value = res.data.list
      } else if (Array.isArray(res.data)) {
        examList.value = res.data
      }
    } catch (error) {
      console.error('加载考试列表失败:', error)
    }
  }

  const loadClassList = async () => {
    try {
      const res = await classAPI.list({ page: 1, pageSize: 100 })
      if (res.data?.list) {
        classList.value = res.data.list
      } else if (Array.isArray(res.data)) {
        classList.value = res.data
      }
    } catch (error) {
      console.error('加载班级列表失败:', error)
    }
  }

  const handleExamChange = () => {
    // 切换当前考试后，对比考试需要重新选择
    filterForm.baseExamId = ''
    progressData.value = { hasComparison: false, summary: null, progressTop: [], declineTop: [] }
  }

  const handleClassChange = () => {
    // 切换班级时刷新数据
  }

  const loadProgressData = async () => {
    if (!filterForm.examId || !filterForm.classId) return
    progressLoading.value = true
    try {
      const params = {}
      if (filterForm.baseExamId) params.baseExamId = filterForm.baseExamId
      const res = await analysisAPI.progressComparison(filterForm.examId, filterForm.classId, params)
      progressData.value = res.data || { hasComparison: false, progressTop: [], declineTop: [] }
    } catch (error) {
      console.error('加载进步/退步数据失败:', error)
      progressData.value = { hasComparison: false, summary: null, progressTop: [], declineTop: [] }
    } finally {
      progressLoading.value = false
    }
  }

  const loadAnalysisData = async () => {
    if (!filterForm.examId || !filterForm.classId) {
      ElMessage.warning('请选择考试和班级')
      return
    }

    loading.value = true
    try {
      const res = await analysisAPI.classAnalysis(filterForm.examId, filterForm.classId)
      if (res.data) {
        analysisData.value = res.data
        topStudents.value = (res.data.studentRankings || []).slice(0, 10)
        weakSubjects.value = decorateWeakSubjects(res.data)
        suggestions.value = generateClassSuggestions({
          metrics: overallMetrics.value,
          weakSubjects: weakSubjects.value
        })
      }
      await loadProgressData()
    } catch (error) {
      ElMessage.error('加载分析数据失败')
    } finally {
      loading.value = false
    }
  }

  // ==================== AI 学情诊断 ====================
  const openDiagnosis = () => {
    if (!filterForm.examId || !filterForm.classId) {
      ElMessage.warning('请选择考试和班级')
      return
    }
    diagnosisVisible.value = true
    generateDiagnosis()
  }

  const generateDiagnosis = async () => {
    if (!filterForm.examId || !filterForm.classId) {
      ElMessage.warning('请选择考试和班级')
      return
    }
    diagnosisLoading.value = true
    diagnosisContent.value = ''
    activeReportId.value = ''
    try {
      const res = await analysisAPI.classDiagnosis(filterForm.examId, filterForm.classId)
      const data = res.data || {}
      diagnosisContent.value = data.content || ''
      diagnosisTitle.value = [data.examName || currentExamName.value, data.className || currentClassName.value]
        .filter(Boolean)
        .join(' · ') || '班级学情诊断报告'
      diagnosisCreatedAt.value = data.createdAt || ''
      activeReportId.value = data.reportId || ''
      await loadDiagnosisHistory()
    } catch (error) {
      const isTimeout = error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '')
      ElMessage.error(isTimeout ? 'AI 诊断生成超时，请稍后重试' : 'AI 诊断生成失败，可能是 AI 服务未配置，请联系管理员')
    } finally {
      diagnosisLoading.value = false
    }
  }

  const loadDiagnosisHistory = async () => {
    if (!filterForm.classId) return
    historyLoading.value = true
    try {
      const res = await analysisAPI.diagnosisHistory('class', filterForm.classId, 10)
      diagnosisHistoryList.value = Array.isArray(res.data) ? res.data : (res.data?.list || [])
    } catch (error) {
      console.error('加载诊断历史失败:', error)
    } finally {
      historyLoading.value = false
    }
  }

  const handleHistoryClick = async (item) => {
    activeReportId.value = item.id
    if (item.content) {
      diagnosisContent.value = item.content
      diagnosisTitle.value = item.title || '班级学情诊断报告'
      diagnosisCreatedAt.value = item.createdAt || ''
      return
    }
    try {
      const res = await analysisAPI.diagnosisDetail(item.id)
      const data = res.data || {}
      diagnosisContent.value = data.content || ''
      diagnosisTitle.value = data.title || '班级学情诊断报告'
      diagnosisCreatedAt.value = data.createdAt || ''
    } catch (error) {
      ElMessage.error('加载诊断报告详情失败')
    }
  }

  onMounted(() => {
    loadExamList()
    loadClassList()
  })

  return {
    // 筛选
    filterForm,
    examList,
    classList,
    baseExamOptions,
    loading,
    // 分析数据
    topStudents,
    weakSubjects,
    suggestions,
    subjectStats,
    overallMetrics,
    scoreDistribution,
    // 进步/退步
    progressData,
    progressLoading,
    // 事件
    handleExamChange,
    handleClassChange,
    loadAnalysisData,
    loadProgressData,
    // AI 诊断
    diagnosisVisible,
    diagnosisLoading,
    diagnosisContent,
    diagnosisTitle,
    diagnosisCreatedAt,
    diagnosisHistoryList,
    historyLoading,
    activeReportId,
    openDiagnosis,
    generateDiagnosis,
    loadDiagnosisHistory,
    handleHistoryClick
  }
}