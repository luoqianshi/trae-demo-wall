import { useState, useEffect, useRef, type ReactNode } from 'react'
import {
  User,
  Key,
  Zap,
  Palette,
  DatabaseBackup,
  Download,
  Trash2,
  ChevronRight,
  ChevronDown,
  Heart,
  Info,
  Shield,
  ArrowLeft,
  Check,
  Lock,
  HardDrive,
  Eye,
  EyeOff,
  Volume2,
  Puzzle,
  Map,
  AlertTriangle,
  MessageSquare,
  Monitor,
  Compass,
  type LucideIcon,
} from 'lucide-react'
import { DataManager } from './DataManager'
import { RoadmapPage } from './RoadmapPage'
import { replayGuideTour } from './GuideTour'
import { useAgentStore } from '../stores/useAgentStore'
import type { UserProfile } from '../types'
import { getUserProfileObject, setUserProfile } from '../lib/prompts'
import {
  isDoubaoEnabled,
  isUsingDefaultKey,
  isApiKeyValid,
  isDoubaoApiKeyValid,
  DEFAULT_DOUBAO_MODEL_NAME,
  getResponseStyle,
  setResponseStyle,
  RESPONSE_STYLE_LABELS,
  RESPONSE_STYLE_DESCRIPTIONS,
  type ResponseStyle,
} from '../lib/config'
import { pluginEngine } from '../lib/pluginEngine'
import { useTheme } from '../hooks/useTheme'
import { getThemeConfig } from '../lib/theme'
import type { ThemeName } from '../lib/theme'
import { getLayoutMode, setLayoutMode, type LayoutMode } from './DesktopLayout'
import { resetProbeCache } from '../lib/ai'
import { resetVectorServiceCache } from '../lib/zvecClient'

type Section = 'list' | 'account' | 'ai' | 'data' | 'advanced'

// ============================================================
// 通用列表项与分组
// ============================================================

interface SettingsItemProps {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  label: string
  labelColor?: string
  badge?: string
  badgeClass?: string
  onClick: () => void
}

function SettingsItem({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  labelColor = 'text-ink-primary',
  badge,
  badgeClass = 'bg-zen-sage/15 text-zen-sage',
  onClick,
}: SettingsItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-ink-muted/5 active:bg-ink-muted/10 transition-colors"
    >
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <span className={`flex-1 text-sm ${labelColor}`}>{label}</span>
      {badge && (
        <span className={`text-2xs px-1.5 py-0.5 rounded-full font-medium ${badgeClass}`}>
          {badge}
        </span>
      )}
      <ChevronRight className="w-4 h-4 text-ink-muted flex-shrink-0" />
    </button>
  )
}

interface SettingsSectionProps {
  title: string
  children: ReactNode
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-medium text-ink-tertiary px-1 mb-1.5">{title}</h3>
      <div className="rounded-xl bg-surface border border-ink-muted/10 overflow-hidden divide-y divide-ink-muted/10">
        {children}
      </div>
    </div>
  )
}

// ============================================================
// 详情页头部（带返回按钮）
// ============================================================

function DetailHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="px-4 pt-4 pb-3 border-b border-ink-muted/10 bg-surface flex items-center gap-2">
      <button
        type="button"
        onClick={onBack}
        className="w-8 h-8 -ml-1 rounded-lg flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:bg-canvas-warm transition-colors"
        aria-label="返回"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h2 className="text-lg font-serif font-semibold text-ink-primary">{title}</h2>
    </div>
  )
}

// ============================================================
// 界面风格选择器
// ============================================================

interface ThemePreviewCardProps {
  themeName: ThemeName
  isActive: boolean
  onSelect: (name: ThemeName) => void
}

