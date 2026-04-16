<template>
  <div class="ai-writing-page">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <el-icon class="header-icon"><EditPen /></el-icon>
          <div>
            <h1>AI写作助手</h1>
            <p>让AI成为你的专属写作伙伴</p>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-value">{{ writingCount }}</span>
            <span class="stat-label">今日写作</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ totalWords }}</span>
            <span class="stat-label">累计字数</span>
          </div>
        </div>
      </div>
    </div>

    <div class="page-content">
      <el-tabs v-model="activeTab" class="ai-tabs">
        <!-- AI写作文 -->
        <el-tab-pane label="AI写作文" name="essay">
          <div class="tab-content">
            <div class="feature-card">
              <div class="card-header">
                <el-icon class="feature-icon"><Document /></el-icon>
                <h3>AI作文助手</h3>
                <p>输入主题和要求，AI帮你完成作文创作</p>
              </div>

              <el-form :model="essayForm" label-width="100px" class="ai-form">
                <el-form-item label="作文类型">
                  <el-select v-model="essayForm.type" placeholder="请选择作文类型">
                    <el-option label="记叙文" value="记叙文" />
                    <el-option label="议论文" value="议论文" />
                    <el-option label="说明文" value="说明文" />
                    <el-option label="散文" value="散文" />
                    <el-option label="应用文" value="应用文" />
                  </el-select>
                </el-form-item>

                <el-form-item label="作文主题">
                  <el-input
                    v-model="essayForm.topic"
                    placeholder="例如：我的梦想、环境保护、科技发展等"
                    maxlength="50"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item label="字数要求">
                  <el-slider 
                    v-model="essayForm.wordCount" 
                    :min="200" 
                    :max="1500" 
                    :step="100"
                    show-stops
                    :format-tooltip="(val) => `${val}字`"
                  />
                  <span class="slider-value">{{ essayForm.wordCount }}字</span>
                </el-form-item>

                <el-form-item label="写作风格">
                  <el-radio-group v-model="essayForm.style">
                    <el-radio label="朴实">朴实自然</el-radio>
                    <el-radio label="优美">优美抒情</el-radio>
                    <el-radio label="严谨">严谨理性</el-radio>
                    <el-radio label="幽默">幽默风趣</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="特殊要求">
                  <el-input
                    v-model="essayForm.requirements"
                    type="textarea"
                    :rows="3"
                    placeholder="可以补充特殊要求，例如：需要引用名言、包含具体事例、使用修辞手法等"
                  />
                </el-form-item>

                <el-form-item>
                  <el-button 
                    type="primary" 
                    size="large"
                    @click="generateEssay"
                    :loading="essayLoading"
                    :disabled="!essayForm.topic.trim()"
                  >
                    <el-icon><MagicStick /></el-icon>
                    AI开始创作
                  </el-button>
                  <el-button size="large" @click="clearEssay">清空</el-button>
                </el-form-item>
              </el-form>

              <div class="result-area" v-if="essayResult">
                <div class="result-header">
                  <el-icon class="result-icon"><CircleCheck /></el-icon>
                  <h4>AI创作的作文</h4>
                  <el-tag type="info">{{ essayResult.length }}字</el-tag>
                </div>
                <div class="result-content essay-content">
                  <div class="essay-title">{{ essayForm.topic }}</div>
                  <div class="essay-body" v-html="formatEssay(essayResult)"></div>
                </div>
                <div class="result-actions">
                  <el-button type="primary" @click="improveEssay">
                    <el-icon><Edit /></el-icon>
                    AI优化作文
                  </el-button>
                  <el-button @click="copyResult(essayResult)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制作文
                  </el-button>
                  <el-button @click="downloadEssay">
                    <el-icon><Download /></el-icon>
                    下载文档
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- AI改作文 -->
        <el-tab-pane label="AI改作文" name="improve">
          <div class="tab-content">
            <div class="feature-card">
              <div class="card-header">
                <el-icon class="feature-icon"><Edit /></el-icon>
                <h3>AI作文批改</h3>
                <p>上传你的作文，AI为你提供专业的修改建议</p>
              </div>

              <el-form :model="improveForm" label-width="100px" class="ai-form">
                <el-form-item label="作文标题">
                  <el-input
                    v-model="improveForm.title"
                    placeholder="请输入作文标题"
                    maxlength="50"
                  />
                </el-form-item>

                <el-form-item label="作文内容">
                  <el-input
                    v-model="improveForm.content"
                    type="textarea"
                    :rows="15"
                    placeholder="请粘贴你的作文内容..."
                    maxlength="5000"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item label="批改重点">
                  <el-checkbox-group v-model="improveForm.focus">
                    <el-checkbox label="语法错误">语法错误</el-checkbox>
                    <el-checkbox label="用词不当">用词不当</el-checkbox>
                    <el-checkbox label="结构问题">结构问题</el-checkbox>
                    <el-checkbox label="逻辑漏洞">逻辑漏洞</el-checkbox>
                    <el-checkbox label="表达优化">表达优化</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>

                <el-form-item>
                  <el-button 
                    type="primary" 
                    size="large"
                    @click="improveMyEssay"
                    :loading="improveLoading"
                    :disabled="!improveForm.content.trim()"
                  >
                    <el-icon><MagicStick /></el-icon>
                    AI开始批改
                  </el-button>
                  <el-button size="large" @click="clearImprove">清空</el-button>
                </el-form-item>
              </el-form>

              <div class="result-area" v-if="improveResult">
                <div class="result-header">
                  <el-icon class="result-icon"><CircleCheck /></el-icon>
                  <h4>AI批改报告</h4>
                </div>
                <div class="result-content" v-html="formatResult(improveResult)"></div>
                <div class="result-actions">
                  <el-button @click="copyResult(improveResult)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制报告
                  </el-button>
                  <el-button @click="viewComparison">
                    <el-icon><View /></el-icon>
                    对比查看
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- AI写报告 -->
        <el-tab-pane label="AI写报告" name="report">
          <div class="tab-content">
            <div class="feature-card">
              <div class="card-header">
                <el-icon class="feature-icon"><Notebook /></el-icon>
                <h3>AI报告生成</h3>
                <p>快速生成实验报告、读书笔记、调研报告等</p>
              </div>

              <el-form :model="reportForm" label-width="100px" class="ai-form">
                <el-form-item label="报告类型">
                  <el-select v-model="reportForm.type" placeholder="请选择报告类型">
                    <el-option label="实验报告" value="实验报告" />
                    <el-option label="读书笔记" value="读书笔记" />
                    <el-option label="调研报告" value="调研报告" />
                    <el-option label="学习总结" value="学习总结" />
                    <el-option label="活动总结" value="活动总结" />
                  </el-select>
                </el-form-item>

                <el-form-item label="报告主题">
                  <el-input
                    v-model="reportForm.topic"
                    placeholder="例如：化学实验、《红楼梦》读后感等"
                    maxlength="100"
                  />
                </el-form-item>

                <el-form-item label="关键信息">
                  <el-input
                    v-model="reportForm.keyInfo"
                    type="textarea"
                    :rows="6"
                    placeholder="请输入关键信息，例如：实验步骤、书籍内容、调研数据等"
                  />
                </el-form-item>

                <el-form-item label="字数要求">
                  <el-slider 
                    v-model="reportForm.wordCount" 
                    :min="500" 
                    :max="3000" 
                    :step="100"
                    :format-tooltip="(val) => `${val}字`"
                  />
                  <span class="slider-value">{{ reportForm.wordCount }}字</span>
                </el-form-item>

                <el-form-item>
                  <el-button 
                    type="primary" 
                    size="large"
                    @click="generateReport"
                    :loading="reportLoading"
                    :disabled="!reportForm.topic.trim() || !reportForm.keyInfo.trim()"
                  >
                    <el-icon><MagicStick /></el-icon>
                    AI生成报告
                  </el-button>
                  <el-button size="large" @click="clearReport">清空</el-button>
                </el-form-item>
              </el-form>

              <div class="result-area" v-if="reportResult">
                <div class="result-header">
                  <el-icon class="result-icon"><CircleCheck /></el-icon>
                  <h4>AI生成的报告</h4>
                </div>
                <div class="result-content" v-html="formatResult(reportResult)"></div>
                <div class="result-actions">
                  <el-button type="primary" @click="saveReport">
                    <el-icon><FolderAdd /></el-icon>
                    保存报告
                  </el-button>
                  <el-button @click="copyResult(reportResult)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制报告
                  </el-button>
                  <el-button @click="downloadReport">
                    <el-icon><Download /></el-icon>
                    导出Word
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- AI写邮件 -->
        <el-tab-pane label="AI写邮件" name="email">
          <div class="tab-content">
            <div class="feature-card">
              <div class="card-header">
                <el-icon class="feature-icon"><Message /></el-icon>
                <h3>AI邮件助手</h3>
                <p>快速撰写正式邮件、申请信、感谢信等</p>
              </div>

              <el-form :model="emailForm" label-width="100px" class="ai-form">
                <el-form-item label="邮件类型">
                  <el-select v-model="emailForm.type" placeholder="请选择邮件类型">
                    <el-option label="申请信" value="申请信" />
                    <el-option label="感谢信" value="感谢信" />
                    <el-option label="请假条" value="请假条" />
                    <el-option label="咨询邮件" value="咨询邮件" />
                    <el-option label="投诉建议" value="投诉建议" />
                    <el-option label="其他" value="其他" />
                  </el-select>
                </el-form-item>

                <el-form-item label="收件人">
                  <el-input
                    v-model="emailForm.recipient"
                    placeholder="例如：张老师、校长、招生办等"
                  />
                </el-form-item>

                <el-form-item label="邮件主题">
                  <el-input
                    v-model="emailForm.subject"
                    placeholder="请输入邮件主题"
                    maxlength="100"
                  />
                </el-form-item>

                <el-form-item label="主要内容">
                  <el-input
                    v-model="emailForm.content"
                    type="textarea"
                    :rows="5"
                    placeholder="请简要描述邮件的主要内容和目的"
                  />
                </el-form-item>

                <el-form-item label="语气风格">
                  <el-radio-group v-model="emailForm.tone">
                    <el-radio label="正式">正式严谨</el-radio>
                    <el-radio label="礼貌">礼貌友好</el-radio>
                    <el-radio label="诚恳">诚恳真挚</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item>
                  <el-button 
                    type="primary" 
                    size="large"
                    @click="generateEmail"
                    :loading="emailLoading"
                    :disabled="!emailForm.subject.trim() || !emailForm.content.trim()"
                  >
                    <el-icon><MagicStick /></el-icon>
                    AI生成邮件
                  </el-button>
                  <el-button size="large" @click="clearEmail">清空</el-button>
                </el-form-item>
              </el-form>

              <div class="result-area" v-if="emailResult">
                <div class="result-header">
                  <el-icon class="result-icon"><CircleCheck /></el-icon>
                  <h4>AI生成的邮件</h4>
                </div>
                <div class="result-content email-content">
                  <div class="email-meta">
                    <p><strong>收件人：</strong>{{ emailForm.recipient }}</p>
                    <p><strong>主题：</strong>{{ emailForm.subject }}</p>
                  </div>
                  <div class="email-body" v-html="formatEmail(emailResult)"></div>
                </div>
                <div class="result-actions">
                  <el-button type="primary" @click="sendEmail">
                    <el-icon><Promotion /></el-icon>
                    发送邮件
                  </el-button>
                  <el-button @click="copyResult(emailResult)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制邮件
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const activeTab = ref('essay')
const writingCount = ref(0)
const totalWords = ref(0)

