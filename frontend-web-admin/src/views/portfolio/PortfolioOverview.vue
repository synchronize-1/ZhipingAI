<template>
  <div class="portfolio-overview" :class="{ 'pdf-exporting': exporting }">
    <PageHeader
      title="成长档案总览"
      description="查看学生成长档案的综合数据概览"
      :breadcrumbs="breadcrumbs"
    >
      <template #extra>
        <el-button
          class="export-pdf-btn"
          type="primary"
          :icon="Download"
          :loading="exporting"
          :disabled="!canExport"
          @click="handleExportPdf"
        >
          {{ exporting ? '导出中…' : '导出PDF' }}
        </el-button>
      </template>
    </PageHeader>

    <!-- 学生选择器（教师/管理员可见） -->
    <el-card v-if="!isStudentRole" shadow="never" class="student-select-card">
      <el-form :inline="true" :model="selectForm" class="select-form">
        <el-form-item label="选择学生">
          <el-select
            v-model="selectForm.studentId"
            placeholder="请选择学生"
            style="width: 260px"
            filterable
            clearable
            @change="handleStudentChange"
          >
            <el-option
              v-for="stu in studentOptions"
              :key="stu.id"
              :label="`${stu.name} (${stu.studentNo})`"
              :value="stu.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="班级">
          <el-select
            v-model="selectForm.classId"
            placeholder="请选择班级"
            style="width: 180px"
            clearable
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
      </el-form>
    </el-card>

    <div
      v-loading="loading"
      ref="exportContentRef"
      class="overview-content"
      :class="{ 'pdf-exporting': exporting }"
    >
      <!-- 学生基本信息卡片 -->
      <el-card shadow="never" class="student-info-card">
        <div class="student-info">
          <div class="student-avatar-wrapper">
            <el-avatar :size="90" :src="studentInfo.avatar" class="student-avatar">
              {{ studentInfo.name?.charAt(0) }}
            </el-avatar>
            <div class="avatar-badge" :class="getMentalStatusClass(studentInfo.mentalStatus)">
              {{ getMentalStatusText(studentInfo.mentalStatus) }}
            </div>
          </div>
          <div class="student-detail">
            <h2 class="student-name">{{ studentInfo.name || '暂无数据' }}</h2>
            <div class="student-meta">
              <el-tag type="primary" size="small">{{ studentInfo.className || '--' }}</el-tag>
              <span class="meta-item">学号：{{ studentInfo.studentNo || '--' }}</span>
              <span class="meta-item">年级：{{ studentInfo.gradeName || '--' }}</span>
              <span class="meta-item">班主任：{{ studentInfo.headTeacher || '--' }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 数据概览卡片 -->
      <el-row :gutter="16" class="stats-row">
        <el-col :xs="12" :sm="12" :md="6">
          <div class="stat-card stat-card--blue">
            <div class="stat-icon">
              <el-icon :size="28"><Star /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ overviewData.skillCount || 0 }}</div>
              <div class="stat-label">技能数量</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6">
          <div class="stat-card stat-card--orange">
            <div class="stat-icon">
              <el-icon :size="28"><Trophy /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ overviewData.honorCount || 0 }}</div>
              <div class="stat-label">荣誉数量</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6">
          <div class="stat-card stat-card--green">
            <div class="stat-icon">
              <el-icon :size="28"><Avatar /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ getMentalStatusText(overviewData.mentalStatus) }}</div>
              <div class="stat-label">心理状态</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6">
          <div class="stat-card stat-card--purple">
            <div class="stat-icon">
              <el-icon :size="28"><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value comment-preview">{{ latestCommentSummary }}</div>
              <div class="stat-label">最新评语</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="16" class="chart-row">
        <!-- 技能分类统计环形图 -->
        <el-col :lg="8" :md="12" :xs="24">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">技能分类统计</span>
              </div>
            </template>
            <div ref="skillChartRef" class="chart-container"></div>
          </el-card>
        </el-col>

        <!-- 荣誉级别分布柱状图 -->
        <el-col :lg="8" :md="12" :xs="24">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">荣誉级别分布</span>
              </div>
            </template>
            <div ref="honorChartRef" class="chart-container"></div>
          </el-card>
        </el-col>

        <!-- 最近3次考试成绩趋势折线图 -->
        <el-col :lg="8" :md="24" :xs="24">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">考试成绩趋势</span>
                <el-tag size="small" type="info">最近3次</el-tag>
              </div>
            </template>
            <div ref="scoreChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 心理健康和评语 -->
      <el-row :gutter="16" class="bottom-row">
        <!-- 最近一次心理健康记录摘要 -->
        <el-col :lg="12" :md="24">
          <el-card shadow="never" class="mental-card">
            <template #header>
              <div class="card-header">
                <el-icon color="#67c23a" :size="18"><CircleCheck /></el-icon>
                <span class="card-title">心理健康摘要</span>
                <el-button type="primary" text size="small" @click="goToMentalHealth">查看详情</el-button>
              </div>
            </template>
            <el-empty v-if="!latestMentalHealth.id" description="暂无心理健康记录" :image-size="60" />
            <div v-else class="mental-summary">
              <div class="mental-header">
                <div class="mental-date">{{ latestMentalHealth.assessmentDate }}</div>
                <el-tag :type="getStressTagType(latestMentalHealth.stressLevel)" size="small">
                  {{ getStressLevelText(latestMentalHealth.stressLevel) }}
                </el-tag>
              </div>
              <div class="mental-scores">
                <div class="score-item">
                  <div class="score-circle" :style="{ background: getScoreGradient(latestMentalHealth.totalScore) }">
                    <span>{{ latestMentalHealth.totalScore }}</span>
                  </div>
                  <div class="score-label">总得分</div>
                </div>
                <div class="score-item">
                  <div class="score-circle score-circle--emotion">
                    <span>{{ latestMentalHealth.emotionIndex || '--' }}</span>
                  </div>
                  <div class="score-label">情绪指数</div>
                </div>
                <div class="score-item">
                  <div class="score-circle score-circle--sleep">
                    <span>{{ latestMentalHealth.sleepQuality || '--' }}</span>
                  </div>
                  <div class="score-label">睡眠质量</div>
                </div>
                <div class="score-item">
                  <div class="score-circle score-circle--anxiety">
                    <span>{{ latestMentalHealth.anxietyLevel || '--' }}</span>
                  </div>
                  <div class="score-label">焦虑水平</div>
                </div>
              </div>
              <div v-if="latestMentalHealth.suggestion" class="mental-suggestion">
                <span class="suggestion-label">建议：</span>
                <span class="suggestion-text">{{ latestMentalHealth.suggestion }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 最新学期评语展示 -->
        <el-col :lg="12" :md="24">
          <el-card shadow="never" class="comment-card">
            <template #header>
              <div class="card-header">
                <el-icon color="#409eff" :size="18"><EditPen /></el-icon>
                <span class="card-title">学期评语</span>
                <el-button type="primary" text size="small" @click="goToComments">查看全部</el-button>
              </div>
            </template>
            <el-empty v-if="!latestComment.id" description="暂无评语记录" :image-size="60" />
            <div v-else class="comment-content">
              <div class="comment-header">
                <el-tag type="primary" size="small">{{ latestComment.semester || '--' }}</el-tag>
                <el-tag size="small" :type="getCommentSourceType(latestComment.source)">
                  {{ getCommentSourceText(latestComment.source) }}
                </el-tag>
                <span class="comment-type">{{ getCommentTypeText(latestComment.type) }}</span>
                <span class="comment-time">{{ latestComment.createTime }}</span>
              </div>
              <div class="comment-body">
                <p>{{ latestComment.content }}</p>
              </div>
              <div class="comment-footer">
                <span class="comment-author">— {{ latestComment.teacherName || '系统' }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 未选择学生时的占位 -->
    <el-empty v-if="!currentStudentId && !isStudentRole" description="请先选择学生" :image-size="120">
      <template #description>
        <span style="color: #909399">选择学生后查看成长档案详情</span>
      </template>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Star, Trophy, Avatar, Document, CircleCheck, EditPen, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { portfolioAPI, skillAPI, honorAPI, mentalHealthAPI, commentAPI } from '@/api/portfolio'
import { useECharts } from '@/composables/useECharts'
import { exportElementToPdf } from '@/utils/exportPdf'
import PageHeader from '@/components/common/PageHeader.vue'

defineOptions({ name: 'PortfolioOverview' })

const router = useRouter()
const userStore = useUserStore()

const breadcrumbs = [
  { label: '成长档案' },
  { label: '档案总览' }
]

// 判断是否为学生角色
const isStudentRole = computed(() => {
  return userStore.user?.role === 'student'
})

// 当前选中的学生ID
const currentStudentId = computed(() => {
  if (isStudentRole.value) {
    return userStore.user?.id || userStore.user?.studentId
  }
  return selectForm.studentId
})

// 选择表单
const selectForm = reactive({
  studentId: '',
  classId: ''
})

const loading = ref(false)
const classList = ref([])
const studentOptions = ref([])
const studentInfo = ref({})
const overviewData = ref({})
const latestMentalHealth = ref({})
const latestComment = ref({})

// 导出 PDF 相关
const exportContentRef = ref(null)
const exporting = ref(false)
// 有学生信息且不在加载中才允许导出
const canExport = computed(() => !loading.value && !!studentInfo.value?.name)

// 图表 refs
const skillChartRef = ref(null)
const honorChartRef = ref(null)
const scoreChartRef = ref(null)

// 最新评语摘要
const latestCommentSummary = computed(() => {
  if (!latestComment.value.content) return '暂无'
  const content = latestComment.value.content.replace(/<[^>]+>/g, '')
  return content.length > 8 ? content.slice(0, 8) + '...' : content
})

// 技能分类数据
const skillCategoryData = ref([
  { name: '学术', value: 0 },
  { name: '体育', value: 0 },
  { name: '艺术', value: 0 },
  { name: '技术', value: 0 },
  { name: '其他', value: 0 }
])

// 荣誉级别数据
const honorLevelData = ref([
  { name: '校级', value: 0 },
  { name: '市级', value: 0 },
  { name: '省级', value: 0 },
  { name: '国家级', value: 0 },
  { name: '国际级', value: 0 }
])

// 考试成绩数据
const examScoreData = ref([])

// 获取心理状态文字
const getMentalStatusText = (status) => {
  const map = {
    excellent: '优秀',
    good: '良好',
    normal: '一般',
    warning: '关注',
    critical: '危险'
  }
  return map[status] || '良好'
}

// 获取心理状态样式类
const getMentalStatusClass = (status) => {
  const map = {
    excellent: 'status-excellent',
    good: 'status-good',
    normal: 'status-normal',
    warning: 'status-warning',
    critical: 'status-critical'
  }
  return map[status] || 'status-good'
}

// 获取压力水平文字
const getStressLevelText = (level) => {
  const map = { low: '压力较低', medium: '压力适中', high: '压力较高' }
  return map[level] || '未知'
}

// 获取压力标签类型
const getStressTagType = (level) => {
  const map = { low: 'success', medium: 'warning', high: 'danger' }
  return map[level] || 'info'
}

// 获取分数渐变色
const getScoreGradient = (score) => {
  if (score >= 85) return 'linear-gradient(135deg, #10b981, #34d399)'
  if (score >= 70) return 'linear-gradient(135deg, #3b82f6, #60a5fa)'
  if (score >= 60) return 'linear-gradient(135deg, #f59e0b, #fbbf24)'
  return 'linear-gradient(135deg, #ef4444, #f87171)'
}

// 获取评语来源文字
const getCommentSourceText = (source) => {
  const map = { teacher: '教师', ai: 'AI生成', edited: '已编辑' }
  return map[source] || '未知'
}

// 获取评语来源标签类型
const getCommentSourceType = (source) => {
  const map = { teacher: 'primary', ai: 'success', edited: 'warning' }
  return map[source] || 'info'
}

// 获取评语类型文字
const getCommentTypeText = (type) => {
  const map = { semester: '学期评语', monthly: '月度评语', event: '事件评语', comprehensive: '综合评语' }
  return map[type] || '评语'
}

// 班级变化
const handleClassChange = () => {
  // 根据班级筛选学生列表
  loadStudentList()
}

// 学生变化
const handleStudentChange = () => {
  loadOverviewData()
}

// 加载班级列表
const loadClassList = async () => {
  try {
    // 实际项目中调用API，这里使用模拟数据
    classList.value = [
      { id: '1', name: '高一(1)班' },
      { id: '2', name: '高一(2)班' },
      { id: '3', name: '高一(3)班' }
    ]
  } catch (error) {
    console.error('加载班级列表失败:', error)
  }
}

// 加载学生列表
const loadStudentList = async () => {
  try {
    // 实际项目中调用API，这里使用模拟数据
    studentOptions.value = [
      { id: '1', name: '张三', studentNo: '2024001' },
      { id: '2', name: '李四', studentNo: '2024002' },
      { id: '3', name: '王五', studentNo: '2024003' }
    ]
  } catch (error) {
    console.error('加载学生列表失败:', error)
  }
}

// 加载总览数据
const loadOverviewData = async () => {
  if (!currentStudentId.value) return

  loading.value = true
  try {
    const res = await portfolioAPI.overview(currentStudentId.value)
    if (res.data) {
      studentInfo.value = res.data.basicInfo || {}
      overviewData.value = res.data.overview || {}
      skillCategoryData.value = res.data.skillStats || skillCategoryData.value
      honorLevelData.value = res.data.honorStats || honorLevelData.value
      examScoreData.value = res.data.examScores || []
      latestMentalHealth.value = res.data.latestMentalHealth || {}
      latestComment.value = res.data.latestComment || {}
    }
  } catch (error) {
    console.error('加载总览数据失败:', error)
    // 使用模拟数据
    loadMockData()
  } finally {
    loading.value = false
  }

  await nextTick()
  renderCharts()
}

// 加载模拟数据
const loadMockData = () => {
  studentInfo.value = {
    id: currentStudentId.value,
    name: '张三',
    studentNo: '2024001',
    className: '高一(1)班',
    gradeName: '高一年级',
    headTeacher: '王老师',
    avatar: '',
    mentalStatus: 'good'
  }

  overviewData.value = {
    skillCount: 8,
    honorCount: 5,
    mentalStatus: 'good'
  }

  skillCategoryData.value = [
    { name: '学术', value: 3 },
    { name: '体育', value: 2 },
    { name: '艺术', value: 1 },
    { name: '技术', value: 1 },
    { name: '其他', value: 1 }
  ]

  honorLevelData.value = [
    { name: '校级', value: 2 },
    { name: '市级', value: 1 },
    { name: '省级', value: 1 },
    { name: '国家级', value: 1 },
    { name: '国际级', value: 0 }
  ]

  examScoreData.value = [
    { examName: '第一次月考', totalScore: 520, classRank: 12 },
    { examName: '期中考试', totalScore: 545, classRank: 8 },
    { examName: '第二次月考', totalScore: 558, classRank: 6 }
  ]

  latestMentalHealth.value = {
    id: '1',
    assessmentDate: '2024-05-20',
    totalScore: 82,
    stressLevel: 'medium',
    emotionIndex: 75,
    sleepQuality: 80,
    anxietyLevel: 60,
    suggestion: '保持良好的作息习惯，适当参加体育活动，注意调节学习压力。'
  }

  latestComment.value = {
    id: '1',
    semester: '2023-2024学年第二学期',
    type: 'semester',
    source: 'teacher',
    content: '该生本学期学习态度端正，成绩稳步提升。在班级活动中表现积极，乐于助人，与同学相处融洽。希望继续保持良好的学习习惯，在薄弱学科上多下功夫，争取更大进步。',
    teacherName: '王老师',
    createTime: '2024-06-30'
  }
}

// 渲染图表
const renderCharts = () => {
  renderSkillChart()
  renderHonorChart()
  renderScoreChart()
}

// 渲染技能分类环形图
const renderSkillChart = () => {
  if (!skillChartRef.value) return

  const chart = useECharts(skillChartRef, null)

  const colors = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  const data = skillCategoryData.value.filter(item => item.value > 0)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { fontSize: 12, color: '#606266' }
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: data.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: colors[index % colors.length] }
        }))
      }
    ]
  }

  chart.setOption(option, true)
}

