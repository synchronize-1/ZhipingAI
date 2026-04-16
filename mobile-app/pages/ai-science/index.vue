<template>
  <view class="ai-science-container">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="title">🤖 AI科普乐园</text>
      <text class="subtitle">探索人工智能的奇妙世界</text>
    </view>

    <!-- 功能卡片 -->
    <view class="section">
      <text class="section-title">🎨 AI体验中心</text>
      <view class="card-grid">
        <view class="card" @click="navigateTo('/pages/ai-science/chat')">
          <text class="card-icon">💬</text>
          <text class="card-title">AI对话</text>
          <text class="card-desc">和AI聊天</text>
        </view>
        <view class="card" @click="navigateTo('/pages/ai-science/painting')">
          <text class="card-icon">🎨</text>
          <text class="card-title">AI绘画</text>
          <text class="card-desc">文字变图片</text>
        </view>
        <view class="card" @click="navigateTo('/pages/ai-science/writing')">
          <text class="card-icon">✍️</text>
          <text class="card-title">AI写作</text>
          <text class="card-desc">写诗写故事</text>
        </view>
        <view class="card" @click="navigateTo('/pages/ai-science/ocr')">
          <text class="card-icon">📷</text>
          <text class="card-title">文字识别</text>
          <text class="card-desc">图片转文字</text>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">🎮 AI游乐场</text>
      <view class="card-grid">
        <view class="card" @click="navigateTo('/pages/ai-science/turing-test')">
          <text class="card-icon">🤔</text>
          <text class="card-title">图灵测试</text>
          <text class="card-desc">分辨人与AI</text>
        </view>
        <view class="card" @click="navigateTo('/pages/ai-science/sentiment')">
          <text class="card-icon">😊</text>
          <text class="card-title">情感分析</text>
          <text class="card-desc">AI读懂情绪</text>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">📚 AI知识馆</text>
      <view class="card-grid">
        <view class="card" @click="navigateTo('/pages/ai-science/history')">
          <text class="card-icon">🏛️</text>
          <text class="card-title">AI历史</text>
          <text class="card-desc">发展时间线</text>
        </view>
        <view class="card" @click="navigateTo('/pages/ai-science/pioneers')">
          <text class="card-icon">👨‍🔬</text>
          <text class="card-title">AI名人堂</text>
          <text class="card-desc">了解先驱者</text>
        </view>
        <view class="card" @click="navigateTo('/pages/ai-science/principles')">
          <text class="card-icon">🔬</text>
          <text class="card-title">AI原理</text>
          <text class="card-desc">简单易懂</text>
        </view>
        <view class="card" @click="navigateTo('/pages/ai-science/applications')">
          <text class="card-icon">🎯</text>
          <text class="card-title">AI应用</text>
          <text class="card-desc">身边的AI</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {}
  },
  methods: {
    navigateTo(url) {
      uni.navigateTo({ url })
    }
  }
}
</script>

<style scoped>
.ai-science-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30rpx;
}

.header {
  text-align: center;
  padding: 40rpx 0;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  display: block;
}

.subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 10rpx;
  display: block;
}

.section {
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 20rpx;
  display: block;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  padding: 30rpx;
  text-align: center;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.card:active {
  transform: scale(0.95);
}

.card-icon {
  font-size: 60rpx;
  display: block;
  margin-bottom: 15rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.card-desc {
  font-size: 24rpx;
  color: #666;
  margin-top: 8rpx;
  display: block;
}
</style>
