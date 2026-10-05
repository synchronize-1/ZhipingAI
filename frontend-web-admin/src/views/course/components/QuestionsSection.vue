<template>
  <!-- 课堂提问区域 -->
  <div class="interaction-section questions-section">
    <div class="section-header">
      <div class="header-left">
        <div class="icon-wrapper question-icon">
          <el-icon :size="20"><ChatLineSquare /></el-icon>
        </div>
        <div>
          <h3>课堂提问</h3>
          <p>向老师提出你的疑问</p>
        </div>
      </div>
      <el-button type="primary" @click="dialogVisible = true" class="add-btn">
        <el-icon><Plus /></el-icon>
        提问
      </el-button>
    </div>

    <div class="questions-list">
      <div v-if="questions.length === 0" class="empty-state">
        <img src="https://img.icons8.com/fluency/96/question-mark.png" alt="暂无提问" />
        <p>暂无提问，点击右上角按钮提出你的问题</p>
      </div>

      <div
        v-for="question in questions"
        :key="question.id"
        class="question-card"
        :class="{ 'is-answered': question.answer }"
      >
        <div class="question-header">
          <div class="user-info">
            <el-avatar :size="32" :src="question.userAvatar">
              {{ question.userName?.charAt(0) }}
            </el-avatar>
            <div>
              <span class="user-name">{{ question.userName }}</span>
              <span class="question-time">{{ question.time }}</span>
            </div>
          </div>
          <el-tag :type="question.answer ? 'success' : 'warning'" size="small">
            {{ question.answer ? '已回答' : '待回答' }}
          </el-tag>
        </div>
        <div class="question-content">
          <p class="question-text">{{ question.content }}</p>
          <div v-if="question.answer" class="answer-box">
            <div class="answer-header">
              <el-icon><User /></el-icon>
              <span>{{ question.answerBy }} 回复</span>
            </div>
            <p class="answer-text">{{ question.answer }}</p>
          </div>
        </div>
        <div class="question-actions">
          <el-button text size="small" @click="$emit('like', question)">
            <el-icon><Star /></el-icon>
            {{ question.likes || 0 }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 提问对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="提出问题"
      width="500px"
      class="interaction-dialog"
    >
      <el-form :model="form" label-position="top">
        <el-form-item label="问题内容">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="请输入你的问题..."
          />
        </el-form-item>
        <el-form-item label="是否匿名">
          <el-switch v-model="form.anonymous" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="$emit('submit')">提交问题</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ChatLineSquare, Plus, User, Star } from '@element-plus/icons-vue'

defineProps({
  questions: { type: Array, default: () => [] }
})

const dialogVisible = defineModel('dialogVisible', { type: Boolean, default: false })
const form = defineModel('form', { type: Object, default: () => ({ content: '', anonymous: false }) })

defineEmits(['submit', 'like'])
</script>

<style scoped>
.interaction-section {
  background: linear-gradient(135deg, #faf8f5 0%, #f5f0e8 100%);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.section-header {
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

.icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.question-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.section-header p {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #6b7280;
}

.add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
}

/* 提问列表 */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-state img {
  width: 64px;
  height: 64px;
  opacity: 0.6;
  margin-bottom: 12px;
}

.empty-state p {
  color: #6b7280;
  font-size: 14px;
}

.question-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.question-card:hover {
  background: #fafafa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.question-card.is-answered {
  border-color: rgba(103, 194, 58, 0.3);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-name {
  color: #1f2937;
  font-weight: 500;
  font-size: 14px;
}

.question-time {
  color: #9ca3af;
  font-size: 12px;
  margin-left: 8px;
}

.question-text {
  color: #374151;
  font-size: 15px;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.answer-box {
  background: rgba(103, 194, 58, 0.1);
  border-left: 3px solid #67c23a;
  border-radius: 0 12px 12px 0;
  padding: 12px 16px;
  margin-top: 12px;
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #67c23a;
  font-size: 13px;
  margin-bottom: 8px;
}

.answer-text {
  color: #374151;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.question-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.question-actions .el-button {
  color: #6b7280;
}

.question-actions .el-button:hover {
  color: #f5576c;
}

/* 对话框样式 */
.interaction-dialog :deep(.el-dialog) {
  background: linear-gradient(135deg, #1e1e2f 0%, #2d2d44 100%);
  border-radius: 20px;
}

.interaction-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.interaction-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
}

.interaction-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.interaction-dialog :deep(.el-form-item__label) {
  color: rgba(255, 255, 255, 0.8);
}

.interaction-dialog :deep(.el-textarea__inner) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: white;
}
</style>