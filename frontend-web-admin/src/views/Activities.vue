<template>
  <div class="activities-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>🎯 校园活动管理</h1>
        <p>{{ isAdmin ? '管理所有校园活动，查看报名记录' : '发现精彩校园生活，参与丰富多彩的活动' }}</p>
      </div>
      <div class="header-right">
        <el-input v-model="searchQuery" placeholder="搜索活动..." prefix-icon="Search" class="w-64" clearable />
        <el-select v-model="categoryFilter" placeholder="活动类型" clearable class="w-32">
          <el-option label="全部" value="" />
          <el-option label="文艺演出" value="文艺" />
          <el-option label="学术讲座" value="学术" />
          <el-option label="体育竞技" value="体育" />
          <el-option label="志愿公益" value="公益" />
          <el-option label="社团活动" value="社团" />
          <el-option label="就业招聘" value="就业" />
        </el-select>
        <el-button type="primary" :icon="Plus" @click="showAddDialog = true">发布活动</el-button>
      </div>
    </div>

    <!-- 活动统计 -->
    <div class="activity-stats">
      <div class="stat-item">
        <span class="stat-value">{{ activities.length }}</span>
        <span class="stat-label">全部活动</span>
      </div>
      <div class="stat-item">
        <span class="stat-value text-green-500">{{ activities.filter(a => a.status === 'upcoming').length }}</span>
        <span class="stat-label">即将开始</span>
      </div>
      <div class="stat-item">
        <span class="stat-value text-blue-500">{{ activities.filter(a => a.status === 'ongoing').length }}</span>
        <span class="stat-label">进行中</span>
      </div>
      <div class="stat-item">
        <span class="stat-value text-purple-500">{{ totalParticipants }}</span>
        <span class="stat-label">总报名人数</span>
      </div>
    </div>

    <!-- 管理员视图：活动报名记录表格 -->
    <div v-if="isAdmin" class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">📋 活动报名记录</h3>
        <el-select v-model="selectedActivityId" placeholder="选择活动" class="w-64">
          <el-option label="全部活动" :value="0" />
          <el-option v-for="a in activities" :key="a.id" :label="a.title" :value="a.id" />
        </el-select>
      </div>
      <el-table :data="filteredRegistrations" stripe style="width: 100%">
        <el-table-column prop="id" label="报名ID" width="100" />
        <el-table-column prop="studentName" label="学生姓名" width="120" />
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="activityName" label="活动名称" min-width="180" />
        <el-table-column prop="category" label="活动类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="registerTime" label="报名时间" width="160" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已签到' ? 'success' : 'primary'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="checkInStudent(row)" :disabled="row.status === '已签到'">签到</el-button>
            <el-button size="small" type="danger" @click="cancelRegistration(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 活动列表 -->
    <div class="activities-grid">
      <div v-for="activity in filteredActivities" :key="activity.id" class="activity-card" @click="viewActivity(activity)">
        <div class="card-cover" :style="{ background: activity.coverGradient }">
          <img v-if="activity.cover" :src="activity.cover" :alt="activity.title" class="cover-image" />
          <div class="cover-overlay"></div>
          <el-tag class="status-tag" :type="getStatusType(activity.status)" effect="dark">
            {{ getStatusText(activity.status) }}
          </el-tag>
          <div class="category-badge">{{ activity.category }}</div>
        </div>
        <div class="card-content">
          <h3 class="activity-title">{{ activity.title }}</h3>
          <p class="activity-desc">{{ activity.description }}</p>
          <div class="activity-meta">
            <div class="meta-item"><span class="meta-icon">📅</span>{{ formatTime(activity.start_time) }}</div>
            <div class="meta-item"><span class="meta-icon">📍</span>{{ activity.location }}</div>
            <div class="meta-item"><span class="meta-icon">👥</span>{{ activity.current_participants || 0 }}/{{ activity.max_participants }}人</div>
          </div>
          <div class="card-footer">
            <div class="organizer">
              <el-avatar :size="28" :style="{ background: activity.organizerColor }">{{ activity.organizer_name?.charAt(0) }}</el-avatar>
              <span>{{ activity.organizer_name }}</span>
            </div>
            <el-button 
              type="primary" 
              size="small" 
              :disabled="activity.status !== 'upcoming' || activity.current_participants >= activity.max_participants || activity.hasJoined"
              @click.stop="joinActivity(activity)"
            >
              {{ activity.hasJoined ? '已报名' : (activity.status === 'upcoming' ? (activity.current_participants >= activity.max_participants ? '已满员' : '立即报名') : '已结束') }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="filteredActivities.length === 0" description="暂无活动" class="mt-10" />

    <!-- 发布活动对话框 -->
    <el-dialog v-model="showAddDialog" title="发布活动" width="650px" class="activity-dialog">
      <el-form :model="activityForm" label-width="90px" class="activity-form">
        <el-form-item label="活动名称" required><el-input v-model="activityForm.title" placeholder="请输入活动名称" /></el-form-item>
        <el-form-item label="活动类型" required>
          <el-select v-model="activityForm.category" class="w-full" placeholder="选择活动类型">
            <el-option label="文艺演出" value="文艺" />
            <el-option label="学术讲座" value="学术" />
            <el-option label="体育竞技" value="体育" />
            <el-option label="志愿公益" value="公益" />
            <el-option label="社团活动" value="社团" />
            <el-option label="就业招聘" value="就业" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动地点" required><el-input v-model="activityForm.location" placeholder="如：大学生活动中心" /></el-form-item>
        <div class="flex gap-4">
          <el-form-item label="开始时间" required class="flex-1"><el-date-picker v-model="activityForm.startTime" type="datetime" class="w-full" placeholder="选择开始时间" /></el-form-item>
          <el-form-item label="结束时间" required class="flex-1"><el-date-picker v-model="activityForm.endTime" type="datetime" class="w-full" placeholder="选择结束时间" /></el-form-item>
        </div>
        <el-form-item label="人数限制"><el-input-number v-model="activityForm.maxParticipants" :min="1" :max="1000" /></el-form-item>
        <el-form-item label="活动描述"><el-input v-model="activityForm.description" type="textarea" :rows="4" placeholder="请详细描述活动内容、参与方式等" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitActivity">发布活动</el-button>
      </template>
    </el-dialog>

    <!-- 活动详情对话框 -->
    <el-dialog v-model="showDetailDialog" :title="selectedActivity?.title" width="700px">
      <div v-if="selectedActivity" class="activity-detail">
        <div class="detail-cover" :style="{ background: selectedActivity.coverGradient }">
          <img v-if="selectedActivity.cover" :src="selectedActivity.cover" class="detail-cover-img" />
        </div>
        <div class="detail-info">
          <div class="info-row"><span class="info-label">活动类型</span><el-tag>{{ selectedActivity.category }}</el-tag></div>
          <div class="info-row"><span class="info-label">活动时间</span><span>{{ formatTime(selectedActivity.start_time) }} - {{ formatTime(selectedActivity.end_time) }}</span></div>
          <div class="info-row"><span class="info-label">活动地点</span><span>{{ selectedActivity.location }}</span></div>
          <div class="info-row"><span class="info-label">主办方</span><span>{{ selectedActivity.organizer_name }}</span></div>
          <div class="info-row"><span class="info-label">报名人数</span><span>{{ selectedActivity.current_participants || 0 }} / {{ selectedActivity.max_participants }} 人</span></div>
          <div class="info-row full"><span class="info-label">活动详情</span><p class="detail-desc">{{ selectedActivity.description }}</p></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="joinActivity(selectedActivity)" :disabled="selectedActivity?.status !== 'upcoming'">立即报名</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useSocketStore } from '@/stores/socket'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

