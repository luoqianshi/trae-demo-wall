<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Upload, Wand2, ImagePlus, Shuffle, Download, Share2, Send, Sparkles, Film, Music2, Type, Rocket, Zap } from 'lucide-vue-next'
import BigCard from '@/components/BigCard.vue'
import AICompanion from '@/components/AICompanion.vue'
import GenerationAnimation from '@/components/GenerationAnimation.vue'
import DouyinShare from '@/components/DouyinShare.vue'
import { creationTemplates } from '@/mock/templates'
import type { CreationTemplate, TemplateCategory } from '@/types'
import { generateHashtags, generateSubtitle, generateTitle } from '@/utils/titleGenerator'
import { useSettingsStore } from '@/stores/settings'
import { useSpeech } from '@/composables/useSpeech'

type Step = 'template' | 'material' | 'generating' | 'preview'

const route = useRoute()
const settings = useSettingsStore()
const speech = useSpeech()

const step = ref<Step>('template')
const selectedTemplate = ref<CreationTemplate | null>(null)
const materials = ref<string[]>([])
const generating = ref(false)
const generated = ref<null | {
  title: string; hashtags: string[]; subtitle: string; bgmName: string; cover: string
}>(null)
const generatedSafe = computed(() => generated.value!)

const canNext = computed(() => {
  if (step.value === 'template') return !!selectedTemplate.value
  if (step.value === 'material') return materials.value.length >= 1
  return true
})

function selectTemplate(tpl: CreationTemplate) {
  selectedTemplate.value = tpl
  speech.stop()
  speech.speak(`您已选择${tpl.name}模板，${tpl.name}适合制作${tpl.category === 'square-dance' ? '广场舞表演视频' : tpl.category === 'cooking' ? '家常菜教学视频' : tpl.category === 'countryside' ? '田园生活记录' : '家庭温馨回忆'}。`, {
    rateLevel: settings.settings.speechRate
  })
}

function goNext() {
  if (step.value === 'template') step.value = 'material'
  else if (step.value === 'material') generate()
}
function goBack() {
  if (step.value === 'material') step.value = 'template'
  else if (step.value === 'preview' || step.value === 'generating') step.value = 'material'
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  Array.from(input.files).slice(0, 9 - materials.value.length).forEach(file => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      materials.value.push(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  })
  input.value = ''
}

function addDemoMaterial() {
  const imageUrls = [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=happy%20chinese%20elderly%20woman%20smiling%20sunny%20garden%20warm%20peaceful%20retirement&image_size=square_hd',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20senior%20couple%20cooking%20homemade%20food%20kitchen%20warm%20family%20love&image_size=square_hd',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20elderly%20people%20square%20dance%20colorful%20park%20sunset%20happy%20group%20performance&image_size=square_hd',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20grandmother%20grandchildren%20family%20reunion%20warm%20happiness%20love&image_size=square_hd',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20countryside%20village%20autumn%20farm%20peaceful%20sunset%20rural%20life&image_size=square_hd',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20elderly%20grandfather%20tea%20ceremony%20traditional%20peaceful%20calm%20zen&image_size=square_hd'
  ]
  const n = Math.min(4, 9 - materials.value.length)
  for (let i = 0; i < n; i++) {
    const seed = Date.now() + i
    const url = imageUrls[seed % imageUrls.length]
    materials.value.push(`${url}&t=${seed}`)
  }
}

function removeMaterial(i: number) {
  materials.value.splice(i, 1)
}

function generate() {
  if (!selectedTemplate.value) return
  generating.value = true
  step.value = 'generating'
  speech.stop()
  speech.speak('好的！AI开始创作，正在分析照片、匹配音乐、生成字幕，很快就好~', { rateLevel: settings.settings.speechRate })
}

