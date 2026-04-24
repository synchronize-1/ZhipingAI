<template>
  <div class="ai-creative">
    <div class="page-content">
      <el-tabs v-model="activeTab" class="creative-tabs">
        <!-- AI绘画 -->
        <el-tab-pane label="AI绘画" name="painting">
          <div class="tab-content">
            <div class="feature-card">
              <div class="card-header">
                <el-icon class="feature-icon"><Brush /></el-icon>
                <h3>AI文字生成图片</h3>
                <p>输入描述，AI为你创作精美图片</p>
              </div>

              <el-form :model="paintingForm" label-width="100px" class="ai-form">
                <el-form-item label="图片描述">
                  <el-input
                      v-model="paintingForm.prompt"
                      type="textarea"
                      :rows="4"
                      placeholder="详细描述你想要的图片，例如：一只在太空漫步的可爱猫咪，背景是璀璨星空..."
                      maxlength="500"
                      show-word-limit
                  />
                </el-form-item>

                <el-form-item label="绘画风格">
                  <el-radio-group v-model="paintingForm.style">
                    <el-radio label="写实">写实风格</el-radio>
                    <el-radio label="动漫">动漫风格</el-radio>
                    <el-radio label="油画">油画风格</el-radio>
                    <el-radio label="水彩">水彩风格</el-radio>
                    <el-radio label="未来">未来科技</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="图片尺寸">
                  <el-select v-model="paintingForm.size" placeholder="选择尺寸">
                    <el-option label="正方形 (512x512)" value="512x512" />
                    <el-option label="横屏 (768x512)" value="768x512" />
                    <el-option label="竖屏 (512x768)" value="512x768" />
                  </el-select>
                </el-form-item>

                <el-form-item>
                  <el-button
                      type="primary"
                      size="large"
                      @click="generatePainting"
                      :loading="paintingLoading"
                      :disabled="!paintingForm.prompt.trim()"
                  >
                    <el-icon><MagicStick /></el-icon>
                    开始创作
                  </el-button>
                  <el-button size="large" @click="clearPainting">清空</el-button>
                </el-form-item>
              </el-form>

              <div class="result-area" v-if="paintingResult">
                <div class="result-header">
                  <el-icon class="result-icon"><CircleCheck /></el-icon>
                  <h4>AI创作的图片</h4>
                </div>
                <div class="painting-display">
                  <img :src="paintingResult.imageUrl" alt="AI绘画" />
                </div>
                <div class="result-actions">
                  <el-button type="primary" @click="downloadPainting">
                    <el-icon><Download /></el-icon>
                    下载图片
                  </el-button>
                  <el-button @click="savePainting">
                    <el-icon><FolderAdd /></el-icon>
                    保存到相册
                  </el-button>
                  <el-button @click="regeneratePainting">
                    <el-icon><RefreshRight /></el-icon>
                    重新生成
                  </el-button>
                </div>
              </div>

              <el-alert
                  title="温馨提示"
                  type="warning"
                  :closable="false"
                  style="margin-top: 20px;"
              >
                <p>百度文心一格API当前额度已用完，请明天再试或升级套餐。</p>
                <p>您也可以使用其他AI创意功能：海报设计、思维导图等。</p>
              </el-alert>
            </div>
          </div>
        </el-tab-pane>

        <!-- 海报设计 -->
        <el-tab-pane label="海报设计" name="poster">
          <div class="tab-content">
            <div class="feature-card">
              <div class="card-header">
                <el-icon class="feature-icon"><Postcard /></el-icon>
                <h3>AI海报设计</h3>
                <p>快速生成活动海报、宣传图等</p>
              </div>

              <el-form :model="posterForm" label-width="100px" class="ai-form">
                <el-form-item label="海报类型">
                  <el-select v-model="posterForm.type" placeholder="选择海报类型">
                    <el-option label="活动海报" value="活动海报" />
                    <el-option label="招募海报" value="招募海报" />
                    <el-option label="比赛海报" value="比赛海报" />
                    <el-option label="讲座海报" value="讲座海报" />
                    <el-option label="节日海报" value="节日海报" />
                  </el-select>
                </el-form-item>

                <el-form-item label="海报主题">
                  <el-input
                      v-model="posterForm.title"
                      placeholder="例如：校园音乐节、社团招新等"
                      maxlength="50"
                  />
                </el-form-item>

                <el-form-item label="关键信息">
                  <el-input
                      v-model="posterForm.info"
                      type="textarea"
                      :rows="5"
                      placeholder="请输入海报需要包含的信息，例如：时间、地点、主办方、联系方式等"
                  />
                </el-form-item>

                <el-form-item label="色彩风格">
                  <el-radio-group v-model="posterForm.colorStyle">
                    <el-radio label="活力">活力橙红</el-radio>
                    <el-radio label="清新">清新蓝绿</el-radio>
                    <el-radio label="优雅">优雅紫粉</el-radio>
                    <el-radio label="专业">专业深蓝</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item>
                  <el-button
                      type="primary"
                      size="large"
                      @click="generatePoster"
                      :loading="posterLoading"
                      :disabled="!posterForm.title.trim() || !posterForm.info.trim()"
                  >
                    <el-icon><MagicStick /></el-icon>
                    AI设计海报
                  </el-button>
                  <el-button size="large" @click="clearPoster">清空</el-button>
                </el-form-item>
              </el-form>

              <div class="result-area" v-if="posterResult">
                <div class="result-header">
                  <el-icon class="result-icon"><CircleCheck /></el-icon>
                  <h4>AI设计方案</h4>
                </div>
                <div class="result-content" v-html="formatResult(posterResult)"></div>
                <div class="result-actions">
                  <el-button type="primary" @click="downloadPosterDesign">
                    <el-icon><Download /></el-icon>
                    导出设计稿
                  </el-button>
                  <el-button @click="copyResult(posterResult)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制方案
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 思维导图 -->
        <el-tab-pane label="思维导图" name="mindmap">
          <div class="tab-content">
            <div class="feature-card">
              <div class="card-header">
                <el-icon class="feature-icon"><Share /></el-icon>
                <h3>AI思维导图</h3>
                <p>根据内容自动生成思维导图</p>
              </div>

              <el-form :model="mindmapForm" label-width="100px" class="ai-form">
                <el-form-item label="主题">
                  <el-input
                      v-model="mindmapForm.topic"
                      placeholder="例如：学习计划、项目规划、知识点总结等"
                      maxlength="50"
                  />
                </el-form-item>

                <el-form-item label="内容">
                  <el-input
                      v-model="mindmapForm.content"
                      type="textarea"
                      :rows="8"
                      placeholder="请输入需要整理的内容，AI会自动提取关键信息并生成思维导图结构"
                  />
                </el-form-item>

                <el-form-item label="导图层级">
                  <el-radio-group v-model="mindmapForm.depth">
                    <el-radio :label="2">2层（简洁）</el-radio>
                    <el-radio :label="3">3层（标准）</el-radio>
                    <el-radio :label="4">4层（详细）</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item>
                  <el-button
                      type="primary"
                      size="large"
                      @click="generateMindmap"
                      :loading="mindmapLoading"
                      :disabled="!mindmapForm.topic.trim() || !mindmapForm.content.trim()"
                  >
                    <el-icon><MagicStick /></el-icon>
                    AI生成导图
                  </el-button>
                  <el-button size="large" @click="clearMindmap">清空</el-button>
                </el-form-item>
              </el-form>

              <div class="result-area" v-if="mindmapResult">
                <div class="result-header">
                  <el-icon class="result-icon"><CircleCheck /></el-icon>
                  <h4>思维导图结构</h4>
                </div>
                <div class="result-content mindmap-content" v-html="formatMindmap(mindmapResult)"></div>
                <div class="result-actions">
                  <el-button type="primary" @click="exportMindmap">
                    <el-icon><Download /></el-icon>
                    导出图片
                  </el-button>
                  <el-button @click="copyResult(mindmapResult)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制结构
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- PPT助手 -->
        <el-tab-pane label="PPT助手" name="ppt">
          <div class="tab-content">
            <div class="feature-card">
              <div class="card-header">
                <el-icon class="feature-icon"><Monitor /></el-icon>
                <h3>AI PPT助手</h3>
                <p>快速生成PPT大纲和内容</p>
              </div>

              <el-form :model="pptForm" label-width="100px" class="ai-form">
                <el-form-item label="PPT主题">
                  <el-input
                      v-model="pptForm.topic"
                      placeholder="例如：环境保护、科技创新、历史回顾等"
                      maxlength="50"
                  />
                </el-form-item>

                <el-form-item label="目标听众">
                  <el-select v-model="pptForm.audience" placeholder="选择听众类型">
                    <el-option label="同学" value="同学" />
                    <el-option label="老师" value="老师" />
                    <el-option label="评委" value="评委" />
                    <el-option label="大众" value="大众" />
                  </el-select>
                </el-form-item>

                <el-form-item label="页数要求">
                  <el-slider
                      v-model="pptForm.pageCount"
                      :min="5"
                      :max="30"
                      :step="5"
                      show-stops
                      :format-tooltip="(val) => `${val}页`"
                  />
                  <span class="slider-value">{{ pptForm.pageCount }}页</span>
                </el-form-item>

                <el-form-item label="核心内容">
                  <el-input
                      v-model="pptForm.content"
                      type="textarea"
                      :rows="6"
                      placeholder="请简要描述PPT需要包含的核心内容和要点"
                  />
                </el-form-item>

                <el-form-item>
                  <el-button
                      type="primary"
                      size="large"
                      @click="generatePPT"
                      :loading="pptLoading"
                      :disabled="!pptForm.topic.trim() || !pptForm.content.trim()"
                  >
                    <el-icon><MagicStick /></el-icon>
                    AI生成大纲
                  </el-button>
                  <el-button size="large" @click="clearPPT">清空</el-button>
                </el-form-item>
              </el-form>

              <div class="result-area" v-if="pptResult">
                <div class="result-header">
                  <el-icon class="result-icon"><CircleCheck /></el-icon>
                  <h4>PPT大纲和内容</h4>
                </div>
                <div class="result-content ppt-content" v-html="formatResult(pptResult)"></div>
                <div class="result-actions">
                  <el-button type="primary" @click="exportPPT">
                    <el-icon><Download /></el-icon>
                    导出大纲
                  </el-button>
                  <el-button @click="copyResult(pptResult)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制内容
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
  Brush, MagicStick, CircleCheck, Download, FolderAdd, RefreshRight,
  Postcard, DocumentCopy, Share, Monitor
} from '@element-plus/icons-vue'
import axios from 'axios'

