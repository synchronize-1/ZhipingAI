<template>
  <!-- AI推荐理由 - 更精美的展示 -->
  <div class="ai-recommendation-card">
    <div class="ai-rec-header">
      <div class="ai-rec-icon">
        <img src="https://img.icons8.com/3d-fluency/94/robot-2.png" alt="AI" />
      </div>
      <div class="ai-rec-title">
        <h4>AI 智能推荐</h4>
        <p>基于你的学习轨迹分析</p>
      </div>
    </div>
    <div class="ai-rec-content">
      <div class="ai-rec-analysis">
        <div class="analysis-item">
          <el-icon><TrendCharts /></el-icon>
          <span>最近学习：<strong>数据结构、算法设计、Python编程</strong></span>
        </div>
        <div class="analysis-item">
          <el-icon><Aim /></el-icon>
          <span>薄弱环节：<strong>二叉树遍历、动态规划</strong></span>
        </div>
        <div class="analysis-item">
          <el-icon><Star /></el-icon>
          <span>推荐重点：<strong>强化算法思维，提升编程能力</strong></span>
        </div>
      </div>
      <div class="ai-rec-tips">
        💡 建议每天学习1-2小时，配合练习题巩固知识点
      </div>
    </div>
  </div>
</template>

<script setup>
import { TrendCharts, Aim, Star } from '@element-plus/icons-vue'
</script>

<style scoped>
/* AI推荐卡片 - 精美版 */
.ai-recommendation-card {
  background: linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%);
  border: 1px solid #c7d2fe;
  border-radius: 20px;
  padding: 24px;
  margin-top: 8px;
}

.ai-rec-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.ai-rec-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.ai-rec-icon img {
  width: 40px;
  height: 40px;
}

.ai-rec-title h4 {
  margin: 0 0 4px 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

.ai-rec-title p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.ai-rec-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-rec-analysis {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analysis-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  transition: all 0.2s;
  border: 1px solid #e2e8f0;
}

.analysis-item:hover {
  background: #f8fafc;
  transform: translateX(4px);
}

.analysis-item .el-icon {
  color: #667eea;
  font-size: 20px;
  flex-shrink: 0;
}

.analysis-item span {
  color: #475569;
  font-size: 14px;
}

.analysis-item strong {
  color: #4f46e5;
  font-weight: 500;
}

.ai-rec-tips {
  padding: 14px 18px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #fbbf24;
  border-radius: 12px;
  color: #92400e;
  font-size: 13px;
  line-height: 1.5;
}

/* 响应式 */
@media (max-width: 768px) {
  .ai-rec-header {
    flex-direction: column;
    text-align: center;
  }

  .analysis-item {
    flex-direction: column;
    text-align: center;
  }
}
</style>