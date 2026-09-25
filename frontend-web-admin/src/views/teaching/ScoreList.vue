<template>
  <div class="score-list">
    <PageHeader title="成绩管理" description="管理学生考试成绩信息" :breadcrumbs="breadcrumbs">
      <template #extra>
        <el-button :icon="Download" @click="handleExport">导出成绩</el-button>
        <el-button type="primary" :icon="Upload" @click="handleImport">导入成绩</el-button>
      </template>
    </PageHeader>

    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="考试">
          <el-select
            v-model="filterForm.examId"
            placeholder="请选择考试"
            style="width: 200px"
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
        <el-form-item label="班级">
          <el-select
            v-model="filterForm.classId"
            placeholder="请选择班级"
            style="width: 180px"
            filterable
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
        <el-form-item label="科目">
          <el-select
            v-model="filterForm.subjectId"
            placeholder="请选择科目"
            style="width: 180px"
            filterable
            clearable
            @change="handleSubjectChange"
          >
            <el-option label="全部科目" value="" />
            <el-option
              v-for="sub in subjectList"
              :key="sub.id"
              :label="sub.name"
              :value="sub.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">查询</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">成绩列表</span>
          <div class="view-switch">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button value="student">按学生</el-radio-button>
              <el-radio-button value="subject">按科目</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <DataTable
        :columns="currentColumns"
        :data="dataList"
        :loading="loading"
        :pagination="pagination"
        index
        index-label="序号"
        @update:page="handlePageChange"
        @update:pageSize="handleSizeChange"
      >
        <template #totalScore="{ row }">
          <span class="score-highlight">{{ row.totalScore }}</span>
        </template>

        <template #averageScore="{ row }">
          <span>{{ row.averageScore?.toFixed(1) }}</span>
        </template>

        <template #classRank="{ row }">
          <el-tag :type="getRankTagType(row.classRank)" size="small">{{ row.classRank }}</el-tag>
        </template>

        <template #gradeRank="{ row }">
          <el-tag :type="getRankTagType(row.gradeRank)" size="small">{{ row.gradeRank }}</el-tag>
        </template>

        <template #action="{ row }">
          <el-button type="primary" link @click="handleViewStudent(row)">学生详情</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </DataTable>
    </el-card>

    <ScoreImport
      ref="importRef"
      :visible="importVisible"
      :exam-list="examList"
      :class-list="classList"
      @close="importVisible = false"
      @success="handleImportSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, RefreshLeft, Upload, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { scoreAPI, examAPI, classAPI, subjectAPI } from '@/api/teaching'
import { useTable } from '@/composables/useTable'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/common/DataTable.vue'
import ScoreImport from './ScoreImport.vue'

const breadcrumbs = [
  { label: '教学管理' },
  { label: '成绩管理' }
]

const filterForm = reactive({
  examId: '',
  classId: '',
  subjectId: ''
})

const viewMode = ref('student') // student / subject

const examList = ref([])
const classList = ref([])
const subjectList = ref([])
const importVisible = ref(false)
const importRef = ref(null)

const defaultParams = {
  examId: '',
  classId: '',
  subjectId: ''
}

const { loading, dataList, pagination, searchParams, handlePageChange, handleSizeChange, refresh } = useTable(scoreAPI.list, defaultParams)

// 学生视图列
const studentColumns = computed(() => {
  const baseColumns = [
    { prop: 'studentNo', label: '学号', width: 120 },
    { prop: 'studentName', label: '姓名', width: 100 },
    { prop: 'className', label: '班级', width: 120 }
  ]

  // 动态添加各科分数列
  if (subjectList.value.length > 0 && !filterForm.subjectId) {
    subjectList.value.forEach(sub => {
      baseColumns.push({
        prop: `subject_${sub.id}`,
        label: sub.name,
        width: 100,
        align: 'center',
        formatter: (row) => {
          const subjectScore = row.subjectScores?.find(s => s.subjectId === sub.id)
          return subjectScore?.score ?? '-'
        }
      })
    })
  } else if (filterForm.subjectId) {
    const sub = subjectList.value.find(s => s.id === filterForm.subjectId)
    if (sub) {
      baseColumns.push({
        prop: 'score',
        label: sub.name,
        width: 100,
        align: 'center',
        formatter: (row) => row.score ?? '-'
      })
    }
  }

  baseColumns.push(
    { prop: 'totalScore', label: '总分', width: 100, align: 'center', slot: 'totalScore' },
    { prop: 'averageScore', label: '平均分', width: 100, align: 'center', slot: 'averageScore' },
    { prop: 'classRank', label: '班级排名', width: 100, align: 'center', slot: 'classRank' },
    { prop: 'gradeRank', label: '年级排名', width: 100, align: 'center', slot: 'gradeRank' }
  )

  return baseColumns
})

