<template>
  <!-- 技能与成长 -->
  <div class="content-card skill-growth">
    <div class="card-header">
      <div class="header-left">
        <div class="header-icon purple">
          <el-icon><DataAnalysis /></el-icon>
        </div>
        <div>
          <h3>技能与成长</h3>
          <p>技能统计 & 心理健康</p>
        </div>
      </div>
      <el-button type="default" round size="small" @click="$router.push('/growth')">
        详情
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
    </div>
    <!-- 技能统计 -->
    <div class="skill-section">
      <div class="section-title">技能统计</div>
      <div v-if="skillSummary.length > 0" class="skill-list">
        <div v-for="(skill, index) in skillSummary.slice(0, 4)" :key="index" class="skill-item">
          <span class="skill-category">{{ skill.category }}</span>
          <div class="skill-info">
            <span class="skill-count">{{ skill.count }}项</span>
            <span class="skill-level">Lv.{{ skill.avgLevel }}</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-skill">
        <span>暂无技能数据</span>
      </div>
    </div>
    <!-- 心理健康 -->
    <div class="mental-section">
      <div class="section-title">心理状态</div>
      <template v-if="mentalHealth">
        <div class="mental-overview">
          <div class="mental-score">
            <span class="score-num">{{ mentalHealth.overallScore }}</span>
            <span class="score-label">心理健康指数</span>
          </div>
          <div class="mental-info">
            <el-tag :type="mentalHealth.stressLevel === '正常' ? 'success' : mentalHealth.stressLevel === '轻度' ? 'warning' : 'danger'" size="small">
              压力：{{ mentalHealth.stressLevel }}
            </el-tag>
            <span class="mental-date">评估于 {{ mentalHealth.latestDate }}</span>
            <span class="mental-trend">趋势：{{ mentalHealth.trend }}</span>
          </div>
        </div>
      </template>
      <div v-else class="empty-skill">
        <span>暂无心理评估数据</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { DataAnalysis, ArrowRight } from '@element-plus/icons-vue'

defineOptions({ name: 'StudentSkillGrowth' })

defineProps({
  skillSummary: { type: Array, default: () => [] },
  mentalHealth: { type: Object, default: null }
})
</script>

<style scoped>
/* 内容卡片（通用） */
.content-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card-header {
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

.header-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 20px;
}

.header-icon.purple { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }

.header-left h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.header-left p {
  margin: 2px 0 0 0;
  font-size: 13px;
  color: #6b7280;
}

/* 技能与成长 */
.skill-section, .mental-section {
  margin-bottom: 16px;
}

.skill-section:last-child, .mental-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #667eea;
}

.skill-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.skill-category {
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
}

.skill-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.skill-count {
  color: #6b7280;
}

.skill-level {
  color: #667eea;
  font-weight: 600;
}

.empty-skill {
  text-align: center;
  padding: 16px;
  color: #9ca3af;
  font-size: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.mental-overview {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 10px;
}

.mental-score {
  text-align: center;
  min-width: 80px;
}

.mental-score .score-num {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #10b981;
  line-height: 1;
}

.mental-score .score-label {
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
}

.mental-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.mental-date, .mental-trend {
  font-size: 11px;
  color: #9ca3af;
}
</style>