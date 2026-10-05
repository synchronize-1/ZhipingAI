<template>
  <div class="ai-assistant-float">
    <!-- 悬浮AI助手按钮 -->
    <el-tooltip content="AI智能助手" placement="left">
      <el-button 
        type="primary" 
        circle 
        size="large"
        @click="toggleChat"
        class="ai-float-btn"
        :class="{ 'has-notification': hasNewMessage }"
      >
        <el-icon :class="{ 'rotate': isThinking }">
          <ChatDotRound />
        </el-icon>
      </el-button>
    </el-tooltip>

    <!-- AI对话抽屉 -->
    <el-drawer
      v-model="showChat"
      title="AI智能助手"
      size="450px"
      direction="rtl"
      :close-on-click-modal="false"
    >
      <template #header>
        <div class="ai-chat-header">
          <div class="header-left">
            <el-avatar :size="40" class="ai-avatar">
              <el-icon><MagicStick /></el-icon>
            </el-avatar>
            <div class="header-info">
              <h3>AI智能助手</h3>
              <p class="status-text">
                <span class="status-dot"></span>
                在线服务中
              </p>
            </div>
          </div>
          <el-button 
            size="small" 
            text 
            @click="clearHistory"
            v-if="messages.length > 0"
          >
            <el-icon><Delete /></el-icon>
            清空
          </el-button>
        </div>
      </template>

      <!-- 对话内容区域 -->
      <div class="chat-container" ref="chatContainer">
        <!-- 欢迎消息 -->
        <div class="welcome-message" v-if="messages.length === 0">
          <el-icon class="welcome-icon"><MagicStick /></el-icon>
          <h3>你好！我是AI智能助手</h3>
          <p>我可以帮你：</p>
          <div class="quick-actions">
            <el-tag 
              v-for="action in quickActions" 
              :key="action.text"
              @click="sendQuickMessage(action.text)"
              class="action-tag"
            >
              {{ action.text }}
            </el-tag>
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="messages-list">
          <div 
            v-for="(message, index) in messages" 
            :key="index"
            class="message-item"
            :class="message.role"
          >
            <div class="message-avatar">
              <el-avatar :size="32" v-if="message.role === 'user'">
                {{ userStore.user?.name?.charAt(0) || 'U' }}
              </el-avatar>
              <el-avatar :size="32" v-else class="ai-avatar-small">
                <el-icon><MagicStick /></el-icon>
              </el-avatar>
            </div>
            <div class="message-content">
              <div class="message-bubble">
                <div class="message-text" v-html="formatMessage(message.content)"></div>
                <span class="message-time">{{ message.time }}</span>
              </div>
            </div>
          </div>

          <!-- AI思考中 -->
          <div class="message-item assistant" v-if="isThinking">
            <div class="message-avatar">
              <el-avatar :size="32" class="ai-avatar-small">
                <el-icon><MagicStick /></el-icon>
              </el-avatar>
            </div>
            <div class="message-content">
              <div class="message-bubble thinking">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <template #footer>
        <div class="chat-input-area">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="输入你的问题，按 Enter 发送，Shift+Enter 换行"
            @keydown.enter.exact.prevent="sendMessage"
            :disabled="isThinking"
            resize="none"
          />
          <div class="input-actions">
            <div class="action-buttons">
              <el-tooltip content="快捷问题">
                <el-button 
                  size="small" 
                  text
                  @click="showQuickQuestions = !showQuickQuestions"
                >
                  <el-icon><QuestionFilled /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
            <el-button 
              type="primary" 
              @click="sendMessage"
              :loading="isThinking"
              :disabled="!inputMessage.trim()"
            >
              发送
              <el-icon class="el-icon--right"><Promotion /></el-icon>
            </el-button>
          </div>

          <!-- 快捷问题 -->
          <div class="quick-questions" v-if="showQuickQuestions">
            <el-tag 
              v-for="q in quickQuestions" 
              :key="q"
              @click="sendQuickMessage(q)"
              class="question-tag"
              size="small"
            >
              {{ q }}
            </el-tag>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const userStore = useUserStore()

