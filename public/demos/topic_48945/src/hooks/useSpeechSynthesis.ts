import { useCallback, useEffect, useMemo } from 'react'
import { appConfig } from '@/config/appConfig'

export function useSpeechSynthesis(onSpeakingChange?: (speaking: boolean) => void) {
  const supported = useMemo(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
    [],
  )

  const cancel = useCallback(() => {
    if (!supported) {
      return
    }

    window.speechSynthesis.cancel()
    onSpeakingChange?.(false)
  }, [onSpeakingChange, supported])

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text) {
        return false
      }

      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = appConfig.speechLanguage
      utterance.rate = 1
      utterance.pitch = 1

      utterance.onstart = () => onSpeakingChange?.(true)
      utterance.onend = () => onSpeakingChange?.(false)
      utterance.onerror = () => onSpeakingChange?.(false)

      window.speechSynthesis.speak(utterance)
      return true
    },
    [onSpeakingChange, supported],
  )

  useEffect(() => cancel, [cancel])

  return {
    supported,
    speak,
    cancel,
  }
}
