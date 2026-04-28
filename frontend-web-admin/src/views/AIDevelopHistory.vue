<template>
  <div class="ai-develop-history">
    <!-- 名人故事区域 -->
    <div class="pioneers-section">
      <h2 class="section-title">
        <span class="title-icon">🌟</span>
        AI先驱与传奇人物
      </h2>
      <div class="pioneers-grid">
        <div
            v-for="pioneer in pioneers"
            :key="pioneer.name"
            class="pioneer-card"
            :class="{ expanded: expandedPioneer === pioneer.name }"
            @click="togglePioneer(pioneer.name)"
        >
          <div class="pioneer-avatar">
            <img :src="pioneer.avatar" :alt="pioneer.name" @error="handleImageError(pioneer, $event)" />
          </div>
          <div class="pioneer-name" @click.stop="openWiki(pioneer.wikiLink)">
            {{ pioneer.name }}
            <el-icon class="link-icon"><Link /></el-icon>
          </div>
          <div class="pioneer-quote">"{{ pioneer.quote }}"</div>
          <div class="pioneer-title">{{ pioneer.title }}</div>
          <div class="pioneer-story" v-if="expandedPioneer === pioneer.name">
            <div class="story-content">{{ pioneer.story }}</div>
            <div class="story-more" @click.stop="openWiki(pioneer.wikiLink)">
              了解更多 →
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI发展历史时间轴 -->
    <div class="history-section">
      <h2 class="section-title">
        <span class="title-icon">📅</span>
        AI发展时间轴
      </h2>
      <div class="timeline-container">
        <div class="timeline-wrapper">
          <div v-for="(event, index) in timelineEvents" :key="event.year" class="timeline-item" :class="{ left: index % 2 === 0, right: index % 2 === 1 }">
            <div class="timeline-marker">
              <div class="marker-dot"></div>
              <div class="marker-line"></div>
            </div>
            <div class="timeline-content">
              <div class="timeline-year">{{ event.year }}</div>
              <div class="timeline-title">{{ event.title }}</div>
              <div class="timeline-desc">{{ event.description }}</div>
              <div v-if="event.branches && event.branches.length" class="timeline-branches">
                <div v-for="branch in event.branches" :key="branch.name" class="branch-tag">
                  <span class="branch-icon">{{ branch.icon }}</span>
                  <span class="branch-name">{{ branch.name }}</span>
                </div>
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
import { ElMessage } from 'element-plus'
import { Link } from '@element-plus/icons-vue'

const expandedPioneer = ref(null)

// 点击卡片切换展开/收起
const togglePioneer = (name) => {
  expandedPioneer.value = expandedPioneer.value === name ? null : name
}

const openWiki = (link) => {
  if (link) {
    window.open(link, '_blank')
  } else {
    ElMessage.info('百科链接待补充')
  }
}

// 图片加载失败时的备用处理
const handleImageError = (pioneer, event) => {
  // 如果图片加载失败，显示默认图标
  event.target.style.display = 'none'
  event.target.parentElement.innerHTML = '<span class="avatar-emoji">👤</span>'
}

