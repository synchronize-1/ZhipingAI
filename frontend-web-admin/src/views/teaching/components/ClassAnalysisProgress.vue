<template>
  <!-- 进步 / 退步学生识别 -->
  <el-card shadow="never" class="progress-card">
    <template #header>
      <div class="progress-card__header">
        <span class="chart-title">进步 / 退步学生识别</span>
        <el-select
          v-model="baseExamId"
          placeholder="对比考试（默认上一场）"
          clearable
          filterable
          size="small"
          style="width: 240px"
          @change="$emit('change')"
        >
          <el-option
            v-for="exam in baseExamOptions"
            :key="exam.id"
            :label="exam.name"
            :value="exam.id"
          />
        </el-select>
      </div>
    </template>

    <div v-loading="progressLoading">
      <el-empty
        v-if="!progressData.hasComparison"
        description="暂无可对比的历史考试，至少需要两场该班级有成绩的考试"
        :image-size="80"
      />
      <template v-else>
        <div class="progress-summary">
          <div class="progress-summary__item">
            <span class="progress-summary__label">对比范围</span>
            <span class="progress-summary__value">
              {{ progressData.baseExam?.name }} → {{ progressData.exam?.name }}
            </span>
          </div>
          <div class="progress-summary__item">
            <span class="progress-summary__label">对比人数</span>
            <span class="progress-summary__value">{{ progressData.summary?.comparedCount }}</span>
          </div>
          <div class="progress-summary__item">
            <span class="progress-summary__label">进步</span>
            <span class="progress-summary__value delta-up">{{ progressData.summary?.progressCount }} 人</span>
          </div>
          <div class="progress-summary__item">
            <span class="progress-summary__label">退步</span>
            <span class="progress-summary__value delta-down">{{ progressData.summary?.declineCount }} 人</span>
          </div>
          <div class="progress-summary__item">
            <span class="progress-summary__label">班级平均变化</span>
            <span class="progress-summary__value" :class="deltaClass(progressData.summary?.avgDelta)">
              {{ formatDelta(progressData.summary?.avgDelta) }}
            </span>
          </div>
        </div>

        <el-row :gutter="16">
          <el-col :md="12" :sm="24">
            <h4 class="progress-list-title progress-list-title--up">
              <el-icon><CaretTop /></el-icon> 进步最大
            </h4>
            <el-table v-if="progressData.progressTop?.length" :data="progressData.progressTop" size="small" border stripe>
              <el-table-column type="index" label="No." width="55" align="center" />
              <el-table-column prop="studentName" label="姓名" min-width="80" />
              <el-table-column label="对比考试" align="center" width="90">
                <template #default="{ row }">{{ row.baseScore }}</template>
              </el-table-column>
              <el-table-column label="本次考试" align="center" width="90">
                <template #default="{ row }">{{ row.currentScore }}</template>
              </el-table-column>
              <el-table-column label="提升" align="center" width="80">
                <template #default="{ row }">
                  <span class="delta-up">+{{ row.delta }}</span>
                </template>
              </el-table-column>
              <el-table-column label="名次变化" align="center" width="90">
                <template #default="{ row }">
                  <el-tag v-if="row.rankDelta !== null" :type="row.rankDelta > 0 ? 'success' : 'info'" size="small">
                    {{ row.rankDelta > 0 ? '+' : '' }}{{ row.rankDelta }}
                  </el-tag>
                  <span v-else>--</span>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="本次无进步学生" :image-size="60" />
          </el-col>

          <el-col :md="12" :sm="24">
            <h4 class="progress-list-title progress-list-title--down">
              <el-icon><CaretBottom /></el-icon> 退步最大
            </h4>
            <el-table v-if="progressData.declineTop?.length" :data="progressData.declineTop" size="small" border stripe>
              <el-table-column type="index" label="No." width="55" align="center" />
              <el-table-column prop="studentName" label="姓名" min-width="80" />
              <el-table-column label="对比考试" align="center" width="90">
                <template #default="{ row }">{{ row.baseScore }}</template>
              </el-table-column>
              <el-table-column label="本次考试" align="center" width="90">
                <template #default="{ row }">{{ row.currentScore }}</template>
              </el-table-column>
              <el-table-column label="下降" align="center" width="80">
                <template #default="{ row }">
                  <span class="delta-down">{{ row.delta }}</span>
                </template>
              </el-table-column>
              <el-table-column label="名次变化" align="center" width="90">
                <template #default="{ row }">
                  <el-tag v-if="row.rankDelta !== null" :type="row.rankDelta < 0 ? 'danger' : 'info'" size="small">
                    {{ row.rankDelta > 0 ? '+' : '' }}{{ row.rankDelta }}
                  </el-tag>
                  <span v-else>--</span>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="本次无退步学生" :image-size="60" />
          </el-col>
        </el-row>
      </template>
    </div>
  </el-card>
</template>

<script setup>
import { CaretTop, CaretBottom } from '@element-plus/icons-vue'
import { formatDelta, deltaClass } from '../utils/analysisCompute'

const baseExamId = defineModel('baseExamId', { default: '' })

defineProps({
  progressData: { type: Object, default: () => ({ hasComparison: false, summary: null, progressTop: [], declineTop: [] }) },
  progressLoading: { type: Boolean, default: false },
  baseExamOptions: { type: Array, default: () => [] }
})

defineEmits(['change'])
</script>

<style scoped lang="scss">
.progress-card {
  margin-bottom: 16px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .chart-title {
    font-weight: 600;
    font-size: 15px;
  }

  .progress-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;

    &__item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: #f5f7fa;
      border-radius: 6px;
    }

    &__label {
      font-size: 13px;
      color: #909399;
    }

    &__value {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }

  .progress-list-title {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #606266;

    &--up { color: #10b981; }
    &--down { color: #f56c6c; }
  }

  .delta-up {
    color: #10b981;
    font-weight: 600;
  }

  .delta-down {
    color: #f56c6c;
    font-weight: 600;
  }
}
</style>