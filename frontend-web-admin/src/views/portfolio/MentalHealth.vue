<template>
  <div class="mental-health">
    <PageHeader
      title="心理健康"
      description="查看和管理学生心理健康测评记录"
      :breadcrumbs="breadcrumbs"
    >
      <template #extra>
        <el-button v-if="isTeacherOrAdmin" type="primary" :icon="Plus" @click="handleAdd">
          新增记录
        </el-button>
      </template>
    </PageHeader>

    <!-- 筛选区 -->
    <el-card shadow="never" class="filter-card">
      <!-- 学生选择器（教师/管理员可见） -->
      <el-form v-if="!isStudentRole" :inline="true" :model="studentSelectForm" class="student-select-form">
        <el-form-item label="选择学生">
          <el-select
            v-model="studentSelectForm.studentId"
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
      </el-form>

      <SearchForm
        :fields="searchFields"
        v-model="searchParams"
        @search="handleSearch"
        @reset="handleReset"
      />
    </el-card>

    <!-- 趋势图表区域 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :lg="12" :md="24">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">情绪指数趋势</span>
              <el-tag type="success" size="small">近6次测评</el-tag>
            </div>
          </template>
          <div ref="emotionChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :lg="12" :md="24">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">压力水平变化</span>
              <el-tag type="warning" size="small">近6次测评</el-tag>
            </div>
          </template>
          <div ref="stressChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 记录列表 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">测评记录列表</span>
          <span class="record-count">共 {{ pagination.total }} 条记录</span>
        </div>
      </template>

      <DataTable
        :columns="tableColumns"
        :data="dataList"
        :loading="loading"
        :pagination="pagination"
        :index="true"
        @update:page="handlePageChange"
        @update:pageSize="handleSizeChange"
      >
        <template #totalScore="{ row }">
          <span class="score-value" :class="getScoreClass(row.totalScore)">
            {{ row.totalScore }}
          </span>
        </template>

        <template #stressLevel="{ row }">
          <el-tag :type="getStressTagType(row.stressLevel)" size="small">
            {{ getStressLevelText(row.stressLevel) }}
          </el-tag>
        </template>

        <template #emotionIndex="{ row }">
          <div class="emotion-index">
            <el-progress
              :percentage="row.emotionIndex || 0"
              :color="getEmotionColor(row.emotionIndex)"
              :stroke-width="8"
              :show-text="false"
              style="width: 80px; margin-right: 8px"
            />
            <span>{{ row.emotionIndex || '--' }}</span>
          </div>
        </template>

        <template #action="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">
            查看
          </el-button>
          <el-button v-if="isTeacherOrAdmin" type="primary" link size="small" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button v-if="isTeacherOrAdmin" type="danger" link size="small" @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </DataTable>
    </el-card>

    <!-- 查看详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="测评详情"
      width="700px"
      :close-on-click-modal="true"
    >
      <div v-loading="detailLoading" class="detail-content">
        <!-- 基本信息 -->
        <div class="detail-header">
          <div class="detail-basic">
            <el-tag type="primary" size="small">{{ detailData.assessmentTypeText || '心理健康测评' }}</el-tag>
            <span class="detail-date">{{ detailData.assessmentDate || '--' }}</span>
          </div>
          <div class="detail-scores">
            <div class="score-badge score-badge--total">
              <span class="score-num">{{ detailData.totalScore || '--' }}</span>
              <span class="score-label">总得分</span>
            </div>
            <div class="score-badge score-badge--stress">
              <span class="score-num">{{ getStressLevelText(detailData.stressLevel) }}</span>
              <span class="score-label">压力水平</span>
            </div>
          </div>
        </div>

        <!-- 雷达图 -->
        <div class="radar-section">
          <h4 class="section-title">各维度详细数据</h4>
          <div ref="radarChartRef" class="radar-chart"></div>
        </div>

        <!-- 维度数据列表 -->
        <div class="dimension-list">
          <div v-for="dim in dimensionList" :key="dim.key" class="dimension-item">
            <div class="dim-header">
              <span class="dim-name">{{ dim.name }}</span>
              <span class="dim-score">{{ detailData[dim.key] || '--' }}分</span>
            </div>
            <el-progress
              :percentage="detailData[dim.key] || 0"
              :color="dim.color"
              :stroke-width="6"
              :show-text="false"
            />
          </div>
        </div>

        <!-- 备注和建议 -->
        <div v-if="detailData.notes || detailData.suggestion" class="notes-section">
          <div v-if="detailData.notes" class="notes-block">
            <h4 class="section-title">
              <el-icon color="#909399"><Document /></el-icon>
              测评备注
            </h4>
            <p class="notes-content">{{ detailData.notes }}</p>
          </div>
          <div v-if="detailData.suggestion" class="suggestion-block">
            <h4 class="section-title">
              <el-icon color="#67c23a"><CircleCheck /></el-icon>
              建议与指导
            </h4>
            <p class="suggestion-content">{{ detailData.suggestion }}</p>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="formDialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="测评类型" prop="assessmentType">
          <el-select
            v-model="formData.assessmentType"
            placeholder="请选择测评类型"
            style="width: 100%"
          >
            <el-option label="心理健康综合测评" value="comprehensive" />
            <el-option label="情绪状态测评" value="emotion" />
            <el-option label="压力水平测评" value="stress" />
            <el-option label="睡眠质量测评" value="sleep" />
            <el-option label="焦虑自评量表" value="anxiety" />
            <el-option label="抑郁自评量表" value="depression" />
          </el-select>
        </el-form-item>

        <el-form-item label="测评日期" prop="assessmentDate">
          <el-date-picker
            v-model="formData.assessmentDate"
            type="date"
            placeholder="请选择测评日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="总得分" prop="totalScore">
              <el-input-number
                v-model="formData.totalScore"
                :min="0"
                :max="100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="压力水平" prop="stressLevel">
              <el-select
                v-model="formData.stressLevel"
                placeholder="请选择"
                style="width: 100%"
              >
                <el-option label="压力较低" value="low" />
                <el-option label="压力适中" value="medium" />
                <el-option label="压力较高" value="high" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="情绪指数" prop="emotionIndex">
              <el-input-number
                v-model="formData.emotionIndex"
                :min="0"
                :max="100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="睡眠质量" prop="sleepQuality">
              <el-input-number
                v-model="formData.sleepQuality"
                :min="0"
                :max="100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="焦虑水平" prop="anxietyLevel">
              <el-input-number
                v-model="formData.anxietyLevel"
                :min="0"
                :max="100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="抑郁水平" prop="depressionLevel">
              <el-input-number
                v-model="formData.depressionLevel"
                :min="0"
                :max="100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="人际敏感" prop="interpersonalSensitivity">
              <el-input-number
                v-model="formData.interpersonalSensitivity"
                :min="0"
                :max="100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="生活适应" prop="lifeAdaptation">
              <el-input-number
                v-model="formData.lifeAdaptation"
                :min="0"
                :max="100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="测评备注" prop="notes">
          <el-input
            v-model="formData.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入测评备注"
            maxlength="300"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="建议指导" prop="suggestion">
          <el-input
            v-model="formData.suggestion"
            type="textarea"
            :rows="3"
            placeholder="请输入建议与指导"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleFormClose">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Document, CircleCheck } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { mentalHealthAPI } from '@/api/portfolio'