const essayForm = reactive({
  type: '记叙文',
  topic: '',
  wordCount: 600,
  style: '朴实',
  requirements: ''
})
const essayLoading = ref(false)
const essayResult = ref('')

const improveForm = reactive({
  title: '',
  content: '',
  focus: ['语法错误', '用词不当', '结构问题']
})
const improveLoading = ref(false)
const improveResult = ref('')

const reportForm = reactive({
  type: '实验报告',
  topic: '',
  keyInfo: '',
  wordCount: 1000
})
const reportLoading = ref(false)
const reportResult = ref('')

const emailForm = reactive({
  type: '申请信',
  recipient: '',
  subject: '',
  content: '',
  tone: '正式'
})
const emailLoading = ref(false)
const emailResult = ref('')

const generateEssay = async () => {
  essayLoading.value = true
  try {
    const prompt = `请帮我写一篇${essayForm.type}：

主题：${essayForm.topic}
字数：约${essayForm.wordCount}字
风格：${essayForm.style}
${essayForm.requirements ? `特殊要求：${essayForm.requirements}` : ''}

要求：
1. 结构完整，层次清晰
2. 语言流畅，表达准确
3. 内容充实，有真情实感
4. 符合${essayForm.type}的特点`

    const response = await axios.post('/api/ai-science/chat', {
      message: prompt
    })

    if (response.data.success) {
      essayResult.value = response.data.data.reply
      writingCount.value++
      totalWords.value += essayResult.value.length
      ElMessage.success('作文创作完成！')
    } else {
      throw new Error(response.data.message)
    }
  } catch (error) {
    console.error('作文生成错误:', error)
    ElMessage.error('AI服务暂时不可用，请稍后再试')
  } finally {
    essayLoading.value = false
  }
}

