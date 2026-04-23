import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.message || '请求失败'
    ElMessage.error(message)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default {
  auth: {
    login: data => request.post('/auth/login', data),
    register: data => request.post('/auth/register', data),
    me: () => request.get('/auth/me'),
    changePassword: data => request.post('/auth/change-password', data)
  },
  user: {
    uploadAvatar: (userId, formData) => request.post(`/users/${userId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    removeAvatar: userId => request.delete(`/users/${userId}/avatar`),
    updateProfile: (userId, data) => request.put(`/users/${userId}`, data)
  },
  users: {
    list: params => request.get('/users', { params }),
    get: id => request.get(`/users/${id}`),
    update: (id, data) => request.put(`/users/${id}`, data),
    dashboard: id => request.get(`/users/${id}/dashboard`)
  },
  courses: {
    list: params => request.get('/courses', { params }),
    get: id => request.get(`/courses/${id}`),
    create: data => request.post('/courses', data),
    students: id => request.get(`/courses/${id}/students`),
    recommend: () => request.get('/courses/recommend/resources')
  },
  schedules: {
    my: params => request.get('/schedules/my', { params }),
    today: () => request.get('/schedules/today'),
    upcoming: params => request.get('/schedules/upcoming', { params }),
    locationCheck: data => request.post('/schedules/location-check', data)
  },
  services: {
    rooms: params => request.get('/services/rooms/available', { params }),
    buildings: () => request.get('/services/rooms/buildings'),
    reserveRoom: data => request.post('/services/rooms/reserve', data),
    repairs: () => request.get('/services/repairs/my'),
    createRepair: data => request.post('/services/repairs', data),
    books: params => request.get('/services/books', { params }),
    borrowBook: id => request.post(`/services/books/${id}/borrow`),
    canteens: () => request.get('/services/canteens'),
    canteenCrowd: () => request.get('/services/canteens/crowd'),
    menu: id => request.get(`/services/canteens/${id}/menu`)
  },
  security: {
    attendance: params => request.get('/security/attendance/statistics', { params }),
    courseAttendance: (id, params) => request.get(`/security/attendance/course/${id}`, { params }),
    accessLogs: params => request.get('/security/access-logs', { params }),
    emergencyNotices: () => request.get('/security/emergency-notices'),
    createEmergency: data => request.post('/security/emergency-notices', data),
    energy: params => request.get('/security/energy', { params }),
    energyStats: params => request.get('/security/energy/statistics', { params }),
    greenTips: () => request.get('/security/green-tips')
  },
  dashboard: {
    overview: () => request.get('/dashboard/overview'),
    roomUsage: params => request.get('/dashboard/room-usage', { params }),
    roomStatus: () => request.get('/dashboard/room-status'),
    energy: params => request.get('/dashboard/energy', { params }),
    heatmap: () => request.get('/dashboard/heatmap'),
    network: () => request.get('/dashboard/network'),
    attendance: params => request.get('/dashboard/attendance', { params }),
    serviceStats: () => request.get('/dashboard/service-stats')
  },
  social: {
    activities: params => request.get('/social/activities', { params }),
    createActivity: data => request.post('/social/activities', data),
    joinActivity: id => request.post(`/social/activities/${id}/join`),
    groups: params => request.get('/social/groups', { params }),
    joinGroup: id => request.post(`/social/groups/${id}/join`),
    growth: id => request.get(`/social/growth/${id}`),
    greeting: () => request.get('/social/greeting')
  },
  notifications: {
    list: params => request.get('/notifications', { params }),
    markRead: id => request.put(`/notifications/${id}/read`),
    markAllRead: () => request.put('/notifications/read-all'),
    create: data => request.post('/notifications', data),
    delete: id => request.delete(`/notifications/${id}`),
    reminderSettings: () => request.get('/notifications/reminder-settings'),
    updateReminderSettings: data => request.put('/notifications/reminder-settings', data)
  },
  aiHealth: {
    overview: () => request.get('/ai-health/overview'),
    students: params => request.get('/ai-health/students', { params }),
    studentDetail: id => request.get(`/ai-health/students/${id}`),
    warnings: () => request.get('/ai-health/warnings'),
    recommendations: () => request.get('/ai-health/recommendations'),
    interventionFeedback: () => request.get('/ai-health/interventions/feedback'),
    analytics: () => request.get('/ai-health/analytics')
  }
}
