// 学情分析域的纯计算函数：学科归一化、趋势派生、指标聚合与建议生成。
// 不依赖 Vue 响应式，输入输出均为普通数据，便于单独阅读与复用。

export const formatTime = (time) => {
  if (!time) return '--'
  const d = new Date(time)
  if (Number.isNaN(d.getTime())) return time
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 归一化优势/薄弱学科数据（兼容 { name, score, classRank } 与 { subjectName, avgScore } 两种结构）
export const normalizeSubjectList = (list) => (list || []).map(s => ({
  name: s.name || s.subjectName || '--',
  score: s.score ?? s.avgScore ?? s.averageScore ?? '--',
  classRank: s.classRank ?? s.rankInClass ?? '--'
}))

// 从学科趋势中推导最近一次考试的各科成绩（用于雷达图）
export const deriveSubjectScores = (subjectTrendData) => {
  const map = subjectTrendData || {}
  return Object.values(map).map(subj => {
    const scores = [...(subj.scores || [])]
      .filter(s => typeof s.score === 'number')
      .sort((a, b) => new Date(a.examDate || 0) - new Date(b.examDate || 0))
    const last = scores[scores.length - 1] || {}
    const maxScore = Math.max(100, ...scores.map(s => s.score || 0))
    return {
      name: subj.subjectName,
      score: last.score ?? 0,
      fullScore: Math.ceil(maxScore / 10) * 10,
      classRank: last.rankInClass
    }
  })
}

// 学科趋势（按考试次数/平均分排序，最多展示 limit 个科目）
export const computeSubjectTrendSubjects = (subjectTrendData, limit = 6) => {
  const list = Object.values(subjectTrendData || {})
  return list
    .map(subj => ({
      ...subj,
      scores: [...(subj.scores || [])].sort((a, b) => new Date(a.examDate || 0) - new Date(b.examDate || 0))
    }))
    .map(subj => {
      const valid = subj.scores.filter(s => typeof s.score === 'number')
      subj.avgScore = valid.length ? valid.reduce((sum, s) => sum + s.score, 0) / valid.length : 0
      return subj
    })
    .sort((a, b) => (b.scores.length - a.scores.length) || (b.avgScore - a.avgScore))
    .slice(0, limit)
}

// 学生学情建议（依据优势/薄弱学科生成）
export const generateStudentSuggestions = (data) => {
  const tips = []
  if (data.advantageSubjects && data.advantageSubjects.length > 0) {
    tips.push(`${data.advantageSubjects.map(s => s.name).join('、')}是你的优势学科，继续保持并争取更大突破`)
  }
  if (data.weakSubjects && data.weakSubjects.length > 0) {
    tips.push(`${data.weakSubjects.map(s => s.name).join('、')}成绩相对薄弱，建议加强基础知识的学习`)
  }
  tips.push('建议制定薄弱学科的专项提升计划，有针对性地进行补习')
  tips.push('保持良好的学习习惯，注意劳逸结合，提高学习效率')
  return tips
}

// 班级整体指标（后端未直接给总分维度，由各科统计聚合）
export const computeOverallMetrics = (analysisData) => {
  const stats = analysisData?.subjectStats || []
  const avgList = stats.filter(s => s.avgScore !== null && s.avgScore !== undefined).map(s => Number(s.avgScore))
  const maxList = stats.filter(s => s.maxScore !== null && s.maxScore !== undefined).map(s => Number(s.maxScore))
  const minList = stats.filter(s => s.minScore !== null && s.minScore !== undefined).map(s => Number(s.minScore))
  const attendList = stats.map(s => Number(s.attendCount) || 0)

  return {
    averageScore: avgList.length ? avgList.reduce((a, b) => a + b, 0) / avgList.length : null,
    highestScore: maxList.length ? Math.max(...maxList) : null,
    lowestScore: minList.length ? Math.min(...minList) : null,
    passRate: analysisData?.overall?.avgPassRate ?? null,
    excellentRate: analysisData?.overall?.avgExcellentRate ?? null,
    studentCount: attendList.length ? Math.max(...attendList) : 0
  }
}

// 汇总各科分数段分布
export const computeScoreDistribution = (subjectStats) => {
  const dist = { excellent: 0, good: 0, medium: 0, pass: 0, fail: 0 }
  for (const s of (subjectStats || [])) {
    const d = s.scoreDistribution || {}
    dist.excellent += d.excellent || 0
    dist.good += d.good || 0
    dist.medium += d.medium || 0
    dist.pass += d.pass || 0
    dist.fail += d.fail || 0
  }
  return [
    { name: '90分以上', value: dist.excellent },
    { name: '80-89分', value: dist.good },
    { name: '70-79分', value: dist.medium },
    { name: '60-69分', value: dist.pass },
    { name: '60分以下', value: dist.fail }
  ]
}

// 将后端 weakSubjects 与各科统计合并，补齐平均分 / 及格率
export const decorateWeakSubjects = (data) => {
  const statMap = {}
  for (const s of (data.subjectStats || [])) {
    statMap[s.subjectId] = s
  }
  return (data.weakSubjects || []).map(w => {
    const st = statMap[w.subjectId] || {}
    return {
      subjectId: w.subjectId,
      name: w.subjectName,
      averageScore: st.avgScore !== null && st.avgScore !== undefined ? Number(st.avgScore) : null,
      passRate: st.passRate !== null && st.passRate !== undefined ? Number(st.passRate) : null,
      avgScoreDiff: w.avgScoreDiff,
      passRateDiff: w.passRateDiff
    }
  })
}

// 班级学情建议（依据整体指标与薄弱学科生成）
export const generateClassSuggestions = ({ metrics, weakSubjects }) => {
  const tips = []
  if (metrics.passRate !== null && metrics.passRate < 60) {
    tips.push('班级整体及格率偏低，建议加强基础知识的巩固和练习')
  }
  if (weakSubjects.length > 0) {
    tips.push(`重点关注${weakSubjects.map(s => s.name).join('、')}等薄弱学科的学习`)
  }
  if (metrics.averageScore !== null && metrics.averageScore < 70) {
    tips.push('班级平均分有待提高，建议优化教学方法，提高课堂效率')
  }
  if (tips.length === 0) {
    tips.push('班级整体表现良好，继续保持学习状态')
  }
  return tips
}

export const formatDelta = (value) => {
  if (value === null || value === undefined || value === '') return '--'
  const num = Number(value)
  if (Number.isNaN(num)) return '--'
  return `${num > 0 ? '+' : ''}${num}`
}

export const deltaClass = (value) => {
  const num = Number(value)
  if (num > 0) return 'delta-up'
  if (num < 0) return 'delta-down'
  return ''
}