<template>
  <div class="warnings-page">
    <header class="navbar">
      <div class="nav-left">
        <div class="logo-icon">🛡️</div>
        <div class="logo-text">
          <h1>灾害预警与趋势预测平台</h1>
          <span>智能守护生命安全</span>
        </div>
      </div>
      <nav class="nav-tabs">
        <router-link to="/" class="nav-tab">📊 监控仪表盘</router-link>
        <router-link to="/warnings" class="nav-tab active">⚠️ 预警管理</router-link>
        <router-link to="/devices" class="nav-tab">📡 设备管理</router-link>
        <router-link to="/analysis" class="nav-tab">📈 数据分析</router-link>
        <router-link to="/history" class="nav-tab">📋 历史记录</router-link>
        <router-link to="/settings" class="nav-tab">⚙️ 系统设置</router-link>
      </nav>
      <div class="nav-right">
        <div class="user-avatar">管</div>
      </div>
    </header>
    
    <main class="main-content">
      <div class="page-header">
        <h2>预警管理</h2>
        <button class="btn btn-primary" @click="showCreateModal = true">➕ 创建预警</button>
      </div>
      
      <div class="filters card">
        <div class="filter-group">
          <label>预警等级：</label>
          <select v-model="filters.level" class="filter-select">
            <option value="">全部</option>
            <option value="red">红色</option>
            <option value="orange">橙色</option>
            <option value="yellow">黄色</option>
            <option value="blue">蓝色</option>
          </select>
        </div>
        <div class="filter-group">
          <label>预警类型：</label>
          <select v-model="filters.type" class="filter-select">
            <option value="">全部</option>
            <option value="fire">火灾</option>
            <option value="flood">洪水</option>
            <option value="earthquake">地震</option>
            <option value="typhoon">台风</option>
            <option value="drought">干旱</option>
          </select>
        </div>
        <div class="filter-group">
          <label>处理状态：</label>
          <select v-model="filters.status" class="filter-select">
            <option value="">全部</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="resolved">已解决</option>
          </select>
        </div>
        <button class="btn btn-secondary" @click="fetchWarnings">🔍 搜索</button>
      </div>
      
      <div class="card table-card">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>预警标题</th>
              <th>等级</th>
              <th>类型</th>
              <th>位置</th>
              <th>状态</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="warning in warnings" :key="warning.id">
              <td>{{ warning.id }}</td>
              <td>{{ warning.title }}</td>
              <td><span class="badge" :class="'badge-' + warning.level">{{ getLevelText(warning.level) }}</span></td>
              <td>{{ getTypeText(warning.type) }}</td>
              <td>{{ warning.location || '-' }}</td>
              <td><span class="badge" :class="getStatusClass(warning.status)">{{ getStatusText(warning.status) }}</span></td>
              <td>{{ formatTime(warning.created_at) }}</td>
              <td>
                <button class="btn btn-secondary btn-sm" @click="viewDetail(warning)">详情</button>
                <button v-if="warning.status === 'pending'" class="btn btn-primary btn-sm" @click="handleWarning(warning.id)">处理</button>
                <button class="btn btn-danger btn-sm" @click="deleteWarning(warning.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div class="pagination">
          <button class="page-btn" @click="prevPage">«</button>
          <button v-for="p in totalPages" :key="p" class="page-btn" :class="{ active: p === currentPage }" @click="goToPage(p)">{{ p }}</button>
          <button class="page-btn" @click="nextPage">»</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const warnings = ref([])
const showCreateModal = ref(false)
const currentPage = ref(1)
const totalPages = ref(5)
const filters = ref({ level: '', type: '', status: '' })

const levelText = { red: '红色', orange: '橙色', yellow: '黄色', blue: '蓝色' }
const typeText = { fire: '火灾', flood: '洪水', earthquake: '地震', typhoon: '台风', drought: '干旱', landslide: '滑坡' }
const statusText = { pending: '待处理', processing: '处理中', resolved: '已解决', dismissed: '已忽略' }
const statusClass = { pending: 'badge-yellow', processing: 'badge-orange', resolved: 'badge-green', dismissed: 'badge-blue' }

