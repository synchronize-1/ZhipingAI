<template>
  <!-- 悬浮按钮 -->
  <div
    class="ai-float-btn"
    :class="{ 'is-open': isOpen }"
    @click="$emit('toggle')"
  >
    <div class="btn-inner">
      <img
        v-if="!isOpen"
        src="https://img.icons8.com/3d-fluency/94/robot-2.png"
        alt="AI助手"
        class="ai-icon"
      />
      <el-icon v-else :size="28"><Close /></el-icon>
    </div>
    <div class="pulse-ring"></div>
    <div class="pulse-ring delay"></div>
  </div>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'

defineProps({
  isOpen: { type: Boolean, default: false }
})

defineEmits(['toggle'])
</script>

<style scoped>
/* 悬浮按钮 */
.ai-float-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-float-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.5);
}

.ai-float-btn.is-open {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.ai-icon {
  width: 36px;
  height: 36px;
}

/* 脉冲动画 */
.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid rgba(102, 126, 234, 0.5);
  animation: pulse 2s ease-out infinite;
}

.pulse-ring.delay {
  animation-delay: 1s;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.ai-float-btn.is-open .pulse-ring {
  display: none;
}
</style>