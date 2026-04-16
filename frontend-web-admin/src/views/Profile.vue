<template>
  <div class="profile-container">
    <div class="profile-header">
      <h2 class="page-title">个人设置</h2>
      <p class="page-subtitle">管理您的个人信息和偏好设置</p>
    </div>

    <div class="profile-content">
      <!-- 左侧：头像和基本信息 -->
      <div class="profile-card avatar-section">
        <div class="section-header">
          <h3>个人头像</h3>
          <p>支持 JPG、PNG 格式，文件大小不超过 2MB</p>
        </div>

        <div class="avatar-upload-area">
          <div class="current-avatar">
            <el-avatar :size="120" :src="avatarUrl" :key="avatarKey">
              {{ userInfo.name?.charAt(0) }}
            </el-avatar>
            <div class="avatar-overlay" @click="triggerUpload">
              <el-icon :size="24"><Camera /></el-icon>
              <span>更换头像</span>
            </div>
          </div>

          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            style="display: none"
            @change="handleFileChange"
          />

          <div class="avatar-actions">
            <el-button type="primary" @click="triggerUpload">
              <el-icon><Upload /></el-icon>
              选择图片
            </el-button>
            <el-button v-if="userInfo.avatar" @click="removeAvatar">
              <el-icon><Delete /></el-icon>
              移除头像
            </el-button>
          </div>

          <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
            <el-progress :percentage="uploadProgress" :stroke-width="8" />
          </div>
        </div>
      </div>

      <!-- 右侧：个人信息表单 -->
      <div class="profile-card info-section">
        <div class="section-header">
          <h3>基本信息</h3>
        </div>

        <el-form :model="userInfo" label-width="100px" class="profile-form">
          <el-form-item label="用户名">
            <el-input v-model="userInfo.username" disabled />
          </el-form-item>

          <el-form-item label="姓名">
            <el-input v-model="userInfo.name" placeholder="请输入姓名" />
          </el-form-item>

          <el-form-item label="角色">
            <el-tag :type="roleTagType">{{ roleText }}</el-tag>
          </el-form-item>

          <el-form-item label="邮箱">
            <el-input v-model="userInfo.email" placeholder="请输入邮箱" />
          </el-form-item>

          <el-form-item label="手机号">
            <el-input v-model="userInfo.phone" placeholder="请输入手机号" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="saveProfile">
              <el-icon><Check /></el-icon>
              保存修改
            </el-button>
            <el-button @click="resetForm">
              <el-icon><RefreshLeft /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 密码修改 -->
      <div class="profile-card password-section">
        <div class="section-header">
          <h3>修改密码</h3>
          <p>为了账户安全，建议定期更换密码</p>
        </div>

        <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px" class="profile-form">
          <el-form-item label="当前密码" prop="oldPassword">
            <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入当前密码" />
          </el-form-item>

          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="changePassword">
              <el-icon><Lock /></el-icon>
              修改密码
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 偏好设置 -->
      <div class="profile-card preferences-section">
        <div class="section-header">
          <h3>偏好设置</h3>
        </div>

        <div class="preference-items">
          <div class="preference-item">
            <div class="preference-info">
              <el-icon><Bell /></el-icon>
              <div>
                <h4>通知提醒</h4>
                <p>接收系统通知和重要消息</p>
              </div>
            </div>
            <el-switch v-model="preferences.notifications" />
          </div>

          <div class="preference-item">
            <div class="preference-info">
              <el-icon><Message /></el-icon>
              <div>
                <h4>邮件通知</h4>
                <p>通过邮件接收重要通知</p>
              </div>
            </div>
            <el-switch v-model="preferences.emailNotifications" />
          </div>

          <div class="preference-item">
            <div class="preference-info">
              <el-icon><Moon /></el-icon>
              <div>
                <h4>深色模式</h4>
                <p>切换到深色主题</p>
              </div>
            </div>
            <el-switch v-model="preferences.darkMode" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { Camera, Upload, Delete, Check, RefreshLeft, Lock, Bell, Message, Moon } from '@element-plus/icons-vue'
