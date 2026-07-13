<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" :width="size" :height="size" fill="none">
    <rect x="4" y="16" width="8" height="16" rx="2" fill="#eae6db" stroke="#3b352b" stroke-width="1.5"/>
    <rect x="14" y="10" width="8" height="22" rx="2" fill="#9b965f" opacity="0.4" stroke="#3b352b" stroke-width="1.5"/>
    <rect x="24" y="4" width="8" height="28" rx="2" fill="#3b352b" opacity="0.8" stroke="#3b352b" stroke-width="1.5"/>
    <path fill="none" stroke="#FFF" stroke-width="1.5" stroke-linecap="round" d="M8 24v4M18 20v6M28 14v10"/>
    <path fill="#3b352b" d="M28 2l2 2-2 2-2-2z"/>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 36 }
})
</script>
