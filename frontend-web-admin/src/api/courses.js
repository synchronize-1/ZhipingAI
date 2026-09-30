import request from './request'

// 课程模块（按课程维度的旧业务，与选修课 elective 区分）
export const courseAPI = {
  list: params => request.get('/courses', { params }),
  get: id => request.get(`/courses/${id}`),
  create: data => request.post('/courses', data),
  update: (id, data) => request.put(`/courses/${id}`, data),
  remove: id => request.delete(`/courses/${id}`),
  semesters: () => request.get('/courses/semesters'),
  teachers: () => request.get('/courses/teachers')
}

export default courseAPI