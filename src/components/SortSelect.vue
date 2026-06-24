<template>
  <div class="flex items-center gap-2">
    <span class="text-trae-text-muted text-sm">排序</span>
    <select
      class="trae-input !w-auto !py-2 !px-3 text-sm cursor-pointer"
      :value="store.sortBy"
      @change="(e) => store.setSort(e.target.value)"
    >
      <option value="newest">最新发布</option>
      <option value="views">最多浏览</option>
      <option value="likes">最多点赞</option>
    </select>
  </div>
</template>

<script setup>
import { useProjectStore } from '@/stores/projectStore'
const store = useProjectStore()
</script>
