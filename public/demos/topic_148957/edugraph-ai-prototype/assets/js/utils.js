/* ===== utils.js · 通用工具 ===== */
window.Utils = (function () {

  // 转义 HTML
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 使用 KaTeX 渲染公式：$...$ 行内，$$...$$ 块级
  function renderMath(text) {
    if (!text) return '';
    let html = escapeHtml(text);
    try {
      if (window.katex) {
        // 先处理 $$...$$
        html = html.replace(/\$\$([\s\S]+?)\$\$/g, (m, formula) => {
          try {
            return katex.renderToString(unescapeEntities(formula), { displayMode: true, throwOnError: false });
          } catch (e) { return m; }
        });
        // 再处理 $...$
        html = html.replace(/\$([^\$\n]+?)\$/g, (m, formula) => {
          try {
            return katex.renderToString(unescapeEntities(formula), { displayMode: false, throwOnError: false });
          } catch (e) { return m; }
        });
      }
    } catch (e) { /* 忽略 */ }
    // 换行
    return html.replace(/\n/g, '<br>');
  }

  // 反转义 HTML 实体（用于公式原文）
  function unescapeEntities(s) {
    return s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  // 防抖
  function debounce(fn, ms) {
    let timer = null;
    return function () {
      const args = arguments, ctx = this;
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(ctx, args), ms);
    };
  }

  // 时间格式化
  function formatTime(ts) {
    const d = new Date(ts);
    const now = Date.now();
    const diff = (now - ts) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
    if (diff < 2592000) return Math.floor(diff / 86400) + ' 天前';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${mm}-${dd} ${hh}:${mi}`;
  }

  // 复制到剪贴板
  function copyToClipboard(text) {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (e) { reject(e); }
    });
  }

  // 通过 dataURL 下载图片
  function downloadDataUrl(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Toast 提示
  function toast(msg, type) {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.className = 'toast ' + (type || '');
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 2500);
  }

  // 唯一 ID
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // 配置 Canvas 高 DPI 适配
  function setupHiDPICanvas(canvas) {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width || canvas.width;
    const cssH = rect.height || canvas.height;
    canvas.width = Math.round(cssW * ratio);
    canvas.height = Math.round(cssH * ratio);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    // 返回逻辑尺寸（CSS 像素）
    return { ctx, width: cssW, height: cssH };
  }

  // 学科映射
  const SUBJECT_MAP = {
    '数学': { class: 'badge-math', icon: '📐' },
    '物理': { class: 'badge-physics', icon: '⚖️' },
    '化学': { class: 'badge-chem', icon: '🧪' },
    '生物': { class: 'badge-bio', icon: '🧬' },
    '语文': { class: 'badge-chinese', icon: '📝' },
    '自动': { class: 'badge-auto', icon: '🤖' },
  };
  function subjectBadge(subject) {
    const s = SUBJECT_MAP[subject] || SUBJECT_MAP['自动'];
    return `<span class="badge ${s.class}">${s.icon} ${subject || '自动'}</span>`;
  }

  return {
    escapeHtml, renderMath, debounce, formatTime,
    copyToClipboard, downloadDataUrl, toast, uid,
    setupHiDPICanvas, subjectBadge, SUBJECT_MAP
  };
})();
