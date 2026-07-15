<template>
  <div class="layout-container">
    <el-container class="layout-wrapper">
      <el-aside :width="sidebarWidth" class="layout-aside">
        <Sidebar />
      </el-aside>
      <el-container>
        <el-header class="layout-header">
          <Header />
        </el-header>
        <tags-view v-if="!appStore.sidebarCollapsed" class="layout-tags" />
        <el-main class="layout-main">
          <router-view v-slot="{ Component, route }">
            <transition name="fade-transform" mode="out-in">
              <component :is="Component" :key="route.fullPath" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import tagsView from './tagsView.vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const sidebarWidth = computed(() => appStore.sidebarWidth)
</script>

<style scoped lang="scss">
.layout-container {
  width: 100%;
  height: 100%;
}

.layout-wrapper {
  height: 100%;
}

.layout-aside {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.layout-header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0;
  height: 60px;
}

.layout-tags {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
}

.layout-main {
  background-color: #f0f2f5;
  padding: 20px;
  min-height: calc(100vh - 60px - 35px);
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
