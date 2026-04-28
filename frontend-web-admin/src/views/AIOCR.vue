<template>
  <div class="ai-ocr-page">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <el-icon class="header-icon"><Camera /></el-icon>
          <div>
            <h1>AI智能识别</h1>
            <p>拍照识字，智能提取文本内容</p>
          </div>
        </div>
      </div>
    </div>

    <div class="page-content">
      <el-tabs v-model="activeTab" class="ai-tabs">
        <!-- 拍照识题 -->
        <el-tab-pane label="拍照识题" name="question">
          <div class="tab-content">
            <div class="feature-card">
              <div class="card-header">
                <el-icon class="feature-icon"><EditPen /></el-icon>
                <h3>拍照识题</h3>
                <p>上传题目图片，AI自动识别并提供解答</p>
              </div>

              <div class="upload-section">
                <el-upload
                    class="upload-area"
                    drag
                    :auto-upload="false"
                    :on-change="handleQuestionUpload"
                    :show-file-list="false"
                    accept="image/*"
                >
                  <div v-if="!questionImage" class="upload-placeholder">
                    <el-icon class="upload-icon"><UploadFilled /></el-icon>
                    <div class="upload-text">
                      <p>将题目图片拖到此处，或<em>点击上传</em></p>
                      <p class="upload-tip">支持jpg/png格式，大小不超过10MB</p>
                    </div>
                  </div>
                  <div v-else class="preview-image">
                    <img :src="questionImageUrl" alt="题目图片" />
                    <div class="image-mask">
                      <el-button type="primary" circle @click.stop="reuploadQuestion">
                        <el-icon><RefreshRight /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </el-upload>

                <div class="action-buttons" v-if="questionImage">
                  <el-button
                      type="primary"
                      size="large"
                      @click="recognizeQuestion"
                      :loading="questionLoading"
                  >
                    <el-icon><MagicStick /></el-icon>
                    开始识别并解答
                  </el-button>
                  <el-button size="large" @click="clearQuestion">清空</el-button>
                </div>
              </div>

              <div class="result-area" v-if="questionResult">
                <div class="result-section">
                  <div class="section-header">
                    <el-icon><Document /></el-icon>
                    <h4>识别的题目</h4>
                  </div>
                  <div class="section-content">{{ questionResult.text }}</div>
                </div>

                <div class="result-section" v-if="questionResult.answer">
                  <div class="section-header">
                    <el-icon><CircleCheck /></el-icon>
                    <h4>AI解答</h4>
                  </div>
                  <div class="section-content markdown-body" v-html="renderMarkdown(questionResult.answer)"></div>
                </div>

                <div class="result-actions">
                  <el-button @click="copyWithMessage(questionResult.text, ElMessage)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制题目
                  </el-button>
                  <el-button @click="copyWithMessage(questionResult.answer, ElMessage)" v-if="questionResult.answer">
                    <el-icon><DocumentCopy /></el-icon>
                    复制解答
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 笔记识别 -->
        <el-tab-pane label="笔记识别" name="note">
          <div class="tab-content">
            <div class="feature-card">
              <div class="card-header">
                <el-icon class="feature-icon"><Notebook /></el-icon>
                <h3>笔记识别</h3>
                <p>将手写笔记转换为电子文本</p>
              </div>

              <div class="upload-section">
                <el-upload
                    class="upload-area"
                    drag
                    :auto-upload="false"
                    :on-change="handleNoteUpload"
                    :show-file-list="false"
                    accept="image/*"
                >
                  <div v-if="!noteImage" class="upload-placeholder">
                    <el-icon class="upload-icon"><UploadFilled /></el-icon>
                    <div class="upload-text">
                      <p>将笔记图片拖到此处，或<em>点击上传</em></p>
                      <p class="upload-tip">支持手写和打印文字识别</p>
                    </div>
                  </div>
                  <div v-else class="preview-image">
                    <img :src="noteImageUrl" alt="笔记图片" />
                    <div class="image-mask">
                      <el-button type="primary" circle @click.stop="reuploadNote">
                        <el-icon><RefreshRight /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </el-upload>

                <div class="action-buttons" v-if="noteImage">
                  <el-button
                      type="primary"
                      size="large"
                      @click="recognizeNote"
                      :loading="noteLoading"
                  >
                    <el-icon><MagicStick /></el-icon>
                    开始识别
                  </el-button>
                  <el-button size="large" @click="clearNote">清空</el-button>
                </div>
              </div>

              <div class="result-area" v-if="noteResult">
                <div class="result-header">
                  <el-icon class="result-icon"><CircleCheck /></el-icon>
                  <h4>识别结果</h4>
                  <el-tag type="info">{{ noteResult.wordsCount }}字</el-tag>
                </div>
                <div class="result-content note-content">
                  <el-input
                      v-model="noteResult.text"
                      type="textarea"
                      :rows="15"
                      placeholder="识别的文本内容"
                  />
                </div>
                <div class="result-actions">
                  <el-button @click="copyWithMessage(noteResult.text, ElMessage)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制文本
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 文档扫描 -->
        <el-tab-pane label="文档扫描" name="document">
          <div class="tab-content">
            <div class="feature-card">
              <div class="card-header">
                <el-icon class="feature-icon"><Document /></el-icon>
                <h3>文档扫描</h3>
                <p>扫描纸质文档，转换为电子版</p>
              </div>

              <div class="upload-section">
                <el-upload
                    class="upload-area"
                    drag
                    :auto-upload="false"
                    :on-change="handleDocUpload"
                    :show-file-list="false"
                    accept="image/*"
                    multiple
                >
                  <div v-if="docImages.length === 0" class="upload-placeholder">
                    <el-icon class="upload-icon"><UploadFilled /></el-icon>
                    <div class="upload-text">
                      <p>将文档图片拖到此处，或<em>点击上传</em></p>
                      <p class="upload-tip">支持多页文档批量上传</p>
                    </div>
                  </div>
                  <div v-else class="preview-images">
                    <div v-for="(img, index) in docImages" :key="index" class="preview-item">
                      <img :src="img.url" :alt="`文档页${index + 1}`" />
                      <div class="image-number">{{ index + 1 }}</div>
                      <el-button
                          type="danger"
                          circle
                          size="small"
                          class="delete-btn"
                          @click.stop="removeDocImage(index)"
                      >
                        <el-icon><Close /></el-icon>
                      </el-button>
                    </div>
                    <div class="add-more" @click="addMoreDoc">
                      <el-icon><Plus /></el-icon>
                      <span>添加更多</span>
                    </div>
                  </div>
                </el-upload>

                <div class="action-buttons" v-if="docImages.length > 0">
                  <el-button
                      type="primary"
                      size="large"
                      @click="recognizeDocument"
                      :loading="docLoading"
                  >
                    <el-icon><MagicStick /></el-icon>
                    开始扫描（{{ docImages.length }}页）
                  </el-button>
                  <el-button size="large" @click="clearDoc">清空</el-button>
                </div>
              </div>

              <div class="result-area" v-if="docResult">
                <div class="result-header">
                  <el-icon class="result-icon"><CircleCheck /></el-icon>
                  <h4>扫描结果</h4>
                  <el-tag type="info">{{ docResult.totalWords }}字 / {{ docResult.pages }}页</el-tag>
                </div>
                <div class="result-content doc-content">
                  <div v-for="(page, index) in docResult.pageTexts" :key="index" class="page-section">
                    <div class="page-header">第{{ index + 1 }}页</div>
                    <div class="page-text">{{ page }}</div>
                  </div>
                </div>
                <div class="result-actions">
                  <el-button @click="copyAllPages">
                    <el-icon><DocumentCopy /></el-icon>
                    复制全部
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 公式识别 -->
        <el-tab-pane label="公式识别" name="formula">
          <div class="tab-content">
            <div class="feature-card">
              <div class="card-header">
                <el-icon class="feature-icon"><DataAnalysis /></el-icon>
                <h3>公式识别</h3>
                <p>识别数学公式并转换为LaTeX格式</p>
              </div>

              <div class="upload-section">
                <el-upload
                    class="upload-area"
                    drag
                    :auto-upload="false"
                    :on-change="handleFormulaUpload"
                    :show-file-list="false"
                    accept="image/*"
                >
                  <div v-if="!formulaImage" class="upload-placeholder">
                    <el-icon class="upload-icon"><UploadFilled /></el-icon>
                    <div class="upload-text">
                      <p>将公式图片拖到此处，或<em>点击上传</em></p>
                      <p class="upload-tip">支持手写和打印公式</p>
                    </div>
                  </div>
                  <div v-else class="preview-image">
                    <img :src="formulaImageUrl" alt="公式图片" />
                    <div class="image-mask">
                      <el-button type="primary" circle @click.stop="reuploadFormula">
                        <el-icon><RefreshRight /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </el-upload>

                <div class="action-buttons" v-if="formulaImage">
                  <el-button
                      type="primary"
                      size="large"
                      @click="recognizeFormula"
                      :loading="formulaLoading"
                  >
                    <el-icon><MagicStick /></el-icon>
                    开始识别
                  </el-button>
                  <el-button size="large" @click="clearFormula">清空</el-button>
                </div>
              </div>

              <div class="result-area" v-if="formulaResult">
                <div class="result-section">
                  <div class="section-header">
                    <el-icon><Document /></el-icon>
                    <h4>识别的公式</h4>
                  </div>
                  <div class="section-content formula-display markdown-body" v-html="renderMarkdown(formulaResult.text)"></div>
                </div>

                <div class="result-section">
                  <div class="section-header">
                    <el-icon><Code /></el-icon>
                    <h4>LaTeX格式</h4>
                  </div>
                  <div class="section-content">
                    <el-input
                        v-model="formulaResult.latex"
                        type="textarea"
                        :rows="3"
                        readonly
                    />
                  </div>
                </div>

                <div class="result-actions">
                  <el-button @click="copyWithMessage(formulaResult.latex, ElMessage)">
                    <el-icon><DocumentCopy /></el-icon>
                    复制LaTeX
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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { renderMarkdown, copyWithMessage } from '@/composables/useMarkdownRenderer'

