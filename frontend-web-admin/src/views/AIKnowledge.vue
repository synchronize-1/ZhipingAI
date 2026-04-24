<template>
  <div class="knowledge-section">
    <!-- AI发展历史 - 树状时间线 -->
    <el-card class="knowledge-card timeline-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="icon">🏛️</span>
          <span class="title">AI发展历史</span>
        </div>
      </template>
      <div class="timeline-wrapper">
        <div class="timeline-tree">
          <div v-for="era in aiHistoryTree" :key="era.year" class="timeline-era">
            <div class="era-year" @click="toggleEra(era.year)">
              <span class="year-badge">{{ era.year }}</span>
              <span class="era-icon">{{ era.expanded ? '▼' : '▶' }}</span>
            </div>
            <div v-show="era.expanded" class="era-branches">
              <div v-for="branch in era.branches" :key="branch.title" class="branch-item">
                <div class="branch-header" @click="toggleBranchDetail(era.year, branch.title)">
                  <span class="branch-icon">{{ branch.icon }}</span>
                  <span class="branch-title">{{ branch.title }}</span>
                  <span class="branch-expand">{{ getBranchExpanded(era.year, branch.title) ? '▲' : '▼' }}</span>
                </div>
                <div v-show="getBranchExpanded(era.year, branch.title)" class="branch-detail">
                  <p>{{ branch.detail }}</p>
                  <div v-if="branch.subBranches" class="sub-branches">
                    <div v-for="sub in branch.subBranches" :key="sub.name" class="sub-item">
                      <span class="sub-name">🔹 {{ sub.name }}</span>
                      <span class="sub-desc">{{ sub.desc }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- AI原理速成 - 增强版 + 开源项目 -->
    <el-card class="knowledge-card principle-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="icon">🔬</span>
          <span class="title">AI原理速成</span>
        </div>
      </template>
      <el-collapse v-model="activePrinciple" accordion>
        <el-collapse-item v-for="p in aiPrinciples" :key="p.id" :title="p.icon + ' ' + p.title" :name="p.id">
          <div class="principle-content">
            <div class="analogy">
              <strong>💡 简单比喻：</strong>{{ p.analogy }}
            </div>
            <div v-if="p.detail" class="principle-detail">
              <strong>📖 详细说明：</strong>
              <p>{{ p.detail }}</p>
            </div>
            <div v-if="p.steps" class="steps">
              <div v-for="step in p.steps" :key="step.step" class="step-item">
                <span class="step-num">{{ step.step }}</span>
                <span class="step-text">{{ step.desc }}</span>
              </div>
            </div>
            <div v-if="p.funFact" class="fun-fact">🎉 {{ p.funFact }}</div>
          </div>
        </el-collapse-item>
      </el-collapse>

      <!-- 热门开源项目 -->
      <div class="open-source-section">
        <div class="section-title">
          <span>🔥 热门开源项目</span>
          <el-tag size="small" type="warning">实时更新</el-tag>
        </div>
        <div class="project-grid">
          <div v-for="project in hotProjects" :key="project.name" class="project-card" @click="openProjectLink(project.link)">
            <div class="project-header">
              <span class="project-icon">{{ project.icon }}</span>
              <span class="project-name">{{ project.name }}</span>
              <span class="project-stars">⭐ {{ project.stars }}</span>
            </div>
            <div class="project-desc">{{ project.desc }}</div>
            <div class="project-tags">
              <el-tag v-for="tag in project.tags.slice(0, 3)" :key="tag" size="small" type="info">{{ tag }}</el-tag>
            </div>
            <div class="project-overview">{{ project.overview }}</div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- AI名人堂 -->
    <el-card class="knowledge-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="icon">👨‍🔬</span>
          <span class="title">AI名人堂</span>
        </div>
      </template>
      <div class="pioneers-grid">
        <div v-for="pioneer in aiPioneers" :key="pioneer.name" class="pioneer-card">
          <div class="pioneer-avatar">{{ pioneer.avatar }}</div>
          <div class="pioneer-name">{{ pioneer.name }}</div>
          <div class="pioneer-title">{{ pioneer.title }}</div>
          <div class="pioneer-quote">"{{ pioneer.quote }}"</div>
        </div>
      </div>
    </el-card>

    <!-- AI应用案例 -->
    <el-card class="knowledge-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="icon">🎯</span>
          <span class="title">AI应用案例</span>
        </div>
      </template>
      <el-tabs v-model="activeAppCategory">
        <el-tab-pane v-for="cat in aiApplications" :key="cat.category" :label="cat.icon + ' ' + cat.category" :name="cat.category">
          <div class="app-list">
            <div v-for="app in cat.items" :key="app.name" class="app-item">
              <div class="app-name">{{ app.name }}</div>
              <div class="app-desc">{{ app.desc }}</div>
              <div class="app-example">💡 {{ app.example }}</div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const API_BASE = 'http://localhost:3000/api/ai-science'

// AI发展历史 - 树状数据
const expandedState = ref({})

function toggleEra(year) {
  const era = aiHistoryTree.value.find(e => e.year === year)
  if (era) era.expanded = !era.expanded
}

function getBranchExpanded(eraYear, branchTitle) {
  return expandedState.value[`${eraYear}_${branchTitle}`] || false
}

function toggleBranchDetail(eraYear, branchTitle) {
  const key = `${eraYear}_${branchTitle}`
  expandedState.value[key] = !expandedState.value[key]
}

const aiHistoryTree = ref([
  {
    year: '1950s',
    expanded: false,
    branches: [
      { icon: '💡', title: '图灵测试', detail: '艾伦·图灵提出"机器能思考吗？"的问题，设计了图灵测试来判断机器是否具有智能。这是人工智能概念的起源。', subBranches: [{ name: '模仿游戏', desc: '测试机器能否模仿人类对话' }] },
      { icon: '🎓', title: '达特茅斯会议', detail: '1956年，麦卡锡、明斯基等人召开会议，正式提出"人工智能"术语，标志着AI作为独立学科的诞生。' }
    ]
  },
  {
    year: '1960s-70s',
    expanded: false,
    branches: [
      { icon: '🤖', title: '早期AI程序', detail: 'ELIZA（1966）是最早的聊天机器人；Shakey（1969）是第一个移动机器人，能理解简单命令。', subBranches: [{ name: 'ELIZA', desc: '模拟心理治疗师的对话程序' }, { name: 'Shakey', desc: '能够感知环境并执行任务的机器人' }] },
      { icon: '📚', title: '专家系统', detail: 'DENDRAL（化学分析）和MYCIN（医疗诊断）是早期专家系统，将专家知识编码为规则。' }
    ]
  },
  {
    year: '1980s-90s',
    expanded: false,
    branches: [
      { icon: '🧠', title: '神经网络复兴', detail: '反向传播算法的提出让多层神经网络得以训练，连接主义重新受到关注。' },
      { icon: '♟️', title: '深蓝战胜卡斯帕罗夫', detail: '1997年，IBM的深蓝击败国际象棋世界冠军，成为AI发展的里程碑。' },
      { icon: '📊', title: '统计学习方法', detail: '支持向量机（SVM）、随机森林等统计学习理论成为主流。' }
    ]
  },
  {
    year: '2010s',
    expanded: false,
    branches: [
      { icon: '🧬', title: '深度学习革命', detail: '2012年AlexNet在ImageNet竞赛中大幅领先，开启了深度学习时代。卷积神经网络（CNN）成为图像识别标准。', subBranches: [{ name: 'AlexNet', desc: '深度学习的引爆点' }, { name: 'ResNet', desc: '152层的残差网络' }, { name: 'GAN', desc: '生成对抗网络' }] },
      { icon: '🎮', title: 'AlphaGo战胜李世石', detail: '2016年，DeepMind的AlphaGo以4:1战胜围棋世界冠军，展示了强化学习的强大能力。' },
      { icon: '📝', title: 'Transformer架构', detail: '2017年Google提出的Transformer架构取代RNN，成为自然语言处理的基础。', subBranches: [{ name: 'BERT', desc: '双向编码器表示' }, { name: 'GPT', desc: '生成式预训练模型' }] }
    ]
  },
  {
    year: '2020-2023',
    expanded: false,
    branches: [
      { icon: '💬', title: '大语言模型爆发', detail: 'ChatGPT（2022.11）发布，让AI对话能力达到新高度。GPT-4、Claude、Gemini等模型相继推出。', subBranches: [{ name: 'ChatGPT', desc: 'OpenAI的划时代产品' }, { name: 'GPT-4', desc: '多模态大模型' }, { name: 'LLaMA', desc: 'Meta开源模型' }] },
      { icon: '🎨', title: 'AI生成内容(AIGC)', detail: 'Midjourney、Stable Diffusion、DALL-E等工具让AI绘画进入大众视野，Sora开启视频生成新时代。' }
    ]
  },
  {
    year: '2024',
    expanded: false,
    branches: [
      { icon: '🤝', title: 'AI Agent爆发', detail: '2024年被称为"AI Agent元年"。AutoGPT、BabyAGI等自主AI代理出现，能够自主规划、执行任务。', subBranches: [{ name: 'AutoGPT', desc: '自主任务执行代理' }, { name: 'LangChain', desc: 'Agent开发框架' }, { name: 'CrewAI', desc: '多Agent协作框架' }] },
      { icon: '🎥', title: '视频生成突破', detail: 'Sora（OpenAI）、Veo（Google）、Kling（快手）等模型实现高质量视频生成，时长可达1分钟以上。' },
      { icon: '📱', title: 'Small Language Models', detail: 'Phi-3、Gemma、Llama 3等小型高效模型可在手机端运行，实现AI普惠。' }
    ]
  },
  {
    year: '2025',
    expanded: false,
    branches: [
      { icon: '🧬', title: 'World Models', detail: '世界模型成为新方向，AI能够理解物理世界规律，为具身智能奠定基础。' },
      { icon: '🔧', title: '模型蒸馏技术成熟', detail: '知识蒸馏让大模型能力迁移到小模型，降低推理成本，提高响应速度。', subBranches: [{ name: '蒸馏原理', desc: '教师模型-学生模型知识迁移' }, { name: 'OpenClaw', desc: '机器人精细动作控制' }] },
      { icon: '🎯', title: '推理模型突破', detail: 'o1、o3等推理模型在数学、编程等领域达到专家水平，能够进行深度思考。' }
    ]
  },
  {
    year: '2026',
    expanded: true,
    branches: [
      { icon: '🦾', title: 'OpenClaw & 具身智能', detail: 'OpenClaw是新一代机器人精细操控框架，结合大语言模型实现复杂物体抓取和环境交互。具身智能（Embodied AI）成为研究热点。', subBranches: [{ name: 'OpenClaw', desc: '灵巧手控制框架' }, { name: 'Embodied AI', desc: '具身人工智能' }, { name: 'Physical Intelligence', desc: '物理智能模型' }] },
      { icon: '⚡', title: '推理时计算', detail: 'Test-time compute技术让AI在推理阶段进行多步思考，大幅提升复杂问题解决能力。DeepSeek R1引领开源推理模型发展。' },
      { icon: '📊', title: '知识蒸馏2.0', detail: '新一代蒸馏技术让模型在保持90%性能的同时，体积缩小到1/10。在线蒸馏、多教师蒸馏等技术成熟。', subBranches: [{ name: '在线蒸馏', desc: '实时知识迁移' }, { name: '交叉蒸馏', desc: '多模型互相学习' }] },
      { icon: '🎓', title: 'Skill学习', detail: 'AI技能学习框架让模型能够快速掌握新任务，从通用能力向专业能力演进。Skill prompting、Skill library成为重要工具。' }
    ]
  }
])

// AI原理数据
const aiPrinciples = ref([
  { id: 'ml', icon: '🧠', title: '机器学习是什么？', analogy: '像小朋友学习认猫：给很多猫的照片，越看越知道什么是猫。', detail: '机器学习是让计算机从数据中学习规律，而不需要明确编程。它通过训练数据和算法，自动发现模式并做出预测。', funFact: '机器学习算法70%的时间其实在"洗数据"！' },
  { id: 'dl', icon: '🔗', title: '深度学习与神经网络', analogy: '像大脑中的神经元互相连接，层层传递信息，最终做出判断。', detail: '深度学习使用多层神经网络（深度神经网络）来学习数据的层次化特征。每一层都提取更抽象的表示。', funFact: 'GPT-4有约1.8万亿个参数，比人脑神经元还多！' },
  { id: 'llm', icon: '📖', title: '大语言模型(LLM)', analogy: '像读完整个互联网的超强学生，你说上半句它能猜出下半句。', detail: '基于Transformer架构的大规模模型，通过学习海量文本数据掌握语言规律，能够理解、生成和推理。', funFact: '训练GPT-4需要约25000张A100显卡运行100天！' },
  { id: 'agent', icon: '🤖', title: 'AI Agent（智能体）', analogy: '像有个私人助理，不仅能聊天，还会自主规划、调用工具、完成任务。', detail: 'AI Agent是能够感知环境、自主决策并执行行动的智能系统。它可以规划任务步骤、调用API、记忆对话历史。', funFact: '2026年最火的Agent框架可以自动写代码、部署应用！', steps: [{ step: 1, desc: '感知：接收用户指令和环境信息' }, { step: 2, desc: '规划：将大任务拆解成小步骤' }, { step: 3, desc: '执行：调用工具或API完成任务' }, { step: 4, desc: '反馈：从结果中学习优化' }] },
  { id: 'distillation', icon: '🧪', title: '知识蒸馏', analogy: '像老师傅（大模型）把经验浓缩成精华教给徒弟（小模型），徒弟学得快、跑得快。', detail: '知识蒸馏是一种模型压缩技术，让小型模型（学生）学习大型模型（教师）的输出，从而在保持性能的同时大幅减小模型体积。', funFact: '一个好老师模型可以教出很多优秀的学生模型！', steps: [{ step: 1, desc: '教师模型生成软标签（概率分布）' }, { step: 2, desc: '学生模型学习软标签+硬标签' }, { step: 3, desc: '温度参数控制知识迁移的平滑度' }, { step: 4, desc: '学生模型达到接近教师的性能' }] },
  { id: 'skill', icon: '🎯', title: 'Skill学习', analogy: '像学会骑自行车后，再学电动车就很容易——AI也学会了举一反三。', detail: 'Skill学习让AI从已有技能中组合出新的能力，通过迁移学习和元学习实现快速适应新任务。', funFact: '最新的Skill库有超过10000个预训练技能！', steps: [{ step: 1, desc: '基础技能训练' }, { step: 2, desc: '技能组合与泛化' }, { step: 3, desc: '上下文技能调用' }, { step: 4, desc: '持续学习新技能' }] },
  { id: 'inference', icon: '⚡', title: '推理时计算', analogy: '像做数学题时多打草稿就能减少错误，AI也是思考越久答案越准。', detail: '推理时计算让模型在回答前进行多步内部思考，通过思维链和搜索来提升推理质量，尤其在数学、编程等复杂任务上效果显著。', funFact: 'DeepSeek R1的推理过程像"自言自语"，逐步分析问题！' }
])

// 热门开源项目
const hotProjects = ref([
  { name: 'OpenClaw', icon: '🦾', stars: '15.2k', link: 'https://github.com/openclaw', tags: ['机器人', '具身智能', '2026'], desc: '灵巧手操控框架', overview: '实现机器人精细物体抓取和操控的开源项目，支持多种机械臂和夹爪。' },
  { name: 'DeepSeek R1', icon: '🔍', stars: '48.3k', link: 'https://github.com/deepseek-ai/DeepSeek-R1', tags: ['推理模型', '开源', '2026'], desc: '开源推理大模型', overview: '通过强化学习实现推理能力的开源模型，数学和编程能力媲美闭源模型。' },
  { name: 'CrewAI', icon: '👥', stars: '28.7k', link: 'https://github.com/joaomdmoura/crewAI', tags: ['Agent', '多智能体', '2025'], desc: '多Agent协作框架', overview: '让多个AI Agent协作完成复杂任务的框架，支持角色分工和任务编排。' },
  { name: 'LangGraph', icon: '🔗', stars: '22.1k', link: 'https://github.com/langchain-ai/langgraph', tags: ['Agent', '工作流', '2025'], desc: 'Agent工作流编排', overview: '基于图结构的Agent工作流构建工具，支持循环和分支逻辑。' },
  { name: 'Ollama', icon: '🐫', stars: '62.8k', link: 'https://github.com/ollama/ollama', tags: ['本地部署', 'LLM', '2024'], desc: '本地大模型运行', overview: '让你在本地轻松运行Llama、Gemma等开源模型的工具，一键部署。' },
  { name: 'VueTorch', icon: '📊', stars: '8.5k', link: 'https://github.com/vuejs/vue-torch', tags: ['前端', 'AI', '2026'], desc: '前端AI推理框架', overview: '在浏览器中直接运行PyTorch模型的Vue组件库，实现端侧AI。' }
])

const aiPioneers = ref([])
const aiApplications = ref([])
const activePrinciple = ref('ml')
const activeAppCategory = ref('生活')

function openProjectLink(link) {
  window.open(link, '_blank')
}

async function loadKnowledgeData() {
  try {
    const [pioneersRes, appsRes] = await Promise.all([
      axios.get(`${API_BASE}/pioneers`),
      axios.get(`${API_BASE}/applications`)
    ])
    if (pioneersRes.data.success) aiPioneers.value = pioneersRes.data.data
    else {
      aiPioneers.value = [
        { name: '艾伦·图灵', avatar: '🧠', title: '计算机科学之父', quote: '机器能思考吗？' },
        { name: '约翰·麦卡锡', avatar: '💡', title: 'AI之父', quote: '人工智能' },
        { name: '杰弗里·辛顿', avatar: '🔬', title: '深度学习之父', quote: '反向传播' },
        { name: '杨立昆', avatar: '📷', title: '卷积神经网络之父', quote: '让机器像人一样看' },
        { name: '伊利亚·苏茨克韦尔', avatar: '🤖', title: 'OpenAI联合创始人', quote: 'scaling law' }
      ]
    }
    if (appsRes.data.success) aiApplications.value = appsRes.data.data
    else {
      aiApplications.value = [
        { category: '生活', icon: '🏠', items: [{ name: '智能推荐', desc: '抖音、淘宝推荐算法', example: '你看到的内容都是AI专门为你挑选的' }] },
        { category: '医疗', icon: '🏥', items: [{ name: '医学影像诊断', desc: 'AI辅助诊断疾病', example: '识别CT影像中的早期肺癌' }] },
        { category: '交通', icon: '🚗', items: [{ name: '自动驾驶', desc: '无人驾驶技术', example: '特斯拉、Waymo自动驾驶' }] }
      ]
    }
  } catch (e) { console.error('加载知识数据失败:', e) }
}

onMounted(() => {
  loadKnowledgeData()
})
</script>

<style scoped>
.knowledge-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 20px;
}

