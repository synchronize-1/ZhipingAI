<template>
  <view class="schedule-page">
    <view class="week-selector">
      <view class="week-btn" @tap="changeWeek(-1)">◀</view>
      <text class="week-text">第 {{ currentWeek }} 周</text>
      <view class="week-btn" @tap="changeWeek(1)">▶</view>
    </view>

    <view class="schedule-container">
      <view class="day-header">
        <view class="time-col"></view>
        <view v-for="day in weekDays" :key="day.value" class="day-col" :class="{ active: isToday(day.value) }">
          <text class="day-name">{{ day.label }}</text>
        </view>
      </view>

      <scroll-view scroll-y class="schedule-body">
        <view v-for="slot in timeSlots" :key="slot.id" class="time-row">
          <view class="time-col">
            <text class="slot-num">{{ slot.id }}</text>
            <text class="slot-time">{{ slot.time }}</text>
          </view>
          <view v-for="day in weekDays" :key="day.value" class="day-col">
            <view v-for="course in getScheduleAt(day.value, slot.id)" :key="course.id" 
                  class="course-block" :style="{ background: getCourseColor(course.course_id) }">
              <text class="course-name">{{ course.course_name }}</text>
              <text class="course-room">{{ course.room_name }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  data() {
    return {
      currentWeek: 1,
      schedules: [],
      weekDays: [
        { label: '一', value: 1 }, { label: '二', value: 2 }, { label: '三', value: 3 },
        { label: '四', value: 4 }, { label: '五', value: 5 }, { label: '六', value: 6 }, { label: '日', value: 7 }
      ],
      timeSlots: [
        { id: 1, time: '08:00' }, { id: 2, time: '08:55' }, { id: 3, time: '10:00' }, { id: 4, time: '10:55' },
        { id: 5, time: '14:00' }, { id: 6, time: '14:55' }, { id: 7, time: '16:00' }, { id: 8, time: '16:55' }
      ],
      colors: ['#d4a574', '#c9956c', '#8fbc8f', '#b8956c', '#c97c5d', '#a67c52', '#6b8e6b']
    }
  },
  onShow() {
    this.fetchSchedule()
  },
  methods: {
    async fetchSchedule() {
      try {
        const res = await api.schedules.my({ week: this.currentWeek })
        if (res.success) this.schedules = res.data || []
      } catch (e) {}
    },
    changeWeek(delta) {
      this.currentWeek = Math.max(1, Math.min(20, this.currentWeek + delta))
      this.fetchSchedule()
    },
    isToday(day) {
      const today = new Date().getDay()
      return today === day || (today === 0 && day === 7)
    },
    getScheduleAt(day, slot) {
      return this.schedules.filter(s => s.day_of_week === day && this.getSlot(s.start_time) === slot)
    },
    getSlot(time) {
      if (!time) return 1
      const hour = parseInt(time.split(':')[0])
      if (hour < 9) return 1
      if (hour < 10) return 2
      if (hour < 11) return 3
      if (hour < 12) return 4
      if (hour < 15) return 5
      if (hour < 16) return 6
      if (hour < 17) return 7
      return 8
    },
    getCourseColor(id) {
      return this.colors[id % this.colors.length]
    }
  }
}
</script>

<style scoped>
.schedule-page { background: #faf8f5; min-height: 100vh; }

.week-selector { display: flex; align-items: center; justify-content: center; padding: 30rpx; background: #fff; }
.week-btn { width: 60rpx; height: 60rpx; background: #f0f0f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24rpx; color: #666; }
.week-text { font-size: 32rpx; font-weight: bold; margin: 0 40rpx; }

.schedule-container { background: #fff; margin: 20rpx; border-radius: 20rpx; overflow: hidden; }

.day-header { display: flex; border-bottom: 1rpx solid #eee; }
.time-col { width: 100rpx; padding: 20rpx 10rpx; text-align: center; background: #f8fafc; }
.day-col { flex: 1; padding: 20rpx 5rpx; text-align: center; }
.day-col.active { background: #faf5eb; }
.day-name { font-size: 26rpx; color: #333; }

.schedule-body { height: 900rpx; }
.time-row { display: flex; border-bottom: 1rpx solid #f0f0f0; min-height: 120rpx; }
.slot-num { display: block; font-size: 24rpx; font-weight: bold; color: #8b6914; }
.slot-time { display: block; font-size: 20rpx; color: #999; }

.course-block { padding: 10rpx; border-radius: 10rpx; margin: 5rpx; }
.course-name { display: block; font-size: 22rpx; color: #fff; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.course-room { display: block; font-size: 18rpx; color: rgba(255,255,255,0.8); margin-top: 5rpx; }
</style>
