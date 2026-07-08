<script setup>
import SideNav from './layouts/SideNav.vue'
</script>

<template>
  <div class="flex min-h-screen">
    <SideNav />
    <main class="flex-1 min-h-screen overflow-hidden">
      <router-view />
    </main>
  </div>
</template>
