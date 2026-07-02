'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Server,
  Key,
  Globe,
  Bot,
  AlertCircle,
  CheckCircle,
  Save,
  User,
  Moon,
  Bell,
  Shield,
  ChevronRight,
  Monitor,
  RefreshCw,
  ChevronDown,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import { ValidatedInput } from '../../../components/ui/ValidatedInput'
import { useAuth } from '../../../lib/auth-context'
import { type AIModel } from '../../../lib/ai-model-discovery'
import type { AIProvider, AIProviderConfig } from '../../../lib/editor-types'
import { useToast } from '../../../components/ui/Toast'
import { getAIConfig, saveAIConfig } from '../../../lib/editor-api'
import { SecureApiKeyManager } from '../../../lib/secure-api-key'

const PROVIDER_OPTIONS: {
  value: AIProvider | 'grok' | 'cherry'
  label: string
  icon: typeof Bot
  defaultModel: string
  needsApiKey: boolean
  defaultBaseUrl?: string
  canDiscover: boolean
  accentColor: string
}[] = [
    { value: 'ollama', label: 'Ollama（本地）', icon: Server, defaultModel: 'llama3.2', needsApiKey: false, defaultBaseUrl: 'http://localhost:11434', canDiscover: true, accentColor: '#6BA88A' },
    { value: 'deepseek', label: 'DeepSeek', icon: Bot, defaultModel: 'deepseek-chat', needsApiKey: true, defaultBaseUrl: 'https://api.deepseek.com', canDiscover: true, accentColor: '#5B8DB8' },
    { value: 'openai', label: 'OpenAI', icon: Bot, defaultModel: 'gpt-4o-mini', needsApiKey: true, defaultBaseUrl: 'https://api.openai.com/v1', canDiscover: true, accentColor: '#10A37F' },
    { value: 'grok', label: 'Grok (xAI)', icon: Bot, defaultModel: 'grok-3-latest', needsApiKey: true, defaultBaseUrl: 'https://api.x.ai/v1', canDiscover: true, accentColor: '#C4A35A' },
    { value: 'cherry', label: 'Cherry Studio', icon: Server, defaultModel: 'openai:gpt-4o-mini', needsApiKey: true, defaultBaseUrl: 'http://localhost:23333/v1', canDiscover: true, accentColor: '#B87070' },
    { value: 'custom', label: '自定义', icon: Globe, defaultModel: '', needsApiKey: true, defaultBaseUrl: '', canDiscover: true, accentColor: '#8A7E74' },
  ]

type SettingsTab = 'ai' | 'account' | 'appearance' | 'notifications'

