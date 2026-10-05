<template>
  <div class="ai-assistant-wrapper">
    <!-- 悬浮按钮 -->
    <AIFloatButton :is-open="isOpen" @toggle="toggleChat" />

    <!-- 聊天窗口 -->
    <transition name="chat-slide">
      <div v-if="isOpen" class="ai-chat-panel">
        <AIChatHeader @clear="clearHistory" @minimize="toggleChat" />

        <AIQuickActions :actions="quickActions" @select="sendQuickMessage" />

        <AIChatMessages
          :messages="messages"
          :is-loading="isLoading"
          :user-name="userName"
          :user-avatar="userAvatar"
          :welcome-suggestions="welcomeSuggestions"
          @select="sendQuickMessage"
        />

        <AIChatInput v-model="inputMessage" :loading="isLoading" @send="sendMessage" />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { useAIAssistant } from './ai-assistant/useAIAssistant'
import AIFloatButton from './ai-assistant/AIFloatButton.vue'
import AIChatHeader from './ai-assistant/AIChatHeader.vue'
import AIQuickActions from './ai-assistant/AIQuickActions.vue'
import AIChatMessages from './ai-assistant/AIChatMessages.vue'
import AIChatInput from './ai-assistant/AIChatInput.vue'

const {
  isOpen,
  inputMessage,
  messages,
  isLoading,
  userName,
  userAvatar,
  quickActions,
  welcomeSuggestions,
  toggleChat,
  clearHistory,
  sendQuickMessage,
  sendMessage
} = useAIAssistant()
</script>

<style scoped>
.ai-assistant-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
}

/* 聊天面板 */
.ai-chat-panel {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 520px;
  height: 720px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 动画 */
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* 响应式 */
@media (max-width: 480px) {
  .ai-chat-panel {
    width: calc(100vw - 32px);
    height: calc(100vh - 120px);
    right: -8px;
  }
}
</style>