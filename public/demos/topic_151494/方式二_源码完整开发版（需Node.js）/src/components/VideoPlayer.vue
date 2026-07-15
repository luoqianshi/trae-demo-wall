<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Play, Pause, Volume2, Maximize, Minus, Plus } from 'lucide-vue-next'
import type { DouyinVideo } from '@/types'
import { useSpeech } from '@/composables/useSpeech'
import { useSettingsStore } from '@/stores/settings'
import { formatTime } from '@/utils/formatters'

const props = defineProps<{
  video: DouyinVideo | null
  subtitleSize?: 'normal' | 'large' | 'xlarge'
}>()

const videoEl = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const isFullscreen = ref(false)
const showSubtitle = ref(true)
const subtitleSize = ref<'normal' | 'large' | 'xlarge'>(props.subtitleSize || 'large')

const settings = useSettingsStore()
const speech = useSpeech()

const currentSubtitle = computed(() => {
  if (!props.video || !props.video.subtitle?.length) return ''
  const idx = Math.floor((currentTime.value / Math.max(duration.value, 1)) * props.video.subtitle.length)
  return props.video.subtitle[Math.min(idx, props.video.subtitle.length - 1)] ?? ''
})

const fontSizeClass = computed(() => {
  return subtitleSize.value === 'xlarge'
    ? 'text-[44px] leading-[64px]'
    : subtitleSize.value === 'large'
      ? 'text-[36px] leading-[52px]'
      : 'text-[28px] leading-[44px]'
})

function onTimeUpdate() {
  if (!videoEl.value) return
  currentTime.value = Math.floor(videoEl.value.currentTime)
}
function onLoaded() {
  if (!videoEl.value) return
  duration.value = Math.floor(videoEl.value.duration || props.video?.duration || 120)
}
function togglePlay() {
  if (!videoEl.value) return
  if (isPlaying.value) {
    videoEl.value.pause()
    speech.pause()
  } else {
    videoEl.value.play()
    if (props.video && settings.settings.speechRate !== undefined) {
      setTimeout(() => {
        speech.speak(props.video!.subtitle.join('，'), { rateLevel: settings.settings.speechRate })
      }, 300)
    }
  }
  isPlaying.value = !isPlaying.value
}
function toggleFullscreen() {
  const el = videoEl.value?.parentElement
  if (!el) return
  if (!document.fullscreenElement) {
    el.requestFullscreen?.()
    isFullscreen.value = true
  } else {
    document.exitFullscreen?.()
    isFullscreen.value = false
  }
}
function bigger() {
  subtitleSize.value = subtitleSize.value === 'normal' ? 'large' : 'xlarge'
}
function smaller() {
  subtitleSize.value = subtitleSize.value === 'xlarge' ? 'large' : 'normal'
}
function readSubtitle() {
  if (!props.video) return
  speech.speak(currentSubtitle.value || props.video.title, { rateLevel: settings.settings.speechRate })
}

watch(() => props.video, () => {
  isPlaying.value = false
  currentTime.value = 0
  duration.value = 0
  speech.stop()
})
</script>

<template>
  <div v-if="!video" class="elder-card p-10 text-center text-elder-muted">
    <span class="emoji-icon text-7xl">🎬</span>
    <div class="mt-6 text-elder-base">请先粘贴抖音视频链接</div>
  </div>

  <div v-else class="elder-card overflow-hidden">
    <div
      class="relative bg-black aspect-video rounded-elder overflow-hidden group"
    >
      <video
        ref="videoEl"
        :src="video.videoUrl"
        class="w-full h-full object-contain"
        :poster="video.coverUrl"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoaded"
        @play="isPlaying = true"
        @pause="isPlaying = false"
        playsinline
        crossorigin="anonymous"
      ></video>

      <!-- 中央大字字幕浮层 -->
      <div
        v-if="showSubtitle && currentSubtitle"
        class="absolute left-4 right-4 bottom-28 md:bottom-32 text-center pointer-events-none"
      >
        <div
          class="inline-block px-6 py-4 rounded-elder bg-black/70 text-yellow-300 font-bold shadow-2xl backdrop-blur-sm"
          :class="fontSizeClass"
        >
          {{ currentSubtitle }}
        </div>
      </div>

      <!-- 控制栏 -->
      <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 md:px-8 pt-16 pb-5">
        <div class="h-3 rounded-full bg-white/20 mb-4 cursor-pointer">
          <div
            class="h-full rounded-full bg-elder-orange transition-all"
            :style="{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }"
          ></div>
        </div>

        <div class="flex items-center gap-3 md:gap-6 text-white">
          <button
            @click="togglePlay"
            class="w-16 h-16 md:w-20 md:h-20 rounded-full bg-elder-orange hover:bg-[#FF8C57] flex items-center justify-center shadow-elder-orange active:scale-95 transition-all"
          >
            <Play v-if="!isPlaying" class="w-9 h-9 md:w-10 md:h-10 text-white ml-1" :stroke-width="2.5" fill="white" />
            <Pause v-else class="w-9 h-9 md:w-10 md:h-10 text-white" :stroke-width="2.5" fill="white" />
          </button>

          <div class="flex-1 text-elder-sm font-medium tabular-nums">
            {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
          </div>

          <button
            @click="readSubtitle"
            class="h-14 w-14 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center border border-white/20 active:scale-95 transition-all"
            title="朗读字幕"
          >
            <Volume2 class="w-7 h-7" :stroke-width="2" />
          </button>

          <div class="hidden md:flex items-center gap-2 bg-white/10 rounded-xl p-1.5 border border-white/15">
            <button @click="smaller" class="h-11 w-11 rounded-lg hover:bg-white/15 flex items-center justify-center">
              <Minus class="w-6 h-6" :stroke-width="2.5" />
            </button>
            <span class="text-elder-xs px-2 font-semibold">字幕</span>
            <button @click="bigger" class="h-11 w-11 rounded-lg hover:bg-white/15 flex items-center justify-center">
              <Plus class="w-6 h-6" :stroke-width="2.5" />
            </button>
          </div>

          <button
            @click="toggleFullscreen"
            class="h-14 w-14 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center border border-white/20 active:scale-95 transition-all"
            title="全屏"
          >
            <Maximize v-if="!isFullscreen" class="w-7 h-7" :stroke-width="2" />
            <Minimize v-else class="w-7 h-7" :stroke-width="2" />
          </button>
        </div>
      </div>
    </div>

    <!-- 视频信息 -->
    <div class="p-8">
      <div class="text-elder-lg font-bold text-elder-ink leading-12">{{ video.title }}</div>
      <div class="mt-4 flex items-center gap-4 text-elder-sm text-elder-muted">
        <span>作者：{{ video.author }}</span>
        <span>·</span>
        <span>❤️ {{ Math.floor(video.likes / 10000) }} 万赞</span>
      </div>

      <!-- 下方完整字幕滚动区 -->
      <div class="mt-8 p-6 rounded-elder-xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 max-h-[260px] overflow-y-auto">
        <div class="flex items-center gap-3 mb-4">
          <span class="emoji-icon text-3xl">📝</span>
          <span class="text-elder-base font-bold text-elder-ink">完整视频字幕 / 文案</span>
        </div>
        <div class="space-y-3">
          <p
            v-for="(s, i) in video.subtitle"
            :key="i"
            class="p-4 rounded-xl bg-white shadow-sm border border-orange-100 text-elder-sm leading-10"
            :class="{ 'ring-2 ring-elder-orange/40 bg-orange-50': currentSubtitle === s }"
          >
            {{ s }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
