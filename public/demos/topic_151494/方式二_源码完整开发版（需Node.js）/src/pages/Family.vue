<script setup lang="ts">
import { computed, ref } from 'vue'
import { Send, Clock, MessageCircle, Volume2, Play, Smartphone } from 'lucide-vue-next'
import BigCard from '@/components/BigCard.vue'
import AICompanion from '@/components/AICompanion.vue'
import { useSettingsStore } from '@/stores/settings'
import { useFamilyStore } from '@/stores/family'
import { mockVideos } from '@/mock/videos'
import { formatDate, formatNumber } from '@/utils/formatters'
import { mockParseDouyinLink } from '@/utils/douyinParser'
import { useSpeech } from '@/composables/useSpeech'
import type { DouyinVideo } from '@/types'

const settings = useSettingsStore()
const family = useFamilyStore()
const speech = useSpeech()

const isChild = computed(() => settings.settings.currentMode === 'child')

// 推送视频表单
const pushLink = ref('')
const pushRemark = ref('')
const pushCategory = ref<'opera' | 'health' | 'food' | 'other'>('health')
const parsedPreview = ref<DouyinVideo | null>(null)
const parsing = ref(false)

// 语音留言
const newMsg = ref('')
const suggestedMsgs = [
  '爸妈，天气冷了多穿衣服，按时吃药哦❤️',
  '我下周末回家看你们！',
  '中午记得睡午觉，晚上少刷会儿手机~',
  '钱不够花跟我说，别省着！',
  '给你们买的钙片记得每天吃一片'
]

