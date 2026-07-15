import { defineStore } from 'pinia'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { StorageKeys, type VideoCollection, type CommunityEvent } from '@/types'

const DEFAULT_COLLECTIONS: VideoCollection[] = [
  {
    id: 'col_1',
    name: '经典戏曲合集 · 黄梅戏+京剧',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20beijing%20opera%20performance%20traditional%20costume%20colorful%20stage&image_size=landscape_4_3',
    videoIds: ['dy_001_opera_01', 'dy_002_opera_02'],
    createdAt: Date.now() - 86400_000 * 5
  },
  {
    id: 'col_2',
    name: '家庭广场舞10首 · 团队版',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20elderly%20people%20square%20dance%20park%20colorful%20happy%20group&image_size=landscape_4_3',
    videoIds: ['dy_003_dance_01'],
    createdAt: Date.now() - 86400_000 * 3
  },
  {
    id: 'col_3',
    name: '养生堂 · 中老年保健合集',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20medicine%20elderly%20health%20wellness%20massage%20peaceful&image_size=landscape_4_3',
    videoIds: ['dy_004_health_01', 'dy_005_health_02'],
    createdAt: Date.now() - 86400_000 * 1
  }
]

const DEFAULT_EVENTS: CommunityEvent[] = [
  {
    id: 'evt_1',
    title: '社区重阳节广场舞大赛',
    date: '2026-10-19 14:00',
    location: '阳光社区中心广场',
    description: '重阳佳节，欢迎各位舞蹈队报名参赛，奖品丰厚，亲友团观赛免门票！',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20elderly%20square%20dance%20competition%20festival%20colorful%20celebration&image_size=landscape_16_9',
    emoji: '🏮',
    createdAt: Date.now()
  },
  {
    id: 'evt_2',
    title: '免费老年手机课堂第3期',
    date: '2026-07-20 09:30',
    location: '街道综合为老服务中心 2楼',
    description: '手把手教您用抖音、微信视频号、防诈骗小知识，现场还有反诈手册发放哦！',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20elderly%20learning%20smartphone%20class%20community%20center%20happy&image_size=landscape_16_9',
    emoji: '📱',
    createdAt: Date.now()
  }
]

export const useCommunityStore = defineStore('community', () => {
  const { state: collections } = useLocalStorage<VideoCollection[]>(StorageKeys.COLLECTIONS, DEFAULT_COLLECTIONS)
  const { state: events } = useLocalStorage<CommunityEvent[]>(StorageKeys.EVENTS, DEFAULT_EVENTS)

  function createCollection(name: string, videoIds: string[], coverUrl: string) {
    collections.value.unshift({
      id: `col_${Date.now()}`,
      name,
      coverUrl,
      videoIds,
      createdAt: Date.now()
    })
  }

  function publishEvent(data: Omit<CommunityEvent, 'id' | 'createdAt'>) {
    events.value.unshift({
      id: `evt_${Date.now()}`,
      createdAt: Date.now(),
      ...data
    })
  }

  function attachQRCode(collectionId: string, dataUrl: string) {
    const col = collections.value.find(c => c.id === collectionId)
    if (col) col.qrCodeDataUrl = dataUrl
  }

  return {
    collections,
    events,
    createCollection,
    publishEvent,
    attachQRCode
  }
})
