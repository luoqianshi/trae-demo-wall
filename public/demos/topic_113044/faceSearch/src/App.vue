<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CameraView from '@/components/CameraView.vue'
import ResultPanel from '@/components/ResultPanel.vue'
import DebugPanel from '@/components/DebugPanel.vue'
import { useEmojiStore } from '@/stores/emojiStore'
import type { EmojiItem } from '@/utils/db'

const emojiStore = useEmojiStore()
const fileInputRef = ref<HTMLInputElement | null>(null)
const cameraViewRef = ref<InstanceType<typeof CameraView> | null>(null)

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif']

onMounted(() => {
  emojiStore.loadFromDB()
})

const handleUploadClick = () => {
  fileInputRef.value?.click()
}

const isVectorValid = (vector: number[]): boolean => {
  return vector.length === 11 && vector.some(v => Math.abs(v) > 0.01)
}

const loadImage = (dataURL: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataURL
  })
}

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = input.files
  
  if (!files || files.length === 0) return
  
  const emojis: Omit<EmojiItem, 'id'>[] = []
  
  for (const file of Array.from(files)) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert(`文件 ${file.name} 不是支持的格式（仅支持 jpg、png、gif）`)
      continue
    }
    
    const dataURL = await fileToDataURL(file)
    const fileType = file.type.split('/')[1] as 'jpg' | 'png' | 'gif'
    
    let featureVector: number[] | undefined
    
    try {
      const img = await loadImage(dataURL)
      const extractedVector = await cameraViewRef.value?.processImageForFeatures(img)
      featureVector = isVectorValid(extractedVector ?? []) ? extractedVector : undefined
      
      if (!featureVector) {
        alert(`文件 ${file.name} 未检测到人脸特征，已忽略`)
        continue
      }
    } catch (error) {
      console.error(`处理文件 ${file.name} 失败:`, error)
      alert(`文件 ${file.name} 处理失败，请重试`)
      continue
    }
    
    emojis.push({
      name: file.name,
      dataURL,
      type: 'local',
      fileType,
      uploadTime: Date.now(),
      featureVector
    })
  }
  
  if (emojis.length > 0) {
    await emojiStore.addEmojis(emojis)
  }
  
  input.value = ''
}

const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
</script>

<template>
  <div class="h-screen w-screen bg-gray-950 flex flex-col">
    <header class="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
      <h1 class="text-white text-xl font-bold">脸替</h1>
      <div class="flex items-center gap-4">
        <span class="text-gray-400 text-sm">© 2026 Face Search</span>
      </div>
    </header>
    <main class="flex-1 flex p-6 gap-6">
      <section class="w-[40%] h-full">
        <CameraView ref="cameraViewRef" />
      </section>
      <section class="w-[60%] h-full">
        <ResultPanel />
      </section>
    </main>
    
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept="image/jpeg,image/png,image/gif"
      class="hidden"
      @change="handleFileChange"
    />
    
    <button
      @click="handleUploadClick"
      class="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all hover:scale-110"
    >
      +
    </button>
    
    <DebugPanel />
  </div>
</template>