<template>
  <div class="learning-resources">
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
        v-for="resource in filteredResources" 
        :key="resource.id" 
        class="resource-card"
        :class="resource.type"
        @click="openResource(resource)"
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
          <el-button type="primary" size="small" round @click.stop="openResource(resource)">
            <el-icon><Link /></el-icon>
            立即学习
          </el-button>
        </div>
      </div>
    </div>

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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Collection, VideoPlay, Document, Edit, View, Link, TrendCharts, Aim, Star } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const activeTab = ref('all')

const progressColors = [
  { color: '#667eea', percentage: 50 },
  { color: '#764ba2', percentage: 100 }
]

// 丰富的学习资源数据 - 包含真实跳转链接
const resources = ref([
  {
    id: 1,
    type: 'video',
    title: '数据结构与算法 - 二叉树详解',
    description: '深入讲解二叉树的概念、遍历方法和应用场景',
    cover: 'https://img-c.udemycdn.com/course/480x270/1468694_dd7d_2.jpg',
    provider: '中国大学MOOC',
    providerLogo: 'https://img.icons8.com/color/48/graduation-cap.png',
    duration: '45:30',
    views: '2.3万',
    tags: ['数据结构', '二叉树', '算法'],
    progress: 65,
    url: 'https://www.icourse163.org/course/ZJU-93001'
  },
  {
    id: 2,
    type: 'doc',
    title: 'Python数据结构实战手册',
    description: '全面介绍Python中常用数据结构的使用方法和最佳实践',
    cover: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
    provider: '极客时间',
    providerLogo: 'https://img.icons8.com/color/48/code.png',
    views: '1.8万',
    tags: ['Python', '数据结构', '实战'],
    progress: 30,
    url: 'https://time.geekbang.org/column/intro/100017301'
  },
  {
    id: 3,
    type: 'practice',
    title: 'LeetCode精选100题',
    description: '精选100道高频算法面试题，附详细解析和代码',
    cover: 'https://assets.leetcode.com/static_assets/public/images/LeetCode_Sharing.png',
    provider: 'LeetCode',
    providerLogo: 'https://img.icons8.com/external-tal-revivo-color-tal-revivo/48/external-level-up-your-coding-skills-and-quickly-land-a-job-logo-color-tal-revivo.png',
    views: '5.6万',
    tags: ['算法', '面试', '练习'],
    progress: 12,
    url: 'https://leetcode.cn/studyplan/top-100-liked/'
  },
  {
    id: 4,
    type: 'video',
    title: '机器学习入门 - 吴恩达课程',
    description: '斯坦福大学经典机器学习课程，从零开始学习ML',
    cover: 'https://img-c.udemycdn.com/course/480x270/950390_270f_3.jpg',
    provider: 'Coursera',
    providerLogo: 'https://img.icons8.com/color/48/coursera.png',
    duration: '32:15',
    views: '3.1万',
    tags: ['机器学习', 'Python', 'AI'],
    url: 'https://www.coursera.org/learn/machine-learning'
  },
  {
    id: 5,
    type: 'doc',
    title: 'PyTorch深度学习实战',
    description: '系统学习PyTorch框架，从基础到实战项目',
    cover: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400',
    provider: '掘金',
    providerLogo: 'https://img.icons8.com/color/48/documents.png',
    views: '9800',
    tags: ['深度学习', 'PyTorch', 'AI'],
    url: 'https://juejin.cn/post/7000000000000000000'
  },
  {
    id: 6,
    type: 'practice',
    title: '前端面试题库 - 200题精选',
    description: '涵盖HTML、CSS、JavaScript、Vue、React等核心知识点',
    cover: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400',
    provider: '牛客网',
    providerLogo: 'https://img.icons8.com/color/48/test-passed.png',
    views: '4.2万',
    tags: ['前端', '面试', 'JavaScript'],
    url: 'https://www.nowcoder.com/exam/interview'
  },
  {
    id: 7,
    type: 'video',
    title: 'Vue3从入门到精通',
    description: '最新Vue3技术栈完整教程，Composition API详解',
    cover: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
    provider: 'B站',
    providerLogo: 'https://img.icons8.com/color/48/bilibili.png',
    duration: '12:30:00',
    views: '128万',
    tags: ['Vue3', '前端', 'JavaScript'],
    progress: 45,
    url: 'https://www.bilibili.com/video/BV1dS4y1y7vd'
  },
  {
    id: 8,
    type: 'video',
    title: 'Spring Boot企业级开发',
    description: '从零搭建企业级Spring Boot项目，整合主流技术栈',
    cover: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400',
    provider: '慕课网',
    providerLogo: 'https://img.icons8.com/color/48/java-coffee-cup-logo.png',
    duration: '28:45:00',
    views: '56万',
    tags: ['Java', 'Spring Boot', '后端'],
    url: 'https://www.imooc.com/learn/1279'
  },
  {
    id: 9,
    type: 'doc',
    title: 'MySQL性能优化指南',
    description: '深入理解MySQL索引原理，掌握SQL优化技巧',
    cover: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400',
    provider: '掘金',
    providerLogo: 'https://img.icons8.com/color/48/mysql-logo.png',
    views: '2.1万',
    tags: ['MySQL', '数据库', '性能优化'],
    progress: 78,
    url: 'https://juejin.cn/post/6844903569632526343'
  },
  {
    id: 10,
    type: 'practice',
    title: '剑指Offer算法题精选',
    description: '68道经典算法面试题，附详细题解和多种解法',
    cover: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400',
    provider: 'LeetCode',
    providerLogo: 'https://img.icons8.com/external-tal-revivo-color-tal-revivo/48/external-level-up-your-coding-skills-and-quickly-land-a-job-logo-color-tal-revivo.png',
    views: '8.9万',
    tags: ['算法', '面试', '剑指Offer'],
    progress: 35,
    url: 'https://leetcode.cn/studyplan/coding-interviews/'
  },
  {
    id: 11,
    type: 'video',
    title: 'React18核心技术解析',
    description: '深入理解React18新特性，Hooks原理与实战',
    cover: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400',
    provider: 'B站',
    providerLogo: 'https://img.icons8.com/color/48/bilibili.png',
    duration: '15:20:00',
    views: '89万',
    tags: ['React', '前端', 'Hooks'],
    url: 'https://www.bilibili.com/video/BV1ZB4y1Z7o8'
  },
  {
    id: 12,
    type: 'doc',
    title: 'Docker容器化部署实战',
    description: '从零学习Docker，掌握容器化部署与编排',
    cover: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=400',
    provider: 'CSDN',
    providerLogo: 'https://img.icons8.com/color/48/docker.png',
    views: '3.5万',
    tags: ['Docker', 'DevOps', '云原生'],
    url: 'https://blog.csdn.net/docker'
  },
  {
    id: 13,
    type: 'practice',
    title: 'SQL练习50题精选',
    description: '经典SQL面试题，覆盖查询、连接、子查询等',
    cover: 'https://images.unsplash.com/photo-1489875347897-49f64b51c1f8?w=400',
    provider: '牛客网',
    providerLogo: 'https://img.icons8.com/color/48/test-passed.png',
    views: '6.7万',
    tags: ['SQL', '数据库', '面试'],
    progress: 60,
    url: 'https://www.nowcoder.com/exam/oj?tab=SQL%E7%AF%87'
  },
  {
    id: 14,
    type: 'video',
    title: 'Kubernetes入门到实战',
    description: '云原生容器编排技术K8s完整教程',
    cover: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400',
    provider: '极客时间',
    providerLogo: 'https://img.icons8.com/color/48/kubernetes.png',
    duration: '20:00:00',
    views: '12万',
    tags: ['K8s', '云原生', 'DevOps'],
    url: 'https://time.geekbang.org/column/intro/100015201'
  },
  {
    id: 15,
    type: 'doc',
    title: 'Redis设计与实现',
    description: '深入理解Redis数据结构、持久化和集群原理',
    cover: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
    provider: '极客时间',
    providerLogo: 'https://img.icons8.com/color/48/redis.png',
    views: '4.8万',
    tags: ['Redis', '缓存', '数据库'],
    progress: 25,
    url: 'https://time.geekbang.org/column/intro/100056701'
  }
])

const filteredResources = computed(() => {
  if (activeTab.value === 'all') {
    return resources.value
  }
  return resources.value.filter(r => r.type === activeTab.value)
})

const getTypeLabel = (type) => {
  const labels = {
    video: '视频',
    doc: '文档',
    practice: '练习'
  }
  return labels[type] || type
}

const handleImageError = (e) => {
  e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'
}

const handleLogoError = (e) => {
  e.target.src = 'https://img.icons8.com/color/48/book.png'
}

const openResource = (resource) => {
  if (resource.url) {
    window.open(resource.url, '_blank')
    ElMessage.success(`正在跳转到：${resource.provider}`)
  } else {
    ElMessage.info(`${resource.title} - 链接暂未配置`)
  }
}
</script>

<style scoped>
.learning-resources {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 24px;
  padding: 28px;
  border: 1px solid #e2e8f0;
}

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
  .resources-grid {
    grid-template-columns: 1fr;
  }
  
  .resources-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
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
