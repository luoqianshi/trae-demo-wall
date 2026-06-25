/* ========================================================
   晚安鸭 · 应用主逻辑
   - 状态管理（当前配置、故事库、播放状态）
   - 视图切换
   - 冷启动流程
   - 故事生成动画
   - 播放控制
   - 继续讲机制
   - 故事库管理
   ======================================================== */

// ===== 应用状态 =====
const AppState = {
  // 用户配置
  config: {
    nickname: '',
    age: 4,
    ageStage: 'preschool',  // 年龄段：baby(0-2) | preschool(3-6) | school(7-12)
    gender: 'neutral',
    roleType: 'animal',
    customRoleName: '',   // 自定义角色名（冷启动输入）
    themeKey: 'patience',
    customTheme: null,    // 自定义主题对象（手动选择模式）
    themeMode: 'manual',  // 主题模式：manual 手动选择 | weekly 按每周计划
    firstTime: true
  },
  // 当前故事
  currentStory: null,
  // 睡前会话
  session: {
    baseRole: null,
    baseTheme: null,
    continueCount: 0,
    startedAt: null
  },
  // 故事库（模拟）
  library: {
    favorites: [...DEMO_FAVORITE_STORIES],
    recent: [...DEMO_RECENT_STORIES],
    similar: [...DEMO_SIMILAR_STORIES]
  },
  // 播放状态
  playback: {
    isPlaying: false,
    currentParagraph: 0,
    speed: 1.0,
    bgOn: false,
    teleprompter: false,
    progress: 0
  },
  // 偏好信号收集
  preferenceSignals: {
    favorites: [],
    feedbacks: [],
    completedPlays: [],
    roleHistory: []
  },
  // AI 配置
  aiConfig: {
    baseUrl: '',
    apiKey: '',
    model: '',
    enabled: false
  }
};

// ===== AI 配置管理 =====
function loadAIConfig() {
  try {
    const saved = localStorage.getItem('wananya_ai_config');
    if (saved) {
      const config = JSON.parse(saved);
      AppState.aiConfig = { ...AppState.aiConfig, ...config };
    }
  } catch (e) {
    console.warn('加载AI配置失败', e);
  }
  updateAIStatusUI();
}

function saveAIConfig() {
  const baseUrl = document.getElementById('aiBaseUrl').value.trim();
  const apiKey = document.getElementById('aiApiKey').value.trim();
  const model = document.getElementById('aiModel').value.trim();

  if (!baseUrl || !apiKey || !model) {
    showToast('请填写完整配置');
    return;
  }

  AppState.aiConfig = {
    baseUrl: baseUrl,
    apiKey: apiKey,
    model: model,
    enabled: true
  };

  try {
    localStorage.setItem('wananya_ai_config', JSON.stringify(AppState.aiConfig));
  } catch (e) {
    console.warn('保存AI配置失败', e);
  }

  updateAIStatusUI();
  showToast('AI 配置已保存 · 故事将由大模型生成');
}

function clearAIConfig() {
  AppState.aiConfig = { baseUrl: '', apiKey: '', model: '', enabled: false };
  try {
    localStorage.removeItem('wananya_ai_config');
  } catch (e) {}

  document.getElementById('aiBaseUrl').value = '';
  document.getElementById('aiApiKey').value = '';
  document.getElementById('aiModel').value = '';

  updateAIStatusUI();
  showToast('已清除配置 · 恢复模拟模式');
}

function updateAIStatusUI() {
  const dot = document.getElementById('aiStatusDot');
  const text = document.getElementById('aiStatusText');
  if (!dot || !text) return;

  if (AppState.aiConfig.enabled) {
    dot.classList.add('active');
    text.textContent = `已启用 · ${AppState.aiConfig.model}`;
  } else {
    dot.classList.remove('active');
    text.textContent = '未配置 · 使用模拟模式';
  }

  // 填充输入框
  const baseUrlInput = document.getElementById('aiBaseUrl');
  const apiKeyInput = document.getElementById('aiApiKey');
  const modelInput = document.getElementById('aiModel');
  if (baseUrlInput && !baseUrlInput.value) baseUrlInput.value = AppState.aiConfig.baseUrl;
  if (apiKeyInput && !apiKeyInput.value) apiKeyInput.value = AppState.aiConfig.apiKey;
  if (modelInput && !modelInput.value) modelInput.value = AppState.aiConfig.model;
}

