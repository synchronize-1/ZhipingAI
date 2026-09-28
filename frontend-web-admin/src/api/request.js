import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    // blob 响应直接返回完整 response（用于文件下载，需要 headers 提取文件名）
    if (response.config.responseType === 'blob') {
      return response
    }
    const res = response.data
    // 新架构统一响应格式：{ code, data, message }
    if (res.code !== undefined) {
      if (res.code === 0) {
        return res
      } else {
        ElMessage.error(res.message || '请求失败')
        return Promise.reject(new Error(res.message || '请求失败'))
      }
    }
    // 兼容旧格式：{ success, data, message }
    if (res.success !== undefined) {
      if (res.success) {
        return res
      } else {
        ElMessage.error(res.message || '请求失败')
        return Promise.reject(new Error(res.message || '请求失败'))
      }
    }
    return res
  },
  error => {
    const message = error.response?.data?.message || error.message || '请求失败'
    ElMessage.error(message)
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export default request
