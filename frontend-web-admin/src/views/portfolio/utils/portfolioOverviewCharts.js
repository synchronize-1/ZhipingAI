// 成长档案总览域的 ECharts 配置构造：纯函数，接收数据返回 option。

// 技能分类统计环形图
export const buildSkillPieOption = ({ skillCategoryData }) => {
  const colors = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  const data = (skillCategoryData || []).filter(item => item.value > 0)

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { fontSize: 12, color: '#606266' }
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: data.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: colors[index % colors.length] }
        }))
      }
    ]
  }
}

// 荣誉级别分布柱状图
export const buildHonorBarOption = ({ honorLevelData }) => {
  const list = honorLevelData || []
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: list.map(item => item.name),
      axisLabel: { fontSize: 11, interval: 0 }
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        type: 'bar',
        data: list.map(item => item.value),
        barWidth: '50%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#f59e0b' },
              { offset: 1, color: '#fbbf24' }
            ]
          }
        }
      }
    ]
  }
}

// 考试成绩趋势折线图（总分 + 班级排名，双 Y 轴）
export const buildScoreTrendOption = ({ examScoreData }) => {
  const data = examScoreData || []
  return {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['总分', '班级排名'],
      top: 0,
      textStyle: { fontSize: 12 }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '18%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.examName),
      axisLabel: { fontSize: 11, interval: 0 }
    },
    yAxis: [
      {
        type: 'value',
        name: '总分',
        position: 'left'
      },
      {
        type: 'value',
        name: '排名',
        position: 'right',
        inverse: true
      }
    ],
    series: [
      {
        name: '总分',
        type: 'line',
        data: data.map(item => item.totalScore),
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
      },
      {
        name: '班级排名',
        type: 'line',
        yAxisIndex: 1,
        data: data.map(item => item.classRank),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 2, color: '#10b981' },
        itemStyle: { color: '#10b981' }
      }
    ]
  }
}