<script setup lang="ts">
import { computed, ref } from 'vue'
import { QrCode, Plus, Download, MapPin, Calendar, Upload, Share2, X } from 'lucide-vue-next'
import BigCard from '@/components/BigCard.vue'
import AICompanion from '@/components/AICompanion.vue'
import { useCommunityStore } from '@/stores/community'
import { useQRCode } from '@/composables/useQRCode'
import { mockVideos } from '@/mock/videos'
import { useSettingsStore } from '@/stores/settings'
import { useSpeech } from '@/composables/useSpeech'
import { formatDate, formatNumber } from '@/utils/formatters'
import type { DouyinVideo } from '@/types'

const settings = useSettingsStore()
const community = useCommunityStore()
const qr = useQRCode()
const speech = useSpeech()

const isCommunity = computed(() => settings.settings.currentMode === 'community')

// 生成二维码弹窗
const showQR = ref(false)
const currentCol = ref<string | null>(null)
const qrImg = ref('')
const qrCollection = computed(() => community.collections.find(c => c.id === currentCol.value))
const qrCollectionVideos = computed(() =>
  (qrCollection.value?.videoIds || []).map(id => mockVideos.find(v => v.id === id)).filter(Boolean) as DouyinVideo[]
)

async function openQR(colId: string) {
  currentCol.value = colId
  const col = community.collections.find(c => c.id === colId)
  if (!col) return
  // 如果没二维码则生成
  const url = col.qrCodeDataUrl || await qr.generate(`https://sliver-tiktok.app/collection/${col.id}`, 400)
  if (!col.qrCodeDataUrl) community.attachQRCode(colId, url)
  qrImg.value = url
  showQR.value = true
  speech.speak('二维码已生成，社区老人扫码即可观看合集内全部视频。', { rateLevel: settings.settings.speechRate })
}

function downloadQR() {
  if (!qrCollection.value) return
  qr.generateDownload(`https://sliver-tiktok.app/collection/${qrCollection.value.id}`, `${qrCollection.value.name}-二维码.png`)
}

// 新建合集
const showNew = ref(false)
const newColName = ref('')
const selectedVideoIds = ref<string[]>([])
const availableVideos = computed(() => mockVideos.filter(v => v.category !== 'fraud-demo'))
function toggleVideo(id: string) {
  const i = selectedVideoIds.value.indexOf(id)
  if (i >= 0) selectedVideoIds.value.splice(i, 1)
  else selectedVideoIds.value.push(id)
}
function createCol() {
  if (!newColName.value.trim() || !selectedVideoIds.value.length) return
  community.createCollection(
    newColName.value.trim(),
    selectedVideoIds.value,
    (availableVideos.value.find(v => v.id === selectedVideoIds.value[0]))?.coverUrl || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20elderly%20community%20sharing%20happy%20group%20activity%20warm&image_size=landscape_4_3'
  )
  newColName.value = ''
  selectedVideoIds.value = []
  showNew.value = false
}

// 活动表单
const showEvent = ref(false)
const eventForm = ref({
  title: '',
  date: '',
  location: '',
  description: '',
  emoji: '🎉'
})
const emojis = ['🎉', '🏮', '📚', '💃', '🍲', '🎯', '🎵', '🏃']
function publish() {
  if (!eventForm.value.title || !eventForm.value.date || !eventForm.value.location) return
  community.publishEvent({
    ...eventForm.value,
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20elderly%20community%20event%20activity%20celebration%20happy%20warm%20gathering&image_size=landscape_16_9'
  })
  eventForm.value = { title: '', date: '', location: '', description: '', emoji: '🎉' }
  showEvent.value = false
}
</script>

