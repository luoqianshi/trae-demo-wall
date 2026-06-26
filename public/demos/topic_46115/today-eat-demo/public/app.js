const form = document.querySelector('#recommendForm');
const submitBtn = document.querySelector('#submitBtn');
const fillExampleBtn = document.querySelector('#fillExample');
const apiStatus = document.querySelector('#apiStatus');
const providerSelect = document.querySelector('#providerSelect');
const modelSelect = document.querySelector('#modelSelect');
const apiKeyInput = document.querySelector('#apiKeyInput');
const validateKeyBtn = document.querySelector('#validateKey');
const configHint = document.querySelector('#configHint');
const emptyState = document.querySelector('#emptyState');
const loading = document.querySelector('#loading');
const resultContent = document.querySelector('#resultContent');
const refreshHistoryBtn = document.querySelector('#refreshHistory');
const choiceHistory = document.querySelector('#choiceHistory');
const chatHistory = document.querySelector('#chatHistory');

let latestRecommendation = null;

const providerModels = {
  deepseek: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-v4-pro'],
  doubao: ['doubao-1-5-pro-32k-250115', 'doubao-1-5-lite-32k-250115'],
  glm: ['glm-4-flash', 'glm-4-plus', 'glm-4-air'],
  kimi: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  qwen: ['qwen-plus', 'qwen-turbo', 'qwen-max'],
  chatgpt: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini']
};

const providerNames = {
  deepseek: 'DeepSeek',
  doubao: '豆包',
  glm: 'GLM',
  kimi: 'Kimi',
  qwen: '千问',
  chatgpt: 'ChatGPT'
};

const example = {
  mealTime: '午餐',
  location: '上海，公司附近',
  weather: '32℃，闷热，下午可能下雨',
  lastMeal: '昨晚吃了炸鸡和可乐，今天早上只喝了咖啡',
  goal: ['减脂', '清淡'],
  goalCustom: '',
  hunger: '很饿',
  taste: '想吃一点辣，但不要太油',
  restrictions: '不吃香菜',
  budget: '35 元以内',
  timeLimit: '25 分钟内能吃上',
  mood: '下午要开会，不想吃完犯困，但希望有饱腹感'
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getFormData() {
  const data = Object.fromEntries(new FormData(form).entries());
  const goals = Array.from(form.querySelectorAll('input[name="goal"]:checked')).map((item) => item.value);
  const customGoal = form.elements.goalCustom?.value.trim();
  if (customGoal) goals.push(customGoal);
  data.goal = goals.length ? goals : ['正常吃'];
  delete data.goalCustom;
  return data;
}

function getAiConfig() {
  return {
    provider: providerSelect.value,
    model: modelSelect.value,
    apiKey: apiKeyInput.value.trim()
  };
}

function updateModelOptions() {
  const models = providerModels[providerSelect.value] || providerModels.deepseek;
  modelSelect.innerHTML = models
    .map((model) => `<option value="${escapeHtml(model)}">${escapeHtml(model)}</option>`)
    .join('');
}

function updateModeStatus(message) {
  const config = getAiConfig();
  const hasKey = Boolean(config.apiKey);
  apiStatus.textContent = hasKey ? `${providerNames[config.provider]} 待验证` : '演示模式';
  apiStatus.classList.toggle('ok', !hasKey);
  apiStatus.classList.toggle('bad', false);
  configHint.textContent = message || (hasKey ? '输入 Key 后可点击验证连通。' : '不输入 Key 时，会使用预设回答演示完整流程。');
}

function buildTakeoutLinks(keyword) {
  const query = encodeURIComponent(keyword || '健康午餐');
  return [
    {
      name: '去柴柴外卖搜',
      url: `https://example.com/chaichai/search?q=${query}`
    },
    {
      name: '去柳柳点评搜',
      url: `https://example.com/liuliu/search?q=${query}`
    }
  ];
}

function renderTakeoutButtons(keyword) {
  return buildTakeoutLinks(keyword)
    .map((link) => `
      <button class="takeout-link" type="button" data-url="${escapeHtml(link.url)}">
        ${escapeHtml(link.name)}
      </button>
    `)
    .join('');
}

function renderSelectButton(kind, index, label = '选择这个') {
  return `
    <button class="select-dish" type="button" data-kind="${kind}" data-index="${index}">
      ${escapeHtml(label)}
    </button>
  `;
}

function renderFeedbackButton(kind, index, label = '不想吃这个') {
  return `
    <button class="reject-dish" type="button" data-kind="${kind}" data-index="${index}">
      ${escapeHtml(label)}
    </button>
  `;
}

function showLinkFallback(url) {
  const oldTip = document.querySelector('.link-fallback');
  if (oldTip) oldTip.remove();

  const tip = document.createElement('div');
  tip.className = 'link-fallback';
  tip.innerHTML = `
    <strong>如果没有自动跳转，请复制链接到浏览器打开：</strong>
    <input readonly value="${escapeHtml(url)}">
  `;
  resultContent.prepend(tip);
}

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? 'AI 正在推荐中……' : '让 AI 推荐这一顿';
  loading.classList.toggle('hidden', !isLoading);
  emptyState.classList.add('hidden');
  if (isLoading) resultContent.classList.add('hidden');
}

