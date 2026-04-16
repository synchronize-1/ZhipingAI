<template>
  <div class="course-interaction">
    <!-- 课堂签到区域 -->
    <div class="interaction-section checkin-section">
      <div class="section-header">
        <div class="header-left">
          <div class="icon-wrapper checkin-icon">
            <el-icon :size="20"><Clock /></el-icon>
          </div>
          <div>
            <h3>课堂签到</h3>
            <p>请在上课时间内完成签到</p>
          </div>
        </div>
        <el-tag :type="checkinStatus.type" size="large">{{ checkinStatus.text }}</el-tag>
      </div>
      
      <div class="checkin-content">
        <div class="checkin-info">
          <div class="info-item">
            <span class="info-label">上课时间</span>
            <span class="info-value">08:00 - 09:40</span>
          </div>
          <div class="info-item">
            <span class="info-label">上课地点</span>
            <span class="info-value">教学楼A-301</span>
          </div>
          <div class="info-item">
            <span class="info-label">签到方式</span>
            <span class="info-value">{{ checkinMethod }}</span>
          </div>
        </div>
        
        <div class="checkin-action">
          <div v-if="!hasCheckedIn" class="checkin-methods">
            <el-button type="primary" size="large" class="checkin-btn" @click="doCheckin('location')">
              <el-icon><Location /></el-icon>
              位置签到
            </el-button>
            <el-button type="success" size="large" class="checkin-btn" @click="showQRDialog = true">
              <el-icon><Camera /></el-icon>
              扫码签到
            </el-button>
            <el-button type="warning" size="large" class="checkin-btn" @click="showCodeDialog = true">
              <el-icon><Key /></el-icon>
              签到码
            </el-button>
          </div>
          <div v-else class="checkin-success">
            <el-icon :size="48" class="success-icon"><CircleCheck /></el-icon>
            <p class="success-text">签到成功</p>
            <p class="checkin-time">签到时间：{{ checkinTime }}</p>
          </div>
        </div>
        
        <div class="checkin-stats">
          <div class="stat-item">
            <span class="stat-value">{{ checkinStats.total }}</span>
            <span class="stat-label">应到人数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value text-green-500">{{ checkinStats.checked }}</span>
            <span class="stat-label">已签到</span>
          </div>
          <div class="stat-item">
            <span class="stat-value text-orange-500">{{ checkinStats.late }}</span>
            <span class="stat-label">迟到</span>
          </div>
          <div class="stat-item">
            <span class="stat-value text-red-500">{{ checkinStats.absent }}</span>
            <span class="stat-label">缺勤</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 课堂提问区域 -->
    <div class="interaction-section questions-section">
      <div class="section-header">
        <div class="header-left">
          <div class="icon-wrapper question-icon">
            <el-icon :size="20"><ChatLineSquare /></el-icon>
          </div>
          <div>
            <h3>课堂提问</h3>
            <p>向老师提出你的疑问</p>
          </div>
        </div>
        <el-button type="primary" @click="showQuestionDialog = true" class="add-btn">
          <el-icon><Plus /></el-icon>
          提问
        </el-button>
      </div>

      <div class="questions-list">
        <div v-if="questions.length === 0" class="empty-state">
          <img src="https://img.icons8.com/fluency/96/question-mark.png" alt="暂无提问" />
          <p>暂无提问，点击右上角按钮提出你的问题</p>
        </div>
        
        <div 
          v-for="question in questions" 
          :key="question.id" 
          class="question-card"
          :class="{ 'is-answered': question.answer }"
        >
          <div class="question-header">
            <div class="user-info">
              <el-avatar :size="32" :src="question.userAvatar">
                {{ question.userName?.charAt(0) }}
              </el-avatar>
              <div>
                <span class="user-name">{{ question.userName }}</span>
                <span class="question-time">{{ question.time }}</span>
              </div>
            </div>
            <el-tag :type="question.answer ? 'success' : 'warning'" size="small">
              {{ question.answer ? '已回答' : '待回答' }}
            </el-tag>
          </div>
          <div class="question-content">
            <p class="question-text">{{ question.content }}</p>
            <div v-if="question.answer" class="answer-box">
              <div class="answer-header">
                <el-icon><User /></el-icon>
                <span>{{ question.answerBy }} 回复</span>
              </div>
              <p class="answer-text">{{ question.answer }}</p>
            </div>
          </div>
          <div class="question-actions">
            <el-button text size="small" @click="likeQuestion(question)">
              <el-icon><Star /></el-icon>
              {{ question.likes || 0 }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 课程评价区域 -->
    <div class="interaction-section rating-section">
      <div class="section-header">
        <div class="header-left">
          <div class="icon-wrapper rating-icon">
            <el-icon :size="20"><Trophy /></el-icon>
          </div>
          <div>
            <h3>课程评价</h3>
            <p>分享你的学习体验</p>
          </div>
        </div>
        <el-button type="primary" @click="showRatingDialog = true" class="add-btn">
          <el-icon><EditPen /></el-icon>
          评价
        </el-button>
      </div>

      <!-- 评分统计 -->
      <div class="rating-summary">
        <div class="overall-score">
          <span class="score-number">{{ averageRating.toFixed(1) }}</span>
          <div class="score-stars">
            <el-rate v-model="averageRating" disabled :colors="ratingColors" />
            <span class="rating-count">{{ ratings.length }} 条评价</span>
          </div>
        </div>
        <div class="rating-bars">
          <div v-for="i in 5" :key="i" class="rating-bar">
            <span class="bar-label">{{ 6 - i }}星</span>
            <el-progress 
              :percentage="getRatingPercentage(6 - i)" 
              :stroke-width="8"
              :show-text="false"
              :color="ratingColors[2]"
            />
            <span class="bar-count">{{ getRatingCount(6 - i) }}</span>
          </div>
        </div>
      </div>

      <!-- 评价列表 -->
      <div class="ratings-list">
        <div v-for="rating in ratings" :key="rating.id" class="rating-card">
          <div class="rating-header">
            <div class="user-info">
              <el-avatar :size="36" :src="rating.userAvatar">
                {{ rating.userName?.charAt(0) }}
              </el-avatar>
              <div>
                <span class="user-name">{{ rating.userName }}</span>
                <el-rate v-model="rating.score" disabled size="small" :colors="ratingColors" />
              </div>
            </div>
            <span class="rating-time">{{ rating.time }}</span>
          </div>
          <p class="rating-content">{{ rating.content }}</p>
          <div class="rating-tags">
            <el-tag 
              v-for="tag in rating.tags" 
              :key="tag" 
              size="small" 
              effect="plain"
              class="rating-tag"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 提问对话框 -->
    <el-dialog 
      v-model="showQuestionDialog" 
      title="提出问题" 
      width="500px"
      class="interaction-dialog"
    >
      <el-form :model="questionForm" label-position="top">
        <el-form-item label="问题内容">
          <el-input 
            v-model="questionForm.content" 
            type="textarea" 
            :rows="4"
            placeholder="请输入你的问题..."
          />
        </el-form-item>
        <el-form-item label="是否匿名">
          <el-switch v-model="questionForm.anonymous" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showQuestionDialog = false">取消</el-button>
        <el-button type="primary" @click="submitQuestion">提交问题</el-button>
      </template>
    </el-dialog>

    <!-- 评价对话框 -->
    <el-dialog 
      v-model="showRatingDialog" 
      title="课程评价" 
      width="500px"
      class="interaction-dialog"
    >
      <el-form :model="ratingForm" label-position="top">
        <el-form-item label="总体评分">
          <div class="rating-input">
            <el-rate 
              v-model="ratingForm.score" 
              :colors="ratingColors"
              show-score
              :texts="['很差', '较差', '一般', '较好', '很好']"
              show-text
            />
          </div>
        </el-form-item>
        <el-form-item label="评价标签">
          <div class="tag-options">
            <el-check-tag 
              v-for="tag in availableTags" 
              :key="tag"
              :checked="ratingForm.tags.includes(tag)"
              @change="toggleTag(tag)"
              class="tag-option"
            >
              {{ tag }}
            </el-check-tag>
          </div>
        </el-form-item>
        <el-form-item label="详细评价">
          <el-input 
            v-model="ratingForm.content" 
            type="textarea" 
            :rows="4"
            placeholder="分享你的学习体验..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRatingDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRating">提交评价</el-button>
      </template>
    </el-dialog>

    <!-- 签到码对话框 -->
    <el-dialog 
      v-model="showCodeDialog" 
      title="输入签到码" 
      width="400px"
      class="interaction-dialog"
    >
      <div class="code-input-container">
        <p class="code-hint">请输入老师发布的4位签到码</p>
        <el-input 
          v-model="checkinCode" 
          size="large"
          maxlength="4"
          placeholder="请输入签到码"
          class="code-input"
        />
      </div>
      <template #footer>
        <el-button @click="showCodeDialog = false">取消</el-button>
        <el-button type="primary" @click="doCheckin('code')">确认签到</el-button>
      </template>
    </el-dialog>

    <!-- 扫码签到对话框 -->
    <el-dialog 
      v-model="showQRDialog" 
      title="扫码签到" 
      width="400px"
      class="interaction-dialog"
    >
      <div class="qr-container">
        <div class="qr-placeholder">
          <el-icon :size="64" class="qr-icon"><Camera /></el-icon>
          <p>请使用手机扫描教室内的二维码</p>
        </div>
        <el-button type="primary" size="large" class="simulate-btn" @click="doCheckin('qr')">
          模拟扫码成功
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { ChatLineSquare, Plus, User, Star, Trophy, EditPen, Clock, Location, Camera, Key, CircleCheck } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  },
  courseName: {
    type: String,
    default: ''
  }
})

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
const averageRating = computed(() => {
  if (ratings.value.length === 0) return 0
  const sum = ratings.value.reduce((acc, r) => acc + r.score, 0)
  return sum / ratings.value.length
})

