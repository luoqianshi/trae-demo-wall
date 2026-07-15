<template>
  <div class="video-upload-page">
    <div class="main-content">
      <div class="left-section">
        <el-card class="upload-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>视频上传</span>
            </div>
          </template>
          <el-tabs v-model="activeTab" class="upload-tabs">
            <el-tab-pane label="拖拽上传" name="drag">
              <div
                class="upload-area"
                :class="{ 'is-dragover': isDragover }"
                @dragover.prevent="handleDragOver"
                @dragleave="handleDragLeave"
                @drop.prevent="handleDrop"
                @click="triggerFileInput"
              >
                <el-icon :size="64" color="#60a5fa"><Upload /></el-icon>
                <div class="upload-title">点击或拖拽视频文件到此处上传</div>
                <div class="upload-tips">支持 MP4、AVI、MOV、MKV 等常见视频格式，单个文件最大 2GB</div>
                <el-button type="primary" class="upload-btn">
                  <el-icon><Upload /></el-icon>
                  <span>选择文件</span>
                </el-button>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="video/*"
                  multiple
                  style="display: none"
                  @change="handleFileSelect"
                />
              </div>
            </el-tab-pane>
            <el-tab-pane label="链接输入" name="url">
              <div class="url-upload">
                <el-form :model="urlForm" label-position="top">
                  <el-form-item label="视频链接">
                    <el-input
                      v-model="urlForm.url"
                      placeholder="请输入视频文件URL地址"
                      clearable
                    />
                  </el-form-item>
                  <el-form-item label="文件名（可选）">
                    <el-input
                      v-model="urlForm.filename"
                      placeholder="请输入文件名，留空将自动从URL提取"
                      clearable
                    />
                  </el-form-item>
                  <el-button
                    type="primary"
                    :disabled="!urlForm.url"
                    @click="handleUrlUpload"
                  >
                    添加视频
                  </el-button>
                </el-form>
              </div>
            </el-tab-pane>
          </el-tabs>

          <div v-if="uploadFileList.length > 0" class="file-list-section">
            <div class="file-list-header">
              <span>上传列表 ({{ uploadFileList.length }})</span>
              <el-button text type="danger" @click="clearUploadList">清空列表</el-button>
            </div>
            <div class="file-list">
              <div
                v-for="file in uploadFileList"
                :key="file.uid"
                class="file-item"
              >
                <div class="file-info">
                  <el-icon class="file-icon"><VideoCamera /></el-icon>
                  <div class="file-meta">
                    <div class="file-name">{{ file.name }}</div>
                    <div class="file-size">{{ formatFileSize(file.size) }}</div>
                  </div>
                </div>
                <div class="file-status">
                  <template v-if="file.status === 'pending'">
                    <el-tag size="small">等待上传</el-tag>
                  </template>
                  <template v-else-if="file.status === 'uploading'">
                    <div class="progress-wrapper">
                      <el-progress :percentage="file.progress" :stroke-width="6" />
                      <span class="progress-text">{{ file.progress }}%</span>
                    </div>
                  </template>
                  <template v-else-if="file.status === 'success'">
                    <el-tag type="success" size="small">上传成功</el-tag>
                  </template>
                  <template v-else-if="file.status === 'error'">
                    <el-tag type="danger" size="small">上传失败</el-tag>
                  </template>
                  <el-button
                    v-if="file.status !== 'uploading'"
                    text
                    type="danger"
                    class="remove-btn"
                    @click="removeFile(file.uid)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <div class="right-section">
        <el-card class="feature-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>核心能力</span>
            </div>
          </template>
          <div class="feature-list">
            <div class="feature-item">
              <div class="feature-icon icon-transcribe">
                <el-icon :size="28"><Edit /></el-icon>
              </div>
              <div class="feature-content">
                <h4>智能转写</h4>
                <p>基于AI语音识别技术，自动将视频中的语音内容转换为文字，支持多语种识别和说话人区分。</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon icon-frame">
                <el-icon :size="28"><Picture /></el-icon>
              </div>
              <div class="feature-content">
                <h4>关键帧提取</h4>
                <p>智能分析视频画面，自动提取精彩镜头和关键帧，支持时间轴浏览和一键下载。</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon icon-analyze">
                <el-icon :size="28"><DataAnalysis /></el-icon>
              </div>
              <div class="feature-content">
                <h4>内容分析</h4>
                <p>多维度分析视频内容，包括场景分类、情感分析、主题标签等，助力内容创作。</p>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="tip-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>使用说明</span>
            </div>
          </template>
          <el-steps direction="vertical" :active="0" finish-status="success">
            <el-step title="上传视频">
              <template #description>
                拖拽或选择视频文件上传，支持多种视频格式
              </template>
            </el-step>
            <el-step title="开始解析">
              <template #description>
                点击"开始智能解析"按钮，系统将自动处理视频
              </template>
            </el-step>
            <el-step title="查看结果">
              <template #description>
                解析完成后，可查看转写文稿、关键帧和分析报告
              </template>
            </el-step>
          </el-steps>
        </el-card>
      </div>
    </div>

    <el-card class="video-list-card" shadow="never">
      <template #header>
        <div class="list-header">
          <div class="list-title">
            <span>已上传视频</span>
            <el-tag type="info" size="small">{{ videoStore.videoList.length }} 个视频</el-tag>
          </div>
          <div class="list-actions">
            <el-button :loading="analyzing" type="primary" :disabled="!selectedVideos.length" @click="handleStartAnalysis">
              <el-icon><MagicStick /></el-icon>
              <span>开始智能解析 ({{ selectedVideos.length }})</span>
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="videoStore.loading"
        :data="videoStore.videoList"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="filename" label="视频名称" min-width="200">
          <template #default="{ row }">
            <div class="video-name-cell">
              <el-icon class="video-icon"><VideoCamera /></el-icon>
              <span>{{ row.filename }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="fileSize" label="大小" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长" width="100">
          <template #default="{ row }">
            {{ row.duration ? formatDuration(row.duration) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="160">
          <template #default="{ row }">
            <div v-if="row.status === 1" class="analysis-progress">
              <el-progress 
                :percentage="getAnalysisProgress(row.id)" 
                :stroke-width="6"
                :show-text="true"
              />
              <span class="progress-label">解析中</span>
            </div>
            <el-tag v-else :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="上传时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              type="primary"
              link
              :loading="analyzingId === row.id"
              @click="handleAnalyzeSingle(row)"
            >
              解析
            </el-button>
            <el-button
              v-else-if="row.status === 1"
              type="warning"
              link
              disabled
            >
              解析中...
            </el-button>
            <el-button
              v-else-if="row.status === 2"
              type="success"
              link
              @click="handleViewResult(row)"
            >
              查看结果
            </el-button>
            <el-button
              v-else-if="row.status === 3"
              type="danger"
              link
              :loading="analyzingId === row.id"
              @click="handleAnalyzeSingle(row)"
            >
              重新解析
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload,
  VideoCamera,
  Delete,
  Edit,
  Picture,
  DataAnalysis,
  MagicStick
} from '@element-plus/icons-vue'
import { useVideoStore } from '@/stores/video'
import type { VideoItem } from '@/api/video'

const router = useRouter()
const videoStore = useVideoStore()

const activeTab = ref('drag')
const isDragover = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const analyzing = ref(false)
const analyzingId = ref<string>('')
const selectedVideos = ref<VideoItem[]>([])

interface UploadFileItem {
  uid: string
  name: string
  size: number
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  videoId?: string
}

const uploadFileList = ref<UploadFileItem[]>([])

const urlForm = reactive({
  url: '',
  filename: ''
})

const generateUid = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusType = (status: number): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
  const map: Record<number, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    0: 'primary',
    1: 'warning',
    2: 'success',
    3: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '已上传',
    1: '解析中',
    2: '已完成',
    3: '失败'
  }
  return map[status] || '未知'
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleDragOver = () => {
  isDragover.value = true
}

const handleDragLeave = () => {
  isDragover.value = false
}

const handleDrop = (e: DragEvent) => {
  isDragover.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    addFiles(Array.from(files))
  }
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    addFiles(Array.from(files))
  }
  target.value = ''
}

