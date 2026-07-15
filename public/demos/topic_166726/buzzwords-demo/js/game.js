/**
 * @file 游戏引擎 - 状态管理、谜题渲染、交互处理
 * 负责：关卡切换、进度条更新、提示系统、知识卡展示
 */

/* ===== 游戏状态 ===== */

/** 当前游戏状态 */
const gameState = {
  currentPuzzleIndex: -1,
  currentLevelIndex: 0,
  currentStepIndex: 0,
  hintUsed: false,
  puzzleStatus: {},  // { puzzleId: 'unlocked' | 'cleared' | 'perfect' }
  intermediateAnswers: []  // 当前谜题已解出的中间答案
};

/* ===== DOM 工具函数 ===== */

/**
 * 获取元素或创建新元素
 * @param {string} id - 元素ID
 * @returns {HTMLElement}
 */
function $(id) {
  return document.getElementById(id);
}

/**
 * 创建带类名的 HTML 元素
 * @param {string} tag - 标签名
 * @param {string} [className] - 类名
 * @returns {HTMLElement}
 */
function el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

/* ===== 屏幕切换 ===== */

/**
 * 切换到指定屏幕
 * @param {string} screenId - 屏幕ID（select / game / toolbox）
 */
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(screenId).classList.add('active');

  const backBtn = $('backBtn');
  if (screenId === 'gameScreen' || screenId === 'toolboxScreen') {
    backBtn.style.display = 'block';
  } else {
    backBtn.style.display = 'none';
  }
}

/* ===== 选关页面 ===== */

/** 渲染选关页面 */
function renderSelectScreen() {
  const container = $('puzzleCards');
  container.innerHTML = '';

  PUZZLES.forEach((puzzle, index) => {
    const status = gameState.puzzleStatus[puzzle.id] || 'unlocked';
    const isLocked = index > 0 && !gameState.puzzleStatus[PUZZLES[index - 1].id];

    const card = el('div', 'puzzle-card');
    if (isLocked) {
      card.classList.add('locked');
      card.style.opacity = '0.5';
      card.style.pointerEvents = 'none';
    }

    const num = el('div', 'card-num');
    num.textContent = index + 1;

    const body = el('div', 'card-body');
    const title = el('div', 'card-title');
    const isCleared = status === 'cleared' || status === 'perfect';
    // 未通关时不显示词语本身，避免剧透谜底
    title.textContent = isCleared ? puzzle.word : `谜题 ${index + 1}`;
    title.classList.toggle('masked', !isCleared);

    // 通关前后都显示模糊提示，但通关后词语已公开不再算剧透
    const subtitle = el('div', 'card-subtitle');
    subtitle.textContent = puzzle.selectHint;

    const meta = el('div', 'card-meta');
    const tag = el('span', 'tag');
    tag.textContent = puzzle.category;
    const levelCount = el('span');
    levelCount.textContent = '4 关 · 6 种玩法';
    meta.appendChild(tag);
    meta.appendChild(levelCount);
    body.appendChild(title);
    body.appendChild(subtitle);
    body.appendChild(meta);

    const statusDiv = el('div', 'card-status');
    const badge = el('span', 'status-badge');
    if (isLocked) {
      badge.classList.add('locked');
      badge.textContent = '未解锁';
    } else if (status === 'perfect') {
      badge.classList.add('perfect');
      badge.textContent = '★ 完美通关';
    } else if (status === 'cleared') {
      badge.classList.add('cleared');
      badge.textContent = '✓ 已通关';
    } else {
      badge.classList.add('unlocked');
      badge.textContent = '开始挑战';
    }
    statusDiv.appendChild(badge);

    const arrow = el('div', 'card-arrow');
    arrow.textContent = '→';

    card.appendChild(num);
    card.appendChild(body);
    card.appendChild(statusDiv);
    card.appendChild(arrow);

    if (!isLocked) {
      card.addEventListener('click', () => startPuzzle(index));
    }

    container.appendChild(card);
  });
}

/* ===== 开始谜题 ===== */

/**
 * 开始指定谜题
 * @param {number} puzzleIndex - 谜题索引
 */
