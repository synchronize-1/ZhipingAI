<template>
  <div class="resources-header">
      <div class="header-left">
        <div class="icon-wrapper">
          <el-icon :size="22"><Collection /></el-icon>
        </div>
        <div>
          <h3>学习资源推荐</h3>
          <p>基于你的学习情况智能推荐</p>
        </div>
      </div>
      <div class="header-tabs">
        <el-radio-group v-model="activeTab" size="small">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="video">视频</el-radio-button>
          <el-radio-button label="doc">文档</el-radio-button>
          <el-radio-button label="practice">练习</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="resources-grid">
      <div
        v-for="resource in resources"
        :key="resource.id"
        class="resource-card"
        :class="resource.type"
        @click="$emit('open', resource)"
      >
        <div class="resource-cover">
          <img :src="resource.cover" :alt="resource.title" @error="handleImageError" />
          <div class="resource-type-badge">
            <el-icon v-if="resource.type === 'video'"><VideoPlay /></el-icon>
            <el-icon v-else-if="resource.type === 'doc'"><Document /></el-icon>
            <el-icon v-else><Edit /></el-icon>
            {{ getTypeLabel(resource.type) }}
          </div>
          <div v-if="resource.duration" class="resource-duration">
            {{ resource.duration }}
          </div>
        </div>
        <div class="resource-info">
          <h4 class="resource-title">{{ resource.title }}</h4>
          <p class="resource-desc">{{ resource.description }}</p>
          <div class="resource-meta">
            <div class="meta-left">
              <div class="provider-logo-wrapper">
                <img :src="resource.providerLogo" :alt="resource.provider" class="provider-logo" @error="handleLogoError" />
              </div>
              <span class="provider-name">{{ resource.provider }}</span>
            </div>
            <div class="meta-right">
              <el-icon><View /></el-icon>
              <span>{{ resource.views }}</span>
            </div>
          </div>
          <div class="resource-tags">
            <el-tag
              v-for="tag in resource.tags"
              :key="tag"
              size="small"
              effect="plain"
              class="resource-tag"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
        <div class="resource-progress" v-if="resource.progress !== undefined">
          <el-progress
            :percentage="resource.progress"
            :stroke-width="4"
            :show-text="false"
            :color="progressColors"
          />
          <span class="progress-text">已学习 {{ resource.progress }}%</span>
        </div>
        <div class="resource-action">
          <el-button type="primary" size="small" round @click.stop="$emit('open', resource)">
            <el-icon><Link /></el-icon>
            立即学习
          </el-button>
        </div>
      </div>
    </div>
</template>

<script setup>
import { Collection, VideoPlay, Document, Edit, View, Link } from '@element-plus/icons-vue'
import { getTypeLabel } from '../utils/resourceHelpers'

defineProps({
  resources: { type: Array, default: () => [] }
})

const activeTab = defineModel('activeTab', { default: 'all' })

defineEmits(['open'])

const progressColors = [
  { color: '#667eea', percentage: 50 },
  { color: '#764ba2', percentage: 100 }
]

const handleImageError = (e) => {
  e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'
}

const handleLogoError = (e) => {
  e.target.src = 'https://img.icons8.com/color/48/book.png'
}
</script>

<style scoped>
.resources-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.resources-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.resources-header p {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #64748b;
}

.header-tabs :deep(.el-radio-button__inner) {
  background: white;
  border-color: #e2e8f0;
  color: #64748b;
}

.header-tabs :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

/* 资源网格 */
.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.resource-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.resource-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.resource-cover {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.resource-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.resource-card:hover .resource-cover img {
  transform: scale(1.05);
}

.resource-type-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.resource-card.video .resource-type-badge {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%);
}

.resource-card.doc .resource-type-badge {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%);
}

.resource-card.practice .resource-type-badge {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%);
}

.resource-duration {
  position: absolute;
  bottom: 12px;
  right: 12px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 6px;
  color: white;
  font-size: 12px;
  font-weight: 500;
}

.resource-info {
  padding: 16px;
}

.resource-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.resource-desc {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.resource-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.meta-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.provider-logo {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  object-fit: contain;
  background: white;
}

.provider-name {
  font-size: 12px;
  color: #64748b;
}

.meta-right {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #94a3b8;
  font-size: 12px;
}

.resource-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.resource-tag {
  background: #eef2ff;
  border-color: #c7d2fe;
  color: #4f46e5;
  font-size: 11px;
}

/* 学习进度 */
.resource-progress {
  padding: 12px 16px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.resource-progress :deep(.el-progress-bar__outer) {
  background: #e2e8f0;
}

.progress-text {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: #64748b;
}

/* 资源操作按钮 */
.resource-action {
  padding: 12px 16px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
}

.resource-action .el-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 12px;
}

.resource-action .el-button:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
  transform: scale(1.05);
}

/* Provider Logo */
.provider-logo-wrapper {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  overflow: hidden;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.provider-logo {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

/* 响应式 */
@media (max-width: 768px) {
  .resources-grid {
    grid-template-columns: 1fr;
  }

  .resources-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>