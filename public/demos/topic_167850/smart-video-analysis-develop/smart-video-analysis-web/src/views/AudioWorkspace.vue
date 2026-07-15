<template>
  <div class="audio-workspace">
    <!-- 顶部工具栏 -->
    <div class="workspace-header">
      <div class="header-left">
        <h2 class="page-title">音频创作工作台</h2>
        <el-tag :type="ttsConnected ? 'success' : 'info'" size="small">
          {{ ttsConnected ? 'TTS 已连接' : 'TTS 未连接' }}
        </el-tag>
      </div>
      <div class="header-right">
        <el-button @click="showConfig = true">
          <el-icon><Setting /></el-icon>
          <span>服务配置</span>
        </el-button>
        <el-upload
          ref="uploadRef"
          :show-file-list="false"
          :before-upload="beforeUpload"
          :http-request="handleUpload"
          accept="audio/*"
        >
          <el-button type="primary">
            <el-icon><Upload /></el-icon>
            <span>上传音频</span>
          </el-button>
        </el-upload>
      </div>
    </div>

    <div class="workspace-content">
      <!-- 左侧：音频选择 + 生成模式 + 音色选择 -->
      <div class="left-panel">
        <!-- 音频选择 -->
        <el-card shadow="never" class="audio-select-card">
          <template #header>
            <div class="card-header">
              <span>源音频</span>
              <el-tag type="info" size="small">已选 {{ selectedAudios.length }} / 3</el-tag>
            </div>
          </template>
          <div class="audio-list">
            <div
              v-for="audio in audioList"
              :key="audio.id"
              class="audio-item"
              :class="{ selected: isAudioSelected(audio.id) }"
              @click="toggleAudio(audio.id)"
            >
              <div class="audio-checkbox">
                <el-checkbox :model-value="isAudioSelected(audio.id)" disabled />
              </div>
              <div class="audio-thumb">
                <el-icon :size="24" color="#60a5fa"><Microphone /></el-icon>
              </div>
              <div class="audio-info">
                <div class="audio-name">{{ audio.filename }}</div>
                <div class="audio-meta">
                  <span>{{ formatDuration(audio.duration) }}</span>
                  <span class="dot">·</span>
                  <span>{{ formatFileSize(audio.fileSize) }}</span>
                </div>
              </div>
            </div>

            <el-empty
              v-if="audioList.length === 0"
              description="暂无音频"
              :image-size="80"
            >
              <el-button type="primary" size="small" @click="triggerUpload">上传音频</el-button>
            </el-empty>
          </div>
        </el-card>

        <!-- 生成模式 -->
        <el-card shadow="never" class="mode-card">
          <template #header>
            <div class="card-header">
              <span>生成模式</span>
            </div>
          </template>
          <div class="mode-list">
            <div
              v-for="mode in genModes"
              :key="mode.value"
              class="mode-item"
              :class="{ active: selectedMode === mode.value }"
              @click="selectMode(mode.value)"
            >
              <div class="mode-icon">
                <el-icon :size="22"><component :is="mode.icon" /></el-icon>
              </div>
              <div class="mode-info">
                <div class="mode-name">{{ mode.name }}</div>
                <div class="mode-desc">{{ mode.desc }}</div>
              </div>
              <div class="mode-check">
                <el-radio :model-value="selectedMode === mode.value" disabled />
              </div>
            </div>
          </div>
        </el-card>

        <!-- 音色选择 -->
        <el-card shadow="never" class="voice-select-card">
          <template #header>
            <div class="card-header">
              <span>选择音色</span>
              <el-button text size="small" @click="refreshVoices" :loading="loadingVoices">
                刷新
              </el-button>
            </div>
          </template>
          <div v-loading="loadingVoices" class="voice-grid">
            <div
              v-for="voice in voiceList"
              :key="voice.id"
              class="voice-item"
              :class="{ selected: selectedVoiceId === voice.id }"
              @click="selectVoice(voice.id)"
            >
              <div class="voice-icon">
                <el-icon :size="28">
                  <component :is="voice.gender === 'male' ? Male : (voice.gender === 'female' ? Female : User)" />
                </el-icon>
              </div>
              <div class="voice-info">
                <div class="voice-name">{{ voice.voiceName }}</div>
                <div class="voice-meta">
                  <el-tag size="small" type="info">{{ voice.language }}</el-tag>
                </div>
              </div>
              <el-button
                class="preview-btn"
                circle
                size="small"
                :loading="previewingVoice === voice.id"
                @click.stop="previewVoiceAudio(voice.id)"
              >
                <el-icon><VideoPlay /></el-icon>
              </el-button>
            </div>
            <el-empty
              v-if="!loadingVoices && voiceList.length === 0"
              description="暂无可用音色"
              :image-size="60"
            />
          </div>
          <div v-if="selectedVoice" class="selected-voice-info">
            <span>已选择：{{ selectedVoice.voiceName }}</span>
          </div>
        </el-card>

        <!-- 参数调节 -->
        <el-card shadow="never" class="params-card">
          <template #header>
            <div class="card-header">
              <span>参数调节</span>
            </div>
          </template>
          <el-form :model="params" label-position="top" size="small">
            <el-form-item label="语速">
              <el-slider v-model="params.speed" :min="0.5" :max="2" :step="0.1" show-input />
            </el-form-item>
            <el-form-item label="语调">
              <el-slider v-model="params.pitch" :min="-10" :max="10" :step="1" show-input />
            </el-form-item>
            <el-form-item label="情感">
              <el-select v-model="params.emotion" style="width: 100%">
                <el-option label="平静" value="neutral" />
                <el-option label="开心" value="happy" />
                <el-option label="悲伤" value="sad" />
                <el-option label="愤怒" value="angry" />
                <el-option label="惊讶" value="surprise" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 文本输入（TTS模式专用） -->
        <el-card v-if="selectedMode === 'TEXT_TO_SPEECH'" shadow="never" class="text-input-card">
          <template #header>
            <div class="card-header">
              <span>文案内容</span>
            </div>
          </template>
          <el-input
            v-model="ttsText"
            type="textarea"
            :rows="4"
            placeholder="请输入需要配音的文本内容..."
            resize="none"
          />
          <div class="text-hint">字数：{{ ttsText.length }}</div>
        </el-card>

        <!-- 生成按钮 -->
        <div class="action-bar">
          <el-button
            type="primary"
            size="large"
            :loading="generating"
            :disabled="!canGenerate"
            @click="handleGenerate"
          >
            <el-icon><MagicStick /></el-icon>
            <span>{{ generating ? '生成中...' : '生成音频' }}</span>
          </el-button>
        </div>
      </div>

      <!-- 右侧：任务进度 + 结果预览 + 历史任务 -->
      <div class="right-panel">
        <!-- 当前任务 -->
        <el-card v-if="currentTask" shadow="never" class="current-task-card">
          <template #header>
            <div class="card-header">
              <span>当前任务</span>
              <el-tag :type="getStatusType(currentTask.status)" size="small">
                {{ getStatusText(currentTask.status) }}
              </el-tag>
            </div>
          </template>

          <div class="task-info">
            <div class="task-mode">
              <el-tag type="primary" size="small">{{ currentTask.modeName }}</el-tag>
            </div>
            <div v-if="currentTask.voiceName" class="task-voice">
              音色：{{ currentTask.voiceName }}
            </div>
            <div v-if="currentTask.sourceAudioName" class="task-source">
              来源：{{ currentTask.sourceAudioName }}
            </div>
          </div>

          <!-- 生成中 -->
          <div v-if="currentTask.status === 1" class="generating-state">
            <el-progress type="circle" :percentage="currentTask.progress" :width="100" />
            <p>AI 正在生成音频...</p>
          </div>

          <!-- 失败 -->
          <div v-else-if="currentTask.status === 3" class="error-state">
            <el-icon :size="36" color="#ef4444"><Warning /></el-icon>
            <p>生成失败</p>
            <p class="error-msg">{{ currentTask.errorMsg }}</p>
            <el-button type="primary" size="small" @click="handleRegenerate">重新生成</el-button>
          </div>

          <!-- 成功 -->
          <div v-else-if="currentTask.status === 2 && currentTask.resultAudioUrl" class="result-state">
            <div class="audio-player-wrapper">
              <audio
                ref="resultAudioRef"
                :src="currentTask.resultAudioUrl"
                controls
                class="audio-player"
              />
            </div>
            <div class="result-actions">
              <el-button type="primary" size="small" @click="downloadResult">
                <el-icon><Download /></el-icon>
                <span>下载音频</span>
              </el-button>
              <el-button size="small" @click="handleRegenerate">
                <el-icon><RefreshRight /></el-icon>
                <span>重新生成</span>
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 空状态提示 -->
        <el-card v-else shadow="never" class="empty-task-card">
          <el-empty description="选择音频和生成模式后开始创作" :image-size="100">
            <template #description>
              <div class="empty-desc">
                <p>1. 选择源音频（人声克隆/音色转换）</p>
                <p>2. 选择生成模式</p>
                <p>3. 选择目标音色</p>
                <p>4. 点击"生成音频"</p>
              </div>
            </template>
          </el-empty>
        </el-card>

        <!-- 历史任务 -->
        <el-card v-if="historyTasks.length > 0" shadow="never" class="history-card">
          <template #header>
            <div class="card-header">
              <span>历史任务</span>
              <el-tag size="small" type="info">{{ historyTasks.length }} 条</el-tag>
            </div>
          </template>
          <div class="history-list">
            <div
              v-for="t in historyTasks"
              :key="t.id"
              class="history-item"
              :class="{ active: currentTask && currentTask.id === t.id }"
              @click="loadHistory(t.id)"
            >
              <div class="history-info">
                <div class="history-mode">{{ t.modeName }}</div>
                <div class="history-time">{{ formatDate(t.createTime) }}</div>
              </div>
              <el-tag :type="getStatusType(t.status)" size="small">
                {{ getStatusText(t.status) }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 服务配置弹窗 -->
    <AiServiceConfig v-model="showConfig" service-type="TTS" @saved="onConfigSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Setting, Upload, Microphone, MagicStick, Warning, Download, RefreshRight,
  VideoPlay, Male, Female, User, Headset, Refresh, CircleCheck
} from '@element-plus/icons-vue'
import type { UploadInstance, UploadRequestOptions } from 'element-plus'
import { useAudioStore } from '@/stores/audio'
import { useVideoStore } from '@/stores/video'
import {
  createVoiceCloneTask,
  createTtsTask,
  createVoiceConversionTask,
  getAudioTaskResult,
  getAudioTaskList,
  regenerateAudioTask,
  previewVoice,
  downloadAudio,
  uploadAudio,
  type AudioItem,
  type AudioTaskItem,
  type VoiceItem,
  type AudioGenMode,
  type AudioTaskParams
} from '@/api/audio'
import AiServiceConfig from '@/components/AiServiceConfig.vue'

