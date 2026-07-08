document.addEventListener('DOMContentLoaded', () => {
  const companyId = Utils.getUrlParam('id');
  
  if (!companyId) {
    document.getElementById('companyDetail').innerHTML = `
      <div class="text-center py-16">
        <div class="w-20 h-20 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center border border-white/10">
          <svg class="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p class="text-zinc-500 mb-4">未找到企业信息</p>
        <button onclick="window.location.href='index.html'" class="btn-primary px-6 py-2 rounded-xl text-sm font-semibold">返回首页</button>
      </div>
    `;
    return;
  }

  const company = Data.getCompanyById(companyId);
  
  if (!company) {
    document.getElementById('companyDetail').innerHTML = `
      <div class="text-center py-16">
        <div class="w-20 h-20 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center border border-white/10">
          <svg class="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p class="text-zinc-500 mb-4">企业不存在</p>
        <button onclick="window.location.href='index.html'" class="btn-primary px-6 py-2 rounded-xl text-sm font-semibold">返回首页</button>
      </div>
    `;
    return;
  }

  initPage(company);
});

function initPage(company) {
  const levelInfo = Utils.getCompanyLevel(company.trustScore.overall);
  
  document.getElementById('companyName').textContent = company.name;
  document.getElementById('companyIndustry').textContent = company.industry;
  document.getElementById('companyCity').textContent = company.city;
  document.getElementById('companySize').textContent = company.employeeRange;
  document.getElementById('companyCooperation').textContent = `${company.cooperationCount}次合作`;
  document.getElementById('companyDescription').textContent = company.description;
  
  const levelBadge = document.getElementById('levelBadge');
  levelBadge.textContent = levelInfo.level;
  levelBadge.className = `absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-sm font-bold shadow-lg ${levelInfo.bg} ${levelInfo.color}`;
  
  const trustScore = document.getElementById('trustScore');
  trustScore.textContent = company.trustScore.overall;
  Utils.animateNumber(trustScore, company.trustScore.overall, 1500);

  const reviews = Data.getReviewsByCompanyId(company.id);
  document.getElementById('reviewCount').textContent = `${reviews.length}条评价`;

  document.getElementById('contactBtn').onclick = () => {
    window.location.href = `contact.html?id=${company.id}`;
  };

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      window.location.href = `search.html?q=${encodeURIComponent(searchInput.value)}`;
    }
  });

  renderTrustScoreChart(company.trustScore.overall);
  renderRadarChart(company.trustScore);
  renderTrustScoreDetails(company.trustScore);
  renderCapabilities(company.capabilities);
  renderCertifications(company.certifications);
  renderReviews(reviews);
  renderSimilarCompanies(company.id);
  generateAIProfile(company);
}

function renderTrustScoreChart(score) {
  Charts.ringProgress('trustScoreChart', score, {
    color: '#06b6d4',
    bgColor: 'rgba(255, 255, 255, 0.1)',
    strokeWidth: 12
  });
}

function renderRadarChart(trustScore) {
  Charts.radar('radarChart', {
    quality: trustScore.quality,
    delivery: trustScore.delivery,
    communication: trustScore.communication,
    cooperation: trustScore.cooperation,
    certification: trustScore.certification
  });
}

function renderTrustScoreDetails(trustScore) {
  const details = [
    { name: '质量评分', value: trustScore.quality, color: '#06b6d4' },
    { name: '时效评分', value: trustScore.delivery, color: '#10b981' },
    { name: '沟通评分', value: trustScore.communication, color: '#8b5cf6' },
    { name: '合作评分', value: trustScore.cooperation, color: '#f59e0b' },
    { name: '资质认证', value: trustScore.certification, color: '#ec4899' }
  ];

  const container = document.getElementById('trustScoreDetails');
  container.innerHTML = details.map(item => `
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-3 h-3 rounded-full" style="background-color: ${item.color}"></div>
        <span class="text-sm font-medium text-zinc-400">${item.name}</span>
      </div>
      <div class="flex items-center space-x-4 flex-1 ml-4">
        <div class="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-1000" 
            style="width: ${item.value}%; background-color: ${item.color}"></div>
        </div>
        <span class="font-mono font-semibold text-zinc-50 w-10 text-right">${item.value}</span>
      </div>
    </div>
  `).join('');
}

function renderCapabilities(capabilities) {
  const container = document.getElementById('capabilitiesTags');
  container.innerHTML = capabilities.map(cap => `
    <span class="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-full text-xs font-medium border border-cyan-500/20">
      ${cap}
    </span>
  `).join('');
}

