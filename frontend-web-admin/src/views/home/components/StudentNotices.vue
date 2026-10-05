<template>
  <!-- 通知消息卡片 -->
  <div class="content-card notifications">
    <div class="card-header">
      <div class="header-left">
        <div class="header-icon red">
          <el-icon><Bell /></el-icon>
        </div>
        <div>
          <h3>通知消息</h3>
          <p>{{ unreadNotifications }}条未读</p>
        </div>
      </div>
      <el-button type="default" round size="small" @click="$router.push('/notifications')">
        全部
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
    </div>
    <div class="notification-list">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-item"
        :class="{ 'is-unread': !notification.isRead }"
      >
        <div class="notification-icon" :class="notification.type">
          <el-icon v-if="notification.type === 'course'"><Reading /></el-icon>
          <el-icon v-else-if="notification.type === 'homework'"><Document /></el-icon>
          <el-icon v-else-if="notification.type === 'activity'"><Flag /></el-icon>
          <el-icon v-else><Bell /></el-icon>
        </div>
        <div class="notification-content">
          <p class="notification-title">{{ notification.title }}</p>
          <span class="notification-time">{{ notification.time }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Bell, ArrowRight, Reading, Document, Flag } from '@element-plus/icons-vue'

defineOptions({ name: 'StudentNotices' })

defineProps({
  notifications: { type: Array, default: () => [] },
  unreadNotifications: { type: Number, default: 0 }
})
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

.header-icon.red { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%); }

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

/* 通知消息 */
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.3s;
  cursor: pointer;
}

.notification-item:hover {
  background: #f9fafb;
}

.notification-item.is-unread {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.06) 0%, rgba(118, 75, 162, 0.06) 100%);
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.notification-icon.course { background: #dbeafe; color: #3b82f6; }
.notification-icon.homework { background: #fee2e2; color: #ef4444; }
.notification-icon.activity { background: #d1fae5; color: #10b981; }
.notification-icon.system { background: #f3f4f6; color: #6b7280; }

.notification-content {
  flex: 1;
}

.notification-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
}

.notification-time {
  font-size: 12px;
  color: #9ca3af;
}
</style>