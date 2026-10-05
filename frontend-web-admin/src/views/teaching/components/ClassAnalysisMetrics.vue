<template>
  <!-- 核心指标卡片 -->
  <el-row :gutter="16" class="stat-cards">
    <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4">
      <el-card shadow="hover" class="stat-card stat-card--primary">
        <div class="stat-card__icon">
          <el-icon :size="32"><TrendCharts /></el-icon>
        </div>
        <div class="stat-card__info">
          <div class="stat-card__value">{{ overallMetrics.averageScore?.toFixed(1) || '--' }}</div>
          <div class="stat-card__label">班级平均分</div>
        </div>
      </el-card>
    </el-col>
    <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4">
      <el-card shadow="hover" class="stat-card stat-card--success">
        <div class="stat-card__icon">
          <el-icon :size="32"><CaretTop /></el-icon>
        </div>
        <div class="stat-card__info">
          <div class="stat-card__value">{{ overallMetrics.highestScore ?? '--' }}</div>
          <div class="stat-card__label">最高分</div>
        </div>
      </el-card>
    </el-col>
    <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4">
      <el-card shadow="hover" class="stat-card stat-card--warning">
        <div class="stat-card__icon">
          <el-icon :size="32"><CaretBottom /></el-icon>
        </div>
        <div class="stat-card__info">
          <div class="stat-card__value">{{ overallMetrics.lowestScore ?? '--' }}</div>
          <div class="stat-card__label">最低分</div>
        </div>
      </el-card>
    </el-col>
    <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4">
      <el-card shadow="hover" class="stat-card stat-card--info">
        <div class="stat-card__icon">
          <el-icon :size="32"><CircleCheck /></el-icon>
        </div>
        <div class="stat-card__info">
          <div class="stat-card__value">{{ overallMetrics.passRate !== null ? overallMetrics.passRate.toFixed(1) + '%' : '--' }}</div>
          <div class="stat-card__label">及格率</div>
        </div>
      </el-card>
    </el-col>
    <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4">
      <el-card shadow="hover" class="stat-card stat-card--purple">
        <div class="stat-card__icon">
          <el-icon :size="32"><Medal /></el-icon>
        </div>
        <div class="stat-card__info">
          <div class="stat-card__value">{{ overallMetrics.excellentRate !== null ? overallMetrics.excellentRate.toFixed(1) + '%' : '--' }}</div>
          <div class="stat-card__label">优秀率</div>
        </div>
      </el-card>
    </el-col>
    <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4">
      <el-card shadow="hover" class="stat-card stat-card--pink">
        <div class="stat-card__icon">
          <el-icon :size="32"><User /></el-icon>
        </div>
        <div class="stat-card__info">
          <div class="stat-card__value">{{ overallMetrics.studentCount || '--' }}</div>
          <div class="stat-card__label">参考人数</div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
import { TrendCharts, CaretTop, CaretBottom, CircleCheck, Medal, User } from '@element-plus/icons-vue'

defineProps({
  overallMetrics: { type: Object, default: () => ({}) }
})
</script>

<style scoped lang="scss">
.stat-cards {
  margin-bottom: 16px;

  .stat-card {
    display: flex;
    align-items: center;
    padding: 8px;
    border: none;
    border-radius: 8px;
    margin-bottom: 16px;

    &__icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      color: #fff;
    }

    &__info {
      flex: 1;
    }

    &__value {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      line-height: 1.2;
      margin-bottom: 4px;
    }

    &__label {
      font-size: 13px;
      color: #909399;
    }

    &--primary &__icon { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    &--success &__icon { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    &--warning &__icon { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    &--info &__icon { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
    &--purple &__icon { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
    &--pink &__icon { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); }
  }
}
</style>