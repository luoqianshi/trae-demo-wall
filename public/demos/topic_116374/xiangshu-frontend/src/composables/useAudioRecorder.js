import { ref, onUnmounted } from 'vue'

// 录音组合式函数：封装 Web Audio API 的录音与波形采样
// 提供开始/停止/计时/波形数据，便于在视图中直接消费
export function useAudioRecorder() {
  const isRecording = ref(false)
  const seconds = ref(0)
  // 8 条波形条的高度（0-100），驱动 CSS 波形动画
  const waveBars = ref(new Array(8).fill(10))

  let audioContext = null
  let analyser = null
  let mediaStream = null
  let mediaRecorder = null
  let chunks = []
  let timerId = null
  let rafId = null

  // 计时器
  const startTimer = () => {
    seconds.value = 0
    timerId = setInterval(() => {
      seconds.value += 1
    }, 1000)
  }

  const stopTimer = () => {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
  }

  // 波形采样循环
  const sampleWave = () => {
    if (!analyser) return
    const buffer = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(buffer)
    // 取 8 段平均
    const step = Math.floor(buffer.length / 8)
    const bars = []
    for (let i = 0; i < 8; i++) {
      let sum = 0
      for (let j = 0; j < step; j++) sum += buffer[i * step + j]
      const avg = sum / step
      bars.push(Math.max(8, Math.min(100, (avg / 255) * 100)))
    }
    waveBars.value = bars
    rafId = requestAnimationFrame(sampleWave)
  }

  // 开始录音
  const start = async () => {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(mediaStream)
      analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      mediaRecorder = new MediaRecorder(mediaStream)
      chunks = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      mediaRecorder.start()

      isRecording.value = true
      startTimer()
      sampleWave()
    } catch (err) {
      // 浏览器拒绝麦克风权限或环境不支持时，降级为「模拟录音」
      isRecording.value = true
      startTimer()
      // 模拟波形：随机抖动
      const fakeWave = () => {
        if (!isRecording.value) return
        waveBars.value = waveBars.value.map(() =>
          Math.max(8, Math.min(100, Math.random() * 80 + 10))
        )
        rafId = requestAnimationFrame(fakeWave)
      }
      fakeWave()
    }
  }

  // 停止录音，返回 { duration, blob, url }
  const stop = () => {
    return new Promise((resolve) => {
      const duration = seconds.value
      isRecording.value = false
      stopTimer()
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }

      const finish = () => {
        if (mediaStream) {
          mediaStream.getTracks().forEach((t) => t.stop())
          mediaStream = null
        }
        if (audioContext) {
          audioContext.close()
          audioContext = null
        }
        analyser = null
        waveBars.value = new Array(8).fill(10)
        resolve({ duration, blob: null, url: '' })
      }

      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' })
          const url = URL.createObjectURL(blob)
          finish()
          resolve({ duration, blob, url })
        }
        mediaRecorder.stop()
      } else {
        finish()
      }
    })
  }

  // 组件卸载时清理资源
  onUnmounted(() => {
    if (isRecording.value) stop()
  })

  return {
    isRecording,
    seconds,
    waveBars,
    start,
    stop
  }
}
