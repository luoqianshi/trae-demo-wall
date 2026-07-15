import { ref, computed } from 'vue'

const isSpeaking = ref(false)
const isPaused = ref(false)
const currentText = ref('')

function getRate(level: 'slow' | 'normal' | 'fast') {
  return level === 'slow' ? 0.75 : level === 'fast' ? 1.25 : 1
}

function pickChineseVoice(gender: 'male' | 'female' = 'female'): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  const zhVoices = voices.filter(v => v.lang.includes('zh') || v.lang.includes('CN'))
  if (zhVoices.length === 0) return voices[0] ?? null
  if (gender === 'male') {
    const male = zhVoices.find(v => /male|男|yunjian|yunxi|yunyang/i.test(v.name))
    return male ?? zhVoices[0]
  }
  const female = zhVoices.find(v => /female|女|xiaoxiao|yunxi|yunhan|xiaoyi/i.test(v.name))
  return female ?? zhVoices[0]
}

export function useSpeech() {
  const speak = (
    text: string,
    opts: { rateLevel?: 'slow' | 'normal' | 'fast'; gender?: 'male' | 'female' } = {}
  ) => {
    if (!('speechSynthesis' in window)) {
      console.warn('当前浏览器不支持语音合成')
      return
    }
    stop()
    if (!text || !text.trim()) return
    currentText.value = text
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'zh-CN'
    utter.rate = getRate(opts.rateLevel ?? 'normal')
    utter.pitch = 1
    utter.volume = 1
    const voice = pickChineseVoice(opts.gender ?? 'female')
    if (voice) utter.voice = voice
    utter.onstart = () => { isSpeaking.value = true; isPaused.value = false }
    utter.onend = () => { isSpeaking.value = false; isPaused.value = false }
    utter.onerror = () => { isSpeaking.value = false; isPaused.value = false }
    window.speechSynthesis.speak(utter)
  }

  const pause = () => {
    if ('speechSynthesis' in window && isSpeaking.value) {
      window.speechSynthesis.pause()
      isPaused.value = true
    }
  }

  const resume = () => {
    if ('speechSynthesis' in window && isPaused.value) {
      window.speechSynthesis.resume()
      isPaused.value = false
    }
  }

  const stop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      isSpeaking.value = false
      isPaused.value = false
    }
  }

  const supported = computed(() => 'speechSynthesis' in window)

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    currentText,
    supported
  }
}
