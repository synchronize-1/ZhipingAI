<template>
  <div class="student-home" v-loading="loading">
    <!-- 顶部欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <div class="greeting-section">
          <div class="avatar-wrapper">
            <el-avatar :size="80" :src="userAvatarUrl" class="user-avatar">
              {{ userStore.user?.name?.charAt(0) }}
            </el-avatar>
            <div class="status-dot"></div>
          </div>
          <div class="greeting-text">
            <h1 class="greeting-title">
              <span class="wave-emoji">👋</span> {{ greetingText }}，{{ userStore.user?.name || '同学' }}
            </h1>
            <p class="greeting-subtitle">
              <el-icon><Calendar /></el-icon>
              {{ currentDate }} · {{ weatherInfo.text }} {{ weatherInfo.temp }}°C
            </p>
            <div class="motivation-quote">
              <el-icon><Sunrise /></el-icon>
              <span>{{ motivationQuote }}</span>
            </div>
          </div>
        </div>
        <div class="quick-stats">
          <div class="stat-card glass-effect">
            <div class="stat-icon bg-blue">
              <el-icon><Trophy /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ examCount }}</span>
              <span class="stat-label">考试次数</span>
            </div>
          </div>
          <div class="stat-card glass-effect">
            <div class="stat-icon bg-orange">
              <el-icon><Star /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ honorCount }}</span>
              <span class="stat-label">荣誉数量</span>
            </div>
          </div>
          <div class="stat-card glass-effect">
            <div class="stat-icon bg-green">
              <el-icon><DataLine /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ avgScore }}</span>
              <span class="stat-label">平均分数</span>
            </div>
          </div>
        </div>

        <!-- 荣誉榜 -->
        <div class="content-card honors-section">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon orange">
                <el-icon><Trophy /></el-icon>
              </div>
              <div>
                <h3>荣誉榜</h3>
                <p>最近获得的荣誉</p>
              </div>
            </div>
            <el-button type="default" round size="small" @click="$router.push('/growth')">
              全部
              <el-icon class="el-icon--right"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div v-if="recentHonors.length > 0" class="honors-list">
            <div v-for="honor in recentHonors.slice(0, 3)" :key="honor.id" class="honor-item">
              <div class="honor-icon">
                <el-icon><Star /></el-icon>
              </div>
              <div class="honor-info">
                <span class="honor-title">{{ honor.title }}</span>
                <span class="honor-meta">
                  <el-tag size="small" type="warning">{{ honor.level }}</el-tag>
                  <span class="honor-date">{{ honor.awardedAt }}</span>
                </span>
              </div>
            </div>
          </div>
          <div v-else class="empty-honor">
            <el-icon><Star /></el-icon>
            <span>暂无荣誉，继续加油！</span>
          </div>
        </div>
      </div>
      <div class="banner-decoration">
        <div class="floating-shape shape-1"></div>
        <div class="floating-shape shape-2"></div>
        <div class="floating-shape shape-3"></div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧内容 -->
      <div class="left-section">
        <!-- 今日课程卡片 -->
        <div class="content-card today-courses">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon">
                <el-icon><Calendar /></el-icon>
              </div>
              <div>
                <h3>今日课程</h3>
                <p>{{ currentWeekday }} · 共{{ todayCourses.length }}节课</p>
              </div>
            </div>
            <el-button type="default" round @click="$router.push('/my-courses')">
              查看课表
              <el-icon class="el-icon--right"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="courses-timeline" v-if="todayCourses.length > 0">
            <div 
              v-for="(course, index) in todayCourses" 
              :key="course.id"
              class="course-item"
              :class="{ 
                'is-current': course.isCurrent, 
                'is-finished': course.isFinished,
                'is-upcoming': !course.isCurrent && !course.isFinished
              }"
            >
              <div class="course-time">
                <span class="time-start">{{ course.startTime }}</span>
                <span class="time-end">{{ course.endTime }}</span>
              </div>
              <div class="course-connector">
                <div class="connector-dot" :class="{ 'pulse': course.isCurrent }"></div>
                <div class="connector-line" v-if="index < todayCourses.length - 1"></div>
              </div>
              <div class="course-info">
                <div class="course-header-row">
                  <h4>{{ course.name }}</h4>
                  <div class="course-status" v-if="course.isCurrent">
                    <el-tag type="success" effect="dark" size="small">
                      <el-icon class="is-loading"><Loading /></el-icon>
                      上课中
                    </el-tag>
                  </div>
                </div>
                <div class="course-meta">
                  <span><el-icon><Location /></el-icon> {{ course.location }}</span>
                  <span><el-icon><User /></el-icon> {{ course.teacher }}</span>
                </div>
                <div class="course-actions" v-if="!course.isFinished">
                  <el-button 
                    size="small" 
                    type="primary" 
                    plain 
                    @click="quickCheckin(course)"
                    :disabled="course.checkedIn"
                  >
                    <el-icon><Checked /></el-icon>
                    {{ course.checkedIn ? '已签到' : '签到' }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="今日没有课程，好好休息吧~" :image-size="100" />
        </div>

        <!-- 待办事项卡片 -->
        <div class="content-card todo-section">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon orange">
                <el-icon><List /></el-icon>
              </div>
              <div>
                <h3>待办事项</h3>
                <p>{{ pendingTasks }}项待完成</p>
              </div>
            </div>
            <el-button type="default" round size="small" @click="showAddTodo = true">
              <el-icon><Plus /></el-icon>
              添加
            </el-button>
          </div>
          <div class="todo-list">
            <div 
              v-for="todo in todoList" 
              :key="todo.id"
              class="todo-item"
              :class="{ 'is-urgent': todo.isUrgent, 'is-done': todo.isDone }"
            >
              <el-checkbox v-model="todo.isDone" @change="toggleTodo(todo)" />
              <div class="todo-content">
                <span class="todo-title">{{ todo.title }}</span>
                <span class="todo-deadline">
                  <el-icon><Clock /></el-icon>
                  {{ todo.deadline }}
                </span>
              </div>
              <el-tag :type="todo.tagType" size="small">{{ todo.tag }}</el-tag>
              <el-button 
                v-if="todo.isDone" 
                type="danger" 
                size="small" 
                text
                @click="deleteTodo(todo.id)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="right-section">
        <!-- 最近考试卡片 -->
        <div class="content-card latest-exam">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon green">
                <el-icon><Trophy /></el-icon>
              </div>
              <div>
                <h3>最近考试</h3>
                <p>{{ latestExam ? latestExam.examDate : '暂无考试' }}</p>
              </div>
            </div>
            <el-button type="default" round size="small" @click="$router.push('/growth')">
              查看详情
              <el-icon class="el-icon--right"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <template v-if="latestExam">
            <div class="exam-overview">
              <div class="exam-name">{{ latestExam.examName }}</div>
              <div class="exam-scores">
                <div class="score-item">
                  <span class="score-value">{{ latestExam.totalScore }}</span>
                  <span class="score-label">总分</span>
                </div>
                <div class="score-item">
                  <span class="score-value">{{ latestExam.classRank }}</span>
                  <span class="score-label">班级排名</span>
                </div>
                <div class="score-item">
                  <span class="score-value">{{ latestExam.gradeRank }}</span>
                  <span class="score-label">年级排名</span>
                </div>
              </div>
            </div>
            <div v-if="latestExam.subjects && latestExam.subjects.length > 0" class="subject-scores">
              <div v-for="subject in latestExam.subjects.slice(0, 4)" :key="subject.subjectId" class="subject-item">
                <span class="subject-name">{{ subject.subjectName }}</span>
                <div class="subject-score-info">
                  <span class="subject-score">{{ subject.score }}<em>/{{ subject.fullScore }}</em></span>
                  <el-tag size="small" :type="subject.scoreLevel === '优秀' ? 'success' : subject.scoreLevel === '良好' ? 'primary' : 'warning'">
                    {{ subject.scoreLevel }}
                  </el-tag>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="empty-honor">
            <el-icon><Trophy /></el-icon>
            <span>暂无考试数据</span>
          </div>
        </div>

        <!-- 技能与成长 -->
        <div class="content-card skill-growth">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon purple">
                <el-icon><DataAnalysis /></el-icon>
              </div>
              <div>
                <h3>技能与成长</h3>
                <p>技能统计 & 心理健康</p>
              </div>
            </div>
            <el-button type="default" round size="small" @click="$router.push('/growth')">
              详情
              <el-icon class="el-icon--right"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <!-- 技能统计 -->
          <div class="skill-section">
            <div class="section-title">技能统计</div>
            <div v-if="skillSummary.length > 0" class="skill-list">
              <div v-for="(skill, index) in skillSummary.slice(0, 4)" :key="index" class="skill-item">
                <span class="skill-category">{{ skill.category }}</span>
                <div class="skill-info">
                  <span class="skill-count">{{ skill.count }}项</span>
                  <span class="skill-level">Lv.{{ skill.avgLevel }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-skill">
              <span>暂无技能数据</span>
            </div>
          </div>
          <!-- 心理健康 -->
          <div class="mental-section">
            <div class="section-title">心理状态</div>
            <template v-if="mentalHealth">
              <div class="mental-overview">
                <div class="mental-score">
                  <span class="score-num">{{ mentalHealth.overallScore }}</span>
                  <span class="score-label">心理健康指数</span>
                </div>
                <div class="mental-info">
                  <el-tag :type="mentalHealth.stressLevel === '正常' ? 'success' : mentalHealth.stressLevel === '轻度' ? 'warning' : 'danger'" size="small">
                    压力：{{ mentalHealth.stressLevel }}
                  </el-tag>
                  <span class="mental-date">评估于 {{ mentalHealth.latestDate }}</span>
                  <span class="mental-trend">趋势：{{ mentalHealth.trend }}</span>
                </div>
              </div>
            </template>
            <div v-else class="empty-skill">
              <span>暂无心理评估数据</span>
            </div>
          </div>
        </div>

        <!-- 快捷服务卡片 -->
        <div class="content-card quick-services">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon purple">
                <el-icon><Grid /></el-icon>
              </div>
              <div>
                <h3>快捷服务</h3>
                <p>常用功能入口</p>
              </div>
            </div>
          </div>
          <div class="services-grid">
            <div 
              v-for="service in quickServices" 
              :key="service.name"
              class="service-item"
              @click="navigateService(service)"
            >
              <div class="service-icon" :style="{ background: service.gradient }">
                <el-icon :size="24"><component :is="service.icon" /></el-icon>
              </div>
              <span class="service-name">{{ service.name }}</span>
            </div>
          </div>
        </div>

        <!-- 通知消息卡片 -->
        <div class="content-card notifications">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon red">
                <el-icon><Bell /></el-icon>
              </div>
              <div>
                <h3>通知消息</h3>
                <p>{{ unreadNotifications }}条未读</p>
              </div>
            </div>
            <el-button type="default" round size="small" @click="$router.push('/notifications')">
              全部
              <el-icon class="el-icon--right"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="notification-list">
            <div 
              v-for="notification in notifications" 
              :key="notification.id"
              class="notification-item"
              :class="{ 'is-unread': !notification.isRead }"
            >
              <div class="notification-icon" :class="notification.type">
                <el-icon v-if="notification.type === 'course'"><Reading /></el-icon>
                <el-icon v-else-if="notification.type === 'homework'"><Document /></el-icon>
                <el-icon v-else-if="notification.type === 'activity'"><Flag /></el-icon>
                <el-icon v-else><Bell /></el-icon>
              </div>
              <div class="notification-content">
                <p class="notification-title">{{ notification.title }}</p>
                <span class="notification-time">{{ notification.time }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加待办事项对话框 -->
    <el-dialog 
      v-model="showAddTodo" 
      title="添加待办事项" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="todoForm" label-width="80px">
        <el-form-item label="标题" required>
          <el-input 
            v-model="todoForm.title" 
            placeholder="请输入待办事项标题"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="截止时间" required>
          <el-input 
            v-model="todoForm.deadline" 
            placeholder="例如：明天 18:00、本周五"
          />
        </el-form-item>
        <el-form-item label="标签" required>
          <el-select v-model="todoForm.tag" placeholder="请选择标签">
            <el-option label="作业" value="作业" />
            <el-option label="实验" value="实验" />
            <el-option label="提醒" value="提醒" />
            <el-option label="活动" value="活动" />
            <el-option label="学习" value="学习" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="todoForm.isUrgent">
            <el-radio :label="false">普通</el-radio>
            <el-radio :label="true">紧急</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddTodo = false">取消</el-button>
          <el-button type="primary" @click="addTodo">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- AI智能助手悬浮按钮 -->
    <AIAssistantFloat />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useSocketStore } from '@/stores/socket'
import { ElMessage } from 'element-plus'
import { homeAPI } from '@/api/home'
import { 
  Calendar, Reading, Document, TrendCharts, Location, User, 
  ArrowRight, List, Plus, Clock, DataAnalysis, Grid, Bell, 
  Flag, Checked, Loading, Sunrise, Bowl, SetUp, DataLine, Wallet, Delete,
  Trophy, Star
} from '@element-plus/icons-vue'
import AIAssistantFloat from '@/components/AIAssistantFloat.vue'

defineOptions({ name: 'StudentHome' })

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
</script>

<style scoped>
.student-home {
  min-height: 100vh;
  background: linear-gradient(135deg, #faf8f5 0%, #f5f0e8 100%);
}

/* 欢迎横幅 */
.welcome-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #a78bfa 100%);
  border-radius: 0 0 32px 32px;
  padding: 24px 32px;
  position: relative;
  overflow: hidden;
  margin: -24px -24px 24px -24px;
  max-width: 100%;
  box-sizing: border-box;
}

.welcome-content {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}

.greeting-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-wrapper {
  position: relative;
}

.user-avatar {
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.status-dot {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  background: #67c23a;
  border: 3px solid white;
  border-radius: 50%;
}

.greeting-text {
  color: white;
}

.greeting-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.wave-emoji {
  animation: wave 2s ease-in-out infinite;
  display: inline-block;
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(20deg); }
  75% { transform: rotate(-20deg); }
}

.greeting-subtitle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  opacity: 0.9;
  margin: 0 0 8px 0;
}

.motivation-quote {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  opacity: 0.85;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.quick-stats {
  display: flex;
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 16px;
  min-width: 140px;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.stat-icon.bg-blue { background: rgba(59, 130, 246, 0.8); }
.stat-icon.bg-orange { background: rgba(249, 115, 22, 0.8); }
.stat-icon.bg-green { background: rgba(34, 197, 94, 0.8); }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.banner-decoration {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 200px;
  height: 200px;
  top: -50px;
  right: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  bottom: -30px;
  right: 30%;
  animation-delay: 2s;
}

.shape-3 {
  width: 100px;
  height: 100px;
  top: 20%;
  right: 5%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(10deg); }
}

/* 主内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
  padding: 0 24px 24px;
}

.left-section, .right-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 内容卡片 */
.content-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 20px;
}

.header-icon.orange { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.header-icon.green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
.header-icon.purple { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.header-icon.red { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%); }

.header-left h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.header-left p {
  margin: 2px 0 0 0;
  font-size: 13px;
  color: #6b7280;
}

/* 今日课程时间线 */
.courses-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.course-item {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  transition: all 0.3s;
}

.course-item.is-current {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  margin: 0 -24px;
  padding: 16px 24px;
  border-radius: 16px;
}

.course-item.is-finished {
  opacity: 0.5;
}

.course-time {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 50px;
}

.time-start {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

.time-end {
  font-size: 12px;
  color: #9ca3af;
}

.course-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
}

.connector-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #d1d5db;
  flex-shrink: 0;
}

.course-item.is-current .connector-dot {
  background: #667eea;
}

.connector-dot.pulse {
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(102, 126, 234, 0); }
}