// 名人数据 - 使用本地图片路径
const pioneers = ref([
  {
    name: '艾伦·图灵',
    avatar: new URL('../../resources/tuling.png', import.meta.url).href,
    quote: '机器能思考吗？',
    title: '计算机科学之父 | 图灵奖命名者',
    wikiLink: 'https://baike.baidu.com/item/%E8%89%BE%E4%BC%A6%C2%B7%E5%9B%BE%E7%81%B5',
    story: '艾伦·图灵（1912-1954）是英国数学家、逻辑学家、密码学家，被誉为"计算机科学之父"和"人工智能之父"。他在二战期间成功破译德国Enigma密码，为盟军胜利做出巨大贡献。他提出的"图灵测试"至今仍是判断机器智能的重要标准。'
  },
  {
    name: '约翰·麦卡锡',
    avatar: new URL('../../resources/John.png', import.meta.url).href,
    quote: '人工智能是一门科学，目标是让机器做人类智能能做的事。',
    title: '人工智能学科奠基人',
    wikiLink: 'https://baike.baidu.com/item/%E7%BA%A6%E7%BF%B0%C2%B7%E9%BA%A6%E5%8D%A1%E9%94%A1/858197',
    story: '约翰·麦卡锡（1927-2011）是美国计算机科学家，1956年达特茅斯会议上首次提出"人工智能"术语，被誉为"人工智能之父"。他发明了Lisp编程语言，对人工智能发展产生了深远影响。'
  },
  {
    name: '马文·明斯基',
    avatar: new URL('../../resources/Marwen.png', import.meta.url).href,
    quote: '大脑是肉做的机器。',
    title: '人工智能先驱 | 框架理论提出者',
    wikiLink: 'https://baike.baidu.com/item/%E9%A9%AC%E6%96%87%C2%B7%E6%98%8E%E6%96%AF%E5%9F%BA',
    story: '马文·明斯基（1927-2016）是麻省理工学院教授，人工智能实验室联合创始人。他研究神经网络、机器人学，创立了"框架理论"，对认知科学影响深远。'
  },
  {
    name: '杰弗里·辛顿',
    avatar: new URL('../../resources/Hitun.png', import.meta.url).href,
    quote: '深度学习将像电一样改变世界。',
    title: '深度学习之父 | 图灵奖得主',
    wikiLink: 'https://baike.baidu.com/item/%E6%9D%B0%E5%BC%97%E9%87%8C%C2%B7%E8%BE%9B%E9%A1%BF',
    story: '杰弗里·辛顿（1947-）是加拿大计算机科学家，被誉为"深度学习之父"。他在神经网络领域取得了突破性成就，推动了AlexNet等深度学习模型的发展，2018年获图灵奖。'
  },
  {
    name: '杨立昆',
    avatar: new URL('../../resources/likun.png', import.meta.url).href,
    quote: '让机器像人一样看世界。',
    title: '卷积神经网络之父 | Meta首席AI科学家',
    wikiLink: 'https://baike.baidu.com/item/%E6%9D%A8%E7%AB%8B%E6%98%86',
    story: '杨立昆（1960-）是法国计算机科学家，LeNet发明者，现代卷积神经网络奠基人。现任Meta首席AI科学家，致力于推动AI技术的发展。'
  },
  {
    name: '吴恩达',
    avatar: new URL('../../resources/andrew.webp', import.meta.url).href,
    quote: 'AI是新的电力。',
    title: 'Coursera联合创始人 | 百度前首席科学家',
    wikiLink: 'https://baike.baidu.com/item/%E5%90%B4%E6%81%A9%E8%BE%BE',
    story: '吴恩达（1976-）是华裔美国计算机科学家，前百度首席科学家，Coursera联合创始人。他主讲的机器学习课程是全球最受欢迎的AI课程之一。'
  }
])

