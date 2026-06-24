/**
 * AI Prompt Manager - Popup Script
 * @author hetao (贺涛)
 * @license CC BY-NC 4.0 (https://creativecommons.org/licenses/by-nc/4.0/)
 */

let prompts = [];
let categories = [];
let enabledSites = [];
let editingId = null;
let isNewCategory = false;
let dragCategoryIndex = null;

// AI Generator State
let aiConfig = {};
let generatorConfig = {};

// DOM Elements
const promptList = document.getElementById('promptList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const addPromptBtn = document.getElementById('addPromptBtn');
const settingsBtn = document.getElementById('settingsBtn');
const promptModal = document.getElementById('promptModal');
const settingsModal = document.getElementById('settingsModal');
const modalTitle = document.getElementById('modalTitle');
const promptForm = document.getElementById('promptForm');
const closeModal = document.getElementById('closeModal');
const closeSettings = document.getElementById('closeSettings');
const cancelBtn = document.getElementById('cancelBtn');
const promptTitle = document.getElementById('promptTitle');
const promptCategory = document.getElementById('promptCategory');
const newCategory = document.getElementById('newCategory');
const toggleCategoryBtn = document.getElementById('toggleCategoryBtn');
const promptContent = document.getElementById('promptContent');
const toast = document.getElementById('toast');
const siteList = document.getElementById('siteList');
const newSiteInput = document.getElementById('newSiteInput');
const addSiteBtn = document.getElementById('addSiteBtn');
const categoryList = document.getElementById('categoryList');
const newCategoryInput = document.getElementById('newCategoryInput');
const addCategoryBtn = document.getElementById('addCategoryBtn');

// AI Config Status
const aiConfigStatus = document.getElementById('aiConfigStatus');

// Tooltip
const promptTooltip = document.getElementById('promptTooltip');
let tooltipTimer = null;

// AI Generator DOM Elements
const aiGenerateBtn = document.getElementById('aiGenerateBtn');
const aiGenerateModal = document.getElementById('aiGenerateModal');
const closeAiGenerate = document.getElementById('closeAiGenerate');
const toggleAiConfig = document.getElementById('toggleAiConfig');
const aiConfigBody = document.getElementById('aiConfigBody');
const aiProvider = document.getElementById('aiProvider');
const aiModel = document.getElementById('aiModel');
const customModelInput = document.getElementById('customModelInput');
const toggleModelInput = document.getElementById('toggleModelInput');
const modelHint = document.getElementById('modelHint');
const customBaseUrl = document.getElementById('customBaseUrl');
const aiApiKey = document.getElementById('aiApiKey');
const saveAiConfig = document.getElementById('saveAiConfig');
const aiGenerateInput = document.getElementById('aiGenerateInput');
const generatePromptBtn = document.getElementById('generatePromptBtn');
const aiResultSection = document.getElementById('aiResultSection');
const aiGenerateResult = document.getElementById('aiGenerateResult');
const regenerateBtn = document.getElementById('regenerateBtn');
const usePromptBtn = document.getElementById('usePromptBtn');

// Config Import/Export DOM Elements
const configBtn = document.getElementById('configBtn');
const configModal = document.getElementById('configModal');
const closeConfig = document.getElementById('closeConfig');
const exportConfigBtn = document.getElementById('exportConfigBtn');
const importConfigBtn = document.getElementById('importConfigBtn');
const importFileInput = document.getElementById('importFileInput');

// Default enabled sites
const DEFAULT_SITES = [
  'chatgpt.com',
  'claude.ai',
  'gemini.google.com',
  'copilot.microsoft.com',
  'poe.com',
  'kimi.moonshot.cn',
  'yiyan.baidu.com',
  'tongyi.aliyun.com'
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
  setupAiGenerator();
});

// Load data from storage
function loadData() {
  chrome.storage.local.get(['prompts', 'categories', 'enabledSites', 'aiConfig', 'categoryFilter'], (result) => {
    prompts = result.prompts || [];
    categories = result.categories || [];
    enabledSites = result.enabledSites || DEFAULT_SITES;
    aiConfig = result.aiConfig || {};
    // Restore saved category filter
    if (result.categoryFilter !== undefined) {
      categoryFilter.value = result.categoryFilter;
    }
    updateCategoryFilter();
    updateCategorySelect();
    renderPrompts();
    renderSiteList();
    renderCategoryList();
  });
}

