/**
 * 政策通适老化模块 - 字号/对比度/按钮放大/语音朗读
 *
 * 通过 window.PolicyMateA11y 暴露 API，不使用 ES modules。
 * 依赖 js/store.js 中的 window.PolicyMateStore.getA11y() / setA11y()。
 */
(function () {
  'use strict';

  // ============ 字号映射 ============
  const FONT_SIZE_MAP = {
    normal: '16px',
    large: '20px',
    xlarge: '24px'
  };

  // ============ 应用适老化设置到 DOM ============
  /**
   * 将适老化设置应用到 DOM
   * @param {Object} settings 适老化设置 { fontSize, highContrast, largeButton }
   */
  function applyA11y(settings) {
    if (!settings) settings = { fontSize: 'normal', highContrast: false, largeButton: false };

    // 字号：通过 html 根元素 font-size 控制 rem 单位
    const fontSize = FONT_SIZE_MAP[settings.fontSize] || '16px';
    document.documentElement.style.fontSize = fontSize;

    // 高对比度：通过 body 上的 class 触发 CSS 主题
    if (settings.highContrast) {
      document.body.classList.add('a11y-high-contrast');
    } else {
      document.body.classList.remove('a11y-high-contrast');
    }

    // 按钮放大：通过 body 上的 class 触发 CSS 放大样式
    if (settings.largeButton) {
      document.body.classList.add('a11y-large-button');
    } else {
      document.body.classList.remove('a11y-large-button');
    }
  }

  // ============ 页面加载时恢复设置 ============
  /**
   * 从 localStorage 读取适老化设置并应用
   * 应在 DOMContentLoaded 时调用
   */
  function initA11y() {
    const settings = window.PolicyMateStore.getA11y();
    applyA11y(settings);
  }

  // ============ 显示无障碍设置面板 ============
  /**
   * 弹出无障碍设置浮层，提供字号 / 高对比度 / 按钮放大切换。
   * 重复点击会关闭已有面板。
   */
  function showA11yPanel() {
    // 如果已存在面板，先移除（再次点击视为关闭）
    const existing = document.getElementById('a11y-panel');
    if (existing) {
      existing.remove();
      return;
    }

    // 当前设置快照（在面板内事件中持续更新）
    const current = window.PolicyMateStore.getA11y();

    // 创建面板容器
    const panel = document.createElement('div');
    panel.id = 'a11y-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'a11y-panel-title');
    panel.style.cssText = 'position:fixed; top:70px; right:20px; background:white; border:1px solid #e0e0e0; border-radius:12px; padding:20px; box-shadow:0 4px 16px rgba(0,0,0,0.15); z-index:9999; width:280px;';

    panel.innerHTML = `
      <h3 id="a11y-panel-title" style="margin:0 0 16px 0; font-size:1.1rem; color:#333;">无障碍设置</h3>

      <div style="margin-bottom:16px;">
        <div style="margin-bottom:8px; font-weight:600;">字号调整</div>
        <div style="display:flex; gap:8px;">
          <button class="btn-a11y-font" data-size="normal" style="flex:1; padding:8px; border:1px solid #e0e0e0; background:${current.fontSize === 'normal' ? '#1e88e5' : 'white'}; color:${current.fontSize === 'normal' ? 'white' : '#333'}; border-radius:6px; cursor:pointer;">正常</button>
          <button class="btn-a11y-font" data-size="large" style="flex:1; padding:8px; border:1px solid #e0e0e0; background:${current.fontSize === 'large' ? '#1e88e5' : 'white'}; color:${current.fontSize === 'large' ? 'white' : '#333'}; border-radius:6px; cursor:pointer;">大</button>
          <button class="btn-a11y-font" data-size="xlarge" style="flex:1; padding:8px; border:1px solid #e0e0e0; background:${current.fontSize === 'xlarge' ? '#1e88e5' : 'white'}; color:${current.fontSize === 'xlarge' ? 'white' : '#333'}; border-radius:6px; cursor:pointer; font-size:1.2rem;">特大</button>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <label style="display:flex; align-items:center; cursor:pointer;">
          <input type="checkbox" id="a11y-contrast" ${current.highContrast ? 'checked' : ''} style="margin-right:8px; width:18px; height:18px;">
          <span>高对比度（黑底黄字）</span>
        </label>
      </div>

      <div style="margin-bottom:16px;">
        <label style="display:flex; align-items:center; cursor:pointer;">
          <input type="checkbox" id="a11y-large-btn" ${current.largeButton ? 'checked' : ''} style="margin-right:8px; width:18px; height:18px;">
          <span>放大按钮</span>
        </label>
      </div>

      <button id="a11y-close" style="width:100%; padding:10px; background:#1e88e5; color:white; border:none; border-radius:6px; cursor:pointer; font-size:1rem;">关闭</button>
    `;

    document.body.appendChild(panel);

    // Escape 关闭
    function handleEscape(e) {
      if (e.key === 'Escape') {
        panel.remove();
        document.removeEventListener('keydown', handleEscape);
        // 恢复焦点到触发按钮
        const btn = document.getElementById('btn-a11y');
        if (btn) btn.focus();
      }
    }
    document.addEventListener('keydown', handleEscape);

    // 焦点陷阱（Tab 限制在 panel 内）
    panel.addEventListener('keydown', function(e) {
      if (e.key !== 'Tab') return;
      const focusable = panel.querySelectorAll('button, input, select, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // 字号按钮事件：切换字号并持久化
    panel.querySelectorAll('.btn-a11y-font').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const size = btn.dataset.size;
        const newSettings = Object.assign({}, current, { fontSize: size });
        window.PolicyMateStore.setA11y(newSettings);
        applyA11y(newSettings);
        // 更新按钮样式：当前选中的高亮，其他恢复
        panel.querySelectorAll('.btn-a11y-font').forEach(function (b) {
          const isActive = b.dataset.size === size;
          b.style.background = isActive ? '#1e88e5' : 'white';
          b.style.color = isActive ? 'white' : '#333';
        });
        Object.assign(current, { fontSize: size });
      });
    });

    // 高对比度切换
    document.getElementById('a11y-contrast').addEventListener('change', function (e) {
      const newSettings = Object.assign({}, current, { highContrast: e.target.checked });
      window.PolicyMateStore.setA11y(newSettings);
      applyA11y(newSettings);
      Object.assign(current, { highContrast: e.target.checked });
    });

    // 按钮放大切换
    document.getElementById('a11y-large-btn').addEventListener('change', function (e) {
      const newSettings = Object.assign({}, current, { largeButton: e.target.checked });
      window.PolicyMateStore.setA11y(newSettings);
      applyA11y(newSettings);
      Object.assign(current, { largeButton: e.target.checked });
    });

    // 关闭按钮
    document.getElementById('a11y-close').addEventListener('click', function () {
      panel.remove();
      document.removeEventListener('keydown', handleEscape);
    });

    // 点击面板外区域自动关闭
    setTimeout(function () {
      document.addEventListener('click', function closeOnOutside(e) {
        if (!panel.contains(e.target) && e.target.id !== 'btn-a11y') {
          panel.remove();
          document.removeEventListener('keydown', handleEscape);
          document.removeEventListener('click', closeOnOutside);
        }
      });
    }, 100);
  }

  // ============ 语音朗读 ============
  /**
   * 使用 Web Speech API 朗读文本
   * - 不支持时给出提示
   * - 正在朗读时再次调用会停止朗读（切换效果）
   * @param {string} text 要朗读的文本
   */
  function speak(text) {
    if (!('speechSynthesis' in window)) {
      alert('您的浏览器不支持语音朗读功能');
      return;
    }

    // 如果正在朗读，先停止（再次点击朗读按钮视为暂停）
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // 尝试选择中文语音
    const voices = window.speechSynthesis.getVoices();
    let zhVoice = null;
    for (let i = 0; i < voices.length; i++) {
      if (voices[i].lang && voices[i].lang.indexOf('zh') === 0) {
        zhVoice = voices[i];
        break;
      }
    }
    if (zhVoice) utterance.voice = zhVoice;

    window.speechSynthesis.speak(utterance);
  }

  // ============ 朗读政策白话解读 ============
  /**
   * 朗读政策白话解读（详情页使用）
   * @param {Object} plainSummary 白话解读对象 { whatYouGet, whoCanApply, howToApply }
   */
  function speakPolicySummary(plainSummary) {
    if (!plainSummary) return;
    const text = [
      '你能拿什么：' + (plainSummary.whatYouGet || ''),
      '谁能申请：' + (plainSummary.whoCanApply || ''),
      '怎么申请：' + (plainSummary.howToApply || '')
    ].join('。');
    speak(text);
  }

  // ============ 初始化顶栏无障碍按钮 ============
  /**
   * 绑定顶栏「无障碍」按钮的点击事件，弹出设置面板。
   * 按钮元素 id 为 btn-a11y。
   */
  function initA11yButton() {
    const btn = document.getElementById('btn-a11y');
    if (btn) {
      btn.addEventListener('click', showA11yPanel);
    }
  }

  // ============ 导出 API ============
  window.PolicyMateA11y = {
    applyA11y: applyA11y,
    initA11y: initA11y,
    showA11yPanel: showA11yPanel,
    speak: speak,
    speakPolicySummary: speakPolicySummary,
    initA11yButton: initA11yButton,
    FONT_SIZE_MAP: FONT_SIZE_MAP
  };

  // ============ 自动初始化 ============
  document.addEventListener('DOMContentLoaded', function () {
    window.PolicyMateA11y.initA11y();
    window.PolicyMateA11y.initA11yButton();
  });
})();
