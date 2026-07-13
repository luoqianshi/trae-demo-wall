<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" :width="size" :height="size" fill="none">
    <path fill="#9b965f" stroke="#3b352b" stroke-width="1.5" d="M18 4c-5 0-9 4-9 9 0 4 2 7 4 9v3h10v-3c2-2 4-5 4-9 0-5-4-9-9-9z"/>
    <path fill="none" stroke="#3b352b" stroke-width="1.5" stroke-linecap="round" d="M14 28h8"/>
    <path fill="none" stroke="#3b352b" stroke-width="1.5" stroke-linecap="round" d="M15.5 31h5"/>
    <path fill="#FFF" opacity="0.6" d="M18 8c-2.5 0-4.5 2-4.5 4.5"/>
    <line x1="18" y1="4" x2="18" y2="2" stroke="#3b352b" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="26" y1="6" x2="27.5" y2="4.5" stroke="#3b352b" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="10" y1="6" x2="8.5" y2="4.5" stroke="#3b352b" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 36 }
})
</script>