// Setup event listeners
function setupEventListeners() {
  // Search and filter
  searchInput.addEventListener('input', renderPrompts);
  categoryFilter.addEventListener('change', () => {
    // Save category filter to storage for content script
    chrome.storage.local.set({ categoryFilter: categoryFilter.value });
    renderPrompts();
  });

  // Modal controls
  addPromptBtn.addEventListener('click', () => openModal());
  closeModal.addEventListener('click', closeModalFunc);
  cancelBtn.addEventListener('click', closeModalFunc);

  // Settings
  settingsBtn.addEventListener('click', openSettings);
  closeSettings.addEventListener('click', closeSettingsFunc);
  addSiteBtn.addEventListener('click', addSite);
  addCategoryBtn.addEventListener('click', addCategory);

  // Category toggle in prompt form
  toggleCategoryBtn.addEventListener('click', toggleCategoryInput);

  // Form submission
  promptForm.addEventListener('submit', handleSubmit);

  // Auto-resize for prompt content textarea
  setupAutoResize(promptContent);

  // Close modals on outside click
  promptModal.addEventListener('click', (e) => {
    if (e.target === promptModal) closeModalFunc();
  });
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettingsFunc();
  });

  // Enter key for adding site / category
  newSiteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addSite();
  });
  newCategoryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addCategory();
  });

  // Config Import/Export events
  configBtn.addEventListener('click', openConfigModal);
  closeConfig.addEventListener('click', closeConfigModal);
  exportConfigBtn.addEventListener('click', exportAllConfig);
  importConfigBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', handleFileImport);

  // Close modal on outside click
  configModal.addEventListener('click', (e) => {
    if (e.target === configModal) closeConfigModal();
  });
}

// ── AI Generator Setup ──

function setupAiGenerator() {
  // Load generator config
  fetch(chrome.runtime.getURL('config/generator.json'))
    .then(r => r.json())
    .then(config => {
      generatorConfig = config;
      initAiGeneratorUI();
    });

  // Event listeners
  aiGenerateBtn.addEventListener('click', openAiGenerate);
  closeAiGenerate.addEventListener('click', closeAiGenerateFunc);
  toggleAiConfig.addEventListener('click', toggleAiConfigPanel);
  aiProvider.addEventListener('change', updateModelOptions);
  toggleModelInput.addEventListener('click', toggleCustomModelInput);
  saveAiConfig.addEventListener('click', saveAiConfiguration);
  generatePromptBtn.addEventListener('click', generatePrompt);
  regenerateBtn.addEventListener('click', generatePrompt);
  usePromptBtn.addEventListener('click', useGeneratedPrompt);

  // Auto-resize textareas
  setupAutoResize(aiGenerateInput);
  setupAutoResize(aiGenerateResult);

  // Close modal on outside click
  aiGenerateModal.addEventListener('click', (e) => {
    if (e.target === aiGenerateModal) closeAiGenerateFunc();
  });
}

// Auto-resize textarea function
function setupAutoResize(textarea) {
  if (!textarea) return;

  const resize = () => {
    if (!textarea.value) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 320) + 'px';
  };

  textarea.addEventListener('input', resize);

  // Initial resize if has content
  if (textarea.value) {
    setTimeout(resize, 0);
  }
}

function initAiGeneratorUI() {
  // Restore saved config
  if (aiConfig.provider) {
    aiProvider.value = aiConfig.provider;
  }
  updateModelOptions();
  
  // Restore model (check if it's a preset or custom)
  if (aiConfig.model) {
    const presetModels = generatorConfig.supportedModels.filter(m => m.provider === aiConfig.provider);
    const isPreset = presetModels.some(m => m.id === aiConfig.model);
    
    if (isPreset) {
      aiModel.value = aiConfig.model;
      // Ensure select is visible, input hidden
      aiModel.style.display = 'block';
      customModelInput.style.display = 'none';
      toggleModelInput.textContent = '自定义';
    } else {
      // Custom model
      customModelInput.value = aiConfig.model;
      aiModel.style.display = 'none';
      customModelInput.style.display = 'block';
      toggleModelInput.textContent = '选择';
    }
  }
  
  if (aiConfig.baseUrl) {
    customBaseUrl.value = aiConfig.baseUrl;
  }
  if (aiConfig.apiKey) {
    aiApiKey.value = aiConfig.apiKey;
  }
}

