<template>
  <div class="analysis-result-page">
    <div class="page-header">
      <el-button @click="goBack" :icon="ArrowLeft" plain>
        返回
      </el-button>
      <div class="title-section">
        <h1 class="page-title">解析结果详情</h1>
        <p class="page-subtitle" v-if="resultDetail?.video">{{ resultDetail.video.filename }}</p>
      </div>
    </div>

    <div class="content-container">
      <div class="left-column">
        <div class="video-player-card">
          <div class="video-wrapper" ref="videoWrapper">
            <video
              ref="videoRef"
              class="video-element"
              :src="resultDetail?.videoUrl"
              controls
              @timeupdate="onVideoTimeUpdate"
              @loadedmetadata="onVideoLoaded"
            >
              您的浏览器不支持视频播放
            </video>
          </div>

          <div class="video-progress" v-if="transcriptList.length > 0">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
              <div
                v-for="(item, index) in transcriptList"
                :key="index"
                class="timeline-marker"
                :style="{ left: getMarkerPosition(item.timestampMs) + '%' }"
                :title="item.text"
              ></div>
            </div>
            <div class="time-labels">
              <span>{{ formatTime(0) }}</span>
              <span>{{ formatTime(videoDuration * 1000) }}</span>
            </div>
          </div>

          <div class="video-info-bar">
            <div class="info-item">
              <el-icon><Monitor /></el-icon>
              <span>{{ resultDetail?.video?.width }} x {{ resultDetail?.video?.height }}</span>
            </div>
            <div class="info-divider"></div>
            <div class="info-item">
              <el-icon><Timer /></el-icon>
              <span>{{ formatDuration(resultDetail?.video?.duration) }}</span>
            </div>
            <div class="info-divider"></div>
            <div class="info-item">
              <el-icon><Folder /></el-icon>
              <span>{{ formatFileSize(resultDetail?.video?.fileSize) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="right-column">
        <el-collapse v-model="activeCollapse">
          <el-collapse-item name="summary">
            <template #title>
              <div class="collapse-title">
                <el-icon class="title-icon"><Document /></el-icon>
                <span>内容摘要</span>
              </div>
            </template>
            <div class="summary-container">
              <p class="summary-text">{{ resultDetail?.analysis?.summary || '暂无摘要' }}</p>
              <div class="summary-stats" v-if="resultDetail?.analysis">
                <div class="stat-item">
                  <div class="stat-value">{{ transcriptList.length }}</div>
                  <div class="stat-label">转写片段</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ framesList.length }}</div>
                  <div class="stat-label">关键帧</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ formatDuration(resultDetail?.video?.duration) }}</div>
                  <div class="stat-label">视频时长</div>
                </div>
              </div>
            </div>
          </el-collapse-item>

          <el-collapse-item name="transcript">
            <template #title>
              <div class="collapse-title">
                <el-icon class="title-icon"><Microphone /></el-icon>
                <span>音频转写文案</span>
              </div>
            </template>
            <div class="transcript-container">
              <div
                v-for="(item, index) in transcriptList"
                :key="index"
                class="transcript-line"
                :class="{ active: isCurrentTranscript(item) }"
                @click="jumpToTimestamp(item.timestampMs)"
              >
                <span class="transcript-timestamp">[{{ item.startTime }}]</span>
                <div class="transcript-content">
                  <el-tag 
                    v-if="item.speaker" 
                    size="small" 
                    :type="getSpeakerTagType(item.speaker)"
                    effect="light"
                    class="speaker-tag"
                  >
                    {{ item.speaker }}
                  </el-tag>
                  <span class="transcript-text">{{ item.text }}</span>
                </div>
              </div>
              <el-empty v-if="transcriptList.length === 0" description="暂无转写文案" :image-size="80" />
            </div>
          </el-collapse-item>

          <el-collapse-item name="frames">
            <template #title>
              <div class="collapse-title">
                <el-icon class="title-icon"><Grid /></el-icon>
                <span>逐帧画面分析</span>
              </div>
            </template>
            <div class="frames-grid">
              <div
                v-for="(frame, index) in framesList"
                :key="frame.id"
                class="frame-item"
                @click="jumpToTimestamp(frame.timestampMs)"
              >
                <div class="frame-thumbnail">
                  <img :src="frame.storagePath" alt="关键帧" />
                  <span class="frame-time">{{ formatTime(frame.timestampMs) }}</span>
                </div>
                <div class="frame-tags" v-if="frame.sceneTags">
                  <el-tag
                    v-for="(tag, tagIndex) in frame.sceneTags.split(',').slice(0, 3)"
                    :key="tagIndex"
                    size="small"
                    type="primary"
                    effect="light"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
                <p class="frame-desc" v-if="frame.promptText">{{ frame.promptText }}</p>
              </div>
              <el-empty v-if="framesList.length === 0" description="暂无关键帧" :image-size="80" />
            </div>
          </el-collapse-item>

          <el-collapse-item name="export">
            <template #title>
              <div class="collapse-title">
                <el-icon class="title-icon"><Download /></el-icon>
                <span>信息导出</span>
              </div>
            </template>
            <div class="export-section">
              <div class="export-buttons">
                <el-button type="primary" plain @click="showExportDialog = true">
                  <el-icon><Document /></el-icon>
                  导出文案
                </el-button>
                <el-button type="primary" plain @click="handleExportPrompts">
                  <el-icon><Picture /></el-icon>
                  导出画面提示词
                </el-button>
              </div>
              <p class="export-hint">支持 TXT、SRT、JSON 格式导出</p>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>

    <el-dialog v-model="showExportDialog" title="导出文案" width="400px">
      <div class="export-dialog-content">
        <p class="export-tip">选择导出格式：</p>
        <div class="format-options">
          <el-radio-group v-model="exportFormat">
            <el-radio value="txt">TXT 纯文本</el-radio>
            <el-radio value="srt">SRT 字幕</el-radio>
            <el-radio value="json">JSON 数据</el-radio>
          </el-radio-group>
        </div>
      </div>
      <template #footer>
        <el-button @click="showExportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleExportTranscript">确认导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Monitor,
  Timer,
  Folder,
  Microphone,
  Grid,
  Download,
  Document,
  Picture
} from '@element-plus/icons-vue'
import { getAnalysisResultDetail, exportTranscript, exportPrompts, type AnalysisResultDetail, type TranscriptItem, type VideoFrameItem } from '@/api/video'

