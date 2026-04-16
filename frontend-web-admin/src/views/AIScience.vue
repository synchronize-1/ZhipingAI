<template>
  <div class="ai-science-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>🤖 AI科普乐园</h1>
      <p class="subtitle">探索人工智能的奇妙世界 | 科普50% + 体验50%</p>
    </div>

    <!-- 功能标签页 -->
    <el-tabs v-model="activeTab" type="card" class="ai-tabs">
      <!-- AI体验中心 -->
      <el-tab-pane label="🎨 AI体验中心" name="experience">
        <div class="experience-grid">
          <!-- AI对话 -->
          <el-card class="experience-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="icon">💬</span>
                <span class="title">AI对话</span>
              </div>
            </template>
            <div class="chat-section">
              <div class="chat-messages" ref="chatMessages">
                <!-- 空状态欢迎消息 -->
                <div v-if="chatMessages.length === 0 && !chatLoading" class="empty-chat">
                  <div class="welcome-icon">🤖</div>
                  <h3>你好！我是AI助手</h3>
                  <p>我可以回答关于人工智能的各种问题</p>
                  <p class="tip">试试下面的快捷问题，或者直接输入你的问题吧！</p>
                </div>
                
                <!-- 对话消息 -->
                <div v-for="(msg, idx) in chatMessages" :key="idx" :class="['message', msg.role]">
                  <div class="avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
                  <div class="bubble">{{ msg.content }}</div>
                </div>
                
                <!-- 加载状态 -->
                <div v-if="chatLoading" class="message assistant">
                  <div class="avatar">🤖</div>
                  <div class="bubble typing">AI正在思考...</div>
                </div>
              </div>
              <div class="chat-input">
                <el-input v-model="chatInput" placeholder="输入你的问题..." @keyup.enter="sendChat" :disabled="chatLoading">
                  <template #append>
                    <el-button type="primary" @click="sendChat" :loading="chatLoading">发送</el-button>
                  </template>
                </el-input>
              </div>
              <div class="quick-questions">
                <el-tag v-for="q in quickQuestions" :key="q" @click="chatInput = q; sendChat()" class="quick-tag">{{ q }}</el-tag>
              </div>
            </div>
          </el-card>

          <!-- AI写作 -->
          <el-card class="experience-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="icon">✍️</span>
                <span class="title">AI写作</span>
              </div>
            </template>
            <div class="writing-section">
              <el-tabs v-model="writingMode">
                <el-tab-pane label="写诗" name="poem">
                  <el-input v-model="poemTheme" placeholder="输入诗歌主题，如：友情、春天" />
                  <el-radio-group v-model="poemStyle" size="small" class="style-group">
                    <el-radio-button label="现代诗" />
                    <el-radio-button label="古诗" />
                    <el-radio-button label="打油诗" />
                  </el-radio-group>
                  <el-button type="primary" @click="writePoem" :loading="writingLoading">✨ 创作诗歌</el-button>
                </el-tab-pane>
                <el-tab-pane label="写故事" name="story">
                  <el-input v-model="storyBeginning" type="textarea" :rows="2" placeholder="输入故事开头..." />
                  <el-radio-group v-model="storyGenre" size="small" class="style-group">
                    <el-radio-button label="奇幻" />
                    <el-radio-button label="科幻" />
                    <el-radio-button label="悬疑" />
                    <el-radio-button label="温馨" />
                  </el-radio-group>
                  <el-button type="primary" @click="writeStory" :loading="writingLoading">✨ 续写故事</el-button>
                </el-tab-pane>
              </el-tabs>
              <div v-if="writingResult" class="writing-result">
                <div class="result-text">{{ writingResult }}</div>
                <el-button size="small" @click="copyText(writingResult)">📋 复制</el-button>
              </div>
            </div>
          </el-card>

          <!-- OCR文字识别 -->
          <el-card class="experience-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="icon">📷</span>
                <span class="title">文字识别(OCR)</span>
              </div>
            </template>
            <div class="ocr-section">
              <el-upload
                class="upload-area"
                drag
                :auto-upload="false"
                :on-change="handleOCRUpload"
                accept="image/*"
              >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">拖拽图片到此处，或<em>点击上传</em></div>
              </el-upload>
              <el-button v-if="ocrImage" type="primary" @click="recognizeText" :loading="ocrLoading">
                🔍 识别文字
              </el-button>
              <div v-if="ocrResult" class="ocr-result">
                <div class="result-title">识别结果：</div>
                <div class="result-text">{{ ocrResult }}</div>
                <el-button size="small" @click="copyText(ocrResult)">📋 复制</el-button>
              </div>
            </div>
          </el-card>

          <!-- 情感分析 -->
          <el-card class="experience-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="icon">😊</span>
                <span class="title">情感分析</span>
              </div>
            </template>
            <div class="sentiment-section">
              <el-input v-model="sentimentText" type="textarea" :rows="3" placeholder="输入一句话，AI来分析情感..." />
              <el-button type="primary" @click="analyzeSentiment" :loading="sentimentLoading">
                🔍 分析情感
              </el-button>
              <div v-if="sentimentResult" class="sentiment-result">
                <div class="emotion-icon">{{ getEmotionIcon(sentimentResult.emotion) }}</div>
                <div class="emotion-name">{{ sentimentResult.emotion }}</div>
                <el-progress :percentage="sentimentResult.confidence" :stroke-width="20" />
                <div class="explanation">{{ sentimentResult.explanation }}</div>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- AI知识馆 -->
      <el-tab-pane label="📚 AI知识馆" name="knowledge">
        <div class="knowledge-section">
          <!-- AI历史时间线 -->
          <el-card class="knowledge-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="icon">🏛️</span>
                <span class="title">AI发展历史</span>
              </div>
            </template>
            <el-timeline>
              <el-timeline-item v-for="item in aiHistory" :key="item.year" :timestamp="item.year + '年'" placement="top">
                <el-card>
                  <h4>{{ item.icon }} {{ item.title }}</h4>
                  <p>{{ item.description }}</p>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-card>

          <!-- AI原理讲解 -->
          <el-card class="knowledge-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="icon">🔬</span>
                <span class="title">AI原理速成</span>
              </div>
            </template>
            <el-collapse v-model="activePrinciple">
              <el-collapse-item v-for="p in aiPrinciples" :key="p.id" :title="p.icon + ' ' + p.title" :name="p.id">
                <div class="principle-content">
                  <div class="analogy">
                    <strong>💡 简单比喻：</strong>{{ p.analogy }}
                  </div>
                  <div v-if="p.steps" class="steps">
                    <div v-for="step in p.steps" :key="step.step" class="step-item">
                      <span class="step-num">{{ step.step }}</span>
                      <span class="step-text">{{ step.desc }}</span>
                    </div>
                  </div>
                  <div v-if="p.funFact" class="fun-fact">
                    🎉 {{ p.funFact }}
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-card>

          <!-- AI名人堂 -->
          <el-card class="knowledge-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="icon">👨‍🔬</span>
                <span class="title">AI名人堂</span>
              </div>
            </template>
            <div class="pioneers-grid">
              <div v-for="pioneer in aiPioneers" :key="pioneer.name" class="pioneer-card">
                <div class="pioneer-avatar">{{ pioneer.avatar }}</div>
                <div class="pioneer-name">{{ pioneer.name }}</div>
                <div class="pioneer-title">{{ pioneer.title }}</div>
                <div class="pioneer-quote">"{{ pioneer.quote }}"</div>
              </div>
            </div>
          </el-card>

          <!-- AI应用案例 -->
          <el-card class="knowledge-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="icon">🎯</span>
                <span class="title">AI应用案例</span>
              </div>
            </template>
            <el-tabs v-model="activeAppCategory">
              <el-tab-pane v-for="cat in aiApplications" :key="cat.category" :label="cat.icon + ' ' + cat.category" :name="cat.category">
                <div class="app-list">
                  <div v-for="app in cat.items" :key="app.name" class="app-item">
                    <div class="app-name">{{ app.name }}</div>
                    <div class="app-desc">{{ app.desc }}</div>
                    <div class="app-example">💡 {{ app.example }}</div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 图灵测试游戏 -->
      <el-tab-pane label="🎮 AI游乐场" name="games">
        <div class="games-section">
          <el-card class="game-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="icon">🤔</span>
                <span class="title">图灵测试挑战</span>
              </div>
            </template>
            <div class="turing-game">
              <div v-if="turingState === 'intro'" class="intro">
                <p>1950年，艾伦·图灵提出：如果你和一台机器聊天，分不清对方是人还是机器，那这台机器就算有智能了。</p>
                <p><strong>游戏规则：</strong>你将看到5段对话，判断是人类还是AI写的。猜对3个以上算通关！</p>
                <el-button type="primary" @click="startTuringTest">开始挑战</el-button>
              </div>
              <div v-else-if="turingState === 'playing'" class="playing">
                <div class="round-info">第 {{ turingRound + 1 }} / 5 轮</div>
                <div class="response-box">
                  <div class="topic">话题：{{ turingQuestion?.topic }}</div>
                  <div class="response">"{{ turingQuestion?.response }}"</div>
                </div>
                <div class="choices">
                  <el-button size="large" @click="turingChoice('human')">👤 人类</el-button>
                  <el-button size="large" @click="turingChoice('ai')">🤖 AI</el-button>
                </div>
              </div>
              <div v-else-if="turingState === 'result'" class="result">
                <div class="result-icon">{{ turingLastResult ? '✅' : '❌' }}</div>
                <div class="result-text">{{ turingLastResult ? '猜对了！' : '猜错了！' }}</div>
                <div class="answer">正确答案：{{ turingQuestion?.isAI ? 'AI' : '人类' }}</div>
                <el-button type="primary" @click="nextTuringRound">{{ turingRound < 4 ? '下一轮' : '查看结果' }}</el-button>
              </div>
              <div v-else-if="turingState === 'final'" class="final">
                <div class="final-icon">{{ turingCorrect >= 3 ? '🎉' : '💪' }}</div>
                <div class="final-title">{{ turingCorrect >= 3 ? '恭喜通关！' : '继续努力！' }}</div>
                <div class="final-score">你猜对了 {{ turingCorrect }} / 5 轮</div>
                <el-button type="primary" @click="turingState = 'intro'">再玩一次</el-button>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, UploadFilled } from '@element-plus/icons-vue'
