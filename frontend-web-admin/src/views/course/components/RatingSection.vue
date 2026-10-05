<template>
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
      <el-button type="primary" @click="dialogVisible = true" class="add-btn">
        <el-icon><EditPen /></el-icon>
        评价
      </el-button>
    </div>

    <!-- 评分统计 -->
    <div class="rating-summary">
      <div class="overall-score">
        <span class="score-number">{{ averageRating.toFixed(1) }}</span>
        <div class="score-stars">
          <el-rate :model-value="averageRating" disabled :colors="ratingColors" />
          <span class="rating-count">{{ ratings.length }} 条评价</span>
        </div>
      </div>
      <div class="rating-bars">
        <div v-for="i in 5" :key="i" class="rating-bar">
          <span class="bar-label">{{ 6 - i }}星</span>
          <el-progress
            :percentage="getRatingPercentage(ratings, 6 - i)"
            :stroke-width="8"
            :show-text="false"
            :color="ratingColors[2]"
          />
          <span class="bar-count">{{ getRatingCount(ratings, 6 - i) }}</span>
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

    <!-- 评价对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="课程评价"
      width="500px"
      class="interaction-dialog"
    >
      <el-form :model="form" label-position="top">
        <el-form-item label="总体评分">
          <div class="rating-input">
            <el-rate
              v-model="form.score"
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
              :checked="form.tags.includes(tag)"
              @change="$emit('toggle-tag', tag)"
              class="tag-option"
            >
              {{ tag }}
            </el-check-tag>
          </div>
        </el-form-item>
        <el-form-item label="详细评价">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="分享你的学习体验..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="$emit('submit')">提交评价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { Trophy, EditPen } from '@element-plus/icons-vue'
import { getRatingCount, getRatingPercentage } from '../utils/interactionCompute'

defineProps({
  ratings: { type: Array, default: () => [] },
  averageRating: { type: Number, default: 0 },
  availableTags: { type: Array, default: () => [] },
  ratingColors: { type: Array, default: () => [] }
})

const dialogVisible = defineModel('dialogVisible', { type: Boolean, default: false })
const form = defineModel('form', { type: Object, default: () => ({ score: 5, content: '', tags: [] }) })

defineEmits(['submit', 'toggle-tag'])
</script>

<style scoped>
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

.rating-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
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