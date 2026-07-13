/**
 * TestPilot · AI测试设计体检官 — 前端交互逻辑
 * 事件绑定 + 状态管理 + UI渲染 + 配置收集 + 统计汇总
 */

// ===== 全局状态 =====
const state = {
  currentData: null,      // 当前生成的完整数据
  isLoading: false,       // 是否正在加载
  isMockMode: false,      // 是否为 Mock 模式
  document: '',           // 当前需求文档
  config: {}              // 当前配置
};

// ===== DOM 引用 =====
let dom = {};

// ===== 初始化 =====
function init() {
  cacheDom();
  bindEvents();
  updateWordCount();
  showEmptyState();
}

function cacheDom() {
  dom = {
    // 输入区
    docInput: document.getElementById('docInput'),
    wordCount: document.getElementById('wordCount'),
    charWarning: document.getElementById('charWarning'),
    loadPreset: document.getElementById('loadPreset'),
    // 配置区
    testLevel: document.querySelectorAll('[name="testLevel"]'),
    testMethods: document.querySelectorAll('[name="testMethod"]'),
    testType: document.querySelectorAll('[name="testType"]'),
    preference: document.querySelectorAll('[name="preference"]'),
    // 按钮
    generateBtn: document.getElementById('generateBtn'),
    // 迭代区
    iterateInput: document.getElementById('iterateInput'),
    iterateSend: document.getElementById('iterateSend'),
    // 输出区
    outputArea: document.getElementById('outputArea'),
    mockBanner: document.getElementById('mockBanner'),
    // 加载
    loadingArea: document.getElementById('loadingArea'),
    loadingText: document.getElementById('loadingText')
  };
}

function bindEvents() {
  // 输入框字数统计
  dom.docInput.addEventListener('input', updateWordCount);

  // 加载预置文档
  if (dom.loadPreset) {
    dom.loadPreset.addEventListener('click', loadPresetDocument);
  }

  // 生成按钮
  dom.generateBtn.addEventListener('click', handleGenerate);

  // 迭代发送
  dom.iterateSend.addEventListener('click', handleIterate);
  dom.iterateInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleIterate();
    }
  });

  // 配置选项点击
  bindConfigOptions('testLevel');
  bindConfigOptions('testType');
  bindConfigOptions('preference');
  bindCheckboxOptions('testMethod');

  // 折叠面板事件委托
  document.addEventListener('click', (e) => {
    const header = e.target.closest('.collapse-header');
    if (header) {
      toggleCollapse(header);
    }
  });
}

// ===== 配置选项绑定 =====
function bindConfigOptions(name) {
  document.querySelectorAll(`[name="${name}"]`).forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll(`[name="${name}"]`).forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
    });
  });
}

function bindCheckboxOptions(name) {
  document.querySelectorAll(`[name="${name}"]`).forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.preventDefault();
      opt.classList.toggle('active');
    });
  });
}

// ===== 字数统计 =====
function updateWordCount() {
  const text = dom.docInput.value;
  const count = TestPilotEngine.countWords(text);
  dom.wordCount.textContent = `已输入 ${count} 字`;
  if (count < 50) {
    dom.wordCount.classList.add('text-orange-500');
    dom.wordCount.classList.remove('text-green-600');
  } else {
    dom.wordCount.classList.remove('text-orange-500');
    dom.wordCount.classList.add('text-green-600');
  }

  // 超长截断警告
  if (text.length > 8000) {
    dom.charWarning.classList.remove('hidden');
  } else {
    dom.charWarning.classList.add('hidden');
  }
}

// ===== 加载预置文档 =====
function loadPresetDocument() {
  dom.docInput.value = TestPilotEngine.PRESET_DOCUMENT;
  updateWordCount();
  showToast('已加载预置需求文档', 'success');
}

// ===== 收集配置 =====
function collectConfig() {
  const testLevel = getActiveValue('testLevel');
  const testMethods = getActiveValues('testMethod');
  const testType = getActiveValue('testType');
  const preference = getActiveValue('preference');

  return {
    testLevel: testLevel || '回归测试',
    testMethods: testMethods.length > 0 ? testMethods : ['边界值分析', '等价类划分', '场景法'],
    testType: testType || '功能测试',
    preference: preference || '混合模式'
  };
}

