<template>
  <!-- 快捷功能 -->
  <div class="quick-actions">
    <div
      v-for="action in actions"
      :key="action.text"
      class="quick-action-item"
      @click="$emit('select', action.query)"
    >
      <el-icon :size="16"><component :is="action.icon" /></el-icon>
      <span>{{ action.text }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  actions: { type: Array, default: () => [] }
})

defineEmits(['select'])
</script>

<style scoped>
/* 快捷功能 */
.quick-actions {
  padding: 10px 12px;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  scrollbar-width: none;
}

.quick-actions::-webkit-scrollbar {
  display: none;
}

.quick-action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 16px;
  color: #a5b4fc;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  flex-shrink: 0;
}

.quick-action-item:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.4) 0%, rgba(118, 75, 162, 0.4) 100%);
  color: white;
  transform: translateY(-2px);
}
</style>