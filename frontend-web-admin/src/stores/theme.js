import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'smartcampus-theme'

function applyTheme(mode) {
  const root = document.documentElement
  if (mode === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  root.setAttribute('data-theme', mode)
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref(localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light')

  const isDark = ref(mode.value === 'dark')

  const setMode = (value) => {
    mode.value = value === 'dark' ? 'dark' : 'light'
    isDark.value = mode.value === 'dark'
  }

  const toggle = () => {
    setMode(mode.value === 'dark' ? 'light' : 'dark')
  }

  // 应用持久化主题（应用启动时调用）
  const init = () => {
    applyTheme(mode.value)
  }

  watch(mode, (value) => {
    localStorage.setItem(STORAGE_KEY, value)
    applyTheme(value)
  })

  return { mode, isDark, setMode, toggle, init }
})

export default useThemeStore