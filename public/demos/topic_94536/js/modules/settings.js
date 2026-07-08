/**
 * 系统设置中心模块
 */
window.SettingsModule = {
  render() {
    const container = document.createElement('div');
    container.className = 'space-y-6 max-w-4xl';

    // 头部
    const header = document.createElement('div');
    header.innerHTML = `
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <i data-lucide="settings" class="w-7 h-7 text-slate-500"></i>
        系统设置中心
      </h2>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">自定义声纹智转的工作方式</p>
    `;
    container.appendChild(header);

    // 设置分类
    const categories = [
      {
        id: 'audio',
        title: '音频设置',
        icon: 'mic',
        color: 'rose',
        items: [
          { type: 'select', label: '默认音频输入', key: 'audioInput', options: ['系统默认', '麦克风', '立体声混音'], value: '系统默认' },
          { type: 'select', label: '采样率', key: 'sampleRate', options: ['16000 Hz', '22050 Hz', '44100 Hz', '48000 Hz'], value: '44100 Hz' },
          { type: 'slider', label: '输入音量增强', key: 'inputGain', min: 0, max: 100, value: 70, unit: '%' },
          { type: 'toggle', label: '自动降噪', key: 'noiseReduction', value: true },
          { type: 'toggle', label: '回声消除', key: 'echoCancellation', value: true }
        ]
      },
      {
        id: 'recognition',
        title: '识别设置',
        icon: 'brain',
        color: 'indigo',
        items: [
          { type: 'select', label: '识别模型', key: 'model', options: ['轻量版 - 实时', '标准版 - 均衡', '专业版 - 高精度'], value: '标准版 - 均衡' },
          { type: 'toggle', label: '声纹识别', key: 'speakerIdentify', value: true },
          { type: 'toggle', label: '实时转写', key: 'realtimeTranscribe', value: true },
          { type: 'slider', label: '识别敏感度', key: 'sensitivity', min: 0, max: 100, value: 80, unit: '%' },
          { type: 'toggle', label: '自动标点', key: 'autoPunctuation', value: true }
        ]
      },
      {
        id: 'language',
        title: '语言设置',
        icon: 'languages',
        color: 'emerald',
        items: [
          { type: 'select', label: '默认语言', key: 'defaultLang', options: ['中文（简体）', '中文（繁体）', 'English', '日本語', '한국어'], value: '中文（简体）' },
          { type: 'toggle', label: '自动检测语言', key: 'autoDetectLang', value: true },
          { type: 'select', label: '翻译目标语言', key: 'targetLang', options: ['不翻译', 'English', '日本語', '한국어', 'Français'], value: '不翻译' },
          { type: 'toggle', label: '专业术语优化', key: 'termOptimize', value: false }
        ]
      },
      {
        id: 'privacy',
        title: '隐私设置',
        icon: 'shield',
        color: 'amber',
        items: [
          { type: 'toggle', label: '本地处理模式', key: 'localMode', value: false, desc: '音频数据不上传云端' },
          { type: 'toggle', label: '自动删除历史', key: 'autoDelete', value: false },
          { type: 'select', label: '数据保留期限', key: 'retention', options: ['7天', '30天', '90天', '永久'], value: '永久' },
          { type: 'toggle', label: '匿名化上传', key: 'anonymize', value: true }
        ]
      },
      {
        id: 'ui',
        title: '界面设置',
        icon: 'monitor',
        color: 'sky',
        items: [
          { type: 'select', label: '主题模式', key: 'theme', options: ['跟随系统', '浅色模式', '深色模式'], value: '跟随系统' },
          { type: 'select', label: '字体大小', key: 'fontSize', options: ['小', '中', '大', '特大'], value: '中' },
          { type: 'toggle', label: '紧凑布局', key: 'compactLayout', value: false },
          { type: 'toggle', label: '显示动画效果', key: 'animations', value: true },
          { type: 'toggle', label: '开机自启', key: 'autoStart', value: false }
        ]
      }
    ];

    categories.forEach(cat => {
      const section = document.createElement('div');
      section.className = 'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden';
      section.innerHTML = `
        <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-${cat.color}-100 dark:bg-${cat.color}-900/30 flex items-center justify-center text-${cat.color}-600 dark:text-${cat.color}-400">
            <i data-lucide="${cat.icon}" class="w-4 h-4"></i>
          </div>
          <h3 class="font-semibold text-slate-900 dark:text-white">${cat.title}</h3>
        </div>
        <div class="divide-y divide-slate-200 dark:divide-slate-700">
          ${cat.items.map(item => `
            <div class="px-5 py-4 flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-900 dark:text-white">${item.label}</p>
                ${item.desc ? `<p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${item.desc}</p>` : ''}
              </div>
              <div class="ml-4 flex-shrink-0">
                ${this.renderControl(item)}
              </div>
            </div>
          `).join('')}
        </div>
      `;
      container.appendChild(section);
    });

    // 底部操作
    const footer = document.createElement('div');
    footer.className = 'flex items-center justify-end gap-3 pt-4';
    footer.innerHTML = `
      <button id="btn-reset-settings" class="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
        恢复默认
      </button>
      <button id="btn-save-settings" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
        保存设置
      </button>
    `;
    container.appendChild(footer);

    return container;
  },

  renderControl(item) {
    switch (item.type) {
      case 'toggle':
        return `
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="setting-toggle sr-only peer" data-key="${item.key}" ${item.value ? 'checked' : ''}>
            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-indigo-600"></div>
          </label>
        `;
      case 'select':
        return `
          <select class="setting-select text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" data-key="${item.key}">
            ${item.options.map(opt => `<option value="${opt}" ${opt === item.value ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        `;
      case 'slider':
        return `
          <div class="flex items-center gap-3 w-48">
            <input type="range" class="setting-slider flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600" data-key="${item.key}" min="${item.min}" max="${item.max}" value="${item.value}">
            <span class="text-xs text-slate-500 dark:text-slate-400 w-10 text-right slider-value" data-key="${item.key}">${item.value}${item.unit || ''}</span>
          </div>
        `;
      default:
        return '';
    }
  },

  init() {
    // 开关变更
    document.querySelectorAll('.setting-toggle').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const key = e.target.dataset.key;
        App.showToast(`设置已更新`, 'success');
      });
    });

    // 选择器变更
    document.querySelectorAll('.setting-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const key = e.target.dataset.key;
        if (key === 'theme') {
          const theme = e.target.value;
          if (theme === '浅色模式') document.documentElement.classList.remove('dark');
          if (theme === '深色模式') document.documentElement.classList.add('dark');
        }
        App.showToast(`设置已更新`, 'success');
      });
    });

    // 滑块变更
    document.querySelectorAll('.setting-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const key = e.target.dataset.key;
        const display = document.querySelector(`.slider-value[data-key="${key}"]`);
        if (display) display.textContent = e.target.value + (display.textContent.replace(/[0-9]/g, ''));
      });
    });

    // 保存按钮
    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      App.showToast('设置已保存', 'success');
    });

    // 重置按钮
    document.getElementById('btn-reset-settings')?.addEventListener('click', () => {
      App.showModal({
        title: '恢复默认设置',
        content: '<p class="text-sm text-slate-600 dark:text-slate-300">确定要恢复所有设置为默认值吗？此操作不可撤销。</p>',
        confirmText: '确认恢复',
        onConfirm: () => {
          App.showToast('已恢复默认设置', 'success');
        }
      });
    });
  }
};
