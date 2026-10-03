<template>
  <div class="space-y-6">
    <!-- 个人信息卡片 - 增强版 -->
    <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white relative overflow-hidden">
      <div class="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div class="absolute left-1/2 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2"></div>
      <div class="flex items-center gap-6 relative z-10">
        <div class="relative">
          <el-avatar :size="90" :src="userAvatarUrl" class="border-4 border-white/30 shadow-lg">
            原
          </el-avatar>
          <div class="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
            <span class="text-xs">✓</span>
          </div>
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-3">
            <h2 class="text-2xl font-bold">{{ userStore.user?.name || '同学' }}</h2>
            <el-tag type="warning" effect="dark" size="small">优秀学员</el-tag>
          </div>
          <p class="text-white/80 mt-1">{{ userStore.user?.department || '计算机科学与技术学院' }} · {{ userStore.user?.student_id || '2021001234' }}</p>
          <p class="text-white/60 text-sm mt-1">入学时间：2021年9月 · 已在校 {{ currentSemester }} 个学期</p>
          <div class="flex gap-6 mt-4">
            <div class="text-center">
              <p class="text-3xl font-bold">{{ overallGPA }}</p>
              <p class="text-xs text-white/60">综合绩点</p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold">{{ totalCredits }}</p>
              <p class="text-xs text-white/60">已修学分</p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold">{{ totalActivities }}</p>
              <p class="text-xs text-white/60">活动参与</p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold">{{ growthData.honors?.length || 5 }}</p>
              <p class="text-xs text-white/60">荣誉奖项</p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold">{{ rankPercent }}%</p>
              <p class="text-xs text-white/60">年级排名</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习进度概览 - 可点击查看详情 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white cursor-pointer hover:shadow-lg hover:scale-105 transition-all" @click="showCourseDetail">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-white/70 text-sm">本学期课程</p>
            <p class="text-3xl font-bold mt-1">{{ currentCourses.length }}</p>
          </div>
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <el-icon :size="24"><Reading /></el-icon>
          </div>
        </div>
        <el-progress :percentage="courseProgress" :stroke-width="6" color="#fff" :show-text="false" class="mt-3" />
        <p class="text-xs text-white/60 mt-2">已完成 {{ Math.round(courseProgress) }}% · 点击查看详情</p>
      </div>
      <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white cursor-pointer hover:shadow-lg hover:scale-105 transition-all" @click="showAttendanceDetail">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-white/70 text-sm">出勤率</p>
            <p class="text-3xl font-bold mt-1">{{ attendanceRate }}%</p>
          </div>
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <el-icon :size="24"><Clock /></el-icon>
          </div>
        </div>
        <el-progress :percentage="attendanceRate" :stroke-width="6" color="#fff" :show-text="false" class="mt-3" />
        <p class="text-xs text-white/60 mt-2">全勤天数 {{ fullAttendanceDays }} 天 · 点击查看</p>
      </div>
      <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white cursor-pointer hover:shadow-lg hover:scale-105 transition-all" @click="showHomeworkDetail">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-white/70 text-sm">作业完成</p>
            <p class="text-3xl font-bold mt-1">{{ homeworkCompleted }}/{{ homeworkTotal }}</p>
          </div>
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <el-icon :size="24"><Document /></el-icon>
          </div>
        </div>
        <el-progress :percentage="homeworkRate" :stroke-width="6" color="#fff" :show-text="false" class="mt-3" />
        <p class="text-xs text-white/60 mt-2">平均分 {{ homeworkAvgScore }} 分 · 点击查看</p>
      </div>
      <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white cursor-pointer hover:shadow-lg hover:scale-105 transition-all" @click="showStudyDetail">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-white/70 text-sm">学习时长</p>
            <p class="text-3xl font-bold mt-1">{{ studyHours }}h</p>
          </div>
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <el-icon :size="24"><Timer /></el-icon>
          </div>
        </div>
        <el-progress :percentage="studyProgress" :stroke-width="6" color="#fff" :show-text="false" class="mt-3" />
        <p class="text-xs text-white/60 mt-2">本周 +{{ weeklyStudyHours }}h · 点击查看</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 学业成绩趋势 -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">📈 学业成绩趋势</h3>
          <el-radio-group v-model="chartType" size="small">
            <el-radio-button label="gpa">绩点</el-radio-button>
            <el-radio-button label="score">分数</el-radio-button>
          </el-radio-group>
        </div>
        <div ref="academicChartRef" class="h-64"></div>
      </div>

      <!-- 活动参与分布 -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">🎯 活动参与分布</h3>
          <span class="text-sm text-gray-500">共参与 {{ totalActivities }} 次活动</span>
        </div>
        <div ref="activityChartRef" class="h-64"></div>
      </div>

      <!-- 本学期课程成绩 -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">📚 本学期课程成绩</h3>
          <el-tag type="success">GPA: {{ semesterGPA }}</el-tag>
        </div>
        <div class="space-y-3">
          <div v-for="course in currentCourses" :key="course.id" 
               class="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                 :style="{ background: getCourseColor(course.score) }">
              {{ course.score }}
            </div>
            <div class="flex-1">
              <p class="font-medium text-gray-800">{{ course.name }}</p>
              <p class="text-xs text-gray-500">{{ course.credits }} 学分 · {{ course.teacher }}</p>
            </div>
            <div class="text-right">
              <p class="font-medium" :class="getScoreClass(course.score)">{{ getScoreLevel(course.score) }}</p>
              <p class="text-xs text-gray-400">绩点 {{ course.gpa }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 技能雷达图 -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">💡 能力评估</h3>
          <el-button type="primary" size="small" text>查看详情</el-button>
        </div>
        <div ref="skillRadarRef" class="h-64"></div>
      </div>

      <!-- 技能标签 - 增强版 -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">🏷️ 技能标签</h3>
          <span class="text-sm text-gray-500">共 {{ skillsData.length }} 项技能</span>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div v-for="skill in skillsData" :key="skill.name" 
               class="p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-gray-700">{{ skill.name }}</span>
              <el-tag :type="getSkillType(skill.level)" size="small">Lv.{{ skill.level }}</el-tag>
            </div>
            <el-progress :percentage="skill.level * 20" :stroke-width="8" :color="skill.color" :show-text="false" />
            <p class="text-xs text-gray-400 mt-1">{{ skill.description }}</p>
          </div>
        </div>
      </div>

      <!-- 荣誉奖项 - 增强版 -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">🏆 荣誉奖项</h3>
          <span class="text-sm text-gray-500">共获得 {{ honorsData.length }} 项荣誉</span>
        </div>
        <div class="space-y-3 max-h-80 overflow-y-auto">
          <div v-for="honor in honorsData" :key="honor.id" 
               class="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02]"
               :class="getHonorBgClass(honor.level)">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                 :class="getHonorIconBg(honor.level)">
              {{ getHonorIcon(honor.level) }}
            </div>
            <div class="flex-1">
              <p class="font-medium text-gray-800">{{ honor.title }}</p>
              <p class="text-xs text-gray-500">{{ honor.date }} · {{ honor.org }}</p>
            </div>
            <el-tag :type="getHonorTagType(honor.level)" size="small">{{ getLevelText(honor.level) }}</el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习时间分布 -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">⏰ 本周学习时间分布</h3>
        <el-select v-model="weekSelect" size="small" class="w-32">
          <el-option label="本周" value="current" />
          <el-option label="上周" value="last" />
          <el-option label="本月" value="month" />
        </el-select>
      </div>
      <div ref="studyTimeChartRef" class="h-48"></div>
    </div>

    <!-- 心理健康概览 - 增强版 -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">💚 心理健康概览</h3>
        <el-button type="success" size="small">预约心理咨询</el-button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div v-for="record in mentalHealthData" :key="record.date"
             class="p-4 rounded-xl text-center transition-all hover:scale-105"
             :class="getStressClass(record.stress)">
          <p class="text-sm text-gray-600">{{ record.date }}</p>
          <p class="text-3xl font-bold mt-2" :class="getScoreColor(record.score)">{{ record.score }}</p>
          <el-tag :type="getStressType(record.stress)" size="small" class="mt-2">
            {{ record.mood }}
          </el-tag>
          <p class="text-xs text-gray-400 mt-1">睡眠 {{ record.sleep }}h</p>
        </div>
      </div>
    </div>

    <!-- 成长轨迹时间线 -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">📅 成长轨迹</h3>
        <el-button type="primary" size="small" text>查看全部</el-button>
      </div>
      <el-timeline>
        <el-timeline-item v-for="item in timelineData" :key="item.id" 
                          :timestamp="item.date" :type="item.type" :hollow="item.hollow" placement="top">
          <div class="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ item.icon }}</span>
              <h4 class="font-medium">{{ item.title }}</h4>
            </div>
            <p class="text-sm text-gray-500 mt-1">{{ item.description }}</p>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Trophy, Reading, Clock, Document, Timer } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

