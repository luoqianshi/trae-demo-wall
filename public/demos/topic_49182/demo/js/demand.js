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
            <svg class="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <a href="inbox.html" class="block px-4 py-2 text-zinc-400 hover:bg-zinc-800 rounded-lg font-medium">收件箱</a>
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

function analyzeDemand() {
  const title = document.getElementById('demand-title').value.trim();
  const description = document.getElementById('demand-description').value.trim();
  const industry = document.getElementById('demand-industry').value;
  const capabilities = document.getElementById('demand-capabilities').value.trim();

  if (!title && !description) {
      document.getElementById('ai-analysis').innerHTML = `
        <div class="bg-zinc-800/60 rounded-xl p-4">
          <p class="text-sm text-zinc-400">请输入需求标题或描述，AI将为您分析</p>
        </div>
      `;
      document.getElementById('ai-tags').innerHTML = '<span class="text-sm text-zinc-500">输入描述后自动提取</span>';
    document.getElementById('match-count').textContent = '0';
    document.getElementById('match-bar').style.width = '0%';
    return;
  }

  const query = `${title} ${description}`;
  const tags = AIEngine.extractTags(query);
  const detectedIndustry = AIEngine.extractIndustry(query) || industry;

  renderTags(tags);
  renderAnalysis(title, description, tags, detectedIndustry);
  calculateMatchCount(tags, detectedIndustry);
}

function renderTags(tags) {
  const container = document.getElementById('ai-tags');
  
  if (tags.length === 0) {
    container.innerHTML = '<span class="text-sm text-zinc-500">输入描述后自动提取</span>';
    return;
  }

  container.innerHTML = tags.map(tag => `
    <span class="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium flex items-center gap-1">
      ${tag}
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    </span>
  `).join('');
}

function renderAnalysis(title, description, tags, industry) {
  const container = document.getElementById('ai-analysis');
  
  let analysisHtml = '';
  
  if (industry) {
    analysisHtml += `
      <div class="bg-zinc-800/60 rounded-xl p-4">
        <div class="flex items-center gap-2 mb-2">
          <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          <span class="text-sm font-medium text-zinc-300">行业分类</span>
        </div>
        <p class="text-zinc-400">${industry}</p>
      </div>
    `;
  }

  if (tags.length > 0) {
    analysisHtml += `
      <div class="bg-zinc-800/60 rounded-xl p-4">
        <div class="flex items-center gap-2 mb-2">
          <svg class="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
          </svg>
          <span class="text-sm font-medium text-zinc-300">关键能力需求</span>
        </div>
        <p class="text-zinc-400">${tags.join('、')}</p>
      </div>
    `;
  }

  analysisHtml += `
    <div class="bg-cyan-500/10 rounded-xl p-4 border-l-4 border-cyan-500">
      <div class="flex items-start gap-2">
        <svg class="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="text-sm text-cyan-300">${generateAnalysisText(tags, industry)}</p>
      </div>
    </div>
  `;

  container.innerHTML = analysisHtml;
}

function generateAnalysisText(tags, industry) {
  if (!industry && tags.length === 0) {
    return '请提供更多信息，AI将为您分析需求并匹配最合适的企业。';
  }
  
  const tagSuggestions = tags.length > 0 
    ? `您的需求涉及${tags.join('、')}等能力，` 
    : '';
  
  const industrySuggestion = industry 
    ? `目标行业为${industry}。` 
    : '';

  return `${tagSuggestions}${industrySuggestion} AI将根据这些信息为您精准匹配具备相应能力的优质企业，帮助您快速找到合适的合作伙伴。`;
}

