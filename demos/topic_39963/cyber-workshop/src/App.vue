<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const chapters = [
  { id: 'naili', name: '乃粒', desc: '论谷物耕作', icon: '禾' },
  { id: 'wuji', name: '五金', desc: '论金属冶炼', icon: '金' },
  { id: 'taoci', name: '陶埏', desc: '论陶瓷烧制', icon: '陶' },
]

const currentChapter = ref(chapters[1])

const recipe = {
  name: '冶铁之法',
  steps: [
    { name: '铁矿石', status: 'done' },
    { name: '入炉加热', status: 'active' },
    { name: '去硫除杂', status: 'pending' },
    { name: '反复锻打', status: 'pending' },
    { name: '淬火成钢', status: 'pending' },
  ],
}

const forgeState = ref({
  temperature: 1200,
  purity: 40,
  progress: 35,
  stage: '熔炼中',
  bellows: 6,
  flux: 0,
})

const inventory = ref([
  { id: 'iron_ore', name: '铁矿石', qty: 42, icon: '⛰', color: 'text-amber-800' },
  { id: 'charcoal', name: '木炭', qty: 28, icon: '🪵', color: 'text-orange-800' },
  { id: 'pine_resin', name: '松脂', qty: 7, icon: '🌲', color: 'text-emerald-800' },
  { id: 'clay', name: '粘土', qty: 19, icon: '🟤', color: 'text-stone-700' },
  { id: 'limestone', name: '石灰石', qty: 15, icon: '◈', color: 'text-stone-600' },
  { id: 'coal', name: '石炭', qty: 11, icon: '⬛', color: 'text-stone-800' },
])

const fullStory = '万历三十六年春，景德镇南郊外，夜已深。\n铁炉熊熊，火光映红了古老的山墙。你，作为明廷钦定的「工料郎中」，受命于工部之下，专司督造钢铁。\n据《天工开物·五金》所载：「凡铁分生、熟，出炉未炒则生，既炒则熟。生熟相和，炼成则钢。」\n此刻炉温正缓缓升至一千二百度，铁矿石在炭与松脂的助燃下开始软化。你必须谨慎抉择——\n是加大风箱，还是先以石灰石去硫？这一步若错，整炉生铁皆为废铁。'

const typedText = ref('')
const isTyping = ref(true)
let typeTimer = null
let charIndex = 0

function typeNext() {
  if (charIndex < fullStory.length) {
    typedText.value += fullStory[charIndex]
    charIndex++
    typeTimer = setTimeout(typeNext, 55)
  } else {
    isTyping.value = false
  }
}

function restartStory() {
  typedText.value = ''
  charIndex = 0
  isTyping.value = true
  if (typeTimer) clearTimeout(typeTimer)
  typeNext()
}

onMounted(() => { typeNext() })
onUnmounted(() => { if (typeTimer) clearTimeout(typeTimer) })

const actionLogs = ref([
  { time: '戌时', text: '炉温稳定于 1200℃，铁料已开始软化。', type: 'info' },
  { time: '戌时二刻', text: '检测到硫含量偏高，建议投放石灰石。', type: 'warn' },
  { time: '亥时', text: '风箱频率正常，鼓风量充足。', type: 'info' },
])

