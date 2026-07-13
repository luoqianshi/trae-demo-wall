<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" :width="size" :height="size" fill="none">
    <path fill="#FFF" stroke="#3b352b" stroke-width="1.5" d="M6 4h16l6 6v22H6V4z"/>
    <path fill="#eae6db" d="M22 4v6h6l-6-6z"/>
    <path fill="none" stroke="#3b352b" stroke-width="1.5" stroke-linecap="round" d="M10 16h14M10 21h14M10 26h10"/>
    <circle cx="28" cy="8" r="1" fill="#3b352b"/>
    <path fill="#9b965f" opacity="0.3" d="M6 12h6v4H6z"/>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 36 }
})
</script>
