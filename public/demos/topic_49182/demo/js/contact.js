document.addEventListener('DOMContentLoaded', () => {
  const companyId = Utils.getUrlParam('id');
  
  if (!companyId) {
    document.getElementById('targetCompany').innerHTML = `
      <div class="text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 bg-zinc-700 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p class="text-zinc-400 mb-4">未选择目标企业</p>
        <button onclick="window.location.href='index.html'" class="btn-primary px-6 py-2 rounded-xl text-sm font-semibold">返回首页</button>
      </div>
    `;
    document.getElementById('aiSuggestion').innerHTML = `
      <p class="text-zinc-400 text-sm">请先选择目标企业</p>
    `;
    return;
  }

  const company = Data.getCompanyById(companyId);
  
  if (!company) {
    document.getElementById('targetCompany').innerHTML = `
      <div class="text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 bg-zinc-700 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p class="text-zinc-400 mb-4">企业不存在</p>
        <button onclick="window.location.href='index.html'" class="btn-primary px-6 py-2 rounded-xl text-sm font-semibold">返回首页</button>
      </div>
    `;
    document.getElementById('aiSuggestion').innerHTML = `
      <p class="text-zinc-400 text-sm">企业不存在</p>
    `;
    return;
  }

  initPage(company);
});

function initPage(company) {
  const levelInfo = Utils.getCompanyLevel(company.trustScore.overall);
  
  document.getElementById('targetCompany').innerHTML = `
    <div class="relative inline-block">
      <div class="w-20 h-20 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
        <svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <div class="absolute -top-1 -right-1 px-2 py-0.5 ${levelInfo.bg} ${levelInfo.color} rounded-full text-xs font-bold">${levelInfo.level}</div>
      </div>
    </div>
    <h3 class="font-semibold text-cyan-400 text-lg mb-2">${company.name}</h3>
    <p class="text-sm text-zinc-400 mb-4">${company.industry} · ${company.city}</p>
    
    <div class="flex flex-wrap justify-center gap-2 mb-4">
      ${company.capabilities.slice(0, 3).map(cap => `
        <span class="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium">${cap}</span>
      `).join('')}
    </div>
    
    <div class="flex items-center justify-center space-x-4">
      <div class="text-center">
        <div class="text-xl font-bold font-mono text-cyan-400">${company.trustScore.overall}</div>
        <div class="text-xs text-zinc-400">信用评分</div>
      </div>
      <div class="w-px h-10 bg-zinc-700"></div>
      <div class="text-center">
        <div class="text-xl font-bold font-mono text-cyan-400">${company.cooperationCount}</div>
        <div class="text-xs text-zinc-400">合作次数</div>
      </div>
    </div>
    
    <button onclick="window.location.href='company.html?id=${company.id}'" class="w-full mt-6 px-4 py-2 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-700/60 rounded-lg text-sm font-medium transition-colors">
      查看企业详情 →
    </button>
  `;

  setTimeout(() => {
    const suggestions = AIEngine.generateCooperationSuggestion(company);
    renderAISuggestions(suggestions);
  }, 1000);

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      window.location.href = `search.html?q=${encodeURIComponent(searchInput.value)}`;
    }
  });

  const form = document.getElementById('contactForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(company);
  });
}

function renderAISuggestions(suggestions) {
  const container = document.getElementById('aiSuggestion');
  const suggestionList = suggestions.split('\n');
  
  container.innerHTML = suggestionList.map((suggestion, index) => `
    <div class="flex items-start space-x-3 animate-fade-in" style="animation-delay: ${index * 100}ms">
      <div class="w-5 h-5 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg class="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </div>
      <p class="text-sm text-zinc-400">${suggestion}</p>
    </div>
  `).join('');
}

function submitForm(company) {
  const cooperationType = document.getElementById('cooperationType').value;
  const description = document.getElementById('description').value;
  const quantity = document.getElementById('quantity').value;
  const budgetRange = document.getElementById('budgetRange').value;
  const expectedPeriod = document.getElementById('expectedPeriod').value;
  
  const wechat = document.getElementById('wechat').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const line = document.getElementById('line').value;
  const whatsapp = document.getElementById('whatsapp').value;

  if (!cooperationType) {
    Utils.showToast('请选择合作类型', 'error');
    return;
  }

  if (!description.trim()) {
    Utils.showToast('请填写产品/服务描述', 'error');
    return;
  }

  if (!wechat && !email && !phone && !line && !whatsapp) {
    Utils.showToast('请至少填写一种联系方式', 'error');
    return;
  }

  const intent = {
    id: 'intent-' + Utils.generateId(),
    fromCompanyId: 'current-user',
    toCompanyId: company.id,
    cooperationType,
    description,
    quantity: quantity || '未指定',
    budgetRange: budgetRange || '未指定',
    expectedPeriod: expectedPeriod || '未指定',
    contactMethods: {
      wechat: wechat || undefined,
      email: email || undefined,
      phone: phone || undefined,
      line: line || undefined,
      whatsapp: whatsapp || undefined
    },
    aiSuggestion: AIEngine.generateCooperationSuggestion(company),
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  const intents = Utils.storage.get('cooperation_intents', []);
  intents.unshift(intent);
  Utils.storage.set('cooperation_intents', intents);

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.innerHTML = '<svg class="w-5 h-5 mx-auto animate-spin" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>';
  submitBtn.disabled = true;

  setTimeout(() => {
    submitBtn.innerHTML = '发送成功！';
    submitBtn.className = 'w-full py-4 rounded-xl text-lg font-semibold bg-emerald-500 text-white';
    
    Utils.showToast('合作意向已发送，您可以在Inbox中查看进度', 'success');
    
    setTimeout(() => {
      window.location.href = 'inbox.html';
    }, 2000);
  }, 1500);
}