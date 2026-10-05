<template>
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
      <el-button type="primary" text size="small" @click="emit('view-all')">
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
        <el-button size="small" type="primary" plain @click="emit('show-detail', warning)">
          查看详情
        </el-button>
      </div>
      <div v-if="warnings.length === 0" class="empty-warning">
        <el-icon><SuccessFilled /></el-icon>
        <span>暂无预警，保持现状</span>
      </div>
    </div>
  </div>

  <!-- 学生详情弹窗 -->
  <el-dialog
      :model-value="showDetailDialog"
      :title="selectedWarning?.studentName + ' - 详情'"
      width="700px"
      class="student-detail-dialog"
      @update:model-value="emit('update:showDetailDialog', $event)"
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
        <el-tabs :model-value="activeTab" @update:model-value="emit('update:activeTab', $event)">
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
                <el-button type="primary" @click="emit('warning-action', selectedWarning, 'message')">
                  <el-icon><ChatDotRound /></el-icon> 发送提醒
                </el-button>
                <el-button type="danger" plain @click="emit('warning-action', selectedWarning, 'meeting')">
                  <el-icon><User /></el-icon> 安排面谈
                </el-button>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { WarningFilled, ArrowRight, SuccessFilled, ChatDotRound, User } from '@element-plus/icons-vue'

const props = defineProps({
  warnings: { type: Array, default: () => [] },
  getWarningTagType: { type: Function, required: true },
  getDependenceClass: { type: Function, required: true },
  showDetailDialog: { type: Boolean, default: false },
  selectedWarning: { type: Object, default: null },
  studentDetail: { type: Object, default: null },
  detailLoading: { type: Boolean, default: false },
  activeTab: { type: String, default: 'score' }
})

const emit = defineEmits([
  'update:showDetailDialog',
  'update:activeTab',
  'view-all',
  'show-detail',
  'warning-action'
])

// 图表引用
const scoreChartRef = ref(null)
const usageChartRef = ref(null)
let scoreChart = null
let usageChart = null

// 渲染成绩趋势图
const renderScoreChart = () => {
  if (!scoreChartRef.value || !props.studentDetail?.scoreTrend) return
  if (scoreChart) scoreChart.dispose()

  scoreChart = echarts.init(scoreChartRef.value)
  const data = props.studentDetail.scoreTrend
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
  if (!usageChartRef.value || !props.studentDetail?.aiUsageComposition) return
  if (usageChart) usageChart.dispose()

  usageChart = echarts.init(usageChartRef.value)
  usageChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['45%', '50%'],
      data: props.studentDetail.aiUsageComposition,
      label: { show: true, formatter: '{b}: {d}%' },
      emphasis: { scale: true }
    }]
  })
}

// 学生详情变化后渲染图表（等价于原父组件在设置详情后的 nextTick 渲染）
watch(() => props.studentDetail, () => {
  nextTick(() => {
    renderScoreChart()
    renderUsageChart()
  })
})

// 窗口自适应
const handleResize = () => {
  scoreChart?.resize()
  usageChart?.resize()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  scoreChart?.dispose()
  usageChart?.dispose()
})
</script>

<style scoped>
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

.header-icon.red { background: linear-gradient(135deg, #f093fb, #f5576c); }

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
</style>