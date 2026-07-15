<template>
  <div class="fusion-page">
    <div class="page-header">
      <div class="header-title">
        <el-icon :size="28" color="#60a5fa"><MagicStick /></el-icon>
        <h2>多视频融合创作</h2>
      </div>
      <p class="header-desc">选择多个已解析视频，AI 智能生成融合创作方案</p>
    </div>

    <div class="main-content">
      <div class="left-section">
        <el-card class="video-select-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>选择视频</span>
              <el-tag type="info" size="small">已选 {{ selectedVideos.length }} / 4</el-tag>
            </div>
          </template>

          <div class="video-list">
            <div
              v-for="video in analyzedVideos"
              :key="video.id"
              class="video-item"
              :class="{ selected: isSelected(video.id) }"
              @click="toggleVideo(video.id)"
            >
              <div class="video-checkbox">
                <el-checkbox :model-value="isSelected(video.id)" disabled />
              </div>
              <div class="video-thumb">
                <el-icon :size="32" color="#94a3b8"><VideoCamera /></el-icon>
              </div>
              <div class="video-info">
                <div class="video-name">{{ video.filename }}</div>
                <div class="video-meta">
                  <span>{{ formatDuration(video.duration || 0) }}</span>
                  <span class="dot">·</span>
                  <span>{{ formatFileSize(video.fileSize || 0) }}</span>
                </div>
              </div>
              <div class="video-status">
                <el-tag type="success" size="small">已解析</el-tag>
              </div>
            </div>

            <el-empty v-if="analyzedVideos.length === 0" description="暂无已解析视频" :image-size="80">
              <el-button type="primary" size="small" @click="goToUpload">去上传视频</el-button>
            </el-empty>
          </div>
        </el-card>

        <el-card class="mode-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>融合模式</span>
            </div>
          </template>

          <div class="mode-list">
            <div
              v-for="mode in fusionModes"
              :key="mode.value"
              class="mode-item"
              :class="{ active: selectedMode === mode.value }"
              @click="selectedMode = mode.value"
            >
              <div class="mode-icon">
                <el-icon :size="24"><component :is="mode.icon" /></el-icon>
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

        <div class="action-bar">
          <el-button
            type="primary"
            size="large"
            :disabled="selectedVideos.length < 2 || generating"
            :loading="generating"
            @click="generateFusion"
          >
            <el-icon><MagicStick /></el-icon>
            <span>{{ generating ? '生成中...' : '生成融合创作方案' }}</span>
          </el-button>
        </div>
      </div>

      <div class="right-section">
        <el-card class="result-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>融合结果</span>
              <div v-if="currentResult" class="result-header-actions">
                <el-tag :type="getStatusType(currentResult.status)" size="small">
                  {{ getStatusText(currentResult.status) }}
                </el-tag>
                <el-button
                  v-if="currentResult.status === 2"
                  text
                  size="small"
                  @click="regenerate"
                >
                  重新生成
                </el-button>
              </div>
            </div>
          </template>

          <div v-if="!currentResult" class="empty-result">
            <el-empty description="选择视频后生成融合方案" :image-size="100">
              <template #description>
                <div class="empty-desc">
                  <p>选择 2-4 个已解析视频</p>
                  <p>选择一种融合模式</p>
                  <p>点击"生成融合创作方案"</p>
                </div>
              </template>
            </el-empty>
          </div>

          <div v-else-if="currentResult.status === 1" class="generating-result">
            <el-progress type="circle" :percentage="currentResult.progress" :width="120" />
            <p class="generating-text">AI 正在生成融合方案...</p>
            <p class="generating-tip">请稍候，大约需要几秒钟</p>
          </div>

          <div v-else-if="currentResult.status === 3" class="error-result">
            <el-icon :size="48" color="#ef4444"><Warning /></el-icon>
            <p class="error-text">生成失败</p>
            <p class="error-msg">{{ currentResult.errorMsg }}</p>
            <el-button type="primary" @click="regenerate">重新生成</el-button>
          </div>

          <div v-else class="result-content">
            <div class="result-meta">
              <div class="meta-item">
                <span class="meta-label">融合模式</span>
                <el-tag size="small">{{ currentResult.fusionModeName }}</el-tag>
              </div>
              <div class="meta-item">
                <span class="meta-label">来源视频</span>
                <div class="source-tags">
                  <el-tag
                    v-for="(name, idx) in currentResult.sourceVideos"
                    :key="idx"
                    :type="getSourceTagType(idx)"
                    size="small"
                    effect="light"
                  >
                    {{ getSourceLabel(idx) }} {{ name }}
                  </el-tag>
                </div>
              </div>
            </div>

            <el-tabs v-model="activeTab" class="result-tabs">
              <el-tab-pane label="脚本大纲" name="script">
                <div class="script-outline" v-html="renderMarkdown(currentResult.scriptOutline || '')"></div>
              </el-tab-pane>

              <el-tab-pane label="镜头建议" name="shots">
                <div class="shot-list">
                  <div
                    v-for="shot in currentResult.shotSuggestions"
                    :key="shot.index"
                    class="shot-item"
                  >
                    <div class="shot-header">
                      <el-tag type="primary" size="small">镜头 {{ shot.index }}</el-tag>
                      <span class="shot-type">{{ shot.shotType }}</span>
                      <el-tag size="small" effect="plain">{{ shot.duration }}</el-tag>
                    </div>
                    <div class="shot-desc">{{ shot.description }}</div>
                    <div class="shot-tags">
                      <el-tag
                        v-for="tag in shot.tags.split(',').filter(Boolean)"
                        :key="tag"
                        size="small"
                        type="info"
                        effect="light"
                      >
                        {{ tag }}
                      </el-tag>
                    </div>
                    <div class="shot-source">
                      <el-icon><VideoCamera /></el-icon>
                      <span>{{ shot.sourceVideoName }}</span>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-card>

        <el-card v-if="historyList.length > 0" class="history-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>历史记录</span>
              <el-tag size="small" type="info">{{ historyList.length }} 条</el-tag>
            </div>
          </template>
          <div class="history-list">
            <div
              v-for="item in historyList"
              :key="item.id"
              class="history-item"
              :class="{ active: currentResult && currentResult.id === item.id }"
              @click="loadHistory(item.id)"
            >
              <div class="history-info">
                <div class="history-mode">{{ getModeName(item.fusionMode) }}</div>
                <div class="history-time">{{ formatDate(item.createTime) }}</div>
              </div>
              <el-tag :type="getStatusType(item.status)" size="small">
                {{ getStatusText(item.status) }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  MagicStick,
  VideoCamera,
  Warning,
  EditPen,
  Picture,
  DataAnalysis
} from '@element-plus/icons-vue'
import { useVideoStore } from '@/stores/video'
import type { VideoItem } from '@/api/video'
import {
  createFusionTask,
  getFusionResult,
  getFusionTaskList,
  regenerateFusion,
  type FusionTaskItem
} from '@/api/fusion'