function startPuzzle(puzzleIndex) {
  gameState.currentPuzzleIndex = puzzleIndex;
  gameState.currentLevelIndex = 0;
  gameState.currentStepIndex = 0;
  gameState.hintUsed = false;
  gameState.intermediateAnswers = [];

  const puzzle = PUZZLES[puzzleIndex];

  // 更新页面标题
  $('gameTitle').textContent = puzzle.word;

  showScreen('gameScreen');
  renderLevel();
}

/* ===== 渲染关卡 ===== */

/** 渲染当前关卡 */
function renderLevel() {
  const puzzle = PUZZLES[gameState.currentPuzzleIndex];
  const level = puzzle.levels[gameState.currentLevelIndex];

  // 更新进度条
  updateProgress();

  // 更新关卡标题
  $('levelTag').textContent = level.typeName;
  $('levelTitle').textContent = level.title;

  // 重置步骤
  gameState.currentStepIndex = 0;

  // 渲染步骤
  renderStep();

  // 重置谜题区域状态
  $('puzzleArea').classList.remove('solved');
  $('answerReveal').classList.remove('visible');
}

/* ===== 渲染步骤 ===== */

/** 渲染当前步骤 */
function renderStep() {
  const puzzle = PUZZLES[gameState.currentPuzzleIndex];
  const level = puzzle.levels[gameState.currentLevelIndex];
  const step = level.steps[gameState.currentStepIndex];

  // 渲染步骤指示器
  renderStepIndicator(level.steps.length);

  // 渲染提示文字
  $('stepPrompt').textContent = step.prompt;

  // 渲染内容
  const contentDiv = $('stepContent');
  contentDiv.innerHTML = '';
  if (step.content) {
    contentDiv.innerHTML = renderContent(step.content);
  }

  // 渲染输入区
  renderInput(step);

  // 清除反馈
  const feedback = $('feedback');
  feedback.className = 'feedback';
  feedback.textContent = '';

  // 隐藏答案揭示
  $('answerReveal').classList.remove('visible');

  // 更新提示按钮
  updateHintButton();
}

/** 渲染步骤指示器 */
function renderStepIndicator(totalSteps) {
  const indicator = $('stepIndicator');
  indicator.innerHTML = '';
  for (let i = 0; i < totalSteps; i++) {
    const dot = el('div', 'step-dot');
    if (i < gameState.currentStepIndex) dot.classList.add('done');
    else if (i === gameState.currentStepIndex) dot.classList.add('active');
    indicator.appendChild(dot);
  }
}

/* ===== 渲染谜题内容 ===== */

/**
 * 根据内容类型渲染展示内容
 * @param {string} contentType - 内容类型标识
 * @returns {string} HTML字符串
 */
