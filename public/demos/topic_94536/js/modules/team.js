/**
 * 团队协作空间模块
 */
window.TeamModule = {
  render() {
    const teams = (window.AppData && window.AppData.teams) || [];
    const container = document.createElement('div');
    container.className = 'space-y-6';

    // 头部
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between';
    header.innerHTML = `
      <div>
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="users" class="w-7 h-7 text-indigo-500"></i>
          团队协作空间
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">管理团队、成员与分享设置</p>
      </div>
      <button id="btn-create-team" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
        <i data-lucide="plus" class="w-4 h-4"></i>
        创建团队
      </button>
    `;
    container.appendChild(header);

    // 团队卡片列表
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

    teams.forEach((team, idx) => {
      const card = document.createElement('div');
      card.className = 'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow cursor-pointer group';
      card.dataset.index = idx;
      card.innerHTML = `
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <i data-lucide="users-round" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="font-semibold text-slate-900 dark:text-white">${team.name}</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">${team.role || '成员'}</p>
            </div>
          </div>
          <span class="px-2 py-1 text-xs font-medium rounded-full ${team.isOwner ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}">
            ${team.isOwner ? '所有者' : '成员'}
          </span>
        </div>
        <div class="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div class="flex items-center gap-1">
            <i data-lucide="user" class="w-4 h-4"></i>
            <span>${team.memberCount || 0} 成员</span>
          </div>
          <div class="flex items-center gap-1">
            <i data-lucide="file-text" class="w-4 h-4"></i>
            <span>${team.recordCount || 0} 记录</span>
          </div>
        </div>
      `;
      card.addEventListener('click', () => this.openTeamDetail(team, idx));
      grid.appendChild(card);
    });

    container.appendChild(grid);

    // 成员管理表格区域（默认隐藏，点击卡片后展示）
    const detailSection = document.createElement('div');
    detailSection.id = 'team-detail-section';
    detailSection.className = 'hidden bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6';
    container.appendChild(detailSection);

    return container;
  },

  init() {
    document.getElementById('btn-create-team')?.addEventListener('click', () => {
      App.showModal({
        title: '创建新团队',
        content: `
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">团队名称</label>
              <input type="text" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="输入团队名称">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">团队描述</label>
              <textarea class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" rows="3" placeholder="输入团队描述"></textarea>
            </div>
          </div>
        `,
        confirmText: '创建',
        onConfirm: () => {
          App.showToast('团队创建成功', 'success');
        }
      });
    });
  },

  openTeamDetail(team, idx) {
    const section = document.getElementById('team-detail-section');
    if (!section) return;

    section.classList.remove('hidden');
    section.innerHTML = `
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="users-round" class="w-5 h-5 text-indigo-500"></i>
          ${team.name} - 详情管理
        </h3>
        <button id="btn-close-detail" class="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <i data-lucide="x" class="w-5 h-5 text-slate-500"></i>
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 成员管理表格 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300">成员管理</h4>
            <button class="text-xs inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
              <i data-lucide="user-plus" class="w-3 h-3"></i>
              邀请成员
            </button>
          </div>
          <div class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <table class="w-full text-sm text-left">
              <thead class="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                <tr>
                  <th class="px-4 py-3 font-medium">成员</th>
                  <th class="px-4 py-3 font-medium">角色</th>
                  <th class="px-4 py-3 font-medium">状态</th>
                  <th class="px-4 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
                ${(team.members || []).map(m => `
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">${m.name?.charAt(0) || 'U'}</div>
                        <span class="text-slate-900 dark:text-white">${m.name}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-slate-600 dark:text-slate-400">${m.role}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 text-xs rounded-full ${m.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}">
                        ${m.active ? '在线' : '离线'}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button class="text-slate-400 hover:text-red-500 transition-colors">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                      </button>
                    </td>
                  </tr>
                `).join('') || '<tr><td colspan="4" class="px-4 py-6 text-center text-slate-400">暂无成员</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 分享设置面板 -->
        <div>
          <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">分享设置</h4>
          <div class="space-y-4">
            <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
              <div class="flex items-center gap-3">
                <i data-lucide="link" class="w-5 h-5 text-slate-500"></i>
                <div>
                  <p class="text-sm font-medium text-slate-900 dark:text-white">链接分享</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400">通过链接邀请成员加入</p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="share-link-toggle" class="sr-only peer" ${team.shareLinkEnabled ? 'checked' : ''}>
                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
              <div class="flex items-center gap-3">
                <i data-lucide="shield" class="w-5 h-5 text-slate-500"></i>
                <div>
                  <p class="text-sm font-medium text-slate-900 dark:text-white">权限选择</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400">设置成员默认权限</p>
                </div>
              </div>
              <select id="team-permission-select" class="text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="viewer" ${team.defaultPermission === 'viewer' ? 'selected' : ''}>仅查看</option>
                <option value="editor" ${team.defaultPermission === 'editor' ? 'selected' : ''}>可编辑</option>
                <option value="admin" ${team.defaultPermission === 'admin' ? 'selected' : ''}>管理员</option>
              </select>
            </div>

            <div class="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
              <p class="text-sm font-medium text-slate-900 dark:text-white mb-2">分享链接</p>
              <div class="flex gap-2">
                <input type="text" readonly value="https://voice.ai/team/${team.id || 'xxx'}" class="flex-1 text-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 select-all">
                <button id="btn-copy-link" class="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                  <i data-lucide="copy" class="w-4 h-4 text-slate-600 dark:text-slate-300"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // 重新初始化图标
    if (window.lucide) lucide.createIcons();

    // 事件绑定
    document.getElementById('btn-close-detail')?.addEventListener('click', () => {
      section.classList.add('hidden');
    });

    document.getElementById('share-link-toggle')?.addEventListener('change', (e) => {
      App.showToast(e.target.checked ? '链接分享已开启' : '链接分享已关闭', 'info');
    });

    document.getElementById('team-permission-select')?.addEventListener('change', (e) => {
      App.showToast(`默认权限已更新为：${e.target.options[e.target.selectedIndex].text}`, 'success');
    });

    document.getElementById('btn-copy-link')?.addEventListener('click', () => {
      navigator.clipboard.writeText(`https://voice.ai/team/${team.id || 'xxx'}`);
      App.showToast('链接已复制到剪贴板', 'success');
    });

    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};
