<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" :width="size" :height="size" fill="none">
    <path fill="#3b352b" opacity="0.1" d="M18 2C9 2 4 9 4 16c0 8 5 14 14 14s14-6 14-14c0-7-5-14-14-14z"/>
    <path fill="none" stroke="#3b352b" stroke-width="1.5" stroke-linecap="round" d="M12 18l3-10 3 10"/>
    <circle cx="15" cy="11" r="1.5" fill="#3b352b"/>
    <path fill="none" stroke="#3b352b" stroke-width="1.5" stroke-linecap="round" d="M8 22c2 3 4 4 7 4h6c3 0 5-1 7-4"/>
    <path fill="#9b965f" opacity="0.5" d="M24 18l2-6 2 6"/>
    <circle cx="26" cy="14" r="1" fill="#3b352b"/>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 36 }
})
</script>