import axios from 'axios'

const API_BASE = 'http://localhost:3000/api/ai-science'

// Tab状态
const activeTab = ref('experience')

// AI对话
const chatMessages = ref([])
const chatInput = ref('')
const chatLoading = ref(false)
const chatMessagesRef = ref(null)
const quickQuestions = ['什么是人工智能？', 'AI是怎么学习的？', 'ChatGPT是什么？']

async function sendChat() {
  if (!chatInput.value.trim() || chatLoading.value) return
  const message = chatInput.value.trim()
  chatMessages.value.push({ role: 'user', content: message })
  chatInput.value = ''
  chatLoading.value = true
  
  try {
    const res = await axios.post(`${API_BASE}/chat`, { message })
    if (res.data.success) {
      chatMessages.value.push({ role: 'assistant', content: res.data.data.reply })
    } else {
      chatMessages.value.push({ role: 'assistant', content: '抱歉，我暂时无法回答。' })
    }
  } catch (e) {
    chatMessages.value.push({ role: 'assistant', content: '网络错误，请稍后重试。' })
  } finally {
    chatLoading.value = false
    await nextTick()
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  }
}

// AI写作
const writingMode = ref('poem')
const poemTheme = ref('')
const poemStyle = ref('现代诗')
const storyBeginning = ref('')
const storyGenre = ref('奇幻')
const writingLoading = ref(false)
const writingResult = ref('')

