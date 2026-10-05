import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { filterResources } from '../utils/resourceHelpers'

// 学习资源推荐的状态与业务逻辑。
export function useLearningResources() {
  const activeTab = ref('all')

  // 丰富的学习资源数据 - 包含真实跳转链接
  const resources = ref([
    {
      id: 1,
      type: 'video',
      title: '数据结构与算法 - 二叉树详解',
      description: '深入讲解二叉树的概念、遍历方法和应用场景',
      cover: 'https://img-c.udemycdn.com/course/480x270/1468694_dd7d_2.jpg',
      provider: '中国大学MOOC',
      providerLogo: 'https://img.icons8.com/color/48/graduation-cap.png',
      duration: '45:30',
      views: '2.3万',
      tags: ['数据结构', '二叉树', '算法'],
      progress: 65,
      url: 'https://www.icourse163.org/course/ZJU-93001'
    },
    {
      id: 2,
      type: 'doc',
      title: 'Python数据结构实战手册',
      description: '全面介绍Python中常用数据结构的使用方法和最佳实践',
      cover: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
      provider: '极客时间',
      providerLogo: 'https://img.icons8.com/color/48/code.png',
      views: '1.8万',
      tags: ['Python', '数据结构', '实战'],
      progress: 30,
      url: 'https://time.geekbang.org/column/intro/100017301'
    },
    {
      id: 3,
      type: 'practice',
      title: 'LeetCode精选100题',
      description: '精选100道高频算法面试题，附详细解析和代码',
      cover: 'https://assets.leetcode.com/static_assets/public/images/LeetCode_Sharing.png',
      provider: 'LeetCode',
      providerLogo: 'https://img.icons8.com/external-tal-revivo-color-tal-revivo/48/external-level-up-your-coding-skills-and-quickly-land-a-job-logo-color-tal-revivo.png',
      views: '5.6万',
      tags: ['算法', '面试', '练习'],
      progress: 12,
      url: 'https://leetcode.cn/studyplan/top-100-liked/'
    },
    {
      id: 4,
      type: 'video',
      title: '机器学习入门 - 吴恩达课程',
      description: '斯坦福大学经典机器学习课程，从零开始学习ML',
      cover: 'https://img-c.udemycdn.com/course/480x270/950390_270f_3.jpg',
      provider: 'Coursera',
      providerLogo: 'https://img.icons8.com/color/48/coursera.png',
      duration: '32:15',
      views: '3.1万',
      tags: ['机器学习', 'Python', 'AI'],
      url: 'https://www.coursera.org/learn/machine-learning'
    },
    {
      id: 5,
      type: 'doc',
      title: 'PyTorch深度学习实战',
      description: '系统学习PyTorch框架，从基础到实战项目',
      cover: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400',
      provider: '掘金',
      providerLogo: 'https://img.icons8.com/color/48/documents.png',
      views: '9800',
      tags: ['深度学习', 'PyTorch', 'AI'],
      url: 'https://juejin.cn/post/7000000000000000000'
    },
    {
      id: 6,
      type: 'practice',
      title: '前端面试题库 - 200题精选',
      description: '涵盖HTML、CSS、JavaScript、Vue、React等核心知识点',
      cover: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400',
      provider: '牛客网',
      providerLogo: 'https://img.icons8.com/color/48/test-passed.png',
      views: '4.2万',
      tags: ['前端', '面试', 'JavaScript'],
      url: 'https://www.nowcoder.com/exam/interview'
    },
    {
      id: 7,
      type: 'video',
      title: 'Vue3从入门到精通',
      description: '最新Vue3技术栈完整教程，Composition API详解',
      cover: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
      provider: 'B站',
      providerLogo: 'https://img.icons8.com/color/48/bilibili.png',
      duration: '12:30:00',
      views: '128万',
      tags: ['Vue3', '前端', 'JavaScript'],
      progress: 45,
      url: 'https://www.bilibili.com/video/BV1dS4y1y7vd'
    },
    {
      id: 8,
      type: 'video',
      title: 'Spring Boot企业级开发',
      description: '从零搭建企业级Spring Boot项目，整合主流技术栈',
      cover: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400',
      provider: '慕课网',
      providerLogo: 'https://img.icons8.com/color/48/java-coffee-cup-logo.png',
      duration: '28:45:00',
      views: '56万',
      tags: ['Java', 'Spring Boot', '后端'],
      url: 'https://www.imooc.com/learn/1279'
    },
    {
      id: 9,
      type: 'doc',
      title: 'MySQL性能优化指南',
      description: '深入理解MySQL索引原理，掌握SQL优化技巧',
      cover: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400',
      provider: '掘金',
      providerLogo: 'https://img.icons8.com/color/48/mysql-logo.png',
      views: '2.1万',
      tags: ['MySQL', '数据库', '性能优化'],
      progress: 78,
      url: 'https://juejin.cn/post/6844903569632526343'
    },
    {
      id: 10,
      type: 'practice',
      title: '剑指Offer算法题精选',
      description: '68道经典算法面试题，附详细题解和多种解法',
      cover: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400',
      provider: 'LeetCode',
      providerLogo: 'https://img.icons8.com/external-tal-revivo-color-tal-revivo/48/external-level-up-your-coding-skills-and-quickly-land-a-job-logo-color-tal-revivo.png',
      views: '8.9万',
      tags: ['算法', '面试', '剑指Offer'],
      progress: 35,
      url: 'https://leetcode.cn/studyplan/coding-interviews/'
    },
    {
      id: 11,
      type: 'video',
      title: 'React18核心技术解析',
      description: '深入理解React18新特性，Hooks原理与实战',
      cover: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400',
      provider: 'B站',
      providerLogo: 'https://img.icons8.com/color/48/bilibili.png',
      duration: '15:20:00',
      views: '89万',
      tags: ['React', '前端', 'Hooks'],
      url: 'https://www.bilibili.com/video/BV1ZB4y1Z7o8'
    },
    {
      id: 12,
      type: 'doc',
      title: 'Docker容器化部署实战',
      description: '从零学习Docker，掌握容器化部署与编排',
      cover: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=400',
      provider: 'CSDN',
      providerLogo: 'https://img.icons8.com/color/48/docker.png',
      views: '3.5万',
      tags: ['Docker', 'DevOps', '云原生'],
      url: 'https://blog.csdn.net/docker'
    },
    {
      id: 13,
      type: 'practice',
      title: 'SQL练习50题精选',
      description: '经典SQL面试题，覆盖查询、连接、子查询等',
      cover: 'https://images.unsplash.com/photo-1489875347897-49f64b51c1f8?w=400',
      provider: '牛客网',
      providerLogo: 'https://img.icons8.com/color/48/test-passed.png',
      views: '6.7万',
      tags: ['SQL', '数据库', '面试'],
      progress: 60,
      url: 'https://www.nowcoder.com/exam/oj?tab=SQL%E7%AF%87'
    },
    {
      id: 14,
      type: 'video',
      title: 'Kubernetes入门到实战',
      description: '云原生容器编排技术K8s完整教程',
      cover: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400',
      provider: '极客时间',
      providerLogo: 'https://img.icons8.com/color/48/kubernetes.png',
      duration: '20:00:00',
      views: '12万',
      tags: ['K8s', '云原生', 'DevOps'],
      url: 'https://time.geekbang.org/column/intro/100015201'
    },
    {
      id: 15,
      type: 'doc',
      title: 'Redis设计与实现',
      description: '深入理解Redis数据结构、持久化和集群原理',
      cover: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
      provider: '极客时间',
      providerLogo: 'https://img.icons8.com/color/48/redis.png',
      views: '4.8万',
      tags: ['Redis', '缓存', '数据库'],
      progress: 25,
      url: 'https://time.geekbang.org/column/intro/100056701'
    }
  ])

  const filteredResources = computed(() => filterResources(resources.value, activeTab.value))

  const openResource = (resource) => {
    if (resource.url) {
      window.open(resource.url, '_blank')
      ElMessage.success(`正在跳转到：${resource.provider}`)
    } else {
      ElMessage.info(`${resource.title} - 链接暂未配置`)
    }
  }

  return {
    activeTab,
    resources,
    filteredResources,
    openResource
  }
}