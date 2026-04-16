<template>
  <view class="applications-container">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">🎯 AI应用案例</text>
    </view>

    <!-- 分类标签 -->
    <scroll-view class="category-scroll" scroll-x>
      <view class="category-list">
        <view 
          v-for="(cat, index) in applications" 
          :key="index"
          :class="['category-item', { active: selectedCategory === index }]"
          @click="selectedCategory = index"
        >
          <text class="cat-icon">{{ cat.icon }}</text>
          <text class="cat-name">{{ cat.category }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 应用列表 -->
    <scroll-view class="apps-scroll" scroll-y>
      <view class="apps-list" v-if="currentCategory">
        <view class="app-card" v-for="(app, index) in currentCategory.items" :key="index">
          <view class="app-header">
            <text class="app-name">{{ app.name }}</text>
          </view>
          <text class="app-desc">{{ app.desc }}</text>
          <view class="app-example">
            <text class="example-label">💡 例如：</text>
            <text class="example-text">{{ app.example }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { apiRequest } from '@/utils/api.js'

export default {
  data() {
    return {
      applications: [],
      selectedCategory: 0
    }
  },
  computed: {
    currentCategory() {
      return this.applications[this.selectedCategory] || null
    }
  },
  onLoad() {
    this.loadApplications()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    async loadApplications() {
      try {
        const res = await apiRequest('/ai-science/applications', 'GET')
        if (res.success) {
          this.applications = res.data
        }
      } catch (error) {
        console.error('加载应用数据失败:', error)
        this.applications = [
          {
            category: '生活',
            icon: '🏠',
            items: [
              { name: '智能推荐', desc: '抖音、淘宝如何知道你喜欢什么', example: '分析浏览记录，预测喜好' },
              { name: '语音助手', desc: 'Siri、小爱同学如何听懂你的话', example: '语音转文字，理解意图' },
              { name: '人脸识别', desc: '手机解锁、刷脸支付', example: '分析面部特征点' }
            ]
          },
          {
            category: '医疗',
            icon: '🏥',
            items: [
              { name: '医学影像分析', desc: 'AI帮助医生看X光片、CT', example: '识别肿瘤、骨折' },
              { name: '药物研发', desc: 'AI加速新药发现', example: '预测药物分子结构' }
            ]
          },
          {
            category: '教育',
            icon: '📚',
            items: [
              { name: '个性化学习', desc: 'AI根据你的水平推荐题目', example: '分析错题，推荐练习' },
              { name: '作文批改', desc: 'AI帮你检查作文', example: '检查语法错误' }
            ]
          },
          {
            category: '艺术',
            icon: '🎨',
            items: [
              { name: 'AI绘画', desc: '输入文字，AI画出图片', example: 'Midjourney、Stable Diffusion' },
              { name: 'AI作曲', desc: 'AI创作音乐', example: '根据情绪生成旋律' }
            ]
          },
          {
            category: '交通',
            icon: '🚗',
            items: [
              { name: '自动驾驶', desc: '汽车自己开', example: '识别道路、行人' },
              { name: '路线规划', desc: '导航APP如何找最快路线', example: '分析实时路况' }
            ]
          }
        ]
      }
    }
  }
}
</script>

<style scoped>
.applications-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.nav-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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

.category-scroll {
  background: #fff;
  white-space: nowrap;
}

.category-list {
  display: inline-flex;
  padding: 20rpx;
}

.category-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 30rpx;
  margin-right: 15rpx;
  background: #f5f5f5;
  border-radius: 20rpx;
  min-width: 120rpx;
}

.category-item.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.cat-icon {
  font-size: 40rpx;
}

.cat-name {
  font-size: 24rpx;
  color: #666;
  margin-top: 10rpx;
}

.category-item.active .cat-name {
  color: #fff;
}

.apps-scroll {
  height: calc(100vh - 280rpx);
  padding: 20rpx;
}

.apps-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.app-card {
  background: #fff;
  padding: 30rpx;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.app-header {
  margin-bottom: 15rpx;
}

.app-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.app-desc {
  font-size: 28rpx;
  color: #666;
  display: block;
  line-height: 1.6;
}

.app-example {
  margin-top: 20rpx;
  padding: 20rpx;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
  border-radius: 15rpx;
}

.example-label {
  font-size: 24rpx;
  color: #f5576c;
  display: block;
  margin-bottom: 8rpx;
}

.example-text {
  font-size: 26rpx;
  color: #666;
}
</style>