// computed is already imported above

defineOptions({ name: 'Activities' })

const socketStore = useSocketStore()
const userStore = useUserStore()

const isAdmin = computed(() => userStore.user?.role === 'admin')
const searchQuery = ref('')
const categoryFilter = ref('')
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const selectedActivity = ref(null)
const selectedActivityId = ref(0)
const activityForm = ref({ title: '', category: '', location: '', startTime: null, endTime: null, maxParticipants: 100, description: '' })

// 活动报名记录数据
const registrations = ref([
  { id: 1001, studentName: '张明轩', studentId: '2024001001', activityName: '2026年新年音乐会', category: '文艺', registerTime: '2026-01-10 14:32', status: '已报名', activityId: 1 },
  { id: 1002, studentName: '李雨晴', studentId: '2024001002', activityName: '2026年新年音乐会', category: '文艺', registerTime: '2026-01-10 15:18', status: '已签到', activityId: 1 },
  { id: 1003, studentName: '王子轩', studentId: '2023001001', activityName: '人工智能前沿技术讲座', category: '学术', registerTime: '2026-01-09 09:45', status: '已报名', activityId: 2 },
  { id: 1004, studentName: '陈思琪', studentId: '2024001003', activityName: '人工智能前沿技术讲座', category: '学术', registerTime: '2026-01-09 10:22', status: '已报名', activityId: 2 },
  { id: 1005, studentName: '刘浩宇', studentId: '2024001004', activityName: '校园马拉松挑战赛', category: '体育', registerTime: '2026-01-08 16:30', status: '已签到', activityId: 3 },
  { id: 1006, studentName: '周雅婷', studentId: '2023001002', activityName: '校园马拉松挑战赛', category: '体育', registerTime: '2026-01-08 17:05', status: '已签到', activityId: 3 },
  { id: 1007, studentName: '赵俊杰', studentId: '2024001005', activityName: '寒假支教志愿者招募', category: '公益', registerTime: '2026-01-11 08:15', status: '已报名', activityId: 4 },
  { id: 1008, studentName: '孙雨萱', studentId: '2024001006', activityName: '摄影社作品展览', category: '社团', registerTime: '2026-01-10 11:40', status: '已报名', activityId: 5 }
])

