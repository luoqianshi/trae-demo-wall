<template>
  <div class="ai-chat-container">
    <div class="chat-layout">
      <div class="sidebar">
        <div class="sidebar-header">
          <el-button type="primary" :icon="Plus" class="new-chat-btn" @click="handleNewConversation">
            新建会话
          </el-button>
        </div>
        <el-scrollbar class="conversation-list">
          <div
            v-for="item in conversations"
            :key="item.id"
            :class="['conversation-item', { active: currentConversationId === item.id }]"
            @click="handleSwitchConversation(item)"
          >
            <div class="conv-icon">
              <el-icon :size="18"><ChatDotRound /></el-icon>
            </div>
            <div class="conv-info">
              <div class="conv-title">{{ item.title }}</div>
              <div class="conv-last-msg">{{ item.lastMessage }}</div>
            </div>
            <div class="conv-time">{{ formatConvTime(item.updateTime) }}</div>
          </div>
          <el-empty v-if="conversations.length === 0 && !loadingConversations" description="暂无会话" />
          <div v-if="loadingConversations" class="loading-conv">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
        </el-scrollbar>
      </div>

      <div class="main-content">
        <div class="chat-header">
          <div class="header-title">
            <el-icon :size="20" class="ai-icon"><MagicStick /></el-icon>
            <span>{{ currentConversation?.title || 'AI聊天助手' }}</span>
          </div>
          <div class="header-actions">
            <el-button type="danger" link :icon="Delete" @click="handleClearChat" v-if="currentConversationId">
              清空当前对话
            </el-button>
          </div>
        </div>

        <div ref="chatContainerRef" class="chat-container">
          <el-scrollbar ref="scrollBarRef" class="chat-messages">
            <div v-if="messages.length === 0 && !loading" class="empty-chat">
              <el-icon :size="64" class="empty-icon"><ChatDotRound /></el-icon>
              <h3>你好，我是智能助手</h3>
              <p>有什么可以帮您的吗？</p>
            </div>
            <div v-for="(msg, index) in messages" :key="msg.id || index" :class="['message-item', msg.role]">
              <div class="message-avatar">
                <el-avatar :size="36" v-if="msg.role === 'assistant'" class="ai-avatar">
                  <el-icon><MagicStick /></el-icon>
                </el-avatar>
                <el-avatar :size="36" v-else class="user-avatar">
                  {{ userStore.nickname?.charAt(0) || 'U' }}
                </el-avatar>
              </div>
              <div class="message-content">
                <div class="message-bubble">
                  <span v-if="msg.role === 'assistant' && msg.typing" class="typing-text">{{ msg.content }}</span>
                  <span v-else>{{ msg.content }}</span>
                </div>
                <div class="message-time">{{ formatTime(msg.time) }}</div>
              </div>
            </div>
            <div v-if="loading" class="message-item assistant">
              <div class="message-avatar">
                <el-avatar :size="36" class="ai-avatar">
                <el-icon><MagicStick /></el-icon>
              </el-avatar>
              </div>
              <div class="message-content">
                <div class="message-bubble">
                  <div class="thinking-indicator">
                    <span class="thinking-text">思考中</span>
                    <span class="dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </div>

        <div class="chat-input-area">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            :maxlength="2000"
            show-word-limit
            placeholder="请输入您的问题..."
            @keydown.enter.prevent="handleEnter"
          />
          <div class="input-actions">
            <span class="tip-text">Enter 发送，Shift + Enter 换行</span>
            <el-button type="primary" :icon="Promotion" :loading="loading" :disabled="!inputMessage.trim()" @click="handleSend">
              发送
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, MagicStick, Promotion, Plus, ChatDotRound, Loading } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getConversationList, createConversation, getConversationMessages, sendChatMessage, deleteConversation } from '@/api/ai'

const userStore = useUserStore()
const chatContainerRef = ref(null)
const scrollBarRef = ref(null)
const inputMessage = ref('')
const loading = ref(false)
const loadingConversations = ref(false)

const conversations = ref([])
const currentConversationId = ref(null)
const currentConversation = ref(null)
const messages = ref([])
const typingTimer = ref(null)

