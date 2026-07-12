// ========== 元素工厂 ==========
// 根据素材面板类型创建新 DOM 元素
// 供 drag-manager 在用户从左侧素材面板拖拽到画布时调用
// 所有元素均通过 iframe document 创建，保证归属正确的文档上下文
class ElementFactory {
  constructor(annotator, iframeManager) {
    this.annotator = annotator;
    this.iframeManager = iframeManager;
  }

  // 根据素材类型创建新元素
  // type 来自 data-add 属性: heading, paragraph, label, image, video, icon,
  //   button, divider, container, form, map, linkcard, logo
  // 返回已标注（data-eid / data-type）的 DOM 元素；若类型未知或 iframe 未就绪则返回 null
  createElement(type) {
    const doc = this.iframeManager.getDocument();
    if (!doc) {
      console.warn('[ElementFactory] iframe document 尚未就绪，无法创建元素');
      return null;
    }

    let element = null;
    switch (type) {
      case 'heading':
        element = this._createHeading(doc);
        break;
      case 'paragraph':
        element = this._createParagraph(doc);
        break;
      case 'label':
        element = this._createLabel(doc);
        break;
      case 'image':
        element = this._createImage(doc);
        break;
      case 'video':
        element = this._createVideo(doc);
        break;
      case 'icon':
        element = this._createIcon(doc);
        break;
      case 'button':
        element = this._createButton(doc);
        break;
      case 'divider':
        element = this._createDivider(doc);
        break;
      case 'container':
        element = this._createContainer(doc);
        break;
      case 'form':
        element = this._createForm(doc);
        break;
      case 'map':
        element = this._createMap(doc);
        break;
      case 'linkcard':
        element = this._createLinkcard(doc);
        break;
      case 'logo':
        element = this._createLogo(doc);
        break;
      default:
        console.warn('[ElementFactory] 未知元素类型:', type);
        return null;
    }

    // 标注元素：由 annotator 分配 data-eid 与 data-type
    if (element) {
      this.annotator.annotateElement(element);
    }
    return element;
  }

  // ==================== 文字类 ====================

  // 标题
  _createHeading(doc) {
    const el = doc.createElement('h2');
    el.textContent = '标题文字';
    el.setAttribute('style', 'font-size:32px;font-weight:600;margin:16px 0;color:#1a1a1a;');
    return el;
  }

  // 段落
  _createParagraph(doc) {
    const el = doc.createElement('p');
    el.textContent = '在这里输入段落文字内容，可以详细描述你的想法和内容。';
    el.setAttribute('style', 'font-size:16px;line-height:1.6;color:#333;margin:8px 0;');
    return el;
  }

  // 标签
  _createLabel(doc) {
    const el = doc.createElement('span');
    el.textContent = '标签';
    el.setAttribute('style', 'display:inline-block;font-size:12px;font-weight:600;padding:4px 12px;border-radius:4px;background:#f0f0f0;color:#666;');
    return el;
  }

  // ==================== 媒体类 ====================

  // 图片（必须使用 iframe document 创建）
  _createImage(doc) {
    const el = doc.createElement('img');
    el.setAttribute('src', 'https://picsum.photos/400/300');
    el.setAttribute('alt', '图片描述');
    el.setAttribute('style', 'max-width:100%;border-radius:8px;display:block;');
    return el;
  }

  // 视频
  _createVideo(doc) {
    const el = doc.createElement('video');
    el.setAttribute('controls', '');
    el.setAttribute('src', '');
    el.setAttribute('style', 'max-width:100%;border-radius:8px;');
    return el;
  }

  // 图标（SVG，需使用 createElementNS）
  _createIcon(doc) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const el = doc.createElementNS(svgNS, 'svg');
    el.setAttribute('viewBox', '0 0 24 24');
    el.setAttribute('style', 'width:24px;height:24px;fill:currentColor;');
    // 星形图标
    const path = doc.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
    el.appendChild(path);
    return el;
  }

  // ==================== 组件类 ====================

  // 按钮
  _createButton(doc) {
    const el = doc.createElement('button');
    el.textContent = '按钮文字';
    el.setAttribute('style', 'padding:10px 24px;border:none;border-radius:8px;background:#667eea;color:#fff;font-size:14px;font-weight:600;cursor:pointer;');
    return el;
  }

  // 分割线
  _createDivider(doc) {
    const el = doc.createElement('hr');
    el.setAttribute('style', 'border:none;border-top:1px solid #eee;margin:16px 0;');
    return el;
  }

  // 容器
  _createContainer(doc) {
    const el = doc.createElement('div');
    el.textContent = '容器内容';
    el.setAttribute('style', 'padding:20px;border:1px solid #eee;border-radius:8px;margin:8px 0;');
    return el;
  }

  // ==================== 嵌入类 ====================

  // 表单（含邮箱输入与提交按钮）
  _createForm(doc) {
    const el = doc.createElement('form');
    el.setAttribute('style', 'padding:16px;border:1px solid #eee;border-radius:8px;');
    // 使用字符串拼接而非带换行的模板字符串，避免插入多余空白文本节点
    el.innerHTML =
      '<div style="margin-bottom:8px;">' +
      '<label style="display:block;font-size:13px;margin-bottom:4px;">邮箱</label>' +
      '<input type="email" placeholder="example@email.com" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;" />' +
      '</div>' +
      '<button type="submit" style="padding:8px 20px;border:none;border-radius:4px;background:#667eea;color:#fff;cursor:pointer;">提交</button>';
    return el;
  }

  // 地图占位（背景图 + 居中文字）
  _createMap(doc) {
    const el = doc.createElement('div');
    el.textContent = '地图占位';
    // 样式内含 url('...') 单引号，故 style 值用双引号字符串包裹
    el.setAttribute(
      'style',
      "width:100%;height:300px;background:#f0f0f0 url('https://picsum.photos/seed/map/600/300') center/cover;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#999;font-size:14px;"
    );
    return el;
  }

  // 链接卡片（缩略图 + 标题 + 描述）
  _createLinkcard(doc) {
    const el = doc.createElement('a');
    el.setAttribute('href', '#');
    el.setAttribute('style', 'display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #eee;border-radius:8px;text-decoration:none;color:inherit;');
    el.innerHTML =
      '<div style="width:40px;height:40px;background:#f0f0f0;border-radius:8px;flex-shrink:0;"></div>' +
      '<div>' +
      '<div style="font-weight:600;font-size:14px;">链接标题</div>' +
      '<div style="font-size:12px;color:#999;">链接描述文字</div>' +
      '</div>';
    return el;
  }

  // ==================== 品牌类 ====================

  // Logo 占位
  _createLogo(doc) {
    const el = doc.createElement('div');
    el.textContent = 'LOGO';
    el.setAttribute('style', 'width:80px;height:80px;background:#f0f0f0;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#666;');
    return el;
  }
}
