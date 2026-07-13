/**
 * 医知通 - 主应用逻辑
 * 路由管理 + 页面渲染 + 交互处理
 */

const App = {
  currentPage: 'home',
  searchHistory: [],
  searchDebounceTimer: null,
  checkerSelectedDrugs: [], // 多药交互检查器选中的药品
  checkerSearchResults: [], // 检查器搜索结果

  // ========== 初始化 ==========
  init() {
    this.loadSearchHistory();
    this.bindEvents();
    this.render();
    // 初始路由
    const hash = window.location.hash.slice(1);
    if (hash) {
      this.handleHashChange(hash);
    } else {
      this.navigate('home');
    }
    
    window.addEventListener('hashchange', () => {
      const h = window.location.hash.slice(1);
      this.handleHashChange(h);
    });
  },

  handleHashChange(hash) {
    if (!hash) {
      this.currentPage = 'home';
      this.render();
      return;
    }

    const parts = hash.split('/');
    const page = parts[0];
    
    if (page === 'drug' && parts[1]) {
      this.currentPage = 'drug-detail';
      this.currentParams = { id: parts[1] };
    } else if (page === 'lab' && parts[1]) {
      this.currentPage = 'lab-detail';
      this.currentParams = { id: parts[1] };
    } else if (page === 'search') {
      this.currentPage = 'search';
      this.currentParams = { query: decodeURIComponent(parts[1] || '') };
    } else if (page === 'category') {
      this.currentPage = 'category';
      this.currentParams = { type: parts[1] || 'drug' };
    } else if (page === 'history') {
      this.currentPage = 'history';
    } else if (page === 'about') {
      this.currentPage = 'about';
    } else if (page === 'interaction-checker') {
      this.currentPage = 'interaction-checker';
    } else if (page === 'lab-interpreter') {
      this.currentPage = 'lab-interpreter';
    } else {
      this.currentPage = 'home';
    }
    
    this.render();
    window.scrollTo(0, 0);
  },

  navigate(page, params = {}) {
    let hash = '';
    switch (page) {
      case 'home':
        hash = '';
        break;
      case 'drug-detail':
        hash = `drug/${params.id}`;
        break;
      case 'lab-detail':
        hash = `lab/${params.id}`;
        break;
      case 'search':
        hash = `search/${encodeURIComponent(params.query)}`;
        break;
      case 'category':
        hash = `category/${params.type}`;
        break;
      case 'history':
        hash = 'history';
        break;
      case 'about':
        hash = 'about';
        break;
      case 'interaction-checker':
        hash = 'interaction-checker';
        break;
      case 'lab-interpreter':
        hash = 'lab-interpreter';
        break;
    }
    window.location.hash = hash;
  },

  // ========== 事件绑定 ==========
  bindEvents() {
    // 搜索表单提交
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'search-form') {
        e.preventDefault();
        const input = e.target.querySelector('.search-input');
        const query = input.value.trim();
        if (query) {
          this.saveSearchHistory(query);
          this.navigate('search', { query });
        }
      }
    });

    // 搜索输入实时联想
    document.addEventListener('input', (e) => {
      if (e.target.classList && e.target.classList.contains('search-input') && !e.target.classList.contains('checker-drug-input')) {
        this.handleSearchInput(e.target);
      }
      // 检查器药品搜索
      if (e.target.classList && e.target.classList.contains('checker-drug-input')) {
        this.handleCheckerDrugInput(e.target);
      }
      // 分类页筛选
      if (e.target.classList && e.target.classList.contains('category-search-input')) {
        this.handleCategoryFilter(e.target);
      }
    });

    // 检验解读器 - 选择变化时更新单位
    document.addEventListener('change', (e) => {
      if (e.target.id === 'lab-select') {
        const lab = SearchEngine.getLabById(e.target.value);
        const unitEl = document.getElementById('lab-unit');
        const refEl = document.getElementById('ref-preview');
        if (lab && unitEl) {
          unitEl.textContent = lab.unit;
        } else if (unitEl) {
          unitEl.textContent = '—';
        }
        if (lab && refEl) {
          const refs = Object.entries(lab.referenceRange).map(([k, v]) => 
            `<div class="ref-preview-row"><span>${this.translateRefKey(k)}</span><span>${v} ${lab.unit}</span></div>`
          ).join('');
          refEl.innerHTML = `<div class="ref-preview-title">参考范围</div>${refs}`;
        } else if (refEl) {
          refEl.innerHTML = '';
        }
      }
    });

    // 点击其他地方关闭联想
    document.addEventListener('click', (e) => {
      const suggestions = document.getElementById('suggestions');
      if (suggestions && !e.target.closest('.search-container')) {
        suggestions.style.display = 'none';
      }
    });
  },

  // ========== 检查器药品搜索 ==========
  handleCheckerDrugInput(input) {
    clearTimeout(this.searchDebounceTimer);
    const value = input.value.trim();

    this.searchDebounceTimer = setTimeout(() => {
      const suggestions = document.getElementById('checker-suggestions');
      if (!suggestions) return;

      if (value.length < 1) {
        suggestions.style.display = 'none';
        return;
      }

      const items = SearchEngine.getSuggestions(value);
      if (items.length === 0) {
        suggestions.style.display = 'none';
        return;
      }

      suggestions.innerHTML = items.map(item => {
        const icon = item.type === 'drug' ? 'pill' : 'test-tube';
        const typeLabel = item.type === 'drug' ? '药品' : '检验';
        return `
          <div class="suggestion-item checker-suggestion" data-name="${this.escapeHtml(item.text)}">
            <span class="suggestion-icon ${item.type}">${this.getIcon(icon)}</span>
            <span class="suggestion-text">${this.escapeHtml(item.text)}</span>
            <span class="suggestion-tag">${typeLabel}</span>
          </div>
        `;
      }).join('');

      suggestions.style.display = 'block';

      suggestions.querySelectorAll('.checker-suggestion').forEach(el => {
        el.addEventListener('click', () => {
          const name = el.dataset.name;
          // 找到对应药品
          const drug = MEDICAL_DB.drugs.find(d => d.name === name || d.aliases.includes(name));
          if (drug) {
            if (this.checkerSelectedDrugs.find(d => d.id === drug.id)) {
              this.showToast('该药品已添加');
              input.value = '';
              suggestions.style.display = 'none';
              return;
            }
            if (this.checkerSelectedDrugs.length >= 6) {
              this.showToast('最多支持 6 种药品同时检查');
              return;
            }
            this.checkerSelectedDrugs.push(drug);
            input.value = '';
            suggestions.style.display = 'none';
            this.updateCheckerUI();
          }
        });
      });
    }, 200);
  },

  // ========== 分类页筛选 ==========
  handleCategoryFilter(input) {
    const keyword = input.value.trim().toLowerCase();
    const sections = document.querySelectorAll('.category-section');
    sections.forEach(section => {
      const cards = section.querySelectorAll('.info-card');
      let visibleCount = 0;
      cards.forEach(card => {
        const title = card.querySelector('.card-title');
        const subtitle = card.querySelector('.card-subtitle');
        const tags = card.querySelectorAll('.tag');
        const searchText = [
          title ? title.textContent : '',
          subtitle ? subtitle.textContent : '',
          ...Array.from(tags).map(t => t.textContent)
        ].join(' ').toLowerCase();
        if (!keyword || searchText.includes(keyword)) {
          card.style.display = '';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });
      // 隐藏无匹配的分类区域
      section.style.display = (keyword && visibleCount === 0) ? 'none' : '';
    });
  },

  // ========== 搜索联想 ==========
  handleSearchInput(input) {
    clearTimeout(this.searchDebounceTimer);
    const value = input.value.trim();
    
    this.searchDebounceTimer = setTimeout(() => {
      const suggestions = document.getElementById('suggestions');
      if (!suggestions) return;

      if (value.length < 1) {
        suggestions.style.display = 'none';
        return;
      }

      const items = SearchEngine.getSuggestions(value);
      if (items.length === 0) {
        suggestions.style.display = 'none';
        return;
      }

      suggestions.innerHTML = items.map(item => {
        const icon = item.type === 'drug' ? 'pill' : 'test-tube';
        const typeLabel = item.type === 'drug' ? '药品' : '检验';
        const redirectText = item.redirect ? ` → ${item.redirect}` : '';
        return `
          <div class="suggestion-item" data-text="${this.escapeHtml(item.text)}">
            <span class="suggestion-icon ${item.type}">${this.getIcon(icon)}</span>
            <span class="suggestion-text">${this.escapeHtml(item.text)}${redirectText}</span>
            <span class="suggestion-tag">${typeLabel}</span>
          </div>
        `;
      }).join('');

      suggestions.style.display = 'block';

      // 绑定点击事件
      suggestions.querySelectorAll('.suggestion-item').forEach(el => {
        el.addEventListener('click', () => {
          const text = el.dataset.text;
          input.value = text;
          suggestions.style.display = 'none';
          this.saveSearchHistory(text);
          this.navigate('search', { query: text });
        });
      });
    }, 200);
  },

  // ========== 搜索历史 ==========
  loadSearchHistory() {
    try {
      const saved = localStorage.getItem('yzt_search_history');
      this.searchHistory = saved ? JSON.parse(saved) : [];
    } catch (e) {
      this.searchHistory = [];
    }
  },

  saveSearchHistory(query) {
    // 去重
    this.searchHistory = this.searchHistory.filter(h => h !== query);
    this.searchHistory.unshift(query);
    // 只保留20条
    this.searchHistory = this.searchHistory.slice(0, 20);
    try {
      localStorage.setItem('yzt_search_history', JSON.stringify(this.searchHistory));
    } catch (e) {
      console.warn('无法保存搜索历史');
    }
  },

  clearHistory() {
    this.searchHistory = [];
    try {
      localStorage.removeItem('yzt_search_history');
    } catch (e) {}
    this.render();
  },

  // ========== 图标 ==========
  getIcon(name) {
    const icons = {
      'pill': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5l-2-2-9-9z" opacity=".3"/><path d="M4.2 12.2l3.6 3.6 6.4-6.4-3.6-3.6a1 1 0 0 0-1.4 0L4.2 10.8a1 1 0 0 0 0 1.4zm15.6-1.4L14 5 7.6 11.4 11 14.8l3.6 3.6 5.2-5.2a1 1 0 0 0 0-1.4z"/></svg>',
      'test-tube': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 2v2h1v12.5a3.5 3.5 0 0 0 7 0V4h1V2H9zm5 14.5a1.5 1.5 0 0 1-3 0V9h3v7.5z"/></svg>',
      'search': '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
      'warning': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
      'check': '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>',
      'info': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>',
      'source': '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3.9 12c0-1.7 1.4-3.1 3.1-3.1h4V7H7c-2.8 0-5 2.2-5 5s2.2 5 5 5h4v-1.9H7c-1.7 0-3.1-1.4-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.7 0 3.1 1.4 3.1 3.1s-1.4 3.1-3.1 3.1h-4V17h4c2.8 0 5-2.2 5-5s-2.2-5-5-5z"/></svg>',
      'home': '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      'grid': '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
      'clock': '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      'user': '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      'arrow-left': '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
      'arrow-right': '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
      'shield': '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
    };
    return icons[name] || '';
  },

  // ========== 渲染主入口 ==========
  render() {
    const app = document.getElementById('app');
    
    switch (this.currentPage) {
      case 'home':
        app.innerHTML = this.renderHome();
        break;
      case 'search':
        app.innerHTML = this.renderSearch(this.currentParams.query);
        this.executeSearch(this.currentParams.query);
        break;
      case 'drug-detail':
        app.innerHTML = this.renderDrugDetail(this.currentParams.id);
        break;
      case 'lab-detail':
        app.innerHTML = this.renderLabDetail(this.currentParams.id);
        break;
      case 'category':
        app.innerHTML = this.renderCategory(this.currentParams.type);
        break;
      case 'history':
        app.innerHTML = this.renderHistory();
        break;
      case 'about':
        app.innerHTML = this.renderAbout();
        break;
      case 'interaction-checker':
        app.innerHTML = this.renderInteractionChecker();
        break;
      case 'lab-interpreter':
        app.innerHTML = this.renderLabInterpreter();
        break;
    }

    // 更新底部Tab高亮
    this.updateTabBar();
  },

  // ========== 首页 ==========
  renderHome() {
    const hot = SearchEngine.getHotItems();
    
    return `
      <div class="page home-page">
        <!-- 顶部品牌区 -->
        <div class="home-header">
          <div class="brand">
            <div class="brand-logo">
              ${this.getIcon('shield')}
            </div>
            <div class="brand-text">
              <h1>医知通</h1>
              <p>临床知识智能速查助手</p>
            </div>
          </div>
        </div>

        <!-- 搜索区 -->
        <div class="search-section">
          <div class="search-container">
            <form id="search-form">
              <div class="search-box">
                <span class="search-icon">${this.getIcon('search')}</span>
                <input type="text" class="search-input" placeholder="搜索药品、检验指标，或直接提问..." autocomplete="off">
                <button type="submit" class="search-btn">搜索</button>
              </div>
            </form>
            <div id="suggestions" class="suggestions-dropdown" style="display:none;"></div>
          </div>
        </div>

        <!-- 智能问答推荐 -->
        <div class="section">
          <div class="section-title">
            <span class="section-icon">${this.getIcon('info')}</span>
            <span>智能问答 · 一键体验</span>
          </div>
          <div class="faq-grid">
            ${MEDICAL_DB.faqs.slice(0, 6).map(faq => {
              // 根据问题内容选择图标
              const isWarning = /能.*喝|酒|禁忌|不能|冲突|副作用/.test(faq.question);
              const iconType = isWarning ? 'warning' : 'info';
              const iconClass = isWarning ? 'faq-icon-warn' : 'faq-icon-info';
              return `
              <div class="faq-card" data-question="${this.escapeHtml(faq.question)}" data-target="${faq.target || ''}">
                <div class="faq-icon ${iconClass}">${this.getIcon(iconType)}</div>
                <div class="faq-text">${faq.question}</div>
              </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 快速分类入口 -->
        <div class="section">
          <div class="section-title">
            <span class="section-icon">${this.getIcon('grid')}</span>
            <span>快速入口</span>
          </div>
          <div class="quick-entry">
            <div class="entry-card drug-entry" data-page="category" data-type="drug">
              <div class="entry-icon drug-icon">${this.getIcon('pill')}</div>
              <div class="entry-label">药品查询</div>
              <div class="entry-count">${MEDICAL_DB.drugs.length}种</div>
            </div>
            <div class="entry-card lab-entry" data-page="category" data-type="lab">
              <div class="entry-icon lab-icon">${this.getIcon('test-tube')}</div>
              <div class="entry-label">检验指标</div>
              <div class="entry-count">${MEDICAL_DB.labs.length}项</div>
            </div>
          </div>
        </div>

        <!-- 临床工具 -->
        <div class="section">
          <div class="section-title">
            <span class="section-icon">${this.getIcon('shield')}</span>
            <span>临床工具</span>
          </div>
          <div class="tool-entry">
            <div class="tool-entry-card checker-entry" data-page="interaction-checker">
              <div class="tool-entry-icon checker-icon">${this.getIcon('warning')}</div>
              <div class="tool-entry-info">
                <div class="tool-entry-label">多药交互检查器</div>
                <div class="tool-entry-desc">检查多种药品间的相互作用</div>
              </div>
              <span class="tool-entry-arrow">${this.getIcon('arrow-right')}</span>
            </div>
            <div class="tool-entry-card interpreter-entry" data-page="lab-interpreter">
              <div class="tool-entry-icon interpreter-icon">${this.getIcon('test-tube')}</div>
              <div class="tool-entry-info">
                <div class="tool-entry-label">检验值解读器</div>
                <div class="tool-entry-desc">输入数值自动判断异常及原因</div>
              </div>
              <span class="tool-entry-arrow">${this.getIcon('arrow-right')}</span>
            </div>
          </div>
        </div>

        <!-- 热门药品 -->
        <div class="section">
          <div class="section-title">
            <span class="section-icon">${this.getIcon('pill')}</span>
            <span>常用药品</span>
            <span class="section-more" data-page="category" data-type="drug">全部 ></span>
          </div>
          <div class="card-list">
            ${hot.hotDrugs.map(drug => `
              <div class="info-card drug-card" data-type="drug" data-id="${drug.id}">
                <div class="card-header">
                  <div class="card-left-bar drug-bar"></div>
                  <div class="card-title-area">
                    <div class="card-title">${drug.name}</div>
                    <div class="card-subtitle">${drug.category}</div>
                  </div>
                </div>
                <div class="card-tags">
                  ${drug.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="card-source">
                  ${this.getIcon('source')} ${drug.source}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 热门检验 -->
        <div class="section">
          <div class="section-title">
            <span class="section-icon">${this.getIcon('test-tube')}</span>
            <span>常用检验</span>
            <span class="section-more" data-page="category" data-type="lab">全部 ></span>
          </div>
          <div class="card-list">
            ${hot.hotLabs.map(lab => `
              <div class="info-card lab-card" data-type="lab" data-id="${lab.id}">
                <div class="card-header">
                  <div class="card-left-bar lab-bar"></div>
                  <div class="card-title-area">
                    <div class="card-title">${lab.name}</div>
                    <div class="card-subtitle">${lab.category} · ${lab.unit}</div>
                  </div>
                </div>
                <div class="card-tags">
                  ${lab.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="card-source">
                  ${this.getIcon('source')} ${lab.source}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="home-footer">
          <p>医知通 · 仅供医学专业人士参考</p>
          <p>数据来源均已标注，请以最新药品说明书为准</p>
        </div>
      </div>
    `;
  },

  // ========== 搜索结果页 ==========
  renderSearch(query) {
    return `
      <div class="page search-page">
        <div class="page-header">
          <div class="search-container">
            <form id="search-form">
              <div class="search-box">
                <span class="search-icon">${this.getIcon('search')}</span>
                <input type="text" class="search-input" value="${this.escapeHtml(query)}" placeholder="搜索药品、检验指标，或直接提问..." autocomplete="off">
                <button type="submit" class="search-btn">搜索</button>
              </div>
            </form>
            <div id="suggestions" class="suggestions-dropdown" style="display:none;"></div>
          </div>
        </div>
        <div id="search-results" class="search-results">
          <div class="loading">
            <div class="loading-spinner"></div>
            <p>正在搜索"${this.escapeHtml(query)}"...</p>
          </div>
        </div>
      </div>
    `;
  },

  executeSearch(query) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    // 先执行本地搜索（同步，无延迟）
    const result = SearchEngine.search(query);
    resultsContainer.innerHTML = this.renderSearchResults(result, query);
    this.bindCardClicks();

    // AI 问答仅在用户点击"让AI回答这个问题"按钮时触发，不自动调用
  },

  executeAISearch(query, container) {
    // 检查是否配置了API Key
    if (!window.AI_CONFIG || !AI_CONFIG.apiKey) {
      const noKeyHtml = `
        <div class="ai-error-card">
          <div class="smart-badge ai-badge">AI 智能问答</div>
          <p class="ai-error-msg">尚未配置 API Key</p>
          <p class="ai-error-detail">请在"我的 → AI 设置"中配置 DeepSeek API Key</p>
        </div>
      `;
      container.innerHTML = container.innerHTML + noKeyHtml;
      return;
    }

    // 显示AI加载状态
    const aiLoadingHtml = `
      <div class="ai-loading-card" id="ai-loading-card">
        <div class="ai-loading-header">
          <div class="smart-badge ai-badge">AI 智能问答</div>
        </div>
        <div class="ai-loading-body">
          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
          <p>AI 正在思考您的问题...</p>
        </div>
      </div>
      <div class="ai-stream-area" id="ai-stream-area" style="display:none;">
        <div class="ai-answer-card">
          <div class="ai-answer-header">
            <div class="smart-badge ai-badge">AI 智能问答</div>
            <span class="ai-query-text">"${this.escapeHtml(query)}"</span>
          </div>
          <div class="ai-answer-body" id="ai-stream-text"></div>
        </div>
      </div>
    `;
    // 追加AI加载区域
    container.innerHTML = container.innerHTML + aiLoadingHtml;

    // 构建上下文（从知识库中提取相关信息）
    const context = SearchEngine.buildAIContext(query);

    const loadingCard = document.getElementById('ai-loading-card');
    const streamArea = document.getElementById('ai-stream-area');
    const streamText = document.getElementById('ai-stream-text');
    let firstChunk = true;

    // 使用流式调用实现打字机效果
    AIEngine.askStream(query, context, (fullText) => {
      if (firstChunk && fullText.length > 0) {
        firstChunk = false;
        // 隐藏加载动画，显示流式输出区域
        if (loadingCard) loadingCard.style.display = 'none';
        if (streamArea) streamArea.style.display = 'block';
      }
      if (streamText) {
        streamText.innerHTML = this.formatAIAnswer(fullText);
      }
    })
      .then(fullAnswer => {
        if (fullAnswer) {
          // 流式输出完成后，补充底部信息
          const result = { aiAnswer: fullAnswer, results: [], highlights: [] };
          const localResult = SearchEngine.search(query, { limit: 5 });
          result.results = localResult.results;

          // 替换为完整渲染（含来源标注和底部信息）
          const fullHtml = this.renderAIAnswer(result, query);
          // 移除加载和流式区域
          if (loadingCard) loadingCard.remove();
          if (streamArea) streamArea.remove();
          container.innerHTML = container.innerHTML + fullHtml;
          this.bindCardClicks();
        }
      })
      .catch(err => {
        const errHtml = `
          <div class="ai-error-card">
            <div class="smart-badge ai-badge">AI 智能问答</div>
            <p class="ai-error-msg">AI 问答暂时不可用，请稍后重试</p>
            <p class="ai-error-detail">${this.escapeHtml(err.message || '未知错误')}</p>
          </div>
        `;
        if (loadingCard) loadingCard.remove();
        if (streamArea) streamArea.remove();
        container.innerHTML = container.innerHTML + errHtml;
      });
  },

  renderSearchResults(result, query) {
    if (result.results.length === 0 && !(result.highlights && result.highlights.length > 0)) {
      // 先尝试AI问答fallback
      if (result.aiAnswer) {
        return this.renderAIAnswer(result, query);
      }
      return `
        <div class="no-results">
          <div class="no-results-icon">${this.getIcon('search')}</div>
          <h3>未找到相关结果</h3>
          <p>没有找到与"${this.escapeHtml(query)}"相关的内容</p>
          <div class="search-tips">
            <p>搜索建议：</p>
            <ul>
              <li>尝试使用药品通用名（如"阿司匹林"而非"拜阿司匹灵"）</li>
              <li>尝试使用检验指标缩写（如"WBC"、"ALT"）</li>
              <li>直接提问，如"头孢能喝酒吗"</li>
              <li>或点击下方"AI问答"让AI为您解答</li>
            </ul>
          </div>
          <button class="ai-fallback-btn" data-ai-query="${this.escapeHtml(query)}">
            ${this.getIcon('info')} 让AI回答这个问题
          </button>
        </div>
      `;
    }

    let html = '';

    // 智能问答高亮（与常规搜索结果并存，不再遮蔽）
    if (result.highlights && result.highlights.length > 0) {
      html += `
        <div class="smart-answer-banner">
          <div class="smart-badge">智能问答</div>
          <div class="smart-query">"${this.escapeHtml(query)}"</div>
        </div>
      `;

      // 渲染高亮信息
      for (const h of result.highlights) {
        // 找到关联的item
        let relatedItem = null;
        // 从高亮内容中尝试找到相关药品/检验
        if (result.entities && result.entities.drugs) {
          relatedItem = MEDICAL_DB.drugs.find(d => result.entities.drugs.includes(d.name));
        }
        if (!relatedItem && result.entities && result.entities.labs) {
          relatedItem = MEDICAL_DB.labs.find(l => result.entities.labs.includes(l.name));
        }
        html += this.renderHighlight(h, relatedItem || { name: '相关条目', id: '' });
      }
    }

    // AI回答
    if (result.aiAnswer) {
      html += this.renderAIAnswer(result, query);
    }

    // 搜索结果计数
    if (result.results.length > 0) {
      html += `
        <div class="result-count">
          找到 ${result.results.length} 条相关结果
        </div>
      `;
    }

    // 渲染结果卡片
    for (const r of result.results) {
      if (r.type === 'drug') {
        html += this.renderDrugCard(r.item);
      } else if (r.type === 'lab') {
        html += this.renderLabCard(r.item);
      }
    }

    // 本地有结果时也提供AI问答入口，让用户自主选择
    if (!result.aiAnswer) {
      // 结果超过5条时，浮动显示AI入口按钮
      const floatingClass = result.results.length > 5 ? ' floating' : '';
      html += `
        <div class="ai-prompt-section${floatingClass}">
          <p class="ai-prompt-text">没有找到您想要的答案？</p>
          <button class="ai-fallback-btn" data-ai-query="${this.escapeHtml(query)}">
            ${this.getIcon('info')} 让AI回答这个问题
          </button>
        </div>
      `;
    }

    return html;
  },

  renderAIAnswer(result, query) {
    let html = `
      <div class="smart-answer-banner ai-banner">
        <div class="smart-badge ai-badge">AI 智能问答</div>
        <div class="smart-query">"${this.escapeHtml(query)}"</div>
      </div>
      <div class="ai-answer-card">
        <div class="ai-answer-content">${this.formatAIAnswer(result.aiAnswer)}</div>
        <div class="ai-answer-footer">
          <span class="ai-powered">由 DeepSeek AI 提供支持</span>
        </div>
      </div>
    `;
    if (result.results && result.results.length > 0) {
      html += `<div class="result-count">相关知识库条目</div>`;
      for (const r of result.results) {
        if (r.type === 'drug') {
          html += this.renderDrugCard(r.item);
        } else if (r.type === 'lab') {
          html += this.renderLabCard(r.item);
        }
      }
    }
    return html;
  },

  formatAIAnswer(text) {
    if (!text) return '';
    // 基本的 markdown 格式化
    let html = this.escapeHtml(text);
    // 加粗 **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // 标题 ### text
    html = html.replace(/^### (.+)$/gm, '<div class="ai-h3">$1</div>');
    // 列表项 - text 或 * text
    html = html.replace(/^[\-\*] (.+)$/gm, '<div class="ai-li">$1</div>');
    // 换行
    html = html.replace(/\n/g, '<br>');
    return html;
  },

  renderHighlight(highlight, item) {
    const severityClass = `severity-${highlight.severity}`;
    const typeIcon = {
      'warning': this.getIcon('warning'),
      'contraindication': this.getIcon('warning'),
      'caution': this.getIcon('info'),
      'info': this.getIcon('info')
    };

    return `
      <div class="highlight-card ${severityClass}">
        <div class="highlight-header">
          <span class="highlight-icon">${typeIcon[highlight.type] || this.getIcon('info')}</span>
          <span class="highlight-title">${highlight.title}</span>
          ${highlight.severity === 'high' ? '<span class="severity-badge">高风险</span>' : ''}
          ${highlight.severity === 'medium' ? '<span class="severity-badge medium">中等风险</span>' : ''}
        </div>
        <div class="highlight-content">${highlight.content}</div>
        <div class="highlight-related">
          相关条目：<span class="related-link" data-type="${item.id.startsWith('d') ? 'drug' : 'lab'}" data-id="${item.id}">${item.name}</span>
        </div>
      </div>
    `;
  },

  renderDrugCard(drug) {
    return `
      <div class="info-card drug-card" data-type="drug" data-id="${drug.id}">
        <div class="card-header">
          <div class="card-left-bar drug-bar"></div>
          <div class="card-title-area">
            <div class="card-title">${drug.name}</div>
            <div class="card-subtitle">${drug.category}</div>
          </div>
          <div class="card-type-badge drug-badge">药品</div>
        </div>
        <div class="card-body">
          <div class="card-field">
            <span class="field-label">适应症</span>
            <span class="field-value">${this.truncate(drug.indication, 60)}</span>
          </div>
        </div>
        <div class="card-tags">
          ${drug.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="card-source">
          ${this.getIcon('source')} 数据来源：${drug.source}
        </div>
      </div>
    `;
  },

  renderLabCard(lab) {
    const refValue = lab.referenceRange.adult || lab.referenceRange.normal || Object.values(lab.referenceRange)[0];
    return `
      <div class="info-card lab-card" data-type="lab" data-id="${lab.id}">
        <div class="card-header">
          <div class="card-left-bar lab-bar"></div>
          <div class="card-title-area">
            <div class="card-title">${lab.name}</div>
            <div class="card-subtitle">${lab.category} · 参考范围：${refValue} ${lab.unit}</div>
          </div>
          <div class="card-type-badge lab-badge">检验</div>
        </div>
        <div class="card-body">
          <div class="card-field">
            <span class="field-label">临床意义</span>
            <span class="field-value">${this.truncate(lab.clinicalSignificance, 60)}</span>
          </div>
        </div>
        <div class="card-tags">
          ${lab.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="card-source">
          ${this.getIcon('source')} 数据来源：${lab.source}
        </div>
      </div>
    `;
  },

  // ========== 药品详情页 ==========
  renderDrugDetail(id) {
    const drug = SearchEngine.getDrugById(id);
    if (!drug) {
      return `<div class="page"><div class="error-state"><p>未找到该药品信息</p></div></div>`;
    }

    return `
      <div class="page detail-page">
        <div class="detail-header drug-theme">
          <div class="detail-back" data-back>
            ${this.getIcon('arrow-left')}
          </div>
          <div class="detail-type">药品详情</div>
          <div class="detail-fav-btn ${this.isFavorited('drug', drug.id) ? 'favorited' : ''}" data-action="toggle-favorite" data-fav-type="drug" data-fav-id="${drug.id}" data-fav-name="${this.escapeHtml(drug.name)}" data-fav-category="${this.escapeHtml(drug.category)}">
            ${this.isFavorited('drug', drug.id) ? this.getIcon('check') : this.getIcon('shield')}
          </div>
        </div>
        
        <div class="detail-hero drug-theme">
          <div class="hero-icon">${this.getIcon('pill')}</div>
          <h1 class="hero-title">${drug.name}</h1>
          <div class="hero-category">${drug.category}</div>
          <div class="hero-aliases">
            ${drug.aliases.map(a => `<span class="alias-chip">${a}</span>`).join('')}
          </div>
          <div class="hero-tags">
            ${drug.tags.map(tag => `<span class="tag tag-light">${tag}</span>`).join('')}
          </div>
        </div>

        <div class="detail-body">
          <!-- 适应症 -->
          <div class="detail-section">
            <div class="detail-section-title">
              ${this.getIcon('info')} 适应症
            </div>
            <div class="detail-section-content">${drug.indication}</div>
          </div>

          <!-- 用法用量 -->
          <div class="detail-section">
            <div class="detail-section-title info-theme">
              ${this.getIcon('info')} 用法用量
            </div>
            <div class="detail-section-content">${drug.dosage}</div>
            <div class="detail-note">提示：具体用药请遵医嘱，个体化给药</div>
          </div>

          <!-- 禁忌 -->
          <div class="detail-section">
            <div class="detail-section-title danger-theme">
              ${this.getIcon('warning')} 禁忌
            </div>
            <div class="detail-list danger-list">
              ${drug.contraindications.map(c => `<div class="list-item danger-item">${c}</div>`).join('')}
            </div>
          </div>

          <!-- 不良反应 -->
          <div class="detail-section">
            <div class="detail-section-title caution-theme">
              ${this.getIcon('warning')} 不良反应
            </div>
            <div class="detail-list">
              ${drug.adverseReactions.map(r => `<div class="list-item">${r}</div>`).join('')}
            </div>
          </div>

          <!-- 药物相互作用 -->
          <div class="detail-section">
            <div class="detail-section-title interaction-theme">
              ${this.getIcon('warning')} 药物相互作用
            </div>
            <div class="interaction-list">
              ${drug.interactions.map(i => `
                <div class="interaction-item severity-${i.severity}">
                  <div class="interaction-drug">
                    <span class="interaction-name">${i.drug}</span>
                    ${i.severity === 'high' ? '<span class="severity-tag high">高风险</span>' : ''}
                    ${i.severity === 'medium' ? '<span class="severity-tag medium">中风险</span>' : ''}
                    ${i.severity === 'low' ? '<span class="severity-tag low">低风险</span>' : ''}
                  </div>
                  <div class="interaction-effect">${i.effect}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 妊娠分级 -->
          <div class="detail-section">
            <div class="detail-section-title">
              ${this.getIcon('shield')} 妊娠期用药分级
            </div>
            <div class="detail-section-content">
              <span class="pregnancy-badge">${drug.pregnancyCategory}</span>
              <span class="pregnancy-desc">${this.getPregnancyDescription(drug.pregnancyCategory)}</span>
            </div>
          </div>

          <!-- 数据来源 -->
          <div class="detail-source">
            <div class="source-header">
              ${this.getIcon('source')} 数据来源
            </div>
            <div class="source-title">${drug.source}</div>
            <div class="source-detail">${drug.sourceDetail}</div>
            <div class="source-note">
              本信息仅供参考，请以最新版药品说明书为准。临床用药请遵循医嘱。
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ========== 检验指标详情页 ==========
  renderLabDetail(id) {
    const lab = SearchEngine.getLabById(id);
    if (!lab) {
      return `<div class="page"><div class="error-state"><p>未找到该检验指标信息</p></div></div>`;
    }

    return `
      <div class="page detail-page">
        <div class="detail-header lab-theme">
          <div class="detail-back" data-back>
            ${this.getIcon('arrow-left')}
          </div>
          <div class="detail-type">检验指标</div>
          <div class="detail-fav-btn ${this.isFavorited('lab', lab.id) ? 'favorited' : ''}" data-action="toggle-favorite" data-fav-type="lab" data-fav-id="${lab.id}" data-fav-name="${this.escapeHtml(lab.name)}" data-fav-category="${this.escapeHtml(lab.category)}">
            ${this.isFavorited('lab', lab.id) ? this.getIcon('check') : this.getIcon('shield')}
          </div>
        </div>
        
        <div class="detail-hero lab-theme">
          <div class="hero-icon">${this.getIcon('test-tube')}</div>
          <h1 class="hero-title">${lab.name}</h1>
          <div class="hero-category">${lab.category}</div>
          <div class="hero-aliases">
            ${lab.aliases.map(a => `<span class="alias-chip">${a}</span>`).join('')}
          </div>
          <div class="hero-tags">
            ${lab.tags.map(tag => `<span class="tag tag-light">${tag}</span>`).join('')}
          </div>
        </div>

        <div class="detail-body">
          <!-- 参考范围 -->
          <div class="detail-section">
            <div class="detail-section-title info-theme">
              ${this.getIcon('info')} 参考范围
            </div>
            <div class="reference-table">
              ${Object.entries(lab.referenceRange).map(([key, value]) => `
                <div class="ref-row">
                  <span class="ref-label">${this.translateRefKey(key)}</span>
                  <span class="ref-value">${value} ${lab.unit}</span>
                </div>
              `).join('')}
            </div>
            <div class="detail-note">提示：参考范围因实验室方法和试剂不同可能有所差异，请以报告单标注为准</div>
          </div>

          <!-- 临床意义 -->
          <div class="detail-section">
            <div class="detail-section-title">
              ${this.getIcon('info')} 临床意义
            </div>
            <div class="detail-section-content">${lab.clinicalSignificance}</div>
          </div>

          <!-- 升高原因 -->
          <div class="detail-section">
            <div class="detail-section-title danger-theme">
              ${this.getIcon('warning')} 升高的常见原因
            </div>
            <div class="detail-list danger-list">
              ${lab.highCauses.map(c => `<div class="list-item danger-item">${c}</div>`).join('')}
            </div>
          </div>

          <!-- 降低原因 -->
          <div class="detail-section">
            <div class="detail-section-title caution-theme">
              ${this.getIcon('info')} 降低的常见原因
            </div>
            <div class="detail-list">
              ${lab.lowCauses.map(c => `<div class="list-item">${c}</div>`).join('')}
            </div>
          </div>

          <!-- 数据来源 -->
          <div class="detail-source">
            <div class="source-header">
              ${this.getIcon('source')} 数据来源
            </div>
            <div class="source-title">${lab.source}</div>
            <div class="source-detail">${lab.sourceDetail}</div>
            <div class="source-note">
              本信息仅供参考，临床判读需结合患者具体情况综合分析。
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ========== 分类浏览页 ==========
  renderCategory(type) {
    const cats = SearchEngine.getCategories();
    
    let html = `
      <div class="page category-page">
        <div class="page-header">
          <div class="page-title-row">
            <div class="detail-back" data-back>${this.getIcon('arrow-left')}</div>
            <h1 class="page-title">${type === 'drug' ? '药品查询' : '检验指标'}</h1>
          </div>
          <div class="category-search-box">
            <span class="category-search-icon">${this.getIcon('search')}</span>
            <input type="text" class="category-search-input" placeholder="在${type === 'drug' ? '药品' : '检验'}中筛选..." data-cat-filter="${type}">
          </div>
        </div>
        <div class="category-content" id="category-content">
    `;

    if (type === 'drug') {
      for (const [category, drugs] of Object.entries(cats.drugCategories)) {
        html += `
          <div class="section category-section" data-cat-name="${this.escapeHtml(category)}">
            <div class="section-title">
              <span class="section-icon">${this.getIcon('pill')}</span>
              <span>${category}</span>
              <span class="section-count">${drugs.length}</span>
            </div>
            <div class="card-list">
              ${drugs.map(drug => this.renderDrugCard(drug)).join('')}
            </div>
          </div>
        `;
      }
    } else {
      for (const [category, labs] of Object.entries(cats.labCategories)) {
        html += `
          <div class="section category-section" data-cat-name="${this.escapeHtml(category)}">
            <div class="section-title">
              <span class="section-icon">${this.getIcon('test-tube')}</span>
              <span>${category}</span>
              <span class="section-count">${labs.length}</span>
            </div>
            <div class="card-list">
              ${labs.map(lab => this.renderLabCard(lab)).join('')}
            </div>
          </div>
        `;
      }
    }

    html += `</div></div>`;
    return html;
  },

  // ========== 历史记录页 ==========
  renderHistory() {
    return `
      <div class="page history-page">
        <div class="page-header">
          <div class="page-title-row">
            <h1 class="page-title">搜索历史</h1>
            ${this.searchHistory.length > 0 ? '<button class="clear-btn" data-action="clear-history">清空</button>' : ''}
          </div>
        </div>
        ${this.searchHistory.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">${this.getIcon('clock')}</div>
            <p>暂无搜索历史</p>
            <p class="empty-hint">搜索过的内容会显示在这里</p>
          </div>
        ` : `
          <div class="history-list">
            ${this.searchHistory.map(h => `
              <div class="history-item" data-query="${this.escapeHtml(h)}">
                <span class="history-icon">${this.getIcon('clock')}</span>
                <span class="history-text">${this.escapeHtml(h)}</span>
                <span class="history-arrow">${this.getIcon('arrow-right')}</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  // ========== 关于页 ==========
  renderAbout() {
    const favorites = this.loadFavorites();
    const apiKeyConfigured = window.AI_CONFIG && AI_CONFIG.apiKey && AI_CONFIG.apiKey.length > 0;
    const maskedKey = apiKeyConfigured ? AI_CONFIG.apiKey.substring(0, 6) + '****' + AI_CONFIG.apiKey.slice(-4) : '';

    let favoritesHtml = '';
    if (favorites.length === 0) {
      favoritesHtml = '<p class="empty-favorites">暂无收藏，在药品或检验详情页点击收藏按钮即可添加</p>';
    } else {
      favoritesHtml = '<div class="favorites-list">' + favorites.map(fav => `
        <div class="info-card ${fav.type}-card" data-type="${fav.type}" data-id="${fav.id}">
          <div class="card-header">
            <div class="card-left-bar ${fav.type}-bar"></div>
            <div class="card-title-area">
              <div class="card-title">${this.escapeHtml(fav.name)}</div>
              <div class="card-subtitle">${this.escapeHtml(fav.category)}</div>
            </div>
            <div class="card-type-badge ${fav.type}-badge">${fav.type === 'drug' ? '药品' : '检验'}</div>
          </div>
        </div>
      `).join('') + '</div>';
    }

    return `
      <div class="page about-page">
        <div class="page-header">
          <div class="page-title-row">
            <div class="detail-back" data-back>${this.getIcon('arrow-left')}</div>
            <h1 class="page-title">我的</h1>
          </div>
        </div>
        <div class="about-content">
          <div class="about-hero">
            <div class="about-logo">${this.getIcon('shield')}</div>
            <h2>医知通</h2>
            <p>临床知识智能速查助手</p>
          </div>

          <div class="about-section">
            <h3>我的收藏</h3>
            ${favoritesHtml}
          </div>

          <div class="about-section">
            <h3>AI 设置</h3>
            <div class="api-key-section">
              <div class="api-key-status">
                <span class="api-key-label">DeepSeek API Key</span>
                <span class="api-key-value ${apiKeyConfigured ? 'configured' : 'not-configured'}">${apiKeyConfigured ? maskedKey : '未配置'}</span>
              </div>
              <button class="api-key-btn" data-action="configure-api-key">
                ${this.getIcon('info')} ${apiKeyConfigured ? '更换 Key' : '配置 API Key'}
              </button>
              <p class="api-key-hint">配置后即可使用 AI 智能问答功能。Key 保存在本地浏览器中，不会上传服务器。</p>
            </div>
          </div>

          <div class="about-section">
            <h3>核心功能</h3>
            <div class="feature-list">
              <div class="feature-item">
                <span class="feature-icon">${this.getIcon('search')}</span>
                <span>智能搜索：支持药品名称、别名、缩写搜索</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">${this.getIcon('info')}</span>
                <span>自然语言问答：直接提问，智能识别意图</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">${this.getIcon('shield')}</span>
                <span>多药交互检查器：同时检查多种药品间相互作用</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">${this.getIcon('test-tube')}</span>
                <span>检验值解读器：输入数值自动判断异常及原因</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">${this.getIcon('warning')}</span>
                <span>AI 智能问答：基于 DeepSeek 大模型增强回答</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">${this.getIcon('source')}</span>
                <span>来源标注：每条信息标注权威数据来源</span>
              </div>
            </div>
          </div>

          <div class="about-section">
            <h3>数据来源</h3>
            <p>本应用内置数据来源于以下权威参考资料：</p>
            <ul class="source-list">
              <li>《中国国家处方集》（第2版）</li>
              <li>《抗菌药物临床应用指导原则》（2015年版）</li>
              <li>《中国2型糖尿病防治指南》（2020年版）</li>
              <li>《中国高血压防治指南》（2018年修订版）</li>
              <li>《中国成人血脂异常防治指南》（2016年修订版）</li>
              <li>《全国临床检验操作规程》（第4版）</li>
              <li>《临床检验诊断学》</li>
            </ul>
          </div>

          <div class="about-disclaimer">
            <h3>免责声明</h3>
            <p>本应用仅供医学专业人士参考学习使用，不能替代临床医嘱和药品说明书。实际用药请遵循主治医师指导，以最新版药品说明书为准。</p>
          </div>
        </div>
      </div>
    `;
  },

  // ========== 多药交互检查器 ==========
  renderInteractionChecker() {
    return `
      <div class="page tool-page">
        <div class="page-header">
          <div class="page-title-row">
            <div class="detail-back" data-back>${this.getIcon('arrow-left')}</div>
            <h1 class="page-title">多药交互检查器</h1>
          </div>
        </div>

        <div class="tool-body">
          <div class="tool-intro">
            <div class="tool-intro-icon">${this.getIcon('warning')}</div>
            <p>选择 2 种以上药品，自动检查所有药品间的相互作用与风险等级</p>
          </div>

          <!-- 药品搜索区 -->
          <div class="checker-search-section">
            <div class="search-container">
              <div class="search-box">
                <span class="search-icon">${this.getIcon('search')}</span>
                <input type="text" class="search-input checker-drug-input" placeholder="输入药品名称搜索并添加..." autocomplete="off">
              </div>
              <div id="checker-suggestions" class="suggestions-dropdown" style="display:none;"></div>
            </div>
          </div>

          <!-- 已选药品列表 -->
          <div class="selected-drugs-section">
            <div class="section-title">
              <span class="section-icon">${this.getIcon('pill')}</span>
              <span>已选药品</span>
              <span class="section-count">${this.checkerSelectedDrugs.length}</span>
            </div>
            <div id="selected-drugs-list" class="selected-drugs-list">
              ${this.renderSelectedDrugs()}
            </div>
          </div>

          <!-- 检查按钮 -->
          <div class="checker-action">
            <button class="checker-btn ${this.checkerSelectedDrugs.length < 2 ? 'disabled' : ''}" 
                    data-action="run-interaction-check"
                    ${this.checkerSelectedDrugs.length < 2 ? 'disabled' : ''}>
              ${this.getIcon('shield')} 检查相互作用 (${this.checkerSelectedDrugs.length})
            </button>
          </div>

          <!-- 检查结果 -->
          <div id="checker-results"></div>
        </div>
      </div>
    `;
  },

  renderSelectedDrugs() {
    if (this.checkerSelectedDrugs.length === 0) {
      return '<div class="empty-selected">请添加至少 2 种药品</div>';
    }
    return this.checkerSelectedDrugs.map((drug, idx) => `
      <div class="selected-drug-item">
        <span class="selected-drug-icon">${this.getIcon('pill')}</span>
        <span class="selected-drug-name">${this.escapeHtml(drug.name)}</span>
        <span class="selected-drug-category">${this.escapeHtml(drug.category)}</span>
        <button class="remove-drug-btn" data-action="remove-drug-from-checker" data-index="${idx}">×</button>
      </div>
    `).join('');
  },

  addDrugToChecker() {
    const input = document.querySelector('.checker-drug-input');
    if (!input || !input.value.trim()) return;

    const query = input.value.trim();
    // 查找匹配的药品
    const drug = MEDICAL_DB.drugs.find(d => 
      d.name === query || d.aliases.includes(query)
    );

    if (drug) {
      // 检查是否已添加
      if (this.checkerSelectedDrugs.find(d => d.id === drug.id)) {
        this.showToast('该药品已添加');
        return;
      }
      if (this.checkerSelectedDrugs.length >= 6) {
        this.showToast('最多支持 6 种药品同时检查');
        return;
      }
      this.checkerSelectedDrugs.push(drug);
      input.value = '';
      document.getElementById('checker-suggestions').style.display = 'none';
      this.updateCheckerUI();
    }
  },

  removeDrugFromChecker(index) {
    this.checkerSelectedDrugs.splice(index, 1);
    this.updateCheckerUI();
  },

  updateCheckerUI() {
    const listEl = document.getElementById('selected-drugs-list');
    if (listEl) {
      listEl.innerHTML = this.renderSelectedDrugs();
    }
    const btn = document.querySelector('[data-action="run-interaction-check"]');
    if (btn) {
      const count = this.checkerSelectedDrugs.length;
      btn.innerHTML = `${this.getIcon('shield')} 检查相互作用 (${count})`;
      if (count < 2) {
        btn.classList.add('disabled');
        btn.setAttribute('disabled', '');
      } else {
        btn.classList.remove('disabled');
        btn.removeAttribute('disabled');
      }
    }
    // 更新计数器
    const countEl = document.querySelector('.selected-drugs-section .section-count');
    if (countEl) {
      countEl.textContent = this.checkerSelectedDrugs.length;
    }
  },

  runInteractionCheck() {
    if (this.checkerSelectedDrugs.length < 2) return;

    const resultsEl = document.getElementById('checker-results');
    if (!resultsEl) return;

    const drugIds = this.checkerSelectedDrugs.map(d => d.id);
    const interactions = SearchEngine.checkMultiDrugInteractions(drugIds);

    if (interactions.length === 0) {
      resultsEl.innerHTML = `
        <div class="checker-no-interaction">
          <div class="checker-no-icon">${this.getIcon('check')}</div>
          <h3>未发现已知相互作用</h3>
          <p>所选药品之间在当前知识库中未记录有相互作用。但这不代表绝对安全，仍需关注个体差异和新型相互作用报告。</p>
          <div class="checker-note">提示：本检查仅基于内置知识库，可能未覆盖所有相互作用。临床用药请遵循医嘱并参考最新药品说明书。</div>
        </div>
      `;
    } else {
      // 按严重程度排序
      const severityOrder = { high: 0, medium: 1, low: 2 };
      interactions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      const highCount = interactions.filter(i => i.severity === 'high').length;
      const mediumCount = interactions.filter(i => i.severity === 'medium').length;

      let summaryHtml = '';
      if (highCount > 0) {
        summaryHtml += `<div class="checker-summary danger">发现 ${highCount} 项高风险相互作用，建议避免联用或密切监测</div>`;
      }
      if (mediumCount > 0) {
        summaryHtml += `<div class="checker-summary warning">发现 ${mediumCount} 项中风险相互作用，需谨慎使用</div>`;
      }

      resultsEl.innerHTML = `
        <div class="checker-results-section">
          <div class="section-title">
            <span class="section-icon">${this.getIcon('warning')}</span>
            <span>检查结果</span>
            <span class="section-count">${interactions.length} 项</span>
          </div>
          ${summaryHtml}
          <div class="interaction-results-list">
            ${interactions.map(i => `
              <div class="interaction-result-item severity-${i.severity}">
                <div class="interaction-pair">
                  <span class="drug-a">${this.escapeHtml(i.drugA)}</span>
                  <span class="interaction-x">×</span>
                  <span class="drug-b">${this.escapeHtml(i.drugB)}</span>
                  ${i.severity === 'high' ? '<span class="severity-tag high">高风险</span>' : ''}
                  ${i.severity === 'medium' ? '<span class="severity-tag medium">中风险</span>' : ''}
                  ${i.severity === 'low' ? '<span class="severity-tag low">低风险</span>' : ''}
                </div>
                <div class="interaction-detail">${this.escapeHtml(i.effect)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  },

  // ========== 检验值解读器 ==========
  renderLabInterpreter() {
    const labOptions = MEDICAL_DB.labs.map(l => 
      `<option value="${l.id}">${l.name} (${l.category})</option>`
    ).join('');

    return `
      <div class="page tool-page">
        <div class="page-header">
          <div class="page-title-row">
            <div class="detail-back" data-back>${this.getIcon('arrow-left')}</div>
            <h1 class="page-title">检验值解读器</h1>
          </div>
        </div>

        <div class="tool-body">
          <div class="tool-intro">
            <div class="tool-intro-icon">${this.getIcon('test-tube')}</div>
            <p>选择检验指标并输入数值，自动判断结果是否异常及可能原因</p>
          </div>

          <!-- 输入表单 -->
          <div class="interpreter-form">
            <div class="form-field">
              <label class="form-label">检验项目</label>
              <select class="form-select lab-select" id="lab-select">
                <option value="">请选择检验指标...</option>
                ${labOptions}
              </select>
            </div>

            <div class="form-field">
              <label class="form-label">检验数值</label>
              <div class="value-input-row">
                <input type="number" class="form-input lab-value-input" id="lab-value" placeholder="输入数值" step="0.01">
                <span class="value-unit" id="lab-unit">—</span>
              </div>
            </div>

            <div class="form-field">
              <label class="form-label">适用人群</label>
              <select class="form-select gender-select" id="gender-select">
                <option value="adult">成人</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="child">儿童</option>
                <option value="newborn">新生儿</option>
                <option value="pregnant">妊娠期</option>
              </select>
            </div>

            <button class="interpreter-btn" data-action="interpret-lab">
              ${this.getIcon('info')} 解读结果
            </button>
          </div>

          <!-- 参考范围预览 -->
          <div id="ref-preview" class="ref-preview"></div>

          <!-- 解读结果 -->
          <div id="interpret-results"></div>
        </div>
      </div>
    `;
  },

  interpretLabValue() {
    const labId = document.getElementById('lab-select').value;
    const value = document.getElementById('lab-value').value;
    const gender = document.getElementById('gender-select').value;

    const resultsEl = document.getElementById('interpret-results');
    if (!resultsEl) return;

    if (!labId) {
      resultsEl.innerHTML = '<div class="interpret-error">请选择检验指标</div>';
      return;
    }
    if (!value || isNaN(parseFloat(value))) {
      resultsEl.innerHTML = '<div class="interpret-error">请输入有效的数值</div>';
      return;
    }

    const result = SearchEngine.interpretLabValue(labId, value, gender);
    if (!result) {
      resultsEl.innerHTML = '<div class="interpret-error">无法解读该指标，请检查输入</div>';
      return;
    }

    const statusClass = `status-${result.status}`;
    const severityClass = `severity-${result.severity}`;

    let causesHtml = '';
    if (result.causes.length > 0) {
      causesHtml = `
        <div class="interpret-causes">
          <div class="causes-title">${result.status === 'high' ? '常见升高原因' : '常见降低原因'}</div>
          <div class="causes-list">
            ${result.causes.map(c => `<div class="cause-item">${this.escapeHtml(c)}</div>`).join('')}
          </div>
        </div>
      `;
    }

    resultsEl.innerHTML = `
      <div class="interpret-result-card ${severityClass}">
        <div class="interpret-header">
          <div class="interpret-lab-name">${this.escapeHtml(result.lab.name)}</div>
          <div class="interpret-status ${statusClass}">${result.statusText}</div>
        </div>
        <div class="interpret-value-row">
          <div class="interpret-value">
            <span class="value-number">${result.value}</span>
            <span class="value-unit-text">${result.unit}</span>
          </div>
          <div class="interpret-ref">
            <span class="ref-label">参考范围</span>
            <span class="ref-value-text">${this.escapeHtml(result.referenceRange)} ${result.unit}</span>
          </div>
        </div>
        <div class="interpret-significance">
          ${this.escapeHtml(result.lab.clinicalSignificance)}
        </div>
        ${causesHtml}
        <div class="interpret-note">
          ${this.getIcon('info')} 本解读仅供参考，临床判读需结合患者具体情况、既往趋势及其他检查结果综合分析。
        </div>
        <div class="interpret-source">
          ${this.getIcon('source')} 数据来源：${this.escapeHtml(result.lab.source)}
        </div>
      </div>
    `;
  },

  // ========== Toast 提示 ==========
  showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  },

  // ========== 收藏功能 ==========
  loadFavorites() {
    try {
      const saved = localStorage.getItem('yzt_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  },

  saveFavorite(type, id, name, category) {
    const favorites = this.loadFavorites();
    if (favorites.find(f => f.type === type && f.id === id)) {
      this.showToast('已收藏过');
      return;
    }
    favorites.push({ type, id, name, category, time: Date.now() });
    try {
      localStorage.setItem('yzt_favorites', JSON.stringify(favorites));
      this.showToast('收藏成功');
    } catch (e) {
      this.showToast('收藏失败');
    }
  },

  removeFavorite(type, id) {
    let favorites = this.loadFavorites();
    favorites = favorites.filter(f => !(f.type === type && f.id === id));
    try {
      localStorage.setItem('yzt_favorites', JSON.stringify(favorites));
      this.showToast('已取消收藏');
    } catch (e) {}
  },

  isFavorited(type, id) {
    const favorites = this.loadFavorites();
    return !!favorites.find(f => f.type === type && f.id === id);
  },

  // ========== API Key 配置 ==========
  configureApiKey() {
    const existing = (window.AI_CONFIG && AI_CONFIG.apiKey) ? AI_CONFIG.apiKey : '';
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-title">配置 DeepSeek API Key</div>
        <p class="modal-desc">输入您的 DeepSeek API Key，保存后即可使用 AI 智能问答。Key 仅存储在本地浏览器中。</p>
        <input type="text" class="modal-input" id="api-key-input" placeholder="sk-..." value="${this.escapeHtml(existing)}" autocomplete="off">
        <div class="modal-actions">
          <button class="modal-btn modal-cancel" data-action="cancel-api-key">取消</button>
          <button class="modal-btn modal-save" data-action="save-api-key">保存</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
      if (e.target.closest('[data-action="cancel-api-key"]')) close();
      if (e.target.closest('[data-action="save-api-key"]')) {
        const input = document.getElementById('api-key-input');
        const key = input.value.trim();
        if (key) {
          try {
            localStorage.setItem('yzt_api_key', key);
            AI_CONFIG.apiKey = key;
            this.showToast('API Key 已保存');
          } catch (e) {
            this.showToast('保存失败');
          }
        } else {
          try {
            localStorage.removeItem('yzt_api_key');
            AI_CONFIG.apiKey = '';
            this.showToast('已清除 API Key');
          } catch (e) {}
        }
        close();
        this.render();
      }
    });
  },

  // ========== 辅助方法 ==========
  bindCardClicks() {
    // 绑定卡片点击
    document.querySelectorAll('.info-card').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        const id = card.dataset.id;
        if (type === 'drug') {
          this.navigate('drug-detail', { id });
        } else if (type === 'lab') {
          this.navigate('lab-detail', { id });
        }
      });
    });
  },

  updateTabBar() {
    const tabs = document.querySelectorAll('.tab-item');
    tabs.forEach(tab => {
      tab.classList.remove('active');
      const page = tab.dataset.tab;
      if ((page === 'home' && this.currentPage === 'home') ||
          (page === 'category' && this.currentPage === 'category') ||
          (page === 'history' && this.currentPage === 'history') ||
          (page === 'about' && this.currentPage === 'about')) {
        tab.classList.add('active');
      }
    });
  },

  truncate(str, len) {
    if (str.length <= len) return str;
    return str.substring(0, len) + '...';
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  getPregnancyDescription(category) {
    // 处理复合标注，如 "C（禁用）" "C（妊娠早期）/ D（妊娠晚期）"
    const cat = category.trim();
    // 检查是否包含"禁用"
    if (cat.includes('禁用')) {
      return '孕妇禁用，已证实有胎儿风险或潜在风险较大';
    }
    // 检查是否包含"慎用"
    if (cat.includes('慎用')) {
      return '妊娠期慎用，需在医生指导下权衡利弊使用';
    }
    // 取首字母匹配
    const firstChar = cat.charAt(0).toUpperCase();
    const desc = {
      'A': '安全，在孕妇中对照研究未显示对胎儿有风险',
      'B': '动物研究未显示对胎儿有风险，但无孕妇对照研究',
      'C': '动物研究显示有不良影响，但无孕妇对照研究，需权衡利弊',
      'D': '有人类胎儿风险的证据，但在某些情况下可能可以接受',
      'X': '孕妇禁用，动物或人类研究已证实有胎儿致畸风险'
    };
    return desc[firstChar] || '请咨询专业医师';
  },

  translateRefKey(key) {
    const map = {
      'adult': '成人',
      'male': '男性',
      'female': '女性',
      'child': '儿童',
      'newborn': '新生儿',
      'normal': '正常',
      'prediabetes': '糖尿病前期',
      'diabetes': '糖尿病诊断标准',
      'pregnant': '妊娠期',
      'desirable': '理想',
      'borderline': '临界',
      'high': '升高',
      'pt': 'PT',
      'inr': 'INR（正常成人）',
      'inrTherapeutic': 'INR（华法林治疗）',
      'highRisk': '心血管中度风险',
      'veryHighRisk': '心血管高度风险',
      'localInfection': '局部感染',
      'systemicInfection': '系统性感染',
      'severeSepsis': '严重脓毒症',
      'septicShock': '感染性休克'
    };
    return map[key] || key;
  }
};

// ========== 全局事件委托 ==========
document.addEventListener('DOMContentLoaded', () => {
  App.init();

  // 事件委托：处理动态元素点击
  document.addEventListener('click', (e) => {
    // FAQ 卡片点击 — 优先使用 target 直接跳转详情
    const faqCard = e.target.closest('.faq-card');
    if (faqCard) {
      const question = faqCard.dataset.question;
      const target = faqCard.dataset.target;
      if (target) {
        // 有预设目标，直接跳转详情页
        App.saveSearchHistory(question);
        if (target.startsWith('d')) {
          App.navigate('drug-detail', { id: target });
        } else if (target.startsWith('l')) {
          App.navigate('lab-detail', { id: target });
        } else {
          // fallback: 走搜索
          App.navigate('search', { query: question });
        }
      } else {
        // 无预设目标，走搜索
        const input = document.querySelector('.search-input');
        if (input) input.value = question;
        App.saveSearchHistory(question);
        App.navigate('search', { query: question });
      }
      return;
    }

    // 快速入口点击
    const entryCard = e.target.closest('.entry-card');
    if (entryCard) {
      const page = entryCard.dataset.page;
      const type = entryCard.dataset.type;
      App.navigate(page, { type });
      return;
    }

    // 临床工具入口点击
    const toolEntryCard = e.target.closest('.tool-entry-card');
    if (toolEntryCard) {
      const page = toolEntryCard.dataset.page;
      App.navigate(page);
      return;
    }

    // "全部"链接
    const sectionMore = e.target.closest('.section-more');
    if (sectionMore) {
      const page = sectionMore.dataset.page;
      const type = sectionMore.dataset.type;
      App.navigate(page, { type });
      return;
    }

    // 信息卡片点击
    const infoCard = e.target.closest('.info-card');
    if (infoCard && infoCard.dataset.type && infoCard.dataset.id) {
      const type = infoCard.dataset.type;
      const id = infoCard.dataset.id;
      if (type === 'drug') {
        App.navigate('drug-detail', { id });
      } else if (type === 'lab') {
        App.navigate('lab-detail', { id });
      }
      return;
    }

    // 高亮卡片中的相关链接
    const relatedLink = e.target.closest('.related-link');
    if (relatedLink) {
      const type = relatedLink.dataset.type;
      const id = relatedLink.dataset.id;
      if (type === 'drug') {
        App.navigate('drug-detail', { id });
      } else if (type === 'lab') {
        App.navigate('lab-detail', { id });
      }
      return;
    }

    // 返回按钮
    const backBtn = e.target.closest('[data-back]');
    if (backBtn) {
      window.history.back();
      return;
    }

    // 历史记录项 — 点击后更新排序
    const historyItem = e.target.closest('.history-item');
    if (historyItem) {
      const query = historyItem.dataset.query;
      App.saveSearchHistory(query); // 重新保存以更新排序
      App.navigate('search', { query });
      return;
    }

    // 清空历史
    const clearBtn = e.target.closest('[data-action="clear-history"]');
    if (clearBtn) {
      App.clearHistory();
      return;
    }

    // 底部Tab点击
    const tabItem = e.target.closest('.tab-item');
    if (tabItem) {
      const tab = tabItem.dataset.tab;
      App.navigate(tab);
      return;
    }

    // AI fallback 按钮
    const aiBtn = e.target.closest('[data-ai-query]');
    if (aiBtn) {
      const q = aiBtn.dataset.aiQuery;
      const container = document.getElementById('search-results');
      if (container) {
        App.executeAISearch(q, container);
      }
      return;
    }

    // API Key 配置按钮
    const apiKeyBtn = e.target.closest('[data-action="configure-api-key"]');
    if (apiKeyBtn) {
      App.configureApiKey();
      return;
    }

    // 收藏/取消收藏
    const favBtn = e.target.closest('[data-action="toggle-favorite"]');
    if (favBtn) {
      const type = favBtn.dataset.favType;
      const id = favBtn.dataset.favId;
      const name = favBtn.dataset.favName;
      const category = favBtn.dataset.favCategory;
      if (App.isFavorited(type, id)) {
        App.removeFavorite(type, id);
      } else {
        App.saveFavorite(type, id, name, category);
      }
      favBtn.classList.toggle('favorited');
      favBtn.innerHTML = App.isFavorited(type, id) ? App.getIcon('check') : App.getIcon('shield');
      return;
    }

    // 药品详情折叠/展开
    const sectionTitle = e.target.closest('.detail-section-title');
    if (sectionTitle) {
      const section = sectionTitle.parentElement;
      section.classList.toggle('collapsed');
      return;
    }

    // 多药交互检查器 - 添加药品
    const addDrugBtn = e.target.closest('[data-action="add-drug-to-checker"]');
    if (addDrugBtn) {
      App.addDrugToChecker();
      return;
    }

    // 多药交互检查器 - 移除药品
    const removeDrugBtn = e.target.closest('[data-action="remove-drug-from-checker"]');
    if (removeDrugBtn) {
      const idx = parseInt(removeDrugBtn.dataset.index);
      App.removeDrugFromChecker(idx);
      return;
    }

    // 多药交互检查器 - 执行检查
    const checkBtn = e.target.closest('[data-action="run-interaction-check"]');
    if (checkBtn) {
      App.runInteractionCheck();
      return;
    }

    // 检验值解读器 - 解读
    const interpretBtn = e.target.closest('[data-action="interpret-lab"]');
    if (interpretBtn) {
      App.interpretLabValue();
      return;
    }
  });
});
