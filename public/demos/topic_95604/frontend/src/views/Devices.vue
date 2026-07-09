<template>
  <div class="devices-page">
    <header class="navbar">
      <div class="nav-left">
        <div class="logo-icon">🛡️</div>
        <div class="logo-text"><h1>灾害预警与趋势预测平台</h1><span>智能守护生命安全</span></div>
      </div>
      <nav class="nav-tabs">
        <router-link to="/" class="nav-tab">📊 监控仪表盘</router-link>
        <router-link to="/warnings" class="nav-tab">⚠️ 预警管理</router-link>
        <router-link to="/devices" class="nav-tab active">📡 设备管理</router-link>
        <router-link to="/analysis" class="nav-tab">📈 数据分析</router-link>
        <router-link to="/history" class="nav-tab">📋 历史记录</router-link>
        <router-link to="/settings" class="nav-tab">⚙️ 系统设置</router-link>
      </nav>
      <div class="nav-right"><div class="user-avatar">管</div></div>
    </header>
    <main class="main-content">
      <div class="page-header"><h2>设备管理</h2><button class="btn btn-primary" @click="showAddModal = true">➕ 添加设备</button></div>
      <div class="filters card"><div class="filter-group"><label>设备类型：</label><select v-model="filters.type" class="filter-select"><option value="">全部</option><option value="temperature_humidity">温湿度传感器</option><option value="water_level">水位传感器</option><option value="earthquake">地震传感器</option><option value="fire_detector">火灾探测器</option><option value="camera">摄像头</option></select></div><div class="filter-group"><label>状态：</label><select v-model="filters.status" class="filter-select"><option value="">全部</option><option value="online">在线</option><option value="offline">离线</option></select></div><button class="btn btn-secondary" @click="fetchDevices">🔍 搜索</button><button class="btn btn-secondary" @click="showStats">📊 统计</button></div>
      <div class="devices-grid">
        <div v-for="device in devices" :key="device.id" class="device-card card">
          <div class="device-header"><span class="device-icon">{{ getDeviceIcon(device.type) }}</span><span class="device-status" :class="device.status">{{ device.status }}</span></div>
          <div class="device-name">{{ device.name }}</div>
          <div class="device-id">{{ device.device_id }}</div>
          <div class="device-location">{{ device.location || '未设置位置' }}</div>
          <div class="device-actions"><button class="btn btn-secondary btn-sm" @click="viewDevice(device)">详情</button><button class="btn btn-primary btn-sm" @click="editDevice(device)">编辑</button><button class="btn btn-danger btn-sm" @click="deleteDevice(device.id)">删除</button></div>
        </div>
      </div>
      <div v-if="devices.length === 0" class="empty-state card"><p>暂无设备数据</p></div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const devices = ref([])
const showAddModal = ref(false)
const filters = ref({ type: '', status: '' })

const deviceIcons = { temperature_humidity: '🌡️', water_level: '💧', earthquake: '🌋', fire_detector: '🔥', wind_speed: '🌪️', camera: '📹' }
const getDeviceIcon = (type) => deviceIcons[type] || '📡'

const fetchDevices = async () => {
  try {
    const params = {}
    if (filters.value.type) params.device_type = filters.value.type
    if (filters.value.status) params.status = filters.value.status
    const res = await axios.get('/api/devices/', { params })
    devices.value = res.data
  } catch (error) { console.error('获取设备列表失败:', error) }
}

const viewDevice = (device) => alert(`设备详情: ${device.name}`)
const editDevice = (device) => alert(`编辑设备: ${device.name}`)
const deleteDevice = async (id) => { if (confirm('确定要删除该设备吗？')) { await axios.delete(`/api/devices/${id}`); fetchDevices() } }
const showStats = () => alert('设备统计功能')

onMounted(fetchDevices)
</script>

<style scoped>
.devices-page { min-height: 100vh; }
.navbar { background: linear-gradient(90deg, rgba(30, 58, 95, 0.95), rgba(13, 27, 42, 0.98)); padding: 0 30px; display: flex; justify-content: space-between; align-items: center; height: 70px; border-bottom: 1px solid rgba(0, 212, 255, 0.2); position: fixed; top: 0; left: 0; right: 0; z-index: 1001; }
.nav-left { display: flex; align-items: center; gap: 15px; }
.logo-icon { width: 45px; height: 45px; background: linear-gradient(135deg, #00d4ff, #00ff88); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.logo-text h1 { font-size: 18px; font-weight: 700; background: linear-gradient(90deg, #00d4ff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.logo-text span { font-size: 11px; color: #8b9cb5; }
.nav-tabs { display: flex; gap: 5px; margin-left: 50px; }
.nav-tab { padding: 12px 24px; color: #8b9cb5; font-size: 14px; cursor: pointer; border-radius: 8px; text-decoration: none; transition: all 0.3s; }
.nav-tab:hover { background: rgba(0, 212, 255, 0.1); color: #fff; }
.nav-tab.active { background: rgba(0, 212, 255, 0.2); color: #00d4ff; }
.nav-right { display: flex; align-items: center; gap: 20px; }
.user-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #00d4ff, #00ff88); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; }
.main-content { margin-top: 70px; padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 24px; }
.filters { display: flex; gap: 15px; align-items: center; margin-bottom: 20px; padding: 15px; }
.filter-group { display: flex; align-items: center; gap: 8px; }
.filter-group label { font-size: 14px; color: #8b9cb5; }
.filter-select { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 8px 12px; color: #fff; font-size: 14px; }
.devices-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.device-card { padding: 20px; }
.device-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.device-icon { font-size: 32px; }
.device-status { font-size: 12px; padding: 4px 12px; border-radius: 12px; }
.device-status.online { background: rgba(0, 255, 136, 0.2); color: #00ff88; }
.device-status.offline { background: rgba(255, 71, 87, 0.2); color: #ff4757; }
.device-name { font-size: 18px; font-weight: 600; margin-bottom: 5px; }
.device-id { font-size: 12px; color: #8b9cb5; margin-bottom: 10px; }
.device-location { font-size: 13px; color: #64748b; margin-bottom: 15px; }
.device-actions { display: flex; gap: 8px; }
.btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; transition: all 0.3s; }
.btn-primary { background: linear-gradient(135deg, #00d4ff, #00ff88); color: #000; }
.btn-secondary { background: rgba(255, 255, 255, 0.1); color: #fff; }
.btn-danger { background: rgba(255, 71, 87, 0.2); color: #ff4757; }
.btn-sm { padding: 5px 10px; font-size: 12px; }
.empty-state { text-align: center; padding: 60px 20px; color: #8b9cb5; }
</style>