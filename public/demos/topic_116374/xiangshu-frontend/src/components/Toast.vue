<script setup>
import { useUiStore } from '@/store/uiStore'

// 全局 Toast 容器：从 uiStore 读取队列渲染
const uiStore = useUiStore()
</script>

<template>
  <div class="toast-wrap">
    <transition-group name="toast">
      <div
        v-for="t in uiStore.toasts"
        :key="t.id"
        class="toast"
        :class="{ err: t.type === 'err' }"
        @click="uiStore.removeToast(t.id)"
      >
        <span class="icon">{{ t.type === 'err' ? '⚠' : '✓' }}</span>
        <span class="msg">{{ t.msg }}</span>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-wrap {
  position: fixed;
  top: 90px;
  right: 24px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  background: var(--bg);
  border-radius: 10px;
  padding: 14px 20px;
  box-shadow: var(--shadow-lift);
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 240px;
  max-width: 360px;
  border-left: 4px solid var(--moss);
  pointer-events: auto;
  cursor: pointer;
}

.toast.err {
  border-left-color: var(--seal);
}

.icon {
  font-size: 20px;
}

.msg {
  font-size: 14px;
  color: var(--text);
  font-weight: 500;
}

.toast-enter-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-leave-active {
  transition: all 0.3s ease;
  position: absolute;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

.toast-move {
  transition: transform 0.3s ease;
}

@media (max-width: 480px) {
  .toast-wrap {
    top: 80px;
    right: 12px;
    left: 12px;
  }

  .toast {
    min-width: 0;
    width: 100%;
  }
}
</style>
