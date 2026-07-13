import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Eye, EyeOff, Plus, X, RotateCw, Sparkles, Loader2, Trash2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import * as Diff from 'diff';
import VersionCompareModal from './detail/VersionCompareModal';

interface VersionInfo {
  id: string;
  collectionId: string;
  versionNumber: number;
  title?: string;
  content: string;
  htmlContent?: string;
  checksum: string;
  wordCount?: number;
  createdAt: string;
  changeDescription?: string;
}

interface CollectionDetail {
  id: string;
  url: string;
  title: string;
  description?: string;
  content?: string;
  htmlContent?: string;
  tags: string[];
  notes?: string;
  isFavorite: boolean;
  isRead: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  sourceType?: 'web' | 'file' | 'note';
  favicon?: string;
  author?: string;
  summary?: string;
  keyPoints?: string[];
}

const mono = (extra?: React.CSSProperties): React.CSSProperties => ({ fontFamily: 'var(--mono)', ...extra });
const railLabel: React.CSSProperties = { ...mono({ fontSize: '10px', letterSpacing: '0.14em', color: 'var(--ink-3)', marginBottom: '12px' }) };

const SOURCE_META: Record<string, { label: string; color: string }> = {
  web: { label: 'WEB', color: 'var(--info)' },
  file: { label: '本地', color: 'var(--amber)' },
  note: { label: '笔记', color: 'var(--ok)' },
};

