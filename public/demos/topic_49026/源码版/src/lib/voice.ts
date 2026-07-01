export function isVoiceEnabled(): boolean {
  return localStorage.getItem('hengzhou-voice-enabled') === 'true'
}

export function setVoiceEnabled(value: boolean): void {
  localStorage.setItem('hengzhou-voice-enabled', String(value))
}

export function speak(text: string): void {
  if (!isVoiceEnabled()) return
  if (!('speechSynthesis' in window)) return
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'zh-CN'
  utter.rate = 1
  utter.pitch = 1
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utter)
}
