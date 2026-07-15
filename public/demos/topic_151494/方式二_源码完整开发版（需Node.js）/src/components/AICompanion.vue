<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{
  customMessage?: string
  showBubble?: boolean
  customState?: 'happy' | 'thinking' | 'protecting' | 'creating' | 'welcome'
}>()

const route = useRoute()

const routeStateMap: Record<string, 'happy' | 'thinking' | 'protecting' | 'creating'> = {
  home: 'happy',
  watch: 'thinking',
  'anti-fraud': 'protecting',
  create: 'creating',
  family: 'happy',
  health: 'happy',
  community: 'happy'
}

const messages = {
  home: {
    title: '欢迎回家！',
    bubble: '您好，我是小银\n我会陪您看懂视频，\n保护网络安全，\n记录生活中的美好。'
  },
  watch: {
    title: '视频助手思考中',
    bubble: '我帮您把视频内容整理好了，\n大字版+语音朗读，看得更清楚哦。\n有看不懂的地方随时问我~'
  },
  'anti-fraud': {
    title: '安全守护模式',
    bubble: '遇到可疑内容别担心！\n小银帮您识别网络风险，\n保护好您的钱袋子和个人信息。'
  },
  create: {
    title: '创作模式',
    bubble: '准备好记录美好时光了吗？\n选好照片和素材，\n小银帮您一键生成精彩短视频！'
  },
  family: {
    title: '亲情连线中',
    bubble: '子女给您推送了新视频，\n想您的时候就来看看吧~\n家人永远是最温暖的陪伴。'
  },
  health: {
    title: '健康管家在线',
    bubble: '看视频久了记得休息哦！\n起来活动活动，喝口水，\n健康的身体最重要啦~'
  },
  community: {
    title: '邻里社区',
    bubble: '社区又有新活动啦，\n扫码和老友们一起分享精彩生活，\n老伙计们都在等着您呢~'
  }
}

const stateConfig = {
  happy: {
    label: '开心陪伴',
    labelColor: 'text-elder-orange',
    labelBg: 'bg-elder-orange/15 border-elder-orange/30',
    statusDot: 'bg-elder-green',
    leftEmoji: '😊',
    rightEmoji: '💖',
    bubbleBg: 'from-orange-50 via-amber-50 to-yellow-50',
    bubbleBorder: 'border-orange-200'
  },
  thinking: {
    label: '思考分析中',
    labelColor: 'text-elder-blue',
    labelBg: 'bg-elder-blue/15 border-elder-blue/30',
    statusDot: 'bg-elder-blue animate-pulse',
    leftEmoji: '🤔',
    rightEmoji: '💡',
    bubbleBg: 'from-blue-50 via-sky-50 to-cyan-50',
    bubbleBorder: 'border-blue-200'
  },
  protecting: {
    label: '安全守护中',
    labelColor: 'text-elder-red',
    labelBg: 'bg-elder-red/15 border-elder-red/30',
    statusDot: 'bg-elder-red animate-pulse',
    leftEmoji: '🛡',
    rightEmoji: '⚠️',
    bubbleBg: 'from-red-50 via-rose-50 to-pink-50',
    bubbleBorder: 'border-red-200'
  },
  creating: {
    label: '创作灵感中',
    labelColor: 'text-purple-600',
    labelBg: 'bg-purple-500/15 border-purple-500/30',
    statusDot: 'bg-purple-500 animate-pulse',
    leftEmoji: '✨',
    rightEmoji: '🎨',
    bubbleBg: 'from-pink-50 via-fuchsia-50 to-purple-50',
    bubbleBorder: 'border-purple-200'
  },
  welcome: {
    label: '在线陪伴中',
    labelColor: 'text-elder-green',
    labelBg: 'bg-elder-green/15 border-elder-green/30',
    statusDot: 'bg-elder-green',
    leftEmoji: '👋',
    rightEmoji: '🌟',
    bubbleBg: 'from-green-50 via-emerald-50 to-teal-50',
    bubbleBorder: 'border-green-200'
  }
}

const routeName = computed(() => route.name as string)

const currentState = computed(() => {
  if (props.customState) return props.customState
  return routeStateMap[routeName.value] || 'happy'
})

const currentStateConfig = computed(() => stateConfig[currentState.value])

const currentMessage = computed(() => {
  if (props.customMessage) {
    return { title: '小银', bubble: props.customMessage }
  }
  const key = routeName.value
  return (messages as any)[key] || messages.home
})

const showBubble = computed(() => props.showBubble !== false)
</script>

