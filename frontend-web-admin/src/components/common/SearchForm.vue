<template>
  <el-form
    ref="formRef"
    :model="formModel"
    :inline="inline"
    :label-width="labelWidth"
    :label-position="labelPosition"
    :size="size"
    class="search-form"
    @submit.prevent
  >
    <el-row :gutter="gutter">
      <el-col
        v-for="field in fields"
        :key="field.prop"
        :span="getColSpan(field)"
        :xs="field.xs || 24"
        :sm="field.sm || 12"
        :md="field.md || 8"
        :lg="field.lg || 6"
        :xl="field.xl || 6"
      >
        <el-form-item :label="field.label" :prop="field.prop">
          <!-- input 输入框 -->
          <el-input
            v-if="field.type === 'input' || !field.type"
            v-model="formModel[field.prop]"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :clearable="field.clearable !== false"
            :prefix-icon="field.prefixIcon"
            :suffix-icon="field.suffixIcon"
            :type="field.inputType || 'text'"
            :disabled="field.disabled"
            :maxlength="field.maxlength"
            :show-word-limit="field.showWordLimit"
          />

          <!-- select 选择器 -->
          <el-select
            v-else-if="field.type === 'select'"
            v-model="formModel[field.prop]"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :clearable="field.clearable !== false"
            :disabled="field.disabled"
            :multiple="field.multiple"
            :filterable="field.filterable"
            :remote="field.remote"
            :remote-method="field.remoteMethod"
            :loading="field.loading"
            :reserve-keyword="field.reserveKeyword"
            style="width: 100%"
          >
            <el-option
              v-for="opt in field.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
              :disabled="opt.disabled"
            />
          </el-select>

          <!-- date-picker 日期选择 -->
          <el-date-picker
            v-else-if="field.type === 'date'"
            v-model="formModel[field.prop]"
            :type="field.dateType || 'date'"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :clearable="field.clearable !== false"
            :disabled="field.disabled"
            :value-format="field.valueFormat || 'YYYY-MM-DD'"
            :format="field.format || 'YYYY-MM-DD'"
            :start-placeholder="field.startPlaceholder"
            :end-placeholder="field.endPlaceholder"
            :range-separator="field.rangeSeparator || '至'"
            :shortcuts="field.shortcuts"
            style="width: 100%"
          />

          <!-- time-picker 时间选择 -->
          <el-time-picker
            v-else-if="field.type === 'time'"
            v-model="formModel[field.prop]"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :clearable="field.clearable !== false"
            :disabled="field.disabled"
            :value-format="field.valueFormat || 'HH:mm:ss'"
            :format="field.format || 'HH:mm:ss'"
            :is-range="field.isRange"
            :start-placeholder="field.startPlaceholder"
            :end-placeholder="field.endPlaceholder"
            :range-separator="field.rangeSeparator || '至'"
            style="width: 100%"
          />

          <!-- number 数字输入框 -->
          <el-input-number
            v-else-if="field.type === 'number'"
            v-model="formModel[field.prop]"
            :min="field.min"
            :max="field.max"
            :step="field.step || 1"
            :precision="field.precision"
            :disabled="field.disabled"
            :controls="field.controls !== false"
            :controls-position="field.controlsPosition"
            style="width: 100%"
          />

          <!-- switch 开关 -->
          <el-switch
            v-else-if="field.type === 'switch'"
            v-model="formModel[field.prop]"
            :disabled="field.disabled"
            :active-text="field.activeText"
            :inactive-text="field.inactiveText"
            :active-value="field.activeValue !== undefined ? field.activeValue : true"
            :inactive-value="field.inactiveValue !== undefined ? field.inactiveValue : false"
          />

          <!-- radio 单选 -->
          <el-radio-group
            v-else-if="field.type === 'radio'"
            v-model="formModel[field.prop]"
            :disabled="field.disabled"
          >
            <el-radio
              v-for="opt in field.options"
              :key="opt.value"
              :label="opt.value"
              :disabled="opt.disabled"
              :border="field.border"
            >
              {{ opt.label }}
            </el-radio>
          </el-radio-group>

          <!-- checkbox 多选 -->
          <el-checkbox-group
            v-else-if="field.type === 'checkbox'"
            v-model="formModel[field.prop]"
            :disabled="field.disabled"
          >
            <el-checkbox
              v-for="opt in field.options"
              :key="opt.value"
              :label="opt.value"
              :disabled="opt.disabled"
              :border="field.border"
            >
              {{ opt.label }}
            </el-checkbox>
          </el-checkbox-group>

          <!-- cascader 级联选择 -->
          <el-cascader
            v-else-if="field.type === 'cascader'"
            v-model="formModel[field.prop]"
            :options="field.options"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :clearable="field.clearable !== false"
            :disabled="field.disabled"
            :props="field.cascaderProps"
            :filterable="field.filterable"
            style="width: 100%"
          />

          <!-- 自定义插槽 -->
          <template v-else-if="field.slot">
            <slot :name="field.slot" :field="field" :model="formModel" />
          </template>
        </el-form-item>
      </el-col>

      <!-- 操作按钮列 -->
      <el-col
        v-if="showButtons"
        :span="getColSpan({ span: buttonColSpan })"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
        :xl="6"
      >
        <el-form-item class="search-form__actions">
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">
            重置
          </el-button>
          <slot name="extra-btn" />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search, RefreshLeft } from '@element-plus/icons-vue'

