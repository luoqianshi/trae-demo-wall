// 加载动画：水墨滴落效果
export default function Loading({ text = '圣贤沉思中…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div className="relative w-12 h-12 mb-4">
        {/* 外圈 */}
        <div className="absolute inset-0 rounded-full border-2 border-ink-border"></div>
        {/* 旋转弧 */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-ink-accent animate-spin"></div>
        {/* 中心墨点 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-ink-dark animate-pulse"></div>
        </div>
      </div>
      <p className="text-sm text-ink-muted font-serif-cn tracking-wide">{text}</p>
    </div>
  )
}