.connector-line {
  flex: 1;
  width: 2px;
  background: #e5e7eb;
  margin: 4px 0;
}

.course-info {
  flex: 1;
}

.course-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.course-info h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

.course-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.course-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.course-status {
  display: inline-flex;
  align-items: center;
}

.course-status .el-tag {
  white-space: nowrap;
  overflow: visible;
}

.course-actions {
  margin-top: 8px;
}

.course-actions .el-button {
  font-weight: 500;
  background: #fff !important;
  color: #409eff !important;
  border: 1px solid #409eff !important;
}

.course-actions .el-button:hover {
  background: #ecf5ff !important;
  color: #409eff !important;
}

/* 待办事项 */
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #f9fafb;
  border-radius: 12px;
  transition: all 0.3s;
}

.todo-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.todo-item.is-urgent {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%);
  border-left: 3px solid #ef4444;
}

.todo-item.is-done {
  opacity: 0.5;
}

.todo-item.is-done .todo-title {
  text-decoration: line-through;
}

.todo-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.todo-title {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
}

.todo-deadline {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9ca3af;
}

/* 学习数据 */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  justify-content: center;
}

.percentage-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
}

.percentage-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
}

.study-hours {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
}

.hours-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  color: #6b7280;
}

.hours-value {
  font-weight: 600;
  color: #1a1a2e;
}

