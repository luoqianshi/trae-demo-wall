<template>
  <div class="min-h-screen pt-20 pb-12">
    <Navbar />
    <main class="relative z-[1] max-w-trae-container mx-auto px-8">
      <ProjectDetail :project-id="projectId" />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import ProjectDetail from '@/components/ProjectDetail.vue'
import Footer from '@/components/Footer.vue'

const route = useRoute()
const projectId = route.params.id
</script>
