<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  (e: 'complete'): void
}>()

const stage = ref(0)
const showContent = ref(false)
const avatarVisible = ref(false)
const text1Visible = ref(false)
const text2Visible = ref(false)
const text3Visible = ref(false)
const text4Visible = ref(false)
const buttonVisible = ref(false)
const fadeOut = ref(false)
const autoTriggered = ref(false)

let autoTimer: any = null

function startExperience() {
  if (autoTimer) clearTimeout(autoTimer)
  fadeOut.value = true
  setTimeout(() => {
    emit('complete')
  }, 600)
}

onMounted(() => {
  setTimeout(() => {
    showContent.value = true
  }, 200)
  setTimeout(() => {
    avatarVisible.value = true
  }, 500)
  setTimeout(() => {
    text1Visible.value = true
    stage.value = 1
  }, 1200)
  setTimeout(() => {
    text2Visible.value = true
    stage.value = 2
  }, 2000)
  setTimeout(() => {
    text3Visible.value = true
    stage.value = 3
  }, 2600)
  setTimeout(() => {
    text4Visible.value = true
    stage.value = 4
  }, 3200)
  setTimeout(() => {
    buttonVisible.value = true
    stage.value = 5
  }, 3800)

  autoTimer = setTimeout(() => {
    if (!autoTriggered.value) {
      autoTriggered.value = true
      fadeOut.value = true
      setTimeout(() => {
        emit('complete')
      }, 600)
    }
  }, 10000)
})

onUnmounted(() => {
  if (autoTimer) clearTimeout(autoTimer)
})
</script>

