<template>
  <div class="learning-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>📚 在线学习资源推荐</h1>
          <p>AI智能分析，个性化学习资源推荐</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="refreshRecommendations">
            <el-icon><Refresh /></el-icon>
            刷新推荐
          </el-button>
        </div>
      </div>
    </div>

    <!-- AI学习分析卡片 -->
    <div class="ai-analysis-section">
      <div class="analysis-card">
        <div class="analysis-header">
          <div class="ai-icon">
            <el-icon :size="32"><MagicStick /></el-icon>
          </div>
          <div class="ai-info">
            <h3>AI学习分析报告</h3>
            <p>基于您的学习数据智能分析</p>
          </div>
          <div class="header-actions">
            <el-tag type="success" effect="dark">实时更新</el-tag>
            <el-button type="primary" size="small" @click="openAIAnalysis" :loading="aiAnalyzing">
              <el-icon><ChatDotRound /></el-icon>
              AI深度分析
            </el-button>
          </div>
        </div>
        <div class="analysis-body">
          <div class="analysis-item">
            <div class="item-icon" style="background: linear-gradient(135deg, #10b981, #059669);">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="item-content">
              <span class="item-label">学习进度</span>
              <span class="item-value">{{ learningProgress }}%</span>
            </div>
            <el-progress :percentage="learningProgress" :stroke-width="8" :show-text="false" color="#10b981" />
          </div>
          <div class="analysis-item">
            <div class="item-icon" style="background: linear-gradient(135deg, #3b82f6, #2563eb);">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="item-content">
              <span class="item-label">本周学习时长</span>
              <span class="item-value">{{ weeklyHours }} 小时</span>
            </div>
            <el-progress :percentage="weeklyHours / 40 * 100" :stroke-width="8" :show-text="false" color="#3b82f6" />
          </div>
          <div class="analysis-item">
            <div class="item-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
              <el-icon><Star /></el-icon>
            </div>
            <div class="item-content">
              <span class="item-label">掌握程度</span>
              <span class="item-value">{{ masteryLevel }}</span>
            </div>
            <el-progress :percentage="masteryPercent" :stroke-width="8" :show-text="false" color="#f59e0b" />
          </div>
        </div>
        <div class="ai-suggestion">
          <el-icon><InfoFilled /></el-icon>
          <span>{{ aiSuggestion }}</span>
        </div>
      </div>

      <!-- 学习能力雷达图 -->
      <div class="radar-card">
        <h3>学习能力分析</h3>
        <div ref="radarChart" class="radar-chart"></div>
      </div>
    </div>

    <!-- 推荐资源分类 -->
    <div class="resource-tabs">
      <el-tabs v-model="activeTab" class="custom-tabs">
        <el-tab-pane label="视频课程" name="video">
          <div class="resource-grid">
            <div v-for="item in videoResources" :key="item.id" class="resource-card video-card">
              <div class="card-cover">
                <img :src="item.cover" :alt="item.title" />
                <div class="play-btn">
                  <el-icon :size="32"><VideoPlay /></el-icon>
                </div>
                <span class="duration">{{ item.duration }}</span>
              </div>
              <div class="card-body">
                <h4>{{ item.title }}</h4>
                <p class="instructor">{{ item.instructor }}</p>
                <div class="card-meta">
                  <span class="rating">
                    <el-icon><Star /></el-icon>
                    {{ item.rating }}
                  </span>
                  <span class="views">{{ item.views }} 人学过</span>
                </div>
                <el-button type="primary" size="small" class="start-btn" @click="startLearning(item)">
                  开始学习
                </el-button>
              </div>
              <div class="ai-match">
                <el-icon><MagicStick /></el-icon>
                AI匹配度 {{ item.matchScore }}%
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="文档资料" name="document">
          <div class="resource-grid">
            <div v-for="item in documentResources" :key="item.id" class="resource-card doc-card">
              <div class="doc-icon" :style="{ background: item.color }">
                <el-icon :size="28"><Document /></el-icon>
              </div>
              <div class="card-body">
                <h4>{{ item.title }}</h4>
                <p class="desc">{{ item.description }}</p>
                <div class="card-meta">
                  <el-tag size="small" :type="item.type === 'PDF' ? 'danger' : 'primary'">{{ item.type }}</el-tag>
                  <span class="size">{{ item.size }}</span>
                </div>
                <el-button type="success" size="small" class="download-btn" @click="downloadResource(item)">
                  获取资料
                </el-button>
              </div>
              <div class="ai-match">
                <el-icon><MagicStick /></el-icon>
                AI匹配度 {{ item.matchScore }}%
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="在线测试" name="quiz">
          <div class="resource-grid">
            <div v-for="item in quizResources" :key="item.id" class="resource-card quiz-card">
              <div class="quiz-icon" :style="{ background: item.color }">
                <el-icon :size="28"><EditPen /></el-icon>
              </div>
              <div class="card-body">
                <h4>{{ item.title }}</h4>
                <p class="desc">{{ item.description }}</p>
                <div class="quiz-info">
                  <span><el-icon><Clock /></el-icon> {{ item.duration }}分钟</span>
                  <span><el-icon><Document /></el-icon> {{ item.questions }}题</span>
                </div>
                <el-button type="warning" size="small" class="start-quiz-btn" @click="startQuiz(item)">
                  开始测试
                </el-button>
              </div>
              <div class="ai-match">
                <el-icon><MagicStick /></el-icon>
                AI推荐指数 {{ item.matchScore }}%
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="学习路径" name="path">
          <div class="learning-path">
            <div v-for="(path, index) in learningPaths" :key="path.id" class="path-item">
              <div class="path-number">{{ index + 1 }}</div>
              <div class="path-content">
                <div class="path-header">
                  <h4>{{ path.title }}</h4>
                  <el-tag :type="path.status === 'completed' ? 'success' : path.status === 'current' ? 'primary' : 'info'" size="small">
                    {{ path.status === 'completed' ? '已完成' : path.status === 'current' ? '进行中' : '待学习' }}
                  </el-tag>
                </div>
                <p>{{ path.description }}</p>
                <el-progress :percentage="path.progress" :status="path.progress === 100 ? 'success' : ''" />
              </div>
              <div class="path-action">
                <el-button :type="path.status === 'completed' ? 'success' : 'primary'" size="small" :disabled="path.status === 'locked'">
                  {{ path.status === 'completed' ? '复习' : path.status === 'current' ? '继续学习' : '开始学习' }}
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- AI深度分析对话框 -->
    <el-dialog v-model="showAIDialog" title="🤖 AI学习分析报告" width="650px" class="ai-dialog">
      <div class="ai-result">
        <div class="result-content" v-html="formatAIResult(aiAnalysisResult)"></div>
      </div>
      <template #footer>
        <el-button @click="showAIDialog = false">关闭</el-button>
        <el-button type="primary" @click="exportAIReport">导出报告</el-button>
      </template>
    </el-dialog>
    
    <!-- AI聊天对话窗口 -->
    <el-dialog v-model="showChatDialog" title="💬 AI智能学习助手" width="500px" class="ai-chat-dialog">
      <div class="chat-container">
        <div class="chat-messages" ref="chatMessagesRef">
          <div v-for="(msg, index) in chatMessages" :key="index" 
               :class="['chat-message', msg.role === 'user' ? 'user-message' : 'ai-message']">
            <div class="message-avatar">
              <span v-if="msg.role === 'user'">👤</span>
              <span v-else>🤖</span>
            </div>
            <div class="message-content">
              <div class="message-text">{{ msg.content }}</div>
              <div class="message-time">{{ msg.time }}</div>
            </div>
          </div>
          <div v-if="chatLoading" class="chat-message ai-message">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
        <div class="chat-input-area">
          <el-input 
            v-model="chatInput" 
            placeholder="请输入您的学习问题..."
            @keyup.enter="sendChatMessage"
            :disabled="chatLoading"
          />
          <el-button type="primary" @click="sendChatMessage" :loading="chatLoading">
            <el-icon><Promotion /></el-icon>
          </el-button>
        </div>
        <div class="quick-questions">
          <span class="quick-label">快捷提问：</span>
          <el-tag v-for="q in quickQuestions" :key="q" size="small" @click="askQuickQuestion(q)" class="quick-tag">
            {{ q }}
          </el-tag>
        </div>
      </div>
    </el-dialog>
    
    <!-- 悬浮AI聊天按钮 -->
    <div class="ai-chat-fab" @click="openChatDialog">
      <el-icon :size="24"><ChatDotRound /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, MagicStick, TrendCharts, Clock, Star, InfoFilled, VideoPlay, Document, EditPen, ChatDotRound, Promotion } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

