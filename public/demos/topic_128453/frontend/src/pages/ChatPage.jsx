// 对话页 Chat
import { useState, useEffect, useRef, useCallback } from 'react'
import TopBar from '../components/TopBar'
import FavButton from '../components/FavButton'
import RoleAvatar from '../components/RoleAvatar'
import RoleSelector from '../components/RoleSelector'
import AnswerCard from '../components/AnswerCard'
import QuestionBubble from '../components/QuestionBubble'
import InputBar from '../components/InputBar'
import Loading from '../components/Loading'
import { chat, getRoles, saveCommunity, DEFAULT_ROLES } from '../api'
import { isSpeechSupported, speak, stop as stopSpeech, getVoiceProfile } from '../lib/speech'

// 生成唯一 session_id
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)
}

// 从 localStorage 获取用户信息
function getStoredUser() {
  try {
    const raw = localStorage.getItem('mowen_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function ChatPage({ initialQuestion, initialRoleId, onBack }) {
  const [roles, setRoles] = useState(DEFAULT_ROLES)
  const [currentRoleId, setCurrentRoleId] = useState(initialRoleId || 'zhuangzi')
  const [question, setQuestion] = useState(initialQuestion || '')
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [speechError, setSpeechError] = useState('')
  const [sessionId] = useState(generateSessionId) // 生成 session_id
  const [shareSuccess, setShareSuccess] = useState(false)
  const [shareError, setShareError] = useState('')
  const scrollRef = useRef(null)

  const currentRole = roles.find((r) => r.id === currentRoleId) || roles[0]
  const user = getStoredUser()

  // 加载角色列表
  useEffect(() => {
    getRoles().then((data) => {
      if (data && data.length) setRoles(data)
    })
  }, [])

  // 发送问题获取回答
  const askQuestion = useCallback(
    async (q, roleId) => {
      if (!q.trim()) return
      setLoading(true)
      setAnswer(null)
      setSpeechError('')
      setShareSuccess(false)
      setShareError('')
      if (speaking) {
        stopSpeech()
        setSpeaking(false)
      }
      setQuestion(q)
      setCurrentRoleId(roleId)
      try {
        const userId = user?.id || null
        const res = await chat(q, roleId, sessionId, userId)
        setAnswer(res)
      } catch (err) {
        setSpeechError('获取回答失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    },
    [speaking, sessionId, user]
  )

  // 初始加载
  useEffect(() => {
    if (initialQuestion) {
      askQuestion(initialQuestion, initialRoleId || currentRoleId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [answer, loading])

  // 切换角色后重新提问
  const handleRoleSwitch = (roleId) => {
    if (roleId === currentRoleId) return
    askQuestion(question, roleId)
  }

  // 追问
  const handleFollowUp = (q) => {
    askQuestion(q, currentRoleId)
  }

  // 点击追问建议
  const handleSuggestion = (suggestion) => {
    askQuestion(suggestion, currentRoleId)
  }

  // 语音朗读
  const handleSpeak = async () => {
    if (!answer) return

    if (speaking) {
      stopSpeech()
      setSpeaking(false)
      return
    }

    if (!isSpeechSupported()) {
      setSpeechError('当前浏览器不支持语音合成，请尝试使用 Chrome、Edge 等现代浏览器')
      return
    }

    setSpeechError('')
    setSpeaking(true)

    speak(answer, {
      roleId: currentRoleId,
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onError: (err) => {
        setSpeaking(false)
        const errType = err?.error || ''
        if (errType === 'backend-unavailable') {
          setSpeechError('语音服务未启动，请确认后端服务正在运行（端口 8000）')
        } else if (errType === 'tts-service') {
          setSpeechError('语音生成服务暂时不可用，请稍后重试')
        } else if (errType === 'audio-playback') {
          setSpeechError('音频播放失败，请检查浏览器音频权限')
        }
      },
    })
  }

  // 分享到社区
  const handleShareToCommunity = async () => {
    if (!user) {
      setShareError('请先登录后再分享到社区')
      return
    }
    if (!answer || !question) return

    setShareSuccess(false)
    setShareError('')

    try {
      await saveCommunity({
        user_id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        question,
        role_id: currentRoleId,
        role: answer.role || currentRole.name,
        school: currentRole.school || '',
        era: currentRole.era || '',
        quote: answer.quote,
        source: answer.source,
        plain: answer.plain,
        interpretation: answer.interpretation,
        session_id: sessionId,
      })
      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 3000)
    } catch (err) {
      setShareError('分享失败，请稍后重试')
    }
  }

  // 组件卸载时停止语音
  useEffect(() => {
    return () => {
      stopSpeech()
    }
  }, [])

  // 收藏所需的数据
  const favItem = answer
    ? {
        question,
        roleId: currentRoleId,
        role: answer.role || currentRole.name,
        avatar: answer.avatar || currentRole.avatar,
        source: answer.source,
        quote: answer.quote,
        answer: answer,
      }
    : null

  return (
    <div className="min-h-screen ink-texture flex flex-col">
      <TopBar
        title="对话"
        onBack={onBack}
        rightAction={<FavButton item={favItem} />}
      />

      {/* 角色信息卡片 */}
      <div className="mx-auto max-w-md w-full px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 rice-paper rounded-2xl p-3 shadow-ink border border-ink-border relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-[0.04]" style={{ backgroundColor: '#C53D43' }} />
          <RoleAvatar avatar={currentRole.avatar} name={currentRole.name} size="md" />
          <div className="flex-1 min-w-0 relative z-10">
            <div className="flex items-center gap-2">
              <span className="font-serif-cn font-bold text-base text-ink-dark">{currentRole.name}</span>
              <span className="text-[10px] text-ink-gold px-1.5 py-0.5 rounded font-serif-cn" style={{ backgroundColor: 'rgba(184, 153, 104, 0.12)' }}>导师</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs text-ink-muted truncate">{currentRole.style}</p>
              <span className="text-[10px] text-ink-muted">·</span>
              {currentRole.school && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-serif-cn" style={{ backgroundColor: 'rgba(197, 61, 67, 0.08)', color: '#C53D43' }}>
                  {currentRole.school}
                </span>
              )}
              {currentRole.era && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-serif-cn" style={{ backgroundColor: 'rgba(124, 158, 178, 0.1)', color: '#7C9EB2' }}>
                  {currentRole.era}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 对话区 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto thin-scroll mx-auto max-w-md w-full px-4 pb-4"
      >
        {question && <QuestionBubble question={question} />}

        {loading && <Loading text={`${currentRole.name}沉思中…`} />}

        {answer && !loading && (
          <div className="mt-4 animate-fade-in">
            {/* 角色标识 */}
            <div className="flex items-center gap-2 mb-2">
              <RoleAvatar avatar={answer.avatar || currentRole.avatar} name={answer.role} size="sm" />
              <span className="text-xs text-ink-muted">{answer.role}答</span>
              <div className="flex-1 h-px bg-gradient-to-r from-ink-border to-transparent" />
            </div>
            <AnswerCard answer={answer} />

            {/* 圣贤开口按钮 + 分享到社区 */}
            <div className="mt-4 space-y-2">
              <button
                onClick={handleSpeak}
                className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-medium transition-all duration-300 press-down ${
                  speaking
                    ? 'bg-ink-dark text-ink-card shadow-ink-lg'
                    : 'seal hover:opacity-90'
                }`}
              >
                {speaking ? (
                  <>
                    <div className="voice-wave flex items-center">
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>停止回答</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                    <span>圣贤开口</span>
                  </>
                )}
              </button>

              {/* 分享到社区按钮 */}
              <button
                onClick={handleShareToCommunity}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-300 press-down border border-ink-border bg-ink-card/50 hover:bg-ink-sub/80 text-ink-dark"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>分享到社区</span>
              </button>

              {/* 分享成功/错误提示 */}
              {shareSuccess && (
                <p className="text-xs text-center text-green-600 bg-green-50 rounded-lg py-2 px-3">
                  已分享到社区！
                </p>
              )}
              {shareError && (
                <p className="text-xs text-ink-accent text-center bg-ink-accent/10 rounded-lg py-2 px-3">
                  {shareError}
                </p>
              )}

              {speechError && (
                <p className="text-xs text-ink-accent text-center bg-ink-accent/10 rounded-lg py-2 px-3">
                  {speechError}
                </p>
              )}
              {speaking && (() => {
                const vp = getVoiceProfile(currentRoleId)
                return (
                  <div className="flex items-center justify-center gap-2 py-1">
                    <div className="voice-wave flex items-center text-ink-accent" style={{ height: '16px' }}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <p className="text-xs text-ink-muted">
                      {currentRole.name}正在开口…
                      {vp && <span className="ml-1">· {vp.description}</span>}
                    </p>
                  </div>
                )
              })()}
            </div>

            {/* 换个古人看看 */}
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="title-decor text-xs font-serif-cn font-medium text-ink-dark">换个古人看看</span>
                <span className="text-[10px] text-ink-muted">同一问题，不同智慧</span>
              </div>
              <div className="rice-paper rounded-xl p-3 shadow-ink border border-ink-border">
                <RoleSelector
                  roles={roles}
                  currentRoleId={currentRoleId}
                  onSelect={handleRoleSwitch}
                  size="sm"
                  showName={true}
                />
              </div>
            </div>

            {/* 追问建议 */}
            {answer.suggestions && answer.suggestions.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="title-decor text-xs font-serif-cn font-medium text-ink-dark">追问建议</span>
                  <span className="text-[10px] text-ink-muted">继续深聊</span>
                </div>
                <div className="space-y-2">
                  {answer.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestion(suggestion)}
                      className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 rounded-xl bg-ink-sub/50 border border-ink-border hover:bg-ink-sub hover:border-ink-accent/30 hover-lift transition-all duration-200 group"
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-serif-cn font-bold flex-shrink-0"
                        style={{ backgroundColor: '#C53D43', color: '#FFFCF7' }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-sm text-ink-dark/90 group-hover:text-ink-dark flex-1">{suggestion}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C9EB2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!question && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="relative mb-4">
              <div className="ink-circle w-24 h-24" style={{ backgroundColor: '#C53D43', top: '0', left: '0' }} />
              <div className="w-16 h-16 rounded-full flex items-center justify-center relative z-10" style={{ backgroundColor: '#F1E7D8' }}>
                <span className="font-serif-cn text-2xl text-ink-accent">问</span>
              </div>
            </div>
            <p className="text-sm text-ink-muted">在下方写下你的困惑</p>
            <p className="text-xs text-ink-muted/70 mt-1">{currentRole.name}将用经典智慧为你解答</p>
          </div>
        )}
      </div>

      {/* 底部追问输入框 */}
      <div className="mx-auto max-w-md w-full px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 bg-ink-bg/95 backdrop-blur-md border-t border-ink-border/60">
        <InputBar
          placeholder={`向${currentRole.name}追问…`}
          buttonText="追问"
          onSubmit={handleFollowUp}
          disabled={loading}
        />
      </div>
    </div>
  )
}