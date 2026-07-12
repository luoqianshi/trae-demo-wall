<script setup lang="ts">
import { useEmojiStore } from '@/stores/emojiStore'

const emojiStore = useEmojiStore()
</script>

<template>
  <div class="fixed bottom-6 left-6 bg-gray-900/90 rounded-lg p-4 text-xs text-gray-300 border border-gray-700 max-w-xs">
    <div class="flex items-center justify-between mb-3">
      <span class="font-medium">特征向量</span>
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          :checked="emojiStore.isDebugMode"
          @change="emojiStore.toggleDebugMode"
          class="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
        />
        <span>Debug</span>
      </label>
    </div>
    <div class="grid grid-cols-2 gap-x-4 gap-y-1">
      <div class="text-gray-500">smile</div>
      <div class="text-right">{{ emojiStore.featureVector.smile.toFixed(2) }}</div>
      <div class="text-gray-500">mouthOpen</div>
      <div class="text-right">{{ emojiStore.featureVector.mouthOpen.toFixed(2) }}</div>
      <div class="text-gray-500">leftBrow</div>
      <div class="text-right">{{ emojiStore.featureVector.leftBrow.toFixed(2) }}</div>
      <div class="text-gray-500">rightBrow</div>
      <div class="text-right">{{ emojiStore.featureVector.rightBrow.toFixed(2) }}</div>
      <div class="text-gray-500">headTilt</div>
      <div class="text-right">{{ emojiStore.featureVector.headTilt.toFixed(2) }}</div>
      <div class="text-gray-500">bodyTilt</div>
      <div class="text-right">{{ emojiStore.featureVector.bodyTilt.toFixed(2) }}</div>
      <div class="text-gray-500 border-t border-gray-700 pt-1 mt-1">thumb</div>
      <div class="text-right border-t border-gray-700 pt-1 mt-1">{{ emojiStore.featureVector.thumb.toFixed(2) }}</div>
      <div class="text-gray-500">index</div>
      <div class="text-right">{{ emojiStore.featureVector.indexFinger.toFixed(2) }}</div>
      <div class="text-gray-500">middle</div>
      <div class="text-right">{{ emojiStore.featureVector.middleFinger.toFixed(2) }}</div>
      <div class="text-gray-500">ring</div>
      <div class="text-right">{{ emojiStore.featureVector.ringFinger.toFixed(2) }}</div>
      <div class="text-gray-500">pinky</div>
      <div class="text-right">{{ emojiStore.featureVector.pinkyFinger.toFixed(2) }}</div>
    </div>
  </div>
</template>