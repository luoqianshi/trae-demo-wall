<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
// 简化的App.vue，放大模式功能已移至Dashboard.vue
</script>

<style>
#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
  margin: 0;
  padding: 0;
  position: relative;
  transition: all 0.3s ease;
}

/* 放大模式样式已移至Dashboard.vue */

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* 优化医生审美的简约设计 */
:root {
  --primary-color: #2c5aa0;
  --primary-light: #5dade2;
  --primary-dark: #1e3d72;
  --secondary-color: #5dade2;
  --success-color: #27ae60;
  --warning-color: #f39c12;
  --danger-color: #e74c3c;
  --text-primary: #2c3e50;
  --text-secondary: #7f8c8d;
  --text-light: #95a5a6;
  --background-light: #ffffff;
  --background-gray: #f8f9fa;
  --background-gradient: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  --border-color: #e9ecef;
  --border-light: rgba(255, 255, 255, 0.2);
  --shadow-light: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-medium: 0 4px 16px rgba(0, 0, 0, 0.12);
  --shadow-large: 0 8px 32px rgba(0, 0, 0, 0.16);
  --transition-fast: all 0.2s ease;
  --transition-normal: all 0.3s ease;
  --transition-slow: all 0.5s ease;
  --border-radius-small: 6px;
  --border-radius-medium: 12px;
  --border-radius-large: 16px;
}

/* 全局样式优化 */
.el-card {
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-light);
  transition: var(--transition-normal);
  border-radius: var(--border-radius-medium);
  overflow: hidden;
}

.el-card:hover {
  box-shadow: var(--shadow-medium);
  transform: translateY(-2px);
}

.el-button {
  border-radius: var(--border-radius-small);
  transition: var(--transition-normal);
  font-weight: 500;
}

.el-button--primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(44, 90, 160, 0.3);
}

.el-button--primary:hover {
  background: linear-gradient(135deg, var(--primary-dark) 0%, #0f2347 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(44, 90, 160, 0.4);
}

.el-input__wrapper {
  border-radius: var(--border-radius-small);
  transition: var(--transition-normal);
}

.el-input__wrapper:hover {
  box-shadow: 0 2px 8px rgba(44, 90, 160, 0.1);
}

.el-input__wrapper.is-focus {
  box-shadow: 0 4px 12px rgba(44, 90, 160, 0.2);
}

.el-menu-item.is-active {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%) !important;
  box-shadow: 0 4px 12px rgba(44, 90, 160, 0.3);
}

/* 滚动条优化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--background-gray);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary-color) 100%);
  border-radius: 3px;
  transition: var(--transition-normal);
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
}

/* 动画优化 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

.pulse {
  animation: pulse 2s infinite;
}
</style>