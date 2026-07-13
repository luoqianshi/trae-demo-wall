import React from 'react';
import * as Diff from 'diff';

/** Minimal version reference the compare modal renders. */
export interface CompareVersionRef {
  id: string;
  versionNumber: number;
  createdAt: string;
}

export interface CompareData {
  versionA: CompareVersionRef;
  versionB: CompareVersionRef;
  diff: Diff.Change[];
  changes: { additions: number; deletions: number };
}

interface VersionCompareModalProps {
  open: boolean;
  data: CompareData | null;
  loading: boolean;
  restoring: boolean;
  formatDate: (dateStr: string) => string;
  onClose: () => void;
  onRestore: (versionId: string) => void;
}

const mono = (extra?: React.CSSProperties): React.CSSProperties => ({ fontFamily: 'var(--mono)', ...extra });

/**
 * Presentational modal that renders a diff between two collection versions.
 * Extracted from DetailPage to keep that component focused; all state lives in
 * the parent and is passed in via props.
 */
const VersionCompareModal: React.FC<VersionCompareModalProps> = ({
  open,
  data,
  loading,
  restoring,
  formatDate,
  onClose,
  onRestore,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        background: 'rgba(0,0,0,0.55)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1060px',
          maxHeight: '86vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '16px',
          border: '1px solid var(--line)',
          background: 'var(--bg-0)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '20px',
            padding: '24px 30px 20px',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div>
            <div style={mono({ fontSize: '11px', letterSpacing: '0.18em', color: 'var(--amber)', marginBottom: '8px' })}>
              VERSION DIFF · 版本追踪
            </div>
            <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 600, fontSize: '22px', letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)' }}>
              版本差异对比
            </h1>
          </div>
          <button
            onClick={onClose}
            aria-label="关闭"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              border: '1px solid var(--line)',
              background: 'var(--bg-1)',
              color: 'var(--ink-3)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '26px 30px 30px' }}>
          {loading ? (
            <div style={mono({ fontSize: '12px', letterSpacing: '0.12em', color: 'var(--ink-3)', padding: '60px 0', textAlign: 'center' })}>
              加载中…
            </div>
          ) : data ? (
            <>
              {/* Version timeline */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0,
                  marginBottom: '22px',
                  padding: '16px 20px',
                  border: '1px solid var(--line)',
                  borderRadius: '13px',
                  background: 'var(--bg-1)',
                  overflowX: 'auto',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '22px', flexShrink: 0 }}>
                  <span style={mono({ fontSize: '10px', color: 'var(--ink-3)' })}>v{data.versionA.versionNumber} · 旧版本</span>
                  <span style={mono({ fontSize: '12px', color: 'var(--ink-2)' })}>{formatDate(data.versionA.createdAt)}</span>
                </div>
                <div style={{ flex: 1, height: '1px', background: 'var(--amber-line)', minWidth: '40px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '22px', flexShrink: 0 }}>
                  <span style={mono({ fontSize: '10px', color: 'var(--amber)', display: 'inline-flex', alignItems: 'center', gap: '6px' })}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--amber)' }} />
                    v{data.versionB.versionNumber} · 最新
                  </span>
                  <span style={mono({ fontSize: '12px', color: 'var(--ink)' })}>{formatDate(data.versionB.createdAt)}</span>
                </div>
                <div style={{ flex: 1, minWidth: '20px' }} />
                <div style={{ display: 'flex', gap: '22px', paddingLeft: '22px', borderLeft: '1px solid var(--line)', flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={mono({ fontSize: '16px', fontWeight: 600, color: 'var(--ok)' })}>+{data.changes.additions}</div>
                    <div style={mono({ fontSize: '9px', color: 'var(--ink-3)' })}>新增</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={mono({ fontSize: '16px', fontWeight: 600, color: 'var(--err)' })}>−{data.changes.deletions}</div>
                    <div style={mono({ fontSize: '9px', color: 'var(--ink-3)' })}>删除</div>
                  </div>
                </div>
              </div>

              {/* Diff panels */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Older version */}
                <div style={{ border: '1px solid var(--line)', borderRadius: '13px', overflow: 'hidden' }}>
                  <div style={mono({ padding: '11px 16px', borderBottom: '1px solid var(--line)', background: 'var(--bg-1)', fontSize: '11px', color: 'var(--ink-3)' })}>
                    v{data.versionA.versionNumber} · {formatDate(data.versionA.createdAt)}
                  </div>
                  <div style={{ padding: '18px', fontSize: '13.5px', lineHeight: 1.85, color: 'var(--ink-2)', fontFamily: 'var(--mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {data.diff.map((part, index) => {
                      if (part.added) {
                        return null;
                      }
                      if (part.removed) {
                        return (
                          <span
                            key={index}
                            style={{
                              background: 'rgba(224,112,94,0.18)',
                              color: 'var(--err)',
                              borderRadius: '3px',
                              padding: '0 3px',
                              textDecoration: 'line-through',
                            }}
                          >
                            {part.value}
                          </span>
                        );
                      }
                      return <span key={index}>{part.value}</span>;
                    })}
                  </div>
                </div>

                {/* Newer version */}
                <div style={{ border: '1px solid var(--amber-line)', borderRadius: '13px', overflow: 'hidden' }}>
                  <div style={mono({ padding: '11px 16px', borderBottom: '1px solid var(--amber-line)', background: 'var(--amber-soft)', fontSize: '11px', color: 'var(--amber)' })}>
                    v{data.versionB.versionNumber} · {formatDate(data.versionB.createdAt)} · 最新
                  </div>
                  <div style={{ padding: '18px', fontSize: '13.5px', lineHeight: 1.85, color: 'var(--ink)', fontFamily: 'var(--mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {data.diff.map((part, index) => {
                      if (part.removed) {
                        return null;
                      }
                      if (part.added) {
                        return (
                          <span
                            key={index}
                            style={{
                              background: 'rgba(123,192,145,0.18)',
                              color: 'var(--ok)',
                              borderRadius: '3px',
                              padding: '0 3px',
                            }}
                          >
                            {part.value}
                          </span>
                        );
                      }
                      return <span key={index}>{part.value}</span>;
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={mono({ fontSize: '13px', color: 'var(--err)', letterSpacing: '0.06em' })}>对比失败，请重试</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '18px 30px',
            borderTop: '1px solid var(--line)',
          }}
        >
          <button
            onClick={onClose}
            style={mono({
              padding: '9px 18px',
              borderRadius: '9px',
              border: '1px solid var(--line)',
              background: 'var(--bg-1)',
              color: 'var(--ink-2)',
              fontSize: '12px',
              letterSpacing: '0.06em',
              cursor: 'pointer',
            })}
          >
            关闭
          </button>
          {data && (
            <button
              onClick={() => onRestore(data.versionB.id)}
              disabled={restoring}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '9px 18px',
                borderRadius: '9px',
                border: 'none',
                background: 'var(--amber)',
                color: '#20170A',
                fontFamily: 'var(--disp)',
                fontWeight: 600,
                fontSize: '12.5px',
                cursor: restoring ? 'default' : 'pointer',
                opacity: restoring ? 0.55 : 1,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              恢复到新版本
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionCompareModal;
