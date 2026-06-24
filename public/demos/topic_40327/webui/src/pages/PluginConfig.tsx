import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  RefreshCw,
  Save,
  ArrowLeft,
  Code2,
  Layout,
  Copy,
  CheckCircle2,
  AlertTriangle,
  X,
  Package,
  Power,
  RotateCcw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Info,
} from 'lucide-react'
import {
  fetchPlugins,
  fetchPluginConfig,
  savePluginConfig,
  fetchPluginSchema,
  togglePlugin,
  fetchLTPXIcons,
} from '../lib/api'
import type { PluginInfo } from '../types/api'

// ── 类型定义 ──

interface FieldDef {
  name: string
  type: string
  description?: string
  default?: unknown
  required?: boolean
  placeholder?: string
}

interface SectionDef {
  name: string
  label: string
  description?: string
  fields: FieldDef[]
}

interface PluginSchema {
  plugin_id: string
  sections: Record<string, SectionDef>
  _note?: string
}

// ── 工具函数 ──

function getNested(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.').filter(Boolean)
  let current: unknown = obj
  for (const part of parts) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function setNested(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const parts = path.split('.').filter(Boolean)
  if (parts.length === 0) return obj
  const next = { ...obj }
  let target = next
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    const existing = target[part]
    const child = (existing && typeof existing === 'object' && !Array.isArray(existing))
      ? { ...(existing as Record<string, unknown>) }
      : {}
    target[part] = child
    target = child
  }
  target[parts[parts.length - 1]] = value
  return next
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

// ── 布尔值开关（对齐主配置 BotConfig.tsx 样式） ──

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out"
      style={{ backgroundColor: checked ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out"
        style={{ transform: checked ? 'translateX(1.5rem)' : 'translateX(0.125rem)' }}
      />
    </button>
  )
}

// ── 字段渲染器 ──

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: unknown
  onChange: (value: unknown) => void
}) {
  const strValue = value !== undefined && value !== null ? String(value) : ''

  const renderField = () => {
    switch (field.type) {
      case 'boolean':
      case 'switch':
        return (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-foreground">{field.name}</span>
              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {value === true ? '已启用' : '已禁用'}
              </span>
              <ToggleSwitch checked={value === true} onChange={onChange} />
            </div>
          </div>
        )

      case 'number':
      case 'integer':
      case 'float':
        return (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{field.name}</label>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            <input
              type="number"
              value={value !== undefined && value !== null ? Number(value) : ''}
              onChange={(e) => {
                const v = e.target.value
                onChange(v === '' ? undefined : Number(v))
              }}
              className="input w-full"
              placeholder={field.placeholder || (field.default !== undefined ? String(field.default) : '')}
            />
          </div>
        )

      case 'select':
        return (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{field.name}</label>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            <select
              value={strValue}
              onChange={(e) => onChange(e.target.value)}
              className="input w-full"
            >
              <option value="">-- 请选择 --</option>
              {(field as unknown as { enumValues?: string[] }).enumValues?.map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )

      case 'textarea':
        return (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{field.name}</label>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            <textarea
              value={strValue}
              onChange={(e) => onChange(e.target.value)}
              className="input w-full min-h-[80px] font-mono text-sm resize-y"
              placeholder={field.placeholder || ''}
            />
          </div>
        )

      case 'object':
        return (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{field.name}</label>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            <NestedKeyValueEditor
              value={value as Record<string, unknown>}
              onChange={onChange}
            />
          </div>
        )

      case 'array':
      case 'list':
        return (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{field.name}</label>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            <ListEditor
              value={value as unknown[]}
              onChange={onChange}
            />
          </div>
        )

      case 'string':
      default:
        return (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{field.name}</label>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            <input
              type="text"
              value={strValue}
              onChange={(e) => onChange(e.target.value)}
              className="input w-full"
              placeholder={field.placeholder || (field.default !== undefined ? String(field.default) : '')}
            />
          </div>
        )
    }
  }

  return (
    <div className={field.required ? 'border-l-2 border-pink pl-3' : ''}>
      {renderField()}
    </div>
  )
}

// ── 嵌套 Key-Value 编辑器（每组值是一个嵌套对象，展开显示子字段） ──

function NestedKeyValueEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown> | undefined
  onChange: (value: Record<string, unknown>) => void
}) {
  const entries = value ? Object.entries(value) : []

  const updateEntry = (index: number, newKey: string, newVal: unknown) => {
    const newObj: Record<string, unknown> = {}
    entries.forEach(([k, v], i) => {
      if (i === index) {
        if (newKey) newObj[newKey] = newVal
      } else {
        newObj[k] = v
      }
    })
    onChange(newObj)
  }

  const addEntry = () => {
    onChange({ ...(value || {}), '': { ip: '', port: 25565, name: '' } })
  }

  const removeEntry = (index: number) => {
    const newObj: Record<string, unknown> = {}
    entries.forEach(([k, v], i) => {
      if (i !== index) newObj[k] = v
    })
    onChange(newObj)
  }

  const updateNestedField = (entryIndex: number, fieldName: string, fieldValue: unknown) => {
    const [k, v] = entries[entryIndex]
    const nested = (v && typeof v === 'object' && !Array.isArray(v)) ? { ...(v as Record<string, unknown>) } : {}
    nested[fieldName] = fieldValue
    updateEntry(entryIndex, k, nested)
  }

  return (
    <div className="space-y-3">
      {entries.map(([k, v], i) => {
        const nested = (v && typeof v === 'object' && !Array.isArray(v)) ? (v as Record<string, unknown>) : {}
        return (
          <div key={i} className="rounded-lg border border-border/60 bg-card/30 p-3 space-y-2">
            {/* 行头：键名 + 删除按钮 */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={k}
                onChange={(e) => updateEntry(i, e.target.value, v)}
                className="input flex-1 text-sm font-mono font-bold"
                placeholder="平台:群ID（如 qq:123456789）"
              />
              <button
                onClick={() => removeEntry(i)}
                className="p-1.5 rounded-lg hover:bg-pink/10 text-muted-foreground hover:text-pink transition-colors flex-shrink-0"
                title="删除此映射"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {/* 子字段：ip / port / name */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground font-mono mb-0.5 block">ip</label>
                <input
                  type="text"
                  value={typeof nested.ip === 'string' ? nested.ip : ''}
                  onChange={(e) => updateNestedField(i, 'ip', e.target.value)}
                  className="input w-full text-xs py-1.5"
                  placeholder="服务器地址"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-mono mb-0.5 block">port</label>
                <input
                  type="number"
                  value={typeof nested.port === 'number' ? nested.port : (nested.port ? Number(nested.port) : '')}
                  onChange={(e) => updateNestedField(i, 'port', e.target.value ? Number(e.target.value) : undefined)}
                  className="input w-full text-xs py-1.5"
                  placeholder="25565"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-mono mb-0.5 block">name</label>
                <input
                  type="text"
                  value={typeof nested.name === 'string' ? nested.name : ''}
                  onChange={(e) => updateNestedField(i, 'name', e.target.value)}
                  className="input w-full text-xs py-1.5"
                  placeholder="服务器名称"
                />
              </div>
            </div>
          </div>
        )
      })}
      <button
        onClick={addEntry}
        className="btn btn-outline text-xs w-full"
      >
        <Plus className="h-3.5 w-3.5" />
        添加服务器映射
      </button>
    </div>
  )
}

// ── 列表编辑器 ──

function ListEditor({
  value,
  onChange,
}: {
  value: unknown[] | undefined
  onChange: (value: unknown[]) => void
}) {
  const items = value || []

  const addItem = () => onChange([...items, ''])
  const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const updateItem = (i: number, v: string) => {
    const next = [...items]
    next[i] = v
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={typeof item === 'string' ? item : String(item || '')}
            onChange={(e) => updateItem(i, e.target.value)}
            className="input flex-1 text-xs"
            placeholder={`项目 ${i + 1}`}
          />
          <button
            onClick={() => removeItem(i)}
            className="p-2 rounded-lg hover:bg-pink/10 text-muted-foreground hover:text-pink transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button onClick={addItem} className="btn btn-outline text-xs w-full">
        <Plus className="h-3.5 w-3.5" /> 添加项目
      </button>
    </div>
  )
}

// ── Section 渲染器（Collapsible Card，对齐 MaiBot 设计） ──

function SectionRenderer({
  sectionName,
  section,
  config,
  onChange,
}: {
  sectionName: string
  section: SectionDef
  config: Record<string, unknown>
  onChange: (sectionName: string, fieldName: string, value: unknown) => void
}) {
  const [isOpen, setIsOpen] = useState(true)
  const fields = section.fields || []

  // 获取该 section 对应的配置对象
  // 优先嵌套路径 (如 config.plugin)，若为空则回退到顶层 config（兼容扁平结构）
  const nestedConfig = getNested(config, sectionName) as Record<string, unknown> | undefined
  const sectionConfig = (nestedConfig && Object.keys(nestedConfig).length > 0) ? nestedConfig : config

  return (
    <div className="card rounded-xl border bg-card/50 overflow-hidden">
      {/* Section 头部 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <div>
            <h4 className="text-sm font-bold text-foreground">{section.label || section.name}</h4>
            {section.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          {fields.length} 项
        </span>
      </button>

      {/* Section 内容 */}
      {isOpen && (
        <div className="px-5 pb-5 space-y-4">
          {fields.map((field) => {
            const value = sectionConfig[field.name]
            return (
              <FieldRenderer
                key={field.name}
                field={field}
                value={value}
                onChange={(v) => onChange(sectionName, field.name, v)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── 可视化编辑器（Schema 驱动） ──

function SchemaEditor({
  schema,
  config,
  onChange,
  onToggleEnabled,
}: {
  schema: PluginSchema
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
  onToggleEnabled?: (wantsEnabled: boolean) => void
}) {
  const sections = schema.sections || {}
  const sectionKeys = Object.keys(sections)

  const handleFieldChange = (sectionName: string, fieldName: string, value: unknown) => {
    if (fieldName === 'enabled' && onToggleEnabled) {
      onToggleEnabled(value === true)
      return // 不更新本地 config，由 onToggleEnabled 处理
    }
    // sectionName 对应配置中的嵌套路径，如 "plugin" → config.plugin.enabled
    const fullPath = sectionName ? `${sectionName}.${fieldName}` : fieldName
    let updated = setNested(config, fullPath, value)
    // 清理旧扁平字段：如果字段原本在顶层且现在写入了嵌套路径，删除顶层冗余
    if (sectionName && sectionName !== '_plugin_settings' && fieldName in config) {
      const cleaned = { ...updated }
      delete cleaned[fieldName]
      updated = cleaned
    }
    onChange(updated)
  }

  if (sectionKeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Info className="h-8 w-8 mb-2" />
        <p className="text-sm">此插件没有可视化配置项</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sectionKeys.map((sectionKey) => {
        const section = sections[sectionKey]
        if (!section) return null
        return (
          <SectionRenderer
            key={sectionKey}
            sectionName={sectionKey}
            section={section}
            config={config}
            onChange={handleFieldChange}
          />
        )
      })}
    </div>
  )
}

// ── 主页面组件 ──

export default function PluginConfigPage() {
  const { id: pluginId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [plugin, setPlugin] = useState<PluginInfo | null>(null)
  const [schema, setSchema] = useState<PluginSchema | null>(null)
  const [config, setConfig] = useState<Record<string, unknown>>({})
  const [originalConfig, setOriginalConfig] = useState<Record<string, unknown>>({})
  const [rawContent, setRawContent] = useState('')
  const [originalRaw, setOriginalRaw] = useState('')
  const [editMode, setEditMode] = useState<'visual' | 'source'>('visual')
  const [loading, setLoading] = useState(true)
  const [configSaving, setConfigSaving] = useState(false)
  const [configLoading, setConfigLoading] = useState(true)
  const [defaultIcons, setDefaultIcons] = useState<string[]>([])
  const [copySuccess, setCopySuccess] = useState(false)

  if (!pluginId) return null

  const dirty = JSON.stringify(config) !== JSON.stringify(originalConfig) || rawContent !== originalRaw

  // 加载默认图标
  useEffect(() => {
    fetchLTPXIcons().then((res) => setDefaultIcons(res.icons)).catch(() => {})
  }, [])

  // 加载插件信息和配置
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setConfigLoading(true)
      try {
        const [pluginsRes, schemaRes, configRes] = await Promise.all([
          fetchPlugins(),
          fetchPluginSchema(pluginId),
          fetchPluginConfig(pluginId),
        ])
        const found = pluginsRes.plugins.find((p) => p.id === pluginId)
        if (found) setPlugin(found)
        if (schemaRes?.schema) setSchema(schemaRes.schema)
        if (configRes) {
          const parsed = configRes.config?.parsed || {}
          setConfig(parsed)
          setOriginalConfig(JSON.parse(JSON.stringify(parsed)))
          setRawContent(configRes.config?.raw || '')
          setOriginalRaw(configRes.config?.raw || '')
        }
      } catch (err) {
        console.error('加载插件配置失败:', err)
      } finally {
        setLoading(false)
        setConfigLoading(false)
      }
    }
    load()
  }, [pluginId])

  // 图标
  const pluginIconUrl = plugin?.icon || ''
  const [pluginIconFailed, setPluginIconFailed] = useState(false)

  const fallbackIconUrl = defaultIcons.length > 0
    ? `/api/icon/ltpx/${defaultIcons[Math.abs(hashCode(pluginId)) % defaultIcons.length]}`
    : ''

  const showPluginIcon = pluginIconUrl && !pluginIconFailed
  const iconSrc = showPluginIcon ? pluginIconUrl : fallbackIconUrl

  // 保存配置
  const handleSave = async () => {
    setConfigSaving(true)
    try {
      if (editMode === 'source') {
        await savePluginConfig(pluginId, { raw: rawContent })
        setOriginalRaw(rawContent)
      } else {
        await savePluginConfig(pluginId, { parsed: config })
        setOriginalConfig(JSON.parse(JSON.stringify(config)))
      }
    } catch (err) {
      console.error('保存失败:', err)
    } finally {
      setConfigSaving(false)
    }
  }

  // 切换启用/禁用
  const handleToggle = async () => {
    try {
      const res = await togglePlugin(pluginId)
      if (res?.success) {
        // 刷新插件信息
        const pluginsRes = await fetchPlugins()
        const found = pluginsRes.plugins.find((p) => p.id === pluginId)
        if (found) setPlugin(found)
        // 同步配置中的 enabled 字段
        const newEnabled = res.enabled === true
        const updateConfigEnabled = (prev: Record<string, unknown>) => {
          const next = { ...prev }
          // 确保嵌套路径存在
          if (!next.plugin || typeof next.plugin !== 'object' || Array.isArray(next.plugin)) {
            next.plugin = {}
          }
          (next.plugin as Record<string, unknown>).enabled = newEnabled
          // 清理旧的顶层 enabled 冗余字段
          delete next.enabled
          return next
        }
        setConfig(updateConfigEnabled)
        setOriginalConfig(updateConfigEnabled)
      }
    } catch (err) {
      console.error('切换失败:', err)
    }
  }

  // SchemaEditor 中 enabled 开关变更时触发实际的 toggle
  const handleToggleEnabled = async (wantsEnabled: boolean) => {
    const isCurrentlyEnabled = plugin?.status === 'loaded'
    if (isCurrentlyEnabled === wantsEnabled) return
    await handleToggle()
  }

  // 复制原始内容
  const handleCopy = () => {
    navigator.clipboard.writeText(rawContent)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  // 重置到原始内容
  const handleReset = () => {
    if (editMode === 'source') {
      setRawContent(originalRaw)
    } else {
      setConfig(JSON.parse(JSON.stringify(originalConfig)))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── 头部 ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/plugins')}
            className="btn btn-ghost p-2"
            title="返回插件列表"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          {/* 图标 */}
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-blue/20">
            {iconSrc ? (
              <img
                src={iconSrc}
                alt={plugin?.name || pluginId}
                className="h-full w-full object-contain"
                onError={showPluginIcon ? () => setPluginIconFailed(true) : undefined}
              />
            ) : (
              <div className="h-full w-full rounded-2xl flex items-center justify-center card-glow-pink">
                <Package className="h-6 w-6 text-pink" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {plugin?.name || pluginId}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                plugin?.status === 'loaded' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground'
              }`}>
                {plugin?.status === 'loaded' ? '已启用' : '已禁用'}
              </span>
              {plugin?.version && (
                <span className="text-sm text-muted-foreground">v{plugin.version}</span>
              )}
            </div>
          </div>
        </div>
        {/* 操作按钮 */}
        <div className="flex gap-2 ml-10 sm:ml-0">
          <button
            onClick={() => setEditMode(editMode === 'visual' ? 'source' : 'visual')}
            className="btn btn-outline text-sm"
          >
            {editMode === 'visual' ? (
              <><Code2 className="h-4 w-4" /> 源代码</>
            ) : (
              <><Layout className="h-4 w-4" /> 可视化</>
            )}
          </button>
          <button
            onClick={handleReset}
            disabled={!dirty}
            className="btn btn-outline text-sm"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={handleToggle}
            className="btn btn-outline text-sm"
          >
            <Power className="h-4 w-4" />
            {plugin?.status === 'loaded' ? '禁用' : '启用'}
          </button>
          <button
            onClick={handleSave}
            disabled={configSaving || !dirty}
            className={`btn text-sm ${dirty ? 'btn-accent' : 'btn-outline'}`}
          >
            <Save className="h-4 w-4" />
            {configSaving ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>

      {/* ── 未保存提示 ── */}
      {dirty && (
        <div className="card rounded-xl border border-orange-200 bg-orange-50/50 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <p className="text-sm text-orange-800">有未保存的更改，请点击"保存配置"</p>
          </div>
        </div>
      )}

      {/* ── 源代码模式 ── */}
      {editMode === 'source' && (
        <div className="space-y-3">
          <div className="card rounded-xl border border-blue/20 bg-blue-50/30 p-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue" />
              <p className="text-sm text-blue-800">
                <strong>源代码模式：</strong>直接编辑配置文件内容，保存时会验证格式。
              </p>
            </div>
          </div>
          <div className="relative">
            <textarea
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              className="input w-full font-mono text-sm resize-y"
              style={{ minHeight: '400px', height: 'calc(100vh - 350px)' }}
              placeholder="配置文件内容"
            />
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 btn btn-outline text-xs"
              title="复制内容"
            >
              {copySuccess ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* ── 可视化模式 ── */}
      {editMode === 'visual' && (
        configLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : schema ? (
          <SchemaEditor schema={schema} config={config} onChange={setConfig} onToggleEnabled={handleToggleEnabled} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Info className="h-8 w-8 mb-2" />
            <p className="text-sm">无法加载配置架构</p>
          </div>
        )
      )}
    </div>
  )
}