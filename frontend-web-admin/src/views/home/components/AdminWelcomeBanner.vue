<template>
  <!-- 欢迎横幅 -->
  <div class="welcome-banner">
    <div class="banner-content">
      <div class="banner-left">
        <h1>{{ greetingText }}，{{ userName }} 👋</h1>
        <p>欢迎回来！</p>
      </div>
      <div class="banner-right">
        <div class="system-status">
          <div class="status-dot online"></div>
          <span>系统运行正常</span>
        </div>
        <el-button type="primary" round @click="emit('refresh')">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Refresh } from '@element-plus/icons-vue'

defineProps({
  greetingText: { type: String, default: '' },
  userName: { type: String, default: '管理员' }
})

const emit = defineEmits(['refresh'])
</script>

<style scoped>
/* 欢迎横幅 */
.welcome-banner {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.banner-left h1 {
  margin: 0 0 2px 0;
  font-size: 18px;
  font-weight: 600;
}

.banner-left p {
  margin: 0;
  font-size: 13px;
  opacity: 0.8;
}

.banner-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>