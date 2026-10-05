<template>
  <!-- 记录列表 -->
  <el-card shadow="never" class="table-card">
    <template #header>
      <div class="card-header">
        <span class="card-title">测评记录列表</span>
        <span class="record-count">共 {{ pagination.total }} 条记录</span>
      </div>
    </template>

    <DataTable
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="pagination"
      :index="true"
      @update:page="$emit('page-change', $event)"
      @update:pageSize="$emit('size-change', $event)"
    >
      <template #totalScore="{ row }">
        <span class="score-value" :class="getScoreClass(row.totalScore)">
          {{ row.totalScore }}
        </span>
      </template>

      <template #stressLevel="{ row }">
        <el-tag :type="getStressTagType(row.stressLevel)" size="small">
          {{ getStressLevelText(row.stressLevel) }}
        </el-tag>
      </template>

      <template #emotionIndex="{ row }">
        <div class="emotion-index">
          <el-progress
            :percentage="row.emotionIndex || 0"
            :color="getEmotionColor(row.emotionIndex)"
            :stroke-width="8"
            :show-text="false"
            style="width: 80px; margin-right: 8px"
          />
          <span>{{ row.emotionIndex || '--' }}</span>
        </div>
      </template>

      <template #action="{ row }">
        <el-button type="primary" link size="small" @click="$emit('view', row)">
          查看
        </el-button>
        <el-button v-if="isTeacherOrAdmin" type="primary" link size="small" @click="$emit('edit', row)">
          编辑
        </el-button>
        <el-button v-if="isTeacherOrAdmin" type="danger" link size="small" @click="$emit('delete', row)">
          删除
        </el-button>
      </template>
    </DataTable>
  </el-card>
</template>

<script setup>
import DataTable from '@/components/common/DataTable.vue'
import { getStressLevelText, getStressTagType, getScoreClass, getEmotionColor } from '../utils/mentalHealthCompute'

defineProps({
  columns: { type: Array, default: () => [] },
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  pagination: { type: Object, default: () => ({ page: 1, pageSize: 10, total: 0 }) },
  isTeacherOrAdmin: { type: Boolean, default: false }
})

defineEmits(['page-change', 'size-change', 'view', 'edit', 'delete'])
</script>

<style scoped lang="scss">
.table-card {
  margin-bottom: 16px;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-title {
      font-weight: 600;
      font-size: 15px;
    }

    .record-count {
      font-size: 13px;
      color: #909399;
    }
  }
}

.score-value {
  font-weight: 600;
  font-size: 16px;

  &.score-excellent { color: #10b981; }
  &.score-good { color: #3b82f6; }
  &.score-normal { color: #f59e0b; }
  &.score-low { color: #ef4444; }
}

.emotion-index {
  display: flex;
  align-items: center;
}
</style>