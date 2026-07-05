// 状态管理
const state = {
  selectedCity: null,
  userAge: null,
  userMajor: '',
  filters: {
    types: [],
    status: null,
    year: null,
  },
  sortBy: 'date-desc',
};

// DOM 元素引用
const elements = {
  ageInput: document.getElementById('ageInput'),
  majorInput: document.getElementById('majorInput'),
  matchBtn: document.getElementById('matchBtn'),
  citySelector: document.getElementById('citySelector'),
  citySelectorText: document.getElementById('citySelectorText'),
  cityDropdown: document.getElementById('cityDropdown'),
  citySearchInput: document.getElementById('citySearchInput'),
  cityList: document.getElementById('cityList'),
  cityQuickGrid: document.getElementById('cityQuickGrid'),
  examList: document.getElementById('examList'),
  resultsCount: document.getElementById('resultsCount'),
  currentCityTag: document.getElementById('currentCityTag'),
  currentCityName: document.getElementById('currentCityName'),
  clearCityBtn: document.getElementById('clearCityBtn'),
  sortSelect: document.getElementById('sortSelect'),
  typeFilter: document.getElementById('typeFilter'),
  statusFilter: document.getElementById('statusFilter'),
  yearFilter: document.getElementById('yearFilter'),
  modal: document.getElementById('modal'),
  modalContent: document.getElementById('modalContent'),
  modalOverlay: document.getElementById('modalOverlay'),
  // 统计概览
  totalExams: document.getElementById('totalExams'),
  totalPositions: document.getElementById('totalPositions'),
  applyingExams: document.getElementById('applyingExams'),
  totalCities: document.getElementById('totalCities'),
};

// 初始化城市选择器下拉列表
function initCityDropdown() {
  renderCityList('');

  // 城市选择器点击事件
  elements.citySelector.addEventListener('click', (e) => {
    // 点击下拉框内部（搜索框、城市项等）时不切换，避免误关闭
    if (e.target.closest('.city-dropdown')) return;
    e.stopPropagation();
    elements.citySelector.classList.toggle('open');
    elements.cityDropdown.classList.toggle('show');
    if (elements.cityDropdown.classList.contains('show')) {
      elements.citySearchInput.focus();
    }
  });

  // 城市搜索
  elements.citySearchInput.addEventListener('input', (e) => {
    renderCityList(e.target.value);
  });

  // 阻止搜索框点击事件冒泡，防止触发外层关闭逻辑
  elements.citySearchInput.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // 点击外部关闭
  document.addEventListener('click', (e) => {
    if (!elements.citySelector.contains(e.target)) {
      elements.citySelector.classList.remove('open');
      elements.cityDropdown.classList.remove('show');
    }
  });
}

// 获取城市数据
function getCityByName(name) {
  return cityData.find((c) => c.name === name);
}

// 渲染城市列表（下拉菜单）
function renderCityList(keyword) {
  const lowerKeyword = keyword.toLowerCase().trim();
  let html = '<div class="city-dropdown-header">山东省 · 17个地市</div>';

  const filteredCities = cityData.filter((city) =>
    city.name.toLowerCase().includes(lowerKeyword) ||
    city.districts.some((d) => d.toLowerCase().includes(lowerKeyword))
  );

  if (filteredCities.length === 0) {
    html += '<div class="city-dropdown-item" style="color: var(--text-light); cursor: default;">未找到相关城市</div>';
  } else {
    filteredCities.forEach((city) => {
      const isSelected = state.selectedCity === city.name;
      const count = examData.filter((e) => e.city === city.name).length;
      html += `
        <div class="city-dropdown-item ${isSelected ? 'selected' : ''}" data-city="${city.name}">
          <span>${city.name}</span>
          <span class="city-count">${count}条</span>
        </div>
      `;
    });
  }

  elements.cityList.innerHTML = html;

  // 绑定城市点击事件
  elements.cityList.querySelectorAll('.city-dropdown-item[data-city]').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const city = e.currentTarget.dataset.city;
      selectCity(city);
    });
  });
}

