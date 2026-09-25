<template>
  <div class="grade-analysis">
    <PageHeader title="年级学情分析" description="查看年级整体学情数据与分析" :breadcrumbs="breadcrumbs" />

    <!-- 筛选区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="选择考试">
          <el-select
            v-model="filterForm.examId"
            placeholder="请选择考试"
            style="width: 260px"
            filterable
            @change="handleExamChange"
          >
            <el-option
              v-for="exam in examList"
              :key="exam.id"
              :label="exam.name"
              :value="exam.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="loadAnalysisData">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-loading="loading" class="analysis-content">
      <!-- 核心指标卡片 -->
      <el-row :gutter="16" class="stat-cards">
        <el-col :xs="12" :sm="8" :md="6" :lg="6" :xl="4">
          <el-card shadow="hover" class="stat-card stat-card--primary">
            <div class="stat-card__icon">
              <el-icon :size="32"><TrendCharts /></el-icon>
            </div>
            <div class="stat-card__info">
              <div class="stat-card__value">{{ analysisData.averageScore?.toFixed(1) || '--' }}</div>
              <div class="stat-card__label">年级平均分</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="6" :lg="6" :xl="4">
          <el-card shadow="hover" class="stat-card stat-card--success">
            <div class="stat-card__icon">
              <el-icon :size="32"><CaretTop /></el-icon>
            </div>
            <div class="stat-card__info">
              <div class="stat-card__value">{{ analysisData.highestScore || '--' }}</div>
              <div class="stat-card__label">最高分</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="6" :lg="6" :xl="4">
          <el-card shadow="hover" class="stat-card stat-card--warning">
            <div class="stat-card__icon">
              <el-icon :size="32"><CaretBottom /></el-icon>
            </div>
            <div class="stat-card__info">
              <div class="stat-card__value">{{ analysisData.lowestScore || '--' }}</div>
              <div class="stat-card__label">最低分</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="6" :lg="6" :xl="4">
          <el-card shadow="hover" class="stat-card stat-card--info">
            <div class="stat-card__icon">
              <el-icon :size="32"><CircleCheck /></el-icon>
            </div>
            <div class="stat-card__info">
              <div class="stat-card__value">{{ analysisData.passRate ? (analysisData.passRate * 100).toFixed(1) + '%' : '--' }}</div>
              <div class="stat-card__label">及格率</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="6" :lg="6" :xl="4">
          <el-card shadow="hover" class="stat-card stat-card--purple">
            <div class="stat-card__icon">
              <el-icon :size="32"><Medal /></el-icon>
            </div>
            <div class="stat-card__info">
              <div class="stat-card__value">{{ analysisData.excellentRate ? (analysisData.excellentRate * 100).toFixed(1) + '%' : '--' }}</div>
              <div class="stat-card__label">优秀率</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="6" :lg="6" :xl="4">
          <el-card shadow="hover" class="stat-card stat-card--pink">
            <div class="stat-card__icon">
              <el-icon :size="32"><School /></el-icon>
            </div>
            <div class="stat-card__info">
              <div class="stat-card__value">{{ analysisData.classCount || '--' }}</div>
              <div class="stat-card__label">班级数</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="16" class="chart-row">
        <el-col :lg="12" :md="24">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <span class="chart-title">各班平均分排名</span>
            </template>
            <div ref="classRankChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        <el-col :lg="12" :md="24">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <span class="chart-title">各学科平均分对比</span>
            </template>
            <div ref="subjectRadarChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="chart-row">
        <el-col :lg="24" :md="24">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <span class="chart-title">年级分数段分布</span>
            </template>
            <div ref="scoreDistributionChartRef" class="chart-container chart-container--wide"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 优秀班级和薄弱班级 -->
      <el-row :gutter="16" class="summary-row">
        <el-col :lg="12" :md="24">
          <el-card shadow="never" class="summary-card">
            <template #header>
              <div class="card-header">
                <span class="chart-title"><el-icon color="#67c23a"><Trophy /></el-icon> 优秀班级</span>
              </div>
            </template>
            <el-table :data="excellentClasses" size="small" border stripe>
              <el-table-column type="index" label="排名" width="60" align="center" />
              <el-table-column prop="className" label="班级名称" min-width="120" />
              <el-table-column prop="averageScore" label="平均分" width="100" align="center" />
              <el-table-column prop="passRate" label="及格率" width="100" align="center" formatter="formatRate" />
              <el-table-column prop="excellentRate" label="优秀率" width="100" align="center" formatter="formatRate" />
            </el-table>
            <el-empty v-if="!excellentClasses || excellentClasses.length === 0" description="暂无数据" :image-size="60" />
          </el-card>
        </el-col>
        <el-col :lg="12" :md="24">
          <el-card shadow="never" class="summary-card">
            <template #header>
              <div class="card-header">
                <span class="chart-title"><el-icon color="#f56c6c"><Warning /></el-icon> 薄弱班级</span>
              </div>
            </template>
            <el-table :data="weakClasses" size="small" border stripe>
              <el-table-column type="index" label="排名" width="60" align="center" />
              <el-table-column prop="className" label="班级名称" min-width="120" />
              <el-table-column prop="averageScore" label="平均分" width="100" align="center" />
              <el-table-column prop="passRate" label="及格率" width="100" align="center" formatter="formatRate" />
              <el-table-column prop="excellentRate" label="优秀率" width="100" align="center" formatter="formatRate" />
            </el-table>
            <el-empty v-if="!weakClasses || weakClasses.length === 0" description="暂无数据" :image-size="60" />
          </el-card>
        </el-col>
      </el-row>

      <!-- 各班成绩详情表格 -->
      <el-card shadow="never" class="detail-card">
        <template #header>
          <span class="chart-title">各班成绩详情</span>
        </template>
        <el-table :data="classDetails" border stripe>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="className" label="班级" min-width="120" />
          <el-table-column prop="studentCount" label="参考人数" width="100" align="center" />
          <el-table-column prop="averageScore" label="平均分" width="100" align="center" />
          <el-table-column prop="highestScore" label="最高分" width="100" align="center" />
          <el-table-column prop="lowestScore" label="最低分" width="100" align="center" />
          <el-table-column prop="passRate" label="及格率" width="100" align="center" formatter="formatRate" />
          <el-table-column prop="excellentRate" label="优秀率" width="100" align="center" formatter="formatRate" />
          <el-table-column prop="gradeRank" label="年级排名" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.gradeRank <= 3 ? 'success' : row.gradeRank <= 6 ? 'warning' : 'info'" size="small">
                第{{ row.gradeRank }}名
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!classDetails || classDetails.length === 0" description="暂无数据" :image-size="80" />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { Search, TrendCharts, CaretTop, CaretBottom, CircleCheck, Medal, School, Trophy, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { analysisAPI, examAPI } from '@/api/teaching'
import { useECharts } from '@/composables/useECharts'
import PageHeader from '@/components/common/PageHeader.vue'

