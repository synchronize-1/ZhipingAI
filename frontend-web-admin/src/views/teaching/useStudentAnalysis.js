import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { analysisAPI, classAPI, examAPI } from '@/api/teaching'
import {
  normalizeSubjectList,
  deriveSubjectScores,
  computeSubjectTrendSubjects,
  generateStudentSuggestions
} from './utils/analysisCompute'

export function useStudentAnalysis() {
  const router = useRouter()
  const route = useRoute()

  const searchForm = reactive({
    keyword: '',
    classId: ''
  })

  const searchLoading = ref(false)
  const loading = ref(false)
  const classList = ref([])
  const studentList = ref([])
  const selectedStudentId = ref('')

  const studentInfo = ref({})
  const examHistory = ref([])
  const subjectScores = ref([])
  const advantageSubjects = ref([])
  const weakSubjects = ref([])
  const suggestions = ref([])

  // 历次成绩趋势数据
  const examList = ref([])
  const trendData = ref([])
  const subjectTrendData = ref({})
  const totalExams = ref(0)

  // AI 学情画像状态
  const diagnosisVisible = ref(false)
  const diagnosisLoading = ref(false)
  const diagnosisContent = ref('')
  const diagnosisTitle = ref('')
  const diagnosisCreatedAt = ref('')
  const diagnosisExamId = ref('')
  const diagnosisHistoryList = ref([])
  const historyLoading = ref(false)
  const activeReportId = ref('')

  // 当前选中的学生
  const selectedStudent = computed(() => studentList.value.find(s => s.id === selectedStudentId.value) || {})

  // 学科趋势（按考试次数/平均分排序，最多展示 6 个科目）
  const subjectTrendSubjects = computed(() => computeSubjectTrendSubjects(subjectTrendData.value, 6))

  const handleBack = () => {
    router.back()
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

  const handleSearchStudent = async () => {
    if (!searchForm.keyword && !searchForm.classId) {
      ElMessage.warning('请输入搜索关键词或选择班级')
      return
    }

    searchLoading.value = true
    try {
      // 模拟搜索学生（实际应调用API）
      const mockStudents = [
        { id: '1', studentNo: '2024001', studentName: '张三', className: '高一(1)班', gender: 'male' },
        { id: '2', studentNo: '2024002', studentName: '李四', className: '高一(1)班', gender: 'female' },
        { id: '3', studentNo: '2024003', studentName: '王五', className: '高一(2)班', gender: 'male' }
      ]
      studentList.value = mockStudents
      if (mockStudents.length > 0) {
        selectedStudentId.value = mockStudents[0].id
        handleStudentChange()
      }
    } catch (error) {
      ElMessage.error('搜索失败')
    } finally {
      searchLoading.value = false
    }
  }

  const handleStudentChange = async () => {
    if (!selectedStudentId.value) return

    // 切换学生时重置 AI 画像状态
    resetDiagnosis()

    loading.value = true
    try {
      const res = await analysisAPI.studentAnalysis(selectedStudentId.value)
      if (res.data) {
        applyStudentData(res.data)
      }
    } catch (error) {
      // 如果API调用失败，使用模拟数据
      loadMockData()
    } finally {
      loading.value = false
    }
  }

  // 将后端返回的学情分析数据映射到页面各状态（兼容新旧两种返回结构）
  const applyStudentData = (data) => {
    trendData.value = data.trend || []
    subjectTrendData.value = data.subjectTrend || {}
    totalExams.value = data.totalExams ?? trendData.value.length

    const stu = selectedStudent.value || {}
    const lastTrend = trendData.value[trendData.value.length - 1] || {}

    studentInfo.value = data.basicInfo || data.student || {
      id: data.studentId || selectedStudentId.value,
      studentNo: data.studentNo || stu.studentNo,
      studentName: data.studentName || stu.studentName,
      className: data.className || stu.className,
      gender: data.gender || stu.gender,
      totalScore: data.totalScore ?? lastTrend.totalScore,
      classRank: data.classRank,
      gradeRank: data.gradeRank
    }

    // 兼容：后端未返回 examHistory 时，用历次趋势补齐现有图表数据
    examHistory.value = (data.examHistory && data.examHistory.length)
      ? data.examHistory
      : trendData.value.map(t => ({
          examName: t.examName,
          totalScore: t.totalScore,
          averageScore: t.avgScore
        }))

    subjectScores.value = (data.subjectScores && data.subjectScores.length)
      ? data.subjectScores
      : deriveSubjectScores(subjectTrendData.value)

    advantageSubjects.value = normalizeSubjectList(data.advantageSubjects || data.strongSubjects)
    weakSubjects.value = normalizeSubjectList(data.weakSubjects)
    suggestions.value = data.suggestions || generateStudentSuggestions({
      ...data,
      advantageSubjects: advantageSubjects.value,
      weakSubjects: weakSubjects.value
    })
  }

  const loadMockData = () => {
    studentInfo.value = {
      id: selectedStudentId.value,
      studentNo: '2024001',
      studentName: '张三',
      className: '高一(1)班',
      gender: 'male',
      totalScore: 568,
      classRank: 5,
      gradeRank: 28
    }

    examHistory.value = [
      { examName: '第一次月考', totalScore: 520, averageScore: 74.3, classRank: 12, gradeRank: 56 },
      { examName: '期中考试', totalScore: 545, averageScore: 77.9, classRank: 8, gradeRank: 42 },
      { examName: '第二次月考', totalScore: 558, averageScore: 79.7, classRank: 6, gradeRank: 35 },
      { examName: '期末考试', totalScore: 568, averageScore: 81.1, classRank: 5, gradeRank: 28 }
    ]

    // 用模拟数据补齐历次成绩对比所需的数据结构
    trendData.value = examHistory.value.map((e, index) => ({
      examId: `mock-${index}`,
      examName: e.examName,
      totalScore: e.totalScore,
      avgScore: e.averageScore
    }))
    totalExams.value = trendData.value.length
    subjectTrendData.value = {}

    subjectScores.value = [
      { name: '语文', score: 105, fullScore: 150, classRank: 8 },
      { name: '数学', score: 120, fullScore: 150, classRank: 3 },
      { name: '英语', score: 110, fullScore: 150, classRank: 10 },
      { name: '物理', score: 85, fullScore: 100, classRank: 5 },
      { name: '化学', score: 72, fullScore: 100, classRank: 18 },
      { name: '生物', score: 76, fullScore: 100, classRank: 15 }
    ]

    advantageSubjects.value = [
      { name: '数学', score: 120, classRank: 3 },
      { name: '物理', score: 85, classRank: 5 }
    ]

    weakSubjects.value = [
      { name: '化学', score: 72, classRank: 18 },
      { name: '生物', score: 76, classRank: 15 }
    ]

    suggestions.value = [
      '数学和物理是你的优势学科，继续保持并争取更大突破',
      '化学和生物成绩相对薄弱，建议加强基础知识的学习和理解',
      '整体成绩呈上升趋势，学习状态良好，继续保持',
      '建议制定薄弱学科的专项提升计划，有针对性地进行补习',
      '保持良好的学习习惯，注意劳逸结合，提高学习效率'
    ]
  }

  // ==================== AI 学情画像 ====================
  const resetDiagnosis = () => {
    diagnosisContent.value = ''
    diagnosisTitle.value = ''
    diagnosisCreatedAt.value = ''
    diagnosisExamId.value = ''
    diagnosisHistoryList.value = []
    activeReportId.value = ''
    diagnosisVisible.value = false
  }

  const openDiagnosis = () => {
    if (!selectedStudentId.value) {
      ElMessage.warning('请先选择学生')
      return
    }
    diagnosisVisible.value = true
    generateDiagnosis()
  }

  const generateDiagnosis = async () => {
    if (!selectedStudentId.value) {
      ElMessage.warning('请先选择学生')
      return
    }
    diagnosisLoading.value = true
    diagnosisContent.value = ''
    activeReportId.value = ''
    try {
      const res = await analysisAPI.studentDiagnosis(selectedStudentId.value, diagnosisExamId.value || undefined)
      const data = res.data || {}
      const studentName = data.studentName || studentInfo.value.studentName || '学生'
      const examName = examList.value.find(e => e.id === diagnosisExamId.value)?.name
      diagnosisContent.value = data.content || ''
      diagnosisTitle.value = `${studentName} · ${examName || '综合历次成绩'}`
      diagnosisCreatedAt.value = data.createdAt || ''
      activeReportId.value = data.reportId || ''
      await loadDiagnosisHistory()
    } catch (error) {
      const isTimeout = error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '')
      ElMessage.error(isTimeout ? 'AI 学情画像生成超时，请稍后重试' : 'AI 学情画像生成失败，可能是 AI 服务未配置，请联系管理员')
    } finally {
      diagnosisLoading.value = false
    }
  }

  const loadDiagnosisHistory = async () => {
    if (!selectedStudentId.value) return
    historyLoading.value = true
    try {
      const res = await analysisAPI.diagnosisHistory('student', selectedStudentId.value, 10)
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
      diagnosisTitle.value = item.title || '学情画像报告'
      diagnosisCreatedAt.value = item.createdAt || ''
      return
    }
    try {
      const res = await analysisAPI.diagnosisDetail(item.id)
      const data = res.data || {}
      diagnosisContent.value = data.content || ''
      diagnosisTitle.value = data.title || '学情画像报告'
      diagnosisCreatedAt.value = data.createdAt || ''
    } catch (error) {
      ElMessage.error('加载诊断报告详情失败')
    }
  }

  onMounted(() => {
    loadClassList()
    loadExamList()

    // 如果路由中有studentId参数，直接加载
    if (route.query.studentId) {
      selectedStudentId.value = route.query.studentId
      handleStudentChange()
    }
  })

  return {
    // 搜索
    searchForm,
    searchLoading,
    classList,
    studentList,
    selectedStudentId,
    handleSearchStudent,
    handleStudentChange,
    // 学情数据
    loading,
    studentInfo,
    examHistory,
    subjectScores,
    advantageSubjects,
    weakSubjects,
    suggestions,
    trendData,
    subjectTrendSubjects,
    // 返回
    handleBack,
    // AI 画像
    examList,
    diagnosisVisible,
    diagnosisLoading,
    diagnosisContent,
    diagnosisTitle,
    diagnosisCreatedAt,
    diagnosisExamId,
    diagnosisHistoryList,
    historyLoading,
    activeReportId,
    openDiagnosis,
    generateDiagnosis,
    loadDiagnosisHistory,
    handleHistoryClick
  }
}