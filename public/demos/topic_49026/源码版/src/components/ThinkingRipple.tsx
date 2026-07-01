/**
 * P1-1: AI 思考涟漪（Thinking Ripple）
 * 替代传统"加载中"动画，展示 AI 正在检索的关键词
 * 涟漪从输入消息处发出，到达记忆星图时对应节点亮起
 */

interface ThinkingRippleProps {
  visible: boolean
  keywords?: string[]
}

export function ThinkingRipple({ visible, keywords = [] }: ThinkingRippleProps) {
  if (!visible) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      {/* 涟漪动画 */}
      <div className="relative w-6 h-6 flex-shrink-0">
        <span
          className="absolute inset-0 rounded-full bg-zen-sage/30"
          style={{ animation: 'ripple-expand 1.5s ease-out infinite' }}
        />
        <span
          className="absolute inset-0 rounded-full bg-zen-sage/20"
          style={{ animation: 'ripple-expand 1.5s ease-out infinite 0.5s' }}
        />
        <span
          className="absolute inset-0 rounded-full bg-zen-sage/10"
          style={{ animation: 'ripple-expand 1.5s ease-out infinite 1s' }}
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-zen-sage" style={{ animation: 'core-pulse 1s ease-in-out infinite' }} />
        </span>
      </div>

      {/* 关键词浮现 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-ink-muted">正在检索</span>
        {keywords.length > 0 ? (
          keywords.map((kw, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full bg-zen-sage/10 text-zen-sage font-medium"
              style={{
                animation: `keyword-fadein 0.4s ease-out ${i * 0.2}s both`,
              }}
            >
              {kw}
            </span>
          ))
        ) : (
          <span
            className="text-xs text-zen-sage font-medium"
            style={{ animation: 'thinking-dots 1.5s ease-in-out infinite' }}
          >
            思考中...
          </span>
        )}
      </div>

      <style>{`
        @keyframes ripple-expand {
          0% { transform: scale(0.5); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes core-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        @keyframes keyword-fadein {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes thinking-dots {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
