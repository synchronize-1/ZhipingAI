<template>
  <div class="content-card todo-section">
    <div class="card-header">
      <div class="header-left">
        <div class="header-icon orange">
          <el-icon><List /></el-icon>
        </div>
        <div>
          <h3>待办事项</h3>
          <p>{{ pendingTodos }}项待处理</p>
        </div>
      </div>
    </div>
    <div class="todo-list">
      <div 
        v-for="todo in todoList" 
        :key="todo.id"
        class="todo-item"
        :class="{ 'is-urgent': todo.priority === 'high' }"
      >
        <div class="todo-priority" :class="todo.priority"></div>
        <div class="todo-content">
          <span class="todo-title">{{ todo.title }}</span>
          <span class="todo-meta">
            <el-icon><Clock /></el-icon>
            {{ todo.deadline }}
          </span>
        </div>
        <el-button size="small" plain @click="emit('handle-todo', todo)">
          处理
        </el-button>
      </div>
      <div v-if="todoList.length === 0" class="empty-todo">
        <el-icon><SuccessFilled /></el-icon>
        <span>暂无待办事项</span>
      </div>
    </div>
  </div>

  <!-- 待办事项详情弹窗 -->
  <el-dialog v-model="showTodoDialog" :title="currentTodo?.title" width="600px">
    <div class="todo-dialog-content">
      <template v-if="currentTodo?.id === 1">
        <h4>待批改作业列表</h4>
        <el-table :data="homeworkList" stripe style="width: 100%">
          <el-table-column prop="studentName" label="学生" width="100" />
          <el-table-column prop="submitTime" label="提交时间" width="160" />
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === '已批改' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="emit('grade-homework', row)" :disabled="row.status === '已批改'">批改</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <template v-else-if="currentTodo?.id === 2">
        <h4>待回复学生提问</h4>
        <div v-for="q in studentQuestions" :key="q.id" class="question-reply-item">
          <div class="question-info">
            <strong>{{ q.studentName }}</strong> - {{ q.courseName }}
            <p>{{ q.content }}</p>
          </div>
          <el-input v-model="q.reply" type="textarea" :rows="2" placeholder="输入回复..." />
          <el-button type="primary" size="small" class="mt-2" @click="emit('reply-question', q)">回复</el-button>
        </div>
      </template>
      <template v-else>
        <p><strong>截止时间：</strong>{{ currentTodo?.deadline }}</p>
        <p><strong>优先级：</strong>{{ currentTodo?.priority === 'high' ? '高' : currentTodo?.priority === 'medium' ? '中' : '低' }}</p>
        <el-button type="primary" @click="emit('complete-todo')">标记完成</el-button>
      </template>
    </div>
  </el-dialog>

  <!-- 批改作业弹窗 -->
  <el-dialog v-model="showGradeDialog" title="批改作业" width="600px">
    <div v-if="currentGradeHomework">
      <p><strong>学生：</strong>{{ currentGradeHomework.studentName }}</p>
      <p><strong>提交时间：</strong>{{ currentGradeHomework.submitTime }}</p>
      <div class="homework-content-box">
        <p><strong>作业内容：</strong></p>
        <div class="content-preview">{{ currentGradeHomework.content || '学生提交的作业内容...' }}</div>
      </div>
      <el-form label-width="80px" class="mt-4">
        <el-form-item label="评分">
          <el-input-number v-model="gradeForm.score" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="评语">
          <el-input v-model="gradeForm.comment" type="textarea" :rows="3" placeholder="请输入评语" />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="showGradeDialog = false">取消</el-button>
      <el-button type="primary" @click="emit('submit-grade')">提交评分</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { List, Clock, SuccessFilled } from '@element-plus/icons-vue'

defineOptions({ name: 'TeacherTodoCard' })

defineProps({
  todoList: { type: Array, default: () => [] },
  pendingTodos: { type: Number, default: 0 },
  currentTodo: { type: Object, default: null },
  homeworkList: { type: Array, default: () => [] },
  studentQuestions: { type: Array, default: () => [] },
  currentGradeHomework: { type: Object, default: null }
})

const showTodoDialog = defineModel('showTodoDialog', { type: Boolean, default: false })
const showGradeDialog = defineModel('showGradeDialog', { type: Boolean, default: false })
const gradeForm = defineModel('gradeForm', { type: Object, default: () => ({ score: 85, comment: '' }) })

const emit = defineEmits(['handle-todo', 'complete-todo', 'reply-question', 'grade-homework', 'submit-grade'])
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

.header-icon.orange { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }

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

/* 待办事项 */
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #f9fafb;
  border-radius: 12px;
  transition: all 0.3s;
}

.todo-item:hover {
  background: #f3f4f6;
}

.todo-item.is-urgent {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%);
}

.todo-priority {
  width: 4px;
  height: 32px;
  border-radius: 2px;
}

.todo-priority.high { background: #ef4444; }
.todo-priority.medium { background: #f59e0b; }
.todo-priority.low { background: #10b981; }

.todo-content {
  flex: 1;
}

.todo-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9ca3af;
}

/* 修复按钮样式 - 白底蓝字 */
.todo-item .el-button {
  background: #fff !important;
  color: #409eff !important;
  border: 1px solid #409eff !important;
}

.todo-item .el-button:hover {
  background: #ecf5ff !important;
  color: #409eff !important;
}

/* 空状态 */
.empty-todo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px;
  color: #9ca3af;
  font-size: 13px;
}
</style>