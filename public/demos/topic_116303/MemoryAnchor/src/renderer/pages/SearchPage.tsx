import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type SearchType = 'hybrid' | 'semantic' | 'fulltext';

interface SearchResultItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  tags: string[];
  isFavorite: boolean;
  isRead: boolean;
  createdAt: string;
  score?: number;
}

interface SearchState {
  results: SearchResultItem[];
  total: number;
  page: number;
  pageSize: number;
  searchTimeMs: number;
  isSearching: boolean;
  error?: string;
}

const MODES: { type: SearchType; label: string }[] = [
  { type: 'hybrid', label: '混合搜索' },
  { type: 'semantic', label: '语义搜索' },
  { type: 'fulltext', label: '关键词搜索' },
];

const mono = (extra?: React.CSSProperties): React.CSSProperties => ({ fontFamily: 'var(--mono)', ...extra });

// Source-type filter options: display label -> URL-derived source kind.
const SOURCE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Web', value: 'web' },
  { label: '微信', value: 'wechat' },
  { label: 'GitHub', value: 'github' },
  { label: '本地', value: 'local' },
];

function domainOf(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function scoreColor(score?: number): string {
  if (score === undefined) return 'var(--ink-2)';
  if (score >= 0.8) return 'var(--ok)';
  if (score >= 0.5) return 'var(--amber)';
  return 'var(--ink-2)';
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('hybrid');
  const [sources, setSources] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [state, setState] = useState<SearchState>({ results: [], total: 0, page: 1, pageSize: 20, searchTimeMs: 0, isSearching: false });

  useEffect(() => {
    const saved = localStorage.getItem('search-history');
    if (saved) {
      try { setHistory(JSON.parse(saved) as string[]); } catch { /* ignore */ }
    }
  }, []);

  // Core search with sources passed explicitly (so a checkbox toggle can search
  // with the new set immediately, before the state update lands).
  const performSearchWith = useCallback(async (searchQuery: string, srcs: string[], page = 1) => {
    if (!searchQuery.trim()) return;
    setState((prev) => ({ ...prev, isSearching: true, error: undefined }));
    try {
      const result = await window.electronAPI.search.search({
        query: searchQuery,
        searchType,
        page,
        pageSize: 20,
        filters: srcs.length > 0 ? { sourceType: srcs } : undefined,
      });
      if (!result.success || !result.data) throw new Error(result.error || '搜索失败');
      const data = result.data;
      setState({ results: data.items, total: data.total, page: data.page, pageSize: data.pageSize, searchTimeMs: data.searchTimeMs ?? 0, isSearching: false });
      setHistory((prev) => {
        const next = [searchQuery, ...prev.filter((h) => h !== searchQuery)].slice(0, 20);
        localStorage.setItem('search-history', JSON.stringify(next));
        return next;
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isSearching: false, error: error instanceof Error ? error.message : '搜索失败' }));
    }
  }, [searchType]);

  const performSearch = useCallback(
    (searchQuery: string, page = 1) => performSearchWith(searchQuery, sources, page),
    [performSearchWith, sources]
  );

  // Auto-run a query passed via ?q=
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      void performSearch(q);
    } else {
      inputRef.current?.focus();
    }
    // run once on mount for the initial q
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) void performSearch(query.trim());
  }, [query, performSearch]);

  const hotTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of state.results) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t);
  }, [state.results]);

  const railLabel: React.CSSProperties = { ...mono({ fontSize: '10px', letterSpacing: '0.16em', color: 'var(--ink-3)', marginBottom: '14px' }) };

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {/* Hero */}
      <div style={{ padding: '34px 40px 24px', borderBottom: '1px solid var(--line)', background: 'var(--bg-1)' }}>
        <div style={mono({ fontSize: '11px', letterSpacing: '0.18em', color: 'var(--amber)', marginBottom: '14px' })}>SEMANTIC RETRIEVAL · 语义检索</div>
        <form onSubmit={submit} style={{ display: 'flex', gap: '12px', maxWidth: '820px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="用自然语言描述你要找的内容…"
              style={{ width: '100%', padding: '15px 16px 15px 46px', borderRadius: '12px', border: '1px solid var(--amber-line)', background: 'var(--bg-0)', color: 'var(--ink)', fontFamily: 'var(--body)', fontSize: '15px', outline: 'none' }}
            />
          </div>
          <button type="submit" disabled={!query.trim() || state.isSearching} style={{ padding: '0 26px', borderRadius: '12px', border: 'none', background: 'var(--amber)', color: '#20170A', fontFamily: 'var(--disp)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', opacity: !query.trim() || state.isSearching ? 0.6 : 1 }}>
            {state.isSearching ? '检索中…' : '检索'}
          </button>
        </form>

        {/* interpreted query echo */}
        {query.trim() && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
            <span style={mono({ fontSize: '10px', letterSpacing: '0.1em', color: 'var(--ink-3)' })}>AI 理解 →</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '4px 11px', borderRadius: '20px', background: 'var(--amber-soft)', border: '1px solid var(--amber-line)', color: 'var(--amber)' }}>查询：{query.trim()}</span>
            <span style={{ fontSize: '12px', padding: '4px 11px', borderRadius: '20px', background: 'var(--bg-3)', color: 'var(--ink-2)' }}>模式：{MODES.find((m) => m.type === searchType)?.label}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '3px', padding: '3px', border: '1px solid var(--line)', borderRadius: '10px', background: 'var(--bg-0)' }}>
            {MODES.map((m) => (
              <button key={m.type} onClick={() => setSearchType(m.type)} style={{ padding: '7px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontFamily: 'var(--body)', fontSize: '13px', background: searchType === m.type ? 'var(--amber-soft)' : 'transparent', color: searchType === m.type ? 'var(--amber)' : 'var(--ink-2)' }}>{m.label}</button>
            ))}
          </div>
          {(state.results.length > 0 || state.total > 0) && (
            <div style={mono({ fontSize: '11px', color: 'var(--ink-3)' })}>找到 <span style={{ color: 'var(--ink)' }}>{state.total}</span> 个结果 · 用时 <span style={{ color: 'var(--amber)' }}>{(state.searchTimeMs / 1000).toFixed(1)}s</span></div>
          )}
        </div>
      </div>

      {/* Results + filters */}
      <div style={{ display: 'flex' }}>
        <aside style={{ width: '236px', flexShrink: 0, padding: '26px 22px', borderRight: '1px solid var(--line)' }}>
          <div style={railLabel}>来源类型</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '28px' }}>
            {SOURCE_OPTIONS.map(({ label, value }) => (
              <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--ink-2)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={sources.includes(value)}
                  onChange={(e) => {
                    const next = e.target.checked ? [...sources, value] : sources.filter((v) => v !== value);
                    setSources(next);
                    if (query.trim()) void performSearchWith(query, next);
                  }}
                  style={{ accentColor: 'var(--amber)', width: '15px', height: '15px' }}
                />{label}
              </label>
            ))}
          </div>
          <div style={railLabel}>热门标签</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            {hotTags.length === 0 ? (
              <span style={mono({ fontSize: '11px', color: 'var(--ink-3)' })}>—</span>
            ) : hotTags.map((t) => (
              <span key={t} onClick={() => { setQuery(t); void performSearch(t); }} style={mono({ fontSize: '11px', padding: '3px 10px', borderRadius: '7px', background: 'var(--bg-3)', color: 'var(--ink-2)', cursor: 'pointer' })}>{t}</span>
            ))}
          </div>
        </aside>

        <div className="stagger" style={{ flex: 1, minWidth: 0, padding: '24px 40px 60px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {state.error && <div style={{ fontSize: '13px', color: 'var(--err)', padding: '8px 0' }}>{state.error}</div>}

          {state.results.map((r, i) => {
            const pct = r.score !== undefined ? Math.round(r.score * 100) : undefined;
            return (
              <div key={r.id} onClick={() => void navigate(`/collection/${r.id}`)} style={{ display: 'flex', gap: '20px', padding: '18px 20px', borderRadius: '13px', border: '1px solid var(--line)', background: 'var(--bg-1)', cursor: 'pointer' }}>
                <div style={{ width: '60px', flexShrink: 0, textAlign: 'center' }}>
                  <div style={mono({ fontSize: '11px', color: 'var(--ink-3)', marginBottom: '8px' })}>#{i + 1}</div>
                  <div style={mono({ fontSize: '19px', fontWeight: 600, color: scoreColor(r.score), lineHeight: 1 })}>{pct !== undefined ? pct : '—'}</div>
                  <div style={mono({ fontSize: '8.5px', letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: '4px' })}>相关度</div>
                  <div style={{ height: '3px', borderRadius: '3px', background: 'var(--bg-3)', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct ?? 0}%`, background: scoreColor(r.score), borderRadius: '3px' }} />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '8px' }}>
                    <span style={mono({ fontSize: '10px', color: 'var(--ink-3)' })}>{domainOf(r.url)} · {fmtDate(r.createdAt)}</span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--disp)', fontWeight: 500, fontSize: '17px', lineHeight: 1.35, margin: '0 0 8px', color: 'var(--ink)' }}>{r.title}</h3>
                  {r.description && <p style={{ fontSize: '13px', lineHeight: 1.65, color: 'var(--ink-2)', margin: '0 0 11px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.description}</p>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {r.tags.slice(0, 4).map((t, idx) => (
                      <span key={idx} style={mono({ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'var(--bg-3)', color: 'var(--ink-2)' })}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {!state.isSearching && state.results.length === 0 && !state.error && query.trim() && (
            <div style={mono({ fontSize: '13px', color: 'var(--ink-3)', letterSpacing: '0.08em', padding: '48px 0', textAlign: 'center' })}>未找到相关内容 · 试试其他关键词或搜索类型</div>
          )}

          {!state.isSearching && state.results.length === 0 && !query.trim() && history.length > 0 && (
            <div>
              <div style={railLabel}>最近搜索</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {history.slice(0, 10).map((h, i) => (
                  <button key={i} onClick={() => { setQuery(h); void performSearch(h); }} style={mono({ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--bg-1)', color: 'var(--ink-2)', cursor: 'pointer' })}>{h}</button>
                ))}
              </div>
            </div>
          )}

          {state.total > state.pageSize && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => void performSearch(query, state.page - 1)} disabled={state.page <= 1} style={mono({ fontSize: '12px', padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--bg-1)', color: 'var(--ink-2)', cursor: 'pointer', opacity: state.page <= 1 ? 0.5 : 1 })}>上一页</button>
              <span style={mono({ fontSize: '12px', color: 'var(--ink-3)' })}>{state.page} / {Math.ceil(state.total / state.pageSize)}</span>
              <button onClick={() => void performSearch(query, state.page + 1)} disabled={state.page >= Math.ceil(state.total / state.pageSize)} style={mono({ fontSize: '12px', padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--bg-1)', color: 'var(--ink-2)', cursor: 'pointer', opacity: state.page >= Math.ceil(state.total / state.pageSize) ? 0.5 : 1 })}>下一页</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
