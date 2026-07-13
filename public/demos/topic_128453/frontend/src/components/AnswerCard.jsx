// 三层回答卡片：原文层、白话层、解读层
// 设计理念：古典书卷美学 —— 原文如碑刻，白话如旧纸，解读如朱批

export default function AnswerCard({ answer }) {
  if (!answer) return null

  return (
    <div className="animate-fade-in-up space-y-3">
      {/* ============ 原文层 ============ */}
      <div className="rice-paper rounded-2xl p-5 shadow-ink-lg border border-ink-border relative overflow-hidden card-glow">
        {/* 装饰水墨 */}
        <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-[0.04]" style={{ backgroundColor: '#2C2C2C' }} />
        <div className="absolute right-3 top-3 vertical-text text-[8px] text-ink-gold/30 font-serif-cn">原文</div>

        <div className="flex items-center gap-2 mb-4 relative z-10">
          <span className="seal-square px-2.5 py-1 text-[10px] rounded">原文</span>
          <span className="text-xs text-ink-muted font-serif-cn">{answer.source}</span>
        </div>
        <div className="relative z-10">
          <p className="text-classical text-[19px] text-ink-dark font-serif-cn">
            {answer.quote}
          </p>
        </div>
        {/* 底部装饰线 */}
        <div className="mt-4 flex items-center gap-2 relative z-10">
          <div className="h-px flex-1 bg-gradient-to-r from-ink-border to-transparent" />
          <span className="text-[9px] text-ink-gold/40 font-serif-cn">墨问</span>
          <div className="h-px flex-1 bg-gradient-to-l from-ink-border to-transparent" />
        </div>
      </div>

      {/* ============ 白话层 ============ */}
      <div className="old-paper rounded-2xl p-5 shadow-ink border border-ink-border/80 relative overflow-hidden">
        {/* 装饰 */}
        <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full opacity-[0.05]" style={{ backgroundColor: '#B89968' }} />

        <div className="flex items-center gap-2 mb-3 relative z-10">
          <span
            className="px-2.5 py-1 text-[10px] rounded font-serif-cn font-bold"
            style={{ backgroundColor: '#7C9EB2', color: '#FFFCF7' }}
          >
            白话
          </span>
          <span className="text-xs text-ink-muted">忠实翻译</span>
        </div>
        <p className="text-[15px] leading-[1.85] text-ink-dark/85 relative z-10">{answer.plain}</p>
      </div>

      {/* ============ 解读层 ============ */}
      <div
        className="rounded-2xl p-5 shadow-ink-lg border relative overflow-hidden"
        style={{
          backgroundColor: '#FFFCF7',
          borderColor: '#C53D43',
          borderWidth: '1.5px',
        }}
      >
        {/* 装饰水墨 */}
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-[0.05]" style={{ backgroundColor: '#C53D43' }} />
        <div className="absolute right-3 top-3 vertical-text text-[8px] text-ink-accent/20 font-serif-cn">解读</div>

        <div className="flex items-center gap-2 mb-3 relative z-10">
          <span className="seal-square px-2.5 py-1 text-[10px] rounded">解读</span>
          <span className="text-xs font-serif-cn text-ink-accent font-medium">墨问私房话</span>
        </div>
        <p className="text-[15px] leading-[1.85] text-ink-dark/90 relative z-10 whitespace-pre-line">
          {answer.interpretation}
        </p>
        {/* 底部落款 */}
        <div className="mt-4 pt-3 border-t border-ink-border/40 flex items-center justify-end gap-1.5 relative z-10">
          <span className="text-[9px] text-ink-gold/50 font-serif-cn">墨问解读</span>
          <div className="seal-square w-5 h-5 text-[8px] rounded">墨</div>
        </div>
      </div>
    </div>
  )
}
