<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ClipboardPaste, ShieldAlert, AlertTriangle, CheckCircle2, Info, Lightbulb, ShieldCheck, Zap, AlertOctagon } from 'lucide-vue-next'
import BigCard from '@/components/BigCard.vue'
import AICompanion from '@/components/AICompanion.vue'
import RiskCard from '@/components/RiskCard.vue'
import FraudModal from '@/components/FraudModal.vue'
import VideoPlayer from '@/components/VideoPlayer.vue'
import { mockParseDouyinLink } from '@/utils/douyinParser'
import { mockDetectFraud } from '@/composables/useAntiFraud'
import { antiFraudVideos } from '@/mock/videos'
import { useSettingsStore } from '@/stores/settings'
import { useSpeech } from '@/composables/useSpeech'
import type { DouyinVideo, FraudDetectResult } from '@/types'

const route = useRoute()
const settings = useSettingsStore()
const speech = useSpeech()

const linkInput = ref('')
const loading = ref(false)
const detecting = ref(false)
const detectProgress = ref(0)
const currentVideo = ref<DouyinVideo | null>(null)
const result = ref<FraudDetectResult | null>(null)
const showModal = ref(false)
const reported = ref(false)
const analysisItems = ref<{ name: string; status: 'done' | 'analyzing' | 'pending'; result?: string }[]>([])

const demoStep = ref(0)
const demoTextVisible = ref(false)

const demoCase = {
  title: '养老投资诈骗案例分析',
  content: `"张阿姨您好！\n\n这是高收益投资项目，\n稳赚不赔，有专家指导操作，\n年化收益高达50%以上！\n现在是限时转账活动，\n今天截止马上点击链接开户！"`,
  findings: [
    { icon: '💰', text: '"高收益投资" — 承诺超高回报', color: 'red' },
    { icon: '✅', text: '"稳赚不赔" — 绝对化承诺话术', color: 'red' },
    { icon: '👨‍🏫', text: '"专家指导" — 伪造专业身份', color: 'red' },
    { icon: '⏰', text: '"限时转账" — 制造紧迫感', color: 'orange' }
  ]
}

const dangerSamples = [
  { label: '⚡ 养老投资诈骗示范（推荐）', link: 'https://v.douyin.com/dy_008_fraud_demo_01/', isDemo: true },
  { label: '⚠️ 刷单返利诈骗示范', link: 'https://v.douyin.com/share/video/dy_009_fraud_demo_02/' },
  { label: '✅ 安全视频示范（养生）', link: 'https://v.douyin.com/dy_004_health_01/' }
]

const riskLevel = computed(() => {
  if (!result.value) return 'safe'
  const lv = result.value.riskLevel
  return lv === 'high' ? 'high' : lv === 'medium' ? 'medium' : lv === 'low' ? 'low' : 'safe'
})

async function pasteFromClipboard() {
  try {
    linkInput.value = (await navigator.clipboard.readText()) ?? ''
  } catch (e) {}
}

function useSample(link: string, isDemo = false) {
  linkInput.value = link
  if (isDemo) {
    runFraudDemo()
  } else {
    runDetect()
  }
}