const filteredRegistrations = computed(() => {
  if (selectedActivityId.value === 0) return registrations.value
  return registrations.value.filter(r => r.activityId === selectedActivityId.value)
})

const checkInStudent = (row) => {
  row.status = '已签到'
  ElMessage.success(`${row.studentName} 签到成功`)
}

const cancelRegistration = (row) => {
  registrations.value = registrations.value.filter(r => r.id !== row.id)
  ElMessage.success(`已取消 ${row.studentName} 的报名`)
}

// 活动数据 - 参考真实高校活动，使用真实图片
const activities = ref([
  { id: 1, title: '2026年新年音乐会', category: '文艺', status: 'upcoming', start_time: '2026-01-20 19:00', end_time: '2026-01-20 21:30', location: '大学生活动中心大礼堂', organizer_name: '校团委', max_participants: 500, current_participants: 387, description: '一年一度的新年音乐会，汇聚校内外优秀音乐人才，为师生呈现一场视听盛宴。节目包含民乐、交响乐、流行音乐等多种形式，欢迎全校师生参与。', cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&h=400&fit=crop', coverGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', organizerColor: '#667eea' },
  { id: 2, title: '人工智能前沿技术讲座', category: '学术', status: 'upcoming', start_time: '2026-01-15 14:00', end_time: '2026-01-15 16:30', location: '图书馆报告厅', organizer_name: '计算机学院', max_participants: 200, current_participants: 156, description: '邀请业界知名专家分享AI最新研究成果，包括大语言模型、多模态学习、具身智能等前沿话题。参与者可获得学术活动学分。', cover: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop', coverGradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', organizerColor: '#11998e' },
  { id: 3, title: '校园马拉松挑战赛', category: '体育', status: 'ongoing', start_time: '2026-01-11 07:00', end_time: '2026-01-11 12:00', location: '校园环形跑道', organizer_name: '体育部', max_participants: 300, current_participants: 245, description: '冬季校园马拉松，设有5公里、10公里、半程马拉松三个组别。完成比赛可获得精美纪念奖牌，前20名有丰厚奖品。', cover: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&h=400&fit=crop', coverGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', organizerColor: '#f5576c' },
  { id: 4, title: '寒假支教志愿者招募', category: '公益', status: 'upcoming', start_time: '2026-01-25 09:00', end_time: '2026-02-10 17:00', location: '贵州山区小学', organizer_name: '青年志愿者协会', max_participants: 30, current_participants: 28, description: '为山区孩子带去知识和温暖，开展为期两周的支教活动。提供往返交通、食宿补贴。要求有责任心、有耐心，具备一定教学能力。', cover: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600&h=400&fit=crop', coverGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', organizerColor: '#fa709a' },
  { id: 5, title: '摄影社作品展览', category: '社团', status: 'ongoing', start_time: '2026-01-10 10:00', end_time: '2026-01-17 18:00', location: '艺术楼展览厅', organizer_name: '摄影协会', max_participants: 1000, current_participants: 523, description: '本次展览展出社员一年来的优秀摄影作品，涵盖风光、人文、纪实等多种题材。现场设有互动体验区，可与摄影师交流技巧。', cover: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=600&h=400&fit=crop', coverGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', organizerColor: '#4facfe' },
  { id: 6, title: '春季校园招聘会', category: '就业', status: 'upcoming', start_time: '2026-02-25 09:00', end_time: '2026-02-25 17:00', location: '体育馆', organizer_name: '就业指导中心', max_participants: 2000, current_participants: 1234, description: '汇聚200+知名企业，提供5000+岗位。涵盖互联网、金融、制造、教育等行业。请携带简历，着正装参加。', cover: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop', coverGradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', organizerColor: '#3b82f6' },
  { id: 7, title: '英语角：跨文化交流', category: '学术', status: 'completed', start_time: '2026-01-08 19:00', end_time: '2026-01-08 21:00', location: '外语楼咖啡厅', organizer_name: '外国语学院', max_participants: 50, current_participants: 50, description: '与留学生面对面交流，了解不同国家的文化习俗。全程英语交流，提升口语能力。', cover: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop', coverGradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', organizerColor: '#a8edea' },
  { id: 8, title: '创新创业大赛宣讲会', category: '学术', status: 'upcoming', start_time: '2026-01-18 15:00', end_time: '2026-01-18 17:00', location: '创新创业学院101', organizer_name: '创新创业学院', max_participants: 150, current_participants: 89, description: '介绍"互联网+"、"挑战杯"等重要赛事的报名流程和往届获奖经验，邀请往届获奖团队分享心得。', cover: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=400&fit=crop', coverGradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', organizerColor: '#fcb69f' },
  { id: 9, title: '篮球联赛总决赛', category: '体育', status: 'upcoming', start_time: '2026-01-19 18:30', end_time: '2026-01-19 21:00', location: '体育馆主馆', organizer_name: '体育部', max_participants: 800, current_participants: 756, description: '计算机学院 VS 机械学院！两支劲旅巅峰对决，为你呈现精彩绝伦的篮球盛宴。现场有抽奖环节！', cover: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=400&fit=crop', coverGradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', organizerColor: '#ff9a9e' }
])

