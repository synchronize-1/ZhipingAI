import request from './request'

// 通知中心
export const notificationAPI = {
  list: params => request.get('/notifications', { params }),
  markRead: id => request.put(`/notifications/${id}/read`),
  markAllRead: () => request.put('/notifications/read-all'),
  create: data => request.post('/notifications', data),
  remove: id => request.delete(`/notifications/${id}`)
}

export default notificationAPI