// 时间轴事件数据
const timelineEvents = ref([
  {
    year: '1950',
    title: '图灵测试提出',
    description: '艾伦·图灵在论文《计算机器与智能》中提出"机器能思考吗？"的问题，设计了图灵测试来判断机器是否具有智能。',
    branches: [
      { name: '智能标准', icon: '🎯' }
    ]
  },
  {
    year: '1956',
    title: '达特茅斯会议',
    description: '麦卡锡、明斯基等人在达特茅斯学院召开会议，正式提出"人工智能"术语，标志着AI作为独立学科的诞生。',
    branches: [
      { name: '学科诞生', icon: '🎓' }
    ]
  },
  {
    year: '1966',
    title: 'ELIZA问世',
    description: 'MIT的Joseph Weizenbaum开发了ELIZA，第一个聊天机器人，模拟心理咨询师的对话模式。',
    branches: [
      { name: '聊天机器人', icon: '💬' }
    ]
  },
  {
    year: '1973',
    title: '第一次AI寒冬',
    description: '由于AI系统无法处理实际问题，政府削减资金支持，AI研究进入低谷期。',
    branches: [
      { name: '寒冬', icon: '❄️' }
    ]
  },
  {
    year: '1980',
    title: '专家系统崛起',
    description: '利用专家知识规则构建的专家系统在工业领域取得商业成功，如XCON系统。',
    branches: [
      { name: '知识工程', icon: '📚' }
    ]
  },
  {
    year: '1987',
    title: '第二次AI寒冬',
    description: '专家系统维护成本过高，苹果和IBM的PC崛起，AI再次陷入低谷。',
    branches: [
      { name: '寒冬再临', icon: '❄️' }
    ]
  },
  {
    year: '1997',
    title: '深蓝战胜卡斯帕罗夫',
    description: 'IBM的超级计算机"深蓝"以3.5:2.5战胜国际象棋世界冠军卡斯帕罗夫，AI首次在智力竞技中战胜人类。',
    branches: [
      { name: '人机对战', icon: '♟️' }
    ]
  },
  {
    year: '2006',
    title: '深度学习革命',
    description: '辛顿发表深度信念网络论文，正式提出"深度学习"概念，开启神经网络复兴之路。',
    branches: [
      { name: '深度学习', icon: '🧬' }
    ]
  },
  {
    year: '2012',
    title: 'AlexNet引爆深度学习',
    description: 'AlexNet在ImageNet竞赛中以压倒性优势夺冠，CNN成为图像识别标准，GPU计算成为主流。',
    branches: [
      { name: '图像识别', icon: '📷' },
      { name: 'GPU计算', icon: '⚡' }
    ]
  },
  {
    year: '2016',
    title: 'AlphaGo战胜李世石',
    description: 'DeepMind的AlphaGo以4:1战胜围棋世界冠军李世石，展示了强化学习的强大能力。',
    branches: [
      { name: '强化学习', icon: '🎮' }
    ]
  },
  {
    year: '2017',
    title: 'Transformer架构发布',
    description: 'Google发布论文《Attention Is All You Need》，Transformer架构成为大语言模型的基础。',
    branches: [
      { name: 'Transformer', icon: '🔗' },
      { name: '注意力机制', icon: '👁️' }
    ]
  },
  {
    year: '2018',
    title: 'BERT & GPT-1',
    description: 'Google发布BERT，OpenAI发布GPT-1，预训练大语言模型成为NLP新范式。',
    branches: [
      { name: '预训练模型', icon: '📖' }
    ]
  },
  {
    year: '2022',
    title: 'ChatGPT引爆全球',
    description: 'OpenAI发布ChatGPT，5天内用户突破百万，成为史上增长最快的消费级应用。',
    branches: [
      { name: '大语言模型', icon: '💬' },
      { name: 'AIGC', icon: '🎨' }
    ]
  },
  {
    year: '2023',
    title: 'GPT-4 & 多模态革命',
    description: 'OpenAI推出GPT-4，支持图文多模态输入；Midjourney、Stable Diffusion让AI绘画爆发。',
    branches: [
      { name: '多模态', icon: '🌈' }
    ]
  },
  {
    year: '2024',
    title: 'AI Agent元年',
    description: 'AutoGPT、CrewAI等框架涌现，AI能够自主规划执行任务，具身智能加速发展。',
    branches: [
      { name: 'AI Agent', icon: '🤖' },
      { name: '具身智能', icon: '🦾' }
    ]
  },
  {
    year: '2025',
    title: '推理模型突破',
    description: 'DeepSeek R1、o1等推理模型发布，AI开始具备深度思考能力，数学编程达专家水平。',
    branches: [
      { name: '推理模型', icon: '⚡' }
    ]
  },
  {
    year: '2026',
    title: 'OpenClaw & 世界模型',
    description: '机器人精细操控框架成熟，世界模型推动具身智能落地，AI迈向物理世界。',
    branches: [
      { name: '具身智能', icon: '🦾' },
      { name: '世界模型', icon: '🌍' }
    ]
  }
])
</script>

