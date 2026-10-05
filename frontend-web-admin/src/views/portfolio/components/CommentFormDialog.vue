<template>
  <!-- 新增/编辑弹窗 -->
  <el-dialog
    v-model="visible"
    :title="title"
    width="680px"
    :close-on-click-modal="false"
  >
    <el-form
      :ref="setFormRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item v-if="isTeacherOrAdmin && dialogMode === 'add'" label="选择学生" prop="studentId">
        <el-select
          v-model="formData.studentId"
          placeholder="请选择学生"
          style="width: 100%"
          filterable
        >
          <el-option
            v-for="stu in studentOptions"
            :key="stu.id"
            :label="`${stu.name} (${stu.studentNo})`"
            :value="stu.id"
          />
        </el-select>
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="学期" prop="semester">
            <el-select
              v-model="formData.semester"
              placeholder="请选择学期"
              style="width: 100%"
            >
              <el-option label="2024-2025学年第一学期" value="2024-2025-1" />
              <el-option label="2024-2025学年第二学期" value="2024-2025-2" />
              <el-option label="2023-2024学年第一学期" value="2023-2024-1" />
              <el-option label="2023-2024学年第二学期" value="2023-2024-2" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="评语类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择评语类型"
              style="width: 100%"
            >
              <el-option label="学期评语" value="semester" />
              <el-option label="月度评语" value="monthly" />
              <el-option label="事件评语" value="event" />
              <el-option label="综合评语" value="comprehensive" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="评语风格" prop="style">
        <el-radio-group v-model="formData.style">
          <el-radio value="formal">正式严谨</el-radio>
          <el-radio value="warm">温暖鼓励</el-radio>
          <el-radio value="concise">简洁明了</el-radio>
          <el-radio value="detailed">详细全面</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="isTeacherOrAdmin" label="来源" prop="source">
        <el-radio-group v-model="formData.source">
          <el-radio value="teacher">教师撰写</el-radio>
          <el-radio value="ai">AI生成</el-radio>
          <el-radio value="edited">AI+人工编辑</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="评语内容" prop="content">
        <el-input
          v-model="formData.content"
          type="textarea"
          :rows="10"
          placeholder="请输入评语内容..."
          maxlength="2000"
          show-word-limit
        />
      </el-form-item>

      <div v-if="isTeacherOrAdmin" class="ai-generate-section">
        <el-button type="success" :icon="MagicStick" :loading="aiGenerating" @click="$emit('ai-generate')">
          AI 生成评语
        </el-button>
        <span class="generate-tip">根据学生表现数据自动生成评语草稿</span>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="$emit('submit')">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { MagicStick } from '@element-plus/icons-vue'

const visible = defineModel({ type: Boolean, default: false })

defineProps({
  title: { type: String, default: '' },
  formData: { type: Object, default: () => ({}) },
  rules: { type: Object, default: () => ({}) },
  submitLoading: { type: Boolean, default: false },
  dialogMode: { type: String, default: 'add' },
  isTeacherOrAdmin: { type: Boolean, default: false },
  studentOptions: { type: Array, default: () => [] },
  aiGenerating: { type: Boolean, default: false },
  setFormRef: { type: Function, default: null }
})

defineEmits(['submit', 'close', 'ai-generate'])
</script>

<style scoped lang="scss">
.ai-generate-section {
  margin-left: 100px;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 12px;

  .generate-tip {
    font-size: 12px;
    color: #909399;
  }
}
</style>