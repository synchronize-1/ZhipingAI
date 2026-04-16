<template>
  <view class="map-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input v-model="searchQuery" placeholder="搜索教室、建筑..." class="search-input" />
      <view class="search-btn" @tap="search">搜索</view>
    </view>

    <!-- 快捷功能区 -->
    <view class="quick-nav">
      <view class="nav-item" :class="{ active: activeTab === 'map' }" @tap="activeTab = 'map'">
        <text class="nav-icon">🗺️</text>
        <text>校园地图</text>
      </view>
      <view class="nav-item" :class="{ active: activeTab === 'rooms' }" @tap="activeTab = 'rooms'; loadAllRooms()">
        <text class="nav-icon">🏫</text>
        <text>空闲教室</text>
      </view>
      <view class="nav-item" :class="{ active: activeTab === 'navigate' }" @tap="activeTab = 'navigate'">
        <text class="nav-icon">📍</text>
        <text>路线导航</text>
      </view>
    </view>

    <!-- 校园地图区域 -->
    <view v-if="activeTab === 'map'" class="map-section">
      <view class="campus-map">
        <!-- 校园道路网格 -->
        <view class="road road-h1"></view>
        <view class="road road-h2"></view>
        <view class="road road-v1"></view>
        <view class="road road-v2"></view>
        <view class="road road-main"></view>
        
        <!-- 校园区域标识 -->
        <view class="zone zone-teaching">教学区</view>
        <view class="zone zone-life">生活区</view>
        <view class="zone zone-sports">运动区</view>
        
        <!-- 建筑标记 -->
        <view v-for="building in buildings" :key="building.id" 
              class="building-marker" :class="{ selected: selectedBuilding?.id === building.id }"
              :style="building.style" @tap="selectBuilding(building)">
          <view class="building-icon">{{ building.icon }}</view>
          <view class="building-name">{{ building.name }}</view>
          <view v-if="building.floors" class="building-floors">{{ building.floors }}层</view>
        </view>

        <!-- 导航路线 -->
        <svg v-if="showNavRoute" class="nav-route-svg">
          <polyline :points="navRoutePoints" fill="none" stroke="#d4a574" stroke-width="4" stroke-dasharray="10,5">
            <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite"/>
          </polyline>
          <circle v-for="(point, idx) in navWaypoints" :key="idx" :cx="point.x" :cy="point.y" r="8" fill="#c9956c"/>
        </svg>

        <!-- 当前位置标记 -->
        <view class="current-location" :style="currentLocationStyle">
          <view class="location-pulse"></view>
          <view class="location-dot"></view>
          <text class="location-label">我的位置</text>
        </view>
      </view>

      <!-- 地图图例 -->
      <view class="map-legend">
        <view class="legend-item"><view class="legend-dot teaching"></view><text>教学楼</text></view>
        <view class="legend-item"><view class="legend-dot library"></view><text>图书馆</text></view>
        <view class="legend-item"><view class="legend-dot canteen"></view><text>食堂</text></view>
        <view class="legend-item"><view class="legend-dot sports"></view><text>体育设施</text></view>
        <view class="legend-item"><view class="legend-dot dorm"></view><text>宿舍楼</text></view>
      </view>

      <!-- 选中建筑详情 -->
      <view v-if="selectedBuilding" class="building-detail card">
        <view class="detail-header">
          <view class="detail-icon">{{ selectedBuilding.icon }}</view>
          <view class="detail-info">
            <text class="detail-name">{{ selectedBuilding.name }}</text>
            <text class="detail-desc">{{ selectedBuilding.description }}</text>
          </view>
          <view class="nav-to-btn" @tap="startNavigation(selectedBuilding)">
            <text>导航</text>
          </view>
        </view>
        <view class="detail-stats">
          <view class="stat"><text class="stat-value">{{ selectedBuilding.floors || 5 }}</text><text class="stat-label">楼层</text></view>
          <view class="stat"><text class="stat-value">{{ selectedBuilding.rooms || 30 }}</text><text class="stat-label">教室</text></view>
          <view class="stat"><text class="stat-value">{{ selectedBuilding.available || 8 }}</text><text class="stat-label">空闲</text></view>
          <view class="stat"><text class="stat-value">{{ selectedBuilding.distance || '200' }}m</text><text class="stat-label">距离</text></view>
        </view>
        
        <!-- 楼层概览 -->
        <view class="floor-overview">
          <text class="floor-title">楼层概览</text>
          <view class="floor-list">
            <view v-for="floor in selectedBuilding.floorData" :key="floor.floor" class="floor-item" @tap="selectFloor(floor)">
              <text class="floor-num">{{ floor.floor }}F</text>
              <view class="floor-bar">
                <view class="floor-fill" :style="{ width: floor.available / floor.total * 100 + '%' }"></view>
              </view>
              <text class="floor-info">{{ floor.available }}/{{ floor.total }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 空闲教室查询 -->
    <view v-if="activeTab === 'rooms'" class="rooms-section">
      <view class="filter-bar">
        <picker :value="buildingIndex" :range="buildingNames" @change="filterByBuilding">
          <view class="filter-item">
            <text>{{ buildingNames[buildingIndex] }}</text>
            <text class="arrow">▼</text>
          </view>
        </picker>
        <picker :value="timeIndex" :range="timeSlots" @change="filterByTime">
          <view class="filter-item">
            <text>{{ timeSlots[timeIndex] }}</text>
            <text class="arrow">▼</text>
          </view>
        </picker>
      </view>
      
      <view class="rooms-stats">
        <text class="stats-text">共找到 <text class="highlight">{{ availableRooms.filter(r => r.is_available).length }}</text> 间空闲教室</text>
      </view>
      
      <scroll-view scroll-y class="rooms-list">
        <view v-for="room in availableRooms" :key="room.id" class="room-card" :class="{ available: room.is_available }">
          <view class="room-main">
            <view class="room-icon">{{ room.is_available ? '✅' : '🔒' }}</view>
            <view class="room-info">
              <text class="room-name">{{ room.name }}</text>
              <text class="room-building">{{ room.building }}</text>
            </view>
          </view>
          <view class="room-meta">
            <text class="room-capacity">容纳 {{ room.capacity || 50 }} 人</text>
            <text class="room-status" :class="{ free: room.is_available }">{{ room.is_available ? '当前空闲' : room.occupiedBy || '使用中' }}</text>
          </view>
          <view v-if="room.is_available" class="room-actions">
            <view class="action-btn" @tap="startNavigation({ name: room.name, ...room })">导航前往</view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 路线导航 -->
    <view v-if="activeTab === 'navigate'" class="navigate-section">
      <view class="nav-form card">
        <view class="form-group">
          <text class="form-label">起点</text>
          <picker :value="startIndex" :range="locationNames" @change="startIndex = $event.detail.value">
            <view class="form-input">
              <text>{{ locationNames[startIndex] || '选择起点' }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>
        <view class="swap-btn" @tap="swapLocations">⇅</view>
        <view class="form-group">
          <text class="form-label">终点</text>
          <picker :value="endIndex" :range="locationNames" @change="endIndex = $event.detail.value">
            <view class="form-input">
              <text>{{ locationNames[endIndex] || '选择终点' }}</text>
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>
        <view class="start-nav-btn" @tap="calculateRoute">开始导航</view>
      </view>

      <!-- 导航结果 -->
      <view v-if="navResult" class="nav-result card">
        <view class="result-header">
          <text class="result-title">导航路线</text>
          <view class="result-meta">
            <text class="distance">{{ navResult.distance }}</text>
            <text class="time">约 {{ navResult.time }}</text>
          </view>
        </view>
        
        <view class="route-steps">
          <view v-for="(step, idx) in navResult.steps" :key="idx" class="step-item">
            <view class="step-icon" :class="step.type">{{ step.icon }}</view>
            <view class="step-content">
              <text class="step-text">{{ step.instruction }}</text>
              <text class="step-distance">{{ step.distance }}</text>
            </view>
          </view>
        </view>
        
        <view class="nav-actions">
          <view class="action-btn secondary" @tap="navResult = null">取消导航</view>
          <view class="action-btn primary" @tap="startRealNav">开始实时导航</view>
        </view>
      </view>
      
      <!-- 热门目的地 -->
      <view class="hot-destinations card">
        <text class="card-title">热门目的地</text>
        <view class="dest-grid">
          <view v-for="dest in hotDestinations" :key="dest.name" class="dest-item" @tap="quickNavigate(dest)">
            <text class="dest-icon">{{ dest.icon }}</text>
            <text class="dest-name">{{ dest.name }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 实时导航弹窗 -->
    <view v-if="showRealTimeNav" class="realtime-nav-modal">
      <view class="realtime-content">
        <view class="realtime-header">
          <text class="realtime-title">正在导航至 {{ navTarget?.name }}</text>
          <view class="close-btn" @tap="showRealTimeNav = false">✕</view>
        </view>
        <view class="realtime-map">
          <view class="mini-map">
            <view class="current-pos"></view>
            <view class="target-pos" :style="targetPosStyle"></view>
            <svg class="route-line">
              <path :d="realtimeRoutePath" stroke="#d4a574" stroke-width="3" fill="none" stroke-dasharray="8,4">
                <animate attributeName="stroke-dashoffset" from="50" to="0" dur="1s" repeatCount="indefinite"/>
              </path>
            </svg>
          </view>
        </view>
        <view class="realtime-info">
          <view class="next-step">
            <text class="step-direction">{{ currentStep?.direction || '直行' }}</text>
            <text class="step-desc">{{ currentStep?.instruction || '沿主干道前行' }}</text>
          </view>
          <view class="remaining">
            <text class="remaining-dist">剩余 {{ remainingDistance || '150m' }}</text>
            <text class="remaining-time">约 {{ remainingTime || '2分钟' }}</text>
          </view>
        </view>
        <view class="realtime-actions">
          <view class="action-btn" @tap="showRealTimeNav = false">结束导航</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  data() {
    return {
      searchQuery: '',
      activeTab: 'map',
      selectedBuilding: null,
      availableRooms: [],
      showNavRoute: false,
      navRoutePoints: '',
      navWaypoints: [],
      currentLocationStyle: 'top: 85%; left: 50%;',
      buildingIndex: 0,
      timeIndex: 0,
      buildingNames: ['全部建筑', '教学楼A', '教学楼B', '教学楼C', '图书馆', '实验楼', '行政楼'],
      timeSlots: ['当前时段', '08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00', '19:00-21:00'],
      startIndex: 0,
      endIndex: 0,
      locationNames: ['我的位置', '教学楼A', '教学楼B', '教学楼C', '图书馆', '实验楼', '第一食堂', '第二食堂', '体育馆', '操场', '宿舍1号楼', '宿舍2号楼', '行政楼', '校门'],
      navResult: null,
      showRealTimeNav: false,
      navTarget: null,
      currentStep: null,
      remainingDistance: '150m',
      remainingTime: '2分钟',
      targetPosStyle: 'top: 20%; left: 30%;',
      realtimeRoutePath: 'M 150 280 Q 150 200 100 150 Q 80 100 100 80',
      buildings: [
        { id: 1, name: '教学楼A', icon: '🏛️', style: 'top: 18%; left: 22%;', description: '综合教学楼，设有多媒体教室', floors: 6, rooms: 48, available: 12, distance: '180', floorData: [
          { floor: 1, total: 8, available: 2 }, { floor: 2, total: 8, available: 3 }, { floor: 3, total: 8, available: 2 },
          { floor: 4, total: 8, available: 2 }, { floor: 5, total: 8, available: 1 }, { floor: 6, total: 8, available: 2 }
        ]},
        { id: 2, name: '教学楼B', icon: '🏛️', style: 'top: 18%; left: 52%;', description: '理工科教学楼', floors: 5, rooms: 40, available: 8, distance: '220', floorData: [
          { floor: 1, total: 8, available: 1 }, { floor: 2, total: 8, available: 2 }, { floor: 3, total: 8, available: 2 },
          { floor: 4, total: 8, available: 1 }, { floor: 5, total: 8, available: 2 }
        ]},
        { id: 3, name: '教学楼C', icon: '🏛️', style: 'top: 18%; left: 78%;', description: '文科教学楼', floors: 4, rooms: 32, available: 6, distance: '280', floorData: [
          { floor: 1, total: 8, available: 2 }, { floor: 2, total: 8, available: 1 }, { floor: 3, total: 8, available: 2 }, { floor: 4, total: 8, available: 1 }
        ]},
        { id: 4, name: '图书馆', icon: '📚', style: 'top: 38%; left: 50%;', description: '藏书100万册，24小时自习室', floors: 5, rooms: 20, available: 5, distance: '150', floorData: [
          { floor: 1, total: 4, available: 1 }, { floor: 2, total: 4, available: 1 }, { floor: 3, total: 4, available: 1 },
          { floor: 4, total: 4, available: 1 }, { floor: 5, total: 4, available: 1 }
        ]},
        { id: 5, name: '实验楼', icon: '🔬', style: 'top: 35%; left: 22%;', description: '物理、化学、生物实验室', floors: 4, rooms: 24, available: 4, distance: '200', floorData: [
          { floor: 1, total: 6, available: 1 }, { floor: 2, total: 6, available: 1 }, { floor: 3, total: 6, available: 1 }, { floor: 4, total: 6, available: 1 }
        ]},
        { id: 6, name: '第一食堂', icon: '🍽️', style: 'top: 55%; left: 25%;', description: '三层餐厅，可容纳2000人', floors: 3, rooms: 0, available: 0, distance: '120' },
        { id: 7, name: '第二食堂', icon: '🍽️', style: 'top: 55%; left: 75%;', description: '特色餐厅，风味小吃', floors: 2, rooms: 0, available: 0, distance: '180' },
        { id: 8, name: '体育馆', icon: '🏀', style: 'top: 72%; left: 22%;', description: '室内球场、健身房', floors: 2, rooms: 0, available: 0, distance: '250' },
        { id: 9, name: '操场', icon: '🏃', style: 'top: 72%; left: 50%;', description: '400米标准跑道', floors: 0, rooms: 0, available: 0, distance: '200' },
        { id: 10, name: '宿舍1号楼', icon: '🏠', style: 'top: 88%; left: 30%;', description: '学生公寓', floors: 6, rooms: 0, available: 0, distance: '50' },
        { id: 11, name: '宿舍2号楼', icon: '🏠', style: 'top: 88%; left: 70%;', description: '学生公寓', floors: 6, rooms: 0, available: 0, distance: '80' },
        { id: 12, name: '行政楼', icon: '🏢', style: 'top: 35%; left: 78%;', description: '学校行政办公', floors: 5, rooms: 0, available: 0, distance: '300' },
        { id: 13, name: '校门', icon: '🚪', style: 'top: 5%; left: 50%;', description: '学校正门', floors: 0, rooms: 0, available: 0, distance: '350' }
      ],
      hotDestinations: [
        { name: '图书馆', icon: '📚' },
        { name: '第一食堂', icon: '🍽️' },
        { name: '教学楼A', icon: '🏛️' },
        { name: '体育馆', icon: '🏀' },
        { name: '校门', icon: '🚪' },
        { name: '操场', icon: '🏃' }
      ]
    }
  },
  methods: {
    search() {
      if (this.searchQuery) {
        const found = this.buildings.find(b => b.name.includes(this.searchQuery))
        if (found) {
          this.activeTab = 'map'
          this.selectBuilding(found)
        } else {
          uni.showToast({ title: '未找到相关建筑', icon: 'none' })
        }
      }
    },
    selectBuilding(building) {
      this.selectedBuilding = building
      this.loadBuildingRooms(building)
    },
    selectFloor(floor) {
      uni.showToast({ title: `已选择${floor.floor}楼，空闲${floor.available}间`, icon: 'none' })
    },
    async loadBuildingRooms(building) {
      try {
        const res = await api.services.rooms({ building: building.name })
        if (res.success) this.availableRooms = res.data || []
      } catch (e) {
        this.availableRooms = this.generateMockRooms(building)
      }
    },
    generateMockRooms(building) {
      const rooms = []
      const prefix = building.name.replace('教学楼', '')
      for (let f = 1; f <= (building.floors || 4); f++) {
        for (let r = 1; r <= 8; r++) {
          rooms.push({
            id: `${building.id}-${f}${String(r).padStart(2, '0')}`,
            name: `${prefix}${f}${String(r).padStart(2, '0')}`,
            building: building.name,
            floor: f,
            is_available: Math.random() > 0.6,
            capacity: [40, 50, 60, 80, 100][Math.floor(Math.random() * 5)],
            occupiedBy: ['高等数学', '大学物理', '程序设计', '英语课'][Math.floor(Math.random() * 4)]
          })
        }
      }
      return rooms
    },
    loadAllRooms() {
      const allRooms = []
      this.buildings.filter(b => b.rooms > 0).forEach(building => {
        allRooms.push(...this.generateMockRooms(building))
      })
      this.availableRooms = allRooms
    },
    filterByBuilding(e) {
      this.buildingIndex = e.detail.value
      if (this.buildingIndex === 0) {
        this.loadAllRooms()
      } else {
        const buildingName = this.buildingNames[this.buildingIndex]
        const building = this.buildings.find(b => b.name === buildingName)
        if (building) {
          this.availableRooms = this.generateMockRooms(building)
        }
      }
    },
    filterByTime(e) {
      this.timeIndex = e.detail.value
      this.availableRooms = this.availableRooms.map(room => ({
        ...room,
        is_available: Math.random() > 0.5
      }))
    },
    swapLocations() {
      const temp = this.startIndex
      this.startIndex = this.endIndex
      this.endIndex = temp
    },
    calculateRoute() {
      if (this.startIndex === this.endIndex) {
        uni.showToast({ title: '起点和终点不能相同', icon: 'none' })
        return
      }
      const start = this.locationNames[this.startIndex]
      const end = this.locationNames[this.endIndex]
      this.navResult = {
        distance: `${Math.floor(Math.random() * 300 + 100)}米`,
        time: `${Math.floor(Math.random() * 5 + 2)}分钟`,
        steps: [
          { icon: '📍', type: 'start', instruction: `从${start}出发`, distance: '' },
          { icon: '➡️', type: 'walk', instruction: '沿校园主干道向北直行', distance: '80米' },
          { icon: '↗️', type: 'turn', instruction: '在路口右转', distance: '' },
          { icon: '➡️', type: 'walk', instruction: '继续前行经过花园', distance: '60米' },
          { icon: '↖️', type: 'turn', instruction: '左转进入建筑区', distance: '' },
          { icon: '🏁', type: 'end', instruction: `到达${end}`, distance: '' }
        ]
      }
    },
    startNavigation(building) {
      this.navTarget = building
      const idx = this.locationNames.findIndex(n => n === building.name)
      if (idx > 0) {
        this.startIndex = 0
        this.endIndex = idx
        this.calculateRoute()
        this.activeTab = 'navigate'
      } else {
        this.showRealTimeNav = true
      }
    },
    quickNavigate(dest) {
      const idx = this.locationNames.findIndex(n => n === dest.name)
      if (idx > 0) {
        this.startIndex = 0
        this.endIndex = idx
        this.calculateRoute()
      }
    },
    startRealNav() {
      this.showRealTimeNav = true
      this.navTarget = { name: this.locationNames[this.endIndex] }
      this.currentStep = {
        direction: '直行',
        instruction: '沿主干道前行约80米'
      }
    }
  }
}
</script>

<style scoped>
.map-page { background: #faf8f5; min-height: 100vh; padding-bottom: 30rpx; }

.search-bar { display: flex; padding: 20rpx; background: #fff; gap: 15rpx; }
.search-input { flex: 1; height: 70rpx; background: #f5f5f5; border-radius: 35rpx; padding: 0 30rpx; font-size: 28rpx; }
.search-btn { padding: 0 30rpx; height: 70rpx; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; border-radius: 35rpx; display: flex; align-items: center; font-size: 28rpx; }

.quick-nav { display: flex; background: #fff; padding: 15rpx 20rpx; gap: 20rpx; border-bottom: 1rpx solid #f0f0f0; }
.nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 15rpx; border-radius: 16rpx; font-size: 24rpx; color: #666; }
.nav-item.active { background: linear-gradient(135deg, #f5e6d3 0%, #e8d4be 100%); color: #8b6914; }
.nav-icon { font-size: 36rpx; margin-bottom: 8rpx; }

.card { background: #fff; margin: 20rpx; border-radius: 20rpx; padding: 25rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05); }

.map-section { padding: 20rpx; }

.campus-map { 
  position: relative; 
  height: 600rpx; 
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d4be 100%); 
  border-radius: 24rpx; 
  overflow: hidden;
  border: 2rpx solid #e0d0c0;
}

.road { position: absolute; background: #d4c4b0; }
.road-h1 { top: 30%; left: 10%; right: 10%; height: 8rpx; }
.road-h2 { top: 60%; left: 10%; right: 10%; height: 8rpx; }
.road-v1 { left: 35%; top: 10%; bottom: 10%; width: 8rpx; }
.road-v2 { left: 65%; top: 10%; bottom: 10%; width: 8rpx; }
.road-main { left: 48%; top: 0; bottom: 0; width: 12rpx; background: #c9b89d; }

.zone { position: absolute; font-size: 20rpx; color: #a08060; padding: 8rpx 12rpx; background: rgba(255,255,255,0.6); border-radius: 8rpx; }
.zone-teaching { top: 8%; left: 45%; }
.zone-life { top: 50%; left: 8%; }
.zone-sports { top: 68%; left: 8%; }

.building-marker { 
  position: absolute; 
  transform: translate(-50%, -50%); 
  text-align: center; 
  padding: 12rpx; 
  background: #fff; 
  border-radius: 12rpx; 
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.12);
  transition: all 0.2s;
  min-width: 80rpx;
}
.building-marker.selected { 
  background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); 
  transform: translate(-50%, -50%) scale(1.1);
}
.building-marker.selected .building-name { color: #fff; }
.building-icon { font-size: 28rpx; }
.building-name { font-size: 18rpx; color: #333; margin-top: 4rpx; white-space: nowrap; }
.building-floors { font-size: 16rpx; color: #999; }

.nav-route-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }

.current-location { position: absolute; transform: translate(-50%, -50%); z-index: 10; }
.location-pulse { position: absolute; width: 60rpx; height: 60rpx; background: rgba(212,165,116,0.3); border-radius: 50%; animation: pulse 2s infinite; left: -20rpx; top: -20rpx; }
.location-dot { width: 20rpx; height: 20rpx; background: #d4a574; border: 4rpx solid #fff; border-radius: 50%; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.2); }
.location-label { position: absolute; top: 30rpx; left: 50%; transform: translateX(-50%); font-size: 18rpx; color: #666; white-space: nowrap; background: #fff; padding: 4rpx 10rpx; border-radius: 8rpx; }
@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.5); opacity: 0; } }

.map-legend { display: flex; flex-wrap: wrap; gap: 20rpx; margin-top: 20rpx; padding: 20rpx; background: #fff; border-radius: 16rpx; }
.legend-item { display: flex; align-items: center; gap: 8rpx; font-size: 22rpx; color: #666; }
.legend-dot { width: 20rpx; height: 20rpx; border-radius: 4rpx; }
.legend-dot.teaching { background: #d4a574; }
.legend-dot.library { background: #8fbc8f; }
.legend-dot.canteen { background: #c9a86c; }
.legend-dot.sports { background: #a67c52; }
.legend-dot.dorm { background: #b8956c; }

.detail-header { display: flex; align-items: center; gap: 20rpx; margin-bottom: 20rpx; }
.detail-icon { font-size: 48rpx; }
.detail-info { flex: 1; }
.detail-name { display: block; font-size: 32rpx; font-weight: bold; color: #333; }
.detail-desc { display: block; font-size: 24rpx; color: #999; margin-top: 6rpx; }
.nav-to-btn { padding: 16rpx 30rpx; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; border-radius: 30rpx; font-size: 26rpx; }

.detail-stats { display: flex; border-top: 1rpx solid #f0f0f0; padding-top: 20rpx; margin-bottom: 20rpx; }
.stat { flex: 1; text-align: center; }
.stat-value { display: block; font-size: 32rpx; font-weight: bold; color: #8b6914; }
.stat-label { display: block; font-size: 22rpx; color: #999; margin-top: 6rpx; }

.floor-overview { border-top: 1rpx solid #f0f0f0; padding-top: 20rpx; }
.floor-title { font-size: 28rpx; font-weight: bold; color: #333; margin-bottom: 15rpx; display: block; }
.floor-list { display: flex; flex-direction: column; gap: 12rpx; }
.floor-item { display: flex; align-items: center; gap: 15rpx; }
.floor-num { width: 60rpx; font-size: 24rpx; color: #666; }
.floor-bar { flex: 1; height: 16rpx; background: #f0f0f0; border-radius: 8rpx; overflow: hidden; }
.floor-fill { height: 100%; background: linear-gradient(90deg, #8fbc8f 0%, #6b8e6b 100%); border-radius: 8rpx; transition: width 0.3s ease; }
.floor-info { width: 80rpx; font-size: 22rpx; color: #999; text-align: right; }

.rooms-section { padding: 20rpx; }
.filter-bar { display: flex; gap: 20rpx; margin-bottom: 20rpx; }
.filter-item { flex: 1; display: flex; justify-content: space-between; align-items: center; padding: 20rpx; background: #fff; border-radius: 16rpx; font-size: 26rpx; color: #333; }
.arrow { color: #999; font-size: 20rpx; }

.rooms-stats { margin-bottom: 20rpx; }
.stats-text { font-size: 26rpx; color: #666; }
.highlight { color: #8b6914; font-weight: bold; }

.rooms-list { height: 800rpx; }
.room-card { background: #fff; border-radius: 16rpx; padding: 25rpx; margin-bottom: 15rpx; }
.room-main { display: flex; align-items: center; gap: 15rpx; margin-bottom: 15rpx; }
.room-icon { font-size: 36rpx; }
.room-info { flex: 1; }
.room-name { display: block; font-size: 30rpx; font-weight: 500; color: #333; }
.room-building { display: block; font-size: 24rpx; color: #999; margin-top: 4rpx; }
.room-meta { display: flex; justify-content: space-between; font-size: 24rpx; }
.room-capacity { color: #666; }
.room-status { color: #999; }
.room-status.free { color: #5a8f5a; }
.room-actions { margin-top: 15rpx; padding-top: 15rpx; border-top: 1rpx solid #f0f0f0; }
.room-card .action-btn { text-align: center; padding: 16rpx; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; border-radius: 12rpx; font-size: 26rpx; }

.navigate-section { padding: 20rpx; }
.nav-form { position: relative; }
.form-group { margin-bottom: 20rpx; }
.form-label { display: block; font-size: 24rpx; color: #999; margin-bottom: 10rpx; }
.form-input { display: flex; justify-content: space-between; align-items: center; padding: 20rpx; background: #f5f5f5; border-radius: 12rpx; font-size: 28rpx; color: #333; }
.swap-btn { position: absolute; right: 25rpx; top: 50%; transform: translateY(-80%); width: 60rpx; height: 60rpx; background: #f5f5f5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28rpx; z-index: 1; }
.start-nav-btn { margin-top: 30rpx; text-align: center; padding: 24rpx; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; border-radius: 40rpx; font-size: 30rpx; font-weight: 500; }

.nav-result { margin-top: 20rpx; }
.result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; padding-bottom: 15rpx; border-bottom: 1rpx solid #f0f0f0; }
.result-title { font-size: 30rpx; font-weight: bold; color: #333; }
.result-meta { display: flex; gap: 20rpx; }
.distance { font-size: 28rpx; color: #8b6914; font-weight: 500; }
.time { font-size: 24rpx; color: #999; }

.route-steps { margin-bottom: 25rpx; }
.step-item { display: flex; align-items: flex-start; gap: 15rpx; padding: 15rpx 0; position: relative; }
.step-item:not(:last-child)::after { content: ''; position: absolute; left: 17rpx; top: 50rpx; bottom: -15rpx; width: 2rpx; background: #e0e0e0; }
.step-icon { width: 36rpx; height: 36rpx; display: flex; align-items: center; justify-content: center; font-size: 24rpx; background: #f5f5f5; border-radius: 50%; z-index: 1; }
.step-icon.start { background: #d4a574; }
.step-icon.end { background: #8fbc8f; }
.step-content { flex: 1; }
.step-text { display: block; font-size: 26rpx; color: #333; }
.step-distance { display: block; font-size: 22rpx; color: #999; margin-top: 4rpx; }

.nav-actions { display: flex; gap: 20rpx; }
.nav-actions .action-btn { flex: 1; text-align: center; padding: 20rpx; border-radius: 30rpx; font-size: 28rpx; }
.action-btn.secondary { background: #f5f5f5; color: #666; }
.action-btn.primary { background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; }

.hot-destinations { margin-top: 20rpx; }
.card-title { font-size: 28rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; display: block; }
.dest-grid { display: flex; flex-wrap: wrap; gap: 20rpx; }
.dest-item { width: calc(33.33% - 14rpx); display: flex; flex-direction: column; align-items: center; padding: 25rpx 10rpx; background: #faf8f5; border-radius: 16rpx; }
.dest-icon { font-size: 40rpx; margin-bottom: 10rpx; }
.dest-name { font-size: 24rpx; color: #666; }

.realtime-nav-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 999; display: flex; flex-direction: column; }
.realtime-content { flex: 1; background: #fff; margin-top: 200rpx; border-radius: 40rpx 40rpx 0 0; padding: 30rpx; display: flex; flex-direction: column; }
.realtime-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30rpx; }
.realtime-title { font-size: 32rpx; font-weight: bold; color: #333; }
.close-btn { width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; font-size: 36rpx; color: #999; }

.realtime-map { flex: 1; background: linear-gradient(135deg, #f5e6d3 0%, #e8d4be 100%); border-radius: 24rpx; margin-bottom: 30rpx; position: relative; min-height: 400rpx; }
.mini-map { width: 100%; height: 100%; position: relative; }
.current-pos { position: absolute; bottom: 20%; left: 50%; width: 24rpx; height: 24rpx; background: #d4a574; border: 4rpx solid #fff; border-radius: 50%; transform: translate(-50%, 50%); z-index: 2; }
.target-pos { position: absolute; width: 32rpx; height: 32rpx; background: #8fbc8f; border: 4rpx solid #fff; border-radius: 50%; transform: translate(-50%, -50%); z-index: 2; }
.route-line { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

.realtime-info { background: #faf8f5; border-radius: 20rpx; padding: 25rpx; margin-bottom: 30rpx; }
.next-step { margin-bottom: 20rpx; }
.step-direction { display: block; font-size: 40rpx; font-weight: bold; color: #8b6914; }
.step-desc { display: block; font-size: 28rpx; color: #666; margin-top: 10rpx; }
.remaining { display: flex; gap: 30rpx; }
.remaining-dist { font-size: 28rpx; color: #333; font-weight: 500; }
.remaining-time { font-size: 26rpx; color: #999; }

.realtime-actions .action-btn { text-align: center; padding: 24rpx; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; border-radius: 40rpx; font-size: 30rpx; }
</style>
