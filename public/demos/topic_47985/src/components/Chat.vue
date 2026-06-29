<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Send, Trash2, Bot, User, Loader } from 'lucide-vue-next'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const props = defineProps<{
  chapterId: string
  apiKey: string
  baseUrl: string
}>()

const messages = ref<Message[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)

const chatContainer = ref<HTMLElement | null>(null)

// 发送消息
async function sendMessage() {
  if (!inputMessage.value.trim() || isLoading.value) return

  if (!props.apiKey) {
    error.value = '请先在配置页面填写 API Key'
    return
  }

  const userMessage = inputMessage.value.trim()
  inputMessage.value = ''
  error.value = null

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: userMessage,
    timestamp: Date.now(),
  })

  isLoading.value = true

  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        chapterId: props.chapterId,
        history: messages.value.slice(-6), // 最近3轮对话
        apiKey: props.apiKey,
        baseUrl: props.baseUrl,
      }),
    })

    const data = await response.json()

    if (data.success) {
      messages.value.push({
        role: 'assistant',
        content: data.reply,
        timestamp: data.timestamp,
      })
    } else {
      error.value = data.error || '请求失败'
    }
  } catch (err) {
    error.value = '网络请求失败，请检查后端服务是否启动'
  } finally {
    isLoading.value = false
    // 滚动到底部
    await nextTick()
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  }
}

// 清空对话
function clearChat() {
  messages.value = []
  error.value = null
}

// 格式化时间
function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="chat-panel h-full flex flex-col bg-slate-50 border-l border-slate-200">
    <!-- 标题栏 -->
    <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Bot class="w-5 h-5 text-orange-500" />
        <span class="text-sm font-medium text-slate-700">AI 助手</span>
      </div>
      <button 
        @click="clearChat"
        class="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
        title="清空对话"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>

    <!-- 对话区域 -->
    <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- 空状态 -->
      <div v-if="messages.length === 0" class="text-center text-slate-400 py-8">
        <Bot class="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p class="text-sm">开始提问吧，我会基于章节内容帮你解答</p>
      </div>

      <!-- 消息列表 -->
      <div v-for="msg in messages" :key="msg.timestamp" class="flex gap-3">
        <!-- 用户消息 -->
        <div v-if="msg.role === 'user'" class="flex-1 flex justify-end">
          <div class="max-w-[85%] bg-orange-500 text-white px-4 py-2 rounded-2xl rounded-br-md">
            <p class="text-sm">{{ msg.content }}</p>
            <span class="text-xs text-orange-200 mt-1">{{ formatTime(msg.timestamp) }}</span>
          </div>
        </div>

        <!-- AI 消息 -->
        <div v-else class="flex-1 flex justify-start">
          <div class="max-w-[85%] bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-slate-100">
            <div class="prose prose-sm max-w-none" v-html="msg.content"></div>
            <span class="text-xs text-slate-400 mt-2">{{ formatTime(msg.timestamp) }}</span>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="flex gap-3">
        <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
          <Loader class="w-4 h-4 text-orange-500 animate-spin" />
        </div>
        <div class="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-slate-100">
          <p class="text-sm text-slate-400">正在思考...</p>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
        {{ error }}
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="p-3 border-t border-slate-200">
      <div class="flex gap-2">
        <input 
          v-model="inputMessage"
          type="text"
          placeholder="输入你的问题..."
          @keyup.enter="sendMessage"
          :disabled="isLoading"
          class="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-100"
        />
        <button 
          @click="sendMessage"
          :disabled="isLoading || !inputMessage.trim()"
          class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-slate-300 disabled:text-slate-500 transition-colors"
        >
          <Send class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-panel {
  width: 360px;
  min-width: 360px;
}

/* AI 消息的 Markdown 样式 */
.prose :deep(p) {
  margin-bottom: 0.5rem;
}

.prose :deep(ul), .prose :deep(ol) {
  padding-left: 1rem;
  margin-bottom: 0.5rem;
}

.prose :deep(li) {
  margin-bottom: 0.25rem;
}

.prose :deep(code) {
  background: #f1f5f9;
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
}

.prose :deep(strong) {
  color: #ea580c;
}
</style>