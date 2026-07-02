'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { AIProvider, AIProviderConfig } from '../../../../lib/editor-types'
import { getAIConfig, saveAIConfig } from '../../../../lib/editor-api'
import { X, Save, Server, Key, Globe, Bot, AlertCircle, CheckCircle } from 'lucide-react'

interface AISettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const PROVIDER_OPTIONS: { value: AIProvider; label: string; icon: typeof Bot; defaultModel: string; needsApiKey: boolean; defaultBaseUrl?: string }[] = [
  { value: 'ollama', label: 'Ollama（本地）', icon: Server, defaultModel: 'llama3.2', needsApiKey: false, defaultBaseUrl: 'http://localhost:11434' },
  { value: 'deepseek', label: 'DeepSeek', icon: Bot, defaultModel: 'deepseek-chat', needsApiKey: true, defaultBaseUrl: 'https://api.deepseek.com' },
  { value: 'openai', label: 'OpenAI', icon: Bot, defaultModel: 'gpt-4o-mini', needsApiKey: true, defaultBaseUrl: 'https://api.openai.com/v1' },
  { value: 'custom', label: '自定义', icon: Globe, defaultModel: '', needsApiKey: true },
]

export default function AISettingsModal({ isOpen, onClose }: AISettingsModalProps) {
  const stored = getAIConfig()
  const defaultProvider = PROVIDER_OPTIONS[0]

  const [provider, setProvider] = useState<AIProvider>(stored?.provider || defaultProvider.value)
  const [apiKey, setApiKey] = useState(stored?.apiKey || '')
  const [baseUrl, setBaseUrl] = useState(stored?.baseUrl || defaultProvider.defaultBaseUrl || '')
  const [model, setModel] = useState(stored?.model || defaultProvider.defaultModel)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveRef = useRef<Element | null>(null)

  // Update defaults when provider changes
  useEffect(() => {
    const option = PROVIDER_OPTIONS.find((p) => p.value === provider)
    if (option) {
      if (!stored || stored.provider !== provider) {
        setBaseUrl(option.defaultBaseUrl || '')
        setModel(option.defaultModel)
        if (option.needsApiKey) {
          setApiKey('')
        } else {
          setApiKey('')
        }
      }
    }
  }, [provider, stored])

  /* ---- Esc key close + focus trap ---- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      previousActiveRef.current = document.activeElement

      setTimeout(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector<HTMLElement>(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
          )
          firstFocusable?.focus()
        }
      }, 50)
    } else {
      document.body.style.overflow = ''
      if (previousActiveRef.current instanceof HTMLElement) {
        previousActiveRef.current.focus()
      }
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const currentOption = PROVIDER_OPTIONS.find((p) => p.value === provider)!

  const handleSave = () => {
    setSaving(true)
    try {
      const config: AIProviderConfig = {
        provider,
        apiKey: apiKey.trim(),
        baseUrl: baseUrl.trim() || undefined,
        model: model.trim(),
      }
      saveAIConfig(config)
      setSaveStatus('success')
      setTimeout(() => {
        setSaveStatus('idle')
        onClose()
      }, 800)
    } catch {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
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
        body = {
          model: model || 'llama3.2',
          prompt: 'Hello',
          stream: false,
        }
      } else if (provider === 'deepseek') {
        url = `${baseUrl || 'https://api.deepseek.com'}/chat/completions`
        headers['Authorization'] = `Bearer ${apiKey}`
        body = {
          model: model || 'deepseek-chat',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5,
        }
      } else if (provider === 'openai') {
        url = `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`
        headers['Authorization'] = `Bearer ${apiKey}`
        body = {
          model: model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5,
        }
      } else {
        // custom
        url = `${baseUrl}/chat/completions`
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
        body = {
          model: model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5,
        }
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setTestStatus('success')
        setTestMessage('连接成功！')
      } else {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        setTestStatus('error')
        setTestMessage(err.error || `HTTP ${res.status}`)
      }
    } catch (e: any) {
      setTestStatus('error')
      setTestMessage(e.message || '连接失败')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="智囊配置"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={modalRef}
        className="bg-paper rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden animate-modal-appear"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-ochre-bg rounded-lg flex items-center justify-center">
              <Server className="w-4 h-4 text-ochre" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink" id="ai-settings-title">智囊配置</h2>
              <p className="text-[11px] text-ink-muted">配置你的智囊提供商和 API Key</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-ochre-bg rounded-lg transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30"
            aria-label="关闭"
            autoFocus
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-ink flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-ochre" aria-hidden="true" />
              智囊提供商
            </label>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="智囊提供商选择">
              {PROVIDER_OPTIONS.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    onClick={() => setProvider(option.value)}
                    role="radio"
                    aria-checked={provider === option.value}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30 ${provider === option.value
                      ? 'border-ochre bg-ochre-bg text-ochre'
                      : 'border-border bg-paper text-ink-secondary hover:border-ink-light hover:bg-paper'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-ink flex items-center gap-1.5" htmlFor="ai-model">
              <Bot className="w-3.5 h-3.5 text-ochre" aria-hidden="true" />
              模型名称
            </label>
            <input
              id="ai-model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={currentOption.defaultModel}
              className="w-full px-3 py-2 text-xs bg-paper border border-border rounded-lg text-ink placeholder:text-ink-light focus:outline-none focus:border-ochre focus:ring-1 focus:ring-ochre/20 transition-all"
            />
            <p className="text-[11px] text-ink-muted">
              默认: {currentOption.defaultModel}
            </p>
          </div>

          {/* Base URL (for Ollama and Custom) */}
          {(provider === 'ollama' || provider === 'custom') && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-ink flex items-center gap-1.5" htmlFor="ai-base-url">
                <Globe className="w-3.5 h-3.5 text-ochre" aria-hidden="true" />
                Base URL
              </label>
              <input
                id="ai-base-url"
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={currentOption.defaultBaseUrl || 'https://api.example.com'}
                className="w-full px-3 py-2 text-xs bg-paper border border-border rounded-lg text-ink placeholder:text-ink-light focus:outline-none focus:border-ochre focus:ring-1 focus:ring-ochre/20 transition-all"
              />
              {provider === 'ollama' && (
                <p className="text-[11px] text-ink-muted">
                  Ollama 默认运行在 http://localhost:11434
                </p>
              )}
            </div>
          )}

          {/* API Key (for providers that need it) */}
          {currentOption.needsApiKey && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-ink flex items-center gap-1.5" htmlFor="ai-api-key">
                <Key className="w-3.5 h-3.5 text-ochre" aria-hidden="true" />
                API Key
              </label>
              <div className="relative">
                <input
                  id="ai-api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 text-xs bg-paper border border-border rounded-lg text-ink placeholder:text-ink-light focus:outline-none focus:border-ochre focus:ring-1 focus:ring-ochre/20 transition-all"
                  aria-describedby="api-key-hint"
                />
              </div>
              <p id="api-key-hint" className="text-[11px] text-ink-muted">
                API Key 仅存储在本地浏览器中，不会上传到服务器。
              </p>
            </div>
          )}

          {/* Test Result */}
          {testStatus !== 'idle' && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 animate-fade-in ${testStatus === 'success'
                ? 'bg-green-50 text-green-700 border border-green-100'
                : testStatus === 'error'
                  ? 'bg-red-50 text-red-600 border border-red-100'
                  : 'bg-paper text-ink-muted border border-border'
                }`}
              role="alert"
              aria-live="polite"
            >
              {testStatus === 'testing' ? (
                <div className="w-3.5 h-3.5 border-2 border-ink-muted border-t-transparent rounded-full animate-spin shrink-0" />
              ) : testStatus === 'success' ? (
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              )}
              {testStatus === 'testing' ? '正在测试连接...' : testMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-paper">
          <button
            onClick={handleTest}
            disabled={testStatus === 'testing' || saving}
            className="px-4 py-2 text-xs font-medium text-ochre bg-paper border border-border rounded-lg hover:bg-ochre-bg hover:border-ochre transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30"
          >
            {testStatus === 'testing' ? (
              <div className="w-3 h-3 border-2 border-ochre border-t-transparent rounded-full animate-spin" />
            ) : (
              <Server className="w-3 h-3" />
            )}
            测试连接
          </button>

          <div className="flex items-center gap-2">
            {saveStatus === 'success' && (
              <span className="text-xs text-green-600 flex items-center gap-1 animate-fade-in" role="status">
                <CheckCircle className="w-3 h-3" />
                配置已存
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle className="w-3 h-3" />
                保存失败
              </span>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-ink-secondary bg-paper border border-border rounded-lg hover:bg-paper-dark transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300/30"
            >
              关闭
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !model.trim()}
              className="px-4 py-2 text-xs font-medium text-white bg-ochre rounded-lg hover:bg-ink transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/40"
            >
              {saving ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
