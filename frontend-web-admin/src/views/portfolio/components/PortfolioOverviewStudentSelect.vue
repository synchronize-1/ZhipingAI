<template>
  <!-- 学生选择器（教师/管理员可见） -->
  <el-card shadow="never" class="student-select-card">
    <el-form :inline="true" :model="selectForm" class="select-form">
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
      <el-form-item label="班级">
        <el-select
          v-model="classId"
          placeholder="请选择班级"
          style="width: 180px"
          clearable
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
    </el-form>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'

const studentId = defineModel('studentId', { default: '' })
const classId = defineModel('classId', { default: '' })

defineProps({
  studentOptions: { type: Array, default: () => [] },
  classList: { type: Array, default: () => [] }
})

defineEmits(['student-change', 'class-change'])

const selectForm = computed(() => ({ studentId: studentId.value, classId: classId.value }))
</script>

<style scoped lang="scss">
.student-select-card {
  margin-bottom: 16px;
}
</style>