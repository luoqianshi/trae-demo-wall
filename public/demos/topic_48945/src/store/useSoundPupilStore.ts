import { create } from 'zustand'
import type { NarrationIntensity, NarrationResult, VisionMode } from '@/services/vision/types'
import type { VisionConfigStatus } from '../../shared/vision-config'

export type ServiceStatus = 'online' | 'degraded' | 'simulation'

export interface SoundPupilState {
  isCameraReady: boolean
  isRunning: boolean
  speechEnabled: boolean
  isSpeaking: boolean
  mode: VisionMode
  narrationIntensity: NarrationIntensity
  serviceStatus: ServiceStatus
  realConfigStatus: VisionConfigStatus
  lastNarration: NarrationResult | null
  countdown: number
  statusMessage: string
  errorMessage: string
  setCameraReady: (value: boolean) => void
  setRunning: (value: boolean) => void
  setSpeechEnabled: (value: boolean) => void
  setSpeaking: (value: boolean) => void
  setMode: (value: VisionMode) => void
  setNarrationIntensity: (value: NarrationIntensity) => void
  setServiceStatus: (value: ServiceStatus) => void
  setRealConfigStatus: (value: VisionConfigStatus) => void
  setNarration: (value: NarrationResult | null) => void
  setCountdown: (value: number) => void
  setStatusMessage: (value: string) => void
  setErrorMessage: (value: string) => void
}

export const useSoundPupilStore = create<SoundPupilState>((set) => ({
  isCameraReady: false,
  isRunning: false,
  speechEnabled: true,
  isSpeaking: false,
  mode: 'mock',
  narrationIntensity: 'standard',
  serviceStatus: 'simulation',
  realConfigStatus: 'missing',
  lastNarration: null,
  countdown: 3,
  statusMessage: '等待开启摄像头并开始播报',
  errorMessage: '',
  setCameraReady: (value) => set({ isCameraReady: value }),
  setRunning: (value) => set({ isRunning: value }),
  setSpeechEnabled: (value) => set({ speechEnabled: value }),
  setSpeaking: (value) => set({ isSpeaking: value }),
  setMode: (value) => set({ mode: value }),
  setNarrationIntensity: (value) => set({ narrationIntensity: value }),
  setServiceStatus: (value) => set({ serviceStatus: value }),
  setRealConfigStatus: (value) => set({ realConfigStatus: value }),
  setNarration: (value) => set({ lastNarration: value }),
  setCountdown: (value) => set({ countdown: value }),
  setStatusMessage: (value) => set({ statusMessage: value }),
  setErrorMessage: (value) => set({ errorMessage: value }),
}))
