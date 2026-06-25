<template>
  <div>
    <ParticleCanvas />
    <Navbar />
    <main class="relative z-[1]">
      <!-- Disclaimer Banner -->
      <div class="pt-16 bg-trae-bg">
        <div class="border-b border-white/[0.04]">
          <p class="text-center text-[11px] text-trae-text-muted/40 py-2 tracking-wide">
            本站为社区爱好者自发搭建的作品展示页，非 TRAE 官方网站。
          </p>
        </div>
        <div class="w-full">
          <img :src="bannerUrl" alt="Banner" class="w-full" />
        </div>
      </div>
      <HeroSection />
      <ProjectGrid />
      <Footer />
    </main>

    <!-- 直达底部按钮 -->
    <button
      @click="scrollToBottom"
      class="fixed right-6 bottom-6 z-50 w-10 h-10 rounded-full bg-trae-surface border border-white/10 flex items-center justify-center text-trae-text-secondary hover:text-trae-accent hover:border-trae-accent/50 transition-all duration-300 shadow-lg backdrop-blur-sm"
      title="直达底部"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
    </button>
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

function scrollToBottom() {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
}
</script>
