<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useMediaPipe } from '@/composables/useMediaPipe'
import { useDrawer } from '@/composables/useDrawer'

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const isCameraOn = ref(false)
let stream: MediaStream | null = null

const {
  isModelLoaded,
  loadingProgress,
  loadingStatus,
  initModels,
  startDetection,
  stopDetection,
  dispose: disposeMediaPipe,
  processImageForFeatures
} = useMediaPipe()

defineExpose({
  processImageForFeatures,
  isModelLoaded
})

const {
  setCanvas,
  syncCanvasSize,
  startDrawing,
  stopDrawing,
  dispose: disposeDrawer
} = useDrawer()

const startCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false
    })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      isCameraOn.value = true
    }
  } catch (error) {
    console.error('摄像头访问失败:', error)
    alert('无法访问摄像头，请检查权限设置')
  }
}

const stopCamera = () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
  isCameraOn.value = false
}

watch(isCameraOn, async (newVal) => {
  if (newVal && isModelLoaded.value && videoRef.value) {
    await nextTick()
    syncCanvasSize(videoRef.value)
    startDetection(videoRef.value)
    startDrawing()
  } else if (!newVal) {
    stopDetection()
    stopDrawing()
  }
})

const handleResize = () => {
  if (isCameraOn.value && videoRef.value) {
    syncCanvasSize(videoRef.value)
  }
}

onMounted(async () => {
  if (canvasRef.value) {
    setCanvas(canvasRef.value)
  }
  
  window.addEventListener('resize', handleResize)
  
  await initModels()
})

onUnmounted(() => {
  stopCamera()
  stopDetection()
  stopDrawing()
  disposeMediaPipe()
  disposeDrawer()
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div ref="containerRef" class="w-full h-full bg-gray-900 rounded-lg overflow-hidden relative">
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <video
        ref="videoRef"
        class="w-full h-full object-cover"
        autoplay
        playsInline
        muted
      ></video>
      <canvas
        ref="canvasRef"
        class="absolute inset-0 w-full h-full pointer-events-none"
      ></canvas>
    </div>
    
    <div v-if="!isModelLoaded" class="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
      <div class="text-white text-center">
        <svg class="w-16 h-16 mx-auto mb-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p class="text-lg mb-2">{{ loadingStatus }}</p>
        <div class="w-48 h-2 bg-gray-700 rounded-full overflow-hidden mx-auto">
          <div
            class="h-full bg-blue-500 transition-all duration-300"
            :style="{ width: `${loadingProgress}%` }"
          ></div>
        </div>
        <p class="text-sm text-gray-400 mt-2">{{ loadingProgress }}%</p>
      </div>
    </div>
    
    <div v-else-if="!isCameraOn" class="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
      <div class="text-white text-center">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <p class="text-lg">摄像头未开启</p>
        <p class="text-sm text-gray-400 mt-2">点击下方按钮开启摄像头</p>
      </div>
    </div>
    
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
      <button
        v-if="!isCameraOn && isModelLoaded"
        @click="startCamera"
        class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg"
      >
        开启摄像头
      </button>
      <button
        v-else-if="isCameraOn"
        @click="stopCamera"
        class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-lg"
      >
        关闭摄像头
      </button>
      <button
        v-if="!isModelLoaded"
        disabled
        class="px-6 py-3 bg-gray-600 text-gray-400 rounded-lg font-medium cursor-not-allowed"
      >
        加载中...
      </button>
    </div>
  </div>
</template>