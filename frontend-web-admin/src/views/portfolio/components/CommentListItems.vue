<template>
  <!-- 评语列表 -->
  <el-card shadow="never" class="list-card">
    <div v-loading="loading" class="comment-list-container">
      <el-empty v-if="data.length === 0 && !loading" description="暂无评语记录" :image-size="80" />

      <div v-for="item in data" :key="item.id" class="comment-item">
        <div class="comment-header">
          <div class="comment-tags">
            <el-tag type="primary" size="small">{{ item.semester || '--' }}</el-tag>
            <el-tag size="small" :type="getTypeTagType(item.type)">
              {{ getTypeText(item.type) }}
            </el-tag>
            <el-tag size="small" :type="getSourceTagType(item.source)" effect="plain">
              {{ getSourceText(item.source) }}
            </el-tag>
          </div>
          <div class="comment-meta">
            <span class="comment-author">{{ item.teacherName || '系统' }}</span>
            <span class="comment-time">{{ item.createTime }}</span>
          </div>
        </div>

        <div class="comment-body">
          <p class="content-summary">{{ getContentSummary(item.content) }}</p>
        </div>

        <div class="comment-footer">
          <div class="comment-stats">
            <span v-if="item.wordCount" class="stat-item">
              <el-icon :size="14"><Document /></el-icon>
              {{ item.wordCount }} 字
            </span>
          </div>
          <div class="comment-actions">
            <el-button type="primary" link size="small" @click="$emit('view', item)">
              查看全文
            </el-button>
            <el-button v-if="isTeacherOrAdmin" type="primary" link size="small" @click="$emit('edit', item)">
              编辑
            </el-button>
            <el-button v-if="isTeacherOrAdmin" type="danger" link size="small" @click="$emit('delete', item)">
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="showPagination" class="pagination-wrapper">
      <el-pagination
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        :disabled="loading"
        @current-change="$emit('page-change', $event)"
        @size-change="$emit('size-change', $event)"
      />
    </div>
  </el-card>
</template>

<script setup>
import { Document } from '@element-plus/icons-vue'
import {
  getTypeText,
  getTypeTagType,
  getSourceText,
  getSourceTagType,
  getContentSummary
} from '../utils/commentCompute'

defineProps({
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  pagination: { type: Object, default: () => ({ page: 1, pageSize: 10, total: 0 }) },
  showPagination: { type: Boolean, default: false },
  isTeacherOrAdmin: { type: Boolean, default: false }
})

defineEmits(['page-change', 'size-change', 'view', 'edit', 'delete'])
</script>

<style scoped lang="scss">
.list-card {
  margin-bottom: 16px;

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.comment-list-container {
  .comment-item {
    padding: 20px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    margin-bottom: 16px;
    transition: all 0.2s;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      border-color: #409eff;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
    }

    .comment-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 12px;

      .comment-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .comment-meta {
        text-align: right;
        font-size: 13px;
        color: #909399;

        .comment-author {
          margin-right: 12px;
        }
      }
    }

    .comment-body {
      margin-bottom: 12px;

      .content-summary {
        margin: 0;
        font-size: 14px;
        color: #606266;
        line-height: 1.8;
      }
    }

    .comment-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;

      .comment-stats {
        display: flex;
        gap: 16px;

        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #909399;
        }
      }

      .comment-actions {
        display: flex;
        gap: 4px;
      }
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>