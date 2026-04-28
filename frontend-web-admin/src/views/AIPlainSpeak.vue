<template>
  <div class="ai-plain-speak">
    <div class="main-content">
      <!-- 左侧主区域 -->
      <div class="left-area">
        <!-- AI原理速成 -->
        <div class="principles-section">
          <h2 class="section-title">白话AI原理</h2>
          <div class="principles-grid">
            <div
                v-for="principle in allPrinciples"
                :key="principle.id"
                class="principle-card"
                :class="{ expanded: expandedPrinciple === principle.id }"
                @click="togglePrinciple(principle.id)"
            >
              <div class="principle-header">
                <span class="principle-icon">{{ principle.icon }}</span>
                <span class="principle-title">{{ principle.title }}</span>
                <span class="expand-icon">{{ expandedPrinciple === principle.id ? '▼' : '▶' }}</span>
              </div>
              <div class="principle-analogy">
                💡 简单比喻：{{ principle.analogy }}
              </div>
              <div class="principle-detail" v-if="expandedPrinciple === principle.id">
                <div class="detail-text">{{ principle.detail }}</div>
                <div class="fun-fact" v-if="principle.funFact">
                  🎉 趣味小知识：{{ principle.funFact }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI应用案例 -->
        <div class="applications-section">
          <h2 class="section-title">
            <span class="title-icon">🎯</span>
            AI应用案例
          </h2>
          <div class="apps-grid">
            <div v-for="app in aiApplications" :key="app.name" class="app-card">
              <div class="app-header">
                <span class="app-icon">{{ app.icon }}</span>
                <div class="app-info">
                  <div class="app-name">{{ app.name }}</div>
                  <div class="app-category">{{ app.category }}</div>
                </div>
              </div>
              <div class="app-desc">{{ app.desc }}</div>
              <div class="app-news" v-if="app.news">
                <a :href="app.newsLink" target="_blank" class="news-link">
                  📰 {{ app.news }}
                  <el-icon class="news-icon"><Link /></el-icon>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧边栏：热门开源项目 -->
      <div class="right-sidebar">
        <div class="projects-section">
          <h2 class="sidebar-title">
            <span class="title-icon">🔥</span>
            热门开源项目
          </h2>
          <div class="projects-list">
            <div
                v-for="project in hotProjects"
                :key="project.name"
                class="project-item"
                @click="openProjectLink(project.link)"
            >
              <div class="project-header">
                <span class="project-icon">{{ project.icon }}</span>
                <div class="project-info">
                  <div class="project-name">{{ project.name }}</div>
                  <div class="project-stars">⭐ {{ project.stars }}</div>
                </div>
              </div>
              <div class="project-desc">{{ project.desc }}</div>
              <div class="project-tags">
                <el-tag v-for="tag in project.tags.slice(0, 2)" :key="tag" size="small" type="info">{{ tag }}</el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Link } from '@element-plus/icons-vue'

const expandedPrinciple = ref(null)

const togglePrinciple = (id) => {
  expandedPrinciple.value = expandedPrinciple.value === id ? null : id
}

const openProjectLink = (link) => {
  if (link) {
    window.open(link, '_blank')
  }
}

