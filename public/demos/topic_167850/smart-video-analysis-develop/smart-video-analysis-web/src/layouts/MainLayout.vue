<template>
  <el-container class="main-layout">
    <el-aside :width="isCollapsed ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <el-icon :size="24"><VideoCamera /></el-icon>
        <span v-if="!isCollapsed" class="logo-text">SVA</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapsed"
        router
        background-color="#1f2937"
        text-color="#9ca3af"
        active-text-color="#60a5fa"
      >
        <el-menu-item index="/project-list">
          <el-icon><Folder /></el-icon>
          <template #title>项目管理</template>
        </el-menu-item>
        <el-menu-item index="/video-list">
          <el-icon><VideoCamera /></el-icon>
          <template #title>视频管理</template>
        </el-menu-item>
        <el-menu-item index="/video-upload">
          <el-icon><Upload /></el-icon>
          <template #title>视频上传解析</template>
        </el-menu-item>
        <el-menu-item index="/multi-fusion">
          <el-icon><Share /></el-icon>
          <template #title>多视频融合</template>
        </el-menu-item>
        <el-menu-item index="/image-search">
          <el-icon><Picture /></el-icon>
          <template #title>以图搜视频</template>
        </el-menu-item>
        <el-menu-item index="/frame-workspace">
          <el-icon><MagicStick /></el-icon>
          <template #title>帧级创作</template>
        </el-menu-item>
        <el-menu-item index="/audio-workspace">
          <el-icon><Microphone /></el-icon>
          <template #title>音频创作</template>
        </el-menu-item>
        <el-menu-item index="/online-editor">
          <el-icon><VideoPlay /></el-icon>
          <template #title>在线剪辑</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleSidebar">
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-icon>
          <span class="page-title">{{ pageTitle }}</span>
        </div>
        <div class="header-right">
          <el-dropdown>
            <div class="user-info">
              <el-avatar :size="32">{{ userStore.userInfo?.nickname?.[0] || 'U' }}</el-avatar>
              <span class="username">{{ userStore.userInfo?.nickname || userStore.userInfo?.username || '用户' }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人设置</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const isCollapsed = computed(() => appStore.sidebarCollapsed)
const activeMenu = computed(() => route.path)
const pageTitle = computed(() => (route.meta.title as string) || '')

const toggleSidebar = () => {
  appStore.toggleSidebar()
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

onMounted(() => {
  userStore.initFromStorage()
  if (userStore.token && !userStore.userInfo) {
    userStore.fetchUserInfo()
  }
})
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.sidebar {
  background-color: #1f2937;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  border-bottom: 1px solid #374151;
}

.logo-text {
  letter-spacing: 2px;
}

:deep(.el-menu) {
  border-right: none;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.username {
  color: #374151;
  font-size: 14px;
}

.main-content {
  background-color: #f3f4f6;
  padding: 20px;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