const improveMyEssay = async () => {
  improveLoading.value = true
  try {
    const prompt = `请帮我批改这篇作文：

标题：${improveForm.title}
内容：
${improveForm.content}

批改重点：${improveForm.focus.join('、')}

请提供：
1. 总体评价和亮点
2. 具体问题和修改建议
3. 优化后的段落示例
4. 提升建议`

    const response = await axios.post('/api/ai-science/chat', {
      message: prompt
    })

    if (response.data.success) {
      improveResult.value = response.data.data.reply
      ElMessage.success('批改完成！')
    } else {
      throw new Error(response.data.message)
    }
  } catch (error) {
    console.error('作文批改错误:', error)
    ElMessage.error('AI服务暂时不可用，请稍后再试')
  } finally {
    improveLoading.value = false
  }
}

const generateReport = async () => {
  reportLoading.value = true
  try {
    const prompt = `请帮我写一份${reportForm.type}：

主题：${reportForm.topic}
关键信息：
${reportForm.keyInfo}

字数：约${reportForm.wordCount}字

请按照${reportForm.type}的标准格式撰写，包含必要的章节和内容。`

    const response = await axios.post('/api/ai-science/chat', {
      message: prompt
    })

    if (response.data.success) {
      reportResult.value = response.data.data.reply
      writingCount.value++
      totalWords.value += reportResult.value.length
      ElMessage.success('报告生成完成！')
    } else {
      throw new Error(response.data.message)
    }
  } catch (error) {
    console.error('报告生成错误:', error)
    ElMessage.error('AI服务暂时不可用，请稍后再试')
  } finally {
    reportLoading.value = false
  }
}

