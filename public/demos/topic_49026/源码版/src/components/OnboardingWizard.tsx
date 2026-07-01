import { useState, useEffect, useRef } from 'react'
import { Brain, Send, Sparkles, Briefcase, Zap } from 'lucide-react'
import { safeChat } from '../lib/ai'
import { generateDemoProfile } from '../lib/demoReply'
import { setUserProfile } from '../lib/prompts'
import { useConversationStore } from '../stores/useConversationStore'
import { useUIStore } from '../stores/useUIStore'

interface Message {
  role: 'assistant' | 'user'
  content: string
}

type Phase = 'greeting' | 'chatting' | 'summarizing' | 'touring' | 'done'

export function OnboardingWizard() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [phase, setPhase] = useState<Phase>('greeting')
  const [summary, setSummary] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isThinking, setIsThinking] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const setInputText = useConversationStore((s) => s.setInputText)
  const setActiveNav = useUIStore((s) => s.setActiveNav)

  const registerTimer = (timer: ReturnType<typeof setTimeout>) => {
    timersRef.current.push(timer)
    return timer
  }

  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  useEffect(() => {
    return () => clearAllTimers()
  }, [])

  useEffect(() => {
    const hasDone = localStorage.getItem('hengzhou-onboarding-done')
    const hasProfile = localStorage.getItem('hengzhou-user-profile')
    if (!hasDone && !hasProfile) {
      setIsOpen(true)
      // 初始问候
      registerTimer(setTimeout(() => {
        setMessages([
          {
            role: 'assistant',
            content: '嗨，我是衡舟。\n\n我会陪你记住生活里那些重要但容易忘的事：家人的偏好、同事的边界、领导的风格、你自己的状态。\n\n你随便聊聊就好，我边听边记。',
          },
        ])
        setPhase('chatting')
      }, 600))
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return
    const userMsg = inputValue.trim()
    setInputValue('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsThinking(true)

    // 收集之前的对话用于后续生成画像
    const allMessages = [...messages, { role: 'user' as const, content: userMsg }]

    try {
      // 1轮后开始生成画像（检测到足够的信息）
      const userTurns = allMessages.filter(m => m.role === 'user').length

      if (userTurns >= 1) {
        // 尝试生成画像
        const chatHistory = allMessages.map(m => `${m.role === 'user' ? '用户' : '衡舟'}：${m.content}`).join('\n')

        const profilePrompt = `根据以下对话提炼用户的个人画像（200字内），包含基本信息、家庭、工作、困扰等关键信息。要求简洁、信息密度高：

${chatHistory}

直接输出画像摘要：`

        const { text: result, mode } = await safeChat([
          { role: 'system', content: '你擅长从自然对话中提炼人物画像。提取关键事实，忽略寒暄。' },
          { role: 'user', content: profilePrompt },
        ], { temperature: 0.3, maxTokens: 300 })

        const profileText = mode === 'demo'
          ? generateDemoProfile(allMessages.filter(m => m.role === 'user').map(m => m.content).join('\n'))
          : result.trim()

        const modeHint = mode === 'demo'
          ? '\n\n（当前为示例模式，配置 API Key 后我会生成更完整的画像。）'
          : ''

        setSummary(profileText)
        setPhase('summarizing')
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `聊了这几句，我对你有了些了解。我整理了一下，你看看对不对？\n\n${profileText}${modeHint}\n\n对的就不用改，如果有不对的地方你可以直接告诉我。`,
        }])
      } else {
        // 继续聊天，AI主动引导对话方向
        const chatHistory = allMessages.map(m => `${m.role === 'user' ? '用户' : '衡舟'}：${m.content}`).join('\n')

        const { text: reply } = await safeChat([
          { role: 'system', content: `你是衡舟，一个温暖贴心的AI生活伴侣，正在初次认识用户。
这是你与用户的第一次聊天，你的目标是自然地了解他/她。

规则：
1. 语气要像朋友一样自然、温暖，不要像问卷调查
2. 每次回复简短一些（2-3句话）
3. 自然地引导话题：可以接着用户说的往下聊，也可以问问他的工作/生活/家庭
4. 不要直接问"你的职业是什么"这种生硬问题
5. 表现出对他/她说的内容的兴趣和关心
6. 如果用户说的比较少，可以用"那你平时..."来引导
7. 不要用"作为AI"、"作为助手"这类表述` },
          { role: 'user', content: chatHistory + '\n\n请继续对话：' },
        ], { temperature: 0.7, maxTokens: 200 })

        setMessages(prev => [...prev, { role: 'assistant', content: reply.trim() }])
      }
    } catch (e) {
      console.error('[Onboarding] chat failed', e)
      setMessages(prev => [...prev, { role: 'assistant', content: '网络有点慢，让我想想…' }])
    } finally {
      setIsThinking(false)
    }
  }

  const handleConfirm = () => {
    setUserProfile(summary)
    setPhase('touring')
  }

  const handleEditAndSave = async () => {
    setUserProfile(summary)
    setPhase('touring')
  }

  const handleSkip = () => {
    localStorage.setItem('hengzhou-onboarding-done', 'true')
    setIsOpen(false)
  }

  const scenarioOptions = [
    { emoji: '💼', title: '职场压力', text: '王思亮周会上又当众质疑我，我该怎么回复他？' },
    { emoji: '👨‍👩‍👦', title: '家庭关系', text: '和晓薇最近沟通越来越少，怎么开场聊？' },
    { emoji: '🏥', title: '健康管理', text: '体检报告出来了，甘油三酯偏高，帮我理一理。' },
  ]

  const finishTour = (prefill?: string) => {
    localStorage.setItem('hengzhou-onboarding-done', 'true')
    setPhase('done')
    if (prefill) {
      setInputText(prefill)
      setActiveNav('对话')
    }
    registerTimer(setTimeout(() => setIsOpen(false), 800))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-primary/40 backdrop-blur-sm" />

      <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="bg-gradient-to-br from-zen-terracotta/10 to-zen-sage/10 px-6 py-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zen-terracotta/10 flex items-center justify-center mx-auto mb-3">
            <Brain className="w-6 h-6 text-zen-terracotta" />
          </div>
          <h2 className="text-lg font-serif font-semibold text-ink-primary mb-1">
            {phase === 'done'
              ? '准备好了'
              : phase === 'touring'
              ? '带你看看衡舟能做什么'
              : '初次见面'}
          </h2>
          <p className="text-xs text-ink-tertiary">
            {phase === 'done'
              ? '衡舟已经准备好陪伴你了'
              : phase === 'touring'
              ? '三个核心能力，三个可直接试玩的场景'
              : '随便聊聊就好，我会慢慢了解你'}
          </p>
        </div>

        {/* 对话区域 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                  msg.role === 'user'
                    ? 'bg-zen-sage/20 text-zen-sage'
                    : 'bg-zen-terracotta/10 text-zen-terracotta'
                }`}
              >
                {msg.role === 'user' ? '我' : '衡'}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'theme-user-bubble text-white'
                    : 'bg-canvas border border-ink-muted/20 text-ink-secondary'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-zen-terracotta/10 text-zen-terracotta text-xs">
                衡
              </div>
              <div className="bg-canvas border border-ink-muted/20 rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {phase === 'touring' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: Sparkles, title: '记忆自动提取', desc: '聊天中自动记住承诺、关系变化和重要事项，再也不用反复解释背景。' },
                  { icon: Briefcase, title: '人际关系图谱', desc: '自动构建你的人脉网络，人情往来、关系维护、节日礼仪一目了然。' },
                  { icon: Zap, title: '全维度决策参谋', desc: '跳槽、创业等重大决策，自动分析对家庭、健康、财务的连锁影响。' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3 p-3 rounded-xl bg-surface border border-ink-muted/10">
                    <div className="w-8 h-8 rounded-lg bg-zen-terracotta/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-zen-terracotta" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-primary">{item.title}</p>
                      <p className="text-xs text-ink-tertiary leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-ink-secondary">先试试一个场景</p>
                <div className="grid grid-cols-1 gap-2">
                  {scenarioOptions.map((s) => (
                    <button
                      key={s.title}
                      onClick={() => finishTour(s.text)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-canvas border border-ink-muted/20 text-left hover:bg-canvas-warm transition-colors"
                    >
                      <span className="text-base">{s.emoji}</span>
                      <div>
                        <p className="text-sm font-medium text-ink-primary">{s.title}</p>
                        <p className="text-xs text-ink-tertiary">{s.text}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="p-4 border-t border-ink-muted/20">
          {phase === 'summarizing' ? (
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl bg-zen-terracotta text-white text-sm font-medium hover:bg-zen-terracotta/90 transition-colors"
              >
                对的，就是这样
              </button>
              <button
                onClick={handleEditAndSave}
                className="flex-1 py-2.5 rounded-xl border border-ink-muted/20 text-ink-secondary text-sm font-medium hover:bg-canvas-warm transition-colors"
              >
                我想修改一下
              </button>
            </div>
          ) : phase === 'touring' ? (
            <button
              onClick={() => finishTour()}
              className="w-full py-2.5 rounded-xl bg-zen-terracotta text-white text-sm font-medium hover:bg-zen-terracotta/90 transition-colors"
            >
              直接开始
            </button>
          ) : phase === 'done' ? (
            <p className="text-center text-sm text-zen-sage font-medium animate-fade-in">
              开始使用衡舟 →
            </p>
          ) : (
            <div className="flex items-end gap-2 bg-canvas rounded-xl border border-ink-muted/20 p-2">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="随便聊聊..."
                className="flex-1 bg-transparent px-2 py-1.5 text-sm text-ink-primary placeholder:text-ink-tertiary outline-none"
                disabled={isThinking}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isThinking}
                className="w-8 h-8 rounded-lg bg-zen-terracotta flex items-center justify-center text-white hover:bg-zen-terracotta/90 transition-colors disabled:opacity-40"
                aria-label="发送"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {/* 试用示例场景 */}
          {phase === 'chatting' && (
            <button
              onClick={() => {
                localStorage.setItem('hengzhou-onboarding-done', 'true')
                setIsOpen(false)
                setInputText('王思亮周会上又当众质疑我，我该怎么回复他？')
                setActiveNav('对话')
              }}
              className="w-full text-center text-xs text-zen-terracotta mt-2 hover:underline"
            >
              直接试用示例场景
            </button>
          )}
          {/* 跳过按钮 */}
          {phase === 'chatting' && (
            <button
              onClick={handleSkip}
              className="w-full text-center text-xs text-ink-tertiary mt-2 hover:text-ink-secondary transition-colors"
            >
              跳过，以后再说
            </button>
          )}
        </div>
      </div>
    </div>
  )
}