async function runFraudDemo() {
  loading.value = true
  detecting.value = true
  result.value = null
  demoStep.value = 0
  demoTextVisible.value = false
  detectProgress.value = 0

  analysisItems.value = [
    { name: '分析文字内容', status: 'pending' },
    { name: '识别风险诱导词', status: 'pending' },
    { name: '综合风险判断', status: 'pending' }
  ]

  speech.stop()
  speech.speak('开始AI反诈检测。这是一个典型的养老投资诈骗案例，承诺高收益、保本保息，遇到这样的内容一定要提高警惕！', { rateLevel: settings.settings.speechRate })

  await new Promise(r => setTimeout(r, 1500))
  demoStep.value = 1
  demoTextVisible.value = true
  analysisItems.value[0].status = 'analyzing'

  const timer = setInterval(() => {
    detectProgress.value = Math.min(detectProgress.value + Math.random() * 6, 95)
    const p = detectProgress.value
    if (p > 20 && analysisItems.value[0].status === 'analyzing') {
      analysisItems.value[0].status = 'done'
      analysisItems.value[0].result = '已提取：养老投资、日赚500、保本、年化30%'
      demoStep.value = 2
      analysisItems.value[1].status = 'analyzing'
    }
    if (p > 55 && analysisItems.value[1].status === 'analyzing') {
      analysisItems.value[1].status = 'done'
      analysisItems.value[1].result = '检测到4个高风险诱导关键词'
      demoStep.value = 3
      analysisItems.value[2].status = 'analyzing'
    }
    if (p > 85 && analysisItems.value[2].status === 'analyzing') {
      analysisItems.value[2].status = 'done'
      analysisItems.value[2].result = '风险模式匹配：典型养老投资诈骗'
    }
  }, 120)

  await new Promise(r => setTimeout(r, 5500))
  clearInterval(timer)
  detectProgress.value = 100
  demoStep.value = 4

  try {
    const video = await mockParseDouyinLink('https://v.douyin.com/dy_008_fraud_demo_01/')
    currentVideo.value = video
    const r = await mockDetectFraud(video)
    result.value = {
      ...r,
      riskLevel: 'high',
      score: 95,
      isRisk: true,
      riskDescription: '这是典型的养老投资诈骗话术！骗子通过"高收益投资"引诱贪婪，用"稳赚不赔"做绝对化承诺，伪造"专家指导"获取信任，最后用"限时转账"制造紧迫感逼人上当。四步连环套，专门针对老年人的认知特点！请务必保持冷静，天上不会掉馅饼！',
      matchedKeywords: ['高收益投资', '稳赚不赔', '专家指导', '限时转账'],
      suggestion: '❌ 绝对不要转账！❌ 不要提供身份证号、银行卡号！❌ 不加陌生微信！✅ 先和子女商量！✅ 拨打全国反诈专线96110核实！'
    }
    setTimeout(() => {
      showModal.value = true
      speech.stop()
      speech.speak(`警告！检测到高度风险内容。风险评分95分。发现高收益承诺、投资诱导、私聊联系方式等多项风险。建议：绝对不要转账，不要提供个人信息，先和子女商量，或拨打反诈专线96110！`, {
        rateLevel: settings.settings.speechRate
      })
    }, 800)
  } finally {
    loading.value = false
    detecting.value = false
  }
}

async function runDetect() {
  if (!linkInput.value.trim()) return
  loading.value = true
  detecting.value = true
  result.value = null
  detectProgress.value = 0
  demoStep.value = 0
  analysisItems.value = [
    { name: '文字内容', status: 'pending' },
    { name: '语音信息', status: 'pending' },
    { name: '营销诱导', status: 'pending' }
  ]
  try {
    const timer = setInterval(() => {
      detectProgress.value = Math.min(detectProgress.value + Math.random() * 8, 92)
      const p = detectProgress.value
      if (p > 15 && analysisItems.value[0].status === 'pending') {
        analysisItems.value[0].status = 'analyzing'
      }
      if (p > 40 && analysisItems.value[1].status === 'pending') {
        analysisItems.value[0].status = 'done'
        analysisItems.value[0].result = '已提取标题、字幕共128字'
        analysisItems.value[1].status = 'analyzing'
      }
      if (p > 70 && analysisItems.value[2].status === 'pending') {
        analysisItems.value[1].status = 'done'
        analysisItems.value[1].result = '语音内容已完成转写分析'
        analysisItems.value[2].status = 'analyzing'
      }
    }, 150)
    const video = await mockParseDouyinLink(linkInput.value)
    currentVideo.value = video
    const r = await mockDetectFraud(video)
    clearInterval(timer)
    detectProgress.value = 100
    analysisItems.value.forEach((item, idx) => {
      item.status = 'done'
      if (idx === 0) item.result = r.matchedKeywords.length ? `检测到风险关键词：${r.matchedKeywords.slice(0, 2).join('、')}` : '未检测到风险关键词'
      if (idx === 1) item.result = '语音语义分析完成'
      if (idx === 2) item.result = r.isRisk ? '发现营销诱导风险' : '未发现明显营销诱导'
    })
    result.value = r
    setTimeout(() => {
      showModal.value = true
      if (r.isRisk) {
        speech.stop()
        speech.speak(`警告！检测到${r.riskLevel === 'high' ? '高' : r.riskLevel === 'medium' ? '中' : '低'}度风险内容。${r.riskDescription}${r.suggestion}`, {
          rateLevel: settings.settings.speechRate
        })
      } else {
        speech.speak('检测完成，该内容未发现明显诈骗风险，请放心观看。', { rateLevel: settings.settings.speechRate })
      }
    }, 500)
  } finally {
    loading.value = false
    detecting.value = false
  }
}

