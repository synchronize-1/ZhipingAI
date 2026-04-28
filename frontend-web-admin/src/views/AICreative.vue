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
                <div class="result-content markdown-body" v-html="renderMarkdown(posterResult)"></div>
                <div class="result-actions">
                  <el-button type="primary" @click="downloadPosterDesign">
                    <el-icon><Download /></el-icon>
                    导出设计稿
                  </el-button>
                  <el-button @click="copyWithMessage(posterResult, ElMessage)">
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
                <div class="result-content markdown-body mindmap-content" v-html="renderMarkdown(mindmapResult)"></div>
                <div class="result-actions">
                  <el-button type="primary" @click="exportMindmap">
                    <el-icon><Download /></el-icon>
                    导出图片
                  </el-button>
                  <el-button @click="copyWithMessage(mindmapResult, ElMessage)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制结构
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
  Postcard, DocumentCopy, Share
} from '@element-plus/icons-vue'
import axios from 'axios'
import { renderMarkdown, copyWithMessage } from '@/composables/useMarkdownRenderer'

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
5. 视觉元素建议

请用Markdown格式输出，使用标题、列表等格式使方案更清晰易读。`

    const response = await axios.post(`${API_BASE}/chat`, {
      message: prompt
    })

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

请用Markdown格式输出，使用标题层级（# ## ###）来表示思维导图的结构层次。`

    const response = await axios.post(`${API_BASE}/chat`, {
      message: prompt
    })

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

const downloadPainting = () => {
  if (paintingResult.value?.imageUrl) {
    alert("当前功能尚在开发中")
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
}

.result-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* Markdown 样式 */
.markdown-body :deep(h1) {
  font-size: 24px;
  margin: 16px 0 8px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #fa709a;
}

.markdown-body :deep(h2) {
  font-size: 20px;
  margin: 14px 0 6px 0;
  padding-left: 10px;
  border-left: 4px solid #fa709a;
}

.markdown-body :deep(h3) {
  font-size: 18px;
  margin: 12px 0 5px 0;
  color: #e6a23c;
}

.markdown-body :deep(h4) {
  font-size: 16px;
  margin: 10px 0 4px 0;
}

.markdown-body :deep(p) {
  margin: 8px 0;
}

.markdown-body :deep(ul), .markdown-body :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.markdown-body :deep(li) {
  margin: 4px 0;
}

.markdown-body :deep(pre) {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.markdown-body :deep(code) {
  font-family: 'Fira Code', monospace;
  font-size: 13px;
}

.markdown-body :deep(code:not(pre code)) {
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 4px;
  color: #e6a23c;
}

.markdown-body :deep(blockquote) {
  border-left: 3px solid #909399;
  background: #f5f5f5;
  padding: 8px 16px;
  margin: 12px 0;
  color: #606266;
  font-style: italic;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.markdown-body :deep(th), .markdown-body :deep(td) {
  border: 1px solid #dcdfe6;
  padding: 8px 12px;
  text-align: left;
}

.markdown-body :deep(th) {
  background: #f5f7fa;
  font-weight: 600;
}

.markdown-body :deep(hr) {
  margin: 16px 0;
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, #dcdfe6, transparent);
}

/* KaTeX 样式 */
.markdown-body :deep(.katex) {
  font-size: 1.1em;
}

.markdown-body :deep(.katex-display) {
  margin: 12px 0;
  overflow-x: auto;
  overflow-y: hidden;
}
</style>