// 用户问题气泡：右对齐，朱砂红底白字
export default function QuestionBubble({ question }) {
  return (
    <div className="flex justify-end animate-slide-up">
      <div className="max-w-[80%]">
        <div
          className="rounded-2xl rounded-tr-md px-4 py-3 shadow-seal relative"
          style={{
            backgroundColor: '#C53D43',
            color: '#FFFCF7',
          }}
        >
          {/* 装饰小圆点 */}
          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-white/20" />
          <p className="text-[15px] leading-6 font-serif-cn">{question}</p>
        </div>
        <div className="flex items-center justify-end gap-1.5 mt-1 mr-1">
          <span className="text-[10px] text-ink-muted">你问</span>
          <div className="w-1 h-1 rounded-full bg-ink-accent/40" />
        </div>
      </div>
    </div>
  )
}
