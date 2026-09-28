<template>
  <el-dialog
    title="成绩导入"
    :visible="visible"
    width="1000px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="选择考试" prop="examId">
            <el-select
              v-model="formData.examId"
              placeholder="请选择考试"
              style="width: 100%"
              filterable
              @change="handleExamChange"
            >
              <el-option
                v-for="exam in examList"
                :key="exam.id"
                :label="exam.name"
                :value="exam.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="选择班级" prop="classId">
            <el-select
              v-model="formData.classId"
              placeholder="请选择班级"
              style="width: 100%"
              filterable
            >
              <el-option
                v-for="cls in classList"
                :key="cls.id"
                :label="cls.name"
                :value="cls.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-tabs v-model="activeTab" class="import-tabs">
      <el-tab-pane label="Excel导入" name="excel">
        <div class="upload-area">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept=".xlsx,.xls,.csv"
            drag
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将Excel文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .xlsx/.xls/.csv 格式，文件大小不超过 10MB
              </div>
            </template>
          </el-upload>

          <div class="template-tip">
            <el-alert
              title="导入模板说明"
              type="info"
              :closable="false"
              show-icon
            >
              <template #default>
                <p>Excel文件需包含以下列：学号、姓名、各科分数</p>
                <el-button
                  type="primary"
                  link
                  size="small"
                  :disabled="!canDownloadTemplate"
                  @click="handleDownloadTemplate"
                >
                  下载导入模板
                </el-button>
              </template>
            </el-alert>
          </div>

          <div class="preview-btn">
            <el-button
              type="primary"
              :disabled="!canPreview"
              :loading="previewLoading"
              @click="handlePreview"
            >
              预览数据
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="手动录入" name="manual">
        <div class="manual-area">
          <div class="manual-toolbar">
            <el-button type="primary" size="small" :icon="Plus" :disabled="!formData.examId" @click="handleAddRow">
              添加一行
            </el-button>
            <el-button size="small" :icon="Delete" @click="handleClearRows" :disabled="manualData.length === 0">
              清空
            </el-button>
            <el-alert
              v-if="!formData.examId"
              type="warning"
              :closable="false"
              show-icon
              size="small"
              title="请先选择考试以加载科目列表"
              style="display: inline-block; margin-left: 12px"
            />
          </div>

          <div class="manual-table-wrapper">
            <el-table :data="manualData" border stripe size="small" height="300">
              <el-table-column type="index" label="序号" width="60" align="center" />
              <el-table-column prop="studentNo" label="学号" width="120">
                <template #default="{ row }">
                  <el-input v-model="row.studentNo" size="small" placeholder="请输入学号" />
                </template>
              </el-table-column>
              <el-table-column prop="studentName" label="姓名" width="100">
                <template #default="{ row }">
                  <el-input v-model="row.studentName" size="small" placeholder="请输入姓名" />
                </template>
              </el-table-column>
              <el-table-column
                v-for="subject in examSubjects"
                :key="subject.id"
                :label="subject.name"
                min-width="110"
                align="center"
              >
                <template #default="{ row }">
                  <div class="manual-score-cell">
                    <el-input-number
                      v-model="getManualScore(row, subject.id).score"
                      :min="0"
                      :max="subject.fullScore || 150"
                      size="small"
                      :controls="false"
                      style="width: 80px"
                    />
                    <el-checkbox
                      v-model="getManualScore(row, subject.id).isAbsent"
                      size="small"
                      label="缺考"
                    />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center" fixed="right">
                <template #default="{ $index }">
                  <el-button type="danger" link size="small" @click="handleRemoveRow($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 数据预览和校验 -->
    <div v-if="previewData.rows && previewData.rows.length > 0" class="preview-section">
      <el-divider content-position="left">数据预览</el-divider>

      <div class="preview-stats">
        <el-statistic title="总记录数" :value="previewData.total" />
        <el-statistic title="校验通过" :value="previewData.validCount" class="stat-success" />
        <el-statistic title="校验失败" :value="previewData.invalidCount" class="stat-danger" />
      </div>

      <div class="preview-table-wrapper">
        <el-table :data="previewDisplayRows" border stripe size="small" max-height="300">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="studentNo" label="学号" width="120" fixed="left" />
          <el-table-column prop="studentName" label="姓名" width="100" fixed="left" />
          <el-table-column
            v-for="subject in previewSubjects"
            :key="subject.subjectId"
            :label="subject.subjectName"
            min-width="110"
            align="center"
          >
            <template #default="{ row }">
              <div class="score-cell">
                <span :class="{ 'text-danger': !getSubjectScore(row, subject.subjectId)?.valid }">
                  {{ formatScore(getSubjectScore(row, subject.subjectId)) }}
                </span>
                <el-tooltip
                  v-if="!getSubjectScore(row, subject.subjectId)?.valid && getSubjectScore(row, subject.subjectId)?.message"
                  :content="getSubjectScore(row, subject.subjectId).message"
                  placement="top"
                >
                  <el-icon class="error-icon"><WarningFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="校验状态" width="100" align="center" fixed="right">
            <template #default="{ row }">
              <el-tag :type="row.valid ? 'success' : 'danger'" size="small">
                {{ row.valid ? '通过' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="校验信息" min-width="160" show-overflow-tooltip fixed="right">
            <template #default="{ row }">
              <span :class="{ 'text-danger': !row.valid }">{{ row.message || '-' }}</span>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="previewData.total > 20" class="preview-more">
          仅显示前20条数据，共 {{ previewData.total }} 条记录
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :loading="importLoading"
          :disabled="!canImport"
          @click="handleConfirmImport"
        >
          确认导入
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { UploadFilled, Plus, Delete, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { scoreAPI, examAPI } from '@/api/teaching'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  examList: {
    type: Array,
    default: () => []
  },
  classList: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'success'])

const formRef = ref(null)
const uploadRef = ref(null)
const activeTab = ref('excel')
const uploadedFile = ref(null)
const previewLoading = ref(false)
const importLoading = ref(false)
const examSubjects = ref([])

// 预览数据
const previewData = ref({
  total: 0,
  validCount: 0,
  invalidCount: 0,
  rows: []
})

// 手动录入数据
const manualData = ref([])

const formData = reactive({
  examId: '',
  classId: ''
})

const formRules = {
  examId: [{ required: true, message: '请选择考试', trigger: 'change' }],
  classId: [{ required: true, message: '请选择班级', trigger: 'change' }]
}

// 预览中的科目列表（从第一条数据提取）
const previewSubjects = computed(() => {
  if (previewData.value.rows && previewData.value.rows.length > 0) {
    return previewData.value.rows[0].scores || []
  }
  return []
})

// 预览显示的行（最多20条）
const previewDisplayRows = computed(() => {
  return (previewData.value.rows || []).slice(0, 20)
})

const canDownloadTemplate = computed(() => {
  return formData.examId && formData.classId
})

const canPreview = computed(() => {
  return uploadedFile.value && formData.examId && formData.classId
})

const canImport = computed(() => {
  if (!formData.examId || !formData.classId) return false
  if (activeTab.value === 'excel') {
    return previewData.value.rows && previewData.value.rows.length > 0 && previewData.value.validCount > 0
  } else {
    return manualData.value.length > 0 && examSubjects.value.length > 0
  }
})

// 工具函数：从行数据中获取某科目的成绩对象
const getSubjectScore = (row, subjectId) => {
  return row.scores?.find(s => s.subjectId === subjectId)
}

// 格式化分数显示
const formatScore = (scoreObj) => {
  if (!scoreObj) return '-'
  if (scoreObj.isAbsent) return '缺考'
  if (scoreObj.score === null || scoreObj.score === undefined) return '-'
  return scoreObj.score
}

// 获取手动录入的某科目成绩（如果不存在则初始化）
const getManualScore = (row, subjectId) => {
  let score = row.scores.find(s => s.subjectId === subjectId)
  if (!score) {
    score = { subjectId, score: null, isAbsent: false }
    row.scores.push(score)
  }
  return score
}

// 下载 blob 文件
const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// 从 Content-Disposition 中提取文件名
const extractFilename = (response, defaultName) => {
  const disposition = response.headers?.['content-disposition']
  if (disposition) {
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (match && match[1]) {
      const filename = match[1].replace(/['"]/g, '')
      return decodeURIComponent(filename)
    }
  }
  return defaultName
}

// 加载考试科目
const loadExamSubjects = async (examId) => {
  if (!examId) {
    examSubjects.value = []
    return
  }
  try {
    const res = await examAPI.detail(examId)
    if (res.data?.subjects) {
      examSubjects.value = res.data.subjects
    } else if (Array.isArray(res.data)) {
      examSubjects.value = res.data
    } else {
      examSubjects.value = []
    }
  } catch (error) {
    console.error('加载考试科目失败:', error)
    examSubjects.value = []
  }
}

// 考试切换
const handleExamChange = () => {
  examSubjects.value = []
  previewData.value = { total: 0, validCount: 0, invalidCount: 0, rows: [] }
  manualData.value = []
  if (formData.examId) {
    loadExamSubjects(formData.examId)
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    // 重置状态
    activeTab.value = 'excel'
    uploadedFile.value = null
    previewData.value = { total: 0, validCount: 0, invalidCount: 0, rows: [] }
    manualData.value = []
    examSubjects.value = []
    // 如果有默认考试，加载科目
    if (formData.examId) {
      loadExamSubjects(formData.examId)
    }
  }
})

const handleFileChange = (file) => {
  uploadedFile.value = file.raw
  previewData.value = { total: 0, validCount: 0, invalidCount: 0, rows: [] }
}

const handleFileRemove = () => {
  uploadedFile.value = null
  previewData.value = { total: 0, validCount: 0, invalidCount: 0, rows: [] }
}

const handlePreview = async () => {
  if (!uploadedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }
  if (!formData.examId || !formData.classId) {
    ElMessage.warning('请先选择考试和班级')
    return
  }

  previewLoading.value = true
  try {
    const res = await scoreAPI.preview(uploadedFile.value, formData.examId, formData.classId)
    if (res.code === 0 && res.data) {
      previewData.value = {
        total: res.data.total || 0,
        validCount: res.data.validCount || 0,
        invalidCount: res.data.invalidCount || 0,
        rows: res.data.rows || []
      }
      ElMessage.success(`预览成功，共 ${res.data.total} 条记录`)
    }
  } catch (error) {
    ElMessage.error('文件解析失败，请检查文件格式')
  } finally {
    previewLoading.value = false
  }
}

const handleDownloadTemplate = async () => {
  if (!formData.examId || !formData.classId) {
    ElMessage.warning('请先选择考试和班级')
    return
  }
  try {
    const res = await scoreAPI.downloadTemplate(formData.examId, formData.classId)
    const filename = extractFilename(res, '成绩导入模板.xlsx')
    downloadBlob(res.data, filename)
    ElMessage.success('模板下载成功')
  } catch (error) {
    ElMessage.error('模板下载失败')
  }
}

const handleAddRow = () => {
  if (!formData.examId) {
    ElMessage.warning('请先选择考试')
    return
  }
  const scores = examSubjects.value.map(sub => ({
    subjectId: sub.id,
    score: null,
    isAbsent: false
  }))
  manualData.value.push({
    studentNo: '',
    studentName: '',
    scores
  })
}

const handleRemoveRow = (index) => {
  manualData.value.splice(index, 1)
}

const handleClearRows = () => {
  manualData.value = []
}

const validateForm = async () => {
  try {
    await formRef.value.validate()
    return true
  } catch (error) {
    ElMessage.warning('请完善表单信息')
    return false
  }
}

const handleConfirmImport = async () => {
  if (!await validateForm()) return

  let importRows = []

  if (activeTab.value === 'excel') {
    if (!previewData.value.rows || previewData.value.rows.length === 0) {
      ElMessage.warning('请先预览数据')
      return
    }
    if (previewData.value.validCount === 0) {
      ElMessage.warning('没有有效的数据可以导入')
      return
    }
    // 过滤有效行，构造导入格式
    importRows = previewData.value.rows
      .filter(row => row.valid)
      .map(row => ({
        studentId: row.studentId,
        studentNo: row.studentNo,
        scores: row.scores
          .filter(s => s.valid)
          .map(s => ({
            subjectId: s.subjectId,
            score: s.score,
            isAbsent: s.isAbsent || false
          }))
      }))
  } else {
    if (manualData.value.length === 0) {
      ElMessage.warning('请添加至少一条数据')
      return
    }
    // 校验手动录入数据
    const invalid = manualData.value.find(item => !item.studentNo || !item.studentName)
    if (invalid) {
      ElMessage.warning('请完善学号和姓名信息')
      return
    }
    // 构造导入格式
    importRows = manualData.value.map(item => ({
      studentNo: item.studentNo,
      scores: item.scores.map(s => ({
        subjectId: s.subjectId,
        score: s.score,
        isAbsent: s.isAbsent || false
      }))
    }))
  }

  if (importRows.length === 0) {
    ElMessage.warning('没有有效的数据可以导入')
    return
  }

  importLoading.value = true
  try {
    await scoreAPI.importFromRows(formData.examId, formData.classId, importRows)
    ElMessage.success(`成功导入 ${importRows.length} 条成绩数据`)
    emit('success')
  } catch (error) {
    ElMessage.error('导入失败，请重试')
  } finally {
    importLoading.value = false
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped lang="scss">
.import-tabs {
  margin-top: 10px;
}

.upload-area {
  padding: 10px 0;

  .template-tip {
    margin-top: 16px;
  }

  .preview-btn {
    margin-top: 16px;
    text-align: center;
  }
}

.manual-area {
  padding: 10px 0;

  .manual-toolbar {
    margin-bottom: 12px;
    display: flex;
    align-items: center;
  }

  .manual-table-wrapper {
    width: 100%;
  }

  .manual-score-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
}

.preview-section {
  margin-top: 10px;

  .preview-stats {
    display: flex;
    gap: 40px;
    margin-bottom: 16px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 4px;

    .stat-success {
      :deep(.el-statistic__content) {
        color: #67c23a;
      }
    }

    .stat-danger {
      :deep(.el-statistic__content) {
        color: #f56c6c;
      }
    }
  }

  .preview-table-wrapper {
    .preview-more {
      margin-top: 8px;
      text-align: center;
      color: #909399;
      font-size: 12px;
    }
  }

  .score-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;

    .error-icon {
      color: #f56c6c;
      cursor: help;
    }
  }
}

.text-danger {
  color: #f56c6c;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
