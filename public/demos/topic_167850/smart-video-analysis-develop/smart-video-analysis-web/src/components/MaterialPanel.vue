<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEditorStore, type Material } from '@/stores/editor'
import { VideoPlay, Mic, Picture, Files, Search, FolderOpened } from '@element-plus/icons-vue'

const emit = defineEmits<{
  (e: 'add-clip', trackId: string, clipData: any): void
}>()

const store = useEditorStore()

const activeTab = ref<'video' | 'audio' | 'image'>('video')
const searchQuery = ref('')

const filteredMaterials = computed(() => {
  const key = activeTab.value + 's' as 'videos' | 'audios' | 'images'
  const materials = store.materials[key] || []
  if (!searchQuery.value) return materials
  return materials.filter((m: Material) =>
    m.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const formatDuration = (ms: number) => {
  if (!ms) return '--:--'
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const handleDragStart = (event: DragEvent, material: Material) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('material', JSON.stringify(material))
  }
}

const handleAddToTrack = (material: Material) => {
  const videoTracks = store.tracks.filter(t => t.trackType === 'video')
  const audioTracks = store.tracks.filter(t => t.trackType === 'audio')
  const textTracks = store.tracks.filter(t => t.trackType === 'text')

  let targetTrack: any = null
  if (material.type === 'video') {
    targetTrack = videoTracks[0] || videoTracks[0]
  } else if (material.type === 'audio') {
    targetTrack = audioTracks[0] || audioTracks[0]
  } else if (material.type === 'image') {
    targetTrack = videoTracks[0] || videoTracks[0]
  }

  if (targetTrack) {
    emit('add-clip', targetTrack.id, {
      sourceType: material.type,
      sourceId: material.id,
      sourcePath: material.storagePath,
      bucketName: material.bucketName,
      clipName: material.name,
      startPosition: store.totalDuration,
      duration: material.duration || 3000,
      sourceStart: 0,
      sourceDuration: material.duration || 3000,
      volume: 100,
      opacity: 100,
      speed: 1.0
    })
  }
}

const getMaterialIcon = (type: string) => {
  switch (type) {
    case 'video': return VideoPlay
    case 'audio': return Mic
    case 'image': return Picture
    default: return Files
  }
}

const getMaterialColor = (type: string) => {
  switch (type) {
    case 'video': return 'bg-blue-500'
    case 'audio': return 'bg-green-500'
    case 'image': return 'bg-purple-500'
    default: return 'bg-gray-500'
  }
}
</script>

<template>
  <div class="material-panel">
    <div class="panel-header">
      <h3>素材库</h3>
      <el-input
        v-model="searchQuery"
        placeholder="搜索素材"
        size="small"
        class="search-input"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <div class="tab-bar">
      <el-button
        v-for="tab in [{ key: 'video', label: '视频' }, { key: 'audio', label: '音频' }, { key: 'image', label: '图片' }]"
        :key="tab.key"
        :type="activeTab === tab.key ? 'primary' : 'default'"
        size="small"
        @click="activeTab = tab.key as any"
      >
        {{ tab.label }}
        <span class="tab-count">{{ (store.materials[(tab.key + 's') as 'videos' | 'audios' | 'images'] || []).length }}</span>
      </el-button>
    </div>

    <div class="material-list">
      <div
        v-for="material in filteredMaterials"
        :key="material.id"
        class="material-item"
        draggable="true"
        @dragstart="handleDragStart($event, material)"
        @click="handleAddToTrack(material)"
      >
        <div class="material-thumb" :class="getMaterialColor(material.type)">
          <el-icon :size="24"><component :is="getMaterialIcon(material.type)" /></el-icon>
        </div>
        <div class="material-info">
          <div class="material-name">{{ material.name }}</div>
          <div class="material-meta">
            <span v-if="material.duration">{{ formatDuration(material.duration) }}</span>
            <span v-if="material.fileSize">{{ formatFileSize(material.fileSize) }}</span>
          </div>
        </div>
      </div>
      <div v-if="filteredMaterials.length === 0" class="empty-state">
        <el-icon :size="32" class="empty-icon"><FolderOpened /></el-icon>
        <p>暂无素材</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.material-panel {
  width: 240px;
  background: #16213e;
  border-right: 1px solid #0f3460;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 12px;
  border-bottom: 1px solid #0f3460;
}

.panel-header h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.search-input {
  width: 100%;
}

.tab-bar {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid #0f3460;
}

.tab-count {
  margin-left: 4px;
  font-size: 12px;
  opacity: 0.7;
}

.material-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.material-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  margin-bottom: 4px;
  background: #0f3460;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.material-item:hover {
  background: #1a1a2e;
}

.material-thumb {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.material-info {
  flex: 1;
  min-width: 0;
}

.material-name {
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.material-meta {
  font-size: 11px;
  color: #888;
  margin-top: 2px;
}

.material-meta span {
  margin-right: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #666;
}

.empty-icon {
  margin-bottom: 8px;
  opacity: 0.5;
}
</style>