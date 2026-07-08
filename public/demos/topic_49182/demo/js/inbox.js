let currentFilter = 'all';
let currentIntent = null;

function initNavbar() {
  const navbar = document.getElementById('navbar');
  navbar.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center space-x-2">
          <a href="index.html" class="flex items-center space-x-2">
            <div class="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center animate-glow-pulse">
              <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span class="text-xl font-bold text-zinc-50">LinkForge</span>
          </a>
        </div>
        
        <div class="hidden md:flex flex-1 max-w-xl mx-8">
          <div class="relative w-full">
            <input type="text" id="searchInput" placeholder="搜索企业、能力或需求..." 
              class="w-full px-4 py-2.5 pl-10 rounded-xl border border-white/10 bg-zinc-900 text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <div class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-md text-xs font-mono font-semibold">AI</div>
          </div>
        </div>
        
        <div class="flex items-center space-x-3">
          <button onclick="window.location.href='inbox.html'" class="p-2 hover:bg-zinc-800 rounded-lg transition-colors relative">
            <svg class="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button onclick="window.location.href='onboard.html'" class="hidden sm:inline-flex px-4 py-2 text-zinc-400 font-medium hover:text-zinc-50 transition-colors">
            入驻企业
          </button>
          <button id="mobile-menu-btn" class="md:hidden p-2 text-zinc-400">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div id="mobile-menu" class="hidden md:hidden bg-zinc-900 border-t border-white/10">
      <div class="px-4 py-3 space-y-2">
        <a href="index.html" class="block px-4 py-2 text-zinc-400 hover:bg-zinc-800 rounded-lg font-medium">首页</a>
        <a href="search.html" class="block px-4 py-2 text-zinc-400 hover:bg-zinc-800 rounded-lg font-medium">找企业</a>
        <a href="inbox.html" class="block px-4 py-2 text-cyan-400 bg-zinc-800 rounded-lg font-medium">收件箱</a>
        <a href="onboard.html" class="block px-4 py-2 text-cyan-400 hover:bg-zinc-800 rounded-lg font-medium">入驻企业</a>
        <a href="contact.html" class="block px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg font-medium text-center">发起合作</a>
      </div>
    </div>
  `;

  document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    document.getElementById('mobile-menu').classList.toggle('hidden');
  });

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('shadow-lg', 'shadow-cyan-500/5');
    } else {
      navbar.classList.remove('shadow-lg', 'shadow-cyan-500/5');
    }
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
      }
    });
  }
}

function getIntents() {
  const stored = Utils.storage.get('cooperation_intents', []);
  return [...Data.COOPERATION_INTENTS, ...stored];
}

function countByStatus(intents) {
  const counts = {
    all: intents.length,
    pending: intents.filter(i => i.status === 'pending').length,
    viewed: intents.filter(i => i.status === 'viewed').length,
    accepted: intents.filter(i => i.status === 'accepted').length,
    completed: intents.filter(i => i.status === 'completed').length
  };
  return counts;
}

function renderCounts(counts) {
  document.getElementById('count-all').textContent = counts.all;
  document.getElementById('count-pending').textContent = counts.pending;
  document.getElementById('count-viewed').textContent = counts.viewed;
  document.getElementById('count-accepted').textContent = counts.accepted;
  document.getElementById('count-completed').textContent = counts.completed;
}

function getStatusLabel(status) {
  const labels = {
    pending: { text: '新机会', color: 'text-red-400', bg: 'bg-red-500/10' },
    viewed: { text: '已接洽', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    accepted: { text: '已合作', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    completed: { text: '已完成', color: 'text-zinc-400', bg: 'bg-zinc-700/40' }
  };
  return labels[status] || labels.pending;
}

function renderIntentCard(intent) {
  const fromCompany = Data.getCompanyById(intent.fromCompanyId) || { name: '未知企业', industry: '未知行业', city: '未知', trustScore: { overall: 0 } };
  const toCompany = Data.getCompanyById(intent.toCompanyId) || { name: '未知企业', industry: '未知行业' };
  const status = getStatusLabel(intent.status);
  const level = Utils.getCompanyLevel(fromCompany.trustScore.overall);

  return `
    <div class="bg-zinc-800/60 rounded-2xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-all intent-card" data-intent-id="${intent.id}">
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 ${level.bg} rounded-xl flex items-center justify-center">
            <span class="text-xl font-bold ${level.color}">${level.level}</span>
          </div>
          <div>
            <h3 class="font-semibold text-zinc-300">${fromCompany.name}</h3>
            <p class="text-sm text-zinc-400">${fromCompany.city} · ${fromCompany.industry}</p>
          </div>
        </div>
        <span class="px-3 py-1 ${status.bg} ${status.color} rounded-full text-xs font-medium">${status.text}</span>
      </div>
      
      <div class="flex items-center gap-2 mb-3">
        <span class="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-medium">${intent.cooperationType}</span>
        <span class="px-2 py-1 bg-zinc-700/60 text-zinc-400 rounded-lg text-xs">${intent.budgetRange}</span>
      </div>
      
      <p class="text-zinc-400 text-sm mb-3 line-clamp-2">${intent.description}</p>
      
      <div class="flex items-center justify-between">
        <span class="text-xs text-zinc-500">${Utils.getTimeAgo(intent.createdAt)}</span>
        <button class="detail-btn text-cyan-400 text-sm font-medium hover:text-cyan-300 flex items-center gap-1" data-intent-id="${intent.id}">
          查看详情
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
}