const audioStore = useAudioStore()
const videoStore = useVideoStore()

const uploadRef = ref<UploadInstance>()
const showConfig = ref(false)
const ttsConnected = ref(false)
const selectedMode = ref<AudioGenMode>('VOICE_CLONE')
const selectedAudios = ref<string[]>([])
const selectedVoiceId = ref('')
const previewingVoice = ref('')
const loadingVoices = ref(false)
const ttsText = ref('')
const generating = ref(false)
const currentTask = ref<AudioTaskItem | null>(null)
const historyTasks = ref<AudioTaskItem[]>([])
const currentProjectId = ref('')
const resultAudioRef = ref<HTMLAudioElement>()

const pollTimer = ref<number | null>(null)
const pollCount = ref(0)
const MAX_POLL_TIMES = 60

const params = reactive<AudioTaskParams>({
  speed: 1.0,
  pitch: 0,
  emotion: 'neutral'
})

const genModes = [
  {
    value: 'VOICE_CLONE' as AudioGenMode,
    name: '人声克隆',
    desc: '从音频提取音色特征，创建新音色',
    icon: Headset
  },
  {
    value: 'TEXT_TO_SPEECH' as AudioGenMode,
    name: '文案重配音',
    desc: '输入文本，生成指定音色的语音',
    icon: Microphone
  },
  {
    value: 'VOICE_CONVERSION' as AudioGenMode,
    name: '音色转换',
    desc: '将音频的音色转换为目标音色',
    icon: Refresh
  }
]

