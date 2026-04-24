<template>
  <div class="dashboard-container">
    <!-- 顶部标题区域 -->
    <div class="dashboard-header">
      <div class="header-info">
        <h1 class="dashboard-title">智评AI 数据大屏</h1>
        <p class="dashboard-subtitle">实时数据 · {{ currentTime }}</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Refresh" @click="refreshAllData">刷新数据</el-button>
        <el-button :icon="FullScreen" @click="toggleFullScreen">{{ isFullScreen ? '退出全屏' : '全屏显示' }}</el-button>
      </div>
    </div>

    <!-- 顶部统计卡片6张 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
      <div v-for="(stat, index) in statsCards" :key="index"
           class="stat-card group"
           :style="{ '--gradient': stat.gradient }">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm mb-1">{{ stat.label }}</p>
            <p class="text-2xl font-bold text-gray-800">{{ stat.value }}</p>
            <p class="text-xs mt-1" :class="stat.change > 0 ? 'text-green-500' : 'text-red-500'">
              <el-icon><TrendCharts /></el-icon>
              {{ stat.change > 0 ? '+' : '' }}{{ stat.change }}%
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-110"
               :style="{ background: stat.gradient }">
            <el-icon :size="24"><component :is="stat.icon" /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 教室使用率 -->
      <div class="chart-card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">教室使用率趋势</h3>
          <el-radio-group v-model="roomUsagePeriod" size="small">
            <el-radio-button label="week">本周</el-radio-button>
            <el-radio-button label="month">本月</el-radio-button>
          </el-radio-group>
        </div>
        <div ref="roomUsageChart" class="h-72"></div>
      </div>

      <!-- 食堂人流 -->
      <div class="chart-card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">食堂实时人流</h3>
        </div>
        <div class="space-y-4">
          <div v-for="canteen in canteenCrowd" :key="canteen.id"
               class="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-gray-700">{{ canteen.name }}</span>
              <el-tag :type="getCrowdTagType(canteen.crowd_level)" size="small">
                {{ getCrowdText(canteen.crowd_level) }}
              </el-tag>
            </div>
            <el-progress
                :percentage="canteen.crowd_level || 0"
                :color="getCrowdColor(canteen.crowd_level)"
                :stroke-width="12"
                :show-text="false"
            />
            <p class="text-xs text-gray-500 mt-1">
              当前 {{ canteen.current_count || 0 }} 人 / 容量 {{ canteen.capacity }} 人
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 第二行：图书馆在线人数 + 校园人流热力图 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 校园人流热力图 -->
      <div class="chart-card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">校园人流热力图</h3>
          <el-button type="primary" text size="small">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
        <div ref="heatmapChart" class="h-80"></div>
      </div>
      <!-- 图书馆在线人数 -->
      <div class="chart-card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">图书馆在线人数</h3>
          <span class="flex items-center text-green-500 text-sm">
        <span class="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
        实时
      </span>
        </div>
        <div ref="libraryChart" class="h-72"></div>
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="chart-card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">图书馆在线人数</h3>
          <span class="flex items-center text-green-500 text-sm">
        <span class="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
        实时
      </span>
        </div>
        <div ref="libraryChart" class="h-72"></div>
      </div>
      <!-- 图书馆在线人数 -->
      <div class="chart-card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">图书馆在线人数</h3>
          <span class="flex items-center text-green-500 text-sm">
        <span class="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
        实时
      </span>
        </div>
        <div ref="libraryChart" class="h-72"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onActivated, watch } from 'vue'
import * as echarts from 'echarts'
import api from '@/api'
import { TrendCharts, Refresh, FullScreen, Flag, Monitor } from '@element-plus/icons-vue'

defineOptions({
  name: 'Dashboard'
})

const roomUsagePeriod = ref('week')
const canteenCrowd = ref([])

const currentTime = ref('')
const isFullScreen = ref(false)

const statsCards = ref([
  { label: '在校学生', value: '12,580', change: 2.5, icon: 'User', gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e3a5f 100%)' },
  { label: '教职员工', value: '856', change: 1.2, icon: 'Avatar', gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' },
  { label: '今日课程', value: '328', change: -3.1, icon: 'Reading', gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)' },
  { label: '待办事项', value: '47', change: 15.3, icon: 'Bell', gradient: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)' },
  { label: 'xxxx', value: '?', change: 8.7, icon: 'Flag', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { label: 'xxxx', value: '?%', change: 0.3, icon: 'Monitor', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }
])

const refreshAllData = () => {
  fetchData()
  initRoomUsageChart()
  initHeatmapChart()
}

const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullScreen.value = true
  } else {
    document.exitFullscreen()
    isFullScreen.value = false
  }
}

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

const roomUsageChart = ref(null)
const heatmapChart = ref(null)

let charts = []

const initRoomUsageChart = () => {
  const chart = echarts.init(roomUsageChart.value)
  charts.push(chart)

  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['教学楼A', '教学楼B', '实验楼'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      {
        name: '教学楼A',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        data: [82, 85, 78, 90, 88, 45, 30]
      },
      {
        name: '教学楼B',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        data: [75, 80, 72, 85, 82, 40, 25]
      },
      {
        name: '实验楼',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        data: [60, 65, 70, 68, 72, 55, 35]
      }
    ]
  })
}

