<script setup>
import { ref, onMounted, computed } from 'vue'
import { getHedgeEvents } from '../api'

const events = ref([])
const loading = ref(true)
const filter = ref('ALL')

const fetchEvents = async () => {
  try {
    const res = await getHedgeEvents()
    events.value = res.data
  } catch (e) {
    console.error('获取历史记录失败', e)
  } finally {
    loading.value = false
  }
}

const filteredEvents = computed(() => {
  if (filter.value === 'ALL') return events.value
  return events.value.filter(e => e.decisionStatus === filter.value)
})

const filterOptions = [
  { value: 'ALL', label: '全部', count: () => events.value.length },
  { value: 'ACCEPTED_HEDGE', label: '成功拦截', count: () => events.value.filter(e => e.decisionStatus === 'ACCEPTED_HEDGE').length },
  { value: 'REJECTED_HEDGE', label: '冲动消费', count: () => events.value.filter(e => e.decisionStatus === 'REJECTED_HEDGE').length },
]

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return {
    date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    year: date.getFullYear(),
  }
}

const statusConfig = (status) => {
  const configs = {
    ACCEPTED_HEDGE: {
      label: '成功拦截',
      colorClass: 'text-terminal-green',
      bg: 'bg-terminal-green/10',
      border: 'border-terminal-green/30',
      hoverBorder: 'hover:border-terminal-green/60',
      hoverBg: 'hover:bg-terminal-green/15',
      nodeBorder: 'border-terminal-green',
      glow: 'shadow-glow-green',
      icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    REJECTED_HEDGE: {
      label: '冲动消费',
      colorClass: 'text-terminal-red',
      bg: 'bg-terminal-red/10',
      border: 'border-terminal-red/30',
      hoverBorder: 'hover:border-terminal-red/60',
      hoverBg: 'hover:bg-terminal-red/15',
      nodeBorder: 'border-terminal-red',
      glow: 'shadow-glow-red',
      icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    },
    PENDING: {
      label: '待决策',
      colorClass: 'text-slate-400',
      bg: 'bg-slate-700/30',
      border: 'border-slate-600/30',
      hoverBorder: 'hover:border-slate-500/60',
      hoverBg: 'hover:bg-slate-700/40',
      nodeBorder: 'border-slate-400',
      glow: '',
      icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  }
  return configs[status] || configs.PENDING
}

onMounted(() => {
  fetchEvents()
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
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-white">
              复盘时光机 <span class="text-terminal-cyan text-lg font-normal">Timeline</span>
            </h1>
            <p class="text-sm text-slate-400">回顾每一次冲动，看见理性的增长轨迹</p>
          </div>
        </div>
        <div class="text-xs font-mono text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/30">
          共 <span class="text-terminal-cyan">{{ events.length }}</span> 条记录
        </div>
      </div>
    </header>

    <!-- 时间轴 -->
    <main class="flex-1 glass-panel p-4 md:p-8 overflow-y-auto">
      <!-- 筛选器 -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button
          v-for="option in filterOptions"
          :key="option.value"
          @click="filter = option.value"
          class="px-4 py-2 rounded-lg text-xs font-mono border transition-all duration-200"
          :class="filter === option.value
            ? 'bg-terminal-cyan/15 border-terminal-cyan/40 text-terminal-cyan shadow-glow'
            : 'bg-slate-800/30 border-slate-700/30 text-slate-400 hover:border-slate-500/50'"
        >
          {{ option.label }}
          <span class="ml-1.5 px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">{{ option.count() }}</span>
        </button>
      </div>

      <div v-if="loading" class="text-center text-slate-500 py-20 font-mono">
        加载历史记录中...
      </div>

      <div v-else-if="filteredEvents.length === 0" class="text-center text-slate-500 py-20">
        <div class="text-5xl mb-4 opacity-50">🕳️</div>
        <p class="font-mono text-sm">该筛选条件下暂无记录</p>
      </div>

      <div v-else class="relative max-w-4xl mx-auto">
        <!-- 中轴线 -->
        <div class="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-terminal-cyan/40 via-slate-600 to-terminal-cyan/20 md:-translate-x-1/2" />

        <div class="space-y-8 md:space-y-12">
          <div
            v-for="(event, index) in filteredEvents"
            :key="event.id"
            class="relative flex items-start md:items-center"
            :class="index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'"
          >
            <!-- 节点 -->
            <div class="absolute left-4 md:left-1/2 top-0 md:top-1/2 w-4 h-4 -translate-x-1/2 md:-translate-y-1/2 z-10">
              <div
                class="w-full h-full rounded-full border-2 transition-all duration-300 hover:scale-150 cursor-pointer"
                :class="[
                  statusConfig(event.decisionStatus).bg,
                  statusConfig(event.decisionStatus).border,
                  statusConfig(event.decisionStatus).nodeBorder,
                  statusConfig(event.decisionStatus).glow,
                ]"
              />
            </div>

            <!-- 内容卡片 -->
            <div class="pl-12 md:pl-0 w-full md:w-[calc(50%-2rem)]" :class="index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'">
              <div
                class="metric-card p-4 md:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow group cursor-pointer"
                :class="[statusConfig(event.decisionStatus).hoverBorder, statusConfig(event.decisionStatus).hoverBg]"
              >
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="text-terminal-cyan font-mono font-bold text-lg">¥{{ event.amount }}</span>
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1"
                      :class="[statusConfig(event.decisionStatus).bg, statusConfig(event.decisionStatus).colorClass]"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" :d="statusConfig(event.decisionStatus).icon" />
                      </svg>
                      {{ statusConfig(event.decisionStatus).label }}
                    </span>
                  </div>
                  <div class="text-right text-xs text-slate-500 font-mono">
                    <div class="text-terminal-cyan">{{ formatDate(event.createdAt).date }}</div>
                    <div>{{ formatDate(event.createdAt).time }}</div>
                  </div>
                </div>

                <p class="text-slate-200 text-sm mb-3 leading-relaxed">{{ event.originalIntention }}</p>

                <div v-if="event.hedgeSuggestion" class="text-xs leading-relaxed p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30 group-hover:border-terminal-green/20 transition-colors">
                  <span class="text-terminal-green font-mono">平替方案 &gt;</span>
                  <span class="text-slate-300 ml-1">{{ event.hedgeSuggestion }}</span>
                </div>
              </div>
            </div>

            <!-- 另一侧占位（桌面端） -->
            <div class="hidden md:block w-[calc(50%-2rem)]" :class="index % 2 === 0 ? 'pl-8' : 'pr-8'" />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