const audioList = computed(() => audioStore.audioList)
const voiceList = computed(() => audioStore.voiceList)

const selectedVoice = computed(() => {
  return voiceList.value.find(v => v.id === selectedVoiceId.value)
})

const canGenerate = computed(() => {
  if (generating.value) return false
  if (!selectedVoiceId.value) return false
  if (selectedMode.value === 'VOICE_CLONE') return selectedAudios.value.length >= 1
  if (selectedMode.value === 'TEXT_TO_SPEECH') return ttsText.value.trim().length >= 10
  if (selectedMode.value === 'VOICE_CONVERSION') return selectedAudios.value.length >= 1
  return false
})

const triggerUpload = () => {
  uploadRef.value?.$el.click()
}

const beforeUpload = (file: File) => {
  const isAudio = file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|flac|aac|m4a)$/i)
  if (!isAudio) {
    ElMessage.error('只能上传音频文件')
    return false
  }
  const isLt50M = file.size / 1024 / 1024 < 50
  if (!isLt50M) {
    ElMessage.error('音频文件大小不能超过 50MB')
    return false
  }
  return true
}

const handleUpload = async (options: UploadRequestOptions) => {
  if (!currentProjectId.value) {
    ElMessage.warning('项目信息缺失')
    return
  }
  try {
    const data: any = await uploadAudio(currentProjectId.value, options.file as File)
    ElMessage.success('上传成功')
    await audioStore.fetchAudioList(currentProjectId.value)
  } catch (e: any) {
    ElMessage.error(e.message || '上传失败')
  }
}