const totalParticipants = computed(() => activities.value.reduce((sum, a) => sum + (a.current_participants || 0), 0))

const filteredActivities = computed(() => {
  let result = activities.value
  if (searchQuery.value) result = result.filter(a => a.title.toLowerCase().includes(searchQuery.value.toLowerCase()))
  if (categoryFilter.value) result = result.filter(a => a.category === categoryFilter.value)
  return result
})

const formatTime = (time) => dayjs(time).format('MM月DD日 HH:mm')
const getStatusType = (s) => ({ upcoming: 'success', ongoing: 'primary', completed: 'info', cancelled: 'danger' }[s] || 'info')
const getStatusText = (s) => ({ upcoming: '报名中', ongoing: '进行中', completed: '已结束', cancelled: '已取消' }[s] || s)

const viewActivity = (activity) => { selectedActivity.value = activity; showDetailDialog.value = true }
const joinActivity = async (activity) => {
  // 检查是否已报名
  if (activity.hasJoined) {
    ElMessage.info('您已报名该活动')
    return
  }
  
  if (activity.current_participants >= activity.max_participants) {
    ElMessage.warning('活动名额已满')
    return
  }
  
  // 标记为已报名
  activity.hasJoined = true
  activity.current_participants++
  ElMessage.success(`成功报名「${activity.title}」！`)
  
  const userName = userStore.user?.name || '未知用户'
  const userId = userStore.user?.id || 'unknown'
  const userRole = userStore.user?.role || 'student'
  
  // 学生端看到的通知
  socketStore.addLocalNotification({
    type: 'activity',
    title: '活动报名成功',
    content: `您已成功报名「${activity.title}」，活动时间：${formatTime(activity.start_time)}，地点：${activity.location}`,
    time: new Date().toISOString(),
    targetRole: userRole,
    sourceUserName: userName
  })
  
  // 管理员端看到的通知
  const roleLabel = userRole === 'teacher' ? '教师' : '学生'
  socketStore.addLocalNotification({
    type: 'activity',
    title: '新活动报名',
    content: `${roleLabel}${userName}报名了活动「${activity.title}」`,
    time: new Date().toISOString(),
    targetRole: 'admin',
    forAdmin: true,
    sourceUserName: userName,
    sourceUserRole: userRole
  })
}