function renderContent(contentType) {
  const renderers = {
    'sequence-odd': () => `
      <div class="num-sequence">
        <div class="num-cell filled">1</div>
        <div class="num-cell filled">3</div>
        <div class="num-cell filled">5</div>
        <div class="num-cell filled">7</div>
        <div class="num-cell empty">?</div>
      </div>
      <div style="text-align:center;">
        <span class="sequence-note">序列下方标注："取笔画数"</span>
      </div>`,

    'sequence-deviation': () => `
      <div style="text-align:center; padding:20px 0;">
        <div style="font-size:13px; color:var(--muted); margin-bottom:16px;">偏差值变化序列</div>
        <div class="num-sequence" style="padding:0;">
          <div class="num-cell filled">5</div>
          <div class="num-cell filled">3</div>
          <div class="num-cell filled">1</div>
          <div class="num-cell empty">?</div>
        </div>
        <div style="margin-top:12px; font-size:13px; color:var(--muted-2);">每次减少 2，偏差在收敛</div>
      </div>`,

    'sequence-cycle': () => {
      const items = [0, 1, 2, 3, 0, 1, 2, 3];
      let html = '<div class="cycle-sequence">';
      items.forEach((n, i) => {
        if (i > 0) html += '<span class="cycle-arrow">→</span>';
        const cls = n === 0 && i > 0 ? 'cycle-item reset' : 'cycle-item';
        html += `<div class="${cls}">${n}</div>`;
      });
      html += '<span class="cycle-arrow">→</span>';
      html += '<div class="cycle-item question">?</div>';
      html += '</div>';
      html += '<div style="text-align:center; font-size:13px; color:var(--muted-2); margin-top:8px;">循环节长度为 4</div>';
      return html;
    },

    'equation-sun-rain': () => `
      <div class="symbol-equation">
        <div class="sym">☀️</div>
        <span class="op">+</span>
        <div class="sym">🌧️</div>
        <span class="op">=</span>
        <div class="sym">🌱</div>
      </div>`,

    'equation-traffic': () => `
      <div class="symbol-equation">
        <div class="sym">||</div>
        <span class="op">+</span>
        <div class="sym">→</div>
      </div>
      <div style="text-align:center; font-size:13px; color:var(--muted-2); margin-top:8px;">交通符号：两条平行线 + 方向箭头</div>`,

    'shell-glyph': () => `
      <div class="symbol-glyph">
        <div class="glyph-display">🐚</div>
        <div class="glyph-label">古代象形符号 · 贝壳</div>
      </div>`,

    'battery-transform': () => `
      <div class="transform-chain">
        <div class="transform-stage">🔋<div class="stage-label">充电</div></div>
        <span class="transform-arrow">→</span>
        <div class="transform-stage">⚡<div class="stage-label">满电</div></div>
        <span class="transform-arrow">→</span>
        <div class="transform-stage">📤<div class="stage-label">输出</div></div>
        <span class="transform-arrow">→</span>
        <div class="transform-stage">⬆️<div class="stage-label">上升</div></div>
      </div>`,

    'decompose-bi': () => `
      <div class="char-decompose">
        <div class="char-original">闭</div>
        <span class="decompose-arrow">→</span>
        <div class="char-parts">
          <div class="char-part">门</div>
          <div class="char-part">才</div>
        </div>
      </div>`,

    'decompose-qi': () => `
      <div class="char-decompose">
        <div class="char-original">齊</div>
        <span class="decompose-arrow">→</span>
        <div class="char-parts">
          <div class="char-part">禾</div>
          <div class="char-part">禾</div>
          <div class="char-part">禾</div>
        </div>
      </div>
      <div style="text-align:center; font-size:13px; color:var(--muted-2); margin-top:8px;">"齐"的繁体形式</div>`,

    'homophone-huan': () => `
      <div class="homophone-chain">
        <div class="homophone-node">
          <div class="h-char">还</div>
          <div class="h-pinyin">hái</div>
        </div>
        <span class="homophone-arrow">读音相近 →</span>
        <div class="homophone-node">
          <div class="h-char">?</div>
          <div class="h-pinyin">huán</div>
        </div>
      </div>`
  };

  return (renderers[contentType] || (() => ''))();
}

/* ===== 渲染输入区 ===== */

/**
 * 根据步骤的输入类型渲染输入界面
 * @param {Object} step - 当前步骤数据
 */
function renderInput(step) {
  const inputDiv = $('inputArea');
  inputDiv.innerHTML = '';

  if (step.inputType === 'number' || step.inputType === 'text') {
    const input = el('input', 'text-input');
    input.type = step.inputType === 'number' ? 'number' : 'text';
    input.placeholder = '?';
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') checkAnswer();
    });

    const btn = el('button', 'btn');
    btn.textContent = '提交';
    btn.addEventListener('click', checkAnswer);

    inputDiv.appendChild(input);
    inputDiv.appendChild(btn);

    setTimeout(() => input.focus(), 100);

  } else if (step.inputType === 'choice') {
    const list = el('div', 'choice-list');
    step.choices.forEach(choice => {
      const option = el('button', 'choice-option');
      const marker = el('span', 'choice-marker');
      marker.textContent = choice.value;
      const label = el('span');
      label.textContent = choice.label;
      option.appendChild(marker);
      option.appendChild(label);
      option.addEventListener('click', () => {
        checkChoiceAnswer(option, choice.value);
      });
      list.appendChild(option);
    });
    inputDiv.appendChild(list);
  }
}

/* ===== 答案检查 ===== */

