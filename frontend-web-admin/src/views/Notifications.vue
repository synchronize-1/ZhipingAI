<!-- frontend-web-admin/src/views/Notifications.vue -->
<template>
  <div class="space-y-6">
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <el-badge :value="unreadCount" :hidden="!unreadCount">
            <span class="text-lg font-semibold">通知中心</span>
          </el-badge>
          <!-- 管理员专属筛选功能 -->
          <template v-if="isAdmin">
            <el-divider direction="vertical" />
            <el-radio-group v-model="roleFilter" size="small">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="student">学生通知</el-radio-button>
              <el-radio-button label="teacher">教师通知</el-radio-button>
              <el-radio-button label="admin">管理员通知</el-radio-button>
            </el-radio-group>
          </template>
        </div>
        <div class="flex gap-2">
          <el-button v-if="isAdmin" type="success" @click="showPublishDialog = true">
            <el-icon class="mr-1"><Promotion /></el-icon>
            发布通知
          </el-button>
          <el-button @click="markAllRead" :disabled="!unreadCount">全部已读</el-button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div v-for="notification in notifications" :key="notification.id"
           class="p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
           :class="{ 'bg-blue-50/50': !notification.is_read }"
           @click="markRead(notification)">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
               :class="getTypeClass(notification.type)">
            <el-icon :size="20"><component :is="getTypeIcon(notification.type)" /></el-icon>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h4 class="font-medium text-gray-800">{{ notification.title }}</h4>
              <el-tag v-if="!notification.is_read" type="danger" size="small">新</el-tag>
              <!-- 管理员可见的角色来源标签 -->
              <el-tag v-if="isAdmin && notification.target_role" :type="getRoleTagType(notification.target_role)" size="small">
                {{ getRoleLabel(notification.target_role) }}
              </el-tag>
            </div>
            <p class="text-sm text-gray-600 line-clamp-2">{{ notification.content }}</p>
            <p class="text-xs text-gray-400 mt-2">{{ formatTime(notification.created_at) }}</p>
          </div>
          <el-button type="danger" text size="small" @click.stop="deleteNotification(notification)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
      <el-empty v-if="!loading && notifications.length === 0" description="暂无通知" class="py-10" />
      <div v-if="loading" class="text-center py-10">
        <el-icon class="is-loading"><Loading /></el-icon> 加载中...
      </div>
    </div>

    <!-- 管理员发布通知对话框 -->
    <el-dialog
        v-model="showPublishDialog"
        title="📢 发布通知"
        width="600px"
        :close-on-click-modal="false"
        class="publish-notification-dialog">
      <el-form :model="publishForm" :rules="publishRules" ref="publishFormRef" label-width="100px" class="space-y-4">
        <el-form-item label="通知类型" prop="type">
          <el-select v-model="publishForm.type" placeholder="请选择通知类型" class="w-full">
            <el-option label="📢 系统通知" value="system">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <span class="text-xs">📢</span>
                </div>
                <span>系统通知</span>
              </div>
            </el-option>
            <el-option label="📚 学习通知" value="course">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <span class="text-xs">📚</span>
                </div>
                <span>学习通知</span>
              </div>
            </el-option>
            <el-option label="🎯 活动通知" value="activity">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                  <span class="text-xs">🎯</span>
                </div>
                <span>活动通知</span>
              </div>
            </el-option>
            <el-option label="⚠️ 紧急通知" value="emergency">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                  <span class="text-xs">⚠️</span>
                </div>
                <span>紧急通知</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="接收对象" prop="targetRole">
          <el-radio-group v-model="publishForm.targetRole" class="w-full">
            <el-radio label="all" class="w-full mb-2">
              <div class="flex items-center gap-2">
                <el-icon color="#409EFF"><UserFilled /></el-icon>
                <span class="font-medium">全体师生</span>
                <el-tag type="info" size="small">所有用户都能看到</el-tag>
              </div>
            </el-radio>
            <el-radio label="student" class="w-full mb-2">
              <div class="flex items-center gap-2">
                <el-icon color="#67C23A"><User /></el-icon>
                <span class="font-medium">全体学生</span>
                <el-tag type="success" size="small">仅学生可见</el-tag>
              </div>
            </el-radio>
            <el-radio label="teacher" class="w-full mb-2">
              <div class="flex items-center gap-2">
                <el-icon color="#E6A23C"><Avatar /></el-icon>
                <span class="font-medium">全体教师</span>
                <el-tag type="warning" size="small">仅教师可见</el-tag>
              </div>
            </el-radio>
            <el-radio label="admin" class="w-full">
              <div class="flex items-center gap-2">
                <el-icon color="#F56C6C"><Setting /></el-icon>
                <span class="font-medium">管理员</span>
                <el-tag type="danger" size="small">仅管理员可见</el-tag>
              </div>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="通知标题" prop="title">
          <el-input
              v-model="publishForm.title"
              placeholder="请输入通知标题（建议10-30字）"
              maxlength="50"
              show-word-limit
              clearable />
        </el-form-item>

        <el-form-item label="通知内容" prop="content">
          <el-input
              v-model="publishForm.content"
              type="textarea"
              :rows="6"
              placeholder="请输入通知内容，详细描述通知信息..."
              maxlength="500"
              show-word-limit
              clearable />
        </el-form-item>

        <el-alert
            title="温馨提示"
            type="info"
            :closable="false"
            class="mt-4">
          <template #default>
            <div class="text-sm space-y-1">
              <p>• 发布后，所选对象将立即收到通知</p>
              <p>• 紧急通知会以醒目方式展示</p>
              <p>• 请确保通知内容准确无误</p>
            </div>
          </template>
        </el-alert>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button @click="showPublishDialog = false" size="large">取消</el-button>
          <el-button type="primary" @click="publishNotification" size="large" :loading="publishing">
            <el-icon class="mr-1"><Promotion /></el-icon>
            立即发布
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Bell, Reading, Flag, Warning, Delete, Promotion, UserFilled, User, Avatar, Setting, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import api from '@/api'
import dayjs from 'dayjs'