const isAudioSelected = (id: string) => selectedAudios.value.includes(id)

const toggleAudio = (id: string) => {
  const idx = selectedAudios.value.indexOf(id)
  if (idx > -1) {
    selectedAudios.value.splice(idx, 1)
  } else {
    if (selectedAudios.value.length >= 3) {
      ElMessage.warning('最多选择 3 个音频')
      return
    }
    selectedAudios.value.push(id)
  }
}

const selectMode = (mode: AudioGenMode) => {
  selectedMode.value = mode
  // TTS 模式不需要选择源音频
  if (mode === 'TEXT_TO_SPEECH') {
    selectedAudios.value = []
  }
}

const selectVoice = (id: string) => {
  selectedVoiceId.value = id
}

const previewVoiceAudio = async (id: string) => {
  previewingVoice.value = id
  try {
    const response: any = await previewVoice(id)
    const blob = new Blob([response.data], { type: 'audio/mp3' })
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.onended = () => URL.revokeObjectURL(url)
    audio.play()
  } catch (e: any) {
    ElMessage.error(e.message || '试听失败')
  } finally {
    previewingVoice.value = ''
  }
}

const refreshVoices = async () => {
  loadingVoices.value = true
  await audioStore.fetchVoiceList()
  loadingVoices.value = false
}

