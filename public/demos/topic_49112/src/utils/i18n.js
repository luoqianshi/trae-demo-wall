/**
 * Web Marker - 运行时 i18n 辅助模块
 *
 * 设计要点：
 * - chrome.i18n.getMessage 在 content script 中可用但读取的是扩展 UI locale
 *   （由浏览器语言或 chrome://settings/languages 决定），无法响应用户在侧边栏
 *   手动切换的语言偏好。因此本模块自建轻量 t() 直接读 _locales/<locale>/messages.json。
 * - locale 持久化在 chrome.storage.local 的 `uiLocale` 字段。
 * - 切换 locale 时通过 WMI18n.subscribe() 通知所有订阅者重新渲染。
 * - 默认 locale 为 'zh_CN'（与 manifest 的 default_locale 一致）。
 * - 占位符语法：t('key', { count: 5 }) → 模板中用 ${count} 插值。
 *
 * 暴露 API：
 *   WMI18n.t(key, params?)            - 同步取文案（已加载完毕后可用）
 *   WMI18n.getCurrentLocale()         - 取当前 locale
 *   WMI18n.getSupportedLocales()      - 取支持的语言列表
 *   WMI18n.setLocale(locale)          - 切换语言（异步），会触发订阅者
 *   WMI18n.subscribe(fn)              - 订阅语言切换事件，返回取消订阅函数
 *   WMI18n.applyToDocument(root?)     - 扫描 [data-i18n] 元素并替换文本
 *   WMI18n.applyAttrToDocument(root?) - 扫描 [data-i18n-attr] 元素并替换属性
 *   WMI18n.ready                      - Promise<void>，初始化完成后 resolve
 *
 * HTML 用法：
 *   <button data-i18n="common_save">保存</button>
 *   <input data-i18n-attr="placeholder:search_placeholder" placeholder="搜索标记...">
 *   <button data-i18n-attr="title:tooltip.edit" title="编辑">
 *
 * messages.json 结构：
 *   {
 *     "common_save": { "message": "保存" },
 *     "marks.count": { "message": "已选 $count$ 条", "placeholders": { "count": { "content": "$1" } } }
 *   }
 *   兼容 Chrome 原生 $1 占位符，也支持本模块的 ${count} 语法。
 */