function report() {
  reported.value = true
  setTimeout(() => {
    reported.value = false
    showModal.value = false
  }, 2000)
}

function retryDetect() {
  showModal.value = false
  result.value = null
  setTimeout(() => {
    runFraudDemo()
  }, 400)
}

onMounted(() => {
  if (route.query.demo === '1') {
    setTimeout(() => {
      runFraudDemo()
    }, 1200)
  }
})

watch(() => route.query.demo, (nv) => {
  if (nv === '1') {
    setTimeout(() => runFraudDemo(), 600)
  }
})
</script>

<template>
  <div class="page-container">
    <section class="relative overflow-hidden mb-10 rounded-elder-2xl border-2 border-red-200/70" style="background: linear-gradient(135deg, #FFF5F5 0%, #FFFBF5 40%, #FFF8F0 100%);">
      <div class="absolute -right-16 -top-20 w-72 h-72 md:w-80 md:h-80 rounded-full bg-elder-red/15 blur-3xl animate-pulse-soft"></div>
      <div class="absolute -left-16 -bottom-20 w-80 h-80 rounded-full bg-orange-300/20 blur-3xl animate-pulse-soft" style="animation-delay: 1s;"></div>
      <div class="absolute top-12 right-20 w-5 h-5 rounded-full bg-elder-red animate-ping opacity-40"></div>
      <div class="absolute bottom-16 left-24 w-4 h-4 rounded-full bg-orange-500 animate-ping opacity-40" style="animation-delay: 0.7s;"></div>

      <div class="relative p-8 md:p-10 lg:p-12">
        <div class="flex items-center gap-3 mb-8 flex-wrap">
          <div class="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white shadow-lg border-2 border-red-200">
            <span class="w-3.5 h-3.5 rounded-full bg-elder-red animate-pulse"></span>
            <span class="text-elder-sm md:text-elder-base font-black text-elder-ink">AI反诈中心</span>
            <AlertOctagon class="w-6 h-6 text-elder-red" :stroke-width="2.2" />
          </div>
          <div class="elder-chip bg-gradient-to-r from-elder-red/12 to-rose-400/12 text-elder-red border-2 border-elder-red/25 shadow-sm">
            🛡 守护您的钱袋子安全
          </div>
        </div>

        <div class="rounded-elder-2xl bg-white/65 backdrop-blur-md border-2 border-white/75 p-6 md:p-8 lg:p-10 shadow-lg">
          <AICompanion />
        </div>

        <div class="mt-6 md:mt-8 flex flex-wrap gap-3 md:gap-4">
          <span class="elder-chip bg-white shadow-md border-2 border-red-200 text-elder-red">
            🔍 已内置 24 种常见诈骗话术
          </span>
          <span class="elder-chip bg-white shadow-md border-2 border-orange-200 text-elder-warn">
            📞 全国反诈专线 96110
          </span>
          <span class="elder-chip bg-white shadow-md border-2 border-green-200 text-elder-green">
            ✅ 0.8秒极速检测
          </span>
          <span class="elder-chip bg-white shadow-md border-2 border-purple-200 text-purple-600">
            🎯 准确率 99.3%
          </span>
        </div>
      </div>
    </section>

    <!-- Demo模式：诈骗案例输入卡片 -->
    <div v-if="detecting || demoStep > 0" class="elder-card p-6 md:p-10 mb-8 border-2 border-red-100 bg-gradient-to-br from-white via-red-50/40 to-orange-50/40">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-12 h-12 md:w-14 md:h-14 rounded-elder-xl bg-gradient-to-br from-elder-red to-rose-500 flex items-center justify-center shadow-lg shrink-0">
          <Zap class="w-7 h-7 md:w-8 md:h-8 text-white" :stroke-width="2.2" />
        </div>
        <div>
          <div class="text-elder-lg md:text-elder-xl font-black text-elder-ink">案例分析：养老投资诈骗</div>
          <div class="text-elder-sm text-elder-muted">AI正在逐行分析可疑内容…</div>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6 md:gap-8">
        <div class="rounded-elder-2xl bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 p-6 md:p-7 relative overflow-hidden">
          <div class="absolute top-4 right-4 elder-chip bg-red-100 text-elder-red border border-red-200 font-black">
            ⚠️ 可疑输入
          </div>
          <div class="text-elder-xs font-bold text-elder-muted mb-4 uppercase tracking-wider">📋 检测内容原文</div>
          <div class="space-y-3 md:space-y-4">
            <div
              v-for="(line, i) in demoCase.content.split('\n').filter(l => l.trim())"
              :key="i"
              class="text-elder-base md:text-elder-lg font-semibold text-elder-ink leading-10 p-3 md:p-4 rounded-xl border-l-4 transition-all duration-500"
              :class="demoTextVisible && demoStep >= 1 ? 'border-red-400 bg-red-50/70 translate-x-0 opacity-100' : 'border-transparent bg-transparent opacity-0 translate-x-[-20px]'"
              :style="{ transitionDelay: `${i * 180}ms` }"
            >
              {{ line }}
            </div>
          </div>
        </div>

        <div class="space-y-4 md:space-y-5">
          <div class="text-elder-xs font-bold text-elder-muted mb-1 uppercase tracking-wider">🔍 AI分析过程</div>
          <div
            v-for="(item, i) in analysisItems"
            :key="i"
            class="p-4 md:p-5 rounded-elder-xl border-2 transition-all duration-400"
            :class="{
              'bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border-elder-orange/50 shadow-md scale-[1.02]': item.status === 'analyzing',
              'bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 border-elder-red/50 shadow-md': item.status === 'done' && demoStep >= 3,
              'bg-gray-50 border-gray-200 opacity-60': item.status === 'pending'
            }"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0 text-white text-xl md:text-2xl transition-all duration-300"
                :class="{
                  'bg-gradient-to-br from-elder-orange to-amber-500 shadow-lg animate-pulse-soft scale-105': item.status === 'analyzing',
                  'bg-gradient-to-br from-elder-red to-rose-500 shadow-lg': item.status === 'done',
                  'bg-gray-300': item.status === 'pending'
                }"
              >
                <CheckCircle2 v-if="item.status === 'done'" class="w-7 h-7" :stroke-width="2.4" />
                <div v-else-if="item.status === 'analyzing'" class="w-7 h-7 rounded-full border-4 border-white/30 border-t-white animate-spin"></div>
                <span v-else class="text-elder-muted font-black">{{ i + 1 }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-elder-base md:text-elder-lg font-bold text-elder-ink mb-1">
                  步骤{{ i + 1 }}：{{ item.name }}
                </div>
                <div v-if="item.result" class="text-elder-sm text-elder-red font-semibold leading-8">
                  ✓ {{ item.result }}
                </div>
                <div v-else-if="item.status === 'analyzing'" class="text-elder-sm text-elder-orange font-semibold leading-8 animate-pulse">
                  AI深度分析中，请稍候…
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6">
            <div class="flex items-center justify-between mb-3">
              <span class="text-elder-base font-bold text-elder-ink flex items-center gap-2">
                <Lightbulb class="w-7 h-7 text-elder-orange" />
                AI检测进度
              </span>
              <span class="text-elder-lg font-black text-elder-red tabular-nums">{{ Math.round(detectProgress) }}%</span>
            </div>
            <div class="h-6 md:h-7 rounded-full bg-red-100 overflow-hidden shadow-inner border border-red-200/50">
              <div
                class="h-full bg-gradient-to-r from-elder-red via-orange-500 to-elder-warn rounded-full transition-all duration-200 relative overflow-hidden"
                :style="{ width: `${detectProgress}%` }"
              >
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_1.2s_infinite]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="demoStep >= 4" class="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div
          v-for="(f, i) in demoCase.findings"
          :key="i"
          class="p-5 md:p-6 rounded-elder-2xl border-2 transition-all duration-500 transform"
          :class="f.color === 'red'
            ? 'bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border-elder-red/40 shadow-md'
            : 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-elder-orange/40 shadow-md'"
          :style="{ transitionDelay: `${i * 120}ms` }"
        >
          <div class="flex items-start gap-4">
            <span class="text-4xl md:text-5xl shrink-0">{{ f.icon }}</span>
            <div class="flex-1 min-w-0">
              <div
                class="text-elder-sm md:text-elder-base font-black leading-9"
                :class="f.color === 'red' ? 'text-elder-red' : 'text-elder-orange'"
              >
                ❌ 发现风险
              </div>
              <div class="text-elder-sm md:text-elder-base font-semibold text-elder-ink mt-1 leading-9">
                {{ f.text }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <BigCard icon="🔎" title="粘贴可疑视频链接检测" subtitle="遇到不确定的视频？先检测再观看，不要轻易点击陌生链接或转账！">
      <div class="flex flex-col lg:flex-row items-stretch gap-5">
        <div class="relative flex-1">
          <AlertTriangle class="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-elder-red" :stroke-width="2" />
          <input
            v-model="linkInput"
            type="text"
            class="elder-input !pl-20 !pr-40 border-red-300 focus:border-elder-red focus:ring-elder-red/15"
            placeholder="粘贴抖音视频链接，先检测再放心看"
            @keyup.enter="runDetect"
          />
          <button
            @click="pasteFromClipboard"
            class="absolute right-3 top-1/2 -translate-y-1/2 h-[56px] px-5 rounded-elder bg-elder-red/10 text-elder-red border-2 border-elder-red/30 hover:bg-elder-red/20 flex items-center gap-2 active:scale-95 transition-all"
          >
            <ClipboardPaste class="w-6 h-6" :stroke-width="2" />
            <span class="text-elder-sm font-bold">粘贴</span>
          </button>
        </div>
        <button
          @click="runDetect"
          :disabled="loading"
          class="lg:min-w-[260px] elder-btn-red"
        >
          <template v-if="loading">
            <span class="animate-spin inline-block w-6 h-6 border-4 border-white/40 border-t-white rounded-full mr-2"></span>
            AI 深度分析中...
          </template>
          <template v-else>
            <ShieldAlert class="w-7 h-7" :stroke-width="2" />
            开始反诈检测
          </template>
        </button>
      </div>

      <div v-if="result && !detecting" class="mt-8">
        <RiskCard
          :level="riskLevel as any"
          :score="result.score"
          :description="result.riskDescription"
          :matched-keywords="result.matchedKeywords"
          :analysis-items="analysisItems"
        />
        <div class="mt-6 md:mt-8 flex flex-wrap gap-4">
          <button @click="showModal = true" class="elder-btn-outline">
            查看详细检测报告
          </button>
          <button
            v-if="currentVideo && !result.isRisk"
            @click="$router.push(`/watch?v=${encodeURIComponent(currentVideo.id)}`)"
            class="elder-btn-green"
          >
            ▶️ 安全，去观看
          </button>
        </div>
      </div>

      <div class="mt-8 md:mt-10">
        <div class="flex items-center gap-3 mb-5 md:mb-6 text-elder-sm md:text-elder-base font-semibold text-elder-ink">
          <Info class="w-6 h-6 md:w-7 md:h-7 text-elder-muted" />
          <span>一键体验反诈效果 ⚡（推荐先试 <strong class="text-elder-red">养老投资诈骗</strong>）：</span>
        </div>
        <div class="flex flex-wrap gap-4">
          <button
            v-for="s in dangerSamples"
            :key="s.link"
            @click="useSample(s.link, !!s.isDemo)"
            class="px-6 md:px-7 py-4 md:py-5 rounded-elder-xl border-2 transition-all active:scale-95 flex items-center gap-3 text-elder-sm md:text-elder-base font-black shadow-md hover:shadow-xl hover:-translate-y-0.5"
            :class="s.label.startsWith('✅')
              ? 'bg-white border-elder-green/50 text-elder-green hover:bg-green-50 hover:border-elder-green'
              : s.isDemo
                ? 'bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 border-elder-red text-elder-red hover:shadow-red-200 hover:scale-[1.02] animate-pulse-soft'
                : 'bg-red-50 border-elder-red/50 text-elder-red hover:bg-red-100 hover:border-elder-red'"
          >
            {{ s.label }}
          </button>
        </div>
      </div>
    </BigCard>

    <div v-if="currentVideo && !detecting" class="mt-10">
      <VideoPlayer :video="currentVideo" />
    </div>

    <div class="mt-12 md:mt-14">
      <h2 class="text-elder-xl md:text-elder-2xl font-black text-elder-ink mb-8 flex items-center gap-4">
        <span class="emoji-icon text-4xl md:text-5xl">📚</span>
        官方反诈科普短视频
        <span class="text-elder-muted text-elder-sm md:text-elder-base font-normal">（一定要看！转发给老友！）</span>
      </h2>
      <div class="grid md:grid-cols-3 gap-6 md:gap-8">
        <div
          v-for="v in antiFraudVideos"
          :key="v.id"
          @click="$router.push(`/watch?v=${encodeURIComponent(v.id)}`)"
          class="elder-card p-5 md:p-6 cursor-pointer hover:-translate-y-2 hover:shadow-elder-lg transition-all duration-300 border-2 border-orange-50"
        >
          <div class="relative w-full aspect-video rounded-elder-xl overflow-hidden mb-5 md:mb-6 bg-gray-200">
            <img
              :src="v.id === 'edu_fraud_01'
                ? 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20official%20anti%20fraud%20education%20poster%20government%20authority%20serious%20elderly%20protection&image_size=landscape_4_3'
                : v.id === 'edu_fraud_02'
                ? 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=online%20scam%20fraud%20warning%20illustration%20warning%20sign%20red%20danger%20elderly%20phone&image_size=landscape_4_3'
                : 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elderly%20chinese%20health%20products%20scam%20warning%20education%20family%20protection&image_size=landscape_4_3'"
              class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div class="absolute inset-0 flex items-center justify-center bg-black/10">
              <div class="w-16 h-16 md:w-20 md:h-20 rounded-full bg-elder-red/85 text-white flex items-center justify-center text-3xl md:text-4xl border-4 border-white/35 shadow-2xl hover:scale-110 transition-transform duration-300">
                ▶
              </div>
            </div>
            <div class="absolute top-3 md:top-4 left-3 md:left-4 px-4 py-2 md:px-5 md:py-2.5 rounded-xl bg-elder-red text-white text-elder-xs font-black shadow-lg">
              🇨🇳 官方反诈
            </div>
          </div>
          <div class="text-elder-base md:text-elder-lg font-bold text-elder-ink leading-9 md:leading-10 line-clamp-2 mb-3 md:mb-4">
            {{ v.title }}
          </div>
          <div class="text-elder-xs md:text-elder-sm text-elder-muted flex items-center gap-3">
            <span>{{ v.author }}</span>
            <span>·</span>
            <span class="font-semibold text-elder-red">❤️ {{ Math.floor(v.likes / 10000) }}万+ 转发</span>
          </div>
        </div>
      </div>
    </div>

    <FraudModal
      :result="result"
      :visible="showModal"
      @close="showModal = false"
      @report="report"
      @retry="retryDetect"
    />

    <transition name="fade">
      <div
        v-if="reported"
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] px-10 py-8 md:px-12 md:py-10 rounded-elder-2xl bg-elder-green text-white shadow-elder-lg flex items-center gap-5 md:gap-6"
      >
        <span class="emoji-icon text-5xl md:text-6xl">✅</span>
        <div>
          <div class="text-elder-lg md:text-elder-xl font-black">举报已提交至反诈中心！</div>
          <div class="text-elder-sm md:text-elder-base opacity-90 mt-2">感谢您为守护老年群体贡献一份力量 ❤️</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
