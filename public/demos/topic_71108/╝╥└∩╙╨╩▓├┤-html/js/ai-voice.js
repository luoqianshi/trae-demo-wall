// ===== 语音识别模块 (Web Speech API) =====
window.HomeStash = window.HomeStash || {}
HomeStash.aiVoice = (function () {
  function isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }

  // 创建识别器；opts: { onResult(text, isFinal), onError, onEnd }
  function createRecorder(opts) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return null
    const rec = new SR()
    rec.lang = 'zh-CN'
    rec.interimResults = true
    rec.continuous = false

    rec.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join('')
      const isFinal = e.results[e.results.length - 1].isFinal
      if (opts.onResult) opts.onResult(text, isFinal)
    }
    rec.onerror = (e) => {
      if (opts.onError) opts.onError(e.error)
    }
    rec.onend = () => {
      if (opts.onEnd) opts.onEnd()
    }
    return rec
  }

  function start(rec) {
    if (rec) try { rec.start() } catch (e) { /* 重复启动 */ }
  }

  function stop(rec) {
    if (rec) try { rec.stop() } catch (e) { /* ignore */ }
  }

  return { isSupported, createRecorder, start, stop }
})()