const categoryOptions = [
  { value: 'opera', label: '🎭 戏曲/老歌', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { value: 'health', label: '💪 养生/保健', color: 'bg-elder-green/15 text-elder-green border-elder-green/30' },
  { value: 'food', label: '🍲 美食/家常菜', color: 'bg-elder-orange/15 text-elder-orange border-elder-orange/30' },
  { value: 'other', label: '✨ 其他精彩', color: 'bg-elder-blue/15 text-elder-blue border-elder-blue/30' }
]

const pushedWithVideos = computed(() => {
  return family.pushedVideos.map(pv => ({
    ...pv,
    videoObj: mockVideos.find(v => v.id === pv.videoId) || mockVideos[0]
  })).slice(0, 10)
})

async function parsePushLink() {
  if (!pushLink.value.trim()) return
  parsing.value = true
  try {
    parsedPreview.value = await mockParseDouyinLink(pushLink.value)
  } finally {
    parsing.value = false
  }
}

function pushSampleVideo(v: DouyinVideo, cat: typeof pushCategory.value) {
  pushLink.value = v.id
  parsedPreview.value = v
  pushCategory.value = cat
}

function submitPush() {
  if (!parsedPreview.value) return
  family.pushVideo({
    videoId: parsedPreview.value.id,
    fromChild: settings.settings.childName,
    remark: pushRemark.value || `给爸妈分享的${categoryOptions.find(c => c.value === pushCategory.value)?.label.split(' ')[1] || ''}视频`,
    category: pushCategory.value
  })
  speech.speak('视频推送成功，爸妈打开首页就能看到啦。', { rateLevel: settings.settings.speechRate })
  pushLink.value = ''
  pushRemark.value = ''
  parsedPreview.value = null
}

function sendMsg(text?: string) {
  const t = (text || newMsg.value).trim()
  if (!t) return
  family.sendMessage(settings.settings.childName, t)
  newMsg.value = ''
}

function readMsg(text: string) {
  speech.speak(text, { rateLevel: settings.settings.speechRate })
}

// 观看时长设置
const dailyLimit = computed({
  get: () => settings.settings.dailyLimitMinutes,
  set: (v) => settings.updateSettings({ dailyLimitMinutes: v })
})
const eyeReminder = computed({
  get: () => settings.settings.eyeReminderEnabled,
  set: (v) => settings.updateSettings({ eyeReminderEnabled: v })
})
const exerciseReminder = computed({
  get: () => settings.settings.exerciseReminderEnabled,
  set: (v) => settings.updateSettings({ exerciseReminderEnabled: v })
})

const limitOptions = [60, 90, 120, 180, 240, 300]
</script>

<template>
  <div class="page-container">
    <section class="elder-card p-8 md:p-10 mb-10 relative overflow-hidden border-2 border-blue-200/60" style="background: linear-gradient(135deg, #F0F9FF 0%, #EFF6FF 50%, #F0FDFA 100%);">
      <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-elder-blue/12 blur-3xl"></div>
      <div class="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-sky-300/15 blur-3xl"></div>
      <div class="relative">
        <div class="flex items-center gap-3 mb-8 flex-wrap">
          <div class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-sm border border-blue-200">
            <span class="w-3 h-3 rounded-full bg-elder-blue animate-pulse-soft"></span>
            <span class="text-elder-sm font-bold text-elder-ink">亲情陪伴中心</span>
          </div>
          <div class="elder-chip bg-gradient-to-r from-elder-blue/10 to-sky-400/10 text-elder-blue border border-elder-blue/20">
            👨‍👩‍👧 子女远程关爱，温暖陪伴每一天
          </div>
        </div>
        <AICompanion />
      </div>
    </section>

    <!-- 角色切换提醒 -->
    <div v-if="!isChild" class="elder-card p-8 mb-10 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border-2 border-elder-blue/30">
      <div class="flex items-start gap-6 flex-wrap">
        <div class="w-20 h-20 rounded-elder-2xl bg-elder-blue text-white flex items-center justify-center text-5xl shadow-lg shrink-0">
          👨‍👩‍👧
        </div>
        <div class="flex-1 min-w-[260px]">
          <h2 class="text-elder-xl font-black text-elder-ink">当前是长辈模式</h2>
          <p class="mt-4 text-elder-sm text-elder-ink leading-10">
            这里可以看到子女给您推送的视频和留言。
            <span class="font-bold text-elder-blue">如果您是子女，请点右上角切换到「子女模式」</span>
            ，为爸妈远程推送精选视频、发送语音留言、设置护眼提醒。
          </p>
          <button
            @click="settings.setMode('child')"
            class="elder-btn-blue mt-6"
          >
            → 切换到子女模式
          </button>
        </div>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-8">
      <!-- 左列：推送视频列表 / 推送表单 -->
      <div class="space-y-8">
        <!-- 子女模式：推送表单 -->
        <BigCard
          v-if="isChild"
          icon="💌"
          title="给爸妈推送好看的视频"
          subtitle="粘贴抖音链接，一键把戏曲、养生、美食视频送到爸妈首页"
        >
          <div class="space-y-5">
            <div>
              <label class="elder-label">🔗 粘贴抖音视频链接</label>
              <div class="flex gap-3">
                <input v-model="pushLink" type="text" class="elder-input flex-1" placeholder="抖音视频链接或ID" @keyup.enter="parsePushLink" />
                <button @click="parsePushLink" :disabled="parsing" class="elder-btn-blue !min-w-[140px]">
                  {{ parsing ? '解析中...' : '解析预览' }}
                </button>
              </div>
            </div>

            <!-- 预览 -->
            <div v-if="parsedPreview" class="p-5 rounded-elder-xl border-2 border-elder-green/40 bg-green-50 flex gap-5">
              <img :src="parsedPreview.coverUrl" class="w-32 md:w-36 aspect-video rounded-elder object-cover shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="text-elder-sm font-bold text-elder-ink leading-9 line-clamp-2">
                  {{ parsedPreview.title }}
                </div>
                <div class="text-elder-xs text-elder-muted mt-2">
                  {{ parsedPreview.author }} · ❤️ {{ formatNumber(parsedPreview.likes) }}
                </div>
              </div>
            </div>

            <div>
              <label class="elder-label">🗂️ 选择分类</label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  v-for="c in categoryOptions"
                  :key="c.value"
                  @click="pushCategory = c.value as any"
                  class="h-16 px-3 rounded-elder border-2 font-bold text-elder-xs transition-all active:scale-95"
                  :class="pushCategory === c.value ? c.color + ' shadow scale-[1.02]' : 'bg-white border-gray-200 text-elder-ink hover:border-gray-300'"
                >
                  {{ c.label }}
                </button>
              </div>
            </div>

            <div>
              <label class="elder-label">💬 给爸妈说句话（可选）</label>
              <input
                v-model="pushRemark"
                type="text"
                class="elder-input"
                placeholder="例如：妈这个揉肚子操您试试，效果特别好"
              />
            </div>

            <button
              @click="submitPush"
              :disabled="!parsedPreview"
              class="elder-btn-primary w-full !justify-center"
              :class="{ 'opacity-50 pointer-events-none': !parsedPreview }"
            >
              <Send class="w-7 h-7" :stroke-width="2" />
              立即推送给爸妈
            </button>

            <!-- 快捷推荐 -->
            <div class="pt-4 border-t border-gray-100">
              <div class="text-elder-xs text-elder-muted mb-4">💡 不知道推什么？一键推送精选：</div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  @click="pushSampleVideo(mockVideos[0], 'opera')"
                  class="p-4 rounded-elder border border-purple-200 bg-purple-50 hover:bg-purple-100 text-left transition-all active:scale-[0.98]"
                >
                  <div class="text-elder-sm font-bold text-purple-700">🎭 推《贵妃醉酒》</div>
                  <div class="text-elder-xs text-elder-muted mt-1">京剧经典·爸妈最爱</div>
                </button>
                <button
                  @click="pushSampleVideo(mockVideos[3], 'health')"
                  class="p-4 rounded-elder border border-elder-green/30 bg-green-50 hover:bg-green-100 text-left transition-all active:scale-[0.98]"
                >
                  <div class="text-elder-sm font-bold text-elder-green">💪 推揉肚子保健操</div>
                  <div class="text-elder-xs text-elder-muted mt-1">中老年养生·每天5分钟</div>
                </button>
              </div>
            </div>
          </div>
        </BigCard>

        <!-- 视频列表 -->
        <BigCard
          icon="🎬"
          :title="isChild ? '已推送给爸妈的视频' : '👨‍👩‍👧 子女推送给我的视频'"
        >
          <div class="space-y-4">
            <div
              v-for="p in pushedWithVideos"
              :key="p.id"
              class="p-5 rounded-elder-xl bg-gradient-to-r from-blue-50/80 to-orange-50/60 border border-blue-100 flex gap-5 items-stretch cursor-pointer hover:shadow-md transition-all"
              @click="$router.push(`/watch?v=${encodeURIComponent(p.videoId)}`)"
            >
              <div class="relative w-36 md:w-44 aspect-video shrink-0 rounded-elder overflow-hidden bg-gray-200">
                <img :src="p.videoObj.coverUrl" class="w-full h-full object-cover" />
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="w-12 h-12 rounded-full bg-black/55 text-white flex items-center justify-center text-2xl border-2 border-white/20">▶</div>
                </div>
              </div>
              <div class="flex-1 min-w-0 py-1">
                <div class="text-elder-base font-bold text-elder-ink leading-9 line-clamp-2">
                  {{ p.videoObj.title }}
                </div>
                <div class="mt-3 text-elder-xs text-elder-muted flex items-center gap-3 flex-wrap">
                  <span class="px-3 py-1 rounded-full bg-white shadow-sm font-semibold text-elder-blue">
                    💝 {{ p.fromChild }} · {{ formatDate(p.pushedAt, 'with-time') }}
                  </span>
                </div>
                <div v-if="p.remark" class="mt-3 p-4 rounded-xl bg-white border border-blue-100 text-elder-sm text-elder-ink leading-9">
                  💬 {{ p.remark }}
                </div>
              </div>
            </div>
          </div>
        </BigCard>
      </div>

      <!-- 右列：语音留言 + 观看设置 -->
      <div class="space-y-8">
        <BigCard
          icon="💬"
          :title="isChild ? '给爸妈发送语音/文字留言' : '💝 子女给我的留言'"
          :subtitle="isChild ? '输入文字自动转语音朗读，爸妈打开就能听到您的声音~' : '点喇叭听子女的留言，点一下标记已读'"
        >
          <template v-if="isChild">
            <div class="space-y-5">
              <textarea
                v-model="newMsg"
                class="elder-input !min-h-[140px] py-5 leading-10 resize-none"
                placeholder="想对爸妈说的话，比如：天冷加衣、按时吃药、我下周回家..."
              ></textarea>
              <button @click="sendMsg()" :disabled="!newMsg.trim()" class="elder-btn-primary w-full !justify-center"
                :class="{ 'opacity-50 pointer-events-none': !newMsg.trim() }"
              >
                <MessageCircle class="w-7 h-7" />
                📢 发送语音留言（自动朗读）
              </button>
              <div class="pt-5 border-t border-gray-100">
                <div class="text-elder-xs text-elder-muted mb-4">💡 快捷留言一键发送：</div>
                <div class="grid grid-cols-1 gap-3">
                  <button
                    v-for="m in suggestedMsgs"
                    :key="m"
                    @click="sendMsg(m)"
                    class="p-4 rounded-elder border-2 border-orange-200 bg-white hover:bg-orange-50 hover:border-elder-orange transition-all text-left active:scale-[0.98]"
                  >
                    <div class="text-elder-sm text-elder-ink leading-8">💬 {{ m }}</div>
                  </button>
                </div>
              </div>
            </div>
          </template>
          <div class="space-y-4">
            <div
              v-for="m in family.voiceMessages"
              :key="m.id"
              class="p-6 rounded-elder-xl border-2 transition-all"
              :class="m.read ? 'bg-white border-gray-200' : 'bg-gradient-to-r from-orange-50 to-yellow-50 border-elder-orange/40 shadow'"
            >
              <div class="flex items-start gap-5">
                <div class="w-14 h-14 rounded-full bg-gradient-to-br from-elder-blue to-elder-green text-white flex items-center justify-center text-3xl shrink-0 shadow">
                  👩‍👧
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-4 flex-wrap mb-2">
                    <span class="text-elder-base font-bold text-elder-ink">{{ m.fromChild }}</span>
                    <span v-if="!m.read" class="elder-chip bg-elder-red/15 text-elder-red border-elder-red/30 animate-pulse-soft">
                      🔴 新留言
                    </span>
                    <span class="text-elder-xs text-elder-muted flex items-center gap-1">
                      <Clock class="w-4 h-4" /> {{ formatDate(m.createdAt, 'with-time') }}
                    </span>
                  </div>
                  <p class="text-elder-base text-elder-ink leading-10 mt-3">
                    「{{ m.text }}」
                  </p>
                  <div class="mt-5 flex flex-wrap gap-3">
                    <button
                      @click="readMsg(m.text)"
                      class="elder-btn-outline !min-h-[56px] !px-5 !text-elder-sm"
                    >
                      <Volume2 class="w-6 h-6" /> 🔊 播放语音
                    </button>
                    <button
                      v-if="!m.read"
                      @click="m.read = true; family.unreadCount = Math.max(0, family.unreadCount - 1)"
                      class="elder-btn-green !min-h-[56px] !px-5 !text-elder-sm"
                    >
                      ✓ 标记已读
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button
              v-if="family.voiceMessages.some(m => !m.read)"
              @click="family.markAllRead()"
              class="w-full elder-btn-outline"
            >
              ✓ 全部标记已读
            </button>
          </div>
        </BigCard>

        <!-- 子女模式：观看限制 -->
        <BigCard
          v-if="isChild"
          icon="⏰"
          title="观看时长 & 健康提醒设置"
          subtitle="为爸妈的眼睛和身体着想，设置每天最大时长，定时提醒休息"
        >
          <div class="space-y-8">
            <div class="p-6 rounded-elder-xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
              <div class="flex items-center justify-between mb-4 flex-wrap gap-4">
                <label class="elder-label !mb-0 flex items-center gap-3">
                  <Smartphone class="w-7 h-7 text-elder-orange" />
                  每日最大观看时长
                </label>
                <span class="elder-chip bg-white text-elder-orange border border-amber-300 font-bold">
                  ⏱️ {{ dailyLimit < 60 ? dailyLimit + '分钟' : (dailyLimit / 60) + '小时' }}
                </span>
              </div>
              <div class="grid grid-cols-3 md:grid-cols-6 gap-3 mt-5">
                <button
                  v-for="opt in limitOptions"
                  :key="opt"
                  @click="dailyLimit = opt"
                  class="h-16 rounded-elder border-2 transition-all active:scale-95"
                  :class="dailyLimit === opt
                    ? 'bg-elder-orange text-white border-elder-orange shadow-elder-orange'
                    : 'bg-white text-elder-ink border-amber-200 hover:border-elder-orange'"
                >
                  <span class="text-elder-sm font-bold">
                    {{ opt < 60 ? opt + '分钟' : (opt / 60) + '小时' }}
                  </span>
                </button>
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-5">
              <div
                class="p-6 rounded-elder-xl border-2 cursor-pointer transition-all"
                :class="eyeReminder ? 'bg-blue-50 border-elder-blue/50 shadow' : 'bg-white border-gray-200'"
                @click="eyeReminder = !eyeReminder"
              >
                <div class="flex items-center justify-between mb-3">
                  <span class="text-elder-base font-bold text-elder-ink flex items-center gap-2">
                    <span class="emoji-icon text-2xl">👀</span> 每30分钟护眼提醒
                  </span>
                  <div
                    class="w-16 h-9 rounded-full transition-all relative"
                    :class="eyeReminder ? 'bg-elder-blue' : 'bg-gray-300'"
                  >
                    <div
                      class="absolute top-1 w-7 h-7 bg-white rounded-full shadow transition-all"
                      :style="{ left: eyeReminder ? 'calc(100% - 32px)' : '4px' }"
                    ></div>
                  </div>
                </div>
                <p class="text-elder-xs text-elder-muted leading-8">
                  每连续刷30分钟，弹窗提醒站起来远眺窗外绿色植物
                </p>
              </div>
              <div
                class="p-6 rounded-elder-xl border-2 cursor-pointer transition-all"
                :class="exerciseReminder ? 'bg-green-50 border-elder-green/50 shadow' : 'bg-white border-gray-200'"
                @click="exerciseReminder = !exerciseReminder"
              >
                <div class="flex items-center justify-between mb-3">
                  <span class="text-elder-base font-bold text-elder-ink flex items-center gap-2">
                    <span class="emoji-icon text-2xl">💪</span> 每60分钟活动提醒
                  </span>
                  <div
                    class="w-16 h-9 rounded-full transition-all relative"
                    :class="exerciseReminder ? 'bg-elder-green' : 'bg-gray-300'"
                  >
                    <div
                      class="absolute top-1 w-7 h-7 bg-white rounded-full shadow transition-all"
                      :style="{ left: exerciseReminder ? 'calc(100% - 32px)' : '4px' }"
                    ></div>
                  </div>
                </div>
                <p class="text-elder-xs text-elder-muted leading-8">
                  每满1小时弹窗引导做颈椎操/肩部拍打操，避免久坐伤身
                </p>
              </div>
            </div>
          </div>
        </BigCard>
      </div>
    </div>
  </div>
</template>
