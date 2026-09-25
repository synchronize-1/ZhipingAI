<template>
  <el-dialog
    :title="title"
    :visible="visible"
    :width="dialogWidth"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      :disabled="mode === 'view'"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="考试名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入考试名称" maxlength="50" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="考试类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择考试类型" style="width: 100%">
              <el-option label="月考" value="monthly" />
              <el-option label="期中考试" value="midterm" />
              <el-option label="期末考试" value="final" />
              <el-option label="模拟考试" value="mock" />
              <el-option label="单元测试" value="unit" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="年级" prop="grade">
            <el-select v-model="formData.grade" placeholder="请选择年级" style="width: 100%">
              <el-option label="一年级" value="grade1" />
              <el-option label="二年级" value="grade2" />
              <el-option label="三年级" value="grade3" />
              <el-option label="四年级" value="grade4" />
              <el-option label="五年级" value="grade5" />
              <el-option label="六年级" value="grade6" />
              <el-option label="七年级" value="grade7" />
              <el-option label="八年级" value="grade8" />
              <el-option label="九年级" value="grade9" />
              <el-option label="高一" value="grade10" />
              <el-option label="高二" value="grade11" />
              <el-option label="高三" value="grade12" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="学期" prop="semester">
            <el-select v-model="formData.semester" placeholder="请选择学期" style="width: 100%">
              <el-option label="第一学期" value="first" />
              <el-option label="第二学期" value="second" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="考试日期" prop="examDate">
            <el-date-picker
              v-model="formData.examDate"
              type="date"
              placeholder="请选择考试日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
              <el-option label="未开始" value="pending" />
              <el-option label="进行中" value="ongoing" />
              <el-option label="已结束" value="finished" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <!-- 考试科目管理 -->
      <el-divider content-position="left">考试科目</el-divider>

      <div v-if="mode !== 'view'" class="subject-toolbar">
        <el-button type="primary" size="small" :icon="Plus" @click="handleAddSubject">添加科目</el-button>
      </div>

      <el-table :data="formData.subjects" border stripe size="small">
        <el-table-column prop="subjectName" label="科目名称" min-width="120">
          <template #default="{ row, $index }">
            <el-select
              v-if="mode !== 'view'"
              v-model="row.subjectId"
              placeholder="请选择科目"
              size="small"
              style="width: 100%"
              @change="(val) => handleSubjectChange(val, $index)"
            >
              <el-option
                v-for="sub in subjectOptions"
                :key="sub.id"
                :label="sub.name"
                :value="sub.id"
              />
            </el-select>
            <span v-else>{{ row.subjectName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="fullScore" label="满分" width="120" align="center">
          <template #default="{ row }">
            <el-input-number
              v-if="mode !== 'view'"
              v-model="row.fullScore"
              :min="0"
              :max="1000"
              size="small"
              style="width: 100%"
            />
            <span v-else>{{ row.fullScore }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="passScore" label="及格分" width="120" align="center">
          <template #default="{ row }">
            <el-input-number
              v-if="mode !== 'view'"
              v-model="row.passScore"
              :min="0"
              :max="1000"
              size="small"
              style="width: 100%"
            />
            <span v-else>{{ row.passScore }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="考试时长(分钟)" width="160" align="center">
          <template #default="{ row }">
            <el-input-number
              v-if="mode !== 'view'"
              v-model="row.duration"
              :min="1"
              :max="600"
              size="small"
              style="width: 100%"
            />
            <span v-else>{{ row.duration }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="mode !== 'view'" label="操作" width="80" align="center" fixed="right">
          <template #default="{ $index }">
            <el-button type="danger" link size="small" @click="handleRemoveSubject($index)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!formData.subjects || formData.subjects.length === 0" description="暂无考试科目" :image-size="80" />
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button v-if="mode !== 'view'" type="primary" :loading="loading" @click="handleSubmit">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { subjectAPI } from '@/api/teaching'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  mode: {
    type: String,
    default: 'add' // add / edit / view
  },
  formData: {
    type: Object,
    default: () => ({
      id: null,
      name: '',
      type: '',
      grade: '',
      semester: '',
      examDate: '',
      status: 'pending',
      remark: '',
      subjects: []
    })
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit'])

const formRef = ref(null)
const subjectOptions = ref([])

const dialogWidth = computed(() => {
  return '800px'
})

const formRules = {
  name: [
    { required: true, message: '请输入考试名称', trigger: 'blur' },
    { max: 50, message: '考试名称不能超过50个字符', trigger: 'blur' }
  ],
  type: [{ required: true, message: '请选择考试类型', trigger: 'change' }],
  grade: [{ required: true, message: '请选择年级', trigger: 'change' }],
  semester: [{ required: true, message: '请选择学期', trigger: 'change' }],
  examDate: [{ required: true, message: '请选择考试日期', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 加载科目列表
const loadSubjectOptions = async () => {
  try {
    const res = await subjectAPI.allSimple()
    if (res.data) {
      subjectOptions.value = res.data
    }
  } catch (error) {
    console.error('加载科目列表失败:', error)
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    loadSubjectOptions()
    if (formRef.value) {
      formRef.value.clearValidate()
    }
  }
})

const handleSubjectChange = (subjectId, index) => {
  const subject = subjectOptions.value.find(s => s.id === subjectId)
  if (subject && props.formData.subjects[index]) {
    props.formData.subjects[index].subjectName = subject.name
    if (subject.fullScore !== undefined) {
      props.formData.subjects[index].fullScore = subject.fullScore
      props.formData.subjects[index].passScore = Math.round(subject.fullScore * 0.6)
    }
  }
}

const handleAddSubject = () => {
  props.formData.subjects.push({
    subjectId: '',
    subjectName: '',
    fullScore: 100,
    passScore: 60,
    duration: 120
  })
}

const handleRemoveSubject = (index) => {
  props.formData.subjects.splice(index, 1)
}

const handleClose = () => {
  emit('close')
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch (error) {
    ElMessage.warning('请完善表单信息')
    return
  }

  if (!props.formData.subjects || props.formData.subjects.length === 0) {
    ElMessage.warning('请至少添加一个考试科目')
    return
  }

  // 校验科目信息
  const invalidSubject = props.formData.subjects.find(s => !s.subjectId || !s.fullScore || !s.passScore || !s.duration)
  if (invalidSubject) {
    ElMessage.warning('请完善所有考试科目信息')
    return
  }

  emit('submit', { ...props.formData })
}
</script>

<style scoped lang="scss">
.subject-toolbar {
  margin-bottom: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
