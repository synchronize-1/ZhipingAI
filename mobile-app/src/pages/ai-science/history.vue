<template>
  <view class="history-container">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">🏛️ AI历史长廊</text>
    </view>

    <!-- 时间线 -->
    <scroll-view class="timeline-scroll" scroll-y>
      <view class="timeline">
        <view class="timeline-item" v-for="(item, index) in historyData" :key="index" @click="showDetail(item)">
          <view class="timeline-dot">{{ item.icon }}</view>
          <view class="timeline-content">
            <text class="timeline-year">{{ item.year }}</text>
            <text class="timeline-title">{{ item.title }}</text>
            <text class="timeline-desc">{{ item.description }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 详情弹窗 -->
    <view class="detail-modal" v-if="showModal" @click="showModal = false">
      <view class="detail-content" @click.stop>
        <text class="detail-icon">{{ selectedItem.icon }}</text>
        <text class="detail-year">{{ selectedItem.year }}</text>
        <text class="detail-title">{{ selectedItem.title }}</text>
        <text class="detail-text">{{ selectedItem.detail }}</text>
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
      historyData: [],
      showModal: false,
      selectedItem: {}
    }
  },
  onLoad() {
    this.loadHistory()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    async loadHistory() {
      try {
        const res = await apiRequest('/ai-science/history', 'GET')
        if (res.success) {
          this.historyData = res.data
        }
      } catch (error) {
        console.error('加载历史数据失败:', error)
        // 使用本地数据
        this.historyData = [
          { year: 1950, title: '图灵测试', icon: '🧠', description: '艾伦·图灵提出了著名的"图灵测试"', detail: '图灵问：机器能思考吗？' },
          { year: 1956, title: 'AI诞生', icon: '🎂', description: '"人工智能"这个词正式诞生', detail: '达特茅斯会议上，AI这个名字被创造出来' },
          { year: 1997, title: '深蓝战胜人类', icon: '♟️', description: 'IBM深蓝战胜国际象棋冠军', detail: '深蓝每秒能分析2亿个棋步' },
          { year: 2016, title: 'AlphaGo震惊世界', icon: '⚫', description: 'AlphaGo以4:1战胜李世石', detail: '围棋被认为是最复杂的棋类游戏' },
          { year: 2022, title: 'ChatGPT横空出世', icon: '💬', description: 'ChatGPT掀起生成式AI革命', detail: '两个月内用户突破1亿' }
        ]
      }
    },
    showDetail(item) {
      this.selectedItem = item
      this.showModal = true
    }
  }
}
</script>

<style scoped>
.history-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
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

.timeline-scroll {
  height: calc(100vh - 120rpx);
  padding: 30rpx;
}

.timeline {
  position: relative;
  padding-left: 60rpx;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 25rpx;
  top: 0;
  bottom: 0;
  width: 4rpx;
  background: linear-gradient(180deg, #667eea, #764ba2, #f093fb, #f5576c);
}

.timeline-item {
  position: relative;
  margin-bottom: 50rpx;
}

.timeline-dot {
  position: absolute;
  left: -52rpx;
  width: 60rpx;
  height: 60rpx;
  background: #1a1a2e;
  border: 4rpx solid #667eea;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}

.timeline-content {
  background: rgba(255, 255, 255, 0.1);
  padding: 30rpx;
  border-radius: 20rpx;
  backdrop-filter: blur(10px);
}

.timeline-year {
  font-size: 40rpx;
  font-weight: bold;
  color: #667eea;
  display: block;
}

.timeline-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-top: 10rpx;
}

.timeline-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  margin-top: 10rpx;
  line-height: 1.5;
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
  width: 80%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 30rpx;
  padding: 50rpx;
  text-align: center;
  border: 2rpx solid rgba(102, 126, 234, 0.5);
}

.detail-icon {
  font-size: 80rpx;
  display: block;
}

.detail-year {
  font-size: 48rpx;
  font-weight: bold;
  color: #667eea;
  display: block;
  margin-top: 20rpx;
}

.detail-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-top: 15rpx;
}

.detail-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  display: block;
  margin-top: 30rpx;
  line-height: 1.8;
}

.detail-close {
  margin-top: 40rpx;
  padding: 20rpx 60rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  display: inline-block;
}
</style>