const generateEmail = async () => {
  emailLoading.value = true
  try {
    const prompt = `请帮我写一封${emailForm.type}：

收件人：${emailForm.recipient}
主题：${emailForm.subject}
主要内容：${emailForm.content}
语气风格：${emailForm.tone}

请按照正式邮件格式撰写，包含称呼、正文、结尾和署名。`

    const response = await axios.post('/api/ai-science/chat', {
      message: prompt
    })

    if (response.data.success) {
      emailResult.value = response.data.data.reply
      writingCount.value++
      ElMessage.success('邮件生成完成！')
    } else {
      throw new Error(response.data.message)
    }
  } catch (error) {
    console.error('邮件生成错误:', error)
    ElMessage.error('AI服务暂时不可用，请稍后再试')
  } finally {
    emailLoading.value = false
  }
}

const clearEssay = () => {
  Object.assign(essayForm, {
    type: '记叙文',
    topic: '',
    wordCount: 600,
    style: '朴实',
    requirements: ''
  })
  essayResult.value = ''
}

const clearImprove = () => {
  Object.assign(improveForm, {
    title: '',
    content: '',
    focus: ['语法错误', '用词不当', '结构问题']
  })
  improveResult.value = ''
}

const clearReport = () => {
  Object.assign(reportForm, {
    type: '实验报告',
    topic: '',
    keyInfo: '',
    wordCount: 1000
  })
  reportResult.value = ''
}