function ThemePreviewCard({ themeName, isActive, onSelect }: ThemePreviewCardProps) {
  const config = getThemeConfig(themeName)
  const { colors, fonts } = config

  // 根据主题构建预览样式
  const previewBg =
    themeName === 'glass'
      ? 'linear-gradient(135deg, #A8B8C8 0%, #B8C5D0 30%, #C5BDB5 60%, #AAB0A8 100%)'
      : colors.canvas

  const cardBg =
    themeName === 'glass'
      ? 'rgba(255,255,255,0.3)'
      : colors.surface

  const cardBorder =
    themeName === 'glass'
      ? '1px solid rgba(255,255,255,0.4)'
      : '1px solid rgba(214,211,209,0.2)'

  const cardShadow =
    themeName === 'glass'
      ? '0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.3)'
      : '0 2px 12px rgba(0,0,0,0.04)'

  const titleColor = colors.inkPrimary
  const accentColor = colors.terracotta

  return (
    <button
      type="button"
      onClick={() => onSelect(themeName)}
      className={`relative rounded-xl overflow-hidden transition-all duration-300 focus:outline-none ${
        isActive
          ? 'ring-2 ring-zen-terracotta ring-offset-2 ring-offset-canvas scale-[1.02]'
          : 'ring-1 ring-ink-muted/20 hover:ring-ink-muted/40'
      }`}
      style={{ fontFamily: fonts.sans }}
      aria-label={`切换到${config.label}风格`}
      aria-pressed={isActive}
    >
      {/* 预览区域 */}
      <div
        className="h-20 p-2.5 flex flex-col justify-between"
        style={{ background: previewBg }}
      >
        {/* 迷你卡片 */}
        <div
          className="rounded-lg p-1.5 flex items-center justify-center flex-1"
          style={{
            background: cardBg,
            border: cardBorder,
            boxShadow: cardShadow,
            backdropFilter: themeName === 'glass' ? 'blur(16px) saturate(150%)' : 'none',
            WebkitBackdropFilter: themeName === 'glass' ? 'blur(16px) saturate(150%)' : 'none',
          }}
        >
          <div
            className="text-sm font-semibold leading-tight truncate"
            style={{ color: titleColor, fontFamily: fonts.serif }}
          >
            {config.label}
          </div>
        </div>

        {/* 强调色圆点 */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: colors.sage }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: colors.amber }}
          />
        </div>
      </div>

      {/* 底部标签栏 */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-surface border-t border-ink-muted/10">
        <span className={`text-xs font-medium truncate ${isActive ? 'text-zen-terracotta' : 'text-ink-secondary'}`}>
          {config.label}
        </span>
        {isActive && (
          <div className="w-4 h-4 rounded-full bg-zen-terracotta flex items-center justify-center flex-shrink-0">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
    </button>
  )
}

function ThemeStyleSelector() {
  const { currentTheme, setTheme } = useTheme()

  const featuredThemes: ThemeName[] = ['ink', 'glass', 'cinematic']

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-zen-rose" />
        <h3 className="text-sm font-medium text-ink-primary">界面风格</h3>
      </div>
      <p className="text-xs text-ink-tertiary">
        选择你喜欢的视觉风格，切换后全应用即时生效。
      </p>
      <div className="grid grid-cols-3 gap-3">
        {featuredThemes.map((name) => (
          <ThemePreviewCard
            key={name}
            themeName={name}
            isActive={currentTheme === name}
            onSelect={setTheme}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================
// 个人画像
// ============================================================

function AccountSection() {
  const [userProfile, setUserProfileState] = useState<UserProfile>(() => getUserProfileObject())
  const [profileSaved, setProfileSaved] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const registerTimer = (timer: ReturnType<typeof setTimeout>) => {
    timersRef.current.push(timer)
    return timer
  }

  useEffect(() => () => timersRef.current.forEach(clearTimeout), [])

  const handleSaveProfile = () => {
    setUserProfile(userProfile)
    setProfileSaved(true)
    registerTimer(setTimeout(() => setProfileSaved(false), 2000))
  }

  return (
    <div className="space-y-4">
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
  )
}

// ============================================================
// AI 配置
// ============================================================

function AISection() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('hengzhou-api-key') || '')
  const [saved, setSaved] = useState(false)
  const [showDeepSeekKey, setShowDeepSeekKey] = useState(false)
  const [proxyToken, setProxyToken] = useState(() => localStorage.getItem('hengzhou-proxy-token') || '')
  const [proxySaved, setProxySaved] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem('hengzhou-voice-enabled') === 'true')
  const [currentStyle, setCurrentStyle] = useState<ResponseStyle>(() => getResponseStyle())
  const [styleRefresh, setStyleRefresh] = useState(0)

  // 同步风格选择（点击后重新读取 localStorage）
  useEffect(() => {
    setCurrentStyle(getResponseStyle())
  }, [styleRefresh])

  const [doubaoKey, setDoubaoKey] = useState(() => localStorage.getItem('hengzhou-doubao-api-key') || '')
  const [doubaoModel, setDoubaoModel] = useState(() => localStorage.getItem('hengzhou-doubao-model') || DEFAULT_DOUBAO_MODEL_NAME)
  const [doubaoSaved, setDoubaoSaved] = useState(false)
  const [showDoubaoKey, setShowDoubaoKey] = useState(false)

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const registerTimer = (timer: ReturnType<typeof setTimeout>) => {
    timersRef.current.push(timer)
    return timer
  }

  useEffect(() => () => timersRef.current.forEach(clearTimeout), [])

  const handleSaveKey = () => {
    localStorage.setItem('hengzhou-api-key', apiKey.trim())
    resetProbeCache() // FIX: 重置探测缓存，使下次对话重新探测
    setSaved(true)
    registerTimer(setTimeout(() => setSaved(false), 2000))
  }

  const handleSaveProxyToken = () => {
    localStorage.setItem('hengzhou-proxy-token', proxyToken.trim())
    resetProbeCache() // FIX: 重置探测缓存
    resetVectorServiceCache() // FIX: 重置向量服务缓存
    setProxySaved(true)
    registerTimer(setTimeout(() => setProxySaved(false), 2000))
  }

  const handleSaveDoubao = () => {
    localStorage.setItem('hengzhou-doubao-api-key', doubaoKey.trim())
    localStorage.setItem('hengzhou-doubao-model', doubaoModel.trim())
    resetProbeCache() // FIX: 重置探测缓存，使下次对话重新探测
    setDoubaoSaved(true)
    registerTimer(setTimeout(() => setDoubaoSaved(false), 2000))
  }

  return (
    <div className="space-y-6">
      {isUsingDefaultKey() && (
        <div className="p-3 rounded-lg bg-zen-amber/15 border border-zen-amber/30 text-xs text-ink-primary flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-zen-amber flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">未配置个人 API Key</p>
            <p className="text-ink-tertiary mt-0.5">
              将使用后端代理的环境变量 Key。如需使用自己的 DeepSeek / 豆包 Key，请在下方填写。
            </p>
          </div>
        </div>
      )}

      {/* DeepSeek API 配置 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-zen-terracotta" />
          <h3 className="text-sm font-medium text-ink-primary">DeepSeek API 配置</h3>
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

      {/* 回复风格 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zen-terracotta" />
          <h3 className="text-sm font-medium text-ink-primary">回复风格</h3>
        </div>
        <p className="text-xs text-ink-tertiary">
          选择衡舟回复你的语言风格，影响回复长度和表达方式。
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(['concise', 'standard', 'detailed'] as ResponseStyle[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                setResponseStyle(s)
                setStyleRefresh((v) => v + 1)
              }}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                currentStyle === s
                  ? 'bg-zen-sage/15 text-zen-sage border-zen-sage/40'
                  : 'bg-surface text-ink-secondary border-ink-muted/20 hover:border-ink-muted/40'
              }`}
            >
              {RESPONSE_STYLE_LABELS[s]}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-tertiary leading-relaxed">
          {RESPONSE_STYLE_DESCRIPTIONS[currentStyle]}
        </p>
      </div>

      {/* 分隔线 */}
      <div className="border-t border-ink-muted/20" />

      {/* 豆包 API 配置（备用模型） */}
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
    </div>
  )
}

// ============================================================
// 数据管理
// ============================================================

function DataSection() {
  return (
    <div className="space-y-6">
      {/* 数据安全与隐私声明 */}
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

      {/* 分隔线 */}
      <div className="border-t border-ink-muted/20" />

      {/* 数据管理器：导出 / 导入 / 微信 / 清除 */}
      <DataManager />
    </div>
  )
}

// ============================================================
// 高级设置
// ============================================================

function AdvancedSection() {
  const [showRoadmap, setShowRoadmap] = useState(false)
  const agents = useAgentStore((s) => s.agents)

  return (
    <div className="space-y-6">
      {/* Agent 状态 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-zen-slate" />
          <h3 className="text-sm font-medium text-ink-primary">Agent 状态</h3>
        </div>
        <p className="text-xs text-ink-tertiary">
          衡舟的多 Agent 协作系统由以下角色组成，共同为你提供深度思考与个性化建议。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-2.5 rounded-lg bg-canvas border border-ink-muted/10 px-3 py-2"
            >
              <span className="text-lg flex-shrink-0">{agent.avatar}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink-primary truncate">{agent.name}</div>
                <div className="text-2xs text-ink-tertiary truncate">{agent.role}</div>
              </div>
              <span className="text-2xs px-1.5 py-0.5 rounded-full bg-zen-sage/10 text-zen-sage flex-shrink-0">
                待命
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 分隔线 */}
      <div className="border-t border-ink-muted/20" />

      {/* 插件管理 */}
      <PluginManager />

      {/* 分隔线 */}
      <div className="border-t border-ink-muted/20" />

      {/* 付费意愿调研 */}
      <FeedbackSection />

      {/* 分隔线 */}
      <div className="border-t border-ink-muted/20" />

      {/* 关于 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-zen-indigo" />
          <h3 className="text-sm font-medium text-ink-primary">关于</h3>
        </div>
        <div className="text-xs text-ink-tertiary space-y-1">
          <p>衡舟 v2.0 — 你的第二大脑，持续在场的生活伴侣</p>
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

      {/* 未来拓展方向页面 */}
      {showRoadmap && <RoadmapPage onClose={() => setShowRoadmap(false)} />}
    </div>
  )
}

// ============================================================
// 付费意愿调研组件
// ============================================================

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

// ============================================================
// 插件管理组件
// ============================================================

function PluginManager() {
  const [plugins] = useState(() => pluginEngine.getPlugins())
  const [, forceUpdate] = useState(0)

  const toggleSetting = (pluginId: string, key: string) => {
    const current = pluginEngine.getSetting(pluginId, key)
    pluginEngine.setSetting(pluginId, key, !current)
    forceUpdate((n) => n + 1)
  }

  const setSetting = (pluginId: string, key: string, value: any) => {
    pluginEngine.setSetting(pluginId, key, value)
    forceUpdate((n) => n + 1)
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

// ============================================================
// 界面布局选择器
// ============================================================

const LAYOUT_MODE_OPTIONS: { value: LayoutMode; label: string; desc: string }[] = [
  { value: 'mobile', label: '移动端', desc: '底部导航栏，适合手机竖屏' },
  { value: 'desktop', label: '桌面端', desc: '侧边导航栏 + 上下文信息栏' },
  { value: 'auto', label: '自动', desc: '根据屏幕宽度自动切换（>1024px 用桌面端）' },
]

function LayoutModeSelector() {
  const [mode, setMode] = useState<LayoutMode>(() => getLayoutMode())

  const handleSetMode = (newMode: LayoutMode) => {
    setMode(newMode)
    setLayoutMode(newMode)
  }

  return (
    <div className="px-3 py-3">
      <div className="grid grid-cols-3 gap-2">
        {LAYOUT_MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSetMode(opt.value)}
            className={`px-2 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              mode === opt.value
                ? 'bg-zen-sage/15 text-zen-sage border-zen-sage/40'
                : 'bg-surface text-ink-secondary border-ink-muted/20 hover:border-ink-muted/40'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-ink-tertiary mt-2 leading-relaxed">
        {LAYOUT_MODE_OPTIONS.find((o) => o.value === mode)?.desc}
      </p>
    </div>
  )
}

// ============================================================
// 主页面
// ============================================================

const SECTION_TITLES: Record<Exclude<Section, 'list'>, string> = {
  account: '个人画像',
  ai: 'AI 配置',
  data: '数据管理',
  advanced: '高级设置',
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('list')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(() => isApiKeyValid() || isDoubaoApiKeyValid())

  // 返回列表时刷新密钥配置状态，使「已配置」徽标保持准确
  const handleBack = () => {
    setActiveSection('list')
    setHasApiKey(isApiKeyValid() || isDoubaoApiKeyValid())
  }

  const go = (section: Section) => () => setActiveSection(section)

  return (
    <div className="flex flex-col h-full bg-canvas page-enter">
      {activeSection === 'list' ? (
        <>
          {/* 头部 */}
          <div className="px-4 pt-4 pb-3 border-b border-ink-muted/10 bg-surface">
            <h2 className="text-lg font-serif font-semibold text-ink-primary">设置</h2>
          </div>

          {/* 可滚动内容 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
            {/* 账号 */}
            <SettingsSection title="账号">
              <SettingsItem
                icon={User}
                iconBg="bg-zen-indigo/10"
                iconColor="text-zen-indigo"
                label="个人画像"
                onClick={go('account')}
              />
            </SettingsSection>

            {/* AI 配置 */}
            <SettingsSection title="AI 配置">
              <SettingsItem
                icon={Key}
                iconBg="bg-zen-amber/10"
                iconColor="text-zen-amber"
                label="API 密钥"
                badge={hasApiKey ? '已配置' : undefined}
                onClick={go('ai')}
              />
              <SettingsItem
                icon={Zap}
                iconBg="bg-zen-terracotta/10"
                iconColor="text-zen-terracotta"
                label="模型选择"
                onClick={go('ai')}
              />
            </SettingsSection>

            {/* 界面风格 + 界面布局 */}
            <div className="mb-5">
              <h3 className="text-xs font-medium text-ink-tertiary px-1 mb-1.5">界面</h3>
              <div className="rounded-xl bg-surface border border-ink-muted/10 p-4 space-y-4">
                <ThemeStyleSelector />
                <div className="border-t border-ink-muted/10 pt-4">
                  <div className="flex items-center gap-3 px-1 pb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-zen-indigo/10">
                      <Monitor className="w-4 h-4 text-zen-indigo" />
                    </div>
                    <span className="flex-1 text-sm text-ink-primary">界面布局</span>
                  </div>
                  <LayoutModeSelector />
                </div>
              </div>
            </div>

            {/* 数据 */}
            <SettingsSection title="数据">
              <SettingsItem
                icon={DatabaseBackup}
                iconBg="bg-zen-sage/10"
                iconColor="text-zen-sage"
                label="备份与恢复"
                onClick={go('data')}
              />
              <SettingsItem
                icon={Download}
                iconBg="bg-zen-indigo/10"
                iconColor="text-zen-indigo"
                label="导出数据"
                onClick={go('data')}
              />
              <SettingsItem
                icon={Trash2}
                iconBg="bg-zen-rose/10"
                iconColor="text-zen-rose"
                label="清除数据"
                labelColor="text-zen-rose"
                onClick={go('data')}
              />
            </SettingsSection>

            {/* 高级（可折叠） */}
            <div className="mb-5">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="w-full flex items-center justify-between text-xs font-medium text-ink-tertiary px-1 mb-1.5 hover:text-ink-secondary transition-colors"
              >
                <span>高级</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
                />
              </button>
              {showAdvanced && (
                <div className="rounded-xl bg-surface border border-ink-muted/10 overflow-hidden divide-y divide-ink-muted/10">
                  <SettingsItem
                    icon={Shield}
                    iconBg="bg-zen-slate/10"
                    iconColor="text-zen-slate"
                    label="Agent 状态"
                    onClick={go('advanced')}
                  />
                  <SettingsItem
                    icon={DatabaseBackup}
                    iconBg="bg-zen-indigo/10"
                    iconColor="text-zen-indigo"
                    label="数据管理器"
                    onClick={go('data')}
                  />
                  <SettingsItem
                    icon={Compass}
                    iconBg="bg-zen-sage/10"
                    iconColor="text-zen-sage"
                    label="重新查看功能导览"
                    onClick={() => replayGuideTour()}
                  />
                  <SettingsItem
                    icon={Info}
                    iconBg="bg-zen-terracotta/10"
                    iconColor="text-zen-terracotta"
                    label="关于衡舟"
                    onClick={go('advanced')}
                  />
                </div>
              )}
            </div>

            {/* 版本信息 */}
            <div className="flex items-center justify-center gap-1.5 mt-6 text-2xs text-ink-muted">
              <Heart className="w-3 h-3 text-zen-rose" />
              <span>衡舟 v2.0</span>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* 详情头部：返回按钮 + 区块标题 */}
          <DetailHeader title={SECTION_TITLES[activeSection]} onBack={handleBack} />

          {/* 详情内容：内联全页展示，无抽屉/遮罩 */}
          <div className="flex-1 overflow-y-auto p-4 pb-8">
            {activeSection === 'account' && <AccountSection />}
            {activeSection === 'ai' && <AISection />}
            {activeSection === 'data' && <DataSection />}
            {activeSection === 'advanced' && <AdvancedSection />}
          </div>
        </>
      )}
    </div>
  )
}