function applyAction(action) {
  if (action.id === 'bellows') {
    forgeState.value.temperature = Math.min(1800, forgeState.value.temperature + 80)
    forgeState.value.bellows = Math.min(10, forgeState.value.bellows + 1)
    forgeState.value.progress = Math.min(100, forgeState.value.progress + 6)
    actionLogs.value.unshift({ time: '亥时三刻', text: '加大风箱！炉温上升，铁水开始沸腾。', type: 'good' })
  } else if (action.id === 'limestone') {
    forgeState.value.flux = Math.min(100, forgeState.value.flux + 20)
    forgeState.value.purity = Math.min(100, forgeState.value.purity + 8)
    forgeState.value.progress = Math.min(100, forgeState.value.progress + 4)
    const lime = inventory.value.find(i => i.id === 'limestone')
    if (lime && lime.qty > 0) lime.qty--
    actionLogs.value.unshift({ time: '亥时三刻', text: '投入石灰石，炉中浮起白色熔渣。', type: 'good' })
  } else if (action.id === 'pine_resin') {
    forgeState.value.temperature = Math.min(1800, forgeState.value.temperature + 40)
    forgeState.value.progress = Math.min(100, forgeState.value.progress + 3)
    const resin = inventory.value.find(i => i.id === 'pine_resin')
    if (resin && resin.qty > 0) resin.qty--
    actionLogs.value.unshift({ time: '亥时三刻', text: '松脂助燃，焰光乍现青色。', type: 'info' })
  } else if (action.id === 'cool') {
    forgeState.value.temperature = Math.max(600, forgeState.value.temperature - 120)
    forgeState.value.purity = Math.min(100, forgeState.value.purity + 3)
    actionLogs.value.unshift({ time: '亥时三刻', text: '稍稍退温，观察炉内反应……', type: 'warn' })
  }
  if (actionLogs.value.length > 8) actionLogs.value.pop()

  if (forgeState.value.progress >= 100 && !showCompletion.value) {
    showCompletion.value = true
    forgeState.value.stage = '钢成'
  }
}

const actions = [
  { id: 'bellows', label: '加大风箱火力', hint: '+80℃ · +6%进度', icon: '🔥', quote: '凡铁分生、熟，出炉未炒则生，既炒则熟。' },
  { id: 'limestone', label: '加入石灰石去硫', hint: '+8%纯度 · -1石灰石', icon: '◈', quote: '凡石灰，经火焚炼为用，能去铁中之硫。' },
  { id: 'pine_resin', label: '投入松脂助燃', hint: '+40℃ · -1松脂', icon: '🌲', quote: '松脂助燃，焰光乍现，以利火候。' },
  { id: 'cool', label: '退温静观其变', hint: '-120℃ · +3%纯度', icon: '❄', quote: '火候过则铁脆，稍退温，静观炉内反应。' },
]

const showCompletion = ref(false)

const tempColor = computed(() => {
  const t = forgeState.value.temperature
  if (t >= 1500) return 'text-red-800'
  if (t >= 1000) return 'text-amber-800'
  return 'text-stone-700'
})

const totalIron = computed(() => inventory.value.find(i => i.id === 'iron_ore')?.qty || 0)
const totalFuel = computed(() => (inventory.value.find(i => i.id === 'charcoal')?.qty || 0) + (inventory.value.find(i => i.id === 'coal')?.qty || 0))

/* SVG 环形进度条 —— 周长 2π × 36 ≈ 226.19 */
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * 36
const progressOffset = computed(() => PROGRESS_CIRCUMFERENCE * (1 - forgeState.value.progress / 100))
const progressColor = computed(() => {
  const p = forgeState.value.progress
  if (p >= 80) return '#047857'
  if (p >= 40) return '#b45309'
  return '#78716c'
})
</script>

