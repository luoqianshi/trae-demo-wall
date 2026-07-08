// ========== 搜索与筛选模块 ==========

function renderSearchPage() {
  // 重置筛选面板
  applySearchFilter();

  // 绑定搜索
  const keywordInput = document.getElementById('search-keyword');
  if (keywordInput) {
    keywordInput.oninput = debounce(applySearchFilter, 300);
    keywordInput.onkeydown = function(e) {
      if (e.key === 'Enter') applySearchFilter();
    };
  }

  // 绑定筛选
  ['filter-gender', 'filter-age', 'filter-missing-time', 'filter-status', 'filter-sort'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.onchange = applySearchFilter;
  });
}

function toggleFilterPanel() {
  const panel = document.getElementById('filter-panel');
  const btn = document.getElementById('filter-toggle-btn');
  if (panel) {
    panel.classList.toggle('hidden');
    if (btn) {
      btn.innerHTML = panel.classList.contains('hidden')
        ? '<i class="fa-solid fa-chevron-down mr-1"></i>展开更多筛选条件'
        : '<i class="fa-solid fa-chevron-up mr-1"></i>收起筛选条件';
    }
  }
}

function resetSearchFilter() {
  document.getElementById('search-keyword').value = '';
  document.getElementById('filter-gender').value = '';
  document.getElementById('filter-age').value = '';
  document.getElementById('filter-missing-time').value = '';
  document.getElementById('filter-status').value = '';
  document.getElementById('filter-sort').value = 'latest';
  applySearchFilter();
}

function applySearchFilter() {
  const keyword = document.getElementById('search-keyword').value.toLowerCase().trim();
  const gender = document.getElementById('filter-gender').value;
  const ageGroup = document.getElementById('filter-age').value;
  const missingTime = document.getElementById('filter-missing-time').value;
  const status = document.getElementById('filter-status').value;
  const sort = document.getElementById('filter-sort').value;

  let persons = getAllPersons();

  // 关键词搜索
  if (keyword) {
    persons = persons.filter(p =>
      (p.name && p.name.toLowerCase().includes(keyword)) ||
      (p.missingLocation && p.missingLocation.toLowerCase().includes(keyword)) ||
      (p.description && p.description.toLowerCase().includes(keyword)) ||
      (p.features && p.features.toLowerCase().includes(keyword))
    );
  }

  // 性别筛选
  if (gender) {
    persons = persons.filter(p => p.gender === gender);
  }

  // 状态筛选
  if (status) {
    persons = persons.filter(p => p.status === status);
  }

  // 年龄段筛选
  if (ageGroup) {
    const now = new Date();
    persons = persons.filter(p => {
      if (!p.birthDate) {
        // 如果没有出生日期，根据失踪日期估算
        return ageGroup === 'kid' || ageGroup === 'child';
      }
      try {
        const birth = new Date(p.birthDate);
        const age = Math.floor((now - birth) / (365.25 * 24 * 60 * 60 * 1000));
        if (ageGroup === 'child') return age < 4;
        if (ageGroup === 'kid') return age >= 4 && age <= 10;
        if (ageGroup === 'teen') return age >= 11 && age <= 18;
        if (ageGroup === 'adult') return age > 18;
      } catch (e) {}
      return false;
    });
  }

  // 失踪时间筛选
  if (missingTime) {
    const now = Date.now();
    const month = 30 * 24 * 60 * 60 * 1000;
    const year = 365 * 24 * 60 * 60 * 1000;
    persons = persons.filter(p => {
      try {
        const missingDate = new Date(p.missingDate).getTime();
        const diff = now - missingDate;
        if (missingTime === '1month') return diff <= month;
        if (missingTime === '1year') return diff <= year;
        if (missingTime === '3years') return diff > year && diff <= 3 * year;
        if (missingTime === '10years') return diff > 10 * year;
      } catch (e) {}
      return false;
    });
  }

  // 排序
  if (sort === 'latest') {
    persons.sort((a, b) => b.createdAt - a.createdAt);
  } else if (sort === 'oldest') {
    persons.sort((a, b) => a.createdAt - b.createdAt);
  }

  // 渲染结果
  const container = document.getElementById('search-results');
  const countEl = document.getElementById('search-result-count');

  if (countEl) countEl.textContent = persons.length;

  if (!container) return;

  if (persons.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="text-6xl text-gray-300 mb-4"><i class="fa-solid fa-magnifying-glass"></i></div>
        <h3 class="text-xl font-bold text-gray-700 mb-2">未找到匹配的寻亲信息</h3>
        <p class="text-gray-500">请尝试调整搜索关键词或筛选条件</p>
      </div>
    `;
    return;
  }

  container.innerHTML = persons.map(p => {
    const isReunited = p.status === 'reunited';
    return `
      <div class="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition transform hover:-translate-y-1 ${isReunited ? 'border-2 border-reunion' : ''}" onclick="navigateTo('detail', '${p.id}')">
        <div class="relative">
          <img src="${p.photos[0] || ''}" alt="${p.name}" class="w-full h-56 object-cover" />
          <span class="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full shadow-md ${isReunited ? 'bg-reunion text-white' : 'bg-missing text-white'}">
            <i class="fa-solid mr-1 ${isReunited ? 'fa-heart' : 'fa-person-circle-question'}"></i>${isReunited ? '已团聚' : '寻找中'}
          </span>
        </div>
        <div class="p-4">
          <h3 class="text-lg font-bold text-gray-800 mb-2">${p.name}</h3>
          <div class="text-sm text-gray-600 space-y-1 mb-3">
            <div><i class="fa-solid fa-location-dot mr-2 text-gray-400"></i>${p.missingLocation}</div>
            <div><i class="fa-solid fa-calendar mr-2 text-gray-400"></i>${p.missingDate}</div>
            <div><i class="fa-solid fa-venus-mars mr-2 text-gray-400"></i>${p.gender || '未知'}${p.birthDate ? ' · ' + p.birthDate + '出生' : ''}</div>
          </div>
          <p class="text-sm text-gray-600 line-clamp-2 mb-3">${escapeHtml(p.description)}</p>
          ${isReunited && p.reunion
            ? `<div class="text-xs text-reunion-dark font-semibold bg-reunion-light p-2 rounded">
                <i class="fa-solid fa-heart mr-1"></i>失踪 ${p.reunion.missingDuration} 天后团聚
              </div>`
            : `<div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">发布于 ${formatDate(p.createdAt)}</span>
                <span class="text-reunion-dark font-semibold text-sm hover:underline">查看详情 →</span>
              </div>`
          }
        </div>
      </div>
    `;
  }).join('');
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
