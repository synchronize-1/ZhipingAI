<template>
  <div class="ai-learning">
    <div class="page-content">
      <el-tabs v-model="activeTab" class="learning-tabs">
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

                <el-form-item label="题目内容" required>
                  <el-input
                      v-model="homeworkForm.question"
                      type="textarea"
                      :rows="6"
                      placeholder="请输入题目内容，可以包含题目、选项、已知条件等信息"
                      maxlength="2000"
                      show-word-limit
                  />
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
                <div class="result-content markdown-body" v-html="renderMarkdown(homeworkResult)"></div>
                <div class="result-actions">
                  <el-button @click="copyWithMessage(homeworkResult, ElMessage)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制结果
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

                <el-form-item label="知识点" required>
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
                <div class="result-content markdown-body" v-html="renderMarkdown(knowledgeResult)"></div>
                <div class="result-actions">
                  <el-button @click="copyWithMessage(knowledgeResult, ElMessage)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制内容
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
                <p>个性化定制，日拱一卒</p>
              </div>

              <el-form :model="planForm" label-width="120px" class="ai-form">
                <el-form-item label="学习目标" required>
                  <el-input
                      v-model="planForm.goal"
                      placeholder="example：1天速通大学物理、3天掌握高等数学基础知识"
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
                <div class="result-content markdown-body" v-html="renderMarkdown(planResult)"></div>
                <div class="result-actions">
                  <el-button @click="copyWithMessage(planResult, ElMessage)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制计划
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
                <p>错题退，好运来！错题快端上来吧</p>
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

                <el-form-item label="题目内容" required>
                  <el-input
                      v-model="errorForm.question"
                      type="textarea"
                      :rows="4"
                      placeholder="请输入题目内容"
                  />
                </el-form-item>

                <el-form-item label="你的答案" required>
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
                      placeholder="如果你知道正确答案，请填写"
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
                <div class="result-content markdown-body" v-html="renderMarkdown(errorResult)"></div>
                <div class="result-actions">
                  <el-button @click="copyWithMessage(errorResult, ElMessage)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制报告
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
import {
  EditPen, Reading, Calendar, Warning, MagicStick,
  CircleCheck, DocumentCopy
} from '@element-plus/icons-vue'
import axios from 'axios'
import { renderMarkdown, copyWithMessage } from '@/composables/useMarkdownRenderer'

const API_BASE = 'http://localhost:3000/api/ai-science'

const activeTab = ref('homework')

