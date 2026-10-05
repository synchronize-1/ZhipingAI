<template>
  <!-- 查看详情弹窗 -->
  <el-dialog
    v-model="visible"
    title="评语详情"
    width="600px"
    :close-on-click-modal="true"
  >
    <div class="view-detail">
      <div class="detail-header">
        <div class="detail-tags">
          <el-tag type="primary">{{ viewData.semester || '--' }}</el-tag>
          <el-tag :type="getTypeTagType(viewData.type)">
            {{ getTypeText(viewData.type) }}
          </el-tag>
          <el-tag :type="getSourceTagType(viewData.source)" effect="plain">
            {{ getSourceText(viewData.source) }}
          </el-tag>
        </div>
        <div class="detail-meta">
          <span>{{ viewData.teacherName || '系统' }} · {{ viewData.createTime }}</span>
        </div>
      </div>
      <div class="detail-content">
        <p v-html="viewData.content"></p>
      </div>
      <div v-if="viewData.updateTime && viewData.updateTime !== viewData.createTime" class="detail-update">
        <span class="update-label">最后更新：</span>
        <span class="update-time">{{ viewData.updateTime }}</span>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button v-if="isTeacherOrAdmin" type="primary" @click="$emit('edit')">
        编辑
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { getTypeText, getTypeTagType, getSourceText, getSourceTagType } from '../utils/commentCompute'

const visible = defineModel({ type: Boolean, default: false })

defineProps({
  viewData: { type: Object, default: () => ({}) },
  isTeacherOrAdmin: { type: Boolean, default: false }
})

defineEmits(['edit'])
</script>

<style scoped lang="scss">
.view-detail {
  .detail-header {
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 16px;

    .detail-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 10px;
    }

    .detail-meta {
      font-size: 13px;
      color: #909399;
    }
  }

  .detail-content {
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    margin-bottom: 16px;

    p {
      margin: 0;
      font-size: 14px;
      color: #303133;
      line-height: 2;
      white-space: pre-wrap;
    }
  }

  .detail-update {
    text-align: right;
    font-size: 12px;
    color: #c0c4cc;

    .update-label {
      margin-right: 4px;
    }
  }
}
</style>