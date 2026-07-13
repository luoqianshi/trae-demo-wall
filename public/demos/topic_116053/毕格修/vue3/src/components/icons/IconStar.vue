<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" :width="size" :height="size" fill="none">
    <path fill="#9b965f" stroke="#3b352b" stroke-width="1" d="M18 3l4 11h12l-9.5 7 3.5 11.5L18 26l-10 6.5L11.5 21 2 14h12L18 3z"/>
    <circle cx="18" cy="18" r="4" fill="#FFF" opacity="0.4"/>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 36 }
})
</script>
