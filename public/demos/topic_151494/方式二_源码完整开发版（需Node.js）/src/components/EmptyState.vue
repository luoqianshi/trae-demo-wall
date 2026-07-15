<script setup lang="ts">
defineProps<{
  icon?: string
  text?: string
  subtext?: string
}>()
</script>

<template>
  <div class="elder-card p-14 text-center w-full">
    <div class="emoji-icon text-8xl mb-6 opacity-60">{{ icon || '🗂️' }}</div>
    <div class="text-elder-lg font-semibold text-elder-ink mb-3">
      {{ text || '这里还没有内容哦' }}
    </div>
    <p v-if="subtext" class="text-elder-sm text-elder-muted max-w-lg mx-auto leading-10 mt-2">
      {{ subtext }}
    </p>
  </div>
</template>
