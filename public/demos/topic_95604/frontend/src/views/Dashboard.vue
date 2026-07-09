<template>
  <div class="page active">
    <div class="dashboard-grid">
      <!-- 左侧统计面板 -->
      <div style="display: flex; flex-direction: column; gap: 15px;">
        <div class="card">
          <div class="card-title">实时监控数据</div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📡</div>
              <div class="stat-value">{{ stats.onlineDevices.toLocaleString() }}</div>
              <div class="stat-label">在线设备</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⚠️</div>
              <div class="stat-value">{{ stats.activeWarnings }}</div>
              <div class="stat-label">活跃预警</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📊</div>
              <div class="stat-value">{{ stats.onlineRate }}%</div>
              <div class="stat-label">在线率</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🗺️</div>
              <div class="stat-value">{{ stats.monitoringAreas }}</div>
              <div class="stat-label">监测区域</div>
            </div>
          </div>
        </div>
        
        <!-- 实时预警列表 -->
        <div class="card" style="flex: 1; overflow: hidden;">
          <div class="card-title">实时预警信息</div>
          <div class="warning-list">
            <div v-for="warning in recentWarnings" :key="warning.id" 
                 class="warning-item" 
                 :class="'level-' + getLevelNumber(warning.level)"
                 @click="focusOnLocation(warning.latitude, warning.longitude)">
              <div class="warning-header">
                <span class="warning-title">{{ getWarningIcon(warning.type) }} {{ warning.title }}</span>
                <span class="warning-badge" :class="'level-' + getLevelNumber(warning.level)">
                  {{ getLevelName(warning.level) }}
                </span>
              </div>
              <div class="warning-desc">{{ warning.description }}</div>
              <div class="warning-meta">
                <span>📍 {{ warning.location }}</span>
                <span>⏱️ {{ formatTime(warning.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 实时数据流 -->
        <div class="card">
          <div class="card-title">实时数据流</div>
          <div class="feed-list">
            <div v-for="(feed, index) in feeds" :key="index" 
                 class="feed-item" 
                 :class="'type-' + feed.type">
              <span class="feed-time">{{ feed.time }}</span>
              <span class="feed-content">{{ feed.content }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 中间地图区域 -->
      <div class="map-wrapper">
        <div class="map-container">
          <div id="map"></div>
          <div class="map-overlay">
            <div class="map-control active" @click="toggleLayer('sensors')">
              <span>📡</span> 传感器
            </div>
            <div class="map-control active" @click="toggleLayer('warnings')">
              <span>⚠️</span> 预警点
            </div>
          </div>
          <div class="map-legend">
            <div class="legend-title">预警等级</div>
            <div class="legend-item"><div class="legend-color" style="background: #ff4757;"></div><span>红色 - 特别严重</span></div>
            <div class="legend-item"><div class="legend-color" style="background: #ffa502;"></div><span>橙色 - 严重</span></div>
            <div class="legend-item"><div class="legend-color" style="background: #ffd32a;"></div><span>黄色 - 较重</span></div>
            <div class="legend-item"><div class="legend-color" style="background: #00d4ff;"></div><span>蓝色 - 一般</span></div>
          </div>
        </div>
        <div class="chart-row">
          <div class="chart-card card">
            <div class="card-title">传感器数据趋势（24小时）</div>
            <div class="chart-container">
              <canvas ref="trendChartRef"></canvas>
            </div>
          </div>
          <div class="chart-card card">
            <div class="card-title">灾害类型分布</div>
            <div class="chart-container">
              <canvas ref="pieChartRef"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧面板 -->
      <div style="display: flex; flex-direction: column; gap: 15px;">
        <div class="card">
          <div class="card-title">设备状态监控</div>
          <div class="device-grid">
            <div v-for="device in deviceStatus" :key="device.type" class="device-card">
              <div class="device-icon">{{ device.icon }}</div>
              <div class="device-name">{{ device.name }}</div>
              <span class="device-status" :class="device.status">
                {{ device.status === 'online' ? '在线 ' : '离线 ' }}{{ device.count }}
              </span>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">灾害趋势预测</div>
          <div class="prediction-grid">
            <div v-for="pred in predictions" :key="pred.type" class="prediction-card">
              <div class="prediction-icon">{{ pred.icon }}</div>
              <div class="prediction-value" :class="pred.level">{{ pred.value }}%</div>
              <div class="prediction-label">{{ pred.label }}</div>
              <div class="prediction-bar">
                <div class="prediction-bar-fill" :style="{ width: pred.value + '%', background: pred.gradient }"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">区域风险分布</div>
          <div class="chart-container" style="height: 180px;">
            <canvas ref="riskChartRef"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref, reactive } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Chart from 'chart.js/auto'
import axios from 'axios'

export default {
  name: 'Dashboard',
  setup() {
    const trendChartRef = ref(null)
    const pieChartRef = ref(null)
    const riskChartRef = ref(null)
    
    const stats = reactive({
      onlineDevices: 1284,
      activeWarnings: 23,
      onlineRate: 98.5,
      monitoringAreas: 12
    })
    
    const recentWarnings = ref([])
    const feeds = ref([
      { time: '12:34', type: 'sensor', content: '温湿度传感器 #A1024 上报数据' },
      { time: '12:33', type: 'system', content: '水位传感器 #B2031 状态正常' },
      { time: '12:32', type: 'warning', content: '地震传感器检测到微震 2.1级' }
    ])
    
    const deviceStatus = ref([
      { type: 'temp', icon: '🌡️', name: '温湿度传感器', status: 'online', count: 128 },
      { type: 'quake', icon: '📡', name: '地震传感器', status: 'online', count: 32 },
      { type: 'water', icon: '💧', name: '水位传感器', status: 'online', count: 56 },
      { type: 'fire', icon: '🔥', name: '火灾探测器', status: 'online', count: 89 },
      { type: 'camera', icon: '📷', name: '监控摄像头', status: 'online', count: 245 },
      { type: 'wind', icon: '🌪️', name: '风速传感器', status: 'offline', count: 3 }
    ])
    
    const predictions = ref([
      { type: 'flood', icon: '🌧️', label: '洪水风险', value: 78, level: 'high', gradient: 'linear-gradient(90deg, #ff4757, #ffa502)' },
      { type: 'landslide', icon: '🏔️', label: '滑坡风险', value: 45, level: 'medium', gradient: 'linear-gradient(90deg, #ffa502, #ffd32a)' },
      { type: 'fire', icon: '🔥', label: '火灾风险', value: 62, level: 'high', gradient: 'linear-gradient(90deg, #ff4757, #ffa502)' },
      { type: 'typhoon', icon: '🌪️', label: '台风风险', value: 33, level: 'low', gradient: 'linear-gradient(90deg, #00ff88, #00d4ff)' },
      { type: 'earthquake', icon: '🌋', label: '地震风险', value: 12, level: 'low', gradient: 'linear-gradient(90deg, #00ff88, #00d4ff)' },
      { type: 'debris', icon: '🌊', label: '泥石流风险', value: 55, level: 'medium', gradient: 'linear-gradient(90deg, #ffa502, #ffd32a)' }
    ])
    
    let map = null
    let charts = {}
    
    const getLevelNumber = (level) => {
      const map = { red: 1, orange: 2, yellow: 3, blue: 4 }
      return map[level] || 4
    }
    
    const getLevelName = (level) => {
      const map = { red: '红色', orange: '橙色', yellow: '黄色', blue: '蓝色' }
      return map[level] || '蓝色'
    }
    
    const getWarningIcon = (type) => {
      const map = { fire: '🔥', flood: '💧', earthquake: '🌋', landslide: '⛰️', typhoon: '🌪️' }
      return map[type] || '⚠️'
    }
    
    const formatTime = (time) => {
      return time ? new Date(time).toLocaleString() : ''
    }
    
    const focusOnLocation = (lat, lng) => {
      if (map) {
        map.flyTo([lat, lng], 10, { duration: 1.5 })
      }
    }
    
    const toggleLayer = (layer) => {
      // 图层切换逻辑
    }
    
    const initMap = () => {
      map = L.map('map', { center: [35.0, 105.0], zoom: 5, zoomControl: false })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap, © CARTO',
        maxZoom: 18
      }).addTo(map)
    }
    
    const initCharts = () => {
      // 初始化图表
      if (trendChartRef.value) {
        charts.trend = new Chart(trendChartRef.value.getContext('2d'), {
          type: 'line',
          data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
            datasets: [
              { label: '温度(°C)', data: [22, 24, 28, 32, 30, 26, 24], borderColor: '#ff6b6b', tension: 0.4 },
              { label: '湿度(%)', data: [65, 60, 55, 50, 55, 62, 65], borderColor: '#00d4ff', tension: 0.4 }
            ]
          },
          options: { responsive: true, maintainAspectRatio: false }
        })
      }
    }
    
    onMounted(async () => {
      initMap()
      initCharts()
      
      // 从 API 获取数据
      try {
        const response = await axios.get('/api/v1/analysis/statistics/overview')
        if (response.data) {
          stats.onlineDevices = response.data.total_devices || stats.onlineDevices
          stats.activeWarnings = response.data.active_warnings || stats.activeWarnings
        }
      } catch (error) {
        console.error('获取数据失败:', error)
      }
    })
    
    return {
      trendChartRef,
      pieChartRef,
      riskChartRef,
      stats,
      recentWarnings,
      feeds,
      deviceStatus,
      predictions,
      getLevelNumber,
      getLevelName,
      getWarningIcon,
      formatTime,
      focusOnLocation,
      toggleLayer
    }
  }
}
</script>

<style scoped>
/* Dashboard 组件样式 */
</style>