const videoStore = useVideoStore()
const router = useRouter()
const selectedVideos = ref<string[]>([])
const selectedMode = ref('SCRIPT_COMPLEMENT')
const generating = ref(false)
const currentResult = ref<FusionTaskItem | null>(null)
const historyList = ref<any[]>([])
const activeTab = ref('script')
const currentProjectId = ref('')
const pollTimer = ref<number | null>(null)
const pollCount = ref(0)
const MAX_POLL_TIMES = 60

const fusionModes = [
  {
    value: 'SCRIPT_COMPLEMENT',
    name: '脚本取长补短',
    desc: '整合各视频内容优势，互补构建完整叙事',
    icon: EditPen
  },
  {
    value: 'SHOT_STYLE',
    name: '镜头风格融合',
    desc: '融合多部视频的镜头语言特色，形成统一视觉风格',
    icon: Picture
  },
  {
    value: 'CONTENT_RESTRUCTURE',
    name: '内容整合重构',
    desc: '打破原有叙事顺序，按主题逻辑重新组织内容',
    icon: DataAnalysis
  }
]

const analyzedVideos = computed(() => {
  return (videoStore.videoList || []).filter((v: VideoItem) => v.status === 2)
})

const goToUpload = () => {
  router.push('/video-upload')
}

const isSelected = (id: string) => selectedVideos.value.includes(id)