function renderResult(data) {
  const alternatives = Array.isArray(data.alternatives) ? data.alternatives : [];
  const adjustments = Array.isArray(data.adjustments) ? data.adjustments : [];
  const basisTags = Array.isArray(data.basisTags) ? data.basisTags : [];
  const whyNot = Array.isArray(data.whyNot) ? data.whyNot : [];
  const primary = data.primary || {};
  const primaryKeyword = primary.takeoutKeyword || primary.name || '健康午餐';
  latestRecommendation = data;

  resultContent.innerHTML = `
    <div class="recommendation">
      <div class="main-dish">
        <div class="label">${data.demoMode ? '演示模式 · 最推荐' : '最推荐'}</div>
        <h3>${escapeHtml(primary.name || '这一顿建议清淡均衡')}</h3>
        ${primary.category ? `<div class="food-category">${escapeHtml(primary.category)}</div>` : ''}
        <p>${escapeHtml(data.summary || '根据你的当前状态，推荐选择更适合当下的一餐。')}</p>
        <div class="dish-actions">
          ${renderSelectButton('primary', 0, '选择这顿')}
          ${renderFeedbackButton('primary', 0, '不想吃这个')}
        </div>
      </div>

      ${basisTags.length ? `
        <div class="block">
          <h3>本次推荐依据</h3>
          <div class="basis-tags">
            ${basisTags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      <div class="block">
        <h3>为什么推荐它</h3>
        <p>${escapeHtml(primary.reason || 'AI 暂时没有给出详细理由。')}</p>
      </div>

      <div class="block">
        <h3>怎么点或怎么吃</h3>
        <p>${escapeHtml(primary.howToOrder || '可以按你的预算、时间和口味稍作调整。')}</p>
      </div>

      <div class="block">
        <h3>一键去外卖平台搜</h3>
        <p>搜索关键词：${escapeHtml(primaryKeyword)}</p>
        <div class="takeout-actions">
          ${renderTakeoutButtons(primaryKeyword)}
        </div>
      </div>

      <div class="block">
        <h3>健康提醒</h3>
        <p>${escapeHtml(primary.healthNote || '饮食建议仅供日常参考，如有明确疾病或医嘱，请优先遵循专业建议。')}</p>
      </div>

      <div class="alt-grid">
        ${alternatives.map((item, index) => `
          <div class="block">
            <h3>${escapeHtml(item.name || '备选方案')}</h3>
            ${item.category ? `<div class="food-category small">${escapeHtml(item.category)}</div>` : ''}
            <p>${escapeHtml(item.reason || '')}</p>
            <div class="dish-actions compact">
              ${renderSelectButton('alternative', index, '选择这个')}
              ${renderFeedbackButton('alternative', index, '不想吃')}
            </div>
            <div class="takeout-actions compact">
              ${renderTakeoutButtons(item.takeoutKeyword || item.name || '健康午餐')}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="block">
        <h3>这顿先避开</h3>
        <p>${escapeHtml(data.avoid || '暂无特别需要避开的食物。')}</p>
      </div>

      ${whyNot.length ? `
        <div class="block">
          <h3>为什么没推荐其他</h3>
          <ul class="reason-list">
            ${whyNot.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <div class="block">
        <h3>你还可以这样调整</h3>
        <ul class="adjustments">
          ${adjustments.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
  resultContent.classList.remove('hidden');
}

function renderHistory(data) {
  const choices = Array.isArray(data.choices) ? data.choices : [];
  const conversations = Array.isArray(data.conversations) ? data.conversations : [];

  choiceHistory.classList.toggle('empty-list', choices.length === 0);
  choiceHistory.innerHTML = choices.length
    ? choices.map((item) => `
      <article class="history-item">
        <div class="history-top">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(formatTime(item.createdAt))}</span>
        </div>
        <p>${escapeHtml(item.category || '未分类')} · ${escapeHtml(item.source || '推荐结果')}</p>
      </article>
    `).join('')
    : '还没有选择记录。';

  chatHistory.classList.toggle('empty-list', conversations.length === 0);
  chatHistory.innerHTML = conversations.length
    ? conversations.map((item) => {
      const profile = item.profile || {};
      const result = item.result || {};
      return `
        <article class="history-item">
          <div class="history-top">
            <strong>${escapeHtml(result.primary?.name || result.summary || '一次推荐')}</strong>
            <span>${escapeHtml(formatTime(item.createdAt))}</span>
          </div>
          <p>${escapeHtml(profile.mealTime || '未知餐次')} · 目标：${escapeHtml(Array.isArray(profile.goal) ? profile.goal.join('、') : (profile.goal || '未说明'))} · 口味：${escapeHtml(profile.taste || '未说明')}</p>
          <p>上一顿：${escapeHtml(profile.lastMeal || '未说明')}</p>
        </article>
      `;
    }).join('')
    : '还没有提问历史。';
}

async function loadHistory() {
  try {
    const response = await fetch('/api/history');
    const data = await response.json();
    renderHistory(data);
  } catch {
    choiceHistory.textContent = '历史记录加载失败，请确认服务正在运行。';
    chatHistory.textContent = '历史记录加载失败，请确认服务正在运行。';
  }
}

function getDishByButton(button) {
  if (!latestRecommendation) return null;

  if (button.dataset.kind === 'primary') {
    return latestRecommendation.primary;
  }

  const index = Number(button.dataset.index);
  return latestRecommendation.alternatives?.[index] || null;
}

async function saveDishChoice(button, sourceOverride) {
  const dish = getDishByButton(button);
  if (!dish?.name) return;

  const oldText = button.textContent;
  button.disabled = true;
  button.textContent = sourceOverride === '不想吃' ? '已避开' : '已记录';

  try {
    const response = await fetch('/api/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dish,
        source: sourceOverride || (button.dataset.kind === 'primary' ? '主推荐' : '备选推荐'),
        conversationId: latestRecommendation.conversationId
      })
    });

    if (!response.ok) throw new Error('保存失败');
    await loadHistory();
  } catch {
    button.textContent = '记录失败';
    setTimeout(() => {
      button.disabled = false;
      button.textContent = oldText;
    }, 1200);
  }
}

function renderError(message, detail = '') {
  resultContent.innerHTML = `
    <div class="recommendation">
      <div class="block error">
        <h3>推荐失败</h3>
        <p>${escapeHtml(message)}</p>
        ${detail ? `<p>${escapeHtml(detail)}</p>` : ''}
      </div>
    </div>
  `;
  resultContent.classList.remove('hidden');
}

async function checkHealth() {
  try {
    const response = await fetch('/api/health');
    await response.json();
    updateModeStatus();
  } catch {
    apiStatus.textContent = '服务未启动';
    apiStatus.classList.add('bad');
  }
}

fillExampleBtn.addEventListener('click', () => {
  Object.entries(example).forEach(([key, value]) => {
    if (key === 'goal') {
      form.querySelectorAll('input[name="goal"]').forEach((item) => {
        item.checked = value.includes(item.value);
      });
      return;
    }
    const field = form.elements[key];
    if (field) field.value = value;
  });
});

providerSelect.addEventListener('change', () => {
  updateModelOptions();
  updateModeStatus();
});

apiKeyInput.addEventListener('input', () => {
  updateModeStatus();
});

validateKeyBtn.addEventListener('click', async () => {
  const aiConfig = getAiConfig();

  validateKeyBtn.disabled = true;
  validateKeyBtn.textContent = '验证中…';
  configHint.textContent = aiConfig.apiKey ? '正在验证模型连通性。' : '未输入 Key，将使用演示模式。';

  try {
    const response = await fetch('/api/validate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aiConfig })
    });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      apiStatus.textContent = '验证失败';
      apiStatus.classList.remove('ok');
      apiStatus.classList.add('bad');
      configHint.textContent = data.detail || data.message || '验证失败，请检查 Key。';
      return;
    }

    apiStatus.textContent = data.demoMode ? '演示模式' : `${data.provider} 已连通`;
    apiStatus.classList.add('ok');
    apiStatus.classList.remove('bad');
    configHint.textContent = data.message;
  } catch (error) {
    apiStatus.textContent = '验证失败';
    apiStatus.classList.remove('ok');
    apiStatus.classList.add('bad');
    configHint.textContent = error.message;
  } finally {
    validateKeyBtn.disabled = false;
    validateKeyBtn.textContent = '验证连通';
  }
});

resultContent.addEventListener('click', (event) => {
  const selectButton = event.target.closest('.select-dish');
  if (selectButton) {
    saveDishChoice(selectButton);
    return;
  }

  const rejectButton = event.target.closest('.reject-dish');
  if (rejectButton) {
    saveDishChoice(rejectButton, '不想吃');
    return;
  }

  const button = event.target.closest('.takeout-link');
  if (!button) return;

  const url = button.dataset.url;
  if (!url) return;

  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) {
    showLinkFallback(url);
    return;
  }

  setTimeout(() => showLinkFallback(url), 300);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setLoading(true);

  try {
    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: getFormData(),
        aiConfig: getAiConfig()
      })
    });
    const data = await response.json();
    if (!response.ok) {
      renderError(data.error || '请求失败', data.detail ? JSON.stringify(data.detail) : '');
      return;
    }
    renderResult(data);
    await loadHistory();
  } catch (error) {
    renderError('无法连接本地服务，请确认 server.js 正在运行。', error.message);
  } finally {
    setLoading(false);
  }
});

refreshHistoryBtn.addEventListener('click', loadHistory);

updateModelOptions();
checkHealth();
loadHistory();
