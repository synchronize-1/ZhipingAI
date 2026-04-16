<template>
  <div class="schedule-page">
    <!-- 页面头部 -->
    <div class="schedule-header">
      <div class="header-content">
        <div class="header-left">
          <h1>📅 课表管理</h1>
          <p>{{ isAdmin ? '管理学生课表信息' : '查看我的课程安排' }}</p>
        </div>
        <div class="header-right">
          <!-- 管理员可选择学生 -->
          <el-select v-if="isAdmin" v-model="selectedStudent" placeholder="选择学生" class="student-select" clearable @change="fetchSchedule">
            <el-option v-for="s in studentList" :key="s.id" :label="`${s.name} (${s.student_id})`" :value="s.id" />
          </el-select>
          <div class="week-nav">
            <el-button :icon="ArrowLeft" @click="changeWeek(-1)" circle />
            <span class="week-text">第 {{ currentWeek }} 周</span>
            <el-button :icon="ArrowRight" @click="changeWeek(1)" circle />
          </div>
          <el-button type="primary" @click="goToToday">返回本周</el-button>
          <el-button type="success" @click="exportToPDF">
            <el-icon><Download /></el-icon>
            导出PDF
          </el-button>
        </div>
      </div>
    </div>

    <!-- 课表主体 -->
    <div class="schedule-container">
      <div class="schedule-grid">
        <!-- 表头 -->
        <div class="grid-header">
          <div class="time-header">时间/星期</div>
          <div v-for="day in weekDays" :key="day.value" class="day-header" :class="{ 'today': isToday(day.value) }">
            <span class="day-name">{{ day.label }}</span>
            <span class="day-date">{{ getDayDate(day.value) }}</span>
          </div>
        </div>

        <!-- 课程格子 -->
        <div v-for="slot in timeSlots" :key="slot.id" class="grid-row">
          <div class="time-cell">
            <span class="slot-num">第{{ slot.id }}节</span>
            <span class="slot-time">{{ slot.time }}</span>
          </div>
          <div v-for="day in weekDays" :key="day.value" class="course-cell" :class="{ 'today-col': isToday(day.value) }">
            <div v-for="course in getScheduleAt(day.value, slot.id)" :key="course.id"
                 class="course-card" :style="{ background: getCourseColor(course.course_id) }"
                 @click="showCourseDetail(course)">
              <div class="course-name">{{ course.course_name }}</div>
              <div class="course-room">📍 {{ course.room_name }}</div>
              <div class="course-teacher">👨‍🏫 {{ course.teacher_name }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 课程详情弹窗 -->
    <el-dialog v-model="showDetailDialog" title="" width="520px" class="course-dialog" :show-close="true">
      <div v-if="selectedCourse" class="course-detail">
        <div class="detail-header" :style="{ background: getCourseColor(selectedCourse.course_id) }">
          <h2>{{ selectedCourse.course_name }}</h2>
          <p class="course-code">课程编号: {{ getCourseCode(selectedCourse.course_id) }}</p>
        </div>
        <div class="detail-body">
          <div class="detail-section">
            <h4>📚 课程信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">上课地点</span>
                <span class="value">{{ selectedCourse.room_name }}</span>
              </div>
              <div class="detail-item">
                <span class="label">授课教师</span>
                <span class="value">{{ selectedCourse.teacher_name }}</span>
              </div>
              <div class="detail-item">
                <span class="label">上课时间</span>
                <span class="value">{{ getWeekDayName(selectedCourse.day_of_week) }} 第{{ selectedCourse.slot }}节</span>
              </div>
              <div class="detail-item">
                <span class="label">具体时段</span>
                <span class="value">{{ getSlotTime(selectedCourse.slot) }}</span>
              </div>
            </div>
          </div>
          <div class="detail-section">
            <h4>📝 课程简介</h4>
            <p class="course-desc">{{ getCourseDesc(selectedCourse.course_id) }}</p>
          </div>
          <div class="detail-section">
            <h4>📊 学分与考核</h4>
            <div class="detail-tags">
              <el-tag type="primary">{{ getCourseCredits(selectedCourse.course_id) }} 学分</el-tag>
              <el-tag type="success">平时成绩 40%</el-tag>
              <el-tag type="warning">期末考试 60%</el-tag>
            </div>
          </div>
        </div>
        <div class="detail-footer">
          <el-button @click="showDetailDialog = false">关闭</el-button>
          <el-button type="success" v-if="isTeacher" @click="startClassCheckin(selectedCourse)">
            <el-icon><Check /></el-icon> 发起签到
          </el-button>
          <el-button type="warning" v-if="isTeacher" @click="openClassInteraction(selectedCourse)">
            <el-icon><ChatDotRound /></el-icon> 课堂互动
          </el-button>
          <el-button type="primary" v-if="isAdmin" @click="editCourse(selectedCourse)">编辑课程</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, ArrowRight, Download, Check, ChatDotRound } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import api from '@/api'

defineOptions({ name: 'Schedule' })

const userStore = useUserStore()
const isAdmin = computed(() => userStore.user?.role === 'admin' || userStore.user?.role === 'teacher')
const isTeacher = computed(() => userStore.user?.role === 'teacher' || userStore.user?.role === 'admin')

const currentWeek = ref(1)
const schedules = ref([])
const selectedStudent = ref(null)
const showDetailDialog = ref(false)
const selectedCourse = ref(null)

