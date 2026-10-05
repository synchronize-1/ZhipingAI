<template>
  <el-drawer
    v-model="visible"
    :title="drawerTitle"
    size="620px"
    :close-on-click-modal="false"
  >
    <div class="diagnosis-body">
      <slot name="options" />

      <!-- 生成中 -->
      <div v-if="loading" class="diagnosis-loading">
        <el-icon class="diagnosis-loading__icon" :size="42"><Loading /></el-icon>
        <p class="diagnosis-loading__text">{{ loadingText }}</p>
        <p class="diagnosis-loading__tip">{{ loadingTip }}</p>
        <el-skeleton :rows="6" animated style="margin-top: 24px" />
      </div>

      <!-- 生成结果 -->
      <template v-else-if="content">
        <div class="diagnosis-report__head">
          <h3 class="diagnosis-report__title">{{ reportTitle }}</h3>
          <span v-if="createdAt" class="diagnosis-report__time">生成时间：{{ formatTime(createdAt) }}</span>
        </div>
        <div class="diagnosis-report__content">{{ content }}</div>
      </template>

      <!-- 空状态 -->
      <el-empty v-else :description="emptyText" :image-size="100" />

      <!-- 历史报告 -->
      <div class="diagnosis-history">
        <div class="diagnosis-history__head">
          <span class="diagnosis-history__title">历史报告</span>
          <el-button link type="primary" :icon="Refresh" :loading="historyLoading" @click="$emit('refresh-history')">刷新</el-button>
        </div>
        <el-empty v-if="!historyLoading && historyList.length === 0" description="暂无历史报告" :image-size="60" />
        <ul v-else v-loading="historyLoading" class="diagnosis-history__list">
          <li
            v-for="item in historyList"
            :key="item.id"
            :class="{ 'is-active': item.id === activeReportId }"
            @click="$emit('select-history', item)"
          >
            <span class="history-title">{{ item.title || historyTitleDefault }}</span>
            <span class="history-time">{{ formatTime(item.createdAt) }}</span>
          </li>
        </ul>
      </div>
    </div>

    <template #footer>
      <div class="diagnosis-footer">
        <el-button :icon="DocumentCopy" :disabled="!content" @click="copyContent">复制内容</el-button>
        <el-button type="primary" :icon="Refresh" :loading="loading" @click="$emit('generate')">重新生成</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { Loading, Refresh, DocumentCopy } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatTime } from '../utils/analysisCompute'

const visible = defineModel({ type: Boolean, default: false })

const props = defineProps({
  drawerTitle: { type: String, default: 'AI 学情报告' },
  loading: { type: Boolean, default: false },
  content: { type: String, default: '' },
  reportTitle: { type: String, default: '' },
  createdAt: { type: String, default: '' },
  historyList: { type: Array, default: () => [] },
  historyLoading: { type: Boolean, default: false },
  activeReportId: { type: String, default: '' },
  loadingText: { type: String, default: 'AI 正在生成报告，请稍候…' },
  loadingTip: { type: String, default: '报告生成通常需要 10-40 秒，请勿关闭窗口' },
  emptyText: { type: String, default: '暂无报告，点击下方按钮生成' },
  historyTitleDefault: { type: String, default: '学情报告' }
})

defineEmits(['generate', 'refresh-history', 'select-history'])

const copyContent = async () => {
  if (!props.content) return
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(props.content)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = props.content
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败，请手动选择内容复制')
  }
}
</script>

<style scoped lang="scss">
.diagnosis-body {
  .diagnosis-loading {
    text-align: center;
    padding: 24px 0;

    &__icon {
      color: #667eea;
      animation: diagnosis-rotate 1.4s linear infinite;
    }

    &__text {
      margin: 16px 0 4px;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }

    &__tip {
      margin: 0;
      font-size: 13px;
      color: #909399;
    }
  }

  .diagnosis-report__head {
    padding-bottom: 12px;
    margin-bottom: 12px;
    border-bottom: 1px solid #ebeef5;

    .diagnosis-report__title {
      margin: 0 0 6px;
      font-size: 17px;
      font-weight: 600;
      color: #303133;
    }

    .diagnosis-report__time {
      font-size: 12px;
      color: #909399;
    }
  }

  .diagnosis-report__content {
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 14px;
    line-height: 1.8;
    color: #303133;
  }

  .diagnosis-history {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;

    &__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    &__title {
      font-size: 14px;
      font-weight: 600;
      color: #606266;
    }

    &__list {
      list-style: none;
      padding: 0;
      margin: 0;
      min-height: 60px;

      li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 12px;
        margin-bottom: 8px;
        background: #f5f7fa;
        border-radius: 4px;
        font-size: 13px;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: #ecf5ff;
        }

        &.is-active {
          background: #ecf5ff;
          border-left: 3px solid #409eff;
        }

        .history-title {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #303133;
        }

        .history-time {
          flex-shrink: 0;
          color: #909399;
        }
      }
    }
  }
}

.diagnosis-footer {
  display: flex;
  justify-content: flex-end;
}

@keyframes diagnosis-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>