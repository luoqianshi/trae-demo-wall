<template>
  <div>
    <div class="ai-floating-button" :class="{ expanded: isExpanded }" @click="toggleExpand" @mousedown="startDrag"
      @mouseup="endDrag" @mousemove="onDrag" :style="buttonStyle">
      <div class="button-icon">
        <i class="fas fa-robot"></i>
        <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
      </div>
      <span v-if="!isExpanded" class="button-label">AI助手</span>
    </div>

    <Transition name="slide-up">
      <div v-if="isExpanded" class="ai-chat-panel" :style="panelStyle">
        <div class="chat-header">
          <div class="header-left">
            <div class="agent-avatar">
              <i class="fas fa-robot"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800">{{ currentAgent.name }}</h3>
              <p class="text-sm text-gray-500">{{ currentAgent.description }}</p>
            </div>
          </div>
          <div class="header-right">
            <div class="agent-selector">
              <el-select v-model="selectedAgent" placeholder="选择Agent" size="small" class="agent-select"
                @change="onAgentChange">
                <el-option v-for="agent in agents" :key="agent.id" :label="agent.name" :value="agent.id" />
              </el-select>
            </div>
            <button class="close-btn" @click.stop="toggleExpand">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div class="chat-messages" ref="messagesContainer">
          <div v-for="message in messages" :key="message.id" :class="['message-item', message.role]">
            <div class="message-avatar">
              <i v-if="message.role === 'user'" class="fas fa-user"></i>
              <i v-else class="fas fa-robot"></i>
            </div>
            <div class="message-content">
              <div class="message-text" v-html="formatMessage(message.content)"></div>
              <div v-if="message.pendingStore" class="store-confirm-card">
                <strong>待确认店铺信息</strong>
                <p>店铺名称：{{ message.pendingStore.name || '-' }}</p>
                <p>手机号：{{ message.pendingStore.phone || '-' }}</p>
                <p>地址：{{ message.pendingStore.address || '-' }}</p>
                <p>备注：{{ message.pendingStore.remark || '-' }}</p>
                <button class="confirm-store-btn" :disabled="loading" @click="confirmStore(message)">
                  确认写入店铺
                </button>
              </div>
              <div class="message-time">{{ formatTime(message.created_at) }}</div>
            </div>
          </div>
          <div v-if="loading" class="loading-indicator">
            <i class="fas fa-circle-notch loading-icon"></i>
            <span>AI正在思考中...</span>
          </div>
        </div>

        <div class="chat-input">
          <div class="quick-actions">
            <button v-for="action in quickActions" :key="action.label" @click="sendQuickAction(action.value)"
              class="quick-btn">
              {{ action.label }}
            </button>
          </div>
          <div class="input-container">
            <button class="attach-btn" @click="triggerFileUpload">
              <i class="fas fa-paperclip"></i>
            </button>
            <input type="file" ref="fileInput" class="file-input" accept="image/*,.xlsx,.xls,.pptx,.ppt,.doc,.docx,.pdf"
              @change="handleFileUpload" />
            <button class="voice-btn" @click="toggleVoiceInput" :class="{ recording: isRecording }">
              <i v-if="!isRecording" class="fas fa-microphone"></i>
              <i v-else class="fas fa-stop"></i>
            </button>
            <input type="text" v-model="inputMessage" placeholder="输入您的问题..." @keyup.enter="sendMessage" />
            <button @click="sendMessage" :disabled="loading || !inputMessage.trim()" class="send-btn">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>import { ref, computed, onMounted, nextTick } from 'vue';