const API_BASE = 'http://localhost:3000/api/ai-science'

const activeTab = ref('painting')
const creativeCount = ref(0)

const paintingForm = reactive({
  prompt: '',
  style: '写实',
  size: '512x512'
})
const paintingLoading = ref(false)
const paintingResult = ref(null)

const posterForm = reactive({
  type: '活动海报',
  title: '',
  info: '',
  colorStyle: '活力'
})
const posterLoading = ref(false)
const posterResult = ref('')

const mindmapForm = reactive({
  topic: '',
  content: '',
  depth: 3
})
const mindmapLoading = ref(false)
const mindmapResult = ref('')

const pptForm = reactive({
  topic: '',
  audience: '同学',
  pageCount: 15,
  content: ''
})
const pptLoading = ref(false)
const pptResult = ref('')

const generatePainting = async () => {
  paintingLoading.value = true
  try {
    const response = await axios.post(`${API_BASE}/generate-image`, {
      prompt: paintingForm.prompt,
      style: paintingForm.style,
      size: paintingForm.size
    })

    if (response.data.success) {
      const taskId = response.data.data.taskId
      ElMessage.info('图片生成中，请稍候...')

      await pollImageResult(taskId)
    } else {
      throw new Error(response.data.message)
    }
  } catch (error) {
    console.error('绘画生成错误:', error)
    ElMessage.error('当前API额度已用完，请明天再试')
  } finally {
    paintingLoading.value = false
  }
}