// 学生列表（管理员使用）
const studentList = ref([
  { id: 1, student_id: '2024001001', name: '李明轩' },
  { id: 2, student_id: '2024001002', name: '张雨晴' },
  { id: 3, student_id: '2024001003', name: '陈伟杰' },
  { id: 4, student_id: '2023002001', name: '林思琪' },
  { id: 5, student_id: '2023002002', name: '黄俊豪' },
  { id: 6, student_id: '2024001004', name: '吴雪梅' },
  { id: 7, student_id: '2023001001', name: '周子轩' },
  { id: 8, student_id: '2022001001', name: '赵晓彤' }
])

const weekDays = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 }
]

const timeSlots = [
  { id: 1, time: '08:00-08:45' },
  { id: 2, time: '08:55-09:40' },
  { id: 3, time: '10:00-10:45' },
  { id: 4, time: '10:55-11:40' },
  { id: 5, time: '14:00-14:45' },
  { id: 6, time: '14:55-15:40' },
  { id: 7, time: '16:00-16:45' },
  { id: 8, time: '16:55-17:40' },
  { id: 9, time: '19:00-19:45' },
  { id: 10, time: '19:55-20:40' }
]

const colors = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
]

const isToday = (dayValue) => {
  return new Date().getDay() === dayValue || (new Date().getDay() === 0 && dayValue === 7)
}