const initHeatmapChart = () => {
  const chart = echarts.init(heatmapChart.value)
  charts.push(chart)

  const locations = ['教学楼A', '教学楼B', '图书馆', '食堂', '体育馆', '宿舍区']
  const currentData = [850, 620, 430, 280, 150, 720]
  const maxCapacity = [1200, 800, 600, 500, 300, 1000]

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const idx = params[0].dataIndex
        const percent = Math.round((currentData[idx] / maxCapacity[idx]) * 100)
        return `${params[0].name}<br/>当前人数: <b>${currentData[idx]}</b> 人<br/>容量: ${maxCapacity[idx]} 人<br/>占比: <b>${percent}%</b>`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: locations, axisLabel: { interval: 0, rotate: 0 } },
    yAxis: { type: 'value', name: '人数', axisLabel: { formatter: '{value}' } },
    series: [
      {
        name: '当前人数',
        type: 'bar',
        data: currentData,
        barWidth: '50%',
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: (params) => {
            const percent = currentData[params.dataIndex] / maxCapacity[params.dataIndex]
            if (percent < 0.4) return new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#10b981' }, { offset: 1, color: '#34d399' }])
            if (percent < 0.7) return new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#f59e0b' }, { offset: 1, color: '#fbbf24' }])
            return new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#ef4444' }, { offset: 1, color: '#f87171' }])
          }
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params) => {
            const percent = Math.round((currentData[params.dataIndex] / maxCapacity[params.dataIndex]) * 100)
            return percent + '%'
          },
          fontSize: 12,
          fontWeight: 'bold'
        }
      }
    ]
  })
}

const getCrowdTagType = (level) => {
  if (level < 40) return 'success'
  if (level < 70) return 'warning'
  return 'danger'
}

const getCrowdText = (level) => {
  if (level < 40) return '空闲'
  if (level < 70) return '适中'
  return '拥挤'
}

const getCrowdColor = (level) => {
  if (level < 40) return '#10b981'
  if (level < 70) return '#f59e0b'
  return '#ef4444'
}
// 从后端抓取数据的方法
const fetchData = async () => {
  try {
    const [overviewRes, canteenRes] = await Promise.all([
      api.dashboard.overview(),
      api.services.canteenCrowd()
    ])

    if (overviewRes.success) {
      statsCards.value[0].value = overviewRes.data.total_students?.toLocaleString() || '12,580'
      statsCards.value[1].value = overviewRes.data.total_teachers?.toLocaleString() || '856'
      statsCards.value[2].value = overviewRes.data.total_courses?.toLocaleString() || '328'
      statsCards.value[3].value = overviewRes.data.pending_repairs?.toString() || '47'
    }

    if (canteenRes.success) {
      canteenCrowd.value = canteenRes.data
    }
  } catch (e) {
    canteenCrowd.value = [
      { id: 1, name: '第一食堂', crowd_level: 40, current_count: 320, capacity: 800 },
      { id: 2, name: '第二食堂', crowd_level: 30, current_count: 180, capacity: 600 },
      { id: 3, name: '教工食堂', crowd_level: 23, current_count: 45, capacity: 200 }
    ]
  }
}

const handleResize = () => {
  charts.forEach(chart => chart.resize())
}

let timeInterval = null

onMounted(() => {
  fetchData()
  initRoomUsageChart()
  initHeatmapChart()
  window.addEventListener('resize', handleResize)
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onActivated(() => {
  setTimeout(() => {
    charts.forEach(chart => {
      if (chart && !chart.isDisposed()) {
        chart.resize()
      }
    })
  }, 100)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach(chart => chart.dispose())
  if (timeInterval) clearInterval(timeInterval)
})

watch(roomUsagePeriod, () => {
  initRoomUsageChart()
})
</script>

<style scoped>
.dashboard-container {
  animation: fadeIn 0.5s ease-out;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  min-height: calc(100vh - 100px);
  padding: 24px;
  border-radius: 24px;
  position: relative;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.dashboard-title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px 0;
  background: linear-gradient(90deg, #fff, #a8edea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dashboard-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-actions .el-button {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

.header-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.25);
}

.dashboard-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
      radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 40%);
  border-radius: 24px;
  pointer-events: none;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  opacity: 0;
  transition: opacity 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border-color: rgba(102, 126, 234, 0.5);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-card p {
  color: #64748b !important;
}

.stat-card .text-3xl {
  color: #1e293b !important;
}

.chart-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.chart-card h3 {
  color: #1e293b !important;
}

.chart-card .text-gray-500 {
  color: #64748b !important;
}

.chart-card .bg-gray-50 {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0;
}

.chart-card .bg-gray-50:hover {
  background: #f1f5f9 !important;
}

.chart-card .text-gray-700 {
  color: #334155 !important;
}

.chart-card :deep(.el-progress-bar__outer) {
  background: #e2e8f0;
}

.grid {
  position: relative;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(102, 126, 234, 0.5);
  }
}
</style>