<template>
  <div class="settings-page">
    <header class="navbar">
      <div class="nav-left"><div class="logo-icon">🛡️</div><div class="logo-text"><h1>灾害预警与趋势预测平台</h1><span>智能守护生命安全</span></div></div>
      <nav class="nav-tabs">
        <router-link to="/" class="nav-tab">📊 监控仪表盘</router-link>
        <router-link to="/warnings" class="nav-tab">⚠️ 预警管理</router-link>
        <router-link to="/devices" class="nav-tab">📡 设备管理</router-link>
        <router-link to="/analysis" class="nav-tab">📈 数据分析</router-link>
        <router-link to="/history" class="nav-tab">📋 历史记录</router-link>
        <router-link to="/settings" class="nav-tab active">⚙️ 系统设置</router-link>
      </nav>
      <div class="nav-right"><div class="user-avatar">管</div></div>
    </header>
    <main class="main-content">
      <div class="settings-grid">
        <div class="settings-nav card">
          <div class="settings-nav-item active" @click="activeSection = 'basic'">⚙️ 基本设置</div>
          <div class="settings-nav-item" @click="activeSection = 'rules'">📋 预警规则</div>
          <div class="settings-nav-item" @click="activeSection = 'notifications'">🔔 通知设置</div>
          <div class="settings-nav-item" @click="activeSection = 'data'">💾 数据管理</div>
          <div class="settings-nav-item" @click="activeSection = 'users'">👥 用户管理</div>
          <div class="settings-nav-item" @click="activeSection = 'system'">ℹ️ 系统信息</div>
        </div>
        <div class="settings-content card">
          <div v-if="activeSection === 'basic'" class="settings-section">
            <h3>基本设置</h3>
            <div class="settings-row"><div class="settings-label">系统名称</div><input type="text" v-model="settings.systemName" class="settings-input"></div>
            <div class="settings-row"><div class="settings-label">数据刷新频率</div><select v-model="settings.refreshRate" class="settings-select"><option>5秒</option><option>10秒</option><option>30秒</option></select></div>
            <div class="settings-row"><div class="settings-label">自动刷新</div><input type="checkbox" v-model="settings.autoRefresh" class="settings-checkbox"></div>
            <div class="settings-row"><div class="settings-label">声音提醒</div><input type="checkbox" v-model="settings.soundAlert" class="settings-checkbox"></div>
          </div>
          <div v-if="activeSection === 'rules'" class="settings-section">
            <h3>预警规则配置</h3>
            <div class="rule-item"><div class="rule-header"><span>🌡️ 温度预警规则</span><span class="rule-status enabled">已启用</span></div><div class="rule-desc">高温 > 38°C，低温 < -10°C</div><button class="btn btn-secondary btn-sm">编辑</button></div>
            <div class="rule-item"><div class="rule-header"><span>💧 水位预警规则</span><span class="rule-status enabled">已启用</span></div><div class="rule-desc">警戒水位: 3.5m(黄), 5.0m(红)</div><button class="btn btn-secondary btn-sm">编辑</button></div>
            <div class="rule-item"><div class="rule-header"><span>🔥 火灾预警规则</span><span class="rule-status enabled">已启用</span></div><div class="rule-desc">检测高温+烟雾特征</div><button class="btn btn-secondary btn-sm">编辑</button></div>
          </div>
          <div v-if="activeSection === 'notifications'" class="settings-section">
            <h3>通知渠道</h3>
            <div class="channel-item"><div class="channel-name">📱 短信通知</div><input type="checkbox" checked class="settings-checkbox"></div>
            <div class="channel-item"><div class="channel-name">📧 邮件通知</div><input type="checkbox" checked class="settings-checkbox"></div>
            <div class="channel-item"><div class="channel-name">🔔 APP推送</div><input type="checkbox" class="settings-checkbox"></div>
            <div class="channel-item"><div class="channel-name">📢 大屏广播</div><input type="checkbox" checked class="settings-checkbox"></div>
          </div>
          <div v-if="activeSection === 'data'" class="settings-section">
            <h3>数据管理</h3>
            <p class="storage-info">已用空间: <strong>256.8 GB / 500 GB</strong></p>
            <div class="storage-bar"><div class="storage-used"></div></div>
            <div class="data-actions"><button class="btn btn-secondary" @click="exportAllData">📤 导出全部数据</button><button class="btn btn-secondary" @click="backupNow">💾 立即备份</button><button class="btn btn-danger" @click="cleanOldData">🗑️ 清理旧数据</button></div>
          </div>
          <div v-if="activeSection === 'users'" class="settings-section">
            <h3>用户列表</h3>
            <div class="user-item"><div class="user-avatar-small">管</div><div class="user-info"><div class="user-name">管理员</div><div class="user-email">admin@disaster.com</div></div><span class="user-status online">在线</span></div>
            <div class="user-item"><div class="user-avatar-small">王</div><div class="user-info"><div class="user-name">王建国</div><div class="user-email">wangjg@disaster.com</div></div><span class="user-status online">在线</span></div>
            <div class="user-item"><div class="user-avatar-small">李</div><div class="user-info"><div class="user-name">李明</div><div class="user-email">liming@disaster.com</div></div><span class="user-status offline">离线</span></div>
            <button class="btn btn-primary" style="margin-top: 15px;">➕ 添加用户</button>
          </div>
          <div v-if="activeSection === 'system'" class="settings-section">
            <h3>系统信息</h3>
            <div class="system-info"><div class="info-row"><span>系统名称</span><span>灾害预警与趋势预测平台</span></div><div class="info-row"><span>版本号</span><span>v2.3.1</span></div><div class="info-row"><span>运行环境</span><span>Python 3.11 + FastAPI</span></div><div class="info-row"><span>数据库</span><span>SQLite</span></div></div>
            <div class="system-actions"><button class="btn btn-secondary" @click="checkUpdate">🔄 检查更新</button><button class="btn btn-danger" @click="systemRestart">⏻ 重启系统</button></div>
          </div>
          <div class="settings-footer"><button class="btn btn-primary" @click="saveSettings">💾 保存设置</button><button class="btn btn-secondary" @click="resetSettings">🔄 恢复默认</button></div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeSection = ref('basic')
