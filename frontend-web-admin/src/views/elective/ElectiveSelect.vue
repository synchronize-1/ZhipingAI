<template>
  <div class="elective-select">
    <PageHeader
      title="选课中心"
      description="浏览开放中的选修课程，按容量与时间窗口自主选课、退选"
      :breadcrumbs="[{ label: '我的' }, { label: '选课中心' }]"
    >
      <template #extra>
        <el-button :icon="Refresh" @click="refreshAll">刷新</el-button>
      </template>
    </PageHeader>

    <!-- 我的选课概览 -->
    <div class="summary-grid">
      <div class="summary-card">
        <el-icon :size="26" class="summary-icon primary"><Select /></el-icon>
        <div>
          <div class="summary-value">{{ my.selectedCount }}</div>
          <div class="summary-label">已选课程</div>
        </div>
      </div>
      <div class="summary-card">
        <el-icon :size="26" class="summary-icon success"><Medal /></el-icon>
        <div>
          <div class="summary-value">{{ my.totalCredit }}</div>
          <div class="summary-label">已选学分</div>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="elective-tabs">
      <!-- 课程广场 -->
      <el-tab-pane label="课程广场" name="plaza">
        <el-card class="toolbar-card" shadow="never">
          <div class="toolbar">
            <el-select v-model="searchParams.semester" placeholder="全部学期" clearable style="width: 180px" @change="reload">
              <el-option v-for="s in semesters" :key="s" :label="s" :value="s" />
            </el-select>
            <el-select v-model="searchParams.category" placeholder="全部类别" clearable style="width: 160px" @change="reload">
              <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
            </el-select>
            <el-input
              v-model="searchParams.keyword"
              placeholder="搜索课程名称 / 编号"
              clearable
              style="width: 240px"
              :prefix-icon="Search"
              @keyup.enter="reload"
              @clear="reload"
            />
            <el-button type="primary" :icon="Search" @click="reload">查询</el-button>
          </div>
        </el-card>

        <div v-loading="loading" class="course-grid">
          <el-card
            v-for="course in list"
            :key="course.id"
            class="course-card"
            shadow="hover"
            :class="{ 'is-selected': course.hasSelected }"
          >
            <div class="course-head">
              <div class="course-title">
                <span class="course-name">{{ course.name }}</span>
                <el-tag v-if="course.category" size="small" effect="plain">{{ course.category }}</el-tag>
              </div>
              <el-tag v-if="course.hasSelected" type="success" size="small" effect="dark">已选</el-tag>
              <el-tag v-else-if="course.isFull" type="danger" size="small" effect="plain">已满</el-tag>
            </div>

            <p class="course-desc">{{ course.description || '暂无课程简介' }}</p>

            <div class="course-meta">
              <span><el-icon><User /></el-icon>{{ course.teacherName || '待定' }}</span>
              <span><el-icon><Clock /></el-icon>{{ course.scheduleText || '时间待定' }}</span>
              <span><el-icon><Location /></el-icon>{{ course.location || '地点待定' }}</span>
              <span><el-icon><Medal /></el-icon>{{ course.credit ?? '-' }} 学分</span>
            </div>

            <div class="course-foot">
              <div class="capacity">
                <div class="capacity-text">
                  <span :class="{ 'is-full': course.isFull }">{{ course.selectedCount }}</span> / {{ course.capacity }} 人
                </div>
                <el-progress
                  :percentage="capacityPercent(course)"
                  :stroke-width="6"
                  :show-text="false"
                  :status="course.isFull ? 'exception' : undefined"
                />
              </div>

              <el-button
                v-if="course.hasSelected"
                type="warning"
                plain
                size="small"
                :icon="Remove"
                @click="handleDrop(course)"
              >
                退选
              </el-button>
              <el-button
                v-else
                type="primary"
                size="small"
                :icon="Plus"
                :disabled="!course.canSelect"
                @click="handleSelect(course)"
              >
                {{ selectButtonText(course) }}
              </el-button>
            </div>
          </el-card>
        </div>

        <el-empty v-if="!loading && !list.length" description="暂无可选课程" />

        <div v-if="pagination.total > pagination.pageSize" class="pagination">
          <el-pagination
            v-model:current-page="pagination.page"
            :page-size="pagination.pageSize"
            :total="pagination.total"
            layout="prev, pager, next"
            background
            @current-change="handlePageChange"
          />
        </div>
      </el-tab-pane>

      <!-- 我的选课 -->
      <el-tab-pane label="我的选课" name="mine">
        <el-card shadow="never">
          <el-table :data="my.list" border stripe>
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="name" label="课程名称" min-width="180" show-overflow-tooltip />
            <el-table-column prop="category" label="类别" width="110" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.category" size="small" effect="plain">{{ row.category }}</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="teacherName" label="授课教师" width="110">
              <template #default="{ row }">{{ row.teacherName || '-' }}</template>
            </el-table-column>
            <el-table-column prop="scheduleText" label="上课时间" min-width="140">
              <template #default="{ row }">{{ row.scheduleText || '-' }}</template>
            </el-table-column>
            <el-table-column prop="location" label="地点" min-width="120">
              <template #default="{ row }">{{ row.location || '-' }}</template>
            </el-table-column>
            <el-table-column label="学分" width="80" align="center">
              <template #default="{ row }">{{ row.credit ?? '-' }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'selected' ? 'success' : 'info'" size="small">
                  {{ row.status === 'selected' ? '已选' : '已退选' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'selected'"
                  link
                  type="warning"
                  :icon="Remove"
                  @click="handleDropById(row)"
                >
                  退选
                </el-button>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="还没有选修课程，去课程广场看看吧" />
            </template>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Remove, Refresh, Search, Select, Medal, User, Clock, Location } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { electiveAPI } from '@/api/electives'
import PageHeader from '@/components/common/PageHeader.vue'
import { useTable } from '@/composables/useTable'

const activeTab = ref('plaza')
const semesters = ref([])
const categories = ref([])
const my = ref({ list: [], selectedCount: 0, totalCredit: 0 })

// 课程广场：分页 / 筛选统一由 useTable 承担
const fetchCourses = (params) => {
  const cleaned = {}
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== undefined && v !== null) cleaned[k] = v
  })
  return electiveAPI.list(cleaned)
}
const {
  loading,
  dataList: list,
  pagination,
  searchParams,
  fetchData: loadList,
  handleSearch: reload,
  handlePageChange
} = useTable(fetchCourses, { semester: '', category: '', keyword: '' })
pagination.pageSize = 12

