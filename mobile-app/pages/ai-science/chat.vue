<template>
  <view class="chat-container">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">💬 AI对话</text>
      <text class="nav-action" @click="clearChat">清空</text>
    </view>

    <!-- 科普提示 -->
    <view class="science-tip" v-if="showTip">
      <text class="tip-icon">💡</text>
      <text class="tip-text">这是DeepSeek AI，它通过学习海量文字来理解和生成语言</text>
      <text class="tip-close" @click="showTip = false">×</text>
    </view>

    <!-- 聊天消息列表 -->
    <scroll-view class="chat-list" scroll-y :scroll-top="scrollTop" scroll-with-animation>
      <view class="welcome-msg" v-if="messages.length === 0">
        <text class="welcome-icon">🤖</text>
        <text class="welcome-title">你好！我是AI科普助手</text>
        <text class="welcome-desc">我可以回答关于AI的问题，也可以陪你聊天、写诗、讲故事</text>
        <view class="quick-questions">
          <text class="quick-title">试试问我：</text>
          <view class="quick-btn" @click="sendQuickQuestion('什么是人工智能？')">什么是人工智能？</view>
          <view class="quick-btn" @click="sendQuickQuestion('AI是怎么学习的？')">AI是怎么学习的？</view>
          <view class="quick-btn" @click="sendQuickQuestion('ChatGPT是什么？')">ChatGPT是什么？</view>
        </view>
      </view>

      <view v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
        <view class="avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</view>
        <view class="bubble">
          <text class="bubble-text">{{ msg.content }}</text>
        </view>
      </view>

      <view class="typing" v-if="isLoading">
        <view class="avatar">🤖</view>
        <view class="bubble">
          <text class="typing-dots">AI正在思考...</text>
        </view>
      </view>
    </scroll-view>

    <!-- 输入区域 -->
    <view class="input-area">
      <input 
        class="input-box" 
        v-model="inputText" 
        placeholder="输入你的问题..."
        @confirm="sendMessage"
        :disabled="isLoading"
      />
      <view class="send-btn" @click="sendMessage" :class="{ disabled: isLoading || !inputText.trim() }">
        发送
      </view>
    </view>
  </view>
</template>

<script>
import { apiRequest } from '@/utils/api.js'

export default {
  data() {
    return {
      messages: [],
      inputText: '',
      isLoading: false,
      scrollTop: 0,
      showTip: true
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    clearChat() {
      this.messages = []
    },
    sendQuickQuestion(question) {
      this.inputText = question
      this.sendMessage()
    },
    async sendMessage() {
      if (!this.inputText.trim() || this.isLoading) return

      const userMessage = this.inputText.trim()
      this.inputText = ''
      
      // 添加用户消息
      this.messages.push({
        role: 'user',
        content: userMessage
      })
      
      this.scrollToBottom()
      this.isLoading = true

      try {
        const history = this.messages.slice(-10).map(m => ({
          role: m.role,
          content: m.content
        }))

        const res = await apiRequest('/ai-science/chat', 'POST', {
          message: userMessage,
          history: history.slice(0, -1)
        })

        if (res.success && res.data) {
          this.messages.push({
            role: 'assistant',
            content: res.data.reply
          })
        } else {
          this.messages.push({
            role: 'assistant',
            content: '抱歉，我暂时无法回答，请稍后再试。'
          })
        }
      } catch (error) {
        console.error('发送消息失败:', error)
        this.messages.push({
          role: 'assistant',
          content: '网络错误，请检查网络连接后重试。'
        })
      } finally {
        this.isLoading = false
        this.scrollToBottom()
      }
    },
    scrollToBottom() {
      this.$nextTick(() => {
        this.scrollTop = 99999
      })
    }
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-top: calc(20rpx + env(safe-area-inset-top));
}

.nav-back {
  font-size: 40rpx;
  color: #fff;
  padding: 10rpx 20rpx;
}

.nav-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.nav-action {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  padding: 10rpx 20rpx;
}

.science-tip {
  display: flex;
  align-items: center;
  background: #e8f4fd;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #d0e8f7;
}

.tip-icon {
  font-size: 32rpx;
  margin-right: 15rpx;
}

.tip-text {
  flex: 1;
  font-size: 24rpx;
  color: #1976d2;
}

.tip-close {
  font-size: 32rpx;
  color: #999;
  padding: 10rpx;
}

.chat-list {
  flex: 1;
  padding: 20rpx;
}

.welcome-msg {
  text-align: center;
  padding: 60rpx 40rpx;
}

.welcome-icon {
  font-size: 100rpx;
  display: block;
}

.welcome-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-top: 20rpx;
}

.welcome-desc {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-top: 15rpx;
}

.quick-questions {
  margin-top: 40rpx;
}

.quick-title {
  font-size: 26rpx;
  color: #999;
  display: block;
  margin-bottom: 20rpx;
}

.quick-btn {
  display: inline-block;
  background: #667eea;
  color: #fff;
  padding: 15rpx 30rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  margin: 10rpx;
}

.message {
  display: flex;
  margin-bottom: 30rpx;
}

.message.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 70rpx;
  height: 70rpx;
  font-size: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.bubble {
  max-width: 70%;
  margin: 0 20rpx;
  padding: 25rpx 30rpx;
  border-radius: 20rpx;
  background: #fff;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.message.user .bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.bubble-text {
  font-size: 30rpx;
  line-height: 1.6;
  color: #333;
  word-break: break-all;
}

.message.user .bubble-text {
  color: #fff;
}

.typing .bubble {
  background: #fff;
}

.typing-dots {
  font-size: 28rpx;
  color: #999;
}

.input-area {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #fff;
  border-top: 1rpx solid #eee;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.input-box {
  flex: 1;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 40rpx;
  padding: 0 30rpx;
  font-size: 30rpx;
}

.send-btn {
  margin-left: 20rpx;
  padding: 20rpx 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.send-btn.disabled {
  opacity: 0.5;
}
</style>
