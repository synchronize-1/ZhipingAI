<template>
  <view class="painting-container">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">🎨 AI绘画大师</text>
    </view>

    <!-- 科普提示 -->
    <view class="science-tip">
      <text class="tip-icon">💡</text>
      <text class="tip-text">AI绘画原理：AI从一张噪点图开始，根据你的描述一步步画出清晰的图片</text>
    </view>

    <!-- 输入区域 -->
    <view class="input-section">
      <text class="section-title">描述你想要的图片</text>
      <textarea 
        class="desc-input" 
        v-model="prompt" 
        placeholder="例如：一只在太空漫步的可爱猫咪，背景是星空和地球"
        :maxlength="200"
      />
      <text class="char-count">{{ prompt.length }}/200</text>
    </view>

    <!-- 风格选择 -->
    <view class="style-section">
      <text class="section-title">选择风格</text>
      <view class="style-grid">
        <view 
          v-for="s in styles" 
          :key="s.value"
          :class="['style-item', { active: style === s.value }]"
          @click="style = s.value"
        >
          <text class="style-icon">{{ s.icon }}</text>
          <text class="style-name">{{ s.name }}</text>
        </view>
      </view>
    </view>

    <!-- 生成按钮 -->
    <view class="generate-btn" @click="generateImage" :class="{ disabled: isLoading || !prompt.trim() }">
      <text v-if="isLoading">{{ statusText }}</text>
      <text v-else>✨ 开始生成</text>
    </view>

    <!-- 结果展示 -->
    <view class="result-section" v-if="generatedImage">
      <text class="section-title">生成结果</text>
      <image class="result-image" :src="generatedImage" mode="aspectFit" @click="previewImage" />
      <view class="result-actions">
        <view class="action-btn" @click="saveImage">💾 保存</view>
        <view class="action-btn" @click="regenerate">🔄 重新生成</view>
      </view>
    </view>

    <!-- 历史记录 -->
    <view class="history-section" v-if="history.length > 0">
      <text class="section-title">我的作品</text>
      <scroll-view class="history-scroll" scroll-x>
        <view class="history-item" v-for="(item, index) in history" :key="index">
          <image class="history-image" :src="item.url" mode="aspectFill" @click="previewHistoryImage(item.url)" />
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import { apiRequest } from '@/utils/api.js'

export default {
  data() {
    return {
      prompt: '',
      style: 'realistic',
      styles: [
        { value: 'realistic', name: '写实', icon: '📷' },
        { value: 'anime', name: '动漫', icon: '🎌' },
        { value: 'watercolor', name: '水彩', icon: '🎨' },
        { value: 'oil', name: '油画', icon: '🖼️' },
        { value: 'sketch', name: '素描', icon: '✏️' },
        { value: 'future', name: '未来', icon: '🚀' }
      ],
      isLoading: false,
      statusText: '生成中...',
      taskId: null,
      generatedImage: null,
      history: []
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    async generateImage() {
      if (!this.prompt.trim() || this.isLoading) return

      this.isLoading = true
      this.statusText = '正在生成...'
      this.generatedImage = null

      try {
        // 添加风格描述到prompt
        const styleMap = {
          realistic: '写实风格，高清细节',
          anime: '日本动漫风格，二次元',
          watercolor: '水彩画风格，柔和色彩',
          oil: '油画风格，厚重笔触',
          sketch: '素描风格，黑白线条',
          future: '未来科技风格，赛博朋克'
        }
        
        const fullPrompt = `${this.prompt}，${styleMap[this.style]}`

        const res = await apiRequest('/ai-science/generate-image', 'POST', {
          prompt: fullPrompt,
          style: this.style
        })

        if (res.success && res.data.taskId) {
          this.taskId = res.data.taskId
          this.statusText = '图片生成中，请稍候...'
          // 轮询获取结果
          this.pollResult()
        } else {
          uni.showToast({ title: res.message || '生成失败', icon: 'none' })
          this.isLoading = false
        }
      } catch (error) {
        console.error('生成图片失败:', error)
        uni.showToast({ title: '网络错误', icon: 'none' })
        this.isLoading = false
      }
    },
    async pollResult() {
      if (!this.taskId) return

      let attempts = 0
      const maxAttempts = 30 // 最多等待60秒

      const poll = async () => {
        attempts++
        this.statusText = `生成中... (${attempts}/30)`

        try {
          const res = await apiRequest(`/ai-science/image-result/${this.taskId}`, 'GET')

          if (res.success && res.data.status === 'completed') {
            this.generatedImage = res.data.images[0]?.url
            if (this.generatedImage) {
              this.history.unshift({ url: this.generatedImage, prompt: this.prompt })
              if (this.history.length > 10) this.history.pop()
            }
            this.isLoading = false
            uni.showToast({ title: '生成成功！', icon: 'success' })
          } else if (res.data.status === 'pending' && attempts < maxAttempts) {
            setTimeout(poll, 2000)
          } else {
            uni.showToast({ title: '生成超时，请重试', icon: 'none' })
            this.isLoading = false
          }
        } catch (error) {
          console.error('查询结果失败:', error)
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000)
          } else {
            uni.showToast({ title: '查询失败', icon: 'none' })
            this.isLoading = false
          }
        }
      }

      poll()
    },
    regenerate() {
      this.generateImage()
    },
    previewImage() {
      if (this.generatedImage) {
        uni.previewImage({ urls: [this.generatedImage] })
      }
    },
    previewHistoryImage(url) {
      uni.previewImage({ urls: [url] })
    },
    saveImage() {
      if (!this.generatedImage) return
      uni.downloadFile({
        url: this.generatedImage,
        success: (res) => {
          uni.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              uni.showToast({ title: '保存成功', icon: 'success' })
            },
            fail: () => {
              uni.showToast({ title: '保存失败', icon: 'none' })
            }
          })
        }
      })
    }
  }
}
</script>

<style scoped>
.painting-container {
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

.science-tip {
  display: flex;
  align-items: center;
  background: #fff5f5;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #ffe0e0;
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

.input-section, .style-section, .result-section, .history-section {
  background: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.desc-input {
  width: 100%;
  height: 200rpx;
  background: #f9f9f9;
  border-radius: 15rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.char-count {
  font-size: 24rpx;
  color: #999;
  text-align: right;
  display: block;
  margin-top: 10rpx;
}

.style-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.style-item {
  text-align: center;
  padding: 20rpx;
  background: #f9f9f9;
  border-radius: 15rpx;
  border: 3rpx solid transparent;
}

.style-item.active {
  border-color: #f5576c;
  background: #fff5f5;
}

.style-icon {
  font-size: 40rpx;
  display: block;
}

.style-name {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-top: 10rpx;
}

.generate-btn {
  margin: 20rpx;
  padding: 30rpx;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
  text-align: center;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.generate-btn.disabled {
  opacity: 0.5;
}

.result-image {
  width: 100%;
  height: 500rpx;
  border-radius: 15rpx;
  background: #f0f0f0;
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

.history-scroll {
  white-space: nowrap;
}

.history-item {
  display: inline-block;
  margin-right: 20rpx;
}

.history-image {
  width: 150rpx;
  height: 150rpx;
  border-radius: 15rpx;
}
</style>
