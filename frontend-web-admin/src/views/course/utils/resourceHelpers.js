// 学习资源域的纯函数：类型标签映射与资源筛选。

export const getTypeLabel = (type) => {
  const labels = {
    video: '视频',
    doc: '文档',
    practice: '练习'
  }
  return labels[type] || type
}

export const filterResources = (resources, activeTab) => {
  const list = resources || []
  if (activeTab === 'all') {
    return list
  }
  return list.filter(r => r.type === activeTab)
}