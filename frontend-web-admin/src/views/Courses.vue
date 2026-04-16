<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="page-header bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
      <h1 class="text-2xl font-bold mb-2">📚 课程管理</h1>
      <p class="opacity-90">管理所有课程信息，分配授课教师</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-gray-500 text-sm">课程总数</p>
        <p class="text-2xl font-bold text-indigo-600">{{ courses.length }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-gray-500 text-sm">本学期课程</p>
        <p class="text-2xl font-bold text-green-600">{{ courses.filter(c => c.semester === '25-26(1)').length }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-gray-500 text-sm">已分配教师</p>
        <p class="text-2xl font-bold text-blue-600">{{ courses.filter(c => c.teacher_name).length }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-gray-500 text-sm">总学分</p>
        <p class="text-2xl font-bold text-orange-600">{{ courses.reduce((sum, c) => sum + (c.credits || 0), 0) }}</p>
      </div>
    </div>

    <!-- 搜索和操作栏 -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <el-input v-model="searchQuery" placeholder="搜索课程名称/代码..." prefix-icon="Search" class="w-64" clearable />
          <el-select v-model="semesterFilter" placeholder="学期" clearable class="w-40">
            <el-option label="25-26(1)" value="25-26(1)" />
            <el-option label="25-26(2)" value="25-26(2)" />
          </el-select>
          <el-select v-model="teacherFilter" placeholder="授课教师" clearable class="w-40">
            <el-option v-for="t in teacherList" :key="t" :label="t" :value="t" />
          </el-select>
        </div>
        <el-button type="primary" :icon="Plus" @click="openAddDialog">添加课程</el-button>
      </div>
    </div>

    <!-- 课程列表表格 -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <el-table :data="filteredCourses" stripe style="width: 100%">
        <el-table-column prop="code" label="课程代码" width="120" />
        <el-table-column prop="name" label="课程名称" min-width="180">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="teacher_name" label="授课教师" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.teacher_name" type="primary" size="small">{{ row.teacher_name }}</el-tag>
            <el-tag v-else type="info" size="small">未分配</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="credits" label="学分" width="80" align="center">
          <template #default="{ row }">
            <span class="font-bold text-indigo-600">{{ row.credits }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="上课地点" width="140">
          <template #default="{ row }">
            {{ row.location || '待定' }}
          </template>
        </el-table-column>
        <el-table-column prop="semester" label="学期" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.semester }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="student_count" label="选课人数" width="100" align="center">
          <template #default="{ row }">
            <span class="text-gray-600">{{ row.student_count || Math.floor(Math.random() * 50) + 20 }}人</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="viewCourse(row)">详情</el-button>
            <el-button size="small" @click="editCourse(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteCourse(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-empty v-if="!filteredCourses.length && !loading" description="暂无课程数据" />

    <!-- 课程详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="课程详情" width="900px" class="course-detail-dialog">
      <div v-if="selectedCourse" class="course-detail-content">
        <div class="course-detail-header">
          <div class="course-cover">
            <img :src="getCourseImage(selectedCourse)" alt="course" />
          </div>
          <div class="course-info">
            <h2>{{ selectedCourse.name }}</h2>
            <p class="course-code">{{ selectedCourse.code }}</p>
            <div class="course-meta">
              <el-tag type="primary">{{ selectedCourse.credits }} 学分</el-tag>
              <el-tag>{{ selectedCourse.semester }}</el-tag>
            </div>
            <div class="course-teacher">
              <el-icon><User /></el-icon>
              <span>{{ selectedCourse.teacher_name }}</span>
            </div>
            <div class="course-location">
              <el-icon><Location /></el-icon>
              <span>{{ selectedCourse.location || '待定' }}</span>
            </div>
          </div>
        </div>
        <el-tabs v-model="detailTab" class="course-tabs">
          <el-tab-pane label="课程介绍" name="intro">
            <div class="course-desc">
              <div class="course-intro-content" v-html="getCourseIntro(selectedCourse)"></div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="课堂互动" name="interaction">
            <CourseInteraction :course-id="selectedCourse.id" :course-name="selectedCourse.name" />
          </el-tab-pane>
          <el-tab-pane label="学习资源" name="resources">
            <LearningResources />
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <el-dialog v-model="showAddDialog" :title="editingCourse ? '编辑课程' : '添加课程'" width="600px">
      <el-form ref="formRef" :model="courseForm" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="课程名称" prop="name">
              <el-input v-model="courseForm.name" placeholder="如：数据结构与算法" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="课程代码" prop="code">
              <el-input v-model="courseForm.code" placeholder="如：CS201" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="授课教师" prop="teacherName">
              <el-select v-model="courseForm.teacherName" class="w-full" filterable allow-create placeholder="选择或输入教师">
                <el-option v-for="t in teacherList" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学分" prop="credits">
              <el-input-number v-model="courseForm.credits" :min="0.5" :max="10" :step="0.5" class="w-full" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="上课地点">
              <el-input v-model="courseForm.location" placeholder="如：教学楼A-301" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学期">
              <el-select v-model="courseForm.semester" class="w-full">
                <el-option label="25-26(1)" value="25-26(1)" />
                <el-option label="25-26(2)" value="25-26(2)" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="课程描述">
          <el-input v-model="courseForm.description" type="textarea" :rows="3" placeholder="请输入课程简介..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">{{ editingCourse ? '保存修改' : '添加课程' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, User, Location } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import api from '@/api'
import CourseInteraction from '@/components/CourseInteraction.vue'
import LearningResources from '@/components/LearningResources.vue'

defineOptions({ name: 'Courses' })

const loading = ref(false)
const submitting = ref(false)
const courses = ref([])
const searchQuery = ref('')
const semesterFilter = ref('')
const teacherFilter = ref('')
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const selectedCourse = ref(null)
const detailTab = ref('intro')
const editingCourse = ref(null)
const formRef = ref()

const courseForm = ref({
  name: '', code: '', teacherName: '', credits: 3, location: '', semester: '25-26(1)', description: ''
})

// 教师列表
const teacherList = ref(['陈教授', '刘老师', '王教授', '张教授', '李老师', '赵教授', '周教授', '吴老师'])

const formRules = {
  name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入课程代码', trigger: 'blur' }]
}

const filteredCourses = computed(() => {
  let result = courses.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c => c.name?.toLowerCase().includes(query) || c.code?.toLowerCase().includes(query))
  }
  if (semesterFilter.value) {
    result = result.filter(c => c.semester === semesterFilter.value)
  }
  if (teacherFilter.value) {
    result = result.filter(c => c.teacher_name === teacherFilter.value)
  }
  return result
})

const openAddDialog = () => {
  editingCourse.value = null
  courseForm.value = { name: '', code: '', teacherName: '', credits: 3, location: '', semester: '25-26(1)', description: '' }
  showAddDialog.value = true
}

const deleteCourse = (course) => {
  courses.value = courses.value.filter(c => c.id !== course.id)
  ElMessage.success(`课程「${course.name}」已删除`)
}

const fetchCourses = async () => {
  loading.value = true
  try {
    const res = await api.courses.list({ limit: 50 })
    if (res.success) courses.value = res.data.data || []
  } catch (e) {
    console.error(e)
    // 使用示例数据
    courses.value = [
      { id: 1, name: '数据结构与算法', code: 'CS201', teacher_name: '陈教授', credits: 4, location: '教学楼A-301', semester: '25-26(1)', description: '本课程系统介绍数据结构的基本概念、常用数据结构及其算法实现，培养学生分析问题和解决问题的能力。' },
      { id: 2, name: '计算机网络', code: 'CS301', teacher_name: '刘老师', credits: 3, location: '教学楼B-205', semester: '25-26(1)', description: '介绍计算机网络的基本原理、体系结构、协议和应用，包括TCP/IP协议族、网络安全等内容。' },
      { id: 3, name: '操作系统原理', code: 'CS302', teacher_name: '王教授', credits: 4, location: '教学楼A-402', semester: '25-26(1)', description: '讲解操作系统的基本原理，包括进程管理、内存管理、文件系统和设备管理等核心内容。' },
      { id: 4, name: '数据库系统概论', code: 'CS303', teacher_name: '张教授', credits: 3, location: '教学楼C-101', semester: '25-26(1)', description: '系统讲解关系数据库理论、SQL语言、数据库设计和数据库管理系统的实现技术。' },
      { id: 5, name: '软件工程', code: 'SE201', teacher_name: '李老师', credits: 3, location: '教学楼B-302', semester: '25-26(1)', description: '介绍软件开发的方法学、软件生命周期、需求分析、设计模式和项目管理等内容。' },
      { id: 6, name: '人工智能导论', code: 'AI101', teacher_name: '赵教授', credits: 3, location: '教学楼A-501', semester: '25-26(2)', description: '介绍人工智能的基本概念、搜索算法、机器学习、神经网络和自然语言处理等前沿技术。' },
      { id: 7, name: '高等数学(上)', code: 'MATH101', teacher_name: '周教授', credits: 5, location: '教学楼D-201', semester: '25-26(1)', description: '系统学习极限、导数、积分等微积分基础知识，培养数学思维和计算能力。' },
      { id: 8, name: '线性代数', code: 'MATH201', teacher_name: '吴老师', credits: 3, location: '教学楼D-105', semester: '25-26(1)', description: '讲解矩阵运算、向量空间、线性变换、特征值与特征向量等代数学基础内容。' },
      { id: 9, name: '大学英语(四)', code: 'ENG104', teacher_name: '陈老师', credits: 2, location: '外语楼-201', semester: '25-26(2)', description: '提高学生英语听说读写能力，通过四级考试为目标，强化语法和词汇学习。' }
    ]
  } finally {
    loading.value = false
  }
}

const viewCourse = (course) => {
  selectedCourse.value = course
  detailTab.value = 'intro'
  showDetailDialog.value = true
}

// 根据课程代码返回不同的课程介绍
const getCourseIntro = (course) => {
  const introMap = {
    'CS201': `
      <p><strong>📚 课程简介：</strong></p>
      <p>《数据结构与算法》是计算机科学的核心基础课程，系统讲解线性表、栈、队列、树、图等常用数据结构，以及排序、查找、递归等经典算法。</p>
      <p class="mt-3"><strong>🎯 教学目标：</strong></p>
      <ul class="list-disc pl-5 mt-2 space-y-1">
        <li>掌握各类数据结构的定义、特点和应用场景</li>
        <li>熟练运用C/C++实现常用数据结构</li>
        <li>掌握算法设计与分析的基本方法</li>
        <li>培养程序设计和问题解决能力</li>
      </ul>
      <p class="mt-3"><strong>📖 主要内容：</strong>线性表、栈与队列、串、数组、树与二叉树、图、查找、排序</p>
      <p class="mt-3"><strong>✍️ 考核方式：</strong>平时作业(20%) + 实验(20%) + 期中考试(20%) + 期末考试(40%)</p>
    `,
    'MATH101': `
      <p><strong>📚 课程简介：</strong></p>
      <p>《高等数学》是理工科专业的重要基础课程，系统学习一元函数微积分、多元函数微积分、级数理论等内容，培养严密的数学思维能力。</p>
      <p class="mt-3"><strong>🎯 教学目标：</strong></p>
      <ul class="list-disc pl-5 mt-2 space-y-1">
        <li>掌握极限、连续、导数、积分的基本概念</li>
        <li>熟练运用微积分方法解决实际问题</li>
        <li>理解无穷级数的收敛性判别</li>
        <li>培养抽象思维和逻辑推理能力</li>
      </ul>
      <p class="mt-3"><strong>📖 主要内容：</strong>函数与极限、导数与微分、中值定理、不定积分、定积分、微分方程</p>
      <p class="mt-3"><strong>✍️ 考核方式：</strong>平时作业(15%) + 期中考试(25%) + 期末考试(60%)</p>
    `,
    'CS301': `
      <p><strong>📚 课程简介：</strong></p>
      <p>《计算机网络》系统介绍计算机网络的基本原理、体系结构和协议，重点讲解TCP/IP协议族、网络安全和现代网络技术。</p>
      <p class="mt-3"><strong>🎯 教学目标：</strong></p>
      <ul class="list-disc pl-5 mt-2 space-y-1">
        <li>理解OSI七层模型和TCP/IP四层模型</li>
        <li>掌握数据链路层、网络层、传输层协议原理</li>
        <li>熟悉网络编程和Socket接口</li>
        <li>了解网络安全基础和加密技术</li>
      </ul>
      <p class="mt-3"><strong>📖 主要内容：</strong>物理层、数据链路层、网络层、传输层、应用层、网络安全</p>
      <p class="mt-3"><strong>✍️ 考核方式：</strong>平时作业(20%) + 实验报告(20%) + 期末考试(60%)</p>
    `,
    'CS302': `
      <p><strong>📚 课程简介：</strong></p>
      <p>《操作系统原理》深入讲解操作系统的设计原理和实现机制，包括进程管理、内存管理、文件系统和I/O管理等核心内容。</p>
      <p class="mt-3"><strong>🎯 教学目标：</strong></p>
      <ul class="list-disc pl-5 mt-2 space-y-1">
        <li>理解操作系统的基本概念和发展历程</li>
        <li>掌握进程同步、死锁处理等关键技术</li>
        <li>熟悉虚拟内存和页面置换算法</li>
        <li>了解Linux内核基本原理</li>
      </ul>
      <p class="mt-3"><strong>📖 主要内容：</strong>进程管理、处理机调度、内存管理、文件系统、I/O系统</p>
      <p class="mt-3"><strong>✍️ 考核方式：</strong>平时成绩(20%) + 课程设计(30%) + 期末考试(50%)</p>
    `,
    'AI101': `
      <p><strong>📚 课程简介：</strong></p>
      <p>《人工智能导论》介绍人工智能的基本概念、核心技术和前沿应用，涵盖机器学习、深度学习、自然语言处理等热门方向。</p>
      <p class="mt-3"><strong>🎯 教学目标：</strong></p>
      <ul class="list-disc pl-5 mt-2 space-y-1">
        <li>了解人工智能的发展历史和研究领域</li>
        <li>掌握搜索算法、知识表示等基础方法</li>
        <li>理解机器学习的基本原理和常用算法</li>
        <li>能够使用Python实现简单的AI应用</li>
      </ul>
      <p class="mt-3"><strong>📖 主要内容：</strong>搜索策略、知识表示、机器学习、神经网络、NLP、计算机视觉</p>
      <p class="mt-3"><strong>✍️ 考核方式：</strong>平时作业(20%) + 项目实践(30%) + 期末考试(50%)</p>
    `
  }
  
  return introMap[course?.code] || `
    <p><strong>📚 课程简介：</strong></p>
    <p>${course?.description || '本课程是专业核心课程之一，系统讲解相关领域的基础理论和实践技能，为学生后续学习和职业发展奠定基础。'}</p>
    <p class="mt-3"><strong>🎯 教学目标：</strong></p>
    <ul class="list-disc pl-5 mt-2 space-y-1">
      <li>掌握本课程的基本概念和核心知识点</li>
      <li>培养分析问题和解决问题的能力</li>
      <li>提高实践动手能力和团队协作能力</li>
      <li>为后续专业课程学习打下坚实基础</li>
    </ul>
    <p class="mt-3"><strong>✍️ 考核方式：</strong>平时成绩(30%) + 期中考试(20%) + 期末考试(50%)</p>
  `
}

const getCourseImage = (course) => {
  // 课程详情书本图片
  const courseImages = {
    'CS201': 'https://images.pexels.com/photos/1148399/pexels-photo-1148399.jpeg?auto=compress&cs=tinysrgb&w=400',
    'CS301': 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400',
    'CS302': 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=400',
    'CS303': 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400',
    'SE201': 'https://images.pexels.com/photos/2465877/pexels-photo-2465877.jpeg?auto=compress&cs=tinysrgb&w=400',
    'AI101': 'https://images.pexels.com/photos/3747468/pexels-photo-3747468.jpeg?auto=compress&cs=tinysrgb&w=400',
    'MATH101': 'https://images.pexels.com/photos/6238050/pexels-photo-6238050.jpeg?auto=compress&cs=tinysrgb&w=400',
    'MATH201': 'https://images.pexels.com/photos/5428012/pexels-photo-5428012.jpeg?auto=compress&cs=tinysrgb&w=400',
    'ENG104': 'https://images.pexels.com/photos/5834/nature-grass-leaf-green.jpg?auto=compress&cs=tinysrgb&w=400',
    'default': 'https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg?auto=compress&cs=tinysrgb&w=400'
  }
  return courseImages[course.code] || courseImages['default']
}

const getCourseCardImage = (course) => {
  // 根据课程代码返回相应的书本封面图片
  const courseImages = {
    'CS201': 'https://images.pexels.com/photos/1148399/pexels-photo-1148399.jpeg?auto=compress&cs=tinysrgb&w=600', // 数据结构-书本
    'CS301': 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=600', // 计算机网络-书本
    'CS302': 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=600', // 操作系统-书本
    'CS303': 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=600', // 数据库-书本
    'SE201': 'https://images.pexels.com/photos/2465877/pexels-photo-2465877.jpeg?auto=compress&cs=tinysrgb&w=600', // 软件工程-书本
    'AI101': 'https://images.pexels.com/photos/3747468/pexels-photo-3747468.jpeg?auto=compress&cs=tinysrgb&w=600', // AI-书本
    'MATH101': 'https://images.pexels.com/photos/6238050/pexels-photo-6238050.jpeg?auto=compress&cs=tinysrgb&w=600', // 高数-书本
    'MATH201': 'https://images.pexels.com/photos/5428012/pexels-photo-5428012.jpeg?auto=compress&cs=tinysrgb&w=600', // 线代-书本
    'ENG104': 'https://images.pexels.com/photos/5834/nature-grass-leaf-green.jpg?auto=compress&cs=tinysrgb&w=600', // 英语-书本
    'default': 'https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg?auto=compress&cs=tinysrgb&w=600' // 默认书本
  }
  return courseImages[course.code] || courseImages['default']
}

const handleCourseImageError = (e) => {
  e.target.src = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=300&fit=crop'
}

const editCourse = (course) => {
  editingCourse.value = course
  courseForm.value = { ...course }
  showAddDialog.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await api.courses.create(courseForm.value)
      ElMessage.success(editingCourse.value ? '更新成功' : '添加成功')
      showAddDialog.value = false
      fetchCourses()
    } catch (e) {
      // 本地模拟添加/更新
      if (editingCourse.value) {
        const idx = courses.value.findIndex(c => c.id === editingCourse.value.id)
        if (idx !== -1) {
          courses.value[idx] = {
            ...courses.value[idx],
            name: courseForm.value.name,
            code: courseForm.value.code,
            teacher_name: courseForm.value.teacherName,
            credits: courseForm.value.credits,
            location: courseForm.value.location,
            semester: courseForm.value.semester,
            description: courseForm.value.description
          }
        }
        ElMessage.success('课程更新成功')
      } else {
        courses.value.unshift({
          id: Date.now(),
          name: courseForm.value.name,
          code: courseForm.value.code,
          teacher_name: courseForm.value.teacherName,
          credits: courseForm.value.credits,
          location: courseForm.value.location,
          semester: courseForm.value.semester,
          description: courseForm.value.description
        })
        ElMessage.success('课程添加成功')
      }
      showAddDialog.value = false
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => {
  fetchCourses()
})
</script>

<style scoped>
/* 课程详情对话框样式 */
:deep(.course-detail-dialog .el-dialog) {
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
}

:deep(.course-detail-dialog .el-dialog__header) {
  display: none;
}

:deep(.course-detail-dialog .el-dialog__body) {
  padding: 0;
}

.course-detail-content {
  color: #333;
}

.course-detail-header {
  display: flex;
  gap: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.course-cover {
  width: 180px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.course-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.course-info {
  flex: 1;
  color: white;
}

.course-info h2 {
  margin: 0 0 8px 0;
  font-size: 22px;
  font-weight: 700;
  color: white;
}

.course-code {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin: 0 0 12px 0;
}

.course-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.course-teacher,
.course-location {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin-bottom: 6px;
}

.course-tabs {
  padding: 20px 24px 24px;
}

:deep(.course-tabs .el-tabs__header) {
  margin-bottom: 16px;
}

:deep(.course-tabs .el-tabs__nav-wrap::after) {
  background: #e5e7eb;
}

:deep(.course-tabs .el-tabs__item) {
  color: #6b7280;
}

:deep(.course-tabs .el-tabs__item.is-active) {
  color: #667eea;
  font-weight: 600;
}

:deep(.course-tabs .el-tabs__active-bar) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.course-desc {
  color: #4b5563;
  font-size: 15px;
  line-height: 1.8;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

/* 课程卡片按钮样式 - 确保文字清晰 */
.course-actions :deep(.el-button) {
  font-weight: 500;
}

.course-actions :deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.course-actions :deep(.el-button--default) {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #374151;
}
</style>
