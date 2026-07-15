/**
 * TrashCanPage.js - 情绪垃圾桶页控制器
 * 引导用户写下负面情绪，AI分析后生成对应"情绪石头"，通过拖拽丢弃完成情绪释放
 * 使用关键词匹配进行情绪识别，集成 DraggableStone 拖拽组件
 * 原生 ES6+，严格模式
 */
'use strict';

const TrashCanPage = {
  /** @type {DraggableStone|null} 当前拖拽石头实例 */
  _draggableStone: null,

  /** @type {HTMLElement|null} 当前石头 DOM 元素 */
  _currentStoneEl: null,

  /** @type {Object|null} 当前分析的情绪结果 */
  _currentEmotion: null,

  /** 情绪石头样式配置（不同情绪对应不同文字） */
  _stoneStyles: {
    typeA: { text: '反复\n思考' },
    typeB: { text: '人际\n压力' },
    typeC: { text: '自我\n攻击' },
    typeD: { text: '情绪\n过载' },
    default: { text: '负面\n情绪' },
  },

  // ============================================================
  // 生命周期
  // ============================================================

  /**
   * 渲染情绪垃圾桶页 HTML
   * 使用 trash-can.css 中的 BEM 类名，适配移动端
   * @returns {string} 页面 HTML 字符串
   */
  render() {
    return `
      <div class="page trash-can">
        <h1 class="trash-can__title">情绪垃圾桶</h1>
        <p class="trash-can__subtitle">写下让你不舒服的想法，把情绪石头丢进垃圾桶</p>

        <div class="trash-can__stage">
          <div id="stoneContainer" class="trash-can__stone-wrapper">
            <div class="trash-can__stone-placeholder">?</div>
          </div>
          <div id="emotionResult" class="trash-can__result" style="display:none;">
            <div class="trash-can__result-name"></div>
            <div class="trash-can__result-keywords"></div>
          </div>
        </div>

        <div id="trashCanContainer" class="trash-can__bin">
          <div class="trash-can__bin-lid"></div>
          <div class="trash-can__bin-body">
            <span class="trash-can__bin-icon">🗑️</span>
          </div>
        </div>

        <div class="trash-can__input-area">
          <div class="trash-can__input-wrapper">
            <textarea
              id="emotionInput"
              class="trash-can__input trash-can__input--textarea"
              placeholder="现在最难受的一句话是什么？比如：我感觉所有人都不喜欢我..."
              rows="2"
            ></textarea>
          </div>
          <button id="releaseBtn" class="trash-can__input-btn" onclick="TrashCanPage.analyzeEmotion()" aria-label="开始释放">
            ➤
          </button>
        </div>
        <p class="trash-can__hint">输入后点击按钮生成情绪石头，然后拖进垃圾桶释放它</p>

        <div id="doneActions" class="trash-can__done-actions" style="display:none;">
          <button class="btn btn--secondary" onclick="TrashCanPage.reset()">再来一次</button>
          <button class="btn btn--ghost" onclick="App.navigateTo('home')">返回首页</button>
        </div>
      </div>
    `;
  },

  /**
   * 页面挂载：显示导航栏，注入 DraggableStone 组件样式，初始化页面状态
   * @param {HTMLElement} pageView - 页面 DOM 元素
   * @param {Object} [params] - 路由参数
   */
  mount(pageView, params = {}) {
    // 显示导航栏
    if (typeof NavBar !== 'undefined' && typeof NavBar.show === 'function') {
      NavBar.show('trash-can');
    }

    // 确保 DraggableStone 样式已注入
    if (typeof DraggableStone !== 'undefined') {
      DraggableStone.injectStyles();
    }
  },

  // ============================================================
  // 情绪分析与石头生成
  // ============================================================

  /**
   * 分析用户情绪：获取输入 -> 关键词匹配 -> 生成分析结果 -> 创建可拖拽石头
   * 由"开始释放"按钮 onclick 触发
   */
  analyzeEmotion() {
    const input = document.getElementById('emotionInput');
    if (!input) return;

    const text = input.value.trim();
    if (!text) {
      input.classList.add('trash-can__input--error');
      setTimeout(() => {
        input.classList.remove('trash-can__input--error');
      }, 1500);
      return;
    }

    // 情绪关键词匹配分析
    this._currentEmotion = this._matchEmotion(text);

    // 显示分析结果区域
    this._showAnalysisResult(this._currentEmotion);

    // 创建并渲染可拖拽石头（附带用户原始输入）
    this._createStone(this._currentEmotion, text);

    // 更新 Store 状态
    if (typeof Store !== 'undefined') {
      Store.setState('trashCan', {
        currentStone: this._currentEmotion,
        lastInput: text,
      });
    }

    console.log('[TrashCanPage] 情绪分析完成:', this._currentEmotion);
  },

  /**
   * 基于关键词匹配识别情绪类型
   * 使用 EMOTION_PATTERNS 中的关键词进行匹配，找到匹配关键词最多的类型
   * @param {string} text - 用户输入文本
   * @returns {Object} 分析结果 { type, name, matchedKeywords, pattern }
   * @private
   */
  _matchEmotion(text) {
    // 默认返回（无匹配时）
    const result = {
      type: 'default',
      name: '一般负面情绪',
      matchedKeywords: [],
      pattern: null,
    };

    // 如果 EMOTION_PATTERNS 不可用，返回默认
    if (typeof EMOTION_PATTERNS === 'undefined') {
      return result;
    }

    let maxMatchCount = 0;
    const lowerText = text.toLowerCase();

    // 遍历每种情绪模式，统计匹配关键词数量
    for (const [type, pattern] of Object.entries(EMOTION_PATTERNS)) {
      const matched = pattern.keywords.filter(keyword =>
        lowerText.includes(keyword.toLowerCase())
      );

      if (matched.length > maxMatchCount) {
        maxMatchCount = matched.length;
        result.type = type;
        result.name = pattern.name;
        result.matchedKeywords = matched;
        result.pattern = pattern;
      }
    }

    // 如果一个关键词都没匹配到，从四种类型随机选一个
    if (maxMatchCount === 0 && typeof EMOTION_PATTERNS !== 'undefined') {
      const types = Object.keys(EMOTION_PATTERNS);
      const randomType = types[Math.floor(Math.random() * types.length)];
      const pattern = EMOTION_PATTERNS[randomType];
      const sampleKeywords = pattern.keywords.sort(() => 0.5 - Math.random()).slice(0, 2);
      result.type = randomType;
      result.name = pattern.name;
      result.matchedKeywords = sampleKeywords;
      result.pattern = pattern;
    }

    return result;
  },

  /**
   * 显示情绪分析结果文本
   * @param {Object} emotion - 情绪分析结果
   * @private
   */
  _showAnalysisResult(emotion) {
    const resultEl = document.getElementById('emotionResult');
    if (!resultEl) return;

    const nameEl = resultEl.querySelector('.trash-can__result-name');
    const keywordsEl = resultEl.querySelector('.trash-can__result-keywords');

    if (nameEl) {
      nameEl.textContent = emotion.name;
      nameEl.style.color = emotion.pattern ? emotion.pattern.color : 'var(--text-secondary)';
    }

    if (keywordsEl) {
      if (emotion.matchedKeywords.length > 0) {
        keywordsEl.innerHTML = emotion.matchedKeywords
          .map(k => `<span class="trash-can__result-tag">${k}</span>`)
          .join('');
        keywordsEl.style.display = 'flex';
      } else {
        keywordsEl.innerHTML = '';
        keywordsEl.style.display = 'none';
      }
    }

    resultEl.style.display = 'block';
  },

  /**
   * 创建可拖拽情绪石头元素，并绑定 DraggableStone
   * @param {Object} emotion - 情绪分析结果，用于设置石头样式
   * @param {string} [userInput=''] - 用户原始输入，用于显示在石头上
   * @private
   */
  _createStone(emotion, userInput = '') {
    const container = document.getElementById('stoneContainer');
    const trashContainer = document.getElementById('trashCanContainer');

    if (!container || !trashContainer) {
      console.warn('[TrashCanPage] 石头容器或垃圾桶容器不存在');
      return;
    }

    // 如果已有旧石头，清理掉
    this._clearCurrentStone();

    // 创建石头元素
    const stone = document.createElement('div');
    stone.className = 'trash-can__stone';
    if (emotion.type && emotion.type !== 'default') {
      // 不同情绪使用不同色调
      const colorClass = this._getStoneColorClass(emotion.type);
      if (colorClass) {
        stone.classList.add(colorClass);
      }
    }
    if (emotion.pattern && emotion.pattern.color) {
      stone.style.background = `linear-gradient(145deg, ${emotion.pattern.color}, var(--emotion-warm))`;
    }

    // 添加文字：优先显示用户输入的想法摘要，回退到情绪类型文案
    const displayText = this._formatStoneText(userInput) ||
      (this._stoneStyles[emotion.type] || this._stoneStyles.default).text;
    const textSpan = document.createElement('span');
    textSpan.className = 'trash-can__stone-text';
    textSpan.textContent = displayText;
    // 根据字数微调字号，确保长文本也能完整显示
    if (displayText.length > 12) {
      textSpan.style.fontSize = '11px';
      textSpan.style.lineHeight = '1.35';
    }
    stone.appendChild(textSpan);

    // 保存引用
    this._currentStoneEl = stone;
    container.innerHTML = '';
    container.appendChild(stone);

    // 创建 DraggableStone 实例并绑定
    if (typeof DraggableStone !== 'undefined') {
      this._draggableStone = new DraggableStone(stone, trashContainer, {
        onDrop: () => this.onStoneDrop(),
      });
      this._draggableStone.bind();
    } else {
      console.warn('[TrashCanPage] DraggableStone 组件不可用，拖拽功能将失效');
    }

    // 石头入场动画
    requestAnimationFrame(() => {
      stone.classList.add('trash-can__stone--enter');
    });
  },

  /**
   * 将用户输入格式化为适合石头显示的文字
   * 超长时截断并保留情绪关键词的完整性
   * @param {string} text - 用户输入
   * @returns {string} 格式化后的文字
   * @private
   */
  _formatStoneText(text) {
    if (!text) return '';
    const trimmed = text.trim().replace(/\s+/g, '');
    if (!trimmed) return '';
    // 石头尺寸约容纳 5 行 × 4 字，超出则截断
    return trimmed.length > 18 ? trimmed.slice(0, 18) + '…' : trimmed;
  },

  /**
   * 根据情绪类型返回对应的颜色类名
   * @param {string} type - 情绪类型
   * @returns {string|null} 颜色类名
   * @private
   */
  _getStoneColorClass(type) {
    const map = {
      typeA: 'trash-can__stone--angry',
      typeB: 'trash-can__stone--sad',
      typeC: 'trash-can__stone--anxious',
      typeD: 'trash-can__stone--angry',
    };
    return map[type] || null;
  },

  /**
   * 清理当前石头和拖拽实例
   * @private
   */
  _clearCurrentStone() {
    // 解绑拖拽事件
    if (this._draggableStone) {
      this._draggableStone.unbind();
      this._draggableStone = null;
    }

    // 移除 DOM
    if (this._currentStoneEl && this._currentStoneEl.parentNode) {
      this._currentStoneEl.parentNode.removeChild(this._currentStoneEl);
      this._currentStoneEl = null;
    }
  },

  // ============================================================
  // 拖拽回调与页面重置
  // ============================================================

  /**
   * 石头成功丢入垃圾桶后的回调
   * 显示完成按钮，记录到 Store 持久化存储
   * 由 DraggableStone 的 onDrop 回调触发
   */
  onStoneDrop() {
    const doneActions = document.getElementById('doneActions');
    const inputArea = document.querySelector('.trash-can__input-area');
    const hint = document.querySelector('.trash-can__hint');

    if (doneActions) {
      doneActions.style.display = 'flex';
    }
    if (inputArea) {
      inputArea.style.display = 'none';
    }
    if (hint) {
      hint.style.display = 'none';
    }

    // 保存到历史记录
    if (typeof Store !== 'undefined' && this._currentEmotion) {
      const currentHistory = Store.getState('trashCan.todayStones') || [];
      Store.setState('trashCan', {
        todayStones: [
          ...currentHistory,
          {
            ...this._currentEmotion,
            droppedAt: Date.now(),
          },
        ],
        currentStone: null,
      });
      Store.saveToStorage('trashCan');
    }

    console.log('[TrashCanPage] 石头已成功丢弃，情绪释放完成');
  },

  /**
   * 重置页面到初始输入状态
   * 清理当前石头，隐藏分析区域，清空输入框
   * 由"再来一次"按钮 onclick 触发
   */
  reset() {
    // 清理当前石头
    this._clearCurrentStone();

    // 清空输入框
    const input = document.getElementById('emotionInput');
    if (input) {
      input.value = '';
    }

    // 隐藏分析结果
    const resultEl = document.getElementById('emotionResult');
    if (resultEl) {
      resultEl.style.display = 'none';
    }

    // 恢复石头占位符
    const container = document.getElementById('stoneContainer');
    if (container) {
      container.innerHTML = '<div class="trash-can__stone-placeholder">?</div>';
    }

    // 隐藏完成按钮，恢复输入区
    const doneActions = document.getElementById('doneActions');
    const inputArea = document.querySelector('.trash-can__input-area');
    const hint = document.querySelector('.trash-can__hint');

    if (doneActions) {
      doneActions.style.display = 'none';
    }
    if (inputArea) {
      inputArea.style.display = 'flex';
    }
    if (hint) {
      hint.style.display = 'block';
    }

    // 清空当前情绪
    this._currentEmotion = null;

    // 滚动回顶部（输入区域）
    scrollPageToTop(true);

    // 更新 Store
    if (typeof Store !== 'undefined') {
      Store.setState('trashCan', { currentStone: null });
    }
  },
};

// 注册页面到待处理队列（App初始化后自动注册）
window._pageRegistrations = window._pageRegistrations || [];
window._pageRegistrations.push({page: 'trash-can', controller: TrashCanPage});

// 暴露到全局，供 inline onclick 调用
window.TrashCanPage = TrashCanPage;
