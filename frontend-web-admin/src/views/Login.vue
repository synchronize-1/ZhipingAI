<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden">
    <!-- 背景动画 -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="relative z-10 w-full max-w-md mx-4">
      <div class="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <el-icon :size="40" class="text-white"><School /></el-icon>
          </div>
          <h1 class="text-3xl font-bold text-white mb-2">智界·灵动校园</h1>
          <p class="text-gray-300">Smart Campus Management System</p>
        </div>

        <!-- 登录表单 -->
        <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
          <el-form-item prop="username">
            <el-input 
              v-model="form.username" 
              placeholder="请输入用户名"
              prefix-icon="User"
              size="large"
              class="custom-input"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input 
              v-model="form.password" 
              type="password" 
              placeholder="请输入密码"
              prefix-icon="Lock"
              size="large"
              show-password
              class="custom-input"
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <div class="flex items-center justify-between mb-6 text-sm">
            <el-checkbox v-model="rememberMe" class="text-gray-300">记住我</el-checkbox>
            <a href="#" class="text-blue-400 hover:text-blue-300">忘记密码？</a>
          </div>

          <el-button 
            type="primary" 
            size="large" 
            class="w-full h-12 text-lg font-medium"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form>

        <!-- 测试账号提示 -->
        <div class="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <p class="text-gray-400 text-sm mb-2">测试账号：</p>
          <div class="space-y-1 text-xs text-gray-500">
            <p>管理员: admin / admin123</p>
            <p>教师: teacher001 / 123456</p>
            <p>学生: student001 / 123456</p>
          </div>
        </div>

        <!-- 底部 -->
        <p class="text-center text-gray-500 text-sm mt-6">
          © 2026 智界·灵动校园 All Rights Reserved
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { School } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const rememberMe = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      const result = await userStore.login(form.username, form.password)
      if (result.success) {
        ElMessage.success('登录成功，欢迎回来！')
        router.push('/')
      } else {
        ElMessage.error(result.message || '登录失败')
      }
    } catch (error) {
      ElMessage.error('登录失败，请稍后重试')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
:deep(.custom-input .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: none;
}

:deep(.custom-input .el-input__wrapper:hover) {
  border-color: rgba(255, 255, 255, 0.4);
}

:deep(.custom-input .el-input__wrapper.is-focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

:deep(.custom-input .el-input__inner) {
  color: white;
}

:deep(.custom-input .el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.5);
}

:deep(.custom-input .el-input__prefix) {
  color: rgba(255, 255, 255, 0.6);
}

:deep(.el-checkbox__label) {
  color: rgba(255, 255, 255, 0.7);
}
</style>
