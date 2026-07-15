<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps<{
  active: boolean
  onComplete?: () => void
}>()

const steps = [
  { id: 1, name: '分析生活照片', desc: 'AI正在识别您上传的精彩瞬间', icon: '📷', duration: 2000 },
  { id: 2, name: '匹配音乐', desc: '为您挑选最搭的经典老歌BGM', icon: '🎵', duration: 1800 },
  { id: 3, name: '生成字幕', desc: '自动添加清晰的大号字幕', icon: '📝', duration: 1800 },
  { id: 4, name: '制作作品', desc: '您的专属短视频制作成功', icon: '🎬', duration: 1200 }
]

const currentStep = ref(0)
const stepProgress = ref(0)
const overallProgress = ref(0)
let timer: any = null
let stepTimer: any = null

function startAnimation() {
  currentStep.value = 0
  stepProgress.value = 0
  overallProgress.value = 0
  runStep(0)
}

function runStep(index: number) {
  if (index >= steps.length) {
    props.onComplete?.()
    return
  }
  currentStep.value = index
  stepProgress.value = 0
  const step = steps[index]
  const stepStartTime = Date.now()

  if (stepTimer) clearInterval(stepTimer)
  stepTimer = setInterval(() => {
    const elapsed = Date.now() - stepStartTime
    stepProgress.value = Math.min((elapsed / step.duration) * 100, 100)
    const stepWeight = 100 / steps.length
    overallProgress.value = Math.min(
      index * stepWeight + (stepProgress.value / 100) * stepWeight,
      100
    )
    if (elapsed >= step.duration) {
      clearInterval(stepTimer)
      if (index < steps.length - 1) {
        setTimeout(() => runStep(index + 1), 350)
      } else {
        setTimeout(() => {
          props.onComplete?.()
        }, 700)
      }
    }
  }, 50)
}

watch(() => props.active, (nv) => {
  if (nv) {
    startAnimation()
  } else {
    if (timer) clearInterval(timer)
    if (stepTimer) clearInterval(stepTimer)
  }
}, { immediate: true })

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (stepTimer) clearInterval(stepTimer)
})
</script>

<template>
  <div class="generation-animation w-full">
    <div class="text-center mb-10">
      <div class="w-24 h-24 md:w-28 md:h-28 mx-auto rounded-full bg-gradient-to-br from-elder-orange via-amber-400 to-yellow-400 flex items-center justify-center shadow-elder-orange mb-6 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        <span class="text-5xl md:text-6xl relative z-10 animate-pulse-soft">{{ steps[currentStep]?.icon }}</span>
        <div
          class="absolute inset-0 rounded-full border-4 md:border-[5px] border-white/20 border-t-white animate-spin"
          style="animation-duration: 1.5s"
        ></div>
      </div>
      <div class="text-elder-xl md:text-elder-2xl font-black text-elder-ink mb-2">
        步骤{{ currentStep + 1 }}/4：{{ steps[currentStep]?.name }}
      </div>
      <div class="text-elder-base text-elder-muted leading-9">
        {{ steps[currentStep]?.desc }}
      </div>
    </div>

    <div class="mb-8 md:mb-10">
      <div class="flex justify-between items-center mb-3 md:mb-4">
        <span class="text-elder-base md:text-elder-lg font-bold text-elder-ink flex items-center gap-2">
          <span class="text-2xl">✨</span> AI创作进度
        </span>
        <span class="text-elder-lg md:text-elder-xl font-black text-elder-orange tabular-nums">{{ Math.round(overallProgress) }}%</span>
      </div>
      <div class="h-7 md:h-8 rounded-full bg-orange-100 overflow-hidden shadow-inner border-2 border-orange-200/60">
        <div
          class="h-full bg-gradient-to-r from-elder-orange via-amber-400 to-yellow-400 rounded-full transition-all duration-200 relative overflow-hidden"
          :style="{ width: `${overallProgress}%` }"
        >
          <div
            class="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_1.5s_infinite]"
          ></div>
        </div>
      </div>
    </div>

    <div class="space-y-4 md:space-y-5">
      <div
        v-for="(step, i) in steps"
        :key="step.id"
        class="flex items-center gap-5 p-5 md:p-6 rounded-elder-xl border-2 transition-all duration-400"
        :class="{
          'bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border-elder-orange/50 shadow-md scale-[1.01]': i === currentStep,
          'bg-gradient-to-r from-green-50/60 via-emerald-50/60 to-teal-50/60 border-elder-green/40 shadow-sm': i < currentStep,
          'bg-gray-50 border-gray-200 opacity-70': i > currentStep
        }"
      >
        <div
          class="w-16 h-16 md:w-[72px] md:h-[72px] rounded-full flex items-center justify-center shrink-0 transition-all duration-300 relative overflow-hidden"
          :class="{
            'bg-gradient-to-br from-elder-orange to-amber-400 shadow-elder-orange scale-105': i === currentStep,
            'bg-gradient-to-br from-elder-green to-emerald-500 shadow-lg': i < currentStep,
            'bg-gray-200 text-elder-muted': i > currentStep
          }"
        >
          <template v-if="i < currentStep">
            <span class="text-3xl md:text-4xl text-white font-black">✓</span>
          </template>
          <template v-else>
            <span class="text-3xl md:text-4xl text-white" :class="i > currentStep ? '!text-elder-muted' : ''">{{ step.icon }}</span>
          </template>
          <div
            v-if="i === currentStep"
            class="absolute inset-0 rounded-full"
            :style="{
              background: `conic-gradient(from 0deg, rgba(255,255,255,0.5) ${stepProgress}%, transparent ${stepProgress}%)`
            }"
          ></div>
        </div>
        <div class="flex-1 min-w-0">
          <div
            class="text-elder-lg md:text-elder-xl font-black mb-1 transition-colors duration-300"
            :class="{
              'text-elder-orange': i === currentStep,
              'text-elder-green': i < currentStep,
              'text-elder-muted': i > currentStep
            }"
          >
            步骤{{ i + 1 }}：{{ step.name }}
            <span v-if="i < currentStep" class="text-elder-green ml-2">完成 ✓</span>
          </div>
          <div class="text-elder-sm md:text-elder-base text-elder-muted leading-8">
            {{ step.desc }}
          </div>
        </div>
        <div v-if="i === currentStep" class="shrink-0">
          <div class="w-12 h-12 md:w-14 md:h-14 rounded-full border-4 md:border-[5px] border-elder-orange/20 border-t-elder-orange animate-spin"></div>
        </div>
        <div v-else-if="i < currentStep" class="shrink-0 text-elder-green text-4xl md:text-5xl">
          ✓
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
