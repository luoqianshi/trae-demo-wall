<template>
  <div class="main-layout">
    <header class="layout-header">
      <div class="header-inner">
        <router-link to="/" class="logo">
          <span class="logo-icon">🏥</span>
          <span class="logo-text">健康监控</span>
        </router-link>

        <nav class="nav-menu">
          <router-link to="/" class="nav-item">看板</router-link>
          <router-link to="/consultation/doctors" class="nav-item">问诊</router-link>
          <router-link to="/device" class="nav-item">设备</router-link>
          <router-link to="/report" class="nav-item">报告</router-link>
          <router-link to="/family" class="nav-item">家庭</router-link>
          <router-link to="/plan" class="nav-item">计划</router-link>
          <router-link to="/points" class="nav-item">积分</router-link>
          <router-link to="/profile" class="nav-item">档案</router-link>

          <template v-if="role === 'DOCTOR'">
            <router-link to="/doctor/workbench" class="nav-item">工作台</router-link>
          </template>

          <template v-if="role === 'ADMIN'">
            <el-dropdown trigger="hover">
              <span class="nav-item nav-dropdown">
                后台管理<el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="goAdmin('/admin/dashboard')">平台总览</el-dropdown-item>
                  <el-dropdown-item @click="goAdmin('/admin/metric')">指标配置</el-dropdown-item>
                  <el-dropdown-item @click="goAdmin('/admin/user')">用户管理</el-dropdown-item>
                  <el-dropdown-item @click="goAdmin('/admin/doctor')">医生审核</el-dropdown-item>
                  <el-dropdown-item @click="goAdmin('/admin/advice')">建议知识库</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </nav>

        <div class="header-right">
          <span class="user-name">{{ userInfo?.name }}</span>
          <el-button link type="primary" @click="handleLogout">退出</el-button>
        </div>
      </div>
    </header>

    <main class="layout-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const userInfo = computed(() => userStore.userInfo)
const role = computed(() => userStore.role)

// 跳转后台管理子页
const goAdmin = (path: string): void => {
  router.push(path)
}

// 退出登录
const handleLogout = (): void => {
  userStore.logout()
}
</script>

<style scoped lang="scss">
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.layout-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.header-inner {
  display: flex;
  align-items: center;
  max-width: 1280px;
  height: 60px;
  margin: 0 auto;
  padding: 0 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  text-decoration: none;
}

.logo-icon {
  font-size: 22px;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 32px;
  flex: 1;
}

.nav-item {
  padding: 6px 12px;
  font-size: 14px;
  color: #606266;
  text-decoration: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-item:hover,
.nav-item.router-link-active {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.nav-dropdown {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 14px;
  color: #303133;
}

.layout-main {
  flex: 1;
}
</style>
