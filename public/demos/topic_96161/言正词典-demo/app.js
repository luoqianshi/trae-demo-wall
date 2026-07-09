/**
 * 言正词典 App 主逻辑
 * 技术栈：原生 HTML + CSS + JS（无框架）
 * 数据源：app/data/seed-entries.json
 */

const app = {
  // 数据
  entries: [],
  proposals: [],
  events: [],
  currentEntry: null,
  currentProposal: null,
  currentEvent: null,
  currentCommunityModule: 'proposals',
  currentTab: 'dictionary',

  // localStorage 数据
  favorites: [],
  history: [],
  inputHistory: [],
  contributions: [],
  isLoggedIn: false,
  readCount: 0,
  readEntries: [],
  searchHistory: [],
  overlayOpenCount: 0,
  settings: { theme: 'light', fontSize: 'medium' },

  // ========== 初始化 ==========
  async init() {
    await this.loadData();
    this.loadLocalData();
    this.renderDictionary();
    this.renderCommunity();
    this.renderEventList();
    this.renderInputHistory();
    this.bindEvents();
    this.renderSearchHistory();
    this.checkOnboarding();
    this.applySettings();
  },

  // ========== 数据加载 ==========
  async loadData() {
    try {
      const [entryRes, propRes, eventRes] = await Promise.all([
        fetch('data/seed-entries.json'),
        fetch('data/mock-community.json'),
        fetch('data/mock-events.json')
      ]);
      if (!entryRes.ok || !propRes.ok || !eventRes.ok) throw new Error('fetch 状态非 200');
      this.entries = await entryRes.json();
      this.proposals = await propRes.json();
      this.events = await eventRes.json();
    } catch (e) {
      // file:// 协议下 fetch 被浏览器安全策略拦截，降级用内联数据兜底
      if (window.YZ_DATA) {
        this.entries = window.YZ_DATA.entries;
        this.proposals = window.YZ_DATA.proposals;
        this.events = window.YZ_DATA.events;
        console.warn('已使用内联数据兜底（file:// 协议或 fetch 失败）');
      } else {
        console.error('加载数据失败且无内联兜底:', e);
        this.entries = [];
        this.proposals = [];
        this.events = [];
      }
    }
  },

  loadLocalData() {
    try {
      this.favorites = JSON.parse(localStorage.getItem('yz_favorites') || '[]');
      this.history = JSON.parse(localStorage.getItem('yz_history') || '[]');
      this.inputHistory = JSON.parse(localStorage.getItem('yz_inputHistory') || '[]');
      this.contributions = JSON.parse(localStorage.getItem('yz_contributions') || '[]');
      this.isLoggedIn = localStorage.getItem('yz_loggedIn') === 'true';
      this.readCount = parseInt(localStorage.getItem('yz_readCount') || '0', 10);
      this.readEntries = JSON.parse(localStorage.getItem('yz_readEntries') || '[]');
      this.searchHistory = JSON.parse(localStorage.getItem('yz_searchHistory') || '[]');
      // 持久化提议：保留本地用户操作（提交/投票/评论/审核），补充 mock 中新增的提议（按 id 去重）
      const savedProposals = JSON.parse(localStorage.getItem('yz_proposals') || 'null');
      if (Array.isArray(savedProposals) && savedProposals.length) {
        const savedIds = new Set(savedProposals.map(p => p.id));
        this.proposals = [...savedProposals, ...this.proposals.filter(p => !savedIds.has(p.id))];
      }
      const savedSettings = localStorage.getItem('yz_settings');
      if (savedSettings) this.settings = JSON.parse(savedSettings);
    } catch (e) {
      console.error('读取本地数据失败:', e);
    }
  },

  saveLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('保存失败:', e);
    }
  },

  // ========== overlay 历史管理（支持浏览器后退/Android 返回键关闭浮层） ==========
  trackOpen() {
    // 仅在首个 overlay 打开时 pushState，避免历史栈膨胀
    if (this.overlayOpenCount === 0) {
      history.pushState({ yzOverlay: true }, '');
    }
    this.overlayOpenCount++;
  },

  trackClose() {
    if (this.overlayOpenCount > 0) {
      this.overlayOpenCount--;
      // 所有 overlay 关闭后消费 pushState，避免历史残留导致多按一次返回键
      if (this.overlayOpenCount === 0) {
        history.back();
      }
    }
  },

  closeAllOverlays() {
    // popstate 触发时一次性关闭所有浮层
    ['detail-overlay', 'proposal-overlay', 'event-overlay', 'proposal-form-overlay', 'subpage-overlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    const form = document.getElementById('proposal-form');
    if (form) form.reset();
    this.currentEntry = null;
    this.currentProposal = null;
    this.currentEvent = null;
    this.overlayOpenCount = 0;
  },

  // ========== 首次引导 ==========
  checkOnboarding() {
    const seen = localStorage.getItem('yz_onboarded');
    if (!seen) {
      document.getElementById('onboarding').classList.remove('hidden');
    }
  },

  bindOnboarding() {
    const onboarding = document.getElementById('onboarding');
    const pages = onboarding.querySelectorAll('.onboarding-page');
    const dots = onboarding.querySelectorAll('.dot');
    const nextBtn = document.getElementById('onboarding-next');
    const skipBtn = document.getElementById('onboarding-skip');
    let current = 1;

    const showPage = (page) => {
      pages.forEach(p => p.classList.toggle('hidden', p.dataset.page != page));
      dots.forEach(d => d.classList.toggle('active', d.dataset.page == page));
      current = page;
      nextBtn.textContent = page < 3 ? '下一步' : '开始使用';
    };

    nextBtn.addEventListener('click', () => {
      if (current < 3) {
        showPage(current + 1);
      } else {
        onboarding.classList.add('hidden');
        localStorage.setItem('yz_onboarded', 'true');
      }
    });

    skipBtn.addEventListener('click', () => {
      onboarding.classList.add('hidden');
      localStorage.setItem('yz_onboarded', 'true');
    });
  },

  // ========== Tab 切换 ==========
  switchTab(tabName) {
    this.currentTab = tabName;

    // 切换内容区
    document.querySelectorAll('.tab-content').forEach(el => {
      el.classList.toggle('active', el.id === `tab-${tabName}`);
    });

    // 切换底部导航
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tabName);
    });

    // 已登录状态渲染
    if (tabName === 'mine') this.renderMineTab();
  },

  // ========== 词典渲染 ==========
  renderDictionary() {
    if (!this.entries.length) return;
    this.renderTodayWord();
    this.renderHotWords();
    this.renderCategories();
    this.renderAllEntries();
  },

  // 今日一词（按日期取模）
  renderTodayWord() {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const entry = this.entries[dayOfYear % this.entries.length];
    const container = document.getElementById('today-word');

    container.innerHTML = `
      <div class="today-label">📖 今日一词</div>
      <div class="today-word">${entry.recommended.word}</div>
      <div class="today-pinyin">${entry.recommended.pinyin || ''}</div>
      <div class="today-desc">替代"${entry.deprecated.word}" — ${this.truncate(entry.recommended.rationale, 40)}</div>
      <a class="today-link" onclick="app.openDetail('${entry.id}')">查看详情 →</a>
    `;
  },

  // 热门词条（取前 8 条）
  renderHotWords() {
    const hot = this.entries.slice(0, 8);
    const container = document.getElementById('hot-words');
    container.innerHTML = hot.map(entry => `
      <div class="hot-word-card" onclick="app.openDetail('${entry.id}')">
        <div class="hot-deprecated">${entry.deprecated.word}</div>
        <div class="hot-recommended">${entry.recommended.word}</div>
        <div class="hot-pinyin">${entry.recommended.pinyin || ''}</div>
        <div class="hot-category">${entry.category}</div>
      </div>
    `).join('');
  },

  // 分类浏览
  renderCategories() {
    const categoryMap = {};
    this.entries.forEach(e => {
      if (!categoryMap[e.category]) categoryMap[e.category] = 0;
      categoryMap[e.category]++;
    });

    const container = document.getElementById('categories');
    container.innerHTML = Object.entries(categoryMap).map(([name, count]) => `
      <div class="category-card" onclick="app.filterByCategory('${name}')">
        <div class="cat-name">${name}</div>
        <div class="cat-count">${count} 条</div>
      </div>
    `).join('');
  },

  // 全部词条
  renderAllEntries(filter = null) {
    const container = document.getElementById('all-entries');
    let entries = this.entries;
    const kw = filter && filter.keyword ? filter.keyword : '';

    if (filter) {
      if (filter.category) {
        entries = entries.filter(e => e.category === filter.category);
      }
      if (kw) {
        const kwLower = kw.toLowerCase();
        entries = entries.filter(e =>
          e.recommended.word.toLowerCase().includes(kwLower) ||
          e.deprecated.word.toLowerCase().includes(kwLower) ||
          e.category.toLowerCase().includes(kwLower) ||
          (e.recommended.alternatives || []).some(a => a.toLowerCase().includes(kwLower))
        );
      }
    }

    if (entries.length === 0) {
      container.innerHTML = '<div class="search-result-empty">未找到相关词条</div>';
      return;
    }

    container.innerHTML = entries.map(entry => `
      <div class="entry-card" onclick="app.openDetail('${entry.id}')" tabindex="0" role="button" aria-label="词条：${this.escapeHTML(entry.deprecated.word)} 推荐用 ${this.escapeHTML(entry.recommended.word)}">
        <div class="entry-top">
          <span class="entry-deprecated">${this.highlight(entry.deprecated.word, kw)}</span>
          <span class="entry-arrow">→</span>
          <span class="entry-recommended">${this.highlight(entry.recommended.word, kw)}</span>
        </div>
        <div class="entry-pinyin">${this.escapeHTML(entry.recommended.pinyin || '')}</div>
        <div class="entry-desc">${this.highlight(this.truncate(entry.recommended.rationale, 35), kw)}</div>
        <div class="entry-tags">
          <span class="entry-tag">${this.highlight(entry.category, kw)}</span>
          <span class="entry-tag status-${this.getStatusClass(entry.metadata.status)}">${this.getStatusText(entry.metadata.status)}</span>
        </div>
      </div>
    `).join('');
  },

  // ========== 搜索 ==========
  handleSearch(keyword) {
    const kw = keyword.trim();
    // 搜索时隐藏搜索历史；空输入时恢复显示
    const historyEl = document.getElementById('search-history');
    if (kw) {
      if (historyEl) historyEl.classList.add('hidden');
      this.renderAllEntries({ keyword: kw });
    } else {
      if (historyEl) historyEl.classList.remove('hidden');
      this.renderAllEntries();
    }
  },

  // 记录搜索历史（去重，最多保留 10 条，新的置顶）
  addSearchHistory(kw) {
    kw = kw.trim();
    if (!kw) return;
    this.searchHistory = this.searchHistory.filter(k => k !== kw);
    this.searchHistory.unshift(kw);
    if (this.searchHistory.length > 10) this.searchHistory.length = 10;
    this.saveLocal('yz_searchHistory', this.searchHistory);
    this.renderSearchHistory();
  },

  // 渲染搜索历史（输入框为空且聚焦/未搜索时显示）
  renderSearchHistory() {
    const el = document.getElementById('search-history');
    if (!el) return;
    if (!this.searchHistory.length) {
      el.innerHTML = '';
      el.classList.add('hidden');
      return;
    }
    el.classList.remove('hidden');
    el.innerHTML = `
      <div class="search-history-header">
        <span>搜索历史</span>
        <button type="button" class="search-history-clear" onclick="app.clearSearchHistory()">清除</button>
      </div>
      <div class="search-history-list">
        ${this.searchHistory.map((k, i) => `
          <button type="button" class="search-history-item" data-idx="${i}">${this.escapeHTML(k)}</button>
        `).join('')}
      </div>
    `;
    // 事件委托：按索引读取真实关键词，避免内联拼接引号注入
    el.querySelectorAll('.search-history-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const kw = this.searchHistory[idx];
        if (kw) this.useSearchHistory(kw);
      });
    });
  },

  // 点击历史词填入搜索框并搜索
  useSearchHistory(kw) {
    const input = document.getElementById('search-input');
    input.value = kw;
    this.handleSearch(kw);
    this.addSearchHistory(kw);
  },

  // 清空搜索历史
  clearSearchHistory() {
    this.searchHistory = [];
    this.saveLocal('yz_searchHistory', this.searchHistory);
    this.renderSearchHistory();
  },

  // 分类过滤
  filterByCategory(category) {
    this.renderAllEntries({ category });
    document.getElementById('all-entries').scrollIntoView({ behavior: 'smooth' });
  },

  // ========== 词条详情页 ==========
  openDetail(entryId) {
    const entry = this.entries.find(e => e.id === entryId);
    if (!entry) return;

    this.currentEntry = entry;
    this.addToHistory(entryId);
    // 去重计数：仅首次阅读该词条才 +1，避免重复打开刷高成就
    if (!this.readEntries.includes(entryId)) {
      this.readEntries.push(entryId);
      this.readCount++;
      this.saveLocal('yz_readCount', this.readCount);
      this.saveLocal('yz_readEntries', this.readEntries);
    }

    const body = document.getElementById('detail-body');
    body.innerHTML = this.buildDetailHTML(entry);

    // 更新收藏按钮
    this.updateFavoriteBtn();

    // 显示详情页
    document.getElementById('detail-overlay').classList.remove('hidden');
    this.trackOpen();

    // 绑定折叠
    this.bindDeprecatedToggle();
  },

  closeDetail() {
    document.getElementById('detail-overlay').classList.add('hidden');
    this.currentEntry = null;
    this.trackClose();
  },

  buildDetailHTML(entry) {
    const rec = entry.recommended;
    const dep = entry.deprecated;

    // 推荐用词区
    let html = `
      <div class="detail-recommended">
        <div class="rec-label">✅ 推荐用词</div>
        <div class="rec-word">${rec.word}</div>
        <div class="rec-pinyin">${rec.pinyin || ''}</div>
    `;

    // 推荐词词源
    if (rec.etymology) {
      html += `
        <div class="detail-section">
          <h3>推荐词词源</h3>
          <p>${rec.etymology}</p>
        </div>
      `;
    }

    // 为什么推荐
    if (rec.rationale) {
      html += `
        <div class="detail-section">
          <h3>为什么推荐</h3>
          <p>${rec.rationale}</p>
        </div>
      `;
    }

    // 可替代的表达
    if (rec.alternatives && rec.alternatives.length) {
      html += `
        <div class="detail-section">
          <h3>可替代的表达</h3>
          <p>${rec.alternatives.map(a => `· ${a}`).join('<br>')}</p>
        </div>
      `;
    }

    // 推荐场景使用
    if (rec.usage_scenarios && rec.usage_scenarios.length) {
      html += `
        <div class="detail-section">
          <h3>📌 推荐场景使用</h3>
          ${rec.usage_scenarios.map(s => `
            <div class="scenario-box">
              <div class="scenario-context">${s.context}</div>
              <div class="scenario-example">${s.example}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // 古籍引用（偏旁歧视类）
    if (rec.ancient_references && rec.ancient_references.length) {
      html += `
        <div class="detail-section">
          <h3>📚 古籍出处</h3>
          ${rec.ancient_references.map(r => `
            <div class="ancient-ref">
              <span class="ref-source">${r.source}</span>：「${r.quote}」
              <br>${r.context}
            </div>
          `).join('')}
        </div>
      `;
    }

    html += `</div>`;

    // 废弃用词区（折叠）
    html += `
      <div class="detail-deprecated">
        <div class="deprecated-toggle" onclick="app.toggleDeprecated()">
          <span class="dep-label">⚠️ 废弃用词：${dep.word}</span>
          <span class="dep-arrow">▼</span>
        </div>
        <div class="deprecated-content" id="deprecated-content">
          <div class="dep-word">${dep.word}</div>
          <div class="dep-pinyin">${dep.pinyin || ''}</div>
    `;

    if (dep.etymology) {
      html += `<h3>词源</h3><p>${dep.etymology}</p>`;
    }
    if (dep.why_deprecated) {
      html += `<h3>为何废弃</h3><p>${dep.why_deprecated}</p>`;
    }
    if (dep.examples && dep.examples.length) {
      html += `<h3>常见用例（仅供参考，不建议使用）</h3>`;
      dep.examples.forEach(ex => {
        html += `<div class="dep-example">"${ex}"</div>`;
      });
    }

    html += `</div></div>`;

    // 参考文献
    if (entry.references && entry.references.length) {
      html += `
        <div class="detail-bottom-section">
          <h3>📚 参考文献</h3>
          ${entry.references.map(r => `<div class="ref-item">· ${r}</div>`).join('')}
          <button class="cite-btn" onclick="app.citeEntry()">📑 引用此词条</button>
        </div>
      `;
    }

    // 共建者
    if (entry.metadata && entry.metadata.contributors) {
      html += `
        <div class="detail-bottom-section">
          <h3>👥 共建者</h3>
          ${entry.metadata.contributors.map(c => `<div class="contributor">${c}</div>`).join('')}
        </div>
      `;
    }

    // 版本历史
    if (entry.metadata) {
      html += `
        <div class="detail-bottom-section">
          <h3>📝 版本历史</h3>
          <div class="version-item">${entry.metadata.version} · ${entry.metadata.created_at} · 初始版本</div>
        </div>
      `;
    }

    // 相关词条
    const related = this.entries.filter(e =>
      e.category === entry.category && e.id !== entry.id
    ).slice(0, 3);
    if (related.length) {
      html += `
        <div class="detail-bottom-section">
          <h3>🔗 相关词条</h3>
          ${related.map(r => `
            <div class="related-entry" onclick="app.openDetail('${r.id}')">
              <span class="related-deprecated">${r.deprecated.word}</span>
              <span>→</span>
              <span class="related-recommended">${r.recommended.word}</span>
              <span class="related-pinyin">${r.recommended.pinyin || ''}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    // 社区讨论入口（跨Tab导流）
    html += `
      <div class="community-link" onclick="app.goToCommunity('${entry.id}')">
        💬 社区讨论（查看 / 参与）
      </div>
    `;

    return html;
  },

  // 废弃用词折叠
  toggleDeprecated() {
    const content = document.getElementById('deprecated-content');
    const toggle = document.querySelector('.deprecated-toggle');
    content.classList.toggle('open');
    toggle.classList.toggle('open');
  },

  bindDeprecatedToggle() {
    // 已通过 onclick 绑定，此处预留扩展
  },

  // ========== 收藏 ==========
  toggleFavorite() {
    if (!this.currentEntry) return;
    const id = this.currentEntry.id;
    const idx = this.favorites.indexOf(id);
    if (idx > -1) {
      this.favorites.splice(idx, 1);
    } else {
      this.favorites.push(id);
    }
    this.saveLocal('yz_favorites', this.favorites);
    this.updateFavoriteBtn();
  },

  updateFavoriteBtn() {
    const btn = document.getElementById('btn-favorite');
    if (!btn || !this.currentEntry) return;
    const isFav = this.favorites.includes(this.currentEntry.id);
    btn.textContent = isFav ? '★' : '☆';
    btn.classList.toggle('active', isFav);
  },

  // ========== 分享 ==========
  shareEntry() {
    if (!this.currentEntry) return;
    const e = this.currentEntry;
    const text = `言正词典：${e.deprecated.word} → ${e.recommended.word}\n${e.recommended.rationale}`;
    if (navigator.share) {
      navigator.share({ title: '言正词典', text });
    } else {
      // 降级：复制到剪贴板
      try {
        navigator.clipboard.writeText(text);
        alert('已复制到剪贴板');
      } catch (e) {
        alert(text);
      }
    }
  },

  // ========== 引用导出 ==========
  citeEntry() {
    if (!this.currentEntry) return;
    const e = this.currentEntry;
    const cite = `言正词典编委会. "${e.deprecated.word}→${e.recommended.word}." 言正词典. ${e.metadata.version}. ${e.metadata.created_at}.`;
    try {
      navigator.clipboard.writeText(cite);
      alert('学术引用已复制：\n\n' + cite);
    } catch (e) {
      alert(cite);
    }
  },

  // ========== 浏览历史 ==========
  addToHistory(entryId) {
    const idx = this.history.indexOf(entryId);
    if (idx > -1) this.history.splice(idx, 1);
    this.history.unshift(entryId);
    if (this.history.length > 50) this.history = this.history.slice(0, 50);
    this.saveLocal('yz_history', this.history);
  },

  // ========== 跨Tab导流 ==========
  goToCommunity(entryId) {
    this.closeDetail();
    this.switchTab('community');
    // 滚动到列表顶部，便于查看相关提议
    const list = document.getElementById('proposal-list');
    if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  // ========== 社区模块 ==========
  renderCommunity() {
    if (!this.proposals.length) return;
    // 按热度排序（非时间）
    const sorted = [...this.proposals].sort((a, b) => b.heat - a.heat);
    const container = document.getElementById('proposal-list');
    container.innerHTML = sorted.map(p => `
      <div class="proposal-card" onclick="app.openProposal('${p.id}')">
        <div class="prop-title">${this.escapeHTML(p.title)}</div>
        <div class="prop-words">
          <span class="prop-deprecated">${this.escapeHTML(p.proposed_deprecated)}</span>
          <span>→</span>
          <span class="prop-recommended">${this.escapeHTML(p.proposed_recommended)}</span>
        </div>
        <div class="prop-meta">
          <span>${this.escapeHTML(p.proposer)} · ${this.escapeHTML(p.category)}</span>
          <span class="prop-stage">${this.escapeHTML(p.current_stage)}</span>
        </div>
        <div class="prop-meta">
          <span>🔥 ${p.heat} · 👍 ${p.upvotes} · 💬 ${p.comments.length}</span>
          <span>${p.created_at}</span>
        </div>
      </div>
    `).join('');
  },

  // 社区模块切换（词条讨论/事件讨论）
  switchCommunityModule(module) {
    this.currentCommunityModule = module;
    document.querySelectorAll('.module-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.module === module);
    });
    document.getElementById('community-proposals').classList.toggle('hidden', module !== 'proposals');
    document.getElementById('community-events').classList.toggle('hidden', module !== 'events');
    if (module === 'events') this.renderEventList();
  },

  // 事件列表渲染（按热度排序）
  renderEventList() {
    if (!this.events.length) return;
    const sorted = [...this.events].sort((a, b) => b.heat - a.heat);
    const container = document.getElementById('event-list');
    const statusMap = {
      discussing: '拆解讨论中',
      summarizing: 'AI总结中',
      proposing: '征集方案中',
      reviewing: '审核中',
      published: '已入库',
      pushed: '已推流'
    };
    container.innerHTML = sorted.map(e => `
      <div class="proposal-card event-card" onclick="app.openEvent('${e.id}')">
        <div class="event-type-tag">${e.event_type}</div>
        <div class="prop-title">${e.title}</div>
        <div class="prop-meta">
          <span>${e.reporter} · 🔥 ${e.heat}</span>
          <span class="prop-stage">${statusMap[e.status] || e.status}</span>
        </div>
        <div class="prop-meta">
          <span>${e.phenomenon ? this.truncate(e.phenomenon.description, 40) : ''}</span>
          <span>${e.created_at}</span>
        </div>
      </div>
    `).join('');
  },

  openEvent(id) {
    const event = this.events.find(e => e.id === id);
    if (!event) return;
    this.currentEvent = event;
    document.getElementById('event-body').innerHTML = this.buildEventHTML(event);
    document.getElementById('event-overlay').classList.remove('hidden');
    this.trackOpen();
  },

  closeEvent() {
    document.getElementById('event-overlay').classList.add('hidden');
    this.currentEvent = null;
    this.trackClose();
  },

  buildEventHTML(e) {
    let html = `<div class="event-detail">`;
    html += `<div class="event-type-badge">${e.event_type}</div>`;
    html += `<h2 class="event-title">${e.title}</h2>`;
    html += `<div class="prop-meta">${e.reporter} · ${e.created_at} · 🔥 ${e.heat}</div>`;

    // 七步闭环进度
    html += `<div class="event-stages"><h3>📋 七步闭环</h3><div class="stage-chain">`;
    e.stage_progress.forEach((s, i) => {
      const cls = s.status === 'done' ? 'done' : (s.status === 'current' ? 'current' : 'pending');
      html += `<div class="stage-node ${cls}"><span class="stage-num">${i + 1}</span><span class="stage-name">${s.stage}</span><span class="stage-time">${s.time || ''}</span></div>`;
    });
    html += `</div></div>`;

    // 现象/事件
    if (e.phenomenon) {
      html += `<div class="event-section"><h3>🔍 现象/事件</h3>`;
      html += `<p>${e.phenomenon.description}</p>`;
      if (e.phenomenon.bias_expression) html += `<div class="event-bias-expr">偏见表述：${e.phenomenon.bias_expression}</div>`;
      if (e.phenomenon.occurred_at) html += `<div class="event-meta">发生时间：${e.phenomenon.occurred_at}</div>`;
      if (e.phenomenon.scope) html += `<div class="event-meta">影响范围：${e.phenomenon.scope}</div>`;
      html += `</div>`;
    }

    // 谣言溯源（众包聚合）
    if (e.rumor_submissions && e.rumor_submissions.length) {
      html += `<div class="event-section"><h3>🔬 谣言溯源（社区众包聚合）</h3>`;
      html += `<div class="event-note">⚠️ 基于社区成员提交聚合，非系统自动追踪，可能存在更早未发现记录</div>`;
      // AI 聚合首发判断
      if (e.ai_aggregated_origin) {
        html += `<div class="origin-box">`;
        html += `<div class="origin-row"><span class="origin-label">目前已知最早：</span>${e.ai_aggregated_origin.earliest_known || '待查'}</div>`;
        html += `<div class="origin-row"><span class="origin-label">首发平台：</span>${e.ai_aggregated_origin.first_platform || '待查'}</div>`;
        if (e.ai_aggregated_origin.note) html += `<div class="origin-note">${e.ai_aggregated_origin.note}</div>`;
        html += `</div>`;
      }
      // 众包提交列表
      html += `<div class="submission-list">`;
      e.rumor_submissions.forEach(s => {
        html += `<div class="submission-item">`;
        html += `<div class="submission-head">${s.submitter} · ${s.submitted_at}</div>`;
        html += `<div class="submission-row">平台：${s.platform} · 账号类型：${s.account_type} · 看到时间：${s.observed_at}</div>`;
        html += `<div class="submission-row">内容：${s.content_snapshot}</div>`;
        if (s.archive_url) html += `<div class="submission-row">归档：<a href="#" onclick="return false">${s.archive_url}</a></div>`;
        html += `</div>`;
      });
      html += `</div>`;
      // 传播链
      if (e.propagation_chain && e.propagation_chain.length) {
        html += `<h4>传播链还原</h4><div class="prop-chain">`;
        e.propagation_chain.forEach(n => {
          html += `<div class="prop-node"><span class="prop-node-num">${n.node_order}</span>`;
          html += `<div class="prop-node-body"><div>${n.platform} · ${n.time}</div>`;
          html += `<div class="prop-mutation">变异：${n.mutation}</div>`;
          html += `<div class="prop-reach">触达：${n.reach_estimate}</div></div></div>`;
        });
        html += `</div>`;
      }
      html += `</div>`;
    }

    // 真相还原 + 漏洞拆解
    if (e.truth_restitution) {
      html += `<div class="event-section"><h3>✅ 真相还原</h3>`;
      html += `<p>${e.truth_restitution.original_fact}</p>`;
      if (e.truth_restitution.evidence_chain && e.truth_restitution.evidence_chain.length) {
        html += `<div class="evidence-list"><h4>证据链</h4>`;
        e.truth_restitution.evidence_chain.forEach(ev => {
          html += `<div class="evidence-item"><span class="evidence-type">${ev.source_type}</span> ${ev.evidence} <span class="evidence-src">— ${ev.source}</span></div>`;
        });
        html += `</div>`;
      }
      if (e.truth_restitution.flaws && e.truth_restitution.flaws.length) {
        html += `<div class="flaw-list"><h4>漏洞拆解</h4>`;
        e.truth_restitution.flaws.forEach(f => {
          html += `<div class="flaw-item"><span class="flaw-type">${f.flaw_type}</span> ${f.description}</div>`;
        });
        html += `</div>`;
      }
      html += `</div>`;
    }

    // 溯源工具箱
    if (e.verification_tools_used && e.verification_tools_used.length) {
      html += `<div class="event-section"><h3>🛠 溯源工具箱</h3><div class="tool-list">`;
      e.verification_tools_used.forEach(t => {
        html += `<div class="tool-item"><span class="tool-name">${t.tool}</span> ${t.result}</div>`;
      });
      html += `</div></div>`;
    }

    // 权威核查引用
    if (e.authoritative_refs && e.authoritative_refs.length) {
      html += `<div class="event-section"><h3>📚 权威核查引用</h3>`;
      e.authoritative_refs.forEach(r => {
        html += `<div class="auth-ref">${r.source} — ${r.verdict}</div>`;
      });
      html += `</div>`;
    }

    // 拆解讨论
    if (e.discussion && e.discussion.length) {
      html += `<div class="event-section"><h3>💬 拆解讨论</h3>`;
      e.discussion.forEach(d => {
        const stanceMap = { pro: '支持', con: '反对', neutral: '中立' };
        html += `<div class="discuss-item">`;
        html += `<div class="discuss-head">${d.user} · ${d.stakeholder_ref} · <span class="stance-${d.stance}">${stanceMap[d.stance] || d.stance}</span> · ${d.time}</div>`;
        html += `<div class="discuss-content">${d.content}</div>`;
        if (d.evidence) html += `<div class="discuss-evidence">证据：${d.evidence}</div>`;
        html += `</div>`;
      });
      html += `</div>`;
    }

    // AI 事件总结
    if (e.ai_summary && e.ai_summary.generated) {
      html += `<div class="event-section ai-summary-box"><h3>🤖 AI 事件总结 <span class="ai-tag">AI生成</span></h3>`;
      html += `<p>${e.ai_summary.content}</p>`;
      if (e.ai_summary.generated_at) html += `<div class="ai-time">生成时间：${e.ai_summary.generated_at}</div>`;
      if (e.ai_summary.note) html += `<div class="ai-note">${e.ai_summary.note}</div>`;
      html += `</div>`;
    }

    // 应对方案（击溃路径）
    if (e.solutions && e.solutions.length) {
      html += `<div class="event-section"><h3>💡 应对方案（击溃路径）</h3>`;
      e.solutions.forEach(sol => {
        html += `<div class="solution-item">`;
        html += `<div class="sol-head">${sol.user} · ${sol.time} · 👍 ${sol.votes.up} / 👎 ${sol.votes.down}</div>`;
        html += `<div class="sol-content">${sol.content}</div>`;
        if (sol.strategy) {
          html += `<div class="sol-strategy">`;
          if (sol.strategy.authoritative_source) html += `<div><span class="strat-label">权威信源：</span>${sol.strategy.authoritative_source}</div>`;
          if (sol.strategy.truth_replacement) html += `<div><span class="strat-label">真相替代文案：</span>${sol.strategy.truth_replacement}</div>`;
          if (sol.strategy.propagation_tactic) html += `<div><span class="strat-label">传播策略：</span>${sol.strategy.propagation_tactic}</div>`;
          if (sol.strategy.target_audience) html += `<div><span class="strat-label">适用人群：</span>${sol.strategy.target_audience}</div>`;
          if (sol.strategy.cautions) html += `<div><span class="strat-label">注意事项：</span>${sol.strategy.cautions}</div>`;
          html += `</div>`;
        }
        html += `</div>`;
      });
      html += `</div>`;
    }

    // 三级审核
    if (e.review) {
      const r = e.review;
      html += `<div class="event-section"><h3>⚖️ 三级审核</h3>`;
      html += `<div class="review-item"><span class="review-level">① 机器初筛</span><span class="review-status ${r.machine.status}">${r.machine.status === 'passed' ? '✓ 通过' : '待处理'}</span></div>`;
      html += `<div class="review-note">${r.machine.note || ''} ${r.machine.time || ''}</div>`;
      if (r.community) {
        html += `<div class="review-item"><span class="review-level">② 社区共审（${r.community.reviewers} 位审核员）</span><span class="review-status ${r.community.status}">${r.community.status === 'passed' ? '✓ 通过' : '待处理'}</span></div>`;
        if (r.community.votes) html += `<div class="review-note">赞成 ${r.community.votes.approve} · 反对 ${r.community.votes.reject} · 弃权 ${r.community.votes.abstain}</div>`;
        html += `<div class="review-note">${r.community.note || ''} ${r.community.time || ''}</div>`;
      }
      if (r.senior) {
        html += `<div class="review-item"><span class="review-level">③ 资深审核员终审（匿名）</span><span class="review-status ${r.senior.status}">${r.senior.status === 'passed' ? '✓ 通过' : '待处理'}</span></div>`;
        html += `<div class="review-note">${r.senior.reviewer || ''} ${r.senior.note || ''} ${r.senior.time || ''}</div>`;
      }
      html += `</div>`;
    }

    // 入库应对指南
    if (e.guide) {
      html += `<div class="event-section guide-box"><h3>📖 入库应对指南</h3><p>${e.guide}</p></div>`;
    }

    // 推流渠道
    if (e.push_channels && e.push_channels.length) {
      html += `<div class="event-section"><h3>📢 推流渠道</h3>`;
      e.push_channels.forEach(ch => { html += `<div class="push-channel">· ${ch}</div>`; });
      html += `</div>`;
    }

    // 关联词条（跨Tab导流）
    if (e.linked_entry_ids && e.linked_entry_ids.length) {
      html += `<div class="event-section"><h3>🔗 关联词条</h3>`;
      e.linked_entry_ids.forEach(eid => {
        const entry = this.entries.find(en => en.id === eid);
        if (entry) {
          html += `<div class="related-entry" onclick="app.closeEvent();app.openDetail('${entry.id}')">`;
          html += `<span class="related-deprecated">${entry.deprecated.word}</span><span>→</span>`;
          html += `<span class="related-recommended">${entry.recommended.word}</span></div>`;
        }
      });
      html += `</div>`;
    }

    html += `</div>`;
    return html;
  },

  voteSolution(dir) {
    if (!this.requireLogin('投票')) return;
    if (!this.currentEvent || !this.currentEvent.solutions || !this.currentEvent.solutions.length) {
      alert('当前事件暂无应对方案可投票');
      return;
    }
    const sol = this.currentEvent.solutions[0];
    if (dir === 'up') sol.votes.up++;
    else sol.votes.down++;
    document.getElementById('event-body').innerHTML = this.buildEventHTML(this.currentEvent);
  },

  openProposal(id) {
    const proposal = this.proposals.find(p => p.id === id);
    if (!proposal) return;
    this.currentProposal = proposal;
    document.getElementById('proposal-body').innerHTML = this.buildProposalHTML(proposal);
    document.getElementById('proposal-overlay').classList.remove('hidden');
    this.trackOpen();
  },

  closeProposal() {
    document.getElementById('proposal-overlay').classList.add('hidden');
    this.currentProposal = null;
    this.trackClose();
  },

  buildProposalHTML(p) {
    let html = '';

    // 标题区
    html += `
      <div class="detail-recommended" style="border-top:3px solid var(--color-primary)">
        <div class="rec-label">📣 提议</div>
        <div class="rec-word" style="font-size:var(--font-size-xl)">${this.escapeHTML(p.title)}</div>
        <div class="prop-words" style="margin-top:0.5rem">
          <span class="prop-deprecated" style="color:var(--color-deprecated);text-decoration:line-through">${this.escapeHTML(p.proposed_deprecated)}</span>
          <span style="color:var(--color-deprecated)">→</span>
          <span class="prop-recommended" style="font-family:var(--font-serif);color:var(--color-primary)">${this.escapeHTML(p.proposed_recommended)}</span>
        </div>
        <div class="prop-meta" style="margin-top:0.5rem;font-size:0.75rem;color:var(--color-deprecated)">
          ${this.escapeHTML(p.proposer)}（${this.escapeHTML(p.proposer_role)}）· ${this.escapeHTML(p.category)} · ${p.created_at}
        </div>
      </div>
    `;

    // 问题描述
    html += `
      <div class="proposal-desc">
        <div class="desc-label">问题描述</div>
        <div class="desc-text">${this.escapeHTML(p.description)}</div>
      </div>
    `;

    // 六步闭环进度
    html += `
      <div class="stage-progress">
        <div class="progress-title">🔄 六步闭环进度</div>
        <div class="stage-list">
          ${p.stage_progress.map(s => `
            <div class="stage-item ${s.status === 'pending' ? 'pending' : ''}">
              <span class="stage-dot ${s.status}">
                ${s.status === 'done' ? '✓' : s.status === 'current' ? '●' : ''}
              </span>
              <span class="stage-name">${s.stage}</span>
              <span class="stage-time">${s.time || '—'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // AI 总结
    if (p.ai_summary && p.ai_summary.generated) {
      const ai = p.ai_summary;
      html += `
        <div class="ai-summary">
          <div class="ai-label">
            🤖 AI 总结草案
            <span class="ai-tag">AI 生成</span>
          </div>
          <div class="ai-draft">
            <div class="ai-field"><span class="ai-field-label">废弃词：</span>${ai.draft_term.deprecated_word}</div>
            <div class="ai-field"><span class="ai-field-label">推荐词：</span>${ai.draft_term.recommended_word}</div>
            <div class="ai-field"><span class="ai-field-label">词源：</span>${ai.draft_term.etymology}</div>
            <div class="ai-field"><span class="ai-field-label">推荐理由：</span>${ai.draft_term.rationale}</div>
            <div class="ai-field"><span class="ai-field-label">替代词：</span>${ai.draft_term.alternatives.join('、')}</div>
          </div>
          <div class="ai-note">${ai.note}</div>
          <div class="ai-note" style="margin-top:0.25rem">生成时间：${ai.generated_at}</div>
        </div>
      `;
    }

    // 三级审核（匿名共审）
    const r = p.review;
    const communityVotes = r.community.votes
      ? `赞成 ${r.community.votes.approve} · 反对 ${r.community.votes.reject} · 弃权 ${r.community.votes.abstain}`
      : '';
    html += `
      <div class="review-section">
        <h3>⚖️ 三级审核（匿名共审）</h3>
        <div class="review-item">
          <span class="review-level">① 机器初筛</span>
          <span class="review-status ${r.machine.status}">${r.machine.status === 'passed' ? '✓ 通过' : '待处理'}</span>
        </div>
        <div class="review-note">${r.machine.note || ''} ${r.machine.time || ''}</div>
        <div class="review-item">
          <span class="review-level">② 社区共审（${r.community.reviewers || 0} 位审核员投票）</span>
          <span class="review-status ${r.community.status}">${r.community.status === 'passed' ? '✓ ' + (r.community.consensus || '通过') : '待议'}</span>
        </div>
        <div class="review-note">${communityVotes} ${r.community.note || ''} ${r.community.time || ''}</div>
        <div class="review-item">
          <span class="review-level">③ 资深审核员终审（匿名）</span>
          <span class="review-status ${r.senior.status}">${r.senior.status === 'passed' ? '✓ 通过' : '待处理'}</span>
        </div>
        <div class="review-note">${r.senior.reviewer || ''} ${r.senior.note || ''} ${r.senior.time || ''}</div>
      </div>
    `;

    // 评论
    html += `
      <div class="comments-section">
        <h3>💬 讨论（${p.comments.length}）</h3>
        ${p.comments.map(c => `
          <div class="comment-item">
            <span class="comment-user">${this.escapeHTML(c.user)}</span>
            <span class="comment-time">${c.time}</span>
            <div class="comment-content">${this.escapeHTML(c.content)}</div>
            ${c.references ? `<div class="comment-refs">引用：${c.references.map(r => this.escapeHTML(r)).join('；')}</div>` : ''}
          </div>
        `).join('')}
        <div class="comment-input-row">
          <input type="text" id="comment-input" placeholder="补充考证或观点…">
          <button onclick="app.submitComment()">发表</button>
        </div>
      </div>
    `;

    // 关联词条（跨Tab导流：社区→词典）
    if (p.linked_entry_id) {
      const entry = this.entries.find(e => e.id === p.linked_entry_id);
      if (entry) {
        html += `
          <div class="cross-tab-link" onclick="app.goToDictionaryFromProposal('${p.linked_entry_id}')">
            📖 关联词条：${entry.deprecated.word} → ${entry.recommended.word} →
          </div>
        `;
      }
    }

    // 互动数据
    html += `
      <div class="proposal-desc" style="text-align:center">
        <div class="desc-text">
          🔥 讨论热度 ${p.heat} · 👍 ${p.upvotes} · 👎 ${p.downvotes}
        </div>
      </div>
    `;

    return html;
  },

  voteProposal(type) {
    if (!this.currentProposal) return;
    if (!this.requireLogin('投票')) return;
    const p = this.currentProposal;
    if (type === 'up') p.upvotes++;
    else p.downvotes++;
    this.saveLocal('yz_proposals', this.proposals);
    document.getElementById('proposal-body').innerHTML = this.buildProposalHTML(p);
  },

  submitComment() {
    if (!this.currentProposal) return;
    if (!this.requireLogin('发表评论')) return;
    const input = document.getElementById('comment-input');
    const text = input.value.trim();
    if (!text) return;
    this.currentProposal.comments.push({
      user: '匿名用户#' + Math.floor(Math.random() * 9000 + 1000),
      content: text,
      time: new Date().toISOString().slice(0, 10)
    });
    this.saveLocal('yz_proposals', this.proposals);
    document.getElementById('proposal-body').innerHTML = this.buildProposalHTML(this.currentProposal);
  },

  openProposalForm() {
    if (!this.requireLogin('提交提议')) return;
    document.getElementById('proposal-form-overlay').classList.remove('hidden');
    this.trackOpen();
  },

  closeProposalForm() {
    document.getElementById('proposal-form-overlay').classList.add('hidden');
    document.getElementById('proposal-form').reset();
    this.trackClose();
  },

  submitProposal(event) {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    const deprecated = data.get('deprecated').trim();
    const recommended = data.get('recommended').trim();
    const category = data.get('category');
    const description = data.get('description').trim();

    const today = new Date().toISOString().slice(0, 10);
    const newProposal = {
      id: 'prop-' + Date.now(),
      title: `"${deprecated}"应替换为"${recommended}"`,
      proposer: '匿名用户#' + Math.floor(Math.random() * 9000 + 1000),
      proposer_role: '注册用户',
      proposed_deprecated: deprecated,
      proposed_recommended: recommended,
      category,
      description,
      current_stage: '提议',
      stage_progress: [
        { stage: '提议', status: 'current', time: today },
        { stage: '讨论', status: 'pending', time: null },
        { stage: 'AI总结', status: 'pending', time: null },
        { stage: '审核', status: 'pending', time: null },
        { stage: '入册', status: 'pending', time: null },
        { stage: '分发', status: 'pending', time: null }
      ],
      heat: 1,
      upvotes: 0,
      downvotes: 0,
      comments: [],
      ai_summary: null,
      review: {
        machine: { status: 'passed', time: today, note: '内容合规' },
        community: { status: 'pending', reviewers: 0, consensus: '待议', votes: { approve: 0, reject: 0, abstain: 0 }, time: null, note: null },
        senior: { status: 'pending', reviewer: '待分配', time: null, note: null }
      },
      linked_entry_id: null,
      created_at: today
    };
    this.proposals.unshift(newProposal);
    this.saveLocal('yz_proposals', this.proposals);
    this.contributions.unshift({
      type: '提议',
      title: newProposal.title,
      id: newProposal.id,
      status: '审核中',
      time: today
    });
    this.saveLocal('yz_contributions', this.contributions);

    this.closeProposalForm();
    this.renderCommunity();
    alert('提议已提交，进入机器初筛 → 社区共审 → 资深审核员终审流程');
  },

  goToDictionaryFromProposal(entryId) {
    this.closeProposal();
    this.switchTab('dictionary');
    setTimeout(() => this.openDetail(entryId), 300);
  },

  // ========== 输入法模块（产品介绍页） ==========
  // 输入法为即将上线的独立产品，此处为产品介绍页。
  // 包容语言使用记录：展示用户使用过的包容表达（demo 阶段用 mock 数据填充示例）。
  renderInputHistory() {
    const container = document.getElementById('input-history-list');
    if (!container) return;
    // demo 阶段：若无本地记录，展示示例数据帮助理解功能
    const data = this.inputHistory.length ? this.inputHistory : this.getMockUsageHistory();
    if (!data.length) {
      container.innerHTML = '<div class="subpage-empty">尚无包容语言使用记录<br><br>言正输入法上线后，此处将记录你每次采用的包容表达</div>';
      return;
    }
    container.innerHTML = data.map(h => `
      <div class="input-history-item" onclick="app.openDetail('${h.entryId}')">
        <span class="hist-deprecated">${h.word}</span>
        <span>→</span>
        <span class="hist-recommended">${h.recommended}</span>
        <span class="hist-time">${h.time}</span>
      </div>
    `).join('');
  },

  // demo 示例数据：从真实词条取 id/推荐词，避免手写错误导致被 filter 过滤（输入法上线后替换为真实使用记录）
  getMockUsageHistory() {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    return this.entries.slice(0, 4).map((e, i) => ({
      word: e.deprecated.word,
      recommended: e.recommended.word,
      entryId: e.id,
      time: i < 2 ? today : yesterday
    }));
  },

  // ========== 我的 Tab ==========
  renderMineTab() {
    const usernameEl = document.getElementById('mine-username');
    const loginBtn = document.getElementById('mine-login-btn');
    const guide = document.querySelector('.visible-guide .guide-desc');
    if (this.isLoggedIn) {
      usernameEl.textContent = '言正用户';
      loginBtn.textContent = '退出登录';
      loginBtn.onclick = () => this.logout();
      if (guide) guide.textContent = '你已登录，可发表言论、投票、提交提议与参与审核';
    } else {
      usernameEl.textContent = '言正访客';
      loginBtn.textContent = '登录 / 注册';
      loginBtn.onclick = () => this.mockLogin();
      if (guide) guide.textContent = '登录后可发表言论、投票、提交提议与参与审核';
    }
    document.getElementById('read-count').textContent = this.readCount;
  },

  mockLogin() {
    this.isLoggedIn = true;
    localStorage.setItem('yz_loggedIn', 'true');
    this.renderMineTab();
  },

  logout() {
    this.isLoggedIn = false;
    localStorage.removeItem('yz_loggedIn');
    this.renderMineTab();
  },

  // 检查登录态：发表言论/投票/提议/审核需要登录
  requireLogin(action) {
    if (this.isLoggedIn) return true;
    alert(`请先登录后再${action}。浏览内容无需登录。`);
    this.switchTab('mine');
    return false;
  },

  showView(view) {
    const titles = {
      favorites: '我的收藏',
      history: '浏览历史',
      contributions: '我的贡献',
      reviewer: '资深审核员工作台',
      settings: '设置',
      about: '关于言正词典',
      feedback: '反馈建议'
    };
    document.getElementById('subpage-title').textContent = titles[view] || '';
    const body = document.getElementById('subpage-body');

    switch (view) {
      case 'favorites': body.innerHTML = this.renderFavoritesHTML(); break;
      case 'history': body.innerHTML = this.renderHistoryHTML(); break;
      case 'contributions': body.innerHTML = this.renderContributionsHTML(); break;
      case 'reviewer': body.innerHTML = this.renderReviewerHTML(); break;
      case 'settings': body.innerHTML = this.renderSettingsHTML(); break;
      case 'about': body.innerHTML = this.renderAboutHTML(); break;
      case 'feedback': body.innerHTML = this.renderFeedbackHTML(); break;
      default: body.innerHTML = '<div class="subpage-empty">未知页面</div>';
    }
    document.getElementById('subpage-overlay').classList.remove('hidden');
    this.trackOpen();
  },

  closeSubpage() {
    document.getElementById('subpage-overlay').classList.add('hidden');
    this.trackClose();
  },

  renderFavoritesHTML() {
    if (!this.favorites.length) {
      return '<div class="subpage-empty">尚未收藏任何词条</div>';
    }
    const items = this.favorites.map(id => this.entries.find(e => e.id === id)).filter(Boolean);
    return items.map(e => `
      <div class="entry-card" onclick="app.openDetail('${e.id}');app.closeSubpage()">
        <div class="entry-top">
          <span class="entry-deprecated">${e.deprecated.word}</span>
          <span class="entry-arrow">→</span>
          <span class="entry-recommended">${e.recommended.word}</span>
        </div>
        <div class="entry-pinyin">${e.recommended.pinyin || ''}</div>
        <div class="entry-desc">${this.truncate(e.recommended.rationale, 35)}</div>
      </div>
    `).join('');
  },

  renderHistoryHTML() {
    if (!this.history.length) {
      return '<div class="subpage-empty">尚无浏览记录</div>';
    }
    const items = this.history.map(id => this.entries.find(e => e.id === id)).filter(Boolean);
    return items.map(e => `
      <div class="entry-card" onclick="app.openDetail('${e.id}');app.closeSubpage()">
        <div class="entry-top">
          <span class="entry-deprecated">${e.deprecated.word}</span>
          <span class="entry-arrow">→</span>
          <span class="entry-recommended">${e.recommended.word}</span>
        </div>
        <div class="entry-pinyin">${e.recommended.pinyin || ''}</div>
        <div class="entry-desc">${this.truncate(e.recommended.rationale, 35)}</div>
      </div>
    `).join('');
  },

  renderContributionsHTML() {
    if (!this.contributions.length) {
      return '<div class="subpage-empty">尚无贡献记录<br><br>去社区提交提议即可出现在这里</div>';
    }
    return this.contributions.map(c => `
      <div class="entry-card">
        <div class="entry-top">
          <span class="entry-tag">${c.type}</span>
          <span class="entry-recommended" style="font-size:var(--font-size-base)">${c.title}</span>
        </div>
        <div class="entry-desc">状态：${c.status} · ${c.time}</div>
      </div>
    `).join('');
  },

  renderReviewerHTML() {
    // 匿名共审工作台（Demo）
    // 取消实名学者，改为匿名资深审核员。审核员身份不公开，依据来源可信度与社区共识终审。
    const pending = this.proposals.filter(p =>
      p.review.senior.status === 'pending' && p.ai_summary && p.ai_summary.generated
    );
    // 已审记录（含通过与驳回）
    const reviewed = this.proposals.filter(p => p.review.senior.status === 'passed' || p.review.senior.status === 'rejected');
    return `
      <div class="scholar-profile">
        <div class="scholar-name">⚖️ 资深审核员工作台（匿名）</div>
        <div class="scholar-meta">当前身份：资深审核员#S02（匿名）</div>
        <div class="scholar-meta">机制说明：审核员身份不公开 · 依据来源可信度与社区共识终审</div>
      </div>
      <div class="subpage-section">
        <h3>待终审的词条草案</h3>
        ${pending.length === 0 ? '<div class="subpage-empty">暂无待终审草案</div>' :
          pending.map(p => `
            <div class="scholar-task">
              <div class="task-title">${this.escapeHTML(p.title)}</div>
              <div class="task-meta">${this.escapeHTML(p.proposer)} · ${this.escapeHTML(p.category)} · AI 草案已生成</div>
              <div class="task-meta">社区共审：${p.review.community.consensus || '待议'}（赞成 ${p.review.community.votes.approve} · 反对 ${p.review.community.votes.reject}）</div>
              <div class="task-actions">
                <button class="task-btn approve" onclick="app.reviewerApprove('${p.id}')">通过</button>
                <button class="task-btn reject" onclick="app.reviewerReject('${p.id}')">驳回</button>
                <button class="task-btn reject" onclick="app.openProposal('${p.id}');app.closeSubpage()">查看草案</button>
              </div>
            </div>
          `).join('')
        }
      </div>
      <div class="subpage-section">
        <h3>审核依据</h3>
        <p style="font-size:var(--font-size-sm);color:var(--color-text);opacity:0.8;line-height:1.7">
          终审以"来源可信度"为核心标准，而非个人学术权威：<br>
          · 古籍引用是否可考（注明书名、篇目、原文）<br>
          · 是否有权威机构指南佐证（如联合国《中文性别包容性语言指南》）<br>
          · 社区共审是否形成共识（≥3 位审核员投票）<br>
          · 立场是否平衡（不夹带个人偏见）<br><br>
          参考维基百科治理模式：放弃专家实名认证，依靠可靠来源共识。
        </p>
      </div>
      <div class="subpage-section">
        <h3>已终审记录（${reviewed.length}）</h3>
        ${reviewed.length === 0 ? '<div class="subpage-empty">暂无已终审记录</div>' :
          reviewed.map(p => `
            <div class="scholar-task">
              <div class="task-title">${this.escapeHTML(p.title)}</div>
              <div class="task-meta">${this.escapeHTML(p.review.senior.reviewer)} · ${p.review.senior.time} · ${p.review.senior.status === 'passed' ? '✓ 通过' : '✗ 驳回'}</div>
              <div class="task-meta">${this.escapeHTML(p.review.senior.note || '')}</div>
            </div>
          `).join('')
        }
      </div>
    `;
  },

  reviewerApprove(id) {
    const p = this.proposals.find(x => x.id === id);
    if (!p) return;
    p.review.senior = {
      status: 'passed',
      reviewer: '资深审核员#S02（匿名）',
      time: new Date().toISOString().slice(0, 10),
      note: '来源可考、社区共识充分、立场平衡，准予入册'
    };
    // 推进入册阶段
    const stages = p.stage_progress;
    const reviewIdx = stages.findIndex(s => s.stage === '审核');
    if (reviewIdx > -1) {
      stages[reviewIdx].status = 'done';
      stages[reviewIdx + 1].status = 'current';
      stages[reviewIdx + 1].time = new Date().toISOString().slice(0, 10);
      p.current_stage = stages[reviewIdx + 1].stage;
    }
    this.saveLocal('yz_proposals', this.proposals);
    alert('已通过资深审核员终审，提议进入入册阶段');
    this.showView('reviewer');
  },

  reviewerReject(id) {
    const p = this.proposals.find(x => x.id === id);
    if (!p) return;
    p.review.senior = {
      status: 'rejected',
      reviewer: '资深审核员#S02（匿名）',
      time: new Date().toISOString().slice(0, 10),
      note: '来源需补充更多可考古籍后再审'
    };
    this.saveLocal('yz_proposals', this.proposals);
    alert('已驳回，需补充考证后重新提交社区共审');
    this.showView('reviewer');
  },

  renderSettingsHTML() {
    const { theme, fontSize } = this.settings;
    return `
      <div class="subpage-section">
        <h3>外观</h3>
        <div class="setting-row">
          <span class="setting-label">深色模式</span>
          <div class="setting-control">
            <button class="setting-option ${theme === 'light' ? 'active' : ''}" onclick="app.setSetting('theme','light')">浅色</button>
            <button class="setting-option ${theme === 'dark' ? 'active' : ''}" onclick="app.setSetting('theme','dark')">深色</button>
          </div>
        </div>
        <div class="setting-row">
          <span class="setting-label">字体大小</span>
          <div class="setting-control">
            <button class="setting-option ${fontSize === 'small' ? 'active' : ''}" onclick="app.setSetting('fontSize','small')">小</button>
            <button class="setting-option ${fontSize === 'medium' ? 'active' : ''}" onclick="app.setSetting('fontSize','medium')">中</button>
            <button class="setting-option ${fontSize === 'large' ? 'active' : ''}" onclick="app.setSetting('fontSize','large')">大</button>
          </div>
        </div>
      </div>
      <div class="subpage-section">
        <h3>数据</h3>
        <div class="setting-row">
          <span class="setting-label">已读词条</span>
          <span style="color:var(--color-primary)">${this.readCount} 个</span>
        </div>
        <div class="setting-row">
          <span class="setting-label">收藏数</span>
          <span style="color:var(--color-primary)">${this.favorites.length} 个</span>
        </div>
        <div class="setting-row">
          <span class="setting-label">提议数</span>
          <span style="color:var(--color-primary)">${this.contributions.length} 个</span>
        </div>
      </div>
      <button class="btn-primary" onclick="app.clearLocalData()">清除本地数据</button>
    `;
  },

  setSetting(key, value) {
    this.settings[key] = value;
    this.saveLocal('yz_settings', this.settings);
    this.applySettings();
    this.showView('settings');
  },

  clearLocalData() {
    if (!confirm('确定清除所有本地数据（收藏/历史/设置）？')) return;
    ['yz_favorites', 'yz_history', 'yz_inputHistory', 'yz_contributions', 'yz_readCount', 'yz_settings', 'yz_loggedIn'].forEach(k => localStorage.removeItem(k));
    alert('已清除，将刷新页面');
    location.reload();
  },

  renderAboutHTML() {
    return `
      <div class="about-section">
        <h3>使命</h3>
        <p>在 AI 时代，系统纠正被父权思想扭曲的中文语言，构建一份结构化、可考证、有平权视角的中文词库，并协作还原语言偏见事件，让平权思想借由语言本身得以传播与沉淀。</p>
      </div>
      <div class="about-section">
        <h3>愿景</h3>
        <p>成为中文世界性别友好语言研究的权威数字辞书、共创平台与事件协作还原中心。</p>
      </div>
      <div class="about-section">
        <h3>价值观</h3>
        <p>学术严谨 · 平权立场 · 开放共创 · 合规理性<br>立场在考证里，不在口号里。</p>
      </div>
      <div class="about-section">
        <h3>项目立场</h3>
        <p>· 批判结构（父权制），不本质化任何性别<br>· 不理想化女性：女性也可共谋、可横向压迫，批判具体行为而非污名群体<br>· 男性也是被规训的对象（词典收录男性歧视用词）<br>· 事件讨论聚焦"语言偏见如何运作"，不收录与语言偏见无关的通用谣言</p>
      </div>
      <div class="about-section">
        <h3>参考文献</h3>
        <ul class="about-list">
          <li>《说文解字》</li>
          <li>联合国《中文性别包容性语言指南》</li>
          <li>CORGI-PM 中文性别偏见语料库</li>
          <li>《现代汉语词典》第7版</li>
          <li>台湾 Cofacts 众包辟谣平台（事件拆解方法论参考）</li>
          <li>PNAS Community Notes 众包辟谣实证研究（2025）</li>
          <li>InVID/WeVerify 视频/图片溯源工具（事件溯源工具箱）</li>
          <li>中国互联网联合辟谣平台</li>
        </ul>
      </div>
      <div class="about-section">
        <h3>数据来源</h3>
        <ul class="about-list">
          <li>古籍文献考证（自主整理）</li>
          <li>联合国《中文性别包容性语言指南》对照表</li>
          <li>开源性别偏见数据集（CORGI-PM）</li>
          <li>社区共建提议（词条讨论）</li>
          <li>社区众包提交（事件讨论溯源）</li>
        </ul>
      </div>
      <div class="about-section">
        <h3>社区两大模块</h3>
        <p><b>词条讨论</b>（六步闭环）：提议 → 讨论 → AI总结 → 三级审核 → 入册 → 分发<br><b>事件讨论</b>（七步闭环）：现象/事件 → 拆解讨论 → AI事件总结 → 应对方案 → 三级审核 → 入库 → 推流<br>事件讨论参考 Cofacts 众包模式，溯源基于社区提交聚合（非系统自动追踪），事件不直接进词库，通过关联词条回流。</p>
      </div>
      <div class="about-section">
        <h3>审核机制 / 资深审核员</h3>
        <p>采用匿名共审机制，审核员身份不公开，依据来源可信度与社区共识终审。<br>参考维基百科治理模式：放弃专家实名认证，依靠可靠来源共识。<br>（Demo 阶段为 mock 展示，正式运营需建立审核员招募与轮换制度）</p>
      </div>
      <div class="about-section">
        <h3>三级审核机制（匿名共审）</h3>
        <p>① 机器初筛（敏感词库 + AI 内容安全）<br>② 社区共审（3+ 位匿名审核员投票，达成共识方可推进）<br>③ 资深审核员终审（匿名，依据来源可信度与立场平衡）</p>
      </div>
      <div class="cross-tab-link" onclick="app.switchTab('dictionary');app.closeSubpage()">📖 开始查阅词条 →</div>
    `;
  },

  renderFeedbackHTML() {
    return `
      <div class="subpage-section">
        <h3>反馈建议</h3>
        <p style="font-size:var(--font-size-sm);color:var(--color-text);opacity:0.8;margin-bottom:var(--space-sm)">
          欢迎反馈使用体验、提议新词条、报告问题。我们会认真阅读每一条反馈。
        </p>
        <textarea class="feedback-textarea" id="feedback-text" placeholder="请输入你的反馈……"></textarea>
        <button class="btn-primary" style="margin-top:var(--space-md)" onclick="app.submitFeedback()">提交反馈</button>
      </div>
      <div class="cross-tab-link secondary" onclick="app.switchTab('community');app.closeSubpage()">💬 或去社区直接提议 →</div>
    `;
  },

  submitFeedback() {
    const text = document.getElementById('feedback-text').value.trim();
    if (!text) {
      alert('请输入反馈内容');
      return;
    }
    alert('反馈已收到，感谢你的支持！');
    this.closeSubpage();
  },

  // ========== 设置 ==========
  applySettings() {
    document.body.className = '';
    if (this.settings.theme === 'dark') document.body.classList.add('dark-mode');
    document.body.classList.add(`font-${this.settings.fontSize}`);
  },

  // ========== 事件绑定 ==========
  bindEvents() {
    this.bindOnboarding();

    // 搜索
    const searchInput = document.getElementById('search-input');
    let debounceTimer = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.handleSearch(e.target.value);
      }, 200);
    });
    // Enter 键记录搜索历史
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.value.trim()) {
        this.addSearchHistory(e.target.value);
        e.target.blur();
      }
    });
    // 聚焦且无输入时显示搜索历史
    searchInput.addEventListener('focus', () => {
      if (!searchInput.value.trim()) this.renderSearchHistory();
    });

    // 浏览器后退 / Android 返回键：关闭浮层
    window.addEventListener('popstate', () => {
      if (this.overlayOpenCount > 0) this.closeAllOverlays();
    });

    // Esc 键关闭最外层浮层（无障碍）
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (this.overlayOpenCount > 0) {
        // 优先关表单浮层，再依次关其他
        if (!document.getElementById('proposal-form-overlay').classList.contains('hidden')) {
          this.closeProposalForm();
        } else if (!document.getElementById('detail-overlay').classList.contains('hidden')) {
          this.closeDetail();
        } else if (!document.getElementById('proposal-overlay').classList.contains('hidden')) {
          this.closeProposal();
        } else if (!document.getElementById('event-overlay').classList.contains('hidden')) {
          this.closeEvent();
        } else if (!document.getElementById('subpage-overlay').classList.contains('hidden')) {
          this.closeSubpage();
        }
      }
    });

    // 无障碍：role="button" 元素支持 Enter / Space 触发点击（键盘可达）
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = e.target;
      if (el && el.getAttribute && el.getAttribute('role') === 'button') {
        e.preventDefault();
        el.click();
      }
    });
  },

  // ========== 工具函数 ==========
  escapeHTML(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  // 高亮关键词：先转义 HTML，再用 <mark> 包裹匹配项（大小写不敏感）
  highlight(text, keyword) {
    const safe = this.escapeHTML(text);
    if (!keyword) return safe;
    // 转义正则特殊字符，避免关键词含 ( ) * 等导致报错
    const kw = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safe.replace(new RegExp(kw, 'gi'), (m) => `<mark>${m}</mark>`);
  },

  truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '...' : str;
  },

  getStatusClass(status) {
    const map = { published: 'published', under_review: 'review', draft: 'discussion' };
    return map[status] || 'discussion';
  },

  getStatusText(status) {
    const map = { published: '已发布', under_review: '审核中', draft: '草稿' };
    return map[status] || status;
  }
};

// 启动
document.addEventListener('DOMContentLoaded', () => app.init());
