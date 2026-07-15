/**
 * CBTFormPage.js - 心理预案三栏法页面控制器
 * 分步向导：事件 → 自动想法 → 重新评价，最后生成预览卡片
 * 集成CBT认知扭曲十种类型提示，支持保存到Store + localStorage
 * 原生 ES6+，严格模式
 */
'use strict';

const CBTFormPage = {
  /** @type {number} 当前步骤（0-2） */
  _currentStep: 0,

  /** @type {number} 总步骤数 */
  _totalSteps: 3,

  /** @type {Object} 用户填写的表单数据 */
  _formData: {
    scenario: '',
    autoThought: '',
    reevaluation: ''
  },

  /** CBT认知扭曲十种类型 */
  _cognitiveDistortions: [
    { id: 'all-or-nothing', label: '全有或全无思维', desc: '事情不是完美就是彻底失败，没有中间地带。' },
    { id: 'overgeneralization', label: '过度概括', desc: '基于单一事件就得出普遍结论，比如"这次没做好，我永远做不好"。' },
    { id: 'mental-filter', label: '心理过滤', desc: '只关注负面细节，忽略所有积极方面。' },
    { id: 'disqualifying-positive', label: '否定正面信息', desc: '拒绝接受正面经历，觉得"这不算什么"或"运气好而已"。' },
    { id: 'mind-reading', label: '读心术', desc: '没有证据就断定别人怎么想，比如"他一定觉得我很差劲"。' },
    { id: 'fortune-telling', label: '预测未来', desc: '预感到事情会变糟，并把这个预测当作已经发生的事实。' },
    { id: 'catastrophizing', label: '灾难化', desc: '把小事放大成灾难，想到最坏的结果。' },
    { id: 'labeling', label: '贴标签', desc: '用极端标签定义自己或他人，如"我真没用"、"他太自私了"。' },
    { id: 'personalization', label: '个人化', desc: '把与自己无关的事情归咎于自己，觉得都是自己的错。' },
    { id: 'should-statements', label: '应该句式', desc: '用"我应该""我必须"严格要求自己，做不到就感到内疚。' }
  ],

  // ============================================================
  // 生命周期
  // ============================================================

  /**
   * 渲染CBT三栏法页面HTML
   * @param {Object} [params] - 路由参数，支持预设场景文本
   * @returns {string} 页面HTML字符串
   */
  render(params = {}) {
    // 如果有预置输入（从AI情绪分析跳转过来）
    const presetScenario = params.presetScenario || '';
    const presetThought = params.presetThought || '';

    return `
      <div class="page cbt-form">
        <!-- 步骤指示器 -->
        <div class="cbt-form__steps" id="cbtStepIndicator">
          <div class="cbt-form__step-dot cbt-form__step-dot--active" data-step="0">1</div>
          <div class="cbt-form__step-line" data-step-line="0"></div>
          <div class="cbt-form__step-dot" data-step="1">2</div>
          <div class="cbt-form__step-line" data-step-line="1"></div>
          <div class="cbt-form__step-dot" data-step="2">3</div>
        </div>
        <div class="cbt-form__steps" style="display:flex;justify-content:space-between;margin-top:-20px;margin-bottom:24px;padding:0 8px;">
          <span class="cbt-form__step-label cbt-form__step-label--active" data-step-label="0">事件</span>
          <span class="cbt-form__step-label" data-step-label="1">自动想法</span>
          <span class="cbt-form__step-label" data-step-label="2">重新评价</span>
        </div>

        <!-- 步骤1：事件 -->
        <div class="cbt-form__section" id="cbtStep0" data-section="0">
          <div class="cbt-form__question">发生了什么？</div>
          <div class="cbt-form__question-desc">描述让你感到困扰的具体事件或情境</div>
          <div class="cbt-form__ai-tip">
            <div class="cbt-form__ai-tip-icon">AI</div>
            <div class="cbt-form__ai-tip-content">
              <div class="cbt-form__ai-tip-title">认知提醒</div>
              <div class="cbt-form__ai-tip-text">描述客观事实，不加入情绪判断。比如"同事没有回复我的消息"，而不是"同事故意不理我"。</div>
            </div>
          </div>
          <textarea class="cbt-form__textarea cbt-form__textarea--tall" id="cbtScenarioInput" placeholder="例如：今天下午开会时，领导对我提出的方案没有做任何评价..." data-preset="${presetScenario}">${presetScenario}</textarea>
        </div>

        <!-- 步骤2：自动想法 -->
        <div class="cbt-form__section cbt-form__section--hidden" id="cbtStep1" data-section="1">
          <div class="cbt-form__question">第一反应是什么？</div>
          <div class="cbt-form__question-desc">当时脑海中闪过了哪些想法？</div>
          <div class="cbt-form__ai-tip" id="cbtDistortionTip">
            <div class="cbt-form__ai-tip-icon">AI</div>
            <div class="cbt-form__ai-tip-content">
              <div class="cbt-form__ai-tip-title">认知扭曲提示</div>
              <div class="cbt-form__ai-tip-text" id="cbtDistortionText">点击下方按钮查看常见的认知扭曲类型，看看你的想法是否属于其中一种。</div>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;" id="cbtDistortionTags">
            ${this._cognitiveDistortions.map((d, i) => `
              <button class="cbt-form__ai-tip-btn" data-distortion="${d.id}" onclick="CBTFormPage.showDistortionTip('${d.id}')">${d.label}</button>
            `).join('')}
          </div>
          <textarea class="cbt-form__textarea cbt-form__textarea--tall" id="cbtThoughtInput" placeholder="例如：我心想「完了，领导肯定觉得我的方案很差，我是不是不适合这份工作」" data-preset="${presetThought}">${presetThought}</textarea>
        </div>

        <!-- 步骤3：重新评价 -->
        <div class="cbt-form__section cbt-form__section--hidden" id="cbtStep2" data-section="2">
          <div class="cbt-form__question">有没有其他可能？</div>
          <div class="cbt-form__question-desc">换一个角度，用更客观理性的方式看待这件事</div>
          <div class="cbt-form__ai-tip">
            <div class="cbt-form__ai-tip-icon">AI</div>
            <div class="cbt-form__ai-tip-content">
              <div class="cbt-form__ai-tip-title">理性思考引导</div>
              <div class="cbt-form__ai-tip-text">问问自己：支持这个想法的证据是什么？反对这个想法的证据是什么？朋友会怎么看待这件事？</div>
            </div>
          </div>
          <textarea class="cbt-form__textarea cbt-form__textarea--tall" id="cbtReevalInput" placeholder="例如：领导没有当场评价可能只是时间不够，或者他需要再考虑一下。之前我的方案也有被采纳的时候，不能因为一次沉默就否定自己。"></textarea>
        </div>

        <!-- 导航按钮 -->
        <div class="cbt-form__nav" id="cbtNavButtons">
          <button class="cbt-form__nav-btn cbt-form__nav-btn--prev" id="cbtPrevBtn" onclick="CBTFormPage.goPrev()" style="visibility:hidden;">上一步</button>
          <button class="cbt-form__nav-btn cbt-form__nav-btn--next" id="cbtNextBtn" onclick="CBTFormPage.goNext()">下一步</button>
        </div>

        <!-- 预览卡片区域（初始隐藏） -->
        <div class="cbt-form__card-preview" id="cbtPreviewSection" style="display:none;">
          <div class="cbt-form__card-inner" id="cbtCardInner">
            <div class="cbt-form__card-face cbt-form__card-face--front">
              <div class="cbt-form__card-item cbt-form__card-item--situation">
                <div class="cbt-form__card-item-label">场景</div>
                <div class="cbt-form__card-item-content" id="cbtPreviewScenario"></div>
              </div>
              <div class="cbt-form__card-item cbt-form__card-item--old-reaction">
                <div class="cbt-form__card-item-label">旧反应</div>
                <div class="cbt-form__card-item-content" id="cbtPreviewOldReaction"></div>
              </div>
              <div class="cbt-form__card-item cbt-form__card-item--new-response">
                <div class="cbt-form__card-item-label">新回应</div>
                <div class="cbt-form__card-item-content" id="cbtPreviewNewResponse"></div>
              </div>
              <div class="cbt-form__card-item cbt-form__card-item--reminder">
                <div class="cbt-form__card-item-label">下次提醒</div>
                <div class="cbt-form__card-item-content" id="cbtPreviewReminder"></div>
              </div>
              <div class="cbt-form__card-flip-hint" onclick="CBTFormPage.flipCard()">点击翻转</div>
            </div>
            <div class="cbt-form__card-face cbt-form__card-face--back">
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;">
                <div style="font-size:48px;">&#x1F4AA;</div>
                <div style="font-size:16px;font-weight:600;color:var(--text-primary);text-align:center;">你已经迈出了改变的第一步</div>
                <div style="font-size:14px;color:var(--text-secondary);text-align:center;line-height:1.5;">记录下这些思考，<br>下次遇到类似情况时提醒自己。</div>
                <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap;justify-content:center;">
                  <button class="btn btn--sm" onclick="CBTFormPage.saveCard()">保存卡片</button>
                  <button class="btn btn--sm btn--secondary" onclick="CBTFormPage.flipCard()">翻转回去</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 保存成功提示（初始隐藏） -->
        <div id="cbtSuccessMessage" style="display:none;text-align:center;padding:32px 16px;">
          <div style="font-size:48px;margin-bottom:12px;">&#x2714;&#xFE0F;</div>
          <div style="font-size:18px;font-weight:700;color:var(--text-primary);margin-bottom:8px;">保存成功！</div>
          <div style="font-size:14px;color:var(--text-secondary);margin-bottom:24px;line-height:1.5;">你的心理预案已保存，<br>可以在首页查看记录。</div>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <button class="btn" onclick="App.navigateTo('home')">返回首页</button>
            <button class="btn btn--secondary" onclick="CBTFormPage.resetForm()">继续新建</button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 页面挂载：显示导航栏，恢复表单数据，处理预置输入
   * @param {HTMLElement} pageView - 页面DOM元素
   * @param {Object} [params] - 路由参数
   */
  mount(pageView, params = {}) {
    // 显示导航栏
    if (typeof NavBar !== 'undefined' && typeof NavBar.show === 'function') {
      NavBar.show('cbt-form');
    }

    // 重置状态
    this._currentStep = 0;
    this._formData = { scenario: '', autoThought: '', reevaluation: '' };

    // 如果有预置输入，填入表单
    if (params.presetScenario) {
      this._formData.scenario = params.presetScenario;
    }
    if (params.presetThought) {
      this._formData.autoThought = params.presetThought;
    }

    // 更新步骤指示器
    this._updateStepIndicator();
  },

  // ============================================================
  // 步骤导航
  // ============================================================

  /**
   * 进入下一步
   * 验证当前步骤输入，前进到下一步
   */
  goNext() {
    // 验证当前步骤输入
    if (!this._validateCurrentStep()) {
      return;
    }

    if (this._currentStep < this._totalSteps - 1) {
      // 保存当前步骤数据
      this._saveStepData();

      // 前进
      this._currentStep++;
      this._updateStepIndicator();
    } else {
      // 最后一步：保存并显示预览
      this._saveStepData();
      this._showPreview();
    }
  },

  /**
   * 返回上一步
   */
  goPrev() {
    if (this._currentStep > 0) {
      // 保存当前步骤数据
      this._saveStepData();

      // 后退
      this._currentStep--;
      this._updateStepIndicator();
    }
  },

  /**
   * 验证当前步骤输入是否有效
   * @returns {boolean} 是否通过验证
   */
  _validateCurrentStep() {
    const inputMap = {
      0: { id: 'cbtScenarioInput', name: '事件描述' },
      1: { id: 'cbtThoughtInput', name: '自动想法' },
      2: { id: 'cbtReevalInput', name: '重新评价' }
    };

    const step = inputMap[this._currentStep];
    if (!step) return true;

    const input = document.getElementById(step.id);
    if (!input) return true;

    const value = input.value.trim();
    if (!value) {
      input.style.borderColor = '#ff4444';
      input.focus();
      setTimeout(() => {
        input.style.borderColor = '';
      }, 1500);
      return false;
    }

    return true;
  },

  /**
   * 保存当前步骤的输入数据
   */
  _saveStepData() {
    const input = document.getElementById('cbtScenarioInput');
    if (input) {
      this._formData.scenario = input.value.trim();
    }

    const thought = document.getElementById('cbtThoughtInput');
    if (thought) {
      this._formData.autoThought = thought.value.trim();
    }

    const reeval = document.getElementById('cbtReevalInput');
    if (reeval) {
      this._formData.reevaluation = reeval.value.trim();
    }
  },

  /**
   * 更新步骤指示器和可见区域
   */
  _updateStepIndicator() {
    // 更新圆点状态
    for (let i = 0; i < this._totalSteps; i++) {
      const dot = document.querySelector(`[data-step="${i}"]`);
      if (!dot) continue;

      dot.classList.remove('cbt-form__step-dot--active', 'cbt-form__step-dot--completed');

      if (i === this._currentStep) {
        dot.classList.add('cbt-form__step-dot--active');
      } else if (i < this._currentStep) {
        dot.classList.add('cbt-form__step-dot--completed');
      }
    }

    // 更新连线状态
    for (let i = 0; i < this._totalSteps - 1; i++) {
      const line = document.querySelector(`[data-step-line="${i}"]`);
      if (!line) continue;
      line.classList.toggle('cbt-form__step-line--active', i < this._currentStep);
    }

    // 更新步骤标签
    for (let i = 0; i < this._totalSteps; i++) {
      const label = document.querySelector(`[data-step-label="${i}"]`);
      if (!label) continue;
      label.classList.toggle('cbt-form__step-label--active', i === this._currentStep);
    }

    // 显示/隐藏各区段
    for (let i = 0; i < this._totalSteps; i++) {
      const section = document.querySelector(`[data-section="${i}"]`);
      if (!section) continue;
      section.classList.toggle('cbt-form__section--hidden', i !== this._currentStep);
    }

    // 隐藏预览区和成功提示
    const preview = document.getElementById('cbtPreviewSection');
    if (preview) preview.style.display = 'none';
    const successMsg = document.getElementById('cbtSuccessMessage');
    if (successMsg) successMsg.style.display = 'none';

    // 控制导航按钮显隐
    const prevBtn = document.getElementById('cbtPrevBtn');
    const nextBtn = document.getElementById('cbtNextBtn');
    if (prevBtn) {
      prevBtn.style.visibility = this._currentStep === 0 ? 'hidden' : 'visible';
    }
    if (nextBtn) {
      nextBtn.textContent = this._currentStep === this._totalSteps - 1 ? '生成预览' : '下一步';
    }

    // 滚动到顶部
    scrollPageToTop(true);
  },

  // ============================================================
  // 认知扭曲提示
  // ============================================================

  /**
   * 显示认知扭曲提示详情
   * @param {string} id - 认知扭曲ID
   */
  showDistortionTip(id) {
    const distortion = this._cognitiveDistortions.find(d => d.id === id);
    if (!distortion) return;

    const textEl = document.getElementById('cbtDistortionText');
    if (textEl) {
      textEl.textContent = '【' + distortion.label + '】' + distortion.desc;
    }

    // 高亮当前按钮
    const allBtns = document.querySelectorAll('[data-distortion]');
    allBtns.forEach(btn => {
      btn.style.opacity = btn.dataset.distortion === id ? '1' : '0.5';
    });
  },

  // ============================================================
  // 预览卡片
  // ============================================================

  /**
   * 显示预览卡片
   */
  _showPreview() {
    // 隐藏所有步骤区段
    for (let i = 0; i < this._totalSteps; i++) {
      const section = document.querySelector(`[data-section="${i}"]`);
      if (section) section.classList.add('cbt-form__section--hidden');
    }

    // 隐藏导航按钮
    const nav = document.getElementById('cbtNavButtons');
    if (nav) nav.style.display = 'none';

    // 填充预览数据
    const scenarioEl = document.getElementById('cbtPreviewScenario');
    if (scenarioEl) scenarioEl.textContent = this._formData.scenario;

    const oldReactionEl = document.getElementById('cbtPreviewOldReaction');
    if (oldReactionEl) oldReactionEl.textContent = this._formData.autoThought;

    const newResponseEl = document.getElementById('cbtPreviewNewResponse');
    if (newResponseEl) newResponseEl.textContent = this._formData.reevaluation;

    // 生成下次提醒（基于自动想法提炼简短提醒语句）
    const reminder = this._generateReminder(this._formData.autoThought);
    const reminderEl = document.getElementById('cbtPreviewReminder');
    if (reminderEl) reminderEl.textContent = reminder;

    // 显示预览区域
    const preview = document.getElementById('cbtPreviewSection');
    if (preview) {
      preview.style.display = 'block';
      // 滚动到预览区域
      setTimeout(() => {
        preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  },

  /**
   * 基于自动想法生成简短提醒
   * @param {string} thought - 自动想法文本
   * @returns {string} 提醒语句
   */
  _generateReminder(thought) {
    if (!thought) return '先观察事实，不要预设结果';

    // 关键词匹配生成个性化提醒
    const reminderMap = [
      { keywords: ['失败', '不行', '差劲', '没用', '糟糕'], text: '一次结果不代表全部，给自己多一些耐心' },
      { keywords: ['讨厌', '不喜欢', '嫌弃', '烦'], text: '别人的情绪不是你的责任' },
      { keywords: ['一定', '肯定', '绝对', '必须', '应该'], text: '事情不是非黑即白，试着看到中间地带' },
      { keywords: ['所有人', '大家', '都', '没人'], text: '避免过度概括，关注具体的人和事' },
      { keywords: ['完蛋', '崩溃', '受不了', '无法', '不行了'], text: '停下来深呼吸，把问题拆解成小步骤' },
      { keywords: ['错', '怪我', '我的错', '我不好'], text: '客观看待责任，不要把所有事情都归咎于自己' },
    ];

    const lowerThought = thought.toLowerCase();
    for (const item of reminderMap) {
      if (item.keywords.some(kw => lowerThought.includes(kw))) {
        return item.text;
      }
    }

    // 默认提醒
    return '先观察事实，不要预设结果';
  },

  /**
   * 翻转预览卡片（正面/背面）
   */
  flipCard() {
    const cardInner = document.getElementById('cbtCardInner');
    if (cardInner) {
      cardInner.classList.toggle('cbt-form__card-inner--flipped');
    }
  },

  // ============================================================
  // 保存与重置
  // ============================================================

  /**
   * 保存卡片到Store和localStorage
   */
  saveCard() {
    const cardData = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      scenario: this._formData.scenario,
      autoThought: this._formData.autoThought,
      reevaluation: this._formData.reevaluation,
      reminder: document.getElementById('cbtPreviewReminder')?.textContent || '',
      createdAt: new Date().toISOString()
    };

    // 保存到Store
    if (typeof Store !== 'undefined') {
      const existingCards = Store.getState('training.cbtCards') || [];
      Store.setState('training', {
        cbtCards: [...existingCards, cardData]
      });
      Store.saveToStorage('training');
    }

    // 隐藏预览卡片
    const preview = document.getElementById('cbtPreviewSection');
    if (preview) preview.style.display = 'none';

    // 显示成功提示
    const successMsg = document.getElementById('cbtSuccessMessage');
    if (successMsg) successMsg.style.display = 'block';

    // 滚动到成功提示
    setTimeout(() => {
      if (successMsg) successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    console.log('[CBTFormPage] 卡片已保存:', cardData.id);
  },

  /**
   * 重置表单，回到第一步
   */
  resetForm() {
    // 清空输入
    const scenarioInput = document.getElementById('cbtScenarioInput');
    if (scenarioInput) scenarioInput.value = '';

    const thoughtInput = document.getElementById('cbtThoughtInput');
    if (thoughtInput) thoughtInput.value = '';

    const reevalInput = document.getElementById('cbtReevalInput');
    if (reevalInput) reevalInput.value = '';

    // 重置表单数据
    this._formData = { scenario: '', autoThought: '', reevaluation: '' };

    // 隐藏成功提示
    const successMsg = document.getElementById('cbtSuccessMessage');
    if (successMsg) successMsg.style.display = 'none';

    // 显示导航按钮
    const nav = document.getElementById('cbtNavButtons');
    if (nav) nav.style.display = 'flex';

    // 重置到第一步
    this._currentStep = 0;
    this._updateStepIndicator();

    // 重置认知扭曲高亮
    const allBtns = document.querySelectorAll('[data-distortion]');
    allBtns.forEach(btn => { btn.style.opacity = '1'; });
    const textEl = document.getElementById('cbtDistortionText');
    if (textEl) {
      textEl.textContent = '点击下方按钮查看常见的认知扭曲类型，看看你的想法是否属于其中一种。';
    }

    // 重置卡片翻转
    const cardInner = document.getElementById('cbtCardInner');
    if (cardInner) cardInner.classList.remove('cbt-form__card-inner--flipped');

    scrollPageToTop(true);
  }
};

// 注册页面到待处理队列（App初始化后自动注册）
window._pageRegistrations = window._pageRegistrations || [];
window._pageRegistrations.push({page: 'cbt-form', controller: CBTFormPage});

// 暴露到全局，供inline onclick调用
window.CBTFormPage = CBTFormPage;