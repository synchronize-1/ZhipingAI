<template>
  <div class="class-portfolio">
    <PageHeader
      title="班级成长档案"
      description="查看班级学生成长档案概览"
      :breadcrumbs="breadcrumbs"
    />

    <!-- 筛选区 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="选择班级">
          <el-select
            v-model="filterForm.classId"
            placeholder="请选择班级"
            style="width: 200px"
            clearable
            @change="handleClassChange"
          >
            <el-option
              v-for="cls in classList"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="搜索">
          <el-input
            v-model="filterForm.keyword"
            placeholder="姓名/学号"
            style="width: 200px"
            clearable
            :prefix-icon="Search"
            @input="handleSearch"
          />
        </el-form-item>

        <el-form-item label="心理状态">
          <el-select
            v-model="filterForm.mentalStatus"
            placeholder="全部"
            style="width: 140px"
            clearable
            @change="handleFilter"
          >
            <el-option label="优秀" value="excellent" />
            <el-option label="良好" value="good" />
            <el-option label="一般" value="normal" />
            <el-option label="需关注" value="warning" />
          </el-select>
        </el-form-item>

        <el-form-item label="技能数量">
          <el-select
            v-model="filterForm.skillLevel"
            placeholder="全部"
            style="width: 140px"
            clearable
            @change="handleFilter"
          >
            <el-option label="丰富 (5+)" value="rich" />
            <el-option label="一般 (3-5)" value="medium" />
            <el-option label="较少 (<3)" value="few" />
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 统计数据 -->
      <div class="stats-bar">
        <div class="stats-item">
          <span class="stats-num">{{ studentList.length }}</span>
          <span class="stats-label">学生总数</span>
        </div>
        <div class="stats-divider"></div>
        <div class="stats-item">
          <span class="stats-num">{{ avgSkillCount }}</span>
          <span class="stats-label">平均技能数</span>
        </div>
        <div class="stats-divider"></div>
        <div class="stats-item">
          <span class="stats-num">{{ avgHonorCount }}</span>
          <span class="stats-label">平均荣誉数</span>
        </div>
        <div class="stats-divider"></div>
        <div class="stats-item">
          <span class="stats-num warning-count">{{ warningCount }}</span>
          <span class="stats-label">需关注</span>
        </div>
      </div>
    </el-card>

    <!-- 学生卡片列表 -->
    <div v-loading="loading" class="card-list-wrapper">
      <el-empty v-if="filteredList.length === 0 && !loading" description="暂无学生数据" :image-size="100" />

      <div class="card-grid">
        <div
          v-for="student in filteredList"
          :key="student.id"
          class="student-card"
          @click="goToDetail(student)"
        >
          <!-- 卡片头部 -->
          <div class="card-header">
            <el-avatar :size="56" :src="student.avatar" class="student-avatar">
              {{ student.name?.charAt(0) }}
            </el-avatar>
            <div class="student-info">
              <h3 class="student-name">{{ student.name }}</h3>
              <p class="student-no">{{ student.studentNo }}</p>
            </div>
            <el-tag
              class="mental-tag"
              :type="getMentalTagType(student.mentalStatus)"
              size="small"
              effect="dark"
            >
              {{ getMentalStatusText(student.mentalStatus) }}
            </el-tag>
          </div>

          <!-- 数据统计 -->
          <div class="card-stats">
            <div class="stat-item">
              <div class="stat-icon stat-icon--skill">
                <el-icon><Star /></el-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ student.skillCount || 0 }}</span>
                <span class="stat-label">技能</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon stat-icon--honor">
                <el-icon><Trophy /></el-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ student.honorCount || 0 }}</span>
                <span class="stat-label">荣誉</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon stat-icon--mental">
                <el-icon><Avatar /></el-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ student.mentalScore || '--' }}</span>
                <span class="stat-label">心理分</span>
              </div>
            </div>
          </div>

          <!-- 最新评语摘要 -->
          <div class="card-comment">
            <div class="comment-label">
              <el-icon :size="14"><Document /></el-icon>
              <span>最新评语</span>
            </div>
            <p class="comment-text">{{ student.latestComment || '暂无评语' }}</p>
          </div>

          <!-- 卡片底部 -->
          <div class="card-footer">
            <span class="footer-text">{{ student.className }}</span>
            <el-button type="primary" text size="small">
              查看详情
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.total > 0" class="pagination-wrapper">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :page-sizes="[12, 24, 48]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          :disabled="loading"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Star, Trophy, Avatar, Document, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { portfolioAPI } from '@/api/portfolio'
import PageHeader from '@/components/common/PageHeader.vue'

defineOptions({ name: 'ClassPortfolio' })

const router = useRouter()

