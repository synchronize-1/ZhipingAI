<template>
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
</template>

<script setup>
import { getMentalStatusText, getMentalStatusClass } from '../utils/portfolioOverviewCompute'

defineProps({
  studentInfo: { type: Object, default: () => ({}) }
})
</script>

<style scoped lang="scss">
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
</style>