<template>
  <div class="page-container">
    <section class="elder-card p-8 md:p-10 mb-10 relative overflow-hidden border-2 border-purple-200/60" style="background: linear-gradient(135deg, #FAF5FF 0%, #F5F3FF 50%, #ECFEFF 100%);">
      <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-purple-500/12 blur-3xl"></div>
      <div class="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-indigo-300/15 blur-3xl"></div>
      <div class="relative">
        <div class="flex items-center gap-3 mb-8 flex-wrap">
          <div class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-sm border border-purple-200">
            <span class="w-3 h-3 rounded-full bg-purple-500 animate-pulse-soft"></span>
            <span class="text-elder-sm font-bold text-elder-ink">邻里社区中心</span>
          </div>
          <div class="elder-chip bg-gradient-to-r from-purple-500/10 to-indigo-400/10 text-purple-600 border border-purple-400/20">
            🏘️ 社区活动 + 老友分享，生活更精彩
          </div>
        </div>
        <AICompanion />
      </div>
    </section>

    <!-- 角色切换提醒 -->
    <div v-if="!isCommunity" class="elder-card p-8 mb-10 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-2 border-elder-green/30">
      <div class="flex items-start gap-6 flex-wrap">
        <div class="w-20 h-20 rounded-elder-2xl bg-elder-green text-white flex items-center justify-center text-5xl shadow-lg shrink-0">
          🏘️
        </div>
        <div class="flex-1 min-w-[260px]">
          <h2 class="text-elder-xl font-black text-elder-ink">当前是长辈模式</h2>
          <p class="mt-4 text-elder-sm text-elder-ink leading-10">
            这里可以查看社区活动、扫码分享别人的合集。
            <span class="font-bold text-elder-green">如果您是社区活动室运营人员，请切到「社区模式」</span>
            发布活动、导出合集二维码打印给老人。
          </p>
          <button @click="settings.setMode('community')" class="elder-btn-green mt-6">
            → 切换到社区模式
          </button>
        </div>
      </div>
    </div>

    <!-- 合集区 -->
    <div class="mb-12">
      <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h2 class="text-elder-xl font-black text-elder-ink flex items-center gap-4">
          <span class="emoji-icon text-4xl">📚</span> 社区短视频合集
          <span class="text-elder-sm font-normal text-elder-muted">（导出二维码，打印出来给老人扫码即看）</span>
        </h2>
        <button
          v-if="isCommunity"
          @click="showNew = true"
          class="elder-btn-primary"
        >
          <Plus class="w-7 h-7" :stroke-width="2.2" />
          新建合集
        </button>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="col in community.collections"
          :key="col.id"
          class="elder-card overflow-hidden group hover:-translate-y-1 hover:shadow-elder-lg transition-all"
        >
          <div class="relative aspect-[3/2] bg-gray-100 overflow-hidden">
            <img :src="col.coverUrl" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div class="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur text-elder-xs font-bold text-elder-ink shadow">
              🎬 {{ col.videoIds.length }} 条视频
            </div>
            <div class="absolute bottom-5 left-5 right-5">
              <div class="text-white text-elder-lg font-black drop-shadow-lg leading-tight">{{ col.name }}</div>
              <div class="text-white/80 text-elder-xs mt-1">创建于 {{ formatDate(col.createdAt, 'simple') }}</div>
            </div>
          </div>
          <div class="p-6 space-y-4">
            <div class="flex -space-x-3">
              <div
                v-for="(vid, i) in (col.videoIds.slice(0, 3))"
                :key="vid + i"
                class="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow bg-gray-100"
              >
                <img :src="(mockVideos.find(v => v.id === vid)?.coverUrl || '')" class="w-full h-full object-cover" />
              </div>
              <div
                v-if="col.videoIds.length > 3"
                class="w-12 h-12 rounded-full border-2 border-white bg-elder-orange text-white text-elder-xs font-bold flex items-center justify-center shadow"
              >
                +{{ col.videoIds.length - 3 }}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <button @click="openQR(col.id)" class="elder-btn-blue !min-h-[56px] !px-3 !text-elder-sm">
                <QrCode class="w-6 h-6" /> 生成二维码
              </button>
              <button
                v-if="isCommunity"
                @click="openQR(col.id)"
                class="elder-btn-outline !min-h-[56px] !px-3 !text-elder-sm"
              >
                <Download class="w-6 h-6" /> 打印分享
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 活动区 -->
    <div>
      <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h2 class="text-elder-xl font-black text-elder-ink flex items-center gap-4">
          <span class="emoji-icon text-4xl">🎊</span> 社区线下活动
          <span class="text-elder-sm font-normal text-elder-muted">（社区活动 + 线下报名，丰富老年生活）</span>
        </h2>
        <button
          v-if="isCommunity"
          @click="showEvent = true"
          class="elder-btn-green"
        >
          <Plus class="w-7 h-7" :stroke-width="2.2" />
          发布新活动
        </button>
      </div>

      <div class="space-y-6">
        <div
          v-for="ev in community.events"
          :key="ev.id"
          class="elder-card overflow-hidden md:flex items-stretch hover:shadow-elder-lg transition-all"
        >
          <div class="md:w-[360px] shrink-0 relative aspect-[2/1] md:aspect-auto bg-gray-100 overflow-hidden">
            <img :src="ev.coverUrl" class="w-full h-full object-cover" />
            <div class="absolute top-4 left-4 w-16 h-16 rounded-elder bg-white/95 shadow flex flex-col items-center justify-center">
              <div class="emoji-icon text-2xl">{{ ev.emoji }}</div>
              <div class="text-elder-xs font-bold text-elder-muted mt-0.5">活动</div>
            </div>
          </div>
          <div class="flex-1 p-7 md:p-8">
            <h3 class="text-elder-xl font-black text-elder-ink mb-5">{{ ev.title }}</h3>
            <div class="space-y-3 md:space-y-4 mb-6">
              <div class="flex items-start gap-4">
                <span class="w-11 h-11 rounded-xl bg-orange-100 text-elder-orange flex items-center justify-center shrink-0">
                  <Calendar class="w-6 h-6" :stroke-width="2" />
                </span>
                <div>
                  <div class="text-elder-xs text-elder-muted">活动时间</div>
                  <div class="text-elder-base font-bold text-elder-ink mt-0.5">{{ ev.date }}</div>
                </div>
              </div>
              <div class="flex items-start gap-4">
                <span class="w-11 h-11 rounded-xl bg-blue-100 text-elder-blue flex items-center justify-center shrink-0">
                  <MapPin class="w-6 h-6" :stroke-width="2" />
                </span>
                <div>
                  <div class="text-elder-xs text-elder-muted">活动地点</div>
                  <div class="text-elder-base font-bold text-elder-ink mt-0.5">{{ ev.location }}</div>
                </div>
              </div>
            </div>
            <p class="text-elder-sm text-elder-ink leading-10 p-5 rounded-elder bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-elder-orange mb-6">
              {{ ev.description }}
            </p>
            <div class="flex flex-wrap gap-4">
              <button class="elder-btn-primary">
                🙋 我要报名参加
              </button>
              <button class="elder-btn-outline">
                <Share2 class="w-6 h-6" /> 分享给老友
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 二维码弹窗 -->
    <transition name="fade">
      <div v-if="showQR" class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showQR = false"></div>
        <div class="relative w-full max-w-[560px] bg-white rounded-elder-2xl shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
          <button
            @click="showQR = false"
            class="absolute top-5 right-5 w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-elder-ink transition-all z-10"
          >
            <X class="w-7 h-7" :stroke-width="2.2" />
          </button>
          <div class="bg-gradient-to-br from-elder-orange via-orange-500 to-elder-red px-8 py-10 text-white text-center">
            <div class="emoji-icon text-6xl mb-3">🏘️</div>
            <div class="text-elder-xl font-black">社区短视频合集</div>
            <div v-if="qrCollection" class="mt-2 text-elder-base opacity-90">「{{ qrCollection.name }}」</div>
          </div>
          <div class="p-8 md:p-10 text-center">
            <div class="mx-auto p-6 bg-white rounded-elder-2xl border-4 border-elder-orange/30 inline-block shadow-lg">
              <img :src="qrImg" alt="二维码" class="w-[280px] h-[280px]" />
            </div>
            <div class="mt-6 text-elder-base font-bold text-elder-ink">
              👉 用抖音 / 微信扫一扫即可观看全部视频
            </div>
            <div class="mt-3 text-elder-sm text-elder-muted">
              共 {{ qrCollectionVideos.length }} 条视频，无需下载安装
            </div>

            <!-- 视频清单 -->
            <div class="mt-8 text-left">
              <div class="text-elder-sm font-bold text-elder-ink mb-4 flex items-center gap-2">
                <span class="emoji-icon text-2xl">📋</span>
                合集包含内容：
              </div>
              <div class="space-y-3 max-h-[260px] overflow-y-auto pr-2">
                <div
                  v-for="(v, i) in qrCollectionVideos"
                  :key="v.id"
                  class="flex gap-4 items-center p-4 rounded-xl bg-orange-50 border border-orange-100"
                >
                  <img :src="v.coverUrl" class="w-20 h-14 rounded-lg object-cover shrink-0" />
                  <div class="flex-1 min-w-0">
                    <div class="text-elder-sm font-semibold text-elder-ink line-clamp-2 leading-8">
                      {{ i + 1 }}. {{ v.title }}
                    </div>
                    <div class="text-elder-xs text-elder-muted mt-1">
                      ❤️ {{ formatNumber(v.likes) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-8 grid grid-cols-2 gap-4">
              <button @click="downloadQR" class="elder-btn-blue">
                <Download class="w-6 h-6" /> 下载/打印图片
              </button>
              <button @click="showQR = false" class="elder-btn-outline">
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 新建合集弹窗 -->
    <transition name="fade">
      <div v-if="showNew" class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showNew = false"></div>
        <div class="relative w-full max-w-[880px] max-h-[90vh] overflow-y-auto bg-white rounded-elder-2xl shadow-2xl">
          <button
            @click="showNew = false"
            class="absolute top-5 right-5 w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center z-10"
          >
            <X class="w-7 h-7" :stroke-width="2.2" />
          </button>
          <div class="p-8 md:p-10">
            <h3 class="text-elder-xl font-black text-elder-ink flex items-center gap-3 mb-8">
              <span class="emoji-icon text-4xl">📚</span> 新建社区视频合集
            </h3>
            <div class="space-y-8">
              <div>
                <label class="elder-label">合集名称</label>
                <input v-model="newColName" class="elder-input" placeholder="例如：重阳节广场舞精选合集（10首）" />
              </div>
              <div>
                <label class="elder-label">选择要加入合集的视频（点击选择，已选 {{ selectedVideoIds.length }} 条）</label>
                <div class="grid md:grid-cols-2 gap-4 max-h-[360px] overflow-y-auto pr-2">
                  <div
                    v-for="v in availableVideos"
                    :key="v.id"
                    @click="toggleVideo(v.id)"
                    class="p-4 rounded-elder border-2 cursor-pointer transition-all flex gap-4"
                    :class="selectedVideoIds.includes(v.id)
                      ? 'border-elder-orange bg-orange-50 shadow-elder'
                      : 'border-gray-200 bg-white hover:border-orange-300'"
                  >
                    <img :src="v.coverUrl" class="w-24 h-16 rounded-lg object-cover shrink-0" />
                    <div class="flex-1 min-w-0">
                      <div class="text-elder-sm font-bold text-elder-ink line-clamp-2 leading-8">
                        {{ v.title }}
                      </div>
                      <div class="text-elder-xs text-elder-muted mt-1">{{ v.author }}</div>
                    </div>
                    <div
                      v-if="selectedVideoIds.includes(v.id)"
                      class="w-9 h-9 rounded-full bg-elder-orange text-white flex items-center justify-center font-black shrink-0 self-center"
                    >✓</div>
                  </div>
                </div>
              </div>
              <div class="flex flex-wrap gap-4 pt-2">
                <button
                  @click="createCol"
                  :disabled="!newColName.trim() || !selectedVideoIds.length"
                  class="elder-btn-primary"
                  :class="{ 'opacity-50 pointer-events-none': !newColName.trim() || !selectedVideoIds.length }"
                >
                  ✅ 创建合集
                </button>
                <button @click="showNew = false" class="elder-btn-outline">取消</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 发布活动弹窗 -->
    <transition name="fade">
      <div v-if="showEvent" class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showEvent = false"></div>
        <div class="relative w-full max-w-[720px] max-h-[90vh] overflow-y-auto bg-white rounded-elder-2xl shadow-2xl">
          <button
            @click="showEvent = false"
            class="absolute top-5 right-5 w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center z-10"
          >
            <X class="w-7 h-7" :stroke-width="2.2" />
          </button>
          <div class="p-8 md:p-10">
            <h3 class="text-elder-xl font-black text-elder-ink flex items-center gap-3 mb-8">
              <span class="emoji-icon text-4xl">🎊</span> 发布社区活动
            </h3>
            <div class="space-y-7">
              <div>
                <label class="elder-label">选择活动图标</label>
                <div class="flex gap-3 flex-wrap">
                  <button
                    v-for="e in emojis"
                    :key="e"
                    @click="eventForm.emoji = e"
                    class="w-16 h-16 rounded-elder border-2 text-4xl transition-all active:scale-95"
                    :class="eventForm.emoji === e ? 'border-elder-orange bg-orange-50 shadow-elder scale-110' : 'border-gray-200 bg-white hover:border-orange-300'"
                  >
                    {{ e }}
                  </button>
                </div>
              </div>
              <div>
                <label class="elder-label">活动标题</label>
                <input v-model="eventForm.title" class="elder-input" placeholder="例如：社区重阳节百家宴 / 手机课堂第5期" />
              </div>
              <div class="grid md:grid-cols-2 gap-5">
                <div>
                  <label class="elder-label flex items-center gap-2">
                    <Calendar class="w-6 h-6" /> 活动时间
                  </label>
                  <input v-model="eventForm.date" class="elder-input" placeholder="例如：2026-10-19 14:00" />
                </div>
                <div>
                  <label class="elder-label flex items-center gap-2">
                    <MapPin class="w-6 h-6" /> 活动地点
                  </label>
                  <input v-model="eventForm.location" class="elder-input" placeholder="例如：阳光社区活动中心 3楼" />
                </div>
              </div>
              <div>
                <label class="elder-label">活动详情介绍</label>
                <textarea v-model="eventForm.description" class="elder-input !min-h-[160px] py-5 leading-10 resize-none" placeholder="介绍活动内容、报名方式、奖品等信息..."></textarea>
              </div>
              <div class="flex flex-wrap gap-4 pt-2">
                <button
                  @click="publish"
                  :disabled="!eventForm.title || !eventForm.date || !eventForm.location"
                  class="elder-btn-green"
                  :class="{ 'opacity-50 pointer-events-none': !eventForm.title || !eventForm.date || !eventForm.location }"
                >
                  📢 立即发布活动
                </button>
                <button @click="showEvent = false" class="elder-btn-outline">取消</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
