<!-- frontend-web-admin/src/views/AIHealthWarnings.vue -->
<template>
  <div class="warnings-card">
    <div class="card-header">
      <span>⚠️ 预警干预</span>
      <el-button size="small" @click="refreshData" :loading="loading">
        <el-icon><Refresh /></el-icon> 刷新
      </el-button>
    </div>

    <div v-if="loading" class="state-text">
      <el-icon class="is-loading"><Loading /></el-icon> 加载中...
    </div>
    <div v-else-if="error" class="state-text error">
      <el-icon><CircleClose /></el-icon> {{ error }}
    </div>
    <div v-else>
      <div v-if="warnings.length" class="warning-list">
        <div v-for="w in displayWarnings" :key="w.id" class="warning-item" :class="`level-${w.level}`">
          <div class="warning-header">
            <span class="student-name">{{ w.studentName }}</span>
            <el-tag :type="getLevelTagType(w.level)" size="small">{{ w.level }}依赖</el-tag>
          </div>
          <p class="warning-trigger">
            <span class="trigger-label">触发条件：</span>{{ w.trigger }}
          </p>
          <p class="warning-suggestion">
            <span class="suggestion-label">建议方案：</span>{{ w.suggestion }}
          </p>
          <div class="warning-actions">
            <el-button size="small" type="primary" plain @click="handleAction(w, 'message')">
              <el-icon><ChatDotRound /></el-icon> 发送提醒
            </el-button>
            <el-button size="small" plain @click="handleAction(w, 'detail')">
              <el-icon><View /></el-icon> 查看详情
            </el-button>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无预警学生" :image-size="80" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'

const props = defineProps({
  limit: {
    type: Number,
    default: 0  // 0 表示不限制，显示全部
  }
})

const loading = ref(false)
const error = ref('')
const warnings = ref([])

const displayWarnings = computed(() => {
  if (props.limit > 0) {
    return warnings.value.slice(0, props.limit)
  }
  return warnings.value
})

const getLevelTagType = (level) => {
  if (level === '轻度') return 'success'
  if (level === '中度') return 'warning'
  return 'danger'
}

const handleAction = (warning, action) => {
  if (action === 'message') {
    ElMessage.info(`已向 ${warning.studentName} 发送学习提醒`)
  } else if (action === 'detail') {
    ElMessage.info(`查看 ${warning.studentName} 的详细数据`)
  }
}

const refreshData = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await api.aiHealth.warnings()
    if (res.success) warnings.value = res.data || []
  } catch (e) {
    error.value = e.message || '网络错误'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.warnings-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 600;
  font-size: 16px;
}

.state-text {
  text-align: center;
  padding: 40px;
  color: #64748b;
}

.warning-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.warning-item {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  border-left: 3px solid;
}

.warning-item.level-轻度 { border-left-color: #10b981; }
.warning-item.level-中度 { border-left-color: #f59e0b; }
.warning-item.level-重度 { border-left-color: #ef4444; }

.warning-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.student-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.warning-trigger, .warning-suggestion {
  margin: 6px 0;
  font-size: 13px;
  color: #475569;
}

.trigger-label, .suggestion-label {
  color: #64748b;
}

.warning-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
</style>