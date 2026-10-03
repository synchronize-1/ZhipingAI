<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 via-cyan-500 to-emerald-500 relative overflow-hidden">
    <!-- 动态花朵背景 - 下落效果 -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div v-for="i in 20" :key="i" class="flower"
           :style="{
             left: Math.random() * 100 + '%',
             animationDelay: Math.random() * 15 + 's',
             animationDuration: 8 + Math.random() * 6 + 's',
             transform: `rotate(${Math.random() * 360}deg)`,
             width: 18 + Math.random() * 14 + 'px',
             height: 18 + Math.random() * 14 + 'px'
           }">
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-full h-full">
          <!-- 五瓣花朵形状 -->
          <path d="M12,2 C12,2 8.5,7 8.5,10 C8.5,11.5 9.5,13 12,13 C14.5,13 15.5,11.5 15.5,10 C15.5,7 12,2 12,2Z" />
          <path d="M12,2 C12,2 15.5,7 15.5,10 C15.5,11.5 14.5,13 12,13 C9.5,13 8.5,11.5 8.5,10 C8.5,7 12,2 12,2Z" />
          <path d="M12,2 C12,2 19,9 19,12 C19,14 17,15.5 12,15.5 C7,15.5 5,14 5,12 C5,9 12,2 12,2Z" />
          <path d="M12,22 C12,22 8.5,17 8.5,14 C8.5,12.5 9.5,11 12,11 C14.5,11 15.5,12.5 15.5,14 C15.5,17 12,22 12,22Z" />
          <path d="M12,22 C12,22 15.5,17 15.5,14 C15.5,12.5 14.5,11 12,11 C9.5,11 8.5,12.5 8.5,14 C8.5,17 12,22 12,22Z" />
          <path d="M12,22 C12,22 5,15 5,12 C5,10 7,8.5 12,8.5 C17,8.5 19,10 19,12 C19,15 12,22 12,22Z" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" />
        </svg>
      </div>
    </div>

    <!-- 登录卡片 -->
    <div class="relative z-10 w-full max-w-md mx-4">
      <div class="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/40">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <el-icon :size="40" class="text-white"><School /></el-icon>
          </div>
          <h1 class="text-3xl font-bold text-gray-800 mb-2">AI健康使用评估平台</h1>
          <p class="text-teal-700">Smart AI Use</p>
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
            <el-checkbox v-model="rememberMe" class="text-gray-600">记住我</el-checkbox>
            <a href="#" class="text-teal-600 hover:text-teal-700">忘记密码？</a>
          </div>

          <el-button
              type="primary"
              size="large"
              class="w-full h-12 text-lg font-medium bg-gradient-to-r from-teal-500 to-emerald-500 border-0 hover:shadow-lg hover:shadow-teal-500/30"
              :loading="loading"
              @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form>

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
        console.log('登录成功，用户信息:', userStore.user);
        ElMessage.success('登录成功，欢迎回来！')
        router.push('/')
      } else {
        console.error('登录失败:', result.message); // 添加调试信息
        ElMessage.error(result.message || '登录失败')
      }
    } catch (error) {
      console.error('登录异常:', error); // 添加调试信息
      ElMessage.error('登录失败，请稍后重试')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
/* 花朵下落动画 */
.flower {
  position: absolute;
  color: rgba(255, 255, 255, 0.7);
  opacity: 0;
  animation: fall linear infinite;
  pointer-events: none;
  top: -10%;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

@keyframes fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 0.8;
  }
  10% {
    opacity: 1;
  }
  85% {
    opacity: 0.9;
  }
  95% {
    opacity: 0.5;
  }
  100% {
    transform: translateY(110vh) rotate(720deg);
    opacity: 0;
  }
}

/* 输入框样式 */
:deep(.custom-input .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(20, 184, 166, 0.2);
  border-radius: 12px;
  box-shadow: none;
  transition: all 0.3s ease;
}

:deep(.custom-input .el-input__wrapper:hover) {
  border-color: #14b8a6;
  background: white;
}

:deep(.custom-input .el-input__wrapper.is-focus) {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
  background: white;
}

:deep(.custom-input .el-input__inner) {
  color: #1e293b;
}

:deep(.custom-input .el-input__inner::placeholder) {
  color: #94a3b8;
}

:deep(.custom-input .el-input__prefix) {
  color: #14b8a6;
}

/* 复选框样式 */
:deep(.el-checkbox__label) {
  color: #475569;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #14b8a6;
  border-color: #14b8a6;
}

:deep(.el-checkbox__inner:hover) {
  border-color: #10b981;
}

/* 卡片悬浮效果 */
.bg-white\/70 {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.bg-white\/70:hover {
  transform: translateY(-4px);
  box-shadow: 0 25px 40px -12px rgba(20, 184, 166, 0.25);
}
</style>