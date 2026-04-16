<template>
  <view class="sentiment-container">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">😊 情感分析器</text>
    </view>

    <!-- 科普提示 -->
    <view class="science-tip">
      <text class="tip-icon">💡</text>
      <text class="tip-text">AI通过分析文字中的关键词、语气和上下文来判断情感</text>
    </view>

    <!-- 输入区域 -->
    <view class="input-section">
      <text class="section-title">输入一句话，看AI能否读懂你的情绪</text>
      <textarea 
        class="text-input" 
        v-model="inputText" 
        placeholder="例如：今天考试考砸了，心情很糟糕..."
        :maxlength="200"
      />
      <view class="quick-examples">
        <text class="quick-title">试试这些：</text>
        <view class="quick-tags">
          <text class="quick-tag" @click="setExample('今天收到了心仪大学的录取通知书！')">😄 开心</text>
          <text class="quick-tag" @click="setExample('我的小猫咪走丢了，找了一整天都没找到...')">😢 难过</text>
          <text class="quick-tag" @click="setExample('明明是我先排队的，凭什么让他插队！')">😠 生气</text>
          <text class="quick-tag" @click="setExample('今天天气不错，适合出去散步。')">😌 平静</text>
        </view>
      </view>
    </view>

    <!-- 分析按钮 -->
    <view class="analyze-btn" @click="analyzeSentiment" :class="{ disabled: isLoading || !inputText.trim() }">
      {{ isLoading ? '分析中...' : '🔍 分析情感' }}
    </view>

    <!-- 结果展示 -->
    <view class="result-section" v-if="result">
      <view class="emotion-display">
        <text class="emotion-icon">{{ getEmotionIcon(result.emotion) }}</text>
        <text class="emotion-name">{{ result.emotion }}</text>
        <view class="confidence-bar">
          <view class="confidence-fill" :style="{ width: result.confidence + '%' }"></view>
        </view>
        <text class="confidence-text">置信度：{{ result.confidence }}%</text>
      </view>
      <view class="explanation-box" v-if="result.explanation">
        <text class="explanation-title">AI解释：</text>
        <text class="explanation-text">{{ result.explanation }}</text>
      </view>
    </view>

    <!-- 情感科普 -->
    <view class="science-section">
      <text class="science-title">🧠 AI如何识别情感？</text>
      <view class="science-steps">
        <view class="step-item">
          <text class="step-num">1</text>
          <text class="step-text">分词：把句子拆成一个个词</text>
        </view>
        <view class="step-item">
          <text class="step-num">2</text>
          <text class="step-text">查词典：每个词有正面或负面的分数</text>
        </view>
        <view class="step-item">
          <text class="step-num">3</text>
          <text class="step-text">分析语境：考虑否定词、程度词的影响</text>
        </view>
        <view class="step-item">
          <text class="step-num">4</text>
          <text class="step-text">综合判断：给出最终的情感结论</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { apiRequest } from '@/utils/api.js'

export default {
  data() {
    return {
      inputText: '',
      isLoading: false,
      result: null
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    setExample(text) {
      this.inputText = text
    },
    getEmotionIcon(emotion) {
      const iconMap = {
        '开心': '😄',
        '难过': '😢',
        '生气': '😠',
        '平静': '😌',
        '惊讶': '😲',
        '害怕': '😨'
      }
      return iconMap[emotion] || '🤔'
    },
    async analyzeSentiment() {
      if (!this.inputText.trim() || this.isLoading) return

      this.isLoading = true
      this.result = null

      try {
        const res = await apiRequest('/ai-science/analyze-sentiment', 'POST', {
          text: this.inputText
        })

        if (res.success && res.data) {
          this.result = res.data
        } else {
          uni.showToast({ title: res.message || '分析失败', icon: 'none' })
        }
      } catch (error) {
        console.error('情感分析失败:', error)
        uni.showToast({ title: '网络错误', icon: 'none' })
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
.sentiment-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.nav-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  padding-top: calc(20rpx + env(safe-area-inset-top));
}

.nav-back {
  font-size: 40rpx;
  color: #fff;
  padding: 10rpx 20rpx;
}

.nav-title {
  flex: 1;
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  text-align: center;
  margin-right: 60rpx;
}

.science-tip {
  display: flex;
  align-items: center;
  background: #fff5f5;
  padding: 20rpx 30rpx;
}

.tip-icon {
  font-size: 32rpx;
  margin-right: 15rpx;
}

.tip-text {
  flex: 1;
  font-size: 24rpx;
  color: #e91e63;
}

.input-section {
  background: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 20rpx;
}

.section-title {
  font-size: 28rpx;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.text-input {
  width: 100%;
  height: 200rpx;
  background: #f9f9f9;
  border-radius: 15rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.quick-examples {
  margin-top: 20rpx;
}

.quick-title {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 15rpx;
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.quick-tag {
  padding: 10rpx 25rpx;
  background: #f5f5f5;
  border-radius: 25rpx;
  font-size: 24rpx;
  color: #666;
}

.analyze-btn {
  margin: 20rpx;
  padding: 30rpx;
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  color: #fff;
  text-align: center;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.analyze-btn.disabled {
  opacity: 0.5;
}

.result-section {
  background: #fff;
  margin: 20rpx;
  padding: 40rpx;
  border-radius: 20rpx;
  text-align: center;
}

.emotion-display {
  margin-bottom: 30rpx;
}

.emotion-icon {
  font-size: 100rpx;
  display: block;
}

.emotion-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-top: 15rpx;
}

.confidence-bar {
  width: 60%;
  height: 16rpx;
  background: #f0f0f0;
  border-radius: 8rpx;
  margin: 20rpx auto;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  border-radius: 8rpx;
  transition: width 0.5s ease;
}

.confidence-text {
  font-size: 26rpx;
  color: #999;
}

.explanation-box {
  background: #f9f9f9;
  padding: 25rpx;
  border-radius: 15rpx;
  text-align: left;
}

.explanation-title {
  font-size: 26rpx;
  font-weight: bold;
  color: #666;
  display: block;
  margin-bottom: 10rpx;
}

.explanation-text {
  font-size: 26rpx;
  color: #333;
  line-height: 1.6;
}

.science-section {
  background: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 20rpx;
}

.science-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.science-steps {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.step-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #fef5f5;
  border-radius: 15rpx;
}

.step-num {
  width: 50rpx;
  height: 50rpx;
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: bold;
  margin-right: 20rpx;
}

.step-text {
  font-size: 26rpx;
  color: #666;
}
</style>