import { useTable } from '@/composables/useTable'
import { useDialog } from '@/composables/useDialog'
import { useECharts } from '@/composables/useECharts'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchForm from '@/components/common/SearchForm.vue'
import DataTable from '@/components/common/DataTable.vue'

defineOptions({ name: 'MentalHealth' })

const route = useRoute()
const userStore = useUserStore()

const breadcrumbs = [
  { label: '成长档案' },
  { label: '心理健康' }
]

// 判断角色
const isStudentRole = computed(() => userStore.user?.role === 'student')
const isTeacherOrAdmin = computed(() => ['teacher', 'admin'].includes(userStore.user?.role))

// 当前学生ID
const currentStudentId = computed(() => {
  if (isStudentRole.value) {
    return userStore.user?.id || userStore.user?.studentId
  }
  return studentSelectForm.studentId
})

// 学生选择表单
const studentSelectForm = reactive({
  studentId: ''
})

const studentOptions = ref([])

// 搜索字段配置
const searchFields = [
  {
    prop: 'assessmentType',
    label: '测评类型',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '心理健康综合测评', value: 'comprehensive' },
      { label: '情绪状态测评', value: 'emotion' },
      { label: '压力水平测评', value: 'stress' },
      { label: '睡眠质量测评', value: 'sleep' },
      { label: '焦虑自评量表', value: 'anxiety' },
      { label: '抑郁自评量表', value: 'depression' }
    ],
    placeholder: '请选择类型'
  },
  {
    prop: 'dateRange',
    label: '测评日期',
    type: 'date',
    dateType: 'daterange',
    startPlaceholder: '开始日期',
    endPlaceholder: '结束日期'
  }
]

