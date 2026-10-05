// 评语管理域的纯映射函数：类型/来源文案与标签类型、内容摘要。
// 不依赖 Vue 响应式，输入输出均为普通数据。

export const getTypeText = (type) => {
  const map = {
    semester: '学期评语',
    monthly: '月度评语',
    event: '事件评语',
    comprehensive: '综合评语'
  }
  return map[type] || type
}

export const getTypeTagType = (type) => {
  const map = {
    semester: 'primary',
    monthly: 'success',
    event: 'warning',
    comprehensive: 'danger'
  }
  return map[type] || 'info'
}

export const getSourceText = (source) => {
  const map = {
    teacher: '教师撰写',
    ai: 'AI生成',
    edited: '已编辑'
  }
  return map[source] || '未知'
}

export const getSourceTagType = (source) => {
  const map = {
    teacher: 'primary',
    ai: 'success',
    edited: 'warning'
  }
  return map[source] || 'info'
}

// 内容摘要（去掉富文本标签，超过 150 个字符截断）
export const getContentSummary = (content) => {
  if (!content) return ''
  const text = content.replace(/<[^>]+>/g, '')
  return text.length > 150 ? text.slice(0, 150) + '...' : text
}