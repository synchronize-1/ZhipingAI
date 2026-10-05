<template>
  <!-- 核心数据指标 -->
  <div class="metrics-section">
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-header">
          <div class="metric-icon blue">
            <el-icon><User /></el-icon>
          </div>
          <el-tag :type="userGrowth >= 0 ? 'success' : 'danger'" size="small">
            {{ userGrowth >= 0 ? '+' : '' }}{{ userGrowth }}%
          </el-tag>
        </div>
        <div class="metric-value">{{ totalUsers.toLocaleString() }}</div>
        <div class="metric-label">注册用户</div>
        <div class="metric-detail">
          <span>学生 {{ studentCount.toLocaleString() }}</span>
          <span>教师 {{ teacherCount.toLocaleString() }}</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <div class="metric-icon green">
            <el-icon><School /></el-icon>
          </div>
          <el-tag type="success" size="small">正常</el-tag>
        </div>
        <div class="metric-value">{{ classCount }}</div>
        <div class="metric-label">班级总数</div>
        <div class="metric-detail">
          <span>共 {{ classCount }} 个班级</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <div class="metric-icon orange">
            <el-icon><Trophy /></el-icon>
          </div>
          <el-tag type="warning" size="small">{{ recentExams.length }} 场近期</el-tag>
        </div>
        <div class="metric-value">{{ examCount }}</div>
        <div class="metric-label">考试总数</div>
        <div class="metric-detail">
          <span>累计 {{ examCount }} 场考试</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <div class="metric-icon purple">
            <el-icon><Reading /></el-icon>
          </div>
          <el-tag type="info" size="small">{{ subjectCount }} 门</el-tag>
        </div>
        <div class="metric-value">{{ subjectCount }}</div>
        <div class="metric-label">学科总数</div>
        <div class="metric-detail">
          <span>覆盖全部学科</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <div class="metric-icon blue">
            <el-icon><Monitor /></el-icon>
          </div>
          <el-tag type="warning" size="small">{{ onlineUsers }} 在线</el-tag>
        </div>
        <div class="metric-value">{{ systemLoad }}%</div>
        <div class="metric-label">系统负载</div>
        <div class="metric-progress">
          <el-progress :percentage="systemLoad" :stroke-width="6" :show-text="false" :color="getLoadColor(systemLoad)" />
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <div class="metric-icon red">
            <el-icon><WarningFilled /></el-icon>
          </div>
          <el-tag :type="warningsCount > 0 ? 'danger' : 'success'" size="small">
            {{ warningsCount > 0 ? `${warningsCount} 条预警` : '无预警' }}
          </el-tag>
        </div>
        <div class="metric-value">{{ warningsCount }}</div>
        <div class="metric-label">AI健康预警</div>
        <div class="metric-detail">
          <span>重度 {{ warningsCountHeavy }}</span>
          <span>中度 {{ warningsCountMedium }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { User, School, Trophy, Reading, Monitor, WarningFilled } from '@element-plus/icons-vue'

defineProps({
  totalUsers: { type: Number, default: 0 },
  studentCount: { type: Number, default: 0 },
  teacherCount: { type: Number, default: 0 },
  userGrowth: { type: Number, default: 0 },
  classCount: { type: Number, default: 0 },
  examCount: { type: Number, default: 0 },
  subjectCount: { type: Number, default: 0 },
  recentExams: { type: Array, default: () => [] },
  systemLoad: { type: Number, default: 0 },
  onlineUsers: { type: Number, default: 0 },
  warningsCount: { type: Number, default: 0 },
  warningsCountHeavy: { type: Number, default: 0 },
  warningsCountMedium: { type: Number, default: 0 },
  getLoadColor: { type: Function, required: true }
})
</script>

<style scoped>
/* 核心指标 */
.metrics-section {
  margin-bottom: 16px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  border: 1px rgba(64, 158, 255, 0.15);
  padding: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  color: #1f2937;
  overflow: hidden;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.metric-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.metric-icon.blue { background: linear-gradient(135deg, #409eff, #66b1ff); }
.metric-icon.green { background: linear-gradient(135deg, #67c23a, #85ce61); }
.metric-icon.orange { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.metric-icon.purple { background: linear-gradient(135deg, #909399, #b0b3b8); }

.metric-value {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 2px;
}

.metric-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.metric-detail {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #9ca3af;
}

.metric-progress {
  margin-top: 8px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>