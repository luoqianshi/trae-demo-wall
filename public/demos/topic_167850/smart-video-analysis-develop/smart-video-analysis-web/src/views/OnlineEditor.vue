<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useEditorStore, type Track, type Clip } from '@/stores/editor'
import {
  getEditorProjectList,
  createEditorProject,
  getEditorProject,
  deleteEditorProject,
  getTracks,
  getClips,
  createClip,
  updateClip,
  deleteClip,
  getMaterialLibrary,
  aiAnalyze,
  exportVideo,
  getExportProgress,
  saveTimeline
} from '@/api/editor'
import { ElMessage, ElMessageBox } from 'element-plus'
import MaterialPanel from '@/components/MaterialPanel.vue'
import EditorPreview from '@/components/EditorPreview.vue'
import MultiTrackTimeline from '@/components/MultiTrackTimeline.vue'
import PropertyPanel from '@/components/PropertyPanel.vue'

const store = useEditorStore()

const showNewProjectModal = ref(false)
const newProjectName = ref('')
const newProjectDesc = ref('')
const projectList = ref<any[]>([])
const exportDialogVisible = ref(false)
const analysisDialogVisible = ref(false)
const autoSaveInterval = ref<number | null>(null)
const timelineScale = ref(50)

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  const remainingMs = Math.floor((ms % 1000) / 10)
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMs.toString().padStart(2, '0')}`
}

const loadProjectList = async () => {
  try {
    const res = await getEditorProjectList()
    projectList.value = res.data || []
  } catch (e) {
    console.error('加载项目列表失败', e)
  }
}

const loadProject = async (projectId: string) => {
  try {
    const res = await getEditorProject(projectId)
    store.setCurrentProject(res.data)
    store.setCurrentProjectId(projectId)

    const tracksRes = await getTracks(projectId)
    const tracks: Track[] = tracksRes.data.map((t: Track) => ({ ...t, clips: [] }))
    store.setTracks(tracks)

    const allClips: Clip[] = []
    for (const track of tracks) {
      const clipsRes = await getClips(track.id)
      const clips: Clip[] = clipsRes.data
      allClips.push(...clips)
      track.clips = clips
    }
    store.setClips(allClips)

    loadMaterials()
    startAutoSave()
  } catch (e) {
    console.error('加载项目失败', e)
    ElMessage.error('加载项目失败')
  }
}

const loadMaterials = async () => {
  try {
    const res = await getMaterialLibrary()
    const data = res.data || {}
    store.setMaterials({
      videos: (data.videos || []).map((v: any) => ({
        id: v.id,
        name: v.filename,
        type: 'video',
        duration: v.duration,
        fileSize: v.fileSize,
        storagePath: v.storagePath,
        bucketName: v.bucketName
      })),
      audios: (data.audios || []).map((a: any) => ({
        id: a.id,
        name: a.filename,
        type: 'audio',
        duration: a.duration,
        fileSize: a.fileSize,
        storagePath: a.storagePath,
        bucketName: a.bucketName
      })),
      images: (data.images || []).map((i: any) => ({
        id: i.id,
        name: '关键帧_' + i.timestampMs,
        type: 'image',
        duration: 3000,
        fileSize: 0,
        storagePath: i.storagePath,
        bucketName: i.bucketName
      }))
    })
  } catch (e) {
    console.error('加载素材库失败', e)
  }
}

const handleCreateProject = async () => {
  if (!newProjectName.value.trim()) {
    ElMessage.warning('请输入项目名称')
    return
  }
  try {
    const res = await createEditorProject({
      name: newProjectName.value,
      description: newProjectDesc.value
    })
    ElMessage.success('项目创建成功')
    showNewProjectModal.value = false
    newProjectName.value = ''
    newProjectDesc.value = ''
    await loadProjectList()
    await loadProject(String(res.data.id))
  } catch (e) {
    ElMessage.error('创建项目失败')
  }
}

const handleDeleteProject = async (projectId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个项目吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteEditorProject(projectId)
    ElMessage.success('删除成功')
    await loadProjectList()
    if (store.currentProjectId === projectId) {
      store.setCurrentProjectId('')
      store.setCurrentProject(null)
      stopAutoSave()
    }
  } catch (e) {
    // cancelled
  }
}

const handleAddClip = async (trackId: string, clipData: any) => {
  try {
    const res = await createClip({
      trackId,
      ...clipData
    })
    const clip: Clip = {
      ...res.data,
      clips: []
    }
    store.addClip(clip)
    ElMessage.success('片段添加成功')
  } catch (e) {
    ElMessage.error('添加片段失败')
  }
}

const handleUpdateClip = async (clipId: string, updates: Partial<Clip>) => {
  try {
    if (clipId) {
      await updateClip(clipId, updates)
      store.updateClip(clipId, updates)
    } else {
      await handleAddClip(updates.trackId!, updates)
    }
  } catch (e) {
    console.error('更新片段失败', e)
  }
}

const handleDeleteClip = async (clipId: string) => {
  try {
    await deleteClip(clipId)
    store.removeClip(clipId)
    ElMessage.success('片段已删除')
  } catch (e) {
    ElMessage.error('删除片段失败')
  }
}

const handleAnalyze = async () => {
  if (!store.currentProjectId) return
  try {
    const res = await aiAnalyze(store.currentProjectId)
    store.setAnalysisResult(res.data)
    analysisDialogVisible.value = true
  } catch (e) {
    ElMessage.error('分析失败')
  }
}

const handleExport = async () => {
  if (!store.currentProjectId) return
  try {
    await exportVideo(store.currentProjectId)
    exportDialogVisible.value = true
    pollExportProgress()
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

const pollExportProgress = async () => {
  const interval = setInterval(async () => {
    try {
      const res = await getExportProgress(store.currentProjectId)
      store.setExportProgress(res.data.progress)
      if (res.data.progress >= 100 || res.data.status === 'completed') {
        clearInterval(interval)
        ElMessage.success('导出完成')
      } else if (res.data.status === 'failed') {
        clearInterval(interval)
        ElMessage.error('导出失败')
      }
    } catch (e) {
      clearInterval(interval)
    }
  }, 1000)
}

const startAutoSave = () => {
  stopAutoSave()
  autoSaveInterval.value = window.setInterval(async () => {
    if (store.currentProjectId && store.clips.length > 0) {
      try {
        const timelineData = JSON.stringify({
          tracks: store.tracks,
          clips: store.clips,
          duration: store.totalDuration
        })
        await saveTimeline(store.currentProjectId, { timelineData })
      } catch (e) {
        console.error('自动保存失败', e)
      }
    }
  }, 30000)
}

const stopAutoSave = () => {
  if (autoSaveInterval.value) {
    clearInterval(autoSaveInterval.value)
    autoSaveInterval.value = null
  }
}

const zoomIn = () => {
  if (timelineScale.value < 200) {
    timelineScale.value += 10
  }
}

const zoomOut = () => {
  if (timelineScale.value > 20) {
    timelineScale.value -= 10
  }
}

const fitTimeline = () => {
  timelineScale.value = 50
}

const handleKeyDown = (e: KeyboardEvent) => {
  const isCtrl = e.ctrlKey || e.metaKey

  if (isCtrl && e.key === 'z') {
    e.preventDefault()
    if (e.shiftKey) {
      ElMessage.info('重做')
    } else {
      ElMessage.info('撤销')
    }
    return
  }

  if (isCtrl && e.key === 's') {
    e.preventDefault()
    ElMessage.info('已保存')
    return
  }

  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault()
    if (store.selectedClip) {
      handleDeleteClip(store.selectedClip.id)
    }
    return
  }

  if (e.key === ' ') {
    e.preventDefault()
    ElMessage.info('播放/暂停')
    return
  }
}

watch(() => store.currentProjectId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    loadProject(newId)
  }
})

onMounted(() => {
  loadProjectList()
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  stopAutoSave()
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="editor-workspace">
    <div class="editor-header">
      <div class="header-left">
        <el-select
          v-model="store.currentProjectId"
          placeholder="选择项目"
          class="project-select"
          @change="loadProject"
        >
          <el-option
            v-for="project in projectList"
            :key="project.id"
            :label="project.name"
            :value="project.id"
          />
        </el-select>
        <el-button @click="showNewProjectModal = true" size="small">
          <el-icon><Plus /></el-icon>
          新建项目
        </el-button>
      </div>
      <div class="header-center">
        <span class="project-title">{{ store.currentProject?.name || '在线剪辑工作台' }}</span>
      </div>
      <div class="header-right">
        <el-button @click="zoomOut" size="small">
          <el-icon><ZoomOut /></el-icon>
        </el-button>
        <span class="zoom-value">{{ timelineScale }}%</span>
        <el-button @click="zoomIn" size="small">
          <el-icon><ZoomIn /></el-icon>
        </el-button>
        <el-button @click="fitTimeline" size="small">适应</el-button>
        <el-divider direction="vertical" />
        <el-button @click="handleAnalyze" size="small" type="primary">
          <el-icon><Search /></el-icon>
          AI 分析
        </el-button>
        <el-button @click="handleExport" size="small" type="success">
          <el-icon><Download /></el-icon>
          导出成片
        </el-button>
      </div>
    </div>

    <div class="editor-body">
      <MaterialPanel @add-clip="handleAddClip" />

      <div class="editor-main">
        <EditorPreview />
        <MultiTrackTimeline
          :scale="timelineScale"
          @update-clip="handleUpdateClip"
          @delete-clip="handleDeleteClip"
        />
      </div>

      <PropertyPanel
        v-if="store.selectedClip"
        :clip="store.selectedClip"
        @update="(updates) => handleUpdateClip(store.selectedClip!.id, updates)"
        @delete="() => handleDeleteClip(store.selectedClip!.id)"
      />
    </div>

    <el-dialog title="新建剪辑项目" v-model="showNewProjectModal" width="400px">
      <el-form :model="{ name: newProjectName, desc: newProjectDesc }" label-width="80px">
        <el-form-item label="项目名称">
          <el-input v-model="newProjectName" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input v-model="newProjectDesc" type="textarea" placeholder="请输入项目描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNewProjectModal = false">取消</el-button>
        <el-button type="primary" @click="handleCreateProject">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog title="导出进度" v-model="exportDialogVisible" width="400px">
      <div class="export-progress">
        <el-progress :percentage="store.exportProgress" :status="store.exportProgress >= 100 ? 'success' : ''" />
        <div class="progress-text">
          {{ store.exportProgress }}%
          <span v-if="store.exportProgress >= 100"> - 导出完成，可下载</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="exportDialogVisible = false">关闭</el-button>
        <el-button v-if="store.exportProgress >= 100" type="primary">下载</el-button>
      </template>
    </el-dialog>

    <el-dialog title="AI 分析结果" v-model="analysisDialogVisible" width="600px">
      <div v-if="store.analysisResult" class="analysis-content">
        <div class="analysis-section">
          <h4>场景检测</h4>
          <div v-if="store.analysisResult.sceneDetection">
            <el-tag
              v-for="scene in store.analysisResult.sceneDetection.scenes"
              :key="scene.sceneId"
              class="scene-tag"
            >
              {{ scene.sceneType }}
              <span class="scene-time">{{ formatTime(scene.startTime) }} - {{ formatTime(scene.startTime + scene.duration) }}</span>
            </el-tag>
          </div>
        </div>
        <div class="analysis-section">
          <h4>音频质量评分</h4>
          <el-rate :model-value="Math.round(store.analysisResult.audioQuality / 20)" disabled />
          <span class="audio-score">{{ store.analysisResult.audioQuality }}/100</span>
        </div>
        <div class="analysis-section">
          <h4>音频问题</h4>
          <el-alert
            v-for="(issue, index) in store.analysisResult.audioIssues"
            :key="index"
            :title="issue.message"
            :type="issue.severity === 'high' ? 'error' : issue.severity === 'medium' ? 'warning' : 'info'"
            show-icon
            :closable="false"
          />
        </div>
        <div class="analysis-section">
          <h4>优化建议</h4>
          <ul>
            <li v-for="(suggestion, index) in store.analysisResult.suggestions" :key="index">
              {{ index + 1 }}. {{ suggestion }}
            </li>
          </ul>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.editor-workspace {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
  color: #fff;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #16213e;
  border-bottom: 1px solid #0f3460;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-select {
  width: 200px;
}

.header-center {
  flex: 1;
  text-align: center;
}

.project-title {
  font-size: 18px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-value {
  min-width: 40px;
  text-align: center;
  font-size: 12px;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.analysis-content {
  max-height: 400px;
  overflow-y: auto;
}

.analysis-section {
  margin-bottom: 20px;
}

.analysis-section h4 {
  margin-bottom: 12px;
  font-size: 14px;
  color: #e0e0e0;
}

.scene-tag {
  margin-right: 8px;
  margin-bottom: 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.scene-time {
  font-size: 12px;
  opacity: 0.7;
}

.audio-score {
  margin-left: 12px;
  font-size: 14px;
  font-weight: 600;
}

.analysis-content ul {
  padding-left: 20px;
}

.analysis-content li {
  margin-bottom: 8px;
  color: #bdbdbd;
}

.export-progress {
  padding: 20px 0;
}

.progress-text {
  margin-top: 12px;
  text-align: center;
  color: #bdbdbd;
}
</style>