<!-- frontend-web-admin/src/views/ai-health/components/AIHealthWarnings.vue -->
<template>
  <el-card class="warnings-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>⚠️ 预警干预</span>
        <el-button size="small" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>
    </template>

    <div v-if="loading" class="state-text">
      <el-icon class="is-loading"><Loading /></el-icon> 加载中...
    </div>
    <div v-else-if="error" class="state-text error">
      <el-icon><CircleClose /></el-icon> {{ error }}
    </div>
    <div v-else>
      <el-tabs v-model="activeTab">
        <!-- 预警列表 -->
        <el-tab-pane label="实时预警" name="warnings">
          <div v-if="warnings.length" class="warning-list">
            <div v-for="w in warnings" :key="w.id" class="warning-item" :class="`level-${w.level}`">
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
          <el-empty v-else description="暂无预警学生" :image-size="100" />
        </el-tab-pane>

        <!-- 替代性学习方案推荐 -->
        <el-tab-pane label="学习方案推荐" name="recommendations">
          <div class="recommendations-list">
            <div v-for="plan in recommendations" :key="plan.id" class="plan-card">
              <div class="plan-header">
                <div class="plan-icon" :class="getPlanIconClass(plan.id)">
                  {{ getPlanIcon(plan.id) }}
                </div>
                <div class="plan-info">
                  <h4>{{ plan.title }}</h4>
                  <p class="plan-target">
                    <el-tag size="small" type="info">适用：{{ plan.target }}</el-tag>
                  </p>
                </div>
              </div>
              <p class="plan-description">{{ plan.description }}</p>
              <div class="plan-actions">
                <el-button size="small" type="primary" plain @click="applyPlan(plan)">
                  <el-icon><Check /></el-icon> 采纳建议
                </el-button>
                <el-button size="small" plain @click="viewPlanDetail(plan)">
                  <el-icon><View /></el-icon> 查看详情
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'
import { Loading, CircleClose, Refresh, ChatDotRound, View, Check } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const loading = ref(false)
const error = ref('')
const warnings = ref([])
const recommendations = ref([])
const activeTab = ref('warnings')

const getLevelTagType = (level) => {
  if (level === '轻度') return 'success'
  if (level === '中度') return 'warning'
  return 'danger'
}

const getPlanIconClass = (id) => {
  const classes = {
    1: 'blue', 2: 'purple', 3: 'green', 4: 'orange', 5: 'cyan'
  }
  return classes[id] || 'blue'
}

const getPlanIcon = (id) => {
  const icons = { 1: '🧠', 2: '🗣️', 3: '📝', 4: '🤖', 5: '👥' }
  return icons[id] || '📚'
}

// 操作按钮处理
const handleAction = (warning, action) => {
  if (action === 'message') {
    ElMessage.info(`已向 ${warning.studentName} 发送学习提醒`)
  } else if (action === 'detail') {
    ElMessage.info(`查看 ${warning.studentName} 的详细数据`)
  }
}

// 采纳方案
const applyPlan = (plan) => {
  ElMessage.success(`已采纳「${plan.title}」方案，后续将推送相关内容`)
}

// 查看方案详情
const viewPlanDetail = (plan) => {
  ElMessage.info(`方案详情：${plan.description}`)
}

// 获取预警列表
const fetchWarnings = async () => {
  try {
    const res = await api.aiHealth.warnings()
    if (res.success) warnings.value = res.data || []
  } catch (e) {
    console.error('获取预警列表失败:', e)
  }
}

// 获取推荐方案
const fetchRecommendations = async () => {
  try {
    const res = await api.aiHealth.recommendations()
    if (res.success) recommendations.value = res.data || []
  } catch (e) {
    console.error('获取推荐方案失败:', e)
  }
}

// 刷新所有数据
const refreshData = async () => {
  loading.value = true
  error.value = ''
  try {
    await Promise.all([fetchWarnings(), fetchRecommendations()])
    ElMessage.success('数据已刷新')
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
.warnings-card :deep(.el-card__header) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.state-text {
  text-align: center;
  padding: 40px;
  color: #64748b;
}

.state-text.error {
  color: #ef4444;
}

/* 预警列表 */
.warning-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.warning-item {
  background: white;
  border-radius: 16px;
  padding: 20px;
  border-left: 4px solid;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.warning-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.warning-item.level-轻度 { border-left-color: #10b981; }
.warning-item.level-中度 { border-left-color: #f59e0b; }
.warning-item.level-重度 { border-left-color: #ef4444; }

.warning-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.student-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.warning-trigger,
.warning-suggestion {
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.5;
}

.trigger-label,
.suggestion-label {
  color: #64748b;
  font-weight: 500;
}

.warning-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

/* 推荐方案列表 */
.recommendations-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.plan-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s;
}

.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.plan-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.plan-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.plan-icon.blue { background: linear-gradient(135deg, #667eea, #764ba2); }
.plan-icon.purple { background: linear-gradient(135deg, #a855f7, #7c3aed); }
.plan-icon.green { background: linear-gradient(135deg, #10b981, #059669); }
.plan-icon.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
.plan-icon.cyan { background: linear-gradient(135deg, #06b6d4, #0891b2); }

.plan-info h4 {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.plan-target {
  margin: 0;
}

.plan-description {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
}

.plan-actions {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

/* 响应式 */
@media (max-width: 768px) {
  .recommendations-list {
    grid-template-columns: 1fr;
  }
  .warning-actions,
  .plan-actions {
    flex-direction: column;
  }
  .warning-actions .el-button,
  .plan-actions .el-button {
    width: 100%;
  }
}
</style>