(function () {
  'use strict';

  if (typeof window !== 'undefined' && window.WMI18n) return;

  const SUPPORTED_LOCALES = [
    { code: 'zh_CN', label: '简体中文', lang: 'zh-CN' },
    { code: 'en',    label: 'English',  lang: 'en'    },
    { code: 'ja',    label: '日本語',    lang: 'ja'    },
    { code: 'ko',    label: '한국어',    lang: 'ko'    },
    { code: 'ru',    label: 'Русский',  lang: 'ru'    },
  ];
  const DEFAULT_LOCALE = 'zh_CN';
  const STORAGE_KEY = 'uiLocale';

  // 内存中缓存的当前 locale 与 messages
  let currentLocale = DEFAULT_LOCALE;
  let currentMessages = {};
  let messagesCache = {}; // locale -> messages
  const subscribers = new Set();
  let initResolve;
  const ready = new Promise((resolve) => { initResolve = resolve; });

  function getSupportedLocales() { return SUPPORTED_LOCALES.slice(); }

  function getCurrentLocale() { return currentLocale; }

  function getLocaleLang(locale) {
    const found = SUPPORTED_LOCALES.find((l) => l.code === locale);
    return found ? found.lang : 'zh-CN';
  }

  /**
   * 读取某个 locale 的 messages.json。
   * content script / sidebar 都通过 fetch(chrome.runtime.getURL(...)) 读取。
   */
  async function loadMessages(locale) {
    if (messagesCache[locale]) return messagesCache[locale];
    try {
      const url = chrome.runtime.getURL(`_locales/${locale}/messages.json`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      messagesCache[locale] = json || {};
      return messagesCache[locale];
    } catch (e) {
      console.warn(`[WMI18n] 加载 ${locale} 失败:`, e.message);
      // 失败时回退到默认 locale
      if (locale !== DEFAULT_LOCALE) {
        return loadMessages(DEFAULT_LOCALE);
      }
      messagesCache[locale] = {};
      return {};
    }
  }

  /**
   * 取文案。支持两种占位符：
   *   1. Chrome 原生 $key$ 形式（messages.json 中 placeholders 定义）
   *   2. 简化形式 ${key}（本模块扩展，调用方传 params 时使用）
   */
  function t(key, params) {
    if (!key) return '';
    const entry = currentMessages[key];
    let raw;
    if (entry && typeof entry === 'object') {
      raw = entry.message;
    } else if (typeof entry === 'string') {
      raw = entry;
    } else {
      // 未命中时回退到默认 locale，再不行就返回 key 本身
      const fallback = messagesCache[DEFAULT_LOCALE] || {};
      const fbEntry = fallback[key];
      raw = (fbEntry && (fbEntry.message || fbEntry)) || key;
    }
    if (!params) return raw;

    // 1. Chrome 原生占位符 $key$ → $1
    if (entry && entry.placeholders) {
      for (const [phName, phDef] of Object.entries(entry.placeholders)) {
        const phVal = params[phName];
        if (phVal !== undefined) {
          const re = new RegExp(`\\$${phName}\\$`, 'gi');
          raw = raw.replace(re, String(phVal));
          // 同时替换 $1 形式（content 字段定义的索引）
          if (phDef && phDef.content) {
            raw = raw.replace(phDef.content, String(phVal));
          }
        }
      }
    }
    // 2. 简化形式 ${key}
    for (const [k, v] of Object.entries(params)) {
      raw = raw.replace(new RegExp(`\\$\\{${k}\\}`, 'g'), String(v));
    }
    return raw;
  }

  /**
   * 切换语言。会持久化并通知订阅者。
   */
  async function setLocale(locale) {
    if (!SUPPORTED_LOCALES.some((l) => l.code === locale)) {
      console.warn(`[WMI18n] 不支持的 locale: ${locale}`);
      return;
    }
    if (locale === currentLocale && Object.keys(currentMessages).length > 0) return;
    const prev = currentLocale;
    currentLocale = locale;
    currentMessages = await loadMessages(locale);
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: locale });
    } catch (e) { /* storage 可能不可用，忽略 */ }
    // 更新 <html lang="...">
    if (typeof document !== 'undefined') {
      document.documentElement.lang = getLocaleLang(locale);
    }
    // 通知订阅者
    for (const fn of subscribers) {
      try { fn(locale, prev); } catch (e) { /* 单个订阅者异常不影响其他 */ }
    }
    // 自动应用 data-i18n 到整篇文档
    if (typeof document !== 'undefined') {
      applyToDocument(document);
      applyAttrToDocument(document);
      applyCssVars();
    }
  }

  function subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  /**
   * 扫描 [data-i18n] 元素并替换 textContent。
   * 支持空格分隔多 key：data-i18n="a.b c.d" → 拼接
   * 支持参数：data-i18n-params='{"count":5}'
   */
  function applyToDocument(root) {
    const scope = root || document;
    if (!scope.querySelectorAll) return;
    const nodes = scope.querySelectorAll('[data-i18n]');
    nodes.forEach((node) => {
      const keys = (node.getAttribute('data-i18n') || '').split(/\s+/).filter(Boolean);
      if (!keys.length) return;
      let params;
      const paramsAttr = node.getAttribute('data-i18n-params');
      if (paramsAttr) {
        try { params = JSON.parse(paramsAttr); } catch (e) { /* 忽略 */ }
      }
      const text = keys.map((k) => t(k, params)).join('');
      node.textContent = text;
    });
  }

  /**
   * 扫描 [data-i18n-attr] 元素并替换属性。
   * 格式：data-i18n-attr="placeholder:search_placeholder;title:tooltip.edit"
   */
  function applyAttrToDocument(root) {
    const scope = root || document;
    if (!scope.querySelectorAll) return;
    const nodes = scope.querySelectorAll('[data-i18n-attr]');
    nodes.forEach((node) => {
      const attrSpec = node.getAttribute('data-i18n-attr') || '';
      attrSpec.split(';').forEach((pair) => {
        const idx = pair.indexOf(':');
        if (idx < 0) return;
        const attrName = pair.slice(0, idx).trim();
        const key = pair.slice(idx + 1).trim();
        if (!attrName || !key) return;
        const val = t(key);
        if (val && val !== key) node.setAttribute(attrName, val);
      });
    });
  }

  /**
   * 将部分文案写入 CSS 自定义属性，供 `content: var(--xxx)` 使用。
   * CSS 的 content 属性无法通过 data-i18n 替换，故走此通道。
   */
  const CSS_VAR_MAP = {
    '--wm-i18n-empty-note': 'detail_empty_note',
  };
  function applyCssVars() {
    if (typeof document === 'undefined') return;
    for (const [cssVar, i18nKey] of Object.entries(CSS_VAR_MAP)) {
      const val = t(i18nKey);
      if (val && val !== i18nKey) {
        document.documentElement.style.setProperty(cssVar, `"${val}"`);
      }
    }
  }

  /**
   * 初始化：从 storage 读取上次保存的 locale，加载 messages，应用文档。
   */
  async function init() {
    let savedLocale = DEFAULT_LOCALE;
    try {
      const data = await chrome.storage.local.get(STORAGE_KEY);
      if (data && data[STORAGE_KEY]) savedLocale = data[STORAGE_KEY];
    } catch (e) { /* */ }

    // 预加载默认 locale 作为兜底
    messagesCache[DEFAULT_LOCALE] = await loadMessages(DEFAULT_LOCALE);

    currentLocale = SUPPORTED_LOCALES.some((l) => l.code === savedLocale)
      ? savedLocale : DEFAULT_LOCALE;
    currentMessages = await loadMessages(currentLocale);

    if (typeof document !== 'undefined') {
      document.documentElement.lang = getLocaleLang(currentLocale);
      applyToDocument(document);
      applyAttrToDocument(document);
      applyCssVars();
    }
    initResolve();
  }

  const api = {
    t,
    getSupportedLocales,
    getCurrentLocale,
    getLocaleLang,
    setLocale,
    subscribe,
    applyToDocument,
    applyAttrToDocument,
    ready,
    DEFAULT_LOCALE,
  };

  if (typeof window !== 'undefined') {
    window.WMI18n = api;
    // 启动初始化（不阻塞脚本加载）
    init();
    // 监听 storage 变化：sidebar 切换语言后，content script 自动同步
    // （sidebar 和 content script 是不同上下文，各自有独立的 WMI18n 实例）
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return;
        const change = changes[STORAGE_KEY];
        if (change && change.newValue && change.newValue !== currentLocale) {
          setLocale(change.newValue);
        }
      });
    }
  } else {
    // service worker / background 上下文：仅暴露 t() 与 locale 切换
    self.WMI18n = api;
    init();
  }
})();
