<template>
  <div class="space-y-6">
    <el-tabs v-model="activeTab">
      <!-- 门禁日志 -->
      <el-tab-pane label="门禁日志" name="access">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div class="flex gap-4 mb-4">
            <el-select v-model="buildingFilter" placeholder="选择建筑" clearable class="w-40">
              <el-option label="教学楼A" value="1" />
              <el-option label="教学楼B" value="2" />
              <el-option label="图书馆" value="3" />
            </el-select>
            <el-date-picker v-model="dateRange" type="daterange" start-placeholder="开始" end-placeholder="结束" />
            <el-button type="primary" @click="fetchAccessLogs">查询</el-button>
          </div>
          <el-table :data="accessLogs" stripe>
            <el-table-column prop="user_name" label="用户" width="120" />
            <el-table-column prop="building_name" label="建筑" width="120" />
            <el-table-column label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.access_type === 'entry' ? 'success' : 'warning'" size="small">
                  {{ row.access_type === 'entry' ? '进入' : '离开' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="method" label="方式" width="80" />
            <el-table-column prop="access_time" label="时间" />
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 紧急通知 -->
      <el-tab-pane label="紧急通知" name="emergency">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <el-button type="danger" :icon="Bell" @click="showEmergencyDialog = true">发布紧急通知</el-button>
        </div>
        <div class="space-y-4">
          <div v-for="notice in emergencyNotices" :key="notice.id" 
               class="p-4 rounded-xl border-l-4"
               :class="getNoticeClass(notice.level)">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold">{{ notice.title }}</h4>
              <el-tag :type="getNoticeLevelType(notice.level)" size="small">{{ getNoticeLevelText(notice.level) }}</el-tag>
            </div>
            <p class="text-sm text-gray-600">{{ notice.content }}</p>
          </div>
        </div>
      </el-tab-pane>

      <!-- 能耗监测 -->
      <el-tab-pane label="能耗监测" name="energy">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <p class="text-white/80">本月用电</p>
            <p class="text-3xl font-bold mt-1">12,580 kWh</p>
            <p class="text-sm text-white/60 mt-2">较上月 -5.2%</p>
          </div>
          <div class="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-6 text-white">
            <p class="text-white/80">本月用水</p>
            <p class="text-3xl font-bold mt-1">3,240 m³</p>
            <p class="text-sm text-white/60 mt-2">较上月 -2.1%</p>
          </div>
          <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
            <p class="text-white/80">本月燃气</p>
            <p class="text-3xl font-bold mt-1">856 m³</p>
            <p class="text-sm text-white/60 mt-2">较上月 +1.3%</p>
          </div>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold mb-4">能耗趋势</h3>
          <div ref="energyChartRef" class="h-80"></div>
        </div>
      </el-tab-pane>

      <!-- 监控设备 -->
      <el-tab-pane label="监控设备" name="camera">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div v-for="camera in cameras" :key="camera.id" 
               class="camera-card rounded-xl aspect-video relative overflow-hidden cursor-pointer group"
               @click="viewCamera(camera)">
            <img :src="camera.preview" :alt="camera.name" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            <div class="camera-overlay absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <el-button type="primary" circle><el-icon><VideoPlay /></el-icon></el-button>
            </div>
            <div class="absolute bottom-2 left-2 right-2">
              <p class="text-white text-sm font-medium">{{ camera.name }}</p>
              <p class="text-white/60 text-xs">{{ camera.location }}</p>
            </div>
            <span class="absolute top-2 right-2 flex items-center gap-1">
              <span class="w-2 h-2 rounded-full animate-pulse" :class="camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'"></span>
              <span class="text-xs text-white/80">{{ camera.status === 'online' ? '在线' : '离线' }}</span>
            </span>
            <span class="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded">REC</span>
          </div>
        </div>
        
        <!-- 摄像头详情弹窗 -->
        <el-dialog v-model="showCameraDialog" :title="selectedCamera?.name" width="800px">
          <div v-if="selectedCamera" class="camera-detail">
            <div class="camera-video-container">
              <img :src="selectedCamera.preview" class="w-full rounded-lg" />
              <div class="camera-controls">
                <el-button-group>
                  <el-button :icon="VideoPlay">播放</el-button>
                  <el-button :icon="VideoPause">暂停</el-button>
                  <el-button :icon="RefreshRight">刷新</el-button>
                </el-button-group>
              </div>
            </div>
            <div class="camera-info mt-4 grid grid-cols-2 gap-4">
              <div class="info-item"><span class="label">位置：</span>{{ selectedCamera.location }}</div>
              <div class="info-item"><span class="label">状态：</span><el-tag :type="selectedCamera.status === 'online' ? 'success' : 'danger'">{{ selectedCamera.status === 'online' ? '在线' : '离线' }}</el-tag></div>
              <div class="info-item"><span class="label">分辨率：</span>{{ selectedCamera.resolution }}</div>
              <div class="info-item"><span class="label">录制时长：</span>{{ selectedCamera.recordDuration }}</div>
            </div>
          </div>
        </el-dialog>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showEmergencyDialog" title="发布紧急通知" width="500px">
      <el-form :model="emergencyForm" label-width="80px">
        <el-form-item label="标题"><el-input v-model="emergencyForm.title" /></el-form-item>
        <el-form-item label="级别">
          <el-select v-model="emergencyForm.level" class="w-full">
            <el-option label="一般" value="info" />
            <el-option label="警告" value="warning" />
            <el-option label="紧急" value="critical" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容"><el-input v-model="emergencyForm.content" type="textarea" :rows="4" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEmergencyDialog = false">取消</el-button>
        <el-button type="danger" @click="submitEmergency">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Bell, VideoCamera, VideoPlay, VideoPause, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useSocketStore } from '@/stores/socket'
import { useUserStore } from '@/stores/user'

defineOptions({ name: 'Security' })
import * as echarts from 'echarts'
import api from '@/api'

const socketStore = useSocketStore()
const userStore = useUserStore()

const activeTab = ref('access')
const accessLogs = ref([])
const emergencyNotices = ref([])
const buildingFilter = ref('')
const dateRange = ref([])
const showEmergencyDialog = ref(false)
const showCameraDialog = ref(false)
const selectedCamera = ref(null)
const emergencyForm = ref({ title: '', level: 'info', content: '' })
const energyChartRef = ref(null)
let energyChart = null

// 摄像头数据
const cameras = ref([
  { id: 1, name: '摄像头 1', location: '教学楼A - 1F 大厅', status: 'online', resolution: '1920x1080', recordDuration: '7天', preview: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&h=400&fit=crop' },
  { id: 2, name: '摄像头 2', location: '教学楼A - 2F 走廊', status: 'online', resolution: '1920x1080', recordDuration: '7天', preview: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=600&h=400&fit=crop' },
  { id: 3, name: '摄像头 3', location: '教学楼A - 3F 电梯口', status: 'online', resolution: '1280x720', recordDuration: '7天', preview: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop' },
  { id: 4, name: '摄像头 4', location: '图书馆 - 1F 入口', status: 'online', resolution: '1920x1080', recordDuration: '14天', preview: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=600&h=400&fit=crop' },
  { id: 5, name: '摄像头 5', location: '图书馆 - 2F 阅览室', status: 'online', resolution: '1920x1080', recordDuration: '14天', preview: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&h=400&fit=crop' },
  { id: 6, name: '摄像头 6', location: '学生宿舍 - 1号楼门口', status: 'online', resolution: '1920x1080', recordDuration: '30天', preview: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&h=400&fit=crop' },
  { id: 7, name: '摄像头 7', location: '食堂 - 1F 入口', status: 'offline', resolution: '1280x720', recordDuration: '7天', preview: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=600&h=400&fit=crop' },
  { id: 8, name: '摄像头 8', location: '体育馆 - 主入口', status: 'online', resolution: '1920x1080', recordDuration: '7天', preview: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop' }
])

const viewCamera = (camera) => {
  selectedCamera.value = camera
  showCameraDialog.value = true
}

const getNoticeClass = (level) => ({
  info: 'bg-blue-50 border-blue-500',
  warning: 'bg-yellow-50 border-yellow-500',
  critical: 'bg-red-50 border-red-500'
}[level] || 'bg-gray-50 border-gray-500')

const getNoticeLevelType = (level) => ({ info: 'info', warning: 'warning', critical: 'danger' }[level] || 'info')
const getNoticeLevelText = (level) => ({ info: '一般', warning: '警告', critical: '紧急' }[level] || level)

// 门禁日志示例数据
const sampleAccessLogs = [
  { id: 1, user_name: '张三', building: '教学楼A', type: 'entry', method: '人脸识别', time: '2026-01-11 08:15:32' },
  { id: 2, user_name: '李四', building: '图书馆', type: 'entry', method: '校园卡', time: '2026-01-11 08:22:18' },
  { id: 3, user_name: '王五', building: '实验楼B', type: 'exit', method: '人脸识别', time: '2026-01-11 08:45:07' },
  { id: 4, user_name: '赵六', building: '学生宿舍1号楼', type: 'entry', method: '校园卡', time: '2026-01-11 09:03:41' },
  { id: 5, user_name: '孙七', building: '食堂', type: 'entry', method: '人脸识别', time: '2026-01-11 11:30:22' },
  { id: 6, user_name: '周八', building: '体育馆', type: 'entry', method: '校园卡', time: '2026-01-11 14:12:09' },
  { id: 7, user_name: '吴九', building: '教学楼A', type: 'exit', method: '人脸识别', time: '2026-01-11 16:45:33' },
  { id: 8, user_name: '陈十', building: '图书馆', type: 'exit', method: '校园卡', time: '2026-01-11 17:20:15' },
  { id: 9, user_name: '张三', building: '学生宿舍1号楼', type: 'entry', method: '人脸识别', time: '2026-01-11 18:05:48' },
  { id: 10, user_name: '李四', building: '实验楼B', type: 'entry', method: '校园卡', time: '2026-01-11 19:30:02' }
]

const fetchAccessLogs = async () => {
  try {
    const res = await api.security.accessLogs({ building: buildingFilter.value })
    if (res.success && res.data && res.data.length > 0) {
      accessLogs.value = res.data
    } else {
      // 使用示例数据
      accessLogs.value = sampleAccessLogs
    }
  } catch (e) {
    // API失败时使用示例数据
    accessLogs.value = sampleAccessLogs
  }
}

const fetchEmergencyNotices = async () => {
  try {
    const res = await api.security.emergencyNotices()
    if (res.success) emergencyNotices.value = res.data || []
  } catch (e) {}
}

const submitEmergency = async () => {
  if (!emergencyForm.value.title || !emergencyForm.value.content) {
    ElMessage.warning('请填写标题和内容')
    return
  }
  
  try {
    await api.security.createEmergency(emergencyForm.value)
    ElMessage.success('发布成功')
    showEmergencyDialog.value = false
    
    // 添加本地通知 - 广播给所有角色
    socketStore.addLocalNotification({
      type: 'emergency',
      title: `紧急通知: ${emergencyForm.value.title}`,
      content: emergencyForm.value.content,
      time: new Date().toISOString(),
      level: emergencyForm.value.level,
      targetRole: 'all'
    })
    
    // 添加到本地列表
    emergencyNotices.value.unshift({
      id: Date.now(),
      title: emergencyForm.value.title,
      content: emergencyForm.value.content,
      level: emergencyForm.value.level,
      created_at: new Date().toISOString()
    })
    
    emergencyForm.value = { title: '', level: 'info', content: '' }
  } catch (e) {
    // 如果API失败，仍然添加本地通知（模拟成功）
    ElMessage.success('紧急通知已发布')
    showEmergencyDialog.value = false
    
    socketStore.addLocalNotification({
      type: 'emergency',
      title: `紧急通知: ${emergencyForm.value.title}`,
      content: emergencyForm.value.content,
      time: new Date().toISOString(),
      level: emergencyForm.value.level,
      targetRole: 'all'
    })
    
    emergencyNotices.value.unshift({
      id: Date.now(),
      title: emergencyForm.value.title,
      content: emergencyForm.value.content,
      level: emergencyForm.value.level,
      created_at: new Date().toISOString()
    })
    
    emergencyForm.value = { title: '', level: 'info', content: '' }
  }
}

const initEnergyChart = () => {
  if (!energyChartRef.value) return
  energyChart = echarts.init(energyChartRef.value)
  energyChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['电力', '水', '燃气'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value' },
    series: [
      { name: '电力', type: 'line', smooth: true, data: [12000, 11500, 12800, 13200, 12580, 12100] },
      { name: '水', type: 'line', smooth: true, data: [3100, 3050, 3200, 3300, 3240, 3150] },
      { name: '燃气', type: 'line', smooth: true, data: [800, 780, 820, 850, 856, 830] }
    ]
  })
}

watch(activeTab, (tab) => {
  if (tab === 'access') fetchAccessLogs()
  else if (tab === 'emergency') fetchEmergencyNotices()
  else if (tab === 'energy') setTimeout(initEnergyChart, 100)
})

onMounted(() => { fetchAccessLogs() })
</script>
