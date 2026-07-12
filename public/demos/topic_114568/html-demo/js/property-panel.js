// ========== 属性面板 ==========
// 选中元素后显示可安全修改的属性
class PropertyPanel {
  constructor(eventBus, iframeManager, annotator, undoRedo) {
    this.bus = eventBus;
    this.iframe = iframeManager;
    this.annotator = annotator;
    this.undoRedo = undoRedo;
    this.panel = null;
    this.currentElement = null;
    this.currentType = null;

    this._init();
  }

  _init() {
    this.panel = document.getElementById('propertyContent');

    this.bus.on('element-selected', ({ element, eid, type }) => {
      this.currentElement = element;
      this.currentType = type;
      this.render(element, eid, type);
    });

    this.bus.on('element-deselected', () => {
      this.currentElement = null;
      this.renderEmpty();
    });

    this.bus.on('editing-state-changed', ({ editing }) => {
      // 编辑态时面板不更新
    });
  }

  renderEmpty() {
    if (!this.panel) return;
    this.panel.innerHTML = `
      <div style="padding: 40px 16px; text-align: center; color: var(--text-tertiary);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="width:32px;height:32px;margin-bottom:8px;opacity:0.4;">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M9 9h6M9 13h6M9 17h3"/>
        </svg>
        <p style="font-size:12px;">点击页面元素开始编辑</p>
      </div>
    `;
  }

  // PPT 式颜色选择器：预设色板 + 原生取色器 + hex 输入
  _renderColorPicker(prop, currentColor) {
    // 预设颜色（参考 PPT 配色方案）
    const presets = [
      '#000000', '#1a1a1a', '#333333', '#555555', '#777777', '#999999', '#BBBBBB', '#FFFFFF',
      '#E74C3C', '#E67E22', '#F39C12', '#F1C40F', '#2ECC71', '#1ABC9C', '#3498DB', '#9B59B6',
      '#C0392B', '#D35400', '#E8730C', '#D4AC0D', '#27AE60', '#16A085', '#2980B9', '#8E44AD',
      '#FADBD8', '#FDEBD0', '#FEF9E7', '#D5F5E3', '#D1F2EB', '#D6EAF8', '#E8DAEF', '#F5EEF8'
    ];

    let html = `<div class="color-picker-container" data-prop="${prop}">`;
    // 当前色 + 原生取色器 + hex 输入
    html += `<div class="color-picker">
      <input type="color" class="color-native-picker" value="${this._toHex(currentColor)}" data-prop="${prop}" />
      <div class="color-swatch" style="background:${currentColor};"></div>
      <input class="color-value" type="text" data-prop="${prop}" value="${currentColor}" />
    </div>`;
    // 预设色板
    html += `<div class="color-palette">`;
    for (const c of presets) {
      html += `<div class="color-preset" style="background:${c};" data-color="${c}" data-prop="${prop}" title="${c}"></div>`;
    }
    // 透明选项
    html += `<div class="color-preset transparent" data-color="transparent" data-prop="${prop}" title="透明"></div>`;
    html += `</div>`;
    html += `</div>`;

    return html;
  }

