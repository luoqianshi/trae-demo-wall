// ========================================
// IF LIFE · UI 渲染层
// 所有页面的 DOM 渲染与交互
// ========================================

const UI = {
  autoDecisionSeq: 0,
  referenceDecisionSeq: 0,

  icons: {
    family: '<path d="M4 12.5 12 6l8 6.5"/><path d="M6.5 11.8V20h11v-8.2"/><path d="M10 20v-5h4v5"/><path d="M15.5 6.5V4h2v4"/><path d="M7 8.5c-1.2-.7-1.8-1.8-1.8-3"/><path d="M8.7 7.1C7.9 6.3 7.7 5.4 8 4.4"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z"/><path d="M5.5 16.5l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5.5-1.4z"/>',
    city: '<path d="M4 20h16"/><path d="M5.5 20V9.5h4V20"/><path d="M10.5 20V5h5V20"/><path d="M16.5 20v-8h2.5v8"/><path d="M7 12h1"/><path d="M12 8h1.5"/><path d="M12 11h1.5"/><path d="M12 14h1.5"/>',
    field: '<path d="M4 20c3-4.5 6.7-7 12-7"/><path d="M7 20c2.4-2.5 5.5-4 10-4"/><path d="M12 20c1.3-1.1 2.9-1.8 5-2"/><path d="M7 9c1.2 1.6 2.9 2.3 5 2.1"/><path d="M12 11.1C11.4 8.5 9.8 6.8 7 6"/><path d="M15 10c1.7-.3 3-1.3 4-3"/><path d="M15 10c.6-2.3 2-3.7 4.1-4.2"/>',
    book: '<path d="M4 5.5c2.6-.8 5-.6 8 1.1v13c-3-1.7-5.4-1.9-8-1.1v-13z"/><path d="M12 6.6c3-1.7 5.4-1.9 8-1.1v13c-2.6-.8-5-.6-8 1.1"/><path d="M12 6.6v13"/>',
    palette: '<path d="M12 4c4.5 0 8 2.9 8 6.9 0 2.5-1.4 4-3.5 4H15c-.9 0-1.5.6-1.5 1.4 0 .4.2.8.2 1.2 0 1.3-1.2 2.5-2.9 2.5C6.9 20 4 16.7 4 12.4 4 7.7 7.5 4 12 4z"/><circle cx="8.4" cy="10" r=".8"/><circle cx="11" cy="7.8" r=".8"/><circle cx="14.2" cy="8.4" r=".8"/><circle cx="16" cy="11.2" r=".8"/>',
    briefcase: '<path d="M5 8.5h14v10H5z"/><path d="M9 8.5V6.8c0-1 1-1.8 2.2-1.8h1.6c1.2 0 2.2.8 2.2 1.8v1.7"/><path d="M5 12.2c4.4 1.4 9.6 1.4 14 0"/><path d="M12 11.5v2"/>',
    personality: '<path d="M5.5 6.5c2.2-1 4.5-.8 6.5.5v10.3c-2 1-4.6.9-6.7-.7C3.8 15.4 3 13.5 3 11.1c0-2 .8-3.7 2.5-4.6z"/><path d="M12 7c2-1.3 4.3-1.5 6.5-.5 1.7.9 2.5 2.6 2.5 4.6 0 2.4-.8 4.3-2.3 5.5-2.1 1.6-4.7 1.7-6.7.7"/><path d="M7 10.2c.8-.5 1.7-.5 2.5 0"/><path d="M14.5 10.2c.8-.5 1.7-.5 2.5 0"/><path d="M7.5 14.3c1 .8 2 .8 3 0"/><path d="M13.5 14.4c1-.6 2-.6 3 0"/>',
    scale: '<path d="M12 4v16"/><path d="M7 20h10"/><path d="M5 8h14"/><path d="M8 8l-3 5h6L8 8z"/><path d="M16 8l-3 5h6l-3-5z"/><path d="M12 4c1.2 0 2 .8 2 2h-4c0-1.2.8-2 2-2z"/>',
    manual: '<path d="M7 12V6.5a1.2 1.2 0 0 1 2.4 0V12"/><path d="M9.4 11V5.3a1.2 1.2 0 0 1 2.4 0V11"/><path d="M11.8 11V6a1.2 1.2 0 0 1 2.4 0v5"/><path d="M14.2 12.1V8a1.2 1.2 0 0 1 2.4 0v6.2c0 3.7-2.2 5.8-5.2 5.8-2.4 0-4.2-1.1-5.5-3.4L4.5 14a1.2 1.2 0 0 1 2-1.3L8 14.8"/>',
    auto: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3.8v2"/><path d="M12 18.2v2"/><path d="M4.9 7.2l1.7 1"/><path d="M17.4 15.8l1.7 1"/><path d="M4.9 16.8l1.7-1"/><path d="M17.4 8.2l1.7-1"/><path d="M3.8 12h2"/><path d="M18.2 12h2"/><path d="M8.8 4.7l.7 1.8"/><path d="M14.5 17.5l.7 1.8"/>',
    mixed: '<path d="M4 7h3.5c3 0 4 10 7 10H20"/><path d="M17 14l3 3-3 3"/><path d="M4 17h3.5c1.1 0 2-.9 2.8-2.1"/><path d="M13.9 9.2c.7-1.2 1.7-2.2 3.1-2.2H20"/><path d="M17 4l3 3-3 3"/>',
    wealth: '<circle cx="12" cy="12" r="7.5"/><path d="M9 12h6"/><path d="M12 9v6"/><path d="M8.5 7.4c1-.7 2.1-1.1 3.5-1.1s2.5.4 3.5 1.1"/><path d="M8.5 16.6c1 .7 2.1 1.1 3.5 1.1s2.5-.4 3.5-1.1"/>',
    happiness: '<path d="M18.5 15.5A7.2 7.2 0 1 1 9.1 5.2 6.5 6.5 0 1 0 18.5 15.5z"/><path d="M9 13.2c1.5 1.6 3.5 1.6 5 0"/><path d="M9.5 10h.1"/><path d="M13.8 10h.1"/>',
    health: '<path d="M4 12h3l1.8-4.2 3.1 8.5 2.1-5.1h2.2l1.1-2.2 1.7 3h1"/><path d="M5.8 6.5c2.1-2 4.3-1.3 6.2 1.1 1.9-2.4 4.1-3.1 6.2-1.1 2.1 2 1.8 5.5-.7 8.1-1.5 1.6-3.4 3-5.5 4.5-2.1-1.5-4-2.9-5.5-4.5-2.5-2.6-2.8-6.1-.7-8.1z"/>',
    career: '<path d="M6 20V5"/><path d="M6 6.2c3.5-1.7 6.2 1.8 10-.2v7c-3.8 2-6.5-1.5-10 .2"/><path d="M4 20h6"/>',
    seal: '<path d="M12 3.8c3.8 0 7.2 2.9 7.2 6.8 0 4.9-3.1 8.7-7.2 8.7s-7.2-3.8-7.2-8.7c0-3.9 3.4-6.8 7.2-6.8z"/><path d="M8.6 9.5c1.8-1.3 5-1.3 6.8 0"/><path d="M8.2 13.5c2 1.5 5.6 1.5 7.6 0"/><path d="M10 7.2l.8 2"/><path d="M14.2 15.5l.8 2"/>',
    dice: '<rect x="5" y="5" width="14" height="14" rx="3"/><circle cx="9" cy="9" r=".8"/><circle cx="15" cy="9" r=".8"/><circle cx="12" cy="12" r=".8"/><circle cx="9" cy="15" r=".8"/><circle cx="15" cy="15" r=".8"/>',
    settings: '<path d="M5 7h14"/><path d="M5 12h14"/><path d="M5 17h14"/><circle cx="9" cy="7" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="11" cy="17" r="1.7"/>',
    restart: '<path d="M6.5 8.5A7 7 0 1 1 5 14"/><path d="M6.5 4.5v4h4"/><path d="M5 14h4"/>',
    flame: '<path d="M12 21c-3.6-1.3-5.4-3.7-5.4-7 0-2.8 1.6-4.8 4.1-6.4.2 2.1 1 3.4 2.5 4.3.1-2.5 1.1-4.8 3.1-6.9 1.3 2.4 2.4 5.2 2.4 8.4 0 3.8-2.4 6.3-6.7 7.6z"/><path d="M12 18c-1.3-.8-2-1.9-2-3.2 0-1 .5-1.9 1.5-2.7.4 1.2 1 2 2 2.5.3-.8.8-1.6 1.5-2.4.5 1 .8 2 .8 3 0 1.4-1.2 2.5-3.8 2.8z"/>',
    shield: '<path d="M12 4l7 2.6v5.1c0 4.1-2.5 7.1-7 8.3-4.5-1.2-7-4.2-7-8.3V6.6L12 4z"/><path d="M8.5 12.3l2.2 2.2 4.8-5"/>',
    qr: '<path d="M5 5h5v5H5z"/><path d="M14 5h5v5h-5z"/><path d="M5 14h5v5H5z"/><path d="M14 14h2v2h-2z"/><path d="M17 17h2v2h-2z"/><path d="M18 13h1"/><path d="M13 18h1"/>'
  },

  icon(name, extraClass = '') {
    const paths = this.icons[name] || this.icons.spark;
    return `<svg class="ink-icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;
  },

  getParamOptionIcon(paramKey, optionId) {
    const map = {
      family: { stable: 'family', wealthy: 'city', humble: 'field' },
      talent: { academic: 'book', artistic: 'palette', business: 'briefcase' },
      city: { tier1: 'city', newtier1: 'city', tier3: 'family' },
      personality: { striver: 'flame', guardian: 'shield', speculator: 'dice', free: 'palette' },
      risk: { conservative: 'scale', balanced: 'mixed', aggressive: 'career' }
    };
    return map[paramKey]?.[optionId] || paramKey;
  },

  hydrateStaticIcons() {
    const settingsBtn = document.getElementById('btn-api-settings');
    if (settingsBtn) settingsBtn.innerHTML = this.icon('settings', 'icon-button');

    const restartBtn = document.getElementById('btn-portrait-restart');
    if (restartBtn) restartBtn.innerHTML = `${this.icon('restart', 'btn-icon')}重新开始`;

    const aiBtn = document.getElementById('btn-portrait-ai');
    if (aiBtn) aiBtn.innerHTML = `<span class="btn-ink">${this.icon('dice', 'btn-icon')}让 AI 生成一个事件</span>`;

    const fetchModelsBtn = document.getElementById('btn-api-fetch-models');
    if (fetchModelsBtn) fetchModelsBtn.innerHTML = `${this.icon('auto', 'btn-icon')}获取模型`;

    const hint = document.querySelector('.timeline-hint');
    if (hint) hint.innerHTML = `点击带 ${this.icon('seal', 'hint-icon')} 的节点可以回溯，探索平行人生`;
  },

  // ===== 初始化 =====
  init() {
    this.hydrateStaticIcons();
    this.bindLanding();
    this.bindSetup();
    this.bindSimulation();
    this.bindTimeline();
    this.bindParallel();
    this.bindLab();
    this.bindPortrait();
    this.bindAPISettings();
    this.bindKeyboard();
    State.init();
  },

  // ===== 页面进入回调 =====
  onPageEnter(pageId) {
    switch (pageId) {
      case 'setup': this.renderSetup(); break;
      case 'simulation': this.renderSimulation(); break;
      case 'timeline': this.renderTimeline(); break;
      case 'parallel': this.renderParallel(); break;
      case 'lab': this.renderLab(); break;
      case 'portrait': this.renderPortrait(); break;
    }
  },

  // ========================================
  // 首屏 Landing
  // ========================================
  bindLanding() {
    document.getElementById('btn-start-landing').addEventListener('click', () => {
      Router.goTo('setup');
    });
  },

  // ========================================
  // 起点设定页 Setup
  // ========================================
  bindSetup() {
    // 角色名输入
    document.getElementById('char-name').addEventListener('input', (e) => {
      State.character.name = e.target.value.trim();
      this.updateSetupButton();
    });

    // 开始模拟
    document.getElementById('btn-start-sim').addEventListener('click', () => {
      if (!State.isSetupComplete()) return;
      State.calculateInitialAttributes();
      State.currentEventIndex = 0;
      State.decisions = [];
      State.eventPhase = 'choosing';
      Router.goTo('simulation');
    });
  },

  renderSetup() {
    this.renderParams();
    this.renderModes();
    this.renderPreview();
    this.updateSetupButton();
  },

  renderParams() {
    const container = document.getElementById('setup-params');
    const paramDefs = [
      { key: 'family', label: '家庭背景', icon: 'family', num: '01' },
      { key: 'talent', label: '天赋倾向', icon: 'spark', num: '02' },
      { key: 'city', label: '出生城市', icon: 'city', num: '03' },
      { key: 'personality', label: '性格底色', icon: 'personality', num: '04' },
      { key: 'risk', label: '风险偏好', icon: 'scale', num: '05' }
    ];

    let html = '';
    for (let def of paramDefs) {
      const options = IF_LIFE_DATA.PARAMS[def.key];
      html += `<div class="param-group">
        <div class="param-group-label">
          <span>${this.icon(def.icon, 'group-icon')} ${def.label}</span>
          <span class="param-num">${def.num}</span>
        </div>
        <div class="param-options">`;

      for (let opt of options) {
        const selected = State.character.params[def.key] === opt.id ? 'selected' : '';
        const effectsText = opt.effects ? this.formatEffects(opt.effects) : '';
        const desc = opt.desc || '';
        html += `<div class="param-option ${selected}" data-param="${def.key}" data-value="${opt.id}">
          <span class="param-icon">${this.icon(this.getParamOptionIcon(def.key, opt.id), 'option-icon')}</span>
          <div class="param-text">
            <div class="param-label">${opt.label}</div>
            <div class="param-desc">${desc}${effectsText ? ' · ' + effectsText : ''}</div>
          </div>
        </div>`;
      }

      html += `</div></div>`;
    }

    container.innerHTML = html;

    // 绑定点击
    container.querySelectorAll('.param-option').forEach(el => {
      el.addEventListener('click', () => {
        const param = el.dataset.param;
        const value = el.dataset.value;
        State.setParam(param, value);

        // 更新选中状态
        container.querySelectorAll(`.param-option[data-param="${param}"]`).forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');

        this.renderPreview();
        this.updateSetupButton();
      });
    });
  },

  renderModes() {
    const container = document.getElementById('setup-modes');
    let html = '';
    const modeIcons = { manual: 'manual', auto: 'auto', mixed: 'mixed' };
    for (let mode of IF_LIFE_DATA.MODES) {
      const selected = State.character.mode === mode.id ? 'selected' : '';
      const label = mode.id === 'mixed' ? '混合模式' : mode.label;
      const badge = mode.id === 'mixed' ? '<span class="mode-badge">推荐</span>' : '';
      html += `<div class="mode-option ${selected}" data-mode="${mode.id}">
        <span class="mode-icon">${this.icon(modeIcons[mode.id], 'mode-svg')}</span>
        <div class="mode-text">
          <div class="mode-label">${label}${badge}</div>
          <div class="mode-desc">${mode.desc}</div>
          <div class="mode-detail">${mode.detail}</div>
        </div>
      </div>`;
    }
    container.innerHTML = html;

    container.querySelectorAll('.mode-option').forEach(el => {
      el.addEventListener('click', () => {
        State.setMode(el.dataset.mode);
        container.querySelectorAll('.mode-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        this.updateSetupButton();
      });
    });
  },

  renderPreview() {
    const container = document.getElementById('preview-bars');
    const attrs = State.calculateInitialAttributes();
    const attrDefs = IF_LIFE_DATA.ATTRIBUTES;

    let html = '';
    for (let key in attrs) {
      const def = attrDefs[key];
      html += `<div class="preview-bar">
        <div class="preview-bar-label">
          <span class="bar-name">${this.icon(key, 'attr-mini')} ${def.label}</span>
          <span class="bar-value">${attrs[key]}</span>
        </div>
        <div class="preview-bar-track">
          <div class="preview-bar-fill" style="width:${attrs[key]}%;background:${def.color}"></div>
        </div>
      </div>`;
    }
    container.innerHTML = html;
  },

  updateSetupButton() {
    const btn = document.getElementById('btn-start-sim');
    if (State.isSetupComplete()) {
      btn.classList.remove('disabled');
      btn.disabled = false;
    } else {
      btn.classList.add('disabled');
      btn.disabled = true;
    }
  },

  formatEffects(effects) {
    const parts = [];
    const names = { wealth: '财富', happiness: '幸福', health: '健康', career: '事业' };
    for (let key in effects) {
      const val = effects[key];
      if (val !== 0) {
        parts.push(`${names[key] || key}${val > 0 ? '+' : ''}${val}`);
      }
    }
    return parts.join(' ');
  },

  // ========================================
  // 模拟主循环页 Simulation
  // ========================================
  bindSimulation() {
    document.getElementById('btn-sim-prev').addEventListener('click', () => {
      if (State.prevEvent()) {
        this.renderSimulation();
      }
    });

    document.getElementById('btn-sim-next').addEventListener('click', () => {
      if (State.nextEvent()) {
        this.renderSimulation();
      } else {
        // 所有事件完成
        State.saveOriginalLife();
        Router.goTo('timeline');
      }
    });
  },

  renderSimulation() {
    const event = State.getCurrentEvent();
    if (!event) return;

    // 更新进度
    this.updateSimProgress();

    // 更新属性条
    this.renderSimAttrs();

    // 渲染事件内容
    if (State.eventPhase === 'choosing') {
      this.renderEventChoosing(event);
    } else {
      this.renderEventResult(event);
    }
  },

  updateSimProgress() {
    const total = State.selectedEvents.length;
    const current = State.currentEventIndex + 1;
    const percent = (current / total) * 100;

    document.getElementById('sim-chapter').textContent = `${current} / ${total}`;
    document.getElementById('sim-progress-fill').style.width = percent + '%';
  },

  renderSimAttrs() {
    const container = document.getElementById('sim-attrs');
    const attrs = State.character.attributes;
    const attrDefs = IF_LIFE_DATA.ATTRIBUTES;

    let html = '';
    for (let key in attrs) {
      const def = attrDefs[key];
      html += `<div class="sim-attr">
        <div class="sim-attr-label">${this.icon(key, 'attr-mini')} ${def.label}</div>
        <div class="sim-attr-value" id="attr-${key}">${attrs[key]}</div>
        <div class="sim-attr-delta" id="attr-delta-${key}"></div>
      </div>`;
    }
    container.innerHTML = html;
  },

  renderEventChoosing(event) {
    const container = document.getElementById('sim-event');
    const age = State.getCurrentAge();
    const stage = Engine.getLifeStage(event.life_stage);
    const shouldUserDecide = State.shouldUserDecide(event.id);

    let html = `
      <div class="event-stage">${stage ? stage.name : ''}</div>
      <div class="event-age">${age} 岁</div>
      <div class="event-title">${event.title}</div>
      <div class="event-context">${event.context}</div>
    `;

    if (shouldUserDecide) {
      // 用户选择
      html += `<div class="event-options">`;
      for (let opt of event.options) {
        html += `<button class="event-option" data-option="${opt.id}">
          <span class="option-letter">${opt.id}</span>
          <div class="option-text">
            <div class="option-label">${opt.label}</div>
            <div class="option-desc">${opt.description}</div>
          </div>
        </button>`;
      }
      html += `</div>`;

      if (State.character.mode === 'manual' || State.character.mode === 'mixed') {
        const referenceTitle = State.character.mode === 'mixed' ? '混合模式 · AI 参考' : 'AI 参考选择';
        html += `<div class="ai-reference-panel" id="ai-reference-panel">
          <div class="auto-summary-title">${this.icon('auto', 'attr-mini')} ${referenceTitle}</div>
          <div class="auto-summary-block">
            <div class="auto-thought-label">思考摘要</div>
            <div class="auto-thinking-text" id="ai-reference-thinking">AI 正在阅读你的选项...</div>
          </div>
          <div class="auto-summary-block">
            <div class="auto-thought-label">AI 回复</div>
            <div class="auto-reply-text" id="ai-reference-reply">稍等，我会给出参考选择。</div>
          </div>
        </div>`;
      }
    } else {
      // AI 自动决策
      const autoTitle = State.character.mode === 'mixed' ? '混合模式 · AI 自动选择' : 'AI 自动选择';
      const autoText = State.character.mode === 'mixed'
        ? '这个非关键节点交给 AI 自动推进...'
        : 'AI 正在阅读事件和角色底色...';
      html += `<div class="auto-progress">
        <div class="auto-progress-spinner">${this.icon('auto', 'auto-icon')}</div>
        <div class="auto-progress-main">
          <div class="auto-panel-title">${this.icon('auto', 'attr-mini')} ${autoTitle}</div>
          <div class="auto-progress-text">${autoText}</div>
        </div>
        <div class="auto-thought-card">
          <div class="auto-thought-row">
            <div class="auto-thought-label">思考摘要</div>
            <div class="auto-thinking-text" id="auto-thinking-text">正在整理判断依据...</div>
          </div>
          <div class="auto-thought-row">
            <div class="auto-thought-label">AI 回复</div>
            <div class="auto-reply-text" id="auto-reply-text">稍等，我会给出这个角色最可能的选择。</div>
          </div>
        </div>
      </div>`;
    }

    // 隐藏继续按钮
    document.getElementById('btn-sim-next').style.display = 'none';

    container.innerHTML = html;

    if (shouldUserDecide) {
      this.autoDecisionSeq++;
      // 绑定选项点击
      container.querySelectorAll('.event-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const optionId = btn.dataset.option;
          this.handleDecision(optionId, true);
        });
      });
      if (State.character.mode === 'manual' || State.character.mode === 'mixed') {
        this.runReferenceDecision(event);
      }
    } else {
      this.referenceDecisionSeq++;
      this.runAutoDecision(event);
    }
  },

  async runReferenceDecision(event) {
    const seq = ++this.referenceDecisionSeq;
    const [decisionMeta] = await Promise.all([
      AI.decideEvent(event, State.character),
      new Promise(resolve => setTimeout(resolve, 450))
    ]);

    if (!this.isReferenceDecisionCurrent(seq, event.id)) {
      return;
    }

    await this.streamReferenceDecisionPreview(decisionMeta, seq, event.id);
  },

  async runAutoDecision(event) {
    const seq = ++this.autoDecisionSeq;
    const [decisionMeta] = await Promise.all([
      AI.decideEvent(event, State.character),
      new Promise(resolve => setTimeout(resolve, 650))
    ]);

    if (!this.isAutoDecisionCurrent(seq, event.id)) {
      return;
    }

    await this.streamAutoDecisionPreview(decisionMeta, seq, event.id);

    setTimeout(() => {
      if (this.isAutoDecisionCurrent(seq, event.id)) {
        this.handleDecision(decisionMeta.optionId, false, decisionMeta);
      }
    }, 450);
  },

  isAutoDecisionCurrent(seq, eventId) {
    const currentEvent = State.getCurrentEvent();
    return (
      seq === this.autoDecisionSeq &&
      Router.currentPage === 'simulation' &&
      State.eventPhase === 'choosing' &&
      currentEvent &&
      currentEvent.id === eventId
    );
  },

  isReferenceDecisionCurrent(seq, eventId) {
    const currentEvent = State.getCurrentEvent();
    return (
      seq === this.referenceDecisionSeq &&
      Router.currentPage === 'simulation' &&
      State.eventPhase === 'choosing' &&
      currentEvent &&
      currentEvent.id === eventId
    );
  },

  async streamReferenceDecisionPreview(decisionMeta, seq, eventId) {
    const thinkingEl = document.getElementById('ai-reference-thinking');
    const replyEl = document.getElementById('ai-reference-reply');
    const panelEl = document.getElementById('ai-reference-panel');

    if (!thinkingEl || !replyEl || !this.isReferenceDecisionCurrent(seq, eventId)) return;

    if (panelEl) panelEl.classList.add('streaming');
    await this.typeText(thinkingEl, decisionMeta.thinking, seq, eventId, 14, 'reference');
    if (!this.isReferenceDecisionCurrent(seq, eventId)) return;
    await new Promise(resolve => setTimeout(resolve, 100));
    await this.typeText(replyEl, decisionMeta.reply, seq, eventId, 16, 'reference');
    if (panelEl) panelEl.classList.remove('streaming');
    if (panelEl) panelEl.classList.add('ready');
  },

  async streamAutoDecisionPreview(decisionMeta, seq, eventId) {
    const thinkingEl = document.getElementById('auto-thinking-text');
    const replyEl = document.getElementById('auto-reply-text');
    const progressEl = document.querySelector('.auto-progress');
    const textEl = document.querySelector('.auto-progress-text');

    if (!thinkingEl || !replyEl || !this.isAutoDecisionCurrent(seq, eventId)) return;

    if (progressEl) progressEl.classList.add('streaming');
    if (textEl) textEl.textContent = 'AI 正在写下判断...';

    await this.typeText(thinkingEl, decisionMeta.thinking, seq, eventId, 16);
    if (!this.isAutoDecisionCurrent(seq, eventId)) return;
    await new Promise(resolve => setTimeout(resolve, 120));
    await this.typeText(replyEl, decisionMeta.reply, seq, eventId, 18);

    if (textEl) textEl.textContent = 'AI 已做出选择，即将落子...';
    if (progressEl) progressEl.classList.remove('streaming');
    if (progressEl) progressEl.classList.add('ready');
  },

  async typeText(el, text, seq, eventId, speed = 18, scope = 'auto') {
    el.textContent = '';
    el.classList.add('typing');

    for (let i = 0; i < text.length; i++) {
      const isCurrent = scope === 'reference'
        ? this.isReferenceDecisionCurrent(seq, eventId)
        : this.isAutoDecisionCurrent(seq, eventId);
      if (!isCurrent) {
        el.classList.remove('typing');
        return;
      }
      el.textContent += text[i];
      const char = text[i];
      const delay = /[。！？；]/.test(char) ? speed * 8 : /[，、：]/.test(char) ? speed * 4 : speed;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    el.classList.remove('typing');
  },

  handleDecision(optionId, isUserDecision, aiMeta = null) {
    const decision = State.makeDecision(optionId, isUserDecision);
    if (!decision) return;

    if (aiMeta) {
      decision.ai = {
        thinking: aiMeta.thinking,
        reply: aiMeta.reply,
        source: aiMeta.source
      };
    }

    // 动画显示属性变化
    this.animateAttrChange(decision.attributesBefore, decision.attributesAfter, decision.impact);

    // 渲染结果
    setTimeout(() => {
      this.renderEventResult(State.getCurrentEvent());

      // 自动模式：显示结果 2.5 秒后自动推进
      if (State.character.mode === 'auto') {
        setTimeout(() => {
          if (State.eventPhase === 'result' && Router.currentPage === 'simulation') {
            document.getElementById('btn-sim-next').click();
          }
        }, 2500);
      }
    }, 300);
  },

  animateAttrChange(before, after, impact) {
    for (let key in after) {
      const el = document.getElementById('attr-' + key);
      const deltaEl = document.getElementById('attr-delta-' + key);
      if (!el) continue;

      const delta = after[key] - before[key];
      el.textContent = after[key];

      if (delta > 0) {
        el.classList.add('up');
        deltaEl.textContent = `+${delta}`;
        deltaEl.classList.add('up', 'show');
      } else if (delta < 0) {
        el.classList.add('down');
        deltaEl.textContent = `${delta}`;
        deltaEl.classList.add('down', 'show');
      }

      setTimeout(() => {
        el.classList.remove('up', 'down');
        deltaEl.classList.remove('show');
      }, 1500);
    }
  },

  renderEventResult(event) {
    const container = document.getElementById('sim-event');
    const decision = State.decisions[State.currentEventIndex];
    if (!decision) return;

    const age = State.getCurrentAge();
    const stage = Engine.getLifeStage(event.life_stage);
    const option = Engine.getOption(event.id, decision.optionId);
    const insight = Engine.getInsight(event.id, decision.optionId);
    const impact = decision.impact;

    let html = `
      <div class="event-stage">${stage ? stage.name : ''}</div>
      <div class="event-age">${age} 岁</div>
      <div class="event-title">${event.title}</div>
    `;

    // 显示选择
    html += `<div class="decision-result">
      <div class="event-options">
        <button class="event-option selected disabled">
          <span class="option-letter">${decision.optionId}</span>
          <div class="option-text">
            <div class="option-label">${option?.label || ''}</div>
            <div class="option-desc">${option?.description || ''}</div>
          </div>
        </button>
      </div>`;

    if (!decision.isUserDecision && decision.ai) {
      const summaryTitle = State.character.mode === 'mixed' ? '混合模式 · AI 自动选择' : 'AI 自动选择';
      html += `<div class="auto-decision-summary">
        <div class="auto-summary-title">${this.icon('auto', 'attr-mini')} ${summaryTitle}</div>
        <div class="auto-summary-block">
          <div class="auto-thought-label">${decision.ai.source === 'api' ? '模型思考' : 'AI 思考摘要'}</div>
          <div class="auto-thinking-text">${decision.ai.thinking}</div>
        </div>
        <div class="auto-summary-block">
          <div class="auto-thought-label">AI 回复</div>
          <div class="auto-reply-text">${decision.ai.reply}</div>
        </div>
      </div>`;
    }

    // 属性影响
    if (impact && Object.keys(impact).length > 0) {
      html += `<div class="result-impact">`;
      for (let key in impact) {
        const def = IF_LIFE_DATA.ATTRIBUTES[key];
        const val = impact[key];
        const cls = val > 0 ? 'positive' : val < 0 ? 'negative' : 'neutral';
        const sign = val > 0 ? '+' : '';
        html += `<div class="impact-item">
          <div class="impact-label">${this.icon(key, 'attr-mini')} ${def.label}</div>
          <div class="impact-value ${cls}">${sign}${val}</div>
        </div>`;
      }
      html += `</div>`;
    }

    // 洞察句
    if (insight) {
      html += `<div class="result-insight">${insight}</div>`;
    }

    html += `</div>`;

    container.innerHTML = html;

    // 显示继续按钮
    const isLast = State.currentEventIndex >= State.selectedEvents.length - 1;
    const nextBtn = document.getElementById('btn-sim-next');
    nextBtn.style.display = 'block';
    nextBtn.innerHTML = isLast ? '查看人生轨迹 →' : '继续 →';

    // 隐藏回看按钮（第一个事件时）
    document.getElementById('btn-sim-prev').style.visibility = State.currentEventIndex > 0 ? 'visible' : 'hidden';
  },

  // ========================================
  // 人生轨迹页 Timeline
  // ========================================
  bindTimeline() {
    document.getElementById('btn-timeline-portrait').addEventListener('click', () => {
      Router.goTo('portrait');
    });
    document.getElementById('btn-timeline-lab').addEventListener('click', () => {
      Router.goTo('lab');
    });
  },

  renderTimeline() {
    const subtitle = document.getElementById('timeline-subtitle');
    if (State.character.name) {
      subtitle.textContent = `${State.character.name} · 从 23 岁到 58 岁，十个十字路口`;
    }

    this.renderTimelineThread();
    this.renderTimelineCharts();

    // 显示/隐藏对比实验室按钮
    const labBtn = document.getElementById('btn-timeline-lab');
    if (State.parallelLives.length > 0) {
      labBtn.style.display = 'inline-block';
      labBtn.textContent = `查看对比实验室（${State.parallelLives.length} 条平行人生）`;
    } else {
      labBtn.style.display = 'none';
    }
  },

  renderTimelineThread() {
    const container = document.getElementById('timeline-thread');
    const decisions = State.decisions;
    let html = '';

    for (let i = 0; i < State.selectedEvents.length; i++) {
      const eventId = State.selectedEvents[i];
      const event = Engine.getEvent(eventId);
      const age = IF_LIFE_DATA.EVENT_AGES[eventId];
      const isKey = State.isKeyEvent(eventId);
      const isBranched = State.isBranched(eventId);
      const decision = decisions[i];

      // 节点
      html += `<div class="timeline-node ${isKey ? 'key' : ''} ${isBranched ? 'branched' : ''}" data-event-index="${i}" data-event-id="${eventId}">`;
      if (isKey) {
        html += `<div class="timeline-node-dot" title="${event.title}">${this.icon('seal', 'seal-icon')}${isBranched ? '<span class="branched-mark">' + this.icon('spark', 'seal-icon') + '</span>' : ''}</div>`;
      } else {
        html += `<div class="timeline-node-dot"></div>`;
      }
      html += `<div class="timeline-node-label">${age}岁</div>`;
      html += `</div>`;

      // 连接线
      if (i < State.selectedEvents.length - 1) {
        html += `<div class="timeline-connector"></div>`;
      }
    }

    container.innerHTML = html;

    // 绑定关键节点点击
    container.querySelectorAll('.timeline-node.key').forEach(node => {
      node.addEventListener('click', () => {
        const eventId = node.dataset.eventId;
        this.openBranchModal(eventId);
      });
    });
  },

  renderTimelineCharts() {
    const container = document.getElementById('timeline-charts');
    const decisions = State.decisions;
    const history = State.getAttributeHistory(decisions);
    const ages = State.selectedEvents.map(id => IF_LIFE_DATA.EVENT_AGES[id]);

    let html = '';
    for (let key in IF_LIFE_DATA.ATTRIBUTES) {
      const def = IF_LIFE_DATA.ATTRIBUTES[key];
      html += `<div class="chart-card">
        <div class="chart-card-header">
          <div class="chart-title">${this.icon(key, 'attr-mini')} ${def.label}曲线</div>
          <div class="chart-subtitle">从 23 岁到 58 岁的变化</div>
        </div>
        <div class="chart-canvas-wrap"><canvas id="chart-${key}"></canvas></div>
      </div>`;
    }
    container.innerHTML = html;

    // 绘制图表
    for (let key in IF_LIFE_DATA.ATTRIBUTES) {
      this.drawChart(key, ages, history[key], IF_LIFE_DATA.ATTRIBUTES[key].color);
    }
  },

  drawChart(attrKey, labels, data, color) {
    const canvas = document.getElementById('chart-' + attrKey);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['起点', ...labels.map(a => a + '岁')],
        datasets: [{
          label: IF_LIFE_DATA.ATTRIBUTES[attrKey].label,
          data: data,
          borderColor: color,
          backgroundColor: color + '20',
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: color,
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 1.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#3D2E1F',
            titleColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
            cornerRadius: 4,
            displayColors: false
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(139,115,85,0.15)' },
            ticks: { color: '#8B7355', font: { size: 10, family: 'Georgia' } }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#8B7355', font: { size: 10, family: 'Georgia' }, maxRotation: 0 }
          }
        }
      }
    });
  },

  // ========================================
  // 回溯弹窗 Branch Modal
  // ========================================
  openBranchModal(eventId) {
    const modal = document.getElementById('branch-modal');
    const content = document.getElementById('branch-modal-content');
    const event = Engine.getEvent(eventId);
    const originalDecision = State.originalLife.decisions.find(d => d.eventId === eventId);
    const originalOption = originalDecision ? originalDecision.optionId : null;
    const keyEventInfo = IF_LIFE_DATA.keyEvents.find(ke => ke.id === eventId);

    let html = `
      <button class="modal-close" onclick="document.getElementById('branch-modal').style.display='none'">×</button>
      <div class="branch-modal-title">${this.icon('seal', 'title-icon')} 回溯：${event.title}</div>
      <div class="branch-modal-context">${keyEventInfo?.reason || '这个节点改变了你的人生方向'}</div>
      <div class="branch-current-choice">
        你当时选了 <strong>${originalOption}</strong>（${Engine.getOption(eventId, originalOption)?.label || ''}）
      </div>
      <div class="setup-label">如果当时选了...</div>
      <div class="branch-option-list">
    `;

    for (let opt of event.options) {
      const isCurrent = opt.id === originalOption;
      html += `<button class="branch-option ${isCurrent ? 'current' : ''}" data-option="${opt.id}" ${isCurrent ? 'disabled' : ''}>
        <span class="option-letter" style="border-color:var(--indigo);color:var(--indigo)">${opt.id}</span>
        <div class="option-text">
          <div class="option-label">${opt.label}</div>
          <div class="option-desc">${opt.description}</div>
        </div>
      </button>`;
    }

    html += `</div>`;
    content.innerHTML = html;
    modal.style.display = 'flex';

    // 绑定选择
    content.querySelectorAll('.branch-option:not(.current)').forEach(btn => {
      btn.addEventListener('click', () => {
        const newOption = btn.dataset.option;
        modal.style.display = 'none';
        this.handleBranch(eventId, newOption);
      });
    });
  },

  handleBranch(eventId, newOptionId) {
    State.createParallelLife(eventId, newOptionId);
    // 回到时间线，标记已回溯节点，可继续探索其他节点
    this.renderTimeline();
    // 显示提示
    this.showToast(`已创建平行人生 · 共 ${State.parallelLives.length} 条`);
  },

  // ===== 轻量提示 toast =====
  showToast(text, duration = 2200) {
    let toast = document.getElementById('iflife-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'iflife-toast';
      toast.className = 'iflife-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
  },

  // ========================================
  // 平行人生对比页 Parallel
  // ========================================
  bindParallel() {
    document.getElementById('btn-parallel-back').addEventListener('click', () => {
      State.viewingParallelId = null;
      Router.goTo('lab');
    });
    document.getElementById('btn-parallel-portrait').addEventListener('click', () => {
      State.viewingParallelId = null;
      Router.goTo('portrait');
    });
  },

  renderParallel() {
    // 按 viewingParallelId 查找，否则取最新一条
    const latest = State.viewingParallelId
      ? State.parallelLives.find(pl => pl.id === State.viewingParallelId)
      : State.latestParallelLife;
    if (!latest) {
      Router.goTo('timeline');
      return;
    }

    const originalDecisions = State.originalLife.decisions;
    const parallelDecisions = latest.decisions;
    const branch = {
      eventId: latest.branchEventId,
      originalOption: latest.originalOption,
      newOption: latest.newOption
    };

    // 更新副标题
    const branchEvent = Engine.getEvent(branch.eventId);
    const branchAge = IF_LIFE_DATA.EVENT_AGES[branch.eventId];
    document.getElementById('parallel-subtitle').textContent =
      `如果 ${branchAge} 岁的「${branchEvent.title}」选了另一条路`;

    // 渲染对比
    const container = document.getElementById('parallel-compare');
    const originalOption = Engine.getOption(branch.eventId, branch.originalOption);
    const newOption = Engine.getOption(branch.eventId, branch.newOption);

    // 对比表头
    let html = `<div class="compare-headers">
      <div class="compare-header original">
        <div class="compare-header-label">原 始 人 生</div>
        <div class="compare-header-choice">${branch.originalOption} · ${originalOption?.label || ''}</div>
      </div>
      <div class="compare-header parallel">
        <div class="compare-header-label">平 行 人 生</div>
        <div class="compare-header-choice">${branch.newOption} · ${newOption?.label || ''}</div>
      </div>
    </div>`;

    // 双时间线
    html += `<div class="compare-headers">
      <div class="compare-header original">
        <div class="timeline-thread" style="margin:0;">${this.renderMiniTimeline(originalDecisions, 'original')}</div>
      </div>
      <div class="compare-header parallel">
        <div class="timeline-thread" style="margin:0;">${this.renderMiniTimeline(parallelDecisions, 'parallel')}</div>
      </div>
    </div>`;

    // 双属性曲线
    const origHistory = this.getHistoryForDecisions(originalDecisions);
    const paraHistory = this.getHistoryForDecisions(parallelDecisions);
    const ages = State.selectedEvents.map(id => IF_LIFE_DATA.EVENT_AGES[id]);

    html += `<div class="compare-charts">`;
    for (let key in IF_LIFE_DATA.ATTRIBUTES) {
      const def = IF_LIFE_DATA.ATTRIBUTES[key];
      html += `<div class="chart-card">
        <div class="chart-card-header">
          <div class="chart-title">${this.icon(key, 'attr-mini')} ${def.label}</div>
        </div>
        <div class="chart-canvas-wrap"><canvas id="compare-${key}"></canvas></div>
      </div>`;
    }
    html += `</div>`;

    // 结局对比
    const outcomes = Engine.getParallelOutcome(originalDecisions, parallelDecisions);
    html += `<div class="compare-outcome">
      <div class="outcome-card original">
        <div class="outcome-label">原 始 结 局</div>
        <div class="outcome-text">${outcomes.originalOutcome}</div>
      </div>
      <div class="outcome-card parallel">
        <div class="outcome-label">平 行 结 局</div>
        <div class="outcome-text">${outcomes.parallelOutcome}</div>
      </div>
    </div>`;

    container.innerHTML = html;
    container.style.display = 'block';

    // 显示导航
    document.getElementById('parallel-nav').style.display = 'flex';

    // 绘制对比图表
    for (let key in IF_LIFE_DATA.ATTRIBUTES) {
      this.drawCompareChart(key, ages, origHistory[key], paraHistory[key]);
    }
  },

  renderMiniTimeline(decisions, type) {
    const branch = State.branchingPoint;
    let html = '';
    for (let i = 0; i < State.selectedEvents.length; i++) {
      const eventId = State.selectedEvents[i];
      const age = IF_LIFE_DATA.EVENT_AGES[eventId];
      const isKey = State.isKeyEvent(eventId);
      const isBranch = branch && eventId === branch.eventId;

      html += `<div class="timeline-node ${isKey ? 'key' : ''}" style="margin:0 2px;">`;
      if (isBranch) {
        html += `<div class="timeline-node-dot branch-dot" style="width:20px;height:20px;">${this.icon('spark', 'seal-icon')}</div>`;
      } else if (isKey) {
        html += `<div class="timeline-node-dot" style="width:20px;height:20px;">${this.icon('seal', 'seal-icon')}</div>`;
      } else {
        html += `<div class="timeline-node-dot" style="width:8px;height:8px;"></div>`;
      }
      html += `</div>`;

      if (i < State.selectedEvents.length - 1) {
        const branchIndex = State.selectedEvents.indexOf(branch?.eventId);
        const connectorClass = type === 'parallel' && branch && i >= branchIndex ? 'parallel' : '';
        html += `<div class="timeline-connector ${connectorClass}" style="min-width:12px;"></div>`;
      }
    }
    return html;
  },

  getHistoryForDecisions(decisions) {
    const history = { wealth: [], happiness: [], health: [], career: [] };
    const initial = State.originalLife ? { wealth: 50, happiness: 50, health: 50, career: 50 } : State.character.attributes;

    for (let key in history) {
      history[key].push(initial[key]);
    }
    for (let d of decisions) {
      for (let key in history) {
        history[key].push(d.attributesAfter[key]);
      }
    }
    return history;
  },

  drawCompareChart(attrKey, labels, origData, paraData) {
    const canvas = document.getElementById('compare-' + attrKey);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['起点', ...labels.map(a => a + '岁')],
        datasets: [
          {
            label: '原始',
            data: origData,
            borderColor: '#8B7355',
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 2,
            borderDash: [4, 3]
          },
          {
            label: '平行',
            data: paraData,
            borderColor: '#2C4A6B',
            backgroundColor: 'rgba(44,74,107,0.1)',
            borderWidth: 2.5,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: '#2C4A6B',
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { font: { size: 11, family: 'Noto Serif SC' }, color: '#3D2E1F', boxWidth: 12 }
          },
          tooltip: {
            backgroundColor: '#3D2E1F',
            titleColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
            cornerRadius: 4
          }
        },
        scales: {
          y: {
            min: 0, max: 100,
            grid: { color: 'rgba(139,115,85,0.15)' },
            ticks: { color: '#8B7355', font: { size: 9 } }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#8B7355', font: { size: 9 }, maxRotation: 0 }
          }
        }
      }
    });
  },

  // ========================================
  // 人生对比实验室 Lab
  // ========================================
  bindLab() {
    document.getElementById('btn-lab-back').addEventListener('click', () => {
      Router.goTo('timeline');
    });
    document.getElementById('btn-lab-portrait').addEventListener('click', () => {
      Router.goTo('portrait');
    });
  },

  renderLab() {
    const lives = State.getAllLives();
    const subtitle = document.getElementById('lab-subtitle');

    if (lives.length < 2) {
      subtitle.textContent = '回到时间线，点击关键节点创建平行人生';
      document.getElementById('lab-lives').innerHTML = `
        <div class="lab-empty">
          <div class="lab-empty-icon">${this.icon('seal', 'lab-empty-svg')}</div>
          <p>还没有创建平行人生。</p>
          <p>回到时间线，点击 ${this.icon('seal', 'hint-icon')} 关键节点来探索不同的选择。</p>
        </div>`;
      document.getElementById('lab-charts').innerHTML = '';
      document.getElementById('lab-outcomes').innerHTML = '';
      return;
    }

    subtitle.textContent = `${State.character.name || '你'} · ${lives.length} 种人生走向的叠加对比`;

    // 1. 人生概览卡片
    this.renderLabLives(lives);

    // 2. 叠加属性曲线
    this.renderLabCharts(lives);

    // 3. 结局对比表
    this.renderLabOutcomes(lives);
  },

  renderLabLives(lives) {
    const container = document.getElementById('lab-lives');
    let html = '<div class="lab-lives-row">';

    for (let life of lives) {
      const finalAttrs = life.decisions[life.decisions.length - 1]?.attributesAfter || {};
      const branchEvent = life.branchEventId ? Engine.getEvent(life.branchEventId) : null;
      const branchAge = life.branchEventId ? IF_LIFE_DATA.EVENT_AGES[life.branchEventId] : null;

      let branchText = '原始路径';
      if (branchEvent) {
        const origOpt = Engine.getOption(life.branchEventId, State.originalLife.decisions.find(d => d.eventId === life.branchEventId)?.optionId);
        const newOpt = Engine.getOption(life.branchEventId, life.decisions.find(d => d.eventId === life.branchEventId)?.optionId);
        branchText = `${branchAge}岁「${branchEvent.title}」<br><span class="lab-branch-detail">${origOpt?.label || ''} → ${newOpt?.label || ''}</span>`;
      }

      const clickable = life.id !== 'original' ? 'lab-life-clickable' : '';
      html += `<div class="lab-life-card ${clickable}" style="--life-color:${life.color}" ${life.id !== 'original' ? `data-life-id="${life.id}"` : ''}>
        <div class="lab-life-label">${life.label}</div>
        <div class="lab-life-branch">${branchText}</div>
        <div class="lab-life-attrs">
          ${Object.keys(finalAttrs).map(key => {
            const def = IF_LIFE_DATA.ATTRIBUTES[key];
            return `<div class="lab-life-attr">
              <span class="lab-life-attr-icon">${this.icon(key, 'attr-mini')}</span>
              <span class="lab-life-attr-val">${finalAttrs[key]}</span>
            </div>`;
          }).join('')}
        </div>
        ${life.id !== 'original' ? '<div class="lab-life-hint">点击查看详细对比 →</div>' : ''}
      </div>`;
    }

    html += '</div>';
    container.innerHTML = html;

    // 绑定平行人生卡片点击
    container.querySelectorAll('.lab-life-clickable').forEach(card => {
      card.addEventListener('click', () => {
        State.viewingParallelId = card.dataset.lifeId;
        Router.goTo('parallel');
      });
    });
  },

  renderLabCharts(lives) {
    const container = document.getElementById('lab-charts');
    const ages = State.selectedEvents.map(id => IF_LIFE_DATA.EVENT_AGES[id]);

    let html = '';
    for (let key in IF_LIFE_DATA.ATTRIBUTES) {
      const def = IF_LIFE_DATA.ATTRIBUTES[key];
      html += `<div class="chart-card">
        <div class="chart-card-header">
          <div class="chart-title">${this.icon(key, 'attr-mini')} ${def.label}曲线</div>
        </div>
        <div class="chart-canvas-wrap"><canvas id="lab-chart-${key}"></canvas></div>
      </div>`;
    }
    container.innerHTML = html;

    // 绘制叠加图表
    for (let key in IF_LIFE_DATA.ATTRIBUTES) {
      this.drawLabChart(key, ages, lives);
    }
  },

  drawLabChart(attrKey, labels, lives) {
    const canvas = document.getElementById('lab-chart-' + attrKey);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const datasets = lives.map(life => {
      const history = this.getHistoryForDecisions(life.decisions);
      return {
        label: life.label,
        data: history[attrKey],
        borderColor: life.color,
        backgroundColor: 'transparent',
        borderWidth: life.id === 'original' ? 1.5 : 2.5,
        borderDash: life.id === 'original' ? [4, 3] : [],
        tension: 0.35,
        pointRadius: life.id === 'original' ? 2 : 3,
        pointBackgroundColor: life.color,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1
      };
    });

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['起点', ...labels.map(a => a + '岁')],
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { font: { size: 11, family: 'Noto Serif SC' }, color: '#3D2E1F', boxWidth: 12 }
          },
          tooltip: {
            backgroundColor: '#3D2E1F',
            titleColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
            cornerRadius: 4
          }
        },
        scales: {
          y: {
            min: 0, max: 100,
            grid: { color: 'rgba(139,115,85,0.15)' },
            ticks: { color: '#8B7355', font: { size: 9 } }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#8B7355', font: { size: 9 }, maxRotation: 0 }
          }
        }
      }
    });
  },

  renderLabOutcomes(lives) {
    const container = document.getElementById('lab-outcomes');
    let html = '<div class="lab-outcome-table">';

    // 表头
    html += `<div class="lab-outcome-row lab-outcome-header">
      <div class="lab-outcome-cell lab-outcome-life">人生</div>
      <div class="lab-outcome-cell">分叉点</div>
      <div class="lab-outcome-cell">结局</div>
      <div class="lab-outcome-cell lab-outcome-attrs">最终属性</div>
    </div>`;

    for (let life of lives) {
      const outcome = Engine.getParallelOutcome(
        State.originalLife.decisions,
        life.decisions
      );
      const outcomeText = life.id === 'original' ? outcome.originalOutcome : outcome.parallelOutcome;

      const branchEvent = life.branchEventId ? Engine.getEvent(life.branchEventId) : null;
      const branchAge = life.branchEventId ? IF_LIFE_DATA.EVENT_AGES[life.branchEventId] : null;
      const branchText = branchEvent ? `${branchAge}岁 ${branchEvent.title}` : '—';

      const finalAttrs = life.decisions[life.decisions.length - 1]?.attributesAfter || {};

      html += `<div class="lab-outcome-row" style="--life-color:${life.color}">
        <div class="lab-outcome-cell lab-outcome-life">
          <span class="lab-life-dot" style="background:${life.color}"></span>
          ${life.label}
        </div>
        <div class="lab-outcome-cell lab-outcome-branch">${branchText}</div>
        <div class="lab-outcome-cell lab-outcome-text">${outcomeText}</div>
        <div class="lab-outcome-cell lab-outcome-attrs">
          ${Object.keys(finalAttrs).map(key => {
            const val = finalAttrs[key];
            return `<span class="lab-outcome-attr-val">${this.icon(key, 'attr-mini')} ${val}</span>`;
          }).join('')}
        </div>
      </div>`;
    }

    html += '</div>';

    // 总结洞察
    if (lives.length >= 3) {
      html += `<div class="lab-conclusion">
        <div class="lab-conclusion-text">
          ${lives.length - 1} 个不同的选择，造就了 ${lives.length} 种截然不同的人生。
          改变一个变量，人生会流向哪里——这就是 IF LIFE 的全部意义。
        </div>
      </div>`;
    }

    container.innerHTML = html;
  },

  // ========================================
  // 人生画像页 Portrait
  // ========================================
  bindPortrait() {
    document.getElementById('btn-portrait-restart').addEventListener('click', () => {
      State.reset();
      Router.goTo('landing');
    });

    document.getElementById('btn-portrait-ai').addEventListener('click', () => {
      this.openAIModal();
    });
  },

  renderPortrait() {
    const container = document.getElementById('portrait-content');
    const decisions = State.decisions;
    const portrait = Engine.generatePortrait(decisions);
    const name = State.character.name || '你';
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

    let html = `
      <div class="fate-card">
        <div class="fate-watermark">IF LIFE</div>
        <div class="fate-card-head">
          <div class="portrait-name">
            <span class="portrait-name-text">${name}</span>
            <span class="portrait-name-suffix"> 的一生</span>
          </div>

          <div class="portrait-label-section">
            <div class="portrait-label-tag">${portrait.label.title}</div>
          </div>
        </div>

        <div class="portrait-spectrum">
          <div class="spectrum-title">选择光谱</div>
          <div class="spectrum-bars">
    `;

    // 人格分布
    const personalityNames = { striver: '进取', guardian: '守护', speculator: '投机' };
    const total = decisions.length || 1;
    for (let p of ['striver', 'guardian', 'speculator']) {
      const count = portrait.counts[p];
      const percent = (count / total) * 100;
      html += `<div class="spectrum-bar">
        <div class="spectrum-bar-label">${personalityNames[p]}</div>
        <div class="spectrum-bar-track">
          <div class="spectrum-bar-fill ${p} ${count === 0 ? 'empty' : ''}" style="--spectrum-width:${percent}%;width:${percent}%"></div>
        </div>
        <div class="spectrum-bar-count">${count}次</div>
      </div>`;
    }

    html += `</div></div>`;

    // 关键转折分析
    html += `<div class="portrait-insights">`;
    for (let insight of portrait.insights) {
      html += `<div class="portrait-insight">
        <div class="insight-theme">关于${insight.theme}</div>
        <div class="insight-text">${insight.text}</div>
      </div>`;
    }
    html += `</div>`;

    // Slogan 印章
    html += `<div class="portrait-slogan">
      <div class="slogan-frame">
        <div class="slogan-text">${portrait.label.slogan}</div>
      </div>
    </div>
      <div class="fate-card-footer">
        <span>生成于 ${dateStr}</span>
        <span class="qr-placeholder">${this.icon('qr', 'qr-icon')}</span>
      </div>
    </div>`;

    container.innerHTML = html;
  },

  // ========================================
  // AI 事件生成弹窗
  // ========================================
  async openAIModal() {
    const modal = document.getElementById('ai-modal');
    const content = document.getElementById('ai-modal-content');

    // 显示加载中
    content.innerHTML = `
      <div class="ai-loading">
        <div class="ai-loading-spinner">${this.icon('dice', 'auto-icon')}</div>
        <div class="ai-loading-text">
          AI 正在为你的角色量身定制一个事件...<br>
          ${AI.isConfigured() ? '' : '<small style="color:var(--ink-light)">（未配置 API，使用本地模拟）</small>'}
        </div>
      </div>
    `;
    modal.style.display = 'flex';

    // 生成事件
    const event = await AI.generateEvent(State.character);

    // 渲染事件
    this.renderAIEvent(event);
  },

  renderAIEvent(event) {
    const content = document.getElementById('ai-modal-content');

    let html = `
      <button class="modal-close" onclick="document.getElementById('ai-modal').style.display='none'">×</button>
      <div class="event-stage">AI 现场生成</div>
      <div class="ai-event-title">${event.title}</div>
      <div class="ai-event-context">${event.context}</div>
      <div class="event-options" id="ai-event-options">
    `;

    for (let opt of event.options) {
      html += `<button class="event-option" data-option="${opt.id}">
        <span class="option-letter">${opt.id}</span>
        <div class="option-text">
          <div class="option-label">${opt.label}</div>
          <div class="option-desc">${opt.description}</div>
        </div>
      </button>`;
    }

    html += `</div>
      <div id="ai-event-result" style="display:none;"></div>
    `;

    content.innerHTML = html;

    // 绑定选项
    content.querySelectorAll('.event-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const optionId = btn.dataset.option;
        this.handleAIEventChoice(event, optionId, content);
      });
    });
  },

  handleAIEventChoice(event, optionId, container) {
    // 禁用所有选项
    container.querySelectorAll('.event-option').forEach(btn => {
      btn.classList.add('disabled');
      if (btn.dataset.option === optionId) {
        btn.classList.add('selected');
      }
    });

    // 计算影响
    const impact = event.impact?.[optionId] || {};
    const insight = event.insights?.[optionId] || '你做出了选择。';

    // 应用影响到角色属性
    for (let key in impact) {
      State.character.attributes[key] = Math.max(0, Math.min(100, State.character.attributes[key] + impact[key]));
    }

    // 显示结果
    const resultEl = container.querySelector('#ai-event-result');
    let html = '';

    if (Object.keys(impact).length > 0) {
      html += `<div class="result-impact">`;
      for (let key in impact) {
        const def = IF_LIFE_DATA.ATTRIBUTES[key];
        const val = impact[key];
        const cls = val > 0 ? 'positive' : val < 0 ? 'negative' : 'neutral';
        const sign = val > 0 ? '+' : '';
        html += `<div class="impact-item">
          <div class="impact-label">${this.icon(key, 'attr-mini')} ${def.label}</div>
          <div class="impact-value ${cls}">${sign}${val}</div>
        </div>`;
      }
      html += `</div>`;
    }

    html += `<div class="result-insight">${insight}</div>`;
    html += `<div style="text-align:center;margin-top:24px;">
      <button class="btn-ghost" onclick="document.getElementById('ai-modal').style.display='none'">关闭</button>
    </div>`;

    resultEl.innerHTML = html;
    resultEl.style.display = 'block';
  },

  // ========================================
  // API 配置
  // ========================================
  bindAPISettings() {
    const settingsBtn = document.getElementById('btn-api-settings');
    const modal = document.getElementById('api-modal');
    const saveBtn = document.getElementById('btn-api-save');
    const fetchModelsBtn = document.getElementById('btn-api-fetch-models');

    settingsBtn.addEventListener('click', () => {
      // 加载已保存的配置
      document.getElementById('api-base-url').value = AI.config.baseURL || '';
      document.getElementById('api-key').value = AI.config.apiKey || '';
      document.getElementById('api-model').value = AI.config.model || '';

      // 更新状态提示
      const status = document.getElementById('api-config-status');
      if (AI.isConfigured()) {
        status.textContent = '✓ 已配置（' + AI.config.model + '）';
        status.classList.add('configured');
      } else {
        status.textContent = '未配置，将使用本地模拟事件';
        status.classList.remove('configured');
      }

      modal.style.display = 'flex';
    });

    fetchModelsBtn.addEventListener('click', async () => {
      const baseURL = document.getElementById('api-base-url').value.trim();
      const apiKey = document.getElementById('api-key').value.trim();
      const modelInput = document.getElementById('api-model');
      const modelList = document.getElementById('api-model-list');
      const status = document.getElementById('api-config-status');

      if (!AI.hasConnectionConfig(apiKey, baseURL)) {
        status.textContent = '请先填写 API Base URL 和 API Key';
        status.classList.remove('configured');
        return;
      }

      fetchModelsBtn.disabled = true;
      fetchModelsBtn.innerHTML = `${this.icon('auto', 'btn-icon')}获取中...`;
      status.textContent = '正在获取模型列表...';
      status.classList.remove('configured');

      try {
        const models = await AI.fetchModels(apiKey, baseURL);
        modelList.innerHTML = '';
        for (let model of models) {
          const option = document.createElement('option');
          option.value = model;
          modelList.appendChild(option);
        }
        if (!modelInput.value.trim()) {
          modelInput.value = models[0];
        }
        status.textContent = `✓ 已获取 ${models.length} 个模型，可在模型名称中选择`;
        status.classList.add('configured');
      } catch (error) {
        status.textContent = '获取模型失败：' + error.message;
        status.classList.remove('configured');
      } finally {
        fetchModelsBtn.disabled = false;
        fetchModelsBtn.innerHTML = `${this.icon('auto', 'btn-icon')}获取模型`;
      }
    });

    saveBtn.addEventListener('click', () => {
      const baseURL = document.getElementById('api-base-url').value.trim();
      const apiKey = document.getElementById('api-key').value.trim();
      const model = document.getElementById('api-model').value.trim();

      AI.configure(apiKey, baseURL, model);

      const status = document.getElementById('api-config-status');
      if (AI.isConfigured()) {
        status.textContent = '✓ 已保存（' + model + '）';
        status.classList.add('configured');
        setTimeout(() => {
          modal.style.display = 'none';
        }, 800);
      } else {
        status.textContent = '请填写所有字段';
        status.classList.remove('configured');
      }
    });
  },

  // ========================================
  // 键盘导航
  // ========================================
  bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (Router.currentPage !== 'simulation') return;
      if (State.eventPhase !== 'result') return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        document.getElementById('btn-sim-next').click();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (State.currentEventIndex > 0) {
          document.getElementById('btn-sim-prev').click();
        }
      }
    });
  }
};

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', () => {
  UI.init();
});
