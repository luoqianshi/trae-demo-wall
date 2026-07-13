// 关于页 About
import TopBar from '../components/TopBar'

function SectionCard({ title, icon, children }) {
  return (
    <section className="bg-ink-card rounded-2xl p-5 shadow-ink border border-ink-border">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
          style={{ backgroundColor: '#F1E7D8', color: '#C53D43' }}
        >
          {icon}
        </span>
        <h2 className="font-serif-cn font-bold text-base text-ink-dark">{title}</h2>
      </div>
      <div className="text-sm text-ink-dark/85 leading-7 space-y-2">{children}</div>
    </section>
  )
}

export default function AboutPage({ onBack }) {
  return (
    <div className="min-h-screen ink-texture flex flex-col">
      <TopBar title="关于" onBack={onBack} />

      <div className="flex-1 overflow-y-auto thin-scroll mx-auto max-w-md w-full px-4 py-5 pb-28 space-y-4">
        {/* 头部 */}
        <div className="text-center py-6 animate-fade-in">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center font-serif-cn font-bold text-3xl shadow-ink-lg mb-4"
            style={{ backgroundColor: '#C53D43', color: '#FFFCF7' }}
          >
            墨
          </div>
          <h1 className="font-serif-cn font-bold text-2xl text-ink-dark tracking-wide">墨问</h1>
          <p className="text-sm text-ink-muted mt-1">古籍智慧 · 对话引擎</p>
          <p className="text-xs text-ink-muted/70 mt-3 font-serif-cn">
            用白话提问，让古代圣贤用经典智慧回答
          </p>
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-ink-sub/60">
            <span className="w-1.5 h-1.5 rounded-full bg-ink-accent animate-pulse"></span>
            <span className="text-[11px] text-ink-muted">Demo 版本 v0.1.0</span>
          </div>
        </div>

        {/* Demo 范围说明 */}
        <SectionCard title="Demo 范围说明" icon="围">
          <p>本 Demo 实现了墨问的核心对话流程，包含以下能力：</p>
          <ul className="list-none space-y-1.5 pl-1">
            <li className="flex gap-2">
              <span className="text-ink-accent flex-shrink-0">·</span>
              <span>5 位古人导师：庄子、孔子、老子、孙子、王阳明</span>
            </li>
            <li className="flex gap-2">
              <span className="text-ink-accent flex-shrink-0">·</span>
              <span>6 大生活场景：职场内卷、感情纠结、社交焦虑等</span>
            </li>
            <li className="flex gap-2">
              <span className="text-ink-accent flex-shrink-0">·</span>
              <span>三层回答结构：原文、白话、解读</span>
            </li>
            <li className="flex gap-2">
              <span className="text-ink-accent flex-shrink-0">·</span>
              <span>圣贤开口：Web Speech API 语音朗读，角色各异语调</span>
            </li>
            <li className="flex gap-2">
              <span className="text-ink-accent flex-shrink-0">·</span>
              <span>锦囊收藏：localStorage 本地持久化</span>
            </li>
            <li className="flex gap-2">
              <span className="text-ink-accent flex-shrink-0">·</span>
              <span>后端降级：API 不可用时使用内置回答引擎</span>
            </li>
          </ul>
        </SectionCard>

        {/* 核心约束说明 */}
        <SectionCard title="核心约束说明" icon="约">
          <div className="space-y-3">
            <div>
              <p className="font-medium text-ink-dark text-[13px] mb-0.5">回答三层结构</p>
              <p className="text-ink-muted text-[13px] leading-6">
                每次回答必须包含原文（标注出处）、白话（忠实翻译）、解读（现代解读），缺一不可。
              </p>
            </div>
            <div>
              <p className="font-medium text-ink-dark text-[13px] mb-0.5">角色风格一致</p>
              <p className="text-ink-muted text-[13px] leading-6">
                每位古人导师有固定的风格定位，回答需符合其思想体系和语言特色。
              </p>
            </div>
            <div>
              <p className="font-medium text-ink-dark text-[13px] mb-0.5">语音容错处理</p>
              <p className="text-ink-muted text-[13px] leading-6">
                浏览器不支持 Web Speech API 时显示友好提示，不抛出错误。不同角色使用不同语速与语调。
              </p>
            </div>
            <div>
              <p className="font-medium text-ink-dark text-[13px] mb-0.5">数据降级策略</p>
              <p className="text-ink-muted text-[13px] leading-6">
                后端服务不可用时，前端自动切换至内置默认数据，保证核心功能可用。
              </p>
            </div>
          </div>
        </SectionCard>

        {/* 正式版升级方向 */}
        <SectionCard title="正式版升级方向" icon="升">
          <ul className="list-none space-y-2 pl-1">
            <li className="flex gap-2">
              <span className="text-ink-accent flex-shrink-0">→</span>
              <span>接入大语言模型，实现真正的开放域古籍问答</span>
            </li>
            <li className="flex gap-2">
              <span className="text-ink-accent flex-shrink-0">→</span>
              <span>扩充角色库至 20+ 位，覆盖诸子百家</span>
            </li>
            <li className="flex gap-2">
              <span className="text-ink-accent flex-shrink-0">→</span>
              <span>多轮上下文记忆，支持深度追问与思辨对话</span>
            </li>
            <li className="flex gap-2">
              <span className="text-ink-accent flex-shrink-0">→</span>
              <span>用户账号体系，收藏云端同步</span>
            </li>
            <li className="flex gap-2">
              <span className="text-ink-accent flex-shrink-0">→</span>
              <span>古籍原文检索与引用溯源</span>
            </li>
            <li className="flex gap-2">
              <span className="text-ink-accent flex-shrink-0">→</span>
              <span>社区共问共答，优质问答沉淀为知识库</span>
            </li>
            <li className="flex gap-2">
              <span className="text-ink-accent flex-shrink-0">→</span>
              <span>角色语音定制化，TTS 声线拟人化</span>
            </li>
          </ul>
        </SectionCard>

        {/* 技术栈 */}
        <SectionCard title="技术栈" icon="技">
          <div className="flex flex-wrap gap-2">
            {['React 18', 'Vite', 'Tailwind CSS', 'Web Speech API', 'localStorage'].map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-1 rounded-lg text-xs bg-ink-sub/60 text-ink-dark/80 border border-ink-border"
              >
                {tech}
              </span>
            ))}
          </div>
        </SectionCard>

        {/* 底部寄语 */}
        <div className="text-center py-6">
          <p className="font-serif-cn text-sm text-ink-muted leading-7">
            古人不见今时月，<br />
            今月曾经照古人。
          </p>
          <p className="text-xs text-ink-muted/60 mt-3">墨问 · 让千年智慧，回应当下困惑</p>
        </div>
      </div>
    </div>
  )
}
