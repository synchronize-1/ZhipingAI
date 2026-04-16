const BASE_URL = 'http://localhost:3000/api'

const request = (url, method = 'GET', data = {}) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    uni.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode === 401) {
          uni.removeStorageSync('token')
          uni.removeStorageSync('user')
          uni.reLaunch({ url: '/pages/login/login' })
          reject(new Error('未授权'))
        } else {
          resolve(res.data)
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络请求失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

// 导出通用请求函数供AI科普页面使用
export const apiRequest = request

export default {
  auth: {
    login: (data) => request('/auth/login', 'POST', data),
    me: () => request('/auth/me')
  },
  schedules: {
    my: (params) => request('/schedules/my' + (params?.week ? `?week=${params.week}` : '')),
    today: () => request('/schedules/today'),
    upcoming: (minutes = 30) => request(`/schedules/upcoming?minutes=${minutes}`),
    locationCheck: (data) => request('/schedules/location-check', 'POST', data)
  },
  services: {
    rooms: (params) => request('/services/rooms/available'),
    buildings: () => request('/services/rooms/buildings'),
    canteenCrowd: () => request('/services/canteens/crowd'),
    repairs: () => request('/services/repairs/my'),
    createRepair: (data) => request('/services/repairs', 'POST', data),
    books: (params) => request('/services/books'),
    borrowBook: (id) => request(`/services/books/${id}/borrow`, 'POST')
  },
  social: {
    activities: () => request('/social/activities'),
    joinActivity: (id) => request(`/social/activities/${id}/join`, 'POST'),
    greeting: () => request('/social/greeting'),
    growth: (id) => request(`/social/growth/${id}`)
  },
  notifications: {
    list: () => request('/notifications'),
    markRead: (id) => request(`/notifications/${id}/read`, 'PUT'),
    reminderSettings: () => request('/notifications/reminder-settings'),
    updateSettings: (data) => request('/notifications/reminder-settings', 'PUT', data)
  },
  security: {
    emergencyNotices: () => request('/security/emergency-notices'),
    greenTips: () => request('/security/green-tips')
  }
}