function getActiveValue(name) {
  const active = document.querySelector(`[name="${name}"].active`);
  return active ? active.dataset.value : null;
}

function getActiveValues(name) {
  const active = document.querySelectorAll(`[name="${name}"].active`);
  return Array.from(active).map(el => el.dataset.value);
}

// ===== 生成处理 =====
async function handleGenerate() {
  const rawText = dom.docInput.value;
  const validation = TestPilotEngine.validateInput(rawText);
  if (!validation.valid) {
    showToast(validation.message, 'error');
    return;
  }

  const config = collectConfig();
  const document = TestPilotEngine.preprocessInput(rawText);

  // 保存状态
  state.document = document;
  state.config = config;
  state.isLoading = true;

  // 显示加载状态
  showLoading();
  dom.generateBtn.disabled = true;
  dom.generateBtn.innerHTML = '<span class="spinner"></span> AI 正在分析中...';

  // 分阶段提示
  const phases = [
    { delay: 0, text: 'AI 正在解析需求文档...' },
    { delay: 2000, text: '正在生成测试点树...' },
    { delay: 5000, text: '正在生成测试用例...' },
    { delay: 8000, text: '正在执行用例体检与风险分析...' }
  ];
  const timers = phases.map(p => setTimeout(() => {
    dom.loadingText.textContent = p.text;
  }, p.delay));

  try {
    const userMessage = TestPilotEngine.buildUserMessage(document, config);
    const raw = await TestPilotEngine.callAI(TestPilotEngine.SYSTEM_PROMPT, userMessage);
    const data = TestPilotEngine.parseAIResponse(raw);

    state.currentData = data;
    state.isMockMode = !window.ai || !window.ai.chat;

    renderResults(data);
  } catch (err) {
    showToast('生成失败: ' + err.message + '，请重试', 'error');
    showEmptyState();
  } finally {
    clearTimeouts(timers);
    state.isLoading = false;
    dom.generateBtn.disabled = false;
    dom.generateBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> 生成用例';
  }
}

// ===== 迭代处理 =====
async function handleIterate() {
  const userRequest = dom.iterateInput.value.trim();
  if (!userRequest) {
    showToast('请输入补充要求', 'error');
    return;
  }
  if (!state.currentData) {
    showToast('请先生成用例', 'error');
    return;
  }

  state.isLoading = true;
  dom.iterateSend.disabled = true;
  dom.iterateSend.innerHTML = '<span class="spinner"></span>';

  showLoading();
  dom.loadingText.textContent = 'AI 正在根据您的要求优化用例...';

  try {
    const lastJSON = JSON.stringify(state.currentData);
    const userMessage = TestPilotEngine.buildIterateMessage(
      state.document, state.config, lastJSON, userRequest
    );
    const raw = await TestPilotEngine.callAI(TestPilotEngine.SYSTEM_PROMPT, userMessage);
    const data = TestPilotEngine.parseAIResponse(raw);

    state.currentData = data;
    renderResults(data);
    dom.iterateInput.value = '';
    showToast('用例已更新', 'success');
  } catch (err) {
    showToast('迭代失败: ' + err.message + '，请重试', 'error');
    renderResults(state.currentData);
  } finally {
    state.isLoading = false;
    dom.iterateSend.disabled = false;
    dom.iterateSend.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>';
  }
}

// ===== 加载状态 =====
function showLoading() {
  dom.outputArea.innerHTML = `
    <div class="flex flex-col items-center justify-center py-20">
      <div class="spinner spinner-lg mb-6"></div>
      <p id="loadingText" class="text-lg font-medium text-slate-600">AI 正在解析需求文档...</p>
      <div class="mt-8 w-full max-w-md space-y-3">
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line short"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line short"></div>
      </div>
    </div>
  `;
  dom.loadingText = document.getElementById('loadingText');
}

