<template>
  <div class="chat-page">
    <Header />
    <div class="container chat-container">
      <div class="chat-layout">
        <!-- 左侧会话列表 -->
        <div class="conversation-sidebar">
          <div class="sidebar-header">
            <h3>消息中心</h3>
          </div>
          <div class="conversation-list" v-loading="conversationsLoading">
            <el-empty v-if="conversations.length === 0" description="暂无消息" :image-size="60" />
            <div
              v-for="conv in conversations"
              :key="conv.id"
              class="conversation-item"
              :class="{ active: currentConversation?.id === conv.id }"
              @click="selectConversation(conv)"
            >
              <el-badge :value="conv.unread_count" :hidden="conv.unread_count === 0" class="avatar-badge">
                <el-avatar :size="45" :src="getConvAvatar(conv)" />
              </el-badge>
              <div class="conv-info">
                <div class="conv-top">
                  <span class="conv-name">{{ getConvName(conv) }}</span>
                  <span class="conv-time">{{ formatTime(conv.last_message_time) }}</span>
                </div>
                <div class="conv-last-msg">{{ conv.last_message || '[暂无消息]' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧聊天区域 -->
        <div class="chat-main">
          <template v-if="currentConversation">
            <div class="chat-header">
              <span class="chat-title">{{ getConvName(currentConversation) }}</span>
              <div class="chat-actions">
                <el-button link @click="goToMerchant(currentConversation.merchant.id)">进入店铺</el-button>
              </div>
            </div>
            
            <div class="message-list" ref="messageListRef" v-loading="messagesLoading">
              <div v-for="msg in messages" :key="msg.id" class="message-wrapper" :class="{ 'message-mine': isMine(msg) }">
                <el-avatar :size="36" :src="msg.sender.avatar || defaultAvatar" class="msg-avatar" />
                <div class="message-content-box">
                  <div class="message-info">
                    <span class="sender-name">{{ msg.sender.nickname || msg.sender.username }}</span>
                    <span class="send-time">{{ formatTime(msg.create_time) }}</span>
                  </div>
                  <div class="message-content">
                    {{ msg.content }}
                  </div>
                </div>
              </div>
            </div>

            <div class="chat-footer">
              <div class="tool-bar">
                <el-icon class="tool-icon"><Picture /></el-icon>
                <el-icon class="tool-icon"><FolderOpened /></el-icon>
              </div>
              <div class="input-area">
                <el-input
                  v-model="inputMessage"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入消息内容..."
                  resize="none"
                  @keyup.enter.prevent="sendMessage"
                />
                <div class="send-btn-wrapper">
                  <span class="tip">Enter 发送</span>
                  <el-button type="primary" @click="sendMessage" :disabled="!inputMessage.trim()">发送</el-button>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="empty-chat">
            <el-empty description="选择一个会话开始聊天吧" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Picture, FolderOpened } from '@element-plus/icons-vue'
import Header from '@/components/Header.vue'

const route = useRoute()
const router = useRouter()

const conversations = ref([])
const currentConversation = ref(null)
const messages = ref([])
const inputMessage = ref('')
const messageListRef = ref(null)
const conversationsLoading = ref(false)
const messagesLoading = ref(false)

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 获取当前登录用户
const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))

// 获取会话列表
const fetchConversations = async () => {
  conversationsLoading.value = true
  try {
    const res = await axios.get('/api/chat/conversations/')
    conversations.value = res.data
    
    // 如果 URL 中有 merchant_id，尝试开启或查找该会话
    const targetMerchantId = route.query.merchant_id
    if (targetMerchantId) {
      startConversation(targetMerchantId)
    }
  } catch (error) {
    console.error('获取会话失败:', error)
    ElMessage.error('获取会话失败')
  } finally {
    conversationsLoading.value = false
  }
}

// 开始新会话
const startConversation = async (merchantId) => {
  try {
    const res = await axios.post('/api/chat/conversations/', { merchant_id: merchantId })
    const conv = res.data
    // 如果不在列表中，添加到列表
    if (!conversations.value.find(c => c.id === conv.id)) {
      conversations.value.unshift(conv)
    }
    selectConversation(conv)
  } catch (error) {
    console.error('开启会话失败:', error)
  }
}

// 选择会话
const selectConversation = async (conv) => {
  currentConversation.value = conv
  fetchMessages(conv.id)
  markAsRead(conv.id)
}