const capacityPercent = (course) => {
  if (!course.capacity) return 0
  return Math.min(100, Math.round((course.selectedCount / course.capacity) * 100))
}

function selectButtonText(course) {
  if (course.isFull) return '名额已满'
  if (!course.withinWindow) return '不在选课时间'
  return '选课'
}

async function loadMy() {
  try {
    const res = await electiveAPI.my()
    my.value = res.data || { list: [], selectedCount: 0, totalCredit: 0 }
  } catch (error) {
    /* 拦截器已提示 */
  }
}

async function loadFilters() {
  try {
    const res = await electiveAPI.categories()
    categories.value = res.data?.categories || []
    semesters.value = res.data?.semesters || []
  } catch (error) {
    /* 拦截器已提示 */
  }
}

async function refreshAll() {
  await Promise.all([loadList(), loadMy(), loadFilters()])
}

async function handleSelect(course) {
  try {
    await electiveAPI.select(course.id)
    ElMessage.success(`已选修「${course.name}」`)
    await refreshAll()
  } catch (error) {
    /* 拦截器已提示 */
  }
}

async function confirmDrop(name) {
  try {
    await ElMessageBox.confirm(`确定退选「${name}」吗？`, '退选确认', {
      type: 'warning',
      confirmButtonText: '确定退选',
      cancelButtonText: '取消'
    })
    return true
  } catch (error) {
    return false
  }
}

async function handleDrop(course) {
  if (!(await confirmDrop(course.name))) return
  try {
    await electiveAPI.drop(course.id)
    ElMessage.success('已退选')
    await refreshAll()
  } catch (error) {
    /* 拦截器已提示 */
  }
}

async function handleDropById(row) {
  if (!(await confirmDrop(row.name))) return
  try {
    await electiveAPI.drop(row.courseId)
    ElMessage.success('已退选')
    await refreshAll()
  } catch (error) {
    /* 拦截器已提示 */
  }
}

onMounted(async () => {
  await loadFilters()
  // 课程广场列表由 useTable 在挂载时自动加载
  await loadMy()
})
</script>

<style scoped lang="scss">
.elective-select {
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 240px));
    gap: 16px;
    margin-bottom: 8px;
  }

  .summary-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 20px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #eef0f5;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  }

  .summary-icon {
    &.primary { color: #409eff; }
    &.success { color: #67c23a; }
  }

  .summary-value {
    font-size: 22px;
    font-weight: 700;
    color: #303133;
    line-height: 1.2;
  }

  .summary-label {
    font-size: 13px;
    color: #909399;
  }

  .toolbar-card {
    margin-bottom: 16px;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .course-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    min-height: 120px;
  }

  .course-card {
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-3px);
    }

    &.is-selected {
      border-color: #67c23a;
      box-shadow: 0 4px 16px rgba(103, 194, 58, 0.15);
    }

    :deep(.el-card__body) {
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 10px;
    }
  }

  .course-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .course-title {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .course-name {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    line-height: 1.4;
  }

  .course-desc {
    margin: 0;
    font-size: 13px;
    color: #909399;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 42px;
  }

  .course-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    font-size: 12px;
    color: #606266;

    span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  }

  .course-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: auto;
    padding-top: 8px;
    border-top: 1px dashed #ebeef5;
  }

  .capacity {
    flex: 1;
    min-width: 0;
  }

  .capacity-text {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;

    span {
      color: #409eff;
      font-weight: 600;

      &.is-full {
        color: #f56c6c;
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}

/* 平板 / 小屏适配 */
@media (max-width: 1200px) {
  .elective-select .course-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .elective-select {
    .summary-grid {
      grid-template-columns: 1fr;
    }

    .course-grid {
      grid-template-columns: 1fr;
    }

    .toolbar {
      flex-direction: column;
      align-items: stretch;

      .el-select,
      .el-input {
        width: 100% !important;
      }
    }
  }
}
</style>