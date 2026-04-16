<template>
  <div class="ai-learning-page">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <el-icon class="header-icon"><Reading /></el-icon>
          <div>
            <h1>AI学习助手</h1>
            <p>让AI成为你的专属学习伙伴</p>
          </div>
        </div>
        <el-button type="primary" @click="showTutorial = true">
          <el-icon><QuestionFilled /></el-icon>
          使用教程
        </el-button>
      </div>
    </div>

    <div class="page-content">
      <el-tabs v-model="activeTab" class="ai-tabs">
        <!-- 作业辅导 -->
        <el-tab-pane label="作业辅导" name="homework">
          <div class="tab-content">
            <div class="feature-card">
              <div class="card-header">
                <el-icon class="feature-icon"><EditPen /></el-icon>
                <h3>AI作业辅导</h3>
                <p>上传作业题目，AI为你提供详细解题思路</p>
              </div>
              
              <el-form :model="homeworkForm" label-width="100px" class="ai-form">
                <el-form-item label="学科">
                  <el-select v-model="homeworkForm.subject" placeholder="请选择学科">
                    <el-option label="数学" value="数学" />
                    <el-option label="物理" value="物理" />
                    <el-option label="化学" value="化学" />
                    <el-option label="英语" value="英语" />
                    <el-option label="语文" value="语文" />
                    <el-option label="生物" value="生物" />
                    <el-option label="历史" value="历史" />
                    <el-option label="地理" value="地理" />
                    <el-option label="政治" value="政治" />
                    <el-option label="其他" value="其他" />
                  </el-select>
                </el-form-item>

                <el-form-item label="题目类型">
                  <el-radio-group v-model="homeworkForm.type">
                    <el-radio label="选择题">选择题</el-radio>
                    <el-radio label="填空题">填空题</el-radio>
                    <el-radio label="计算题">计算题</el-radio>
                    <el-radio label="解答题">解答题</el-radio>
                    <el-radio label="其他">其他</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="题目内容">
                  <el-input
                    v-model="homeworkForm.question"
                    type="textarea"
                    :rows="6"
                    placeholder="请输入题目内容，可以包含题目、选项、已知条件等信息"
                    maxlength="2000"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item label="图片上传">
                  <el-upload
                    class="upload-demo"
                    drag
                    :auto-upload="false"
                    :on-change="handleImageUpload"
                    accept="image/*"
                  >
                    <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                    <div class="el-upload__text">
                      将题目图片拖到此处，或<em>点击上传</em>
                    </div>
                    <template #tip>
                      <div class="el-upload__tip">支持jpg/png格式，大小不超过5MB</div>
                    </template>
                  </el-upload>
                </el-form-item>

                <el-form-item>
                  <el-button 
                    type="primary" 
                    size="large"
                    @click="getHomeworkHelp"
                    :loading="homeworkLoading"
                    :disabled="!homeworkForm.question.trim()"
                  >
                    <el-icon><MagicStick /></el-icon>
                    AI帮我解答
                  </el-button>
                  <el-button size="large" @click="clearHomework">清空</el-button>
                </el-form-item>
              </el-form>

              <div class="result-area" v-if="homeworkResult">
                <div class="result-header">
                  <el-icon class="result-icon"><CircleCheck /></el-icon>
                  <h4>AI解答结果</h4>
                </div>
                <div class="result-content" v-html="formatResult(homeworkResult)"></div>
                <div class="result-actions">
                  <el-button @click="copyResult(homeworkResult)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制结果
                  </el-button>
                  <el-button @click="continueAsk">
                    <el-icon><ChatDotRound /></el-icon>
                    继续提问
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 知识讲解 -->
        <el-tab-pane label="知识讲解" name="knowledge">
          <div class="tab-content">
            <div class="feature-card">
              <div class="card-header">
                <el-icon class="feature-icon"><Reading /></el-icon>
                <h3>AI知识讲解</h3>
                <p>输入知识点，AI为你生成通俗易懂的讲解</p>
              </div>

              <el-form :model="knowledgeForm" label-width="100px" class="ai-form">
                <el-form-item label="学科">
                  <el-select v-model="knowledgeForm.subject" placeholder="请选择学科">
                    <el-option label="数学" value="数学" />
                    <el-option label="物理" value="物理" />
                    <el-option label="化学" value="化学" />
                    <el-option label="英语" value="英语" />
                    <el-option label="语文" value="语文" />
                    <el-option label="生物" value="生物" />
                    <el-option label="历史" value="历史" />
                    <el-option label="地理" value="地理" />
                    <el-option label="政治" value="政治" />
                  </el-select>
                </el-form-item>

                <el-form-item label="知识点">
                  <el-input
                    v-model="knowledgeForm.topic"
                    placeholder="例如：二次函数、牛顿第一定律、光合作用等"
                    maxlength="100"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item label="讲解深度">
                  <el-radio-group v-model="knowledgeForm.depth">
                    <el-radio label="基础">基础入门</el-radio>
                    <el-radio label="中等">中等难度</el-radio>
                    <el-radio label="深入">深入理解</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="补充说明">
                  <el-input
                    v-model="knowledgeForm.notes"
                    type="textarea"
                    :rows="3"
                    placeholder="可以补充你想了解的具体方面，例如：重点讲解应用场景、多举几个例子等"
                  />
                </el-form-item>

                <el-form-item>
                  <el-button 
                    type="primary" 
                    size="large"
                    @click="getKnowledgeExplain"
                    :loading="knowledgeLoading"
                    :disabled="!knowledgeForm.topic.trim()"
                  >
                    <el-icon><MagicStick /></el-icon>
                    AI开始讲解
                  </el-button>
                  <el-button size="large" @click="clearKnowledge">清空</el-button>
                </el-form-item>
              </el-form>

              <div class="result-area" v-if="knowledgeResult">
                <div class="result-header">
                  <el-icon class="result-icon"><CircleCheck /></el-icon>
                  <h4>AI讲解内容</h4>
                </div>
                <div class="result-content" v-html="formatResult(knowledgeResult)"></div>
                <div class="result-actions">
                  <el-button @click="copyResult(knowledgeResult)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制内容
                  </el-button>
                  <el-button @click="generateMindMap">
                    <el-icon><Share /></el-icon>
                    生成思维导图
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 学习计划 -->
        <el-tab-pane label="学习计划" name="plan">
          <div class="tab-content">
            <div class="feature-card">
              <div class="card-header">
                <el-icon class="feature-icon"><Calendar /></el-icon>
                <h3>AI学习计划</h3>
                <p>根据你的情况，AI为你制定个性化学习计划</p>
              </div>

              <el-form :model="planForm" label-width="120px" class="ai-form">
                <el-form-item label="学习目标">
                  <el-input
                    v-model="planForm.goal"
                    placeholder="例如：期末考试提高20分、掌握高等数学基础知识等"
                    maxlength="100"
                  />
                </el-form-item>

                <el-form-item label="计划周期">
                  <el-radio-group v-model="planForm.period">
                    <el-radio label="1周">1周</el-radio>
                    <el-radio label="2周">2周</el-radio>
                    <el-radio label="1个月">1个月</el-radio>
                    <el-radio label="1学期">1学期</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="每天学习时间">
                  <el-slider 
                    v-model="planForm.dailyHours" 
                    :min="1" 
                    :max="8" 
                    :step="0.5"
                    show-stops
                    :format-tooltip="(val) => `${val}小时`"
                  />
                  <span class="slider-value">{{ planForm.dailyHours }}小时/天</span>
                </el-form-item>

                <el-form-item label="薄弱科目">
                  <el-checkbox-group v-model="planForm.weakSubjects">
                    <el-checkbox label="数学">数学</el-checkbox>
                    <el-checkbox label="物理">物理</el-checkbox>
                    <el-checkbox label="化学">化学</el-checkbox>
                    <el-checkbox label="英语">英语</el-checkbox>
                    <el-checkbox label="语文">语文</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>

                <el-form-item label="学习偏好">
                  <el-checkbox-group v-model="planForm.preferences">
                    <el-checkbox label="视频学习">视频学习</el-checkbox>
                    <el-checkbox label="刷题练习">刷题练习</el-checkbox>
                    <el-checkbox label="知识总结">知识总结</el-checkbox>
                    <el-checkbox label="小组讨论">小组讨论</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>

                <el-form-item label="补充说明">
                  <el-input
                    v-model="planForm.notes"
                    type="textarea"
                    :rows="3"
                    placeholder="可以补充你的具体情况，例如：某些时间段不方便学习、有特殊要求等"
                  />
                </el-form-item>

                <el-form-item>
                  <el-button 
                    type="primary" 
                    size="large"
                    @click="generateStudyPlan"
                    :loading="planLoading"
                    :disabled="!planForm.goal.trim()"
                  >
                    <el-icon><MagicStick /></el-icon>
                    AI生成计划
                  </el-button>
                  <el-button size="large" @click="clearPlan">清空</el-button>
                </el-form-item>
              </el-form>

              <div class="result-area plan-result" v-if="planResult">
                <div class="result-header">
                  <el-icon class="result-icon"><CircleCheck /></el-icon>
                  <h4>你的专属学习计划</h4>
                </div>
                <div class="result-content" v-html="formatResult(planResult)"></div>
                <div class="result-actions">
                  <el-button type="primary" @click="savePlan">
                    <el-icon><FolderAdd /></el-icon>
                    保存计划
                  </el-button>
                  <el-button @click="copyResult(planResult)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制计划
                  </el-button>
                  <el-button @click="exportPlan">
                    <el-icon><Download /></el-icon>
                    导出PDF
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 错题分析 -->
        <el-tab-pane label="错题分析" name="error">
          <div class="tab-content">
            <div class="feature-card">
              <div class="card-header">
                <el-icon class="feature-icon"><Warning /></el-icon>
                <h3>AI错题分析</h3>
                <p>上传错题，AI帮你分析错误原因并提供改进建议</p>
              </div>

              <el-form :model="errorForm" label-width="100px" class="ai-form">
                <el-form-item label="学科">
                  <el-select v-model="errorForm.subject" placeholder="请选择学科">
                    <el-option label="数学" value="数学" />
                    <el-option label="物理" value="物理" />
                    <el-option label="化学" value="化学" />
                    <el-option label="英语" value="英语" />
                    <el-option label="语文" value="语文" />
                  </el-select>
                </el-form-item>

                <el-form-item label="题目内容">
                  <el-input
                    v-model="errorForm.question"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入题目内容"
                  />
                </el-form-item>

                <el-form-item label="你的答案">
                  <el-input
                    v-model="errorForm.myAnswer"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入你的答案或解题过程"
                  />
                </el-form-item>

                <el-form-item label="正确答案">
                  <el-input
                    v-model="errorForm.correctAnswer"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入正确答案（如果知道的话）"
                  />
                </el-form-item>

                <el-form-item>
                  <el-button 
                    type="primary" 
                    size="large"
                    @click="analyzeError"
                    :loading="errorLoading"
                    :disabled="!errorForm.question.trim() || !errorForm.myAnswer.trim()"
                  >
                    <el-icon><MagicStick /></el-icon>
                    AI分析错题
                  </el-button>
                  <el-button size="large" @click="clearError">清空</el-button>
                </el-form-item>
              </el-form>

              <div class="result-area error-result" v-if="errorResult">
                <div class="result-header">
                  <el-icon class="result-icon"><CircleCheck /></el-icon>
                  <h4>AI错题分析报告</h4>
                </div>
                <div class="result-content" v-html="formatResult(errorResult)"></div>
                <div class="result-actions">
                  <el-button @click="addToErrorBook">
                    <el-icon><FolderAdd /></el-icon>
                    加入错题本
                  </el-button>
                  <el-button @click="getSimilarQuestions">
                    <el-icon><Connection /></el-icon>
                    推荐相似题
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 使用教程对话框 -->
    <el-dialog v-model="showTutorial" title="AI学习助手使用教程" width="600px">
      <div class="tutorial-content">
        <el-timeline>
          <el-timeline-item timestamp="作业辅导" placement="top">
            <p>上传作业题目，AI会提供详细的解题思路和步骤讲解</p>
          </el-timeline-item>
          <el-timeline-item timestamp="知识讲解" placement="top">
            <p>输入知识点名称，AI会生成通俗易懂的讲解内容</p>
          </el-timeline-item>
          <el-timeline-item timestamp="学习计划" placement="top">
            <p>告诉AI你的学习目标，AI会为你制定个性化学习计划</p>
          </el-timeline-item>
          <el-timeline-item timestamp="错题分析" placement="top">
            <p>上传错题和你的答案，AI会分析错误原因并提供改进建议</p>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const activeTab = ref('homework')