const showChat = ref(false)
const inputMessage = ref('')
const messages = ref([])
const isThinking = ref(false)
const hasNewMessage = ref(false)
const showQuickQuestions = ref(false)
const chatContainer = ref(null)

const quickActions = [
  { text: '查询今日课程' },
  { text: '查看作业' },
  { text: '学习建议' },
  { text: '校园服务' }
]

const quickQuestions = [
  '今天有哪些课程？',
  '我的出勤率怎么样？',
  '食堂今天吃什么？',
  '图书馆在哪里？',
  '如何提高学习效率？',
  '有什么校园活动？'
]

const toggleChat = () => {
  showChat.value = !showChat.value
  if (showChat.value) {
    hasNewMessage.value = false
    nextTick(() => {
      scrollToBottom()
    })
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isThinking.value) return

  const userMessage = {
    role: 'user',
    content: inputMessage.value,
    time: getCurrentTime()
  }

  messages.value.push(userMessage)
  const question = inputMessage.value
  inputMessage.value = ''
  isThinking.value = true

  nextTick(() => {
    scrollToBottom()
  })

  try {
    const response = await axios.post('/api/ai-science/chat', {
      message: question,
      history: messages.value.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }))
    })

    if (response.data.success) {
      const aiMessage = {
        role: 'assistant',
        content: response.data.data.reply,
        time: getCurrentTime()
      }
      messages.value.push(aiMessage)

      if (!showChat.value) {
        hasNewMessage.value = true
      }
    } else {
      throw new Error(response.data.message || 'AI响应失败')
    }
  } catch (error) {
    console.error('AI对话错误:', error)
    const errorMessage = {
      role: 'assistant',
      content: '抱歉，我遇到了一些问题，请稍后再试。',
      time: getCurrentTime()
    }
    messages.value.push(errorMessage)
    ElMessage.error('AI服务暂时不可用')
  } finally {
    isThinking.value = false
    nextTick(() => {
      scrollToBottom()
    })
  }
}

const sendQuickMessage = (text) => {
  inputMessage.value = text
  showQuickQuestions.value = false
  sendMessage()
}

const clearHistory = () => {
  messages.value = []
  ElMessage.success('对话历史已清空')
}

const formatMessage = (content) => {
  return content
    .replace(/\n/g, '<br>')
    .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

const getCurrentTime = () => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}
</script>

<style scoped>
.ai-assistant-float {
  position: fixed;
  right: 30px;
  bottom: 30px;
  z-index: 1000;
}

.ai-float-btn {
  width: 60px;
  height: 60px;
  font-size: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.ai-float-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
}

.ai-float-btn.has-notification::after {
  content: '';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 12px;
  height: 12px;
  background: #f56c6c;
  border-radius: 50%;
  border: 2px solid white;
  animation: pulse 2s infinite;
}

.rotate {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

.ai-chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header-info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.status-text {
  margin: 0;
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #67c23a;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.chat-container {
  height: calc(100vh - 280px);
  overflow-y: auto;
  padding: 20px;
}

.welcome-message {
  text-align: center;
  padding: 40px 20px;
}

.welcome-icon {
  font-size: 60px;
  color: #667eea;
  margin-bottom: 20px;
}

.welcome-message h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #303133;
}

.welcome-message p {
  margin: 0 0 20px 0;
  color: #909399;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.action-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.action-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  gap: 10px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.ai-avatar-small {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-bubble {
  display: inline-block;
  max-width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  word-wrap: break-word;
}

.message-item.user .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-item.assistant .message-bubble {
  background: #f4f4f5;
  color: #303133;
  border-bottom-left-radius: 4px;
}

.message-text {
  line-height: 1.6;
  margin-bottom: 6px;
}

.message-text :deep(code) {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.message-text :deep(pre) {
  background: rgba(0, 0, 0, 0.05);
  padding: 10px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
}

.message-bubble.thinking {
  padding: 16px 20px;
}

.typing-indicator {
  display: flex;
  gap: 6px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #909399;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
}

.chat-input-area {
  padding: 16px;
  border-top: 1px solid #ebeef5;
}

.chat-input-area :deep(.el-textarea__inner) {
  border-radius: 8px;
  font-size: 14px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.quick-questions {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.question-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.question-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
