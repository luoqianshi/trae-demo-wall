<template>
  <section class="relative pt-24 pb-6">
    <div class="max-w-trae-container mx-auto px-8">
      <!-- 卡片容器 -->
      <div class="relative rounded-3xl overflow-hidden border border-trae-accent/20 bg-trae-card/50 backdrop-blur-sm">
        <!-- 绿色光晕装饰 -->
        <div class="absolute top-0 right-0 w-[400px] h-[400px] bg-trae-accent/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-[300px] h-[300px] bg-trae-accent/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

        <!-- 内容区 -->
        <div class="relative z-[1] px-8 py-12 md:px-16 md:py-14">
          <!-- 顶部标签 -->
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 border border-trae-accent/40 rounded-trae-pill text-trae-accent text-[13px] bg-trae-accent/10 mb-6">
            <span class="w-1.5 h-1.5 rounded-full bg-trae-accent shadow-[0_0_8px_rgba(34,197,94,1)] animate-pulse"></span>
            在这里，看见 TRAE 创作者的灵魂落点
          </div>

          <!-- 大标题 -->
          <h1 class="text-[clamp(36px,5.5vw,56px)] font-extrabold leading-[1.1] tracking-tight mb-4 text-trae-text">
            Ship Faster with
            <span class="bg-gradient-to-br from-trae-accent via-[#4ade80] to-[#86efac] bg-clip-text text-transparent">TRAE</span>
          </h1>

          <!-- 副标题 -->
          <p class="text-trae-text-secondary text-lg max-w-[520px]">
            Built with <span class="text-white font-medium">TRAE</span>. Built by <span class="text-white font-medium">Friends</span>.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
</script>
