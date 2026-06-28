// 主题管理：浅色 / 深色 / 跟随系统
// 在 background、sidebar、content、popup 都会被引用，因此必须是可在多上下文运行的轻量模块。
//
// 主题值：
//   'light'   - 强制浅色
//   'dark'    - 强制深色
//   'system'  - 跟随 prefers-color-scheme（默认）
//
// 应用方式：在 document.documentElement 上设置 [data-theme] 属性
//   data-theme="light" 或 data-theme="dark"
//
// 存储位置：chrome.storage.local.styleSettings.theme
// 广播方式：sidebar 改 → chrome.storage.onChanged；content 通过 background 代理查询。
(function (global) {
  'use strict';

  const THEME_KEY = 'web-marker-theme';
  const THEME_OPTIONS = ['light', 'dark', 'system'];

  // 系统实际生效主题（resolve 'system' → 'light'|'dark'）
  function resolveTheme(value) {
    if (value === 'dark' || value === 'light') return value;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  // 读取已保存主题
  async function getStoredTheme() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(['styleSettings'], (data) => {
          if (chrome.runtime.lastError) { resolve('system'); return; }
          const t = data && data.styleSettings && data.styleSettings.theme;
          if (THEME_OPTIONS.indexOf(t) >= 0) resolve(t);
          else resolve('system');
        });
      } catch (e) {
        resolve('system');
      }
    });
  }

  // 保存主题
  async function setStoredTheme(theme) {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(['styleSettings'], (data) => {
          const cur = (data && data.styleSettings) || {};
          const next = Object.assign({}, cur, { theme: theme });
          chrome.storage.local.set({ styleSettings: next }, () => {
            if (chrome.runtime.lastError) { resolve(false); return; }
            resolve(true);
          });
        });
      } catch (e) {
        resolve(false);
      }
    });
  }

  // 应用主题到 documentElement
  function applyTheme(theme) {
    try {
      const actual = resolveTheme(theme);
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.setAttribute('data-theme', actual);
      }
      return actual;
    } catch (e) {
      return 'light';
    }
  }

  // 同步应用（已加载本地值时 init 阶段用）
  function applyThemeSync(theme) {
    return applyTheme(theme);
  }

  // 监听系统主题变化（当用户选 'system' 时自动跟随）
  function watchSystemTheme(theme, onChange) {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        const actual = applyTheme('system');
        if (typeof onChange === 'function') onChange(actual);
      }
    };
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if (mq.addListener) mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else if (mq.removeListener) mq.removeListener(handler);
    };
  }

  // content script 端：通过 background 询问主题（不直接读 storage 避免权限问题）
  async function queryThemeViaBackground() {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: 'GET_THEME' }, (resp) => {
          if (chrome.runtime.lastError) { resolve('system'); return; }
          resolve((resp && resp.theme) || 'system');
        });
      } catch (e) {
        resolve('system');
      }
    });
  }

  global.WebMarkerTheme = {
    THEME_OPTIONS,
    resolveTheme,
    getStoredTheme,
    setStoredTheme,
    applyTheme,
    applyThemeSync,
    watchSystemTheme,
    queryThemeViaBackground
  };
})(typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis));
