<!-- frontend-web-admin/src/views/ai-health/components/AIHealthStudentQuery.vue -->
<template>
  <el-card class="student-query-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>🔍 学生详情查询</span>
        <el-button size="small" @click="refreshStudents" :loading="loading">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>
    </template>

    <div class="query-tools">
      <el-input
          v-model="keyword"
          placeholder="输入姓名/学号搜索..."
          clearable
          class="query-input"
          @input="handleSearchInput"
          @keyup.enter="fetchStudents"
      />
      <el-button type="primary" @click="fetchStudents" :loading="loading">
        查询
      </el-button>
    </div>

    <div class="query-content" v-loading="loading">
      <!-- 学生列表 -->
      <div class="student-list-panel">
        <div class="panel-title">
          <span>学生列表</span>
          <span class="student-count">共 {{ students.length }} 人</span>
        </div>
        <div class="student-list">
          <div
              v-for="s in students"
              :key="s.id"
              class="student-item"
              :class="{ active: selectedStudent?.id === s.id }"
              @click="loadDetail(s.id)"
          >
            <div class="student-avatar">
              {{ s.name?.charAt(0) || '?' }}
            </div>
            <div class="student-info">
              <span class="student-name">{{ s.name }}</span>
              <span class="student-id">{{ s.studentId }}</span>
            </div>
            <el-tag v-if="s.dependenceLevel" size="small" :type="getLevelType(s.dependenceLevel)">
              {{ s.dependenceLevel }}
            </el-tag>
          </div>
          <div v-if="!students.length && !loading" class="empty-list">
            <el-empty description="暂无学生数据" :image-size="80" />
          </div>
        </div>
      </div>

      <!-- 学生详情 -->
      <div class="student-detail-panel" v-if="selectedStudent">
        <div class="detail-header">
          <div class="student-basic">
            <div class="basic-avatar">
              {{ selectedStudent.name?.charAt(0) }}
            </div>
            <div class="basic-info">
              <h3>{{ selectedStudent.name }}</h3>
              <p>{{ selectedStudent.studentId }} · {{ selectedStudent.department }}</p>
            </div>
          </div>
          <div class="basic-stats">
            <div class="stat-badge">
              <span class="stat-label">依赖指数</span>
              <span class="stat-value" :class="getDependenceClass(selectedStudent.dependenceIndex)">
                {{ selectedStudent.dependenceIndex }}
              </span>
              <el-tag size="small" :type="getLevelType(selectedStudent.dependenceLevel)">
                {{ selectedStudent.dependenceLevel }}依赖
              </el-tag>
            </div>
            <div class="stat-badge">
              <span class="stat-label">作业相似度</span>
              <span class="stat-value">{{ selectedStudent.homeworkSimilarity }}%</span>
            </div>
            <div class="stat-badge">
              <span class="stat-label">目标进度</span>
              <span class="stat-value">{{ selectedStudent.goalProgress }}%</span>
            </div>
          </div>
        </div>

        <div class="detail-charts">
          <div class="chart-card">
            <div class="chart-title">
              <span class="title-icon">📈</span>
              <span>成绩监控趋势（近5周）</span>
            </div>
            <div ref="studentScoreRef" class="chart-box"></div>
          </div>
          <div class="chart-card">
            <div class="chart-title">
              <span class="title-icon">🥧</span>
              <span>AI使用构成分析</span>
            </div>
            <div ref="studentUsagePieRef" class="chart-box"></div>
          </div>
        </div>
      </div>
      <div v-else class="empty-detail">
        <el-empty description="请选择一位学生查看详情" :image-size="100" />
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import api from '@/api'
import { Refresh } from '@element-plus/icons-vue'

const loading = ref(false)
const keyword = ref('')
const students = ref([])
const selectedStudent = ref(null)

// 图表引用
const studentScoreRef = ref(null)
const studentUsagePieRef = ref(null)
let chartInstances = []

// 辅助函数
const getLevelType = (level) => {
  if (level === '轻度') return 'success'
  if (level === '中度') return 'warning'
  if (level === '重度') return 'danger'
  return 'info'
}

const getDependenceClass = (score) => {
  if (score >= 80) return 'heavy'
  if (score >= 50) return 'medium'
  return 'light'
}

// 刷新学生列表
const refreshStudents = () => {
  fetchStudents()
}

