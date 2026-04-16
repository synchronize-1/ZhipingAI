<template>
  <view class="turing-container">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <text class="nav-back" @click="goBack">←</text>
      <text class="nav-title">🤔 图灵测试挑战</text>
    </view>

    <!-- 游戏说明 -->
    <view class="intro-section" v-if="gameState === 'intro'">
      <text class="intro-icon">🎮</text>
      <text class="intro-title">什么是图灵测试？</text>
      <text class="intro-text">1950年，艾伦·图灵提出：如果你和一台机器聊天，分不清对方是人还是机器，那这台机器就算有智能了。</text>
      <text class="intro-subtitle">游戏规则</text>
      <text class="intro-text">你将看到5段对话，每段对话来自"人类"或"AI"。你需要判断哪个是AI写的。猜对3个以上算通关！</text>
      <view class="start-btn" @click="startGame">开始挑战</view>
    </view>

    <!-- 游戏进行中 -->
    <view class="game-section" v-if="gameState === 'playing'">
      <view class="progress-bar">
        <text class="progress-text">第 {{ currentRound + 1 }} / {{ totalRounds }} 轮</text>
        <view class="progress-dots">
          <view 
            v-for="i in totalRounds" 
            :key="i"
            :class="['dot', { done: i <= currentRound, correct: results[i-1] === true, wrong: results[i-1] === false }]"
          ></view>
        </view>
      </view>

      <view class="question-card">
        <text class="question-label">话题：{{ currentQuestion.topic }}</text>
        <view class="response-box">
          <text class="response-text">"{{ currentQuestion.response }}"</text>
        </view>
        <text class="question-prompt">这段话是谁写的？</text>
      </view>

      <view class="choice-buttons">
        <view class="choice-btn human" @click="makeChoice('human')">
          <text class="choice-icon">👤</text>
          <text class="choice-text">人类</text>
        </view>
        <view class="choice-btn ai" @click="makeChoice('ai')">
          <text class="choice-icon">🤖</text>
          <text class="choice-text">AI</text>
        </view>
      </view>
    </view>

    <!-- 单轮结果 -->
    <view class="result-section" v-if="gameState === 'result'">
      <text class="result-icon">{{ lastResult ? '✅' : '❌' }}</text>
      <text class="result-title">{{ lastResult ? '猜对了！' : '猜错了！' }}</text>
      <text class="result-answer">正确答案：{{ currentQuestion.isAI ? 'AI' : '人类' }}</text>
      <text class="result-explanation">{{ currentQuestion.explanation }}</text>
      <view class="next-btn" @click="nextRound">{{ currentRound < totalRounds ? '下一轮' : '查看结果' }}</view>
    </view>

    <!-- 最终结果 -->
    <view class="final-section" v-if="gameState === 'final'">
      <text class="final-icon">{{ correctCount >= 3 ? '🎉' : '💪' }}</text>
      <text class="final-title">{{ correctCount >= 3 ? '恭喜通关！' : '继续努力！' }}</text>
      <text class="final-score">你猜对了 {{ correctCount }} / {{ totalRounds }} 轮</text>
      <text class="final-message">{{ correctCount >= 3 ? '你很擅长分辨人类和AI！' : 'AI越来越聪明了，再试一次吧！' }}</text>
      <view class="science-box">
        <text class="science-title">💡 你学到了什么？</text>
        <text class="science-text">图灵测试告诉我们：判断机器是否有智能，关键是看它能否表现得像人类一样。但随着AI越来越强，这个测试也变得越来越难了！</text>
      </view>
      <view class="action-buttons">
        <view class="action-btn" @click="startGame">再玩一次</view>
        <view class="action-btn secondary" @click="goBack">返回</view>
      </view>
    </view>
  </view>
</template>

<script>
import { apiRequest } from '@/utils/api.js'