async function writePoem() {
  if (!poemTheme.value.trim() || writingLoading.value) return
  writingLoading.value = true
  writingResult.value = ''
  try {
    const res = await axios.post(`${API_BASE}/write-poem`, { theme: poemTheme.value, style: poemStyle.value })
    if (res.data.success) writingResult.value = res.data.data.reply
    else ElMessage.error(res.data.message || '创作失败')
  } catch (e) { ElMessage.error('网络错误') }
  finally { writingLoading.value = false }
}

async function writeStory() {
  if (!storyBeginning.value.trim() || writingLoading.value) return
  writingLoading.value = true
  writingResult.value = ''
  try {
    const res = await axios.post(`${API_BASE}/write-story`, { beginning: storyBeginning.value, genre: storyGenre.value })
    if (res.data.success) writingResult.value = res.data.data.reply
    else ElMessage.error(res.data.message || '创作失败')
  } catch (e) { ElMessage.error('网络错误') }
  finally { writingLoading.value = false }
}

// OCR
const ocrImage = ref(null)
const ocrLoading = ref(false)
const ocrResult = ref('')

function handleOCRUpload(file) {
  ocrImage.value = file.raw
  ocrResult.value = ''
}

async function recognizeText() {
  if (!ocrImage.value || ocrLoading.value) return
  ocrLoading.value = true
  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1]
      const res = await axios.post(`${API_BASE}/ocr`, { imageBase64: base64 })
      if (res.data.success) ocrResult.value = res.data.data.text
      else ElMessage.error(res.data.message || '识别失败')
      ocrLoading.value = false
    }
    reader.readAsDataURL(ocrImage.value)
  } catch (e) { ElMessage.error('网络错误'); ocrLoading.value = false }
}

// 情感分析
const sentimentText = ref('')
const sentimentLoading = ref(false)
const sentimentResult = ref(null)