const showTutorial = ref(false)

const homeworkForm = reactive({
  subject: '',
  type: '选择题',
  question: '',
  image: null
})
const homeworkLoading = ref(false)
const homeworkResult = ref('')

const knowledgeForm = reactive({
  subject: '',
  topic: '',
  depth: '中等',
  notes: ''
})
const knowledgeLoading = ref(false)
const knowledgeResult = ref('')

const planForm = reactive({
  goal: '',
  period: '1个月',
  dailyHours: 2,
  weakSubjects: [],
  preferences: [],
  notes: ''
})
const planLoading = ref(false)
const planResult = ref('')

const errorForm = reactive({
  subject: '',
  question: '',
  myAnswer: '',
  correctAnswer: ''
})
const errorLoading = ref(false)
const errorResult = ref('')

const handleImageUpload = (file) => {
  homeworkForm.image = file.raw
}

const getHomeworkHelp = async () => {
  homeworkLoading.value = true
  try {
    let questionText = homeworkForm.question

    // 如果上传了图片，先进行OCR识别
    if (homeworkForm.image) {
      ElMessage.info('正在识别图片中的文字...')
      
      const reader = new FileReader()
      const base64 = await new Promise((resolve) => {
        reader.readAsDataURL(homeworkForm.image)
        reader.onload = () => {
          resolve(reader.result.split(',')[1])
        }
      })

      const ocrResponse = await axios.post('/api/ai-science/ocr', {
        image: base64
      })

      if (ocrResponse.data.success) {
        const ocrText = ocrResponse.data.data.text
        // 将OCR识别的文字添加到题目内容中
        if (questionText.trim()) {
          questionText = `${questionText}\n\n图片中的内容：\n${ocrText}`
        } else {
          questionText = ocrText
        }
        ElMessage.success('图片识别完成！')
      } else {
        ElMessage.warning('图片识别失败，将仅使用文字内容')
      }
    }

    const prompt = `我是一名学生，遇到了一道${homeworkForm.subject}的${homeworkForm.type}，请帮我解答：

题目：${questionText}

请提供：
1. 详细的解题思路
2. 完整的解题步骤
3. 相关知识点讲解
4. 易错点提醒`

    const response = await axios.post('/api/ai-science/chat', {
      message: prompt
    })

    if (response.data.success) {
      homeworkResult.value = response.data.data.reply
      ElMessage.success('AI解答完成！')
    } else {
      throw new Error(response.data.message)
    }
  } catch (error) {
    console.error('作业辅导错误:', error)
    ElMessage.error('AI服务暂时不可用，请稍后再试')
  } finally {
    homeworkLoading.value = false
  }
}

