import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { portfolioAPI } from '@/api/portfolio'
import { exportElementToPdf } from '@/utils/exportPdf'
import { computeCommentSummary } from './utils/portfolioOverviewCompute'

export function usePortfolioOverview() {
  const router = useRouter()
  const userStore = useUserStore()

  // 判断是否为学生角色
  const isStudentRole = computed(() => {
    return userStore.user?.role === 'student'
  })

  // 选择表单
  const selectForm = reactive({
    studentId: '',
    classId: ''
  })

  // 当前选中的学生ID
  const currentStudentId = computed(() => {
    if (isStudentRole.value) {
      return userStore.user?.id || userStore.user?.studentId
    }
    return selectForm.studentId
  })

  const loading = ref(false)
  const classList = ref([])
  const studentOptions = ref([])
  const studentInfo = ref({})
  const overviewData = ref({})
  const latestMentalHealth = ref({})
  const latestComment = ref({})

  // 导出 PDF 相关
  const exportContentRef = ref(null)
  const exporting = ref(false)
  // 有学生信息且不在加载中才允许导出
  const canExport = computed(() => !loading.value && !!studentInfo.value?.name)

  // 最新评语摘要
  const latestCommentSummary = computed(() => computeCommentSummary(latestComment.value.content))

  // 技能分类数据
  const skillCategoryData = ref([
    { name: '学术', value: 0 },
    { name: '体育', value: 0 },
    { name: '艺术', value: 0 },
    { name: '技术', value: 0 },
    { name: '其他', value: 0 }
  ])

  // 荣誉级别数据
  const honorLevelData = ref([
    { name: '校级', value: 0 },
    { name: '市级', value: 0 },
    { name: '省级', value: 0 },
    { name: '国家级', value: 0 },
    { name: '国际级', value: 0 }
  ])

  // 考试成绩数据
  const examScoreData = ref([])

  // 图表就绪标记：仅在总览数据加载完成后才渲染图表（与原页面时机一致）
  const chartsReady = ref(false)

  // 班级变化
  const handleClassChange = () => {
    // 根据班级筛选学生列表
    loadStudentList()
  }

  // 学生变化
  const handleStudentChange = () => {
    loadOverviewData()
  }

  // 加载班级列表
  const loadClassList = async () => {
    try {
      // 实际项目中调用API，这里使用模拟数据
      classList.value = [
        { id: '1', name: '高一(1)班' },
        { id: '2', name: '高一(2)班' },
        { id: '3', name: '高一(3)班' }
      ]
    } catch (error) {
      console.error('加载班级列表失败:', error)
    }
  }

  // 加载学生列表
  const loadStudentList = async () => {
    try {
      // 实际项目中调用API，这里使用模拟数据
      studentOptions.value = [
        { id: '1', name: '张三', studentNo: '2024001' },
        { id: '2', name: '李四', studentNo: '2024002' },
        { id: '3', name: '王五', studentNo: '2024003' }
      ]
    } catch (error) {
      console.error('加载学生列表失败:', error)
    }
  }

  // 加载总览数据
  const loadOverviewData = async () => {
    if (!currentStudentId.value) return

    loading.value = true
    try {
      const res = await portfolioAPI.overview(currentStudentId.value)
      if (res.data) {
        studentInfo.value = res.data.basicInfo || {}
        overviewData.value = res.data.overview || {}
        skillCategoryData.value = res.data.skillStats || skillCategoryData.value
        honorLevelData.value = res.data.honorStats || honorLevelData.value
        examScoreData.value = res.data.examScores || []
        latestMentalHealth.value = res.data.latestMentalHealth || {}
        latestComment.value = res.data.latestComment || {}
      }
    } catch (error) {
      console.error('加载总览数据失败:', error)
      // 使用模拟数据
      loadMockData()
    } finally {
      loading.value = false
    }

    await nextTick()
    chartsReady.value = true
  }

  // 加载模拟数据
  const loadMockData = () => {
    studentInfo.value = {
      id: currentStudentId.value,
      name: '张三',
      studentNo: '2024001',
      className: '高一(1)班',
      gradeName: '高一年级',
      headTeacher: '王老师',
      avatar: '',
      mentalStatus: 'good'
    }

    overviewData.value = {
      skillCount: 8,
      honorCount: 5,
      mentalStatus: 'good'
    }

    skillCategoryData.value = [
      { name: '学术', value: 3 },
      { name: '体育', value: 2 },
      { name: '艺术', value: 1 },
      { name: '技术', value: 1 },
      { name: '其他', value: 1 }
    ]

    honorLevelData.value = [
      { name: '校级', value: 2 },
      { name: '市级', value: 1 },
      { name: '省级', value: 1 },
      { name: '国家级', value: 1 },
      { name: '国际级', value: 0 }
    ]

    examScoreData.value = [
      { examName: '第一次月考', totalScore: 520, classRank: 12 },
      { examName: '期中考试', totalScore: 545, classRank: 8 },
      { examName: '第二次月考', totalScore: 558, classRank: 6 }
    ]

    latestMentalHealth.value = {
      id: '1',
      assessmentDate: '2024-05-20',
      totalScore: 82,
      stressLevel: 'medium',
      emotionIndex: 75,
      sleepQuality: 80,
      anxietyLevel: 60,
      suggestion: '保持良好的作息习惯，适当参加体育活动，注意调节学习压力。'
    }

    latestComment.value = {
      id: '1',
      semester: '2023-2024学年第二学期',
      type: 'semester',
      source: 'teacher',
      content: '该生本学期学习态度端正，成绩稳步提升。在班级活动中表现积极，乐于助人，与同学相处融洽。希望继续保持良好的学习习惯，在薄弱学科上多下功夫，争取更大进步。',
      teacherName: '王老师',
      createTime: '2024-06-30'
    }
  }

  // 跳转到心理健康页面
  const goToMentalHealth = () => {
    router.push({ path: '/portfolio/mental-health', query: { studentId: currentStudentId.value } })
  }

  // 跳转到评语页面
  const goToComments = () => {
    router.push({ path: '/portfolio/comments', query: { studentId: currentStudentId.value } })
  }

  // 导出当前学生的成长档案 PDF
  const handleExportPdf = async () => {
    const container = exportContentRef.value
    if (!container) {
      ElMessage.error('导出失败：未找到导出内容')
      return
    }
    if (exporting.value) return

    exporting.value = true
    // 导出期间隐藏按钮等非内容元素，避免干扰截图
    container.classList.add('pdf-exporting')
    try {
      await nextTick()
      const name = studentInfo.value?.name || '学生'
      const studentNo = studentInfo.value?.studentNo || ''
      const className = studentInfo.value?.className || ''
      const fileName = `成长档案_${name}${studentNo ? `_${studentNo}` : ''}`
      const subtitleParts = [className, studentNo ? `学号：${studentNo}` : ''].filter(Boolean)

      await exportElementToPdf(container, fileName, {
        title: '学生成长档案',
        subtitle: subtitleParts.join('    ')
      })
      ElMessage.success('导出成功')
    } catch (error) {
      console.error('导出 PDF 失败:', error)
      ElMessage.error(error?.message || '导出失败，请重试')
    } finally {
      container.classList.remove('pdf-exporting')
      exporting.value = false
    }
  }

  onMounted(() => {
    if (isStudentRole.value) {
      loadOverviewData()
    } else {
      loadClassList()
      loadStudentList()
    }
  })

  return {
    // 角色 / 学生
    isStudentRole,
    currentStudentId,
    selectForm,
    // 数据
    loading,
    classList,
    studentOptions,
    studentInfo,
    overviewData,
    latestMentalHealth,
    latestComment,
    latestCommentSummary,
    skillCategoryData,
    honorLevelData,
    examScoreData,
    chartsReady,
    // 导出
    exportContentRef,
    exporting,
    canExport,
    handleExportPdf,
    // 事件
    handleClassChange,
    handleStudentChange,
    goToMentalHealth,
    goToComments
  }
}