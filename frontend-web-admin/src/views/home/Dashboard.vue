<!-- frontend-web-admin/src/views/home/Dashboard.vue -->
<template>
  <div class="dashboard-container">
    <!-- 顶部标题区域 -->
    <div class="dashboard-header">
      <div class="header-info">
        <h1 class="dashboard-title">智评AI · 数据驾驶舱</h1>
        <p class="dashboard-subtitle">实时监控AI使用健康数据 · {{ currentTime }}</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Refresh" @click="refreshAllData">刷新数据</el-button>
        <el-button :icon="FullScreen" @click="toggleFullScreen">{{ isFullScreen ? '退出全屏' : '全屏显示' }}</el-button>
      </div>
    </div>

    <!-- 顶部统计卡片 - 6个核心指标 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
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

    <!-- 中部布局：左侧 AI健康概览 + 右侧 综合指标分析 -->
    <div class="dashboard-main">
      <div class="dashboard-left">
        <AIHealthOverview :compact="true" />
      </div>
      <div class="dashboard-right">
        <AIHealthAnalytics :compact="true" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onActivated } from 'vue'
import { ElMessage } from 'element-plus'
import { homeAPI } from '@/api/home'
import { TrendCharts, Refresh, FullScreen, User, Avatar, Reading, Bell, Flag, Monitor, DataAnalysis } from '@element-plus/icons-vue'
import AIHealthOverview from '@/views/home/AIHealthOverview.vue'
import AIHealthAnalytics from '@/views/home/AIHealthAnalytics.vue'

defineOptions({
  name: 'Dashboard'
})

const currentTime = ref('')
const isFullScreen = ref(false)

// 统计卡片数据 - 6个核心指标
const statsCards = ref([
  { label: '在校学生', value: '0', change: 0, icon: 'User', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: '教职员工', value: '0', change: 0, icon: 'Avatar', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: '活跃课程', value: '0', change: 0, icon: 'Reading', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { label: 'AI今日活跃', value: '0', change: 0, icon: 'DataAnalysis', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { label: 'AI覆盖率', value: '0%', change: 0, icon: 'Monitor', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { label: '本周预警', value: '0', change: 0, icon: 'Bell', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }
])

// 刷新所有数据
const refreshAllData = async () => {
  await fetchOverviewData()
  ElMessage.success('数据已刷新')
}

// 概览数据：统计卡片与 AI 使用指标统一取自 v2 首页聚合接口
const fetchOverviewData = async () => {
  try {
    const res = await homeAPI.dashboard()
    const data = res.data
    if (!data) return

    const stats = data.stats || {}
    statsCards.value[0].value = (stats.studentCount || 0).toLocaleString()
    statsCards.value[1].value = (stats.teacherCount || 0).toLocaleString()
    statsCards.value[2].value = (stats.totalCourses || 0).toLocaleString()

    const ai = data.aiStats || {}
    statsCards.value[3].value = (ai.activeToday || 0).toLocaleString()
    statsCards.value[4].value = `${ai.coverageRate || 0}%`
    statsCards.value[5].value = (ai.warningCount || 0).toLocaleString()
  } catch (e) {
    console.error('获取首页聚合数据失败:', e)
  }
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

let timeInterval = null

onMounted(() => {
  fetchOverviewData()
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onActivated(() => {
  // 从 keep-alive 缓存激活时，刷新数据
  fetchOverviewData()
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
})
</script>

<style scoped>
.dashboard-container {
  animation: fadeIn 0.5s ease-out;
  background: linear-gradient(135deg, #cde8f5 0%, #d4f1f9 100%);
  min-height: calc(100vh - 100px);
  padding: 24px;
  border-radius: 24px;
  position: relative;
  overflow-x: hidden;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.dashboard-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 4px 0;
  background: linear-gradient(135deg, #2c7bb6 0%, #3ba8a8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dashboard-subtitle {
  font-size: 14px;
  color: #4a7c8c;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-actions .el-button {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(100, 180, 200, 0.3);
  color: #2c7bb6;
}

.header-actions .el-button:hover {
  background: white;
  border-color: #5aa9d6;
  color: #3ba8a8;
}

/* 统计卡片 */
.stat-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 20px;
  padding: 20px;
  border: 1px solid rgba(128, 188, 218, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(60, 140, 180, 0.1);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gradient);
  opacity: 0;
  transition: opacity 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(60, 140, 180, 0.15);
  border-color: rgba(108, 168, 202, 0.5);
}

.stat-card p {
  color: #5c8a9a !important;
}

.stat-card .text-2xl {
  color: #2c6e8f !important;
}

/* 主内容区域 */
.dashboard-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 24px;
}

.dashboard-left,
.dashboard-right {
  min-width: 0;
}

/* 响应式 */
@media (max-width: 1200px) {
  .dashboard-main {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 修复蓝色按钮样式 */
.header-actions .el-button--primary,
.header-actions .el-button--default {
  background: white !important;
  border: 1px solid #5aa9d6 !important;
  color: #2c7bb6 !important;
}

.header-actions .el-button--primary:hover,
.header-actions .el-button--default:hover {
  background: #e8f4f8 !important;
  border-color: #3ba8a8 !important;
}

.grid {
  display: grid;
}
</style>