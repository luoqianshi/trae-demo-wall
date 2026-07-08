<script setup>
import { ref, onMounted, computed } from 'vue'
import { getPortfolioState, getHedgeEvents } from '../api'

const events = ref([])
const state = ref({
  savedMoney: 0,
  totalDecisions: 0,
})
const loading = ref(true)

const fetchData = async () => {
  try {
    const [stateRes, eventsRes] = await Promise.all([getPortfolioState(), getHedgeEvents()])
    state.value = stateRes.data
    events.value = eventsRes.data
  } catch (e) {
    console.error('获取成就数据失败', e)
  } finally {
    loading.value = false
  }
}

const acceptedCount = computed(() => events.value.filter(e => e.decisionStatus === 'ACCEPTED_HEDGE').length)
const rejectedCount = computed(() => events.value.filter(e => e.decisionStatus === 'REJECTED_HEDGE').length)

const badges = computed(() => [
  {
    id: 'first-win',
    title: '初识理性',
    subtitle: 'First Win',
    icon: '🌱',
    condition: acceptedCount.value >= 1,
    desc: '完成第一次成功对冲',
    progress: Math.min(acceptedCount.value / 1, 1),
  },
  {
    id: 'triple-win',
    title: '三连克制',
    subtitle: 'Triple Win',
    icon: '🔥',
    condition: acceptedCount.value >= 3,
    desc: '成功拦截 3 次冲动消费',
    progress: Math.min(acceptedCount.value / 3, 1),
  },
  {
    id: 'money-saver',
    title: '省钱小能手',
    subtitle: 'Money Saver',
    icon: '💰',
    condition: (state.value.savedMoney || 0) >= 1000,
    desc: '累计成功省下 1000 元',
    progress: Math.min((state.value.savedMoney || 0) / 1000, 1),
  },
  {
    id: 'big-save',
    title: '大额拦截者',
    subtitle: 'Big Save',
    icon: '🛡️',
    condition: events.value.some(e => e.decisionStatus === 'ACCEPTED_HEDGE' && e.amount >= 2000),
    desc: '成功拦截一笔 2000 元以上的大额冲动',
    progress: events.value.some(e => e.decisionStatus === 'ACCEPTED_HEDGE' && e.amount >= 2000) ? 1 : 0,
  },
  {
    id: 'ten-battles',
    title: '身经百战',
    subtitle: 'Veteran',
    icon: '⚔️',
    condition: (state.value.totalDecisions || 0) >= 10,
    desc: '累计完成 10 次对冲决策',
    progress: Math.min((state.value.totalDecisions || 0) / 10, 1),
  },
  {
    id: 'perfect-week',
    title: '理性大师',
    subtitle: 'Master',
    icon: '📅',
    condition: rejectedCount.value === 0 && acceptedCount.value >= 5,
    desc: '完成 5 次以上决策且无一笔冲动消费',
    progress: rejectedCount.value === 0 ? Math.min(acceptedCount.value / 5, 1) : 0,
  },
])

