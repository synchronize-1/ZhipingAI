<template>
  <div class="content-card quick-actions">
    <div class="card-header">
      <div class="header-left">
        <div class="header-icon blue">
          <el-icon><Grid /></el-icon>
        </div>
        <div>
          <h3>快捷功能</h3>
          <p>常用操作入口</p>
        </div>
      </div>
    </div>
    <div class="actions-grid">
      <div v-for="action in quickActions" :key="action.name" class="action-item" @click="emit('action', action)">
        <div class="action-icon" :style="{ background: action.gradient }">
          <span>{{ action.icon }}</span>
        </div>
        <span class="action-name">{{ action.name }}</span>
      </div>
    </div>
  </div>

  <!-- 发布作业弹窗 -->
  <el-dialog v-model="showHomeworkDialog" title="发布作业" width="600px">
    <el-form :model="homeworkForm" label-width="100px">
      <el-form-item label="选择课程">
        <el-select v-model="homeworkForm.courseId" style="width: 100%">
          <el-option v-for="c in todayClassList" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="作业标题">
        <el-input v-model="homeworkForm.title" placeholder="请输入作业标题" />
      </el-form-item>
      <el-form-item label="作业内容">
        <el-input v-model="homeworkForm.content" type="textarea" :rows="4" placeholder="请输入作业要求" />
      </el-form-item>
      <el-form-item label="截止时间">
        <el-date-picker v-model="homeworkForm.deadline" type="datetime" placeholder="选择截止时间" style="width: 100%" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showHomeworkDialog = false">取消</el-button>
      <el-button type="primary" @click="emit('submit-homework')">发布</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { Grid } from '@element-plus/icons-vue'

defineOptions({ name: 'TeacherQuickActions' })

defineProps({
  quickActions: { type: Array, default: () => [] },
  todayClassList: { type: Array, default: () => [] }
})

const showHomeworkDialog = defineModel('showHomeworkDialog', { type: Boolean, default: false })
const homeworkForm = defineModel('homeworkForm', { type: Object, default: () => ({ courseId: '', title: '', content: '', deadline: null }) })

const emit = defineEmits(['action', 'submit-homework'])
</script>

<style scoped>
/* 内容卡片 */
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
  background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
  color: white;
  font-size: 20px;
}

.header-icon.blue { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }

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

/* 快捷功能 */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-item:hover {
  background: #f9fafb;
  transform: translateY(-4px);
}

.action-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-name {
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
}

@media (max-width: 768px) {
  .actions-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>