import { authFetch } from '@/utils/request';
import { aiApi } from '@/api';
import { useUserStore } from '@/stores/user';
const isExpanded = ref(false);
const loading = ref(false);
const inputMessage = ref('');
const messages = ref([]);
const messagesContainer = ref(null);
const sessionId = ref(null);
const unreadCount = ref(0);
const selectedAgent = ref('operations');
const isRecording = ref(false);
const fileInput = ref(null);
const userStore = useUserStore();
const position = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const agents = ref([
  { id: 'operations', name: '运营助手', description: '专业运营顾问，随时为您解答', icon: 'fas fa-robot', color: '#b45309' },
  { id: 'market', name: '市场分析AI', description: '洞察市场趋势，分析竞品动态', icon: 'fas fa-chart-line', color: '#10b981' },
  { id: 'data', name: '数据分析AI', description: '深度数据分析，发现业务洞察', icon: 'fas fa-chart-bar', color: '#f59e0b' },
  { id: 'collab', name: '多AI协作', description: '多个智能体共同讨论，给出综合方案', icon: 'fas fa-users', color: '#7c2d12' }
]);
const quickActions = ref([
  { label: '如何提升复购率？', value: '如何提升复购率？' },
  { label: '推荐什么营销活动？', value: '推荐什么营销活动？' },
  { label: '菜品定价建议', value: '菜品定价建议' },
  { label: '分析今日销售数据', value: '分析今日销售数据' }
]);
const currentAgent = computed(() => {
  return agents.value.find(a => a.id === selectedAgent.value) || agents.value[0];
});
const buttonStyle = computed(() => ({
  right: `${20 + position.value.x}px`,
  bottom: `${80 + position.value.y}px`
}));
const panelStyle = computed(() => ({
  right: '24px',
  bottom: '24px'
}));
onMounted(async () => {
  loadAgents();
  messages.value = [
    {
      id: 1,
      role: 'assistant',
      content: '您好！我是您的AI运营助手。首次使用可以直接问经营诊断、上传图片或表格让我分析，也可以说“帮我添加商铺信息：店铺名称：xx，手机号：xx，地址：xx”，我会先让您确认后再写入。',
      created_at: new Date()
    }
  ];
});
function toggleExpand() {
  if (!userStore.isLoggedIn) {
    alert('请先登录后再使用 AI 助手');
    return;
  }
  isExpanded.value = !isExpanded.value;
  if (isExpanded.value) {
    unreadCount.value = 0;
    scrollToBottom();
  }
}
function startDrag(e) {
  isDragging.value = true;
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  };
}
function onDrag(e) {
  if (!isDragging.value)
    return;
  const newX = e.clientX - dragStart.value.x;
  const newY = e.clientY - dragStart.value.y;
  position.value = {
    x: Math.max(0, Math.min(newX, window.innerWidth - 120)),
    y: Math.max(0, Math.min(newY, window.innerHeight - 100))
  };
}
function endDrag() {
  isDragging.value = false;
}
async function loadAgents() {
  try {
    const result = await aiApi.getAgents();
    if (Array.isArray(result) && result.length > 0) {
      agents.value = [
        ...result.map(item => ({
          id: item.agent_type,
          configId: item.id,
          name: item.name,
          description: item.description || '自定义智能体',
          icon: item.icon || 'fas fa-robot',
          color: item.color || '#b45309'
        })),
        { id: 'collab', name: '多AI协作', description: '多个智能体共同讨论，给出综合方案', icon: 'fas fa-users', color: '#7c2d12' }
      ];
    }
  }
  catch (error) {
    console.error('Failed to load AI agents:', error);
  }
}
async function sendMessage() {
  if (!inputMessage.value.trim() || loading.value)
    return;
  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: inputMessage.value.trim(),
    created_at: new Date()
  };
  messages.value.push(userMessage);
  inputMessage.value = '';
  loading.value = true;
  await scrollToBottom();
  try {
    let apiUrl = '/api/ai/chat/stream';
    let requestBody = {
      session_id: sessionId.value || undefined,
      message: userMessage.content,
      agent_type: selectedAgent.value
    };
    if (selectedAgent.value === 'collab') {
      apiUrl = '/api/ai/multi-agent/discussion/stream';
      requestBody = {
        message: userMessage.content,
        agent_count: 3,
        rounds: 3
      };
    }
    const response = await authFetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok || !response.body)
      throw new Error('AI 请求失败');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aiMessageId = Date.now() + 1;
    let aiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      created_at: new Date()
    };
    messages.value.push(aiMessage);
    await scrollToBottom();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            aiMessage.content += buffer;
            await scrollToBottom();
            return;
          }
          const parsed = parseSseData(data);
          if (parsed?.error) {
            aiMessage.content = parsed.error;
            await scrollToBottom();
            return;
          }
          if (parsed?.type === 'conversation') {
            sessionId.value = parsed.session_id;
            continue;
          }
          if (parsed?.type === 'store_confirm') {
            aiMessage.content = parsed.message || '请确认店铺信息后再写入。';
            aiMessage.pendingStore = parsed.store;
            await scrollToBottom();
            return;
          }
          aiMessage.content += parsed?.content || data;
          await scrollToBottom();
        }
      }
    }
  }
  catch (error) {
    console.error('Stream error:', error);
    const aiMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: 'AI调用失败，请稍后重试',
      created_at: new Date()
    };
    messages.value.push(aiMessage);
  }
  finally {
    loading.value = false;
    await scrollToBottom();
  }
}
function parseSseData(data) {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}
function formatTime(date) {
  if (!date)
    return '';
  const d = new Date(date);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}
