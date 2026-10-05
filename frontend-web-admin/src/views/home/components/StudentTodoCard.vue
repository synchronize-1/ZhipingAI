<template>
  <!-- 待办事项卡片 -->
  <div class="content-card todo-section">
    <div class="card-header">
      <div class="header-left">
        <div class="header-icon orange">
          <el-icon><List /></el-icon>
        </div>
        <div>
          <h3>待办事项</h3>
          <p>{{ pendingTasks }}项待完成</p>
        </div>
      </div>
      <el-button type="default" round size="small" @click="showAddTodo = true">
        <el-icon><Plus /></el-icon>
        添加
      </el-button>
    </div>
    <div class="todo-list">
      <div
        v-for="todo in todoList"
        :key="todo.id"
        class="todo-item"
        :class="{ 'is-urgent': todo.isUrgent, 'is-done': todo.isDone }"
      >
        <el-checkbox v-model="todo.isDone" @change="$emit('toggle', todo)" />
        <div class="todo-content">
          <span class="todo-title">{{ todo.title }}</span>
          <span class="todo-deadline">
            <el-icon><Clock /></el-icon>
            {{ todo.deadline }}
          </span>
        </div>
        <el-tag :type="todo.tagType" size="small">{{ todo.tag }}</el-tag>
        <el-button
          v-if="todo.isDone"
          type="danger"
          size="small"
          text
          @click="$emit('delete', todo.id)"
        >
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>
  </div>

  <!-- 添加待办事项对话框 -->
  <el-dialog
    v-model="showAddTodo"
    title="添加待办事项"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form :model="todoForm" label-width="80px">
      <el-form-item label="标题" required>
        <el-input
          v-model="todoForm.title"
          placeholder="请输入待办事项标题"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="截止时间" required>
        <el-input
          v-model="todoForm.deadline"
          placeholder="例如：明天 18:00、本周五"
        />
      </el-form-item>
      <el-form-item label="标签" required>
        <el-select v-model="todoForm.tag" placeholder="请选择标签">
          <el-option label="作业" value="作业" />
          <el-option label="实验" value="实验" />
          <el-option label="提醒" value="提醒" />
          <el-option label="活动" value="活动" />
          <el-option label="学习" value="学习" />
          <el-option label="其他" value="其他" />
        </el-select>
      </el-form-item>
      <el-form-item label="优先级">
        <el-radio-group v-model="todoForm.isUrgent">
          <el-radio :label="false">普通</el-radio>
          <el-radio :label="true">紧急</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showAddTodo = false">取消</el-button>
        <el-button type="primary" @click="$emit('add')">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { List, Plus, Clock, Delete } from '@element-plus/icons-vue'

defineOptions({ name: 'StudentTodoCard' })

defineProps({
  todoList: { type: Array, default: () => [] },
  pendingTasks: { type: Number, default: 0 },
  todoForm: { type: Object, default: () => ({}) }
})

const showAddTodo = defineModel('showAddTodo', { type: Boolean, default: false })

defineEmits(['toggle', 'delete', 'add'])
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
  transform: translateX(4px);
}

.todo-item.is-urgent {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%);
  border-left: 3px solid #ef4444;
}

.todo-item.is-done {
  opacity: 0.5;
}

.todo-item.is-done .todo-title {
  text-decoration: line-through;
}

.todo-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.todo-title {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
}

.todo-deadline {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9ca3af;
}
</style>