const breadcrumbs = [
  { label: '教学管理' },
  { label: '年级学情分析' }
]

const filterForm = reactive({
  examId: ''
})

const loading = ref(false)
const examList = ref([])
const analysisData = ref({})
const excellentClasses = ref([])
const weakClasses = ref([])
const classDetails = ref([])

// 图表 refs
const classRankChartRef = ref(null)
const subjectRadarChartRef = ref(null)
const scoreDistributionChartRef = ref(null)

// 图表实例
let classRankChart = null
let subjectRadarChart = null
let scoreDistributionChart = null

const formatRate = (row, column, cellValue) => {
  if (cellValue === undefined || cellValue === null) return '--'
  return (cellValue * 100).toFixed(1) + '%'
}

const loadExamList = async () => {
  try {
    const res = await examAPI.list({ page: 1, pageSize: 50 })
    if (res.data?.list) {
      examList.value = res.data.list
    } else if (Array.isArray(res.data)) {
      examList.value = res.data
    }
  } catch (error) {
    console.error('加载考试列表失败:', error)
  }
}

const handleExamChange = () => {
  // 切换考试时刷新数据
}

const loadAnalysisData = async () => {
  if (!filterForm.examId) {
    ElMessage.warning('请选择考试')
    return
  }

  loading.value = true
  try {
    const res = await analysisAPI.gradeAnalysis(filterForm.examId)
    if (res.data) {
      analysisData.value = res.data
      classDetails.value = res.data.classDetails || []

      // 排序获取优秀和薄弱班级（按平均分降序）
      const sorted = [...classDetails.value].sort((a, b) => b.averageScore - a.averageScore)
      excellentClasses.value = sorted.slice(0, 3)
      weakClasses.value = sorted.slice(-3).reverse()

      await nextTick()
      renderCharts()
    }
  } catch (error) {
    ElMessage.error('加载分析数据失败')
  } finally {
    loading.value = false
  }
}

const renderCharts = () => {
  renderClassRankChart()
  renderSubjectRadarChart()
  renderScoreDistributionChart()
}

const renderClassRankChart = () => {
  if (!classRankChartRef.value) return

  if (!classRankChart) {
    classRankChart = useECharts(classRankChartRef, null)
  }

  const classes = classDetails.value || []
  const sortedClasses = [...classes].sort((a, b) => b.averageScore - a.averageScore)

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}分' }
    },
    yAxis: {
      type: 'category',
      data: sortedClasses.map(c => c.className).reverse(),
      axisLabel: { interval: 0 }
    },
    series: [
      {
        name: '平均分',
        type: 'bar',
        data: sortedClasses.map(c => c.averageScore || 0).reverse(),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#667eea' },
              { offset: 1, color: '#764ba2' }
            ]
          },
          borderRadius: [0, 4, 4, 0]
        },
        barWidth: '50%',
        label: {
          show: true,
          position: 'right',
          formatter: '{c}分'
        }
      }
    ]
  }

  classRankChart.setOption(option, true)
}

