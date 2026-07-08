/**
 * 重点标记与笔记模块
 * 展示会议转写文本，每段可点击添加标记类型（重点/疑问/决策/待确认）
 * 标记后文本高亮显示，右侧笔记列表显示所有标记
 */
const NotesModule = {
  _container: null,
  _segments: [],
  _marks: [],
  _markTypes: [
    { key: 'keypoint', label: '重点', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: 'star' },
    { key: 'question', label: '疑问', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: 'help-circle' },
    { key: 'decision', label: '决策', color: 'bg-green-100 text-green-800 border-green-300', icon: 'check-circle' },
    { key: 'pending', label: '待确认', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: 'alert-circle' }
  ],

  init() {
    this._segments = (window.AppData && window.AppData.transcriptSegments) || this._getDefaultSegments();
    this._marks = (window.AppData && window.AppData.marks) || [];
  },

  render(container) {
    this._container = container;
    this.init();

    const html = `
      <div class="flex h-full">
        <!-- 左侧转写文本区 -->
        <div class="flex-1 flex flex-col min-w-0 bg-white">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-800 flex items-center gap-2">
              <i data-lucide="file-text" class="w-5 h-5 text-blue-500"></i>
              会议转写文本
            </h3>
            <div class="flex items-center gap-2 text-xs text-gray-500">
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-yellow-400"></span>重点</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-purple-400"></span>疑问</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-green-400"></span>决策</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-orange-400"></span>待确认</span>
            </div>
          </div>
          <div id="notes-segments" class="flex-1 overflow-y-auto p-6 space-y-3">
            ${this._renderSegments()}
          </div>
        </div>

        <!-- 右侧笔记列表 -->
        <div class="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
          <div class="px-5 py-4 border-b border-gray-200 bg-white">
            <h3 class="text-base font-semibold text-gray-800 flex items-center gap-2">
              <i data-lucide="bookmark" class="w-5 h-5 text-blue-500"></i>
              标记笔记
              <span id="notes-mark-count" class="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">${this._marks.length}</span>
            </h3>
          </div>
          <div id="notes-mark-list" class="flex-1 overflow-y-auto p-4 space-y-3">
            ${this._renderMarkList()}
          </div>
          <div class="p-4 border-t border-gray-200 bg-white">
            <button id="notes-export" class="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <i data-lucide="download" class="w-4 h-4"></i>
              导出笔记
            </button>
          </div>
        </div>
      </div>

      <!-- 标记类型选择浮层 -->
      <div id="notes-mark-popup" class="hidden fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-2 min-w-[140px]">
        <div class="text-xs text-gray-400 px-2 py-1 mb-1">选择标记类型</div>
        ${this._markTypes.map(t => `
          <button class="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors notes-mark-option" data-type="${t.key}">
            <span class="w-2 h-2 rounded-full ${t.color.split(' ')[0].replace('bg-', 'bg-').replace('100', '400')}"></span>
            <i data-lucide="${t.icon}" class="w-4 h-4 text-gray-500"></i>
            ${t.label}
          </button>
        `).join('')}
        <div class="border-t border-gray-100 my-1"></div>
        <button class="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-red-50 text-red-500 flex items-center gap-2 transition-colors notes-mark-remove">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
          移除标记
        </button>
      </div>
    `;

    container.innerHTML = html;
    this._bindEvents();
    if (window.lucide) lucide.createIcons();
  },

  _renderSegments() {
    if (this._segments.length === 0) {
      return `
        <div class="text-center py-20 text-gray-400">
          <i data-lucide="file-x" class="w-10 h-10 mx-auto mb-3 opacity-50"></i>
          <p>暂无转写文本</p>
        </div>
      `;
    }
    return this._segments.map((seg, idx) => {
      const mark = this._marks.find(m => m.segmentIndex === idx);
      const markType = mark ? this._markTypes.find(t => t.key === mark.type) : null;
      const highlightClass = markType ? `${markType.color} border-l-4` : 'border-l-4 border-transparent hover:border-gray-200';
      return `
        <div class="notes-segment rounded-lg p-4 transition-all cursor-pointer ${highlightClass} bg-white border border-gray-100 hover:shadow-sm" data-index="${idx}">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style="background:${seg.speakerColor || '#64748b'}">
              ${(seg.speakerName || '?').charAt(0)}
            </div>
            <span class="text-sm font-medium text-gray-700">${seg.speakerName || '未知说话人'}</span>
            <span class="text-xs text-gray-400 ml-auto">${seg.time || ''}</span>
            ${markType ? `<span class="text-xs px-2 py-0.5 rounded-full ${markType.color} flex items-center gap-1"><i data-lucide="${markType.icon}" class="w-3 h-3"></i>${markType.label}</span>` : ''}
          </div>
          <p class="text-sm text-gray-800 leading-relaxed">${seg.text || ''}</p>
        </div>
      `;
    }).join('');
  },

  _renderMarkList() {
    if (this._marks.length === 0) {
      return `
        <div class="text-center py-10 text-gray-400">
          <i data-lucide="bookmark-x" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
          <p class="text-sm">暂无标记</p>
          <p class="text-xs mt-1">点击左侧文本段落添加标记</p>
        </div>
      `;
    }
    const sortedMarks = [...this._marks].sort((a, b) => (a.segmentIndex || 0) - (b.segmentIndex || 0));
    return sortedMarks.map(mark => {
      const seg = this._segments[mark.segmentIndex];
      const type = this._markTypes.find(t => t.key === mark.type);
      if (!seg || !type) return '';
      return `
        <div class="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow cursor-pointer notes-mark-item" data-index="${mark.segmentIndex}">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs px-2 py-0.5 rounded-full ${type.color} flex items-center gap-1">
              <i data-lucide="${type.icon}" class="w-3 h-3"></i>
              ${type.label}
            </span>
            <span class="text-xs text-gray-400">${seg.time || ''}</span>
          </div>
          <p class="text-sm text-gray-700 line-clamp-2">${seg.text || ''}</p>
          <div class="flex items-center gap-1 mt-2 text-xs text-gray-400">
            <div class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style="background:${seg.speakerColor || '#64748b'}">${(seg.speakerName || '?').charAt(0)}</div>
            ${seg.speakerName || '未知'}
          </div>
        </div>
      `;
    }).join('');
  },

  _bindEvents() {
    const container = this._container;
    const popup = container.querySelector('#notes-mark-popup');
    let activeIndex = null;

    container.querySelectorAll('.notes-segment').forEach(seg => {
      seg.addEventListener('click', (e) => {
        activeIndex = parseInt(seg.dataset.index);
        const rect = seg.getBoundingClientRect();
        popup.style.left = (rect.right - 160) + 'px';
        popup.style.top = (rect.top + window.scrollY) + 'px';
        popup.classList.remove('hidden');
      });
    });

    container.querySelectorAll('.notes-mark-option').forEach(btn => {
      btn.addEventListener('click', () => {
        if (activeIndex !== null) {
          this._addMark(activeIndex, btn.dataset.type);
          popup.classList.add('hidden');
        }
      });
    });

    container.querySelector('.notes-mark-remove').addEventListener('click', () => {
      if (activeIndex !== null) {
        this._removeMark(activeIndex);
        popup.classList.add('hidden');
      }
    });

    document.addEventListener('click', (e) => {
      if (!popup.contains(e.target) && !e.target.closest('.notes-segment')) {
        popup.classList.add('hidden');
      }
    });

    container.querySelectorAll('.notes-mark-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.index);
        const segEl = container.querySelector(`.notes-segment[data-index="${idx}"]`);
        if (segEl) {
          segEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          segEl.classList.add('ring-2', 'ring-blue-400');
          setTimeout(() => segEl.classList.remove('ring-2', 'ring-blue-400'), 1500);
        }
      });
    });

    container.querySelector('#notes-export').addEventListener('click', () => {
      if (this._marks.length === 0) {
        App.showToast('没有可导出的笔记', 'warning');
        return;
      }
      App.showToast(`已导出 ${this._marks.length} 条笔记`, 'success');
    });
  },

  _addMark(segmentIndex, type) {
    const existing = this._marks.findIndex(m => m.segmentIndex === segmentIndex);
    if (existing >= 0) this._marks.splice(existing, 1);
    this._marks.push({ segmentIndex, type, createdAt: new Date().toISOString() });
    this._refresh();
    const typeLabel = this._markTypes.find(t => t.key === type)?.label || type;
    App.showToast(`已标记为「${typeLabel}」`, 'success');
  },

  _removeMark(segmentIndex) {
    const idx = this._marks.findIndex(m => m.segmentIndex === segmentIndex);
    if (idx >= 0) {
      this._marks.splice(idx, 1);
      this._refresh();
      App.showToast('标记已移除', 'info');
    }
  },

  _refresh() {
    const container = this._container;
    container.querySelector('#notes-segments').innerHTML = this._renderSegments();
    container.querySelector('#notes-mark-list').innerHTML = this._renderMarkList();
    container.querySelector('#notes-mark-count').textContent = this._marks.length;
    this._bindEvents();
    if (window.lucide) lucide.createIcons();
  },

  _getDefaultSegments() {
    return [
      { speakerName: '张经理', speakerColor: '#3b82f6', time: '00:00:05', text: '各位早上好，今天我们讨论一下Q3的产品规划。' },
      { speakerName: '李工程师', speakerColor: '#10b981', time: '00:00:18', text: '我这边技术方案已经初步成型，预计开发周期两个月。' },
      { speakerName: '王总监', speakerColor: '#f59e0b', time: '00:00:32', text: '预算方面需要再压缩15%，大家看看哪里可以优化。' },
      { speakerName: '张经理', speakerColor: '#3b82f6', time: '00:00:50', text: '市场推广可以和产品发布同步进行，这样能最大化曝光。' },
      { speakerName: '李工程师', speakerColor: '#10b981', time: '00:01:05', text: '如果压缩预算，我建议先砍掉非核心功能，保证主流程稳定。' },
      { speakerName: '王总监', speakerColor: '#f59e0b', time: '00:01:22', text: '好，那就这么定了，下周一再对齐一次详细排期。' }
    ];
  }
};

window.NotesModule = NotesModule;
