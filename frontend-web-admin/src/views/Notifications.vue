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
          <!-- 管理员专属发布通知按钮 -->
          <el-button v-if="isAdmin" type="success" @click="showPublishDialog = true">
            <el-icon class="mr-1"><Promotion /></el-icon>
            发布通知
          </el-button>
          <el-button @click="markAllRead" :disabled="!unreadCount">全部已读</el-button>
          <el-button type="primary" @click="showSettingsDialog = true">提醒设置</el-button>
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
              <el-tag v-if="isAdmin && getNotificationSourceRole(notification)" :type="getRoleTagType(getNotificationSourceRole(notification))" size="small">
                {{ getRoleLabel(getNotificationSourceRole(notification)) }}
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
      <el-empty v-if="!notifications.length" description="暂无通知" class="py-10" />
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

    <!-- 课前提醒设置 -->
    <el-dialog v-model="showSettingsDialog" title="课前提醒设置" width="400px">
      <el-form :model="reminderSettings" label-width="100px">
        <el-form-item label="启用提醒">
          <el-switch v-model="reminderSettings.enabled" />
        </el-form-item>
        <el-form-item label="提前时间">
          <el-select v-model="reminderSettings.minutesBefore" class="w-full" :disabled="!reminderSettings.enabled">
            <el-option label="5分钟" :value="5" />
            <el-option label="10分钟" :value="10" />
            <el-option label="15分钟" :value="15" />
            <el-option label="30分钟" :value="30" />
          </el-select>
        </el-form-item>
        <el-form-item label="位置感知">
          <el-switch v-model="reminderSettings.locationEnabled" :disabled="!reminderSettings.enabled" />
          <p class="text-xs text-gray-500 mt-1">开启后，当接近上课时间且未到达教室时，将触发提醒</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSettingsDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { Bell, Reading, Flag, Tools, Warning, Delete, ShoppingCart, Promotion, UserFilled, User, Avatar, Setting } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useSocketStore } from '@/stores/socket'
import { useUserStore } from '@/stores/user'

defineOptions({ name: 'Notifications' })
import api from '@/api'
import dayjs from 'dayjs'

const socketStore = useSocketStore()
const userStore = useUserStore()

// 当前用户角色
const currentRole = computed(() => userStore.user?.role || 'student')
const isAdmin = computed(() => currentRole.value === 'admin')

// 管理员筛选器
const roleFilter = ref('all')

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

// 发布通知
const publishNotification = async () => {
  if (!publishFormRef.value) return
  
  await publishFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    publishing.value = true
    try {
      // 创建通知对象
      const notification = {
        type: publishForm.value.type,
        title: publishForm.value.title,
        content: publishForm.value.content,
        targetRole: publishForm.value.targetRole,
        time: new Date().toISOString()
      }
      
      // 添加到本地通知存储
      socketStore.addLocalNotification(notification)
      
      ElMessage.success({
        message: '通知发布成功！',
        duration: 2000
      })
      
      // 关闭对话框并重置表单
      showPublishDialog.value = false
      publishForm.value = {
        type: 'system',
        targetRole: 'all',
        title: '',
        content: ''
      }
      publishFormRef.value.resetFields()
      
      // 触发通知列表刷新
      refreshTrigger.value++
    } catch (error) {
      console.error('发布通知失败:', error)
      ElMessage.error('发布通知失败，请重试')
    } finally {
      publishing.value = false
    }
  })
}

// 已删除的通知ID集合（响应式）
const deletedNotificationIds = ref(new Set(JSON.parse(localStorage.getItem('deletedNotifications') || '[]')))

// 添加一个响应式的刷新触发器
const refreshTrigger = ref(0)