const props = defineProps({
  // 字段配置 [{ prop, label, type, options, placeholder, ... }]
  fields: {
    type: Array,
    default: () => []
  },
  // 表单数据（v-model）
  modelValue: {
    type: Object,
    default: () => ({})
  },
  // 是否内联布局
  inline: {
    type: Boolean,
    default: false
  },
  // 标签宽度
  labelWidth: {
    type: [String, Number],
    default: '90px'
  },
  // 标签位置
  labelPosition: {
    type: String,
    default: 'right'
  },
  // 表单尺寸
  size: {
    type: String,
    default: 'default'
  },
  // 栅格间距
  gutter: {
    type: Number,
    default: 16
  },
  // 是否显示搜索/重置按钮
  showButtons: {
    type: Boolean,
    default: true
  },
  // 按钮列的栅格数
  buttonColSpan: {
    type: [Number, String],
    default: 6
  },
  // 搜索按钮加载状态
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['search', 'reset', 'update:modelValue'])

// 表单 ref
const formRef = ref(null)

// 内部表单数据
const formModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 获取列跨度
const getColSpan = (field) => {
  return field.span || field.col || 6
}

// 搜索
const handleSearch = () => {
  emit('search', { ...formModel.value })
}

// 重置
const handleReset = () => {
  const resetData = {}
  props.fields.forEach(field => {
    if (field.type === 'checkbox' || field.multiple) {
      resetData[field.prop] = field.defaultValue || []
    } else if (field.type === 'switch') {
      resetData[field.prop] = field.defaultValue !== undefined
        ? field.defaultValue
        : (field.inactiveValue !== undefined ? field.inactiveValue : false)
    } else if (field.type === 'number') {
      resetData[field.prop] = field.defaultValue !== undefined ? field.defaultValue : undefined
    } else if (field.type === 'date' && field.dateType === 'daterange') {
      resetData[field.prop] = field.defaultValue || []
    } else {
      resetData[field.prop] = field.defaultValue !== undefined ? field.defaultValue : ''
    }
  })
  emit('update:modelValue', resetData)
  emit('reset')
}

// 暴露方法
defineExpose({
  formRef,
  validate: () => formRef.value?.validate(),
  resetFields: () => formRef.value?.resetFields(),
  clearValidate: () => formRef.value?.clearValidate(),
  submit: handleSearch,
  reset: handleReset
})
</script>

<style scoped lang="scss">
.search-form {
  &__actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
