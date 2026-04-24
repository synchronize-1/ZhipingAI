<template>
  <view class="assistant-page">
    <view class="header">
      <view class="header-content">
        <text class="title">🤖 校园智能助手</text>
        <text class="subtitle">语音交互 · 智能问答 · 一键服务</text>
      </view>
      <view class="status-bar">
        <view class="status-item"><text class="status-dot online"></text><text>在线</text></view>
        <view class="status-item"><text>响应时间小于1秒</text></view>
      </view>
    </view>

    <view class="chat-container">
      <scroll-view scroll-y class="messages" :scroll-top="scrollTop" :scroll-with-animation="true">
        <view v-for="(msg, index) in messages" :key="index" class="message" :class="msg.type">
          <view class="avatar">{{ msg.type === 'user' ? '👤' : '🤖' }}</view>
          <view class="msg-content">
            <view class="bubble">
              <text>{{ msg.content }}</text>
            </view>
            <text class="msg-time">{{ msg.time || '' }}</text>
            <!-- 快捷操作按钮 -->
            <view v-if="msg.actions && msg.actions.length" class="msg-actions">
              <view v-for="act in msg.actions" :key="act.text" class="action-btn" @tap="executeAction(act)">
                {{ act.icon }} {{ act.text }}
              </view>
            </view>
          </view>
        </view>
        <view v-if="isTyping" class="message assistant">
          <view class="avatar">🤖</view>
          <view class="bubble typing">
            <view class="typing-dot"></view>
            <view class="typing-dot"></view>
            <view class="typing-dot"></view>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="input-area">
      <!-- 快捷功能入口 -->
      <view class="quick-services">
        <view class="service-btn" @tap="quickService('scan')">
          <text class="service-icon">📷</text>
          <text>扫码</text>
        </view>
        <view class="service-btn" @tap="quickService('repair')">
          <text class="service-icon">🔧</text>
          <text>报修</text>
        </view>
        <view class="service-btn" @tap="quickService('borrow')">
          <text class="service-icon">📚</text>
          <text>借书</text>
        </view>
        <view class="service-btn" @tap="quickService('checkin')">
          <text class="service-icon">✅</text>
          <text>签到</text>
        </view>
      </view>
      
      <view class="quick-actions">
        <scroll-view scroll-x class="actions-scroll">
          <view v-for="action in quickActions" :key="action.text" class="quick-btn" @tap="sendQuickAction(action.text)">
            {{ action.icon }} {{ action.text }}
          </view>
        </scroll-view>
      </view>
      
      <view class="input-row">
        <input v-model="inputText" placeholder="输入问题或语音提问..." class="text-input" @confirm="sendMessage" />
        <view class="voice-btn" :class="{ recording: isRecording }" @longpress="startRecording" @touchend="stopRecording">
          <text>{{ isRecording ? '🔴' : '🎤' }}</text>
        </view>
        <view class="send-btn" @tap="sendMessage">
          <text>发送</text>
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
      messages: [],
      inputText: '',
      isRecording: false,
      isTyping: false,
      scrollTop: 0,
      quickActions: [
        { icon: '📅', text: '今日课表' },
        { icon: '🏫', text: '空闲教室' },
        { icon: '🍽️', text: '食堂人流' },
        { icon: '📚', text: '图书馆' },
        { icon: '🗺️', text: '校园导航' },
        { icon: '📢', text: '最新通知' }
      ],
      user: null
    }
  },
  onLoad() {
    this.user = uni.getStorageSync('user') || { name: 'christie' }
    this.addWelcomeMessage()
  },
  methods: {
    addWelcomeMessage() {
      const hour = new Date().getHours()
      let greeting = '你好'
      if (hour < 12) greeting = '早上好'
      else if (hour < 18) greeting = '下午好'
      else greeting = '晚上好'
      
      this.messages.push({
        type: 'assistant',
        content: `${greeting}，${this.user?.name || '同学'}！我是校园智能助手小智，可以帮你查询课表、空闲教室、食堂人流等信息，也可以快速帮你报修、借书、签到。有什么需要帮忙的吗？`,
        time: this.formatTime(new Date()),
        actions: [
          { icon: '📅', text: '查看今日课表', action: 'schedule' },
          { icon: '🏫', text: '查询空闲教室', action: 'rooms' }
        ]
      })
    },
    formatTime(date) {
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    async sendMessage() {
      if (!this.inputText.trim()) return
      
      const userMsg = this.inputText.trim()
      this.messages.push({ 
        type: 'user', 
        content: userMsg,
        time: this.formatTime(new Date())
      })
      this.inputText = ''
      this.scrollToBottom()
      
      this.isTyping = true
      
      // 模拟AI思考时间
      setTimeout(() => {
        this.isTyping = false
        const reply = this.getAIReply(userMsg)
        this.messages.push({ 
          type: 'assistant', 
          content: reply.content,
          time: this.formatTime(new Date()),
          actions: reply.actions
        })
        this.scrollToBottom()
      }, 800 + Math.random() * 500)
    },
    sendQuickAction(action) {
      this.inputText = action
      this.sendMessage()
    },
    executeAction(action) {
      if (action.action === 'schedule') {
        uni.switchTab({ url: '/pages/schedule/schedule' })
      } else if (action.action === 'rooms') {
        uni.navigateTo({ url: '/pages/map/map' })
      } else if (action.action === 'canteen') {
        uni.navigateTo({ url: '/pages/canteen/canteen' })
      } else if (action.action === 'navigate') {
        uni.navigateTo({ url: '/pages/map/map' })
      }
    },
    quickService(type) {
      if (type === 'scan') {
        uni.scanCode({
          success: (res) => {
            this.messages.push({
              type: 'assistant',
              content: `扫码成功！识别内容：${res.result}`,
              time: this.formatTime(new Date())
            })
            this.scrollToBottom()
          },
          fail: () => {
            uni.showToast({ title: '扫码功能需要真机环境', icon: 'none' })
          }
        })
      } else if (type === 'repair') {
        uni.navigateTo({ url: '/pages/services/services' })
      } else if (type === 'borrow') {
        uni.navigateTo({ url: '/pages/services/services' })
      } else if (type === 'checkin') {
        this.messages.push({
          type: 'user',
          content: '快速签到',
          time: this.formatTime(new Date())
        })
        setTimeout(() => {
          this.messages.push({
            type: 'assistant',
            content: '✅ 签到成功！\n\n课程：数据结构\n时间：2024-03-15 08:02:35\n位置：教学楼A101\n\n您是第15位签到的同学，继续保持！',
            time: this.formatTime(new Date())
          })
          this.scrollToBottom()
        }, 500)
        this.scrollToBottom()
      }
    },
    getAIReply(question) {
      const q = question.toLowerCase()
      
      if (q.includes('课表') || q.includes('课程') || q.includes('今天')) {
        return {
          content: '📅 今日课表\n\n1️⃣ 数据结构\n⏰ 08:00-09:40 | 📍 A101\n👨‍🏫 张教授\n\n2️⃣ 高等数学\n⏰ 10:00-11:40 | 📍 B201\n👨‍🏫 李教授\n\n3️⃣ 计算机网络\n⏰ 14:00-15:40 | 📍 A301\n👨‍🏫 王教授\n\n💡 提示：第一节课还有30分钟开始，教室距离您约200米',
          actions: [
            { icon: '🗺️', text: '导航去教室', action: 'navigate' }
          ]
        }
      }
      
      if (q.includes('教室') || q.includes('空闲')) {
        return {
          content: '🏫 当前空闲教室\n\n📍 教学楼A\nA102 (50人) | A103 (80人) | A201 (100人)\n\n📍 教学楼B\nB101 (60人) | B102 (40人) | B301 (80人)\n\n📍 实验楼\nLAB102 (30人) | LAB103 (30人)\n\n💡 建议：A102距离您最近，约150米',
          actions: [
            { icon: '📍', text: '查看地图', action: 'rooms' }
          ]
        }
      }
      
      if (q.includes('食堂') || q.includes('人流') || q.includes('吃')) {
        return {
          content: '🍽️ 食堂实时人流\n\n🟢 第一食堂 | 40% | 空闲\n约320人 | 推荐就餐\n\n🟢 第二食堂 | 30% | 空闲\n约180人 | 人最少\n\n🟡 教工食堂 | 65% | 适中\n约130人\n\n💡 建议前往第二食堂，人流最少！\n🔥 今日推荐：红烧肉、宫保鸡丁',
          actions: [
            { icon: '🍜', text: '去点餐', action: 'canteen' },
            { icon: '🗺️', text: '导航去食堂', action: 'navigate' }
          ]
        }
      }
      
      if (q.includes('图书') || q.includes('借书')) {
        return {
          content: '📚 图书馆信息\n\n⏰ 开放时间：8:00-22:00\n👥 当前人数：约320人\n📊 座位使用率：65%\n\n🟢 推荐区域：\n• 三楼自习区 - 较空闲\n• 五楼研讨室 - 有空位\n\n📖 您有1本书即将到期：\n《数据结构与算法》- 还有3天',
          actions: []
        }
      }
      
      if (q.includes('通知') || q.includes('消息')) {
        return {
          content: '📢 最新通知\n\n1️⃣ 【重要】期中考试安排\n📅 3月20日-25日\n\n2️⃣ 【活动】创新创业大赛报名\n⏰ 截止：3月18日\n\n3️⃣ 【服务】图书馆延长开放通知\n考试期间开放至23:00',
          actions: []
        }
      }
      
      if (q.includes('导航') || q.includes('怎么走') || q.includes('在哪')) {
        return {
          content: '🗺️ 校园导航\n\n请问您要去哪里？\n\n常用目的地：\n📍 教学楼A - 约200米\n📍 图书馆 - 约150米\n📍 第一食堂 - 约120米\n📍 体育馆 - 约300米',
          actions: [
            { icon: '🗺️', text: '打开地图', action: 'navigate' }
          ]
        }
      }
      
      if (q.includes('报修')) {
        return {
          content: '🔧 报修服务\n\n请描述您要报修的问题：\n• 位置（如：宿舍3号楼201）\n• 问题类型（如：水电、网络、家具）\n• 具体描述\n\n或者您可以点击下方按钮快速报修',
          actions: [
            { icon: '🔧', text: '快速报修', action: 'repair' }
          ]
        }
      }
      
      if (q.includes('天气')) {
        return {
          content: '🌤️ 今日天气\n\n温度：18-25°C\n天气：多云转晴\n空气质量：良好\n\n💡 建议：适合户外活动，注意防晒',
          actions: []
        }
      }
      
      return {
        content: '抱歉，我暂时无法理解您的问题。您可以尝试：\n\n• 查询今日课表\n• 查找空闲教室\n• 查看食堂人流\n• 图书馆信息\n\n或者直接点击下方快捷按钮~',
        actions: []
      }
    },
    startRecording() {
      this.isRecording = true
      uni.showToast({ title: '正在录音...', icon: 'none', duration: 10000 })
      
      // 模拟语音识别
      this.recordTimeout = setTimeout(() => {
        this.stopRecording()
        this.inputText = '查询今天的课表'
        this.sendMessage()
      }, 2000)
    },
    stopRecording() {
      if (this.recordTimeout) {
        clearTimeout(this.recordTimeout)
      }
      this.isRecording = false
      uni.hideToast()
    },
    scrollToBottom() {
      this.$nextTick(() => {
        this.scrollTop = this.scrollTop === 99998 ? 99999 : 99998
      })
    }
  }
}
</script>

