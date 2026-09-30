<template>
  <div class="activity-center">
    <PageHeader
      title="校园活动"
      description="发现校园精彩活动，在线报名参与；管理员与教师可发布活动并管理报名名单"
    >
      <template #extra>
        <el-button v-if="isStaff" type="primary" :icon="Plus" @click="openCreate">发布活动</el-button>
      </template>
    </PageHeader>

    <el-tabs v-model="activeTab" class="activity-tabs">
      <!-- ==================== 活动列表 ==================== -->
      <el-tab-pane label="活动列表" name="list">
        <div class="stat-row">
          <div class="stat-card">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">全部活动</div>
          </div>
          <div class="stat-card stat-card--green">
            <div class="stat-value">{{ stats.upcoming }}</div>
            <div class="stat-label">报名中</div>
          </div>
          <div class="stat-card stat-card--blue">
            <div class="stat-value">{{ stats.ongoing }}</div>
            <div class="stat-label">进行中</div>
          </div>
          <div class="stat-card stat-card--purple">
            <div class="stat-value">{{ stats.registrations }}</div>
            <div class="stat-label">累计报名</div>
          </div>
        </div>

        <el-card class="filter-card" shadow="never">
          <SearchForm
            :model-value="searchParams"
            :fields="searchFields"
            :loading="loading"
            @update:model-value="handleSearchParamsUpdate"
            @search="handleSearch"
            @reset="handleReset"
          />
        </el-card>

        <div v-loading="loading" class="activity-grid">
          <el-card
            v-for="a in activities"
            :key="a.id"
            class="activity-card"
            shadow="hover"
            :body-style="{ padding: '0' }"
          >
            <div class="card-cover" :style="coverStyle(a)" @click="openDetail(a)">
              <img v-if="a.cover" :src="a.cover" class="cover-img" :alt="a.title" />
              <div class="cover-mask"></div>
              <el-tag class="cover-status" :type="statusType(a.status)" effect="dark">
                {{ statusText(a.status) }}
              </el-tag>
              <span class="cover-category">{{ a.category || '其他' }}</span>
            </div>

            <div class="card-body">
              <h3 class="card-title">{{ a.title }}</h3>
              <p class="card-desc">{{ a.description || '暂无活动介绍' }}</p>

              <div class="card-meta">
                <span><el-icon><Clock /></el-icon>{{ formatTime(a.startTime) }}</span>
                <span><el-icon><Location /></el-icon>{{ a.location || '待定' }}</span>
                <span>
                  <el-icon><User /></el-icon>
                  {{ a.registeredCount }}<template v-if="a.maxParticipants">/{{ a.maxParticipants }}</template> 人
                </span>
              </div>

              <div class="card-foot">
                <span class="organizer">主办：{{ a.organizerName || '—' }}</span>
                <div class="card-actions">
                  <template v-if="isStaff">
                    <el-button link type="primary" @click="openRegistrations(a)">报名名单</el-button>
                    <el-button link type="primary" @click="openEdit(a)">编辑</el-button>
                    <el-button link type="danger" @click="handleDelete(a)">删除</el-button>
                  </template>
                  <el-button
                    v-else
                    size="small"
                    :type="a.hasJoined ? 'danger' : 'primary'"
                    :plain="a.hasJoined"
                    :disabled="!a.canRegister && !a.hasJoined"
                    @click="toggleRegister(a)"
                  >
                    {{ registerButtonText(a) }}
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

          <el-empty
            v-if="!loading && activities.length === 0"
            description="暂无活动"
            class="grid-empty"
          />
        </div>

        <div v-if="pagination.total > 0" class="pager">
          <el-pagination
            :current-page="pagination.page"
            :page-size="pagination.pageSize"
            :page-sizes="[9, 18, 36]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next"
            background
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </el-tab-pane>

      <!-- ==================== 报名管理（管理员 / 教师） ==================== -->
      <el-tab-pane v-if="isStaff" label="报名管理" name="manage">
        <el-card shadow="never" class="manage-card">
          <div class="manage-toolbar">
            <el-select
              v-model="manageActivityId"
              placeholder="请选择活动"
              filterable
              class="manage-select"
              @change="loadRegistrations"
            >
              <el-option
                v-for="a in allActivities"
                :key="a.id"
                :label="`${a.title}（${a.registeredCount}人）`"
                :value="a.id"
              />
            </el-select>
            <el-select
              v-model="manageStatus"
              placeholder="报名状态"
              clearable
              class="manage-status"
              @change="loadRegistrations"
            >
              <el-option label="已报名" value="registered" />
              <el-option label="已签到" value="checked_in" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
            <el-button :icon="Refresh" @click="loadRegistrations">刷新</el-button>
          </div>

          <DataTable
            :columns="registrationColumns"
            :data="registrations"
            :loading="regLoading"
            :pagination="{ page: 1, pageSize: 100, total: registrations.length }"
            :show-pagination="false"
            index
            index-label="序号"
            empty-text="请选择活动查看报名名单"
          >
            <template #status="{ row }">
              <el-tag :type="regStatusType(row.status)" size="small">
                {{ regStatusText(row.status) }}
              </el-tag>
            </template>
            <template #action="{ row }">
              <el-button
                type="success"
                link
                :disabled="row.status !== 'registered'"
                @click="handleCheckIn(row)"
              >
                签到
              </el-button>
            </template>
          </DataTable>
        </el-card>
      </el-tab-pane>

      <!-- ==================== 我的报名（学生） ==================== -->
      <el-tab-pane v-if="!isStaff" label="我的报名" name="mine">
        <el-card shadow="never">
          <DataTable
            :columns="myColumns"
            :data="myRegistrations"
            :loading="myLoading"
            :pagination="{ page: 1, pageSize: 100, total: myRegistrations.length }"
            :show-pagination="false"
            index
            index-label="序号"
            empty-text="你还没有报名任何活动"
          >
            <template #activityStatus="{ row }">
              <el-tag :type="statusType(row.activityStatus)" size="small">
                {{ statusText(row.activityStatus) }}
              </el-tag>
            </template>
            <template #regStatus="{ row }">
              <el-tag :type="regStatusType(row.status)" size="small">
                {{ regStatusText(row.status) }}
              </el-tag>
            </template>
            <template #action="{ row }">
              <el-button
                type="danger"
                link
                :disabled="row.status === 'cancelled' || row.activityStatus === 'completed'"
                @click="handleCancel(row)"
              >
                取消报名
              </el-button>
            </template>
          </DataTable>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- ==================== 活动表单弹窗 ==================== -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑活动' : '发布活动'"
      width="640px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="活动名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入活动名称" maxlength="60" show-word-limit />
        </el-form-item>
        <el-form-item label="活动类型" prop="category">
          <el-select v-model="form.category" placeholder="请选择活动类型" style="width: 100%">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动地点" prop="location">
          <el-input v-model="form.location" placeholder="如：大学生活动中心大礼堂" maxlength="100" />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            placeholder="请选择开始时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            placeholder="请选择结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="人数上限" prop="maxParticipants">
          <el-input-number v-model="form.maxParticipants" :min="1" :max="10000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="封面图" prop="cover">
          <el-input v-model="form.cover" placeholder="封面图 URL（可选）" />
        </el-form-item>
        <el-form-item label="活动描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请描述活动内容、参与方式、注意事项等"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 活动详情弹窗 ==================== -->
    <el-dialog v-model="detailVisible" :title="detail?.title" width="600px">
      <div v-if="detail" class="detail-body">
        <div class="detail-cover" :style="coverStyle(detail)">
          <img v-if="detail.cover" :src="detail.cover" class="cover-img" :alt="detail.title" />
        </div>
        <div class="detail-row">
          <span class="detail-label">活动类型</span>
          <el-tag size="small">{{ detail.category || '其他' }}</el-tag>
        </div>
        <div class="detail-row">
          <span class="detail-label">活动状态</span>
          <el-tag size="small" :type="statusType(detail.status)">{{ statusText(detail.status) }}</el-tag>
        </div>
        <div class="detail-row">
          <span class="detail-label">活动时间</span>
          <span>{{ formatTime(detail.startTime) }} ~ {{ formatTime(detail.endTime) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">活动地点</span>
          <span>{{ detail.location || '待定' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">主办方</span>
          <span>{{ detail.organizerName || '—' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">报名情况</span>
          <span>
            {{ detail.registeredCount }}<template v-if="detail.maxParticipants">/{{ detail.maxParticipants }}</template> 人
            <template v-if="detail.maxParticipants">（剩余 {{ detail.remaining }} 个名额）</template>
          </span>
        </div>
        <div class="detail-desc">{{ detail.description || '暂无活动介绍' }}</div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button
          v-if="!isStaff"
          type="primary"
          :disabled="!detail?.canRegister && !detail?.hasJoined"
          @click="toggleRegister(detail)"
        >
          {{ detail ? registerButtonText(detail) : '' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Clock, Location, User, Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchForm from '@/components/common/SearchForm.vue'
import DataTable from '@/components/common/DataTable.vue'
import { useUserStore } from '@/stores/user'
import { activityAPI } from '@/api/activity'

defineOptions({ name: 'ActivityCenter' })

const userStore = useUserStore()
const role = computed(() => userStore.user?.role)
const isStaff = computed(() => role.value === 'admin' || role.value === 'teacher')

// ==================== 状态 ====================
const activeTab = ref('list')
const loading = ref(false)
const activities = ref([])
const pagination = reactive({ page: 1, pageSize: 9, total: 0 })
const searchParams = reactive({ keyword: '', category: '', status: '' })
const stats = reactive({ total: 0, upcoming: 0, ongoing: 0, completed: 0, registrations: 0 })
const categories = ref(['文艺', '学术', '体育', '公益', '社团', '就业', '其他'])

const allActivities = ref([])
const manageActivityId = ref(null)
const manageStatus = ref('')
const registrations = ref([])
const regLoading = ref(false)

const myRegistrations = ref([])
const myLoading = ref(false)

const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  title: '',
  category: '',
  location: '',
  startTime: '',
  endTime: '',
  maxParticipants: 100,
  cover: '',
  description: ''
})

const detailVisible = ref(false)
const detail = ref(null)

// ==================== 筛选配置 ====================
const searchFields = computed(() => [
  { prop: 'keyword', label: '关键词', type: 'input', placeholder: '活动名称 / 地点' },
  {
    prop: 'category',
    label: '活动类型',
    type: 'select',
    placeholder: '全部类型',
    options: categories.value.map((c) => ({ label: c, value: c }))
  },
  {
    prop: 'status',
    label: '活动状态',
    type: 'select',
    placeholder: '全部状态',
    options: [
      { label: '报名中', value: 'upcoming' },
      { label: '进行中', value: 'ongoing' },
      { label: '已结束', value: 'completed' },
      { label: '已取消', value: 'cancelled' }
    ]
  }
])

const registrationColumns = [
  { prop: 'userName', label: '姓名', width: 110 },
  { prop: 'studentId', label: '学号', width: 130 },
  { prop: 'className', label: '班级', width: 130 },
  { prop: 'registeredAt', label: '报名时间', minWidth: 160, formatter: (row) => formatTime(row.registeredAt) },
  { prop: 'checkedInAt', label: '签到时间', minWidth: 160, formatter: (row) => formatTime(row.checkedInAt) },
  { prop: 'status', label: '状态', width: 100, slot: 'status', align: 'center' }
]

const myColumns = [
  { prop: 'title', label: '活动名称', minWidth: 180 },
  { prop: 'category', label: '类型', width: 90, align: 'center' },
  { prop: 'startTime', label: '活动时间', minWidth: 160, formatter: (row) => formatTime(row.startTime) },
  { prop: 'location', label: '地点', minWidth: 140 },
  { prop: 'activityStatus', label: '活动状态', width: 110, slot: 'activityStatus', align: 'center' },
  { prop: 'status', label: '报名状态', width: 110, slot: 'regStatus', align: 'center' }
]

// ==================== 表单校验 ====================
const formRules = {
  title: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择活动类型', trigger: 'change' }],
  location: [{ required: true, message: '请输入活动地点', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }]
}

// ==================== 展示辅助 ====================
const CATEGORY_COLORS = {
  文艺: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  学术: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  体育: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  公益: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  社团: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  就业: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
  其他: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
}

function coverStyle(a) {
  if (!a) return {}
  return a.cover ? {} : { background: CATEGORY_COLORS[a.category] || CATEGORY_COLORS['其他'] }
}

function formatTime(v) {
  if (!v) return '—'
  const d = dayjs(v)
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : String(v)
}

function statusType(s) {
  return { upcoming: 'success', ongoing: 'primary', completed: 'info', cancelled: 'danger' }[s] || 'info'
}

function statusText(s) {
  return { upcoming: '报名中', ongoing: '进行中', completed: '已结束', cancelled: '已取消' }[s] || s || '—'
}

function regStatusType(s) {
  return { registered: 'primary', checked_in: 'success', cancelled: 'info' }[s] || 'info'
}

function regStatusText(s) {
  return { registered: '已报名', checked_in: '已签到', cancelled: '已取消' }[s] || s
}

function registerButtonText(a) {
  if (!a) return ''
  if (a.hasJoined) return '取消报名'
  if (a.status !== 'upcoming') return statusText(a.status)
  if (a.isFull) return '已满员'
  return '立即报名'
}

// ==================== 数据加载 ====================
async function loadStats() {
  try {
    const res = await activityAPI.stats()
    Object.assign(stats, res.data || {})
  } catch (e) {
    /* 统计失败不影响主流程 */
  }
}

async function loadActivities() {
  loading.value = true
  try {
    const res = await activityAPI.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchParams.keyword || undefined,
      category: searchParams.category || undefined,
      status: searchParams.status || undefined
    })
    activities.value = res.data.list
    pagination.total = res.data.total
  } catch (e) {
    activities.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 报名管理下拉用的完整活动列表
async function loadAllActivities() {
  try {
    const res = await activityAPI.list({ page: 1, pageSize: 100 })
    allActivities.value = res.data.list
  } catch (e) {
    allActivities.value = []
  }
}

async function loadCategories() {
  try {
    const res = await activityAPI.categories()
    if (Array.isArray(res.data?.categories) && res.data.categories.length) {
      categories.value = res.data.categories
    }
  } catch (e) {
    /* 使用默认字典 */
  }
}

async function loadRegistrations() {
  if (!manageActivityId.value) {
    registrations.value = []
    return
  }
  regLoading.value = true
  try {
    const res = await activityAPI.registrations(manageActivityId.value, {
      status: manageStatus.value || undefined
    })
    registrations.value = res.data.list
  } catch (e) {
    registrations.value = []
  } finally {
    regLoading.value = false
  }
}

async function loadMyRegistrations() {
  myLoading.value = true
  try {
    const res = await activityAPI.my()
    myRegistrations.value = res.data
  } catch (e) {
    myRegistrations.value = []
  } finally {
    myLoading.value = false
  }
}

// ==================== 交互 ====================
// 保持 searchParams 为响应式对象（SearchForm 重置时会回传新对象）
function handleSearchParamsUpdate(val) {
  Object.assign(searchParams, val)
}

function handleSearch() {
  pagination.page = 1
  loadActivities()
}

function handleReset() {
  searchParams.keyword = ''
  searchParams.category = ''
  searchParams.status = ''
  pagination.page = 1
  loadActivities()
}

function handlePageChange(page) {
  pagination.page = page
  loadActivities()
}

function handleSizeChange(size) {
  pagination.pageSize = size
  pagination.page = 1
  loadActivities()
}

function resetForm() {
  form.id = null
  form.title = ''
  form.category = ''
  form.location = ''
  form.startTime = ''
  form.endTime = ''
  form.maxParticipants = 100
  form.cover = ''
  form.description = ''
  formRef.value?.clearValidate()
}

function openCreate() {
  resetForm()
  dialogVisible.value = true
}

function openEdit(a) {
  resetForm()
  form.id = a.id
  form.title = a.title
  form.category = a.category || ''
  form.location = a.location || ''
  form.startTime = a.startTime ? dayjs(a.startTime).format('YYYY-MM-DD HH:mm:ss') : ''
  form.endTime = a.endTime ? dayjs(a.endTime).format('YYYY-MM-DD HH:mm:ss') : ''
  form.maxParticipants = a.maxParticipants || 100
  form.cover = a.cover || ''
  form.description = a.description || ''
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const payload = {
    title: form.title,
    category: form.category,
    location: form.location,
    startTime: form.startTime,
    endTime: form.endTime || null,
    maxParticipants: form.maxParticipants,
    cover: form.cover || null,
    description: form.description || null
  }

  saving.value = true
  try {
    if (form.id) {
      await activityAPI.update(form.id, payload)
      ElMessage.success('活动已更新')
    } else {
      await activityAPI.create(payload)
      ElMessage.success('活动发布成功')
    }
    dialogVisible.value = false
    await Promise.all([loadActivities(), loadStats(), loadAllActivities()])
    if (manageActivityId.value) loadRegistrations()
  } finally {
    saving.value = false
  }
}

async function handleDelete(a) {
  try {
    await ElMessageBox.confirm(`确定删除活动「${a.title}」吗？相关报名记录将一并删除。`, '删除确认', {
      type: 'warning'
    })
  } catch (e) {
    return
  }
  await activityAPI.remove(a.id)
  ElMessage.success('活动已删除')
  if (manageActivityId.value === a.id) {
    manageActivityId.value = null
    registrations.value = []
  }
  await Promise.all([loadActivities(), loadStats(), loadAllActivities()])
}

async function toggleRegister(a) {
  if (!a) return
  if (a.hasJoined) {
    await activityAPI.cancelRegister(a.id)
    ElMessage.success('已取消报名')
  } else {
    await activityAPI.register(a.id)
    ElMessage.success('报名成功')
  }
  await Promise.all([loadActivities(), loadStats(), loadAllActivities()])
  if (!isStaff.value) loadMyRegistrations()
  if (detail.value && detail.value.id === a.id) {
    const res = await activityAPI.detail(a.id)
    detail.value = res.data
  }
}

async function handleCancel(row) {
  await activityAPI.cancelRegister(row.activityId)
  ElMessage.success('已取消报名')
  loadMyRegistrations()
  loadActivities()
  loadStats()
}

async function handleCheckIn(row) {
  await activityAPI.checkIn(row.id)
  ElMessage.success(`${row.userName} 签到成功`)
  loadRegistrations()
  loadActivities()
  loadStats()
}

async function openRegistrations(a) {
  activeTab.value = 'manage'
  manageActivityId.value = a.id
  manageStatus.value = ''
  await loadRegistrations()
}

async function openDetail(a) {
  const res = await activityAPI.detail(a.id)
  detail.value = res.data
  detailVisible.value = true
}

// ==================== 初始化 ====================
onMounted(async () => {
  await Promise.all([loadCategories(), loadStats(), loadActivities(), loadAllActivities()])
  if (isStaff.value) {
    // 报名管理默认选中第一个活动
    if (allActivities.value.length) {
      manageActivityId.value = allActivities.value[0].id
    }
  } else {
    loadMyRegistrations()
  }
})
</script>

<style scoped>
.activity-center {
  padding-bottom: 24px;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  padding: 18px 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border: 1px solid #e0e7ff;
}

.stat-card--green {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-color: #d1fae5;
}

.stat-card--blue {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #dbeafe;
}

.stat-card--purple {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border-color: #ede9fe;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.stat-label {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}

.filter-card {
  margin-bottom: 16px;
  border-radius: 12px;
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  min-height: 120px;
}

.grid-empty {
  grid-column: 1 / -1;
}

.activity-card {
  border-radius: 16px;
  overflow: hidden;
  transition: transform 0.25s, box-shadow 0.25s;
}

.activity-card:hover {
  transform: translateY(-4px);
}

.card-cover {
  position: relative;
  height: 150px;
  overflow: hidden;
  cursor: pointer;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.45) 0%, transparent 65%);
}

.cover-status {
  position: absolute;
  top: 12px;
  right: 12px;
}

.cover-category {
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  background: rgba(255, 255, 255, 0.92);
}

.card-body {
  padding: 16px;
}

.card-title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-desc {
  margin: 0 0 14px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  height: 42px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.card-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
}

.card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.organizer {
  font-size: 13px;
  color: #475569;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.manage-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.manage-select {
  width: 360px;
}

.manage-status {
  width: 150px;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-cover {
  height: 170px;
  border-radius: 12px;
  overflow: hidden;
  background: #f1f5f9;
}

.detail-row {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #334155;
}

.detail-label {
  min-width: 76px;
  color: #64748b;
}

.detail-desc {
  padding: 12px 14px;
  border-radius: 10px;
  background: #f8fafc;
  font-size: 14px;
  line-height: 1.8;
  color: #475569;
}
</style>