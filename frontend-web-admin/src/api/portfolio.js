import request from './request'

// 成长档案总览
export const portfolioAPI = {
  overview: (studentId) => request.get(`/portfolio/overview/${studentId}`),
  classList: (classId, params) => request.get(`/portfolio/class/${classId}`, { params })
}

// 技能管理
export const skillAPI = {
  list: (studentId, params) => request.get(`/portfolio/skills/student/${studentId}`, { params }),
  create: (data) => request.post('/portfolio/skills', data),
  update: (id, data) => request.put(`/portfolio/skills/${id}`, data),
  delete: (id) => request.delete(`/portfolio/skills/${id}`),
  stats: (studentId) => request.get(`/portfolio/skills/stats/${studentId}`)
}

// 荣誉管理
export const honorAPI = {
  list: (studentId, params) => request.get(`/portfolio/honors/student/${studentId}`, { params }),
  create: (data) => request.post('/portfolio/honors', data),
  update: (id, data) => request.put(`/portfolio/honors/${id}`, data),
  delete: (id) => request.delete(`/portfolio/honors/${id}`),
  stats: (studentId) => request.get(`/portfolio/honors/stats/${studentId}`)
}

// 心理健康
export const mentalHealthAPI = {
  list: (studentId, params) => request.get(`/portfolio/mental-health/student/${studentId}`, { params }),
  create: (data) => request.post('/portfolio/mental-health', data),
  update: (id, data) => request.put(`/portfolio/mental-health/${id}`, data),
  delete: (id) => request.delete(`/portfolio/mental-health/${id}`),
  trend: (studentId) => request.get(`/portfolio/mental-health/trend/${studentId}`)
}

// 评语管理
export const commentAPI = {
  list: (studentId, params) => request.get(`/portfolio/comments/student/${studentId}`, { params }),
  latest: (studentId) => request.get(`/portfolio/comments/latest/${studentId}`),
  create: (data) => request.post('/portfolio/comments', data),
  update: (id, data) => request.put(`/portfolio/comments/${id}`, data),
  delete: (id) => request.delete(`/portfolio/comments/${id}`)
}