<template>
  <div
    class="welcome-overlay fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-600"
    :class="fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'"
    style="background: linear-gradient(135deg, #FFFBF5 0%, #FFF1E0 30%, #FFE8CC 60%, #FFF8F0 100%);"
  >
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-orange-300/30 to-amber-200/20 blur-3xl animate-pulse-soft"></div>
      <div class="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-pink-300/25 to-rose-200/15 blur-3xl animate-pulse-soft" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/4 right-1/4 w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300/40 to-orange-300/30 blur-xl animate-pulse-soft" style="animation-delay: 0.5s;"></div>
      <div class="absolute bottom-1/4 left-1/3 w-20 h-20 rounded-full bg-gradient-to-br from-pink-300/40 to-rose-300/30 blur-xl animate-pulse-soft" style="animation-delay: 1.5s;"></div>
    </div>

    <div
      class="relative z-10 text-center px-8 transition-all duration-700 transform max-w-2xl mx-auto"
      :class="showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'"
    >
      <div
        class="mx-auto mb-8 md:mb-10 relative transition-all duration-700 transform"
        :class="avatarVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'"
      >
        <div class="absolute -inset-6 rounded-full bg-gradient-to-br from-orange-400/20 to-amber-300/20 blur-2xl animate-pulse-soft"></div>
        <div class="relative w-40 h-40 md:w-48 md:h-48 mx-auto rounded-full bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-400 flex items-center justify-center shadow-2xl border-[6px] border-white overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
          <div class="relative z-10 flex flex-col items-center justify-center">
            <div class="flex gap-6 md:gap-8 mb-2 md:mb-3">
              <div class="w-4 h-4 md:w-5 md:h-5 rounded-full bg-elder-ink animate-blink"></div>
              <div class="w-4 h-4 md:w-5 md:h-5 rounded-full bg-elder-ink animate-blink" style="animation-delay: 0.1s;"></div>
            </div>
            <div class="w-10 md:w-12 h-5 md:h-6 border-b-4 border-elder-ink rounded-b-full"></div>
          </div>
          <div class="absolute -bottom-2 -right-2 w-14 h-14 md:w-16 md:h-16 rounded-full bg-elder-green text-white flex items-center justify-center text-3xl md:text-4xl shadow-lg border-4 border-white">
            ✓
          </div>
        </div>
        <div class="absolute -top-3 -right-8 text-5xl md:text-6xl animate-float" style="animation-delay: 0.3s;">✨</div>
        <div class="absolute -bottom-2 -left-10 text-4xl md:text-5xl animate-float" style="animation-delay: 0.8s;">💫</div>
      </div>

      <div class="space-y-5 md:space-y-6">
        <div
          class="transition-all duration-500 transform"
          :class="text1Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
        >
          <div class="inline-block px-6 md:px-10 py-4 md:py-5 rounded-full bg-white shadow-xl border-2 border-orange-200 mb-2">
            <span class="text-elder-xl md:text-elder-2xl font-black text-elder-ink">
              您好，我是 <span class="text-elder-orange">小银</span> 👋
            </span>
          </div>
        </div>

        <div
          class="transition-all duration-500 transform delay-75"
          :class="text2Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
        >
          <div class="text-elder-base md:text-elder-lg font-bold text-elder-muted mb-2">
            我可以帮助您：
          </div>
        </div>

        <div class="space-y-3 md:space-y-4">
          <div
            class="transition-all duration-500 transform delay-100"
            :class="text2Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
          >
            <div class="inline-flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 rounded-elder-xl bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 shadow-lg">
              <span class="text-4xl md:text-5xl">👀</span>
              <span class="text-elder-base md:text-elder-lg font-bold text-elder-ink">看懂视频 — AI帮您理解每一个精彩内容</span>
            </div>
          </div>

          <div
            class="transition-all duration-500 transform delay-200"
            :class="text3Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
          >
            <div class="inline-flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 rounded-elder-xl bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 shadow-lg">
              <span class="text-4xl md:text-5xl">🛡</span>
              <span class="text-elder-base md:text-elder-lg font-bold text-elder-ink">防诈骗 — AI帮您识别网络风险守护安全</span>
            </div>
          </div>

          <div
            class="transition-all duration-500 transform delay-300"
            :class="text4Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
          >
            <div class="inline-flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 rounded-elder-xl bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 shadow-lg">
              <span class="text-4xl md:text-5xl">🎬</span>
              <span class="text-elder-base md:text-elder-lg font-bold text-elder-ink">创造生活作品 — 一键把美好回忆变成精彩视频</span>
            </div>
          </div>
        </div>
      </div>

      <div
        class="mt-12 md:mt-14 transition-all duration-500 transform"
        :class="buttonVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'"
      >
        <button
          @click="startExperience"
          class="group relative inline-flex items-center gap-3 md:gap-4 px-10 md:px-16 py-5 md:py-7 rounded-elder-2xl bg-gradient-to-r from-elder-orange via-amber-400 to-yellow-400 text-white text-elder-xl md:text-elder-2xl font-black shadow-2xl hover:shadow-elder-orange active:scale-95 transition-all duration-300 border-[3px] border-white/60 overflow-hidden"
          style="box-shadow: 0 20px 52px -12px rgba(255,122,61,0.5);"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2.5s_infinite]"></div>
          <span class="relative z-10 text-3xl md:text-4xl animate-bounce-gentle">🚀</span>
          <span class="relative z-10">开始体验</span>
          <span class="relative z-10 text-3xl md:text-4xl group-hover:translate-x-2 transition-transform duration-300">→</span>
        </button>
        <div class="mt-4 md:mt-5 text-elder-sm md:text-elder-base text-elder-muted animate-pulse-soft">
          💡 点击按钮，或等待10秒自动进入
        </div>
      </div>

      <div
        class="mt-10 md:mt-12 flex justify-center gap-3 transition-opacity duration-500"
        :class="text4Visible ? 'opacity-100' : 'opacity-0'"
      >
        <div
          v-for="i in 5"
          :key="i"
          class="w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-300"
          :class="i <= stage ? 'bg-elder-orange scale-110' : 'bg-orange-200'"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes blink {
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
}
.animate-blink {
  animation: blink 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}
.animate-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes bounce-gentle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.animate-bounce-gentle {
  animation: bounce-gentle 2s ease-in-out infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.delay-75 { transition-delay: 75ms; }
.delay-100 { transition-delay: 100ms; }
.delay-200 { transition-delay: 200ms; }
.delay-300 { transition-delay: 300ms; }
</style>
