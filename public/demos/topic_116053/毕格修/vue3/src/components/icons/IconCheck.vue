<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" :width="size" :height="size" fill="none">
    <circle cx="18" cy="18" r="15" fill="#eae6db" stroke="#3b352b" stroke-width="1.5"/>
    <circle cx="18" cy="18" r="12" fill="#3b352b" opacity="0.15"/>
    <path fill="none" stroke="#3b352b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M10 19l5 5 11-11"/>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 36 }
})
</script>
