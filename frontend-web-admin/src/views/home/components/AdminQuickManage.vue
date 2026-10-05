<template>
  <!-- 左侧：快捷管理 -->
  <div class="content-card quick-manage">
    <div class="card-header">
      <div class="header-left">
        <div class="header-icon purple">
          <el-icon><Grid /></el-icon>
        </div>
        <div>
          <h3>快捷管理</h3>
          <p>常用管理功能</p>
        </div>
      </div>
    </div>
    <div class="manage-grid">
      <div v-for="item in quickManage" :key="item.name" class="manage-item" @click="emit('manage', item)">
        <div class="manage-icon" :style="{ background: item.gradient }">
          <el-icon :size="22">
            <User v-if="item.iconName === 'User'" />
            <Reading v-else-if="item.iconName === 'Reading'" />
            <DataAnalysis v-else-if="item.iconName === 'DataAnalysis'" />
            <Bell v-else-if="item.iconName === 'Bell'" />
            <Setting v-else-if="item.iconName === 'Setting'" />
          </el-icon>
        </div>
        <div class="manage-info">
          <span class="manage-name">{{ item.name }}</span>
          <span class="manage-count">{{ item.count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Grid, User, Reading, DataAnalysis, Bell, Setting } from '@element-plus/icons-vue'

defineProps({
  quickManage: { type: Array, default: () => [] }
})

const emit = defineEmits(['manage'])
</script>

<style scoped>
/* 内容卡片 */
.content-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  color: #1f2937;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-header .header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.header-icon.purple { background: linear-gradient(135deg, #667eea, #764ba2); }

.card-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.card-header p {
  margin: 1px 0 0 0;
  font-size: 11px;
  color: #6b7280;
}

/* 快捷管理 */
.manage-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.manage-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f1f5f9;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.manage-item:hover {
  background: #e2e8f0;
  transform: translateX(2px);
}

.manage-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.manage-info {
  flex: 1;
}

.manage-name {
  display: block;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 1px;
}

.manage-count {
  font-size: 10px;
  color: #6b7280;
}

/* 响应式 */
@media (max-width: 768px) {
  .manage-grid {
    grid-template-columns: 1fr;
  }
}
</style>