import api from '@/api'

const userStore = useUserStore()
const fileInput = ref(null)
const passwordFormRef = ref(null)
const uploadProgress = ref(0)
const avatarKey = ref(0)

const userInfo = ref({
  username: '',
  name: '',
  role: '',
  email: '',
  phone: '',
  avatar: ''
})

const originalUserInfo = ref({})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const preferences = ref({
  notifications: true,
  emailNotifications: false,
  darkMode: localStorage.getItem('darkMode') === 'true'
})

// 监听深色模式切换
watch(() => preferences.value.darkMode, (isDark) => {
  localStorage.setItem('darkMode', isDark)
  if (isDark) {
    document.documentElement.classList.add('dark')
    document.body.style.backgroundColor = '#1a1a2e'
    document.body.style.color = '#e0e0e0'
    ElMessage.success('已切换到深色模式')
  } else {
    document.documentElement.classList.remove('dark')
    document.body.style.backgroundColor = ''
    document.body.style.color = ''
    ElMessage.success('已切换到浅色模式')
  }
})

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const roleText = computed(() => {
  const roles = { student: '学生', teacher: '教师', admin: '管理员' }
  return roles[userInfo.value.role] || '用户'
})

const roleTagType = computed(() => {
  const types = { student: 'success', teacher: 'warning', admin: 'danger' }
  return types[userInfo.value.role] || 'info'
})

const avatarUrl = computed(() => {
  if (!userInfo.value.avatar) return ''
  // 如果已经是完整URL，直接返回
  if (userInfo.value.avatar.startsWith('http')) {
    return userInfo.value.avatar
  }
  // 否则拼接后端地址
  return `http://localhost:3000${userInfo.value.avatar}`
})

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (!validTypes.includes(file.type)) {
    ElMessage.error('只支持 JPG、PNG 格式的图片')
    return
  }

  // 验证文件大小（2MB）
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 2MB')
    return
  }

  try {
    uploadProgress.value = 0

    // 创建 FormData
    const formData = new FormData()
    formData.append('avatar', file)

    // 模拟上传进度
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 100)

    // 上传头像
    const response = await api.user.uploadAvatar(userStore.user.id, formData)
    
    clearInterval(progressInterval)
    uploadProgress.value = 100

    if (response.success) {
      userInfo.value.avatar = response.data.avatar
      // 使用 updateUser 方法更新 store，确保持久化到 localStorage
      userStore.updateUser({ avatar: response.data.avatar })
      // 强制刷新头像显示
      avatarKey.value++
      ElMessage.success('头像上传成功')
      
      setTimeout(() => {
        uploadProgress.value = 0
      }, 1000)
    }
  } catch (error) {
    uploadProgress.value = 0
    ElMessage.error('头像上传失败：' + (error.response?.data?.message || error.message || '未知错误'))
  }

  // 清空 input
  event.target.value = ''
}

const removeAvatar = async () => {
  try {
    const response = await api.user.removeAvatar(userStore.user.id)
    if (response.success) {
      userInfo.value.avatar = ''
      // 使用 updateUser 方法更新 store
      userStore.updateUser({ avatar: '' })
      // 强制刷新头像显示
      avatarKey.value++
      ElMessage.success('头像已移除')
    }
  } catch (error) {
    ElMessage.error('移除头像失败')
  }
}

const saveProfile = async () => {
  try {
    const response = await api.user.updateProfile(userStore.user.id, {
      name: userInfo.value.name,
      email: userInfo.value.email,
      phone: userInfo.value.phone
    })

    if (response.success) {
      Object.assign(originalUserInfo.value, userInfo.value)
      // 使用 updateUser 方法更新 store
      userStore.updateUser({ 
        name: userInfo.value.name,
        email: userInfo.value.email,
        phone: userInfo.value.phone
      })
      ElMessage.success('个人信息保存成功')
    }
  } catch (error) {
    ElMessage.error('保存失败：' + (error.message || '未知错误'))
  }
}

