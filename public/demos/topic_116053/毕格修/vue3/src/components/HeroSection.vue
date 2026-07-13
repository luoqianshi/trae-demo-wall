<template>
  <section class="hero">
    <div class="container hero-inner">
      <div class="hero-bg-shapes">
        <div class="hero-glow"></div>
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
      </div>
      <div class="hero-content" :class="{ visible: loaded }">
        <span class="hero-tag">学习工作赛道</span>
        <h1 class="hero-title">
          <span class="hero-brand">毕格修</span>
          <span class="hero-sub-brand">PaperFix AI</span>
        </h1>
        <p class="hero-desc">毕业论文格式智能检修工具 — AI 自动识别格式偏差，一键生成修正建议</p>
        <p class="hero-sub-desc">让论文格式回归规范，让学术回归内容本身</p>
        <div class="hero-actions">
          <button class="btn btn-primary hero-btn" @click="onCta">
            <IconRocket :size="20" />
            立即体验
          </button>
          <button class="btn btn-outline hero-btn">了解更多</button>
        </div>
      </div>
      <div class="hero-visual" :class="{ visible: loaded }">
        <div class="hero-card-decoration">
          <div class="deco-card deco-card-1">
            <IconDocument :size="28" />
            <span>格式检测</span>
          </div>
          <div class="deco-card deco-card-2">
            <IconCheck :size="28" />
            <span>一键修正</span>
          </div>
          <div class="deco-card deco-card-3">
            <IconAI :size="28" />
            <span>AI 智能体</span>
          </div>
        </div>
      </div>
    </div>
    <div class="hero-scroll-indicator">
      <svg class="scroll-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 4v10m0 0l-4-4m4 4l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import IconRocket from './icons/IconRocket.vue'
import IconDocument from './icons/IconDocument.vue'
import IconCheck from './icons/IconCheck.vue'
import IconAI from './icons/IconAI.vue'

const router = useRouter()
const loaded = ref(false)

const onCta = () => {
  router.push('/paper')
}

onMounted(() => {
  setTimeout(() => { loaded.value = true }, 100)
})
</script>

<style scoped>
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, var(--bg-body) 0%, var(--bg-section-alt) 40%, var(--bg-body) 100%);
}

.hero-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 48px;
  padding-top: 80px;
  padding-bottom: 60px;
  position: relative;
  z-index: 1;
}

/* Background decorative shapes */
.hero-bg-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(155, 150, 95, 0.06) 0%, transparent 60%);
  top: 10%;
  right: -10%;
  filter: blur(40px);
}

.shape {
  position: absolute;
  border-radius: 50%;
}

.shape-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(155, 150, 95, 0.08) 0%, transparent 70%);
  top: -150px;
  right: -100px;
}

.shape-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(59, 53, 43, 0.06) 0%, transparent 70%);
  bottom: -80px;
  left: -80px;
}

.shape-3 {
  width: 180px;
  height: 180px;
  border: 2px solid rgba(59, 53, 43, 0.06);
  top: 20%;
  left: 5%;
  animation: floatShape 8s ease-in-out infinite;
}

.shape-4 {
  width: 80px;
  height: 80px;
  background: rgba(155, 150, 95, 0.05);
  bottom: 25%;
  right: 10%;
  animation: floatShape 6s ease-in-out infinite reverse;
}

@keyframes floatShape {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(10deg); }
}

/* Content */
.hero-content {
  flex: 1;
  max-width: 580px;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.hero-content.visible {
  opacity: 1;
  transform: translateY(0);
}

.hero-tag {
  display: inline-block;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 4px 16px;
  border-radius: 20px;
  margin-bottom: 20px;
  letter-spacing: 0.5px;
}

.hero-title {
  margin-bottom: 20px;
}

.hero-brand {
  font-family: var(--font-heading);
  font-size: 60px;
  font-weight: 900;
  color: var(--text-primary);
  display: block;
  line-height: 1.2;
  letter-spacing: 4px;
}

.hero-sub-brand {
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 600;
  color: var(--color-accent);
  display: block;
  margin-top: 4px;
  letter-spacing: 6px;
}

.hero-desc {
  font-size: 18px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 8px;
}

.hero-sub-desc {
  font-size: 15px;
  color: var(--text-light);
  line-height: 1.6;
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-btn {
  padding: 14px 28px;
  font-size: 15px;
}

/* Decorative card visuals */
.hero-visual {
  flex: 0 0 340px;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s;
}

.hero-visual.visible {
  opacity: 1;
  transform: translateY(0);
}

.hero-card-decoration {
  position: relative;
  height: 340px;
}

.deco-card {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 18px 24px;
  box-shadow: var(--shadow-card-hover);
  border: 1px solid var(--border-color-light);
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.deco-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--shadow-card-hover);
}

.deco-card-1 {
  top: 20px;
  right: 60px;
  animation: floatCard 5s ease-in-out infinite;
}

.deco-card-2 {
  top: 130px;
  right: 0;
  animation: floatCard 5s ease-in-out infinite 1s;
}

.deco-card-3 {
  top: 240px;
  right: 80px;
  animation: floatCard 5s ease-in-out infinite 2s;
}

@keyframes floatCard {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* Scroll indicator */
.hero-scroll-indicator {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.scroll-arrow {
  color: var(--color-primary);
  opacity: 0.4;
  animation: scrollBounce 2s ease-in-out infinite;
}

@keyframes scrollBounce {
  0%, 100% { transform: translateY(0); opacity: 0.3; }
  50% { transform: translateY(6px); opacity: 0.7; }
}

/* Responsive */
@media (max-width: 1024px) {
  .hero-inner {
    flex-direction: column;
    text-align: center;
    padding-top: 100px;
  }
  .hero-content {
    max-width: 100%;
  }
  .hero-brand {
    font-size: 42px;
  }
  .hero-actions {
    justify-content: center;
  }
  .hero-visual {
    flex: 0 0 auto;
    width: 100%;
    max-width: 340px;
  }
}

@media (max-width: 640px) {
  .hero-brand {
    font-size: 34px;
    letter-spacing: 2px;
  }
  .hero-sub-brand {
    font-size: 18px;
  }
  .hero-desc {
    font-size: 16px;
  }
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  .hero-visual {
    display: none;
  }
}
</style>
