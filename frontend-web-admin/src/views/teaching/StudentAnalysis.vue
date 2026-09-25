<template>
  <div class="student-analysis">
    <PageHeader
      title="学生学情分析"
      description="查看学生个人学习情况与分析"
      :breadcrumbs="breadcrumbs"
      show-back
      @back="handleBack"
    />

    <!-- 学生搜索 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="学号/姓名">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入学号或姓名"
            style="width: 220px"
            clearable
          />
        </el-form-item>
        <el-form-item label="班级">
          <el-select
            v-model="searchForm.classId"
            placeholder="请选择班级"
            style="width: 180px"
            filterable
            clearable
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
          <el-button type="primary" :icon="Search" :loading="searchLoading" @click="handleSearchStudent">
            搜索
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 学生选择列表 -->
      <div v-if="studentList.length > 0" class="student-select-list">
        <el-radio-group v-model="selectedStudentId" @change="handleStudentChange">
          <el-radio-button
            v-for="stu in studentList"
            :key="stu.id"
            :value="stu.id"
          >
            {{ stu.studentName }} ({{ stu.studentNo }})
          </el-radio-button>
        </el-radio-group>
      </div>
    </el-card>

    <div v-if="studentInfo.id" v-loading="loading" class="analysis-content">
      <!-- 学生基本信息卡片 -->
      <el-card shadow="never" class="student-info-card">
        <div class="student-info">
          <div class="student-avatar">
            <el-avatar :size="80" :src="studentInfo.avatar">
              {{ studentInfo.studentName?.charAt(0) }}
            </el-avatar>
          </div>
          <div class="student-detail">
            <h3 class="student-name">{{ studentInfo.studentName }}</h3>
            <div class="student-meta">
              <el-tag size="small">{{ studentInfo.className }}</el-tag>
              <span class="meta-item">学号：{{ studentInfo.studentNo }}</span>
              <span class="meta-item">性别：{{ studentInfo.gender === 'male' ? '男' : '女' }}</span>
            </div>
            <div class="student-stats">
              <div class="stat-item">
                <div class="stat-value">{{ studentInfo.totalScore || '--' }}</div>
                <div class="stat-label">最近总分</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ studentInfo.classRank || '--' }}</div>
                <div class="stat-label">班级排名</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ studentInfo.gradeRank || '--' }}</div>
                <div class="stat-label">年级排名</div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 图表区域 -->
      <el-row :gutter="16" class="chart-row">
        <el-col :lg="14" :md="24">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <span class="chart-title">历次考试成绩趋势</span>
              <el-radio-group v-model="trendType" size="small" style="margin-left: 16px">
                <el-radio-button value="total">总分</el-radio-button>
                <el-radio-button value="average">平均分</el-radio-button>
                <el-radio-button value="rank">排名</el-radio-button>
              </el-radio-group>
            </template>
            <div ref="trendChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        <el-col :lg="10" :md="24">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <span class="chart-title">各科成绩雷达图（最近一次考试）</span>
            </template>
            <div ref="subjectRadarRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="chart-row">
        <el-col :lg="12" :md="24">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <span class="chart-title">班级排名趋势</span>
            </template>
            <div ref="classRankTrendRef" class="chart-container chart-container--short"></div>
          </el-card>
        </el-col>
        <el-col :lg="12" :md="24">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <span class="chart-title">年级排名趋势</span>
            </template>
            <div ref="gradeRankTrendRef" class="chart-container chart-container--short"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 优势学科/薄弱学科分析 -->
      <el-row :gutter="16" class="analysis-row">
        <el-col :lg="12" :md="24">
          <el-card shadow="never" class="analysis-card">
            <template #header>
              <div class="card-header">
                <el-icon color="#67c23a" :size="18"><Star /></el-icon>
                <span class="card-title">优势学科</span>
              </div>
            </template>
            <el-empty v-if="!advantageSubjects || advantageSubjects.length === 0" description="暂无数据" :image-size="60" />
            <div v-else class="subject-list">
              <div v-for="(item, index) in advantageSubjects" :key="index" class="subject-item">
                <div class="subject-info">
                  <el-tag type="success" size="small" effect="light">{{ item.name }}</el-tag>
                  <span class="subject-score">{{ item.score }}分</span>
                </div>
                <div class="subject-rank">
                  <span>班级排名：{{ item.classRank }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :lg="12" :md="24">
          <el-card shadow="never" class="analysis-card">
            <template #header>
              <div class="card-header">
                <el-icon color="#f56c6c" :size="18"><WarningFilled /></el-icon>
                <span class="card-title">薄弱学科</span>
              </div>
            </template>
            <el-empty v-if="!weakSubjects || weakSubjects.length === 0" description="暂无数据" :image-size="60" />
            <div v-else class="subject-list">
              <div v-for="(item, index) in weakSubjects" :key="index" class="subject-item">
                <div class="subject-info">
                  <el-tag type="danger" size="small" effect="light">{{ item.name }}</el-tag>
                  <span class="subject-score">{{ item.score }}分</span>
                </div>
                <div class="subject-rank">
                  <span>班级排名：{{ item.classRank }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 学习建议 -->
      <el-card shadow="never" class="suggestion-card">
        <template #header>
          <div class="card-header">
            <el-icon color="#409eff" :size="18"><Reading /></el-icon>
            <span class="card-title">学习建议</span>
          </div>
        </template>
        <el-empty v-if="!suggestions || suggestions.length === 0" description="暂无建议" :image-size="60" />
        <ul v-else class="suggestion-list">
          <li v-for="(item, index) in suggestions" :key="index">
            <div class="suggestion-num">{{ index + 1 }}</div>
            <div class="suggestion-content">{{ item }}</div>
          </li>
        </ul>
      </el-card>
    </div>

    <!-- 未选择学生时的占位 -->
    <el-empty v-else description="请先搜索并选择学生" :image-size="120">
      <template #description>
        <span style="color: #909399">输入学号或姓名搜索学生，查看详细学情分析</span>
      </template>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, Star, WarningFilled, Reading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { analysisAPI, classAPI } from '@/api/teaching'
import { useECharts } from '@/composables/useECharts'
import PageHeader from '@/components/common/PageHeader.vue'

const router = useRouter()
const route = useRoute()

const breadcrumbs = [
  { label: '教学管理' },
  { label: '学生学情分析' }
]

const searchForm = reactive({
  keyword: '',
  classId: ''
})

const searchLoading = ref(false)
const loading = ref(false)
const classList = ref([])
const studentList = ref([])
const selectedStudentId = ref('')
const trendType = ref('total') // total / average / rank

const studentInfo = ref({})
const examHistory = ref([])
const subjectScores = ref([])
const advantageSubjects = ref([])
const weakSubjects = ref([])
const suggestions = ref([])

// 图表 refs
const trendChartRef = ref(null)
const subjectRadarRef = ref(null)
const classRankTrendRef = ref(null)
const gradeRankTrendRef = ref(null)

// 图表实例
let trendChart = null
let subjectRadarChart = null
let classRankTrendChart = null
let gradeRankTrendChart = null

const handleBack = () => {
  router.back()
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

const handleSearchStudent = async () => {
  if (!searchForm.keyword && !searchForm.classId) {
    ElMessage.warning('请输入搜索关键词或选择班级')
    return
  }

  searchLoading.value = true
  try {
    // 模拟搜索学生（实际应调用API）
    const mockStudents = [
      { id: '1', studentNo: '2024001', studentName: '张三', className: '高一(1)班', gender: 'male' },
      { id: '2', studentNo: '2024002', studentName: '李四', className: '高一(1)班', gender: 'female' },
      { id: '3', studentNo: '2024003', studentName: '王五', className: '高一(2)班', gender: 'male' }
    ]
    studentList.value = mockStudents
    if (mockStudents.length > 0) {
      selectedStudentId.value = mockStudents[0].id
      handleStudentChange()
    }
  } catch (error) {
    ElMessage.error('搜索失败')
  } finally {
    searchLoading.value = false
  }
}

const handleStudentChange = async () => {
  if (!selectedStudentId.value) return

  loading.value = true
  try {
    const res = await analysisAPI.studentAnalysis(selectedStudentId.value)
    if (res.data) {
      studentInfo.value = res.data.basicInfo || {}
      examHistory.value = res.data.examHistory || []
      subjectScores.value = res.data.subjectScores || []
      advantageSubjects.value = res.data.advantageSubjects || []
      weakSubjects.value = res.data.weakSubjects || []
      suggestions.value = res.data.suggestions || generateSuggestions(res.data)

      await nextTick()
      renderCharts()
    }
  } catch (error) {
    // 如果API调用失败，使用模拟数据
    loadMockData()
    await nextTick()
    renderCharts()
  } finally {
    loading.value = false
  }
}

const loadMockData = () => {
  studentInfo.value = {
    id: selectedStudentId.value,
    studentNo: '2024001',
    studentName: '张三',
    className: '高一(1)班',
    gender: 'male',
    totalScore: 568,
    classRank: 5,
    gradeRank: 28
  }

  examHistory.value = [
    { examName: '第一次月考', totalScore: 520, averageScore: 74.3, classRank: 12, gradeRank: 56 },
    { examName: '期中考试', totalScore: 545, averageScore: 77.9, classRank: 8, gradeRank: 42 },
    { examName: '第二次月考', totalScore: 558, averageScore: 79.7, classRank: 6, gradeRank: 35 },
    { examName: '期末考试', totalScore: 568, averageScore: 81.1, classRank: 5, gradeRank: 28 }
  ]

  subjectScores.value = [
    { name: '语文', score: 105, fullScore: 150, classRank: 8 },
    { name: '数学', score: 120, fullScore: 150, classRank: 3 },
    { name: '英语', score: 110, fullScore: 150, classRank: 10 },
    { name: '物理', score: 85, fullScore: 100, classRank: 5 },
    { name: '化学', score: 72, fullScore: 100, classRank: 18 },
    { name: '生物', score: 76, fullScore: 100, classRank: 15 }
  ]

  advantageSubjects.value = [
    { name: '数学', score: 120, classRank: 3 },
    { name: '物理', score: 85, classRank: 5 }
  ]

  weakSubjects.value = [
    { name: '化学', score: 72, classRank: 18 },
    { name: '生物', score: 76, classRank: 15 }
  ]

  suggestions.value = [
    '数学和物理是你的优势学科，继续保持并争取更大突破',
    '化学和生物成绩相对薄弱，建议加强基础知识的学习和理解',
    '整体成绩呈上升趋势，学习状态良好，继续保持',
    '建议制定薄弱学科的专项提升计划，有针对性地进行补习',
    '保持良好的学习习惯，注意劳逸结合，提高学习效率'
  ]
}

const generateSuggestions = (data) => {
  const tips = []
  if (data.advantageSubjects && data.advantageSubjects.length > 0) {
    tips.push(`${data.advantageSubjects.map(s => s.name).join('、')}是你的优势学科，继续保持并争取更大突破`)
  }
  if (data.weakSubjects && data.weakSubjects.length > 0) {
    tips.push(`${data.weakSubjects.map(s => s.name).join('、')}成绩相对薄弱，建议加强基础知识的学习`)
  }
  tips.push('建议制定薄弱学科的专项提升计划，有针对性地进行补习')
  tips.push('保持良好的学习习惯，注意劳逸结合，提高学习效率')
  return tips
}

const renderCharts = () => {
  renderTrendChart()
  renderSubjectRadarChart()
  renderRankTrendCharts()
}

const renderTrendChart = () => {
  if (!trendChartRef.value) return

  if (!trendChart) {
    trendChart = useECharts(trendChartRef, null)
  }

  const exams = examHistory.value || []
  let seriesData = []
  let yAxisConfig = { type: 'value' }
  let legendData = []

  if (trendType.value === 'total') {
    seriesData = [{
      name: '总分',
      type: 'line',
      data: exams.map(e => e.totalScore),
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3, color: '#667eea' },
      itemStyle: { color: '#667eea' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ]
        }
      }
    }]
    legendData = ['总分']
  } else if (trendType.value === 'average') {
    seriesData = [{
      name: '平均分',
      type: 'line',
      data: exams.map(e => e.averageScore?.toFixed(1)),
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3, color: '#10b981' },
      itemStyle: { color: '#10b981' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
          ]
        }
      }
    }]
    legendData = ['平均分']
    yAxisConfig = { type: 'value', max: 100 }
  } else {
    seriesData = [
      {
        name: '班级排名',
        type: 'line',
        data: exams.map(e => e.classRank),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#409eff' },
        itemStyle: { color: '#409eff' }
      },
      {
        name: '年级排名',
        type: 'line',
        data: exams.map(e => e.gradeRank),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#f59e0b' },
        itemStyle: { color: '#f59e0b' }
      }
    ]
    legendData = ['班级排名', '年级排名']
    yAxisConfig = { type: 'value', inverse: true }
  }

  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: legendData, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: exams.map(e => e.examName),
      boundaryGap: false
    },
    yAxis: yAxisConfig,
    series: seriesData
  }

  trendChart.setOption(option, true)
}