const toggleVideo = (id: string) => {
  const idx = selectedVideos.value.indexOf(id)
  if (idx > -1) {
    selectedVideos.value.splice(idx, 1)
  } else {
    if (selectedVideos.value.length >= 4) {
      ElMessage.warning('最多选择 4 个视频')
      return
    }
    selectedVideos.value.push(id)
  }
}

const generateFusion = async () => {
  if (selectedVideos.value.length < 2) {
    ElMessage.warning('请至少选择 2 个视频')
    return
  }

  generating.value = true
  try {
    const res: any = await createFusionTask({
      projectId: currentProjectId.value,
      videoIds: selectedVideos.value,
      fusionMode: selectedMode.value
    })
    const taskId = res.id
    currentResult.value = {
      id: taskId,
      projectId: currentProjectId.value,
      fusionMode: selectedMode.value,
      fusionModeName: getModeName(selectedMode.value),
      scriptOutline: '',
      shotSuggestions: [],
      sourceVideos: selectedVideos.value.map(id => {
        const v = analyzedVideos.value.find((x: VideoItem) => x.id === id)
        return v?.filename || ''
      }),
      status: 1,
      progress: 10,
      errorMsg: '',
      createTime: new Date().toISOString()
    }

    pollProgress(taskId)
    loadHistoryList()
  } catch (e: any) {
    ElMessage.error(e.message || '创建融合任务失败')
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

const pollProgress = (taskId: string) => {
  stopPolling()
  pollCount.value = 0
  pollTimer.value = window.setInterval(async () => {
    pollCount.value++
    if (pollCount.value > MAX_POLL_TIMES) {
      stopPolling()
      generating.value = false
      ElMessage.warning('生成超时，请稍后查看结果或重试')
      if (currentResult.value) {
        currentResult.value.status = 3
        currentResult.value.errorMsg = '生成超时'
      }
      return
    }
    try {
      const data: any = await getFusionResult(taskId)
      currentResult.value = data

      if (data.status === 2 || data.status === 3) {
        stopPolling()
        generating.value = false
        if (data.status === 2) {
          ElMessage.success('融合方案生成成功')
        } else {
          ElMessage.error('融合方案生成失败')
        }
      }
    } catch {
      stopPolling()
      generating.value = false
    }
  }, 1500)
}

const regenerate = async () => {
  if (!currentResult.value) return
  generating.value = true
  try {
    await regenerateFusion(currentResult.value.id)
    currentResult.value.status = 1
    currentResult.value.progress = 0
    pollProgress(currentResult.value.id)
  } catch (e: any) {
    ElMessage.error(e.message || '重新生成失败')
    generating.value = false
  }
}

const loadHistory = async (id: string) => {
  try {
    const data: any = await getFusionResult(id)
    currentResult.value = data
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  }
}

const loadHistoryList = async () => {
  if (!currentProjectId.value) return
  try {
    const data: any = await getFusionTaskList(currentProjectId.value)
    historyList.value = data || []
  } catch {
    historyList.value = []
  }
}

const getModeName = (mode: string) => {
  const map: Record<string, string> = {
    SCRIPT_COMPLEMENT: '脚本取长补短',
    SHOT_STYLE: '镜头风格融合',
    CONTENT_RESTRUCTURE: '内容整合重构'
  }
  return map[mode] || mode
}

const getStatusType = (status: number): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<number, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    0: 'info',
    1: 'warning',
    2: 'success',
    3: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '待生成',
    1: '生成中',
    2: '已完成',
    3: '失败'
  }
  return map[status] || status.toString()
}

const getSourceTagType = (idx: number) => {
  const types = ['primary', 'success', 'warning', 'info']
  return types[idx % types.length] as any
}

