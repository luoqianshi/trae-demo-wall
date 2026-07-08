// ========== 应用主入口 - 路由与页面切换 ==========

let currentPage = 'home';
let currentPersonId = null;
let carouselInterval = null;

function initApp() {
  // 检查数据版本号 —— 版本变化时自动清除并重新加载最新的示例数据
  const storedVersion = localStorage.getItem(DATA_VERSION_KEY);
  if (storedVersion !== DATA_VERSION) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(FAVORITES_KEY);
    const mockData = getMockData();
    saveAllPersons(mockData);
    localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
  }

  // 如果没有数据，加载示例数据
  const persons = getAllPersons();
  if (persons.length === 0) {
    const mockData = getMockData();
    saveAllPersons(mockData);
  }

  // 解析 hash 路由
  handleHashRoute();

  // 监听 hash 变化
  window.addEventListener('hashchange', handleHashRoute);

  // 移动端菜单点击外部关闭
  document.addEventListener('click', function(e) {
    const menu = document.getElementById('mobile-menu');
    const menuBtn = document.querySelector('[onclick*="toggleMobileMenu"]');
    if (menu && !menu.contains(e.target) && !e.target.closest('[onclick*="toggleMobileMenu"]')) {
      menu.classList.add('hidden');
    }
  });
}

function handleHashRoute() {
  const hash = window.location.hash.slice(1) || 'home';
  const params = new URLSearchParams(hash);
  const page = params.get('page') || 'home';
  const personId = params.get('id');

  currentPage = page;
  if (personId) currentPersonId = personId;

  // 隐藏所有页面
  document.querySelectorAll('[id^="page-"]').forEach(el => {
    el.classList.add('hidden');
  });

  // 显示对应页面
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) {
    pageEl.classList.remove('hidden');
  } else {
    document.getElementById('page-home').classList.remove('hidden');
    currentPage = 'home';
  }

  // 关闭移动端菜单
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) mobileMenu.classList.add('hidden');

  // 清理轮播
  if (carouselInterval) {
    clearInterval(carouselInterval);
    carouselInterval = null;
  }

  // 调用页面渲染函数
  switch (page) {
    case 'home':
      renderHomePage();
      break;
    case 'reunion':
      renderReunionPage('reunion-date');
      break;
    case 'map':
      renderMapPage();
      break;
    case 'form':
      renderFormPage();
      break;
    case 'detail':
      renderDetailPage(currentPersonId);
      break;
    case 'search':
      renderSearchPage();
      break;
    case 'data':
      renderDataPage();
      break;
    case 'about':
      // 静态页面，无需渲染
      break;
  }

  // 滚动到顶部
  window.scrollTo(0, 0);
}

function navigateTo(page, id) {
  let hash = '#page=' + page;
  if (id) hash += '&id=' + id;
  window.location.hash = hash;
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('hidden');
}

// ========== 首页渲染 ==========
function renderHomePage() {
  // 统计卡片
  const stats = getStats();
  animateNumber(document.getElementById('stat-total'), stats.total);
  animateNumber(document.getElementById('stat-reunited'), stats.reunited);
  animateNumber(document.getElementById('stat-new'), stats.thisMonth);
  animateNumber(document.getElementById('stat-comments'), stats.comments);

  // 最新团聚故事
  const allPersons = getAllPersons();
  const reunited = allPersons
    .filter(p => p.status === 'reunited')
    .sort((a, b) => new Date(b.reunion.date) - new Date(a.reunion.date))
    .slice(0, 3);

  const latestReunionsEl = document.getElementById('latest-reunions');
  if (latestReunionsEl) {
    if (reunited.length === 0) {
      latestReunionsEl.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">暂无团聚故事</div>';
    } else {
      latestReunionsEl.innerHTML = reunited.map(p => `
        <div class="reunion-card cursor-pointer" onclick="navigateTo('detail', '${p.id}')">
          <div class="reunion-photo-single mb-3">
            <img src="${p.photos[0] || ''}" alt="${p.name}" class="w-full h-48 object-cover rounded-lg" />
          </div>
          <div class="reunion-badge mb-2">已团聚</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">${p.name}</h3>
          <p class="text-sm text-gray-600 mb-2">
            <i class="fa-solid fa-location-dot mr-1"></i> ${p.missingLocation}
          </p>
          <p class="text-sm text-reunion-dark font-semibold mb-3">
            <i class="fa-solid fa-clock mr-1"></i> 失踪 ${p.reunion.missingDuration} 天后回家
          </p>
          <p class="text-sm text-gray-600 line-clamp-3">${p.reunion.story.substring(0, 80)}...</p>
        </div>
      `).join('');
    }
  }

  // 最新失踪
  const missing = allPersons
    .filter(p => p.status === 'missing')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  const latestMissingEl = document.getElementById('latest-missing');
  if (latestMissingEl) {
    if (missing.length === 0) {
      latestMissingEl.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">暂无寻亲信息</div>';
    } else {
      latestMissingEl.innerHTML = missing.map(p => `
        <div class="bg-white rounded-xl shadow p-6 hover:shadow-xl transition cursor-pointer" onclick="navigateTo('detail', '${p.id}')">
          <img src="${p.photos[0] || ''}" alt="${p.name}" class="w-full h-48 object-cover rounded-lg mb-4" />
          <span class="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full mb-2">寻找中</span>
          <h3 class="text-xl font-bold text-gray-800 mb-2">${p.name}</h3>
          <p class="text-sm text-gray-600 mb-2">
            <i class="fa-solid fa-location-dot mr-1"></i> ${p.missingLocation}
          </p>
          <p class="text-sm text-gray-600 mb-2">
            <i class="fa-solid fa-calendar mr-1"></i> ${p.missingDate}
          </p>
          <p class="text-sm text-gray-600 line-clamp-2">${p.description.substring(0, 60)}...</p>
        </div>
      `).join('');
    }
  }
}

// ========== 数据管理页 ==========
function renderDataPage() {
  const stats = getStats();
  const size = getStorageSize();
  document.getElementById('storage-count').textContent = stats.total;
  document.getElementById('storage-reunited').textContent = stats.reunited;
  document.getElementById('storage-size').textContent = (size / 1024).toFixed(1) + ' KB';
}

// ========== 数字动画 ==========
function animateNumber(el, target, duration = 1500) {
  if (!el) return;
  const start = 0;
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * easeProgress);
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target;
  }
  requestAnimationFrame(update);
}
