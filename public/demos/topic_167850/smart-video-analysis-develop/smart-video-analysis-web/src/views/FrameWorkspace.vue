<template>
  <div class="frame-workspace">
    <!-- 顶部工具栏 -->
    <div class="workspace-header">
      <div class="header-left">
        <h2 class="page-title">帧级创作工作台</h2>
        <el-tag :type="comfyConnected ? 'success' : 'info'" size="small">
          {{ comfyConnected ? 'ComfyUI 已连接' : 'ComfyUI 未连接' }}
        </el-tag>
      </div>
      <div class="header-right">
        <el-button @click="showConfig = true">
          <el-icon><Setting /></el-icon>
          <span>服务配置</span>
        </el-button>
        <el-button @click="testConnection" :loading="testingConn">
          <el-icon><Connection /></el-icon>
          <span>测试连接</span>
        </el-button>
      </div>
    </div>

    <div class="workspace-content">
      <!-- 左侧：视频选择 + 时间轴 + 帧缩略图 -->
      <div class="left-panel">
        <!-- 视频选择 -->
        <el-card shadow="never" class="video-select-card">
          <template #header>
            <div class="card-header">
              <span>源视频</span>
              <el-select
                v-model="selectedVideoId"
                placeholder="选择已解析视频"
                size="small"
                style="width: 200px"
                @change="handleVideoChange"
              >
                <el-option
                  v-for="v in analyzedVideos"
                  :key="v.id"
                  :label="v.filename"
                  :value="v.id"
                />
              </el-select>
            </div>
          </template>
          <el-empty
            v-if="analyzedVideos.length === 0"
            description="暂无已解析视频"
            :image-size="80"
          >
            <el-button type="primary" size="small" @click="goToUpload">去上传视频</el-button>
          </el-empty>
          <div v-else-if="!selectedVideoId" class="placeholder-text">
            请选择一个已解析视频
          </div>
        </el-card>

        <!-- 时间轴 -->
        <el-card v-if="selectedVideoId" shadow="never" class="timeline-card">
          <template #header>
            <div class="card-header">
              <span>时间轴 / 帧选择</span>
              <el-button text size="small" @click="loadFrames" :loading="loadingFrames">
                刷新帧列表
              </el-button>
            </div>
          </template>
          <div class="timeline-wrapper">
            <div class="timeline-track">
              <div class="timeline-bar">
                <div
                  v-for="frame in frameList"
                  :key="frame.frameId"
                  class="frame-marker"
                  :class="{ selected: isFrameSelected(frame.frameId) }"
                  :style="{ left: getMarkerPosition(frame.timestampMs) + '%' }"
                  :title="formatTime(frame.timestampMs)"
                  @click="toggleFrameSelect(frame)"
                ></div>
              </div>
              <div class="timeline-labels">
                <span>0:00</span>
                <span>{{ formatTime(videoDurationMs) }}</span>
              </div>
            </div>
          </div>

          <!-- 帧缩略图网格 -->
          <div v-loading="loadingFrames" class="frames-grid">
            <div
              v-for="frame in frameList"
              :key="frame.frameId"
              class="frame-thumb"
              :class="{ selected: isFrameSelected(frame.frameId) }"
              @click="toggleFrameSelect(frame)"
            >
              <div class="thumb-placeholder">
                <el-icon :size="28"><Picture /></el-icon>
              </div>
              <div class="frame-time">{{ formatTime(frame.timestampMs) }}</div>
              <div v-if="frame.sceneTags" class="frame-tags">
                <el-tag
                  v-for="(tag, i) in frame.sceneTags.split(',').slice(0, 2)"
                  :key="i"
                  size="small"
                  type="info"
                >{{ tag }}</el-tag>
              </div>
              <div class="select-indicator">
                <el-icon v-if="isFrameSelected(frame.frameId)" color="#fff" :size="14"><Check /></el-icon>
              </div>
            </div>
            <el-empty
              v-if="!loadingFrames && frameList.length === 0"
              description="暂无关键帧"
              :image-size="60"
            />
          </div>

          <div class="selection-info">
            <el-tag type="primary" size="small">已选 {{ selectedFrames.length }} 帧</el-tag>
            <el-button text size="small" @click="clearSelection">清空选择</el-button>
          </div>
        </el-card>
      </div>

      <!-- 右侧：生成模式 + 参数 + 结果 -->
      <div class="right-panel">
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
            </div>
          </div>
        </el-card>

        <!-- 参数设置 -->
        <el-card shadow="never" class="params-card">
          <template #header>
            <div class="card-header">
              <span>生成参数</span>
            </div>
          </template>
          <el-form :model="params" label-position="top" size="small">
            <el-form-item label="分辨率">
              <el-select v-model="params.resolution" style="width: 100%">
                <el-option label="512 × 512" :value="512" />
                <el-option label="768 × 768" :value="768" />
                <el-option label="1024 × 1024" :value="1024" />
              </el-select>
            </el-form-item>
            <el-form-item label="采样步数 (Steps)">
              <el-slider v-model="params.steps" :min="1" :max="50" show-input />
            </el-form-item>
            <el-form-item label="CFG Scale">
              <el-slider v-model="params.cfg" :min="1" :max="20" :step="0.5" show-input />
            </el-form-item>
            <el-form-item label="采样器">
              <el-select v-model="params.sampler" style="width: 100%">
                <el-option label="Euler" value="euler" />
                <el-option label="Euler a" value="euler_ancestral" />
                <el-option label="DPM++ 2M" value="dpmpp_2m" />
                <el-option label="DPM++ SDE" value="dpmpp_sde" />
              </el-select>
            </el-form-item>
            <el-form-item label="随机种子">
              <el-input-number v-model="params.seed" :min="-1" :max="999999" style="width: 100%" />
              <div class="seed-hint">-1 表示随机</div>
            </el-form-item>
            <el-form-item label="提示词 (Prompt)">
              <el-input v-model="params.prompt" type="textarea" :rows="3" placeholder="描述你想要生成的画面" />
            </el-form-item>
            <el-form-item label="负向提示词">
              <el-input v-model="params.negativePrompt" type="textarea" :rows="2" />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 操作按钮 -->
        <div class="action-bar">
          <el-button
            type="primary"
            size="large"
            :loading="generating"
            :disabled="!canGenerate"
            @click="handleGenerate"
          >
            <el-icon><MagicStick /></el-icon>
            <span>{{ generating ? '生成中...' : '开始生成' }}</span>
          </el-button>
        </div>

        <!-- 结果预览 -->
        <el-card v-if="currentTask" shadow="never" class="result-card">
          <template #header>
            <div class="card-header">
              <span>生成结果</span>
              <el-tag :type="getStatusType(currentTask.status)" size="small">
                {{ getStatusText(currentTask.status) }}
              </el-tag>
            </div>
          </template>

          <div v-if="currentTask.status === 1" class="generating-state">
            <el-progress type="circle" :percentage="currentTask.progress" :width="100" />
            <p>AI 正在生成...</p>
          </div>

          <div v-else-if="currentTask.status === 3" class="error-state">
            <el-icon :size="36" color="#ef4444"><Warning /></el-icon>
            <p>生成失败</p>
            <p class="error-msg">{{ currentTask.errorMsg }}</p>
            <el-button type="primary" size="small" @click="handleRegenerate">重新生成</el-button>
          </div>

          <div v-else-if="currentTask.status === 2 && currentTask.results" class="results-grid">
            <div v-for="r in currentTask.results" :key="r.index" class="result-item">
              <div class="result-thumb" :class="{ 'is-video': r.type === 'video' }">
                <el-icon :size="32"><component :is="r.type === 'video' ? VideoPlay : Picture" /></el-icon>
              </div>
              <div class="result-info">
                <div class="result-filename">{{ r.filename }}</div>
                <div class="result-meta">
                  <el-tag size="small">{{ r.type === 'video' ? '视频' : '图片' }}</el-tag>
                  <span v-if="r.resolution">{{ r.resolution }}</span>
                  <span v-if="r.duration">{{ r.duration }}</span>
                </div>
                <el-button text size="small" type="primary">下载</el-button>
              </div>
            </div>
          </div>
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
                <div class="history-mode">{{ getModeName(t.mode) }}</div>
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

    <AiServiceConfig v-model="showConfig" @saved="onConfigSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Setting, Connection, Picture, Check, MagicStick, Warning, VideoPlay,
  EditPen, Refresh, DataAnalysis
} from '@element-plus/icons-vue'
import { useVideoStore } from '@/stores/video'
import type { VideoItem } from '@/api/video'
import {
  createFrameTask,
  getFrameTaskResult,
  getFrameTaskList,
  regenerateFrameTask,
  extractFrames,
  testComfyUi,
  type FrameInfo,
  type FrameGenMode,
  type FrameTaskParams,
  type FrameTaskVO
} from '@/api/frame'
import AiServiceConfig from '@/components/AiServiceConfig.vue'