const getKnowledgeExplain = async () => {
  knowledgeLoading.value = true
  try {
    const prompt = `请为我讲解${knowledgeForm.subject}中的"${knowledgeForm.topic}"这个知识点。

要求：
- 讲解深度：${knowledgeForm.depth}
- 使用通俗易懂的语言
- 包含具体例子和应用场景
- 总结重点和难点
${knowledgeForm.notes ? `\n补充要求：${knowledgeForm.notes}` : ''}`

    const response = await axios.post('/api/ai-science/chat', {
      message: prompt
    })

    if (response.data.success) {
      knowledgeResult.value = response.data.data.reply
      ElMessage.success('AI讲解完成！')
    } else {
      throw new Error(response.data.message)
    }
  } catch (error) {
    console.error('知识讲解错误:', error)
    ElMessage.error('AI服务暂时不可用，请稍后再试')
  } finally {
    knowledgeLoading.value = false
  }
}

const generateStudyPlan = async () => {
  planLoading.value = true
  try {
    const prompt = `请为我制定一个学习计划：

学习目标：${planForm.goal}
计划周期：${planForm.period}
每天学习时间：${planForm.dailyHours}小时
薄弱科目：${planForm.weakSubjects.join('、') || '无'}
学习偏好：${planForm.preferences.join('、') || '无'}
${planForm.notes ? `补充说明：${planForm.notes}` : ''}

请提供：
1. 详细的每日/每周学习安排
2. 各科目的学习重点和时间分配
3. 阶段性目标和检验方法
4. 学习建议和注意事项`

    const response = await axios.post('/api/ai-science/chat', {
      message: prompt
    })

    if (response.data.success) {
      planResult.value = response.data.data.reply
      ElMessage.success('学习计划生成完成！')
    } else {
      throw new Error(response.data.message)
    }
  } catch (error) {
    console.error('学习计划生成错误:', error)
    ElMessage.error('AI服务暂时不可用，请稍后再试')
  } finally {
    planLoading.value = false
  }
}