// 默认通知数据 - 只保留系统广播通知，个人通知由用户操作时动态创建
const defaultNotifications = [
  // 管理员端系统通知
  { id: 11, type: 'system', title: '系统升级通知', content: '智慧校园系统将于1月15日凌晨2:00-6:00进行升级维护，届时系统将暂停服务。', is_read: false, created_at: '2026-01-11 14:30:00', targetRole: 'admin' },
  { id: 12, type: 'emergency', title: '安全巡检报告', content: '本周校园安全巡检完成，发现3处安全隐患已记录，请安排处理。', is_read: false, created_at: '2026-01-11 08:00:00', targetRole: 'admin' },
  { id: 13, type: 'system', title: '服务器资源告警', content: '主数据库服务器CPU使用率超过80%，建议进行性能优化。', is_read: true, created_at: '2026-01-10 22:00:00', targetRole: 'admin' },
  { id: 14, type: 'system', title: '用户注册审核', content: '有5位新用户等待审核，请及时处理。', is_read: false, created_at: '2026-01-10 15:00:00', targetRole: 'admin' },
  
  // 全局通知（所有角色可见）
  { id: 15, type: 'system', title: '图书馆闭馆通知', content: '因寒假临近，图书馆将于1月20日起调整开放时间为9:00-17:00，请合理安排学习时间。', is_read: true, created_at: '2026-01-10 11:30:00', targetRole: 'all' },
  { id: 16, type: 'emergency', title: '天气预警', content: '气象台发布寒潮蓝色预警，明日最低气温-5℃，请注意添衣保暖，谨防感冒。', is_read: true, created_at: '2026-01-09 20:00:00', targetRole: 'all' },
  { id: 17, type: 'activity', title: '讲座签到提醒', content: '「人工智能前沿技术讲座」将于1月15日14:00开始，请提前15分钟到场签到。', is_read: true, created_at: '2026-01-09 15:30:00', targetRole: 'all' }
]

// 获取通知的来源角色（用于显示角色标签）
const getNotificationSourceRole = (notification) => {
  const targetRole = notification.targetRole || 'all'
  
  // 优先使用sourceUserRole
  if (notification.sourceUserRole) {
    return notification.sourceUserRole
  }
  
  // 如果有forAdmin标记，说明是学生/教师发给管理员的通知
  if (notification.forAdmin) {
    // 根据通知类型判断来源
    if (['activity', 'repair', 'book', 'equipment', 'order'].includes(notification.type)) {
      return 'student'
    } else {
      return 'teacher'
    }
  }
  
  // 没有sourceUserId且targetRole是admin的，是管理员发布的系统通知
  if (targetRole === 'admin' && !notification.sourceUserId) {
    return 'admin'
  }
  
  // 全局通知算作管理员发布的
  if (targetRole === 'all') {
    return 'admin'
  }
  
  // 其他情况根据targetRole判断
  return targetRole
}

// 根据角色过滤通知的函数
const filterByRole = (notification) => {
  const role = currentRole.value
  const targetRole = notification.targetRole || 'all'
  
  // 管理员可以看到所有通知
  if (role === 'admin') {
    // 先过滤掉学生/教师自己看的通知（targetRole为student/teacher但forAdmin为false或undefined）
    if (!notification.forAdmin && (targetRole === 'student' || targetRole === 'teacher')) {
      return false
    }
    
    // 如果设置了筛选器，按通知来源角色过滤
    if (roleFilter.value !== 'all') {
      // 获取通知来源角色：优先使用sourceUserRole，否则根据forAdmin判断
      let sourceRole = notification.sourceUserRole
      
      if (!sourceRole) {
        // 如果有forAdmin标记，说明是学生/教师发给管理员的通知
        if (notification.forAdmin) {
          // 根据通知类型判断来源
          // activity/repair/book/equipment 类型的forAdmin通知来自学生
          if (['activity', 'repair', 'book', 'equipment', 'order'].includes(notification.type)) {
            sourceRole = 'student'
          } else {
            sourceRole = 'teacher'
          }
        } else if (targetRole === 'admin' && !notification.sourceUserId) {
          // 没有sourceUserId且targetRole是admin的，是管理员发布的系统通知
          sourceRole = 'admin'
        } else if (targetRole === 'all') {
          // 全局通知算作管理员发布的
          sourceRole = 'admin'
        } else {
          // 其他情况根据targetRole判断
          sourceRole = targetRole
        }
      }
      
      return sourceRole === roleFilter.value
    }
    // 显示所有通知
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

// 合并本地通知和默认通知
const notifications = computed(() => {
  // 使用refreshTrigger来触发重新计算
  refreshTrigger.value
  
  // 获取本地存储的通知（管理员不传筛选参数，在视图层筛选）
  const filterParam = isAdmin.value ? null : null
  const localNotifications = socketStore.getLocalNotifications(filterParam).map(n => {
    let displayContent = n.content
    let displayTitle = n.title
    
    const currentUserId = userStore.user?.id || 'unknown'
    const currentRole = userStore.user?.role || 'student'
    
    // 管理员查看时，通知内容已经包含了角色标签（如"学生XXX"或"教师XXX"），无需修改
    // 学生/教师查看自己的通知时，保持原样（显示"您"）
    
    return {
      id: n.id,
      type: n.type,
      title: displayTitle,
      content: displayContent,
      is_read: n.read || false,
      created_at: n.time || new Date().toISOString(),
      targetRole: n.targetRole || 'student',
      sourceUserName: n.sourceUserName || '',
      sourceUserId: n.sourceUserId || '',
      forAdmin: n.forAdmin || false,
      sourceUserRole: n.sourceUserRole
    }
  })
  
  // 合并并按时间排序，过滤掉已删除的通知，并根据角色过滤
  const allNotifications = [...localNotifications, ...defaultNotifications]
    .filter(n => !deletedNotificationIds.value.has(n.id))
    .filter(filterByRole)
  allNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  
  return allNotifications
})

// 未读数量
const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.is_read).length
})

