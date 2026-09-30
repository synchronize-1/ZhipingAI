import request from './request'

// 选课系统（选修课）
export const electiveAPI = {
  // 课程类别字典
  categories: () => request.get('/electives/categories'),
  // 表单选项（学期 / 学科 / 教师 / 年级）
  options: () => request.get('/electives/options'),
  // 选课统计（管理员 / 教师）
  stats: () => request.get('/electives/stats'),
  // 当前登录学生的选课记录
  my: () => request.get('/electives/my'),
  // 选修课列表（学生仅见开放课程，含 hasSelected / canSelect）
  list: (params) => request.get('/electives', { params }),
  // 课程详情
  detail: (id) => request.get(`/electives/${id}`),
  // 选课名单（管理员 / 教师）
  students: (id, params) => request.get(`/electives/${id}/students`, { params }),
  // 发布 / 修改 / 删除选修课
  create: (data) => request.post('/electives', data),
  update: (id, data) => request.put(`/electives/${id}`, data),
  remove: (id) => request.delete(`/electives/${id}`),
  // 学生选课 / 退选
  select: (id) => request.post(`/electives/${id}/select`),
  drop: (id) => request.delete(`/electives/${id}/select`)
}

export default electiveAPI