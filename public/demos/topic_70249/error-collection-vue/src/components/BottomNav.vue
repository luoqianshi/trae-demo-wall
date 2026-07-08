<template>
  <div class="bottom-nav">
    <router-link to="/" class="nav-item" :class="{ active: route.path === '/' }">
      <el-icon size="22"><HomeFilled /></el-icon>
      <span>首页</span>
    </router-link>
    <router-link to="/book" class="nav-item" :class="{ active: route.path === '/book' }">
      <el-icon size="22"><Notebook /></el-icon>
      <span>错题本</span>
    </router-link>
    <div class="nav-item center" @click="router.push('/record')">
      <div class="center-btn">
        <el-icon size="28"><Plus /></el-icon>
      </div>
    </div>
    <router-link to="/review" class="nav-item" :class="{ active: route.path === '/review' }">
      <el-icon size="22"><Timer /></el-icon>
      <span>复习</span>
    </router-link>
    <router-link to="/profile" class="nav-item" :class="{ active: route.path === '/profile' }">
      <el-icon size="22"><UserFilled /></el-icon>
      <span>我的</span>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: 64px;
  background: #fff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 100;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.04);
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 11px;
  flex: 1;
  height: 100%;
  transition: color 0.2s;
}
.nav-item.active {
  color: #0d9488;
}
.nav-item.center {
  position: relative;
  top: -16px;
}
.center-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0d9488, #14b8a6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(13,148,136,0.35);
}
</style>