const handleGenerate = async () => {
  if (!currentProjectId.value) {
    ElMessage.warning('项目信息缺失')
    return
  }
  if (!selectedVoiceId.value) {
    ElMessage.warning('请选择音色')
    return
  }

  generating.value = true
  try {
    let res: any
    if (selectedMode.value === 'VOICE_CLONE') {
      res = await createVoiceCloneTask({
        projectId: currentProjectId.value,
        sourceAudioId: selectedAudios.value[0],
        voiceName: selectedVoice.value?.voiceName || '新音色'
      })
    } else if (selectedMode.value === 'TEXT_TO_SPEECH') {
      res = await createTtsTask({
        projectId: currentProjectId.value,
        text: ttsText.value,
        voiceId: selectedVoiceId.value,
        params
      })
    } else if (selectedMode.value === 'VOICE_CONVERSION') {
      res = await createVoiceConversionTask({
        projectId: currentProjectId.value,
        sourceAudioId: selectedAudios.value[0],
        voiceId: selectedVoiceId.value,
        params
      })
    }

    const taskId = String(res?.id || res?.taskId)
    currentTask.value = {
      id: taskId,
      projectId: currentProjectId.value,
      mode: selectedMode.value,
      modeName: getModeName(selectedMode.value),
      voiceId: selectedVoiceId.value,
      voiceName: selectedVoice.value?.voiceName || '',
      sourceAudioId: selectedAudios.value[0] || undefined,
      sourceAudioName: getAudioName(selectedAudios.value[0]),
      text: selectedMode.value === 'TEXT_TO_SPEECH' ? ttsText.value : undefined,
      params,
      status: 1,
      progress: 10,
      createTime: new Date().toISOString()
    }
    pollTask(taskId)
    loadHistoryList()
  } catch (e: any) {
    ElMessage.error(e.message || '创建任务失败')
    generating.value = false
  }
}

const handleRegenerate = async () => {
  if (!currentTask.value) return
  generating.value = true
  try {
    await regenerateAudioTask(currentTask.value.id)
    currentTask.value.status = 1
    currentTask.value.progress = 0
    pollTask(currentTask.value.id)
  } catch (e: any) {
    ElMessage.error(e.message || '重新生成失败')
    generating.value = false
  }
}

const stopPolling = () => {
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }
  pollCount.value = 0
}

const pollTask = (taskId: string) => {
  stopPolling()
  pollCount.value = 0
  pollTimer.value = window.setInterval(async () => {
    pollCount.value++
    if (pollCount.value > MAX_POLL_TIMES) {
      stopPolling()
      generating.value = false
      ElMessage.warning('生成超时，请稍后查看结果或重试')
      if (currentTask.value) {
        currentTask.value.status = 3
        currentTask.value.errorMsg = '生成超时'
      }
      return
    }
    try {
      const data: any = await getAudioTaskResult(taskId)
      currentTask.value = data
      if (data.status === 2 || data.status === 3) {
        stopPolling()
        generating.value = false
        if (data.status === 2) {
          ElMessage.success('生成完成')
        } else {
          ElMessage.error('生成失败')
        }
      }
    } catch {
      stopPolling()
      generating.value = false
    }
  }, 1500)
}

const loadHistory = async (id: string) => {
  try {
    const data: any = await getAudioTaskResult(id)
    currentTask.value = data
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  }
}

const loadHistoryList = async () => {
  if (!currentProjectId.value) return
  try {
    const data: any = await getAudioTaskList(currentProjectId.value)
    historyTasks.value = Array.isArray(data) ? data : data?.list || []
  } catch {
    historyTasks.value = []
  }
}