const router = useRouter()
const videoStore = useVideoStore()

const showConfig = ref(false)
const comfyConnected = ref(false)
const testingConn = ref(false)
const selectedVideoId = ref('')
const videoDurationMs = ref(0)
const frameList = ref<FrameInfo[]>([])
const loadingFrames = ref(false)
const selectedFrames = ref<FrameInfo[]>([])
const selectedMode = ref<FrameGenMode>('SINGLE_REDRAW')
const generating = ref(false)
const currentTask = ref<FrameTaskVO | null>(null)
const historyTasks = ref<any[]>([])
const currentProjectId = ref('')

const pollTimer = ref<number | null>(null)
const pollCount = ref(0)
const MAX_POLL_TIMES = 60

const params = reactive<FrameTaskParams>({
  resolution: 512,
  steps: 20,
  cfg: 8,
  sampler: 'euler',
  scheduler: 'normal',
  seed: -1,
  prompt: '',
  negativePrompt: 'lowres, bad anatomy, bad hands, text, error, worst quality, low quality',
  model: 'v1-5-pruned-emaonly.ckpt',
  denoise: 1.0
})

const genModes = [
  { value: 'SINGLE_REDRAW' as FrameGenMode, name: '单帧重绘', desc: '对选中的单帧进行 AI 重绘', icon: EditPen },
  { value: 'START_END_FUSION' as FrameGenMode, name: '首尾帧融合', desc: '基于首尾帧生成过渡视频', icon: Refresh },
  { value: 'SEGMENT_REMAKE' as FrameGenMode, name: '片段重制', desc: '重制选中片段的画面风格', icon: MagicStick },
  { value: 'MULTI_SEGMENT_FUSION' as FrameGenMode, name: '多片段融合', desc: '融合多个片段生成新画面', icon: DataAnalysis }
]

