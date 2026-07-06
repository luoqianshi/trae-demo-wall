<template>
  <section class="hero-section relative min-h-[90vh] flex items-center justify-center overflow-hidden">
    <!-- 流动墨绿渐变背景 -->
    <div class="hero-bg absolute inset-0 pointer-events-none">
      <div class="hero-glow hero-glow-1"></div>
      <div class="hero-glow hero-glow-2"></div>
      <div class="hero-glow hero-glow-3"></div>
      <div class="hero-noise"></div>
      <div class="hero-fade-bottom"></div>
    </div>

    <!-- 内容区 -->
    <div class="relative z-[1] max-w-trae-container mx-auto px-8 text-center">
      <!-- 顶部标签 -->
      <div class="hero-reveal hero-reveal-0 inline-flex items-center gap-2 px-4 py-1.5 border border-trae-accent-glow/30 rounded-trae-pill text-trae-accent-glow text-[13px] bg-trae-accent/8 mb-8 font-mono">
        <span class="w-1.5 h-1.5 rounded-full bg-trae-accent-glow shadow-[0_0_8px_rgba(52,211,153,1)] animate-pulse"></span>
        TRAE 作品墙
      </div>

      <!-- 大标题 -->
      <h1 class="hero-reveal hero-reveal-1 text-[clamp(40px,7vw,80px)] font-bold leading-[1.15] tracking-tight mb-6 text-trae-text" style="font-family: var(--font-display);">
        探索 AI 编程的<br />
        <span class="bg-gradient-to-br from-trae-accent-glow via-trae-accent to-trae-accent-deep bg-clip-text text-transparent">无限可能</span>
      </h1>

      <!-- 副标题 -->
      <p class="hero-reveal hero-reveal-2 text-trae-text-secondary text-lg md:text-xl max-w-[600px] mx-auto mb-10">
        汇聚开发者智慧，发现 TRAE 创意作品
      </p>

      <!-- 按钮组 -->
      <div class="hero-reveal hero-reveal-3 flex flex-wrap items-center justify-center gap-4 mb-12">
        <a
          href="https://trae-idea-incubator.netlify.app/"
          target="_blank"
          rel="noopener"
          class="btn-primary"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          灵感孵化舱
        </a>
        <a
          href="https://luoqianshi.github.io/TRAE-AI-Creativity-Competition-Idea-Hall/"
          target="_blank"
          rel="noopener"
          class="btn-glass"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          TRAE Idea Hall
        </a>
        <a
          href="https://www.trae.cn/ai-creativity?utm_source=community"
          target="_blank"
          rel="noopener"
          class="btn-glass"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
          大赛官网
        </a>
      </div>

      <!-- 统计数据 -->
      <div class="hero-reveal hero-reveal-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-sm">
        <span class="text-trae-text-muted">
          <span class="text-trae-accent-glow font-semibold">{{ totalProjects }}</span> 作品
        </span>
        <span class="text-trae-text-muted/40">·</span>
        <span class="text-trae-text-muted">
          <span class="text-trae-accent-glow font-semibold">{{ formatStat(totalViews) }}</span> 浏览
        </span>
        <span class="text-trae-text-muted/40">·</span>
        <span class="text-trae-text-muted">
          <span class="text-trae-accent-glow font-semibold">{{ formatStat(totalLikes) }}</span> 赞
        </span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useProjectStore } from '@/stores/projectStore'

const store = useProjectStore()
const totalProjects = ref(0)
const totalViews = ref(0)
const totalLikes = ref(0)

onMounted(async () => {
  await store.loadIndex()
  if (store.indexData) {
    totalProjects.value = store.indexData.stats?.totalProjects || store.allProjects.length || 0
    totalViews.value = store.indexData.stats?.totalViews || 0
    totalLikes.value = store.indexData.stats?.totalLikes || 0
  }
})

function formatStat(n) {
  if (!n) return '0'
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}
</script>

<style scoped>
.hero-section {
  background: var(--trae-bg);
}

/* 三层径向渐变光晕 */
.hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.5;
}

.hero-glow-1 {
  width: 600px;
  height: 600px;
  top: -10%;
  left: 50%;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(16, 185, 129, 0.25), transparent 70%);
  animation: glow-drift-1 20s ease-in-out infinite;
}

.hero-glow-2 {
  width: 500px;
  height: 500px;
  bottom: 0%;
  left: 15%;
  background: radial-gradient(circle, rgba(4, 120, 87, 0.2), transparent 70%);
  animation: glow-drift-2 25s ease-in-out infinite;
}

.hero-glow-3 {
  width: 450px;
  height: 450px;
  bottom: 10%;
  right: 10%;
  background: radial-gradient(circle, rgba(52, 211, 153, 0.15), transparent 70%);
  animation: glow-drift-3 30s ease-in-out infinite;
}

@keyframes glow-drift-1 {
  0%, 100% { transform: translateX(-50%) translateY(0) scale(1); }
  50% { transform: translateX(-40%) translateY(30px) scale(1.1); }
}

@keyframes glow-drift-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -20px) scale(1.15); }
}

@keyframes glow-drift-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-30px, 20px) scale(0.9); }
}

/* noise 纹理 */
.hero-noise {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* 底部渐隐 */
.hero-fade-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(to bottom, transparent, var(--trae-bg));
}

/* 入场动画 */
.hero-reveal {
  opacity: 0;
  transform: translateY(20px);
  animation: hero-fade-in 0.8s ease-out forwards;
}

.hero-reveal-0 { animation-delay: 0.1s; }
.hero-reveal-1 { animation-delay: 0.2s; }
.hero-reveal-2 { animation-delay: 0.4s; }
.hero-reveal-3 { animation-delay: 0.6s; }
.hero-reveal-4 { animation-delay: 0.8s; }

@keyframes hero-fade-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
