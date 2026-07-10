<template>
  <div class="chat-page">
    <div class="chat-card">
      <div class="chat-header">
        <el-button link type="primary" @click="goBack">← 返回</el-button>
        <h2 class="chat-title">👨‍⚕️ 在线问诊</h2>
        <div class="header-right">
          <el-tag :type="wsConnected ? 'success' : 'info'" size="small">
            {{ wsConnected ? '已连接' : '连接中' }}
          </el-tag>
          <el-button size="small" @click="handleClose">结束问诊</el-button>
        </div>
      </div>

      <div ref="messagesRef" class="chat-messages">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message"
          :class="message.senderType === 'USER' ? 'message-user' : 'message-doctor'"
        >
          <div class="message-sender">{{ message.senderName }}</div>
          <div class="message-content">{{ message.content }}</div>
          <div class="message-time">{{ formatTime(message.sentAt) }}</div>
        </div>

        <div v-if="messages.length === 0 && !loading" class="empty-message">
          暂无消息，请发送您的健康问题
        </div>
      </div>

      <div class="chat-input-area">
        <el-input
          v-model="inputText"
          placeholder="输入您的问题..."
          class="chat-input"
          @keyup.enter="handleSend"
        />
        <el-button
          type="primary"
          class="send-btn"
          :loading="sending"
          :disabled="!inputText.trim()"
          @click="handleSend"
        >
          发送
        </el-button>
      </div>
    </div>

    <!-- 评价弹窗 -->
    <el-dialog v-model="evaluateVisible" title="问诊评价" width="420px">
      <el-form label-position="top">
        <el-form-item label="评分">
          <el-rate v-model="evaluateForm.rating" />
        </el-form-item>
        <el-form-item label="评价内容">
          <el-input
            v-model="evaluateForm.ratingComment"
            type="textarea"
            :rows="3"
            placeholder="请输入对本次问诊的评价"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="evaluateVisible = false">稍后评价</el-button>
        <el-button type="primary" :loading="evaluating" @click="handleEvaluate">提交评价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getMessages,
  sendMessage,
  closeConsultation,
  evaluateConsultation,
  type MessageVO
} from '@/api/consultation'
import { useUserStore } from '@/stores/user'
import ws from '@/utils/ws'
import logger from '@/utils/logger'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const consultationId = Number(route.params.id)

const loading = ref(false)
const sending = ref(false)
const wsConnected = ref(false)

const messages = ref<MessageVO[]>([])
const inputText = ref('')

// 消息列表容器引用，用于自动滚动
const messagesRef = ref<HTMLDivElement>()

// STOMP 订阅ID，用于取消订阅
let subscriptionId: string | null = null

// 评价弹窗
const evaluateVisible = ref(false)
const evaluating = ref(false)
const evaluateForm = reactive({
  rating: 5,
  ratingComment: ''
})

// 格式化时间
const formatTime = (iso: string): string => {
  if (!iso) {
    return ''
  }
  return iso.replace('T', ' ').substring(0, 16)
}

// 滚动到底部
const scrollToBottom = async (): Promise<void> => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

// 加载历史消息
const loadMessages = async (): Promise<void> => {
  loading.value = true
  try {
    messages.value = await getMessages(consultationId)
    await scrollToBottom()
  } catch (e) {
    logger.error('加载历史消息失败', e)
  } finally {
    loading.value = false
  }
}

// 建立 WebSocket 连接并订阅问诊主题
const connectWebSocket = async (): Promise<void> => {
  const token = userStore.token
  if (!token) {
    ElMessage.error('未登录，无法建立连接')
    return
  }

  try {
    await ws.connect(token)
    // 订阅问诊消息主题：/topic/consultation/{consultationId}
    const destination = `/topic/consultation/${consultationId}`
    subscriptionId = ws.subscribe(destination, (stompMessage) => {
      // 后端推送的 body 为 MessageVO 的 JSON 字符串
      try {
        const messageVO = JSON.parse(stompMessage.body) as MessageVO
        messages.value.push(messageVO)
        scrollToBottom()
      } catch (e) {
        logger.error('解析 WebSocket 消息失败', e)
      }
    })
    wsConnected.value = true
  } catch (e) {
    logger.error('WebSocket 连接失败', e)
    ElMessage.warning('实时连接建立失败，您仍可发送消息，但可能无法实时接收回复')
  }
}

// 发送消息
const handleSend = async (): Promise<void> => {
  const content = inputText.value.trim()
  if (!content) {
    return
  }

  sending.value = true
  try {
    // 通过 HTTP 接口发送；后端保存后会通过 WebSocket 推送给双方
    await sendMessage({
      consultationId,
      contentType: 'TEXT',
      content
    })
    inputText.value = ''
    // 滚动到底部（HTTP 接口返回的 MessageVO 也会被加入列表，但避免重复：仅追加返回值）
    // 后端 WebSocket 推送会携带本条消息，这里不重复追加
  } catch (e) {
    logger.error('发送消息失败', e)
  } finally {
    sending.value = false
  }
}

// 结束问诊
const handleClose = async (): Promise<void> => {
  try {
    await ElMessageBox.confirm('确认结束本次问诊吗？结束后可进行评价', '提示', {
      type: 'warning'
    })
  } catch {
    // 用户取消
    return
  }

  try {
    await closeConsultation(consultationId)
    ElMessage.success('问诊已结束')
    evaluateVisible.value = true
  } catch (e) {
    logger.error('结束问诊失败', e)
  }
}

// 提交评价
const handleEvaluate = async (): Promise<void> => {
  evaluating.value = true
  try {
    await evaluateConsultation({
      consultationId,
      rating: evaluateForm.rating,
      ratingComment: evaluateForm.ratingComment || undefined
    })
    ElMessage.success('评价已提交')
    evaluateVisible.value = false
    router.push('/consultation/doctors')
  } catch (e) {
    logger.error('提交评价失败', e)
  } finally {
    evaluating.value = false
  }
}

// 返回
const goBack = (): void => {
  router.push('/consultation/doctors')
}

onMounted(async () => {
  await loadMessages()
  await connectWebSocket()
})

onBeforeUnmount(() => {
  // 清理订阅与连接，避免内存泄漏与重复推送
  if (subscriptionId) {
    ws.unsubscribe(subscriptionId)
    subscriptionId = null
  }
  ws.disconnect()
})
</script>

<style scoped lang="scss">
.chat-page {
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}

.chat-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 760px;
  height: calc(100vh - 48px);
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.chat-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #f8f9fa;
}

.message {
  max-width: 75%;
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 18px;
  word-wrap: break-word;
}

/* 用户消息：右侧渐变蓝 */
.message-user {
  margin-left: auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-bottom-right-radius: 5px;
}

/* 医生消息：左侧白色 */
.message-doctor {
  margin-right: auto;
  background: #ffffff;
  color: #303133;
  border-bottom-left-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.message-sender {
  margin-bottom: 4px;
  font-size: 12px;
  opacity: 0.8;
}

.message-content {
  font-size: 14px;
  line-height: 1.5;
}

.message-time {
  margin-top: 4px;
  font-size: 11px;
  opacity: 0.7;
}

.empty-message {
  padding: 40px 0;
  font-size: 14px;
  color: #909399;
  text-align: center;
}

.chat-input-area {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.chat-input {
  flex: 1;
}

.send-btn {
  min-width: 88px;
}
</style>
