/**
 * 模板中心模块
 */
window.TemplatesModule = {
  render() {
    const templates = (window.AppData && window.AppData.templates) || [];
    const container = document.createElement('div');
    container.className = 'space-y-6';

    // 头部
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between';
    header.innerHTML = `
      <div>
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="layout-template" class="w-7 h-7 text-violet-500"></i>
          模板中心
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">选择适合的模板快速开始转写任务</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="relative">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input type="text" id="template-search" placeholder="搜索模板..." class="pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none w-56">
        </div>
      </div>
    `;
    container.appendChild(header);

    // 场景标签过滤
    const tags = [...new Set(templates.flatMap(t => t.scenes || []))];
    const filterBar = document.createElement('div');
    filterBar.className = 'flex items-center gap-2 flex-wrap';
    filterBar.innerHTML = `
      <button class="template-filter-btn px-3 py-1.5 text-xs font-medium rounded-full bg-violet-600 text-white transition-colors" data-filter="all">全部</button>
      ${tags.map(tag => `
        <button class="template-filter-btn px-3 py-1.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" data-filter="${tag}">${tag}</button>
      `).join('')}
    `;
    container.appendChild(filterBar);

    // 模板卡片网格
    const grid = document.createElement('div');
    grid.id = 'templates-grid';
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';

    templates.forEach((tmpl, idx) => {
      const card = document.createElement('div');
      card.className = 'template-card bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700 transition-all cursor-pointer group';
      card.dataset.scenes = JSON.stringify(tmpl.scenes || []);
      card.dataset.index = idx;
      card.innerHTML = `
        <div class="flex items-start justify-between mb-3">
          <div class="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <i data-lucide="file-text" class="w-5 h-5"></i>
          </div>
          <button class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            <i data-lucide="external-link" class="w-4 h-4 text-slate-400"></i>
          </button>
        </div>
        <h3 class="font-semibold text-slate-900 dark:text-white mb-1">${tmpl.name}</h3>
        <div class="flex flex-wrap gap-1 mb-3">
          ${(tmpl.scenes || []).map(s => `<span class="px-2 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">${s}</span>`).join('')}
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">${tmpl.description}</p>
      `;
      card.addEventListener('click', () => this.previewTemplate(tmpl));
      grid.appendChild(card);
    });

    container.appendChild(grid);

    // 空状态
    if (templates.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
          <i data-lucide="layout-template" class="w-12 h-12 mb-3 opacity-50"></i>
          <p>暂无模板</p>
        </div>
      `;
    }

    return container;
  },

  init() {
    // 搜索过滤
    document.getElementById('template-search')?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      document.querySelectorAll('.template-card').forEach(card => {
        const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
        card.style.display = (name.includes(query) || desc.includes(query)) ? '' : 'none';
      });
    });

    // 标签过滤
    document.querySelectorAll('.template-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        document.querySelectorAll('.template-filter-btn').forEach(b => {
          b.classList.remove('bg-violet-600', 'text-white');
          b.classList.add('bg-slate-100', 'dark:bg-slate-700', 'text-slate-600', 'dark:text-slate-300');
        });
        btn.classList.remove('bg-slate-100', 'dark:bg-slate-700', 'text-slate-600', 'dark:text-slate-300');
        btn.classList.add('bg-violet-600', 'text-white');

        document.querySelectorAll('.template-card').forEach(card => {
          if (filter === 'all') {
            card.style.display = '';
          } else {
            const scenes = JSON.parse(card.dataset.scenes || '[]');
            card.style.display = scenes.includes(filter) ? '' : 'none';
          }
        });
      });
    });
  },

  previewTemplate(tmpl) {
    App.showModal({
      title: tmpl.name,
      content: `
        <div class="space-y-4">
          <div class="flex flex-wrap gap-2">
            ${(tmpl.scenes || []).map(s => `<span class="px-2 py-1 text-xs rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400">${s}</span>`).join('')}
          </div>
          <p class="text-sm text-slate-600 dark:text-slate-300">${tmpl.description}</p>
          <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">模板预览</p>
            <div class="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-3">
${tmpl.previewContent || '[会议记录]\n时间：2024-01-01 10:00\n地点：会议室A\n参会人员：\n\n一、会议议题\n\n二、讨论内容\n\n三、决议事项\n\n四、待办任务'}
            </div>
          </div>
        </div>
      `,
      confirmText: '使用模板',
      cancelText: '关闭',
      onConfirm: () => {
        App.showToast(`已应用模板：${tmpl.name}`, 'success');
      }
    });
  }
};
