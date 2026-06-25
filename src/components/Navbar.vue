<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-8 transition-all duration-300"
    :class="scrolled ? 'bg-trae-bg/85 backdrop-blur-xl border-b border-white/5' : 'bg-trae-bg/55 backdrop-blur-md'"
  >
    <router-link to="/" class="flex items-center gap-2.5 no-underline min-w-0">
      <img :src="logoUrl" alt="TRAE" class="w-7 h-7 shrink-0" />
      <span class="text-trae-text font-bold text-base tracking-wide whitespace-nowrap flex items-center">
        <span class="typewriter-base">TRAE</span>
        <span
          class="typewriter-insert"
          :class="{ 'typewriter-visible': showInsert }"
        >{{ insertText }}</span>
        <span class="typewriter-base"> Demo Wall</span>
        <span class="typewriter-cursor" :class="{ 'typewriter-cursor-blink': cursorBlink }"></span>
      </span>
    </router-link>

    <div class="flex items-center gap-2">
      <router-link
        to="/"
        class="nav-glass-btn"
        active-class="!text-trae-text bg-white/10 border-white/20"
      >
        首页
      </router-link>
      <a
        href="https://trae-idea-incubator.netlify.app/"
        target="_blank"
        rel="noopener"
        class="nav-glass-btn"
      >
        灵感孵化舱
      </a>
      <a
        href="https://luoqianshi.github.io/TRAE-AI-Creativity-Competition-Idea-Hall/"
        target="_blank"
        rel="noopener"
        class="nav-glass-btn"
      >
        TRAE Idea Hall
      </a>
    </div>
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
.typewriter-insert {
  display: inline;
  color: #22c55e;
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

.nav-glass-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-glass-btn:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
}
</style>
