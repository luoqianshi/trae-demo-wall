/**
 * AI智能摘要中心模块
 * 功能：原文预览、标签页切换、思维导图(div+CSS树状)、关键词云图
 */
(function () {
  let activeTab = 'overview';
  let currentData = null;

  function getData() {
    // 默认取 meetingData，也可扩展选择器
    return (window.AppData && window.AppData.meetingData) || { speakers: [], transcript: [], summary: {} };
  }

  function renderLeftPanel() {
    return `
      <div class="w-1/2 border-r border-gray-200 flex flex-col bg-white">
        <div class="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <i data-lucide="align-left" class="w-4 h-4 text-gray-500"></i>
          <h3 class="font-semibold text-gray-800 text-sm">原文预览</h3>
        </div>
        <div id="sm-original" class="flex-1 overflow-y-auto p-4 text-sm text-gray-700 space-y-3">
          <div class="text-gray-400 text-center py-8">加载中...</div>
        </div>
      </div>
    `;
  }

  function renderTabButton(id, label, icon) {
    const active = activeTab === id ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-gray-600 hover:bg-gray-50 border-transparent';
    return `
      <button data-tab="${id}" class="sm-tab-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${active}">
        <i data-lucide="${icon}" class="w-3.5 h-3.5"></i>
        <span>${label}</span>
      </button>
    `;
  }

  function renderRightPanel() {
    return `
      <div class="w-1/2 flex flex-col bg-white">
        <div class="px-4 py-3 border-b border-gray-200 flex items-center gap-2 flex-wrap">
          ${renderTabButton('overview', '全文摘要', 'file-text')}
          ${renderTabButton('chapters', '章节速览', 'list')}
          ${renderTabButton('speakers', '发言总结', 'users')}
          ${renderTabButton('mindmap', '思维导图', 'git-branch')}
          ${renderTabButton('keywords', '关键词云', 'tags')}
        </div>
        <div id="sm-content" class="flex-1 overflow-y-auto p-4">
          <div class="text-gray-400 text-center py-8">请选择标签页</div>
        </div>
      </div>
    `;
  }

  function render(container) {
    container.innerHTML = `
      <div class="flex h-full">
        ${renderLeftPanel()}
        ${renderRightPanel()}
      </div>
    `;
  }

  function buildOriginalText() {
    const data = currentData;
    const container = document.getElementById('sm-original');
    if (!container) return;

    const spMap = {};
    (data.speakers || []).forEach(s => spMap[s.id] = s.name);

    const transcript = data.transcript || [];
    if (!transcript.length) {
      container.innerHTML = '<div class="text-gray-400 text-center py-8">暂无原文数据</div>';
      return;
    }

    let html = '';
    transcript.forEach((item, idx) => {
      const name = spMap[item.speakerId] || '未知';
      html += `
        <div class="flex gap-2 pb-2 border-b border-gray-100 last:border-0">
          <span class="text-[10px] text-gray-400 mt-1 whitespace-nowrap">${item.time || ''}</span>
          <div>
            <span class="text-xs font-semibold text-blue-600">${name}</span>
            <p class="text-gray-700 leading-relaxed mt-0.5">${item.text}</p>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  function renderOverview() {
    const sum = currentData.summary || {};
    let html = '<div class="space-y-4">';
    if (sum.overview) {
      html += `<div class="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm leading-relaxed">${sum.overview}</div>`;
    }
    if (sum.points && sum.points.length) {
      html += `<div class="space-y-2"><h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">核心要点</h4><ul class="space-y-2">`;
      sum.points.forEach(p => {
        html += `<li class="flex gap-2 text-sm text-gray-700"><i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"></i><span>${p}</span></li>`;
      });
      html += `</ul></div>`;
    }
    if (sum.actionItems && sum.actionItems.length) {
      html += `<div class="space-y-2"><h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">待办事项</h4><ul class="space-y-2">`;
      sum.actionItems.forEach(a => {
        html += `<li class="flex gap-2 text-sm text-gray-700"><i data-lucide="circle-dot" class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"></i><span>${a}</span></li>`;
      });
      html += `</ul></div>`;
    }
    html += '</div>';
    return html;
  }

  function renderChapters() {
    const chapters = currentData.summary && currentData.summary.chapters || [];
    if (!chapters.length) return '<div class="text-gray-400 text-center py-8">暂无章节数据</div>';
    let html = '<div class="space-y-3">';
    chapters.forEach((ch, i) => {
      html += `
        <div class="flex gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
          <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">${i + 1}</div>
          <div class="flex-1 min-w-0">
            <h5 class="text-sm font-medium text-gray-800">${ch.title}</h5>
            <p class="text-xs text-gray-500 mt-0.5">${ch.time || ''} · ${ch.desc || ''}</p>
          </div>
        </div>
      `;
    });
    html += '</div>';
    return html;
  }

  function renderSpeakers() {
    const speakers = currentData.speakers || [];
    const transcript = currentData.transcript || [];
    if (!speakers.length) return '<div class="text-gray-400 text-center py-8">暂无发言数据</div>';

    const stats = {};
    speakers.forEach(s => stats[s.id] = { name: s.name, count: 0, text: [] });
    transcript.forEach(t => {
      if (stats[t.speakerId]) {
        stats[t.speakerId].count++;
        stats[t.speakerId].text.push(t.text);
      }
    });

    let html = '<div class="space-y-3">';
    Object.values(stats).forEach(sp => {
      const summaryText = sp.text.slice(0, 3).join('；') + (sp.text.length > 3 ? '...' : '');
      html += `
        <div class="p-3 rounded-lg border border-gray-100 bg-gray-50/50">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-semibold text-gray-800">${sp.name}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">${sp.count} 条发言</span>
          </div>
          <p class="text-xs text-gray-600 leading-relaxed">${summaryText}</p>
        </div>
      `;
    });
    html += '</div>';
    return html;
  }

  function renderMindMap() {
    const sum = currentData.summary || {};
    const title = sum.overview ? sum.overview.slice(0, 20) + '...' : '主题';
    const points = (sum.points || []).slice(0, 5);

    let branches = '';
    points.forEach((p, i) => {
      const colors = ['border-blue-300 bg-blue-50 text-blue-700', 'border-emerald-300 bg-emerald-50 text-emerald-700', 'border-amber-300 bg-amber-50 text-amber-700', 'border-rose-300 bg-rose-50 text-rose-700', 'border-violet-300 bg-violet-50 text-violet-700'];
      const color = colors[i % colors.length];
      branches += `
        <div class="flex items-center gap-2 ml-8 relative">
          <div class="absolute -left-4 top-1/2 w-4 h-px bg-gray-300"></div>
          <div class="absolute -left-4 top-0 w-px bg-gray-300" style="height: 50%"></div>
          <div class="px-3 py-1.5 rounded-lg border ${color} text-xs font-medium max-w-[200px]">${p}</div>
        </div>
      `;
    });

    return `
      <div class="flex flex-col items-start gap-2 py-2">
        <div class="relative">
          <div class="px-4 py-2 rounded-xl border-2 border-gray-800 bg-gray-900 text-white text-sm font-semibold shadow-sm">${title}</div>
          <div class="absolute left-1/2 -bottom-4 w-px h-4 bg-gray-300 -translate-x-1/2"></div>
        </div>
        <div class="flex flex-col gap-3 pt-4 relative">
          <div class="absolute left-4 top-0 w-px h-full bg-gray-300"></div>
          ${branches}
        </div>
      </div>
    `;
  }

  function renderKeywords() {
    const keywords = currentData.summary && currentData.summary.keywords || [];
    if (!keywords.length) {
      // 备用关键词
      const fallback = ['人工智能', '会议纪要', '产品规划', '数据分析', '用户体验', '市场策略', '技术架构', '项目管理', '团队协作', '客户需求'];
      return buildKeywordCloud(fallback);
    }
    return buildKeywordCloud(keywords);
  }

  function buildKeywordCloud(list) {
    const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg'];
    const colors = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-violet-100 text-violet-700', 'bg-cyan-100 text-cyan-700', 'bg-orange-100 text-orange-700'];

    let html = '<div class="flex flex-wrap gap-2 content-start">';
    list.forEach((kw, i) => {
      const size = sizes[Math.floor(Math.random() * sizes.length)];
      const color = colors[i % colors.length];
      html += `<span class="inline-block px-3 py-1 rounded-full ${color} ${size} font-medium">${kw}</span>`;
    });
    html += '</div>';
    return html;
  }

  function renderTabContent() {
    const container = document.getElementById('sm-content');
    if (!container) return;
    const map = {
      overview: renderOverview,
      chapters: renderChapters,
      speakers: renderSpeakers,
      mindmap: renderMindMap,
      keywords: renderKeywords
    };
    container.innerHTML = (map[activeTab] || renderOverview)();
    if (window.lucide) lucide.createIcons();
  }

  function updateTabButtons() {
    document.querySelectorAll('.sm-tab-btn').forEach(btn => {
      const id = btn.dataset.tab;
      const isActive = id === activeTab;
      btn.className = `sm-tab-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-gray-600 hover:bg-gray-50 border-transparent'}`;
    });
  }

  function bindEvents() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.sm-tab-btn');
      if (!btn) return;
      activeTab = btn.dataset.tab;
      updateTabButtons();
      renderTabContent();
    });
  }

  function init() {
    currentData = getData();
    buildOriginalText();
    renderTabContent();
    bindEvents();
    if (window.lucide) lucide.createIcons();
  }

  window.SummaryModule = { render, init };
})();
