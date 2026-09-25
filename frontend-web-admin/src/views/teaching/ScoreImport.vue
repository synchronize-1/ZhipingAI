<template>
  <el-dialog
    title="成绩导入"
    :visible="visible"
    width="900px"
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
                <el-button type="primary" link size="small" @click="handleDownloadTemplate">
                  下载导入模板
                </el-button>
              </template>
            </el-alert>
          </div>

          <div class="preview-btn">
            <el-button
              type="primary"
              :disabled="!uploadedFile"
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
            <el-button type="primary" size="small" :icon="Plus" @click="handleAddRow">添加一行</el-button>
            <el-button size="small" :icon="Delete" @click="handleClearRows" :disabled="manualData.length === 0">
              清空
            </el-button>
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
              <el-table-column label="分数" min-width="150">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.score"
                    :min="0"
                    :max="150"
                    size="small"
                    :controls="false"
                    style="width: 100%"
                  />
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
    <div v-if="previewData.length > 0" class="preview-section">
      <el-divider content-position="left">数据预览</el-divider>

      <div class="preview-stats">
        <el-statistic title="总记录数" :value="previewData.length" />
        <el-statistic title="校验通过" :value="validCount" class="stat-success" />
        <el-statistic title="校验失败" :value="invalidCount" class="stat-danger" />
      </div>

      <div class="preview-table-wrapper">
        <el-table :data="previewData.slice(0, 20)" border stripe size="small" max-height="250">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="studentNo" label="学号" width="120" />
          <el-table-column prop="studentName" label="姓名" width="100" />
          <el-table-column prop="score" label="分数" width="100" align="center" />
          <el-table-column prop="status" label="校验状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="row.valid ? 'success' : 'danger'" size="small">
                {{ row.valid ? '通过' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="校验信息" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span :class="{ 'text-danger': !row.valid }">{{ row.message || '-' }}</span>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="previewData.length > 20" class="preview-more">
          仅显示前20条数据，共 {{ previewData.length }} 条记录
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
import { UploadFilled, Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { scoreAPI } from '@/api/teaching'

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
const previewData = ref([])
const manualData = ref([])

const formData = reactive({
  examId: '',
  classId: ''
})

const formRules = {
  examId: [{ required: true, message: '请选择考试', trigger: 'change' }],
  classId: [{ required: true, message: '请选择班级', trigger: 'change' }]
}

const validCount = computed(() => previewData.value.filter(item => item.valid).length)
const invalidCount = computed(() => previewData.value.filter(item => !item.valid).length)

const canImport = computed(() => {
  if (!formData.examId || !formData.classId) return false
  if (activeTab.value === 'excel') {
    return previewData.value.length > 0 && validCount.value > 0
  } else {
    return manualData.value.length > 0
  }
})

watch(() => props.visible, (val) => {
  if (val) {
    // 重置状态
    activeTab.value = 'excel'
    uploadedFile.value = null
    previewData.value = []
    manualData.value = []
  }
})

const handleFileChange = (file) => {
  uploadedFile.value = file.raw
  previewData.value = []
}

const handleFileRemove = () => {
  uploadedFile.value = null
  previewData.value = []
}

const handlePreview = async () => {
  if (!uploadedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  previewLoading.value = true
  try {
    // 模拟预览数据校验（实际项目中应调用后端解析接口）
    // 这里模拟一些预览数据
    const mockData = [
      { studentNo: '2024001', studentName: '张三', score: 95, valid: true, message: '' },
      { studentNo: '2024002', studentName: '李四', score: 88, valid: true, message: '' },
      { studentNo: '2024003', studentName: '王五', score: 76, valid: true, message: '' },
      { studentNo: '2024004', studentName: '赵六', score: 59, valid: true, message: '' },
      { studentNo: '2024005', studentName: '', score: 85, valid: false, message: '姓名不能为空' },
      { studentNo: '', studentName: '钱七', score: 92, valid: false, message: '学号不能为空' },
      { studentNo: '2024007', studentName: '孙八', score: -1, valid: false, message: '分数不能为负数' }
    ]
    previewData.value = mockData
  } catch (error) {
    ElMessage.error('文件解析失败')
  } finally {
    previewLoading.value = false
  }
}

const handleDownloadTemplate = () => {
  ElMessage.info('模板下载功能开发中...')
}

const handleAddRow = () => {
  manualData.value.push({
    studentNo: '',
    studentName: '',
    score: null
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

  let importData = []
  if (activeTab.value === 'excel') {
    if (previewData.value.length === 0) {
      ElMessage.warning('请先预览数据')
      return
    }
    importData = previewData.value.filter(item => item.valid)
    if (importData.length === 0) {
      ElMessage.warning('没有有效的数据可以导入')
      return
    }
  } else {
    if (manualData.value.length === 0) {
      ElMessage.warning('请添加至少一条数据')
      return
    }
    // 校验手动录入数据
    const invalid = manualData.value.find(item => !item.studentNo || !item.studentName || item.score === null)
    if (invalid) {
      ElMessage.warning('请完善所有录入数据')
      return
    }
    importData = manualData.value.map(item => ({
      ...item,
      valid: true,
      message: ''
    }))
  }

  importLoading.value = true
  try {
    await scoreAPI.import(formData.examId, {
      classId: formData.classId,
      scores: importData
    })
    ElMessage.success(`成功导入 ${importData.length} 条成绩数据`)
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
  }

  .manual-table-wrapper {
    width: 100%;
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
