/****************************
 * 见澄明H5 - 答题流程控制模块 (ES Module)
 * 支持断点续答（localStorage）、进度条渲染、TOO_FAST校验
 * v5.0 适配：type 替代 layout、value 替代 id、segments 段间过渡
 ****************************/

import {
  renderSplit, renderBinary, renderCards, renderChat, renderSort,
  renderSE, renderSlider, startQuestionTimer, clearTimerUI
} from './questionRenderers.js';

/**
 * QuizController 类
 * 管理整个答题流程：加载题目、渲染题目、处理选择、下一题、断点续答
 */
export class QuizController {
  constructor(options = {}) {
    this.state = {
      quizMode: null,      // 'fast' | 'standard'
      answers: {},         // {questionId: optionValue | 'timeout__'}
      sortOrder: [],       // 排序题当前顺序
      currentQIndex: 0,
      quizStartTime: 0,
      quizQuestions: [],
      segments: [],        // v5.0：段间过渡配置数组
      seenSegments: new Set(), // v5.0：已显示过过渡的段ID
      seenTypes: new Set(),    // v5.0：已显示过题型说明的type
      lastSegment: null,       // v5.0：上一题的segment
    };

    this.onComplete = options.onComplete || (() => {}); // 答题完成回调
    this.onNavigateHome = options.onNavigateHome || (() => {}); // 返回首页回调
    this.timerHandle = null; // 当前计时器引用

    this._loadDraft();
  }

  /**
   * 加载题目
   * v5.0 格式：{ version, mode, totalQuestions, segments, questions }
   * @param {string} mode - 'fast' | 'standard'
   * @param {Object|Array} questionBank - v5.0 完整题库对象（含 segments + questions），或兼容旧版数组
   * @returns {Array} 筛选后的题目数组
   */
  loadQuestions(mode, questionBank = {}) {
    this.state.quizMode = mode;

    // v5.0 格式检测：优先从 {fast, standard} 中提取对应 mode 的题库
    let bank = questionBank;
    if (bank && !Array.isArray(bank) && bank[mode]) {
      bank = bank[mode];
    }

    // 如果提取出来的是 v5.0 完整对象（含 questions 数组）
    if (bank && !Array.isArray(bank) && Array.isArray(bank.questions)) {
      this.state.quizQuestions = bank.questions;
      this.state.segments = bank.segments || [];
    } else if (Array.isArray(bank)) {
      // 直接传入的是题目数组
      this.state.quizQuestions = bank;
      this.state.segments = [];
    } else {
      // 兜底
      this.state.quizQuestions = [];
      this.state.segments = [];
    }

    // 断点续答检查：如果已有同模式草稿且未完成，则恢复状态
    const draft = this._loadDraft();
    if (draft && draft.quizMode === mode && Object.keys(draft.answers || {}).length > 0) {
      this.state.answers = draft.answers;
      this.state.currentQIndex = draft.currentQIndex || 0;
      this.state.quizStartTime = draft.quizStartTime || Date.now();
      this.state.seenTypes = new Set(draft.seenTypes || []);
      this.state.seenSegments = new Set(draft.seenSegments || []);
      this.state.shuffledMaps = draft.shuffledMaps || {};
      this.state.lastSegment = draft.lastSegment || null;
      // 不重置 sortOrder，让它在 renderSort 中自动初始化
    } else {
      this.state.answers = {};
      this.state.sortOrder = [];
      this.state.currentQIndex = 0;
      this.state.quizStartTime = Date.now();
      this.state.seenTypes = new Set();
      this.state.seenSegments = new Set();
      this.state.lastSegment = null;
      // 为每道题打乱选项顺序
      this.state.shuffledMaps = this._shuffleAllOptions(this.state.quizQuestions);
    }
    this._saveDraft();
    return this._applyShuffle(this.state.quizQuestions, this.state.shuffledMaps);
  }

