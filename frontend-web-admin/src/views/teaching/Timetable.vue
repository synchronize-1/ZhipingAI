<template>
  <div class="timetable-page">
    <PageHeader :title="pageTitle" :description="pageDescription" :breadcrumbs="breadcrumbs">
      <template #extra>
        <template v-if="isAdmin">
          <el-button :icon="Refresh" @click="refresh">刷新</el-button>
          <el-button type="danger" plain :icon="Delete" :disabled="!classId" @click="handleClearClass">清空本班课表</el-button>
          <el-button type="primary" :icon="Plus" :disabled="!classId" @click="openAdd()">新增排课</el-button>
        </template>
        <el-button v-else :icon="Refresh" @click="refresh">刷新</el-button>
      </template>
    </PageHeader>

    <!-- 筛选 / 统计 -->
    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select
            v-model="semester"
            placeholder="学期"
            style="width: 170px"
            :disabled="!isAdmin"
            @change="refresh"
          >
            <el-option v-for="s in options.semesters" :key="s" :label="s" :value="s" />
          </el-select>

          <el-select
            v-if="isAdmin"
            v-model="classId"
            placeholder="选择班级"
            style="width: 200px"
            @change="refresh"
          >
            <el-option v-for="c in options.classes" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-tag v-else type="info" size="large">{{ viewLabel }}</el-tag>
        </div>

        <div class="toolbar-right">
          <span class="stat-total">本周共 <b>{{ stats.total }}</b> 节</span>
          <el-tag
            v-for="item in stats.bySubject"
            :key="item.subjectName"
            class="stat-tag"
            effect="plain"
          >
            {{ item.subjectName }} {{ item.count }}
          </el-tag>
        </div>
      </div>

      <el-alert
        v-if="isAdmin"
        class="hint"
        type="info"
        :closable="false"
        show-icon
        title="点击空格子即可排课，点击已有课程可编辑或删除；提交前会自动检测班级 / 教师 / 教室冲突。"
      />
    </el-card>

    <!-- 周课表 -->
    <el-card class="grid-card" shadow="never" v-loading="loading">
      <div v-if="periods.length && visibleDays.length" class="tt-grid" :style="gridStyle">
        <!-- 表头 -->
        <div class="tt-cell tt-head tt-corner">节次</div>
        <div v-for="d in visibleDays" :key="d.value" class="tt-cell tt-head">{{ d.label }}</div>

        <!-- 行 -->
        <template v-for="p in periods" :key="p.period">
          <div class="tt-cell tt-period">
            <div class="tt-period-name">{{ p.label }}</div>
            <div class="tt-period-time">{{ p.startTime }}-{{ p.endTime }}</div>
          </div>
          <div
            v-for="d in visibleDays"
            :key="`${d.value}-${p.period}`"
            class="tt-cell tt-slot"
            :class="{
              'is-filled': !!getEntry(d.value, p.period),
              'is-clickable': isAdmin
            }"
            @click="handleCellClick(d.value, p.period)"
          >
            <template v-if="getEntry(d.value, p.period)">
              <div class="tt-subject">{{ getEntry(d.value, p.period).subjectName }}</div>
              <div class="tt-meta">{{ getEntry(d.value, p.period).teacherName }}</div>
              <div v-if="getEntry(d.value, p.period).roomName" class="tt-meta tt-room">
                {{ getEntry(d.value, p.period).roomName }}
              </div>
            </template>
            <span v-else-if="isAdmin" class="tt-empty">+</span>
          </div>
        </template>
      </div>
      <el-empty v-else description="暂无课表数据" />
    </el-card>

    <!-- 排课 / 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="620px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="学期" prop="semester">
              <el-select v-model="form.semester" placeholder="选择学期" style="width: 100%">
                <el-option v-for="s in options.semesters" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="班级" prop="classId">
              <el-select v-model="form.classId" placeholder="选择班级" style="width: 100%">
                <el-option v-for="c in options.classes" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学科" prop="subjectId">
              <el-select v-model="form.subjectId" placeholder="选择学科" style="width: 100%">
                <el-option v-for="s in options.subjects" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="授课教师" prop="teacherId">
              <el-select v-model="form.teacherId" placeholder="选择教师" filterable style="width: 100%">
                <el-option
                  v-for="t in options.teachers"
                  :key="t.id"
                  :label="t.department ? `${t.name}（${t.department}）` : t.name"
                  :value="t.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="星期" prop="dayOfWeek">
              <el-select v-model="form.dayOfWeek" placeholder="选择星期" style="width: 100%">
                <el-option v-for="d in days" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="节次" prop="period">
              <el-select v-model="form.period" placeholder="选择节次" style="width: 100%">
                <el-option
                  v-for="p in periods"
                  :key="p.period"
                  :label="`${p.label}（${p.startTime}-${p.endTime}）`"
                  :value="p.period"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="教室" prop="roomId">
              <el-select v-model="form.roomId" placeholder="可选" clearable style="width: 100%">
                <el-option
                  v-for="r in options.rooms"
                  :key="r.id"
                  :label="`${r.building} ${r.name}`"
                  :value="r.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="周次范围" prop="weekStart">
              <div class="week-range">
                <el-input-number v-model="form.weekStart" :min="1" :max="30" controls-position="right" />
                <span class="week-sep">~</span>
                <el-input-number v-model="form.weekEnd" :min="1" :max="30" controls-position="right" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="note">
              <el-input v-model="form.note" placeholder="可选，如连堂、实验课等" maxlength="100" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button
            v-if="dialogMode === 'edit'"
            type="danger"
            plain
            :icon="Delete"
            @click="handleDeleteFromDialog"
          >
            删除
          </el-button>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Delete, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { timetableAPI } from '@/api/timetable'
