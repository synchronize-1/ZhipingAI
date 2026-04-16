<template>
  <div class="campus-map-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <el-icon :size="28"><MapLocation /></el-icon>
        </div>
        <div class="header-text">
          <h1>校园导航</h1>
          <p>快速查找建筑物、教室与空闲场地</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="ChatDotRound" @click="showAIDialog = true" class="ai-nav-btn">
          <span>🤖 AI智能导航</span>
        </el-button>
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索建筑物、教室..." 
          class="search-input"
          prefix-icon="Search"
          clearable
          @input="handleSearch"
        />
      </div>
    </div>

    <div class="main-content">
      <!-- 左侧：校园地图 -->
      <div class="map-section">
        <div class="map-container">
          <div class="campus-svg-map">
            <!-- 校园地图SVG - 更大更宏伟 -->
            <svg viewBox="0 0 1000 700" class="campus-map-svg">
              <!-- 渐变背景 -->
              <defs>
                <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#e0f2fe;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#dcfce7;stop-opacity:1" />
                </linearGradient>
                <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#94a3b8" />
                  <stop offset="100%" style="stop-color:#cbd5e1" />
                </linearGradient>
                <!-- 导航路径动画 -->
                <linearGradient id="navPathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#3b82f6" />
                  <stop offset="50%" style="stop-color:#8b5cf6" />
                  <stop offset="100%" style="stop-color:#ec4899" />
                </linearGradient>
              </defs>
              
              <rect x="0" y="0" width="1000" height="700" fill="url(#bgGradient)" />
              
              <!-- 草地装饰 -->
              <ellipse cx="850" cy="600" rx="120" ry="80" fill="#86efac" opacity="0.5" />
              <ellipse cx="100" cy="100" rx="80" ry="60" fill="#86efac" opacity="0.4" />
              <ellipse cx="900" cy="150" rx="60" ry="40" fill="#86efac" opacity="0.3" />
              
              <!-- 主干道 -->
              <path d="M 50 350 L 950 350" stroke="url(#roadGradient)" stroke-width="35" fill="none" stroke-linecap="round" />
              <path d="M 500 50 L 500 650" stroke="url(#roadGradient)" stroke-width="35" fill="none" stroke-linecap="round" />
              <!-- 道路标线 -->
              <path d="M 50 350 L 950 350" stroke="white" stroke-width="3" stroke-dasharray="20,15" fill="none" />
              <path d="M 500 50 L 500 650" stroke="white" stroke-width="3" stroke-dasharray="20,15" fill="none" />
              
              <!-- 次要道路 -->
              <path d="M 200 200 L 200 500" stroke="#d1d5db" stroke-width="18" fill="none" stroke-linecap="round" />
              <path d="M 750 200 L 750 500" stroke="#d1d5db" stroke-width="18" fill="none" stroke-linecap="round" />
              <path d="M 200 200 L 400 200" stroke="#d1d5db" stroke-width="18" fill="none" stroke-linecap="round" />
              <path d="M 600 500 L 800 500" stroke="#d1d5db" stroke-width="18" fill="none" stroke-linecap="round" />
              
              <!-- 导航路径（当导航时显示） -->
              <g v-if="isNavigating && navigationPath">
                <!-- 路径底层阴影 -->
                <path 
                    :d="navigationPath" 
                    stroke="rgba(59, 130, 246, 0.3)" 
                    stroke-width="12" 
                    fill="none" 
                    stroke-linecap="round"
                />
                <!-- 主路径 -->
                <path 
                    :d="navigationPath" 
                    stroke="url(#navPathGradient)" 
                    stroke-width="6" 
                    fill="none" 
                    stroke-linecap="round"
                    stroke-dasharray="15,8"
                    class="nav-path-animation"
                />
                <!-- 行走动画小人 -->
                <circle 
                    r="8" 
                    fill="#3b82f6" 
                    stroke="white" 
                    stroke-width="3"
                    class="walking-marker"
                >
                    <animateMotion 
                        :path="navigationPath" 
                        dur="4s" 
                        repeatCount="indefinite"
                        rotate="auto"
                    />
                </circle>
                <!-- 路径转折点标记 -->
                <g v-for="(point, index) in pathWaypoints" :key="index">
                    <circle 
                        :cx="point.x" 
                        :cy="point.y" 
                        r="5" 
                        fill="white" 
                        stroke="#3b82f6" 
                        stroke-width="2"
                    />
                </g>
              </g>
              
              <!-- 建筑物 -->
              <g v-for="building in buildings" :key="building.id" 
                 class="building-group"
                 :class="{ 'selected': selectedBuilding?.id === building.id, 'navigating-target': navigationTarget?.id === building.id }"
                 @click="handleBuildingClick(building)"
                 @dblclick="startQuickNavigation(building)"
                 @mouseenter="hoveredBuilding = building"
                 @mouseleave="hoveredBuilding = null">
                <rect 
                  :x="building.x" 
                  :y="building.y" 
                  :width="building.width" 
                  :height="building.height"
                  :fill="getBuildingColor(building)"
                  rx="8"
                  class="building-rect"
                />
                <text 
                  :x="building.x + building.width / 2" 
                  :y="building.y + building.height / 2"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  fill="white"
                  font-size="12"
                  font-weight="600"
                >
                  {{ building.shortName }}
                </text>
              </g>
              
              <!-- 当前位置标记 -->
              <g class="current-location" :transform="`translate(${currentLocation.x}, ${currentLocation.y})`">
                <circle r="20" fill="#3b82f6" opacity="0.2" class="location-pulse" />
                <circle r="12" fill="#3b82f6" opacity="0.4" class="location-pulse-inner" />
                <circle r="8" fill="#3b82f6" stroke="white" stroke-width="3" />
                <text y="-25" text-anchor="middle" font-size="11" fill="#3b82f6" font-weight="600">我的位置</text>
              </g>
              
              <!-- 导航终点标记 -->
              <g v-if="isNavigating && navigationTarget" 
                 :transform="`translate(${navigationTarget.x + navigationTarget.width/2}, ${navigationTarget.y + navigationTarget.height/2})`">
                <circle r="35" fill="#ef4444" opacity="0.15" class="destination-pulse-outer" />
                <circle r="25" fill="#ef4444" opacity="0.3" class="destination-pulse" />
                <path d="M 0 -25 L 8 -10 L 0 -15 L -8 -10 Z" fill="#ef4444" class="destination-marker" />
                <circle r="8" fill="#ef4444" stroke="white" stroke-width="2" cy="5" />
                <text y="30" text-anchor="middle" font-size="11" fill="#ef4444" font-weight="600">目的地</text>
              </g>
              
              <!-- 导航起点标记 -->
              <g v-if="isNavigating" :transform="`translate(${currentLocation.x}, ${currentLocation.y})`">
                <circle r="15" fill="#10b981" opacity="0.3" class="start-pulse" />
                <circle r="10" fill="#10b981" stroke="white" stroke-width="2" />
                <text y="-20" text-anchor="middle" font-size="10" fill="#10b981" font-weight="600">起点</text>
              </g>
              
              <!-- 图例 -->
              <g transform="translate(30, 620)">
                <rect x="0" y="0" width="20" height="20" fill="#3b82f6" rx="4" />
                <text x="26" y="15" font-size="12" fill="#334155" font-weight="500">教学楼</text>
                <rect x="90" y="0" width="20" height="20" fill="#10b981" rx="4" />
                <text x="116" y="15" font-size="12" fill="#334155" font-weight="500">图书馆</text>
                <rect x="180" y="0" width="20" height="20" fill="#f59e0b" rx="4" />
                <text x="206" y="15" font-size="12" fill="#334155" font-weight="500">食堂</text>
                <rect x="260" y="0" width="20" height="20" fill="#8b5cf6" rx="4" />
                <text x="286" y="15" font-size="12" fill="#334155" font-weight="500">宿舍</text>
                <rect x="340" y="0" width="20" height="20" fill="#ef4444" rx="4" />
                <text x="366" y="15" font-size="12" fill="#334155" font-weight="500">实验楼</text>
                <rect x="430" y="0" width="20" height="20" fill="#06b6d4" rx="4" />
                <text x="456" y="15" font-size="12" fill="#334155" font-weight="500">体育馆</text>
                
                <!-- 当前位置图例 -->
                <circle cx="540" cy="10" r="8" fill="#3b82f6" stroke="white" stroke-width="2" />
                <text x="555" y="15" font-size="12" fill="#334155" font-weight="500">我的位置</text>
              </g>
            </svg>
            
            <!-- 建筑物悬浮信息 -->
            <transition name="fade">
              <div v-if="hoveredBuilding" class="building-tooltip" :style="tooltipStyle">
                <div class="tooltip-header">
                  <span class="tooltip-name">{{ hoveredBuilding.name }}</span>
                  <el-tag size="small" :type="getBuildingTagType(hoveredBuilding.type)">{{ hoveredBuilding.typeName }}</el-tag>
                </div>
                <div class="tooltip-info">
                  <span><el-icon><Location /></el-icon> {{ hoveredBuilding.floors }}层</span>
                  <span><el-icon><OfficeBuilding /></el-icon> {{ hoveredBuilding.roomCount }}个房间</span>
                </div>
              </div>
            </transition>
          </div>
        </div>
        
        <!-- 地图控制 -->
        <div class="map-controls">
          <el-button-group>
            <el-button :icon="ZoomIn" @click="zoomIn" title="放大" />
            <el-button :icon="ZoomOut" @click="zoomOut" title="缩小" />
            <el-button :icon="Aim" @click="resetView" title="重置" />
          </el-button-group>
        </div>
        
        <!-- 实时导航状态 -->
        <div v-if="isNavigating" class="navigation-status">
          <div class="nav-header">
            <el-icon class="nav-icon-pulse"><Position /></el-icon>
            <span>正在导航中...</span>
          </div>
          <div class="nav-info">
            <p>目的地：<strong>{{ navigationTarget?.name }}</strong></p>
            <p>预计时间：<strong>{{ estimatedTime }} 分钟</strong></p>
            <p>距离：<strong>{{ estimatedDistance }} 米</strong></p>
          </div>
          <el-button type="danger" size="small" @click="stopNavigation">结束导航</el-button>
        </div>
      </div>

      <!-- 右侧：建筑物详情与空闲教室 -->
      <div class="detail-section">
        <!-- 空闲教室查询 -->
        <div class="detail-card empty-rooms">
          <div class="card-header">
            <div class="header-left">
              <el-icon><OfficeBuilding /></el-icon>
              <span>空闲教室查询</span>
            </div>
            <el-select v-model="selectedTimeSlot" placeholder="选择时间段" size="small" style="width: 140px">
              <el-option label="08:00-09:40" value="1" />
              <el-option label="10:00-11:40" value="2" />
              <el-option label="14:00-15:40" value="3" />
              <el-option label="16:00-17:40" value="4" />
              <el-option label="19:00-20:40" value="5" />
            </el-select>
          </div>
          <div class="empty-rooms-list">
            <div v-for="room in emptyRooms" :key="room.id" class="room-item" @click="viewRoomDetail(room)">
              <div class="room-info">
                <span class="room-name">{{ room.name }}</span>
                <span class="room-building">{{ room.building }}</span>
              </div>
              <div class="room-meta">
                <el-tag size="small" type="success">空闲</el-tag>
                <span class="room-capacity"><el-icon><User /></el-icon> {{ room.capacity }}人</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 选中建筑物详情 -->
        <div v-if="selectedBuilding" class="detail-card building-detail">
          <div class="card-header">
            <div class="header-left">
              <el-icon><Location /></el-icon>
              <span>{{ selectedBuilding.name }}</span>
            </div>
            <el-button type="primary" text size="small" @click="navigateTo(selectedBuilding)">
              <el-icon><Position /></el-icon>
              导航
            </el-button>
          </div>
          <div class="building-info">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">类型</span>
                <span class="info-value">{{ selectedBuilding.typeName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">楼层</span>
                <span class="info-value">{{ selectedBuilding.floors }}层</span>
              </div>
              <div class="info-item">
                <span class="info-label">房间数</span>
                <span class="info-value">{{ selectedBuilding.roomCount }}个</span>
              </div>
              <div class="info-item">
                <span class="info-label">开放时间</span>
                <span class="info-value">{{ selectedBuilding.openTime }}</span>
              </div>
            </div>
            <div class="building-description">
              <p>{{ selectedBuilding.description }}</p>
            </div>
            <div class="floor-list">
              <h4>楼层概览</h4>
              <div class="floors">
                <div v-for="floor in selectedBuilding.floorList" :key="floor.floor" class="floor-item">
                  <span class="floor-number">{{ floor.floor }}F</span>
                  <div class="floor-rooms">
                    <el-tag 
                      v-for="room in floor.rooms.slice(0, 4)" 
                      :key="room" 
                      size="small"
                      effect="plain"
                    >
                      {{ room }}
                    </el-tag>
                    <el-tag v-if="floor.rooms.length > 4" size="small" type="info">
                      +{{ floor.rooms.length - 4 }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 快捷导航 -->
        <div class="detail-card quick-nav">
          <div class="card-header">
            <div class="header-left">
              <el-icon><Compass /></el-icon>
              <span>快捷导航</span>
            </div>
          </div>
          <div class="quick-nav-grid">
            <div v-for="item in quickNavItems" :key="item.name" class="nav-item" @click="quickNavigate(item)">
              <div class="nav-icon" :style="{ background: item.color }">
                <span>{{ item.icon }}</span>
              </div>
              <span class="nav-name">{{ item.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI智能导航对话框 -->
    <el-dialog
      v-model="showAIDialog"
      title="🤖 AI智能导航助手"
      width="600px"
      :close-on-click-modal="false"
      class="ai-dialog"
    >
      <div class="ai-chat-container">
        <!-- 聊天记录 -->
        <div class="chat-messages" ref="chatMessages">
          <div v-for="(msg, index) in chatHistory" :key="index" :class="['message', msg.role]">
            <div class="message-avatar">
              <span v-if="msg.role === 'user'">👤</span>
              <span v-else>🤖</span>
            </div>
            <div class="message-content">
              <div class="message-text">{{ msg.content }}</div>
              <div v-if="msg.suggestions" class="message-suggestions">
                <el-tag 
                  v-for="(sug, i) in msg.suggestions" 
                  :key="i" 
                  type="info" 
                  size="small"
                  @click="handleSuggestionClick(sug)"
                  style="cursor: pointer; margin: 4px;"
                >
                  {{ sug.text }}
                </el-tag>
              </div>
              <div v-if="msg.route" class="route-preview">
                <div class="route-info">
                  <el-icon><Position /></el-icon>
                  <span>{{ msg.route.destination }}</span>
                </div>
                <div class="route-details">
                  <span>🚶 {{ msg.route.distance }}米</span>
                  <span>⏱️ {{ msg.route.time }}分钟</span>
                  <span v-if="msg.route.shaded">🌳 阴凉路线</span>
                </div>
                <el-button type="primary" size="small" @click="startAINavigation(msg.route)">
                  开始导航
                </el-button>
              </div>
            </div>
          </div>
          <div v-if="aiThinking" class="message assistant thinking">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
              <div class="thinking-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input-area">
          <el-input
            v-model="userInput"
            placeholder="问我任何关于校园导航的问题..."
            @keyup.enter="sendMessage"
            :disabled="aiThinking"
          >
            <template #prepend>
              <el-button :icon="Microphone" @click="startVoiceInput" :disabled="isRecording || aiThinking">
                {{ isRecording ? '🔴' : '🎤' }}
              </el-button>
            </template>
            <template #append>
              <el-button type="primary" @click="sendMessage" :disabled="!userInput.trim() || aiThinking">
                发送
              </el-button>
            </template>
          </el-input>
          <div class="quick-questions">
            <el-tag 
              v-for="q in quickQuestions" 
              :key="q" 
              size="small" 
              @click="askQuickQuestion(q)"
              style="cursor: pointer; margin: 4px;"
            >
              {{ q }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { MapLocation, Location, OfficeBuilding, User, ZoomIn, ZoomOut, Aim, Position, Compass, ChatDotRound, Microphone } from '@element-plus/icons-vue'

defineOptions({ name: 'CampusMap' })

const searchQuery = ref('')
const selectedBuilding = ref(null)
const hoveredBuilding = ref(null)
const selectedTimeSlot = ref('1')

// AI导航状态
const showAIDialog = ref(false)
const userInput = ref('')
const chatHistory = ref([])
const aiThinking = ref(false)
const isRecording = ref(false)
const chatMessages = ref(null)
const quickQuestions = ref([
  '我想去图书馆',
  '最近的食堂在哪',
  '带我去教学楼',
  '阴凉路线到体育馆'
])

// 当前位置
const currentLocation = ref({ x: 500, y: 350 })

// 建筑物数据 - 更大的布局
const buildings = ref([
  { id: 1, name: '教学楼A', shortName: '教A', type: 'teaching', typeName: '教学楼', x: 80, y: 120, width: 130, height: 100, floors: 6, roomCount: 48, openTime: '07:00-22:00', description: '主要承担计算机学院、软件学院的教学任务，配备多媒体教室和计算机实验室。', floorList: [
    { floor: 1, rooms: ['A101', 'A102', 'A103', 'A104', 'A105', 'A106'] },
    { floor: 2, rooms: ['A201', 'A202', 'A203', 'A204', 'A205'] },
    { floor: 3, rooms: ['A301', 'A302', 'A303', 'A304'] }
  ]},
  { id: 2, name: '教学楼B', shortName: '教B', type: 'teaching', typeName: '教学楼', x: 280, y: 120, width: 130, height: 100, floors: 5, roomCount: 40, openTime: '07:00-22:00', description: '综合教学楼，设有阶梯教室和小型研讨室。', floorList: [
    { floor: 1, rooms: ['B101', 'B102', 'B103', 'B104'] },
    { floor: 2, rooms: ['B201', 'B202', 'B203'] }
  ]},
  { id: 3, name: '图书馆', shortName: '图书馆', type: 'library', typeName: '图书馆', x: 380, y: 240, width: 160, height: 130, floors: 8, roomCount: 32, openTime: '08:00-22:30', description: '馆藏图书150万册，提供自习室、电子阅览室、研讨室等服务。', floorList: [
    { floor: 1, rooms: ['借阅大厅', '服务台', '新书展区'] },
    { floor: 2, rooms: ['自习室A', '自习室B', '电子阅览室'] }
  ]},
  { id: 4, name: '第一食堂', shortName: '一食堂', type: 'canteen', typeName: '食堂', x: 700, y: 120, width: 120, height: 90, floors: 2, roomCount: 8, openTime: '06:30-21:00', description: '可容纳2000人同时就餐，提供各地特色美食。', floorList: [
    { floor: 1, rooms: ['快餐区', '面食区', '小炒区'] },
    { floor: 2, rooms: ['特色美食', '清真窗口'] }
  ]},
  { id: 5, name: '学生宿舍1号楼', shortName: '1号楼', type: 'dormitory', typeName: '宿舍', x: 80, y: 450, width: 100, height: 130, floors: 12, roomCount: 240, openTime: '全天', description: '本科生男生宿舍，4人间配置，配有空调、独立卫浴。', floorList: [
    { floor: 1, rooms: ['门卫室', '快递柜', '自习室'] }
  ]},
  { id: 6, name: '实验楼', shortName: '实验楼', type: 'lab', typeName: '实验楼', x: 700, y: 420, width: 130, height: 110, floors: 5, roomCount: 35, openTime: '08:00-22:00', description: '配备先进的实验设备，包括物理、化学、生物实验室。', floorList: [
    { floor: 1, rooms: ['物理实验室', '化学实验室'] },
    { floor: 2, rooms: ['生物实验室', '计算机实验室'] }
  ]},
  { id: 7, name: '体育馆', shortName: '体育馆', type: 'sports', typeName: '体育场馆', x: 280, y: 450, width: 130, height: 110, floors: 2, roomCount: 10, openTime: '06:00-22:00', description: '包含篮球馆、游泳馆、健身房等设施。', floorList: [
    { floor: 1, rooms: ['篮球场', '羽毛球场', '乒乓球室'] },
    { floor: 2, rooms: ['健身房', '瑜伽室'] }
  ]},
  { id: 8, name: '行政楼', shortName: '行政楼', type: 'admin', typeName: '行政楼', x: 580, y: 240, width: 110, height: 90, floors: 4, roomCount: 20, openTime: '08:00-17:30', description: '学校行政办公楼，包括校长办公室、教务处、学工处等。', floorList: [
    { floor: 1, rooms: ['大厅', '服务中心'] }
  ]},
  { id: 9, name: '第二食堂', shortName: '二食堂', type: 'canteen', typeName: '食堂', x: 480, y: 450, width: 110, height: 85, floors: 2, roomCount: 6, openTime: '07:00-20:30', description: '以特色小吃和快餐为主，价格实惠。', floorList: [
    { floor: 1, rooms: ['粉面区', '小吃区'] }
  ]}
])

// 空闲教室
const emptyRooms = ref([
  { id: 1, name: 'A-301', building: '教学楼A', capacity: 60, status: 'empty' },
  { id: 2, name: 'A-302', building: '教学楼A', capacity: 60, status: 'empty' },
  { id: 3, name: 'B-205', building: '教学楼B', capacity: 45, status: 'empty' },
  { id: 4, name: 'A-401', building: '教学楼A', capacity: 80, status: 'empty' },
  { id: 5, name: 'B-103', building: '教学楼B', capacity: 50, status: 'empty' }
])

// 快捷导航
const quickNavItems = ref([
  { name: '图书馆', icon: '📚', color: 'linear-gradient(135deg, #10b981, #059669)', buildingId: 3 },
  { name: '食堂', icon: '🍽️', color: 'linear-gradient(135deg, #f59e0b, #d97706)', buildingId: 4 },
  { name: '体育馆', icon: '🏃', color: 'linear-gradient(135deg, #3b82f6, #2563eb)', buildingId: 7 },
  { name: '实验楼', icon: '🔬', color: 'linear-gradient(135deg, #ef4444, #dc2626)', buildingId: 6 },
  { name: '宿舍', icon: '🏠', color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', buildingId: 5 },
  { name: '教学楼', icon: '🏫', color: 'linear-gradient(135deg, #667eea, #764ba2)', buildingId: 1 }
])

const tooltipStyle = computed(() => {
  if (!hoveredBuilding.value) return {}
  return {
    left: `${hoveredBuilding.value.x + hoveredBuilding.value.width / 2}px`,
    top: `${hoveredBuilding.value.y - 10}px`
  }
})

const getBuildingColor = (building) => {
  const colors = {
    teaching: '#3b82f6',
    library: '#10b981',
    canteen: '#f59e0b',
    dormitory: '#8b5cf6',
    lab: '#ef4444',
    sports: '#06b6d4'
  }
  return colors[building.type] || '#6b7280'
}

const getBuildingTagType = (type) => {
  const types = {
    teaching: 'primary',
    library: 'success',
    canteen: 'warning',
    dormitory: '',
    lab: 'danger',
    sports: 'info'
  }
  return types[type] || 'info'
}

const selectBuilding = (building) => {
  selectedBuilding.value = building
}

// 单击建筑物：选中并显示详情
const handleBuildingClick = (building) => {
  selectedBuilding.value = building
  // 如果正在导航到其他地点，询问是否切换
  if (isNavigating.value && navigationTarget.value?.id !== building.id) {
    ElMessage.info(`点击了 ${building.name}，双击可导航至此处`)
  }
}

// 双击建筑物：直接开始导航
const startQuickNavigation = (building) => {
  selectedBuilding.value = building
  navigateTo(building)
}

const handleSearch = () => {
  if (!searchQuery.value) return
  const found = buildings.value.find(b => 
    b.name.includes(searchQuery.value) || b.shortName.includes(searchQuery.value)
  )
  if (found) {
    selectedBuilding.value = found
    ElMessage.success(`已定位到 ${found.name}`)
  } else {
    ElMessage.warning('未找到相关建筑物')
  }
}

const viewRoomDetail = (room) => {
  ElMessage.info(`查看教室 ${room.name} 详情`)
}

const isNavigating = ref(false)
const navigationTarget = ref(null)
const estimatedTime = ref(5)
const estimatedDistance = ref(300)

// 计算导航路径 - 更智能的路径规划
const navigationPath = computed(() => {
  if (!isNavigating.value || !navigationTarget.value) return null
  const target = navigationTarget.value
  const start = currentLocation.value
  const endX = target.x + target.width / 2
  const endY = target.y + target.height / 2
  
  // 主干道位置
  const mainRoadH = 350  // 水平主干道Y坐标
  const mainRoadV = 500  // 垂直主干道X坐标
  
  // 计算最优路径（基于道路网络）
  const paths = []
  
  // 方案1: 先走到水平主干道，再到目标
  if (Math.abs(endY - mainRoadH) < 200) {
    paths.push({
      path: `M ${start.x} ${start.y} L ${start.x} ${mainRoadH} L ${endX} ${mainRoadH} L ${endX} ${endY}`,
      distance: Math.abs(start.y - mainRoadH) + Math.abs(start.x - endX) + Math.abs(mainRoadH - endY)
    })
  }
  
  // 方案2: 先走到垂直主干道，再到目标
  if (Math.abs(endX - mainRoadV) < 300) {
    paths.push({
      path: `M ${start.x} ${start.y} L ${mainRoadV} ${start.y} L ${mainRoadV} ${endY} L ${endX} ${endY}`,
      distance: Math.abs(start.x - mainRoadV) + Math.abs(start.y - endY) + Math.abs(mainRoadV - endX)
    })
  }
  
  // 方案3: 直接路径（如果距离较近）
  const directDist = Math.sqrt(Math.pow(endX - start.x, 2) + Math.pow(endY - start.y, 2))
  if (directDist < 200) {
    paths.push({
      path: `M ${start.x} ${start.y} L ${endX} ${endY}`,
      distance: directDist
    })
  }
  
  // 默认方案：走主干道交叉
  paths.push({
    path: `M ${start.x} ${start.y} L ${start.x} ${mainRoadH} L ${endX} ${mainRoadH} L ${endX} ${endY}`,
    distance: Math.abs(start.y - mainRoadH) + Math.abs(start.x - endX) + Math.abs(mainRoadH - endY)
  })
  
  // 选择最短路径
  paths.sort((a, b) => a.distance - b.distance)
  return paths[0].path
})

// 路径转折点（用于显示标记）
const pathWaypoints = computed(() => {
  if (!navigationPath.value) return []
  
  // 从路径字符串中提取坐标点
  const pathStr = navigationPath.value
  const points = []
  const regex = /[ML]\s*([\d.]+)\s+([\d.]+)/g
  let match
  
  while ((match = regex.exec(pathStr)) !== null) {
    points.push({ x: parseFloat(match[1]), y: parseFloat(match[2]) })
  }
  
  // 返回中间的转折点（不包括起点和终点）
  return points.slice(1, -1)
})

const navigateTo = (building) => {
  isNavigating.value = true
  navigationTarget.value = building
  
  // 计算距离和时间
  const dx = Math.abs(building.x + building.width/2 - currentLocation.value.x)
  const dy = Math.abs(building.y + building.height/2 - currentLocation.value.y)
  const distance = Math.round(Math.sqrt(dx*dx + dy*dy) * 0.8)
  
  estimatedDistance.value = distance
  estimatedTime.value = Math.max(2, Math.round(distance / 80))
  
  ElMessage.success(`开始导航至 ${building.name}`)
  
  // 发送通知
  import('@/stores/socket').then(({ useSocketStore }) => {
    const socketStore = useSocketStore()
    socketStore.addLocalNotification({
      type: 'navigation',
      title: '开始导航',
      content: `正在导航至${building.name}，预计${estimatedTime.value}分钟到达`,
      time: new Date().toISOString()
    })
  })
}

const stopNavigation = () => {
  isNavigating.value = false
  navigationTarget.value = null
  ElMessage.info('导航已结束')
}

const quickNavigate = (item) => {
  const building = buildings.value.find(b => b.id === item.buildingId)
  if (building) {
    selectedBuilding.value = building
  }
}

const zoomIn = () => ElMessage.info('放大地图')
const zoomOut = () => ElMessage.info('缩小地图')
const resetView = () => ElMessage.info('重置视图')

// AI导航功能
const sendMessage = async () => {
  if (!userInput.value.trim()) return
  
  const message = userInput.value.trim()
  chatHistory.value.push({
    role: 'user',
    content: message
  })
  
  userInput.value = ''
  aiThinking.value = true
  
  await nextTick()
  chatMessages.value?.scrollTo({ top: chatMessages.value.scrollHeight, behavior: 'smooth' })
  
  setTimeout(() => {
    const response = processAIQuery(message)
    chatHistory.value.push(response)
    aiThinking.value = false
    
    nextTick(() => {
      chatMessages.value?.scrollTo({ top: chatMessages.value.scrollHeight, behavior: 'smooth' })
    })
  }, 1000)
}

const processAIQuery = (query) => {
  const lowerQuery = query.toLowerCase()
  
  // 识别目的地
  let targetBuilding = null
  let preferShaded = lowerQuery.includes('阴凉') || lowerQuery.includes('树荫') || lowerQuery.includes('凉快')
  
  // 匹配建筑物
  for (const building of buildings.value) {
    if (lowerQuery.includes(building.name) || 
        lowerQuery.includes(building.shortName) ||
        lowerQuery.includes(building.typeName)) {
      targetBuilding = building
      break
    }
  }
  
  // 特殊关键词匹配
  if (!targetBuilding) {
    if (lowerQuery.includes('图书') || lowerQuery.includes('看书') || lowerQuery.includes('自习')) {
      targetBuilding = buildings.value.find(b => b.type === 'library')
    } else if (lowerQuery.includes('吃饭') || lowerQuery.includes('食堂') || lowerQuery.includes('餐厅')) {
      // 找最近的食堂
      const canteens = buildings.value.filter(b => b.type === 'canteen')
      targetBuilding = findNearestBuilding(canteens)
    } else if (lowerQuery.includes('上课') || lowerQuery.includes('教室') || lowerQuery.includes('教学')) {
      targetBuilding = buildings.value.find(b => b.type === 'teaching')
    } else if (lowerQuery.includes('运动') || lowerQuery.includes('体育') || lowerQuery.includes('健身')) {
      targetBuilding = buildings.value.find(b => b.type === 'sports')
    } else if (lowerQuery.includes('宿舍') || lowerQuery.includes('寝室') || lowerQuery.includes('睡觉')) {
      targetBuilding = buildings.value.find(b => b.type === 'dormitory')
    } else if (lowerQuery.includes('实验')) {
      targetBuilding = buildings.value.find(b => b.type === 'lab')
    }
  }
  
  if (targetBuilding) {
    const route = calculateAIRoute(targetBuilding, preferShaded)
    
    let responseText = `好的！我为您规划了前往${targetBuilding.name}的路线。`
    if (preferShaded) {
      responseText += '\n\n🌳 已为您优先选择阴凉路段，让您的行程更加舒适！'
    }
    responseText += `\n\n📍 目的地：${targetBuilding.name}\n📝 ${targetBuilding.description}`
    
    return {
      role: 'assistant',
      content: responseText,
      route: route,
      suggestions: [
        { text: '开始导航', action: 'navigate' },
        { text: '查看其他路线', action: 'alternatives' },
        { text: '查看建筑详情', action: 'details' }
      ]
    }
  } else {
    return {
      role: 'assistant',
      content: '抱歉，我没有理解您想去哪里。您可以告诉我具体的建筑物名称，比如"图书馆"、"食堂"、"教学楼"等。',
      suggestions: [
        { text: '我想去图书馆', action: 'library' },
        { text: '最近的食堂', action: 'canteen' },
        { text: '带我去教学楼', action: 'teaching' }
      ]
    }
  }
}

const findNearestBuilding = (buildingList) => {
  if (buildingList.length === 0) return null
  
  let nearest = buildingList[0]
  let minDist = calculateDistance(currentLocation.value, {
    x: nearest.x + nearest.width / 2,
    y: nearest.y + nearest.height / 2
  })
  
  for (const building of buildingList) {
    const dist = calculateDistance(currentLocation.value, {
      x: building.x + building.width / 2,
      y: building.y + building.height / 2
    })
    if (dist < minDist) {
      minDist = dist
      nearest = building
    }
  }
  
  return nearest
}

const calculateDistance = (point1, point2) => {
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2))
}

const calculateAIRoute = (building, preferShaded) => {
  const dx = Math.abs(building.x + building.width/2 - currentLocation.value.x)
  const dy = Math.abs(building.y + building.height/2 - currentLocation.value.y)
  const distance = Math.round(Math.sqrt(dx*dx + dy*dy) * 0.8)
  const time = Math.max(2, Math.round(distance / 80))
  
  // 如果优先阴凉路段，时间可能稍长但更舒适
  const adjustedTime = preferShaded ? time + 1 : time
  
  return {
    destination: building.name,
    buildingId: building.id,
    distance: distance,
    time: adjustedTime,
    shaded: preferShaded
  }
}

const startAINavigation = (route) => {
  const building = buildings.value.find(b => b.id === route.buildingId)
  if (building) {
    showAIDialog.value = false
    navigateTo(building)
    ElMessage.success(`开始导航至 ${route.destination}${route.shaded ? '（阴凉路线）' : ''}`)
  }
}

const handleSuggestionClick = (suggestion) => {
  if (suggestion.action === 'navigate') {
    const lastMsg = chatHistory.value[chatHistory.value.length - 1]
    if (lastMsg.route) {
      startAINavigation(lastMsg.route)
    }
  } else {
    userInput.value = suggestion.text
    sendMessage()
  }
}

const askQuickQuestion = (question) => {
  userInput.value = question
  sendMessage()
}

const startVoiceInput = () => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    ElMessage.warning('您的浏览器不支持语音识别功能')
    return
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const recognition = new SpeechRecognition()
  
  recognition.lang = 'zh-CN'
  recognition.continuous = false
  recognition.interimResults = false
  
  recognition.onstart = () => {
    isRecording.value = true
    ElMessage.info('正在录音，请说话...')
  }
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript
    userInput.value = transcript
    ElMessage.success('识别成功：' + transcript)
  }
  
  recognition.onerror = (event) => {
    isRecording.value = false
    ElMessage.error('语音识别失败：' + event.error)
  }
  
  recognition.onend = () => {
    isRecording.value = false
  }
  
  recognition.start()
}
</script>

<style scoped>
.campus-map-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 24px;
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.header-text h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.header-text p {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #64748b;
}

.search-input {
  width: 300px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 主内容 */
.main-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

/* 地图区域 */
.map-section {
  position: relative;
}

.map-container {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.campus-svg-map {
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.campus-map-svg {
  width: 100%;
  height: auto;
  min-height: 500px;
}

.building-group {
  cursor: pointer;
  transition: all 0.3s;
}

.building-rect {
  transition: all 0.3s;
  stroke: transparent;
  stroke-width: 3;
}

.building-group:hover .building-rect {
  filter: brightness(1.1);
  stroke: white;
}

.building-group.selected .building-rect {
  stroke: #1d4ed8;
  stroke-width: 4;
  filter: brightness(1.15);
}

.building-group.navigating-target .building-rect {
  stroke: #ef4444;
  stroke-width: 5;
  filter: brightness(1.2);
  animation: targetGlow 1.5s ease-in-out infinite;
}

@keyframes targetGlow {
  0%, 100% { filter: brightness(1.2) drop-shadow(0 0 8px rgba(239, 68, 68, 0.6)); }
  50% { filter: brightness(1.3) drop-shadow(0 0 15px rgba(239, 68, 68, 0.8)); }
}

/* 悬浮提示 */
.building-tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 180px;
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tooltip-name {
  font-weight: 600;
  color: #1e293b;
}

.tooltip-info {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #64748b;
}

.tooltip-info span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 地图控制 */
.map-controls {
  position: absolute;
  bottom: 36px;
  right: 36px;
}

/* 实时导航状态 */
.navigation-status {
  position: absolute;
  top: 36px;
  left: 36px;
  background: white;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 2px solid #3b82f6;
  min-width: 220px;
}

.nav-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 12px;
}

.nav-icon-pulse {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

.nav-info p {
  margin: 6px 0;
  font-size: 13px;
  color: #64748b;
}

.nav-info strong {
  color: #1e293b;
}

/* 详情区域 */
.detail-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.header-left .el-icon {
  color: #3b82f6;
}

/* 空闲教室列表 */
.empty-rooms-list {
  max-height: 200px;
  overflow-y: auto;
}

.room-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.room-item:hover {
  background: #f8fafc;
}

.room-info {
  display: flex;
  flex-direction: column;
}

.room-name {
  font-weight: 600;
  color: #1e293b;
}

.room-building {
  font-size: 12px;
  color: #64748b;
}

.room-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.room-capacity {
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 建筑物详情 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.info-item {
  background: #f8fafc;
  padding: 12px;
  border-radius: 10px;
}

.info-label {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.building-description {
  padding: 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 10px;
  margin-bottom: 16px;
}

.building-description p {
  margin: 0;
  font-size: 13px;
  color: #1e40af;
  line-height: 1.6;
}

.floor-list h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #1e293b;
}

.floors {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.floor-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.floor-number {
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.floor-rooms {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* 快捷导航 */
.quick-nav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.nav-item:hover {
  background: #f8fafc;
  transform: translateY(-2px);
}

.nav-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.nav-name {
  font-size: 12px;
  color: #475569;
  font-weight: 500;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 当前位置脉冲动画 */
.location-pulse {
  animation: locationPulse 2s infinite;
}

.location-pulse-inner {
  animation: locationPulseInner 2s infinite;
}

@keyframes locationPulse {
  0% { r: 20; opacity: 0.2; }
  50% { r: 35; opacity: 0; }
  100% { r: 20; opacity: 0.2; }
}

@keyframes locationPulseInner {
  0% { r: 12; opacity: 0.4; }
  50% { r: 20; opacity: 0.1; }
  100% { r: 12; opacity: 0.4; }
}

/* 目的地脉冲动画 */
.destination-pulse {
  animation: destPulse 1.5s infinite;
}

.destination-marker {
  animation: markerBounce 1s infinite;
}

@keyframes destPulse {
  0%, 100% { r: 25; opacity: 0.3; }
  50% { r: 40; opacity: 0.1; }
}

.destination-pulse-outer {
  animation: destPulseOuter 2s infinite;
}

@keyframes destPulseOuter {
  0%, 100% { r: 35; opacity: 0.15; }
  50% { r: 50; opacity: 0.05; }
}

.start-pulse {
  animation: startPulse 1.5s infinite;
}

@keyframes startPulse {
  0%, 100% { r: 15; opacity: 0.3; }
  50% { r: 25; opacity: 0.1; }
}

.walking-marker {
  filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.5));
}

@keyframes markerBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* 导航路径动画 */
.nav-path-animation {
  animation: dashMove 1s linear infinite;
}

@keyframes dashMove {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -23; }
}

/* 响应式 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}

/* AI导航按钮 */
.ai-nav-btn {
  margin-right: 12px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

/* AI对话框样式 */
.ai-dialog :deep(.el-dialog) {
  border-radius: 20px;
}

.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 20px;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-content {
  max-width: 70%;
  background: white;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.message.user .message-content {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.message-text {
  line-height: 1.6;
  white-space: pre-wrap;
}

.message-suggestions {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.route-preview {
  margin-top: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
}

.route-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 8px;
}

.route-details {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 12px;
}

.thinking {
  opacity: 0.8;
}

.thinking-dots {
  display: flex;
  gap: 6px;
  padding: 8px 0;
}

.thinking-dots span {
  width: 8px;
  height: 8px;
  background: #94a3b8;
  border-radius: 50%;
  animation: thinking 1.4s infinite;
}

.thinking-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.thinking-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes thinking {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.chat-input-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-questions .el-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.quick-questions .el-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