// 表格列配置
const tableColumns = [
  { prop: 'assessmentDate', label: '测评日期', width: 120 },
  { prop: 'assessmentTypeText', label: '测评类型', minWidth: 140 },
  { prop: 'totalScore', label: '总得分', width: 100, slot: 'totalScore' },
  { prop: 'stressLevel', label: '压力水平', width: 100, slot: 'stressLevel' },
  { prop: 'emotionIndex', label: '情绪指数', width: 160, slot: 'emotionIndex' }
]

// 维度列表
const dimensionList = [
  { key: 'emotionIndex', name: '情绪指数', color: '#ec4899' },
  { key: 'sleepQuality', name: '睡眠质量', color: '#8b5cf6' },
  { key: 'anxietyLevel', name: '焦虑水平', color: '#f97316' },
  { key: 'depressionLevel', name: '抑郁水平', color: '#ef4444' },
  { key: 'interpersonalSensitivity', name: '人际敏感', color: '#3b82f6' },
  { key: 'lifeAdaptation', name: '生活适应', color: '#10b981' }
]

// 使用 useTable
const {
  loading,
  dataList,
  pagination,
  searchParams,
  handleSearch,
  handleReset,
  handlePageChange,
  handleSizeChange,
  fetchData
} = useTable((params) => {
  if (!currentStudentId.value) return Promise.resolve({ data: [] })
  return mentalHealthAPI.list(currentStudentId.value, params)
}, {
  assessmentType: '',
  dateRange: []
})

// 表单弹窗
const formDialog = useDialog({
  assessmentType: 'comprehensive',
  assessmentDate: '',
  totalScore: 80,
  stressLevel: 'medium',
  emotionIndex: 75,
  sleepQuality: 70,
  anxietyLevel: 50,
  depressionLevel: 45,
  interpersonalSensitivity: 60,
  lifeAdaptation: 75,
  notes: '',
  suggestion: ''
})

const formDialogVisible = computed(() => formDialog.visible.value)
const formDialogTitle = computed(() => formDialog.title.value)
const formData = formDialog.formData
const formRef = formDialog.formRef
const submitLoading = formDialog.loading

// 详情弹窗
const detailDialogVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref({})

// 图表 refs
const emotionChartRef = ref(null)
const stressChartRef = ref(null)
const radarChartRef = ref(null)

// 趋势数据
const trendData = ref([])

// 表单验证规则
const formRules = {
  assessmentType: [
    { required: true, message: '请选择测评类型', trigger: 'change' }
  ],
  assessmentDate: [
    { required: true, message: '请选择测评日期', trigger: 'change' }
  ],
  totalScore: [
    { required: true, message: '请输入总得分', trigger: 'blur' }
  ],
  stressLevel: [
    { required: true, message: '请选择压力水平', trigger: 'change' }
  ]
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

// 获取分数样式类
const getScoreClass = (score) => {
  if (score >= 85) return 'score-excellent'
  if (score >= 70) return 'score-good'
  if (score >= 60) return 'score-normal'
  return 'score-low'
}

// 获取情绪颜色
const getEmotionColor = (score) => {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#3b82f6'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

// 加载学生列表
const loadStudentList = async () => {
  try {
    studentOptions.value = [
      { id: '1', name: '张三', studentNo: '2024001' },
      { id: '2', name: '李四', studentNo: '2024002' },
      { id: '3', name: '王五', studentNo: '2024003' }
    ]
  } catch (error) {
    console.error('加载学生列表失败:', error)
  }
}

// 学生变化
const handleStudentChange = () => {
  pagination.page = 1
  fetchData()
  loadTrendData()
}

// 加载趋势数据
const loadTrendData = async () => {
  if (!currentStudentId.value) return

  try {
    const res = await mentalHealthAPI.trend(currentStudentId.value)
    if (res.data) {
      trendData.value = res.data
    }
  } catch (error) {
    console.error('加载趋势数据失败:', error)
    // 模拟数据
    trendData.value = [
      { date: '01-15', emotionIndex: 72, stressLevel: 55, totalScore: 78 },
      { date: '02-20', emotionIndex: 68, stressLevel: 62, totalScore: 75 },
      { date: '03-18', emotionIndex: 75, stressLevel: 50, totalScore: 80 },
      { date: '04-22', emotionIndex: 70, stressLevel: 58, totalScore: 76 },
      { date: '05-20', emotionIndex: 78, stressLevel: 48, totalScore: 82 },
      { date: '06-15', emotionIndex: 82, stressLevel: 45, totalScore: 85 }
    ]
  }

  await nextTick()
  renderTrendCharts()
}

// 渲染趋势图表
const renderTrendCharts = () => {
  renderEmotionChart()
  renderStressChart()
}

// 渲染情绪指数趋势图
const renderEmotionChart = () => {
  if (!emotionChartRef.value) return

  const chart = useECharts(emotionChartRef, null)
  const data = trendData.value || []

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date),
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: '指数'
    },
    series: [
      {
        name: '情绪指数',
        type: 'line',
        data: data.map(item => item.emotionIndex),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#ec4899' },
        itemStyle: { color: '#ec4899' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(236, 72, 153, 0.3)' },
              { offset: 1, color: 'rgba(236, 72, 153, 0.05)' }
            ]
          }
        }
      }
    ]
  }

  chart.setOption(option, true)
}

