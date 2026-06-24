﻿﻿﻿﻿import { useState, useEffect } from 'react'
import {
  RefreshCw, CheckCircle2, Circle, Shield, Plus, Trash2,
  Edit3, X, Save, ToggleLeft, ToggleRight, AlertCircle,
  Beaker, Check, XCircle,
} from 'lucide-react'
import { fetchRules, createRule, updateRule, deleteRule, toggleRule, testRules } from '../lib/api'
import type { RuleInfo } from '../types/api'

type EditMode = 'none' | 'create' | 'edit'

export function Rules() {
  const [rules, setRules] = useState<RuleInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState<EditMode>('none')
  const [editingRule, setEditingRule] = useState<RuleInfo | null>(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [showTest, setShowTest] = useState(false)
  const [testContent, setTestContent] = useState('')
  const [testSender, setTestSender] = useState('')
  const [testAtMe, setTestAtMe] = useState(false)
  const [testHasImage, setTestHasImage] = useState(false)
  const [testResults, setTestResults] = useState<any[] | null>(null)
  const [testLoading, setTestLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    enabled: true,
    priority: 50,
    keywords: '',
    sender_ids: '',
    time_range: '',
    is_at_me: false,
    has_image: false,
    regex: '',
    set_mood: '',
    set_reply_style: '',
    set_persona: '',
    trigger_plugin: '',
    send_reply: '',
  })

  useEffect(() => { loadRules() }, [])

  async function loadRules() {
    try {
      setLoading(true)
      const data = await fetchRules()
      setRules(data.rules || [])
    } catch (err) {
      console.error('Failed to load rules:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      name: '', description: '', enabled: true, priority: 50,
      keywords: '', sender_ids: '', time_range: '', is_at_me: false,
      has_image: false, regex: '', set_mood: '', set_reply_style: '',
      set_persona: '', trigger_plugin: '', send_reply: '',
    })
    setFormError('')
  }

  const startCreate = () => {
    resetForm()
    setEditingRule(null)
    setEditMode('create')
  }

  const startEdit = (rule: RuleInfo) => {
    setEditingRule(rule)
    setForm({
      name: rule.name,
      description: rule.description || '',
      enabled: rule.enabled,
      priority: rule.priority,
      keywords: rule.condition?.keywords?.join(', ') || '',
      sender_ids: rule.condition?.sender_ids?.join(', ') || '',
      time_range: rule.condition?.time_range || '',
      is_at_me: rule.condition?.is_at_me ?? false,
      has_image: rule.condition?.has_image ?? false,
      regex: rule.condition?.regex || '',
      set_mood: rule.action?.set_mood || '',
      set_reply_style: rule.action?.set_reply_style || '',
      set_persona: rule.action?.set_persona || '',
      trigger_plugin: rule.action?.trigger_plugin || '',
      send_reply: rule.action?.send_reply || '',
    })
    setFormError('')
    setEditMode('edit')
  }

  const cancelEdit = () => {
    setEditMode('none')
    setEditingRule(null)
    resetForm()
  }

  const buildRequest = () => {
    const condition: Record<string, unknown> = {}
    if (form.keywords) condition.keywords = form.keywords.split(',').map(s => s.trim()).filter(Boolean)
    if (form.sender_ids) condition.sender_ids = form.sender_ids.split(',').map(s => s.trim()).filter(Boolean)
    if (form.time_range) condition.time_range = form.time_range
    if (form.is_at_me) condition.is_at_me = true
    if (form.has_image) condition.has_image = true
    if (form.regex) condition.regex = form.regex

    const action: Record<string, unknown> = {}
    if (form.set_mood) action.set_mood = form.set_mood
    if (form.set_reply_style) action.set_reply_style = form.set_reply_style
    if (form.set_persona) action.set_persona = form.set_persona
    if (form.trigger_plugin) action.trigger_plugin = form.trigger_plugin
    if (form.send_reply) action.send_reply = form.send_reply

    return { condition, action }
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('Rule name cannot be empty')
      return
    }
    if (form.priority < 0 || form.priority > 100) {
      setFormError('Priority must be between 0-100')
      return
    }

    setSaving(true)
    setFormError('')

    try {
      const { condition, action } = buildRequest()

      if (editMode === 'create') {
        await createRule({
          name: form.name.trim(),
          description: form.description.trim(),
          enabled: form.enabled,
          priority: form.priority,
          condition,
          action,
        })
      } else if (editMode === 'edit' && editingRule) {
        await updateRule(editingRule.id, {
          description: form.description.trim(),
          enabled: form.enabled,
          priority: form.priority,
          condition,
          action,
        })
      }

      cancelEdit()
      await loadRules()
    } catch (err) {
      setFormError('Save failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (rule: RuleInfo) => {
    try {
      await toggleRule(rule.id)
      await loadRules()
    } catch (err) {
      console.error('Toggle rule failed:', err)
    }
  }

  const handleDelete = async (rule: RuleInfo) => {
    if (!confirm('Delete rule "' + rule.name + '"? This cannot be undone.')) return
    try {
      await deleteRule(rule.id)
      await loadRules()
    } catch (err) {
      console.error('Delete rule failed:', err)
    }
  }

  const handleTest = async () => {
    if (!testContent.trim()) return
    setTestLoading(true)
    setTestResults(null)
    try {
      const data = await testRules({
        content: testContent.trim(),
        sender_id: testSender.trim() || undefined,
        is_at_me: testAtMe,
        has_image: testHasImage,
      })
      setTestResults(data.results || [])
    } catch (err) {
      console.error('Rule test failed:', err)
    } finally {
      setTestLoading(false)
    }
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 90) return 'Highest'
    if (priority >= 70) return 'High'
    if (priority >= 40) return 'Medium'
    return 'Low'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]" role="status" aria-label="加载中…">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-primary/20" />
            <RefreshCw className="absolute inset-0 m-auto h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          </div>
          <span className="text-sm text-muted-foreground font-medium">正在加载规则…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen aurora-bg space-y-6 p-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-400/20 to-pink-400/20 flex items-center justify-center card-glow-blue">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gradient">规则引擎</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                管理回复规则，支持关键词、发送者、时间范围、正则等条件
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadRules}
              className="btn btn-outline"
            >
              <RefreshCw className="h-4 w-4" />
              刷新
            </button>
            {editMode === 'none' && (
              <button
                onClick={startCreate}
                className="btn btn-accent"
              >
                <Plus className="h-4 w-4" />
                新建规则
              </button>
            )}
          </div>
        </div>
      </div>

      {editMode !== 'none' && (
        <div className="relative card card-hover card-pink rounded-2xl overflow-hidden">
          <div className="p-6 space-y-5">
            {formError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editMode === 'create' ? '新建规则' : (
                  <span>编辑规则: <span style={{ color: 'hsl(var(--primary))' }}>{editingRule?.name}</span></span>
                )}
              </h2>
              <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {editMode === 'create' && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">规则名称</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="input"
                    placeholder="例如: 我的自定义规则"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5">描述</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="input"
                  placeholder="可选描述"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">启用状态</label>
                <button
                  onClick={() => setForm({ ...form, enabled: !form.enabled })}
                  className={`btn ${form.enabled ? 'btn-accent' : 'btn-outline'}`}
                >
                  {form.enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  {form.enabled ? '已启用' : '已禁用'}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">优先级 (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                  className="input"
                />
              </div>
            </div>

            <div className="border-t border-blue-100 pt-5">
              <h3 className="text-sm font-semibold mb-3 text-blue-400">条件</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">关键词（逗号分隔）</label>
                  <input
                    type="text"
                    value={form.keywords}
                    onChange={e => setForm({ ...form, keywords: e.target.value })}
                    className="input"
                    placeholder="例如: hello, hi, hey"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">发送者 ID（逗号分隔）</label>
                  <input
                    type="text"
                    value={form.sender_ids}
                    onChange={e => setForm({ ...form, sender_ids: e.target.value })}
                    className="input"
                    placeholder="例如: 123456, 789012"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">时间范围</label>
                  <input
                    type="text"
                    value={form.time_range}
                    onChange={e => setForm({ ...form, time_range: e.target.value })}
                    className="input"
                    placeholder="e.g. 08:00-22:00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">正则表达式</label>
                  <input
                    type="text"
                    value={form.regex}
                    onChange={e => setForm({ ...form, regex: e.target.value })}
                    className="input"
                    placeholder="例如: ^/cmd"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.is_at_me}
                      onChange={e => setForm({ ...form, is_at_me: e.target.checked })}
                      className="rounded border-blue-300 text-blue-500 focus:ring-blue-400/20"
                    />
                    @ 我
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.has_image}
                      onChange={e => setForm({ ...form, has_image: e.target.checked })}
                      className="rounded border-blue-300 text-blue-500 focus:ring-blue-400/20"
                    />
                    包含图片
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t border-pink-100 pt-5">
              <h3 className="text-sm font-semibold mb-3 text-pink-400">动作</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">设置心情</label>
                  <input
                    type="text"
                    value={form.set_mood}
                    onChange={e => setForm({ ...form, set_mood: e.target.value })}
                    className="input"
                    placeholder="例如: happy, sad, excited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">设置回复风格</label>
                  <input
                    type="text"
                    value={form.set_reply_style}
                    onChange={e => setForm({ ...form, set_reply_style: e.target.value })}
                    className="input"
                    placeholder="例如: friendly, formal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">设置人物</label>
                  <input
                    type="text"
                    value={form.set_persona}
                    onChange={e => setForm({ ...form, set_persona: e.target.value })}
                    className="input"
                    placeholder="例如: teacher, friend"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">触发插件</label>
                  <input
                    type="text"
                    value={form.trigger_plugin}
                    onChange={e => setForm({ ...form, trigger_plugin: e.target.value })}
                    className="input"
                    placeholder="插件名称"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">发送回复</label>
                  <input
                    type="text"
                    value={form.send_reply}
                    onChange={e => setForm({ ...form, send_reply: e.target.value })}
                    className="input"
                    placeholder="Auto reply text"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-accent"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? '保存中…' : '保存'}
              </button>
              <button
                onClick={cancelEdit}
                className="btn btn-outline"
              >
                <X className="h-4 w-4" />
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {editMode === 'none' && (
        <>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTest(!showTest)}
              className="btn btn-outline"
            >
              <Beaker className="h-4 w-4" />
              {showTest ? '关闭测试' : '测试规则'}
            </button>
          </div>

          {showTest && (
            <div className="relative card card-hover card-blue rounded-2xl overflow-hidden">
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">规则测试面板</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">消息内容</label>
                    <input
                      type="text"
                      value={testContent}
                      onChange={e => setTestContent(e.target.value)}
                      className="input"
                      placeholder="测试消息内容…"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">发送者 ID（可选）</label>
                    <input
                      type="text"
                      value={testSender}
                      onChange={e => setTestSender(e.target.value)}
                      className="input"
                      placeholder="发送者 ID"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={testAtMe}
                      onChange={e => setTestAtMe(e.target.checked)}
                      className="rounded border-blue-300 text-blue-500 focus:ring-blue-400/20"
                    />
                    @ 我
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={testHasImage}
                      onChange={e => setTestHasImage(e.target.checked)}
                      className="rounded border-blue-300 text-blue-500 focus:ring-blue-400/20"
                    />
                    包含图片
                  </label>
                </div>
                <button
                  onClick={handleTest}
                  disabled={testLoading || !testContent.trim()}
                  className="btn btn-accent"
                >
                  {testLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {testLoading ? '测试中…' : '运行测试'}
                </button>

                {testResults && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">
                      测试结果（{testResults.length} 条规则匹配）
                    </h3>
                    {testResults.length === 0 ? (
                      <div className="flex items-center gap-2 rounded-xl bg-muted border border-border p-4 text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
                        <XCircle className="h-4 w-4" />
                        无规则匹配
                      </div>
                    ) : (
                      testResults.map((r: any, i: number) => (
                        <div key={i} className="card rounded-xl p-4 space-y-2 border border-border">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
                            <span className="font-semibold">{r.rule_name}</span>
                            <span className="badge badge-blue">优先级: {r.priority}</span>
                          </div>
                          {r.matched_conditions && r.matched_conditions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {r.matched_conditions.map((c: string, j: number) => (
                                <span key={j} className="badge badge-pink">{c}</span>
                              ))}
                            </div>
                          )}
                          {r.actions && r.actions.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              动作: {r.actions.join(', ')}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3 stagger">
            {rules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground card rounded-2xl p-8">
                <Shield className="h-12 w-12 mb-4 opacity-40 text-blue-400" />
                <p className="text-lg font-medium">暂无规则</p>
                <p className="text-sm">点击"新建规则"创建第一条规则</p>
              </div>
            ) : (
              rules.map((rule, index) => {
                const isBlue = index % 2 === 0
                return (
                  <div key={rule.id} className={`relative card card-hover ${isBlue ? 'card-blue' : 'card-pink'} rounded-2xl overflow-hidden`}>
                  <div className="p-5 pl-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggle(rule)}
                          className="transition-colors"
                        >
                          {rule.enabled ? (
                            <CheckCircle2 className="h-5 w-5 text-blue-400" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{rule.name}</h3>
                            <span className={`badge ${isBlue ? 'badge-blue' : 'badge-pink'}`}>
                              {getPriorityLabel(rule.priority)}
                            </span>
                          </div>
                          {rule.description && (
                            <p className="text-sm text-muted-foreground mt-0.5">{rule.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(rule)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <Edit3 className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <Trash2 className="h-4 w-4" style={{ color: 'hsl(var(--accent))' }} />
                        </button>
                      </div>
                    </div>
                    {rule.condition && Object.keys(rule.condition).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {rule.condition.keywords?.map((kw: string, i: number) => (
                          <span key={i} className="badge badge-blue">关键词: {kw}</span>
                        ))}
                        {rule.condition.sender_ids?.map((sid: string, i: number) => (
                          <span key={i} className="badge badge-blue">发送者: {sid}</span>
                        ))}
                        {rule.condition.time_range && (
                          <span className="badge badge-blue">时间: {rule.condition.time_range}</span>
                        )}
                        {rule.condition.is_at_me && (
                          <span className="badge badge-blue">@ 我</span>
                        )}
                        {rule.condition.has_image && (
                          <span className="badge badge-blue">包含图片</span>
                        )}
                        {rule.condition.regex && (
                          <span className="badge badge-blue">正则: {rule.condition.regex}</span>
                        )}
                      </div>
                    )}
                    {rule.action && Object.keys(rule.action).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {rule.action.set_mood && (
                          <span className="badge badge-pink">心情: {rule.action.set_mood}</span>
                        )}
                        {rule.action.set_reply_style && (
                          <span className="badge badge-pink">风格: {rule.action.set_reply_style}</span>
                        )}
                        {rule.action.set_persona && (
                          <span className="badge badge-pink">人物: {rule.action.set_persona}</span>
                        )}
                        {rule.action.trigger_plugin && (
                          <span className="badge badge-pink">插件: {rule.action.trigger_plugin}</span>
                        )}
                        {rule.action.send_reply && (
                          <span className="badge badge-pink">自动回复</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
            )}
          </div>
        </>
      )}
    </div>
  );
};