function renderCertifications(certifications) {
  const container = document.getElementById('certificationsGrid');
  container.innerHTML = certifications.map(cert => `
    <div class="flex items-center space-x-2 p-3 bg-zinc-800/50 rounded-xl border border-white/10">
      <div class="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <span class="text-sm font-medium text-zinc-400">${cert}</span>
    </div>
  `).join('');
}

function renderReviews(reviews) {
  const container = document.getElementById('reviewsList');
  
  if (reviews.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8">
        <p class="text-zinc-500">暂无评价</p>
      </div>
    `;
    return;
  }

  container.innerHTML = reviews.map(review => `
    <div class="p-4 bg-zinc-800/50 rounded-xl border border-white/10">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <div>
            <p class="font-medium text-zinc-50 text-sm">${review.reviewer}</p>
            <p class="text-xs text-zinc-500">${review.company}</p>
          </div>
        </div>
        <div class="flex items-center space-x-1">
          ${Utils.renderStars(review.rating)}
        </div>
      </div>
      <p class="text-zinc-400 text-sm leading-relaxed mb-3">${review.content}</p>
      <div class="flex items-center justify-between">
        <span class="text-xs text-zinc-600">${Utils.getTimeAgo(review.createdAt)}</span>
        ${review.verified ? `
          <span class="flex items-center space-x-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs border border-emerald-500/20">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>AI验证真实</span>
          </span>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function renderSimilarCompanies(companyId) {
  const similarCompanies = AIEngine.getSimilarCompanies(companyId);
  const container = document.getElementById('similarCompanies');
  
  if (similarCompanies.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <p class="text-zinc-500 text-sm">暂无相似企业</p>
      </div>
    `;
    return;
  }

  container.innerHTML = similarCompanies.map(cmp => {
    const levelInfo = Utils.getCompanyLevel(cmp.trustScore.overall);
    const matchColor = Utils.getMatchColor(cmp.matchScore);
    return `
      <div class="flex items-center space-x-3 p-3 bg-zinc-800/50 rounded-xl cursor-pointer hover:bg-zinc-800 hover:border-cyan-500/30 transition-all border border-white/10 card-hover" onclick="window.location.href='company.html?id=${cmp.id}'">
        <div class="relative">
          <div class="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <div class="absolute -top-1 -right-1 px-1.5 py-0.5 ${levelInfo.bg} ${levelInfo.color} rounded-full text-xs font-bold">${levelInfo.level}</div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-zinc-50 text-sm truncate">${cmp.name}</p>
          <p class="text-xs text-zinc-500">${cmp.industry} · ${cmp.city}</p>
        </div>
        <div class="${Utils.getMatchBgColor(cmp.matchScore)} ${matchColor} px-2 py-1 rounded-lg">
          <span class="font-mono font-bold text-sm">${cmp.matchScore}%</span>
        </div>
      </div>
    `;
  }).join('');
}

function generateAIProfile(company) {
  const aiProfile = document.getElementById('aiProfile');
  const profileText = `根据AI分析，${company.name}是一家专注于${company.industry}领域的企业，位于${company.city}，拥有${company.employeeRange}的规模。该企业具备${company.capabilities.slice(0, 2).join('、')}等核心能力，已通过${company.certifications.slice(0, 2).join('、')}等认证。综合信用评分${company.trustScore.overall}分，在${company.cooperationCount}次合作中表现出色，是值得信赖的合作伙伴。`;
  
  Utils.typeWriter(aiProfile, profileText, 30);
}

function filterReviews(filterType) {
  const companyId = Utils.getUrlParam('id');
  if (!companyId) return;

  let reviews = Data.getReviewsByCompanyId(companyId);
  
  if (filterType === 'high') {
    reviews = reviews.filter(r => r.rating >= 4);
  } else if (filterType === 'low') {
    reviews = reviews.filter(r => r.rating <= 3);
  }

  const tabs = ['reviewTabAll', 'reviewTabHigh', 'reviewTabLow'];
  tabs.forEach(tab => {
    const btn = document.getElementById(tab);
    if (tab === `reviewTab${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`) {
      btn.className = 'px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium border border-cyan-500/30';
    } else {
      btn.className = 'px-4 py-2 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300 rounded-lg text-sm font-medium transition-colors border border-transparent';
    }
  });

  renderReviews(reviews);
}

document.getElementById('reviewTabAll').addEventListener('click', () => filterReviews('all'));
document.getElementById('reviewTabHigh').addEventListener('click', () => filterReviews('high'));
document.getElementById('reviewTabLow').addEventListener('click', () => filterReviews('low'));