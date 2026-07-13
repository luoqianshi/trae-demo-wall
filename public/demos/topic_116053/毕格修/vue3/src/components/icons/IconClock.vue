<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" :width="size" :height="size" fill="none">
    <circle cx="18" cy="18" r="15" fill="#eae6db" stroke="#3b352b" stroke-width="1.5"/>
    <circle cx="18" cy="18" r="12" fill="#FFF" opacity="0.5"/>
    <path fill="none" stroke="#3b352b" stroke-width="2.5" stroke-linecap="round" d="M18 10v8l5 3"/>
    <circle cx="18" cy="18" r="2" fill="#3b352b"/>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 36 }
})
</script>
