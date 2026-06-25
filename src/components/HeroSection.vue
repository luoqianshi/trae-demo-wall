<template>
  <section class="relative pt-24 pb-12">
    <div class="max-w-trae-container mx-auto px-8">
      <!-- 卡片容器 -->
      <div class="relative rounded-3xl overflow-hidden border border-trae-accent/20 bg-trae-card/50 backdrop-blur-sm">
        <!-- 绿色光晕装饰 -->
        <div class="absolute top-0 right-0 w-[400px] h-[400px] bg-trae-accent/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-[300px] h-[300px] bg-trae-accent/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

        <!-- 内容区 -->
        <div class="relative z-[1] px-8 py-16 md:px-16 md:py-20">
          <!-- 顶部标签 -->
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 border border-trae-accent/40 rounded-trae-pill text-trae-accent text-[13px] bg-trae-accent/10 mb-8">
            <span class="w-1.5 h-1.5 rounded-full bg-trae-accent shadow-[0_0_8px_rgba(34,197,94,1)] animate-pulse"></span>
            在这里，看见 TRAE 创作者的灵魂落点
          </div>

          <!-- 大标题 -->
          <h1 class="text-[clamp(36px,5.5vw,56px)] font-extrabold leading-[1.1] tracking-tight mb-5 text-trae-text">
            Ship Faster with
            <span class="bg-gradient-to-br from-trae-accent via-[#4ade80] to-[#86efac] bg-clip-text text-transparent">TRAE</span>
          </h1>

          <!-- 副标题 -->
          <p class="text-trae-text-secondary text-lg mb-10 max-w-[520px]">
            Built with TRAE. Built by Friends.
          </p>

          <!-- 按钮组 -->
          <div class="flex gap-3 flex-wrap">
            <a href="#projects" class="btn-primary">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              浏览作品
            </a>
            <a href="https://forum.trae.cn/c/38-category/40-category/40" target="_blank" rel="noopener" class="btn-secondary">
              了解大赛
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
</script>
