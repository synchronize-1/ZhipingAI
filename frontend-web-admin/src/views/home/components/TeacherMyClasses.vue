<template>
  <div class="content-card my-classes">
    <div class="card-header">
      <div class="header-left">
        <div class="header-icon blue">
          <el-icon><School /></el-icon>
        </div>
        <div>
          <h3>我的班级</h3>
          <p>共 {{ myClasses.length }} 个班级</p>
        </div>
      </div>
      <el-button type="primary" text @click="$router.push('/teaching/class-manage')">
        全部
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
    </div>
    <div v-if="myClasses.length > 0" class="classes-grid">
      <div v-for="cls in myClasses" :key="cls.classId" class="class-card-item">
        <div class="class-card-header">
          <span class="class-name">{{ cls.className }}</span>
          <el-tag size="small" type="info">{{ cls.grade }}</el-tag>
        </div>
        <div class="class-card-body">
          <span class="class-student-count">{{ cls.studentCount }} 名学生</span>
          <span class="class-head-teacher">班主任：{{ cls.headTeacherName || '—' }}</span>
        </div>
      </div>
    </div>
    <div v-else class="empty-todo">
      <el-icon><SuccessFilled /></el-icon>
      <span>暂无班级数据</span>
    </div>
  </div>
</template>

<script setup>
import { School, ArrowRight, SuccessFilled } from '@element-plus/icons-vue'

defineOptions({ name: 'TeacherMyClasses' })

defineProps({
  myClasses: { type: Array, default: () => [] }
})
</script>

<style scoped>
/* 内容卡片 */
.content-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
  color: white;
  font-size: 20px;
}

.header-icon.blue { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }

.header-left h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.header-left p {
  margin: 2px 0 0 0;
  font-size: 13px;
  color: #6b7280;
}

/* 空状态 */
.empty-todo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px;
  color: #9ca3af;
  font-size: 13px;
}

/* 我的班级 */
.classes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.class-card-item {
  background: #f9fafb;
  border-radius: 12px;
  padding: 14px;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.class-card-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.class-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.class-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.class-card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.class-student-count {
  font-weight: 500;
  color: #4b5563;
}
</style>