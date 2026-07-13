<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" :width="size" :height="size" fill="none">
    <path fill="#3b352b" d="M18 6L2 14l16 8 16-8-16-8z"/>
    <path fill="#9b965f" d="M18 22L6 16v6c0 4 5.5 8 12 8s12-4 12-8v-6l-12 6z"/>
    <path fill="#FFF" d="M18 14l-10-4 10-4 10 4z" opacity="0.5"/>
    <path fill="none" stroke="#FFF" stroke-width="1.5" d="M18 10v8"/>
    <rect x="9" y="26" width="18" height="2" rx="1" fill="#9b965f" opacity="0.5"/>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 36 }
})
</script>
