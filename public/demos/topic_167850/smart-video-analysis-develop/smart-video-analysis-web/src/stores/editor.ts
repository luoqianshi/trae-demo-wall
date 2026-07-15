import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Track {
  id: string
  editorProjectId: string
  trackType: string
  trackName: string
  trackIndex: number
  volume: number
  isMuted: number
  isLocked: number
  clips: Clip[]
}

export interface Clip {
  id: string
  trackId: string
  sourceType: string
  sourceId: string
  sourcePath: string
  bucketName: string
  clipName: string
  startPosition: number
  duration: number
  sourceStart: number
  sourceDuration: number
  volume: number
  opacity: number
  speed: number
  inTransition: string
  outTransition: string
  transitionDuration: number
  effects: string
}

export interface Material {
  id: string
  name: string
  type: string
  duration: number
  fileSize: number
  storagePath: string
  bucketName: string
  thumbnail?: string
}

export const useEditorStore = defineStore('editor', () => {
  const currentProjectId = ref<string>('')
  const currentProject = ref<any>(null)
  const tracks = ref<Track[]>([])
  const clips = ref<Clip[]>([])
  const materials = ref<{ videos: Material[], audios: Material[], images: Material[] }>({
    videos: [],
    audios: [],
    images: []
  })
  const selectedClipId = ref<string>('')
  const selectedTrackId = ref<string>('')
  const playheadPosition = ref(0)
  const isPlaying = ref(false)
  const exportProgress = ref(0)
  const analysisResult = ref<any>(null)

  const selectedClip = computed(() => {
    return clips.value.find(c => c.id === selectedClipId.value) || null
  })

  const selectedTrack = computed(() => {
    return tracks.value.find(t => t.id === selectedTrackId.value) || null
  })

  const totalDuration = computed(() => {
    let maxEnd = 0
    tracks.value.forEach(track => {
      track.clips.forEach(clip => {
        const end = clip.startPosition + clip.duration
        if (end > maxEnd) maxEnd = end
      })
    })
    return maxEnd || 180000
  })

  const setCurrentProjectId = (id: string) => {
    currentProjectId.value = id
  }

  const setCurrentProject = (project: any) => {
    currentProject.value = project
  }

  const setTracks = (data: Track[]) => {
    tracks.value = data
  }

  const setClips = (data: Clip[]) => {
    clips.value = data
  }

  const addClip = (clip: Clip) => {
    clips.value.push(clip)
    const track = tracks.value.find(t => t.id === clip.trackId)
    if (track) {
      track.clips.push(clip)
      track.clips.sort((a, b) => a.startPosition - b.startPosition)
    }
  }

  const updateClip = (clipId: string, updates: Partial<Clip>) => {
    const clip = clips.value.find(c => c.id === clipId)
    if (clip) {
      Object.assign(clip, updates)
      const track = tracks.value.find(t => t.id === clip.trackId)
      if (track) {
        const trackClip = track.clips.find(c => c.id === clipId)
        if (trackClip) {
          Object.assign(trackClip, updates)
        }
      }
    }
  }

  const removeClip = (clipId: string) => {
    clips.value = clips.value.filter(c => c.id !== clipId)
    tracks.value.forEach(track => {
      track.clips = track.clips.filter(c => c.id !== clipId)
    })
  }

  const setSelectedClipId = (id: string) => {
    selectedClipId.value = id
  }

  const setSelectedTrackId = (id: string) => {
    selectedTrackId.value = id
  }

  const setPlayheadPosition = (position: number) => {
    playheadPosition.value = position
  }

  const togglePlay = () => {
    isPlaying.value = !isPlaying.value
  }

  const setMaterials = (data: { videos: Material[], audios: Material[], images: Material[] }) => {
    materials.value = data
  }

  const setExportProgress = (progress: number) => {
    exportProgress.value = progress
  }

  const setAnalysisResult = (result: any) => {
    analysisResult.value = result
  }

  const clearSelection = () => {
    selectedClipId.value = ''
    selectedTrackId.value = ''
  }

  return {
    currentProjectId,
    currentProject,
    tracks,
    clips,
    materials,
    selectedClipId,
    selectedTrackId,
    playheadPosition,
    isPlaying,
    exportProgress,
    analysisResult,
    selectedClip,
    selectedTrack,
    totalDuration,
    setCurrentProjectId,
    setCurrentProject,
    setTracks,
    setClips,
    addClip,
    updateClip,
    removeClip,
    setSelectedClipId,
    setSelectedTrackId,
    setPlayheadPosition,
    togglePlay,
    setMaterials,
    setExportProgress,
    setAnalysisResult,
    clearSelection
  }
})