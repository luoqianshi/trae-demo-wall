<template>
  <section id="intro" class="section">
    <div class="container">
      <div class="section-header fade-in-up" :class="{ visible: headerVisible }" ref="headerRef">
        <span class="section-tag">创意介绍</span>
        <h2 class="section-title">让论文格式回归规范，让学术回归内容</h2>
        <p class="section-subtitle">
          本产品是一款面向高校毕业生的毕业论文格式智能检修工具，通过 AI 智能体自动识别论文中的格式偏差（字体、行距、页边距、标题层级、参考文献格式、图表编号等），一键生成修正建议并输出排版规范的文档。
        </p>
      </div>
      <div class="card-grid-3">
        <div
          v-for="(item, index) in features"
          :key="index"
          class="card feature-card fade-in-up"
          :class="{ visible: cardsVisible[index] }"
          :ref="el => setCardRef(el, index)"
        >
          <div class="feature-icon">
            <Component :is="item.icon" :size="40" />
          </div>
          <h3 class="feature-title">{{ item.title }}</h3>
          <p class="feature-desc">{{ item.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import IconAI from './icons/IconAI.vue'
import IconCheck from './icons/IconCheck.vue'
import IconDocument from './icons/IconDocument.vue'

const features = [
  {
    icon: IconAI,
    title: 'AI 智能识别',
    desc: '自动扫描全文，精准定位字体、行距、页边距、标题层级、参考文献格式、图表编号等各类格式偏差'
  },
  {
    icon: IconCheck,
    title: '一键修正输出',
    desc: '基于识别结果一键生成修正建议，快速输出排版规范的文档，告别繁琐的手动调整'
  },
  {
    icon: IconDocument,
    title: '多模板适配',
    desc: '支持多所高校论文模板，灵活切换不同规范标准，满足各类院校的格式要求'
  }
]

const headerVisible = ref(false)
const cardsVisible = ref(features.map(() => false))
const headerRef = ref(null)
const cardRefs = ref([])

const setCardRef = (el, index) => {
  if (el) cardRefs.value[index] = el
}

let observer = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target === headerRef.value) {
            headerVisible.value = true
          }
          const idx = cardRefs.value.indexOf(entry.target)
          if (idx !== -1) {
            cardsVisible.value[idx] = true
          }
        }
      })
    },
    { threshold: 0.2 }
  )

  if (headerRef.value) observer.observe(headerRef.value)
  cardRefs.value.forEach(ref => { if (ref) observer.observe(ref) })
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped>
.feature-card {
  text-align: center;
  padding: 40px 28px;
}

.feature-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  border-radius: 20px;
  background: var(--color-primary-light);
}

.feature-title {
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.feature-desc {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.7;
}
</style>