defineOptions({ name: 'Growth' })
import * as echarts from 'echarts'
import { socialAPI } from '@/api/social'

const userStore = useUserStore()
const growthData = ref({ academic: [], activities: [], skills: [], honors: [], mentalHealth: [] })
const chartType = ref('gpa')
const weekSelect = ref('current')

// 计算头像URL
const userAvatarUrl = computed(() => {
  const avatar = userStore.user?.avatar
  if (!avatar) return ''
  if (avatar.startsWith('http')) return avatar
  return `http://localhost:3000${avatar}`
})

const academicChartRef = ref(null)
const activityChartRef = ref(null)
const skillRadarRef = ref(null)
const studyTimeChartRef = ref(null)

// 基础数据
const currentSemester = ref(7)
const overallGPA = ref('3.78')
const totalCredits = ref(126)
const rankPercent = ref(15)
const semesterGPA = ref('3.85')
const courseProgress = ref(68)
const attendanceRate = ref(96)
const fullAttendanceDays = ref(45)
const homeworkCompleted = ref(23)
const homeworkTotal = ref(28)
const homeworkRate = computed(() => Math.round(homeworkCompleted.value / homeworkTotal.value * 100))
const homeworkAvgScore = ref(88)
const studyHours = ref(156)
const weeklyStudyHours = ref(24)
const studyProgress = ref(78)

