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
        <p class="text-2xl font-bold text-green-600">{{ currentSemesterCourses }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-gray-500 text-sm">已分配教师</p>
        <p class="text-2xl font-bold text-blue-600">{{ courses.filter(c => c.teacher_name).length }}</p>
      </div>
    </div>

    <!-- 搜索和操作栏 -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <el-input v-model="searchQuery" placeholder="搜索课程名称/代码..." prefix-icon="Search" class="w-64" clearable />
          <el-select v-model="semesterFilter" placeholder="学期" clearable class="w-40" :loading="loadingSemesters">
            <el-option v-for="s in semesterList" :key="s" :label="s" :value="s" />
          </el-select>
          <el-select v-model="teacherFilter" placeholder="授课教师" clearable class="w-40" :loading="loadingTeachers">
            <el-option v-for="t in teacherList" :key="t" :label="t" :value="t" />
          </el-select>
        </div>
        <el-button type="primary" :icon="Plus" @click="openAddDialog">添加课程</el-button>
      </div>
    </div>

    <!-- 课程列表表格 -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <el-table :data="filteredCourses" stripe style="width: 100%" v-loading="loading">
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
            <span class="text-gray-600">{{ row.student_count || 0 }}人</span>
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
              <span>{{ selectedCourse.teacher_name || '未分配' }}</span>
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

    <!-- 添加/编辑课程对话框 -->
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
              <el-select v-model="courseForm.teacherName" class="w-full" filterable allow-create placeholder="选择或输入教师" :loading="loadingTeachers">
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
            <el-form-item label="学期" prop="semester">
              <el-select v-model="courseForm.semester" class="w-full" :loading="loadingSemesters">
                <el-option v-for="s in semesterList" :key="s" :label="s" :value="s" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { courseAPI } from '@/api/courses'
import CourseInteraction from '@/components/CourseInteraction.vue'
import LearningResources from '@/components/LearningResources.vue'

defineOptions({ name: 'Courses' })

const loading = ref(false)
const submitting = ref(false)
const loadingSemesters = ref(false)
const loadingTeachers = ref(false)
const courses = ref([])
const semesterList = ref([])
const teacherList = ref([])
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
  name: '',
  code: '',
  teacherName: '',
  credits: 3,
  location: '',
  semester: '',
  description: ''
})

const formRules = {
  name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入课程代码', trigger: 'blur' }],
  semester: [{ required: true, message: '请选择学期', trigger: 'change' }]
}

// 当前学期课程数量
const currentSemesterCourses = computed(() => {
  if (semesterList.value.length === 0) return 0
  const currentSem = semesterList.value[0]
  return courses.value.filter(c => c.semester === currentSem).length
})

// 筛选后的课程列表
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

// 获取学期列表
const fetchSemesters = async () => {
  loadingSemesters.value = true
  try {
    const res = await courseAPI.semesters()
    if (res.success) {
      semesterList.value = res.data || []
      if (semesterList.value.length > 0 && !courseForm.value.semester) {
        courseForm.value.semester = semesterList.value[0]
      }
    }
  } catch (error) {
    console.error('获取学期列表失败:', error)
  } finally {
    loadingSemesters.value = false
  }
}

// 获取教师列表
const fetchTeachers = async () => {
  loadingTeachers.value = true
  try {
    const res = await courseAPI.teachers()
    if (res.success) {
      teacherList.value = res.data || []
    }
  } catch (error) {
    console.error('获取教师列表失败:', error)
  } finally {
    loadingTeachers.value = false
  }
}

// 获取课程列表
const fetchCourses = async () => {
  loading.value = true
  try {
    const res = await courseAPI.list({ limit: 100 })
    if (res.success) {
      courses.value = res.data.data || []
    }
  } catch (error) {
    console.error('获取课程列表失败:', error)
    courses.value = []
  } finally {
    loading.value = false
  }
}

// 打开添加对话框
const openAddDialog = () => {
  editingCourse.value = null
  courseForm.value = {
    name: '',
    code: '',
    teacherName: '',
    credits: 3,
    location: '',
    semester: semesterList.value[0] || '',
    description: ''
  }
  showAddDialog.value = true
}

// 删除课程
const deleteCourse = async (course) => {
  try {
    await ElMessageBox.confirm(
        `确定要删除课程「${course.name}」吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )
    // 调用删除接口（如果后端有实现）
    // await courseAPI.remove(course.id)
    courses.value = courses.value.filter(c => c.id !== course.id)
    ElMessage.success(`课程「${course.name}」已删除`)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 查看课程详情
const viewCourse = (course) => {
  selectedCourse.value = course
  detailTab.value = 'intro'
  showDetailDialog.value = true
}

// 编辑课程
const editCourse = (course) => {
  editingCourse.value = course
  courseForm.value = {
    name: course.name,
    code: course.code,
    teacherName: course.teacher_name || '',
    credits: course.credits,
    location: course.location || '',
    semester: course.semester,
    description: course.description || ''
  }
  showAddDialog.value = true
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (editingCourse.value) {
        // 编辑课程
        // await courseAPI.update(editingCourse.value.id, courseForm.value)
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
        // 创建课程
        await courseAPI.create({
          name: courseForm.value.name,
          code: courseForm.value.code,
          teacher_name: courseForm.value.teacherName,
          credits: courseForm.value.credits,
          location: courseForm.value.location,
          semester: courseForm.value.semester,
          description: courseForm.value.description
        })
        ElMessage.success('课程添加成功')
        await fetchCourses()
      }
      showAddDialog.value = false
    } catch (error) {
      console.error('提交失败:', error)
      ElMessage.error(editingCourse.value ? '更新失败' : '添加失败')
    } finally {
      submitting.value = false
    }
  })
}

// 获取课程介绍（根据课程代码返回不同内容）
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

// 获取课程封面图片
const getCourseImage = (course) => {
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

onMounted(() => {
  Promise.all([
    fetchSemesters(),
    fetchTeachers(),
    fetchCourses()
  ])
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
</style>