import request from './request'

// 当前登录用户的个人资料
export const profileAPI = {
  update: (userId, data) => request.put(`/users/${userId}`, data),
  uploadAvatar: (userId, formData) =>
    request.post(`/users/${userId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  removeAvatar: userId => request.delete(`/users/${userId}/avatar`)
}

export default profileAPI