// AI原理数据（扩充到10个）
const allPrinciples = ref([
  {
    id: 'ml',
    icon: '🧠',
    title: '机器学习是什么？',
    analogy: '像小朋友学习认猫：给很多猫的照片，越看越知道什么是猫。',
    detail: '机器学习是让计算机从数据中学习规律，而不需要明确编程。它通过训练数据和算法，自动发现模式并做出预测。就像你通过大量例子学会辨别苹果和橘子一样。',
    funFact: '机器学习算法70%的时间其实在"洗数据"！'
  },
  {
    id: 'dl',
    icon: '🔗',
    title: '深度学习与神经网络',
    analogy: '像大脑中的神经元互相连接，层层传递信息，最终做出判断。',
    detail: '深度学习使用多层神经网络（深度神经网络）来学习数据的层次化特征。第一层识别简单线条，中间层组合成形状，最后层识别出物体。就像人脑从看到理解的过程。',
    funFact: 'GPT-4有约1.8万亿个参数，比人脑神经元还多！'
  },
  {
    id: 'llm',
    icon: '📖',
    title: '大语言模型(LLM)',
    analogy: '像读完整个互联网的超强学生，你说上半句它能猜出下半句。',
    detail: '基于Transformer架构的大规模模型，通过学习海量文本数据（相当于几十万本书）掌握语言规律，能够理解问题、生成答案、翻译、写文章等。',
    funFact: '训练GPT-4需要约25000张A100显卡运行100天！'
  },
  {
    id: 'agent',
    icon: '🤖',
    title: 'AI Agent（智能体）',
    analogy: '像有个私人助理，不仅能聊天，还会自主规划、调用工具、完成任务。',
    detail: 'AI Agent是能够感知环境、自主决策并执行行动的智能系统。它可以规划任务步骤、调用API（如查天气、订票）、记忆对话历史。就像你给助理一个任务，它会自己去完成。',
    funFact: '2026年最火的Agent框架可以自动写代码、部署应用！'
  },
  {
    id: 'distillation',
    icon: '🧪',
    title: '知识蒸馏',
    analogy: '像老师傅（大模型）把经验浓缩成精华教给徒弟（小模型），徒弟学得快、跑得快。',
    detail: '知识蒸馏是一种模型压缩技术，让大型模型（教师）教小型模型（学生）如何思考和输出。学生模型学习模仿教师的输出分布，从而在保持性能的同时大幅减小模型体积，可以在手机上运行。',
    funFact: '一个好老师模型可以教出很多优秀的学生模型！'
  },
  {
    id: 'skill',
    icon: '🎯',
    title: 'Skill学习',
    analogy: '像学会骑自行车后，再学电动车就很容易——AI也学会了举一反三。',
    detail: 'Skill学习让AI从已有技能中组合出新的能力。比如学会了"抓取"和"移动"，就能组合成"搬运"。通过迁移学习和元学习，AI能够快速适应新任务，不需要每次都重新训练。',
    funFact: '最新的Skill库有超过10000个预训练技能！'
  },
  {
    id: 'inference',
    icon: '⚡',
    title: '推理时计算',
    analogy: '像做数学题时多打草稿就能减少错误，AI也是思考越久答案越准。',
    detail: '推理时计算让模型在回答前进行多步内部思考，通过思维链（Chain of Thought）和搜索来提升推理质量。就像你在考试时会先在草稿纸上推导，而不是直接写答案。',
    funFact: 'DeepSeek R1的推理过程像"自言自语"，逐步分析问题！'
  },
  {
    id: 'rl',
    icon: '🎮',
    title: '强化学习',
    analogy: '像训练小狗：做对了给奖励，做错了没奖励，慢慢就知道该怎么做。',
    detail: '强化学习通过"试错"和"奖励反馈"来训练AI。AI在环境中采取行动，获得正面或负面反馈，不断优化决策策略。AlphaGo就是通过强化学习练就了顶尖棋力。',
    funFact: '强化学习训练围棋AI需要自己跟自己下几千万盘棋！'
  },
  {
    id: 'gan',
    icon: '🎨',
    title: '生成对抗网络(GAN)',
    analogy: '像造假币的和警察互相斗智，双方都越来越厉害。',
    detail: 'GAN由生成器和判别器两个网络组成。生成器试图创造逼真的内容（如图片），判别器努力识别真假。两者不断对抗提升能力，最终生成器能创造出以假乱真的内容。',
    funFact: 'GAN被图灵奖得主杨立昆称为"过去10年最酷的AI想法"！'
  },
  {
    id: 'rag',
    icon: '📚',
    title: '检索增强生成(RAG)',
    analogy: '像开卷考试，遇到问题先翻书找答案，再结合自己的知识回答。',
    detail: 'RAG让大模型在回答问题前先检索相关文档，然后基于检索到的信息生成答案。这样可以保证答案的准确性、实时性，还能避免"胡编乱造"的问题。',
    funFact: 'RAG是解决大模型"幻觉"问题的重要技术！'
  }
])

