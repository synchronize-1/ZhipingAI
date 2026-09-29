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
        <template #header>
          <div class="card-header">
            <span class="card-title">学生基本信息</span>
            <el-button type="success" :icon="MagicStick" size="small" @click="openDiagnosis">AI 生成画像</el-button>
          </div>
        </template>
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

      <!-- 历次成绩对比 -->
      <el-row :gutter="16" class="chart-row">
        <el-col :lg="12" :md="24">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <span class="chart-title">历次成绩对比</span>
            </template>
            <el-empty
              v-if="trendData.length <= 1"
              description="暂无足够数据用于趋势对比"
              :image-size="80"
            />
            <div v-else ref="examCompareRef" class="chart-container"></div>
          </el-card>
        </el-col>
        <el-col :lg="12" :md="24">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <span class="chart-title">各科成绩趋势</span>
            </template>
            <el-empty
              v-if="subjectTrendSubjects.length === 0"
              description="暂无学科趋势数据"
              :image-size="80"
            />
            <div v-else ref="subjectTrendChartRef" class="chart-container"></div>
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

    <!-- AI 学情画像抽屉 -->
    <el-drawer
      v-model="diagnosisVisible"
      title="AI 学情画像"
      size="620px"
      :close-on-click-modal="false"
    >
      <div class="diagnosis-body">
        <!-- 分析范围 -->
        <div class="diagnosis-options">
          <span class="diagnosis-options__label">分析范围：</span>
          <el-select
            v-model="diagnosisExamId"
            placeholder="综合历次成绩"
            style="width: 240px"
            clearable
          >
            <el-option
              v-for="exam in examList"
              :key="exam.id"
              :label="exam.name"
              :value="exam.id"
            />
          </el-select>
          <span class="diagnosis-options__tip">不选择考试则基于历次成绩综合画像</span>
        </div>

        <!-- 生成中 -->
        <div v-if="diagnosisLoading" class="diagnosis-loading">
          <el-icon class="diagnosis-loading__icon" :size="42"><Loading /></el-icon>
          <p class="diagnosis-loading__text">AI 正在生成学情画像，请稍候…</p>
          <p class="diagnosis-loading__tip">画像生成通常需要 10-40 秒，请勿关闭窗口</p>
          <el-skeleton :rows="6" animated style="margin-top: 24px" />
        </div>

        <!-- 生成结果 -->
        <template v-else-if="diagnosisContent">
          <div class="diagnosis-report__head">
            <h3 class="diagnosis-report__title">{{ diagnosisTitle }}</h3>
            <span v-if="diagnosisCreatedAt" class="diagnosis-report__time">生成时间：{{ formatTime(diagnosisCreatedAt) }}</span>
          </div>
          <div class="diagnosis-report__content">{{ diagnosisContent }}</div>
        </template>

        <!-- 空状态 -->
        <el-empty v-else description="暂无学情画像，点击下方按钮生成" :image-size="100" />

        <!-- 历史报告 -->
        <div class="diagnosis-history">
          <div class="diagnosis-history__head">
            <span class="diagnosis-history__title">历史报告</span>
            <el-button link type="primary" :icon="Refresh" :loading="historyLoading" @click="loadDiagnosisHistory">刷新</el-button>
          </div>
          <el-empty v-if="!historyLoading && diagnosisHistoryList.length === 0" description="暂无历史报告" :image-size="60" />
          <ul v-else v-loading="historyLoading" class="diagnosis-history__list">
            <li
              v-for="item in diagnosisHistoryList"
              :key="item.id"
              :class="{ 'is-active': item.id === activeReportId }"
              @click="handleHistoryClick(item)"
            >
              <span class="history-title">{{ item.title || '学情画像报告' }}</span>
              <span class="history-time">{{ formatTime(item.createdAt) }}</span>
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <div class="diagnosis-footer">
          <el-button :icon="DocumentCopy" :disabled="!diagnosisContent" @click="copyDiagnosisContent">复制内容</el-button>
          <el-button type="primary" :icon="Refresh" :loading="diagnosisLoading" @click="generateDiagnosis">重新生成</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, Star, WarningFilled, Reading, MagicStick, Loading, Refresh, DocumentCopy } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { analysisAPI, classAPI, examAPI } from '@/api/teaching'
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

// 历次成绩趋势数据
const examList = ref([])
const trendData = ref([])
const subjectTrendData = ref({})
const totalExams = ref(0)