const getSourceLabel = (idx: number) => {
  const labels = ['[主视频]', '[素材A]', '[素材B]', '[素材C]']
  return labels[idx] || ''
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
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const renderMarkdown = (text: string) => {
  let html = text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
  return `<p>${html}</p>`
}

onMounted(async () => {
  const projects = await videoStore.fetchVideoList()
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
.fusion-page {
  width: 100%;
  padding: 24px;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 24px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.header-title h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1e293b;
}

.header-desc {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  padding-left: 40px;
}

.main-content {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.video-select-card,
.mode-card {
  margin-bottom: 16px;
}

.video-list {
  max-height: 340px;
  overflow-y: auto;
}

.video-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.video-item:hover {
  border-color: #60a5fa;
  background: #f0f9ff;
}

.video-item.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.video-thumb {
  width: 56px;
  height: 40px;
  background: #f1f5f9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.video-info {
  flex: 1;
  min-width: 0;
}

.video-name {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.video-meta {
  font-size: 12px;
  color: #94a3b8;
}

.video-meta .dot {
  margin: 0 6px;
}

.mode-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mode-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-item:hover {
  border-color: #60a5fa;
}

.mode-item.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.mode-icon {
  width: 40px;
  height: 40px;
  background: #f0f9ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  flex-shrink: 0;
}

.mode-info {
  flex: 1;
  min-width: 0;
}

.mode-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.mode-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
}

.action-bar {
  padding: 16px 0;
}

.action-bar .el-button {
  width: 100%;
  height: 48px;
  font-size: 15px;
  border-radius: 8px;
}

.result-card {
  min-height: 500px;
}

.result-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.empty-result {
  padding: 60px 0;
}

.empty-desc {
  color: #94a3b8;
  line-height: 2;
  margin: 0;
}

.empty-desc p {
  margin: 4px 0;
}

.generating-result {
  padding: 60px 0;
  text-align: center;
}

.generating-text {
  margin-top: 20px;
  font-size: 16px;
  color: #1e293b;
  font-weight: 500;
}

.generating-tip {
  margin-top: 8px;
  font-size: 13px;
  color: #94a3b8;
}

.error-result {
  padding: 60px 0;
  text-align: center;
}

.error-text {
  margin-top: 16px;
  font-size: 16px;
  color: #ef4444;
  font-weight: 500;
}

.error-msg {
  margin: 8px 0 20px;
  font-size: 13px;
  color: #94a3b8;
}

.result-content {
  padding-top: 8px;
}

.result-meta {
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.meta-item:last-child {
  margin-bottom: 0;
}

.meta-label {
  font-size: 13px;
  color: #64748b;
  width: 70px;
  flex-shrink: 0;
  line-height: 24px;
}

.source-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.result-tabs {
  margin-top: 8px;
}

.script-outline {
  font-size: 14px;
  line-height: 1.8;
  color: #334155;
  padding: 8px 4px;
}

.script-outline :deep(h1) {
  font-size: 20px;
  font-weight: 600;
  margin: 16px 0 12px;
  color: #1e293b;
}

.script-outline :deep(h2) {
  font-size: 17px;
  font-weight: 600;
  margin: 16px 0 10px;
  color: #1e293b;
}

.script-outline :deep(h3) {
  font-size: 15px;
  font-weight: 600;
  margin: 12px 0 8px;
  color: #334155;
}

.script-outline :deep(strong) {
  color: #1e293b;
}

.script-outline :deep(li) {
  margin-left: 20px;
  margin-bottom: 4px;
}

.script-outline :deep(p) {
  margin: 8px 0;
}

.shot-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 4px;
}

.shot-item {
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.shot-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.shot-type {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  flex: 1;
}

.shot-desc {
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 10px;
}

.shot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.shot-source {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #94a3b8;
}

.history-card {
  margin-top: 16px;
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 4px;
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
  color: #334155;
  margin-bottom: 2px;
}

.history-time {
  font-size: 12px;
  color: #94a3b8;
}
</style>
