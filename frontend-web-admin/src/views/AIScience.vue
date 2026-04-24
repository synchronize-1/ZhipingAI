<template>
  <div class="ai-science-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>🤖 AI科普乐园</h1>
      <p class="subtitle">hello world！</p>
    </div>

    <!-- 功能标签页 -->
    <el-tabs v-model="activeTab" type="card" class="ai-tabs">
      <!-- AI体验中心 -->
      <el-tab-pane label="🎨 AI体验中心" name="experience">
        <AIExperience />
      </el-tab-pane>

      <!-- AI知识馆 -->
      <el-tab-pane label="📚 AI知识馆" name="knowledge">
        <AIKnowledge />
      </el-tab-pane>

      <!-- AI学习助手 -->
      <el-tab-pane label="📖 AI学习助手" name="learning">
        <AILearning />
      </el-tab-pane>

      <!-- AI创意工具 -->
      <el-tab-pane label="✨ AI创意工具" name="creative">
        <AICreative />
      </el-tab-pane>

      <!-- AI游乐场 -->
      <el-tab-pane label="🎮 AI游乐场" name="games">
        <AIGames />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AIExperience from './AIExperience.vue'
import AIKnowledge from './AIKnowledge.vue'
import AILearning from './AILearning.vue'
import AICreative from './AICreative.vue'
import AIGames from './AIGames.vue'

// Tab状态
const activeTab = ref('experience')
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
</style>