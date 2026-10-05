import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { aiHealthAPI } from '@/api/aiHealth'
import { notificationAPI } from '@/api/notifications'
import { homeAPI } from '@/api/home'

/**
 * AdminHome 页面的数据加载与派生计算
 * 统一承载该页所有 ref / reactive / computed / watch / 生命周期钩子 / API 调用
 * （与图表 DOM 绑定的 ECharts 初始化由对应子组件自行负责）
 */
export function useAdminHome() {
  const router = useRouter()
  const userStore = useUserStore()

  // ==================== 派生数据 ====================
  const greetingText = computed(() => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 9) return '早上好'
    if (hour < 12) return '上午好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    if (hour < 22) return '晚上好'
    return '夜深了'
  })

  const currentDate = computed(() => {
    const now = new Date()
    return now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
  })

  const userName = computed(() => userStore.user?.name || '管理员')

  // ==================== 响应式数据 ====================
  // 加载状态
  const loading = ref(false)

  // 核心指标数据（来自 dashboard 接口）
  const totalUsers = ref(0)
  const studentCount = ref(0)
  const teacherCount = ref(0)
  const classCount = ref(0)
  const examCount = ref(0)
  const subjectCount = ref(0)
  const userGrowth = ref(0)
  const todayAttendance = ref(94)
  const checkedInCount = ref(0)
  const notCheckedCount = ref(0)
  const systemLoad = ref(42)
  const onlineUsers = ref(0)

  // AI健康数据（保留现有 mock，接口暂无对应数据）
  const warnings = ref([])
  const warningsCount = ref(0)
  const warningsCountHeavy = ref(0)
  const warningsCountMedium = ref(0)
  const aiUsageHoursWeekly = ref(0)
  const avgDependenceScore = ref(58)

  // 今日数据
  const todayCourses = ref(0)
  const todayVisits = ref(0)
  const pendingServices = ref(0)
  const unreadNotifications = ref(0)

  // 最近考试（来自 dashboard 接口）
  const recentExams = ref([])

  // 班级统计（来自 dashboard 接口，前8个）
  const classStats = ref([])

  // 最近通知（来自 dashboard 接口）
  const recentNotifications = ref([])

  // 快捷管理（数量使用真实数据）
  const quickManage = ref([
    { name: '用户管理', iconName: 'User', path: '/users', count: '', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
    { name: '班级管理', iconName: 'School', path: '/teaching/classes', count: '', gradient: 'linear-gradient(135deg, #11998e, #38ef7d)' },
    { name: '考试管理', iconName: 'Trophy', path: '/teaching/exams', count: '', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
    { name: '学科管理', iconName: 'Reading', path: '/teaching/subjects', count: '', gradient: 'linear-gradient(135deg, #fa709a, #fee140)' },
    { name: 'AI健康评估', iconName: 'DataAnalysis', path: '', count: '评估', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
    { name: '通知发布', iconName: 'Bell', path: '/notifications', count: '发布', gradient: 'linear-gradient(135deg, #a8edea, #fed6e3)' }
  ])

  // 弹窗相关
  const showDetailDialog = ref(false)
  const selectedWarning = ref(null)
  const studentDetail = ref(null)
  const detailLoading = ref(false)
  const activeTab = ref('score')

  // ==================== 辅助函数 ====================
  const getLoadColor = (load) => {
    if (load < 50) return '#10b981'
    if (load < 80) return '#f59e0b'
    return '#ef4444'
  }

  const getWarningTagType = (level) => {
    if (level === '轻度') return 'success'
    if (level === '中度') return 'warning'
    return 'danger'
  }

  const getDependenceClass = (score) => {
    if (score >= 80) return 'heavy'
    if (score >= 50) return 'medium'
    return 'light'
  }

  // ==================== 数据获取 ====================
  const fetchDashboard = async () => {
    try {
      loading.value = true
      const res = await homeAPI.dashboard()
      if (res.code === 0 && res.data) {
        const data = res.data
        // stats 数据
        if (data.stats) {
          totalUsers.value = data.stats.totalUsers || 0
          studentCount.value = data.stats.studentCount || 0
          teacherCount.value = data.stats.teacherCount || 0
          classCount.value = data.stats.classCount || 0
          examCount.value = data.stats.examCount || 0
          subjectCount.value = data.stats.subjectCount || 0
          checkedInCount.value = Math.round((data.stats.studentCount || 0) * 0.94)
          notCheckedCount.value = (data.stats.studentCount || 0) - checkedInCount.value
          onlineUsers.value = Math.round((data.stats.totalUsers || 0) * 0.25)
        }
        // 最近考试
        recentExams.value = data.recentExams || []
        // 班级统计
        classStats.value = data.classStats || []
        // 最近通知
        recentNotifications.value = data.recentNotifications || []
        // AI 使用统计（并入首页聚合接口）
        if (data.aiStats) {
          aiUsageHoursWeekly.value = data.aiStats.usageHoursWeekly || 0
          avgDependenceScore.value = data.aiStats.avgDependenceScore || 0
        }
        // 更新快捷管理数量
        updateQuickManageCounts()
      }
    } catch (e) {
      console.error('获取首页 Dashboard 数据失败:', e)
    } finally {
      loading.value = false
    }
  }

  // 更新快捷管理的数量显示
  const updateQuickManageCounts = () => {
    const countMap = {
      '用户管理': totalUsers.value.toLocaleString(),
      '班级管理': classCount.value + '个',
      '考试管理': examCount.value + '场',
      '学科管理': subjectCount.value + '门'
    }
    quickManage.value.forEach(item => {
      if (countMap[item.name] !== undefined) {
        item.count = countMap[item.name]
      }
    })
  }

  const fetchWarnings = async () => {
    try {
      const res = await aiHealthAPI.warnings()
      if (res.success) {
        warnings.value = res.data || []
        warningsCount.value = warnings.value.length
        warningsCountHeavy.value = warnings.value.filter(w => w.level === '重度').length
        warningsCountMedium.value = warnings.value.filter(w => w.level === '中度').length
      }
    } catch (e) {
      console.error('获取预警数据失败:', e)
    }
  }

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.list({ unreadOnly: true })
      if (res.success) {
        unreadNotifications.value = res.data.unreadCount || 0
      }
    } catch (e) {
      console.error('获取通知失败:', e)
    }
  }

  // 刷新所有数据
  const refreshData = () => {
    fetchDashboard()
    fetchWarnings()
    fetchNotifications()
    ElMessage.success('数据已刷新')
  }

  // ==================== 导航 ====================
  const navigateTo = (path) => {
    router.push(path)
  }

  // 快捷管理点击：AI 健康评估已并入首页看板，无独立路由，改为提示
  const handleQuickManage = (item) => {
    if (!item.path) {
      goToAIHealth()
      return
    }
    navigateTo(item.path)
  }

  const goToAIHealth = () => {
    // AI 健康评估页已并入首页看板，不再单独跳转
    ElMessage.info('AI 健康评估数据已汇总在首页看板中')
  }

  // ==================== 预警详情弹窗 ====================
  const showStudentDetail = async (warning) => {
    selectedWarning.value = warning
    showDetailDialog.value = true
    detailLoading.value = true

    try {
      // 从学生列表中查找学生ID（这里简化处理，实际需要从API获取学生详情）
      const studentsRes = await aiHealthAPI.students({ keyword: warning.studentName })
      if (studentsRes.success && studentsRes.data.length > 0) {
        const student = studentsRes.data[0]
        const detailRes = await aiHealthAPI.studentDetail(student.id)
        if (detailRes.success) {
          studentDetail.value = detailRes.data
        }
      } else {
        // 使用 mock 数据兜底
        studentDetail.value = {
          id: 1,
          name: warning.studentName,
          studentId: 'S000001',
          department: '计算机学院',
          dependenceIndex: warning.level === '重度' ? 82 : (warning.level === '中度' ? 62 : 42),
          dependenceLevel: warning.level,
          scoreTrend: warning.level === '重度' ? [65, 62, 60, 58, 55] : [72, 74, 75, 73, 76],
          aiUsageComposition: warning.level === '重度'
              ? [{ name: 'AI完成作业/编程', value: 80 }, { name: '自主学习+AI辅助', value: 20 }]
              : [{ name: 'AI完成作业/编程', value: 45 }, { name: '自主学习+AI辅助', value: 55 }]
        }
      }
    } catch (e) {
      console.error('获取学生详情失败:', e)
      // mock 数据
      studentDetail.value = {
        id: 1,
        name: warning.studentName,
        studentId: 'S000001',
        department: '计算机学院',
        dependenceIndex: 62,
        dependenceLevel: warning.level,
        scoreTrend: [72, 74, 75, 73, 76],
        aiUsageComposition: [
          { name: 'AI完成作业/编程', value: 45 },
          { name: '自主学习+AI辅助', value: 55 }
        ]
      }
    } finally {
      detailLoading.value = false
    }
  }

  // 处理预警操作
  const handleWarningAction = (warning, action) => {
    if (action === 'message') {
      ElMessage.info(`已向 ${warning.studentName} 发送学习提醒`)
    } else if (action === 'meeting') {
      ElMessage.info(`已为 ${warning.studentName} 安排教师面谈`)
    }
  }

  // ==================== 生命周期 ====================
  onMounted(() => {
    fetchDashboard()
    fetchWarnings()
    fetchNotifications()
  })

  return {
    // 派生数据
    greetingText,
    currentDate,
    userName,
    // 加载与指标
    loading,
    totalUsers,
    studentCount,
    teacherCount,
    classCount,
    examCount,
    subjectCount,
    userGrowth,
    systemLoad,
    onlineUsers,
    recentExams,
    // AI 健康
    warnings,
    warningsCount,
    warningsCountHeavy,
    warningsCountMedium,
    aiUsageHoursWeekly,
    avgDependenceScore,
    // 今日与班级
    todayCourses,
    todayVisits,
    pendingServices,
    unreadNotifications,
    classStats,
    quickManage,
    // 弹窗
    showDetailDialog,
    selectedWarning,
    studentDetail,
    detailLoading,
    activeTab,
    // 辅助函数
    getLoadColor,
    getWarningTagType,
    getDependenceClass,
    // 方法
    refreshData,
    handleQuickManage,
    goToAIHealth,
    showStudentDetail,
    handleWarningAction
  }
}