// ===== 空状态 =====
function showEmptyState() {
  dom.outputArea.innerHTML = `
    <div class="empty-state">
      <svg class="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <p class="text-lg font-medium">粘贴需求文档，配置参数后点击「生成用例」</p>
      <p class="text-sm mt-2">AI 将自动拆解测试点、生成用例、体检覆盖率、发现需求缺陷</p>
    </div>
  `;
}

// ===== 渲染结果 =====
function renderResults(data) {
  state.currentData = data;

  // Mock 模式提示
  if (state.isMockMode) {
    dom.mockBanner.classList.remove('hidden');
  } else {
    dom.mockBanner.classList.add('hidden');
  }

  let html = '';

  // 统计汇总栏
  html += renderStatistics(data);

  // 测试点树
  html += renderTestPointTree(data.testPointTree);

  // 测试用例
  html += renderTestCases(data.testCases);

  // AI 用例体检报告
  if (data.reviewReport) {
    html += renderReviewReport(data.reviewReport);
  }

  // 需求缺陷发现
  if (data.requirementDefects && data.requirementDefects.length > 0) {
    html += renderDefects(data.requirementDefects);
  }

  // 风险分析
  if (data.riskAnalysis) {
    html += renderRiskAnalysis(data.riskAnalysis);
  }

  // 自动化建议汇总
  if (data.automationSummary) {
    html += renderAutomationSummary(data.automationSummary);
  }

  // 导出按钮
  html += renderExportButtons();

  dom.outputArea.innerHTML = html;
  dom.outputArea.classList.add('fade-in');

  // 统计数字动画
  animateNumbers();
}

// ===== 统计汇总栏 =====
function renderStatistics(data) {
  const dist = data.summary.priorityDistribution;
  const auto = data.automationSummary;
  const coverageRate = data.reviewReport ? data.reviewReport.coverageRate : 'N/A';
  const coverageNum = parseFloat(coverageRate) || 0;
  const coverageClass = coverageNum >= 80 ? 'coverage-high' : (coverageNum >= 50 ? 'coverage-medium' : 'coverage-low');

  return `
    <div class="bg-white rounded-xl shadow-sm mb-4 border border-slate-100 overflow-hidden">
      <div class="collapse-header flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          <h3 class="text-base font-semibold text-slate-800">统计汇总</h3>
        </div>
        <svg class="collapse-arrow w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </div>
      <div class="collapse-content px-5 py-4" style="max-height: 2000px;">
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div class="text-center p-3 bg-slate-50 rounded-lg">
          <div class="stat-number text-2xl font-bold text-slate-800" data-target="${data.summary.totalCases}">0</div>
          <div class="text-xs text-slate-500 mt-1">用例总数</div>
        </div>
        <div class="text-center p-3 bg-red-50 rounded-lg">
          <div class="stat-number text-2xl font-bold text-red-500" data-target="${dist.P0}">0</div>
          <div class="text-xs text-slate-500 mt-1">P0 核心</div>
        </div>
        <div class="text-center p-3 bg-orange-50 rounded-lg">
          <div class="stat-number text-2xl font-bold text-orange-500" data-target="${dist.P1}">0</div>
          <div class="text-xs text-slate-500 mt-1">P1 重要</div>
        </div>
        <div class="text-center p-3 bg-blue-50 rounded-lg">
          <div class="stat-number text-2xl font-bold text-blue-500" data-target="${dist.P2}">0</div>
          <div class="text-xs text-slate-500 mt-1">P2 一般</div>
        </div>
        <div class="text-center p-3 bg-slate-50 rounded-lg">
          <div class="stat-number text-2xl font-bold text-slate-500" data-target="${dist.P3}">0</div>
          <div class="text-xs text-slate-500 mt-1">P3 次要</div>
        </div>
        <div class="text-center p-3 bg-green-50 rounded-lg">
          <div class="stat-number text-2xl font-bold text-green-500" data-target="${parseFloat(auto.automationRate)}" data-suffix="%">0</div>
          <div class="text-xs text-slate-500 mt-1">自动化率</div>
        </div>
      </div>
      <div class="mt-4">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm text-slate-600">需求覆盖率</span>
          <span class="text-sm font-semibold text-slate-800">${coverageRate}</span>
        </div>
        <div class="coverage-bar">
          <div class="coverage-fill ${coverageClass}" style="width: ${coverageNum}%"></div>
        </div>
      </div>
      </div>
    </div>
  `;
}