const showSettingsDialog = ref(false)
const reminderSettings = ref({ enabled: true, minutesBefore: 10, locationEnabled: true })

const formatTime = (time) => dayjs(time).format('MM-DD HH:mm')

// 扩展类型图标映射，支持更多服务通知类型
const getTypeIcon = (type) => ({ 
  system: 'Bell', 
  course: 'Reading', 
  activity: 'Flag', 
  service: 'Tools', 
  emergency: 'Warning',
  order: 'ShoppingCart',
  repair: 'Tools',
  equipment: 'Promotion',
  book: 'Reading'
}[type] || 'Bell')

// 扩展类型样式映射
const getTypeClass = (type) => ({
  system: 'bg-blue-100 text-blue-600',
  course: 'bg-green-100 text-green-600',
  activity: 'bg-purple-100 text-purple-600',
  service: 'bg-orange-100 text-orange-600',
  emergency: 'bg-red-100 text-red-600',
  order: 'bg-amber-100 text-amber-600',
  repair: 'bg-orange-100 text-orange-600',
  equipment: 'bg-indigo-100 text-indigo-600',
  book: 'bg-teal-100 text-teal-600'
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

const fetchNotifications = async () => {
  try {
    const res = await api.notifications.list({ limit: 50 })
    if (res.success && res.data.notifications && res.data.notifications.length > 0) {
      // 如果API返回数据，可以考虑合并，但这里暂时只用本地和默认数据
    }
  } catch (e) {
    console.log('使用本地和默认通知数据')
  }
}

const fetchSettings = async () => {
  try {
    const res = await api.notifications.reminderSettings()
    if (res.success) reminderSettings.value = res.data
  } catch (e) {}
}

const markRead = async (notification) => {
  if (notification.is_read) return
  // 标记本地通知为已读
  socketStore.markNotificationRead(notification.id)
  notification.is_read = true
  try {
    await api.notifications.markRead(notification.id)
  } catch (e) {
    // API 失败也已经标记本地通知
  }
}

const markAllRead = async () => {
  // 标记所有本地通知为已读
  const localNotifications = socketStore.getLocalNotifications()
  localNotifications.forEach(n => {
    socketStore.markNotificationRead(n.id)
  })
  
  try {
    await api.notifications.markAllRead()
  } catch (e) {}
  
  ElMessage.success('已全部标记为已读')
}

const deleteNotification = async (notification) => {
  // 添加到已删除集合
  deletedNotificationIds.value.add(notification.id)
  
  // 保存到localStorage
  const deletedArray = Array.from(deletedNotificationIds.value)
  localStorage.setItem('deletedNotifications', JSON.stringify(deletedArray))
  
  // 从本地通知存储中删除
  const stored = JSON.parse(localStorage.getItem('localNotifications') || '[]')
  const filteredStored = stored.filter(n => n.id !== notification.id)
  localStorage.setItem('localNotifications', JSON.stringify(filteredStored))
  
  try {
    await api.notifications.delete(notification.id)
  } catch (e) {
    console.log('API删除失败，但本地已删除')
  }
  
  ElMessage.success('已删除')
}

const saveSettings = async () => {
  try {
    await api.notifications.updateReminderSettings(reminderSettings.value)
    ElMessage.success('设置已保存')
    showSettingsDialog.value = false
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

// 监听localStorage变化，实现实时刷新
const handleStorageChange = (e) => {
  if (e.key === 'globalNotifications' || e.key === 'localNotifications') {
    refreshTrigger.value++
  }
}

// 监听自定义事件（同一页面内的通知更新）
const handleNotificationUpdate = () => {
  refreshTrigger.value++
}

// 定时器ID
let refreshInterval = null

onMounted(() => {
  fetchNotifications()
  fetchSettings()
  
  // 监听storage事件（跨标签页）
  window.addEventListener('storage', handleStorageChange)
  
  // 监听自定义事件（同一页面内）
  window.addEventListener('notificationUpdated', handleNotificationUpdate)
  
  // 定时刷新（每3秒检查一次）
  refreshInterval = setInterval(() => {
    refreshTrigger.value++
  }, 3000)
})

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
  window.removeEventListener('notificationUpdated', handleNotificationUpdate)
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
