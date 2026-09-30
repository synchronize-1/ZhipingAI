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
  studentHistory: (studentId, params) => request.get(`/teaching/scores/student/${studentId}`, { params }),
  // Excel 预览
  preview: (file, examId, classId) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('examId', examId)
    formData.append('classId', classId)
    return request.post('/teaching/scores/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  // 导出成绩 Excel
  exportExcel: (examId, classId, subjectId) => {
    const params = { examId, classId }
    if (subjectId) params.subjectId = subjectId
    return request.get('/teaching/scores/export', {
      params,
      responseType: 'blob'
    })
  },
  // 下载导入模板
  downloadTemplate: (examId, classId) => {
    return request.get('/teaching/scores/template', {
      params: { examId, classId },
      responseType: 'blob'
    })
  },
  // 批量导入（rows 格式）
  importFromRows: (examId, classId, rows) => {
    return request.post('/teaching/scores/import', { examId, classId, rows })
  }
}

// 教学质量分析
export const analysisAPI = {
  classAnalysis: (examId, classId) => request.get(`/teaching/analysis/class/${examId}/${classId}`),
  gradeAnalysis: (examId) => request.get(`/teaching/analysis/grade/${examId}`),
  studentAnalysis: (studentId) => request.get(`/teaching/analysis/student/${studentId}`),
  // 进步/退步学生识别（baseExamId 为空时自动对比上一场考试）
  progressComparison: (examId, classId, params = {}) =>
    request.get(`/teaching/analysis/progress/${examId}/${classId}`, { params }),
  // AI 诊断（调用大模型，耗时较长，单独放宽超时时间）
  classDiagnosis: (examId, classId) =>
    request.post('/teaching/analysis/class/diagnosis', { examId, classId }, { timeout: 120000 }),
  studentDiagnosis: (studentId, examId) =>
    request.post('/teaching/analysis/student/diagnosis', { studentId, ...(examId ? { examId } : {}) }, { timeout: 120000 }),
  diagnosisHistory: (reportType, targetId, limit = 10) =>
    request.get('/teaching/analysis/diagnosis/history', { params: { reportType, targetId, limit } }),
  diagnosisDetail: (id) => request.get(`/teaching/analysis/diagnosis/${id}`)
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
