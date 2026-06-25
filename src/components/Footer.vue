<template>
  <footer class="border-t border-white/[0.04] py-12">
    <div class="max-w-trae-container mx-auto px-8 text-center">
      <p class="text-trae-text-muted text-sm mb-4">
        TRAE AI 创造力大赛初赛作品集 · 数据来自
        <a href="https://forum.trae.cn" target="_blank" rel="noopener" class="text-trae-accent hover:underline">TRAE 社区论坛</a>
      </p>
      <div class="flex items-center justify-center gap-3 text-trae-text-muted/50 text-xs font-mono">
        <span>作者<a href="https://forum.trae.cn/u/%E9%AA%86%E8%B0%A6%E5%AE%9E/summary" target="_blank" rel="noopener" class="text-trae-accent hover:underline">@骆谦实</a></span>
        <button
          @click="scrollToTop"
          class="w-7 h-7 rounded-full bg-trae-surface border border-white/10 flex items-center justify-center text-trae-text-secondary hover:text-trae-accent hover:border-trae-accent/50 transition-all duration-300 shadow-lg backdrop-blur-sm ml-1"
          title="返回顶部"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
        </button>
      </div>
    </div>
  </footer>
</template>

<script setup>
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>
