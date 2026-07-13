import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Loader2, CheckCircle, AlertCircle, Activity, Download, Upload, Archive, Sun, Moon, Monitor } from 'lucide-react';
import type { ConfigData } from '../../shared/types/ipc';

type ProviderType = 'ollama' | 'openai' | 'claude';
type RoleKey = 'chat' | 'embedding';
type RoleBackend = ProviderType | 'byok';

interface ProviderMeta {
  tag: string;
  title: string;
  desc: string;
  keyPlaceholder: string;
  baseUrlPlaceholder: string;
  modelLabel: string;
  modelPlaceholder: string;
  embeddingLabel?: string;
  embeddingPlaceholder?: string;
}

// Presentation metadata per provider. The underlying config model keeps a single
// active provider with per-provider (ollama/openai/claude) fields (config.ai.providers).
const PROVIDER_META: Record<ProviderType, ProviderMeta> = {
  ollama: {
    tag: 'LOCAL',
    title: 'Ollama',
    desc: '本地推理 · 隐私优先',
    keyPlaceholder: '本地无需 API KEY',
    baseUrlPlaceholder: 'http://localhost:11434',
    modelLabel: 'CHAT 模型',
    modelPlaceholder: 'llama3.1:8b',
    embeddingLabel: 'EMBEDDING 模型',
    embeddingPlaceholder: 'nomic-embed-text',
  },
  openai: {
    tag: 'OPENAI',
    title: 'OpenAI',
    desc: 'GPT · 兼容 OpenAI 协议',
    keyPlaceholder: 'sk-...',
    baseUrlPlaceholder: 'https://api.openai.com/v1',
    modelLabel: 'CHAT 模型',
    modelPlaceholder: 'gpt-4o-mini',
    embeddingLabel: 'EMBEDDING 模型',
    embeddingPlaceholder: 'text-embedding-3-small',
  },
  claude: {
    tag: 'CLAUDE',
    title: 'Anthropic Claude',
    desc: 'Claude · Anthropic 协议',
    keyPlaceholder: 'sk-ant-...',
    baseUrlPlaceholder: 'https://api.anthropic.com',
    modelLabel: 'CHAT 模型',
    modelPlaceholder: 'claude-3-5-sonnet-latest',
  },
};

const PROVIDER_ORDER: ProviderType[] = ['ollama', 'openai', 'claude'];

// Chat and Embedding are configured as independent roles (PRD 3.1.6.2).
const AI_ROLES: { key: 'chat' | 'embedding'; tag: string; title: string; desc: string }[] = [
  { key: 'chat', tag: '对话 CHAT', title: '对话模型', desc: '用于摘要 / 标签 / 要点生成' },
  { key: 'embedding', tag: '向量 EMBED', title: '向量模型', desc: '用于语义搜索的向量生成' },
];

const eyebrowStyle: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.18em',
  color: 'var(--amber)',
  marginBottom: 10,
};

const h1Style: React.CSSProperties = {
  fontFamily: 'var(--disp)',
  fontWeight: 600,
  fontSize: 32,
  letterSpacing: '-0.02em',
  margin: '0 0 30px',
  color: 'var(--ink)',
};

const sectionHeadRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  marginBottom: 16,
};

const sectionH2: React.CSSProperties = {
  fontFamily: 'var(--disp)',
  fontWeight: 600,
  fontSize: 17,
  margin: 0,
  color: 'var(--ink)',
};

const sectionHint: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  letterSpacing: '0.1em',
  color: 'var(--ink-3)',
};

const cardStyle: React.CSSProperties = {
  padding: 22,
  border: '1px solid var(--line)',
  borderRadius: 16,
  background: 'var(--bg-1)',
};

const fieldLabelText: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  color: 'var(--ink-3)',
};

const inputStyle: React.CSSProperties = {
  padding: '11px 13px',
  borderRadius: 10,
  border: '1px solid var(--line)',
  background: 'var(--bg-0)',
  color: 'var(--ink)',
  fontFamily: 'var(--mono)',
  fontSize: 12,
  outline: 'none',
  width: '100%',
};