const analyzeError = async () => {
  errorLoading.value = true
  try {
    const prompt = `请帮我分析这道错题：

学科：${errorForm.subject}
题目：${errorForm.question}
我的答案：${errorForm.myAnswer}
${errorForm.correctAnswer ? `正确答案：${errorForm.correctAnswer}` : ''}

请提供：
1. 错误原因分析
2. 正确的解题思路和步骤
3. 相关知识点回顾
4. 避免类似错误的建议
5. 推荐相似题型练习`

    const response = await axios.post('/api/ai-science/chat', {
      message: prompt
    })

    if (response.data.success) {
      errorResult.value = response.data.data.reply
      ElMessage.success('错题分析完成！')
    } else {
      throw new Error(response.data.message)
    }
  } catch (error) {
    console.error('错题分析错误:', error)
    ElMessage.error('AI服务暂时不可用，请稍后再试')
  } finally {
    errorLoading.value = false
  }
}

const clearHomework = () => {
  Object.assign(homeworkForm, {
    subject: '',
    type: '选择题',
    question: '',
    image: null
  })
  homeworkResult.value = ''
}

const clearKnowledge = () => {
  Object.assign(knowledgeForm, {
    subject: '',
    topic: '',
    depth: '中等',
    notes: ''
  })
  knowledgeResult.value = ''
}