.knowledge-card {
  border-radius: 15px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-header .icon {
  font-size: 24px;
}

.card-header .title {
  font-size: 18px;
  font-weight: bold;
}

/* 树状时间线 */
.timeline-wrapper {
  max-height: 600px;
  overflow-y: auto;
  padding: 10px;
}

.timeline-tree {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-era {
  border-left: 3px solid #667eea;
  margin-left: 20px;
  padding-left: 20px;
}

.era-year {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 10px 0;
  font-weight: bold;
  font-size: 18px;
  color: #667eea;
}

.year-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
}

.era-icon {
  font-size: 12px;
  color: #999;
}

.era-branches {
  margin-left: 20px;
  padding-bottom: 12px;
}

.branch-item {
  margin: 10px 0;
  background: #f9f9f9;
  border-radius: 10px;
  overflow: hidden;
}

.branch-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  cursor: pointer;
  background: #f0f0f0;
  transition: background 0.2s;
}

.branch-header:hover {
  background: #e8e8e8;
}

.branch-icon {
  font-size: 20px;
}

.branch-title {
  flex: 1;
  font-weight: 500;
}

.branch-expand {
  font-size: 12px;
  color: #999;
}

.branch-detail {
  padding: 15px;
  background: white;
  border-top: 1px solid #e0e0e0;
  line-height: 1.6;
}

