<template>
  <section class="relative min-h-screen flex items-center pt-16">
    <div class="max-w-trae-container mx-auto px-8">
      <div class="max-w-[760px]">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 border border-trae-accent rounded-trae-pill text-trae-accent text-[13px] bg-trae-accent/10 mb-7">
          <span class="w-1.5 h-1.5 rounded-full bg-trae-accent shadow-[0_0_8px_rgba(34,197,94,1)] animate-pulse"></span>
          TRAE AI 创造力大赛 · 初赛作品集
        </div>

        <h1 class="text-[clamp(40px,6vw,64px)] font-extrabold leading-[1.1] tracking-tight mb-6 text-trae-text">
          探索
          <span class="bg-gradient-to-br from-trae-accent via-[#4ade80] to-[#86efac] bg-clip-text text-transparent">AI</span>
          驱动的创意作品
        </h1>

        <p class="text-lg text-trae-text-secondary mb-10 max-w-[560px]">
          来自 TRAE 社区的 <span class="text-trae-text font-semibold">{{ stats.totalProjects }}+</span> 网页/前端创新项目，一站式体验
        </p>

        <div class="flex items-center gap-6 mb-10 text-sm text-trae-text-secondary font-mono">
          <span>{{ stats.totalProjects }} 件作品</span>
          <span class="text-trae-border">·</span>
          <span>{{ tagCount }} 个赛道</span>
          <span class="text-trae-border">·</span>
          <span>{{ formatNumber(stats.totalViews) }}+ 次浏览</span>
        </div>

        <div class="flex gap-3 flex-wrap">
          <a href="#projects" class="btn-primary">开始探索</a>
          <a href="https://forum.trae.cn/c/38-category/40-category/40" target="_blank" rel="noopener" class="btn-secondary">了解大赛</a>
        </div>
      </div>
    </div>

    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-70">
      <span class="text-trae-text-muted text-xs tracking-[4px] font-mono">SCROLL</span>
      <div class="w-px h-9 bg-gradient-to-b from-trae-accent to-transparent animate-pulse"></div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useProjectStore } from '@/stores/projectStore'

const store = useProjectStore()

const stats = computed(() => store.indexData?.stats || { totalProjects: 0, totalViews: 0, totalLikes: 0, tagCounts: {} })
const tagCount = computed(() => Object.keys(stats.value.tagCounts).length)

function formatNumber(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n
}
</script>
