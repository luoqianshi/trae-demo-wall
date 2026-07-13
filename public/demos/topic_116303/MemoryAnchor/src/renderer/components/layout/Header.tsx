import React from 'react';
import { Search, Moon, Sun, HelpCircle, Monitor } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export interface HeaderProps {
  /** Breadcrumb text shown at the left (mono). */
  title?: string;
  /** Called to open the search screen. */
  onSearch?: (query: string) => void;
  onHelp?: () => void;
}

const iconBtn: React.CSSProperties = {
  width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '10px', border: '1px solid var(--line)', background: 'var(--bg-1)', color: 'var(--ink-2)', cursor: 'pointer',
  WebkitAppRegion: 'no-drag',
} as React.CSSProperties;

export function Header({ title = '全部收藏', onSearch, onHelp }: HeaderProps) {
  const { resolvedTheme, toggleTheme, isDark, isSystem } = useTheme();

  const themeIcon = isSystem ? <Monitor size={17} /> : isDark ? <Sun size={17} /> : <Moon size={17} />;
  const themeTitle = isSystem
    ? `跟随系统 (${resolvedTheme === 'dark' ? '暗色' : '亮色'})`
    : isDark ? '切换到亮色模式' : '切换到暗色模式';

  return (
    <header
      style={{
        height: '60px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '16px',
        padding: '0 26px', borderBottom: '1px solid var(--line)', background: 'var(--bg-0)',
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      <div style={{ fontFamily: 'var(--mono)', fontSize: '10.5px', letterSpacing: '0.14em', color: 'var(--ink-3)' }}>
        {title}
      </div>
      <div style={{ flex: 1 }} />

      {/* Search launcher */}
      <button
        onClick={() => onSearch?.('')}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px', width: '340px', padding: '8px 14px',
          borderRadius: '10px', border: '1px solid var(--line)', background: 'var(--bg-1)', color: 'var(--ink-3)',
          cursor: 'text', fontFamily: 'var(--body)', fontSize: '13px',
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}
      >
        <Search size={15} />
        <span style={{ flex: 1, textAlign: 'left' }}>用一句话找回任何收藏…</span>
        <kbd style={{ fontFamily: 'var(--mono)', fontSize: '10px', padding: '2px 6px', borderRadius: '5px', background: 'var(--bg-3)', border: '1px solid var(--line)', color: 'var(--ink-3)' }}>⌘K</kbd>
      </button>

      <button onClick={toggleTheme} title={themeTitle} style={iconBtn}>{themeIcon}</button>
      <button onClick={onHelp} title="帮助" style={iconBtn}><HelpCircle size={17} /></button>
    </header>
  );
}
