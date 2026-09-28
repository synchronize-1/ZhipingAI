import request from './request'

export const homeAPI = {
  /**
   * 获取首页 Dashboard 数据
   * 根据登录用户角色返回不同数据（admin/teacher/student）
   * @returns {Promise<Object>} { code, data, message }
   */
  dashboard: () => request.get('/home/dashboard')
}
