<template>
  <div class="energy-monitor-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <el-icon :size="28"><Odometer /></el-icon>
        </div>
        <div class="header-text">
          <h1>能耗监测</h1>
          <p>实时监控校园能源消耗，助力绿色校园建设</p>
        </div>
      </div>
      <div class="header-stats">
        <div class="stat-badge green">
          <el-icon><CircleCheck /></el-icon>
          <span>节能达标</span>
        </div>
        <div class="stat-badge">
          <span>本月节能</span>
          <strong class="text-green-500">-12.5%</strong>
        </div>
      </div>
    </div>

    <!-- 核心指标卡片 -->
    <div class="metrics-grid">
      <div class="metric-card electricity">
        <div class="metric-icon">
          <el-icon><Lightning /></el-icon>
        </div>
        <div class="metric-content">
          <div class="metric-value">
            {{ electricityUsage.toLocaleString() }}
            <span class="unit">kWh</span>
          </div>
          <div class="metric-label">今日用电量</div>
          <div class="metric-trend" :class="electricityTrend > 0 ? 'up' : 'down'">
            <el-icon><component :is="electricityTrend > 0 ? 'Top' : 'Bottom'" /></el-icon>
            {{ Math.abs(electricityTrend) }}% 较昨日
          </div>
        </div>
        <div class="metric-chart" ref="electricityChartRef"></div>
      </div>

      <div class="metric-card water">
        <div class="metric-icon">
          <el-icon><Drizzling /></el-icon>
        </div>
        <div class="metric-content">
          <div class="metric-value">
            {{ waterUsage.toLocaleString() }}
            <span class="unit">吨</span>
          </div>
          <div class="metric-label">今日用水量</div>
          <div class="metric-trend" :class="waterTrend > 0 ? 'up' : 'down'">
            <el-icon><component :is="waterTrend > 0 ? 'Top' : 'Bottom'" /></el-icon>
            {{ Math.abs(waterTrend) }}% 较昨日
          </div>
        </div>
        <div class="metric-chart" ref="waterChartRef"></div>
      </div>

      <div class="metric-card carbon">
        <div class="metric-icon">
          <el-icon><Cloudy /></el-icon>
        </div>
        <div class="metric-content">
          <div class="metric-value">
            {{ carbonEmission.toLocaleString() }}
            <span class="unit">kg</span>
          </div>
          <div class="metric-label">碳排放量</div>
          <div class="metric-trend down">
            <el-icon><Bottom /></el-icon>
            8.2% 较上月
          </div>
        </div>
        <div class="metric-chart" ref="carbonChartRef"></div>
      </div>

      <div class="metric-card solar">
        <div class="metric-icon">
          <el-icon><Sunny /></el-icon>
        </div>
        <div class="metric-content">
          <div class="metric-value">
            {{ solarGeneration.toLocaleString() }}
            <span class="unit">kWh</span>
          </div>
          <div class="metric-label">太阳能发电</div>
          <div class="metric-trend up">
            <el-icon><Top /></el-icon>
            15.3% 较昨日
          </div>
        </div>
        <div class="metric-chart" ref="solarChartRef"></div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧：能耗趋势图 -->
      <div class="left-section">
        <div class="content-card trend-chart">
          <div class="card-header">
            <div class="header-left">
              <el-icon><TrendCharts /></el-icon>
              <span>能耗趋势分析</span>
            </div>
            <el-radio-group v-model="trendTimeRange" size="small">
              <el-radio-button label="day">今日</el-radio-button>
              <el-radio-button label="week">本周</el-radio-button>
              <el-radio-button label="month">本月</el-radio-button>
            </el-radio-group>
          </div>
          <div class="chart-container" ref="trendChartRef"></div>
        </div>

        <!-- 建筑能耗排名 -->
        <div class="content-card building-ranking">
          <div class="card-header">
            <div class="header-left">
              <el-icon><OfficeBuilding /></el-icon>
              <span>建筑能耗排名</span>
            </div>
            <el-select v-model="rankingType" size="small" style="width: 100px">
              <el-option label="用电量" value="electricity" />
              <el-option label="用水量" value="water" />
            </el-select>
          </div>
          <div class="ranking-list">
            <div v-for="(item, index) in buildingRanking" :key="item.name" class="ranking-item">
              <div class="rank-badge" :class="getRankClass(index)">{{ index + 1 }}</div>
              <div class="rank-info">
                <span class="rank-name">{{ item.name }}</span>
                <el-progress 
                  :percentage="item.percentage" 
                  :stroke-width="8"
                  :color="getProgressColor(item.percentage)"
                  :show-text="false"
                />
              </div>
              <div class="rank-value">
                <span class="value">{{ item.value.toLocaleString() }}</span>
                <span class="unit">{{ rankingType === 'electricity' ? 'kWh' : '吨' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：绿色校园与节能建议 -->
      <div class="right-section">
        <!-- 绿色校园积分 -->
        <div class="content-card green-score">
          <div class="card-header">
            <div class="header-left">
              <el-icon><Trophy /></el-icon>
              <span>绿色校园积分</span>
            </div>
          </div>
          <div class="score-display">
            <div class="score-ring">
              <el-progress 
                type="circle" 
                :percentage="greenScore" 
                :width="140"
                :stroke-width="12"
                :color="greenScoreColor"
              >
                <template #default>
                  <div class="score-content">
                    <span class="score-value">{{ greenScore }}</span>
                    <span class="score-label">积分</span>
                  </div>
                </template>
              </el-progress>
            </div>
            <div class="score-details">
              <div class="score-item">
                <span class="item-label">节能贡献</span>
                <span class="item-value">+{{ energySavePoints }}</span>
              </div>
              <div class="score-item">
                <span class="item-label">减排贡献</span>
                <span class="item-value">+{{ carbonSavePoints }}</span>
              </div>
              <div class="score-item">
                <span class="item-label">本月排名</span>
                <span class="item-value text-primary">第{{ monthlyRank }}名</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 节能建议 -->
        <div class="content-card energy-tips">
          <div class="card-header">
            <div class="header-left">
              <el-icon><Sunrise /></el-icon>
              <span>节能小贴士</span>
            </div>
          </div>
          <div class="tips-list">
            <div v-for="tip in energyTips" :key="tip.id" class="tip-item">
              <div class="tip-icon">{{ tip.icon }}</div>
              <div class="tip-content">
                <p class="tip-title">{{ tip.title }}</p>
                <p class="tip-desc">{{ tip.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 实时监控告警 -->
        <div class="content-card alerts">
          <div class="card-header">
            <div class="header-left">
              <el-icon><WarningFilled /></el-icon>
              <span>能耗异常告警</span>
            </div>
            <el-badge :value="alerts.length" :hidden="alerts.length === 0">
              <el-button type="primary" text size="small">查看全部</el-button>
            </el-badge>
          </div>
          <div class="alerts-list">
            <div v-for="alert in alerts" :key="alert.id" class="alert-item" :class="alert.level">
              <div class="alert-icon">
                <el-icon><WarningFilled /></el-icon>
              </div>
              <div class="alert-content">
                <span class="alert-title">{{ alert.title }}</span>
                <span class="alert-time">{{ alert.time }}</span>
              </div>
              <el-button type="primary" text size="small" @click="handleAlert(alert)">处理</el-button>
            </div>
            <el-empty v-if="alerts.length === 0" description="暂无告警" :image-size="60" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { 
  Odometer, CircleCheck, TrendCharts, OfficeBuilding, Trophy, 
  Sunrise, WarningFilled, Top, Bottom, Sunny, Cloudy, Drizzling
} from '@element-plus/icons-vue'

// 使用动态导入避免图标未定义问题
const Lightning = { template: '<svg viewBox="0 0 1024 1024"><path fill="currentColor" d="M288 671.36L544 287.36V480h192L480 864V671.36z"/></svg>' }

defineOptions({ name: 'EnergyMonitor' })

// 核心指标数据
const electricityUsage = ref(45680)
const electricityTrend = ref(-5.2)
const waterUsage = ref(1280)
const waterTrend = ref(3.1)
const carbonEmission = ref(12450)
const solarGeneration = ref(8960)

// 图表配置
const trendTimeRange = ref('day')
const rankingType = ref('electricity')

// 绿色积分
const greenScore = ref(86)
const energySavePoints = ref(320)
const carbonSavePoints = ref(180)
const monthlyRank = ref(3)

const greenScoreColor = computed(() => {
  if (greenScore.value >= 80) return '#10b981'
  if (greenScore.value >= 60) return '#f59e0b'
  return '#ef4444'
})

// 建筑能耗排名
const buildingRanking = ref([
  { name: '教学楼A', value: 12580, percentage: 100 },
  { name: '图书馆', value: 9860, percentage: 78 },
  { name: '实验楼', value: 8540, percentage: 68 },
  { name: '学生宿舍1号楼', value: 7230, percentage: 57 },
  { name: '教学楼B', value: 6150, percentage: 49 },
  { name: '食堂', value: 5320, percentage: 42 }
])

// 节能建议
const energyTips = ref([
  { id: 1, icon: '💡', title: '随手关灯', description: '离开教室时请记得关闭照明设备' },
  { id: 2, icon: '🌡️', title: '空调节能', description: '空调温度夏季不低于26℃，冬季不高于20℃' },
  { id: 3, icon: '💧', title: '节约用水', description: '洗手时请及时关闭水龙头' },
  { id: 4, icon: '🔌', title: '拔掉插头', description: '不使用的电器请拔掉电源插头' }
])

// 告警信息
const alerts = ref([
  { id: 1, title: '教学楼A用电量超标15%', level: 'warning', time: '10分钟前' },
  { id: 2, title: '图书馆空调系统能耗异常', level: 'warning', time: '1小时前' }
])

// 图表引用
const trendChartRef = ref(null)
const electricityChartRef = ref(null)
const waterChartRef = ref(null)
const carbonChartRef = ref(null)
const solarChartRef = ref(null)

const getRankClass = (index) => {
  if (index === 0) return 'gold'
  if (index === 1) return 'silver'
  if (index === 2) return 'bronze'
  return ''
}

const getProgressColor = (percentage) => {
  if (percentage >= 80) return '#ef4444'
  if (percentage >= 60) return '#f59e0b'
  return '#10b981'
}

const handleAlert = (alert) => {
  ElMessage.info(`处理告警: ${alert.title}`)
}

const initCharts = () => {
  // 能耗趋势图
  if (trendChartRef.value) {
    const chart = echarts.init(trendChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['用电量', '用水量', '太阳能发电'], right: 20, top: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
      },
      yAxis: [
        { type: 'value', name: '用电量(kWh)', position: 'left' },
        { type: 'value', name: '用水量(吨)', position: 'right' }
      ],
      series: [
        {
          name: '用电量',
          type: 'line',
          smooth: true,
          data: [1200, 800, 2500, 4800, 3600, 5200, 3100],
          areaStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 158, 11, 0.4)' },
              { offset: 1, color: 'rgba(245, 158, 11, 0.05)' }
            ])
          },
          itemStyle: { color: '#f59e0b' }
        },
        {
          name: '用水量',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          data: [50, 30, 120, 180, 150, 200, 100],
          areaStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ])
          },
          itemStyle: { color: '#3b82f6' }
        },
        {
          name: '太阳能发电',
          type: 'bar',
          data: [0, 0, 200, 580, 620, 450, 100],
          itemStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#10b981' },
              { offset: 1, color: '#34d399' }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    })
  }

  // 小型迷你图表
  const miniChartOption = (data, color) => ({
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { show: false, type: 'category', data: [1, 2, 3, 4, 5, 6, 7] },
    yAxis: { show: false, type: 'value' },
    series: [{
      type: 'line',
      smooth: true,
      symbol: 'none',
      data,
      lineStyle: { color, width: 2 },
      areaStyle: { 
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color.replace(')', ', 0.3)').replace('rgb', 'rgba') },
          { offset: 1, color: 'transparent' }
        ])
      }
    }]
  })

  if (electricityChartRef.value) {
    echarts.init(electricityChartRef.value).setOption(miniChartOption([120, 180, 150, 200, 170, 190, 160], '#f59e0b'))
  }
  if (waterChartRef.value) {
    echarts.init(waterChartRef.value).setOption(miniChartOption([50, 80, 60, 90, 70, 85, 75], '#3b82f6'))
  }
  if (carbonChartRef.value) {
    echarts.init(carbonChartRef.value).setOption(miniChartOption([90, 85, 80, 75, 70, 68, 65], '#6b7280'))
  }
  if (solarChartRef.value) {
    echarts.init(solarChartRef.value).setOption(miniChartOption([100, 150, 200, 280, 260, 220, 180], '#10b981'))
  }
}

