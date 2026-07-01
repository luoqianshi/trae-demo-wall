<template>
  <div class="relative w-full h-full flex items-center justify-center">
    <!-- Loading skeleton -->
    <div
      v-if="isLoading"
      class="absolute inset-0 flex items-center justify-center bg-trae-card rounded-trae-card"
    >
      <div class="flex flex-col items-center gap-3">
        <svg class="w-10 h-10 text-trae-accent animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p class="text-trae-text-muted text-sm">加载中...</p>
      </div>
    </div>

    <!-- Fallback overlay -->
    <div
      v-if="showFallback"
      class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-trae-card rounded-trae-card z-10"
    >
      <svg class="w-12 h-12 text-trae-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="text-trae-text-secondary text-sm">该作品不支持内嵌预览</p>
      <div class="flex gap-3">
        <a
          :href="project?.demoUrl || project?.localPath"
          target="_blank"
          rel="noopener"
          class="btn-secondary !py-2 !px-4 !text-xs"
        >
          在新标签页打开
        </a>
        <button @click="$emit('next')" class="btn-primary !py-2 !px-4 !text-xs">
          下一个
        </button>
      </div>
    </div>

    <!-- iframe -->
    <transition name="fade">
      <iframe
        v-if="previewUrl && !isLoading"
        :key="previewUrl"
        :src="previewUrl"
        class="w-full h-full bg-trae-bg"
        sandbox="allow-scripts allow-same-origin allow-popups"
        @load="onLoad"
      />
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  project: { type: Object, default: null },
})

const emit = defineEmits(['prev', 'next'])

const isLoading = ref(true)
const showFallback = ref(false)
let loadTimer = null

const previewUrl = computed(() => {
  if (!props.project) return null
  if (props.project.demoUrl) return props.project.demoUrl
  if (props.project.localPath) return props.project.localPath
  return null
})

function startLoading() {
  isLoading.value = true
  showFallback.value = false
  clearTimeout(loadTimer)
  loadTimer = setTimeout(() => {
    if (isLoading.value) {
      isLoading.value = false
      showFallback.value = true
    }
  }, 5000)
}

function onLoad() {
  clearTimeout(loadTimer)
  isLoading.value = false
}

watch(() => props.project, () => {
  if (previewUrl.value) {
    startLoading()
  }
}, { immediate: true })

function handleKeydown(e) {
  switch (e.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault()
      emit('prev')
      break
    case 'ArrowRight':
    case 'ArrowDown':
    case ' ':
      e.preventDefault()
      emit('next')
      break
    case 'Enter':
      if (previewUrl.value) {
        window.open(previewUrl.value, '_blank', 'noopener')
      }
      break
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  clearTimeout(loadTimer)
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