function calculateMatchCount(tags, industry) {
  const companies = Data.getAllCompanies();
  let matchCount = 0;
  let totalMatchScore = 0;

  companies.forEach(company => {
    if (industry && company.industry !== industry) return;

    let score = 0;
    tags.forEach(tag => {
      if (company.capabilities.some(cap => cap.includes(tag) || tag.includes(cap))) {
        score += 20;
      }
    });

    if (score > 0) {
      matchCount++;
      totalMatchScore += score;
    }
  });

  const avgMatchScore = matchCount > 0 ? Math.round(totalMatchScore / matchCount) : 0;
  const displayScore = Math.min(99, Math.round(avgMatchScore * 1.5));

  animateNumber(document.getElementById('match-count'), matchCount, 500);
  animateNumber(document.getElementById('match-bar'), displayScore, 500, true);
}

function animateNumber(element, targetValue, duration = 1000, isWidth = false) {
  const startValue = isWidth ? parseInt(element.style.width) || 0 : parseInt(element.textContent) || 0;
  const startTime = performance.now();

  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentValue = startValue + (targetValue - startValue) * easeOut;

    if (isWidth) {
      element.style.width = `${Math.round(currentValue)}%`;
    } else {
      element.textContent = Math.round(currentValue);
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      if (isWidth) {
        element.style.width = `${targetValue}%`;
      } else {
        element.textContent = targetValue;
      }
    }
  };

  requestAnimationFrame(animate);
}

function validateForm() {
  const title = document.getElementById('demand-title').value.trim();
  const description = document.getElementById('demand-description').value.trim();
  const industry = document.getElementById('demand-industry').value;
  const contactName = document.getElementById('demand-contact-name').value.trim();
  const contactPhone = document.getElementById('demand-contact-phone').value.trim();

  if (!title) {
    Utils.showToast('请输入需求标题', 'error');
    return false;
  }

  if (!description) {
    Utils.showToast('请输入需求描述', 'error');
    return false;
  }

  if (!industry) {
    Utils.showToast('请选择行业领域', 'error');
    return false;
  }

  if (!contactName) {
    Utils.showToast('请输入联系人姓名', 'error');
    return false;
  }

  if (!contactPhone) {
    Utils.showToast('请输入联系电话', 'error');
    return false;
  }

  return true;
}

function submitDemand(e) {
  e.preventDefault();

  if (!validateForm()) return;

  const btn = document.getElementById('submit-btn');
  const originalText = btn.innerHTML;
  btn.innerHTML = `
    <span class="flex items-center gap-2">
      <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      发布中...
    </span>
  `;
  btn.disabled = true;

  setTimeout(() => {
    const demand = {
      id: 'demand-' + Utils.generateId(),
      title: document.getElementById('demand-title').value.trim(),
      description: document.getElementById('demand-description').value.trim(),
      industry: document.getElementById('demand-industry').value,
      capabilities: document.getElementById('demand-capabilities').value.trim().split(/[,，]/).map(c => c.trim()).filter(c => c),
      budget: document.getElementById('demand-budget').value,
      period: document.getElementById('demand-period').value,
      region: document.getElementById('demand-region').value,
      contact: {
        name: document.getElementById('demand-contact-name').value.trim(),
        phone: document.getElementById('demand-contact-phone').value.trim(),
        wechat: document.getElementById('demand-contact-wechat').value.trim(),
        email: document.getElementById('demand-contact-email').value.trim()
      },
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const demands = Utils.storage.get('demands', []);
    demands.unshift(demand);
    Utils.storage.set('demands', demands);

    Utils.showToast('需求发布成功！AI将为您匹配合适的企业');

    setTimeout(() => {
      window.location.href = 'inbox.html';
    }, 1500);
  }, 1500);
}

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();

  const inputs = [
    'demand-title',
    'demand-description',
    'demand-industry',
    'demand-capabilities',
    'demand-budget',
    'demand-period',
    'demand-region'
  ];

  inputs.forEach(id => {
    document.getElementById(id).addEventListener('input', Utils.debounce(analyzeDemand, 300));
  });

  document.getElementById('demand-form').addEventListener('submit', submitDemand);

  analyzeDemand();
});