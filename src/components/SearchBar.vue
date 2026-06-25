<template>
  <div class="relative w-full max-w-xs">
    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-trae-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <input
      type="text"
      class="trae-input pl-10"
      placeholder="搜索作品..."
      :value="store.searchQuery"
      @input="(e) => store.setSearch(e.target.value)"
    />
  </div>
</template>

<script setup>
import { useProjectStore } from '@/stores/projectStore'
const store = useProjectStore()
</script>
