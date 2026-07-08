<script setup>
import { ref, onMounted, computed } from 'vue'
import { getAlternatives, useAlternative, getAlternativeRanking } from '../api'

const alternatives = ref([])
const ranking = ref([])
const loading = ref(true)
const usingTitle = ref('')

const fetchData = async () => {
  try {
    const [altRes, rankRes] = await Promise.all([getAlternatives(), getAlternativeRanking()])
    alternatives.value = altRes.data
    ranking.value = rankRes.data
  } catch (e) {
    console.error('获取平替方案失败', e)
  } finally {
    loading.value = false
  }
}

const handleUse = async (title) => {
  usingTitle.value = title
  try {
    await useAlternative(title)
    await fetchData()
  } catch (e) {
    alert('采用失败：' + (e.response?.data?.message || e.message))
  } finally {
    usingTitle.value = ''
  }
}

const totalUsers = computed(() => ranking.value.reduce((sum, item) => sum + (item.usageCount || 0), 0))
const avgDopamine = computed(() => {
  if (alternatives.value.length === 0) return 0
  return Math.round(alternatives.value.reduce((sum, item) => sum + (item.dopamine || 0), 0) / alternatives.value.length)
})

const topThree = computed(() => ranking.value.slice(0, 3))

const rankMedal = (index) => {
  const medals = ['🥇', '🥈', '🥉']
  return medals[index] || `${index + 1}.`
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="min-h-screen w-full p-4 md:p-6 flex flex-col gap-5">
    <!-- 顶部标题区 -->
    <header class="glass-panel p-6 relative overflow-hidden group">
      <div class="absolute top-0 right-0 w-64 h-64 bg-terminal-cyan/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-terminal-cyan/10 transition-colors duration-700" />
      <div class="relative z-10">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-terminal-cyan/15 border border-terminal-cyan/30 flex items-center justify-center">
            <svg class="w-5 h-5 text-terminal-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48zM12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
            </svg>
          </div>
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-white">
              平替市场 <span class="text-terminal-cyan text-lg font-normal">Market</span>
            </h1>
            <p class="text-sm text-slate-400">用零成本或低成本的高多巴胺活动，替代冲动消费</p>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
          <div class="metric-card p-3 flex items-center gap-3">
            <div class="text-2xl font-bold text-terminal-cyan font-mono">{{ alternatives.length }}</div>
            <div class="text-xs text-slate-400">可用方案</div>
          </div>
          <div class="metric-card p-3 flex items-center gap-3">
            <div class="text-2xl font-bold text-terminal-green font-mono">{{ totalUsers.toLocaleString() }}</div>
            <div class="text-xs text-slate-400">累计应用人次</div>
          </div>
          <div class="metric-card p-3 flex items-center gap-3 hidden md:flex">
            <div class="text-2xl font-bold text-terminal-amber font-mono">{{ avgDopamine }}%</div>
            <div class="text-xs text-slate-400">平均快乐指数</div>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-5">
      <!-- 左侧：方案网格 -->
      <section class="xl:col-span-3">
        <div v-if="loading" class="text-center text-slate-500 py-20 font-mono glass-panel">
          加载平替方案中...
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
          <div
            v-for="(item, index) in alternatives"
            :key="index"
            class="glass-panel p-5 relative overflow-hidden group hover:-translate-y-1 hover:shadow-glow transition-all duration-300"
            :style="{ transitionDelay: `${index * 50}ms` }"
          >
            <!-- 顶部发光条 -->
            <div
              class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-terminal-cyan to-terminal-green opacity-60 group-hover:opacity-100 transition-opacity"
            />

            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-lg font-bold text-white group-hover:text-terminal-cyan transition-colors duration-300">
                  {{ item.title }}
                </h3>
                <div class="text-xs text-slate-500 font-mono mt-0.5">{{ item.subtitle }}</div>
              </div>
              <div class="text-terminal-green font-mono font-bold bg-terminal-green/10 px-2 py-1 rounded border border-terminal-green/20">
                {{ item.cost }}
              </div>
            </div>

            <p class="text-sm text-slate-300 mb-4 leading-relaxed min-h-[40px]">{{ item.desc }}</p>

            <!-- 快乐指数 -->
            <div class="mb-4">
              <div class="flex justify-between text-xs text-slate-400 mb-1.5">
                <span class="font-mono">快乐指数</span>
                <span class="font-mono text-terminal-green">{{ item.dopamine }}%</span>
              </div>
              <div class="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-terminal-cyan to-terminal-green rounded-full transition-all duration-700 ease-out group-hover:brightness-110"
                  :style="{ width: `${item.dopamine}%` }"
                />
              </div>
            </div>

            <!-- 标签 -->
            <div class="flex flex-wrap gap-1.5 mb-4">
              <span
                v-for="tag in item.tags"
                :key="tag"
                class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-700/50 text-slate-300 border border-slate-600/30 group-hover:border-terminal-cyan/30 group-hover:text-terminal-cyan transition-colors"
              >
                {{ tag }}
              </span>
            </div>

            <!-- 应用人数 -->
            <div class="flex items-center justify-between mb-4 p-2 rounded-lg bg-slate-800/40">
              <div class="flex items-center gap-2">
                <div class="flex -space-x-1.5">
                  <div
                    v-for="n in 3"
                    :key="n"
                    class="w-6 h-6 rounded-full bg-gradient-to-br from-terminal-cyan to-terminal-green border-2 border-slate-800 opacity-80"
                  />
                </div>
                <span class="text-xs text-slate-400">
                  <span class="text-terminal-amber font-mono font-bold">{{ item.usageCount }}</span> 人已应用
                </span>
              </div>
            </div>

            <button
              @click="handleUse(item.title)"
              :disabled="usingTitle === item.title"
              class="w-full py-2.5 rounded-lg btn-hedge font-mono text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ usingTitle === item.title ? '记录中...' : '采用此方案 // USE' }}
            </button>
          </div>
        </div>
      </section>

      <!-- 右侧：排行榜 -->
      <aside class="xl:col-span-1">
        <div class="glass-panel p-5 sticky top-4">
          <div class="flex items-center gap-2 mb-4">
            <svg class="w-5 h-5 text-terminal-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <h2 class="text-lg font-bold text-white">应用排行榜</h2>
          </div>

          <div v-if="loading" class="text-center text-slate-500 py-10 font-mono text-xs">
            加载中...
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(item, index) in topThree"
              :key="item.title"
              class="metric-card p-3 flex items-center gap-3 border-l-4 transition-all duration-300 hover:-translate-x-1 cursor-pointer"
              :class="{
                'border-l-terminal-yellow bg-terminal-yellow/5': index === 0,
                'border-l-slate-300 bg-slate-700/20': index === 1,
                'border-l-amber-600 bg-amber-900/10': index === 2,
              }"
            >
              <div class="text-2xl">{{ rankMedal(index) }}</div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-bold text-white truncate">{{ item.title }}</div>
                <div class="text-xs text-slate-400 font-mono">{{ item.usageCount }} 人应用</div>
              </div>
            </div>

            <div class="border-t border-slate-700/30 pt-3 mt-3">
              <div
                v-for="(item, index) in ranking.slice(3, 8)"
                :key="item.title"
                class="flex items-center justify-between py-2 text-sm hover:bg-white/5 px-2 rounded transition-colors"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-slate-500 font-mono w-6">{{ index + 4 }}.</span>
                  <span class="text-slate-300 truncate">{{ item.title }}</span>
                </div>
                <span class="text-terminal-amber font-mono text-xs">{{ item.usageCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>
