import request from './request'

// 考试管理
export const examAPI = {
  list: (params) => request.get('/teaching/exams', { params }),
  detail: (id) => request.get(`/teaching/exams/${id}`),
  create: (data) => request.post('/teaching/exams', data),
  update: (id, data) => request.put(`/teaching/exams/${id}`, data),
  delete: (id) => request.delete(`/teaching/exams/${id}`),
  addSubject: (examId, data) => request.post(`/teaching/exams/${examId}/subjects`, data),
  removeSubject: (examId, subjectId) => request.delete(`/teaching/exams/${examId}/subjects/${subjectId}`)
}

// 成绩管理
export const scoreAPI = {
  list: (params) => request.get('/teaching/scores', { params }),
  import: (examId, data) => request.post('/teaching/scores/import', { examId, ...data }),
  update: (id, data) => request.put(`/teaching/scores/${id}`, data),
  delete: (id) => request.delete(`/teaching/scores/${id}`),
  studentHistory: (studentId, params) => request.get(`/teaching/scores/student/${studentId}`, { params })
}

// 教学质量分析
export const analysisAPI = {
  classAnalysis: (examId, classId) => request.get(`/teaching/analysis/class/${examId}/${classId}`),
  gradeAnalysis: (examId) => request.get(`/teaching/analysis/grade/${examId}`),
  studentAnalysis: (studentId) => request.get(`/teaching/analysis/student/${studentId}`)
}

// 班级与学科
export const classAPI = {
  list: (params) => request.get('/teaching/classes', { params }),
  detail: (id) => request.get(`/teaching/classes/${id}`),
  create: (data) => request.post('/teaching/classes', data),
  update: (id, data) => request.put(`/teaching/classes/${id}`, data),
  delete: (id) => request.delete(`/teaching/classes/${id}`),
  getSubjectTeachers: (id) => request.get(`/teaching/classes/${id}/teachers`)
}

export const subjectAPI = {
  list: (params) => request.get('/teaching/subjects', { params }),
  allSimple: () => request.get('/teaching/subjects/simple'),
  detail: (id) => request.get(`/teaching/subjects/${id}`),
  create: (data) => request.post('/teaching/subjects', data),
  update: (id, data) => request.put(`/teaching/subjects/${id}`, data),
  delete: (id) => request.delete(`/teaching/subjects/${id}`)
}