function getEmotionIcon(emotion) {
  const map = { '开心': '😄', '难过': '😢', '生气': '😠', '平静': '😌', '惊讶': '😲', '害怕': '😨' }
  return map[emotion] || '🤔'
}

async function analyzeSentiment() {
  if (!sentimentText.value.trim() || sentimentLoading.value) return
  sentimentLoading.value = true
  sentimentResult.value = null
  try {
    const res = await axios.post(`${API_BASE}/analyze-sentiment`, { text: sentimentText.value })
    if (res.data.success) sentimentResult.value = res.data.data
    else ElMessage.error(res.data.message || '分析失败')
  } catch (e) { ElMessage.error('网络错误') }
  finally { sentimentLoading.value = false }
}

// 复制功能
function copyText(text) {
  navigator.clipboard.writeText(text)
  ElMessage.success('复制成功')
}

// AI知识馆数据
const aiHistory = ref([])
const aiPrinciples = ref([])
const aiPioneers = ref([])
const aiApplications = ref([])
const activePrinciple = ref('')
const activeAppCategory = ref('生活')

async function loadKnowledgeData() {
  try {
    const [historyRes, principlesRes, pioneersRes, appsRes] = await Promise.all([
      axios.get(`${API_BASE}/history`),
      axios.get(`${API_BASE}/principles`),
      axios.get(`${API_BASE}/pioneers`),
      axios.get(`${API_BASE}/applications`)
    ])
    if (historyRes.data.success) aiHistory.value = historyRes.data.data
    if (principlesRes.data.success) aiPrinciples.value = principlesRes.data.data
    if (pioneersRes.data.success) aiPioneers.value = pioneersRes.data.data
    if (appsRes.data.success) aiApplications.value = appsRes.data.data
  } catch (e) { console.error('加载知识数据失败:', e) }
}

// 图灵测试
const turingState = ref('intro')
const turingRound = ref(0)
const turingQuestion = ref(null)
const turingQuestions = ref([])
const turingLastResult = ref(false)
const turingCorrect = ref(0)

async function startTuringTest() {
  turingRound.value = 0
  turingCorrect.value = 0
  turingQuestions.value = await generateTuringQuestions()
  turingQuestion.value = turingQuestions.value[0]
  turingState.value = 'playing'
}

async function generateTuringQuestions() {
  const topics = ['今天天气真好', '推荐一部电影', '你觉得学习重要吗', '描述一下你的周末', '你喜欢什么音乐']
  const questions = []
  for (const topic of topics) {
    const isAI = Math.random() > 0.5
    let response
    if (isAI) {
      try {
        const res = await axios.post(`${API_BASE}/turing-test`, { topic })
        response = res.data.success ? res.data.data.reply : getDefaultAIResponse(topic)
      } catch (e) { response = getDefaultAIResponse(topic) }
    } else {
      response = getHumanResponse(topic)
    }
    questions.push({ topic, response, isAI })
  }
  return questions
}

function getDefaultAIResponse(topic) {
  const map = {
    '今天天气真好': '确实，今天阳光明媚，非常适合户外活动。',
    '推荐一部电影': '我推荐《肖申克的救赎》，非常经典的励志电影。',
    '你觉得学习重要吗': '学习非常重要，它能帮助我们获取知识和技能。',
    '描述一下你的周末': '周末是休息和充电的好时机，建议进行一些放松活动。',
    '你喜欢什么音乐': '音乐是美妙的艺术形式，不同类型都有独特魅力。'
  }
  return map[topic] || '这是一个有趣的话题。'
}

function getHumanResponse(topic) {
  const map = {
    '今天天气真好': '是啊！终于不下雨了，打算出去逛逛',
    '推荐一部电影': '最近看了星际穿越，剧情超级烧脑！',
    '你觉得学习重要吗': '重要是重要，但有时候真的好累哈哈',
    '描述一下你的周末': '就是睡觉打游戏啊，偶尔出去吃个饭',
    '你喜欢什么音乐': '啥都听，看心情吧'
  }
  return map[topic] || 'emm这个问题有点难回答'
}

function turingChoice(choice) {
  turingLastResult.value = (choice === 'ai') === turingQuestion.value.isAI
  if (turingLastResult.value) turingCorrect.value++
  turingState.value = 'result'
}

function nextTuringRound() {
  turingRound.value++
  if (turingRound.value >= 5) {
    turingState.value = 'final'
  } else {
    turingQuestion.value = turingQuestions.value[turingRound.value]
    turingState.value = 'playing'
  }
}

onMounted(() => {
  loadKnowledgeData()
})
</script>

