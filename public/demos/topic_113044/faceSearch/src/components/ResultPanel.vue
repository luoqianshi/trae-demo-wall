<script setup lang="ts">
import { computed } from 'vue'
import { useEmojiStore } from '@/stores/emojiStore'
import EmojiList from './EmojiList.vue'

const emojiStore = useEmojiStore()

const displayEmoji = computed(() => {
  return emojiStore.selectedEmoji || (emojiStore.bestMatch?.emoji || null)
})

const displaySimilarity = computed(() => {
  if (emojiStore.selectedEmoji) {
    const match = emojiStore.topMatches.find((m) => m.emoji.id === emojiStore.selectedEmoji!.id)
    return match ? Math.round(match.similarity * 100) : 0
  }
  return emojiStore.bestMatch ? Math.round(emojiStore.bestMatch.similarity * 100) : 0
})
</script>

<template>
  <div class="w-full h-full flex flex-col gap-4">
    <div class="flex-1 bg-gray-800 rounded-lg p-4 flex items-center justify-center">
      <Transition name="fade" mode="out-in">
        <div v-if="displayEmoji" key="emoji" class="text-center">
          <div class="relative inline-block">
            <img
              :src="displayEmoji.dataURL"
              :alt="displayEmoji.name"
              class="max-w-full max-h-72 object-contain rounded-lg"
            />
            <div 
              v-if="!emojiStore.selectedEmoji && emojiStore.isDetecting"
              class="absolute top-2 right-2 bg-green-500/90 text-white text-sm px-2 py-1 rounded-full font-medium"
            >
              {{ displaySimilarity }}%
            </div>
          </div>
          <div class="text-white text-xl font-medium mt-4">{{ displayEmoji.name }}</div>
          <div class="text-gray-400 text-sm mt-1">
            {{ displayEmoji.fileType.toUpperCase() }}
            <span v-if="emojiStore.isDetecting && displayEmoji.featureVector">
              · 匹配度: {{ displaySimilarity }}%
            </span>
          </div>
        </div>
        <div v-else key="empty" class="text-center">
          <svg class="w-24 h-24 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
          <p class="text-gray-500">点击下方表情查看详情</p>
          <p class="text-gray-600 text-sm mt-2">或开启摄像头进行实时匹配</p>
        </div>
      </Transition>
    </div>
    <div class="h-36">
      <EmojiList />
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>