<template>
  <div class="ai-companion-wrapper">
    <div class="flex items-start gap-5 md:gap-8">
      <div class="shrink-0 relative">
        <div class="absolute -inset-3 rounded-full bg-gradient-to-br from-orange-400/20 to-amber-300/20 blur-xl animate-breath"></div>

        <div class="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-400 flex items-center justify-center shadow-2xl border-4 md:border-[6px] border-white overflow-hidden animate-float-soft">
          <div class="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent"></div>

          <div class="relative z-10 w-full h-full flex flex-col items-center justify-center">
            <div class="absolute top-4 md:top-6 left-2 md:left-3 text-2xl md:text-3xl animate-sway" :class="{ 'animate-bounce-slow': currentState === 'happy' }">
              {{ currentStateConfig.leftEmoji }}
            </div>
            <div class="absolute top-4 md:top-6 right-2 md:right-3 text-2xl md:text-3xl animate-sway" style="animation-delay: 0.5s;">
              {{ currentStateConfig.rightEmoji }}
            </div>

            <div class="flex gap-5 md:gap-7 mb-1 md:mb-2">
              <div class="relative">
                <div
                  class="w-4 h-4 md:w-5 md:h-5 rounded-full bg-elder-ink transition-all duration-200 animate-blink-eye"
                  :class="{ 'scale-y-50': currentState === 'thinking' }"
                ></div>
                <div v-if="currentState === 'protecting'" class="absolute -top-1 -left-1 w-6 h-6 md:w-7 md:h-7 border-2 border-elder-red rounded-full animate-ping opacity-40"></div>
              </div>
              <div class="relative">
                <div
                  class="w-4 h-4 md:w-5 md:h-5 rounded-full bg-elder-ink transition-all duration-200 animate-blink-eye"
                  :class="{ 'scale-y-50': currentState === 'thinking' }"
                  style="animation-delay: 0.12s;"
                ></div>
                <div v-if="currentState === 'protecting'" class="absolute -top-1 -left-1 w-6 h-6 md:w-7 md:h-7 border-2 border-elder-red rounded-full animate-ping opacity-40" style="animation-delay: 0.3s;"></div>
              </div>
            </div>

            <div
              v-if="currentState === 'happy' || currentState === 'welcome'"
              class="w-10 md:w-12 h-5 md:h-6 border-b-4 border-elder-ink rounded-b-full"
            ></div>
            <div
              v-else-if="currentState === 'thinking'"
              class="w-8 md:w-10 h-4 md:h-5 border-4 border-elder-ink rounded-full border-t-transparent animate-spin-slow"
            ></div>
            <div
              v-else-if="currentState === 'protecting'"
              class="w-10 md:w-12 flex justify-center"
            >
              <div class="w-6 h-6 md:w-7 md:h-7 rounded-lg border-4 border-elder-red flex items-center justify-center">
                <span class="text-elder-red text-xl md:text-2xl font-black leading-none">!</span>
              </div>
            </div>
            <div
              v-else-if="currentState === 'creating'"
              class="flex gap-1"
            >
              <div class="w-2 h-2 md:w-3 md:h-3 rounded-full bg-elder-ink animate-bounce-dot"></div>
              <div class="w-2 h-2 md:w-3 md:h-3 rounded-full bg-elder-ink animate-bounce-dot" style="animation-delay: 0.15s;"></div>
              <div class="w-2 h-2 md:w-3 md:h-3 rounded-full bg-elder-ink animate-bounce-dot" style="animation-delay: 0.3s;"></div>
            </div>
          </div>
        </div>

        <div class="absolute -bottom-1 -right-1 w-9 h-9 md:w-10 md:h-10 rounded-full text-white flex items-center justify-center text-xl md:text-2xl shadow-lg border-3 border-white" :class="currentState === 'protecting' ? 'bg-elder-red' : currentState === 'thinking' ? 'bg-elder-blue' : currentState === 'creating' ? 'bg-purple-500' : 'bg-elder-green'">
          <template v-if="currentState === 'protecting'">🛡</template>
          <template v-else-if="currentState === 'thinking'">💡</template>
          <template v-else-if="currentState === 'creating'">✨</template>
          <template v-else>✓</template>
        </div>
      </div>

      <div class="flex-1 min-w-0 pt-2">
        <div class="flex items-center gap-3 flex-wrap mb-2">
          <div class="text-elder-lg md:text-elder-xl font-black text-elder-ink">
            <span class="text-elder-orange">小银</span> · <span class="text-2xl">🤖</span> AI数字伙伴
          </div>
          <span
            class="elder-chip border font-bold text-elder-xs flex items-center gap-2"
            :class="[currentStateConfig.labelBg, currentStateConfig.labelColor]"
          >
            <span class="w-2.5 h-2.5 rounded-full" :class="currentStateConfig.statusDot"></span>
            {{ currentStateConfig.label }}
          </span>
        </div>
        <div class="text-elder-sm text-elder-muted mb-1">
          {{ currentMessage.title }}
        </div>
        <transition name="slide-up">
          <div
            v-if="showBubble"
            class="mt-4 relative inline-block max-w-full w-full"
          >
            <div class="absolute -top-2 left-8 md:left-10 w-5 h-5 border-l-2 border-t-2 rotate-45 z-10" :class="currentStateConfig.bubbleBorder" :style="{ background: currentState === 'thinking' ? '#EFF6FF' : currentState === 'protecting' ? '#FEF2F2' : currentState === 'creating' ? '#FDF4FF' : '#FFF7ED' }"></div>
            <div
              class="relative p-5 md:p-7 rounded-elder-2xl bg-gradient-to-br border-2 shadow-sm"
              :class="[currentStateConfig.bubbleBg, currentStateConfig.bubbleBorder]"
            >
              <div class="text-elder-sm md:text-elder-base text-elder-ink leading-10 whitespace-pre-line font-medium">
                <span class="mr-1" :class="currentStateConfig.labelColor">💬</span>
                {{ currentMessage.bubble }}
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-companion-wrapper {
  position: relative;
}

@keyframes breath {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.08); opacity: 1; }
}
.animate-breath {
  animation: breath 3.5s ease-in-out infinite;
}

@keyframes float-soft {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.animate-float-soft {
  animation: float-soft 4s ease-in-out infinite;
}

@keyframes blink-eye {
  0%, 92%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.08); }
}
.animate-blink-eye {
  animation: blink-eye 4.5s ease-in-out infinite;
}

@keyframes sway {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-4px) rotate(5deg); }
}
.animate-sway {
  animation: sway 3s ease-in-out infinite;
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-8px) rotate(8deg); }
}
.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin-slow {
  animation: spin-slow 2s linear infinite;
}

@keyframes bounce-dot {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
}
.animate-bounce-dot {
  animation: bounce-dot 1.2s ease-in-out infinite;
}

.border-3 { border-width: 3px; }
</style>