/** Labeled on/off switch row (mirrors the 自动降级 toggle style). */
const ToggleRow: React.FC<{
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, hint, checked, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '10px 0' }}>
    <div>
      <div style={{ fontSize: 13.5, color: 'var(--ink)', marginBottom: hint ? 3 : 0 }}>{label}</div>
      {hint && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{hint}</div>}
    </div>
    <div
      onClick={() => onChange(!checked)}
      style={{ width: 44, height: 24, borderRadius: 20, background: checked ? 'var(--amber)' : 'var(--bg-3)', position: 'relative', cursor: 'pointer', transition: 'background .18s', flexShrink: 0 }}
    >
      <span style={{ position: 'absolute', top: 2, left: checked ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .18s' }} />
    </div>
  </div>
);

/** API-key input with a click-to-reveal toggle (masked by default). */
const SecretInput: React.FC<{
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}> = ({ value, placeholder, onChange }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, paddingRight: 46 }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        title={visible ? '隐藏' : '显示'}
        aria-label={visible ? '隐藏 API Key' : '显示 API Key'}
        style={{
          position: 'absolute',
          right: 6,
          top: '50%',
          transform: 'translateY(-50%)',
          padding: '4px 8px',
          borderRadius: 6,
          border: 'none',
          background: 'transparent',
          color: 'var(--ink-3)',
          cursor: 'pointer',
          fontFamily: 'var(--mono)',
          fontSize: 12,
          lineHeight: 1,
        }}
      >
        {visible ? '🙈' : '👁'}
      </button>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState<RoleKey | null>(null);
  const [testResult, setTestResult] = useState<Partial<Record<RoleKey, { ok: boolean; msg: string }>>>({});
  const [dataBusy, setDataBusy] = useState(false);
  const [dataMsg, setDataMsg] = useState<string | null>(null);

  // Design-only global param (no backing config field in ConfigData yet).
  const [autoFallback, setAutoFallback] = useState(true);

  useEffect(() => {
    void fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.config.get();
      if (result.success && result.data) {
        setConfig(result.data);
      } else {
        setError(result.error ?? '获取配置失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const result = await window.electronAPI.config.update(config);
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        setError(result.error ?? '保存失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const result = await window.electronAPI.config.reset();
      if (result.success && result.data) {
        setConfig(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置失败');
    } finally {
      setSaving(false);
    }
  };

  // Test is scoped to a role so Chat and Embedding show status independently,
  // even when both use the same underlying provider.
  const handleTest = async (role: RoleKey, type: ProviderType) => {
    setTesting(role);
    try {
      // Persist first so the backend tests against the values just entered
      // (BYOK key/baseURL live only in local state until saved).
      if (config) {
        const saved = await window.electronAPI.config.update(config);
        if (!saved.success) {
          setTestResult((prev) => ({ ...prev, [role]: { ok: false, msg: saved.error ?? '保存配置失败' } }));
          return;
        }
      }
      const result = await window.electronAPI.ai.testConnection(type, role);
      if (result.success && result.data) {
        setTestResult((prev) => ({ ...prev, [role]: { ok: result.data!.success, msg: result.data!.message } }));
      } else {
        setTestResult((prev) => ({ ...prev, [role]: { ok: false, msg: result.error ?? '测试失败' } }));
      }
    } catch (err) {
      setTestResult((prev) => ({ ...prev, [role]: { ok: false, msg: err instanceof Error ? err.message : '测试失败' } }));
    } finally {
      setTesting(null);
    }
  };

  const patch = (updates: Partial<ConfigData>) => {
    if (config) setConfig({ ...config, ...updates });
  };

  const getAllCollectionIds = async (): Promise<string[]> => {
    const res = await window.electronAPI.collection.list({ page: 1, pageSize: 10000, isDeleted: false });
    return res.success && res.data ? res.data.items.map((i) => i.id) : [];
  };

  const handleExport = async (format: 'json' | 'markdown' | 'html') => {
    setDataBusy(true);
    setDataMsg(null);
    try {
      const ids = await getAllCollectionIds();
      if (ids.length === 0) {
        setDataMsg('没有可导出的收藏');
        return;
      }
      const res = await window.electronAPI.export[format](ids);
      setDataMsg(res.success ? `已导出 ${ids.length} 条收藏` : (res.error ?? '导出失败'));
    } catch (err) {
      setDataMsg(err instanceof Error ? err.message : '导出失败');
    } finally {
      setDataBusy(false);
    }
  };

  const handleImport = async () => {
    setDataBusy(true);
    setDataMsg(null);
    try {
      const res = await window.electronAPI.import.json();
      setDataMsg(res.success && res.data ? `已导入 ${res.data.itemCount} 条收藏` : (res.error ?? '导入失败'));
    } catch (err) {
      setDataMsg(err instanceof Error ? err.message : '导入失败');
    } finally {
      setDataBusy(false);
    }
  };

  const handleBackup = async () => {
    setDataBusy(true);
    setDataMsg(null);
    try {
      const res = await window.electronAPI.backup.create();
      setDataMsg(res.success ? '备份已创建' : (res.error ?? '备份失败'));
    } catch (err) {
      setDataMsg(err instanceof Error ? err.message : '备份失败');
    } finally {
      setDataBusy(false);
    }
  };

  const handleReindex = async () => {
    setDataBusy(true);
    setDataMsg('正在为所有收藏重建语义向量…');
    try {
      const res = await window.electronAPI.ai.reindexAll();
      setDataMsg(res.success && res.data
        ? `语义索引重建完成：${res.data.success}/${res.data.total} 条`
        : (res.error ?? '重建失败'));
    } catch (err) {
      setDataMsg(err instanceof Error ? err.message : '重建失败');
    } finally {
      setDataBusy(false);
    }
  };

  // Set the backend for a role. Chat and Embedding are independent (PRD 3.1.6.2);
  // the chat backend also drives the legacy defaultProvider/enabled flags.
  const setRole = (role: RoleKey, type: RoleBackend) => {
    if (!config) return;
    const ai = { ...config.ai };
    if (role === 'chat') {
      ai.chatProvider = type;
      ai.defaultProvider = type;
      ai.providers = config.ai.providers.map((p) => ({ ...p, enabled: p.type === type }));
    } else {
      ai.embeddingProvider = type;
    }
    setConfig({ ...config, ai });
  };

  const updateByok = (role: RoleKey, field: 'protocol' | 'baseUrl' | 'apiKey' | 'model' | 'dimension', value: string | number) => {
    if (!config) return;
    const key = role === 'chat' ? 'chatByok' : 'embeddingByok';
    setConfig({ ...config, ai: { ...config.ai, [key]: { ...config.ai[key], [field]: value } } });
  };

  const updateProvider = (type: ProviderType, field: 'apiKey' | 'baseUrl' | 'model' | 'embeddingModel', value: string) => {
    if (!config) return;
    setConfig({
      ...config,
      ai: {
        ...config.ai,
        providers: config.ai.providers.map((p) => (p.type === type ? { ...p, [field]: value } : p)),
      },
    });
  };

  if (loading) {
    return (
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 256 }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--amber)' }} />
      </div>
    );
  }

  if (error && !config) {
    return (
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 256, gap: 16 }}>
        <AlertCircle className="w-10 h-10" style={{ color: 'var(--err)' }} />
        <p style={{ color: 'var(--err)' }}>{error}</p>
      </div>
    );
  }

  if (!config) return null;

  const providerBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    minWidth: 98,
    padding: 11,
    borderRadius: 11,
    cursor: 'pointer',
    fontFamily: 'var(--disp)',
    fontWeight: 500,
    fontSize: 13,
    transition: 'border-color .14s, background .14s, color .14s',
    border: `1px solid ${active ? 'var(--amber-line)' : 'var(--line)'}`,
    background: active ? 'var(--amber-soft)' : 'var(--bg-0)',
    color: active ? 'var(--amber)' : 'var(--ink-2)',
  });

  const segBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--body)',
    fontSize: 12,
    background: active ? 'var(--amber)' : 'transparent',
    color: active ? '#20170A' : 'var(--ink-2)',
  });

  const dataBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '10px 15px',
    borderRadius: 10,
    border: '1px solid var(--line)',
    background: 'var(--bg-0)',
    color: 'var(--ink-2)',
    fontFamily: 'var(--body)',
    fontSize: 12.5,
    cursor: 'pointer',
  };

  const themeOptions = [
    { value: 'light' as const, label: '亮色', icon: Sun },
    { value: 'dark' as const, label: '暗色', icon: Moon },
    { value: 'auto' as const, label: '跟随系统', icon: Monitor },
  ];

  const engineModes = [
    { value: 'local', label: '仅本地' },
    { value: 'auto', label: '自动切换' },
    { value: 'firecrawl', label: '仅 FireCrawl' },
  ];

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ padding: '34px 40px 70px', maxWidth: 920 }}>
        <div style={eyebrowStyle}>SETTINGS · 系统设置</div>
        <h1 style={h1Style}>系统设置</h1>

        {/* ===== AI 模型（Chat / Embedding 独立后端 · 支持 BYOK） ===== */}
        <div style={{ ...sectionHeadRow, marginBottom: 6 }}>
          <h2 style={sectionH2}>AI 模型</h2>
          <span style={sectionHint}>对话与向量分别配置后端</span>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.6, margin: '0 0 18px', maxWidth: 560 }}>
          Chat（对话）与 Embedding（向量）相互独立，可各自选择 Ollama / OpenAI / Claude，或用 BYOK 接入任意兼容 OpenAI / Anthropic 协议的自定义端点。测试连接使用已保存的配置。
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 34 }}>
          {AI_ROLES.map((role) => {
            const selected = (role.key === 'chat' ? config.ai.chatProvider : config.ai.embeddingProvider) as RoleBackend | 'none';
            const byok = role.key === 'chat' ? config.ai.chatByok : config.ai.embeddingByok;
            const isChat = role.key === 'chat';
            const result = testResult[role.key];
            const busy = testing === role.key;
            const testType: ProviderType = selected === 'byok' ? (byok.protocol === 'anthropic' ? 'claude' : 'openai') : (selected === 'none' ? 'openai' : selected);
            const embedAnthropicWarn = !isChat && selected === 'byok' && byok.protocol === 'anthropic';
            const testBtn = (
              <button type="button" onClick={() => void handleTest(role.key, testType)} disabled={busy || selected === 'none'} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 16px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg-0)', color: 'var(--ink-2)', fontFamily: 'var(--body)', fontSize: 12.5, cursor: busy || selected === 'none' ? 'default' : 'pointer', opacity: busy || selected === 'none' ? 0.5 : 1 }}>
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />} 测试连接
              </button>
            );
            const resultBox = result ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 14, padding: '11px 14px', borderRadius: 10, background: result.ok ? 'rgba(123,192,145,0.10)' : 'rgba(224,112,94,0.10)', border: '1px solid ' + (result.ok ? 'rgba(123,192,145,0.28)' : 'rgba(224,112,94,0.28)') }}>
                {result.ok ? <CheckCircle className="w-4 h-4" style={{ color: 'var(--ok)', flexShrink: 0, marginTop: 1 }} /> : <AlertCircle className="w-4 h-4" style={{ color: 'var(--err)', flexShrink: 0, marginTop: 1 }} />}
                <span style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--ink-2)' }}>{result.ok ? '连接成功' : '连接失败'}：{result.msg}</span>
              </div>
            ) : null;
            return (
              <div key={role.key} style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', padding: '5px 10px', borderRadius: 7, background: 'var(--amber-soft)', border: '1px solid var(--amber-line)', color: 'var(--amber)' }}>{role.tag}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--disp)', fontWeight: 600, fontSize: 15, color: 'var(--ink)', lineHeight: 1.2 }}>{role.title}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 3 }}>{role.desc}</div>
                  </div>
                </div>
                {/* provider chooser: Ollama / OpenAI / Claude / BYOK */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  {PROVIDER_ORDER.map((type) => {
                    const noEmbed = !isChat && type === 'claude';
                    return (
                      <button key={type} type="button" disabled={noEmbed} onClick={() => setRole(role.key, type)} title={noEmbed ? 'Claude 不提供 Embedding' : undefined} style={{ ...providerBtnStyle(selected === type), flex: 1, minWidth: 96, opacity: noEmbed ? 0.4 : 1, cursor: noEmbed ? 'not-allowed' : 'pointer' }}>
                        {PROVIDER_META[type].title}
                      </button>
                    );
                  })}
                  <button type="button" onClick={() => setRole(role.key, 'byok')} style={{ ...providerBtnStyle(selected === 'byok'), flex: 1, minWidth: 96 }}>BYOK</button>
                </div>

                {selected === 'none' && (
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>请选择一个后端</div>
                )}

                {/* BYOK protocol toggle */}
                {selected === 'byok' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '11px 14px', borderRadius: 11, background: 'var(--bg-0)', border: '1px solid var(--amber-line)' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--amber)' }}>BYOK 协议</span>
                    <div style={{ display: 'flex', gap: 3, padding: 3, border: '1px solid var(--line)', borderRadius: 9, background: 'var(--bg-1)' }}>
                      {(['openai', 'anthropic'] as const).map((proto) => (
                        <button key={proto} type="button" onClick={() => updateByok(role.key, 'protocol', proto)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--body)', fontSize: 12, background: byok.protocol === proto ? 'var(--amber-soft)' : 'transparent', color: byok.protocol === proto ? 'var(--amber)' : 'var(--ink-2)' }}>{proto === 'openai' ? 'OpenAI 协议' : 'Anthropic 协议'}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* fields */}
                {selected === 'byok' ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <span style={fieldLabelText}>API BASE URL</span>
                        <input type="text" value={byok.baseUrl} placeholder={byok.protocol === 'anthropic' ? 'https://api.anthropic.com' : 'https://api.openai.com/v1'} onChange={(e) => updateByok(role.key, 'baseUrl', e.target.value)} style={inputStyle} />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <span style={fieldLabelText}>API KEY</span>
                        <SecretInput value={byok.apiKey} placeholder="sk-..." onChange={(v) => updateByok(role.key, 'apiKey', v)} />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <span style={fieldLabelText}>{isChat ? 'CHAT 模型' : 'EMBEDDING 模型'}</span>
                        <input type="text" value={byok.model} placeholder={isChat ? 'gpt-4o-mini' : 'text-embedding-3-small'} onChange={(e) => updateByok(role.key, 'model', e.target.value)} style={inputStyle} />
                      </label>
                      {!isChat && (
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 7, maxWidth: 160 }}>
                          <span style={fieldLabelText}>向量维度</span>
                          <input type="number" min={0} step={1} value={byok.dimension || ''} placeholder="如 3072" onChange={(e) => updateByok(role.key, 'dimension', Number(e.target.value) || 0)} style={inputStyle} />
                        </label>
                      )}
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>{testBtn}</div>
                    </div>
                    {!isChat && (
                      <p style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--ink-3)', margin: '10px 0 0', fontFamily: 'var(--mono)' }}>
                        自定义端点需手动填写向量维度（如 Google embedding-2 = 3072）。留空则按模型名推断。更改维度会重建向量库，旧向量需重新生成。
                      </p>
                    )}
                    {embedAnthropicWarn && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 14, padding: '11px 14px', borderRadius: 10, background: 'rgba(224,112,94,0.10)', border: '1px solid rgba(224,112,94,0.28)' }}>
                        <AlertCircle className="w-4 h-4" style={{ color: 'var(--err)', flexShrink: 0, marginTop: 1 }} />
                        <span style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--ink-2)' }}>Anthropic 协议不提供 Embedding 接口，向量后端请使用 OpenAI 协议或 Ollama。</span>
                      </div>
                    )}
                    {resultBox}
                  </>
                ) : selected !== 'none' && (() => {
                  const type = selected;
                  const provider = config.ai.providers.find((p) => p.type === type);
                  const meta = PROVIDER_META[type];
                  const modelValue = isChat ? (provider?.model ?? '') : (provider?.embeddingModel ?? '');
                  const modelPlaceholder = isChat ? meta.modelPlaceholder : (meta.embeddingPlaceholder ?? '');
                  return (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                          <span style={fieldLabelText}>API BASE URL</span>
                          <input type="text" value={provider?.baseUrl ?? ''} placeholder={meta.baseUrlPlaceholder} onChange={(e) => updateProvider(type, 'baseUrl', e.target.value)} style={inputStyle} />
                        </label>
                        {type !== 'ollama' && (
                          <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            <span style={fieldLabelText}>API KEY</span>
                            <SecretInput value={provider?.apiKey ?? ''} placeholder={meta.keyPlaceholder} onChange={(v) => updateProvider(type, 'apiKey', v)} />
                          </label>
                        )}
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                          <span style={fieldLabelText}>{isChat ? 'CHAT 模型' : 'EMBEDDING 模型'}</span>
                          <input type="text" value={modelValue} placeholder={modelPlaceholder} onChange={(e) => updateProvider(type, isChat ? 'model' : 'embeddingModel', e.target.value)} style={inputStyle} />
                        </label>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>{testBtn}</div>
                      </div>
                      {resultBox}
                    </>
                  );
                })()}
              </div>
            );
          })}
        </div>

        {/* ===== FireCrawl ===== */}
        <div style={sectionHeadRow}>
          <h2 style={sectionH2}>FireCrawl 抓取</h2>
          <span style={sectionHint}>高质量网页抓取 · 反爬 · 动态渲染</span>
        </div>
        <div style={{ ...cardStyle, marginBottom: 34 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>抓取模式</span>
            <div style={{ display: 'flex', gap: 3, padding: 3, border: '1px solid var(--line)', borderRadius: 9, background: 'var(--bg-0)' }}>
              {engineModes.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => patch({ scraper: { ...config.scraper, defaultEngine: m.value } })}
                  style={segBtnStyle(config.scraper.defaultEngine === m.value)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 7, maxWidth: 420, marginBottom: 20 }}>
            <span style={fieldLabelText}>FIRECRAWL API KEY</span>
            <SecretInput
              value={config.scraper.firecrawlApiKey ?? ''}
              placeholder="fc-..."
              onChange={(v) => patch({ scraper: { ...config.scraper, firecrawlApiKey: v } })}
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13.5, color: 'var(--ink)', marginBottom: 3 }}>启用 JavaScript</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>抓取动态渲染的网页内容</div>
            </div>
            <div
              onClick={() => patch({ scraper: { ...config.scraper, enableJavaScript: !config.scraper.enableJavaScript } })}
              style={{
                width: 44,
                height: 24,
                borderRadius: 20,
                background: config.scraper.enableJavaScript ? 'var(--amber)' : 'var(--bg-3)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background .18s',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: config.scraper.enableJavaScript ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left .18s',
                }}
              />
            </div>
          </div>
        </div>

        {/* ===== 全局参数 ===== */}
        <div style={sectionHeadRow}>
          <h2 style={sectionH2}>全局参数</h2>
          <span style={sectionHint}>推理与降级策略</span>
        </div>
        <div style={{ ...cardStyle, marginBottom: 34 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 16,
              marginBottom: 16,
              borderBottom: '1px solid var(--line)',
            }}
          >
            <div>
              <div style={{ fontSize: 13.5, color: 'var(--ink)', marginBottom: 3 }}>自动降级</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>当前后端失败时自动尝试其他可用后端</div>
            </div>
            <div
              onClick={() => setAutoFallback((v) => !v)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 20,
                background: autoFallback ? 'var(--amber)' : 'var(--bg-3)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background .18s',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: autoFallback ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left .18s',
                }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13.5, color: 'var(--ink)' }}>温度 (temperature)</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)' }}>{config.ai.temperature.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={config.ai.temperature}
              onChange={(e) => patch({ ai: { ...config.ai, temperature: Number(e.target.value) } })}
              style={{ width: '100%', accentColor: 'var(--amber)' }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13.5, color: 'var(--ink)' }}>最大 Token</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)' }}>{config.ai.maxTokens}</span>
            </div>
            <input
              type="range"
              min={256}
              max={8192}
              step={256}
              value={config.ai.maxTokens}
              onChange={(e) => patch({ ai: { ...config.ai, maxTokens: Number(e.target.value) } })}
              style={{ width: '100%', accentColor: 'var(--amber)' }}
            />
          </div>

          {/* 采集时自动运行的 AI 处理 */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <div style={{ ...fieldLabelText, marginBottom: 4 }}>采集时自动处理</div>
            <ToggleRow label="自动生成摘要" hint="采集后用对话模型生成正文摘要" checked={config.ai.autoGenerateSummary} onChange={(v) => patch({ ai: { ...config.ai, autoGenerateSummary: v } })} />
            <ToggleRow label="自动生成标签" hint="采集后用对话模型提取主题标签" checked={config.ai.autoGenerateTags} onChange={(v) => patch({ ai: { ...config.ai, autoGenerateTags: v } })} />
            <ToggleRow label="自动提炼要点" hint="采集后用对话模型提炼关键要点" checked={config.ai.autoGenerateKeyPoints} onChange={(v) => patch({ ai: { ...config.ai, autoGenerateKeyPoints: v } })} />
            <ToggleRow label="自动生成向量" hint="采集后生成语义向量以支持语义搜索" checked={config.ai.autoGenerateEmbedding} onChange={(v) => patch({ ai: { ...config.ai, autoGenerateEmbedding: v } })} />
          </div>
        </div>

        {/* ===== 数据管理 ===== */}
        <div style={sectionHeadRow}>
          <h2 style={sectionH2}>数据管理</h2>
          <span style={sectionHint}>导出 · 导入 · 备份 · 外观</span>
        </div>
        <div style={{ ...cardStyle, marginBottom: 34 }}>
          {/* 主题 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ ...fieldLabelText, marginBottom: 10 }}>主题</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {themeOptions.map(({ value, label, icon: Icon }) => {
                const active = config.app.theme === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => patch({ app: { ...config.app, theme: value } })}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '9px 14px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontFamily: 'var(--body)',
                      fontSize: 12.5,
                      border: `1px solid ${active ? 'var(--amber-line)' : 'var(--line)'}`,
                      background: active ? 'var(--amber-soft)' : 'var(--bg-0)',
                      color: active ? 'var(--amber)' : 'var(--ink-2)',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 默认搜索类型 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ ...fieldLabelText, marginBottom: 10 }}>默认搜索类型</div>
            <div style={{ display: 'flex', gap: 3, padding: 3, border: '1px solid var(--line)', borderRadius: 9, background: 'var(--bg-0)', width: 'fit-content' }}>
              {([
                { value: 'hybrid', label: '混合搜索' },
                { value: 'semantic', label: '语义搜索' },
                { value: 'fulltext', label: '关键词' },
              ] as const).map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => patch({ search: { ...config.search, defaultType: s.value } })}
                  style={segBtnStyle(config.search.defaultType === s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 自动备份 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 20,
              marginBottom: 20,
              borderBottom: '1px solid var(--line)',
            }}
          >
            <div>
              <div style={{ fontSize: 13.5, color: 'var(--ink)', marginBottom: 3 }}>自动备份</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>定期自动备份数据</div>
            </div>
            <div
              onClick={() => patch({ storage: { ...config.storage, autoBackup: !config.storage.autoBackup } })}
              style={{
                width: 44,
                height: 24,
                borderRadius: 20,
                background: config.storage.autoBackup ? 'var(--amber)' : 'var(--bg-3)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background .18s',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: config.storage.autoBackup ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left .18s',
                }}
              />
            </div>
          </div>

          {/* export / import / backup */}
          <div style={{ ...fieldLabelText, marginBottom: 10 }}>导出 / 导入 / 备份</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {([
              { fmt: 'json', label: '导出 JSON' },
              { fmt: 'markdown', label: '导出 Markdown' },
              { fmt: 'html', label: '导出 HTML' },
            ] as const).map(({ fmt, label }) => (
              <button
                key={fmt}
                type="button"
                onClick={() => void handleExport(fmt)}
                disabled={dataBusy}
                style={{ ...dataBtnStyle, opacity: dataBusy ? 0.5 : 1 }}
              >
                <Download className="w-4 h-4" /> {label}
              </button>
            ))}
            <button type="button" onClick={() => void handleImport()} disabled={dataBusy} style={{ ...dataBtnStyle, opacity: dataBusy ? 0.5 : 1 }}>
              <Upload className="w-4 h-4" /> 导入 JSON
            </button>
            <button type="button" onClick={() => void handleBackup()} disabled={dataBusy} style={{ ...dataBtnStyle, opacity: dataBusy ? 0.5 : 1 }}>
              <Archive className="w-4 h-4" /> 创建备份
            </button>
            <button type="button" onClick={() => void handleReindex()} disabled={dataBusy} title="为所有收藏重新生成语义向量（切换向量模型后需执行）" style={{ ...dataBtnStyle, opacity: dataBusy ? 0.5 : 1 }}>
              <RotateCcw className="w-4 h-4" /> 重建语义索引
            </button>
          </div>
          {dataMsg && (
            <p style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-2)' }}>{dataBusy ? '处理中...' : dataMsg}</p>
          )}
        </div>

        {/* ===== Save / Reset ===== */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 20px',
              borderRadius: 10,
              border: 'none',
              fontFamily: 'var(--body)',
              fontSize: 13,
              fontWeight: 500,
              cursor: saving ? 'default' : 'pointer',
              background: 'var(--amber)',
              color: '#20170A',
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存设置
          </button>
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 20px',
              borderRadius: 10,
              border: '1px solid var(--line)',
              background: 'var(--bg-0)',
              color: 'var(--ink-2)',
              fontFamily: 'var(--body)',
              fontSize: 13,
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.5 : 1,
            }}
          >
            <RotateCcw className="w-4 h-4" />
            恢复默认
          </button>
          {saveSuccess && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ok)' }}>
              <CheckCircle className="w-4 h-4" />
              已保存
            </span>
          )}
          {error && config && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--err)' }}>
              <AlertCircle className="w-4 h-4" />
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
