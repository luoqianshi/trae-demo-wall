import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Check, Sparkles, Clipboard } from 'lucide-react';
import { IPC_EVENT_CHANNELS, type CaptureStage, type CaptureProgressEvent } from '../../shared/types/ipc';

interface ImportTask {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage?: CaptureStage;
  stageMsg?: string;
  title?: string;
  error?: string;
}

type Engine = 'auto' | 'local' | 'firecrawl';

const PIPE_STEPS = [
  { label: '抓取网页', sub: '本地 / FireCrawl' },
  { label: '提取正文', sub: '去噪 · 净化' },
  { label: 'AI 处理', sub: '摘要 · 标签 · 向量' },
  { label: '归档保存', sub: '本地永久' },
];

// Map a real backend stage to the pipeline step index driving the visualization.
const STAGE_STEP: Record<CaptureStage, number> = {
  scraping: 0,
  extracting: 1,
  ai: 2,
  saving: 3,
  done: 4,
  error: -1,
};

const mono = (extra?: React.CSSProperties): React.CSSProperties => ({ fontFamily: 'var(--mono)', ...extra });
const cardStyle: React.CSSProperties = { padding: '22px', border: '1px solid var(--line)', borderRadius: '16px', background: 'var(--bg-1)' };
const amberBtn: React.CSSProperties = { padding: '0 26px', borderRadius: '11px', border: 'none', background: 'var(--amber)', color: '#20170A', fontFamily: 'var(--disp)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap' };

const ImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [inputUrl, setInputUrl] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [tasks, setTasks] = useState<ImportTask[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<Engine>('auto');
  const navigatedRef = useRef(false);

  // Subscribe to REAL backend capture events — progress, AI sub-steps,
  // completion and failure — and reconcile them onto tasks by URL. No faked
  // progress: the pipeline reflects what the main process is actually doing.
  useEffect(() => {
    const patchByUrl = (url: string, patch: Partial<ImportTask>): void => {
      setTasks((prev) => prev.map((t) =>
        t.url === url && t.status !== 'completed' && t.status !== 'failed'
          ? { ...t, ...patch }
          : t
      ));
    };

    const onProgress = (payload: unknown): void => {
      const e = payload as CaptureProgressEvent;
      if (!e?.url) return;
      patchByUrl(e.url, { status: 'processing', progress: e.progress, stage: e.stage, stageMsg: e.message });
    };
    const onCompleted = (payload: unknown): void => {
      const e = payload as CaptureProgressEvent;
      if (!e?.url) return;
      setTasks((prev) => prev.map((t) =>
        t.url === e.url && t.status !== 'failed'
          ? { ...t, status: 'completed', progress: 100, stage: 'done', title: e.title || t.title }
          : t
      ));
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        setTimeout(() => void navigate('/'), 1800);
      }
    };
    const onFailed = (payload: unknown): void => {
      const e = payload as CaptureProgressEvent;
      if (!e?.url) return;
      patchByUrl(e.url, { status: 'failed', progress: 0, stage: 'error', error: e.error || '采集失败' });
    };

    window.electronAPI.on(IPC_EVENT_CHANNELS.SCRAPER_PROGRESS, onProgress);
    window.electronAPI.on(IPC_EVENT_CHANNELS.AI_PROGRESS, onProgress);
    window.electronAPI.on(IPC_EVENT_CHANNELS.SCRAPER_COMPLETED, onCompleted);
    window.electronAPI.on(IPC_EVENT_CHANNELS.SCRAPER_FAILED, onFailed);

    return () => {
      window.electronAPI.removeAllListeners(IPC_EVENT_CHANNELS.SCRAPER_PROGRESS);
      window.electronAPI.removeAllListeners(IPC_EVENT_CHANNELS.AI_PROGRESS);
      window.electronAPI.removeAllListeners(IPC_EVENT_CHANNELS.SCRAPER_COMPLETED);
      window.electronAPI.removeAllListeners(IPC_EVENT_CHANNELS.SCRAPER_FAILED);
    };
  }, [navigate]);

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const normalizeUrl = (url: string): string => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    return url;
  };

  const handleSingleImport = useCallback(async () => {
    if (!inputUrl.trim()) {
      setError('请输入 URL');
      return;
    }
    const url = normalizeUrl(inputUrl.trim());
    if (!isValidUrl(url)) {
      setError('请输入有效的 URL');
      return;
    }
    setError(null);
    setIsImporting(true);
    navigatedRef.current = false;
    const taskId = `task-${Date.now()}`;
    // Start at the first stage with a small real-progress seed; the backend
    // events take over from here (scraping → extracting → ai → done).
    setTasks((prev) => [{ id: taskId, url, status: 'processing', progress: 5, stage: 'scraping' }, ...prev]);
    setInputUrl('');
    try {
      const result = await window.electronAPI.scraper.scrape(url);
      // The scrape runs asynchronously in the scheduler; a rejected invoke means
      // the task couldn't even be queued. Success is reported via the completed
      // event, so we only handle the synchronous-failure case here.
      if (!result.success) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'failed', progress: 0, stage: 'error', error: result.error || '导入失败' } : t)));
      }
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'failed', progress: 0, stage: 'error', error: err instanceof Error ? err.message : '导入失败' } : t)));
    } finally {
      setIsImporting(false);
    }
  }, [inputUrl]);

  const handleBatchImport = useCallback(async () => {
    const urls = batchInput
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0)
      .map((u) => normalizeUrl(u))
      .filter((u) => isValidUrl(u));
    if (urls.length === 0) {
      setError('请输入至少一个有效的 URL');
      return;
    }
    setError(null);
    setIsImporting(true);
    navigatedRef.current = false;
    const newTasks: ImportTask[] = urls.map((url, index) => ({ id: `task-${Date.now()}-${index}`, url, status: 'processing', progress: 5, stage: 'scraping' }));
    setTasks((prev) => [...newTasks, ...prev]);
    setBatchInput('');
    try {
      // Progress + completion are driven by the real capture events (by URL);
      // the batch response is only a fallback for tasks that failed to queue.
      const result = await window.electronAPI.scraper.scrapeBatch(urls);
      if (result.success && result.data) {
        result.data.forEach((task, index) => {
          const taskId = newTasks[index]?.id;
          if (taskId && task.status === 'failed') {
            setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'failed', progress: 0, stage: 'error', error: task.error || '导入失败' } : t)));
          }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量导入失败');
    } finally {
      setIsImporting(false);
    }
  }, [batchInput]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && activeTab === 'single') {
      e.preventDefault();
      void handleSingleImport();
    }
  };

  const latest = tasks[0];
  const progress = latest?.progress ?? 0;
  const status = latest?.status;
  const done = status === 'completed';
  const processing = status === 'processing' || status === 'pending';
  const statusText = !latest
    ? '待命 · 粘贴链接开始'
    : processing
    ? (latest?.stageMsg ? `${latest.stageMsg}…` : '处理中…')
    : done ? '已完成' : '失败';
  const statusColor = done ? 'var(--ok)' : status === 'failed' ? 'var(--err)' : 'var(--ink-3)';
  // Step index comes from the real backend stage, not a faked percentage.
  const activeStep = done ? 4 : processing ? (latest?.stage ? STAGE_STEP[latest.stage] : 0) : -1;

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '34px 40px 70px', maxWidth: '860px' }}>
        <div style={mono({ fontSize: '11px', letterSpacing: '0.18em', color: 'var(--amber)', marginBottom: '10px' })}>CAPTURE · 内容采集</div>
        <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 600, fontSize: '32px', letterSpacing: '-0.02em', margin: '0 0 8px', color: 'var(--ink)' }}>采集内容到永久库</h1>
        <p style={{ fontSize: '14px', color: 'var(--ink-2)', margin: '0 0 24px', lineHeight: 1.6 }}>粘贴任意链接，系统会自动抓取正文、生成摘要与标签，并永久保存在本地——即使原文失效也能随时查看。</p>

        {/* tab toggle */}
        <div style={{ display: 'inline-flex', gap: '3px', padding: '3px', border: '1px solid var(--line)', borderRadius: '9px', background: 'var(--bg-1)', marginBottom: '18px' }}>
          {(['single', 'batch'] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: 'var(--body)', fontSize: '12.5px', background: activeTab === t ? 'var(--amber-soft)' : 'transparent', color: activeTab === t ? 'var(--amber)' : 'var(--ink-2)' }}>{t === 'single' ? '单个链接' : '批量导入'}</button>
          ))}
        </div>

        {/* URL input card */}
        <div style={{ ...cardStyle, marginBottom: '22px' }}>
          {activeTab === 'single' ? (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <input value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} onKeyDown={handleKeyPress} placeholder="粘贴文章 / 微信 / GitHub 链接…" style={{ flex: 1, padding: '14px 16px', borderRadius: '11px', border: '1px solid var(--line)', background: 'var(--bg-0)', color: 'var(--ink)', fontFamily: 'var(--mono)', fontSize: '13px', outline: 'none' }} />
              <button onClick={() => void handleSingleImport()} disabled={isImporting} style={{ ...amberBtn, opacity: isImporting ? 0.6 : 1 }}>开始采集</button>
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <textarea value={batchInput} onChange={(e) => setBatchInput(e.target.value)} placeholder="每行一个链接…" rows={5} style={{ width: '100%', padding: '14px 16px', borderRadius: '11px', border: '1px solid var(--line)', background: 'var(--bg-0)', color: 'var(--ink)', fontFamily: 'var(--mono)', fontSize: '13px', outline: 'none', resize: 'vertical', marginBottom: '12px' }} />
              <button onClick={() => void handleBatchImport()} disabled={isImporting} style={{ ...amberBtn, opacity: isImporting ? 0.6 : 1 }}>批量采集</button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={mono({ fontSize: '10px', letterSpacing: '0.1em', color: 'var(--ink-3)' })}>抓取引擎</span>
            <div style={{ display: 'flex', gap: '3px', padding: '3px', border: '1px solid var(--line)', borderRadius: '9px', background: 'var(--bg-0)' }}>
              {(['auto', 'local', 'firecrawl'] as const).map((e) => (
                <button key={e} onClick={() => setEngine(e)} style={{ padding: '5px 13px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: 'var(--body)', fontSize: '12px', background: engine === e ? 'var(--amber-soft)' : 'transparent', color: engine === e ? 'var(--amber)' : 'var(--ink-2)' }}>{e === 'auto' ? '自动' : e === 'local' ? '本地抓取' : 'FireCrawl'}</button>
              ))}
            </div>
            <span style={mono({ fontSize: '10px', color: 'var(--ink-3)', marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px' })}><Clipboard size={13} /> 可从剪贴板自动检测</span>
          </div>
          {error && <p style={{ fontSize: '12px', color: 'var(--err)', margin: '12px 0 0' }}>{error}</p>}
        </div>

        {/* Pipeline */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={mono({ fontSize: '10px', letterSpacing: '0.14em', color: 'var(--ink-3)' })}>处理流程</span>
            <span style={mono({ fontSize: '11px', color: statusColor })}>{statusText}</span>
          </div>
          <div style={{ position: 'relative', height: '3px', background: 'var(--bg-3)', borderRadius: '3px', margin: '0 30px 22px' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${progress}%`, background: 'var(--amber)', borderRadius: '3px', transition: 'width .5s cubic-bezier(.3,.7,.3,1)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
            {PIPE_STEPS.map((s, i) => {
              const stepDone = activeStep > i || done;
              const stepActive = activeStep === i && !done;
              const ring = stepDone ? 'var(--amber-line)' : stepActive ? 'var(--amber-line)' : 'var(--line)';
              const bg = stepDone ? 'var(--amber-soft)' : 'var(--bg-0)';
              const fg = stepDone || stepActive ? 'var(--amber)' : 'var(--ink-3)';
              return (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ width: '46px', height: '46px', margin: '0 auto 12px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${ring}`, background: bg, color: fg, transition: 'all .3s' }}>
                    {stepDone ? <Check size={18} /> : stepActive ? <Loader2 size={18} className="animate-spin" /> : <span style={mono({ fontSize: '13px', fontWeight: 600 })}>{i + 1}</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--disp)', fontWeight: 500, fontSize: '13.5px', color: stepDone || stepActive ? 'var(--ink)' : 'var(--ink-3)', marginBottom: '4px' }}>{s.label}</div>
                  <div style={mono({ fontSize: '9.5px', color: 'var(--ink-3)', lineHeight: 1.4 })}>{s.sub}</div>
                </div>
              );
            })}
          </div>
          {done && (
            <div style={{ marginTop: '24px', padding: '18px', borderRadius: '12px', border: '1px solid var(--amber-line)', background: 'var(--amber-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Sparkles size={15} style={{ color: 'var(--amber)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>采集完成 · 已永久保存到本地库</span>
                <button onClick={() => void navigate('/')} style={{ marginLeft: 'auto', fontFamily: 'var(--disp)', fontWeight: 600, fontSize: '12px', color: 'var(--amber)', background: 'none', border: 'none', cursor: 'pointer' }}>查看详情 →</button>
              </div>
              <p style={{ fontSize: '12.5px', lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>{latest?.title ? `《${latest.title}》` : ''}原文正文、HTML 快照与语义向量均已归档。</p>
            </div>
          )}
        </div>

        {/* Batch task list */}
        {activeTab === 'batch' && tasks.length > 0 && (
          <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tasks.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--line)', background: 'var(--bg-1)' }}>
                <span style={mono({ fontSize: '11px', color: 'var(--ink-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{t.url}</span>
                <span style={mono({ fontSize: '10px', color: t.status === 'completed' ? 'var(--ok)' : t.status === 'failed' ? 'var(--err)' : 'var(--ink-3)' })}>{t.status === 'completed' ? '完成' : t.status === 'failed' ? '失败' : '处理中'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportPage;
