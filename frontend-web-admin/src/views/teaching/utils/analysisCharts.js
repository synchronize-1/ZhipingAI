// 学情分析域的 ECharts 配置构造：纯函数，接收数据返回 option，页面只负责把数据传进来。

const GRID_BASE = { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true }

// 历次考试成绩趋势（总分 / 平均分 / 排名）
export const buildTrendOption = ({ exams, trendType }) => {
  const list = exams || []
  let seriesData = []
  let yAxisConfig = { type: 'value' }
  let legendData = []

  if (trendType === 'total') {
    seriesData = [{
      name: '总分',
      type: 'line',
      data: list.map(e => e.totalScore),
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3, color: '#667eea' },
      itemStyle: { color: '#667eea' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ]
        }
      }
    }]
    legendData = ['总分']
  } else if (trendType === 'average') {
    seriesData = [{
      name: '平均分',
      type: 'line',
      data: list.map(e => e.averageScore?.toFixed(1)),
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3, color: '#10b981' },
      itemStyle: { color: '#10b981' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
          ]
        }
      }
    }]
    legendData = ['平均分']
    yAxisConfig = { type: 'value', max: 100 }
  } else {
    seriesData = [
      {
        name: '班级排名',
        type: 'line',
        data: list.map(e => e.classRank),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#409eff' },
        itemStyle: { color: '#409eff' }
      },
      {
        name: '年级排名',
        type: 'line',
        data: list.map(e => e.gradeRank),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#f59e0b' },
        itemStyle: { color: '#f59e0b' }
      }
    ]
    legendData = ['班级排名', '年级排名']
    yAxisConfig = { type: 'value', inverse: true }
  }

  return {
    tooltip: { trigger: 'axis' },
    legend: { data: legendData, top: 0 },
    grid: GRID_BASE,
    xAxis: {
      type: 'category',
      data: list.map(e => e.examName),
      boundaryGap: false
    },
    yAxis: yAxisConfig,
    series: seriesData
  }
}

// 各科成绩雷达图（最近一次考试）
export const buildSubjectRadarOption = ({ subjects }) => {
  const list = subjects || []
  return {
    tooltip: {},
    radar: {
      indicator: list.map(s => ({
        name: s.name,
        max: s.fullScore || 100
      })),
      radius: '65%',
      center: ['50%', '50%'],
      axisName: { color: '#606266', fontSize: 12 },
      splitArea: { areaStyle: { color: ['rgba(102, 126, 234, 0.05)', 'rgba(102, 126, 234, 0.1)'] } }
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: list.map(s => s.score || 0),
            name: '学生成绩',
            areaStyle: { color: 'rgba(102, 126, 234, 0.3)' },
            lineStyle: { color: '#667eea', width: 2 },
            itemStyle: { color: '#667eea' }
          }
        ]
      }
    ]
  }
}

// 排名趋势（班级 / 年级共用，靠参数区分）
export const buildRankTrendOption = ({ exams, name, dataKey, color, areaColor, yName }) => {
  const list = exams || []
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '10%', right: '5%', bottom: '10%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: list.map(e => e.examName),
      axisLabel: { fontSize: 11, interval: 0 }
    },
    yAxis: { type: 'value', inverse: true, name: yName },
    series: [{
      name,
      type: 'line',
      data: list.map(e => e[dataKey]),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2, color },
      itemStyle: { color },
      areaStyle: { color: areaColor }
    }]
  }
}

