import request from './request'

// 管理员用户管理 API
export const adminUserAPI = {
  // 1. 用户列表
  list: (params) => request.get('/admin/users', { params }),

  // 2. 用户详情
  detail: (id) => request.get(`/admin/users/${id}`),

  // 3. 创建用户
  create: (data) => request.post('/admin/users', data),

  // 4. 更新用户
  update: (id, data) => request.put(`/admin/users/${id}`, data),

  // 5. 删除用户
  delete: (id) => request.delete(`/admin/users/${id}`),

  // 6. 重置密码
  resetPassword: (id, newPassword) => {
    const data = newPassword ? { newPassword } : {}
    return request.post(`/admin/users/${id}/reset-password`, data)
  },

  // 7. 批量重置密码
  batchResetPassword: (userIds) => request.post('/admin/users/batch-reset-password', { userIds }),

  // 8. 批量分配班级
  batchUpdateClass: (userIds, classId) => request.post('/admin/users/batch-update-class', { userIds, classId }),

  // 9. 切换启用/禁用状态
  toggleStatus: (id) => request.put(`/admin/users/${id}/toggle-status`),

  // 10. Excel 批量导入
  importUsers: (file, role) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('role', role)
    return request.post('/admin/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 下载导入模板
  downloadTemplate: (role) => {
    return request.get('/admin/users/template', {
      params: { role },
      responseType: 'blob'
    })
  }
}