function openAiGenerate() {
  aiGenerateModal.style.display = 'flex';
  // Check if API is configured and valid
  checkAiConfigStatus();
  aiGenerateInput.focus();
}

async function checkAiConfigStatus() {
  // Basic check: must have apiKey and model
  if (!aiConfig.apiKey || !aiConfig.apiKey.trim() || !aiConfig.model) {
    aiConfigStatus.style.display = 'none';
    return;
  }

  // Show checking state
  aiConfigStatus.textContent = '检测中...';
  aiConfigStatus.className = 'ai-config-status';
  aiConfigStatus.style.display = 'inline';

  try {
    await testAiConnection();
    aiConfigStatus.textContent = '已配置 API';
    aiConfigStatus.className = 'ai-config-status success';
  } catch (e) {
    aiConfigStatus.textContent = '配置 API 错误';
    aiConfigStatus.className = 'ai-config-status error';
  }
}

async function testAiConnection() {
  const provider = aiConfig.provider || 'openai';
  const model = aiConfig.model;
  const baseUrl = aiConfig.baseUrl || generatorConfig.providerEndpoints[provider]?.baseUrl;
  const apiKey = aiConfig.apiKey;

  if (!baseUrl || !apiKey || !model) {
    throw new Error('配置不完整');
  }

  // Send a minimal request to test connectivity
  if (provider === 'anthropic') {
    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }]
      })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }
  } else {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1
      })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }
  }
}

function closeAiGenerateFunc() {
  aiGenerateModal.style.display = 'none';
  // Reset state
  aiGenerateInput.value = '';
  aiResultSection.style.display = 'none';
  aiGenerateResult.value = '';
}

function toggleAiConfigPanel() {
  const isHidden = aiConfigBody.style.display === 'none';
  aiConfigBody.style.display = isHidden ? 'block' : 'none';
  toggleAiConfig.textContent = isHidden ? '收起' : '展开';
}

function updateModelOptions() {
  const provider = aiProvider.value;
  const models = generatorConfig.supportedModels.filter(m => m.provider === provider);
  
  aiModel.innerHTML = models.map(m => 
    `<option value="${m.id}">${m.name}</option>`
  ).join('');

  // Reset to select mode when provider changes
  aiModel.style.display = 'block';
  customModelInput.style.display = 'none';
  toggleModelInput.textContent = '自定义';
  customModelInput.value = '';

  // Auto-fill base URL from provider config
  if (generatorConfig.providerEndpoints[provider]) {
    customBaseUrl.placeholder = generatorConfig.providerEndpoints[provider].baseUrl;
    // Only fill if user hasn't manually set a value
    if (!customBaseUrl.value || customBaseUrl.dataset.autoFilled === 'true') {
      customBaseUrl.value = generatorConfig.providerEndpoints[provider].baseUrl;
      customBaseUrl.dataset.autoFilled = 'true';
    }
  }
}

function toggleCustomModelInput() {
  const isSelectMode = aiModel.style.display !== 'none';
  const provider = aiProvider.value;
  
  if (isSelectMode) {
    // Switch to custom input
    aiModel.style.display = 'none';
    customModelInput.style.display = 'block';
    toggleModelInput.textContent = '选择';
    
    // Provider-specific hint
    if (provider === 'doubao') {
      modelHint.textContent = '请输入火山方舟的 Endpoint ID（如 ep-20260325101741-2wvvl）';
      customModelInput.placeholder = 'ep-xxxxxxxxxxxxxxxxxx';
    } else {
      modelHint.textContent = '输入您的自定义模型 ID';
      customModelInput.placeholder = '输入自定义模型ID';
    }
    
    customModelInput.focus();
  } else {
    // Switch back to select
    aiModel.style.display = 'block';
    customModelInput.style.display = 'none';
    toggleModelInput.textContent = '自定义';
    modelHint.textContent = '选择预设模型或输入自定义模型ID';
  }
}

function saveAiConfiguration() {
  // Determine which model value to use
  const isCustomModel = customModelInput.style.display !== 'none';
  const modelValue = isCustomModel ? customModelInput.value.trim() : aiModel.value;
  
  if (!modelValue) {
    showToast('请选择或输入模型');
    return;
  }
  
  aiConfig = {
    provider: aiProvider.value,
    model: modelValue,
    baseUrl: customBaseUrl.value.trim(),
    apiKey: aiApiKey.value.trim()
  };
  
  chrome.storage.local.set({ aiConfig }, () => {
    showToast('配置已保存');
    aiConfigBody.style.display = 'none';
    toggleAiConfig.textContent = '展开';
    checkAiConfigStatus();
  });
}