// 渲染压力水平变化图
const renderStressChart = () => {
  if (!stressChartRef.value) return

  const chart = useECharts(stressChartRef, null)
  const data = trendData.value || []

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date),
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: '压力值'
    },
    series: [
      {
        name: '压力水平',
        type: 'line',
        data: data.map(item => item.stressLevel),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#f59e0b' },
        itemStyle: { color: '#f59e0b' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
              { offset: 1, color: 'rgba(245, 158, 11, 0.05)' }
            ]
          }
        },
        markLine: {
          silent: true,
          lineStyle: { color: '#ef4444', type: 'dashed' },
          data: [
            { yAxis: 70, label: { formatter: '警戒线', color: '#ef4444' } }
          ]
        }
      }
    ]
  }

  chart.setOption(option, true)
}

// 查看详情
const handleView = async (row) => {
  detailDialogVisible.value = true
  detailLoading.value = true

  try {
    // 模拟加载详情数据
    await new Promise(resolve => setTimeout(resolve, 300))
    detailData.value = {
      ...row,
      assessmentTypeText: getAssessmentTypeText(row.assessmentType),
      emotionIndex: row.emotionIndex || 75,
      sleepQuality: row.sleepQuality || 70,
      anxietyLevel: row.anxietyLevel || 50,
      depressionLevel: row.depressionLevel || 45,
      interpersonalSensitivity: row.interpersonalSensitivity || 60,
      lifeAdaptation: row.lifeAdaptation || 75,
      notes: row.notes || '学生近期学习压力稍大，整体心理状态良好。',
      suggestion: row.suggestion || '建议保持规律作息，适当参加体育活动，注意劳逸结合。遇到问题可以主动与老师或同学沟通交流。'
    }

    await nextTick()
    renderRadarChart()
  } catch (error) {
    console.error(error)
  } finally {
    detailLoading.value = false
  }
}

// 获取测评类型文字
const getAssessmentTypeText = (type) => {
  const map = {
    comprehensive: '心理健康综合测评',
    emotion: '情绪状态测评',
    stress: '压力水平测评',
    sleep: '睡眠质量测评',
    anxiety: '焦虑自评量表',
    depression: '抑郁自评量表'
  }
  return map[type] || type
}

// 渲染雷达图
const renderRadarChart = () => {
  if (!radarChartRef.value) return

  const chart = useECharts(radarChartRef, null)

  const indicators = dimensionList.map(dim => ({
    name: dim.name,
    max: 100
  }))

  const values = dimensionList.map(dim => detailData.value[dim.key] || 0)

  const option = {
    tooltip: {},
    radar: {
      indicator: indicators,
      radius: '65%',
      center: ['50%', '50%'],
      axisName: { color: '#606266', fontSize: 12 },
      splitArea: {
        areaStyle: {
          color: ['rgba(102, 126, 234, 0.05)', 'rgba(102, 126, 234, 0.1)']
        }
      }
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: values,
            name: '测评数据',
            areaStyle: { color: 'rgba(102, 126, 234, 0.3)' },
            lineStyle: { color: '#667eea', width: 2 },
            itemStyle: { color: '#667eea' }
          }
        ]
      }
    ]
  }

  chart.setOption(option, true)
}

