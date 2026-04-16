<template>
  <view class="login-page">
    <view class="bg-decoration"></view>
    
    <view class="login-content">
      <view class="logo-section">
        <view class="logo-icon">
          <text class="iconfont">🎓</text>
        </view>
        <text class="app-title">智界·灵动校园</text>
        <text class="app-subtitle">Smart Campus</text>
      </view>

      <view class="form-section">
        <view class="input-group">
          <text class="input-icon">👤</text>
          <input v-model="form.username" placeholder="请输入用户名" class="input-field" />
        </view>
        
        <view class="input-group">
          <text class="input-icon">🔒</text>
          <input v-model="form.password" type="password" placeholder="请输入密码" class="input-field" />
        </view>

        <view class="btn-login" :class="{ loading }" @tap="handleLogin">
          <text>{{ loading ? '登录中...' : '登 录' }}</text>
        </view>

        <view class="test-account">
          <text class="hint-title">测试账号</text>
          <text class="hint-text">学生: student1 / student123</text>
          <text class="hint-text">教师: teacher1 / teacher123</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  data() {
    return {
      form: { username: '', password: '' },
      loading: false
    }
  },
  methods: {
    async handleLogin() {
      if (!this.form.username || !this.form.password) {
        uni.showToast({ title: '请填写完整信息', icon: 'none' })
        return
      }
      
      this.loading = true
      try {
        const res = await api.auth.login(this.form)
        if (res.success) {
          uni.setStorageSync('token', res.data.token)
          // 修改用户名为原神大王
          const userData = { ...res.data.user, name: '原神大王' }
          uni.setStorageSync('user', userData)
          uni.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            uni.reLaunch({ url: '/pages/index/index' })
          }, 1000)
        } else {
          uni.showToast({ title: res.message || '登录失败', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '登录失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #c9956c 0%, #a67c52 100%);
  position: relative;
  overflow: hidden;
}

.bg-decoration {
  position: absolute;
  top: -200rpx;
  right: -200rpx;
  width: 600rpx;
  height: 600rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.login-content {
  position: relative;
  z-index: 1;
  padding: 120rpx 60rpx;
}

.logo-section {
  text-align: center;
  margin-bottom: 80rpx;
}

.logo-icon {
  width: 160rpx;
  height: 160rpx;
  margin: 0 auto 30rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80rpx;
}

.app-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 10rpx;
}

.app-subtitle {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
}

.form-section {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 30rpx;
  padding: 50rpx 40rpx;
  backdrop-filter: blur(10px);
}

.input-group {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50rpx;
  padding: 0 30rpx;
  margin-bottom: 30rpx;
}

.input-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.input-field {
  flex: 1;
  height: 100rpx;
  color: #ffffff;
  font-size: 30rpx;
}

.input-field::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.btn-login {
  background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%);
  color: #ffffff;
  text-align: center;
  padding: 30rpx;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin-top: 40rpx;
}

.btn-login.loading {
  opacity: 0.7;
}

.test-account {
  margin-top: 40rpx;
  padding: 30rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20rpx;
}

.hint-title {
  display: block;
  color: rgba(255, 255, 255, 0.8);
  font-size: 26rpx;
  margin-bottom: 15rpx;
}

.hint-text {
  display: block;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24rpx;
  margin-top: 8rpx;
}
</style>