// AI 学情画像状态
const diagnosisVisible = ref(false)
const diagnosisLoading = ref(false)
const diagnosisContent = ref('')
const diagnosisTitle = ref('')
const diagnosisCreatedAt = ref('')
const diagnosisExamId = ref('')
const diagnosisHistoryList = ref([])
const historyLoading = ref(false)
const activeReportId = ref('')

// 图表 refs
const trendChartRef = ref(null)
const subjectRadarRef = ref(null)
const classRankTrendRef = ref(null)
const gradeRankTrendRef = ref(null)
const examCompareRef = ref(null)
const subjectTrendChartRef = ref(null)

// 图表实例
let trendChart = null
let subjectRadarChart = null
let classRankTrendChart = null
let gradeRankTrendChart = null
let examCompareChart = null
let subjectTrendChart = null

// 当前选中的学生
const selectedStudent = computed(() => studentList.value.find(s => s.id === selectedStudentId.value) || {})

// 学科趋势（按考试次数/平均分排序，最多展示 6 个科目）
const subjectTrendSubjects = computed(() => {
  const list = Object.values(subjectTrendData.value || {})
  return list
    .map(subj => ({
      ...subj,
      scores: [...(subj.scores || [])].sort((a, b) => new Date(a.examDate || 0) - new Date(b.examDate || 0))
    }))
    .map(subj => {
      const valid = subj.scores.filter(s => typeof s.score === 'number')
      subj.avgScore = valid.length ? valid.reduce((sum, s) => sum + s.score, 0) / valid.length : 0
      return subj
    })
    .sort((a, b) => (b.scores.length - a.scores.length) || (b.avgScore - a.avgScore))
    .slice(0, 6)
})

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

  // 切换学生时重置 AI 画像状态
  resetDiagnosis()

  loading.value = true
  try {
    const res = await analysisAPI.studentAnalysis(selectedStudentId.value)
    if (res.data) {
      applyStudentData(res.data)
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

// 归一化优势/薄弱学科数据（兼容 { name, score, classRank } 与 { subjectName, avgScore } 两种结构）
const normalizeSubjectList = (list) => (list || []).map(s => ({
  name: s.name || s.subjectName || '--',
  score: s.score ?? s.avgScore ?? s.averageScore ?? '--',
  classRank: s.classRank ?? s.rankInClass ?? '--'
}))

// 从学科趋势中推导最近一次考试的各科成绩（用于雷达图）
const deriveSubjectScores = () => {
  const map = subjectTrendData.value || {}
  return Object.values(map).map(subj => {
    const scores = [...(subj.scores || [])]
      .filter(s => typeof s.score === 'number')
      .sort((a, b) => new Date(a.examDate || 0) - new Date(b.examDate || 0))
    const last = scores[scores.length - 1] || {}
    const maxScore = Math.max(100, ...scores.map(s => s.score || 0))
    return {
      name: subj.subjectName,
      score: last.score ?? 0,
      fullScore: Math.ceil(maxScore / 10) * 10,
      classRank: last.rankInClass
    }
  })
}

// 将后端返回的学情分析数据映射到页面各状态（兼容新旧两种返回结构）
const applyStudentData = (data) => {
  trendData.value = data.trend || []
  subjectTrendData.value = data.subjectTrend || {}
  totalExams.value = data.totalExams ?? trendData.value.length

  const stu = selectedStudent.value || {}
  const lastTrend = trendData.value[trendData.value.length - 1] || {}

  studentInfo.value = data.basicInfo || data.student || {
    id: data.studentId || selectedStudentId.value,
    studentNo: data.studentNo || stu.studentNo,
    studentName: data.studentName || stu.studentName,
    className: data.className || stu.className,
    gender: data.gender || stu.gender,
    totalScore: data.totalScore ?? lastTrend.totalScore,
    classRank: data.classRank,
    gradeRank: data.gradeRank
  }

  // 兼容：后端未返回 examHistory 时，用历次趋势补齐现有图表数据
  examHistory.value = (data.examHistory && data.examHistory.length)
    ? data.examHistory
    : trendData.value.map(t => ({
        examName: t.examName,
        totalScore: t.totalScore,
        averageScore: t.avgScore
      }))

  subjectScores.value = (data.subjectScores && data.subjectScores.length)
    ? data.subjectScores
    : deriveSubjectScores()

  advantageSubjects.value = normalizeSubjectList(data.advantageSubjects || data.strongSubjects)
  weakSubjects.value = normalizeSubjectList(data.weakSubjects)
  suggestions.value = data.suggestions || generateSuggestions({
    ...data,
    advantageSubjects: advantageSubjects.value,
    weakSubjects: weakSubjects.value
  })
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

  // 用模拟数据补齐历次成绩对比所需的数据结构
  trendData.value = examHistory.value.map((e, index) => ({
    examId: `mock-${index}`,
    examName: e.examName,
    totalScore: e.totalScore,
    avgScore: e.averageScore
  }))
  totalExams.value = trendData.value.length
  subjectTrendData.value = {}

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
  renderExamCompareChart()
  renderSubjectTrendChart()
}

// 历次成绩对比（总分 + 平均分，双 Y 轴）
const renderExamCompareChart = () => {
  if (!examCompareRef.value) {
    // 容器因空状态未渲染时销毁旧实例，避免复用已卸载的 DOM
    examCompareChart?.dispose()
    examCompareChart = null
    return
  }

  if (!examCompareChart) {
    examCompareChart = useECharts(examCompareRef, null)
  }

  const exams = trendData.value || []
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['总分', '平均分'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: exams.map(e => e.examName),
      boundaryGap: false,
      axisLabel: { interval: 0, rotate: exams.length > 6 ? 20 : 0 }
    },
    yAxis: [
      { type: 'value', name: '总分', scale: true },
      { type: 'value', name: '平均分', min: 0, max: 100 }
    ],
    series: [
      {
        name: '总分',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: exams.map(e => e.totalScore),
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
      },
      {
        name: '平均分',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: exams.map(e => e.avgScore),
        lineStyle: { width: 3, color: '#10b981' },
        itemStyle: { color: '#10b981' }
      }
    ]
  }

  examCompareChart.setOption(option, true)
}

// 各科成绩趋势（多条折线，x 轴为历次考试）
const renderSubjectTrendChart = () => {
  if (!subjectTrendChartRef.value) {
    subjectTrendChart?.dispose()
    subjectTrendChart = null
    return
  }

  if (!subjectTrendChart) {
    subjectTrendChart = useECharts(subjectTrendChartRef, null)
  }

  const subjects = subjectTrendSubjects.value
  if (subjects.length === 0) return

  const exams = trendData.value || []
  const xAxisData = exams.length > 0
    ? exams.map(e => e.examName)
    : subjects[0].scores.map(s => s.examName)
  const examIds = exams.length > 0
    ? exams.map(e => e.examId)
    : subjects[0].scores.map(s => s.examId)

  const colors = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  const series = subjects.map((subj, index) => {
    const scoreMap = {}
    subj.scores.forEach(s => { scoreMap[s.examId] = s.score })
    const color = colors[index % colors.length]
    return {
      name: subj.subjectName,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: examIds.map(id => (scoreMap[id] ?? null)),
      lineStyle: { width: 2, color },
      itemStyle: { color }
    }
  })

  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: subjects.map(s => s.subjectName), top: 0, type: 'scroll' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '20%', containLabel: true },
    xAxis: {
      type: 'category',
      data: xAxisData,
      boundaryGap: false,
      axisLabel: { interval: 0, rotate: xAxisData.length > 6 ? 20 : 0 }
    },
    yAxis: { type: 'value', name: '分数', scale: true },
    series
  }

  subjectTrendChart.setOption(option, true)
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

