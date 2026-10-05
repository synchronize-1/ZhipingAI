<template>
  <!-- 最新学期评语展示 -->
  <el-card shadow="never" class="comment-card">
    <template #header>
      <div class="card-header">
        <el-icon color="#409eff" :size="18"><EditPen /></el-icon>
        <span class="card-title">学期评语</span>
        <el-button type="primary" text size="small" @click="$emit('view-all')">查看全部</el-button>
      </div>
    </template>
    <el-empty v-if="!comment.id" description="暂无评语记录" :image-size="60" />
    <div v-else class="comment-content">
      <div class="comment-header">
        <el-tag type="primary" size="small">{{ comment.semester || '--' }}</el-tag>
        <el-tag size="small" :type="getCommentSourceType(comment.source)">
          {{ getCommentSourceText(comment.source) }}
        </el-tag>
        <span class="comment-type">{{ getCommentTypeText(comment.type) }}</span>
        <span class="comment-time">{{ comment.createTime }}</span>
      </div>
      <div class="comment-body">
        <p>{{ comment.content }}</p>
      </div>
      <div class="comment-footer">
        <span class="comment-author">— {{ comment.teacherName || '系统' }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { EditPen } from '@element-plus/icons-vue'
import {
  getCommentSourceText,
  getCommentSourceType,
  getCommentTypeText
} from '../utils/portfolioOverviewCompute'

defineProps({
  comment: { type: Object, default: () => ({}) }
})

defineEmits(['view-all'])
</script>

<style scoped lang="scss">
.comment-card {
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

  .comment-content {
    .comment-header {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;

      .comment-type {
        font-size: 13px;
        color: #606266;
      }

      .comment-time {
        margin-left: auto;
        font-size: 12px;
        color: #909399;
      }
    }

    .comment-body {
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;
      margin-bottom: 12px;

      p {
        margin: 0;
        font-size: 14px;
        color: #606266;
        line-height: 1.8;
      }
    }

    .comment-footer {
      text-align: right;

      .comment-author {
        font-size: 13px;
        color: #909399;
      }
    }
  }
}
</style>