const totalActivities = computed(() => growthData.value.activities?.reduce((sum, a) => sum + a.count, 0) || 20)

// 本学期课程数据
const currentCourses = ref([
  { id: 1, name: '数据结构与算法', credits: 4, teacher: '王教授', score: 92, gpa: '4.0' },
  { id: 2, name: '计算机网络', credits: 3, teacher: '李教授', score: 88, gpa: '3.7' },
  { id: 3, name: '操作系统', credits: 4, teacher: '张教授', score: 85, gpa: '3.5' },
  { id: 4, name: '数据库原理', credits: 3, teacher: '刘教授', score: 90, gpa: '3.9' },
  { id: 5, name: '软件工程', credits: 3, teacher: '陈教授', score: 87, gpa: '3.6' },
  { id: 6, name: '人工智能导论', credits: 2, teacher: '赵教授', score: 94, gpa: '4.0' }
])

// 技能数据
const skillsData = ref([
  { name: 'Python编程', level: 5, color: '#3b82f6', description: '熟练掌握，可独立开发项目' },
  { name: 'Java开发', level: 4, color: '#ef4444', description: '能够进行企业级应用开发' },
  { name: '数据分析', level: 4, color: '#10b981', description: '熟悉数据处理和可视化' },
  { name: '机器学习', level: 3, color: '#8b5cf6', description: '了解常用算法和框架' },
  { name: '前端开发', level: 3, color: '#f59e0b', description: '熟悉Vue/React开发' },
  { name: '英语(CET-6)', level: 4, color: '#6366f1', description: '具备良好的英语读写能力' }
])

// 荣誉数据
const honorsData = ref([
  { id: 1, title: '全国大学生程序设计竞赛 银奖', date: '2024-05', org: '中国计算机学会', level: 'national' },
  { id: 2, title: '校级优秀学生干部', date: '2024-03', org: '学生工作部', level: 'school' },
  { id: 3, title: '省级数学建模竞赛 一等奖', date: '2023-11', org: '省教育厅', level: 'province' },
  { id: 4, title: '国家励志奖学金', date: '2023-10', org: '教育部', level: 'national' },
  { id: 5, title: '校级三好学生', date: '2023-06', org: '教务处', level: 'school' },
  { id: 6, title: '市级创新创业大赛 二等奖', date: '2023-04', org: '市科技局', level: 'city' }
])