const TABS: { id: SettingsTab; label: string; icon: typeof Bot }[] = [
  { id: 'ai', label: '智囊配置', icon: Bot },
  { id: 'account', label: '号簿', icon: User },
  { id: 'appearance', label: '外观', icon: Moon },
  { id: 'notifications', label: '传讯', icon: Bell },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const { success, error } = useToast()
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai')

  // AI Settings state
  const stored = getAIConfig()
  const defaultProvider = PROVIDER_OPTIONS[0]
  const initialProvider = stored?.provider || defaultProvider.value

  const getInitialConfig = () => {
    const configKey = `ai_config_${initialProvider}`
    const savedConfig = localStorage.getItem(configKey)
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        return { baseUrl: config.baseUrl || defaultProvider.defaultBaseUrl || '', model: config.model || defaultProvider.defaultModel }
      } catch { /* ignore */ }
    }
    return { baseUrl: stored?.baseUrl || defaultProvider.defaultBaseUrl || '', model: stored?.model || defaultProvider.defaultModel }
  }

  const initialConfig = getInitialConfig()

  const [provider, setProvider] = useState<AIProvider | 'grok' | 'cherry'>(initialProvider)
  const [apiKey, setApiKey] = useState(stored?.apiKey || '')
  const [baseUrl, setBaseUrl] = useState(initialConfig.baseUrl)
  const [model, setModel] = useState(initialConfig.model)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showSecurityTip, setShowSecurityTip] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  // Model discovery state
  const [availableModels, setAvailableModels] = useState<AIModel[]>([])
  const [discovering, setDiscovering] = useState(false)
  const [discoverError, setDiscoverError] = useState('')
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)

  // Appearance settings
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')

  // Notification settings
  const [notifications, setNotifications] = useState({
    email: true, push: false, deadline: true, daily: false,
  })

  const currentOption = PROVIDER_OPTIONS.find((p) => p.value === provider)!

  useEffect(() => {
    if (apiKey && provider !== 'ollama' && rememberMe) {
      SecureApiKeyManager.store(provider as string, apiKey, rememberMe)
    }
  }, [apiKey, provider, rememberMe])

  const handleApiKeyChange = (value: string) => {
    setApiKey(value)
    if (value && rememberMe && provider !== 'ollama') {
      SecureApiKeyManager.store(provider as string, value, rememberMe)
    }
  }

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked)
    if (apiKey && provider !== 'ollama') {
      if (checked) SecureApiKeyManager.store(provider as string, apiKey, true)
      else SecureApiKeyManager.clear(provider as string)
    }
  }

  const clearStoredKey = () => {
    SecureApiKeyManager.clear(provider as string)
    setApiKey('')
    setRememberMe(false)
  }

  const handleDiscoverModels = useCallback(async () => {
    setDiscovering(true)
    setDiscoverError('')
    try {
      const res = await fetch('/api/discover-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, baseUrl: baseUrl || currentOption.defaultBaseUrl, apiKey: apiKey || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setAvailableModels(data.models || [])
      if (!model && data.models?.length > 0) setModel(data.models[0].id)
    } catch (e: any) {
      setDiscoverError(e.message || '获取模型列表失败')
      setAvailableModels([])
    } finally {
      setDiscovering(false)
    }
  }, [provider, baseUrl, apiKey, currentOption, model])

  const saveProviderConfig = useCallback(() => {
    const configKey = `ai_config_${provider}`
    localStorage.setItem(configKey, JSON.stringify({ baseUrl, model, apiKey: rememberMe ? apiKey : '' }))
  }, [provider, baseUrl, model, apiKey, rememberMe])

  const loadProviderConfig = useCallback((providerKey: AIProvider | 'grok' | 'cherry') => {
    const configKey = `ai_config_${providerKey}`
    const storedConfig = localStorage.getItem(configKey)
    if (storedConfig) {
      try {
        const config = JSON.parse(storedConfig)
        if (config.baseUrl) setBaseUrl(config.baseUrl)
        if (config.model) setModel(config.model)
        if (config.apiKey) { setApiKey(config.apiKey); setRememberMe(true) }
      } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    const option = PROVIDER_OPTIONS.find((p) => p.value === provider)
    if (!option) return
    const configKey = `ai_config_${provider}`
    const storedConfig = localStorage.getItem(configKey)
    if (storedConfig) { loadProviderConfig(provider) }
    else { setBaseUrl(option.defaultBaseUrl || ''); setModel(option.defaultModel) }

    if (option.needsApiKey) {
      const savedKey = SecureApiKeyManager.retrieve(provider as string)
      if (savedKey) { setApiKey(savedKey); setRememberMe(true) }
    } else { setApiKey(''); setRememberMe(false) }

    setAvailableModels([])
    setDiscoverError('')
  }, [provider, loadProviderConfig])

  useEffect(() => {
    if (provider && baseUrl && model) saveProviderConfig()
  }, [provider, baseUrl, model, saveProviderConfig])

  const handleSaveAI = () => {
    setSaving(true)
    try {
      const config: AIProviderConfig = {
        provider: provider as AIProvider,
        apiKey: apiKey.trim(),
        baseUrl: baseUrl.trim() || undefined,
        model: model.trim(),
      }
      saveAIConfig(config)
      setSaveStatus('success')
      success('智囊配置已存')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch { setSaveStatus('error') }
    finally { setSaving(false) }
  }

  const handleTest = async () => {
    setTestStatus('testing')
    setTestMessage('')
    try {
      let url: string
      let body: Record<string, unknown>
      let headers: Record<string, string> = { 'Content-Type': 'application/json' }

      if (provider === 'ollama') {
        url = `${baseUrl || 'http://localhost:11434'}/api/generate`
        body = { model: model || 'llama3.2', prompt: 'Hello', stream: false }
      } else if (provider === 'deepseek') {
        url = `${baseUrl || 'https://api.deepseek.com'}/chat/completions`
        headers['Authorization'] = `Bearer ${apiKey}`
        body = { model: model || 'deepseek-chat', messages: [{ role: 'user', content: 'Hello' }], max_tokens: 5 }
      } else if (provider === 'openai') {
        url = `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`
        headers['Authorization'] = `Bearer ${apiKey}`
        body = { model: model || 'gpt-4o-mini', messages: [{ role: 'user', content: 'Hello' }], max_tokens: 5 }
      } else if (provider === 'grok') {
        url = `${baseUrl || 'https://api.x.ai/v1'}/chat/completions`
        headers['Authorization'] = `Bearer ${apiKey}`
        body = { model: model || 'grok-3-latest', messages: [{ role: 'user', content: 'Hello' }], max_tokens: 5 }
      } else if (provider === 'cherry') {
        url = `${baseUrl || 'http://localhost:23333/v1'}/chat/completions`
        headers['Authorization'] = `Bearer ${apiKey}`
        body = { model: model || 'openai:gpt-4o-mini', messages: [{ role: 'user', content: 'Hello' }], max_tokens: 5 }
      } else {
        url = `${baseUrl}/chat/completions`
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
        body = { model, messages: [{ role: 'user', content: 'Hello' }], max_tokens: 5 }
      }

      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: url, headers, body, isOllama: provider === 'ollama' })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.error) throw new Error(data.error.message || 'API 返回错误')
        setTestStatus('success')
        setTestMessage('连接通达！')
        success('连接通达')
      } else {
        const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }))
        setTestStatus('error')
        setTestMessage(err.error?.message || `HTTP ${res.status}`)
        error(err.error?.message || `HTTP ${res.status}`)
      }
    } catch (e: any) {
      setTestStatus('error')
      setTestMessage(e.message || '连接失败')
      error(e.message || '连接失败')
    }
  }

  const activeTabIndex = TABS.findIndex(t => t.id === activeTab)

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen paper-texture ink-wash">
      {/* Header */}
      <div className="mb-2 animate-float-in">
        <h1 className="font-display text-3xl text-ink tracking-wider">雅设</h1>
        <p className="font-serif text-ink-muted/40 mt-1 text-sm italic tracking-widest">
          修己以安人
        </p>
      </div>

      {/* Decorative ink divider */}
      <div className="ink-divider my-6" />

      {/* Tab bar with sliding indicator - spring easing */}
      <div className="relative mb-8 animate-float-in" style={{ animationDelay: '80ms' }}>
        <div className="flex gap-1 p-1 rounded-full bg-white/40 backdrop-blur-sm border border-border/50 w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-serif font-medium transition-all duration-300 ${
                  isActive ? 'bg-ink text-gold shadow-sm' : 'text-ink-muted hover:text-ink-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
        {/* Sliding indicator with spring easing */}
        <div
          className="absolute h-[2px] bg-gradient-to-r from-transparent via-ochre to-transparent transition-all duration-500"
          style={{
            bottom: '-4px',
            left: `${activeTabIndex * (100 / TABS.length) + 100 / TABS.length * 0.15}%`,
            width: `${100 / TABS.length * 0.7}%`,
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </div>

      {/* Content */}
      <div className="animate-float-in" style={{ animationDelay: '160ms' }}>
        {/* AI Settings */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="liquid-glass p-6">
              {/* Section header with font-serif font-semibold */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-ochre-bg rounded-2xl flex items-center justify-center">
                  <Server className="w-5 h-5 text-ochre" />
                </div>
                <div>
                  <h2 className="font-serif font-semibold text-ink text-lg">智囊来源配置</h2>
                  <p className="font-serif text-sm text-ink-muted">配置智囊服务来源与密钥</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Provider Selection */}
                <div className="space-y-2">
                  <label className="font-serif text-sm font-medium text-ink flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-ochre" />
                    智囊来源
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {PROVIDER_OPTIONS.map((option) => {
                      const Icon = option.icon
                      const isSelected = provider === option.value
                      return (
                        <button
                          key={option.value}
                          onClick={() => setProvider(option.value)}
                          className={`relative liquid-glass p-4 flex items-center gap-2 px-4 py-3 text-sm font-serif font-medium transition-all duration-300 overflow-hidden ${
                            isSelected
                              ? 'border-ochre/40 bg-ochre-bg/30 text-ochre golden-glow'
                              : 'text-ink-secondary hover:border-ochre/20'
                          }`}
                        >
                          {/* Accent color left border */}
                          <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ backgroundColor: option.accentColor }} />
                          <Icon className="w-4 h-4" />
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* ink-divider */}
                <div className="ink-divider" />

                {/* Model Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-serif text-sm font-medium text-ink flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-ochre" />
                      模型名号
                    </label>
                    <button
                      onClick={handleDiscoverModels}
                      disabled={discovering || (provider === 'custom' && !baseUrl)}
                      className="flex items-center gap-1 text-xs text-ochre hover:text-ink transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${discovering ? 'animate-spin' : ''}`} />
                      {discovering ? '获取中...' : '刷新模型'}
                    </button>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                      className="input-field flex items-center justify-between"
                    >
                      <span>{model || '请选择模型'}</span>
                      <ChevronDown className="w-4 h-4 text-ink-muted" />
                    </button>

                    {modelDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 liquid-glass shadow-lg max-h-60 overflow-y-auto">
                        {availableModels.length > 0 && (
                          <div className="py-1">
                            <div className="px-3 py-1 text-xs text-ink-muted font-medium">可用模型</div>
                            {availableModels.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => { setModel(m.id); setModelDropdownOpen(false) }}
                                className={`w-full text-left px-3 py-2 text-sm font-serif hover:bg-ochre-bg/20 transition-all duration-200 ${model === m.id ? 'bg-ochre-bg text-ochre' : 'text-ink'}`}
                              >
                                <div className="font-medium">{m.name}</div>
                                {m.description && <div className="text-xs text-ink-muted">{m.description}</div>}
                              </button>
                            ))}
                          </div>
                        )}
                        {availableModels.length === 0 && !discoverError && (
                          <div className="py-1">
                            <button
                              onClick={() => { setModel(currentOption.defaultModel); setModelDropdownOpen(false) }}
                              className={`w-full text-left px-3 py-2 text-sm font-serif hover:bg-ochre-bg/20 transition-all duration-200 ${model === currentOption.defaultModel ? 'bg-ochre-bg text-ochre' : 'text-ink'}`}
                            >
                              <div className="font-medium">{currentOption.defaultModel}</div>
                              <div className="text-xs text-ink-muted">默认推荐</div>
                            </button>
                          </div>
                        )}
                        <div className="border-t border-border/50 py-1">
                          <button onClick={() => { setModel(''); setModelDropdownOpen(false) }} className="w-full text-left px-3 py-2 text-sm text-ink-muted hover:bg-paper-dark transition-colors">
                            手动输入模型名号...
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {model === '' && (
                    <input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="输入模型名称，如 gpt-4o" className="input-field" />
                  )}

                  {discoverError && <p className="text-xs text-cinnabar">{discoverError}</p>}
                  {!discoverError && availableModels.length > 0 && (
                    <p className="text-xs text-ink-muted">已发现 {availableModels.length} 个可用模型</p>
                  )}
                </div>

                {/* ink-divider */}
                <div className="ink-divider" />

                {/* Base URL */}
                <div className="space-y-2">
                  <label className="font-serif text-sm font-medium text-ink flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-ochre" />
                    Base URL
                  </label>
                  <ValidatedInput
                    type="text"
                    value={baseUrl}
                    onChange={(v) => setBaseUrl(v)}
                    placeholder={currentOption.defaultBaseUrl || 'https://api.example.com'}
                    validators={[{ validate: (v) => v.startsWith('http') ? '' : 'URL 必须以 http 或 https 开头' }]}
                  />
                  {provider === 'ollama' && <p className="text-xs text-ink-muted">Ollama 默认运行在 http://localhost:11434</p>}
                  {provider === 'openai' && <p className="text-xs text-ink-muted">OpenAI 默认地址 https://api.openai.com/v1</p>}
                  {provider === 'deepseek' && <p className="text-xs text-ink-muted">DeepSeek 默认地址 https://api.deepseek.com</p>}
                  {provider === 'grok' && <p className="text-xs text-ink-muted">Grok 默认地址 https://api.x.ai/v1</p>}
                  {provider === 'cherry' && <p className="text-xs text-ink-muted">Cherry 默认地址 http://localhost:23333/v1</p>}
                </div>

                {/* API Key */}
                {currentOption.needsApiKey && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-serif text-sm font-medium text-ink flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-ochre" />
                        密钥
                      </label>
                      <button type="button" onClick={() => setShowSecurityTip(!showSecurityTip)} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ochre transition-colors">
                        <HelpCircle className="w-3.5 h-3.5" />
                        安全须知
                      </button>
                    </div>

                    {showSecurityTip && (
                      <div className="mb-3 p-3 liquid-glass text-xs font-serif text-amber-800 border-amber-200">
                        <div className="font-medium mb-1.5">安全提醒</div>
                        <ul className="space-y-1">
                          <li>仅存于本地浏览器，临时保管</li>
                          <li>以简易加密之法护之</li>
                          <li>会话既终，自动清除</li>
                          <li>公器之上，勿选"记住我"</li>
                        </ul>
                      </div>
                    )}

                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => handleApiKeyChange(e.target.value)}
                        placeholder="sk-..."
                        className="input-field pr-16"
                      />
                      {apiKey && apiKey.length > 0 && (
                        <CheckCircle className="absolute right-12 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      )}
                      <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute inset-y-0 right-6 flex items-center text-ink-muted hover:text-ochre transition-colors" aria-label={showApiKey ? '隐藏密钥' : '显示密钥'}>
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {apiKey && (
                        <button type="button" onClick={clearStoredKey} className="absolute inset-y-0 right-0 flex items-center text-cinnabar/60 hover:text-cinnabar transition-colors" aria-label="清除密钥">
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center text-xs font-serif text-ink-muted">
                        <input type="checkbox" checked={rememberMe} onChange={(e) => handleRememberMeChange(e.target.checked)} className="mr-2 h-3 w-3 text-ochre border-border rounded focus:ring-ochre" />
                        记住我（七日）
                      </label>
                      {SecureApiKeyManager.hasValidKey(provider as string) && <span className="text-xs text-green-600">已存</span>}
                    </div>
                  </div>
                )}

                {/* Test Result */}
                {testStatus !== 'idle' && (
                  <div className={`p-3 rounded-2xl text-sm flex items-center gap-2 ${
                    testStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-100' :
                    testStatus === 'error' ? 'bg-cinnabar-bg text-cinnabar border border-cinnabar/20' :
                    'bg-paper text-ink-muted border border-border/50'
                  }`}>
                    {testStatus === 'testing' ? <div className="w-4 h-4 border-2 border-ink-muted border-t-transparent rounded-full animate-spin" /> :
                     testStatus === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {testStatus === 'testing' ? '试探中...' : testMessage}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 ink-divider">
                <button onClick={handleTest} disabled={testStatus === 'testing'} className="px-4 py-2.5 text-sm font-medium font-serif text-ochre bg-white border border-border rounded-full hover:bg-ochre-bg hover:border-ochre transition-all duration-300 disabled:opacity-50 flex items-center gap-2">
                  {testStatus === 'testing' ? <div className="w-4 h-4 border-2 border-ochre border-t-transparent rounded-full animate-spin" /> : <Server className="w-4 h-4" />}
                  试探连接
                </button>
                <div className="flex items-center gap-2">
                  {saveStatus === 'success' && (
                    <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" />已存</span>
                  )}
                  <button onClick={handleSaveAI} disabled={saving || !model.trim()} className="btn-primary disabled:opacity-50">
                    {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    保存配置
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account Settings */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="liquid-glass p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-ochre-bg rounded-2xl flex items-center justify-center">
                  <User className="w-5 h-5 text-ochre" />
                </div>
                <div>
                  <h2 className="font-serif font-semibold text-ink text-lg">号簿信息</h2>
                  <p className="font-serif text-sm text-ink-muted">查看与管理号簿信息</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 liquid-glass">
                  <div className="w-12 h-12 rounded-full bg-ochre flex items-center justify-center text-white text-lg font-bold font-display">
                    {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink font-serif">{user?.displayName || user?.username}</p>
                    <p className="text-xs text-ink-muted font-serif">{user?.isGuest ? '过客' : '已入席'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-serif text-sm font-medium text-ink">名讳</label>
                    <input type="text" value={user?.username || ''} disabled className="input-field !text-ink-muted cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-serif text-sm font-medium text-ink">雅号</label>
                    <input type="text" value={user?.displayName || ''} disabled className="input-field !text-ink-muted cursor-not-allowed" />
                  </div>
                </div>
              </div>
            </div>

            {/* ink-divider */}
            <div className="ink-divider" />

            <div className="liquid-glass p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-ochre-bg rounded-2xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-ochre" />
                </div>
                <div>
                  <h2 className="font-serif font-semibold text-ink text-lg">数据安妥</h2>
                  <p className="font-serif text-sm text-ink-muted">数据存于本地浏览器</p>
                </div>
              </div>
              <div className="p-4 liquid-glass border-amber-200">
                <p className="text-sm font-serif text-amber-800">
                  <Shield className="w-4 h-4 inline mr-1" />
                  所有数据（含密钥）仅存于本地浏览器，绝不外传。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Appearance Settings */}
        {activeTab === 'appearance' && (
          <div className="liquid-glass p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-ochre-bg rounded-2xl flex items-center justify-center">
                <Moon className="w-5 h-5 text-ochre" />
              </div>
              <div>
                <h2 className="font-serif font-semibold text-ink text-lg">外观设置</h2>
                <p className="font-serif text-sm text-ink-muted">选择心仪之界面风格</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'light' as const, label: '素笺', icon: Monitor },
                { id: 'dark' as const, label: '墨笺', icon: Moon },
                { id: 'system' as const, label: '顺应天时', icon: Monitor },
              ].map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.id}
                    onClick={() => setTheme(option.id)}
                    className={`liquid-glass flex flex-col items-center gap-3 p-6 text-sm font-serif font-medium transition-all duration-300 ${
                      theme === option.id
                        ? 'border-ochre/40 bg-ochre-bg/30 text-ochre golden-glow'
                        : 'text-ink-secondary hover:border-ochre/20'
                    }`}
                  >
                    <Icon className="w-8 h-8" />
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="liquid-glass p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-ochre-bg rounded-2xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-ochre" />
              </div>
              <div>
                <h2 className="font-serif font-semibold text-ink text-lg">传讯偏好</h2>
                <p className="font-serif text-sm text-ink-muted">管理传讯设置</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { id: 'email' as const, label: '鸿雁传书', desc: '接收重要更新之邮件' },
                { id: 'push' as const, label: '即时传讯', desc: '于浏览器中接收推送' },
                { id: 'deadline' as const, label: '期限提醒', desc: '于筹谋期限前接收提醒' },
                { id: 'daily' as const, label: '日课摘要', desc: '每日接收写作进度摘要' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 liquid-glass">
                  <div>
                    <p className="text-sm font-serif font-medium text-ink">{item.label}</p>
                    <p className="text-xs font-serif text-ink-muted">{item.desc}</p>
                  </div>
                  {/* Traditional-style toggle: round with ochre when active */}
                  <button
                    onClick={() => setNotifications((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                      notifications[item.id]
                        ? 'bg-ochre shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]'
                        : 'bg-border shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm transition-all duration-300 ${
                      notifications[item.id] ? 'translate-x-5 bg-white' : 'translate-x-0 bg-white/90'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
