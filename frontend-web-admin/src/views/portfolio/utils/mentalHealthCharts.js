// 心理健康域的 ECharts 配置构造：纯函数，接收数据返回 option。

// 情绪指数趋势图
export const buildEmotionTrendOption = ({ data }) => {
  const list = data || []
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: list.map(item => item.date),
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: '指数'
    },
    series: [
      {
        name: '情绪指数',
        type: 'line',
        data: list.map(item => item.emotionIndex),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#ec4899' },
        itemStyle: { color: '#ec4899' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(236, 72, 153, 0.3)' },
              { offset: 1, color: 'rgba(236, 72, 153, 0.05)' }
            ]
          }
        }
      }
    ]
  }
}

// 压力水平变化图
export const buildStressTrendOption = ({ data }) => {
  const list = data || []
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: list.map(item => item.date),
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: '压力值'
    },
    series: [
      {
        name: '压力水平',
        type: 'line',
        data: list.map(item => item.stressLevel),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#f59e0b' },
        itemStyle: { color: '#f59e0b' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
              { offset: 1, color: 'rgba(245, 158, 11, 0.05)' }
            ]
          }
        },
        markLine: {
          silent: true,
          lineStyle: { color: '#ef4444', type: 'dashed' },
          data: [
            { yAxis: 70, label: { formatter: '警戒线', color: '#ef4444' } }
          ]
        }
      }
    ]
  }
}

// 测评详情雷达图
export const buildRadarOption = ({ detailData, dimensionList }) => {
  const dims = dimensionList || []
  const data = detailData || {}
  const indicators = dims.map(dim => ({
    name: dim.name,
    max: 100
  }))

  const values = dims.map(dim => data[dim.key] || 0)

  return {
    tooltip: {},
    radar: {
      indicator: indicators,
      radius: '65%',
      center: ['50%', '50%'],
      axisName: { color: '#606266', fontSize: 12 },
      splitArea: {
        areaStyle: {
          color: ['rgba(102, 126, 234, 0.05)', 'rgba(102, 126, 234, 0.1)']
        }
      }
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: values,
            name: '测评数据',
            areaStyle: { color: 'rgba(102, 126, 234, 0.3)' },
            lineStyle: { color: '#667eea', width: 2 },
            itemStyle: { color: '#667eea' }
          }
        ]
      }
    ]
  }
}