// 渲染荣誉级别分布柱状图
const renderHonorChart = () => {
  if (!honorChartRef.value) return

  const chart = useECharts(honorChartRef, null)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: honorLevelData.value.map(item => item.name),
      axisLabel: { fontSize: 11, interval: 0 }
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        type: 'bar',
        data: honorLevelData.value.map(item => item.value),
        barWidth: '50%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#f59e0b' },
              { offset: 1, color: '#fbbf24' }
            ]
          }
        }
      }
    ]
  }

  chart.setOption(option, true)
}

// 渲染考试成绩趋势折线图
const renderScoreChart = () => {
  if (!scoreChartRef.value) return

  const chart = useECharts(scoreChartRef, null)

  const data = examScoreData.value || []

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['总分', '班级排名'],
      top: 0,
      textStyle: { fontSize: 12 }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '18%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.examName),
      axisLabel: { fontSize: 11, interval: 0 }
    },
    yAxis: [
      {
        type: 'value',
        name: '总分',
        position: 'left'
      },
      {
        type: 'value',
        name: '排名',
        position: 'right',
        inverse: true
      }
    ],
    series: [
      {
        name: '总分',
        type: 'line',
        data: data.map(item => item.totalScore),
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
      },
      {
        name: '班级排名',
        type: 'line',
        yAxisIndex: 1,
        data: data.map(item => item.classRank),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 2, color: '#10b981' },
        itemStyle: { color: '#10b981' }
      }
    ]
  }

  chart.setOption(option, true)
}