  // 将任意 CSS 颜色值转为 #RRGGBB（原生 color input 需要）
  _toHex(color) {
    if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return '#000000';
    if (color.startsWith('#')) {
      if (color.length === 4) {
        return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
      }
      return color.substring(0, 7);
    }
    // rgb/rgba 转 hex
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      return '#' + r + g + b;
    }
    return '#000000';
  }

  render(element, eid, type) {
    if (!this.panel || !element) return;

    const tag = element.tagName.toLowerCase();
    const text = this._getElementText(element);
    const styles = this._getComputedStyles(element);
    const isTextType = ['heading', 'paragraph', 'button', 'link', 'text', 'badge', 'list-item'].includes(type);

    let html = `
      <div class="element-info">
        <div class="element-tag">${tag} · ${this._typeLabel(type)}</div>
        <div class="element-id">data-eid: ${eid || 'N/A'}</div>
      </div>
    `;

    // 基础样式
    html += `<div class="prop-group">
      <div class="prop-group-title">基础样式</div>`;

    if (isTextType) {
      html += `
        <div class="prop-row">
          <span class="prop-label">文字</span>
          <input class="prop-input" type="text" data-prop="text" value="${this._escapeAttr(text)}" />
        </div>
        <div class="prop-row">
          <span class="prop-label">颜色</span>
          ${this._renderColorPicker('color', styles.color)}
        </div>
        <div class="prop-row">
          <span class="prop-label">字号</span>
          <div class="slider-row" style="flex:1;">
            <input class="slider" type="range" min="8" max="120" data-prop="font-size"
              value="${parseInt(styles.fontSize) || 16}" />
            <span class="slider-value">${styles.fontSize}</span>
          </div>
        </div>
        <div class="prop-row">
          <span class="prop-label">字重</span>
          <select class="prop-input" data-prop="font-weight">
            <option value="300" ${styles.fontWeight == '300' ? 'selected' : ''}>细体 300</option>
            <option value="400" ${styles.fontWeight == '400' ? 'selected' : ''}>常规 400</option>
            <option value="500" ${styles.fontWeight == '500' ? 'selected' : ''}>中等 500</option>
            <option value="600" ${styles.fontWeight == '600' ? 'selected' : ''}>半粗 600</option>
            <option value="700" ${styles.fontWeight == '700' ? 'selected' : ''}>粗体 700</option>
          </select>
        </div>
        <div class="prop-row">
          <span class="prop-label">行高</span>
          <div class="slider-row" style="flex:1;">
            <input class="slider" type="range" min="1" max="3" step="0.1" data-prop="line-height"
              value="${parseFloat(styles.lineHeight) || 1.5}" />
            <span class="slider-value">${styles.lineHeight}</span>
          </div>
        </div>
        <div class="prop-row">
          <span class="prop-label">对齐</span>
          <div class="align-group" style="flex:1;">
            <button class="align-btn ${styles.textAlign === 'left' ? 'active' : ''}" data-prop="text-align" data-value="left" title="左对齐">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M2 8h8M2 12h10"/></svg>
            </button>
            <button class="align-btn ${styles.textAlign === 'center' ? 'active' : ''}" data-prop="text-align" data-value="center" title="居中">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M4 8h8M3 12h10"/></svg>
            </button>
            <button class="align-btn ${styles.textAlign === 'right' ? 'active' : ''}" data-prop="text-align" data-value="right" title="右对齐">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M6 8h8M4 12h10"/></svg>
            </button>
            <button class="align-btn ${styles.textAlign === 'justify' ? 'active' : ''}" data-prop="text-align" data-value="justify" title="两端对齐">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M2 8h12M2 12h12"/></svg>
            </button>
          </div>
        </div>
      </div>`;
    }

    if (type === 'image') {
      const src = element.getAttribute('src') || '';
      html += `
        <div class="prop-row">
          <span class="prop-label">图片源</span>
          <input class="prop-input mono" type="text" data-prop="src" value="${this._escapeAttr(src)}" />
        </div>
        <div class="prop-row">
          <span class="prop-label">Alt</span>
          <input class="prop-input" type="text" data-prop="alt" value="${this._escapeAttr(element.getAttribute('alt') || '')}" />
        </div>
        <div class="prop-row">
          <span class="prop-label">宽度</span>
          <input class="prop-input mono" type="text" data-prop="width" value="${styles.width}" />
        </div>
        <div class="prop-row">
          <span class="prop-label">高度</span>
          <input class="prop-input mono" type="text" data-prop="height" value="${styles.height}" />
        </div>
        <div class="prop-row">
          <span class="prop-label">圆角</span>
          <div class="slider-row" style="flex:1;">
            <input class="slider" type="range" min="0" max="64" data-prop="border-radius"
              value="${parseInt(styles.borderRadius) || 0}" />
            <span class="slider-value">${styles.borderRadius}</span>
          </div>
        </div>
      </div>`;
    }

    // 间距（所有元素通用）
    html += `<div class="prop-group">
      <div class="prop-group-title">间距</div>
      <div class="prop-row">
        <span class="prop-label">内边距</span>
        <input class="prop-input mono" type="text" data-prop="padding" value="${styles.padding}" />
      </div>
      <div class="prop-row">
        <span class="prop-label">外边距</span>
        <input class="prop-input mono" type="text" data-prop="margin" value="${styles.margin}" />
      </div>
      <div class="prop-row">
        <span class="prop-label">圆角</span>
        <div class="slider-row" style="flex:1;">
          <input class="slider" type="range" min="0" max="64" data-prop="border-radius"
            value="${parseInt(styles.borderRadius) || 0}" />
          <span class="slider-value">${styles.borderRadius}</span>
        </div>
      </div>
    </div>`;

    // 背景（容器类）
    if (['container', 'hero-section', 'card', 'feature-block', 'navigation', 'footer'].includes(type)) {
      html += `<div class="prop-group">
        <div class="prop-group-title">背景</div>
        <div class="prop-row">
          <span class="prop-label">背景色</span>
          ${this._renderColorPicker('background-color', styles.backgroundColor)}
        </div>
      </div>`;
    }

    // 布局分组
    const parentDisplay = element.parentNode ? this._getComputedStyle(element.parentNode, 'display') : 'block';
    html += `<div class="prop-group">
      <div class="prop-group-title">布局</div>
      <div class="prop-row">
        <span class="prop-label">显示</span>
        <select class="prop-input" data-prop="display">
          <option value="block" ${styles.display === 'block' ? 'selected' : ''}>Block</option>
          <option value="flex" ${styles.display === 'flex' ? 'selected' : ''}>Flex</option>
          <option value="grid" ${styles.display === 'grid' ? 'selected' : ''}>Grid</option>
          <option value="inline-block" ${styles.display === 'inline-block' ? 'selected' : ''}>Inline Block</option>
          <option value="none" ${styles.display === 'none' ? 'selected' : ''}>隐藏</option>
        </select>
      </div>`;

    if (styles.display === 'flex' || styles.display === 'inline-flex') {
      html += `
        <div class="prop-row">
          <span class="prop-label">方向</span>
          <div class="align-group" style="flex:1;">
            <button class="align-btn ${styles.flexDirection === 'row' ? 'active' : ''}" data-prop="flex-direction" data-value="row" title="横向">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8h12M10 5l3 3-3 3"/></svg>
            </button>
            <button class="align-btn ${styles.flexDirection === 'column' ? 'active' : ''}" data-prop="flex-direction" data-value="column" title="纵向">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2v12M5 10l3 3 3-3"/></svg>
            </button>
          </div>
        </div>
        <div class="prop-row">
          <span class="prop-label">主轴</span>
          <div class="align-grid" style="flex:1;">
            <button class="align-grid-btn ${styles.justifyContent === 'flex-start' ? 'active' : ''}" data-prop="justify-content" data-value="flex-start" title="起始">⟵</button>
            <button class="align-grid-btn ${styles.justifyContent === 'center' ? 'active' : ''}" data-prop="justify-content" data-value="center" title="居中">↔</button>
            <button class="align-grid-btn ${styles.justifyContent === 'flex-end' ? 'active' : ''}" data-prop="justify-content" data-value="flex-end" title="结束">⟶</button>
            <button class="align-grid-btn ${styles.justifyContent === 'space-between' ? 'active' : ''}" data-prop="justify-content" data-value="space-between" title="分散">⇔</button>
          </div>
        </div>
        <div class="prop-row">
          <span class="prop-label">交叉</span>
          <div class="align-grid" style="flex:1;">
            <button class="align-grid-btn ${styles.alignItems === 'flex-start' ? 'active' : ''}" data-prop="align-items" data-value="flex-start" title="起始">↑</button>
            <button class="align-grid-btn ${styles.alignItems === 'center' ? 'active' : ''}" data-prop="align-items" data-value="center" title="居中">↕</button>
            <button class="align-grid-btn ${styles.alignItems === 'flex-end' ? 'active' : ''}" data-prop="align-items" data-value="flex-end" title="结束">↓</button>
          </div>
        </div>
        <div class="prop-row">
          <span class="prop-label">间距</span>
          <div class="slider-row" style="flex:1;">
            <input class="slider" type="range" min="0" max="64" data-prop="gap"
              value="${parseInt(styles.gap) || 0}" />
            <span class="slider-value">${styles.gap}</span>
          </div>
        </div>
        <div class="prop-row">
          <span class="prop-label">换行</span>
          <div class="toggle ${styles.flexWrap === 'wrap' ? 'on' : ''}" data-prop="flex-wrap" data-value="wrap"></div>
        </div>
      `;
    }

    html += `</div>`;

    // 边框与阴影
    html += `<div class="prop-group">
      <div class="prop-group-title">边框与阴影</div>
      <div class="prop-row">
        <span class="prop-label">边框</span>
        <input class="prop-input mono" type="text" data-prop="border" value="${styles.border}" placeholder="如 1px solid #ccc" />
      </div>
      <div class="prop-row">
        <span class="prop-label">阴影</span>
        <select class="prop-input" data-prop="box-shadow">
          <option value="none" ${styles.boxShadow === 'none' ? 'selected' : ''}>无</option>
          <option value="0 1px 2px rgba(0,0,0,0.1)">微小</option>
          <option value="0 4px 12px rgba(0,0,0,0.15)">柔和</option>
          <option value="0 8px 24px rgba(0,0,0,0.2)">明显</option>
        </select>
      </div>
    </div>`;

    // 高级
    html += `<div class="prop-group">
      <div class="prop-group-title">高级</div>
      <div class="prop-row">
        <span class="prop-label">类型</span>
        <select class="prop-input" data-prop="data-type">
          <option value="heading" ${type === 'heading' ? 'selected' : ''}>标题</option>
          <option value="paragraph" ${type === 'paragraph' ? 'selected' : ''}>段落</option>
          <option value="button" ${type === 'button' ? 'selected' : ''}>按钮</option>
          <option value="image" ${type === 'image' ? 'selected' : ''}>图片</option>
          <option value="container" ${type === 'container' ? 'selected' : ''}>容器</option>
        </select>
      </div>
      <div class="prop-row">
        <span class="prop-label">锁定</span>
        <div class="toggle ${element.hasAttribute('data-user-override') ? '' : 'on'}" id="overrideToggle" role="switch" aria-checked="${element.hasAttribute('data-user-override') ? 'false' : 'true'}" tabindex="0"></div>
        <span style="font-size:10px;color:var(--text-tertiary);margin-left:4px;">用户可编辑</span>
      </div>
    </div>`;

    this.panel.innerHTML = html;
    this._bindPropertyEvents();
  }

  _bindPropertyEvents() {
    // 文本输入
    this.panel.querySelectorAll('input[data-prop], select[data-prop]').forEach(input => {
      const prop = input.getAttribute('data-prop');

      if (input.type === 'range') {
        // 滑块
        input.addEventListener('input', (e) => {
          // line-height 是无单位值，不追加 px
          const isUnitless = prop === 'line-height';
          const unit = isUnitless ? '' : 'px';
          this._applyStyle(prop, e.target.value + unit);
          const valueSpan = input.parentNode.querySelector('.slider-value');
          if (valueSpan) {
            valueSpan.textContent = e.target.value + unit;
          }
        });
      } else if (input.tagName === 'SELECT') {
        input.addEventListener('change', (e) => {
          if (prop === 'data-type') {
            this.currentElement.setAttribute('data-type', e.target.value);
          } else {
            this._applyStyleWithTransaction(prop, e.target.value);
          }
        });
      } else if (input.type === 'text') {
        input.addEventListener('change', (e) => {
          if (prop === 'text') {
            this._changeText(e.target.value);
          } else if (prop === 'src') {
            this._applyStyleWithTransaction('src', e.target.value, true);
          } else if (prop === 'alt') {
            this.currentElement.setAttribute('alt', e.target.value);
          } else {
            this._applyStyleWithTransaction(prop, e.target.value);
          }
        });
      }
    });

    // 对齐按钮
    this.panel.querySelectorAll('button[data-prop]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const prop = btn.getAttribute('data-prop');
        const value = btn.getAttribute('data-value');

        // 更新按钮选中状态
        const siblings = btn.parentNode.querySelectorAll('button[data-prop]');
        siblings.forEach(s => s.classList.remove('active'));
        btn.classList.add('active');

        this._applyStyleWithTransaction(prop, value);
      });
    });

    // 切换开关（flex-wrap 等）
    this.panel.querySelectorAll('.toggle[data-prop]').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const prop = toggle.getAttribute('data-prop');
        const value = toggle.getAttribute('data-value');

        // 先切换状态
        toggle.classList.toggle('on');
        const isOn = toggle.classList.contains('on');

        // 应用样式：wrap / nowrap
        if (prop === 'flex-wrap') {
          this._applyStyleWithTransaction(prop, isOn ? value : 'nowrap');
        }
      });
    });

    // 用户覆盖 toggle
    const overrideToggle = this.panel.querySelector('#overrideToggle');
    if (overrideToggle) {
      const toggleOverride = () => {
        overrideToggle.classList.toggle('on');
        const isOn = overrideToggle.classList.contains('on');
        overrideToggle.setAttribute('aria-checked', isOn);
        if (isOn) {
          this.currentElement.removeAttribute('data-user-override');
        } else {
          this.currentElement.setAttribute('data-user-override', 'locked');
        }
      };
      overrideToggle.addEventListener('click', (e) => { e.preventDefault(); toggleOverride(); });
      overrideToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleOverride(); }
      });
    }

    // 颜色预设色板点击
    this.panel.querySelectorAll('.color-preset').forEach(preset => {
      preset.addEventListener('click', (e) => {
        e.preventDefault();
        const prop = preset.getAttribute('data-prop');
        const color = preset.getAttribute('data-color');

        // 更新色板视觉
        const container = preset.closest('.color-picker-container');
        const swatch = container.querySelector('.color-swatch');
        const valueInput = container.querySelector('.color-value');
        const nativePicker = container.querySelector('.color-native-picker');

        swatch.style.background = color;
        valueInput.value = color;
        if (color !== 'transparent') {
          nativePicker.value = this._toHex(color);
        }

        // 应用样式
        this._applyStyleWithTransaction(prop, color);
      });
    });

    // 原生取色器实时联动
    this.panel.querySelectorAll('.color-native-picker').forEach(picker => {
      picker.addEventListener('input', (e) => {
        const prop = picker.getAttribute('data-prop');
        const color = picker.value;

        const container = picker.closest('.color-picker-container');
        const swatch = container.querySelector('.color-swatch');
        const valueInput = container.querySelector('.color-value');

        swatch.style.background = color;
        valueInput.value = color;

        this._applyStyle(prop, color);
      });

      // 提交事务
      picker.addEventListener('change', (e) => {
        const prop = picker.getAttribute('data-prop');
        this._applyStyleWithTransaction(prop, picker.value);
      });
    });

    // hex 文本输入联动
    this.panel.querySelectorAll('.color-value').forEach(input => {
      input.addEventListener('change', (e) => {
        const prop = input.getAttribute('data-prop');
        const color = input.value;

        const container = input.closest('.color-picker-container');
        const swatch = container.querySelector('.color-swatch');
        const nativePicker = container.querySelector('.color-native-picker');

        swatch.style.background = color;
        if (color !== 'transparent' && color.startsWith('#')) {
          nativePicker.value = this._toHex(color);
        }

        this._applyStyleWithTransaction(prop, color);
      });
    });
  }

  _applyStyle(prop, value) {
    if (!this.currentElement) return;
    this.currentElement.style[prop] = value;
    this.bus.emit('style-changed', { element: this.currentElement, prop, value });
  }

  _applyStyleWithTransaction(prop, value, isAttribute = false) {
    if (!this.currentElement) return;

    const element = this.currentElement;
    let oldValue;

    if (isAttribute) {
      oldValue = element.getAttribute(prop) || '';
      element.setAttribute(prop, value);
    } else {
      oldValue = element.style[prop] || '';
      element.style[prop] = value;
    }

    this.undoRedo.push({
      type: 'style-change',
      forward: () => {
        if (isAttribute) element.setAttribute(prop, value);
        else element.style[prop] = value;
      },
      backward: () => {
        if (isAttribute) {
          if (oldValue) element.setAttribute(prop, oldValue);
          else element.removeAttribute(prop);
        } else {
          element.style[prop] = oldValue;
        }
      }
    });

    this.bus.emit('style-changed', { element, prop, value });
  }

  _changeText(newText) {
    if (!this.currentElement) return;
    const element = this.currentElement;
    const oldText = element.textContent;

    element.textContent = newText;

    this.undoRedo.push({
      type: 'edit-text',
      forward: () => { element.textContent = newText; },
      backward: () => { element.textContent = oldText; }
    });
  }

  _getComputedStyle(element, prop) {
    const win = this.iframe.getWindow();
    if (!win) return '';
    try {
      return win.getComputedStyle(element).getPropertyValue(prop.replace(/([A-Z])/g, '-$1').toLowerCase());
    } catch (e) {
      return '';
    }
  }

  _getComputedStyles(element) {
    const win = this.iframe.getWindow();
    if (!win) return {};
    try {
      const cs = win.getComputedStyle(element);
      return {
        color: cs.color || '#000000',
        fontSize: cs.fontSize || '16px',
        fontWeight: cs.fontWeight || '400',
        lineHeight: cs.lineHeight || '1.5',
        textAlign: cs.textAlign || 'left',
        padding: cs.padding || '0px',
        margin: cs.margin || '0px',
        borderRadius: cs.borderRadius || '0px',
        backgroundColor: cs.backgroundColor || 'transparent',
        border: cs.border || 'none',
        boxShadow: cs.boxShadow || 'none',
        display: cs.display || 'block',
        flexDirection: cs.flexDirection || 'row',
        justifyContent: cs.justifyContent || 'flex-start',
        alignItems: cs.alignItems || 'stretch',
        gap: cs.gap || '0px',
        flexWrap: cs.flexWrap || 'nowrap',
        width: cs.width || 'auto',
        height: cs.height || 'auto',
      };
    } catch (e) {
      return {};
    }
  }

  _getElementText(element) {
    const tag = element.tagName.toLowerCase();
    if (['h1','h2','h3','h4','h5','h6','p','span','a','button','li','label'].includes(tag)) {
      return element.textContent || '';
    }
    return '';
  }

  _typeLabel(type) {
    const labels = {
      'heading': '标题',
      'paragraph': '段落',
      'button': '按钮',
      'link': '链接',
      'text': '文本',
      'badge': '标签',
      'image': '图片',
      'video': '视频',
      'embed': '嵌入',
      'container': '容器',
      'hero-section': 'Hero 区块',
      'navigation': '导航',
      'footer': '页脚',
      'card': '卡片',
      'feature-block': '功能区块',
      'list-item': '列表项',
      'form': '表单',
      'divider': '分割线',
      'icon': '图标',
    };
    return labels[type] || type;
  }

  _escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
