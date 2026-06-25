<template>
  <div>
    <ParticleCanvas />
    <Navbar />
    <main class="relative z-[1]">
      <!-- Disclaimer Banner -->
      <div class="pt-16 bg-trae-bg border-b border-white/[0.04]">
        <div class="max-w-trae-container mx-auto px-8 py-3 text-center">
          <p class="text-trae-text-muted text-xs">本站为社区爱好者自发搭建的作品展示页，非 TRAE 官方网站。</p>
        </div>
        <div class="max-w-trae-container mx-auto px-8 pb-0">
          <img :src="bannerUrl" alt="Banner" class="w-full rounded-b-2xl" />
        </div>
      </div>
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
import traeBlackImg from '@/assets/trae-black.png'
import bannerImg from '@/assets/banner.webp'

const bannerUrl = bannerImg
</script>
