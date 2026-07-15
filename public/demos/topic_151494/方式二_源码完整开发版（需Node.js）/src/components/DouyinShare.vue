<script setup lang="ts">
import { ref } from 'vue'
import { Share2, Send, Download, Heart, MessageCircle, Bookmark, Music, ExternalLink } from 'lucide-vue-next'

const props = defineProps<{
  title?: string
  hashtags?: string[]
  coverUrl?: string
  showPublishSuccess?: boolean
}>()

const emit = defineEmits<{
  (e: 'publish'): void
  (e: 'save'): void
  (e: 'share-family'): void
}>()

const showSuccess = ref(false)
const showTooltip = ref(false)
const shareClicked = ref(false)

function handlePublish() {
  shareClicked.value = true
  showSuccess.value = true
  emit('publish')
  setTimeout(() => {
    showSuccess.value = false
    shareClicked.value = false
  }, 4000)
}

const defaultTitle = props.title || '《我的退休生活，也可以很精彩》'
const defaultHashtags = props.hashtags || ['#银龄生活', '#快乐退休', '#AI创造生活', '#退休日记', '#幸福晚年']
const defaultCover = props.coverUrl || ''
</script>

<template>
  <div class="douyin-share">
    <transition name="slide-up">
      <div
        v-if="showSuccess"
        class="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
        @click.self="showSuccess = false"
      >
        <div class="max-w-[480px] w-full bg-white rounded-elder-2xl p-8 md:p-10 shadow-2xl border-4 border-elder-green/30 text-center relative overflow-hidden">
          <div class="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-elder-green/10 blur-3xl"></div>
          <div class="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-amber-400/10 blur-3xl"></div>
          <div class="relative">
            <div class="w-24 h-24 md:w-28 md:h-28 mx-auto rounded-full bg-gradient-to-br from-elder-green to-emerald-500 flex items-center justify-center shadow-xl mb-6 border-4 border-white">
              <span class="text-6xl md:text-7xl">🎉</span>
            </div>
            <div class="text-elder-xl md:text-elder-2xl font-black text-elder-ink mb-3">
              已成功分享到抖音！
            </div>
            <div class="text-elder-base md:text-elder-lg text-elder-muted leading-10 mb-8">
              作品《我的退休生活，也可以很精彩》<br/>
              已发布到抖音，让更多老友看到您的精彩生活~
            </div>
            <div class="p-5 md:p-6 rounded-elder-xl bg-gradient-to-br from-black to-gray-900 text-white flex items-center gap-4 mb-8">
              <div class="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center shrink-0 shadow-lg">
                <Music class="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <div class="flex-1 text-left">
                <div class="text-elder-sm md:text-elder-base font-black">🎵 发布成功 · 流量加持中</div>
                <div class="text-elder-xs md:text-elder-sm opacity-80 mt-1">带上 #银龄生活 话题标签，获得更多曝光</div>
              </div>
              <div class="text-3xl md:text-4xl">✅</div>
            </div>
            <button
              @click="showSuccess = false"
              class="elder-btn-green w-full !min-h-[72px] !text-elder-lg md:!text-elder-xl !px-8 shadow-xl"
            >
              好的，继续创作更多作品
            </button>
          </div>
        </div>
      </div>
    </transition>

    <div class="relative mx-auto max-w-[420px]">
      <div class="relative rounded-[2.5rem] border-[12px] border-gray-900 shadow-2xl bg-black overflow-hidden aspect-[9/16]">
        <img
          v-if="defaultCover"
          :src="defaultCover"
          class="w-full h-full object-cover transition-transform duration-[3000ms] hover:scale-110"
          alt="作品封面"
        />
        <div v-else class="w-full h-full bg-gradient-to-br from-elder-orange via-amber-400 to-yellow-400 flex items-center justify-center">
          <span class="text-8xl">🎬</span>
        </div>

        <div class="absolute inset-0 bg-gradient-to-t from-black/92 via-black/35 to-transparent"></div>

        <div class="absolute top-5 left-5 right-5 flex items-center gap-3">
          <div class="flex-1 flex items-center gap-3">
            <div class="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white flex items-center justify-center bg-gradient-to-br from-elder-orange to-amber-400 shrink-0 shadow-lg">
              <span class="text-xl md:text-2xl">👴</span>
            </div>
            <div class="text-white">
              <div class="text-elder-sm md:text-elder-base font-black">银龄创作者 · 小银</div>
              <div class="text-elder-xs md:text-elder-sm opacity-80">刚刚 · 来自 银龄AI助手</div>
            </div>
          </div>
          <button class="px-5 py-2.5 md:px-6 md:py-3 rounded-full bg-white text-elder-orange font-black text-elder-sm md:text-elder-base border-2 border-white hover:bg-elder-orange hover:text-white transition-all active:scale-95 shadow-lg">
            + 关注
          </button>
        </div>

        <div class="absolute bottom-5 left-5 right-16 text-white">
          <div class="text-elder-lg md:text-elder-xl font-black leading-10 md:leading-[48px] mb-3 md:mb-4 drop-shadow-xl line-clamp-3">
            {{ defaultTitle }}
          </div>
          <div class="p-3 md:p-4 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 mb-3 md:mb-4">
            <div class="text-elder-sm md:text-elder-base font-bold text-white/95 leading-8 md:leading-9">
              <span class="text-elder-orange">【AI自动生成字幕】</span><br/>
              退休后的每一天，<br/>
              都要过得精彩又开心~ ✨
            </div>
          </div>
          <div class="flex flex-wrap gap-2 mb-4">
            <span
              v-for="(tag, i) in defaultHashtags.slice(0, 5)"
              :key="i"
              class="text-elder-xs md:text-elder-sm font-bold text-white/95 bg-gradient-to-r from-elder-orange/40 to-amber-500/30 px-3.5 py-2 rounded-full backdrop-blur border border-orange-300/30 shadow-sm"
            >
              {{ tag }}
            </span>
          </div>
          <div class="flex items-center gap-3 text-elder-xs md:text-elder-sm opacity-95">
            <span class="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/15 backdrop-blur border border-white/20">
              <Music class="w-4 h-4 md:w-5 md:h-5" />
              最炫民族风（经典老歌版）
            </span>
          </div>
        </div>

        <div class="absolute bottom-6 right-4 flex flex-col items-center gap-6 md:gap-7">
          <button class="flex flex-col items-center gap-1.5 md:gap-2 text-white group active:scale-95 transition-all">
            <div class="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center group-hover:bg-white/20 transition-all border border-white/20 shadow-lg">
              <Heart class="w-7 h-7 md:w-8 md:h-8 text-elder-red animate-pulse-soft" fill="#E63946" />
            </div>
            <span class="text-elder-xs md:text-elder-sm font-black drop-shadow">8.8w</span>
          </button>
          <button class="flex flex-col items-center gap-1.5 md:gap-2 text-white group active:scale-95 transition-all">
            <div class="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center group-hover:bg-white/20 transition-all border border-white/20 shadow-lg">
              <MessageCircle class="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <span class="text-elder-xs md:text-elder-sm font-black drop-shadow">2345</span>
          </button>
          <button class="flex flex-col items-center gap-1.5 md:gap-2 text-white group active:scale-95 transition-all">
            <div class="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center group-hover:bg-white/20 transition-all border border-white/20 shadow-lg">
              <Bookmark class="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <span class="text-elder-xs md:text-elder-sm font-black drop-shadow">6789</span>
          </button>
          <button class="flex flex-col items-center gap-1.5 md:gap-2 text-white group active:scale-95 transition-all">
            <div class="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center group-hover:bg-white/20 transition-all border border-white/20 shadow-lg">
              <Share2 class="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <span class="text-elder-xs md:text-elder-sm font-black drop-shadow">分享</span>
          </button>
          <div class="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-elder-orange to-amber-400 flex items-center justify-center shadow-lg border-2 border-white/30 animate-spin-slow">
            <Music class="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
        </div>
      </div>
    </div>

    <div class="mt-8 md:mt-10 space-y-4 md:space-y-5 max-w-[420px] mx-auto">
      <button
        @click="handlePublish"
        @mouseenter="showTooltip = true"
        @mouseleave="showTooltip = false"
        class="w-full relative group"
      >
        <div
          class="flex items-center justify-center gap-3 md:gap-4 py-6 md:py-7 px-8 rounded-elder-2xl font-black text-white shadow-2xl transition-all active:scale-[0.98] group-hover:shadow-[0_20px_60px_-12px_rgba(254,44,85,0.5)] border-[3px] border-white/40"
          style="background: linear-gradient(135deg, #FE2C55 0%, #FF6B8A 30%, #25F4EE 70%, #000000 100%); background-size: 200% 200%; animation: gradientShift 3.5s ease infinite;"
        >
          <div class="w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/25 backdrop-blur flex items-center justify-center shadow-lg">
            <span class="text-2xl md:text-3xl">🎵</span>
          </div>
          <span class="text-elder-lg md:text-elder-xl">分享到抖音</span>
          <ExternalLink class="w-7 h-7 md:w-8 md:h-8" :stroke-width="2.2" />
        </div>
        <transition name="fade">
          <div
            v-if="showTooltip"
            class="absolute -top-16 left-1/2 -translate-x-1/2 px-5 py-3 md:px-6 md:py-3.5 rounded-elder-xl bg-gray-900 text-white text-elder-sm whitespace-nowrap shadow-xl z-10"
          >
            一键发布到抖音，让更多老友看到您的作品
            <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 rotate-45"></div>
          </div>
        </transition>
      </button>

      <div class="grid grid-cols-2 gap-4 md:gap-5">
        <button
          @click="emit('save')"
          class="elder-btn-green !w-full !min-w-0 !min-h-[68px] md:!min-h-[72px] !text-elder-base md:!text-elder-lg shadow-xl"
        >
          <Download class="w-6 h-6 md:w-7 md:h-7" :stroke-width="2.2" />
          保存作品到相册
        </button>
        <button
          @click="emit('share-family')"
          class="elder-btn-blue !w-full !min-w-0 !min-h-[68px] md:!min-h-[72px] !text-elder-base md:!text-elder-lg shadow-xl"
        >
          <Send class="w-6 h-6 md:w-7 md:h-7" :stroke-width="2.2" />
          分享给子女家人
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin-slow {
  animation: spin-slow 4s linear infinite;
}
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
