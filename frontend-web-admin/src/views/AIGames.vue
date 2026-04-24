<template>
  <div class="games-section">
    <el-card class="game-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="icon">🤔</span>
          <span class="title">图灵测试挑战</span>
        </div>
      </template>
      <div class="turing-game">
        <div v-if="turingState === 'intro'" class="intro">
          <p>1950年，艾伦·图灵提出：如果你和一台机器聊天，分不清对方是人还是机器，那这台机器就算有智能了。</p>
          <p><strong>游戏规则：</strong>你将看到5段对话，判断是人类还是AI写的。猜对3个以上算通关！</p>
          <el-button type="primary" @click="startTuringTest">开始挑战</el-button>
        </div>
        <div v-else-if="turingState === 'playing'" class="playing">
          <div class="round-info">第 {{ turingRound + 1 }} / 5 轮</div>
          <div class="response-box">
            <div class="topic">话题：{{ turingQuestion?.topic }}</div>
            <div class="response">"{{ turingQuestion?.response }}"</div>
          </div>
          <div class="choices">
            <el-button size="large" @click="turingChoice('human')">👤 人类</el-button>
            <el-button size="large" @click="turingChoice('ai')">🤖 AI</el-button>
          </div>
        </div>
        <div v-else-if="turingState === 'result'" class="result">
          <div class="result-icon">{{ turingLastResult ? '✅' : '❌' }}</div>
          <div class="result-text">{{ turingLastResult ? '猜对了！' : '猜错了！' }}</div>
          <div class="answer">正确答案：{{ turingQuestion?.isAI ? 'AI' : '人类' }}</div>
          <el-button type="primary" @click="nextTuringRound">{{ turingRound < 4 ? '下一轮' : '查看结果' }}</el-button>
        </div>
        <div v-else-if="turingState === 'final'" class="final">
          <div class="final-icon">{{ turingCorrect >= 3 ? '🎉' : '💪' }}</div>
          <div class="final-title">{{ turingCorrect >= 3 ? '恭喜通关！' : '继续努力！' }}</div>
          <div class="final-score">你猜对了 {{ turingCorrect }} / 5 轮</div>
          <el-button type="primary" @click="turingState = 'intro'">再玩一次</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const API_BASE = 'http://localhost:3000/api/ai-science'

// 图灵测试
const turingState = ref('intro')
const turingRound = ref(0)
const turingQuestion = ref(null)
const turingQuestions = ref([])
const turingLastResult = ref(false)
const turingCorrect = ref(0)

async function startTuringTest() {
  turingRound.value = 0
  turingCorrect.value = 0
  turingQuestions.value = await generateTuringQuestions()
  turingQuestion.value = turingQuestions.value[0]
  turingState.value = 'playing'
}

async function generateTuringQuestions() {
  const topics = ['今天天气真好', '推荐一部电影', '你觉得学习重要吗', '描述一下你的周末', '你喜欢什么音乐']
  const questions = []
  for (const topic of topics) {
    const isAI = Math.random() > 0.5
    let response
    if (isAI) {
      try {
        const res = await axios.post(`${API_BASE}/turing-test`, { topic })
        response = res.data.success ? res.data.data.reply : getDefaultAIResponse(topic)
      } catch (e) { response = getDefaultAIResponse(topic) }
    } else {
      response = getHumanResponse(topic)
    }
    questions.push({ topic, response, isAI })
  }
  return questions
}

function getDefaultAIResponse(topic) {
  const map = {
    '今天天气真好': '确实，今天阳光明媚，非常适合户外活动。',
    '推荐一部电影': '我推荐《肖申克的救赎》，非常经典的励志电影。',
    '你觉得学习重要吗': '学习非常重要，它能帮助我们获取知识和技能。',
    '描述一下你的周末': '周末是休息和充电的好时机，建议进行一些放松活动。',
    '你喜欢什么音乐': '音乐是美妙的艺术形式，不同类型都有独特魅力。'
  }
  return map[topic] || '这是一个有趣的话题。'
}

function getHumanResponse(topic) {
  const map = {
    '今天天气真好': '是啊！终于不下雨了，打算出去逛逛',
    '推荐一部电影': '最近看了星际穿越，剧情超级烧脑！',
    '你觉得学习重要吗': '重要是重要，但有时候真的好累哈哈',
    '描述一下你的周末': '就是睡觉打游戏啊，偶尔出去吃个饭',
    '你喜欢什么音乐': '啥都听，看心情吧'
  }
  return map[topic] || 'emm这个问题有点难回答'
}

function turingChoice(choice) {
  turingLastResult.value = (choice === 'ai') === turingQuestion.value.isAI
  if (turingLastResult.value) turingCorrect.value++
  turingState.value = 'result'
}

function nextTuringRound() {
  turingRound.value++
  if (turingRound.value >= 5) {
    turingState.value = 'final'
  } else {
    turingQuestion.value = turingQuestions.value[turingRound.value]
    turingState.value = 'playing'
  }
}
</script>

<style scoped>
.games-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 20px;
}

.game-card {
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

/* 图灵测试样式 */
.turing-game {
  text-align: center;
  padding: 30px;
}

.response-box {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding: 30px;
  border-radius: 15px;
  margin-bottom: 30px;
}

.choices {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.intro p {
  margin: 15px 0;
  line-height: 1.6;
}

.round-info {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #667eea;
}

.topic {
  font-size: 14px;
  color: #999;
  margin-bottom: 10px;
}

.response {
  font-size: 18px;
  line-height: 1.5;
}

.result-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.result-text {
  font-size: 24px;
  margin-bottom: 10px;
}

.answer {
  color: #666;
  margin-bottom: 20px;
}

.final-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.final-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
}

.final-score {
  font-size: 18px;
  color: #666;
  margin-bottom: 20px;
}
</style>