const downloadResult = async () => {
  if (!currentTask.value?.resultAudioId) return
  try {
    const response: any = await downloadAudio(currentTask.value.resultAudioId)
    const blob = new Blob([response.data], { type: 'audio/mp3' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = currentTask.value.resultAudioName || 'audio.mp3'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: any) {
    ElMessage.error(e.message || '下载失败')
  }
}

const onConfigSaved = () => {
  // 配置保存后重新检测连接
}

const getModeName = (mode: AudioGenMode) => {
  const m = genModes.find(x => x.value === mode)
  return m?.name || mode
}

const getAudioName = (id: string) => {
  const a = audioList.value.find(x => x.id === id)
  return a?.filename || ''
}

const getStatusType = (status: number): 'info' | 'warning' | 'success' | 'danger' => {
  const map: Record<number, 'info' | 'warning' | 'success' | 'danger'> = {
    0: 'info', 1: 'warning', 2: 'success', 3: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '待生成', 1: '生成中', 2: '已完成', 3: '失败'
  }
  return map[status] || '未知'
}

const formatDuration = (seconds: number) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

onMounted(async () => {
  await videoStore.fetchVideoList()
  if (videoStore.videoList.length > 0) {
    const firstVideo = videoStore.videoList[0] as any
    if (firstVideo?.projectId) {
      currentProjectId.value = String(firstVideo.projectId)
    }
  }
  if (currentProjectId.value) {
    await audioStore.fetchAudioList(currentProjectId.value)
    await audioStore.fetchVoiceList()
    loadHistoryList()
  }
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.audio-workspace {
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #0f172a;
}

.header-right {
  display: flex;
  gap: 8px;
}

.workspace-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 16px;
  align-items: flex-start;
}

.left-panel, .right-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 14px;
}

.audio-list {
  max-height: 200px;
  overflow-y: auto;
}

.audio-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.audio-item:hover {
  border-color: #60a5fa;
  background: #f0f9ff;
}

.audio-item.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.audio-thumb {
  width: 48px;
  height: 48px;
  background: #f1f5f9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-info {
  flex: 1;
  min-width: 0;
}

.audio-name {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.audio-meta {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.audio-meta .dot {
  margin: 0 6px;
}

.mode-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mode-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.mode-item:hover {
  border-color: #60a5fa;
  background: #f8fafc;
}

.mode-item.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.mode-icon {
  color: #2563eb;
}

.mode-info {
  flex: 1;
}

.mode-name {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.mode-desc {
  font-size: 11px;
  color: #94a3b8;
}

.voice-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.voice-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}

.voice-item:hover {
  border-color: #60a5fa;
}

.voice-item.selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.voice-icon {
  width: 36px;
  height: 36px;
  background: #f0f9ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
}

.voice-info {
  flex: 1;
  min-width: 0;
}

.voice-name {
  font-size: 12px;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.voice-meta {
  margin-top: 2px;
}

.preview-btn {
  position: absolute;
  top: 4px;
  right: 4px;
}

.selected-voice-info {
  margin-top: 8px;
  padding: 8px;
  background: #f0f9ff;
  border-radius: 6px;
  font-size: 12px;
  color: #3b82f6;
}

.text-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
}

.action-bar {
  display: flex;
  justify-content: center;
}

.action-bar .el-button {
  width: 100%;
}

.task-info {
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  margin-bottom: 12px;
}

.task-mode {
  margin-bottom: 4px;
}

.task-voice, .task-source {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.generating-state, .error-state {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.error-msg {
  color: #ef4444;
  font-size: 12px;
}

.audio-player-wrapper {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.audio-player {
  width: 100%;
}

.result-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: center;
}

.empty-task-card {
  min-height: 300px;
}

.empty-desc {
  color: #94a3b8;
  line-height: 1.8;
  font-size: 13px;
}

.empty-desc p {
  margin: 4px 0;
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.history-item:hover {
  background: #f8fafc;
}

.history-item.active {
  background: #eff6ff;
}

.history-mode {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
}

.history-time {
  font-size: 11px;
  color: #94a3b8;
}

@media (max-width: 1024px) {
  .workspace-content {
    grid-template-columns: 1fr;
  }
}
</style>