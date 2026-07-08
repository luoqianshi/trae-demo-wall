/**
 * 插件与扩展模块
 */
window.PluginsModule = {
  render() {
    const plugins = (window.AppData && window.AppData.plugins) || [];
    const container = document.createElement('div');
    container.className = 'space-y-6';

    // 头部
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between';
    header.innerHTML = `
      <div>
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="puzzle" class="w-7 h-7 text-amber-500"></i>
          插件与扩展
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">扩展声纹智转的功能与能力</p>
      </div>
      <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span class="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium">
          ${plugins.filter(p => p.installed).length} 已安装
        </span>
        <span class="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium">
          ${plugins.length} 总计
        </span>
      </div>
    `;
    container.appendChild(header);

    // 插件列表卡片
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

    plugins.forEach((plugin, idx) => {
      const card = document.createElement('div');
      card.className = `plugin-card bg-white dark:bg-slate-800 rounded-xl border-2 ${plugin.installed ? 'border-emerald-200 dark:border-emerald-800/50' : 'border-slate-200 dark:border-slate-700'} p-5 hover:shadow-md transition-all`;
      card.dataset.index = idx;
      card.innerHTML = `
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl ${plugin.installed ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'} flex items-center justify-center">
              <i data-lucide="${plugin.icon || 'puzzle'}" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 class="font-semibold text-slate-900 dark:text-white">${plugin.name}</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">v${plugin.version || '1.0.0'}</p>
            </div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="plugin-toggle sr-only peer" data-index="${idx}" ${plugin.installed ? 'checked' : ''}>
            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-emerald-500"></div>
          </label>
        </div>
        <p class="text-sm text-slate-600 dark:text-slate-300 mb-4">${plugin.description}</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            ${plugin.installed ? `
              <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                <i data-lucide="check-circle" class="w-3 h-3"></i>
                已安装
              </span>
            ` : `
              <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                <i data-lucide="circle" class="w-3 h-3"></i>
                未安装
              </span>
            `}
          </div>
          <button class="plugin-detail-btn text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 font-medium" data-index="${idx}">
            详情
          </button>
        </div>
      `;
      grid.appendChild(card);
    });

    container.appendChild(grid);

    // 空状态
    if (plugins.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
          <i data-lucide="puzzle" class="w-12 h-12 mb-3 opacity-50"></i>
          <p>暂无插件</p>
        </div>
      `;
    }

    return container;
  },

  init() {
    // 安装状态切换
    document.querySelectorAll('.plugin-toggle').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const plugins = (window.AppData && window.AppData.plugins) || [];
        const plugin = plugins[idx];
        if (!plugin) return;

        plugin.installed = e.target.checked;
        App.showToast(`${plugin.name} ${plugin.installed ? '安装成功' : '已卸载'}`, plugin.installed ? 'success' : 'info');

        // 重新渲染该卡片的状态
        const card = e.target.closest('.plugin-card');
        if (card) {
          const iconWrap = card.querySelector('.w-12.h-12');
          const statusBadge = card.querySelector('.inline-flex');

          if (plugin.installed) {
            card.classList.remove('border-slate-200', 'dark:border-slate-700');
            card.classList.add('border-emerald-200', 'dark:border-emerald-800/50');
            iconWrap?.classList.remove('bg-slate-100', 'dark:bg-slate-700', 'text-slate-500', 'dark:text-slate-400');
            iconWrap?.classList.add('bg-emerald-100', 'dark:bg-emerald-900/30', 'text-emerald-600', 'dark:text-emerald-400');
            if (statusBadge) {
              statusBadge.className = 'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
              statusBadge.innerHTML = `<i data-lucide="check-circle" class="w-3 h-3"></i> 已安装`;
            }
          } else {
            card.classList.remove('border-emerald-200', 'dark:border-emerald-800/50');
            card.classList.add('border-slate-200', 'dark:border-slate-700');
            iconWrap?.classList.remove('bg-emerald-100', 'dark:bg-emerald-900/30', 'text-emerald-600', 'dark:text-emerald-400');
            iconWrap?.classList.add('bg-slate-100', 'dark:bg-slate-700', 'text-slate-500', 'dark:text-slate-400');
            if (statusBadge) {
              statusBadge.className = 'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
              statusBadge.innerHTML = `<i data-lucide="circle" class="w-3 h-3"></i> 未安装`;
            }
          }
          if (window.lucide) lucide.createIcons();
        }
      });
    });

    // 详情按钮
    document.querySelectorAll('.plugin-detail-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        const plugin = (window.AppData && (window.AppData.plugins || []))[idx];
        if (!plugin) return;

        App.showModal({
          title: plugin.name,
          content: `
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="w-14 h-14 rounded-xl ${plugin.installed ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'} flex items-center justify-center">
                  <i data-lucide="${plugin.icon || 'puzzle'}" class="w-7 h-7"></i>
                </div>
                <div>
                  <p class="font-semibold text-slate-900 dark:text-white">${plugin.name}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400">版本 ${plugin.version || '1.0.0'}</p>
                </div>
              </div>
              <p class="text-sm text-slate-600 dark:text-slate-300">${plugin.description}</p>
              ${plugin.author ? `<p class="text-xs text-slate-500 dark:text-slate-400">开发者：${plugin.author}</p>` : ''}
            </div>
          `,
          confirmText: plugin.installed ? '卸载' : '安装',
          onConfirm: () => {
            plugin.installed = !plugin.installed;
            App.showToast(`${plugin.name} ${plugin.installed ? '安装成功' : '已卸载'}`, 'success');
          }
        });
      });
    });
  }
};
