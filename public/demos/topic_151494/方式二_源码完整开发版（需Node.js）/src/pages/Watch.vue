<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Link, ClipboardPaste, Sparkles, Info } from 'lucide-vue-next'
import VideoPlayer from '@/components/VideoPlayer.vue'
import SpeechController from '@/components/SpeechController.vue'
import { mockParseDouyinLink } from '@/utils/douyinParser'
import type { DouyinVideo } from '@/types'
import BigCard from '@/components/BigCard.vue'
import AICompanion from '@/components/AICompanion.vue'
import { useSpeech } from '@/composables/useSpeech'
import { useSettingsStore } from '@/stores/settings'

const route = useRoute()
const router = useRouter()
const settings = useSettingsStore()
const speech = useSpeech()

const linkInput = ref('')
const loading = ref(false)
const errorMsg = ref('')
const currentVideo = ref<DouyinVideo | null>(null)

const sampleLinks = [
  { label: '京剧贵妃醉酒', link: 'https://v.douyin.com/share/video/dy_001_opera_01/' },
  { label: '广场舞最炫民族风', link: 'https://v.douyin.com/dy_003_dance_01/' },
  { label: '张阿姨红烧肉教程', link: 'https://v.douyin.com/i/dy_006_food_01/' }
]

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    if (text) linkInput.value = text
  } catch (e) {
    errorMsg.value = '没有粘贴权限，请长按输入框手动粘贴'
    setTimeout(() => (errorMsg.value = ''), 3000)
  }
}

function useSample(link: string) {
  linkInput.value = link
  parseAndPlay()
}

async function parseAndPlay() {
  const link = linkInput.value.trim()
  if (!link) {
    errorMsg.value = '请先粘贴或输入抖音视频链接哦~'
    setTimeout(() => (errorMsg.value = ''), 3000)
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const video = await mockParseDouyinLink(link)
    currentVideo.value = video
    speech.stop()
    setTimeout(() => {
      speech.speak(`正在为您播放：${video.title}。${video.description}`, { rateLevel: settings.settings.speechRate })
    }, 400)
  } catch (e: any) {
    errorMsg.value = e.message || '链接解析失败，请检查链接是否正确'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const v = route.query.v as string
  if (v) {
    linkInput.value = v
    parseAndPlay()
  }
})

watch(() => route.query.v, (nv) => {
  if (nv && nv !== linkInput.value) {
    linkInput.value = nv as string
    parseAndPlay()
  }
})
</script>

<template>
  <div class="page-container">
    <section class="elder-card p-8 md:p-10 mb-10 relative overflow-hidden border-2 border-orange-200/60" style="background: linear-gradient(135deg, #FFF8F0 0%, #FFFBEB 50%, #FFF5EB 100%);">
      <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-elder-orange/12 blur-3xl"></div>
      <div class="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-amber-300/15 blur-3xl"></div>
      <div class="relative">
        <div class="flex items-center gap-3 mb-8 flex-wrap">
          <div class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-sm border border-orange-200">
            <span class="w-3 h-3 rounded-full bg-elder-orange animate-pulse-soft"></span>
            <span class="text-elder-sm font-bold text-elder-ink">无障碍视频助手</span>
          </div>
          <div class="elder-chip bg-gradient-to-r from-elder-orange/10 to-amber-400/10 text-elder-orange border border-elder-orange/20">
            👀 大字版+语音朗读，看得更清楚
          </div>
        </div>
        <AICompanion />
      </div>
    </section>

    <BigCard icon="🔗" title="粘贴抖音视频链接" subtitle="打开抖音 → 找到喜欢的视频 → 点分享 → 点复制链接 → 回到这里粘贴">
      <div class="flex flex-col lg:flex-row items-stretch gap-5">
        <div class="relative flex-1">
          <Link class="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-elder-orange" :stroke-width="2" />
          <input
            v-model="linkInput"
            type="text"
            class="elder-input !pl-20 !pr-40"
            placeholder="在这里粘贴抖音视频链接，例如 https://v.douyin.com/xxxxxx"
            @keyup.enter="parseAndPlay"
          />
          <button
            @click="pasteFromClipboard"
            class="absolute right-3 top-1/2 -translate-y-1/2 h-[56px] px-5 rounded-elder bg-elder-orange/10 text-elder-orange border-2 border-elder-orange/30 hover:bg-elder-orange/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <ClipboardPaste class="w-6 h-6" :stroke-width="2" />
            <span class="text-elder-sm font-bold">粘贴</span>
          </button>
        </div>
        <button
          @click="parseAndPlay"
          :disabled="loading"
          class="lg:min-w-[240px] elder-btn-primary"
        >
          <template v-if="loading">
            <span class="animate-spin inline-block w-6 h-6 border-4 border-white/40 border-t-white rounded-full mr-2"></span>
            解析中...
          </template>
          <template v-else>
            <Sparkles class="w-7 h-7" :stroke-width="2" />
            开始无障碍播放
          </template>
        </button>
      </div>

      <div v-if="errorMsg" class="mt-6 p-5 rounded-elder bg-red-50 border-2 border-red-200 text-elder-sm text-elder-red leading-8">
        ⚠️ {{ errorMsg }}
      </div>

      <!-- 示例快捷 -->
      <div class="mt-8">
        <div class="flex items-center gap-3 mb-5 text-elder-sm font-semibold text-elder-ink">
          <Info class="w-6 h-6 text-elder-muted" :stroke-width="2" />
          不知道链接是什么？点下面示例一键体验：
        </div>
        <div class="flex flex-wrap gap-4">
          <button
            v-for="s in sampleLinks"
            :key="s.link"
            @click="useSample(s.link)"
            class="px-6 py-4 rounded-elder border-2 border-orange-200 bg-white hover:border-elder-orange hover:bg-orange-50 text-elder-sm font-semibold text-elder-ink transition-all active:scale-95 flex items-center gap-2"
          >
            <span class="emoji-icon text-2xl">🎵</span>
            {{ s.label }}
          </button>
        </div>
      </div>
    </BigCard>

    <!-- 语音控制器 -->
    <div class="mt-10">
      <SpeechController />
    </div>

    <!-- 视频播放 -->
    <div class="mt-10">
      <VideoPlayer :video="currentVideo" />
    </div>
  </div>
</template>
