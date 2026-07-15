<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PlayCircle, ShieldCheck, Scissors, HeartPulse, Dumbbell, Building2, Sparkles, Play, Zap } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'
import { useFamilyStore } from '@/stores/family'
import { mockVideos } from '@/mock/videos'
import { greetingText, todayText, formatNumber } from '@/utils/formatters'
import { useSpeech } from '@/composables/useSpeech'
import { triggerEyeReminder, triggerExerciseReminder, dismissAllReminders, showEyeReminder, showExerciseReminder } from '@/composables/useWatchTime'
import AICompanion from '@/components/AICompanion.vue'
import WelcomeAnimation from '@/components/WelcomeAnimation.vue'
import { useLocalStorage } from '@/composables/useLocalStorage'

function debugTriggerEye() {
  alert('🧪 调试：点击了「弹出护眼提醒」！现在触发弹窗…')
  try {
    triggerEyeReminder()
    alert('✅ 执行完成！当前 showEyeReminder.value = ' + JSON.stringify(showEyeReminder.value))
  } catch (e) {
    alert('❌ 触发出错：' + String(e))
  }
}
function debugTriggerExercise() {
  alert('🧪 调试：点击了「弹出活动筋骨」！现在触发弹窗…')
  try {
    triggerExerciseReminder()
    alert('✅ 执行完成！当前 showExerciseReminder.value = ' + JSON.stringify(showExerciseReminder.value))
  } catch (e) {
    alert('❌ 触发出错：' + String(e))
  }
}
function debugDismissAll() {
  alert('🧪 调试：点击了「关闭所有弹窗」！')
  try {
    dismissAllReminders()
    try {
      const e1 = document.getElementById('elder-eye-reminder-modal')
      const e2 = document.getElementById('elder-exercise-reminder-modal')
      if (e1) { e1.style.display = 'none'; e1.style.visibility = 'hidden' }
      if (e2) { e2.style.display = 'none'; e2.style.visibility = 'hidden' }
    } catch {}
  } catch (e) {
    alert('❌ 关闭出错：' + String(e))
  }
}

const router = useRouter()
const settings = useSettingsStore()
const family = useFamilyStore()
const speech = useSpeech()

const { state: welcomed, write: setWelcomed } = useLocalStorage<string>('v3_welcomed', 'false')
const showWelcome = ref(welcomed.value !== 'true')

function onWelcomeComplete() {
  showWelcome.value = false
  setWelcomed('true')
}

const greeting = computed(() => greetingText(settings.settings.elderName))
const today = todayText()

const coreEntries = [
  {
    path: '/watch',
    emoji: '👀',
    icon: PlayCircle,
    name: '看懂视频',
    desc: 'AI帮您理解每一个精彩内容',
    color: 'from-orange-400 via-amber-400 to-yellow-400',
    ring: 'ring-orange-300',
    shadow: 'shadow-orange-200',
    bg: 'from-orange-50 via-amber-50 to-yellow-50',
    tag: '无障碍观看',
    tagColor: 'text-elder-orange',
    tagBg: 'bg-orange-50 border-orange-200'
  },
  {
    path: '/anti-fraud',
    emoji: '🛡',
    icon: ShieldCheck,
    name: '安全守护',
    desc: 'AI帮您识别网络风险',
    color: 'from-red-400 via-rose-400 to-pink-400',
    ring: 'ring-red-300',
    shadow: 'shadow-red-200',
    bg: 'from-red-50 via-rose-50 to-pink-50',
    tag: '反诈预警',
    tagColor: 'text-elder-red',
    tagBg: 'bg-red-50 border-red-200'
  },
  {
    path: '/create',
    emoji: '🎬',
    icon: Scissors,
    name: '创造故事',
    desc: '把生活变成精彩视频',
    color: 'from-pink-400 via-fuchsia-400 to-purple-400',
    ring: 'ring-pink-300',
    shadow: 'shadow-pink-200',
    bg: 'from-pink-50 via-fuchsia-50 to-purple-50',
    tag: '一键创作',
    tagColor: 'text-purple-600',
    tagBg: 'bg-purple-50 border-purple-200'
  }
]

