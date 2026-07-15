import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import type { AppSettings, ApiConfig } from '../store/appStore'
import ConfirmDialog from './ConfirmDialog'
import { CHART_STYLE_PRESETS } from '../../../agents/shared/styleGuide'

// === 类型定义 ===
type Section = 'api' | 'skills' | 'style' | 'appearance'
type SkillKey = keyof AppSettings['skills']
type FontSize = AppSettings['fontSize']

interface TestResult {
  ok: boolean
  msg: string
}

// === 预设数据 ===
const ACCENT_COLORS: { name: string; value: string }[] = [
  { name: '橙色', value: '#f97316' },
  { name: '蓝色', value: '#3b82f6' },
  { name: '绿色', value: '#22c55e' },
  { name: '紫色', value: '#a78bfa' },
  { name: '青色', value: '#2dd4bf' }
]

const SKILLS: { key: SkillKey; label: string; desc: string }[] = [
  { key: 'deepResearch', label: '深度研究', desc: '自动检索外部数据与资料，辅助多维度深度调研' },
  { key: 'analysis', label: '数据分析', desc: '执行 Python 代码完成数据清洗、统计与建模' },
  { key: 'plot', label: '可视化', desc: '自动生成图表以直观呈现分析结果' },
  { key: 'report', label: '报告生成', desc: '汇总分析过程与结论，生成结构化报告' },
  { key: 'prediction', label: '预测分析', desc: '基于历史数据构建预测模型，输出未来趋势' },
  { key: 'backtest', label: '回测分析', desc: '对策略进行历史回测，评估表现与稳定性' }
]

const FONT_SIZES: { value: FontSize; label: string }[] = [
  { value: 'small', label: '小' },
  { value: 'medium', label: '中' },
  { value: 'large', label: '大' }
]

// === 内联 SVG 图标 ===
const ApiIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="8" rx="2" />
    <rect x="2" y="12" width="20" height="8" rx="2" />
    <path d="M6 8h.01M6 16h.01" />
  </svg>
)

const SkillsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
)

const AppearanceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="8.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" />
  </svg>
)

const PaletteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 0 0 0 20" />
    <path d="M12 2a10 10 0 0 1 0 20" />
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
    <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
  </svg>
)

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a18.5 18.5 0 015.06-5.94M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 7 11 7a18.5 18.5 0 01-3.17 4.19M1 1l22 22M9.5 9.5a3 3 0 104.24 4.24" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
)

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
)

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
)

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// === 可复用开关组件 ===
interface ToggleProps {
  on: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

function Toggle({ on, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      className="toggle-switch"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
    >
      <span className={`toggle-track ${on ? 'on' : ''}`}>
        <span className="toggle-thumb" />
      </span>
    </button>
  )
}

// === 导航项 ===
interface NavItemProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      className={`settings-nav-item ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      <span className="settings-nav-icon">{icon}</span>
      <span className="settings-nav-label">{label}</span>
    </button>
  )
}

// === API 配置弹窗 ===
interface ApiConfigModalProps {
  editing: ApiConfig | null
  onClose: () => void
}

function ApiConfigModal({ editing, onClose }: ApiConfigModalProps) {
  const { addApiConfig, updateApiConfig } = useAppStore()
  const [name, setName] = useState(editing?.name || '')
  const [model, setModel] = useState(editing?.model || '')
  const [apiKey, setApiKey] = useState(editing?.apiKey || '')
  const [baseUrl, setBaseUrl] = useState(editing?.baseUrl || 'https://api-inference.modelscope.cn/v1')
  const [showKey, setShowKey] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [testing, setTesting] = useState(false)

  const handleSave = () => {
    if (!name.trim() || !apiKey.trim()) return
    if (editing) {
      updateApiConfig(editing.id, { name: name.trim(), model: model.trim(), apiKey: apiKey.trim(), baseUrl: baseUrl.trim() })
    } else {
      addApiConfig({ name: name.trim(), model: model.trim() || name.trim(), apiKey: apiKey.trim(), baseUrl: baseUrl.trim() })
    }
    onClose()
  }

  const handleTest = () => {
    setTesting(true)
    setTestResult(null)
    window.setTimeout(() => {
      if (!apiKey.trim()) {
        setTestResult({ ok: false, msg: '请先填写 API Key' })
      } else if (!baseUrl.trim()) {
        setTestResult({ ok: false, msg: '请填写 Base URL' })
      } else {
        setTestResult({ ok: true, msg: `配置有效，模型「${model || name || '未指定'}」` })
      }
      setTesting(false)
    }, 600)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{editing ? '编辑 API 配置' : '添加 API 配置'}</h3>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body">
          <div className="settings-field">
            <label className="settings-label">显示名称</label>
            <input
              className="settings-input"
              type="text"
              value={name}
              placeholder="如：GLM-5.2"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="settings-field">
            <label className="settings-label">模型标识</label>
            <input
              className="settings-input"
              type="text"
              value={model}
              placeholder="如：ZhipuAI/GLM-5.2"
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
          <div className="settings-field">
            <label className="settings-label">API Key</label>
            <div className="settings-input-row">
              <input
                className="settings-input"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                placeholder="sk-..."
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button
                type="button"
                className="settings-btn icon-btn"
                onClick={() => setShowKey((v) => !v)}
                title={showKey ? '隐藏' : '显示'}
              >
                {showKey ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
          <div className="settings-field">
            <label className="settings-label">Base URL</label>
            <input
              className="settings-input"
              type="text"
              value={baseUrl}
              placeholder="https://api-inference.modelscope.cn/v1"
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>
          {testResult && (
            <span className={`settings-feedback ${testResult.ok ? 'ok' : 'err'}`}>
              {testResult.msg}
            </span>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="settings-btn" onClick={handleTest} disabled={testing}>
            {testing ? '测试中…' : '测试连接'}
          </button>
          <button type="button" className="settings-btn primary" onClick={handleSave} disabled={!name.trim() || !apiKey.trim()}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

// === 主组件 ===
export default function SettingsView() {
  const { settings, updateSettings, addApiConfig, updateApiConfig, deleteApiConfig, setActiveApiConfig } = useAppStore()
  const [section, setSection] = useState<Section>('api')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ApiConfig | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const toggleKeyVisible = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAdd = () => {
    setEditingConfig(null)
    setModalOpen(true)
  }

  const handleEdit = (config: ApiConfig) => {
    setEditingConfig(config)
    setModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setPendingDeleteId(id)
  }

  const confirmDeleteApi = () => {
    if (pendingDeleteId) {
      deleteApiConfig(pendingDeleteId)
    }
    setPendingDeleteId(null)
  }

  const handleSkillToggle = (key: SkillKey, value: boolean) => {
    updateSettings({ skills: { ...settings.skills, [key]: value } })
  }

  return (
    <div className="settings-view">
      {/* === 左侧导航 === */}
      <nav className="settings-nav">
        <NavItem
          icon={<ApiIcon />}
          label="API 配置"
          active={section === 'api'}
          onClick={() => setSection('api')}
        />
        <NavItem
          icon={<SkillsIcon />}
          label="能力配置"
          active={section === 'skills'}
          onClick={() => setSection('skills')}
        />
        <NavItem
          icon={<PaletteIcon />}
          label="图表风格"
          active={section === 'style'}
          onClick={() => setSection('style')}
        />
        <NavItem
          icon={<AppearanceIcon />}
          label="页面风格"
          active={section === 'appearance'}
          onClick={() => setSection('appearance')}
        />
      </nav>

      {/* === 右侧内容 === */}
      <div className="settings-content">
        {section === 'api' && (
          <section className="settings-section">
            <div className="settings-section-header">
              <h2 className="settings-section-title">API 配置</h2>
              <button className="api-add-btn" onClick={handleAdd} title="添加 API 配置">
                <PlusIcon />
              </button>
            </div>

            <div className="api-config-list">
              {settings.apiConfigs.length === 0 ? (
                <div className="api-config-empty">
                  <ApiIcon />
                  <p>暂无 API 配置</p>
                  <p className="api-config-empty-hint">点击右上角 + 添加第一个 API 配置</p>
                </div>
              ) : (
                settings.apiConfigs.map((config) => (
                  <div
                    key={config.id}
                    className={`api-config-item ${config.id === settings.activeApiConfigId ? 'active' : ''}`}
                    onClick={() => setActiveApiConfig(config.id)}
                  >
                    <div className="api-config-info">
                      <div className="api-config-name">{config.name}</div>
                      <div className="api-config-meta">
                        <span className="api-config-model">{config.model}</span>
                        <span className="api-config-key">
                          {visibleKeys.has(config.id)
                            ? config.apiKey
                            : '•'.repeat(Math.min(config.apiKey.length, 16))}
                        </span>
                      </div>
                      <div className="api-config-url">{config.baseUrl}</div>
                    </div>
                    <div className="api-config-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="api-action-btn"
                        onClick={() => toggleKeyVisible(config.id)}
                        title={visibleKeys.has(config.id) ? '隐藏 Key' : '查看 Key'}
                      >
                        {visibleKeys.has(config.id) ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                      <button
                        className="api-action-btn"
                        onClick={() => handleEdit(config)}
                        title="编辑"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        className="api-action-btn danger"
                        onClick={() => handleDelete(config.id)}
                        title="删除"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {section === 'skills' && (
          <section className="settings-section">
            <h2 className="settings-section-title">能力配置</h2>

            <div className="settings-skill-list">
              {SKILLS.map((skill) => (
                <div className="skill-row" key={skill.key}>
                  <div className="skill-info">
                    <div className="skill-name">{skill.label}</div>
                    <div className="skill-desc">{skill.desc}</div>
                  </div>
                  <Toggle
                    on={settings.skills[skill.key]}
                    onChange={(v) => handleSkillToggle(skill.key, v)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {section === 'style' && (
          <StyleSection />
        )}

        {section === 'appearance' && (
          <section className="settings-section">
            <h2 className="settings-section-title">页面风格</h2>

            <div className="settings-field">
              <label className="settings-label">主题</label>
              <div className="settings-card-group">
                <button
                  type="button"
                  className={`theme-card ${settings.theme === 'dark' ? 'active' : ''}`}
                  onClick={() => updateSettings({ theme: 'dark' })}
                >
                  <MoonIcon />
                  <span>深色</span>
                </button>
                <button
                  type="button"
                  className={`theme-card ${settings.theme === 'light' ? 'active' : ''}`}
                  onClick={() => updateSettings({ theme: 'light' })}
                >
                  <SunIcon />
                  <span>浅色</span>
                </button>
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-label">主题色</label>
              <div className="settings-color-group">
                {ACCENT_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c.value}
                    className={`color-swatch ${settings.accentColor === c.value ? 'active' : ''}`}
                    style={{ background: c.value }}
                    title={c.name}
                    onClick={() => updateSettings({ accentColor: c.value })}
                  />
                ))}
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-label">字号</label>
              <div className="settings-card-group">
                {FONT_SIZES.map((f) => (
                  <button
                    type="button"
                    key={f.value}
                    className={`theme-card ${settings.fontSize === f.value ? 'active' : ''}`}
                    onClick={() => updateSettings({ fontSize: f.value })}
                  >
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="settings-pythonPath">Python 路径</label>
              <input
                id="settings-pythonPath"
                className="settings-input"
                type="text"
                value={settings.pythonPath}
                placeholder="python"
                onChange={(e) => updateSettings({ pythonPath: e.target.value })}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="settings-sandboxTimeout">沙盒超时（毫秒）</label>
              <input
                id="settings-sandboxTimeout"
                className="settings-input"
                type="number"
                min={0}
                value={settings.sandboxTimeout}
                placeholder="30000"
                onChange={(e) => updateSettings({ sandboxTimeout: e.target.value })}
              />
            </div>
          </section>
        )}
      </div>

      {/* API 配置弹窗 */}
      {modalOpen && (
        <ApiConfigModal
          editing={editingConfig}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="删除 API 配置"
        message="确定删除此 API 配置？此操作无法撤销。"
        confirmText="删除"
        danger
        onConfirm={confirmDeleteApi}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}

// ============================================================
// 图表风格管理子组件
// ============================================================

function StyleSection() {
  const { settings, setActiveStyle, addCustomStyle, deleteCustomStyle, updateCustomStyle } = useAppStore()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrompt, setNewPrompt] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrompt, setEditPrompt] = useState('')

  const handleAdd = () => {
    if (!newName.trim() || !newPrompt.trim()) return
    addCustomStyle(newName.trim(), newPrompt.trim())
    setNewName('')
    setNewPrompt('')
    setShowAdd(false)
  }

  const handleStartEdit = (id: string, name: string, prompt: string) => {
    setEditingId(id)
    setEditName(name)
    setEditPrompt(prompt)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim() || !editPrompt.trim()) return
    updateCustomStyle(editingId, editName.trim(), editPrompt.trim())
    setEditingId(null)
  }

  return (
    <section className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">图表风格</h2>
      </div>

      <p className="settings-section-desc">
        选择不同风格预设，AI 将根据风格指导生成统一美学的图表。也可添加自定义风格，编写自定义提示词。
      </p>

      {/* 预设风格 */}
      <div className="settings-field">
        <label className="settings-label">默认风格</label>
        <div className="settings-card-group" style={{ flexWrap: 'wrap' }}>
          {CHART_STYLE_PRESETS.map((style) => (
            <button
              key={style.id}
              className={`theme-card ${settings.activeStyleId === style.id ? 'active' : ''}`}
              onClick={() => setActiveStyle(style.id)}
              title={style.description}
            >
              <span>{style.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 自定义风格 */}
      <div className="settings-field">
        <div className="settings-section-header">
          <label className="settings-label">自定义风格</label>
          <button className="api-add-btn" onClick={() => setShowAdd(!showAdd)} title="添加自定义风格">
            <PlusIcon />
          </button>
        </div>

        {showAdd && (
          <div className="custom-style-form">
            <input
              className="settings-input"
              type="text"
              placeholder="风格名称，如：我的品牌色"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <textarea
              className="settings-input"
              placeholder="风格提示词，如：使用品牌色 #FF6B35 和 #004E64，图表标题用粗体..."
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              rows={4}
              style={{ marginBottom: 8, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="theme-card" onClick={() => setShowAdd(false)}>取消</button>
              <button
                className="theme-card"
                style={{ background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' }}
                onClick={handleAdd}
              >
                保存
              </button>
            </div>
          </div>
        )}

        <div className="custom-style-list">
          {settings.customStyles.length === 0 ? (
            <div className="settings-field-hint">暂无自定义风格，点击 + 添加</div>
          ) : (
            settings.customStyles.map((cs) => (
              <div key={cs.id} className="custom-style-item">
                {editingId === cs.id ? (
                  <div className="custom-style-form">
                    <input
                      className="settings-input"
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ marginBottom: 8 }}
                    />
                    <textarea
                      className="settings-input"
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      rows={3}
                      style={{ marginBottom: 8, resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="theme-card" onClick={() => setEditingId(null)}>取消</button>
                      <button
                        className="theme-card"
                        style={{ background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' }}
                        onClick={handleSaveEdit}
                      >
                        保存修改
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 4 }}>{cs.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cs.prompt}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button
                        className="api-edit-btn"
                        onClick={() => handleStartEdit(cs.id, cs.name, cs.prompt)}
                        title="编辑"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        className="api-delete-btn"
                        onClick={() => deleteCustomStyle(cs.id)}
                        title="删除"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
