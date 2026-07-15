/**
 * @file 工具箱引擎 - 词典搜索、黑话翻译（洗白）、人话染黑
 * 三个支线功能的交互逻辑，独立于解谜主线
 */

/* ===== 工具箱状态 ===== */

/** 当前工具箱状态 */
const toolsState = {
  activeTab: 'dictionary',
  dictCategory: 'all',
  dictSearchQuery: ''
};

/* ===== DOM 工具（复用 game.js 的 $ 和 el） ===== */

/**
 * 获取元素
 * @param {string} id - 元素ID
 * @returns {HTMLElement}
 */
function t$(id) {
  return document.getElementById(id);
}

/**
 * 创建带类名的 HTML 元素
 * @param {string} tag - 标签名
 * @param {string} [className] - 类名
 * @returns {HTMLElement}
 */
function tEl(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

/**
 * HTML 转义，防止 XSS
 * @param {string} text - 原始文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ===== Tab 切换 ===== */

/**
 * 切换工具箱 Tab
 * @param {string} tabName - Tab 名称：dictionary / wash / darken
 */
function switchToolTab(tabName) {
  toolsState.activeTab = tabName;

  // 更新 Tab 按钮高亮
  document.querySelectorAll('.tool-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });

  // 更新面板显示
  document.querySelectorAll('.tool-panel').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.panel === tabName);
  });

  // 如果切到词典面板，渲染一次
  if (tabName === 'dictionary') {
    renderDictionary();
  }
}

/* ===== 词典搜索 ===== */

/**
 * 渲染词典列表
 */
function renderDictionary() {
  const container = t$('dictResults');
  if (!container) return;
  container.innerHTML = '';

  // 获取已通关的谜题词语
  const clearedWords = (typeof gameState !== 'undefined' && gameState.puzzleStatus)
    ? PUZZLES.filter(p => gameState.puzzleStatus[p.id]).map(p => p.word)
    : [];

  // 筛选
  const query = toolsState.dictSearchQuery.toLowerCase().trim();
  const filtered = DICTIONARY.filter(entry => {
    // 分类筛选
    if (toolsState.dictCategory !== 'all' && entry.category !== toolsState.dictCategory) {
      return false;
    }
    // 搜索筛选
    if (query) {
      const haystack = (
        entry.word +
        entry.plainMeaning +
        entry.category +
        entry.synonyms.join('')
      ).toLowerCase();
      return haystack.includes(query);
    }
    return true;
  });

  // 空状态
  if (filtered.length === 0) {
    const empty = tEl('div', 'dict-empty');
    empty.textContent = '没有找到匹配的词条。试试换个关键词？';
    container.appendChild(empty);
    return;
  }

  // 渲染词条卡片
  filtered.forEach(entry => {
    const isCleared = clearedWords.includes(entry.word);
    const card = tEl('div', 'dict-card');
    if (isCleared) card.classList.add('unlocked');

    // 词语行
    const header = tEl('div', 'dict-card-header');

    const wordEl = tEl('div', 'dict-card-word');
    wordEl.textContent = entry.word;

    const tags = tEl('div', 'dict-card-tags');
    const catTag = tEl('span', 'dict-cat-tag');
    catTag.textContent = entry.category;
    tags.appendChild(catTag);

    if (entry.hasPuzzle) {
      const puzzleTag = tEl('span', 'dict-puzzle-tag');
      if (isCleared) {
        puzzleTag.classList.add('unlocked');
        puzzleTag.textContent = '已解锁';
      } else {
        puzzleTag.textContent = '解谜解锁';
      }
      tags.appendChild(puzzleTag);
    }

    header.appendChild(wordEl);
    header.appendChild(tags);
    card.appendChild(header);

    // 浓度评级
    const tox = tEl('div', 'dict-card-tox');
    for (let i = 0; i < 5; i++) {
      const dot = tEl('span', 'tox-dot');
      if (i < entry.toxicity) dot.classList.add('active');
      tox.appendChild(dot);
    }
    const toxLabel = tEl('span', 'dict-tox-label');
    toxLabel.textContent = `浓度 ${entry.toxicity}/5`;
    tox.appendChild(toxLabel);
    card.appendChild(tox);

    // 人话翻译
    const meaning = tEl('div', 'dict-card-meaning');
    const meaningLabel = tEl('span', 'dict-meaning-label');
    meaningLabel.textContent = '人话翻译';
    const meaningText = tEl('span', 'dict-meaning-text');
    meaningText.textContent = entry.plainMeaning;
    meaning.appendChild(meaningLabel);
    meaning.appendChild(meaningText);
    card.appendChild(meaning);

    // 可展开详情
    const details = tEl('div', 'dict-card-details');

    const example = tEl('div', 'dict-detail-block');
    const exLabel = tEl('div', 'dict-detail-label');
    exLabel.textContent = '人间真实例句';
    const exText = tEl('div', 'dict-detail-text');
    exText.textContent = entry.example;
    example.appendChild(exLabel);
    example.appendChild(exText);
    details.appendChild(example);

    const abuse = tEl('div', 'dict-detail-block');
    const abLabel = tEl('div', 'dict-detail-label');
    abLabel.textContent = '滥用场景';
    const abText = tEl('div', 'dict-detail-text');
    abText.textContent = entry.abuse;
    abuse.appendChild(abLabel);
    abuse.appendChild(abText);
    details.appendChild(abuse);

    card.appendChild(details);

    // 点击展开/收起
    card.addEventListener('click', () => {
      card.classList.toggle('expanded');
    });

    container.appendChild(card);
  });
}

