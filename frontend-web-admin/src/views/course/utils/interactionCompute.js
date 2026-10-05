// 课程互动域的纯计算函数：评分聚合与星级统计。
// 不依赖 Vue 响应式，输入输出均为普通数据。

// 计算平均评分
export const computeAverageRating = (ratings) => {
  const list = ratings || []
  if (list.length === 0) return 0
  const sum = list.reduce((acc, r) => acc + r.score, 0)
  return sum / list.length
}

// 获取某星级的评价数量
export const getRatingCount = (ratings, star) => {
  return (ratings || []).filter(r => r.score === star).length
}

// 获取某星级的百分比
export const getRatingPercentage = (ratings, star) => {
  const list = ratings || []
  if (list.length === 0) return 0
  return (getRatingCount(list, star) / list.length) * 100
}