// AI应用案例（带新闻链接）
const aiApplications = ref([
  {
    name: 'AlphaFold',
    icon: '🧬',
    category: '生物医疗',
    desc: 'DeepMind开发的蛋白质结构预测系统，成功预测数亿种蛋白质结构，将生物学研究时间从数年缩短到几分钟。',
    news: '《Science》2021年度突破：AI预测蛋白质结构彻底改变生物学',
    newsLink: 'https://www.science.org/content/article/sciences-2021-breakthrough-year-ai'
  },
  {
    name: 'GPT系列',
    icon: '💬',
    category: '自然语言',
    desc: '从GPT-1到GPT-5，大语言模型展现出惊人的文案写作、代码生成、逻辑推理能力，改变人机交互方式。',
    news: 'OpenAI发布GPT-5，推理能力接近人类专家水平',
    newsLink: 'https://openai.com'
  },
  {
    name: 'Midjourney',
    icon: '🎨',
    category: 'AI绘画',
    desc: '文字生成图片工具，以高质量的艺术风格闻名，让创意表达变得触手可及。',
    news: 'Midjourney V7发布，图像质量堪比专业摄影师作品',
    newsLink: 'https://www.midjourney.com'
  },
  {
    name: 'Sora',
    icon: '🎥',
    category: '视频生成',
    desc: 'OpenAI的文生视频模型，能生成长达1分钟的高清视频，理解物理世界的运动规律。',
    news: 'Sora开启视频生成新纪元，影视行业迎来变革',
    newsLink: 'https://openai.com/sora'
  },
  {
    name: 'Waymo',
    icon: '🚗',
    category: '自动驾驶',
    desc: '谷歌旗下的自动驾驶公司，已在美国多个城市提供无人驾驶出租车服务。',
    news: 'Waymo无人驾驶里程突破2000万英里，事故率远低于人类',
    newsLink: 'https://waymo.com'
  },
  {
    name: 'DeepSeek R1',
    icon: '🔍',
    category: '推理模型',
    desc: '开源的推理模型，数学和编程能力媲美闭源顶级模型，推动AI民主化。',
    news: 'DeepSeek R1开源发布，推理模型进入平民化时代',
    newsLink: 'https://github.com/deepseek-ai/DeepSeek-R1'
  }
])

// 热门开源项目
const hotProjects = ref([
  {
    name: 'DeepSeek R1',
    icon: '🔍',
    stars: '48.3k',
    link: 'https://github.com/deepseek-ai/DeepSeek-R1',
    tags: ['推理模型', '开源'],
    desc: '通过强化学习实现推理能力的开源模型'
  },
  {
    name: 'CrewAI',
    icon: '👥',
    stars: '28.7k',
    link: 'https://github.com/joaomdmoura/crewAI',
    tags: ['Agent', '多智能体'],
    desc: '让多个AI Agent协作完成复杂任务'
  },
  {
    name: 'LangGraph',
    icon: '🔗',
    stars: '22.1k',
    link: 'https://github.com/langchain-ai/langgraph',
    tags: ['Agent', '工作流'],
    desc: '基于图结构的Agent工作流构建工具'
  },
  {
    name: 'Ollama',
    icon: '🐫',
    stars: '62.8k',
    link: 'https://github.com/ollama/ollama',
    tags: ['本地部署', 'LLM'],
    desc: '让你在本地轻松运行开源模型'
  },
  {
    name: 'Stable Diffusion',
    icon: '🎨',
    stars: '75.2k',
    link: 'https://github.com/Stability-AI/stablediffusion',
    tags: ['AI绘画', '开源'],
    desc: '开源的文字生成图片模型'
  },
  {
    name: 'AutoGPT',
    icon: '🤖',
    stars: '164k',
    link: 'https://github.com/Significant-Gravitas/AutoGPT',
    tags: ['Agent', '自动化'],
    desc: '自主执行任务的AI代理'
  },
  {
    name: 'Llama',
    icon: '🦙',
    stars: '58.9k',
    link: 'https://github.com/meta-llama/llama',
    tags: ['LLM', '开源'],
    desc: 'Meta开源的领先大语言模型'
  },
  {
    name: 'LangChain',
    icon: '🔗',
    stars: '91.5k',
    link: 'https://github.com/langchain-ai/langchain',
    tags: ['框架', 'Agent'],
    desc: '构建LLM应用的主流框架'
  }
])
</script>

