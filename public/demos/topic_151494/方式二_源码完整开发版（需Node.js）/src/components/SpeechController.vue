<script setup lang="ts">
import { ref, computed } from 'vue'
import { Volume2, VolumeX, Gauge, FastForward, Rewind, User, Users } from 'lucide-vue-next'
import { useSpeech } from '@/composables/useSpeech'
import { useSettingsStore } from '@/stores/settings'

const speech = useSpeech()
const settings = useSettingsStore()

const gender = ref<'male' | 'female'>('female')
const voiceName = computed(() => gender.value === 'female' ? '👩 女声朗读' : '👨 男声朗读')

function demoSpeak() {
  speech.stop()
  speech.speak('各位叔叔阿姨大家好，我是小银，这是银龄AI助手的语音朗读功能，我会把视频里的字幕一句一句读给您听。', {
    rateLevel: settings.settings.speechRate,
    gender: gender.value
  })
}
</script>

<template>
  <div class="elder-card p-8">
    <div class="flex items-center gap-4 mb-6">
      <span class="emoji-icon text-4xl">🔊</span>
      <h3 class="text-elder-lg font-bold text-elder-ink">语音朗读控制器</h3>
    </div>

    <div class="grid md:grid-cols-3 gap-5">
      <!-- 播放控制 -->
      <div class="p-6 rounded-elder-xl bg-blue-50 border-2 border-blue-100">
        <div class="text-elder-sm font-semibold text-elder-ink mb-4">🎬 播放控制</div>
        <div class="flex flex-wrap gap-3">
          <button
            @click="speech.isSpeaking ? speech.stop() : demoSpeak()"
            :class="speech.isSpeaking ? 'elder-btn-red' : 'elder-btn-blue'"
            class="!min-h-[56px] !text-elder-sm !px-5 flex-1"
          >
            <Volume2 v-if="!speech.isSpeaking" class="w-6 h-6" :stroke-width="2.2" />
            <VolumeX v-else class="w-6 h-6" :stroke-width="2.2" />
            {{ speech.isSpeaking ? '停止朗读' : '试一下朗读' }}
          </button>
          <button
            v-if="speech.isSpeaking"
            @click="speech.isPaused ? speech.resume() : speech.pause()"
            class="elder-btn-outline !min-h-[56px] !text-elder-sm !px-5 flex-1"
          >
            {{ speech.isPaused ? '▶️ 继续' : '⏸ 暂停' }}
          </button>
        </div>
      </div>

      <!-- 语速调节 -->
      <div class="p-6 rounded-elder-xl bg-orange-50 border-2 border-orange-100">
        <div class="text-elder-sm font-semibold text-elder-ink mb-4 flex items-center gap-2">
          <Gauge class="w-6 h-6 text-elder-orange" :stroke-width="2.2" />
          语速调节
        </div>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="r in (['slow', 'normal', 'fast'] as const)"
            :key="r"
            @click="settings.setSpeechRate(r)"
            class="h-16 rounded-elder border-2 transition-all flex flex-col items-center justify-center active:scale-95"
            :class="settings.settings.speechRate === r
              ? 'bg-elder-orange text-white border-elder-orange shadow-elder-orange'
              : 'bg-white text-elder-ink border-orange-200 hover:border-elder-orange'"
          >
            <Rewind v-if="r === 'slow'" class="w-6 h-6" :stroke-width="2.2" />
            <Gauge v-else-if="r === 'normal'" class="w-6 h-6" :stroke-width="2.2" />
            <FastForward v-else class="w-6 h-6" :stroke-width="2.2" />
            <span class="text-elder-xs font-bold mt-1">
              {{ r === 'slow' ? '慢速' : r === 'normal' ? '正常' : '快速' }}
            </span>
          </button>
        </div>
      </div>

      <!-- 男声/女声 -->
      <div class="p-6 rounded-elder-xl bg-purple-50 border-2 border-purple-100">
        <div class="text-elder-sm font-semibold text-elder-ink mb-4">👥 朗读音色</div>
        <div class="grid grid-cols-2 gap-3">
          <button
            @click="gender = 'female'"
            class="h-16 rounded-elder border-2 transition-all active:scale-95 flex items-center justify-center gap-2"
            :class="gender === 'female'
              ? 'bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-500/30'
              : 'bg-white text-elder-ink border-purple-200 hover:border-pink-400'"
          >
            <User class="w-6 h-6" :stroke-width="2.2" />
            <span class="text-elder-xs font-bold">女声（推荐）</span>
          </button>
          <button
            @click="gender = 'male'"
            class="h-16 rounded-elder border-2 transition-all active:scale-95 flex items-center justify-center gap-2"
            :class="gender === 'male'
              ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30'
              : 'bg-white text-elder-ink border-purple-200 hover:border-blue-400'"
          >
            <Users class="w-6 h-6" :stroke-width="2.2" />
            <span class="text-elder-xs font-bold">男声</span>
          </button>
        </div>
        <div class="mt-4 text-center text-elder-xs text-elder-muted">
          当前：{{ voiceName }} · {{ settings.settings.speechRate === 'slow' ? '慢速' : settings.settings.speechRate === 'fast' ? '快速' : '正常语速' }}
        </div>
      </div>
    </div>
  </div>
</template>