/**
 * 词典搜索输入处理
 */
function onDictSearch() {
  const input = t$('dictSearchInput');
  toolsState.dictSearchQuery = input.value;
  renderDictionary();
}

/**
 * 词典分类筛选
 * @param {string} category - 分类名称
 */
function onDictCategoryFilter(category) {
  toolsState.dictCategory = category;

  // 更新分类按钮高亮
  document.querySelectorAll('.dict-cat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });

  renderDictionary();
}

/* ===== 黑话翻译器（洗白模式） ===== */

/**
 * 执行洗白翻译
 * 扫描输入文本中的黑话词语，替换为人话翻译
 */
function doWash() {
  const input = t$('washInput');
  const text = input.value.trim();

  if (!text) {
    showToolMessage('washMessage', '请输入需要翻译的内容。', 'warn');
    return;
  }

  // 收集匹配到的黑话
  const matches = [];
  let highlightedOriginal = escapeHtml(text);
  let translated = text;

  WASH_MAPPINGS.forEach(mapping => {
    if (mapping.pattern.test(translated)) {
      // 重置 lastIndex（全局正则的安全操作）
      mapping.pattern.lastIndex = 0;
      const found = mapping.buzzword;
      matches.push({
        buzzword: found,
        plain: mapping.plain
      });

      // 高亮原文中的黑话
      const escapedBuzz = found.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const hlRegex = new RegExp(escapedBuzz, 'g');
      highlightedOriginal = highlightedOriginal.replace(
        hlRegex,
        `<span class="wash-highlight">${found}</span>`
      );

      // 替换翻译
      translated = translated.replace(mapping.pattern, `【${mapping.plain}】`);
    }
  });

  if (matches.length === 0) {
    showToolMessage('washMessage', '这段话居然没有黑话，你是怎么混进互联网公司的？', 'info');
    t$('washOriginal').innerHTML = '';
    t$('washTranslated').innerHTML = '';
    t$('washMappingList').innerHTML = '';
    return;
  }

  // 隐藏消息
  showToolMessage('washMessage', '', '');

  // 渲染原文（高亮黑话）
  t$('washOriginal').innerHTML = highlightedOriginal;

  // 渲染翻译（高亮替换部分）
  let translatedHtml = escapeHtml(translated);
  matches.forEach(m => {
    const escapedPlain = m.plain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const plainRegex = new RegExp(`【${escapedPlain}】`, 'g');
    translatedHtml = translatedHtml.replace(
      plainRegex,
      `<span class="wash-replaced">${m.plain}</span>`
    );
  });
  t$('washTranslated').innerHTML = translatedHtml;

  // 渲染对照表
  const listEl = t$('washMappingList');
  listEl.innerHTML = '';
  const title = tEl('div', 'mapping-title');
  title.textContent = `替换了 ${matches.length} 处黑话`;
  listEl.appendChild(title);

  matches.forEach(m => {
    const item = tEl('div', 'mapping-item');
    const from = tEl('span', 'mapping-from');
    from.textContent = m.buzzword;
    const arrow = tEl('span', 'mapping-arrow');
    arrow.textContent = '→';
    const to = tEl('span', 'mapping-to');
    to.textContent = m.plain;
    item.appendChild(from);
    item.appendChild(arrow);
    item.appendChild(to);
    listEl.appendChild(item);
  });
}

/**
 * 填入洗白示例文本
 */
function fillWashExample() {
  t$('washInput').value = WASH_EXAMPLE;
  doWash();
}

/**
 * 清空洗白输入
 */
function clearWash() {
  t$('washInput').value = '';
  t$('washOriginal').innerHTML = '';
  t$('washTranslated').innerHTML = '';
  t$('washMappingList').innerHTML = '';
  showToolMessage('washMessage', '', '');
}

/* ===== 人话染黑器（染黑模式） ===== */

/**
 * 执行染黑翻译
 * 扫描输入文本中的日常表达，替换为黑话版本
 */
function doDarken() {
  const input = t$('darkenInput');
  const text = input.value.trim();

  if (!text) {
    showToolMessage('darkenMessage', '请输入需要染黑的内容。', 'warn');
    return;
  }

  // 收集匹配到的替换
  const matches = [];
  let result = text;
  let highlighted = escapeHtml(text);

  DARKEN_MAPPINGS.forEach(mapping => {
    // 重置正则
    mapping.pattern.lastIndex = 0;
    const regex = new RegExp(mapping.pattern.source, 'g');

    if (regex.test(result)) {
      regex.lastIndex = 0;
      const matchedText = result.match(regex);
      if (matchedText && matchedText.length > 0) {
        matches.push({
          plain: matchedText[0],
          buzzword: mapping.buzzword
        });

        // 替换翻译
        result = result.replace(regex, mapping.buzzword);

        // 高亮原文中的匹配部分
        const escapedMatch = matchedText[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const hlRegex = new RegExp(escapedMatch, 'g');
        highlighted = highlighted.replace(
          hlRegex,
          `<span class="darken-highlight">${matchedText[0]}</span>`
        );
      }
    }
  });

  if (matches.length === 0) {
    showToolMessage('darkenMessage', '这段话已经够黑了，或者太白了染不动。', 'info');
    t$('darkenOriginal').innerHTML = '';
    t$('darkenResult').innerHTML = '';
    t$('darkenMappingList').innerHTML = '';
    return;
  }

  // 隐藏消息
  showToolMessage('darkenMessage', '', '');

  // 渲染原文（高亮将被替换的部分）
  t$('darkenOriginal').innerHTML = highlighted;

  // 渲染染黑结果（高亮黑话部分）
  let resultHtml = escapeHtml(result);
  matches.forEach(m => {
    const escapedBuzz = m.buzzword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const buzzRegex = new RegExp(escapedBuzz, 'g');
    resultHtml = resultHtml.replace(
      buzzRegex,
      `<span class="darken-replaced">${m.buzzword}</span>`
    );
  });
  t$('darkenResult').innerHTML = resultHtml;

  // 渲染对照表
  const listEl = t$('darkenMappingList');
  listEl.innerHTML = '';
  const title = tEl('div', 'mapping-title');
  title.textContent = `染黑了 ${matches.length} 处`;
  listEl.appendChild(title);

  matches.forEach(m => {
    const item = tEl('div', 'mapping-item');
    const from = tEl('span', 'mapping-from');
    from.textContent = m.plain;
    const arrow = tEl('span', 'mapping-arrow');
    arrow.textContent = '→';
    const to = tEl('span', 'mapping-to');
    to.textContent = m.buzzword;
    item.appendChild(from);
    item.appendChild(arrow);
    item.appendChild(to);
    listEl.appendChild(item);
  });
}

/**
 * 填入染黑示例文本
 */
function fillDarkenExample() {
  t$('darkenInput').value = DARKEN_EXAMPLE;
  doDarken();
}

/**
 * 清空染黑输入
 */
function clearDarken() {
  t$('darkenInput').value = '';
  t$('darkenOriginal').innerHTML = '';
  t$('darkenResult').innerHTML = '';
  t$('darkenMappingList').innerHTML = '';
  showToolMessage('darkenMessage', '', '');
}

/**
 * 复制染黑结果到剪贴板
 */
function copyDarkenResult() {
  const resultEl = t$('darkenResult');
  const text = resultEl.textContent || resultEl.innerText;

  if (!text) {
    showToolMessage('darkenMessage', '还没有染黑结果，先点"开始染黑"吧。', 'warn');
    return;
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToolMessage('darkenMessage', '已复制到剪贴板！', 'success');
    }).catch(() => {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

/**
 * 降级复制方案（不支持 Clipboard API 时）
 * @param {string} text - 要复制的文本
 */
function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToolMessage('darkenMessage', '已复制到剪贴板！', 'success');
  } catch {
    showToolMessage('darkenMessage', '复制失败，请手动选择文本复制。', 'warn');
  }
  document.body.removeChild(textarea);
}

/* ===== 工具消息 ===== */

/**
 * 显示工具操作反馈消息
 * @param {string} elementId - 消息元素ID
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型：info / warn / success
 */
function showToolMessage(elementId, message, type) {
  const el = t$(elementId);
  if (!el) return;

  if (!message) {
    el.className = 'tool-message';
    el.textContent = '';
    return;
  }

  el.className = `tool-message show ${type}`;
  el.textContent = message;
}

/* ===== 工具箱初始化 ===== */

/**
 * 初始化工具箱
 * 绑定事件监听器
 */
function initTools() {
  // Tab 切换
  document.querySelectorAll('.tool-tab').forEach(tab => {
    tab.addEventListener('click', () => switchToolTab(tab.dataset.tab));
  });

  // 词典搜索
  const searchInput = t$('dictSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', onDictSearch);
  }

  // 词典分类筛选
  document.querySelectorAll('.dict-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => onDictCategoryFilter(btn.dataset.category));
  });

  // 洗白翻译
  const washBtn = t$('washBtn');
  if (washBtn) washBtn.addEventListener('click', doWash);
  const washExampleBtn = t$('washExampleBtn');
  if (washExampleBtn) washExampleBtn.addEventListener('click', fillWashExample);
  const washClearBtn = t$('washClearBtn');
  if (washClearBtn) washClearBtn.addEventListener('click', clearWash);

  // 染黑翻译
  const darkenBtn = t$('darkenBtn');
  if (darkenBtn) darkenBtn.addEventListener('click', doDarken);
  const darkenExampleBtn = t$('darkenExampleBtn');
  if (darkenExampleBtn) darkenExampleBtn.addEventListener('click', fillDarkenExample);
  const darkenClearBtn = t$('darkenClearBtn');
  if (darkenClearBtn) darkenClearBtn.addEventListener('click', clearDarken);
  const darkenCopyBtn = t$('darkenCopyBtn');
  if (darkenCopyBtn) darkenCopyBtn.addEventListener('click', copyDarkenResult);

  // 初始渲染词典
  renderDictionary();
}