const API_BASE = 'http://localhost:3000/api/ai-science'

const activeTab = ref('question')

const questionImage = ref(null)
const questionImageUrl = ref('')
const questionLoading = ref(false)
const questionResult = ref(null)

const noteImage = ref(null)
const noteImageUrl = ref('')
const noteLoading = ref(false)
const noteResult = ref(null)

const docImages = ref([])
const docLoading = ref(false)
const docResult = ref(null)

const formulaImage = ref(null)
const formulaImageUrl = ref('')
const formulaLoading = ref(false)
const formulaResult = ref(null)

const handleQuestionUpload = (file) => {
  questionImage.value = file.raw
  questionImageUrl.value = URL.createObjectURL(file.raw)
}

const handleNoteUpload = (file) => {
  noteImage.value = file.raw
  noteImageUrl.value = URL.createObjectURL(file.raw)
}

const handleDocUpload = (file) => {
  docImages.value.push({
    file: file.raw,
    url: URL.createObjectURL(file.raw)
  })
}

const handleFormulaUpload = (file) => {
  formulaImage.value = file.raw
  formulaImageUrl.value = URL.createObjectURL(file.raw)
}

const recognizeQuestion = async () => {
  questionLoading.value = true
  try {
    const reader = new FileReader()
    reader.readAsDataURL(questionImage.value)
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1]

      const response = await axios.post(`${API_BASE}/ocr`, {
        imageBase64: base64
      })

      if (response.data.success) {
        const text = response.data.data.text
        questionResult.value = { text }

        const answerResponse = await axios.post(`${API_BASE}/chat`, {
          message: `请帮我解答这道题目，请用Markdown格式输出，如果有数学公式请用LaTeX格式（行内公式用$...$，块级公式用$$...$$）：\n\n${text}`
        })

        if (answerResponse.data.success) {
          questionResult.value.answer = answerResponse.data.data.reply
        }

        ElMessage.success('识别并解答完成！')
      } else {
        throw new Error(response.data.message)
      }
    }
  } catch (error) {
    console.error('识题错误:', error)
    ElMessage.error('识别失败，请重试')
  } finally {
    questionLoading.value = false
  }
}

