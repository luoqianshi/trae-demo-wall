<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArchiveStore } from '@/store/archiveStore'
import { useUiStore } from '@/store/uiStore'
import { useUserStore } from '@/store/userStore'
import { useAudioRecorder } from '@/composables/useAudioRecorder'
import { formatDuration } from '@/utils/format'

// 口述历史：录音列表 + 录音功能 + 语音转文字模拟
const router = useRouter()
const archiveStore = useArchiveStore()
const uiStore = useUiStore()
const userStore = useUserStore()

const { isRecording, seconds, waveBars, start, stop } = useAudioRecorder()

// 正在播放的录音 id
const playingId = ref(null)

onMounted(async () => {
  if (!archiveStore.oralHistories.length) {
    await archiveStore.fetchOralHistories()
  }
})

// 切换录音
const toggleRecord = async () => {
  if (isRecording.value) {
    // 停止录音
    const { duration } = await stop()
    // 模拟转文字
    uiStore.showToast('录音已保存，正在转文字…')
    const teller = userStore.displayName || '我'
    const newOral = await archiveStore.addOralHistory({
      tellerName: teller,
      tellerAge: '--',
      title: '新建口述录音',
      transcript: '（这是一段刚刚录下的口述，转文字功能正在分析中…）一段关于家乡与亲人的回忆，需要时间慢慢讲述。',
      summary: '新建录音'
    })
    // 1.8 秒后模拟转文字完成
    setTimeout(() => {
      const target = archiveStore.oralHistories.find((o) => o.id === newOral.id)
      if (target) {
        target.title = '我的乡村记忆'
        target.transcript = '我出生在田家村，小时候最盼着过年。曾祖母会做糍粑，祖父会带我去田里捉泥鳅。那些日子再也回不去了，但我会一直记着。'
        target.summary = '讲述者回忆了童年乡村生活'
        uiStore.showToast('语音转文字完成')
      }
    }, 1800)
  } else {
    try {
      await start()
      uiStore.showToast('开始录音，请讲述')
    } catch (e) {
      uiStore.showToast('麦克风不可用', 'err')
    }
  }
}

// 播放（模拟）
const play = (o) => {
  playingId.value = playingId.value === o.id ? null : o.id
  if (playingId.value) {
    uiStore.showToast('播放：' + o.title)
  }
}

const back = () => router.push('/archive')
</script>

<template>
  <div class="page">
    <div class="page-head">
      <button class="back-btn" @click="back">
        <AppIcon icon="lucide:arrow-left" :size="16" />
        返回档案
      </button>
      <div class="section-eyebrow">口述历史</div>
      <h2 class="section-title">把老人的声音留下来</h2>
      <p class="section-sub">趁老人还在，趁记忆还清晰。录下一段口述，让故事可以传给下一代。</p>
    </div>

    <!-- 录音区 -->
    <div class="oral-record">
      <h3>录下一段口述</h3>
      <p>点击下方按钮开始录音</p>
      <button
        class="record-btn"
        :class="{ recording: isRecording }"
        @click="toggleRecord"
      >
        <AppIcon :icon="isRecording ? 'lucide:square' : 'lucide:mic'" :size="28" />
      </button>
      <div class="wave-bars" :class="{ active: isRecording }">
        <span
          v-for="(h, i) in waveBars"
          :key="i"
          :style="{ height: h + 'px' }"
        ></span>
      </div>
      <p v-if="isRecording" class="recording-time">
        ● 录音中 {{ formatDuration(seconds) }}
      </p>
    </div>

    <!-- 录音列表 -->
    <div class="section-eyebrow" style="margin-top: 40px">已收录口述</div>
    <h3 class="sub-title">共 {{ archiveStore.oralHistories.length }} 条</h3>
    <div class="oral-list">
      <div class="oral-item" v-for="o in archiveStore.oralHistories" :key="o.id">
        <button
          class="oral-play"
          :class="{ playing: playingId === o.id }"
          @click="play(o)"
        >
          <AppIcon :icon="playingId === o.id ? 'lucide:pause' : 'lucide:play'" :size="18" />
        </button>
        <div class="oral-content">
          <div class="top">
            <h5>{{ o.title }}</h5>
            <span class="speaker">{{ o.tellerName }} · {{ o.tellerAge }}岁</span>
          </div>
          <p class="excerpt">"{{ o.transcript }}"</p>
          <div class="summary" v-if="o.summary">
            <span class="summary-tag">摘要</span>{{ o.summary }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-head {
  margin-bottom: 30px;
}

.back-btn {
  border: none;
  background: transparent;
  color: var(--text-light);
  cursor: pointer;
  font-family: var(--font-serif);
  font-size: 14px;
  margin-bottom: 14px;
  padding: 0;
  transition: color var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.back-btn:hover {
  color: var(--seal);
}

.sub-title {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--primary-deep);
  font-weight: 400;
  margin-bottom: 20px;
}

.oral-record {
  background: linear-gradient(160deg, var(--moss-deep), var(--moss));
  border-radius: var(--radius-lg);
  padding: 36px;
  color: var(--bg-warm);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.oral-record::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.08;
  background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 20px, rgba(250, 246, 239, 0.5) 20px, rgba(250, 246, 239, 0.5) 21px);
}

