<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <keep-alive include="HomeView">
        <component :is="Component" />
      </keep-alive>
    </router-view>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import BottomNav from './components/BottomNav.vue'
</script>
