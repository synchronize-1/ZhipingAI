<template>
  <div class="emotional-greeting">
    <!-- 主问候区域 -->
    <div class="greeting-main" :style="{ background: greetingBackground }">
      <div class="greeting-content">
        <div class="greeting-left">
          <div class="greeting-badge">
            <el-icon><component :is="greetingIcon" /></el-icon>
            <span>{{ timeLabel }}</span>
          </div>
          <h1 class="greeting-text">{{ greetingText }}，{{ userName }}！</h1>
          <p class="greeting-subtitle">{{ motivationalQuote }}</p>
          
          <!-- 天气提醒 -->
          <div class="weather-reminder" v-if="weatherReminder">
            <el-icon><component :is="weatherReminder.icon" /></el-icon>
            <span>{{ weatherReminder.text }}</span>
          </div>
        </div>
        
        <div class="greeting-right">
          <div class="greeting-illustration">
            <img :src="greetingImage" alt="greeting" />
          </div>
        </div>
      </div>
      
      <!-- 节日装饰 -->
      <div v-if="festivalDecor" class="festival-decor">
        <img :src="festivalDecor.image" :alt="festivalDecor.name" />
        <span>{{ festivalDecor.wish }}</span>
      </div>
    </div>

    <!-- 学习鼓励卡片 -->
    <div class="encouragement-cards">
      <div class="encourage-card streak-card">
        <div class="card-icon">
          <img src="https://img.icons8.com/fluency/48/fire-element.png" alt="streak" />
        </div>
        <div class="card-content">
          <h4>连续学习</h4>
          <p class="streak-number">{{ streakDays }}</p>
          <span class="streak-label">天</span>
        </div>
        <div class="card-badge" v-if="streakDays >= 7">🔥 热门</div>
      </div>

      <div class="encourage-card task-card">
        <div class="card-icon">
          <img src="https://img.icons8.com/fluency/48/task-completed.png" alt="tasks" />
        </div>
        <div class="card-content">
          <h4>今日待办</h4>
          <p class="task-progress">
            <span class="completed">{{ completedTasks }}</span>
            <span class="separator">/</span>
            <span class="total">{{ totalTasks }}</span>
          </p>
        </div>
        <el-progress 
          :percentage="taskProgress" 
          :stroke-width="6" 
          :show-text="false"
          :color="taskProgressColor"
        />
      </div>

      <div class="encourage-card achievement-card">
        <div class="card-icon">
          <img src="https://img.icons8.com/fluency/48/trophy.png" alt="achievement" />
        </div>
        <div class="card-content">
          <h4>最新成就</h4>
          <p class="achievement-name">{{ latestAchievement.name }}</p>
          <span class="achievement-time">{{ latestAchievement.time }}</span>
        </div>
        <div class="achievement-badge">
          <img :src="latestAchievement.badge" alt="badge" />
        </div>
      </div>

      <div class="encourage-card quote-card">
        <div class="card-icon">
          <img src="https://img.icons8.com/fluency/48/quote-left.png" alt="quote" />
        </div>
        <div class="card-content">
          <h4>每日一言</h4>
          <p class="daily-quote">"{{ dailyQuote }}"</p>
          <span class="quote-author">—— {{ quoteAuthor }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { Sunny, Moon, Sunrise, Cloudy, Umbrella, Wind } from '@element-plus/icons-vue'

const userStore = useUserStore()

const userName = computed(() => userStore.user?.name || '同学')

// 时间相关
const currentHour = ref(new Date().getHours())

const timeLabel = computed(() => {
  if (currentHour.value >= 5 && currentHour.value < 12) return '早安'
  if (currentHour.value >= 12 && currentHour.value < 14) return '午安'
  if (currentHour.value >= 14 && currentHour.value < 18) return '下午好'
  if (currentHour.value >= 18 && currentHour.value < 22) return '晚上好'
  return '夜深了'
})

const greetingText = computed(() => {
  if (currentHour.value >= 5 && currentHour.value < 12) return '早上好'
  if (currentHour.value >= 12 && currentHour.value < 14) return '中午好'
  if (currentHour.value >= 14 && currentHour.value < 18) return '下午好'
  if (currentHour.value >= 18 && currentHour.value < 22) return '晚上好'
  return '夜深了，注意休息'
})

const greetingIcon = computed(() => {
  if (currentHour.value >= 5 && currentHour.value < 12) return 'Sunrise'
  if (currentHour.value >= 12 && currentHour.value < 18) return 'Sunny'
  return 'Moon'
})

const greetingBackground = computed(() => {
  if (currentHour.value >= 5 && currentHour.value < 12) {
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
  }
  if (currentHour.value >= 12 && currentHour.value < 18) {
    return 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #4facfe 100%)'
  }
  return 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
})

const greetingImage = computed(() => {
  if (currentHour.value >= 5 && currentHour.value < 12) {
    return 'https://img.icons8.com/fluency/128/sunrise.png'
  }
  if (currentHour.value >= 12 && currentHour.value < 18) {
    return 'https://img.icons8.com/fluency/128/sun.png'
  }
  return 'https://img.icons8.com/fluency/128/bright-moon.png'
})

// 励志名言
const motivationalQuotes = [
  { text: '学如逆水行舟，不进则退', author: '古训' },
  { text: '千里之行，始于足下', author: '老子' },
  { text: '业精于勤，荒于嬉', author: '韩愈' },
  { text: '书山有路勤为径，学海无涯苦作舟', author: '古训' },
  { text: '不积跬步，无以至千里', author: '荀子' },
  { text: '天行健，君子以自强不息', author: '周易' },
  { text: '知之者不如好之者，好之者不如乐之者', author: '孔子' }
]

const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
const motivationalQuote = ref('今天也是充满希望的一天，加油！')
const dailyQuote = ref(randomQuote.text)
const quoteAuthor = ref(randomQuote.author)

// 天气提醒
const weatherReminder = ref(null)

// 模拟天气数据
const checkWeather = () => {
  const weather = {
    temp: 18,
    condition: 'cloudy',
    humidity: 75
  }
  
  if (weather.condition === 'rain') {
    weatherReminder.value = {
      icon: 'Umbrella',
      text: '今天有雨，记得带伞哦！'
    }
  } else if (weather.temp > 30) {
    weatherReminder.value = {
      icon: 'Sunny',
      text: '今天气温较高，注意防暑！'
    }
  } else if (weather.temp < 10) {
    weatherReminder.value = {
      icon: 'Wind',
      text: '天气转凉，注意添衣保暖！'
    }
  } else if (weather.humidity > 80) {
    weatherReminder.value = {
      icon: 'Cloudy',
      text: '今天湿度较大，注意防潮！'
    }
  }
}

// 节日检测
const festivalDecor = ref(null)

const checkFestival = () => {
  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()
  
  const festivals = [
    { month: 1, day: 1, name: '元旦', wish: '新年快乐！祝你学业进步！🎉', image: 'https://img.icons8.com/fluency/64/confetti.png' },
    { month: 5, day: 1, name: '劳动节', wish: '劳动最光荣！休息也很重要哦~', image: 'https://img.icons8.com/fluency/64/worker-male.png' },
    { month: 6, day: 1, name: '儿童节', wish: '永葆童心，快乐学习！', image: 'https://img.icons8.com/fluency/64/balloon.png' },
    { month: 9, day: 10, name: '教师节', wish: '感恩师恩，祝老师们节日快乐！', image: 'https://img.icons8.com/fluency/64/teacher.png' },
    { month: 10, day: 1, name: '国庆节', wish: '祝祖国繁荣昌盛！🇨🇳', image: 'https://img.icons8.com/fluency/64/china.png' },
    { month: 12, day: 25, name: '圣诞节', wish: 'Merry Christmas! 🎄', image: 'https://img.icons8.com/fluency/64/christmas-tree.png' }
  ]
  
  const festival = festivals.find(f => f.month === month && f.day === day)
  if (festival) {
    festivalDecor.value = festival
  }
}

// 学习数据
const streakDays = ref(7)
const completedTasks = ref(3)
const totalTasks = ref(5)

const taskProgress = computed(() => {
  if (totalTasks.value === 0) return 0
  return Math.round((completedTasks.value / totalTasks.value) * 100)
})

const taskProgressColor = computed(() => {
  if (taskProgress.value < 30) return '#f56c6c'
  if (taskProgress.value < 70) return '#e6a23c'
  return '#67c23a'
})

// 最新成就
const latestAchievement = ref({
  name: '学习达人',
  time: '2天前',
  badge: 'https://img.icons8.com/fluency/48/medal.png'
})

onMounted(() => {
  checkWeather()
  checkFestival()
})
</script>

<style scoped>
.emotional-greeting {
  margin-bottom: 24px;
}

/* 主问候区域 */
.greeting-main {
  position: relative;
  border-radius: 24px;
  padding: 32px;
  overflow: hidden;
  margin-bottom: 20px;
}

.greeting-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.greeting-left {
  flex: 1;
}

.greeting-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  color: white;
  font-size: 13px;
  margin-bottom: 16px;
}

