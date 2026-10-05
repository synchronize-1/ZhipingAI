// 成长档案总览域的纯计算/映射函数：状态文案、标签类型、渐变与评语摘要。
// 不依赖 Vue 响应式，输入输出均为普通数据，便于单独阅读与复用。

export const getMentalStatusText = (status) => {
  const map = {
    excellent: '优秀',
    good: '良好',
    normal: '一般',
    warning: '关注',
    critical: '危险'
  }
  return map[status] || '良好'
}

export const getMentalStatusClass = (status) => {
  const map = {
    excellent: 'status-excellent',
    good: 'status-good',
    normal: 'status-normal',
    warning: 'status-warning',
    critical: 'status-critical'
  }
  return map[status] || 'status-good'
}

export const getStressLevelText = (level) => {
  const map = { low: '压力较低', medium: '压力适中', high: '压力较高' }
  return map[level] || '未知'
}

export const getStressTagType = (level) => {
  const map = { low: 'success', medium: 'warning', high: 'danger' }
  return map[level] || 'info'
}

export const getScoreGradient = (score) => {
  if (score >= 85) return 'linear-gradient(135deg, #10b981, #34d399)'
  if (score >= 70) return 'linear-gradient(135deg, #3b82f6, #60a5fa)'
  if (score >= 60) return 'linear-gradient(135deg, #f59e0b, #fbbf24)'
  return 'linear-gradient(135deg, #ef4444, #f87171)'
}

export const getCommentSourceText = (source) => {
  const map = { teacher: '教师', ai: 'AI生成', edited: '已编辑' }
  return map[source] || '未知'
}

export const getCommentSourceType = (source) => {
  const map = { teacher: 'primary', ai: 'success', edited: 'warning' }
  return map[source] || 'info'
}

export const getCommentTypeText = (type) => {
  const map = { semester: '学期评语', monthly: '月度评语', event: '事件评语', comprehensive: '综合评语' }
  return map[type] || '评语'
}

// 最新评语摘要（去掉富文本标签，超过 8 个字符截断）
export const computeCommentSummary = (content) => {
  if (!content) return '暂无'
  const text = content.replace(/<[^>]+>/g, '')
  return text.length > 8 ? text.slice(0, 8) + '...' : text
}