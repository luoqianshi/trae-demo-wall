<script setup lang="ts">
import { useEmojiStore } from '@/stores/emojiStore'
import type { EmojiItem } from '@/utils/db'

const emojiStore = useEmojiStore()

const handleDelete = (id: string) => {
  emojiStore.removeEmoji(id)
}

const handleSelect = (emoji: EmojiItem) => {
  emojiStore.selectEmoji(emoji)
}


</script>

<template>
  <div class="w-full h-full bg-gray-800 rounded-lg p-4">
    <div class="flex items-center justify-between mb-3">
      <span class="text-white text-sm font-medium">表情匹配</span>
      <span class="text-gray-400 text-xs">Top 5</span>
    </div>
    <div class="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      <TransitionGroup name="list">
        <div
          v-for="match in emojiStore.topMatches"
          :key="match.emoji.id"
          @click="handleSelect(match.emoji)"
          class="relative flex-shrink-0 w-20 bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
          :class="{ 'ring-2 ring-blue-500': emojiStore.selectedEmoji?.id === match.emoji.id }"
        >
          <img
            :src="match.emoji.dataURL"
            :alt="match.emoji.name"
            class="w-full h-16 object-cover"
          />
          <div class="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 flex items-center justify-between">
            <span class="text-white text-[10px] truncate">{{ match.emoji.name }}</span>
            <span class="text-green-400 text-[10px] font-medium">{{ Math.round(match.similarity * 100) }}%</span>
          </div>
          <button
            @click.stop="handleDelete(match.emoji.id)"
            class="absolute top-0 right-0 w-5 h-5 bg-red-500 hover:bg-red-600 text-white text-xs flex items-center justify-center rounded-bl-lg transition-colors"
          >
            ×
          </button>
        </div>
      </TransitionGroup>
      <div v-if="emojiStore.topMatches.length === 0" class="flex-shrink-0 w-full text-center text-gray-500 py-8">
        暂无本地表情，请点击上传添加
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>