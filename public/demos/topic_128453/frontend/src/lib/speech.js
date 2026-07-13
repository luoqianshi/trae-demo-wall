// 语音合成模块（Edge 神经语音版）
// 通过后端 /api/tts 接口调用 Edge 神经语音引擎，生成高质量 MP3 音频
// 前端用 HTML5 Audio 播放，告别生硬的系统 SAPI 语音

/**
 * 检测浏览器是否支持音频播放
 */
export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'Audio' in window
}

/**
 * 构建语音内容：角色名 + "答。" + 原文 + 白话 + 解读
 */
export function buildSpeechText(answer) {
  const parts = []
  if (answer.role) parts.push(`${answer.role}答。`)
  if (answer.quote) parts.push(answer.quote)
  if (answer.plain) parts.push(answer.plain)
  if (answer.interpretation) parts.push(answer.interpretation)
  return parts.join(' ')
}

// ============ 圣贤语音包信息（用于前端展示）============
export const VOICE_PROFILES = {
  zhuangzi: {
    voice: 'zh-CN-YunxiNeural',
    description: '通透空灵·轻快与悠远并存·洒脱戏谑',
    historicalNote: '庄子声线定位：清瘦中年偏轻中音，音色通透空灵，可随性轻快，可悠远缥缈，弹性极强。讲鲲鹏、梦蝶、奇喻时语速轻快灵动，带一丝洒脱戏谑，语气松弛散漫，像闲坐山野闲谈；谈生死、逍遥、齐物大道时语速放缓，声线变空灵缥缈，似乘风云端，淡然超脱，无执念；嘲讽世俗权贵时淡淡轻笑，语调轻佻却不刻薄，冷眼旁观人间纷争。',
  },
  kongzi: {
    voice: 'zh-CN-YunyangNeural',
    description: '温润中音·清朗有力·恳切坚定·从容悲悯',
    historicalNote: '孔子声线定位（融合中年周游列国与晚年归鲁修书）：温润中音，清朗有力，语速平稳规整，咬字端正。心怀理想，恳切坚定，劝人向善时语气温柔，谈及乱世礼崩乐坏时略带沉郁叹息，讲学耐心谦和，待人恭谨有礼。晚年偏低沉带轻微苍老沙哑，气息柔和，少了激昂，多沉淀通透。从容悲悯，回忆世事有淡淡怅然，教导弟子宽厚包容，庄重肃穆，谈及仁义时沉稳厚重。',
  },
  laozi: {
    voice: 'zh-CN-YunyangNeural',
    description: '中老年低音·胸腔共鸣·语速极缓·留白悠长',
    historicalNote: '老子主张清静无为。声线定位：中老年低音、胸腔共鸣厚重，语速极缓，停顿长，气息绵长松弛，无激烈起伏，像山涧流水、古寺钟声。语调平直少起伏，从不高声，轻声道出至理，自带岁月沧桑的淡然。讲到"道""天地"时尾音微微下沉，留白感强。极少情绪波动，悲悯却不伤感，包容万物，不带说教压迫感。',
  },
  sunzi: {
    voice: 'zh-CN-YunjianNeural',
    description: '沉稳偏低中音·紧实有力·冷静客观·将帅威严',
    historicalNote: '孙子声线定位：沉稳偏低中音，声线紧实有力，气息稳定，咬字干脆利落，无多余拖音。论兵法、战局谋略时冷静客观，条理清晰，语速均匀克制，逻辑感极强，字字有力量，不情绪化；谈"不战而屈人之兵"慎战思想时语调放缓，多一层仁厚格局，并非好战莽夫；分析利害、虚实、生死之机时语调冷冽清醒，冷静通透，自带将帅的沉稳威严。',
  },
  wangyangming: {
    voice: 'zh-CN-YunxiNeural',
    description: '温润醇厚中低音·儒雅文气与将帅底气·循循善诱·淡然豁达',
    historicalNote: '王阳明声线定位（中老年大成后·主流常用配音）：温润醇厚中低音，兼具儒雅文气与将帅底气，声线层次丰富。讲学谈心学"心即理、致良知"时温和通透，循循善诱，亲切有感染力，如长者谈心；论行军平乱、决断大事时声线骤然沉稳锐利，干脆果决，威严内敛，杀伐藏于平和之下；谈及磨难得失时淡然豁达，历经风雨后的松弛通透，无抱怨愤懑。',
  },
}

// 当前音频实例
let currentAudio = null
let isCancelled = false

// 后端 API 地址
const API_BASE = 'http://localhost:8000'

/**
 * 开始语音朗读 —— 调用后端 Edge TTS 接口
 * @param {Object} answer 回答数据
 * @param {Object} options { roleId, onStart, onEnd, onError }
 */
export async function speak(answer, options = {}) {
  // 停止已有播放
  stop()
  isCancelled = false

  const text = buildSpeechText(answer)
  if (!text) {
    if (options.onError) options.onError({ error: 'empty' })
    return false
  }

  const roleId = answer.roleId || options.roleId || 'zhuangzi'

  try {
    // 调用后端 TTS 接口
    const response = await fetch(`${API_BASE}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, role: roleId }),
    })

    if (!response.ok) {
      throw new Error(`TTS API 返回 ${response.status}`)
    }

    if (isCancelled) return false

    // 获取音频二进制数据
    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)

    if (isCancelled) {
      URL.revokeObjectURL(audioUrl)
      return false
    }

    // 创建音频播放器
    currentAudio = new Audio(audioUrl)
    currentAudio.onplay = () => {
      if (options.onStart) options.onStart()
    }
    currentAudio.onended = () => {
      URL.revokeObjectURL(audioUrl)
      currentAudio = null
      if (options.onEnd) options.onEnd()
    }
    currentAudio.onerror = () => {
      URL.revokeObjectURL(audioUrl)
      currentAudio = null
      if (!isCancelled && options.onError) {
        options.onError({ error: 'audio-playback' })
      }
    }

    // 开始播放
    await currentAudio.play()
    return true

  } catch (err) {
    currentAudio = null
    if (isCancelled) return false

    // 判断错误类型
    if (err.message && err.message.includes('Failed to fetch')) {
      if (options.onError) options.onError({ error: 'backend-unavailable' })
    } else if (err.message && err.message.includes('TTS API')) {
      if (options.onError) options.onError({ error: 'tts-service' })
    } else {
      if (options.onError) options.onError({ error: 'unknown', message: err.message })
    }
    return false
  }
}

/**
 * 停止语音播放
 */
export function stop() {
  isCancelled = true
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
}

/**
 * 是否正在播放
 */
export function isSpeaking() {
  return currentAudio !== null && !currentAudio.paused
}

/**
 * 获取角色的语音包信息
 */
export function getVoiceProfile(roleId) {
  return VOICE_PROFILES[roleId] || null
}
