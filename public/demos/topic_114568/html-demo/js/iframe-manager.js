// ========== iframe 管理器 ==========
// 负责 sandbox iframe 渲染、同域穿透、DOM 访问
class IframeManager {
  constructor(eventBus) {
    this.bus = eventBus;
    this.iframe = null;
    this.doc = null;
    this.baseHref = null;
  }

  init(iframeEl) {
    this.iframe = iframeEl;
  }

  // 加载 HTML 到 iframe
  loadHTML(htmlString, sourceUrl) {
    if (!this.iframe) return;

    // 注入 <base> 标签解决相对路径
    let finalHTML = htmlString;
    if (sourceUrl) {
      this.baseHref = sourceUrl;
      const baseTag = `<base href="${sourceUrl}">`;
      if (finalHTML.includes('<head>')) {
        finalHTML = finalHTML.replace('<head>', `<head>${baseTag}`);
      } else if (finalHTML.includes('<html>')) {
        finalHTML = finalHTML.replace('<html>', `<html><head>${baseTag}</head>`);
      } else {
        finalHTML = `<head>${baseTag}</head>` + finalHTML;
      }
    }

    // 注入编辑器辅助样式（隐藏编辑属性的影响）
    const editorCSS = `<style data-editor-injected>[data-eid]{outline:0!important;}</style>`;

    if (finalHTML.includes('</head>')) {
      finalHTML = finalHTML.replace('</head>', `${editorCSS}</head>`);
    } else {
      finalHTML = editorCSS + finalHTML;
    }

    // 设置 srcdoc
    this.iframe.setAttribute('srcdoc', finalHTML);
    this.iframe.setAttribute('sandbox', 'allow-same-origin');

    // 等待加载完成
    this.iframe.onload = () => {
      this.doc = this.iframe.contentDocument;
      this._setupAutoResize();
      this.bus.emit('iframe-loaded', { doc: this.doc });
    };
  }

  // 自动调整 iframe 高度以适配内容（消除内部滚动条）
  _setupAutoResize() {
    if (!this.doc) return;

    // 初始测量
    this._autoResize();

    // 监听 DOM 变化（元素增删/样式修改后重新测量）
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }

    // 使用 MutationObserver 监听 body 子元素和属性变化
    this._resizeObserver = new MutationObserver(() => {
      this._autoResize();
    });

    this._resizeObserver.observe(this.doc.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // 图片加载后重新测量（图片加载会改变页面高度）
    const images = this.doc.querySelectorAll('img');
    images.forEach(img => {
      if (!img.complete) {
        img.addEventListener('load', () => this._autoResize());
        img.addEventListener('error', () => this._autoResize());
      }
    });

    // 字体加载后重新测量
    if (this.doc.fonts && this.doc.fonts.ready) {
      this.doc.fonts.ready.then(() => this._autoResize());
    }
  }

  _autoResize() {
    if (!this.doc || !this.iframe) return;

    // 测量内容总高度
    const body = this.doc.body;
    const html = this.doc.documentElement;

    // 获取内容的完整高度（包括 margin）
    const bodyRect = body.getBoundingClientRect();
    const bodyHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.scrollHeight,
      html.offsetHeight
    );

    // 设置 iframe 高度为内容高度（消除内部滚动）
    this.iframe.style.height = bodyHeight + 'px';

    // 同步 overlay 高度
    const overlay = document.getElementById('overlay');
    if (overlay) {
      overlay.style.height = bodyHeight + 'px';
    }
  }

  // 获取 iframe document
  getDocument() {
    if (this.iframe) {
      return this.iframe.contentDocument;
    }
    return null;
  }

  // 获取 iframe window
  getWindow() {
    if (this.iframe) {
      return this.iframe.contentWindow;
    }
    return null;
  }

  // 通过坐标获取元素（同域穿透）
  elementFromPoint(x, y) {
    const doc = this.getDocument();
    if (!doc) return null;
    return doc.elementFromPoint(x, y);
  }

  // 获取元素相对于 iframe 的边界框
  getBoundingClientRect(element) {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const iframeRect = this.iframe.getBoundingClientRect();
    const iframeScroll = this.getWindow()?.scrollY || 0;
    const iframeScrollX = this.getWindow()?.scrollX || 0;

    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      // 相对于 iframe 的坐标（用于覆盖层定位）
      overlayLeft: rect.left,
      overlayTop: rect.top,
      // 相对于视口的坐标
      viewportLeft: iframeRect.left + rect.left,
      viewportTop: iframeRect.top + rect.top - iframeScroll,
    };
  }

  // 预览模式：临时允许脚本
  enablePreview() {
    // 保存当前 DOM 状态到 srcdoc，确保修改不会丢失
    const currentHTML = '<!DOCTYPE html>\n' + this.getDocument().documentElement.outerHTML;
    this.iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
    // 重新设置 srcdoc 以当前 DOM 状态重新加载
    this.iframe.setAttribute('srcdoc', currentHTML);
  }

  // 编辑模式：禁止脚本
  disablePreview() {
    // 保存当前 DOM 状态（预览模式下脚本可能已修改 DOM）
    const currentHTML = '<!DOCTYPE html>\n' + this.getDocument().documentElement.outerHTML;
    this.iframe.setAttribute('sandbox', 'allow-same-origin');
    // 重新设置 srcdoc 以当前 DOM 状态重新加载
    this.iframe.setAttribute('srcdoc', currentHTML);
  }

  // 获取完整 HTML
  getFullHTML() {
    const doc = this.getDocument();
    if (!doc) return '';
    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  }

  // 获取 body 内的 HTML
  getBodyHTML() {
    const doc = this.getDocument();
    if (!doc) return '';
    return doc.body ? doc.body.innerHTML : '';
  }

  // 设置 iframe 尺寸
  setWidth(width) {
    if (this.iframe) {
      this.iframe.style.width = width + 'px';
    }
  }

  // 获取 iframe 尺寸
  getDimensions() {
    if (!this.iframe) return { width: 0, height: 0 };
    const rect = this.iframe.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }
}
