<template>
  <!-- AI 生成评语弹窗 -->
  <el-dialog
    v-model="visible"
    title="AI 智能生成评语"
    width="720px"
    :close-on-click-modal="false"
  >
    <el-form :model="aiFormData" label-width="100px">
      <el-form-item label="选择学生" required>
        <el-select
          v-model="aiFormData.studentId"
          placeholder="请选择学生"
          style="width: 100%"
          filterable
          clearable
        >
          <el-option
            v-for="stu in studentOptions"
            :key="stu.id"
            :label="`${stu.name} (${stu.studentNo})`"
            :value="stu.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="学期" required>
        <el-input
          v-model="aiFormData.semester"
          placeholder="如：2024-2025第一学期"
          clearable
        />
      </el-form-item>

      <el-form-item label="评语风格">
        <el-radio-group v-model="aiFormData.style">
          <el-radio value="formal">正式</el-radio>
          <el-radio value="warm">亲切</el-radio>
          <el-radio value="encouraging">鼓励</el-radio>
          <el-radio value="concise">简洁</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="评语长度">
        <el-radio-group v-model="aiFormData.length">
          <el-radio value="short">简短</el-radio>
          <el-radio value="medium">中等</el-radio>
          <el-radio value="long">详细</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          :icon="MagicStick"
          :loading="aiGenerating"
          :disabled="!aiFormData.studentId || !aiFormData.semester"
          @click="$emit('generate')"
        >
          {{ generatedComment ? '重新生成' : '生成评语' }}
        </el-button>
        <span v-if="aiGenerating" class="generate-status">AI 正在生成中，请稍候...</span>
      </el-form-item>
    </el-form>

    <!-- 生成结果展示区 -->
    <div v-if="generatedComment" class="ai-result-section">
      <div class="result-header">
        <span class="result-title">生成结果</span>
        <span class="word-count">{{ generatedComment.length }} 字</span>
      </div>
      <el-input
        v-model="generatedComment"
        type="textarea"
        :rows="10"
        placeholder="AI 生成的评语将显示在这里，您可以直接编辑修改..."
        maxlength="2000"
        show-word-limit
      />
      <div class="result-actions">
        <el-button :icon="Refresh" :loading="aiGenerating" @click="$emit('generate')">
          重新生成
        </el-button>
        <el-button type="primary" :loading="aiSaveLoading" @click="$emit('save')">
          保存评语
        </el-button>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { MagicStick, Refresh } from '@element-plus/icons-vue'

const visible = defineModel({ type: Boolean, default: false })
const generatedComment = defineModel('generatedComment', { type: String, default: '' })

defineProps({
  aiFormData: { type: Object, default: () => ({}) },
  studentOptions: { type: Array, default: () => [] },
  aiGenerating: { type: Boolean, default: false },
  aiSaveLoading: { type: Boolean, default: false }
})

defineEmits(['generate', 'save'])
</script>

<style scoped lang="scss">
.ai-result-section {
  margin-top: 8px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;

  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    .result-title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }

    .word-count {
      font-size: 13px;
      color: #909399;
    }
  }

  .result-actions {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

.generate-status {
  margin-left: 12px;
  font-size: 13px;
  color: #909399;
}
</style>