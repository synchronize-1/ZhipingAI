<template>
  <!-- 薄弱科目识别与建议 -->
  <el-card shadow="never" class="suggestion-card">
    <template #header>
      <span class="chart-title">薄弱科目识别与学习建议</span>
    </template>
    <el-row :gutter="16">
      <el-col :md="12" :sm="24">
        <div class="weak-subjects">
          <h4>薄弱科目</h4>
          <el-empty v-if="!weakSubjects || weakSubjects.length === 0" description="暂无薄弱科目" :image-size="60" />
          <ul v-else>
            <li v-for="(item, index) in weakSubjects" :key="index">
              <el-tag type="danger" size="small">{{ item.name }}</el-tag>
              <span>平均分：{{ item.averageScore != null ? item.averageScore.toFixed(1) : '--' }}</span>
              <span>及格率：{{ item.passRate != null ? item.passRate.toFixed(1) + '%' : '--' }}</span>
            </li>
          </ul>
        </div>
      </el-col>
      <el-col :md="12" :sm="24">
        <div class="suggestions">
          <h4>学习建议</h4>
          <el-empty v-if="!suggestions || suggestions.length === 0" description="暂无建议" :image-size="60" />
          <ul v-else>
            <li v-for="(item, index) in suggestions" :key="index">
              <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup>
import { CircleCheckFilled } from '@element-plus/icons-vue'

defineProps({
  weakSubjects: { type: Array, default: () => [] },
  suggestions: { type: Array, default: () => [] }
})
</script>

<style scoped lang="scss">
.suggestion-card {
  margin-bottom: 16px;

  .chart-title {
    font-weight: 600;
    font-size: 15px;
  }

  .weak-subjects,
  .suggestions {
    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #606266;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        margin-bottom: 8px;
        background: #f5f7fa;
        border-radius: 4px;
        font-size: 14px;

        .el-icon {
          flex-shrink: 0;
        }
      }
    }
  }
}
</style>