<template>
  <!-- 筛选区 -->
  <el-card shadow="never" class="filter-card">
    <!-- 学生选择器（教师/管理员可见） -->
    <el-form v-if="!isStudentRole" :inline="true" :model="studentSelectForm" class="student-select-form">
      <el-form-item label="选择学生">
        <el-select
          v-model="studentId"
          placeholder="请选择学生"
          style="width: 260px"
          filterable
          clearable
          @change="$emit('student-change')"
        >
          <el-option
            v-for="stu in studentOptions"
            :key="stu.id"
            :label="`${stu.name} (${stu.studentNo})`"
            :value="stu.id"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <SearchForm
      :fields="searchFields"
      :model-value="searchParams"
      @search="$emit('search')"
      @reset="$emit('reset')"
    />
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import SearchForm from '@/components/common/SearchForm.vue'

const studentId = defineModel('studentId', { default: '' })

const props = defineProps({
  isStudentRole: { type: Boolean, default: false },
  studentOptions: { type: Array, default: () => [] },
  searchFields: { type: Array, default: () => [] },
  searchParams: { type: Object, default: () => ({}) }
})

defineEmits(['student-change', 'search', 'reset'])

const studentSelectForm = computed(() => ({ studentId: studentId.value }))
</script>

<style scoped lang="scss">
.filter-card {
  margin-bottom: 16px;

  .student-select-form {
    margin-bottom: 8px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
  }
}
</style>