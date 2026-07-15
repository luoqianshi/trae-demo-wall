<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { showEyeReminder, showExerciseReminder } from '@/composables/useWatchTime'
import { useSpeech } from '@/composables/useSpeech'

const EYE_MODAL_ID = 'elder-eye-reminder-modal'
const EXERCISE_MODAL_ID = 'elder-exercise-reminder-modal'

const settings = useSettingsStore()
const speech = useSpeech()

const show = computed(() => {
  const mode = settings.settings.currentMode
  return mode !== 'elder'
})

const tips = computed(() => {
  const mode = settings.settings.currentMode
  if (mode === 'child') return '子女模式：为爸妈远程推送优质视频、设置护眼提醒、发送语音留言'
  return '社区模式：线下老年活动室 · 导出内容合集二维码 · 发布社区活动'
})

function hideModalById(id: string) {
  try {
    const el = document.getElementById(id)
    if (el) {
      el.style.display = 'none'
      el.style.visibility = 'hidden'
    }
  } catch {}
}

function closeEyeReminder() {
  alert('✅ 点击了护眼提醒关闭按钮！现在尝试双重关闭…')
  try {
    showEyeReminder.value = false
  } catch (e) {
    alert('❌ Vue状态设置失败：' + String(e))
  }
  nextTick(() => {
    hideModalById(EYE_MODAL_ID)
    setTimeout(() => hideModalById(EYE_MODAL_ID), 100)
    setTimeout(() => hideModalById(EYE_MODAL_ID), 500)
  })
  setTimeout(() => hideModalById(EYE_MODAL_ID), 50)
}

function closeEyeAndSpeak() {
  alert('✅ 点击了语音提醒按钮！')
  try {
    showEyeReminder.value = false
  } catch {}
  hideModalById(EYE_MODAL_ID)
  setTimeout(() => hideModalById(EYE_MODAL_ID), 50)
  speech.stop()
  speech.speak('请放下手机，站起来活动一下，看看远处的绿色植物哦', { rateLevel: 'slow' })
}

function closeExerciseReminder() {
  alert('✅ 点击了「好的马上起来」关闭按钮！现在进行双重关闭…')
  try {
    showExerciseReminder.value = false
  } catch (e) {
    alert('❌ Vue状态设置失败：' + String(e))
  }
  nextTick(() => {
    hideModalById(EXERCISE_MODAL_ID)
    setTimeout(() => hideModalById(EXERCISE_MODAL_ID), 100)
    setTimeout(() => hideModalById(EXERCISE_MODAL_ID), 500)
  })
  setTimeout(() => hideModalById(EXERCISE_MODAL_ID), 50)
}
</script>