async function generatePrompt() {
  const userInput = aiGenerateInput.value.trim();
  if (!userInput) {
    showToast('请输入需求描述');
    return;
  }

  if (!aiConfig.apiKey) {
    showToast('请先配置 API Key');
    aiConfigBody.style.display = 'block';
    toggleAiConfig.textContent = '收起';
    aiApiKey.focus();
    return;
  }

  // Show loading state
  generatePromptBtn.disabled = true;
  document.querySelector('.generate-text').style.display = 'none';
  document.querySelector('.generating-text').style.display = 'inline';

  try {
    const result = await callAiApi(userInput);
    aiGenerateResult.value = result;
    aiResultSection.style.display = 'block';
    // Trigger auto-resize after setting content
    setTimeout(() => {
      aiGenerateResult.style.height = 'auto';
      aiGenerateResult.style.height = Math.min(aiGenerateResult.scrollHeight, 320) + 'px';
    }, 0);
  } catch (error) {
    showToast('生成失败: ' + error.message);
  } finally {
    generatePromptBtn.disabled = false;
    document.querySelector('.generate-text').style.display = 'inline';
    document.querySelector('.generating-text').style.display = 'none';
  }
}

async function callAiApi(userInput) {
  const provider = aiConfig.provider || 'openai';
  const model = aiConfig.model || generatorConfig.defaultModel;
  const baseUrl = aiConfig.baseUrl || generatorConfig.providerEndpoints[provider]?.baseUrl;
  const apiKey = aiConfig.apiKey;

  if (!baseUrl || !apiKey) {
    throw new Error('请检查 API 配置');
  }

  const systemPrompt = generatorConfig.systemPrompt;

  // OpenAI-compatible API format (works for OpenAI, DeepSeek, and custom endpoints)
  if (provider === 'anthropic') {
    return await callAnthropicApi(baseUrl, apiKey, model, systemPrompt, userInput);
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropicApi(baseUrl, apiKey, model, systemPrompt, userInput) {
  const response = await fetch(`${baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userInput }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function useGeneratedPrompt() {
  const generated = aiGenerateResult.value.trim();
  if (!generated) return;

  // Close AI generate modal
  closeAiGenerateFunc();
  
  // Open add modal with pre-filled values
  openModal(null, {
    title: aiGenerateInput.value.trim().substring(0, 20),
    content: generated
  });
}

// ── Category Management ──

// Render category list in settings (with drag sort)
function renderCategoryList() {
  categoryList.innerHTML = categories.map((cat, index) => `
    <div class="category-item" draggable="true" data-index="${index}" data-name="${escapeHtml(cat)}">
      <span class="category-drag-handle" title="拖拽排序">⠿</span>
      <span class="category-item-name">${escapeHtml(cat)}</span>
      <button class="btn-delete-site" data-index="${index}" title="删除">删除</button>
    </div>
  `).join('');

  // Add delete handlers
  categoryList.querySelectorAll('.btn-delete-site').forEach(btn => {
    btn.addEventListener('click', () => deleteCategory(parseInt(btn.dataset.index)));
  });

  // Setup drag and drop for sorting
  setupCategoryDragSort();
}

// Setup drag sort for category items
function setupCategoryDragSort() {
  const items = categoryList.querySelectorAll('.category-item');

  items.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      dragCategoryIndex = parseInt(item.dataset.index);
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      dragCategoryIndex = null;
      // Remove all drag-over highlights
      categoryList.querySelectorAll('.category-item').forEach(i => i.classList.remove('drag-over'));
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      item.classList.add('drag-over');
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const dropIndex = parseInt(item.dataset.index);

      if (dragCategoryIndex !== null && dragCategoryIndex !== dropIndex) {
        // Reorder categories array
        const moved = categories.splice(dragCategoryIndex, 1)[0];
        categories.splice(dropIndex, 0, moved);
        saveCategories();
        renderCategoryList();
        updateCategoryFilter();
        updateCategorySelect();
      }
    });
  });
}

// Add new category
function addCategory() {
  const name = newCategoryInput.value.trim();
  if (!name) {
    showToast('请输入分类名称');
    return;
  }
  if (categories.includes(name)) {
    showToast('该分类已存在');
    return;
  }

  categories.push(name);
  saveCategories();
  renderCategoryList();
  updateCategoryFilter();
  updateCategorySelect();
  newCategoryInput.value = '';
  showToast('已添加');
}

// Delete category
function deleteCategory(index) {
  const name = categories[index];

  // Check if any prompts use this category
  const usedCount = prompts.filter(p => p.category === name).length;
  if (usedCount > 0) {
    if (!confirm(`分类"${name}"下有 ${usedCount} 个提示词，删除后这些提示词的分类将变为空。确定删除？`)) {
      return;
    }
    // Clear category from affected prompts
    prompts.forEach(p => {
      if (p.category === name) p.category = '';
    });
    savePrompts();
  }

  categories.splice(index, 1);
  saveCategories();
  renderCategoryList();
  updateCategoryFilter();
  updateCategorySelect();
  renderPrompts();
  showToast('已删除');
}

// ── Site Management ──

// Update category filter dropdown
function updateCategoryFilter() {
  const currentValue = categoryFilter.value;
  categoryFilter.innerHTML = '<option value="">全部分类</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
  categoryFilter.value = currentValue;
}

// Update category select in modal
function updateCategorySelect() {
  const currentValue = promptCategory.value;
  promptCategory.innerHTML = '<option value="">选择分类</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    promptCategory.appendChild(option);
  });
  promptCategory.value = currentValue;
}

// Toggle between select and input for category
function toggleCategoryInput() {
  isNewCategory = !isNewCategory;
  if (isNewCategory) {
    promptCategory.style.display = 'none';
    newCategory.style.display = 'block';
    toggleCategoryBtn.textContent = '选择';
    newCategory.focus();
  } else {
    promptCategory.style.display = 'block';
    newCategory.style.display = 'none';
    toggleCategoryBtn.textContent = '新建';
    promptCategory.focus();
  }
}

// Render prompts list
function renderPrompts() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;

  // Filter prompts
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm) ||
                         prompt.content.toLowerCase().includes(searchTerm);
    const matchesCategory = !selectedCategory || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Show/hide empty state
  if (filteredPrompts.length === 0) {
    promptList.style.display = 'none';
    emptyState.style.display = 'block';
    if (prompts.length === 0) {
      emptyState.innerHTML = '<p>暂无提示词</p><p>点击 + 按钮添加，或使用 AI 生成</p>';
    } else {
      emptyState.innerHTML = '<p>没有找到匹配的提示词</p>';
    }
  } else {
    promptList.style.display = 'block';
    emptyState.style.display = 'none';
  }

  // Render list - compact two-row layout, sorted by category order
  const categoryOrder = {};
  categories.forEach((cat, index) => { categoryOrder[cat] = index; });

  const sortedPrompts = [...filteredPrompts].sort((a, b) => {
    const orderA = categoryOrder[a.category] !== undefined ? categoryOrder[a.category] : 999;
    const orderB = categoryOrder[b.category] !== undefined ? categoryOrder[b.category] : 999;
    return orderA - orderB;
  });

  promptList.innerHTML = sortedPrompts.map(prompt => `
    <div class="prompt-item" data-id="${prompt.id}" data-tooltip="${escapeHtml(prompt.content).replace(/"/g, '&quot;')}">
      <div class="prompt-header">
        <div class="prompt-meta">
          <span class="prompt-title">${escapeHtml(prompt.title)}</span>
          <span class="prompt-category">${escapeHtml(prompt.category)}</span>
        </div>
        <div class="prompt-actions">
          <button class="btn-copy" title="复制" data-id="${prompt.id}">📋</button>
          <button class="btn-edit" title="编辑" data-id="${prompt.id}">✏️</button>
          <button class="btn-delete" title="删除" data-id="${prompt.id}">🗑️</button>
        </div>
      </div>
      <div class="prompt-content">${escapeHtml(prompt.content)}</div>
    </div>
  `).join('');

  // Add event listeners to action buttons
  promptList.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyPrompt(btn.dataset.id);
    });
  });

  promptList.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      editPrompt(btn.dataset.id);
    });
  });

  promptList.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deletePrompt(btn.dataset.id);
    });
  });

  // Click on prompt item to copy
  promptList.querySelectorAll('.prompt-item').forEach(item => {
    item.addEventListener('click', () => copyPrompt(item.dataset.id));

    // Tooltip: show on hover
    item.addEventListener('mouseenter', (e) => {
      clearTimeout(tooltipTimer);
      const content = item.dataset.tooltip;
      if (!content) return;

      promptTooltip.textContent = content;
      promptTooltip.style.display = 'block';

      // Position after display so we can measure
      requestAnimationFrame(() => {
        const itemRect = item.getBoundingClientRect();
        const tooltipRect = promptTooltip.getBoundingClientRect();
        const viewHeight = window.innerHeight;

        let top;
        if (itemRect.top - tooltipRect.height - 6 >= 0) {
          // Show above
          top = itemRect.top - tooltipRect.height - 6;
        } else if (itemRect.bottom + tooltipRect.height + 6 <= viewHeight) {
          // Show below
          top = itemRect.bottom + 6;
        } else {
          // Show above anyway (clip is better than hide)
          top = Math.max(4, itemRect.top - tooltipRect.height - 6);
        }

        promptTooltip.style.top = top + 'px';
        promptTooltip.style.left = Math.max(4, Math.min(itemRect.left, window.innerWidth - tooltipRect.width - 4)) + 'px';
      });
    });

    item.addEventListener('mouseleave', () => {
      tooltipTimer = setTimeout(() => {
        promptTooltip.style.display = 'none';
      }, 80);
    });
  });
}

// Render site list in settings
function renderSiteList() {
  siteList.innerHTML = enabledSites.map(site => `
    <div class="site-item">
      <span>${escapeHtml(site)}</span>
      <button class="btn-delete-site" data-site="${escapeHtml(site)}">删除</button>
    </div>
  `).join('');

  // Add delete handlers
  siteList.querySelectorAll('.btn-delete-site').forEach(btn => {
    btn.addEventListener('click', () => deleteSite(btn.dataset.site));
  });
}

// Add new site
function addSite() {
  const site = newSiteInput.value.trim().toLowerCase();
  if (!site) {
    showToast('请输入网站域名');
    return;
  }

  if (enabledSites.includes(site)) {
    showToast('该网站已存在');
    return;
  }

  enabledSites.push(site);
  chrome.storage.local.set({ enabledSites });
  renderSiteList();
  newSiteInput.value = '';
  showToast('已添加');
}

// Delete site
function deleteSite(site) {
  enabledSites = enabledSites.filter(s => s !== site);
  chrome.storage.local.set({ enabledSites });
  renderSiteList();
  showToast('已删除');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Copy prompt to clipboard
function copyPrompt(id) {
  const prompt = prompts.find(p => p.id === id);
  if (!prompt) return;

  navigator.clipboard.writeText(prompt.content).then(() => {
    showToast('已复制到剪贴板！');
  }).catch(() => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = prompt.content;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showToast('已复制到剪贴板！');
  });
}

// Open modal for adding/editing
// initialValues: optional { title, content } for pre-filling new prompts
function openModal(promptId = null, initialValues = null) {
  editingId = promptId;
  
  if (promptId) {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;
    
    modalTitle.textContent = '编辑提示词';
    promptTitle.value = prompt.title;
    promptContent.value = prompt.content;
    
    // Handle category
    if (categories.includes(prompt.category)) {
      isNewCategory = false;
      promptCategory.style.display = 'block';
      newCategory.style.display = 'none';
      toggleCategoryBtn.textContent = '新建';
      promptCategory.value = prompt.category;
      newCategory.value = '';
    } else {
      isNewCategory = true;
      promptCategory.style.display = 'none';
      newCategory.style.display = 'block';
      toggleCategoryBtn.textContent = '选择';
      promptCategory.value = '';
      newCategory.value = prompt.category;
    }
  } else {
    modalTitle.textContent = '添加提示词';
    promptForm.reset();
    isNewCategory = false;
    promptCategory.style.display = 'block';
    newCategory.style.display = 'none';
    toggleCategoryBtn.textContent = '新建';
    updateCategorySelect();
    
    // Apply initial values after reset
    if (initialValues) {
      if (initialValues.title) {
        promptTitle.value = initialValues.title;
      }
      if (initialValues.content) {
        promptContent.value = initialValues.content;
        // Trigger auto-resize for content
        setTimeout(() => {
          promptContent.style.height = 'auto';
          promptContent.style.height = Math.min(promptContent.scrollHeight, 320) + 'px';
        }, 0);
      }
    }
  }
  
  promptModal.style.display = 'flex';
  
  // Focus and select title after a brief delay to ensure values are set
  setTimeout(() => {
    promptTitle.focus();
    if (initialValues && initialValues.title) {
      promptTitle.select();
    }
  }, 10);
}

// Close modal
function closeModalFunc() {
  promptModal.style.display = 'none';
  editingId = null;
  promptForm.reset();
}

// Open settings
function openSettings() {
  settingsModal.style.display = 'flex';
}

// Close settings
function closeSettingsFunc() {
  settingsModal.style.display = 'none';
}

// Edit prompt
function editPrompt(id) {
  openModal(id);
}

// Delete prompt
function deletePrompt(id) {
  if (!confirm('确定要删除这个提示词吗？')) return;
  
  prompts = prompts.filter(p => p.id !== id);
  savePrompts();
  renderPrompts();
  showToast('已删除');
}

// Handle form submission
function handleSubmit(e) {
  e.preventDefault();
  
  const title = promptTitle.value.trim();
  const content = promptContent.value.trim();
  const category = isNewCategory ? newCategory.value.trim() : promptCategory.value;
  
  if (!title || !content || !category) {
    showToast('请填写所有字段');
    return;
  }
  
  // Add new category to list if needed
  if (isNewCategory && !categories.includes(category)) {
    categories.push(category);
    saveCategories();
    updateCategoryFilter();
    updateCategorySelect();
  }
  
  if (editingId) {
    // Update existing
    const index = prompts.findIndex(p => p.id === editingId);
    if (index !== -1) {
      prompts[index] = { id: editingId, title, content, category };
    }
  } else {
    // Add new
    const newPrompt = {
      id: Date.now().toString(),
      title,
      content,
      category
    };
    prompts.push(newPrompt);
  }
  
  savePrompts();
  renderPrompts();
  closeModalFunc();
  showToast(editingId ? '已更新' : '已添加');
}

// Save prompts to storage
function savePrompts() {
  chrome.storage.local.set({ prompts });
}

// Save categories to storage
function saveCategories() {
  chrome.storage.local.set({ categories });
}

// Show toast notification
function showToast(message) {
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 2000);
}

// ── Config Import/Export ──

function openConfigModal() {
  configModal.style.display = 'flex';
}

function closeConfigModal() {
  configModal.style.display = 'none';
}

function exportAllConfig() {
  chrome.storage.local.get(['prompts', 'categories', 'enabledSites', 'aiConfig'], (result) => {
    const exportData = {
      version: chrome.runtime.getManifest().version,
      exportedAt: new Date().toISOString(),
      data: {
        prompts: result.prompts || [],
        categories: result.categories || [],
        enabledSites: result.enabledSites || DEFAULT_SITES,
        aiConfig: result.aiConfig || {}
      }
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    a.download = `ai-prompt-manager-backup-${timestamp}.json`;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('配置导出成功！');
    closeConfigModal();
  });
}

function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target.result;
      const imported = JSON.parse(content);

      if (!imported || !imported.data) {
        showToast('文件格式不正确，请选择正确的配置文件');
        return;
      }

      if (!confirm('导入将覆盖当前所有数据，确定继续吗？')) {
        event.target.value = '';
        return;
      }

      importAllConfig(imported.data);
    } catch (error) {
      showToast('文件解析失败：' + error.message);
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

function importAllConfig(data) {
  const importData = {};

  if (Array.isArray(data.prompts)) {
    importData.prompts = data.prompts;
  }
  if (Array.isArray(data.categories)) {
    importData.categories = data.categories;
  }
  if (Array.isArray(data.enabledSites)) {
    importData.enabledSites = data.enabledSites;
  }
  if (data.aiConfig && typeof data.aiConfig === 'object') {
    importData.aiConfig = data.aiConfig;
  }

  chrome.storage.local.set(importData, () => {
    prompts = importData.prompts || prompts;
    categories = importData.categories || categories;
    enabledSites = importData.enabledSites || enabledSites;
    aiConfig = importData.aiConfig || aiConfig;

    updateCategoryFilter();
    updateCategorySelect();
    renderPrompts();
    renderSiteList();
    renderCategoryList();

    showToast('配置导入成功！');
    closeConfigModal();
  });
}