// 跳转到心理健康页面
const goToMentalHealth = () => {
  router.push({ path: '/portfolio/mental-health', query: { studentId: currentStudentId.value } })
}

// 跳转到评语页面
const goToComments = () => {
  router.push({ path: '/portfolio/comments', query: { studentId: currentStudentId.value } })
}

// 导出当前学生的成长档案 PDF
const handleExportPdf = async () => {
  const container = exportContentRef.value
  if (!container) {
    ElMessage.error('导出失败：未找到导出内容')
    return
  }
  if (exporting.value) return

  exporting.value = true
  // 导出期间隐藏按钮等非内容元素，避免干扰截图
  container.classList.add('pdf-exporting')
  try {
    await nextTick()
    const name = studentInfo.value?.name || '学生'
    const studentNo = studentInfo.value?.studentNo || ''
    const className = studentInfo.value?.className || ''
    const fileName = `成长档案_${name}${studentNo ? `_${studentNo}` : ''}`
    const subtitleParts = [className, studentNo ? `学号：${studentNo}` : ''].filter(Boolean)

    await exportElementToPdf(container, fileName, {
      title: '学生成长档案',
      subtitle: subtitleParts.join('    ')
    })
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出 PDF 失败:', error)
    ElMessage.error(error?.message || '导出失败，请重试')
  } finally {
    container.classList.remove('pdf-exporting')
    exporting.value = false
  }
}

