import { useState, useEffect, useRef } from 'react'
import { X, Key, User, Info, Zap, Check, Shield, Lock, HardDrive, Heart, Puzzle, Map, AlertTriangle, Eye, EyeOff, Volume2, ChevronUp, ChevronDown, ChevronLeft } from 'lucide-react'
import { DataManager } from './DataManager'
import { RoadmapPage } from './RoadmapPage'
import type { UserProfile } from '../types'
import { getUserProfileObject, setUserProfile } from '../lib/prompts'
import { isDoubaoEnabled, isUsingDefaultKey, DEFAULT_DOUBAO_MODEL_NAME } from '../lib/config'
import { pluginEngine } from '../lib/pluginEngine'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('hengzhou-api-key') || '')
  const [saved, setSaved] = useState(false)
  const [userProfile, setUserProfileState] = useState<UserProfile>(() => getUserProfileObject())
  const [profileSaved, setProfileSaved] = useState(false)

  const [doubaoKey, setDoubaoKey] = useState(() => localStorage.getItem('hengzhou-doubao-api-key') || '')
  const [doubaoModel, setDoubaoModel] = useState(() => localStorage.getItem('hengzhou-doubao-model') || DEFAULT_DOUBAO_MODEL_NAME)
  const [doubaoSaved, setDoubaoSaved] = useState(false)
  const [showRoadmap, setShowRoadmap] = useState(false)
  const [showDeepSeekKey, setShowDeepSeekKey] = useState(false)
  const [showDoubaoKey, setShowDoubaoKey] = useState(false)
  const [proxyToken, setProxyToken] = useState(() => localStorage.getItem('hengzhou-proxy-token') || '')
  const [proxySaved, setProxySaved] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem('hengzhou-voice-enabled') === 'true')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

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
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const handleSaveKey = () => {
    localStorage.setItem('hengzhou-api-key', apiKey.trim())
    setSaved(true)
    registerTimer(setTimeout(() => setSaved(false), 2000))
  }

  const handleSaveProxyToken = () => {
    localStorage.setItem('hengzhou-proxy-token', proxyToken.trim())
    setProxySaved(true)
    registerTimer(setTimeout(() => setProxySaved(false), 2000))
  }

  const handleSaveProfile = () => {
    setUserProfile(userProfile)
    setProfileSaved(true)
    registerTimer(setTimeout(() => setProfileSaved(false), 2000))
  }

  const handleSaveDoubao = () => {
    localStorage.setItem('hengzhou-doubao-api-key', doubaoKey.trim())
    localStorage.setItem('hengzhou-doubao-model', doubaoModel.trim())
    setDoubaoSaved(true)
    registerTimer(setTimeout(() => setDoubaoSaved(false), 2000))
  }

  if (!open) return null

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* 面板 */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-surface border-l border-ink-muted/20 z-50 flex flex-col shadow-2xl">
        {/* 移动端拖动提示条 */}
        <div className="sm:hidden flex justify-center py-2">
          <div className="w-10 h-1 rounded-full bg-ink-muted/30" />
        </div>
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-muted/20">
          <h2 className="text-base font-medium text-ink-primary">设置</h2>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-zen-terracotta, #C4704A)' }}
            aria-label="返回"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
            返回
          </button>
        </div>

        {isUsingDefaultKey() && (
          <div className="mx-4 mt-3 p-3 rounded-lg bg-zen-amber/15 border border-zen-amber/30 text-xs text-ink-primary flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-zen-amber flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">未配置个人 API Key</p>
              <p className="text-ink-tertiary mt-0.5">
                将使用后端代理的环境变量 Key。如需使用自己的 DeepSeek / 豆包 Key，请在下方“API 配置”中填写。
              </p>
            </div>
          </div>
        )}

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* API Key */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-zen-terracotta" />
              <h3 className="text-sm font-medium text-ink-primary">API 配置</h3>
            </div>
            <p className="text-xs text-ink-tertiary">
              配置 DeepSeek API Key 后将优先使用你的 Key（通过后端代理转发）。留空则使用后端代理的环境变量 Key。没有 Key？可前往 DeepSeek 开放平台免费申请。
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showDeepSeekKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-ink-muted/20 bg-canvas text-sm text-ink-primary placeholder:text-ink-tertiary outline-none focus:border-zen-terracotta/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowDeepSeekKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-canvas-warm text-ink-tertiary"
                  aria-label={showDeepSeekKey ? '隐藏 DeepSeek Key' : '显示 DeepSeek Key'}
                >
                  {showDeepSeekKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
              onClick={handleSaveKey}
              className="px-4 py-2 rounded-lg bg-zen-terracotta text-white text-sm font-medium hover:bg-zen-terracotta/90 transition-colors"
            >
              {saved ? '已保存' : '保存'}
            </button>
          </div>

          <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <input
                type="password"
                value={proxyToken}
                onChange={(e) => setProxyToken(e.target.value)}
                placeholder="后端代理访问令牌（可选）"
                className="w-full px-3 py-2 rounded-lg border border-ink-muted/20 bg-canvas text-sm text-ink-primary placeholder:text-ink-tertiary outline-none focus:border-zen-terracotta/50 transition-colors"
              />
            </div>
            <button
              onClick={handleSaveProxyToken}
              className="px-4 py-2 rounded-lg bg-zen-slate text-white text-sm font-medium hover:bg-zen-slate/90 transition-colors"
            >
              {proxySaved ? '已保存' : '保存'}
            </button>
          </div>
          <p className="text-xs text-ink-tertiary mt-2">
            如果后端代理开启了 REQUIRE_AUTH，需要在此处填写对应的 API Token。
          </p>
        </div>

        {/* 分隔线 */}
        <div className="border-t border-ink-muted/20" />

        {/* 语音提醒 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-zen-indigo" />
            <h3 className="text-sm font-medium text-ink-primary">语音提醒</h3>
          </div>
          <p className="text-xs text-ink-tertiary">
            开启后，衡舟会在展示提醒时自动语音朗读提醒内容，让关怀更有温度。
          </p>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-ink-primary">语音朗读提醒</span>
            <button
              onClick={() => {
                const next = !voiceEnabled
                setVoiceEnabled(next)
                localStorage.setItem('hengzhou-voice-enabled', String(next))
              }}
              className={`w-11 h-6 rounded-full transition-colors relative ${voiceEnabled ? 'bg-zen-sage' : 'bg-ink-muted/30'}`}
              aria-label={voiceEnabled ? '关闭语音朗读' : '开启语音朗读'}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-surface border border-ink-muted/20 transition-transform ${voiceEnabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        {/* 分隔线 */}
        <div className="border-t border-ink-muted/20" />

          {/* 用户画像 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-zen-sage" />
                <h3 className="text-sm font-medium text-ink-primary">用户画像</h3>
              </div>
              {profileSaved && <span className="text-xs text-zen-sage">已保存</span>}
            </div>
            <p className="text-xs text-ink-tertiary">
              衡舟会根据你的画像信息给出更贴心的建议。修改后点击保存生效。
            </p>

            <div className="space-y-4 rounded-xl bg-canvas-warm p-4 border border-ink-muted/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-ink-tertiary">姓名</span>
                  <input
                    type="text"
                    value={userProfile.name}
                    onChange={(e) => setUserProfileState((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm text-ink-primary outline-none focus:border-zen-sage/50 transition-colors"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-ink-tertiary">年龄</span>
                  <input
                    type="number"
                    value={userProfile.age}
                    onChange={(e) => setUserProfileState((prev) => ({ ...prev, age: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm text-ink-primary outline-none focus:border-zen-sage/50 transition-colors"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-ink-tertiary">性别</span>
                  <select
                    value={userProfile.gender || ''}
                    onChange={(e) => setUserProfileState((prev) => ({ ...prev, gender: e.target.value as UserProfile['gender'] }))}
                    className="w-full px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm text-ink-primary outline-none focus:border-zen-sage/50 transition-colors"
                  >
                    <option value="">请选择</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                    <option value="other">其他</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-ink-tertiary">城市</span>
                  <input
                    type="text"
                    value={userProfile.city || ''}
                    onChange={(e) => setUserProfileState((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm text-ink-primary outline-none focus:border-zen-sage/50 transition-colors"
                  />
                </label>
              </div>

              <label className="space-y-1">
                <span className="text-xs text-ink-tertiary">职业</span>
                <input
                  type="text"
                  value={userProfile.occupation || ''}
                  onChange={(e) => setUserProfileState((prev) => ({ ...prev, occupation: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm text-ink-primary outline-none focus:border-zen-sage/50 transition-colors"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-ink-tertiary">学历</span>
                <input
                  type="text"
                  value={userProfile.education || ''}
                  onChange={(e) => setUserProfileState((prev) => ({ ...prev, education: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm text-ink-primary outline-none focus:border-zen-sage/50 transition-colors"
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-ink-tertiary">工作年限</span>
                  <input
                    type="number"
                    value={userProfile.workYears}
                    onChange={(e) => setUserProfileState((prev) => ({ ...prev, workYears: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm text-ink-primary outline-none focus:border-zen-sage/50 transition-colors"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-ink-tertiary">收入</span>
                  <input
                    type="text"
                    value={userProfile.income || ''}
                    onChange={(e) => setUserProfileState((prev) => ({ ...prev, income: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm text-ink-primary outline-none focus:border-zen-sage/50 transition-colors"
                  />
                </label>
              </div>

              {(
                [
                  ['family', '家庭情况'],
                  ['finance', '财务状况'],
                  ['health', '健康状况'],
                  ['currentChallenges', '当前困境'],
                ] as Array<[keyof UserProfile, string]>
              ).map(([field, label]) => (
                <label key={field} className="space-y-1">
                  <span className="text-xs text-ink-tertiary">{label}</span>
                  <textarea
                    value={(userProfile[field] as string) || ''}
                    onChange={(e) => setUserProfileState((prev) => ({ ...prev, [field]: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm text-ink-primary outline-none focus:border-zen-sage/50 transition-colors resize-none"
                  />
                </label>
              ))}
            </div>

            <button
              onClick={handleSaveProfile}
              className="w-full py-2 rounded-lg bg-zen-sage text-white text-sm font-medium hover:bg-zen-sage/90 transition-colors"
            >
              {profileSaved ? '已保存' : '保存画像'}
            </button>
          </div>

          {/* 分隔线 */}
          <div className="border-t border-ink-muted/20" />

          {/* 数据安全声明 — 醒目展示 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-zen-sage" />
              <h3 className="text-sm font-medium text-ink-primary">数据安全与隐私</h3>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-zen-sage/5 to-zen-indigo/5 border border-zen-sage/20 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-zen-sage/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lock className="w-4 h-4 text-zen-sage" />
                </div>
                <div>
                  <div className="text-sm font-medium text-ink-primary">你的数据，你做主</div>
                  <p className="text-xs text-ink-tertiary mt-0.5 leading-relaxed">
                    所有对话、记忆、人物档案、日记均存储在你的浏览器本地（IndexedDB），不会上传到任何服务器。衡舟不收集、不存储、不共享你的任何个人信息。
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-zen-sage/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <HardDrive className="w-4 h-4 text-zen-sage" />
                </div>
                <div>
                  <div className="text-sm font-medium text-ink-primary">随时导出，随时删除</div>
                  <p className="text-xs text-ink-tertiary mt-0.5 leading-relaxed">
                    你可以随时在下方"数据管理"中导出全部数据（JSON格式），也可以一键清除所有数据。数据完全由你掌控。
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-zen-sage/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-4 h-4 text-zen-sage" />
                </div>
                <div>
                  <div className="text-sm font-medium text-ink-primary">API Key 安全</div>
                  <p className="text-xs text-ink-tertiary mt-0.5 leading-relaxed">
                    你的 API Key 仅存储在浏览器 localStorage 中，请求会通过衡舟后端代理转发给模型服务商，不会硬编码在前端源码中。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 高级设置 */}
          <div className="border-t border-ink-muted/20 pt-4">
            <button
              onClick={() => setShowAdvanced(v => !v)}
              className="flex items-center justify-between w-full text-sm font-medium text-ink-secondary hover:text-ink-primary transition-colors"
            >
              <span>高级设置</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <p className="text-xs text-ink-tertiary mt-1">豆包备用模型、插件、数据导出、反馈与路线图等。</p>
            {showAdvanced && (
              <div className="mt-4 space-y-8">
                {/* 豆包 API 配置 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-zen-amber" />
                    <h3 className="text-sm font-medium text-ink-primary">豆包 API 配置（备用模型）</h3>
                  </div>
                  <p className="text-xs text-ink-tertiary">
                    配置豆包 API 后，当 DeepSeek 不可用时自动切换到豆包，或双模型并行取更快结果。留空则使用后端代理的环境变量 Key。
                  </p>
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type={showDoubaoKey ? 'text' : 'password'}
                        value={doubaoKey}
                        onChange={(e) => setDoubaoKey(e.target.value)}
                        placeholder="豆包 API Key..."
                        className="w-full px-3 py-2 pr-10 rounded-lg border border-ink-muted/20 bg-canvas text-sm text-ink-primary placeholder:text-ink-tertiary outline-none focus:border-zen-amber/50 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDoubaoKey((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-canvas-warm text-ink-tertiary"
                        aria-label={showDoubaoKey ? '隐藏豆包 Key' : '显示豆包 Key'}
                      >
                        {showDoubaoKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={doubaoModel}
                      onChange={(e) => setDoubaoModel(e.target.value)}
                      placeholder={`模型ID（如 ${DEFAULT_DOUBAO_MODEL_NAME}）`}
                      className="w-full px-3 py-2 rounded-lg border border-ink-muted/20 bg-canvas text-sm text-ink-primary placeholder:text-ink-tertiary outline-none focus:border-zen-amber/50 transition-colors"
                    />
                    <button
                      onClick={handleSaveDoubao}
                      className="w-full py-2 rounded-lg bg-zen-amber text-white text-sm font-medium hover:bg-zen-amber/90 transition-colors"
                    >
                      {doubaoSaved ? '已保存' : '保存豆包配置'}
                    </button>
                  </div>
                  {isDoubaoEnabled() && (
                    <p className="text-xs text-zen-sage flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      豆包已启用，将作为备用/并行模型
                    </p>
                  )}
                </div>

                {/* 分隔线 */}
                <div className="border-t border-ink-muted/20" />

                {/* 付费意愿调研 */}
                <FeedbackSection />

                {/* 分隔线 */}
                <div className="border-t border-ink-muted/20" />

                {/* 数据管理 */}
                <DataManager />

                {/* 分隔线 */}
                <div className="border-t border-ink-muted/20" />

                {/* 插件管理 */}
                <PluginManager />

                {/* 分隔线 */}
                <div className="border-t border-ink-muted/20" />

                {/* 关于 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-zen-indigo" />
                    <h3 className="text-sm font-medium text-ink-primary">关于</h3>
                  </div>
                  <div className="text-xs text-ink-tertiary space-y-1">
                    <p>衡舟 v1.0 — 你的第二大脑，持续在场的生活伴侣</p>
                    <p>聚焦职场人的关系与记忆管理，帮你记住一切、理清思路。</p>
                  </div>
                  <button
                    onClick={() => setShowRoadmap(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-canvas border border-ink-muted/10 text-sm text-ink-secondary hover:bg-canvas-warm hover:border-ink-muted/20 transition-colors"
                  >
                    <Map className="w-4 h-4 text-zen-terracotta" />
                    未来拓展方向
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 未来拓展方向页面 */}
      {showRoadmap && <RoadmapPage onClose={() => setShowRoadmap(false)} />}
    </>
  )
}

/* 付费意愿调研组件 */
function FeedbackSection() {
  const [submitted, setSubmitted] = useState(() => localStorage.getItem('hengzhou-feedback-done') === 'true')
  const [willingness, setWillingness] = useState('')
  const [scenario, setScenario] = useState('')
  const [feature, setFeature] = useState('')

  const handleSubmit = () => {
    const data = { willingness, scenario, feature, timestamp: Date.now() }
    // 存入localStorage供后续分析
    const existing = JSON.parse(localStorage.getItem('hengzhou-feedback-data') || '[]')
    existing.push(data)
    localStorage.setItem('hengzhou-feedback-data', JSON.stringify(existing))
    localStorage.setItem('hengzhou-feedback-done', 'true')
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-zen-rose" />
          <h3 className="text-sm font-medium text-ink-primary">感谢你的反馈</h3>
        </div>
        <div className="rounded-xl bg-zen-rose/5 border border-zen-rose/10 p-4">
          <p className="text-sm text-ink-secondary leading-relaxed">
            你的反馈已记录，会帮助我们做出更好的产品。谢谢！
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Heart className="w-4 h-4 text-zen-rose" />
        <h3 className="text-sm font-medium text-ink-primary">帮助我们变得更好</h3>
      </div>
      <p className="text-xs text-ink-tertiary">
        匿名反馈，仅用于改进产品。1分钟搞定。
      </p>
      <div className="space-y-3 rounded-xl bg-canvas border border-ink-muted/10 p-4">
        {/* Q1: 付费意愿 */}
        <div>
          <label className="text-xs font-medium text-ink-secondary block mb-1.5">
            如果衡舟能帮你记住所有重要的事、管理好每段关系，你愿意每月付多少？
          </label>
          <div className="flex flex-wrap gap-1.5">
            {['不愿意', '9.9元', '19.9元', '29.9元', '49.9元+'].map((opt) => (
              <button
                key={opt}
                onClick={() => setWillingness(opt)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  willingness === opt
                    ? 'bg-zen-terracotta text-white'
                    : 'bg-surface border border-ink-muted/20 text-ink-tertiary hover:border-ink-muted/40'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Q2: 最需要的场景 */}
        <div>
          <label className="text-xs font-medium text-ink-secondary block mb-1.5">
            你最希望衡舟帮你的场景是？
          </label>
          <div className="flex flex-wrap gap-1.5">
            {['职场关系管理', '健康习惯追踪', '学习笔记整理', '情绪日记', '家庭事务管理'].map((opt) => (
              <button
                key={opt}
                onClick={() => setScenario(opt)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  scenario === opt
                    ? 'bg-zen-terracotta text-white'
                    : 'bg-surface border border-ink-muted/20 text-ink-tertiary hover:border-ink-muted/40'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Q3: 最看重的功能 */}
        <div>
          <label className="text-xs font-medium text-ink-secondary block mb-1.5">
            你最看重的功能是？
          </label>
          <div className="flex flex-wrap gap-1.5">
            {['自动记忆提取', '人物关系分析', '智能提醒', '多角度思考', '数据安全'].map((opt) => (
              <button
                key={opt}
                onClick={() => setFeature(opt)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  feature === opt
                    ? 'bg-zen-terracotta text-white'
                    : 'bg-surface border border-ink-muted/20 text-ink-tertiary hover:border-ink-muted/40'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!willingness || !scenario || !feature}
          className="w-full py-2 rounded-lg bg-zen-rose/10 text-zen-rose text-sm font-medium hover:bg-zen-rose/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          提交反馈
        </button>
      </div>
    </div>
  )
}

/* 插件管理组件 */
function PluginManager() {
  const [plugins] = useState(() => pluginEngine.getPlugins())
  const [, forceUpdate] = useState(0)

  const toggleSetting = (pluginId: string, key: string) => {
    const current = pluginEngine.getSetting(pluginId, key)
    pluginEngine.setSetting(pluginId, key, !current)
    forceUpdate(n => n + 1)
  }

  const setSetting = (pluginId: string, key: string, value: any) => {
    pluginEngine.setSetting(pluginId, key, value)
    forceUpdate(n => n + 1)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Puzzle className="w-4 h-4 text-zen-indigo" />
        <h3 className="text-sm font-medium text-ink-primary">插件管理</h3>
      </div>
      <p className="text-xs text-ink-tertiary">
        插件扩展衡舟的能力。内置插件已自动启用，高级用户可自定义配置。
      </p>
      <div className="space-y-2">
        {plugins.map((plugin) => (
          <div
            key={plugin.id}
            className="rounded-xl bg-canvas border border-ink-muted/10 p-3 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-ink-primary">{plugin.name}</div>
                <div className="text-xs text-ink-muted">v{plugin.version} · {plugin.description}</div>
              </div>
              <span className="text-2xs px-1.5 py-0.5 rounded bg-zen-sage/10 text-zen-sage">已启用</span>
            </div>

            {/* 插件设置 */}
            {plugin.settings && Object.entries(plugin.settings).length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-ink-muted/10">
                {Object.entries(plugin.settings).map(([key, config]) => {
                  const value = pluginEngine.getSetting(plugin.id, key)
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs text-ink-tertiary">{config.label}</span>
                      {config.type === 'boolean' && (
                        <button
                          onClick={() => toggleSetting(plugin.id, key)}
                          className={`w-8 h-4 rounded-full transition-colors relative ${
                            value ? 'bg-zen-sage' : 'bg-ink-muted/30'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-surface border border-ink-muted/20 transition-transform ${
                            value ? 'left-4.5' : 'left-0.5'
                          }`} />
                        </button>
                      )}
                      {config.type === 'number' && (
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => setSetting(plugin.id, key, parseInt(e.target.value))}
                          className="w-16 px-1.5 py-0.5 rounded text-xs bg-surface border border-ink-muted/20 text-ink-primary text-right"
                        />
                      )}
                      {config.type === 'string' && (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setSetting(plugin.id, key, e.target.value)}
                          className="w-24 px-1.5 py-0.5 rounded text-xs bg-surface border border-ink-muted/20 text-ink-primary"
                        />
                      )}
                      {config.type === 'select' && config.options && (
                        <select
                          value={value}
                          onChange={(e) => setSetting(plugin.id, key, e.target.value)}
                          className="px-1.5 py-0.5 rounded text-xs bg-surface border border-ink-muted/20 text-ink-primary"
                        >
                          {config.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