/** 检查文本/数字输入的答案 */
function checkAnswer() {
  const puzzle = PUZZLES[gameState.currentPuzzleIndex];
  const level = puzzle.levels[gameState.currentLevelIndex];
  const step = level.steps[gameState.currentStepIndex];

  const input = $('inputArea').querySelector('.text-input');
  const value = String(input.value).trim().toLowerCase();

  if (!value) {
    showFeedback('wrong', '请输入答案。');
    return;
  }

  const accepted = step.accept.map(a => a.toLowerCase());

  if (accepted.includes(value)) {
    handleCorrectAnswer(step);
  } else {
    handleWrongAnswer();
  }
}

/**
 * 检查选择题答案
 * @param {HTMLElement} optionEl - 被点击的选项元素
 * @param {string} value - 选项值
 */
function checkChoiceAnswer(optionEl, value) {
  const puzzle = PUZZLES[gameState.currentPuzzleIndex];
  const level = puzzle.levels[gameState.currentLevelIndex];
  const step = level.steps[gameState.currentStepIndex];

  const accepted = step.accept.map(a => a.toLowerCase());

  if (accepted.includes(value.toLowerCase())) {
    optionEl.classList.add('correct');
    // 禁用其他选项
    $('inputArea').querySelectorAll('.choice-option').forEach(o => {
      o.style.pointerEvents = 'none';
    });
    handleCorrectAnswer(step);
  } else {
    optionEl.classList.add('wrong');
    setTimeout(() => optionEl.classList.remove('wrong'), 500);
    handleWrongAnswer();
  }
}

/**
 * 处理正确答案
 * @param {Object} step - 当前步骤
 */
function handleCorrectAnswer(step) {
  showFeedback('correct', step.feedback);

  // 延迟后进入下一步
  setTimeout(() => {
    const puzzle = PUZZLES[gameState.currentPuzzleIndex];
    const level = puzzle.levels[gameState.currentLevelIndex];

    if (gameState.currentStepIndex < level.steps.length - 1) {
      // 进入下一步
      gameState.currentStepIndex++;
      renderStep();
    } else {
      // 本关完成
      completeLevel();
    }
  }, 1800);
}

/** 处理错误答案 */
function handleWrongAnswer() {
  showFeedback('wrong', '不对，再想想。仔细观察线索中的细节。');
}

/* ===== 关卡完成 ===== */

/** 完成当前关卡 */
function completeLevel() {
  const puzzle = PUZZLES[gameState.currentPuzzleIndex];
  const level = puzzle.levels[gameState.currentLevelIndex];

  // 记录中间答案
  gameState.intermediateAnswers.push(level.answerDisplay);

  // 显示答案揭示
  const reveal = $('answerReveal');
  $('revealLabel').textContent = `中间答案 · 关 ${gameState.currentLevelIndex + 1}`;
  $('revealValue').textContent = level.answerDisplay;
  reveal.classList.add('visible');

  // 标记谜题区域为已解决
  $('puzzleArea').classList.add('solved');

  // 清空输入区
  $('inputArea').innerHTML = '';
  $('stepPrompt').textContent = '';
  $('stepContent').innerHTML = '';
  $('feedback').className = 'feedback';
  $('feedback').textContent = '';

  // 延迟后进入下一关或完成谜题
  setTimeout(() => {
    if (gameState.currentLevelIndex < puzzle.levels.length - 1) {
      gameState.currentLevelIndex++;
      renderLevel();
    } else {
      completePuzzle();
    }
  }, 2400);
}

/* ===== 完成谜题 ===== */

/** 完成整个谜题 */
function completePuzzle() {
  const puzzle = PUZZLES[gameState.currentPuzzleIndex];

  // 记录通关状态
  if (!gameState.hintUsed) {
    gameState.puzzleStatus[puzzle.id] = 'perfect';
  } else {
    gameState.puzzleStatus[puzzle.id] = 'cleared';
  }

  // 显示知识卡
  showKnowledgeCard(puzzle);
}

/* ===== 知识卡 ===== */

/**
 * 显示知识卡
 * @param {Object} puzzle - 谜题数据
 */
