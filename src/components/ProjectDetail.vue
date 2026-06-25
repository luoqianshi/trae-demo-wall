<template>
  <div v-if="project" class="space-y-6">
    <nav class="flex items-center gap-2 text-sm text-trae-text-muted font-mono">
      <router-link to="/" class="hover:text-trae-accent transition-colors no-underline text-trae-text-muted">首页</router-link>
      <span>/</span>
      <span>{{ project.tags?.[0] || '未分类' }}</span>
      <span>/</span>
      <span class="text-trae-text-secondary truncate max-w-[200px]">{{ project.title }}</span>
    </nav>

    <div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
      <div>
        <div class="relative rounded-trae-card overflow-hidden border border-trae-border">
          <iframe
            v-if="previewUrl"
            :src="previewUrl"
            class="w-full aspect-video bg-trae-bg"
            sandbox="allow-scripts allow-same-origin allow-popups"
            loading="lazy"
          />
          <div v-else class="w-full aspect-video bg-trae-card grid place-items-center">
            <p class="text-trae-text-muted">暂无可预览内容</p>
          </div>
        </div>
        <div class="mt-3 flex justify-end gap-2">
          <a
            v-if="project.localPath"
            :href="project.localPath"
            target="_blank"
            rel="noopener"
            class="btn-secondary !py-2 !px-4 !text-xs"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            全屏查看
          </a>
          <a
            v-if="project.demoUrl"
            :href="project.demoUrl"
            target="_blank"
            rel="noopener"
            class="btn-secondary !py-2 !px-4 !text-xs"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            在新窗口中打开
          </a>
        </div>
      </div>

      <div class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-trae-text mb-2">{{ project.title }}</h1>
          <div class="flex items-center gap-3 text-sm text-trae-text-secondary">
            <span class="font-medium">{{ project.author }}</span>
            <span class="text-trae-border">·</span>
            <span>{{ formatDate(project.createdAt) }}</span>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <span v-for="tag in project.tags" :key="tag" class="tag-pill !cursor-default">{{ tag }}</span>
        </div>

        <div class="flex items-center gap-6 text-sm font-mono">
          <span class="flex items-center gap-1.5 text-trae-text-secondary">
            <svg class="w-4 h-4 text-trae-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            {{ project.views }}
          </span>
          <span class="flex items-center gap-1.5 text-trae-text-secondary">
            <svg class="w-4 h-4 text-trae-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            {{ project.likes }}
          </span>
        </div>

        <div>
          <h3 class="text-sm font-semibold text-trae-text mb-2">作品描述</h3>
          <p class="text-sm text-trae-text-secondary leading-relaxed">{{ project.description || '暂无描述' }}</p>
        </div>

        <div v-if="project.screenshots?.length">
          <h3 class="text-sm font-semibold text-trae-text mb-2">截图</h3>
          <div class="grid grid-cols-2 gap-2">
            <img
              v-for="(src, i) in project.screenshots"
              :key="i"
              :src="src"
              :alt="`截图 ${i + 1}`"
              loading="lazy"
              class="rounded-lg border border-trae-border w-full aspect-video object-cover"
            />
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <a :href="project.forumUrl" target="_blank" rel="noopener" class="btn-primary !text-sm">
            查看原帖
          </a>
          <a v-if="project.demoUrl" :href="project.demoUrl" target="_blank" rel="noopener" class="btn-secondary !text-sm">
            体验作品
          </a>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-20">
    <p class="text-trae-text-muted animate-pulse">加载中...</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useProjectStore } from '@/stores/projectStore'

const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
})

const store = useProjectStore()
const project = ref(null)

const previewUrl = computed(() => {
  if (!project.value) return null
  if (project.value.demoUrl) return project.value.demoUrl
  if (project.value.localPath) return project.value.localPath
  return null
})

async function loadProject() {
  project.value = null
  const detail = await store.getProjectDetail(props.projectId)
  if (detail) {
    project.value = detail
  }
}

onMounted(loadProject)
watch(() => props.projectId, loadProject)

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>
