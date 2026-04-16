<template>
  <view class="services-page">
    <view class="service-grid">
      <view v-for="service in services" :key="service.name" class="service-card" @tap="handleService(service)">
        <view class="service-icon" :style="{ background: service.color }">
          <text>{{ service.icon }}</text>
        </view>
        <text class="service-name">{{ service.name }}</text>
        <text class="service-desc">{{ service.desc }}</text>
      </view>
    </view>

    <!-- 报修弹窗 -->
    <view v-if="showRepairModal" class="modal-mask" @tap="showRepairModal = false">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">提交报修</text>
        <input v-model="repairForm.title" placeholder="报修标题" class="modal-input" />
        <input v-model="repairForm.location" placeholder="报修位置" class="modal-input" />
        <textarea v-model="repairForm.description" placeholder="问题描述" class="modal-textarea" />
        <view class="modal-btns">
          <view class="modal-btn cancel" @tap="showRepairModal = false">取消</view>
          <view class="modal-btn confirm" @tap="submitRepair">提交</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  data() {
    return {
      services: [
        { name: '空闲教室', icon: '🏫', desc: '查询空闲教室', color: 'linear-gradient(135deg, #d4a574 0%, #c9956c 100%)', action: 'room' },
        { name: '图书借阅', icon: '📚', desc: '图书查询借阅', color: 'linear-gradient(135deg, #b8956c 0%, #a67c52 100%)', action: 'book' },
        { name: '报修服务', icon: '🔧', desc: '在线报修申请', color: 'linear-gradient(135deg, #c9a86c 0%, #b8956c 100%)', action: 'repair' },
        { name: '设备预约', icon: '💻', desc: '设备器材预约', color: 'linear-gradient(135deg, #8fbc8f 0%, #6b8e6b 100%)', action: 'equipment' },
        { name: '食堂人流', icon: '🍜', desc: '实时人流查看', color: 'linear-gradient(135deg, #d4a574 0%, #c9956c 100%)', action: 'canteen' },
        { name: '在线点餐', icon: '🍔', desc: '食堂在线点餐', color: 'linear-gradient(135deg, #c9a86c 0%, #b8956c 100%)', action: 'order' },
        { name: '校园导航', icon: '🗺️', desc: '校园地图导航', color: 'linear-gradient(135deg, #a67c52 0%, #8b6914 100%)', action: 'map' },
        { name: '失物招领', icon: '📦', desc: '失物招领信息', color: 'linear-gradient(135deg, #b8956c 0%, #a67c52 100%)', action: 'lost' }
      ],
      showRepairModal: false,
      repairForm: { title: '', location: '', description: '', category: 'other' }
    }
  },
  methods: {
    handleService(service) {
      switch (service.action) {
        case 'repair':
          this.showRepairModal = true
          break
        case 'canteen':
          uni.navigateTo({ url: '/pages/canteen/canteen' })
          break
        case 'map':
          uni.navigateTo({ url: '/pages/map/map' })
          break
        default:
          uni.showToast({ title: `${service.name}功能开发中`, icon: 'none' })
      }
    },
    async submitRepair() {
      if (!this.repairForm.title) {
        uni.showToast({ title: '请填写报修标题', icon: 'none' })
        return
      }
      try {
        await api.services.createRepair(this.repairForm)
        uni.showToast({ title: '报修提交成功', icon: 'success' })
        this.showRepairModal = false
        this.repairForm = { title: '', location: '', description: '', category: 'other' }
      } catch (e) {
        uni.showToast({ title: '提交失败', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.services-page { padding: 20rpx; background: #faf8f5; min-height: 100vh; }

.service-grid { display: flex; flex-wrap: wrap; gap: 20rpx; }
.service-card { width: calc(50% - 10rpx); background: #fff; border-radius: 24rpx; padding: 30rpx; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05); }
.service-icon { width: 90rpx; height: 90rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; font-size: 44rpx; margin-bottom: 20rpx; }
.service-name { display: block; font-size: 30rpx; font-weight: 600; color: #333; margin-bottom: 8rpx; }
.service-desc { display: block; font-size: 24rpx; color: #999; }

.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 999; }
.modal-content { width: 80%; background: #fff; border-radius: 24rpx; padding: 40rpx; }
.modal-title { display: block; font-size: 34rpx; font-weight: bold; text-align: center; margin-bottom: 30rpx; }
.modal-input { width: 100%; height: 80rpx; background: #f5f5f5; border-radius: 16rpx; padding: 0 20rpx; margin-bottom: 20rpx; font-size: 28rpx; }
.modal-textarea { width: 100%; height: 200rpx; background: #f5f5f5; border-radius: 16rpx; padding: 20rpx; margin-bottom: 30rpx; font-size: 28rpx; }
.modal-btns { display: flex; gap: 20rpx; }
.modal-btn { flex: 1; height: 80rpx; border-radius: 40rpx; display: flex; align-items: center; justify-content: center; font-size: 30rpx; }
.modal-btn.cancel { background: #f0f0f0; color: #666; }
.modal-btn.confirm { background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; }
</style>
