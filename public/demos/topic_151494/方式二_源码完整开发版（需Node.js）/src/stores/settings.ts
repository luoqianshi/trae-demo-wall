import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { StorageKeys, type UserSettings, type UserMode } from '@/types'

const DEFAULT_SETTINGS: UserSettings = {
  fontSize: 'large',
  speechRate: 'normal',
  currentMode: 'elder',
  elderName: '张阿姨',
  childName: '小芳',
  dailyLimitMinutes: 120,
  eyeReminderEnabled: true,
  exerciseReminderEnabled: true
}

export const useSettingsStore = defineStore('settings', () => {
  const { state } = useLocalStorage<UserSettings>(StorageKeys.USER_SETTINGS, DEFAULT_SETTINGS)
  const settings = state

  const fontSizeScale = computed(() => {
    if (settings.value.fontSize === 'normal') return 1
    if (settings.value.fontSize === 'large') return 1.15
    return 1.35
  })

  function setMode(mode: UserMode) {
    settings.value.currentMode = mode
  }
  function toggleMode() {
    const modes: UserMode[] = ['elder', 'child', 'community']
    const i = modes.indexOf(settings.value.currentMode)
    settings.value.currentMode = modes[(i + 1) % modes.length]
  }
  function setFontSize(s: UserSettings['fontSize']) {
    settings.value.fontSize = s
  }
  function setSpeechRate(s: UserSettings['speechRate']) {
    settings.value.speechRate = s
  }
  function updateSettings(patch: Partial<UserSettings>) {
    settings.value = { ...settings.value, ...patch }
  }

  return {
    settings,
    fontSizeScale,
    setMode,
    toggleMode,
    setFontSize,
    setSpeechRate,
    updateSettings
  }
})