async function testAIConfig() {
  if (!AppState.aiConfig.enabled) {
    showToast('请先保存配置');
    return;
  }

  const btn = document.getElementById('testAiBtn');
  if (btn) btn.textContent = '测试中...';

  try {
    const response = await fetch(`${AppState.aiConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AppState.aiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: AppState.aiConfig.model,
        messages: [{ role: 'user', content: '说"晚安"两个字' }],
        max_tokens: 20
      })
    });

    if (response.ok) {
      showToast('✓ 连接成功');
    } else {
      showToast(`✗ 连接失败：${response.status}`);
    }
  } catch (e) {
    showToast('✗ 连接失败：网络错误');
  } finally {
    if (btn) btn.textContent = '测试连接';
  }
}

// ===== AI 故事生成 =====
async function generateStoryWithAI(role, theme, style, age, nickname, isContinue, continueCount) {
  const prompt = buildStoryPrompt(role, theme, style, age, nickname, isContinue, continueCount);

  const response = await fetch(`${AppState.aiConfig.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AppState.aiConfig.apiKey}`
    },
    body: JSON.stringify({
      model: AppState.aiConfig.model,
      messages: [
        { role: 'system', content: '你是一个专业的儿童睡前故事创作专家，擅长为3-6岁孩子创作安全、温暖、适合入睡的故事。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    throw new Error(`API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // 解析返回的故事
  return parseAIStory(content, role, theme, style, isContinue, continueCount, age);
}

function buildStoryPrompt(role, theme, style, age, nickname, isContinue, continueCount) {
  const name = role.name;
  const themeName = theme.name;
  const themeCore = theme.core || '';
  const themeGraft = theme.graft || '';

  if (isContinue) {
    return `你正在为 ${age} 岁孩子生成睡前故事的"继续讲"版本。
这是同一晚睡前仪式中的第 ${continueCount + 1} 个故事。
前一个故事已经讲完，孩子可能还没有睡着。
主角是：${name}

请遵守：
1. 沿用主角：${name}
2. 不开启新的大冒险
3. 不引入复杂新角色
4. 不制造冲突、追逐、比赛、谜题或反转
5. 不再强化教育主题，只轻轻保留上一故事的温柔情绪
6. 句子更短，重复更多，节奏更慢
7. 结尾必须自然进入安静、闭眼、晚安或白噪音
8. 故事长度：${continueCount === 1 ? '200-300字' : '100-200字'}
9. 语言适合 ${age} 岁孩子

请直接输出故事正文，用换行分段，不要标题。`;
  }

  const nicknameLine = nickname ? `8. 可以在故事中用亲近的称呼"${nickname}"\n` : '';

  return `请为 ${age} 岁孩子创作一个睡前故事。

主角：${name}（${role.trait || ''}，${role.setting || ''}）
成长主题：${themeName}（${themeCore}）
故事风格：${style.name}

愿望嫁接要求：
${themeGraft || '把成长主题自然融入故事，通过主角的行为体现，不要直接说出主题名称，不要说教。'}

创作要求：
1. 4段结构：开场（建立安全感）→ 发展（遇到小问题）→ 转折（通过行为体现主题）→ 收尾（回到安全感，进入晚安）
2. 低冲突，无暴力，无恐怖，适合睡前
3. 句子短，节奏慢，语言柔软
4. 结尾必须安静、温暖，自然进入睡眠
5. 不要出现"这个故事告诉我们"等说教语句
6. 不要出现主题名称"${themeName}"
7. 故事长度：400-600字
${nicknameLine}
请直接输出故事正文，用换行分段，第一行是故事标题（用书名号《》包裹）。`;
}

function parseAIStory(content, role, theme, style, isContinue, continueCount, age) {
  // 兜底：如果内容为空
  if (!content || !content.trim()) {
    return {
      title: isContinue ? `${role.name}和安静的小夜晚` : `${role.name}的故事`,
      role: role, theme: theme, style: style,
      paragraphs: ['夜深了，月亮安安静静地挂在天上。' + role.name + '闭上了眼睛，慢慢地，慢慢地，进入了梦乡。晚安。'],
      isContinue: isContinue, continueCount: continueCount,
      duration: isContinue ? Math.max(60, 180 - continueCount * 60) : (age <= 4 ? 200 : 260)
    };
  }

  // 清理 markdown 格式符号
  let cleanedContent = content.trim()
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **粗体**
    .replace(/\*(.+?)\*/g, '$1')        // *斜体*
    .replace(/^#{1,6}\s+/gm, '')        // # 标题
    .replace(/^-\s+/gm, '')             // - 列表
    .replace(/^\d+\.\s+/gm, '');        // 1. 列表

  const lines = cleanedContent.split('\n').map(l => l.trim()).filter(l => l);

  let title = '';
  let paragraphs = [];

  // 尝试提取标题
  let startIdx = 0;
  if (lines[0]) {
    // 《标题》或【标题】格式
    if (lines[0].startsWith('《') || lines[0].startsWith('【')) {
      title = lines[0].replace(/[《【】》]/g, '').trim();
      startIdx = 1;
    }
    // "标题：xxx" 格式
    else if (/^标题[：:]/.test(lines[0])) {
      title = lines[0].replace(/^标题[：:]\s*/, '').trim();
      startIdx = 1;
    }
    // 短行作为标题
    else if (lines[0].length < 20 && !lines[0].includes('。') && !lines[0].includes('，')) {
      title = lines[0];
      startIdx = 1;
    }
  }

  // 收集所有正文行
  const bodyLines = lines.slice(startIdx);

  // 段落合并策略：
  // - 如果行数 >= 2，每行作为一个独立段落
  // - 如果只有1行（AI可能返回整段不换行），按句号切分
  if (bodyLines.length >= 2) {
    paragraphs = bodyLines;
  } else if (bodyLines.length === 1) {
    // 单行长文本，按句号切分为多个段落，每2-3句一段
    const sentences = bodyLines[0].split(/(?<=。)/).filter(s => s.trim());
    let currentPara = '';
    let sentenceCount = 0;
    for (const sentence of sentences) {
      currentPara += sentence;
      sentenceCount++;
      if (sentenceCount >= 2) {
        paragraphs.push(currentPara);
        currentPara = '';
        sentenceCount = 0;
      }
    }
    if (currentPara) paragraphs.push(currentPara);
  }

  // 兜底：如果仍然没有段落
  if (paragraphs.length === 0) {
    paragraphs = [cleanedContent];
  }

  // 如果没有标题，生成一个
  if (!title) {
    title = isContinue ? `${role.name}和安静的小夜晚` : `${role.name}的故事`;
  }

  return {
    title: title,
    role: role,
    theme: theme,
    style: style,
    paragraphs: paragraphs,
    isContinue: isContinue,
    continueCount: continueCount,
    duration: isContinue ? Math.max(60, 180 - continueCount * 60) : (age <= 4 ? 200 : 260)
  };
}

// ===== 视图切换 =====
function goTo(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.querySelector(`.view-${viewName}`);
  if (target) target.classList.add('active');

  // 顶部导航栏（欢迎页和设置页不显示）
  const topBar = document.getElementById('topBar');
  if (['welcome', 'onboarding'].includes(viewName)) {
    topBar.style.display = 'none';
  } else {
    topBar.style.display = 'flex';
  }

  // 底部安全提示
  const safetyFooter = document.getElementById('safetyFooter');
  if (['storycard', 'custom'].includes(viewName)) {
    safetyFooter.style.display = 'block';
  } else {
    safetyFooter.style.display = 'none';
  }

  // 视图特定初始化
  if (viewName === 'library') {
    renderLibrary('fav');
  } else if (viewName === 'emotion') {
    renderEmotionList();
  } else if (viewName === 'weekly') {
    renderWeeklyPlan();
  } else if (viewName === 'compare') {
    renderCompare();
  } else if (viewName === 'growth') {
    renderGrowthReport();
  } else if (viewName === 'aiconfig') {
    updateAIStatusUI();
  }
  window.scrollTo(0, 0);
}

function goHome() {
  if (AppState.config.firstTime) {
    goTo('onboarding');
  } else {
    goTo('storycard');
    renderStoryCard();
  }
}

// ===== Toast =====
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// ===== 冷启动流程 =====
let currentStep = 1;
const totalSteps = 5;

function nextStep() {
  if (currentStep < totalSteps) {
    currentStep++;
    updateStepUI();
    // 进入主题选择步骤时，根据性别动态渲染主题
    if (currentStep === 5) {
      renderThemeOptions();
    }
  } else {
    finishOnboarding();
  }
}

function updateStepUI() {
  document.getElementById('stepNum').textContent = currentStep;
  document.getElementById('progressBar').style.width = `${(currentStep / totalSteps) * 100}%`;

  document.querySelectorAll('.onboard-step').forEach(step => {
    step.classList.remove('active');
  });
  const targetStep = document.querySelector(`.onboard-step[data-step="${currentStep}"]`);
  if (targetStep) targetStep.classList.add('active');
}

// 根据性别动态渲染主题选项（调整默认排序，所有主题都可选）
function renderThemeOptions() {
  const container = document.getElementById('themeOptions');
  if (!container) return;

  const gender = AppState.config.gender || 'neutral';
  const order = THEME_GENDER_ORDER[gender] || THEME_GENDER_ORDER.neutral;

  // 按性别偏好排序渲染主题，第一个默认选中
  container.innerHTML = order.map((key, idx) => {
    const theme = THEME_LIBRARY[key];
    return `
      <div class="theme-option ${idx === 0 ? 'active' : ''}" data-theme="${key}" onclick="setTheme('${key}', this)">
        <div class="theme-emoji">${theme.emoji}</div>
        <div class="theme-name">${theme.name}</div>
        <div class="theme-desc">${theme.core}</div>
      </div>
    `;
  }).join('');

  // 默认选中排序第一的主题
  AppState.config.themeKey = order[0];
}

// 主题模式切换：manual 手动选择 | weekly 按每周计划
function switchThemeMode(mode) {
  AppState.config.themeMode = mode;

  // 切换 tab 激活态
  document.querySelectorAll('.theme-mode-tab').forEach(t => t.classList.remove('active'));
  const targetTab = document.querySelector(`.theme-mode-tab[data-mode="${mode}"]`);
  if (targetTab) targetTab.classList.add('active');

  // 切换面板
  const manualPanel = document.getElementById('themeManualPanel');
  const weeklyPanel = document.getElementById('themeWeeklyPanel');
  if (mode === 'weekly') {
    if (manualPanel) manualPanel.classList.remove('active');
    if (weeklyPanel) weeklyPanel.classList.add('active');
    renderWeeklyPreview();
  } else {
    if (weeklyPanel) weeklyPanel.classList.remove('active');
    if (manualPanel) manualPanel.classList.add('active');
  }
}

// 渲染本周计划预览（高亮今天，自动设置今晚主题）
function renderWeeklyPreview() {
  const container = document.getElementById('weeklyPreview');
  if (!container) return;

  const today = new Date().getDay(); // 0=周日, 1=周一...
  const todayIdx = today === 0 ? 6 : today - 1; // 转为周一=0
  const todayPlan = WEEKLY_PLAN[todayIdx];

  // 自动设置今晚主题为本周计划对应主题
  if (todayPlan && todayPlan.theme !== '复习周') {
    // 通过主题名反查 key
    const themeKey = Object.keys(THEME_LIBRARY).find(k => THEME_LIBRARY[k].name === todayPlan.theme);
    if (themeKey) {
      AppState.config.themeKey = themeKey;
    }
  }

  container.innerHTML = `
    <div class="weekly-today-card">
      <div class="weekly-today-label">今晚（${todayPlan.day}）</div>
      <div class="weekly-today-content">
        <span class="weekly-today-emoji">${todayPlan.emoji}</span>
        <div class="weekly-today-info">
          <div class="weekly-today-theme">主题：${todayPlan.theme}</div>
          <div class="weekly-today-role">推荐角色：${todayPlan.role}</div>
        </div>
      </div>
      <div class="weekly-today-hint">系统已按计划自动设置今晚主题</div>
    </div>
    <div class="weekly-plan-preview">
      <div class="weekly-plan-title">本周计划</div>
      ${WEEKLY_PLAN.map((item, idx) => `
        <div class="weekly-plan-row ${idx === todayIdx ? 'is-today' : ''}">
          <span class="wp-day">${item.day}</span>
          <span class="wp-emoji">${item.emoji}</span>
          <span class="wp-theme">${item.theme}</span>
          <span class="wp-role">${item.role}</span>
          ${idx === todayIdx ? '<span class="wp-today-tag">今天</span>' : ''}
        </div>
      `).join('')}
    </div>
    <div class="weekly-plan-tip">
      💡 每周计划固定品质不固定角色，孩子每天可以输入不同角色，成长主题保持连续
    </div>
  `;
}

function skipOnboarding() {
  AppState.config.firstTime = false;
  // 直接用默认值生成今晚故事卡
  const recommendation = recommendTonight(
    AppState.config.roleType,
    AppState.config.themeKey,
    AppState.config.age,
    AppState.config.nickname,
    AppState.config.gender,
    AppState.config.customRoleName,
    AppState.config.customTheme
  );
  AppState.currentStory = recommendation.story;
  renderStoryCard();
  goTo('storycard');
}

function setNickname(name) {
  const input = document.getElementById('childNickname');
  if (input) input.value = name;
  AppState.config.nickname = name;
}

function setAge(age, element) {
  AppState.config.age = age;
}

// 年龄段快速选择：baby(0-2) / preschool(3-6) / school(7-12)
function selectAgeStage(stage, element) {
  document.querySelectorAll('.age-stage-card').forEach(c => c.classList.remove('active'));
  if (element) element.classList.add('active');

  // 根据年龄段设置默认年龄并同步滑块
  let defaultAge = 4;
  if (stage === 'baby') defaultAge = 1;
  else if (stage === 'preschool') defaultAge = 4;
  else if (stage === 'school') defaultAge = 8;

  AppState.config.age = defaultAge;
  AppState.config.ageStage = stage;

  // 同步滑块
  const slider = document.getElementById('ageSlider');
  if (slider) slider.value = defaultAge;
  onAgeSliderChange(defaultAge);

  // 更新提示
  updateAgeNotice(stage);
}

// 精确年龄滑块变化
function onAgeSliderChange(value) {
  const age = parseInt(value);
  AppState.config.age = age;

  // 更新显示
  const valueEl = document.getElementById('agePickerValue');
  if (valueEl) valueEl.textContent = `${age} 岁`;

  // 根据年龄自动切换年龄段高亮
  let stage = 'preschool';
  if (age <= 2) stage = 'baby';
  else if (age >= 7) stage = 'school';

  AppState.config.ageStage = stage;

  document.querySelectorAll('.age-stage-card').forEach(c => c.classList.remove('active'));
  const targetCard = document.querySelector(`.age-stage-card[data-stage="${stage}"]`);
  if (targetCard) targetCard.classList.add('active');

  // 更新提示
  updateAgeNotice(stage);
}

// 年龄段提示
function updateAgeNotice(stage) {
  const notice = document.getElementById('ageNotice');
  if (!notice) return;

  if (stage === 'baby') {
    notice.style.display = 'block';
    notice.className = 'age-notice notice-info';
    notice.innerHTML = `
      <div class="notice-icon">💡</div>
      <div class="notice-content">
        <div class="notice-title">0-2 岁声音安抚期</div>
        <div class="notice-desc">该年龄段以白噪音、摇篮曲、韵律拟声词为主，暂未在 demo 中演示。当前 demo 聚焦 3-6 岁睡前故事核心场景，0-2 岁功能将在正式版中提供。</div>
      </div>
    `;
  } else if (stage === 'school') {
    notice.style.display = 'block';
    notice.className = 'age-notice notice-info';
    notice.innerHTML = `
      <div class="notice-icon">💡</div>
      <div class="notice-content">
        <div class="notice-title">7-12 岁自主阅读期</div>
        <div class="notice-desc">该年龄段支持更复杂故事、分支选择和共创模式，暂未在 demo 中演示。当前 demo 聚焦 3-6 岁睡前故事核心场景，7-12 岁功能将在 V2 版本中扩展。</div>
      </div>
    `;
  } else {
    notice.style.display = 'block';
    notice.className = 'age-notice notice-ok';
    notice.innerHTML = `
      <div class="notice-icon">✓</div>
      <div class="notice-content">
        <div class="notice-title">3-6 岁睡前故事期</div>
        <div class="notice-desc">demo 核心场景，完整支持愿望嫁接、渐进式续讲、情绪疗愈等全部功能</div>
      </div>
    `;
  }
}

function setGender(gender, element) {
  AppState.config.gender = gender;
  document.querySelectorAll('.gender-card').forEach(c => c.classList.remove('active'));
  if (element) element.classList.add('active');
}

function setRole(roleType, element) {
  AppState.config.roleType = roleType;
  document.querySelectorAll('.role-option').forEach(r => r.classList.remove('active'));
  if (element) element.classList.add('active');

  // 自定义角色输入区展开/收起
  const customInput = document.getElementById('customRoleInput');
  if (customInput) {
    if (roleType === 'custom') {
      customInput.style.display = 'block';
    } else {
      customInput.style.display = 'none';
    }
  }
}

// 设置冷启动阶段的自定义角色名
function setOnboardCustomRole(name) {
  const input = document.getElementById('onboardCustomRole');
  if (input) input.value = name;
  AppState.config.customRoleName = name;
}

function setTheme(themeKey, element) {
  AppState.config.themeKey = themeKey;
  AppState.config.customTheme = null; // 清除自定义主题
  document.querySelectorAll('.theme-option').forEach(t => t.classList.remove('active'));
  if (element) element.classList.add('active');

  // 隐藏自定义主题选中状态
  const selectedEl = document.getElementById('customThemeSelected');
  if (selectedEl) selectedEl.style.display = 'none';
}

// 展开/收起自定义主题输入区
function toggleCustomThemeInput() {
  const body = document.getElementById('customThemeBody');
  const arrow = document.getElementById('ctArrow');
  if (!body || !arrow) return;

  if (body.style.display === 'none') {
    body.style.display = 'block';
    arrow.textContent = '▴';
  } else {
    body.style.display = 'none';
    arrow.textContent = '▾';
  }
}

// 快捷填充自定义主题
function setCustomTheme(name, desc) {
  const nameInput = document.getElementById('customThemeName');
  const descInput = document.getElementById('customThemeDesc');
  if (nameInput) nameInput.value = name;
  if (descInput) descInput.value = desc || '';
}

// 应用自定义主题
function applyCustomTheme() {
  const nameInput = document.getElementById('customThemeName');
  const descInput = document.getElementById('customThemeDesc');
  const name = nameInput && nameInput.value.trim();
  const desc = descInput && descInput.value.trim();

  if (!name) {
    showToast('请输入自定义培养方向');
    return;
  }

  // 构造自定义主题对象
  const customTheme = {
    key: 'custom_' + Date.now(),
    name: name,
    emoji: '✨',
    core: desc || `${name}也是一种成长`,
    graft: `让主角在故事中通过一个小小的经历体现"${name}"的品质，不要直接说出主题名称，通过行为自然展现`,
    behaviors: [
      `虽然有点难，但还是试着去做到`,
      `一点一点地，慢慢就做好了`,
      `发现做到之后，心里暖暖的`,
      `原来${name}也是一种了不起的能力`
    ]
  };

  // 保存到状态
  AppState.config.customTheme = customTheme;
  AppState.config.themeKey = customTheme.key;

  // 取消预设主题的选中
  document.querySelectorAll('.theme-option').forEach(t => t.classList.remove('active'));

  // 显示选中状态
  const selectedEl = document.getElementById('customThemeSelected');
  if (selectedEl) {
    selectedEl.style.display = 'block';
    selectedEl.innerHTML = `
      <div class="cts-content">
        <span class="cts-emoji">${customTheme.emoji}</span>
        <div class="cts-info">
          <div class="cts-name">${customTheme.name}</div>
          <div class="cts-desc">${customTheme.core}</div>
        </div>
        <span class="cts-tag">自定义</span>
      </div>
    `;
  }

  // 收起输入区
  const body = document.getElementById('customThemeBody');
  const arrow = document.getElementById('ctArrow');
  if (body) body.style.display = 'none';
  if (arrow) arrow.textContent = '▾';

  showToast(`已选择自定义主题：${name}`);
}

function finishOnboarding() {
  try {
    // 保存昵称
    const nicknameInput = document.getElementById('childNickname');
    if (nicknameInput && nicknameInput.value) {
      AppState.config.nickname = nicknameInput.value.trim();
    }

    // 保存自定义角色名（如果有输入）
    if (AppState.config.roleType === 'custom') {
      const customInput = document.getElementById('onboardCustomRole');
      if (customInput && customInput.value.trim()) {
        AppState.config.customRoleName = customInput.value.trim();
      }
    }

    AppState.config.firstTime = false;

    // 如果有自定义主题，使用自定义主题对象
    let themeKey = AppState.config.themeKey;
    let customTheme = AppState.config.customTheme;

    // 生成并跳转到今晚故事卡
    const recommendation = recommendTonight(
      AppState.config.roleType,
      themeKey,
      AppState.config.age,
      AppState.config.nickname,
      AppState.config.gender,
      AppState.config.customRoleName,
      customTheme
    );
    AppState.currentStory = recommendation.story;

    // 初始化睡前会话
    AppState.session.baseRole = AppState.currentStory.role;
    AppState.session.baseTheme = AppState.currentStory.theme;
    AppState.session.startedAt = Date.now();
    AppState.session.continueCount = 0;

    // 记录角色历史（用于偏好学习）
    AppState.preferenceSignals.roleHistory.push({
      role: AppState.currentStory.role.name,
      theme: AppState.currentStory.theme.name,
      time: Date.now()
    });

    renderStoryCard();
    goTo('storycard');
  } catch (e) {
    console.error('finishOnboarding 错误:', e);
    showToast('生成故事时出错了：' + e.message);
  }
}

// ===== 今晚故事卡渲染 =====
function renderStoryCard() {
  const story = AppState.currentStory;
  if (!story) return;

  // 更新问候语
  const greetEl = document.getElementById('greetName');
  if (greetEl) {
    if (AppState.config.nickname) {
      greetEl.textContent = `，${AppState.config.nickname}`;
    } else {
      greetEl.textContent = '';
    }
  }

  // 标题
  const titleEl = document.getElementById('storyTitle');
  if (titleEl) titleEl.textContent = story.title;

  // 插图 Emoji
  const illustrationEl = document.querySelector('.illustration-emoji');
  if (illustrationEl) {
    illustrationEl.textContent = `${story.role.emoji} ${story.theme.emoji}`;
  }

  // meta 信息
  const metaRole = document.getElementById('metaRole');
  const metaTheme = document.getElementById('metaTheme');
  const metaStyle = document.getElementById('metaStyle');

  if (metaRole) metaRole.textContent = story.role.name;
  if (metaTheme) metaTheme.textContent = story.theme.name;
  if (metaStyle) metaStyle.textContent = story.style.name;

  // 时长
  const durationEl = document.getElementById('cardDuration');
  if (durationEl) {
    const minutes = Math.round(story.duration / 60);
    durationEl.textContent = `约 ${minutes} 分钟`;
  }

  // 推荐理由
  const reasonEl = document.getElementById('recommendReason');
  if (reasonEl) {
    reasonEl.textContent = `基于孩子的角色偏好和${story.theme.name}主题推荐 · 适合${AppState.config.age}岁孩子`;
  }
}

// ===== 微调面板 =====
function toggleTune(type) {
  const panel = document.getElementById('tunePanel');
  const options = document.getElementById('tuneOptions');
  const title = document.getElementById('tuneTitle');

  if (!panel || !options) return;

  panel.classList.add('active');

  if (type === 'role') {
    title.textContent = '换一个主角';
    const roles = getRolesByType(AppState.config.roleType);
    options.innerHTML = roles.map(r => `
      <div class="tune-option ${r.name === AppState.currentStory.role.name ? 'active' : ''}"
           onclick="selectRole('${r.name}', '${r.emoji}', '${r.trait.replace(/'/g, "\\'")}', '${r.setting.replace(/'/g, "\\'")}')">
        <span class="tune-option-emoji">${r.emoji}</span>
        <div class="tune-option-text">
          <div class="tune-option-title">${r.name}</div>
          <div class="tune-option-desc">${r.trait}</div>
        </div>
      </div>
    `).join('');
  } else if (type === 'theme') {
    title.textContent = '换一个主题';
    const themes = getAllThemes();
    options.innerHTML = themes.map(t => `
      <div class="tune-option ${t.key === AppState.currentStory.theme.key ? 'active' : ''}"
           onclick="selectTheme('${t.key}', '${t.name}', '${t.emoji}', '${t.core.replace(/'/g, "\\'")}')">
        <span class="tune-option-emoji">${t.emoji}</span>
        <div class="tune-option-text">
          <div class="tune-option-title">${t.name}</div>
          <div class="tune-option-desc">${t.core}</div>
        </div>
      </div>
    `).join('');
  } else if (type === 'style') {
    title.textContent = '换一种风格';
    const styles = getAllStyles();
    options.innerHTML = styles.map(s => `
      <div class="tune-option ${s.key === AppState.currentStory.style.key ? 'active' : ''}"
           onclick="selectStyle('${s.key}', '${s.name}', '${s.desc.replace(/'/g, "\\'")}')">
        <span class="tune-option-emoji">✨</span>
        <div class="tune-option-text">
          <div class="tune-option-title">${s.name}</div>
          <div class="tune-option-desc">${s.desc}</div>
        </div>
      </div>
    `).join('');
  }
}

function closeTune() {
  const panel = document.getElementById('tunePanel');
  if (panel) panel.classList.remove('active');
}

function selectRole(name, emoji, trait, setting) {
  const role = { name, emoji, trait, setting };
  const theme = AppState.currentStory.theme;
  const style = AppState.currentStory.style;
  AppState.currentStory = generateStory(role, theme, style, AppState.config.age, AppState.config.nickname, false, 0);
  AppState.session.baseRole = role;
  closeTune();
  renderStoryCard();
  showToast('已换一个主角');
}

function selectTheme(key, name, emoji, core) {
  const role = AppState.currentStory.role;
  const theme = { key, name, emoji, core, behaviors: THEME_LIBRARY[key].behaviors };
  const style = AppState.currentStory.style;
  AppState.currentStory = generateStory(role, theme, style, AppState.config.age, AppState.config.nickname, false, 0);
  AppState.session.baseTheme = theme;
  closeTune();
  renderStoryCard();
  showToast('已换一个主题');
}

function selectStyle(key, name, desc) {
  const role = AppState.currentStory.role;
  const theme = AppState.currentStory.theme;
  const style = { key, name, desc };
  AppState.currentStory = generateStory(role, theme, style, AppState.config.age, AppState.config.nickname, false, 0);
  closeTune();
  renderStoryCard();
  showToast('已换一种风格');
}

// ===== 故事生成动画 =====
async function startGenerate() {
  goTo('generate');

  const steps = document.querySelectorAll('.pipeline-step');
  const hint = document.getElementById('generateHint');
  const safetyPanel = document.getElementById('safetyCheckPanel');
  const graftPanel = document.getElementById('graftPanel');

  // 隐藏面板
  if (safetyPanel) safetyPanel.style.display = 'none';
  if (graftPanel) graftPanel.style.display = 'none';

  // 填充愿望嫁接信息
  const story = AppState.currentStory;
  if (story) {
    const graftRole = document.getElementById('graftRole');
    const graftTheme = document.getElementById('graftTheme');
    const graftResult = document.getElementById('graftResult');
    if (graftRole) graftRole.textContent = story.role.name;
    if (graftTheme) graftTheme.textContent = story.theme.name;
    if (graftResult) graftResult.textContent = story.title;
  }

  const hints = [
    '让角色变得温柔可爱、适合睡前...',
    '把主题融入故事里，不生硬说教...',
    '构思故事的开场、发展和结尾...',
    '让语言柔软一点，慢一点，暖一点...',
    '检查有没有不适合睡前的内容...'
  ];

  let stepIndex = 0;

  // 如果 AI 模式启用，尝试用 AI 生成
  let aiStory = null;
  if (AppState.aiConfig.enabled && story && !story.isContinue) {
    try {
      hint.textContent = '🤖 AI 正在创作故事...';
      aiStory = await generateStoryWithAI(
        story.role, story.theme, story.style,
        AppState.config.age, AppState.config.nickname,
        false, 0
      );

      // 校验 AI 返回的故事是否有效
      if (aiStory && aiStory.paragraphs && aiStory.paragraphs.length > 0) {
        AppState.currentStory = aiStory;
        const graftResult = document.getElementById('graftResult');
        if (graftResult) graftResult.textContent = aiStory.title;
      } else {
        console.warn('AI 返回的故事内容为空，回退到模拟模式');
        hint.textContent = 'AI 返回内容异常，使用模拟故事...';
        aiStory = null;
      }
    } catch (e) {
      console.warn('AI 生成失败，回退到模拟模式', e);
      hint.textContent = 'AI 暂时不可用，使用模拟故事...';
      aiStory = null;
    }
  } else if (AppState.aiConfig.enabled && story && story.isContinue) {
    try {
      hint.textContent = '🤖 AI 正在创作更安静的故事...';
      aiStory = await generateStoryWithAI(
        AppState.session.baseRole, AppState.session.baseTheme,
        story.style || { name: '温柔入睡' },
        AppState.config.age, AppState.config.nickname,
        true, AppState.session.continueCount
      );

      // 校验 AI 返回的故事是否有效
      if (aiStory && aiStory.paragraphs && aiStory.paragraphs.length > 0) {
        AppState.currentStory = aiStory;
      } else {
        console.warn('AI 继续讲返回内容为空，回退到模拟模式');
        aiStory = null;
      }
    } catch (e) {
      console.warn('AI 继续讲生成失败，回退到模拟模式', e);
      aiStory = null;
    }
  }

  function activateNextStep() {
    if (stepIndex > 0 && steps[stepIndex - 1]) {
      steps[stepIndex - 1].classList.remove('active');
      steps[stepIndex - 1].classList.add('done');
    }

    if (stepIndex < steps.length) {
      steps[stepIndex].classList.add('active');
      if (hint) hint.textContent = hints[stepIndex];

      // 第2步：显示愿望嫁接面板
      if (stepIndex === 1 && graftPanel) {
        graftPanel.style.display = 'block';
      }

      // 第5步：显示安全自检面板
      if (stepIndex === 4 && safetyPanel) {
        safetyPanel.style.display = 'block';
        runSafetyCheck();
      }

      stepIndex++;
      setTimeout(activateNextStep, 700);
    } else {
      // 完成后跳转到播放页
      setTimeout(() => {
        enterPlayback();
      }, 500);
    }
  }

  // 重置状态
  steps.forEach(s => {
    s.classList.remove('active', 'done');
  });

  setTimeout(activateNextStep, 300);
}

// 安全自检动画
function runSafetyCheck() {
  const items = document.querySelectorAll('.safety-check-item');
  items.forEach(item => {
    item.classList.remove('checking', 'passed');
    const status = item.querySelector('.check-status');
    if (status) status.textContent = '检查中';
  });

  items.forEach((item, idx) => {
    setTimeout(() => {
      item.classList.add('checking');
      setTimeout(() => {
        item.classList.remove('checking');
        item.classList.add('passed');
        const status = item.querySelector('.check-status');
        if (status) status.textContent = '✓ 通过';
      }, 400);
    }, idx * 200);
  });
}

// ===== 自定义故事 =====
function setCustomRole(name) {
  const input = document.getElementById('customRole');
  if (input) input.value = name;
}

function startCustomGenerate() {
  const input = document.getElementById('customRole');
  const customRole = input && input.value.trim() ? input.value.trim() : '小恐龙';

  // 获取当前选中的主题
  const activeTheme = document.querySelector('.mini-themes .mini-theme.active');
  const themeKey = activeTheme ? activeTheme.dataset.theme : AppState.config.themeKey;

  AppState.currentStory = generateCustomStory(customRole, themeKey, AppState.config.age, AppState.config.nickname);

  // 重置睡前会话
  AppState.session.baseRole = AppState.currentStory.role;
  AppState.session.baseTheme = AppState.currentStory.theme;
  AppState.session.continueCount = 0;

  startGenerate();
}

// 渲染自定义页的主题选择器
function initCustomThemes() {
  const container = document.getElementById('miniThemes');
  if (!container) return;

  const themes = getAllThemes();
  container.innerHTML = themes.map((t, i) => `
    <div class="mini-theme ${i === 0 ? 'active' : ''}" data-theme="${t.key}"
         onclick="selectCustomTheme(this, '${t.key}')">
      ${t.emoji} ${t.name}
    </div>
  `).join('');

  // 默认选中第一个主题
  AppState.config.customThemeKey = themes[0].key;
}

function selectCustomTheme(element, themeKey) {
  document.querySelectorAll('.mini-themes .mini-theme').forEach(t => t.classList.remove('active'));
  element.classList.add('active');
  AppState.config.customThemeKey = themeKey;
}

// ===== 进入播放页 =====
function enterPlayback() {
  // 重置播放状态
  AppState.playback.currentParagraph = 0;
  AppState.playback.isPlaying = true;
  AppState.playback.progress = 0;

  // 渲染故事文本
  renderStoryContent();
  goTo('play');

  // 显示正确模式
  togglePlayMode(AppState.playback.teleprompter);

  // 开始模拟播放进度
  startPlaybackSimulation();

  // 加入最近听过
  addToRecent();
}

function renderStoryContent() {
  const story = AppState.currentStory;
  if (!story) return;

  // 更新标题
  const titleEl = document.getElementById('playTitle');
  if (titleEl) titleEl.textContent = story.title;

  // AI 朗读模式文本
  const storyText = document.getElementById('storyText');
  if (storyText) {
    storyText.innerHTML = story.paragraphs.map(p => `<p>${p}</p>`).join('');
  }

  // 提词器模式文本
  const teleContent = document.getElementById('teleContent');
  if (teleContent) {
    teleContent.innerHTML = story.paragraphs.map(p => `<p>${p}</p>`).join('');
  }

  // 重置收藏按钮
  const favBtn = document.getElementById('favBtn');
  if (favBtn) {
    const isFav = AppState.library.favorites.some(f => f.title === story.title);
    favBtn.textContent = isFav ? '⭐ 已收藏' : '⭐ 收藏';
  }

  // 重置继续讲按钮
  const continueBtn = document.getElementById('continueBtn');
  if (continueBtn) {
    if (AppState.session.continueCount === 0) {
      continueBtn.textContent = '💤 孩子没睡？继续讲';
    } else if (AppState.session.continueCount === 1) {
      continueBtn.textContent = '💤 再讲一个更短的';
    } else {
      continueBtn.textContent = '🌙 进入安静尾声';
    }
  }
}

// ===== 播放模式切换（AI朗读 / 家长提词器）=====
function switchMode() {
  AppState.playback.teleprompter = !AppState.playback.teleprompter;
  togglePlayMode(AppState.playback.teleprompter);
  showToast(AppState.playback.teleprompter ? '家长朗读模式' : 'AI 朗读模式');
}

function togglePlayMode(isTeleprompter) {
  const aiMode = document.querySelector('.play-mode:not(.teleprompter-mode)');
  const teleMode = document.querySelector('.teleprompter-mode');
  if (!aiMode || !teleMode) return;

  if (isTeleprompter) {
    aiMode.style.display = 'none';
    teleMode.style.display = 'block';
  } else {
    aiMode.style.display = 'block';
    teleMode.style.display = 'none';
  }
}

// ===== 播放控制 =====
function togglePlay() {
  AppState.playback.isPlaying = !AppState.playback.isPlaying;
  const btn = document.getElementById('playPauseBtn');
  if (btn) btn.textContent = AppState.playback.isPlaying ? '⏸️' : '▶️';
  showToast(AppState.playback.isPlaying ? '继续播放' : '已暂停');
}

function toggleSpeed() {
  const speeds = [1.0, 0.85, 0.7];
  const currentIdx = speeds.indexOf(AppState.playback.speed);
  const nextIdx = (currentIdx + 1) % speeds.length;
  AppState.playback.speed = speeds[nextIdx];

  const btn = document.getElementById('speedBtn');
  if (btn) btn.textContent = `速度 ${AppState.playback.speed.toFixed(2)}x`;
}

function toggleBg() {
  AppState.playback.bgOn = !AppState.playback.bgOn;
  showToast(AppState.playback.bgOn ? '🎵 背景音乐开' : '背景音乐关');
}

function toggleFontSize() {
  const content = document.getElementById('teleContent');
  if (!content) return;
  const sizes = ['18px', '22px', '26px'];
  const current = content.style.fontSize || '22px';
  const idx = sizes.indexOf(current);
  const next = sizes[(idx + 1) % sizes.length];
  content.style.fontSize = next;
  content.querySelectorAll('p').forEach(p => p.style.fontSize = next);
  showToast(`字号已调整`);
}

// ===== 模拟播放进度 =====
let playbackTimer = null;
function startPlaybackSimulation() {
  // 清理之前的
  if (playbackTimer) clearInterval(playbackTimer);

  const progressBar = document.getElementById('playProgressBar');
  const totalDuration = AppState.currentStory.duration;
  const startTime = Date.now();
  let elapsed = 0;

  AppState.playback.progress = 0;

  playbackTimer = setInterval(() => {
    if (!AppState.playback.isPlaying) {
      // 暂停时不更新进度，但保持定时检查
      return;
    }

    elapsed += 0.1 * AppState.playback.speed;
    const progress = Math.min((elapsed / totalDuration) * 100, 100);
    AppState.playback.progress = progress;
    if (progressBar) progressBar.style.width = `${progress}%`;

    if (progress >= 100) {
      clearInterval(playbackTimer);
      AppState.playback.isPlaying = false;
      const btn = document.getElementById('playPauseBtn');
      if (btn) btn.textContent = '▶️';
    }
  }, 100);
}

function confirmExit() {
  if (playbackTimer) clearInterval(playbackTimer);
  goHome();
}

// ===== 收藏 =====
function toggleFavorite() {
  const story = AppState.currentStory;
  if (!story) return;

  const idx = AppState.library.favorites.findIndex(f => f.title === story.title);
  if (idx >= 0) {
    AppState.library.favorites.splice(idx, 1);
    showToast('已取消收藏');
  } else {
    AppState.library.favorites.unshift({
      id: 'fav_' + Date.now(),
      title: story.title,
      emoji: `${story.role.emoji}${story.theme.emoji}`,
      theme: story.theme.name,
      time: '刚刚',
      savedAt: Date.now()
    });
    showToast('已收藏 · 可在故事库中回放');
  }

  const favBtn = document.getElementById('favBtn');
  if (favBtn) {
    const isFav = AppState.library.favorites.some(f => f.title === story.title);
    favBtn.textContent = isFav ? '⭐ 已收藏' : '⭐ 收藏';
  }
}

// ===== 加入最近 =====
function addToRecent() {
  const story = AppState.currentStory;
  if (!story) return;

  // 去重
  const existsIdx = AppState.library.recent.findIndex(r => r.title === story.title);
  if (existsIdx >= 0) AppState.library.recent.splice(existsIdx, 1);

  AppState.library.recent.unshift({
    id: 'recent_' + Date.now(),
    title: story.title,
    emoji: `${story.role.emoji}${story.theme.emoji}`,
    theme: story.theme.name,
    time: '刚刚',
    savedAt: Date.now()
  });

  // 最多保留 10 条
  if (AppState.library.recent.length > 10) {
    AppState.library.recent = AppState.library.recent.slice(0, 10);
  }

  // 记录角色历史
  AppState.preferenceSignals.roleHistory.push({
    role: story.role.name,
    theme: story.theme.name,
    time: Date.now()
  });
}

// ===== 轻反馈 =====
function submitFeedback(type, evt) {
  const story = AppState.currentStory;
  if (!story) return;

  // 记录反馈
  AppState.preferenceSignals.feedbacks.push({
    type: type,
    role: story.role.name,
    theme: story.theme.name,
    time: Date.now()
  });

  // 更新按钮状态
  document.querySelectorAll('.feedback-btn').forEach(btn => btn.classList.remove('selected'));
  if (evt && evt.currentTarget) {
    evt.currentTarget.classList.add('selected');
  }

  // 显示偏好学习面板
  showPreferenceLearning(type);

  // 反馈提示
  const messages = {
    like: '已记录 · 会多推荐类似故事',
    exciting: '已记录 · 下次降低冒险强度',
    preachy: '已记录 · 下次减少主题直白表达',
    unsuitable: '已记录 · 已标记为不合适'
  };
  showToast(messages[type] || '感谢反馈');
}

// 偏好学习展示
function showPreferenceLearning(feedbackType) {
  const panel = document.getElementById('preferencePanel');
  const list = document.getElementById('prefList');
  if (!panel || !list) return;

  const signals = [];

  // 基于反馈类型生成学习信号
  if (feedbackType === 'like') {
    signals.push({
      signal: `收藏了${AppState.currentStory.role.name}的故事`,
      action: '优先推荐该角色'
    });
    signals.push({
      signal: `喜欢${AppState.currentStory.theme.name}主题`,
      action: '增加同类主题推荐'
    });
  } else if (feedbackType === 'exciting') {
    signals.push({
      signal: '反馈"太刺激"',
      action: '降低冒险强度'
    });
    signals.push({
      signal: '检测到高刺激情节',
      action: '下次避免追逐、战斗'
    });
  } else if (feedbackType === 'preachy') {
    signals.push({
      signal: '反馈"太说教"',
      action: '降低主题显性度'
    });
    signals.push({
      signal: '检测到直接点题',
      action: '更隐性表达主题'
    });
  } else if (feedbackType === 'unsuitable') {
    signals.push({
      signal: '标记为不合适',
      action: '不再推荐类似内容'
    });
  }

  // 基于历史生成信号
  const roleHistory = AppState.preferenceSignals.roleHistory;
  if (roleHistory.length >= 2) {
    const recentRoles = roleHistory.slice(-3).map(r => r.role);
    const roleCounts = {};
    recentRoles.forEach(r => { roleCounts[r] = (roleCounts[r] || 0) + 1; });
    const topRole = Object.keys(roleCounts).sort((a, b) => roleCounts[b] - roleCounts[a])[0];
    if (roleCounts[topRole] >= 2) {
      signals.push({
        signal: `最近 ${roleHistory.length} 次都听${topRole}`,
        action: '当前角色偏好已锁定'
      });
    }
  }

  // 渲染
  panel.style.display = 'block';
  list.innerHTML = signals.map(s => `
    <div class="pref-item">
      <span class="pref-signal">📊 ${s.signal}</span>
      <span class="pref-action">→ ${s.action}</span>
    </div>
  `).join('');
}

// ===== 继续讲 =====
// 递进参数配置
const PROGRESSION_CONFIG = [
  { duration: '4 分钟', speed: '慢', plot: '轻情节', volume: '正常偏低', barHeight: '100%' },
  { duration: '2-3 分钟', speed: '更慢', plot: '减少事件', volume: '降低', barHeight: '60%' },
  { duration: '1-2 分钟', speed: '极慢', plot: '几乎无情节', volume: '更低', barHeight: '30%' },
  { duration: '30-60 秒', speed: '接近耳语', plot: '不再生成', volume: '很低', barHeight: '10%' }
];

function startContinue() {
  AppState.session.continueCount++;

  // 更新递进可视化
  updateProgressionViz(AppState.session.continueCount);

  if (AppState.session.continueCount > 2) {
    // 第3次之后：进入白噪音/晚安尾声
    showStoryEnding();
    return;
  }

  // 生成继续讲的故事
  const continueStory = generateContinue(
    AppState.session.baseRole,
    AppState.session.baseTheme,
    AppState.config.age,
    AppState.session.continueCount
  );

  AppState.currentStory = continueStory;

  // 显示继续讲的加载页
  goTo('continue');

  const titleEl = document.getElementById('continueTitle');
  const descEl = document.getElementById('continueDesc');

  if (AppState.session.continueCount === 1) {
    if (titleEl) titleEl.textContent = '正在准备更安静的故事';
    if (descEl) descEl.textContent = `沿用${AppState.session.baseRole.name} · 更短 · 更慢 · 更温柔`;
  } else {
    if (titleEl) titleEl.textContent = '准备极短的安抚故事';
    if (descEl) descEl.textContent = '几乎没有情节 · 句子最短 · 最接近入睡';
  }

  // 模拟进度条
  const progressBar = document.getElementById('continueProgressBar');
  let progress = 0;
  if (progressBar) progressBar.style.width = '0%';
  const progressTimer = setInterval(() => {
    progress += 5;
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progress >= 100) {
      clearInterval(progressTimer);
      setTimeout(() => {
        enterPlayback();
      }, 300);
    }
  }, 100);
}

// 更新递进可视化
function updateProgressionViz(continueCount) {
  const stages = document.querySelectorAll('.prog-stage');
  const currentStage = continueCount; // 0=第1个, 1=第2个, 2=第3个, 3=晚安尾声

  stages.forEach((stage, idx) => {
    stage.classList.remove('active', 'done');
    if (idx < currentStage) {
      stage.classList.add('done');
    } else if (idx === currentStage) {
      stage.classList.add('active');
    }
  });

  // 更新参数显示
  const config = PROGRESSION_CONFIG[currentStage] || PROGRESSION_CONFIG[3];
  const durEl = document.getElementById('progDuration');
  const spdEl = document.getElementById('progSpeed');
  const pltEl = document.getElementById('progPlot');
  const volEl = document.getElementById('progVolume');

  if (durEl) durEl.textContent = config.duration;
  if (spdEl) spdEl.textContent = config.speed;
  if (pltEl) pltEl.textContent = config.plot;
  if (volEl) volEl.textContent = config.volume;
}

function showStoryEnding() {
  goTo('continue');
  const titleEl = document.getElementById('continueTitle');
  const descEl = document.getElementById('continueDesc');
  const progressBar = document.getElementById('continueProgressBar');

  if (titleEl) titleEl.textContent = '🌙 晚安尾声';
  if (descEl) descEl.textContent = '轻轻的白噪音，陪孩子慢慢入睡...';
  if (progressBar) progressBar.style.width = '100%';

  setTimeout(() => {
    showToast('白噪音已播放 · 晚安');
    setTimeout(() => goHome(), 2000);
  }, 1500);
}

// ===== 故事库 =====
function switchTab(element, type) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  element.classList.add('active');
  renderLibrary(type);
}

function renderLibrary(type) {
  const list = document.getElementById('libraryList');
  const empty = document.getElementById('libraryEmpty');
  if (!list || !empty) return;

  let items = [];
  if (type === 'fav') items = AppState.library.favorites;
  else if (type === 'recent') items = AppState.library.recent;
  else if (type === 'similar') items = AppState.library.similar;

  if (!items || items.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = items.map((item, idx) => `
    <div class="lib-item" onclick="playFromLibrary('${type}', ${idx})">
      <span class="lib-emoji">${item.emoji}</span>
      <div class="lib-info">
        <div class="lib-title">${item.title}</div>
        <div class="lib-meta">${item.theme} · ${item.time}</div>
      </div>
      <span class="lib-action">›</span>
    </div>
  `).join('');
}

function playFromLibrary(type, idx) {
  let items = [];
  if (type === 'fav') items = AppState.library.favorites;
  else if (type === 'recent') items = AppState.library.recent;
  else if (type === 'similar') items = AppState.library.similar;

  const item = items[idx];
  if (!item) return;

  // 简单模拟：基于标题和主题重新生成故事
  const themes = getAllThemes();
  const theme = themes.find(t => t.name === item.theme) || themes[0];

  // 简单的角色推断（基于 emoji）
  let roleType = 'animal';
  for (const key in ROLE_LIBRARY) {
    if (ROLE_LIBRARY[key].some(r => item.emoji.includes(r.emoji))) {
      roleType = key;
      break;
    }
  }

  const roles = getRolesByType(roleType);
  const role = roles[0];
  const style = { key: 'gentle', ...STYLE_LIBRARY.gentle };

  AppState.currentStory = generateStory(role, theme, style, AppState.config.age, AppState.config.nickname, false, 0);
  AppState.session.baseRole = role;
  AppState.session.baseTheme = theme;
  AppState.session.continueCount = 0;

  startGenerate();
}

// ===== 情绪疗愈 =====

// 情绪关键词映射表（用于从家长输入的情境中识别情绪类型）
const EMOTION_KEYWORDS = {
  dark: ['怕黑', '关灯', '黑暗', '不敢睡', '不敢一个人', '黑黑的', '晚上害怕', '鬼', '怪物', '影子'],
  separation: ['不想去幼儿园', '不想上学', '抱着妈妈', '不撒手', '分开', '妈妈走', '妈妈出门', '不要妈妈走', '想妈妈', '舍不得', '分离'],
  angry: ['生气', '发脾气', '跺脚', '大喊', '吵架', '闹脾气', '发火', '愤怒', '打人', '摔东西', '抢玩具', '被抢'],
  sad: ['哭', '难过', '伤心', '闷闷不乐', '不开心', '掉了', '坏了', '丢了', '失去', '委屈', '眼泪'],
  jealous: ['嫉妒', '别人有', '为什么我没有', '也要', '不公平', '比较', '羡慕', '眼红', '偏心']
};

// 填充情绪示例到输入框
function fillEmotionExample(text) {
  const input = document.getElementById('emotionInput');
  if (input) {
    input.value = text;
    input.focus();
  }
}

// 从家长输入的情境中识别情绪类型
function detectEmotionFromInput() {
  const input = document.getElementById('emotionInput');
  const resultEl = document.getElementById('emotionDetectResult');
  if (!input || !resultEl) return;

  const text = input.value.trim();
  if (!text) {
    showToast('请先描述孩子今天遇到的情况');
    return;
  }

  // 关键词匹配，统计每种情绪的命中次数
  const scores = {};
  let totalHits = 0;
  Object.keys(EMOTION_KEYWORDS).forEach(key => {
    let count = 0;
    EMOTION_KEYWORDS[key].forEach(keyword => {
      if (text.includes(keyword)) count++;
    });
    scores[key] = count;
    totalHits += count;
  });

  // 找出得分最高的情绪
  let detectedKey = null;
  let maxScore = 0;
  Object.keys(scores).forEach(key => {
    if (scores[key] > maxScore) {
      maxScore = scores[key];
      detectedKey = key;
    }
  });

  // 显示识别结果
  if (!detectedKey || maxScore === 0) {
    // 未识别到明确情绪，默认使用"难过"作为通用疗愈
    detectedKey = 'sad';
    resultEl.innerHTML = `
      <div class="detect-card detect-unclear">
        <div class="detect-label">未识别到明确情绪</div>
        <div class="detect-emotion">将使用通用疗愈故事陪伴孩子</div>
      </div>
    `;
  } else {
    const emo = EMOTION_LIBRARY[detectedKey];
    resultEl.innerHTML = `
      <div class="detect-card">
        <div class="detect-label">识别到情绪</div>
        <div class="detect-emotion">${emo.emoji} ${emo.name}</div>
        <div class="detect-desc">${emo.desc}</div>
        <button class="btn btn-primary btn-small" onclick="selectEmotion('${detectedKey}', true)">生成「${emo.name}」疗愈故事</button>
      </div>
    `;
    return;
  }

  // 未识别时直接生成通用故事
  setTimeout(() => selectEmotion(detectedKey, true), 800);
}

function renderEmotionList() {
  const list = document.getElementById('emotionList');
  if (!list) return;

  list.innerHTML = Object.keys(EMOTION_LIBRARY).map(key => {
    const emo = EMOTION_LIBRARY[key];
    return `
      <div class="emotion-card" onclick="selectEmotion('${key}')">
        <div class="emotion-emoji">${emo.emoji}</div>
        <div class="emotion-body">
          <div class="emotion-name">${emo.name}</div>
          <div class="emotion-desc">${emo.desc}</div>
          <div class="emotion-preview">${emo.preview}</div>
        </div>
      </div>
    `;
  }).join('');
}

function selectEmotion(key, fromDetect) {
  const emo = EMOTION_LIBRARY[key];
  if (!emo) return;

  // 生成情绪疗愈故事
  AppState.currentStory = {
    title: emo.storyTitle,
    role: { name: emo.name, emoji: emo.emoji, trait: '', setting: '' },
    theme: { key: 'emotion', name: emo.name, emoji: emo.emoji, core: emo.desc },
    style: { key: 'gentle', name: '温柔入睡', desc: '' },
    paragraphs: emo.paragraphs,
    isContinue: false,
    continueCount: 0,
    duration: 240
  };

  // 重置睡前会话
  AppState.session.baseRole = AppState.currentStory.role;
  AppState.session.baseTheme = AppState.currentStory.theme;
  AppState.session.continueCount = 0;

  // 记录偏好信号
  AppState.preferenceSignals.feedbacks.push({
    type: 'emotion_healing',
    emotion: key,
    time: Date.now()
  });

  showToast(`已选择「${emo.name}」疗愈故事`);
  startGenerate();
}

// ===== 每周主题 =====
function renderWeeklyPlan() {
  const plan = document.getElementById('weeklyPlan');
  if (!plan) return;

  // 获取今天是周几（0=周日，1=周一...）
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1; // 转为周一=0

  plan.innerHTML = WEEKLY_PLAN.map((item, idx) => `
    <div class="weekly-day ${idx === todayIdx ? 'today' : ''}">
      <div class="weekly-day-name">${item.day}</div>
      <div class="weekly-day-theme">
        <span class="weekly-theme-emoji">${item.emoji}</span>
        <span class="weekly-theme-text">${item.theme}</span>
      </div>
      <div class="weekly-day-role">${item.role}</div>
    </div>
  `).join('');
}

// ===== 故事对比 =====
function renderCompare() {
  const container = document.getElementById('compareContainer');
  if (!container) return;

  const bad = COMPARE_DATA.bad;
  const good = COMPARE_DATA.good;

  container.innerHTML = `
    <div class="compare-card bad">
      <div class="compare-card-header">
        <span class="compare-badge">${bad.badge || bad.badge}</span>
        <span class="compare-title">${bad.title}</span>
      </div>
      <div class="compare-content">${bad.content}</div>
      <div class="compare-tags">
        ${bad.tags.map(t => `<span class="compare-tag">${t}</span>`).join('')}
      </div>
    </div>
    <div class="compare-card good">
      <div class="compare-card-header">
        <span class="compare-badge">${good.badge}</span>
        <span class="compare-title">${good.title}</span>
      </div>
      <div class="compare-content">${good.content}</div>
      <div class="compare-tags">
        ${good.tags.map(t => `<span class="compare-tag">${t}</span>`).join('')}
      </div>
    </div>
  `;
}

// ===== 成长报告 =====
function renderGrowthReport() {
  const container = document.getElementById('growthContent');
  if (!container) return;

  const signals = AppState.preferenceSignals;
  const totalStories = signals.roleHistory.length;
  const totalFavorites = signals.favorites.length + AppState.library.favorites.length;
  const totalFeedbacks = signals.feedbacks.length;

  if (totalStories === 0 && totalFavorites === 0 && totalFeedbacks === 0) {
    container.innerHTML = `
      <div class="growth-empty">
        <div style="font-size:48px;margin-bottom:16px;">📊</div>
        <p>还没有足够的数据</p>
        <p style="margin-top:8px;">多听几个故事，系统就能学到孩子的偏好</p>
      </div>
    `;
    return;
  }

  // 角色偏好统计
  const roleCounts = {};
  signals.roleHistory.forEach(r => {
    roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
  });
  const topRoles = Object.keys(roleCounts).sort((a, b) => roleCounts[b] - roleCounts[a]).slice(0, 4);
  const maxRoleCount = topRoles.length > 0 ? roleCounts[topRoles[0]] : 1;

  // 主题偏好统计
  const themeCounts = {};
  signals.roleHistory.forEach(r => {
    if (r.theme) themeCounts[r.theme] = (themeCounts[r.theme] || 0) + 1;
  });
  const topThemes = Object.keys(themeCounts).sort((a, b) => themeCounts[b] - themeCounts[a]).slice(0, 4);
  const maxThemeCount = topThemes.length > 0 ? themeCounts[topThemes[0]] : 1;

  // 反馈统计
  const feedbackCounts = { like: 0, exciting: 0, preachy: 0, unsuitable: 0 };
  signals.feedbacks.forEach(f => {
    feedbackCounts[f.type] = (feedbackCounts[f.type] || 0) + 1;
  });

  // 生成洞察
  const insights = [];
  if (topRoles.length > 0 && roleCounts[topRoles[0]] >= 2) {
    insights.push(`孩子最喜欢"${topRoles[0]}"，已听 ${roleCounts[topRoles[0]]} 次，系统会优先推荐该角色。`);
  }
  if (feedbackCounts.preachy > 0) {
    insights.push(`有 ${feedbackCounts.preachy} 次反馈"太说教"，系统已降低主题显性度。`);
  }
  if (feedbackCounts.exciting > 0) {
    insights.push(`有 ${feedbackCounts.exciting} 次反馈"太刺激"，系统已降低冒险强度。`);
  }
  if (totalStories >= 5) {
    insights.push(`已累计听 ${totalStories} 个故事，偏好画像逐渐清晰。`);
  }

  container.innerHTML = `
    <div class="growth-card">
      <div class="growth-card-title">📈 使用统计</div>
      <div class="growth-stat-row">
        <div class="growth-stat">
          <div class="growth-stat-num">${totalStories}</div>
          <div class="growth-stat-label">听过的故事</div>
        </div>
        <div class="growth-stat">
          <div class="growth-stat-num">${totalFavorites}</div>
          <div class="growth-stat-label">收藏的故事</div>
        </div>
        <div class="growth-stat">
          <div class="growth-stat-num">${totalFeedbacks}</div>
          <div class="growth-stat-label">反馈次数</div>
        </div>
        <div class="growth-stat">
          <div class="growth-stat-num">${Object.keys(roleCounts).length}</div>
          <div class="growth-stat-label">喜欢的角色</div>
        </div>
      </div>
    </div>

    ${topRoles.length > 0 ? `
    <div class="growth-card">
      <div class="growth-card-title">🎭 角色偏好</div>
      <div class="growth-bar-list">
        ${topRoles.map(role => `
          <div class="growth-bar-item">
            <div class="growth-bar-label">${role}</div>
            <div class="growth-bar-track">
              <div class="growth-bar-fill" style="width:${(roleCounts[role] / maxRoleCount * 100)}%"></div>
            </div>
            <div class="growth-bar-value">${roleCounts[role]}次</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${topThemes.length > 0 ? `
    <div class="growth-card">
      <div class="growth-card-title">🌱 主题偏好</div>
      <div class="growth-bar-list">
        ${topThemes.map(theme => `
          <div class="growth-bar-item">
            <div class="growth-bar-label">${theme}</div>
            <div class="growth-bar-track">
              <div class="growth-bar-fill" style="width:${(themeCounts[theme] / maxThemeCount * 100)}%"></div>
            </div>
            <div class="growth-bar-value">${themeCounts[theme]}次</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${insights.length > 0 ? `
    <div class="growth-card">
      <div class="growth-card-title">💡 系统洞察</div>
      ${insights.map(ins => `<div class="growth-insight">${ins}</div>`).join('')}
    </div>
    ` : ''}
  `;
}

// ===== 页面初始化 =====
let _appInitialized = false;
function initApp() {
  if (_appInitialized) return;
  _appInitialized = true;

  // 加载 AI 配置
  loadAIConfig();

  // 初始冷启动设置默认值
  // 年龄卡片默认选中 4 岁
  const ageCard = document.querySelector('.age-card[data-age="4"]');
  if (ageCard) ageCard.classList.add('active');
  AppState.config.age = 4;

  // 角色默认选中 小动物
  const roleOption = document.querySelector('.role-option[data-role="animal"]');
  if (roleOption) roleOption.classList.add('active');
  AppState.config.roleType = 'animal';

  // 主题默认选中 耐心
  const themeOption = document.querySelector('.theme-option[data-theme="patience"]');
  if (themeOption) themeOption.classList.add('active');
  AppState.config.themeKey = 'patience';

  // 初始化自定义主题选择器
  initCustomThemes();

  // 绑定昵称输入的事件
  const nicknameInput = document.getElementById('childNickname');
  if (nicknameInput) {
    nicknameInput.addEventListener('input', function(e) {
      AppState.config.nickname = e.target.value.trim();
    });
  }

  // 微调面板点击 mask 关闭
  const mask = document.querySelector('.tune-mask');
  if (mask) mask.addEventListener('click', closeTune);

  // 绑定 meta item 点击
  const metaRoleItem = document.querySelector('.meta-item[onclick^="toggleTune(\'role\'"]');
  if (!metaRoleItem) {
    // 重新绑定 meta item 的点击（通过 data 属性）
    const metaItems = document.querySelectorAll('.meta-item');
    if (metaItems[0]) metaItems[0].setAttribute('onclick', "toggleTune('role')");
    if (metaItems[1]) metaItems[1].setAttribute('onclick', "toggleTune('theme')");
    if (metaItems[2]) metaItems[2].setAttribute('onclick', "toggleTune('style')");
  }

  // 初始进入欢迎页
  goTo('welcome');
}

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);
// 如果已经在 DOMContentLoaded 之后（某些浏览器），立即执行
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initApp();
}