// ===== 测试点树 =====
function renderTestPointTree(tree) {
  if (!tree || tree.length === 0) return '';

  let pointsHtml = '';
  tree.forEach(module => {
    pointsHtml += `<div class="tree-node">`;
    pointsHtml += `<div class="flex items-center gap-2 py-1 font-medium text-slate-700">`;
    pointsHtml += `<svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>`;
    pointsHtml += `<span>${escapeHtml(module.module)}</span>`;
    pointsHtml += `</div>`;
    pointsHtml += `<div class="tree-children">`;
    module.points.forEach(point => {
      const typeClass = getTreeTypeClass(point.type);
      const sourceTag = point.source === 'AI补充'
        ? '<span class="ai-supplement">⚠️ AI补充</span>'
        : '<span class="text-green-500 text-xs">✅ 已覆盖</span>';
      pointsHtml += `
        <div class="tree-point">
          <span class="text-slate-600">├</span>
          <span class="flex-1 text-slate-700">${escapeHtml(point.name)}</span>
          <span class="tree-type-tag ${typeClass}">${escapeHtml(point.type)}</span>
          ${sourceTag}
        </div>
      `;
    });
    pointsHtml += `</div></div>`;
  });

  return `
    <div class="bg-white rounded-xl shadow-sm mb-4 border border-slate-100 overflow-hidden">
      <div class="collapse-header flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span class="text-lg">🌳</span>
          <h3 class="text-base font-semibold text-slate-800">测试点树</h3>
        </div>
        <svg class="collapse-arrow w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </div>
      <div class="collapse-content px-5 py-4" style="max-height: 2000px;">
        ${pointsHtml}
      </div>
    </div>
  `;
}

function getTreeTypeClass(type) {
  const map = {
    '功能': 'tree-type-function',
    '边界': 'tree-type-boundary',
    '异常': 'tree-type-exception',
    '安全': 'tree-type-security',
    '性能': 'tree-type-performance',
    '并发': 'tree-type-concurrency',
    '权限': 'tree-type-permission',
    '兼容性': 'tree-type-compatibility'
  };
  return map[type] || 'tree-type-function';
}

