// ============================================
// Main Application
// ============================================

const App = {
  state: {
    companies: [],
    resume: null,
    matching: false,
    matchResults: [],
    currentRoute: 'dashboard',
    filters: {
      companyTypes: [],
      cities: [],
      industries: [],
      batches: [],
      educationLevels: [],
      keyword: '',
      onlyFavorite: false,
      onlyMatched: false,
      sortBy: 'updateTime',
      sortOrder: 'desc',
    },
    currentPage: 1,
    pageSize: 20,
    initialized: false,
  },

  // ============================================
  // Init
  // ============================================
  async init() {
    DB.init();

    // Load data
    let companies = await DB.getAllCompanies();

    // If no data, load default data
    if (companies.length === 0 && typeof DEFAULT_COMPANIES !== 'undefined') {
      try {
        console.log('[init] Loading default companies...', DEFAULT_COMPANIES.length);
        await DB.saveCompanies(DEFAULT_COMPANIES);
        companies = await DB.getAllCompanies();
        console.log('[init] Loaded', companies.length, 'companies');
        Utils.toast(`已加载 ${companies.length} 条默认企业数据`, 'success');
      } catch (err) {
        console.error('[init] Failed to save default companies:', err);
        // Fallback: save in smaller batches
        try {
          const batch = 50;
          for (let i = 0; i < DEFAULT_COMPANIES.length; i += batch) {
            await DB.saveCompanies(DEFAULT_COMPANIES.slice(i, i + batch));
          }
          companies = await DB.getAllCompanies();
          console.log('[init] Batch save loaded', companies.length, 'companies');
          Utils.toast(`已加载 ${companies.length} 条默认企业数据`, 'success');
        } catch (err2) {
          console.error('[init] Batch save also failed:', err2);
          Utils.toast('默认数据加载失败，请尝试导入 Excel 文件', 'error');
        }
      }
    }

    this.state.companies = companies;

    // Load saved resume
    const resume = await DB.getResume();
    if (resume && !resume._deleted) {
      this.state.resume = resume;
    }

    // Set up router
    window.addEventListener('hashchange', () => this.router());
    this.router();

    this.state.initialized = true;
  },

  // ============================================
  // Router
  // ============================================
  router() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    this.state.currentRoute = hash;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.route === hash);
    });

    // Render page
    const pages = {
      dashboard: () => this.renderDashboard(),
      companies: () => this.renderCompanies(),
      import: () => this.renderImport(),
      match: () => this.renderMatch(),
      pipeline: () => this.renderPipeline(),
      settings: () => this.renderSettings(),
    };

    const renderFn = pages[hash] || pages.dashboard;
    renderFn.call(this);
  },

  // ============================================
  // Helper: render shell
  // ============================================
  renderPage(title, subtitle, contentHTML) {
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="fade-in">
        <div class="page-header">
          <div class="page-title">${title}</div>
          ${subtitle ? `<div class="page-subtitle">${subtitle}</div>` : ''}
        </div>
        ${contentHTML}
      </div>
    `;
    main.scrollTop = 0;
  },

  // ============================================
  // Page: Dashboard
  // ============================================
  renderDashboard() {
    const companies = this.state.companies;
    const total = companies.length;
    const favorites = companies.filter(c => c.isFavorite).length;
    const applied = companies.filter(c => c.applyStatus !== '未投递').length;
    const matched = companies.filter(c => c.starRating !== null).length;

    // City distribution
    const cityMap = {};
    companies.forEach(c => {
      Utils.parseCities(c.location).forEach(city => {
        cityMap[city] = (cityMap[city] || 0) + 1;
      });
    });
    const topCities = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    // Industry distribution
    const industryMap = {};
    companies.forEach(c => {
      if (c.industry) {
        industryMap[c.industry] = (industryMap[c.industry] || 0) + 1;
      }
    });
    const topIndustries = Object.entries(industryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    // Type distribution
    const typeMap = {};
    companies.forEach(c => {
      if (c.companyType) {
        typeMap[c.companyType] = (typeMap[c.companyType] || 0) + 1;
      }
    });

    // Urgent deadlines
    const urgentCount = companies.filter(c => Utils.isUrgentDeadline(c.deadline)).length;

    const html = `
      <div class="stat-grid">
        <div class="stat-card green">
          <div class="stat-icon"><i class="fas fa-building"></i></div>
          <div class="stat-value">${total}</div>
          <div class="stat-label">企业总数</div>
        </div>
        <div class="stat-card orange">
          <div class="stat-icon"><i class="fas fa-heart"></i></div>
          <div class="stat-value">${favorites}</div>
          <div class="stat-label">已收藏</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-icon"><i class="fas fa-paper-plane"></i></div>
          <div class="stat-value">${applied}</div>
          <div class="stat-label">已投递</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon"><i class="fas fa-fire"></i></div>
          <div class="stat-value">${urgentCount}</div>
          <div class="stat-label">即将截止(7天内)</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
        <div class="card">
          <div class="filter-title" style="margin-bottom:1rem;">
            <i class="fas fa-map-marker-alt" style="color:var(--primary)"></i>
            热门城市分布
          </div>
          <div style="display:flex;flex-direction:column;gap:0.6rem;">
            ${topCities.map(([city, count]) => {
              const pct = Math.round((count / total) * 100);
              return `
                <div style="display:flex;align-items:center;gap:0.75rem;">
                  <div style="width:60px;font-size:0.82rem;color:var(--text-secondary);text-align:right;">${Utils.esc(city)}</div>
                  <div style="flex:1;background:var(--bg-soft);border-radius:var(--radius-full);height:24px;overflow:hidden;">
                    <div style="width:${pct}%;height:100%;background:var(--primary-gradient);border-radius:var(--radius-full);transition:width 0.5s;"></div>
                  </div>
                  <div style="width:40px;font-size:0.8rem;font-weight:600;color:var(--primary-dark);">${count}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="card">
          <div class="filter-title" style="margin-bottom:1rem;">
            <i class="fas fa-industry" style="color:var(--highlight)"></i>
            行业分布 Top 6
          </div>
          <div style="display:flex;flex-direction:column;gap:0.6rem;">
            ${topIndustries.map(([ind, count]) => {
              const pct = Math.round((count / total) * 100);
              return `
                <div style="display:flex;align-items:center;gap:0.75rem;">
                  <div style="flex:1;font-size:0.82rem;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Utils.esc(ind)}</div>
                  <div style="flex:1;background:var(--bg-soft);border-radius:var(--radius-full);height:24px;overflow:hidden;max-width:120px;">
                    <div style="width:${pct}%;height:100%;background:linear-gradient(135deg,var(--highlight),#a78bfa);border-radius:var(--radius-full);"></div>
                  </div>
                  <div style="width:30px;font-size:0.8rem;font-weight:600;color:var(--highlight);">${count}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:1.5rem;">
        <div class="filter-title" style="margin-bottom:1rem;">
          <i class="fas fa-tags" style="color:var(--accent)"></i>
          企业类型分布
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:0.75rem;">
          ${Object.entries(typeMap).sort((a,b) => b[1]-a[1]).map(([type, count]) => `
            <div style="display:flex;align-items:center;gap:0.5rem;padding:0.6rem 1rem;background:var(--bg-soft);border-radius:var(--radius-md);">
              <span class="tag tag-type">${Utils.esc(type)}</span>
              <span style="font-weight:700;font-size:1rem;color:var(--text-primary);">${count}</span>
              <span style="font-size:0.75rem;color:var(--text-tertiary);">家</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card" style="margin-top:1.5rem;">
        <div class="filter-title" style="margin-bottom:1rem;">
          <i class="fas fa-bolt" style="color:var(--danger)"></i>
          快捷操作
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:0.75rem;">
          <a href="#companies" class="btn btn-primary"><i class="fas fa-search"></i> 浏览企业库</a>
          <a href="#import" class="btn btn-secondary"><i class="fas fa-file-import"></i> 导入新数据</a>
          <a href="#match" class="btn btn-accent"><i class="fas fa-magic-wand-sparkles"></i> 智能匹配</a>
        </div>
      </div>
    `;

    this.renderPage(
      '<i class="fas fa-chart-pie" style="color:var(--primary)"></i> 仪表盘',
      '数据总览与快捷入口',
      html
    );
  },

  // ============================================
  // Page: Companies (with filters)
  // ============================================
  renderCompanies() {
    const allCompanies = this.state.companies;
    const f = this.state.filters;

    // Get filter options
    const types = Utils.uniqueValues(allCompanies, 'companyType');
    const industries = Utils.uniqueValues(allCompanies, 'industry').slice(0, 15);
    const batches = Utils.uniqueValues(allCompanies, 'batch');
    const allCities = new Set();
    allCompanies.forEach(c => {
      Utils.parseCities(c.location).forEach(city => allCities.add(city));
    });
    const cities = Array.from(allCities).sort().slice(0, 20);

    // Apply filters
    let filtered = allCompanies.filter(c => {
      if (f.companyTypes.length && !f.companyTypes.includes(c.companyType)) return false;
      if (f.industries.length && !f.industries.includes(c.industry)) return false;
      if (f.batches.length && !f.batches.some(b => c.batch.includes(b))) return false;
      if (f.cities.length) {
        const companyCities = Utils.parseCities(c.location);
        if (!f.cities.some(fc => companyCities.some(cc => cc.includes(fc) || fc.includes(cc)))) return false;
      }
      if (f.educationLevels.length) {
        const edu = c.educationRequirement || '';
        if (!f.educationLevels.some(e => edu.includes(e))) return false;
      }
      if (f.keyword) {
        const kw = f.keyword.toLowerCase();
        const text = `${c.companyName} ${c.positionName} ${c.industry}`.toLowerCase();
        if (!text.includes(kw)) return false;
      }
      if (f.onlyFavorite && !c.isFavorite) return false;
      if (f.onlyMatched && c.starRating === null) return false;
      return true;
    });

    // Sort
    const sortKey = f.sortBy;
    const order = f.sortOrder === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (va === null) return 1;
      if (vb === null) return -1;
      if (typeof va === 'string') {
        return va.localeCompare(vb) * order;
      }
      return (va - vb) * order;
    });

    // Pagination
    const pageSize = this.state.pageSize;
    const totalPages = Math.ceil(filtered.length / pageSize);
    const page = Math.min(this.state.currentPage, totalPages || 1);
    const start = (page - 1) * pageSize;
    const pageData = filtered.slice(start, start + pageSize);

    const html = `
      <!-- Filter Panel -->
      <div class="filter-panel">
        <div class="filter-header">
          <div class="filter-title">
            <i class="fas fa-filter" style="color:var(--primary)"></i>
            筛选条件
          </div>
          <button class="btn btn-ghost btn-sm" onclick="App.toggleFilters()">
            <i class="fas fa-chevron-${this._filtersExpanded ? 'up' : 'down'}"></i>
            ${this._filtersExpanded ? '收起' : '展开'}
          </button>
        </div>
        <div class="filter-body" id="filter-body" style="${this._filtersExpanded === false ? 'display:none' : ''}">
          <div class="filter-group" style="grid-column:1/-1;">
            <div class="filter-label">关键词搜索</div>
            <input type="text" class="filter-search" placeholder="搜索公司名、岗位、行业..."
              value="${Utils.esc(f.keyword)}"
              oninput="App.onFilterChange('keyword', this.value)"
            >
          </div>
          <div class="filter-group">
            <div class="filter-label">企业类型</div>
            <div class="filter-options">
              ${types.map(t => `
                <span class="filter-chip ${f.companyTypes.includes(t) ? 'active' : ''}"
                  onclick="App.toggleFilter('companyTypes', '${Utils.esc(t)}')">
                  ${Utils.esc(t)}
                </span>
              `).join('')}
            </div>
          </div>
          <div class="filter-group">
            <div class="filter-label">工作城市</div>
            <div class="filter-options">
              ${cities.map(c => `
                <span class="filter-chip ${f.cities.includes(c) ? 'active' : ''}"
                  onclick="App.toggleFilter('cities', '${Utils.esc(c)}')">
                  ${Utils.esc(c)}
                </span>
              `).join('')}
            </div>
          </div>
          <div class="filter-group">
            <div class="filter-label">行业类别</div>
            <div class="filter-options">
              ${industries.map(i => `
                <span class="filter-chip ${f.industries.includes(i) ? 'active' : ''}"
                  onclick="App.toggleFilter('industries', '${Utils.esc(i)}')">
                  ${Utils.esc(i)}
                </span>
              `).join('')}
            </div>
          </div>
          <div class="filter-group">
            <div class="filter-label">招聘批次</div>
            <div class="filter-options">
              ${batches.map(b => `
                <span class="filter-chip ${f.batches.includes(b) ? 'active' : ''}"
                  onclick="App.toggleFilter('batches', '${Utils.esc(b)}')">
                  ${Utils.esc(b)}
                </span>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="filter-actions">
          <div style="display:flex;gap:0.5rem;align-items:center;">
            <span class="filter-chip ${f.onlyFavorite ? 'active' : ''}" onclick="App.toggleFilter('onlyFavorite', !App.state.filters.onlyFavorite)">
              <i class="fas fa-heart"></i> 仅看收藏
            </span>
          </div>
          <div style="display:flex;gap:0.5rem;margin-left:auto;">
            <button class="btn btn-secondary btn-sm" onclick="App.resetFilters()">
              <i class="fas fa-rotate-left"></i> 重置
            </button>
            <button class="btn btn-primary btn-sm" onclick="App.exportFiltered()">
              <i class="fas fa-download"></i> 导出
            </button>
          </div>
        </div>
      </div>

      <!-- List Header -->
      <div class="list-header">
        <div class="result-count">
          找到 <strong>${filtered.length}</strong> 家企业
          ${filtered.length !== allCompanies.length ? `（共 ${allCompanies.length} 家）` : ''}
        </div>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          <select class="sort-select" onchange="App.onSortChange(this.value)">
            <option value="updateTime-desc" ${f.sortBy==='updateTime'&&f.sortOrder==='desc'?'selected':''}>最近更新</option>
            <option value="companyName-asc" ${f.sortBy==='companyName'&&f.sortOrder==='asc'?'selected':''}>公司名称</option>
            <option value="deadline-asc" ${f.sortBy==='deadline'&&f.sortOrder==='asc'?'selected':''}>截止时间</option>
            <option value="starRating-desc" ${f.sortBy==='starRating'&&f.sortOrder==='desc'?'selected':''}>匹配星级</option>
          </select>
        </div>
      </div>

      <!-- Company Grid -->
      ${pageData.length === 0 ? `
        <div class="empty-state">
          <i class="fas fa-folder-open"></i>
          <h3>没有找到匹配的企业</h3>
          <p>试试调整筛选条件</p>
        </div>
      ` : `
        <div class="company-grid">
          ${pageData.map((c, i) => this.companyCardHTML(c, i)).join('')}
        </div>
      `}

      <!-- Pagination -->
      ${totalPages > 1 ? `
        <div class="pagination">
          <button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="App.goToPage(${page - 1})">
            <i class="fas fa-chevron-left"></i>
          </button>
          ${this.paginationHTML(page, totalPages)}
          <button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="App.goToPage(${page + 1})">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      ` : ''}
    `;

    this.renderPage(
      '<i class="fas fa-building" style="color:var(--primary)"></i> 企业库',
      `共 ${allCompanies.length} 家企业，使用筛选快速定位目标`,
      html
    );
  },

  // Company card HTML
  companyCardHTML(c, index) {
    const cities = Utils.parseCities(c.location);
    const primaryCity = Utils.primaryLocation(c.location);
    const isUrgent = Utils.isUrgentDeadline(c.deadline);
    const isExpired = Utils.isExpired(c.deadline);

    return `
      <div class="company-card stagger-item" style="animation-delay:${index * 0.03}s" onclick="App.showCompanyDetail('${c.id}')">
        <div class="company-card-header">
          <div class="company-name">
            ${Utils.esc(c.companyName)}
            ${c.starRating ? Utils.starHTML(c.starRating) : ''}
          </div>
          <button class="company-favorite-btn ${c.isFavorite ? 'active' : ''}"
            onclick="event.stopPropagation(); App.toggleFavorite('${c.id}')">
            <i class="fas fa-heart"></i>
          </button>
        </div>
        <div class="company-meta">
          ${c.companyType ? `<span class="tag tag-type">${Utils.esc(c.companyType)}</span>` : ''}
          ${c.industry ? `<span class="tag tag-industry">${Utils.esc(Utils.truncate(c.industry, 12))}</span>` : ''}
          <span class="tag tag-location"><i class="fas fa-map-marker-alt"></i> ${Utils.esc(primaryCity)}</span>
          ${c.batch ? `<span class="tag tag-batch">${Utils.esc(c.batch)}</span>` : ''}
        </div>
        <div class="company-positions">
          <i class="fas fa-briefcase" style="color:var(--text-tertiary);margin-right:0.25rem;"></i>
          ${Utils.esc(Utils.truncate(c.positionName, 60))}
        </div>
        <div class="company-footer">
          <span>
            ${isExpired
              ? '<span style="color:var(--danger);"><i class="fas fa-clock"></i> 已截止</span>'
              : isUrgent
                ? '<span style="color:var(--danger);"><i class="fas fa-fire"></i> ' + Utils.formatDeadline(c.deadline) + '</span>'
                : '<i class="fas fa-clock"></i> ' + Utils.formatDeadline(c.deadline)
            }
          </span>
          <div class="company-links">
            ${c.announcementUrl ? `<a href="${Utils.esc(c.announcementUrl)}" ${c.announcementUrl.startsWith('mailto:') ? '' : 'target="_blank"'} class="company-link" onclick="event.stopPropagation()"><i class="fas ${c.announcementUrl.startsWith('mailto:') ? 'fa-envelope' : 'fa-file-lines'}"></i> ${c.announcementUrl.startsWith('mailto:') ? '邮箱' : '公告'}</a>` : ''}
            ${c.applicationUrl ? `<a href="${Utils.esc(c.applicationUrl)}" ${c.applicationUrl.startsWith('mailto:') ? '' : 'target="_blank"'} class="company-link" onclick="event.stopPropagation()"><i class="fas ${c.applicationUrl.startsWith('mailto:') ? 'fa-envelope' : 'fa-external-link-alt'}"></i> ${c.applicationUrl.startsWith('mailto:') ? '邮件投递' : '投递'}</a>` : ''}
          </div>
        </div>
        ${c.applyStatus !== '未投递' ? `<div style="margin-top:0.5rem;"><span class="tag" style="background:#dbeafe;color:#1e40af;">${c.applyStatus}</span></div>` : ''}
      </div>
    `;
  },

  paginationHTML(current, total) {
    let html = '';
    const maxShow = 7;
    let start = Math.max(1, current - 3);
    let end = Math.min(total, start + maxShow - 1);
    if (end - start < maxShow - 1) start = Math.max(1, end - maxShow + 1);

    if (start > 1) {
      html += `<button class="page-btn" onclick="App.goToPage(1)">1</button>`;
      if (start > 2) html += `<span style="color:var(--text-tertiary)">...</span>`;
    }
    for (let i = start; i <= end; i++) {
      html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="App.goToPage(${i})">${i}</button>`;
    }
    if (end < total) {
      if (end < total - 1) html += `<span style="color:var(--text-tertiary)">...</span>`;
      html += `<button class="page-btn" onclick="App.goToPage(${total})">${total}</button>`;
    }
    return html;
  },

  // ============================================
  // Filter actions
  // ============================================
  _filtersExpanded: true,

  toggleFilters() {
    this._filtersExpanded = !this._filtersExpanded;
    this.renderCompanies();
  },

  toggleFilter(key, value) {
    if (typeof value === 'boolean') {
      this.state.filters[key] = value;
    } else {
      const arr = this.state.filters[key];
      const idx = arr.indexOf(value);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(value);
    }
    this.state.currentPage = 1;
    this.renderCompanies();
  },

  onFilterChange(key, value) {
    this.state.filters[key] = value;
    this.state.currentPage = 1;
    // Debounce re-render for text input
    Utils.debounce(() => this.renderCompanies(), 200)();
  },

  onSortChange(value) {
    const [sortBy, sortOrder] = value.split('-');
    this.state.filters.sortBy = sortBy;
    this.state.filters.sortOrder = sortOrder;
    this.renderCompanies();
  },

  resetFilters() {
    this.state.filters = {
      companyTypes: [],
      cities: [],
      industries: [],
      batches: [],
      educationLevels: [],
      keyword: '',
      onlyFavorite: false,
      onlyMatched: false,
      sortBy: 'updateTime',
      sortOrder: 'desc',
    };
    this.state.currentPage = 1;
    this.renderCompanies();
  },

  goToPage(page) {
    this.state.currentPage = page;
    this.renderCompanies();
  },

  // ============================================
  // Company actions
  // ============================================
  async toggleFavorite(id) {
    const company = this.state.companies.find(c => c.id === id);
    if (!company) return;
    company.isFavorite = !company.isFavorite;
    await DB.saveCompany(company);
    this.renderCompanies();
    Utils.toast(company.isFavorite ? '已收藏' : '已取消收藏', 'success');
  },

  async showCompanyDetail(id) {
    const c = this.state.companies.find(c => c.id === id);
    if (!c) return;

    const cities = Utils.parseCities(c.location);

    const bodyHTML = `
      <div class="detail-section">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
          <h2 style="font-size:1.4rem;font-weight:700;">${Utils.esc(c.companyName)}</h2>
          ${c.starRating ? Utils.starHTML(c.starRating) : ''}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
          ${c.companyType ? `<span class="tag tag-type">${Utils.esc(c.companyType)}</span>` : ''}
          ${c.industry ? `<span class="tag tag-industry">${Utils.esc(c.industry)}</span>` : ''}
          ${c.batch ? `<span class="tag tag-batch">${Utils.esc(c.batch)}</span>` : ''}
          ${c.graduationYear ? `<span class="tag tag-education">${Utils.esc(c.graduationYear)}</span>` : ''}
        </div>
      </div>

      ${c.positionName ? `
        <div class="detail-section">
          <div class="detail-section-title"><i class="fas fa-briefcase"></i> 招聘岗位</div>
          <div class="detail-section-content">${Utils.esc(c.positionName)}</div>
        </div>
      ` : ''}

      ${cities.length > 0 ? `
        <div class="detail-section">
          <div class="detail-section-title"><i class="fas fa-map-marker-alt"></i> 工作地点</div>
          <div class="detail-section-content">
            ${cities.map(city => `<span class="tag tag-location" style="margin-right:0.3rem;margin-bottom:0.3rem;">${Utils.esc(city)}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
        <div class="detail-section">
          <div class="detail-section-title"><i class="fas fa-clock"></i> 截止时间</div>
          <div class="detail-section-content">${Utils.esc(Utils.formatDeadline(c.deadline))}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title"><i class="fas fa-calendar-check"></i> 开始时间</div>
          <div class="detail-section-content">${c.startDate ? Utils.esc(c.startDate) : '未明确'}</div>
        </div>
      </div>

      ${c.majorRequirement && c.majorRequirement !== '/' ? `
        <div class="detail-section">
          <div class="detail-section-title"><i class="fas fa-book"></i> 专业要求</div>
          <div class="detail-section-content">${Utils.esc(c.majorRequirement)}</div>
        </div>
      ` : ''}

      ${c.examInfo && c.examInfo !== '/' ? `
        <div class="detail-section">
          <div class="detail-section-title"><i class="fas fa-pen"></i> 笔试情况</div>
          <div class="detail-section-content">${Utils.esc(c.examInfo)}</div>
        </div>
      ` : ''}

      ${c.matchReason ? `
        <div class="detail-section">
          <div class="detail-section-title"><i class="fas fa-lightbulb"></i> 匹配分析</div>
          <div class="detail-section-content" style="background:var(--primary-light);padding:0.75rem;border-radius:var(--radius-md);">
            ${Utils.esc(c.matchReason)}
          </div>
        </div>
      ` : ''}

      <div class="detail-section">
        <div class="detail-section-title"><i class="fas fa-link"></i> 相关链接</div>
        <div>
          ${c.announcementUrl ? `<a href="${Utils.esc(c.announcementUrl)}" ${c.announcementUrl.startsWith('mailto:') ? '' : 'target="_blank"'} class="detail-link"><i class="fas ${c.announcementUrl.startsWith('mailto:') ? 'fa-envelope' : 'fa-file-lines'}"></i> ${c.announcementUrl.startsWith('mailto:') ? '邮件联系' : '查看公告'}</a>` : ''}
          ${c.applicationUrl ? `<a href="${Utils.esc(c.applicationUrl)}" ${c.applicationUrl.startsWith('mailto:') ? '' : 'target="_blank"'} class="detail-link"><i class="fas ${c.applicationUrl.startsWith('mailto:') ? 'fa-envelope' : 'fa-external-link-alt'}"></i> ${c.applicationUrl.startsWith('mailto:') ? '邮件投递' : '前往投递'}</a>` : ''}
          ${!c.announcementUrl && !c.applicationUrl ? '<span style="color:var(--text-tertiary)">暂无链接</span>' : ''}
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title"><i class="fas fa-clipboard-list"></i> 投递状态</div>
        <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
          ${['未投递', '已投递', '笔试中', '面试中', '已offer', '已拒', '已放弃'].map(s => `
            <span class="filter-chip ${c.applyStatus === s ? 'active' : ''}"
              onclick="App.updateApplyStatus('${c.id}', '${s}')">
              ${s}
            </span>
          `).join('')}
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title"><i class="fas fa-sticky-note"></i> 备注</div>
        <textarea class="filter-search" style="min-height:60px;resize:vertical;"
          placeholder="添加备注..."
          onchange="App.updateNotes('${c.id}', this.value)">${Utils.esc(c.notes || '')}</textarea>
      </div>

      <!-- Company Intelligence Section -->
      <div class="detail-section" id="intel-section">
        <div class="detail-section-title">
          <i class="fas fa-magnifying-glass-chart" style="color:var(--highlight)"></i>
          企业情报（薪资 / 评价 / 面试）
          <button class="btn btn-secondary btn-sm" style="margin-left:0.5rem;" onclick="App.searchIntel('${c.id}')">
            <i class="fas fa-magnifying-glass"></i> AI 搜索
          </button>
        </div>
        <div id="intel-content" style="min-height:40px;">
          <div style="color:var(--text-tertiary);font-size:0.82rem;padding:0.5rem 0;">
            点击「AI 搜索」获取该企业的薪资待遇、网友评价和面试经验
          </div>
        </div>
      </div>

      <div style="display:flex;gap:0.5rem;margin-top:1.5rem;">
        <button class="btn ${c.isFavorite ? 'btn-secondary' : 'btn-accent'}" onclick="App.toggleFavoriteFromModal('${c.id}')">
          <i class="fas fa-heart"></i> ${c.isFavorite ? '取消收藏' : '收藏'}
        </button>
        <button class="btn btn-secondary" onclick="Utils.closeModal()">
          <i class="fas fa-times"></i> 关闭
        </button>
      </div>
    `;

    Utils.showModal(c.companyName, bodyHTML);

    // If cached intel exists, show it
    const cachedIntel = await DB.getIntel(c.companyName);
    if (cachedIntel) {
      this._renderIntel(cachedIntel);
    }
  },

  // Search company intelligence via AI
  async searchIntel(companyId) {
    const company = this.state.companies.find(c => c.id === companyId);
    if (!company) return;

    const config = await DB.getConfig();
    if (!config.apiKey) {
      Utils.toast('请先在设置中配置 API Key', 'warning');
      return;
    }

    const contentEl = document.getElementById('intel-content');
    if (contentEl) {
      contentEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.5rem;padding:0.75rem;color:var(--text-secondary);">
          <div class="loading-spinner" style="width:16px;height:16px;"></div>
          <span>AI 正在搜索 ${Utils.esc(company.companyName)} 的企业情报...</span>
        </div>
      `;
    }

    try {
      const intel = await AIClient.searchCompanyIntel(
        company.companyName,
        company.positionName,
        (p) => {
          if (contentEl) {
            contentEl.innerHTML = `
              <div style="display:flex;align-items:center;gap:0.5rem;padding:0.75rem;color:var(--text-secondary);">
                <div class="loading-spinner" style="width:16px;height:16px;"></div>
                <span>${Utils.esc(p.message)}</span>
              </div>
            `;
          }
        }
      );

      // Save to cache
      intel.companyName = company.companyName;
      intel.positionName = company.positionName;
      await DB.saveIntel(intel);

      this._renderIntel(intel);
      Utils.toast('企业情报搜索完成', 'success');
    } catch (err) {
      if (contentEl) {
        contentEl.innerHTML = `
          <div style="padding:0.75rem;background:#fef2f2;border-radius:var(--radius-md);color:var(--danger);font-size:0.82rem;">
            <i class="fas fa-exclamation-circle"></i> 搜索失败：${Utils.esc(err.message)}
            <button class="btn btn-secondary btn-sm" style="margin-left:0.5rem;" onclick="App.searchIntel('${companyId}')">重试</button>
          </div>
        `;
      }
      Utils.toast('情报搜索失败：' + err.message, 'error');
    }
  },

  // Render intelligence content
  _renderIntel(intel) {
    const el = document.getElementById('intel-content');
    if (!el) return;

    let html = '<div style="display:flex;flex-direction:column;gap:0.75rem;">';

    // Salary info
    if (intel.salaryInfo && (intel.salaryInfo.range || intel.salaryInfo.details)) {
      const s = intel.salaryInfo;
      html += `
        <div style="padding:0.85rem;background:var(--primary-light);border-radius:var(--radius-md);border-left:3px solid var(--primary);">
          <div style="font-weight:600;color:var(--primary-dark);font-size:0.85rem;margin-bottom:0.25rem;">
            <i class="fas fa-money-bill-wave"></i> 薪资待遇
          </div>
          ${s.range ? `<div style="font-size:1.1rem;font-weight:700;color:var(--primary-dark);margin-bottom:0.2rem;">${Utils.esc(s.range)}</div>` : ''}
          ${s.details ? `<div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.2rem;">${Utils.esc(s.details)}</div>` : ''}
          ${s.comparison ? `<div style="font-size:0.78rem;color:var(--text-secondary);"><strong>行业对比：</strong>${Utils.esc(s.comparison)}</div>` : ''}
          ${s.educationDiff ? `<div style="font-size:0.78rem;color:var(--text-secondary);"><strong>学历差异：</strong>${Utils.esc(s.educationDiff)}</div>` : ''}
          ${s.source ? `<div style="font-size:0.72rem;color:var(--text-tertiary);margin-top:0.25rem;">来源：${Utils.esc(s.source)} · ${Utils.esc(s.updatedAt || '时间未知')}</div>` : ''}
        </div>
      `;
    }

    // Company overview
    if (intel.companyOverview) {
      const co = intel.companyOverview;
      html += `
        <div style="padding:0.85rem;background:var(--bg-soft);border-radius:var(--radius-md);">
          <div style="font-weight:600;font-size:0.85rem;margin-bottom:0.4rem;">
            <i class="fas fa-building-circle" style="color:var(--highlight)"></i> 企业概况
          </div>
          ${co.scale ? `<div style="font-size:0.8rem;color:var(--text-secondary);"><strong>规模：</strong>${Utils.esc(co.scale)}</div>` : ''}
          ${co.business ? `<div style="font-size:0.8rem;color:var(--text-secondary);"><strong>主营：</strong>${Utils.esc(co.business)}</div>` : ''}
          ${co.development ? `<div style="font-size:0.8rem;color:var(--text-secondary);"><strong>发展：</strong>${Utils.esc(co.development)}</div>` : ''}
        </div>
      `;
    }

    // Reviews
    if (intel.reviews && intel.reviews.length > 0) {
      html += `
        <div style="padding:0.85rem;background:var(--bg-soft);border-radius:var(--radius-md);">
          <div style="font-weight:600;font-size:0.85rem;margin-bottom:0.5rem;">
            <i class="fas fa-comments" style="color:var(--accent)"></i> 网友评价
          </div>
          <div style="display:flex;flex-direction:column;gap:0.5rem;">
            ${intel.reviews.map(r => {
              const sentColor = r.sentiment === 'positive' ? 'var(--success)' : r.sentiment === 'negative' ? 'var(--danger)' : 'var(--text-tertiary)';
              const sentLabel = r.sentiment === 'positive' ? '好评' : r.sentiment === 'negative' ? '差评' : '中性';
              return `
                <div style="padding:0.6rem;background:var(--bg-card);border-radius:var(--radius-sm);border-left:3px solid ${sentColor};">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;">
                    <div style="font-size:0.8rem;color:var(--text-primary);flex:1;">${Utils.esc(r.content)}</div>
                    <span style="font-size:0.68rem;color:${sentColor};font-weight:600;white-space:nowrap;">${sentLabel}</span>
                  </div>
                  <div style="display:flex;gap:0.25rem;flex-wrap:wrap;margin-top:0.3rem;">
                    ${(r.tags || []).map(t => `<span style="font-size:0.68rem;padding:1px 6px;background:var(--bg-soft);border-radius:var(--radius-full);color:var(--text-secondary);">${Utils.esc(t)}</span>`).join('')}
                    ${r.source ? `<span style="font-size:0.68rem;color:var(--text-tertiary);margin-left:auto;">${Utils.esc(r.source)}</span>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // Interview experiences
    if (intel.interviewExperiences && intel.interviewExperiences.length > 0) {
      html += `
        <div style="padding:0.85rem;background:var(--bg-soft);border-radius:var(--radius-md);">
          <div style="font-weight:600;font-size:0.85rem;margin-bottom:0.5rem;">
            <i class="fas fa-user-graduate" style="color:var(--info)"></i> 面试经验
          </div>
          <div style="display:flex;flex-direction:column;gap:0.5rem;">
            ${intel.interviewExperiences.map(iv => {
              const diffColor = iv.difficulty === '简单' ? 'var(--success)' : iv.difficulty === '困难' ? 'var(--danger)' : 'var(--warning)';
              return `
                <div style="padding:0.6rem;background:var(--bg-card);border-radius:var(--radius-sm);">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
                    ${iv.source ? `<span style="font-size:0.7rem;color:var(--text-tertiary);">${Utils.esc(iv.source)}</span>` : ''}
                    ${iv.difficulty ? `<span style="font-size:0.68rem;padding:1px 6px;border-radius:var(--radius-full);background:${diffColor};color:white;font-weight:600;">${Utils.esc(iv.difficulty)}</span>` : ''}
                  </div>
                  <div style="font-size:0.8rem;color:var(--text-primary);">${Utils.esc(iv.summary)}</div>
                  ${iv.duration ? `<div style="font-size:0.72rem;color:var(--text-tertiary);margin-top:0.2rem;"><i class="fas fa-clock"></i> 周期：${Utils.esc(iv.duration)}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // If nothing found
    if (html === '<div style="display:flex;flex-direction:column;gap:0.75rem;">') {
      html += `
        <div style="padding:0.75rem;color:var(--text-tertiary);font-size:0.82rem;text-align:center;">
          <i class="fas fa-circle-info"></i> 暂未找到相关信息
        </div>
      `;
    }

    // Disclaimer
    html += `
      <div style="font-size:0.7rem;color:var(--text-tertiary);text-align:center;padding:0.25rem;">
        <i class="fas fa-triangle-exclamation"></i> 以上信息由 AI 基于公开数据生成，仅供参考，请以官方信息为准
      </div>
    `;

    html += '</div>';
    el.innerHTML = html;
  },

  async toggleFavoriteFromModal(id) {
    await this.toggleFavorite(id);
    Utils.closeModal();
  },

  async updateApplyStatus(id, status) {
    const company = this.state.companies.find(c => c.id === id);
    if (!company) return;
    company.applyStatus = status;
    await DB.saveCompany(company);
    Utils.toast(`状态已更新为「${status}」`, 'success');
    Utils.closeModal();
  },

  async updateNotes(id, notes) {
    const company = this.state.companies.find(c => c.id === id);
    if (!company) return;
    company.notes = notes;
    await DB.saveCompany(company);
    Utils.toast('备注已保存', 'success');
  },

  exportFiltered() {
    const f = this.state.filters;
    const filtered = this.state.companies.filter(c => {
      if (f.companyTypes.length && !f.companyTypes.includes(c.companyType)) return false;
      if (f.industries.length && !f.industries.includes(c.industry)) return false;
      if (f.batches.length && !f.batches.some(b => c.batch.includes(b))) return false;
      if (f.cities.length) {
        const companyCities = Utils.parseCities(c.location);
        if (!f.cities.some(fc => companyCities.some(cc => cc.includes(fc) || fc.includes(cc)))) return false;
      }
      if (f.keyword) {
        const kw = f.keyword.toLowerCase();
        const text = `${c.companyName} ${c.positionName} ${c.industry}`.toLowerCase();
        if (!text.includes(kw)) return false;
      }
      if (f.onlyFavorite && !c.isFavorite) return false;
      return true;
    });

    if (filtered.length === 0) {
      Utils.toast('没有可导出的数据', 'warning');
      return;
    }

    Utils.exportToExcel(filtered, `企业列表_${new Date().toISOString().slice(0, 10)}.xlsx`);
    Utils.toast(`已导出 ${filtered.length} 条数据`, 'success');
  },

  // ============================================
  // Page: Import
  // ============================================
  renderImport() {
    const html = `
      <div style="max-width:700px;">
        <div class="upload-dropzone" id="dropzone" onclick="document.getElementById('file-input').click()">
          <i class="fas fa-cloud-arrow-up"></i>
          <h3>拖拽 Excel 文件到此处，或点击选择</h3>
          <p>支持 .xlsx, .xls, .csv 格式 — 来自飞书/腾讯文档导出的文件</p>
          <input type="file" id="file-input" accept=".xlsx,.xls,.csv" style="display:none"
            onchange="App.handleFileUpload(this.files[0])">
        </div>

        <div id="import-preview"></div>

        <div class="card" style="margin-top:1.5rem;">
          <div class="filter-title" style="margin-bottom:0.75rem;">
            <i class="fas fa-circle-info" style="color:var(--info)"></i>
            导入说明
          </div>
          <ul style="font-size:0.85rem;color:var(--text-secondary);line-height:1.8;padding-left:1.5rem;">
            <li>支持带表头或不带表头的 Excel 文件</li>
            <li>自动识别列名：更新日期、企业名字、企业类型、届次、批次、行业类别、招聘岗位、工作地点、截止日期、公告来源、公告链接、投递链接、专业要求、是否笔试</li>
            <li>导入时会自动按「公司名称+岗位+地点」去重，已存在的企业会保留收藏和投递状态</li>
            <li>数据仅存储在浏览器本地，不会上传到服务器</li>
          </ul>
        </div>

        <div class="card" style="margin-top:1rem;">
          <div class="filter-title" style="margin-bottom:0.75rem;">
            <i class="fas fa-database" style="color:var(--primary)"></i>
            当前数据
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div>
              <span style="font-size:1.5rem;font-weight:700;color:var(--primary-dark);">${this.state.companies.length}</span>
              <span style="color:var(--text-secondary);"> 家企业已存储</span>
            </div>
            <div style="display:flex;gap:0.5rem;">
              <button class="btn btn-secondary btn-sm" onclick="App.exportAllData()">
                <i class="fas fa-download"></i> 导出全部
              </button>
              <button class="btn btn-secondary btn-sm" onclick="App.confirmClearAll()" style="color:var(--danger);">
                <i class="fas fa-trash"></i> 清空数据
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderPage(
      '<i class="fas fa-file-import" style="color:var(--primary)"></i> 数据导入',
      '上传 Excel 文件导入或更新企业数据',
      html
    );

    // Set up drag-and-drop
    const dropzone = document.getElementById('dropzone');
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        App.handleFileUpload(e.dataTransfer.files[0]);
      }
    });
  },

  async handleFileUpload(file) {
    if (!file) return;

    const preview = document.getElementById('import-preview');
    preview.innerHTML = `
      <div class="card" style="margin-top:1rem;text-align:center;">
        <div class="loading-spinner" style="margin-bottom:0.5rem;"></div>
        <div style="color:var(--text-secondary);">正在解析文件...</div>
      </div>
    `;

    try {
      const rows = await Utils.parseExcel(file);
      const companies = Utils.mapRowsToCompanies(rows);

      if (companies.length === 0) {
        preview.innerHTML = `
          <div class="card" style="margin-top:1rem;border-left:4px solid var(--danger);">
            <div style="color:var(--danger);font-weight:600;"><i class="fas fa-exclamation-circle"></i> 未找到有效数据</div>
            <div style="color:var(--text-secondary);font-size:0.85rem;margin-top:0.25rem;">请检查文件格式是否符合要求</div>
          </div>
        `;
        return;
      }

      // Show preview
      preview.innerHTML = `
        <div class="card" style="margin-top:1rem;">
          <div class="filter-title" style="margin-bottom:0.75rem;">
            <i class="fas fa-file-circle-check" style="color:var(--success)"></i>
            解析成功 — 共 ${companies.length} 条数据
          </div>
          <div style="overflow-x:auto;">
            <table style="width:100%;font-size:0.8rem;border-collapse:collapse;">
              <thead>
                <tr style="background:var(--bg-soft);">
                  <th style="padding:0.5rem;text-align:left;border-bottom:2px solid var(--border);">公司名称</th>
                  <th style="padding:0.5rem;text-align:left;border-bottom:2px solid var(--border);">类型</th>
                  <th style="padding:0.5rem;text-align:left;border-bottom:2px solid var(--border);">行业</th>
                  <th style="padding:0.5rem;text-align:left;border-bottom:2px solid var(--border);">地点</th>
                </tr>
              </thead>
              <tbody>
                ${companies.slice(0, 5).map(c => `
                  <tr>
                    <td style="padding:0.5rem;border-bottom:1px solid var(--border-light);">${Utils.esc(c.companyName)}</td>
                    <td style="padding:0.5rem;border-bottom:1px solid var(--border-light);">${Utils.esc(c.companyType)}</td>
                    <td style="padding:0.5rem;border-bottom:1px solid var(--border-light);">${Utils.esc(Utils.truncate(c.industry, 10))}</td>
                    <td style="padding:0.5rem;border-bottom:1px solid var(--border-light);">${Utils.esc(Utils.truncate(c.location, 15))}</td>
                  </tr>
                `).join('')}
                ${companies.length > 5 ? `<tr><td colspan="4" style="padding:0.5rem;text-align:center;color:var(--text-tertiary);">... 还有 ${companies.length - 5} 条</td></tr>` : ''}
              </tbody>
            </table>
          </div>
          <div style="display:flex;gap:0.5rem;margin-top:1rem;">
            <button class="btn btn-primary" onclick="App.confirmImport(${companies.length})" id="import-btn">
              <i class="fas fa-check"></i> 确认导入
            </button>
            <button class="btn btn-secondary" onclick="document.getElementById('import-preview').innerHTML=''">
              <i class="fas fa-times"></i> 取消
            </button>
          </div>
        </div>
      `;

      // Store parsed data temporarily
      this._pendingImport = companies;
    } catch (err) {
      preview.innerHTML = `
        <div class="card" style="margin-top:1rem;border-left:4px solid var(--danger);">
          <div style="color:var(--danger);font-weight:600;"><i class="fas fa-exclamation-circle"></i> 解析失败</div>
          <div style="color:var(--text-secondary);font-size:0.85rem;margin-top:0.25rem;">${Utils.esc(err.message)}</div>
        </div>
      `;
    }
  },

  async confirmImport(count) {
    const btn = document.getElementById('import-btn');
    btn.disabled = true;
    btn.innerHTML = '<div class="loading-spinner"></div> 导入中...';

    try {
      const result = await DB.importCompanies(this._pendingImport);

      // Reload data
      this.state.companies = await DB.getAllCompanies();

      Utils.toast(`导入完成：新增 ${result.added} 条，更新 ${result.updated} 条，跳过 ${result.skipped} 条`, 'success');

      document.getElementById('import-preview').innerHTML = `
        <div class="card" style="margin-top:1rem;border-left:4px solid var(--success);">
          <div style="color:var(--success);font-weight:600;font-size:1.05rem;">
            <i class="fas fa-check-circle"></i> 导入成功！
          </div>
          <div style="margin-top:0.5rem;display:flex;gap:1.5rem;font-size:0.9rem;">
            <span>新增 <strong style="color:var(--primary-dark);">${result.added}</strong> 条</span>
            <span>更新 <strong style="color:var(--accent-dark);">${result.updated}</strong> 条</span>
            <span>跳过 <strong style="color:var(--text-tertiary);">${result.skipped}</strong> 条</span>
          </div>
          <div style="margin-top:1rem;">
            <a href="#companies" class="btn btn-primary btn-sm"><i class="fas fa-building"></i> 查看企业库</a>
          </div>
        </div>
      `;

      this._pendingImport = null;
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check"></i> 确认导入';
      Utils.toast('导入失败：' + err.message, 'error');
    }
  },

  exportAllData() {
    if (this.state.companies.length === 0) {
      Utils.toast('没有可导出的数据', 'warning');
      return;
    }
    Utils.exportToExcel(this.state.companies, `全部企业_${new Date().toISOString().slice(0, 10)}.xlsx`);
    Utils.toast(`已导出 ${this.state.companies.length} 条数据`, 'success');
  },

  confirmClearAll() {
    Utils.showModal('确认清空数据', `
      <div style="text-align:center;padding:1rem 0;">
        <i class="fas fa-triangle-exclamation" style="font-size:3rem;color:var(--danger);margin-bottom:1rem;"></i>
        <h3 style="margin-bottom:0.5rem;">确定要清空所有企业数据吗？</h3>
        <p style="color:var(--text-secondary);margin-bottom:1.5rem;">此操作不可撤销，收藏、投递状态等数据将全部丢失</p>
        <div style="display:flex;gap:0.5rem;justify-content:center;">
          <button class="btn btn-secondary" onclick="Utils.closeModal()">取消</button>
          <button class="btn btn-primary" style="background:var(--danger);" onclick="App.clearAllData()">
            <i class="fas fa-trash"></i> 确认清空
          </button>
        </div>
      </div>
    `);
  },

  async clearAllData() {
    await DB.clearCompanies();
    this.state.companies = [];
    Utils.closeModal();
    Utils.toast('所有数据已清空', 'success');
    this.renderImport();
  },

  // ============================================
  // Page: Match — Resume upload + AI matching
  // ============================================
  renderMatch() {
    const resume = this.state.resume || null;
    const matching = this.state.matching;
    const matchResults = this.state.matchResults || [];

    // Determine which step to show
    let step = 'upload'; // upload | review | matching | results
    if (matching) step = 'matching';
    else if (matchResults.length > 0) step = 'results';
    else if (resume) step = 'review';

    let html = '';

    // Step indicator
    const steps = [
      { key: 'upload', label: '上传简历', icon: 'fa-file-arrow-up' },
      { key: 'review', label: '确认信息', icon: 'fa-clipboard-check' },
      { key: 'matching', label: 'AI 匹配', icon: 'fa-magic-wand-sparkles' },
      { key: 'results', label: '查看结果', icon: 'fa-star' },
    ];
    const currentStepIdx = steps.findIndex(s => s.key === step);

    html += `
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1.5rem;flex-wrap:wrap;">
        ${steps.map((s, i) => `
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:700;
              ${i <= currentStepIdx
                ? 'background:var(--primary-gradient);color:white;box-shadow:0 2px 8px rgba(16,185,129,0.3);'
                : 'background:var(--bg-soft);color:var(--text-tertiary);'}">
              ${i < currentStepIdx ? '<i class="fas fa-check"></i>' : `<i class="fas ${s.icon}"></i>`}
            </div>
            <span style="font-size:0.82rem;font-weight:${i === currentStepIdx ? '700' : '500'};color:${i <= currentStepIdx ? 'var(--text-primary)' : 'var(--text-tertiary)'};">${s.label}</span>
            ${i < steps.length - 1 ? '<i class="fas fa-chevron-right" style="color:var(--text-tertiary);font-size:0.7rem;margin:0 0.25rem;"></i>' : ''}
          </div>
        `).join('')}
      </div>
    `;

    // Step: Upload
    if (step === 'upload') {
      html += this._matchUploadHTML();
    }

    // Step: Review (show extracted resume info, allow editing + preferences)
    if (step === 'review') {
      html += this._matchReviewHTML(resume);
    }

    // Step: Matching (progress)
    if (step === 'matching') {
      html += this._matchProgressHTML();
    }

    // Step: Results
    if (step === 'results') {
      html += this._matchResultsHTML(matchResults);
    }

    this.renderPage(
      '<i class="fas fa-magic-wand-sparkles" style="color:var(--primary)"></i> 智能匹配',
      '上传简历，AI 自动匹配最合适的岗位',
      html
    );

    // Set up drag-and-drop if on upload step
    if (step === 'upload') {
      this._setupResumeDropzone();
    }
  },

  _matchUploadHTML() {
    const hasResume = !!this.state.resume;
    return `
      <div style="max-width:650px;">
        ${hasResume ? `
          <div class="card" style="margin-bottom:1rem;border-left:4px solid var(--success);">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div>
                <i class="fas fa-check-circle" style="color:var(--success);"></i>
                <strong>已上传简历：</strong>${Utils.esc(this.state.resume.fileName)}
              </div>
              <button class="btn btn-secondary btn-sm" onclick="App.resetResume()">
                <i class="fas fa-rotate-left"></i> 重新上传
              </button>
            </div>
          </div>
        ` : ''}

        <div class="upload-dropzone" id="resume-dropzone" onclick="document.getElementById('resume-file-input').click()">
          <i class="fas fa-file-arrow-up"></i>
          <h3>拖拽简历文件到此处，或点击选择</h3>
          <p>支持 PDF、Word（.doc/.docx）、图片（JPG/PNG）格式</p>
          <p style="margin-top:0.5rem;font-size:0.78rem;color:var(--text-tertiary);">
            <i class="fas fa-lightbulb"></i> 建议使用文字版 PDF，识别效果最佳
          </p>
          <input type="file" id="resume-file-input" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.bmp,.webp,.txt" style="display:none"
            onchange="App.handleResumeUpload(this.files[0])">
        </div>

        <div class="card" style="margin-top:1.5rem;">
          <div class="filter-title" style="margin-bottom:0.75rem;">
            <i class="fas fa-list-check" style="color:var(--primary)"></i>
            匹配流程说明
          </div>
          <div style="display:flex;flex-direction:column;gap:0.75rem;">
            <div style="display:flex;gap:0.75rem;align-items:flex-start;">
              <div style="width:28px;height:28px;border-radius:50%;background:var(--primary-light);color:var(--primary-dark);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;flex-shrink:0;">1</div>
              <div style="font-size:0.85rem;color:var(--text-secondary);"><strong style="color:var(--text-primary);">上传简历</strong> — 支持 PDF / Word / 图片格式，自动提取文本</div>
            </div>
            <div style="display:flex;gap:0.75rem;align-items:flex-start;">
              <div style="width:28px;height:28px;border-radius:50%;background:var(--primary-light);color:var(--primary-dark);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;flex-shrink:0;">2</div>
              <div style="font-size:0.85rem;color:var(--text-secondary);"><strong style="color:var(--text-primary);">AI 解析简历</strong> — 提取学历、技能、项目经验等结构化信息，可手动校对</div>
            </div>
            <div style="display:flex;gap:0.75rem;align-items:flex-start;">
              <div style="width:28px;height:28px;border-radius:50%;background:var(--primary-light);color:var(--primary-dark);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;flex-shrink:0;">3</div>
              <div style="font-size:0.85rem;color:var(--text-secondary);"><strong style="color:var(--text-primary);">设置偏好</strong> — 补充企业类型、城市、行业等偏好条件</div>
            </div>
            <div style="display:flex;gap:0.75rem;align-items:flex-start;">
              <div style="width:28px;height:28px;border-radius:50%;background:var(--primary-light);color:var(--primary-dark);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;flex-shrink:0;">4</div>
              <div style="font-size:0.85rem;color:var(--text-secondary);"><strong style="color:var(--text-primary);">智能匹配</strong> — AI 批量评估岗位匹配度，按星级排序展示</div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top:1rem;background:var(--primary-light);border-color:var(--primary-light);">
          <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;color:var(--primary-dark);">
            <i class="fas fa-circle-info"></i>
            需要先在「设置」中配置大模型 API Key 才能使用 AI 匹配功能
            <a href="#settings" style="margin-left:auto;color:var(--primary-dark);font-weight:600;text-decoration:underline;">前往设置</a>
          </div>
        </div>
      </div>
    `;
  },

  _setupResumeDropzone() {
    const dz = document.getElementById('resume-dropzone');
    if (!dz) return;
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        App.handleResumeUpload(e.dataTransfer.files[0]);
      }
    });
  },

  async handleResumeUpload(file) {
    if (!file) return;

    // Show loading state
    this.state.resumeParsing = true;
    this.renderMatch();

    try {
      // Step 1: Extract text
      const result = await ResumeParser.parse(file, (progress) => {
        const el = document.getElementById('match-progress-text');
        if (el) el.textContent = progress.message;
      });

      // Step 2: AI extract structured info
      const config = await DB.getConfig();
      if (!config.apiKey) {
        // No API key — save raw text, let user fill manually
        Utils.toast('未配置 API Key，简历文本已提取，请手动补充信息', 'warning');
        const resume = {
          id: 'resume_' + Date.now(),
          rawText: result.text,
          fileName: result.fileName,
          fileType: result.fileType,
          extractedInfo: {
            name: null, phone: null, email: null,
            education: [], skills: [], projects: [], internships: [],
            expectedPositions: [], expectedCities: [], expectedSalary: null,
          },
          userPreferences: {
            preferredCompanyTypes: [], preferredCities: [], preferredIndustries: [],
            minSalary: null, avoidOvertime: false, otherRequirements: '',
          },
        };
        await DB.saveResume(resume);
        this.state.resume = resume;
        this.state.resumeParsing = false;
        this.renderMatch();
        return;
      }

      const extractedInfo = await AIClient.extractResume(result.text, (progress) => {
        const el = document.getElementById('match-progress-text');
        if (el) el.textContent = progress.message;
      });

      const resume = {
        id: 'resume_' + Date.now(),
        rawText: result.text,
        fileName: result.fileName,
        fileType: result.fileType,
        extractedInfo: extractedInfo,
        userPreferences: {
          preferredCompanyTypes: [],
          preferredCities: extractedInfo.expectedCities || [],
          preferredIndustries: [],
          minSalary: null,
          avoidOvertime: false,
          otherRequirements: '',
        },
      };

      await DB.saveResume(resume);
      this.state.resume = resume;
      this.state.resumeParsing = false;
      Utils.toast('简历解析成功！请确认信息并设置偏好', 'success');
      this.renderMatch();
    } catch (err) {
      this.state.resumeParsing = false;
      Utils.toast('简历解析失败：' + err.message, 'error');
      this.renderMatch();
    }
  },

  _matchReviewHTML(resume) {
    const info = resume.extractedInfo || {};
    const pref = resume.userPreferences || {};

    // Get available filter options
    const types = Utils.uniqueValues(this.state.companies, 'companyType');
    const industries = Utils.uniqueValues(this.state.companies, 'industry').slice(0, 12);
    const allCities = new Set();
    this.state.companies.forEach(c => {
      Utils.parseCities(c.location).forEach(city => { if (city.length <= 4) allCities.add(city); });
    });
    const cities = Array.from(allCities).sort().slice(0, 20);

    return `
      <div style="max-width:750px;">
        <!-- Resume Info Card -->
        <div class="card" style="margin-bottom:1rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <div class="filter-title">
              <i class="fas fa-id-card" style="color:var(--primary)"></i>
              简历信息（AI 提取，可校对修改）
            </div>
            <span class="tag tag-type"><i class="fas fa-file-${resume.fileType === 'pdf' ? 'pdf' : resume.fileType === 'word' ? 'word' : 'image'}"></i> ${resume.fileType}</span>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
            <div>
              <label class="filter-label">姓名</label>
              <input type="text" class="filter-search" id="r-name" value="${Utils.esc(info.name || '')}" style="margin-top:0.3rem;">
            </div>
            <div>
              <label class="filter-label">期望薪资</label>
              <input type="text" class="filter-search" id="r-salary" value="${Utils.esc(info.expectedSalary || '')}" placeholder="如 25-35w" style="margin-top:0.3rem;">
            </div>
          </div>

          <div style="margin-bottom:1rem;">
            <label class="filter-label">学历信息</label>
            <div id="r-education-list" style="margin-top:0.5rem;">
              ${(info.education || []).map((e, i) => `
                <div style="display:grid;grid-template-columns:2fr 2fr 1fr 1fr;gap:0.5rem;margin-bottom:0.5rem;">
                  <input type="text" class="filter-search" placeholder="学校" value="${Utils.esc(e.school || '')}" data-edu="${i}" data-field="school">
                  <input type="text" class="filter-search" placeholder="专业" value="${Utils.esc(e.major || '')}" data-edu="${i}" data-field="major">
                  <input type="text" class="filter-search" placeholder="学历" value="${Utils.esc(e.degree || '')}" data-edu="${i}" data-field="degree">
                  <input type="text" class="filter-search" placeholder="毕业年份" value="${Utils.esc(e.graduationYear || '')}" data-edu="${i}" data-field="graduationYear">
                </div>
              `).join('') || '<div style="color:var(--text-tertiary);font-size:0.85rem;">未提取到学历信息，请手动填写</div>'}
            </div>
          </div>

          <div style="margin-bottom:1rem;">
            <label class="filter-label">技能栈</label>
            <input type="text" class="filter-search" id="r-skills" value="${Utils.esc((info.skills || []).join('、'))}" placeholder="用顿号分隔，如 Python、数据分析、SQL" style="margin-top:0.3rem;">
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
            <div>
              <label class="filter-label">期望岗位</label>
              <input type="text" class="filter-search" id="r-positions" value="${Utils.esc((info.expectedPositions || []).join('、'))}" placeholder="用顿号分隔" style="margin-top:0.3rem;">
            </div>
            <div>
              <label class="filter-label">期望城市</label>
              <input type="text" class="filter-search" id="r-cities" value="${Utils.esc((info.expectedCities || []).join('、'))}" placeholder="用顿号分隔" style="margin-top:0.3rem;">
            </div>
          </div>

          <details style="margin-top:0.5rem;">
            <summary style="cursor:pointer;font-size:0.82rem;color:var(--text-secondary);font-weight:500;">
              <i class="fas fa-chevron-right"></i> 查看简历原始文本
            </summary>
            <div style="margin-top:0.5rem;padding:0.75rem;background:var(--bg-soft);border-radius:var(--radius-md);font-size:0.78rem;color:var(--text-secondary);max-height:200px;overflow-y:auto;white-space:pre-wrap;">${Utils.esc(resume.rawText.substring(0, 2000))}${resume.rawText.length > 2000 ? '\n...' : ''}</div>
          </details>
        </div>

        <!-- Preferences Card -->
        <div class="card" style="margin-bottom:1rem;">
          <div class="filter-title" style="margin-bottom:1rem;">
            <i class="fas fa-sliders" style="color:var(--accent)"></i>
            匹配偏好设置
          </div>

          <div class="filter-group" style="margin-bottom:1rem;">
            <div class="filter-label">偏好企业类型</div>
            <div class="filter-options">
              ${types.map(t => `
                <span class="filter-chip ${pref.preferredCompanyTypes.includes(t) ? 'active' : ''}"
                  onclick="App.toggleMatchPref('preferredCompanyTypes', '${Utils.esc(t)}')">
                  ${Utils.esc(t)}
                </span>
              `).join('')}
            </div>
          </div>

          <div class="filter-group" style="margin-bottom:1rem;">
            <div class="filter-label">偏好城市</div>
            <div class="filter-options">
              ${cities.map(c => `
                <span class="filter-chip ${pref.preferredCities.includes(c) ? 'active' : ''}"
                  onclick="App.toggleMatchPref('preferredCities', '${Utils.esc(c)}')">
                  ${Utils.esc(c)}
                </span>
              `).join('')}
            </div>
          </div>

          <div class="filter-group" style="margin-bottom:1rem;">
            <div class="filter-label">偏好行业</div>
            <div class="filter-options">
              ${industries.map(i => `
                <span class="filter-chip ${pref.preferredIndustries.includes(i) ? 'active' : ''}"
                  onclick="App.toggleMatchPref('preferredIndustries', '${Utils.esc(i)}')">
                  ${Utils.esc(Utils.truncate(i, 12))}
                </span>
              `).join('')}
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div>
              <label class="filter-label">最低期望薪资（万/年）</label>
              <input type="number" class="filter-search" id="r-minsalary" value="${pref.minSalary || ''}" placeholder="如 20" style="margin-top:0.3rem;">
            </div>
            <div>
              <label class="filter-label">其他要求</label>
              <input type="text" class="filter-search" id="r-otherreq" value="${Utils.esc(pref.otherRequirements || '')}" placeholder="如 不接受频繁出差" style="margin-top:0.3rem;">
            </div>
          </div>

          <div style="margin-top:0.75rem;">
            <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-size:0.85rem;">
              <input type="checkbox" id="r-avoidOT" ${pref.avoidOvertime ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--primary);">
              排斥高强度加班
            </label>
          </div>
        </div>

        <!-- Action buttons -->
        <div style="display:flex;gap:0.5rem;justify-content:center;">
          <button class="btn btn-secondary" onclick="App.resetResume()">
            <i class="fas fa-rotate-left"></i> 重新上传
          </button>
          <button class="btn btn-primary" onclick="App.startMatching()" style="padding:0.7rem 2rem;font-size:0.95rem;">
            <i class="fas fa-magic-wand-sparkles"></i> 开始智能匹配
          </button>
        </div>
      </div>
    `;
  },

  _matchProgressHTML() {
    return `
      <div class="card" style="text-align:center;padding:3rem 2rem;max-width:500px;margin:2rem auto;">
        <div style="width:80px;height:80px;background:var(--primary-light);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;">
          <div class="loading-spinner" style="width:32px;height:32px;border-width:4px;"></div>
        </div>
        <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:0.5rem;">AI 正在为你匹配岗位</h2>
        <p id="match-progress-text" style="color:var(--text-secondary);font-size:0.9rem;">
          正在处理中...
        </p>
        <div style="margin-top:1.5rem;background:var(--bg-soft);border-radius:var(--radius-md);padding:0.75rem;font-size:0.8rem;color:var(--text-tertiary);">
          <i class="fas fa-circle-info"></i> 匹配过程中请勿关闭页面
        </div>
      </div>
    `;
  },

  _matchResultsHTML(results) {
    // Sort by star rating desc, then match score desc
    const sorted = [...results].sort((a, b) => {
      if (b.starRating !== a.starRating) return b.starRating - a.starRating;
      return b.matchScore - a.matchScore;
    });

    const fiveStar = sorted.filter(r => r.starRating === 5).length;
    const fourStar = sorted.filter(r => r.starRating === 4).length;
    const threeStar = sorted.filter(r => r.starRating === 3).length;

    return `
      <div style="max-width:900px;">
        <!-- Summary stats -->
        <div class="stat-grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin-bottom:1.5rem;">
          <div class="stat-card green">
            <div class="stat-icon"><i class="fas fa-list-check"></i></div>
            <div class="stat-value">${sorted.length}</div>
            <div class="stat-label">已评估岗位</div>
          </div>
          <div class="stat-card orange">
            <div class="stat-icon"><i class="fas fa-star"></i></div>
            <div class="stat-value">${fiveStar}</div>
            <div class="stat-label">五星匹配</div>
          </div>
          <div class="stat-card purple">
            <div class="stat-icon"><i class="fas fa-star-half-stroke"></i></div>
            <div class="stat-value">${fourStar}</div>
            <div class="stat-label">四星匹配</div>
          </div>
          <div class="stat-card blue">
            <div class="stat-icon"><i class="fas fa-star"></i></div>
            <div class="stat-value">${threeStar}</div>
            <div class="stat-label">三星匹配</div>
          </div>
        </div>

        <!-- Filter by star -->
        <div style="display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap;">
          <span class="filter-chip active" onclick="App.filterMatchResults(0, this)">全部 (${sorted.length})</span>
          <span class="filter-chip" onclick="App.filterMatchResults(5, this)">五星 (${fiveStar})</span>
          <span class="filter-chip" onclick="App.filterMatchResults(4, this)">四星+ (${fiveStar + fourStar})</span>
          <span class="filter-chip" onclick="App.filterMatchResults(3, this)">三星+ (${fiveStar + fourStar + threeStar})</span>
        </div>

        <!-- Results list -->
        <div id="match-results-list" class="company-grid">
          ${sorted.map((r, i) => this._matchResultCardHTML(r, i)).join('')}
        </div>

        <!-- Actions -->
        <div style="display:flex;gap:0.5rem;justify-content:center;margin-top:1.5rem;">
          <button class="btn btn-secondary" onclick="App.resetMatch()">
            <i class="fas fa-rotate-left"></i> 重新匹配
          </button>
          <a href="#companies" class="btn btn-primary">
            <i class="fas fa-building"></i> 在企业库中查看
          </a>
        </div>
      </div>
    `;
  },

  _matchResultCardHTML(r, index) {
    const company = this.state.companies.find(c => c.id === r.id);
    if (!company) return '';

    const scoreColor = r.matchScore >= 80 ? 'var(--success)' : r.matchScore >= 65 ? 'var(--warning)' : 'var(--text-tertiary)';

    return `
      <div class="company-card stagger-item" style="animation-delay:${index * 0.03}s;border-left:4px solid ${scoreColor};" onclick="App.showCompanyDetail('${r.id}')">
        <div class="company-card-header">
          <div class="company-name">
            ${Utils.esc(r.companyName)}
            ${Utils.starHTML(r.starRating)}
          </div>
          <div style="text-align:right;">
            <div style="font-size:1.3rem;font-weight:700;color:${scoreColor};">${r.matchScore}</div>
            <div style="font-size:0.65rem;color:var(--text-tertiary);">匹配分</div>
          </div>
        </div>
        <div class="company-meta">
          ${company.companyType ? `<span class="tag tag-type">${Utils.esc(company.companyType)}</span>` : ''}
          ${company.industry ? `<span class="tag tag-industry">${Utils.esc(Utils.truncate(company.industry, 12))}</span>` : ''}
          <span class="tag tag-location"><i class="fas fa-map-marker-alt"></i> ${Utils.esc(Utils.primaryLocation(company.location))}</span>
        </div>
        <div class="company-positions">
          <i class="fas fa-briefcase" style="color:var(--text-tertiary);margin-right:0.25rem;"></i>
          ${Utils.esc(Utils.truncate(r.positionName || company.positionName, 50))}
        </div>
        ${r.matchReason ? `
          <div style="margin-top:0.5rem;padding:0.5rem 0.6rem;background:var(--primary-light);border-radius:var(--radius-sm);font-size:0.75rem;color:var(--primary-dark);">
            <i class="fas fa-lightbulb"></i> ${Utils.esc(r.matchReason)}
          </div>
        ` : ''}
        <div class="company-footer">
          <span><i class="fas fa-clock"></i> ${Utils.formatDeadline(company.deadline)}</span>
          <button class="company-favorite-btn ${company.isFavorite ? 'active' : ''}" onclick="event.stopPropagation(); App.toggleFavorite('${r.id}')">
            <i class="fas fa-heart"></i>
          </button>
        </div>
      </div>
    `;
  },

  // Toggle match preference chip
  toggleMatchPref(key, value) {
    const pref = this.state.resume.userPreferences;
    const arr = pref[key];
    const idx = arr.indexOf(value);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(value);
    this.renderMatch();
  },

  // Save resume edits + start matching
  async startMatching() {
    // Collect edited fields
    const resume = this.state.resume;
    const info = resume.extractedInfo;

    info.name = document.getElementById('r-name')?.value || info.name;
    info.expectedSalary = document.getElementById('r-salary')?.value || info.expectedSalary;
    info.skills = (document.getElementById('r-skills')?.value || '').split(/[,，、\s]+/).filter(Boolean);
    info.expectedPositions = (document.getElementById('r-positions')?.value || '').split(/[,，、\s]+/).filter(Boolean);
    info.expectedCities = (document.getElementById('r-cities')?.value || '').split(/[,，、\s]+/).filter(Boolean);

    // Collect education edits
    const eduInputs = document.querySelectorAll('[data-edu]');
    const eduMap = {};
    eduInputs.forEach(input => {
      const idx = input.dataset.edu;
      const field = input.dataset.field;
      if (!eduMap[idx]) eduMap[idx] = {};
      eduMap[idx][field] = input.value;
    });
    info.education = Object.values(eduMap).filter(e => e.school || e.major);

    // Collect preferences
    const pref = resume.userPreferences;
    pref.minSalary = parseInt(document.getElementById('r-minsalary')?.value) || null;
    pref.otherRequirements = document.getElementById('r-otherreq')?.value || '';
    pref.avoidOvertime = document.getElementById('r-avoidOT')?.checked || false;

    await DB.saveResume(resume);

    // Check API key
    const config = await DB.getConfig();
    if (!config.apiKey) {
      Utils.toast('请先在设置中配置 API Key', 'warning');
      window.location.hash = 'settings';
      return;
    }

    // Start matching
    this.state.matching = true;
    this.state.matchResults = [];
    AIClient.reset();
    this.renderMatch();

    try {
      // Determine which companies to match
      // Pre-filter by preferences (soft filter — keep non-matching as candidates too)
      let preferredPool = [...this.state.companies];
      let otherPool = [];

      if (pref.preferredCities.length > 0) {
        preferredPool = preferredPool.filter(c => {
          const cities = Utils.parseCities(c.location);
          return pref.preferredCities.some(pc => cities.some(cc => cc.includes(pc) || pc.includes(cc)));
        });
      }
      if (pref.preferredCompanyTypes.length > 0) {
        preferredPool = preferredPool.filter(c => pref.preferredCompanyTypes.includes(c.companyType));
      }
      if (pref.preferredIndustries.length > 0) {
        preferredPool = preferredPool.filter(c => pref.preferredIndustries.some(i => c.industry && c.industry.includes(i)));
      }

      // If preferences filtered too aggressively, fall back to including some others
      if (preferredPool.length < 10) {
        const preferredIds = new Set(preferredPool.map(c => c.id));
        otherPool = this.state.companies.filter(c => !preferredIds.has(c.id));
      }

      // Combine: preferred first, then some others to ensure diversity
      let toMatch = [...preferredPool, ...otherPool];

      // Shuffle the pool slightly to ensure different companies appear each time
      // (shuffle within groups of 10 to maintain some ordering)
      toMatch = this._shuffleArray(toMatch);

      // Limit to 80 companies to balance coverage and API cost
      const maxMatch = 80;
      if (toMatch.length > maxMatch) {
        Utils.toast(`数据量较大，将匹配 ${maxMatch} 家企业（含偏好筛选+随机补充）`, 'info');
        toMatch = toMatch.slice(0, maxMatch);
      }

      if (toMatch.length === 0) {
        throw new Error('没有可匹配的企业数据');
      }

      // Batch matching: 10 jobs per request for better cross-comparison
      const batchSize = 10;
      const allResults = [];

      for (let i = 0; i < toMatch.length; i += batchSize) {
        const batch = toMatch.slice(i, i + batchSize);

        const el = document.getElementById('match-progress-text');
        if (el) el.textContent = `正在评估第 ${i + 1}-${Math.min(i + batchSize, toMatch.length)}/${toMatch.length} 个岗位...`;

        const batchResults = await AIClient.matchJobs(info, pref, batch, (p) => {
          const el = document.getElementById('match-progress-text');
          if (el) el.textContent = p.message;
        });

        allResults.push(...batchResults);

        // Update progress
        if (el) el.textContent = `已完成 ${allResults.length}/${toMatch.length} 个岗位的评估`;
      }

      // Save match scores to companies
      for (const r of allResults) {
        const company = this.state.companies.find(c => c.id === r.id);
        if (company) {
          company.matchScore = r.matchScore;
          company.starRating = r.starRating;
          company.matchReason = r.matchReason;
          await DB.saveCompany(company);
        }
      }

      this.state.matchResults = allResults;
      this.state.matching = false;
      Utils.toast(`匹配完成！共评估 ${allResults.length} 个岗位`, 'success');
      this.renderMatch();
    } catch (err) {
      this.state.matching = false;
      Utils.toast('匹配失败：' + err.message, 'error');
      this.renderMatch();
    }
  },

  filterMatchResults(minStar, chipEl) {
    // Update chip active state
    document.querySelectorAll('#match-results-list').forEach(() => {});
    const chips = chipEl.parentElement.querySelectorAll('.filter-chip');
    chips.forEach(c => c.classList.remove('active'));
    chipEl.classList.add('active');

    const results = this.state.matchResults;
    const filtered = minStar === 0
      ? results
      : results.filter(r => r.starRating >= minStar);

    const sorted = [...filtered].sort((a, b) => {
      if (b.starRating !== a.starRating) return b.starRating - a.starRating;
      return b.matchScore - a.matchScore;
    });

    const listEl = document.getElementById('match-results-list');
    if (listEl) {
      listEl.innerHTML = sorted.map((r, i) => this._matchResultCardHTML(r, i)).join('') ||
        '<div class="empty-state"><i class="fas fa-folder-open"></i><h3>没有符合条件的结果</h3></div>';
    }
  },

  async resetResume() {
    // Clear resume from state and DB
    const resume = this.state.resume;
    if (resume) {
      await DB.saveResume({ ...resume, id: resume.id, _deleted: true });
      // localforage doesn't have a delete method exposed in our DB layer, so we just reset state
    }
    this.state.resume = null;
    this.state.matchResults = [];
    this.renderMatch();
  },

  resetMatch() {
    this.state.matchResults = [];
    this.renderMatch();
  },

  // Fisher-Yates shuffle for ensuring different companies appear each match
  _shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // ============================================
  // Page: Pipeline — Kanban with drag & drop
  // ============================================
  renderPipeline() {
    const companies = this.state.companies;
    const statuses = [
      { key: '已投递', color: 'var(--info)', bg: '#dbeafe', icon: 'fa-paper-plane' },
      { key: '笔试中', color: 'var(--warning)', bg: '#fef3c7', icon: 'fa-pen' },
      { key: '面试中', color: 'var(--highlight)', bg: 'var(--highlight-light)', icon: 'fa-users' },
      { key: '已offer', color: 'var(--success)', bg: '#d1fae5', icon: 'fa-trophy' },
      { key: '已拒', color: 'var(--danger)', bg: '#fee2e2', icon: 'fa-xmark' },
      { key: '已放弃', color: 'var(--text-tertiary)', bg: 'var(--bg-soft)', icon: 'fa-flag' },
    ];
    const pipeline = {};
    statuses.forEach(s => pipeline[s.key] = []);
    companies.forEach(c => {
      if (c.applyStatus !== '未投递' && pipeline[c.applyStatus]) {
        pipeline[c.applyStatus].push(c);
      }
    });

    const totalApplied = companies.filter(c => c.applyStatus !== '未投递').length;
    const offerCount = pipeline['已offer'].length;
    const offerRate = totalApplied > 0 ? Math.round((offerCount / totalApplied) * 100) : 0;

    const html = `
      <!-- Progress overview -->
      <div class="stat-grid" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr));margin-bottom:1.5rem;">
        <div class="stat-card green">
          <div class="stat-icon"><i class="fas fa-paper-plane"></i></div>
          <div class="stat-value">${totalApplied}</div>
          <div class="stat-label">总投递数</div>
        </div>
        <div class="stat-card orange">
          <div class="stat-icon"><i class="fas fa-trophy"></i></div>
          <div class="stat-value">${offerCount}</div>
          <div class="stat-label">已获 Offer</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-icon"><i class="fas fa-percent"></i></div>
          <div class="stat-value">${offerRate}%</div>
          <div class="stat-label">Offer 获取率</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon"><i class="fas fa-hourglass-half"></i></div>
          <div class="stat-value">${pipeline['笔试中'].length + pipeline['面试中'].length}</div>
          <div class="stat-label">进行中</div>
        </div>
      </div>

      ${totalApplied === 0 ? `
        <div class="empty-state">
          <i class="fas fa-clipboard-list"></i>
          <h3>还没有投递记录</h3>
          <p>在企业库中点击企业卡片，在详情弹窗中设置投递状态后会显示在这里</p>
          <a href="#companies" class="btn btn-primary" style="margin-top:1rem;"><i class="fas fa-building"></i> 浏览企业库</a>
        </div>
      ` : `
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;font-size:0.8rem;color:var(--text-secondary);">
          <i class="fas fa-circle-info" style="color:var(--info)"></i>
          提示：可以拖拽企业卡片到不同列来更新投递状态
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;">
          ${statuses.map(s => `
            <div class="card" style="padding:0.75rem;border-top:4px solid ${s.color};"
              ondragover="event.preventDefault();this.style.background='${s.bg}';"
              ondragleave="this.style.background='';"
              ondrop="App.handlePipelineDrop(event, '${s.key}')"
              data-status="${s.key}">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;padding:0 0.25rem;">
                <div style="display:flex;align-items:center;gap:0.4rem;font-weight:600;font-size:0.88rem;color:${s.color};">
                  <i class="fas ${s.icon}"></i> ${s.key}
                </div>
                <span style="background:${s.bg};color:${s.color};font-size:0.75rem;font-weight:700;padding:2px 10px;border-radius:var(--radius-full);">${pipeline[s.key].length}</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:0.4rem;min-height:60px;">
                ${pipeline[s.key].map(c => `
                  <div class="company-card" style="padding:0.65rem;cursor:grab;border-left:3px solid ${s.color};"
                    draggable="true"
                    ondragstart="App.handlePipelineDragStart(event, '${c.id}')"
                    ondragend="this.style.opacity='1';"
                    onclick="App.showCompanyDetail('${c.id}')">
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.3rem;">
                      <div style="font-weight:600;font-size:0.82rem;flex:1;">${Utils.esc(c.companyName)}</div>
                      ${c.starRating ? `<span style="color:var(--star-gold);font-size:0.7rem;">${'★'.repeat(c.starRating)}</span>` : ''}
                    </div>
                    <div style="font-size:0.7rem;color:var(--text-secondary);margin-top:0.2rem;">${Utils.esc(Utils.truncate(c.positionName, 28))}</div>
                    <div style="font-size:0.68rem;color:var(--text-tertiary);margin-top:0.15rem;">
                      <i class="fas fa-map-marker-alt"></i> ${Utils.esc(Utils.primaryLocation(c.location))}
                    </div>
                  </div>
                `).join('') || '<div style="color:var(--text-tertiary);font-size:0.78rem;text-align:center;padding:1rem 0.5rem;border:2px dashed var(--border);border-radius:var(--radius-md);">拖拽到此处</div>'}
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;

    this.renderPage(
      '<i class="fas fa-clipboard-check" style="color:var(--primary)"></i> 我的投递',
      '追踪每家企业的投递进度',
      html
    );
  },

  _draggedCompanyId: null,

  handlePipelineDragStart(event, companyId) {
    this._draggedCompanyId = companyId;
    event.dataTransfer.effectAllowed = 'move';
    event.target.style.opacity = '0.5';
  },

  async handlePipelineDrop(event, newStatus) {
    event.preventDefault();
    // Reset all column backgrounds
    document.querySelectorAll('[data-status]').forEach(el => el.style.background = '');

    const companyId = this._draggedCompanyId;
    this._draggedCompanyId = null;

    if (!companyId) return;

    const company = this.state.companies.find(c => c.id === companyId);
    if (!company || company.applyStatus === newStatus) return;

    company.applyStatus = newStatus;
    await DB.saveCompany(company);
    Utils.toast(`「${company.companyName}」已移至「${newStatus}」`, 'success');
    this.renderPipeline();
  },

  // ============================================
  // Page: Settings
  // ============================================
  async renderSettings() {
    const config = await DB.getConfig();

    const html = `
      <div style="max-width:600px;">
        <div class="card">
          <div class="filter-title" style="margin-bottom:1rem;">
            <i class="fas fa-robot" style="color:var(--primary)"></i>
            大模型 API 配置
          </div>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1rem;">
            配置大模型 API 以启用智能匹配功能。推荐使用<strong style="color:var(--primary-dark);">智谱 GLM-4-Flash</strong>（完全免费）。
          </p>

          <div style="display:flex;flex-direction:column;gap:1rem;">
            <div>
              <label class="filter-label">API 服务商</label>
              <select class="sort-select" style="width:100%;margin-top:0.3rem;" id="cfg-provider" onchange="App.onProviderChange(this.value)">
                <option value="zhipu" ${config.llmProvider==='zhipu'?'selected':''}>智谱 GLM</option>
                <option value="siliconflow" ${config.llmProvider==='siliconflow'?'selected':''}>硅基流动 SiliconFlow</option>
                <option value="deepseek" ${config.llmProvider==='deepseek'?'selected':''}>DeepSeek</option>
                <option value="custom" ${config.llmProvider==='custom'?'selected':''}>自定义</option>
              </select>
            </div>

            <div>
              <label class="filter-label">API Base URL</label>
              <input type="text" class="filter-search" id="cfg-baseurl" value="${Utils.esc(config.apiBaseUrl)}" style="margin-top:0.3rem;">
            </div>

            <div>
              <label class="filter-label">API Key</label>
              <input type="password" class="filter-search" id="cfg-apikey" value="${Utils.esc(config.apiKey)}" placeholder="输入 API Key" style="margin-top:0.3rem;">
            </div>

            <div>
              <label class="filter-label">模型名称</label>
              <input type="text" class="filter-search" id="cfg-model" value="${Utils.esc(config.modelName)}" style="margin-top:0.3rem;">
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
              <div>
                <label class="filter-label">Max Tokens</label>
                <input type="number" class="filter-search" id="cfg-maxtokens" value="${config.maxTokens}" style="margin-top:0.3rem;">
              </div>
              <div>
                <label class="filter-label">Temperature</label>
                <input type="number" class="filter-search" id="cfg-temp" value="${config.temperature}" step="0.1" min="0" max="2" style="margin-top:0.3rem;">
              </div>
            </div>
          </div>

          <div style="display:flex;gap:0.5rem;margin-top:1.5rem;">
            <button class="btn btn-primary" onclick="App.saveSettings()">
              <i class="fas fa-save"></i> 保存配置
            </button>
            <button class="btn btn-secondary" onclick="App.testAPI()">
              <i class="fas fa-vial"></i> 测试连接
            </button>
          </div>
        </div>

        <div class="card" style="margin-top:1rem;">
          <div class="filter-title" style="margin-bottom:0.75rem;">
            <i class="fas fa-circle-question" style="color:var(--info)"></i>
            如何获取免费 API Key？
          </div>
          <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.8;">
            <p style="margin-bottom:0.5rem;"><strong style="color:var(--primary-dark);">智谱 GLM-4-Flash（推荐，完全免费）：</strong></p>
            <ol style="padding-left:1.5rem;margin-bottom:1rem;">
              <li>访问 <a href="https://open.bigmodel.cn" target="_blank" style="color:var(--primary);">open.bigmodel.cn</a> 注册账号</li>
              <li>进入「API Keys」页面创建密钥</li>
              <li>GLM-4-Flash 模型完全免费，无额度限制</li>
            </ol>
            <p style="margin-bottom:0.5rem;"><strong style="color:var(--primary-dark);">硅基流动（大量免费模型）：</strong></p>
            <ol style="padding-left:1.5rem;">
              <li>访问 <a href="https://siliconflow.cn" target="_blank" style="color:var(--primary);">siliconflow.cn</a> 注册</li>
              <li>在「API 密钥」中创建密钥</li>
              <li>可免费使用 Qwen2.5-7B 等多个模型</li>
            </ol>
          </div>
        </div>

        <div class="card" style="margin-top:1rem;">
          <div class="filter-title" style="margin-bottom:0.75rem;">
            <i class="fas fa-database" style="color:var(--accent)"></i>
            数据管理
          </div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" onclick="App.exportAllData()">
              <i class="fas fa-download"></i> 导出全部数据
            </button>
            <button class="btn btn-secondary btn-sm" onclick="App.confirmClearAll()">
              <i class="fas fa-trash"></i> 清空所有数据
            </button>
          </div>
        </div>
      </div>
    `;

    this.renderPage(
      '<i class="fas fa-gear" style="color:var(--primary)"></i> 设置',
      '配置大模型 API 和管理数据',
      html
    );
  },

  onProviderChange(provider) {
    const presets = {
      zhipu: { apiBaseUrl: 'https://open.bigmodel.cn/api/paas/v4', modelName: 'glm-4-flash' },
      siliconflow: { apiBaseUrl: 'https://api.siliconflow.cn/v1', modelName: 'Qwen/Qwen2.5-7B-Instruct' },
      deepseek: { apiBaseUrl: 'https://api.deepseek.com/v1', modelName: 'deepseek-chat' },
      custom: { apiBaseUrl: '', modelName: '' },
    };
    const preset = presets[provider];
    if (preset) {
      document.getElementById('cfg-baseurl').value = preset.apiBaseUrl;
      document.getElementById('cfg-model').value = preset.modelName;
    }
  },

  async saveSettings() {
    const config = {
      llmProvider: document.getElementById('cfg-provider').value,
      apiBaseUrl: document.getElementById('cfg-baseurl').value,
      apiKey: document.getElementById('cfg-apikey').value,
      modelName: document.getElementById('cfg-model').value,
      maxTokens: parseInt(document.getElementById('cfg-maxtokens').value) || 4096,
      temperature: parseFloat(document.getElementById('cfg-temp').value) || 0.3,
      theme: 'light',
      pageSize: 20,
    };
    await DB.saveConfig(config);
    AIClient.reset();
    Utils.toast('配置已保存', 'success');
  },

  async testAPI() {
    const baseUrl = document.getElementById('cfg-baseurl').value;
    const apiKey = document.getElementById('cfg-apikey').value;
    const model = document.getElementById('cfg-model').value;

    if (!apiKey) {
      Utils.toast('请先填写 API Key', 'warning');
      return;
    }

    Utils.toast('正在测试连接...', 'info');

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: '你好，请回复"连接成功"' }],
          max_tokens: 20,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices[0].message.content;
        Utils.toast(`连接成功！模型回复：${reply.substring(0, 30)}`, 'success');
      } else {
        const err = await response.text();
        Utils.toast(`连接失败：${response.status} - ${err.substring(0, 50)}`, 'error');
      }
    } catch (err) {
      Utils.toast(`连接失败：${err.message}`, 'error');
    }
  },
};

// ============================================
// Boot
// ============================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
