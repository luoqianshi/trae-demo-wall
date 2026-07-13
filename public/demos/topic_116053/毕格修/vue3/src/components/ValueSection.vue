<template>
  <section class="section">
    <div class="container">
      <!-- Efficiency Stats -->
      <div class="section-header fade-in-up" :class="{ visible: headerVisible }" ref="headerRef">
        <span class="section-tag">效率提升</span>
        <h2 class="section-title">20 倍效率提升，数万小时节省</h2>
      </div>
      <div class="stats-grid" ref="statsGridRef">
        <div
          v-for="(stat, i) in stats"
          :key="i"
          class="stat-card fade-in-up"
          :class="{ visible: statVisible[i] }"
          :ref="el => setStatRef(el, i)"
        >
          <div class="stat-icon-wrap">
            <Component :is="stat.icon" :size="36" />
          </div>
          <div class="stat-number">
            <span class="stat-value" ref="statNumRefs">{{ stat.counting ? animatedNumbers[i] : stat.value }}</span>
          </div>
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-sub">{{ stat.sub }}</div>
        </div>
      </div>
    </div>

    <!-- Social Value -->
    <div class="section-alt">
      <div class="container" style="padding: 64px 0;">
        <div class="section-header fade-in-up" :class="{ visible: socialVisible }" ref="socialRef">
          <span class="section-tag">社会价值</span>
          <h2 class="section-title">让教育更公平，让学术更纯粹</h2>
        </div>
        <div class="value-block fade-in-up" :class="{ visible: socialVisible }">
          <div class="value-accent"></div>
          <div class="value-content">
            <p>
              从教育公平角度看，偏远地区高校学生往往缺乏排版培训和指导资源，AI 智能体可以拉平这种资源差距，让每位学生都能产出格式规范的学术成果，无论其所在学校的资源条件如何。同时，减少因格式问题导致的延期毕业现象，降低学生的心理压力和焦虑感，助力高等教育质量的整体提升。
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import IconEfficiency from './icons/IconEfficiency.vue'
import IconClock from './icons/IconClock.vue'
import IconUsers from './icons/IconUsers.vue'

const stats = [
  { icon: IconEfficiency, value: '20×', label: '效率提升', sub: '传统4-6小时 → 智能10-15分钟', counting: false },
  { icon: IconClock, value: '20000+', label: '小时/年节省', sub: '中等规模高校每年可节省约2万小时', counting: true, target: 20000 },
  { icon: IconUsers, value: '1000万+', label: '覆盖学生群体', sub: '全国每年超千万高校毕业生受益', counting: false }
]

const headerVisible = ref(false)
const statVisible = ref(stats.map(() => false))
const socialVisible = ref(false)
const animatedNumbers = ref(['0', '0', '0'])
const startedCounting = ref(false)

const headerRef = ref(null)
const statsGridRef = ref(null)
const socialRef = ref(null)
const statRefs = ref([])

const setStatRef = (el, i) => { if (el) statRefs.value[i] = el }

let observer = null

const animateCount = () => {
  if (startedCounting.value) return
  startedCounting.value = true
  const target = 20000
  const duration = 2000
  const start = performance.now()

  const tick = (now) => {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    const current = Math.round(eased * target)
    animatedNumbers.value[1] = current.toLocaleString()
    if (progress < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      const el = entry.target
      if (el === headerRef.value) headerVisible.value = true
      if (el === socialRef.value) socialVisible.value = true
      const si = statRefs.value.indexOf(el)
      if (si !== -1) {
        statVisible.value[si] = true
        if (si === 1) animateCount()
      }
    })
  }, { threshold: 0.2 })

  const observe = (el) => { if (el) observer.observe(el) }
  observe(headerRef.value)
  observe(socialRef.value)
  statRefs.value.forEach(observe)
})

onUnmounted(() => { if (observer) observer.disconnect() })
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 64px;
}

.stat-card {
  text-align: center;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 40px 24px;
  border: 1px solid var(--border-color-light);
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
}

.stat-icon-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 16px;
  background: var(--color-primary-light);
}

.stat-number {
  margin-bottom: 8px;
}

.stat-value {
  font-family: var(--font-heading);
  font-size: 48px;
  font-weight: 900;
  color: var(--color-primary);
  line-height: 1.1;
}

.stat-label {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.stat-sub {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Social value block */
.value-block {
  display: flex;
  gap: 0;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  overflow: hidden;
  max-width: 800px;
  margin: 0 auto;
  box-shadow: var(--shadow-sm);
}

.value-accent {
  width: 8px;
  background: linear-gradient(180deg, var(--color-accent) 0%, var(--color-primary) 100%);
  flex-shrink: 0;
}

.value-content {
  padding: 32px 40px;
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.9;
}

.value-content p {
  text-indent: 2em;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .stat-value {
    font-size: 36px;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .value-content {
    padding: 24px 20px;
    font-size: 15px;
  }
}
</style>