const route = useRoute()
const router = useRouter()

const videoRef = ref<HTMLVideoElement | null>(null)
const resultDetail = ref<AnalysisResultDetail | null>(null)
const videoDuration = ref(0)
const currentTime = ref(0)
const activeCollapse = ref(['summary', 'transcript', 'frames', 'export'])
const showExportDialog = ref(false)
const exportFormat = ref('txt')

const transcriptList = computed<TranscriptItem[]>(() => {
  return resultDetail.value?.transcriptList || []
})

const framesList = computed<VideoFrameItem[]>(() => {
  return resultDetail.value?.frames || []
})

const progressPercent = computed(() => {
  if (videoDuration.value <= 0) return 0
  return (currentTime.value / videoDuration.value) * 100
})

const loadDetail = async () => {
  const videoId = route.params.id as string
  if (!videoId) return

  try {
    const data = await getAnalysisResultDetail(videoId)
    resultDetail.value = (data as unknown as AnalysisResultDetail)
  } catch (error) {
    ElMessage.error('加载解析结果失败')
  }
}

const onVideoTimeUpdate = () => {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime
  }
}

const onVideoLoaded = () => {
  if (videoRef.value) {
    videoDuration.value = videoRef.value.duration
    const tParam = route.query.t
    if (tParam) {
      const timestampMs = Number(tParam)
      if (!isNaN(timestampMs) && timestampMs > 0) {
        videoRef.value.currentTime = timestampMs / 1000
      }
    }
  }
}

const jumpToTimestamp = (timestampMs: number) => {
  if (videoRef.value) {
    videoRef.value.currentTime = timestampMs / 1000
    videoRef.value.play()
  }
}

const isCurrentTranscript = (item: TranscriptItem) => {
  const currentMs = currentTime.value * 1000
  return currentMs >= item.timestampMs && currentMs < item.timestampMs + 10000
}

const getMarkerPosition = (timestampMs: number) => {
  if (videoDuration.value <= 0) return 0
  return (timestampMs / (videoDuration.value * 1000)) * 100
}