import { useUserStore } from '@/stores/user'
import { useDialog } from '@/composables/useDialog'
import PageHeader from '@/components/common/PageHeader.vue'

const userStore = useUserStore()
const role = computed(() => userStore.user?.role || 'student')
const isAdmin = computed(() => role.value === 'admin')

const pageTitle = computed(() => (isAdmin.value ? '课表管理' : '我的课表'))
const pageDescription = computed(() =>
  isAdmin.value ? '编排各班级周课表，自动检测班级 / 教师 / 教室冲突' : '查看本人（本班）一周课程安排'
)
const breadcrumbs = computed(() =>
  isAdmin.value
    ? [{ label: '教学管理' }, { label: '课表管理' }]
    : [{ label: '我的' }, { label: '我的课表' }]
)

const loading = ref(false)
const options = ref({ classes: [], subjects: [], teachers: [], rooms: [], semesters: [] })
const days = ref([])
const periods = ref([])
const entries = ref([])
const stats = ref({ total: 0, bySubject: [] })
const semester = ref('')
const classId = ref(null)
const viewLabel = ref('')

const entryMap = computed(() => {
  const map = {}
  entries.value.forEach((e) => {
    map[`${e.dayOfWeek}-${e.period}`] = e
  })
  return map
})
const getEntry = (day, period) => entryMap.value[`${day}-${period}`]

const visibleDays = computed(() =>
  days.value.filter(
    (d) => Number(d.value) <= 5 || entries.value.some((e) => Number(e.dayOfWeek) === Number(d.value))
  )
)

const gridStyle = computed(() => ({
  gridTemplateColumns: `92px repeat(${visibleDays.value.length}, minmax(0, 1fr))`
}))

function applyView(data) {
  if (!data) return
  days.value = data.days || days.value
  periods.value = data.periods || periods.value
  entries.value = data.entries || []
  stats.value = data.stats || { total: 0, bySubject: [] }
  semester.value = data.semester || semester.value

  if (isAdmin.value) {
    const cls = options.value.classes.find((c) => c.id === Number(data.classId))
    viewLabel.value = cls?.name || ''
  } else if (role.value === 'teacher') {
    viewLabel.value = `${userStore.user?.name || ''} 老师`
  } else {
    viewLabel.value = `${userStore.user?.name || ''} 同学`
  }
}

async function loadWeek() {
  if (!classId.value) {
    entries.value = []
    stats.value = { total: 0, bySubject: [] }
    return
  }
  const res = await timetableAPI.week({ semester: semester.value, classId: classId.value })
  applyView(res.data)
}

async function loadMy() {
  const res = await timetableAPI.my(semester.value ? { semester: semester.value } : {})
  applyView(res.data)
}

