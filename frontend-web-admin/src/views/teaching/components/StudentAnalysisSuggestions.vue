<template>
  <!-- 学习建议 -->
  <el-card shadow="never" class="suggestion-card">
    <template #header>
      <div class="card-header">
        <el-icon color="#409eff" :size="18"><Reading /></el-icon>
        <span class="card-title">学习建议</span>
      </div>
    </template>
    <el-empty v-if="!suggestions || suggestions.length === 0" description="暂无建议" :image-size="60" />
    <ul v-else class="suggestion-list">
      <li v-for="(item, index) in suggestions" :key="index">
        <div class="suggestion-num">{{ index + 1 }}</div>
        <div class="suggestion-content">{{ item }}</div>
      </li>
    </ul>
  </el-card>
</template>

<script setup>
import { Reading } from '@element-plus/icons-vue'

defineProps({
  suggestions: { type: Array, default: () => [] }
})
</script>

<style scoped lang="scss">
.suggestion-card {
  margin-bottom: 16px;

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;

    .card-title {
      font-weight: 600;
      font-size: 15px;
    }
  }

  .suggestion-list {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .suggestion-num {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #409eff;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        flex-shrink: 0;
      }

      .suggestion-content {
        flex: 1;
        font-size: 14px;
        color: #606266;
        line-height: 1.6;
      }
    }
  }
}
</style>