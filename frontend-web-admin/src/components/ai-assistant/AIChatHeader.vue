<template>
  <!-- 头部 -->
  <div class="chat-header">
    <div class="header-left">
      <div class="ai-avatar">
        <img src="https://img.icons8.com/3d-fluency/94/robot-2.png" alt="AI" />
      </div>
      <div class="header-info">
        <h3>智评AI助手</h3>
        <span class="status-dot"></span>
        <span class="status-text">在线</span>
      </div>
    </div>
    <div class="header-actions">
      <el-tooltip content="清空对话" placement="top">
        <el-button circle size="small" @click="$emit('clear')">
          <el-icon><Delete /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="最小化" placement="top">
        <el-button circle size="small" @click="$emit('minimize')">
          <el-icon><Minus /></el-icon>
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup>
import { Delete, Minus } from '@element-plus/icons-vue'

defineEmits(['clear', 'minimize'])
</script>

<style scoped>
/* 头部 */
.chat-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.ai-avatar img {
  width: 32px;
  height: 32px;
}

.header-info h3 {
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.header-info .status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  margin-right: 6px;
  animation: blink 2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-actions .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
}

.header-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>