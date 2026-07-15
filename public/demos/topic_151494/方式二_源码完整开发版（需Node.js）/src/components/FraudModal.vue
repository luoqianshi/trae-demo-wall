<script setup lang="ts">
import { computed } from 'vue'
import type { FraudDetectResult } from '@/types'

const props = defineProps<{
  result: FraudDetectResult | null
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'report'): void
  (e: 'retry'): void
}>()

function onClose() {
  emit('close')
}

function onReport() {
  emit('report')
}

function onRetry() {
  emit('retry')
}

const level = computed(() => {
  const lv = props.result?.riskLevel ?? 'safe'
  if (lv === 'high') return { label: '高风险', icon: '🚨', barBg: 'from-red-600 via-red-500 to-orange-500', headColor: 'text-red-600', chipBg: 'bg-red-100', chipBorder: 'border-red-400' }
  if (lv === 'medium') return { label: '中风险', icon: '⚠️', barBg: 'from-orange-600 via-orange-500 to-amber-500', headColor: 'text-orange-600', chipBg: 'bg-orange-100', chipBorder: 'border-orange-400' }
  if (lv === 'low') return { label: '低风险', icon: '⚡', barBg: 'from-sky-600 via-sky-500 to-indigo-500', headColor: 'text-sky-600', chipBg: 'bg-sky-100', chipBorder: 'border-sky-400' }
  return { label: '安全', icon: '✅', barBg: 'from-emerald-600 via-emerald-500 to-teal-500', headColor: 'text-emerald-600', chipBg: 'bg-emerald-100', chipBorder: 'border-emerald-400' }
})

const headBg = computed(() => 'bg-gradient-to-r ' + level.value.barBg + ' text-white')

const barStyle = computed(() => ({ width: (props.result?.score ?? 0) + '%' }))

const xiaoYinTips = computed(() => [
  '不要点击陌生链接',
  '不要向陌生账户转账',
  '如遇诈骗请拨打96110'
])
</script>