// 心理健康数据
const mentalHealthData = ref([
  { date: '1月', score: 85, stress: 'low', mood: '愉悦', sleep: 7.5 },
  { date: '2月', score: 78, stress: 'medium', mood: '平静', sleep: 6.5 },
  { date: '3月', score: 82, stress: 'low', mood: '积极', sleep: 7 },
  { date: '4月', score: 75, stress: 'medium', mood: '一般', sleep: 6 },
  { date: '5月', score: 88, stress: 'low', mood: '开心', sleep: 8 }
])

// 成长轨迹数据
const timelineData = ref([
  { id: 1, date: '2024-05-15', title: '获得国赛银奖', description: '在全国大学生程序设计竞赛中获得银奖', icon: '🏆', type: 'success' },
  { id: 2, date: '2024-04-20', title: '完成毕业设计开题', description: '毕业设计《基于深度学习的图像识别系统》顺利通过开题答辩', icon: '📝', type: 'primary' },
  { id: 3, date: '2024-03-10', title: '被评为优秀学生干部', description: '因在学生会工作中表现突出，被评为校级优秀学生干部', icon: '⭐', type: 'warning' },
  { id: 4, date: '2024-01-15', title: '完成实习', description: '在字节跳动完成为期3个月的后端开发实习', icon: '💼', type: 'info' },
  { id: 5, date: '2023-11-20', title: '数学建模竞赛获奖', description: '在省级数学建模竞赛中获得一等奖', icon: '🥇', type: 'success' }
])

// 辅助函数
const getSkillType = (level) => level >= 4 ? 'danger' : level >= 3 ? 'warning' : 'primary'
const getLevelText = (level) => ({ school: '校级', city: '市级', province: '省级', national: '国家级', international: '国际级' }[level] || level)
const getStressType = (s) => ({ low: 'success', medium: 'warning', high: 'danger' }[s] || 'info')
const getStressText = (s) => ({ low: '较低', medium: '适中', high: '较高' }[s] || s)
const getStressClass = (s) => ({ low: 'bg-green-50', medium: 'bg-yellow-50', high: 'bg-red-50' }[s] || 'bg-gray-50')

const getCourseColor = (score) => {
  if (score >= 90) return '#10b981'
  if (score >= 80) return '#3b82f6'
  if (score >= 70) return '#f59e0b'
  return '#ef4444'
}

const getScoreClass = (score) => {
  if (score >= 90) return 'text-green-600'
  if (score >= 80) return 'text-blue-600'
  if (score >= 70) return 'text-orange-500'
  return 'text-red-500'
}

const getScoreLevel = (score) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '中等'
  if (score >= 60) return '及格'
  return '不及格'
}

const getScoreColor = (score) => {
  if (score >= 85) return 'text-green-600'
  if (score >= 75) return 'text-blue-600'
  return 'text-orange-500'
}

const getHonorBgClass = (level) => ({
  national: 'bg-gradient-to-r from-red-50 to-orange-50',
  province: 'bg-gradient-to-r from-purple-50 to-pink-50',
  city: 'bg-gradient-to-r from-blue-50 to-cyan-50',
  school: 'bg-gradient-to-r from-yellow-50 to-amber-50'
}[level] || 'bg-gray-50')

const getHonorIconBg = (level) => ({
  national: 'bg-red-100',
  province: 'bg-purple-100',
  city: 'bg-blue-100',
  school: 'bg-yellow-100'
}[level] || 'bg-gray-100')

const getHonorIcon = (level) => ({
  national: '🏆',
  province: '🥇',
  city: '🎖️',
  school: '⭐'
}[level] || '📜')

const getHonorTagType = (level) => ({
  national: 'danger',
  province: 'warning',
  city: 'primary',
  school: 'success'
}[level] || 'info')

