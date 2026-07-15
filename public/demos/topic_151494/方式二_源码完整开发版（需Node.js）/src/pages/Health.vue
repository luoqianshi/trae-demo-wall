<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js'
import BigCard from '@/components/BigCard.vue'
import AICompanion from '@/components/AICompanion.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useWatchTime } from '@/composables/useWatchTime'
import { useSettingsStore } from '@/stores/settings'
import { lightExercises } from '@/mock/exercises'
import { weekdayZh, formatDuration, formatTime } from '@/utils/formatters'
import { useSpeech } from '@/composables/useSpeech'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const settings = useSettingsStore()
const speech = useSpeech()
const watchTime = useWatchTime()

const todayMin = computed(() => watchTime.todayMinutes())
const limit = computed(() => settings.settings.dailyLimitMinutes)
const progressPct = computed(() => Math.min(100, Math.round((todayMin.value / limit.value) * 100)))
const weekMin = computed(() => watchTime.totalWeek())

// 环形数据
const doughnutData = computed(() => ({
  labels: ['今日已看', '今日剩余'],
  datasets: [{
    data: [todayMin.value, Math.max(0, limit.value - todayMin.value)],
    backgroundColor: [progressPct.value > 90 ? '#E63946' : progressPct.value > 70 ? '#F4A261' : '#FF7A3D', '#FFEFE0'],
    borderWidth: 0,
    cutout: '70%',
    borderRadius: 20
  }]
}))
const doughnutOptions = {
  responsive: true,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  maintainAspectRatio: true
}

// 柱状图
const weekArr = computed(() => watchTime.weekData())
const barData = computed(() => ({
  labels: weekArr.value.map(r => `周${weekdayZh(r.date)}`),
  datasets: [{
    label: '分钟',
    data: weekArr.value.map(r => r.durationMinutes),
    backgroundColor: weekArr.value.map((_, i) => i === weekArr.value.length - 1 ? '#FF7A3D' : '#FFB38A'),
    borderRadius: 14,
    borderSkipped: false,
    maxBarThickness: 56
  }]
}))
const barOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 18 }, color: '#6B7280' } },
    y: { beginAtZero: true, grid: { color: '#FDE8D5' }, ticks: { font: { size: 16 }, color: '#6B7280' } }
  }
}

// 轻运动 - 展开详情
const expandedExercise = ref<string | null>(null)
function toggleExercise(id: string) {
  expandedExercise.value = expandedExercise.value === id ? null : id
}

const sessionClock = computed(() => formatTime(watchTime.sessionSeconds.value))

// 健康提醒开关
const eye = computed({
  get: () => settings.settings.eyeReminderEnabled,
  set: (v) => settings.updateSettings({ eyeReminderEnabled: v })
})
const ex = computed({
  get: () => settings.settings.exerciseReminderEnabled,
  set: (v) => settings.updateSettings({ exerciseReminderEnabled: v })
})

function testEye() {
  watchTime.showEyeReminder.value = true
  speech.speak('护眼提醒：请放下手机，站起来看看窗外的绿色植物，保持20秒。', { rateLevel: settings.settings.speechRate })
}
function testEx() {
  watchTime.showExerciseReminder.value = true
  speech.speak('活动提醒：久坐伤身，请站起来和我们一起做一遍颈椎放松操。', { rateLevel: settings.settings.speechRate })
}
</script>