<template>
  <div v-if="visible && result" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="onClose"></div>

    <div class="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
      <div :class="[headBg, 'px-8 py-10']">
        <button class="absolute top-5 right-5 h-12 w-12 rounded-full bg-white/20 text-white text-2xl font-bold border border-white/30 hover:bg-white/30 transition" @click="onClose">✕</button>

        <div class="flex items-center gap-6">
          <div class="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur border-2 border-white/30 flex items-center justify-center text-6xl shadow-lg">
            {{ level.icon }}
          </div>
          <div>
            <div class="text-lg font-semibold opacity-90 mb-2">🤖 小银AI反诈检测结果</div>
            <div class="text-3xl font-black">
              <span v-if="result.isRisk">检测到风险！</span>
              <span v-else>内容安全</span>
            </div>
            <div class="mt-3 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/25 backdrop-blur border border-white/30">
              <span class="text-sm font-bold">风险等级：</span>
              <span class="text-2xl font-black">{{ level.label }}</span>
              <span class="text-2xl font-black ml-2">· {{ result.score }}%</span>
            </div>
          </div>
        </div>

        <div class="mt-8 h-5 rounded-full bg-white/20 overflow-hidden shadow-inner">
          <div class="h-full bg-white rounded-full transition-all duration-700 relative overflow-hidden" :style="barStyle">
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_1.2s_infinite]"></div>
          </div>
        </div>
      </div>

      <div class="p-8 md:p-10 space-y-8">
        <div class="rounded-2xl bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 p-6 md:p-7">
          <div class="flex items-center gap-3 mb-4">
            <span class="text-3xl">📋</span>
            <div class="text-xl font-black text-gray-800">检测到的风险内容</div>
          </div>
          <div class="space-y-2 md:space-y-3">
            <div
              v-for="(kw, i) in result.matchedKeywords"
              :key="kw + i"
              class="flex items-center gap-3 p-3 md:p-4 rounded-xl bg-red-50 border-l-4 border-elder-red transition-all duration-400"
              :style="{ transitionDelay: `${i * 80}ms` }"
            >
              <span class="text-2xl md:text-3xl shrink-0">❌</span>
              <span class="text-elder-base md:text-elder-lg font-bold text-elder-red">{{ kw }}</span>
            </div>
            <div
              v-if="!result.matchedKeywords.length"
              class="p-4 rounded-xl bg-green-50 border-l-4 border-elder-green"
            >
              <span class="text-elder-base font-bold text-elder-green">✅ 未检测到明显可疑关键词</span>
            </div>
          </div>
        </div>

        <div>
          <div class="flex items-center gap-3 mb-4">
            <span class="text-3xl">⚠️</span>
            <div class="text-xl font-black text-gray-800">AI 风险分析说明</div>
          </div>
          <div class="p-6 md:p-7 rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-2 border-orange-200">
            <p class="text-lg text-gray-800 leading-10">{{ result.riskDescription }}</p>
          </div>
        </div>

        <div class="rounded-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 p-6 md:p-8 relative overflow-hidden">
          <div class="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-elder-green/10 blur-2xl"></div>
          <div class="relative">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-16 h-16 md:w-18 md:h-18 rounded-full bg-gradient-to-br from-elder-orange via-amber-400 to-yellow-400 flex items-center justify-center shadow-lg border-4 border-white shrink-0">
                <span class="text-3xl md:text-4xl">🤖</span>
              </div>
              <div>
                <div class="text-elder-lg md:text-elder-xl font-black text-elder-ink">小银建议您：</div>
                <div class="text-elder-sm text-elder-muted">来自银龄AI助手「小银」的安全守护</div>
              </div>
            </div>
            <div class="space-y-3 md:space-y-4">
              <div
                v-for="(tip, i) in xiaoYinTips"
                :key="i"
                class="flex items-center gap-4 p-4 md:p-5 rounded-xl bg-white shadow-sm border-2 border-green-100 transition-all duration-300 hover:shadow-md hover:scale-[1.01]"
                :style="{ transitionDelay: `${i * 120}ms` }"
              >
                <div class="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-elder-green to-emerald-500 flex items-center justify-center shrink-0 shadow-md">
                  <span class="text-2xl md:text-3xl text-white font-black">{{ i + 1 }}</span>
                </div>
                <div class="flex-1 text-elder-base md:text-elder-lg font-bold text-elder-ink leading-9">
                  {{ tip }}
                </div>
                <span class="text-2xl md:text-3xl shrink-0">✓</span>
              </div>
            </div>
            <div class="mt-6 md:mt-7 p-5 md:p-6 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 flex items-center gap-4">
              <span class="text-4xl md:text-5xl shrink-0 animate-pulse-soft">📞</span>
              <div class="flex-1">
                <div class="text-elder-sm md:text-elder-base font-bold text-elder-red mb-1">遇到可疑情况，立即拨打全国反诈专线</div>
                <div class="text-3xl md:text-4xl font-black text-elder-red tracking-wider">96110</div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-4 pt-2">
          <button
            @click="onRetry"
            class="flex-1 min-w-[180px] px-8 py-5 rounded-2xl bg-gradient-to-r from-elder-orange via-amber-400 to-yellow-400 hover:shadow-elder-orange text-white text-xl font-black shadow-lg active:scale-95 transition-all duration-300 border-2 border-white/50 flex items-center justify-center gap-3"
          >
            <span class="text-2xl">🔄</span>
            重新检测
          </button>
          <button
            @click="onClose"
            class="flex-1 min-w-[200px] px-8 py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-black shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
          >
            <span v-if="result.isRisk">我知道了，提高警惕</span>
            <span v-else>好的，继续放心使用</span>
          </button>
          <button
            v-if="result.isRisk"
            @click="onReport"
            class="flex-1 min-w-[200px] px-8 py-5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xl font-black shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
          >
            📢 一键举报给反诈中心
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