  /**
   * Fisher-Yates 洗牌算法
   */
  _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * 为所有题目生成打乱后的选项顺序映射
   * v5.0：使用 value 字段做选项标识，兼容旧版 id
   * 返回 { questionId: [打乱后的optionValue数组] }
   */
  _shuffleAllOptions(questions) {
    const maps = {};
    for (const q of questions) {
      // v5.0：binary/quickBinary 无 options，跳过
      if (q.type === 'binary' || q.type === 'quickBinary') continue;
      // v5.0：sort 使用 items，也打乱
      if (q.type === 'sort' && q.items && q.items.length > 1) {
        maps[q.id] = this._shuffle(q.items.map(item => item.value || item.id));
        continue;
      }
      if (q.options && q.options.length > 1) {
        maps[q.id] = this._shuffle(q.options.map(o => o.value || o.id));
      }
    }
    return maps;
  }

  /**
   * 将打乱映射应用到题目数组，返回新的题目数组（不修改原始数据）
   * v5.0：使用 value 字段做选项标识
   */
  _applyShuffle(questions, maps) {
    return questions.map(q => {
      // v5.0：binary/quickBinary 无 options，跳过
      if (q.type === 'binary' || q.type === 'quickBinary') return q;

      const shuffledValues = maps[q.id];
      if (!shuffledValues) return q;

      // v5.0：sort 使用 items
      if ((q.type === 'sort') && q.items && q.items.length > 0) {
        const valueToItem = {};
        for (const item of q.items) {
          const key = item.value || item.id;
          valueToItem[key] = item;
        }
        return { ...q, items: shuffledValues.map(v => valueToItem[v]).filter(Boolean) };
      }

      if (!q.options) return q;
      // 按 shuffle 顺序重新排列 options
      const valueToOption = {};
      for (const o of q.options) {
        const key = o.value || o.id;
        valueToOption[key] = o;
      }
      return { ...q, options: shuffledValues.map(v => valueToOption[v]).filter(Boolean) };
    });
  }

  /**
   * 渲染当前题目到指定容器
   * v5.0：检测 segment 变化显示段间过渡页
   * @param {HTMLElement} container - app 根容器
   */
  renderQuestion(container) {
    const questions = this.state.quizQuestions;
    const total = questions.length;
    const idx = this.state.currentQIndex;

    if (idx >= total) {
      this._showCompletePage(container);
      return;
    }

    const q = questions[idx];
    const progress = ((idx) / total * 100).toFixed(1);

    container.className = 'page-quiz';
    container.innerHTML = `
      <div class="quiz-progress">
        <div class="quiz-progress-bar" style="width:${progress}%"></div>
        <div class="quiz-progress-icon" style="left:${progress}%">☀️</div>
      </div>
      <div class="quiz-container" id="quiz-container"></div>
    `;

    const quizContainer = document.getElementById('quiz-container');

    // v5.0：检测 segment 变化，显示段间过渡页
    const hasAnswered = this.state.answers[q.id];
    const currentSegment = q.segment || null;
    const segmentChanged = currentSegment !== this.state.lastSegment;

    if (segmentChanged && currentSegment && this.state.segments.length > 0 && !hasAnswered) {
      const segConfig = this.state.segments.find(s => s.id === currentSegment);
      if (segConfig && segConfig.transition && segConfig.transition.text) {
        this.state.lastSegment = currentSegment;
        this._showSegmentTransition(quizContainer, segConfig.transition, () => {
          this._renderQuestionWithType(quizContainer, q);
        });
        return;
      }
    }

    this.state.lastSegment = currentSegment;

    // 非排序题时重置 sortOrder，避免下道排序题拿到脏数据
    const qType = q.type || q.layout || 'cards';
    if (qType !== 'sort') {
      this.state.sortOrder = [];
    }

    // 检查是否需要显示题型说明过渡页（第一次遇到该题型，且未作答时）
    if (!hasAnswered && !this.state.seenTypes.has(qType)) {
      this.state.seenTypes.add(qType);
      this._saveDraft();
      this._showTypeTransition(quizContainer, qType, () => {
        this._renderQuestionWithType(quizContainer, q);
      });
    } else {
      this._renderQuestionWithType(quizContainer, q);
    }
  }

