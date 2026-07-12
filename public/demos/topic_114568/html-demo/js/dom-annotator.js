// ========== DOM 标注器 ==========
// 遍历 iframe 内 DOM，给可编辑元素打上 data-eid 和 data-type
class DomAnnotator {
  constructor(eventBus, iframeManager) {
    this.bus = eventBus;
    this.iframe = iframeManager;
    this.eidCounter = 0;
    this.annotatedElements = new Map(); // eid -> element
  }

  // 生成唯一 ID
  generateEID() {
    this.eidCounter++;
    return 'e' + String(this.eidCounter).padStart(3, '0');
  }

  // 获取或创建元素的 eid
  getOrCreateEID(element) {
    if (element.hasAttribute('data-eid')) {
      return element.getAttribute('data-eid');
    }
    const eid = this.generateEID();
    element.setAttribute('data-eid', eid);
    this.annotatedElements.set(eid, element);
    return eid;
  }

  // 根据标签名和 class 判断元素类型
  detectElementType(element) {
    const tag = element.tagName.toLowerCase();
    const cls = (element.className || '').toLowerCase();
    const text = (element.textContent || '').trim();
    const hasChildren = element.children.length > 0;

    // 图片
    if (tag === 'img') return 'image';
    // 视频
    if (tag === 'video') return 'video';
    // iframe 嵌入
    if (tag === 'iframe') return 'embed';
    // 按钮
    if (tag === 'button' || (tag === 'a' && (cls.includes('btn') || cls.includes('button')))) return 'button';
    // 链接
    if (tag === 'a') return 'link';
    // 列表项
    if (tag === 'li') return 'list-item';
    // 标题
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) return 'heading';
    // 段落
    if (tag === 'p') return 'paragraph';
    // SVG/图标
    if (tag === 'svg' || element.closest('svg')) return 'icon';
    // 表单
    if (['input', 'textarea', 'select', 'form'].includes(tag)) return 'form';
    // 分割线
    if (tag === 'hr') return 'divider';
    // 容器（有子元素的 div/section 等）
    if (['div', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside', 'figure'].includes(tag)) {
      if (cls.includes('hero')) return 'hero-section';
      if (cls.includes('nav') || tag === 'nav') return 'navigation';
      if (cls.includes('footer') || tag === 'footer') return 'footer';
      if (cls.includes('card')) return 'card';
      if (cls.includes('feature')) return 'feature-block';
      return 'container';
    }
    // 标签/徽章（优先于纯文本判断，避免 class 含 badge 的 span 被误判为 text）
    if (tag === 'span' && (cls.includes('badge') || cls.includes('tag') || cls.includes('label'))) return 'badge';
    // 纯文本 span
    if (tag === 'span' && !hasChildren) return 'text';
    // 默认
    if (!hasChildren && text.length > 0) return 'text';
    return 'container';
  }

  // 判断元素是否可视（可标注）
  isVisible(element) {
    const tag = element.tagName.toLowerCase();
    // 跳过非可视元素
    if (['script', 'style', 'meta', 'link', 'head', 'title', 'base', 'noscript', 'template'].includes(tag)) {
      return false;
    }
    // 跳过编辑器注入的元素
    if (element.hasAttribute('data-editor-injected') || element.getAttribute('data-editor-injected') === '') {
      return false;
    }
    // 跳过文本节点
    if (element.nodeType !== 1) return false;
    return true;
  }

  // 递归遍历 DOM 树
  annotate(rootElement) {
    const walker = document.createTreeWalker(
      rootElement,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (this.isVisible(node)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    let count = 0;
    while (walker.nextNode()) {
      const el = walker.currentNode;
      // 跳过已经标注的
      if (el.hasAttribute('data-eid')) {
        count++;
        continue;
      }
      // 标注
      const eid = this.getOrCreateEID(el);
      const type = this.detectElementType(el);
      el.setAttribute('data-type', type);
      count++;
    }

    this.bus.emit('annotated', { count, elements: this.annotatedElements });
    return count;
  }

  // 通过 eid 获取元素
  getElementByEID(eid) {
    // 先查缓存
    if (this.annotatedElements.has(eid)) {
      const el = this.annotatedElements.get(eid);
      if (el.isConnected) return el;
      // 缓存失效，清理
      this.annotatedElements.delete(eid);
    }
    // 查 DOM
    const doc = this.iframe.getDocument();
    if (!doc) return null;
    const el = doc.querySelector(`[data-eid="${eid}"]`);
    if (el) this.annotatedElements.set(eid, el);
    return el;
  }

  // 新增元素时标注
  annotateElement(element) {
    const eid = this.getOrCreateEID(element);
    const type = this.detectElementType(element);
    element.setAttribute('data-type', type);
    return eid;
  }

  // 获取元素类型
  getElementType(element) {
    return element.getAttribute('data-type') || this.detectElementType(element);
  }

  // 获取所有已标注元素
  getAllAnnotated() {
    return this.annotatedElements;
  }

  // 重置
  reset() {
    this.eidCounter = 0;
    this.annotatedElements.clear();
  }
}