const clearPlan = () => {
  Object.assign(planForm, {
    goal: '',
    period: '1个月',
    dailyHours: 2,
    weakSubjects: [],
    preferences: [],
    notes: ''
  })
  planResult.value = ''
}

const clearError = () => {
  Object.assign(errorForm, {
    subject: '',
    question: '',
    myAnswer: '',
    correctAnswer: ''
  })
  errorResult.value = ''
}

const formatResult = (text) => {
  return text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^(\d+\.|[•-])\s/gm, '<br>$1 ')
    .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
}

const copyResult = (text) => {
  navigator.clipboard.writeText(text)
  ElMessage.success('已复制到剪贴板')
}

const continueAsk = () => {
  ElMessage.info('请在AI助手中继续提问')
}

const generateMindMap = () => {
  ElMessage.info('思维导图功能开发中...')
}

const savePlan = () => {
  ElMessage.success('学习计划已保存')
}

const exportPlan = () => {
  ElMessage.info('PDF导出功能开发中...')
}

const addToErrorBook = () => {
  ElMessage.success('已加入错题本')
}

const getSimilarQuestions = () => {
  ElMessage.info('相似题推荐功能开发中...')
}
</script>

<style scoped>
.ai-learning-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  color: #667eea;
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
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 12px;
}

.feature-icon {
  font-size: 60px;
  color: #667eea;
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
  color: #667eea;
  font-weight: 600;
}

.result-area {
  margin-top: 40px;
  padding: 30px;
  background: #f5f7fa;
  border-radius: 12px;
  border-left: 4px solid #667eea;
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

.result-content :deep(strong) {
  color: #667eea;
  font-weight: 600;
}

.result-content :deep(pre) {
  background: #f4f4f5;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
}

.result-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.tutorial-content {
  padding: 20px;
}

.upload-demo {
  width: 100%;
}
</style>