export default {
  data() {
    return {
      gameState: 'intro', // intro, playing, result, final
      currentRound: 0,
      totalRounds: 5,
      currentQuestion: null,
      results: [],
      lastResult: false,
      correctCount: 0,
      questions: []
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    async startGame() {
      this.currentRound = 0
      this.results = []
      this.correctCount = 0
      await this.generateQuestions()
      this.loadQuestion()
      this.gameState = 'playing'
    },
    async generateQuestions() {
      // 预定义的问题库
      const topics = [
        '今天天气真好',
        '推荐一部电影',
        '你觉得学习重要吗',
        '描述一下你的周末',
        '你喜欢什么音乐'
      ]
      
      this.questions = []
      
      for (let i = 0; i < this.totalRounds; i++) {
        const topic = topics[i]
        const isAI = Math.random() > 0.5
        
        let response, explanation
        
        if (isAI) {
          // AI生成的回复
          try {
            const res = await apiRequest('/ai-science/turing-test', 'POST', { topic })
            response = res.success ? res.data.reply : this.getDefaultAIResponse(topic)
          } catch (e) {
            response = this.getDefaultAIResponse(topic)
          }
          explanation = '这是AI写的。AI的回复通常很完整、很正式，有时候会显得"太完美"。'
        } else {
          // 模拟人类回复
          response = this.getHumanResponse(topic)
          explanation = '这是人类写的。人类的回复更随意、口语化，可能有错别字或不完整的句子。'
        }
        
        this.questions.push({ topic, response, isAI, explanation })
      }
    },
    getDefaultAIResponse(topic) {
      const responses = {
        '今天天气真好': '确实，今天阳光明媚，万里无云，非常适合户外活动。建议您可以去公园散步或者进行一些户外运动。',
        '推荐一部电影': '我推荐《肖申克的救赎》，这是一部经典的励志电影，讲述了希望和坚持的力量，非常值得一看。',
        '你觉得学习重要吗': '学习非常重要。它不仅能够帮助我们获取知识和技能，还能培养我们的思维能力和解决问题的能力。终身学习是成功的关键。',
        '描述一下你的周末': '周末是休息和充电的好时机。我建议您可以进行一些放松活动，如阅读、运动或与家人朋友相聚。',
        '你喜欢什么音乐': '音乐是一种美妙的艺术形式。不同类型的音乐都有其独特的魅力，比如古典音乐优雅，流行音乐动感，爵士乐富有即兴创意。'
      }
      return responses[topic] || '这是一个很有意思的话题，我很乐意与您讨论。'
    },
    getHumanResponse(topic) {
      const responses = {
        '今天天气真好': '是啊！终于不下雨了，我打算出去逛逛',
        '推荐一部电影': '最近看了个很好看的，叫啥来着...对了，是星际穿越！剧情超级烧脑',
        '你觉得学习重要吗': '重要是重要，但有时候真的好累啊哈哈',
        '描述一下你的周末': '周末就是睡觉打游戏啊还能干啥，偶尔出去吃个饭',
        '你喜欢什么音乐': '我啥都听，看心情吧，最近比较喜欢听说唱'
      }
      return responses[topic] || 'emm这个问题有点难回答哈哈'
    },
    loadQuestion() {
      this.currentQuestion = this.questions[this.currentRound]
    },
    makeChoice(choice) {
      const isCorrect = (choice === 'ai') === this.currentQuestion.isAI
      this.lastResult = isCorrect
      this.results.push(isCorrect)
      if (isCorrect) this.correctCount++
      this.gameState = 'result'
    },
    nextRound() {
      this.currentRound++
      if (this.currentRound >= this.totalRounds) {
        this.gameState = 'final'
      } else {
        this.loadQuestion()
        this.gameState = 'playing'
      }
    }
  }
}
</script>

<style scoped>
.turing-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.nav-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: transparent;
  padding-top: calc(20rpx + env(safe-area-inset-top));
}

.nav-back {
  font-size: 40rpx;
  color: #fff;
  padding: 10rpx 20rpx;
}

.nav-title {
  flex: 1;
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  text-align: center;
  margin-right: 60rpx;
}

/* 介绍页 */
.intro-section {
  padding: 60rpx 40rpx;
  text-align: center;
}

.intro-icon {
  font-size: 100rpx;
  display: block;
}

.intro-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-top: 30rpx;
}

.intro-subtitle {
  font-size: 32rpx;
  font-weight: bold;
  color: #667eea;
  display: block;
  margin-top: 40rpx;
}

.intro-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  display: block;
  margin-top: 20rpx;
  line-height: 1.8;
}

.start-btn {
  margin-top: 60rpx;
  padding: 30rpx 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
  display: inline-block;
}

/* 游戏页 */
.game-section {
  padding: 30rpx;
}

.progress-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.progress-text {
  font-size: 28rpx;
  color: #fff;
}

.progress-dots {
  display: flex;
  gap: 15rpx;
}

.dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
}

.dot.done {
  background: #667eea;
}

.dot.correct {
  background: #4caf50;
}

.dot.wrong {
  background: #f44336;
}

.question-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 40rpx;
  border-radius: 30rpx;
  backdrop-filter: blur(10px);
}

.question-label {
  font-size: 26rpx;
  color: #667eea;
  display: block;
  margin-bottom: 20rpx;
}

.response-box {
  background: rgba(255, 255, 255, 0.05);
  padding: 30rpx;
  border-radius: 20rpx;
  border-left: 4rpx solid #667eea;
}

.response-text {
  font-size: 30rpx;
  color: #fff;
  line-height: 1.8;
}

.question-prompt {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  display: block;
  margin-top: 30rpx;
  text-align: center;
}

.choice-buttons {
  display: flex;
  gap: 30rpx;
  margin-top: 40rpx;
}

.choice-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.1);
}

.choice-btn.human {
  border: 3rpx solid #4facfe;
}

.choice-btn.ai {
  border: 3rpx solid #f5576c;
}

.choice-icon {
  font-size: 60rpx;
}

.choice-text {
  font-size: 28rpx;
  color: #fff;
  margin-top: 15rpx;
}

/* 结果页 */
.result-section, .final-section {
  padding: 60rpx 40rpx;
  text-align: center;
}

.result-icon, .final-icon {
  font-size: 100rpx;
  display: block;
}

.result-title, .final-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-top: 30rpx;
}

.result-answer {
  font-size: 28rpx;
  color: #667eea;
  display: block;
  margin-top: 20rpx;
}

.result-explanation {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  margin-top: 30rpx;
  line-height: 1.8;
  padding: 0 20rpx;
}

.next-btn, .action-btn {
  margin-top: 40rpx;
  padding: 25rpx 60rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 50rpx;
  font-size: 30rpx;
  display: inline-block;
}

.final-score {
  font-size: 36rpx;
  color: #667eea;
  display: block;
  margin-top: 20rpx;
}

.final-message {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  display: block;
  margin-top: 15rpx;
}

.science-box {
  background: rgba(102, 126, 234, 0.2);
  padding: 30rpx;
  border-radius: 20rpx;
  margin-top: 40rpx;
  text-align: left;
}

.science-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #667eea;
  display: block;
  margin-bottom: 15rpx;
}

.science-text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.8;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 30rpx;
  margin-top: 40rpx;
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 2rpx solid rgba(255, 255, 255, 0.3);
}
</style>
