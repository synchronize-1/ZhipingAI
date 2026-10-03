<template>
  <div class="elective-manage">
    <PageHeader
      title="选修课管理"
      description="发布与管理选修课程，设置选课容量、时间窗口与年级范围，并查看选课名单"
      :breadcrumbs="[{ label: '教学管理' }, { label: '选修课管理' }]"
    >
      <template #extra>
        <el-button :icon="Refresh" @click="refreshAll">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">发布选修课</el-button>
      </template>
    </PageHeader>

    <!-- 统计概览 -->
    <div class="stat-grid">
      <div v-for="card in statCards" :key="card.label" class="stat-card">
        <div class="stat-icon" :style="{ background: card.bg }">
          <el-icon :size="22"><component :is="card.icon" /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
      </div>
    </div>

    <!-- 筛选 -->
    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <el-select v-model="query.semester" placeholder="全部学期" clearable style="width: 180px" @change="reload">
          <el-option v-for="s in options.semesters" :key="s" :label="s" :value="s" />
        </el-select>
        <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 150px" @change="reload">
          <el-option label="草稿" value="draft" />
          <el-option label="开放选课" value="open" />
          <el-option label="已关闭" value="closed" />
        </el-select>
        <el-select v-model="query.grade" placeholder="全部年级" clearable style="width: 150px" @change="reload">
          <el-option v-for="g in options.grades" :key="g" :label="g" :value="g" />
        </el-select>
        <el-input
          v-model="query.keyword"
          placeholder="搜索课程名称 / 编号"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
          @keyup.enter="reload"
          @clear="reload"
        />
        <el-button type="primary" :icon="Search" @click="reload">查询</el-button>
      </div>
    </el-card>

    <!-- 列表 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="code" label="编号" width="100" show-overflow-tooltip />
        <el-table-column prop="name" label="课程名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="category" label="类别" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.category" effect="plain" size="small">{{ row.category }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="teacherName" label="授课教师" width="110">
          <template #default="{ row }">{{ row.teacherName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="semester" label="学期" width="130" show-overflow-tooltip />
        <el-table-column label="年级" width="90" align="center">
          <template #default="{ row }">{{ row.grade || '不限' }}</template>
        </el-table-column>
        <el-table-column label="选课情况" width="150" align="center">
          <template #default="{ row }">
            <div class="capacity-cell">
              <span :class="{ 'is-full': row.isFull }">{{ row.selectedCount }} / {{ row.capacity }}</span>
              <el-progress
                :percentage="capacityPercent(row)"
                :stroke-width="6"
                :show-text="false"
                :status="row.isFull ? 'exception' : undefined"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="学分" width="80" align="center">
          <template #default="{ row }">{{ row.credit ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="选课窗口" min-width="210">
          <template #default="{ row }">
            <div class="window-cell">{{ formatRange(row.selectStart, row.selectEnd) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.status).type" size="small">{{ statusMeta(row.status).text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="User" @click="openStudents(row)">名单</el-button>
            <el-button link type="primary" :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无选修课，点击右上角「发布选修课」创建" />
        </template>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="loadList"
          @size-change="reload"
        />
      </div>
    </el-card>

    <!-- 发布 / 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '发布选修课' : '编辑选修课'"
      width="720px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="96px">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="课程名称" prop="name">
              <el-input v-model="form.name" placeholder="如：中国古典诗词鉴赏" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="课程编号" prop="code">
              <el-input v-model="form.code" placeholder="选填，如 EL101" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="课程类别" prop="category">
              <el-select v-model="form.category" placeholder="选择类别" clearable style="width: 100%">
                <el-option v-for="c in options.categories" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="学期" prop="semester">
              <el-select
                v-model="form.semester"
                placeholder="选择或输入学期"
                filterable
                allow-create
                default-first-option
                style="width: 100%"
              >
                <el-option v-for="s in options.semesters" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="授课教师" prop="teacherId">
              <el-select v-model="form.teacherId" placeholder="选择教师" clearable filterable style="width: 100%">
                <el-option v-for="t in options.teachers" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="关联学科" prop="subjectId">
              <el-select v-model="form.subjectId" placeholder="选择学科" clearable style="width: 100%">
                <el-option v-for="s in options.subjects" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="限定年级" prop="grade">
              <el-select v-model="form.grade" placeholder="不限" clearable style="width: 100%">
                <el-option v-for="g in options.grades" :key="g" :label="g" :value="g" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="选课容量" prop="capacity">
              <el-input-number v-model="form.capacity" :min="1" :max="9999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="学分" prop="credit">
              <el-input-number v-model="form.credit" :min="0" :max="99" :precision="1" :step="0.5" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="上课地点" prop="location">
              <el-input v-model="form.location" placeholder="如：文科楼 201" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="上课时间" prop="scheduleText">
              <el-input v-model="form.scheduleText" placeholder="如：周三 7-8 节" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="选课开始" prop="selectStart">
              <el-date-picker
                v-model="form.selectStart"
                type="datetime"
                placeholder="选填"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="选课结束" prop="selectEnd">
              <el-date-picker
                v-model="form.selectEnd"
                type="datetime"
                placeholder="选填"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="草稿" value="draft" />
                <el-option label="开放选课" value="open" />
                <el-option label="已关闭" value="closed" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="课程简介" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                maxlength="500"
                show-word-limit
                placeholder="选填，简要介绍课程内容与要求"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 选课名单抽屉 -->
    <el-drawer v-model="studentsVisible" :title="studentsTitle" size="620px">
      <div v-loading="studentsLoading" class="students-panel">
        <div class="students-summary">
          <el-tag type="success" effect="plain">已选 {{ students.selectedCount }} 人</el-tag>
          <el-tag type="info" effect="plain">容量 {{ students.capacity }} 人</el-tag>
          <el-tag type="warning" effect="plain">退选 {{ students.droppedCount }} 人</el-tag>
        </div>
        <el-table :data="students.list" border stripe max-height="calc(100vh - 220px)">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="studentName" label="姓名" width="110" />
          <el-table-column prop="studentNo" label="学号" width="120">
            <template #default="{ row }">{{ row.studentNo || '-' }}</template>
          </el-table-column>
          <el-table-column prop="className" label="班级" min-width="120">
            <template #default="{ row }">{{ row.className || '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'selected' ? 'success' : 'info'" size="small">
                {{ row.status === 'selected' ? '已选' : '已退选' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="选课时间" width="170">
            <template #default="{ row }">{{ formatDateTime(row.selectedAt) }}</template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无选课记录" />
          </template>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Plus, Edit, Delete, Refresh, Search, User,
  Reading, Unlock, Select, UserFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { electiveAPI } from '@/api/electives'
import PageHeader from '@/components/common/PageHeader.vue'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = ref({ page: 1, pageSize: 10, semester: '', status: '', grade: '', keyword: '' })
const options = ref({ semesters: [], subjects: [], teachers: [], grades: [], categories: [] })
const stats = ref({ total: 0, open: 0, draft: 0, closed: 0, totalCapacity: 0, selections: 0 })

const statCards = computed(() => [
  { label: '选修课总数', value: stats.value.total, icon: Reading, bg: 'linear-gradient(135deg,#667eea,#764ba2)' },
  { label: '开放选课中', value: stats.value.open, icon: Unlock, bg: 'linear-gradient(135deg,#11998e,#38ef7d)' },
  { label: '累计选课人次', value: stats.value.selections, icon: Select, bg: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
  { label: '总容量', value: stats.value.totalCapacity, icon: UserFilled, bg: 'linear-gradient(135deg,#f093fb,#f5576c)' }
])

const statusMap = {
  draft: { text: '草稿', type: 'info' },
  open: { text: '开放选课', type: 'success' },
  closed: { text: '已关闭', type: 'warning' }
}
const statusMeta = (status) => statusMap[status] || { text: status || '-', type: 'info' }

const capacityPercent = (row) => {
  if (!row.capacity) return 0
  return Math.min(100, Math.round((row.selectedCount / row.capacity) * 100))
}

function pad(n) {
  return String(n).padStart(2, '0')
}
function formatDateTime(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function formatRange(start, end) {
  if (!start && !end) return '不限'
  return `${start ? formatDateTime(start) : '不限'} ~ ${end ? formatDateTime(end) : '不限'}`
}

async function loadStats() {
  try {
    const res = await electiveAPI.stats()
    stats.value = res.data || stats.value
  } catch (error) {
    /* 拦截器已提示 */
  }
}

async function loadOptions() {
  try {
    const res = await electiveAPI.options()
    options.value = res.data || options.value
  } catch (error) {
    /* 拦截器已提示 */
  }
}

async function loadList() {
  loading.value = true
  try {
    const params = {
      page: query.value.page,
      pageSize: query.value.pageSize,
      semester: query.value.semester || undefined,
      status: query.value.status || undefined,
      grade: query.value.grade || undefined,
      keyword: query.value.keyword || undefined
    }
    const res = await electiveAPI.list(params)
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}

function reload() {
  query.value.page = 1
  loadList()
}

async function refreshAll() {
  await Promise.all([loadOptions(), loadStats(), loadList()])
}

// ---------- 表单 ----------
const dialogVisible = ref(false)
const dialogMode = ref('create')
const submitting = ref(false)
const formRef = ref(null)

const defaultForm = () => ({
  id: null,
  name: '',
  code: '',
  category: '',
  semester: '',
  teacherId: null,
  subjectId: null,
  grade: '',
  capacity: 30,
  credit: 1,
  location: '',
  scheduleText: '',
  selectStart: '',
  selectEnd: '',
  status: 'draft',
  description: ''
})
const form = ref(defaultForm())

const formRules = {
  name: [{ required: true, message: '请填写课程名称', trigger: 'blur' }],
  semester: [{ required: true, message: '请选择学期', trigger: 'change' }],
  capacity: [{ required: true, message: '请填写选课容量', trigger: 'blur' }]
}

function openCreate() {
  dialogMode.value = 'create'
  form.value = defaultForm()
  if (!form.value.semester && options.value.semesters?.length) {
    form.value.semester = options.value.semesters[0]
  }
  dialogVisible.value = true
}

function openEdit(row) {
  dialogMode.value = 'edit'
  form.value = {
    id: row.id,
    name: row.name,
    code: row.code || '',
    category: row.category || '',
    semester: row.semester,
    teacherId: row.teacherId ?? null,
    subjectId: row.subjectId ?? null,
    grade: row.grade || '',
    capacity: row.capacity,
    credit: row.credit ?? 0,
    location: row.location || '',
    scheduleText: row.scheduleText || '',
    selectStart: row.selectStart || '',
    selectEnd: row.selectEnd || '',
    status: row.status,
    description: row.description || ''
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (error) {
    ElMessage.warning('请完善必填信息')
    return
  }
  submitting.value = true
  try {
    const payload = { ...form.value }
    delete payload.id
    if (dialogMode.value === 'create') {
      await electiveAPI.create(payload)
      ElMessage.success('选修课已发布')
    } else {
      await electiveAPI.update(form.value.id, payload)
      ElMessage.success('选修课已更新')
    }
    dialogVisible.value = false
    await refreshAll()
  } catch (error) {
    /* 拦截器已提示 */
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除选修课「${row.name}」吗？相关选课记录将一并删除。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
  } catch (error) {
    return
  }
  try {
    await electiveAPI.remove(row.id)
    ElMessage.success('选修课已删除')
    await refreshAll()
  } catch (error) {
    /* 拦截器已提示 */
  }
}

// ---------- 选课名单 ----------
const studentsVisible = ref(false)
const studentsLoading = ref(false)
const studentsTitle = ref('选课名单')
const students = ref({ list: [], capacity: 0, selectedCount: 0, droppedCount: 0 })

async function openStudents(row) {
  studentsVisible.value = true
  studentsLoading.value = true
  studentsTitle.value = `选课名单 · ${row.name}`
  try {
    const res = await electiveAPI.students(row.id)
    const data = res.data || {}
    const records = data.list || []
    students.value = {
      list: records,
      capacity: data.course?.capacity ?? row.capacity,
      selectedCount: records.filter((r) => r.status === 'selected').length,
      droppedCount: records.filter((r) => r.status === 'dropped').length
    }
  } catch (error) {
    students.value = { list: [], capacity: row.capacity, selectedCount: 0, droppedCount: 0 }
  } finally {
    studentsLoading.value = false
  }
}

onMounted(refreshAll)
</script>

<style scoped lang="scss">
.elective-manage {
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 16px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #eef0f5;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
  }

  .stat-value {
    font-size: 22px;
    font-weight: 700;
    color: #303133;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 13px;
    color: #909399;
    margin-top: 2px;
  }

  .toolbar-card {
    margin-bottom: 16px;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .capacity-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;

    span {
      font-size: 13px;
      color: #606266;

      &.is-full {
        color: #f56c6c;
        font-weight: 600;
      }
    }
  }

  .window-cell {
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
  }

  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .students-panel {
    min-height: 200px;
  }

  .students-summary {
    display: flex;
    gap: 10px;
    margin-bottom: 14px;
  }
}

/* 平板 / 小屏适配 */
@media (max-width: 1200px) {
  .elective-manage .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .elective-manage {
    .stat-grid {
      grid-template-columns: 1fr;
    }

    .toolbar {
      flex-direction: column;
      align-items: stretch;

      .el-select,
      .el-input {
        width: 100% !important;
      }
    }
  }
}
</style>