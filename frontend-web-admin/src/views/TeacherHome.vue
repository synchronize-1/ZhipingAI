<template>
  <div class="teacher-home" v-loading="loading">
    <!-- 顶部欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <div class="greeting-section">
          <div class="avatar-wrapper">
            <el-avatar :size="80" :src="userAvatarUrl" class="user-avatar">
              {{ userStore.user?.name?.charAt(0) }}
            </el-avatar>
            <div class="role-badge">👨‍🏫</div>
          </div>
          <div class="greeting-text">
            <h1 class="greeting-title">
              {{ greetingText }}，{{ userStore.user?.name || '老师' }}
            </h1>
            <p class="greeting-subtitle">
              <el-icon><Calendar /></el-icon>
              {{ currentDate }} · {{ currentWeekday }}
            </p>
            <div class="teacher-info">
              <el-tag effect="dark" type="info">{{ userStore.user?.department || '计算机学院' }}</el-tag>
              <el-tag effect="plain">工号: {{ userStore.user?.employeeId || 'T2020001' }}</el-tag>
            </div>
          </div>
        </div>
        <div class="quick-stats">
          <div class="stat-card glass-effect">
            <div class="stat-icon bg-blue">
              <el-icon><School /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ classCount }}</span>
              <span class="stat-label">任教班级</span>
            </div>
          </div>
          <div class="stat-card glass-effect">
            <div class="stat-icon bg-orange">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ totalStudents }}</span>
              <span class="stat-label">学生总数</span>
            </div>
          </div>
          <div class="stat-card glass-effect">
            <div class="stat-icon bg-green">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ pendingHomework }}</span>
              <span class="stat-label">待批作业</span>
            </div>
          </div>
          <div class="stat-card glass-effect">
            <div class="stat-icon bg-purple">
              <el-icon><Star /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ examCount }}</span>
              <span class="stat-label">考试总数</span>
            </div>
          </div>
        </div>
      </div>
      <div class="banner-pattern"></div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧内容 -->
      <div class="left-section">
        <!-- 今日授课卡片 -->
        <div class="content-card today-classes">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon">
                <el-icon><Calendar /></el-icon>
              </div>
              <div>
                <h3>今日授课安排</h3>
                <p>共{{ todayClassList.length }}节课 · {{ totalStudentsToday }}名学生</p>
              </div>
            </div>
            <el-button type="primary" text @click="$router.push('/courses')">
              课程管理
              <el-icon class="el-icon--right"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="classes-list">
            <div 
              v-for="(classItem, index) in todayClassList" 
              :key="classItem.id"
              class="class-card"
              :class="{ 'is-current': classItem.isCurrent, 'is-finished': classItem.isFinished }"
            >
              <div class="class-time-badge" :class="classItem.isCurrent ? 'active' : ''">
                <span class="time">{{ classItem.startTime }}</span>
                <span class="period">第{{ index + 1 }}节</span>
              </div>
              <div class="class-main">
                <div class="class-info">
                  <h4>{{ classItem.name }}</h4>
                  <div class="class-meta">
                    <span><el-icon><Location /></el-icon> {{ classItem.location }}</span>
                    <span><el-icon><User /></el-icon> {{ classItem.studentCount }}人</span>
                  </div>
                </div>
                <div class="class-attendance">
                  <div class="attendance-ring">
                    <el-progress 
                      type="circle" 
                      :percentage="classItem.attendanceRate" 
                      :width="56"
                      :stroke-width="4"
                      :color="getAttendanceColor(classItem.attendanceRate)"
                    />
                  </div>
                  <span class="attendance-label">出勤率</span>
                </div>
              </div>
              <div class="class-actions">
                <el-button size="small" type="primary" plain @click="startCheckin(classItem)">
                  <el-icon><Checked /></el-icon>
                  发起签到
                </el-button>
                <el-button size="small" @click="viewClassDetail(classItem)">
                  <el-icon><View /></el-icon>
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 教学数据分析 -->
        <div class="content-card teaching-analytics">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon green">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div>
                <h3>教学数据分析</h3>
                <p>本学期教学概览</p>
              </div>
            </div>
            <el-radio-group v-model="analyticsView" size="small">
              <el-radio-button label="week">本周</el-radio-button>
              <el-radio-button label="month">本月</el-radio-button>
              <el-radio-button label="semester">学期</el-radio-button>
            </el-radio-group>
          </div>
          <div class="analytics-grid">
            <div class="analytics-item">
              <div class="analytics-icon blue">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="analytics-data">
                <span class="value">{{ teachingHours }}</span>
                <span class="label">授课时长</span>
              </div>
              <div class="analytics-trend up">
                <el-icon><Top /></el-icon>
                <span>+12%</span>
              </div>
            </div>
            <div class="analytics-item">
              <div class="analytics-icon green">
                <el-icon><Checked /></el-icon>
              </div>
              <div class="analytics-data">
                <span class="value">{{ avgAttendance }}%</span>
                <span class="label">平均出勤</span>
              </div>
              <div class="analytics-trend up">
                <el-icon><Top /></el-icon>
                <span>+3%</span>
              </div>
            </div>
            <div class="analytics-item">
              <div class="analytics-icon orange">
                <el-icon><Star /></el-icon>
              </div>
              <div class="analytics-data">
                <span class="value">{{ courseRating }}</span>
                <span class="label">课程评分</span>
              </div>
              <div class="analytics-trend up">
                <el-icon><Top /></el-icon>
                <span>+0.2</span>
              </div>
            </div>
            <div class="analytics-item">
              <div class="analytics-icon purple">
                <el-icon><ChatDotRound /></el-icon>
              </div>
              <div class="analytics-data">
                <span class="value">{{ interactionCount }}</span>
                <span class="label">课堂互动</span>
              </div>
              <div class="analytics-trend down">
                <el-icon><Bottom /></el-icon>
                <span>-5%</span>
              </div>
            </div>
          </div>
          <div class="chart-container" ref="attendanceChartRef"></div>
        </div>

        <!-- 我的班级 -->
        <div class="content-card my-classes">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon blue">
                <el-icon><School /></el-icon>
              </div>
              <div>
                <h3>我的班级</h3>
                <p>共 {{ myClasses.length }} 个班级</p>
              </div>
            </div>
            <el-button type="primary" text @click="$router.push('/teaching/class-manage')">
              全部
              <el-icon class="el-icon--right"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div v-if="myClasses.length > 0" class="classes-grid">
            <div v-for="cls in myClasses" :key="cls.classId" class="class-card-item">
              <div class="class-card-header">
                <span class="class-name">{{ cls.className }}</span>
                <el-tag size="small" type="info">{{ cls.grade }}</el-tag>
              </div>
              <div class="class-card-body">
                <span class="class-student-count">{{ cls.studentCount }} 名学生</span>
                <span class="class-head-teacher">班主任：{{ cls.headTeacherName || '—' }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-todo">
            <el-icon><SuccessFilled /></el-icon>
            <span>暂无班级数据</span>
          </div>
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="right-section">
        <!-- 待办事项 -->
        <div class="content-card todo-section">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon orange">
                <el-icon><List /></el-icon>
              </div>
              <div>
                <h3>待办事项</h3>
                <p>{{ pendingTodos }}项待处理</p>
              </div>
            </div>
          </div>
          <div class="todo-list">
            <div 
              v-for="todo in todoList" 
              :key="todo.id"
              class="todo-item"
              :class="{ 'is-urgent': todo.priority === 'high' }"
            >
              <div class="todo-priority" :class="todo.priority"></div>
              <div class="todo-content">
                <span class="todo-title">{{ todo.title }}</span>
                <span class="todo-meta">
                  <el-icon><Clock /></el-icon>
                  {{ todo.deadline }}
                </span>
              </div>
              <el-button size="small" plain @click="handleTodo(todo)">
                处理
              </el-button>
            </div>
            <div v-if="todoList.length === 0" class="empty-todo">
              <el-icon><SuccessFilled /></el-icon>
              <span>暂无待办事项</span>
            </div>
          </div>
        </div>

        <!-- 学生提问 -->
        <div class="content-card questions-section">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon purple">
                <el-icon><ChatDotRound /></el-icon>
              </div>
              <div>
                <h3>学生提问</h3>
                <p>{{ pendingQuestions }}条待回复</p>
              </div>
            </div>
            <el-button type="primary" text @click="$router.push('/courses')">
              全部
              <el-icon class="el-icon--right"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="questions-list">
            <div v-for="question in studentQuestions" :key="question.id" class="question-item">
              <el-avatar :size="36" :src="question.avatar">{{ question.studentName.charAt(0) }}</el-avatar>
              <div class="question-content">
                <div class="question-header">
                  <span class="student-name">{{ question.studentName }}</span>
                  <el-tag size="small">{{ question.courseName }}</el-tag>
                </div>
                <p class="question-text">{{ question.content }}</p>
                <span class="question-time">{{ question.time }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近考试 -->
        <div class="content-card recent-exams">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon orange">
                <el-icon><Star /></el-icon>
              </div>
              <div>
                <h3>最近考试</h3>
                <p>共 {{ recentExams.length }} 场</p>
              </div>
            </div>
            <el-button type="primary" text @click="$router.push('/teaching/exam-list')">
              全部
              <el-icon class="el-icon--right"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div v-if="recentExams.length > 0" class="exams-list">
            <div v-for="exam in recentExams" :key="exam.id" class="exam-item">
              <div class="exam-info">
                <span class="exam-name">{{ exam.name }}</span>
                <div class="exam-meta">
                  <span class="exam-date">{{ exam.examDate }}</span>
                  <span class="exam-class">{{ exam.classCount }}个班级</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-todo">
            <el-icon><SuccessFilled /></el-icon>
            <span>暂无考试安排</span>
          </div>
        </div>

        <!-- 快捷功能 -->
        <div class="content-card quick-actions">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon blue">
                <el-icon><Grid /></el-icon>
              </div>
              <div>
                <h3>快捷功能</h3>
                <p>常用操作入口</p>
              </div>
            </div>
          </div>
          <div class="actions-grid">
            <div v-for="action in quickActions" :key="action.name" class="action-item" @click="handleAction(action)">
              <div class="action-icon" :style="{ background: action.gradient }">
                <span>{{ action.icon }}</span>
              </div>
              <span class="action-name">{{ action.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 签到弹窗 -->
    <el-dialog v-model="showCheckinDialog" title="发起课堂签到" width="500px">
      <div class="checkin-dialog-content">
        <div class="checkin-info">
          <p><strong>课程：</strong>{{ currentCheckinClass?.name }}</p>
          <p><strong>教室：</strong>{{ currentCheckinClass?.location }}</p>
          <p><strong>学生人数：</strong>{{ currentCheckinClass?.studentCount }}人</p>
        </div>
        <el-form label-width="100px" class="mt-4">
          <el-form-item label="签到时长">
            <el-select v-model="checkinDuration" style="width: 100%">
              <el-option label="1分钟" :value="60" />
              <el-option label="2分钟" :value="120" />
              <el-option label="3分钟" :value="180" />
              <el-option label="5分钟" :value="300" />
            </el-select>
          </el-form-item>
          <el-form-item label="签到方式">
            <el-radio-group v-model="checkinMethod">
              <el-radio label="code">签到码</el-radio>
              <el-radio label="location">定位签到</el-radio>
              <el-radio label="qrcode">扫码签到</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <div v-if="checkinStarted" class="checkin-status">
          <el-progress :percentage="checkinProgress" :format="() => checkinCountdown + 's'" />
          <p class="text-center mt-2">已签到：{{ checkedInCount }}/{{ currentCheckinClass?.studentCount }}人</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showCheckinDialog = false">取消</el-button>
        <el-button v-if="!checkinStarted" type="primary" @click="confirmStartCheckin">开始签到</el-button>
        <el-button v-else type="danger" @click="endCheckinSession">结束签到</el-button>
      </template>
    </el-dialog>

    <!-- 待办事项详情弹窗 -->
    <el-dialog v-model="showTodoDialog" :title="currentTodo?.title" width="600px">
      <div class="todo-dialog-content">
        <template v-if="currentTodo?.id === 1">
          <h4>待批改作业列表</h4>
          <el-table :data="homeworkList" stripe style="width: 100%">
            <el-table-column prop="studentName" label="学生" width="100" />
            <el-table-column prop="submitTime" label="提交时间" width="160" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === '已批改' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="gradeHomework(row)" :disabled="row.status === '已批改'">批改</el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
        <template v-else-if="currentTodo?.id === 2">
          <h4>待回复学生提问</h4>
          <div v-for="q in studentQuestions" :key="q.id" class="question-reply-item">
            <div class="question-info">
              <strong>{{ q.studentName }}</strong> - {{ q.courseName }}
              <p>{{ q.content }}</p>
            </div>
            <el-input v-model="q.reply" type="textarea" :rows="2" placeholder="输入回复..." />
            <el-button type="primary" size="small" class="mt-2" @click="replyQuestion(q)">回复</el-button>
          </div>
        </template>
        <template v-else>
          <p><strong>截止时间：</strong>{{ currentTodo?.deadline }}</p>
          <p><strong>优先级：</strong>{{ currentTodo?.priority === 'high' ? '高' : currentTodo?.priority === 'medium' ? '中' : '低' }}</p>
          <el-button type="primary" @click="completeTodo">标记完成</el-button>
        </template>
      </div>
    </el-dialog>

    <!-- 发布作业弹窗 -->
    <el-dialog v-model="showHomeworkDialog" title="发布作业" width="600px">
      <el-form :model="homeworkForm" label-width="100px">
        <el-form-item label="选择课程">
          <el-select v-model="homeworkForm.courseId" style="width: 100%">
            <el-option v-for="c in todayClassList" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="作业标题">
          <el-input v-model="homeworkForm.title" placeholder="请输入作业标题" />
        </el-form-item>
        <el-form-item label="作业内容">
          <el-input v-model="homeworkForm.content" type="textarea" :rows="4" placeholder="请输入作业要求" />
        </el-form-item>
        <el-form-item label="截止时间">
          <el-date-picker v-model="homeworkForm.deadline" type="datetime" placeholder="选择截止时间" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showHomeworkDialog = false">取消</el-button>
        <el-button type="primary" @click="submitHomework">发布</el-button>
      </template>
    </el-dialog>

    <!-- 批改作业弹窗 -->
    <el-dialog v-model="showGradeDialog" title="批改作业" width="600px">
      <div v-if="currentGradeHomework">
        <p><strong>学生：</strong>{{ currentGradeHomework.studentName }}</p>
        <p><strong>提交时间：</strong>{{ currentGradeHomework.submitTime }}</p>
        <div class="homework-content-box">
          <p><strong>作业内容：</strong></p>
          <div class="content-preview">{{ currentGradeHomework.content || '学生提交的作业内容...' }}</div>
        </div>
        <el-form label-width="80px" class="mt-4">
          <el-form-item label="评分">
            <el-input-number v-model="gradeForm.score" :min="0" :max="100" />
          </el-form-item>
          <el-form-item label="评语">
            <el-input v-model="gradeForm.comment" type="textarea" :rows="3" placeholder="请输入评语" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showGradeDialog = false">取消</el-button>
        <el-button type="primary" @click="submitGrade">提交评分</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useSocketStore } from '@/stores/socket'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { homeAPI } from '@/api/home'
import { 
  Calendar, Reading, Document, User, Location, ArrowRight, 
  List, Clock, TrendCharts, Grid, Checked, View, Star, 
  ChatDotRound, Top, Bottom, School
} from '@element-plus/icons-vue'

defineOptions({ name: 'TeacherHome' })

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

// 快捷功能
const quickActions = ref([
  { name: '发布作业', icon: '📝', path: '/courses', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { name: '批改作业', icon: '✅', path: '/courses', gradient: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  { name: '发起签到', icon: '📍', path: '/attendance', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { name: '成绩录入', icon: '📊', path: '/courses', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { name: '学生管理', icon: '👥', path: '/users', gradient: 'linear-gradient(135deg, #fa709a, #fee140)' },
  { name: '课程资料', icon: '📚', path: '/courses', gradient: 'linear-gradient(135deg, #a8edea, #fed6e3)' }
])

const attendanceChartRef = ref(null)

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

const getAttendanceColor = (rate) => {
  if (rate >= 90) return '#10b981'
  if (rate >= 80) return '#f59e0b'
  return '#ef4444'
}

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
  pendingQuestions.value--
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
</script>

<style scoped>
.teacher-home {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%);
}

/* 欢迎横幅 */
.welcome-banner {
  background: linear-gradient(135deg, #1a365d 0%, #2c5282 50%, #2b6cb0 100%);
  border-radius: 0 0 32px 32px;
  padding: 32px;
  position: relative;
  overflow: hidden;
  margin: -24px -24px 24px -24px;
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

.role-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.greeting-text {
  color: white;
}

.greeting-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.greeting-subtitle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  opacity: 0.9;
  margin: 0 0 12px 0;
}

.teacher-info {
  display: flex;
  gap: 8px;
}

.quick-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 16px;
  min-width: 130px;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
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
.stat-icon.bg-purple { background: rgba(139, 92, 246, 0.8); }

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

.banner-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

/* 主内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
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
  background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
  color: white;
  font-size: 20px;
}

.header-icon.orange { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.header-icon.green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
.header-icon.purple { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.header-icon.blue { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }

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

/* 今日课程卡片 */
.classes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.class-card {
  background: #f9fafb;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.class-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.class-card.is-current {
  background: linear-gradient(135deg, rgba(26, 54, 93, 0.08) 0%, rgba(44, 82, 130, 0.08) 100%);
  border-color: #2c5282;
}

.class-card.is-finished {
  opacity: 0.6;
}

.class-time-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  background: #e5e7eb;
  padding: 8px 16px;
  border-radius: 10px;
  width: fit-content;
}

.class-time-badge.active {
  background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
  color: white;
}

.class-time-badge .time {
  font-size: 16px;
  font-weight: 700;
}

.class-time-badge .period {
  font-size: 11px;
  opacity: 0.8;
}

.class-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.class-info h4 {
  margin: 0 0 8px 0;
  font-size: 17px;
  font-weight: 600;
  color: #1a1a2e;
}

.class-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #6b7280;
}

.class-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.class-attendance {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.attendance-label {
  font-size: 11px;
  color: #6b7280;
}

.class-actions {
  display: flex;
  gap: 8px;
}

/* 教学分析 */
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.analytics-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
}

.analytics-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.analytics-icon.blue { background: linear-gradient(135deg, #667eea, #764ba2); }
.analytics-icon.green { background: linear-gradient(135deg, #11998e, #38ef7d); }
.analytics-icon.orange { background: linear-gradient(135deg, #f093fb, #f5576c); }
.analytics-icon.purple { background: linear-gradient(135deg, #a8edea, #fed6e3); color: #1a1a2e; }

.analytics-data {
  flex: 1;
}

.analytics-data .value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
}

.analytics-data .label {
  font-size: 12px;
  color: #6b7280;
}

.analytics-trend {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 500;
}

.analytics-trend.up { color: #10b981; }
.analytics-trend.down { color: #ef4444; }

.chart-container {
  height: 200px;
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
}

.todo-item.is-urgent {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%);
}

.todo-priority {
  width: 4px;
  height: 32px;
  border-radius: 2px;
}

.todo-priority.high { background: #ef4444; }
.todo-priority.medium { background: #f59e0b; }
.todo-priority.low { background: #10b981; }

.todo-content {
  flex: 1;
}

.todo-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9ca3af;
}

/* 修复按钮样式 - 白底蓝字 */
.class-actions .el-button--primary,
.todo-item .el-button {
  background: #fff !important;
  color: #409eff !important;
  border: 1px solid #409eff !important;
}

.class-actions .el-button--primary:hover,
.todo-item .el-button:hover {
  background: #ecf5ff !important;
  color: #409eff !important;
}

/* 学生提问 */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
}

.question-content {
  flex: 1;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.student-name {
  font-weight: 600;
  color: #1a1a2e;
}

.question-text {
  margin: 0;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
}

.question-time {
  font-size: 12px;
  color: #9ca3af;
}

/* 快捷功能 */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-item:hover {
  background: #f9fafb;
  transform: translateY(-4px);
}

.action-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-name {
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
}

/* 空状态 */
.empty-todo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px;
  color: #9ca3af;
  font-size: 13px;
}

/* 最近考试 */
.exams-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.exam-item {
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 12px;
  transition: all 0.2s;
}

.exam-item:hover {
  background: #f3f4f6;
}

.exam-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.exam-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.exam-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

/* 我的班级 */
.classes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.class-card-item {
  background: #f9fafb;
  border-radius: 12px;
  padding: 14px;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.class-card-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.class-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.class-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.class-card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.class-student-count {
  font-weight: 500;
  color: #4b5563;
}

/* 响应式 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .analytics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .quick-stats {
    justify-content: center;
  }
  
  .analytics-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