const recognizeNote = async () => {
  noteLoading.value = true
  try {
    const reader = new FileReader()
    reader.readAsDataURL(noteImage.value)
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1]

      const response = await axios.post(`${API_BASE}/ocr`, {
        imageBase64: base64
      })

      if (response.data.success) {
        noteResult.value = {
          text: response.data.data.text,
          wordsCount: response.data.data.wordsCount || response.data.data.text.length
        }
        ElMessage.success('识别完成！')
      } else {
        throw new Error(response.data.message)
      }
    }
  } catch (error) {
    console.error('笔记识别错误:', error)
    ElMessage.error('识别失败，请重试')
  } finally {
    noteLoading.value = false
  }
}

const recognizeDocument = async () => {
  docLoading.value = true
  try {
    const pageTexts = []
    let totalWords = 0

    for (let i = 0; i < docImages.value.length; i++) {
      const reader = new FileReader()
      const result = await new Promise((resolve) => {
        reader.readAsDataURL(docImages.value[i].file)
        reader.onload = async () => {
          const base64 = reader.result.split(',')[1]
          const response = await axios.post(`${API_BASE}/ocr`, {
            imageBase64: base64
          })
          resolve(response.data)
        }
      })

      if (result.success) {
        pageTexts.push(result.data.text)
        totalWords += result.data.text.length
      }
    }

    docResult.value = {
      pageTexts,
      totalWords,
      pages: docImages.value.length
    }

    ElMessage.success('文档扫描完成！')
  } catch (error) {
    console.error('文档扫描错误:', error)
    ElMessage.error('扫描失败，请重试')
  } finally {
    docLoading.value = false
  }
}

