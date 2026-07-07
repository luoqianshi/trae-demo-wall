/**
 * AI全流程求职智能管家 - Chrome Extension Content Script
 * 功能：智能识别招聘页面投递表单，自动填充简历信息
 * 版本：v2.0 | 2026-06-25
 */

(function () {
  'use strict';

  // 防止重复注入
  if (window.__jobpilotInjected) return;
  window.__jobpilotInjected = true;

  // ============================================================
  // 一、简历数据管理
  // ============================================================

  const DEFAULT_RESUME = {};
  let resumeData = { ...DEFAULT_RESUME };
  // 当前 activeProfile 的自定义字段 Schema：{ sections:[], fields:{ key: {label,type,section,options,keywords,isCustom} } }
  let customSchema = { sections: [], fields: {} };

  async function ensureResumeData(incomingData) {
    if (incomingData && Object.keys(incomingData).length > 0) {
      resumeData = { ...resumeData, ...incomingData };
      // 同时尝试加载 customSchema（如果还没加载）
      if (Object.keys(customSchema.fields).length === 0) {
        try { await loadCustomSchema(); } catch (e) {}
      }
      return resumeData;
    }
    try {
      const profileData = await chrome.runtime.sendMessage({ action: 'getProfileFillData' });
      if (profileData && Object.keys(profileData).length > 0) {
        resumeData = { ...DEFAULT_RESUME, ...profileData };
      }
      // 加载 customSchema（与 profile 数据并行）
      try { await loadCustomSchema(); } catch (e) {}
    } catch (e) {
      try {
        const result = await chrome.storage.local.get(['resumeData']);
        if (result.resumeData) {
          resumeData = { ...DEFAULT_RESUME, ...result.resumeData };
        }
      } catch (e2) {}
    }
    return resumeData;
  }

  // 加载当前 activeProfile 的自定义字段 Schema
  async function loadCustomSchema() {
    try {
      const resp = await chrome.runtime.sendMessage({ action: 'customSchema_get' });
      if (resp && resp.success && resp.schema) {
        customSchema = resp.schema;
      } else {
        customSchema = { sections: [], fields: {} };
      }
    } catch (e) {
      customSchema = { sections: [], fields: {} };
    }
    return customSchema;
  }

  // ============================================================
  // 二、React/Vue 框架兼容的值设置器
  // ============================================================

  function setNativeValue(element, value) {
    const tag = element.tagName;
    const proto = tag === 'SELECT'
      ? window.HTMLSelectElement.prototype
      : (tag === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype);
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
    if (descriptor && descriptor.set) {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }
    if (tag === 'INPUT' && element.type !== 'checkbox' && element.type !== 'radio') {
      try {
        element.defaultValue = value;
      } catch (e) {}
    }
  }

  function triggerEvents(element) {
    try {
      const setValue = Object.getOwnPropertyDescriptor(
        element.tagName === 'INPUT' ? window.HTMLInputElement.prototype :
        element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype :
        window.HTMLSelectElement.prototype,
        'value'
      );
      if (setValue && setValue.set) {
        setValue.set.call(element, element.value);
      }
    } catch (e) {}
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
    if (element.tagName === 'SELECT') {
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  const NATIVE_CONTROLS = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"]), textarea, select';
  const CUSTOM_CONTROLS = '[class*="select"]:not(input):not(select):not(button):not(a), [class*="picker"]:not(input):not(select):not(button), [class*="cascader"]:not(input):not(select):not(button), [class*="dropdown"]:not(input):not(select):not(button), [role="combobox"], [class*="Select"]:not(input):not(select):not(button):not(a), [class*="Picker"]:not(input):not(select):not(button), [class*="zp-"]:not(input):not(select):not(button):not(a), [class*="boss-"]:not(input):not(select):not(button):not(a), [class*="geek-"]:not(input):not(select):not(button):not(a), [class*="input-box"]:not(input):not(select):not(button):not(a), [class*="select-box"]:not(input):not(select):not(button):not(a), [class*="choose"]:not(input):not(select):not(button):not(a), [class*="selector"]:not(input):not(select):not(button):not(a)';
  const ALL_CONTROLS = NATIVE_CONTROLS + ', ' + CUSTOM_CONTROLS;

  function isCustomSelect(el) {
    if (!el || el.tagName === 'SELECT' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'BUTTON' || el.tagName === 'A') return false;
    const role = el.getAttribute('role');
    if (role === 'combobox') return true;
    if (role === 'option' || role === 'listbox' || role === 'menu' || role === 'menuitem' || role === 'tree' || role === 'grid') return false;
    const cls = (el.className || '').toString();
    if (/select/i.test(cls) || /picker/i.test(cls) || /dropdown/i.test(cls) || /cascader/i.test(cls) || /combo/i.test(cls) || /zp-select/i.test(cls) || /boss-select/i.test(cls)) {
      if (/(-item|-option|-panel|-menu|-list|-drop-|-wrap|-icon|-arrow|-content|-layer|-mask|__item|__option|__panel|__menu|__list)/i.test(cls) && !/(selector|trigger|selection|combobox|picker)(-item|__content)?$/i.test(cls)) {
        const clickable = el.querySelector('[class*="selector"], [class*="trigger"], [class*="selection"], [class*="combobox"], [role="combobox"], input[readonly]');
        if (clickable && clickable !== el) return false;
        if (/(-item|-option|__item|__option)/i.test(cls)) return false;
      }
      const text = (el.textContent || '').replace(/\s+/g, '').trim();
      if (text.length > 0 && text.length <= 3 && !/^请/.test(text) && /[\u4e00-\u9fa5]/.test(text)) return false;
      return true;
    }
    const style = el.getAttribute('style') || '';
    if (/cursor:\s*pointer/i.test(style) || /cursor:\s*pointer/i.test(window.getComputedStyle?.(el)?.cursor || '')) {
      const hasInput = el.querySelector('input[readonly], input[disabled]');
      const hasArrow = el.querySelector('[class*="arrow"], [class*="caret"], svg path[d*="M0 0 L"], i[class*="arrow"]');
      if (hasInput && hasArrow) return true;
    }
    return false;
  }

  function findCustomSelectTrigger(el) {
    if (!el) return null;
    if (el.tagName === 'INPUT' && el.readOnly) return el;
    if (el.getAttribute('role') === 'combobox') return el;
    const cls = (el.className || '').toString();
    if (/selector|trigger|selection|combobox/i.test(cls) && isElementVisible(el)) return el;
    const trigger = el.querySelector(
      '[class*="selector"], [class*="trigger"], [class*="selection"], [class*="combobox"], ' +
      '[role="combobox"], input[readonly], [class*="select-input"], [class*="input-wrap"], [class*="select-trigger"], ' +
      '[class*="zp-select"] input, [class*="boss-select"] input, ' +
      '[class*="value"]:not(input):not(select), [class*="display-text"], ' +
      'input[placeholder*="请选择" i]'
    );
    if (trigger && isElementVisible(trigger)) return trigger;
    const firstInput = el.querySelector('input');
    if (firstInput && isElementVisible(firstInput)) return firstInput;
    return el;
  }

  function isInsideCustomSelect(el) {
    if (!el || el.tagName !== 'INPUT') return false;
    if (el.type === 'hidden' || el.type === 'radio' || el.type === 'checkbox') return false;
    let p = el.parentElement;
    let depth = 0;
    while (p && p !== document.body && depth < 8) {
      if (p.tagName !== 'FORM' && isCustomSelect(p)) {
        const realTrigger = findCustomSelectTrigger(p);
        if (realTrigger && realTrigger !== el) return true;
      }
      p = p.parentElement;
      depth++;
    }
    return false;
  }

  function getControlType(el) {
    if (!el) return 'unknown';
    const tag = el.tagName;
    if (tag === 'SELECT') return 'select';
    if (tag === 'TEXTAREA') return 'textarea';
    if (tag === 'INPUT') {
      const t = (el.type || 'text').toLowerCase();
      if (t === 'radio') return 'radio';
      if (t === 'checkbox') return 'checkbox';
      if (t === 'date' || t === 'datetime-local' || t === 'month') return 'date';
      if (t === 'number') return 'number';
      if (el.readOnly) {
        const ph = (el.placeholder || '').trim();
        if (ph && /请选择|请选择|选择$|选择|下拉|picker|select/i.test(ph)) {
          return 'custom-select';
        }
        const parent = el.parentElement;
        if (parent && isCustomSelect(parent)) {
          return 'custom-select';
        }
        if (parent && /select|picker|dropdown|cascader|combo|choose/i.test((parent.className || '').toString())) {
          return 'custom-select';
        }
      }
      return 'text';
    }
    if (isCustomSelect(el)) return 'custom-select';
    return 'unknown';
  }

  function fillCustomSelect(element, value, fieldName) {
    const strValue = String(value).trim();
    if (!strValue) return false;
    const valueMap = FIELD_VALUE_MAP[fieldName];
    const aliases = new Set();
    aliases.add(strValue);
    if (valueMap && valueMap[strValue]) {
      valueMap[strValue].forEach(a => aliases.add(a));
    }

    const isLocationField = ['native_place', 'hukou_location', 'location', 'current_residence', 'birthplace', 'target_city', 'mailing_address'].includes(fieldName);

    const getText = el => (el.textContent || '').replace(/\s+/g, '').trim();

    const splitLocation = (val) => {
      const parts = [];
      let rest = val;
      const provSuffix = ['省', '市', '自治区', '特别行政区', '壮族自治区', '回族自治区', '维吾尔自治区'];
      const citySuffix = ['市', '地区', '盟', '自治州'];
      const distSuffix = ['区', '县', '市', '旗'];
      let matched = false;
      for (const suf of provSuffix) {
        const idx = rest.indexOf(suf);
        if (idx > 0) {
          const end = idx + suf.length;
          parts.push(rest.substring(0, end));
          rest = rest.substring(end);
          matched = true;
          break;
        }
      }
      if (!matched && rest.length >= 2) {
        if (rest.length >= 3 && ['北京市','上海市','天津市','重庆市'].includes(rest.substring(0,3))) {
          parts.push(rest.substring(0,3));
          rest = rest.substring(3);
        } else if (rest.length >= 2 && !['北京','上海','天津','重庆'].includes(rest.substring(0,2))) {
          parts.push(rest.substring(0,2) + '省');
          rest = rest.substring(2);
        } else {
          parts.push(rest.substring(0,2));
          rest = rest.substring(2);
        }
      }
      if (rest) {
        matched = false;
        for (const suf of citySuffix) {
          const idx = rest.indexOf(suf);
          if (idx > 0) {
            const end = idx + suf.length;
            parts.push(rest.substring(0, end));
            rest = rest.substring(end);
            matched = true;
            break;
          }
        }
        if (!matched && rest.length >= 2) {
          const cityName = rest.length >= 3 ? rest.substring(0, rest.length-1) : rest;
          parts.push(cityName + '市');
          rest = '';
        }
      }
      if (rest) parts.push(rest);
      return parts.length > 1 ? parts : null;
    };

    const searchOptions = (panels, targetValues) => {
      const targets = Array.isArray(targetValues) ? targetValues : [targetValues];
      for (const panel of panels) {
        if (!isElementVisible(panel)) continue;
        const options = panel.querySelectorAll('li, [role="option"], [class*="option"], [class*="item"], a, span, div, dd, dt, td, .ui-select-item');
        let bestMatch = null;
        let bestScore = 0;
        for (const opt of options) {
          const optText = getText(opt);
          if (!optText || optText.length > 50) continue;
          if (/^(请选择|请点击|--|全部|不限|请\s*选\s*择|请\s*点\s*击|请输入)$/.test(optText)) continue;
          const childCount = opt.querySelectorAll('li, [role="option"], [class*="option"], a').length;
          if (childCount > 0 && optText.length > 4) continue;
          let score = 0;
          for (const target of targets) {
            if (optText === target) score = Math.max(score, 100);
            else if (optText.replace(/省|市|区|县|自治区|特别行政区|地区|盟|自治州|壮族|回族|维吾尔/g,'') === target.replace(/省|市|区|县|自治区|特别行政区|地区|盟|自治州|壮族|回族|维吾尔/g,'')) score = Math.max(score, 90);
            else if (optText.includes(target) && target.length >= 1) score = Math.max(score, 80);
            else if (target.includes(optText) && optText.length >= 2) score = Math.max(score, 60);
          }
          for (const alias of aliases) {
            if (optText === alias) score = Math.max(score, 100);
            else if (optText.includes(alias) && alias.length >= 2) score = Math.max(score, 85);
          }
          if (optText === strValue) score = Math.max(score, 95);
          if (fieldName === 'ethnicity' && (optText === strValue + '族' || strValue === optText + '族')) score = Math.max(score, 90);
          if (fieldName === 'hukou_type' && (optText.includes(strValue) || strValue.includes(optText))) score = Math.max(score, 85);
          if (isLocationField && (optText.includes(strValue) || strValue.includes(optText))) score = Math.max(score, 75);
          if (fieldName === 'political_status') {
            if (optText.includes(strValue) || strValue.includes(optText)) score = Math.max(score, 80);
          }
          if (fieldName === 'class_rank' && (optText.includes(strValue) || strValue.includes(optText))) score = Math.max(score, 75);
          if (fieldName === 'english_level') {
            if (optText.includes(strValue) || strValue.includes(optText)) score = Math.max(score, 85);
          }
          if (fieldName === 'degree') {
            if (optText.includes(strValue) || strValue.includes(optText)) score = Math.max(score, 85);
          }
          if (score > bestScore) {
            bestScore = score;
            bestMatch = opt;
          }
        }
        if (bestMatch && bestScore >= 30) {
          return { option: bestMatch, score: bestScore, panel };
        }
      }
      return null;
    };

    const clickOption = (opt) => {
      opt.scrollIntoView({ block: 'center', behavior: 'smooth' });
      opt.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
      opt.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));
      opt.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: 100, clientY: 100 }));
      opt.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0, clientX: 100, clientY: 100 }));
      opt.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, clientX: 100, clientY: 100 }));
      if (opt.click) {
        try { opt.click(); } catch(e) {}
      }
      opt.dispatchEvent(new Event('change', { bubbles: true }));
      opt.dispatchEvent(new Event('select', { bubbles: true }));
      if (opt.querySelector) {
        const innerInput = opt.querySelector('input');
        if (innerInput) {
          innerInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    };

    const getPanels = () => {
      const selectors = [
        '[class*="dropdown"]:not(input):not(select):not(button):not(a)',
        '[class*="picker-panel"]', '[class*="select-panel"]', '[class*="option-list"]',
        '[role="listbox"]', '[class*="Select-menu"]', '[class*="drop-list"]',
        '[class*="popper"]', '[class*="Dropdown-menu"]', '[class*="cascader-panel"]',
        '[class*="cascader-menu"]', '[class*="ant-cascader-menu"]',
        '.ant-select-dropdown', '.el-select-dropdown', '.el-picker-panel',
        '[class*="popup"]:not([class*="inner"]):not([class*="icon"])',
        '[class*="select-content"]', '[class*="select-list"]',
        '[class*="options-wrap"]', '[class*="option-wrap"]',
        '[class*="list-box"][class*="select"]', '[class*="menu-wrap"]',
        '.el-select-dropdown__list', '.ant-select-dropdown-menu',
        '[class*="zhaopin-select"]', '[class*="zhipin-select"]',
        '[class*="select-options"]', '[class*="dropdown-list"]',
        '[class*="zp-select"]', '[class*="boss-select"]',
        '[class*="select-popup"]', '[class*="option-popup"]',
        '[class*="select-box"] ul', '[class*="select-box"] li',
        // Element UI Select/Dropdown (BOSS直聘使用)
        '.ui-select-dropdown', '.ui-picker-panel', '.ui-date-picker',
        '[class*="ui-select-dropdown"]', '[class*="ui-picker-panel"]',
        '[class*="ui-date-picker"]', '.ui-select-dropdown-transfer',
        '.ui-select-item',
        // BOSS直聘特殊选择器
        '[class*="select-dropdown"]', '[class*="select-option"]',
        '[class*="picker-options"]', '[class*="picker-option"]',
        '.candidate-info-item [class*="dropdown"]',
        '.form-item-content [class*="dropdown"]',
      ];
      const panels = [];
      for (const sel of selectors) {
        try {
          const found = document.querySelectorAll(sel);
          for (const p of found) {
            if (isElementVisible(p) && !panels.includes(p)) panels.push(p);
          }
        } catch(e) {}
      }
      return panels;
    };

    const trigger = findCustomSelectTrigger(element) || element;
    
    // 检测是否是Ant Design Select
    const isAntSelect = (() => {
      let el = element;
      for (let i = 0; i < 5 && el; i++) {
        if ((el.className || '').toString().includes('ant-select')) return true;
        el = el.parentElement;
      }
      return false;
    })();

    // 检测是否是Element UI Select
    const isElementSelect = (() => {
      let el = element;
      for (let i = 0; i < 5 && el; i++) {
        if ((el.className || '').toString().includes('ui-select')) return true;
        el = el.parentElement;
      }
      return false;
    })();

    try {
      trigger.scrollIntoView({ block: 'center' });
    } catch(e) {}

    const openPanel = () => {
      const beforePanels = getPanels();
      const beforeCount = beforePanels.length;
      const tryClick = (target) => {
        try {
          target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: 100, clientY: 100 }));
          target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0, clientX: 100, clientY: 100 }));
          if (target.click) {
            try { target.click(); } catch(e) {}
          }
          target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, clientX: 100, clientY: 100 }));
          target.dispatchEvent(new Event('focus', { bubbles: true }));
          target.dispatchEvent(new Event('activate', { bubbles: true }));
        } catch(e) {}
      };
      
      // Ant Design Select特殊处理：先清空搜索框再点击
      if (isAntSelect) {
        try {
          const antSelect = element.closest('.ant-select') || element;
          const searchInput = antSelect.querySelector('input.ant-select-selection-search-input, input[type="search"]');
          if (searchInput) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } catch(e) {}
      }
      
      // Element UI Select特殊处理：触发下拉
      if (isElementSelect) {
        try {
          const elSelect = element.closest('.ui-select') || element;
          const selectTrigger = elSelect.querySelector('.ui-select-trigger, .ui-select-input, input[readonly]');
          if (selectTrigger) {
            tryClick(selectTrigger);
          } else {
            const inputEl = elSelect.querySelector('input');
            if (inputEl) {
              tryClick(inputEl);
            } else {
              tryClick(elSelect);
            }
          }
        } catch(e) {}
      }
      
      tryClick(trigger);
      
      let newPanels = getPanels();
      if (newPanels.length > beforeCount) return true;
      
      newPanels = getPanels();
      if (newPanels.length > beforeCount) return true;
      
      let parent = trigger.parentElement;
      let depth = 0;
      while (parent && depth < 5) {
        tryClick(parent);
        newPanels = getPanels();
        if (newPanels.length > beforeCount) return true;
        parent = parent.parentElement;
        depth++;
      }
      return false;
    };
    openPanel();

    const tryFill = (targetVal, depth, attempt) => {
      if (depth > 3) return true;
      const panels = getPanels();
      const result = searchOptions(panels, targetVal);
      if (result) {
        clickOption(result.option);
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    };

    if (isLocationField) {
      const locParts = splitLocation(strValue);
      if (locParts && locParts.length >= 2) {
        const fillCascader = (parts, idx) => {
          if (idx >= parts.length) return;
          const panels = getPanels();
          const result = searchOptions(panels, parts[idx]);
          if (result) {
            clickOption(result.option);
            setTimeout(() => fillCascader(parts, idx + 1), 200);
          } else {
            const fallback = () => {
              const p = getPanels();
              const r = searchOptions(p, parts[idx]);
              if (r) { clickOption(r.option); setTimeout(() => fillCascader(parts, idx + 1), 200); }
            };
            setTimeout(fallback, 150);
            setTimeout(fallback, 400);
          }
        };
        setTimeout(() => fillCascader(locParts, 0), 100);
        for (const retry of [300, 700]) {
          setTimeout(() => fillCascader(locParts, 0), retry);
        }
        return true;
      }
    }

    if (tryFill(strValue, 0, 0)) return true;
    // Ant Design Select需要更长的加载时间，增加重试延迟
    const retryDelays = isAntSelect 
      ? [200, 500, 1000, 1500, 2000, 2500]
      : [100, 300, 600, 1000, 1500];
    for (const delay of retryDelays) {
      setTimeout(() => { try { tryFill(strValue, 0, 0); } catch(e) {} }, delay);
    }
    return true;
  }

  function fillCustomDatePicker(element, value, fieldName) {
    const strValue = String(value).trim();
    const dateMatch = strValue.match(/(\d{4})[\.\-\/年](\d{1,2})[\.\-\/月](\d{1,2})?/);
    if (!dateMatch) return false;
    
    const year = dateMatch[1];
    const month = dateMatch[2].padStart(2, '0');
    const day = dateMatch[3] ? dateMatch[3].padStart(2, '0') : '01';

    const getText = el => (el.textContent || '').replace(/\s+/g, '').trim();

    const clickEl = (el) => {
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
      if (el.click) {
        try { el.click(); } catch(e) {}
      }
    };

    let picker = element;
    if (!picker.className.toString().includes('ui-date-picker')) {
      picker = element.closest('.ui-date-picker');
    }
    if (!picker) {
      picker = element.parentElement;
      while (picker && !picker.className.toString().includes('ui-date-picker') && picker !== document.body) {
        picker = picker.parentElement;
      }
    }
    if (!picker || !picker.className.toString().includes('ui-date-picker')) {
      return false;
    }

    const trigger = picker.querySelector('.ui-date-picker-input, input');
    if (!trigger) return false;

    clickEl(trigger);

    setTimeout(() => {
      const panel = document.querySelector('.ui-picker-panel.ui-date-picker');
      if (!panel) return;

      const yearLabel = panel.querySelector('.ui-date-picker-header-label');
      if (yearLabel) {
        clickEl(yearLabel);
        setTimeout(() => {
          const years = panel.querySelectorAll('.ui-date-picker-year-btn, .ui-date-picker-year-label');
          for (const y of years) {
            if (getText(y).includes(year)) {
              clickEl(y);
              break;
            }
          }
        }, 300);
      }

      setTimeout(() => {
        const monthLabel = panel.querySelectorAll('.ui-date-picker-header-label')[1];
        if (monthLabel) {
          clickEl(monthLabel);
          setTimeout(() => {
            const months = panel.querySelectorAll('.ui-date-picker-month-btn, .ui-date-picker-month-label');
            for (const m of months) {
              if (getText(m).includes(month.replace(/^0/, '')) || getText(m).includes(month)) {
                clickEl(m);
                break;
              }
            }
          }, 300);
        }

        setTimeout(() => {
          const dayCells = panel.querySelectorAll('.ui-date-picker-cell, .ui-date-picker-content td');
          for (const cell of dayCells) {
            if (cell.textContent.trim() === day.replace(/^0/, '') || cell.textContent.trim() === day) {
              clickEl(cell);
              break;
            }
          }
        }, 500);
      }, 500);
    }, 500);

    return true;
  }

  // ============================================================
  // 三、字段映射配置
  // ============================================================

  const FIELD_MAPPING = {
    name: {
      keywords: ['姓名', '真实姓名', '您的姓名'],
      excludeKeywords: ['内推人', '推荐人', '紧急联系人', '联系人姓名', '收件人', '家长', '父亲', '母亲', '配偶'],
      selectors: [
        'input[placeholder*="姓名" i]',
        'input[id*="realName" i]',
        'input[id*="userName" i]',
        'input[name*="realName" i]',
        'input[name*="userName" i]',
        '[data-field="name"] input'
      ]
    },
    phone: {
      keywords: ['手机', '手机号', '手机号码', '电话', '联系方式', '联系电话', '移动电话'],
      excludeKeywords: ['紧急联系电话', '家庭电话', '紧急电话', '家长电话', '推荐人电话', '内推人电话', '公司电话'],
      selectors: [
        'input[type="tel"]',
        'input[placeholder*="手机" i]',
        'input[placeholder*="电话" i]',
        'input[name*="mobile" i]',
        'input[name*="phone" i]',
        'input[id*="mobile" i]',
        'input[id*="phone" i]',
        '[data-field="phone"] input'
      ]
    },
    email: {
      keywords: ['邮箱', '电子邮箱', '邮件', 'e-mail', 'email'],
      excludeKeywords: ['紧急联系人邮箱', '公司邮箱'],
      selectors: [
        'input[type="email"]',
        'input[placeholder*="邮箱" i]',
        'input[placeholder*="email" i]',
        'input[name*="email" i]',
        'input[id*="email" i]',
        '[data-field="email"] input'
      ]
    },
    gender: {
      keywords: ['性别', 'gender', 'sex'],
      excludeKeywords: [],
      selectors: [
        'select[name*="gender" i]',
        'select[name*="sex" i]',
        'select[id*="gender" i]',
        'select[id*="sex" i]',
        '[data-field="gender"] select',
        '.ui-select[class*="gender"], .ui-select[class*="sex"]'
      ]
    },
    birth: {
      keywords: ['出生日期', '出生年月', '生日', '出生'],
      excludeKeywords: ['入党', '入团', '毕业', '入职', '参加工作'],
      selectors: [
        'input[placeholder*="出生" i]',
        'input[placeholder*="生日" i]',
        'input[name*="birth" i]',
        'input[name*="birthday" i]',
        'input[type="date"]',
        '[data-field="birth"] input',
        '.ui-date-picker[class*="birth"], .ui-date-picker[class*="birthday"]'
      ]
    },
    age: {
      keywords: ['年龄', 'age'],
      excludeKeywords: ['工龄', '工作年限'],
      selectors: [
        'input[placeholder*="年龄" i]',
        'input[name*="age" i]',
        'input[id*="age" i]',
        '[data-field="age"] input'
      ]
    },
    birthplace: {
      keywords: ['出生地', '出生地点', '出生城市'],
      excludeKeywords: [],
      selectors: [
        'input[placeholder*="出生地" i]',
        'select[name*="birthplace" i]',
        '[data-field="birthplace"] input, [data-field="birthplace"] select'
      ]
    },
    ethnicity: {
      keywords: ['民族', 'ethnicity', '族别'],
      excludeKeywords: [],
      selectors: [
        'select[placeholder*="民族" i]',
        'select[name*="ethnic" i]',
        'select[name*="nation" i]',
        'select[id*="ethnic" i]',
        'select[id*="nation" i]',
        'input[placeholder*="民族" i]',
        '.ui-select[class*="ethnic"], .ui-select[class*="nation"], .ui-select[class*="minzu"]'
      ]
    },
    height: {
      keywords: ['身高', 'height'],
      excludeKeywords: [],
      selectors: [
        'input[placeholder*="身高" i]',
        'input[name*="height" i]',
        'select[name*="height" i]',
        'select[placeholder*="身高" i]',
        'select[id*="height" i]',
        '[data-field="height"] input, [data-field="height"] select'
      ]
    },
    weight: {
      keywords: ['体重', 'weight'],
      excludeKeywords: [],
      selectors: [
        'input[placeholder*="体重" i]',
        'input[name*="weight" i]',
        'select[name*="weight" i]',
        'select[placeholder*="体重" i]',
        'select[id*="weight" i]',
        '[data-field="weight"] input, [data-field="weight"] select'
      ]
    },
    marital_status: {
      keywords: ['婚姻', '婚姻状况', '婚否', 'marital'],
      excludeKeywords: [],
      selectors: [
        'select[name*="marital" i]',
        'select[name*="marriage" i]',
        'select[id*="marital" i]',
        '[data-field="marital"] select',
        '.ui-select[class*="marital"], .ui-select[class*="marriage"], .ui-select[class*="hunyin"]'
      ]
    },
    id_type: {
      keywords: ['证件类型', 'id_type', '证件种类'],
      excludeKeywords: [],
      selectors: [
        'select[name*="id_type" i]',
        'select[name*="idType" i]',
        'select[name*="cardType" i]',
        'select[id*="cardType" i]',
        '[data-field="id_type"] select',
        '.ui-select[class*="idType"], .ui-select[class*="cardType"], .ui-select[class*="certType"], .ui-select[class*="zhengjian"]'
      ]
    },
    id_number: {
      keywords: ['身份证号', '身份证号码', '证件号码', '身份证', 'id_number'],
      excludeKeywords: ['护照号', '军官证号'],
      selectors: [
        'input[placeholder*="身份证" i]',
        'input[placeholder*="证件号码" i]',
        'input[name*="idcard" i]',
        'input[name*="idNumber" i]',
        'input[name*="id_number" i]',
        'input[id*="idcard" i]',
        '[data-field="id_number"] input'
      ]
    },
    political_status: {
      keywords: ['政治面貌', '政治', 'political'],
      excludeKeywords: ['政治成分'],
      selectors: [
        'select[name*="political" i]',
        'select[name*="politics" i]',
        'select[id*="political" i]',
        'select[id*="politics" i]',
        '[data-field="political"] select',
        '.ui-select[class*="political"], .ui-select[class*="zhengzhi"]'
      ]
    },
    party_join_date: {
      keywords: ['入党时间', '入团时间', '入党日期', '入团日期'],
      excludeKeywords: ['出生日期'],
      selectors: [
        'input[placeholder*="入党" i]',
        'input[placeholder*="入团" i]',
        'input[name*="party" i]',
        '[data-field="party"] input'
      ]
    },
    native_place: {
      keywords: ['籍贯', '祖籍', '原籍', 'native', '籍贯地', '籍贯所在地', '老家'],
      excludeKeywords: ['生源地', '类型', '性质'],
      selectors: [
        'select[name*="native" i]',
        'input[placeholder*="籍贯" i]',
        'select[placeholder*="籍贯" i]',
        'input[name*="native" i]',
        '[data-field="native"] input, [data-field="native"] select',
        '[class*="native"] input, [class*="native"] select, [class*="jiguan"]'
      ]
    },
    student_source: {
      keywords: ['生源地', '生源', 'student_source', '高考生源地'],
      excludeKeywords: ['籍贯'],
      selectors: [
        'input[placeholder*="生源" i]',
        'select[name*="source" i]',
        '[data-field="source"] input, [data-field="source"] select'
      ]
    },
    hukou_location: {
      keywords: ['户口所在地', '户籍所在地', '户籍地址', '户籍', '户口', '户籍地', '户口地', '户口所在'],
      excludeKeywords: ['生源', '类型', '性质'],
      selectors: [
        'input[placeholder*="户口" i]',
        'input[placeholder*="户籍" i]',
        'select[placeholder*="户口" i]',
        'input[name*="hukou" i]',
        'input[name*="household" i]',
        'select[name*="hukou" i]',
        '[data-field="hukou"] input, [data-field="hukou"] select'
      ]
    },
    hukou_type: {
      keywords: ['户口类型', '户口性质', '户籍类型', '户籍性质', '农业户口', '非农业户口', '户籍'],
      excludeKeywords: ['户口所在地', '户籍所在地'],
      selectors: [
        'select[name*="hukouType" i]',
        'select[name*="household_type" i]',
        'select[placeholder*="户口类型" i]',
        '[data-field="hukou_type"] select',
        '.ui-select[name*="hukou"]',
        '.ui-select[class*="hukou"]'
      ]
    },
    location: {
      keywords: ['现居住地', '现居城市', '居住城市', '所在城市', '所在地', '现居', '常居地', '常驻地', '当前城市', '现居住城市', '现居住在地'],
      excludeKeywords: ['目标城市', '期望城市', '意向城市', '地址', '住址', '籍贯', '户籍'],
      selectors: [
        'select[placeholder*="城市" i]',
        'select[name*="city" i]',
        'select[name*="location" i]',
        'input[placeholder*="城市" i]',
        'input[placeholder*="现居" i]',
        '.city-selector select'
      ]
    },
    current_residence: {
      keywords: ['现居住地址', '现住址', '居住地址', '目前居住地', '家庭住址', '住址', '常住地址', '居住地址', '现居住', '家庭地址', '现在住址'],
      excludeKeywords: ['通信地址', '通讯地址', '邮寄地址', '工作经历', '居住经历'],
      selectors: [
        'input[placeholder*="居住地址" i]',
        'input[placeholder*="现住址" i]',
        'input[placeholder*="家庭住址" i]',
        'input[name*="residence" i]',
        'input[name*="address" i]',
        'textarea[name*="address" i]',
        '[data-field="residence"] input'
      ]
    },
    mailing_address: {
      keywords: ['通信地址', '通讯地址', '邮寄地址', '联系地址'],
      excludeKeywords: ['现住址', '居住地址'],
      selectors: [
        'input[placeholder*="通信地址" i]',
        'input[placeholder*="通讯地址" i]',
        'input[placeholder*="邮寄地址" i]',
        'input[name*="mailing" i]',
        '[data-field="mailing"] input'
      ]
    },
    target_city: {
      keywords: ['目标城市', '期望城市', '意向城市', '工作城市', '期望工作地'],
      excludeKeywords: ['现居', '居住'],
      selectors: [
        'input[placeholder*="目标城市" i]',
        'input[placeholder*="意向城市" i]',
        'input[placeholder*="期望城市" i]',
        'input[name*="targetCity" i]',
        'select[name*="targetCity" i]',
        '[data-field="target_city"] input, [data-field="target_city"] select'
      ]
    },
    expected_salary: {
      keywords: ['期望薪资', '薪资要求', '期望月薪', '期望工资', '薪资', '薪酬'],
      excludeKeywords: ['当前薪资', '目前薪资'],
      selectors: [
        'input[placeholder*="薪资" i]',
        'input[placeholder*="薪酬" i]',
        'select[name*="salary" i]',
        'select[placeholder*="薪资" i]',
        'input[name*="expectedSalary" i]',
        '[data-field="salary"] input, [data-field="salary"] select'
      ]
    },
    job_status: {
      keywords: ['求职状态', '工作状态', '目前状态', 'job_status', '求职意向'],
      excludeKeywords: [],
      selectors: [
        'select[name*="job_status" i]',
        'select[name*="jobStatus" i]',
        '[data-field="job_status"] select'
      ]
    },
    available_date: {
      keywords: ['到岗时间', '到岗日期', '可到岗时间', '入职时间', 'available', '到岗'],
      excludeKeywords: ['毕业时间'],
      selectors: [
        'select[placeholder*="到岗" i]',
        'select[name*="available" i]',
        'select[name*="onboard" i]',
        'input[placeholder*="到岗" i]',
        '[data-field="available"] select, [data-field="available"] input'
      ]
    },
    school: {
      keywords: ['学校', '毕业院校', '毕业学校', '院校', '最高学位毕业院校'],
      excludeKeywords: ['公司', '企业'],
      selectors: [
        'input[placeholder*="学校" i]',
        'input[placeholder*="院校" i]',
        'input[name*="school" i]',
        'input[name*="college" i]',
        'input[name*="university" i]',
        'input[id*="school" i]',
        '.school-input input'
      ]
    },
    degree: {
      keywords: ['学历', '学位', '最高学历', 'degree', 'education'],
      excludeKeywords: ['专业', '学校'],
      selectors: [
        'select[placeholder*="学历" i]',
        'select[placeholder*="学位" i]',
        'select[name*="degree" i]',
        'select[name*="education" i]',
        'select[name*="qualification" i]',
        'select[id*="degree" i]',
        'select[id*="education" i]',
        '.degree-select select',
        '.ui-select[class*="degree"], .ui-select[class*="education"], .ui-select[class*="xueli"], .ui-select[class*="xuewei"]'
      ]
    },
    major: {
      keywords: ['专业', '所学专业', 'major', 'specialty'],
      excludeKeywords: [],
      selectors: [
        'input[placeholder*="专业" i]',
        'input[name*="major" i]',
        'input[name*="specialty" i]',
        'input[id*="major" i]',
        '.major-input input'
      ]
    },
    graduation: {
      keywords: ['毕业时间', '毕业年份', '毕业日期', '预计毕业', 'graduation'],
      excludeKeywords: ['入党', '入团', '出生'],
      selectors: [
        'input[placeholder*="毕业" i]',
        'input[name*="graduation" i]',
        'input[name*="graduate" i]',
        '[data-field="graduation"] input',
        '.ui-date-picker[class*="graduation"], .ui-date-picker[class*="graduate"], .ui-date-picker[class*="biye"]'
      ]
    },
    gpa: {
      keywords: ['GPA', '绩点', '平均分', '学分绩点', '平均成绩'],
      excludeKeywords: ['排名'],
      selectors: [
        'input[placeholder*="GPA" i]',
        'input[placeholder*="绩点" i]',
        'input[placeholder*="平均分" i]',
        'input[name*="gpa" i]',
        '[data-field="gpa"] input'
      ]
    },
    english_level: {
      keywords: ['英语等级', '外语等级', '英语水平', '外语水平', '英语能力', 'cet', '英语', '语言等级', '英语等级/分数'],
      excludeKeywords: ['语言能力', '外语能力', '语种', '其他语言'],
      selectors: [
        'select[name*="english" i]',
        'select[name*="cet" i]',
        'select[placeholder*="英语" i]',
        'select[placeholder*="外语等级" i]',
        'select[id*="english" i]',
        'select[id*="cet" i]',
        'input[placeholder*="英语等级" i]',
        '[data-field="english_level"] select, [data-field="english_level"] input',
        '.ui-select[class*="english"], .ui-select[class*="cet"], .ui-select[class*="language"], .ui-select[class*="englishLevel"], .ui-select[class*="yingyu"]'
      ]
    },
    study_mode: {
      keywords: ['学习形式', '学习方式', '办学形式', '就读形式', '学习类型'],
      excludeKeywords: [],
      selectors: [
        'select[name*="studyMode" i]',
        'select[name*="study_type" i]',
        'select[placeholder*="学习形式" i]',
        'select[placeholder*="学习方式" i]',
        '[data-field="study_mode"] select'
      ]
    },
    school_country: {
      keywords: ['学校国别', '院校国别', '国家地区', '学校所在地国家', '学校国家', '毕业院校国家', '院校国家', '国籍', '国籍/地区', '国家/地区', '国别', 'country', 'nationality'],
      excludeKeywords: ['生源', '籍贯', '户籍', '户口'],
      selectors: [
        'select[name*="schoolCountry" i]',
        'select[name*="country" i]',
        'select[placeholder*="国别" i]',
        'select[placeholder*="国家" i]',
        '[data-field="school_country"] select'
      ]
    },
    is_211: {
      keywords: ['211', '是否211', '211院校', '211工程', '是否为211'],
      excludeKeywords: ['985'],
      selectors: [
        'input[type="radio"][name*="211" i]',
        'select[name*="is211" i]',
        '[data-field="is_211"] input, [data-field="is_211"] select'
      ]
    },
    is_985: {
      keywords: ['985', '是否985', '985院校', '985工程', '是否为985', '945'],
      excludeKeywords: ['211'],
      selectors: [
        'input[type="radio"][name*="985" i]',
        'input[type="radio"][name*="945" i]',
        'select[name*="is985" i]',
        '[data-field="is_985"] input, [data-field="is_985"] select'
      ]
    },
    is_key_university: {
      keywords: ['重点院校', '重点本科', '重点大学', '是否重点'],
      excludeKeywords: [],
      selectors: [
        'input[type="radio"][name*="key" i]',
        'select[name*="keyUniv" i]',
        '[data-field="is_key_university"] input, [data-field="is_key_university"] select'
      ]
    },
    is_fresh_graduate: {
      keywords: ['是否应届毕业生', '应届毕业生', '是否应届', '应届生', '应届', 'fresh graduate', 'fresh'],
      excludeKeywords: ['类型', '性质', '身份'],
      selectors: [
        'input[type="radio"][name*="fresh" i]',
        'input[type="radio"][name*="graduate" i]',
        'input[type="radio"][name*="yingjie" i]',
        'select[name*="fresh" i]',
        'select[name*="graduate" i]',
        '[data-field="is_fresh_graduate"] input, [data-field="is_fresh_graduate"] select'
      ]
    },
    class_rank: {
      keywords: ['专业成绩排名', '成绩排名', '专业排名', '班级排名', '年级排名', '排名', 'rank'],
      excludeKeywords: ['工作', '业绩'],
      selectors: [
        'input[type="radio"][name*="rank" i]',
        'select[name*="rank" i]',
        'select[placeholder*="排名" i]',
        '[data-field="class_rank"] select, [data-field="class_rank"] input'
      ]
    },
    has_internship: {
      keywords: ['实习经历', '是否有实习', '有无实习', '实习经验', '实习情况'],
      excludeKeywords: ['实习描述', '实习内容', '项目经历'],
      selectors: [
        'select[name*="internship" i]',
        'select[placeholder*="实习经历" i]',
        'input[type="radio"][name*="internship" i]',
        'select[name*="hasIntern" i]',
        '[data-field="has_internship"] select, [data-field="has_internship"] input'
      ]
    },
    skills: {
      keywords: ['技能', '专业技能', '技术技能', '技能特长', 'skills'],
      excludeKeywords: ['语言技能', '语言能力'],
      selectors: [
        'textarea[placeholder*="技能" i]',
        'textarea[placeholder*="特长" i]',
        'input[placeholder*="技能" i]',
        'textarea[name*="skill" i]',
        'input[name*="skill" i]',
        '[data-field="skills"] textarea, [data-field="skills"] input'
      ]
    },
    languages: {
      keywords: ['语言能力', '外语能力', '外语水平', '语言', '语种'],
      excludeKeywords: ['编程语言'],
      selectors: [
        'textarea[placeholder*="语言" i]',
        'textarea[placeholder*="外语" i]',
        'input[placeholder*="语言" i]',
        'input[name*="language" i]',
        'textarea[name*="language" i]',
        '[data-field="language"] input, [data-field="language"] textarea'
      ]
    },
    certificates: {
      keywords: ['证书', '资格证书', '所获证书', '获得证书', 'certificate'],
      excludeKeywords: [],
      selectors: [
        'textarea[placeholder*="证书" i]',
        'input[placeholder*="证书" i]',
        'textarea[name*="certificate" i]',
        '[data-field="certificate"] input, [data-field="certificate"] textarea'
      ]
    },
    self_eval: {
      keywords: ['自我评价', '个人评价', '自我介绍', '个人简介', 'self'],
      excludeKeywords: ['家庭', '成员'],
      selectors: [
        'textarea[placeholder*="评价" i]',
        'textarea[placeholder*="介绍" i]',
        'textarea[placeholder*="简介" i]',
        'textarea[name*="self" i]',
        'textarea[name*="introduction" i]',
        'textarea[name*="eval" i]',
        '.self-eval textarea'
      ]
    },
    experience: {
      keywords: ['实习经历', '工作经历', '工作经验', '实习经验'],
      excludeKeywords: ['项目经历', '项目经验'],
      selectors: [
        'textarea[placeholder*="实习" i]',
        'textarea[placeholder*="工作经历" i]',
        'textarea[name*="experience" i]',
        'textarea[name*="work" i]',
        '[data-field="experience"] textarea'
      ]
    },
    project: {
      keywords: ['项目经历', '项目经验', '项目描述'],
      excludeKeywords: ['实习', '工作'],
      selectors: [
        'textarea[placeholder*="项目" i]',
        'textarea[name*="project" i]',
        '[data-field="project"] textarea'
      ]
    },
    awards_honors: {
      keywords: ['获奖', '奖励', '荣誉', '奖项', 'awards', 'honors'],
      excludeKeywords: [],
      selectors: [
        'textarea[placeholder*="获奖" i]',
        'textarea[placeholder*="荣誉" i]',
        'textarea[placeholder*="奖励" i]',
        'textarea[name*="award" i]',
        'textarea[name*="honor" i]',
        '[data-field="awards"] textarea'
      ]
    },
    campus_activities: {
      keywords: ['校园经历', '社会实践', '校内活动', '校园活动', '社团经历', '学生工作', '在校经历', '在校实践', '学生活动'],
      excludeKeywords: ['实习', '工作'],
      selectors: [
        'textarea[placeholder*="社会实践" i]',
        'textarea[placeholder*="校园" i]',
        'textarea[placeholder*="在校" i]',
        'textarea[name*="campus" i]',
        'textarea[name*="activity" i]',
        '[data-field="campus"] textarea'
      ]
    },
    major_courses: {
      keywords: ['主修课程', '主要课程', '专业课程', '所学课程', '核心课程'],
      excludeKeywords: [],
      selectors: [
        'textarea[placeholder*="主修课程" i]',
        'textarea[placeholder*="主要课程" i]',
        'textarea[placeholder*="专业课程" i]',
        'textarea[name*="course" i]',
        'textarea[name*="major_course" i]',
        '[data-field="courses"] textarea'
      ]
    }
  };

  // 字段值映射：存储的标准值 → 页面选项可能出现的表述
  const FIELD_VALUE_MAP = {
    gender: {
      '男': ['男', '男性', '先生', 'male', '男生'],
      '女': ['女', '女性', '女士', 'female', '女生'],
    },
    marital_status: {
      '未婚': ['未婚', '单身', '无配偶', '否'],
      '已婚': ['已婚', '已婚（有子女）', '已婚（无子女）', '有配偶', '是'],
      '离异': ['离异', '离婚'],
      '丧偶': ['丧偶'],
    },
    id_type: {
      '身份证': ['身份证', '居民身份证', '二代身份证', 'ID Card', '国内身份证', '中国大陆身份证'],
      '护照': ['护照', 'Passport'],
      '港澳居民来往内地通行证': ['港澳居民来往内地通行证', '港澳通行证', '回乡证'],
      '台湾居民来往大陆通行证': ['台湾居民来往大陆通行证', '台胞证'],
      '其他': ['其他', '其它', 'Other'],
    },
    political_status: {
      '中共党员': ['中共党员', '党员', '中共正式党员', '共产党员', '中国共产党党员'],
      '中共预备党员': ['中共预备党员', '预备党员'],
      '共青团员': ['共青团员', '团员', '共青团', '中国共青团员'],
      '群众': ['群众', '普通群众', '一般群众', '无党派人士'],
      '民主党派': ['民主党派', '民盟', '民建', '民进', '农工党', '致公党', '九三学社', '台盟'],
    },
    ethnicity: {
      '汉族': ['汉族', '汉', 'Hans', 'Han'],
      '蒙古族': ['蒙古族', '蒙古'],
      '回族': ['回族', '回'],
      '藏族': ['藏族', '藏'],
      '维吾尔族': ['维吾尔族', '维吾尔'],
      '苗族': ['苗族', '苗'],
      '彝族': ['彝族', '彝'],
      '壮族': ['壮族', '壮'],
      '其他': ['其他', '其它'],
    },
    hukou_type: {
      '农业户口': ['农业户口', '农村户口', '农业', '农业户籍'],
      '非农业户口': ['非农业户口', '城镇户口', '非农业', '城镇', '非农业户籍', '居民户口', '居民'],
      '居民户口': ['居民户口', '居民'],
    },
    degree: {
      '博士': ['博士', '博士研究生', '博士及以上', '博士学历', '博士学位', 'PhD', 'Ph.D', 'Doctor'],
      '硕士': ['硕士', '硕士研究生', '硕士学历', '硕士学位', 'Master', 'MS', 'MA', 'MSc'],
      'MBA': ['MBA', '工商管理硕士'],
      'EMBA': ['EMBA', '高级工商管理硕士'],
      '本科': ['本科', '大学本科', '本科（学士）', '本科学历', '学士', '学士学位', 'Bachelor', 'BA', 'BS', 'BSc'],
      '大专': ['大专', '专科', '大学专科', '大专学历', '专科学历'],
      '高中': ['高中', '高中及以下', '中专', '高中以下', '中职'],
      '其他': ['其他', '其它'],
    },
    job_status: {
      '在校生': ['在校生', '在校学生', '在读', '在校'],
      '应届生': ['应届生', '应届毕业生', '应届'],
      '在职-暂不离职': ['在职-暂不离职', '在职', '在职不考虑机会', '暂不考虑'],
      '在职-考虑机会': ['在职-考虑机会', '在职看机会', '观望中', '看机会'],
      '已离职-随时到岗': ['已离职-随时到岗', '已离职', '离职', '随时到岗', '待业'],
    },
    available_date: {
      '随时到岗': ['随时到岗', '随时', '立即上岗', '即时到岗', '随时可以'],
      '一周内': ['一周内', '1周内', '7天内', '一周以内'],
      '两周内': ['两周内', '2周内', '14天内'],
      '一个月内': ['一个月内', '1个月内', '30天内', '一月以内'],
      '待定': ['待定', '面议', '待确认', '协商'],
    },
    english_level: {
      'CET-4': ['CET-4', 'CET4', '大学英语四级', '英语四级', '四级', '4级', 'CET 4'],
      'CET-6': ['CET-6', 'CET6', '大学英语六级', '英语六级', '六级', '6级', 'CET 6'],
      'TEM-4': ['TEM-4', 'TEM4', '专业四级', '专四', '专业英语四级'],
      'TEM-8': ['TEM-8', 'TEM8', '专业八级', '专八', '专业英语八级'],
      'IELTS': ['IELTS', '雅思', 'Ielts'],
      'TOEFL': ['TOEFL', '托福', 'Toefl'],
      '无': ['无', '不限', '未参加', '无要求', '一般'],
    },
    study_mode: {
      '全日制': ['全日制', '统招全日制', '普通全日制', '全脱产'],
      '非全日制': ['非全日制', '在职', '业余', '不脱产'],
      '成人高考': ['成人高考', '成考', '成人教育'],
      '自考': ['自考', '自学考试', '高等教育自学考试'],
      '网络教育': ['网络教育', '远程教育', '网教'],
      '开放大学': ['开放大学', '电大', '国家开放大学'],
    },
    school_country: {
      '中国大陆': ['中国大陆', '中国', '国内', '内地', 'China', 'CN', '中华人民共和国'],
      '中国香港': ['中国香港', '香港', 'Hong Kong', 'HK'],
      '中国澳门': ['中国澳门', '澳门', 'Macau'],
      '中国台湾': ['中国台湾', '台湾', 'Taiwan'],
      '美国': ['美国', 'USA', 'US', 'America', 'United States'],
      '英国': ['英国', 'UK', 'Britain', 'United Kingdom', 'England'],
      '澳大利亚': ['澳大利亚', '澳洲', 'Australia'],
      '加拿大': ['加拿大', 'Canada'],
    },
    is_211: {
      '是': ['是', 'yes', 'Yes', 'Y', 'true', 'True'],
      '否': ['否', 'no', 'No', 'N', 'false', 'False', '不是'],
    },
    is_985: {
      '是': ['是', 'yes', 'Yes', 'Y', 'true', 'True'],
      '否': ['否', 'no', 'No', 'N', 'false', 'False', '不是'],
    },
    is_key_university: {
      '是': ['是', 'yes', 'Yes', 'Y', 'true', 'True'],
      '否': ['否', 'no', 'No', 'N', 'false', 'False', '不是'],
    },
    class_rank: {
      '前20%': ['前20%', '20%', '前20', 'top20%', 'Top20%', '前20％'],
      '前30%': ['前30%', '30%', '前30', 'top30%', 'Top30%', '前30％'],
      '前50%': ['前50%', '50%', '前50', 'top50%', 'Top50%', '前50％'],
      '其他': ['其他', '其它', 'other'],
    },
    has_internship: {
      '有': ['有', '是', 'yes', 'Yes', '有实习', '有实习经历'],
      '无': ['无', '否', 'no', 'No', '无实习', '没有', '无实习经历'],
    },
  };

  // 月份映射
  const MONTH_MAP = {
    '01': ['1', '01', '一月', '1月', 'Jan', 'January', '01月'],
    '02': ['2', '02', '二月', '2月', 'Feb', 'February', '02月'],
    '03': ['3', '03', '三月', '3月', 'Mar', 'March', '03月'],
    '04': ['4', '04', '四月', '4月', 'Apr', 'April', '04月'],
    '05': ['5', '05', '五月', '5月', 'May', '05月'],
    '06': ['6', '06', '六月', '6月', 'Jun', 'June', '06月'],
    '07': ['7', '07', '七月', '7月', 'Jul', 'July', '07月'],
    '08': ['8', '08', '八月', '8月', 'Aug', 'August', '08月'],
    '09': ['9', '09', '九月', '9月', 'Sep', 'September', '09月'],
    '10': ['10', '十月', '10月', 'Oct', 'October', '10月'],
    '11': ['11', '十一月', '11月', 'Nov', 'November', '11月'],
    '12': ['12', '十二月', '12月', 'Dec', 'December', '12月'],
  };

  // ============================================================
  // 四、字段查找引擎（重写版：支持多层DOM嵌套、递归向上查找）
  // ============================================================

  const FORM_ROW_SELECTORS = [
    '.ant-form-item', '.el-form-item', '.ivu-form-item', '.layui-form-item',
    '.form-item', '.form-group', '.form-row', '.field',
    '[class*="form-item"]', '[class*="form_item"]', '[class*="formRow"]',
    '[class*="field-item"]', '[class*="field_item"]',
    '[class*="input-item"]', '[class*="input_item"]',
    '[class*="zp-form"]', '[class*="boss-form"]', '[class*="geek-form"]',
    'tr', 'li',
  ];

  function isLabelElement(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'LABEL') return true;
    const cls = (el.className || '').toString();
    return /(^|\s|-)label(\s|$|-)/i.test(cls) ||
           /form-label|field-label|ant-form-item-label|el-form-item__label|ivu-form-item-label/i.test(cls);
  }

  function getTextContent(el) {
    if (!el) return '';
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    return text.replace(/^[*＊\s]+/, '').replace(/[\s*＊]+$/, '').trim();
  }

  function findFormRow(element) {
    if (!element) return null;
    let el = element;
    const stopAt = element.closest('table, tbody, ul, ol, fieldset');
    const stopNode = stopAt || document.body;
    let formRow = null;
    while (el && el !== stopNode && el !== document.body && el !== document.documentElement) {
      for (const sel of FORM_ROW_SELECTORS) {
        if (el.matches && el.matches(sel)) {
          return el;
        }
      }
      const hasLabel = el.querySelector && el.querySelector('label, [class*="label"], [class*="title"], [class*="text"]');
      if (hasLabel) {
        const labelText = getTextContent(hasLabel);
        if (labelText && labelText.length >= 1 && labelText.length <= 60 && !/^(请|输入|选择|点击|search|please)/i.test(labelText)) {
          return el;
        }
      }
      if (el.tagName === 'FORM' && !formRow) {
        formRow = el;
      }
      el = el.parentElement;
    }
    if (formRow) return formRow;
    if (stopAt && stopAt !== document.body) {
      for (const sel of FORM_ROW_SELECTORS) {
        if (stopAt.matches && stopAt.matches(sel)) return stopAt;
      }
    }
    return null;
  }

  function getLabelText(element) {
    if (!element) return '';

    // 0. aria-label / title / placeholder 最高性能兜底
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();
    const dataLabel = element.getAttribute('data-label') || element.getAttribute('data-field-name');
    if (dataLabel && dataLabel.trim()) return dataLabel.trim();

    // 1. 直接在label内部
    // 注意：某些组件（如BOSS直聘的textarea）会用label包裹input作为placeholder容器
    // 这种label的文本通常是"请输入"、"请选择"等，需要跳过，继续找form-row中的真正label
    const directLabel = element.closest('label');
    if (directLabel) {
      const t = getTextContent(directLabel);
      // 只有当label文本不是placeholder类文本时，才认为是真正的label
      if (t && t.length >= 2 && !/^(请|输入|选择|点击|search|please)/i.test(t)) {
        // 额外检查：这个label是否在form-item内部，如果是，优先用form-item的label
        const row = findFormRow(element);
        if (row && row !== directLabel && !row.contains(directLabel) === false) {
          // 检查form-item中是否有更好的label
          const rowLabel = row.querySelector('.item-label, [class*="form-item"] > [class*="label"], [class*="item-label"]');
          if (rowLabel) {
            const rowText = getTextContent(rowLabel);
            if (rowText && rowText.length >= 2 && !/^(请|输入|选择|点击)/i.test(rowText)) {
              return rowText;
            }
          }
        }
        return t;
      }
      // 如果directLabel文本是placeholder或为空，继续往下找
    }

    // 2. for-id关联
    const forId = element.id || element.getAttribute('id');
    if (forId) {
      const lbl = document.querySelector(`label[for="${forId}"]`);
      if (lbl) {
        const t = getTextContent(lbl);
        if (t) return t;
      }
    }

    // 3. 向上查找表单行容器，在容器中找label
    const row = findFormRow(element);
    if (row) {
      const labelSelectors = [
        'label', '.label', '.form-label', '.field-label',
        '.el-form-item__label', '.ant-form-item-label',
        '.ivu-form-item-label', '.layui-form-label',
        'td:first-child', 'th:first-child',
        '[class*="label"]', '[class*="text"]',
        'span', 'div',
      ];
      for (const sel of labelSelectors) {
        const labels = row.querySelectorAll(sel);
        for (const lbl of labels) {
          if (lbl.contains(element)) continue;
          const t = getTextContent(lbl);
          if (t && t.length >= 1 && t.length <= 50 && !/^(请|输入|选择|点击|search|please|提交|保存|取消|确定)/i.test(t)) {
            if (sel === 'span' || sel === 'div') {
              if (t.length > 20) continue;
              if (!/[\u4e00-\u9fa5a-zA-Z]/.test(t)) continue;
            }
            return t;
          }
        }
      }
      const rowText = getTextContent(row);
      if (rowText && rowText.length <= 80) {
        const cleaned = rowText.replace(/请输入|请选择|必填|\*/g, '').trim();
        if (cleaned && cleaned.length <= 40) return cleaned;
      }
    }

    // 4. 向前找兄弟节点（label/span/带label类的div）
    let prev = element.previousElementSibling;
    let safety = 0;
    while (prev && safety < 5) {
      if (isLabelElement(prev) || prev.tagName === 'SPAN' || prev.tagName === 'DIV') {
        const t = getTextContent(prev);
        if (t && t.length >= 1 && t.length <= 40) return t;
      }
      prev = prev.previousElementSibling;
      safety++;
    }

    // 5. 父节点的向前兄弟
    const parent = element.parentElement;
    if (parent) {
      let parentPrev = parent.previousElementSibling;
      safety = 0;
      while (parentPrev && safety < 3) {
        if (isLabelElement(parentPrev) || parentPrev.tagName === 'SPAN' || parentPrev.tagName === 'DIV' || parentPrev.tagName === 'TD' || parentPrev.tagName === 'TH') {
          const t = getTextContent(parentPrev);
          if (t && t.length >= 1 && t.length <= 40) return t;
        }
        parentPrev = parentPrev.previousElementSibling;
        safety++;
      }
    }

    // 6. 最后兜底
    return element.getAttribute('title') || element.getAttribute('placeholder') || '';
  }

  function isExcluded(labelText, excludeKeywords) {
    if (!excludeKeywords || excludeKeywords.length === 0) return false;
    const lower = labelText.toLowerCase();
    return excludeKeywords.some(kw => lower.includes(kw.toLowerCase()));
  }

  function matchesKeywords(labelText, keywords) {
    if (!labelText || !keywords) return false;
    const lower = labelText.toLowerCase().replace(/[*＊\s:：]/g, '');
    return keywords.some(kw => lower.includes(kw.toLowerCase().replace(/[*＊\s:：]/g, '')));
  }

  function findInputFromLabel(label) {
    if (!label) return null;
    const forId = label.getAttribute('for');
    if (forId) {
      const inp = document.getElementById(forId);
      if (inp) return inp;
    }
    const row = findFormRow(label);
    if (row) {
      const ctrl = findControlInContainer(row, label);
      if (ctrl) return ctrl;
    }
    if (label.parentElement) {
      const ctrl = findControlInContainer(label.parentElement, label);
      if (ctrl) return ctrl;
    }
    let next = label.nextElementSibling;
    let safety = 0;
    while (next && safety < 5) {
      const ctrl = findControlInContainer(next, null);
      if (ctrl) return ctrl;
      if (['INPUT','TEXTAREA','SELECT'].includes(next.tagName)) return next;
      if (isCustomSelect(next)) return next;
      next = next.nextElementSibling;
      safety++;
    }
    return null;
  }

  function findControlInContainer(container, excludeEl) {
    if (!container) return null;
    const native = container.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="radio"]):not([type="checkbox"]), textarea, select');
    for (const inp of native) {
      if (excludeEl && excludeEl.contains(inp)) continue;
      if (isElementVisible(inp)) return inp;
    }
    const readonlyInputs = container.querySelectorAll('input[readonly]');
    for (const inp of readonlyInputs) {
      if (excludeEl && excludeEl.contains(inp)) continue;
      if (isElementVisible(inp)) return inp;
    }
    try {
      const customs = container.querySelectorAll(CUSTOM_CONTROLS);
      for (const c of customs) {
        if (excludeEl && excludeEl.contains(c)) continue;
        if (isElementVisible(c) && !isAncestor(c, excludeEl)) return c;
      }
    } catch(e) {}
    const triggers = container.querySelectorAll('div, span, a, li, p');
    for (const t of triggers) {
      if (excludeEl && (excludeEl.contains(t) || t.contains(excludeEl))) continue;
      if (!isElementVisible(t)) continue;
      const rect = t.getBoundingClientRect();
      if (rect.width < 30 || rect.height < 16) continue;
      const text = (t.textContent || '').trim().replace(/\s+/g, '');
      if (/^(请选择|请选择|请选择.{0,10}|选择$|Select|请选择)$/.test(text) || /请选择/.test(text)) {
        return t;
      }
    }
    return null;
  }

  function isAncestor(el, ancestor) {
    if (!el || !ancestor) return false;
    let p = el.parentElement;
    while (p) {
      if (p === ancestor) return true;
      p = p.parentElement;
    }
    return false;
  }

  function findFieldByLabel(fieldConfig, usedElements) {
    const candidates = [];
    const allInputs = document.querySelectorAll(ALL_CONTROLS);
    for (const input of allInputs) {
      if (usedElements.has(input)) continue;
      const tag = input.tagName;
      if (tag === 'INPUT' && (input.type === 'radio' || input.type === 'checkbox' || input.type === 'hidden' || input.type === 'submit' || input.type === 'button' || input.type === 'reset')) continue;
      if (tag === 'INPUT' && isInsideCustomSelect(input)) continue;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && !isCustomSelect(input)) continue;
      const ctrl = isCustomSelect(input) ? findCustomSelectTrigger(input) : input;
      if (!ctrl || usedElements.has(ctrl)) continue;
      if (!isElementVisible(ctrl)) continue;
      const labelText = getLabelText(ctrl);
      if (!labelText) continue;
      if (isExcluded(labelText, fieldConfig.excludeKeywords)) continue;
      if (matchesKeywords(labelText, fieldConfig.keywords)) {
        candidates.push({ element: ctrl, labelText, relevance: calcRelevance(labelText, fieldConfig.keywords) });
      }
    }

    if (candidates.length === 0) {
      const fallbackCandidates = findFieldByLabelFallback(fieldConfig, usedElements);
      if (fallbackCandidates && fallbackCandidates.length > 0) {
        candidates.push(...fallbackCandidates);
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        const typeA = getControlType(a.element);
        const typeB = getControlType(b.element);
        const scoreA = (typeA === 'select') ? 8 : (typeA === 'custom-select' ? 6 : (typeA === 'text' || typeA === 'textarea' || typeA === 'number' || typeA === 'date' ? 10 : 0));
        const scoreB = (typeB === 'select') ? 8 : (typeB === 'custom-select' ? 6 : (typeB === 'text' || typeB === 'textarea' || typeB === 'number' || typeB === 'date' ? 10 : 0));
        return (b.relevance + scoreB) - (a.relevance + scoreA);
      });
      return candidates[0].element;
    }
    return null;
  }

  function findFieldByLabelFallback(fieldConfig, usedElements) {
    const candidates = [];
    const labelSelectors = 'label, [class*="label"], [class*="title"], [class*="text"], [class*="name"], span, div, dt, th';
    const allLabels = document.querySelectorAll(labelSelectors);
    for (const labelEl of allLabels) {
      if (!isElementVisible(labelEl)) continue;
      const labelText = getTextContent(labelEl).replace(/[*＊\s:：]/g, '').trim();
      if (!labelText || labelText.length < 2 || labelText.length > 20) continue;
      if (/^(请选择|请输入|请点击|search|please)/i.test(labelText)) continue;
      if (isExcluded(labelText, fieldConfig.excludeKeywords)) continue;
      if (!matchesKeywords(labelText, fieldConfig.keywords)) continue;
      const row = findFormRow(labelEl) || labelEl.parentElement;
      if (!row) continue;
      const ctrl = findControlInContainer(row, null);
      if (!ctrl || usedElements.has(ctrl)) continue;
      if (!isElementVisible(ctrl)) continue;
      candidates.push({ element: ctrl, labelText, relevance: calcRelevance(labelText, fieldConfig.keywords) });
    }
    return candidates;
  }

  function findRadioGroup(fieldConfig, usedElements) {
    const radios = document.querySelectorAll('input[type="radio"]');
    const groups = {};
    for (const r of radios) {
      const name = r.getAttribute('name') || r.getAttribute('data-group') || `__group_${findFormRow(r)}`;
      if (!groups[name]) groups[name] = [];
      groups[name].push(r);
    }
    for (const [, group] of Object.entries(groups)) {
      if (group.length === 0) continue;
      const first = group[0];
      if (usedElements.has(first)) continue;
      if (!group.some(r => isElementVisible(r))) continue;
      const labelText = getLabelText(first);
      if (!labelText) continue;
      if (isExcluded(labelText, fieldConfig.excludeKeywords)) continue;
      if (matchesKeywords(labelText, fieldConfig.keywords)) {
        return { group, labelText, relevance: calcRelevance(labelText, fieldConfig.keywords) };
      }
    }
    return null;
  }

  function calcRelevance(labelText, keywords) {
    let score = 0;
    const lower = labelText.toLowerCase().replace(/[*＊\s:：]/g, '');
    for (const kw of keywords) {
      const kwClean = kw.toLowerCase().replace(/[*＊\s:：]/g, '');
      if (!kwClean) continue;
      if (lower === kwClean) score += 100;
      else if (lower.startsWith(kwClean)) score += 50;
      else if (lower.includes(kwClean)) score += 20;
    }
    if (labelText.length <= 6) score += 10;
    if (/^[*＊\s]*[姓名性别电话手机邮箱出生民族政治婚姻学历]/.test(labelText)) score += 5;
    return score;
  }

  function findFieldBySelector(selectors, usedElements) {
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          if (usedElements.has(el)) continue;
          if (['INPUT','TEXTAREA','SELECT'].includes(el.tagName)) {
            if (isElementVisible(el)) return el;
          } else if (isCustomSelect(el)) {
            if (isElementVisible(el)) return el;
          } else if (el.tagName === 'DIV' || el.tagName === 'SPAN' || el.tagName === 'TD' || el.tagName === 'LI' || el.tagName === 'TR') {
            const ctrl = findControlInContainer(el, null);
            if (ctrl && !usedElements.has(ctrl) && isElementVisible(ctrl)) return ctrl;
          }
        }
      } catch (e) {}
    }
    return null;
  }

  function findFieldByPlaceholder(fieldConfig, usedElements) {
    const inputs = document.querySelectorAll(ALL_CONTROLS);
    const candidates = [];
    for (const input of inputs) {
      if (usedElements.has(input)) continue;
      if (input.tagName === 'INPUT' && (input.type === 'radio' || input.type === 'checkbox' || input.type === 'hidden' || input.type === 'submit' || input.type === 'button' || input.type === 'reset')) continue;
      if (input.tagName === 'INPUT' && isInsideCustomSelect(input)) continue;
      if (input.tagName !== 'INPUT' && input.tagName !== 'TEXTAREA' && input.tagName !== 'SELECT' && !isCustomSelect(input)) continue;
      const ctrl = isCustomSelect(input) ? findCustomSelectTrigger(input) : input;
      if (!ctrl || usedElements.has(ctrl)) continue;
      if (!isElementVisible(ctrl)) continue;
      const placeholder = (ctrl.getAttribute('placeholder') || '').trim();
      const name = (ctrl.getAttribute('name') || '').toLowerCase();
      const id = (ctrl.getAttribute('id') || '').toLowerCase();
      const ariaLabel = (ctrl.getAttribute('aria-label') || '').toLowerCase();
      const text = [placeholder, name, id, ariaLabel].filter(Boolean).join(' ');
      if (!text) continue;
      if (isExcluded(text, fieldConfig.excludeKeywords)) continue;
      if (matchesKeywords(text, fieldConfig.keywords)) {
        const labelText = getLabelText(ctrl);
        if (labelText && isExcluded(labelText, fieldConfig.excludeKeywords)) continue;
        candidates.push({ element: ctrl, text, relevance: calcRelevance(text, fieldConfig.keywords) });
      }
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.relevance - a.relevance);
      return candidates[0].element;
    }
    return null;
  }

  function isElementVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    return true;
  }

  function detectAllFields() {
    const detected = {};
    const usedElements = new Set();

    for (const [field, config] of Object.entries(FIELD_MAPPING)) {
      let element = null;
      element = findFieldByLabel(config, usedElements);
      if (!element) {
        element = findFieldByPlaceholder(config, usedElements);
      }
      if (!element && config.selectors) {
        element = findFieldBySelector(config.selectors, usedElements);
      }
      if (element) {
        detected[field] = element;
        if (Array.isArray(element)) {
          element.forEach(e => usedElements.add(e));
        } else {
          usedElements.add(element);
        }
      }
    }

    detectRadioFields(detected, usedElements);
    detectSplitDateFields(detected, usedElements);
    detectByBruteForce(detected, usedElements);

    return { detected, usedElements };
  }

  function detectByBruteForce(detected, usedElements) {
    const allFields = Object.keys(FIELD_MAPPING);
    const remainingFields = allFields.filter(f => !detected[f]);
    if (remainingFields.length === 0) return;

    const allInputs = document.querySelectorAll(ALL_CONTROLS);

    for (const input of allInputs) {
      if (usedElements.has(input)) continue;
      if (input.tagName === 'INPUT' && (input.type === 'radio' || input.type === 'checkbox' || input.type === 'hidden' || input.type === 'submit' || input.type === 'button' || input.type === 'reset')) continue;
      if (input.tagName === 'INPUT' && isInsideCustomSelect(input)) continue;
      if (input.tagName !== 'INPUT' && input.tagName !== 'TEXTAREA' && input.tagName !== 'SELECT' && !isCustomSelect(input)) continue;
      const ctrl = isCustomSelect(input) ? findCustomSelectTrigger(input) : input;
      if (!ctrl || usedElements.has(ctrl)) continue;
      if (!isElementVisible(ctrl)) continue;

      const labelText = getLabelText(ctrl);
      if (!labelText || labelText.length < 1 || labelText.length > 60) continue;
      if (/^(请|输入|选择|点击|搜索|search|please|提交|保存|取消|确定)/i.test(labelText)) continue;

      let bestField = null;
      let bestScore = 0;

      for (const field of remainingFields) {
        const config = FIELD_MAPPING[field];
        if (isExcluded(labelText, config.excludeKeywords)) continue;
        if (!matchesKeywords(labelText, config.keywords)) continue;
        const score = calcRelevance(labelText, config.keywords);
        if (score > bestScore && score >= 30) {
          bestScore = score;
          bestField = field;
        }
      }

      if (bestField) {
        detected[bestField] = ctrl;
        usedElements.add(ctrl);
        const idx = remainingFields.indexOf(bestField);
        if (idx >= 0) remainingFields.splice(idx, 1);
      }
    }

    const allRows = document.querySelectorAll('tr, .ant-form-item, .el-form-item, .form-item, .form-group, [class*="form-row"], [class*="field"]');
    for (const row of allRows) {
      if (remainingFields.length === 0) break;
      const rowText = (row.textContent || '').replace(/\s+/g, '').trim();
      if (!rowText || rowText.length > 200) continue;
      const ctrl = findControlInContainer(row, null);
      if (!ctrl || usedElements.has(ctrl)) continue;
      const realCtrl = isCustomSelect(ctrl) ? findCustomSelectTrigger(ctrl) : ctrl;
      if (!realCtrl || usedElements.has(realCtrl) || !isElementVisible(realCtrl)) continue;
      for (const field of remainingFields) {
        const config = FIELD_MAPPING[field];
        if (matchesKeywords(rowText, config.keywords) && !isExcluded(rowText, config.excludeKeywords)) {
          const score = calcRelevance(rowText, config.keywords);
          if (score >= 40) {
            detected[field] = realCtrl;
            usedElements.add(realCtrl);
            const idx = remainingFields.indexOf(field);
            if (idx >= 0) remainingFields.splice(idx, 1);
            break;
          }
        }
      }
    }
  }

  function detectRadioFields(detected, usedElements) {
    const radioFields = ['gender', 'marital_status', 'has_internship', 'is_211', 'is_985', 'is_key_university'];
    for (const rf of radioFields) {
      if (detected[rf]) continue;
      const config = FIELD_MAPPING[rf];
      if (!config) continue;
      const result = findRadioGroup(config, usedElements);
      if (result && result.relevance >= 20) {
        detected[rf] = result.group;
        result.group.forEach(r => usedElements.add(r));
      }
    }
  }

  function detectSplitDateFields(detected, usedElements) {
    if (detected.birth) return;

    const allSelects = Array.from(document.querySelectorAll('select')).filter(s => !usedElements.has(s) && isElementVisible(s));
    const groups = new Map();

    for (const sel of allSelects) {
      const row = findFormRow(sel);
      if (!row) continue;
      const key = row;
      if (!groups.has(key)) {
        const rowSels = Array.from(row.querySelectorAll('select')).filter(s => isElementVisible(s) && !usedElements.has(s));
        if (rowSels.length >= 2) {
          groups.set(key, rowSels);
        }
      }
    }

    for (const [row, selects] of groups) {
      const labelText = getLabelText(selects[0]);
      if (!labelText) continue;
      if (isExcluded(labelText, ['入党', '入团', '毕业', '入职', '参加工作', '开始', '结束'])) continue;
      if (matchesKeywords(labelText, ['出生', '生日'])) {
        detected._birth_year = selects[0];
        if (selects[1]) detected._birth_month = selects[1];
        if (selects[2]) detected._birth_day = selects[2];
        selects.forEach(s => usedElements.add(s));
        break;
      }
    }
  }

  // ============================================================
  // 五、自动填充引擎
  // ============================================================

  const DATE_FIELDS = new Set(['birth', 'graduation', 'available_date', 'party_join_date', 'start_date', 'end_date', 'work_start_date']);

  function isDateFieldLike(element, fieldName) {
    if (DATE_FIELDS.has(fieldName)) return true;
    const label = getLabelText(element) || '';
    return /(日期|时间|出生|毕业|到岗|入职|年月|日期)/.test(label);
  }

  const AUTOCOMPLETE_FIELDS = new Set(['school', 'major', 'company', 'position', 'college', 'department']);

  function isAutocompleteField(fieldName) {
    return AUTOCOMPLETE_FIELDS.has(fieldName);
  }

  function fillAutocompleteInput(element, value, fieldName) {
    setNativeValue(element, value);
    triggerEvents(element);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('keyup', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    element.focus();
    element.dispatchEvent(new Event('focus', { bubbles: true }));

    const tryPickOption = () => {
      const panels = document.querySelectorAll(
        '[class*="suggestion"], [class*="autocomplete"], [class*="auto-complete"], ' +
        '[class*="search-list"], [class*="search-result"], [class*="option-list"], ' +
        '[class*="dropdown"]:not(input):not(select):not(button):not(a), ' +
        '[role="listbox"], [class*="picker-panel"], [class*="select-panel"], ' +
        '[class*="school-list"], [class*="school-suggest"], [class*="college-list"], ' +
        '[class*="zhaopin"], [class*="zhipin"], [class*="zp-"], [class*="boss-"], ' +
        '[class*="popup"]:not([class*="inner"]):not([class*="icon"])'
      );
      const getText = el => (el.textContent || '').replace(/\s+/g, '').trim();
      let bestMatch = null;
      let bestScore = 0;
      for (const panel of panels) {
        if (!isElementVisible(panel)) continue;
        const options = panel.querySelectorAll('li, [role="option"], [class*="option"], [class*="item"], a, span, div, dd');
        for (const opt of options) {
          if (!isElementVisible(opt)) continue;
          const optText = getText(opt);
          if (!optText || optText.length > 50) continue;
          if (/^(请选择|请输入|search|没有找到|暂无|无结果)/i.test(optText)) continue;
          let score = 0;
          if (optText === value) score = 100;
          else if (optText.includes(value) && value.length >= 2) score = 80;
          else if (value.includes(optText) && optText.length >= 2) score = 60;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = opt;
          }
        }
        if (bestMatch && bestScore >= 50) break;
      }
      if (bestMatch) {
        bestMatch.scrollIntoView({ block: 'center' });
        bestMatch.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        bestMatch.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
        bestMatch.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
        bestMatch.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }));
        bestMatch.click && bestMatch.click();
        return true;
      }
      return false;
    };

    for (const delay of [100, 300, 600, 1000, 1500]) {
      setTimeout(() => { try { tryPickOption(); } catch(e) {} }, delay);
    }
    return true;
  }

  function fillField(element, value, fieldName) {
    if (!element || value === undefined || value === null || value === '') return false;

    try {
      if (Array.isArray(element) && element.length > 0 && element[0].type === 'radio') {
        return fillRadioGroup(element, value, fieldName);
      }

      let ctrlType = getControlType(element);

      if (ctrlType === 'text' && element.tagName === 'INPUT' && isDateFieldLike(element, fieldName)) {
        const dateVal = formatDateForInput(value, true);
        if (dateVal) {
          setNativeValue(element, dateVal);
          triggerEvents(element);
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }

      if (ctrlType === 'text' && element.tagName === 'INPUT' && isAutocompleteField(fieldName)) {
        return fillAutocompleteInput(element, value, fieldName);
      }

      if (ctrlType === 'select') {
        return fillSelect(element, value, fieldName);
      } else if (ctrlType === 'custom-select') {
        if (window.isBossZhipinPage && window.isBossZhipinPage()) {
          const bossSelect = window.findBossSelect && window.findBossSelect(element);
          if (bossSelect) {
            return window.fillBossCustomSelect(element, value, fieldName);
          }
        }
        return fillCustomSelect(element, value, fieldName);
      } else if (ctrlType === 'textarea') {
        setNativeValue(element, value);
        triggerEvents(element);
        return true;
      } else if (ctrlType === 'radio') {
        return fillRadio(element, value, fieldName);
      } else if (ctrlType === 'checkbox') {
        element.checked = true;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      } else if (ctrlType === 'date') {
        const dateVal = formatDateForInput(value, true);
        if (dateVal) {
          setNativeValue(element, dateVal);
          triggerEvents(element);
          return true;
        }
        return false;
      } else if (ctrlType === 'text' || ctrlType === 'number') {
        setNativeValue(element, value);
        triggerEvents(element);
        return true;
      } else if (ctrlType === 'unknown') {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          if (isDateFieldLike(element, fieldName)) {
            const dateVal = formatDateForInput(value, true);
            if (dateVal) {
              setNativeValue(element, dateVal);
              triggerEvents(element);
              return true;
            }
          }
          setNativeValue(element, value);
          triggerEvents(element);
          return true;
        }
        const parent = element.parentElement;
        if (parent && (parent.className || '').toString().includes('ui-date-picker')) {
          if (window.isBossZhipinPage && window.isBossZhipinPage()) {
            return window.fillBossDatePicker && window.fillBossDatePicker(element, value, fieldName);
          }
          return fillCustomDatePicker(element, value, fieldName);
        }
        if ((element.className || '').toString().includes('ui-date-picker')) {
          if (window.isBossZhipinPage && window.isBossZhipinPage()) {
            return window.fillBossDatePicker && window.fillBossDatePicker(element, value, fieldName);
          }
          return fillCustomDatePicker(element, value, fieldName);
        }
        return fillCustomSelect(element, value, fieldName);
      }
    } catch (e) {
      console.warn('[JobPilot] 填充字段失败:', fieldName, e.message);
    }
    return false;
  }

  function fillRadioGroup(group, value, fieldName) {
    const strValue = String(value).trim();
    const valueMap = FIELD_VALUE_MAP[fieldName];

    for (const radio of group) {
      if (!isElementVisible(radio)) continue;
      const labelEl = radio.closest('label') || document.querySelector(`label[for="${radio.id}"]`) || radio.parentElement || findFormRow(radio);
      const labelText = labelEl ? (labelEl.textContent || '').trim().replace(/\s+/g, '') : '';
      const radioValue = (radio.value || '').trim();

      if (radioValue === strValue || labelText === strValue) {
        clickRadio(radio);
        return true;
      }

      if (valueMap && valueMap[strValue]) {
        for (const alias of valueMap[strValue]) {
          if (labelText.includes(alias) || radioValue.includes(alias)) {
            clickRadio(radio);
            return true;
          }
        }
      }

      if (labelText.includes(strValue) && strValue.length >= 1) {
        clickRadio(radio);
        return true;
      }
    }
    return false;
  }

  function clickRadio(radio) {
    radio.checked = true;
    radio.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    try {
      const lab = radio.closest('label');
      if (lab) lab.click();
    } catch (e) {}
  }

  function fillSelect(element, value, fieldName) {
    const options = element.options;
    if (!options || options.length === 0) return false;

    const strValue = String(value).trim();
    const valueMap = FIELD_VALUE_MAP[fieldName];

    let bestMatch = null;
    let bestScore = 0;

    for (let i = 0; i < options.length; i++) {
      const optText = options[i].textContent.trim();
      const optValue = options[i].value;
      if (!optText || optText.includes('请选择') || optText.includes('--') || optText === '') continue;

      let score = 0;

      if (optText === strValue || optValue === strValue) {
        score = 100;
      }

      if (valueMap && valueMap[strValue]) {
        const aliases = valueMap[strValue];
        for (const alias of aliases) {
          if (optText === alias) score = Math.max(score, 95);
          else if (optText.includes(alias) && alias.length >= 2) score = Math.max(score, 80);
          else if (alias.includes(optText) && optText.length >= 2) score = Math.max(score, 70);
        }
      }

      if (optText.includes(strValue) && strValue.length >= 2) score = Math.max(score, 60);
      if (strValue.includes(optText) && optText.length >= 2) score = Math.max(score, 50);

      if (fieldName === 'ethnicity') {
        if (optText === strValue + '族' || strValue === optText + '族') score = Math.max(score, 85);
      }

      if (fieldName === 'location' || fieldName === 'hukou_location' || fieldName === 'native_place' || fieldName === 'target_city' || fieldName === 'birthplace' || fieldName === 'current_residence') {
        if (optText.includes(strValue) || strValue.includes(optText)) score = Math.max(score, 55);
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = i;
      }
    }

    if (bestMatch !== null && bestScore >= 40) {
      setNativeValue(element, options[bestMatch].value);
      element.selectedIndex = bestMatch;
      triggerEvents(element);
      console.log(`[JobPilot] fillSelect 匹配成功: ${fieldName}=${strValue} -> ${options[bestMatch].textContent.trim()} (score=${bestScore})`);
      return true;
    }

    return false;
  }

  function fillRadio(element, value, fieldName) {
    const name = element.getAttribute('name');
    let radioGroup;
    if (name) {
      radioGroup = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
    } else {
      const parent = element.closest('.form-item, .el-form-item, .ant-form-item, tr, .form-group, div[class*="item"], div[class*="field"]');
      if (parent) {
        radioGroup = parent.querySelectorAll('input[type="radio"]');
      }
    }
    if (!radioGroup || radioGroup.length === 0) radioGroup = [element];

    const strValue = String(value).trim();
    const valueMap = FIELD_VALUE_MAP[fieldName];

    for (const radio of radioGroup) {
      const labelEl = radio.closest('label') || document.querySelector(`label[for="${radio.id}"]`) || radio.parentElement;
      const labelText = labelEl ? labelEl.textContent.trim() : '';

      if (radio.value === strValue || labelText === strValue) {
        radio.checked = true;
        radio.dispatchEvent(new Event('click', { bubbles: true }));
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      if (valueMap && valueMap[strValue]) {
        for (const alias of valueMap[strValue]) {
          if (labelText.includes(alias) || radio.value.includes(alias)) {
            radio.checked = true;
            radio.dispatchEvent(new Event('click', { bubbles: true }));
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
      }

      if (labelText.includes(strValue) || strValue.includes(labelText)) {
        radio.checked = true;
        radio.dispatchEvent(new Event('click', { bubbles: true }));
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  function formatDateForInput(value, includeDay = true) {
    const str = String(value).trim();
    const fullMatch = str.match(/(\d{4})[\.\-\/年](\d{1,2})[\.\-\/月](\d{1,2})/);
    if (fullMatch) {
      return `${fullMatch[1]}-${fullMatch[2].padStart(2, '0')}-${fullMatch[3].padStart(2, '0')}`;
    }
    const ymMatch = str.match(/(\d{4})[\.\-\/年](\d{1,2})/);
    if (ymMatch) {
      if (includeDay) {
        return `${ymMatch[1]}-${ymMatch[2].padStart(2, '0')}-01`;
      }
      return `${ymMatch[1]}-${ymMatch[2].padStart(2, '0')}`;
    }
    const yearMatch = str.match(/(\d{4})/);
    if (yearMatch) return yearMatch[1];
    return null;
  }

  function fillSplitDate(detected, resumeData) {
    const birthVal = resumeData.birth;
    if (!birthVal) return false;

    const yearMatch = String(birthVal).match(/(\d{4})/);
    const monthMatch = String(birthVal).match(/\d{4}[\.\-\/年](\d{1,2})/);

    if (!yearMatch) return false;
    const year = yearMatch[1];
    const month = monthMatch ? monthMatch[1] : null;

    let filled = false;
    if (detected._birth_year) {
      filled = fillSelect(detected._birth_year, year, 'birth_year') || filled;
    }
    if (detected._birth_month && month) {
      filled = fillSelectWithMonth(detected._birth_month, month) || filled;
    }
    return filled;
  }

  function fillSelectWithMonth(element, monthValue) {
    const options = element.options;
    if (!options) return false;
    const monthNum = String(monthValue).replace(/^0/, '');
    const aliases = MONTH_MAP[monthValue.padStart(2, '0')] || [monthNum, monthValue];

    for (let i = 0; i < options.length; i++) {
      const optText = options[i].textContent.trim();
      const optValue = options[i].value;
      if (!optText || optText.includes('请选择') || optText.includes('--')) continue;
      for (const alias of aliases) {
        if (optText === alias || optValue === alias || optText.includes(alias + '月') || optText.includes(alias)) {
          setNativeValue(element, options[i].value);
          element.selectedIndex = i;
          triggerEvents(element);
          return true;
        }
      }
    }
    return false;
  }

  function highlightField(element, success) {
    if (!element) return;
    element.style.transition = 'border 0.3s ease, box-shadow 0.3s ease';
    element.style.border = success ? '2px solid #52c41a' : '2px solid #ff4d4f';
    element.style.boxShadow = success
      ? '0 0 0 3px rgba(82,196,26,0.12)'
      : '0 0 0 3px rgba(255,77,79,0.12)';
    setTimeout(() => {
      element.style.border = '';
      element.style.boxShadow = '';
    }, 3000);
  }

  function getHighlightTarget(el) {
    if (Array.isArray(el)) return el[0];
    return el;
  }

  function autoFillAll(incomingData) {
    if (incomingData) {
      resumeData = { ...resumeData, ...incomingData };
    }

    let filledCount = 0;
    let failCount = 0;
    const fillResults = [];
    const unfilled = [];
    const filledFields = new Set();
    // 收集下拉匹配失败的字段，供 LLM 兜底
    const failedSelects = [];

    for (let pass = 0; pass < 2; pass++) {
      const { detected } = detectAllFields();

      for (const [field, element] of Object.entries(detected)) {
        if (field.startsWith('_')) continue;
        if (filledFields.has(field)) continue;

        let value = resumeData[field];
        if (field === 'experience' && !value) {
          if (resumeData.intern_desc_1) value = resumeData.intern_desc_1;
        }
        if (field === 'project' && !value) {
          if (resumeData.project_desc_1) value = resumeData.project_desc_1;
        }

        if (!value) {
          if (pass === 0) {
            fillResults.push({ field, success: false, reason: '无数据' });
            unfilled.push(field);
            filledFields.add(field);
          }
          continue;
        }

        const ok = fillField(element, value, field);
        if (ok) {
          filledCount++;
          fillResults.push({ field, success: true, pass: pass + 1 });
          highlightField(getHighlightTarget(element), true);
          filledFields.add(field);
        } else {
          if (pass === 1) {
            failCount++;
            fillResults.push({ field, success: false, reason: 'select/radio未匹配' });
            highlightField(getHighlightTarget(element), false);
            unfilled.push(field);
            filledFields.add(field);
            // 收集下拉类失败字段，供 LLM 兜底
            const ctrlType = getControlType(element);
            if (ctrlType === 'select' || ctrlType === 'custom-select') {
              failedSelects.push({ field, value, element, ctrlType });
            }
          }
        }
      }

      if (detected._birth_year && !filledFields.has('_birth')) {
        const ok = fillSplitDate(detected, resumeData);
        if (ok) {
          filledCount++;
          filledFields.add('_birth');
        }
      }

      const remainingDataFields = Object.keys(FIELD_MAPPING).filter(f => resumeData[f] && !filledFields.has(f));
      if (remainingDataFields.length === 0) break;
    }

    fillIframes(incomingData);

    scheduleDelayedFill(resumeData, filledFields, 500);
    scheduleDelayedFill(resumeData, filledFields, 1500);

    // LLM 兜底：异步填充规则匹配失败的下拉字段（不阻塞 sendResponse）
    if (failedSelects.length > 0) {
      llmFillFailedSelects(failedSelects, filledFields);
    }

    // 重复区块填充：多段教育/实习/项目
    document.body.setAttribute('data-jp-autofill-before-repeat', 'true');
    fillRepeatableSections(resumeData, filledFields);
    document.body.setAttribute('data-jp-autofill-after-repeat', 'true');

    // 自定义字段填充（按 customSchema 的 keywords 匹配 DOM）
    const customResult = fillCustomFields(resumeData, filledFields, fillResults);
    filledCount += customResult.filled;
    failCount += customResult.failed;
    if (customResult.unfilled.length > 0) {
      unfilled.push(...customResult.unfilled);
    }

    // LLM 智能填充：主动扫描页面，通过语义匹配填充规则未覆盖的字段
    // 放在最后执行，避免与规则匹配抢控件
    const { usedElements } = detectAllFields();
    llmSmartFill(resumeData, filledFields, usedElements);

    // LLM 生成开放问题回答
    const questions = detectOpenQuestions();
    if (questions.length > 0) {
      llmGenerateOpenAnswers(questions, resumeData);
    }

    return {
      total: Object.keys(FIELD_MAPPING).length + Object.keys(customSchema.fields || {}).length,
      filled: filledCount,
      failed: failCount,
      results: fillResults,
      unfilled,
      llmPending: failedSelects.length + customResult.llmPending + 2,
    };
  }

  /**
   * 填充自定义字段：遍历 customSchema.fields，按 keywords 匹配 DOM 元素
   * 关键词匹配失败时收集到 LLM 兜底队列
   *
   * @param {object} resumeData - 简历数据
   * @param {Set} filledFieldsRef - 已填充字段集合（同步更新）
   * @param {Array} fillResultsRef - 填充结果日志（同步追加）
   * @returns {{filled:number, failed:number, unfilled:string[], llmPending:number, customFailedForLLM:Array}}
   */
  function fillCustomFields(resumeData, filledFieldsRef, fillResultsRef) {
    const result = { filled: 0, failed: 0, unfilled: [], llmPending: 0, customFailedForLLM: [] };
    const fields = customSchema.fields || {};
    if (Object.keys(fields).length === 0) return result;

    // 复用 detectAllFields 的 usedElements，避免与默认字段抢同一控件
    const { usedElements } = detectAllFields();
    // 把已填充字段对应的元素也加入 usedElements
    filledFieldsRef.forEach(() => {});

    for (const [key, meta] of Object.entries(fields)) {
      if (filledFieldsRef.has(key)) continue;
      const value = resumeData[key];
      if (!value) {
        fillResultsRef.push({ field: key, success: false, reason: '无数据(自定义)' });
        result.unfilled.push(key);
        filledFieldsRef.add(key);
        continue;
      }

      const fieldConfig = {
        keywords: Array.isArray(meta.keywords) ? meta.keywords : [],
        excludeKeywords: [],
        selectors: [],
      };
      if (fieldConfig.keywords.length === 0) {
        // 没有关键词，跳过 DOM 匹配，直接进 LLM 兜底
        result.customFailedForLLM.push({ key, label: meta.label, type: meta.type, value: String(value), options: meta.options || [] });
        result.llmPending++;
        filledFieldsRef.add(key);
        continue;
      }

      // 类型为 radio 时走 findRadioGroup
      let element = null;
      if (meta.type === 'radio') {
        const rg = findRadioGroup(fieldConfig, usedElements);
        if (rg && rg.relevance >= 20) {
          element = rg.group;
          rg.group.forEach(r => usedElements.add(r));
        }
      } else {
        element = findFieldByLabel(fieldConfig, usedElements);
        if (!element) element = findFieldByPlaceholder(fieldConfig, usedElements);
        if (element) usedElements.add(element);
      }

      if (element) {
        const ok = fillField(element, value, key);
        if (ok) {
          result.filled++;
          fillResultsRef.push({ field: key, success: true, custom: true });
          highlightField(getHighlightTarget(element), true);
          filledFieldsRef.add(key);
          continue;
        }
      }

      // 关键词匹配失败或填充失败 → 进入 LLM 兜底队列
      result.customFailedForLLM.push({
        key, label: meta.label, type: meta.type,
        value: String(value), options: meta.options || [],
      });
      result.llmPending++;
      fillResultsRef.push({ field: key, success: false, reason: '自定义字段关键词未匹配', custom: true });
      result.unfilled.push(key);
      filledFieldsRef.add(key);
    }

    // 异步触发 LLM 兜底（不阻塞返回）
    if (result.customFailedForLLM.length > 0) {
      llmFillFailedCustomFields(result.customFailedForLLM, filledFieldsRef, usedElements);
    }

    return result;
  }

  /**
   * LLM 兜底填充自定义字段：
   * 收集页面所有可见 input/select 的 label 列表，让 LLM 推断每个自定义字段值该填到哪个 label 对应的控件
   * 隐私：只发送 (字段标签 + 值 + 控件 label 列表)，不发完整简历
   */
  async function llmFillFailedCustomFields(failedList, filledFieldsRef, usedElementsRef) {
    try {
      // 1. 收集页面所有可用控件及其 label
      const allControls = [];
      const allInputs = document.querySelectorAll(ALL_CONTROLS);
      const seen = new Set();
      for (const input of allInputs) {
        if (input.tagName === 'INPUT' && ['radio','checkbox','hidden','submit','button','reset'].includes(input.type)) continue;
        const ctrl = isCustomSelect(input) ? findCustomSelectTrigger(input) : input;
        if (!ctrl || seen.has(ctrl) || !isElementVisible(ctrl)) continue;
        seen.add(ctrl);
        const labelText = (getLabelText(ctrl) || ctrl.placeholder || '').trim();
        if (!labelText || labelText.length > 60) continue;
        allControls.push({ label: labelText, type: getControlType(ctrl) });
      }

      if (allControls.length === 0) return;

      // 2. 打包请求 LLM
      const fieldsForLLM = failedList
        .filter(f => !filledFieldsRef.has(f.key))
        .map(f => ({
          field: f.key,
          fieldLabel: f.label,
          fieldType: f.type,
          value: f.value,
          options: f.options,
        }));

      if (fieldsForLLM.length === 0) return;

      console.log('[JobPilot] LLM 自定义字段兜底，字段数:', fieldsForLLM.length);

      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'llmMatchCustomFields',
          fields: fieldsForLLM,
          pageControls: allControls,
        }, resolve);
      });

      if (!resp || !resp.success || !resp.data) {
        console.warn('[JobPilot] LLM 自定义字段兜底无结果:', resp?.error);
        return;
      }

      // 3. LLM 返回 {fieldKey: matchedLabel}，按 label 找回控件并填充
      const matches = resp.data;
      for (const [fieldKey, matchedLabel] of Object.entries(matches)) {
        if (filledFieldsRef.has(fieldKey)) continue;
        if (!matchedLabel) continue;
        // 在 allControls 中找最接近 matchedLabel 的控件
        const matched = allControls.find(c => c.label === matchedLabel) ||
                        allControls.find(c => c.label.includes(matchedLabel) || matchedLabel.includes(c.label));
        if (!matched) continue;
        // 找回实际 DOM 控件
        const ctrlEl = findControlByLabel(matched.label, usedElementsRef);
        if (!ctrlEl) continue;

        const meta = (customSchema.fields || {})[fieldKey] || {};
        const value = resumeData[fieldKey];
        if (!value) continue;

        const ok = fillField(ctrlEl, value, fieldKey);
        if (ok) {
          usedElementsRef.add(ctrlEl);
          filledFieldsRef.add(fieldKey);
          highlightField(ctrlEl, true);
          console.log('[JobPilot] LLM 兜底填充成功:', fieldKey, '→', matched.label);
        }
      }
    } catch (e) {
      console.warn('[JobPilot] LLM 自定义字段兜底异常:', e.message);
    }
  }

  // 按 label 文本查找未占用的可见控件
  function findControlByLabel(labelText, usedElementsRef) {
    if (!labelText) return null;
    const allInputs = document.querySelectorAll(ALL_CONTROLS);
    for (const input of allInputs) {
      if (usedElementsRef.has(input)) continue;
      if (input.tagName === 'INPUT' && ['radio','checkbox','hidden','submit','button','reset'].includes(input.type)) continue;
      const ctrl = isCustomSelect(input) ? findCustomSelectTrigger(input) : input;
      if (!ctrl || usedElementsRef.has(ctrl) || !isElementVisible(ctrl)) continue;
      const lt = (getLabelText(ctrl) || ctrl.placeholder || '').trim();
      if (lt === labelText) return ctrl;
    }
    return null;
  }

  /**
   * LLM 兜底填充：对规则匹配失败的下拉字段，调用 LLM 进行语义匹配
   * 隐私设计：只发送 (字段名 + 简历值 + 选项列表)，不发送完整简历
   *
   * @param {Array} failedSelects - [{field, value, element, ctrlType}]
   * @param {Set} filledFieldsRef - 已填充字段集合（用于更新）
   */
  async function llmFillFailedSelects(failedSelects, filledFieldsRef) {
    try {
      // 1. 收集每个 select 的选项
      const fieldsForLLM = [];
      const elementMap = new Map(); // field -> {element, ctrlType}

      for (const item of failedSelects) {
        if (filledFieldsRef.has(item.field)) continue; // 已被延迟填充解决
        const options = collectSelectOptions(item.element, item.ctrlType);
        if (options.length === 0) {
          // custom-select 选项需打开 panel 才能读取，跳过 LLM
          continue;
        }
        fieldsForLLM.push({
          field: item.field,
          value: String(item.value),
          options: options,
        });
        elementMap.set(item.field, { element: item.element, ctrlType: item.ctrlType });
      }

      if (fieldsForLLM.length === 0) return;

      console.log('[JobPilot] LLM 下拉兜底匹配，字段数:', fieldsForLLM.length);

      // 2. 调用 background LLM
      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'llmMatchDropdownOptions', fields: fieldsForLLM },
          resolve
        );
      });

      if (!resp || !resp.success || !resp.data) {
        console.warn('[JobPilot] LLM 下拉匹配失败:', resp ? resp.error : '无响应');
        return;
      }

      // 3. 用匹配结果重新填充
      let llmFilled = 0;
      for (const [field, matchedValue] of Object.entries(resp.data)) {
        const info = elementMap.get(field);
        if (!info || !info.element) continue;
        const ok = fillField(info.element, matchedValue, field);
        if (ok) {
          llmFilled++;
          filledFieldsRef.add(field);
          highlightField(getHighlightTarget(info.element), true);
          console.log('[JobPilot] LLM 下拉匹配成功:', field, '->', matchedValue);
        } else {
          console.warn('[JobPilot] LLM 返回的选项仍无法匹配:', field, '->', matchedValue);
        }
      }

      if (llmFilled > 0) {
        console.log(`[JobPilot] LLM 兜底填充完成，成功 ${llmFilled}/${fieldsForLLM.length} 个字段`);
        // 在页面显示提示
        showFloatingTip(`AI 补充填充 ${llmFilled} 个下拉字段`);
      }
    } catch (err) {
      console.error('[JobPilot] LLM 兜底填充异常:', err);
    }
  }

  /**
   * 收集 select 元素的选项文本列表
   * @param {Element} element
   * @param {string} ctrlType - 'select' | 'custom-select'
   * @returns {string[]}
   */
  function collectSelectOptions(element, ctrlType) {
    if (ctrlType === 'select' && element.options) {
      const opts = [];
      for (let i = 0; i < element.options.length; i++) {
        const text = (element.options[i].textContent || '').trim();
        if (text && !text.includes('请选择') && text !== '--' && text !== '') {
          opts.push(text);
        }
      }
      return opts;
    }
    // custom-select 选项动态加载，需要打开 panel 才能读取
    // 为避免副作用，LLM 兜底暂不处理 custom-select
    return [];
  }

  /**
   * LLM 智能表单分析与填充
   * 主动扫描页面所有可见控件，通过 LLM 语义匹配将简历数据填入最合适的字段
   * 
   * @param {Object} resumeData - 简历数据
   * @param {Set} filledFieldsRef - 已填充字段集合
   * @param {Set} usedElementsRef - 已使用元素集合
   * @returns {Promise<number>} - LLM 成功填充的字段数
   */
  async function llmSmartFill(resumeData, filledFieldsRef, usedElementsRef) {
    try {
      // 1. 收集页面所有可见表单控件
      const formFields = [];
      const elementLabelMap = new Map(); // label -> element
      const allInputs = document.querySelectorAll(ALL_CONTROLS);
      const seen = new Set();

      for (const input of allInputs) {
        if (input.tagName === 'INPUT' && ['radio', 'checkbox', 'hidden', 'submit', 'button', 'reset'].includes(input.type)) continue;
        const ctrl = isCustomSelect(input) ? findCustomSelectTrigger(input) : input;
        if (!ctrl || seen.has(ctrl) || !isElementVisible(ctrl)) continue;
        seen.add(ctrl);

        const labelText = (getLabelText(ctrl) || ctrl.placeholder || '').trim();
        if (!labelText || labelText.length > 60 || labelText.includes('请选择') || labelText.includes('请输入')) continue;

        let fieldType = getControlType(ctrl);
        let options = [];
        if (fieldType === 'select' || fieldType === 'custom-select') {
          options = collectSelectOptions(ctrl, fieldType);
        }

        formFields.push({
          label: labelText,
          type: fieldType,
          options: options,
        });
        elementLabelMap.set(labelText, ctrl);
      }

      if (formFields.length === 0) {
        console.log('[JobPilot] LLM 智能填充：未找到表单控件');
        return 0;
      }

      console.log('[JobPilot] LLM 智能填充：扫描到', formFields.length, '个表单字段');

      // 2. 调用 LLM 分析匹配
      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'llmAnalyzePageForm',
          formFields: formFields,
          resumeData: resumeData,
        }, resolve);
      });

      if (!resp || !resp.success || !Array.isArray(resp.data) || resp.data.length === 0) {
        console.warn('[JobPilot] LLM 智能填充无结果:', resp?.error);
        return 0;
      }

      // 3. 根据 LLM 返回结果填充表单
      let llmFilled = 0;
      const processedLabels = new Set();

      for (const match of resp.data) {
        const { formLabel, fillValue } = match;
        if (!formLabel || !fillValue || processedLabels.has(formLabel)) continue;

        const ctrl = elementLabelMap.get(formLabel);
        if (!ctrl || usedElementsRef.has(ctrl)) continue;

        const ok = fillField(ctrl, fillValue, formLabel);
        if (ok) {
          llmFilled++;
          usedElementsRef.add(ctrl);
          filledFieldsRef.add(formLabel);
          highlightField(getHighlightTarget(ctrl), true);
          console.log('[JobPilot] LLM 智能填充成功:', formLabel, '→', fillValue);
        }
        processedLabels.add(formLabel);
      }

      if (llmFilled > 0) {
        console.log(`[JobPilot] LLM 智能填充完成，成功 ${llmFilled}/${resp.data.length} 个字段`);
        showFloatingTip(`AI 智能填充 ${llmFilled} 个字段`);
      }

      return llmFilled;
    } catch (err) {
      console.error('[JobPilot] LLM 智能填充异常:', err);
      return 0;
    }
  }

  /**
   * 使用 LLM 生成开放问题的个性化回答
   * 
   * @param {Array} questions - [{element, question, type}]
   * @param {Object} resumeData - 简历数据
   * @returns {Promise<number>} - LLM 成功生成回答的数量
   */
  async function llmGenerateOpenAnswers(questions, resumeData) {
    try {
      if (!Array.isArray(questions) || questions.length === 0) {
        return 0;
      }

      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'llmGenerateAnswers',
          questions: questions.map(q => ({ question: q.question, type: q.type })),
          resumeData: resumeData,
        }, resolve);
      });

      if (!resp || !resp.success || !Array.isArray(resp.data) || resp.data.length === 0) {
        console.warn('[JobPilot] LLM 生成开放问题回答无结果:', resp?.error);
        return 0;
      }

      let filledCount = 0;
      for (const answer of resp.data) {
        const { question, answer: text } = answer;
        if (!question || !text) continue;

        const qItem = questions.find(q => q.question === question);
        if (!qItem || !qItem.element) continue;

        setNativeValue(qItem.element, text);
        triggerEvents(qItem.element);
        highlightField(qItem.element, true);
        filledCount++;
        console.log('[JobPilot] LLM 生成回答成功:', question.substring(0, 30), '→', text.substring(0, 50));
      }

      if (filledCount > 0) {
        console.log(`[JobPilot] LLM 生成开放问题回答完成，成功 ${filledCount}/${questions.length} 个`);
        showFloatingTip(`AI 生成 ${filledCount} 个回答`);
      }

      return filledCount;
    } catch (err) {
      console.error('[JobPilot] LLM 生成开放问题回答异常:', err);
      return 0;
    }
  }

  /**
   * 重复区块填充：处理多段教育/实习/项目经历
   *
   * 策略：
   * 1. 从 resumeData 提取多段数据数组（school_1/degree_1/..., intern_company_1/..., project_name_1/...）
   * 2. 检测页面上的重复区块容器（教育块、实习块、项目块）
   * 3. 如果已有区块 < 数据条数，点击"+添加"按钮创建
   * 4. 逐区块匹配并填充
   *
   * @param {Object} data - 简历数据
   * @param {Set} filledFieldsRef - 已填充字段集合
   */
  function fillRepeatableSections(data, filledFieldsRef) {
    try {
      document.body.setAttribute('data-jp-repeatable-called', 'true');
      // 异步执行，等待 DOM 更新
      setTimeout(() => {
        document.body.setAttribute('data-jp-edu-timeout', 'fired');
        fillEducationBlocks(data, filledFieldsRef);
      }, 300);
      setTimeout(() => fillRepeatableSection(data, filledFieldsRef, {
        sectionKeywords: ['实习经历', '实习经验', '实习'],
        addBtnKeywords: ['添加'],
        addBtnExclude: ['工作经历', '项目经历', '教育经历'],
        fields: {
          company: { keywords: ['公司名称', '公司', '实习公司', '单位名称', '实习单位'], type: 'text' },
          position: { keywords: ['职位名称', '职位', '岗位', '实习职位', '实习岗位'], type: 'text' },
          duration: { keywords: ['起止时间', '实习时间', '时间', '开始时间', '结束时间'], type: 'date-range' },
          desc: { keywords: ['描述', '工作描述', '实习描述', '工作内容', '职责', '实习内容'], type: 'textarea' },
        },
        dataPrefix: 'intern',
        fieldMap: { company: 'company', position: 'position', duration: 'duration', desc: 'desc' },
      }), 600);
      setTimeout(() => fillRepeatableSection(data, filledFieldsRef, {
        sectionKeywords: ['项目经历', '项目经验', '项目'],
        addBtnKeywords: ['添加'],
        addBtnExclude: ['实习经历', '工作经历', '教育经历'],
        fields: {
          name: { keywords: ['项目名称', '项目名', '名称'], type: 'text' },
          role: { keywords: ['项目角色', '角色', '担任角色', '职责角色'], type: 'text' },
          duration: { keywords: ['起止时间', '项目时间', '时间', '开始时间', '结束时间'], type: 'date-range' },
          link: { keywords: ['项目链接', '链接', '项目地址', '地址'], type: 'text' },
          desc: { keywords: ['描述', '项目描述', '项目内容', '项目介绍', '项目职责'], type: 'textarea' },
        },
        dataPrefix: 'project',
        fieldMap: { name: 'name', role: 'role', duration: 'duration', link: 'link', desc: 'desc' },
      }), 900);
    } catch (e) {
      console.warn('[JobPilot] fillRepeatableSections error:', e);
    }
  }

  /**
   * 从 resumeData 提取多段教育数据
   * 返回数组，每段包含 {school, degree, major, graduation}
   */
  function extractEducationEntries(data) {
    const entries = [];

    // 优先使用 _N 后缀的多段数据
    for (let i = 1; i <= 5; i++) {
      const school = data[`school_${i}`];
      const degree = data[`degree_${i}`];
      const major = data[`major_${i}`];
      const graduation = data[`graduation_${i}`];
      const edu_duration = data[`edu_duration_${i}`];
      if (school || degree || major) {
        entries.push({ 
          school: school || '', 
          degree: degree || '', 
          major: major || '', 
          graduation: graduation || '',
          edu_duration: edu_duration || ''
        });
      }
    }

    // 如果没有 _N 数据，使用单字段数据
    if (entries.length === 0 && (data.school || data.degree || data.major)) {
      entries.push({
        school: data.school || '',
        degree: data.degree || '',
        major: data.major || '',
        graduation: data.graduation || '',
        edu_duration: data.edu_duration || ''
      });
    }
    
    // 把全局的校园经历和主修课程加到第一段教育经历中
    // （因为 BOSS 直聘等网站把这些字段放在教育经历区块内）
    if (entries.length > 0) {
      if (data.campus_activities) entries[0].campus_activities = data.campus_activities;
      if (data.major_courses) entries[0].major_courses = data.major_courses;
    }

    return entries;
  }

  /**
   * 从 resumeData 提取多段实习/项目数据
   */
  function extractEntries(data, prefix, fieldMap) {
    const entries = [];
    for (let i = 1; i <= 5; i++) {
      const entry = {};
      let hasData = false;
      for (const [localKey, dataKey] of Object.entries(fieldMap)) {
        const val = data[`${prefix}_${dataKey}_${i}`];
        entry[localKey] = val || '';
        if (val) hasData = true;
      }
      if (hasData) entries.push(entry);
    }
    return entries;
  }

  /**
   * 专门针对 BOSS 直聘 ui-select 组件的填充函数
   */
  function fillBossUISelect(uiSelectEl, value, fieldName) {
    const strValue = String(value).trim();
    if (!strValue) return false;
    
    const valueMap = FIELD_VALUE_MAP[fieldName];
    const aliases = new Set();
    aliases.add(strValue);
    if (valueMap && valueMap[strValue]) {
      valueMap[strValue].forEach(a => aliases.add(a));
    }
    
    const getText = el => (el.textContent || '').replace(/\s+/g, '').trim();
    
    // 点击打开下拉
    const trigger = uiSelectEl.querySelector('.ui-select-selection') || uiSelectEl;
    try { trigger.click(); } catch(e) {}
    
    // 尝试选择选项
    const trySelect = () => {
      // 找到可见的 dropdown
      const dropdowns = document.querySelectorAll('.ui-select-dropdown');
      let targetDropdown = null;
      for (const d of dropdowns) {
        const style = window.getComputedStyle(d);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          const rect = d.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            targetDropdown = d;
            break;
          }
        }
      }
      
      if (!targetDropdown) return false;
      
      // 在下拉中找选项
      const options = targetDropdown.querySelectorAll('li');
      let bestMatch = null;
      let bestScore = 0;
      
      for (const opt of options) {
        const optText = getText(opt);
        if (!optText || optText.length > 30) continue;
        if (/^(请选择|无匹配数据|加载中)/.test(optText)) continue;
        
        let score = 0;
        for (const alias of aliases) {
          if (optText === alias) score = Math.max(score, 100);
          else if (optText.includes(alias) && alias.length >= 2) score = Math.max(score, 85);
        }
        if (optText === strValue) score = Math.max(score, 95);
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = opt;
        }
      }
      
      if (bestMatch && bestScore >= 40) {
        bestMatch.scrollIntoView({ block: 'center' });
        bestMatch.click();
        return true;
      }
      return false;
    };
    
    // 多次尝试
    if (trySelect()) return true;
    for (const delay of [100, 300, 600, 1000]) {
      setTimeout(() => trySelect(), delay);
    }
    return true;
  }

  /**
   * 填充多段教育区块
   */
  function fillEducationBlocks(data, filledFieldsRef) {
    try {
      // 调试标记
      document.body.setAttribute('data-jp-fill-edu-called', 'true');
      document.body.setAttribute('data-jp-edu-entries-count', '0');
      
      const entries = extractEducationEntries(data);
      document.body.setAttribute('data-jp-edu-entries-count', String(entries.length));
      if (entries.length === 0) {
        document.body.setAttribute('data-jp-edu-reason', 'no entries');
        return;
      }

      // 检测教育经历区块
      let allBlocks = findRepeatableBlocks(['教育经历', '教育背景', 'education'], ['学校名称', '学校', '院校', '学历']);
      document.body.setAttribute('data-jp-edu-blocks-v1', String(allBlocks.length));
      
      // 备用方案：如果 findRepeatableBlocks 找不到，直接找常见的区块容器
      if (allBlocks.length === 0) {
        const containerSelectors = '.group-part-item-content, [class*="part-item"], [class*="group-item"], [class*="edu-item"], [class*="education-item"], [class*="form-section"], [class*="section"]';
        const containers = document.querySelectorAll(containerSelectors);
        allBlocks = [];
        const seen = new Set();
        for (const c of containers) {
          if (!isElementVisible(c)) continue;
          if (seen.has(c)) continue;
          const text = (c.textContent || '').replace(/\s+/g, '');
          if (text.includes('学校名称') || (text.includes('学历') && text.includes('专业'))) {
            allBlocks.push(c);
            seen.add(c);
          }
        }
        document.body.setAttribute('data-jp-edu-blocks-fallback', String(allBlocks.length));
      }
      
      // 二次过滤：真正的教育区块必须包含"学校名称"作为独立字段
      // （排除个人信息区域中只有"最高学历"的情况）
      const blocks = allBlocks.filter(block => {
        const labels = block.querySelectorAll('.item-label, [class*="form-item"] > [class*="label"], [class*="item-label"]');
        const labelTexts = [];
        for (const lbl of labels) {
          const text = (lbl.textContent || '').trim();
          if (text && text.length > 0) labelTexts.push(text);
        }
        
        // 条件1：必须有精确的"学校名称" label（排除"最高学历毕业学校"这种组合字段）
        const hasExactSchoolLabel = labelTexts.some(t => t === '学校名称');
        
        // 条件2：必须有"学历"或"学位"字段（教育经历的特征）
        const hasDegreeField = labelTexts.some(t => t === '学历' || t === '学位' || t === '专业');
        
        // 条件3：必须有"时间"相关字段（教育经历有起止时间）
        const hasTimeField = labelTexts.some(t => t.includes('时间') || t.includes('起止') || t === '时间段');
        
        // 真正的教育区块需要同时满足：有学校名称 + (有学历/学位/专业 或 有时间)
        return hasExactSchoolLabel && (hasDegreeField || hasTimeField);
      });
      
      document.body.setAttribute('data-jp-edu-blocks-filtered', String(blocks.length));
      
      // 记录每个区块的信息
      const blockInfos = blocks.map((b, i) => {
        return `block${i}: ${b.tagName}.${b.className.split(' ').slice(0, 3).join('.')}`;
      }).join(' | ');
      document.body.setAttribute('data-jp-edu-blocks-info', blockInfos);
      
      if (blocks.length === 0) {
        document.body.setAttribute('data-jp-edu-reason', 'no blocks after filter');
        console.log('[JobPilot] 未检测到教育区块');
        return;
      }

      console.log(`[JobPilot] 检测到 ${blocks.length} 个教育区块（过滤前${allBlocks.length}个），${entries.length} 段教育数据`);

      // 智联招聘页面上教育块通常是倒序排列（最高学历/最新在最上面）
      // LLM 返回的 entries 是按时间从早到晚排列，需要反转后填充
      const reversedEntries = [...entries].reverse();

      // 按顺序填充（区块从上到下 = 学历从高到低）
      const fillCount = Math.min(blocks.length, reversedEntries.length);
      for (let i = 0; i < fillCount; i++) {
        fillEducationBlock(blocks[i], reversedEntries[i]);
      }

      // 如果数据比区块多，尝试点击"添加"创建更多区块（追加到下方，即更早的教育）
      if (reversedEntries.length > blocks.length) {
        addAndFillBlocks(blocks[blocks.length - 1], reversedEntries.slice(blocks.length), {
          school: { keywords: ['学校名称', '学校', '院校'], type: 'text' },
          degree: { keywords: ['学历', '学位'], type: 'select' },
          major: { keywords: ['专业', '所学专业'], type: 'text' },
          graduation: { keywords: ['起止时间', '毕业时间', '时间'], type: 'date-range' },
        });
      }
    } catch (e) {
      console.warn('[JobPilot] fillEducationBlocks error:', e);
    }
  }

  /**
   * 填充单个教育区块
   */
  function fillEducationBlock(block, entry) {
    try {
      // 调试：标记被处理的区块
      block.style.outline = '2px solid red';
      block.setAttribute('data-jp-edu-filled', 'true');
      block.setAttribute('data-jp-entry-school', entry.school || '');
      block.setAttribute('data-jp-entry-degree', entry.degree || '');
      block.setAttribute('data-jp-entry-graduation', entry.graduation || '');
      block.setAttribute('data-jp-entry-duration', entry.edu_duration || '');
      block.setAttribute('data-jp-entry-campus', entry.campus_activities ? 'has' : 'no');
      block.setAttribute('data-jp-entry-courses', entry.major_courses ? 'has' : 'no');
      
      // 在区块内查找学校输入框
      const schoolInput = findFieldInContainer(block, ['学校名称', '学校', '院校'], ['input']);
      if (schoolInput && entry.school) {
        setNativeValue(schoolInput, entry.school);
        triggerEvents(schoolInput);
        highlightField(schoolInput, true);
      }

      // 查找学历下拉框（支持原生 select 和自定义下拉）
      if (entry.degree) {
        let degreeSelect = findFieldInContainer(block, ['学历'], ['select']);
        block.setAttribute('data-jp-degree-found-v1', degreeSelect ? 'yes' : 'no');
        
        if (degreeSelect) {
          const result = fillField(degreeSelect, entry.degree, 'degree');
          block.setAttribute('data-jp-degree-fill-result', result ? 'success' : 'fail');
        } else {
          // 尝试找自定义下拉框
          const formItems = block.querySelectorAll('.form-item');
          let customEl = null;
          for (const item of formItems) {
            const lbl = item.querySelector('.item-label');
            if (lbl && lbl.textContent.trim() === '学历') {
              // 优先找 ui-select 容器
              const uiSelect = item.querySelector('[class*="ui-select"]');
              if (uiSelect && isElementVisible(uiSelect)) {
                customEl = uiSelect;
                block.setAttribute('data-jp-degree-found-v2', 'yes-ui-select');
                break;
              }
              // 其次找 readonly input
              const readonlyInput = item.querySelector('input[readonly]');
              if (readonlyInput && isElementVisible(readonlyInput)) {
                customEl = readonlyInput;
                block.setAttribute('data-jp-degree-found-v2', 'yes-input');
                break;
              }
            }
          }
          if (customEl) {
            block.setAttribute('data-jp-degree-tag', customEl.tagName);
            block.setAttribute('data-jp-degree-class', (customEl.className || '').substring(0, 80));
            // 使用专门针对BOSS直聘ui-select的填充函数
            const result = fillBossUISelect(customEl, entry.degree, 'degree');
            block.setAttribute('data-jp-degree-fill-result', result ? 'success' : 'fail');
          }
        }
      }

      // 查找学位下拉框（延迟填充，避免和学历下拉冲突）
      if (entry.degree) {
        setTimeout(() => {
          const formItems = block.querySelectorAll('.form-item');
          let degreeUiSelect = null;
          for (const item of formItems) {
            const lbl = item.querySelector('.item-label');
            if (lbl && lbl.textContent.trim() === '学位') {
              const uiSelect = item.querySelector('[class*="ui-select"]');
              if (uiSelect && isElementVisible(uiSelect)) {
                degreeUiSelect = uiSelect;
                break;
              }
            }
          }
          if (degreeUiSelect) {
            // 根据学历推断学位：硕士 -> 硕士学位，本科 -> 学士学位，博士 -> 博士学位
            let degreeValue = entry.degree;
            if (entry.degree === '硕士') degreeValue = '硕士';
            else if (entry.degree === '本科') degreeValue = '学士';
            else if (entry.degree === '博士') degreeValue = '博士';
            else if (entry.degree === '大专') degreeValue = '无';
            
            fillBossUISelect(degreeUiSelect, degreeValue, 'degree');
            block.setAttribute('data-jp-edu-degree-fill', 'called');
          }
        }, 800);
      }

      // 查找专业输入框
      const majorInput = findFieldInContainer(block, ['专业', '所学专业'], ['input']);
      if (majorInput && entry.major) {
        setNativeValue(majorInput, entry.major);
        triggerEvents(majorInput);
        highlightField(majorInput, true);
      }

      // 查找起止时间
      const dateValue = entry.edu_duration || entry.graduation;
      fillDateRangeInContainer(block, dateValue);
      
      // 查找在校经历/校园经历 textarea
      const campusTextarea = findFieldInContainer(block, ['在校经历', '校园经历', '社会实践', '校园活动', '在校实践'], ['textarea']);
      if (campusTextarea && entry.campus_activities) {
        setNativeValue(campusTextarea, entry.campus_activities);
        triggerEvents(campusTextarea);
        highlightField(campusTextarea, true);
      }
      
      // 查找主修课程/专业课程 textarea
      const coursesTextarea = findFieldInContainer(block, ['主修课程', '主要课程', '专业课程', '所学课程', '核心课程'], ['textarea']);
      if (coursesTextarea && entry.major_courses) {
        setNativeValue(coursesTextarea, entry.major_courses);
        triggerEvents(coursesTextarea);
        highlightField(coursesTextarea, true);
      }
    } catch (e) {
      console.warn('[JobPilot] fillEducationBlock error:', e);
    }
  }

  /**
   * 填充实习/项目等通用重复区块
   */
  function fillRepeatableSection(data, filledFieldsRef, config) {
    try {
      const entries = extractEntries(data, config.dataPrefix, config.fieldMap);
      if (entries.length === 0) return;

      const blocks = findRepeatableBlocks(config.sectionKeywords, Object.values(config.fields).map(f => f.keywords).flat());
      if (blocks.length === 0) {
        // 没有检测到区块，可能需要先点击"添加"
        console.log(`[JobPilot] ${config.dataPrefix}: 未检测到现有区块，尝试添加`);
      }

      console.log(`[JobPilot] ${config.dataPrefix}: 检测到 ${blocks.length} 个区块，${entries.length} 段数据`);

      // 实习/项目经历页面上也是倒序排列（最新的在最上面），反转填充
      const reversedEntries = [...entries].reverse();

      // 填充已有的空区块
      let filledIdx = 0;
      for (let i = 0; i < blocks.length && filledIdx < reversedEntries.length; i++) {
        if (isBlockEmpty(blocks[i], config.fields)) {
          fillGenericBlock(blocks[i], reversedEntries[filledIdx], config.fields);
          filledIdx++;
        }
      }

      // 剩余数据需要添加新区块
      if (filledIdx < reversedEntries.length) {
        const refBlock = blocks.length > 0 ? blocks[blocks.length - 1] : findSectionContainer(config.sectionKeywords);
        if (refBlock) {
          addAndFillBlocks(refBlock, reversedEntries.slice(filledIdx), config.fields, config);
        }
      }
    } catch (e) {
      console.warn(`[JobPilot] fillRepeatableSection(${config.dataPrefix}) error:`, e);
    }
  }

  /**
   * 在容器内查找包含指定标签文本的表单控件
   */
  function findFieldInContainer(container, labelKeywords, tagFilter) {
    if (!container) return null;
    const allControls = container.querySelectorAll('input, textarea, select');
    let bestMatch = null;
    let bestScore = 0;

    for (const ctrl of allControls) {
      if (ctrl.type === 'hidden' || ctrl.type === 'radio' || ctrl.type === 'checkbox') continue;
      if (!isElementVisible(ctrl)) continue;

      // 获取控件的标签文本
      const label = getLabelText(ctrl);
      const placeholder = (ctrl.getAttribute('placeholder') || '').toLowerCase();
      const name = (ctrl.getAttribute('name') || '').toLowerCase();
      const ariaLabel = (ctrl.getAttribute('aria-label') || '').toLowerCase();
      const text = [label, placeholder, name, ariaLabel].join(' ');

      for (const kw of labelKeywords) {
        if (text.includes(kw)) {
          let score = label && label.includes(kw) ? 100 : 60;
          if (tagFilter) {
            if (tagFilter.includes(ctrl.tagName.toLowerCase())) score += 10;
            if (ctrl.tagName === 'SELECT' && tagFilter.includes('select')) score += 20;
          }
          if (score > bestScore) {
            bestScore = score;
            bestMatch = ctrl;
          }
        }
      }
    }
    return bestMatch;
  }

  /**
   * 查找页面中的重复区块
   * @param {string[]} sectionKeywords - 区块所在区域的关键字（如"教育经历"）
   * @param {string[]} fieldKeywords - 区块内必含字段的关键字
   * @returns {Element[]} 区块元素数组
   */
  function findRepeatableBlocks(sectionKeywords, fieldKeywords) {
    const blocks = [];

    // 查找区域容器
    const sectionContainer = findSectionContainer(sectionKeywords);
    if (!sectionContainer) {
      // 如果找不到区域容器，在全页面查找包含目标字段的重复容器
      const allFormItems = document.querySelectorAll('.form-item, .el-form-item, .ant-form-item, [class*="form-item"], [class*="form-group"], tr, div[class*="item"], .group-part-item-content, [class*="part-item"], [class*="group-item"]');
      return findBlockGroups(allFormItems, fieldKeywords);
    }

    // 在区域容器内查找重复的表单组
    const possibleBlocks = sectionContainer.querySelectorAll(
      '.form-item, .el-form-item, .ant-form-item, [class*="form-item"], [class*="form-group"], ' +
      '[class*="item-wrap"], [class*="block"], [class*="card"], [class*="entry"], [class*="record"], ' +
      'tr, div[class*="item"], li, [class*="edu-item"], [class*="exp-item"], [class*="project-item"], ' +
      '.group-part-item-content, [class*="part-item"], [class*="group-item"], [class*="content-item"]'
    );

    return findBlockGroups(possibleBlocks, fieldKeywords);
  }

  /**
   * 从候选元素中找出包含目标字段的连续区块
   */
  function findBlockGroups(candidates, fieldKeywords) {
    const blocks = [];
    const blocksText = new Set();

    for (const el of candidates) {
      if (!isElementVisible(el)) continue;
      const text = (el.textContent || '').replace(/\s+/g, '').trim();
      if (text.length < 4) continue;

      // 检查是否包含关键字
      let hasKeyword = false;
      for (const kw of fieldKeywords) {
        if (text.includes(kw)) { hasKeyword = true; break; }
      }
      if (!hasKeyword) continue;

      // 包含表单控件
      const controls = el.querySelectorAll('input, textarea, select');
      if (controls.length < 2) continue;

      // 去重：避免父子元素重复
      let isChildOfExisting = false;
      for (const existing of blocks) {
        if (existing.contains(el)) { isChildOfExisting = true; break; }
        if (el.contains(existing)) {
          // 替换更大的容器
          const idx = blocks.indexOf(existing);
          blocks[idx] = el;
          isChildOfExisting = true;
          break;
        }
      }
      if (!isChildOfExisting) blocks.push(el);
    }

    return blocks;
  }

  /**
   * 查找包含指定关键字的区域（section）容器
   */
  function findSectionContainer(keywords) {
    const allElements = document.querySelectorAll('div, section, fieldset, form');
    for (const el of allElements) {
      const text = (el.textContent || '').replace(/\s+/g, '').trim();
      if (text.length > 2000 || text.length < 4) continue;
      for (const kw of keywords) {
        if (text.includes(kw)) {
          // 检查是否是合理的区域容器（含有表单控件）
          if (el.querySelectorAll('input, textarea, select').length >= 2) {
            return el;
          }
        }
      }
    }
    return null;
  }

  /**
   * 判断区块是否为空（未填充）
   */
  function isBlockEmpty(block, fields) {
    const inputs = block.querySelectorAll('input, textarea');
    for (const input of inputs) {
      if (input.type === 'hidden' || input.type === 'radio' || input.type === 'checkbox') continue;
      if (input.value && input.value.trim()) return false;
    }
    const selects = block.querySelectorAll('select');
    for (const sel of selects) {
      if (sel.selectedIndex > 0) return false;
    }
    return true;
  }

  /**
   * 填充通用区块（实习/项目）
   */
  function fillGenericBlock(block, entry, fields) {
    try {
      for (const [fieldKey, fieldConfig] of Object.entries(fields)) {
        const value = entry[fieldKey];
        if (!value) continue;

        if (fieldConfig.type === 'date-range') {
          fillDateRangeInContainer(block, value);
          continue;
        }

        const ctrl = findFieldInContainer(block, fieldConfig.keywords,
          fieldConfig.type === 'select' ? ['select'] :
          fieldConfig.type === 'textarea' ? ['textarea', 'input'] : ['input', 'textarea']);

        if (ctrl) {
          if (fieldConfig.type === 'select' || ctrl.tagName === 'SELECT') {
            fillField(ctrl, value, fieldKey);
          } else {
            setNativeValue(ctrl, value);
            triggerEvents(ctrl);
            highlightField(ctrl, true);
          }
        }
      }
    } catch (e) {
      console.warn('[JobPilot] fillGenericBlock error:', e);
    }
  }

  /**
   * 在容器内填充日期范围（起止时间）
   */
  function fillDateRangeInContainer(block, dateValue) {
    if (!dateValue) return;
    try {
      const str = String(dateValue).trim();
      // 直接提取所有的年-月/年.月/年/月 格式的日期
      // 支持：2020-09、2020.09、2020/09、2020年9月、2020年09月
      const dateRegex = /(\d{4})[.\-\/年]\s*(\d{1,2})(?:月)?/g;
      const dates = [];
      let match;
      while ((match = dateRegex.exec(str)) !== null) {
        const y = match[1];
        const m = match[2].padStart(2, '0');
        dates.push({ year: parseInt(y), month: parseInt(m), dash: `${y}-${m}`, slash: `${y}/${m}` });
      }
      
      // 如果没找到带分隔符的日期，尝试匹配只有年份的（如 "2023"）
      if (dates.length === 0) {
        const yearRegex = /\b(\d{4})\b/g;
        while ((match = yearRegex.exec(str)) !== null) {
          const y = match[1];
          dates.push({ year: parseInt(y), month: 1, dash: `${y}-01`, slash: `${y}/01` });
        }
      }

      if (dates.length === 0) return;

      // 检查是否是Ant Design的日期范围选择器
      const antPickerRange = block.querySelector('.ant-picker-range, [class*="ant-picker-range"]');
      if (antPickerRange && isElementVisible(antPickerRange) && dates.length >= 2) {
        // 使用Ant Design专用的面板点击方式填充
        fillAntdDateRange(antPickerRange, dates[0], dates[1]);
        return;
      }

      // 找日期输入框：优先找日期范围选择器
      let dateInputs = [];
      
      // 策略1: 优先找 date-picker-range-wrapper（包含开始+结束两个input）
      const rangeWrappers = block.querySelectorAll('.date-picker-range-wrapper, [class*="date-picker-range"], [class*="daterange"], [class*="date-range"], .ant-picker-range, [class*="ant-picker-range"]');
      const visibleRanges = Array.from(rangeWrappers).filter(isElementVisible);
      if (visibleRanges.length > 0) {
        for (const wrapper of visibleRanges) {
          const inputs = wrapper.querySelectorAll('input');
          const visibleInputs = Array.from(inputs).filter(isElementVisible);
          if (visibleInputs.length >= 2) {
            dateInputs = visibleInputs.slice(0, 2);
            break;
          }
        }
      }
      
      // 策略2: 找独立的 ui-date-editor（两个一组）
      if (dateInputs.length < 2) {
        const dateEditors = block.querySelectorAll('.ui-date-editor, .date-picker, [class*="date-editor"], [class*="date-picker"], .ant-picker, [class*="ant-picker"]');
        const visibleEditors = Array.from(dateEditors).filter(isElementVisible);
        // 排除已经在 range-wrapper 里的
        const standaloneEditors = visibleEditors.filter(ed => !ed.closest('.date-picker-range-wrapper, [class*="date-picker-range"], .ant-picker-range, [class*="ant-picker-range"]'));
        
        const standaloneInputs = [];
        for (const editor of standaloneEditors) {
          const inputs = editor.querySelectorAll('input');
          const visibleInputs = Array.from(inputs).filter(isElementVisible);
          standaloneInputs.push(...visibleInputs);
        }
        if (standaloneInputs.length >= 2) {
          dateInputs = standaloneInputs.slice(0, 2);
        } else if (standaloneInputs.length === 1 && dateInputs.length === 0) {
          dateInputs = standaloneInputs;
        }
      }
      
      // 策略2: 通过 placeholder 找
      if (dateInputs.length < 2) {
        const placeholderInputs = block.querySelectorAll(
          'input[placeholder*="YYYY"], input[placeholder*="yyyy"], input[placeholder*="年"], ' +
          'input[placeholder*="开始"], input[placeholder*="结束"], input[placeholder*="起始"], input[placeholder*="截止"], ' +
          'input[name*="start"], input[name*="end"], input[placeholder*="MM"], input[placeholder*="月"]'
        );
        const visiblePlaceholder = Array.from(placeholderInputs).filter(isElementVisible);
        // 去重
        for (const inp of visiblePlaceholder) {
          if (!dateInputs.includes(inp)) dateInputs.push(inp);
        }
      }
      
      // 策略3: 找所有 readonly 的 input（可能是日期选择器）
      if (dateInputs.length < 2) {
        const readonlyInputs = block.querySelectorAll('input[readonly]');
        const visibleReadonly = Array.from(readonlyInputs).filter(isElementVisible);
        // 过滤掉明显不是日期的（如下拉选择器）
        const likelyDateInputs = visibleReadonly.filter(inp => {
          const ph = (inp.placeholder || '').toLowerCase();
          return ph.includes('时间') || ph.includes('日期') || ph.includes('年') || ph.includes('月') || ph.includes('开始') || ph.includes('结束');
        });
        for (const inp of likelyDateInputs) {
          if (!dateInputs.includes(inp)) dateInputs.push(inp);
        }
      }

      if (dateInputs.length >= 1 && dates.length >= 1) {
        // 填充第一个日期（开始时间）
        const firstInput = dateInputs[0];
        const firstDate = dates[0];
        
        // 根据现有值的格式选择目标格式
        const formatDate = (input, date) => {
          const currentVal = input.value || '';
          // 如果当前值包含 /，用 / 格式；否则用 - 格式
          if (currentVal.includes('/') || (input.placeholder && input.placeholder.includes('/'))) {
            return date.slash;
          }
          return date.dash;
        };
        
        const setDateInput = (input, date) => {
          const val = formatDate(input, date);
          const wasReadonly = input.readOnly;
          
          // 如果是 readonly，先临时移除
          if (wasReadonly) {
            input.removeAttribute('readonly');
          }
          
          setNativeValue(input, val);
          triggerEvents(input);
          highlightField(input, true);
          
          // 恢复 readonly
          if (wasReadonly) {
            input.setAttribute('readonly', 'readonly');
          }
        };
        
        setDateInput(firstInput, firstDate);
        
        // 如果有第二个日期和第二个输入框，填充结束时间
        if (dates.length >= 2 && dateInputs.length >= 2) {
          setDateInput(dateInputs[1], dates[1]);
        }
      }
    } catch (e) {
      console.warn('[JobPilot] fillDateRangeInContainer error:', e);
    }
  }

  /**
   * 通过面板点击方式填充Ant Design日期范围选择器
   */
  function fillAntdDateRange(pickerEl, startDate, endDate) {
    if (!pickerEl || !startDate || !endDate) return;
    
    const inputs = pickerEl.querySelectorAll('input');
    if (inputs.length < 2) return;
    
    const startInput = inputs[0];
    const endInput = inputs[1];
    
    // 高亮显示
    highlightField(pickerEl, true);
    
    // 工具函数：获取可见的日期面板
    function getVisiblePanels() {
      return Array.from(document.querySelectorAll('.ant-picker-panel')).filter(p => {
        const style = window.getComputedStyle(p);
        return style.display !== 'none' && p.offsetWidth > 0;
      });
    }
    
    // 工具函数：检查是否在年份视图
    function isYearView(panel) {
      const cells = panel.querySelectorAll('.ant-picker-cell');
      for (const cell of cells) {
        const text = cell.textContent?.trim() || '';
        if (/^\d{4}$/.test(text)) return true;
      }
      return false;
    }
    
    // 工具函数：切换到年份视图
    function switchToYearView(panel) {
      if (isYearView(panel)) return true;
      const yearBtn = panel.querySelector('.ant-picker-year-btn');
      if (yearBtn) {
        yearBtn.click();
        return true;
      }
      return false;
    }
    
    // 工具函数：在面板中选择年份（带翻页）
    function selectYearInPanel(panel, targetYear, callback) {
      let attempts = 0;
      const maxAttempts = 15;
      
      function trySelect() {
        attempts++;
        if (attempts > maxAttempts) {
          callback && callback(false);
          return;
        }
        
        const cells = panel.querySelectorAll('.ant-picker-cell');
        let minYear = Infinity;
        let maxYear = -Infinity;
        let found = false;
        
        for (const cell of cells) {
          const text = cell.textContent?.trim() || '';
          const year = parseInt(text);
          if (!isNaN(year) && text.length === 4) {
            minYear = Math.min(minYear, year);
            maxYear = Math.max(maxYear, year);
            if (year === targetYear) {
              cell.click();
              found = true;
              break;
            }
          }
        }
        
        if (found) {
          setTimeout(() => callback && callback(true), 200);
          return;
        }
        
        // 需要翻页
        let btnToClick = null;
        if (targetYear > maxYear) {
          btnToClick = panel.querySelector('.ant-picker-header-super-next-btn');
        } else if (targetYear < minYear) {
          btnToClick = panel.querySelector('.ant-picker-header-super-prev-btn');
        }
        
        if (btnToClick) {
          btnToClick.click();
          setTimeout(trySelect, 200);
        } else {
          callback && callback(false);
        }
      }
      
      // 先确保在年份视图
      if (!isYearView(panel)) {
        switchToYearView(panel);
        setTimeout(trySelect, 200);
      } else {
        trySelect();
      }
    }
    
    // 工具函数：在面板中选择月份
    function selectMonthInPanel(panel, targetMonth, callback) {
      const cells = panel.querySelectorAll('.ant-picker-cell');
      for (const cell of cells) {
        const text = cell.textContent?.trim() || '';
        const month = parseInt(text);
        if (month === targetMonth) {
          cell.click();
          setTimeout(() => callback && callback(true), 200);
          return;
        }
      }
      callback && callback(false);
    }
    
    // 选择日期（年+月）
    function selectDateInPanel(panel, year, month, callback) {
      // 先选年份
      selectYearInPanel(panel, year, function(yearOk) {
        if (!yearOk) {
          callback && callback(false);
          return;
        }
        // 再选月份
        selectMonthInPanel(panel, month, function(monthOk) {
          callback && callback(monthOk);
        });
      });
    }
    
    // 主流程
    function startFill() {
      // 点击开始时间输入框打开面板
      startInput.click();
      startInput.focus();
      
      setTimeout(() => {
        let panels = getVisiblePanels();
        if (panels.length === 0) {
          console.warn('[JobPilot] 未找到日期面板');
          return;
        }
        
        // 选择开始日期（用第一个面板）
        const startPanel = panels[0];
        selectDateInPanel(startPanel, startDate.year, startDate.month, function(startOk) {
          if (!startOk) {
            console.warn('[JobPilot] 无法选择开始日期');
            return;
          }
          
          setTimeout(() => {
            // 开始日期选好后，选择结束日期
            panels = getVisiblePanels();
            let endPanel = null;
            
            // 优先使用第二个面板（如果存在）
            if (panels.length >= 2) {
              endPanel = panels[panels.length - 1];
            } else if (panels.length === 1) {
              // 只有一个面板，尝试点击结束时间输入框
              endInput.click();
              endInput.focus();
              setTimeout(() => {
                panels = getVisiblePanels();
                if (panels.length > 0) {
                  endPanel = panels[panels.length - 1];
                  doSelectEndDate(endPanel);
                }
              }, 300);
              return;
            }
            
            if (endPanel) {
              doSelectEndDate(endPanel);
            }
          }, 300);
        });
      }, 300);
      
      function doSelectEndDate(panel) {
        selectDateInPanel(panel, endDate.year, endDate.month, function(endOk) {
          if (endOk) {
            console.log('[JobPilot] Ant Design日期范围填充完成');
          } else {
            console.warn('[JobPilot] 无法选择结束日期');
          }
        });
      }
    }
    
    // 开始执行
    setTimeout(startFill, 100);
  }

  /**
   * 点击"+添加"按钮并填充新区块
   */
  function addAndFillBlocks(refBlock, entries, fieldConfigs, sectionConfig) {
    const addBtn = findAddButton(refBlock, sectionConfig);
    if (!addBtn) {
      console.log('[JobPilot] 未找到添加按钮');
      return;
    }

    let delay = 200;
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      setTimeout(() => {
        try {
          // 点击添加按钮
          addBtn.click();
          console.log(`[JobPilot] 点击添加按钮，等待新区块 #${i + 1}`);

          // 等待 DOM 更新后填充
          setTimeout(() => {
            try {
              let newBlocks;
              if (sectionConfig) {
                newBlocks = findRepeatableBlocks(sectionConfig.sectionKeywords, Object.values(sectionConfig.fields).map(f => f.keywords).flat());
              } else {
                newBlocks = findRepeatableBlocks(['教育经历', '教育背景'], ['学校名称', '学校', '学历']);
              }
              // 找最后一个空区块
              const emptyBlock = newBlocks.find(b => isBlockEmpty(b, fieldConfigs)) || newBlocks[newBlocks.length - 1];
              if (emptyBlock) {
                if (sectionConfig) {
                  fillGenericBlock(emptyBlock, entry, fieldConfigs);
                } else {
                  fillEducationBlock(emptyBlock, entry);
                }
              }
            } catch (e) {
              console.warn('[JobPilot] 填充新区块 error:', e);
            }
          }, 400);
        } catch (e) {
          console.warn('[JobPilot] addAndFillBlocks error:', e);
        }
      }, delay);
      delay += 600;
    }
  }

  /**
   * 查找"+添加"按钮
   */
  function findAddButton(refBlock, sectionConfig) {
    // 在参考区块的父容器中查找添加按钮
    let container = refBlock.parentElement;
    for (let depth = 0; depth < 5 && container; depth++) {
      // 查找"添加"按钮
      const buttons = container.querySelectorAll('button, a, span, div');
      for (const btn of buttons) {
        if (!isElementVisible(btn)) continue;
        const text = (btn.textContent || '').replace(/\s+/g, '').trim();
        if (text.includes('添加') || text.includes('+') || text.includes('新增') || text.includes('add')) {
          // 排除删除按钮和其他区块的按钮
          if (text.includes('删除') || text.includes('移除') || text.includes('删')) continue;
          if (sectionConfig && sectionConfig.addBtnExclude) {
            let excluded = false;
            for (const ex of sectionConfig.addBtnExclude) {
              if (text.includes(ex)) { excluded = true; break; }
            }
            if (excluded) continue;
          }
          // 优先选择包含"+"的按钮
          if (text.length <= 10 && (text.startsWith('+') || text.includes('添加') || text.includes('新增'))) {
            return btn;
          }
        }
      }
      container = container.parentElement;
    }
    return null;
  }

  /**
   * 在页面右上角显示浮动提示
   */
  function showFloatingTip(message) {
    try {
      const tip = document.createElement('div');
      tip.textContent = message;
      tip.style.cssText = `
        position: fixed; top: 16px; right: 16px; z-index: 999999;
        background: #6366f1; color: #fff; padding: 10px 16px;
        border-radius: 6px; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        opacity: 0; transition: opacity 0.3s ease;
      `;
      document.body.appendChild(tip);
      requestAnimationFrame(() => { tip.style.opacity = '1'; });
      setTimeout(() => {
        tip.style.opacity = '0';
        setTimeout(() => tip.remove(), 300);
      }, 2500);
    } catch (e) {}
  }

  function scheduleDelayedFill(data, filledFieldsRef, delay) {
    setTimeout(() => {
      try {
        const { detected } = detectAllFields();
        let filled = 0;
        for (const [field, element] of Object.entries(detected)) {
          if (field.startsWith('_')) continue;
          if (filledFieldsRef.has(field)) continue;
          const value = data[field];
          if (!value) continue;
          const ok = fillField(element, value, field);
          if (ok) {
            filled++;
            highlightField(getHighlightTarget(element), true);
            filledFieldsRef.add(field);
            console.log('[JobPilot] 延迟填充成功:', field);
          }
        }
        if (detected._birth_year && !filledFieldsRef.has('_birth')) {
          const ok = fillSplitDate(detected, data);
          if (ok) { filled++; filledFieldsRef.add('_birth'); }
        }
        if (filled > 0) {
          fillIframes(data);
        }
      } catch (e) {
        console.warn('[JobPilot] 延迟填充出错:', e.message);
      }
    }, delay);
  }

  function fillIframes(incomingData) {
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (!iframeDoc) continue;
        const iframeInputs = iframeDoc.querySelectorAll('input:not([type="hidden"]), textarea, select');
        let iframeFilled = 0;
        for (const input of iframeInputs) {
          const labelText = getIframeLabelText(iframeDoc, input);
          if (!labelText) continue;
          for (const [field, config] of Object.entries(FIELD_MAPPING)) {
            if (isExcluded(labelText, config.excludeKeywords)) continue;
            if (!matchesKeywords(labelText, config.keywords)) continue;
            const value = incomingData ? incomingData[field] : resumeData[field];
            if (value) {
              const tag = input.tagName.toLowerCase();
              if (tag === 'select') {
                if (fillSelectIframe(iframeDoc, input, value, field)) iframeFilled++;
              } else if (tag === 'input' || tag === 'textarea') {
                input.value = value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                iframeFilled++;
              }
              break;
            }
          }
        }
        if (iframeFilled > 0) {
          console.log('[JobPilot] iframe中填充了', iframeFilled, '个字段');
        }
      } catch (e) {
      }
    }
  }

  function getIframeLabelText(doc, element) {
    const forId = element.id;
    if (forId) {
      const label = doc.querySelector(`label[for="${forId}"]`);
      if (label) return label.textContent.trim();
    }
    const parent = element.parentElement;
    if (parent) {
      const label = parent.querySelector('label');
      if (label) return label.textContent.trim();
    }
    return element.getAttribute('placeholder') || '';
  }

  function fillSelectIframe(doc, select, value, fieldName) {
    return fillSelect(select, value, fieldName);
  }

  // ============================================================
  // 六、UI注入：浮动操作面板
  // ============================================================

  function injectControlPanel() {
    if (document.getElementById('jobpilot-panel')) return;
    if (!document.body) return;

    const floatIconUrl = chrome.runtime.getURL('assets/icons/float-icon.png');

    const panel = document.createElement('div');
    panel.id = 'jobpilot-panel';
    panel.innerHTML = `
      <style>
        @keyframes jp-pulse{0%,100%{box-shadow:0 4px 16px rgba(255,140,66,0.45)}50%{box-shadow:0 4px 28px rgba(255,140,66,0.7)}}
        @keyframes jp-slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        #jobpilot-panel{position:fixed;bottom:24px;right:24px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif}
        .jp-float-btn{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#ffa07a,#ff8c42);border:none;color:white;font-size:22px;cursor:grab;box-shadow:0 4px 16px rgba(255,140,66,0.45);display:flex;align-items:center;justify-content:center;transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s,opacity .2s;animation:jp-pulse 2.5s ease-in-out infinite;overflow:hidden;padding:0;touch-action:none;user-select:none}
        .jp-float-btn:hover{transform:scale(1.12);box-shadow:0 6px 28px rgba(255,140,66,.6);animation:none}
        .jp-float-btn:active{transform:scale(.95)}
        .jp-float-btn.active{transform:rotate(45deg) scale(1.05);animation:none}
        .jp-float-btn.dragging{transform:scale(1.18);opacity:.85;cursor:grabbing;animation:none}
        .jp-float-btn img{width:42px;height:42px;border-radius:50%;object-fit:cover;pointer-events:none;-webkit-user-drag:none}
        .jp-menu{display:none;position:absolute;background:white;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.15),0 0 0 1px rgba(0,0,0,.04);padding:6px;min-width:200px;animation:jp-slideUp .25s ease-out}
        .jp-menu.show{display:block}
        .jp-menu-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border:none;background:none;width:100%;text-align:left;font-size:13px;color:#1e293b;font-weight:500;cursor:pointer;border-radius:10px;transition:all .18s}
        .jp-menu-item:hover{background:#fff1e6;color:#ff8c42;transform:translateX(2px)}
        .jp-menu-item .icon{font-size:16px}
        .jp-menu-divider{height:1px;background:#f1f5f9;margin:4px 8px}
        .jp-toast{position:fixed;top:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:white;padding:10px 24px;border-radius:10px;font-size:13px;font-weight:500;z-index:2147483647;opacity:0;transition:all .35s cubic-bezier(.34,1.56,.64,1);pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.18)}
        .jp-toast.show{opacity:1;transform:translateX(-50%) translateY(-4px)}
        .jp-toast.success{background:#10b981}.jp-toast.warning{background:#f59e0b;color:#1e293b}.jp-toast.error{background:#ef4444}
      </style>
      <div class="jp-menu" id="jp-menu">
        <button class="jp-menu-item" id="jp-fill-form"><span class="icon">📝</span> 一键填充表单</button>
        <button class="jp-menu-item" id="jp-fill-questions"><span class="icon">💬</span> AI回答开放问题</button>
        <button class="jp-menu-item" id="jp-open-dashboard"><span class="icon">📊</span> 打开投递看板</button>
      </div>
      <button class="jp-float-btn" id="jp-float-btn" title="橙猫一键填写表单（可拖动）" type="button">
        <img src="${floatIconUrl}" alt="橙猫一键填写表单">
      </button>
    `;

    const toast = document.createElement('div');
    toast.id = 'jp-toast';
    toast.className = 'jp-toast';
    document.body.appendChild(toast);
    document.body.appendChild(panel);

    const floatBtn = document.getElementById('jp-float-btn');
    const menu = document.getElementById('jp-menu');

    // ===== 拖曳逻辑（pointer 事件，兼容鼠标/触摸） =====
    const DRAG_THRESHOLD = 5;
    const EDGE_SNAP = 40;
    const STORAGE_KEY_POS = 'floatBtnPos';

    let isPointerDown = false;
    let hasMoved = false;
    let startX = 0, startY = 0;
    let btnStartX = 0, btnStartY = 0;

    function applyPos(pos) {
      if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
        panel.style.bottom = '24px';
        panel.style.right = '24px';
        panel.style.top = 'auto';
        panel.style.left = 'auto';
        return;
      }
      const btnW = 52, btnH = 52;
      const x = Math.max(8, Math.min(window.innerWidth - btnW - 8, pos.x));
      const y = Math.max(8, Math.min(window.innerHeight - btnH - 8, pos.y));
      panel.style.bottom = 'auto';
      panel.style.right = 'auto';
      panel.style.top = `${y}px`;
      panel.style.left = `${x}px`;
    }

    function positionMenu() {
      const rect = floatBtn.getBoundingClientRect();
      const menuW = 220;
      const menuH = 200;
      if (rect.top < menuH + 20) {
        menu.style.top = `${rect.bottom + 8}px`;
        menu.style.bottom = 'auto';
      } else {
        menu.style.bottom = `${window.innerHeight - rect.top + 8}px`;
        menu.style.top = 'auto';
      }
      if (rect.left < menuW / 2) {
        menu.style.left = `${rect.left}px`;
        menu.style.right = 'auto';
      } else {
        menu.style.right = `${window.innerWidth - rect.right}px`;
        menu.style.left = 'auto';
      }
    }

    // 读取记忆位置
    try {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([STORAGE_KEY_POS], (result) => {
          applyPos(result && result[STORAGE_KEY_POS]);
        });
      }
    } catch (e) { /* ignore */ }

    floatBtn.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      isPointerDown = true;
      hasMoved = false;
      startX = e.clientX;
      startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      btnStartX = rect.left;
      btnStartY = rect.top;
      try { floatBtn.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    });

    floatBtn.addEventListener('pointermove', (e) => {
      if (!isPointerDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!hasMoved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      if (!hasMoved) {
        hasMoved = true;
        floatBtn.classList.add('dragging');
        const rect = panel.getBoundingClientRect();
        btnStartX = rect.left;
        btnStartY = rect.top;
        panel.style.bottom = 'auto';
        panel.style.right = 'auto';
        panel.style.top = `${rect.top}px`;
        panel.style.left = `${rect.left}px`;
      }
      const btnW = 52, btnH = 52;
      let newX = btnStartX + dx;
      let newY = btnStartY + dy;
      newX = Math.max(8, Math.min(window.innerWidth - btnW - 8, newX));
      newY = Math.max(8, Math.min(window.innerHeight - btnH - 8, newY));
      panel.style.left = `${newX}px`;
      panel.style.top = `${newY}px`;
    });

    function endDrag(e) {
      if (!isPointerDown) return;
      isPointerDown = false;
      try { floatBtn.releasePointerCapture(e.pointerId); } catch (_) {}

      if (!hasMoved) {
        floatBtn.classList.remove('dragging');
        const isOpen = menu.classList.toggle('show');
        floatBtn.classList.toggle('active', isOpen);
        if (isOpen) positionMenu();
        return;
      }

      // 边缘吸附
      const rect = panel.getBoundingClientRect();
      const btnW = 52, btnH = 52;
      const cx = rect.left + btnW / 2;
      const cy = rect.top + btnH / 2;
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      let snapX = rect.left;
      let snapY = rect.top;
      if (cx < EDGE_SNAP) snapX = 8;
      else if (cx > winW - EDGE_SNAP) snapX = winW - btnW - 8;
      if (cy < EDGE_SNAP) snapY = 8;
      else if (cy > winH - EDGE_SNAP) snapY = winH - btnH - 8;

      panel.style.transition = 'left .25s ease, top .25s ease';
      panel.style.left = `${snapX}px`;
      panel.style.top = `${snapY}px`;
      setTimeout(() => { panel.style.transition = ''; }, 280);

      floatBtn.classList.remove('dragging');

      try {
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ [STORAGE_KEY_POS]: { x: snapX, y: snapY } });
        }
      } catch (e) { /* ignore */ }
    }

    floatBtn.addEventListener('pointerup', endDrag);
    floatBtn.addEventListener('pointercancel', (e) => {
      isPointerDown = false;
      hasMoved = false;
      floatBtn.classList.remove('dragging');
    });

    // 窗口尺寸变化时，确保按钮仍在视口内
    window.addEventListener('resize', () => {
      const rect = panel.getBoundingClientRect();
      const btnW = 52, btnH = 52;
      let x = Math.min(rect.left, window.innerWidth - btnW - 8);
      let y = Math.min(rect.top, window.innerHeight - btnH - 8);
      x = Math.max(8, x);
      y = Math.max(8, y);
      if (panel.style.top || panel.style.left) {
        panel.style.top = `${y}px`;
        panel.style.left = `${x}px`;
      }
    });

    document.getElementById('jp-fill-form').addEventListener('click', async () => {
      await ensureResumeData();
      const result = autoFillAll();
      try { window.__jpFillResult = result; } catch(e) {}
      showToast(`已填充 ${result.filled}/${result.total} 个字段${result.failed > 0 ? `，${result.failed}个需手动修正` : ''}`, result.failed > 0 ? 'warning' : 'success');
      menu.classList.remove('show');
      floatBtn.classList.remove('active');
    });

    document.getElementById('jp-fill-questions').addEventListener('click', () => {
      const result = fillOpenQuestions();
      showToast(`已AI回答 ${result.filled}/${result.total} 个开放问题`, 'success');
      menu.classList.remove('show');
      floatBtn.classList.remove('active');
    });

    document.getElementById('jp-open-dashboard').addEventListener('click', () => {
      try {
        window.open(chrome.runtime.getURL('web-dashboard/index.html'), '_blank');
      } catch (e) {
        showToast('无法打开看板', 'error');
      }
      menu.classList.remove('show');
      floatBtn.classList.remove('active');
    });

    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && menu.classList.contains('show')) {
        menu.classList.remove('show');
        floatBtn.classList.remove('active');
      }
    });
  }

  function showToast(message, type = 'success') {
    const toast = document.getElementById('jp-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `jp-toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // ============================================================
  // 七、开放问题
  // ============================================================

  function detectOpenQuestions() {
    const questions = [];
    const openPatterns = ['为什么选择', '为什么想加入', '为什么适合', '为什么应聘', '自我评价', '自我介绍', '个人优势', '职业规划', 'why', '申请原因', '求职动机', '你的优势'];
    const textareas = document.querySelectorAll('textarea');
    for (const textarea of textareas) {
      const label = textarea.closest('.form-item, .el-form-item, .form-group, .field, tr, div[class*="item"]');
      if (label) {
        const labelText = label.textContent.trim().toLowerCase();
        for (const pattern of openPatterns) {
          if (labelText.includes(pattern.toLowerCase())) {
            questions.push({ element: textarea, question: labelText.substring(0, 100), type: pattern });
            break;
          }
        }
      }
      const placeholder = (textarea.getAttribute('placeholder') || '').toLowerCase();
      for (const pattern of openPatterns) {
        if (placeholder.includes(pattern.toLowerCase())) {
          questions.push({ element: textarea, question: placeholder.substring(0, 100), type: pattern });
          break;
        }
      }
    }
    return questions;
  }

  function fillOpenQuestions() {
    const questions = detectOpenQuestions();
    let filledCount = 0;
    for (const q of questions) {
      const answer = resumeData.self_eval || '本人踏实认真，学习能力强，具备良好的团队协作精神。';
      setNativeValue(q.element, answer);
      triggerEvents(q.element);
      highlightField(q.element, true);
      filledCount++;
    }
    return { total: questions.length, filled: filledCount };
  }

  // ============================================================
  // 八、消息监听
  // ============================================================

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'fillForm':
        ensureResumeData(request.data).then(() => {
          // BOSS直聘页面使用专用填充器
          if (window.isBossZhipinPage && window.isBossZhipinPage() && window.BossFormFiller && window.BossFormFiller.fill) {
            // 转换数据格式：扁平结构 -> BossFormFiller 需要的结构
            const bossData = {
              name: resumeData.name,
              gender: resumeData.gender,
              birthDate: resumeData.birth || resumeData.birthday || resumeData.birthDate,
              phone: resumeData.phone,
              email: resumeData.email,
              idCard: resumeData.id_number || resumeData.idCard || resumeData.id_number,
              ethnicity: resumeData.ethnicity,
              politicalStatus: resumeData.political_status,
              nativePlace: resumeData.native_place || resumeData.nativePlace,
              hukouType: resumeData.hukou_type || resumeData.hukouType,
              edu1: {
                startDate: resumeData.edu1_start_date || resumeData.start_date || '2018/09/01',
                endDate: resumeData.edu1_end_date || resumeData.graduation || resumeData.end_date || '2022/06/30',
                degree: resumeData.degree,
                school: resumeData.school,
                major: resumeData.major,
                degreeType: resumeData.degree_type || resumeData.degreeType || '工学',
                hasFailed: resumeData.has_failed_course || resumeData.hasFailed || '否',
                rank: resumeData.class_rank || resumeData.classRank || 'Top 20%~50%'
              },
              edu2: {
                startDate: resumeData.edu2_start_date || '2022/09/01',
                endDate: resumeData.edu2_end_date || '2025/06/30',
                degree: resumeData.edu2_degree || '硕士研究生',
                school: resumeData.edu2_school || '',
                major: resumeData.edu2_major || '',
                degreeType: resumeData.edu2_degree_type || '工学',
                hasFailed: resumeData.edu2_has_failed || '否',
                rank: resumeData.edu2_rank || 'Top 20%~50%'
              },
              englishLevel: resumeData.english_level || resumeData.englishLevel,
              languageLevel: resumeData.language_level || resumeData.languageLevel,
              englishScore: resumeData.english_score || resumeData.englishScore,
              otherLanguage: resumeData.other_language || resumeData.otherLanguage,
              otherScore: resumeData.other_score || resumeData.otherScore
            };
            window.BossFormFiller.fill(bossData).then(result => {
              sendResponse(result);
            }).catch(err => {
              sendResponse({ success: false, error: err.message });
            });
          } else {
            const result = autoFillAll(request.data);
            sendResponse(result);
          }
        });
        return true;
      case 'fillQuestions':
        ensureResumeData(request.data).then(() => {
          const result = fillOpenQuestions();
          sendResponse(result);
        });
        return true;
      case 'detectFields':
        const fields = detectAllFields();
        sendResponse({ count: Object.keys(fields).filter(k => !k.startsWith('_')).length, fields: Object.keys(fields).filter(k => !k.startsWith('_')) });
        break;
      case 'ping':
        sendResponse({ pong: true });
        break;
      default:
        sendResponse({ error: 'Unknown action' });
    }
  });

  // ============================================================
  // 九、初始化
  // ============================================================

  function init() {
    ensureResumeData();

    const hasForm = document.querySelector('form, input:not([type="hidden"]), textarea, select, [role="combobox"], [class*="select"]:not(input):not(select):not(button):not(a)');
    if (hasForm) {
      injectControlPanel();
      console.log('[JobPilot] 橙猫一键填写表单已就绪');
    } else {
      const observer = new MutationObserver(() => {
        if (document.querySelector('form, input:not([type="hidden"]), textarea, select, [role="combobox"], [class*="select"]:not(input):not(select):not(button):not(a)')) {
          injectControlPanel();
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 15000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
