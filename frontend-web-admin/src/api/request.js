import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000
})

// 请求拦截器：统一注入登录态
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

// 响应归一化：
//   { code, data, message }    新架构格式
//   { success, data, message } 历史格式
//   <裸数据>                    无信封（数组 / 对象 / 标量）
// 统一为同时带 code 与 success 的信封（成功 code=0 / success=true），
// 调用方读 res.data 即可，无需关心后端用的是哪种包装。
function normalize(res) {
  if (res && typeof res === 'object' && !Array.isArray(res)) {
    if (res.code === undefined && res.success !== undefined) {
      res.code = res.success ? 0 : -1
    }
    if (res.code !== undefined) {
      if (res.success === undefined) res.success = res.code === 0
      return res
    }
  }
  return { code: 0, success: true, data: res, message: '' }
}

request.interceptors.response.use(
  response => {
    // blob 响应直接返回完整 response（文件下载需要从 headers 提取文件名）
    if (response.config.responseType === 'blob') {
      return response
    }

    const res = normalize(response.data)

    if (res.code === 0) {
      return res
    }
    ElMessage.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message || '请求失败'))
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