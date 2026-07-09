<template>
  <div class="ai-assistant">
    <div class="chat-card">
      <div class="chat-header">
        <div class="header-left">
          <div class="robot-avatar" :style="{ backgroundColor: currentAgent.color }">
            <i class="fas fa-robot"></i>
          </div>
          <div>
            <h3>{{ currentAgent.name }}</h3>
            <p>{{ currentAgent.description }}</p>
          </div>
        </div>
        <div class="header-right">
          <el-select v-model="selectedAgentId" style="width: 170px" @change="switchAgent">
            <el-option v-for="agent in aiAgents" :key="agent.id" :label="agent.name" :value="agent.id" />
          </el-select>
          <el-button link @click="loadConversations">历史记录</el-button>
          <el-button link @click="clearChat">清空对话</el-button>
        </div>
      </div>

      <el-alert v-if="contextTitle" type="info" show-icon :closable="false" :title="`已识别当前页面上下文：${contextTitle}`"
        class="context-alert" />

      <div v-if="isMultiAgentMode" class="participants-bar">
        <span>讨论参与者</span>
        <div v-for="agent in multiAgents" :key="agent.id" class="participant">
          <i class="fas fa-robot" :style="{ color: agent.color }"></i>
          {{ agent.name }}
        </div>
      </div>

      <div ref="messagesContainer" class="chat-messages">
        <div v-for="message in messages" :key="message.id" :class="['message-item', message.role]">
          <div class="message-avatar"
            :style="{ backgroundColor: message.role === 'assistant' ? getAgentColor(message.agentType) : '#64748b' }">
            <i :class="message.role === 'assistant' ? 'fas fa-robot' : 'fas fa-user'"></i>
          </div>
          <div class="message-content">
            <div v-if="message.agentName" class="agent-name">{{ message.agentName }}</div>
            <div class="message-text">{{ message.content }}</div>
            <div class="message-time">{{ formatTime(message.created_at) }}</div>
          </div>
        </div>
        <div v-if="loading" class="loading-indicator">
          <i class="fas fa-circle-notch loading-icon"></i>
          <span>{{ isMultiAgentMode ? '多 AI 正在讨论...' : 'AI 正在思考...' }}</span>
        </div>
      </div>

      <div class="chat-input">
        <div class="quick-actions">
          <button v-for="question in quickQuestions" :key="question" class="quick-btn" @click="quickQuestion(question)">
            {{ question }}
          </button>
        </div>
        <div class="input-container">
          <input v-model="inputMessage" type="text" placeholder="输入你的经营问题..." @keyup.enter="sendMessage" />
          <button class="send-btn" :disabled="loading || !inputMessage.trim()" @click="sendMessage">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>

    <el-drawer v-model="showHistory" title="历史对话" size="420px">
      <el-input v-model="historyKeyword" clearable placeholder="搜索对话主题或Agent" class="history-search" />
      <div v-if="filteredConversations.length" class="history-list">
        <div v-for="conv in filteredConversations" :key="conv.id" class="history-item" @click="loadConversation(conv)">
          <strong>{{ conv.topic || '未命名对话' }}</strong>
          <small>{{ conv.agent_type }}</small>
          <span>{{ formatTime(conv.created_at) }}</span>
        </div>
      </div>
      <DataStateBlock v-else icon="fas fa-comments" title="暂无历史对话" description="新的 AI 咨询会沉淀到这里，后续可以按主题或 Agent 快速检索。"
        compact min-height="180px" />
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { authFetch } from '@/utils/request'
import DataStateBlock from '@/components/DataStateBlock.vue'

const route = useRoute()

const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)
const sessionId = ref(null)
const messagesContainer = ref(null)
const selectedAgentId = ref(1)
const showHistory = ref(false)
const conversations = ref([])
const historyKeyword = ref('')

