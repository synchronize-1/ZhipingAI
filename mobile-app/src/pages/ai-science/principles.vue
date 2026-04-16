<template>
  <view class="principles-container">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">🔬 AI原理速成</text>
    </view>

    <!-- 原理卡片列表 -->
    <scroll-view class="principles-scroll" scroll-y>
      <view class="principle-card" v-for="(p, index) in principles" :key="index" @click="toggleExpand(index)">
        <view class="card-header">
          <text class="card-icon">{{ p.icon }}</text>
          <text class="card-title">{{ p.title }}</text>
          <text class="expand-icon">{{ expandedIndex === index ? '▲' : '▼' }}</text>
        </view>
        
        <view class="card-analogy">
          <text class="analogy-label">💡 简单比喻：</text>
          <text class="analogy-text">{{ p.analogy }}</text>
        </view>

        <view class="card-content" v-if="expandedIndex === index">
          <!-- 步骤展示 -->
          <view class="steps-section" v-if="p.steps">
            <text class="steps-title">📋 具体过程：</text>
            <view class="step-item" v-for="(step, i) in p.steps" :key="i">
              <view class="step-num">{{ step.step }}</view>
              <text class="step-text">{{ step.desc }}</text>
            </view>
          </view>

          <!-- 示例展示 -->
          <view class="examples-section" v-if="p.examples">
            <text class="examples-title">⚠️ 需要注意：</text>
            <view class="example-item" v-for="(ex, i) in p.examples" :key="i">
              <text class="example-name">{{ ex.title }}</text>
              <text class="example-desc">{{ ex.desc }}</text>
            </view>
          </view>

          <!-- 趣味知识 -->
          <view class="fun-fact" v-if="p.funFact">
            <text class="fun-icon">🎉</text>
            <text class="fun-text">{{ p.funFact }}</text>
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
      principles: [],
      expandedIndex: -1
    }
  },
  onLoad() {
    this.loadPrinciples()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    toggleExpand(index) {
      this.expandedIndex = this.expandedIndex === index ? -1 : index
    },
    async loadPrinciples() {
      try {
        const res = await apiRequest('/ai-science/principles', 'GET')
        if (res.success) {
          this.principles = res.data
        }
      } catch (error) {
        console.error('加载原理数据失败:', error)
        this.principles = [
          {
            id: 'learning',
            title: 'AI如何学习？',
            icon: '📖',
            analogy: 'AI就像一个学生，通过大量做题来学习',
            steps: [
              { step: 1, desc: '给AI看大量的例子' },
              { step: 2, desc: 'AI尝试找出共同特点' },
              { step: 3, desc: 'AI做错了，系统告诉它哪里错了' },
              { step: 4, desc: 'AI调整自己的判断标准' }
            ],
            funFact: 'ChatGPT读过的文字比你一辈子能读的还多1000倍！'
          },
          {
            id: 'language',
            title: 'AI如何理解语言？',
            icon: '💬',
            analogy: 'AI把每个词变成一串数字，就像给词打分',
            steps: [
              { step: 1, desc: '把文字拆成一个个词' },
              { step: 2, desc: '每个词变成一串数字' },
              { step: 3, desc: '分析词与词之间的关系' },
              { step: 4, desc: '预测下一个词应该是什么' }
            ],
            funFact: '在AI眼里，"国王-男人+女人=女王"！'
          },
          {
            id: 'image',
            title: 'AI如何生成图片？',
            icon: '🎨',
            analogy: 'AI就像画家，从模糊草图一步步画清晰',
            steps: [
              { step: 1, desc: '从一张全是噪点的图片开始' },
              { step: 2, desc: '理解你输入的文字描述' },
              { step: 3, desc: '一点点去掉噪点，让图片变清晰' },
              { step: 4, desc: '确保图片符合你的描述' }
            ],
            funFact: '生成一张图片，AI要进行几十亿次计算！'
          },
          {
            id: 'limits',
            title: 'AI的局限性',
            icon: '⚠️',
            analogy: 'AI很强，但也会犯一些人类不会犯的错误',
            examples: [
              { title: '幻觉问题', desc: 'AI有时会一本正经地胡说八道' },
              { title: '不懂常识', desc: 'AI可能不知道"水是湿的"' },
              { title: '容易被骗', desc: '加点噪点AI可能就认错了' }
            ],
            funFact: 'AI曾把熊猫认成长臂猿，只因加了点噪点！'
          }
        ]
      }
    }
  }
}
</script>

<style scoped>
.principles-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.principles-scroll {
  height: calc(100vh - 120rpx);
  padding: 20rpx;
}

.principle-card {
  background: rgba(255, 255, 255, 0.95);
  margin-bottom: 20rpx;
  border-radius: 20rpx;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

.card-icon {
  font-size: 40rpx;
  margin-right: 15rpx;
}

.card-title {
  flex: 1;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.expand-icon {
  font-size: 24rpx;
  color: #999;
}

.card-analogy {
  padding: 25rpx 30rpx;
  background: #fff;
}

.analogy-label {
  font-size: 24rpx;
  color: #667eea;
  display: block;
  margin-bottom: 10rpx;
}

.analogy-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

.card-content {
  padding: 0 30rpx 30rpx;
}

.steps-section, .examples-section {
  margin-top: 20rpx;
}

.steps-title, .examples-title {
  font-size: 26rpx;
  color: #667eea;
  display: block;
  margin-bottom: 15rpx;
}

.step-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15rpx;
}

.step-num {
  width: 40rpx;
  height: 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  margin-right: 15rpx;
  flex-shrink: 0;
}

.step-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

.example-item {
  background: #fff5f5;
  padding: 20rpx;
  border-radius: 15rpx;
  margin-bottom: 15rpx;
}

.example-name {
  font-size: 26rpx;
  font-weight: bold;
  color: #e91e63;
  display: block;
}

.example-desc {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-top: 5rpx;
}

.fun-fact {
  display: flex;
  align-items: flex-start;
  background: linear-gradient(135deg, #fff9c4 0%, #ffecb3 100%);
  padding: 20rpx;
  border-radius: 15rpx;
  margin-top: 20rpx;
}

.fun-icon {
  font-size: 30rpx;
  margin-right: 15rpx;
}

.fun-text {
  font-size: 26rpx;
  color: #f57f17;
  line-height: 1.6;
}
</style>