function formatMessage(content) {
  if (!content)
    return '';
  let html = content
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
  return html;
}
function sendQuickAction(value) {
  inputMessage.value = value;
  sendMessage();
}
function onAgentChange() {
  if (messages.value.length === 0 || messages.value.length === 1 && messages.value[0].role === 'assistant') {
    messages.value = [
      {
        id: Date.now(),
        role: 'assistant',
        content: `您好！我是${currentAgent.value.name}。请问有什么可以帮您的？`,
        created_at: new Date()
      }
    ];
  } else {
    sessionId.value = null;
    messages.value.push({
      id: Date.now(),
      role: 'assistant',
      content: `您好！我是${currentAgent.value.name}。请问有什么可以帮您的？`,
      created_at: new Date(),
      isWelcome: true
    });
  }
}
function toggleVoiceInput() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = true;
    if (!isRecording.value) {
      isRecording.value = true;
      recognition.start();
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        inputMessage.value = transcript;
      };
      recognition.onend = () => {
        isRecording.value = false;
      };
    }
    else {
      recognition.stop();
      isRecording.value = false;
    }
  }
  else {
    alert('您的浏览器不支持语音输入功能');
  }
}
function triggerFileUpload() {
  fileInput.value?.click();
}
async function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file)
    return;
  const maxSize = file.type.startsWith('image/') ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
  if (file.size > maxSize) {
    alert(file.type.startsWith('image/') ? '图片大小不能超过10MB' : '文件大小不能超过50MB');
    return;
  }
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target?.result;
    const fileInfo = {
      name: file.name,
      type: file.type,
      size: file.size,
      content: base64
    };
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: `【文件上传】${file.name} (${formatFileSize(file.size)})`,
      created_at: new Date(),
      file: fileInfo
    };
    messages.value.push(userMessage);
    loading.value = true;
    await scrollToBottom();
    try {
      const uploadResult = await aiApi.uploadFile(fileInfo);
      const parsedText = uploadResult.extracted_text || uploadResult.ocr_text || uploadResult.summary || '';
      const response = await authFetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId.value || undefined,
          message: `请分析这个文件：${file.name}\n\n文件解析摘要：${uploadResult.summary || ''}\n\n提取内容：${parsedText}`,
          agent_type: selectedAgent.value,
          file: {
            name: uploadResult.file_name,
            type: uploadResult.file_type,
            size: uploadResult.size,
            parsed_text: parsedText
          }
        })
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessageId = Date.now() + 1;
      let aiMessage = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        created_at: new Date()
      };
      messages.value.push(aiMessage);
      await scrollToBottom();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done)
          break;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              while (buffer.length > 0) {
                aiMessage.content += buffer[0];
                buffer = buffer.slice(1);
                await scrollToBottom();
                await new Promise(r => setTimeout(r, 20));
              }
              await scrollToBottom();
              return;
            }
            const parsed = parseSseData(data);
            if (parsed?.error) throw new Error(parsed.error);
            if (parsed?.type === 'conversation') {
              sessionId.value = parsed.session_id;
              continue;
            }
            buffer += parsed?.content || data;
            while (buffer.length > 0) {
              aiMessage.content += buffer[0];
              buffer = buffer.slice(1);
              await scrollToBottom();
              await new Promise(r => setTimeout(r, 20));
            }
          }
        }
      }
    }
    catch (error) {
      console.error('File upload error:', error);
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '文件分析失败，请稍后重试',
        created_at: new Date()
      };
      messages.value.push(aiMessage);
    }
    finally {
      loading.value = false;
      await scrollToBottom();
    }
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}
async function confirmStore(message) {
  if (!message.pendingStore || loading.value)
    return;
  loading.value = true;
  try {
    const result = await aiApi.confirmStore({
      confirmed: true,
      store: message.pendingStore
    });
    message.pendingStore = null;
    messages.value.push({
      id: Date.now(),
      role: 'assistant',
      content: `店铺信息已写入数据库：${result.name}，手机号：${result.phone || '-'}，地址：${result.address || '-'}`,
      created_at: new Date()
    });
    await scrollToBottom();
  }
  catch (error) {
    console.error('Confirm store failed:', error);
    messages.value.push({
      id: Date.now(),
      role: 'assistant',
      content: '店铺信息写入失败，请检查内容后重试。',
      created_at: new Date()
    });
  }
  finally {
    loading.value = false;
  }
}
function formatFileSize(bytes) {
  if (bytes < 1024)
    return bytes + ' B';
  if (bytes < 1024 * 1024)
    return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
</script>

<style scoped>
.ai-floating-button {
  position: fixed;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ds-primary), #2f6f5e);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(180, 83, 9, 0.28);
  transition: all 0.3s ease;
  z-index: 1000;
  overflow: hidden;
}

