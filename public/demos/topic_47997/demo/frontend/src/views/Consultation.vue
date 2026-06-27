<template>
  <div class="consultation-container">
    <div class="consultation-header">
      <div class="header-content">
        <div class="title-section">
          <el-icon class="title-icon"><ChatDotRound /></el-icon>
          <h1 class="page-title">病症询问</h1>
          <el-tag type="success" class="status-tag">在线咨询</el-tag>
        </div>
        <div class="action-buttons">
          <el-button
            type="warning"
            plain
            @click="clearHistory"
            :loading="clearing"
          >
            <el-icon><Delete /></el-icon>
            清除历史
          </el-button>
          <el-button
            type="primary"
            @click="exportHistory"
            :loading="exporting"
          >
            <el-icon><Download /></el-icon>
            导出记录
          </el-button>
        </div>
      </div>
    </div>

    <div class="consultation-content">
      <!-- 聊天区域 -->
      <div class="chat-container">
        <div class="chat-messages" ref="messagesContainer">
          <div v-if="messages.length === 0" class="empty-state">
            <el-icon class="empty-icon"><ChatDotRound /></el-icon>
            <p class="empty-text">开始您的医疗咨询</p>
            <p class="empty-subtitle">请输入您的症状或问题，我将为您提供专业的医疗建议</p>
          </div>
          
          <div
            v-for="(message, index) in messages"
            :key="index"
            class="message-item"
            :class="message.role"
          >
            <div class="message-avatar">
              <el-avatar :size="40">
                <el-icon v-if="message.role === 'user'">
                  <User />
                </el-icon>
                <el-icon v-else>
                  <Monitor />
                </el-icon>
              </el-avatar>
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="message-sender">
                  {{ message.role === 'user' ? '您' : '医疗助手' }}
                </span>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
              <div class="message-text" v-html="formatMessage(message.content)"></div>
            </div>
          </div>
          
          <!-- 加载状态 -->
          <div v-if="loading" class="message-item assistant">
            <div class="message-avatar">
              <el-avatar :size="40">
                <el-icon><Monitor /></el-icon>
              </el-avatar>
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="message-sender">医疗助手</span>
              </div>
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input">
          <div class="input-container">
            <el-input
              v-model="currentMessage"
              type="textarea"
              :rows="3"
              placeholder="请描述您的症状或问题..."
              class="message-input"
              @keydown.ctrl.enter="sendMessage"
              :disabled="loading"
            />
            <div class="input-actions">
              <div class="input-tips">
                <el-text size="small" type="info">
                  <el-icon><InfoFilled /></el-icon>
                  按 Ctrl + Enter 快速发送
                </el-text>
              </div>
              <el-button
                type="primary"
                @click="sendMessage"
                :loading="loading"
                :disabled="!currentMessage.trim()"
                class="send-button"
              >
                <el-icon><Promotion /></el-icon>
                发送
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 侧边栏信息 -->
      <div class="sidebar-info">
        <el-card class="info-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>使用说明</span>
            </div>
          </template>
          <div class="info-content">
            <ul class="info-list">
              <li>详细描述您的症状和不适感</li>
              <li>提供症状持续时间和严重程度</li>
              <li>说明是否有相关病史或用药史</li>
              <li>描述症状的变化趋势</li>
            </ul>
          </div>
        </el-card>

        <el-card class="info-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Warning /></el-icon>
              <span>重要提醒</span>
            </div>
          </template>
          <div class="info-content">
            <el-alert
              title="本系统仅供参考"
              description="请勿将此作为最终诊断依据，如有严重症状请及时就医"
              type="warning"
              :closable="false"
              show-icon
            />
          </div>
        </el-card>

        <el-card class="info-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><DataAnalysis /></el-icon>
              <span>咨询统计</span>
            </div>
          </template>
          <div class="info-content">
            <div class="stat-item">
              <span class="stat-label">本次对话</span>
              <span class="stat-value">{{ messages.length }} 条</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">历史记录</span>
              <span class="stat-value">{{ totalMessages }} 条</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ChatDotRound,
  User,
  Monitor,
  Delete,
  Download,
  Promotion,
  InfoFilled,
  Warning,
  DataAnalysis
} from '@element-plus/icons-vue'

const messages = ref([])
const currentMessage = ref('')
const loading = ref(false)
const clearing = ref(false)
const exporting = ref(false)
const totalMessages = ref(0)
const messagesContainer = ref()

// 加载聊天历史
const loadHistory = async () => {
  try {
    const response = await axios.get('/api/consultation/history', {
      withCredentials: true
    })
    
    if (response.data.success) {
      messages.value = response.data.history
      totalMessages.value = messages.value.length
      await nextTick()
      scrollToBottom()
    }
  } catch (error) {
    console.error('加载历史失败:', error)
  }
}

