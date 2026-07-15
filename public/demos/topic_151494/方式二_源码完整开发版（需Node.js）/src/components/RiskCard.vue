<script setup lang="ts">
import { computed } from 'vue'
import { ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-vue-next'

type RiskLevel = 'safe' | 'low' | 'medium' | 'high'

const props = defineProps<{
  level: RiskLevel
  score?: number
  title?: string
  description?: string
  matchedKeywords?: string[]
  analysisItems?: { name: string; status: 'done' | 'analyzing' | 'pending'; result?: string }[]
}>()

const levelConfig = computed(() => {
  const configs = {
    safe: {
      label: '安全',
      gradient: 'from-green-400 via-emerald-400 to-teal-400',
      bg: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50',
      border: 'border-elder-green/40',
      text: 'text-elder-green',
      ring: 'ring-elder-green/30',
      iconBg: 'bg-gradient-to-br from-elder-green to-emerald-500',
      icon: ShieldCheck
    },
    low: {
      label: '提醒',
      gradient: 'from-blue-400 via-sky-400 to-cyan-400',
      bg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50',
      border: 'border-elder-blue/40',
      text: 'text-elder-blue',
      ring: 'ring-elder-blue/30',
      iconBg: 'bg-gradient-to-br from-elder-blue to-sky-500',
      icon: AlertTriangle
    },
    medium: {
      label: '警告',
      gradient: 'from-amber-400 via-orange-400 to-yellow-400',
      bg: 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50',
      border: 'border-elder-warn/40',
      text: 'text-elder-warn',
      ring: 'ring-elder-warn/30',
      iconBg: 'bg-gradient-to-br from-elder-warn to-orange-400',
      icon: AlertTriangle
    },
    high: {
      label: '危险',
      gradient: 'from-red-400 via-rose-400 to-pink-400',
      bg: 'bg-gradient-to-br from-red-50 via-rose-50 to-pink-50',
      border: 'border-elder-red/40',
      text: 'text-elder-red',
      ring: 'ring-elder-red/30',
      iconBg: 'bg-gradient-to-br from-elder-red to-rose-500',
      icon: ShieldAlert
    }
  }
  return configs[props.level]
})

const defaultTitle = computed(() => {
  const titles = {
    safe: '✅ 内容安全，请放心观看',
    low: '⚠️ 需要留意部分内容',
    medium: '🚨 存在风险因素，请谨慎',
    high: '🛑 高度危险！请勿相信！'
  }
  return props.title || titles[props.level]
})
</script>

<template>
  <div
    class="risk-card p-6 md:p-8 rounded-elder-2xl border-2 shadow-lg transition-all duration-300"
    :class="[levelConfig.bg, levelConfig.border, `ring-1 ${levelConfig.ring}`]"
  >
    <div class="flex items-start gap-6 flex-wrap">
      <div
        class="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shrink-0 shadow-xl text-white relative overflow-hidden"
        :class="levelConfig.iconBg"
      >
        <div class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        <component
          :is="levelConfig.icon"
          class="w-10 h-10 md:w-12 md:h-12 relative z-10"
          :stroke-width="2"
        />
        <div
          v-if="level === 'high' || level === 'medium'"
          class="absolute inset-0 rounded-full animate-ping opacity-30 bg-white"
        ></div>
      </div>

      <div class="flex-1 min-w-[260px]">
        <div class="flex items-center gap-4 flex-wrap mb-4">
          <div
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-black shadow-lg text-elder-sm"
            :class="`bg-gradient-to-r ${levelConfig.gradient}`"
          >
            <span class="text-xl">{{ levelConfig.label }}</span>
          </div>
          <div
            v-if="score !== undefined"
            class="elder-chip bg-white shadow-sm border-2 font-bold text-elder-sm"
            :class="levelConfig.border"
          >
            风险评分：<span :class="levelConfig.text">{{ score }}/100</span>
          </div>
        </div>

        <div class="text-elder-lg md:text-elder-xl font-black text-elder-ink mb-3">
          {{ defaultTitle }}
        </div>

        <div
          v-if="description"
          class="text-elder-sm text-elder-ink leading-10 mb-4"
        >
          {{ description }}
        </div>

        <div
          v-if="matchedKeywords && matchedKeywords.length"
          class="flex flex-wrap gap-2 mb-5"
        >
          <span
            v-for="kw in matchedKeywords"
            :key="kw"
            class="px-4 py-2 rounded-elder bg-white border-2 font-bold text-elder-sm shadow-sm"
            :class="[levelConfig.border, levelConfig.text]"
          >
            ❌ {{ kw }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="analysisItems && analysisItems.length" class="mt-8 pt-6 border-t-2 border-white/60">
      <div class="text-elder-base font-bold text-elder-ink mb-5 flex items-center gap-3">
        <span class="emoji-icon text-3xl">🔍</span>
        AI 智能分析详情
      </div>
      <div class="grid md:grid-cols-3 gap-4">
        <div
          v-for="(item, i) in analysisItems"
          :key="i"
          class="p-5 rounded-elder-xl bg-white/70 border-2 transition-all duration-300"
          :class="{
            'border-elder-green/40 shadow-sm': item.status === 'done',
            'border-elder-orange/40 animate-pulse-soft': item.status === 'analyzing',
            'border-gray-200 opacity-60': item.status === 'pending'
          }"
        >
          <div class="flex items-center gap-3 mb-2">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-xl"
              :class="{
                'bg-elder-green': item.status === 'done',
                'bg-elder-orange': item.status === 'analyzing',
                'bg-gray-300': item.status === 'pending'
              }"
            >
              <CheckCircle2 v-if="item.status === 'done'" class="w-6 h-6" :stroke-width="2" />
              <div v-else-if="item.status === 'analyzing'" class="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin"></div>
              <span v-else>·</span>
            </div>
            <div class="text-elder-sm font-bold text-elder-ink">{{ item.name }}</div>
          </div>
          <div class="text-elder-xs text-elder-muted leading-8 ml-13 pl-13">
            <template v-if="item.status === 'done' && item.result">
              分析结果：<span class="font-semibold" :class="item.result.includes('风险') ? 'text-elder-red' : 'text-elder-green'">{{ item.result }}</span>
            </template>
            <template v-else-if="item.status === 'analyzing'">
              AI深度分析中...
            </template>
            <template v-else>
              等待分析
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ml-13 { margin-left: 3.25rem; }
</style>