<template>
  <div class="page-container">
    <section class="elder-card p-8 md:p-10 mb-10 relative overflow-hidden border-2 border-green-200/60" style="background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 50%, #F0FDFA 100%);">
      <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-elder-green/12 blur-3xl"></div>
      <div class="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-emerald-300/15 blur-3xl"></div>
      <div class="relative">
        <div class="flex items-center gap-3 mb-8 flex-wrap">
          <div class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-sm border border-green-200">
            <span class="w-3 h-3 rounded-full bg-elder-green animate-pulse-soft"></span>
            <span class="text-elder-sm font-bold text-elder-ink">健康管理中心</span>
          </div>
          <div class="elder-chip bg-gradient-to-r from-elder-green/10 to-emerald-400/10 text-elder-green border border-elder-green/20">
            💪 护眼+运动提醒，守护您的健康
          </div>
        </div>
        <AICompanion />
      </div>
    </section>

    <!-- 今日概览 -->
    <div class="grid lg:grid-cols-[420px_1fr] gap-8 mb-10">
      <!-- 左侧：环形进度 -->
      <BigCard icon="⏱️" title="今日观看时长" subtitle="健康刷视频 · 护眼又护颈">
        <div class="flex flex-col items-center py-6">
          <div class="relative w-[280px] h-[280px]">
            <Doughnut :data="doughnutData" :options="doughnutOptions" />
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <div class="text-elder-muted text-elder-xs">今日已看</div>
              <div class="mt-2 text-elder-2xl font-black text-elder-ink tabular-nums">
                {{ formatDuration(todayMin) }}
              </div>
              <div class="mt-2 text-elder-xs text-elder-muted">
                / 每日上限 {{ formatDuration(limit) }}
              </div>
              <div
                class="mt-3 px-4 py-1.5 rounded-full text-elder-xs font-bold"
                :class="progressPct > 90 ? 'bg-elder-red/15 text-elder-red' : progressPct > 70 ? 'bg-elder-warn/15 text-elder-warn' : 'bg-elder-green/15 text-elder-green'"
              >
                {{ progressPct }}% {{ progressPct > 90 ? '建议休息' : progressPct > 70 ? '注意时间' : '状态良好 ✓' }}
              </div>
            </div>
          </div>

          <div class="mt-8 grid grid-cols-2 gap-5 w-full">
            <div class="p-5 rounded-elder-xl bg-blue-50 border-2 border-blue-100 text-center">
              <div class="emoji-icon text-3xl mb-1">📱</div>
              <div class="text-elder-xs text-elder-muted mb-1">本次连续</div>
              <div class="text-elder-base font-black text-elder-blue tabular-nums">{{ sessionClock }}</div>
            </div>
            <div class="p-5 rounded-elder-xl bg-green-50 border-2 border-green-100 text-center">
              <div class="emoji-icon text-3xl mb-1">📊</div>
              <div class="text-elder-xs text-elder-muted mb-1">本周累计</div>
              <div class="text-elder-base font-black text-elder-green tabular-nums">{{ formatDuration(weekMin) }}</div>
            </div>
          </div>
        </div>
      </BigCard>

      <!-- 右侧：柱状图 -->
      <BigCard icon="📈" title="最近7天观看情况" subtitle="了解自己的刷视频习惯，合理安排时间">
        <div class="w-full h-[340px] mt-4 p-4">
          <Bar :data="barData" :options="barOptions" />
        </div>
        <div class="mt-6 p-5 rounded-elder-xl bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 flex items-start gap-5">
          <span class="emoji-icon text-4xl shrink-0">💡</span>
          <div>
            <div class="text-elder-base font-bold text-elder-ink mb-2">健康小贴士</div>
            <p class="text-elder-sm text-elder-ink leading-10">
              建议每天短视频观看时长不超过 <span class="font-bold text-elder-orange">2 小时</span>。
              每看 <span class="font-bold">30分钟</span> 就让眼睛休息一下，看看5米外的绿色植物20秒，
              这就是医生推荐的「20-20-20护眼法则」哦～
            </p>
          </div>
        </div>
      </BigCard>
    </div>

    <!-- 提醒中心 -->
    <BigCard icon="🔔" title="健康提醒中心" subtitle="开关提醒，或者点「测试一下」体验弹窗效果">
      <div class="grid md:grid-cols-2 gap-6">
        <div class="p-7 rounded-elder-xl border-2 transition-all" :class="eye ? 'bg-blue-50 border-elder-blue/40 shadow-elder' : 'bg-white border-gray-200'">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-elder bg-gradient-to-br from-elder-blue to-sky-500 text-white flex items-center justify-center text-4xl shadow-lg">
                👀
              </div>
              <div>
                <div class="text-elder-lg font-black text-elder-ink">每30分钟护眼提醒</div>
                <div class="text-elder-xs text-elder-muted mt-1">远眺窗外 · 放松眼球 · 预防近视</div>
              </div>
            </div>
            <button
              @click="eye = !eye"
              class="w-20 h-11 rounded-full transition-all relative shrink-0"
              :class="eye ? 'bg-elder-blue' : 'bg-gray-300'"
            >
              <div class="absolute top-1 w-9 h-9 bg-white rounded-full shadow transition-all" :style="{ left: eye ? 'calc(100% - 40px)' : '4px' }"></div>
            </button>
          </div>
          <button @click="testEye" class="elder-btn-outline !min-h-[52px] mt-6 w-full">
            🧪 测试一下提醒效果
          </button>
        </div>

        <div class="p-7 rounded-elder-xl border-2 transition-all" :class="ex ? 'bg-green-50 border-elder-green/40 shadow-elder' : 'bg-white border-gray-200'">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-elder bg-gradient-to-br from-elder-green to-emerald-500 text-white flex items-center justify-center text-4xl shadow-lg">
                💪
              </div>
              <div>
                <div class="text-elder-lg font-black text-elder-ink">每60分钟活动提醒</div>
                <div class="text-elder-xs text-elder-muted mt-1">颈椎 · 肩周 · 腰部 · 全身放松</div>
              </div>
            </div>
            <button
              @click="ex = !ex"
              class="w-20 h-11 rounded-full transition-all relative shrink-0"
              :class="ex ? 'bg-elder-green' : 'bg-gray-300'"
            >
              <div class="absolute top-1 w-9 h-9 bg-white rounded-full shadow transition-all" :style="{ left: ex ? 'calc(100% - 40px)' : '4px' }"></div>
            </button>
          </div>
          <button @click="testEx" class="elder-btn-green !min-h-[52px] mt-6 w-full">
            🧪 测试一下提醒效果
          </button>
        </div>
      </div>
    </BigCard>

    <!-- 轻运动清单 -->
    <div class="mt-10">
      <h2 class="text-elder-xl font-black text-elder-ink mb-8 flex items-center gap-4">
        <span class="emoji-icon text-4xl">🧘</span>
        居家轻运动清单
        <span class="text-elder-sm font-normal text-elder-muted">（6个动作 · 每个3~5分钟 · 坐着也能做）</span>
      </h2>

      <div v-if="!lightExercises.length"><EmptyState icon="🧘" text="暂无运动推荐" /></div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="e in lightExercises"
          :key="e.id"
          class="elder-card overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-elder-lg transition-all"
          @click="toggleExercise(e.id)"
        >
          <div class="relative aspect-[5/3] bg-gray-100 overflow-hidden">
            <img :src="e.image" class="w-full h-full object-cover" />
            <div class="absolute top-4 left-4 px-4 py-2 rounded-lg bg-white/90 backdrop-blur text-elder-xs font-bold text-elder-ink shadow">
              ⏱️ {{ e.duration }}
            </div>
            <div class="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-3xl shadow">
              {{ e.emoji }}
            </div>
          </div>
          <div class="p-6">
            <div class="text-elder-lg font-black text-elder-ink mb-2">{{ e.name }}</div>
            <p class="text-elder-sm text-elder-muted leading-8">{{ e.description }}</p>

            <transition name="slide-up">
              <div v-if="expandedExercise === e.id" class="mt-6 pt-6 border-t border-orange-100 space-y-4">
                <div class="text-elder-sm font-bold text-elder-orange">📝 图文步骤分解：</div>
                <ol class="space-y-3">
                  <li
                    v-for="(s, i) in e.steps"
                    :key="i"
                    class="flex gap-4 items-start p-4 rounded-xl bg-orange-50 border border-orange-100"
                  >
                    <span class="shrink-0 w-9 h-9 rounded-full bg-elder-orange text-white font-black flex items-center justify-center text-elder-sm">
                      {{ i + 1 }}
                    </span>
                    <span class="text-elder-sm text-elder-ink leading-9">{{ s }}</span>
                  </li>
                </ol>
                <div class="flex gap-3 pt-2 flex-wrap">
                  <button class="elder-btn-primary !min-h-[56px] flex-1" @click.stop>
                    ▶️ 立即开始跟练
                  </button>
                  <button class="elder-btn-outline !min-h-[56px] flex-1" @click.stop>
                    🔊 语音读步骤
                  </button>
                </div>
              </div>
            </transition>

            <div class="mt-5 text-elder-xs text-elder-muted text-right">
              👆 点击卡片{{ expandedExercise === e.id ? '收起' : '展开' }}步骤详情
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