async function refresh() {
  loading.value = true
  try {
    if (isAdmin.value) {
      await loadWeek()
    } else {
      await loadMy()
    }
  } catch (error) {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}

async function init() {
  loading.value = true
  try {
    if (isAdmin.value) {
      const res = await timetableAPI.options()
      options.value = res.data
      days.value = res.data.days || []
      periods.value = res.data.periods || []
      semester.value = res.data.defaultSemester
      classId.value = res.data.classes?.[0]?.id ?? null
      await loadWeek()
    } else {
      const res = await timetableAPI.periods()
      days.value = res.data?.days || []
      periods.value = res.data?.periods || []
      await loadMy()
    }
  } catch (error) {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}

// ---------- 弹窗 ----------
const entryDialog = useDialog({
  id: null,
  semester: '',
  classId: null,
  subjectId: null,
  teacherId: null,
  roomId: null,
  dayOfWeek: 1,
  period: 1,
  weekStart: 1,
  weekEnd: 20,
  note: ''
})
const dialogVisible = entryDialog.visible
const dialogMode = entryDialog.mode
const submitting = entryDialog.loading
const formRef = entryDialog.formRef
const form = entryDialog.formData
const dialogTitle = computed(() => (dialogMode.value === 'add' ? '新增排课' : '编辑排课'))

const formRules = {
  semester: [{ required: true, message: '请选择学期', trigger: 'change' }],
  classId: [{ required: true, message: '请选择班级', trigger: 'change' }],
  subjectId: [{ required: true, message: '请选择学科', trigger: 'change' }],
  teacherId: [{ required: true, message: '请选择授课教师', trigger: 'change' }],
  dayOfWeek: [{ required: true, message: '请选择星期', trigger: 'change' }],
  period: [{ required: true, message: '请选择节次', trigger: 'change' }]
}

function openAdd(day, period) {
  entryDialog.openAdd({
    semester: semester.value,
    classId: classId.value,
    dayOfWeek: day || 1,
    period: period || 1
  })
}

function openEdit(entry) {
  entryDialog.openEdit({
    id: entry.id,
    semester: entry.semester,
    classId: entry.classId,
    subjectId: entry.subjectId,
    teacherId: entry.teacherId,
    roomId: entry.roomId,
    dayOfWeek: Number(entry.dayOfWeek),
    period: Number(entry.period),
    weekStart: entry.weekStart ?? 1,
    weekEnd: entry.weekEnd ?? 20,
    note: entry.note || ''
  })
}

function handleCellClick(day, period) {
  if (!isAdmin.value) return
  const entry = getEntry(day, period)
  if (entry) openEdit(entry)
  else openAdd(day, period)
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (error) {
    ElMessage.warning('请完善排课信息')
    return
  }

  if (Number(form.weekStart) > Number(form.weekEnd)) {
    ElMessage.warning('起始周不能大于结束周')
    return
  }

  submitting.value = true
  try {
    // 提交前冲突预检，给出更友好的提示
    const payload = { ...form }
    const checkRes = await timetableAPI.checkConflict(
      dialogMode.value === 'edit' ? { ...payload, excludeId: form.id } : payload
    )
    if (checkRes.data?.hasConflict) {
      const list = checkRes.data.conflicts.map((c) => `· ${c.message}`).join('\n')
      await ElMessageBox.alert(`检测到排课冲突：\n${list}`, '排课冲突', {
        type: 'warning',
        confirmButtonText: '我知道了'
      })
      return
    }

    if (dialogMode.value === 'add') {
      await timetableAPI.create(payload)
      ElMessage.success('排课成功')
    } else {
      await timetableAPI.update(form.id, payload)
      ElMessage.success('排课已更新')
    }
    entryDialog.close()
    await refresh()
  } catch (error) {
    /* 拦截器已提示 */
  } finally {
    submitting.value = false
  }
}

async function removeEntry(entry) {
  await timetableAPI.remove(entry.id)
  ElMessage.success('排课已删除')
  await refresh()
}

async function handleDeleteFromDialog() {
  const entry = { id: form.id, subjectName: '', dayOfWeek: form.dayOfWeek, period: form.period }
  try {
    await ElMessageBox.confirm('确定删除该排课吗？', '删除确认', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
  } catch (error) {
    return
  }
  entryDialog.close()
  try {
    await removeEntry(entry)
  } catch (error) {
    /* 拦截器已提示 */
  }
}

async function handleClearClass() {
  const cls = options.value.classes.find((c) => c.id === classId.value)
  try {
    await ElMessageBox.confirm(
      `确定清空「${cls?.name || '本班'}」在 ${semester.value} 的全部排课吗？`,
      '清空确认',
      { type: 'warning', confirmButtonText: '确定清空', cancelButtonText: '取消' }
    )
  } catch (error) {
    return
  }
  try {
    await timetableAPI.clearClass(classId.value, { semester: semester.value })
    ElMessage.success('已清空本班课表')
    await refresh()
  } catch (error) {
    /* 拦截器已提示 */
  }
}

onMounted(init)
</script>

<style scoped lang="scss">
.timetable-page {
  padding: 20px;

  .toolbar-card {
    margin-bottom: 16px;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .stat-total {
    font-size: 14px;
    color: #606266;

    b {
      color: #409eff;
      font-size: 16px;
    }
  }

  .stat-tag {
    margin: 0;
  }

  .hint {
    margin-top: 12px;
  }

  .grid-card {
    margin-bottom: 16px;
  }

  .tt-grid {
    display: grid;
    gap: 1px;
    background: #ebeef5;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    overflow: hidden;
  }

  .tt-cell {
    background: #fff;
    min-height: 74px;
    padding: 8px;
    box-sizing: border-box;
  }

  .tt-head {
    min-height: auto;
    padding: 10px 8px;
    text-align: center;
    font-weight: 600;
    background: #f5f7fa;
    color: #303133;
  }

  .tt-corner {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tt-period {
    background: #f5f7fa;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .tt-period-name {
    font-weight: 600;
    color: #303133;
  }

  .tt-period-time {
    font-size: 11px;
    color: #909399;
    margin-top: 2px;
  }

  .tt-slot {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    transition: background 0.15s;
  }

  .tt-slot.is-clickable {
    cursor: pointer;

    &:hover {
      background: #ecf5ff;
    }
  }

  .tt-slot.is-filled {
    background: #f0f9eb;

    &.is-clickable:hover {
      background: #e1f3d8;
    }
  }

  .tt-subject {
    font-weight: 600;
    color: #303133;
    font-size: 14px;
  }

  .tt-meta {
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
  }

  .tt-room {
    color: #b1b3b8;
  }

  .tt-empty {
    color: #c0c4cc;
    font-size: 20px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .week-range {
    display: flex;
    align-items: center;
    gap: 8px;

    .week-sep {
      color: #909399;
    }
  }
}
</style>