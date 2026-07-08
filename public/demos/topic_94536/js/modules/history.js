/**
 * 历史记录库模块
 * 顶部筛选栏（日期/场景/说话人下拉+搜索框）
 * 中央卡片网格展示 AppData.historyRecords
 * 右侧滑出预览面板（点击记录显示详情）
 */
const HistoryModule = {
  _container: null,
  _records: [],
  _filteredRecords: [],
  _selectedRecord: null,

  init() {
    this._records = (window.AppData && window.AppData.historyRecords) || [];
    this._filteredRecords = [...this._records];
  },

  render(container) {
    this._container = container;
    this.init();

    const html = `
      <div class="flex h-full">
        <!-- 主内容区 -->
        <div class="flex-1 flex flex-col min-w-0">
          <!-- 顶部筛选栏 -->
          <div class="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-200">
            <div class="flex items-center gap-2">
              <i data-lucide="calendar" class="w-4 h-4 text-gray-500"></i>
              <select id="history-filter-date" class="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">全部日期</option>
                <option value="today">今天</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <i data-lucide="tag" class="w-4 h-4 text-gray-500"></i>
              <select id="history-filter-scene" class="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">全部场景</option>
                <option value="meeting">会议</option>
                <option value="interview">访谈</option>
                <option value="lecture">讲座</option>
                <option value="call">通话</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <i data-lucide="user" class="w-4 h-4 text-gray-500"></i>
              <select id="history-filter-speaker" class="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">全部说话人</option>
              </select>
            </div>
            <div class="flex-1 flex items-center gap-2">
              <i data-lucide="search" class="w-4 h-4 text-gray-400"></i>
              <input id="history-search" type="text" placeholder="搜索标题或内容..." class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button id="history-clear-filter" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 px-3 py-2">
              <i data-lucide="x-circle" class="w-4 h-4"></i>
              清除
            </button>
          </div>

          <!-- 记录统计 -->
          <div class="px-6 py-2 bg-gray-50 text-xs text-gray-500 flex items-center gap-4 border-b border-gray-100">
            <span>共 <strong id="history-count" class="text-gray-800">${this._filteredRecords.length}</strong> 条记录</span>
            <span>总时长 <strong class="text-gray-800">${this._formatTotalDuration()}</strong></span>
          </div>

          <!-- 卡片网格 -->
          <div id="history-grid" class="flex-1 overflow-y-auto p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              ${this._renderCards()}
            </div>
          </div>
        </div>

        <!-- 右侧滑出预览面板 -->
        <div id="history-preview" class="w-96 bg-white border-l border-gray-200 transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h3 class="text-base font-semibold text-gray-800 flex items-center gap-2">
              <i data-lucide="file-text" class="w-5 h-5 text-blue-500"></i>
              记录详情
            </h3>
            <button id="history-close-preview" class="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
          <div id="history-preview-content" class="flex-1 overflow-y-auto p-5">
            <div class="text-center text-gray-400 py-20">
              <i data-lucide="mouse-pointer-click" class="w-10 h-10 mx-auto mb-3 opacity-50"></i>
              <p>点击左侧卡片查看详情</p>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this._bindEvents();
    this._populateSpeakerFilter();
    if (window.lucide) lucide.createIcons();
  },

  _renderCards() {
    if (this._filteredRecords.length === 0) {
      return `
        <div class="col-span-full text-center py-20 text-gray-400">
          <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
          <p>暂无匹配记录</p>
        </div>
      `;
    }
    return this._filteredRecords.map((record, idx) => `
      <div class="history-card bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group" data-index="${idx}" data-id="${record.id}">
        <div class="p-5">
          <div class="flex items-start justify-between mb-3">
            <h4 class="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">${record.title || '未命名记录'}</h4>
            <span class="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 font-medium whitespace-nowrap ml-2">${this._sceneLabel(record.scene)}</span>
          </div>
          <p class="text-xs text-gray-500 mb-4 line-clamp-2">${record.title || '暂无摘要'}</p>
          <div class="flex items-center gap-4 text-xs text-gray-500">
            <span class="flex items-center gap-1">
              <i data-lucide="calendar-days" class="w-3.5 h-3.5"></i>
              ${record.date || '-'}
            </span>
            <span class="flex items-center gap-1">
              <i data-lucide="clock" class="w-3.5 h-3.5"></i>
              ${record.duration || '-'}
            </span>
          </div>
          <div class="flex items-center gap-4 text-xs text-gray-500 mt-2">
            <span class="flex items-center gap-1">
              <i data-lucide="users" class="w-3.5 h-3.5"></i>
              ${record.speakers || 0} 人
            </span>
            <span class="flex items-center gap-1">
              <i data-lucide="type" class="w-3.5 h-3.5"></i>
              ${record.words || 0} 字
            </span>
          </div>
        </div>
        <div class="px-5 py-3 bg-gray-50 rounded-b-xl border-t border-gray-100 flex items-center justify-between">
          <span class="text-xs text-gray-400">${this._sceneLabel(record.scene)}</span>
          <span class="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            查看详情 <i data-lucide="chevron-right" class="w-3 h-3"></i>
          </span>
        </div>
      </div>
    `).join('');
  },

  _renderPreview(record) {
    if (!record) return '';

    return `
      <div class="space-y-5">
        <div>
          <span class="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">${this._sceneLabel(record.scene)}</span>
          <h2 class="text-lg font-bold text-gray-800 mt-2">${record.title || '未命名记录'}</h2>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-xs text-gray-400 mb-1">日期</div>
            <div class="text-sm font-medium text-gray-800 flex items-center gap-1">
              <i data-lucide="calendar-days" class="w-3.5 h-3.5 text-gray-400"></i>
              ${record.date || '-'}
            </div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-xs text-gray-400 mb-1">时长</div>
            <div class="text-sm font-medium text-gray-800 flex items-center gap-1">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-gray-400"></i>
              ${record.duration || '-'}
            </div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-xs text-gray-400 mb-1">说话人数</div>
            <div class="text-sm font-medium text-gray-800 flex items-center gap-1">
              <i data-lucide="users" class="w-3.5 h-3.5 text-gray-400"></i>
              ${record.speakers || 0} 人
            </div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-xs text-gray-400 mb-1">字数</div>
            <div class="text-sm font-medium text-gray-800 flex items-center gap-1">
              <i data-lucide="type" class="w-3.5 h-3.5 text-gray-400"></i>
              ${record.words || 0} 字
            </div>
          </div>
        </div>
        <div>
          <div class="text-xs text-gray-400 mb-2">状态</div>
          <span class="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 font-medium">${record.status || 'completed'}</span>
        </div>
        <div>
          <div class="text-xs text-gray-400 mb-2">转写文本预览</div>
          <div class="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed max-h-64 overflow-y-auto">
            ${record.transcriptPreview || '暂无转写内容'}
          </div>
        </div>
        <div class="flex gap-2 pt-2">
          <button class="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors" onclick="App.showToast('开始播放录音', 'info')">
            <i data-lucide="play" class="w-4 h-4"></i>
            播放录音
          </button>
          <button class="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors" onclick="App.showToast('导出功能开发中', 'info')">
            <i data-lucide="download" class="w-4 h-4"></i>
            导出
          </button>
        </div>
      </div>
    `;
  },

  _bindEvents() {
    const container = this._container;

    container.querySelectorAll('.history-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.index);
        this._openPreview(this._filteredRecords[idx]);
      });
    });

    const filterDate = container.querySelector('#history-filter-date');
    const filterScene = container.querySelector('#history-filter-scene');
    const filterSpeaker = container.querySelector('#history-filter-speaker');
    const searchInput = container.querySelector('#history-search');
    const clearBtn = container.querySelector('#history-clear-filter');

    const doFilter = () => this._applyFilter(
      filterDate.value,
      filterScene.value,
      filterSpeaker.value,
      searchInput.value.trim()
    );

    filterDate.addEventListener('change', doFilter);
    filterScene.addEventListener('change', doFilter);
    filterSpeaker.addEventListener('change', doFilter);
    searchInput.addEventListener('input', doFilter);

    clearBtn.addEventListener('click', () => {
      filterDate.value = '';
      filterScene.value = '';
      filterSpeaker.value = '';
      searchInput.value = '';
      this._applyFilter('', '', '', '');
      App.showToast('筛选已清除', 'success');
    });

    container.querySelector('#history-close-preview').addEventListener('click', () => {
      this._closePreview();
    });
  },

  _populateSpeakerFilter() {
    const select = this._container.querySelector('#history-filter-speaker');
    const speakers = new Set();
    this._records.forEach(r => {
      const speakerList = Array.isArray(r.speakers) ? r.speakers : [];
      speakerList.forEach(s => speakers.add(s.name));
    });
    speakers.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
  },

  _applyFilter(date, scene, speaker, search) {
    this._filteredRecords = this._records.filter(r => {
      if (scene && r.scene !== scene) return false;
      if (speaker && !(Array.isArray(r.speakers) ? r.speakers : []).some(s => s.name === speaker)) return false;
      if (search && !((r.title || '').includes(search) || (r.summary || '').includes(search))) return false;
      if (date && r.date) {
        const d = new Date(r.date);
        const now = new Date();
        if (date === 'today') {
          if (d.toDateString() !== now.toDateString()) return false;
        } else if (date === 'week') {
          const weekAgo = new Date(now - 7 * 86400000);
          if (d < weekAgo) return false;
        } else if (date === 'month') {
          if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
        }
      }
      return true;
    });

    const grid = this._container.querySelector('#history-grid .grid');
    grid.innerHTML = this._renderCards();
    this._container.querySelector('#history-count').textContent = this._filteredRecords.length;
    this._bindCardEvents();
    if (window.lucide) lucide.createIcons();
  },

  _bindCardEvents() {
    this._container.querySelectorAll('.history-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.index);
        this._openPreview(this._filteredRecords[idx]);
      });
    });
  },

  _openPreview(record) {
    this._selectedRecord = record;
    const preview = this._container.querySelector('#history-preview');
    const content = this._container.querySelector('#history-preview-content');
    content.innerHTML = this._renderPreview(record);
    preview.classList.remove('translate-x-full');
    if (window.lucide) lucide.createIcons();
  },

  _closePreview() {
    this._selectedRecord = null;
    this._container.querySelector('#history-preview').classList.add('translate-x-full');
  },

  _sceneLabel(scene) {
    const map = { meeting: '会议', interview: '访谈', lecture: '讲座', call: '通话' };
    return map[scene] || scene || '其他';
  },

  _formatTotalDuration() {
    let totalMinutes = 0;
    this._records.forEach(r => {
      if (r.duration) {
        const parts = r.duration.split(':');
        if (parts.length === 2) totalMinutes += parseInt(parts[0]) * 60 + parseInt(parts[1]);
        else if (parts.length === 3) totalMinutes += parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      }
    });
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`;
  }
};

window.HistoryModule = HistoryModule;
