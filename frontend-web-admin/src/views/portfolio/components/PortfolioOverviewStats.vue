<template>
  <!-- 数据概览卡片 -->
  <el-row :gutter="16" class="stats-row">
    <el-col :xs="12" :sm="12" :md="6">
      <div class="stat-card stat-card--blue">
        <div class="stat-icon">
          <el-icon :size="28"><Star /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ overviewData.skillCount || 0 }}</div>
          <div class="stat-label">技能数量</div>
        </div>
      </div>
    </el-col>
    <el-col :xs="12" :sm="12" :md="6">
      <div class="stat-card stat-card--orange">
        <div class="stat-icon">
          <el-icon :size="28"><Trophy /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ overviewData.honorCount || 0 }}</div>
          <div class="stat-label">荣誉数量</div>
        </div>
      </div>
    </el-col>
    <el-col :xs="12" :sm="12" :md="6">
      <div class="stat-card stat-card--green">
        <div class="stat-icon">
          <el-icon :size="28"><Avatar /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ getMentalStatusText(overviewData.mentalStatus) }}</div>
          <div class="stat-label">心理状态</div>
        </div>
      </div>
    </el-col>
    <el-col :xs="12" :sm="12" :md="6">
      <div class="stat-card stat-card--purple">
        <div class="stat-icon">
          <el-icon :size="28"><Document /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value comment-preview">{{ commentSummary }}</div>
          <div class="stat-label">最新评语</div>
        </div>
      </div>
    </el-col>
  </el-row>
</template>

<script setup>
import { Star, Trophy, Avatar, Document } from '@element-plus/icons-vue'
import { getMentalStatusText } from '../utils/portfolioOverviewCompute'

defineProps({
  overviewData: { type: Object, default: () => ({}) },
  commentSummary: { type: String, default: '' }
})
</script>

<style scoped lang="scss">
.stats-row {
  margin-bottom: 16px;

  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border-radius: 12px;
    color: #fff;

    &--blue {
      background: linear-gradient(135deg, #3b82f6, #60a5fa);
    }

    &--orange {
      background: linear-gradient(135deg, #f59e0b, #fbbf24);
    }

    &--green {
      background: linear-gradient(135deg, #10b981, #34d399);
    }

    &--purple {
      background: linear-gradient(135deg, #8b5cf6, #a78bfa);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-content {
      flex: 1;
      min-width: 0;

      .stat-value {
        font-size: 26px;
        font-weight: 700;
        line-height: 1.2;

        &.comment-preview {
          font-size: 16px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .stat-label {
        font-size: 13px;
        opacity: 0.9;
        margin-top: 4px;
      }
    }
  }
}
</style>