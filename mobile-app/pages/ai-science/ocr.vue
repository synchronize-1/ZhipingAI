<template>
  <view class="ocr-container">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">📷 文字识别(OCR)</text>
    </view>

    <!-- 科普提示 -->
    <view class="science-tip">
      <text class="tip-icon">💡</text>
      <text class="tip-text">OCR原理：AI先找到图片中的文字区域，然后识别每个字符的形状，最后拼成完整的文字</text>
    </view>

    <!-- 上传区域 -->
    <view class="upload-section">
      <view class="upload-box" @click="chooseImage" v-if="!imageUrl">
        <text class="upload-icon">📸</text>
        <text class="upload-text">点击上传图片</text>
        <text class="upload-hint">支持拍照或从相册选择</text>
      </view>
      <view class="preview-box" v-else>
        <image class="preview-image" :src="imageUrl" mode="aspectFit" />
        <view class="change-btn" @click="chooseImage">更换图片</view>
      </view>
    </view>

    <!-- 识别按钮 -->
    <view class="recognize-btn" @click="recognizeText" :class="{ disabled: isLoading || !imageUrl }">
      {{ isLoading ? '识别中...' : '🔍 开始识别' }}
    </view>

    <!-- 识别结果 -->
    <view class="result-section" v-if="result">
      <view class="result-header">
        <text class="result-title">识别结果</text>
        <text class="word-count">共识别 {{ wordCount }} 个字</text>
      </view>
      <view class="result-content">
        <text class="result-text">{{ result }}</text>
      </view>
      <view class="result-actions">
        <view class="action-btn" @click="copyResult">📋 复制文字</view>
        <view class="action-btn" @click="clearAll">🗑️ 清空</view>
      </view>
    </view>

    <!-- 使用场景 -->
    <view class="scenarios-section">
      <text class="section-title">📚 OCR的应用场景</text>
      <view class="scenario-list">
        <view class="scenario-item">
          <text class="scenario-icon">📝</text>
          <view class="scenario-info">
            <text class="scenario-name">扫描文档</text>
            <text class="scenario-desc">把纸质文件变成电子版</text>
          </view>
        </view>
        <view class="scenario-item">
          <text class="scenario-icon">🚗</text>
          <view class="scenario-info">
            <text class="scenario-name">车牌识别</text>
            <text class="scenario-desc">停车场自动识别车牌</text>
          </view>
        </view>
        <view class="scenario-item">
          <text class="scenario-icon">💳</text>
          <view class="scenario-info">
            <text class="scenario-name">证件识别</text>
            <text class="scenario-desc">快速录入身份信息</text>
          </view>
        </view>
        <view class="scenario-item">
          <text class="scenario-icon">🌐</text>
          <view class="scenario-info">
            <text class="scenario-name">翻译软件</text>
            <text class="scenario-desc">拍照识别外语翻译</text>
          </view>
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
      imageUrl: '',
      imageBase64: '',
      isLoading: false,
      result: '',
      wordCount: 0
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    chooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.imageUrl = res.tempFilePaths[0]
          this.result = ''
          this.wordCount = 0
          // 转换为base64
          uni.getFileSystemManager().readFile({
            filePath: res.tempFilePaths[0],
            encoding: 'base64',
            success: (data) => {
              this.imageBase64 = data.data
            }
          })
        }
      })
    },
    async recognizeText() {
      if (!this.imageBase64 || this.isLoading) return

      this.isLoading = true
      this.result = ''

      try {
        const res = await apiRequest('/ai-science/ocr', 'POST', {
          imageBase64: this.imageBase64
        })

        if (res.success && res.data) {
          this.result = res.data.text
          this.wordCount = res.data.wordsCount || this.result.length
          uni.showToast({ title: '识别成功', icon: 'success' })
        } else {
          uni.showToast({ title: res.message || '识别失败', icon: 'none' })
        }
      } catch (error) {
        console.error('OCR识别失败:', error)
        uni.showToast({ title: '网络错误', icon: 'none' })
      } finally {
        this.isLoading = false
      }
    },
    copyResult() {
      uni.setClipboardData({
        data: this.result,
        success: () => {
          uni.showToast({ title: '复制成功', icon: 'success' })
        }
      })
    },
    clearAll() {
      this.imageUrl = ''
      this.imageBase64 = ''
      this.result = ''
      this.wordCount = 0
    }
  }
}
</script>

<style scoped>
.ocr-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.nav-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
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
  background: #e8f5e9;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #c8e6c9;
}

.tip-icon {
  font-size: 32rpx;
  margin-right: 15rpx;
}

.tip-text {
  flex: 1;
  font-size: 24rpx;
  color: #2e7d32;
}

.upload-section {
  margin: 20rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}

.upload-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400rpx;
  background: #fafafa;
  border: 3rpx dashed #ddd;
  border-radius: 20rpx;
  margin: 20rpx;
}

.upload-icon {
  font-size: 80rpx;
}

.upload-text {
  font-size: 32rpx;
  color: #333;
  margin-top: 20rpx;
}

.upload-hint {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

.preview-box {
  position: relative;
}

.preview-image {
  width: 100%;
  height: 400rpx;
}

.change-btn {
  position: absolute;
  bottom: 20rpx;
  right: 20rpx;
  padding: 15rpx 30rpx;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border-radius: 30rpx;
  font-size: 26rpx;
}

.recognize-btn {
  margin: 20rpx;
  padding: 30rpx;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: #fff;
  text-align: center;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.recognize-btn.disabled {
  opacity: 0.5;
}

.result-section {
  background: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 20rpx;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.result-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.word-count {
  font-size: 24rpx;
  color: #999;
}

.result-content {
  background: #f9f9f9;
  padding: 30rpx;
  border-radius: 15rpx;
  min-height: 200rpx;
  max-height: 400rpx;
  overflow-y: auto;
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

.scenarios-section {
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

.scenario-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.scenario-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f9f9f9;
  border-radius: 15rpx;
}

.scenario-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.scenario-info {
  flex: 1;
}

.scenario-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.scenario-desc {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-top: 5rpx;
}
</style>
