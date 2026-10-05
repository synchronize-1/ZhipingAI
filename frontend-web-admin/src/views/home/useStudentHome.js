import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useSocketStore } from '@/stores/socket'
import { ElMessage } from 'element-plus'
import { homeAPI } from '@/api/home'

// 学生首页的数据加载与派生计算
export function useStudentHome() {
  const router = useRouter()
  const userStore = useUserStore()
  const socketStore = useSocketStore()

  // 加载状态
  const loading = ref(false)

  // 计算头像URL
  const userAvatarUrl = computed(() => {
    const avatar = userStore.user?.avatar
    if (!avatar) return ''
    if (avatar.startsWith('http')) return avatar
    return `http://localhost:3000${avatar}`
  })

  // 当前用户名
  const userName = computed(() => userStore.user?.name)

  // 问候语
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

  // 当前日期
  const currentDate = computed(() => {
    const now = new Date()
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return now.toLocaleDateString('zh-CN', options)
  })

  const currentWeekday = computed(() => {
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    return days[new Date().getDay()]
  })

  // 天气信息（模拟）
  const weatherInfo = ref({ text: '晴', temp: 18 })

  // 激励语录
  const motivationQuotes = [
    '每一次努力都是成功的积累！',
    '知识改变命运，学习成就未来。',
    '今天的汗水是明天的收获。',
    '坚持不懈，必有收获！',
    '学海无涯，勇往直前！'
  ]
  const motivationQuote = ref(motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)])

  // 今日课程 - 根据当前星期动态获取
  const todayCourses = ref([])

  // 获取今日课程
  const fetchTodayCourses = () => {
    const today = new Date().getDay() // 0=周日, 1=周一, ..., 6=周六
    const dayOfWeek = today === 0 ? 7 : today // 转换为1-7

    // 所有课程数据
    const allCourses = {
      1: [ // 周一
        { id: 1, name: '数据结构与算法', startTime: '08:00', endTime: '09:40', location: '教A-301', teacher: '陈教授', isCurrent: false, isFinished: false },
        { id: 2, name: '计算机网络', startTime: '10:00', endTime: '11:40', location: '教B-205', teacher: '刘老师', isCurrent: false, isFinished: false },
        { id: 3, name: '高等数学(上)', startTime: '14:00', endTime: '15:40', location: '教D-201', teacher: '周教授', isCurrent: false, isFinished: false }
      ],
      2: [ // 周二
        { id: 1, name: '操作系统原理', startTime: '08:00', endTime: '09:40', location: '教A-402', teacher: '王教授', isCurrent: false, isFinished: false },
        { id: 2, name: '概率论与数理统计', startTime: '10:00', endTime: '11:40', location: '教D-301', teacher: '吴老师', isCurrent: false, isFinished: false },
        { id: 3, name: '数据库系统概论', startTime: '14:00', endTime: '15:40', location: '教C-101', teacher: '张教授', isCurrent: false, isFinished: false }
      ],
      3: [ // 周三
        { id: 1, name: '数据结构与算法', startTime: '08:00', endTime: '09:40', location: '教A-301', teacher: '王教授', isCurrent: false, isFinished: false },
        { id: 2, name: '计算机网络', startTime: '10:00', endTime: '11:40', location: '教B-205', teacher: '李教授', isCurrent: false, isFinished: false },
        { id: 3, name: '操作系统原理', startTime: '14:00', endTime: '15:40', location: '教A-401', teacher: '张教授', isCurrent: false, isFinished: false },
        { id: 4, name: '软件工程导论', startTime: '16:00', endTime: '17:40', location: '教C-102', teacher: '刘教授', isCurrent: false, isFinished: false }
      ],
      4: [ // 周四
        { id: 1, name: '线性代数', startTime: '08:00', endTime: '09:40', location: '教D-105', teacher: '吴老师', isCurrent: false, isFinished: false },
        { id: 2, name: '计算机网络', startTime: '10:00', endTime: '11:40', location: '教B-205', teacher: '刘老师', isCurrent: false, isFinished: false },
        { id: 3, name: '体育(篮球)', startTime: '14:00', endTime: '15:40', location: '体育馆', teacher: '马老师', isCurrent: false, isFinished: false }
      ],
      5: [ // 周五
        { id: 1, name: '大学英语(四)', startTime: '08:00', endTime: '09:40', location: '外语楼-201', teacher: '陈老师', isCurrent: false, isFinished: false },
        { id: 2, name: 'Web前端开发', startTime: '10:00', endTime: '11:40', location: '实验楼C-301', teacher: '李老师', isCurrent: false, isFinished: false },
        { id: 3, name: '人工智能导论', startTime: '14:00', endTime: '15:40', location: '教A-501', teacher: '赵教授', isCurrent: false, isFinished: false }
      ]
    }

    todayCourses.value = allCourses[dayOfWeek] || []

    // 更新课程状态（是否正在上课、是否已结束）
    updateCourseStatus()
  }

  // 更新课程状态
  const updateCourseStatus = () => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    todayCourses.value.forEach(course => {
      const [startHour, startMin] = course.startTime.split(':').map(Number)
      const [endHour, endMin] = course.endTime.split(':').map(Number)
      const startTime = startHour * 60 + startMin
      const endTime = endHour * 60 + endMin

      course.isFinished = currentTime > endTime
      course.isCurrent = currentTime >= startTime && currentTime <= endTime
    })
  }

  // 待办事项
  const STORAGE_KEY = 'student_todo_list'

  // 从localStorage加载待办事项
  const loadTodoList = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('加载待办事项失败:', e)
    }
    // 默认待办事项
    return [
      { id: Date.now() + 1, title: '数据结构作业 - 第五章习题', deadline: '明天 23:59', tag: '作业', tagType: 'danger', isUrgent: true, isDone: false },
      { id: Date.now() + 2, title: '计算机网络实验报告', deadline: '后天 18:00', tag: '实验', tagType: 'warning', isUrgent: false, isDone: false },
      { id: Date.now() + 3, title: '图书馆借书到期', deadline: '3天后', tag: '提醒', tagType: 'info', isUrgent: false, isDone: false },
      { id: Date.now() + 4, title: '社团活动报名', deadline: '本周五', tag: '活动', tagType: 'success', isUrgent: false, isDone: false },
      { id: Date.now() + 5, title: '英语四级备考', deadline: '持续进行', tag: '学习', tagType: 'primary', isUrgent: false, isDone: false }
    ]
  }

  const todoList = ref(loadTodoList())

  // 计算待完成任务数
  const pendingTasks = computed(() => {
    return todoList.value.filter(todo => !todo.isDone).length
  })

  // 保存到localStorage
  const saveTodoList = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todoList.value))
    } catch (e) {
      console.error('保存待办事项失败:', e)
    }
  }

  const showAddTodo = ref(false)
  const todoForm = ref({
    title: '',
    deadline: '',
    tag: '作业',
    isUrgent: false
  })

  // 标签类型映射
  const getTagType = (tag) => {
    const typeMap = {
      '作业': 'danger',
      '实验': 'warning',
      '提醒': 'info',
      '活动': 'success',
      '学习': 'primary',
      '其他': ''
    }
    return typeMap[tag] || ''
  }

  // ==================== Dashboard 数据（真实接口） ====================
  // 统计数据
  const examCount = ref(0) // 考试次数
  const skillCount = ref(0) // 技能数量
  const honorCount = ref(0) // 荣誉数量
  const avgScore = ref(0) // 平均分

  // 最近一次考试详情
  const latestExam = ref(null)

  // 最近荣誉
  const recentHonors = ref([])

  // 技能统计
  const skillSummary = ref([])

  // 心理健康
  const mentalHealth = ref(null)

  // 学习数据
  const attendanceRate = ref(96)
  const homeworkRate = ref(85)
  const weeklyStudyHours = ref(18)
  const studyProgress = computed(() => Math.min((weeklyStudyHours.value / 20) * 100, 100))

  // 快捷服务 - 使用Element Plus图标名称
  const quickServices = ref([
    { name: '食堂', icon: 'Bowl', path: '/services', gradient: 'linear-gradient(135deg, #e8a87c, #d4956a)' },
    { name: '图书馆', icon: 'Reading', path: '/services', gradient: 'linear-gradient(135deg, #85a392, #6b8f7a)' },
    { name: '成绩', icon: 'DataLine', path: '/growth', gradient: 'linear-gradient(135deg, #8b7355, #705d45)' },
    { name: '活动', icon: 'Flag', path: '/activities', gradient: 'linear-gradient(135deg, #a89078, #8d7560)' },
    { name: '校园卡', icon: 'Wallet', path: '/services', gradient: 'linear-gradient(135deg, #7a9e7e, #5f8463)' }
  ])

  // 通知消息 - 整合本地通知和默认通知
  const defaultNotifications = [
    { id: 1, title: '数据结构作业明天截止', time: '10分钟前', type: 'homework', isRead: false },
    { id: 2, title: '计算机网络课程即将开始', time: '30分钟前', type: 'course', isRead: false },
    { id: 3, title: '校园歌手大赛开始报名', time: '2小时前', type: 'activity', isRead: false },
    { id: 4, title: '图书《算法导论》已归还', time: '昨天', type: 'system', isRead: true }
  ]

  // 格式化时间为相对时间
  const formatRelativeTime = (isoTime) => {
    const now = new Date()
    const time = new Date(isoTime)
    const diff = Math.floor((now - time) / 1000)

    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    if (diff < 172800) return '昨天'
    return `${Math.floor(diff / 86400)}天前`
  }

  // 添加响应式刷新触发器
  const notificationRefreshTrigger = ref(0)

  // 从 socketStore 获取本地通知并合并
  const notifications = computed(() => {
    // 使用触发器强制重新计算
    notificationRefreshTrigger.value

    const localNotifications = socketStore.getLocalNotifications().map(n => ({
      id: n.id,
      title: n.title,
      time: formatRelativeTime(n.time),
      type: n.type,
      isRead: n.read || false
    }))

    // 合并本地通知和默认通知，本地通知优先显示
    return [...localNotifications, ...defaultNotifications].slice(0, 4)
  })

  // 未读通知数量
  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => !n.isRead).length
  })

  // 方法
  const getProgressColor = (percentage) => {
    if (percentage >= 90) return '#67c23a'
    if (percentage >= 70) return '#e6a23c'
    return '#f56c6c'
  }

  // 添加待办事项
  const addTodo = () => {
    if (!todoForm.value.title.trim()) {
      ElMessage.warning('请输入待办事项标题')
      return
    }
    if (!todoForm.value.deadline.trim()) {
      ElMessage.warning('请输入截止时间')
      return
    }

    const newTodo = {
      id: Date.now(),
      title: todoForm.value.title,
      deadline: todoForm.value.deadline,
      tag: todoForm.value.tag,
      tagType: getTagType(todoForm.value.tag),
      isUrgent: todoForm.value.isUrgent,
      isDone: false
    }

    todoList.value.unshift(newTodo)
    saveTodoList()

    ElMessage.success('待办事项添加成功！')

    // 重置表单
    todoForm.value = {
      title: '',
      deadline: '',
      tag: '作业',
      isUrgent: false
    }
    showAddTodo.value = false
  }

  // 切换待办事项完成状态
  const toggleTodo = (todo) => {
    saveTodoList()

    if (todo.isDone) {
      ElMessage.success('任务完成！继续加油！')

      // 发送通知到通知中心
      socketStore.addLocalNotification({
        type: 'system',
        title: '待办事项已完成',
        content: `您已完成待办事项：${todo.title}`,
        time: new Date().toISOString(),
        targetRole: 'student'
      })

      // 触发通知更新
      notificationRefreshTrigger.value++
    }
  }

  // 删除待办事项
  const deleteTodo = (id) => {
    const index = todoList.value.findIndex(todo => todo.id === id)
    if (index !== -1) {
      todoList.value.splice(index, 1)
      saveTodoList()
      ElMessage.success('待办事项已删除')
    }
  }

  const quickCheckin = (course) => {
    // 标记课程为已签到
    course.checkedIn = true

    ElMessage.success(`${course.name} 签到成功！`)

    const userName = userStore.user?.name || '未知用户'
    const userId = userStore.user?.id || 'unknown'

    // 只创建一个通知，学生看到"您已签到"，管理员/教师看到"学生XXX已签到"
    socketStore.addLocalNotification({
      type: 'checkin',
      title: '课程签到成功',
      content: `您已成功签到《${course.name}》课程，地点：${course.location}`,
      time: new Date().toISOString(),
      targetRole: 'student',
      sourceUserName: userName
    })
  }

  const navigateService = (service) => {
    router.push(service.path)
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
          examCount.value = data.stats.examCount || 0
          skillCount.value = data.stats.skillCount || 0
          honorCount.value = data.stats.honorCount || 0
          avgScore.value = data.stats.avgScore || 0
        }
        // 最近考试
        latestExam.value = data.latestExam || null
        // 最近荣誉
        recentHonors.value = data.recentHonors || []
        // 技能统计
        skillSummary.value = data.skillSummary || []
        // 心理健康
        mentalHealth.value = data.mentalHealth || null
      }
    } catch (e) {
      console.error('获取首页 Dashboard 数据失败:', e)
    } finally {
      loading.value = false
    }
  }

  // 监听localStorage变化，实现通知实时更新
  const handleStorageChange = (e) => {
    if (e.key === 'globalNotifications' || e.key === 'localNotifications') {
      notificationRefreshTrigger.value++
    }
  }

  // 监听自定义事件（同一页面内的通知更新）
  const handleNotificationUpdate = () => {
    notificationRefreshTrigger.value++
  }

  onMounted(() => {
    fetchDashboard()
    fetchTodayCourses()

    // 每分钟更新一次课程状态
    setInterval(updateCourseStatus, 60000)

    // 监听storage事件（跨标签页）
    window.addEventListener('storage', handleStorageChange)

    // 监听自定义事件（同一页面内）
    window.addEventListener('notificationUpdated', handleNotificationUpdate)

    // 定时刷新通知（每3秒检查一次）
    setInterval(() => {
      notificationRefreshTrigger.value++
    }, 3000)

    // 检查是否是特殊日期，显示节日问候
    const today = new Date()
    const month = today.getMonth() + 1
    const day = today.getDate()

    // 节日问候
    const holidays = {
      '1-1': '🎉 新年快乐！新的一年，愿你学业进步！',
      '5-1': '🎊 劳动节快乐！适当休息，劳逸结合！',
      '9-10': '🌹 教师节快乐！感谢老师们的辛勤付出！',
      '10-1': '🇨🇳 国庆节快乐！祝祖国繁荣昌盛！',
      '12-25': '🎄 圣诞快乐！愿你拥有美好的一天！'
    }

    const holidayKey = `${month}-${day}`
    if (holidays[holidayKey]) {
      setTimeout(() => {
        ElMessage({
          message: holidays[holidayKey],
          type: 'success',
          duration: 5000,
          showClose: true
        })
      }, 1000)
    }
  })

  return {
    loading,
    userAvatarUrl,
    userName,
    greetingText,
    currentDate,
    currentWeekday,
    weatherInfo,
    motivationQuote,
    examCount,
    honorCount,
    avgScore,
    recentHonors,
    todayCourses,
    pendingTasks,
    todoList,
    showAddTodo,
    todoForm,
    latestExam,
    skillSummary,
    mentalHealth,
    quickServices,
    notifications,
    unreadNotifications,
    quickCheckin,
    toggleTodo,
    deleteTodo,
    addTodo,
    navigateService
  }
}