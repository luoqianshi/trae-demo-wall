<template>
  <section id="projects" class="py-20">
    <div class="max-w-trae-container mx-auto px-8">
      <div class="flex items-baseline gap-4 mb-12">
        <span class="font-mono text-sm text-trae-accent tracking-widest">02</span>
        <h2 class="text-4xl font-bold text-trae-text">
          作品<span class="bg-gradient-to-br from-trae-accent to-[#4ade80] bg-clip-text text-transparent">展示</span>
        </h2>
        <span class="ml-auto font-mono text-sm text-trae-text-muted">
          {{ store.projectCount }} 个作品
        </span>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
        <FilterBar />
        <div class="flex items-center gap-4">
          <SearchBar />
          <SortSelect />
        </div>
      </div>

      <div
        class="grid gap-5"
        style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))"
      >
        <ProjectCard
          v-for="project in store.visibleProjects"
          :key="project.id"
          :project="getMergedProject(project)"
        />
        <SkeletonCard v-for="n in 4" :key="`skeleton-${n}`" v-show="store.isLoading" />
      </div>

      <div ref="sentinelRef" class="h-1"></div>

      <div class="text-center mt-8">
        <p v-if="store.isLoading" class="text-trae-text-muted text-sm font-mono animate-pulse">
          加载中...
        </p>
        <p v-else-if="store.isAllLoaded && store.projectCount > 0" class="text-trae-text-muted text-sm font-mono">
          已展示全部 {{ store.projectCount }} 个作品
        </p>
        <p v-else-if="store.projectCount === 0" class="text-trae-text-muted text-sm">
          没有找到匹配的作品
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted } from 'vue'
import { useProjectStore } from '@/stores/projectStore'
import { useLazyLoad } from '@/composables/useLazyLoad'
import FilterBar from './FilterBar.vue'
import SearchBar from './SearchBar.vue'
import SortSelect from './SortSelect.vue'
import ProjectCard from './ProjectCard.vue'
import SkeletonCard from './SkeletonCard.vue'

const store = useProjectStore()
const { sentinelRef } = useLazyLoad()

onMounted(async () => {
  await store.loadIndex()
  await store.loadPage(1)
})

function getMergedProject(summaryProject) {
  for (const pageNum of store.loadedPages) {
    const projects = store.pageCache[pageNum]
    if (projects) {
      const found = projects.find(p => p.id === summaryProject.id)
      if (found) return found
    }
  }
  return summaryProject
}
</script>