function formatTime(time) {
  const date = new Date(time)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function formatConvTime(time) {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

function scrollToBottom() {
  nextTick(() => {
    if (scrollBarRef.value) {
      scrollBarRef.value.scrollTo({ top: scrollBarRef.value.scrollHeight, behavior: 'smooth' })
    }
  })
}

async function loadConversations() {
  loadingConversations.value = true
  try {
    const mockConversations = [
      { id: 1, title: '关于学生心理问题咨询', lastMessage: '好的，我会帮您分析...', updateTime: new Date(Date.now() - 1800000) },
      { id: 2, title: '班级管理方法探讨', lastMessage: '建议您可以从以下几个方面入手...', updateTime: new Date(Date.now() - 86400000) },
      { id: 3, title: '操行分规则咨询', lastMessage: '操行分规则可以在规则管理页面设置', updateTime: new Date(Date.now() - 172800000) }
    ]
    conversations.value = mockConversations
  } catch (error) {
    ElMessage.error('加载会话列表失败')
  } finally {
    loadingConversations.value = false
  }
}

async function handleNewConversation() {
  try {
    const newConv = {
      id: Date.now(),
      title: '新会话',
      lastMessage: '',
      updateTime: new Date()
    }
    conversations.value.unshift(newConv)
    currentConversationId.value = newConv.id
    currentConversation.value = newConv
    messages.value = []
    inputMessage.value = ''
  } catch (error) {
    ElMessage.error('创建会话失败')
  }
}

async function handleSwitchConversation(item) {
  if (currentConversationId.value === item.id) return
  currentConversationId.value = item.id
  currentConversation.value = item
  await loadMessages(item.id)
}

async function loadMessages(conversationId) {
  loading.value = true
  try {
    const mockMessages = [
      { id: 1, role: 'assistant', content: '你好！我是智能班级管理AI助手，有什么可以帮您的吗？', time: new Date(Date.now() - 3600000) },
      { id: 2, role: 'user', content: '你好，我想了解一下如何更好地管理班级纪律？', time: new Date(Date.now() - 3500000) },
      { id: 3, role: 'assistant', content: '关于班级纪律管理，我建议您可以从以下几个方面入手：\n\n1. **建立明确的规章制度**：让学生清楚知道什么可以做，什么不可以做\n2. **以身作则**：老师要起到表率作用\n3. **奖惩分明**：对遵守纪律的学生给予表扬，对违反纪律的学生及时纠正\n4. **加强沟通**：了解学生的想法和需求\n5. **培养班干部**：让学生参与管理，提高自我约束能力\n\n您目前在班级管理中遇到了什么具体问题吗？', time: new Date(Date.now() - 3400000) }
    ]
    messages.value = mockMessages
    scrollToBottom()
  } catch (error) {
    ElMessage.error('加载消息失败')
  } finally {
    loading.value = false
  }
}

function handleEnter(e) {
  if (e.shiftKey) {
    return
  }
  handleSend()
}

async function handleSend() {
  if (!inputMessage.value.trim() || loading.value) {
    return
  }

  const userMsg = inputMessage.value.trim()

  if (!currentConversationId.value) {
    await handleNewConversation()
  }

  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: userMsg,
    time: new Date()
  }
  messages.value.push(userMessage)
  inputMessage.value = ''
  scrollToBottom()

  if (currentConversation.value) {
    currentConversation.value.lastMessage = userMsg
    currentConversation.value.updateTime = new Date()
    sortConversations()
  }

  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))

    const replies = [
      '这是一个很好的问题。根据班级管理的最佳实践，我建议您可以从以下几个方面入手：\n\n**1. 了解学生的基本情况，包括性格、家庭背景、学习情况等\n**2. 制定合理的规章制度，让学生参与制定，增加认同感\n**3. 加强与学生的沟通，建立良好的师生关系\n**4. 及时发现和解决问题，不要等问题积累\n**5. 与家长保持密切联系，形成教育合力\n\n希望这些建议对您有帮助！',
      '关于操行分管理，您可以在操行分记录页面查看详细记录，也可以在规则管理页面自定义加减分规则。建议您：\n\n- 定期公布操行分情况，让学生及时了解自己的表现\n- 设立奖励机制，对表现优秀的学生给予表彰\n- 对扣分较多的学生进行个别谈话，了解原因\n\n需要我详细了解哪个方面的内容吗？',
      '学生心理问题是班级管理中的重要议题。常见的学生心理问题包括：\n\n1. **学习压力**：考试焦虑、学习动力不足\n2. **人际关系**：同学矛盾、师生关系\n3. **情绪问题**：抑郁、焦虑情绪\n4. **行为问题**：叛逆、攻击性行为\n\n如果您发现学生有心理问题的迹象，建议及时与学生谈心，必要时联系家长或专业心理老师。需要更具体的建议吗？'
    ]

    const reply = replies[Math.floor(Math.random() * replies.length)]

    const aiMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      time: new Date(),
      typing: true
    }
    messages.value.push(aiMessage)
    scrollToBottom()

    let index = 0
    const typeInterval = setInterval(() => {
      if (index < reply.length) {
        aiMessage.content += reply[index]
        index++
        scrollToBottom()
      } else {
        clearInterval(typeInterval)
        aiMessage.typing = false
        if (currentConversation.value) {
          currentConversation.value.lastMessage = reply.substring(0, 30) + (reply.length > 30 ? '...' : '')
          currentConversation.value.updateTime = new Date()
          sortConversations()
        }
      }
    }, 30)

  } catch (error) {
    ElMessage.error('发送失败，请稍后重试')
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

function sortConversations() {
  conversations.value.sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime))
}

