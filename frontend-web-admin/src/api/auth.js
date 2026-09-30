import request from './request'

// 认证：登录 / 注册 / 当前用户 / 修改密码
export const authAPI = {
  login: data => request.post('/auth/login', data),
  register: data => request.post('/auth/register', data),
  me: () => request.get('/auth/me'),
  changePassword: data => request.put('/auth/password', data)
}

export default authAPI