  /**
   * v5.0：显示段间过渡页
   * @param {HTMLElement} container
   * @param {Object} transition - { emoji, text }
   * @param {Function} onContinue
   */
  _showSegmentTransition(container, transition, onContinue) {
    const emoji = transition.emoji || '🎬';
    const text = transition.text || '进入下一部分';

    container.innerHTML = `
      <div class="layout-transition">
        <div class="layout-transition-emoji">${emoji}</div>
        <div class="layout-transition-title">${text}</div>
        <button class="btn-primary" id="segment-continue" style="margin-top:24px;">继续</button>
      </div>
    `;

    document.getElementById('segment-continue').addEventListener('click', () => {
      onContinue();
    });
  }

  /**
   * 显示题型说明过渡页
   * v5.0：使用 type 分发
   */
  _showTypeTransition(container, type, onContinue) {
    const typeMeta = {
      binary:       { icon: '⚡', title: '直觉快选', desc: '快速直觉作答', tips: ['左右二选一', '按第一反应选择', '没有对错之分'] },
      quickBinary:  { icon: '⚡', title: '极速二选', desc: '快速直觉作答', tips: ['左右二选一', '按第一反应选择', '没有对错之分'] },
      socialDesirability: { icon: '⚖️', title: '社会期望', desc: '请如实回答', tips: ['按照真实想法选择', '没有对错之分'] },
      situational:  { icon: '📋', title: '情境卡', desc: '阅读情境，做出选择', tips: ['仔细阅读情境描述', '选择最符合你的选项', '每个情境只选一次'] },
      ifTomorrow:    { icon: '🔮', title: '如果明天', desc: '想象未来，做出选择', tips: ['进入想象场景', '选择最符合你的选项', '享受过程'] },
      aiScenario:   { icon: '🤖', title: 'AI场景', desc: '阅读AI相关情境', tips: ['仔细阅读场景描述', '选择最符合你的选项'] },
      thirdMap:     { icon: '🧭', title: '对照校验', desc: '请认真对比', tips: ['仔细阅读题目', '选择最符合你的选项'] },
      awarenessShift: { icon: '💡', title: '觉察转换', desc: '换个角度看问题', tips: ['仔细阅读情境', '选择最符合你的反应'] },
      chat:         { icon: '💬', title: '聊天记录', desc: '模拟对话，选择回复', tips: ['进入对话场景', '选择你会说的话', '自然反应即可'] },
      sort:         { icon: '🔀', title: '排序拼图', desc: '拖拽排序你的选择', tips: ['长按拖拽卡片', '按优先级排列', '确认后自动下一题'] },
      selfReflection: { icon: '❤️', title: '自我反思', desc: '回顾内心感受', tips: ['拖动滑块选择', '按直觉选择即可'] },
    };
    // 旧版兼容
    const layoutMeta = {
      split:  { icon: '⚡', title: '直觉快选', desc: '快速直觉作答', tips: ['左右二选一', '按第一反应选择', '没有对错之分'] },
      cards:  { icon: '📋', title: '情境选择', desc: '阅读情境，做出选择', tips: ['仔细阅读情境描述', '选择最符合你的选项', '每个情境只选一次'] },
    };

    const meta = typeMeta[type] || layoutMeta[type] || { icon: '📝', title: '新题型', desc: '请认真阅读题目', tips: ['仔细阅读', '按直觉选择', '享受过程'] };

    const tipsHtml = meta.tips.map(t => `<div class="layout-tip">${t}</div>`).join('');

    container.innerHTML = `
      <div class="layout-transition">
        <div class="layout-transition-emoji">${meta.icon}</div>
        <div class="layout-transition-title">${meta.title}</div>
        <div class="layout-transition-desc">${meta.desc}</div>
        <div class="layout-transition-tips">
          ${tipsHtml}
        </div>
        <button class="btn-primary" id="layout-continue" style="margin-top:24px;">继续</button>
      </div>
    `;

    document.getElementById('layout-continue').addEventListener('click', () => {
      onContinue();
    });
  }

