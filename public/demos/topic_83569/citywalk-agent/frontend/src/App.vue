<template>
  <div class="app">
    <header class="header">
      <h1>🗺️ Citywalk 路线规划</h1>
      <p class="subtitle">粘贴攻略文字，AI 帮你规划最佳路线</p>
    </header>

    <div class="main-content">
      <div class="sidebar">
        <div class="step-card">
          <div class="step-title"><span class="step-num">1</span>选择城市</div>
          <select v-model="city" class="city-select">
            <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div class="step-card">
          <div class="step-title"><span class="step-num">2</span>添加地点</div>
          
          <div class="mode-tabs">
            <button :class="['mode-tab', { active: mode === 'text' }]" @click="mode = 'text'">📝 粘贴攻略</button>
            <button :class="['mode-tab', { active: mode === 'manual' }]" @click="mode = 'manual'">➕ 手动添加</button>
          </div>

          <div v-if="mode === 'text'" class="text-input-area">
            <textarea 
              v-model="guideText" 
              class="guide-textarea" 
              placeholder="粘贴小红书/抖音攻略文字...
例如：
上海巨富长Citywalk路线：
1. 常熟路地铁站出发
2. GOODBAI CAFE 打卡
3. 巨鹿路逛小店
4. 武康大楼拍照"
              rows="10"
            ></textarea>
            <button class="analyze-btn" :disabled="loading || !guideText.trim()" @click="analyzeText">
              <span v-if="loading">⏳ AI分析中...</span>
              <span v-else>🔍 识别地点 ({{ city }})</span>
            </button>
            <p v-if="!llmAvailable" class="hint-text">
              ⚠️ Ollama未启动，使用规则解析（准确度较低）
            </p>
          </div>

          <div v-if="mode === 'manual'" class="manual-input-area">
            <div class="add-place-row">
              <input 
                v-model="newPlaceName" 
                class="place-input"
                placeholder="输入地点名称，如：巨鹿路"
                @keyup.enter="addManualPlace"
              >
              <button class="add-btn" @click="addManualPlace">添加</button>
            </div>
            <p class="hint-text">输入地点名，按回车快速添加</p>
          </div>
        </div>

        <div v-if="places.length > 0" class="step-card">
          <div class="step-title">
            <span class="step-num">3</span>路线安排
            <span class="place-count">{{ places.length }}个地点</span>
          </div>

          <div class="route-summary">
            <div class="summary-item">
              <span class="summary-icon">⏱️</span>
              <span>总时长 {{ formatDuration(totalDuration) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-icon">📍</span>
              <span>约 {{ totalDistance }} km</span>
            </div>
          </div>

          <div class="action-row">
            <button class="opt-btn" @click="optimizeRoute">✨ 智能优化路线</button>
          </div>

          <div class="places-list">
            <div 
              v-for="(place, index) in places" 
              :key="index"
              class="place-item"
              :class="{ active: selectedIndex === index }"
              draggable="true"
              @dragstart="dragStart(index)"
              @dragover.prevent
              @drop="dragEnd(index)"
              @click="selectPlace(index)"
            >
              <div class="place-left">
                <span class="place-index">{{ index + 1 }}</span>
                <div class="place-info">
                  <div class="place-name">{{ place.name }}</div>
                  <div class="place-meta">
                    <span class="place-type">{{ typeLabel(place.type) }}</span>
                    <span class="place-duration">⏱ {{ place.duration_minutes }}分钟</span>
                  </div>
                  <div v-if="place.features && place.features.length" class="place-features">
                    <span v-for="f in place.features.slice(0,2)" :key="f" class="feature-tag">{{ f }}</span>
                  </div>
                </div>
              </div>
              <div class="place-right">
                <button class="img-btn" @click.stop="addImage(index)" title="添加图片">
                  {{ place.image ? '🖼️' : '📷' }}
                </button>
                <button class="remove-btn" @click.stop="removePlace(index)" title="移除">✕</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="map-section">
        <div id="map" class="map"></div>
        
        <div v-if="selectedPlace" class="place-detail-card">
          <div class="detail-header">
            <h3>{{ selectedPlace.name }}</h3>
            <button class="close-detail" @click="selectedIndex = -1">✕</button>
          </div>
          <div class="detail-body">
            <p class="detail-address">📍 {{ selectedPlace.address }}</p>
            <div class="detail-row">
              <span class="detail-label">类型</span>
              <span class="detail-value">{{ typeLabel(selectedPlace.type) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">建议时长</span>
              <span class="detail-value">{{ selectedPlace.duration_minutes }}分钟</span>
            </div>
            <div v-if="selectedPlace.features && selectedPlace.features.length" class="detail-features">
              <span class="detail-label">亮点</span>
              <div class="feature-list">
                <span v-for="f in selectedPlace.features" :key="f" class="feature-tag">{{ f }}</span>
              </div>
            </div>
            <div v-if="selectedPlace.raw" class="detail-raw">
              <span class="detail-label">原文</span>
              <p class="raw-text">"{{ selectedPlace.raw }}"</p>
            </div>
            <div v-if="selectedPlace.image" class="detail-image">
              <span class="detail-label">相关图片</span>
              <img :src="selectedPlace.image" class="place-image" @click="previewImage">
            </div>
          </div>
        </div>
      </div>
    </div>

    <input type="file" ref="imageInput" accept="image/*" class="hidden-input" @change="handleImageSelect">
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import axios from 'axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const cities = ref(['上海', '北京', '广州', '深圳', '杭州', '南京', '成都', '重庆', '苏州', '武汉', '西安', '长沙', '厦门', '青岛', '大理', '丽江', '三亚', '拉萨'])
const city = ref('上海')
const mode = ref('text')
const guideText = ref('')
const newPlaceName = ref('')
const places = ref([])
const loading = ref(false)
const llmAvailable = ref(false)
const totalDuration = ref(0)
const totalDistance = ref(0)
const selectedIndex = ref(-1)
const imageInput = ref(null)
let currentImageIndex = -1

let map = null
let markers = []
let polyline = null

const selectedPlace = ref(null)

watch(selectedIndex, (idx) => {
  selectedPlace.value = idx >= 0 ? places.value[idx] : null
  if (idx >= 0 && markers[idx]) {
    map.setView(markers[idx].getLatLng(), 15)
    markers[idx].openPopup()
  }
})

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}小时${m}分钟`
  if (h > 0) return `${h}小时`
  return `${m}分钟`
}

function typeLabel(type) {
  const labels = {
    scenic: '🏛️ 景点',
    cafe: '☕ 咖啡馆',
    shop: '🛍️ 商店',
    restaurant: '🍽️ 餐厅',
    road: '🚶 道路',
    subway: '🚇 地铁',
    other: '📍 其他'
  }
  return labels[type] || '📍 其他'
}

async function analyzeText() {
  if (!guideText.value.trim()) return
  
  loading.value = true
  try {
    const response = await axios.post('/api/analyze-text', {
      text: guideText.value,
      city: city.value
    })
    
    if (response.data.success) {
      places.value = response.data.places
      totalDuration.value = response.data.total_duration_minutes
      totalDistance.value = response.data.total_distance_km
      llmAvailable.value = response.data.llm_available
      
      await nextTick()
      updateMap()
    }
  } catch (error) {
    console.error('分析失败:', error)
    alert('分析失败，请重试')
  } finally {
    loading.value = false
  }
}

function addManualPlace() {
  const name = newPlaceName.value.trim()
  if (!name) return
  
  places.value.push({
    name,
    type: 'shop',
    address: `${city.value}（待定位）`,
    latitude: null,
    longitude: null,
    duration_minutes: 60,
    features: [],
    raw: '',
    image: null,
    source: 'manual'
  })
  
  newPlaceName.value = ''
  recalcRoute()
}

function removePlace(index) {
  places.value.splice(index, 1)
  if (selectedIndex.value === index) {
    selectedIndex.value = -1
  } else if (selectedIndex.value > index) {
    selectedIndex.value--
  }
  recalcRoute()
}

async function optimizeRoute() {
  if (places.value.length < 2) return
  
  try {
    const response = await axios.post('/api/optimize-route', {
      places: places.value,
      start_index: 0
    })
    
    if (response.data.success) {
      places.value = response.data.places
      totalDuration.value = response.data.total_duration_minutes
      totalDistance.value = response.data.total_distance_km
      selectedIndex.value = -1
      updateMap()
    }
  } catch (error) {
    console.error('优化失败:', error)
  }
}

function recalcRoute() {
  totalDuration.value = places.value.reduce((sum, p) => sum + (p.duration_minutes || 60), 0)
  
  let dist = 0
  const located = places.value.filter(p => p.latitude && p.longitude)
  for (let i = 0; i < located.length - 1; i++) {
    const a = located[i]
    const b = located[i + 1]
    const R = 6371
    const dLat = (b.latitude - a.latitude) * Math.PI / 180
    const dLng = (b.longitude - a.longitude) * Math.PI / 180
    const la1 = a.latitude * Math.PI / 180
    const la2 = b.latitude * Math.PI / 180
    const x = Math.sin(dLat/2)**2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng/2)**2
    dist += R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
  }
  totalDistance.value = dist.toFixed(2)
  
  updateMap()
}

let dragFrom = -1
function dragStart(index) {
  dragFrom = index
}
function dragEnd(index) {
  if (dragFrom === index || dragFrom < 0) return
  const item = places.value.splice(dragFrom, 1)[0]
  places.value.splice(index, 0, item)
  dragFrom = -1
  selectedIndex.value = index
  recalcRoute()
}

function selectPlace(index) {
  selectedIndex.value = selectedIndex.value === index ? -1 : index
}

function addImage(index) {
  currentImageIndex = index
  imageInput.value.click()
}

function handleImageSelect(e) {
  const file = e.target.files[0]
  if (!file || currentImageIndex < 0) return
  
  const reader = new FileReader()
  reader.onload = (ev) => {
    places.value[currentImageIndex].image = ev.target.result
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

function previewImage() {
  if (selectedPlace.value && selectedPlace.value.image) {
    const win = window.open()
    win.document.write(`<img src="${selectedPlace.value.image}" style="max-width:100%">`)
  }
}

function initMap() {
  map = L.map('map').setView([31.2304, 121.4737], 12)
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map)
}

function getMarkerColor(index) {
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']
  return colors[index % colors.length]
}

function updateMap() {
  if (!map) return
  
  markers.forEach(m => map.removeLayer(m))
  markers = []
  if (polyline) {
    map.removeLayer(polyline)
    polyline = null
  }
  
  const located = []
  
  places.value.forEach((place, index) => {
    if (place.latitude && place.longitude) {
      const color = getMarkerColor(index)
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${color};color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${index + 1}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
      
      const marker = L.marker([place.latitude, place.longitude], { icon })
        .addTo(map)
        .bindPopup(`<b>${index + 1}. ${place.name}</b><br>${place.address || ''}`)
        .on('click', () => {
          selectedIndex.value = index
        })
      
      markers.push(marker)
      located.push([place.latitude, place.longitude])
    }
  })
  
  if (located.length > 1) {
    polyline = L.polyline(located, {
      color: '#3b82f6',
      weight: 3,
      opacity: 0.6,
      dashArray: '10, 10'
    }).addTo(map)
  }
  
  if (located.length > 0) {
    const bounds = L.latLngBounds(located)
    map.fitBounds(bounds, { padding: [50, 50] })
  }
}

onMounted(() => {
  initMap()
  axios.get('/api/health').then(r => {
    llmAvailable.value = r.data.llm_available
  })
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f8fafc;
}

.app {
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  padding: 20px 30px;
  text-align: center;
}

.header h1 {
  font-size: 24px;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 13px;
  opacity: 0.9;
}

.main-content {
  display: flex;
  height: calc(100vh - 80px);
}

.sidebar {
  width: 420px;
  padding: 20px;
  overflow-y: auto;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
}

.step-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.step-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 15px;
  color: #1e293b;
  margin-bottom: 12px;
}

.step-num {
  background: #3b82f6;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.place-count {
  margin-left: auto;
  font-size: 12px;
  color: #64748b;
  font-weight: normal;
}

.city-select {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: white;
}

.city-select:focus {
  border-color: #3b82f6;
}

.mode-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.mode-tab {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-tab.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 600;
}

.guide-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  outline: none;
  margin-bottom: 10px;
}

.guide-textarea:focus {
  border-color: #3b82f6;
}

.analyze-btn {
  width: 100%;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.analyze-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hint-text {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 8px;
  text-align: center;
}

.manual-input-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.add-place-row {
  display: flex;
  gap: 8px;
}

.place-input {
  flex: 1;
  padding: 10px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}

.place-input:focus {
  border-color: #3b82f6;
}

.add-btn {
  padding: 10px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.route-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.summary-item {
  flex: 1;
  background: #f1f5f9;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  font-size: 13px;
  color: #475569;
}

.summary-icon {
  margin-right: 4px;
}

.action-row {
  margin-bottom: 12px;
}

.opt-btn {
  width: 100%;
  padding: 10px;
  background: #ecfdf5;
  color: #059669;
  border: 2px solid #10b981;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.places-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.place-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s;
}

.place-item:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.place-item.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.place-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.place-index {
  background: #3b82f6;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.place-info {
  flex: 1;
  min-width: 0;
}

.place-name {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.place-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
}

.place-type {
  background: #e2e8f0;
  padding: 1px 6px;
  border-radius: 4px;
}

.place-features {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.feature-tag {
  font-size: 10px;
  padding: 1px 6px;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 4px;
}

.place-right {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.img-btn, .remove-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.img-btn {
  background: #fef3c7;
}

.remove-btn {
  background: #fee2e2;
  color: #dc2626;
}

.map-section {
  flex: 1;
  position: relative;
}

.map {
  width: 100%;
  height: 100%;
}

.place-detail-card {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  overflow: hidden;
  z-index: 1000;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
}

.detail-header h3 {
  font-size: 16px;
  font-weight: 600;
}

.close-detail {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
}

.detail-body {
  padding: 14px 16px;
  max-height: 400px;
  overflow-y: auto;
}

.detail-address {
  font-size: 13px;
  color: #475569;
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}

.detail-label {
  color: #64748b;
  font-size: 12px;
}

.detail-value {
  color: #1e293b;
  font-weight: 500;
}

.detail-features {
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.feature-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.detail-raw {
  padding: 10px 0;
}

.raw-text {
  margin-top: 6px;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 12px;
  color: #64748b;
  font-style: italic;
  line-height: 1.5;
}

.detail-image {
  padding: 10px 0;
}

.place-image {
  width: 100%;
  border-radius: 8px;
  margin-top: 8px;
  cursor: pointer;
}

.hidden-input {
  display: none;
}

.custom-marker {
  background: none !important;
  border: none !important;
}
</style>
