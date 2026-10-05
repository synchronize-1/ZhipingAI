<template>
  <!-- 课堂签到区域 -->
  <div class="interaction-section checkin-section">
    <div class="section-header">
      <div class="header-left">
        <div class="icon-wrapper checkin-icon">
          <el-icon :size="20"><Clock /></el-icon>
        </div>
        <div>
          <h3>课堂签到</h3>
          <p>请在上课时间内完成签到</p>
        </div>
      </div>
      <el-tag :type="checkinStatus.type" size="large">{{ checkinStatus.text }}</el-tag>
    </div>

    <div class="checkin-content">
      <div class="checkin-info">
        <div class="info-item">
          <span class="info-label">上课时间</span>
          <span class="info-value">08:00 - 09:40</span>
        </div>
        <div class="info-item">
          <span class="info-label">上课地点</span>
          <span class="info-value">教学楼A-301</span>
        </div>
        <div class="info-item">
          <span class="info-label">签到方式</span>
          <span class="info-value">{{ checkinMethod }}</span>
        </div>
      </div>

      <div class="checkin-action">
        <div v-if="!hasCheckedIn" class="checkin-methods">
          <el-button type="primary" size="large" class="checkin-btn" @click="$emit('checkin', 'location')">
            <el-icon><Location /></el-icon>
            位置签到
          </el-button>
          <el-button type="success" size="large" class="checkin-btn" @click="qrDialogVisible = true">
            <el-icon><Camera /></el-icon>
            扫码签到
          </el-button>
          <el-button type="warning" size="large" class="checkin-btn" @click="codeDialogVisible = true">
            <el-icon><Key /></el-icon>
            签到码
          </el-button>
        </div>
        <div v-else class="checkin-success">
          <el-icon :size="48" class="success-icon"><CircleCheck /></el-icon>
          <p class="success-text">签到成功</p>
          <p class="checkin-time">签到时间：{{ checkinTime }}</p>
        </div>
      </div>

      <div class="checkin-stats">
        <div class="stat-item">
          <span class="stat-value">{{ checkinStats.total }}</span>
          <span class="stat-label">应到人数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value text-green-500">{{ checkinStats.checked }}</span>
          <span class="stat-label">已签到</span>
        </div>
        <div class="stat-item">
          <span class="stat-value text-orange-500">{{ checkinStats.late }}</span>
          <span class="stat-label">迟到</span>
        </div>
        <div class="stat-item">
          <span class="stat-value text-red-500">{{ checkinStats.absent }}</span>
          <span class="stat-label">缺勤</span>
        </div>
      </div>
    </div>

    <!-- 签到码对话框 -->
    <el-dialog
      v-model="codeDialogVisible"
      title="输入签到码"
      width="400px"
      class="interaction-dialog"
    >
      <div class="code-input-container">
        <p class="code-hint">请输入老师发布的4位签到码</p>
        <el-input
          v-model="checkinCode"
          size="large"
          maxlength="4"
          placeholder="请输入签到码"
          class="code-input"
        />
      </div>
      <template #footer>
        <el-button @click="codeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="$emit('checkin', 'code')">确认签到</el-button>
      </template>
    </el-dialog>

    <!-- 扫码签到对话框 -->
    <el-dialog
      v-model="qrDialogVisible"
      title="扫码签到"
      width="400px"
      class="interaction-dialog"
    >
      <div class="qr-container">
        <div class="qr-placeholder">
          <el-icon :size="64" class="qr-icon"><Camera /></el-icon>
          <p>请使用手机扫描教室内的二维码</p>
        </div>
        <el-button type="primary" size="large" class="simulate-btn" @click="$emit('checkin', 'qr')">
          模拟扫码成功
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { Clock, Location, Camera, Key, CircleCheck } from '@element-plus/icons-vue'

defineProps({
  checkinStatus: { type: Object, default: () => ({}) },
  checkinMethod: { type: String, default: '' },
  hasCheckedIn: { type: Boolean, default: false },
  checkinTime: { type: String, default: '' },
  checkinStats: { type: Object, default: () => ({}) }
})

const codeDialogVisible = defineModel('codeDialogVisible', { type: Boolean, default: false })
const qrDialogVisible = defineModel('qrDialogVisible', { type: Boolean, default: false })
const checkinCode = defineModel('checkinCode', { type: String, default: '' })

defineEmits(['checkin'])
</script>

<style scoped>
.interaction-section {
  background: linear-gradient(135deg, #faf8f5 0%, #f5f0e8 100%);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.section-header {
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

.icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkin-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

/* 签到区域样式 */
.checkin-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.checkin-info {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #6b7280;
}

.info-value {
  font-size: 14px;
  color: #1a1a2e;
  font-weight: 500;
}

.checkin-action {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.checkin-methods {
  display: flex;
  gap: 16px;
}

.checkin-btn {
  min-width: 120px;
  height: 48px;
  border-radius: 12px;
}

.checkin-success {
  text-align: center;
  padding: 20px;
}

.success-icon {
  color: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.success-text {
  font-size: 20px;
  font-weight: 600;
  color: #10b981;
  margin: 12px 0 4px;
}

.checkin-time {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.checkin-stats {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

/* 签到码输入 */
.code-input-container {
  text-align: center;
  padding: 20px;
}

.code-hint {
  color: #4b5563;
  margin-bottom: 20px;
}

.code-input :deep(.el-input__inner) {
  text-align: center;
  font-size: 24px;
  letter-spacing: 8px;
  background: #fff;
  border-color: #d1d5db;
  color: #1f2937;
}

/* 扫码签到 */
.qr-container {
  text-align: center;
  padding: 20px;
}

.qr-placeholder {
  padding: 40px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 16px;
  border: 2px dashed #d1d5db;
  margin-bottom: 20px;
}

.qr-icon {
  color: #9ca3af;
  margin-bottom: 12px;
}

.qr-placeholder p {
  color: #6b7280;
  margin: 0;
}

.simulate-btn {
  width: 100%;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.section-header p {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #6b7280;
}

/* 对话框样式 */
.interaction-dialog :deep(.el-dialog) {
  background: linear-gradient(135deg, #1e1e2f 0%, #2d2d44 100%);
  border-radius: 20px;
}

.interaction-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.interaction-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
}

.interaction-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.interaction-dialog :deep(.el-form-item__label) {
  color: rgba(255, 255, 255, 0.8);
}

.interaction-dialog :deep(.el-textarea__inner) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: white;
}
</style>