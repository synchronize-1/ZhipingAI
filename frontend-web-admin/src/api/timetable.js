import request from './request'

// 课表管理
export const timetableAPI = {
  // 节次 / 星期定义
  periods: () => request.get('/timetable/periods'),
  // 排课表单选项（班级 / 学科 / 教师 / 教室 / 学期）
  options: () => request.get('/timetable/options'),
  // 周课表视图（按班级 / 教师 / 教室）
  week: (params) => request.get('/timetable', { params }),
  // 当前登录用户的课表（教师=自己，学生=本班）
  my: (params) => request.get('/timetable/my', { params }),
  // 冲突预检
  checkConflict: (data) => request.post('/timetable/check-conflict', data),
  // 排课增删改
  create: (data) => request.post('/timetable', data),
  update: (id, data) => request.put(`/timetable/${id}`, data),
  remove: (id) => request.delete(`/timetable/${id}`),
  // 清空某班级课表
  clearClass: (classId, params) => request.delete(`/timetable/class/${classId}`, { params })
}

export default timetableAPI