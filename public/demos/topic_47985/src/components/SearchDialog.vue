<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, X } from 'lucide-vue-next'

interface Chapter {
  id: string
  title: string
  category: string
  path: string
}

const props = defineProps<{
  chapters: Chapter[]
  onClose: () => void
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const searchQuery = ref('')

// 搜索结果
const results = computed(() => {
  if (!searchQuery.value.trim()) return []
  
  const query = searchQuery.value.toLowerCase()
  return props.chapters.filter(c => 
    c.title.toLowerCase().includes(query) || 
    c.category.toLowerCase().includes(query)
  )
})

function selectChapter(id: string) {
  emit('select', id)
  props.onClose()
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
      <!-- 标题栏 -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div class="flex items-center gap-2">
          <Search class="w-5 h-5 text-orange-500" />
          <h3 class="text-lg font-semibold text-slate-800">搜索章节</h3>
        </div>
        <button 
          @click="props.onClose"
          class="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 搜索输入 -->
      <div class="px-6 py-4">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="输入关键词搜索..."
          class="w-full px-4 py-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          autofocus
        />
      </div>

      <!-- 搜索结果 -->
      <div class="px-6 pb-4 max-h-60 overflow-y-auto">
        <div v-if="results.length === 0" class="text-center text-slate-400 py-4">
          <p class="text-sm">未找到匹配的章节</p>
        </div>
        <div v-else class="space-y-2">
          <button 
            v-for="chapter in results" 
            :key="chapter.id"
            @click="selectChapter(chapter.id)"
            class="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <div>
              <p class="text-sm font-medium text-slate-700">{{ chapter.title }}</p>
              <p class="text-xs text-slate-400">{{ chapter.category }}</p>
            </div>
            <span class="text-xs text-orange-500">点击查看</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>