/**
 * 内容脚本 - 页面行为监听与DOM信息采集
 * 注入到用户访问的网页中，自动采集交互行为和页面元素信息
 */

(function () {
  // 防止重复注入
  if (window.__prdGeneratorInjected) return;
  window.__prdGeneratorInjected = true;

  // 采集数据存储
  const collectedData = {
    pageInfo: [],
    interactions: [],
    elements: [],
    url: window.location.href,
    title: document.title,
  };

  // 监听状态
  let isListening = false;

  // 无效操作过滤阈值
  const SCROLL_DEBOUNCE_MS = 500;
  let scrollTimer = null;

  /**
   * 初始化页面信息采集
   */
  function collectPageInfo() {
    const info = [];

    // 页面标题
    info.push(`页面标题：${document.title}`);

    // 页面URL
    info.push(`页面URL：${window.location.href}`);

    // 识别页面类型
    const pageType = detectPageType();
    info.push(`页面类型：${pageType}`);

    // 采集页面主要文本区域
    const mainContent = document.querySelector('main') || document.querySelector('.main-content') || document.querySelector('#app') || document.querySelector('.app') || document.body;
    if (mainContent) {
      const headings = mainContent.querySelectorAll('h1, h2, h3');
      headings.forEach(h => {
        const text = h.textContent.trim();
        if (text && text.length < 100) {
          info.push(`标题区域：${text}`);
        }
      });
    }

    // 采集面包屑导航
    const breadcrumbs = document.querySelectorAll('.breadcrumb, .el-breadcrumb, [class*="breadcrumb"], [class*="Breadcrumb"]');
    breadcrumbs.forEach(bc => {
      const text = bc.textContent.trim().replace(/\s+/g, ' > ');
      if (text) info.push(`导航路径：${text}`);
    });

    // 采集Tab标签
    const tabs = document.querySelectorAll('.el-tabs__item, [role="tab"], .ant-tabs-tab, [class*="tab-item"]');
    tabs.forEach(tab => {
      const text = tab.textContent.trim();
      if (text && text.length < 50) info.push(`Tab标签：${text}`);
    });

    collectedData.pageInfo = info;
  }

  /**
   * 识别页面类型
   */
  function detectPageType() {
    const url = window.location.href.toLowerCase();
    const bodyText = document.body.innerText || '';
    const html = document.body.innerHTML || '';

    // 基于URL特征判断
    if (url.includes('/list') || url.includes('/table')) return '列表页';
    if (url.includes('/detail') || url.includes('/info')) return '详情页';
    if (url.includes('/edit') || url.includes('/add') || url.includes('/create') || url.includes('/new')) return '编辑页';

    // 基于DOM特征判断
    const hasTable = document.querySelector('table, .el-table, .ant-table, [class*="table"]');
    const hasForm = document.querySelector('form, .el-form, .ant-form, [class*="form"]');
    const hasList = document.querySelector('.list, [class*="list-item"], [class*="card-list"]');

    if (hasTable && hasForm) return '列表页（含搜索）';
    if (hasTable) return '列表页';
    if (hasForm) return '编辑页';
    if (hasList) return '列表页';

    // 基于文本特征判断
    if (bodyText.includes('新增') || bodyText.includes('添加') || bodyText.includes('创建')) return '功能页';
    if (bodyText.includes('编辑') || bodyText.includes('修改')) return '编辑页';

    return '功能页';
  }

  /**
   * 采集页面元素信息（增强版：全面采集所有可见元素）
   */
  function collectElements() {
    const elements = [];
    const processedTexts = new Set();

    function addElement(el) {
      const key = el.type + '_' + (el.label || el.text || '') + '_' + (el.name || '');
      if (!processedTexts.has(key)) {
        processedTexts.add(key);
        elements.push(el);
      }
    }

    // 1. 采集按钮
    const buttons = document.querySelectorAll('button, .el-button, .ant-btn, [role="button"], input[type="submit"], input[type="button"], a.btn, [class*="btn"]');
    buttons.forEach(btn => {
      const text = btn.textContent.trim();
      if (text && text.length < 50 && !processedTexts.has('btn_' + text)) {
        processedTexts.add('btn_' + text);
        const isDisabled = btn.disabled || btn.classList.contains('is-disabled') || btn.classList.contains('disabled');
        elements.push({
          type: '按钮',
          text: text,
          disabled: isDisabled,
          label: text,
        });
      }
    });

    // 2. 采集输入框
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, .el-input__inner, .ant-input');
    inputs.forEach(input => {
      const actualInput = input.tagName === 'INPUT' || input.tagName === 'TEXTAREA' ? input : input.closest('input, textarea') || input;
      const label = findLabel(actualInput);
      const key = 'input_' + (label || actualInput.placeholder || actualInput.name || '');
      if (!processedTexts.has(key)) {
        processedTexts.add(key);
        elements.push({
          type: '输入框',
          label: label || '',
          placeholder: actualInput.placeholder || '',
          required: actualInput.required || actualInput.getAttribute('aria-required') === 'true',
          inputType: actualInput.type || 'text',
          name: actualInput.name || '',
        });
      }
    });

    // 3. 采集选择器（原生select + Element UI / Ant Design下拉）
    const selects = document.querySelectorAll('select, .el-select, .ant-select, [class*="select-wrapper"]');
    selects.forEach(select => {
      const actualSelect = select.tagName === 'SELECT' ? select : select.querySelector('select');
      const label = findLabel(actualSelect || select);
      const options = [];
      if (actualSelect) {
        actualSelect.querySelectorAll('option').forEach(opt => {
          if (opt.value) options.push(opt.textContent.trim());
        });
      }
      const key = 'select_' + (label || select.className);
      if (!processedTexts.has(key)) {
        processedTexts.add(key);
        elements.push({
          type: '选择器',
          label: label || '',
          options: options,
        });
      }
    });

    // 4. 采集开关/复选框
    const switches = document.querySelectorAll('.el-switch, .ant-switch, input[type="checkbox"], [role="switch"]');
    switches.forEach(sw => {
      const label = findLabel(sw);
      const text = label || sw.getAttribute('aria-label') || '';
      const key = 'switch_' + text;
      if (!processedTexts.has(key) && text) {
        processedTexts.add(key);
        elements.push({
          type: '开关',
          label: text,
        });
      }
    });

    // 5. 采集单选按钮
    const radios = document.querySelectorAll('input[type="radio"], [role="radio"], .el-radio, .ant-radio');
    radios.forEach(radio => {
      const label = findLabel(radio);
      const name = radio.name || radio.getAttribute('data-name') || '';
      const value = radio.value || radio.textContent?.trim() || '';
      const key = 'radio_' + name + '_' + value;
      if (!processedTexts.has(key) && (label || value)) {
        processedTexts.add(key);
        elements.push({
          type: '单选',
          label: label || name,
          options: [value],
        });
      }
    });

    // 6. 采集弹窗（含弹窗内部元素）
    const dialogs = document.querySelectorAll('.el-dialog, .ant-modal, [role="dialog"], .modal, [class*="dialog"], [class*="modal"]');
    dialogs.forEach(dialog => {
      const title = dialog.querySelector('.el-dialog__title, .ant-modal-title, [class*="dialog-title"], [class*="modal-title"]');
      const titleText = title ? title.textContent.trim() : '';
      const key = 'dialog_' + titleText;
      if (!processedTexts.has(key) && titleText) {
        processedTexts.add(key);
        // 采集弹窗内部元素
        const innerElements = collectInnerElements(dialog);
        elements.push({
          type: '弹窗',
          label: titleText,
          innerElements: innerElements,
        });
      }
    });

    // 7. 采集表格列信息
    const tables = document.querySelectorAll('table, .el-table, .ant-table');
    tables.forEach(table => {
      const headers = table.querySelectorAll('th, .el-table__header th, .ant-table-thead th');
      const columns = [];
      headers.forEach(th => {
        const text = th.textContent.trim();
        if (text && text.length < 30) columns.push(text);
      });
      if (columns.length > 0) {
        elements.push({
          type: '表格',
          label: '数据表格',
          options: columns,
        });
      }
    });

    // 8. 采集菜单项
    const menuItems = document.querySelectorAll('.el-menu-item, .ant-menu-item, [role="menuitem"], nav a, .nav-item, [class*="menu-item"]');
    menuItems.forEach(item => {
      const text = item.textContent.trim();
      const key = 'menu_' + text;
      if (!processedTexts.has(key) && text && text.length < 50) {
        processedTexts.add(key);
        elements.push({
          type: '菜单项',
          label: text,
        });
      }
    });

    // 9. 采集Tab标签
    const tabs = document.querySelectorAll('.el-tabs__item, [role="tab"], .ant-tabs-tab, [class*="tab-item"]');
    tabs.forEach(tab => {
      const text = tab.textContent.trim();
      const key = 'tab_' + text;
      if (!processedTexts.has(key) && text && text.length < 50) {
        processedTexts.add(key);
        elements.push({
          type: 'Tab标签',
          label: text,
        });
      }
    });

    // 10. 采集面包屑
    const breadcrumbs = document.querySelectorAll('.breadcrumb, .el-breadcrumb, [class*="breadcrumb"], [class*="Breadcrumb"]');
    breadcrumbs.forEach(bc => {
      const items = bc.querySelectorAll('.el-breadcrumb__item, .ant-breadcrumb-link, li, a');
      const path = [];
      items.forEach(item => {
        const text = item.textContent.trim();
        if (text && text.length < 50) path.push(text);
      });
      if (path.length > 0) {
        const key = 'breadcrumb_' + path.join('/');
        if (!processedTexts.has(key)) {
          processedTexts.add(key);
          elements.push({
            type: '面包屑',
            label: path.join(' > '),
            options: path,
          });
        }
      }
    });

    // 11. 采集分页器
    const paginations = document.querySelectorAll('.el-pagination, .ant-pagination, [class*="pagination"]');
    paginations.forEach(pagination => {
      const total = pagination.querySelector('.el-pagination__total, .ant-pagination-total-text');
      const totalText = total ? total.textContent.trim() : '';
      const pageSizes = pagination.querySelector('.el-pagination__sizes select, .ant-pagination-options-size-changer');
      const sizeOptions = [];
      if (pageSizes) {
        pageSizes.querySelectorAll('option').forEach(opt => {
          if (opt.value) sizeOptions.push(opt.textContent.trim());
        });
      }
      const key = 'pagination_' + totalText;
      if (!processedTexts.has(key)) {
        processedTexts.add(key);
        elements.push({
          type: '分页器',
          label: totalText || '分页',
          options: sizeOptions,
        });
      }
    });

    // 12. 采集工具栏/操作栏
    const toolbars = document.querySelectorAll('.toolbar, [class*="toolbar"], [class*="tool-bar"], .el-card__header, .ant-card-head');
    toolbars.forEach(toolbar => {
      const actions = toolbar.querySelectorAll('button, a, [role="button"]');
      const actionTexts = [];
      actions.forEach(action => {
        const text = action.textContent.trim();
        if (text && text.length < 30) actionTexts.push(text);
      });
      if (actionTexts.length > 0) {
        const key = 'toolbar_' + actionTexts.join(',');
        if (!processedTexts.has(key)) {
          processedTexts.add(key);
          elements.push({
            type: '工具栏',
            label: '操作栏',
            options: actionTexts,
          });
        }
      }
    });

    // 13. 采集提示/标签/徽标
    const tags = document.querySelectorAll('.el-tag, .ant-tag, [class*="tag"]:not([class*="tabs"]):not([class*="tab-item"])');
    tags.forEach(tag => {
      const text = tag.textContent.trim();
      const key = 'tag_' + text;
      if (!processedTexts.has(key) && text && text.length < 30) {
        processedTexts.add(key);
        elements.push({
          type: '标签',
          label: text,
        });
      }
    });

    // 14. 采集提示文案/空状态
    const empties = document.querySelectorAll('.el-empty, .ant-empty, [class*="empty"], [class*="no-data"], [class*="noData"]');
    empties.forEach(empty => {
      const desc = empty.querySelector('.el-empty__description, .ant-empty-description, p, span');
      const text = desc ? desc.textContent.trim() : empty.textContent.trim().substring(0, 50);
      const key = 'empty_' + text;
      if (!processedTexts.has(key) && text) {
        processedTexts.add(key);
        elements.push({
          type: '空状态',
          label: text,
        });
      }
    });

    collectedData.elements = elements;
  }

  /**
   * 采集容器（弹窗/抽屉等）内部的所有表单元素
   */
  function collectInnerElements(container) {
    const innerElements = [];

    // 弹窗内按钮
    container.querySelectorAll('button, .el-button, .ant-btn, [role="button"]').forEach(btn => {
      const text = btn.textContent.trim();
      if (text && text.length < 50) {
        innerElements.push({ type: '按钮', label: text });
      }
    });

    // 弹窗内输入框
    container.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea').forEach(input => {
      const label = findLabel(input);
      innerElements.push({
        type: '输入框',
        label: label || input.placeholder || input.name || '',
        placeholder: input.placeholder || '',
        required: input.required,
      });
    });

    // 弹窗内选择器
    container.querySelectorAll('select, .el-select, .ant-select').forEach(select => {
      const actualSelect = select.tagName === 'SELECT' ? select : select.querySelector('select');
      const label = findLabel(actualSelect || select);
      const options = [];
      if (actualSelect) {
        actualSelect.querySelectorAll('option').forEach(opt => {
          if (opt.value) options.push(opt.textContent.trim());
        });
      }
      innerElements.push({ type: '选择器', label: label || '', options });
    });

    // 弹窗内开关
    container.querySelectorAll('.el-switch, .ant-switch, input[type="checkbox"], [role="switch"]').forEach(sw => {
      const label = findLabel(sw);
      innerElements.push({ type: '开关', label: label || sw.getAttribute('aria-label') || '' });
    });

    return innerElements;
  }

  /**
   * 采集下拉弹出层中的所有选项（Element UI / Ant Design / 原生）
   */
  function collectDropdownOptions() {
    const dropdownElements = [];
    const processedKeys = new Set();

    // Element UI 下拉弹出层
    const elPopovers = document.querySelectorAll('.el-select-dropdown, .el-popper[aria-hidden="false"], .el-select-dropdown[x-placement]');
    elPopovers.forEach(dropdown => {
      const items = dropdown.querySelectorAll('.el-select-dropdown__item, .el-option');
      const options = [];
      items.forEach(item => {
        const text = item.textContent.trim();
        if (text && text.length < 100) options.push(text);
      });
      if (options.length > 0) {
        const key = 'el_dropdown_' + options.join(',');
        if (!processedKeys.has(key)) {
          processedKeys.add(key);
          dropdownElements.push({
            type: '下拉选项',
            label: 'Element下拉',
            options: options,
          });
        }
      }
    });

    // Ant Design 下拉弹出层
    const antDropdowns = document.querySelectorAll('.ant-select-dropdown, .ant-dropdown:not(.ant-dropdown-hidden)');
    antDropdowns.forEach(dropdown => {
      const items = dropdown.querySelectorAll('.ant-select-item, .ant-select-item-option');
      const options = [];
      items.forEach(item => {
        const text = item.textContent.trim();
        if (text && text.length < 100) options.push(text);
      });
      if (options.length > 0) {
        const key = 'ant_dropdown_' + options.join(',');
        if (!processedKeys.has(key)) {
          processedKeys.add(key);
          dropdownElements.push({
            type: '下拉选项',
            label: 'Ant下拉',
            options: options,
          });
        }
      }
    });

    // 通用下拉弹出层（ul[role="listbox"], div[role="listbox"]）
    const listBoxes = document.querySelectorAll('[role="listbox"]:not(.ant-select-dropdown):not(.el-select-dropdown)');
    listBoxes.forEach(listbox => {
      const items = listbox.querySelectorAll('[role="option"], li');
      const options = [];
      items.forEach(item => {
        const text = item.textContent.trim();
        if (text && text.length < 100) options.push(text);
      });
      if (options.length > 0) {
        const key = 'listbox_' + options.join(',');
        if (!processedKeys.has(key)) {
          processedKeys.add(key);
          dropdownElements.push({
            type: '下拉选项',
            label: '下拉列表',
            options: options,
          });
        }
      }
    });

    // 将新发现的下拉选项合并到已有元素中（不覆盖已有元素）
    const existingKeys = new Set(collectedData.elements.map(el => el.type + '_' + (el.label || '')));
    dropdownElements.forEach(el => {
      const key = el.type + '_' + el.label;
      if (!existingKeys.has(key)) {
        collectedData.elements.push(el);
        existingKeys.add(key);
      } else {
        // 合并options到已有元素
        const existing = collectedData.elements.find(e => e.type === el.type && e.label === el.label);
        if (existing && el.options) {
          const mergedOptions = [...new Set([...(existing.options || []), ...el.options])];
          existing.options = mergedOptions;
        }
      }
    });

    return dropdownElements;
  }

  /**
   * 查找表单元素关联的label
   */
  function findLabel(element) {
    if (!element) return '';

    // 通过for属性查找
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent.trim();
    }

    // 查找父级form-item
    const formItem = element.closest('.el-form-item, .ant-form-item, [class*="form-item"], [class*="formItem"]');
    if (formItem) {
      const label = formItem.querySelector('.el-form-item__label, .ant-form-item-label, [class*="form-label"], [class*="formLabel"]');
      if (label) return label.textContent.trim().replace(/[:：]/g, '');
    }

    // 查找相邻label
    const parent = element.parentElement;
    if (parent) {
      const label = parent.querySelector('label');
      if (label) return label.textContent.trim().replace(/[:：]/g, '');
    }

    return '';
  }

  /**
   * 记录交互行为
   */
  function recordInteraction(type, target, value, result) {
    if (!isListening) return;

    const interaction = {
      type,
      target: target || '',
      value: value || '',
      result: result || '',
      timestamp: Date.now(),
    };

    collectedData.interactions.push(interaction);

    // 通知popup数据更新
    try {
      chrome.runtime.sendMessage({
        type: 'interactionRecorded',
        data: { count: collectedData.interactions.length },
      });
    } catch (e) {
      // popup可能未打开，忽略
    }
  }

  /**
   * 获取元素的可读描述
   */
  function getElementDescription(el) {
    if (!el) return '未知元素';
    const tag = el.tagName?.toLowerCase() || '';
    const text = el.textContent?.trim().substring(0, 50) || '';
    const className = el.className && typeof el.className === 'string' ? el.className.split(' ')[0] : '';
    const id = el.id || '';

    if (text && text.length < 30) return text;
    if (id) return `${tag}#${id}`;
    if (className) return `${tag}.${className}`;
    return tag;
  }

  /**
   * 启动监听
   */
  function startListening() {
    if (isListening) return;
    isListening = true;

    // 初始采集
    collectPageInfo();
    collectElements();

    // 监听点击事件
    document.addEventListener('click', handleClick, true);

    // 监听输入事件
    document.addEventListener('change', handleChange, true);
    document.addEventListener('input', handleInput, true);

    // 监听滚动
    document.addEventListener('scroll', handleScroll, true);

    // 监听DOM变化（弹窗、动态内容）
    observeDOMChanges();
  }

  /**
   * 停止监听
   */
  function stopListening() {
    isListening = false;
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('change', handleChange, true);
    document.removeEventListener('input', handleInput, true);
    document.removeEventListener('scroll', handleScroll, true);

    if (window.__prdMutationObserver) {
      window.__prdMutationObserver.disconnect();
      window.__prdMutationObserver = null;
    }
  }

  /**
   * 处理点击事件
   */
  function handleClick(event) {
    const target = event.target;

    // 过滤无效点击
    if (!target || target === document.body || target === document.documentElement) return;

    const desc = getElementDescription(target);
    const tag = target.tagName?.toLowerCase() || '';

    // 下拉选择器点击 — 采集下拉选项
    if (target.closest('.el-select, .ant-select, [class*="select-wrapper"], select')) {
      const selectEl = target.closest('.el-select, .ant-select, [class*="select-wrapper"], select');
      const label = findLabel(selectEl);
      recordInteraction('点击下拉', label || desc, '', `展开${label || '下拉'}选择器`);
      // 延迟采集下拉弹出层选项（等DOM渲染完成）
      setTimeout(() => {
        collectDropdownOptions();
        collectElements();
      }, 500);
      return;
    }

    // 按钮点击
    if (target.closest('button, .el-button, .ant-btn, [role="button"], input[type="submit"]')) {
      const btn = target.closest('button, .el-button, .ant-btn, [role="button"], input[type="submit"]');
      recordInteraction('点击按钮', btn.textContent.trim(), '', `触发${btn.textContent.trim()}操作`);
      return;
    }

    // 链接点击
    if (target.closest('a[href]')) {
      const link = target.closest('a[href]');
      recordInteraction('点击链接', link.textContent.trim(), '', `跳转至${link.href}`);
      return;
    }

    // Tab切换
    if (target.closest('.el-tabs__item, [role="tab"], .ant-tabs-tab')) {
      const tab = target.closest('.el-tabs__item, [role="tab"], .ant-tabs-tab');
      recordInteraction('切换Tab', tab.textContent.trim(), '', `切换至${tab.textContent.trim()}标签页`);
      return;
    }

    // 菜单点击
    if (target.closest('.el-menu-item, .ant-menu-item, [role="menuitem"], nav a')) {
      const menuItem = target.closest('.el-menu-item, .ant-menu-item, [role="menuitem"], nav a');
      recordInteraction('点击菜单', menuItem.textContent.trim(), '', `导航至${menuItem.textContent.trim()}`);
      return;
    }

    // 弹窗关闭
    if (target.closest('.el-dialog__close, .ant-modal-close, [class*="close-btn"], [aria-label="Close"]')) {
      recordInteraction('关闭弹窗', desc, '', '关闭当前弹窗');
      return;
    }

    // 开关切换
    if (target.closest('.el-switch, .ant-switch, [role="switch"]')) {
      const sw = target.closest('.el-switch, .ant-switch, [role="switch"]');
      const isChecked = sw.classList.contains('is-checked') || sw.classList.contains('ant-switch-checked') || sw.getAttribute('aria-checked') === 'true';
      recordInteraction('切换开关', desc, '', isChecked ? '关闭' : '开启');
      return;
    }

    // 通用点击记录
    if (tag !== 'div' || target.className || target.id) {
      recordInteraction('点击', desc, '', '');
    }

    // 重新采集元素（可能有动态变化）
    setTimeout(() => collectElements(), 300);
  }

  /**
   * 处理change事件
   */
  function handleChange(event) {
    const target = event.target;
    if (!target) return;

    const tag = target.tagName?.toLowerCase() || '';
    const label = findLabel(target);

    if (tag === 'select') {
      const selectedOption = target.options[target.selectedIndex]?.text || '';
      recordInteraction('下拉选择', label || '选择器', selectedOption, `选择${selectedOption}`);
    } else if (target.type === 'checkbox') {
      recordInteraction('复选框切换', label || target.name || '', target.checked ? '选中' : '取消', target.checked ? '勾选' : '取消勾选');
    } else if (target.type === 'radio') {
      recordInteraction('单选选择', label || target.name || '', target.value, `选择${target.value}`);
    }

    // 重新采集元素
    setTimeout(() => collectElements(), 300);
  }

  /**
   * 处理input事件（防抖）
   */
  let inputTimer = null;
  function handleInput(event) {
    const target = event.target;
    if (!target) return;

    const tag = target.tagName?.toLowerCase() || '';
    if (tag !== 'input' && tag !== 'textarea') return;

    clearTimeout(inputTimer);
    inputTimer = setTimeout(() => {
      const label = findLabel(target);
      const value = target.type === 'password' ? '******' : target.value;
      recordInteraction('输入', label || target.placeholder || target.name || '', value, `在${label || '输入框'}中输入内容`);
    }, 500);
  }

  /**
   * 处理滚动事件（防抖）
   */
  function handleScroll() {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      recordInteraction('滚动页面', '', '', '查看更多内容');
    }, SCROLL_DEBOUNCE_MS);
  }

  /**
   * 监听DOM变化
   */
  function observeDOMChanges() {
    if (window.__prdMutationObserver) {
      window.__prdMutationObserver.disconnect();
    }

    const observer = new MutationObserver((mutations) => {
      if (!isListening) return;

      let hasDialogChange = false;
      let hasSignificantChange = false;

      for (const mutation of mutations) {
        // 检测弹窗出现
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          if (node.matches?.('.el-dialog, .ant-modal, [role="dialog"], .modal, [class*="dialog"], [class*="modal"]') ||
            node.querySelector?.('.el-dialog, .ant-modal, [role="dialog"], .modal, [class*="dialog"], [class*="modal"]')) {
            hasDialogChange = true;
          }
          if (node.matches?.('form, .el-form, .ant-form, table, .el-table, .ant-table')) {
            hasSignificantChange = true;
          }
          // 检测下拉弹出层出现
          if (node.matches?.('.el-select-dropdown, .ant-select-dropdown, [role="listbox"], .el-popper') ||
            node.querySelector?.('.el-select-dropdown__item, .ant-select-item, [role="option"]')) {
            setTimeout(() => collectDropdownOptions(), 300);
          }
        }

        // 检测弹窗消失
        for (const node of mutation.removedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          if (node.matches?.('.el-dialog, .ant-modal, [role="dialog"]') ||
            node.querySelector?.('.el-dialog, .ant-modal, [role="dialog"]')) {
            recordInteraction('弹窗关闭', '', '', '弹窗已关闭');
          }
        }
      }

      if (hasDialogChange) {
        setTimeout(() => {
          collectElements();
          const dialogs = document.querySelectorAll('.el-dialog, .ant-modal, [role="dialog"]');
          dialogs.forEach(d => {
            if (d.offsetParent !== null) {
              const title = d.querySelector('.el-dialog__title, .ant-modal-title, [class*="dialog-title"]');
              if (title) {
                recordInteraction('弹窗出现', title.textContent.trim(), '', `打开${title.textContent.trim()}弹窗`);
              }
            }
          });
        }, 200);
      }

      if (hasSignificantChange) {
        setTimeout(() => collectElements(), 300);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.__prdMutationObserver = observer;
  }

  /**
   * 获取采集数据
   */
  function getCollectedData() {
    // 重新采集最新页面信息
    collectPageInfo();
    collectElements();
    return { ...collectedData };
  }

  /**
   * 重置采集数据
   */
  function resetData() {
    collectedData.pageInfo = [];
    collectedData.interactions = [];
    collectedData.elements = [];
    collectedData.url = window.location.href;
    collectedData.title = document.title;
  }

  /**
   * 监听来自popup/background的消息
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'startListening':
        startListening();
        sendResponse({ success: true, message: '监听已启动' });
        break;
      case 'stopListening':
        stopListening();
        sendResponse({ success: true, message: '监听已停止' });
        break;
      case 'getCollectedData':
        const data = getCollectedData();
        sendResponse({ success: true, data });
        break;
      case 'resetData':
        resetData();
        sendResponse({ success: true, message: '数据已重置' });
        break;
      case 'getListeningStatus':
        sendResponse({ success: true, isListening, interactionCount: collectedData.interactions.length });
        break;
      default:
        break;
    }
    return true; // 保持消息通道开放
  });
})();