function handleClearChat() {
  ElMessageBox.confirm('确定要清空当前对话记录吗？', '提示', {
    type: 'warning'
  }).then(() => {
    messages.value = []
    ElMessage.success('已清空对话')
  })
}

onMounted(() => {
  loadConversations()
})
</script>

<style scoped lang="scss">
.ai-chat-container {
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
}

.chat-layout {
  flex: 1;
  display: flex;
  gap: 16px;
  height: 100%;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
}

.new-chat-btn {
  width: 100%;
}

.conversation-list {
  flex: 1;
  padding: 8px 0;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s;
  border-left: 3px solid transparent;

  &:hover {
    background-color: #f5f7fa;
  }

  &.active {
    background-color: #ecf5ff;
    border-left-color: #409EFF;
  }
}

.conv-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.conv-info {
  flex: 1;
  margin-left: 12px;
  min-width: 0;
}

.conv-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-last-msg {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-time {
  font-size: 12px;
  color: #c0c4cc;
  flex-shrink: 0;
  margin-left: 8px;
}

.loading-conv {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #909399;
  font-size: 14px;
  gap: 8px;
}

.main-content {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.ai-icon {
  color: #409EFF;
}

.chat-container {
  flex: 1;
  overflow: hidden;
  padding: 20px;
}

.chat-messages {
  height: 100%;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;

  .empty-icon {
    font-size: 64px;
    color: #c0c4cc;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 20px;
    color: #606266;
    margin: 0 0 8px 0;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.message-item {
  display: flex;
  margin-bottom: 24px;

  &.user {
    flex-direction: row-reverse;

    .message-content {
      align-items: flex-end;
    }

    .message-bubble {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      border-radius: 12px 4px 12px 12px;
    }
  }

  &.assistant {
    .message-bubble {
      background-color: #f5f7fa;
      color: #303133;
      border-radius: 4px 12px 12px 12px;
    }
  }
}

.message-avatar {
  flex-shrink: 0;
  margin: 0 12px;
}

.ai-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.user-avatar {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.message-bubble {
  padding: 12px 16px;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
  font-size: 14px;
}

.typing-text {
  display: inline-block;
}

.message-time {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 6px;
}

.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.thinking-text {
  color: #909399;
  font-size: 14px;
}

.dots {
  display: flex;
  gap: 4px;

  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #c0c4cc;
    animation: bounce 1.4s infinite ease-in-out both;

    &:nth-child(1) {
      animation-delay: -0.32s;
    }

    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.chat-input-area {
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.tip-text {
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}
</style>