const analyzedVideos = computed(() => {
  return (videoStore.videoList || []).filter((v: VideoItem) => v.status === 2)
})

const canGenerate = computed(() => {
  if (generating.value) return false
  if (selectedMode.value === 'SINGLE_REDRAW') return selectedFrames.value.length >= 1
  if (selectedMode.value === 'START_END_FUSION') return selectedFrames.value.length >= 2
  if (selectedMode.value === 'SEGMENT_REMAKE') return selectedFrames.value.length >= 1
  if (selectedMode.value === 'MULTI_SEGMENT_FUSION') return selectedFrames.value.length >= 2
  return false
})

const goToUpload = () => router.push('/video-upload')

const handleVideoChange = (videoId: string) => {
  selectedFrames.value = []
  frameList.value = []
  if (videoId) {
    loadFrames()
  }
}

const loadFrames = async () => {
  if (!selectedVideoId.value) return
  loadingFrames.value = true
  try {
    const data: any = await extractFrames({ videoId: selectedVideoId.value })
    frameList.value = data.frames || []
    const v = analyzedVideos.value.find((x: VideoItem) => x.id === selectedVideoId.value)
    videoDurationMs.value = (v?.duration || 0) * 1000
  } catch (e: any) {
    ElMessage.error(e.message || '加载帧失败')
  } finally {
    loadingFrames.value = false
  }
}

const isFrameSelected = (id: string) => selectedFrames.value.some(f => f.frameId === id)

const toggleFrameSelect = (frame: FrameInfo) => {
  const idx = selectedFrames.value.findIndex(f => f.frameId === frame.frameId)
  if (idx > -1) {
    selectedFrames.value.splice(idx, 1)
  } else {
    if (selectedMode.value === 'SINGLE_REDRAW' && selectedFrames.value.length >= 4) {
      ElMessage.warning('单帧重绘最多选择 4 帧')
      return
    }
    selectedFrames.value.push(frame)
  }
}

const clearSelection = () => {
  selectedFrames.value = []
}