.oral-record h3 {
  font-family: var(--font-display);
  font-size: 26px;
  margin-bottom: 8px;
  font-weight: 400;
  position: relative;
}

.oral-record > p {
  opacity: 0.85;
  font-size: 14px;
  margin-bottom: 24px;
  position: relative;
}

.record-btn {
  width: 74px;
  height: 74px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: var(--seal);
  color: var(--bg-warm);
  font-size: 28px;
  box-shadow: 0 0 0 0 rgba(168, 50, 50, 0.5);
  transition: all 0.3s;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.record-btn:hover {
  transform: scale(1.08);
}

.record-btn.recording {
  animation: recordPulse 1.4s infinite;
}

@keyframes recordPulse {
  0% { box-shadow: 0 0 0 0 rgba(168, 50, 50, 0.6); }
  100% { box-shadow: 0 0 0 24px rgba(168, 50, 50, 0); }
}

.wave-bars {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 4px;
  height: 60px;
  margin-top: 24px;
  position: relative;
}

.wave-bars span {
  width: 5px;
  background: var(--earth-soft);
  border-radius: 2px;
  transition: height 0.15s ease;
}

.recording-time {
  margin-top: 14px;
  font-family: 'Cormorant Garamond', Georgia, serif;
  color: var(--bg-warm);
  letter-spacing: 1px;
}

.oral-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.oral-item {
  background: var(--bg-warm);
  border-radius: var(--radius);
  padding: 22px 24px;
  box-shadow: var(--shadow-soft);
  display: flex;
  gap: 18px;
  align-items: flex-start;
  border: 1px solid rgba(139, 107, 80, 0.1);
  transition: all var(--transition);
}

.oral-item:hover {
  transform: translateX(4px);
  box-shadow: var(--shadow-lift);
}

.oral-play {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--moss), var(--moss-deep));
  color: var(--bg-warm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  border: none;
  transition: all 0.25s;
}

.oral-play:hover {
  transform: scale(1.1);
}

.oral-play.playing {
  background: linear-gradient(135deg, var(--seal), var(--seal-deep));
}

.oral-content {
  flex: 1;
  min-width: 0;
}

.oral-content .top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  flex-wrap: wrap;
  gap: 8px;
}

.oral-content h5 {
  font-family: var(--font-display);
  font-size: 19px;
  color: var(--primary-deep);
  font-weight: 400;
}

.speaker {
  font-size: 13px;
  color: var(--seal);
}

.excerpt {
  font-size: 14px;
  color: var(--text-light);
  line-height: 1.7;
  margin-top: 6px;
}

.summary {
  margin-top: 10px;
  font-size: 12px;
  color: var(--moss-deep);
  display: flex;
  align-items: center;
  gap: 6px;
}

.summary-tag {
  padding: 2px 8px;
  background: rgba(90, 122, 107, 0.12);
  border-radius: 10px;
}

@media (max-width: 600px) {
  .oral-item {
    flex-direction: column;
  }
}
</style>