<template>
  <transition name="slide-up">
    <div
      v-if="show"
      class="bg-gradient-to-r from-elder-blue/15 via-elder-green/10 to-elder-orange/15 border-b border-orange-100"
    >
      <div class="max-w-[1200px] mx-auto px-6 md:px-10 py-4 flex items-center gap-4 flex-wrap">
        <span class="emoji-icon text-3xl">💡</span>
        <span class="text-elder-sm font-medium text-elder-ink flex-1">{{ tips }}</span>
        <button
          @click="settings.setMode('elder')"
          class="px-5 py-3 rounded-elder bg-white text-elder-sm font-semibold text-elder-blue border-2 border-elder-blue/30 hover:border-elder-blue active:scale-95 transition-all"
        >
          切回长辈模式
        </button>
      </div>
    </div>
  </transition>

  <transition name="slide-up">
    <div
      v-if="showEyeReminder"
      :id="EYE_MODAL_ID"
      class="fixed inset-0 z-[99999] !important flex items-start justify-center pt-[100px] p-4"
      style="pointer-events:auto !important;"
    >
      <div
        class="absolute inset-0 bg-black/60"
        style="pointer-events:auto !important; cursor:pointer;"
        @click="closeEyeReminder"
      ></div>
      <div
        class="relative w-[92%] max-w-[600px] bg-gradient-to-r from-elder-blue to-elder-green text-white rounded-elder-2xl shadow-elder-lg p-8 animate-shake"
        style="pointer-events:auto !important; z-index: 100000;"
      >
        <button
          @click.stop="closeEyeReminder"
          class="absolute top-5 right-5 h-14 w-14 rounded-full bg-white/25 hover:bg-white/40 border-3 border-white/40 text-3xl font-bold flex items-center justify-center shadow-xl active:scale-95 transition-all"
          style="pointer-events:auto !important; touch-action: manipulation;"
        >✕</button>
        <div class="flex items-start gap-5">
          <span class="emoji-icon text-6xl shrink-0">👀</span>
          <div class="flex-1 pr-14 min-w-0">
            <div class="text-elder-lg font-bold mb-3">护眼时间到啦！</div>
            <div class="text-elder-sm opacity-95 mb-6 leading-9">
              您已经连续看了30分钟短视频，快放下手机，站起来看看远处的绿色植物吧～
            </div>
            <div class="flex gap-4 flex-wrap">
              <button
                @click.stop="closeEyeReminder"
                class="elder-btn bg-white/95 text-elder-blue text-2xl !px-8 !py-5 shadow-xl active:scale-95"
                style="pointer-events:auto !important; touch-action: manipulation;"
              >
                好的，我这就休息
              </button>
              <button
                @click.stop="closeEyeAndSpeak"
                class="elder-btn-green text-2xl !px-8 !py-5 shadow-xl active:scale-95"
                style="pointer-events:auto !important; touch-action: manipulation;"
              >
                🔊 再听一遍语音提醒
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <transition name="slide-up">
    <div
      v-if="showExerciseReminder"
      :id="EXERCISE_MODAL_ID"
      class="fixed inset-0 z-[99999] !important flex items-start justify-center pt-[100px] p-4"
      style="pointer-events:auto !important;"
    >
      <div
        class="absolute inset-0 bg-black/60"
        style="pointer-events:auto !important; cursor:pointer;"
        @click="closeExerciseReminder"
      ></div>
      <div
        class="relative w-[92%] max-w-[600px] bg-gradient-to-r from-elder-orange to-elder-red text-white rounded-elder-2xl shadow-elder-lg p-8"
        style="pointer-events:auto !important; z-index: 100000;"
      >
        <button
          @click.stop="closeExerciseReminder"
          class="absolute top-5 right-5 h-14 w-14 rounded-full bg-white/25 hover:bg-white/40 border-3 border-white/40 text-3xl font-bold flex items-center justify-center shadow-xl active:scale-95 transition-all"
          style="pointer-events:auto !important; touch-action: manipulation;"
        >✕</button>
        <div class="flex items-start gap-5">
          <span class="emoji-icon text-6xl shrink-0">💪</span>
          <div class="flex-1 pr-14 min-w-0">
            <div class="text-elder-lg font-bold mb-3">活动筋骨时间！</div>
            <div class="text-elder-sm opacity-95 mb-6 leading-9">
              已经看了1小时啦～久坐伤身，跟着我们一起做一遍颈椎操，脖子肩膀更舒服！
            </div>
            <div class="flex gap-4 flex-wrap">
              <button
                @click.stop="closeExerciseReminder"
                class="elder-btn bg-white/95 text-elder-red text-2xl !px-8 !py-5 shadow-xl active:scale-95"
                style="pointer-events:auto !important; touch-action: manipulation;"
              >
                好的，马上起来
              </button>
              <router-link
                to="/health"
                @click.native.stop="closeExerciseReminder"
                class="elder-btn bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 text-2xl !px-8 !py-5 shadow-xl active:scale-95 no-underline"
                style="pointer-events:auto !important; touch-action: manipulation;"
              >
                💪 查看轻运动清单
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>