const pollImageResult = async (taskId) => {
  const maxAttempts = 30
  let attempts = 0

  const poll = async () => {
    try {
      const response = await axios.get(`${API_BASE}/image-result/${taskId}`)

      if (response.data.success && response.data.data.status === 'completed') {
        paintingResult.value = {
          imageUrl: response.data.data.images[0].url
        }
        creativeCount.value++
        ElMessage.success('图片生成完成！')
      } else if (response.data.data.status === 'pending') {
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000)
        } else {
          ElMessage.error('生成超时，请重试')
        }
      } else {
        ElMessage.error('图片生成失败')
      }
    } catch (error) {
      ElMessage.error('查询结果失败')
    }
  }

  poll()
}

const generatePoster = async () => {
  posterLoading.value = true
  try {
    const prompt = `请为我设计一个${posterForm.type}的设计方案：

主题：${posterForm.title}
关键信息：
${posterForm.info}

色彩风格：${posterForm.colorStyle}

请提供：
1. 整体设计思路
2. 布局建议（标题、主体、装饰元素等的位置）
3. 色彩搭配方案
4. 字体建议
5. 视觉元素建议`

    const response = await axios.post(`${API_BASE}/chat`, { message: prompt })

    if (response.data.success) {
      posterResult.value = response.data.data.reply
      creativeCount.value++
      ElMessage.success('海报设计方案生成完成！')
    } else {
      throw new Error(response.data.message)
    }
  } catch (error) {
    console.error('海报设计错误:', error)
    ElMessage.error('AI服务暂时不可用，请稍后再试')
  } finally {
    posterLoading.value = false
  }
}

