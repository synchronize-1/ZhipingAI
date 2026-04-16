<template>
  <view class="pioneers-container">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">👨‍🔬 AI名人堂</text>
    </view>

    <!-- 名人列表 -->
    <scroll-view class="pioneers-scroll" scroll-y>
      <view class="pioneer-card" v-for="(pioneer, index) in pioneers" :key="index" @click="showDetail(pioneer)">
        <view class="pioneer-avatar">{{ pioneer.avatar }}</view>
        <view class="pioneer-info">
          <text class="pioneer-name">{{ pioneer.name }}</text>
          <text class="pioneer-name-en">{{ pioneer.nameEn }}</text>
          <text class="pioneer-title">{{ pioneer.title }}</text>
          <text class="pioneer-years">{{ pioneer.country }} · {{ pioneer.years }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 详情弹窗 -->
    <view class="detail-modal" v-if="showModal" @click="showModal = false">
      <view class="detail-content" @click.stop>
        <text class="detail-avatar">{{ selectedPioneer.avatar }}</text>
        <text class="detail-name">{{ selectedPioneer.name }}</text>
        <text class="detail-title">{{ selectedPioneer.title }}</text>
        <view class="detail-divider"></view>
        <text class="detail-contribution">{{ selectedPioneer.contribution }}</text>
        <view class="detail-quote">
          <text class="quote-mark">"</text>
          <text class="quote-text">{{ selectedPioneer.quote }}</text>
          <text class="quote-mark">"</text>
        </view>
        <view class="detail-close" @click="showModal = false">关闭</view>
      </view>
    </view>
  </view>
</template>

<script>
import { apiRequest } from '@/utils/api.js'

export default {
  data() {
    return {
      pioneers: [],
      showModal: false,
      selectedPioneer: {}
    }
  },
  onLoad() {
    this.loadPioneers()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    async loadPioneers() {
      try {
        const res = await apiRequest('/ai-science/pioneers', 'GET')
        if (res.success) {
          this.pioneers = res.data
        }
      } catch (error) {
        console.error('加载名人数据失败:', error)
        // 使用本地数据
        this.pioneers = [
          { name: '艾伦·图灵', nameEn: 'Alan Turing', country: '英国', years: '1912-1954', title: '人工智能之父', avatar: '👨‍🔬', contribution: '提出图灵测试', quote: '机器能思考吗？' },
          { name: '杰弗里·辛顿', nameEn: 'Geoffrey Hinton', country: '加拿大', years: '1947-', title: '深度学习之父', avatar: '🧓', contribution: '发明反向传播算法', quote: '神经网络就像大脑' },
          { name: '吴恩达', nameEn: 'Andrew Ng', country: '美国', years: '1976-', title: 'AI教育家', avatar: '👨‍🏫', contribution: '创办Coursera', quote: 'AI是新的电力' },
          { name: '李飞飞', nameEn: 'Fei-Fei Li', country: '美国', years: '1976-', title: 'AI视觉先驱', avatar: '👩‍🔬', contribution: '创建ImageNet', quote: '让机器像人一样看世界' }
        ]
      }
    },
    showDetail(pioneer) {
      this.selectedPioneer = pioneer
      this.showModal = true
    }
  }
}
</script>

<style scoped>
.pioneers-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
}

.nav-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: transparent;
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

.pioneers-scroll {
  height: calc(100vh - 120rpx);
  padding: 20rpx;
}

.pioneer-card {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  margin-bottom: 20rpx;
  padding: 30rpx;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
}

.pioneer-avatar {
  width: 100rpx;
  height: 100rpx;
  font-size: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  margin-right: 25rpx;
}

.pioneer-info {
  flex: 1;
}

.pioneer-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.pioneer-name-en {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-top: 5rpx;
}

.pioneer-title {
  font-size: 26rpx;
  color: #3498db;
  display: block;
  margin-top: 10rpx;
}

.pioneer-years {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 5rpx;
}

.detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.detail-content {
  width: 85%;
  background: #fff;
  border-radius: 30rpx;
  padding: 50rpx;
  text-align: center;
}

.detail-avatar {
  font-size: 100rpx;
  display: block;
}

.detail-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-top: 20rpx;
}

.detail-title {
  font-size: 28rpx;
  color: #3498db;
  display: block;
  margin-top: 10rpx;
}

.detail-divider {
  width: 100rpx;
  height: 4rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 30rpx auto;
}

.detail-contribution {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
  display: block;
}

.detail-quote {
  background: #f5f5f5;
  padding: 30rpx;
  border-radius: 15rpx;
  margin-top: 30rpx;
}

.quote-mark {
  font-size: 40rpx;
  color: #3498db;
}

.quote-text {
  font-size: 28rpx;
  color: #333;
  font-style: italic;
}

.detail-close {
  margin-top: 40rpx;
  padding: 20rpx 60rpx;
  background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  display: inline-block;
}
</style>