// 获取某星级的评价数量
const getRatingCount = (star) => {
  return ratings.value.filter(r => r.score === star).length
}

// 获取某星级的百分比
const getRatingPercentage = (star) => {
  if (ratings.value.length === 0) return 0
  return (getRatingCount(star) / ratings.value.length) * 100
}

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

  questionForm.value = { content: '', anonymous: false }
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

  ratingForm.value = { score: 5, content: '', tags: [] }
  showRatingDialog.value = false
  ElMessage.success('评价提交成功')
}
</script>

<style scoped>
.course-interaction {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.interaction-section {
  background: linear-gradient(135deg, #faf8f5 0%, #f5f0e8 100%);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.question-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.rating-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.checkin-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

/* 签到区域样式 */
.checkin-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.checkin-info {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #6b7280;
}

.info-value {
  font-size: 14px;
  color: #1a1a2e;
  font-weight: 500;
}

.checkin-action {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.checkin-methods {
  display: flex;
  gap: 16px;
}

.checkin-btn {
  min-width: 120px;
  height: 48px;
  border-radius: 12px;
}

.checkin-success {
  text-align: center;
  padding: 20px;
}

.success-icon {
  color: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.success-text {
  font-size: 20px;
  font-weight: 600;
  color: #10b981;
  margin: 12px 0 4px;
}

.checkin-time {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.checkin-stats {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

/* 签到码输入 */
.code-input-container {
  text-align: center;
  padding: 20px;
}

.code-hint {
  color: #4b5563;
  margin-bottom: 20px;
}

.code-input :deep(.el-input__inner) {
  text-align: center;
  font-size: 24px;
  letter-spacing: 8px;
  background: #fff;
  border-color: #d1d5db;
  color: #1f2937;
}

/* 扫码签到 */
.qr-container {
  text-align: center;
  padding: 20px;
}

.qr-placeholder {
  padding: 40px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 16px;
  border: 2px dashed #d1d5db;
  margin-bottom: 20px;
}

.qr-icon {
  color: #9ca3af;
  margin-bottom: 12px;
}

.qr-placeholder p {
  color: #6b7280;
  margin: 0;
}

.simulate-btn {
  width: 100%;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.section-header p {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #6b7280;
}

.add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
}

/* 提问列表 */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-state img {
  width: 64px;
  height: 64px;
  opacity: 0.6;
  margin-bottom: 12px;
}

.empty-state p {
  color: #6b7280;
  font-size: 14px;
}

.question-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.question-card:hover {
  background: #fafafa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.question-card.is-answered {
  border-color: rgba(103, 194, 58, 0.3);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-name {
  color: #1f2937;
  font-weight: 500;
  font-size: 14px;
}

.question-time {
  color: #9ca3af;
  font-size: 12px;
  margin-left: 8px;
}

.question-text {
  color: #374151;
  font-size: 15px;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.answer-box {
  background: rgba(103, 194, 58, 0.1);
  border-left: 3px solid #67c23a;
  border-radius: 0 12px 12px 0;
  padding: 12px 16px;
  margin-top: 12px;
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #67c23a;
  font-size: 13px;
  margin-bottom: 8px;
}

.answer-text {
  color: #374151;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.question-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.question-actions .el-button {
  color: #6b7280;
}

.question-actions .el-button:hover {
  color: #f5576c;
}

/* 评分统计 */
.rating-summary {
  display: flex;
  gap: 32px;
  padding: 20px;
  background: #fff;
  border-radius: 16px;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
}

.overall-score {
  text-align: center;
  padding-right: 32px;
  border-right: 1px solid #e5e7eb;
}

.score-number {
  font-size: 48px;
  font-weight: 700;
  color: #FFD700;
  line-height: 1;
}

.score-stars {
  margin-top: 8px;
}

.rating-count {
  display: block;
  color: #6b7280;
  font-size: 12px;
  margin-top: 4px;
}

.rating-bars {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  width: 32px;
  color: #6b7280;
  font-size: 13px;
}

.rating-bar :deep(.el-progress) {
  flex: 1;
}

.rating-bar :deep(.el-progress-bar__outer) {
  background: #e5e7eb;
}

.bar-count {
  width: 24px;
  color: #9ca3af;
  font-size: 12px;
  text-align: right;
}

/* 评价列表 */
.ratings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rating-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.rating-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.rating-time {
  color: #9ca3af;
  font-size: 12px;
}

.rating-content {
  color: #374151;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.rating-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rating-tag {
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.4);
  color: #a5b4fc;
}

/* 对话框样式 */
.interaction-dialog :deep(.el-dialog) {
  background: linear-gradient(135deg, #1e1e2f 0%, #2d2d44 100%);
  border-radius: 20px;
}

.interaction-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.interaction-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
}

.interaction-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.interaction-dialog :deep(.el-form-item__label) {
  color: rgba(255, 255, 255, 0.8);
}

.interaction-dialog :deep(.el-textarea__inner) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: white;
}

.rating-input {
  padding: 8px 0;
}

.tag-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-option {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  padding: 6px 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-option:hover {
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.4);
}

.tag-option.is-checked {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}
</style>