<template>
  <div class="paper-bg min-h-screen w-full bg-[url('./assets/bg.webp')] bg-cover bg-center bg-no-repeat bg-fixed text-stone-900">

    <div class="min-h-screen p-8 flex flex-col justify-between">
      <div class="mx-auto w-full max-w-[1500px]">

        <!-- ===== 顶部栏 ===== -->
        <header class="mb-8">
          <div class="glass-card rounded-lg p-5">
            <div class="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center w-full">
              <div class="flex items-center gap-4">
                <img src="./assets/tgkw.png" alt="天工开物" class="w-16 h-16 mix-blend-multiply shrink-0" />
                <div>
                  <h1 class="text-2xl font-bold tracking-[0.2em] text-stone-900 sm:text-3xl">天工开物 · 大明赛博工坊</h1>
                  <div class="mt-1.5 flex items-center gap-2 text-xs tracking-[0.25em] text-stone-600">
                    <span>TIAN-GONG-KAI-WU</span>
                    <span class="text-amber-700">◆</span>
                    <span>MING DYNASTY CYBER WORKSHOP</span>
                    <span class="text-amber-700">◆</span>
                    <span>v0.1</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3 rounded-lg bg-amber-100/25 px-5 py-3 ml-auto sm:ml-0">
                <div class="leading-tight text-right">
                  <div class="text-lg font-bold tracking-wider text-stone-900">《天工开物·{{ currentChapter.name }}》</div>
                  <div class="mt-0.5 text-xs uppercase tracking-[0.25em] text-stone-600">{{ currentChapter.desc }}</div>
                </div>
                <img src="./assets/wj.png" alt="五金" class="w-12 h-12 mix-blend-multiply shrink-0" />
              </div>
            </div>
            <div class="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-3 text-xs">
              <div class="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono tracking-wider text-stone-600">
                <span class="flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-amber-700"></span>万历三十六年春</span>
                <span class="flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-stone-600"></span>景德镇南郊外</span>
                <span class="flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-emerald-700"></span>工部工料郎中</span>
              </div>
              <div class="flex items-center gap-4 font-mono text-xs">
                <span class="flex items-center gap-2 text-amber-800">
                  <span class="relative inline-flex h-2 w-2">
                    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-700 opacity-60"></span>
                    <span class="relative inline-flex h-2 w-2 rounded-full bg-amber-700"></span>
                  </span>
                  SYS ONLINE
                </span>
                <span class="text-stone-400">·</span>
                <span class="text-stone-600">节点 0x7A4D</span>
              </div>
            </div>
          </div>
        </header>

        <!-- ===== 主体三栏 ===== -->
        <main class="grid grid-cols-1 gap-8 lg:grid-cols-12">

          <!-- ========================================== -->
          <!-- 左列 (3/12)：当前造物 + 工艺配方              -->
          <!-- ========================================== -->
          <section class="space-y-8 lg:col-span-3">

            <!-- 当前造物 —— 5 列竖行表格 -->
            <div class="glass-card rounded-lg p-6">
              <div class="mb-5 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="block h-3 w-3 rounded-sm bg-emerald-700"></span>
                  <span class="text-lg font-bold tracking-widest text-stone-900">当前造物 · 冶铁</span>
                </div>
                <span class="text-xs tracking-[0.25em] text-stone-500">STATUS</span>
              </div>

              <div class="grid grid-cols-5 gap-4 text-center">
                <!-- 炉温 -->
                <div class="flex flex-col items-center justify-center rounded-lg bg-stone-100/25 h-36 px-2">
                  <div class="text-xs tracking-[0.2em] text-stone-500">炉温</div>
                  <div class="mt-3 flex items-baseline justify-center whitespace-nowrap" :class="tempColor">
                    <span class="text-3xl font-bold">{{ forgeState.temperature }}</span>
                    <span class="ml-0.5 text-base text-stone-500">℃</span>
                  </div>
                </div>
                <!-- 纯度 -->
                <div class="flex flex-col items-center justify-center rounded-lg bg-amber-100/20 h-36 px-2">
                  <div class="text-xs tracking-[0.2em] text-amber-700">纯度</div>
                  <div class="mt-3 flex items-baseline justify-center whitespace-nowrap text-amber-800">
                    <span class="text-3xl font-bold">{{ forgeState.purity }}</span>
                    <span class="ml-0.5 text-base text-stone-500">%</span>
                  </div>
                </div>
                <!-- 进度 —— SVG 环形进度条 -->
                <div class="flex flex-col items-center justify-center rounded-lg bg-stone-100/25 h-36 px-2">
                  <div class="text-xs tracking-[0.2em] text-stone-500">进度</div>
                  <div class="mt-2 relative inline-flex items-center justify-center">
                    <svg class="progress-ring" width="64" height="64" viewBox="0 0 80 80">
                      <!-- 底色轨道 -->
                      <circle cx="40" cy="40" r="36" fill="none"
                        stroke="rgba(168,162,158,0.2)" stroke-width="5" />
                      <!-- 进度弧 -->
                      <circle cx="40" cy="40" r="36" fill="none"
                        :stroke="progressColor" stroke-width="5"
                        stroke-linecap="round"
                        :stroke-dasharray="PROGRESS_CIRCUMFERENCE"
                        :stroke-dashoffset="progressOffset"
                        style="transform: rotate(-90deg); transform-origin: 40px 40px; transition: stroke-dashoffset 0.6s ease, stroke 0.6s ease;" />
                    </svg>
                    <span class="absolute inset-0 flex items-center justify-center text-lg font-bold text-stone-900">
                      {{ forgeState.progress }}<span class="text-xs text-stone-500">%</span>
                    </span>
                  </div>
                </div>
                <!-- 风箱 -->
                <div class="flex flex-col items-center justify-center rounded-lg bg-stone-100/25 h-36 px-2">
                  <div class="text-xs tracking-[0.2em] text-stone-500">风箱</div>
                  <div class="mt-3 flex items-baseline justify-center whitespace-nowrap text-amber-800">
                    <span class="text-3xl font-bold">{{ forgeState.bellows }}</span>
                    <span class="ml-0.5 text-base text-stone-500">/10</span>
                  </div>
                </div>
                <!-- 熔剂 -->
                <div class="flex flex-col items-center justify-center rounded-lg bg-stone-100/25 h-36 px-2">
                  <div class="text-xs tracking-[0.2em] text-stone-500">熔剂</div>
                  <div class="mt-3 flex items-baseline justify-center whitespace-nowrap text-emerald-800">
                    <span class="text-3xl font-bold">{{ forgeState.flux }}</span>
                    <span class="ml-0.5 text-base text-stone-500">%</span>
                  </div>
                </div>
              </div>

              <div class="mt-4 rounded-lg bg-amber-100/25 py-3 text-center">
                <div class="text-xs tracking-[0.25em] text-amber-700">CURRENT STAGE</div>
                <div class="mt-1 text-xl tracking-wider text-amber-900">{{ forgeState.stage }}</div>
              </div>
            </div>

            <!-- 工艺配方 -->
            <div class="glass-card rounded-lg p-6">
              <div class="mb-5 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="block h-3 w-3 rounded-sm bg-amber-700"></span>
                  <span class="text-lg font-bold tracking-widest text-stone-900">工艺配方 · {{ recipe.name }}</span>
                </div>
                <span class="text-xs tracking-[0.25em] text-stone-500">RECIPE</span>
              </div>
              <ol class="space-y-4">
                <li v-for="(step, idx) in recipe.steps" :key="idx" class="recipe-step" :class="{ 'is-done': step.status === 'done', 'is-active': step.status === 'active', 'is-pending': step.status === 'pending' }">
                  <span class="recipe-step--idx">{{ step.status === 'done' ? '✓' : idx + 1 }}</span>
                  <span class="recipe-step--name">{{ step.name }}</span>
                  <span class="recipe-step--tag">{{ step.status === 'done' ? 'OK' : step.status === 'active' ? 'RUN' : 'WAIT' }}</span>
                </li>
              </ol>
            </div>

          </section>

          <!-- ========================================== -->
          <!-- 中列 (6/12)：典籍实录 + 操作选择 + 工坊日志    -->
          <!-- ========================================== -->
          <section class="space-y-8 lg:col-span-6">

            <!-- 典籍实录 -->
            <div class="glass-card rounded-lg p-8">
              <div class="mb-6 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="block h-3 w-3 rounded-sm bg-emerald-700"></span>
                  <span class="text-lg font-bold tracking-widest text-stone-900">典籍实录 · 剧情叙述</span>
                </div>
                <button @click="restartStory" class="flex items-center gap-1.5 rounded-lg px-4 py-2 font-mono text-xs text-amber-800 transition hover:bg-amber-100/25 active:scale-95">
                  <span class="text-sm">⟲</span>
                  <span class="tracking-wider">重播</span>
                </button>
              </div>
              <div class="story-box relative min-h-[320px] rounded-lg bg-stone-100/25 p-8">
                <div class="story-text leading-relaxed whitespace-pre-line" :class="{ 'is-typing': isTyping }">{{ typedText }}<span v-if="!isTyping" class="story-end">▌</span></div>
              </div>
            </div>

            <!-- 操作选择：图标 mr-10 强行拉开 -->
            <div class="glass-card rounded-lg p-8">
              <div class="mb-6 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="block h-3 w-3 rounded-sm bg-amber-700"></span>
                  <span class="text-lg font-bold tracking-widest text-stone-900">操作选择 · 抉择之间</span>
                </div>
                <span class="text-xs tracking-[0.25em] text-stone-500">ACTION</span>
              </div>

              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <button v-for="act in actions" :key="act.id" @click="applyAction(act)" class="action-btn group" :data-tooltip="act.quote">
                  <div class="flex items-start">
                    <div class="action-btn--icon mr-10">{{ act.icon }}</div>
                    <div class="flex-1 text-left">
                      <div class="text-xl font-bold leading-tight text-stone-900 transition group-hover:text-amber-900">{{ act.label }}</div>
                      <div class="mt-2 font-mono text-base tracking-wide text-stone-600">{{ act.hint }}</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <!-- 工坊日志 -->
            <div class="glass-card rounded-lg p-6">
              <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="block h-3 w-3 rounded-sm bg-emerald-700"></span>
                  <span class="text-lg font-bold tracking-widest text-stone-900">工坊日志 · LIVE FEED</span>
                </div>
                <span class="flex items-center gap-1.5 text-xs tracking-[0.2em] text-emerald-800">
                  <span class="relative inline-flex h-2 w-2">
                    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-700 opacity-60"></span>
                    <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-700"></span>
                  </span>
                  LIVE
                </span>
              </div>
              <div class="log-panel rounded-lg bg-stone-100/25">
                <ul class="space-y-3">
                  <li v-for="(log, i) in actionLogs" :key="i" class="log-line" :class="{ 'log-info': log.type === 'info', 'log-warn': log.type === 'warn', 'log-good': log.type === 'good' }">
                    <span class="log-time">[{{ log.time }}]</span>
                    <span class="log-text">{{ log.text }}</span>
                  </li>
                </ul>
              </div>
            </div>

          </section>

          <!-- ========================================== -->
          <!-- 右列 (3/12)：背包                          -->
          <!-- ========================================== -->
          <section class="space-y-8 lg:col-span-3">

            <div class="glass-card rounded-lg p-6">
              <div class="mb-5 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="block h-3 w-3 rounded-sm bg-amber-700"></span>
                  <span class="text-lg font-bold tracking-widest text-stone-900">背 包 · INVENTORY</span>
                </div>
                <span class="text-xs tracking-[0.25em] text-stone-500">{{ inventory.length }} / 24</span>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div v-for="item in inventory" :key="item.id" class="item-slot group">
                  <div class="item-slot--icon text-2xl" :class="item.color">{{ item.icon }}</div>
                  <div class="item-slot--name text-sm">{{ item.name }}</div>
                  <div class="item-slot--qty text-lg">× {{ item.qty }}</div>
                </div>
                <div v-for="n in 3" :key="'empty-' + n" class="item-slot item-slot--empty">
                  <span class="font-mono text-sm tracking-wider text-stone-400/60">—空—</span>
                </div>
              </div>

              <div class="mt-4 pt-4">
                <div class="grid grid-cols-2 gap-4">
                  <div class="rounded-lg bg-stone-100/25 p-3 text-center">
                    <div class="text-xs tracking-wide text-stone-500">铁料总储量</div>
                    <div class="mt-1 text-xl font-bold text-amber-800">{{ totalIron }} 块</div>
                  </div>
                  <div class="rounded-lg bg-stone-100/25 p-3 text-center">
                    <div class="text-xs tracking-wide text-stone-500">燃料总量</div>
                    <div class="mt-1 text-xl font-bold text-amber-800">{{ totalFuel }} 份</div>
                  </div>
                </div>
                <div class="mt-3 rounded-lg bg-amber-100/20 py-3 text-center">
                  <div class="text-xs tracking-[0.25em] text-stone-500">工部评价</div>
                  <div class="text-xl text-amber-900">『尚需精进』</div>
                </div>
              </div>
            </div>

          </section>

        </main>
      </div>

      <!-- ===== 冶炼完成遮罩 ===== -->
      <div v-if="showCompletion" class="completion-overlay" @click.self="showCompletion = false">
        <div class="completion-modal">
          <div class="completion-glow"></div>
          <div class="completion-seal">钢</div>
          <div class="completion-title">冶 炼 完 成</div>
          <div class="completion-subtitle">— SMELTING COMPLETE —</div>
          <div class="completion-desc">凡铁分生熟，生熟相和，炼成则钢。</div>
          <button @click="showCompletion = false" class="completion-btn">⟳ 重开炉火</button>
        </div>
      </div>

      <!-- ===== 页脚 ===== -->
      <footer class="mt-8 pt-5 pb-2 text-center">
        <p class="font-mono text-sm tracking-[0.25em] text-stone-600">
          ※ 应星曰：「贵五谷而贱金玉。」 ※ CYBER-WORKSHOP DEMO · 2026 ※
        </p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* ===== 宣纸噪点背景层 ===== */
