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

    <!-- Beautiful fallback preview card -->
    <div
      v-if="showFallback"
      class="absolute inset-0 flex flex-col items-center justify-center rounded-trae-card z-10 overflow-hidden"
    >
      <!-- Blurred thumbnail background -->
      <div class="absolute inset-0">
        <img
          v-if="project?.thumbnail"
          :src="project.thumbnail"
          class="w-full h-full object-cover blur-2xl scale-110 opacity-30"
          alt=""
        />
        <div
          v-else
          class="w-full h-full bg-gradient-to-br from-trae-card via-trae-bg to-trae-card"
        />
      </div>
      <!-- Dark overlay -->
      <div class="absolute inset-0 bg-trae-bg/60" />

      <!-- Card content -->
      <div class="relative z-10 flex flex-col items-center gap-4 px-8 text-center max-w-md">
        <!-- Thumbnail -->
        <img
          v-if="project?.thumbnail"
          :src="project.thumbnail"
          :alt="project?.title"
          class="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-lg"
        />
        <div
          v-else
          class="w-16 h-16 rounded-2xl bg-trae-card border border-trae-accent grid place-items-center text-trae-accent text-2xl shadow-[0_0_24px_rgba(34,197,94,0.35)]"
        >
          {{ project?.title?.charAt(0) || '?' }}
        </div>

        <!-- Title -->
        <h3 class="text-trae-text font-bold text-lg leading-tight">{{ project?.title }}</h3>
        <!-- Author -->
        <p class="text-trae-text-muted text-sm">{{ project?.author }}</p>
        <!-- Description -->
        <p class="text-trae-text-secondary text-xs leading-relaxed line-clamp-2">
          {{ project?.description || '暂无描述' }}
        </p>

        <!-- Open button -->
        <a
          :href="project?.demoUrl || project?.localPath"
          target="_blank"
          rel="noopener"
          class="btn-primary !py-2.5 !px-6 !text-sm mt-2"
        >
          <svg class="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
          在新标签页打开
        </a>
      </div>
    </div>

    <!-- iframe -->
    <transition name="fade">
      <iframe
        v-if="previewUrl && !isLoading && !showFallback"
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
  } else {
    // No preview URL, show fallback immediately
    isLoading.value = false
    showFallback.value = true
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
