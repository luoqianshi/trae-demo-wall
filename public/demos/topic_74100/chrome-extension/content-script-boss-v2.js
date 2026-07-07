/**
 * BOSS直聘志愿者页面 - 专项填充优化 v2
 * 
 * 核心思路：直接操作 Vue 实例和 form model，而不是只模拟 UI 点击
 * 这样可以确保：
 * 1. 下拉选择正确显示文本（而不是值代码）
 * 2. 日期选择器正确填充
 * 3. 表单验证状态正确更新
 * 4. 所有字段值被正确提交
 */

(function() {
  'use strict';

  // ========== 工具函数 ==========

  function isElementVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    return true;
  }

  function isBossZhipinPage() {
    return window.location.hostname.includes('zhipin.com');
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 获取 form-item 的 label 文本
  function getItemLabel(item) {
    const labelEl = item.querySelector('[class*="label"], [class*="Label"], .form-item-label');
    if (labelEl) {
      return labelEl.textContent.trim().replace(/\s+/g, '');
    }
    return '';
  }

  // 获取所有可见的 form-item
  function getFormItems() {
    const items = document.querySelectorAll('.form-item');
    const visible = [];
    items.forEach(item => {
      if (isElementVisible(item)) {
        visible.push(item);
      }
    });
    return visible;
  }

  // 找到 ui-form 的 Vue 实例
  function findFormVm() {
    const items = document.querySelectorAll('.form-item');
    for (const item of items) {
      let el = item;
      for (let i = 0; i < 20 && el; i++) {
        const vm = el.__vue__;
        if (vm) {
          const tag = vm.$options?._componentTag || vm.$options?.name || '';
          if (tag === 'ui-form' || tag === 'uiForm' || vm.model) {
            return vm;
          }
        }
        el = el.parentElement;
      }
    }
    return null;
  }

  // 获取 form-item 的 prop（字段名）
  function getItemProp(item) {
    const vm = item.__vue__;
    if (vm && vm.prop) return vm.prop;
    // 从 class 或 data 属性中找
    const propAttr = item.getAttribute('data-prop') || item.getAttribute('prop');
    if (propAttr) return propAttr;
    return '';
  }

  // 设置 form model 的值并更新验证状态
  function setFormValue(formVm, prop, value) {
    if (!formVm || !formVm.model || !prop) return false;
    
    try {
      formVm.model[prop] = value;
    } catch (e) {}
    
    // 更新对应的 form-item 验证状态
    const items = document.querySelectorAll('.form-item');
    for (const item of items) {
      const itemVm = item.__vue__;
      if (itemVm && itemVm.prop === prop) {
        try {
          itemVm.validateState = 'success';
          itemVm.validateMessage = '';
          itemVm.validateDisabled = false;
          if (itemVm.$forceUpdate) itemVm.$forceUpdate();
        } catch (e) {}
        break;
      }
    }
    return true;
  }

  // ========== 填充输入框 ==========
  function fillInput(item, value, formVm, prop) {
    const input = item.querySelector('input[type="text"], input:not([type]):not([readonly]):not([disabled]), textarea');
    if (!input) return false;
    
    // 使用原生方式设置值，触发 Vue 响应式
    const tag = input.tagName;
    const proto = tag === 'TEXTAREA' 
      ? window.HTMLTextAreaElement.prototype 
      : window.HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.set) {
      desc.set.call(input, value);
    } else {
      input.value = value;
    }
    
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    
    // 同步更新 form model
    if (formVm && prop) {
      setFormValue(formVm, prop, value);
    }
    
    return true;
  }

  // ========== 填充日期选择器 ==========
  async function fillDatePicker(item, displayValue, formVm, prop) {
    const picker = item.querySelector('.ui-date-picker, .ui-date-editor, [class*="date-picker"]');
    if (!picker) return false;
    
    const vm = picker.__vue__;
    const input = picker.querySelector('input');
    if (!input) return false;
    
    // 1. 设置 input 显示值
    const proto = window.HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.set) {
      desc.set.call(input, displayValue);
    } else {
      input.value = displayValue;
    }
    
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    
    // 2. 更新 Vue 实例的值
    if (vm) {
      try {
        vm.currentValue = displayValue;
        if (typeof vm.setCurrentValue === 'function') {
          vm.setCurrentValue(displayValue);
        }
        if (vm.$emit) {
          vm.$emit('input', displayValue);
          vm.$emit('change', displayValue);
        }
        if (vm.$forceUpdate) vm.$forceUpdate();
      } catch (e) {}
    }
    
    // 3. 更新 form model
    if (formVm && prop) {
      setFormValue(formVm, prop, displayValue);
    }
    
    return true;
  }

  // ========== 填充下拉选择器 ==========
  async function fillSelect(item, targetLabel, formVm, prop) {
    const select = item.querySelector('.ui-select');
    if (!select) return false;
    
    const vm = select.__vue__;
    if (!vm) return false;
    
    let optionValue = null;
    let optionLabel = null;
    
    // 方法1：展开下拉，从 DOM 中获取选项
    try {
      vm.visible = true;
      await delay(150);
      
      const dropdowns = document.querySelectorAll('.ui-select-dropdown');
      
      for (const dd of dropdowns) {
        if (!isElementVisible(dd)) continue;
        const opts = dd.querySelectorAll('.ui-select-item');
        if (opts.length === 0) continue;
        
        // 检查这个面板是否属于当前 select
        let belongsToThis = false;
        const firstOptVm = opts[0].__vue__;
        if (firstOptVm) {
          let p = firstOptVm.$parent;
          for (let i = 0; i < 10 && p; i++) {
            if (p === vm) { belongsToThis = true; break; }
            p = p.$parent;
          }
        }
        
        // 在面板中查找目标选项
        for (const opt of opts) {
          const text = opt.textContent.trim();
          if (text === targetLabel || text.includes(targetLabel)) {
            const optVm = opt.__vue__;
            optionValue = optVm?.value || opt.getAttribute('value') || text;
            optionLabel = text;
            
            // 模拟点击选项
            opt.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            opt.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
            opt.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
            opt.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }));
            if (opt.click) opt.click();
            
            break;
          }
        }
        
        if (optionValue) break;
      }
      
      vm.visible = false;
    } catch (e) {}
    
    // 方法2：从 Vue 实例的 options 中找
    if (!optionValue && vm && vm.options) {
      try {
        const opts = Array.isArray(vm.options) ? vm.options : Object.values(vm.options);
        for (const opt of opts) {
          const label = opt.label || opt.text || opt.name || '';
          if (label === targetLabel || label.includes(targetLabel)) {
            optionValue = opt.value;
            optionLabel = label;
            break;
          }
        }
      } catch (e) {}
    }
    
    if (!optionValue) return false;
    
    // 直接设置 Vue 的值（双重保险）
    try {
      vm.value = optionValue;
      vm.values = [{ value: optionValue, label: optionLabel, disabled: false }];
      if (vm.$emit) {
        vm.$emit('input', optionValue);
        vm.$emit('change', optionValue);
      }
      if (vm.$forceUpdate) vm.$forceUpdate();
    } catch (e) {}
    
    // 更新 form model
    if (formVm && prop) {
      setFormValue(formVm, prop, optionValue);
    }
    
    return { value: optionValue, label: optionLabel };
  }

  // ========== 主填充函数 ==========
  async function fillBossForm(resumeData) {
    if (!isBossZhipinPage()) {
      return { success: false, error: '不是BOSS直聘页面' };
    }
    
    const data = resumeData || {};
    const formVm = findFormVm();
    const items = getFormItems();
    
    console.log('[BOSS表单填充] 找到', items.length, '个字段');
    if (!formVm) {
      console.warn('[BOSS表单填充] 未找到 ui-form 实例');
    }
    
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    // 教育经历分组计数
    let eduGroupIndex = 0;
    const eduLabels = ['开始时间', '结束时间', '学历', '学校', '专业', '学位类型', '挂科情况', '成绩排名'];
    
    for (const item of items) {
      const label = getItemLabel(item);
      const prop = getItemProp(item);
      
      if (!label) continue;
      
      // 确定字段类型和值
      let fieldType = null; // 'input' | 'date' | 'select'
      let fieldValue = null;
      
      // 检查是不是日期选择器
      if (item.querySelector('.ui-date-picker, .ui-date-editor, [class*="date-picker"]')) {
        fieldType = 'date';
      }
      // 检查是不是下拉选择器
      else if (item.querySelector('.ui-select')) {
        fieldType = 'select';
      }
      // 检查是不是普通输入框
      else if (item.querySelector('input:not([readonly]):not([disabled]), textarea')) {
        fieldType = 'input';
      }
      // 也可能是只读 input 的 select
      else if (item.querySelector('input[readonly]')) {
        fieldType = 'select';
      }
      
      if (!fieldType) continue;
      
      // 根据 label 找对应的值
      fieldValue = findFieldValue(label, data, eduLabels, eduGroupIndex);
      
      // 每遇到"开始时间"，教育经历分组+1（下一组）
      if (label === '开始时间') {
        eduGroupIndex++;
      }
      
      if (!fieldValue) {
        results.push({ label, prop, status: 'skip', reason: '无对应数据' });
        continue;
      }
      
      // 滚动到可见区域
      try {
        item.scrollIntoView({ block: 'center' });
      } catch (e) {}
      
      await delay(50);
      
      let success = false;
      let detail = '';
      
      try {
        if (fieldType === 'input') {
          success = fillInput(item, fieldValue, formVm, prop);
          detail = fieldValue.substring(0, 30);
        } else if (fieldType === 'date') {
          success = await fillDatePicker(item, fieldValue, formVm, prop);
          detail = fieldValue;
        } else if (fieldType === 'select') {
          const result = await fillSelect(item, fieldValue, formVm, prop);
          success = !!result;
          detail = result ? result.label : '未找到匹配选项';
        }
      } catch (e) {
        detail = '错误: ' + e.message;
      }
      
      if (success) {
        successCount++;
        console.log('  ✓', label, ':', detail);
      } else {
        failCount++;
        console.warn('  ✗', label, ':', detail);
      }
      
      results.push({ label, prop, type: fieldType, status: success ? 'success' : 'fail', detail });
      
      await delay(100);
    }
    
    // 滚动回顶部
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {}
    
    // 统计验证错误
    const errorItems = items.filter(item => {
      const itemVm = item.__vue__;
      return itemVm && itemVm.validateState === 'error';
    });
    
    console.log('');
    console.log('[填充完成] 成功:', successCount, '失败:', failCount, '验证错误:', errorItems.length);
    
    if (errorItems.length > 0) {
      console.warn('验证错误字段:');
      errorItems.forEach(item => {
        const label = getItemLabel(item);
        const msg = item.__vue__?.validateMessage || '';
        console.warn('  -', label, ':', msg);
      });
    }
    
    return {
      success: true,
      total: items.length,
      filled: successCount,
      failed: failCount,
      errorCount: errorItems.length,
      rate: Math.round(successCount / items.length * 100) + '%',
      results
    };
  }

  // 根据 label 找简历数据中对应的值
  function findFieldValue(label, data, eduLabels, eduGroupIndex) {
    // 教育经历字段
    if (eduLabels.includes(label)) {
      const eduData = eduGroupIndex === 0 ? data.edu1 : (eduGroupIndex === 1 ? data.edu2 : null);
      if (!eduData) return null;
      
      const keyMap = {
        '开始时间': 'startDate',
        '结束时间': 'endDate',
        '学历': 'degree',
        '学校': 'school',
        '专业': 'major',
        '学位类型': 'degreeType',
        '挂科情况': 'hasFailed',
        '成绩排名': 'rank'
      };
      
      const key = keyMap[label];
      return key ? eduData[key] : null;
    }
    
    // 基本信息字段 - 精确匹配
    const basicMap = {
      '姓名': 'name',
      '性别': 'gender',
      '出生日期': 'birthDate',
      '出生年月': 'birthDate',
      '移动电话': 'phone',
      '手机号码': 'phone',
      '联系电话': 'phone',
      '电子邮箱': 'email',
      '邮箱': 'email',
      '身份证号码': 'idCard',
      '身份证号': 'idCard',
      '证件号码': 'idCard',
      '民族': 'ethnicity',
      '政治面貌': 'politicalStatus',
      '籍贯': 'nativePlace',
      '户籍类型': 'hukouType',
      '户口类型': 'hukouType',
      '户口性质': 'hukouType',
    };
    
    if (basicMap[label]) {
      return data[basicMap[label]];
    }
    
    // 英语能力相关
    const englishMap = {
      '英语等级': 'englishLevel',
      '英语等级/分数': 'englishLevel',
      '英语水平': 'englishLevel',
      '语言等级': 'languageLevel',
      '成绩得分': 'englishScore',
      '其他外语': 'otherLanguage',
      '分数/等级': 'otherScore'
    };
    
    if (englishMap[label]) {
      return data[englishMap[label]];
    }
    
    // 模糊匹配
    for (const key of Object.keys(data)) {
      if (typeof data[key] !== 'string') continue;
      // 跳过对象类型（如 edu1, edu2）
      if (key === 'edu1' || key === 'edu2') continue;
      
      const value = data[key];
      if (!value) continue;
      
      // 简单的关键词匹配
      const keyLower = key.toLowerCase();
      const labelLower = label.toLowerCase();
      
      if (labelLower.includes(keyLower) || keyLower.includes(labelLower)) {
        return value;
      }
    }
    
    return null;
  }

  // ========== 暴露到全局 ==========
  
  window.BossFormFillerV2 = {
    fill: fillBossForm,
    findFormVm,
    getFormItems,
    getItemLabel,
    getItemProp,
    fillInput,
    fillDatePicker,
    fillSelect,
    setFormValue
  };

  // 兼容旧版调用
  window.fillBossFormV2 = fillBossForm;
  
  console.log('[BOSS直聘填充工具 v2] 已加载，运行 BossFormFillerV2.fill(简历数据) 开始填充');

})();
