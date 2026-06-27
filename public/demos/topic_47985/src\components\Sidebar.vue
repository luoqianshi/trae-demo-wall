<script setup lang="ts">
import { ref, computed } from 'vue'
import { Book, Settings, Search, ChevronDown, ChevronRight } from 'lucide-vue-next'

interface Chapter {
  id: string
  title: string
  category: string
  path: string
}

const props = defineProps<{
  chapters: Chapter[]
  currentChapter: string
  onSearch: () => void
  onConfig: () => void
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

// 按类别分组章节
const categories = computed(() => {
  const groups: Record<string, Chapter[]> = {}
  for (const chapter of props.chapters) {
    if (!groups[chapter.category]) {
      groups[chapter.category] = []
    }
    groups[chapter.category].push(chapter)
  }
  return groups
})

// 类别图标映射
const categoryIcons: Record<string, string> = {
  '首页': '📚',
  '职场识人': '🏢',
  '人格与情绪': '🧠',
  '家庭关系': '🏠',
  '校园关系': '🎓',
  '体制内': '🏛️',
  '附录': '📖',
}

// 展开状态
const expandedCategories = ref<Record<string, boolean>>({
  '首页': true,
  '职场识人': true,
  '人格与情绪': true,
  '家庭关系': true,
  '校园关系': true,
  '体制内': true,
  '附录': true,
})

function toggleCategory(category: string) {
  expandedCategories.value[category] = !expandedCategories.value[category]
}

function selectChapter(id: string) {
  emit('select', id)
}
</script>

<template>
  <div class="sidebar h-full bg-slate-50 border-r border-slate-200 flex flex-col">
    <!-- Logo 区域 -->
    <div class="p-4 border-b border-slate-200">
      <div class="flex items-center gap-2">
        <span class="text-2xl">🧠</span>
        <span class="text-lg font-semibold text-slate-700">EQagent</span>
      </div>
      <p class="text-xs text-slate-500 mt-1">人际关系修炼助手</p>
    </div>

    <!-- 功能按钮 -->
    <div class="p-2 border-b border-slate-200 flex gap-2">
      <button 
        @click="props.onSearch"
        class="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Search class="w-4 h-4" />
        <span>搜索</span>
      </button>
      <button 
        @click="props.onConfig"
        class="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Settings class="w-4 h-4" />
        <span>配置</span>
      </button>
    </div>

    <!-- 章节导航 -->
    <div class="flex-1 overflow-y-auto p-2">
      <div v-for="(chapters, category) in categories" :key="category" class="mb-2">
        <!-- 类别标题 -->
        <button 
          @click="toggleCategory(category)"
          class="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors"
        >
          <span>{{ categoryIcons[category] || '📁' }}</span>
          <span class="flex-1">{{ category }}</span>
          <ChevronDown v-if="expandedCategories[category]" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>

        <!-- 章节列表 -->
        <div v-if="expandedCategories[category]" class="ml-4 mt-1">
          <button 
            v-for="chapter in chapters" 
            :key="chapter.id"
            @click="selectChapter(chapter.id)"
            :class="[
              'w-full text-left px-2 py-1.5 text-sm rounded transition-colors',
              currentChapter === chapter.id 
                ? 'bg-orange-100 text-orange-700 font-medium' 
                : 'text-slate-600 hover:bg-slate-100'
            ]"
          >
            {{ chapter.title }}
          </button>
        </div>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="p-3 border-t border-slate-200 text-xs text-slate-400">
      <p>基于熊太行《识人攻略》《关系攻略》</p>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  width: 240px;
  min-width: 240px;
}
</style>