// 渲染城市快速选择网格
function renderCityQuickGrid() {
  let html = '';
  cityData.forEach((city) => {
    const isActive = state.selectedCity === city.name;
    const count = examData.filter((e) => e.city === city.name).length;
    html += `
      <div class="city-quick-item ${isActive ? 'active' : ''}" data-city="${city.name}" title="${city.name}（${count}条信息）">
        ${city.name.replace('市', '')}
      </div>
    `;
  });
  elements.cityQuickGrid.innerHTML = html;

  // 绑定点击事件
  elements.cityQuickGrid.querySelectorAll('.city-quick-item').forEach((item) => {
    item.addEventListener('click', () => {
      const city = item.dataset.city;
      if (state.selectedCity === city) {
        clearCity();
      } else {
        selectCity(city);
      }
    });
  });
}

// 选择城市
function selectCity(city) {
  state.selectedCity = city;
  elements.citySelectorText.textContent = city;
  elements.citySelectorText.classList.remove('placeholder');
  elements.citySelector.classList.remove('open');
  elements.cityDropdown.classList.remove('show');
  elements.currentCityName.textContent = city;
  elements.currentCityTag.style.display = 'inline-flex';
  renderCityQuickGrid();
  renderExamList();
}

// 清除城市选择
function clearCity() {
  state.selectedCity = null;
  elements.citySelectorText.textContent = '选择城市';
  elements.citySelectorText.classList.add('placeholder');
  elements.currentCityTag.style.display = 'none';
  renderCityList('');
  renderCityQuickGrid();
  renderExamList();
}

// 初始化筛选器
function initFilters() {
  // 考试类型筛选
  const types = [...new Set(examData.map((e) => e.type))];
  elements.typeFilter.innerHTML = types.map((type) => {
    const count = examData.filter((e) => e.type === type).length;
    return `
      <label class="filter-option">
        <input type="checkbox" value="${type}" data-filter="type">
        <span>${type}</span>
        <span class="count">${count}</span>
      </label>
    `;
  }).join('');

  // 状态筛选
  const statuses = ['全部', ...new Set(examData.map((e) => e.status))];
  elements.statusFilter.innerHTML = statuses.map((status, idx) => {
    const count = status === '全部' ? examData.length : examData.filter((e) => e.status === status).length;
    return `
      <label class="filter-option">
        <input type="radio" name="status" value="${status === '全部' ? '' : status}" data-filter="status" ${idx === 0 ? 'checked' : ''}>
        <span>${status}</span>
        <span class="count">${count}</span>
      </label>
    `;
  }).join('');

  // 年份筛选
  const years = [...new Set(examData.map((e) => new Date(e.publishDate).getFullYear()))].sort((a, b) => b - a);
  elements.yearFilter.innerHTML = `
    <label class="filter-option">
      <input type="radio" name="year" value="" data-filter="year" checked>
      <span>全部年份</span>
      <span class="count">${examData.length}</span>
    </label>
  ` + years.map((year) => {
    const count = examData.filter((e) => new Date(e.publishDate).getFullYear() === year).length;
    return `
      <label class="filter-option">
        <input type="radio" name="year" value="${year}" data-filter="year">
        <span>${year}年</span>
        <span class="count">${count}</span>
      </label>
    `;
  }).join('');

  // 监听筛选变化
  document.querySelectorAll('input[data-filter="type"]').forEach((input) => {
    input.addEventListener('change', () => {
      state.filters.types = Array.from(document.querySelectorAll('input[data-filter="type"]:checked')).map((i) => i.value);
      renderExamList();
    });
  });

  document.querySelectorAll('input[data-filter="status"]').forEach((input) => {
    input.addEventListener('change', () => {
      state.filters.status = document.querySelector('input[data-filter="status"]:checked').value;
      renderExamList();
    });
  });

  document.querySelectorAll('input[data-filter="year"]').forEach((input) => {
    input.addEventListener('change', () => {
      state.filters.year = document.querySelector('input[data-filter="year"]:checked').value;
      renderExamList();
    });
  });

  // 折叠面板
  document.querySelectorAll('.filter-header').forEach((header) => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('collapsed');
    });
  });
}

// 高亮关键词
// 高亮专业关键词
function highlightKeyword(text, keyword) {
  if (!keyword) return text;
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<span class="highlight">$1</span>');
}

// 解析年龄要求中的数字
function parseAgeRange(ageStr) {
  // 匹配 "18-35周岁" "18至40周岁" "25周岁以下" "40周岁以下"
  const rangeMatch = ageStr.match(/(\d+)\s*[-至]\s*(\d+)/);
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) };
  }
  const belowMatch = ageStr.match(/(\d+)\s*周岁以下/);
  if (belowMatch) {
    return { min: 18, max: parseInt(belowMatch[1]) };
  }
  const aboveMatch = ageStr.match(/(\d+)\s*周岁以上/);
  if (aboveMatch) {
    return { min: parseInt(aboveMatch[1]), max: 60 };
  }
  return null;
}

