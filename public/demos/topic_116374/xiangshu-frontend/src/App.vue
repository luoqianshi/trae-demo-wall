<script setup>
import { onMounted } from 'vue'
import TheHeader from '@/components/TheHeader.vue'
import TheFooter from '@/components/TheFooter.vue'
import Toast from '@/components/Toast.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useUserStore } from '@/store/userStore'

// 应用根组件：承载布局骨架与全局浮层（Toast/Loading）
const userStore = useUserStore()

// 启动时从 localStorage 恢复登录状态
onMounted(() => {
  userStore.restore()
})
</script>

<template>
  <div class="app-shell">
    <!-- 顶部导航 -->
    <TheHeader />

    <!-- 路由出口：带过渡动画 -->
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 页脚 -->
    <TheFooter />

    <!-- 全局浮层 -->
    <Toast />
    <LoadingSpinner />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1;
}

/* 路由切换淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
