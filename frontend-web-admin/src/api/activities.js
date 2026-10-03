import request from './request'

// 活动管理
export const activityAPI = {
  // 活动类型字典
  categories: () => request.get('/activities/categories'),
  // 活动统计（管理员 / 教师）
  stats: () => request.get('/activities/stats'),
  // 活动列表（支持分页 / 类型 / 状态 / 关键词）
  list: (params) => request.get('/activities', { params }),
  // 活动详情
  detail: (id) => request.get(`/activities/${id}`),
  // 当前用户报名记录
  my: () => request.get('/activities/my'),
  // 发布 / 修改 / 删除
  create: (data) => request.post('/activities', data),
  update: (id, data) => request.put(`/activities/${id}`, data),
  remove: (id) => request.delete(`/activities/${id}`),
  // 报名 / 取消报名
  register: (id) => request.post(`/activities/${id}/register`),
  cancelRegister: (id) => request.delete(`/activities/${id}/register`),
  // 报名名单（管理员 / 教师）
  registrations: (id, params) => request.get(`/activities/${id}/registrations`, { params }),
  // 签到（管理员 / 教师）
  checkIn: (registrationId) => request.put(`/activities/registrations/${registrationId}/check-in`)
}

export default activityAPI