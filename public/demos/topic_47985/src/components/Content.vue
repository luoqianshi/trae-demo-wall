<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  content: string
  title: string
}>()

const renderedContent = ref('')

// 配置 marked 选项
marked.setOptions({
  breaks: true,
  gfm: true,
})

// 监听内容变化，重新渲染
watch(() => props.content, (newContent) => {
  if (newContent) {
    renderedContent.value = marked.parse(newContent) as string
  }
}, { immediate: true })

onMounted(() => {
  if (props.content) {
    renderedContent.value = marked.parse(props.content) as string
  }
})
</script>

<template>
  <div class="content-area h-full flex flex-col bg-white">
    <!-- 标题栏 -->
    <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">
      <h1 class="text-xl font-semibold text-slate-800">{{ title }}</h1>
    </div>

    <!-- Markdown 内容区 -->
    <div class="flex-1 overflow-y-auto px-6 py-4">
      <article 
        class="prose prose-slate max-w-none"
        v-html="renderedContent"
      ></article>
    </div>
  </div>
</template>

<style>
/* Markdown 渲染样式 */
.prose {
  --tw-prose-body: #374151;
  --tw-prose-headings: #1e293b;
  --tw-prose-links: #ea580c;
  --tw-prose-bold: #1e293b;
  --tw-prose-code: #d97706;
}

.prose h1 {
  font-size: 1.75rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.prose h2 {
  font-size: 1.5rem;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #1e293b;
}

.prose h3 {
  font-size: 1.25rem;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.prose p {
  margin-bottom: 1rem;
  line-height: 1.75;
}

.prose ul, .prose ol {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.prose li {
  margin-bottom: 0.5rem;
}

.prose code {
  background: #f1f5f9;
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  color: #d97706;
}

.prose pre {
  background: #1e293b;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  overflow-x: auto;
}

.prose pre code {
  background: transparent;
  color: inherit;
}

.prose blockquote {
  border-left: 4px solid #ea580c;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #64748b;
  background: #fff7ed;
  padding: 0.5rem 1rem;
  border-radius: 0 0.25rem 0.25rem 0;
}

.prose table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.prose th, .prose td {
  border: 1px solid #e2e8f0;
  padding: 0.75rem;
  text-align: left;
}

.prose th {
  background: #f8fafc;
  font-weight: 600;
}

.prose a {
  color: #ea580c;
  text-decoration: underline;
}

.prose strong {
  color: #1e293b;
  font-weight: 600;
}
</style>