const addFiles = (files: File[]) => {
  const videoFiles = files.filter(file => file.type.startsWith('video/'))
  if (videoFiles.length === 0) {
    ElMessage.warning('请选择视频文件')
    return
  }

  const newFiles: UploadFileItem[] = videoFiles.map(file => ({
    uid: generateUid(),
    name: file.name,
    size: file.size,
    file,
    status: 'pending',
    progress: 0
  }))

  uploadFileList.value.push(...newFiles)
  newFiles.forEach(file => uploadFile(file))
}

const uploadFile = async (fileItem: UploadFileItem) => {
  fileItem.status = 'uploading'
  fileItem.progress = 0

  try {
    const presignData: any = await videoStore.getUploadPresignUrl(
      fileItem.name,
      fileItem.file.type
    )

    const presignUrl = presignData.uploadUrl || presignData.url || presignData
    const fileUrl = presignData.fileUrl || presignData.downloadUrl || presignUrl.split('?')[0]

    await videoStore.uploadVideoToStorage(presignUrl, fileItem.file, (percent: number) => {
      fileItem.progress = percent
    })

    const videoRecord: any = await videoStore.createVideoRecord({
      filename: fileItem.name,
      fileUrl,
      fileSize: fileItem.size
    })

    fileItem.status = 'success'
    fileItem.videoId = videoRecord.id
    ElMessage.success(`${fileItem.name} 上传成功`)
  } catch (error: any) {
    fileItem.status = 'error'
    ElMessage.error(`${fileItem.name} 上传失败: ${error.message || '未知错误'}`)
  }
}