function showKnowledgeCard(puzzle) {
  const overlay = $('knowledgeOverlay');
  const card = $('knowledgeCard');

  // 正面内容
  card.querySelector('.card-word').textContent = puzzle.word;
  card.querySelector('.card-category').textContent = puzzle.category;

  // 浓度评级
  const toxContainer = card.querySelector('.card-toxicity');
  toxContainer.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const dot = el('div', 'tox-dot');
    if (i < puzzle.toxicity) dot.classList.add('active');
    toxContainer.appendChild(dot);
  }
  card.querySelector('.card-tox-label').textContent = `浓度评级 ${puzzle.toxicity}/5`;

  // 背面内容
  card.querySelector('.card-example').textContent = puzzle.knowledgeCard.example;
  card.querySelector('.card-abuse').textContent = puzzle.knowledgeCard.abuse;

  // 重置翻转状态
  card.classList.remove('flipped');

  overlay.classList.add('visible');
}

/** 翻转知识卡 */
function flipKnowledgeCard() {
  $('knowledgeCard').classList.toggle('flipped');
}

/** 关闭知识卡，显示通关画面 */
function closeKnowledgeCard() {
  $('knowledgeOverlay').classList.remove('visible');

  const puzzle = PUZZLES[gameState.currentPuzzleIndex];
  const status = gameState.puzzleStatus[puzzle.id];

  const overlay = $('completeOverlay');
  const content = overlay.querySelector('.complete-content');

  if (status === 'perfect') {
    content.querySelector('.complete-icon').textContent = '★';
    content.querySelector('.complete-title').textContent = '完美通关！';
    content.querySelector('.complete-subtitle').textContent = `未使用任何提示，解开了「${puzzle.word}」`;
  } else {
    content.querySelector('.complete-icon').textContent = '✓';
    content.querySelector('.complete-title').textContent = '通关！';
    content.querySelector('.complete-subtitle').textContent = `成功解开了「${puzzle.word}」`;
  }

  overlay.classList.add('visible');
}

/* ===== 通关画面操作 ===== */

/** 返回选关页面 */
function backToSelect() {
  $('completeOverlay').classList.remove('visible');
  $('knowledgeOverlay').classList.remove('visible');
  renderSelectScreen();
  showScreen('selectScreen');
}

/** 进入工具箱页面 */
function enterToolbox() {
  showScreen('toolboxScreen');
  // 重新渲染词典（通关状态可能已更新）
  if (typeof renderDictionary === 'function') {
    renderDictionary();
  }
}

/* ===== Demo 解题演示 ===== */

/**
 * 打开 demo 解题演示弹窗
 * 动态从 PUZZLES 数据生成每道谜题的解题流程
 */
function openDemoWalkthrough() {
  const container = $('demoContent');
  container.innerHTML = '';

  PUZZLES.forEach((puzzle, pIdx) => {
    const block = el('div', 'demo-puzzle-block');

    // 谜题标题
    const header = el('div', 'demo-puzzle-header');
    const title = el('div', 'demo-puzzle-title');
    title.textContent = `谜题 ${pIdx + 1}：${puzzle.word}`;
    header.appendChild(title);

    const catTag = el('span', 'demo-cat-tag');
    catTag.textContent = puzzle.category;
    header.appendChild(catTag);
    block.appendChild(header);

    // 解题流程
    const chain = el('div', 'demo-chain');
    puzzle.levels.forEach((level, lIdx) => {
      const step = el('div', 'demo-step');

      // 步骤标号
      const stepNum = el('div', 'demo-step-num');
      stepNum.textContent = `关 ${lIdx + 1}`;
      step.appendChild(stepNum);

      // 步骤内容
      const stepBody = el('div', 'demo-step-body');
      const stepType = el('div', 'demo-step-type');
      stepType.textContent = level.typeName;
      stepBody.appendChild(stepType);

      const stepTitle = el('div', 'demo-step-title');
      stepTitle.textContent = level.title;
      stepBody.appendChild(stepTitle);

      // 推理过程
      const reasoning = el('div', 'demo-reasoning');
      level.steps.forEach(s => {
        const stepRow = el('div', 'demo-reasoning-row');

        const prompt = el('div', 'demo-reasoning-prompt');
        prompt.textContent = s.prompt.split('\n')[0];
        stepRow.appendChild(prompt);

        const answer = el('div', 'demo-reasoning-answer');
        answer.textContent = `→ ${s.accept[0]}`;
        stepRow.appendChild(answer);

        reasoning.appendChild(stepRow);
      });
      stepBody.appendChild(reasoning);

      // 中间答案
      const answer = el('div', 'demo-step-answer');
      answer.textContent = `中间答案：${level.answerDisplay}`;
      stepBody.appendChild(answer);

      step.appendChild(stepBody);
      chain.appendChild(step);
    });

    block.appendChild(chain);

    // 最终答案
    const final = el('div', 'demo-final-answer');
    final.textContent = `最终答案：${puzzle.word}`;
    block.appendChild(final);

    container.appendChild(block);
  });

  $('demoOverlay').classList.add('visible');
}