const initCharts = () => {
  // 学业成绩趋势图
  if (academicChartRef.value) {
    const chart = echarts.init(academicChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['平均分', '绩点'] },
      xAxis: { type: 'category', data: ['大一上', '大一下', '大二上', '大二下', '大三上', '大三下', '大四上'] },
      yAxis: [
        { type: 'value', name: '分数', min: 70, max: 100 },
        { type: 'value', name: '绩点', min: 2.5, max: 4.0 }
      ],
      series: [
        { name: '平均分', type: 'line', smooth: true, data: [82, 85, 87, 88, 90, 91, 92], areaStyle: { opacity: 0.2 }, itemStyle: { color: '#8b5cf6' } },
        { name: '绩点', type: 'line', smooth: true, yAxisIndex: 1, data: [3.2, 3.4, 3.5, 3.6, 3.7, 3.8, 3.85], itemStyle: { color: '#10b981' } }
      ]
    })
  }
  
  // 活动参与分布图
  if (activityChartRef.value) {
    const chart = echarts.init(activityChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', right: 10, top: 'center' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        data: [
          { value: 8, name: '学术', itemStyle: { color: '#3b82f6' } },
          { value: 5, name: '文艺', itemStyle: { color: '#8b5cf6' } },
          { value: 4, name: '体育', itemStyle: { color: '#10b981' } },
          { value: 3, name: '公益', itemStyle: { color: '#f59e0b' } }
        ],
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false }
      }]
    })
  }
  
  // 技能雷达图
  if (skillRadarRef.value) {
    const chart = echarts.init(skillRadarRef.value)
    chart.setOption({
      radar: {
        indicator: [
          { name: '编程能力', max: 100 },
          { name: '算法思维', max: 100 },
          { name: '项目实践', max: 100 },
          { name: '团队协作', max: 100 },
          { name: '沟通表达', max: 100 },
          { name: '学习能力', max: 100 }
        ],
        shape: 'polygon'
      },
      series: [{
        type: 'radar',
        data: [{
          value: [90, 85, 82, 88, 75, 92],
          areaStyle: { color: 'rgba(99, 102, 241, 0.3)' },
          lineStyle: { color: '#6366f1' },
          itemStyle: { color: '#6366f1' }
        }]
      }]
    })
  }
  
  // 学习时间分布图
  if (studyTimeChartRef.value) {
    const chart = echarts.init(studyTimeChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
      yAxis: { type: 'value', name: '小时' },
      series: [{
        type: 'bar',
        data: [4.5, 5, 3.5, 6, 4, 2, 3],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#6366f1' },
            { offset: 1, color: '#a5b4fc' }
          ]),
          borderRadius: [6, 6, 0, 0]
        }
      }]
    })
  }
}

const fetchGrowthData = async () => {
  try {
    const res = await socialAPI.growth(userStore.user?.id)
    if (res.success) growthData.value = res.data || {}
    setTimeout(initCharts, 100)
  } catch (e) {
    setTimeout(initCharts, 100)
  }
}

// 详情弹窗相关
import { ElMessageBox } from 'element-plus'

// 作业详情数据
const homeworkList = ref([
  { id: 1, name: '数据结构实验1-链表操作', course: '数据结构与算法', deadline: '2024-01-15', status: 'completed', score: 95 },
  { id: 2, name: '数据结构实验2-二叉树遍历', course: '数据结构与算法', deadline: '2024-01-22', status: 'completed', score: 90 },
  { id: 3, name: '计算机网络实验1-抓包分析', course: '计算机网络', deadline: '2024-01-20', status: 'completed', score: 88 },
  { id: 4, name: '操作系统实验1-进程调度', course: '操作系统', deadline: '2024-01-25', status: 'completed', score: 85 },
  { id: 5, name: '数据库设计大作业', course: '数据库原理', deadline: '2024-02-01', status: 'pending', score: null },
  { id: 6, name: '软件工程需求分析报告', course: '软件工程', deadline: '2024-02-05', status: 'pending', score: null }
])

// 显示课程详情
const showCourseDetail = () => {
  const courseHtml = currentCourses.value.map(c => 
    `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
      <span><strong>${c.name}</strong> (${c.credits}学分)</span>
      <span style="color:${c.score >= 90 ? '#10b981' : c.score >= 80 ? '#3b82f6' : '#f59e0b'}">${c.score}分 / GPA ${c.gpa}</span>
    </div>`
  ).join('')
  
  ElMessageBox.alert(
    `<div style="max-height:400px;overflow-y:auto;">
      <p style="margin-bottom:12px;color:#6b7280;">本学期共 ${currentCourses.value.length} 门课程，已完成 ${Math.round(courseProgress.value)}%</p>
      ${courseHtml}
    </div>`,
    '📚 本学期课程详情',
    { dangerouslyUseHTMLString: true, confirmButtonText: '关闭' }
  )
}

