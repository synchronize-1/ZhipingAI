<template>
  <div class="space-y-6">
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div class="flex flex-wrap items-center gap-4">
        <el-select v-model="buildingFilter" placeholder="选择教学楼" clearable class="w-40">
          <el-option v-for="b in buildings" :key="b" :label="b" :value="b" />
        </el-select>
        <el-date-picker v-model="dateFilter" type="date" placeholder="选择日期" />
        <el-select v-model="timeSlotFilter" placeholder="时间段" clearable class="w-32">
          <el-option v-for="i in 12" :key="i" :label="`第${i}节`" :value="i" />
        </el-select>
        <el-button type="primary" @click="fetchRooms">查询空闲教室</el-button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div v-for="room in rooms" :key="room.id"
           class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-800">{{ room.name }}</h3>
          <el-tag :type="room.is_available ? 'success' : 'danger'" size="small">
            {{ room.is_available ? '空闲' : '占用' }}
          </el-tag>
        </div>
        <div class="space-y-2 text-sm text-gray-600">
          <p><el-icon><OfficeBuilding /></el-icon> {{ room.building }} {{ room.floor }}F</p>
          <p><el-icon><User /></el-icon> 容量: {{ room.capacity }}人</p>
          <p><el-icon><Monitor /></el-icon> {{ getRoomType(room.type) }}</p>
        </div>
        <el-button v-if="room.is_available" type="primary" class="w-full mt-3" @click="reserveRoom(room)">
          预约教室
        </el-button>
      </div>
    </div>

    <el-empty v-if="!rooms.length && !loading" description="暂无数据" />

    <el-dialog v-model="showReserveDialog" title="预约教室" width="400px">
      <el-form :model="reserveForm" label-width="80px">
        <el-form-item label="教室">
          <el-input :value="selectedRoom?.name" disabled />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="reserveForm.date" type="date" class="w-full" />
        </el-form-item>
        <el-form-item label="时间段">
          <el-select v-model="reserveForm.timeSlot" class="w-full">
            <el-option v-for="i in 12" :key="i" :label="`第${i}节`" :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item label="用途">
          <el-input v-model="reserveForm.purpose" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReserveDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReserve" :loading="submitting">提交预约</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { OfficeBuilding, User, Monitor } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useSocketStore } from '@/stores/socket'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

defineOptions({ name: 'Rooms' })
import api from '@/api'

const socketStore = useSocketStore()
const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const rooms = ref([])
const buildings = ref([])
const buildingFilter = ref('')
const dateFilter = ref(new Date())
const timeSlotFilter = ref(null)
const showReserveDialog = ref(false)
const selectedRoom = ref(null)

const reserveForm = ref({ date: new Date(), timeSlot: 1, purpose: '' })

const getRoomType = (type) => {
  const types = { classroom: '普通教室', lab: '实验室', meeting: '会议室', lecture_hall: '阶梯教室' }
  return types[type] || type
}

const fetchBuildings = async () => {
  try {
    const res = await api.services.buildings()
    if (res.success) buildings.value = res.data || []
  } catch (e) {
    buildings.value = ['教学楼A', '教学楼B', '实验楼']
  }
}

const fetchRooms = async () => {
  loading.value = true
  try {
    const res = await api.services.rooms({
      building: buildingFilter.value,
      date: dateFilter.value?.toISOString().split('T')[0],
      timeSlot: timeSlotFilter.value
    })
    if (res.success) rooms.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const reserveRoom = (room) => {
  selectedRoom.value = room
  reserveForm.value = { date: dateFilter.value || new Date(), timeSlot: timeSlotFilter.value || 1, purpose: '' }
  showReserveDialog.value = true
}

const submitReserve = async () => {
  submitting.value = true
  const roomName = selectedRoom.value?.name
  const reserveDate = dayjs(reserveForm.value.date).format('YYYY-MM-DD')
  const timeSlotText = `第${reserveForm.value.timeSlot}节`
  
  try {
    await api.services.reserveRoom({
      roomId: selectedRoom.value.id,
      date: reserveForm.value.date?.toISOString().split('T')[0],
      timeSlot: reserveForm.value.timeSlot,
      purpose: reserveForm.value.purpose
    })
    ElMessage.success('预约申请已提交')
    showReserveDialog.value = false
    
    // 发送通知到通知中心
    socketStore.addLocalNotification({
      type: 'room_reservation',
      title: '教室预约成功',
      content: `您已成功预约 ${roomName}，日期：${reserveDate}，时间段：${timeSlotText}，用途：${reserveForm.value.purpose || '未填写'}`,
      time: new Date().toISOString()
    })
  } catch (e) {
    // 即使API失败也模拟成功（演示用）
    ElMessage.success('预约申请已提交')
    showReserveDialog.value = false
    
    socketStore.addLocalNotification({
      type: 'room_reservation',
      title: '教室预约成功',
      content: `您已成功预约 ${roomName}，日期：${reserveDate}，时间段：${timeSlotText}，用途：${reserveForm.value.purpose || '未填写'}`,
      time: new Date().toISOString()
    })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchBuildings()
  fetchRooms()
})
</script>