const breadcrumbs = [
  { label: '成长档案' },
  { label: '班级档案' }
]

const loading = ref(false)
const classList = ref([])
const studentList = ref([])

const filterForm = reactive({
  classId: '',
  keyword: '',
  mentalStatus: '',
  skillLevel: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0
})

// 过滤后的列表
const filteredList = computed(() => {
  let list = studentList.value

  // 关键词搜索
  if (filterForm.keyword) {
    const keyword = filterForm.keyword.toLowerCase()
    list = list.filter(s =>
      s.name?.toLowerCase().includes(keyword) ||
      s.studentNo?.toLowerCase().includes(keyword)
    )
  }

  // 心理状态筛选
  if (filterForm.mentalStatus) {
    list = list.filter(s => s.mentalStatus === filterForm.mentalStatus)
  }

  // 技能数量筛选
  if (filterForm.skillLevel) {
    list = list.filter(s => {
      const count = s.skillCount || 0
      switch (filterForm.skillLevel) {
        case 'rich': return count >= 5
        case 'medium': return count >= 3 && count < 5
        case 'few': return count < 3
        default: return true
      }
    })
  }

  // 分页
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  pagination.total = list.length

  return list.slice(start, end)
})

// 平均技能数
const avgSkillCount = computed(() => {
  if (studentList.value.length === 0) return 0
  const total = studentList.value.reduce((sum, s) => sum + (s.skillCount || 0), 0)
  return (total / studentList.value.length).toFixed(1)
})

// 平均荣誉数
const avgHonorCount = computed(() => {
  if (studentList.value.length === 0) return 0
  const total = studentList.value.reduce((sum, s) => sum + (s.honorCount || 0), 0)
  return (total / studentList.value.length).toFixed(1)
})

// 需关注人数
const warningCount = computed(() => {
  return studentList.value.filter(s => s.mentalStatus === 'warning' || s.mentalStatus === 'critical').length
})

// 获取心理状态文字
const getMentalStatusText = (status) => {
  const map = {
    excellent: '优秀',
    good: '良好',
    normal: '一般',
    warning: '需关注',
    critical: '危险'
  }
  return map[status] || '良好'
}

// 获取心理状态标签类型
const getMentalTagType = (status) => {
  const map = {
    excellent: 'success',
    good: 'primary',
    normal: 'info',
    warning: 'warning',
    critical: 'danger'
  }
  return map[status] || 'info'
}

// 加载班级列表
const loadClassList = async () => {
  try {
    classList.value = [
      { id: '1', name: '高一(1)班' },
      { id: '2', name: '高一(2)班' },
      { id: '3', name: '高一(3)班' }
    ]
    // 默认选中第一个班级
    if (classList.value.length > 0) {
      filterForm.classId = classList.value[0].id
      loadStudentList()
    }
  } catch (error) {
    console.error('加载班级列表失败:', error)
  }
}

// 加载学生列表
const loadStudentList = async () => {
  if (!filterForm.classId) {
    studentList.value = []
    return
  }

  loading.value = true
  try {
    const res = await portfolioAPI.classList(filterForm.classId, { page: 1, pageSize: 100 })
    if (res.data?.list) {
      studentList.value = res.data.list
    } else if (Array.isArray(res.data)) {
      studentList.value = res.data
    }
  } catch (error) {
    console.error('加载学生列表失败:', error)
    // 使用模拟数据
    loadMockData()
  } finally {
    loading.value = false
  }
}

