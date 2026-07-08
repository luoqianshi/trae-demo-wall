/**
 * 导出与集成模块
 */
window.ExportModule = {
  render() {
    const container = document.createElement('div');
    container.className = 'space-y-8';

    // 头部
    const header = document.createElement('div');
    header.innerHTML = `
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <i data-lucide="download" class="w-7 h-7 text-emerald-500"></i>
        导出与集成
      </h2>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">导出为多种格式，连接第三方服务</p>
    `;
    container.appendChild(header);

    // 导出格式选项
    const exportSection = document.createElement('div');
    exportSection.innerHTML = `
      <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <i data-lucide="file-output" class="w-5 h-5 text-emerald-500"></i>
        导出格式
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        ${[
          { id: 'word', name: 'Word', icon: 'file-type', desc: '.docx', color: 'blue' },
          { id: 'pdf', name: 'PDF', icon: 'file-text', desc: '.pdf', color: 'red' },
          { id: 'txt', name: 'TXT', icon: 'file', desc: '.txt', color: 'slate' },
          { id: 'markdown', name: 'Markdown', icon: 'file-code', desc: '.md', color: 'indigo' },
          { id: 'srt', name: 'SRT', icon: 'subtitles', desc: '.srt', color: 'amber' }
        ].map(fmt => `
          <button class="export-format-btn group flex flex-col items-center gap-3 p-5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-${fmt.color}-400 dark:hover:border-${fmt.color}-600 transition-all" data-format="${fmt.id}">
            <div class="w-12 h-12 rounded-xl bg-${fmt.color}-100 dark:bg-${fmt.color}-900/30 flex items-center justify-center text-${fmt.color}-600 dark:text-${fmt.color}-400 group-hover:scale-110 transition-transform">
              <i data-lucide="${fmt.icon}" class="w-6 h-6"></i>
            </div>
            <div class="text-center">
              <p class="font-semibold text-slate-900 dark:text-white text-sm">${fmt.name}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">${fmt.desc}</p>
            </div>
          </button>
        `).join('')}
      </div>
    `;
    container.appendChild(exportSection);

    // 第三方集成
    const integrationSection = document.createElement('div');
    integrationSection.innerHTML = `
      <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <i data-lucide="plug" class="w-5 h-5 text-emerald-500"></i>
        第三方集成
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${[
          { name: '飞书', icon: 'send', status: 'connected', color: 'blue' },
          { name: '钉钉', icon: 'message-square', status: 'disconnected', color: 'cyan' },
          { name: '企业微信', icon: 'smartphone', status: 'connected', color: 'emerald' },
          { name: 'Notion', icon: 'notebook-pen', status: 'disconnected', color: 'slate' }
        ].map(app => `
          <div class="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div class="w-10 h-10 rounded-lg bg-${app.color}-100 dark:bg-${app.color}-900/30 flex items-center justify-center text-${app.color}-600 dark:text-${app.color}-400">
              <i data-lucide="${app.icon}" class="w-5 h-5"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm text-slate-900 dark:text-white truncate">${app.name}</p>
              <p class="text-xs ${app.status === 'connected' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}">
                ${app.status === 'connected' ? '已连接' : '未连接'}
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="integration-toggle sr-only peer" data-app="${app.name}" ${app.status === 'connected' ? 'checked' : ''}>
              <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:after:border-slate-600 peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(integrationSection);

    // API文档
    const apiSection = document.createElement('div');
    apiSection.innerHTML = `
      <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <i data-lucide="code-2" class="w-5 h-5 text-emerald-500"></i>
        API 文档
      </h3>
      <div class="bg-slate-900 rounded-xl overflow-hidden">
        <div class="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
          <div class="flex gap-1.5">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <div class="w-3 h-3 rounded-full bg-amber-500"></div>
            <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
          </div>
          <span class="text-xs text-slate-400 ml-2">api-example.js</span>
        </div>
        <div class="p-4 overflow-x-auto">
          <pre class="text-sm font-mono text-slate-300"><code><span class="text-purple-400">const</span> <span class="text-blue-400">response</span> = <span class="text-purple-400">await</span> <span class="text-yellow-400">fetch</span>(<span class="text-green-400">'https://api.voice.ai/v1/transcribe'</span>, {
  <span class="text-slate-400">method</span>: <span class="text-green-400">'POST'</span>,
  <span class="text-slate-400">headers</span>: {
    <span class="text-green-400">'Authorization'</span>: <span class="text-green-400">'Bearer YOUR_API_KEY'</span>,
    <span class="text-green-400">'Content-Type'</span>: <span class="text-green-400">'application/json'</span>
  },
  <span class="text-slate-400">body</span>: <span class="text-yellow-400">JSON</span>.<span class="text-yellow-400">stringify</span>({
    <span class="text-slate-400">audio_url</span>: <span class="text-green-400">'https://example.com/audio.wav'</span>,
    <span class="text-slate-400">language</span>: <span class="text-green-400">'zh-CN'</span>,
    <span class="text-slate-400">speaker_identify</span>: <span class="text-purple-400">true</span>
  })
});

<span class="text-purple-400">const</span> <span class="text-blue-400">result</span> = <span class="text-purple-400">await</span> <span class="text-blue-400">response</span>.<span class="text-yellow-400">json</span>();
<span class="text-yellow-400">console</span>.<span class="text-yellow-400">log</span>(<span class="text-blue-400">result</span>.<span class="text-slate-400">transcript</span>);</code></pre>
        </div>
      </div>
    `;
    container.appendChild(apiSection);

    return container;
  },

  init() {
    // 导出格式选择
    document.querySelectorAll('.export-format-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const format = btn.dataset.format;
        App.showModal({
          title: '确认导出',
          content: `<p class="text-sm text-slate-600 dark:text-slate-300">确定要导出为 <strong>${format.toUpperCase()}</strong> 格式吗？</p>`,
          confirmText: '立即导出',
          onConfirm: () => {
            App.showToast(`正在导出为 ${format.toUpperCase()} 格式...`, 'success');
          }
        });
      });
    });

    // 集成开关
    document.querySelectorAll('.integration-toggle').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const app = e.target.dataset.app;
        const connected = e.target.checked;
        App.showToast(`${app} ${connected ? '已连接' : '已断开'}`, connected ? 'success' : 'info');
      });
    });
  }
};