const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareData, setCompareData] = useState<{
    versionA: VersionInfo;
    versionB: VersionInfo;
    diff: Diff.Change[];
    changes: { additions: number; deletions: number };
  } | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const fetchVersions = async (collectionId: string) => {
    try {
      const result = await window.electronAPI.version.list(collectionId, 1, 50);
      if (result.success && result.data) {
        setVersions(result.data.items || []);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!id) return;
    const fetchCollection = async (collectionId: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await window.electronAPI.collection.get(collectionId);
        if (result.success && result.data) {
          setCollection(result.data);
        } else {
          setError(result.error || '获取收藏详情失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取收藏详情失败');
      } finally {
        setLoading(false);
      }
    };
    void fetchCollection(id);
    void fetchVersions(id);
  }, [id]);

  const handleToggleFavorite = useCallback(async () => {
    if (!collection) return;
    try {
      const result = await window.electronAPI.collection.toggleFavorite(collection.id);
      if (result.success && result.data) setCollection((prev) => (prev ? { ...prev, isFavorite: result.data!.isFavorite } : prev));
    } catch { /* ignore */ }
  }, [collection]);

  const handleToggleRead = useCallback(async () => {
    if (!collection) return;
    try {
      const result = await window.electronAPI.collection.markAsRead(collection.id);
      if (result.success && result.data) setCollection((prev) => (prev ? { ...prev, isRead: result.data!.isRead } : prev));
    } catch { /* ignore */ }
  }, [collection]);

  const handleDelete = useCallback(async () => {
    if (!collection) return;
    if (!window.confirm(`将《${collection.title || collection.url}》移到回收站？`)) return;
    try {
      const result = await window.electronAPI.collection.delete(collection.id);
      if (result.success) void navigate('/');
    } catch { /* ignore */ }
  }, [collection, navigate]);

  const [reprocessing, setReprocessing] = useState(false);
  const handleReprocess = useCallback(async () => {
    if (!collection || reprocessing) return;
    setReprocessing(true);
    try {
      const result = await window.electronAPI.ai.reprocess(collection.id);
      if (result.success && result.data) {
        setCollection(result.data);
      }
    } catch { /* ignore */ } finally {
      setReprocessing(false);
    }
  }, [collection, reprocessing]);

  const handleAddTag = useCallback(async () => {
    if (!collection || !newTag.trim()) return;
    const tagToAdd = newTag.trim();
    if (!collection.tags.includes(tagToAdd)) {
      try {
        const result = await window.electronAPI.collection.update(collection.id, { tags: [...collection.tags, tagToAdd] });
        if (result.success && result.data) setCollection((prev) => (prev ? { ...prev, tags: result.data!.tags } : prev));
      } catch { /* ignore */ }
    }
    setNewTag('');
    setShowTagInput(false);
  }, [collection, newTag]);

  const handleRemoveTag = useCallback(async (tagToRemove: string) => {
    if (!collection) return;
    try {
      const result = await window.electronAPI.collection.update(collection.id, { tags: collection.tags.filter((t) => t !== tagToRemove) });
      if (result.success && result.data) setCollection((prev) => (prev ? { ...prev, tags: result.data!.tags } : prev));
    } catch { /* ignore */ }
  }, [collection]);

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); void handleAddTag(); }
    else if (e.key === 'Escape') { setShowTagInput(false); setNewTag(''); }
  };

  const compareVersions = async (idA: string, idB: string) => {
    if (!collection) return;
    setCompareLoading(true);
    setShowCompareModal(true);
    try {
      const result = await window.electronAPI.version.compare(collection.id, idA, idB);
      if (result.success && result.data) {
        const vA = result.data.versionA;
        const vB = result.data.versionB;
        const textDiff = Diff.diffLines(vA.content || '', vB.content || '');
        const additions = textDiff.filter((p) => p.added).reduce((acc, p) => acc + p.value.split('\n').length - 1, 0);
        const deletions = textDiff.filter((p) => p.removed).reduce((acc, p) => acc + p.value.split('\n').length - 1, 0);
        setCompareData({ versionA: vA, versionB: vB, diff: textDiff, changes: { additions, deletions } });
      }
    } catch { /* ignore */ } finally {
      setCompareLoading(false);
    }
  };

  const handleViewDiff = () => {
    // Compare the previous version against the newest.
    if (versions.length < 2) return;
    const newest = versions[0];
    const previous = versions[1];
    if (newest && previous) void compareVersions(previous.id, newest.id);
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!collection) return;
    setRestoring(true);
    try {
      const result = await window.electronAPI.version.restore(collection.id, versionId);
      if (result.success && result.data) {
        setCollection(result.data);
        await fetchVersions(collection.id);
        setShowCompareModal(false);
        setCompareData(null);
      }
    } catch { /* ignore */ } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };
  const getDomain = (url: string) => {
    try { return new URL(url).hostname; } catch { return url; }
  };

  // Render the article body. `content` is the canonical body (markdown from
  // FireCrawl, or HTML that marked passes through); sanitize before injecting.
  // Fall back to the raw HTML snapshot only when there's no content.
  const articleHtml = React.useMemo(() => {
    const md = collection?.content;
    if (md && md.trim()) {
      return DOMPurify.sanitize(marked.parse(md) as string);
    }
    if (collection?.htmlContent) {
      return DOMPurify.sanitize(collection.htmlContent);
    }
    return '';
  }, [collection?.content, collection?.htmlContent]);

  if (loading) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={24} className="animate-spin" style={{ color: 'var(--amber)' }} /></div>;
  }
  if (error || !collection) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <p style={{ color: 'var(--err)', fontSize: '14px' }}>{error || '收藏不存在'}</p>
        <button onClick={() => void navigate('/')} style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', background: 'var(--amber)', color: '#20170A', fontFamily: 'var(--disp)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>返回全部收藏</button>
      </div>
    );
  }

  const src = SOURCE_META[collection.sourceType ?? 'web'] ?? SOURCE_META.web;
  const readingMin = collection.content ? Math.max(1, Math.round(collection.content.length / 400)) : undefined;
  const newVersionCount = Math.max(0, versions.length - 1);

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <style>{`.ma-article h1,.ma-article h2,.ma-article h3{font-family:var(--disp);font-weight:600;color:var(--ink);margin:34px 0 14px;line-height:1.3;}
      .ma-article h2{font-size:20px;} .ma-article h3{font-size:17px;}
      .ma-article p{margin:0 0 20px;color:var(--ink);} .ma-article a{color:var(--amber);}
      .ma-article blockquote{margin:0 0 20px;padding:14px 20px;border-left:2px solid var(--amber);background:var(--bg-1);border-radius:0 10px 10px 0;color:var(--ink-2);}
      .ma-article ul,.ma-article ol{margin:0 0 20px;padding-left:22px;color:var(--ink);} .ma-article li{margin:4px 0;}
      .ma-article code{font-family:var(--mono);font-size:.9em;background:var(--bg-3);padding:1px 5px;border-radius:5px;}
      .ma-article pre{margin:0 0 20px;padding:16px 18px;background:var(--bg-3);border-radius:10px;overflow-x:auto;}
      .ma-article pre code{background:none;padding:0;font-size:13px;line-height:1.6;}
      .ma-article table{width:100%;border-collapse:collapse;margin:0 0 20px;font-size:14px;}
      .ma-article th,.ma-article td{border:1px solid var(--line);padding:8px 12px;text-align:left;}
      .ma-article h1{font-size:24px;} .ma-article hr{border:none;border-top:1px solid var(--line);margin:28px 0;}
      .ma-article img{max-width:100%;border-radius:10px;}`}</style>

      <div style={{ display: 'flex' }}>
        {/* Article column */}
        <div style={{ flex: 1, minWidth: 0, padding: '30px 44px 70px', maxWidth: '820px' }}>
          <button onClick={() => void navigate(-1)} style={mono({ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '11px', letterSpacing: '0.08em', color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '24px' })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l-7-7 7-7M5 12h14" /></svg>
            返回全部收藏
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={mono({ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', letterSpacing: '0.06em', padding: '4px 10px', borderRadius: '6px', background: 'var(--bg-3)', color: src.color })}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor' }} />{src.label}
            </span>
            <span style={mono({ fontSize: '11px', color: 'var(--ink-3)' })}>#{collection.id.slice(-4).toUpperCase()} · 已归档</span>
            <span style={mono({ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', padding: '4px 10px', borderRadius: '6px', background: 'var(--amber-soft)', color: 'var(--amber)' })}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--amber)' }} />本地永久保存
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 600, fontSize: '30px', lineHeight: 1.25, letterSpacing: '-0.02em', margin: '0 0 18px', color: 'var(--ink)' }}>{collection.title}</h1>

          <div style={mono({ display: 'flex', flexWrap: 'wrap', gap: '18px', fontSize: '11px', color: 'var(--ink-3)', paddingBottom: '22px', marginBottom: '28px', borderBottom: '1px solid var(--line)' })}>
            <a href={collection.url} target="_blank" rel="noreferrer" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}>{getDomain(collection.url)}</a>
            <span>{formatDate(collection.createdAt)} 收藏</span>
            {readingMin !== undefined && <span>约 {readingMin} 分钟阅读</span>}
            <div style={{ flex: 1 }} />
            <button onClick={() => void handleToggleFavorite()} title="收藏" style={{ background: 'none', border: 'none', cursor: 'pointer', color: collection.isFavorite ? 'var(--amber)' : 'var(--ink-3)', padding: 0, display: 'inline-flex' }}><Star size={14} fill={collection.isFavorite ? 'currentColor' : 'none'} /></button>
            <button onClick={() => void handleToggleRead()} title={collection.isRead ? '标记未读' : '标记已读'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: collection.isRead ? 'var(--ok)' : 'var(--ink-3)', padding: 0, display: 'inline-flex' }}>{collection.isRead ? <Eye size={14} /> : <EyeOff size={14} />}</button>
            <button onClick={() => void handleDelete()} title="移到回收站" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0, display: 'inline-flex' }}><Trash2 size={14} /></button>
          </div>

          <div className="ma-article" style={{ fontSize: '15px', lineHeight: 1.85, color: 'var(--ink)' }}>
            {articleHtml ? (
              <div dangerouslySetInnerHTML={{ __html: articleHtml }} />
            ) : (
              <p style={{ color: 'var(--ink-3)' }}>暂无正文内容</p>
            )}
          </div>
        </div>

        {/* Right rail */}
        <aside style={{ width: '340px', flexShrink: 0, borderLeft: '1px solid var(--line)', padding: '30px 26px', position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={16} style={{ color: 'var(--amber)' }} />
            <span style={mono({ fontSize: '10px', letterSpacing: '0.14em', color: 'var(--amber)' })}>AI 摘要</span>
            <button
              onClick={() => void handleReprocess()}
              disabled={reprocessing}
              title="重新生成摘要 / 标签 / 要点 / 向量"
              style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: reprocessing ? 'default' : 'pointer', color: 'var(--ink-3)', fontFamily: 'var(--body)', fontSize: 11 }}
            >
              {reprocessing ? <Loader2 size={13} className="animate-spin" /> : <RotateCw size={13} />}
              {reprocessing ? '生成中…' : '重新生成'}
            </button>
          </div>
          <p style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--ink-2)', margin: '0 0 20px', padding: '14px', borderRadius: '11px', background: 'var(--bg-1)', border: '1px solid var(--line)' }}>
            {collection.summary || collection.description || '暂无 AI 摘要。配置 AI 后端后可自动生成。'}
          </p>

          {collection.keyPoints && collection.keyPoints.length > 0 && (
            <>
              <div style={railLabel}>关键要点</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {collection.keyPoints.map((kp, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '13px', color: 'var(--ink-2)', lineHeight: 1.5 }}>
                    <span style={mono({ color: 'var(--amber)', flexShrink: 0 })}>{String(i + 1).padStart(2, '0')}</span>{kp}
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ ...railLabel, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>标签</span>
            <button onClick={() => setShowTagInput(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'inline-flex' }}><Plus size={13} /></button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '24px' }}>
            {collection.tags.map((tag) => (
              <span key={tag} style={mono({ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '3px 10px', borderRadius: '7px', background: 'var(--bg-3)', color: 'var(--ink-2)' })}>
                {tag}
                <X size={11} style={{ cursor: 'pointer' }} onClick={() => void handleRemoveTag(tag)} />
              </span>
            ))}
            {showTagInput && (
              <input autoFocus value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={handleTagKeyDown} onBlur={() => { setShowTagInput(false); setNewTag(''); }} placeholder="新标签…" style={mono({ fontSize: '11px', padding: '3px 8px', borderRadius: '7px', border: '1px solid var(--amber-line)', background: 'var(--bg-0)', color: 'var(--ink)', outline: 'none', width: '90px' })} />
            )}
          </div>

          {newVersionCount > 0 && (
            <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--amber-line)', background: 'var(--amber-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <RotateCw size={15} style={{ color: 'var(--amber)' }} />
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)' }}>检测到 {newVersionCount} 个新版本</span>
              </div>
              <p style={{ fontSize: '12px', lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 12px' }}>原文在收藏后有更新。本地已保留每个历史版本。</p>
              <button onClick={handleViewDiff} style={{ width: '100%', padding: '9px', borderRadius: '9px', border: 'none', background: 'var(--amber)', color: '#20170A', fontFamily: 'var(--disp)', fontWeight: 600, fontSize: '12.5px', cursor: 'pointer' }}>查看版本差异 →</button>
            </div>
          )}
        </aside>
      </div>

      <VersionCompareModal
        open={showCompareModal}
        data={compareData}
        loading={compareLoading}
        restoring={restoring}
        formatDate={formatDate}
        onClose={() => { setShowCompareModal(false); setCompareData(null); }}
        onRestore={(versionId) => void handleRestoreVersion(versionId)}
      />
    </div>
  );
};

export default DetailPage;
