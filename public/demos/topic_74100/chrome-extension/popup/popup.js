/**
 * AI求职管家 - Popup Script v2
 * 功能：多模板简历配置、一键填充、简历上传识别
 */

(function () {
  'use strict';

  // ============================================================
  // State
  // ============================================================

  let currentProfileId = 'profile_1';
  let currentFields = {};
  let currentCustomSchema = { sections: [], fields: {} };
  let currentProfileType = 'resume';
  let currentProfileIsPreset = true;
  // 自定义字段编辑上下文：{ mode: 'add'|'edit', sectionId, fieldKey }
  let customFieldCtx = { mode: 'add', sectionId: 'other', fieldKey: null };
  // 自定义栏目编辑上下文：{ mode: 'add'|'rename', sectionId }
  let customSectionCtx = { mode: 'add', sectionId: null };
  // 从文件创建新模板时，文件选择完成后的目标 profileId（与普通"上传简历到当前模板"区分）
  let pendingUploadToNewProfile = null;

  // ============================================================
  // DOM References
  // ============================================================

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const tabButtons = $$('.tab');
  const tabPanels = $$('.tab-panel');
  const resumeForm = $('#resumeForm');
  const statusBar = $('#statusBar');
  const profileSelector = $('#profileSelector');
  const btnRename = $('#btnRenameProfile');
  const btnNewProfile = $('#btnNewProfile');
  const btnDuplicateProfile = $('#btnDuplicateProfile');
  const btnDeleteProfile = $('#btnDeleteProfile');
  const btnAddSection = $('#btnAddSection');
  const tabsNav = $('#tabsNav');
  const customSectionsContainer = $('#customSectionsContainer');
  const btnFillCurrent = $('#btnFillCurrent');
  const btnUploadResume = $('#btnUploadResume');
  const btnSave = $('#btnSave');
  const btnLoad = $('#btnLoad');
  const btnReset = $('#btnReset');
  const btnExport = $('#btnExport');
  const btnImport = $('#btnImport');
  const resumeFileInput = $('#resumeFileInput');
  const jsonFileInput = $('#jsonFileInput');

  // 设置面板相关元素
  const btnSettings = $('#btnSettings');
  const settingsModal = $('#settingsModal');
  const btnCloseSettings = $('#btnCloseSettings');
  const apiKeyInput = $('#apiKeyInput');
  const apiKeyStatus = $('#apiKeyStatus');
  const btnTestApi = $('#btnTestApi');
  const btnSaveApiKey = $('#btnSaveApiKey');

  // ============================================================
  // 设置面板：API Key 管理
  // ============================================================

  function openSettings() {
    settingsModal.style.display = 'flex';
    refreshApiKeyStatus();
    apiKeyInput.value = '';
    apiKeyInput.focus();
  }

  function closeSettings() {
    settingsModal.style.display = 'none';
  }

  function refreshApiKeyStatus() {
    chrome.runtime.sendMessage({ action: 'getApiKeyStatus' }, (resp) => {
      if (!resp) return;
      if (resp.hasKey) {
        apiKeyStatus.className = 'api-key-status ok';
        apiKeyStatus.textContent = `已配置 API Key：${resp.masked}`;
      } else {
        apiKeyStatus.className = 'api-key-status info';
        apiKeyStatus.textContent = '尚未配置 API Key，AI 解析与下拉语义匹配将不可用';
      }
    });
  }

  if (btnSettings) {
    btnSettings.addEventListener('click', openSettings);
  }
  if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', closeSettings);
  }
  // 点击遮罩关闭
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) closeSettings();
    });
  }

  if (btnSaveApiKey) {
    btnSaveApiKey.addEventListener('click', () => {
      const key = (apiKeyInput.value || '').trim();
      if (!key) {
        apiKeyStatus.className = 'api-key-status err';
        apiKeyStatus.textContent = '请输入 API Key';
        return;
      }
      chrome.runtime.sendMessage({ action: 'saveApiKey', apiKey: key }, (resp) => {
        if (resp && resp.success) {
          apiKeyStatus.className = 'api-key-status ok';
          apiKeyStatus.textContent = 'API Key 已保存到本地';
          apiKeyInput.value = '';
          setTimeout(refreshApiKeyStatus, 800);
        } else {
          apiKeyStatus.className = 'api-key-status err';
          apiKeyStatus.textContent = '保存失败，请重试';
        }
      });
    });
  }

  if (btnTestApi) {
    btnTestApi.addEventListener('click', async () => {
      // 如果输入框有值，先临时保存再测试；否则测试已保存的 Key
      const inputKey = (apiKeyInput.value || '').trim();
      if (inputKey) {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'saveApiKey', apiKey: inputKey }, resolve);
        });
      }
      apiKeyStatus.className = 'api-key-status info';
      apiKeyStatus.textContent = '正在测试连接...';
      btnTestApi.disabled = true;
      btnTestApi.textContent = '测试中...';
      chrome.runtime.sendMessage({ action: 'testQwenApi' }, (resp) => {
        btnTestApi.disabled = false;
        btnTestApi.textContent = '测试连接';
        if (resp && resp.success) {
          apiKeyStatus.className = 'api-key-status ok';
          apiKeyStatus.textContent = `连接成功！模型回复：${(resp.content || '').substring(0, 50)}`;
        } else {
          apiKeyStatus.className = 'api-key-status err';
          apiKeyStatus.textContent = `连接失败：${resp ? resp.error : '未知错误'}`;
        }
      });
    });
  }

  // ============================================================
  // Tab Switching
  // ============================================================
  // 注意：初始 tab 与动态新增的自定义栏目 tab 都由 bindTabClicks() 统一绑定
  // bindTabClicks 使用 document.querySelectorAll('.tab') 实时查询，覆盖动态 tab
  // 这里不单独绑定初始 tab，避免双绑定冲突

  // ============================================================
  // Profile 管理
  // ============================================================

  async function loadProfiles() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getProfiles' }, (response) => {
        resolve(response || { profiles: {}, activeProfileId: 'profile_1' });
      });
    });
  }

  function buildProfileSelector(profiles, activeId) {
    profileSelector.innerHTML = '';
    for (const [id, p] of Object.entries(profiles)) {
      const opt = document.createElement('option');
      opt.value = id;
      const typeTag = p.type === 'form' ? '[表单] ' : '';
      opt.textContent = `${typeTag}${p.name || id}`;
      if (id === activeId) opt.selected = true;
      profileSelector.appendChild(opt);
    }
  }

  async function loadActiveProfile() {
    const { profiles, activeProfileId } = await loadProfiles();
    currentProfileId = activeProfileId;
    const profile = profiles[activeProfileId] || {};
    currentFields = profile.fields ? { ...profile.fields } : {};
    currentProfileType = profile.type || 'resume';
    currentProfileIsPreset = !!profile.isPreset;

    buildProfileSelector(profiles, activeProfileId);

    // 控制删除按钮可见性
    if (btnDeleteProfile) {
      btnDeleteProfile.disabled = currentProfileIsPreset;
      btnDeleteProfile.style.opacity = currentProfileIsPreset ? '0.4' : '1';
      btnDeleteProfile.title = currentProfileIsPreset ? '预置模板不可删除' : '删除当前模板';
    }

    // 清理旧的自定义 UI
    clearCustomUI();
    populateForm(currentFields);

    // 加载 customSchema 并渲染
    try {
      const schemaResp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'customSchema_get', profileId: currentProfileId }, resolve);
      });
      currentCustomSchema = (schemaResp && schemaResp.success && schemaResp.schema) || { sections: [], fields: {} };
    } catch (e) {
      currentCustomSchema = { sections: [], fields: {} };
    }
    renderCustomSections(currentCustomSchema);
    renderCustomFields(currentCustomSchema);
    injectAddFieldButtons();
    updateProfileTypeUI();
  }

  // 通用表单模板：隐藏默认 7 个栏目
  function updateProfileTypeUI() {
    const isFormType = currentProfileType === 'form';
    const defaultTabIds = ['basic', 'id', 'origin', 'job', 'edu', 'exp', 'other'];
    defaultTabIds.forEach(id => {
      const tab = document.querySelector(`.tab[data-tab="${id}"]`);
      const panel = document.getElementById(`panel-${id}`);
      if (tab) tab.style.display = isFormType ? 'none' : '';
      if (panel) panel.style.display = isFormType ? 'none' : '';
    });
    // 通用表单类型且没有自定义栏目时，提示用户
    if (isFormType) {
      const hasCustomTab = document.querySelector('.tab.custom-tab');
      if (!hasCustomTab) {
        const firstDefaultTab = document.querySelector('.tab[data-tab="basic"]');
        if (firstDefaultTab) firstDefaultTab.style.display = 'none';
      }
    }
  }

  // 清理自定义 UI（切换 profile 时调用）
  function clearCustomUI() {
    // 移除自定义字段卡片
    document.querySelectorAll('.custom-field-card').forEach(el => el.remove());
    // 移除"+ 添加字段"按钮
    document.querySelectorAll('.btn-add-field').forEach(el => el.remove());
    // 移除自定义栏目 tab
    document.querySelectorAll('.tab.custom-tab').forEach(el => el.remove());
    // 移除自定义栏目 panel
    if (customSectionsContainer) customSectionsContainer.innerHTML = '';
  }

  async function saveProfile() {
    const data = collectFormData();
    currentFields = { ...data };
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'updateProfile',
        profileId: currentProfileId,
        fields: data,
      }, (response) => {
        resolve(response);
      });
    });
  }

  // ============================================================
  // Profile 切换事件
  // ============================================================

  profileSelector.addEventListener('change', async () => {
    const newProfileId = profileSelector.value;
    // 先保存当前
    await saveProfile();
    // 切换
    await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'setActiveProfile', profileId: newProfileId }, resolve);
    });
    currentProfileId = newProfileId;
    await loadActiveProfile();
    showStatus(`已切换到「${profileSelector.selectedOptions[0].textContent}」`, 'info');
  });

  btnRename.addEventListener('click', async () => {
    const currentName = profileSelector.selectedOptions[0].textContent;
    const newName = prompt('请输入新名称：', currentName);
    if (!newName || !newName.trim() || newName.trim() === currentName) return;
    await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'renameProfile', profileId: currentProfileId, name: newName.trim() }, resolve);
    });
    const { profiles } = await loadProfiles();
    buildProfileSelector(profiles, currentProfileId);
    showStatus('模板已重命名', 'success');
  });

  // ============================================================
  // 模板 CRUD：新建 / 复制 / 删除
  // ============================================================

  function openModal(modalEl) { if (modalEl) modalEl.style.display = 'flex'; }
  function closeModal(modalEl) { if (modalEl) modalEl.style.display = 'none'; }

  const newProfileModal = $('#newProfileModal');
  const newProfileName = $('#newProfileName');
  const newProfileType = $('#newProfileType');
  const customFieldModal = $('#customFieldModal');
  const customFieldTitle = $('#customFieldTitle');
  const customFieldLabel = $('#customFieldLabel');
  const customFieldType = $('#customFieldType');
  const customFieldOptionsGroup = $('#customFieldOptionsGroup');
  const customFieldOptions = $('#customFieldOptions');
  const customFieldKeywords = $('#customFieldKeywords');
  const customSectionModal = $('#customSectionModal');
  const customSectionTitle = $('#customSectionTitle');
  const customSectionName = $('#customSectionName');

  // 新建模板
  if (btnNewProfile) {
    btnNewProfile.addEventListener('click', () => {
      newProfileName.value = '';
      newProfileType.value = 'resume';
      openModal(newProfileModal);
      setTimeout(() => newProfileName.focus(), 50);
    });
  }
  $('#btnCloseNewProfile')?.addEventListener('click', () => closeModal(newProfileModal));
  $('#btnCancelNewProfile')?.addEventListener('click', () => closeModal(newProfileModal));
  const newProfileFromUpload = $('#newProfileFromUpload');
  $('#btnConfirmNewProfile')?.addEventListener('click', async () => {
    const name = (newProfileName.value || '').trim();
    if (!name) { showStatus('请输入模板名称', 'error'); return; }
    const type = newProfileType.value;
    const fromUpload = !!(newProfileFromUpload && newProfileFromUpload.checked);
    const resp = await new Promise((resolve) => {
      // resume 类型：复制 profile_1 的字段结构作为起点；form 类型：空白
      let initFields = {};
      if (type === 'resume' && typeof DEFAULT_PROFILES !== 'undefined') {
        initFields = { ...DEFAULT_PROFILES.profile_1.fields };
      }
      chrome.runtime.sendMessage({ action: 'createProfile', name, type, fields: initFields }, resolve);
    });
    if (resp && resp.success) {
      // 切换到新模板
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'setActiveProfile', profileId: resp.profile.id }, resolve);
      });
      await loadActiveProfile();
      closeModal(newProfileModal);
      if (fromUpload) {
        // 标记待上传模式，触发文件选择
        pendingUploadToNewProfile = resp.profile.id;
        showStatus(`已创建「${name}」，请选择要解析的文件...`, 'info');
        resumeFileInput.click();
      } else {
        showStatus(`已创建并切换到「${name}」`, 'success');
      }
    } else {
      showStatus(`创建失败：${resp?.error || '未知错误'}`, 'error');
    }
  });

  // 复制模板
  if (btnDuplicateProfile) {
    btnDuplicateProfile.addEventListener('click', async () => {
      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'duplicateProfile', profileId: currentProfileId }, resolve);
      });
      if (resp && resp.success) {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'setActiveProfile', profileId: resp.profile.id }, resolve);
        });
        await loadActiveProfile();
        showStatus(`已复制为「${resp.profile.name}」`, 'success');
      } else {
        showStatus(`复制失败：${resp?.error || '未知错误'}`, 'error');
      }
    });
  }

  // 删除模板
  if (btnDeleteProfile) {
    btnDeleteProfile.addEventListener('click', async () => {
      if (currentProfileIsPreset) {
        showStatus('预置模板不可删除', 'error');
        return;
      }
      const name = profileSelector.selectedOptions[0]?.textContent || currentProfileId;
      if (!confirm(`确定删除模板「${name}」吗？此操作不可恢复。`)) return;
      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'deleteProfile', profileId: currentProfileId }, resolve);
      });
      if (resp && resp.success) {
        await loadActiveProfile();
        showStatus('模板已删除', 'success');
      } else {
        showStatus(`删除失败：${resp?.error || '未知错误'}`, 'error');
      }
    });
  }

  // ============================================================
  // 自定义栏目：添加 / 重命名 / 删除
  // ============================================================

  if (btnAddSection) {
    btnAddSection.addEventListener('click', () => {
      customSectionCtx = { mode: 'add', sectionId: null };
      customSectionTitle.textContent = '➕ 添加自定义栏目';
      customSectionName.value = '';
      openModal(customSectionModal);
      setTimeout(() => customSectionName.focus(), 50);
    });
  }
  $('#btnCloseCustomSection')?.addEventListener('click', () => closeModal(customSectionModal));
  $('#btnCancelCustomSection')?.addEventListener('click', () => closeModal(customSectionModal));
  $('#btnConfirmCustomSection')?.addEventListener('click', async () => {
    const name = (customSectionName.value || '').trim();
    if (!name) { showStatus('请输入栏目名称', 'error'); return; }
    if (customSectionCtx.mode === 'add') {
      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'customSchema_addSection',
          profileId: currentProfileId,
          section: { name },
        }, resolve);
      });
      if (resp && resp.success) {
        await loadActiveProfile();
        // 激活新栏目
        const newTab = document.querySelector(`.tab.custom-tab[data-tab="${resp.id}"]`);
        if (newTab) newTab.click();
        closeModal(customSectionModal);
        showStatus(`已添加栏目「${name}」`, 'success');
      } else {
        showStatus(`添加失败：${resp?.error || '未知错误'}`, 'error');
      }
    } else if (customSectionCtx.mode === 'rename') {
      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'customSchema_renameSection',
          profileId: currentProfileId,
          sectionId: customSectionCtx.sectionId,
          name,
        }, resolve);
      });
      if (resp && resp.success) {
        await loadActiveProfile();
        closeModal(customSectionModal);
        showStatus('栏目已重命名', 'success');
      }
    }
  });

  // 删除自定义栏目（事件委托，处理动态注入的 tab-remove 按钮）
  tabsNav?.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-remove')) {
      e.stopPropagation();
      e.preventDefault();
      const tab = e.target.closest('.tab.custom-tab');
      if (!tab) return;
      const sectionId = tab.dataset.tab;
      const sectionName = tab.textContent.replace('×', '').trim();
      if (!confirm(`确定删除栏目「${sectionName}」吗？栏目下所有自定义字段也会被删除。`)) return;
      chrome.runtime.sendMessage({
        action: 'customSchema_removeSection',
        profileId: currentProfileId,
        sectionId,
      }, async (resp) => {
        if (resp && resp.success) {
          await loadActiveProfile();
          // 切回第一个 tab
          const firstTab = document.querySelector('.tab:not(.tab-add):not(.custom-tab)');
          if (firstTab) firstTab.click();
          showStatus('栏目已删除', 'success');
        } else {
          showStatus(`删除失败：${resp?.error || '未知错误'}`, 'error');
        }
      });
    }
  });

  // ============================================================
  // 自定义字段：添加 / 删除
  // ============================================================

  // 字段类型变化时，控制"选项"输入框显示
  customFieldType?.addEventListener('change', () => {
    const t = customFieldType.value;
    if (t === 'select' || t === 'radio') {
      customFieldOptionsGroup.style.display = '';
    } else {
      customFieldOptionsGroup.style.display = 'none';
    }
  });

  $('#btnCloseCustomField')?.addEventListener('click', () => closeModal(customFieldModal));
  $('#btnCancelCustomField')?.addEventListener('click', () => closeModal(customFieldModal));
  $('#btnConfirmCustomField')?.addEventListener('click', async () => {
    const label = (customFieldLabel.value || '').trim();
    if (!label) { showStatus('请输入字段名称', 'error'); return; }
    const type = customFieldType.value;
    let options = [];
    if (type === 'select' || type === 'radio') {
      options = (customFieldOptions.value || '').split(',').map(s => s.trim()).filter(Boolean);
      if (options.length === 0) { showStatus('请输入至少一个选项', 'error'); return; }
    }
    const keywords = (customFieldKeywords.value || '').split(',').map(s => s.trim()).filter(Boolean);
    if (keywords.length === 0) { showStatus('请至少输入一个匹配关键词', 'error'); return; }

    if (customFieldCtx.mode === 'add') {
      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'customSchema_addField',
          profileId: currentProfileId,
          field: {
            label, type, options, keywords,
            section: customFieldCtx.sectionId,
          },
        }, resolve);
      });
      if (resp && resp.success) {
        await loadActiveProfile();
        // 重新激活当前栏目
        const tabToActivate = document.querySelector(`.tab[data-tab="${customFieldCtx.sectionId}"]`);
        if (tabToActivate) tabToActivate.click();
        closeModal(customFieldModal);
        showStatus(`已添加字段「${label}」`, 'success');
      } else {
        showStatus(`添加失败：${resp?.error || '未知错误'}`, 'error');
      }
    }
  });

  // 删除自定义字段（事件委托）
  resumeForm?.addEventListener('click', (e) => {
    if (e.target.classList.contains('cf-remove')) {
      const card = e.target.closest('.custom-field-card');
      if (!card) return;
      const fieldKey = card.dataset.fieldKey;
      const label = card.querySelector('label')?.textContent || '该字段';
      if (!confirm(`确定删除字段「${label}」吗？`)) return;
      chrome.runtime.sendMessage({
        action: 'customSchema_removeField',
        profileId: currentProfileId,
        fieldKey,
      }, async (resp) => {
        if (resp && resp.success) {
          await loadActiveProfile();
          showStatus('字段已删除', 'success');
        } else {
          showStatus(`删除失败：${resp?.error || '未知错误'}`, 'error');
        }
      });
    }
  });
  // 自定义栏目 panel 也需要事件委托（在 form 外）
  customSectionsContainer?.addEventListener('click', (e) => {
    if (e.target.classList.contains('cf-remove')) {
      const card = e.target.closest('.custom-field-card');
      if (!card) return;
      const fieldKey = card.dataset.fieldKey;
      const label = card.querySelector('label')?.textContent || '该字段';
      if (!confirm(`确定删除字段「${label}」吗？`)) return;
      chrome.runtime.sendMessage({
        action: 'customSchema_removeField',
        profileId: currentProfileId,
        fieldKey,
      }, async (resp) => {
        if (resp && resp.success) {
          await loadActiveProfile();
          showStatus('字段已删除', 'success');
        }
      });
    }
    // 处理自定义栏目内的"+ 添加字段"按钮
    if (e.target.classList.contains('btn-add-field')) {
      const sectionId = e.target.dataset.sectionId;
      openCustomFieldModal(sectionId);
    }
  });
  // 也处理 form 内的"+ 添加字段"按钮（默认栏目）
  resumeForm?.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-add-field')) {
      const sectionId = e.target.dataset.sectionId;
      openCustomFieldModal(sectionId);
    }
  });

  function openCustomFieldModal(sectionId) {
    customFieldCtx = { mode: 'add', sectionId, fieldKey: null };
    customFieldTitle.textContent = '✏ 添加自定义字段';
    customFieldLabel.value = '';
    customFieldType.value = 'text';
    customFieldOptions.value = '';
    customFieldKeywords.value = '';
    customFieldOptionsGroup.style.display = 'none';
    openModal(customFieldModal);
    setTimeout(() => customFieldLabel.focus(), 50);
  }

  // ============================================================
  // 自定义字段/栏目渲染
  // ============================================================

  // 在每个默认栏目底部注入"+ 添加字段"按钮
  function injectAddFieldButtons() {
    const defaultSectionIds = ['basic', 'id', 'origin', 'job', 'edu', 'exp', 'other'];
    defaultSectionIds.forEach(secId => {
      const panel = document.getElementById(`panel-${secId}`);
      if (!panel) return;
      // 避免重复注入
      if (panel.querySelector(`.btn-add-field[data-section-id="${secId}"]`)) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-add-field';
      btn.dataset.sectionId = secId;
      btn.textContent = '+ 添加自定义字段';
      panel.appendChild(btn);
    });
  }

  // 渲染自定义栏目（创建 tab + panel）
  function renderCustomSections(schema) {
    if (!customSectionsContainer) return;
    customSectionsContainer.innerHTML = '';
    const sections = (schema.sections || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    sections.forEach(section => {
      // 创建 tab
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'tab custom-tab';
      tab.dataset.tab = section.id;
      tab.innerHTML = `${escapeHtml(section.name)}<span class="tab-remove" title="删除栏目">×</span>`;
      tabsNav.insertBefore(tab, btnAddSection);
      // 创建 panel
      const panel = document.createElement('div');
      panel.className = 'tab-panel';
      panel.id = `panel-${section.id}`;
      panel.dataset.customSection = section.id;
      // 添加"+ 添加字段"按钮
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'btn-add-field';
      addBtn.dataset.sectionId = section.id;
      addBtn.textContent = '+ 添加自定义字段';
      panel.appendChild(addBtn);
      customSectionsContainer.appendChild(panel);
    });
  }

  // 渲染自定义字段到对应栏目
  function renderCustomFields(schema) {
    const fields = schema.fields || {};
    // 按 section 分组
    const bySection = {};
    for (const [key, meta] of Object.entries(fields)) {
      const sec = meta.section || 'other';
      if (!bySection[sec]) bySection[sec] = [];
      bySection[sec].push({ key, ...meta });
    }
    // 按 order 排序
    for (const sec of Object.keys(bySection)) {
      bySection[sec].sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    // 渲染到对应 panel
    for (const [secId, fieldsList] of Object.entries(bySection)) {
      const panel = document.getElementById(`panel-${secId}`);
      if (!panel) continue;
      // 找到"+ 添加字段"按钮，把字段插在它前面
      const addBtn = panel.querySelector(`.btn-add-field[data-section-id="${secId}"]`);
      fieldsList.forEach(f => {
        const card = buildCustomFieldCard(f);
        if (addBtn) {
          addBtn.insertAdjacentElement('beforebegin', card);
        } else {
          panel.appendChild(card);
        }
      });
    }
  }

  // 构建单个自定义字段卡片
  function buildCustomFieldCard(field) {
    const card = document.createElement('div');
    card.className = 'custom-field-card';
    card.dataset.fieldKey = field.key;
    const value = currentFields[field.key] || '';
    let inputHtml = '';
    const escapedValue = escapeHtml(value);
    const escapedLabel = escapeHtml(field.label);
    if (field.type === 'textarea') {
      inputHtml = `<textarea rows="2" data-storage="${field.key}" placeholder="请输入${escapedLabel}">${escapedValue}</textarea>`;
    } else if (field.type === 'select') {
      const opts = (field.options || []).map(o => {
        const sel = o === value ? 'selected' : '';
        return `<option value="${escapeHtml(o)}" ${sel}>${escapeHtml(o)}</option>`;
      }).join('');
      inputHtml = `<select data-storage="${field.key}"><option value="">请选择</option>${opts}</select>`;
    } else if (field.type === 'radio') {
      const opts = (field.options || []).map(o => {
        const sel = o === value ? 'checked' : '';
        return `<label class="radio-inline"><input type="radio" name="cf_${field.key}" data-storage="${field.key}" value="${escapeHtml(o)}" ${sel}> ${escapeHtml(o)}</label>`;
      }).join('');
      inputHtml = `<div class="radio-group">${opts}</div>`;
    } else if (field.type === 'month') {
      inputHtml = `<input type="month" data-storage="${field.key}" value="${escapedValue}">`;
    } else if (field.type === 'tel') {
      inputHtml = `<input type="tel" data-storage="${field.key}" value="${escapedValue}" placeholder="请输入${escapedLabel}">`;
    } else if (field.type === 'email') {
      inputHtml = `<input type="email" data-storage="${field.key}" value="${escapedValue}" placeholder="请输入${escapedLabel}">`;
    } else {
      inputHtml = `<input type="text" data-storage="${field.key}" value="${escapedValue}" placeholder="请输入${escapedLabel}">`;
    }
    card.innerHTML = `
      <span class="cf-tag">自定义</span>
      <button type="button" class="cf-remove" title="删除字段">×</button>
      <div class="form-group">
        <label>${escapedLabel}</label>
        ${inputHtml}
      </div>
    `;
    return card;
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 重新绑定 Tab 切换（支持动态新增的 .tab）
  function bindTabClicks() {
    document.querySelectorAll('.tab').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-remove')) return; // 删除按钮单独处理
        const target = btn.dataset.tab;
        if (!target) return;
        document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const targetPanel = document.getElementById(`panel-${target}`);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });
  }

  // 监听 tabsNav 子树变化，自动绑定新 tab
  if (tabsNav) {
    const observer = new MutationObserver(() => bindTabClicks());
    observer.observe(tabsNav, { childList: true });
  }
  // 初始绑定一次（覆盖 popup.html 中静态定义的默认 tab）
  bindTabClicks();

  // ============================================================
  // 表单数据收集/填充
  // ============================================================

  function collectFormData() {
    const data = {};
    // 同时收集 form 内和 customSectionsContainer 内的 [data-storage]
    const scope = customSectionsContainer
      ? [resumeForm, customSectionsContainer]
      : [resumeForm];
    // 先收集非 radio 字段
    scope.forEach(root => {
      if (!root) return;
      root.querySelectorAll('[data-storage]:not([type="radio"])').forEach(input => {
        const key = input.dataset.storage;
        if (!key) return;
        const val = (input.value || '').trim();
        if (val !== '') {
          data[key] = val;
        }
      });
    });
    // radio 字段：每个 name 取 checked 的那个
    scope.forEach(root => {
      if (!root) return;
      root.querySelectorAll('input[type="radio"][data-storage]:checked').forEach(input => {
        const key = input.dataset.storage;
        if (!key || data[key]) return;
        const val = (input.value || '').trim();
        if (val !== '') {
          data[key] = val;
        }
      });
    });
    return data;
  }

  function populateForm(data) {
    // 先重置动态条目容器
    const internContainer = $('#internEntriesContainer');
    const projectContainer = $('#projectEntriesContainer');
    if (internContainer) internContainer.innerHTML = '';
    if (projectContainer) projectContainer.innerHTML = '';

    // 收集实习经历条目（支持旧格式 intern_company 和新格式 intern_company_1）
    const internIndices = collectEntryIndices(data, 'intern');
    const internCount = internIndices.length > 0 ? internIndices.length : 1;
    for (let i = 0; i < internCount; i++) {
      const idx = i + 1;
      const entryData = internIndices.includes(idx)
        ? {
            company: data[`intern_company_${idx}`],
            position: data[`intern_position_${idx}`],
            duration: data[`intern_duration_${idx}`],
            desc: data[`intern_desc_${idx}`],
          }
        : { company: data.intern_company, position: data.intern_position, duration: data.intern_duration, desc: data.intern_desc };
      addInternEntry(entryData);
    }

    // 收集项目经历条目
    const projectIndices = collectEntryIndices(data, 'project');
    const projectCount = projectIndices.length > 0 ? projectIndices.length : 1;
    for (let i = 0; i < projectCount; i++) {
      const idx = i + 1;
      const entryData = projectIndices.includes(idx)
        ? {
            name: data[`project_name_${idx}`],
            role: data[`project_role_${idx}`],
            duration: data[`project_duration_${idx}`],
            desc: data[`project_desc_${idx}`],
          }
        : { name: data.project_name, role: data.project_role, duration: data.project_duration, desc: data.project_desc };
      addProjectEntry(entryData);
    }

    // 填充非动态字段（含自定义字段，跨 resumeForm 和 customSectionsContainer）
    const scope = customSectionsContainer ? [resumeForm, customSectionsContainer] : [resumeForm];
    scope.forEach(root => {
      if (!root) return;
      root.querySelectorAll('[data-storage]:not([type="radio"])').forEach(input => {
        const key = input.dataset.storage;
        if (!key) return;
        if (data[key] !== undefined && data[key] !== null) {
          input.value = data[key];
        }
      });
      // radio：按 value 匹配 checked
      root.querySelectorAll('input[type="radio"][data-storage]').forEach(input => {
        const key = input.dataset.storage;
        if (!key) return;
        input.checked = (data[key] !== undefined && String(data[key]) === input.value);
      });
    });
  }

  // ============================================================
  // 动态条目管理（实习/项目经历支持多条目）
  // ============================================================

  function collectEntryIndices(data, type) {
    const indices = [];
    const prefix = type === 'intern' ? 'intern' : 'project';
    const suffix = type === 'intern' ? 'company' : 'name';
    for (const key of Object.keys(data)) {
      const m = key.match(new RegExp(`^${prefix}_${suffix}_(\\d+)$`));
      if (m) indices.push(parseInt(m[1], 10));
    }
    return indices.sort((a, b) => a - b);
  }

  function reindexEntries(container, type) {
    const groups = container.querySelectorAll('.entry-group');
    groups.forEach((group, i) => {
      const idx = i + 1;
      group.dataset.index = idx;
      group.querySelector('.entry-index').textContent = `#${idx}`;
      // 更新 data-storage 属性
      const fields = type === 'intern'
        ? ['company', 'position', 'duration', 'desc']
        : ['name', 'role', 'duration', 'desc'];
      fields.forEach(f => {
        const input = group.querySelector(`[data-field="${f}"]`);
        if (input) input.dataset.storage = `${type}_${f}_${idx}`;
      });
    });
  }

  function addInternEntry(data = {}) {
    const container = $('#internEntriesContainer');
    const idx = container.querySelectorAll('.entry-group').length + 1;
    const group = document.createElement('div');
    group.className = 'entry-group';
    group.dataset.index = idx;
    group.innerHTML = `
      <div class="entry-group-header">
        <span class="entry-index">#${idx}</span>
        <button type="button" class="btn-remove-entry">删除</button>
      </div>
      <div class="form-group">
        <label>公司</label>
        <input type="text" placeholder="如：字节跳动" data-field="company" data-storage="intern_company_${idx}" value="${data.company || ''}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>职位</label>
          <input type="text" placeholder="如：数据分析实习生" data-field="position" data-storage="intern_position_${idx}" value="${data.position || ''}">
        </div>
        <div class="form-group">
          <label>时间</label>
          <input type="text" placeholder="如：2025.06-2025.09" data-field="duration" data-storage="intern_duration_${idx}" value="${data.duration || ''}">
        </div>
      </div>
      <div class="form-group">
        <label>工作描述</label>
        <textarea rows="3" placeholder="描述你的工作内容和成果..." data-field="desc" data-storage="intern_desc_${idx}">${data.desc || ''}</textarea>
      </div>
    `;
    container.appendChild(group);
    // 绑定删除事件
    group.querySelector('.btn-remove-entry').addEventListener('click', () => {
      if (container.querySelectorAll('.entry-group').length <= 1) {
        showStatus('至少保留一条实习经历', 'info');
        return;
      }
      group.remove();
      reindexEntries(container, 'intern');
    });
    return group;
  }

  function addProjectEntry(data = {}) {
    const container = $('#projectEntriesContainer');
    const idx = container.querySelectorAll('.entry-group').length + 1;
    const group = document.createElement('div');
    group.className = 'entry-group';
    group.dataset.index = idx;
    group.innerHTML = `
      <div class="entry-group-header">
        <span class="entry-index">#${idx}</span>
        <button type="button" class="btn-remove-entry">删除</button>
      </div>
      <div class="form-group">
        <label>项目名称</label>
        <input type="text" placeholder="如：校园二手交易平台" data-field="name" data-storage="project_name_${idx}" value="${data.name || ''}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>角色</label>
          <input type="text" placeholder="如：项目负责人" data-field="role" data-storage="project_role_${idx}" value="${data.role || ''}">
        </div>
        <div class="form-group">
          <label>时间</label>
          <input type="text" placeholder="如：2025.03-2025.06" data-field="duration" data-storage="project_duration_${idx}" value="${data.duration || ''}">
        </div>
      </div>
      <div class="form-group">
        <label>项目描述</label>
        <textarea rows="3" placeholder="描述项目内容、技术栈和成果..." data-field="desc" data-storage="project_desc_${idx}">${data.desc || ''}</textarea>
      </div>
    `;
    container.appendChild(group);
    group.querySelector('.btn-remove-entry').addEventListener('click', () => {
      if (container.querySelectorAll('.entry-group').length <= 1) {
        showStatus('至少保留一条项目经历', 'info');
        return;
      }
      group.remove();
      reindexEntries(container, 'project');
    });
    return group;
  }

  // 初始化：确保至少有一个空条目
  function ensureDefaultEntries() {
    const internContainer = $('#internEntriesContainer');
    const projectContainer = $('#projectEntriesContainer');
    if (internContainer && internContainer.querySelectorAll('.entry-group').length === 0) {
      addInternEntry();
    }
    if (projectContainer && projectContainer.querySelectorAll('.entry-group').length === 0) {
      addProjectEntry();
    }
  }

  // 添加按钮事件（立即绑定，DOM已在popup.html中定义）
  function bindAddButtons() {
    const btnAddIntern = $('#btnAddIntern');
    const btnAddProject = $('#btnAddProject');
    if (btnAddIntern) btnAddIntern.addEventListener('click', () => addInternEntry());
    if (btnAddProject) btnAddProject.addEventListener('click', () => addProjectEntry());
  }
  bindAddButtons();

  // ============================================================
  // Status Bar
  // ============================================================

  let statusTimer = null;

  function showStatus(message, type = 'info') {
    if (statusTimer) clearTimeout(statusTimer);
    statusBar.textContent = message;
    statusBar.className = `status-bar visible ${type}`;
    statusTimer = setTimeout(() => {
      statusBar.classList.remove('visible');
    }, 3000);
  }

  // ============================================================
  // Actions
  // ============================================================

  // 保存
  btnSave.addEventListener('click', async () => {
    await saveProfile();
    showStatus('简历已保存到本地', 'success');
  });

  // 恢复默认
  btnReset.addEventListener('click', async () => {
    if (!confirm('确定恢复为默认简历数据吗？当前修改将丢失。')) return;
    if (typeof DEFAULT_PROFILES !== 'undefined' && DEFAULT_PROFILES[currentProfileId]) {
      currentFields = { ...DEFAULT_PROFILES[currentProfileId].fields };
    }
    populateForm(currentFields);
    await saveProfile();
    showStatus('已恢复默认简历数据', 'info');
  });

  // 导出JSON — 将当前模板数据导出为JSON文件（用于备份/迁移）
  btnExport.addEventListener('click', () => {
    const data = collectFormData();
    const exportData = {
      _meta: {
        exportTime: new Date().toISOString(),
        profileId: currentProfileId,
        profileName: profileSelector.selectedOptions[0]?.textContent || currentProfileId,
        version: '2.0',
      },
      fields: data,
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume_${currentProfileId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('简历配置已导出为JSON文件', 'success');
  });

  // 导入JSON — 从JSON文件恢复数据（与导出配对，用于备份恢复/跨设备迁移）
  btnImport.addEventListener('click', () => {
    jsonFileInput.click();
  });

  jsonFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // 兼容两种格式：带 _meta 的导出格式 和 纯字段格式
      let importedFields;
      if (parsed._meta && parsed.fields) {
        importedFields = parsed.fields;
      } else {
        importedFields = parsed;
      }

      // 过滤只保留已知字段
      const validFields = {};
      const knownKeys = typeof RESUME_FIELDS !== 'undefined'
        ? Object.keys(RESUME_FIELDS)
        : Object.keys(importedFields);
      for (const key of Object.keys(importedFields)) {
        if (knownKeys.includes(key)) {
          validFields[key] = String(importedFields[key]);
        }
      }

      if (Object.keys(validFields).length === 0) {
        showStatus('JSON文件中未找到有效简历字段', 'error');
        return;
      }

      if (!confirm(`即将导入 ${Object.keys(validFields).length} 个字段，将覆盖当前模板数据。是否继续？`)) {
        return;
      }

      currentFields = { ...currentFields, ...validFields };
      populateForm(currentFields);
      await saveProfile();
      showStatus(`已从JSON导入 ${Object.keys(validFields).length} 个字段`, 'success');
    } catch (err) {
      showStatus(`导入失败: ${err.message}`, 'error');
    } finally {
      jsonFileInput.value = '';
    }
  });

  // 加载 — 从本地存储重新加载已保存的数据（丢弃当前未保存的修改）
  btnLoad.addEventListener('click', async () => {
    await loadActiveProfile();
    showStatus('已从本地存储加载最新数据', 'success');
  });

  // 一键填充当前页面
  btnFillCurrent.addEventListener('click', async () => {
    btnFillCurrent.disabled = true;
    btnFillCurrent.textContent = '\u23F3 正在识别页面...';
    showStatus('正在识别页面表单并填充...', 'info');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        throw new Error('无法获取当前页面');
      }

      // 禁止在浏览器内部页面使用
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        throw new Error('浏览器内部页面不支持填充，请在普通网页使用');
      }

      const data = collectFormData();

      // 尝试发送消息，如果 content script 未加载则主动注入后重试
      let response;
      try {
        response = await chrome.tabs.sendMessage(tab.id, {
          action: 'fillForm',
          data: data,
        });
      } catch (sendErr) {
        if (sendErr.message?.includes('Receiving end does not exist') || sendErr.message?.includes('no tab with id') || sendErr.message?.includes('message port closed')) {
          // Content script 未注入，主动注入
          showStatus('正在初始化页面脚本...', 'info');
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id, allFrames: true },
              files: ['content-script.js']
            });
            // 等待脚本初始化
            await new Promise(r => setTimeout(r, 300));
            // 重试发送消息
            response = await chrome.tabs.sendMessage(tab.id, {
              action: 'fillForm',
              data: data,
            });
          } catch (injectErr) {
            throw new Error('页面脚本注入失败，请刷新页面后重试: ' + injectErr.message);
          }
        } else {
          throw sendErr;
        }
      }

      if (response && (response.filled > 0 || response.filledCount > 0)) {
        const count = response.filled || response.filledCount || 0;
        const total = response.total || '?';
        const pending = response.llmPending || 0;
        const tip = pending > 0 ? `，AI 正在后台补充 ${pending} 个下拉字段...` : '';
        showStatus(`成功填充 ${count}/${total} 个字段${tip}`, 'success');
      } else if (response && response.success === false) {
        showStatus(response.error || '未检测到可填充的表单字段', 'error');
      } else {
        showStatus('未检测到可填充的表单字段，请确认页面上有表单', 'warning');
      }
    } catch (err) {
      console.error('[JobPilot] Fill form error:', err);
      showStatus(`填充失败: ${err.message}`, 'error');
    } finally {
      btnFillCurrent.disabled = false;
      btnFillCurrent.innerHTML = '&#x26A1; 一键填充当前页面';
    }
  });

  // 上传简历按钮
  btnUploadResume.addEventListener('click', () => {
    resumeFileInput.click();
  });

  resumeFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    showStatus('正在解析简历文件...', 'info');
    btnUploadResume.disabled = true;
    btnUploadResume.textContent = '\u23F3 解析中...';

    try {
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length < 10) {
        showStatus('未能从文件中提取到文本内容，请检查文件格式', 'error');
        return;
      }

      showStatus('正在AI识别简历内容（LLM 优先，规则兜底）...', 'info');
      const parsed = await aiParseResumeWithFallback(text);

      if (parsed && Object.keys(parsed).length > 0) {
        const engine = parsed.__engine || 'rule';
        const llmErr = parsed.__llmError || '';
        // 清理内部标记字段，不存入 profile
        delete parsed.__engine;
        delete parsed.__llmError;
        currentFields = { ...currentFields, ...parsed };
        populateForm(currentFields);
        await saveProfile();
        const cnt = Object.keys(parsed).length;
        const tag = engine === 'llm' ? 'LLM' : '规则引擎';
        const tip = (engine === 'rule' && llmErr) ? `（LLM 不可用：${llmErr}）` : '';
        showStatus(`识别成功（${tag}）！已填入 ${cnt} 个字段${tip}`, 'success');
      } else {
        showStatus('AI识别未提取到有效字段，请手动填写', 'error');
      }
    } catch (err) {
      console.error('[JobPilot] Resume parse error:', err);
      showStatus(`解析失败: ${err.message}`, 'error');
    } finally {
      btnUploadResume.disabled = false;
      btnUploadResume.innerHTML = '&#x1F4C4; 上传简历';
      resumeFileInput.value = '';
      pendingUploadToNewProfile = null;
    }
  });

  // ============================================================
  // 文件文本提取
  // ============================================================

  async function extractTextFromFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'txt') {
      return await file.text();
    }

    if (ext === 'pdf') {
      // 使用 PDF.js（如果已加载）或 fallback
      if (typeof pdfjsLib !== 'undefined') {
        // 设置 worker 路径（Chrome扩展中需要使用本地worker）
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.js');
        }
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
          data: arrayBuffer,
          // 启用 CMap 以支持中文 CID 字体
          cMapUrl: chrome.runtime.getURL('node_modules/pdfjs-dist/cmaps/'),
          cMapPacked: true,
          useSystemFonts: true
        }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          // 按行组织文本：根据 transform 的 y 坐标判断换行
          let lastY = null;
          let pageText = '';
          for (const item of content.items) {
            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 2) {
              pageText += '\n';
            }
            pageText += item.str;
            if (item.hasEOL) pageText += '\n';
            lastY = item.transform[5];
          }
          fullText += pageText + '\n';
        }
        return fullText;
      } else {
        // Fallback: 从二进制流提取PDF文本
        const arrayBuffer = await file.arrayBuffer();
        return extractTextFromPDFBinary(arrayBuffer);
      }
    }

    if (ext === 'docx') {
      // 优先使用 mammoth.js（如果已加载），否则使用内置解析器
      if (typeof mammoth !== 'undefined') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      } else {
        // 内置 DOCX 解析器：DOCX 是 ZIP 格式，直接解析 word/document.xml
        const arrayBuffer = await file.arrayBuffer();
        return await extractTextFromDocx(arrayBuffer);
      }
    }

    if (ext === 'doc') {
      throw new Error('旧版.doc格式暂不支持，请转换为.docx或PDF格式');
    }

    if (['png', 'jpg', 'jpeg'].includes(ext)) {
      if (typeof Tesseract !== 'undefined') {
        const imgUrl = URL.createObjectURL(file);
        const result = await Tesseract.recognize(imgUrl, 'chi_sim+eng');
        URL.revokeObjectURL(imgUrl);
        return result.data.text;
      } else {
        throw new Error('图片OCR组件未加载，请使用PDF或TXT格式');
      }
    }

    // 其他格式尝试按文本读取
    return await file.text();
  }

  // ============================================================
  // 内置 DOCX 文本提取（无需外部库）
  // ============================================================

  async function extractTextFromDocx(arrayBuffer) {
    const uint8 = new Uint8Array(arrayBuffer);
    const targetFile = 'word/document.xml';
    const targetBytes = new TextEncoder().encode(targetFile);

    // 在 ZIP 中搜索 word/document.xml 的本地文件头
    // ZIP 本地文件头签名: 0x50 0x4B 0x03 0x04 (PK\x03\x04)
    for (let i = 0; i < uint8.length - 30; i++) {
      if (uint8[i] !== 0x50 || uint8[i + 1] !== 0x4B || uint8[i + 2] !== 0x03 || uint8[i + 3] !== 0x04) {
        continue;
      }

      // 解析本地文件头
      const view = new DataView(arrayBuffer, i);
      const compressionMethod = view.getUint16(8, true);
      const compressedSize = view.getUint32(18, true);
      const uncompressedSize = view.getUint32(22, true);
      const fileNameLength = view.getUint16(26, true);
      const extraFieldLength = view.getUint16(28, true);

      const fileNameStart = i + 30;
      const fileNameEnd = fileNameStart + fileNameLength;
      if (fileNameEnd > uint8.length) continue;

      // 检查文件名是否匹配
      const entryFileName = uint8.slice(fileNameStart, fileNameEnd);
      if (entryFileName.length !== targetBytes.length) continue;
      let match = true;
      for (let j = 0; j < targetBytes.length; j++) {
        if (entryFileName[j] !== targetBytes[j]) { match = false; break; }
      }
      if (!match) continue;

      // 找到 word/document.xml，提取数据
      const dataStart = fileNameEnd + extraFieldLength;
      const dataEnd = dataStart + compressedSize;
      if (dataEnd > uint8.length) continue;

      const compressedData = uint8.slice(dataStart, dataEnd);
      let xmlText;

      if (compressionMethod === 0) {
        // Stored (无压缩)
        xmlText = new TextDecoder('utf-8').decode(compressedData);
      } else if (compressionMethod === 8) {
        // Deflate 压缩
        try {
          const ds = new DecompressionStream('deflate-raw');
          const stream = new Blob([compressedData]).stream().pipeThrough(ds);
          xmlText = await new Response(stream).text();
        } catch (e) {
          throw new Error('DOCX解压失败: ' + e.message);
        }
      } else {
        throw new Error(`不支持的压缩方法: ${compressionMethod}`);
      }

      return extractTextFromDocxXml(xmlText);
    }

    throw new Error('DOCX文件中未找到 word/document.xml');
  }

  function extractTextFromDocxXml(xml) {
    // 将段落结束标签转换为换行，保留文本结构
    let text = xml
      .replace(/<\/w:p>/g, '\n')
      .replace(/<w:tab[^>]*\/>/g, '\t')
      .replace(/<w:br[^>]*\/>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return text;
  }

  // ============================================================
  // PDF 二进制文本提取（Fallback，无需 PDF.js）
  // ============================================================

  function extractTextFromPDFBinary(arrayBuffer) {
    const uint8 = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('latin1');
    const raw = decoder.decode(uint8);
    const texts = [];

    // 提取 BT...ET 文本块中的文本
    // PDF 文本格式: BT ... (text) Tj ... ET 或 (text1) Tj (text2) Tj
    const textBlockPattern = /BT\s+([\s\S]*?)\s+ET/g;
    let blockMatch;

    while ((blockMatch = textBlockPattern.exec(raw)) !== null) {
      const block = blockMatch[1];
      // 匹配 (text) Tj 或 (text) TJ
      const textPattern = /\(([^)]*)\)\s*T[jJ]/g;
      let textMatch;
      const lineTexts = [];
      while ((textMatch = textPattern.exec(block)) !== null) {
        let t = textMatch[1];
        // 反转义 PDF 字符串
        t = t.replace(/\\n/g, '\n')
             .replace(/\\r/g, '\r')
             .replace(/\\t/g, '\t')
             .replace(/\\\(/g, '(')
             .replace(/\\\)/g, ')')
             .replace(/\\\\/g, '\\');
        if (t.trim()) lineTexts.push(t);
      }
      // 检测换行操作符 T* 或 Td/TD
      const lines = block.split(/T\*|Td|TD/);
      if (lines.length > 1 && lineTexts.length > 0) {
        // 有多个位置操作，可能每行一个文本
        texts.push(lineTexts.join('\n'));
      } else if (lineTexts.length > 0) {
        texts.push(lineTexts.join(''));
      }
    }

    // 如果 BT/ET 方法提取失败，尝试直接搜索 (text) Tj 模式
    if (texts.length === 0) {
      const allTextPattern = /\(([^)]{2,})\)\s*T[jJ]/g;
      let m;
      while ((m = allTextPattern.exec(raw)) !== null) {
        let t = m[1].replace(/\\n/g, '\n').replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\\\/g, '\\');
        if (t.trim() && !/^[\d\.\-\s]+$/.test(t)) {
          texts.push(t);
        }
      }
    }

    // 尝试用 UTF-8 重新解码中文字符
    // PDF 中的中文可能用 UTF-16BE 编码，或者用 CID 字体
    let result = texts.join('\n');

    // 如果 latin1 解码结果中有大量高位字符，尝试 UTF-8 修复
    if (/[\x80-\xff]/.test(result)) {
      try {
        // 将 latin1 字符串转回 bytes，再用 UTF-8 解码
        const bytes = new Uint8Array(result.length);
        for (let i = 0; i < result.length; i++) {
          bytes[i] = result.charCodeAt(i);
        }
        const utf8Result = new TextDecoder('utf-8').decode(bytes);
        if (/[\u4e00-\u9fa5]/.test(utf8Result)) {
          result = utf8Result;
        }
      } catch (e) {
        // 忽略，使用原始结果
      }
    }

    return result;
  }

  // ============================================================
  // 辅助函数：按项目符号或角色关键词切分多个条目
  // ============================================================

  function splitEntriesByBullet(lines, type = 'project') {
    const entries = [];
    let currentEntry = [];

    // 角色关键词（用于无项目符号时识别条目边界）
    const rolePattern = type === 'project'
      ? /(组长|组\s*员|负责人|核心开发者|开发者|队长|成\s*员|主管|参与者)$/
      : /(实习生|助理|工程师|专员|分析师|实习)$/;

    for (const line of lines) {
      // 检测条目起始标记
      const isBulletStart = /^[⚫●•·▪◦]/.test(line);
      const isDateStart = /^\d{4}[\.\-\/年]/.test(line);
      // 无项目符号时：检测以角色词结尾的行作为新条目起始
      const isRoleEnd = rolePattern.test(line.trim());

      if ((isBulletStart || isDateStart || isRoleEnd) && currentEntry.length > 0) {
        // 如果当前行以角色词结尾，但它不是第一个条目，则需要判断：
        // 如果currentEntry的第一行也以角色词结尾或以项目符号开头，说明这是新条目
        const isFirstLineEntryStart = currentEntry.length > 0 && (
          /^[⚫●•·▪◦]/.test(currentEntry[0]) ||
          rolePattern.test(currentEntry[0].trim()) ||
          /^\d{4}[\.\-\/年]/.test(currentEntry[0])
        );

        if (isFirstLineEntryStart) {
          // 当前条目已有起始行，这行是新条目的起始
          entries.push(currentEntry);
          currentEntry = [];
        }
      }
      currentEntry.push(line);
    }
    if (currentEntry.length > 0) {
      entries.push(currentEntry);
    }
    return entries;
  }

  // ============================================================
  // AI 简历解析（分区域 + 多策略匹配）
  // ============================================================

  /**
   * LLM 优先 + 规则兜底的简历解析包装函数
   * 流程：
   *   1. 调用 background.llmParseResume（敏感字段已在 background 过滤）
   *   2. LLM 成功 → 用规则引擎补充 LLM 未识别的字段
   *   3. LLM 失败（无 Key/网络/超时/JSON 解析失败）→ 降级到规则引擎
   *
   * @param {string} text 简历文本
   * @returns {Promise<object>} 解析结果，含 __engine 字段标记来源
   */
  async function aiParseResumeWithFallback(text) {
    let llmResult = null;
    let llmError = null;

    try {
      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'llmParseResume', text }, resolve);
      });

      if (resp && resp.success && resp.data) {
        llmResult = resp.data;
        console.log('[JobPilot] LLM 简历解析成功，字段数:', Object.keys(llmResult).length);
      } else {
        llmError = resp ? resp.error || resp.code : '无响应';
        console.warn('[JobPilot] LLM 简历解析失败，降级规则引擎:', llmError);
      }
    } catch (err) {
      llmError = err.message;
      console.warn('[JobPilot] LLM 调用异常，降级规则引擎:', err);
    }

    // 规则引擎兜底
    let ruleResult = {};
    try {
      ruleResult = await aiParseResume(text) || {};
    } catch (err) {
      console.error('[JobPilot] 规则引擎也失败:', err);
    }

    // 合并：LLM 结果优先，规则引擎补充 LLM 未识别的字段
    if (llmResult) {
      const merged = { ...ruleResult, ...llmResult };
      merged.__engine = 'llm';
      return merged;
    }

    ruleResult.__engine = 'rule';
    if (llmError) ruleResult.__llmError = llmError;
    return ruleResult;
  }

  async function aiParseResume(text) {
    const result = {};

    // 清理文本
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\u00a0/g, ' ');
    const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // ============================================================
    // 第一步：分区域解析 — 按常见简历标题切分
    // ============================================================

    const sectionHeaders = {
      basic:    /^(基本信息|个人基本信息|个人信息|个人资料|联系方式|简历摘要|个人简介)/i,
      edu:      /^(教育背景|教育经历|学历背景|教育信息)/i,
      work:     /^(工作经历|工作经验|工作背景)/i,
      intern:   /^(实习经历|实习经验|实习工作)/i,
      project:  /^(项目经历|项目经验|项目背景)/i,
      skill:    /^(技能|专业技能|技能奖项|技能清单|技能特长|专业技能特长|技术栈)/i,
      award:    /^(奖励荣誉|获奖|荣誉|所获奖项|奖项)/i,
      campus:   /^(校园经历|校园活动|社会实践|课外活动)/i,
      self:     /^(自我评价|个人评价|自我介绍|自我描述|个人总结)/i,
      family:   /^(家庭情况|家庭背景|家庭信息|家庭成员)/i,
    };

    const sections = {};
    let currentSection = 'header';

    for (const line of lines) {
      let matchedHeader = null;
      if (line.length <= 12) {
        for (const [name, pattern] of Object.entries(sectionHeaders)) {
          if (pattern.test(line)) {
            matchedHeader = name;
            break;
          }
        }
      }
      if (matchedHeader) {
        currentSection = matchedHeader;
        if (!sections[currentSection]) sections[currentSection] = [];
        continue;
      }
      if (!sections[currentSection]) sections[currentSection] = [];
      sections[currentSection].push(line);
    }

    // ============================================================
    // 第二步：基本信息解析
    // ============================================================

    const basicLines = sections.basic || sections.header || [];

    // 姓名 — 策略1: 有"姓名："标签
    let nameMatch = cleanText.match(/(?:姓名|名字)[：:\s]*([\u4e00-\u9fa5]{2,4})/);
    if (nameMatch) {
      result.name = nameMatch[1];
    } else if (basicLines.length > 0) {
      // 策略2: 基本信息/标题区域第一行的前2-4个中文字符
      const firstLine = basicLines[0];
      const nameAtStart = firstLine.match(/^([\u4e00-\u9fa5]{2,4})(?:\s|　|$|籍贯|电话|邮箱|电子邮件|性别|男|女)/);
      if (nameAtStart) {
        result.name = nameAtStart[1];
      } else {
        // 策略3: 标题文本本身就是姓名
        const titleMatch = firstLine.match(/^([\u4e00-\u9fa5]{2,4})$/);
        if (titleMatch) result.name = titleMatch[1];
      }
    }

    // 手机号 — 全局搜索
    const phoneMatch = cleanText.match(/(?:手机|电话|联系方式|mobile|phone|tel|联系电话)[：:\s]*((?:\+86)?\s?1[3-9]\d[\-\s]?\d{4}[\-\s]?\d{4})/i);
    if (phoneMatch) {
      result.phone = phoneMatch[1].replace(/[\-\s]/g, '');
    } else {
      const phoneFallback = cleanText.match(/(1[3-9]\d[\-\s]?\d{4}[\-\s]?\d{4})/);
      if (phoneFallback) result.phone = phoneFallback[1].replace(/[\-\s]/g, '');
    }

    // 邮箱 — 全局搜索
    const emailMatch = cleanText.match(/(?:邮箱|电子邮件|email|e-mail|mail|电子邮箱)[：:\s]*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch) {
      result.email = emailMatch[1];
    } else {
      const emailFallback = cleanText.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
      if (emailFallback) result.email = emailFallback[1];
    }

    // 性别
    const genderMatch = cleanText.match(/(?:性别|sex|gender)[：:\s]*(男|女|男性|女性|male|female)/i);
    if (genderMatch) {
      const g = genderMatch[1];
      result.gender = (g === '男' || g === '男性' || g.toLowerCase() === 'male') ? '男' : '女';
    }

    // 籍贯
    const nativeMatch = cleanText.match(/(?:籍贯|老家)[：:\s]*([\u4e00-\u9fa5]{2,20}(?:省|市|县|区|镇|村)?)/i);
    if (nativeMatch) result.native_place = nativeMatch[1];

    // 出生地
    const birthplaceMatch = cleanText.match(/(?:出生地)[：:\s]*([\u4e00-\u9fa5]{2,20})/i);
    if (birthplaceMatch) result.birthplace = birthplaceMatch[1];

    // 出生年月
    const birthMatch = cleanText.match(/(?:出生|生日|出生日期|出生年月|出生年份)[：:\s]*(\d{4})[\.\-\/年](\d{1,2})/i);
    if (birthMatch) {
      result.birth = `${birthMatch[1]}-${birthMatch[2].padStart(2, '0')}`;
    }

    // 年龄
    const ageMatch = cleanText.match(/(?:年龄|岁)[：:\s]*(\d{1,2})/);
    if (ageMatch) result.age = ageMatch[1];

    // 身高
    const heightMatch = cleanText.match(/(?:身高)[：:\s]*(\d{3})\s*(?:cm|CM|厘米)?/i);
    if (heightMatch) result.height = heightMatch[1];

    // 体重
    const weightMatch = cleanText.match(/(?:体重)[：:\s]*(\d{2,3})\s*(?:kg|KG|公斤)?/i);
    if (weightMatch) result.weight = weightMatch[1];

    // 婚姻状况
    const maritalMatch = cleanText.match(/(?:婚姻|婚姻状况|婚否)[：:\s]*(未婚|已婚|离异|丧偶|单身)/i);
    if (maritalMatch) {
      result.marital_status = maritalMatch[1] === '单身' ? '未婚' : maritalMatch[1];
    }

    // 政治面貌
    const politicalMatch = cleanText.match(/(?:政治面貌|政治)[：:\s]*(中共党员|中共预备党员|共青团员|群众|民主党派|党员|团员)/i);
    if (politicalMatch) {
      const p = politicalMatch[1];
      if (p === '党员') result.political_status = '中共党员';
      else if (p === '团员') result.political_status = '共青团员';
      else result.political_status = p;
    }

    // 身份证号
    const idMatch = cleanText.match(/(?:身份证|身份证号|身份证号码|证件号码|证件号)[：:\s]*(\d{17}[\dXx])/i);
    if (idMatch) result.id_number = idMatch[1];

    // 现居地
    const residenceMatch = cleanText.match(/(?:现居|现居地|现居城市|现住址|现住|居住地|目前居住)[：:\s]*([\u4e00-\u9fa5]{2,20}(?:省|市|县|区)?)/i);
    if (residenceMatch) result.location = residenceMatch[1];

    // 期望薪资
    const salaryMatch = cleanText.match(/(?:期望薪资|期望月薪|薪资要求|薪资期望|期望薪水|期望工资)[：:\s]*(\d+[kKk]?\s*[\-\~至到]\s*\d+[kKk]?)/i);
    if (salaryMatch) result.expected_salary = salaryMatch[1];

    // ============================================================
    // 第三步：教育经历解析
    // ============================================================

    const eduLines = sections.edu || [];
    if (eduLines.length > 0) {
      // 学历优先级：博士 > 硕士 > 本科 > 大专 > 高中
      const degreePriority = { '博士': 5, '硕士': 4, '本科': 3, '大专': 2, '高中': 1 };
      let bestDegreeLevel = 0;

      for (const line of eduLines) {
        // 匹配学校名（取第一个）
        const schoolMatch = line.match(/([\u4e00-\u9fa5]{2,20}(?:大学|学院|学校|University))/i);
        if (schoolMatch && !result.school) {
          result.school = schoolMatch[1];
        }

        // 匹配学历 — 取最高学历
        const degreeMatch = line.match(/(博士|硕士|本科|大专|专科|学士|研究生|MBA|EMBA|高中|中专)/i);
        if (degreeMatch) {
          let d = degreeMatch[1];
          if (d === '研究生') d = '硕士';
          else if (d === '专科') d = '大专';
          else if (d === '学士') d = '本科';
          const level = degreePriority[d] || 0;
          if (level > bestDegreeLevel) {
            bestDegreeLevel = level;
            result.degree = d;
            // 学历更新时，同时清空 major 和 graduation，以便从该行重新提取
            result.major = undefined;
            result.graduation = undefined;
          }
        }

        // 匹配专业 — 如果当前行学历是最高的，提取该行的专业
        if (bestDegreeLevel > 0 && !result.major) {
          const majorMatch = line.match(/(?:专业|所学专业|主修|方向)[：:\s]*([\u4e00-\u9fa5A-Za-z]{2,30})/i);
          if (majorMatch) {
            result.major = majorMatch[1];
          } else {
            // 策略：学历词之后的中文名可能是专业
            const parts = line.split(/\s+/);
            if (parts.length >= 3) {
              const degreeIdx = parts.findIndex(p => /博士|硕士|本科|大专|专科|学士|研究生/.test(p));
              if (degreeIdx >= 0 && degreeIdx + 1 < parts.length) {
                const possibleMajor = parts[degreeIdx + 1].replace(/[，,。、]/g, '');
                if (/[\u4e00-\u9fa5]{2,15}/.test(possibleMajor) && possibleMajor.length <= 15) {
                  result.major = possibleMajor;
                }
              }
            }
          }
        }

        // 匹配毕业时间 — 取最高学历对应的毕业时间
        if (bestDegreeLevel > 0 && !result.graduation) {
          const gradMatch = line.match(/(\d{4})[\.\-\/年](\d{1,2})[\.\-\/月]?/g);
          if (gradMatch) {
            const lastDate = gradMatch[gradMatch.length - 1];
            const dm = lastDate.match(/(\d{4})[\.\-\/年](\d{1,2})/);
            if (dm) result.graduation = `${dm[1]}-${dm[2].padStart(2, '0')}`;
            
            // 如果有两个日期，提取完整的时间段（入学-毕业）
            if (gradMatch.length >= 2) {
              const firstDate = gradMatch[0];
              const fm = firstDate.match(/(\d{4})[\.\-\/年](\d{1,2})/);
              if (fm) {
                const startDate = `${fm[1]}-${fm[2].padStart(2, '0')}`;
                result.edu_duration = `${startDate} 至 ${result.graduation}`;
              }
            }
          }
        }
      }

      // 主修课程提取 — 在教育经历全文中搜索
      const eduFullText = eduLines.join('\n');
      const courseMatch = eduFullText.match(/(?:主修课程|主要课程|专业课程|所学课程|核心课程)[：:\s]*([\s\S]{5,300}?)(?:\n\n|\n[^\n]{0,3}(?:$|专业|学校|学历|时间|毕业|\n))/i);
      if (courseMatch) {
        const courses = courseMatch[1].trim().replace(/\n+/g, '、').replace(/[，,]/g, '、');
        if (courses.length > 0) {
          result.major_courses = courses;
        }
      }
    }

    // ============================================================
    // 第四步：实习经历解析（支持多条目）
    // ============================================================

    const internLines = sections.intern || [];
    if (internLines.length > 0) {
      // 按项目符号(⚫●•·)或日期开头切分多个实习条目
      const internEntries = splitEntriesByBullet(internLines, 'intern');
      internEntries.forEach((entryLines, i) => {
        const idx = i + 1;
        if (entryLines.length === 0) return;
        const firstLine = entryLines[0];

        // 公司名 + 职位
        const internMatch = firstLine.match(/([\u4e00-\u9fa5]{2,20}(?:公司|有限|集团|科技)?)\s+([\u4e00-\u9fa5A-Za-z]{2,20}(?:实习生|助理|工程师|专员|分析师|实习)?)/);
        if (internMatch) {
          result[`intern_company_${idx}`] = internMatch[1];
          result[`intern_position_${idx}`] = internMatch[2];
        } else {
          const parts = firstLine.split(/\s+/);
          if (parts.length >= 2) {
            result[`intern_company_${idx}`] = parts[0].replace(/[⚫●•·\-]/g, '').trim();
            result[`intern_position_${idx}`] = parts.slice(1).join(' ').replace(/[⚫●•·]/g, '').trim();
          } else {
            result[`intern_company_${idx}`] = firstLine.replace(/[⚫●•·\-]/g, '').trim();
          }
        }

        // 实习描述
        if (entryLines.length > 1) {
          result[`intern_desc_${idx}`] = entryLines.slice(1).join('\n');
        }

        // 实习时间
        const internDateMatch = firstLine.match(/(\d{4})[\.\-\/年](\d{1,2})[\.\-\/月]?\s*[\-–至到~]\s*(\d{4})[\.\-\/年]?(\d{1,2})?[\.\-\/月]?/);
        if (internDateMatch) {
          result[`intern_duration_${idx}`] = internDateMatch[0];
        }
      });
    }

    // ============================================================
    // 第五步：项目经历解析（支持多条目）
    // ============================================================

    const projectLines = sections.project || [];
    if (projectLines.length > 0) {
      const projectEntries = splitEntriesByBullet(projectLines, 'project');
      projectEntries.forEach((entryLines, i) => {
        const idx = i + 1;
        if (entryLines.length === 0) return;
        const firstLine = entryLines[0];

        // 项目名 + 角色（支持角色词中间有空格，如"组 员"）
        const projectMatch = firstLine.match(/(.+?)\s+(组长|组\s*员|负责人|核心开发者|开发者|队长|成\s*员|主管|参与者)/);
        if (projectMatch) {
          result[`project_name_${idx}`] = projectMatch[1].replace(/[⚫●•·]/g, '').trim();
          result[`project_role_${idx}`] = projectMatch[2].replace(/\s/g, '');
        } else {
          result[`project_name_${idx}`] = firstLine.replace(/[⚫●•·]/g, '').trim();
        }

        // 项目描述
        if (entryLines.length > 1) {
          result[`project_desc_${idx}`] = entryLines.slice(1).join('\n');
        }

        // 项目时间
        const projDateMatch = firstLine.match(/(\d{4})[\.\-\/年](\d{1,2})[\.\-\/月]?\s*[\-–至到~]\s*(\d{4})[\.\-\/年]?(\d{1,2})?[\.\-\/月]?/);
        if (projDateMatch) {
          result[`project_duration_${idx}`] = projDateMatch[0];
        }
      });
    }

    // ============================================================
    // 第六步：技能解析
    // ============================================================

    const skillLines = sections.skill || [];
    const awardLines = sections.award || [];
    const allSkillText = [...skillLines, ...awardLines].join('\n');

    if (allSkillText.length > 0) {
      // 技术关键词提取
      const techKeywords = [
        'Python', 'Java', 'C++', 'C', 'Go', 'Rust', 'JavaScript', 'TypeScript', 'SQL', 'MySQL', 'Redis',
        'React', 'Vue', 'Angular', 'Node.js', 'Spring', 'Django', 'Flask',
        'Docker', 'Kubernetes', 'K8s', 'Linux', 'Shell', 'Git',
        'AWS', 'Azure', 'GCP', '阿里云', '腾讯云',
        'PyTorch', 'TensorFlow', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib',
        'Hadoop', 'Spark', 'Hive', 'Kafka', 'Flink',
        'Transformer', 'LSTM', 'CNN', 'RNN', 'GAN', 'BERT', 'GPT', 'ResNet', 'YOLO', 'YOLOv12',
        '机器学习', '深度学习', '数据分析', '数据挖掘', '自然语言处理', 'NLP', '计算机视觉', 'CV',
        'SIMATIC', 'PCS', 'CFC', 'SFC',
        'Excel', 'Tableau', 'PowerBI', 'SPSS', 'Photoshop', 'Figma',
        '项目管理', '产品设计', 'UI设计', 'UI/UX',
        'Trae', 'Coze', 'GPT', 'AI工具',
      ];

      const found = [];
      const lowerText = allSkillText.toLowerCase();
      for (const kw of techKeywords) {
        if (lowerText.includes(kw.toLowerCase()) && !found.includes(kw)) {
          found.push(kw);
        }
      }
      if (found.length > 0) {
        result.skills = found.join(', ');
      }

      // 语言/证书提取
      const langMatch = allSkillText.match(/(?:英语|CET|TOEFL|IELTS|托福|雅思|四级|六级|普通话)[^\n]{0,50}/g);
      if (langMatch) {
        result.languages = langMatch.join('; ');
      }

      // 证书/奖项
      const certMatch = allSkillText.match(/(?:证书|资格|认证)[：:\s]*([^\n]{5,100})/i);
      if (certMatch) {
        result.certificates = certMatch[1].trim();
      }

      // 奖项提取
      const awardMatches = allSkillText.match(/(?:获得|荣获|获)[\s]*([^\n]{5,80})/g);
      if (awardMatches && awardMatches.length > 0) {
        result.awards_honors = awardMatches.map(a => a.replace(/^(获得|荣获|获)[\s]*/, '').trim()).join('\n');
      }
    }

    // ============================================================
    // 第七步：校园经历解析
    // ============================================================

    const campusLines = sections.campus || [];
    if (campusLines.length > 0) {
      result.campus_activities = campusLines.join('\n');
    }

    // ============================================================
    // 第八步：自我评价解析
    // ============================================================

    const selfLines = sections.self || [];
    if (selfLines.length > 0) {
      result.self_eval = selfLines.join('\n');
    }

    // ============================================================
    // 第九步：家庭情况解析
    // ============================================================

    const familyLines = sections.family || [];
    if (familyLines.length > 0) {
      result.family_info = familyLines.join('\n');
    }

    // ============================================================
    // 第十步：全局补充 — 对未提取到的字段做全局搜索
    // ============================================================

    // 学校（如果教育区域没提取到）
    if (!result.school) {
      const globalSchoolMatch = cleanText.match(/([\u4e00-\u9fa5]{2,15}(?:大学|学院|学校))/);
      if (globalSchoolMatch) result.school = globalSchoolMatch[1];
    }

    // 学历（如果教育区域没提取到）
    if (!result.degree) {
      const globalDegreeMatch = cleanText.match(/(博士|硕士|本科|大专|专科|研究生)/);
      if (globalDegreeMatch) {
        const d = globalDegreeMatch[1];
        result.degree = (d === '研究生') ? '硕士' : (d === '专科' ? '大专' : d);
      }
    }

    // 通信地址
    if (!result.mailing_address) {
      const addrMatch = cleanText.match(/(?:通信地址|通讯地址|联系地址|邮寄地址)[：:\s]*([\u4e00-\u9fa5\d\-\#楼栋单元室栋幢]{8,80})/i);
      if (addrMatch) result.mailing_address = addrMatch[1].trim();
    }

    // 户口所在地
    if (!result.hukou_location) {
      const hukouMatch = cleanText.match(/(?:户口所在地|户籍所在地|户籍)[：:\s]*([\u4e00-\u9fa5]{2,30})/i);
      if (hukouMatch) result.hukou_location = hukouMatch[1];
    }

    // 生源地
    if (!result.student_source) {
      const sourceMatch = cleanText.match(/(?:生源地)[：:\s]*([\u4e00-\u9fa5]{2,20})/i);
      if (sourceMatch) result.student_source = sourceMatch[1];
    }

    // GPA
    if (!result.gpa) {
      const gpaMatch = cleanText.match(/(?:GPA|绩点|平均分|平均学分绩点)[：:\s]*(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)/i);
      if (gpaMatch) result.gpa = `${gpaMatch[1]}/${gpaMatch[2]}`;
      else {
        const gpaSimple = cleanText.match(/(?:GPA|绩点)[：:\s]*(\d\.\d+)/i);
        if (gpaSimple) result.gpa = gpaSimple[1];
      }
    }

    return result;
  }

  // ============================================================
  // Auto-save on input change (debounced)
  // ============================================================

  let autoSaveTimer = null;

  function scheduleAutoSave() {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(async () => {
      await saveProfile();
    }, 800);
  }

  resumeForm.addEventListener('input', scheduleAutoSave);
  if (customSectionsContainer) {
    customSectionsContainer.addEventListener('input', scheduleAutoSave);
    customSectionsContainer.addEventListener('change', scheduleAutoSave);
  }

  // ============================================================
  // Init
  // ============================================================

  document.addEventListener('DOMContentLoaded', async () => {
    await loadActiveProfile();
    // 确保至少有一个空条目（如果populateForm没有创建任何条目）
    ensureDefaultEntries();
    // 尝试从旧版 resumeData 迁移
    chrome.runtime.sendMessage({ action: 'getResumeData' }, async (legacyData) => {
      if (legacyData && Object.keys(legacyData).length > 0 && (!currentFields.name || currentFields.name === DEFAULT_PROFILES.profile_1.fields.name)) {
        currentFields = { ...currentFields, ...legacyData };
        populateForm(currentFields);
        ensureDefaultEntries();
        await saveProfile();
        console.log('[JobPilot] 已从旧版 resumeData 迁移');
      }
    });
  });

})();