  /**
   * 根据题型分发渲染
   * v5.0：使用 q.type 分发，兼容旧版 q.layout
   */
  _renderQuestionWithType(container, q) {
    this._clearTimer();
    const selected = this.state.answers[q.id];
    const type = q.type || q.layout || 'cards';

    switch (type) {
      case 'binary':
      case 'quickBinary':
        // v5.0：使用 leftText/rightText
        renderBinary(container, q, (qid, val) => this.selectOption(qid, val), selected);
        break;
      case 'split':
        // 旧版兼容
        renderSplit(container, q, (qid, val) => this.selectOption(qid, val), selected);
        break;
      case 'chat':
        renderChat(container, q, (qid, val) => this.selectOption(qid, val), selected);
        break;
      case 'sort':
        // 排序题：如果有已保存的答案，从答案恢复顺序；否则从默认顺序开始
        const savedAnswer = this.state.answers[q.id];
        const items = q.items || q.options || [];
        let currentSort = [];
        if (savedAnswer) {
          // 断点续答：savedAnswer 是 "A,B,C,D" 格式的 value 序列
          const savedValues = savedAnswer.split(',');
          // 将 value 序列转为索引序列
          currentSort = savedValues.map(v => items.findIndex(it => (it.value || it.id) === v)).filter(i => i >= 0);
          if (currentSort.length !== items.length) currentSort = []; // 不匹配则重置
        }
        this.state.sortOrder = currentSort;
        renderSort(
          container, q,
          (qid, orderedValues) => this._confirmSort(qid, orderedValues),
          currentSort,
          (newOrder) => { this.state.sortOrder = newOrder; }
        );
        break;
      case 'socialDesirability':
        renderSE(container, q, (qid, val) => this.selectOption(qid, val), selected);
        break;
      case 'selfReflection':
        renderSlider(container, q, (qid, val) => this.selectOption(qid, val), selected);
        break;
      case 'situational':
      case 'ifTomorrow':
      case 'aiScenario':
      case 'thirdMap':
      case 'awarenessShift':
      case 'cards':
      default:
        renderCards(container, q, (qid, val) => this.selectOption(qid, val), selected);
        break;
    }
  }

  /**
   * 用户选择选项
   * v5.0：oid 现在是 value 字段值（如 "A"/"B"/"left"/"agree" 等）
   * @param {string} qid
   * @param {string} value
   */
  selectOption(qid, value) {
    this._clearTimer(); // 用户选择了，清除限时
    this.state.answers[qid] = value;
    this._saveDraft();

    // 自动下一题（300ms 延迟让用户看到选中态）
    setTimeout(() => this.nextQuestion(), 300);
  }

  /**
   * 排序题确认
   * v5.0：使用 value 字段
   * @param {string} qid
   * @param {string[]} orderedValues - 排序后的 value 数组
   */
  _confirmSort(qid, orderedValues) {
    this.state.answers[qid] = orderedValues.join(',');
    // 存储 sortOrder 为 value 数组（供断点续答用）
    this.state.sortOrder = orderedValues;
    this._saveDraft();
    this.nextQuestion();
  }

  /**
   * 限时超时处理
   */
  _onTimeout(qId) {
    if (!this.state.answers[qId]) {
      this.state.answers[qId] = '__timeout__';
      this._saveDraft();
    }
    this.nextQuestion();
  }

  /**
   * 下一题
   */
  nextQuestion() {
    this.state.currentQIndex++;
    this._saveDraft();

    const questions = this.state.quizQuestions;
    if (this.state.currentQIndex >= questions.length) {
      this._finishQuiz();
    } else {
      const app = document.getElementById('app');
      if (app) this.renderQuestion(app);
    }
  }

  /**
   * 答题完成
   */
  _finishQuiz() {
    // 清除草稿
    localStorage.removeItem('cji_quiz_draft');
    // 计算总耗时
    const elapsedMs = this.state.quizStartTime ? (Date.now() - this.state.quizStartTime) : 0;
    // 触发完成回调
    this.onComplete({
      answers: this.state.answers,
      questions: this.state.quizQuestions,
      segments: this.state.segments,
      mode: this.state.quizMode,
      elapsedMs
    });
  }