.hours-comparison {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.text-green { color: #10b981; }
.text-orange { color: #f59e0b; }

/* 快捷服务 */
.services-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.service-item:hover {
  background: #f9fafb;
  transform: translateY(-4px);
}

.service-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.service-name {
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
}

/* 通知消息 */
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.3s;
  cursor: pointer;
}

.notification-item:hover {
  background: #f9fafb;
}

.notification-item.is-unread {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.06) 0%, rgba(118, 75, 162, 0.06) 100%);
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.notification-icon.course { background: #dbeafe; color: #3b82f6; }
.notification-icon.homework { background: #fee2e2; color: #ef4444; }
.notification-icon.activity { background: #d1fae5; color: #10b981; }
.notification-icon.system { background: #f3f4f6; color: #6b7280; }

.notification-content {
  flex: 1;
}

.notification-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
}

.notification-time {
  font-size: 12px;
  color: #9ca3af;
}

/* 荣誉榜 */
.honors-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.honor-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%);
  border-radius: 12px;
  transition: all 0.3s;
}

.honor-item:hover {
  transform: translateX(4px);
}

.honor-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.honor-info {
  flex: 1;
  min-width: 0;
}

.honor-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.honor-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.honor-date {
  font-size: 11px;
  color: #9ca3af;
}

.empty-honor {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #9ca3af;
  font-size: 13px;
}

.empty-honor .el-icon {
  font-size: 32px;
  color: #d1d5db;
}

/* 最近考试 */
.exam-overview {
  text-align: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.exam-name {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 16px;
}

.exam-scores {
  display: flex;
  justify-content: space-around;
}

.score-item {
  text-align: center;
}

.score-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 4px;
}

.score-label {
  font-size: 12px;
  color: #6b7280;
}

.subject-scores {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.subject-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.subject-name {
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
}

.subject-score-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subject-score {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.subject-score em {
  font-style: normal;
  font-size: 11px;
  color: #9ca3af;
  font-weight: 400;
}

/* 技能与成长 */
.skill-section, .mental-section {
  margin-bottom: 16px;
}

.skill-section:last-child, .mental-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #667eea;
}

.skill-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.skill-category {
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
}

.skill-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.skill-count {
  color: #6b7280;
}

.skill-level {
  color: #667eea;
  font-weight: 600;
}

.empty-skill {
  text-align: center;
  padding: 16px;
  color: #9ca3af;
  font-size: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.mental-overview {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 10px;
}

.mental-score {
  text-align: center;
  min-width: 80px;
}

.mental-score .score-num {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #10b981;
  line-height: 1;
}

.mental-score .score-label {
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
}

.mental-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.mental-date, .mental-trend {
  font-size: 11px;
  color: #9ca3af;
}

/* 响应式 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .quick-stats {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .welcome-banner {
    padding: 20px;
  }
  
  .greeting-section {
    flex-direction: column;
    text-align: center;
  }
  
  .greeting-title {
    font-size: 22px;
  }
  
  .quick-stats {
    justify-content: center;
  }
  
  .stat-card {
    min-width: 120px;
    padding: 12px 16px;
  }
  
  .services-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
