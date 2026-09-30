import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import './styles/index.css'
import './styles/theme.css'
import { useThemeStore } from './stores/theme'
import { installI18n } from './i18n'

const app = createApp(App)
const pinia = createPinia()

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)

// 应用持久化的主题（浅色 / 深色）
useThemeStore().init()

// 注册国际化（$t / useI18n）
installI18n(app)

app.use(router)
app.use(ElementPlus, { locale: zhCn })

// 登录后自动连接WebSocket
import { useUserStore } from './stores/user'
import { useSocketStore } from './stores/socket'

router.afterEach(() => {
  const userStore = useUserStore()
  const socketStore = useSocketStore()
  
  if (userStore.isLoggedIn && !socketStore.connected) {
    socketStore.connect()
  }
})

app.mount('#app')
