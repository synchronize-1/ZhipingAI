<template>
  <!-- 消息列表 -->
  <div class="chat-messages" ref="messagesContainer">
    <!-- 欢迎消息 -->
    <div v-if="messages.length === 0" class="welcome-section">
      <div class="welcome-avatar">
        <img src="https://img.icons8.com/3d-fluency/94/robot-2.png" alt="AI" />
      </div>
      <h3>你好，{{ userName }}！</h3>
      <p>我是智评AI助手，有什么想问的问题吗🌹</p>
      <div class="welcome-suggestions">
        <div
          v-for="suggestion in welcomeSuggestions"
          :key="suggestion"
          class="suggestion-chip"
          @click="$emit('select', suggestion)"
        >
          {{ suggestion }}
        </div>
      </div>
    </div>

    <!-- 消息列表 -->
    <template v-for="(msg, index) in messages" :key="index">
      <div class="message-item" :class="msg.role">
        <div class="message-avatar">
          <img
            v-if="msg.role === 'assistant'"
            src="https://img.icons8.com/3d-fluency/94/robot-2.png"
            alt="AI"
          />
          <el-avatar v-else :size="36" :src="userAvatar">
            {{ userName?.charAt(0) }}
          </el-avatar>
        </div>
        <div class="message-content">
          <div class="message-bubble" v-html="formatMessage(msg.content)"></div>
          <div class="message-time">{{ msg.time }}</div>
        </div>
      </div>
      <!-- 联想追问建议 - 仅在AI回复后显示 -->
      <div v-if="msg.role === 'assistant' && msg.followUpSuggestions?.length" class="follow-up-section">
        <div class="follow-up-label">
          <el-icon><QuestionFilled /></el-icon>
          <span>你可能还想问：</span>
        </div>
        <div class="follow-up-suggestions">
          <div
            v-for="suggestion in msg.followUpSuggestions"
            :key="suggestion"
            class="follow-up-chip"
            @click="$emit('select', suggestion)"
          >
            {{ suggestion }}
          </div>
        </div>
      </div>
    </template>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="message-item assistant">
      <div class="message-avatar">
        <img src="https://img.icons8.com/3d-fluency/94/robot-2.png" alt="AI" />
      </div>
      <div class="message-content">
        <div class="message-bubble typing">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'

const props = defineProps({
  messages: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  userName: { type: String, default: '' },
  userAvatar: { type: String, default: '' },
  welcomeSuggestions: { type: Array, default: () => [] }
})

defineEmits(['select'])

const messagesContainer = ref(null)

const formatMessage = (text) => {
  // 移除LaTeX数学公式标记，转换为普通文本
  let formatted = text
    .replace(/\\\[/g, '')  // 移除 \[
    .replace(/\\\]/g, '')  // 移除 \]
    .replace(/\\\(/g, '')  // 移除 \(
    .replace(/\\\)/g, '')  // 移除 \)
    .replace(/\n/g, '<br>') // 换行转换
  return formatted
}

// 消息或加载状态变化时自动滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

watch(
  [() => props.messages.length, () => props.isLoading],
  () => { scrollToBottom() }
)
</script>

<style scoped>
/* 消息区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

/* 欢迎区域 */
.welcome-section {
  text-align: center;
  padding: 40px 20px;
}

.welcome-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-avatar img {
  width: 56px;
  height: 56px;
}

.welcome-section h3 {
  color: white;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.welcome-section p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 20px 0;
}

.welcome-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.suggestion-chip {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-chip:hover {
  background: rgba(102, 126, 234, 0.3);
  border-color: rgba(102, 126, 234, 0.5);
  color: white;
}

/* 消息项 */
.message-item {
  display: flex;
  gap: 12px;
  max-width: 85%;
}

.message-item.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
}

.message-item.assistant .message-bubble {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border-bottom-left-radius: 4px;
}

.message-item.user .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.message-item.user .message-time {
  text-align: right;
}

/* 打字动画 */
.message-bubble.typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 16px 20px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: typingBounce 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingBounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-8px);
  }
}

/* 联想追问样式 */
.follow-up-section {
  margin-left: 48px;
  margin-top: -8px;
  margin-bottom: 12px;
}

.follow-up-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin-bottom: 8px;
}

.follow-up-label .el-icon {
  color: #667eea;
}

.follow-up-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.follow-up-chip {
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  border: 1px solid rgba(102, 126, 234, 0.25);
  border-radius: 14px;
  color: #a5b4fc;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.follow-up-chip:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
  border-color: rgba(102, 126, 234, 0.5);
  color: white;
  transform: translateY(-1px);
}

/* 响应式 */
@media (max-width: 480px) {
  .follow-up-section {
    margin-left: 0;
  }
}
</style>