const removeFile = (uid: string) => {
  const index = uploadFileList.value.findIndex(f => f.uid === uid)
  if (index > -1) {
    uploadFileList.value.splice(index, 1)
  }
}

const clearUploadList = () => {
  uploadFileList.value = uploadFileList.value.filter(f => f.status === 'uploading')
}

const handleUrlUpload = () => {
  if (!urlForm.url) {
    ElMessage.warning('请输入视频链接')
    return
  }
  ElMessage.info('链接上传功能开发中')
}

const handleSelectionChange = (selection: any[]) => {
  selectedVideos.value = selection as VideoItem[]
}

const handleStartAnalysis = async () => {
  if (selectedVideos.value.length === 0) {
    ElMessage.warning('请选择要解析的视频')
    return
  }

  const uploadedVideos = selectedVideos.value.filter(v => v.status === 0)
  if (uploadedVideos.length === 0) {
    ElMessage.warning('所选视频中没有可解析的视频')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要对 ${uploadedVideos.length} 个视频开始智能解析吗？`,
      '确认解析',
      {
        confirmButtonText: '开始解析',
        cancelButtonText: '取消',
        type: 'primary'
      }
    )
  } catch {
    return
  }

  analyzing.value = true
  try {
    for (const video of uploadedVideos) {
      try {
        await videoStore.startAnalysis(video.id)
      } catch (e) {
        console.error(`解析视频 ${video.filename} 失败`, e)
      }
    }
    ElMessage.success('已开始解析，请稍候...')
    await videoStore.fetchVideoList()
  } catch (error: any) {
    ElMessage.error(error.message || '解析失败')
  } finally {
    analyzing.value = false
  }
}

const handleAnalyzeSingle = async (row: any) => {
  const video = row as VideoItem
  analyzingId.value = video.id
  try {
    await videoStore.startAnalysis(video.id)
    ElMessage.success('已开始解析，请稍候...')
    await videoStore.fetchVideoList()
  } catch (error: any) {
    ElMessage.error(error.message || '解析失败')
  } finally {
    analyzingId.value = ''
  }
}

const handleViewResult = (row: any) => {
  const video = row as VideoItem
  router.push(`/analysis-result/${video.id}`)
}

const handleDelete = async (row: any) => {
  const video = row as VideoItem
  try {
    await ElMessageBox.confirm(
      `确定要删除视频 "${video.filename}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    ElMessage.success('删除功能开发中')
  } catch {
  }
}

const getAnalysisProgress = (videoId: string): number => {
  const progressInfo = videoStore.getAnalysisProgressByVideoId(videoId)
  return progressInfo.progress || 0
}

onMounted(() => {
  videoStore.fetchVideoList()
  videoStore.connectWebSocket()
})

onUnmounted(() => {
  videoStore.stopProgressPolling()
  videoStore.disconnectWebSocket()
})
</script>

<style scoped>
.video-upload-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
}

.left-section {
  min-width: 0;
}

.right-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.upload-card {
  border-radius: 8px;
}

.upload-tabs {
  margin-bottom: 10px;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #fafafa;
}

.upload-area:hover,
.upload-area.is-dragover {
  border-color: #60a5fa;
  background-color: #eff6ff;
}

.upload-area.is-dragover {
  border-style: solid;
}

.upload-title {
  margin-top: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #374151;
}

.upload-tips {
  margin-top: 8px;
  font-size: 13px;
  color: #9ca3af;
}

.upload-btn {
  margin-top: 20px;
}

.url-upload {
  padding: 20px 0;
}

.file-list-section {
  margin-top: 20px;
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 280px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 6px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.file-icon {
  font-size: 24px;
  color: #60a5fa;
  flex-shrink: 0;
}

.file-meta {
  min-width: 0;
}

.file-name {
  font-size: 14px;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.file-size {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.file-status {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 160px;
}

.progress-wrapper .el-progress {
  flex: 1;
}

.progress-text {
  font-size: 12px;
  color: #6b7280;
  min-width: 36px;
  text-align: right;
}

.remove-btn {
  margin-left: 8px;
}

.feature-card,
.tip-card {
  border-radius: 8px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-item {
  display: flex;
  gap: 14px;
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}

.icon-transcribe {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.icon-frame {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.icon-analyze {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.feature-content h4 {
  margin: 0 0 6px 0;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.feature-content p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
}

.video-list-card {
  border-radius: 8px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.video-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.video-icon {
  color: #60a5fa;
  font-size: 18px;
}

.analysis-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.analysis-progress .el-progress {
  flex: 1;
  min-width: 80px;
}

.progress-label {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}
</style>