<style scoped>
.ai-plain-speak {
  width: 100%;
}

.main-content {
  display: flex;
  gap: 30px;
}

.left-area {
  flex: 3;
  min-width: 0;
}

.right-sidebar {
  flex: 1;
  min-width: 260px;
}

/* 公共标题样式 */
.section-title, .sidebar-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  padding-left: 12px;
  border-left: 4px solid #667eea;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 22px;
}

/* 原理卡片样式 */
.principles-section {
  margin-bottom: 40px;
}

.principles-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.principle-card {
  background: linear-gradient(135deg, #f8f9fc 0%, #fff 100%);
  border-radius: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e4e7ed;
}

.principle-card:hover {
  border-color: #667eea;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.1);
}

.principle-card.expanded {
  border-color: #667eea;
  background: linear-gradient(135deg, #f5f7ff 0%, #fff 100%);
}

.principle-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.principle-icon {
  font-size: 24px;
}

.principle-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  flex: 1;
}

.expand-icon {
  font-size: 12px;
  color: #909399;
}

.principle-analogy {
  font-size: 14px;
  color: #606266;
  background: #f0f2f5;
  padding: 8px 12px;
  border-radius: 8px;
  margin-top: 8px;
}

.principle-detail {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #e4e7ed;
}

.detail-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.7;
}

.fun-fact {
  margin-top: 12px;
  font-size: 13px;
  color: #e6a23c;
  background: #fdf6ec;
  padding: 10px 12px;
  border-radius: 8px;
}

/* 应用案例样式 */
.applications-section {
  margin-top: 20px;
}

.apps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.app-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  transition: all 0.2s;
}

.app-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border-color: #667eea;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.app-icon {
  font-size: 28px;
}

.app-info {
  flex: 1;
}

.app-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.app-category {
  font-size: 11px;
  color: #667eea;
  background: #e8edfd;
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  margin-top: 4px;
}

.app-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 10px;
}

.app-news {
  font-size: 12px;
  color: #909399;
  border-top: 1px solid #f0f0f0;
  padding-top: 10px;
  margin-top: 5px;
}

.news-link {
  color: #667eea;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

.news-link:hover {
  text-decoration: underline;
}

.news-icon {
  font-size: 12px;
}

/* 右侧边栏样式 */
.projects-section {
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
  border-radius: 16px;
  padding: 20px;
  position: sticky;
  top: 20px;
}

.sidebar-title {
  font-size: 18px;
  margin-bottom: 18px;
  border-left-color: #fa709a;
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.project-item {
  background: white;
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e4e7ed;
}

.project-item:hover {
  transform: translateX(4px);
  border-color: #fa709a;
  box-shadow: 0 2px 10px rgba(250, 112, 154, 0.1);
}

.project-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.project-icon {
  font-size: 24px;
}

.project-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.project-stars {
  font-size: 11px;
  color: #f39c12;
}

.project-desc {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.4;
}

.project-tags {
  display: flex;
  gap: 6px;
}

.project-tags :deep(.el-tag) {
  font-size: 10px;
  height: 20px;
  line-height: 20px;
}

/* 响应式 */
@media (max-width: 900px) {
  .main-content {
    flex-direction: column;
  }

  .right-sidebar {
    margin-top: 30px;
  }

  .projects-section {
    position: static;
  }
}
</style>