const selectMode = (mode: FrameGenMode) => {
  selectedMode.value = mode
  if (mode === 'START_END_FUSION' && selectedFrames.value.length > 2) {
    selectedFrames.value = selectedFrames.value.slice(0, 2)
    ElMessage.info('首尾帧融合只需选择 2 帧')
  }
}

const getMarkerPosition = (ms: number) => {
  if (videoDurationMs.value <= 0) return 0
  return Math.min(100, (ms / videoDurationMs.value) * 100)
}

const formatTime = (ms: number) => {
  if (!ms || ms < 0) return '0:00'
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const getStatusType = (status: number) => {
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

const getModeName = (mode: string) => {
  const m = genModes.find(x => x.value === mode)
  return m?.name || mode
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

const handleGenerate = async () => {
  if (!currentProjectId.value) {
    ElMessage.warning('项目信息缺失')
    return
  }
  generating.value = true
  try {
    const seed = params.seed !== undefined && params.seed >= 0 ? params.seed : Math.floor(Math.random() * 1000000)
    const res: any = await createFrameTask({
      projectId: currentProjectId.value,
      videoId: selectedVideoId.value,
      mode: selectedMode.value,
      sourceFrames: selectedFrames.value,
      params: { ...params, seed }
    })
    const taskId = String(res.id)
    currentTask.value = {
      id: taskId,
      projectId: currentProjectId.value,
      videoId: selectedVideoId.value,
      mode: selectedMode.value,
      modeName: getModeName(selectedMode.value),
      params,
      sourceFrames: selectedFrames.value,
      results: [],
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
    await regenerateFrameTask(currentTask.value.id)
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
      const data: any = await getFrameTaskResult(taskId)
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
    const data: any = await getFrameTaskResult(id)
    currentTask.value = data
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  }
}

const loadHistoryList = async () => {
  if (!currentProjectId.value) return
  try {
    const data: any = await getFrameTaskList(currentProjectId.value)
    historyTasks.value = Array.isArray(data) ? data : []
  } catch {
    historyTasks.value = []
  }
}

const testConnection = async () => {
  testingConn.value = true
  try {
    const data: any = await testComfyUi()
    comfyConnected.value = data.connected
    if (data.connected) {
      ElMessage.success('ComfyUI 连接成功')
    } else {
      ElMessage.warning(data.message || 'ComfyUI 未连接')
    }
  } catch (e: any) {
    comfyConnected.value = false
    ElMessage.error(e.message || '测试失败')
  } finally {
    testingConn.value = false
  }
}

const onConfigSaved = () => {
  testConnection()
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
    loadHistoryList()
  }
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.frame-workspace {
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

.placeholder-text {
  color: #94a3b8;
  text-align: center;
  padding: 24px;
  font-size: 14px;
}

.timeline-wrapper {
  padding: 8px 0;
}

.timeline-track {
  margin-bottom: 12px;
}

.timeline-bar {
  position: relative;
  height: 32px;
  background: #f1f5f9;
  border-radius: 6px;
  cursor: pointer;
}

.frame-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #60a5fa;
  border: 2px solid #fff;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s;
}

.frame-marker:hover {
  transform: translate(-50%, -50%) scale(1.3);
}

.frame-marker.selected {
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.timeline-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
  font-family: monospace;
}

.frames-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  margin-top: 12px;
  min-height: 80px;
}

.frame-thumb {
  position: relative;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s;
  background: #fff;
}

.frame-thumb:hover {
  border-color: #60a5fa;
}

.frame-thumb.selected {
  border-color: #ef4444;
}

.thumb-placeholder {
  width: 100%;
  aspect-ratio: 16/9;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.frame-time {
  padding: 2px 4px;
  font-size: 10px;
  color: #64748b;
  font-family: monospace;
  text-align: center;
}

.frame-tags {
  padding: 2px 4px;
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
}

.select-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  background: #ef4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
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

.seed-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.action-bar {
  display: flex;
  justify-content: center;
}

.action-bar .el-button {
  width: 100%;
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

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.result-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.result-thumb {
  width: 100%;
  aspect-ratio: 16/9;
  background: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.result-thumb.is-video {
  background: #0f172a;
}

.result-info {
  padding: 8px;
  font-size: 12px;
}

.result-filename {
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-meta {
  display: flex;
  gap: 4px;
  align-items: center;
  color: #94a3b8;
  margin: 4px 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
