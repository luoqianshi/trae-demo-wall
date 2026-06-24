<template>
  <div>
    <ParticleCanvas />
    <Navbar />
    <main class="relative z-[1]">
      <HeroSection />
      <ProjectGrid />
      <Footer />
    </main>
  </div>
</template>

<script setup>
import ParticleCanvas from '@/components/ParticleCanvas.vue'
import Navbar from '@/components/Navbar.vue'
import HeroSection from '@/components/HeroSection.vue'
import ProjectGrid from '@/components/ProjectGrid.vue'
import Footer from '@/components/Footer.vue'
</script>
