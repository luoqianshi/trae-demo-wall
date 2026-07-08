let currentIntent = null;

function getIntentById(intentId) {
  // 从数据源获取 intent
  const intents = Data.COOPERATION_INTENTS || [];
  return intents.find(i => i.id === intentId);
}

function getIntents() {
  const stored = Utils.storage.get('cooperation_intents', []);
  return [...Data.COOPERATION_INTENTS, ...stored];
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

function calculateMatchPercent(intent) {
  const fromCompany = Data.getCompanyById(intent.fromCompanyId);
  if (!fromCompany) return 50;
  
  const tags = intent.description.split(/[，,。\s]+/).filter(t => t.length > 2);
  const targetCompany = Data.getCompanyById(intent.toCompanyId);
  const targetCaps = targetCompany ? targetCompany.capabilities : [];
  
  let match = 30;
  let count = 0;
  
  targetCaps.forEach(cap => {
    if (intent.description.includes(cap)) {
      match += 15;
      count++;
    }
  });
  
  match += fromCompany.trustScore.overall * 0.3;
  
  return Math.min(99, Math.round(match / (count + 1)));
}

function renderDetail(intent) {
  const fromCompany = Data.getCompanyById(intent.fromCompanyId) || { 
    name: '未知企业', 
    industry: '未知行业', 
    city: '未知', 
    capabilities: [], 
    trustScore: { overall: 0 },
    employeeRange: '未知规模'
  };
  const toCompany = Data.getCompanyById(intent.toCompanyId) || { 
    name: '未知企业', 
    industry: '未知行业',
    capabilities: []
  };
  const level = Utils.getCompanyLevel(fromCompany.trustScore.overall);
  const status = getStatusLabel(intent.status);

  const contactMethods = [];
  if (intent.contactMethods) {
    if (intent.contactMethods.wechat) contactMethods.push(`微信: ${intent.contactMethods.wechat}`);
    if (intent.contactMethods.email) contactMethods.push(`邮箱: ${intent.contactMethods.email}`);
    if (intent.contactMethods.phone) contactMethods.push(`电话: ${intent.contactMethods.phone}`);
    if (intent.contactMethods.whatsapp) contactMethods.push(`WhatsApp: ${intent.contactMethods.whatsapp}`);
    if (intent.contactMethods.line) contactMethods.push(`Line: ${intent.contactMethods.line}`);
  }

  const container = document.getElementById('intent-detail-content');
  
  container.innerHTML = `
    <!-- 发起企业信息 -->
    <div class="bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
        <h2 class="text-lg font-semibold text-zinc-50">发起企业</h2>
      </div>
      
      <div class="flex items-center gap-4 mb-4">
        <div class="w-14 h-14 ${level.bg} rounded-xl flex items-center justify-center">
          <span class="text-2xl font-bold ${level.color}">${level.level}</span>
        </div>
        <div>
          <h3 class="text-xl font-bold text-zinc-50">${fromCompany.name}</h3>
          <p class="text-zinc-400">${fromCompany.city} · ${fromCompany.industry} · ${fromCompany.employeeRange || '未知规模'}</p>
        </div>
      </div>
      
      <div class="flex flex-wrap gap-2 mb-4">
        ${fromCompany.capabilities.slice(0, 5).map(cap => `
          <span class="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium">${cap}</span>
        `).join('')}
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-zinc-800/60 rounded-xl p-3 text-center">
          <div class="text-lg font-bold text-cyan-400">${fromCompany.trustScore.overall}</div>
          <div class="text-xs text-zinc-400">信用评分</div>
        </div>
        <div class="bg-zinc-800/60 rounded-xl p-3 text-center">
          <div class="text-lg font-bold text-cyan-400">${fromCompany.trustScore.quality || '-'}</div>
          <div class="text-xs text-zinc-400">质量评分</div>
        </div>
        <div class="bg-zinc-800/60 rounded-xl p-3 text-center">
          <div class="text-lg font-bold text-cyan-400">${fromCompany.cooperationCount || '-'}</div>
          <div class="text-xs text-zinc-400">合作次数</div>
        </div>
        <div class="bg-zinc-800/60 rounded-xl p-3 text-center">
          <div class="text-lg font-bold text-cyan-400">${level.label}</div>
          <div class="text-xs text-zinc-400">企业等级</div>
        </div>
      </div>
    </div>

    <!-- 需求详情 -->
    <div class="bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <h2 class="text-lg font-semibold text-zinc-50">需求详情</h2>
        <span class="ml-auto px-3 py-1 ${status.bg} ${status.color} rounded-full text-sm font-medium">${status.text}</span>
      </div>
      
      <div class="mb-6">
        <p class="text-zinc-300 leading-relaxed">${intent.description}</p>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-zinc-800/60 rounded-xl p-4">
          <p class="text-xs text-zinc-400 mb-1">合作类型</p>
          <p class="font-medium text-zinc-300">${intent.cooperationType}</p>
        </div>
        <div class="bg-zinc-800/60 rounded-xl p-4">
          <p class="text-xs text-zinc-400 mb-1">数量/规模</p>
          <p class="font-medium text-zinc-300">${intent.quantity}</p>
        </div>
        <div class="bg-zinc-800/60 rounded-xl p-4">
          <p class="text-xs text-zinc-400 mb-1">预算范围</p>
          <p class="font-medium text-zinc-300">${intent.budgetRange}</p>
        </div>
        <div class="bg-zinc-800/60 rounded-xl p-4">
          <p class="text-xs text-zinc-400 mb-1">期望周期</p>
          <p class="font-medium text-zinc-300">${intent.expectedPeriod}</p>
        </div>
      </div>
    </div>

    <!-- 联系方式 -->
    <div class="bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
        <h2 class="text-lg font-semibold text-zinc-50">联系方式</h2>
      </div>
      
      <div class="grid md:grid-cols-2 gap-3">
        ${contactMethods.length > 0 ? contactMethods.map(method => `
          <div class="flex items-center gap-3 p-3 bg-zinc-800/60 rounded-xl">
            <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <span class="text-zinc-300">${method}</span>
          </div>
        `).join('') : '<p class="text-zinc-400">暂无联系方式</p>'}
      </div>
    </div>

    <!-- AI 分析 -->
    <div class="bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
        </div>
        <h2 class="text-lg font-semibold text-zinc-50">AI 匹配分析</h2>
      </div>
      
      <div class="space-y-4 mb-6">
        <div>
          <div class="flex justify-between text-sm mb-2">
            <span class="text-zinc-400">匹配度</span>
            <span class="font-bold text-cyan-400">${calculateMatchPercent(intent)}%</span>
          </div>
          <div class="h-3 bg-zinc-700 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full transition-all" style="width: ${calculateMatchPercent(intent)}%"></div>
          </div>
        </div>
        <div>
          <div class="flex justify-between text-sm mb-2">
            <span class="text-zinc-400">信用评分</span>
            <span class="font-bold text-cyan-400">${fromCompany.trustScore.overall}分</span>
          </div>
          <div class="h-3 bg-zinc-700 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full transition-all" style="width: ${fromCompany.trustScore.overall}%"></div>
          </div>
        </div>
      </div>
      
      <div class="bg-cyan-500/10 border-l-4 border-cyan-500 rounded-r-xl p-4">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-cyan-300 text-sm leading-relaxed">${intent.aiSuggestion || 'AI正在分析匹配建议...'}</p>
        </div>
      </div>
    </div>

    <!-- 目标企业 -->
    <div class="bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
        <h2 class="text-lg font-semibold text-zinc-50">目标企业</h2>
      </div>
      
      <div class="flex items-center gap-4 p-4 bg-zinc-800/60 rounded-xl">
        <div class="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
          <span class="text-lg font-bold text-cyan-400">${toCompany.name.charAt(0)}</span>
        </div>
        <div>
          <h3 class="font-semibold text-zinc-300">${toCompany.name}</h3>
          <p class="text-sm text-zinc-400">${toCompany.industry} · ${toCompany.city || '未知城市'}</p>
        </div>
        <button onclick="window.location.href='company.html?id=${toCompany.id}'" class="ml-auto px-4 py-2 text-cyan-400 hover:bg-cyan-500/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          查看详情
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-col md:flex-row gap-4">
      ${intent.status === 'pending' ? `
        <button onclick="updateStatus('accepted')" class="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          接受合作
        </button>
        <button onclick="updateStatus('viewed')" class="flex-1 py-3 bg-zinc-700/60 border border-white/10 text-zinc-400 rounded-xl font-medium hover:bg-zinc-700 transition-all flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          </svg>
          标记为已接洽
        </button>
      ` : intent.status === 'viewed' ? `
        <button onclick="updateStatus('accepted')" class="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          接受合作
        </button>
      ` : intent.status === 'accepted' ? `
        <button onclick="updateStatus('completed')" class="flex-1 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-all flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          标记为完成
        </button>
      ` : `
        <button onclick="updateStatus('pending')" class="flex-1 py-3 bg-zinc-700/60 border border-white/10 text-zinc-400 rounded-xl font-medium hover:bg-zinc-700 transition-all">
          重新开启
        </button>
      `}
      <button onclick="window.location.href='inbox.html'" class="flex-1 py-3 bg-zinc-800 text-zinc-400 rounded-xl font-medium hover:bg-zinc-700 transition-all flex items-center justify-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        返回收件箱
      </button>
    </div>
  `;
}

function updateStatus(newStatus) {
  if (!currentIntent) return;

  const storedIntents = Utils.storage.get('cooperation_intents', []);
  const index = storedIntents.findIndex(i => i.id === currentIntent.id);
  
  if (index >= 0) {
    storedIntents[index].status = newStatus;
    Utils.storage.set('cooperation_intents', storedIntents);
  } else {
    // 如果是新创建的 intent，添加到 storage
    currentIntent.status = newStatus;
    storedIntents.push(currentIntent);
    Utils.storage.set('cooperation_intents', storedIntents);
  }

  Utils.showToast('状态已更新');
  
  // 重新渲染详情
  const intents = getIntents();
  const updatedIntent = intents.find(i => i.id === currentIntent.id);
  if (updatedIntent) {
    currentIntent = updatedIntent;
    renderDetail(updatedIntent);
  }
}

function showError(message) {
  const container = document.getElementById('intent-detail-content');
  container.innerHTML = `
    <div class="bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center">
      <div class="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center border border-white/10">
        <svg class="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-zinc-300 mb-2">${message}</h3>
      <button onclick="window.location.href='inbox.html'" class="mt-4 px-6 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-all font-medium">
        返回收件箱
      </button>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const intentId = Utils.getUrlParam('id');
  
  if (!intentId) {
    showError('未指定合作意向');
    return;
  }

  const intents = getIntents();
  const intent = intents.find(i => i.id === intentId);
  
  if (!intent) {
    showError('合作意向不存在');
    return;
  }

  currentIntent = intent;
  renderDetail(intent);
});