function onGenerationComplete() {
  const tpl = selectedTemplate.value!
  const coverSeed = tpl.category
  const coverImage = coverSeed === 'square-dance'
    ? 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20elderly%20square%20dance%20performance%20colorful%20happy%20group%20stage%20bright&image_size=portrait_9_16'
    : coverSeed === 'cooking'
    ? 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20homemade%20braised%20pork%20delicious%20food%20warm%20kitchen%20grandma%20cooking&image_size=portrait_9_16'
    : coverSeed === 'countryside'
    ? 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20rural%20countryside%20village%20autumn%20harvest%20peaceful%20warm%20sunset%20golden&image_size=portrait_9_16'
    : 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20elderly%20couple%20smiling%20park%20sunset%20happy%20retirement%20life%20warm%20peaceful&image_size=portrait_9_16'
  generated.value = {
    title: '我的退休生活，也可以很精彩',
    hashtags: ['#银龄生活', '#快乐退休', '#AI创造生活', '#退休日记', '#幸福晚年'],
    subtitle: `❤️ 退休不是终点，而是新生活的起点！\n种花、跳舞、旅行、和老友相聚...\n每一天都值得被记录！\n\n欢迎大家点赞👍 收藏⭐ 转发！\n关注我，每天分享精彩银龄生活！`,
    bgmName: '最炫民族风 - 经典老歌版',
    cover: coverImage
  }
  generating.value = false
  step.value = 'preview'
  speech.stop()
  speech.speak(`太棒了！您的作品已经生成完毕！标题是《我的退休生活，也可以很精彩》。背景音乐最炫民族风经典老歌版，已自动添加大字字幕和银龄生活、快乐退休等热门话题标签，点击分享到抖音吧！`, {
    rateLevel: settings.settings.speechRate
  })
}

function regenerate() {
  if (!selectedTemplate.value) return
  generating.value = true
  step.value = 'generating'
}

function reset() {
  step.value = 'template'
  selectedTemplate.value = null
  materials.value = []
  generated.value = null
}

async function runQuickDemo() {
  speech.stop()
  speech.speak('好的！马上为您演示AI一键创作功能！为您选择广场舞模板，配上经典老歌音乐，马上开始~', { rateLevel: settings.settings.speechRate })
  selectedTemplate.value = creationTemplates[0]
  await new Promise(r => setTimeout(r, 1200))
  addDemoMaterial()
  await new Promise(r => setTimeout(r, 1200))
  generate()
}

watch(selectedTemplate, () => {
  generated.value = null
})

onMounted(() => {
  if (route.query.quick === '1') {
    setTimeout(() => runQuickDemo(), 800)
  }
})
</script>