defineOptions({ name: 'Notifications' })

const userStore = useUserStore()

// 当前用户角色
const currentRole = computed(() => userStore.user?.role || 'student')
const isAdmin = computed(() => currentRole.value === 'admin')

// 管理员筛选器
const roleFilter = ref('all')

// 通知数据
const loading = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 发布通知相关
const showPublishDialog = ref(false)
const publishing = ref(false)
const publishFormRef = ref(null)
const publishForm = ref({
  type: 'system',
  targetRole: 'all',
  title: '',
  content: ''
})

const publishRules = {
  type: [{ required: true, message: '请选择通知类型', trigger: 'change' }],
  targetRole: [{ required: true, message: '请选择接收对象', trigger: 'change' }],
  title: [
    { required: true, message: '请输入通知标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入通知内容', trigger: 'blur' },
    { min: 5, max: 500, message: '内容长度在 5 到 500 个字符', trigger: 'blur' }
  ]
}

// 格式化时间
const formatTime = (time) => dayjs(time).format('MM-DD HH:mm')

// 类型图标映射
const getTypeIcon = (type) => ({
  system: 'Bell',
  course: 'Reading',
  activity: 'Flag',
  emergency: 'Warning'
}[type] || 'Bell')

// 类型样式映射
const getTypeClass = (type) => ({
  system: 'bg-blue-100 text-blue-600',
  course: 'bg-green-100 text-green-600',
  activity: 'bg-purple-100 text-purple-600',
  emergency: 'bg-red-100 text-red-600'
}[type] || 'bg-gray-100 text-gray-600')

// 角色标签类型
const getRoleTagType = (role) => ({
  student: 'success',
  teacher: 'warning',
  admin: 'danger',
  all: 'info'
}[role] || 'info')

// 角色标签文本
const getRoleLabel = (role) => ({
  student: '学生',
  teacher: '教师',
  admin: '管理员',
  all: '全局'
}[role] || '未知')

