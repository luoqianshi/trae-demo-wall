/**
 * 银发反诈守护人 - UI渲染模块（增强版）
 * 处理对话气泡、场景过渡、界面渲染
 * 新增：打字机效果、进度条、情绪指示器、成就系统、科普贴士、统计仪表盘、教程引导、装饰增强、音效模拟
 */

const UIRenderer = {
  typingSpeed: 40,
  isTyping: false,
  typingQueue: [],
  tipInsertCounter: 0,
  _pendingAchievements: [],

  // ==================== 图标SVG映射 ====================
  icons: {
    pill: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 20.5L3.5 13.5"/><path d="M15.5 4.5l6 6"/><path d="M3.5 13.5l7-7"/><path d="M20.5 10.5l-7-7"/><rect x="2" y="2" width="20" height="20" rx="5"/></svg>`,
    chart: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    shield: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    gift: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
    alert: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    check: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    star: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    warning: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    book: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    home: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    download: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    reset: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`,
    font: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
    play: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    phone: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    info: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    menu: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    'arrow-left': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
    'chevron-right': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
    x: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    user: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    users: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    // 新增图标
    trophy: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C6 4 6 9 6 9z"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C18 4 18 9 18 9z"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
    crown: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M2 17h20"/><path d="M9 21h6"/></svg>`,
    'book-open': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    'shield-check': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
    zap: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    lightbulb: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>`,
    award: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
    'bar-chart': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>`,
    sparkles: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
    collection: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><rect x="6" y="6" width="12" height="12" rx="1"/></svg>`,
    telescope: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-6-6m0 0 3-3m-3 3-3 3"/><path d="M3.27 9.73a2.5 2.5 0 0 1 3.54-3.54l9.19 9.19a2.5 2.5 0 0 1-3.54 3.54l-9.19-9.19Z"/><path d="M10.5 3.5 9 5"/><path d="M12 2v2"/><path d="M14.5 3.5 15 5"/></svg>`,
    smile: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
    'arrow-right': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`
  },

  getIcon(name) {
    return this.icons[name] || this.icons.info;
  },

  // ==================== 打字机效果 ====================
  /**
   * 在指定元素中逐字显示文本
   * @param {HTMLElement} element - 目标元素
   * @param {string} text - 要显示的文本
   * @param {Function} callback - 打字完成后的回调
   */
  typeText(element, text, callback) {
    if (!element || !text) {
      if (callback) callback();
      return;
    }

    this.isTyping = true;
    let index = 0;
    element.textContent = '';

    // 禁用选项按钮（保留"继续"和"查看结局"按钮始终可点击）
    const choicesArea = document.getElementById('choicesArea');
    if (choicesArea) {
      choicesArea.classList.add('typing-disabled');
      const buttons = choicesArea.querySelectorAll('.choice-btn');
      buttons.forEach(btn => { btn.disabled = true; });
    }

    const timer = setInterval(() => {
      if (index < text.length) {
        element.textContent += text[index];
        index++;
        this.scrollToBottom();
      } else {
        clearInterval(timer);
        this.isTyping = false;

        // 启用选择按钮
        if (choicesArea) {
          choicesArea.classList.remove('typing-disabled');
          const buttons = choicesArea.querySelectorAll('.choice-btn');
          buttons.forEach(btn => { btn.disabled = false; });
        }

        if (callback) callback();
      }
    }, this.typingSpeed);
  },

  // ==================== 主菜单渲染 ====================
  renderMainMenu() {
    const app = document.getElementById('app');
    const hasSave = GameEngine.hasSaveData();
    const stats = Storage.getStats();
    const completedScenarios = Storage.getCompletedScenarios();
    const encyclopediaProgress = Storage.getEncyclopediaProgress();
    const unlockedAchievements = Storage.getUnlockedAchievements();
    const allScenarioIds = Object.keys(SCENARIOS);
    const mainScenarios = allScenarioIds.filter(id => id !== 'tutorial');
    const tutorialCompleted = completedScenarios.includes('tutorial');

    app.innerHTML = `
      <div class="page-container">
        <header class="main-header">
          <div class="header-content">
            <div class="logo-area">
              <div class="logo-icon">
                ${this.icons.shield}
              </div>
              <h1 class="logo-title">银发反诈守护人</h1>
            </div>
            <p class="header-subtitle">互动叙事游戏 · 提升防骗意识</p>
          </div>
          <div class="header-stats">
            <div class="stat-item">
              <span class="stat-value">${completedScenarios.length}</span>
              <span class="stat-label">已通关</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${encyclopediaProgress.length}</span>
              <span class="stat-label">图鉴收集</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${stats.totalPlays}</span>
              <span class="stat-label">总游戏次数</span>
            </div>
          </div>
        </header>

        <main class="main-content">
          ${hasSave ? `
            <div class="continue-card" onclick="UIRenderer.continueGame()">
              <div class="continue-icon">${this.icons.play}</div>
              <div class="continue-text">
                <h3>继续上次游戏</h3>
                <p>你有未完成的游戏进度，点击继续</p>
              </div>
              ${this.icons['chevron-right']}
            </div>
          ` : ''}

          ${!tutorialCompleted ? `
            <div class="tutorial-entry-card" onclick="UIRenderer.startScenario('tutorial')">
              <div class="tutorial-entry-icon">${this.icons.telescope}</div>
              <div class="tutorial-entry-content">
                <h3>新手引导</h3>
                <p>第一次玩？花1分钟了解游戏玩法，快速上手</p>
              </div>
              <div class="tutorial-entry-badge">推荐</div>
              ${this.icons['chevron-right']}
            </div>
          ` : ''}

          <section class="scenarios-section">
            <h2 class="section-title">选择诈骗场景</h2>
            <p class="section-desc">选择一个场景，开始你的反诈守护之旅</p>
            <div class="scenarios-grid">
              ${mainScenarios.map((scenarioId, index) => {
                const scenario = SCENARIOS[scenarioId];
                const status = GameEngine.getScenarioStatus(scenarioId);
                return `
                  <div class="scenario-card ${status.completed ? 'completed' : ''}" onclick="UIRenderer.startScenario('${scenarioId}')">
                    <div class="scenario-card-header">
                      <span class="scenario-category">${scenario.category}</span>
                      <span class="scenario-number">#${index + 1}</span>
                      ${status.completed ? '<span class="scenario-badge completed-badge">已完成</span>' : ''}
                    </div>
                    <div class="scenario-icon">${this.icons[scenario.icon] || this.icons.info}</div>
                    <h3 class="scenario-title">${scenario.title}</h3>
                    <p class="scenario-desc">${scenario.description}</p>
                    <div class="scenario-tags">
                      ${scenario.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </section>

          ${this.renderAchievementsSection()}

          <section class="encyclopedia-section">
            <div class="section-header-row">
              <div>
                <h2 class="section-title">反诈科普图鉴</h2>
                <p class="section-desc">已解锁 ${encyclopediaProgress.length}/${Object.keys(ENCYCLOPEDIA).length} 个图鉴</p>
              </div>
              <div class="encyclopedia-progress-overview">
                <div class="progress-ring-container">
                  <svg class="progress-ring" viewBox="0 0 60 60">
                    <circle class="progress-ring-bg" cx="30" cy="30" r="26" fill="none" stroke="var(--color-primary-border)" stroke-width="5"/>
                    <circle class="progress-ring-fill" cx="30" cy="30" r="26" fill="none" stroke="var(--color-primary)" stroke-width="5"
                      stroke-dasharray="${2 * Math.PI * 26}"
                      stroke-dashoffset="${2 * Math.PI * 26 * (1 - encyclopediaProgress.length / Object.keys(ENCYCLOPEDIA).length)}"
                      stroke-linecap="round" transform="rotate(-90 30 30)"/>
                  </svg>
                  <span class="progress-ring-text">${Math.round(encyclopediaProgress.length / Object.keys(ENCYCLOPEDIA).length * 100)}%</span>
                </div>
              </div>
            </div>
            <div class="encyclopedia-grid">
              ${Object.values(ENCYCLOPEDIA).map(entry => {
                const unlocked = encyclopediaProgress.includes(entry.id);
                return `
                  <div class="encyclopedia-card ${unlocked ? 'unlocked' : 'locked'}" ${unlocked ? `onclick="UIRenderer.showEncyclopediaDetail('${entry.id}')"` : ''}>
                    <div class="encyclopedia-icon">${this.icons[entry.icon] || this.icons.book}</div>
                    <h4>${entry.title}</h4>
                    ${unlocked
                      ? '<span class="unlocked-badge">已解锁</span>'
                      : '<span class="locked-badge">未解锁</span>'
                    }
                    <div class="encyclopedia-progress-bar">
                      <div class="encyclopedia-progress-fill" style="width:${unlocked ? '100%' : '0%'}"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </section>
        </main>

        <footer class="main-footer">
          <div class="footer-actions">
            <button class="btn btn-outline" onclick="UIRenderer.renderStatsDashboard()">
              ${this.icons['bar-chart']} 数据统计
            </button>
            <button class="btn btn-outline" onclick="UIRenderer.exportCard()">
              ${this.icons.download} 导出提醒卡
            </button>
            <button class="btn btn-ghost" onclick="UIRenderer.confirmReset()">
              ${this.icons.reset} 重置数据
            </button>
          </div>
          <p class="footer-text">反诈专线：96110 · 报警电话：110</p>
        </footer>
      </div>
    `;
  },

  // ==================== 成就系统UI ====================
  /**
   * 渲染成就区域
   */
  renderAchievementsSection() {
    const unlockedAchievements = Storage.getUnlockedAchievements();
    const allAchievements = Object.values(ACHIEVEMENTS);
    const unlockedCount = unlockedAchievements.length;
    const totalCount = allAchievements.length;

    return `
      <section class="achievements-section">
        <div class="section-header-row">
          <div>
            <h2 class="section-title">${this.icons.award} 成就</h2>
            <p class="section-desc">已解锁 ${unlockedCount}/${totalCount} 个成就</p>
          </div>
        </div>
        <div class="achievements-grid">
          ${allAchievements.map(ach => {
            const unlocked = unlockedAchievements.includes(ach.id);
            const iconName = ach.icon || 'star';
            return `
              <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon" style="background:${unlocked ? ach.color || 'var(--color-primary)' : 'var(--color-bg)'};color:${unlocked ? '#fff' : 'var(--color-text-muted)'}">
                  ${this.icons[iconName] || this.icons.star}
                </div>
                <div class="achievement-info">
                  <h4>${ach.title}</h4>
                  <p>${ach.description}</p>
                </div>
                ${unlocked ? '<span class="achievement-check">' + this.icons.check + '</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;
  },

  /**
   * 显示成就解锁弹出通知
   * @param {Object} achievement - 成就对象
   */
  showAchievementPopup(achievement) {
    if (!achievement) return;

    const iconName = achievement.icon || 'star';
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `
      <div class="achievement-popup-icon" style="background:${achievement.color || 'var(--color-primary)'}">
        ${this.icons[iconName] || this.icons.star}
      </div>
      <div class="achievement-popup-content">
        <span class="achievement-popup-label">成就解锁！</span>
        <span class="achievement-popup-title">${achievement.title}</span>
        <span class="achievement-popup-desc">${achievement.description}</span>
      </div>
    `;
    document.body.appendChild(popup);

    // 触发脉冲动画
    setTimeout(() => {
      popup.classList.add('show');
    }, 100);

    // 自动消失
    setTimeout(() => {
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 500);
    }, 4000);
  },

  // ==================== 统计仪表盘 ====================
  /**
   * 渲染统计仪表盘页面
   */
  renderStatsDashboard() {
    const app = document.getElementById('app');
    const stats = Storage.getStats();
    const completedScenarios = Storage.getCompletedScenarios();
    const encyclopediaProgress = Storage.getEncyclopediaProgress();
    const unlockedAchievements = Storage.getUnlockedAchievements();
    const unlockedEndings = Storage.getUnlockedEndings();
    const allScenarios = Object.keys(SCENARIOS).filter(id => id !== 'tutorial');
    const allEncyclopedia = Object.keys(ENCYCLOPEDIA);
    const allAchievements = Object.keys(ACHIEVEMENTS);

    const totalPlays = stats.totalPlays || 0;
    const successRate = totalPlays > 0 ? Math.round((stats.successCount / totalPlays) * 100) : 0;
    const reportRate = totalPlays > 0 ? Math.round((stats.reportCount / totalPlays) * 100) : 0;
    const lossRate = totalPlays > 0 ? Math.round((stats.lossCount / totalPlays) * 100) : 0;
    const partialRate = totalPlays > 0 ? Math.round((stats.partialCount / totalPlays) * 100) : 0;

    const scenarioProgress = Math.round((completedScenarios.length / allScenarios.length) * 100);
    const encyclopediaProgressPercent = Math.round((encyclopediaProgress.length / allEncyclopedia.length) * 100);
    const achievementProgress = Math.round((unlockedAchievements.length / allAchievements.length) * 100);

    app.innerHTML = `
      <div class="detail-screen">
        <header class="detail-header">
          <button class="btn btn-icon" onclick="UIRenderer.renderMainMenu()" aria-label="返回">
            ${this.icons['arrow-left']}
          </button>
          <h2>数据统计</h2>
        </header>
        <div class="stats-dashboard">
          <!-- 概览卡片 -->
          <div class="stats-overview-grid">
            <div class="stats-overview-card">
              <div class="stats-overview-value">${totalPlays}</div>
              <div class="stats-overview-label">总游戏次数</div>
            </div>
            <div class="stats-overview-card">
              <div class="stats-overview-value">${completedScenarios.length}</div>
              <div class="stats-overview-label">已通关场景</div>
            </div>
            <div class="stats-overview-card">
              <div class="stats-overview-value">${unlockedEndings.length}</div>
              <div class="stats-overview-label">已解锁结局</div>
            </div>
            <div class="stats-overview-card">
              <div class="stats-overview-value">${unlockedAchievements.length}</div>
              <div class="stats-overview-label">已解锁成就</div>
            </div>
          </div>

          <!-- 结局分布 -->
          <div class="stats-section">
            <h3 class="stats-section-title">结局类型分布</h3>
            <div class="stats-bars">
              <div class="stats-bar-item">
                <div class="stats-bar-label">
                  <span class="stats-bar-dot" style="background:#16A34A"></span>
                  <span>成功止损</span>
                  <span class="stats-bar-count">${stats.successCount}</span>
                </div>
                <div class="stats-bar-track">
                  <div class="stats-bar-fill" style="width:${successRate}%;background:linear-gradient(90deg,#22C55E,#16A34A)"></div>
                </div>
              </div>
              <div class="stats-bar-item">
                <div class="stats-bar-label">
                  <span class="stats-bar-dot" style="background:#CA8A04"></span>
                  <span>主动举报</span>
                  <span class="stats-bar-count">${stats.reportCount}</span>
                </div>
                <div class="stats-bar-track">
                  <div class="stats-bar-fill" style="width:${reportRate}%;background:linear-gradient(90deg,#EAB308,#CA8A04)"></div>
                </div>
              </div>
              <div class="stats-bar-item">
                <div class="stats-bar-label">
                  <span class="stats-bar-dot" style="background:#EA580C"></span>
                  <span>部分成功</span>
                  <span class="stats-bar-count">${stats.partialCount}</span>
                </div>
                <div class="stats-bar-track">
                  <div class="stats-bar-fill" style="width:${partialRate}%;background:linear-gradient(90deg,#F97316,#EA580C)"></div>
                </div>
              </div>
              <div class="stats-bar-item">
                <div class="stats-bar-label">
                  <span class="stats-bar-dot" style="background:#DC2626"></span>
                  <span>被骗损失</span>
                  <span class="stats-bar-count">${stats.lossCount}</span>
                </div>
                <div class="stats-bar-track">
                  <div class="stats-bar-fill" style="width:${lossRate}%;background:linear-gradient(90deg,#EF4444,#DC2626)"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 进度环 -->
          <div class="stats-section">
            <h3 class="stats-section-title">完成进度</h3>
            <div class="stats-rings">
              <div class="stats-ring-item">
                <div class="progress-ring-container large">
                  <svg class="progress-ring" viewBox="0 0 60 60">
                    <circle class="progress-ring-bg" cx="30" cy="30" r="26" fill="none" stroke="var(--color-primary-border)" stroke-width="5"/>
                    <circle class="progress-ring-fill" cx="30" cy="30" r="26" fill="none" stroke="var(--color-primary)" stroke-width="5"
                      stroke-dasharray="${2 * Math.PI * 26}"
                      stroke-dashoffset="${2 * Math.PI * 26 * (1 - scenarioProgress / 100)}"
                      stroke-linecap="round" transform="rotate(-90 30 30)"/>
                  </svg>
                  <span class="progress-ring-text">${scenarioProgress}%</span>
                </div>
                <span class="stats-ring-label">场景进度</span>
              </div>
              <div class="stats-ring-item">
                <div class="progress-ring-container large">
                  <svg class="progress-ring" viewBox="0 0 60 60">
                    <circle class="progress-ring-bg" cx="30" cy="30" r="26" fill="none" stroke="var(--color-primary-border)" stroke-width="5"/>
                    <circle class="progress-ring-fill" cx="30" cy="30" r="26" fill="none" stroke="#CA8A04" stroke-width="5"
                      stroke-dasharray="${2 * Math.PI * 26}"
                      stroke-dashoffset="${2 * Math.PI * 26 * (1 - achievementProgress / 100)}"
                      stroke-linecap="round" transform="rotate(-90 30 30)"/>
                  </svg>
                  <span class="progress-ring-text">${achievementProgress}%</span>
                </div>
                <span class="stats-ring-label">成就进度</span>
              </div>
              <div class="stats-ring-item">
                <div class="progress-ring-container large">
                  <svg class="progress-ring" viewBox="0 0 60 60">
                    <circle class="progress-ring-bg" cx="30" cy="30" r="26" fill="none" stroke="var(--color-primary-border)" stroke-width="5"/>
                    <circle class="progress-ring-fill" cx="30" cy="30" r="26" fill="none" stroke="#16A34A" stroke-width="5"
                      stroke-dasharray="${2 * Math.PI * 26}"
                      stroke-dashoffset="${2 * Math.PI * 26 * (1 - encyclopediaProgressPercent / 100)}"
                      stroke-linecap="round" transform="rotate(-90 30 30)"/>
                  </svg>
                  <span class="progress-ring-text">${encyclopediaProgressPercent}%</span>
                </div>
                <span class="stats-ring-label">图鉴进度</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ==================== 场景与游戏流程 ====================
  startScenario(scenarioId) {
    this.tipInsertCounter = 0;
    const node = GameEngine.startScenario(scenarioId);
    if (node) {
      this.renderGameScreen();
    }
  },

  continueGame() {
    this.tipInsertCounter = 0;
    const node = GameEngine.continueGame();
    if (node) {
      this.renderGameScreen();
    }
  },

  // ==================== 游戏界面渲染 ====================
  renderGameScreen() {
    const app = document.getElementById('app');
    const scenario = GameEngine.getCurrentScenario();
    const node = GameEngine.getCurrentNode();
    const history = GameEngine.getHistory();
    const fontSize = Storage.getFontSize();
    const isTutorial = scenario.id === 'tutorial';
    const progress = GameEngine.getProgress();
    const emotion = GameEngine.getEmotion();

    // 科普贴士逻辑
    let tipHTML = '';
    const tipIndex = Math.floor(history.length / 3);
    if (tipIndex > this.tipInsertCounter && history.length > 0) {
      this.tipInsertCounter = tipIndex;
      const tip = GameEngine.getRandomTip();
      if (tip) {
        tipHTML = this.renderTipCard(tip);
      }
    }

    app.innerHTML = `
      <div class="game-container">
        <header class="game-header">
          <button class="btn btn-icon" onclick="UIRenderer.returnToMenu()" aria-label="返回主菜单">
            ${this.icons['arrow-left']}
          </button>
          <div class="game-scenario-info">
            <span class="game-scenario-title">${scenario.title}</span>
            <span class="game-scenario-category">${scenario.category}</span>
          </div>
          <div class="game-header-actions">
            <button class="btn btn-icon btn-font" onclick="UIRenderer.toggleFontSize()" aria-label="调整字号">
              ${this.icons.font}
            </button>
          </div>
          ${this.renderProgressBar(progress)}
        </header>

        ${isTutorial ? this.renderTutorialHints() : ''}

        <div class="game-chat-area" id="chatArea">
          ${history.map(msg => this.renderChatBubble(msg)).join('')}
          ${tipHTML}
          <div id="currentNode" class="chat-node-container">
            ${this.renderChatBubble({
              speaker: node.speaker,
              text: node.text,
              isPlayer: node.speaker === '玩家'
            }, emotion, true)}
          </div>
        </div>

        <div class="game-choices-area" id="choicesArea">
          ${node.choices ? this.renderChoices(node.choices) : this.renderContinueButton(node)}
        </div>
      </div>
    `;

    this.scrollToBottom();
    this.applyFontSize(fontSize);

    // 打字机效果：对当前节点的文本进行逐字显示
    const currentNode = document.getElementById('currentNode');
    if (currentNode) {
      const textEl = currentNode.querySelector('.chat-text');
      if (textEl && textEl.textContent) {
        const fullText = textEl.textContent;
        this.typeText(textEl, fullText);
      }
    }

    // 添加涟漪效果监听
    this._bindRippleEffect();
  },

  // ==================== 进度条 ====================
  /**
   * 渲染游戏进度条
   * @param {{ visited: number, total: number, percentage: number }} progress
   */
  renderProgressBar(progress) {
    if (!progress || progress.total === 0) return '';
    return `
      <div class="game-progress-bar">
        <div class="game-progress-track">
          <div class="game-progress-fill" style="width:${progress.percentage}%">
            <span class="game-progress-text">${progress.percentage}%</span>
          </div>
        </div>
      </div>
    `;
  },

  // ==================== 情绪指示器 ====================
  /**
   * 获取情绪对应的图标和颜色
   * @param {string} emotion
   * @returns {{ icon: string, color: string, label: string }|null}
   */
  getEmotionDisplay(emotion) {
    const map = {
      neutral: { icon: this.icons.info, color: '#3B82F6', label: '提示' },
      anxious: { icon: this.icons.alert, color: '#F59E0B', label: '紧张' },
      excited: { icon: this.icons.star, color: '#CA8A04', label: '兴奋' },
      shocked: { icon: this.icons.alert, color: '#DC2626', label: '震惊' },
      doubtful: { icon: this.icons.warning, color: '#EA580C', label: '犹豫' },
      confident: { icon: this.icons.check, color: '#16A34A', label: '自信' },
      normal: null
    };
    return map[emotion] || null;
  },

  // ==================== 对话气泡 ====================
  /**
   * 渲染对话气泡
   * @param {Object} msg - 消息对象
   * @param {string} emotion - 情绪状态（可选）
   * @param {boolean} isCurrent - 是否为当前节点（可选）
   */
  renderChatBubble(msg, emotion, isCurrent) {
    const isPlayer = msg.speaker === '玩家';
    const isSystem = msg.speaker === '系统提示';

    if (isSystem) {
      return `
        <div class="chat-system">
          <div class="chat-system-icon">${this.icons.info}</div>
          <div class="chat-system-text">${msg.text}</div>
        </div>
      `;
    }

    // 情绪指示器（仅NPC显示）
    const emotionDisplay = (!isPlayer && emotion) ? this.getEmotionDisplay(emotion) : null;
    const emotionHTML = emotionDisplay ? `
      <span class="emotion-indicator" style="color:${emotionDisplay.color}" title="${emotionDisplay.label}">
        ${emotionDisplay.icon}
      </span>
    ` : '';

    return `
      <div class="chat-bubble ${isPlayer ? 'player' : 'npc'}">
        <div class="chat-avatar">
          ${isPlayer ? this.icons.user : this.icons.users}
        </div>
        <div class="chat-content">
          <div class="chat-speaker">
            ${emotionHTML}
            ${msg.speaker}
          </div>
          <div class="chat-text">${isCurrent ? msg.text : msg.text}</div>
        </div>
      </div>
    `;
  },

  // ==================== 科普贴士卡片 ====================
  /**
   * 渲染科普贴士卡片
   * @param {string} tip - 贴士文本
   */
  renderTipCard(tip) {
    return `
      <div class="tip-card-chat">
        <div class="tip-card-icon">${this.icons.lightbulb}</div>
        <div class="tip-card-content">
          <span class="tip-card-label">反诈小贴士</span>
          <p class="tip-card-text">${tip}</p>
        </div>
      </div>
    `;
  },

  // ==================== 教程引导 ====================
  /**
   * 渲染教程引导提示
   */
  renderTutorialHints() {
    return `
      <div class="tutorial-hints-bar">
        <div class="tutorial-hint-item">
          <span class="tutorial-hint-icon">${this.icons.info}</span>
          <span class="tutorial-hint-text">阅读对话内容，了解游戏背景</span>
        </div>
        <div class="tutorial-hint-item">
          <span class="tutorial-hint-icon">${this.icons['chevron-right']}</span>
          <span class="tutorial-hint-text">点击选项做出选择</span>
        </div>
        <div class="tutorial-hint-item">
          <span class="tutorial-hint-icon">${this.icons.play}</span>
          <span class="tutorial-hint-text">点击"继续"推进剧情</span>
        </div>
      </div>
    `;
  },

  // ==================== 选项渲染 ====================
  renderChoices(choices) {
    return `
      <div class="choices-container">
        ${choices.map((choice, index) => `
          <button class="choice-btn" onclick="UIRenderer.handleChoice(${index})" data-index="${index}">
            <span class="choice-letter">${String.fromCharCode(65 + index)}</span>
            <span class="choice-text">${choice.text}</span>
            ${this.icons['chevron-right']}
          </button>
        `).join('')}
      </div>
    `;
  },

  renderContinueButton(node) {
    const ending = node.ending;
    if (ending) {
      return `
        <div class="continue-container">
          <button class="btn btn-primary btn-continue" onclick="UIRenderer.handleEnding('${ending}')">
            ${this.icons.play} 查看结局
          </button>
        </div>
      `;
    }
    return `
      <div class="continue-container">
        <button class="btn btn-primary btn-continue" onclick="UIRenderer.handleContinue()">
          ${this.icons.play} 继续
        </button>
      </div>
    `;
  },

  // ==================== 交互处理 ====================
  handleChoice(index) {
    if (this.isTyping) return;

    const nextNode = GameEngine.makeChoice(index);
    if (!nextNode) return;

    this.animateChoiceSelection(index);
  },

  handleContinue() {
    if (this.isTyping) return;

    const ending = GameEngine.checkEnding();
    if (ending) {
      this.handleEnding(ending);
      return;
    }

    const nextNode = GameEngine.autoContinue();
    if (nextNode) {
      this.renderGameScreen();
    }
  },

  handleEnding(endingId) {
    console.log('[handleEnding] 触发结局:', endingId);
    // 跳过打字期间的阻止（结局按钮始终可点击）
    this.isTyping = false;

    // 记录触发结局前的成就列表
    const before = [...Storage.getUnlockedAchievements()];
    const ending = GameEngine.triggerEnding(endingId);
    console.log('[handleEnding] triggerEnding 结果:', ending);
    if (!ending) {
      console.error('触发结局失败: endingId=', endingId, 'currentScenario=', GameEngine.getCurrentScenario());
      this.showToast('操作失败，请重试', 'error');
      return;
    }

    // 检测新解锁的成就
    const after = Storage.getUnlockedAchievements();
    const newAchievements = after.filter(id => !before.includes(id));

    try {
      this.showEndingScreen(ending);
    } catch (e) {
      console.error('[handleEnding] showEndingScreen 异常:', e);
      this.showToast('界面渲染失败，请刷新页面', 'error');
      return;
    }

    // 弹出新解锁的成就通知
    if (newAchievements.length > 0) {
      newAchievements.forEach((id, i) => {
        if (ACHIEVEMENTS[id]) {
          setTimeout(() => this.showAchievementPopup(ACHIEVEMENTS[id]), 800 + i * 400);
        }
      });
    }
  },

  // ==================== 结局画面 ====================
  showEndingScreen(ending) {
    console.log('[showEndingScreen] 渲染结局:', ending.title);
    const app = document.getElementById('app');
    const scenario = GameEngine.getCurrentScenario();

    if (!app) {
      console.error('[showEndingScreen] app 元素不存在');
      return;
    }

    app.innerHTML = `
      <div class="ending-screen" style="min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div class="ending-confetti" id="endingConfetti">
          <div class="confetti-piece c1"></div>
          <div class="confetti-piece c2"></div>
          <div class="confetti-piece c3"></div>
          <div class="confetti-piece c4"></div>
          <div class="confetti-piece c5"></div>
          <div class="confetti-piece c6"></div>
          <div class="confetti-piece c7"></div>
          <div class="confetti-piece c8"></div>
          <div class="confetti-piece c9"></div>
          <div class="confetti-piece c10"></div>
        </div>
        <div class="ending-icon" style="color: ${ending.color || '#0369A1'}">
          ${this.icons[ending.icon] || this.icons.info}
        </div>
        <h2 class="ending-title" style="color: ${ending.color || '#0369A1'}">${ending.title || '未知结局'}</h2>
        <p class="ending-message">${ending.message || ''}</p>
        <p class="ending-desc">${ending.description || ''}</p>

        ${scenario && scenario.realCase ? `
          <div class="real-case-card">
            <h3 class="real-case-title">${this.icons.alert} 真实案例警示</h3>
            <h4>${scenario.realCase.title}</h4>
            <p>${scenario.realCase.content}</p>
          </div>
        ` : ''}

        <div class="ending-actions">
          <button class="btn btn-primary" onclick="UIRenderer.returnToMenu()">
            ${this.icons.home} 返回主菜单
          </button>
          <button class="btn btn-outline" onclick="UIRenderer.replayScenario()">
            ${this.icons.reset} 重新挑战
          </button>
          <button class="btn btn-secondary" onclick="UIRenderer.exportCard()">
            ${this.icons.download} 导出提醒卡
          </button>
        </div>
      </div>
    `;

    console.log('[showEndingScreen] 渲染完成');
    this._bindRippleEffect();
  },

  replayScenario() {
    this.tipInsertCounter = 0;
    const scenario = GameEngine.getCurrentScenario();
    if (scenario) {
      this.startScenario(scenario.id);
    }
  },

  // ==================== 涟漪效果 ====================
  /**
   * 为按钮添加涟漪效果
   * @param {MouseEvent} event
   * @param {HTMLElement} element
   */
  addRippleEffect(event, element) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  },

  /**
   * 绑定涟漪效果到按钮
   */
  _bindRippleEffect() {
    setTimeout(() => {
      document.querySelectorAll('.btn, .choice-btn, .scenario-card, .encyclopedia-card.unlocked, .continue-card, .tutorial-entry-card, .achievement-card').forEach(el => {
        if (!el.dataset.rippleBound) {
          el.dataset.rippleBound = '1';
          el.addEventListener('click', (e) => this.addRippleEffect(e, el));
        }
      });
    }, 100);
  },

  // ==================== 选择动画 ====================
  animateChoiceSelection(index) {
    const buttons = document.querySelectorAll('.choice-btn');
    buttons.forEach((btn, i) => {
      if (i !== index) {
        btn.style.opacity = '0.3';
        btn.style.pointerEvents = 'none';
        btn.style.transform = 'scale(0.95)';
      } else {
        btn.classList.add('selected');
        btn.style.transform = 'scale(1.02)';
      }
    });

    setTimeout(() => {
      this.renderGameScreen();
    }, 400);
  },

  // ==================== 工具方法 ====================
  scrollToBottom() {
    setTimeout(() => {
      const chatArea = document.getElementById('chatArea');
      if (chatArea) {
        chatArea.scrollTop = chatArea.scrollHeight;
      }
    }, 100);
  },

  returnToMenu() {
    GameEngine.init();
    this.tipInsertCounter = 0;
    this.renderMainMenu();
  },

  toggleFontSize() {
    const current = Storage.getFontSize();
    const sizes = ['normal', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(current);
    const next = sizes[(currentIndex + 1) % sizes.length];
    Storage.setFontSize(next);
    this.applyFontSize(next);
  },

  applyFontSize(size) {
    document.documentElement.setAttribute('data-font-size', size);
  },

  // ==================== 图鉴详情 ====================
  showEncyclopediaDetail(entryId) {
    const entry = ENCYCLOPEDIA[entryId];
    if (!entry) return;

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="detail-screen">
        <header class="detail-header">
          <button class="btn btn-icon" onclick="UIRenderer.renderMainMenu()" aria-label="返回">
            ${this.icons['arrow-left']}
          </button>
          <h2>${entry.title}</h2>
        </header>
        <div class="detail-content">
          <div class="detail-icon">${this.icons[entry.icon] || this.icons.book}</div>
          <div class="detail-text">${entry.content.replace(/\n/g, '<br>')}</div>
          <div class="detail-tips">
            <h3>防范要点</h3>
            <div class="tips-grid">
              ${entry.tips.map(tip => `
                <div class="tip-card">
                  ${this.icons.check} ${tip}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindRippleEffect();
  },

  // ==================== 导出与重置 ====================
  async exportCard() {
    try {
      await CardExport.exportCard();
      this.showToast('提醒卡导出成功！');
    } catch (e) {
      console.error('Export failed:', e);
      this.showToast('导出失败，请重试', 'error');
    }
  },

  confirmReset() {
    const app = document.getElementById('app');
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <h3>确认重置</h3>
        <p>重置将清除所有游戏进度、已解锁结局和图鉴收集数据。此操作不可恢复。</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">取消</button>
          <button class="btn btn-danger" onclick="UIRenderer.resetAll()">确认重置</button>
        </div>
      </div>
    `;
    app.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  },

  resetAll() {
    Storage.resetAll();
    GameEngine.init();
    this.tipInsertCounter = 0;
    this.renderMainMenu();
    this.showToast('数据已重置');
  },

  // ==================== Toast ====================
  showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
};