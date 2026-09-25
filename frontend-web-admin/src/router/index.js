// frontend-web-admin/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/',
        component: () => import('@/layouts/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: () => import('@/views/Dashboard.vue'),
                meta: { title: '数据可视化大屏', icon: 'DataAnalysis', roles: ['admin'] }
            },
            //从home 定义不同角色的vue组件
            {
                path: 'home',
                name: 'Home',
                component: () => import('@/views/Home.vue'),
                meta: { title: '首页', icon: 'HomeFilled' }
            },
            {
                path: 'student-home',
                name: 'StudentHome',
                component: () => import('@/views/StudentHome.vue'),
                meta: { title: '学生首页', icon: 'HomeFilled', roles: ['student'] }
            },
            {
                path: 'teacher-home',
                name: 'TeacherHome',
                component: () => import('@/views/TeacherHome.vue'),
                meta: { title: '教师首页', icon: 'HomeFilled', roles: ['teacher'] }
            },
            {
                path: 'admin-home',
                name: 'AdminHome',
                component: () => import('@/views/AdminHome.vue'),
                meta: { title: '管理员首页', icon: 'HomeFilled', roles: ['admin'] }
            },
            {
                path: 'users',
                name: 'Users',
                component: () => import('@/views/Users.vue'),
                meta: { title: '用户管理', icon: 'User', roles: ['admin'] }
            },
            //课程
            {
                path: 'courses',
                name: 'Courses',
                component: () => import('@/views/Courses.vue'),
                meta: { title: '课程管理', icon: 'Reading', roles: ['teacher', 'admin'] }
            },
            {
                path: 'my-courses',
                name: 'MyCourses',
                component: () => import('@/views/Courses.vue'),
                meta: { title: '我的课程', icon: 'Reading', roles: ['student'] }
            },
            // {
            //     path: 'schedule',
            //     name: 'Schedule',
            //     component: () => import('@/views/Schedule.vue'),
            //     meta: { title: '课表管理', icon: 'Calendar', roles: ['teacher', 'admin'] }
            // },
            // {
            //     path: 'my-schedule',
            //     name: 'MySchedule',
            //     component: () => import('@/views/Schedule.vue'),
            //     meta: { title: '我的课表', icon: 'Calendar', roles: ['student'] }
            // },
            // {
            //     path: 'services',
            //     name: 'Services',
            //     component: () => import('@/views/Services.vue'),
            //     meta: { title: '校园服务', icon: 'Service' }
            // },
            {
                path: 'growth',
                name: 'Growth',
                component: () => import('@/views/Growth.vue'),
                meta: { title: '成长档案', icon: 'TrendCharts', roles: ['student'] }
            },
            {
                path: 'learning',
                name: 'Learning',
                component: () => import('@/views/Learning.vue'),
                meta: { title: '学习资源', icon: 'Reading', roles: ['student'] }
            },
            {
                path: 'notifications',
                name: 'Notifications',
                component: () => import('@/views/Notifications.vue'),
                meta: { title: '通知中心', icon: 'Bell' }
            },
            {
                path: 'profile',
                name: 'Profile',
                component: () => import('@/views/Profile.vue'),
                meta: { title: '个人设置', icon: 'Setting' }
            },
            {
                path: 'ai-science',
                name: 'AIScience',
                component: () => import('@/views/AIScience.vue'),
                meta: { title: 'AI科普乐园', icon: 'MagicStick' }
            },
            {
                path: 'ai-learning',
                name: 'AILearning',
                component: () => import('@/views/AILearning.vue'),
                meta: { title: 'AI学习助手', icon: 'Reading', roles: ['student'] }
            },
            {
                path: 'ai-writing',
                name: 'AIWriting',
                component: () => import('@/views/AIWriting.vue'),
                meta: { title: 'AI写作助手', icon: 'EditPen', roles: ['student'] }
            },
            {
                path: 'ai-ocr',
                name: 'AIOCR',
                component: () => import('@/views/AIOCR.vue'),
                meta: { title: 'AI智能识别', icon: 'Camera', roles: ['student'] }
            },
            {
                path: 'ai-creative',
                name: 'AICreative',
                component: () => import('@/views/AICreative.vue'),
                meta: { title: 'AI创意工具', icon: 'Picture', roles: ['student'] }
            },
            {
                path: 'ai-sentiment',
                name: 'AISentiment',
                component: () => import('@/views/AISentiment.vue'),
                meta: { title: 'AI情感分析', icon: 'Sunny', roles: ['student'] }
            },
            // ===== 教学质量评估模块 =====
            {
                path: 'teaching/exams',
                name: 'TeachingExams',
                component: () => import('@/views/teaching/ExamList.vue'),
                meta: { title: '考试管理', icon: 'Document', roles: ['admin', 'teacher'] }
            },
            {
                path: 'teaching/scores',
                name: 'TeachingScores',
                component: () => import('@/views/teaching/ScoreList.vue'),
                meta: { title: '成绩管理', icon: 'DataLine', roles: ['admin', 'teacher'] }
            },
            {
                path: 'teaching/analysis/class',
                name: 'TeachingClassAnalysis',
                component: () => import('@/views/teaching/ClassAnalysis.vue'),
                meta: { title: '班级学情分析', icon: 'DataAnalysis', roles: ['admin', 'teacher'] }
            },
            {
                path: 'teaching/analysis/grade',
                name: 'TeachingGradeAnalysis',
                component: () => import('@/views/teaching/GradeAnalysis.vue'),
                meta: { title: '年级学情分析', icon: 'TrendCharts', roles: ['admin'] }
            },
            {
                path: 'teaching/analysis/student',
                name: 'TeachingStudentAnalysis',
                component: () => import('@/views/teaching/StudentAnalysis.vue'),
                meta: { title: '学生学情分析', icon: 'User', roles: ['admin', 'teacher', 'student'] }
            },
            {
                path: 'teaching/classes',
                name: 'TeachingClasses',
                component: () => import('@/views/teaching/ClassManage.vue'),
                meta: { title: '班级管理', icon: 'School', roles: ['admin'] }
            },
            {
                path: 'teaching/subjects',
                name: 'TeachingSubjects',
                component: () => import('@/views/teaching/SubjectManage.vue'),
                meta: { title: '学科管理', icon: 'Reading', roles: ['admin'] }
            },
            // ===== 学生成长档案模块 =====
            {
                path: 'portfolio/overview',
                name: 'PortfolioOverview',
                component: () => import('@/views/portfolio/PortfolioOverview.vue'),
                meta: { title: '成长档案', icon: 'TrendCharts', roles: ['admin', 'teacher', 'student'] }
            },
            {
                path: 'portfolio/skills',
                name: 'PortfolioSkills',
                component: () => import('@/views/portfolio/SkillList.vue'),
                meta: { title: '技能记录', icon: 'Star', roles: ['admin', 'teacher', 'student'] }
            },
            {
                path: 'portfolio/honors',
                name: 'PortfolioHonors',
                component: () => import('@/views/portfolio/HonorList.vue'),
                meta: { title: '荣誉记录', icon: 'Trophy', roles: ['admin', 'teacher', 'student'] }
            },
            {
                path: 'portfolio/mental-health',
                name: 'PortfolioMentalHealth',
                component: () => import('@/views/portfolio/MentalHealth.vue'),
                meta: { title: '心理健康', icon: 'Heart', roles: ['admin', 'teacher', 'student'] }
            },
            {
                path: 'portfolio/comments',
                name: 'PortfolioComments',
                component: () => import('@/views/portfolio/CommentList.vue'),
                meta: { title: '学生评语', icon: 'EditPen', roles: ['admin', 'teacher'] }
            },
            {
                path: 'portfolio/class',
                name: 'PortfolioClass',
                component: () => import('@/views/portfolio/ClassPortfolio.vue'),
                meta: { title: '班级成长档案', icon: 'Avatar', roles: ['admin', 'teacher'] }
            }
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFound.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const userStore = useUserStore()
    const role = userStore.user?.role

  //登录成功才能查看
  // console.log('当前路径：',to.path);
  // console.log('用户角色；',role);

  // 未登录用户访问需要认证的页面，跳转登录
  if (to.meta.requiresAuth !== false && !userStore.isLoggedIn) {
      console.log('未登录用户访问需要认证的页面，跳转登录'); // 添加调试信息
      next('/login')
    return
  }

  // 已登录用户访问登录页，跳转到角色对应首页
  if (to.path === '/login' && userStore.isLoggedIn) {
      console.log('已登录用户访问登录页，跳转到角色对应首页'); // 添加调试信息
      const homeRoutes = {
      student: '/home',
      teacher: '/home',
      admin: '/'
    }
    next(homeRoutes[role] || '/home')
    return
  }

  // 访问 /home 时，根据角色加载对应首页组件
  if (to.path === '/home') {
    console.log('访问 /home 时，根据角色加载对应首页组件');
    // 首页会根据角色动态渲染不同内容，继续放行
    next()
    return
  }

  // 角色权限检查
  if (to.meta.roles && !to.meta.roles.includes(role)) {
    console.log('无权限访问，跳转到首页');
    // 无权限访问，跳转到首页
    next('/home')
    return
  }

  next()
})

export default router