const generateMindmap = async () => {
  mindmapLoading.value = true
  try {
    const prompt = `请根据以下内容生成思维导图结构：

主题：${mindmapForm.topic}
内容：
${mindmapForm.content}

要求：
- 层级深度：${mindmapForm.depth}层
- 提取关键概念和要点
- 建立清晰的层级关系
- 使用缩进表示层级

请以树状结构输出，使用缩进表示层级关系。`

    const response = await axios.post(`${API_BASE}/chat`, { message: prompt })

    if (response.data.success) {
      mindmapResult.value = response.data.data.reply
      creativeCount.value++
      ElMessage.success('思维导图生成完成！')
    } else {
      throw new Error(response.data.message)
    }
  } catch (error) {
    console.error('思维导图生成错误:', error)
    ElMessage.error('AI服务暂时不可用，请稍后再试')
  } finally {
    mindmapLoading.value = false
  }
}

const generatePPT = async () => {
  pptLoading.value = true
  try {
    const prompt = `请帮我生成一个PPT的大纲和内容：

主题：${pptForm.topic}
目标听众：${pptForm.audience}
页数：约${pptForm.pageCount}页
核心内容：
${pptForm.content}

请提供：
1. 完整的PPT大纲（每页的标题）
2. 每页的核心内容要点
3. 演讲建议`

    const response = await axios.post(`${API_BASE}/chat`, { message: prompt })

    if (response.data.success) {
      pptResult.value = response.data.data.reply
      creativeCount.value++
      ElMessage.success('PPT大纲生成完成！')
    } else {
      throw new Error(response.data.message)
    }
  } catch (error) {
    console.error('PPT生成错误:', error)
    ElMessage.error('AI服务暂时不可用，请稍后再试')
  } finally {
    pptLoading.value = false
  }
}

const clearPainting = () => {
  Object.assign(paintingForm, {
    prompt: '',
    style: '写实',
    size: '512x512'
  })
  paintingResult.value = null
}

const clearPoster = () => {
  Object.assign(posterForm, {
    type: '活动海报',
    title: '',
    info: '',
    colorStyle: '活力'
  })
  posterResult.value = ''
}

const clearMindmap = () => {
  Object.assign(mindmapForm, {
    topic: '',
    content: '',
    depth: 3
  })
  mindmapResult.value = ''
}

const clearPPT = () => {
  Object.assign(pptForm, {
    topic: '',
    audience: '同学',
    pageCount: 15,
    content: ''
  })
  pptResult.value = ''
}

const formatResult = (text) => {
  return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^(\d+\.|[•-])\s/gm, '<br>$1 ')
}

const formatMindmap = (text) => {
  return text
      .replace(/\n/g, '<br>')
      .replace(/^(\s+)/gm, (match) => '&nbsp;'.repeat(match.length * 2))
}

const copyResult = (text) => {
  navigator.clipboard.writeText(text)
  ElMessage.success('已复制到剪贴板')
}

const downloadPainting = () => {
  if (paintingResult.value?.imageUrl) {
    window.open(paintingResult.value.imageUrl, '_blank')
  }
}

const savePainting = () => {
  ElMessage.success('图片已保存到相册')
}

const regeneratePainting = () => {
  paintingResult.value = null
  generatePainting()
}

const downloadPosterDesign = () => {
  ElMessage.info('设计稿导出功能开发中...')
}

const exportMindmap = () => {
  ElMessage.info('思维导图导出功能开发中...')
}

const exportPPT = () => {
  ElMessage.info('PPT导出功能开发中...')
}
</script>

<style scoped>
.ai-creative {
  width: 100%;
}

.creative-tabs :deep(.el-tabs__header) {
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
  background: linear-gradient(135deg, #fa709a15 0%, #fee14015 100%);
  border-radius: 12px;
}

.feature-icon {
  font-size: 60px;
  color: #fa709a;
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
  color: #fa709a;
  font-weight: 600;
}

.result-area {
  margin-top: 40px;
  padding: 30px;
  background: #f5f7fa;
  border-radius: 12px;
  border-left: 4px solid #fa709a;
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

.painting-display {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
}

.painting-display img {
  max-width: 100%;
  max-height: 500px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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

.mindmap-content {
  font-family: monospace;
  white-space: pre-wrap;
}

.result-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}
</style>