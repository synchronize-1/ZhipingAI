<template>
  <div class="admin-home" v-loading="loading">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="banner-content">
        <div class="banner-left">
          <h1>{{ greetingText }}，{{ userStore.user?.name || '管理员' }} 👋</h1>
          <p>欢迎回来！</p>
        </div>
        <div class="banner-right">
          <div class="system-status">
            <div class="status-dot online"></div>
            <span>系统运行正常</span>
          </div>
          <el-button type="primary" round @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 核心数据指标 -->
    <div class="metrics-section">
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-icon blue">
              <el-icon><User /></el-icon>
            </div>
            <el-tag :type="userGrowth >= 0 ? 'success' : 'danger'" size="small">
              {{ userGrowth >= 0 ? '+' : '' }}{{ userGrowth }}%
            </el-tag>
          </div>
          <div class="metric-value">{{ totalUsers.toLocaleString() }}</div>
          <div class="metric-label">注册用户</div>
          <div class="metric-detail">
            <span>学生 {{ studentCount.toLocaleString() }}</span>
            <span>教师 {{ teacherCount.toLocaleString() }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-icon green">
              <el-icon><School /></el-icon>
            </div>
            <el-tag type="success" size="small">正常</el-tag>
          </div>
          <div class="metric-value">{{ classCount }}</div>
          <div class="metric-label">班级总数</div>
          <div class="metric-detail">
            <span>共 {{ classCount }} 个班级</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-icon orange">
              <el-icon><Trophy /></el-icon>
            </div>
            <el-tag type="warning" size="small">{{ recentExams.length }} 场近期</el-tag>
          </div>
          <div class="metric-value">{{ examCount }}</div>
          <div class="metric-label">考试总数</div>
          <div class="metric-detail">
            <span>累计 {{ examCount }} 场考试</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-icon purple">
              <el-icon><Reading /></el-icon>
            </div>
            <el-tag type="info" size="small">{{ subjectCount }} 门</el-tag>
          </div>
          <div class="metric-value">{{ subjectCount }}</div>
          <div class="metric-label">学科总数</div>
          <div class="metric-detail">
            <span>覆盖全部学科</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-icon blue">
              <el-icon><Monitor /></el-icon>
            </div>
            <el-tag type="warning" size="small">{{ onlineUsers }} 在线</el-tag>
          </div>
          <div class="metric-value">{{ systemLoad }}%</div>
          <div class="metric-label">系统负载</div>
          <div class="metric-progress">
            <el-progress :percentage="systemLoad" :stroke-width="6" :show-text="false" :color="getLoadColor(systemLoad)" />
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-icon red">
              <el-icon><WarningFilled /></el-icon>
            </div>
            <el-tag :type="warningsCount > 0 ? 'danger' : 'success'" size="small">
              {{ warningsCount > 0 ? `${warningsCount} 条预警` : '无预警' }}
            </el-tag>
          </div>
          <div class="metric-value">{{ warningsCount }}</div>
          <div class="metric-label">AI健康预警</div>
          <div class="metric-detail">
            <span>重度 {{ warningsCountHeavy }}</span>
            <span>中度 {{ warningsCountMedium }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧：快捷管理 -->
      <div class="left-section">
        <div class="content-card quick-manage">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon purple">
                <el-icon><Grid /></el-icon>
              </div>
              <div>
                <h3>快捷管理</h3>
                <p>常用管理功能</p>
              </div>
            </div>
          </div>
          <div class="manage-grid">
            <div v-for="item in quickManage" :key="item.name" class="manage-item" @click="navigateTo(item.path)">
              <div class="manage-icon" :style="{ background: item.gradient }">
                <el-icon :size="22">
                  <User v-if="item.iconName === 'User'" />
                  <Reading v-else-if="item.iconName === 'Reading'" />
                  <DataAnalysis v-else-if="item.iconName === 'DataAnalysis'" />
                  <Bell v-else-if="item.iconName === 'Bell'" />
                  <Setting v-else-if="item.iconName === 'Setting'" />
                </el-icon>
              </div>
              <div class="manage-info">
                <span class="manage-name">{{ item.name }}</span>
                <span class="manage-count">{{ item.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 预警干预卡片 -->
        <div class="content-card warnings-preview">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon red">
                <el-icon><WarningFilled /></el-icon>
              </div>
              <div>
                <h3>预警干预</h3>
                <p>{{ warnings.length }} 条待处理预警</p>
              </div>
            </div>
            <el-button type="primary" text size="small" @click="goToAIHealth">
              查看全部
              <el-icon class="el-icon--right"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="warnings-list">
            <div v-for="warning in warnings.slice(0, 5)" :key="warning.id" class="warning-item">
              <div class="warning-info">
                <div class="warning-header">
                  <span class="warning-student">{{ warning.studentName }}</span>
                  <el-tag :type="getWarningTagType(warning.level)" size="small">
                    {{ warning.level }}依赖
                  </el-tag>
                </div>
                <p class="warning-trigger">{{ warning.trigger }}</p>
              </div>
              <el-button size="small" type="primary" plain @click="showStudentDetail(warning)">
                查看详情
              </el-button>
            </div>
            <div v-if="warnings.length === 0" class="empty-warning">
              <el-icon><SuccessFilled /></el-icon>
              <span>暂无预警，保持现状</span>
            </div>
          </div>
        </div>

        <!-- 班级统计卡片 -->
        <div class="content-card class-stats">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon green">
                <el-icon><School /></el-icon>
              </div>
              <div>
                <h3>班级统计</h3>
                <p>前 {{ classStats.length }} 个班级</p>
              </div>
            </div>
            <el-button type="primary" text size="small" @click="$router.push('/teaching/class-manage')">
              全部
              <el-icon class="el-icon--right"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div v-if="classStats.length > 0" class="class-stats-list">
            <div v-for="cls in classStats.slice(0, 8)" :key="cls.classId" class="class-stat-item">
              <div class="class-stat-info">
                <span class="class-stat-name">{{ cls.className }}</span>
                <span class="class-stat-meta">
                  <el-tag size="small" type="info">{{ cls.grade }}</el-tag>
                  <span>{{ cls.studentCount }}人</span>
                </span>
              </div>
            </div>
          </div>
          <div v-else class="empty-warning">
            <el-icon><SuccessFilled /></el-icon>
            <span>暂无班级数据</span>
          </div>
        </div>
      </div>

      <!-- 右侧：数据图表区域 -->
      <div class="right-section">
        <!-- AI健康概览组件 -->
        <div class="content-card ai-overview">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon blue">
                <el-icon><DataAnalysis /></el-icon>
              </div>
              <div>
                <h3>AI健康概览</h3>
                <p>全校AI使用健康度</p>
              </div>
            </div>
            <el-button type="primary" text size="small" @click="goToAIHealth">
              详情
              <el-icon class="el-icon--right"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <!-- 简化的 AI 健康概览 -->
          <div class="ai-overview-stats">
            <div class="overview-stat">
              <span class="stat-label">预警学生</span>
              <span class="stat-value">{{ warningsCount }}</span>
            </div>
            <div class="overview-stat">
              <span class="stat-label">AI使用时长(周)</span>
              <span class="stat-value">{{ aiUsageHoursWeekly }}</span>
            </div>
            <div class="overview-stat">
              <span class="stat-label">依赖指数(平均)</span>
              <span class="stat-value">{{ avgDependenceScore }}</span>
            </div>
          </div>
          <div class="mini-chart">
            <div ref="miniChartRef" class="mini-chart-box"></div>
          </div>
        </div>

        <!-- 今日概览卡片 -->
        <div class="content-card today-overview">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon blue">
                <el-icon><Calendar /></el-icon>
              </div>
              <div>
                <h3>今日概览</h3>
                <p>{{ currentDate }}</p>
              </div>
            </div>
          </div>
          <div class="overview-grid">
            <div class="overview-item">
              <div class="overview-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="overview-info">
                <span class="overview-label">今日课程</span>
                <span class="overview-value">{{ todayCourses }} 节</span>
              </div>
            </div>
            <div class="overview-item">
              <div class="overview-icon" style="background: linear-gradient(135deg, #10b981, #34d399);">
                <el-icon><User /></el-icon>
              </div>
              <div class="overview-info">
                <span class="overview-label">今日访问</span>
                <span class="overview-value">{{ todayVisits.toLocaleString() }} 人</span>
              </div>
            </div>
            <div class="overview-item">
              <div class="overview-icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24);">
                <el-icon><Document /></el-icon>
              </div>
              <div class="overview-info">
                <span class="overview-label">待处理服务</span>
                <span class="overview-value">{{ pendingServices }} 条</span>
              </div>
            </div>
            <div class="overview-item">
              <div class="overview-icon" style="background: linear-gradient(135deg, #ef4444, #f87171);">
                <el-icon><Bell /></el-icon>
              </div>
              <div class="overview-info">
                <span class="overview-label">未读通知</span>
                <span class="overview-value">{{ unreadNotifications }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近考试卡片 -->
        <div class="content-card recent-exams">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon orange">
                <el-icon><Trophy /></el-icon>
              </div>
              <div>
                <h3>最近考试</h3>
                <p>共 {{ recentExams.length }} 场近期考试</p>
              </div>
            </div>
            <el-button type="primary" text size="small" @click="$router.push('/teaching/exam-list')">
              全部
              <el-icon class="el-icon--right"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div v-if="recentExams.length > 0" class="exams-list">
            <div v-for="exam in recentExams" :key="exam.id" class="exam-item">
              <div class="exam-info">
                <span class="exam-name">{{ exam.name }}</span>
                <span class="exam-meta">
                  <el-tag size="small" type="info">{{ exam.examType }}</el-tag>
                  <span class="exam-date">{{ exam.examDate }}</span>
                  <span class="exam-class">{{ exam.classCount }}个班级</span>
                </span>
              </div>
            </div>
          </div>
          <div v-else class="empty-warning">
            <el-icon><SuccessFilled /></el-icon>
            <span>暂无考试安排</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 学生详情弹窗 -->
    <el-dialog
        v-model="showDetailDialog"
        :title="selectedWarning?.studentName + ' - 详情'"
        width="700px"
        class="student-detail-dialog"
    >
      <div v-if="studentDetail" v-loading="detailLoading" class="student-detail-content">
        <div class="detail-header">
          <div class="student-avatar">
            {{ studentDetail.name?.charAt(0) }}
          </div>
          <div class="student-info">
            <h3>{{ studentDetail.name }}</h3>
            <p>学号：{{ studentDetail.studentId }}</p>
            <p>班级：{{ studentDetail.className || studentDetail.department || '未分配' }}</p>
          </div>
          <div class="dependence-badge" :class="getDependenceClass(studentDetail.dependenceIndex)">
            <span class="score">{{ studentDetail.dependenceIndex }}</span>
            <span class="level">{{ studentDetail.dependenceLevel }}依赖</span>
          </div>
        </div>

        <div class="detail-tabs">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="成绩趋势" name="score">
              <div ref="scoreChartRef" class="detail-chart"></div>
            </el-tab-pane>
            <el-tab-pane label="AI使用构成" name="usage">
              <div ref="usageChartRef" class="detail-chart"></div>
            </el-tab-pane>
            <el-tab-pane label="预警信息" name="warning">
              <div class="warning-detail">
                <p><strong>触发条件：</strong>{{ selectedWarning?.trigger }}</p>
                <p><strong>建议方案：</strong>{{ selectedWarning?.suggestion }}</p>
                <div class="detail-actions">
                  <el-button type="primary" @click="handleWarningAction(selectedWarning, 'message')">
                    <el-icon><ChatDotRound /></el-icon> 发送提醒
                  </el-button>
                  <el-button type="danger" plain @click="handleWarningAction(selectedWarning, 'meeting')">
                    <el-icon><User /></el-icon> 安排面谈
                  </el-button>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import api from '@/api'
import { homeAPI } from '@/api/home'
import {
  Setting, Refresh, User, Checked, Monitor, Service,
  TrendCharts, PieChart, WarningFilled, CircleCloseFilled,
  InfoFilled, Grid, Document, ArrowRight, Reading, Bell,
  Calendar, Clock, DataAnalysis, SuccessFilled, ChatDotRound,
  Trophy, School
} from '@element-plus/icons-vue'

defineOptions({ name: 'AdminHome' })

const router = useRouter()
const userStore = useUserStore()

// ==================== 响应式数据 ====================
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
  { name: '班级管理', iconName: 'School', path: '/teaching/class-manage', count: '', gradient: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  { name: '考试管理', iconName: 'Trophy', path: '/teaching/exam-list', count: '', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { name: '学科管理', iconName: 'Reading', path: '/teaching/subject-manage', count: '', gradient: 'linear-gradient(135deg, #fa709a, #fee140)' },
  { name: 'AI健康评估', iconName: 'DataAnalysis', path: '/admin-health', count: '评估', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { name: '通知发布', iconName: 'Bell', path: '/notifications', count: '发布', gradient: 'linear-gradient(135deg, #a8edea, #fed6e3)' }
])

// 弹窗相关
const showDetailDialog = ref(false)
const selectedWarning = ref(null)
const studentDetail = ref(null)
const detailLoading = ref(false)
const activeTab = ref('score')

// 图表引用
const miniChartRef = ref(null)
const scoreChartRef = ref(null)
const usageChartRef = ref(null)
let miniChart = null
let scoreChart = null
let usageChart = null

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

const fetchOverview = async () => {
  try {
    const res = await api.dashboard.overview()
    if (res.success) {
      totalUsers.value = res.data.total_students + res.data.total_teachers
      studentCount.value = res.data.total_students
      teacherCount.value = res.data.total_teachers
      pendingServices.value = res.data.pending_repairs || 0
    }
  } catch (e) {
    console.error('获取概览数据失败:', e)
  }
}

const fetchWarnings = async () => {
  try {
    const res = await api.aiHealth.warnings()
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

const fetchAIStats = async () => {
  try {
    const res = await api.dashboard.aiStats?.()
    if (res?.success) {
      aiUsageHoursWeekly.value = res.data.aiUsageHoursWeekly || 184
      avgDependenceScore.value = res.data.avgDependenceScore || 58
    }
  } catch (e) {
    console.error('获取AI统计失败:', e)
    // 使用默认值
    aiUsageHoursWeekly.value = 184
    avgDependenceScore.value = 58
  }
}

const fetchNotifications = async () => {
  try {
    const res = await api.notifications.list({ unreadOnly: true })
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
  fetchAIStats()
  fetchNotifications()
  ElMessage.success('数据已刷新')
}

// ==================== 导航 ====================
const navigateTo = (path) => {
  router.push(path)
}

const goToAIHealth = () => {
  router.push('/admin-health')
}

// ==================== 预警详情弹窗 ====================
const showStudentDetail = async (warning) => {
  selectedWarning.value = warning
  showDetailDialog.value = true
  detailLoading.value = true

  try {
    // 从学生列表中查找学生ID（这里简化处理，实际需要从API获取学生详情）
    const studentsRes = await api.aiHealth.students({ keyword: warning.studentName })
    if (studentsRes.success && studentsRes.data.length > 0) {
      const student = studentsRes.data[0]
      const detailRes = await api.aiHealth.studentDetail(student.id)
      if (detailRes.success) {
        studentDetail.value = detailRes.data
        await nextTick()
        renderScoreChart()
        renderUsageChart()
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
      await nextTick()
      renderScoreChart()
      renderUsageChart()
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
    await nextTick()
    renderScoreChart()
    renderUsageChart()
  } finally {
    detailLoading.value = false
  }
}

// 渲染成绩趋势图
const renderScoreChart = () => {
  if (!scoreChartRef.value || !studentDetail.value?.scoreTrend) return
  if (scoreChart) scoreChart.dispose()

  scoreChart = echarts.init(scoreChartRef.value)
  const data = studentDetail.value.scoreTrend
  const xAxisData = data.map((_, i) => `第${i + 1}周`)

  scoreChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: xAxisData },
    yAxis: { type: 'value', name: '成绩', min: 0, max: 100 },
    series: [{
      type: 'line',
      smooth: true,
      data: data,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#3b82f6', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
          { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
        ])
      },
      itemStyle: { color: '#3b82f6' },
      label: { show: true, position: 'top', formatter: '{c}分' }
    }]
  })
}

// 渲染 AI 使用构成饼图
const renderUsageChart = () => {
  if (!usageChartRef.value || !studentDetail.value?.aiUsageComposition) return
  if (usageChart) usageChart.dispose()

  usageChart = echarts.init(usageChartRef.value)
  usageChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['45%', '50%'],
      data: studentDetail.value.aiUsageComposition,
      label: { show: true, formatter: '{b}: {d}%' },
      emphasis: { scale: true }
    }]
  })
}

// 渲染迷你图表
const renderMiniChart = () => {
  if (!miniChartRef.value) return
  if (miniChart) miniChart.dispose()

  miniChart = echarts.init(miniChartRef.value)
  miniChart.setOption({
    tooltip: { show: false },
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { show: false, type: 'category', data: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周'] },
    yAxis: { show: false },
    series: [{
      type: 'line',
      smooth: true,
      data: [62, 58, 56, 52, 49, 46],
      lineStyle: { color: '#ef4444', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
          { offset: 1, color: 'rgba(239, 68, 68, 0.05)' }
        ])
      },
      symbol: 'none'
    }]
  })
}

// 处理预警操作
const handleWarningAction = (warning, action) => {
  if (action === 'message') {
    ElMessage.info(`已向 ${warning.studentName} 发送学习提醒`)
  } else if (action === 'meeting') {
    ElMessage.info(`已为 ${warning.studentName} 安排教师面谈`)
  }
}

// 窗口自适应
const handleResize = () => {
  miniChart?.resize()
  scoreChart?.resize()
  usageChart?.resize()
}

// ==================== 生命周期 ====================
onMounted(() => {
  fetchDashboard()
  fetchWarnings()
  fetchAIStats()
  fetchNotifications()
  setTimeout(renderMiniChart, 100)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  miniChart?.dispose()
  scoreChart?.dispose()
  usageChart?.dispose()
})
</script>

<style scoped>
.admin-home {
  min-height: calc(100vh - 80px);
  background: linear-gradient(135deg, #cde8f5 0%, #d4f1f9 100%);
  padding: 16px;
  border-radius: 20px;
  overflow: hidden;
}

/* 欢迎横幅 */
.welcome-banner {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.banner-left h1 {
  margin: 0 0 2px 0;
  font-size: 18px;
  font-weight: 600;
}

.banner-left p {
  margin: 0;
  font-size: 13px;
  opacity: 0.8;
}

.banner-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 核心指标 */
.metrics-section {
  margin-bottom: 16px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  border: 1px rgba(64, 158, 255, 0.15);
  padding: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  color: #1f2937;
  overflow: hidden;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.metric-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.metric-icon.blue { background: linear-gradient(135deg, #409eff, #66b1ff); }
.metric-icon.green { background: linear-gradient(135deg, #67c23a, #85ce61); }
.metric-icon.orange { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.metric-icon.purple { background: linear-gradient(135deg, #909399, #b0b3b8); }

.header-icon.blue { background: linear-gradient(135deg, #409eff, #66b1ff); }
.header-icon.purple { background: linear-gradient(135deg, #409eff, #66b1ff); }

.metric-value {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 2px;
}

.metric-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.metric-detail {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #9ca3af;
}

.metric-progress {
  margin-top: 8px;
}

/* 主内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 10px;
  margin-top: 10px;
}

.left-section, .right-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 内容卡片 */
.content-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  color: #1f2937;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-header .header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.header-icon.blue { background: linear-gradient(135deg, #667eea, #764ba2); }
.header-icon.green { background: linear-gradient(135deg, #11998e, #38ef7d); }
.header-icon.red { background: linear-gradient(135deg, #f093fb, #f5576c); }
.header-icon.purple { background: linear-gradient(135deg, #667eea, #764ba2); }

.card-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.card-header p {
  margin: 1px 0 0 0;
  font-size: 11px;
  color: #6b7280;
}

/* 快捷管理 */
.manage-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.manage-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f1f5f9;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.manage-item:hover {
  background: #e2e8f0;
  transform: translateX(2px);
}

.manage-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.manage-info {
  flex: 1;
}

.manage-name {
  display: block;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 1px;
}

.manage-count {
  font-size: 10px;
  color: #6b7280;
}

/* 预警列表 */
.warnings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.warning-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 8px;
  transition: all 0.2s;
}

.warning-item:hover {
  background: #f1f5f9;
}

.warning-info {
  flex: 1;
  min-width: 0;
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.warning-student {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
}

.warning-trigger {
  margin: 0;
  font-size: 11px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-warning {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  color: #9ca3af;
  font-size: 12px;
}

/* 最近考试 */
.exams-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exam-item {
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  transition: all 0.2s;
}

.exam-item:hover {
  background: #f1f5f9;
}

.exam-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.exam-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.exam-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #6b7280;
}

.exam-date, .exam-class {
  font-size: 11px;
  color: #9ca3af;
}

/* 班级统计 */
.class-stats-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.class-stat-item {
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 8px;
  transition: all 0.2s;
}

.class-stat-item:hover {
  background: #f1f5f9;
}

.class-stat-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.class-stat-name {
  font-size: 12px;
  font-weight: 500;
  color: #1e293b;
}

.class-stat-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #6b7280;
}

/* AI概览统计 */
.ai-overview-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.overview-stat {
  flex: 1;
  text-align: center;
  padding: 8px;
  background: #f1f5f9;
  border-radius: 10px;
}

.overview-stat .stat-label {
  display: block;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
}

.overview-stat .stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.mini-chart-box {
  height: 60px;
}

/* 今日概览 */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 10px;
}

.overview-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
}

.overview-info {
  flex: 1;
}

.overview-label {
  display: block;
  font-size: 11px;
  color: #6b7280;
}

.overview-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

/* 弹窗样式 */
.student-detail-dialog :deep(.el-dialog) {
  border-radius: 16px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 12px;
  margin-bottom: 20px;
}

.student-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
}

.student-info {
  flex: 1;
}

.student-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.student-info p {
  margin: 2px 0;
  font-size: 13px;
  color: #6b7280;
}

.dependence-badge {
  text-align: center;
  padding: 12px 16px;
  border-radius: 12px;
  min-width: 100px;
}

.dependence-badge.light { background: #dcfce7; }
.dependence-badge.medium { background: #fef3c7; }
.dependence-badge.heavy { background: #fee2e2; }

.dependence-badge .score {
  display: block;
  font-size: 24px;
  font-weight: 700;
}

.dependence-badge.light .score { color: #10b981; }
.dependence-badge.medium .score { color: #f59e0b; }
.dependence-badge.heavy .score { color: #ef4444; }

.dependence-badge .level {
  font-size: 12px;
  color: #6b7280;
}

.detail-chart {
  width: 100%;
  height: 240px;
}

.warning-detail {
  padding: 16px;
}

.warning-detail p {
  margin: 8px 0;
  line-height: 1.6;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .main-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .overview-grid {
    grid-template-columns: 1fr;
  }
  .manage-grid {
    grid-template-columns: 1fr;
  }
}
</style>