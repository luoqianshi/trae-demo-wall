import React from 'react';

export type NavKey = 'home' | 'today' | 'unread' | 'tags' | 'import' | 'trash' | 'settings';

export interface SidebarProps {
  activeNav?: NavKey;
  onNavChange?: (key: NavKey) => void;
  onImport?: () => void;
  storageSize?: string;
  totalCount?: number;
  todayCount?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavDef {
  key: NavKey;
  label: string;
  icon: React.ReactNode;
}

const ic = (d: React.ReactNode) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const LIBRARY_NAV: NavDef[] = [
  { key: 'home', label: '全部收藏', icon: ic(<path d="M6 4h12v17l-6-4-6 4z" />) },
  { key: 'today', label: '今日新增', icon: ic(<><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>) },
  { key: 'unread', label: '未读', icon: ic(<><path d="M4 4l16 16" /><path d="M9.6 9.6a3 3 0 0 0 4.1 4.1" /><path d="M6.4 6.5C4 8 2.5 12 2.5 12s3.3 6.5 9.5 6.5c1.7 0 3.2-.4 4.5-1.1" /><path d="M9.8 4.3A9 9 0 0 1 12 4c6.2 0 9.5 8 9.5 8a16 16 0 0 1-2 3" /></>) },
  { key: 'tags', label: '标签管理', icon: ic(<><path d="M3 3h7l11 11-7 7L3 10z" /><circle cx="7.5" cy="7.5" r="1.4" /></>) },
];

const SYSTEM_NAV: NavDef[] = [
  { key: 'import', label: '内容采集', icon: ic(<><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M4 20h16" /></>) },
  { key: 'trash', label: '回收站', icon: ic(<><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></>) },
  { key: 'settings', label: '系统设置', icon: ic(<><path d="M4 8h16M4 16h16" /><circle cx="9" cy="8" r="2.4" fill="var(--bg-1)" /><circle cx="15" cy="16" r="2.4" fill="var(--bg-1)" /></>) },
];

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--mono)', fontSize: '9.5px', letterSpacing: '0.2em', color: 'var(--ink-3)', padding: '8px 12px 6px',
};

export function Sidebar({
  activeNav = 'home',
  onNavChange,
  onImport,
  storageSize = '—',
  totalCount,
  todayCount,
}: SidebarProps) {
  const renderNavItem = (item: NavDef) => {
    const active = activeNav === item.key;
    return (
      <button
        key={item.key}
        onClick={() => onNavChange?.(item.key)}
        className="ma-nav-btn"
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '11px', padding: '9px 12px',
          borderRadius: '9px', border: 'none', cursor: 'pointer', fontFamily: 'var(--body)', fontSize: '13.5px',
          textAlign: 'left', transition: 'background .14s,color .14s',
          background: active ? 'var(--amber-soft)' : 'transparent',
          color: active ? 'var(--amber)' : 'var(--ink-2)',
          borderLeft: `2px solid ${active ? 'var(--amber)' : 'transparent'}`,
        }}
      >
        {item.icon}
        <span style={{ flex: 1 }}>{item.label}</span>
        {item.key === 'home' && totalCount !== undefined && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--ink-3)' }}>{totalCount.toLocaleString()}</span>
        )}
        {item.key === 'today' && todayCount !== undefined && todayCount > 0 && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', padding: '1px 7px', borderRadius: '20px', background: 'var(--amber-soft)', color: 'var(--amber)' }}>{todayCount}</span>
        )}
      </button>
    );
  };

  // On macOS the window uses hiddenInset traffic lights that sit over the top
  // of the sidebar — push the wordmark down so it doesn't overlap, and make the
  // top strip a draggable window region.
  const isMac = window.electronAPI?.platform === 'darwin';

  return (
    <aside style={{ width: '250px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-1)', borderRight: '1px solid var(--line)' }}>
      {/* Wordmark (doubles as the macOS drag handle / titlebar) */}
      <div
        style={{
          padding: isMac ? '40px 22px 18px' : '22px 22px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        <div style={{ width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--amber-soft)', border: '1px solid var(--amber-line)', color: 'var(--amber)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2.3" /><path d="M12 7.3V21" /><path d="M5 12a7 7 0 0 0 14 0" /><path d="M5.2 12H8M16 12h2.8" /></svg>
        </div>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontFamily: 'var(--disp)', fontWeight: 600, fontSize: '15px', letterSpacing: '-0.01em', color: 'var(--ink)' }}>Memory Anchor</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9.5px', letterSpacing: '0.18em', color: 'var(--ink-3)', marginTop: '3px' }}>LOCAL · FOREVER</div>
        </div>
      </div>

      {/* Primary CTA */}
      <div style={{ padding: '2px 16px 16px' }}>
        <button
          onClick={onImport}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: 'var(--amber)', color: '#20170A', fontFamily: 'var(--disp)', fontWeight: 600, fontSize: '13.5px', border: 'none', cursor: 'pointer' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          采集内容
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 12px' }}>
        <div style={sectionLabel}>库 / LIBRARY</div>
        {LIBRARY_NAV.map(renderNavItem)}
        <div style={{ ...sectionLabel, padding: '18px 12px 6px' }}>系统 / SYSTEM</div>
        {SYSTEM_NAV.map(renderNavItem)}
      </nav>

      {/* Storage footer */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.04em', color: 'var(--ink-3)', marginBottom: '8px' }}>
          <span>本地存储</span><span style={{ color: 'var(--ink-2)' }}>{storageSize}</span>
        </div>
        <div style={{ height: '4px', borderRadius: '4px', background: 'var(--bg-3)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '32%', background: 'var(--amber)', borderRadius: '4px' }} />
        </div>
      </div>
    </aside>
  );
}