const homeworkForm = reactive({
  subject: '',
  type: '选择题',
  question: ''
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

// 作业辅导 - AI帮我解答
const getHomeworkHelp = async () => {
  if (!homeworkForm.question.trim()) {
    ElMessage.warning('请输入题目内容')
    return
  }

  homeworkLoading.value = true
  homeworkResult.value = ''

  try {
    const subject = homeworkForm.subject || '未指定'
    const type = homeworkForm.type

    const prompt = `请帮我解答以下${subject}的${type}题目：

题目内容：
${homeworkForm.question}

请提供：
1. 解题思路
2. 详细步骤
3. 最终答案
4. 知识点总结`

    const response = await axios.post(`${API_BASE}/chat`, {
      message: prompt
    })

    if (response.data.success) {
      homeworkResult.value = response.data.data.reply
      ElMessage.success('AI解答完成！')
    } else {
      throw new Error(response.data.message || '请求失败')
    }
  } catch (error) {
    console.error('作业辅导错误:', error)
    ElMessage.error(error.response?.data?.message || 'AI服务暂时不可用，请稍后再试')
  } finally {
    homeworkLoading.value = false
  }
}

// 知识讲解
const getKnowledgeExplain = async () => {
  if (!knowledgeForm.topic.trim()) {
    ElMessage.warning('请输入知识点')
    return
  }

  knowledgeLoading.value = true
  knowledgeResult.value = ''

  try {
    const subject = knowledgeForm.subject || '未指定'
    const topic = knowledgeForm.topic
    const depth = knowledgeForm.depth
    const notes = knowledgeForm.notes

    const prompt = `请讲解${subject}中的知识点"${topic}"。

要求：
- 讲解深度：${depth}
- 使用通俗易懂的语言
- 包含具体例子
- 总结重点
${notes ? `\n补充要求：${notes}` : ''}`

    const response = await axios.post(`${API_BASE}/chat`, {
      message: prompt
    })

    if (response.data.success) {
      knowledgeResult.value = response.data.data.reply
      ElMessage.success('AI讲解完成！')
    } else {
      throw new Error(response.data.message || '请求失败')
    }
  } catch (error) {
    console.error('知识讲解错误:', error)
    ElMessage.error('AI服务暂时不可用，请稍后再试')
  } finally {
    knowledgeLoading.value = false
  }
}

// 生成学习计划
const generateStudyPlan = async () => {
  if (!planForm.goal.trim()) {
    ElMessage.warning('请输入学习目标')
    return
  }

  planLoading.value = true
  planResult.value = ''

  try {
    const prompt = `请制定学习计划：

目标：${planForm.goal}
周期：${planForm.period}
每天学习：${planForm.dailyHours}小时
薄弱科目：${planForm.weakSubjects.join('、') || '无'}
学习偏好：${planForm.preferences.join('、') || '无'}
${planForm.notes ? `补充：${planForm.notes}` : ''}

请提供每日/每周安排、学习重点和建议。`

    const response = await axios.post(`${API_BASE}/chat`, {
      message: prompt
    })

    if (response.data.success) {
      planResult.value = response.data.data.reply
      ElMessage.success('学习计划生成完成！')
    } else {
      throw new Error(response.data.message || '请求失败')
    }
  } catch (error) {
    console.error('学习计划生成错误:', error)
    ElMessage.error('AI服务暂时不可用，请稍后再试')
  } finally {
    planLoading.value = false
  }
}

// 错题分析
const analyzeError = async () => {
  if (!errorForm.question.trim()) {
    ElMessage.warning('请输入题目内容')
    return
  }
  if (!errorForm.myAnswer.trim()) {
    ElMessage.warning('请输入你的答案')
    return
  }

  errorLoading.value = true
  errorResult.value = ''

  try {
    const prompt = `分析错题：

学科：${errorForm.subject || '未指定'}
题目：${errorForm.question}
我的答案：${errorForm.myAnswer}
${errorForm.correctAnswer ? `正确答案：${errorForm.correctAnswer}` : ''}

请分析错误原因、给出正确解法、相关知识点和避免建议。`

    const response = await axios.post(`${API_BASE}/chat`, {
      message: prompt
    })

    if (response.data.success) {
      errorResult.value = response.data.data.reply
      ElMessage.success('错题分析完成！')
    } else {
      throw new Error(response.data.message || '请求失败')
    }
  } catch (error) {
    console.error('错题分析错误:', error)
    ElMessage.error('AI服务暂时不可用，请稍后再试')
  } finally {
    errorLoading.value = false
  }
}

// 清空表单
const clearHomework = () => {
  Object.assign(homeworkForm, {
    subject: '',
    type: '选择题',
    question: ''
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
</script>

<style scoped>
.ai-learning {
  width: 100%;
}

.learning-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
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

.result-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* Markdown 样式 */
.result-content :deep(h1) {
  font-size: 24px;
  margin: 16px 0 8px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #667eea;
}

.result-content :deep(h2) {
  font-size: 20px;
  margin: 14px 0 6px 0;
  padding-left: 10px;
  border-left: 4px solid #667eea;
}

.result-content :deep(h3) {
  font-size: 18px;
  margin: 12px 0 5px 0;
  color: #409eff;
}

.result-content :deep(h4) {
  font-size: 16px;
  margin: 10px 0 4px 0;
}

.result-content :deep(p) {
  margin: 8px 0;
}

.result-content :deep(ul), .result-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.result-content :deep(li) {
  margin: 4px 0;
}

.result-content :deep(pre) {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.result-content :deep(code) {
  font-family: 'Fira Code', monospace;
  font-size: 13px;
}

.result-content :deep(code:not(pre code)) {
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 4px;
  color: #e6a23c;
}

.result-content :deep(blockquote) {
  border-left: 3px solid #909399;
  background: #f5f5f5;
  padding: 8px 16px;
  margin: 12px 0;
  color: #606266;
  font-style: italic;
}

.result-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.result-content :deep(th), .result-content :deep(td) {
  border: 1px solid #dcdfe6;
  padding: 8px 12px;
  text-align: left;
}

.result-content :deep(th) {
  background: #f5f7fa;
  font-weight: 600;
}

.result-content :deep(hr) {
  margin: 16px 0;
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, #dcdfe6, transparent);
}

/* KaTeX 样式 */
.result-content :deep(.katex) {
  font-size: 1.1em;
}

.result-content :deep(.katex-display) {
  margin: 12px 0;
  overflow-x: auto;
  overflow-y: hidden;
}
</style>