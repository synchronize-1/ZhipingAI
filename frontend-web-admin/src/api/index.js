import axios from 'axios'
import { ElMessage } from 'element-plus'
const USE_MOCK = true  // 为了测试前端，临时开启 mock，改为 false 恢复真实请求，数据从数据库来
const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.message || '请求失败'
    ElMessage.error(message)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default {
  auth: {
    login: data => request.post('/auth/login', data),
    register: data => request.post('/auth/register', data),
    me: () => request.get('/auth/me'),
    changePassword: data => request.post('/auth/change-password', data)
  },
  user: {
    uploadAvatar: (userId, formData) => request.post(`/users/${userId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    removeAvatar: userId => request.delete(`/users/${userId}/avatar`),
    updateProfile: (userId, data) => request.put(`/users/${userId}`, data)
  },
  users: {
    list: params => request.get('/users', { params }),
    get: id => request.get(`/users/${id}`),
    update: (id, data) => request.put(`/users/${id}`, data),
    dashboard: id => request.get(`/users/${id}/dashboard`)
  },
  courses: {
    list: params => request.get('/courses', { params }),
    get: id => request.get(`/courses/${id}`),
    create: data => request.post('/courses', data),
    students: id => request.get(`/courses/${id}/students`),
    recommend: () => request.get('/courses/recommend/resources')
  },
  schedules: {
    my: params => request.get('/schedules/my', { params }),
    today: () => request.get('/schedules/today'),
    upcoming: params => request.get('/schedules/upcoming', { params }),
    locationCheck: data => request.post('/schedules/location-check', data)
  },
  services: {
    rooms: params => request.get('/services/rooms/available', { params }),
    buildings: () => request.get('/services/rooms/buildings'),
    reserveRoom: data => request.post('/services/rooms/reserve', data),
    repairs: () => request.get('/services/repairs/my'),
    createRepair: data => request.post('/services/repairs', data),
    books: params => request.get('/services/books', { params }),
    borrowBook: id => request.post(`/services/books/${id}/borrow`),
    canteens: () => request.get('/services/canteens'),
    canteenCrowd: () => request.get('/services/canteens/crowd'),
    menu: id => request.get(`/services/canteens/${id}/menu`)
  },
  security: {
    attendance: params => request.get('/security/attendance/statistics', { params }),
    courseAttendance: (id, params) => request.get(`/security/attendance/course/${id}`, { params }),
    accessLogs: params => request.get('/security/access-logs', { params }),
    emergencyNotices: () => request.get('/security/emergency-notices'),
    createEmergency: data => request.post('/security/emergency-notices', data),
    energy: params => request.get('/security/energy', { params }),
    energyStats: params => request.get('/security/energy/statistics', { params }),
    greenTips: () => request.get('/security/green-tips')
  },
  dashboard: {
    overview: () => request.get('/dashboard/overview'),
    roomUsage: params => request.get('/dashboard/room-usage', { params }),
    roomStatus: () => request.get('/dashboard/room-status'),
    energy: params => request.get('/dashboard/energy', { params }),
    heatmap: () => request.get('/dashboard/heatmap'),
    network: () => request.get('/dashboard/network'),
    attendance: params => request.get('/dashboard/attendance', { params }),
    serviceStats: () => request.get('/dashboard/service-stats')
  },
  social: {
    activities: params => request.get('/social/activities', { params }),
    createActivity: data => request.post('/social/activities', data),
    joinActivity: id => request.post(`/social/activities/${id}/join`),
    groups: params => request.get('/social/groups', { params }),
    joinGroup: id => request.post(`/social/groups/${id}/join`),
    growth: id => request.get(`/social/growth/${id}`),
    greeting: () => request.get('/social/greeting')
  },
  notifications: {
    list: params => request.get('/notifications', { params }),
    markRead: id => request.put(`/notifications/${id}/read`),
    markAllRead: () => request.put('/notifications/read-all'),
    create: data => request.post('/notifications', data),
    delete: id => request.delete(`/notifications/${id}`),
    reminderSettings: () => request.get('/notifications/reminder-settings'),
    updateReminderSettings: data => request.put('/notifications/reminder-settings', data)
  },
  // //数据库连接时的真实情况
  // aiHealth: {
  //   overview: () => request.get('/ai-health/overview'),
  //   students: params => request.get('/ai-health/students', { params }),
  //   studentDetail: id => request.get(`/ai-health/students/${id}`),
  //   warnings: () => request.get('/ai-health/warnings'),
  //   recommendations: () => request.get('/ai-health/recommendations'),
  //   interventionFeedback: () => request.get('/ai-health/interventions/feedback'),
  //   analytics: () => request.get('/ai-health/analytics')
  // }
    aiHealth: {
        overview: () => {
            if (USE_MOCK) {
                return Promise.resolve({
                    success: true,
                    data: {
                        classTotal: 156,
                        teacherTotal: 32,
                        aiUsageHoursWeekly: 184,
                        warningCount: 12,
                        weekLabels: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周'],
                        avgScoreTrend: [72, 74, 75, 73, 76, 78, 77],
                        studyDurationTrend: [1.8, 2.1, 2.3, 2.2, 2.5, 2.4, 2.6],
                        aiUsageByClass: [
                            { class_name: '计算机科学', hours: 42 },
                            { class_name: '心理学', hours: 38 },
                            { class_name: '商学', hours: 35 },
                            { class_name: '生物学', hours: 32 },
                            { class_name: '工程学', hours: 30 },
                            { class_name: '历史学', hours: 28 },
                            { class_name: '数学', hours: 25 }
                        ],
                        dependencyDistribution: [
                            { level: '低', count: 82 },
                            { level: '中', count: 48 },
                            { level: '高', count: 26 }
                        ],
                        updatedAt: new Date().toISOString()
                    }
                })
            }
            return request.get('/ai-health/overview')
        },

        students: (params) => {
            if (USE_MOCK) {
                return Promise.resolve({
                    success: true,
                    data: [
                        { id: 4, name: '王小明', studentId: 'S000004', department: '计算机学院', dependenceScore: 62, dependenceLevel: '中度' },
                        { id: 5, name: '李小红', studentId: 'S000005', department: '计算机学院', dependenceScore: 58, dependenceLevel: '中度' },
                        { id: 6, name: '计算机学生1', studentId: 'S000006', department: '计算机学院', dependenceScore: 45, dependenceLevel: '轻度' },
                        { id: 7, name: '计算机学生2', studentId: 'S000007', department: '计算机学院', dependenceScore: 52, dependenceLevel: '中度' },
                        { id: 8, name: '计算机学生3', studentId: 'S000008', department: '计算机学院', dependenceScore: 78, dependenceLevel: '重度' },
                        { id: 11, name: '心理学生1', studentId: 'S000011', department: '心理学院', dependenceScore: 48, dependenceLevel: '轻度' },
                        { id: 12, name: '心理学生2', studentId: 'S000012', department: '心理学院', dependenceScore: 55, dependenceLevel: '中度' }
                    ]
                })
            }
            return request.get('/ai-health/students', { params })
        },

        studentDetail: (id) => {
            if (USE_MOCK) {
                const mockData = {
                    4: { dependenceIndex: 62, dependenceLevel: '中度', scoreTrend: [70, 72, 74, 73, 75], aiUsageComposition: [{ name: 'AI完成作业/编程', value: 55 }, { name: '自主学习+AI辅助', value: 45 }] },
                    5: { dependenceIndex: 58, dependenceLevel: '中度', scoreTrend: [68, 70, 72, 74, 76], aiUsageComposition: [{ name: 'AI完成作业/编程', value: 45 }, { name: '自主学习+AI辅助', value: 55 }] },
                    6: { dependenceIndex: 45, dependenceLevel: '轻度', scoreTrend: [75, 76, 77, 78, 79], aiUsageComposition: [{ name: 'AI完成作业/编程', value: 30 }, { name: '自主学习+AI辅助', value: 70 }] },
                    8: { dependenceIndex: 78, dependenceLevel: '重度', scoreTrend: [65, 62, 60, 58, 55], aiUsageComposition: [{ name: 'AI完成作业/编程', value: 80 }, { name: '自主学习+AI辅助', value: 20 }] }
                }
                const data = mockData[id] || mockData[4]
                return Promise.resolve({
                    success: true,
                    data: {
                        id: Number(id),
                        name: `学生${id}`,
                        studentId: `S${String(id).padStart(6, '0')}`,
                        department: '计算机学院',
                        ...data,
                        homeworkSimilarity: 68,
                        goalProgress: 72
                    }
                })
            }
            return request.get(`/ai-health/students/${id}`)
        },

        warnings: () => {
            if (USE_MOCK) {
                return Promise.resolve({
                    success: true,
                    data: [
                        { id: 1, studentName: '王小明', level: '中度', trigger: 'AI使用时长高于班级平均25%', suggestion: '建议减少AI使用，先独立思考', action: '发送学习提醒' },
                        { id: 2, studentName: '李小红', level: '轻度', trigger: 'AI使用时长略高于班级平均12%', suggestion: '建议先独立思考10分钟', action: '发送学习提醒' },
                        { id: 3, studentName: '计算机学生3', level: '重度', trigger: 'AI使用时长高于班级平均68%，成绩下滑', suggestion: '建议安排面谈，限制AI使用时间', action: '触发面谈提醒' }
                    ]
                })
            }
            return request.get('/ai-health/warnings')
        },

        recommendations: () => {
            if (USE_MOCK) {
                return Promise.resolve({
                    success: true,
                    data: [
                        { id: 1, title: '无AI限时练习', description: '设置30分钟独立解题时间，结束后再允许使用AI核对思路。', target: '中度/重度依赖学生' },
                        { id: 2, title: '费曼法口头讲解任务', description: '要求学生用3分钟口头解释知识点，强化主动理解。', target: '重度依赖学生' },
                        { id: 3, title: 'AI反思日志', description: '记录是否先独立思考、AI帮到什么、是否真正学会。', target: '全体预警学生' },
                        { id: 4, title: '分组协作学习', description: '组织小组讨论，促进学生间的知识交流。', target: '所有学生' }
                    ]
                })
            }
            return request.get('/ai-health/recommendations')
        },

        interventionFeedback: () => {
            if (USE_MOCK) {
                return Promise.resolve({
                    success: true,
                    data: {
                        stageLabels: ['已预警', '已触达', '已执行干预', '依赖下降'],
                        funnelValues: [120, 96, 68, 41],
                        scoreBeforeAfter: [
                            { category: '干预前平均成绩', value: 68 },
                            { category: '干预后平均成绩', value: 74 }
                        ],
                        reassessment: { downgradedCount: 22, escalatedCount: 9, unchangedCount: 15, ruleHint: '连续两周依赖指数下降则降级' }
                    }
                })
            }
            return request.get('/ai-health/interventions/feedback')
        },

        analytics: () => {
            if (USE_MOCK) {
                return Promise.resolve({
                    success: true,
                    data: {
                        failRateCorrelation: 0.64,
                        usageScoreCorrelation: -0.58,
                        declineRatioInOverDependence: 0.42,
                        overDependenceTrend: [62, 58, 56, 52, 49, 46],
                        trendLabels: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周'],
                        usageScoreScatter: [[2.1, 88], [3.4, 83], [4.8, 79], [5.6, 74], [6.3, 71], [7.2, 66], [8.1, 61]]
                    }
                })
            }
            return request.get('/ai-health/analytics')
        }
    }
}
