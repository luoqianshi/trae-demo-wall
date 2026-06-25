<template>
  <div class="min-h-screen flex flex-col">
    <ParticleCanvas />
    <Navbar />
    <main class="relative z-[1] flex-1 max-w-trae-container mx-auto px-8 pt-24 pb-12">
      <!-- 返回首页按钮 -->
      <div class="mb-6">
        <router-link
          to="/"
          class="inline-flex items-center gap-2 text-sm text-trae-text-secondary hover:text-trae-accent transition-colors no-underline"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          返回首页
        </router-link>
      </div>
      <ProjectDetail :project-id="projectId" />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import ParticleCanvas from '@/components/ParticleCanvas.vue'
import Navbar from '@/components/Navbar.vue'
import ProjectDetail from '@/components/ProjectDetail.vue'
import Footer from '@/components/Footer.vue'

const route = useRoute()
const projectId = route.params.id
</script>
