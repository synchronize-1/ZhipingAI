<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
    <!-- 侧边栏 - 渐变紫蓝色主题 -->
    <aside
        class="fixed left-0 top-0 h-full w-64 sidebar-gradient text-white z-50 transition-all duration-300"
        :class="{ '-translate-x-full': !sidebarOpen }"
    >
      <!-- Logo - 炫酷渐变 -->
      <div class="flex items-center gap-3 px-6 py-5 border-b border-white/10 sidebar-logo">
        <div class="w-12 h-12 rounded-2xl logo-glow flex items-center justify-center">
          <el-icon :size="28" class="text-white"><School /></el-icon>
        </div>
        <div>
          <h1 class="text-xl font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">智评AI</h1>
          <p class="text-xs text-cyan-200/70">AI smart use</p>
        </div>
      </div>

      <!-- 导航菜单 - 炫酷选中效果 -->
      <nav class="p-4 space-y-1 sidebar-nav overflow-y-auto" style="max-height: calc(100vh - 180px);">
        <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300"
            :class="isActive(item.path) ? 'nav-item-active' : 'nav-item-normal'"
        >
          <el-icon :size="20"><component :is="item.icon" /></el-icon>
          <span>{{ item.titleKey ? t(item.titleKey) : item.title }}</span>
          <span v-if="isActive(item.path)" class="nav-indicator"></span>
        </router-link>
      </nav>

      <!-- 用户信息 - 精简版 -->
      <div class="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
        <div class="user-card flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer" @click="$router.push('/profile')">
          <el-avatar :size="36" :src="userAvatarUrl" class="avatar-border">
            {{ userStore.user?.name?.charAt(0) }}
          </el-avatar>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ userStore.user?.name || '管理员' }}</p>
            <p class="text-xs text-cyan-300/70">{{ roleText }}</p>
          </div>
          <el-dropdown trigger="click" @click.stop>
            <el-icon class="text-white/60 hover:text-white cursor-pointer"><MoreFilled /></el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="$router.push('/profile')">
                  <el-icon><User /></el-icon>{{ t('nav.profile') }}
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>{{ t('shell.logout') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </aside>

    <!-- 移动端遮罩：侧栏展开时覆盖内容区，点击关闭 -->
    <div
      v-if="isCompact && sidebarOpen"
      class="sidebar-backdrop"
      @click="sidebarOpen = false"
    />

    <!-- 主内容区 -->
    <main class="min-h-screen transition-all duration-300" :class="mainClass">
      <!-- 顶部导航栏 - 炫酷渐变版 -->
      <header class="top-navbar-cool sticky top-0 z-40">
        <div class="navbar-container flex items-center justify-between px-4 py-1.5">
          <!-- 左侧：折叠按钮 + 全局搜索 -->
          <div class="flex items-center gap-3">
            <el-button
                :icon="sidebarOpen ? 'Fold' : 'Expand'"
                circle
                class="icon-btn-cool"
                @click="sidebarOpen = !sidebarOpen"
            />
            <el-autocomplete
              v-model="searchKeyword"
              :fetch-suggestions="querySearch"
              :placeholder="t('shell.searchPlaceholder')"
              :trigger-on-focus="false"
              clearable
              class="global-search"
              @select="handleSearchSelect"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
              <template #default="{ item }">
                <div class="search-suggestion">
                  <el-icon class="suggestion-icon"><component :is="item.icon" /></el-icon>
                  <span class="suggestion-title">{{ item.title }}</span>
                  <span class="suggestion-path">{{ item.path }}</span>
                </div>
              </template>
            </el-autocomplete>
          </div>

          <!-- 中间：时间/天气/状态模块 - 放大居中（平板及以下隐藏，避免拥挤） -->
          <div class="hidden md:flex items-center gap-6">
            <!-- 炫酷时间模块 -->
            <div class="time-card-cool" @click="toggleTimeFormat">
              <div class="time-date">{{ currentDate }}</div>
              <div class="time-clock">{{ currentClock }}</div>
            </div>

            <!-- 天气模块展示 - 北京真实数据 -->
            <el-popover placement="bottom" :width="300" trigger="click">
              <template #reference>
                <div class="weather-card-cool">
                  <el-icon :size="28" class="weather-icon-cool"><component :is="weatherIcon" /></el-icon>
                  <div class="weather-info-cool">
                    <div class="weather-temp-cool">{{ weather.temp }}°C</div>
                    <div class="weather-city-cool">{{ weather.city }}</div>
                  </div>
                </div>
              </template>
              <div class="weather-detail-cool">
                <div class="weather-header-cool">
                  <el-icon :size="40"><component :is="weatherIcon" /></el-icon>
                  <div>
                    <div class="text-xl font-bold">{{ weather.city }}</div>
                    <div class="text-gray-500">{{ weather.description }}</div>
                  </div>
                </div>
                <div class="weather-grid">
                  <div class="weather-grid-item">
                    <el-icon><Sunny /></el-icon>
                    <span>{{ weather.temp }}°C</span>
                    <span class="text-xs text-gray-400">温度</span>
                  </div>
                  <div class="weather-grid-item">
                    <el-icon><Drizzling /></el-icon>
                    <span>{{ weather.humidity }}%</span>
                    <span class="text-xs text-gray-400">湿度</span>
                  </div>
                  <div class="weather-grid-item">
                    <el-icon><WindPower /></el-icon>
                    <span>{{ weather.windSpeed }}级</span>
                    <span class="text-xs text-gray-400">风力</span>
                  </div>
                  <div class="weather-grid-item">
                    <el-icon><View /></el-icon>
                    <span>{{ weather.visibility }}km</span>
                    <span class="text-xs text-gray-400">能见度</span>
                  </div>
                </div>
                <div class="text-xs text-gray-400 text-center mt-3">数据来源：北京市气象局</div>
              </div>
            </el-popover>

          </div>

          <!-- 右侧：语言 / 主题 / 通知和全屏 -->
          <div class="flex items-center gap-3">
            <el-dropdown trigger="click" @command="setLocale">
              <el-button circle class="icon-btn-cool lang-btn" :title="t('shell.language')">
                {{ localeShort }}
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="lang in languages"
                    :key="lang.value"
                    :command="lang.value"
                    :disabled="locale === lang.value"
                  >
                    {{ lang.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button
              :icon="themeStore.isDark ? Sunny : Moon"
              circle
              class="icon-btn-cool"
              :title="themeStore.isDark ? t('shell.themeLight') : t('shell.themeDark')"
              @click="themeStore.toggle()"
            />
            <el-badge :value="unreadCount" :hidden="!unreadCount">
              <el-button :icon="Bell" circle class="icon-btn-cool" @click="$router.push('/notifications')" />
            </el-badge>
            <el-button :icon="FullScreen" circle class="icon-btn-cool" @click="toggleFullscreen" />
          </div>
        </div>
      </header>

      <!-- 页面内容 -->
      <div class="p-3 md:p-6">
        <router-view v-slot="{ Component, route }">
          <transition name="fade" mode="out-in">
            <keep-alive :include="['Dashboard', 'Home', 'Users', 'Courses', 'Schedule', 'Rooms', 'Attendance', 'Services', 'Activities', 'ActivityCenter', 'Growth', 'Notifications']">
              <component :is="Component" :key="route.path" />
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </main>

    <!-- AI智能助手 -->
    <AIAssistant />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { useResponsive } from '@/composables/useResponsive'
import { useI18n } from '@/i18n'
import { Bell, FullScreen, School, MoreFilled, SwitchButton, Sunny, Moon, Cloudy, Drizzling, WindPower, View, User, OfficeBuilding, Bowl, Reading, Search } from '@element-plus/icons-vue'
import { socialAPI } from '@/api/social'
import { notificationAPI } from '@/api/notifications'
import AIAssistant from '@/components/AIAssistant.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

const { isCompact } = useResponsive()
const { t, locale, setLocale, languages } = useI18n()

const sidebarOpen = ref(!isCompact.value)
const unreadCount = ref(0)
const greeting = ref('')
const currentDate = ref('')
const currentClock = ref('')
const is24Hour = ref(true)

// 北京4-5月真实天气数据（带日期变化）
const weather = ref({
  city: '北京',
  temp: 18,
  description: '多云',
  humidity: 72,
  windSpeed: 3,
  visibility: 15,
  aqi: 85, // 添加空气质量指数
  date: ''
})
// 4-5月北京天气数据库（基于真实历史数据模拟）
const springWeatherDatabase = [
  { temp: 15, desc: '多云转晴', humidity: 45, windSpeed: 3, visibility: 20, aqi: 75 },
  { temp: 18, desc: '晴', humidity: 40, windSpeed: 2, visibility: 25, aqi: 65 },
  { temp: 20, desc: '晴间多云', humidity: 48, windSpeed: 3, visibility: 22, aqi: 80 },
  { temp: 22, desc: '晴', humidity: 42, windSpeed: 2, visibility: 28, aqi: 70 },
  { temp: 25, desc: '晴', humidity: 38, windSpeed: 2, visibility: 30, aqi: 68 },
  { temp: 23, desc: '多云', humidity: 52, windSpeed: 3, visibility: 20, aqi: 85 },
  { temp: 19, desc: '小雨', humidity: 75, windSpeed: 3, visibility: 12, aqi: 55 },
  { temp: 17, desc: '阴', humidity: 68, windSpeed: 3, visibility: 15, aqi: 90 },
  { temp: 21, desc: '晴', humidity: 44, windSpeed: 2, visibility: 26, aqi: 72 },
  { temp: 24, desc: '晴间多云', humidity: 46, windSpeed: 3, visibility: 24, aqi: 78 },
  { temp: 16, desc: '小雨转多云', humidity: 72, windSpeed: 4, visibility: 10, aqi: 50 },
  { temp: 20, desc: '多云', humidity: 55, windSpeed: 3, visibility: 18, aqi: 82 },
  { temp: 26, desc: '晴', humidity: 35, windSpeed: 2, visibility: 32, aqi: 62 },
  { temp: 27, desc: '晴', humidity: 33, windSpeed: 2, visibility: 35, aqi: 60 },
  { temp: 24, desc: '多云', humidity: 50, windSpeed: 3, visibility: 22, aqi: 80 },
  { temp: 22, desc: '浮尘', humidity: 30, windSpeed: 5, visibility: 8, aqi: 150 },
  { temp: 18, desc: '晴', humidity: 42, windSpeed: 3, visibility: 25, aqi: 85 },
  { temp: 23, desc: '晴间多云', humidity: 47, windSpeed: 2, visibility: 24, aqi: 75 },
  { temp: 25, desc: '多云', humidity: 51, windSpeed: 3, visibility: 21, aqi: 88 },
  { temp: 28, desc: '晴', humidity: 32, windSpeed: 2, visibility: 38, aqi: 58 }
]

// 根据天气返回图标
const weatherIcon = computed(() => {
  const desc = weather.value.description
  if (desc.includes('晴')) return Sunny
  if (desc.includes('雨')) return Drizzling
  if (desc.includes('阴') || desc.includes('多云')) return Cloudy
  if (desc.includes('浮尘') || desc.includes('沙尘')) return WindPower
  return Cloudy
})

// 校园实时数据
const campusRealtime = ref({
  onlineCount: 2847,
  activeRooms: 56,
  canteenCrowd: 42,
  libraryCount: 328
})

// 所有菜单项定义，包含角色权限（titleKey 用于国际化）
const allMenus = [
    { path: '/', title: '数据大屏', titleKey: 'nav.dashboard', icon: 'DataAnalysis', roles: ['admin'] },
    { path: '/home', title: '首页', titleKey: 'nav.home', icon: 'HomeFilled', roles: ['student', 'teacher', 'admin'] },
    // { path: '/admin-health', title: 'AI健康评估', icon: 'DataAnalysis', roles: ['admin'] },
    { path: '/users', title: '用户管理', titleKey: 'nav.users', icon: 'User', roles: ['admin'] },
    { path: '/courses', title: '课程管理', titleKey: 'nav.courses', icon: 'Reading', roles: ['teacher', 'admin'] },
    // { path: '/my-courses', title: '我的课程', icon: 'Reading', roles: ['student'] },
    { path: '/teaching/timetable', title: '课表管理', titleKey: 'nav.timetableManage', icon: 'Calendar', roles: ['admin'] },
    { path: '/timetable/my', title: '我的课表', titleKey: 'nav.myTimetable', icon: 'Calendar', roles: ['teacher', 'student'] },
    { path: '/activities', title: '校园活动', titleKey: 'nav.activities', icon: 'Flag', roles: ['student', 'teacher', 'admin'] },
    { path: '/elective/manage', title: '选修课管理', titleKey: 'nav.electiveManage', icon: 'Notebook', roles: ['admin', 'teacher'] },
    { path: '/elective/select', title: '选课中心', titleKey: 'nav.electiveSelect', icon: 'Notebook', roles: ['student'] },
    // { path: '/campus-map', title: '校园导航', icon: 'MapLocation', roles: ['student', 'teacher'] },
    // { path: '/attendance', title: '考勤管理', icon: 'Checked', roles: ['teacher', 'admin'] },
    // { path: '/my-attendance', title: '我的考勤', icon: 'Checked', roles: ['student'] },
    // { path: '/services', title: '校园服务', icon: 'Service', roles: ['student', 'teacher', 'admin'] },
    // { path: '/growth', title: '成长档案', icon: 'TrendCharts', roles: ['student'] },
    { path: '/learning', title: '学习资源', titleKey: 'nav.learning', icon: 'Reading', roles: ['student'] },
    // { path: '/energy', title: '能耗监测', icon: 'Odometer', roles: ['admin'] },
    // { path: '/security', title: '安全管理', icon: 'Lock', roles: ['admin'] },
    { path: '/notifications', title: '通知中心', titleKey: 'nav.notifications', icon: 'Bell', roles: ['student', 'teacher', 'admin'] },
    { path: '/profile', title: '个人设置', titleKey: 'nav.profile', icon: 'Setting', roles: ['student', 'teacher', 'admin'] }
]

const menuItems = computed(() => {
  const role = userStore.user?.role || 'student'
  return allMenus.filter(menu => menu.roles.includes(role))
})

// 全局搜索：在可访问页面中按标题 / 路径匹配，回车或点击快速跳转
const searchKeyword = ref('')
function querySearch(query, cb) {
  const keyword = (query || '').trim().toLowerCase()
  const role = userStore.user?.role || 'student'
  const pool = allMenus.filter(menu => menu.roles.includes(role))
  const label = (menu) => (menu.titleKey ? t(menu.titleKey) : menu.title)
  const matched = keyword
    ? pool.filter(menu => label(menu).toLowerCase().includes(keyword) || menu.path.toLowerCase().includes(keyword))
    : pool
  cb(matched.map(menu => ({ value: label(menu), ...menu })))
}

function handleSearchSelect(item) {
  searchKeyword.value = ''
  if (item?.path && route.path !== item.path) {
    router.push(item.path)
  }
}

const roleText = computed(() => t(`role.${userStore.user?.role || 'user'}`))

// 语言切换
const localeShort = computed(() => (locale.value === 'zh-CN' ? '中' : 'EN'))

// 主内容区左边距：紧凑屏幕侧栏改为浮层，不占位
const mainClass = computed(() => {
  if (isCompact.value) return 'ml-0'
  return sidebarOpen.value ? 'ml-64' : 'ml-0'
})

// 进入紧凑屏幕自动收起侧栏，回到大屏自动展开
watch(isCompact, (compact) => {
  sidebarOpen.value = !compact
})

// 移动端切换路由后自动收起侧栏
watch(() => route.path, () => {
  if (isCompact.value) sidebarOpen.value = false
})

const userAvatarUrl = computed(() => {
  const avatar = userStore.user?.avatar
  if (!avatar) return ''
  // 如果已经是完整URL，直接返回
  if (avatar.startsWith('http')) {
    return avatar
  }
  // 否则拼接后端地址
  return `http://localhost:3000${avatar}`
})

const currentPageTitle = computed(() => {
  const item = menuItems.value.find(m => m.path === route.path)
  return item?.title || 'AI use'
})

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const toggleFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen()
  }
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

const fetchGreeting = async () => {
  try {
    const res = await socialAPI.greeting()
    if (res.success) {
      greeting.value = res.data.greeting
    }
  } catch (e) {
    greeting.value = '欢迎使用AI健康使用评估平台'
  }
}

const fetchNotifications = async () => {
  try {
    const res = await notificationAPI.list({ unreadOnly: true })
    if (res.success) {
      unreadCount.value = res.data.unreadCount
    }
  } catch (e) {
    console.error(e)
  }
}

const updateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekDay = weekDays[now.getDay()]

  currentDate.value = `${year}年${month}月${day}日 ${weekDay}`

  let hours = now.getHours()
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  if (!is24Hour.value) {
    const period = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    currentClock.value = `${hours}:${minutes}:${seconds} ${period}`
  } else {
    currentClock.value = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`
  }
}

const toggleTimeFormat = () => {
  is24Hour.value = !is24Hour.value
  updateTime()
}
// 获取北京4-5月天气数据（基于日期）
const fetchWeather = () => {
  try {
    const now = new Date()
    const month = now.getMonth() + 1 // 4月或5月
    const day = now.getDate()

    // 计算一年中的第几天（用于模拟周期性变化）
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000)

    // 4-5月：第90-151天左右
    // 使用正弦波模拟温度变化趋势
    let baseTemp = 18

    if (month === 4) {
      // 4月：8°C - 24°C，逐渐升温
      baseTemp = 12 + (day / 30) * 12
    } else if (month === 5) {
      // 5月：18°C - 30°C，逐渐升温
      baseTemp = 18 + (day / 31) * 12
    }

    // 从天气数据库中选择匹配的天气
    // 使用日期作为种子，确保同一天的天气一致
    const seed = dayOfYear % springWeatherDatabase.length
    let weatherData = { ...springWeatherDatabase[seed] }

    // 根据实际温度微调
    const tempAdjust = Math.floor(Math.random() * 5) - 2 // -2 到 +2 的随机波动
    let finalTemp = Math.round(baseTemp + tempAdjust)

    // 根据月份调整湿度（4月较干燥，5月湿度上升）
    let humidityAdjust = month === 4 ? -5 : 5
    let finalHumidity = Math.min(85, Math.max(30, weatherData.humidity + humidityAdjust + (Math.random() * 10 - 5)))

    // 根据温度调整风力（春季风大）
    let windAdjust = month === 4 ? 1 : 0
    let finalWindSpeed = Math.min(6, Math.max(1, weatherData.windSpeed + windAdjust + (Math.random() * 2 - 1)))

    // 空气质量指数（北京春季有沙尘可能）
    let aqiAdjust = 0
    if (month === 4 && day > 10 && day < 20) {
      aqiAdjust = 40 // 4月中旬可能有沙尘
    }
    let finalAqi = Math.min(300, Math.max(30, weatherData.aqi + aqiAdjust + (Math.random() * 20 - 10)))

    // 根据天气调整描述
    let description = weatherData.desc
    if (finalAqi > 150) {
      description = '轻度沙尘'
    } else if (finalAqi > 200) {
      description = '中度沙尘'
    }

    // 根据时间段微调温度（早中晚）
    const hour = now.getHours()
    let hourlyAdjust = 0
    if (hour >= 6 && hour < 10) hourlyAdjust = -2
    else if (hour >= 10 && hour < 14) hourlyAdjust = 3
    else if (hour >= 14 && hour < 18) hourlyAdjust = 1
    else if (hour >= 18 && hour < 22) hourlyAdjust = -1
    else hourlyAdjust = -3

    finalTemp = Math.round(finalTemp + hourlyAdjust)

    weather.value = {
      city: '北京',
      temp: finalTemp,
      description: description,
      humidity: Math.round(finalHumidity),
      windSpeed: Math.round(finalWindSpeed * 10) / 10,
      visibility: weatherData.visibility + (finalAqi > 100 ? -5 : 0),
      aqi: finalAqi,
      date: `${month}月${day}日`
    }
    //控制台输出：如🌤️ 天气更新: 4月21日 多云 24°C AQI:88.30589664423412
    //console.log(`🌤️ 天气更新: ${weather.value.date} ${weather.value.description} ${weather.value.temp}°C AQI:${weather.value.aqi}`)

  } catch (e) {
    console.error('获取天气失败:', e)
    // 降级方案：使用当前时间模拟
    const now = new Date()
    const hour = now.getHours()
    let temp = 18
    if (hour >= 6 && hour < 10) temp = 15 + Math.floor(Math.random() * 3)
    else if (hour >= 10 && hour < 14) temp = 20 + Math.floor(Math.random() * 4)
    else if (hour >= 14 && hour < 18) temp = 22 + Math.floor(Math.random() * 3)
    else if (hour >= 18 && hour < 22) temp = 18 + Math.floor(Math.random() * 3)
    else temp = 14 + Math.floor(Math.random() * 3)

    weather.value = {
      city: '北京',
      temp: temp,
      description: hour >= 6 && hour < 18 ? '多云转晴' : '晴间多云',
      humidity: 65 + Math.floor(Math.random() * 20),
      windSpeed: 2 + Math.floor(Math.random() * 3),
      visibility: 12 + Math.floor(Math.random() * 8),
      aqi: 70 + Math.floor(Math.random() * 60)
    }
  }
}

// 更新校园实时数据
const updateCampusData = () => {
  const hour = new Date().getHours()
  let baseCount = 1500

  // 根据时间模拟人流变化
  if (hour >= 8 && hour < 12) baseCount = 2500 + Math.floor(Math.random() * 500)
  else if (hour >= 12 && hour < 14) baseCount = 1800 + Math.floor(Math.random() * 400)
  else if (hour >= 14 && hour < 18) baseCount = 2800 + Math.floor(Math.random() * 600)
  else if (hour >= 18 && hour < 22) baseCount = 1500 + Math.floor(Math.random() * 500)
  else baseCount = 500 + Math.floor(Math.random() * 300)

  campusRealtime.value = {
    onlineCount: baseCount,
    activeRooms: 30 + Math.floor(Math.random() * 40),
    canteenCrowd: hour >= 11 && hour < 13 || hour >= 17 && hour < 19 ? 60 + Math.floor(Math.random() * 30) : 20 + Math.floor(Math.random() * 25),
    libraryCount: 200 + Math.floor(Math.random() * 200)
  }
}

let timeInterval = null
let dataInterval = null

onMounted(() => {
  fetchGreeting()
  fetchNotifications()
  fetchWeather()
  updateTime()
  updateCampusData()

  // 收到实时通知时刷新未读角标
  window.addEventListener('app-notification', fetchNotifications)

  timeInterval = setInterval(updateTime, 1000)
  dataInterval = setInterval(() => {
    updateCampusData()
    fetchWeather()
  }, 30000)
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
  if (dataInterval) clearInterval(dataInterval)
  window.removeEventListener('app-notification', fetchNotifications)
})
</script>

<style scoped>
/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 移动端侧栏遮罩 */
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 45;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
}

/* ========== 侧边栏样式 ========== */
.sidebar-gradient {
  background: linear-gradient(180deg, #2c5f8a 0%, #1e4a6e 50%, #1a3f5f 100%);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
}

.sidebar-logo {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
}

/* 标题渐变改为白色 */
.logo-glow {
  background: linear-gradient(135deg, #5aa9dd 0%, #3b82f6 100%);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}


@keyframes logoGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(6, 182, 212, 0.3); }
  50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.7), 0 0 60px rgba(6, 182, 212, 0.5); }
}

/* 导航项样式 */
.nav-item {
  position: relative;
  overflow: hidden;
}

.nav-item-normal {
  color: rgba(255, 255, 255, 0.7);
}

.nav-item-normal:hover {
  color: white;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.3) 0%, transparent 100%);
}

/* 导航项激活状态 - 保持清晰 */
.nav-item-active {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.5) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 100%);
  border-left: 3px solid #3b82f6;
}


.nav-indicator {
  position: absolute;
  right: 12px;
  width: 6px;
  height: 6px;
  background: #3b82f6;
  border-radius: 50%;
  box-shadow: 0 0 10px #3b82f6;
  animation: indicatorPulse 1.5s ease-in-out infinite;
}

@keyframes indicatorPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}

/* 用户卡片样式 */
.user-card {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(6, 182, 212, 0.2) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.user-card:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.5) 0%, rgba(6, 182, 212, 0.3) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
}

.avatar-glow {
  position: relative;
}

.avatar-glow::before {
  content: '';
  position: absolute;
  inset: -3px;
  background: linear-gradient(135deg, #8b5cf6, #06b6d4);
  border-radius: 50%;
  z-index: -1;
  animation: avatarGlow 2s ease-in-out infinite;
}

@keyframes avatarGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.avatar-border {
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
}

.user-menu-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}

.user-menu-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

/* ========== 顶部导航栏样式 ========== */
.top-navbar-cool {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 50%, rgba(236, 72, 153, 0.05) 100%);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.1);
}

.toggle-btn-cool {
  background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%) !important;
  border: none !important;
  color: white !important;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
  transition: all 0.3s ease;
}

.toggle-btn-cool:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
}

/* 炒酷时间卡片 */
.time-card-cool {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 18px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.time-card-cool:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.2);
}

.time-date {
  font-size: 10px;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 2px;
}

.time-clock {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
  letter-spacing: 2px;
}

/* 炒酷天气卡片 */
.weather-card-cool {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.weather-card-cool:hover {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(245, 158, 11, 0.25) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(251, 191, 36, 0.2);
}

.weather-icon-cool {
  color: #f59e0b;
  filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.5));
}

.weather-info-cool {
  display: flex;
  flex-direction: column;
}

.weather-temp-cool {
  font-size: 16px;
  font-weight: 700;
  color: #f59e0b;
}

.weather-city-cool {
  font-size: 12px;
  color: #92400e;
  font-weight: 500;
}

/* 天气详情弹窗 */
.weather-detail-cool {
  padding: 20px;
}

.weather-header-cool {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #fef3c7;
}

.weather-header-cool .el-icon {
  color: #f59e0b;
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.weather-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px;
}

.weather-grid-item .el-icon {
  font-size: 24px;
  color: #f59e0b;
}

.weather-grid-item span:nth-child(2) {
  font-size: 18px;
  font-weight: 700;
  color: #92400e;
}

/* 校园状态卡片 */
.campus-status-cool {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.campus-status-cool:hover {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(16, 185, 129, 0.25) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(34, 197, 94, 0.2);
}

.status-dot-cool {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.8);
  animation: statusPulse 1.5s ease-in-out infinite;
}

@keyframes statusPulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 12px rgba(34, 197, 94, 0.8); }
  50% { transform: scale(1.2); box-shadow: 0 0 20px rgba(34, 197, 94, 1); }
}

.campus-status-info {
  display: flex;
  flex-direction: column;
}

.campus-status-label {
  font-size: 11px;
  color: #166534;
  font-weight: 500;
}

.campus-status-value {
  font-size: 14px;
  font-weight: 700;
  color: #15803d;
}

/* 校园实时数据弹窗 */
.campus-realtime-panel {
  padding: 20px;
}

.panel-header {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-header::before {
  content: '';
  width: 4px;
  height: 20px;
  background: linear-gradient(180deg, #8b5cf6, #06b6d4);
  border-radius: 2px;
}

.realtime-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.realtime-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.realtime-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.realtime-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.realtime-info {
  flex: 1;
}

.realtime-value {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.realtime-label {
  font-size: 12px;
  color: #6b7280;
}

/* 图标按钮 */
.icon-btn-cool {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%) !important;
  border: 1px solid rgba(139, 92, 246, 0.3) !important;
  color: #8b5cf6 !important;
  transition: all 0.3s ease;
}

.icon-btn-cool:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.3);
}

/* ========== 全局搜索 ========== */
.lang-btn {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.global-search {
  width: 240px;
}

.global-search :deep(.el-input__wrapper) {
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.06);
}

:global(html.dark) .global-search :deep(.el-input__wrapper) {
  background: rgba(30, 41, 59, 0.72);
}

.search-suggestion {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-suggestion .suggestion-icon {
  color: #8b5cf6;
}

.search-suggestion .suggestion-title {
  flex: 1;
}

.search-suggestion .suggestion-path {
  color: #94a3b8;
  font-size: 12px;
}

@media (max-width: 768px) {
  .global-search {
    width: 150px;
  }
}

@media (max-width: 480px) {
  .global-search {
    display: none;
  }
}

/* ========== 深色模式微调 ========== */
:global(html.dark) .top-navbar-cool {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
  border-bottom-color: rgba(148, 163, 184, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
}

:global(html.dark) .time-card-cool,
:global(html.dark) .weather-card-cool {
  background: rgba(30, 41, 59, 0.6);
}

:global(html.dark) .time-date {
  color: #94a3b8;
}

:global(html.dark) .sidebar-gradient {
  background: linear-gradient(180deg, #1b2b3f 0%, #16202f 50%, #0f172a 100%);
}
</style>