// 检查年龄是否符合报考要求
function isAgeEligible(userAge, ageStr) {
  if (!userAge) return true; // 未输入年龄则不做限制
  const range = parseAgeRange(ageStr);
  if (!range) return true;
  return userAge >= range.min && userAge <= range.max;
}

// 检查专业是否匹配
function isMajorEligible(userMajor, exam) {
  if (!userMajor) return true; // 未输入专业则不做限制
  const major = userMajor.toLowerCase().trim();
  // 检查不限专业的岗位
  if (exam.positions.some((p) => p.major.includes('不限专业'))) return true;
  // 检查职位表中的专业要求
  return exam.positions.some((p) =>
    p.major.toLowerCase().includes(major) ||
    major.includes(p.major.toLowerCase().split('、')[0])
  );
}

// 过滤和排序考试数据
function getFilteredExams() {
  let result = [...examData];

  // 城市筛选
  if (state.selectedCity) {
    result = result.filter((e) => e.city === state.selectedCity);
  }

  // 年龄筛选
  if (state.userAge) {
    result = result.filter((e) => isAgeEligible(state.userAge, e.requirements.age));
  }

  // 专业筛选
  if (state.userMajor) {
    result = result.filter((e) => isMajorEligible(state.userMajor, e));
  }

  // 考试类型筛选
  if (state.filters.types.length > 0) {
    result = result.filter((e) => state.filters.types.includes(e.type));
  }

  // 状态筛选
  if (state.filters.status) {
    result = result.filter((e) => e.status === state.filters.status);
  }

  // 年份筛选
  if (state.filters.year) {
    result = result.filter((e) => new Date(e.publishDate).getFullYear().toString() === state.filters.year);
  }

  // 排序
  switch (state.sortBy) {
    case 'date-desc':
      result.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
      break;
    case 'date-asc':
      result.sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate));
      break;
    case 'positions-desc':
      result.sort((a, b) => b.positionCount - a.positionCount);
      break;
    case 'competition-asc':
      result.sort((a, b) => parseFloat(a.competitionRatio) - parseFloat(b.competitionRatio));
      break;
  }

  return result;
}

// 渲染统计概览
function renderStatsOverview() {
  const filteredExams = getFilteredExams();
  const totalPositions = filteredExams.reduce((sum, e) => sum + e.positionCount, 0);
  const applyingExams = filteredExams.filter((e) => e.status === '报名中').length;
  const cities = new Set(filteredExams.map((e) => e.city)).size;

  elements.totalExams.textContent = filteredExams.length;
  elements.totalPositions.textContent = totalPositions.toLocaleString();
  elements.applyingExams.textContent = applyingExams;
  elements.totalCities.textContent = cities;
}

