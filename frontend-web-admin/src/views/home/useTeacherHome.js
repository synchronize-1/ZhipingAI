import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useSocketStore } from '@/stores/socket'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { homeAPI } from '@/api/home'

export function useTeacherHome() {
  const router = useRouter()
  const userStore = useUserStore()
  const socketStore = useSocketStore()

  // 加载状态
  const loading = ref(false)

  const userAvatarUrl = computed(() => {
    const avatar = userStore.user?.avatar
    if (!avatar) return ''
    if (avatar.startsWith('http')) return avatar
    return `http://localhost:3000${avatar}`
  })

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
    return now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  })

  const currentWeekday = computed(() => {
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    return days[new Date().getDay()]
  })

  // 统计数据（来自 dashboard 接口）
  const classCount = ref(0) // 任教班级数
  const totalStudents = ref(0) // 学生总数
  const pendingHomework = ref(0) // 待批作业
  const examCount = ref(0) // 考试总数
  const todayClasses = ref(3) // 今日授课（mock，接口暂无对应数据）
  const totalStudentsToday = ref(0)

  // 我的班级（来自 dashboard 接口）
  const myClasses = ref([])

  // 最近考试（来自 dashboard 接口）
  const recentExams = ref([])

  // 最近成绩（来自 dashboard 接口）
  const recentScores = ref([])

  // 今日课程列表（保留 mock 数据，接口暂无对应数据）
  const todayClassList = ref([
    { id: 1, name: '数据结构与算法', startTime: '08:00', endTime: '09:40', location: '教A-301', studentCount: 45, attendanceRate: 96, isCurrent: false, isFinished: true },
    { id: 2, name: '算法设计与分析', startTime: '10:00', endTime: '11:40', location: '教B-205', studentCount: 42, attendanceRate: 91, isCurrent: true, isFinished: false },
    { id: 3, name: '程序设计基础', startTime: '14:00', endTime: '15:40', location: '教A-401', studentCount: 50, attendanceRate: 0, isCurrent: false, isFinished: false }
  ])

  // 教学分析数据
  const analyticsView = ref('week')
  const teachingHours = ref('24h')
  const avgAttendance = ref(94)
  const courseRating = ref('4.8')
  const interactionCount = ref(156)

  // 待办事项（来自 dashboard 接口）
  const pendingTodos = ref(0)
  const todoList = ref([])

  // 学生提问
  const studentQuestions = ref([
    { id: 1, studentName: '张三', avatar: '', courseName: '数据结构', content: '老师，请问红黑树和AVL树的区别是什么？', time: '30分钟前' },
    { id: 2, studentName: '李四', avatar: '', courseName: '算法设计', content: '动态规划的状态转移方程怎么推导？', time: '1小时前' },
    { id: 3, studentName: '王五', avatar: '', courseName: '程序设计', content: '递归函数的时间复杂度如何计算？', time: '2小时前' }
  ])
  const pendingQuestions = computed(() => studentQuestions.value.length)

  // 快捷功能
  const quickActions = ref([
    { name: '发布作业', icon: '📝', path: '/courses', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
    { name: '批改作业', icon: '✅', path: '/courses', gradient: 'linear-gradient(135deg, #11998e, #38ef7d)' },
    { name: '发起签到', icon: '📍', path: '/attendance', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
    { name: '成绩录入', icon: '📊', path: '/courses', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
    { name: '学生管理', icon: '👥', path: '/users', gradient: 'linear-gradient(135deg, #fa709a, #fee140)' },
    { name: '课程资料', icon: '📚', path: '/courses', gradient: 'linear-gradient(135deg, #a8edea, #fed6e3)' }
  ])

  // 图表引用（子组件 DOM 注册，保持图表渲染逻辑集中在组合式函数内）
  const attendanceChartRef = ref(null)
  const setAttendanceChartEl = (el) => { attendanceChartRef.value = el }

  // 签到相关
  const showCheckinDialog = ref(false)
  const currentCheckinClass = ref(null)
  const checkinDuration = ref(120)
  const checkinMethod = ref('code')
  const checkinStarted = ref(false)
  const checkinProgress = ref(100)
  const checkinCountdown = ref(0)
  const checkedInCount = ref(0)
  let checkinTimer = null

  // 待办事项弹窗
  const showTodoDialog = ref(false)
  const currentTodo = ref(null)
  const homeworkList = ref([
    { id: 1, studentName: '张三', submitTime: '2026-01-16 14:30', status: '待批改', content: '红黑树插入操作的实现...' },
    { id: 2, studentName: '李四', submitTime: '2026-01-16 15:20', status: '待批改', content: '二叉树遍历算法分析...' },
    { id: 3, studentName: '王五', submitTime: '2026-01-16 16:00', status: '已批改', content: '排序算法比较...' },
    { id: 4, studentName: '赵六', submitTime: '2026-01-16 16:45', status: '待批改', content: '图的最短路径算法...' },
    { id: 5, studentName: '钱七', submitTime: '2026-01-16 17:10', status: '待批改', content: '动态规划问题求解...' }
  ])

  // 发布作业弹窗
  const showHomeworkDialog = ref(false)
  const homeworkForm = ref({
    courseId: '',
    title: '',
    content: '',
    deadline: null
  })

  // 批改作业弹窗
  const showGradeDialog = ref(false)
  const currentGradeHomework = ref(null)
  const gradeForm = ref({
    score: 85,
    comment: ''
  })

  const startCheckin = (classItem) => {
    currentCheckinClass.value = classItem
    checkinStarted.value = false
    checkinProgress.value = 100
    checkedInCount.value = 0
    showCheckinDialog.value = true
  }

  const confirmStartCheckin = () => {
    checkinStarted.value = true
    checkinCountdown.value = checkinDuration.value
    checkedInCount.value = 0

    // 添加通知
    socketStore.addLocalNotification({
      type: 'checkin',
      title: '课堂签到已开启',
      content: `${currentCheckinClass.value.name} 的签到已开启，请在${checkinDuration.value}秒内完成签到`,
      targetRole: 'all'
    })

    ElMessage.success(`已为 ${currentCheckinClass.value.name} 发起签到`)

    // 模拟学生签到
    checkinTimer = setInterval(() => {
      checkinCountdown.value--
      checkinProgress.value = Math.round((checkinCountdown.value / checkinDuration.value) * 100)

      // 随机模拟学生签到
      if (Math.random() > 0.7 && checkedInCount.value < currentCheckinClass.value.studentCount) {
        checkedInCount.value += Math.floor(Math.random() * 3) + 1
        if (checkedInCount.value > currentCheckinClass.value.studentCount) {
          checkedInCount.value = currentCheckinClass.value.studentCount
        }
      }

      if (checkinCountdown.value <= 0) {
        endCheckinSession()
      }
    }, 1000)
  }

  const endCheckinSession = () => {
    if (checkinTimer) {
      clearInterval(checkinTimer)
      checkinTimer = null
    }
    checkinStarted.value = false
    ElMessage.success(`签到结束，共${checkedInCount.value}人完成签到`)
    showCheckinDialog.value = false
  }

  const viewClassDetail = (classItem) => {
    router.push(`/courses?id=${classItem.id}`)
  }

  const handleTodo = (todo) => {
    currentTodo.value = todo
    showTodoDialog.value = true
  }

  const completeTodo = () => {
    ElMessage.success('已标记完成')
    todoList.value = todoList.value.filter(t => t.id !== currentTodo.value.id)
    pendingTodos.value--
    showTodoDialog.value = false
  }

  const replyQuestion = (question) => {
    if (!question.reply) {
      ElMessage.warning('请输入回复内容')
      return
    }
    ElMessage.success(`已回复 ${question.studentName} 的提问`)
    studentQuestions.value = studentQuestions.value.filter(q => q.id !== question.id)
  }

  const gradeHomework = (homework) => {
    currentGradeHomework.value = homework
    gradeForm.value = { score: 85, comment: '' }
    showGradeDialog.value = true
  }

  const submitGrade = () => {
    if (!gradeForm.value.score) {
      ElMessage.warning('请输入评分')
      return
    }
    currentGradeHomework.value.status = '已批改'
    ElMessage.success(`已完成 ${currentGradeHomework.value.studentName} 的作业批改，评分：${gradeForm.value.score}分`)
    showGradeDialog.value = false
    pendingHomework.value--
  }

  const handleAction = (action) => {
    if (action.name === '发布作业') {
      homeworkForm.value = { courseId: '', title: '', content: '', deadline: null }
      showHomeworkDialog.value = true
    } else if (action.name === '批改作业') {
      currentTodo.value = { id: 1, title: '批改数据结构作业（28份）' }
      showTodoDialog.value = true
    } else if (action.name === '发起签到') {
      if (todayClassList.value.length > 0) {
        startCheckin(todayClassList.value.find(c => c.isCurrent) || todayClassList.value[0])
      } else {
        ElMessage.warning('今日没有课程')
      }
    } else {
      router.push(action.path)
    }
  }

  const submitHomework = () => {
    if (!homeworkForm.value.courseId || !homeworkForm.value.title) {
      ElMessage.warning('请填写课程和作业标题')
      return
    }
    const course = todayClassList.value.find(c => c.id === homeworkForm.value.courseId)

    // 添加通知
    socketStore.addLocalNotification({
      type: 'homework',
      title: '新作业发布',
      content: `${course?.name || '课程'}发布了新作业：${homeworkForm.value.title}`,
      targetRole: 'all'
    })

    ElMessage.success('作业发布成功')
    showHomeworkDialog.value = false
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
          classCount.value = data.stats.classCount || 0
          totalStudents.value = data.stats.studentCount || 0
          pendingHomework.value = data.stats.pendingComments || 0
          examCount.value = data.stats.examCount || 0
          totalStudentsToday.value = data.stats.studentCount || 0
        }
        // 我的班级
        myClasses.value = data.myClasses || []
        // 最近考试
        recentExams.value = data.recentExams || []
        // 最近成绩
        recentScores.value = data.recentScores || []
        // 待办事项
        if (data.toDoList && data.toDoList.length > 0) {
          todoList.value = data.toDoList.map(item => ({
            id: item.id,
            title: item.title,
            type: item.type,
            priority: item.priority || 'medium',
            deadline: getPriorityDeadline(item.priority)
          }))
          pendingTodos.value = todoList.value.length
        }
      }
    } catch (e) {
      console.error('获取首页 Dashboard 数据失败:', e)
    } finally {
      loading.value = false
    }
  }

  // 根据优先级生成显示的截止时间（接口暂无 deadline 字段）
  const getPriorityDeadline = (priority) => {
    const deadlineMap = {
      high: '今天',
      medium: '本周',
      low: '近期'
    }
    return deadlineMap[priority] || '近期'
  }

  const initChart = () => {
    if (!attendanceChartRef.value) return

    const chart = echarts.init(attendanceChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['出勤率', '课堂互动'], right: 20 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      },
      yAxis: [
        { type: 'value', name: '出勤率(%)', min: 80, max: 100 },
        { type: 'value', name: '互动次数', min: 0, max: 50 }
      ],
      series: [
        {
          name: '出勤率',
          type: 'line',
          smooth: true,
          data: [95, 92, 96, 94, 93, 0, 0],
          areaStyle: { opacity: 0.3 },
          itemStyle: { color: '#667eea' }
        },
        {
          name: '课堂互动',
          type: 'bar',
          yAxisIndex: 1,
          data: [28, 32, 25, 30, 35, 0, 0],
          itemStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#11998e' },
              { offset: 1, color: '#38ef7d' }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    })
  }

  onMounted(() => {
    fetchDashboard()
    setTimeout(initChart, 100)
  })

  return {
    // 状态
    loading,
    userStore,
    userAvatarUrl,
    greetingText,
    currentDate,
    currentWeekday,
    classCount,
    totalStudents,
    pendingHomework,
    examCount,
    todayClasses,
    totalStudentsToday,
    myClasses,
    recentExams,
    recentScores,
    todayClassList,
    analyticsView,
    teachingHours,
    avgAttendance,
    courseRating,
    interactionCount,
    pendingTodos,
    todoList,
    studentQuestions,
    pendingQuestions,
    quickActions,
    setAttendanceChartEl,
    showCheckinDialog,
    currentCheckinClass,
    checkinDuration,
    checkinMethod,
    checkinStarted,
    checkinProgress,
    checkinCountdown,
    checkedInCount,
    showTodoDialog,
    currentTodo,
    homeworkList,
    showHomeworkDialog,
    homeworkForm,
    showGradeDialog,
    currentGradeHomework,
    gradeForm,
    // 方法
    startCheckin,
    confirmStartCheckin,
    endCheckinSession,
    viewClassDetail,
    handleTodo,
    completeTodo,
    replyQuestion,
    gradeHomework,
    submitGrade,
    handleAction,
    submitHomework
  }
}