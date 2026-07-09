<template>
  <div class="analysis-page">
    <header class="navbar">
      <div class="nav-left"><div class="logo-icon">🛡️</div><div class="logo-text"><h1>灾害预警与趋势预测平台</h1><span>智能守护生命安全</span></div></div>
      <nav class="nav-tabs">
        <router-link to="/" class="nav-tab">📊 监控仪表盘</router-link>
        <router-link to="/warnings" class="nav-tab">⚠️ 预警管理</router-link>
        <router-link to="/devices" class="nav-tab">📡 设备管理</router-link>
        <router-link to="/analysis" class="nav-tab active">📈 数据分析</router-link>
        <router-link to="/history" class="nav-tab">📋 历史记录</router-link>
        <router-link to="/settings" class="nav-tab">⚙️ 系统设置</router-link>
      </nav>
      <div class="nav-right"><div class="user-avatar">管</div></div>
    </header>
    <main class="main-content">
      <div class="page-header"><h2>数据分析</h2><div class="header-actions"><button class="btn btn-secondary" @click="exportData">📤 导出数据</button><button class="btn btn-primary" @click="generateReport">📊 生成报表</button></div></div>
      <div class="analysis-grid">
        <div class="card chart-container"><div class="card-title">月度预警趋势</div><canvas ref="trendChart" class="chart-canvas"></canvas></div>
        <div class="card chart-container"><div class="card-title">设备状态统计</div><canvas ref="deviceChart" class="chart-canvas"></canvas></div>
        <div class="card chart-container"><div class="card-title">区域风险对比</div><canvas ref="riskChart" class="chart-canvas"></canvas></div>
        <div class="card chart-container"><div class="card-title">预警类型分布</div><canvas ref="pieChart" class="chart-canvas"></canvas></div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Chart, registerables } from 'chart.js'
import axios from 'axios'

Chart.register(...registerables)
const trendChart = ref(null)
const deviceChart = ref(null)
const riskChart = ref(null)
const pieChart = ref(null)

const initCharts = async () => {
  try {
    const [trendRes, regionRes, distRes] = await Promise.all([
      axios.get('/api/analysis/trend'),
      axios.get('/api/analysis/region-risk'),
      axios.get('/api/analysis/warning-distribution')
    ])

    new Chart(trendChart.value, {
      type: 'line',
      data: {
        labels: trendRes.data.labels,
        datasets: [
          { label: '火灾', data: trendRes.data.datasets.fire, borderColor: '#ff4757', tension: 0.4 },
          { label: '洪水', data: trendRes.data.datasets.flood, borderColor: '#00d4ff', tension: 0.4 },
          { label: '地震', data: trendRes.data.datasets.earthquake, borderColor: '#9c27b0', tension: 0.4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#8b9cb5' } } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } } } }
    })

    new Chart(pieChart.value, {
      type: 'doughnut',
      data: { labels: distRes.data.labels, datasets: [{ data: distRes.data.data, backgroundColor: ['rgba(255,107,107,0.8)', 'rgba(0,212,255,0.8)', 'rgba(156,39,176,0.8)', 'rgba(255,211,42,0.8)', 'rgba(139,156,185,0.8)'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '60%' }
    })

    new Chart(riskChart.value, {
      type: 'bar',
      data: {
        labels: regionRes.data.regions.map(r => r.Name),
        datasets: [{ label: '风险指数', data: regionRes.data.regions.map(r => r.risk_index), backgroundColor: ['rgba(255,71,87,0.7)', 'rgba(255,165,2,0.7)', 'rgba(255,211,42,0.7)', 'rgba(0,212,255,0.7)', 'rgba(0,255,136,0.7)', 'rgba(255,211,42,0.7)'], borderRadius: 4 }]
      },
      options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' }, max: 100 }, y: { grid: { display: false }, ticks: { color: '#8b9cb5' } } } }
    })

    new Chart(deviceChart.value, {
      type: 'bar',
      data: {
        labels: ['温湿度', '水位', '地震', '火灾', '风速', '摄像头'],
        datasets: [
          { label: '在线', data: [128, 56, 32, 89, 28, 245], backgroundColor: 'rgba(0,255,136,0.7)' },
          { label: '离线', data: [2, 1, 0, 3, 3, 5], backgroundColor: 'rgba(255,71,87,0.7)' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#8b9cb5' } } }, scales: { x: { grid: { display: false }, ticks: { color: '#64748b' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } } } }
    })
  } catch (error) { console.error('获取分析数据失败:', error) }
}

const exportData = () => alert('正在导出数据...')
const generateReport = () => alert('正在生成报表...')

onMounted(initCharts)
</script>

<style scoped>
.analysis-page { min-height: 100vh; }
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
.header-actions { display: flex; gap: 10px; }
.analysis-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.chart-container { padding: 20px; height: 300px; }
.chart-canvas { height: 230px !important; }
.card-title { font-size: 14px; color: #8b9cb5; margin-bottom: 15px; font-weight: 600; }
.btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; transition: all 0.3s; }
.btn-primary { background: linear-gradient(135deg, #00d4ff, #00ff88); color: #000; }
.btn-secondary { background: rgba(255, 255, 255, 0.1); color: #fff; }
</style>