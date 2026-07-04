import React, { useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, App as AntdApp, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import { useUiStore } from './store';
import 'antd/dist/reset.css';
import './styles.css';

const THEME_PRIMARY: Record<string, string> = {
  light: '#6366f1',
  dark: '#818cf8',
  industrial: '#1f2937'
};

const THEME_PRIMARY_HOVER: Record<string, string> = {
  light: '#4f46e5',
  dark: '#a5b4fc',
  industrial: '#374151'
};

const THEME_PRIMARY_ACTIVE: Record<string, string> = {
  light: '#4338ca',
  dark: '#c7d2fe',
  industrial: '#4b5563'
};

const THEME_TEXT: Record<string, string> = {
  light: '#0f172a',
  dark: '#f1f5f9',
  industrial: '#111827'
};

const THEME_TEXT_MUTED: Record<string, string> = {
  light: '#64748b',
  dark: '#94a3b8',
  industrial: '#6b7280'
};

const THEME_BG_SOFT: Record<string, string> = {
  light: '#ffffff',
  dark: '#0f1525',
  industrial: '#ffffff'
};

const THEME_BORDER: Record<string, string> = {
  light: 'rgba(15, 23, 42, 0.14)',
  dark: 'rgba(148, 163, 184, 0.28)',
  industrial: 'rgba(17, 24, 39, 0.15)'
};

const THEME_HEADER_BG: Record<string, string> = {
  light: 'rgba(99, 102, 241, 0.06)',
  dark: 'rgba(129, 140, 248, 0.12)',
  industrial: 'rgba(17, 24, 39, 0.04)'
};

const THEME_ROW_HOVER: Record<string, string> = {
  light: 'rgba(99, 102, 241, 0.05)',
  dark: 'rgba(129, 140, 248, 0.1)',
  industrial: 'rgba(17, 24, 39, 0.04)'
};

const THEME_RING: Record<string, string> = {
  light: 'rgba(99, 102, 241, 0.18)',
  dark: 'rgba(129, 140, 248, 0.3)',
  industrial: 'rgba(17, 24, 39, 0.1)'
};

function Root() {
  const themeMode = useUiStore((s) => s.theme);
  const isDark = themeMode === 'dark';
  const isIndustrial = themeMode === 'industrial';

  useEffect(() => {
    if (themeMode && themeMode !== 'light') {
      document.documentElement.setAttribute('data-theme', themeMode);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [themeMode]);

  const themeConfig = useMemo(() => {
    const primary = THEME_PRIMARY[themeMode] || THEME_PRIMARY.light;
    const primaryHover = THEME_PRIMARY_HOVER[themeMode] || THEME_PRIMARY_HOVER.light;
    const primaryActive = THEME_PRIMARY_ACTIVE[themeMode] || THEME_PRIMARY_ACTIVE.light;
    const textMuted = THEME_TEXT_MUTED[themeMode] || THEME_TEXT_MUTED.light;
    const text = THEME_TEXT[themeMode] || THEME_TEXT.light;
    const bgSoft = THEME_BG_SOFT[themeMode] || THEME_BG_SOFT.light;
    const border = THEME_BORDER[themeMode] || THEME_BORDER.light;
    const headerBg = THEME_HEADER_BG[themeMode] || THEME_HEADER_BG.light;
    const rowHover = THEME_ROW_HOVER[themeMode] || THEME_ROW_HOVER.light;
    const ring = THEME_RING[themeMode] || THEME_RING.light;

    return {
      algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: primary,
        colorInfo: primary,
        colorSuccess: isIndustrial ? '#059669' : '#10b981',
        colorWarning: isIndustrial ? '#d97706' : '#f59e0b',
        colorError: isIndustrial ? '#dc2626' : '#ef4444',
        borderRadius: 10,
        borderRadiusSM: 8,
        borderRadiusLG: 14,
        borderRadiusXL: 20,
        fontFamily:
          "Inter, 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
        fontSize: 14,
        colorLink: primary,
        colorLinkHover: primaryHover
      },
      components: {
        Button: {
          controlHeight: 34,
          colorPrimary: primary,
          colorPrimaryHover: primaryHover,
          colorPrimaryActive: primaryActive,
          fontWeight: 500
        },
        Tabs: {
          itemColor: textMuted,
          itemSelectedColor: primary,
          itemHoverColor: text,
          inkBarColor: 'transparent'
        },
        Card: {
          borderRadiusLG: 20,
          headerBg: 'transparent'
        },
        Table: {
          borderRadiusLG: 20,
          headerBg: headerBg,
          headerSplitColor: border,
          rowHoverBg: rowHover,
          cellPaddingBlock: 12,
          cellPaddingInline: 16
        },
        Input: {
          borderRadius: 10,
          hoverBorderColor: primary,
          activeBorderColor: primary,
          activeShadow: `0 0 0 4px ${ring}`,
          paddingBlock: 8,
          paddingInline: 12
        },
        Select: {
          borderRadius: 10,
          selectorBg: bgSoft,
          colorBorder: border,
          colorPrimaryHover: primary,
          activeShadow: `0 0 0 4px ${ring}`
        },
        Modal: {
          borderRadiusLG: 20
        },
        Drawer: {
          borderRadiusLG: 20
        },
        Tag: {
          borderRadiusSM: 99,
          borderRadius: 99
        },
        Switch: {
          colorPrimary: primary
        },
        Pagination: {
          itemBg: bgSoft,
          itemBorderColor: border,
          itemActiveBg: primary,
          colorPrimary: '#ffffff',
          borderRadius: 8
        },
        Upload: {
          borderRadiusLG: 20
        },
        Tooltip: {
          borderRadius: 8,
          colorBgDefault: isDark ? '#1e293b' : '#0f172a'
        }
      }
    };
  }, [themeMode, isDark, isIndustrial]);

  return (
    <ConfigProvider locale={zhCN} theme={themeConfig}>
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
