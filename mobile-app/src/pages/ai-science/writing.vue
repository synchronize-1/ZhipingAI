<template>
  <view class="writing-container">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">✍️ AI写作助手</text>
    </view>

    <!-- 功能选择 -->
    <view class="tabs">
      <view :class="['tab', { active: mode === 'poem' }]" @click="mode = 'poem'">写诗</view>
      <view :class="['tab', { active: mode === 'story' }]" @click="mode = 'story'">写故事</view>
    </view>

    <!-- 写诗模式 -->
    <view class="content" v-if="mode === 'poem'">
      <view class="input-section">
        <text class="label">诗歌主题</text>
        <input class="input" v-model="poemTheme" placeholder="例如：友情、春天、思乡" />
      </view>
      <view class="input-section">
        <text class="label">诗歌风格</text>
        <view class="style-options">
          <view 
            v-for="s in poemStyles" 
            :key="s"
            :class="['style-option', { active: poemStyle === s }]"
            @click="poemStyle = s"
          >{{ s }}</view>
        </view>
      </view>
      <view class="generate-btn" @click="writePoem" :class="{ disabled: isLoading || !poemTheme.trim() }">
        {{ isLoading ? '创作中...' : '✨ 开始创作' }}
      </view>
    </view>

    <!-- 写故事模式 -->
    <view class="content" v-if="mode === 'story'">
      <view class="input-section">
        <text class="label">故事开头</text>
        <textarea class="textarea" v-model="storyBeginning" placeholder="例如：那是一个风雨交加的夜晚，小明独自走在回家的路上..." />
      </view>
      <view class="input-section">
        <text class="label">故事类型</text>
        <view class="style-options">
          <view 
            v-for="g in storyGenres" 
            :key="g"
            :class="['style-option', { active: storyGenre === g }]"
            @click="storyGenre = g"
          >{{ g }}</view>
        </view>
      </view>
      <view class="generate-btn" @click="writeStory" :class="{ disabled: isLoading || !storyBeginning.trim() }">
        {{ isLoading ? '创作中...' : '✨ 续写故事' }}
      </view>
    </view>

    <!-- 结果展示 -->
    <view class="result-section" v-if="result">
      <text class="result-title">{{ mode === 'poem' ? '🎋 AI创作的诗' : '📖 AI续写的故事' }}</text>
      <view class="result-content">
        <text class="result-text">{{ result }}</text>
      </view>
      <view class="result-actions">
        <view class="action-btn" @click="copyResult">📋 复制</view>
        <view class="action-btn" @click="regenerate">🔄 重新生成</view>
      </view>
    </view>

    <!-- 科普区域 -->
    <view class="science-section">
      <text class="science-title">💡 AI写作原理</text>
      <text class="science-text">AI通过学习大量的诗歌和故事，理解了语言的规律和创作的技巧。当你给它一个主题时，它会预测下一个最合适的词，一个词接一个词地写出来。</text>
    </view>
  </view>
</template>

<script>
import { apiRequest } from '@/utils/api.js'

export default {
  data() {
    return {
      mode: 'poem',
      poemTheme: '',
      poemStyle: '现代诗',
      poemStyles: ['现代诗', '古诗', '打油诗', '儿童诗'],
      storyBeginning: '',
      storyGenre: '奇幻',
      storyGenres: ['奇幻', '科幻', '悬疑', '温馨', '搞笑'],
      isLoading: false,
      result: ''
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    async writePoem() {
      if (!this.poemTheme.trim() || this.isLoading) return

      this.isLoading = true
      this.result = ''

      try {
        const res = await apiRequest('/ai-science/write-poem', 'POST', {
          theme: this.poemTheme,
          style: this.poemStyle
        })

        if (res.success && res.data) {
          this.result = res.data.reply
        } else {
          uni.showToast({ title: res.message || '创作失败', icon: 'none' })
        }
      } catch (error) {
        console.error('写诗失败:', error)
        uni.showToast({ title: '网络错误', icon: 'none' })
      } finally {
        this.isLoading = false
      }
    },
    async writeStory() {
      if (!this.storyBeginning.trim() || this.isLoading) return

      this.isLoading = true
      this.result = ''

      try {
        const res = await apiRequest('/ai-science/write-story', 'POST', {
          beginning: this.storyBeginning,
          genre: this.storyGenre
        })

        if (res.success && res.data) {
          this.result = res.data.reply
        } else {
          uni.showToast({ title: res.message || '创作失败', icon: 'none' })
        }
      } catch (error) {
        console.error('写故事失败:', error)
        uni.showToast({ title: '网络错误', icon: 'none' })
      } finally {
        this.isLoading = false
      }
    },
    regenerate() {
      if (this.mode === 'poem') {
        this.writePoem()
      } else {
        this.writeStory()
      }
    },
    copyResult() {
      uni.setClipboardData({
        data: this.result,
        success: () => {
          uni.showToast({ title: '复制成功', icon: 'success' })
        }
      })
    }
  }
}
</script>

<style scoped>
.writing-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.nav-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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

.tabs {
  display: flex;
  background: #fff;
  padding: 20rpx;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  font-size: 30rpx;
  color: #666;
  border-radius: 30rpx;
}

.tab.active {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  font-weight: bold;
}

.content {
  padding: 20rpx;
}

.input-section {
  background: #fff;
  padding: 30rpx;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
}

.label {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 15rpx;
}

.input {
  width: 100%;
  height: 80rpx;
  background: #f9f9f9;
  border-radius: 15rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.textarea {
  width: 100%;
  height: 200rpx;
  background: #f9f9f9;
  border-radius: 15rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.style-options {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.style-option {
  padding: 15rpx 30rpx;
  background: #f5f5f5;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #666;
}

.style-option.active {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.generate-btn {
  padding: 30rpx;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  text-align: center;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin: 20rpx 0;
}

.generate-btn.disabled {
  opacity: 0.5;
}

.result-section {
  background: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 20rpx;
}

.result-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.result-content {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding: 30rpx;
  border-radius: 15rpx;
  min-height: 200rpx;
}

.result-text {
  font-size: 30rpx;
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 30rpx;
  margin-top: 20rpx;
}

.action-btn {
  padding: 15rpx 40rpx;
  background: #f5f5f5;
  border-radius: 30rpx;
  font-size: 28rpx;
  color: #666;
}

.science-section {
  background: #e3f2fd;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 20rpx;
}

.science-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #1976d2;
  display: block;
  margin-bottom: 15rpx;
}

.science-text {
  font-size: 26rpx;
  line-height: 1.6;
  color: #1565c0;
}
</style>
