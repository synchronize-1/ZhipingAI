<template>
  <!-- 优势学科/薄弱学科分析 -->
  <el-row :gutter="16" class="analysis-row">
    <el-col :lg="12" :md="24">
      <el-card shadow="never" class="analysis-card">
        <template #header>
          <div class="card-header">
            <el-icon color="#67c23a" :size="18"><Star /></el-icon>
            <span class="card-title">优势学科</span>
          </div>
        </template>
        <el-empty v-if="!advantageSubjects || advantageSubjects.length === 0" description="暂无数据" :image-size="60" />
        <div v-else class="subject-list">
          <div v-for="(item, index) in advantageSubjects" :key="index" class="subject-item">
            <div class="subject-info">
              <el-tag type="success" size="small" effect="light">{{ item.name }}</el-tag>
              <span class="subject-score">{{ item.score }}分</span>
            </div>
            <div class="subject-rank">
              <span>班级排名：{{ item.classRank }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :lg="12" :md="24">
      <el-card shadow="never" class="analysis-card">
        <template #header>
          <div class="card-header">
            <el-icon color="#f56c6c" :size="18"><WarningFilled /></el-icon>
            <span class="card-title">薄弱学科</span>
          </div>
        </template>
        <el-empty v-if="!weakSubjects || weakSubjects.length === 0" description="暂无数据" :image-size="60" />
        <div v-else class="subject-list">
          <div v-for="(item, index) in weakSubjects" :key="index" class="subject-item">
            <div class="subject-info">
              <el-tag type="danger" size="small" effect="light">{{ item.name }}</el-tag>
              <span class="subject-score">{{ item.score }}分</span>
            </div>
            <div class="subject-rank">
              <span>班级排名：{{ item.classRank }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
import { Star, WarningFilled } from '@element-plus/icons-vue'

defineProps({
  advantageSubjects: { type: Array, default: () => [] },
  weakSubjects: { type: Array, default: () => [] }
})
</script>

<style scoped lang="scss">
.analysis-row {
  margin-bottom: 16px;

  .analysis-card {
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;

      .card-title {
        font-weight: 600;
        font-size: 15px;
      }
    }

    .subject-list {
      .subject-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        background: #f5f7fa;
        border-radius: 6px;

        &:last-child {
          margin-bottom: 0;
        }

        .subject-info {
          display: flex;
          align-items: center;
          gap: 12px;

          .subject-score {
            font-weight: 600;
            font-size: 16px;
            color: #303133;
          }
        }

        .subject-rank {
          font-size: 13px;
          color: #909399;
        }
      }
    }
  }
}
</style>