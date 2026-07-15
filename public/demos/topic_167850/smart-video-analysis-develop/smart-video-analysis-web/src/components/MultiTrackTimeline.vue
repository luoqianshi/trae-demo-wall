<script setup lang="ts">import { ref, computed } from 'vue';
import { useEditorStore, type Clip } from '@/stores/editor';
import { VideoPlay, Mic, Document, Files, Lock, Delete } from '@element-plus/icons-vue';
const props = defineProps<{
 scale: number;
}>();
const emit = defineEmits<{
 (e: 'update-clip', clipId: string, updates: Partial<Clip>): void;
 (e: 'delete-clip', clipId: string): void;
}>();
const store = useEditorStore();
const timelineRef = ref<HTMLElement | null>(null);
const draggingClip = ref<string | null>(null);
const dragOffset = ref(0);
const formatTime = (ms: number) => {
 const seconds = Math.floor(ms / 1000);
 const minutes = Math.floor(seconds / 60);
 const remainingSeconds = seconds % 60;
 return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
const timelineWidth = computed(() => {
 return Math.max(800, (store.totalDuration / 1000) * props.scale);
});
const msToPx = (ms: number) => {
 return (ms / 1000) * props.scale;
};
const pxToMs = (px: number) => {
 return Math.floor((px / props.scale) * 1000);
};
const getClipStyle = (clip: Clip) => {
 return {
 left: msToPx(clip.startPosition) + 'px',
 width: msToPx(clip.duration) + 'px'
 };
};
const getClipColor = (sourceType: string) => {
 switch (sourceType) {
 case 'video': return 'bg-blue-500';
 case 'audio': return 'bg-green-500';
 case 'image': return 'bg-purple-500';
 default: return 'bg-gray-500';
 }
};
const handleClipClick = (clipId: string) => {
 store.setSelectedClipId(clipId);
};
const handleClipDragStart = (event: DragEvent, clipId: string) => {
 draggingClip.value = clipId;
 if (event.dataTransfer) {
 event.dataTransfer.effectAllowed = 'move';
 const clip = store.clips.find(c => c.id === clipId);
 if (clip) {
 const target = event.currentTarget as HTMLElement;
 dragOffset.value = event.clientX - target.getBoundingClientRect().left;
 }
 }
};
const handleClipDrag = (event: DragEvent) => {
 if (!draggingClip.value || !timelineRef.value)
 return;
 event.preventDefault();
 const rect = timelineRef.value.getBoundingClientRect();
 let newPosition = event.clientX - rect.left - dragOffset.value;
 newPosition = Math.max(0, Math.min(newPosition, timelineWidth.value - 50));
 const newMs = pxToMs(newPosition);
 emit('update-clip', draggingClip.value, { startPosition: newMs });
};
const handleClipDragEnd = () => {
 draggingClip.value = null;
};
const handleTrackDragOver = (event: DragEvent) => {
 event.preventDefault();
};
const handleTrackDrop = (event: DragEvent, trackId: string) => {
 event.preventDefault();
 const materialData = event.dataTransfer?.getData('material');
 if (materialData) {
 const material = JSON.parse(materialData);
 const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
 const position = pxToMs(event.clientX - rect.left);
 emit('update-clip', '', {
 trackId,
 sourceType: material.type,
 sourceId: material.id,
 sourcePath: material.storagePath,
 bucketName: material.bucketName,
 clipName: material.name,
 startPosition: position,
 duration: material.duration || 3000,
 sourceStart: 0,
 sourceDuration: material.duration || 3000,
 volume: 100,
 opacity: 100,
 speed: 1.0
 });
 }
};
const handleDeleteClip = (event: Event, clipId: string) => {
 event.stopPropagation();
 emit('delete-clip', clipId);
};
const getTimeMarks = () => {
 const marks = [];
 const totalSeconds = Math.ceil(store.totalDuration / 1000);
 for (let i = 0; i <= totalSeconds; i += 5) {
 marks.push(i);
 }
 return marks;
};
const getTrackIcon = (type: string) => {
 switch (type) {
 case 'video': return VideoPlay;
 case 'audio': return Mic;
 case 'text': return Document;
 default: return Files;
 }
};
</script>

<template>
  <div class="multi-track-timeline">
    <div class="timeline-header">
      <div class="header-left">
        <span class="header-label">轨道</span>
      </div>
      <div class="header-right" :style="{ width: timelineWidth + 'px' }">
        <div class="time-markers">
          <div
            v-for="second in getTimeMarks()"
            :key="second"
            class="time-marker"
            :style="{ left: msToPx(second * 1000) + 'px' }"
          >
            <span class="marker-line" :class="{ 'major': second % 30 === 0 }" />
            <span class="marker-label" v-if="second % 10 === 0">{{ formatTime(second * 1000) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="timeline-body">
      <div class="tracks-container">
        <div
          v-for="track in store.tracks"
          :key="track.id"
          class="track"
          :class="{ 'selected': store.selectedTrackId === track.id }"
          @dragover="handleTrackDragOver"
          @drop="(e) => handleTrackDrop(e, track.id)"
        >
          <div class="track-header">
            <el-icon :size="14" class="track-icon">
              <component :is="getTrackIcon(track.trackType)" />
            </el-icon>
            <span class="track-name">{{ track.trackName }}</span>
            <div class="track-controls">
              <el-icon :size="14" class="control-icon" :class="{ muted: track.isMuted }">
                <Mic />
              </el-icon>
              <el-icon :size="14" class="control-icon">
                <Lock />
              </el-icon>
            </div>
          </div>
          <div class="track-content" ref="timelineRef" :style="{ width: timelineWidth + 'px' }">
            <div class="track-grid">
              <div
                v-for="second in getTimeMarks()"
                :key="'grid-' + second"
                class="grid-line"
                :style="{ left: msToPx(second * 1000) + 'px' }"
                :class="{ 'major': second % 10 === 0 }"
              />
            </div>

            <div
              v-for="clip in track.clips"
              :key="clip.id"
              class="clip"
              :class="[getClipColor(clip.sourceType), { selected: store.selectedClipId === clip.id }]"
              :style="getClipStyle(clip)"
              draggable="true"
              @click="handleClipClick(clip.id)"
              @dragstart="(e) => handleClipDragStart(e, clip.id)"
              @drag="handleClipDrag"
              @dragend="handleClipDragEnd"
            >
              <div class="clip-content">
                <span class="clip-name">{{ clip.clipName }}</span>
                <span class="clip-duration">{{ formatTime(clip.duration) }}</span>
              </div>
              <div class="clip-handles">
                <div class="handle left" />
                <div class="handle right" />
              </div>
              <el-button
                class="clip-delete"
                size="small"
                circle
                @click="(e) => handleDeleteClip(e, clip.id)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>

            <div
              class="playhead"
              :style="{ left: msToPx(store.playheadPosition) + 'px' }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.multi-track-timeline {
  flex: 1;
  background: #16213e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.timeline-header {
  display: flex;
  background: #0f3460;
  border-bottom: 1px solid #0f3460;
}

.header-left {
  width: 120px;
  padding: 8px;
  border-right: 1px solid #0f3460;
}

.header-label {
  font-size: 12px;
  color: #888;
}

.header-right {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.time-markers {
  position: relative;
  height: 32px;
}

.time-marker {
  position: absolute;
  top: 0;
  display: flex;
  flex-direction: column;
}

.marker-line {
  width: 1px;
  height: 20px;
  background: #333;
}

.marker-line.major {
  height: 32px;
  background: #555;
}

.marker-label {
  font-size: 10px;
  color: #888;
  margin-top: 2px;
}

.timeline-body {
  flex: 1;
  overflow-y: auto;
}

.tracks-container {
  display: flex;
  flex-direction: column;
}

.track {
  display: flex;
  border-bottom: 1px solid #0f3460;
}

.track-header {
  width: 120px;
  padding: 6px 8px;
  border-right: 1px solid #0f3460;
  background: #16213e;
  display: flex;
  align-items: center;
  gap: 6px;
}

.track-icon {
  color: #666;
}

.track-name {
  font-size: 12px;
  color: #fff;
  flex: 1;
}

.track-controls {
  display: flex;
  gap: 4px;
}

.control-icon {
  color: #666;
  cursor: pointer;
}

.control-icon.muted {
  color: #f56c6c;
}

.track-content {
  flex: 1;
  position: relative;
  min-height: 40px;
}

.track-grid {
  position: absolute;
  inset: 0;
}

.grid-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.05);
}

.grid-line.major {
  background: rgba(255, 255, 255, 0.1);
}

.clip {
  position: absolute;
  top: 4px;
  height: 32px;
  border-radius: 4px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  cursor: move;
  z-index: 10;
}

.clip.selected {
  box-shadow: 0 0 0 2px #409eff;
}

.clip-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  gap: 8px;
}

.clip-name {
  font-size: 11px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clip-duration {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
}

.clip-handles {
  display: flex;
  align-items: center;
  gap: 2px;
}

.handle {
  width: 4px;
  height: 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  cursor: ew-resize;
}

.clip-delete {
  opacity: 0;
  position: absolute;
  right: -16px;
  top: 50%;
  transform: translateY(-50%);
  background: #f56c6c;
  color: #fff;
  width: 20px;
  height: 20px;
}

.clip:hover .clip-delete {
  opacity: 1;
}

.playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #ff6b6b;
  z-index: 100;
  pointer-events: none;
}
</style>