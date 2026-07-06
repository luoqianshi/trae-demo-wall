<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-8 transition-all duration-300"
    :class="scrolled ? 'glass-nav-scrolled' : 'glass-nav-top'"
  >
    <router-link to="/" class="flex items-center gap-2.5 no-underline min-w-0">
      <img :src="logoUrl" alt="TRAE" class="w-7 h-7 shrink-0" />
      <span class="text-trae-text font-bold text-base tracking-wide whitespace-nowrap flex items-center" style="font-family: var(--font-display);">
        <span class="typewriter-base">TRAE</span>
        <span
          class="typewriter-insert"
          :class="{ 'typewriter-visible': showInsert }"
        >{{ insertText }}</span>
        <span class="typewriter-cursor" :class="{ 'typewriter-cursor-blink': cursorBlink }"></span>
        <span class="typewriter-base"> Demo Wall</span>
      </span>
    </router-link>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import logoUrl from '@/assets/trae-black.png'

const scrolled = ref(false)
const showInsert = ref(false)
const insertText = ref('')
const cursorBlink = ref(true)

const FULL_INSERT = ' AI Creativity Competition'
const TYPE_SPEED = 80
const DELETE_SPEED = 40
const PAUSE_FULL = 5000
const PAUSE_EMPTY = 5000

let animTimer = null

function typeNext() {
  if (insertText.value.length < FULL_INSERT.length) {
    insertText.value = FULL_INSERT.slice(0, insertText.value.length + 1)
    animTimer = setTimeout(typeNext, TYPE_SPEED)
  } else {
    showInsert.value = true
    animTimer = setTimeout(startDelete, PAUSE_FULL)
  }
}

function deleteNext() {
  if (insertText.value.length > 0) {
    insertText.value = insertText.value.slice(0, -1)
    animTimer = setTimeout(deleteNext, DELETE_SPEED)
  } else {
    showInsert.value = false
    animTimer = setTimeout(startType, PAUSE_EMPTY)
  }
}

function startType() {
  showInsert.value = true
  typeNext()
}

function startDelete() {
  deleteNext()
}

function startAnimation() {
  showInsert.value = true
  typeNext()
}

function stopAnimation() {
  if (animTimer) {
    clearTimeout(animTimer)
    animTimer = null
  }
}

function onScroll() {
  scrolled.value = window.scrollY > 50
}

onMounted(() => {
  window.addEventListener('scroll', onScroll)
  startAnimation()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  stopAnimation()
})
</script>

<style scoped>
.glass-nav-top {
  background: rgba(10, 15, 13, 0.4);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid transparent;
}

.glass-nav-scrolled {
  background: rgba(10, 15, 13, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid;
  border-image: linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.15), transparent) 1;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
}

.typewriter-insert {
  display: inline;
  color: #34d399;
  opacity: 1;
}

.typewriter-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: currentColor;
  margin-left: 1px;
  vertical-align: text-bottom;
}

.typewriter-cursor-blink {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