// 获取消息列表
const fetchMessages = async (convId) => {
  messagesLoading.value = true
  try {
    const res = await axios.get(`/api/chat/conversations/${convId}/messages/`)
    messages.value = res.data
    scrollToBottom()
  } catch (error) {
    console.error('获取消息失败:', error)
  } finally {
    messagesLoading.value = false
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || !currentConversation.value) return
  
  const content = inputMessage.value
  inputMessage.value = ''
  
  try {
    const res = await axios.post(`/api/chat/conversations/${currentConversation.value.id}/send-message/`, {
      content: content
    })
    messages.value.push(res.data)
    
    // 更新左侧列表最后一条消息
    const conv = conversations.value.find(c => c.id === currentConversation.value.id)
    if (conv) {
      conv.last_message = content
      conv.last_message_time = new Date().toISOString()
    }
    
    scrollToBottom()
  } catch (error) {
    console.error('发送失败:', error)
    ElMessage.error('发送失败')
  }
}

// 标记已读
const markAsRead = async (convId) => {
  try {
    await axios.post(`/api/chat/conversations/${convId}/mark-read/`)
    const conv = conversations.value.find(c => c.id === convId)
    if (conv) conv.unread_count = 0
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

// 辅助方法
const getConvAvatar = (conv) => conv.merchant.merchant_logo || defaultAvatar
const getConvName = (conv) => conv.merchant.merchant_name
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}
const isMine = (msg) => msg.sender.id === currentUser.value.id
const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

const goToMerchant = (id) => {
  router.push(`/shop/${id}`)
}

// 定时刷新（模拟简单长轮询）
let timer = null
const startPolling = () => {
  timer = setInterval(() => {
    if (currentConversation.value) {
      // 只刷新当前会话的消息，实际应用中建议使用 WebSocket
      fetchMessages(currentConversation.value.id)
    }
    // 同时更新会话列表以获取新会话或未读数
    axios.get('/api/chat/conversations/').then(res => {
      conversations.value = res.data
    })
  }, 5000)
}

onMounted(() => {
  fetchConversations()
  startPolling()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.chat-page {
  background-color: #fff7ed;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  padding: 20px 0;
  display: flex;
}

.chat-layout {
  display: flex;
  width: 100%;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  overflow: hidden;
  height: calc(100vh - 120px);
}

/* 侧边栏 */
.conversation-sidebar {
  width: 280px;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 15px;
  cursor: pointer;
  transition: background 0.3s;
}

.conversation-item:hover {
  background-color: #f8f8f8;
}

.conversation-item.active {
  background-color: #fff7ed;
}

.avatar-badge {
  margin-right: 12px;
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.conv-name {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-time {
  font-size: 12px;
  color: #999;
}

.conv-last-msg {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 聊天主区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.chat-header {
  height: 60px;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}

.chat-title {
  font-size: 16px;
  font-weight: bold;
}

.message-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.message-wrapper {
  display: flex;
  margin-bottom: 20px;
}

.message-wrapper.message-mine {
  flex-direction: row-reverse;
}

.msg-avatar {
  flex-shrink: 0;
}

.message-content-box {
  margin: 0 12px;
  max-width: 70%;
}

.message-info {
  margin-bottom: 4px;
  font-size: 12px;
  color: #999;
}

.message-mine .message-info {
  text-align: right;
}

.sender-name {
  margin-right: 8px;
}

.message-mine .sender-name {
  margin-right: 0;
  margin-left: 8px;
}

.message-content {
  padding: 10px 15px;
  background-color: #fff;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  word-break: break-all;
}

.message-mine .message-content {
  background-color: #ea580c;
  color: #fff;
}

/* 底部输入框 */
.chat-footer {
  background-color: #fff;
  border-top: 1px solid #eee;
  padding: 10px 20px 20px;
}

.tool-bar {
  padding-bottom: 10px;
  display: flex;
  gap: 15px;
}

.tool-icon {
  font-size: 20px;
  color: #666;
  cursor: pointer;
}

.tool-icon:hover {
  color: #409eff;
}

.input-area {
  position: relative;
}

.send-btn-wrapper {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 15px;
  margin-top: 10px;
}

.send-btn-wrapper .tip {
  font-size: 12px;
  color: #999;
}

.empty-chat {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