// 渲染考试列表
function renderExamList() {
  const exams = getFilteredExams();
  // 构建匹配信息提示
  let matchInfo = '';
  if (state.userAge || state.userMajor) {
    const conditions = [];
    if (state.userAge) conditions.push(`年龄 ${state.userAge} 岁`);
    if (state.userMajor) conditions.push(`专业"${state.userMajor}"`);
    matchInfo = `（匹配条件：${conditions.join('、')}）`;
  }
  elements.resultsCount.innerHTML = `共找到 <strong>${exams.length}</strong> 条符合条件的公考信息${matchInfo}`;

  // 更新统计概览
  renderStatsOverview();

  if (exams.length === 0) {
    elements.examList.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <div class="empty-state-text">未找到相关公考信息</div>
        <div class="empty-state-sub">请尝试更换城市或调整筛选条件</div>
      </div>
    `;
    return;
  }

  elements.examList.innerHTML = exams.map((exam) => `
    <div class="exam-card" data-id="${exam.id}">
      <div class="exam-card-header">
        <span class="exam-type-tag ${exam.type}">${exam.type}</span>
        <a href="${exam.officialUrl}" target="_blank" class="exam-title-link" data-action="link">
          <h3 class="exam-title">${exam.title}</h3>
        </a>
        <span class="status-tag ${exam.status}">${exam.status}</span>
      </div>

      <div class="exam-card-stats">
        <div class="exam-stat">
          <div class="exam-stat-value">${exam.positionCount.toLocaleString()}</div>
          <div class="exam-stat-label">招录人数</div>
        </div>
        <div class="exam-stat">
          <div class="exam-stat-value">${exam.competitionRatio}</div>
          <div class="exam-stat-label">竞争比</div>
        </div>
        <div class="exam-stat">
          <div class="exam-stat-value">${exam.salaryRange.split('-')[0]}</div>
          <div class="exam-stat-label">起薪(月)</div>
        </div>
        <div class="exam-stat">
          <div class="exam-stat-value">${exam.applyCount.toLocaleString()}</div>
          <div class="exam-stat-label">报名人数</div>
        </div>
      </div>

      <div class="exam-card-meta">
        <div class="meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          <span>发布：<strong>${exam.publishDate}</strong></span>
        </div>
        <div class="meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>考试：<strong>${exam.examDate}</strong></span>
        </div>
        <div class="meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span>科目：<strong>${exam.subjects.join('、')}</strong></span>
        </div>
      </div>

      <div class="exam-card-footer">
        <div class="exam-city">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          ${exam.city}
        </div>
        <div class="card-actions">
          <a href="${exam.officialUrl}" target="_blank" class="visit-official" data-action="link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            访问官网
          </a>
          <span class="view-detail" data-action="detail">
            查看详情
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  `).join('');

  // 绑定卡片点击事件
  elements.examList.querySelectorAll('.exam-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-action="link"]');
      if (actionEl) return;
      const id = parseInt(card.dataset.id);
      showExamDetail(id);
    });
  });
}

// 显示考试详情
function showExamDetail(id) {
  const exam = examData.find((e) => e.id === id);
  if (!exam) return;

  const cityInfo = getCityByName(exam.city);

  elements.modalContent.innerHTML = `
    <button class="modal-close" id="modalCloseBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
    <div class="modal-header">
      <div class="modal-header-content">
        <div class="modal-type-row">
          <span class="modal-type-tag">${exam.type}</span>
          <span class="modal-status-tag ${exam.status}">${exam.status}</span>
        </div>
        <h2 class="modal-title">${exam.title}</h2>
        <div class="modal-meta-row">
          <div class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <span>发布：${exam.publishDate}</span>
          </div>
          <div class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>地区：${exam.city}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-body">
      <!-- 时间轴 -->
      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="timeline-label">公告发布</div>
          <div class="timeline-value">${exam.publishDate}</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div class="timeline-label">报名开始</div>
          <div class="timeline-value">${exam.registrationStart}</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div class="timeline-label">报名截止</div>
          <div class="timeline-value">${exam.registrationEnd}</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="timeline-label">笔试时间</div>
          <div class="timeline-value">${exam.examDate}</div>
        </div>
      </div>

      <!-- 核心数据统计 -->
      <div class="detail-section">
        <h3>核心数据</h3>
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-value highlight">${exam.positionCount.toLocaleString()}</div>
            <div class="stat-label">招录人数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${exam.applyCount.toLocaleString()}</div>
            <div class="stat-label">报名人数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value gold">${exam.competitionRatio}</div>
            <div class="stat-label">竞争比</div>
          </div>
          <div class="stat-card">
            <div class="stat-value gold">${exam.salaryRange}</div>
            <div class="stat-label">薪资范围</div>
          </div>
        </div>
      </div>

      <!-- 报考条件 -->
      <div class="detail-section">
        <h3>报考条件</h3>
        <div class="requirements-grid">
          <div class="requirement-item">
            <div class="requirement-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div class="requirement-content">
              <div class="requirement-label">学历要求</div>
              <div class="requirement-value">${exam.requirements.education}</div>
            </div>
          </div>
          <div class="requirement-item">
            <div class="requirement-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="requirement-content">
              <div class="requirement-label">年龄要求</div>
              <div class="requirement-value">${exam.requirements.age}</div>
            </div>
          </div>
          <div class="requirement-item">
            <div class="requirement-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div class="requirement-content">
              <div class="requirement-label">户籍要求</div>
              <div class="requirement-value">${exam.requirements.household}</div>
            </div>
          </div>
          <div class="requirement-item">
            <div class="requirement-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div class="requirement-content">
              <div class="requirement-label">政治条件</div>
              <div class="requirement-value">${exam.requirements.political}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 考试科目 -->
      <div class="detail-section">
        <h3>考试科目</h3>
        <div class="subjects-list">
          ${exam.subjects.map((subject) => `<div class="subject-card">${subject}</div>`).join('')}
        </div>
      </div>

      <!-- 职位表 -->
      <div class="detail-section">
        <h3>招录职位表</h3>
        <table class="positions-table">
          <thead>
            <tr>
              <th>职位名称</th>
              <th>招录人数</th>
              <th>专业要求</th>
              <th>学历要求</th>
            </tr>
          </thead>
          <tbody>
            ${exam.positions.map((pos) => `
              <tr>
                <td>${pos.name}</td>
                <td><span class="position-count">${pos.count}</span></td>
                <td>${pos.major}</td>
                <td>${pos.education}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 公告内容 -->
      <div class="detail-section">
        <h3>公告内容</h3>
        <p>${exam.content}</p>
        <a href="${exam.officialUrl}" target="_blank" rel="noopener noreferrer" class="view-original-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          查看公告原文
        </a>
      </div>

      <!-- 官方网站链接 -->
      ${cityInfo ? `
      <div class="detail-section">
        <h3>官方网站</h3>
        <div class="websites-grid">
          <a href="${cityInfo.websites.gov}" target="_blank" class="website-card">
            <div class="website-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div class="website-info">
              <div class="website-name">${cityInfo.name}政府官网</div>
              <div class="website-url">${cityInfo.websites.gov.replace('http://', '')}</div>
            </div>
          </a>
          <a href="${cityInfo.websites.rsj}" target="_blank" class="website-card">
            <div class="website-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="website-info">
              <div class="website-name">${cityInfo.name}人社局</div>
              <div class="website-url">${cityInfo.websites.rsj.replace('http://', '')}</div>
            </div>
          </a>
          <a href="${cityInfo.websites.exam}" target="_blank" class="website-card">
            <div class="website-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div class="website-info">
              <div class="website-name">考试报名入口</div>
              <div class="website-url">${cityInfo.websites.exam.replace('http://', '')}</div>
            </div>
          </a>
        </div>
      </div>

      <!-- 县区列表 -->
      <div class="detail-section">
        <h3>辖区范围</h3>
        <div class="districts-list">
          ${cityInfo.districts.map((district) => `<span class="district-tag">${district}</span>`).join('')}
        </div>
      </div>
      ` : ''}
    </div>
    <div class="modal-footer">
      <div class="footer-info">发布日期：${exam.publishDate} | 数据来源：官方公告</div>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="modalCloseBtn2">关闭</button>
        <a href="${exam.officialUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
          访问公告原文
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    </div>
  `;

  elements.modalOverlay.classList.add('show');
  document.body.style.overflow = 'hidden';

  // 绑定关闭按钮
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('modalCloseBtn2').addEventListener('click', closeModal);
}

// 关闭弹窗
function closeModal() {
  elements.modalOverlay.classList.remove('show');
  document.body.style.overflow = '';
}

// 初始化用户信息输入功能
function initUserInfo() {
  // 年龄输入（实时）
  elements.ageInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    state.userAge = val ? parseInt(val) : null;
    renderExamList();
  });

  // 专业输入（实时）
  elements.majorInput.addEventListener('input', (e) => {
    state.userMajor = e.target.value.trim();
    renderExamList();
  });

  // 匹配按钮
  elements.matchBtn.addEventListener('click', () => {
    state.userAge = elements.ageInput.value ? parseInt(elements.ageInput.value) : null;
    state.userMajor = elements.majorInput.value.trim();
    renderExamList();
    // 滚动到结果区域
    document.querySelector('.main-container').scrollIntoView({ behavior: 'smooth' });
  });

  // 专业输入框回车触发匹配
  elements.majorInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      elements.matchBtn.click();
    }
  });

  // 年龄输入框回车触发匹配
  elements.ageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      elements.matchBtn.click();
    }
  });

  // 清除城市
  elements.clearCityBtn.addEventListener('click', clearCity);

  // 排序
  elements.sortSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    renderExamList();
  });

  // 热门专业标签 - 点击填充专业输入框
  document.querySelectorAll('.hot-tag').forEach((tag) => {
    tag.addEventListener('click', () => {
      const major = tag.dataset.major;
      elements.majorInput.value = major;
      state.userMajor = major;
      renderExamList();
    });
  });

  // 弹窗关闭
  elements.modalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) {
      closeModal();
    }
  });

  // ESC 关闭弹窗
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.modalOverlay.classList.contains('show')) {
      closeModal();
    }
  });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initCityDropdown();
  renderCityQuickGrid();
  initFilters();
  initUserInfo();
  renderExamList();
});
