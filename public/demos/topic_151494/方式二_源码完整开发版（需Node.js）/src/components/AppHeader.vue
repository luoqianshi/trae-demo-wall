<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Home, CircleUserRound } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'

const route = useRoute()
const router = useRouter()
const settings = useSettingsStore()

const title = computed(() => (route.meta?.title as string) || '')
const isHome = computed(() => route.path === '/')

const modeLabel = computed(() => {
  const m = settings.settings.currentMode
  return m === 'elder' ? '长辈模式' : m === 'child' ? '子女模式' : '社区模式'
})
const modeClass = computed(() => {
  const m = settings.settings.currentMode
  return m === 'elder'
    ? 'bg-elder-orange/15 text-elder-orange'
    : m === 'child'
      ? 'bg-elder-blue/15 text-elder-blue'
      : 'bg-elder-green/15 text-elder-green'
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <header
    class="sticky top-0 z-40 backdrop-blur-xl bg-elder-cream/90 border-b border-orange-100/80"
  >
    <div class="max-w-[1200px] mx-auto px-6 md:px-10 h-[96px] flex items-center gap-4">
      <button
        v-if="!isHome"
        @click="goBack"
        class="flex items-center gap-2 min-w-[120px] h-16 px-5 rounded-elder bg-white border border-orange-100 shadow-elder active:shadow-elder-active transition-all"
      >
        <ChevronLeft class="w-8 h-8 text-elder-orange" :stroke-width="2.5" />
        <span class="text-elder-sm font-semibold text-elder-ink">返回</span>
      </button>

      <div v-else class="flex items-center gap-3 min-w-[160px]">
        <div class="w-14 h-14 rounded-elder bg-gradient-to-br from-elder-orange to-elder-red flex items-center justify-center text-3xl shadow-elder-orange">
          👴
        </div>
        <div class="leading-tight">
          <div class="text-elder-base font-bold text-elder-ink">银龄AI助手</div>
          <div class="text-elder-xs text-elder-muted">「小银」· 银发抖音简易助手</div>
        </div>
      </div>

      <h1 class="flex-1 text-center text-elder-lg font-bold text-elder-ink truncate">
        {{ isHome ? '' : title }}
      </h1>

      <div class="flex items-center gap-3">
        <button
          @click="router.push('/')"
          v-if="!isHome"
          class="h-16 w-16 flex items-center justify-center rounded-elder bg-white border border-orange-100 shadow-elder active:scale-95 transition-all"
          title="首页"
        >
          <Home class="w-8 h-8 text-elder-orange" :stroke-width="2.2" />
        </button>

        <button
          @click="settings.toggleMode()"
          class="h-16 px-5 flex items-center gap-2 rounded-elder border-2 transition-all shadow-elder active:scale-95"
          :class="modeClass"
          :title="'当前：' + modeLabel"
        >
          <CircleUserRound class="w-7 h-7" :stroke-width="2" />
          <span class="text-elder-sm font-bold">{{ modeLabel }}</span>
        </button>
      </div>
    </div>
  </header>
</template>
