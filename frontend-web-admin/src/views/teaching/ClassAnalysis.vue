<template>
  <div class="class-analysis">
    <PageHeader title="班级学情分析" description="查看班级整体学情数据与分析" :breadcrumbs="breadcrumbs" />

    <!-- 筛选区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="选择考试">
          <el-select
            v-model="filterForm.examId"
            placeholder="请选择考试"
            style="width: 220px"
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
        <el-form-item label="选择班级">
          <el-select
            v-model="filterForm.classId"
            placeholder="请选择班级"
            style="width: 200px"
            filterable
            @change="handleClassChange"
          >
            <el-option
              v-for="cls in classList"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
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
        <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4">
          <el-card shadow="hover" class="stat-card stat-card--primary">
            <div class="stat-card__icon">
              <el-icon :size="32"><TrendCharts /></el-icon>
            </div>
            <div class="stat-card__info">
              <div class="stat-card__value">{{ analysisData.averageScore?.toFixed(1) || '--' }}</div>
              <div class="stat-card__label">班级平均分</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4">
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
        <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4">
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
        <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4">
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
        <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4">
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
        <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4">
          <el-card shadow="hover" class="stat-card stat-card--pink">
            <div class="stat-card__icon">
              <el-icon :size="32"><User /></el-icon>
            </div>
            <div class="stat-card__info">
              <div class="stat-card__value">{{ analysisData.studentCount || '--' }}</div>
              <div class="stat-card__label">参考人数</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="16" class="chart-row">
        <el-col :lg="12" :md="24">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <span class="chart-title">各科成绩对比</span>
            </template>
            <div ref="subjectBarChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        <el-col :lg="12" :md="24">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <span class="chart-title">分数段分布</span>
            </template>
            <div ref="scorePieChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="chart-row">
        <el-col :lg="12" :md="24">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <span class="chart-title">各科及格率/优秀率对比</span>
            </template>
            <div ref="rateBarChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        <el-col :lg="12" :md="24">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <span class="chart-title">班级排名前10</span>
            </template>
            <el-table :data="topStudents" size="small" border stripe>
              <el-table-column type="index" label="排名" width="60" align="center" />
              <el-table-column prop="studentName" label="姓名" width="100" />
              <el-table-column prop="totalScore" label="总分" width="80" align="center" />
              <el-table-column prop="classRank" label="班级排名" width="90" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.classRank <= 3 ? 'success' : 'info'" size="small">{{ row.classRank }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="gradeRank" label="年级排名" width="90" align="center">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.gradeRank }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <!-- 薄弱科目识别与建议 -->
      <el-card shadow="never" class="suggestion-card">
        <template #header>
          <span class="chart-title">薄弱科目识别与学习建议</span>
        </template>
        <el-row :gutter="16">
          <el-col :md="12" :sm="24">
            <div class="weak-subjects">
              <h4>薄弱科目</h4>
              <el-empty v-if="!weakSubjects || weakSubjects.length === 0" description="暂无薄弱科目" :image-size="60" />
              <ul v-else>
                <li v-for="(item, index) in weakSubjects" :key="index">
                  <el-tag type="danger" size="small">{{ item.name }}</el-tag>
                  <span>平均分：{{ item.averageScore?.toFixed(1) }}</span>
                  <span>及格率：{{ (item.passRate * 100).toFixed(1) }}%</span>
                </li>
              </ul>
            </div>
          </el-col>
          <el-col :md="12" :sm="24">
            <div class="suggestions">
              <h4>学习建议</h4>
              <el-empty v-if="!suggestions || suggestions.length === 0" description="暂无建议" :image-size="60" />
              <ul v-else>
                <li v-for="(item, index) in suggestions" :key="index">
                  <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { Search, TrendCharts, CaretTop, CaretBottom, CircleCheck, Medal, User, CircleCheckFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { analysisAPI, examAPI, classAPI } from '@/api/teaching'
import { useECharts } from '@/composables/useECharts'
import PageHeader from '@/components/common/PageHeader.vue'

const breadcrumbs = [
  { label: '教学管理' },
  { label: '班级学情分析' }
]

const filterForm = reactive({
  examId: '',
  classId: ''
})

const loading = ref(false)
const examList = ref([])
const classList = ref([])
const analysisData = ref({})
const topStudents = ref([])
const weakSubjects = ref([])
const suggestions = ref([])

// 图表 refs
const subjectBarChartRef = ref(null)
const scorePieChartRef = ref(null)
const rateBarChartRef = ref(null)

// 图表实例
let subjectBarChart = null
let scorePieChart = null
let rateBarChart = null

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

const loadClassList = async () => {
  try {
    const res = await classAPI.list({ page: 1, pageSize: 100 })
    if (res.data?.list) {
      classList.value = res.data.list
    } else if (Array.isArray(res.data)) {
      classList.value = res.data
    }
  } catch (error) {
    console.error('加载班级列表失败:', error)
  }
}

const handleExamChange = () => {
  // 切换考试时刷新数据
}

const handleClassChange = () => {
  // 切换班级时刷新数据
}

const loadAnalysisData = async () => {
  if (!filterForm.examId || !filterForm.classId) {
    ElMessage.warning('请选择考试和班级')
    return
  }

  loading.value = true
  try {
    const res = await analysisAPI.classAnalysis(filterForm.examId, filterForm.classId)
    if (res.data) {
      analysisData.value = res.data
      topStudents.value = res.data.topStudents || []
      weakSubjects.value = res.data.weakSubjects || []
      suggestions.value = res.data.suggestions || generateSuggestions(res.data)
      await nextTick()
      renderCharts()
    }
  } catch (error) {
    ElMessage.error('加载分析数据失败')
  } finally {
    loading.value = false
  }
}

const generateSuggestions = (data) => {
  const tips = []
  if (data.passRate < 0.6) {
    tips.push('班级整体及格率偏低，建议加强基础知识的巩固和练习')
  }
  if (data.weakSubjects && data.weakSubjects.length > 0) {
    tips.push(`重点关注${data.weakSubjects.map(s => s.name).join('、')}等薄弱学科的学习`)
  }
  if (data.averageScore < 70) {
    tips.push('班级平均分有待提高，建议优化教学方法，提高课堂效率')
  }
  if (tips.length === 0) {
    tips.push('班级整体表现良好，继续保持学习状态')
  }
  return tips
}

const renderCharts = () => {
  renderSubjectBarChart()
  renderScorePieChart()
  renderRateBarChart()
}

const renderSubjectBarChart = () => {
  if (!subjectBarChartRef.value) return

  if (!subjectBarChart) {
    subjectBarChart = useECharts(subjectBarChartRef, null)
  }

  const subjects = analysisData.value.subjectStats || []
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['平均分', '满分'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: subjects.map(s => s.name),
      axisLabel: { interval: 0, rotate: 0 }
    },
    yAxis: { type: 'value', max: 100 },
    series: [
      {
        name: '平均分',
        type: 'bar',
        data: subjects.map(s => s.averageScore || 0),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#667eea' },
              { offset: 1, color: '#764ba2' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '40%'
      },
      {
        name: '满分',
        type: 'line',
        data: subjects.map(s => s.fullScore || 100),
        lineStyle: { color: '#f56c6c', type: 'dashed' },
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  }

  subjectBarChart.setOption(option, true)
}

const renderScorePieChart = () => {
  if (!scorePieChartRef.value) return

  if (!scorePieChart) {
    scorePieChart = useECharts(scorePieChartRef, null)
  }

  const distribution = analysisData.value.scoreDistribution || [
    { name: '90分以上', value: 5 },
    { name: '80-89分', value: 12 },
    { name: '70-79分', value: 18 },
    { name: '60-69分', value: 10 },
    { name: '60分以下', value: 5 }
  ]

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: { orient: 'vertical', right: '5%', top: 'center' },
    color: ['#67c23a', '#409eff', '#e6a23c', '#909399', '#f56c6c'],
    series: [
      {
        name: '分数段',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold' }
        },
        labelLine: { show: false },
        data: distribution
      }
    ]
  }

  scorePieChart.setOption(option, true)
}

const renderRateBarChart = () => {
  if (!rateBarChartRef.value) return

  if (!rateBarChart) {
    rateBarChart = useECharts(rateBarChartRef, null)
  }

  const subjects = analysisData.value.subjectStats || []
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['及格率', '优秀率'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: subjects.map(s => s.name)
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    series: [
      {
        name: '及格率',
        type: 'bar',
        data: subjects.map(s => ((s.passRate || 0) * 100).toFixed(1)),
        itemStyle: { color: '#67c23a', borderRadius: [4, 4, 0, 0] },
        barWidth: '30%'
      },
      {
        name: '优秀率',
        type: 'bar',
        data: subjects.map(s => ((s.excellentRate || 0) * 100).toFixed(1)),
        itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] },
        barWidth: '30%'
      }
    ]
  }

  rateBarChart.setOption(option, true)
}

onMounted(() => {
  loadExamList()
  loadClassList()
})
</script>

<style scoped lang="scss">
.class-analysis {
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
      }
    }
  }

  .suggestion-card {
    margin-bottom: 16px;

    .chart-title {
      font-weight: 600;
      font-size: 15px;
    }

    .weak-subjects,
    .suggestions {
      h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #606266;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          margin-bottom: 8px;
          background: #f5f7fa;
          border-radius: 4px;
          font-size: 14px;

          .el-icon {
            flex-shrink: 0;
          }
        }
      }
    }
  }
}
</style>
