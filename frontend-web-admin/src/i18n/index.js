import { ref } from 'vue'
import zhCN from '@/locales/zh-CN'
import enUS from '@/locales/en-US'

const STORAGE_KEY = 'smartcampus-locale'

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS
}

const locale = ref(localStorage.getItem(STORAGE_KEY) || 'zh-CN')

function resolve(dict, key) {
  return key.split('.').reduce((acc, part) => (acc && acc[part] != null ? acc[part] : undefined), dict)
}

/**
 * 翻译：支持嵌套 key（如 nav.home）与 {name} 占位符
 * 未命中当前语言时回退到简体中文，再回退到 key 本身
 */
export function t(key, params) {
  const dict = messages[locale.value] || messages['zh-CN']
  let text = resolve(dict, key)
  if (text == null) text = resolve(messages['zh-CN'], key)
  if (text == null) return key
  if (params && typeof text === 'string') {
    return text.replace(/\{(\w+)\}/g, (_, name) => (params[name] != null ? params[name] : `{${name}}`))
  }
  return text
}

export function setLocale(value) {
  locale.value = messages[value] ? value : 'zh-CN'
  localStorage.setItem(STORAGE_KEY, locale.value)
  document.documentElement.setAttribute('lang', locale.value)
}

export function getLocale() {
  return locale.value
}

export function availableLocales() {
  return [
    { value: 'zh-CN', label: '简体中文' },
    { value: 'en-US', label: 'English' }
  ]
}

// 注册全局 $t，模板中可直接使用 {{ $t('nav.home') }}
export function installI18n(app) {
  app.config.globalProperties.$t = t
  document.documentElement.setAttribute('lang', locale.value)
}

export function useI18n() {
  return {
    t,
    locale,
    setLocale,
    getLocale,
    languages: availableLocales()
  }
}

export default { t, setLocale, getLocale, availableLocales, installI18n, useI18n }