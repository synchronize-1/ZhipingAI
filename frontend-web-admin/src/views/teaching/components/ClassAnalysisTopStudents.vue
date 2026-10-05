<template>
  <el-card shadow="never" class="chart-card">
    <template #header>
      <span class="chart-title">班级排名前10</span>
    </template>
    <el-table :data="topStudents" size="small" border stripe>
      <el-table-column type="index" label="排名" width="60" align="center" />
      <el-table-column prop="studentName" label="姓名" min-width="90" />
      <el-table-column prop="totalScore" label="总分" width="80" align="center" />
      <el-table-column prop="avgScore" label="平均分" width="80" align="center" />
      <el-table-column prop="classRank" label="班级排名" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.classRank <= 3 ? 'success' : 'info'" size="small">{{ row.classRank }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
defineProps({
  topStudents: { type: Array, default: () => [] }
})
</script>

<style scoped lang="scss">
.chart-card {
  height: 100%;

  .chart-title {
    font-weight: 600;
    font-size: 15px;
  }
}
</style>