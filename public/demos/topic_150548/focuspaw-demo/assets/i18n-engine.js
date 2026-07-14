/* FocusPaw i18n Engine — language switching, browser detection, localStorage */
(function() {
  'use strict';

  var STORAGE_KEY = 'focuspaw_lang';
  var SUPPORTED = ['zh-CN', 'en', 'ja', 'ko'];

  /* ---- Browser language detection ---- */
  function detectBrowserLang() {
    var raw = (navigator.language || navigator.userLanguage || 'zh-CN').toLowerCase();
    // Match exact first
    if (SUPPORTED.indexOf(raw) !== -1) return raw;
    // Match prefix
    if (raw.indexOf('zh') === 0) return 'zh-CN';
    if (raw.indexOf('en') === 0) return 'en';
    if (raw.indexOf('ja') === 0) return 'ja';
    if (raw.indexOf('ko') === 0) return 'ko';
    return 'zh-CN';
  }

  /* ---- Get current language ---- */
  function getCurrentLang() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch(e) {}
    if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    return detectBrowserLang();
  }

  var currentLang = getCurrentLang();

  /* ---- Translate a key ---- */
  function t(key) {
    var dict = window.I18N_DICT || {};
    var langDict = dict[currentLang] || dict['zh-CN'] || {};
    return langDict[key] !== undefined ? langDict[key] : (dict['zh-CN'] && dict['zh-CN'][key] !== undefined ? dict['zh-CN'][key] : key);
  }

  /* ---- Apply translations to all [data-i18n] elements ---- */
  function applyTranslations() {
    var elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      var text = t(key);
      if (text && text !== key) {
        el.textContent = text;
      }
    });
    // Also handle data-i18n-html (allows HTML content)
    var htmlElements = document.querySelectorAll('[data-i18n-html]');
    htmlElements.forEach(function(el) {
      var key = el.getAttribute('data-i18n-html');
      var text = t(key);
      if (text && text !== key) {
        el.innerHTML = text;
      }
    });
    // Handle data-i18n-placeholder
    var placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(function(el) {
      var key = el.getAttribute('data-i18n-placeholder');
      var text = t(key);
      if (text && text !== key) {
        el.setAttribute('placeholder', text);
      }
    });
    // Handle data-i18n-aria-label
    var ariaElements = document.querySelectorAll('[data-i18n-aria]');
    ariaElements.forEach(function(el) {
      var key = el.getAttribute('data-i18n-aria');
      var text = t(key);
      if (text && text !== key) {
        el.setAttribute('aria-label', text);
      }
    });
  }

  /* ---- Set language ---- */
  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = 'zh-CN';
    currentLang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch(e) {}
    // Update <html> lang attribute for font switching
    document.documentElement.lang = lang;
    // Update active button state
    document.querySelectorAll('.lang-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
    // Apply translations to static HTML
    applyTranslations();
    // Dispatch event for dynamic content (app.js listens)
    document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: lang } }));
  }

  /* ---- Build language switcher buttons ---- */
  function buildSwitcher() {
    var container = document.getElementById('langSwitcher');
    if (!container) return;
    var langs = window.I18N_LANGS || [];
    container.innerHTML = '';
    langs.forEach(function(l) {
      var btn = document.createElement('button');
      btn.className = 'lang-btn' + (l.code === currentLang ? ' active' : '');
      btn.setAttribute('data-lang', l.code);
      btn.setAttribute('title', l.name);
      btn.textContent = l.label;
      btn.addEventListener('click', function() { setLang(l.code); });
      container.appendChild(btn);
    });
  }

  /* ---- Init ---- */
  function init() {
    // Set initial html lang
    document.documentElement.lang = currentLang;
    // Build switcher
    buildSwitcher();
    // Apply translations
    applyTranslations();
    // Dispatch initial event for app.js
    document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: currentLang } }));
  }

  /* ---- Expose global API ---- */
  window.i18n = {
    t: t,
    getLang: function() { return currentLang; },
    setLang: setLang,
    applyTranslations: applyTranslations,
    supported: SUPPORTED.slice(),
  };

  /* ---- Boot ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
