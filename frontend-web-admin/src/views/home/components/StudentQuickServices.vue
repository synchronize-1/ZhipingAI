<template>
  <!-- 快捷服务卡片 -->
  <div class="content-card quick-services">
    <div class="card-header">
      <div class="header-left">
        <div class="header-icon purple">
          <el-icon><Grid /></el-icon>
        </div>
        <div>
          <h3>快捷服务</h3>
          <p>常用功能入口</p>
        </div>
      </div>
    </div>
    <div class="services-grid">
      <div
        v-for="service in quickServices"
        :key="service.name"
        class="service-item"
        @click="$emit('navigate', service)"
      >
        <div class="service-icon" :style="{ background: service.gradient }">
          <el-icon :size="24"><component :is="service.icon" /></el-icon>
        </div>
        <span class="service-name">{{ service.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Grid, Bowl, Reading, DataLine, Flag, Wallet } from '@element-plus/icons-vue'

defineOptions({ name: 'StudentQuickServices' })

defineProps({
  quickServices: { type: Array, default: () => [] }
})

defineEmits(['navigate'])
</script>

<style scoped>
/* 内容卡片（通用） */
.content-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 20px;
}

.header-icon.purple { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }

.header-left h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.header-left p {
  margin: 2px 0 0 0;
  font-size: 13px;
  color: #6b7280;
}

/* 快捷服务 */
.services-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.service-item:hover {
  background: #f9fafb;
  transform: translateY(-4px);
}

.service-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.service-name {
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
}

/* 响应式 */
@media (max-width: 768px) {
  .services-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>