const getSpeakerTagType = (speaker: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const typeMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    'speaker_1': 'primary',
    'speaker_2': 'success',
    'speaker_3': 'warning',
  }
  return typeMap[speaker] || 'info'
}

const formatTime = (ms: number) => {
  if (!ms || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const formatDuration = (seconds?: number) => {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

const handleExportTranscript = async () => {
  const videoId = route.params.id as string
  if (!videoId) return

  try {
    const res: any = await exportTranscript(videoId, exportFormat.value)
    const blob = new Blob([res.data], { type: res.data.type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const filename = resultDetail.value?.video?.filename?.replace(/\.[^.]+$/, '') || 'transcript'
    link.download = `${filename}.${exportFormat.value}`
    link.click()
    URL.revokeObjectURL(url)
    showExportDialog.value = false
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const handleExportPrompts = async () => {
  const videoId = route.params.id as string
  if (!videoId) return

  try {
    const res: any = await exportPrompts(videoId)
    const blob = new Blob([res.data], { type: res.data.type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const filename = resultDetail.value?.video?.filename?.replace(/\.[^.]+$/, '') || 'prompts'
    link.download = `${filename}_prompts.md`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.analysis-result-page {
  width: 100%;
  padding: 24px;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.title-section {
  flex: 1;
  min-width: 0;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.page-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin: 2px 0 0 0;
}

.content-container {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.left-column {
  flex: 1;
  min-width: 0;
  position: sticky;
  top: 24px;
}

.right-column {
  flex: 1;
  min-width: 0;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
}

.video-player-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.video-wrapper {
  width: 100%;
  background: #1a1a2e;
  aspect-ratio: 16 / 9;
}

.video-element {
  width: 100%;
  height: 100%;
  display: block;
}

.video-progress {
  padding: 12px 16px 8px;
}

.progress-track {
  position: relative;
  height: 6px;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: visible;
}

.progress-fill {
  height: 100%;
  background: #2563eb;
  border-radius: 9999px;
  transition: width 0.1s ease;
}

.timeline-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #2563eb;
  border: 2px solid #fff;
  border-radius: 50%;
  cursor: pointer;
  z-index: 1;
}

.time-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
  margin-top: 4px;
}

.time-labels span {
  font-size: 12px;
  color: #94a3b8;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.video-info-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #475569;
}

.info-item :deep(.el-icon) {
  font-size: 14px;
  color: #94a3b8;
}

.info-divider {
  width: 1px;
  height: 14px;
  background: #e2e8f0;
}

.collapse-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.title-icon {
  color: #2563eb;
}

.transcript-container {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
  background: #f8fafc;
  border-radius: 8px;
}

.transcript-line {
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  font-size: 14px;
  line-height: 1.6;
}

.transcript-line:hover {
  background: #eff6ff;
}

.transcript-line.active {
  background: #dbeafe;
}

.transcript-timestamp {
  flex-shrink: 0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  color: #2563eb;
  font-weight: 500;
}

.transcript-text {
  color: #475569;
  flex: 1;
}

.transcript-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.speaker-tag {
  align-self: flex-start;
}

.summary-container {
  padding: 8px 0;
}

.summary-text {
  font-size: 14px;
  line-height: 1.8;
  color: #475569;
  margin: 0 0 16px 0;
  text-indent: 2em;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #2563eb;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #94a3b8;
}

.frames-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.frame-item {
  cursor: pointer;
  transition: transform 0.15s ease;
}

.frame-item:hover {
  transform: translateY(-2px);
}

.frame-thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #f1f5f9;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.frame-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.frame-time {
  position: absolute;
  bottom: 6px;
  right: 6px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 11px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.frame-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.frame-desc {
  font-size: 12px;
  color: #94a3b8;
  margin: 4px 0 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.export-section {
  padding: 8px 0;
}

.export-buttons {
  display: flex;
  gap: 12px;
}

.export-buttons .el-button {
  flex: 1;
  justify-content: center;
}

.export-hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 12px 0 0 0;
  text-align: center;
}

.export-dialog-content {
  padding: 10px 0;
}

.export-tip {
  font-size: 14px;
  color: #475569;
  margin: 0 0 16px 0;
}

.format-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 1024px) {
  .content-container {
    flex-direction: column;
  }

  .left-column {
    position: static;
    width: 100%;
  }

  .right-column {
    width: 100%;
    max-height: none;
  }
}
</style>
