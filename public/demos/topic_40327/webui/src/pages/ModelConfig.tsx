import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus,
  Save,
  Trash2,
  Zap,
  X,
  Check,
  ChevronsUpDown,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Cpu,
  Search,
  Server,
  SlidersHorizontal,
  Wrench,
  Link2,
  Settings2,
} from 'lucide-react'
import {
  fetchLLMConfig,
  saveLLMConfig,
  testConnection,
  fetchProviderModels,
} from '../lib/api'
import type { LLMConfig, APIProvider, ModelEntry, ModelTaskConfig, TaskConfig } from '../types/api'

// ── 提供商模板（常用模型提供商的预设信息） ──
interface ProviderTemplate {
  id: string
  displayName: string
  name: string
  baseUrl: string
  clientType: string
  help: string
}

const PROVIDER_TEMPLATES: ProviderTemplate[] = [
  { id: 'openai', displayName: 'OpenAI (官方)', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', clientType: 'openai', help: '从 platform.openai.com 获取 API Key，通常以 sk- 开头' },
  { id: 'deepseek', displayName: 'DeepSeek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', clientType: 'openai', help: '从 platform.deepseek.com 获取 API Key' },
  { id: 'siliconflow', displayName: '硅基流动 (SiliconFlow)', name: 'SiliconFlow', baseUrl: 'https://api.siliconflow.cn/v1', clientType: 'openai', help: '从 cloud.siliconflow.cn 获取 API Key' },
  { id: 'zhipu', displayName: '智谱AI (GLM)', name: '智谱AI', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', clientType: 'openai', help: '从 open.bigmodel.cn 获取 API Key' },
  { id: 'moonshot', displayName: '月之暗面 (Kimi)', name: 'Moonshot', baseUrl: 'https://api.moonshot.cn/v1', clientType: 'openai', help: '从 platform.moonshot.cn 获取 API Key' },
  { id: 'qwen', displayName: '通义千问 (DashScope)', name: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', clientType: 'openai', help: '从 dashscope.console.aliyun.com 获取 API Key' },
  { id: 'openrouter', displayName: 'OpenRouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', clientType: 'openai', help: '从 openrouter.ai 获取 API Key，可用多种模型' },
  { id: 'gemini', displayName: 'Google Gemini', name: 'Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', clientType: 'gemini', help: '从 makersuite.google.com 获取 API Key' },
  { id: 'custom', displayName: '自定义', name: '', baseUrl: '', clientType: 'openai', help: '手动填写 API 地址和密钥' },
]

const TASK_TYPES = [
  { key: 'replyer', label: '回复生成', desc: '日常对话回复' },
  { key: 'planner', label: '决策规划', desc: '意图识别和计划' },
  { key: 'tool_use', label: '工具调用', desc: '使用内置工具' },
  { key: 'vlm', label: '视觉识别', desc: '图片理解和表情分析' },
  { key: 'voice', label: '语音处理', desc: 'ASR 语音转文字' },
  { key: 'embedding', label: '向量嵌入', desc: '文本向量化和语义搜索' },
]

const STRATEGIES = [
  { value: 'random', label: '随机选择' },
  { value: 'balance', label: '负载均衡' },
  { value: 'first', label: '优先第一个' },
]

export function ModelConfig() {
  const [config, setConfig] = useState<LLMConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'providers' | 'models' | 'tasks'>('providers')

  // 提供商编辑状态
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<APIProvider | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('custom')
  const [templateOpen, setTemplateOpen] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [testingProviders, setTestingProviders] = useState<Set<string>>(new Set())
  const [testResults, setTestResults] = useState<Map<string, { network_ok: boolean; api_key_valid: boolean; latency_ms: number; error: string }>>(new Map())

  // 模型编辑状态
  const [modelDialogOpen, setModelDialogOpen] = useState(false)
  const [editingModelIndex, setEditingModelIndex] = useState<number | null>(null)
  const [editingModel, setEditingModel] = useState<ModelEntry>({ name: '', model_identifier: '', api_provider: '' })
  const [remoteModels, setRemoteModels] = useState<Array<{ id: string; name: string; owned_by?: string }>>([])
  const [searchingModels, setSearchingModels] = useState(false)

  // 任务模型选择器状态
  const [taskPickerOpen, setTaskPickerOpen] = useState(false)
  const [taskPickerKey, setTaskPickerKey] = useState('')
  const [taskSearchQuery, setTaskSearchQuery] = useState('')
  const templateDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadConfig() }, [])
  useEffect(() => {
    if (!templateOpen) return
    const handler = (e: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(e.target as Node)) {
        setTemplateOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [templateOpen])

  async function loadConfig() {
    try {
      setLoading(true)
      const data = await fetchLLMConfig()
      setConfig(data.config as LLMConfig)
    } catch (err) {
      setMessage('加载配置失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      const result = await saveLLMConfig(config)
      setMessage(result.message || '配置已保存')
    } catch (err) {
      setMessage('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // ── 提供商操作 ──
  function openProviderDialog(provider: APIProvider | null, index: number | null) {
    if (provider) {
      setEditingProvider({ ...provider })
    } else {
      setEditingProvider({ name: '', base_url: '', api_key: '', client_type: 'openai', max_retry: 2, timeout: 30, retry_interval: 10 })
    }
    setEditingIndex(index)
    setEditDialogOpen(true)
    // 检测模板匹配
    const matched = PROVIDER_TEMPLATES.find(t => t.baseUrl === provider?.base_url && t.clientType === provider?.client_type)
    setSelectedTemplate(matched?.id || 'custom')
  }

  function applyTemplate(templateId: string) {
    setSelectedTemplate(templateId)
    setTemplateOpen(false)
    const tpl = PROVIDER_TEMPLATES.find(t => t.id === templateId)
    if (tpl && editingProvider) {
      setEditingProvider({
        ...editingProvider,
        name: tpl.name,
        base_url: tpl.baseUrl,
        client_type: tpl.clientType,
      })
    }
  }

  function handleSaveProvider() {
    if (!editingProvider || !config) return
    if (!editingProvider.name || !editingProvider.base_url || !editingProvider.api_key) {
      setMessage('请填写必要字段：名称、基础URL、API Key')
      return
    }
    const providers = [...config.api_providers]
    const cleaned = { ...editingProvider, max_retry: editingProvider.max_retry || 2, timeout: editingProvider.timeout || 30, retry_interval: editingProvider.retry_interval || 10 }
    if (editingIndex !== null) {
      providers[editingIndex] = cleaned
    } else {
      // 检查重名
      if (providers.some(p => p.name === cleaned.name)) {
        setMessage('提供商名称已存在')
        return
      }
      providers.push(cleaned)
    }
    setConfig({ ...config, api_providers: providers })
    setEditDialogOpen(false)
    setEditingProvider(null)
    setEditingIndex(null)
    setMessage(`提供商 ${cleaned.name} 已添加，记得点击右上角"保存配置"键`)
  }

  function handleDeleteProvider(index: number) {
    if (!config) return
    const providers = config.api_providers.filter((_, i) => i !== index)
    const providerName = config.api_providers[index].name
    // 同时删除引用该提供商的模型
    const models = config.models.filter(m => m.api_provider !== providerName)
    setConfig({ ...config, api_providers: providers, models })
    setMessage(`已删除提供商 ${providerName} 及其关联模型`)
  }

  async function handleTestConnection(providerName: string) {
    const provider = config?.api_providers.find(p => p.name === providerName)
    if (!provider) return
    setTestingProviders(prev => new Set(prev).add(providerName))
    try {
      const result = await testConnection({ name: provider.name, base_url: provider.base_url, api_key: provider.api_key })
      if (result.result) {
        setTestResults(prev => {
          const next = new Map(prev)
          next.set(providerName, result.result!)
          return next
        })
      }
    } catch (err) {
      // 测试结果已在 provider card 中显示
    } finally {
      setTestingProviders(prev => {
        const next = new Set(prev)
        next.delete(providerName)
        return next
      })
    }
  }

  async function handleTestAll() {
    if (!config) return
    const allProviders = config.api_providers
    if (allProviders.length === 0) return
    await Promise.all(allProviders.map(provider => handleTestConnection(provider.name)))
  }

  // ── 模型操作 ──
  function openModelDialog(index: number | null) {
    if (index !== null && config) {
      setEditingModel({ ...config.models[index] })
    } else {
      setEditingModel({ name: '', model_identifier: '', api_provider: config?.api_providers[0]?.name || '', price_in: 0, price_out: 0, force_stream_mode: false })
    }
    setEditingModelIndex(index)
    setModelDialogOpen(true)
    setRemoteModels([])
    // 自动搜索当前提供商的全部模型
    const providerName = index !== null && config ? config.models[index].api_provider : (config?.api_providers[0]?.name || '')
    if (providerName) {
      handleSearchAllModels(providerName)
    }
  }

  async function handleSearchAllModels(providerName: string) {
    if (!providerName) return
    try {
      setSearchingModels(true)
      const data = await fetchProviderModels(providerName)
      setRemoteModels(data.models || [])
    } catch (err) {
      setRemoteModels([])
    } finally {
      setSearchingModels(false)
    }
  }

  function handleModelIdentifierChange(identifier: string) {
    setEditingModel({ ...editingModel, model_identifier: identifier })
  }

  function handleModelProviderChange(providerName: string) {
    setEditingModel({ ...editingModel, api_provider: providerName })
    // 切换到新提供商时重新搜索全部模型
    if (providerName) {
      handleSearchAllModels(providerName)
    }
  }

  function handleSaveModel() {
    if (!config || !editingModel.name || !editingModel.model_identifier || !editingModel.api_provider) {
      setMessage('请填写模型名称、标识符和提供商')
      return
    }
    const models = [...config.models]
    if (editingModelIndex !== null) {
      models[editingModelIndex] = { ...editingModel }
    } else {
      models.push({ ...editingModel })
    }
    setConfig({ ...config, models })
    setModelDialogOpen(false)
    setMessage('模型已添加，记得保存配置')
  }

  function handleDeleteModel(index: number) {
    if (!config) return
    const models = config.models.filter((_, i) => i !== index)
    const modelName = config.models[index].name
    // 同时从任务配置中移除
    const taskConfig = { ...config.model_task_config }
    for (const key of Object.keys(taskConfig)) {
      const tc = taskConfig[key as keyof ModelTaskConfig]
      if (tc && tc.model_list) {
        taskConfig[key as keyof ModelTaskConfig] = {
          ...tc,
          model_list: tc.model_list.filter(m => m !== modelName),
        } as TaskConfig
      }
    }
    setConfig({ ...config, models, model_task_config: taskConfig })
    setMessage(`已删除模型 ${modelName}`)
  }

  // ── 任务分配操作 ──
  function handleTaskModelToggle(taskKey: string, modelName: string) {
    if (!config) return
    const taskConfig = { ...config.model_task_config }
    const tc = { ...taskConfig[taskKey as keyof ModelTaskConfig] }
    if (!tc.model_list) tc.model_list = []
    if (tc.model_list.includes(modelName)) {
      tc.model_list = tc.model_list.filter(m => m !== modelName)
    } else {
      tc.model_list = [...tc.model_list, modelName]
    }
    taskConfig[taskKey as keyof ModelTaskConfig] = tc as TaskConfig
    setConfig({ ...config, model_task_config: taskConfig })
  }

  function handleTaskStrategy(taskKey: string, strategy: string) {
    if (!config) return
    const taskConfig = { ...config.model_task_config }
    taskConfig[taskKey as keyof ModelTaskConfig] = {
      ...taskConfig[taskKey as keyof ModelTaskConfig],
      selection_strategy: strategy,
    } as TaskConfig
    setConfig({ ...config, model_task_config: taskConfig })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="加载中…">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-10 w-10 rounded-full border-2 border-blue-200" />
            <RefreshCw className="absolute inset-0 m-auto h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">正在加载模型配置…</p>
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  const providers = config?.api_providers || []
  const models = config?.models || []
  const taskConfig = config?.model_task_config || {} as ModelTaskConfig

  return (
    <div className="min-h-screen aurora-bg space-y-6 p-6 pb-12">
      {/* ═══════ 页面头部 ═══════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400/20 to-pink-400/20">
                <Settings2 className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gradient">模型配置</h1>
                <p className="text-sm text-muted-foreground">
                  管理 AI 提供商、模型列表和任务分配
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadConfig}
              className="btn btn-outline"
            >
              <RefreshCw className="h-4 w-4" />
              刷新
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-accent"
            >
              <Save className="h-4 w-4" />
              {saving ? '保存中…' : '保存配置'}
            </button>
          </div>
        </div>
        {/* 装饰线 */}
        <div className="h-1 rounded-full bg-gradient-to-r from-blue-400 via-primary to-accent" />
      </div>

      {/* ═══════ 消息提示 ═══════ */}
      {message && (
        <div
          className="flex items-center justify-between card rounded-xl px-4 py-3 text-sm"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span>{message}</span>
          </div>
          <button
            onClick={() => setMessage('')}
            className="rounded-full p-1 hover:bg-muted transition-colors"
            aria-label="关闭提示"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ═══════ Pill 标签页导航 ═══════ */}
      <div className="flex gap-1.5 rounded-full bg-white/80 border border-blue-100 p-1.5 w-fit card shadow-sm">
        {[
          {
            key: 'providers' as const,
            label: 'AI 提供商',
            icon: Server,
            count: providers.length,
            isAccent: false
          },
          {
            key: 'models' as const,
            label: '模型管理',
            icon: Cpu,
            count: models.length,
            isAccent: true
          },
          {
            key: 'tasks' as const,
            label: '任务分配',
            icon: SlidersHorizontal,
            isAccent: false
          },
        ].map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`group relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 shadow-sm ${
                isActive
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full px-1 text-[0.65rem] font-semibold leading-none ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-muted'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ═══════ 提供商 Tab ═══════ */}
      {activeTab === 'providers' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              配置 AI 厂商的 API 连接信息，支持 OpenAI 兼容和 Gemini 格式
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleTestAll}
                disabled={providers.length === 0 || testingProviders.size > 0}
                className="btn btn-outline"
              >
                <Zap className="h-4 w-4" />
                {testingProviders.size > 0 ? `测试中 (${testingProviders.size})…` : '测试全部'}
              </button>
              <button
                onClick={() => openProviderDialog(null, null)}
                className="btn btn-accent"
              >
                <Plus className="h-4 w-4" />
                添加提供商
              </button>
            </div>
          </div>

          {providers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground card rounded-2xl p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400/10 to-pink-400/10 mb-5">
                <Server size={32} className="text-primary/40" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-foreground/60">暂无 AI 提供商</p>
              <p className="text-xs mt-1.5 text-muted-foreground/70">
                点击上方「添加提供商」开始配置
              </p>
            </div>
          ) : (
            <div className="grid gap-4 stagger">
              {providers.map((provider, idx) => {
                const isAccent = idx % 2 === 1
                return (
                  <div
                    key={idx}
                    className={`group relative card card-hover rounded-2xl p-5 overflow-hidden ${isAccent ? 'card-glow-pink' : 'card-glow-blue'}`}
                  >
                    {/* 左侧装饰条 */}
                    <div className={`absolute left-0 top-0 bottom-0 w-[4px] rounded-full ${isAccent ? 'bg-gradient-to-b from-accent to-primary' : 'bg-gradient-to-b from-primary to-blue-400'}`} />

                    <div className="flex items-start justify-between gap-4 pl-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-semibold text-base text-foreground">{provider.name}</h3>
                          <span className={`badge ${isAccent ? 'badge-pink' : 'badge-blue'}`}>
                            {provider.client_type}
                          </span>
                          {/* 状态指示点 */}
                          {testResults.has(provider.name) && !testingProviders.has(provider.name) && (
                            <span
                              className={`inline-flex h-2 w-2 rounded-full ${
                                testResults.get(provider.name)!.network_ok && testResults.get(provider.name)!.api_key_valid
                                  ? 'bg-emerald-500'
                                  : 'bg-red-500'
                              }`}
                              title={
                                testResults.get(provider.name)!.network_ok && testResults.get(provider.name)!.api_key_valid
                                  ? '连接正常'
                                  : '连接失败'
                              }
                            />
                          )}
                        </div>
                        <p className="mt-1.5 font-mono text-xs text-muted-foreground/80 truncate">
                          {provider.base_url}
                        </p>
                        <div className="mt-2.5 flex gap-4 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                            重试: {provider.max_retry ?? 2}次
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                            超时: {provider.timeout ?? 30}s
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                            间隔: {provider.retry_interval ?? 10}s
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleTestConnection(provider.name)}
                          disabled={testingProviders.has(provider.name)}
                          className="btn btn-outline text-xs"
                        >
                          <Zap
                            className={`h-3.5 w-3.5 ${
                              testingProviders.has(provider.name)
                                ? 'animate-pulse text-yellow-500'
                                : 'text-accent'
                            }`}
                          />
                          {testingProviders.has(provider.name) ? '测试中…' : '测试连接'}
                        </button>
                        <button
                          onClick={() => openProviderDialog(provider, idx)}
                          className="btn btn-outline text-xs"
                        >
                          <Wrench className="h-3.5 w-3.5 text-accent" />
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeleteProvider(idx)}
                          className="btn btn-outline text-xs text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          删除
                        </button>
                      </div>
                    </div>

                    {/* 测试结果内联显示 */}
                    {testResults.has(provider.name) && !testingProviders.has(provider.name) && (() => {
                      const tr = testResults.get(provider.name)!
                      const ok = tr.network_ok && tr.api_key_valid
                      return (
                        <div
                          className={`mt-4 ml-2 rounded-xl px-3 py-2 text-xs font-medium flex items-center gap-2 ${
                            ok
                              ? 'bg-primary/5 text-primary border border-primary/20'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full ${
                              ok ? 'bg-primary/10' : 'bg-red-100'
                            }`}
                          >
                            {ok ? (
                              <Check className="h-3 w-3 text-primary" />
                            ) : (
                              <X className="h-3 w-3 text-red-600" />
                            )}
                          </div>
                          <span>
                            {ok ? `✓ 连接正常 · 延迟 ${tr.latency_ms}ms` : `✗ ${tr.error || '连接失败'}`}
                          </span>
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════ 模型管理 Tab ═══════ */}
      {activeTab === 'models' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              管理可用的 AI 模型，每个模型需关联一个已配置的提供商
            </p>
            <button
              onClick={() => openModelDialog(null)}
              disabled={providers.length === 0}
              className="btn btn-accent"
              title={providers.length === 0 ? '请先添加提供商' : '添加模型'}
            >
              <Plus className="h-4 w-4" />
              添加模型
            </button>
          </div>

          {models.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground card rounded-2xl p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400/10 to-pink-400/10 mb-5">
                <Cpu size={32} className="text-primary/40" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-foreground/60">暂无模型</p>
              <p className="text-xs mt-1.5 text-muted-foreground/70">
                添加模型后可在「任务分配」中配置各任务使用的模型
              </p>
            </div>
          ) : (
            <div className="overflow-hidden card rounded-2xl">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        模型名称
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        模型标识符
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        提供商
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
                    {models.filter(m => m.name && m.model_identifier).map((model, idx) => {
                      const isAccent = idx % 2 === 1
                      return (
                        <tr
                          key={idx}
                          className="group hover:bg-muted/50 transition-colors duration-150"
                        >
                          <td className="px-5 py-3.5 font-semibold text-foreground">
                            {model.name}
                          </td>
                          <td className="px-5 py-3.5">
                            <code className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-mono" style={{ color: 'hsl(var(--primary))' }}>
                              {model.model_identifier}
                            </code>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`badge ${isAccent ? 'badge-pink' : 'badge-blue'}`}>
                              {model.api_provider}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openModelDialog(idx)}
                                className="btn btn-outline text-xs"
                              >
                                <Wrench className="h-3 w-3 text-accent" />
                                编辑
                              </button>
                              <button
                                onClick={() => handleDeleteModel(idx)}
                                className="btn btn-outline text-xs text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ 任务分配 Tab ═══════ */}
      {activeTab === 'tasks' && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            为每种任务类型配置可用的模型池和推理参数。点击模型区域添加模型。
          </p>

          <div className="grid gap-5 stagger">
            {TASK_TYPES.map((task, index) => {
              const isAccent = index % 2 === 1
              const tcRaw = taskConfig[task.key as keyof ModelTaskConfig] as TaskConfig | undefined
              const modelList = tcRaw?.model_list || []
              const strategy = tcRaw?.selection_strategy || 'random'
              const temperature = (tcRaw as Record<string, unknown>)?.temperature as number ?? 0.7
              const maxTokens = (tcRaw as Record<string, unknown>)?.max_tokens as number ?? 1024
              const selectedModels = models.filter(m => m.name && modelList.includes(m.name))
              return (
                <div
                  key={task.key}
                  className={`group relative card card-hover rounded-2xl p-5 overflow-hidden ${isAccent ? 'card-glow-pink' : 'card-glow-blue'}`}
                >
                  {/* 左侧装饰条 */}
                  <div className={`absolute left-0 top-0 bottom-0 w-[4px] rounded-full ${isAccent ? 'bg-gradient-to-b from-accent to-primary' : 'bg-gradient-to-b from-primary to-blue-400'}`} />

                  <div className="mb-5 pl-3">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-semibold text-base text-foreground">{task.label}</h3>
                      <span className="badge badge-blue">
                        {task.key}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{task.desc}</p>
                  </div>

                  {/* 模型池 */}
                  <div className="mb-5 pl-3">
                    <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      模型池
                      {selectedModels.length > 0 && (
                        <span className="ml-1.5 text-[0.65rem] text-muted-foreground/60 normal-case">
                          ({selectedModels.length})
                        </span>
                      )}
                    </label>
                    <div
                      onClick={() => { setTaskPickerKey(task.key); setTaskSearchQuery(''); setTaskPickerOpen(true) }}
                      className={`w-full rounded-xl border-2 border-dashed p-5 min-h-[68px] cursor-pointer transition-all duration-200 group/zone ${
                        isAccent ? 'border-accent/30 hover:bg-accent/5 hover:border-accent' : 'border-primary/30 hover:bg-primary/5 hover:border-primary'
                      }`}
                    >
                      {selectedModels.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedModels.map(m => (
                            <span
                              key={m.name}
                              className={`inline-flex items-center gap-1.5 rounded-full ${isAccent ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-primary/10 border-primary/20 text-primary'} border px-3 py-1.5 text-xs font-medium shadow-sm`}
                            >
                              <Link2 className="h-3 w-3" />
                              {m.name}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleTaskModelToggle(task.key, m.name)
                                }}
                                className="ml-0.5 rounded-full p-0.5 hover:bg-white/30 transition-colors"
                                aria-label={`移除 ${m.name}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground py-1">
                          <Plus className="h-5 w-5 mb-1.5 opacity-30 group-hover/zone:opacity-60 transition-opacity" />
                          <span className="text-xs font-medium opacity-50 group-hover/zone:opacity-80 transition-opacity">
                            点击添加模型
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 推理参数 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pl-3">
                    {/* 温度 */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        温度
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={temperature}
                          onChange={(e) => {
                            const newTc = { model_list: modelList, selection_strategy: strategy, temperature: parseFloat(e.target.value), max_tokens: maxTokens }
                            const newTaskConfig = { ...taskConfig }
                            newTaskConfig[task.key as keyof ModelTaskConfig] = newTc as TaskConfig
                            setConfig(config ? { ...config, model_task_config: newTaskConfig } : null)
                          }}
                          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
                          style={{ backgroundColor: 'hsl(var(--border))' }}
                        />
                        <span className="inline-flex items-center justify-center min-w-[2.5rem] rounded-full bg-muted px-2 py-1 text-xs font-mono font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                          {temperature}
                        </span>
                      </div>
                    </div>

                    {/* 最大 Token */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        最大 Token
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={maxTokens}
                        onChange={(e) => {
                          const newTc = { model_list: modelList, selection_strategy: strategy, temperature, max_tokens: parseInt(e.target.value) || 1024 }
                          const newTaskConfig = { ...taskConfig }
                          newTaskConfig[task.key as keyof ModelTaskConfig] = newTc as TaskConfig
                          setConfig(config ? { ...config, model_task_config: newTaskConfig } : null)
                        }}
                        className="input w-full rounded-full"
                      />
                    </div>

                    {/* 选择策略 */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        选择策略
                      </label>
                      <select
                        value={strategy}
                        onChange={(e) => handleTaskStrategy(task.key, e.target.value)}
                        className="input w-full rounded-full appearance-none bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2360a5fa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                        }}
                      >
                        {STRATEGIES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══════ 任务模型选择器弹窗 ═══════ */}
      {taskPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => { setTaskPickerOpen(false); setTaskSearchQuery('') }}>
          <div className="relative w-full max-w-md card rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto animate-in zoom-in-95 border border-blue-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">选择模型</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {TASK_TYPES.find(t => t.key === taskPickerKey)?.label || taskPickerKey}
                </p>
              </div>
              <button
                onClick={() => { setTaskPickerOpen(false); setTaskSearchQuery('') }}
                className="rounded-full p-2 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 搜索框 */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <input
                value={taskSearchQuery}
                onChange={(e) => setTaskSearchQuery(e.target.value)}
                placeholder="搜索已添加到模型管理的模型…"
                className="input w-full rounded-full pl-10"
                autoFocus
              />
            </div>

            {/* 模型列表 */}
            <div className="space-y-1 max-h-[50vh] overflow-y-auto rounded-xl">
              {models.filter(m => m.name && m.model_identifier)
                .filter(m => !taskSearchQuery || m.name.toLowerCase().includes(taskSearchQuery.toLowerCase()))
                .map(model => {
                  const taskList = (taskConfig[taskPickerKey as keyof ModelTaskConfig] as TaskConfig | undefined)?.model_list || []
                  const isSelected = taskList.includes(model.name)
                  return (
                    <button
                      key={model.name}
                      onClick={() => handleTaskModelToggle(taskPickerKey, model.name)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm transition-all duration-150 ${
                        isSelected
                          ? 'bg-surface border border-primary/20'
                          : 'hover:bg-surface/50 border border-transparent'
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary text-white'
                            : 'border-primary/30'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{model.name}</div>
                        <div className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                          {model.model_identifier}
                        </div>
                      </div>
                      <span className="badge badge-blue">
                        {model.api_provider}
                      </span>
                    </button>
                  )
                })}
              {models.filter(m => m.name && m.model_identifier).length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <Cpu size={28} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">暂无模型</p>
                  <p className="text-xs mt-1 opacity-70">请先在「模型管理」中添加模型</p>
                </div>
              )}
              {models.filter(m => m.name && m.model_identifier).length > 0 &&
                models.filter(m => m.name && m.model_identifier).filter(m => !taskSearchQuery || m.name.toLowerCase().includes(taskSearchQuery.toLowerCase())).length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <Search size={28} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">没有匹配的模型</p>
                  <p className="text-xs mt-1 opacity-70">尝试其他搜索词</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => { setTaskPickerOpen(false); setTaskSearchQuery('') }}
                className="btn btn-accent"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ 提供商编辑弹窗 ═══════ */}
      {editDialogOpen && editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setEditDialogOpen(false)}>
          <div className="relative w-full max-w-lg card rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 border border-blue-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {editingIndex !== null ? '编辑提供商' : '添加提供商'}
                </h2>
                {editingProvider.name && (
                  <p className="text-xs text-muted-foreground mt-0.5">{editingProvider.name}</p>
                )}
              </div>
              <button
                onClick={() => setEditDialogOpen(false)}
                className="rounded-full p-2 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* 模板选择 */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  提供商模板
                  <span className="ml-1 text-xs font-normal text-muted-foreground">（辅助填写）</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setTemplateOpen(!templateOpen)}
                    className="input flex w-full items-center justify-between rounded-full"
                  >
                    <span className={selectedTemplate === 'custom' ? 'text-muted-foreground' : 'text-primary'}>
                      {PROVIDER_TEMPLATES.find(t => t.id === selectedTemplate)?.displayName || '选择模板…'}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 opacity-40" />
                  </button>
                  {templateOpen && (
                    <div ref={templateDropdownRef} className="absolute z-10 mt-1.5 w-full rounded-xl border border-border bg-card shadow-xl max-h-64 overflow-y-auto animate-in slide-in-from-top-2">
                      {PROVIDER_TEMPLATES.map(tpl => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => applyTemplate(tpl.id)}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface ${
                            selectedTemplate === tpl.id
                              ? 'bg-surface'
                              : ''
                          }`}
                        >
                          {selectedTemplate === tpl.id ? (
                            <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                          ) : (
                            <div className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-primary/30" />
                          )}
                          <span className="font-semibold">{tpl.displayName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 名称 */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  提供商名称 <span className="text-red-400">*</span>
                </label>
                <input
                  value={editingProvider.name}
                  onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                  placeholder="例如: DeepSeek, OpenAI"
                  className="input w-full rounded-full placeholder:text-muted-foreground/50"
                />
              </div>

              {/* 基础URL */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  基础 URL <span className="text-red-400">*</span>
                </label>
                <input
                  value={editingProvider.base_url}
                  onChange={(e) => setEditingProvider({ ...editingProvider, base_url: e.target.value })}
                  placeholder="https://api.example.com/v1"
                  disabled={selectedTemplate !== 'custom'}
                  className={`input w-full rounded-full ${
                    selectedTemplate !== 'custom' ? 'opacity-50 cursor-not-allowed border-primary/20' : ''
                  }`}
                />
                {selectedTemplate !== 'custom' && (
                  <p className="mt-1.5 text-xs text-muted-foreground">使用模板时 URL 自动填充</p>
                )}
              </div>

              {/* API Key */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  API Key <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={editingProvider.api_key}
                      onChange={(e) => setEditingProvider({ ...editingProvider, api_key: e.target.value })}
                      placeholder="sk-…"
                      className="input w-full rounded-full pr-10"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="btn btn-outline rounded-full px-3"
                    title={showApiKey ? '隐藏' : '显示'}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4 text-primary" /> : <Eye className="h-4 w-4 text-primary" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(editingProvider.api_key)
                      setMessage('已复制 API Key')
                    }}
                    className="btn btn-outline rounded-full px-3"
                    title="复制"
                  >
                    <Copy className="h-4 w-4 text-primary" />
                  </button>
                </div>
              </div>

              {/* 客户端类型 */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">客户端类型</label>
                <select
                  value={editingProvider.client_type}
                  onChange={(e) => setEditingProvider({ ...editingProvider, client_type: e.target.value })}
                  disabled={selectedTemplate !== 'custom'}
                  className={`input w-full rounded-full ${
                    selectedTemplate !== 'custom' ? 'opacity-50 cursor-not-allowed border-primary/20' : ''
                  }`}
                >
                  <option value="openai">OpenAI (兼容)</option>
                  <option value="gemini">Gemini</option>
                </select>
              </div>

              {/* 高级参数 */}
              <div className="rounded-xl border border-border bg-muted p-4">
                <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  高级参数
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">最大重试</label>
                    <input
                      type="number"
                      min="0"
                      value={editingProvider.max_retry ?? ''}
                      onChange={(e) => setEditingProvider({ ...editingProvider, max_retry: parseInt(e.target.value) || 0 })}
                      className="input w-full rounded-full text-center"
                      placeholder="2"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">超时(秒)</label>
                    <input
                      type="number"
                      min="1"
                      value={editingProvider.timeout ?? ''}
                      onChange={(e) => setEditingProvider({ ...editingProvider, timeout: parseInt(e.target.value) || 30 })}
                      className="input w-full rounded-full text-center"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">重试间隔(秒)</label>
                    <input
                      type="number"
                      min="1"
                      value={editingProvider.retry_interval ?? ''}
                      onChange={(e) => setEditingProvider({ ...editingProvider, retry_interval: parseInt(e.target.value) || 10 })}
                      className="input w-full rounded-full text-center"
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditDialogOpen(false)}
                className="btn btn-outline"
              >
                取消
              </button>
              <button
                onClick={handleSaveProvider}
                className="btn btn-accent"
              >
                保存提供商
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ 模型编辑弹窗 ═══════ */}
      {modelDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => { setModelDialogOpen(false); }}>
          <div className="relative w-full max-w-md card rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 border border-blue-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {editingModelIndex !== null ? '编辑模型' : '添加模型'}
                </h2>
                {editingModel.name && (
                  <p className="text-xs text-muted-foreground mt-0.5">{editingModel.name}</p>
                )}
              </div>
              <button
                onClick={() => { setModelDialogOpen(false); }}
                className="rounded-full p-2 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* 模型名称 */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  模型名称 <span className="text-red-400">*</span>
                </label>
                <input
                  value={editingModel.name}
                  onChange={(e) => setEditingModel({ ...editingModel, name: e.target.value })}
                  placeholder="例如: deepseek-chat"
                  className="input w-full rounded-full placeholder:text-muted-foreground/50"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  用于在任务分配中引用的名称
                </p>
              </div>

              {/* 所属提供商 */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  所属提供商 <span className="text-red-400">*</span>
                </label>
                <select
                  value={editingModel.api_provider}
                  onChange={(e) => handleModelProviderChange(e.target.value)}
                  className="input w-full rounded-full"
                >
                  {providers.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* 模型标识符 */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  模型标识符 <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    value={editingModel.model_identifier}
                    onChange={(e) => handleModelIdentifierChange(e.target.value)}
                    placeholder="例如: deepseek-chat"
                    className="input w-full rounded-full pr-10"
                  />
                  {searchingModels && (
                    <RefreshCw className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  实际传递给 API 的模型 ID，下方列表为当前提供商的可用模型
                </p>

                {/* 远程模型列表 */}
                {remoteModels.length > 0 && (
                  <div className="mt-3 max-h-44 overflow-y-auto rounded-xl border border-border bg-muted p-2 space-y-1">
                    {remoteModels.map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setEditingModel({
                          ...editingModel,
                          name: m.id,
                          model_identifier: m.id,
                        })}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-surface transition-all duration-150"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface">
                          <Cpu className="h-3 w-3" style={{ color: 'hsl(var(--primary))' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <code className="text-xs font-mono font-medium">{m.id}</code>
                          {m.owned_by && (
                            <span className="ml-2 text-xs text-muted-foreground">by {m.owned_by}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 高级参数 */}
              <div className="rounded-xl border border-border bg-muted p-4">
                <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  高级参数（可选）
                </p>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">输入价格</label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={editingModel.price_in ?? ''}
                      onChange={(e) => setEditingModel({ ...editingModel, price_in: parseFloat(e.target.value) || 0 })}
                      className="input w-full rounded-full text-center"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">输出价格</label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={editingModel.price_out ?? ''}
                      onChange={(e) => setEditingModel({ ...editingModel, price_out: parseFloat(e.target.value) || 0 })}
                      className="input w-full rounded-full text-center"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">温度</label>
                    <input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={editingModel.temperature ?? ''}
                      onChange={(e) => setEditingModel({ ...editingModel, temperature: parseFloat(e.target.value) || undefined })}
                      className="input w-full rounded-full text-center"
                      placeholder="默认"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">最大 Token</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={editingModel.max_tokens ?? ''}
                      onChange={(e) => setEditingModel({ ...editingModel, max_tokens: parseInt(e.target.value) || undefined })}
                      className="input w-full rounded-full text-center"
                      placeholder="默认"
                    />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
                  <label className="flex items-center gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingModel.force_stream_mode ?? false}
                      onChange={(e) => setEditingModel({ ...editingModel, force_stream_mode: e.target.checked })}
                      className="rounded border-primary/30 text-primary focus:ring-primary/20"
                    />
                    <span className="font-medium">强制流式模式</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setModelDialogOpen(false); }}
                className="btn btn-outline"
              >
                取消
              </button>
              <button
                onClick={handleSaveModel}
                className="btn btn-accent"
              >
                保存模型
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
