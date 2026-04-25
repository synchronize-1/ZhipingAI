<template>
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
        <div class="chat-messages" ref="chatMessagesRef">
          <div v-if="chatMessages.length === 0 && !chatLoading" class="empty-chat">
            <div class="welcome-icon">🤖</div>
            <h3>你好！我是AI助手</h3>
            <p>我可以回答关于人工智能的各种问题</p>
            <p class="tip">试试下面的快捷问题，或者直接输入你的问题吧！</p>
          </div>
          <div v-for="(msg, idx) in chatMessages" :key="idx" :class="['message', msg.role]">
            <div class="avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
            <div class="bubble" v-html="formatChatMessage(msg.content)"></div>
          </div>
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
          <span class="title">文艺的你</span>
        </div>
      </template>
      <div class="writing-section">
        <el-tabs v-model="writingMode" class="writing-tabs">
          <el-tab-pane label="写诗" name="poem">
            <el-input v-model="poemTheme" placeholder="输入诗歌主题，如：友情、春天" class="writing-input" />
            <el-radio-group v-model="poemStyle" size="small" class="style-group">
              <el-radio-button label="现代诗" />
              <el-radio-button label="古诗" />
              <el-radio-button label="打油诗" />
            </el-radio-group>
            <el-button type="primary" @click="writePoem" :loading="writingLoading" class="write-btn">✨ 创作诗歌</el-button>
          </el-tab-pane>
          <el-tab-pane label="写故事" name="story">
            <el-input v-model="storyBeginning" type="textarea" :rows="2" placeholder="输入故事开头..." class="writing-input" />
            <el-radio-group v-model="storyGenre" size="small" class="style-group">
              <el-radio-button label="奇幻" />
              <el-radio-button label="科幻" />
              <el-radio-button label="悬疑" />
              <el-radio-button label="温馨" />
            </el-radio-group>
            <el-button type="primary" @click="writeStory" :loading="writingLoading" class="write-btn">✨ 续写故事</el-button>
          </el-tab-pane>
        </el-tabs>
        <div v-if="writingResult" class="writing-result">
          <div class="result-text" v-html="formatChatMessage(writingResult)"></div>
          <el-button size="small" @click="copyWithMessage(writingResult, ElMessage)">📋 复制</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { formatChatMessage, copyWithMessage } from '@/composables/useMarkdownRenderer'

const API_BASE = 'http://localhost:3000/api/ai-science'

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
</script>

<style scoped>
.experience-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 20px;
}

.experience-card {
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

/* 写作样式 */
.writing-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.writing-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.writing-input {
  margin-bottom: 16px;
}

.style-group {
  margin: 12px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.write-btn {
  width: 100%;
  margin-top: 8px;
}

.writing-result {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  border-radius: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.writing-result .result-text {
  white-space: normal;
  line-height: 1.8;
  margin-bottom: 15px;
  word-break: break-word;
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
  flex-shrink: 0;
}

.message .bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  margin: 0 10px;
  word-break: break-word;
}

.message.user .bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.message.assistant .bubble {
  background: #fff;
  border: 1px solid #e0e0e0;
}

/* Markdown 渲染样式 */
.message.assistant .bubble :deep(.md-h2) {
  font-size: 18px;
  font-weight: 600;
  margin: 12px 0 8px 0;
  color: #303133;
  border-left: 3px solid #667eea;
  padding-left: 10px;
}

.message.assistant .bubble :deep(.md-h3) {
  font-size: 16px;
  font-weight: 600;
  margin: 10px 0 6px 0;
  color: #409eff;
}

.message.assistant .bubble :deep(.md-h4) {
  font-size: 14px;
  font-weight: 600;
  margin: 8px 0 4px 0;
  color: #606266;
}

.message.assistant .bubble :deep(.md-p) {
  margin: 8px 0;
  line-height: 1.7;
}

.message.assistant .bubble :deep(.md-ul),
.message.assistant .bubble :deep(.md-ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.message.assistant .bubble :deep(.md-li),
.message.assistant .bubble :deep(.md-li-ordered) {
  margin: 4px 0;
  line-height: 1.6;
}

.message.assistant .bubble :deep(.inline-code) {
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
  color: #e6a23c;
}

.message.assistant .bubble :deep(.code-block) {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 10px 0;
}

.message.assistant .bubble :deep(.code-block code) {
  font-family: monospace;
  font-size: 13px;
}

.message.assistant .bubble :deep(.md-quote) {
  border-left: 3px solid #909399;
  background: #f5f5f5;
  padding: 8px 12px;
  margin: 8px 0;
  color: #606266;
  font-style: italic;
}

.message.assistant .bubble :deep(.md-hr) {
  margin: 12px 0;
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, #dcdfe6, transparent);
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
</style>