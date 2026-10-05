<template>
  <!-- 新增/编辑弹窗 -->
  <el-dialog
    v-model="visible"
    :title="title"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-form
      :ref="setFormRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="测评类型" prop="assessmentType">
        <el-select
          v-model="formData.assessmentType"
          placeholder="请选择测评类型"
          style="width: 100%"
        >
          <el-option label="心理健康综合测评" value="comprehensive" />
          <el-option label="情绪状态测评" value="emotion" />
          <el-option label="压力水平测评" value="stress" />
          <el-option label="睡眠质量测评" value="sleep" />
          <el-option label="焦虑自评量表" value="anxiety" />
          <el-option label="抑郁自评量表" value="depression" />
        </el-select>
      </el-form-item>

      <el-form-item label="测评日期" prop="assessmentDate">
        <el-date-picker
          v-model="formData.assessmentDate"
          type="date"
          placeholder="请选择测评日期"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="总得分" prop="totalScore">
            <el-input-number
              v-model="formData.totalScore"
              :min="0"
              :max="100"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="压力水平" prop="stressLevel">
            <el-select
              v-model="formData.stressLevel"
              placeholder="请选择"
              style="width: 100%"
            >
              <el-option label="压力较低" value="low" />
              <el-option label="压力适中" value="medium" />
              <el-option label="压力较高" value="high" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="情绪指数" prop="emotionIndex">
            <el-input-number
              v-model="formData.emotionIndex"
              :min="0"
              :max="100"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="睡眠质量" prop="sleepQuality">
            <el-input-number
              v-model="formData.sleepQuality"
              :min="0"
              :max="100"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="焦虑水平" prop="anxietyLevel">
            <el-input-number
              v-model="formData.anxietyLevel"
              :min="0"
              :max="100"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="抑郁水平" prop="depressionLevel">
            <el-input-number
              v-model="formData.depressionLevel"
              :min="0"
              :max="100"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="人际敏感" prop="interpersonalSensitivity">
            <el-input-number
              v-model="formData.interpersonalSensitivity"
              :min="0"
              :max="100"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="生活适应" prop="lifeAdaptation">
            <el-input-number
              v-model="formData.lifeAdaptation"
              :min="0"
              :max="100"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="测评备注" prop="notes">
        <el-input
          v-model="formData.notes"
          type="textarea"
          :rows="3"
          placeholder="请输入测评备注"
          maxlength="300"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="建议指导" prop="suggestion">
        <el-input
          v-model="formData.suggestion"
          type="textarea"
          :rows="3"
          placeholder="请输入建议与指导"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
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
const visible = defineModel({ type: Boolean, default: false })

defineProps({
  title: { type: String, default: '' },
  formData: { type: Object, default: () => ({}) },
  rules: { type: Object, default: () => ({}) },
  submitLoading: { type: Boolean, default: false },
  setFormRef: { type: Function, default: null }
})

defineEmits(['submit', 'close'])
</script>