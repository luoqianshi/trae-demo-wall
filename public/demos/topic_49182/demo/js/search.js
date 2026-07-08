document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const resultsList = document.getElementById('resultsList');
  const noResults = document.getElementById('noResults');
  const resultCount = document.getElementById('resultCount');
  const avgMatchScore = document.getElementById('avgMatchScore');
  const aiThinking = document.getElementById('aiThinking');
  const thinkingText = document.getElementById('thinkingText');
  
  const industryFilters = document.getElementById('industryFilters');
  const mobileIndustryFilters = document.getElementById('mobileIndustryFilters');
  const minRatingFilter = document.getElementById('minRatingFilter');
  const cityFilter = document.getElementById('cityFilter');
  const sizeFilter = document.getElementById('sizeFilter');
  const resetFilters = document.getElementById('resetFilters');
  
  const sortMatch = document.getElementById('sortMatch');
  const sortRating = document.getElementById('sortRating');
  const sortDate = document.getElementById('sortDate');
  
  let currentFilters = {
    industries: [],
    minRating: '',
    city: '',
    employeeRange: '',
    sortBy: 'match'
  };

  const thinkingMessages = [
    '正在提取关键信息...',
    '正在分析行业特征...',
    '正在匹配企业能力...',
    '正在计算匹配度...',
    '正在生成推荐理由...'
  ];

  function initFilters() {
    const industries = [...new Set(Data.COMPANIES.map(c => c.industry))];
    const cities = [...new Set(Data.COMPANIES.map(c => c.city))];
    
    let industryHtml = '';
    industries.forEach(industry => {
      industryHtml += `
        <label class="flex items-center space-x-2 cursor-pointer group">
          <input type="checkbox" value="${industry}" class="w-4 h-4 rounded border-white/20 bg-zinc-800 text-cyan-500 focus:ring-cyan-500/20 focus:ring-offset-0">
          <span class="text-sm text-zinc-400 group-hover:text-zinc-50 transition-colors">${industry}</span>
        </label>
      `;
    });
    industryFilters.innerHTML = industryHtml;
    mobileIndustryFilters.innerHTML = industryHtml;
    
    let cityHtml = '<option value="">全部地区</option>';
    cities.forEach(city => {
      cityHtml += `<option value="${city}">${city}</option>`;
    });
    cityFilter.innerHTML = cityHtml;
    document.getElementById('mobileCityFilter').innerHTML = cityHtml;
  }

  function showThinkingAnimation(callback) {
    aiThinking.classList.remove('hidden');
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      thinkingText.textContent = thinkingMessages[messageIndex];
      messageIndex = (messageIndex + 1) % thinkingMessages.length;
    }, 800);
    
    setTimeout(() => {
      clearInterval(messageInterval);
      aiThinking.classList.add('hidden');
      callback();
    }, 2000);
  }

  function renderResults(results) {
    resultsList.innerHTML = '';
    
    if (results.length === 0) {
      noResults.classList.remove('hidden');
      return;
    }
    
    noResults.classList.add('hidden');
    
    results.forEach((company, index) => {
      const levelInfo = Utils.getCompanyLevel(company.trustScore.overall);
      const matchColor = Utils.getMatchColor(company.matchScore);
      const matchBgColor = Utils.getMatchBgColor(company.matchScore);
      
      const card = document.createElement('div');
      card.className = 'bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6 card-hover animate-fade-in cursor-pointer';
      card.style.animationDelay = `${index * 50}ms`;
      card.onclick = () => {
        window.location.href = `company.html?id=${company.id}`;
      };
      
      card.innerHTML = `
        <div class="flex flex-col lg:flex-row gap-6">
          <div class="flex-shrink-0">
            <div class="relative w-24 h-24 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center">
              <svg class="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <div class="absolute -top-2 -right-2 px-2 py-0.5 ${levelInfo.bg} ${levelInfo.color} rounded-full text-xs font-bold border border-white/10">${levelInfo.level}</div>
            </div>
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between mb-2">
              <div>
                <h3 class="text-lg font-semibold text-zinc-50 truncate">${company.name}</h3>
                <div class="flex items-center space-x-3 text-sm text-zinc-500 mt-1">
                  <span>${company.city}</span>
                  <span>·</span>
                  <span>${company.employeeRange}</span>
                  <span>·</span>
                  <span>${company.industry}</span>
                </div>
              </div>
              <div class="${matchBgColor} ${matchColor} px-3 py-1.5 rounded-xl border border-white/10">
                <span class="font-mono font-bold text-lg">${company.matchScore}</span>
                <span class="text-sm">%</span>
              </div>
            </div>
            
            <div class="flex flex-wrap gap-2 mb-4">
              ${company.capabilities.slice(0, 4).map(cap => `
                <span class="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-xs font-medium border border-cyan-500/20">${cap}</span>
              `).join('')}
            </div>
            
            <div class="ai-recommendation p-4 rounded-xl border-l-3 border-cyan-500">
              <div class="flex items-start space-x-2">
                <svg class="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                <p class="text-sm text-zinc-400">${company.matchReason}</p>
              </div>
            </div>
          </div>
          
          <div class="flex-shrink-0 flex items-center">
            <button class="btn-primary px-5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap">
              查看详情 →
            </button>
          </div>
        </div>
      `;
      
      resultsList.appendChild(card);
    });
  }

  function performSearch(query) {
    if (!query.trim()) return;
    
    searchInput.value = query;
    
    showThinkingAnimation(() => {
      const filters = {
        industries: currentFilters.industries,
        minRating: currentFilters.minRating ? parseInt(currentFilters.minRating) : null,
        city: currentFilters.city || null,
        employeeRange: currentFilters.employeeRange || null,
        sortBy: currentFilters.sortBy
      };
      
      const searchResult = AIEngine.searchCompanies(query, filters);
      
      resultCount.textContent = searchResult.total;
      avgMatchScore.textContent = searchResult.avgMatchScore;
      
      renderResults(searchResult.results);
    });
  }

  function updateFilters() {
    const checkboxes = document.querySelectorAll('#industryFilters input[type="checkbox"]');
    currentFilters.industries = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    
    currentFilters.minRating = minRatingFilter.value;
    currentFilters.city = cityFilter.value;
    currentFilters.employeeRange = sizeFilter.value;
    
    const query = searchInput.value.trim();
    if (query) {
      performSearch(query);
    }
  }

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch(searchInput.value);
    }
  });

  document.querySelectorAll('#industryFilters input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', updateFilters);
  });

  minRatingFilter.addEventListener('change', updateFilters);
  cityFilter.addEventListener('change', updateFilters);
  sizeFilter.addEventListener('change', updateFilters);

  resetFilters.addEventListener('click', () => {
    document.querySelectorAll('#industryFilters input[type="checkbox"]').forEach(cb => cb.checked = false);
    minRatingFilter.value = '';
    cityFilter.value = '';
    sizeFilter.value = '';
    currentFilters = {
      industries: [],
      minRating: '',
      city: '',
      employeeRange: '',
      sortBy: 'match'
    };
    updateSortButtons('match');
    const query = searchInput.value.trim();
    if (query) {
      performSearch(query);
    }
  });

  function updateSortButtons(sortBy) {
    currentFilters.sortBy = sortBy;
    sortMatch.className = sortBy === 'match' 
      ? 'px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium border border-cyan-500/30'
      : 'px-4 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 rounded-lg text-sm font-medium transition-colors';
    sortRating.className = sortBy === 'rating'
      ? 'px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium border border-cyan-500/30'
      : 'px-4 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 rounded-lg text-sm font-medium transition-colors';
    sortDate.className = sortBy === 'date'
      ? 'px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium border border-cyan-500/30'
      : 'px-4 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 rounded-lg text-sm font-medium transition-colors';
    
    const query = searchInput.value.trim();
    if (query) {
      performSearch(query);
    }
  }

  sortMatch.addEventListener('click', () => updateSortButtons('match'));
  sortRating.addEventListener('click', () => updateSortButtons('rating'));
  sortDate.addEventListener('click', () => updateSortButtons('date'));

  function openMobileFilter() {
    document.getElementById('mobileFilterPanel').classList.remove('hidden');
    document.querySelectorAll('#mobileIndustryFilters input[type="checkbox"]').forEach((cb, i) => {
      cb.checked = currentFilters.industries.includes(cb.value);
    });
    document.getElementById('mobileMinRatingFilter').value = currentFilters.minRating;
    document.getElementById('mobileCityFilter').value = currentFilters.city;
    document.getElementById('mobileSizeFilter').value = currentFilters.employeeRange;
  }

  function closeMobileFilter() {
    document.getElementById('mobileFilterPanel').classList.add('hidden');
  }

  function applyMobileFilters() {
    const checkboxes = document.querySelectorAll('#mobileIndustryFilters input[type="checkbox"]');
    currentFilters.industries = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    currentFilters.minRating = document.getElementById('mobileMinRatingFilter').value;
    currentFilters.city = document.getElementById('mobileCityFilter').value;
    currentFilters.employeeRange = document.getElementById('mobileSizeFilter').value;
    
    document.querySelectorAll('#industryFilters input[type="checkbox"]').forEach(cb => {
      cb.checked = currentFilters.industries.includes(cb.value);
    });
    minRatingFilter.value = currentFilters.minRating;
    cityFilter.value = currentFilters.city;
    sizeFilter.value = currentFilters.employeeRange;
    
    closeMobileFilter();
    
    const query = searchInput.value.trim();
    if (query) {
      performSearch(query);
    }
  }

  document.getElementById('mobileFilterBtn').addEventListener('click', openMobileFilter);
  
  window.openMobileFilter = openMobileFilter;
  window.closeMobileFilter = closeMobileFilter;
  window.applyMobileFilters = applyMobileFilters;

  initFilters();
  
  const urlParams = Utils.parseUrlParams();
  if (urlParams.q) {
    performSearch(decodeURIComponent(urlParams.q));
  }
});
