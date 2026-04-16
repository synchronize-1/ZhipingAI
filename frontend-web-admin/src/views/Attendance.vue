<template>
  <div class="space-y-6">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="stat-card bg-gradient-to-br from-green-500 to-emerald-600">
        <div class="stat-icon-box"><el-icon :size="28"><TrendCharts /></el-icon></div>
        <div class="stat-content">
          <p class="stat-label">本周出勤率</p>
          <p class="stat-value">{{ stats.rate }}%</p>
          <p class="stat-trend up">+2.3% 较上周</p>
        </div>
      </div>
      <div class="stat-card bg-gradient-to-br from-blue-500 to-indigo-600">
        <div class="stat-icon-box"><el-icon :size="28"><CircleCheck /></el-icon></div>
        <div class="stat-content">
          <p class="stat-label">正常出勤</p>
          <p class="stat-value">{{ stats.present }}</p>
          <p class="stat-trend">本周累计</p>
        </div>
      </div>
      <div class="stat-card bg-gradient-to-br from-amber-500 to-orange-600">
        <div class="stat-icon-box"><el-icon :size="28"><Clock /></el-icon></div>
        <div class="stat-content">
          <p class="stat-label">迟到次数</p>
          <p class="stat-value">{{ stats.late }}</p>
          <p class="stat-trend down">-1次 较上周</p>
        </div>
      </div>
      <div class="stat-card bg-gradient-to-br from-red-500 to-rose-600">
        <div class="stat-icon-box"><el-icon :size="28"><CircleClose /></el-icon></div>
        <div class="stat-content">
          <p class="stat-label">缺勤次数</p>
          <p class="stat-value">{{ stats.absent }}</p>
          <p class="stat-trend">需关注</p>
        </div>
      </div>
    </div>

    <!-- 考勤记录表格 -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <span class="w-1 h-5 bg-blue-500 rounded-full"></span>
          出勤记录
        </h3>
        <div class="flex gap-3">
          <el-select v-model="courseFilter" placeholder="选择课程" clearable class="w-40">
            <el-option v-for="c in courses" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-date-picker v-model="dateRange" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button v-if="isAdmin" type="success" @click="exportData">导出报表</el-button>
        </div>
      </div>

      <el-table :data="filteredRecords" stripe class="attendance-table">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="student_name" label="学生姓名" width="120" v-if="isAdmin" />
        <el-table-column prop="student_id" label="学号" width="120" v-if="isAdmin" />
        <el-table-column prop="course_name" label="课程名称" min-width="150" />
        <el-table-column prop="teacher_name" label="授课教师" width="100" />
        <el-table-column prop="check_in_time" label="签到时间" width="170">
          <template #default="{ row }">
            <span class="text-gray-600">{{ formatTime(row.check_in_time) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="签到方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getMethodType(row.method)" effect="light">
              {{ getMethodText(row.method) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusType(row.status)" effect="dark">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" v-if="isAdmin">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="editRecord(row)">修改</el-button>
            <el-button type="warning" text size="small" @click="handleExcuse(row)">补签</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end mt-4">
        <el-pagination 
          v-model:current-page="currentPage" 
          :page-size="10" 
          :total="attendanceRecords.length"
          layout="total, prev, pager, next"
        />
      </div>
    </div>

    <!-- 修改记录对话框 -->
    <el-dialog v-model="showEditDialog" title="修改考勤记录" width="450px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="学生">
          <el-input :value="editForm.student_name" disabled />
        </el-form-item>
        <el-form-item label="课程">
          <el-input :value="editForm.course_name" disabled />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" class="w-full">
            <el-option label="正常" value="present" />
            <el-option label="迟到" value="late" />
            <el-option label="缺勤" value="absent" />
            <el-option label="请假" value="excused" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="2" placeholder="请输入修改原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { TrendCharts, CircleCheck, Clock, CircleClose } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

defineOptions({ name: 'Attendance' })

const userStore = useUserStore()
const isAdmin = computed(() => userStore.user?.role === 'admin' || userStore.user?.role === 'teacher')

const stats = ref({ rate: 95.2, present: 156, late: 8, absent: 3 })
const courses = ref([
  { id: 1, name: '高等数学' },
  { id: 2, name: '大学英语' },
  { id: 3, name: '数据结构' },
  { id: 4, name: '计算机网络' },
  { id: 5, name: '操作系统' }
])

const attendanceRecords = ref([
  { id: 1, student_name: '李明轩', student_id: '2024001001', course_name: '高等数学', teacher_name: '周教授', check_in_time: '2026-01-11 08:02:15', method: 'face', status: 'present' },
  { id: 2, student_name: '张雨晴', student_id: '2024001002', course_name: '高等数学', teacher_name: '周教授', check_in_time: '2026-01-11 08:15:32', method: 'qrcode', status: 'late' },
  { id: 3, student_name: '陈伟杰', student_id: '2024001003', course_name: '数据结构', teacher_name: '陈教授', check_in_time: '2026-01-11 10:01:08', method: 'face', status: 'present' },
  { id: 4, student_name: '林思琪', student_id: '2023002001', course_name: '大学英语', teacher_name: '陈老师', check_in_time: '2026-01-10 14:00:45', method: 'auto', status: 'present' },
  { id: 5, student_name: '黄俊豪', student_id: '2023002002', course_name: '计算机网络', teacher_name: '刘老师', check_in_time: '2026-01-10 16:05:22', method: 'manual', status: 'late' },
  { id: 6, student_name: '吴雪梅', student_id: '2024001004', course_name: '操作系统', teacher_name: '王教授', check_in_time: null, method: null, status: 'absent' },
  { id: 7, student_name: '周子轩', student_id: '2023001001', course_name: '高等数学', teacher_name: '周教授', check_in_time: '2026-01-09 08:00:30', method: 'face', status: 'present' },
  { id: 8, student_name: '赵晓彤', student_id: '2022001001', course_name: '数据结构', teacher_name: '陈教授', check_in_time: '2026-01-09 10:00:15', method: 'qrcode', status: 'present' },
  { id: 9, student_name: '孙浩然', student_id: '2024001005', course_name: '大学英语', teacher_name: '陈老师', check_in_time: null, method: null, status: 'excused' },
  { id: 10, student_name: '郑雅文', student_id: '2023001002', course_name: '计算机网络', teacher_name: '刘老师', check_in_time: '2026-01-08 16:02:10', method: 'face', status: 'present' },
  { id: 11, student_name: '王浩宇', student_id: '2024001006', course_name: '高等数学', teacher_name: '周教授', check_in_time: '2026-01-08 08:01:05', method: 'auto', status: 'present' },
  { id: 12, student_name: '刘诗涵', student_id: '2023001003', course_name: '操作系统', teacher_name: '王教授', check_in_time: '2026-01-07 14:20:00', method: 'manual', status: 'late' }
])

const courseFilter = ref(null)
const dateRange = ref([])
const currentPage = ref(1)
const showEditDialog = ref(false)
const editForm = ref({})

const filteredRecords = computed(() => {
  let result = attendanceRecords.value
  if (courseFilter.value) {
    const course = courses.value.find(c => c.id === courseFilter.value)
    if (course) result = result.filter(r => r.course_name === course.name)
  }
  if (dateRange.value && dateRange.value.length === 2) {
    result = result.filter(r => {
      if (!r.check_in_time) return true
      const date = r.check_in_time.split(' ')[0]
      return date >= dateRange.value[0] && date <= dateRange.value[1]
    })
  }
  const start = (currentPage.value - 1) * 10
  return result.slice(start, start + 10)
})

const formatTime = (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
const getMethodType = (method) => ({ manual: 'primary', auto: 'success', qrcode: 'warning', face: 'info' }[method] || 'info')
const getMethodText = (method) => ({ manual: '手动', auto: '自动', qrcode: '扫码', face: '人脸' }[method] || '-')
const getStatusType = (status) => ({ present: 'success', late: 'warning', absent: 'danger', excused: 'info' }[status] || 'info')
const getStatusText = (status) => ({ present: '正常', late: '迟到', absent: '缺勤', excused: '请假' }[status] || status)

const fetchData = () => ElMessage.success('数据已刷新')
const exportData = () => ElMessage.success('报表导出成功')
const editRecord = (row) => { editForm.value = { ...row }; showEditDialog.value = true }
const handleExcuse = (row) => { 
  row.status = 'excused'
  ElMessage.success(`已为 ${row.student_name} 补签成功`) 
}
const saveEdit = () => {
  const idx = attendanceRecords.value.findIndex(r => r.id === editForm.value.id)
  if (idx !== -1) attendanceRecords.value[idx] = { ...editForm.value }
  showEditDialog.value = false
  ElMessage.success('修改成功')
}

onMounted(() => {})
</script>

<style scoped>
.stat-card {
  padding: 20px;
  border-radius: 16px;
  color: white;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}
.stat-icon-box { width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.stat-content { flex: 1; }
.stat-label { font-size: 14px; opacity: 0.9; }
.stat-value { font-size: 28px; font-weight: 700; margin: 4px 0; }
.stat-trend { font-size: 12px; opacity: 0.8; }
.stat-trend.up { color: #a7f3d0; }
.stat-trend.down { color: #fcd34d; }
.attendance-table :deep(.el-table__row) { height: 56px; }

/* 修复操作按钮文字不清晰问题 */
.attendance-table :deep(.el-button--primary.is-text) {
  color: #409eff !important;
  font-weight: 600;
}
.attendance-table :deep(.el-button--warning.is-text) {
  color: #e6a23c !important;
  font-weight: 600;
}
.attendance-table :deep(.el-button.is-text:hover) {
  background-color: rgba(64, 158, 255, 0.1);
}
</style>
