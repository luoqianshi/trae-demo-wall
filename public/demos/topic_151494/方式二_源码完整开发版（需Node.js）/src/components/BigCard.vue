<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
  icon?: string
}>()
defineSlots()
</script>

<template>
  <div class="elder-card p-8 md:p-10 w-full">
    <div v-if="title" class="flex items-center gap-4 mb-8">
      <span v-if="icon" class="emoji-icon text-5xl">{{ icon }}</span>
      <div>
        <h2 class="text-elder-xl font-bold text-elder-ink">{{ title }}</h2>
        <p v-if="subtitle" class="text-elder-xs text-elder-muted mt-2 leading-8">{{ subtitle }}</p>
      </div>
    </div>
    <slot />
  </div>
</template>