// 科目视图列
const subjectColumns = computed(() => {
  return [
    { prop: 'subjectName', label: '科目', width: 120 },
    { prop: 'fullScore', label: '满分', width: 100, align: 'center' },
    { prop: 'averageScore', label: '平均分', width: 100, align: 'center', formatter: (r) => r.averageScore?.toFixed(1) },
    { prop: 'highestScore', label: '最高分', width: 100, align: 'center' },
    { prop: 'lowestScore', label: '最低分', width: 100, align: 'center' },
    { prop: 'passRate', label: '及格率', width: 100, align: 'center', formatter: (r) => `${(r.passRate * 100).toFixed(1)}%` },
    { prop: 'excellentRate', label: '优秀率', width: 100, align: 'center', formatter: (r) => `${(r.excellentRate * 100).toFixed(1)}%` }
  ]
})

const currentColumns = computed(() => {
  if (viewMode.value === 'student') {
    return [...studentColumns.value, { slot: 'action', width: 160, fixed: 'right', align: 'center' }]
  }
  return subjectColumns.value
})

const getRankTagType = (rank) => {
  if (!rank) return 'info'
  if (rank <= 10) return 'success'
  if (rank <= 30) return 'warning'
  return 'info'
}

const loadExamList = async () => {
  try {
    const res = await examAPI.list({ page: 1, pageSize: 100 })
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

const loadSubjectList = async () => {
  try {
    const res = await subjectAPI.allSimple()
    if (res.data) {
      subjectList.value = res.data
    }
  } catch (error) {
    console.error('加载科目列表失败:', error)
  }
}

const handleExamChange = () => {
  // 切换考试时可以重新加载相关数据
}

const handleClassChange = () => {
  // 切换班级时触发查询
}

const handleSubjectChange = () => {
  // 切换科目时触发查询
}

const handleSearch = () => {
  Object.assign(searchParams, filterForm)
  pagination.page = 1
  refresh()
}

const handleReset = () => {
  filterForm.examId = ''
  filterForm.classId = ''
  filterForm.subjectId = ''
  Object.assign(searchParams, defaultParams)
  pagination.page = 1
  refresh()
}

const handleImport = () => {
  if (!filterForm.examId) {
    ElMessage.warning('请先选择考试')
    return
  }
  importVisible.value = true
}

const handleImportSuccess = () => {
  importVisible.value = false
  ElMessage.success('导入成功')
  refresh()
}

const handleExport = () => {
  if (!filterForm.examId) {
    ElMessage.warning('请先选择考试')
    return
  }
  ElMessage.info('导出功能开发中...')
}

const handleViewStudent = (row) => {
  // 跳转到学生分析页
  ElMessage.info(`查看学生 ${row.studentName} 的详细分析`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除该学生的成绩记录吗？`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await scoreAPI.delete(row.id)
      ElMessage.success('删除成功')
      refresh()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  loadExamList()
  loadClassList()
  loadSubjectList()
})
</script>

<style scoped lang="scss">
.score-list {
  padding: 20px;

  .filter-card {
    margin-bottom: 16px;
  }

  .table-card {
    margin-bottom: 16px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-weight: 600;
      font-size: 16px;
    }
  }

  .score-highlight {
    font-weight: 600;
    color: #409eff;
  }
}
</style>