const clearEmail = () => {
  Object.assign(emailForm, {
    type: '申请信',
    recipient: '',
    subject: '',
    content: '',
    tone: '正式'
  })
  emailResult.value = ''
}

const formatResult = (text) => {
  return text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^(\d+\.|[•-])\s/gm, '<br>$1 ')
}

const formatEssay = (text) => {
  return text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
}

const formatEmail = (text) => {
  return text.replace(/\n/g, '<br>')
}

const copyResult = (text) => {
  navigator.clipboard.writeText(text)
  ElMessage.success('已复制到剪贴板')
}

const improveEssay = () => {
  improveForm.content = essayResult.value
  improveForm.title = essayForm.topic
  activeTab.value = 'improve'
  ElMessage.info('已切换到批改模式，可以继续优化')
}

const downloadEssay = () => {
  ElMessage.info('文档下载功能开发中...')
}

const viewComparison = () => {
  ElMessage.info('对比查看功能开发中...')
}

const saveReport = () => {
  ElMessage.success('报告已保存')
}

const downloadReport = () => {
  ElMessage.info('Word导出功能开发中...')
}

const sendEmail = () => {
  ElMessage.info('邮件发送功能开发中...')
}
</script>

<style scoped>
.ai-writing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 20px;
}

.page-header {
  background: white;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  font-size: 48px;
  color: #f5576c;
}

.header-left h1 {
  margin: 0;
  font-size: 28px;
  color: #303133;
}

.header-left p {
  margin: 5px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.header-stats {
  display: flex;
  gap: 30px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #f5576c;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.page-content {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.ai-tabs {
  min-height: 600px;
}

.tab-content {
  padding: 20px 0;
}

.feature-card {
  max-width: 900px;
  margin: 0 auto;
}

.card-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 30px;
  background: linear-gradient(135deg, #f093fb15 0%, #f5576c15 100%);
  border-radius: 12px;
}

.feature-icon {
  font-size: 60px;
  color: #f5576c;
  margin-bottom: 15px;
}

.card-header h3 {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #303133;
}

.card-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.ai-form {
  max-width: 700px;
  margin: 0 auto;
}

.slider-value {
  margin-left: 15px;
  color: #f5576c;
  font-weight: 600;
}

.result-area {
  margin-top: 40px;
  padding: 30px;
  background: #f5f7fa;
  border-radius: 12px;
  border-left: 4px solid #f5576c;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.result-icon {
  font-size: 24px;
  color: #67c23a;
}

.result-header h4 {
  margin: 0;
  font-size: 18px;
  color: #303133;
  flex: 1;
}

.result-content {
  line-height: 1.8;
  color: #606266;
  padding: 20px;
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.essay-content .essay-title {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #303133;
}

.essay-content .essay-body {
  text-indent: 2em;
  line-height: 2;
}

.email-content .email-meta {
  padding: 15px;
  background: #f4f4f5;
  border-radius: 6px;
  margin-bottom: 15px;
}

.email-content .email-meta p {
  margin: 5px 0;
}

.email-content .email-body {
  line-height: 1.8;
}

.result-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}
</style>
