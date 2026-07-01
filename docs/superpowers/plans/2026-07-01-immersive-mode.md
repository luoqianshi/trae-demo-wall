# 纯享模式 (Immersive Mode) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an immersive "pure enjoyment" mode where users can randomly browse all deployed web projects in a full-screen iframe player with prev/next navigation.

**Architecture:** New Vue route `/immersive` with two new components: `ImmersiveView.vue` (page container managing data + playback state) and `ImmersivePlayer.vue` (iframe player with keyboard shortcuts and fallback). Store gains a batch-loading method to pre-fetch all page data.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), Vue Router 4 (Hash mode), Pinia 3, TailwindCSS 3.4

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/router/index.js` | Add `/immersive` route |
| Modify | `src/components/HeroSection.vue` | Add "纯享模式" entry button before "灵感孵化舱" |
| Modify | `src/stores/projectStore.js` | Add `immersiveProjects`, `immersiveLoaded`, `loadAllPagesForImmersive()` |
| Create | `src/components/ImmersivePlayer.vue` | iframe player with loading, fallback, keyboard shortcuts |
| Create | `src/views/ImmersiveView.vue` | Page container: data loading, playback state, top nav, bottom info |

---

### Task 1: Add `/immersive` route

**Files:**
- Modify: `src/router/index.js`

- [ ] **Step 1: Add the immersive route**

Edit `src/router/index.js`. Add a new route entry after the `detail` route (after line 13, before the closing `]`):

```js
  {
    path: '/immersive',
    name: 'immersive',
    component: () => import('@/views/ImmersiveView.vue'),
  },
```

The full file should look like:

```js
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/project/:id',
    name: 'detail',
    component: () => import('@/views/DetailView.vue'),
  },
  {
    path: '/immersive',
    name: 'immersive',
    component: () => import('@/views/ImmersiveView.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
```

- [ ] **Step 2: Commit**

```bash
cd /workspace/trae-demo-wall && git add src/router/index.js && git commit -m "feat: add /immersive route"
```

---

### Task 2: Add "纯享模式" entry button in HeroSection

**Files:**
- Modify: `src/components/HeroSection.vue`

- [ ] **Step 1: Add the button before "灵感孵化舱"**

In `src/components/HeroSection.vue`, find the `<div class="flex flex-wrap items-center gap-3">` block (line 30). Insert a new `<router-link>` before the existing "灵感孵化舱" `<a>` tag:

```html
            <router-link
              :to="{ name: 'immersive' }"
              class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-trae-pill bg-trae-accent text-trae-bg text-sm font-bold border border-trae-accent shadow-trae-glow hover:bg-trae-accent-deep hover:shadow-trae-glow-strong transition-all duration-200"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              纯享模式
            </router-link>
```

The button uses `bg-trae-accent` (green) + `text-trae-bg` (dark text on green) + `shadow-trae-glow` for a more prominent look than the glass-morphism style of the other buttons.

- [ ] **Step 2: Commit**

```bash
cd /workspace/trae-demo-wall && git add src/components/HeroSection.vue && git commit -m "feat: add immersive mode entry button in HeroSection"
```

---

### Task 3: Add store methods for immersive data loading

**Files:**
- Modify: `src/stores/projectStore.js`

- [ ] **Step 1: Add state fields**

In `src/stores/projectStore.js`, add two new state fields after `isAllLoaded: false,` (line 16):

```js
    immersiveProjects: [],
    immersiveLoaded: false,
```

- [ ] **Step 2: Add `loadAllPagesForImmersive()` action**

Add this new action method at the end of the `actions` object, after `resetVisible()` (after line 151, before the closing `}`):

```js
    async loadAllPagesForImmersive() {
      if (this.immersiveLoaded) return
      if (!this.indexData) await this.loadIndex()
      if (!this.indexData) return

      const totalPages = this.indexData.totalPages
      const allProjects = []

      // Batch load: 6 pages at a time
      const batchSize = 6
      for (let start = 1; start <= totalPages; start += batchSize) {
        const batch = []
        for (let p = start; p < start + batchSize && p <= totalPages; p++) {
          const v = Date.now()
          batch.push(
            fetch(`./data/pages/page-${p}.json?v=${v}`)
              .then(r => r.json())
              .then(data => data.projects || [])
              .catch(() => [])
          )
        }
        const results = await Promise.all(batch)
        for (const projects of results) {
          allProjects.push(...projects)
        }
      }

      // Filter: only projects with a previewable URL
      this.immersiveProjects = allProjects.filter(p => {
        if (p.type === 'external' && p.demoUrl) return true
        if (p.type === 'local' && p.localPath) return true
        return false
      })
      this.immersiveLoaded = true
    },
```

- [ ] **Step 3: Commit**

```bash
cd /workspace/trae-demo-wall && git add src/stores/projectStore.js && git commit -m "feat: add loadAllPagesForImmersive to projectStore"
```

---

### Task 4: Create ImmersivePlayer.vue

**Files:**
- Create: `src/components/ImmersivePlayer.vue`

- [ ] **Step 1: Create the component**

Create `src/components/ImmersivePlayer.vue` with the following content:

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
```

- [ ] **Step 2: Commit**

```bash
cd /workspace/trae-demo-wall && git add src/components/ImmersivePlayer.vue && git commit -m "feat: create ImmersivePlayer component"
```

---

### Task 5: Create ImmersiveView.vue

**Files:**
- Create: `src/views/ImmersiveView.vue`

- [ ] **Step 1: Create the view**

Create `src/views/ImmersiveView.vue` with the following content:

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
```

- [ ] **Step 2: Commit**

```bash
cd /workspace/trae-demo-wall && git add src/views/ImmersiveView.vue && git commit -m "feat: create ImmersiveView page with playback state and navigation"
```

---

### Task 6: Build and verify

**Files:**
- No new files

- [ ] **Step 1: Build the project**

```bash
cd /workspace/trae-demo-wall && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Verify build output**

```bash
cd /workspace/trae-demo-wall && python3 -c "import json; d=json.load(open('dist/data/index.json')); print(f'totalProjects={d[\"totalProjects\"]}, totalPages={d[\"totalPages\"]}')"
```

Expected: Prints project count matching the source data.

- [ ] **Step 3: Commit and push**

```bash
cd /workspace/trae-demo-wall && git add -A && git commit -m "feat: immersive mode (pure enjoyment) - random project player" && git push origin main
```
