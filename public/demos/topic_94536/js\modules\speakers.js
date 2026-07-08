/**
 * 说话人与声纹管理模块
 * 说话人卡片网格（AppData.speakers）
 * 显示头像（姓名首字母+颜色）、角色、出现次数、总时长
 * 点击卡片显示发言统计（简单柱状图用div模拟）
 */
const SpeakersModule = {
  _container: null,
  _speakers: [],
  _selectedSpeaker: null,

  init() {
    this._speakers = (window.AppData && window.AppData.speakers) || this._getDefaultSpeakers();
  },

  render(container) {
    this._container = container;
    this.init();

    const html = `
      <div class="flex h-full">
        <!-- 左侧说话人卡片网格 -->
        <div class="flex-1 flex flex-col min-w-0">
          <div class="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-800 flex items-center gap-2">
              <i data-lucide="users" class="w-5 h-5 text-blue-500"></i>
              说话人管理
              <span class="text-xs text-gray-400 font-normal ml-2">共 ${this._speakers.length} 人</span>
            </h3>
            <button id="speakers-add-btn" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <i data-lucide="user-plus" class="w-4 h-4"></i>
              添加说话人
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              ${this._renderSpeakerCards()}
            </div>
          </div>
        </div>

        <!-- 右侧详情面板 -->
        <div id="speaker-detail" class="w-96 bg-white border-l border-gray-200 flex flex-col transform transition-all duration-300 ${this._selectedSpeaker ? '' : 'translate-x-full w-0 opacity-0 overflow-hidden'}">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h3 class="text-base font-semibold text-gray-800 flex items-center gap-2">
              <i data-lucide="bar-chart-3" class="w-5 h-5 text-blue-500"></i>
              发言统计
            </h3>
            <button id="speakers-close-detail" class="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
          <div id="speaker-detail-content" class="flex-1 overflow-y-auto p-5">
            ${this._selectedSpeaker ? this._renderDetail(this._selectedSpeaker) : this._renderEmptyDetail()}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this._bindEvents();
    if (window.lucide) lucide.createIcons();
  },

  _renderSpeakerCards() {
    if (this._speakers.length === 0) {
      return `
        <div class="col-span-full text-center py-20 text-gray-400">
          <i data-lucide="users" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
          <p>暂无说话人数据</p>
        </div>
      `;
    }
    return this._speakers.map((speaker, idx) => `
      <div class="speaker-card bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group p-5 ${this._selectedSpeaker && this._selectedSpeaker.id === speaker.id ? 'ring-2 ring-blue-400 border-blue-400' : ''}" data-index="${idx}" data-id="${speaker.id}">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm" style="background:${speaker.color || '#64748b'}">
            ${(speaker.name || '?').charAt(0)}
          </div>
          <div class="min-w-0">
            <h4 class="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">${speaker.name || '未知'}</h4>
            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">${speaker.role || '未知角色'}</span>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 text-xs text-gray-500">
          <div class="bg-gray-50 rounded-lg p-2.5 text-center">
            <div class="text-lg font-bold text-gray-800">${speaker.appearCount || 0}</div>
            <div class="mt-0.5">出现次数</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-2.5 text-center">
            <div class="text-lg font-bold text-gray-800">${speaker.totalDuration || '0:00'}</div>
            <div class="mt-0.5">总时长</div>
          </div>
        </div>
        <div class="mt-3 flex items-center justify-between text-xs text-gray-400">
          <span>声纹ID: ${speaker.voiceprintId || '-'}</span>
          <span class="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            详情 <i data-lucide="chevron-right" class="w-3 h-3"></i>
          </span>
        </div>
      </div>
    `).join('');
  },

  _renderDetail(speaker) {
    if (!speaker) return this._renderEmptyDetail();
    const stats = speaker.segmentsStats || [];
    const maxValue = Math.max(...stats.map(s => s.value || 0), 1);

    return `
      <div class="space-y-5">
        <div class="flex items-center gap-3">
          <div class="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white" style="background:${speaker.color || '#64748b'}">
            ${(speaker.name || '?').charAt(0)}
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-800">${speaker.name || '未知'}</h2>
            <span class="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">${speaker.role || '未知角色'}</span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div class="bg-gray-50 rounded-lg p-3 text-center">
            <div class="text-xl font-bold text-gray-800">${speaker.appearCount || 0}</div>
            <div class="text-xs text-gray-500 mt-1">发言次数</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3 text-center">
            <div class="text-xl font-bold text-gray-800">${speaker.totalDuration || '0:00'}</div>
            <div class="text-xs text-gray-500 mt-1">总时长</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3 text-center">
            <div class="text-xl font-bold text-gray-800">${speaker.avgDuration || '0:00'}</div>
            <div class="text-xs text-gray-500 mt-1">平均时长</div>
          </div>
        </div>

        <div>
          <div class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <i data-lucide="bar-chart-3" class="w-4 h-4 text-gray-400"></i>
            各段发言时长分布
          </div>
          <div class="space-y-2">
            ${stats.length === 0 ? '<p class="text-xs text-gray-400">暂无统计数据</p>' : stats.map((s, i) => `
              <div class="flex items-center gap-3">
                <span class="text-xs text-gray-500 w-10 text-right">段${i + 1}</span>
                <div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                  <div class="h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2" style="width:${(s.value / maxValue * 100).toFixed(1)}%; background:${speaker.color || '#64748b'}; opacity:0.8;">
                    <span class="text-[10px] text-white font-medium">${s.value}s</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div>
          <div class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <i data-lucide="clock" class="w-4 h-4 text-gray-400"></i>
            活跃时间段
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-end gap-1 h-20">
              ${(speaker.hourlyActivity || Array(12).fill(0)).map((v, i) => {
                const h = 8 + i;
                const height = Math.max(v * 100, 5);
                return `<div class="flex-1 flex flex-col items-center gap-1">
                  <div class="w-full bg-blue-200 rounded-t-sm transition-all hover:bg-blue-400 relative group" style="height:${height}%; min-height:4px;">
                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-gray-800 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">${v}次</div>
                  </div>
                  <span class="text-[10px] text-gray-400">${h}h</span>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>

        <div>
          <div class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <i data-lucide="message-square" class="w-4 h-4 text-gray-400"></i>
            最近发言
          </div>
          <div class="space-y-2">
            ${(speaker.recentSegments || []).map(seg => `
              <div class="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>${seg.time || ''}</span>
                  <span>${seg.duration || ''}</span>
                </div>
                <p class="line-clamp-2">${seg.text || ''}</p>
              </div>
            `).join('') || '<p class="text-xs text-gray-400">无最近发言记录</p>'}
          </div>
        </div>
      </div>
    `;
  },

  _renderEmptyDetail() {
    return `
      <div class="text-center text-gray-400 py-20">
        <i data-lucide="mouse-pointer-click" class="w-10 h-10 mx-auto mb-3 opacity-50"></i>
        <p>点击左侧卡片查看详情</p>
      </div>
    `;
  },

  _bindEvents() {
    const container = this._container;

    container.querySelectorAll('.speaker-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.index);
        this._selectSpeaker(this._speakers[idx]);
      });
    });

    container.querySelector('#speakers-close-detail').addEventListener('click', () => {
      this._selectedSpeaker = null;
      this._refreshCards();
      const detail = container.querySelector('#speaker-detail');
      detail.classList.add('translate-x-full', 'w-0', 'opacity-0', 'overflow-hidden');
      detail.classList.remove('w-96');
    });

    container.querySelector('#speakers-add-btn').addEventListener('click', () => {
      App.showToast('添加说话人功能开发中', 'info');
    });
  },

  _selectSpeaker(speaker) {
    this._selectedSpeaker = speaker;
    const detail = this._container.querySelector('#speaker-detail');
    const content = this._container.querySelector('#speaker-detail-content');
    content.innerHTML = this._renderDetail(speaker);
    detail.classList.remove('translate-x-full', 'w-0', 'opacity-0', 'overflow-hidden');
    detail.classList.add('w-96');
    this._refreshCards();
    if (window.lucide) lucide.createIcons();
  },

  _refreshCards() {
    const grid = this._container.querySelector('#speakers-grid');
    if (!grid) return;
    grid.innerHTML = this._renderSpeakerCards();
    this._bindCardEvents();
    if (window.lucide) lucide.createIcons();
  },

  _bindCardEvents() {
    this._container.querySelectorAll('.speaker-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.index);
        this._selectSpeaker(this._speakers[idx]);
      });
    });
  },

  _getDefaultSpeakers() {
    return [
      {
        id: 's1', name: '张经理', role: '主持人', color: '#3b82f6',
        appearCount: 12, totalDuration: '12:35', avgDuration: '1:03',
        voiceprintId: 'VP001',
        segmentsStats: [{ value: 120 }, { value: 85 }, { value: 200 }, { value: 60 }, { value: 150 }],
        hourlyActivity: [0, 1, 2, 3, 2, 1, 0, 2, 3, 1, 0, 1],
        recentSegments: [
          { time: '00:00:05', duration: '45s', text: '各位早上好，今天我们讨论一下Q3的产品规划。' },
          { time: '00:00:50', duration: '30s', text: '市场推广可以和产品发布同步进行。' }
        ]
      },
      {
        id: 's2', name: '李工程师', role: '技术负责人', color: '#10b981',
        appearCount: 8, totalDuration: '08:20', avgDuration: '1:02',
        voiceprintId: 'VP002',
        segmentsStats: [{ value: 100 }, { value: 180 }, { value: 90 }, { value: 120 }],
        hourlyActivity: [1, 0, 2, 1, 3, 2, 1, 0, 1, 2, 1, 0],
        recentSegments: [
          { time: '00:00:18', duration: '60s', text: '我这边技术方案已经初步成型，预计开发周期两个月。' },
          { time: '00:01:05', duration: '40s', text: '如果压缩预算，我建议先砍掉非核心功能。' }
        ]
      },
      {
        id: 's3', name: '王总监', role: '决策者', color: '#f59e0b',
        appearCount: 6, totalDuration: '05:45', avgDuration: '0:57',
        voiceprintId: 'VP003',
        segmentsStats: [{ value: 80 }, { value: 110 }, { value: 70 }],
        hourlyActivity: [0, 1, 0, 2, 1, 0, 1, 2, 0, 1, 0, 1],
        recentSegments: [
          { time: '00:00:32', duration: '50s', text: '预算方面需要再压缩15%，大家看看哪里可以优化。' },
          { time: '00:01:22', duration: '35s', text: '好，那就这么定了，下周一再对齐一次详细排期。' }
        ]
      },
      {
        id: 's4', name: '刘产品', role: '产品经理', color: '#8b5cf6',
        appearCount: 5, totalDuration: '04:30', avgDuration: '0:54',
        voiceprintId: 'VP004',
        segmentsStats: [{ value: 60 }, { value: 90 }, { value: 80 }],
        hourlyActivity: [0, 0, 1, 1, 0, 2, 1, 0, 0, 1, 0, 0],
        recentSegments: [
          { time: '00:00:42', duration: '40s', text: '从用户反馈来看，搜索功能是最急需优化的。' }
        ]
      }
    ];
  }
};

window.SpeakersModule = SpeakersModule;