<style scoped>
.ai-develop-history {
  width: 100%;
}

/* 名人区域样式 */
.pioneers-section {
  margin-bottom: 50px;
}

.section-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 24px;
  padding-left: 12px;
  border-left: 4px solid #667eea;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 24px;
}

.pioneers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.pioneer-card {
  background: linear-gradient(135deg, #fff 0%, #f8f9fc 100%);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid transparent;
}

.pioneer-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

.pioneer-card.expanded {
  background: linear-gradient(135deg, #f0f4ff 0%, #e8edfd 100%);
  border-color: #667eea;
}

.pioneer-avatar {
  width: 100px;
  height: 100px;
  margin: 0 auto 16px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pioneer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pioneer-avatar .avatar-emoji {
  font-size: 48px;
  color: white;
}

.pioneer-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
}

.pioneer-name:hover {
  color: #667eea;
}

.link-icon {
  font-size: 14px;
  opacity: 0.6;
}

.pioneer-quote {
  font-size: 14px;
  color: #667eea;
  font-style: italic;
  margin-bottom: 8px;
  padding: 0 8px;
}

.pioneer-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}

.pioneer-story {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
  text-align: left;
}

.story-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
}

.story-more {
  font-size: 12px;
  color: #667eea;
  cursor: pointer;
  text-align: right;
}

.story-more:hover {
  text-decoration: underline;
}

/* 时间轴样式 */
.history-section {
  margin-top: 40px;
}

.timeline-container {
  padding: 20px 0;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
  border-radius: 20px;
  overflow-x: auto;
}

.timeline-wrapper {
  position: relative;
  min-width: 800px;
  padding: 20px 40px;
}

.timeline-wrapper::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2, #667eea);
  transform: translateY(-50%);
  border-radius: 2px;
}

.timeline-item {
  position: relative;
  width: 50%;
  margin-bottom: 40px;
  display: flex;
}

.timeline-item.left {
  left: 0;
  justify-content: flex-end;
  padding-right: 40px;
}

.timeline-item.right {
  left: 50%;
  justify-content: flex-start;
  padding-left: 40px;
}

.timeline-marker {
  position: absolute;
  top: 0;
  width: 20px;
  height: 100%;
}

.timeline-item.left .timeline-marker {
  right: -10px;
}

.timeline-item.right .timeline-marker {
  left: -10px;
}

.marker-dot {
  width: 20px;
  height: 20px;
  background: #fff;
  border: 3px solid #667eea;
  border-radius: 50%;
  position: absolute;
  top: 0;
  z-index: 2;
}

.marker-line {
  position: absolute;
  top: 20px;
  bottom: -40px;
  width: 2px;
  background: #d0d7de;
  left: 9px;
}

.timeline-item:last-child .marker-line {
  display: none;
}

.timeline-content {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
  width: 100%;
  border-left: 3px solid #667eea;
}

.timeline-item.right .timeline-content {
  border-left: 3px solid #667eea;
  border-right: none;
}

.timeline-item.left .timeline-content {
  border-left: none;
  border-right: 3px solid #667eea;
}

.timeline-content:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
}

.timeline-year {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 6px;
}

.timeline-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.timeline-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 10px;
}

.timeline-branches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.branch-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f0f2f5;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  color: #667eea;
}

.branch-icon {
  font-size: 12px;
}

.branch-name {
  font-size: 11px;
}

/* 响应式 */
@media (max-width: 768px) {
  .pioneers-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }

  .timeline-container {
    overflow-x: auto;
  }

  .timeline-wrapper {
    min-width: 650px;
  }
}
</style>