// 新增
const handleAdd = () => {
  if (!currentStudentId.value) {
    ElMessage.warning('请先选择学生')
    return
  }
  formDialog.openAdd({ studentId: currentStudentId.value })
}

// 编辑
const handleEdit = (row) => {
  formDialog.openEdit(row)
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除该测评记录吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await mentalHealthAPI.delete(row.id)
      ElMessage.success('删除成功')
      fetchData()
      loadTrendData()
    } catch (error) {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }).catch(() => {})
}

// 提交
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  submitLoading.value = true
  try {
    if (formDialog.mode.value === 'add') {
      await mentalHealthAPI.create({
        ...formData,
        studentId: currentStudentId.value
      })
      ElMessage.success('新增成功')
    } else {
      await mentalHealthAPI.update(formData.id, formData)
      ElMessage.success('编辑成功')
    }
    formDialog.close()
    fetchData()
    loadTrendData()
  } catch (error) {
    ElMessage.error(formDialog.mode.value === 'add' ? '新增失败' : '编辑失败')
    console.error(error)
  } finally {
    submitLoading.value = false
  }
}

// 关闭表单弹窗
const handleFormClose = () => {
  formDialog.close()
}

onMounted(() => {
  if (isStudentRole.value) {
    fetchData()
    loadTrendData()
  } else {
    loadStudentList()
    if (route.query.studentId) {
      studentSelectForm.studentId = route.query.studentId
      fetchData()
      loadTrendData()
    }
  }
})
</script>

<style scoped lang="scss">
.mental-health {
  padding: 20px;

  .filter-card {
    margin-bottom: 16px;

    .student-select-form {
      margin-bottom: 8px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0f0f0;
    }
  }

  .chart-row {
    margin-bottom: 16px;

    .chart-card {
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

  .table-card {
    margin-bottom: 16px;

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .card-title {
        font-weight: 600;
        font-size: 15px;
      }

      .record-count {
        font-size: 13px;
        color: #909399;
      }
    }
  }

  .score-value {
    font-weight: 600;
    font-size: 16px;

    &.score-excellent { color: #10b981; }
    &.score-good { color: #3b82f6; }
    &.score-normal { color: #f59e0b; }
    &.score-low { color: #ef4444; }
  }

  .emotion-index {
    display: flex;
    align-items: center;
  }

  // 详情弹窗
  .detail-content {
    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 20px;
      border-bottom: 1px solid #f0f0f0;
      margin-bottom: 20px;

      .detail-basic {
        display: flex;
        align-items: center;
        gap: 12px;

        .detail-date {
          font-size: 14px;
          color: #606266;
        }
      }

      .detail-scores {
        display: flex;
        gap: 24px;

        .score-badge {
          text-align: center;

          .score-num {
            display: block;
            font-size: 28px;
            font-weight: 700;
            line-height: 1.2;
          }

          .score-label {
            font-size: 12px;
            color: #909399;
            margin-top: 4px;
          }

          &--total .score-num {
            color: #667eea;
          }

          &--stress .score-num {
            font-size: 16px;
            color: #f59e0b;
          }
        }
      }
    }

    .radar-section {
      margin-bottom: 20px;

      .section-title {
        margin: 0 0 12px 0;
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }

      .radar-chart {
        width: 100%;
        height: 280px;
      }
    }

    .dimension-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px 24px;
      margin-bottom: 20px;

      .dimension-item {
        .dim-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;

          .dim-name {
            font-size: 13px;
            color: #606266;
          }

          .dim-score {
            font-size: 13px;
            font-weight: 600;
            color: #303133;
          }
        }
      }
    }

    .notes-section {
      .notes-block,
      .suggestion-block {
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .notes-block {
        background: #f5f7fa;

        .notes-content {
          margin: 8px 0 0 0;
          font-size: 14px;
          color: #606266;
          line-height: 1.6;
        }
      }

      .suggestion-block {
        background: #f0fdf4;

        .suggestion-content {
          margin: 8px 0 0 0;
          font-size: 14px;
          color: #606266;
          line-height: 1.6;
        }
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }
    }
  }
}
</style>