// 模拟数据
const loadMockData = () => {
  studentList.value = [
    {
      id: '1',
      name: '张三',
      studentNo: '2024001',
      className: '高一(1)班',
      avatar: '',
      skillCount: 8,
      honorCount: 5,
      mentalStatus: 'good',
      mentalScore: 82,
      latestComment: '该生本学期学习态度端正，成绩稳步提升，乐于助人，与同学相处融洽。'
    },
    {
      id: '2',
      name: '李四',
      studentNo: '2024002',
      className: '高一(1)班',
      avatar: '',
      skillCount: 6,
      honorCount: 3,
      mentalStatus: 'excellent',
      mentalScore: 90,
      latestComment: '学习认真刻苦，思维敏捷，是班级里的佼佼者。'
    },
    {
      id: '3',
      name: '王五',
      studentNo: '2024003',
      className: '高一(1)班',
      avatar: '',
      skillCount: 4,
      honorCount: 2,
      mentalStatus: 'normal',
      mentalScore: 72,
      latestComment: '性格开朗，与同学关系融洽，学习上还需更加努力。'
    },
    {
      id: '4',
      name: '赵六',
      studentNo: '2024004',
      className: '高一(1)班',
      avatar: '',
      skillCount: 3,
      honorCount: 1,
      mentalStatus: 'warning',
      mentalScore: 58,
      latestComment: '近期学习状态有所下滑，建议多关注心理健康，及时调整心态。'
    },
    {
      id: '5',
      name: '钱七',
      studentNo: '2024005',
      className: '高一(1)班',
      avatar: '',
      skillCount: 7,
      honorCount: 4,
      mentalStatus: 'good',
      mentalScore: 85,
      latestComment: '德智体美劳全面发展，是同学们学习的榜样。'
    },
    {
      id: '6',
      name: '孙八',
      studentNo: '2024006',
      className: '高一(1)班',
      avatar: '',
      skillCount: 5,
      honorCount: 2,
      mentalStatus: 'good',
      mentalScore: 78,
      latestComment: '学习踏实认真，尊敬师长，团结同学，继续保持。'
    },
    {
      id: '7',
      name: '周九',
      studentNo: '2024007',
      className: '高一(1)班',
      avatar: '',
      skillCount: 2,
      honorCount: 0,
      mentalStatus: 'normal',
      mentalScore: 70,
      latestComment: '学习基础较弱，需要加强基础知识的学习和巩固。'
    },
    {
      id: '8',
      name: '吴十',
      studentNo: '2024008',
      className: '高一(1)班',
      avatar: '',
      skillCount: 9,
      honorCount: 6,
      mentalStatus: 'excellent',
      mentalScore: 92,
      latestComment: '品学兼优，综合素质突出，在各方面都表现优异。'
    }
  ]
  pagination.total = studentList.value.length
}

// 班级变化
const handleClassChange = () => {
  pagination.page = 1
  loadStudentList()
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
}

// 筛选
const handleFilter = () => {
  pagination.page = 1
}

// 分页变化
const handlePageChange = (page) => {
  pagination.page = page
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
}

// 跳转到学生详情
const goToDetail = (student) => {
  router.push({
    path: '/portfolio/overview',
    query: { studentId: student.id }
  })
}

onMounted(() => {
  loadClassList()
})
</script>

<style scoped lang="scss">
.class-portfolio {
  padding: 20px;

  .filter-card {
    margin-bottom: 16px;

    .filter-form {
      margin-bottom: 16px;
    }

    .stats-bar {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%);
      border-radius: 8px;

      .stats-item {
        flex: 1;
        text-align: center;

        .stats-num {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: #667eea;
          line-height: 1.2;

          &.warning-count {
            color: #f59e0b;
          }
        }

        .stats-label {
          font-size: 13px;
          color: #909399;
          margin-top: 4px;
        }
      }

      .stats-divider {
        width: 1px;
        height: 36px;
        background: #e4e7ed;
      }
    }
  }

  .card-list-wrapper {
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .student-card {
      background: #fff;
      border: 1px solid #ebeef5;
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        border-color: #667eea;
      }

      .card-header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 16px;

        .student-avatar {
          flex-shrink: 0;
          border: 2px solid #ebeef5;
        }

        .student-info {
          flex: 1;
          min-width: 0;

          .student-name {
            margin: 0 0 4px 0;
            font-size: 18px;
            font-weight: 600;
            color: #303133;
          }

          .student-no {
            margin: 0;
            font-size: 13px;
            color: #909399;
          }
        }

        .mental-tag {
          flex-shrink: 0;
        }
      }

      .card-stats {
        display: flex;
        justify-content: space-around;
        padding: 16px 0;
        border-top: 1px solid #f0f0f0;
        border-bottom: 1px solid #f0f0f0;
        margin-bottom: 16px;

        .stat-item {
          display: flex;
          align-items: center;
          gap: 10px;

          .stat-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 18px;

            &--skill {
              background: linear-gradient(135deg, #3b82f6, #60a5fa);
            }

            &--honor {
              background: linear-gradient(135deg, #f59e0b, #fbbf24);
            }

            &--mental {
              background: linear-gradient(135deg, #10b981, #34d399);
            }
          }

          .stat-info {
            display: flex;
            flex-direction: column;

            .stat-value {
              font-size: 20px;
              font-weight: 700;
              color: #303133;
              line-height: 1.2;
            }

            .stat-label {
              font-size: 12px;
              color: #909399;
              margin-top: 2px;
            }
          }
        }
      }

      .card-comment {
        margin-bottom: 16px;

        .comment-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #909399;
          margin-bottom: 8px;
        }

        .comment-text {
          margin: 0;
          font-size: 13px;
          color: #606266;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }

      .card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .footer-text {
          font-size: 13px;
          color: #909399;
        }

        .el-button {
          padding: 0;

          .el-icon {
            margin-left: 2px;
          }
        }
      }
    }

    .pagination-wrapper {
      display: flex;
      justify-content: center;
      margin-top: 24px;
    }
  }
}
</style>