.greeting-text {
  font-size: 36px;
  font-weight: 700;
  color: white;
  margin: 0 0 12px 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.greeting-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 16px 0;
  max-width: 400px;
}

.weather-reminder {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.greeting-right {
  flex-shrink: 0;
}

.greeting-illustration img {
  width: 120px;
  height: 120px;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.2));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* 节日装饰 */
.festival-decor {
  position: absolute;
  top: 16px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  color: white;
  font-size: 14px;
  z-index: 2;
}

.festival-decor img {
  width: 28px;
  height: 28px;
}

/* 鼓励卡片 */
.encouragement-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.encourage-card {
  background: linear-gradient(135deg, #1e1e2f 0%, #2d2d44 100%);
  border-radius: 20px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.encourage-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

.card-icon {
  margin-bottom: 12px;
}

.card-icon img {
  width: 40px;
  height: 40px;
}

.card-content h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

/* 连续学习卡片 */
.streak-card .streak-number {
  font-size: 42px;
  font-weight: 700;
  color: #f59e0b;
  margin: 0;
  display: inline;
}

.streak-card .streak-label {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 4px;
}

.card-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-radius: 12px;
  font-size: 11px;
  color: white;
  font-weight: 600;
}

/* 任务卡片 */
.task-card .task-progress {
  margin: 0 0 12px 0;
}

.task-card .completed {
  font-size: 32px;
  font-weight: 700;
  color: #10b981;
}

.task-card .separator {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.3);
  margin: 0 4px;
}

.task-card .total {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.5);
}

/* 成就卡片 */
.achievement-card .achievement-name {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0 0 4px 0;
}

.achievement-card .achievement-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.achievement-badge {
  position: absolute;
  top: 16px;
  right: 16px;
}

.achievement-badge img {
  width: 44px;
  height: 44px;
}

/* 每日一言卡片 */
.quote-card .daily-quote {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
  font-style: italic;
  line-height: 1.6;
  margin: 0 0 8px 0;
}

.quote-card .quote-author {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* 响应式 */
@media (max-width: 1200px) {
  .encouragement-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .greeting-content {
    flex-direction: column;
    text-align: center;
  }
  
  .greeting-text {
    font-size: 28px;
  }
  
  .greeting-right {
    margin-top: 20px;
  }
  
  .encouragement-cards {
    grid-template-columns: 1fr;
  }
}
</style>
