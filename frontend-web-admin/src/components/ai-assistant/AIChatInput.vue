<template>
  <!-- 输入区域 -->
  <div class="chat-input-area">
    <div class="input-wrapper">
      <el-input
        v-model="inputMessage"
        placeholder="输入你的问题..."
        :disabled="loading"
        @keyup.enter="$emit('send')"
      >
        <template #prefix>
          <el-icon class="input-icon"><ChatDotRound /></el-icon>
        </template>
      </el-input>
      <el-button
        type="primary"
        :icon="Promotion"
        :loading="loading"
        :disabled="!inputMessage.trim()"
        @click="$emit('send')"
        class="send-btn"
      >
        发送
      </el-button>
    </div>
    <div class="input-tips">
      <span>按 Enter 发送</span>
    </div>
  </div>
</template>

<script setup>
import { ChatDotRound, Promotion } from '@element-plus/icons-vue'

const inputMessage = defineModel({ type: String, default: '' })

defineProps({
  loading: { type: Boolean, default: false }
})

defineEmits(['send'])
</script>

<style scoped>
/* 输入区域 */
.chat-input-area {
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.input-wrapper {
  display: flex;
  gap: 12px;
}

.input-wrapper :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  box-shadow: none;
}

.input-wrapper :deep(.el-input__wrapper:hover),
.input-wrapper :deep(.el-input__wrapper.is-focus) {
  border-color: rgba(102, 126, 234, 0.5);
}

.input-wrapper :deep(.el-input__inner) {
  color: white;
}

.input-wrapper :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}

.input-icon {
  color: rgba(255, 255, 255, 0.5);
}

.send-btn {
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 0 20px;
}

.send-btn:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
}

.input-tips {
  margin-top: 8px;
  text-align: center;
}

.input-tips span {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}
</style>