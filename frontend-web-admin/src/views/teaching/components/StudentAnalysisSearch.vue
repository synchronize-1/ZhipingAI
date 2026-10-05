<template>
  <el-card class="search-card" shadow="never">
    <el-form :inline="true" :model="formModel" class="search-form">
      <el-form-item label="学号/姓名">
        <el-input
          v-model="keyword"
          placeholder="请输入学号或姓名"
          style="width: 220px"
          clearable
        />
      </el-form-item>
      <el-form-item label="班级">
        <el-select
          v-model="classId"
          placeholder="请选择班级"
          style="width: 180px"
          filterable
          clearable
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
        <el-button type="primary" :icon="Search" :loading="searchLoading" @click="$emit('search')">
          搜索
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 学生选择列表 -->
    <div v-if="studentList.length > 0" class="student-select-list">
      <el-radio-group v-model="selectedStudentId" @change="$emit('student-change')">
        <el-radio-button
          v-for="stu in studentList"
          :key="stu.id"
          :value="stu.id"
        >
          {{ stu.studentName }} ({{ stu.studentNo }})
        </el-radio-button>
      </el-radio-group>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { Search } from '@element-plus/icons-vue'

const keyword = defineModel('keyword', { type: String, default: '' })
const classId = defineModel('classId', { default: '' })
const selectedStudentId = defineModel('selectedStudentId', { default: '' })

defineProps({
  classList: { type: Array, default: () => [] },
  studentList: { type: Array, default: () => [] },
  searchLoading: { type: Boolean, default: false }
})

defineEmits(['search', 'student-change'])

const formModel = computed(() => ({ keyword: keyword.value, classId: classId.value }))
</script>

<style scoped lang="scss">
.search-card {
  margin-bottom: 16px;

  .student-select-list {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #ebeef5;
  }
}
</style>