// 历次成绩对比（总分 + 平均分，双 Y 轴）
export const buildExamCompareOption = ({ exams }) => {
  const list = exams || []
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['总分', '平均分'], top: 0 },
    grid: GRID_BASE,
    xAxis: {
      type: 'category',
      data: list.map(e => e.examName),
      boundaryGap: false,
      axisLabel: { interval: 0, rotate: list.length > 6 ? 20 : 0 }
    },
    yAxis: [
      { type: 'value', name: '总分', scale: true },
      { type: 'value', name: '平均分', min: 0, max: 100 }
    ],
    series: [
      {
        name: '总分',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: list.map(e => e.totalScore),
        lineStyle: { width: 3, color: '#667eea' },
        itemStyle: { color: '#667eea' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
              { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
            ]
          }
        }
      },
      {
        name: '平均分',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: list.map(e => e.avgScore),
        lineStyle: { width: 3, color: '#10b981' },
        itemStyle: { color: '#10b981' }
      }
    ]
  }
}

// 各科成绩趋势（多条折线，x 轴为历次考试）
export const buildSubjectTrendOption = ({ subjects, exams }) => {
  const list = subjects || []
  const examList = exams || []
  const xAxisData = examList.length > 0
    ? examList.map(e => e.examName)
    : list[0].scores.map(s => s.examName)
  const examIds = examList.length > 0
    ? examList.map(e => e.examId)
    : list[0].scores.map(s => s.examId)

  const colors = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  const series = list.map((subj, index) => {
    const scoreMap = {}
    subj.scores.forEach(s => { scoreMap[s.examId] = s.score })
    const color = colors[index % colors.length]
    return {
      name: subj.subjectName,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: examIds.map(id => (scoreMap[id] ?? null)),
      lineStyle: { width: 2, color },
      itemStyle: { color }
    }
  })

  return {
    tooltip: { trigger: 'axis' },
    legend: { data: list.map(s => s.subjectName), top: 0, type: 'scroll' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '20%', containLabel: true },
    xAxis: {
      type: 'category',
      data: xAxisData,
      boundaryGap: false,
      axisLabel: { interval: 0, rotate: xAxisData.length > 6 ? 20 : 0 }
    },
    yAxis: { type: 'value', name: '分数', scale: true },
    series
  }
}

// 各科成绩对比（平均分柱 + 满分虚线）
export const buildSubjectBarOption = ({ subjects }) => {
  const list = subjects || []
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['平均分', '满分'], top: 0 },
    grid: GRID_BASE,
    xAxis: {
      type: 'category',
      data: list.map(s => s.subjectName),
      axisLabel: { interval: 0, rotate: 0 }
    },
    yAxis: { type: 'value', max: 100 },
    series: [
      {
        name: '平均分',
        type: 'bar',
        data: list.map(s => s.avgScore || 0),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#667eea' },
              { offset: 1, color: '#764ba2' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '40%'
      },
      {
        name: '满分',
        type: 'line',
        data: list.map(s => s.fullScore || 100),
        lineStyle: { color: '#f56c6c', type: 'dashed' },
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  }
}

// 分数段分布饼图
export const buildScorePieOption = ({ distribution }) => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
  legend: { orient: 'vertical', right: '5%', top: 'center' },
  color: ['#67c23a', '#409eff', '#e6a23c', '#909399', '#f56c6c'],
  series: [
    {
      name: '分数段',
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: {
        label: { show: true, fontSize: 16, fontWeight: 'bold' }
      },
      labelLine: { show: false },
      data: distribution
    }
  ]
})

// 各科及格率/优秀率对比
export const buildRateBarOption = ({ subjects }) => {
  const list = subjects || []
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['及格率', '优秀率'], top: 0 },
    grid: GRID_BASE,
    xAxis: {
      type: 'category',
      data: list.map(s => s.subjectName)
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    series: [
      {
        name: '及格率',
        type: 'bar',
        data: list.map(s => (Number(s.passRate) || 0).toFixed(1)),
        itemStyle: { color: '#67c23a', borderRadius: [4, 4, 0, 0] },
        barWidth: '30%'
      },
      {
        name: '优秀率',
        type: 'bar',
        data: list.map(s => (Number(s.excellentRate) || 0).toFixed(1)),
        itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] },
        barWidth: '30%'
      }
    ]
  }
}