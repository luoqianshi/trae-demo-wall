<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-left">
        <div class="logo-icon">🛡️</div>
        <div class="logo-text">
          <h1>灾害预警与趋势预测平台</h1>
          <span>Disaster Warning Platform</span>
        </div>
        <div class="nav-tabs">
          <router-link to="/" class="nav-tab" :class="{ active: $route.path === '/' }">
            <span>📊</span> 监控仪表盘
          </router-link>
          <router-link to="/warnings" class="nav-tab" :class="{ active: $route.path === '/warnings' }">
            <span>⚠️</span> 预警管理
          </router-link>
          <router-link to="/devices" class="nav-tab" :class="{ active: $route.path === '/devices' }">
            <span>📡</span> 设备管理
          </router-link>
          <router-link to="/analysis" class="nav-tab" :class="{ active: $route.path === '/analysis' }">
            <span>📈</span> 数据分析
          </router-link>
          <router-link to="/history" class="nav-tab" :class="{ active: $route.path === '/history' }">
            <span>📋</span> 历史记录
          </router-link>
          <router-link to="/settings" class="nav-tab" :class="{ active: $route.path === '/settings' }">
            <span>⚙️</span> 系统设置
          </router-link>
        </div>
      </div>
      <div class="nav-right">
        <button class="nav-btn" title="刷新数据" @click="refreshData">🔄</button>
        <button class="nav-btn" title="通知中心" @click="showNotifications">🔔</button>
        <div class="user-avatar">管</div>
      </div>
    </nav>
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  methods: {
    refreshData() {
      this.$router.go(0)
    },
    showNotifications() {
      alert('通知中心')
    }
  }
}
</script>

<style scoped>
/* 组件样式 */
</style>
