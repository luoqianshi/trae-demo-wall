import { useState, useEffect, useMemo } from 'react'

/**
 * P1-2: 情绪脉搏条（Emotion Pulse Bar）
 * 对话区域顶部的 3px 实时情绪可视化
 * 绿色=平静/正面、琥珀色=压力/焦虑、红色=冲突/负面
 */

interface EmotionPulseBarProps {
  /** 最近的消息内容（用于情绪检测） */
  recentMessages: string[]
}

type Emotion = 'calm' | 'positive' | 'stress' | 'conflict'

function detectEmotion(text: string): Emotion {
  const lower = text.toLowerCase()
  // 冲突/负面
  if (/冲突|吵架|生气|愤怒|分手|离婚|打架|骂|公开说|质疑|敲打|催|不对|不好|不行|失败|崩溃|受不了/.test(lower)) {
    return 'conflict'
  }
  // 压力/焦虑
  if (/压力|焦虑|担心|害怕|紧张|累|疲惫|犹豫|纠结|不确定|风险|问题|麻烦|困难/.test(lower)) {
    return 'stress'
  }
  // 正面
  if (/开心|高兴|成功|答应|期待|喜欢|爱|幸福|满足|突破|好消息|庆祝/.test(lower)) {
    return 'positive'
  }
  return 'calm'
}

const EMOTION_COLORS: Record<Emotion, string> = {
  calm: 'var(--color-zen-sage, #6B9E6B)',
  positive: 'var(--color-zen-sage, #5B9B5B)',
  stress: 'var(--color-zen-amber, #C8956D)',
  conflict: 'var(--color-zen-rose, #C75450)',
}

export function EmotionPulseBar({ recentMessages }: EmotionPulseBarProps) {
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('calm')

  // 分析最近 3 条消息的情绪
  const emotion = useMemo(() => {
    const recent = recentMessages.slice(-3)
    if (recent.length === 0) return 'calm' as Emotion
    // 取最近一条消息的情绪，但如果有冲突则优先
    const emotions = recent.map(detectEmotion)
    if (emotions.some(e => e === 'conflict')) return 'conflict' as Emotion
    if (emotions.some(e => e === 'stress')) return 'stress' as Emotion
    if (emotions.some(e => e === 'positive')) return 'positive' as Emotion
    return 'calm' as Emotion
  }, [recentMessages])

  useEffect(() => {
    setCurrentEmotion(emotion)
  }, [emotion])

  const color = EMOTION_COLORS[currentEmotion]
  const isIntense = currentEmotion === 'conflict' || currentEmotion === 'stress'

  return (
    <div className="relative h-[3px] w-full overflow-hidden bg-ink-muted/5">
      {/* 基础渐变条 */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${color}40 30%, ${color}80 50%, ${color}40 70%, transparent 100%)`,
        }}
      />
      {/* 脉冲动画（仅在情绪激烈时） */}
      {isIntense && (
        <div
          className="absolute top-0 h-full w-20"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            animation: 'pulse-sweep 2s linear infinite',
          }}
        />
      )}
      {/* 心电图波纹（仅在冲突时） */}
      {currentEmotion === 'conflict' && (
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 3"
        >
          <path
            d="M0,1.5 L20,1.5 L22,0.5 L24,2.5 L26,1.5 L40,1.5 L42,0.2 L44,2.8 L46,1.5 L60,1.5 L62,0.8 L64,2.2 L66,1.5 L100,1.5"
            fill="none"
            stroke={color}
            strokeWidth="0.3"
            opacity="0.6"
            style={{ animation: 'ecg-flow 1.5s linear infinite' }}
          />
        </svg>
      )}
      <style>{`
        @keyframes pulse-sweep {
          0% { left: -20%; }
          100% { left: 100%; }
        }
        @keyframes ecg-flow {
          0% { transform: translateX(0); }
          100% { transform: translateX(20%); }
        }
      `}</style>
    </div>
  )
}