.ai-floating-button:hover {
  transform: scale(1.1);
  box-shadow: 0 10px 28px rgba(180, 83, 9, 0.32);
}

.ai-floating-button.expanded {
  opacity: 0;
  pointer-events: none;
}

.button-icon {
  position: relative;
  font-size: 24px;
}

.unread-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #ef4444;
  color: white;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.button-label {
  display: none;
}

.ai-chat-panel {
  position: fixed;
  width: min(420px, calc(100vw - 48px));
  height: min(680px, calc(100vh - 48px));
  background: var(--ds-surface);
  border: 1px solid rgba(180, 83, 9, 0.18);
  border-radius: 20px;
  box-shadow: 0 24px 70px rgba(80, 43, 19, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 1200;
  overflow: hidden;
}

@media (max-width: 480px) {
  .ai-chat-panel {
    right: 12px !important;
    bottom: 12px !important;
    width: calc(100vw - 24px);
    height: min(640px, calc(100vh - 24px));
  }
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  background: linear-gradient(135deg, #0f2f33 0%, #2f6f5e 58%, var(--ds-primary) 100%);
  color: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.agent-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.agent-avatar i {
  font-size: 24px;
}

.header-left h3 {
  margin: 0;
  font-size: 16px;
  line-height: 1.35;
}

.header-left p {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #e4e7ec;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.agent-select .el-select__wrapper {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 8px;
}

.agent-select .el-select__placeholder {
  color: rgba(255, 255, 255, 0.8);
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: linear-gradient(180deg, rgba(255, 247, 237, 0.52), rgba(255, 253, 250, 0.96));
  min-height: 0;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-item.user .message-avatar {
  background-color: var(--ds-primary);
}

.message-item.user .message-avatar i {
  color: white;
}

.message-item.assistant .message-avatar {
  background-color: #e5e7eb;
}

.message-item.assistant .message-avatar i {
  color: #6b7280;
}

.message-content {
  max-width: 82%;
  min-width: 0;
}

.message-item.user .message-content {
  text-align: right;
}

.message-text {
  padding: 11px 14px;
  border-radius: 16px;
  line-height: 1.6;
  font-size: 14px;
  word-break: break-word;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.message-item.user .message-text {
  background-color: var(--ds-primary);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-item.assistant .message-text {
  background-color: var(--ds-surface);
  color: #1f2937;
  border-bottom-left-radius: 4px;
  border: 1px solid var(--ds-border);
  box-shadow: 0 1px 2px rgba(80, 43, 19, 0.05);
}

.message-text pre {
  background-color: #f3f4f6;
  padding: 10px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 13px;
}

.message-text code {
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.message-time {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 6px;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #6b7280;
}

.loading-icon {
  animation: spin 1s linear infinite;
  margin-right: 8px;
  font-size: 16px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.chat-input {
  padding: 14px 16px;
  border-top: 1px solid var(--ds-border);
  background-color: var(--ds-surface);
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.quick-btn {
  padding: 6px 14px;
  background-color: #f3f4f6;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-btn:hover {
  background-color: var(--ds-primary-soft);
  color: var(--ds-primary);
}

.input-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.attach-btn,
.voice-btn,
.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.attach-btn {
  background-color: #f3f4f6;
  color: #6b7280;
}

.attach-btn:hover {
  background-color: #e5e7eb;
}

.voice-btn {
  background-color: #f3f4f6;
  color: #6b7280;
}

.voice-btn:hover {
  background-color: #e5e7eb;
}

.voice-btn.recording {
  background-color: #ef4444;
  color: white;
}

.file-input {
  display: none;
}

.input-container input[type="text"] {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 16px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
}

.input-container input[type="text"]:focus {
  border-color: var(--ds-primary);
  box-shadow: 0 0 0 3px rgba(180, 83, 9, 0.12);
}

.send-btn {
  background-color: var(--ds-primary);
  color: white;
}

.send-btn:hover:not(:disabled) {
  background-color: var(--ds-primary-700);
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