.paper-bg {
  position: relative;
}
.paper-bg::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.35;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 200px 200px;
}
.paper-bg > * { position: relative; z-index: 1; }

/* ===== 玻璃卡片（高透轻薄雾面） ===== */
.glass-card {
  background: rgba(245, 240, 237, 0.25);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: none !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.03);
}

/* ===== 配方步骤 ===== */
.recipe-step {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0.85rem;
  transition: background 0.2s;
}
.recipe-step--idx {
  flex: 0 0 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: 'Noto Serif SC', ui-serif, Georgia, serif;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 0.25rem;
}
.recipe-step--name {
  flex: 1;
  font-family: 'Noto Serif SC', ui-serif, Georgia, serif;
  font-size: 1.2rem;
  letter-spacing: 0.06em;
}
.recipe-step--tag {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.15em;
}
.is-done .recipe-step--idx {
  background: rgba(4, 120, 87, 0.08);
  color: #047857;
}
.is-done .recipe-step--name { color: #047857; }
.is-done .recipe-step--tag { color: #047857; }
.is-active .recipe-step--idx {
  background: rgba(180, 83, 9, 0.08);
  color: #b45309;
  animation: softPulse 2s ease-in-out infinite;
}
.is-active .recipe-step--name { color: #92400e; font-weight: 600; }
.is-active .recipe-step--tag { color: #b45309; }
.is-pending .recipe-step--idx {
  background: rgba(120, 113, 108, 0.05);
  color: #78716c;
}
.is-pending .recipe-step--name { color: #78716c; }
.is-pending .recipe-step--tag { color: #a8a29e; }

@keyframes softPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(180, 83, 9, 0.25); }
  50% { box-shadow: 0 0 0 4px rgba(180, 83, 9, 0.06); }
}

/* ===== 剧情面板 ===== */
.story-box { position: relative; }
.story-text {
  font-family: 'Noto Serif SC', ui-serif, Georgia, 'Songti SC', serif;
  font-size: 1.15rem;
  color: #292524;
  line-height: 2.2;
  letter-spacing: 0.1em;
}
.story-text.is-typing::after {
  content: '▌';
  color: #b45309;
  margin-left: 2px;
  animation: blink 1s step-end infinite;
}
.story-end {
  color: rgba(180, 83, 9, 0.4);
  margin-left: 2px;
}
@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

/* ===== 操作按钮 ===== */
.action-btn {
  position: relative;
  display: block;
  width: 100%;
  text-align: left;
  cursor: pointer;
  padding: 1.5rem 1.5rem;
  background: rgba(245, 240, 237, 0.2);
  border: none;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}
.action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 0 2px rgba(180, 83, 9, 0.08), 0 6px 20px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}
.action-btn:active {
  transform: scale(0.98);
  transition: transform 0.08s ease;
}
.action-btn--icon {
  flex: 0 0 3.25rem;
  width: 3.25rem;
  height: 3.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 0.5rem;
}

/* ===== 操作按钮 Tooltip（赛博古籍注解） ===== */
.action-btn:not(:active)::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  max-width: 320px;
  width: max-content;
  padding: 0.75rem 1.25rem;
  background: rgba(28, 25, 23, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(180, 83, 9, 0.5);
  border-radius: 0.5rem;
  color: #f5f0ed;
  font-family: 'Noto Serif SC', ui-serif, Georgia, serif;
  font-size: 0.85rem;
  line-height: 1.6;
  letter-spacing: 0.08em;
  white-space: normal;
  text-align: left;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.25s ease, transform 0.25s ease;
  transform: translateX(-50%) translateY(4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(180, 83, 9, 0.15);
  z-index: 50;
}
.action-btn:not(:active)::before {
  content: '';
  position: absolute;
  bottom: calc(100% + 3px);
  left: 50%;
  transform: translateX(-50%);
  border: 7px solid transparent;
  border-top-color: rgba(28, 25, 23, 0.92);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.25s ease;
  z-index: 50;
}
.action-btn:hover::after {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
.action-btn:hover::before {
  opacity: 1;
}

/* ===== 日志面板 ===== */
.log-panel {
  max-height: 220px;
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  font-family: ui-monospace, SFMono-Regular, monospace;
}
.log-panel::-webkit-scrollbar { width: 3px; }
.log-panel::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.08); border-radius: 3px; }
.log-panel::-webkit-scrollbar-track { background: transparent; }
.log-line {
  display: flex;
  gap: 0.75rem;
  font-size: 1.05rem;
  line-height: 1.8;
}
.log-time {
  flex-shrink: 0;
  color: #b45309;
  font-weight: 600;
}
.log-info .log-text { color: #292524; }
.log-warn .log-text { color: #92400e; }
.log-good .log-text { color: #065f46; }

/* ===== 背包格子 ===== */
.item-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.85rem 0.4rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 0.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
}
.item-slot:hover:not(.item-slot--empty) {
  transform: translateY(-1px);
  box-shadow: 0 0 12px rgba(180, 83, 9, 0.06);
}
.item-slot--icon {
  width: 2.5rem;
  height: 2.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 0.5rem;
}
.item-slot--name {
  font-family: 'Noto Serif SC', ui-serif, Georgia, serif;
  font-size: 0.9rem;
  letter-spacing: 0.06em;
  color: #57534e;
}
.item-slot--qty {
  font-family: ui-monospace, monospace;
  font-size: 1.1rem;
  font-weight: 700;
  color: #b45309;
}
.item-slot--empty {
  color: #a8a29e;
}

/* ===== 冶炼完成遮罩 ===== */
.completion-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: fadeIn 0.4s ease;
}
.completion-modal {
  position: relative;
  text-align: center;
  padding: 3rem 4rem;
  background: rgba(245, 240, 237, 0.3);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: none;
  border-radius: 1rem;
  box-shadow: 0 0 80px rgba(180, 83, 9, 0.15), 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}
.completion-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(180, 83, 9, 0.12) 0%, transparent 70%);
  pointer-events: none;
}
.completion-seal {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  margin-bottom: 1.5rem;
  font-family: 'Noto Serif SC', ui-serif, Georgia, serif;
  font-size: 2.5rem;
  font-weight: 900;
  color: #b45309;
  border: none;
  border-radius: 50%;
  background: rgba(180, 83, 9, 0.08);
  animation: sealGlow 2s ease-in-out infinite;
}
.completion-title {
  position: relative;
  font-family: 'Noto Serif SC', ui-serif, Georgia, serif;
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: 0.5em;
  color: #292524;
  margin-bottom: 0.5rem;
}
.completion-subtitle {
  position: relative;
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.25em;
  color: #78716c;
  margin-bottom: 1.25rem;
}
.completion-desc {
  position: relative;
  font-family: 'Noto Serif SC', ui-serif, Georgia, serif;
  font-size: 1.1rem;
  letter-spacing: 0.1em;
  color: #57534e;
  margin-bottom: 2rem;
  font-style: italic;
}
.completion-btn {
  position: relative;
  display: inline-block;
  padding: 0.75rem 2.5rem;
  font-family: 'Noto Serif SC', ui-serif, Georgia, serif;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: #b45309;
  background: rgba(180, 83, 9, 0.08);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}
.completion-btn:hover {
  background: rgba(180, 83, 9, 0.15);
  box-shadow: 0 0 20px rgba(180, 83, 9, 0.15);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes sealGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(180, 83, 9, 0.3); }
  50% { box-shadow: 0 0 0 12px rgba(180, 83, 9, 0.05); }
}
</style>