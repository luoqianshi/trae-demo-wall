<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" :width="size" :height="size" fill="none">
    <circle cx="18" cy="18" r="15" fill="#eae6db" stroke="#3b352b" stroke-width="2"/>
    <circle cx="18" cy="18" r="10" fill="#9b965f" opacity="0.3"/>
    <circle cx="18" cy="18" r="6" fill="#3b352b"/>
    <circle cx="18" cy="18" r="3" fill="#FFF"/>
    <path fill="#FFF" d="M18 4v3M18 29v3M4 18h3M29 18h3" stroke="#3b352b" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 36 }
})
</script>
