<template>
  <div class="content-card today-classes">
    <div class="card-header">
      <div class="header-left">
        <div class="header-icon">
          <el-icon><Calendar /></el-icon>
        </div>
        <div>
          <h3>今日授课安排</h3>
          <p>共{{ todayClassList.length }}节课 · {{ totalStudentsToday }}名学生</p>
        </div>
      </div>
      <el-button type="primary" text @click="$router.push('/courses')">
        课程管理
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
    </div>
    <div class="classes-list">
      <div 
        v-for="(classItem, index) in todayClassList" 
        :key="classItem.id"
        class="class-card"
        :class="{ 'is-current': classItem.isCurrent, 'is-finished': classItem.isFinished }"
      >
        <div class="class-time-badge" :class="classItem.isCurrent ? 'active' : ''">
          <span class="time">{{ classItem.startTime }}</span>
          <span class="period">第{{ index + 1 }}节</span>
        </div>
        <div class="class-main">
          <div class="class-info">
            <h4>{{ classItem.name }}</h4>
            <div class="class-meta">
              <span><el-icon><Location /></el-icon> {{ classItem.location }}</span>
              <span><el-icon><User /></el-icon> {{ classItem.studentCount }}人</span>
            </div>
          </div>
          <div class="class-attendance">
            <div class="attendance-ring">
              <el-progress 
                type="circle" 
                :percentage="classItem.attendanceRate" 
                :width="56"
                :stroke-width="4"
                :color="getAttendanceColor(classItem.attendanceRate)"
              />
            </div>
            <span class="attendance-label">出勤率</span>
          </div>
        </div>
        <div class="class-actions">
          <el-button size="small" type="primary" plain @click="emit('start-checkin', classItem)">
            <el-icon><Checked /></el-icon>
            发起签到
          </el-button>
          <el-button size="small" @click="emit('view-detail', classItem)">
            <el-icon><View /></el-icon>
            查看详情
          </el-button>
        </div>
      </div>
    </div>
  </div>

  <!-- 签到弹窗 -->
  <el-dialog v-model="showCheckinDialog" title="发起课堂签到" width="500px">
    <div class="checkin-dialog-content">
      <div class="checkin-info">
        <p><strong>课程：</strong>{{ currentCheckinClass?.name }}</p>
        <p><strong>教室：</strong>{{ currentCheckinClass?.location }}</p>
        <p><strong>学生人数：</strong>{{ currentCheckinClass?.studentCount }}人</p>
      </div>
      <el-form label-width="100px" class="mt-4">
        <el-form-item label="签到时长">
          <el-select v-model="checkinDuration" style="width: 100%">
            <el-option label="1分钟" :value="60" />
            <el-option label="2分钟" :value="120" />
            <el-option label="3分钟" :value="180" />
            <el-option label="5分钟" :value="300" />
          </el-select>
        </el-form-item>
        <el-form-item label="签到方式">
          <el-radio-group v-model="checkinMethod">
            <el-radio label="code">签到码</el-radio>
            <el-radio label="location">定位签到</el-radio>
            <el-radio label="qrcode">扫码签到</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div v-if="checkinStarted" class="checkin-status">
        <el-progress :percentage="checkinProgress" :format="() => checkinCountdown + 's'" />
        <p class="text-center mt-2">已签到：{{ checkedInCount }}/{{ currentCheckinClass?.studentCount }}人</p>
      </div>
    </div>
    <template #footer>
      <el-button @click="showCheckinDialog = false">取消</el-button>
      <el-button v-if="!checkinStarted" type="primary" @click="emit('confirm-start-checkin')">开始签到</el-button>
      <el-button v-else type="danger" @click="emit('end-checkin-session')">结束签到</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { Calendar, ArrowRight, Location, User, Checked, View } from '@element-plus/icons-vue'

defineOptions({ name: 'TeacherTodayCourses' })

defineProps({
  todayClassList: { type: Array, default: () => [] },
  totalStudentsToday: { type: Number, default: 0 },
  currentCheckinClass: { type: Object, default: null },
  checkinStarted: { type: Boolean, default: false },
  checkinProgress: { type: Number, default: 100 },
  checkinCountdown: { type: Number, default: 0 },
  checkedInCount: { type: Number, default: 0 }
})

const showCheckinDialog = defineModel('showCheckinDialog', { type: Boolean, default: false })
const checkinDuration = defineModel('checkinDuration', { type: Number, default: 120 })
const checkinMethod = defineModel('checkinMethod', { type: String, default: 'code' })

const emit = defineEmits(['start-checkin', 'view-detail', 'confirm-start-checkin', 'end-checkin-session'])

const getAttendanceColor = (rate) => {
  if (rate >= 90) return '#10b981'
  if (rate >= 80) return '#f59e0b'
  return '#ef4444'
}
</script>

<style scoped>
/* 内容卡片 */
.content-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
  color: white;
  font-size: 20px;
}

.header-left h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.header-left p {
  margin: 2px 0 0 0;
  font-size: 13px;
  color: #6b7280;
}

/* 今日课程卡片 */
.classes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.class-card {
  background: #f9fafb;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.class-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.class-card.is-current {
  background: linear-gradient(135deg, rgba(26, 54, 93, 0.08) 0%, rgba(44, 82, 130, 0.08) 100%);
  border-color: #2c5282;
}

.class-card.is-finished {
  opacity: 0.6;
}

.class-time-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  background: #e5e7eb;
  padding: 8px 16px;
  border-radius: 10px;
  width: fit-content;
}

.class-time-badge.active {
  background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
  color: white;
}

.class-time-badge .time {
  font-size: 16px;
  font-weight: 700;
}

.class-time-badge .period {
  font-size: 11px;
  opacity: 0.8;
}

.class-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.class-info h4 {
  margin: 0 0 8px 0;
  font-size: 17px;
  font-weight: 600;
  color: #1a1a2e;
}

.class-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #6b7280;
}

.class-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.class-attendance {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.attendance-label {
  font-size: 11px;
  color: #6b7280;
}

.class-actions {
  display: flex;
  gap: 8px;
}

/* 修复按钮样式 - 白底蓝字 */
.class-actions .el-button--primary {
  background: #fff !important;
  color: #409eff !important;
  border: 1px solid #409eff !important;
}

.class-actions .el-button--primary:hover {
  background: #ecf5ff !important;
  color: #409eff !important;
}
</style>