// 获取学生列表
const fetchStudents = async () => {
  loading.value = true
  try {
    const res = await api.aiHealth.students({ keyword: keyword.value })
    if (res.success) {
      students.value = res.data || []
      // 如果当前选中的学生不在新列表中，清空详情
      if (selectedStudent.value && !students.value.find(s => s.id === selectedStudent.value.id)) {
        selectedStudent.value = null
      }
    }
  } catch (e) {
    console.error('获取学生列表失败:', e)
  } finally {
    loading.value = false
  }
}

// 渲染成绩趋势图
const renderScoreTrendChart = () => {
  if (!studentScoreRef.value || !selectedStudent.value?.scoreTrend?.length) return

  const chart = echarts.init(studentScoreRef.value)
  const data = selectedStudent.value.scoreTrend
  const xAxisData = data.map((_, i) => `第${i + 1}周`)

  chart.setOption({
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
  chartInstances.push(chart)
}

// 渲染 AI 使用构成饼图
const renderUsagePieChart = () => {
  if (!studentUsagePieRef.value || !selectedStudent.value?.aiUsageComposition?.length) return

  const chart = echarts.init(studentUsagePieRef.value)
  const data = selectedStudent.value.aiUsageComposition

  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['45%', '50%'],
      data: data,
      label: { show: true, formatter: '{b}: {d}%' },
      emphasis: { scale: true }
    }]
  })
  chartInstances.push(chart)
}

// 加载学生详情
const loadDetail = async (id) => {
  loading.value = true
  try {
    const res = await api.aiHealth.studentDetail(id)
    if (res.success) {
      selectedStudent.value = res.data
      // 等待 DOM 更新后渲染图表
      await nextTick()
      // 清理旧图表
      chartInstances.forEach(chart => chart?.dispose())
      chartInstances = []
      // 渲染新图表
      renderScoreTrendChart()
      renderUsagePieChart()
    }
  } catch (e) {
    console.error('加载学生详情失败:', e)
  } finally {
    loading.value = false
  }
}

// 窗口自适应
const handleResize = () => {
  chartInstances.forEach(chart => chart?.resize())
}

// 初始化加载
const init = () => {
  fetchStudents()
  window.addEventListener('resize', handleResize)
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstances.forEach(chart => chart?.dispose())
  chartInstances = []
})

let debounceTimer = null
const handleSearchInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchStudents()
  }, 300)
}

init()
</script>

<style scoped>
.student-query-card :deep(.el-card__header) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.query-tools {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.query-input {
  flex: 1;
  max-width: 300px;
}

.query-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
  min-height: 450px;
}

/* 学生列表面板 */
.student-list-panel {
  background: #f8fafc;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.panel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  color: #334155;
}

.student-count {
  font-size: 12px;
  font-weight: normal;
  color: #94a3b8;
}

.student-list {
  max-height: 500px;
  overflow-y: auto;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s;
}

.student-item:hover {
  background: #f1f5f9;
}

.student-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-left: 3px solid #667eea;
}

.student-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.student-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.student-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.student-id {
  font-size: 11px;
  color: #94a3b8;
}

.empty-list {
  padding: 40px 20px;
}

/* 学生详情面板 */
.student-detail-panel {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.detail-header {
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.student-basic {
  display: flex;
  align-items: center;
  gap: 16px;
}

.basic-avatar {
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

.basic-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.basic-info p {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.basic-stats {
  display: flex;
  gap: 20px;
}

.stat-badge {
  text-align: center;
  padding: 8px 16px;
  background: white;
  border-radius: 12px;
  min-width: 100px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stat-badge .stat-label {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.stat-badge .stat-value {
  display: inline-block;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin-right: 8px;
}

.stat-value.light { color: #10b981; }
.stat-value.medium { color: #f59e0b; }
.stat-value.heavy { color: #ef4444; }

/* 详情图表 */
.detail-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
}

.chart-card {
  background: #f8fafc;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  color: #334155;
}

.title-icon {
  font-size: 16px;
}

.chart-box {
  width: 100%;
  height: 240px;
}

.empty-detail {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 450px;
}

/* 响应式 */
@media (max-width: 900px) {
  .query-content {
    grid-template-columns: 1fr;
  }
  .detail-charts {
    grid-template-columns: 1fr;
  }
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>