<style scoped>
.ai-science-page {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.page-header .subtitle {
  color: #666;
  margin-top: 10px;
}

.ai-tabs :deep(.el-tabs__header) {
  background: #fff;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 20px;
}

.experience-grid, .knowledge-section, .games-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.experience-card, .knowledge-card, .game-card {
  border-radius: 15px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-header .icon {
  font-size: 24px;
}

.card-header .title {
  font-size: 18px;
  font-weight: bold;
}

/* 聊天样式 */
.chat-messages {
  height: 300px;
  overflow-y: auto;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 10px;
  margin-bottom: 15px;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 20px;
}

.empty-chat .welcome-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: wave 2s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

.empty-chat h3 {
  font-size: 20px;
  color: #333;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.empty-chat p {
  font-size: 14px;
  color: #666;
  margin: 4px 0;
}

.empty-chat .tip {
  color: #999;
  font-size: 13px;
  margin-top: 12px;
}

.message {
  display: flex;
  margin-bottom: 15px;
}

.message.user {
  flex-direction: row-reverse;
}

.message .avatar {
  width: 40px;
  height: 40px;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message .bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  margin: 0 10px;
}

.message.user .bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.message.assistant .bubble {
  background: #fff;
  border: 1px solid #e0e0e0;
}

.bubble.typing {
  color: #999;
}

.quick-questions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.quick-tag {
  cursor: pointer;
}

.quick-tag:hover {
  background: #667eea;
  color: #fff;
}

/* 绘画样式 */
.painting-section .style-select {
  margin: 15px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.generate-btn {
  width: 100%;
  margin-top: 15px;
}

.result-image {
  margin-top: 20px;
  text-align: center;
}

.loading-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  color: #667eea;
}

/* 写作样式 */
.style-group {
  margin: 15px 0;
}

.writing-result {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  border-radius: 10px;
}

.writing-result .result-text {
  white-space: pre-wrap;
  line-height: 1.8;
  margin-bottom: 15px;
}

/* OCR样式 */
.upload-area {
  margin-bottom: 15px;
}

.ocr-result {
  margin-top: 20px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 10px;
}

.ocr-result .result-title {
  font-weight: bold;
  margin-bottom: 10px;
}

.ocr-result .result-text {
  white-space: pre-wrap;
  margin-bottom: 15px;
}

/* 情感分析样式 */
.sentiment-section .el-button {
  margin-top: 15px;
}

.sentiment-result {
  text-align: center;
  margin-top: 20px;
  padding: 30px;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
  border-radius: 15px;
}

.sentiment-result .emotion-icon {
  font-size: 60px;
}

.sentiment-result .emotion-name {
  font-size: 24px;
  font-weight: bold;
  margin: 15px 0;
}

.sentiment-result .explanation {
  margin-top: 15px;
  color: #666;
}

/* 知识馆样式 */
.principle-content {
  padding: 10px 0;
}

.principle-content .analogy {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 15px;
}

.principle-content .steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.step-num {
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.fun-fact {
  background: #fff9c4;
  padding: 15px;
  border-radius: 10px;
  margin-top: 15px;
  color: #f57f17;
}

.pioneers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}

.pioneer-card {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  border-radius: 15px;
}

.pioneer-avatar {
  font-size: 50px;
  margin-bottom: 10px;
}

.pioneer-name {
  font-size: 18px;
  font-weight: bold;
}

.pioneer-title {
  font-size: 14px;
  color: #667eea;
  margin: 5px 0;
}

.pioneer-quote {
  font-size: 12px;
  color: #666;
  font-style: italic;
  margin-top: 10px;
}

.app-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.app-item {
  padding: 20px;
  background: #f9f9f9;
  border-radius: 10px;
}

.app-name {
  font-size: 16px;
  font-weight: bold;
}

.app-desc {
  color: #666;
  margin: 5px 0;
}

.app-example {
  color: #667eea;
  font-size: 14px;
}

/* 图灵测试样式 */
.turing-game {
  text-align: center;
  padding: 30px;
}

.turing-game .intro p {
  margin: 15px 0;
  line-height: 1.8;
}

.turing-game .round-info {
  font-size: 18px;
  color: #667eea;
  margin-bottom: 20px;
}

.response-box {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding: 30px;
  border-radius: 15px;
  margin-bottom: 30px;
}

.response-box .topic {
  color: #667eea;
  margin-bottom: 15px;
}

.response-box .response {
  font-size: 18px;
  line-height: 1.8;
}

.choices {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.result .result-icon, .final .final-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.result .result-text, .final .final-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 15px;
}

.final .final-score {
  font-size: 18px;
  color: #667eea;
  margin-bottom: 20px;
}
</style>