const moreServices = [
  { path: '/family', emoji: '👨‍👩‍👧', icon: HeartPulse, name: '亲情陪伴', desc: '子女远程关爱', color: 'from-elder-blue to-sky-500' },
  { path: '/health', emoji: '💪', icon: Dumbbell, name: '健康管理', desc: '护眼+运动提醒', color: 'from-elder-green to-emerald-500' },
  { path: '/community', emoji: '🏘️', icon: Building2, name: '社区分享', desc: '线下扫码乐分享', color: 'from-purple-500 to-indigo-500' }
]

const recommendVideos = computed(() => {
  const pushed = family.pushedVideos
  const pushedVids = pushed.map(p => ({
    ...mockVideos.find(v => v.id === p.videoId)!,
    pushRemark: p.remark,
    pushFrom: p.fromChild
  })).filter(x => x.id)
  const systemVids = mockVideos
    .filter(v => v.category !== 'fraud-demo')
    .slice(0, 3)
    .map(v => ({ ...v, pushRemark: '', pushFrom: '' }))
  return [...pushedVids.slice(0, 2), ...systemVids].slice(0, 3) as any[]
})

function goWatch(id?: string) {
  router.push(id ? `/watch?v=${encodeURIComponent(id)}` : '/watch')
}

const demoRunning = ref(false)
const demoStage = ref(0)
const demoStages = [
  '开场白', '看懂视频', 'AI反诈', 'AI创作', '结束'
]

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function runDemo() {
  if (demoRunning.value) return
  demoRunning.value = true
  demoStage.value = 0

  try {
    speech.stop()
    demoStage.value = 1
    speech.speak('评委老师好！欢迎体验银龄AI助手「小银」的60秒比赛演示模式。小银是专门为2.8亿中老年朋友打造的AI数字伙伴，今天带您走一段完整的数字生活之旅。', { rateLevel: settings.settings.speechRate })
    await sleep(6000)

    demoStage.value = 2
    speech.speak('第一站：看懂视频。很多叔叔阿姨说，视频字幕太小看不清，语速太快跟不上。别担心！小银把视频内容自动提取成大字版，还有语音朗读一遍一遍讲给您听，再复杂的内容也能轻松看懂。', { rateLevel: settings.settings.speechRate })
    router.push('/watch')
    await sleep(16000)

    demoStage.value = 3
    speech.speak('第二站：安全守护，这是小银最最重要的功能！叔叔阿姨辛辛苦苦攒了一辈子的养老钱，千万不能让骗子骗走！小银内置了24种常见诈骗话术，遇到「高收益投资、稳赚不赔、专家指导、限时转账」这些词，立刻发出95分高风险预警。记住小银三句话：不要点链接！不要转钱！遇到问题打96110！', { rateLevel: settings.settings.speechRate })
    router.push('/anti-fraud?demo=1')
    await sleep(22000)

    demoStage.value = 4
    speech.speak('第三站：AI创造生活。谁说退休生活没意思？把您跳广场舞、做美食、带孙子的美好照片交给小银，四步就变成抖音爆款视频！第一步分析照片，第二步匹配经典老歌，第三步生成大字幕，第四步一键做出作品。标题就叫《我的退休生活，也可以很精彩》，带上#银龄生活 #快乐退休 的话题标签，发布到抖音让全网给您点赞！', { rateLevel: settings.settings.speechRate })
    router.push('/create?quick=1')
    await sleep(18000)

    demoStage.value = 5
    speech.speak('感谢您体验银龄AI助手「小银」！看懂视频、守护安全、记录美好，小银一直陪在您身边。银发数字生活，有小银更精彩！谢谢评委老师！', { rateLevel: settings.settings.speechRate })
    await sleep(5000)
    router.push('/')

  } finally {
    demoRunning.value = false
    demoStage.value = 0
  }
}

async function runFraudDemo() {
  speech.stop()
  speech.speak('好的，马上为您体验AI防诈真实Demo！小银正在分析聊天内容，请稍候……这是一个典型的养老投资诈骗四步连环套。', { rateLevel: settings.settings.speechRate })
  await sleep(2500)
  router.push('/anti-fraud?demo=1')
}

onMounted(() => {
  if (showWelcome.value) return
  setTimeout(() => {
    speech.speak(`${settings.settings.elderName}，您好！我是小银，您的AI伙伴。我会陪您看懂视频、保护安全、记录生活。`, { rateLevel: settings.settings.speechRate })
  }, 1200)
})
</script>