const renderSubjectRadarChart = () => {
  if (!subjectRadarRef.value) return

  if (!subjectRadarChart) {
    subjectRadarChart = useECharts(subjectRadarRef, null)
  }

  const subjects = subjectScores.value || []

  const option = {
    tooltip: {},
    radar: {
      indicator: subjects.map(s => ({
        name: s.name,
        max: s.fullScore || 100
      })),
      radius: '65%',
      center: ['50%', '50%'],
      axisName: { color: '#606266', fontSize: 12 },
      splitArea: { areaStyle: { color: ['rgba(102, 126, 234, 0.05)', 'rgba(102, 126, 234, 0.1)'] } }
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: subjects.map(s => s.score || 0),
            name: '学生成绩',
            areaStyle: { color: 'rgba(102, 126, 234, 0.3)' },
            lineStyle: { color: '#667eea', width: 2 },
            itemStyle: { color: '#667eea' }
          }
        ]
      }
    ]
  }

  subjectRadarChart.setOption(option, true)
}

const renderRankTrendCharts = () => {
  const exams = examHistory.value || []

  // 班级排名趋势
  if (classRankTrendRef.value) {
    if (!classRankTrendChart) {
      classRankTrendChart = useECharts(classRankTrendRef, null)
    }

    const option = {
      tooltip: { trigger: 'axis' },
      grid: { left: '10%', right: '5%', bottom: '10%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: exams.map(e => e.examName),
        axisLabel: { fontSize: 11, interval: 0 }
      },
      yAxis: { type: 'value', inverse: true, name: '班级排名' },
      series: [{
        name: '班级排名',
        type: 'line',
        data: exams.map(e => e.classRank),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2, color: '#409eff' },
        itemStyle: { color: '#409eff' },
        areaStyle: { color: 'rgba(64, 158, 255, 0.1)' }
      }]
    }

    classRankTrendChart.setOption(option, true)
  }

  // 年级排名趋势
  if (gradeRankTrendRef.value) {
    if (!gradeRankTrendChart) {
      gradeRankTrendChart = useECharts(gradeRankTrendRef, null)
    }

    const option = {
      tooltip: { trigger: 'axis' },
      grid: { left: '10%', right: '5%', bottom: '10%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: exams.map(e => e.examName),
        axisLabel: { fontSize: 11, interval: 0 }
      },
      yAxis: { type: 'value', inverse: true, name: '年级排名' },
      series: [{
        name: '年级排名',
        type: 'line',
        data: exams.map(e => e.gradeRank),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2, color: '#f59e0b' },
        itemStyle: { color: '#f59e0b' },
        areaStyle: { color: 'rgba(245, 158, 11, 0.1)' }
      }]
    }

    gradeRankTrendChart.setOption(option, true)
  }
}