  /**
   * TOO_FAST 前端预检
   * @param {number} elapsedMs
   * @param {string} mode
   * @returns {Object} { flagged, elapsedSec, thresholdSec }
   */
  static checkTooFast(elapsedMs, mode) {
    if (!elapsedMs || elapsedMs <= 0) return { flagged: false };
    const threshold = mode === 'fast' ? 60000 : 180000; // 毫秒
    const flagged = elapsedMs < threshold;
    return {
      flagged,
      elapsedSec: Math.round(elapsedMs / 1000),
      thresholdSec: threshold / 1000
    };
  }

  /**
   * 获取当前进度百分比
   */
  getProgress() {
    const total = this.state.quizQuestions.length;
    if (!total) return 0;
    return ((this.state.currentQIndex) / total * 100).toFixed(1);
  }

  /**
   * 是否有未完成的草稿
   */
  hasDraft() {
    const draft = this._loadDraft();
    return draft && draft.quizMode && Object.keys(draft.answers || {}).length > 0;
  }

  /**
   * 获取草稿模式
   */
  getDraftMode() {
    const draft = this._loadDraft();
    return draft ? draft.quizMode : null;
  }

  /**
   * 清除答题状态（包含草稿）
   */
  clearQuiz() {
    this.state.answers = {};
    this.state.sortOrder = [];
    this.state.currentQIndex = 0;
    this.state.quizStartTime = 0;
    this.state.lastSegment = null;
    localStorage.removeItem('cji_quiz_draft');
  }

  /**
   * 显示完成过渡页
   */
  _showCompletePage(container) {
    container.className = 'page-quiz';
    container.innerHTML = `
      <div class="complete-page">
        <div class="complete-logo"><span>澄</span></div>
        <div class="complete-title">正在生成你的报告</div>
        <div class="complete-subtitle">三根轴正在转起来</div>
        <div class="complete-progress-wrap">
          <div class="complete-progress-bg">
            <div class="complete-progress-bar" id="complete-progress-bar"></div>
          </div>
          <div class="complete-progress-text" id="complete-progress-text">0%</div>
        </div>
        <div class="complete-steps">
          <div class="complete-step active" data-step="1">
            <div class="complete-step-dot"></div>
            <div class="complete-step-text">统计答题数据</div>
          </div>
          <div class="complete-step" data-step="2">
            <div class="complete-step-dot"></div>
            <div class="complete-step-text">识别遮蔽模式</div>
          </div>
          <div class="complete-step" data-step="3">
            <div class="complete-step-dot"></div>
            <div class="complete-step-text">生成澄明画像</div>
          </div>
        </div>
        <div class="complete-encourage">"看得见场，读得懂自己，找得到路"</div>
      </div>
    `;

    // 进度条动画 + 步骤点亮
    let progress = 0;
    const bar = document.getElementById('complete-progress-bar');
    const text = document.getElementById('complete-progress-text');
    const progressInterval = setInterval(() => {
      progress += Math.random() * 8 + 2;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
      }
      if (bar) bar.style.width = progress + '%';
      if (text) text.textContent = Math.floor(progress) + '%';

      // 步骤点亮
      if (progress > 30) {
        const s2 = container.querySelector('[data-step="2"]');
        if (s2) s2.classList.add('active');
      }
      if (progress > 70) {
        const s3 = container.querySelector('[data-step="3"]');
        if (s3) s3.classList.add('active');
      }
    }, 200);

    setTimeout(() => {
      clearInterval(progressInterval);
      this._finishQuiz();
    }, 2800);
  }

  _clearTimer() {
    if (this.timerHandle) {
      this.timerHandle.clear();
      this.timerHandle = null;
    }
    clearTimerUI();
  }

  _saveDraft() {
    localStorage.setItem('cji_quiz_draft', JSON.stringify({
      quizMode: this.state.quizMode,
      answers: this.state.answers,
      currentQIndex: this.state.currentQIndex,
      quizStartTime: this.state.quizStartTime,
      sortOrder: this.state.sortOrder,
      seenTypes: Array.from(this.state.seenTypes || []),
      seenSegments: Array.from(this.state.seenSegments || []),
      lastSegment: this.state.lastSegment || null,
      shuffledMaps: this.state.shuffledMaps || {},
    }));
  }

  _loadDraft() {
    try {
      const raw = localStorage.getItem('cji_quiz_draft');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
}
