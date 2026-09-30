import request from './request'

// 成长 / 社交：成长档案数据与问候语
export const socialAPI = {
  growth: studentId => request.get(`/social/growth/${studentId}`),
  greeting: () => request.get('/social/greeting')
}

export default socialAPI