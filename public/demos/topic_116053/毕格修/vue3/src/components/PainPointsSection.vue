<template>
  <section class="section">
    <div class="container">
      <!-- Target Users -->
      <div class="section-header fade-in-up" :class="{ visible: usersVisible }" ref="usersHeaderRef">
        <span class="section-tag">目标用户</span>
        <h2 class="section-title">每一位深夜改格式的学子</h2>
        <p class="section-subtitle">
          核心用户为高校本科毕业生、硕士研究生、博士研究生；延伸用户包括高校导师、学术期刊投稿者、科研机构研究人员。
        </p>
      </div>
      <div class="card-grid-3" style="margin-bottom: 64px;">
        <div
          v-for="(item, i) in userGroups"
          :key="i"
          class="card user-card fade-in-up"
          :class="{ visible: userCardsVisible[i] }"
          :ref="el => setUserCardRef(el, i)"
        >
          <div class="user-icon">
            <Component :is="item.icon" :size="40" />
          </div>
          <h3 class="user-title">{{ item.title }}</h3>
          <p class="user-desc">{{ item.desc }}</p>
        </div>
      </div>
    </div>

    <!-- Pain Points (alt background) -->
    <div class="section-alt">
      <div class="container" style="padding: 64px 0;">
        <div class="section-header fade-in-up" :class="{ visible: painHeaderVisible }" ref="painHeaderRef">
          <span class="section-tag">核心痛点</span>
          <h2 class="section-title">格式之痛，谁改谁知道</h2>
        </div>
        <div class="card-grid-4">
          <div
            v-for="(item, i) in painPoints"
            :key="i"
            class="card pain-card fade-in-up"
            :class="{ visible: painCardsVisible[i] }"
            :ref="el => setPainCardRef(el, i)"
          >
            <div class="pain-icon">
              <Component :is="item.icon" :size="32" />
            </div>
            <h3 class="pain-title">{{ item.title }}</h3>
            <p class="pain-desc">{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Scenarios -->
    <div class="container" style="padding: 64px 0;">
      <div class="section-header fade-in-up" :class="{ visible: sceneHeaderVisible }" ref="sceneHeaderRef">
        <span class="section-tag">使用场景</span>
        <h2 class="section-title">四大场景，全面覆盖</h2>
      </div>
      <div class="card-grid-2">
        <div
          v-for="(item, i) in scenarios"
          :key="i"
          class="scene-card fade-in-up"
          :class="{ visible: sceneCardsVisible[i] }"
          :ref="el => setSceneCardRef(el, i)"
        >
          <div class="scene-accent"></div>
          <div class="scene-body">
            <h3 class="scene-title">{{ item.title }}</h3>
            <p class="scene-desc">{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import IconGraduation from './icons/IconGraduation.vue'
import IconUsers from './icons/IconUsers.vue'
import IconTarget from './icons/IconTarget.vue'
import IconDocument from './icons/IconDocument.vue'
import IconTools from './icons/IconTools.vue'
import IconClock from './icons/IconClock.vue'
import IconLightbulb from './icons/IconLightbulb.vue'

const userGroups = [
  { icon: IconGraduation, title: '本硕博毕业生', desc: '面临毕业论文最终格式审核，确保符合高校规范' },
  { icon: IconUsers, title: '高校导师', desc: '批量审阅学生论文格式，减少机械性返工' },
  { icon: IconTarget, title: '科研人员', desc: '学术期刊投稿格式切换，多模板灵活适配' }
]

const painPoints = [
  { icon: IconDocument, title: '规则繁杂', desc: '不同学校、学院的论文格式要求各不相同，几十页的规范文件理解成本高' },
  { icon: IconTools, title: '工具门槛高', desc: 'Word 高级排版功能对非计算机专业学生不友好，学习曲线陡峭' },
  { icon: IconClock, title: '人工低效', desc: '一篇3万字论文人工检查需2-3小时，且容易遗漏' },
  { icon: IconLightbulb, title: '反复修改', desc: '打印前最后一刻发现问题，紧急返工带来巨大心理压力' }
]

const scenarios = [
  { title: '定稿最终检查', desc: '毕业论文定稿前的最终格式检查，确保符合学校规范' },
  { title: '导师返修调整', desc: '导师返修后按意见批量调整格式，快速响应修改要求' },
  { title: '模板灵活切换', desc: '不同学校或期刊的格式模板切换，灵活适配各类规范' },
  { title: '多人协作统一', desc: '多人协作论文时的格式统一，避免合并后的排版混乱' }
]

// Intersection Observer state
const usersVisible = ref(false)
const userCardsVisible = ref(userGroups.map(() => false))
const painHeaderVisible = ref(false)
const painCardsVisible = ref(painPoints.map(() => false))
const sceneHeaderVisible = ref(false)
const sceneCardsVisible = ref(scenarios.map(() => false))

const usersHeaderRef = ref(null)
const painHeaderRef = ref(null)
const sceneHeaderRef = ref(null)
const userCardRefs = ref([])
const painCardRefs = ref([])
const sceneCardRefs = ref([])

const setUserCardRef = (el, i) => { if (el) userCardRefs.value[i] = el }
const setPainCardRef = (el, i) => { if (el) painCardRefs.value[i] = el }
const setSceneCardRef = (el, i) => { if (el) sceneCardRefs.value[i] = el }

let observer = null

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      const el = entry.target
      if (el === usersHeaderRef.value) usersVisible.value = true
      if (el === painHeaderRef.value) painHeaderVisible.value = true
      if (el === sceneHeaderRef.value) sceneHeaderVisible.value = true
      const ui = userCardRefs.value.indexOf(el)
      if (ui !== -1) userCardsVisible.value[ui] = true
      const pi = painCardRefs.value.indexOf(el)
      if (pi !== -1) painCardsVisible.value[pi] = true
      const si = sceneCardRefs.value.indexOf(el)
      if (si !== -1) sceneCardsVisible.value[si] = true
    })
  }, { threshold: 0.15 })

  const observe = (el) => { if (el) observer.observe(el) }
  observe(usersHeaderRef.value)
  observe(painHeaderRef.value)
  observe(sceneHeaderRef.value)
  userCardRefs.value.forEach(observe)
  painCardRefs.value.forEach(observe)
  sceneCardRefs.value.forEach(observe)
})

onUnmounted(() => { if (observer) observer.disconnect() })
</script>

<style scoped>
.user-card {
  text-align: center;
  padding: 32px 24px;
}

.user-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 68px;
  height: 68px;
  margin: 0 auto 16px;
  border-radius: 18px;
  background: var(--color-primary-light);
}

.user-title {
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.user-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
}

/* Pain point cards */
.pain-card {
  text-align: center;
  padding: 28px 20px;
}

.pain-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 56px;
  height: 56px;
  margin: 0 auto 14px;
  border-radius: 14px;
  background: var(--color-accent-light);
}

.pain-title {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.pain-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.7;
}

/* Scenario cards */
.scene-card {
  display: flex;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-color-light);
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.scene-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
}

.scene-accent {
  width: 5px;
  background: var(--color-primary);
  flex-shrink: 0;
}

.scene-body {
  padding: 24px 28px;
}

.scene-title {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.scene-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
}

@media (max-width: 640px) {
  .scene-body {
    padding: 18px 20px;
  }
}
</style>
