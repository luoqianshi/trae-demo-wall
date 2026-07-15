<script setup lang="ts">
import { computed, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import AppHeader from '@/components/AppHeader.vue'
import ModeBanner from '@/components/ModeBanner.vue'

const settings = useSettingsStore()

const scaleStyle = computed(() => ({
  fontSize: `${settings.fontSizeScale * 100}%`
}))

watch(() => settings.settings.currentMode, () => {}, { immediate: true })
</script>

<template>
  <div class="min-h-screen bg-elder-cream" :style="scaleStyle">
    <ModeBanner />
    <AppHeader />
    <main>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="mt-16 pt-10 pb-8 text-center border-t border-orange-100 bg-gradient-to-b from-transparent to-orange-50/50">
      <div class="text-elder-xs text-elder-muted leading-8 max-w-[900px] mx-auto px-6">
        <p class="mb-2">
          <span class="emoji-icon text-2xl">🧡</span>
          <span class="mx-2 font-semibold text-elder-ink">银龄AI助手「小银」</span>
          · 银发抖音简易助手
        </p>
        <p>贴合国家数字适老助老政策 · AI数字伙伴 · 为2.8亿中老年群体提供更友好的短视频服务</p>
        <p class="mt-2 opacity-70">
          本项目基于 Trae IDE 全栈开发 · 纯前端网页小程序 · 无需下载安装
        </p>
      </div>
    </footer>
  </div>
</template>