.branch-detail p {
  margin: 0 0 10px 0;
}

.sub-branches {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed #ddd;
}

.sub-item {
  margin: 8px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
}

.sub-name {
  font-weight: 600;
  color: #667eea;
}

.sub-desc {
  color: #666;
  font-size: 13px;
}

/* 原理样式 */
.principle-content {
  padding: 10px 0;
  line-height: 1.6;
}

.principle-content .analogy {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 15px;
}

.principle-detail {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 15px;
}

.principle-detail strong {
  display: block;
  margin-bottom: 8px;
  color: #667eea;
}

.principle-detail p {
  margin: 0;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 15px 0;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.step-num {
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.fun-fact {
  background: #fff9c4;
  padding: 15px;
  border-radius: 10px;
  margin-top: 15px;
  color: #f57f17;
}

/* 开源项目样式 */
.open-source-section {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 2px solid #e0e0e0;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: bold;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

.project-card {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #eee;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  border-color: #667eea;
}

.project-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.project-icon {
  font-size: 24px;
}

.project-name {
  font-weight: bold;
  flex: 1;
  font-size: 15px;
}

.project-stars {
  font-size: 12px;
  color: #f39c12;
}

.project-desc {
  font-size: 13px;
  color: #667eea;
  margin-bottom: 8px;
  font-weight: 500;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.project-overview {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}

/* 名人堂样式 */
.pioneers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}

.pioneer-card {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  border-radius: 15px;
}

/* 应用案例样式 */
.app-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.app-item {
  padding: 20px;
  background: #f9f9f9;
  border-radius: 10px;
}

.app-name {
  font-size: 16px;
  font-weight: bold;
}

.app-desc {
  color: #666;
  margin: 5px 0;
}

.app-example {
  color: #667eea;
  font-size: 14px;
}
</style>