<template>
  <div class="admin-home">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="banner-content">
        <div class="banner-left">
          <h1>{{ greetingText }}，{{ userStore.user?.name || '管理员' }} 👋</h1>
          <p>welcome back！</p>
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
            <span>学生 {{ studentCount }}</span>
            <span>教师 {{ teacherCount }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-icon green">
              <el-icon><Checked /></el-icon>
            </div>
            <el-tag type="success" size="small">良好</el-tag>
          </div>
          <div class="metric-value">{{ todayAttendance }}%</div>
          <div class="metric-label">今日出勤率</div>
          <div class="metric-detail">
            <span>已签到 {{ checkedInCount }}</span>
            <span>未签到 {{ notCheckedCount }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-icon orange">
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
            <div class="metric-icon purple">
              <el-icon><Service /></el-icon>
            </div>
            <el-tag :type="pendingServices > 10 ? 'danger' : 'success'" size="small">
              {{ pendingServices > 0 ? '待处理' : '已清空' }}
            </el-tag>
          </div>
          <div class="metric-value">{{ pendingServices }}</div>
          <div class="metric-label">xxxxx</div>
          <div class="metric-detail">
            <span>xx {{ repairCount }}</span>
            <span>xx {{ bookingCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧大数据看板 -->
      <div class="left-section">
        <!-- 实时数据趋势 -->
        <div class="content-card chart-section">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div>
                <h3>实时数据监控</h3>
                <p>用户活跃度与系统访问趋势</p>
              </div>
            </div>
            <el-radio-group v-model="chartTimeRange" size="small">
              <el-radio-button label="today">今日</el-radio-button>
              <el-radio-button label="week">本周</el-radio-button>
              <el-radio-button label="month">本月</el-radio-button>
            </el-radio-group>
          </div>
          <div class="chart-container" ref="mainChartRef"></div>
        </div>

        <!-- 功能使用统计 -->
        <div class="content-card usage-section">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon green">
                <el-icon><PieChart /></el-icon>
              </div>
              <div>
                <h3>功能使用分布</h3>
                <p>各模块访问量统计</p>
              </div>
            </div>
          </div>
          <div class="usage-grid">
            <div class="chart-pie" ref="pieChartRef"></div>
            <div class="usage-list">
              <div v-for="item in usageStats" :key="item.name" class="usage-item">
                <div class="usage-info">
                  <div class="usage-color" :style="{ background: item.color }"></div>
                  <span class="usage-name">{{ item.name }}</span>
                </div>
                <div class="usage-data">
                  <span class="usage-value">{{ item.value.toLocaleString() }}</span>
                  <span class="usage-percent">{{ item.percent }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 今日概览 -->
        <div class="content-card today-overview">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon blue">
                <el-icon><Calendar /></el-icon>
              </div>
              <div>
                <h3>今日概览</h3>
                <p>{{ new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }) }}</p>
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
                <span class="overview-value">28 节</span>
              </div>
            </div>
            <div class="overview-item">
              <div class="overview-icon" style="background: linear-gradient(135deg, #10b981, #34d399);">
                <el-icon><User /></el-icon>
              </div>
              <div class="overview-info">
                <span class="overview-label">今日访问</span>
                <span class="overview-value">8,562 人</span>
              </div>
            </div>
            <div class="overview-item">
              <div class="overview-icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24);">
                <el-icon><Document /></el-icon>
              </div>
              <div class="overview-info">
                <span class="overview-label">新增报修</span>
                <span class="overview-value">12 条</span>
              </div>
            </div>
            <div class="overview-item">
              <div class="overview-icon" style="background: linear-gradient(135deg, #ef4444, #f87171);">
                <el-icon><Bell /></el-icon>
              </div>
              <div class="overview-info">
                <span class="overview-label">待办事项</span>
                <span class="overview-value">5 项</span>
              </div>
            </div>
          </div>
          <!-- 今日重点事项 -->
          <div class="today-highlights">
            <h4 class="highlights-title">📌 今日重点</h4>
            <div class="highlights-list">
              <div class="highlight-item">
                <span class="highlight-time">09:00</span>
                <span class="highlight-text">学院教师会议 - 行政楼3楼会议室</span>
                <el-tag size="small" type="danger">重要</el-tag>
              </div>
              <div class="highlight-item">
                <span class="highlight-time">14:00</span>
                <span class="highlight-text">设备维护检查 - 实验楼B区</span>
                <el-tag size="small" type="warning">待处理</el-tag>
              </div>
              <div class="highlight-item">
                <span class="highlight-time">16:30</span>
                <span class="highlight-text">新生入学系统培训</span>
                <el-tag size="small" type="success">进行中</el-tag>
              </div>
            </div>
          </div>
          <!-- 快速统计 -->
          <div class="quick-stats">
            <div class="stat-row">
              <div class="stat-item">
                <span class="stat-icon">📚</span>
                <div class="stat-info">
                  <span class="stat-value">156</span>
                  <span class="stat-label">开设课程</span>
                </div>
              </div>
              <div class="stat-item">
                <span class="stat-icon">🏫</span>
                <div class="stat-info">
                  <span class="stat-value">48</span>
                  <span class="stat-label">教室使用</span>
                </div>
              </div>
              <div class="stat-item">
                <span class="stat-icon">📋</span>
                <div class="stat-info">
                  <span class="stat-value">23</span>
                  <span class="stat-label">待审批</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧管理面板 -->
      <div class="right-section">
        <!-- 系统告警 -->
        <div class="content-card alerts-section">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon red">
                <el-icon><WarningFilled /></el-icon>
              </div>
              <div>
                <h3>系统告警</h3>
                <p>{{ alerts.length }}条待处理</p>
              </div>
            </div>
            <el-button type="primary" text size="small">全部处理</el-button>
          </div>
          <div class="alerts-list">
            <div v-for="alert in alerts" :key="alert.id" class="alert-item" :class="alert.level">
              <div class="alert-icon">
                <el-icon v-if="alert.level === 'error'"><CircleCloseFilled /></el-icon>
                <el-icon v-else-if="alert.level === 'warning'"><WarningFilled /></el-icon>
                <el-icon v-else><InfoFilled /></el-icon>
              </div>
              <div class="alert-content">
                <span class="alert-title">{{ alert.title }}</span>
                <span class="alert-time">{{ alert.time }}</span>
              </div>
              <el-button type="primary" text size="small" @click="handleAlert(alert)">处理</el-button>
            </div>
          </div>
        </div>

        <!-- 快捷管理 -->
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
                  <OfficeBuilding v-else-if="item.iconName === 'OfficeBuilding'" />
                  <Lock v-else-if="item.iconName === 'Lock'" />
                  <Bell v-else-if="item.iconName === 'Bell'" />
                  <Setting v-else-if="item.iconName === 'Setting'" />
                </el-icon>
              </div>
              <div class="manage-info">
                <span class="manage-name">{{ item.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近操作日志 -->
        <div class="content-card logs-section">
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon blue">
                <el-icon><Document /></el-icon>
              </div>
              <div>
                <h3>xxxx</h3>
                <p>xxxxxxx</p>
              </div>
            </div>
          </div>
          <div class="logs-list">
            <div v-for="log in recentLogs" :key="log.id" class="log-item">
              <el-avatar :size="32" :src="log.avatar">{{ log.operator.charAt(0) }}</el-avatar>
              <div class="log-content">
                <span class="log-action">
                  <strong>{{ log.operator }}</strong> {{ log.action }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import {
  Setting, Refresh, User, Checked, Monitor, Service,
  TrendCharts, PieChart, WarningFilled, CircleCloseFilled,
  InfoFilled, Grid, Document, ArrowRight, Reading, OfficeBuilding, Lock, Bell, Calendar, Clock
} from '@element-plus/icons-vue'

defineOptions({ name: 'AdminHome' })

const router = useRouter()
const userStore = useUserStore()

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

// 核心指标数据
const totalUsers = ref(12580)
const studentCount = ref(11245)
const teacherCount = ref(1335)
const userGrowth = ref(5.2)

const todayAttendance = ref(94)
const checkedInCount = ref(10856)
const notCheckedCount = ref(689)

const systemLoad = ref(42)
const onlineUsers = ref(3456)

const pendingServices = ref(18)
const repairCount = ref(100000)
const bookingCount = ref(100000)

// 图表时间范围
const chartTimeRange = ref('today')

// 不同时间范围的数据
const chartDataMap = {
  today: {
    xAxis: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    visits: [1200, 800, 2500, 4800, 3600, 5200, 3100],
    activeUsers: [800, 500, 1800, 3200, 2800, 4100, 2400],
    newUsers: [12, 8, 45, 68, 52, 78, 35]
  },
  week: {
    xAxis: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    visits: [15200, 18500, 22300, 19800, 21500, 12800, 9500],
    activeUsers: [12800, 15200, 18600, 16500, 17800, 10200, 7800],
    newUsers: [245, 312, 398, 356, 428, 189, 156]
  },
  month: {
    xAxis: ['第1周', '第2周', '第3周', '第4周'],
    visits: [85600, 92300, 98500, 87200],
    activeUsers: [68500, 75800, 82300, 71600],
    newUsers: [1256, 1489, 1678, 1423]
  }
}

// 功能使用统计
const usageStats = ref([
  { name: '课程学习', value: 45680, percent: 35, color: '#667eea' },
  { name: '校园服务', value: 32450, percent: 25, color: '#10b981' },
  { name: '考勤签到', value: 25890, percent: 20, color: '#f59e0b' },
  { name: '成长档案', value: 15670, percent: 12, color: '#ef4444' },
  { name: '其他功能', value: 10310, percent: 8, color: '#6b7280' }
])

// 系统告警
const alerts = ref([
  { id: 1, title: '服务器CPU使用率过高（85%）', level: 'warning', time: '5分钟前' },
  { id: 2, title: '数据库连接池接近上限', level: 'warning', time: '15分钟前' },
  { id: 3, title: '教室A-301空调故障报修', level: 'info', time: '1小时前' }
])

// 快捷管理 - 使用图标名称
const quickManage = ref([
  { name: '用户管理', iconName: 'User', path: '/users', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { name: '课程管理', iconName: 'Reading', path: '/courses', gradient: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  { name: '课表管理', iconName: 'OfficeBuilding', path: '/rooms', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { name: 'AI健康评估', iconName: 'Lock', path: '/admin-health', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { name: '通知中心', iconName: 'Bell', path: '/notifications', gradient: 'linear-gradient(135deg, #fa709a, #fee140)' },
  { name: '系统设置', iconName: 'Setting', path: '/profile', gradient: 'linear-gradient(135deg, #a8edea, #fed6e3)' }
])

// 操作日志
const recentLogs = ref([
  { id: 1, operator: '王老师', action: '发布了新的课程通知', time: '10分钟前', avatar: '' },
  { id: 2, operator: '系统', action: '自动备份数据库完成', time: '30分钟前', avatar: '' },
  { id: 3, operator: '张管理', action: '处理了报修工单 #2024001', time: '1小时前', avatar: '' },
  { id: 4, operator: '李管理', action: '添加了新用户 student123', time: '2小时前', avatar: '' }
])

const mainChartRef = ref(null)
const pieChartRef = ref(null)

const getLoadColor = (load) => {
  if (load < 50) return '#10b981'
  if (load < 80) return '#f59e0b'
  return '#ef4444'
}

const refreshData = () => {
  ElMessage.success('数据已刷新')
}

const handleAlert = (alert) => {
  ElMessage.info(`处理告警: ${alert.title}`)
}

const navigateTo = (path) => {
  router.push(path)
}


const updateMainChart = () => {
  if (!mainChartRef.value) return

  const chart = echarts.getInstanceByDom(mainChartRef.value) || echarts.init(mainChartRef.value)
  const data = chartDataMap[chartTimeRange.value]

  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['访问量', '活跃用户', '新增用户'], right: 20 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.xAxis
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '访问量',
        type: 'line',
        smooth: true,
        data: data.visits,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.4)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ])
        },
        itemStyle: { color: '#667eea' }
      },
      {
        name: '活跃用户',
        type: 'line',
        smooth: true,
        data: data.activeUsers,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.4)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
          ])
        },
        itemStyle: { color: '#10b981' }
      },
      {
        name: '新增用户',
        type: 'bar',
        data: data.newUsers,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#f59e0b' },
            { offset: 1, color: '#fbbf24' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  })
}

const initCharts = () => {
  // 主图表
  updateMainChart()

  // 饼图
  if (pieChartRef.value) {
    const chart = echarts.init(pieChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      series: [{
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '50%'],
        data: usageStats.value.map(item => ({
          name: item.name,
          value: item.value,
          itemStyle: { color: item.color }
        })),
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    })
  }
}

// 监听时间范围变化
watch(chartTimeRange, () => {
  updateMainChart()
})

onMounted(() => {
  setTimeout(initCharts, 100)
})
</script>

<style scoped>
.admin-home {
  min-height: calc(100vh - 80px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  color: white;
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

/* 指标区域 */
.metrics-section {
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.panel-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 13px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.status-dot.online {
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 核心指标 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px !important;
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

.metric-icon.blue { background: linear-gradient(135deg, #667eea, #764ba2); }
.metric-icon.green { background: linear-gradient(135deg, #11998e, #38ef7d); }
.metric-icon.orange { background: linear-gradient(135deg, #f093fb, #f5576c); }
.metric-icon.purple { background: linear-gradient(135deg, #a8edea, #fed6e3); color: #1a1a2e; }

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
  grid-template-columns: 1.2fr 1fr;
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
  border-radius: 14px !important;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-size: 16px;
}

.header-icon.green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
.header-icon.red { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.header-icon.purple { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.header-icon.blue { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }

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

/* 图表区域 */
.chart-container {
  height: 160px;
  border-radius: 10px;
  overflow: hidden;
}

/* 确保所有卡片内部元素也有圆角 */
.chart-section,
.usage-section,
.alerts-section,
.manage-section {
  border-radius: 14px !important;
  overflow: hidden;
}

/* 功能使用统计 */
.usage-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 10px;
}

.chart-pie {
  height: 120px;
}

.usage-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.usage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(241, 245, 249, 0.8);
  border-radius: 8px;
}

.usage-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.usage-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.usage-name {
  font-size: 12px;
}

.usage-data {
  display: flex;
  align-items: center;
  gap: 8px;
}

.usage-value {
  font-size: 12px;
  font-weight: 600;
}

.usage-percent {
  font-size: 10px;
  color: #9ca3af;
}

/* 系统告警 */
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(241, 245, 249, 0.8);
}

.alert-item.error { border-left: 3px solid #ef4444; }
.alert-item.warning { border-left: 3px solid #f59e0b; }
.alert-item.info { border-left: 3px solid #3b82f6; }

.alert-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.alert-item.error .alert-icon { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.alert-item.warning .alert-icon { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
.alert-item.info .alert-icon { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }

.alert-content {
  flex: 1;
}

.alert-title {
  display: block;
  font-size: 12px;
  margin-bottom: 2px;
}

.alert-time {
  font-size: 10px;
  color: #9ca3af;
}

/* 快捷管理 */
.manage-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.manage-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: rgba(241, 245, 249, 0.8);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.manage-item:hover {
  background: rgba(226, 232, 240, 0.9);
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
  color: rgba(255, 255, 255, 0.5);
}

/* 操作日志 */
.logs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.log-content {
  flex: 1;
}

.log-action {
  display: block;
  font-size: 14px;
  margin-bottom: 2px;
}

.log-action strong {
  color: #667eea;
}

.log-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* 响应式 */
@media (max-width: 1400px) {
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

  .usage-grid {
    grid-template-columns: 1fr;
  }

  .manage-grid {
    grid-template-columns: 1fr;
  }
}

/* 今日概览 */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  transition: all 0.3s;
}

.overview-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.overview-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.overview-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.overview-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.overview-value {
  font-size: 18px;
  font-weight: 600;
}

/* 今日重点事项 */
.today-highlights {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.highlights-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
}

.highlights-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.highlight-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.highlight-time {
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
  min-width: 45px;
}

.highlight-text {
  flex: 1;
  font-size: 12px;
  color: #374151;
}

/* 快速统计 */
.quick-stats {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.stat-row {
  display: flex;
  gap: 10px;
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 10px;
}

.stat-icon {
  font-size: 20px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}
</style>
