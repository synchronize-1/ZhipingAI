<template>
  <!-- 最近一次心理健康记录摘要 -->
  <el-card shadow="never" class="mental-card">
    <template #header>
      <div class="card-header">
        <el-icon color="#67c23a" :size="18"><CircleCheck /></el-icon>
        <span class="card-title">心理健康摘要</span>
        <el-button type="primary" text size="small" @click="$emit('view-detail')">查看详情</el-button>
      </div>
    </template>
    <el-empty v-if="!mentalHealth.id" description="暂无心理健康记录" :image-size="60" />
    <div v-else class="mental-summary">
      <div class="mental-header">
        <div class="mental-date">{{ mentalHealth.assessmentDate }}</div>
        <el-tag :type="getStressTagType(mentalHealth.stressLevel)" size="small">
          {{ getStressLevelText(mentalHealth.stressLevel) }}
        </el-tag>
      </div>
      <div class="mental-scores">
        <div class="score-item">
          <div class="score-circle" :style="{ background: getScoreGradient(mentalHealth.totalScore) }">
            <span>{{ mentalHealth.totalScore }}</span>
          </div>
          <div class="score-label">总得分</div>
        </div>
        <div class="score-item">
          <div class="score-circle score-circle--emotion">
            <span>{{ mentalHealth.emotionIndex || '--' }}</span>
          </div>
          <div class="score-label">情绪指数</div>
        </div>
        <div class="score-item">
          <div class="score-circle score-circle--sleep">
            <span>{{ mentalHealth.sleepQuality || '--' }}</span>
          </div>
          <div class="score-label">睡眠质量</div>
        </div>
        <div class="score-item">
          <div class="score-circle score-circle--anxiety">
            <span>{{ mentalHealth.anxietyLevel || '--' }}</span>
          </div>
          <div class="score-label">焦虑水平</div>
        </div>
      </div>
      <div v-if="mentalHealth.suggestion" class="mental-suggestion">
        <span class="suggestion-label">建议：</span>
        <span class="suggestion-text">{{ mentalHealth.suggestion }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { CircleCheck } from '@element-plus/icons-vue'
import { getStressLevelText, getStressTagType, getScoreGradient } from '../utils/portfolioOverviewCompute'

defineProps({
  mentalHealth: { type: Object, default: () => ({}) }
})

defineEmits(['view-detail'])
</script>

<style scoped lang="scss">
.mental-card {
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;

    .card-title {
      font-weight: 600;
      font-size: 15px;
      flex: 1;
    }
  }

  .mental-summary {
    .mental-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      .mental-date {
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }
    }

    .mental-scores {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;

      .score-item {
        text-align: center;

        .score-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          margin: 0 auto 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 18px;
          font-weight: 600;

          &--emotion {
            background: linear-gradient(135deg, #ec4899, #f472b6);
          }

          &--sleep {
            background: linear-gradient(135deg, #8b5cf6, #a78bfa);
          }

          &--anxiety {
            background: linear-gradient(135deg, #f97316, #fb923c);
          }
        }

        .score-label {
          font-size: 12px;
          color: #909399;
        }
      }
    }

    .mental-suggestion {
      padding: 12px;
      background: #f0fdf4;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.6;

      .suggestion-label {
        color: #10b981;
        font-weight: 600;
      }

      .suggestion-text {
        color: #606266;
      }
    }
  }
}
</style>