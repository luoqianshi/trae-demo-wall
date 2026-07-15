import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { StorageKeys, type PushedVideo, type VoiceMessage } from '@/types'
import { samplePushed } from '@/mock/videos'

const now = Date.now()

const DEFAULT_PUSHED: PushedVideo[] = samplePushed.map((p, i) => ({
  id: `push_${i + 1}`,
  ...p
})) as PushedVideo[]

const DEFAULT_MESSAGES: VoiceMessage[] = [
  { id: 'vm_1', fromChild: '小芳', text: '妈，今天降温啦，多穿点衣服，别忘了吃药❤️', createdAt: now - 3600_000 * 5, read: true },
  { id: 'vm_2', fromChild: '小军', text: '爸，我下周末回家看你们，给你们带了好东西！', createdAt: now - 3600_000 * 26, read: false },
  { id: 'vm_3', fromChild: '小芳', text: '妈，您看我给您发的那个豫剧视频了吗？下次我陪您一起唱~', createdAt: now - 3600_000 * 52, read: true }
]

export const useFamilyStore = defineStore('family', () => {
  const { state: pushedVideos } = useLocalStorage<PushedVideo[]>(StorageKeys.PUSHED_VIDEOS, DEFAULT_PUSHED)
  const { state: voiceMessages } = useLocalStorage<VoiceMessage[]>(StorageKeys.VOICE_MESSAGES, DEFAULT_MESSAGES)

  const unreadCount = ref(voiceMessages.value.filter(m => !m.read).length)

  function markAllRead() {
    voiceMessages.value.forEach(m => { m.read = true })
    unreadCount.value = 0
  }

  function pushVideo(payload: Omit<PushedVideo, 'id' | 'pushedAt'>) {
    pushedVideos.value.unshift({
      id: `push_${Date.now()}`,
      pushedAt: Date.now(),
      ...payload
    })
  }

  function sendMessage(fromChild: string, text: string) {
    voiceMessages.value.unshift({
      id: `vm_${Date.now()}`,
      fromChild,
      text,
      createdAt: Date.now(),
      read: false
    })
    unreadCount.value++
  }

  return {
    pushedVideos,
    voiceMessages,
    unreadCount,
    markAllRead,
    pushVideo,
    sendMessage
  }
})
