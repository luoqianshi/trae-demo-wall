/**
 * 翻译中心模块
 * 双语对照显示区（左原文右译文）
 * 顶部语言选择器（源语言/目标语言），翻译按钮
 * 术语库表格（可添加术语）
 */
const TranslateModule = {
  _container: null,
  _sourceText: '',
  _targetText: '',
  _sourceLang: 'zh',
  _targetLang: 'en',
  _terms: [],
  _langs: [
    { key: 'zh', label: '中文' },
    { key: 'en', label: '英语' },
    { key: 'ja', label: '日语' },
    { key: 'ko', label: '韩语' },
    { key: 'fr', label: '法语' },
    { key: 'de', label: '德语' },
    { key: 'es', label: '西班牙语' },
    { key: 'ru', label: '俄语' }
  ],

  init() {
    this._sourceText = (window.AppData && window.AppData.sourceText) || this._getDefaultSourceText();
    this._targetText = (window.AppData && window.AppData.targetText) || '';
    this._terms = (window.AppData && window.AppData.terms) || this._getDefaultTerms();
  },

  render(container) {
    this._container = container;
    this.init();

    const html = `
      <div class="flex flex-col h-full bg-white">
        <!-- 顶部语言选择器 -->
        <div class="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-4">
          <div class="flex items-center gap-2 flex-1">
            <label class="text-sm text-gray-500 whitespace-nowrap">源语言</label>
            <select id="translate-source-lang" class="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1">
              ${this._langs.map(l => `<option value="${l.key}" ${l.key === this._sourceLang ? 'selected' : ''}>${l.label}</option>`).join('')}
            </select>
          </div>
          <button id="translate-swap-lang" class="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="交换语言">
            <i data-lucide="arrow-left-right" class="w-5 h-5"></i>
          </button>
          <div class="flex items-center gap-2 flex-1">
            <label class="text-sm text-gray-500 whitespace-nowrap">目标语言</label>
            <select id="translate-target-lang" class="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1">
              ${this._langs.map(l => `<option value="${l.key}" ${l.key === this._targetLang ? 'selected' : ''}>${l.label}</option>`).join('')}
            </select>
          </div>
          <button id="translate-btn" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
            <i data-lucide="languages" class="w-4 h-4"></i>
            翻译
          </button>
        </div>

        <!-- 双语对照显示区 -->
        <div class="flex-1 flex min-h-0">
          <!-- 原文 -->
          <div class="flex-1 flex flex-col border-r border-gray-200">
            <div class="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 flex items-center gap-1">
                <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                原文
              </span>
              <button id="translate-clear-source" class="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 transition-colors">
                <i data-lucide="trash-2" class="w-3 h-3"></i>
                清空
              </button>
            </div>
            <textarea id="translate-source-text" class="flex-1 w-full p-4 text-sm text-gray-800 resize-none focus:outline-none leading-relaxed" placeholder="请输入或粘贴需要翻译的文本...">${this._sourceText}</textarea>
            <div class="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
              <span id="source-char-count">${this._sourceText.length} 字符</span>
              <span class="flex items-center gap-1"><i data-lucide="mic" class="w-3 h-3"></i>语音输入</span>
            </div>
          </div>

          <!-- 译文 -->
          <div class="flex-1 flex flex-col">
            <div class="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 flex items-center gap-1">
                <i data-lucide="languages" class="w-3.5 h-3.5"></i>
                译文
              </span>
              <div class="flex items-center gap-1">
                <button id="translate-copy" class="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 transition-colors">
                  <i data-lucide="copy" class="w-3 h-3"></i>
                  复制
                </button>
                <button id="translate-export-doc" class="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 transition-colors">
                  <i data-lucide="download" class="w-3 h-3"></i>
                  导出
                </button>
              </div>
            </div>
            <div id="translate-target-area" class="flex-1 p-4 text-sm text-gray-800 leading-relaxed overflow-y-auto bg-white">
              ${this._targetText ? `<p>${this._formatTargetText(this._targetText)}</p>` : '<p class="text-gray-400 italic">翻译结果将显示在这里...</p>'}
            </div>
            <div class="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
              <span id="target-char-count">${this._targetText.length} 字符</span>
              <span class="flex items-center gap-1"><i data-lucide="sparkles" class="w-3 h-3"></i>AI 翻译</span>
            </div>
          </div>
        </div>

        <!-- 底部术语库 -->
        <div class="h-56 border-t border-gray-200 flex flex-col bg-gray-50">
          <div class="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
            <h4 class="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <i data-lucide="book-open" class="w-4 h-4 text-blue-500"></i>
              术语库
              <span class="text-xs text-gray-400 font-normal">已添加 ${this._terms.length} 条术语</span>
            </h4>
            <button id="terms-add-btn" class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
              <i data-lucide="plus" class="w-4 h-4"></i>
              添加术语
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th class="px-4 py-2.5 text-left font-medium">源术语</th>
                    <th class="px-4 py-2.5 text-left font-medium">译文</th>
                    <th class="px-4 py-2.5 text-left font-medium">领域</th>
                    <th class="px-4 py-2.5 text-left font-medium">备注</th>
                    <th class="px-4 py-2.5 text-center font-medium w-20">操作</th>
                  </tr>
                </thead>
                <tbody id="terms-tbody" class="divide-y divide-gray-100">
                  ${this._renderTermsRows()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加术语弹窗 -->
      <div id="terms-modal" class="hidden fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
          <h3 class="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i data-lucide="plus-circle" class="w-5 h-5 text-blue-500"></i>
            添加术语
          </h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-gray-600 mb-1">源术语</label>
              <input id="term-source" type="text" class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="输入源语言术语" />
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">译文</label>
              <input id="term-target" type="text" class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="输入目标语言译文" />
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">领域</label>
              <input id="term-domain" type="text" class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="如：技术、医学、法律等" />
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">备注</label>
              <textarea id="term-note" rows="2" class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="可选备注"></textarea>
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button id="terms-modal-cancel" class="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-lg transition-colors">取消</button>
            <button id="terms-modal-confirm" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">添加</button>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this._bindEvents();
    if (window.lucide) lucide.createIcons();
  },

  _renderTermsRows() {
    if (this._terms.length === 0) {
      return `
        <tr>
          <td colspan="5" class="px-4 py-8 text-center text-gray-400 text-sm">
            <i data-lucide="book-x" class="w-6 h-6 mx-auto mb-2 opacity-50"></i>
            暂无术语，点击上方按钮添加
          </td>
        </tr>
      `;
    }
    return this._terms.map((term, idx) => `
      <tr class="hover:bg-gray-50 transition-colors group">
        <td class="px-4 py-2.5 text-sm text-gray-800 font-medium">${term.source}</td>
        <td class="px-4 py-2.5 text-sm text-blue-600">${term.target}</td>
        <td class="px-4 py-2.5">
          <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">${term.domain || '通用'}</span>
        </td>
        <td class="px-4 py-2.5 text-xs text-gray-500">${term.note || '-'}</td>
        <td class="px-4 py-2.5 text-center">
          <button class="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors term-delete-btn" data-index="${idx}">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  _formatTargetText(text) {
    return text.replace(/\n/g, '<br/>');
  },

  _bindEvents() {
    const container = this._container;
    const sourceText = container.querySelector('#translate-source-text');
    const targetArea = container.querySelector('#translate-target-area');
    const sourceLang = container.querySelector('#translate-source-lang');
    const targetLang = container.querySelector('#translate-target-lang');

    sourceText.addEventListener('input', () => {
      this._sourceText = sourceText.value;
      container.querySelector('#source-char-count').textContent = `${this._sourceText.length} 字符`;
    });

    container.querySelector('#translate-swap-lang').addEventListener('click', () => {
      const temp = sourceLang.value;
      sourceLang.value = targetLang.value;
      targetLang.value = temp;
      this._sourceLang = sourceLang.value;
      this._targetLang = targetLang.value;

      const tempText = this._sourceText;
      this._sourceText = this._targetText;
      this._targetText = tempText;
      sourceText.value = this._sourceText;
      targetArea.innerHTML = this._targetText ? `<p>${this._formatTargetText(this._targetText)}</p>` : '<p class="text-gray-400 italic">翻译结果将显示在这里...</p>';
      container.querySelector('#source-char-count').textContent = `${this._sourceText.length} 字符`;
      container.querySelector('#target-char-count').textContent = `${this._targetText.length} 字符`;
    });

    sourceLang.addEventListener('change', () => { this._sourceLang = sourceLang.value; });
    targetLang.addEventListener('change', () => { this._targetLang = targetLang.value; });

    container.querySelector('#translate-btn').addEventListener('click', () => {
      if (!this._sourceText.trim()) {
        App.showToast('请输入需要翻译的文本', 'warning');
        return;
      }
      this._simulateTranslate();
    });

    container.querySelector('#translate-clear-source').addEventListener('click', () => {
      this._sourceText = '';
      sourceText.value = '';
      container.querySelector('#source-char-count').textContent = '0 字符';
      App.showToast('原文已清空', 'info');
    });

    container.querySelector('#translate-copy').addEventListener('click', () => {
      if (!this._targetText) {
        App.showToast('暂无译文可复制', 'warning');
        return;
      }
      navigator.clipboard.writeText(this._targetText).then(() => {
        App.showToast('译文已复制到剪贴板', 'success');
      }).catch(() => {
        App.showToast('复制失败', 'error');
      });
    });

    container.querySelector('#translate-export-doc').addEventListener('click', () => {
      if (!this._targetText) {
        App.showToast('暂无译文可导出', 'warning');
        return;
      }
      App.showToast('文档导出功能开发中', 'info');
    });

    const modal = container.querySelector('#terms-modal');
    container.querySelector('#terms-add-btn').addEventListener('click', () => {
      modal.classList.remove('hidden');
      container.querySelector('#term-source').focus();
    });

    container.querySelector('#terms-modal-cancel').addEventListener('click', () => {
      modal.classList.add('hidden');
      this._clearModalInputs();
    });

    container.querySelector('#terms-modal-confirm').addEventListener('click', () => {
      const s = container.querySelector('#term-source').value.trim();
      const t = container.querySelector('#term-target').value.trim();
      if (!s || !t) {
        App.showToast('请填写源术语和译文', 'warning');
        return;
      }
      this._terms.push({
        source: s,
        target: t,
        domain: container.querySelector('#term-domain').value.trim(),
        note: container.querySelector('#term-note').value.trim()
      });
      this._refreshTerms();
      modal.classList.add('hidden');
      this._clearModalInputs();
      App.showToast('术语已添加', 'success');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        this._clearModalInputs();
      }
    });

    this._bindDeleteEvents();
  },

  _bindDeleteEvents() {
    const container = this._container;
    container.querySelectorAll('.term-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        this._terms.splice(idx, 1);
        this._refreshTerms();
        App.showToast('术语已删除', 'info');
      });
    });
  },

  _refreshTerms() {
    const container = this._container;
    container.querySelector('#terms-tbody').innerHTML = this._renderTermsRows();
    const header = container.querySelector('[class*="术语库"]');
    if (header) {
      const span = header.querySelector('span');
      if (span) span.textContent = `已添加 ${this._terms.length} 条术语`;
    }
    this._bindDeleteEvents();
    if (window.lucide) lucide.createIcons();
  },

  _clearModalInputs() {
    const container = this._container;
    container.querySelector('#term-source').value = '';
    container.querySelector('#term-target').value = '';
    container.querySelector('#term-domain').value = '';
    container.querySelector('#term-note').value = '';
  },

  _simulateTranslate() {
    const targetArea = this._container.querySelector('#translate-target-area');
    targetArea.innerHTML = `
      <div class="flex items-center gap-2 text-gray-400">
        <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>
        <span>正在翻译...</span>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      const demoTranslations = {
        'zh-en': 'This is the translated English text. The system supports intelligent speech-to-text conversion, speaker identification, and real-time translation.',
        'zh-ja': 'これは翻訳された日本語テキストです。システムは、インテリジェントな音声テキスト変換、話者識別、リアルタイム翻訳をサポートしています。',
        'en-zh': '这是翻译后的中文文本。系统支持智能语音转写、声纹识别和实时翻译功能。'
      };
      const key = `${this._sourceLang}-${this._targetLang}`;
      this._targetText = demoTranslations[key] || `[${this._sourceLang} -> ${this._targetLang}] 翻译结果演示：\n\n系统已接收您的文本并完成翻译处理。实际应用中将接入专业翻译引擎，提供高质量的机器翻译服务。`;
      targetArea.innerHTML = `<p>${this._formatTargetText(this._targetText)}</p>`;
      this._container.querySelector('#target-char-count').textContent = `${this._targetText.length} 字符`;
      App.showToast('翻译完成', 'success');
    }, 1200);
  },

  _getDefaultSourceText() {
    return `欢迎使用声纹智转系统。

本系统支持智能语音转写、声纹识别和实时翻译功能。
您可以在左侧输入需要翻译的文本，选择源语言和目标语言后点击翻译按钮。`;
  },

  _getDefaultTerms() {
    return [
      { source: '声纹识别', target: 'Voiceprint Recognition', domain: '技术', note: '生物特征识别技术' },
      { source: '语音转写', target: 'Speech-to-Text', domain: '技术', note: 'ASR技术' },
      { source: '说话人分离', target: 'Speaker Diarization', domain: '技术', note: '' }
    ];
  }
};

window.TranslateModule = TranslateModule;
