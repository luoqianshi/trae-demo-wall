// 顶部栏：返回按钮 + 标题 + 右侧操作按钮
export default function TopBar({ title, onBack, rightAction }) {
  return (
    <header className="sticky top-0 z-30 bg-ink-bg/95 backdrop-blur-md border-b border-ink-border">
      <div className="mx-auto max-w-md flex items-center justify-between px-4 h-14">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-9 h-9 -ml-1 rounded-lg hover:bg-ink-sub/60 transition-colors"
          aria-label="返回"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="font-serif-cn font-bold text-lg text-ink-dark tracking-wide">{title}</h1>
        <div className="w-9 h-9 flex items-center justify-center">
          {rightAction}
        </div>
      </div>
    </header>
  )
}
