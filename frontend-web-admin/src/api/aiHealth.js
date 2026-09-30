import request from './request'

// AI 学情健康评估（旧模块，计划下线，暂保留真实接口调用）
export const aiHealthAPI = {
  overview: () => request.get('/ai-health/overview'),
  students: params => request.get('/ai-health/students', { params }),
  studentDetail: id => request.get(`/ai-health/students/${id}`),
  warnings: () => request.get('/ai-health/warnings'),
  recommendations: () => request.get('/ai-health/recommendations'),
  interventionFeedback: () => request.get('/ai-health/interventions/feedback'),
  analytics: () => request.get('/ai-health/analytics')
}

export default aiHealthAPI