<style scoped>
.assistant-page { display: flex; flex-direction: column; height: 100vh; background: #faf8f5; }

.header { padding: 80rpx 30rpx 30rpx; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); }
.header-content { text-align: center; margin-bottom: 20rpx; }
.title { display: block; font-size: 40rpx; font-weight: bold; color: #fff; }
.subtitle { display: block; font-size: 24rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; }
.status-bar { display: flex; justify-content: center; gap: 30rpx; }
.status-item { display: flex; align-items: center; gap: 8rpx; font-size: 22rpx; color: rgba(255,255,255,0.9); }
.status-dot { width: 16rpx; height: 16rpx; border-radius: 50%; }
.status-dot.online { background: #4ade80; box-shadow: 0 0 8rpx #4ade80; }

.chat-container { flex: 1; overflow: hidden; }
.messages { height: 100%; padding: 20rpx; }

.message { display: flex; margin-bottom: 30rpx; align-items: flex-start; }
.message.user { flex-direction: row-reverse; }
.avatar { width: 70rpx; height: 70rpx; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; font-size: 32rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1); flex-shrink: 0; }
.msg-content { max-width: 75%; margin: 0 15rpx; }
.bubble { padding: 24rpx; border-radius: 20rpx; font-size: 28rpx; line-height: 1.6; white-space: pre-wrap; }
.message.assistant .bubble { background: #fff; color: #333; border-top-left-radius: 6rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05); }
.message.user .bubble { background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; border-top-right-radius: 6rpx; }
.msg-time { display: block; font-size: 20rpx; color: #999; margin-top: 8rpx; }
.message.user .msg-time { text-align: right; }

.msg-actions { display: flex; flex-wrap: wrap; gap: 15rpx; margin-top: 15rpx; }
.action-btn { padding: 12rpx 24rpx; background: linear-gradient(135deg, #f5e6d3 0%, #e8d4be 100%); border-radius: 20rpx; font-size: 24rpx; color: #8b6914; }

.bubble.typing { display: flex; gap: 8rpx; padding: 30rpx; }
.typing-dot { width: 16rpx; height: 16rpx; background: #d4a574; border-radius: 50%; animation: typing 1.4s infinite; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-10rpx); } }

.input-area { background: #fff; padding: 20rpx; padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05); }

.quick-services { display: flex; justify-content: space-around; padding: 15rpx 0 20rpx; border-bottom: 1rpx solid #f0f0f0; margin-bottom: 15rpx; }
.service-btn { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.service-icon { font-size: 40rpx; }
.service-btn text:last-child { font-size: 22rpx; color: #666; }

.quick-actions { margin-bottom: 15rpx; }
.actions-scroll { white-space: nowrap; }
.quick-btn { display: inline-block; padding: 14rpx 24rpx; background: #faf8f5; border-radius: 30rpx; font-size: 24rpx; color: #666; margin-right: 15rpx; }

.input-row { display: flex; align-items: center; gap: 15rpx; }
.text-input { flex: 1; height: 80rpx; background: #f5f5f5; border-radius: 40rpx; padding: 0 30rpx; font-size: 28rpx; }
.voice-btn { width: 80rpx; height: 80rpx; background: #f5f5f5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36rpx; transition: all 0.2s; }
.voice-btn.recording { background: #fee2e2; transform: scale(1.1); }
.send-btn { padding: 20rpx 30rpx; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; border-radius: 40rpx; font-size: 28rpx; }
</style>