onMounted(() => {
  loadClassList()

  // 如果路由中有studentId参数，直接加载
  if (route.query.studentId) {
    selectedStudentId.value = route.query.studentId
    handleStudentChange()
  }
})
</script>

<style scoped lang="scss">
.student-analysis {
  padding: 20px;

  .search-card {
    margin-bottom: 16px;

    .student-select-list {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #ebeef5;
    }
  }

  .analysis-content {
    .student-info-card {
      margin-bottom: 16px;

      .student-info {
        display: flex;
        align-items: center;
        gap: 24px;

        &-avatar {
          flex-shrink: 0;
        }

        &-detail {
          flex: 1;

          .student-name {
            margin: 0 0 10px 0;
            font-size: 22px;
            font-weight: 600;
            color: #303133;
          }

          .student-meta {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 16px;
            color: #606266;
            font-size: 14px;

            .meta-item {
              color: #909399;
            }
          }

          .student-stats {
            display: flex;
            gap: 40px;

            .stat-item {
              text-align: center;

              .stat-value {
                font-size: 28px;
                font-weight: 600;
                color: #667eea;
                line-height: 1.2;
              }

              .stat-label {
                font-size: 13px;
                color: #909399;
                margin-top: 4px;
              }
            }
          }
        }
      }
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

        &--short {
          height: 240px;
        }
      }
    }
  }

  .analysis-row {
    margin-bottom: 16px;

    .analysis-card {
      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;

        .card-title {
          font-weight: 600;
          font-size: 15px;
        }
      }

      .subject-list {
        .subject-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          margin-bottom: 8px;
          background: #f5f7fa;
          border-radius: 6px;

          &:last-child {
            margin-bottom: 0;
          }

          .subject-info {
            display: flex;
            align-items: center;
            gap: 12px;

            .subject-score {
              font-weight: 600;
              font-size: 16px;
              color: #303133;
            }
          }

          .subject-rank {
            font-size: 13px;
            color: #909399;
          }
        }
      }
    }
  }

  .suggestion-card {
    margin-bottom: 16px;

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;

      .card-title {
        font-weight: 600;
        font-size: 15px;
      }
    }

    .suggestion-list {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .suggestion-num {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #409eff;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          flex-shrink: 0;
        }

        .suggestion-content {
          flex: 1;
          font-size: 14px;
          color: #606266;
          line-height: 1.6;
        }
      }
    }
  }
}
</style>