onMounted(() => {
  setTimeout(initCharts, 100)
})
</script>

<style scoped>
.energy-monitor-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
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
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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

.header-stats {
  display: flex;
  gap: 16px;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f1f5f9;
  border-radius: 12px;
  font-size: 14px;
  color: #475569;
}

.stat-badge.green {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #059669;
}

/* 核心指标卡片 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.metric-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.metric-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}

.metric-card.electricity .metric-icon {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #f59e0b;
}

.metric-card.water .metric-icon {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #3b82f6;
}

.metric-card.carbon .metric-icon {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #6b7280;
}

.metric-card.solar .metric-icon {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #10b981;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.metric-value .unit {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  margin-left: 4px;
}

.metric-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  margin-top: 8px;
}

.metric-trend.up { color: #ef4444; }
.metric-trend.down { color: #10b981; }

.metric-chart {
  width: 80px;
  height: 40px;
  position: absolute;
  right: 20px;
  bottom: 20px;
}

/* 主内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
}

.left-section, .right-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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
  color: #10b981;
}

/* 趋势图 */
.chart-container {
  height: 280px;
}

/* 建筑排名 */
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
}

.rank-badge {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: #e2e8f0;
  color: #64748b;
}

.rank-badge.gold { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: white; }
.rank-badge.silver { background: linear-gradient(135deg, #94a3b8, #64748b); color: white; }
.rank-badge.bronze { background: linear-gradient(135deg, #f97316, #ea580c); color: white; }

.rank-info {
  flex: 1;
}

.rank-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 6px;
}

.rank-value {
  text-align: right;
}

.rank-value .value {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.rank-value .unit {
  font-size: 12px;
  color: #64748b;
  margin-left: 2px;
}

/* 绿色积分 */
.score-display {
  display: flex;
  gap: 24px;
  align-items: center;
}

.score-ring {
  flex-shrink: 0;
}

.score-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-value {
  font-size: 36px;
  font-weight: 700;
  color: #10b981;
}

.score-label {
  font-size: 14px;
  color: #64748b;
}

.score-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.score-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f0fdf4;
  border-radius: 10px;
}

.item-label {
  color: #64748b;
  font-size: 14px;
}

.item-value {
  font-weight: 600;
  color: #10b981;
}

.text-primary {
  color: #3b82f6 !important;
}

/* 节能建议 */
.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 12px;
}

.tip-icon {
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.tip-content {
  flex: 1;
}

.tip-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #166534;
}

.tip-desc {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #15803d;
}

/* 告警 */
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: #f8fafc;
}

.alert-item.warning {
  background: #fffbeb;
  border-left: 3px solid #f59e0b;
}

.alert-item.error {
  background: #fef2f2;
  border-left: 3px solid #ef4444;
}

.alert-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.alert-content {
  flex: 1;
}

.alert-title {
  display: block;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 2px;
}

.alert-time {
  font-size: 12px;
  color: #64748b;
}

/* 响应式 */
@media (max-width: 1400px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