// 根据角色过滤通知
const filterByRole = (notification) => {
  const role = currentRole.value
  const targetRole = notification.target_role || 'all'

  // 管理员可以看到所有通知
  if (role === 'admin') {
    if (roleFilter.value !== 'all') {
      return targetRole === roleFilter.value
    }
    return true
  }

  // 教师只能看到教师通知和全局通知
  if (role === 'teacher') {
    return targetRole === 'teacher' || targetRole === 'all'
  }

  // 学生只能看到学生通知和全局通知
  if (role === 'student') {
    return targetRole === 'student' || targetRole === 'all'
  }

  return targetRole === 'all'
}

// 获取通知列表
const fetchNotifications = async () => {
  loading.value = true
  try {
    const res = await api.notifications.list({
      page: currentPage.value,
      limit: pageSize.value
    })
    if (res.success) {
      let data = res.data.notifications || []
      // 前端过滤（用于角色筛选）
      notifications.value = data.filter(filterByRole)
      unreadCount.value = res.data.unreadCount || 0
      total.value = res.data.total || data.length
    }
  } catch (e) {
    console.error('获取通知列表失败:', e)
    ElMessage.error('获取通知列表失败')
  } finally {
    loading.value = false
  }
}

// 标记已读
const markRead = async (notification) => {
  if (notification.is_read) return

  try {
    await api.notifications.markRead(notification.id)
    notification.is_read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch (e) {
    console.error('标记已读失败:', e)
    ElMessage.error('操作失败')
  }
}

// 全部已读
const markAllRead = async () => {
  try {
    await api.notifications.markAllRead()
    notifications.value.forEach(n => { n.is_read = true })
    unreadCount.value = 0
    ElMessage.success('已全部标记为已读')
  } catch (e) {
    console.error('全部已读失败:', e)
    ElMessage.error('操作失败')
  }
}

// 删除通知
const deleteNotification = async (notification) => {
  try {
    await api.notifications.delete(notification.id)
    const index = notifications.value.findIndex(n => n.id === notification.id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
    if (!notification.is_read) {
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
    ElMessage.success('已删除')
  } catch (e) {
    console.error('删除通知失败:', e)
    ElMessage.error('删除失败')
  }
}

// 发布通知
const publishNotification = async () => {
  if (!publishFormRef.value) return

  await publishFormRef.value.validate(async (valid) => {
    if (!valid) return

    publishing.value = true
    try {
      await api.notifications.create({
        title: publishForm.value.title,
        content: publishForm.value.content,
        type: publishForm.value.type,
        targetRole: publishForm.value.targetRole
      })

      ElMessage.success('通知发布成功！')
      showPublishDialog.value = false
      publishForm.value = {
        type: 'system',
        targetRole: 'all',
        title: '',
        content: ''
      }
      publishFormRef.value.resetFields()

      // 刷新列表
      await fetchNotifications()
    } catch (error) {
      console.error('发布通知失败:', error)
      ElMessage.error('发布通知失败，请重试')
    } finally {
      publishing.value = false
    }
  })
}

// 监听筛选器变化
const handleFilterChange = () => {
  fetchNotifications()
}

// 定时刷新（可选）
let refreshInterval = null

onMounted(() => {
  fetchNotifications()
  // 每30秒自动刷新一次
  refreshInterval = setInterval(() => {
    fetchNotifications()
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

// 监听角色筛选变化
import { watch } from 'vue'
watch(roleFilter, () => {
  fetchNotifications()
})
</script>

<style scoped>
/* 确保按钮样式正确 */
.el-button--primary:not(.is-text):not(.is-link) {
  background: #409eff !important;
  color: white !important;
  border: 1px solid #409eff !important;
}

.el-button--primary:not(.is-text):not(.is-link):hover {
  background: #66b1ff !important;
  color: white !important;
}

.el-button--success:not(.is-text):not(.is-link) {
  background: #67c23a !important;
  color: white !important;
  border: 1px solid #67c23a !important;
}
</style>