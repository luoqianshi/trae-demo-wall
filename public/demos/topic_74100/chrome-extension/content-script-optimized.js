/**
 * AI全流程求职智能管家 - Chrome Extension Content Script (优化版)
 * 功能：智能识别招聘页面投递表单，自动填充简历信息
 * 版本：v2.1 | BOSS直聘志愿者页面专项优化
 */

(function () {
  'use strict';

  if (window.__jobpilotInjected) return;
  window.__jobpilotInjected = true;

  const DEFAULT_RESUME = {};
  let resumeData = { ...DEFAULT_RESUME };
  let customSchema = { sections: [], fields: {} };

  async function ensureResumeData(incomingData) {
    if (incomingData && Object.keys(incomingData).length > 0) {
      resumeData = { ...resumeData, ...incomingData };
      try { await loadCustomSchema(); } catch (e) {}
      return resumeData;
    }
    try {
      const profileData = await chrome.runtime.sendMessage({ action: 'getProfileFillData' });
      if (profileData && Object.keys(profileData).length > 0) {
        resumeData = { ...DEFAULT_RESUME, ...profileData };
      }
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
        if (ph && /请选择|选择$|选择|下拉|picker|select/i.test(ph)) {
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

  // ========== BOSS直聘专项优化开始 ==========

  function isBossZhipinPage() {
    return window.location.hostname.includes('zhipin.com');
  }

  function findBossUiSelect(element) {
    if (!element) return null;
    let el = element;
    for (let i = 0; i < 8 && el; i++) {
      const cls = (el.className || '').toString();
      if (/ui-select/i.test(cls)) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  function openBossUiSelect(selectElement) {
    const trigger = selectElement.querySelector('.ui-select-trigger, .ui-select-input, input[readonly]');
    if (trigger) {
      trigger.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(() => {
        trigger.click();
        trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: 100, clientY: 100 }));
        trigger.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0, clientX: 100, clientY: 100 }));
        trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, clientX: 100, clientY: 100 }));
      }, 50);
      return true;
    }
    selectElement.click();
    return true;
  }

  function getBossSelectOptions() {
    const dropdowns = document.querySelectorAll('.ui-select-dropdown, .ui-select-dropdown-list, [class*="dropdown"]');
    const options = [];
    for (const dropdown of dropdowns) {
      if (!isElementVisible(dropdown)) continue;
      const opts = dropdown.querySelectorAll('li, .ui-select-item, [class*="option"], [role="option"]');
      for (const opt of opts) {
        if (isElementVisible(opt)) {
          const text = (opt.textContent || '').trim();
          if (text && text.length <= 50 && !/^(请选择|--|全部|不限)$/.test(text)) {
            options.push({ element: opt, text: text });
          }
        }
      }
    }
    return options;
  }

  function clickBossOption(optionElement) {
    optionElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(() => {
      optionElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
      optionElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: 100, clientY: 100 }));
      optionElement.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0, clientX: 100, clientY: 100 }));
      optionElement.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, clientX: 100, clientY: 100 }));
      if (optionElement.click) optionElement.click();
      optionElement.dispatchEvent(new Event('change', { bubbles: true }));
    }, 100);
  }

  function fillBossUiSelect(element, value, fieldName) {
    const strValue = String(value).trim();
    if (!strValue) return false;

    const bossSelect = findBossUiSelect(element);
    if (!bossSelect) return false;

    openBossUiSelect(bossSelect);

    const tryMatch = () => {
      const options = getBossSelectOptions();
      if (options.length === 0) return false;

      let bestMatch = null;
      let bestScore = 0;

      for (const opt of options) {
        const optText = opt.text;
        let score = 0;
        
        if (optText === strValue) score = 100;
        else if (optText.includes(strValue) && strValue.length >= 1) score = 80;
        else if (strValue.includes(optText) && optText.length >= 2) score = 60;

        const valueMap = FIELD_VALUE_MAP[fieldName];
        if (valueMap && valueMap[strValue]) {
          for (const alias of valueMap[strValue]) {
            if (optText === alias) score = Math.max(score, 95);
            else if (optText.includes(alias) && alias.length >= 2) score = Math.max(score, 85);
          }
        }

        if (fieldName === 'ethnicity') {
          if (optText === strValue + '族' || strValue === optText + '族') score = Math.max(score, 90);
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = opt.element;
        }
      }

      if (bestMatch && bestScore >= 30) {
        clickBossOption(bestMatch);
        return true;
      }
      return false;
    };

    if (tryMatch()) return true;

    for (const delay of [200, 500, 800, 1200, 1500]) {
      setTimeout(() => {
        try { tryMatch(); } catch(e) {}
      }, delay);
    }
    return true;
  }

  function fillBossDatePicker(element, value, fieldName) {
    const strValue = String(value).trim();
    const dateMatch = strValue.match(/(\d{4})[\.\-\/年](\d{1,2})[\.\-\/月](\d{1,2})?/);
    if (!dateMatch) return false;

    const year = dateMatch[1];
    const month = dateMatch[2].padStart(2, '0');
    const day = dateMatch[3] ? dateMatch[3].padStart(2, '0') : '01';

    let picker = element;
    if (!picker.className.toString().includes('ui-date-picker')) {
      picker = element.closest('.ui-date-picker');
    }
    if (!picker) return false;

    const trigger = picker.querySelector('.ui-date-picker-input, input');
    if (!trigger) return false;

    const clickEl = (el) => {
      setTimeout(() => {
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 }));
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
        if (el.click) el.click();
      }, 100);
    };

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
            if ((y.textContent || '').includes(year)) {
              clickEl(y);
              break;
            }
          }
        }, 200);
      }

      setTimeout(() => {
        const monthLabel = panel.querySelectorAll('.ui-date-picker-header-label')[1];
        if (monthLabel) {
          clickEl(monthLabel);
          setTimeout(() => {
            const months = panel.querySelectorAll('.ui-date-picker-month-btn, .ui-date-picker-month-label');
            for (const m of months) {
              const text = m.textContent || '';
              if (text.includes(month.replace(/^0/, '')) || text.includes(month)) {
                clickEl(m);
                break;
              }
            }
          }, 200);
        }

        setTimeout(() => {
          const dayCells = panel.querySelectorAll('.ui-date-picker-cell, .ui-date-picker-content td');
          for (const cell of dayCells) {
            const text = cell.textContent.trim();
            if (text === day.replace(/^0/, '') || text === day) {
              clickEl(cell);
              break;
            }
          }
        }, 400);
      }, 400);
    }, 300);

    return true;
  }

  // ========== BOSS直聘专项优化结束 ==========

  function fillCustomSelect(element, value, fieldName) {
    const strValue = String(value).trim();
    if (!strValue) return false;

    if (isBossZhipinPage()) {
      const bossSelect = findBossUiSelect(element);
      if (bossSelect) {
        return fillBossUiSelect(element, value, fieldName);
      }
    }

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
      setTimeout(() => {
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
      }, 100);
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
        '.ui-select-dropdown', '.ui-picker-panel', '.ui-date-picker',
        '[class*="ui-select-dropdown"]', '[class*="ui-picker-panel"]',
        '[class*="ui-date-picker"]', '.ui-select-dropdown-transfer',
        '.ui-select-item',
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

    const isAntSelect = (() => {
      let el = element;
      for (let i = 0; i < 5 && el; i++) {
        if ((el.className || '').toString().includes('ant-select')) return true;
        el = el.parentElement;
      }
      return false;
    })();

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

    if (isBossZhipinPage()) {
      const hasDatePicker = (element.className || '').toString().includes('date-picker') ||
                           (element.parentElement && element.parentElement.className.toString().includes('date-picker'));
      if (hasDatePicker) {
        return fillBossDatePicker(element, value, fieldName);
      }
    }

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

  const FIELD_MAPPING = {
    name: {
      keywords: ['姓名', '真实姓名', '您的姓名', '求职者姓名'],
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
        '[data-field="gender"] select'
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
        '[data-field="birth"] input'
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
        'input[placeholder*="民族" i]'
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
        '[data-field="weight"] input, [data-field="weight"] select'
      ]
    },
    marital_status: {
      keywords: ['婚姻状况', '婚姻状态', '婚否', '已婚', '未婚', 'marital'],
      excludeKeywords: [],
      selectors: [
        'select[placeholder*="婚姻" i]',
        'select[name*="marital" i]',
        'select[name*="marriage" i]',
        '[data-field="marital_status"] select'
      ]
    },
    id_type: {
      keywords: ['证件类型', '证件', '身份', 'id_type'],
      excludeKeywords: [],
      selectors: [
        'select[placeholder*="证件" i]',
        'select[name*="idType" i]',
        'select[name*="id_type" i]',
        '[data-field="id_type"] select'
      ]
    },
    id_number: {
      keywords: ['证件号码', '身份证号', '身份证号码', '身份证', 'id_number', '身份证号'],
      excludeKeywords: ['学号', '工号', '护照号'],
      selectors: [
        'input[placeholder*="证件号码" i]',
        'input[placeholder*="身份证" i]',
        'input[name*="idCard" i]',
        'input[name*="idNumber" i]',
        '[data-field="id_number"] input'
      ]
    },
    political_status: {
      keywords: ['政治面貌', '政治面目', '政治', '党员', '团员'],
      excludeKeywords: [],
      selectors: [
        'select[placeholder*="政治" i]',
        'select[name*="political" i]',
        '[data-field="political_status"] select'
      ]
    },
    hukou_location: {
      keywords: ['户口所在地', '户口', '户籍', '籍贯'],
      excludeKeywords: ['现居住', '现住址', '家庭地址'],
      selectors: [
        'select[placeholder*="户口" i]',
        'select[placeholder*="户籍" i]',
        'select[name*="hukou" i]',
        '[data-field="hukou_location"] select'
      ]
    },
    native_place: {
      keywords: ['籍贯', '原籍', '老家', '出生地'],
      excludeKeywords: ['现居住', '户口', '户籍'],
      selectors: [
        'select[placeholder*="籍贯" i]',
        'select[name*="native" i]',
        '[data-field="native_place"] select'
      ]
    },
    current_residence: {
      keywords: ['现居住地', '现住址', '居住地', '居住地址', '现住地'],
      excludeKeywords: ['户口', '户籍', '籍贯', '通讯地址'],
      selectors: [
        'input[placeholder*="现居住" i]',
        'input[placeholder*="住址" i]',
        'select[name*="residence" i]',
        '[data-field="current_residence"] input, [data-field="current_residence"] select'
      ]
    },
    mailing_address: {
      keywords: ['通讯地址', '邮寄地址', '联系地址', '收件地址'],
      excludeKeywords: ['现居住', '户口', '籍贯'],
      selectors: [
        'input[placeholder*="通讯地址" i]',
        'input[placeholder*="邮寄" i]',
        'textarea[placeholder*="地址" i]',
        '[data-field="mailing_address"] input, [data-field="mailing_address"] textarea'
      ]
    },
    target_city: {
      keywords: ['期望工作地', '期望工作地点', '目标城市', '意向城市', '工作城市'],
      excludeKeywords: ['户口', '户籍', '居住'],
      selectors: [
        'select[placeholder*="工作地" i]',
        'select[placeholder*="城市" i]',
        'select[name*="city" i]',
        'select[name*="target" i]',
        '[data-field="target_city"] select'
      ]
    },
    school: {
      keywords: ['学校', '院校', '毕业院校', '大学', '学院'],
      excludeKeywords: ['工作单位', '公司', '培训机构'],
      selectors: [
        'input[placeholder*="学校" i]',
        'input[name*="school" i]',
        'select[name*="school" i]',
        '[data-field="school"] input, [data-field="school"] select'
      ]
    },
    college: {
      keywords: ['学院', '系别', '学部', '院系'],
      excludeKeywords: ['学校', '专业'],
      selectors: [
        'input[placeholder*="学院" i]',
        'select[name*="college" i]',
        '[data-field="college"] input, [data-field="college"] select'
      ]
    },
    department: {
      keywords: ['系', '系别', '部门'],
      excludeKeywords: ['公司部门'],
      selectors: [
        'input[placeholder*="系" i]',
        'select[name*="department" i]',
        '[data-field="department"] input, [data-field="department"] select'
      ]
    },
    major: {
      keywords: ['专业', '所学专业', '主修专业'],
      excludeKeywords: ['工作', '技能'],
      selectors: [
        'input[placeholder*="专业" i]',
        'select[name*="major" i]',
        '[data-field="major"] input, [data-field="major"] select'
      ]
    },
    degree: {
      keywords: ['学历', '学位', '毕业学历', '最高学历', 'education'],
      excludeKeywords: ['经历', '工作'],
      selectors: [
        'select[placeholder*="学历" i]',
        'select[placeholder*="学位" i]',
        'select[name*="degree" i]',
        'select[name*="education" i]',
        '[data-field="degree"] select'
      ]
    },
    graduation: {
      keywords: ['毕业时间', '毕业日期', '毕业年月', '预计毕业', '毕业'],
      excludeKeywords: ['入学', '开始', '结束', '参加工作'],
      selectors: [
        'input[placeholder*="毕业" i]',
        'input[name*="graduation" i]',
        '[data-field="graduation"] input'
      ]
    },
    school_country: {
      keywords: ['学校国家', '院校国家', '国别'],
      excludeKeywords: [],
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
    },
    english_level: {
      keywords: ['英语水平', '英语等级', '英语能力', 'CET', '四级', '六级'],
      excludeKeywords: [],
      selectors: [
        'select[placeholder*="英语" i]',
        'select[name*="english" i]',
        'select[name*="CET" i]',
        '[data-field="english_level"] select'
      ]
    },
    party_join_date: {
      keywords: ['入党时间', '入团时间', '党团', '参加党团'],
      excludeKeywords: ['出生', '毕业', '入职'],
      selectors: [
        'input[placeholder*="入党" i]',
        'input[name*="party" i]',
        '[data-field="party_join_date"] input'
      ]
    },
    available_date: {
      keywords: ['到岗时间', '可到岗', '入职时间', '可用时间'],
      excludeKeywords: ['出生', '毕业', '开始'],
      selectors: [
        'input[placeholder*="到岗" i]',
        'input[placeholder*="入职" i]',
        '[data-field="available_date"] input'
      ]
    },
    work_start_date: {
      keywords: ['参加工作时间', '工作开始时间', '首次工作'],
      excludeKeywords: ['出生', '毕业', '入职'],
      selectors: [
        'input[placeholder*="参加工作" i]',
        '[data-field="work_start_date"] input'
      ]
    },
    hukou_type: {
      keywords: ['户口性质', '户口类型', '农业', '非农'],
      excludeKeywords: [],
      selectors: [
        'select[placeholder*="户口性质" i]',
        'select[name*="hukouType" i]',
        '[data-field="hukou_type"] select'
      ]
    },
    position: {
      keywords: ['岗位', '职位', '应聘职位', '期望职位'],
      excludeKeywords: ['公司职位', '现任职位'],
      selectors: [
        'input[placeholder*="岗位" i]',
        'input[placeholder*="职位" i]',
        'select[name*="position" i]',
        '[data-field="position"] input, [data-field="position"] select'
      ]
    },
    company: {
      keywords: ['公司', '企业', '单位', '工作单位'],
      excludeKeywords: ['学校', '院校', '培训机构'],
      selectors: [
        'input[placeholder*="公司" i]',
        'input[placeholder*="单位" i]',
        '[data-field="company"] input'
      ]
    },
    start_date: {
      keywords: ['开始时间', '开始日期', '起始时间'],
      excludeKeywords: ['出生', '毕业'],
      selectors: [
        'input[placeholder*="开始" i]',
        '[data-field="start_date"] input'
      ]
    },
    end_date: {
      keywords: ['结束时间', '结束日期', '截止时间'],
      excludeKeywords: ['出生', '毕业'],
      selectors: [
        'input[placeholder*="结束" i]',
        '[data-field="end_date"] input'
      ]
    },
  };

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
      '汉族': ['汉族', '汉'],
      '蒙古族': ['蒙古族', '蒙古'],
      '回族': ['回族', '回'],
      '藏族': ['藏族', '藏'],
      '维吾尔族': ['维吾尔族', '维吾尔'],
      '苗族': ['苗族', '苗'],
      '彝族': ['彝族', '彝'],
      '壮族': ['壮族', '壮'],
      '布依族': ['布依族', '布依'],
      '朝鲜族': ['朝鲜族', '朝鲜'],
      '满族': ['满族', '满'],
      '侗族': ['侗族', '侗'],
      '瑶族': ['瑶族', '瑶'],
      '白族': ['白族', '白'],
      '土家族': ['土家族', '土家'],
      '哈尼族': ['哈尼族', '哈尼'],
      '哈萨克族': ['哈萨克族', '哈萨克'],
      '傣族': ['傣族', '傣'],
      '黎族': ['黎族', '黎'],
      '傈僳族': ['傈僳族', '傈僳'],
      '佤族': ['佤族', '佤'],
      '畲族': ['畲族', '畲'],
      '高山族': ['高山族', '高山'],
      '拉祜族': ['拉祜族', '拉祜'],
      '水族': ['水族', '水'],
      '东乡族': ['东乡族', '东乡'],
      '纳西族': ['纳西族', '纳西'],
      '景颇族': ['景颇族', '景颇'],
      '柯尔克孜族': ['柯尔克孜族', '柯尔克孜'],
      '土族': ['土族', '土'],
      '达斡尔族': ['达斡尔族', '达斡尔'],
      '仫佬族': ['仫佬族', '仫佬'],
      '羌族': ['羌族', '羌'],
      '布朗族': ['布朗族', '布朗'],
      '撒拉族': ['撒拉族', '撒拉'],
      '毛南族': ['毛南族', '毛南'],
      '仡佬族': ['仡佬族', '仡佬'],
      '锡伯族': ['锡伯族', '锡伯'],
      '阿昌族': ['阿昌族', '阿昌'],
      '普米族': ['普米族', '普米'],
      '塔吉克族': ['塔吉克族', '塔吉克'],
      '怒族': ['怒族', '怒'],
      '乌孜别克族': ['乌孜别克族', '乌孜别克'],
      '俄罗斯族': ['俄罗斯族', '俄罗斯'],
      '鄂温克族': ['鄂温克族', '鄂温克'],
      '德昂族': ['德昂族', '德昂'],
      '保安族': ['保安族', '保安'],
      '裕固族': ['裕固族', '裕固'],
      '京族': ['京族', '京'],
      '塔塔尔族': ['塔塔尔族', '塔塔尔'],
      '独龙族': ['独龙族', '独龙'],
      '鄂伦春族': ['鄂伦春族', '鄂