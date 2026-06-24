<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-8 transition-all duration-300"
    :class="scrolled ? 'bg-trae-bg/85 backdrop-blur-xl border-b border-white/5' : 'bg-trae-bg/55 backdrop-blur-md'"
  >
    <router-link to="/" class="flex items-center gap-2.5 no-underline">
      <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-trae-accent to-trae-accent-deep grid place-items-center text-black font-extrabold text-sm shadow-[0_0_16px_rgba(34,197,94,0.35)]">
        T
      </div>
      <span class="text-trae-text font-bold text-base tracking-wide">TRAE Demo Wall</span>
    </router-link>

    <div class="flex items-center gap-4">
      <router-link
        to="/"
        class="px-4 py-2 rounded-trae-pill text-sm font-medium text-trae-text-secondary hover:text-trae-text transition-colors no-underline"
        active-class="!text-trae-text bg-trae-accent/10"
      >
        首页
      </router-link>
      <a
        href="https://forum.trae.cn/c/38-category/40-category/40"
        target="_blank"
        rel="noopener"
        class="px-4 py-2 rounded-trae-pill text-sm font-medium text-trae-text-secondary hover:text-trae-text transition-colors no-underline"
      >
        大赛论坛
      </a>
      <a
        href="https://github.com/luoqianshi/trae-demo-wall"
        target="_blank"
        rel="noopener"
        class="px-4 py-2 rounded-trae-pill text-sm font-medium text-trae-text-secondary hover:text-trae-text transition-colors no-underline"
      >
        GitHub
      </a>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const scrolled = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 50
}

onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>
