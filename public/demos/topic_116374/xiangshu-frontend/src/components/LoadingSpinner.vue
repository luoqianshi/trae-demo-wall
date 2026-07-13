<script setup>
import { useUiStore } from '@/store/uiStore'

// 全局 Loading 遮罩：从 uiStore 读取 loading 状态
const uiStore = useUiStore()
</script>

<template>
  <transition name="fade">
    <div v-if="uiStore.loading" class="loading-mask">
      <div class="loading-box">
        <div class="spinner">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p>{{ uiStore.loadingText || '加载中…' }}</p>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.loading-mask {
  position: fixed;
  inset: 0;
  background: rgba(250, 246, 239, 0.7);
  backdrop-filter: blur(3px);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-box {
  text-align: center;
  color: var(--primary-deep);
}

.spinner {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 14px;
}

.spinner span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary);
  animation: bounce 1.2s ease-in-out infinite;
}

.spinner span:nth-child(2) {
  background: var(--seal);
  animation-delay: 0.2s;
}

.spinner span:nth-child(3) {
  background: var(--moss);
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  40% {
    transform: translateY(-12px);
    opacity: 1;
  }
}

.loading-box p {
  font-family: var(--font-sub);
  letter-spacing: 2px;
  font-size: 14px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