// ===== 测试用例卡片 =====
function renderTestCases(cases) {
  if (!cases || cases.length === 0) return '';

  let cardsHtml = '';
  cases.forEach((tc, index) => {
    const purposeShort = tc.purpose.length > 20 ? tc.purpose.substring(0, 20) + '...' : tc.purpose;
    const priorityClass = `priority-p${tc.priority.charAt(1)}`;
    const autoClass = tc.automation.suitability === '✅' ? 'auto-yes' : (tc.automation.suitability === '⚠️' ? 'auto-partial' : 'auto-no');

    cardsHtml += `
      <div class="case-card bg-white rounded-lg border border-slate-200 overflow-hidden mb-3" style="animation-delay: ${index * 50}ms;" class="fade-in">
        <div class="collapse-header flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span class="text-sm font-mono font-bold text-slate-400">#${tc.id}</span>
            <span class="text-sm font-medium text-slate-700 truncate">${escapeHtml(purposeShort)}</span>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="priority-tag ${priorityClass}">${tc.priority}</span>
            <span class="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">${escapeHtml(tc.testLevel)}</span>
            <span class="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">${escapeHtml(tc.testType)}</span>
            <span class="text-sm font-semibold ${autoClass}">${tc.automation.suitability}</span>
            <svg class="collapse-arrow w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </div>
        </div>
        <div class="collapse-content px-4 py-4" style="max-height: 5000px;">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <span class="text-xs font-semibold text-slate-400 uppercase">测试目的</span>
              <p class="text-sm text-slate-700 mt-1">${escapeHtml(tc.purpose)}</p>
            </div>
            <div>
              <span class="text-xs font-semibold text-slate-400 uppercase">需求来源</span>
              <p class="text-sm text-slate-700 mt-1">${escapeHtml(tc.requirementSource)}</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <span class="text-xs font-semibold text-slate-400 uppercase">前置条件</span>
              <ol class="text-sm text-slate-700 mt-1 list-decimal list-inside space-y-0.5">
                ${tc.preconditions.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
              </ol>
            </div>
            <div>
              <span class="text-xs font-semibold text-slate-400 uppercase">自动化适用性</span>
              <div class="mt-1 p-2 bg-slate-50 rounded text-sm">
                <span class="font-semibold ${autoClass}">${tc.automation.suitability}</span>
                <span class="text-slate-600 ml-1">${escapeHtml(tc.automation.reason)}</span>
                ${tc.automation.suggestion ? `<div class="text-xs text-slate-500 mt-1">💡 ${escapeHtml(tc.automation.suggestion)}</div>` : ''}
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <span class="text-xs font-semibold text-slate-400 uppercase">测试步骤</span>
              <ol class="text-sm text-slate-700 mt-1 list-decimal list-inside space-y-1">
                ${tc.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
              </ol>
            </div>
            <div>
              <span class="text-xs font-semibold text-slate-400 uppercase">预期结果</span>
              <ol class="text-sm text-slate-700 mt-1 list-decimal list-inside space-y-1">
                ${tc.expectedResults.map(e => `<li>${escapeHtml(e)}</li>`).join('')}
              </ol>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  return `
    <div class="bg-white rounded-xl shadow-sm mb-4 border border-slate-100 overflow-hidden">
      <div class="collapse-header flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span class="text-lg">📋</span>
          <h3 class="text-base font-semibold text-slate-800">测试用例</h3>
          <span class="text-sm text-slate-400">(${cases.length} 条)</span>
        </div>
        <svg class="collapse-arrow w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </div>
      <div class="collapse-content px-5 py-4" style="max-height: 10000px;">
        ${cardsHtml}
      </div>
    </div>
  `;
}

// ===== AI 用例体检报告 =====
function renderReviewReport(report) {
  const coverageNum = parseFloat(report.coverageRate) || 0;
  const coverageClass = coverageNum >= 80 ? 'coverage-high' : (coverageNum >= 50 ? 'coverage-medium' : 'coverage-low');

  return `
    <div class="bg-white rounded-xl shadow-sm mb-4 border border-slate-100 overflow-hidden">
      <div class="collapse-header flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span class="text-lg">🔍</span>
          <h3 class="text-base font-semibold text-slate-800">AI 用例体检报告</h3>
        </div>
        <svg class="collapse-arrow w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </div>
      <div class="collapse-content px-5 py-4" style="max-height: 5000px;">
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-slate-700">📊 覆盖率分析</span>
            <span class="text-sm font-bold text-slate-800">${report.coverageRate}</span>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <span>已覆盖 ${report.coveredRequirements} / ${report.totalRequirements} 条需求</span>
          </div>
          <div class="coverage-bar">
            <div class="coverage-fill ${coverageClass}" style="width: ${coverageNum}%"></div>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <h4 class="text-sm font-semibold text-green-600 mb-2">✅ 已覆盖的需求点</h4>
            <ul class="text-xs text-slate-600 space-y-1">
              ${report.coveredPoints.map(p => `<li class="flex gap-1"><span class="text-green-400">•</span><span>${escapeHtml(p)}</span></li>`).join('')}
            </ul>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-purple-600 mb-2">⚠️ AI 补充的测试点</h4>
            <ul class="text-xs text-slate-600 space-y-1">
              ${report.supplementedPoints.map(p => `<li class="flex gap-1"><span class="text-purple-400">•</span><span>${escapeHtml(p)}</span></li>`).join('')}
            </ul>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-red-600 mb-2">❌ 可能遗漏的测试点</h4>
            <ul class="text-xs text-slate-600 space-y-1">
              ${report.possibleGaps.map(p => `<li class="flex gap-1"><span class="text-red-400">•</span><span>${escapeHtml(p)}</span></li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ===== 需求缺陷发现 =====
function renderDefects(defects) {
  const typeMap = {
    '遗漏': 'defect-omission',
    '矛盾': 'defect-contradiction',
    '模糊': 'defect-ambiguous',
    '不合理': 'defect-unreasonable'
  };
  const iconMap = { '遗漏': '🔴', '矛盾': '🟠', '模糊': '🟡', '不合理': '🟣' };

  return `
    <div class="bg-white rounded-xl shadow-sm mb-4 border border-slate-100 overflow-hidden">
      <div class="collapse-header flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span class="text-lg">🐛</span>
          <h3 class="text-base font-semibold text-slate-800">需求缺陷发现</h3>
          <span class="text-sm text-slate-400">(${defects.length} 项)</span>
        </div>
        <svg class="collapse-arrow w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </div>
      <div class="collapse-content px-5 py-4" style="max-height: 5000px;">
        ${defects.map(d => `
          <div class="defect-card ${typeMap[d.type] || 'defect-omission'}">
            <div class="flex items-center gap-2 mb-2">
              <span>${iconMap[d.type] || '🔴'}</span>
              <span class="font-semibold text-slate-800">${d.id}</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-white/60 font-medium">${escapeHtml(d.type)}</span>
            </div>
            <div class="text-sm text-slate-600 mb-1"><span class="font-medium">位置:</span> ${escapeHtml(d.location)}</div>
            <div class="text-sm text-slate-700 mb-2">${escapeHtml(d.description)}</div>
            <div class="text-sm text-blue-600"><span class="font-medium">💡 建议:</span> ${escapeHtml(d.suggestion)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ===== 风险分析 =====
function renderRiskAnalysis(risk) {
  return `
    <div class="bg-white rounded-xl shadow-sm mb-4 border border-slate-100 overflow-hidden">
      <div class="collapse-header flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span class="text-lg">⚠️</span>
          <h3 class="text-base font-semibold text-slate-800">风险分析</h3>
        </div>
        <svg class="collapse-arrow w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </div>
      <div class="collapse-content px-5 py-4" style="max-height: 5000px;">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 class="text-sm font-semibold mb-2 risk-high inline-block px-2 py-1 rounded">🔴 高风险区域</h4>
            <ul class="text-sm text-slate-600 space-y-2 mt-2">
              ${risk.highRiskAreas.map(r => `<li class="flex gap-2"><span class="text-red-400 mt-0.5">▸</span><span>${escapeHtml(r)}</span></li>`).join('')}
            </ul>
          </div>
          <div>
            <h4 class="text-sm font-semibold mb-2 risk-medium inline-block px-2 py-1 rounded">🟡 中风险区域</h4>
            <ul class="text-sm text-slate-600 space-y-2 mt-2">
              ${risk.mediumRiskAreas.map(r => `<li class="flex gap-2"><span class="text-orange-400 mt-0.5">▸</span><span>${escapeHtml(r)}</span></li>`).join('')}
            </ul>
          </div>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-blue-600 mb-2">💡 建议</h4>
          <ul class="text-sm text-slate-600 space-y-1">
            ${risk.suggestions.map(s => `<li class="flex gap-2"><span class="text-blue-400">•</span><span>${escapeHtml(s)}</span></li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  `;
}

// ===== 自动化建议汇总 =====
function renderAutomationSummary(summary) {
  const total = summary.totalCases || 1;
  const yesPct = (summary.fullyAutomated / total * 100).toFixed(1);
  const partialPct = (summary.partiallyAutomated / total * 100).toFixed(1);
  const noPct = (summary.manualOnly / total * 100).toFixed(1);

  return `
    <div class="bg-white rounded-xl shadow-sm mb-4 border border-slate-100 overflow-hidden">
      <div class="collapse-header flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span class="text-lg">🤖</span>
          <h3 class="text-base font-semibold text-slate-800">自动化建议汇总</h3>
        </div>
        <svg class="collapse-arrow w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </div>
      <div class="collapse-content px-5 py-4" style="max-height: 5000px;">
        <div class="grid grid-cols-3 gap-3 mb-4">
          <div class="text-center p-3 bg-green-50 rounded-lg">
            <div class="text-2xl font-bold text-green-500">${summary.fullyAutomated}</div>
            <div class="text-xs text-slate-500 mt-1">✅ 完全适合</div>
            <div class="text-xs text-green-400">${yesPct}%</div>
          </div>
          <div class="text-center p-3 bg-orange-50 rounded-lg">
            <div class="text-2xl font-bold text-orange-500">${summary.partiallyAutomated}</div>
            <div class="text-xs text-slate-500 mt-1">⚠️ 部分适合</div>
            <div class="text-xs text-orange-400">${partialPct}%</div>
          </div>
          <div class="text-center p-3 bg-red-50 rounded-lg">
            <div class="text-2xl font-bold text-red-500">${summary.manualOnly}</div>
            <div class="text-xs text-slate-500 mt-1">❌ 仅手动</div>
            <div class="text-xs text-red-400">${noPct}%</div>
          </div>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-blue-600 mb-2">💡 落地建议</h4>
          <ul class="text-sm text-slate-600 space-y-1">
            ${summary.suggestions.map(s => `<li class="flex gap-2"><span class="text-blue-400">•</span><span>${escapeHtml(s)}</span></li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  `;
}

// ===== 导出按钮 =====
function renderExportButtons() {
  return `
    <div class="bg-white rounded-xl shadow-sm mb-4 border border-slate-100 p-4">
      <div class="flex items-center gap-2 mb-3">
        <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
        <h3 class="text-base font-semibold text-slate-800">导出</h3>
      </div>
      <div class="flex flex-wrap gap-3">
        <button onclick="handleCopyMarkdown()" class="btn-secondary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          复制 Markdown
        </button>
        <button onclick="handleDownloadMarkdown()" class="btn-secondary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          下载 Markdown
        </button>
        <button onclick="handleDownloadExcel()" class="btn-secondary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          下载 Excel
        </button>
      </div>
    </div>
  `;
}

// ===== 导出处理 =====
function handleCopyMarkdown() {
  if (!state.currentData) { showToast('暂无数据可导出', 'error'); return; }
  const md = TestPilotEngine.generateMarkdown(state.currentData);
  navigator.clipboard.writeText(md).then(() => {
    showToast('已复制到剪贴板', 'success');
  }).catch(() => {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = md;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('已复制到剪贴板', 'success');
  });
}

function handleDownloadMarkdown() {
  if (!state.currentData) { showToast('暂无数据可导出', 'error'); return; }
  const md = TestPilotEngine.generateMarkdown(state.currentData);
  const title = state.currentData.metadata.documentTitle || '未命名文档';
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  TestPilotEngine.downloadFile(md, `TestPilot_${title}_${dateStr}.md`, 'text/markdown;charset=utf-8');
  showToast('Markdown 文件已下载', 'success');
}

function handleDownloadExcel() {
  if (!state.currentData) { showToast('暂无数据可导出', 'error'); return; }
  TestPilotEngine.generateExcel(state.currentData);
  showToast('Excel 文件已下载', 'success');
}

// ===== Toast 提示 =====
function showToast(message, type = '') {
  // 移除已有 Toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ===== 折叠/展开 =====
function toggleCollapse(header) {
  const content = header.nextElementSibling;
  const arrow = header.querySelector('.collapse-arrow');
  if (!content) return;

  if (content.style.maxHeight === '0px') {
    // 展开
    content.style.maxHeight = content.scrollHeight + 'px';
    content.classList.remove('collapsed');
    if (arrow) arrow.classList.remove('collapsed');
  } else {
    // 收起
    content.style.maxHeight = '0px';
    content.classList.add('collapsed');
    if (arrow) arrow.classList.add('collapsed');
  }
}

// ===== 统计数字动画 =====
function animateNumbers() {
  document.querySelectorAll('.stat-number').forEach(el => {
    const target = parseFloat(el.dataset.target) || 0;
    const suffix = el.dataset.suffix || '';
    const duration = 800;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      el.textContent = (Number.isInteger(target) ? Math.round(current) : current.toFixed(1)) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

// ===== 工具函数 =====
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function clearTimeouts(timers) {
  timers.forEach(t => clearTimeout(t));
}

// ===== 暴露全局函数 =====
window.handleCopyMarkdown = handleCopyMarkdown;
window.handleDownloadMarkdown = handleDownloadMarkdown;
window.handleDownloadExcel = handleDownloadExcel;

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', init);
