var ttsEnabled = false

function isEnabled() {
  return ttsEnabled
}

function enable() {
  ttsEnabled = true
}

function disable() {
  ttsEnabled = false
}

function toggle() {
  ttsEnabled = !ttsEnabled
  return ttsEnabled
}

function speak(text) {
  if (!ttsEnabled) return
  if (!text || text.trim().length === 0) return

  var cleanText = text
    .replace(/mmHg/g, '毫米汞柱')
    .replace(/bpm/g, '次每分钟')
    .replace(/[#*_~`>\[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleanText) return

  wx.showToast({
    title: cleanText,
    icon: 'none',
    duration: Math.max(cleanText.length * 120, 2500)
  })
}

function stop() {
  ttsEnabled = false
}

module.exports = {
  enable: enable,
  disable: disable,
  toggle: toggle,
  isEnabled: isEnabled,
  speak: speak,
  stop: stop
}