// ==================== AI 学情画像 ====================
const formatTime = (time) => {
  if (!time) return '--'
  const d = new Date(time)
  if (Number.isNaN(d.getTime())) return time
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const resetDiagnosis = () => {
  diagnosisContent.value = ''
  diagnosisTitle.value = ''
  diagnosisCreatedAt.value = ''
  diagnosisExamId.value = ''
  diagnosisHistoryList.value = []
  activeReportId.value = ''
  diagnosisVisible.value = false
}

const openDiagnosis = () => {
  if (!selectedStudentId.value) {
    ElMessage.warning('请先选择学生')
    return
  }
  diagnosisVisible.value = true
  generateDiagnosis()
}

const generateDiagnosis = async () => {
  if (!selectedStudentId.value) {
    ElMessage.warning('请先选择学生')
    return
  }
  diagnosisLoading.value = true
  diagnosisContent.value = ''
  activeReportId.value = ''
  try {
    const res = await analysisAPI.studentDiagnosis(selectedStudentId.value, diagnosisExamId.value || undefined)
    const data = res.data || {}
    const studentName = data.studentName || studentInfo.value.studentName || '学生'
    const examName = examList.value.find(e => e.id === diagnosisExamId.value)?.name
    diagnosisContent.value = data.content || ''
    diagnosisTitle.value = `${studentName} · ${examName || '综合历次成绩'}`
    diagnosisCreatedAt.value = data.createdAt || ''
    activeReportId.value = data.reportId || ''
    await loadDiagnosisHistory()
  } catch (error) {
    const isTimeout = error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '')
    ElMessage.error(isTimeout ? 'AI 学情画像生成超时，请稍后重试' : 'AI 学情画像生成失败，可能是 AI 服务未配置，请联系管理员')
  } finally {
    diagnosisLoading.value = false
  }
}

