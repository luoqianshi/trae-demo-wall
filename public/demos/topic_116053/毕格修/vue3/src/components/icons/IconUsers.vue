<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" :width="size" :height="size" fill="none">
    <circle cx="12" cy="10" r="5" fill="#eae6db" stroke="#3b352b" stroke-width="1.5"/>
    <circle cx="24" cy="10" r="5" fill="#eae6db" stroke="#3b352b" stroke-width="1.5"/>
    <path fill="#9b965f" opacity="0.3" stroke="#3b352b" stroke-width="1" d="M6 28c0-6 4-10 6-10h12c2 0 6 4 6 10"/>
    <circle cx="12" cy="10" r="2" fill="#3b352b"/>
    <circle cx="24" cy="10" r="2" fill="#3b352b"/>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 36 }
})
</script>