const submitActivity = () => {
  if (!activityForm.value.title || !activityForm.value.category) {
    ElMessage.warning('请填写必填项')
    return
  }
  activities.value.unshift({
    id: Date.now(),
    ...activityForm.value,
    status: 'upcoming',
    start_time: activityForm.value.startTime,
    end_time: activityForm.value.endTime,
    max_participants: activityForm.value.maxParticipants,
    current_participants: 0,
    organizer_name: '我',
    coverGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    organizerColor: '#667eea'
  })
  showAddDialog.value = false
  activityForm.value = { title: '', category: '', location: '', startTime: null, endTime: null, maxParticipants: 100, description: '' }
  ElMessage.success('活动发布成功！')
}

onMounted(() => {})
</script>

<style scoped>
.activities-page { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; color: white; }
.header-left h1 { margin: 0 0 8px 0; font-size: 28px; }
.header-left p { margin: 0; opacity: 0.9; }
.header-right { display: flex; gap: 12px; }
.header-right :deep(.el-input__wrapper), .header-right :deep(.el-select .el-input__wrapper) { background: rgba(255,255,255,0.9); }

.activity-stats { display: flex; gap: 20px; margin-bottom: 24px; padding: 20px; background: white; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.stat-item { flex: 1; text-align: center; padding: 12px; }
.stat-value { display: block; font-size: 28px; font-weight: 700; color: #1e293b; }
.stat-label { font-size: 13px; color: #64748b; }

.activities-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
.activity-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); transition: all 0.3s; cursor: pointer; }
.activity-card:hover { transform: translateY(-6px); box-shadow: 0 12px 40px rgba(0,0,0,0.12); }

.card-cover { height: 160px; position: relative; overflow: hidden; }
.cover-image { width: 100%; height: 100%; object-fit: cover; }
.cover-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%); }
.status-tag { position: absolute; top: 12px; right: 12px; }
.category-badge { position: absolute; bottom: 12px; left: 12px; background: rgba(255,255,255,0.95); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #475569; }

.card-content { padding: 20px; }
.activity-title { margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1e293b; line-height: 1.4; }
.activity-desc { margin: 0 0 16px 0; font-size: 13px; color: #64748b; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.activity-meta { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
.meta-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; }
.meta-icon { font-size: 14px; }

.card-footer { display: flex; justify-content: space-between; align-items: center; }
.organizer { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569; }

.activity-detail .detail-cover { height: 200px; border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
.detail-cover-img { width: 100%; height: 100%; object-fit: cover; }
.detail-info { display: grid; gap: 16px; }
.info-row { display: flex; align-items: flex-start; gap: 12px; }
.info-row.full { flex-direction: column; }
.info-label { min-width: 80px; color: #64748b; font-size: 14px; }
.detail-desc { margin: 8px 0 0 0; line-height: 1.8; color: #475569; }
</style>
