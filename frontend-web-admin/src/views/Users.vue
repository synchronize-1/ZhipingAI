<!-- frontend-web-admin/src/views/Users.vue -->
<template>
  <div class="users-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h1>👥 用户管理</h1>
        <p>查看和管理学生信息、AI依赖指数</p>
      </div>
    </div>

    <div class="users-container">
      <!-- 左侧：学生列表 -->
      <div class="students-list-panel">
        <div class="panel-header">
          <div class="search-area">
            <el-input
                v-model="keyword"
                placeholder="搜索姓名/学号..."
                clearable
                prefix-icon="Search"
                class="search-input"
                @keyup.enter="fetchStudents"
                @clear="fetchStudents"
            />
            <el-button type="primary" @click="fetchStudents" :loading="loading">
              <el-icon><Search /></el-icon> 搜索
            </el-button>
          </div>
          <div class="pagination-area">
            <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="total"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next"
                @change="fetchStudents"
                small
            />
          </div>
        </div>

        <div class="students-list" v-loading="loading">
          <div
              v-for="student in students"
              :key="student.id"
              class="student-item"
              :class="{ active: selectedStudent?.id === student.id }"
              @click="selectStudent(student)"
          >
            <div class="student-avatar">
              {{ student.name?.charAt(0) || '?' }}
            </div>
            <div class="student-info">
              <div class="student-name">
                {{ student.name }}
                <el-tag
                    :type="getDependenceTagType(student.dependenceLevel)"
                    size="small"
                    class="dependence-tag"
                >
                  {{ student.dependenceLevel || '未评估' }}
                </el-tag>
              </div>
              <div class="student-meta">
                <span class="student-id">{{ student.studentId }}</span>
                <span class="student-class">{{ student.className || student.department }}</span>
              </div>
            </div>
            <div class="student-score" v-if="student.dependenceScore">
              <span class="score-value" :class="getDependenceScoreClass(student.dependenceScore)">
                {{ student.dependenceScore }}
              </span>
              <span class="score-label">依赖指数</span>
            </div>
          </div>

          <div v-if="!students.length && !loading" class="empty-state">
            <el-empty description="暂无学生数据" :image-size="80" />
          </div>
        </div>
      </div>

      <!-- 右侧：学生详情 -->
      <div class="student-detail-panel" v-if="selectedStudent">
        <div class="detail-header">
          <div class="detail-title">
            <h2>学生详情</h2>
            <el-button type="danger" link @click="closeDetail">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>

        <div class="detail-content" v-loading="detailLoading">
          <!-- 基本信息卡片 -->
          <div class="info-card">
            <div class="card-header">
              <span class="card-title">📋 基本信息</span>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">姓名</span>
                <span class="info-value">{{ selectedStudent.name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">学号</span>
                <span class="info-value">{{ selectedStudent.studentId }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">班级</span>
                <span class="info-value">{{ selectedStudent.className || selectedStudent.department || '未分配' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">邮箱</span>
                <span class="info-value">{{ selectedStudent.email || '未填写' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">手机号</span>
                <span class="info-value">{{ selectedStudent.phone || '未填写' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">注册时间</span>
                <span class="info-value">{{ formatDate(selectedStudent.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- AI依赖指数卡片 -->
          <div class="dependence-card">
            <div class="card-header">
              <span class="card-title">🤖 AI依赖指数</span>
            </div>
            <div class="dependence-content">
              <div class="dependence-score">
                <div class="score-ring">
                  <el-progress
                      type="circle"
                      :percentage="dependencePercentage"
                      :width="120"
                      :stroke-width="12"
                      :color="dependenceColor"
                  >
                    <template #default>
                      <span class="ring-value">{{ selectedStudentDetail?.dependenceIndex || selectedStudent.dependenceScore || '--' }}</span>
                    </template>
                  </el-progress>
                </div>
                <div class="score-info">
                  <el-tag :type="getDependenceTagType(selectedStudentDetail?.dependenceLevel || selectedStudent.dependenceLevel)" size="large">
                    {{ selectedStudentDetail?.dependenceLevel || selectedStudent.dependenceLevel || '未评估' }}依赖
                  </el-tag>
                  <p class="score-desc">基于AI使用频率、学习行为等维度综合评估</p>
                </div>
              </div>
              <!-- 状态指示条 - 手动实现，避免 el-progress color 问题 -->
              <div class="dependence-status">
                <div class="status-labels">
                  <span>轻度依赖</span>
                  <span>中度依赖</span>
                  <span>重度依赖</span>
                </div>
                <div class="status-bar-wrapper">
                  <div class="status-bar">
                    <div class="status-fill" :style="{ width: dependencePercentage + '%', background: dependenceColor }"></div>
                  </div>
                  <div class="status-marker" :style="{ left: dependencePercentage + '%' }">
                    <div class="marker-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 成绩趋势图 -->
          <div class="chart-card">
            <div class="card-header">
              <span class="card-title">📈 成绩趋势</span>
              <span class="card-subtitle">近5周成绩变化</span>
            </div>
            <div ref="scoreTrendChartRef" class="chart-box"></div>
          </div>

          <!-- AI使用构成 + 目标进度 -->
          <div class="two-columns">
            <div class="chart-card half">
              <div class="card-header">
                <span class="card-title">🥧 AI使用构成</span>
              </div>
              <div ref="usagePieChartRef" class="chart-box-small"></div>
            </div>

            <div class="progress-card half">
              <div class="card-header">
                <span class="card-title">🎯 学习目标进度</span>
              </div>
              <div class="progress-content">
                <div class="goal-progress">
                  <div class="goal-value">{{ selectedStudentDetail?.goalProgress || 72 }}%</div>
                  <el-progress
                      :percentage="selectedStudentDetail?.goalProgress || 72"
                      :stroke-width="12"
                      :color="goalProgressColor"
                  />
                  <p class="goal-desc">基于课程完成度和学习时长综合评估</p>
                </div>
                <div class="goal-tips">
                  <el-icon><InfoFilled /></el-icon>
                  <span>建议每周使用AI辅助学习不超过10小时，保持独立思考习惯</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 预警建议（如果有） -->
          <div class="warning-card" v-if="studentWarning">
            <div class="card-header">
              <span class="card-title">⚠️ 预警建议</span>
              <el-tag :type="getDependenceTagType(studentWarning.level)" size="small">
                {{ studentWarning.level }}预警
              </el-tag>
            </div>
            <div class="warning-content">
              <p><strong>触发条件：</strong>{{ studentWarning.trigger }}</p>
              <p><strong>建议措施：</strong>{{ studentWarning.suggestion }}</p>
              <div class="warning-actions">
                <el-button type="primary" plain size="small" @click="sendReminder">
                  <el-icon><ChatDotRound /></el-icon> 发送提醒
                </el-button>
                <el-button type="warning" plain size="small" @click="viewDetailReport">
                  <el-icon><View /></el-icon> 查看详细报告
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-detail-panel">
        <el-empty description="请从左侧选择学生查看详情" :image-size="120" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import api from '@/api'
import { ElMessage } from 'element-plus'
import { Search, Close, ChatDotRound, View, InfoFilled } from '@element-plus/icons-vue'

defineOptions({ name: 'Users' })

// 数据状态
const loading = ref(false)
const detailLoading = ref(false)
const students = ref([])
const selectedStudent = ref(null)
const selectedStudentDetail = ref(null)
const studentWarning = ref(null)
const keyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 图表引用
const scoreTrendChartRef = ref(null)
const usagePieChartRef = ref(null)
let scoreChart = null
let pieChart = null

// 依赖程度计算
const dependencePercentage = ref(0)
const dependenceColor = ref('#f59e0b')

// 进度条颜色（字符串格式）
const goalProgressColor = '#667eea'

const getDependenceTagType = (level) => {
  if (level === '轻度') return 'success'
  if (level === '中度') return 'warning'
  if (level === '重度') return 'danger'
  return 'info'
}

const getDependenceScoreClass = (score) => {
  if (score >= 80) return 'heavy'
  if (score >= 50) return 'medium'
  return 'light'
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '未知'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('zh-CN')
}

// 获取学生列表
const fetchStudents = async () => {
  loading.value = true
  try {
    const res = await api.aiHealth.students({
      keyword: keyword.value,
      page: currentPage.value,
      limit: pageSize.value
    })
    if (res.success) {
      students.value = res.data || []
      total.value = res.total || students.value.length
    } else {
      ElMessage.error(res.message || '获取学生列表失败')
    }
  } catch (e) {
    console.error('获取学生列表失败:', e)
    ElMessage.error('获取学生列表失败')
  } finally {
    loading.value = false
  }
}

// 获取学生详情
const fetchStudentDetail = async (id) => {
  detailLoading.value = true
  try {
    const res = await api.aiHealth.studentDetail(id)
    if (res.success) {
      selectedStudentDetail.value = res.data

      // 计算依赖指数百分比（0-100）
      if (res.data.dependenceIndex) {
        const index = res.data.dependenceIndex
        dependencePercentage.value = Math.min(100, (index / 100) * 100)
        if (index >= 80) dependenceColor.value = '#ef4444'
        else if (index >= 50) dependenceColor.value = '#f59e0b'
        else dependenceColor.value = '#10b981'
      }

      // 获取预警信息
      await fetchStudentWarning(id)

      // 等待 DOM 更新后渲染图表
      await nextTick()
      // 延迟一下确保 DOM 元素已渲染
      setTimeout(() => {
        renderScoreTrendChart()
        renderUsagePieChart()
      }, 100)
    }
  } catch (e) {
    console.error('获取学生详情失败:', e)
  } finally {
    detailLoading.value = false
  }
}

// 获取学生预警信息
const fetchStudentWarning = async (id) => {
  try {
    const res = await api.aiHealth.warnings()
    if (res.success && res.data) {
      const warning = res.data.find(w => w.studentName === selectedStudent.value?.name)
      studentWarning.value = warning || null
    }
  } catch (e) {
    console.error('获取预警信息失败:', e)
  }
}

// 选择学生
const selectStudent = async (student) => {
  if (selectedStudent.value?.id === student.id) return
  selectedStudent.value = student
  selectedStudentDetail.value = null
  studentWarning.value = null

  // 清空之前的图表实例
  if (scoreChart) {
    scoreChart.dispose()
    scoreChart = null
  }
  if (pieChart) {
    pieChart.dispose()
    pieChart = null
  }

  await fetchStudentDetail(student.id)
}

// 关闭详情
const closeDetail = () => {
  selectedStudent.value = null
  selectedStudentDetail.value = null
  studentWarning.value = null
  if (scoreChart) {
    scoreChart.dispose()
    scoreChart = null
  }
  if (pieChart) {
    pieChart.dispose()
    pieChart = null
  }
}

// 渲染成绩趋势图
const renderScoreTrendChart = () => {
  if (!scoreTrendChartRef.value) {
    console.warn('scoreTrendChartRef is not ready')
    return
  }

  try {
    if (scoreChart) {
      scoreChart.dispose()
    }

    scoreChart = echarts.init(scoreTrendChartRef.value)
    const scoreTrend = selectedStudentDetail.value?.scoreTrend || [72, 73, 74, 75, 76]
    const xAxisData = scoreTrend.map((_, i) => `第${i + 1}周`)

    scoreChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: xAxisData },
      yAxis: { type: 'value', name: '成绩', min: 0, max: 100 },
      series: [{
        type: 'line',
        smooth: true,
        data: scoreTrend,
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
  } catch (e) {
    console.error('渲染成绩趋势图失败:', e)
  }
}

// 渲染AI使用构成饼图
const renderUsagePieChart = () => {
  if (!usagePieChartRef.value) {
    console.warn('usagePieChartRef is not ready')
    return
  }

  try {
    if (pieChart) {
      pieChart.dispose()
    }

    pieChart = echarts.init(usagePieChartRef.value)
    const data = selectedStudentDetail.value?.aiUsageComposition || [
      { name: 'AI完成作业/编程', value: 55 },
      { name: '自主学习+AI辅助', value: 45 }
    ]

    pieChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '50%'],
        data: data,
        label: { show: true, formatter: '{b}: {d}%', fontSize: 11 },
        emphasis: { scale: true }
      }]
    })
  } catch (e) {
    console.error('渲染饼图失败:', e)
  }
}

// 发送提醒
const sendReminder = () => {
  ElMessage.success(`已向 ${selectedStudent.value?.name} 发送学习提醒`)
}

// 查看详细报告
const viewDetailReport = () => {
  ElMessage.info('详细报告功能开发中...')
}

// 窗口自适应
const handleResize = () => {
  if (scoreChart) scoreChart.resize()
  if (pieChart) pieChart.resize()
}

// 监听搜索关键词变化
watch(keyword, () => {
  currentPage.value = 1
  fetchStudents()
})

// 初始加载
onMounted(() => {
  fetchStudents()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (scoreChart) scoreChart.dispose()
  if (pieChart) pieChart.dispose()
})
</script>

<style scoped>
.users-management {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 8px 0;
}

.page-header p {
  color: #64748b;
  margin: 0;
}

/* 主容器 - 左右布局 */
.users-container {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;
  min-height: calc(100vh - 120px);
}

/* 左侧学生列表 */
.students-list-panel {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.search-area {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.search-input {
  flex: 1;
}

.students-list {
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 240px);
}

.student-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s;
}

.student-item:hover {
  background: #f8fafc;
}

.student-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-left: 3px solid #667eea;
}

.student-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.student-info {
  flex: 1;
  min-width: 0;
}

.student-name {
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dependence-tag {
  font-size: 10px;
}

.student-meta {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 12px;
  color: #94a3b8;
}

.student-id {
  font-family: monospace;
}

.student-score {
  text-align: right;
  flex-shrink: 0;
}

.score-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
}

.score-value.light { color: #10b981; }
.score-value.medium { color: #f59e0b; }
.score-value.heavy { color: #ef4444; }

.score-label {
  font-size: 10px;
  color: #94a3b8;
}

/* 右侧详情面板 */
.student-detail-panel {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
  max-height: calc(100vh - 120px);
}

.empty-detail-panel {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
}

.detail-header {
  position: sticky;
  top: 0;
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  z-index: 10;
}

.detail-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-title h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.detail-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 卡片样式 */
.info-card,
.dependence-card,
.chart-card,
.progress-card,
.warning-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.card-header {
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-weight: 600;
  color: #1e293b;
}

.card-subtitle {
  font-size: 12px;
  color: #94a3b8;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #94a3b8;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

/* 依赖指数卡片 - 修复 el-progress color 问题 */
.dependence-content {
  padding: 24px;
}

.dependence-score {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.score-ring {
  flex-shrink: 0;
}

.ring-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.score-info {
  flex: 1;
}

.score-desc {
  margin-top: 8px;
  font-size: 13px;
  color: #64748b;
}

/* 手动实现的状态条（避免 el-progress color 问题） */
.dependence-status {
  margin-top: 8px;
}

.status-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.status-bar-wrapper {
  position: relative;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
}

.status-bar {
  position: relative;
  width: 100%;
  height: 100%;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.status-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.status-marker {
  position: absolute;
  top: -4px;
  transform: translateX(-50%);
  transition: left 0.3s;
}

.marker-dot {
  width: 10px;
  height: 10px;
  background: #667eea;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* 图表 */
.chart-box {
  width: 100%;
  height: 280px;
  padding: 16px;
}

.chart-box-small {
  width: 100%;
  height: 220px;
  padding: 16px;
}

/* 两列布局 */
.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.half {
  width: 100%;
}

/* 目标进度卡片 */
.progress-content {
  padding: 20px;
}

.goal-progress {
  text-align: center;
  margin-bottom: 20px;
}

.goal-value {
  font-size: 48px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 16px;
}

.goal-desc {
  font-size: 13px;
  color: #64748b;
  margin-top: 12px;
}

.goal-tips {
  background: #f0fdf4;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #15803d;
}

/* 预警卡片 */
.warning-content {
  padding: 20px;
}

.warning-content p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #475569;
}

.warning-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .users-container {
    grid-template-columns: 1fr;
  }

  .students-list-panel {
    max-height: 400px;
  }

  .students-list {
    max-height: 300px;
  }

  .student-detail-panel {
    max-height: none;
  }

  .two-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .dependence-score {
    flex-direction: column;
    text-align: center;
  }
}
</style>