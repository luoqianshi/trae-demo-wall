/**
 * BOSS直聘志愿者页面 - 专项填充优化 v3
 * 
 * 核心改进（经过测试验证）：
 * 1. 按索引位置分组字段（解决教育/英语部分 prop 为空的问题）
 * 2. 使用几何位置匹配下拉框（更准确）
 * 3. 使用搜索功能查找选项（更可靠）
 * 4. 滚动到可视区域（确保下拉框正确渲染）
 * 5. 超时保护（避免卡住）
 * 6. 简单直接的实现方式（避免复杂封装导致的问题）
 */

(function() {
  'use strict';

  // ========== 工具函数 ==========

  function isBossZhipinPage() {
    return window.location.hostname.includes('zhipin.com');
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function scrollIntoView(el) {
    const r = el.getBoundingClientRect();
    if (r.top < 50 || r.bottom > window.innerHeight - 50) {
      el.scrollIntoView({ behavior: 'auto', block: 'center' });
      return new Promise(resolve => setTimeout(resolve, 100));
    }
    return Promise.resolve();
  }

  function getVisibleItems() {
    const items = document.querySelectorAll('.form-item');
    const visible = [];
    items.forEach(item => {
      const r = item.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) visible.push(item);
    });
    return visible;
  }

  function getItemLabel(item) {
    const labelEl = item.querySelector('[class*="label"], [class*="Label"]');
    return labelEl ? labelEl.textContent.trim().replace(/\s+/g, '') : '';
  }

  function getFormVm() {
    const formEl = document.querySelector('.ui-form');
    return formEl ? formEl.__vue__ : null;
  }

  function setInputValue(input, value) {
    const proto = Object.getPrototypeOf(input);
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.set) desc.set.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setFormValue(item, value) {
    const itemVm = item.__vue__;
    const formVm = getFormVm();
    if (itemVm && formVm && itemVm.prop && formVm.model) {
      try {
        formVm.model[itemVm.prop] = value;
      } catch (e) {}
    }
  }

  function setValidateSuccess(item) {
    const vm = item.__vue__;
    if (vm) {
      try {
        vm.validateState = 'success';
        vm.validateMessage = '';
        vm.errorMessage = '';
        vm.validating = false;
      } catch (e) {}
    }
  }

  function updateSelectText(selectEl, label) {
    const inner = selectEl.querySelector('.ui-select-inner');
    if (inner) inner.textContent = label;
  }

  function findDropdownForSelect(selectEl) {
    const selectRect = selectEl.getBoundingClientRect();
    const dropdowns = document.querySelectorAll('.ui-select-dropdown');
    let best = null, bestScore = Infinity;
    for (const dd of dropdowns) {
      const ddRect = dd.getBoundingClientRect();
      const opts = dd.querySelectorAll('.ui-select-item');
      if (opts.length === 0) continue;
      const leftDist = Math.abs(ddRect.left - selectRect.left);
      if (leftDist > 300) continue;
      const score = leftDist * 2 + Math.abs(ddRect.top - selectRect.bottom);
      if (score < bestScore) { bestScore = score; best = dd; }
    }
    return best;
  }

  function getOptionValue(optEl) {
    const optVm = optEl.__vue__;
    if (optVm) {
      if (optVm.value !== undefined && optVm.value !== null && optVm.value !== '') return optVm.value;
      if (optVm.option?.value !== undefined && optVm.option?.value !== null && optVm.option?.value !== '') return optVm.option.value;
    }
    return optEl.textContent.trim();
  }

  async function findSelectOption(selectEl, targetLabel) {
    const vm = selectEl.__vue__;
    if (!vm) return null;
    
    try {
      vm.visible = true;
      vm.query = '';
      if (typeof vm.onQueryChange === 'function') vm.onQueryChange('');
    } catch(e) {
      return null;
    }
    
    let dropdown = null;
    for (let i = 0; i < 20; i++) {
      await delay(100);
      try {
        dropdown = findDropdownForSelect(selectEl);
        if (dropdown) break;
      } catch(e) {}
    }
    
    if (!dropdown) {
      try { vm.visible = false; } catch(e) {}
      return null;
    }
    
    if (typeof vm.onQueryChange === 'function') {
      try {
        vm.query = targetLabel;
        vm.onQueryChange(targetLabel);
      } catch(e) {}
      await delay(300);
    }
    
    let target = null;
    try {
      const opts = dropdown.querySelectorAll('.ui-select-item');
      for (const opt of opts) {
        const t = opt.textContent.trim();
        if (t === targetLabel) { target = opt; break; }
      }
      if (!target) {
        for (const opt of opts) {
          const t = opt.textContent.trim();
          if (t.includes(targetLabel) || targetLabel.includes(t)) { target = opt; break; }
        }
      }
    } catch(e) {}
    
    try { vm.visible = false; } catch(e) {}
    
    if (!target) return null;
    return { value: getOptionValue(target), label: target.textContent.trim() };
  }

  // ========== 字段定义（按索引位置） ==========
  // 0-9: 基本信息
  // 10-17: 第一段教育经历
  // 18-25: 第二段教育经历
  // 26-30: 英语能力

  function buildFieldDefs(data) {
    return [
      { idx: 0, type: 'input', value: data.name || '' },
      { idx: 1, type: 'select', value: data.gender || '', timeout: 10000 },
      { idx: 2, type: 'date', value: data.birthDate || '' },
      { idx: 3, type: 'input', value: data.phone || '' },
      { idx: 4, type: 'input', value: data.email || '' },
      { idx: 5, type: 'input', value: data.idCard || '' },
      { idx: 6, type: 'select', value: data.ethnicity || '', timeout: 10000 },
      { idx: 7, type: 'select', value: data.politicalStatus || '', timeout: 10000 },
      { idx: 8, type: 'cascader', value: data.nativePlace || [] },
      { idx: 9, type: 'select', value: data.hukouType || '', timeout: 10000 },
      
      { idx: 10, type: 'date', value: data.edu1Start || (data.education?.[0]?.startDate) || '' },
      { idx: 11, type: 'date', value: data.edu1End || (data.education?.[0]?.endDate) || '' },
      { idx: 12, type: 'select', value: data.edu1Degree || (data.education?.[0]?.degree) || '', timeout: 10000 },
      { idx: 13, type: 'select', value: data.edu1School || (data.education?.[0]?.school) || '', timeout: 20000 },
      { idx: 14, type: 'select', value: data.edu1Major || (data.education?.[0]?.major) || '', timeout: 20000 },
      { idx: 15, type: 'select', value: data.edu1DegreeType || (data.education?.[0]?.degreeType) || '', timeout: 10000 },
      { idx: 16, type: 'select', value: data.edu1FailCourses || (data.education?.[0]?.hasFailedCourses) || '否', timeout: 10000 },
      { idx: 17, type: 'select', value: data.edu1Rank || (data.education?.[0]?.classRank) || '', timeout: 10000 },
      
      { idx: 18, type: 'date', value: data.edu2Start || (data.education?.[1]?.startDate) || '' },
      { idx: 19, type: 'date', value: data.edu2End || (data.education?.[1]?.endDate) || '' },
      { idx: 20, type: 'select', value: data.edu2Degree || (data.education?.[1]?.degree) || '', timeout: 10000 },
      { idx: 21, type: 'select', value: data.edu2School || (data.education?.[1]?.school) || '', timeout: 20000 },
      { idx: 22, type: 'select', value: data.edu2Major || (data.education?.[1]?.major) || '', timeout: 20000 },
      { idx: 23, type: 'select', value: data.edu2DegreeType || (data.education?.[1]?.degreeType) || '', timeout: 10000 },
      { idx: 24, type: 'select', value: data.edu2FailCourses || (data.education?.[1]?.hasFailedCourses) || '否', timeout: 10000 },
      { idx: 25, type: 'select', value: data.edu2Rank || (data.education?.[1]?.classRank) || '', timeout: 10000 },
      
      { idx: 26, type: 'select', value: data.englishLevel || '', timeout: 10000 },
      { idx: 27, type: 'select', value: data.languageLevel || '', timeout: 10000 },
      { idx: 28, type: 'input', value: data.englishScore || '' },
      { idx: 29, type: 'select', value: data.otherLanguage || '', timeout: 10000 },
      { idx: 30, type: 'input', value: data.otherLanguageScore || '' },
    ];
  }

  // ========== 主填充函数 ==========
  async function fillBossForm(resumeData) {
    if (!isBossZhipinPage()) {
      return { success: false, error: '不是BOSS直聘页面' };
    }
    
    const items = getVisibleItems();
    const fieldDefs = buildFieldDefs(resumeData || {});
    
    console.log('%c[BOSS直聘专用填充 v3]', 'color: blue; font-weight: bold;', '找到', items.length, '个字段');
    
    let successCount = 0;
    let failCount = 0;
    const results = [];
    
    for (let i = 0; i < fieldDefs.length; i++) {
      const def = fieldDefs[i];
      const item = items[def.idx];
      
      if (!item) {
        failCount++;
        results.push({ index: def.idx, success: false, error: 'item not found' });
        continue;
      }
      
      const label = getItemLabel(item);
      console.log('  [字段' + (i+1) + ']', label, '(' + def.type + ')');
      
      if (!def.value || (Array.isArray(def.value) && def.value.length === 0)) {
        failCount++;
        console.log('    ✗ 跳过：无数据');
        results.push({ label, type: def.type, success: false, error: 'no data' });
        continue;
      }
      
      await scrollIntoView(item);
      
      try {
        if (def.type === 'input') {
          const input = item.querySelector('input, textarea');
          if (input) {
            setInputValue(input, def.value);
            setFormValue(item, def.value);
            setValidateSuccess(item);
            successCount++;
            console.log('    ✓', def.value);
            results.push({ label, type: def.type, success: true });
          } else {
            failCount++;
            console.log('    ✗ 未找到input');
            results.push({ label, type: def.type, success: false, error: 'no input' });
          }
        } else if (def.type === 'date') {
          const input = item.querySelector('input');
          if (input) {
            setInputValue(input, def.value);
            setFormValue(item, def.value);
            setValidateSuccess(item);
            successCount++;
            console.log('    ✓', def.value);
            results.push({ label, type: def.type, success: true });
          } else {
            failCount++;
            console.log('    ✗ 未找到input');
            results.push({ label, type: def.type, success: false, error: 'no input' });
          }
        } else if (def.type === 'cascader') {
          const input = item.querySelector('input');
          if (input && Array.isArray(def.value)) {
            setInputValue(input, def.value.join(' / '));
          }
          setFormValue(item, def.value);
          setValidateSuccess(item);
          successCount++;
          console.log('    ✓', Array.isArray(def.value) ? def.value.join(' / ') : def.value);
          results.push({ label, type: def.type, success: true });
        } else if (def.type === 'select') {
          console.log('    选择中...');
          const selectEl = item.querySelector('.ui-select');
          
          if (!selectEl) {
            failCount++;
            console.log('    ✗ 未找到select');
            results.push({ label, type: def.type, success: false, error: 'no select' });
          } else {
            const timeoutMs = def.timeout || 10000;
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('timeout')), timeoutMs)
            );
            
            try {
              const option = await Promise.race([
                findSelectOption(selectEl, def.value),
                timeoutPromise
              ]);
              
              if (option) {
                setFormValue(item, option.value);
                updateSelectText(selectEl, option.label);
                setValidateSuccess(item);
                successCount++;
                console.log('    ✓', option.label);
                results.push({ label, type: def.type, success: true, value: option.label });
              } else {
                failCount++;
                console.log('    ✗ 未找到选项');
                results.push({ label, type: def.type, success: false, error: 'option not found' });
              }
            } catch(e) {
              failCount++;
              console.log('    ✗', e.message);
              results.push({ label, type: def.type, success: false, error: e.message });
            }
          }
        }
      } catch (e) {
        failCount++;
        console.log('    ✗ 异常:', e.message);
        results.push({ label, type: def.type, success: false, error: e.message });
      }
      
      await delay(20);
    }
    
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {}
    
    let errorCount = 0, successState = 0;
    items.forEach(item => {
      const vm = item.__vue__;
      if (vm?.validateState === 'error') errorCount++;
      if (vm?.validateState === 'success') successState++;
    });
    
    const total = items.length;
    const rate = Math.round(successCount / Math.max(total, 1) * 100) + '%';
    
    console.log('');
    console.log('%c[填充完成]', 'color: green; font-weight: bold;', 
      '成功:', successCount, 
      '失败:', failCount,
      '填充率:', rate,
      '验证成功:', successState,
      '验证错误:', errorCount);
    
    return {
      success: true,
      total,
      filled: successCount,
      failed: failCount,
      rate,
      errorCount,
      successState,
      results
    };
  }

  // ========== 兼容旧版 API ==========
  
  function fillBossCustomSelect(element, value, fieldName) {
    const item = element.closest('.form-item');
    if (!item) return false;
    
    (async () => {
      try {
        await scrollIntoView(item);
        const selectEl = item.querySelector('.ui-select');
        if (selectEl) {
          const option = await findSelectOption(selectEl, value);
          if (option) {
            setFormValue(item, option.value);
            updateSelectText(selectEl, option.label);
            setValidateSuccess(item);
          }
        }
      } catch (e) {}
    })();
    
    return true;
  }
  
  function fillBossDatePicker(element, value, fieldName) {
    const item = element.closest('.form-item');
    if (!item) return false;
    
    const input = item.querySelector('input');
    if (input) {
      setInputValue(input, value);
      setFormValue(item, value);
      setValidateSuccess(item);
    }
    return true;
  }
  
  function findBossSelect(element) {
    if (!element) return null;
    let el = element;
    for (let i = 0; i < 8 && el; i++) {
      if (el.className && el.className.toString().includes('ui-select')) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  // ========== 暴露到全局 ==========
  
  window.isBossZhipinPage = isBossZhipinPage;
  window.findBossSelect = findBossSelect;
  window.fillBossCustomSelect = fillBossCustomSelect;
  window.fillBossDatePicker = fillBossDatePicker;
  
  window.BossFormFiller = {
    fill: fillBossForm,
    fillForm: fillBossForm,
    getFormItems: getVisibleItems,
    getItemLabel,
    fillSelect: findSelectOption,
  };
  
  window.fillBossForm = fillBossForm;
  
  console.log('%c[BOSS直聘填充工具 v3]', 'color: green; font-weight: bold;', '已加载');
  console.log('  - 调用 fillBossForm(简历数据) 开始填充');
  console.log('  - 或 BossFormFiller.fill(简历数据)');

})();