const recognizeFormula = async () => {
  formulaLoading.value = true
  try {
    ElMessage.info('正在识别公式...')

    const reader = new FileReader()
    reader.readAsDataURL(formulaImage.value)
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1]

      const ocrResponse = await axios.post(`${API_BASE}/ocr`, {
        imageBase64: base64
      })

      if (!ocrResponse.data.success) {
        throw new Error(ocrResponse.data.message)
      }

      const ocrText = ocrResponse.data.data.text

      ElMessage.info('正在生成LaTeX格式...')

      const aiResponse = await axios.post(`${API_BASE}/chat`, {
        message: `请将以下OCR识别的数学公式转换为标准LaTeX格式。

OCR识别结果：
${ocrText}

输出要求：
1. 每个公式单独一行，格式为：【公式名称】LaTeX代码
2. LaTeX代码用 $$ $$ 包裹（独立公式）
3. 不要有任何解释性文字，只输出公式名称和LaTeX代码
4. 如果有多个公式，用空行分隔

示例输出：
【斯托克斯公式】
$$\\oint_C \\mathbf{A} \\cdot d\\mathbf{l} = \\iint_S (\\nabla \\times \\mathbf{A}) \\cdot d\\mathbf{S}$$

【高斯公式】
$$\\iiint_V (\\nabla \\cdot \\mathbf{F}) dV = \\iint_S \\mathbf{F} \\cdot d\\mathbf{S}$$`
      })

      if (aiResponse.data.success) {
        const aiText = aiResponse.data.data.reply.trim()

        formulaResult.value = {
          text: ocrText,
          latex: aiText
        }
        ElMessage.success('公式识别完成！')
      } else {
        formulaResult.value = {
          text: ocrText,
          latex: `$$${ocrText}$$`
        }
        ElMessage.warning('LaTeX生成失败，显示原始文本')
      }
    }
  } catch (error) {
    console.error('公式识别错误:', error)
    ElMessage.error('识别失败，请重试')
  } finally {
    formulaLoading.value = false
  }
}

const reuploadQuestion = () => {
  questionImage.value = null
  questionImageUrl.value = ''
  questionResult.value = null
}

const reuploadNote = () => {
  noteImage.value = null
  noteImageUrl.value = ''
  noteResult.value = null
}