const loadDiagnosisHistory = async () => {
  if (!selectedStudentId.value) return
  historyLoading.value = true
  try {
    const res = await analysisAPI.diagnosisHistory('student', selectedStudentId.value, 10)
    diagnosisHistoryList.value = Array.isArray(res.data) ? res.data : (res.data?.list || [])
  } catch (error) {
    console.error('加载诊断历史失败:', error)
  } finally {
    historyLoading.value = false
  }
}

const handleHistoryClick = async (item) => {
  activeReportId.value = item.id
  if (item.content) {
    diagnosisContent.value = item.content
    diagnosisTitle.value = item.title || '学情画像报告'
    diagnosisCreatedAt.value = item.createdAt || ''
    return
  }
  try {
    const res = await analysisAPI.diagnosisDetail(item.id)
    const data = res.data || {}
    diagnosisContent.value = data.content || ''
    diagnosisTitle.value = data.title || '学情画像报告'
    diagnosisCreatedAt.value = data.createdAt || ''
  } catch (error) {
    ElMessage.error('加载诊断报告详情失败')
  }
}

const copyDiagnosisContent = async () => {
  if (!diagnosisContent.value) return
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(diagnosisContent.value)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = diagnosisContent.value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败，请手动选择内容复制')
  }
}

// 图表容器自适应
const handleResize = () => {
  examCompareChart?.resize()
  subjectTrendChart?.resize()
  trendChart?.resize()
  subjectRadarChart?.resize()
  classRankTrendChart?.resize()
  gradeRankTrendChart?.resize()
}

onMounted(() => {
  loadClassList()
  loadExamList()
  window.addEventListener('resize', handleResize)

  // 如果路由中有studentId参数，直接加载
  if (route.query.studentId) {
    selectedStudentId.value = route.query.studentId
    handleStudentChange()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  examCompareChart?.dispose()
  examCompareChart = null
  subjectTrendChart?.dispose()
  subjectTrendChart = null
  trendChart?.dispose()
  trendChart = null
  subjectRadarChart?.dispose()
  subjectRadarChart = null
  classRankTrendChart?.dispose()
  classRankTrendChart = null
  gradeRankTrendChart?.dispose()
  gradeRankTrendChart = null
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

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .card-title {
          font-weight: 600;
          font-size: 15px;
        }
      }

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

  .diagnosis-body {
    .diagnosis-options {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;

      &__label {
        font-size: 14px;
        color: #606266;
      }

      &__tip {
        font-size: 12px;
        color: #909399;
      }
    }

    .diagnosis-loading {
      text-align: center;
      padding: 24px 0;

      &__icon {
        color: #667eea;
        animation: diagnosis-rotate 1.4s linear infinite;
      }

      &__text {
        margin: 16px 0 4px;
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }

      &__tip {
        margin: 0;
        font-size: 13px;
        color: #909399;
      }
    }

    .diagnosis-report__head {
      padding-bottom: 12px;
      margin-bottom: 12px;
      border-bottom: 1px solid #ebeef5;

      .diagnosis-report__title {
        margin: 0 0 6px;
        font-size: 17px;
        font-weight: 600;
        color: #303133;
      }

      .diagnosis-report__time {
        font-size: 12px;
        color: #909399;
      }
    }

    .diagnosis-report__content {
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 14px;
      line-height: 1.8;
      color: #303133;
    }

    .diagnosis-history {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #ebeef5;

      &__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      &__title {
        font-size: 14px;
        font-weight: 600;
        color: #606266;
      }

      &__list {
        list-style: none;
        padding: 0;
        margin: 0;
        min-height: 60px;

        li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 12px;
          margin-bottom: 8px;
          background: #f5f7fa;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;

          &:hover {
            background: #ecf5ff;
          }

          &.is-active {
            background: #ecf5ff;
            border-left: 3px solid #409eff;
          }

          .history-title {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #303133;
          }

          .history-time {
            flex-shrink: 0;
            color: #909399;
          }
        }
      }
    }
  }

  .diagnosis-footer {
    display: flex;
    justify-content: flex-end;
  }
}

@keyframes diagnosis-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
