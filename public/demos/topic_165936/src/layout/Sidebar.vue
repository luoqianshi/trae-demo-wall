<template>
  <div class="sidebar-container">
    <div class="logo-container">
      <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=education%20logo%20blue%20minimalist&image_size=square" alt="logo" class="logo-img" />
      <h1 v-if="!appStore.sidebarCollapsed" class="logo-title">智能班级管理</h1>
    </div>
    <el-scrollbar class="sidebar-scrollbar">
      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        :unique-opened="true"
        :collapse-transition="false"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        @select="handleMenuSelect"
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-sub-menu v-if="route.children && route.children.length > 0 && !isHidden(route)" :index="resolvePath(route.path)">
            <template #title>
              <el-icon v-if="route.meta?.icon">
                <component :is="route.meta.icon" />
              </el-icon>
              <span>{{ route.meta?.title }}</span>
            </template>
            <el-menu-item
              v-for="child in route.children"
              :key="child.path"
              :index="resolvePath(route.path + '/' + child.path)"
              v-show="!isHidden(child)"
            >
              <el-icon v-if="child.meta?.icon">
                <component :is="child.meta.icon" />
              </el-icon>
              <template #title>{{ child.meta?.title }}</template>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else-if="!isHidden(route)" :index="resolvePath(route.path)">
            <el-icon v-if="route.meta?.icon">
              <component :is="route.meta.icon" />
            </el-icon>
            <template #title>{{ route.meta?.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { usePermissionStore } from '@/stores/permission'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const permissionStore = usePermissionStore()

const menuRoutes = computed(() => {
  return permissionStore.routes.filter(route => !route.meta?.hidden)
})

const activeMenu = computed(() => route.path)

function isHidden(route) {
  return route.meta?.hidden
}

function resolvePath(path) {
  return path
}

function handleMenuSelect(index) {
  if (index && index !== route.path) {
    router.push(index)
  }
}
</script>

<style scoped lang="scss">
.sidebar-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b2f3a;
  padding: 0 15px;
  overflow: hidden;

  .logo-img {
    width: 32px;
    height: 32px;
    margin-right: 12px;
  }

  .logo-title {
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    white-space: nowrap;
    margin: 0;
  }
}

.sidebar-scrollbar {
  flex: 1;
  height: calc(100% - 60px);
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: #263445 !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #409EFF !important;
  color: #fff !important;
}
</style>
