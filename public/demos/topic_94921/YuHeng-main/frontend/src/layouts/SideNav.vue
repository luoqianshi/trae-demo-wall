<script setup>
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const navItems = [
  { path: '/dashboard', title: '主控台', subtitle: 'Dashboard' },
  { path: '/market', title: '平替市场', subtitle: 'Market' },
  { path: '/timeline', title: '复盘时光机', subtitle: 'Timeline' },
  { path: '/achievements', title: '修行大厅', subtitle: 'Achievements' },
]

const isActive = (path) => route.path === path
</script>

<template>
  <aside class="w-20 lg:w-64 flex-shrink-0 glass-panel flex flex-col justify-between m-4 mr-0">
    <div>
      <!-- Logo -->
      <div class="p-5 border-b border-terminal-border/30">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-terminal-cyan/20 border border-terminal-cyan/40 flex items-center justify-center">
            <svg class="w-5 h-5 text-terminal-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div class="hidden lg:block">
            <div class="text-white font-bold text-sm leading-tight">MindHedge</div>
            <div class="text-[10px] text-slate-400 font-mono">心智对冲引擎</div>
          </div>
        </div>
      </div>

      <!-- Nav Items -->
      <nav class="p-3 space-y-2">
        <button
          v-for="item in navItems"
          :key="item.path"
          @click="router.push(item.path)"
          class="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group"
          :class="isActive(item.path)
            ? 'bg-terminal-cyan/15 border border-terminal-cyan/30 text-terminal-cyan shadow-glow'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" :d="item.path === '/dashboard'
              ? 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z'
              : item.path === '/market'
                ? 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48zM12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z'
                : item.path === '/timeline'
                  ? 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z'
                  : 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z'" />
          </svg>
          <div class="hidden lg:block text-left">
            <div class="text-sm font-medium">{{ item.title }}</div>
            <div class="text-[10px] font-mono opacity-60">{{ item.subtitle }}</div>
          </div>
        </button>
      </nav>
    </div>

    <!-- Footer -->
    <div class="p-4 border-t border-terminal-border/30 hidden lg:block">
      <div class="text-[10px] text-slate-500 font-mono">
        MindHedge v1.0 // AI 创造力大赛
      </div>
    </div>
  </aside>
</template>