const getDayDate = (dayValue) => {
  const today = new Date()
  const currentDay = today.getDay() || 7
  const diff = dayValue - currentDay
  const date = new Date(today)
  date.setDate(today.getDate() + diff)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const getScheduleAt = (day, slot) => {
  return schedules.value.filter(s => {
    const courseSlot = s.slot || getSlotFromTime(s.start_time)
    return s.day_of_week === day && courseSlot === slot
  })
}

const getSlotFromTime = (time) => {
  if (!time) return 1
  const hour = parseInt(time.split(':')[0])
  if (hour < 9) return 1
  if (hour < 10) return 2
  if (hour < 11) return 3
  if (hour < 12) return 4
  if (hour < 15) return 5
  if (hour < 16) return 6
  if (hour < 17) return 7
  if (hour < 18) return 8
  if (hour < 20) return 9
  return 10
}

const getSlotTime = (slot) => {
  const slotObj = timeSlots.find(s => s.id === slot)
  return slotObj ? slotObj.time : ''
}

const getWeekDayName = (day) => {
  const dayObj = weekDays.find(d => d.value === day)
  return dayObj ? dayObj.label : ''
}

const getCourseColor = (courseId) => colors[courseId % colors.length]

// 课程详情辅助函数
const courseInfo = {
  1: { code: 'CS201', desc: '本课程系统介绍数据结构的基本概念、常用数据结构及其算法实现，培养学生分析问题和解决问题的能力。', credits: 4 },
  2: { code: 'CS301', desc: '介绍计算机网络的基本原理、体系结构、协议和应用，包括TCP/IP协议族、网络安全等内容。', credits: 3 },
  3: { code: 'CS302', desc: '讲解操作系统的基本原理，包括进程管理、内存管理、文件系统和设备管理等核心内容。', credits: 4 },
  4: { code: 'CS303', desc: '系统讲解关系数据库理论、SQL语言、数据库设计和数据库管理系统的实现技术。', credits: 3 },
  5: { code: 'SE201', desc: '介绍软件开发的方法学、软件生命周期、需求分析、设计模式和项目管理等内容。', credits: 3 },
  6: { code: 'AI101', desc: '介绍人工智能的基本概念、搜索算法、机器学习、神经网络和自然语言处理等前沿技术。', credits: 3 },
  7: { code: 'MATH101', desc: '系统学习极限、导数、积分等微积分基础知识，培养数学思维和计算能力。', credits: 5 },
  8: { code: 'MATH201', desc: '讲解矩阵运算、向量空间、线性变换、特征值与特征向量等代数学基础内容。', credits: 3 },
  9: { code: 'ENG104', desc: '提高学生英语听说读写能力，通过四级考试为目标，强化语法和词汇学习。', credits: 2 },
  10: { code: 'PE101', desc: '增强学生体质，培养运动兴趣和终身锻炼的习惯，提高身体素质。', credits: 1 },
  11: { code: 'POL101', desc: '学习马克思主义基本原理，培养学生正确的世界观、人生观和价值观。', credits: 2 },
  12: { code: 'MATH202', desc: '概率论与数理统计是研究随机现象统计规律性的数学学科。', credits: 3 },
  13: { code: 'CS401', desc: '编译原理讲解程序设计语言的编译过程，包括词法分析、语法分析、语义分析等。', credits: 4 },
  14: { code: 'CS205', desc: 'Web前端开发课程涵盖HTML、CSS、JavaScript及Vue等现代前端框架。', credits: 3 }
}

const getCourseCode = (courseId) => courseInfo[courseId]?.code || `C${courseId}`
const getCourseDesc = (courseId) => courseInfo[courseId]?.desc || '暂无课程简介'
const getCourseCredits = (courseId) => courseInfo[courseId]?.credits || 2

const changeWeek = (delta) => {
  currentWeek.value = Math.max(1, Math.min(20, currentWeek.value + delta))
  fetchSchedule()
}

const goToToday = () => {
  currentWeek.value = 1
  fetchSchedule()
}

const showCourseDetail = (course) => {
  selectedCourse.value = course
  showDetailDialog.value = true
}

const editCourse = (course) => {
  ElMessage.info('编辑课程功能开发中')
  showDetailDialog.value = false
}

const deleteCourse = (course) => {
  ElMessage.warning('删除课程功能开发中')
  showDetailDialog.value = false
}

// 导出PDF功能
const exportToPDF = () => {
  ElMessage.success('正在生成课表PDF，请在弹出窗口中选择"另存为PDF"...')
  
  const studentName = selectedStudent.value 
    ? studentList.value.find(s => s.id === selectedStudent.value)?.name || '学生'
    : '我的'
  
  // 生成HTML内容
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${studentName}课表 - 第${currentWeek.value}周</title>
      <style>
        body { font-family: 'Microsoft YaHei', sans-serif; padding: 20px; margin: 0; }
        h1 { text-align: center; color: #333; margin-bottom: 20px; }
        .info { text-align: center; color: #666; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 12px 8px; text-align: center; vertical-align: middle; }
        th { background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-weight: bold; }
        .course { background: #f0f4ff; padding: 8px; border-radius: 6px; margin: 2px 0; }
        .course-name { font-weight: bold; font-size: 13px; color: #333; }
        .course-info { font-size: 11px; color: #666; margin-top: 4px; }
        @media print { 
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } 
          @page { margin: 1cm; }
        }
      </style>
    </head>
    <body>
      <h1>📅 ${studentName}课表</h1>
      <div class="info">第 ${currentWeek.value} 周 | 智界·灵动校园</div>
      <table>
        <thead>
          <tr>
            <th>时间</th>
            <th>周一</th>
            <th>周二</th>
            <th>周三</th>
            <th>周四</th>
            <th>周五</th>
          </tr>
        </thead>
        <tbody>`
  
  // 生成表格内容
  timeSlots.forEach(slot => {
    htmlContent += `<tr><td><strong>第${slot.id}节</strong><br><small>${slot.time}</small></td>`
    weekDays.forEach(day => {
      const courses = getScheduleAt(day.value, slot.id)
      if (courses.length > 0) {
        htmlContent += '<td>'
        courses.forEach(c => {
          htmlContent += `<div class="course">
            <div class="course-name">${c.course_name}</div>
            <div class="course-info">📍${c.room_name}</div>
            <div class="course-info">👨‍🏫${c.teacher_name}</div>
          </div>`
        })
        htmlContent += '</td>'
      } else {
        htmlContent += '<td>-</td>'
      }
    })
    htmlContent += '</tr>'
  })
  
  htmlContent += `
        </tbody>
      </table>
    </body>
    </html>`
  
  // 创建打印窗口
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    ElMessage.error('请允许弹出窗口以导出PDF')
    return
  }
  
  printWindow.document.open()
  printWindow.document.write(htmlContent)
  printWindow.document.close()
  
  // 等待内容加载完成后打印
  setTimeout(() => {
    printWindow.focus()
    printWindow.print()
  }, 500)
}

const fetchSchedule = async () => {
  // 原神大王（student001）的课表数据
  const student001Schedule = [
    // 周一
    { id: 1, course_id: 1, course_name: '数据结构与算法', teacher_name: '陈教授', room_name: '教A-301', day_of_week: 1, slot: 1 },
    { id: 2, course_id: 1, course_name: '数据结构与算法', teacher_name: '陈教授', room_name: '教A-301', day_of_week: 1, slot: 2 },
    { id: 3, course_id: 2, course_name: '计算机网络', teacher_name: '刘老师', room_name: '教B-205', day_of_week: 1, slot: 3 },
    { id: 4, course_id: 2, course_name: '计算机网络', teacher_name: '刘老师', room_name: '教B-205', day_of_week: 1, slot: 4 },
    { id: 5, course_id: 7, course_name: '高等数学(上)', teacher_name: '周教授', room_name: '教D-201', day_of_week: 1, slot: 5 },
    { id: 6, course_id: 7, course_name: '高等数学(上)', teacher_name: '周教授', room_name: '教D-201', day_of_week: 1, slot: 6 },
    // 周二
    { id: 7, course_id: 3, course_name: '操作系统原理', teacher_name: '王教授', room_name: '教A-402', day_of_week: 2, slot: 1 },
    { id: 8, course_id: 3, course_name: '操作系统原理', teacher_name: '王教授', room_name: '教A-402', day_of_week: 2, slot: 2 },
    { id: 9, course_id: 12, course_name: '概率论与数理统计', teacher_name: '吴老师', room_name: '教D-301', day_of_week: 2, slot: 3 },
    { id: 10, course_id: 12, course_name: '概率论与数理统计', teacher_name: '吴老师', room_name: '教D-301', day_of_week: 2, slot: 4 },
    { id: 11, course_id: 4, course_name: '数据库系统概论', teacher_name: '张教授', room_name: '教C-101', day_of_week: 2, slot: 5 },
    { id: 12, course_id: 4, course_name: '数据库系统概论', teacher_name: '张教授', room_name: '教C-101', day_of_week: 2, slot: 6 },
    // 周三
    { id: 13, course_id: 1, course_name: '数据结构与算法', teacher_name: '王教授', room_name: '教A-301', day_of_week: 3, slot: 1 },
    { id: 14, course_id: 1, course_name: '数据结构与算法', teacher_name: '王教授', room_name: '教A-301', day_of_week: 3, slot: 2 },
    { id: 15, course_id: 2, course_name: '计算机网络', teacher_name: '李教授', room_name: '教B-205', day_of_week: 3, slot: 3 },
    { id: 16, course_id: 2, course_name: '计算机网络', teacher_name: '李教授', room_name: '教B-205', day_of_week: 3, slot: 4 },
    { id: 17, course_id: 3, course_name: '操作系统原理', teacher_name: '张教授', room_name: '教A-401', day_of_week: 3, slot: 5 },
    { id: 18, course_id: 3, course_name: '操作系统原理', teacher_name: '张教授', room_name: '教A-401', day_of_week: 3, slot: 6 },
    { id: 19, course_id: 5, course_name: '软件工程导论', teacher_name: '刘教授', room_name: '教C-102', day_of_week: 3, slot: 7 },
    { id: 20, course_id: 5, course_name: '软件工程导论', teacher_name: '刘教授', room_name: '教C-102', day_of_week: 3, slot: 8 },
    // 周四
    { id: 21, course_id: 8, course_name: '线性代数', teacher_name: '吴老师', room_name: '教D-105', day_of_week: 4, slot: 1 },
    { id: 22, course_id: 8, course_name: '线性代数', teacher_name: '吴老师', room_name: '教D-105', day_of_week: 4, slot: 2 },
    { id: 23, course_id: 2, course_name: '计算机网络', teacher_name: '刘老师', room_name: '教B-205', day_of_week: 4, slot: 3 },
    { id: 24, course_id: 2, course_name: '计算机网络', teacher_name: '刘老师', room_name: '教B-205', day_of_week: 4, slot: 4 },
    { id: 25, course_id: 10, course_name: '体育(篮球)', teacher_name: '马老师', room_name: '体育馆', day_of_week: 4, slot: 5 },
    { id: 26, course_id: 10, course_name: '体育(篮球)', teacher_name: '马老师', room_name: '体育馆', day_of_week: 4, slot: 6 },
    // 周五
    { id: 27, course_id: 9, course_name: '大学英语(四)', teacher_name: '陈老师', room_name: '外语楼-201', day_of_week: 5, slot: 1 },
    { id: 28, course_id: 9, course_name: '大学英语(四)', teacher_name: '陈老师', room_name: '外语楼-201', day_of_week: 5, slot: 2 },
    { id: 29, course_id: 14, course_name: 'Web前端开发', teacher_name: '李老师', room_name: '实验楼C-301', day_of_week: 5, slot: 3 },
    { id: 30, course_id: 14, course_name: 'Web前端开发', teacher_name: '李老师', room_name: '实验楼C-301', day_of_week: 5, slot: 4 },
    { id: 31, course_id: 6, course_name: '人工智能导论', teacher_name: '赵教授', room_name: '教A-501', day_of_week: 5, slot: 5 },
    { id: 32, course_id: 6, course_name: '人工智能导论', teacher_name: '赵教授', room_name: '教A-501', day_of_week: 5, slot: 6 }
  ]
  
  // 不同学生的课表数据
  const allSchedules = {
    1: [ // 李明轩
      { id: 1, course_id: 1, course_name: '数据结构与算法', teacher_name: '陈教授', room_name: '教学楼A-301', day_of_week: 1, slot: 1 },
      { id: 2, course_id: 1, course_name: '数据结构与算法', teacher_name: '陈教授', room_name: '教学楼A-301', day_of_week: 1, slot: 2 },
      { id: 3, course_id: 2, course_name: '计算机网络', teacher_name: '刘老师', room_name: '教学楼B-205', day_of_week: 1, slot: 3 },
      { id: 4, course_id: 7, course_name: '高等数学(上)', teacher_name: '周教授', room_name: '教学楼D-201', day_of_week: 1, slot: 5 },
      { id: 5, course_id: 3, course_name: '操作系统原理', teacher_name: '王教授', room_name: '教学楼A-402', day_of_week: 2, slot: 1 },
      { id: 6, course_id: 3, course_name: '操作系统原理', teacher_name: '王教授', room_name: '教学楼A-402', day_of_week: 2, slot: 2 },
      { id: 7, course_id: 4, course_name: '数据库系统概论', teacher_name: '张教授', room_name: '教学楼C-101', day_of_week: 2, slot: 5 },
      { id: 8, course_id: 11, course_name: '思想政治', teacher_name: '何老师', room_name: '教学楼E-102', day_of_week: 3, slot: 1 },
      { id: 9, course_id: 5, course_name: '软件工程', teacher_name: '李老师', room_name: '教学楼B-302', day_of_week: 3, slot: 3 },
      { id: 10, course_id: 8, course_name: '线性代数', teacher_name: '吴老师', room_name: '教学楼D-105', day_of_week: 4, slot: 1 },
      { id: 11, course_id: 10, course_name: '体育(篮球)', teacher_name: '马老师', room_name: '体育馆', day_of_week: 4, slot: 5 },
      { id: 12, course_id: 9, course_name: '大学英语(四)', teacher_name: '陈老师', room_name: '外语楼-201', day_of_week: 5, slot: 1 },
      { id: 13, course_id: 6, course_name: '人工智能导论', teacher_name: '赵教授', room_name: '教学楼A-501', day_of_week: 5, slot: 5 }
    ],
    2: [ // 张雨晴
      { id: 1, course_id: 14, course_name: 'Web前端开发', teacher_name: '李老师', room_name: '实验楼C-301', day_of_week: 1, slot: 1 },
      { id: 2, course_id: 14, course_name: 'Web前端开发', teacher_name: '李老师', room_name: '实验楼C-301', day_of_week: 1, slot: 2 },
      { id: 3, course_id: 7, course_name: '高等数学(上)', teacher_name: '周教授', room_name: '教学楼D-201', day_of_week: 1, slot: 5 },
      { id: 4, course_id: 12, course_name: '概率论与数理统计', teacher_name: '吴老师', room_name: '教学楼D-301', day_of_week: 2, slot: 3 },
      { id: 5, course_id: 4, course_name: '数据库系统概论', teacher_name: '张教授', room_name: '教学楼C-101', day_of_week: 2, slot: 5 },
      { id: 6, course_id: 5, course_name: '软件工程', teacher_name: '李老师', room_name: '教学楼B-302', day_of_week: 3, slot: 3 },
      { id: 7, course_id: 7, course_name: '高等数学(上)', teacher_name: '周教授', room_name: '教学楼D-201', day_of_week: 3, slot: 5 },
      { id: 8, course_id: 2, course_name: '计算机网络', teacher_name: '刘老师', room_name: '教学楼B-205', day_of_week: 4, slot: 3 },
      { id: 9, course_id: 10, course_name: '体育(羽毛球)', teacher_name: '马老师', room_name: '体育馆', day_of_week: 4, slot: 5 },
      { id: 10, course_id: 9, course_name: '大学英语(四)', teacher_name: '陈老师', room_name: '外语楼-201', day_of_week: 5, slot: 1 },
      { id: 11, course_id: 15, course_name: '创新创业实践', teacher_name: '张老师', room_name: '创新楼-101', day_of_week: 5, slot: 7 }
    ],
    3: [ // 陈伟杰
      { id: 1, course_id: 1, course_name: '数据结构与算法', teacher_name: '陈教授', room_name: '教学楼A-301', day_of_week: 1, slot: 1 },
      { id: 2, course_id: 2, course_name: '计算机网络', teacher_name: '刘老师', room_name: '教学楼B-205', day_of_week: 1, slot: 3 },
      { id: 3, course_id: 13, course_name: '编译原理', teacher_name: '孙教授', room_name: '教学楼A-201', day_of_week: 2, slot: 1 },
      { id: 4, course_id: 3, course_name: '操作系统原理', teacher_name: '王教授', room_name: '教学楼A-402', day_of_week: 2, slot: 3 },
      { id: 5, course_id: 11, course_name: '思想政治', teacher_name: '何老师', room_name: '教学楼E-102', day_of_week: 3, slot: 1 },
      { id: 6, course_id: 6, course_name: '人工智能导论', teacher_name: '赵教授', room_name: '教学楼A-501', day_of_week: 3, slot: 5 },
      { id: 7, course_id: 8, course_name: '线性代数', teacher_name: '吴老师', room_name: '教学楼D-105', day_of_week: 4, slot: 1 },
      { id: 8, course_id: 10, course_name: '体育(足球)', teacher_name: '马老师', room_name: '足球场', day_of_week: 4, slot: 5 },
      { id: 9, course_id: 9, course_name: '大学英语(四)', teacher_name: '陈老师', room_name: '外语楼-201', day_of_week: 5, slot: 1 },
      { id: 10, course_id: 14, course_name: 'Web前端开发', teacher_name: '李老师', room_name: '实验楼C-301', day_of_week: 5, slot: 3 }
    ],
    4: [ // 林思琪
      { id: 1, course_id: 7, course_name: '高等数学(上)', teacher_name: '周教授', room_name: '教学楼D-201', day_of_week: 1, slot: 1 },
      { id: 2, course_id: 12, course_name: '概率论与数理统计', teacher_name: '吴老师', room_name: '教学楼D-301', day_of_week: 1, slot: 3 },
      { id: 3, course_id: 8, course_name: '线性代数', teacher_name: '吴老师', room_name: '教学楼D-105', day_of_week: 2, slot: 1 },
      { id: 4, course_id: 11, course_name: '思想政治', teacher_name: '何老师', room_name: '教学楼E-102', day_of_week: 2, slot: 3 },
      { id: 5, course_id: 9, course_name: '大学英语(四)', teacher_name: '陈老师', room_name: '外语楼-201', day_of_week: 3, slot: 1 },
      { id: 6, course_id: 7, course_name: '高等数学(上)', teacher_name: '周教授', room_name: '教学楼D-201', day_of_week: 3, slot: 3 },
      { id: 7, course_id: 10, course_name: '体育(瑜伽)', teacher_name: '李老师', room_name: '体育馆', day_of_week: 4, slot: 5 },
      { id: 8, course_id: 16, course_name: '选修：心理学', teacher_name: '郑老师', room_name: '教学楼F-201', day_of_week: 5, slot: 3 }
    ],
    5: [ // 黄俊豪
      { id: 1, course_id: 1, course_name: '数据结构与算法', teacher_name: '陈教授', room_name: '教学楼A-301', day_of_week: 1, slot: 1 },
      { id: 2, course_id: 3, course_name: '操作系统原理', teacher_name: '王教授', room_name: '教学楼A-402', day_of_week: 1, slot: 3 },
      { id: 3, course_id: 6, course_name: '人工智能导论', teacher_name: '赵教授', room_name: '教学楼A-501', day_of_week: 2, slot: 1 },
      { id: 4, course_id: 4, course_name: '数据库系统概论', teacher_name: '张教授', room_name: '教学楼C-101', day_of_week: 2, slot: 3 },
      { id: 5, course_id: 5, course_name: '软件工程', teacher_name: '李老师', room_name: '教学楼B-302', day_of_week: 3, slot: 1 },
      { id: 6, course_id: 13, course_name: '编译原理', teacher_name: '孙教授', room_name: '教学楼A-201', day_of_week: 3, slot: 3 },
      { id: 7, course_id: 2, course_name: '计算机网络', teacher_name: '刘老师', room_name: '教学楼B-205', day_of_week: 4, slot: 1 },
      { id: 8, course_id: 10, course_name: '体育(游泳)', teacher_name: '马老师', room_name: '游泳馆', day_of_week: 4, slot: 5 },
      { id: 9, course_id: 9, course_name: '大学英语(四)', teacher_name: '陈老师', room_name: '外语楼-201', day_of_week: 5, slot: 1 },
      { id: 10, course_id: 14, course_name: 'Web前端开发', teacher_name: '李老师', room_name: '实验楼C-301', day_of_week: 5, slot: 5 }
    ],
    6: [ // 吴雪梅
      { id: 1, course_id: 9, course_name: '大学英语(四)', teacher_name: '陈老师', room_name: '外语楼-201', day_of_week: 1, slot: 1 },
      { id: 2, course_id: 7, course_name: '高等数学(上)', teacher_name: '周教授', room_name: '教学楼D-201', day_of_week: 1, slot: 3 },
      { id: 3, course_id: 11, course_name: '思想政治', teacher_name: '何老师', room_name: '教学楼E-102', day_of_week: 2, slot: 1 },
      { id: 4, course_id: 8, course_name: '线性代数', teacher_name: '吴老师', room_name: '教学楼D-105', day_of_week: 2, slot: 3 },
      { id: 5, course_id: 5, course_name: '软件工程', teacher_name: '李老师', room_name: '教学楼B-302', day_of_week: 3, slot: 1 },
      { id: 6, course_id: 4, course_name: '数据库系统概论', teacher_name: '张教授', room_name: '教学楼C-101', day_of_week: 3, slot: 3 },
      { id: 7, course_id: 10, course_name: '体育(健美操)', teacher_name: '李老师', room_name: '体育馆', day_of_week: 4, slot: 5 },
      { id: 8, course_id: 16, course_name: '选修：艺术鉴赏', teacher_name: '王老师', room_name: '艺术楼-301', day_of_week: 5, slot: 3 }
    ],
    7: [ // 周子轩 - 计算机专业大三
      { id: 1, course_id: 6, course_name: '人工智能导论', teacher_name: '赵教授', room_name: '教学楼A-501', day_of_week: 1, slot: 1 },
      { id: 2, course_id: 1, course_name: '数据结构与算法', teacher_name: '陈教授', room_name: '教学楼A-301', day_of_week: 1, slot: 3 },
      { id: 3, course_id: 17, course_name: '机器学习基础', teacher_name: '钱教授', room_name: '教学楼A-601', day_of_week: 1, slot: 7 },
      { id: 4, course_id: 17, course_name: '机器学习基础', teacher_name: '钱教授', room_name: '教学楼A-601', day_of_week: 1, slot: 8 },
      { id: 5, course_id: 13, course_name: '编译原理', teacher_name: '孙教授', room_name: '教学楼A-201', day_of_week: 2, slot: 1 },
      { id: 6, course_id: 3, course_name: '操作系统原理', teacher_name: '王教授', room_name: '教学楼A-402', day_of_week: 2, slot: 3 },
      { id: 7, course_id: 18, course_name: '计算机图形学', teacher_name: '郭教授', room_name: '实验楼D-201', day_of_week: 2, slot: 7 },
      { id: 8, course_id: 2, course_name: '计算机网络', teacher_name: '刘老师', room_name: '教学楼B-205', day_of_week: 3, slot: 1 },
      { id: 9, course_id: 4, course_name: '数据库系统概论', teacher_name: '张教授', room_name: '教学楼C-101', day_of_week: 3, slot: 3 },
      { id: 10, course_id: 19, course_name: '专业英语', teacher_name: '外教John', room_name: '外语楼-301', day_of_week: 3, slot: 9 },
      { id: 11, course_id: 14, course_name: 'Web前端开发', teacher_name: '李老师', room_name: '实验楼C-301', day_of_week: 4, slot: 1 },
      { id: 12, course_id: 10, course_name: '体育(乒乓球)', teacher_name: '马老师', room_name: '体育馆', day_of_week: 4, slot: 5 },
      { id: 13, course_id: 20, course_name: '项目实训', teacher_name: '企业导师', room_name: '创新楼-201', day_of_week: 4, slot: 9 },
      { id: 14, course_id: 20, course_name: '项目实训', teacher_name: '企业导师', room_name: '创新楼-201', day_of_week: 4, slot: 10 },
      { id: 15, course_id: 9, course_name: '大学英语(四)', teacher_name: '陈老师', room_name: '外语楼-201', day_of_week: 5, slot: 1 },
      { id: 16, course_id: 21, course_name: '云计算技术', teacher_name: '孙教授', room_name: '教学楼A-401', day_of_week: 5, slot: 7 }
    ],
    8: [ // 黄俊豪 - 软件工程专业大二
      { id: 1, course_id: 1, course_name: '数据结构与算法', teacher_name: '陈教授', room_name: '教学楼A-301', day_of_week: 1, slot: 1 },
      { id: 2, course_id: 3, course_name: '操作系统原理', teacher_name: '王教授', room_name: '教学楼A-402', day_of_week: 1, slot: 3 },
      { id: 3, course_id: 22, course_name: 'Java程序设计', teacher_name: '黄老师', room_name: '实验楼B-301', day_of_week: 1, slot: 6 },
      { id: 4, course_id: 22, course_name: 'Java程序设计', teacher_name: '黄老师', room_name: '实验楼B-301', day_of_week: 1, slot: 7 },
      { id: 5, course_id: 6, course_name: '人工智能导论', teacher_name: '赵教授', room_name: '教学楼A-501', day_of_week: 2, slot: 1 },
      { id: 6, course_id: 4, course_name: '数据库系统概论', teacher_name: '张教授', room_name: '教学楼C-101', day_of_week: 2, slot: 3 },
      { id: 7, course_id: 23, course_name: 'Linux系统管理', teacher_name: '陈工程师', room_name: '实验楼A-201', day_of_week: 2, slot: 8 },
      { id: 8, course_id: 5, course_name: '软件工程', teacher_name: '李老师', room_name: '教学楼B-302', day_of_week: 3, slot: 1 },
      { id: 9, course_id: 13, course_name: '编译原理', teacher_name: '孙教授', room_name: '教学楼A-201', day_of_week: 3, slot: 3 },
      { id: 10, course_id: 24, course_name: '软件测试', teacher_name: '刘老师', room_name: '教学楼B-401', day_of_week: 3, slot: 9 },
      { id: 11, course_id: 2, course_name: '计算机网络', teacher_name: '刘老师', room_name: '教学楼B-205', day_of_week: 4, slot: 1 },
      { id: 12, course_id: 10, course_name: '体育(游泳)', teacher_name: '马老师', room_name: '游泳馆', day_of_week: 4, slot: 5 },
      { id: 13, course_id: 25, course_name: '网络安全', teacher_name: '钱教授', room_name: '教学楼A-301', day_of_week: 4, slot: 7 },
      { id: 14, course_id: 9, course_name: '大学英语(四)', teacher_name: '陈老师', room_name: '外语楼-201', day_of_week: 5, slot: 1 },
      { id: 15, course_id: 14, course_name: 'Web前端开发', teacher_name: '李老师', room_name: '实验楼C-301', day_of_week: 5, slot: 5 },
      { id: 16, course_id: 26, course_name: '移动应用开发', teacher_name: '张老师', room_name: '实验楼C-401', day_of_week: 5, slot: 9 },
      { id: 17, course_id: 26, course_name: '移动应用开发', teacher_name: '张老师', room_name: '实验楼C-401', day_of_week: 5, slot: 10 }
    ]
  }
  
  // 教师端课表数据（教师自己教授的课程）
  const teacherSchedule = [
    // 周一
    { id: 1, course_id: 1, course_name: '数据结构与算法', teacher_name: '王教授', room_name: '教A-301', day_of_week: 1, slot: 1, class_name: '计算机2023-1班' },
    { id: 2, course_id: 1, course_name: '数据结构与算法', teacher_name: '王教授', room_name: '教A-301', day_of_week: 1, slot: 2, class_name: '计算机2023-1班' },
    { id: 3, course_id: 3, course_name: '操作系统原理', teacher_name: '王教授', room_name: '教A-402', day_of_week: 1, slot: 5, class_name: '计算机2023-2班' },
    { id: 4, course_id: 3, course_name: '操作系统原理', teacher_name: '王教授', room_name: '教A-402', day_of_week: 1, slot: 6, class_name: '计算机2023-2班' },
    // 周二
    { id: 5, course_id: 1, course_name: '数据结构与算法', teacher_name: '王教授', room_name: '教A-301', day_of_week: 2, slot: 3, class_name: '计算机2023-3班' },
    { id: 6, course_id: 1, course_name: '数据结构与算法', teacher_name: '王教授', room_name: '教A-301', day_of_week: 2, slot: 4, class_name: '计算机2023-3班' },
    // 周三
    { id: 7, course_id: 1, course_name: '数据结构与算法', teacher_name: '王教授', room_name: '教A-301', day_of_week: 3, slot: 1, class_name: '计算机2023-1班' },
    { id: 8, course_id: 1, course_name: '数据结构与算法', teacher_name: '王教授', room_name: '教A-301', day_of_week: 3, slot: 2, class_name: '计算机2023-1班' },
    { id: 9, course_id: 3, course_name: '操作系统原理', teacher_name: '王教授', room_name: '教A-401', day_of_week: 3, slot: 5, class_name: '计算机2023-2班' },
    { id: 10, course_id: 3, course_name: '操作系统原理', teacher_name: '王教授', room_name: '教A-401', day_of_week: 3, slot: 6, class_name: '计算机2023-2班' },
    // 周四
    { id: 11, course_id: 1, course_name: '数据结构与算法', teacher_name: '王教授', room_name: '教A-301', day_of_week: 4, slot: 1, class_name: '计算机2023-3班' },
    { id: 12, course_id: 1, course_name: '数据结构与算法', teacher_name: '王教授', room_name: '教A-301', day_of_week: 4, slot: 2, class_name: '计算机2023-3班' },
    // 周五
    { id: 13, course_id: 3, course_name: '操作系统原理', teacher_name: '王教授', room_name: '教A-402', day_of_week: 5, slot: 3, class_name: '计算机2023-1班' },
    { id: 14, course_id: 3, course_name: '操作系统原理', teacher_name: '王教授', room_name: '教A-402', day_of_week: 5, slot: 4, class_name: '计算机2023-1班' }
  ]
  
  // 根据选择的学生显示对应课表
  if (selectedStudent.value && allSchedules[selectedStudent.value]) {
    schedules.value = allSchedules[selectedStudent.value]
  } else {
    // 学生端默认使用student001的课表
    if (userStore.user?.role === 'student') {
      schedules.value = student001Schedule
    } else if (userStore.user?.role === 'teacher') {
      // 教师端使用教师课表（显示教师自己教授的课程）
      schedules.value = teacherSchedule
    } else {
      // 管理员端默认使用student001的课表
      schedules.value = student001Schedule
    }
  }
  
  try {
    const res = await api.schedules.my({ week: currentWeek.value, student_id: selectedStudent.value })
    if (res.success && res.data && res.data.length > 0) {
      schedules.value = res.data
    }
  } catch (e) {
    console.error(e)
    // 保持示例数据
  }
}

// 课堂签到功能
const startClassCheckin = async (course) => {
  try {
    const { useSocketStore } = await import('@/stores/socket')
    const socketStore = useSocketStore()
    
    // 发起签到
    socketStore.startCheckin(course.course_id, course.id, 60)
    
    ElMessage.success(`已发起「${course.course_name}」课堂签到，有效期60秒`)
    showDetailDialog.value = false
  } catch (e) {
    ElMessage.error('发起签到失败')
  }
}

// 课堂互动功能
const openClassInteraction = (course) => {
  ElMessage.info(`课堂互动功能：${course.course_name}`)
  // TODO: 打开课堂互动弹窗
}


onMounted(() => {
  fetchSchedule()
})
</script>

<style scoped>
.schedule-page {
  padding: 0;
}

.schedule-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.header-left p {
  margin: 0;
  opacity: 0.9;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.student-select {
  width: 200px;
}

.student-select :deep(.el-input__wrapper) {
  background: rgba(255,255,255,0.9);
}

.week-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,255,255,0.15);
  padding: 8px 16px;
  border-radius: 20px;
}

.week-text {
  font-size: 16px;
  font-weight: 600;
  min-width: 80px;
  text-align: center;
}

.schedule-container {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  padding: 20px;
  overflow-x: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.schedule-grid {
  min-width: 700px;
}

.grid-header {
  display: grid;
  grid-template-columns: 80px repeat(5, 1fr);
  gap: 2px;
  margin-bottom: 2px;
}

.time-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 14px 8px;
  border-radius: 10px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
}

.day-header {
  background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
  color: white;
  padding: 12px 8px;
  border-radius: 10px;
  text-align: center;
  transition: all 0.3s;
}

.day-header.today {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.day-name {
  display: block;
  font-weight: 700;
  font-size: 16px;
}

.day-date {
  display: block;
  font-size: 13px;
  opacity: 0.9;
  margin-top: 4px;
}

.grid-row {
  display: grid;
  grid-template-columns: 80px repeat(5, 1fr);
  gap: 2px;
  margin-bottom: 2px;
}

.time-cell {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  padding: 10px 6px;
  border-radius: 8px;
  text-align: center;
  color: #3730a3;
}

.slot-num {
  display: block;
  font-weight: 700;
  font-size: 14px;
}

.slot-time {
  display: block;
  font-size: 11px;
  opacity: 0.85;
  margin-top: 3px;
}

.course-cell {
  background: rgba(241, 245, 249, 0.6);
  border-radius: 8px;
  padding: 4px;
  min-height: 65px;
  transition: all 0.3s;
}

.course-cell.today-col {
  background: rgba(102, 126, 234, 0.1);
}

.course-card {
  padding: 8px 10px;
  border-radius: 10px;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

.course-card:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

.course-name {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 4px;
  line-height: 1.3;
}

.course-room, .course-teacher {
  font-size: 12px;
  opacity: 0.95;
  line-height: 1.4;
  font-weight: 500;
}

/* 课程详情弹窗 */
.course-detail {
  overflow: hidden;
}

.detail-header {
  padding: 24px;
  color: white;
  margin: -20px -20px 0;
  border-radius: 12px 12px 0 0;
  text-align: center;
}

.detail-header h2 {
  margin: 0 0 6px 0;
  font-size: 20px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.detail-header .course-code {
  margin: 0;
  font-size: 13px;
  opacity: 0.9;
}

.detail-body {
  padding: 16px 0;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.detail-item {
  background: #f8fafc;
  padding: 10px 12px;
  border-radius: 8px;
}

.detail-item .label {
  display: block;
  color: #666;
  font-size: 12px;
  margin-bottom: 4px;
}

.detail-item .value {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.course-desc {
  margin: 0;
  font-size: 13px;
  color: #555;
  line-height: 1.6;
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
}

.detail-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-footer {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  justify-content: flex-end;
}

:deep(.course-dialog .el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.course-dialog .el-dialog__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.course-dialog .el-dialog__body) {
  padding: 20px;
}
</style>
