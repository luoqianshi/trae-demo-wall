import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { EmojiItem } from '@/utils/db'
import { getAllEmojis, addEmojis as dbAddEmojis, deleteEmoji, clearAllEmojis } from '@/utils/db'

export interface FeatureVector {
  smile: number
  mouthOpen: number
  leftBrow: number
  rightBrow: number
  headTilt: number
  bodyTilt: number
  thumb: number
  indexFinger: number
  middleFinger: number
  ringFinger: number
  pinkyFinger: number
}

export interface FaceLandmark {
  x: number
  y: number
  z: number
}

export interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility: number
}

export interface HandLandmark {
  x: number
  y: number
  z: number
}

export interface MatchResult {
  emoji: EmojiItem
  similarity: number
}

export const useEmojiStore = defineStore('emoji', () => {
  const localEmojis = ref<EmojiItem[]>([])
  const selectedEmoji = ref<EmojiItem | null>(null)
  
  const featureVector = ref<FeatureVector>({
    smile: 0,
    mouthOpen: 0,
    leftBrow: 0,
    rightBrow: 0,
    headTilt: 0,
    bodyTilt: 0,
    thumb: 0,
    indexFinger: 0,
    middleFinger: 0,
    ringFinger: 0,
    pinkyFinger: 0
  })
  
  const faceLandmarks = ref<FaceLandmark[]>([])
  const poseLandmarks = ref<PoseLandmark[]>([])
  const handLandmarks = ref<HandLandmark[]>([])
  const isDetecting = ref(false)
  const isDebugMode = ref(false)

  const loadFromDB = async () => {
    try {
      const emojis = await getAllEmojis()
      localEmojis.value = emojis.sort((a, b) => b.uploadTime - a.uploadTime)
    } catch (error) {
      console.error('加载表情失败:', error)
    }
  }

  const addEmojis = async (emojis: Omit<EmojiItem, 'id'>[]) => {
    const newEmojis: EmojiItem[] = emojis.map(emoji => ({
      ...emoji,
      id: crypto.randomUUID()
    }))
    
    try {
      await dbAddEmojis(newEmojis)
      localEmojis.value = [...newEmojis, ...localEmojis.value]
    } catch (error) {
      console.error('保存表情失败:', error)
    }
  }

  const removeEmoji = async (id: string) => {
    try {
      await deleteEmoji(id)
      const index = localEmojis.value.findIndex(e => e.id === id)
      if (index !== -1) {
        localEmojis.value.splice(index, 1)
      }
      if (selectedEmoji.value?.id === id) {
        selectedEmoji.value = null
      }
    } catch (error) {
      console.error('删除表情失败:', error)
    }
  }

  const clearAll = async () => {
    try {
      await clearAllEmojis()
      localEmojis.value = []
      selectedEmoji.value = null
    } catch (error) {
      console.error('清空表情失败:', error)
    }
  }

  const selectEmoji = (emoji: EmojiItem | null) => {
    selectedEmoji.value = emoji
  }

  const updateFeatureVector = (vector: Partial<FeatureVector>) => {
    featureVector.value = { ...featureVector.value, ...vector }
  }

  const updateFaceLandmarks = (landmarks: FaceLandmark[]) => {
    faceLandmarks.value = landmarks
  }

  const updatePoseLandmarks = (landmarks: PoseLandmark[]) => {
    poseLandmarks.value = landmarks
  }

  const updateHandLandmarks = (landmarks: HandLandmark[]) => {
    handLandmarks.value = landmarks
  }

  const setDetecting = (detecting: boolean) => {
    isDetecting.value = detecting
  }

  const resetDetection = () => {
    featureVector.value = {
      smile: 0,
      mouthOpen: 0,
      leftBrow: 0,
      rightBrow: 0,
      headTilt: 0,
      bodyTilt: 0,
      thumb: 0,
      indexFinger: 0,
      middleFinger: 0,
      ringFinger: 0,
      pinkyFinger: 0
    }
    faceLandmarks.value = []
    poseLandmarks.value = []
    handLandmarks.value = []
    isDetecting.value = false
  }

  const toggleDebugMode = () => {
    isDebugMode.value = !isDebugMode.value
  }

  const vectorToArray = (vector: FeatureVector): number[] => {
    return [
      vector.smile, 
      vector.mouthOpen, 
      vector.leftBrow, 
      vector.rightBrow, 
      vector.headTilt, 
      vector.bodyTilt,
      vector.thumb,
      vector.indexFinger,
      vector.middleFinger,
      vector.ringFinger,
      vector.pinkyFinger
    ]
  }

  const getCurrentVectorArray = (): number[] => {
    return vectorToArray(featureVector.value)
  }

  const weightedSimilarity = (a: number[], b: number[]): number => {
    if (a.length !== b.length) return 0
    
    const weights = [2.0, 2.0, 1.0, 1.0, 1.0, 1.0, 1.5, 1.5, 1.5, 1.5, 1.5]
    
    let weightedSum = 0
    let totalWeight = 0
    
    for (let i = 0; i < a.length; i++) {
      const diff = Math.abs(a[i] - b[i])
      const similarity = 1 - diff
      weightedSum += similarity * weights[i]
      totalWeight += weights[i]
    }
    
    return weightedSum / totalWeight
  }

  const computeMatches = (): MatchResult[] => {
    const currentVector = getCurrentVectorArray()
    const results: MatchResult[] = []
    
    for (const emoji of localEmojis.value) {
      let similarity = 0
      
      if (emoji.featureVector && emoji.featureVector.length === 11) {
        similarity = weightedSimilarity(currentVector, emoji.featureVector)
      } else if (emoji.featureVector && emoji.featureVector.length === 6) {
        const extendedVector = [...emoji.featureVector, 0, 0, 0, 0, 0]
        similarity = weightedSimilarity(currentVector, extendedVector)
      }
      
      results.push({ emoji, similarity })
    }
    
    results.sort((a, b) => b.similarity - a.similarity)
    
    if (isDebugMode.value) {
      console.log('[DEBUG] 当前特征向量:', currentVector)
      console.log('[DEBUG] 匹配结果:', results.slice(0, 5).map(r => ({ 
        name: r.emoji.name, 
        similarity: (r.similarity * 100).toFixed(1) + '%',
        featureVector: r.emoji.featureVector 
      })))
    }
    
    return results.slice(0, 5)
  }

  const topMatches = computed(() => {
    return computeMatches()
  })

  const bestMatch = computed(() => {
    const matches = topMatches.value
    return matches.length > 0 ? matches[0] : null
  })

  return {
    localEmojis,
    selectedEmoji,
    featureVector,
    faceLandmarks,
    poseLandmarks,
    handLandmarks,
    isDetecting,
    isDebugMode,
    topMatches,
    bestMatch,
    loadFromDB,
    addEmojis,
    removeEmoji,
    clearAll,
    selectEmoji,
    updateFeatureVector,
    updateFaceLandmarks,
    updatePoseLandmarks,
    updateHandLandmarks,
    setDetecting,
    resetDetection,
    toggleDebugMode,
    getCurrentVectorArray,
    computeMatches
  }
})