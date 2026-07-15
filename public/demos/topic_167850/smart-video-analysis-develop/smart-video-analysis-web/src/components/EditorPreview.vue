<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { VideoPlay, VideoPause, RefreshLeft, Mic, FullScreen } from '@element-plus/icons-vue'

const store = useEditorStore()

const previewTime = ref(0)
const isPlaying = ref(false)
const progress = ref(0)
const volume = ref(80)
let playInterval: number | null = null

const formattedTime = computed(() => formatTime(previewTime.value))
const formattedDuration = computed(() => formatTime(store.totalDuration))

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  store.togglePlay()
  
  if (isPlaying.value) {
    playInterval = window.setInterval(() => {
      previewTime.value += 100
      progress.value = (previewTime.value / store.totalDuration) * 100
      store.setPlayheadPosition(previewTime.value)
      
      if (previewTime.value >= store.totalDuration) {
        stopPlay()
      }
    }, 100)
  } else {
    stopPlay()
  }
}

const stopPlay = () => {
  isPlaying.value = false
  store.togglePlay()
  if (playInterval) {
    clearInterval(playInterval)
    playInterval = null
  }
}

const handleProgressClick = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  previewTime.value = Math.floor(percent * store.totalDuration)
  progress.value = percent * 100
  store.setPlayheadPosition(previewTime.value)
}

const handleVolumeChange = (value: number | number[]) => {
  console.log('Volume:', value)
}

const handleFullscreen = () => {
  const preview = document.querySelector('.preview-container')
  if (preview && !document.fullscreenElement) {
    preview.requestFullscreen()
  } else if (document.fullscreenElement) {
    document.exitFullscreen()
  }
}

onUnmounted(() => {
  stopPlay()
})
</script>

<template>
  <div class="editor-preview">
    <div class="preview-container">
      <div class="preview-video">
        <div class="video-placeholder">
          <el-icon :size="48"><VideoPlay /></el-icon>
          <p>视频预览区域</p>
          <p class="preview-tip">拖拽素材到时间轴开始编辑</p>
        </div>
      </div>
      <div class="preview-overlay" v-if="!isPlaying && store.totalDuration === 0">
        <el-icon :size="48" class="play-icon"><VideoPlay /></el-icon>
      </div>
    </div>

    <div class="preview-controls">
      <div class="control-left">
        <el-button @click="stopPlay" size="small" circle>
          <el-icon><VideoPause /></el-icon>
        </el-button>
        <el-button @click="togglePlay" size="small" circle type="primary">
          <el-icon><component :is="isPlaying ? VideoPause : VideoPlay" /></el-icon>
        </el-button>
        <el-button @click="previewTime = 0; store.setPlayheadPosition(0)" size="small" circle>
          <el-icon><RefreshLeft /></el-icon>
        </el-button>
        <span class="time-display">
          {{ formattedTime }} / {{ formattedDuration }}
        </span>
      </div>

      <div class="progress-bar" @click="handleProgressClick">
        <div class="progress-fill" :style="{ width: progress + '%' }" />
        <div class="progress-thumb" :style="{ left: progress + '%' }" />
      </div>

      <div class="control-right">
        <el-button size="small" circle>
          <el-icon><Mic /></el-icon>
        </el-button>
        <el-slider
          v-model="volume"
          :max="100"
          :step="1"
          class="volume-slider"
          @change="handleVolumeChange"
        />
        <el-button @click="handleFullscreen" size="small" circle>
          <el-icon><FullScreen /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-preview {
  background: #0f3460;
  border-bottom: 1px solid #0f3460;
}

.preview-container {
  position: relative;
  aspect-ratio: 16/9;
  background: #0a0a0f;
}

.preview-video {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #666;
}

.video-placeholder p {
  margin: 8px 0 0 0;
  font-size: 14px;
}

.preview-tip {
  font-size: 12px !important;
  opacity: 0.6;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.play-icon {
  color: #fff;
  opacity: 0.8;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #16213e;
}

.control-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-display {
  font-size: 12px;
  color: #fff;
  min-width: 100px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #333;
  border-radius: 2px;
  position: relative;
  cursor: pointer;
}

.progress-fill {
  height: 100%;
  background: #409eff;
  border-radius: 2px;
  transition: width 0.1s;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  background: #409eff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: left 0.1s;
}

.control-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-slider {
  width: 60px;
}
</style>