/** 关闭 demo 解题演示弹窗 */
function closeDemoWalkthrough() {
  $('demoOverlay').classList.remove('visible');
}

/** 进入下一道谜题 */
function nextPuzzle() {
  $('completeOverlay').classList.remove('visible');
  const nextIndex = gameState.currentPuzzleIndex + 1;
  if (nextIndex < PUZZLES.length) {
    startPuzzle(nextIndex);
  } else {
    backToSelect();
  }
}

/* ===== 进度条 ===== */

/** 更新进度条 */
function updateProgress() {
  const puzzle = PUZZLES[gameState.currentPuzzleIndex];
  const bar = $('progressBar');
  bar.innerHTML = '';

  for (let i = 0; i < 4; i++) {
    const step = el('div', 'progress-step');

    if (i < gameState.currentLevelIndex) {
      step.classList.add('done');
    } else if (i === gameState.currentLevelIndex) {
      step.classList.add('active');
    } else {
      step.classList.add('locked');
    }

    const circle = el('div', 'step-circle');
    circle.textContent = i + 1;

    const info = el('div', 'step-info');
    const typeSpan = el('div', 'step-type');
    typeSpan.textContent = puzzle.levels[i].typeName;

    const answerSpan = el('div', 'step-answer');
    if (i < gameState.currentLevelIndex) {
      answerSpan.textContent = gameState.intermediateAnswers[i] + ' ✓';
    } else if (i === gameState.currentLevelIndex) {
      answerSpan.textContent = '进行中…';
    } else {
      answerSpan.textContent = '???';
    }

    info.appendChild(typeSpan);
    info.appendChild(answerSpan);
    step.appendChild(circle);
    step.appendChild(info);
    bar.appendChild(step);

    if (i < 3) {
      const connector = el('div', 'progress-connector');
      if (i < gameState.currentLevelIndex) connector.classList.add('done');
      bar.appendChild(connector);
    }
  }
}

/* ===== 提示系统 ===== */

/** 更新提示按钮状态 */
function updateHintButton() {
  const btn = $('hintBtn');
  if (gameState.hintUsed) {
    btn.disabled = true;
    btn.textContent = '提示已用';
  } else {
    btn.disabled = false;
    btn.textContent = '提示 (1次)';
  }
}

/** 使用提示 */
function useHint() {
  if (gameState.hintUsed) return;

  const puzzle = PUZZLES[gameState.currentPuzzleIndex];
  const level = puzzle.levels[gameState.currentLevelIndex];

  gameState.hintUsed = true;
  updateHintButton();

  showFeedback('hint', '💡 提示：' + level.hint);
}

/* ===== 反馈显示 ===== */

/**
 * 显示反馈信息
 * @param {string} type - 反馈类型（correct/wrong/hint）
 * @param {string} message - 反馈内容
 */
function showFeedback(type, message) {
  const feedback = $('feedback');
  feedback.className = `feedback show ${type}`;
  feedback.textContent = message;
}

/* ===== 初始化 ===== */

/** 初始化游戏 */
function init() {
  renderSelectScreen();
  showScreen('selectScreen');

  // 绑定全局事件
  $('backBtn').addEventListener('click', backToSelect);
  $('hintBtn').addEventListener('click', useHint);
  $('knowledgeCard').addEventListener('click', flipKnowledgeCard);
  $('knowledgeCloseBtn').addEventListener('click', closeKnowledgeCard);
  $('completeBackBtn').addEventListener('click', backToSelect);
  $('completeNextBtn').addEventListener('click', nextPuzzle);

  // 初始化工具箱
  if (typeof initTools === 'function') {
    initTools();
  }
}

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
