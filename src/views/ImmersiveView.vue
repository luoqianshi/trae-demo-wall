<template>
  <div class="h-screen w-screen overflow-hidden flex flex-col bg-trae-bg">
    <!-- Top nav bar -->
    <nav class="flex items-center justify-between px-6 py-3 border-b border-trae-border shrink-0">
      <router-link
        to="/"
        class="flex items-center gap-2 text-trae-text-secondary hover:text-trae-accent transition-colors text-sm"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        返回首页
      </router-link>
      <span v-if="!loading" class="text-trae-text-muted text-sm font-mono">
        {{ (currentIndex + 1) }} / {{ playOrder.length }}
      </span>
      <span class="text-trae-text-secondary text-sm truncate max-w-[300px]">
        {{ currentProject?.title || '' }}
      </span>
    </nav>

    <!-- Main content -->
    <div class="flex-1 flex items-center justify-center p-4 overflow-hidden">
      <!-- Loading state -->
      <div v-if="loading" class="flex flex-col items-center gap-4">
        <svg class="w-12 h-12 text-trae-accent animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p class="text-trae-text-muted">正在加载作品库...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="flex flex-col items-center gap-4">
        <p class="text-trae-text-muted">加载失败</p>
        <button @click="init" class="btn-primary !text-sm">重试</button>
      </div>

      <!-- Empty state -->
      <div v-else-if="playOrder.length === 0" class="flex flex-col items-center gap-4">
        <p class="text-trae-text-muted">暂无可浏览的作品</p>
        <router-link to="/" class="btn-secondary !text-sm">返回首页</router-link>
      </div>

      <!-- Player -->
      <div
        v-else
        class="relative w-full max-w-[1280px] aspect-video rounded-trae-card overflow-hidden border border-trae-border"
      >
        <ImmersivePlayer
          :project="currentProject"
          @prev="goPrev"
          @next="goNext"
        />
      </div>
    </div>

    <!-- Bottom info bar -->
    <div
      v-if="!loading && !error && currentProject"
      class="shrink-0 bg-trae-card/80 backdrop-blur-md border-t border-trae-border"
    >
      <!-- Nav buttons -->
      <div class="flex justify-center gap-3 pt-3">
        <button
          @click="goPrev"
          class="flex items-center gap-1.5 px-4 py-2 rounded-trae-pill bg-white/5 text-white/80 text-sm border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          上一个
        </button>
        <button
          @click="goNext"
          class="flex items-center gap-1.5 px-4 py-2 rounded-trae-pill bg-trae-accent text-trae-bg text-sm font-bold hover:bg-trae-accent-deep transition-all duration-200"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          下一个
        </button>
        <a
          v-if="currentProject.demoUrl || currentProject.localPath"
          :href="currentProject.demoUrl || currentProject.localPath"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-1.5 px-4 py-2 rounded-trae-pill bg-white/5 text-white/80 text-sm border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
          新标签页打开
        </a>
        <router-link
          :to="`/project/${currentProject.id}`"
          class="flex items-center gap-1.5 px-4 py-2 rounded-trae-pill bg-white/5 text-white/80 text-sm border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          查看详情
        </router-link>
      </div>

      <!-- Project info -->
      <div class="flex items-center justify-between px-8 py-3">
        <div class="min-w-0">
          <h3 class="text-trae-text font-medium text-sm truncate">{{ currentProject.title }}</h3>
          <p class="text-trae-text-muted text-xs">{{ currentProject.author }}</p>
        </div>
        <div class="flex items-center gap-4 text-xs font-mono shrink-0">
          <span class="flex items-center gap-1 text-trae-text-secondary">
            <svg class="w-3.5 h-3.5 text-trae-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            {{ formatNumber(currentProject.views) }}
          </span>
          <span class="flex items-center gap-1 text-trae-text-secondary">
            <svg class="w-3.5 h-3.5 text-trae-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            {{ currentProject.likes }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProjectStore } from '@/stores/projectStore'
import ImmersivePlayer from '@/components/ImmersivePlayer.vue'

const store = useProjectStore()
const loading = ref(true)
const error = ref(false)

const playOrder = ref([])
const currentIndex = ref(0)

const currentProject = computed(() => {
  if (playOrder.value.length === 0) return null
  const idx = playOrder.value[currentIndex.value]
  return store.immersiveProjects[idx] || null
})

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function goNext() {
  if (playOrder.value.length === 0) return
  currentIndex.value = (currentIndex.value + 1) % playOrder.value.length
}

function goPrev() {
  if (playOrder.value.length === 0) return
  currentIndex.value = (currentIndex.value - 1 + playOrder.value.length) % playOrder.value.length
}

function formatNumber(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n || 0
}

async function init() {
  loading.value = true
  error.value = false
  try {
    await store.loadAllPagesForImmersive()
    if (store.immersiveProjects.length === 0) {
      playOrder.value = []
    } else {
      playOrder.value = shuffleArray([...Array(store.immersiveProjects.length).keys()])
      currentIndex.value = 0
    }
  } catch (e) {
    console.error('Failed to load immersive data:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(init)
</script>