const reuploadFormula = () => {
  formulaImage.value = null
  formulaImageUrl.value = ''
  formulaResult.value = null
}

const removeDocImage = (index) => {
  docImages.value.splice(index, 1)
}

const addMoreDoc = () => {
  document.querySelector('.upload-area input[type="file"]').click()
}

const clearQuestion = () => {
  questionImage.value = null
  questionImageUrl.value = ''
  questionResult.value = null
}

const clearNote = () => {
  noteImage.value = null
  noteImageUrl.value = ''
  noteResult.value = null
}

const clearDoc = () => {
  docImages.value = []
  docResult.value = null
}

const clearFormula = () => {
  formulaImage.value = null
  formulaImageUrl.value = ''
  formulaResult.value = null
}

const copyAllPages = () => {
  const allText = docResult.value.pageTexts.join('\n\n')
  copyWithMessage(allText, ElMessage)
}
</script>

<style scoped>
.ai-ocr-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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
  color: #4facfe;
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
  background: linear-gradient(135deg, #4facfe15 0%, #00f2fe15 100%);
  border-radius: 12px;
}

.feature-icon {
  font-size: 60px;
  color: #4facfe;
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

.upload-section {
  max-width: 700px;
  margin: 0 auto;
}

.upload-area {
  width: 100%;
  margin-bottom: 20px;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #4facfe;
  border-radius: 12px;
  background: #f5f7fa;
  transition: all 0.3s;
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: #00f2fe;
  background: #ecf5ff;
}

.upload-placeholder {
  text-align: center;
}

.upload-icon {
  font-size: 80px;
  color: #4facfe;
  margin-bottom: 20px;
}

.upload-text p {
  margin: 10px 0;
  font-size: 16px;
  color: #606266;
}

.upload-text em {
  color: #4facfe;
  font-style: normal;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

.preview-image {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image img {
  max-width: 100%;
  max-height: 380px;
  border-radius: 8px;
}

.image-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 8px;
}

.preview-image:hover .image-mask {
  opacity: 1;
}

.preview-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  padding: 20px;
}

.preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #dcdfe6;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-number {
  position: absolute;
  top: 5px;
  left: 5px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.delete-btn {
  position: absolute;
  top: 5px;
  right: 5px;
}

.add-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #4facfe;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: #f5f7fa;
}

.add-more:hover {
  border-color: #00f2fe;
  background: #ecf5ff;
}

.add-more .el-icon {
  font-size: 32px;
  color: #4facfe;
  margin-bottom: 5px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.result-area {
  margin-top: 40px;
  padding: 30px;
  background: #f5f7fa;
  border-radius: 12px;
  border-left: 4px solid #4facfe;
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

.result-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: #606266;
}

.section-content {
  padding: 15px;
  background: white;
  border-radius: 8px;
  line-height: 1.8;
}

.formula-display {
  font-size: 18px;
  font-family: 'Times New Roman', serif;
  text-align: center;
}

.result-content {
  padding: 20px;
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
}

.note-content :deep(.el-textarea__inner) {
  font-size: 14px;
  line-height: 1.8;
}

.doc-content {
  max-height: 500px;
  overflow-y: auto;
}

.page-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px dashed #dcdfe6;
}

.page-section:last-child {
  border-bottom: none;
}

.page-header {
  font-weight: 600;
  color: #4facfe;
  margin-bottom: 10px;
}

.page-text {
  line-height: 1.8;
  color: #606266;
}

.result-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* Markdown 样式 */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin-top: 16px;
  margin-bottom: 8px;
}

.markdown-body :deep(p) {
  margin: 8px 0;
}

.markdown-body :deep(ul), .markdown-body :deep(ol) {
  padding-left: 24px;
  margin: 8px 0;
}

.markdown-body :deep(pre) {
  background: #2d2d2d;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
}

.markdown-body :deep(code) {
  font-family: monospace;
}

.markdown-body :deep(.katex) {
  font-size: 1.1em;
}

.markdown-body :deep(.katex-display) {
  margin: 12px 0;
  overflow-x: auto;
}
</style>