<template>
  <div class="page-container">
    <!-- 顶部横幅 -->
    <section class="relative overflow-hidden mb-10 rounded-elder-2xl border-2 border-pink-200/70" style="background: linear-gradient(135deg, #FFF5F7 0%, #FFFBF5 35%, #FFF0F6 70%, #FFFAF5 100%);">
      <div class="absolute -top-20 -right-20 w-80 h-80 md:w-96 md:h-96 rounded-full bg-gradient-to-br from-pink-300/25 via-fuchsia-300/20 to-purple-300/15 blur-3xl animate-pulse-soft"></div>
      <div class="absolute -bottom-24 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-amber-300/25 via-orange-300/20 to-yellow-300/15 blur-3xl animate-pulse-soft" style="animation-delay: 1.2s;"></div>
      <div class="absolute top-16 right-28 text-4xl md:text-5xl animate-float-creative">✨</div>
      <div class="absolute bottom-20 left-24 text-3xl md:text-4xl animate-float-creative" style="animation-delay: 0.8s;">🎨</div>

      <div class="relative p-8 md:p-10 lg:p-12">
        <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div class="flex items-center gap-3 flex-wrap">
            <div class="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white shadow-lg border-2 border-pink-200">
              <span class="w-3.5 h-3.5 rounded-full bg-purple-500 animate-pulse"></span>
              <span class="text-elder-sm md:text-elder-base font-black text-elder-ink">AI创作工坊</span>
              <Sparkles class="w-6 h-6 text-elder-orange" :stroke-width="2" />
            </div>
            <div class="elder-chip bg-gradient-to-r from-pink-500/12 via-fuchsia-500/12 to-purple-500/12 text-purple-600 border-2 border-purple-400/25 shadow-sm">
              🎬 把生活变成精彩视频
            </div>
          </div>
          <button
            @click="runQuickDemo"
            class="elder-btn !min-h-[56px] !px-7 transition-all bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white hover:shadow-2xl active:scale-95 border-2 border-white/50"
            style="box-shadow: 0 8px 28px -6px rgba(168,85,247,0.45);"
          >
            <Zap class="w-6 h-6" :stroke-width="2.2" />
            ⚡ 一键体验创作
          </button>
        </div>

        <div v-if="step !== 'generating'" class="rounded-elder-2xl bg-white/65 backdrop-blur-md border-2 border-white/75 p-6 md:p-8 lg:p-10 shadow-lg">
          <AICompanion />
        </div>

        <div v-if="step === 'generating'" class="mt-2">
          <div class="rounded-elder-2xl bg-white/80 backdrop-blur-md border-2 border-white/80 p-6 md:p-8 shadow-lg">
            <GenerationAnimation
              :active="step === 'generating'"
              @on-complete="onGenerationComplete"
            />
          </div>
        </div>

        <div class="mt-6 md:mt-8 flex flex-wrap gap-3 md:gap-4">
          <span class="elder-chip bg-white shadow-md border-2 border-pink-200 text-pink-600">
            🎵 100+ 经典老歌BGM
          </span>
          <span class="elder-chip bg-white shadow-md border-2 border-orange-200 text-elder-orange">
            📝 自动生成大字字幕
          </span>
          <span class="elder-chip bg-white shadow-md border-2 border-purple-200 text-purple-600">
            ✍️ AI爆款标题一键生成
          </span>
          <span class="elder-chip bg-white shadow-md border-2 border-green-200 text-elder-green">
            #️⃣ 自动匹配热门话题
          </span>
        </div>
      </div>
    </section>

    <!-- 步骤指示器 -->
    <div v-if="step !== 'generating'" class="elder-card p-6 md:p-8 my-10 border-2 border-orange-50">
      <div class="flex items-center gap-4 md:gap-8">
        <div
          v-for="(s, i) in (['template', 'material', 'preview'] as Step[])"
          :key="s"
          class="flex items-center gap-4 flex-1"
        >
          <div
            class="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shrink-0 font-black text-elder-base transition-all duration-400 shadow-lg"
            :class="step === s
              ? 'bg-gradient-to-br from-elder-orange via-amber-400 to-yellow-400 text-white shadow-elder-orange scale-110'
              : ['template', 'material', 'generating', 'preview'].indexOf(step) > i
                ? 'bg-gradient-to-br from-elder-green to-emerald-500 text-white'
                : 'bg-gray-100 text-elder-muted'"
          >
            {{ i + 1 }}
          </div>
          <div class="flex-1 min-w-0">
            <div
              class="text-elder-base md:text-elder-lg font-bold leading-tight"
              :class="step === s ? 'text-elder-orange' : 'text-elder-ink'"
            >
              {{ s === 'template' ? '选择模板' : s === 'material' ? '上传素材' : '作品完成' }}
            </div>
            <div class="text-elder-xs text-elder-muted mt-2 hidden md:block">
              {{ s === 'template' ? '4大类精选模板，一键套用' : s === 'material' ? '照片/随手拍 最多9张' : '抖音风格作品卡片' }}
            </div>
          </div>
          <div
            v-if="i < 2"
            class="h-2 rounded-full bg-gray-200 flex-1 max-w-[80px] hidden md:block overflow-hidden"
          >
            <div
              class="h-full bg-gradient-to-r from-elder-orange to-amber-400 rounded-full transition-all duration-500"
              :style="{ width: ['template', 'material', 'generating', 'preview'].indexOf(step) > i ? '100%' : '0%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 模板选择 -->
    <div v-show="step === 'template'">
      <BigCard icon="🎨" title="第一步：选择创作模板" subtitle="每种模板自带专属BGM老歌、字幕风格和文案，挑一个最适合您的！">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-7">
          <button
            v-for="tpl in creationTemplates"
            :key="tpl.id"
            @click="selectTemplate(tpl)"
            class="group relative aspect-[9/16] rounded-elder-2xl overflow-hidden text-left transition-all duration-300 border-4"
            :class="selectedTemplate?.id === tpl.id
              ? 'border-elder-orange shadow-elder-orange -translate-y-2 shadow-2xl scale-[1.02]'
              : 'border-transparent hover:border-elder-orange/50 hover:-translate-y-1 hover:shadow-xl'"
          >
            <img
              :src="tpl.id === 'tpl_square_dance'
                ? 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20elderly%20square%20dance%20performance%20colorful%20silk%20fans%20happy%20group%20park%20bright&image_size=portrait_4_3'
                : tpl.id === 'tpl_countryside'
                ? 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20rural%20countryside%20farm%20rice%20paddy%20peaceful%20warm%20golden%20sunset%20village%20scenery&image_size=portrait_4_3'
                : tpl.id === 'tpl_cooking'
                ? 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20elderly%20grandmother%20cooking%20traditional%20food%20steam%20buns%20kitchen%20warm%20cozy&image_size=portrait_4_3'
                : 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20happy%20family%20multi%20generation%20reunion%20dinner%20celebration%20warm%20love%20together&image_size=portrait_4_3'"
              :alt="tpl.name"
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"></div>
            <div
              :class="[`absolute top-5 left-5 w-14 h-14 md:w-16 md:h-16 rounded-elder-xl bg-gradient-to-br ${tpl.bgGradient} flex items-center justify-center shadow-2xl border-[3px] border-white/40`]"
            >
              <span class="emoji-icon text-3xl md:text-4xl">{{ tpl.emoji }}</span>
            </div>
            <div
              v-if="selectedTemplate?.id === tpl.id"
              class="absolute top-5 right-5 w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-elder-green to-emerald-500 text-white flex items-center justify-center text-2xl md:text-3xl shadow-2xl animate-pulse-soft border-[3px] border-white"
            >
              ✓
            </div>
            <div class="absolute bottom-0 left-0 right-0 p-6 md:p-7 text-white">
              <div class="text-elder-lg md:text-elder-xl font-black mb-2 md:mb-3 drop-shadow-xl">{{ tpl.name }}</div>
              <div class="text-elder-xs md:text-elder-sm opacity-90 line-clamp-2 leading-8 md:leading-9">
                BGM示例：{{ tpl.bgmOptions.slice(0, 2).map(b => b.name).join('、') }} 等经典老歌
              </div>
              <div class="mt-4 flex items-center gap-2 text-elder-xs font-black">
                <span class="px-3 py-1.5 rounded-full bg-white/25 backdrop-blur border border-white/30">
                  {{ tpl.category === 'square-dance' ? '💃 广场舞' : tpl.category === 'cooking' ? '🍳 美食' : tpl.category === 'countryside' ? '🌾 乡村' : '👨‍👩‍👧 家庭' }}
                </span>
                <span class="px-3 py-1.5 rounded-full bg-gradient-to-r from-elder-orange to-amber-400 shadow-md">
                  ⭐ 热门
                </span>
              </div>
            </div>
          </button>
        </div>
      </BigCard>
    </div>

    <!-- 素材上传 -->
    <div v-show="step === 'material'">
      <BigCard icon="📷" :title="`第二步：上传照片/随手拍素材（当前 ${materials.length}/9）`" subtitle='最多选择9张，竖屏效果最好哦！不会选？直接点「一键添加示例素材」体验！'>
        <div class="grid grid-cols-3 md:grid-cols-5 gap-4 md:gap-5">
          <div
            v-for="(m, i) in materials"
            :key="i"
            class="relative aspect-square rounded-elder-xl overflow-hidden border-4 border-orange-200 bg-orange-50 group shadow-md"
          >
            <img :src="m" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div class="absolute top-3 md:top-4 left-3 md:left-4 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-elder-orange to-amber-400 text-white font-black flex items-center justify-center shadow-lg text-xl md:text-2xl">
              {{ i + 1 }}
            </div>
            <button
              @click="removeMaterial(i)"
              class="absolute top-2 md:top-3 right-2 md:right-3 w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-elder-red to-rose-500 text-white hidden group-hover:flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 border-[3px] border-white"
            >
              <span class="text-2xl md:text-3xl font-black">✕</span>
            </button>
          </div>
          <label
            v-if="materials.length < 9"
            class="aspect-square rounded-elder-xl border-4 border-dashed border-elder-orange/60 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 cursor-pointer hover:border-elder-orange hover:bg-orange-100 hover:scale-[1.02] transition-all duration-300 flex flex-col items-center justify-center gap-3 md:gap-4 group"
          >
            <div class="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-elder-orange/20 to-amber-400/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <ImagePlus class="w-12 h-12 md:w-14 md:h-14 text-elder-orange" :stroke-width="1.8" />
            </div>
            <div class="text-center">
              <div class="text-elder-base md:text-elder-lg font-bold text-elder-orange">添加素材</div>
              <div class="text-elder-xs text-elder-muted mt-1">点击上传照片</div>
            </div>
            <input type="file" accept="image/*,video/*" multiple class="hidden" @change="onFileSelected" />
          </label>
        </div>

        <div class="mt-8 md:mt-10 flex flex-wrap gap-4 md:gap-5 items-center">
          <label class="elder-btn-primary shadow-xl !min-h-[72px] !px-8 md:!px-10">
            <Upload class="w-7 h-7 md:w-8 md:h-8" :stroke-width="2.2" />
            <span class="text-elder-base md:text-elder-lg">📁 从相册选择照片</span>
            <input type="file" accept="image/*" multiple class="hidden" @change="onFileSelected" />
          </label>
          <button @click="addDemoMaterial()" class="elder-btn-outline shadow-lg !min-h-[72px] !px-8 md:!px-10" style="border-width: 3px;">
            <Wand2 class="w-7 h-7 md:w-8 md:h-8" :stroke-width="2.2" />
            <span class="text-elder-base md:text-elder-lg">✨ 一键添加示例素材（推荐）</span>
          </button>
        </div>
      </BigCard>
    </div>

    <!-- 预览作品 -->
    <div v-show="step === 'preview' && generated">
      <div class="grid lg:grid-cols-[1fr_minmax(0,520px)] gap-8 lg:gap-10">
        <BigCard icon="📱" title="🎉 您的抖音作品已完成！" subtitle="完美模拟抖音竖屏效果，带互动按钮和话题标签，点个赞吧~">
          <DouyinShare
            :title="generatedSafe.title"
            :hashtags="generatedSafe.hashtags"
            :cover-url="generatedSafe.cover"
            @publish="() => {}"
            @save="() => {}"
            @share-family="() => {}"
          />
        </BigCard>

        <div class="space-y-7 md:space-y-8">
          <BigCard icon="✍️" title="AI 智能生成信息">
            <div class="space-y-6 md:space-y-7">
              <div class="p-5 md:p-7 rounded-elder-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-[3px] border-orange-200 shadow-md relative overflow-hidden">
                <div class="absolute top-4 right-4 text-3xl md:text-4xl animate-bounce-gentle">🏆</div>
                <div class="text-elder-xs md:text-elder-sm font-black text-elder-orange mb-3 flex items-center gap-2">
                  <Sparkles class="w-5 h-5" /> 📌 AI推荐爆款标题
                </div>
                <div class="text-elder-lg md:text-elder-xl font-black text-elder-ink leading-10 md:leading-12">
                  《{{ generatedSafe.title }}》
                </div>
              </div>
              <div>
                <div class="text-elder-xs md:text-elder-sm font-black text-elder-muted mb-4 flex items-center gap-2">
                  <Type class="w-5 h-5" /> #️⃣ 自带话题标签（流量加成）
                </div>
                <div class="flex flex-wrap gap-2 md:gap-3">
                  <span
                    v-for="h in generatedSafe.hashtags"
                    :key="h"
                    class="elder-chip bg-gradient-to-br from-blue-50 to-sky-50 text-elder-blue border-[3px] border-elder-blue/30 shadow-sm hover:scale-105 transition-transform"
                  >
                    {{ h }}
                  </span>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4 md:gap-5">
                <div class="p-5 md:p-6 rounded-elder-2xl bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 border-[3px] border-purple-200 shadow-md">
                  <div class="text-elder-xs md:text-elder-sm font-black text-elder-muted mb-2 flex items-center gap-2">
                    <Music2 class="w-5 h-5 text-purple-500" /> 🎵 背景音乐
                  </div>
                  <div class="text-elder-base md:text-elder-lg font-black text-elder-ink truncate">{{ generatedSafe.bgmName }}</div>
                </div>
                <div class="p-5 md:p-6 rounded-elder-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-[3px] border-green-200 shadow-md">
                  <div class="text-elder-xs md:text-elder-sm font-black text-elder-muted mb-2 flex items-center gap-2">
                    <Film class="w-5 h-5 text-elder-green" /> 📝 大字幕
                  </div>
                  <div class="text-elder-base md:text-elder-lg font-black text-elder-ink">已自动添加 ✓</div>
                </div>
              </div>
              <div class="p-5 md:p-6 rounded-elder-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-50 border-[3px] border-indigo-200 shadow-md">
                <div class="text-elder-xs md:text-elder-sm font-black text-elder-muted mb-2 flex items-center gap-2">
                  <Rocket class="w-5 h-5 text-indigo-500" /> 💬 AI生成文案
                </div>
                <div class="text-elder-sm md:text-elder-base font-semibold text-elder-ink leading-9 md:leading-10 italic">
                  "{{ generatedSafe.subtitle }}"
                </div>
              </div>
            </div>
            <div class="mt-8 md:mt-10 grid grid-cols-1 gap-4 md:gap-5">
              <button @click="regenerate" class="elder-btn-outline shadow-lg !min-h-[68px] !px-8" style="border-width: 3px;">
                <Shuffle class="w-6 h-7 md:w-7 md:h-8" :stroke-width="2" />
                <span class="text-elder-base md:text-elder-lg">🔄 换一个标题/音乐/字幕</span>
              </button>
              <button class="elder-btn-green shadow-xl !w-full !min-h-[72px] !px-8">
                <Download class="w-7 h-8" :stroke-width="2.2" />
                <span class="text-elder-base md:text-elder-lg">💾 保存作品到相册</span>
              </button>
              <button class="elder-btn-blue shadow-xl !w-full !min-h-[72px] !px-8">
                <Send class="w-7 h-8" :stroke-width="2.2" />
                <span class="text-elder-base md:text-elder-lg">💬 分享给微信/子女</span>
              </button>
            </div>
          </BigCard>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="mt-10 md:mt-12 flex flex-wrap gap-4 md:gap-5 justify-between items-center sticky bottom-4 z-30 bg-elder-cream/90 backdrop-blur-xl p-4 md:p-6 rounded-elder-2xl border-2 border-orange-100 shadow-xl">
      <div class="text-elder-sm md:text-elder-base text-elder-muted flex items-center gap-3">
        <span class="text-3xl md:text-4xl">💡</span>
        {{ step === 'template' ? '选择一个喜欢的模板后，点下一步上传照片吧！' : step === 'material' ? '至少上传1张照片，建议3-6张效果最好哦~' : step === 'generating' ? 'AI正在努力创作中，马上就好啦~' : '满意了就保存分享吧！也可以重新来过~' }}
      </div>
      <div class="flex gap-4 md:gap-5">
        <button
          v-if="step !== 'template' && step !== 'generating'"
          @click="goBack"
          class="elder-btn-outline shadow-lg !min-w-[180px] md:!min-w-[200px] !min-h-[64px]"
          style="border-width: 3px;"
        >
          <span class="text-2xl md:text-3xl">←</span>
          <span class="text-elder-base md:text-elder-lg">上一步</span>
        </button>
        <button
          v-if="step === 'template' || step === 'material'"
          @click="goNext"
          :disabled="!canNext"
          class="elder-btn-primary shadow-elder-orange !min-w-[240px] md:!min-w-[280px] !min-h-[64px]"
          :class="{ 'opacity-50 pointer-events-none': !canNext }"
        >
          <span class="text-elder-base md:text-elder-lg">{{ step === 'material' ? '✨ AI 生成成片' : '下一步 →' }}</span>
        </button>
        <button
          v-if="step === 'preview'"
          @click="reset"
          class="elder-btn-outline shadow-lg !min-w-[220px] !min-h-[64px]"
          style="border-width: 3px;"
        >
          <span class="text-2xl md:text-3xl">🔄</span>
          <span class="text-elder-base md:text-elder-lg">再做一个新作品</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes float-creative {
  0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
  50% { transform: translateY(-16px) rotate(8deg) scale(1.1); }
}
.animate-float-creative {
  animation: float-creative 4s ease-in-out infinite;
}

@keyframes bounce-gentle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.animate-bounce-gentle {
  animation: bounce-gentle 2.2s ease-in-out infinite;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
