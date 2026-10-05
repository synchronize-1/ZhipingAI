<template>
  <el-card shadow="never" class="student-info-card">
    <template #header>
      <div class="card-header">
        <span class="card-title">学生基本信息</span>
        <el-button type="success" :icon="MagicStick" size="small" @click="$emit('generate')">AI 生成画像</el-button>
      </div>
    </template>
    <div class="student-info">
      <div class="student-avatar">
        <el-avatar :size="80" :src="studentInfo.avatar">
          {{ studentInfo.studentName?.charAt(0) }}
        </el-avatar>
      </div>
      <div class="student-detail">
        <h3 class="student-name">{{ studentInfo.studentName }}</h3>
        <div class="student-meta">
          <el-tag size="small">{{ studentInfo.className }}</el-tag>
          <span class="meta-item">学号：{{ studentInfo.studentNo }}</span>
          <span class="meta-item">性别：{{ studentInfo.gender === 'male' ? '男' : '女' }}</span>
        </div>
        <div class="student-stats">
          <div class="stat-item">
            <div class="stat-value">{{ studentInfo.totalScore || '--' }}</div>
            <div class="stat-label">最近总分</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ studentInfo.classRank || '--' }}</div>
            <div class="stat-label">班级排名</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ studentInfo.gradeRank || '--' }}</div>
            <div class="stat-label">年级排名</div>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { MagicStick } from '@element-plus/icons-vue'

defineProps({
  studentInfo: { type: Object, default: () => ({}) }
})

defineEmits(['generate'])
</script>

<style scoped lang="scss">
.student-info-card {
  margin-bottom: 16px;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-title {
      font-weight: 600;
      font-size: 15px;
    }
  }

  .student-info {
    display: flex;
    align-items: center;
    gap: 24px;

    &-avatar {
      flex-shrink: 0;
    }

    &-detail {
      flex: 1;

      .student-name {
        margin: 0 0 10px 0;
        font-size: 22px;
        font-weight: 600;
        color: #303133;
      }

      .student-meta {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
        color: #606266;
        font-size: 14px;

        .meta-item {
          color: #909399;
        }
      }

      .student-stats {
        display: flex;
        gap: 40px;

        .stat-item {
          text-align: center;

          .stat-value {
            font-size: 28px;
            font-weight: 600;
            color: #667eea;
            line-height: 1.2;
          }

          .stat-label {
            font-size: 13px;
            color: #909399;
            margin-top: 4px;
          }
        }
      }
    }
  }
}
</style>