const settings = ref({ systemName: '灾害预警与趋势预测平台', refreshRate: '10秒', autoRefresh: true, soundAlert: true })

const saveSettings = () => alert('设置已保存！')
const resetSettings = () => { if (confirm('确定要恢复默认设置吗？')) alert('已恢复默认设置') }
const exportAllData = () => alert('正在导出数据...')
const backupNow = () => alert('正在备份...')
const cleanOldData = () => { if (confirm('确定要清理旧数据吗？')) alert('正在清理...') }
const checkUpdate = () => alert('当前已是最新版本！')
const systemRestart = () => { if (confirm('确定要重启系统吗？')) alert('系统正在重启...') }
</script>

<style scoped>
.settings-page { min-height: 100vh; }
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
.settings-grid { display: grid; grid-template-columns: 200px 1fr; gap: 20px; min-height: calc(100vh - 110px); }
.settings-nav { padding: 15px; }
.settings-nav-item { padding: 12px 15px; border-radius: 8px; cursor: pointer; transition: all 0.3s; margin-bottom: 5px; color: #8b9cb5; }
.settings-nav-item:hover { background: rgba(255, 255, 255, 0.05); }
.settings-nav-item.active { background: rgba(0, 212, 255, 0.2); color: #00d4ff; }
.settings-content { padding: 25px; }
.settings-section h3 { font-size: 16px; margin-bottom: 20px; color: #fff; }
.settings-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.settings-label { font-size: 14px; }
.settings-input, .settings-select { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 8px 12px; color: #fff; font-size: 14px; width: 200px; }
.settings-checkbox { width: 18px; height: 18px; accent-color: #00d4ff; }
.rule-item { background: rgba(255, 255, 255, 0.03); border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 3px solid #00d4ff; }
.rule-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
.rule-status { font-size: 10px; padding: 3px 8px; border-radius: 10px; }
.rule-status.enabled { background: rgba(0, 255, 136, 0.2); color: #00ff88; }
.rule-desc { font-size: 12px; color: #8b9cb5; margin-bottom: 10px; }
.channel-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.channel-name { font-size: 14px; }
.storage-info { margin-bottom: 10px; font-size: 14px; }
.storage-bar { height: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden; margin-bottom: 15px; }
.storage-used { width: 51%; height: 100%; background: linear-gradient(90deg, #00d4ff, #00ff88); }
.data-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.user-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255, 255, 255, 0.03); border-radius: 8px; margin-bottom: 8px; }
.user-avatar-small { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #00d4ff, #00ff88); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; }
.user-info { flex: 1; }
.user-name { font-size: 14px; font-weight: 600; }
.user-email { font-size: 12px; color: #8b9cb5; }
.user-status { font-size: 10px; padding: 3px 8px; border-radius: 10px; }
.user-status.online { background: rgba(0, 255, 136, 0.2); color: #00ff88; }
.user-status.offline { background: rgba(255, 255, 255, 0.1); color: #8b9cb5; }
.system-info { margin-bottom: 20px; }
.info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 14px; }
.system-actions { display: flex; gap: 10px; }
.settings-footer { display: flex; gap: 10px; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); }
.btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; transition: all 0.3s; }
.btn-primary { background: linear-gradient(135deg, #00d4ff, #00ff88); color: #000; }
.btn-secondary { background: rgba(255, 255, 255, 0.1); color: #fff; }
.btn-danger { background: rgba(255, 71, 87, 0.2); color: #ff4757; }
.btn-sm { padding: 5px 10px; font-size: 12px; }
</style>