const unlockedCount = computed(() => badges.value.filter(b => b.condition).length)

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="min-h-screen w-full p-4 md:p-6 flex flex-col gap-5">
    <!-- 顶部标题区 -->
    <header class="glass-panel p-6 relative overflow-hidden group">
      <div class="absolute top-0 right-0 w-64 h-64 bg-terminal-cyan/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-terminal-cyan/10 transition-colors duration-700" />
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-terminal-cyan/15 border border-terminal-cyan/30 flex items-center justify-center">
            <svg class="w-5 h-5 text-terminal-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-white">
              修行大厅 <span class="text-terminal-cyan text-lg font-normal">Achievements</span>
            </h1>
            <p class="text-sm text-slate-400">把每一次克制，都变成一枚勋章</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <div class="text-3xl font-bold text-terminal-green font-mono">{{ unlockedCount }}/{{ badges.length }}</div>
            <div class="text-xs text-slate-500 font-mono">已解锁勋章</div>
          </div>
          <div class="w-14 h-14 rounded-full border-4 border-slate-700 relative">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                class="text-slate-700"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="text-terminal-green"
                :stroke-dasharray="`${(unlockedCount / badges.length) * 100}, 100`"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
              />
            </svg>
          </div>
        </div>
      </div>
    </header>

    <!-- 数据概览 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="metric-card p-4 text-center hover:-translate-y-0.5 hover:border-terminal-green/30 transition-all duration-300">
        <div class="text-2xl font-bold text-terminal-green font-mono">{{ acceptedCount }}</div>
        <div class="text-xs text-slate-400">成功拦截</div>
      </div>
      <div class="metric-card p-4 text-center hover:-translate-y-0.5 hover:border-terminal-red/30 transition-all duration-300">
        <div class="text-2xl font-bold text-terminal-red font-mono">{{ rejectedCount }}</div>
        <div class="text-xs text-slate-400">冲动消费</div>
      </div>
      <div class="metric-card p-4 text-center hover:-translate-y-0.5 hover:border-terminal-cyan/30 transition-all duration-300">
        <div class="text-2xl font-bold text-terminal-cyan font-mono">¥{{ state.savedMoney || 0 }}</div>
        <div class="text-xs text-slate-400">累计省下</div>
      </div>
      <div class="metric-card p-4 text-center hover:-translate-y-0.5 hover:border-terminal-amber/30 transition-all duration-300">
        <div class="text-2xl font-bold text-terminal-amber font-mono">{{ state.totalDecisions || 0 }}</div>
        <div class="text-xs text-slate-400">总决策数</div>
      </div>
    </div>

    <!-- 徽章墙 -->
    <main class="flex-1 glass-panel p-5 md:p-6">
      <div v-if="loading" class="text-center text-slate-500 py-20 font-mono">
        加载成就数据中...
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div
          v-for="badge in badges"
          :key="badge.id"
          class="relative p-5 rounded-xl border transition-all duration-300 group overflow-hidden"
          :class="badge.condition
            ? 'bg-gradient-to-br from-terminal-cyan/10 to-transparent border-terminal-cyan/40 shadow-glow hover:-translate-y-1'
            : 'bg-slate-800/30 border-slate-700/30 opacity-70 hover:opacity-100 hover:-translate-y-0.5'"
        >
          <!-- 未解锁遮罩 -->
          <div v-if="!badge.condition" class="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] z-0" />

          <div class="relative z-10">
            <div class="flex items-start gap-4 mb-4">
              <div
                class="text-4xl transition-transform duration-300 group-hover:scale-110"
                :class="badge.condition ? 'grayscale-0' : 'grayscale'"
              >
                {{ badge.icon }}
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-white" :class="badge.condition ? 'group-hover:text-terminal-cyan transition-colors' : ''">
                  {{ badge.title }}
                </h3>
                <div class="text-xs text-slate-500 font-mono mb-1">{{ badge.subtitle }}</div>
                <p class="text-sm text-slate-300">{{ badge.desc }}</p>
              </div>
            </div>

            <!-- 进度条 -->
            <div class="mb-3">
              <div class="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>进度</span>
                <span>{{ Math.round(badge.progress * 100) }}%</span>
              </div>
              <div class="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-700"
                  :class="badge.condition ? 'bg-gradient-to-r from-terminal-green to-terminal-cyan' : 'bg-slate-500'"
                  :style="{ width: `${badge.progress * 100}%` }"
                />
              </div>
            </div>

            <div class="flex items-center justify-between">
              <div
                class="text-xs font-mono px-2 py-1 rounded"
                :class="badge.condition ? 'bg-terminal-green/10 text-terminal-green' : 'bg-slate-700 text-slate-400'"
              >
                {{ badge.condition ? '已解锁 // UNLOCKED' : '未解锁 // LOCKED' }}
              </div>
              <div
                v-if="badge.condition"
                class="w-2 h-2 rounded-full bg-terminal-green animate-pulse-fast"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