const getLevelText = (level) => levelText[level] || level
const getTypeText = (type) => typeText[type] || type
const getStatusText = (status) => statusText[status] || status
const getStatusClass = (status) => statusClass[status] || 'badge-blue'
const formatTime = (time) => new Date(time).toLocaleString('zh-CN')

const fetchWarnings = async () => {
  try {
    const params = { skip: (currentPage.value - 1) * 10, limit: 10 }
    if (filters.value.level) params.level = filters.value.level
    if (filters.value.type) params.warning_type = filters.value.type
    if (filters.value.status) params.status = filters.value.status
    const res = await axios.get('/api/warnings/', { params })
    warnings.value = res.data
  } catch (error) {
    console.error('获取预警列表失败:', error)
  }
}

const viewDetail = (warning) => alert(`预警详情: ${warning.title}`)
const handleWarning = async (id) => {
  await axios.put(`/api/warnings/${id}`, { status: 'processing' })
  fetchWarnings()
}
const deleteWarning = async (id) => {
  if (confirm('确定要删除这条预警吗？')) {
    await axios.delete(`/api/warnings/${id}`)
    fetchWarnings()
  }
}
const prevPage = () => { if (currentPage.value > 1) { currentPage.value--; fetchWarnings() } }
const nextPage = () => { if (currentPage.value < totalPages.value) { currentPage.value++; fetchWarnings() } }
const goToPage = (p) => { currentPage.value = p; fetchWarnings() }

onMounted(fetchWarnings)
</script>

<style scoped>
.warnings-page { min-height: 100vh; }
.navbar { background: linear-gradient(90deg, rgba(30, 58, 95, 0.95), rgba(13, 27, 42, 0.98)); padding: 0 30px; display: flex; justify-content: space-between; align-items: center; height: 70px; border-bottom: 1px solid rgba(0, 212, 255, 0.2); position: fixed; top: 0; left: 0; right: 0; z-index: 1001; }
.nav-left { display: flex; align-items: center; gap: 15px; }
.logo-icon { width: 45px; height: 45px; background: linear-gradient(135deg, #00d4ff, #00ff88); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.logo-text h1 { font-size: 18px; font-weight: 700; background: linear-gradient(90deg, #00d4ff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.logo-text span { font-size: 11px; color: #8b9cb5; }
.nav-tabs { display: flex; gap: 5px; margin-left: 50px; }
.nav-tab { padding: 12px 24px; background: transparent; border: none; color: #8b9cb5; font-size: 14px; cursor: pointer; border-radius: 8px; text-decoration: none; transition: all 0.3s; }
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
.table-card { padding: 20px; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.table th { color: #8b9cb5; font-weight: 600; font-size: 13px; }
.btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; transition: all 0.3s; margin-right: 5px; }
.btn-primary { background: linear-gradient(135deg, #00d4ff, #00ff88); color: #000; }
.btn-secondary { background: rgba(255, 255, 255, 0.1); color: #fff; }
.btn-danger { background: rgba(255, 71, 87, 0.2); color: #ff4757; }
.btn-sm { padding: 5px 10px; font-size: 12px; }
.badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; }
.badge-red { background: rgba(255, 71, 87, 0.2); color: #ff4757; }
.badge-orange { background: rgba(255, 165, 2, 0.2); color: #ffa502; }
.badge-yellow { background: rgba(255, 211, 42, 0.2); color: #ffd32a; }
.badge-blue { background: rgba(0, 212, 255, 0.2); color: #00d4ff; }
.badge-green { background: rgba(0, 255, 136, 0.2); color: #00ff88; }
.pagination { display: flex; justify-content: center; gap: 5px; margin-top: 20px; }
.page-btn { width: 36px; height: 36px; border-radius: 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; cursor: pointer; }
.page-btn.active { background: rgba(0, 212, 255, 0.2); border-color: #00d4ff; color: #00d4ff; }
</style>
