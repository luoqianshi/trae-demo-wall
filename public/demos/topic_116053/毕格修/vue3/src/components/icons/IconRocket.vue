<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" :width="size" :height="size" fill="none">
    <path fill="#3b352b" d="M18 2C10 2 6 8 6 14c0 6 4 12 6 14l6 6 6-6c2-2 6-8 6-14 0-6-4-12-12-12z"/>
    <path fill="#9b965f" d="M18 6c-4 0-7 3-7 7 0 4 2.5 8 4 10l3 3 3-3c1.5-2 4-6 4-10 0-4-3-7-7-7z"/>
    <circle cx="18" cy="13" r="4" fill="#FFF"/>
    <path fill="#cbc0aa" d="M30 14c0-2-.5-4-1.5-5.5l3-3.5L30 2l-3.5 2.5C25 3 22.5 2.5 20 2.5"/>
    <path fill="#FFF" d="M28 6l-2 2 1 1 2-2z"/>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 36 }
})
</script>
