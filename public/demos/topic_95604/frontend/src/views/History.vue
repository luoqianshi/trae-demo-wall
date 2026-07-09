<template>
  <div class="history-page">
    <header class="navbar">
      <div class="nav-left"><div class="logo-icon">🛡️</div><div class="logo-text"><h1>灾害预警与趋势预测平台</h1><span>智能守护生命安全</span></div></div>
      <nav class="nav-tabs">
        <router-link to="/" class="nav-tab">📊 监控仪表盘</router-link>
        <router-link to="/warnings" class="nav-tab">⚠️ 预警管理</router-link>
        <router-link to="/devices" class="nav-tab">📡 设备管理</router-link>
        <router-link to="/analysis" class="nav-tab">📈 数据分析</router-link>
        <router-link to="/history" class="nav-tab active">📋 历史记录</router-link>
        <router-link to="/settings" class="nav-tab">⚙️ 系统设置</router-link>
      </nav>
      <div class="nav-right"><div class="user-avatar">管</div></div>
    </header>
    <main class="main-content">
      <div class="page-header"><h2>历史记录</h2><button class="btn btn-primary" @click="exportReport">📤 导出报表</button></div>
      <div class="filters card">
        <div class="filter-group"><label>开始日期：</label><input type="date" v-model="filters.startDate" class="date-input"></div>
        <div class="filter-group"><label>结束日期：</label><input type="date" v-model="filters.endDate" class="date-input"></div>
        <div class="filter-group"><label>关键词：</label><input type="text" v-model="filters.keyword" placeholder="搜索预警..." class="search-input"></div>
        <button class="btn btn-secondary" @click="searchHistory">🔍 搜索</button>
      </div>
      <div class="card table-card">
        <table class="table">
          <thead><tr><th>时间</th><th>预警标题</th><th>类型</th><th>等级</th><th>位置</th><th>处理结果</th></tr></thead>
          <tbody>
            <tr v-for="item in historyList" :key="item.id">
              <td>{{ item.time }}</td>
              <td>{{ item.title }}</td>
              <td>{{ item.type }}</td>
              <td><span class="badge" :class="'badge-' + item.level">{{ item.levelText }}</span></td>
              <td>{{ item.location }}</td>
              <td><span class="result-text">{{ item.result }}</span></td>
            </tr>
          </tbody>
        </table>
        <div class="pagination">
          <button class="page-btn" @click="prevPage">«</button>
          <button v-for="p in 5" :key="p" class="page-btn" :class="{ active: p === currentPage }" @click="goToPage(p)">{{ p }}</button>
          <button class="page-btn" @click="nextPage">»</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const currentPage = ref(1)
const filters = ref({ startDate: '', endDate: '', keyword: '' })
const historyList = ref([
  { id: 1, time: '2024-01-15 14:30', title: '森林火灾预警', type: '火灾', level: 'red', levelText: '红色', location: '云南·昆明', result: '已扑灭' },
  { id: 2, time: '2024-01-15 10:20', title: '山洪预警', type: '洪水', level: 'orange', levelText: '橙色', location: '浙江·杭州', result: '已疏散' },
  { id: 3, time: '2024-01-14 16:45', title: '地质灾害预警', type: '滑坡', level: 'yellow', levelText: '黄色', location: '福建·厦门', result: '已加固' },
  { id: 4, time: '2024-01-14 09:15', title: '台风预警', type: '台风', level: 'blue', levelText: '蓝色', location: '广东·深圳', result: '已监测' },
  { id: 5, time: '2024-01-13 18:00', title: '干旱预警', type: '干旱', level: 'orange', levelText: '橙色', location: '甘肃·兰州', result: '已响应' }
])

const searchHistory = () => alert('搜索功能')
const exportReport = () => alert('正在导出报表...')
const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < 5) currentPage.value++ }
const goToPage = (p) => { currentPage.value = p }
</script>

<style scoped>
.history-page { min-height: 100vh; }
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
.filters { display: flex; gap: 15px; align-items: center; margin-bottom: 20px; padding: 15px; flex-wrap: wrap; }
.filter-group { display: flex; align-items: center; gap: 8px; }
.filter-group label { font-size: 14px; color: #8b9cb5; }
.date-input, .search-input { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 8px 12px; color: #fff; font-size: 14px; }
.table-card { padding: 20px; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.table th { color: #8b9cb5; font-weight: 600; font-size: 13px; }
.badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; }
.badge-red { background: rgba(255, 71, 87, 0.2); color: #ff4757; }
.badge-orange { background: rgba(255, 165, 2, 0.2); color: #ffa502; }
.badge-yellow { background: rgba(255, 211, 42, 0.2); color: #ffd32a; }
.badge-blue { background: rgba(0, 212, 255, 0.2); color: #00d4ff; }
.result-text { color: #00ff88; }
.pagination { display: flex; justify-content: center; gap: 5px; margin-top: 20px; }
.page-btn { width: 36px; height: 36px; border-radius: 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; cursor: pointer; }
.page-btn.active { background: rgba(0, 212, 255, 0.2); border-color: #00d4ff; color: #00d4ff; }
.btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; transition: all 0.3s; }
.btn-primary { background: linear-gradient(135deg, #00d4ff, #00ff88); color: #000; }
.btn-secondary { background: rgba(255, 255, 255, 0.1); color: #fff; }
</style>