const aiAgents = [
  { id: 1, name: '运营助手', description: '聚焦日常经营、行动建议和落地执行。', color: '#b45309', agentType: 'operations' },
  { id: 2, name: '数据分析', description: '分析销售、订单、会员和菜品数据。', color: '#f59e0b', agentType: 'data' },
  { id: 3, name: '营销专家', description: '生成营销方案、活动文案和会员触达建议。', color: '#10b981', agentType: 'market' },
  { id: 4, name: '菜单顾问', description: '优化菜品结构、定价和套餐组合。', color: '#ef4444', agentType: 'operations' },
  { id: 5, name: '多 AI 协作', description: '多个 AI 从不同角度讨论后给出综合建议。', color: '#7c2d12', agentType: 'collab' }
]

const multiAgents = [
  { id: 'operations', name: '运营助手', color: '#b45309' },
  { id: 'market', name: '营销专家', color: '#10b981' },
  { id: 'data', name: '数据分析', color: '#f59e0b' }
]

const quickQuestions = [
  '今天最该优先处理什么？',
  '如何提升复购率？',
  '帮我生成一个营销活动方案'
]

const currentAgent = computed(() => aiAgents.find(agent => agent.id === selectedAgentId.value) || aiAgents[0])
const isMultiAgentMode = computed(() => selectedAgentId.value === 5)
const contextTitle = computed(() => route.query.title || route.query.context || '')
const filteredConversations = computed(() => {
  const keyword = historyKeyword.value.trim().toLowerCase()
  if (!keyword) return conversations.value
  return conversations.value.filter(item =>
    `${item.topic || ''} ${item.agent_type || ''}`.toLowerCase().includes(keyword)
  )
})

function getAgentColor(agentType) {
  const agent = aiAgents.find(item => item.agentType === agentType)
  return agent?.color || '#b45309'
}

function initWelcomeMessage() {
  messages.value = [{
    id: Date.now(),
    role: 'assistant',
    content: contextTitle.value
      ? `我已识别当前页面：${contextTitle.value}。你可以直接问这个页面的数据问题、优化建议或下一步行动。`
      : '你好，我是你的 AI 经营教练。你可以问我经营诊断、营销方案、菜品优化、会员运营和任务复盘。',
    created_at: new Date(),
    agentType: currentAgent.value.agentType,
    agentName: currentAgent.value.name
  }]
}

function switchAgent() {
  sessionId.value = null
  initWelcomeMessage()
}

function clearChat() {
  sessionId.value = null
  initWelcomeMessage()
}

async function loadConversations() {
  showHistory.value = true
  try {
    const response = await authFetch(`/api/ai/conversations?agent_type=${currentAgent.value.agentType}`)
    if (response.ok) conversations.value = await response.json()
  } catch (error) {
    console.error('Failed to load conversations:', error)
  }
}

async function loadConversation(conv) {
  try {
    const response = await authFetch(`/api/ai/conversations/${conv.session_id}/messages`)
    if (!response.ok) return
    const result = await response.json()
    messages.value = result.map(item => ({
      id: item.id,
      role: item.role,
      content: item.content,
      created_at: item.created_at,
      agentType: currentAgent.value.agentType,
      agentName: item.role === 'assistant' ? currentAgent.value.name : ''
    }))
    sessionId.value = conv.session_id
    showHistory.value = false
    scrollToBottom()
  } catch (error) {
    console.error('Failed to load conversation:', error)
  }
}

async function sendMessage() {
  const content = inputMessage.value.trim()
  if (!content || loading.value) return

  messages.value.push({
    id: Date.now(),
    role: 'user',
    content,
    created_at: new Date()
  })
  inputMessage.value = ''
  loading.value = true
  await scrollToBottom()

  if (isMultiAgentMode.value) {
    await sendMultiAgentMessage(content)
  } else {
    await sendSingleAgentMessage(content)
  }
}

