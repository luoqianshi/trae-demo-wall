<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="tag in store.tags"
      :key="tag"
      class="tag-pill"
      :class="{ active: store.currentTag === tag }"
      @click="store.setTag(tag)"
    >
      {{ tag }}
    </button>
  </div>
</template>

<script setup>
import { useProjectStore } from '@/stores/projectStore'
const store = useProjectStore()
</script>
