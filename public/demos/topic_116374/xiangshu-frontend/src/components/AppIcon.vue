<script setup>
// 统一图标组件：基于 Iconify Web Component
// 用法：<Icon icon="lucide:home" size="20" color="var(--primary)" />
defineProps({
  icon: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
  color: { type: String, default: 'currentColor' },
  flip: { type: String, default: '' }
})
</script>

<template>
  <iconify-icon
    :icon="icon"
    :width="size"
    :height="size"
    :color="color"
    :flip="flip"
    style="vertical-align: -0.15em; display: inline-flex;"
  />
</template>