async function sendSingleAgentMessage(content) {
  const aiMessage = {
    id: Date.now() + 1,
    role: 'assistant',
    content: '',
    created_at: new Date(),
    agentType: currentAgent.value.agentType,
    agentName: currentAgent.value.name
  }
  messages.value.push(aiMessage)

  try {
    const response = await authFetch('/api/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId.value,
        message: contextTitle.value ? `[当前页面：${contextTitle.value}] ${content}` : content,
        topic: contextTitle.value || 'AI 经营咨询',
        agent_type: currentAgent.value.agentType
      })
    })

    if (!response.ok || !response.body) throw new Error('AI 请求失败')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')
      lines.forEach(line => {
        if (!line.startsWith('data: ')) return
        const data = line.slice(6)
        if (data === '[DONE]') return
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) {
            aiMessage.content = parsed.error
            return
          }
          if (parsed.type === 'conversation') {
            sessionId.value = parsed.session_id
            return
          }
          if (parsed.type === 'store_confirm') {
            aiMessage.content = parsed.message || '请确认店铺信息后再写入。'
            return
          }
          aiMessage.content += parsed.content || ''
        } catch {
          aiMessage.content += data
        }
      })
      await scrollToBottom()
    }
  } catch (error) {
    console.error('AI chat failed:', error)
    aiMessage.content = 'AI 调用失败，请稍后重试或检查配置。'
  } finally {
    loading.value = false
  }
}

async function sendMultiAgentMessage(content) {
  const aiMessage = {
    id: Date.now() + 1,
    role: 'assistant',
    content: '',
    created_at: new Date(),
    agentType: 'collab',
    agentName: '多 AI 协作'
  }
  messages.value.push(aiMessage)

  try {
    const response = await authFetch('/api/ai/multi-agent/discussion/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: contextTitle.value ? `[当前页面：${contextTitle.value}] ${content}` : content })
    })
    if (!response.ok || !response.body) throw new Error('多 AI 请求失败')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      chunk.split('\n').forEach(line => {
        if (!line.startsWith('data: ')) return
        const data = line.slice(6)
        if (data === '[DONE]') return
        try {
          const parsed = JSON.parse(data)
          aiMessage.content += parsed.content || ''
        } catch {
          aiMessage.content += data
        }
      })
      await scrollToBottom()
    }
  } catch (error) {
    console.error('Multi-agent chat failed:', error)
    aiMessage.content = '多 AI 协作失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

function quickQuestion(question) {
  inputMessage.value = question
  sendMessage()
}

function formatTime(time) {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN', { hour12: false })
}

async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

onMounted(() => {
  initWelcomeMessage()
})
</script>

<style scoped>
.ai-assistant {
  height: calc(100vh - 140px);
}

.chat-card {
  height: 100%;
  background: white;
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 18px 22px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.robot-avatar,
.message-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.header-left h3 {
  margin: 0;
  color: #111827;
  font-size: 18px;
}

.header-left p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}

.context-alert {
  margin: 14px 18px 0;
}

.participants-bar {
  margin: 14px 18px 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  color: #475569;
}

.participant {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 82%;
}

.message-item.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-content {
  background: #f8fafc;
  border-radius: 16px;
  padding: 12px 14px;
}

.message-item.user .message-content {
  color: white;
  background: var(--ds-primary);
}

.agent-name {
  color: var(--ds-primary);
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 6px;
}

.message-text {
  white-space: pre-wrap;
  line-height: 1.7;
}

.message-time {
  margin-top: 6px;
  font-size: 11px;
  color: #94a3b8;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.chat-input {
  border-top: 1px solid #e5e7eb;
  padding: 16px;
}

.quick-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.quick-btn {
  border: 1px solid rgba(180, 83, 9, 0.16);
  background: var(--ds-primary-soft);
  color: var(--ds-primary);
  border-radius: 999px;
  padding: 7px 12px;
  cursor: pointer;
}

.input-container {
  display: flex;
  gap: 10px;
}

.input-container input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  padding: 12px 16px;
  outline: none;
}

.send-btn {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: none;
  background: var(--ds-primary);
  color: white;
  cursor: pointer;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
}

.history-item strong,
.history-item span {
  display: block;
}

.history-item span {
  color: #64748b;
  font-size: 12px;
  margin-top: 6px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 760px) {
  .ai-assistant {
    height: calc(100vh - 110px);
  }

  .chat-header,
  .header-right {
    flex-direction: column;
    align-items: flex-start;
  }

  .message-item {
    max-width: 100%;
  }
}
</style>
