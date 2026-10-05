<template>
  <!-- 筛选区 -->
  <el-card class="filter-card" shadow="never">
    <el-form :inline="true" :model="formModel" class="filter-form">
      <el-form-item label="选择考试">
        <el-select
          v-model="examId"
          placeholder="请选择考试"
          style="width: 220px"
          filterable
          @change="$emit('exam-change')"
        >
          <el-option
            v-for="exam in examList"
            :key="exam.id"
            :label="exam.name"
            :value="exam.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="选择班级">
        <el-select
          v-model="classId"
          placeholder="请选择班级"
          style="width: 200px"
          filterable
          @change="$emit('class-change')"
        >
          <el-option
            v-for="cls in classList"
            :key="cls.id"
            :label="cls.name"
            :value="cls.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" :loading="loading" @click="$emit('query')">查询</el-button>
        <el-button
          type="success"
          :icon="MagicStick"
          :disabled="!examId || !classId"
          @click="$emit('diagnose')"
        >
          AI 学情诊断
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { Search, MagicStick } from '@element-plus/icons-vue'

const examId = defineModel('examId', { default: '' })
const classId = defineModel('classId', { default: '' })

defineProps({
  examList: { type: Array, default: () => [] },
  classList: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

defineEmits(['query', 'exam-change', 'class-change', 'diagnose'])

const formModel = computed(() => ({ examId: examId.value, classId: classId.value }))
</script>

<style scoped lang="scss">
.filter-card {
  margin-bottom: 16px;
}
</style>