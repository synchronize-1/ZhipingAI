import { mount, flushPromises } from '@vue/test-utils'
import AIHealthAssessment from '@/views/AIHealthAssessment.vue'
import api from '@/api'

vi.mock('@/api', () => ({
  default: {
    aiHealth: {
      overview: vi.fn(),
      students: vi.fn(),
      studentDetail: vi.fn(),
      warnings: vi.fn(),
      recommendations: vi.fn(),
      interventionFeedback: vi.fn(),
      analytics: vi.fn()
    }
  }
}))

vi.mock('echarts', () => ({
  init: vi.fn(() => ({
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn()
  }))
}))

describe('AIHealthAssessment.vue', () => {
  const cardStub = {
    template: '<div><slot name="header"></slot><slot></slot></div>'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page header', async () => {
    api.aiHealth.overview.mockResolvedValue({
      success: true,
      data: {
        classTotal: 120,
        teacherTotal: 15,
        aiUsageHoursWeekly: 780,
        warningCount: 12,
        weekLabels: ['周一', '周二'],
        avgScoreTrend: [70, 71],
        studyDurationTrend: [2.1, 2.2],
        aiUsageByClass: [{ className: '计算机1班', hours: 22 }],
        dependencyDistribution: [{ level: '低', count: 10 }],
        updatedAt: '2026-04-22T10:00:00.000Z'
      }
    })
    api.aiHealth.students.mockResolvedValue({
      success: true,
      data: [{ id: 1, name: '张三', studentId: 'S000001' }]
    })
    api.aiHealth.studentDetail.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        name: '张三',
        studentId: 'S000001',
        dependenceIndex: 61,
        dependenceLevel: '中',
        homeworkSimilarity: 66,
        goalProgress: 74,
        scoreTrend: [70, 71, 72, 73, 74],
        aiUsageComposition: [
          { name: 'AI完成作业时长', value: 12 },
          { name: '自主学习+AI辅助时长', value: 20 }
        ]
      }
    })
    api.aiHealth.warnings.mockResolvedValue({
      success: true,
      data: [
        { id: 1, studentName: '张三', level: '轻度', trigger: 'AI使用偏高', suggestion: '先思考10分钟', action: '发送学习提醒' }
      ]
    })
    api.aiHealth.recommendations.mockResolvedValue({
      success: true,
      data: [{ id: 1, title: '无AI限时练习', description: 'desc', target: '中度' }]
    })
    api.aiHealth.interventionFeedback.mockResolvedValue({
      success: true,
      data: {
        stageLabels: ['已预警', '已触达'],
        funnelValues: [20, 16],
        scoreBeforeAfter: [
          { category: '干预前平均成绩', value: 68 },
          { category: '干预后平均成绩', value: 74 }
        ],
        reassessment: { downgradedCount: 8, escalatedCount: 3, unchangedCount: 5, ruleHint: 'rule' }
      }
    })
    api.aiHealth.analytics.mockResolvedValue({
      success: true,
      data: {
        failRateCorrelation: 0.64,
        usageScoreCorrelation: -0.58,
        declineRatioInOverDependence: 0.42,
        overDependenceTrend: [62, 58],
        trendLabels: ['第1周', '第2周'],
        usageScoreScatter: [[2.1, 88], [3.4, 83]]
      }
    })

    const wrapper = mount(AIHealthAssessment, {
      global: {
        stubs: {
          'el-card': cardStub
        }
      }
    })
    await flushPromises()

    expect(wrapper.find('h1').text()).toBe('AI健康评估')
    expect(wrapper.find('.subtitle').text()).toBe('管理员查看全校健康数据概览')
    expect(wrapper.text()).toContain('首页概览')
  })

  it('loads and displays overview data', async () => {
    api.aiHealth.overview.mockResolvedValue({
      success: true,
      data: {
        classTotal: 80,
        teacherTotal: 10,
        aiUsageHoursWeekly: 520,
        warningCount: 9,
        weekLabels: ['周一', '周二'],
        avgScoreTrend: [72, 73],
        studyDurationTrend: [2.2, 2.3],
        aiUsageByClass: [{ className: '计算机1班', hours: 20 }],
        dependencyDistribution: [{ level: '中', count: 8 }],
        updatedAt: '2026-04-22T10:00:00.000Z'
      }
    })
    api.aiHealth.students.mockResolvedValue({
      success: true,
      data: [{ id: 2, name: '李四', studentId: 'S000002' }]
    })
    api.aiHealth.studentDetail.mockResolvedValue({
      success: true,
      data: {
        id: 2,
        name: '李四',
        studentId: 'S000002',
        dependenceIndex: 58,
        dependenceLevel: '中',
        homeworkSimilarity: 62,
        goalProgress: 70,
        scoreTrend: [72, 73, 74, 75, 76],
        aiUsageComposition: [
          { name: 'AI完成作业时长', value: 10 },
          { name: '自主学习+AI辅助时长', value: 22 }
        ]
      }
    })
    api.aiHealth.warnings.mockResolvedValue({
      success: true,
      data: [
        { id: 2, studentName: '李四', level: '重度', trigger: '成绩下滑', suggestion: '面谈干预', action: '触发面谈提醒' }
      ]
    })
    api.aiHealth.recommendations.mockResolvedValue({
      success: true,
      data: [{ id: 1, title: 'AI反思日志', description: 'desc', target: '全体' }]
    })
    api.aiHealth.interventionFeedback.mockResolvedValue({
      success: true,
      data: {
        stageLabels: ['已预警', '已触达'],
        funnelValues: [30, 22],
        scoreBeforeAfter: [
          { category: '干预前平均成绩', value: 66 },
          { category: '干预后平均成绩', value: 73 }
        ],
        reassessment: { downgradedCount: 10, escalatedCount: 4, unchangedCount: 6, ruleHint: 'rule' }
      }
    })
    api.aiHealth.analytics.mockResolvedValue({
      success: true,
      data: {
        failRateCorrelation: 0.61,
        usageScoreCorrelation: -0.54,
        declineRatioInOverDependence: 0.39,
        overDependenceTrend: [60, 56],
        trendLabels: ['第1周', '第2周'],
        usageScoreScatter: [[2.6, 86], [3.7, 80]]
      }
    })

    const wrapper = mount(AIHealthAssessment, {
      global: {
        stubs: {
          'el-card': cardStub
        }
      }
    })
    await flushPromises()

    expect(api.aiHealth.overview).toHaveBeenCalledTimes(1)
    expect(api.aiHealth.students).toHaveBeenCalledTimes(1)
    expect(api.aiHealth.studentDetail).toHaveBeenCalledTimes(1)
    expect(api.aiHealth.warnings).toHaveBeenCalledTimes(1)
    expect(api.aiHealth.recommendations).toHaveBeenCalledTimes(1)
    expect(api.aiHealth.interventionFeedback).toHaveBeenCalledTimes(1)
    expect(api.aiHealth.analytics).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('班级总人数：80')
    expect(wrapper.text()).toContain('本周预警学生：9 人')
    expect(wrapper.text()).toContain('学生详情查询')
    expect(wrapper.text()).toContain('预警干预')
    expect(wrapper.text()).toContain('替代性学习方案推荐')
    expect(wrapper.text()).toContain('干预闭环反馈')
    expect(wrapper.text()).toContain('综合指标分析')
  })
})
