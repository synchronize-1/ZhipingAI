<template>
  <!-- 查看详情弹窗 -->
  <el-dialog
    v-model="visible"
    title="测评详情"
    width="700px"
    :close-on-click-modal="true"
  >
    <div v-loading="loading" class="detail-content">
      <!-- 基本信息 -->
      <div class="detail-header">
        <div class="detail-basic">
          <el-tag type="primary" size="small">{{ detailData.assessmentTypeText || '心理健康测评' }}</el-tag>
          <span class="detail-date">{{ detailData.assessmentDate || '--' }}</span>
        </div>
        <div class="detail-scores">
          <div class="score-badge score-badge--total">
            <span class="score-num">{{ detailData.totalScore || '--' }}</span>
            <span class="score-label">总得分</span>
          </div>
          <div class="score-badge score-badge--stress">
            <span class="score-num">{{ getStressLevelText(detailData.stressLevel) }}</span>
            <span class="score-label">压力水平</span>
          </div>
        </div>
      </div>

      <!-- 雷达图 -->
      <div class="radar-section">
        <h4 class="section-title">各维度详细数据</h4>
        <div ref="radarChartRef" class="radar-chart"></div>
      </div>

      <!-- 维度数据列表 -->
      <div class="dimension-list">
        <div v-for="dim in dimensionList" :key="dim.key" class="dimension-item">
          <div class="dim-header">
            <span class="dim-name">{{ dim.name }}</span>
            <span class="dim-score">{{ detailData[dim.key] || '--' }}分</span>
          </div>
          <el-progress
            :percentage="detailData[dim.key] || 0"
            :color="dim.color"
            :stroke-width="6"
            :show-text="false"
          />
        </div>
      </div>

      <!-- 备注和建议 -->
      <div v-if="detailData.notes || detailData.suggestion" class="notes-section">
        <div v-if="detailData.notes" class="notes-block">
          <h4 class="section-title">
            <el-icon color="#909399"><Document /></el-icon>
            测评备注
          </h4>
          <p class="notes-content">{{ detailData.notes }}</p>
        </div>
        <div v-if="detailData.suggestion" class="suggestion-block">
          <h4 class="section-title">
            <el-icon color="#67c23a"><CircleCheck /></el-icon>
            建议与指导
          </h4>
          <p class="suggestion-content">{{ detailData.suggestion }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { Document, CircleCheck } from '@element-plus/icons-vue'
import { useECharts } from '@/composables/useECharts'
import { buildRadarOption } from '../utils/mentalHealthCharts'
import { getStressLevelText } from '../utils/mentalHealthCompute'

const visible = defineModel({ type: Boolean, default: false })

const props = defineProps({
  loading: { type: Boolean, default: false },
  detailData: { type: Object, default: () => ({}) },
  dimensionList: { type: Array, default: () => [] }
})

const radarChartRef = ref(null)
const radarChart = useECharts(radarChartRef, null)

const renderRadar = () => {
  if (!radarChartRef.value) return
  radarChart.setOption(buildRadarOption({
    detailData: props.detailData,
    dimensionList: props.dimensionList
  }), true)
}

watch(
  [() => props.detailData],
  () => {
    if (visible.value) nextTick(renderRadar)
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
.detail-content {
  .detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 20px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 20px;

    .detail-basic {
      display: flex;
      align-items: center;
      gap: 12px;

      .detail-date {
        font-size: 14px;
        color: #606266;
      }
    }

    .detail-scores {
      display: flex;
      gap: 24px;

      .score-badge {
        text-align: center;

        .score-num {
          display: block;
          font-size: 28px;
          font-weight: 700;
          line-height: 1.2;
        }

        .score-label {
          font-size: 12px;
          color: #909399;
          margin-top: 4px;
        }

        &--total .score-num {
          color: #667eea;
        }

        &--stress .score-num {
          font-size: 16px;
          color: #f59e0b;
        }
      }
    }
  }

  .radar-section {
    margin-bottom: 20px;

    .section-title {
      margin: 0 0 12px 0;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }

    .radar-chart {
      width: 100%;
      height: 280px;
    }
  }

  .dimension-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px 24px;
    margin-bottom: 20px;

    .dimension-item {
      .dim-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;

        .dim-name {
          font-size: 13px;
          color: #606266;
        }

        .dim-score {
          font-size: 13px;
          font-weight: 600;
          color: #303133;
        }
      }
    }
  }

  .notes-section {
    .notes-block,
    .suggestion-block {
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .notes-block {
      background: #f5f7fa;

      .notes-content {
        margin: 8px 0 0 0;
        font-size: 14px;
        color: #606266;
        line-height: 1.6;
      }
    }

    .suggestion-block {
      background: #f0fdf4;

      .suggestion-content {
        margin: 8px 0 0 0;
        font-size: 14px;
        color: #606266;
        line-height: 1.6;
      }
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }
}
</style>