<template>
  <WelcomeAnimation v-if="showWelcome" @complete="onWelcomeComplete" />

  <div class="page-container">
    <!-- 顶部：AI伙伴欢迎区 -->
    <section class="relative overflow-hidden mb-10 rounded-elder-2xl border-2 border-orange-200/70" style="background: linear-gradient(135deg, #FFF8F0 0%, #FFF1E0 25%, #FFFBF5 55%, #FFF5EB 100%);">
      <div class="absolute -top-24 -right-24 w-80 h-80 md:w-96 md:h-96 rounded-full bg-gradient-to-br from-orange-300/30 to-amber-200/20 blur-3xl animate-pulse-soft"></div>
      <div class="absolute -bottom-28 -left-24 w-96 h-96 md:w-[420px] md:h-[420px] rounded-full bg-gradient-to-br from-pink-300/25 to-rose-200/15 blur-3xl animate-pulse-soft" style="animation-delay: 1.2s;"></div>
      <div class="absolute top-10 right-16 md:top-14 md:right-24 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-yellow-300/45 to-orange-300/35 blur-xl animate-pulse-soft"></div>
      <div class="absolute bottom-16 right-28 md:bottom-20 md:right-40 w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-pink-300/45 to-rose-300/35 blur-lg animate-pulse-soft" style="animation-delay: 0.8s;"></div>
      <div class="absolute top-1/3 left-8 md:left-14 text-4xl md:text-5xl animate-float-gentle">🌟</div>
      <div class="absolute bottom-1/4 right-14 md:right-24 text-3xl md:text-4xl animate-float-gentle" style="animation-delay: 0.6s;">💫</div>

      <div class="relative p-8 md:p-12 lg:p-14">
        <div class="flex items-center justify-between mb-8 md:mb-10 flex-wrap gap-4">
          <div class="flex items-center gap-3 flex-wrap">
            <div class="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white shadow-lg border-2 border-orange-200">
              <span class="w-3.5 h-3.5 rounded-full bg-elder-green animate-pulse-soft"></span>
              <span class="text-elder-sm md:text-elder-base font-black text-elder-ink">银龄AI助手「小银」</span>
              <span class="text-elder-xs text-elder-muted">银发抖音简易助手</span>
            </div>
            <div class="elder-chip bg-gradient-to-r from-elder-orange/12 via-amber-400/12 to-yellow-400/12 text-elder-orange border-2 border-elder-orange/25 shadow-sm">
              🧡 不是工具，是AI数字伙伴
            </div>
          </div>
          <div class="flex flex-wrap gap-3 md:gap-4">
            <button
              @click="runFraudDemo"
              class="elder-btn !min-h-[56px] !px-6 transition-all bg-gradient-to-r from-elder-red via-rose-500 to-pink-500 text-white hover:shadow-xl active:scale-95 border-2 border-white/50"
              style="box-shadow: 0 8px 24px -6px rgba(230,57,70,0.4);"
            >
              <Zap class="w-6 h-6" :stroke-width="2.2" />
              ⚡ 体验AI防诈
            </button>
            <button
              @click="runDemo"
              :disabled="demoRunning"
              class="elder-btn !min-h-[56px] !px-6 transition-all border-2 border-white/50"
              :class="demoRunning ? 'bg-gray-200 text-elder-muted cursor-not-allowed' : 'bg-gradient-to-r from-elder-orange via-amber-400 to-yellow-400 text-white shadow-elder-orange hover:shadow-xl active:scale-95'"
            >
              <Play class="w-6 h-6" :stroke-width="2.2" />
              {{ demoRunning ? '🎬 演示中...' : '🎬 比赛Demo模式' }}
            </button>
          </div>
        </div>

        <div class="rounded-elder-2xl bg-white/60 backdrop-blur-md border-2 border-white/70 p-6 md:p-8 lg:p-10 shadow-lg">
          <AICompanion custom-state="welcome" />
        </div>

        <div class="mt-8 md:mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          <div class="rounded-elder-xl bg-white/85 backdrop-blur border-2 border-orange-100 p-4 md:p-5 shadow-sm flex items-center gap-3 md:gap-4">
            <span class="text-3xl md:text-4xl">📅</span>
            <div class="min-w-0">
              <div class="text-elder-xs text-elder-muted">今天</div>
              <div class="text-elder-sm md:text-elder-base font-bold text-elder-ink truncate">{{ today }}</div>
            </div>
          </div>
          <div class="rounded-elder-xl bg-white/85 backdrop-blur border-2 border-green-100 p-4 md:p-5 shadow-sm flex items-center gap-3 md:gap-4">
            <span class="text-3xl md:text-4xl">🌤️</span>
            <div class="min-w-0">
              <div class="text-elder-xs text-elder-muted">天气</div>
              <div class="text-elder-sm md:text-elder-base font-bold text-elder-ink">晴 26°C</div>
            </div>
          </div>
          <div
            v-if="family.unreadCount > 0"
            class="rounded-elder-xl bg-white/85 backdrop-blur border-2 border-red-100 p-4 md:p-5 shadow-sm flex items-center gap-3 md:gap-4 cursor-pointer hover:bg-red-50 transition-colors animate-pulse-soft"
            @click="router.push('/family')"
          >
            <span class="text-3xl md:text-4xl">💌</span>
            <div class="min-w-0">
              <div class="text-elder-xs text-elder-muted">子女留言</div>
              <div class="text-elder-sm md:text-elder-base font-bold text-elder-red">{{ family.unreadCount }} 条新消息</div>
            </div>
          </div>
          <div
            v-else
            class="rounded-elder-xl bg-white/85 backdrop-blur border-2 border-blue-100 p-4 md:p-5 shadow-sm flex items-center gap-3 md:gap-4"
          >
            <span class="text-3xl md:text-4xl">💖</span>
            <div class="min-w-0">
              <div class="text-elder-xs text-elder-muted">心情</div>
              <div class="text-elder-sm md:text-elder-base font-bold text-elder-blue">美好一天</div>
            </div>
          </div>
          <div class="rounded-elder-xl bg-white/85 backdrop-blur border-2 border-purple-100 p-4 md:p-5 shadow-sm flex items-center gap-3 md:gap-4 md:col-span-2 col-span-2">
            <span class="text-3xl md:text-4xl">🎯</span>
            <div class="min-w-0">
              <div class="text-elder-xs text-elder-muted">今日目标</div>
              <div class="text-elder-sm md:text-elder-base font-bold text-purple-600">看懂3个视频 · 创作1条作品</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 三大核心入口大卡片 -->
    <section class="mb-14 md:mb-16">
      <div class="flex items-center justify-between mb-8 md:mb-10 flex-wrap gap-4">
        <h2 class="text-elder-xl md:text-elder-2xl font-black text-elder-ink flex items-center gap-4">
          <span class="emoji-icon text-5xl md:text-6xl">✨</span>
          <span class="bg-gradient-to-r from-elder-orange via-amber-500 to-yellow-500 bg-clip-text text-transparent">三大核心服务</span>
        </h2>
        <div class="text-elder-sm md:text-elder-base text-elder-muted flex items-center gap-2 md:gap-3">
          <Sparkles class="w-7 h-7 md:w-8 md:h-8 text-elder-orange" />
          点击大卡片，小银全程陪伴
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
        <router-link
          v-for="(entry, idx) in coreEntries"
          :key="entry.path"
          :to="entry.path"
          class="group relative rounded-elder-2xl p-8 md:p-10 lg:p-12 overflow-hidden transition-all duration-400 hover:-translate-y-3 hover:shadow-2xl border-4 border-white/80"
          :class="[
            `bg-gradient-to-br ${entry.bg}`,
            `hover:ring-4 ${entry.ring}`,
          ]"
          :style="{
            boxShadow: '0 16px 52px -16px rgba(0,0,0,0.12), 0 4px 16px -4px rgba(0,0,0,0.06)'
          }"
        >
          <div
            :class="[`absolute -top-20 -right-16 w-64 h-64 md:w-72 md:h-72 rounded-full bg-gradient-to-br ${entry.color} opacity-20 group-hover:opacity-35 transition-all duration-500 group-hover:scale-110`]"
          ></div>
          <div
            :class="[`absolute -bottom-24 -left-20 w-72 h-72 md:w-80 md:h-80 rounded-full bg-gradient-to-br ${entry.color} opacity-12 group-hover:opacity-25 transition-all duration-500 group-hover:scale-105`]"
          ></div>
          <div class="absolute top-8 right-8 text-2xl md:text-3xl opacity-50 group-hover:opacity-100 group-hover:rotate-12 transition-all duration-400">✨</div>

          <div
            class="absolute top-6 right-6 md:top-7 md:right-7 text-elder-xs md:text-elder-sm font-black px-4 py-2 md:px-5 md:py-2.5 rounded-full border-2 shadow-sm backdrop-blur-sm transition-all group-hover:scale-105"
            :class="[entry.tagBg, entry.tagColor]"
          >
            {{ entry.tag }}
          </div>

          <div class="relative">
            <div
              :class="[
                `w-28 h-28 md:w-36 md:h-36 rounded-elder-2xl bg-gradient-to-br ${entry.color} flex items-center justify-center shadow-2xl mb-8 md:mb-10 group-hover:scale-115 group-hover:rotate-[-4deg] transition-all duration-400 relative overflow-hidden`
              ]"
              style="box-shadow: 0 20px 44px -12px rgba(255,122,61,0.4);"
            >
              <div class="absolute inset-0 bg-gradient-to-br from-white/35 via-white/10 to-transparent"></div>
              <div class="absolute inset-2 rounded-elder-xl bg-white/15 backdrop-blur-[1px]"></div>
              <span class="text-6xl md:text-7xl lg:text-8xl relative z-10 drop-shadow-xl animate-bounce-gentle">{{ entry.emoji }}</span>
            </div>

            <div class="text-elder-xl md:text-elder-2xl lg:text-[56px] font-black text-elder-ink mb-4 md:mb-5 leading-[1.15] tracking-tight">
              {{ entry.name }}
            </div>
            <div class="text-elder-base md:text-elder-lg text-elder-muted leading-10 md:leading-[48px] mb-10 md:mb-14 min-h-[90px] md:min-h-[100px]">
              {{ entry.desc }}
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 md:gap-4 font-black transition-all" :style="{ color: '#' + (idx === 0 ? 'FF7A3D' : idx === 1 ? 'E63946' : '9333EA') }">
                <span class="text-elder-lg md:text-elder-xl">立即体验</span>
                <span class="text-3xl md:text-4xl group-hover:translate-x-3 transition-transform duration-300">→</span>
              </div>
              <div class="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/85 backdrop-blur flex items-center justify-center group-hover:bg-white group-hover:scale-115 transition-all duration-300 shadow-lg border-2 border-white">
                <component :is="entry.icon" class="w-7 h-7 md:w-8 md:h-8" :style="{ color: '#' + (idx === 0 ? 'FF7A3D' : idx === 1 ? 'E63946' : '9333EA') }" :stroke-width="2.3" />
              </div>
            </div>
          </div>
        </router-link>
      </div>
    </section>

    <!-- 更多关怀服务 -->
    <section class="mb-14 md:mb-16">
      <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h2 class="text-elder-xl md:text-elder-2xl font-black text-elder-ink flex items-center gap-4">
          <span class="emoji-icon text-5xl">💝</span>
          更多关怀服务
        </h2>
        <div class="text-elder-sm md:text-elder-base text-elder-muted">
          全方位守护您的数字生活
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-5 md:gap-7">
        <router-link
          v-for="svc in moreServices"
          :key="svc.path"
          :to="svc.path"
          class="group elder-card p-7 md:p-9 hover:-translate-y-2 transition-all duration-300 hover:shadow-elder-lg relative overflow-hidden border-2 border-orange-50"
        >
          <div
            :class="[`absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br ${svc.color} opacity-15 group-hover:opacity-25 transition-all duration-400 group-hover:scale-110`]"
          ></div>
          <div class="relative flex items-center gap-5 md:gap-6">
            <div
              :class="[`w-20 h-20 md:w-24 md:h-24 rounded-elder-xl bg-gradient-to-br ${svc.color} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300 shrink-0 relative overflow-hidden`]"
            >
              <div class="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent"></div>
              <span class="text-5xl relative z-10">{{ svc.emoji }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-elder-lg md:text-elder-xl font-black text-elder-ink mb-2">
                {{ svc.name }}
              </div>
              <div class="text-elder-sm md:text-elder-base text-elder-muted leading-8 md:leading-10">
                {{ svc.desc }}
              </div>
            </div>
            <div class="shrink-0 text-elder-orange text-3xl md:text-4xl font-black group-hover:translate-x-2 transition-transform duration-300">
              →
            </div>
          </div>
        </router-link>
      </div>
    </section>

    <!-- 今日推荐 -->
    <section class="mb-12 md:mb-14">
      <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h2 class="text-elder-xl md:text-elder-2xl font-black text-elder-ink flex items-center gap-4">
          <span class="emoji-icon text-5xl">✨</span>
          <span class="text-elder-orange">小银为您精选</span>
          <span class="text-elder-ink">3 条好内容</span>
        </h2>
      </div>
      <div class="space-y-5 md:space-y-6">
        <div
          v-for="(v, i) in recommendVideos"
          :key="v.id + i"
          @click="goWatch(v.id)"
          class="elder-card p-5 md:p-7 flex items-stretch gap-6 cursor-pointer hover:-translate-y-1 hover:shadow-elder-lg transition-all duration-300 border-2 border-orange-50"
        >
          <div class="relative w-44 md:w-56 lg:w-64 shrink-0 rounded-elder-xl overflow-hidden bg-gray-200 aspect-video">
            <img :src="v.coverUrl" :alt="v.title" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/55 backdrop-blur flex items-center justify-center text-white text-4xl md:text-5xl shadow-2xl border-4 border-white/30 hover:scale-110 transition-transform duration-300">
                ▶
              </div>
            </div>
            <div
              v-if="v.pushFrom"
              class="absolute top-3 left-3 px-4 py-2 rounded-xl bg-elder-blue text-white text-elder-xs font-black shadow-lg"
            >
              💝 {{ v.pushFrom }}推荐
            </div>
          </div>
          <div class="flex-1 min-w-0 py-2 md:py-3">
            <div class="text-elder-base md:text-elder-lg font-bold text-elder-ink line-clamp-2 leading-10 md:leading-[48px]">
              {{ v.title }}
            </div>
            <div class="mt-4 text-elder-sm text-elder-muted flex items-center gap-5 flex-wrap">
              <span class="flex items-center gap-2">🎙️ {{ v.author }}</span>
              <span class="flex items-center gap-2">❤️ {{ formatNumber(v.likes) }}</span>
            </div>
            <div
              v-if="v.pushRemark"
              class="mt-5 p-5 rounded-elder-xl bg-gradient-to-r from-blue-50 to-sky-50 border-l-4 border-elder-blue text-elder-sm md:text-elder-base text-elder-blue leading-9"
            >
              💬 {{ v.pushFrom }}说：<span class="font-semibold">{{ v.pushRemark }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="elder-card p-6 md:p-10 mb-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-sky-50 border-2 border-dashed border-indigo-200">
      <div class="text-center mb-6 md:mb-8">
        <div class="text-elder-base md:text-elder-lg font-bold text-indigo-700 mb-2">🧪 弹窗调试区（立即体验关闭效果）</div>
        <div class="text-elder-sm text-indigo-500 opacity-85">点击下方按钮立刻弹出弹窗，验证 3 种关闭方式：✕按钮 / 遮罩 / 内容按钮</div>
      </div>
      <div class="flex gap-4 md:gap-5 flex-wrap justify-center">
        <button @click="debugTriggerEye" class="elder-btn bg-elder-blue text-white text-xl md:text-2xl !px-8 md:!px-10 !py-5 md:!py-6 shadow-2xl active:scale-95 border-2 border-white/40" style="pointer-events:auto !important; touch-action: manipulation;">
          👀 弹出「护眼提醒」弹窗
        </button>
        <button @click="debugTriggerExercise" class="elder-btn bg-elder-red text-white text-xl md:text-2xl !px-8 md:!px-10 !py-5 md:!py-6 shadow-2xl active:scale-95 border-2 border-white/40" style="pointer-events:auto !important; touch-action: manipulation;">
          💪 弹出「活动筋骨」弹窗
        </button>
        <button @click="debugDismissAll" class="elder-btn bg-white border-2 border-indigo-200 text-indigo-600 text-xl md:text-2xl !px-8 md:!px-10 !py-5 md:!py-6 shadow-2xl active:scale-95" style="pointer-events:auto !important; touch-action: manipulation;">
          ✅ 关闭所有弹窗
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
@keyframes float-gentle {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-14px) rotate(6deg); }
}
.animate-float-gentle {
  animation: float-gentle 4.5s ease-in-out infinite;
}

@keyframes bounce-gentle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.animate-bounce-gentle {
  animation: bounce-gentle 2.8s ease-in-out infinite;
}

.group-hover\:scale-115:hover {
  transform: scale(1.15);
}
</style>