// 发送消息
const sendMessage = async () => {
  if (!currentMessage.value.trim() || loading.value) return
  
  const userMessage = {
    role: 'user',
    content: currentMessage.value.trim(),
    timestamp: new Date().toISOString()
  }
  
  messages.value.push(userMessage)
  const question = currentMessage.value.trim()
  currentMessage.value = ''
  
  await nextTick()
  scrollToBottom()
  
  loading.value = true
  
  try {
    const response = await axios.post('/api/consultation/chat', {
      question
    }, {
      withCredentials: true
    })
    
    if (response.data.success) {
      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString()
      }
      
      messages.value.push(assistantMessage)
      totalMessages.value = messages.value.length
      
      await nextTick()
      scrollToBottom()
    } else {
      ElMessage.error(response.data.message || '发送失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
    console.error('发送消息失败:', error)
  } finally {
    loading.value = false
  }
}

// 清除历史
const clearHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有聊天记录吗？此操作不可恢复。',
      '确认清除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    clearing.value = true
    
    const response = await axios.post('/api/consultation/clear', {}, {
      withCredentials: true
    })
    
    if (response.data.success) {
      messages.value = []
      totalMessages.value = 0
      ElMessage.success('历史记录已清除')
    } else {
      ElMessage.error(response.data.message || '清除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清除失败')
      console.error('清除历史失败:', error)
    }
  } finally {
    clearing.value = false
  }
}

// 导出历史
const exportHistory = async () => {
  if (messages.value.length === 0) {
    ElMessage.warning('暂无聊天记录可导出')
    return
  }
  
  exporting.value = true
  
  try {
    // 这里可以实现导出功能
    const content = messages.value.map(msg => {
      const time = formatTime(msg.timestamp)
      const sender = msg.role === 'user' ? '患者' : '医疗助手'
      return `[${time}] ${sender}: ${msg.content}`
    }).join('\n\n')
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `医疗咨询记录_${new Date().toLocaleDateString()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
    console.error('导出失败:', error)
  } finally {
    exporting.value = false
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化消息内容
const formatMessage = (content) => {
  return content.replace(/\n/g, '<br>')
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.consultation-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.consultation-header {
  background: linear-gradient(135deg, #2c5aa0 0%, #1e3d72 100%);
  color: white;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(44, 90, 160, 0.15);
  position: relative;
  overflow: hidden;
}

.consultation-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
  pointer-events: none;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 28px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.status-tag {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.consultation-content {
  flex: 1;
  display: flex;
  min-height: 0;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chat-messages {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  position: relative;
}

.chat-messages::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 10% 20%, rgba(44, 90, 160, 0.02) 0%, transparent 50%),
              radial-gradient(circle at 90% 80%, rgba(93, 173, 226, 0.02) 0%, transparent 50%);
  pointer-events: none;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.empty-text {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 8px 0;
}

.empty-subtitle {
  font-size: 14px;
  margin: 0;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  animation: fadeIn 0.3s ease-out;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-item.user .message-content {
  background: linear-gradient(135deg, #2c5aa0 0%, #1e3d72 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(44, 90, 160, 0.3);
}

.message-item.user .message-header .message-sender {
  color: white;
}

.message-item.user .message-header .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.message-item.user .message-text {
  color: white;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-sender {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.message-time {
  font-size: 12px;
  color: #909399;
}

.message-text {
  line-height: 1.6;
  color: #303133;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #c0c4cc;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.chat-input {
  border-top: 1px solid #ebeef5;
  background: white;
  padding: 20px 24px;
}

.input-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-input {
  resize: none;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-tips {
  display: flex;
  align-items: center;
  gap: 4px;
}

.send-button {
  background: linear-gradient(135deg, #2c5aa0 0%, #1e3d72 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(44, 90, 160, 0.3);
  transition: all 0.3s ease;
}

.send-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(44, 90, 160, 0.4);
}

.sidebar-info {
  width: 300px;
  padding: 24px;
  background: #f8f9fa;
  border-left: 1px solid #ebeef5;
  overflow-y: auto;
}

.info-card {
  margin-bottom: 20px;
}

.info-card:last-child {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.info-content {
  color: #606266;
}

.info-list {
  margin: 0;
  padding-left: 20px;
  line-height: 1.8;
}

.info-list li {
  margin-bottom: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.stat-value {
  font-weight: 600;
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .sidebar-info {
    width: 250px;
  }
}

@media (max-width: 768px) {
  .consultation-content {
    flex-direction: column;
  }
  
  .sidebar-info {
    width: 100%;
    border-left: none;
    border-top: 1px solid #ebeef5;
  }
  
  .message-content {
    max-width: 85%;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}
</style>