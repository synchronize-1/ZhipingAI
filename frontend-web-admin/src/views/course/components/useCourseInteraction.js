import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { computeAverageRating } from '../utils/interactionCompute'

// 课堂互动（签到 / 提问 / 评价）的状态与业务逻辑。
export function useCourseInteraction() {
  const userStore = useUserStore()

  const showQuestionDialog = ref(false)
  const showRatingDialog = ref(false)
  const showCodeDialog = ref(false)
  const showQRDialog = ref(false)

  // 签到相关数据
  const hasCheckedIn = ref(false)
  const checkinTime = ref('')
  const checkinCode = ref('')
  const checkinMethod = ref('位置签到 / 扫码签到 / 签到码')
  const checkinStats = ref({
    total: 45,
    checked: 38,
    late: 4,
    absent: 3
  })

  const checkinStatus = computed(() => {
    if (hasCheckedIn.value) {
      return { type: 'success', text: '已签到' }
    }
    const now = new Date()
    const hour = now.getHours()
    if (hour >= 8 && hour < 10) {
      return { type: 'warning', text: '签到中' }
    }
    return { type: 'info', text: '未开始' }
  })

  // 执行签到
  const doCheckin = (method) => {
    if (method === 'code' && checkinCode.value.length !== 4) {
      ElMessage.warning('请输入4位签到码')
      return
    }

    hasCheckedIn.value = true
    checkinTime.value = new Date().toLocaleTimeString()
    checkinStats.value.checked++

    showCodeDialog.value = false
    showQRDialog.value = false

    const methodText = { location: '位置签到', qr: '扫码签到', code: '签到码签到' }[method]
    ElMessage.success(`${methodText}成功！`)
  }

  const ratingColors = ['#F56C6C', '#E6A23C', '#FFD700']

  const availableTags = [
    '内容丰富', '讲解清晰', '案例实用', '互动性强',
    '作业合理', '进度适中', '资料完善', '答疑及时'
  ]

  // 提问表单
  const questionForm = ref({
    content: '',
    anonymous: false
  })

  // 评价表单
  const ratingForm = ref({
    score: 5,
    content: '',
    tags: []
  })

  // 模拟数据 - 提问列表
  const questions = ref([
    {
      id: 1,
      userName: '张同学',
      userAvatar: 'https://img.icons8.com/color/48/user-male-circle--v1.png',
      content: '老师，请问第三章的递归算法有什么实际应用场景？',
      time: '今天 10:30',
      answer: '递归算法在树形结构遍历、分治算法、动态规划等场景都有广泛应用。比如文件系统的目录遍历、快速排序、归并排序等都使用了递归思想。',
      answerBy: '李老师',
      likes: 12
    },
    {
      id: 2,
      userName: '王同学',
      userAvatar: 'https://img.icons8.com/color/48/user-female-circle--v1.png',
      content: '数据结构和算法在实际工作中重要吗？',
      time: '昨天 15:20',
      answer: null,
      likes: 8
    }
  ])

  // 模拟数据 - 评价列表
  const ratings = ref([
    {
      id: 1,
      userName: '李同学',
      userAvatar: 'https://img.icons8.com/color/48/user-male-circle--v1.png',
      score: 5,
      content: '老师讲解非常清晰，案例丰富，收获很大！',
      tags: ['讲解清晰', '案例实用', '互动性强'],
      time: '3天前'
    },
    {
      id: 2,
      userName: '陈同学',
      userAvatar: 'https://img.icons8.com/color/48/user-female-circle--v1.png',
      score: 4,
      content: '课程内容很好，就是作业有点多，希望能适当调整。',
      tags: ['内容丰富', '资料完善'],
      time: '1周前'
    }
  ])

  // 计算平均评分
  const averageRating = computed(() => computeAverageRating(ratings.value))

  // 切换标签
  const toggleTag = (tag) => {
    const index = ratingForm.value.tags.indexOf(tag)
    if (index === -1) {
      ratingForm.value.tags.push(tag)
    } else {
      ratingForm.value.tags.splice(index, 1)
    }
  }

  // 点赞问题
  const likeQuestion = (question) => {
    question.likes = (question.likes || 0) + 1
    ElMessage.success('点赞成功')
  }

  // 提交问题
  const submitQuestion = () => {
    if (!questionForm.value.content.trim()) {
      ElMessage.warning('请输入问题内容')
      return
    }

    questions.value.unshift({
      id: Date.now(),
      userName: questionForm.value.anonymous ? '匿名用户' : userStore.user?.name,
      userAvatar: questionForm.value.anonymous ? '' : userStore.user?.avatar,
      content: questionForm.value.content,
      time: '刚刚',
      answer: null,
      likes: 0
    })

    // 就地重置，保持子组件持有的表单对象引用有效
    questionForm.value.content = ''
    questionForm.value.anonymous = false
    showQuestionDialog.value = false
    ElMessage.success('问题提交成功，等待老师回复')
  }

  // 提交评价
  const submitRating = () => {
    if (!ratingForm.value.content.trim()) {
      ElMessage.warning('请输入评价内容')
      return
    }

    ratings.value.unshift({
      id: Date.now(),
      userName: userStore.user?.name,
      userAvatar: userStore.user?.avatar,
      score: ratingForm.value.score,
      content: ratingForm.value.content,
      tags: [...ratingForm.value.tags],
      time: '刚刚'
    })

    // 就地重置，保持子组件持有的表单对象引用有效
    ratingForm.value.score = 5
    ratingForm.value.content = ''
    ratingForm.value.tags = []
    showRatingDialog.value = false
    ElMessage.success('评价提交成功')
  }

  return {
    showQuestionDialog,
    showRatingDialog,
    showCodeDialog,
    showQRDialog,
    hasCheckedIn,
    checkinTime,
    checkinCode,
    checkinMethod,
    checkinStats,
    checkinStatus,
    doCheckin,
    ratingColors,
    availableTags,
    questionForm,
    ratingForm,
    questions,
    ratings,
    averageRating,
    toggleTag,
    likeQuestion,
    submitQuestion,
    submitRating
  }
}