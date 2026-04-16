<script>
export default {
  onLaunch() {
    console.log('App Launch')
    // 检查登录状态
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.reLaunch({ url: '/pages/login/login' })
    }
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  }
}
</script>

<style>
@import './static/styles/common.css';

page {
  background-color: #faf8f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.container {
  padding: 20rpx;
}

.card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.gradient-primary {
  background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%);
}

.gradient-success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.text-primary { color: #8b6914; }
.text-gray { color: #666666; }
.text-light { color: #999999; }

.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-20 { gap: 20rpx; }

.btn-primary {
  background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%);
  color: #ffffff;
  border-radius: 50rpx;
  padding: 24rpx 40rpx;
  text-align: center;
  font-weight: 500;
}
</style>