function renderList(intents) {
  const listContainer = document.getElementById('inbox-list');
  
  if (intents.length === 0) {
    listContainer.innerHTML = `
      <div class="bg-zinc-800/60 rounded-2xl shadow-sm p-8 text-center">
        <div class="w-16 h-16 mx-auto mb-4 bg-zinc-700 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-zinc-300 mb-2">暂无合作机会</h3>
        <p class="text-zinc-400 mb-4">发起合作或发布需求后，机会将出现在这里</p>
        <button onclick="window.location.href='index.html'" class="px-6 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-all font-medium">
          去搜索企业
        </button>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = intents.map(renderIntentCard).join('');

  // 为查看详情按钮添加点击事件
  document.querySelectorAll('.detail-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // 阻止事件冒泡到卡片
      const intentId = btn.dataset.intentId;
      // 跳转到详情页面
      window.location.href = `intent-detail.html?id=${intentId}`;
    });
  });
  
  // 为卡片添加点击事件（整个卡片点击也跳转）
  document.querySelectorAll('.intent-card').forEach(card => {
    card.addEventListener('click', () => {
      const intentId = card.dataset.intentId;
      // 跳转到详情页面
      window.location.href = `intent-detail.html?id=${intentId}`;
    });
  });
}

function filterIntents(filter) {
  currentFilter = filter;
  
  document.querySelectorAll('[id^="filter-"]').forEach(btn => {
    btn.classList.remove('bg-cyan-500/20', 'text-cyan-400');
    btn.classList.add('hover:bg-zinc-700/60', 'text-zinc-400');
  });
  
  const activeBtn = document.getElementById(`filter-${filter}`);
  if (activeBtn) {
    activeBtn.classList.remove('hover:bg-zinc-700/60', 'text-zinc-400');
    activeBtn.classList.add('bg-cyan-500/20', 'text-cyan-400');
  }

  const mobileBtns = {
    all: document.getElementById('mobile-filter-all'),
    pending: document.getElementById('mobile-filter-pending'),
    accepted: document.getElementById('mobile-filter-accepted')
  };
  
  Object.values(mobileBtns).forEach(btn => {
    if (btn) {
      btn.classList.remove('bg-cyan-500', 'text-white');
      btn.classList.add('bg-zinc-700/60', 'text-zinc-400');
    }
  });
  
  if (mobileBtns[filter]) {
    mobileBtns[filter].classList.remove('bg-zinc-700/60', 'text-zinc-400');
    mobileBtns[filter].classList.add('bg-cyan-500', 'text-white');
  }

  const intents = getIntents();
  let filtered = intents;
  
  if (filter !== 'all') {
    filtered = intents.filter(i => i.status === filter);
  }
  
  renderList(filtered);
}

function initPage() {
  const intents = getIntents();
  const counts = countByStatus(intents);
  
  renderCounts(counts);
  
  if (Utils.isMobile()) {
    document.getElementById('mobile-filter').classList.remove('hidden');
  }
  
  filterIntents(currentFilter);
}

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initPage();

  document.getElementById('filter-all').addEventListener('click', () => filterIntents('all'));
  document.getElementById('filter-pending').addEventListener('click', () => filterIntents('pending'));
  document.getElementById('filter-viewed').addEventListener('click', () => filterIntents('viewed'));
  document.getElementById('filter-accepted').addEventListener('click', () => filterIntents('accepted'));
  document.getElementById('filter-completed').addEventListener('click', () => filterIntents('completed'));

  document.getElementById('mobile-filter-all').addEventListener('click', () => filterIntents('all'));
  document.getElementById('mobile-filter-pending').addEventListener('click', () => filterIntents('pending'));
  document.getElementById('mobile-filter-accepted').addEventListener('click', () => filterIntents('accepted'));

  document.getElementById('close-detail').addEventListener('click', () => {
    document.getElementById('inbox-detail').classList.add('hidden');
    document.getElementById('inbox-list').classList.remove('hidden');
    document.getElementById('mobile-filter').classList.remove('hidden');
  });
});