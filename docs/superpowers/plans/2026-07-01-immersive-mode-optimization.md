# 纯享模式优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize immersive mode with lazy loading + history backtracking, simplified bottom bar, and beautiful fallback preview cards.

**Architecture:** Replace full pre-load with on-demand single-project loading via existing `getProjectDetail()`. Maintain a history stack for back/forward navigation. Fallback shows thumbnail + title + author + description card instead of plain error text.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), Pinia 3, TailwindCSS 3.4

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/stores/projectStore.js` | Remove `immersiveProjects`/`immersiveLoaded`/`loadAllPagesForImmersive()` |
| Modify | `src/components/ImmersivePlayer.vue` | Replace plain fallback with beautiful preview card |
| Modify | `src/views/ImmersiveView.vue` | Replace full-load with lazy load + history stack; simplify bottom bar |

---

### Task 1: Clean up store - remove immersive full-load

**Files:**
- Modify: `src/stores/projectStore.js`

- [ ] **Step 1: Remove immersive state and method**

In `src/stores/projectStore.js`:

1. In `state()`, remove these two lines (after `isAllLoaded: false,`):
```js
    immersiveProjects: [],
    immersiveLoaded: false,
```

2. In `actions`, remove the entire `loadAllPagesForImmersive()` method (the block starting with `async loadAllPagesForImmersive() {` and ending with `this.immersiveLoaded = true\n    },`).

The store should still have `loadIndex()`, `loadPage()`, `getProjectDetail()`, and all other existing methods intact.

- [ ] **Step 2: Commit**

```bash
cd /workspace/trae-demo-wall && git add src/stores/projectStore.js && git commit -m "refactor: remove immersive full-load from store, use lazy getProjectDetail instead"
```

---

### Task 2: Rewrite ImmersivePlayer.vue with beautiful fallback card

**Files:**
- Modify: `src/components/ImmersivePlayer.vue`

- [ ] **Step 1: Replace the entire file content**

Overwrite `src/components/ImmersivePlayer.vue` with:

```vue
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
```

- [ ] **Step 2: Commit**

```bash
cd /workspace/trae-demo-wall && git add src/components/ImmersivePlayer.vue && git commit -m "feat: beautiful fallback preview card with thumbnail + title + description"
```

---

### Task 3: Rewrite ImmersiveView.vue with lazy load + history + simplified bottom bar

**Files:**
- Modify: `src/views/ImmersiveView.vue`

- [ ] **Step 1: Replace the entire file content**

Overwrite `src/views/ImmersiveView.vue` with:

```vue
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
```

- [ ] **Step 2: Commit**

```bash
cd /workspace/trae-demo-wall && git add src/views/ImmersiveView.vue && git commit -m "feat: lazy load + history backtracking, simplified bottom bar"
```

---

### Task 4: Build and verify

**Files:**
- No new files

- [ ] **Step 1: Build the project**

```bash
cd /workspace/trae-demo-wall && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Commit and push**

```bash
cd /workspace/trae-demo-wall && git add -A && git commit -m "feat: immersive mode optimization - lazy load, simplified UI, beautiful fallback" && git push origin main
```