// 显示出勤详情
const showAttendanceDetail = () => {
  ElMessageBox.alert(
    `<div>
      <p style="margin-bottom:12px;">出勤率: <strong style="color:#10b981;font-size:24px;">${attendanceRate.value}%</strong></p>
      <p>全勤天数: ${fullAttendanceDays.value} 天</p>
      <p>迟到次数: 2 次</p>
      <p>请假次数: 1 次</p>
      <p style="margin-top:12px;padding:12px;background:#ecfdf5;border-radius:8px;color:#065f46;">
        📌 提示：保持良好的出勤记录有助于提升综合素质评价分数
      </p>
    </div>`,
    '📊 出勤记录详情',
    { dangerouslyUseHTMLString: true, confirmButtonText: '关闭' }
  )
}

// 显示作业详情
const showHomeworkDetail = () => {
  const completed = homeworkList.value.filter(h => h.status === 'completed')
  const pending = homeworkList.value.filter(h => h.status === 'pending')
  
  const completedHtml = completed.map(h => 
    `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6;">
      <span>✅ ${h.name}</span>
      <span style="color:#10b981;">${h.score}分</span>
    </div>`
  ).join('')
  
  const pendingHtml = pending.map(h => 
    `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6;">
      <span>⏳ ${h.name}</span>
      <span style="color:#f59e0b;">截止: ${h.deadline}</span>
    </div>`
  ).join('')
  
  ElMessageBox.alert(
    `<div style="max-height:400px;overflow-y:auto;">
      <h4 style="margin:0 0 12px;color:#10b981;">已完成作业 (${completed.length})</h4>
      ${completedHtml}
      <h4 style="margin:16px 0 12px;color:#f59e0b;">待完成作业 (${pending.length})</h4>
      ${pendingHtml}
    </div>`,
    '📝 作业完成情况',
    { dangerouslyUseHTMLString: true, confirmButtonText: '关闭' }
  )
}

// 显示学习时长详情
const showStudyDetail = () => {
  ElMessageBox.alert(
    `<div>
      <p style="margin-bottom:12px;">累计学习时长: <strong style="color:#8b5cf6;font-size:24px;">${studyHours.value}h</strong></p>
      <p>本周学习: +${weeklyStudyHours.value}h</p>
      <p>日均学习: ${(weeklyStudyHours.value / 7).toFixed(1)}h</p>
      <div style="margin-top:16px;">
        <p style="font-weight:500;margin-bottom:8px;">本周学习分布:</p>
        <div style="display:flex;gap:4px;">
          <div style="flex:1;height:40px;background:linear-gradient(to top,#8b5cf6,#c4b5fd);border-radius:4px;" title="周一 4.5h"></div>
          <div style="flex:1;height:50px;background:linear-gradient(to top,#8b5cf6,#c4b5fd);border-radius:4px;" title="周二 5h"></div>
          <div style="flex:1;height:35px;background:linear-gradient(to top,#8b5cf6,#c4b5fd);border-radius:4px;" title="周三 3.5h"></div>
          <div style="flex:1;height:60px;background:linear-gradient(to top,#8b5cf6,#c4b5fd);border-radius:4px;" title="周四 6h"></div>
          <div style="flex:1;height:40px;background:linear-gradient(to top,#8b5cf6,#c4b5fd);border-radius:4px;" title="周五 4h"></div>
          <div style="flex:1;height:20px;background:linear-gradient(to top,#8b5cf6,#c4b5fd);border-radius:4px;" title="周六 2h"></div>
          <div style="flex:1;height:30px;background:linear-gradient(to top,#8b5cf6,#c4b5fd);border-radius:4px;" title="周日 3h"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#9ca3af;margin-top:4px;">
          <span>周一</span><span>周二</span><span>周三</span><span>周四</span><span>周五</span><span>周六</span><span>周日</span>
        </div>
      </div>
    </div>`,
    '⏱️ 学习时长统计',
    { dangerouslyUseHTMLString: true, confirmButtonText: '关闭' }
  )
}

onMounted(() => fetchGrowthData())
</script>
