// 心理健康域的纯映射函数：压力文案/标签、分数样式、情绪颜色与测评类型文案。
// 不依赖 Vue 响应式，输入输出均为普通数据。

export const getStressLevelText = (level) => {
  const map = { low: '压力较低', medium: '压力适中', high: '压力较高' }
  return map[level] || '未知'
}

export const getStressTagType = (level) => {
  const map = { low: 'success', medium: 'warning', high: 'danger' }
  return map[level] || 'info'
}

export const getScoreClass = (score) => {
  if (score >= 85) return 'score-excellent'
  if (score >= 70) return 'score-good'
  if (score >= 60) return 'score-normal'
  return 'score-low'
}

export const getEmotionColor = (score) => {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#3b82f6'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

export const getAssessmentTypeText = (type) => {
  const map = {
    comprehensive: '心理健康综合测评',
    emotion: '情绪状态测评',
    stress: '压力水平测评',
    sleep: '睡眠质量测评',
    anxiety: '焦虑自评量表',
    depression: '抑郁自评量表'
  }
  return map[type] || type
}