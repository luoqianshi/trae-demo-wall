<template>
  <section class="relative pt-24 pb-6">
    <div class="max-w-trae-container mx-auto px-8">
      <!-- 卡片容器 -->
      <div class="relative rounded-3xl overflow-hidden border border-trae-accent/20 bg-trae-card/50 backdrop-blur-sm">
        <!-- 绿色光晕装饰 -->
        <div class="absolute top-0 right-0 w-[400px] h-[400px] bg-trae-accent/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-[300px] h-[300px] bg-trae-accent/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

        <!-- 内容区 -->
        <div class="relative z-[1] px-8 py-14 md:px-16 md:py-20">
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
          <p class="text-trae-text-secondary text-lg max-w-[520px] mb-8">
            Built with <span class="text-white font-medium">TRAE</span>. Built by <span class="text-white font-medium">Friends</span>.
          </p>

          <!-- 外部链接按钮 -->
          <div class="flex flex-wrap items-center gap-3">
            <router-link
              :to="{ name: 'immersive' }"
              class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-trae-pill bg-trae-accent text-trae-bg text-sm font-bold border border-trae-accent shadow-trae-glow hover:bg-trae-accent-deep hover:shadow-trae-glow-strong transition-all duration-200"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              纯享模式
            </router-link>
            <a
              href="https://trae-idea-incubator.netlify.app/"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-trae-pill bg-white/5 text-white/80 text-sm font-medium border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:text-white hover:border-white/15 transition-all duration-200"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              灵感孵化舱
            </a>
            <a
              href="https://luoqianshi.github.io/TRAE-AI-Creativity-Competition-Idea-Hall/"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-trae-pill bg-white/5 text-white/80 text-sm font-medium border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:text-white hover:border-white/15 transition-all duration-200"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
              TRAE Idea Hall
            </a>
            <a
              href="https://www.trae.cn/ai-creativity?utm_source=community"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-trae-pill bg-white/5 text-white/80 text-sm font-medium border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:text-white hover:border-white/15 transition-all duration-200"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
              大赛官网
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
</script>