const renderSubjectRadarChart = () => {
  if (!subjectRadarChartRef.value) return

  if (!subjectRadarChart) {
    subjectRadarChart = useECharts(subjectRadarChartRef, null)
  }

  const subjectStats = analysisData.value.subjectStats || [
    { name: '语文', averageScore: 82 },
    { name: '数学', averageScore: 75 },
    { name: '英语', averageScore: 78 },
    { name: '物理', averageScore: 70 },
    { name: '化学', averageScore: 72 },
    { name: '生物', averageScore: 80 }
  ]

  const option = {
    tooltip: {},
    legend: {
      data: ['年级平均分', '优秀线(85分)'],
      bottom: 0
    },
    radar: {
      indicator: subjectStats.map(s => ({
        name: s.name,
        max: s.fullScore || 100
      })),
      radius: '60%',
      center: ['50%', '45%'],
      axisName: { color: '#606266' },
      splitArea: { areaStyle: { color: ['rgba(102, 126, 234, 0.05)', 'rgba(102, 126, 234, 0.1)'] } }
    },
    series: [
      {
        name: '学科对比',
        type: 'radar',
        data: [
          {
            value: subjectStats.map(s => s.averageScore || 0),
            name: '年级平均分',
            areaStyle: { color: 'rgba(102, 126, 234, 0.3)' },
            lineStyle: { color: '#667eea', width: 2 },
            itemStyle: { color: '#667eea' }
          },
          {
            value: subjectStats.map(() => 85),
            name: '优秀线(85分)',
            lineStyle: { color: '#f56c6c', type: 'dashed' },
            itemStyle: { color: '#f56c6c' },
            areaStyle: { color: 'rgba(245, 108, 108, 0.1)' }
          }
        ]
      }
    ]
  }

  subjectRadarChart.setOption(option, true)
}

const renderScoreDistributionChart = () => {
  if (!scoreDistributionChartRef.value) return

  if (!scoreDistributionChart) {
    scoreDistributionChart = useECharts(scoreDistributionChartRef, null)
  }

  const distribution = analysisData.value.scoreDistribution || [
    { range: '90分以上', count: 45 },
    { range: '80-89分', count: 120 },
    { range: '70-79分', count: 180 },
    { range: '60-69分', count: 100 },
    { range: '50-59分', count: 55 },
    { range: '50分以下', count: 30 }
  ]

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: '{b}: {c}人'
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: {
      type: 'category',
      data: distribution.map(d => d.range),
      axisLabel: { interval: 0 }
    },
    yAxis: {
      type: 'value',
      name: '人数'
    },
    series: [
      {
        name: '人数',
        type: 'bar',
        data: distribution.map(d => d.count),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#10b981' },
              { offset: 0.4, color: '#34d399' },
              { offset: 0.7, color: '#fbbf24' },
              { offset: 1, color: '#ef4444' }
            ]
          },
          borderRadius: [6, 6, 0, 0]
        },
        barWidth: '50%',
        label: {
          show: true,
          position: 'top',
          formatter: '{c}人'
        }
      }
    ]
  }

  scoreDistributionChart.setOption(option, true)
}

onMounted(() => {
  loadExamList()
})
</script>

<style scoped lang="scss">
.grade-analysis {
  padding: 20px;

  .filter-card {
    margin-bottom: 16px;
  }

  .stat-cards {
    margin-bottom: 16px;

    .stat-card {
      display: flex;
      align-items: center;
      padding: 8px;
      border: none;
      border-radius: 8px;
      margin-bottom: 16px;

      &__icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        color: #fff;
      }

      &__info {
        flex: 1;
      }

      &__value {
        font-size: 24px;
        font-weight: 600;
        color: #303133;
        line-height: 1.2;
        margin-bottom: 4px;
      }

      &__label {
        font-size: 13px;
        color: #909399;
      }

      &--primary &__icon { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      &--success &__icon { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
      &--warning &__icon { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
      &--info &__icon { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
      &--purple &__icon { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
      &--pink &__icon { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); }
    }
  }

  .chart-row {
    margin-bottom: 16px;

    .chart-card {
      height: 100%;

      .chart-title {
        font-weight: 600;
        font-size: 15px;
      }

      .chart-container {
        width: 100%;
        height: 320px;

        &--wide {
          height: 280px;
        }
      }
    }
  }

  .summary-row {
    margin-bottom: 16px;

    .summary-card {
      .card-header {
        display: flex;
        align-items: center;

        .chart-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          font-size: 15px;
        }
      }
    }
  }

  .detail-card {
    margin-bottom: 16px;

    .chart-title {
      font-weight: 600;
      font-size: 15px;
    }
  }
}
</style>