defineOptions({ name: 'Learning' })

const activeTab = ref('video')
const radarChart = ref(null)

// AI分析数据
const learningProgress = ref(72)
const weeklyHours = ref(18)
const masteryLevel = ref('良好')
const masteryPercent = ref(75)
const aiSuggestion = ref('根据您的学习情况，建议加强"数据结构"和"算法"相关知识的学习，推荐优先完成下方视频课程。')

// 视频资源 - 使用真实教育平台图片和链接
const videoResources = ref([
  { id: 1, title: '数据结构与算法精讲', instructor: '清华大学', cover: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400', duration: '12:30:00', rating: 4.9, views: 2856, matchScore: 98, link: 'https://www.icourse163.org/course/THU-1001521002' },
  { id: 2, title: '计算机网络原理', instructor: '哈工大', cover: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400', duration: '8:45:00', rating: 4.8, views: 1924, matchScore: 92, link: 'https://www.icourse163.org/course/HIT-154005' },
  { id: 3, title: '操作系统深入理解', instructor: '北京大学', cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400', duration: '10:20:00', rating: 4.7, views: 1567, matchScore: 88, link: 'https://www.icourse163.org/course/PKU-1002636004' },
  { id: 4, title: 'Python机器学习实战', instructor: '浙江大学', cover: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400', duration: '15:00:00', rating: 4.9, views: 3421, matchScore: 85, link: 'https://www.icourse163.org/course/ZJU-1206573810' },
  { id: 5, title: 'Web前端开发全栈', instructor: '北京理工', cover: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400', duration: '20:00:00', rating: 4.8, views: 2156, matchScore: 82, link: 'https://www.icourse163.org/course/BIT-1001870002' },
  { id: 6, title: '数据库系统原理', instructor: '人民大学', cover: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400', duration: '9:30:00', rating: 4.6, views: 1823, matchScore: 78, link: 'https://www.icourse163.org/course/RUC-1001655002' },
  { id: 7, title: 'Java程序设计', instructor: '浙江大学', cover: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400', duration: '16:00:00', rating: 4.8, views: 4521, matchScore: 90, link: 'https://www.icourse163.org/course/ZJU-1001541001' },
  { id: 8, title: '人工智能导论', instructor: '南京大学', cover: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400', duration: '14:00:00', rating: 4.9, views: 3892, matchScore: 87, link: 'https://www.icourse163.org/course/NJU-1462065162' },
  { id: 9, title: '软件工程导论', instructor: '同济大学', cover: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400', duration: '11:00:00', rating: 4.7, views: 2134, matchScore: 84, link: 'https://www.icourse163.org/course/TONGJI-1002190004' }
])

// 文档资源 - 添加更多资源
const documentResources = ref([
  { id: 1, title: '算法导论（第三版）笔记', description: '详细整理的算法导论核心知识点', type: 'PDF', size: '15.2 MB', color: 'linear-gradient(135deg, #ef4444, #dc2626)', matchScore: 96, link: 'https://github.com/TheAlgorithms' },
  { id: 2, title: '计算机网络考研重点', description: '408考研计算机网络复习资料', type: 'PDF', size: '8.7 MB', color: 'linear-gradient(135deg, #3b82f6, #2563eb)', matchScore: 91, link: 'https://www.cs.princeton.edu/courses/archive/fall06/cos561/' },
  { id: 3, title: 'Linux操作系统实验指南', description: '操作系统课程配套实验手册', type: 'DOCX', size: '5.3 MB', color: 'linear-gradient(135deg, #10b981, #059669)', matchScore: 87, link: 'https://linuxjourney.com/' },
  { id: 4, title: 'SQL数据库完全参考手册', description: 'SQL语法及数据库设计指南', type: 'PDF', size: '12.1 MB', color: 'linear-gradient(135deg, #f59e0b, #d97706)', matchScore: 84, link: 'https://www.w3schools.com/sql/' },
  { id: 5, title: 'Python编程快速入门', description: 'Python基础语法与实战案例', type: 'PDF', size: '9.8 MB', color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', matchScore: 82, link: 'https://docs.python.org/zh-cn/3/tutorial/' },
  { id: 6, title: 'Git版本控制指南', description: 'Git命令大全与工作流指南', type: 'PDF', size: '6.2 MB', color: 'linear-gradient(135deg, #ec4899, #db2777)', matchScore: 80, link: 'https://git-scm.com/book/zh/v2' }
])

// 测试资源 - 添加跳转链接
const quizResources = ref([
  { id: 1, title: '数据结构期中模拟测试', description: '涵盖链表、栈、队列、树等知识点', duration: 60, questions: 50, color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', matchScore: 95, link: 'https://www.nowcoder.com/exam/oj?page=1&tab=%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84%E7%AF%87' },
  { id: 2, title: '计算机网络随堂测验', description: 'TCP/IP协议族相关内容测试', duration: 30, questions: 25, color: 'linear-gradient(135deg, #ec4899, #db2777)', matchScore: 89, link: 'https://www.nowcoder.com/exam/oj?page=1&tab=%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C' },
  { id: 3, title: '算法设计与分析练习', description: '动态规划、贪心算法专项训练', duration: 90, questions: 30, color: 'linear-gradient(135deg, #14b8a6, #0d9488)', matchScore: 86, link: 'https://leetcode.cn/problemset/' }
])

// 学习路径
const learningPaths = ref([
  { id: 1, title: '编程基础入门', description: '掌握C/C++基础语法和编程思想', progress: 100, status: 'completed' },
  { id: 2, title: '数据结构与算法', description: '深入理解常用数据结构和经典算法', progress: 65, status: 'current' },
  { id: 3, title: '计算机系统基础', description: '学习操作系统、计算机组成原理', progress: 30, status: 'current' },
  { id: 4, title: '软件开发实践', description: '项目开发、软件工程方法论', progress: 0, status: 'pending' },
  { id: 5, title: '人工智能与大数据', description: '机器学习、深度学习、数据分析', progress: 0, status: 'locked' }
])

const refreshRecommendations = () => {
  ElMessage.success('正在刷新推荐内容...')
}

const startLearning = (item) => {
  if (item.link) {
    window.open(item.link, '_blank')
    ElMessage.success(`正在跳转到：${item.title}`)
  } else {
    ElMessage.info(`开始学习：${item.title}`)
  }
}

const downloadResource = (item) => {
  if (item.link) {
    window.open(item.link, '_blank')
    ElMessage.success(`正在跳转到资源页面：${item.title}`)
  } else {
    ElMessage.success(`开始下载：${item.title}`)
  }
}

const startQuiz = (item) => {
  if (item.link) {
    window.open(item.link, '_blank')
    ElMessage.success(`正在跳转到测试页面：${item.title}`)
  } else {
    ElMessage.info(`开始测试：${item.title}`)
  }
}

// AI深度分析功能
const aiAnalyzing = ref(false)
const showAIDialog = ref(false)
const aiAnalysisResult = ref('')

const formatAIResult = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}

const exportAIReport = () => {
  ElMessage.success('正在导出AI分析报告...')
  const blob = new Blob([aiAnalysisResult.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'AI学习分析报告.txt'
  a.click()
  URL.revokeObjectURL(url)
}

// AI聊天功能
const showChatDialog = ref(false)
const chatInput = ref('')
const chatLoading = ref(false)
const chatMessagesRef = ref(null)
const chatMessages = ref([
  { role: 'ai', content: '您好！我是AI学习助手，基于您的学习轨迹分析，可以为您提供个性化的学习建议。您可以问我关于学习规划、课程推荐、知识点讲解等问题！', time: '刚刚' }
])

const quickQuestions = ref([
  '数据结构如何学习？',
  '推荐算法练习网站',
  '如何提高编程能力？',
  '本周学习计划'
])

const openChatDialog = () => {
  showChatDialog.value = true
}

const askQuickQuestion = (question) => {
  chatInput.value = question
  sendChatMessage()
}

const sendChatMessage = async () => {
  if (!chatInput.value.trim() || chatLoading.value) return
  
  const userMessage = chatInput.value.trim()
  chatMessages.value.push({
    role: 'user',
    content: userMessage,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  })
  chatInput.value = ''
  chatLoading.value = true
  
  await nextTick()
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
  }
  
  // 模拟AI回复
  setTimeout(() => {
    const aiResponses = {
      '数据结构如何学习？': '根据您的学习轨迹，您在数据结构方面已掌握了基础知识。建议：\n1. 先学习链表、栈、队列等线性结构\n2. 然后进阶到树、图等非线性结构\n3. 每天在LeetCode上练习2-3道题\n4. 推荐观看《数据结构与算法精讲》课程（AI匹配度98%）',
      '推荐算法练习网站': '基于您的当前水平，推荐以下练习平台：\n1. LeetCode（推荐先做Hot100）\n2. 牵牛客（有丰富的面试题库）\n3. 洛谷（竞赛向）\n\n根据您薄弱环节“二叉树遍历、动态规划”，建议每日重点练习这两个专题。',
      '如何提高编程能力？': '您的编程能力评分为85/100，已经很不错！进一步提升建议：\n1. 参与开源项目，学习优秀代码风格\n2. 多读源码，理解设计模式\n3. 坚持代码review，与同学互相学习\n4. 尝试用不同语言实现同一算法',
      '本周学习计划': '根据您的学习进度，为您定制本周计划：\n\n📅 周一-周三：完成《数据结构与算法》第5-6章\n📅 周四-周五：LeetCode二叉树专题练习10题\n📅 周六：复习已学内容，整理笔记\n📅 周日：完成周测验，查漏补缺\n\n预计学习时长：18小时'
    }
    
    let response = aiResponses[userMessage]
    if (!response) {
      response = `您的问题“${userMessage}”很好！\n\n根据您的学习数据分析：\n- 最近学习：数据结构、算法设计、Python编程\n- 薄弱环节：二叉树遍历、动态规划\n- 推荐重点：强化算法思维，提升编程能力\n\n建议每天学习1-2小时，配合练习题巩固知识点。您还可以问我更具体的问题！`
    }
    
    chatMessages.value.push({
      role: 'ai',
      content: response,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    })
    chatLoading.value = false
    
    nextTick(() => {
      if (chatMessagesRef.value) {
        chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
      }
    })
  }, 1500)
}

const openAIAnalysis = async () => {
  aiAnalyzing.value = true
  ElMessage.info('AI正在分析您的学习数据...')
  
  // 模拟AI分析过程
  setTimeout(() => {
    aiAnalysisResult.value = `
📊 **学习数据分析报告**

根据您近期的学习数据，AI为您生成以下分析：

**1. 学习优势**
- 编程能力突出，代码质量高于平均水平15%
- 算法思维能力较强，解题效率高
- 学习效率稳定，每日学习时间分配合理

**2. 待提升领域**
- 系统设计方面建议加强实践
- 项目实践经验相对不足，建议参与更多实战项目
- 团队协作技能可以通过小组项目提升

**3. 个性化学习建议**
- 推荐优先学习"数据结构与算法"课程（匹配度98%）
- 建议每周增加2-3小时的编程实践
- 可以尝试参与开源项目提升实战能力

**4. 学习路径规划**
- 短期目标：完成数据结构专项训练
- 中期目标：掌握常见设计模式
- 长期目标：构建完整的计算机科学知识体系

💡 AI提示：保持当前学习节奏，预计2周后可完成"数据结构与算法"课程学习。
    `
    aiAnalyzing.value = false
    showAIDialog.value = true
  }, 2000)
}

const initRadarChart = () => {
  if (!radarChart.value) return
  const chart = echarts.init(radarChart.value)
  chart.setOption({
    radar: {
      indicator: [
        { name: '编程能力', max: 100 },
        { name: '算法思维', max: 100 },
        { name: '系统设计', max: 100 },
        { name: '项目实践', max: 100 },
        { name: '团队协作', max: 100 },
        { name: '学习效率', max: 100 }
      ],
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: '#333' },
      splitLine: { lineStyle: { color: 'rgba(16, 185, 129, 0.3)' } },
      splitArea: { areaStyle: { color: ['rgba(16, 185, 129, 0.05)', 'rgba(16, 185, 129, 0.1)'] } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: [85, 72, 68, 60, 78, 82],
        name: '能力评估',
        areaStyle: { color: 'rgba(16, 185, 129, 0.3)' },
        lineStyle: { color: '#10b981', width: 2 },
        itemStyle: { color: '#10b981' }
      }]
    }]
  })
}

onMounted(() => {
  setTimeout(initRadarChart, 100)
})
</script>

<style scoped>
.learning-page {
  padding: 0;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.header-left p {
  margin: 0;
  opacity: 0.9;
}

/* AI分析区域 */
.ai-analysis-section {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.analysis-card, .radar-card {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.analysis-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.ai-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.ai-info h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
}

.ai-info p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.analysis-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.analysis-item {
  display: grid;
  grid-template-columns: 48px 1fr 120px;
  align-items: center;
  gap: 16px;
}

.item-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.item-content {
  display: flex;
  flex-direction: column;
}

.item-label {
  font-size: 13px;
  color: #6b7280;
}

.item-value {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.ai-suggestion {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 16px;
  background: rgba(16, 185, 129, 0.15);
  border-radius: 12px;
  font-size: 14px;
  color: #065f46;
  line-height: 1.6;
}

.radar-card h3 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #1f2937;
}

.radar-chart {
  height: 280px;
}

/* 资源标签页 */
.resource-tabs {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

:deep(.custom-tabs .el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
}

:deep(.custom-tabs .el-tabs__active-bar) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.resource-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  position: relative;
}

.resource-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 视频卡片 */
.card-cover {
  position: relative;
  height: 140px;
  overflow: hidden;
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
  opacity: 0;
  transition: all 0.3s;
}

.resource-card:hover .play-btn {
  opacity: 1;
}

.duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.card-body {
  padding: 16px;
}

.card-body h4 {
  margin: 0 0 8px;
  font-size: 15px;
  color: #1f2937;
  line-height: 1.4;
}

.instructor {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 12px;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
  color: #9ca3af;
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f59e0b;
}

.start-btn, .download-btn, .start-quiz-btn {
  width: 100%;
}

.ai-match {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 文档卡片 */
.doc-icon, .quiz-icon {
  width: 80px;
  height: 80px;
  margin: 20px auto 0;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.doc-card .card-body, .quiz-card .card-body {
  text-align: center;
}

.desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 12px;
}

.size {
  font-size: 12px;
  color: #9ca3af;
}

/* 测试卡片 */
.quiz-info {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #6b7280;
}

.quiz-info span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 学习路径 */
.learning-path {
  margin-top: 20px;
}

.path-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.path-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}

.path-content {
  flex: 1;
}

.path-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.path-header h4 {
  margin: 0;
  font-size: 15px;
  color: #1f2937;
}

.path-content p {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7280;
}

.path-action {
  flex-shrink: 0;
}

@media (max-width: 1200px) {
  .ai-analysis-section {
    grid-template-columns: 1fr;
  }
  .resource-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .resource-grid {
    grid-template-columns: 1fr;
  }
}

/* AI分析头部操作按钮 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* AI分析对话框 */
:deep(.ai-dialog .el-dialog) {
  border-radius: 16px;
}

:deep(.ai-dialog .el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.ai-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
}

.ai-result {
  max-height: 500px;
  overflow-y: auto;
}

.result-content {
  padding: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  line-height: 1.8;
  font-size: 14px;
  color: #374151;
}

.result-content strong {
  color: #1f2937;
  font-weight: 600;
}

/* AI聊天窗口样式 */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 450px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 12px;
}

.chat-message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.user-message .message-avatar {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.message-content {
  max-width: 75%;
}

.message-text {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-line;
}

.ai-message .message-text {
  background: white;
  color: #374151;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.user-message .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
  padding: 0 4px;
}

.user-message .message-time {
  text-align: right;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: white;
  border-radius: 16px;
  border-bottom-left-radius: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #9ca3af;
  border-radius: 50%;
  animation: typing 1.4s infinite both;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

.chat-input-area {
  display: flex;
  gap: 8px;
}

.chat-input-area .el-input {
  flex: 1;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  align-items: center;
}

.quick-label {
  font-size: 12px;
  color: #9ca3af;
}

.quick-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.quick-tag:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* 悬浮AI聊天按钮 */
.ai-chat-fab {
  position: fixed;
  bottom: 80px;
  right: 30px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  transition: all 0.3s;
  z-index: 1000;
}

.ai-chat-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 30px rgba(102, 126, 234, 0.6);
}
</style>
