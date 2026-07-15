/**
 * BoundaryScissorsPage.js - 课题分离剪页面控制器
 * 将用户问题自动拆解到"我的事情"/"他的事情"两个区域，
 * 点击剪刀触发剪断动画，完成课题分离
 * 原生 ES6+，严格模式
 */
'use strict';

const BoundaryScissorsPage = {
  /** @type {ScissorsLine|null} 剪刀组件实例 */
  _scissorsInstance: null,

  /** @type {boolean} 是否已完成分割 */
  _isCutDone: false,

  /** @type {Object} 拆解后的结果 */
  _result: {
    mine: [],
    theirs: []
  },

  /** 预置常见条目模板 */
  _commonPatterns: [
    {
      match: ['朋友不回', '朋友没有回复', '朋友不回复', '不回消息', '不回复消息'],
      mine: ['我怎么表达', '我要不要再发一次', '我的感受如何'],
      theirs: ['他什么时候回复', '他愿不愿意回复', '他对我的看法']
    },
    {
      match: ['领导不认可', '领导没回复', '领导骂了', '领导批评'],
      mine: ['我可以从中学到什么', '我要不要改进', '我的应对方式'],
      theirs: ['他的情绪', '他的评价', '他那天心情好不好']
    },
    {
      match: ['父母不同意', '家人反对', '父母生气'],
      mine: ['我真正想要什么', '我如何沟通我的想法', '我的人生选择'],
      theirs: ['他们的观点', '他们的情绪', '他们是否接受']
    },
    {
      match: ['对方不爱我', '不在乎我', '不关心我', '不在意'],
      mine: ['我的需求是什么', '我要不要沟通', '我是否继续这段关系'],
      theirs: ['他的感受', '他的行为', '他爱不爱我']
    },
    {
      match: ['考试', '面试', '比赛', '结果'],
      mine: ['我准备得如何', '我付出了多少努力', '我的发挥'],
      theirs: ['评委怎么看', '结果好坏', '对手表现']
    }
  ],

  // ============================================================
  // 生命周期
  // ============================================================

  /**
   * 渲染课题分离剪页面HTML
   * @returns {string} 页面HTML字符串
   */
  render() {
    return `
      <div class="page boundary">
        <h2 class="boundary__title">课题分离剪</h2>
        <p class="boundary__subtitle">一件困扰你的事，把它剪切成你的课题和他人的课题</p>

        <!-- 输入区域 -->
        <div class="boundary__input-area">
          <div class="boundary__input-group">
            <label class="boundary__input-label">写下你的困扰</label>
            <input
              id="boundaryUserInput"
              type="text"
              class="boundary__input"
              placeholder="例如：朋友不回复我的消息..."
              maxlength="100"
            />
          </div>
          <button class="btn" onclick="BoundaryScissorsPage.analyzeInput()">开始分离</button>
        </div>

        <!-- 结果卡片：上下排列，我的事情 -> 连线 -> 他的事情 -->
        <div class="boundary__cards" id="boundaryCards">
          <div class="boundary__card boundary__card--mine" id="boundaryMineCard">
            <div class="boundary__card-label boundary__card-label--mine">
              <span class="boundary__card-marker boundary__card-marker--mine"></span>我的事情
            </div>
            <div id="boundaryMineContent" class="boundary__card-content">
              <div class="boundary__card-empty">输入问题后AI会自动为你分离</div>
            </div>
          </div>

          <!-- 连接线和剪刀 -->
          <div class="boundary__connection" id="boundaryConnection">
            <div class="boundary__connection-line" id="boundaryConnectionLine"></div>
            <div class="boundary__scissors boundary__scissors--disabled" id="boundaryScissors">✂️</div>
          </div>

          <div class="boundary__card boundary__card--theirs" id="boundaryTheirsCard">
            <div class="boundary__card-label boundary__card-label--theirs">
              <span class="boundary__card-marker boundary__card-marker--theirs"></span>他的事情
            </div>
            <div id="boundaryTheirsContent" class="boundary__card-content">
              <div class="boundary__card-empty">输入问题后AI会自动为你分离</div>
            </div>
          </div>
        </div>

        <!-- 完成后的结果展示 -->
        <div id="boundaryResultSection" style="display:none;" class="boundary__result">
          <h3 class="boundary__result-title">完成！</h3>
          <p class="boundary__result-text boundary__result-text--center">
            他人的课题已归还，现在专注于你能掌控的部分
          </p>
          <div class="boundary__result-actions">
            <button class="boundary__result-reset" onclick="BoundaryScissorsPage.reset()">重新来</button>
            <button class="btn btn--sm btn--outline" onclick="App.navigateTo('home')">返回首页</button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 页面挂载：显示导航栏，初始化剪刀组件
   * @param {HTMLElement} pageView - 页面DOM元素
   * @param {Object} [params] - 路由参数
   */
  mount(pageView, params = {}) {
    // 显示导航栏
    if (typeof NavBar !== 'undefined' && typeof NavBar.show === 'function') {
      NavBar.show('boundary-scissors');
    }

    // 重置状态
    this._isCutDone = false;
    this._result = { mine: [], theirs: [] };

    // 初始化竖向剪刀组件
    // VerticalScissorsLine 会在 .boundary__connection 容器内创建 SVG，
    // 因此隐藏原有的 CSS 连线和 emoji 剪刀，避免重复显示
    const connectionContainer = document.getElementById('boundaryConnection');
    const originalLine = document.getElementById('boundaryConnectionLine');
    const emojiScissors = document.getElementById('boundaryScissors');

    if (originalLine) originalLine.style.display = 'none';
    if (emojiScissors) emojiScissors.style.display = 'none';

    if (typeof VerticalScissorsLine !== 'undefined' && connectionContainer) {
      // 清除可能存在的旧 SVG（页面重新挂载时）
      const existingSvg = connectionContainer.querySelector('.vertical-scissors-line-svg');
      if (existingSvg) {
        existingSvg.remove();
      }

      this._scissorsInstance = new VerticalScissorsLine(connectionContainer, {
        onCut: () => this.onCutComplete()
      });
      this._scissorsInstance.render();
    } else {
      console.warn('[BoundaryScissorsPage] VerticalScissorsLine 组件不可用');
    }

    // 如果有预置输入，自动填入并分析
    if (params.presetInput) {
      const input = document.getElementById('boundaryUserInput');
      if (input) {
        input.value = params.presetInput;
        setTimeout(() => this.analyzeInput(), 100);
      }
    }

    // 初始化边界记录为数组，避免剪断时展开非可迭代对象报错
    if (typeof Store !== 'undefined') {
      const currentRecords = Store.getState('training.boundaryRecords');
      if (!Array.isArray(currentRecords)) {
        Store.setState('training.boundaryRecords', []);
      }
    }
  },

  // ============================================================
  // 分析用户输入
  // ============================================================

  /**
   * 分析用户输入，自动分离到我的/他的区域
   */
  analyzeInput() {
    const input = document.getElementById('boundaryUserInput');
    if (!input) return;

    const text = input.value.trim();
    if (!text) {
      input.style.borderColor = '#ff4444';
      setTimeout(() => {
        input.style.borderColor = '';
      }, 1500);
      return;
    }

    // 根据关键词匹配分离课题
    const result = this._separateByPattern(text);
    this._result = result;

    // 渲染结果到卡片
    this._renderResult();

    // 启用剪刀
    const scissors = document.getElementById('boundaryScissors');
    if (scissors) {
      scissors.classList.remove('boundary__scissors--disabled');
    }

    console.log('[BoundaryScissorsPage] 分离完成:', result);
  },

  /**
   * 根据关键词模式分离课题
   * @param {string} text - 用户输入文本
   * @returns {{mine: string[], theirs: string[]}} 分离结果
   * @private
   */
  _separateByPattern(text) {
    const result = { mine: [], theirs: [] };
    const lowerText = text.toLowerCase();

    // 尝试匹配预置模式
    for (const pattern of this._commonPatterns) {
      const matched = pattern.match.some(kw => lowerText.includes(kw.toLowerCase()));
      if (matched) {
        result.mine = [...pattern.mine];
        result.theirs = [...pattern.theirs];
        return result;
      }
    }

    // 没有匹配到预置模式，使用通用模板
    result.mine = [
      '我对这件事的感受',
      '我可以做什么来改变',
      '我的边界在哪里'
    ];
    result.theirs = [
      '对方的想法和决定',
      '对方的情绪和态度',
      '最终结果是什么'
    ];

    return result;
  },

  /**
   * 将分离结果渲染到DOM
   * @private
   */
  _renderResult() {
    const mineEl = document.getElementById('boundaryMineContent');
    const theirsEl = document.getElementById('boundaryTheirsContent');

    if (mineEl) {
      if (this._result.mine.length > 0) {
        mineEl.innerHTML = this._result.mine.map(item =>
          `<div style="padding: 6px 0; border-bottom: 1px solid rgba(232, 168, 124, 0.2);">• ${item}</div>`
        ).join('');
      } else {
        mineEl.innerHTML = '<div class="boundary__card-empty">没有分离出条目</div>';
      }
    }

    if (theirsEl) {
      if (this._result.theirs.length > 0) {
        theirsEl.innerHTML = this._result.theirs.map(item =>
          `<div style="padding: 6px 0; border-bottom: 1px solid rgba(168, 213, 186, 0.2);">• ${item}</div>`
        ).join('');
      } else {
        theirsEl.innerHTML = '<div class="boundary__card-empty">没有分离出条目</div>';
      }
    }

    // 滚动到卡片区域，让用户看到上下两个卡片与连线
    const cards = document.getElementById('boundaryCards');
    if (cards) {
      setTimeout(() => {
        cards.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  },

  // ============================================================
  // 剪断完成回调
  // ============================================================

  /**
   * 剪断完成回调
   * 由ScissorsLine组件回调触发
   */
  onCutComplete() {
    if (this._isCutDone) return;

    this._isCutDone = true;

    // “他的事情”卡片脱离并消失，只保留“我的事情”
    const theirsCard = document.getElementById('boundaryTheirsCard');
    if (theirsCard) {
      theirsCard.classList.add('boundary__card--detached');
      setTimeout(() => {
        theirsCard.style.display = 'none';
      }, 400);
    }

    // 连线区域收缩，让结果无需下滑即可见
    const connection = document.getElementById('boundaryConnection');
    if (connection) {
      connection.classList.add('boundary__connection--cut');
    }

    // 显示完成结果区域
    const resultSection = document.getElementById('boundaryResultSection');
    if (resultSection) {
      resultSection.style.display = 'block';
    }

    // 保存记录到Store
    if (typeof Store !== 'undefined') {
      const existingRecords = Store.getState('training.boundaryRecords') || [];
      const inputText = document.getElementById('boundaryUserInput')?.value || '';

      const record = {
        id: Date.now().toString(36),
        originalInput: inputText,
        mine: this._result.mine,
        theirs: this._result.theirs,
        cutAt: Date.now()
      };

      Store.setState('training', {
        boundaryRecords: [...existingRecords, record]
      });
      Store.saveToStorage('training');
    }

    // 震动反馈（如果支持）
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch (e) {
        // 静默降级
      }
    }

    console.log('[BoundaryScissorsPage] 剪断完成，课题分离成功');
  },

  // ============================================================
  // 重置页面
  // ============================================================

  /**
   * 重置页面到初始状态
   */
  reset() {
    // 清空输入
    const input = document.getElementById('boundaryUserInput');
    if (input) input.value = '';

    // 清空结果卡片
    const mineEl = document.getElementById('boundaryMineContent');
    const theirsEl = document.getElementById('boundaryTheirsContent');
    if (mineEl) {
      mineEl.innerHTML = '<div class="boundary__card-empty">输入问题后AI会自动为你分离</div>';
    }
    if (theirsEl) {
      theirsEl.innerHTML = '<div class="boundary__card-empty">输入问题后AI会自动为你分离</div>';
    }

    // 隐藏结果区域
    const resultSection = document.getElementById('boundaryResultSection');
    if (resultSection) resultSection.style.display = 'none';

    // 恢复“他的事情”卡片
    const theirsCard = document.getElementById('boundaryTheirsCard');
    if (theirsCard) {
      theirsCard.style.display = '';
      theirsCard.classList.remove('boundary__card--detached');
    }

    // 恢复连线区域
    const connection = document.getElementById('boundaryConnection');
    if (connection) {
      connection.classList.remove('boundary__connection--cut');
    }

    // 重置剪刀组件
    if (this._scissorsInstance) {
      this._scissorsInstance.reset();
    }

    // 禁用剪刀
    const scissors = document.getElementById('boundaryScissors');
    if (scissors) scissors.classList.add('boundary__scissors--disabled');

    // 重置状态
    this._isCutDone = false;
    this._result = { mine: [], theirs: [] };

    // 滚动回输入区域
    scrollPageToTop(true);
  }
};

// 注册页面到待处理队列（App初始化后自动注册）
window._pageRegistrations = window._pageRegistrations || [];
window._pageRegistrations.push({page: 'boundary-scissors', controller: BoundaryScissorsPage});

// 暴露到全局，供inline onclick调用
window.BoundaryScissorsPage = BoundaryScissorsPage;