const resetForm = () => {
  Object.assign(userInfo.value, originalUserInfo.value)
  ElMessage.info('已重置为原始信息')
}

const changePassword = async () => {
  try {
    await passwordFormRef.value?.validate()

    const response = await api.auth.changePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })

    if (response.success) {
      ElMessage.success('密码修改成功，请重新登录')
      passwordForm.value = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
      
      // 3秒后自动登出
      setTimeout(() => {
        userStore.logout()
        window.location.href = '/login'
      }, 3000)
    }
  } catch (error) {
    if (error.errors) {
      // 表单验证错误
      return
    }
    ElMessage.error('密码修改失败：' + (error.message || '未知错误'))
  }
}

const loadUserInfo = () => {
  userInfo.value = {
    username: userStore.user?.username || '',
    name: userStore.user?.name || '',
    role: userStore.user?.role || '',
    email: userStore.user?.email || '',
    phone: userStore.user?.phone || '',
    avatar: userStore.user?.avatar || ''
  }
  originalUserInfo.value = { ...userInfo.value }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
}

.profile-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1D2129;
  margin-bottom: 8px;
  font-family: 'Inter', sans-serif;
}

.page-subtitle {
  font-size: 14px;
  color: #86909C;
}

.profile-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.profile-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(22, 93, 255, 0.08);
  border: 1px solid rgba(22, 93, 255, 0.1);
  transition: all 0.3s ease;
}

.profile-card:hover {
  box-shadow: 0 4px 20px rgba(22, 93, 255, 0.12);
  transform: translateY(-2px);
}

.section-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #F5F7FA;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1D2129;
  margin-bottom: 4px;
}

.section-header p {
  font-size: 13px;
  color: #86909C;
  margin: 0;
}

/* 头像上传区域 */
.avatar-section {
  grid-column: 1 / 2;
}

.avatar-upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.current-avatar {
  position: relative;
  cursor: pointer;
}

.current-avatar :deep(.el-avatar) {
  border: 4px solid #F5F7FA;
  box-shadow: 0 4px 16px rgba(22, 93, 255, 0.15);
  transition: all 0.3s ease;
  font-size: 48px;
  font-weight: 600;
  background: linear-gradient(135deg, #165DFF 0%, #36D399 100%);
}

.current-avatar:hover :deep(.el-avatar) {
  transform: scale(1.05);
  box-shadow: 0 6px 24px rgba(22, 93, 255, 0.25);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: white;
  font-size: 12px;
}

.current-avatar:hover .avatar-overlay {
  opacity: 1;
}

.avatar-actions {
  display: flex;
  gap: 12px;
}

.upload-progress {
  width: 100%;
  max-width: 300px;
}

/* 信息表单 */
.info-section {
  grid-column: 2 / 3;
}

.profile-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #4E5969;
}

.profile-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.profile-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(22, 93, 255, 0.2);
}

.profile-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #165DFF;
}

/* 密码修改 */
.password-section {
  grid-column: 1 / 3;
}

/* 偏好设置 */
.preferences-section {
  grid-column: 1 / 3;
}

.preference-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.preference-item:hover {
  background: rgba(22, 93, 255, 0.05);
}

.preference-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.preference-info .el-icon {
  font-size: 24px;
  color: #165DFF;
}

.preference-info h4 {
  font-size: 15px;
  font-weight: 600;
  color: #1D2129;
  margin: 0 0 4px 0;
}

.preference-info p {
  font-size: 13px;
  color: #86909C;
  margin: 0;
}

/* 响应式 */
@media (max-width: 1024px) {
  .profile-content {
    grid-template-columns: 1fr;
  }

  .avatar-section,
  .info-section,
  .password-section,
  .preferences-section {
    grid-column: 1 / 2;
  }
}
</style>
