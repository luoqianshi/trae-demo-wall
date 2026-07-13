<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" :width="size" :height="size" fill="none">
    <path fill="#eae6db" stroke="#3b352b" stroke-width="1.5" d="M10 14l-6 6c-1 1-1 2.5 0 3.5l8 8c1 1 2.5 1 3.5 0l6-6"/>
    <path fill="#3b352b" d="M26 8l4-4 2 2-4 4z"/>
    <path fill="#9b965f" d="M22 12l6-6 2 2-6 6z" opacity="0.6"/>
    <rect x="14" y="16" width="14" height="4" rx="1" fill="#3b352b" transform="rotate(45 21 18)"/>
    <circle cx="10" cy="26" r="2" fill="#FFF" stroke="#3b352b" stroke-width="1"/>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 36 }
})
</script>
