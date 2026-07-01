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
        已浏览 {{ history.length }} 个
      </span>
      <span class="text-trae-text-secondary text-sm truncate max-w-[300px]">
        {{ currentProject?.title || '' }}
      </span>
    </nav>

    <!-- Main content -->
    <div class="flex-1 flex items-center justify-center p-4 overflow-hidden">
      <!-- Loading state (initial) -->
      <div v-if="loading" class="flex flex-col items-center gap-4">
        <svg class="w-12 h-12 text-trae-accent animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p class="text-trae-text-muted">正在加载...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="flex flex-col items-center gap-4">
        <p class="text-trae-text-muted">加载失败</p>
        <button @click="init" class="btn-primary !text-sm">重试</button>
      </div>

      <!-- Empty state -->
      <div v-else-if="!currentProject" class="flex flex-col items-center gap-4">
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

    <!-- Bottom bar (simplified: 3 buttons only) -->
    <div
      v-if="!loading && !error && currentProject"
      class="shrink-0 bg-trae-card/80 backdrop-blur-md border-t border-trae-border py-4"
    >
      <div class="flex justify-center gap-3">
        <button
          @click="goPrev"
          :disabled="historyIndex === 0"
          class="flex items-center gap-1.5 px-4 py-2 rounded-trae-pill bg-white/5 text-white/80 text-sm border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
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

// History stack for back/forward navigation
const history = ref([])      // Array of full project objects
const historyIndex = ref(-1) // Pointer into history
const seenIds = ref(new Set()) // Track viewed project IDs

const currentProject = computed(() => {
  if (historyIndex.value < 0 || historyIndex.value >= history.value.length) return null
  return history.value[historyIndex.value]
})

function getRandomUnseenIndex() {
  if (!store.allProjects || store.allProjects.length === 0) return -1
  // Build list of unseen indices
  const unseen = []
  for (let i = 0; i < store.allProjects.length; i++) {
    if (!seenIds.value.has(store.allProjects[i].id)) {
      unseen.push(i)
    }
  }
  // All seen? Reset and allow re-viewing
  if (unseen.length === 0) {
    seenIds.value = new Set()
    for (let i = 0; i < store.allProjects.length; i++) unseen.push(i)
  }
  return unseen[Math.floor(Math.random() * unseen.length)]
}

async function loadNextProject() {
  const idx = getRandomUnseenIndex()
  if (idx === -1) return

  const summary = store.allProjects[idx]
  if (!summary) return

  seenIds.value.add(summary.id)

  // Load full project detail (lazy load the page it belongs to)
  const detail = await store.getProjectDetail(summary.id)
  if (detail) {
    // Truncate history if we went back and then forward
    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push(detail)
    historyIndex.value = history.value.length - 1
  }
}

async function goNext() {
  await loadNextProject()
}

function goPrev() {
  if (historyIndex.value > 0) {
    historyIndex.value--
  }
}

async function init() {
  loading.value = true
  error.value = false
  try {
    await store.loadIndex()
    if (!store.allProjects || store.allProjects.length === 0) {
      loading.value = false
      return
    }
    // Load first random project
    await loadNextProject()
  } catch (e) {
    console.error('Failed to init immersive mode:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(init)
</script>
