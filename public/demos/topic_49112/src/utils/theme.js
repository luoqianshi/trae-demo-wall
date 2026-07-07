// 主题管理：浅色 / 深色 / 跟随系统
// 在 background、sidebar、content、popup 都会被引用，因此必须是可在多上下文运行的轻量模块。
//
// 主题值：
//   'light'   - 强制浅色
//   'dark'    - 强制深色
//   'system'  - 跟随 prefers-color-scheme（默认）
//
// 应用方式（按上下文区分）：
//   - sidebar/popup（独立扩展文档）：在 document.documentElement 上设置 [data-theme]
//     —— sidebar/popup 是自己的 document，不污染宿主网页
//   - content script（宿主网页上下文）：在插件 UI 根元素上设置 [data-wm-theme]
//     —— 不污染宿主网页的 <html>，CSS 变量也限定在插件 UI 内
//
// 存储位置：chrome.storage.local.styleSettings.theme
// 广播方式：sidebar 改 → chrome.storage.onChanged；content 通过 background 代理查询。
(function (global) {
  'use strict';

  const THEME_KEY = 'web-marker-theme';
  const THEME_OPTIONS = ['light', 'dark', 'system'];

  // 当前已应用的主题缓存（resolve 后的 'light' 或 'dark'），供 content script UI 创建时读取
  let _currentActual = 'light';

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

  // 应用主题到 documentElement（仅 sidebar/popup 独立扩展文档使用）
  // content script 不应调用此函数，应改用 applyToElement / applyToAllRoots
  function applyTheme(theme) {
    try {
      const actual = resolveTheme(theme);
      _currentActual = actual;
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

  // 获取当前已缓存的实际主题（'light' 或 'dark'），供 content script UI 创建时读取
  function getCurrent() {
    return _currentActual;
  }

  // 设置当前缓存的主题值（不写 DOM），供 content script 启动期未拿不到 background 答复前用
  function setCurrent(theme) {
    const actual = resolveTheme(theme);
    _currentActual = actual;
    return actual;
  }

  // 给单个插件 UI 根元素应用主题（content script 用，避免污染宿主 <html>）
  function applyToElement(el, theme) {
    if (!el || !el.setAttribute) return;
    const actual = resolveTheme(theme);
    el.setAttribute('data-wm-theme', actual);
  }

  // 给当前文档中所有插件顶层 UI 根元素应用主题
  // 选择器覆盖所有插件注入的根容器：toolbar / popup / modal / banner / overlay 等
  function applyToAllRoots(theme) {
    const actual = setCurrent(theme);
    if (typeof document === 'undefined' || !document.querySelectorAll) return actual;
    try {
      const roots = document.querySelectorAll(
        '.web-marker-toolbar, .web-marker-popup, .web-marker-note-modal, ' +
        '.wm-confirm-overlay, .wm-confirm-dialog, .wm-group-prompt-overlay, .wm-group-prompt-dialog, ' +
        '.wm-bookmark-hint-banner, .wm-cat-paw-rain'
      );
      roots.forEach((el) => el.setAttribute('data-wm-theme', actual));
    } catch (e) { /* 忽略 */ }
    return actual;
  }

  // 监听系统主题变化（当用户选 'system' 时自动跟随）
  // 注意：此函数会触发回调，回调里调用方应自行决定走 applyTheme（sidebar）还是 applyToAllRoots（content）
  function watchSystemTheme(theme, onChange) {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        // 仅更新缓存，由调用方在 onChange 回调中决定如何应用
        const actual = setCurrent('system');
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
    applyToElement,
    applyToAllRoots,
    getCurrent,
    setCurrent,
    watchSystemTheme,
    queryThemeViaBackground
  };
})(typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis));
