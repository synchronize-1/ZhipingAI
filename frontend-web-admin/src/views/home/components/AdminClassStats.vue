<template>
  <!-- 班级统计卡片 -->
  <div class="content-card class-stats">
    <div class="card-header">
      <div class="header-left">
        <div class="header-icon green">
          <el-icon><School /></el-icon>
        </div>
        <div>
          <h3>班级统计</h3>
          <p>前 {{ classStats.length }} 个班级</p>
        </div>
      </div>
      <el-button type="primary" text size="small" @click="$router.push('/teaching/class-manage')">
        全部
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
    </div>
    <div v-if="classStats.length > 0" class="class-stats-list">
      <div v-for="cls in classStats.slice(0, 8)" :key="cls.classId" class="class-stat-item">
        <div class="class-stat-info">
          <span class="class-stat-name">{{ cls.className }}</span>
          <span class="class-stat-meta">
            <el-tag size="small" type="info">{{ cls.grade }}</el-tag>
            <span>{{ cls.studentCount }}人</span>
          </span>
        </div>
      </div>
    </div>
    <div v-else class="empty-warning">
      <el-icon><SuccessFilled /></el-icon>
      <span>暂无班级数据</span>
    </div>
  </div>
</template>

<script setup>
import { School, ArrowRight, SuccessFilled } from '@element-plus/icons-vue'

defineProps({
  classStats: { type: Array, default: () => [] }
})
</script>

<style scoped>
/* 内容卡片 */
.content-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  color: #1f2937;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-header .header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.header-icon.green { background: linear-gradient(135deg, #11998e, #38ef7d); }

.card-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.card-header p {
  margin: 1px 0 0 0;
  font-size: 11px;
  color: #6b7280;
}

/* 班级统计 */
.class-stats-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.class-stat-item {
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 8px;
  transition: all 0.2s;
}

.class-stat-item:hover {
  background: #f1f5f9;
}

.class-stat-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.class-stat-name {
  font-size: 12px;
  font-weight: 500;
  color: #1e293b;
}

.class-stat-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #6b7280;
}

.empty-warning {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  color: #9ca3af;
  font-size: 12px;
}
</style>