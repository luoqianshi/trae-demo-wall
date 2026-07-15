import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getAudioList,
  getAudioTaskList,
  getVoiceList,
  type AudioItem,
  type AudioTaskItem,
  type VoiceItem
} from '@/api/audio'

export const useAudioStore = defineStore('audio', () => {
  const audioList = ref<AudioItem[]>([])
  const taskList = ref<AudioTaskItem[]>([])
  const voiceList = ref<VoiceItem[]>([])
  const currentTask = ref<AudioTaskItem | null>(null)
  const loading = ref(false)

  /** 获取音频列表 */
  const fetchAudioList = async (projectId: string) => {
    loading.value = true
    try {
      const data: any = await getAudioList(projectId)
      audioList.value = data?.list || data || []
    } catch {
      audioList.value = []
    } finally {
      loading.value = false
    }
  }

  /** 获取任务列表 */
  const fetchTaskList = async (projectId: string) => {
    try {
      const data: any = await getAudioTaskList(projectId)
      taskList.value = data?.list || data || []
    } catch {
      taskList.value = []
    }
  }

  /** 获取音色列表 */
  const fetchVoiceList = async () => {
    try {
      const data: any = await getVoiceList()
      voiceList.value = data?.list || data || []
    } catch {
      voiceList.value = []
    }
  }

  /** 清空当前任务 */
  const clearCurrentTask = () => {
    currentTask.value = null
  }

  /** 设置当前任务 */
  const setCurrentTask = (task: AudioTaskItem | null) => {
    currentTask.value = task
  }

  return {
    audioList,
    taskList,
    voiceList,
    currentTask,
    loading,
    fetchAudioList,
    fetchTaskList,
    fetchVoiceList,
    clearCurrentTask,
    setCurrentTask
  }
})