onMounted(() => {
  if (isStudentRole.value) {
    loadOverviewData()
  } else {
    loadClassList()
    loadStudentList()
  }
})
</script>

<style scoped lang="scss">
.portfolio-overview {
  padding: 20px;

  // 导出 PDF 期间：隐藏「导出PDF」按钮本身，避免被截入图片
  &.pdf-exporting {
    .export-pdf-btn {
      visibility: hidden;
    }
  }

  .student-select-card {
    margin-bottom: 16px;
  }

  .overview-content {
    // 导出 PDF 期间：隐藏卡片内的文字按钮（查看详情/查看全部）等非内容元素
    &.pdf-exporting {
      :deep(.card-header .el-button) {
        display: none;
      }
    }
    .student-info-card {
      margin-bottom: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

      :deep(.el-card__body) {
        padding: 24px;
      }

      .student-info {
        display: flex;
        align-items: center;
        gap: 24px;

        &-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        &-avatar {
          border: 4px solid rgba(255, 255, 255, 0.3);
        }

        .avatar-badge {
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 12px;
          background: #fff;
          white-space: nowrap;

          &.status-excellent { color: #10b981; }
          &.status-good { color: #3b82f6; }
          &.status-normal { color: #f59e0b; }
          &.status-warning { color: #ef4444; }
          &.status-critical { color: #dc2626; }
        }

        &-detail {
          flex: 1;
          color: #fff;

          .student-name {
            margin: 0 0 10px 0;
            font-size: 24px;
            font-weight: 600;
            color: #fff;
          }

          .student-meta {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;

            :deep(.el-tag) {
              background: rgba(255, 255, 255, 0.2);
              border-color: transparent;
              color: #fff;
            }

            .meta-item {
              color: rgba(255, 255, 255, 0.8);
              font-size: 14px;
            }
          }
        }
      }
    }

    .stats-row {
      margin-bottom: 16px;

      .stat-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        border-radius: 12px;
        color: #fff;

        &--blue {
          background: linear-gradient(135deg, #3b82f6, #60a5fa);
        }

        &--orange {
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
        }

        &--green {
          background: linear-gradient(135deg, #10b981, #34d399);
        }

        &--purple {
          background: linear-gradient(135deg, #8b5cf6, #a78bfa);
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-content {
          flex: 1;
          min-width: 0;

          .stat-value {
            font-size: 26px;
            font-weight: 700;
            line-height: 1.2;

            &.comment-preview {
              font-size: 16px;
              font-weight: 500;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }

          .stat-label {
            font-size: 13px;
            opacity: 0.9;
            margin-top: 4px;
          }
        }
      }
    }

    .chart-row {
      margin-bottom: 16px;

      .chart-card {
        height: 100%;

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .card-title {
            font-weight: 600;
            font-size: 15px;
          }
        }

        .chart-container {
          width: 100%;
          height: 260px;
        }
      }
    }

    .bottom-row {
      .mental-card,
      .comment-card {
        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;

          .card-title {
            font-weight: 600;
            font-size: 15px;
            flex: 1;
          }
        }

        .mental-summary {
          .mental-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;

            .mental-date {
              font-size: 15px;
              font-weight: 600;
              color: #303133;
            }
          }

          .mental-scores {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 16px;

            .score-item {
              text-align: center;

              .score-circle {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                margin: 0 auto 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 18px;
                font-weight: 600;

                &--emotion {
                  background: linear-gradient(135deg, #ec4899, #f472b6);
                }

                &--sleep {
                  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
                }

                &--anxiety {
                  background: linear-gradient(135deg, #f97316, #fb923c);
                }
              }

              .score-label {
                font-size: 12px;
                color: #909399;
              }
            }
          }

          .mental-suggestion {
            padding: 12px;
            background: #f0fdf4;
            border-radius: 8px;
            font-size: 13px;
            line-height: 1.6;

            .suggestion-label {
              color: #10b981;
              font-weight: 600;
            }

            .suggestion-text {
              color: #606266;
            }
          }
        }

        .comment-content {
          .comment-header {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 12px;

            .comment-type {
              font-size: 13px;
              color: #606266;
            }

            .comment-time {
              margin-left: auto;
              font-size: 12px;
              color: #909399;
            }
          }

          .comment-body {
            padding: 16px;
            background: #f5f7fa;
            border-radius: 8px;
            margin-bottom: 12px;

            p {
              margin: 0;
              font-size: 14px;
              color: #606266;
              line-height: 1.8;
            }
          }

          .comment-footer {
            text-align: right;

            .comment-author {
              font-size: 13px;
              color: #909399;
            }
          }
        }
      }
    }
  }
}
</style>
