// 墨问 Logo：红色"墨"字方印 + 标题
export default function Logo({ size = 'md', onClick }) {
  const sealSize = size === 'lg' ? 'w-12 h-12 text-2xl' : size === 'sm' ? 'w-8 h-8 text-base' : 'w-10 h-10 text-xl'
  const titleSize = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-xl'

  return (
    <div className="flex items-center gap-2.5 cursor-pointer select-none press-down" onClick={onClick}>
      <div
        className={`${sealSize} flex items-center justify-center rounded-lg font-serif-cn font-bold text-ink-card transition-transform hover:scale-105`}
        style={{
          backgroundColor: '#C53D43',
          boxShadow: '0 2px 8px rgba(197, 61, 67, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        }}
      >
        墨
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${titleSize} font-serif-cn font-bold text-ink-dark tracking-wide`}>墨问</span>
        <span className="text-[10px] text-ink-muted tracking-widest mt-0.5">古籍智慧 · 对话引擎</span>
      </div>
    </div>
  )
}
