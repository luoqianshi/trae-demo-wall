/**
 * 恶魔的代价 - 音效系统
 * 使用 Web Audio API 生成简单音效
 */

// 音频上下文（延迟初始化）
let audioCtx = null
// 静音状态
let muted = false

/**
 * 获取/创建音频上下文
 */
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

/**
 * 播放发现线索音效 - 上升音调
 */
export function playDiscovery() {
  if (muted) return
  try {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.15)

    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch (e) {
    // 静默处理音频错误
  }
}

/**
 * 播放关联成功音效 - 和弦
 */
export function playConnect() {
  if (muted) return
  try {
    const ctx = getAudioContext()
    const frequencies = [523, 659, 784] // C5, E5, G5 和弦

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1)

      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.4)

      osc.start(ctx.currentTime + i * 0.1)
      osc.stop(ctx.currentTime + i * 0.1 + 0.4)
    })
  } catch (e) {
    // 静默处理音频错误
  }
}

/**
 * 播放失败音效 - 下降音调
 */
export function playError() {
  if (muted) return
  try {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3)

    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch (e) {
    // 静默处理音频错误
  }
}

/**
 * 切换静音状态
 * @returns {boolean} 切换后的静音状态
 */
export function toggleMute() {
  muted = !muted
  return muted
}
