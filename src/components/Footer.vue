<template>
  <footer class="border-t border-white/[0.04] py-12">
    <div class="max-w-trae-container mx-auto px-8 text-center">
      <div class="flex items-center justify-center gap-2 mb-4">
        <div class="w-6 h-6 rounded-md bg-gradient-to-br from-trae-accent to-trae-accent-deep grid place-items-center text-black font-extrabold text-xs">
          T
        </div>
        <span class="text-trae-text font-bold text-sm">TRAE Demo Wall</span>
      </div>
      <p class="text-trae-text-muted text-sm mb-4">
        TRAE AI 创造力大赛初赛作品集 · 数据来自
        <a href="https://forum.trae.cn" target="_blank" rel="noopener" class="text-trae-accent hover:underline">TRAE 社区论坛</a>
      </p>
      <div class="flex items-center justify-center gap-6 text-trae-text-muted text-sm">
        <a href="https://forum.trae.cn/c/38-category/40-category/40" target="_blank" rel="noopener" class="hover:text-trae-accent transition-colors no-underline text-trae-text-muted">大赛论坛</a>
        <a href="https://github.com/luoqianshi/trae-demo-wall" target="_blank" rel="noopener" class="hover:text-trae-accent transition-colors no-underline text-trae-text-muted">GitHub</a>
      </div>
      <p class="text-trae-text-muted/50 text-xs mt-6 font-mono">
        &copy; {{ new Date().getFullYear() }} TRAE Demo Wall. Built with Vue 3 + TailwindCSS.
      </p>
    </div>
  </footer>
</template>
