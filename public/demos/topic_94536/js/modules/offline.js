/**
 * 离线文件转写模块
 * 功能：拖拽上传、文件列表、模拟上传/转写进度、结果查看
 */
(function () {
  let files = [];
  let fileIdCounter = 1;

  function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function renderUploadArea() {
    return `
      <div id="off-dropzone" class="mx-4 mt-4 mb-2 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-blue-50 hover:border-blue-400 transition-colors p-8 text-center cursor-pointer">
        <div class="flex flex-col items-center gap-2 pointer-events-none">
          <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <i data-lucide="upload-cloud" class="w-6 h-6 text-blue-600"></i>
          </div>
          <p class="text-sm font-medium text-gray-700">拖拽文件到此处，或点击上传</p>
          <p class="text-xs text-gray-400">支持 MP3, WAV, M4A, MP4, FLAC (最大 500MB)</p>
        </div>
        <input type="file" id="off-file-input" class="hidden" multiple accept="audio/*,video/*">
      </div>
    `;
  }

  function renderFileList() {
    return `
      <div class="flex-1 overflow-y-auto px-4 pb-4">
        <table class="w-full text-left text-sm">
          <thead class="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
            <tr>
              <th class="px-3 py-2 rounded-l-lg">文件名</th>
              <th class="px-3 py-2">大小</th>
              <th class="px-3 py-2">状态</th>
              <th class="px-3 py-2">进度</th>
              <th class="px-3 py-2 rounded-r-lg text-right">操作</th>
            </tr>
          </thead>
          <tbody id="off-file-tbody" class="divide-y divide-gray-100">
            <tr id="off-empty-row">
              <td colspan="5" class="px-3 py-8 text-center text-gray-400 text-xs">暂无文件，请上传音频或视频文件</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  function renderResultModal() {
    return `
      <div id="off-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[80vh]">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 id="off-modal-title" class="font-semibold text-gray-800">转写结果</h3>
            <button id="off-modal-close" class="p-1 rounded-md hover:bg-gray-100 text-gray-500">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
          <div id="off-modal-body" class="flex-1 overflow-y-auto p-4 text-sm text-gray-700 space-y-2"></div>
          <div class="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
            <button id="off-modal-copy" class="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium">复制全文</button>
            <button id="off-modal-export" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">导出</button>
          </div>
        </div>
      </div>
    `;
  }

  function render(container) {
    container.innerHTML = `
      <div class="flex flex-col h-full bg-white">
        ${renderUploadArea()}
        ${renderFileList()}
      </div>
      ${renderResultModal()}
    `;
  }

  function getStatusBadge(status) {
    const map = {
      pending: '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">等待中</span>',
      uploading: '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">上传中</span>',
      transcribing: '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">转写中</span>',
      done: '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">已完成</span>',
      error: '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">失败</span>'
    };
    return map[status] || map.pending;
  }

  function createFileRow(file) {
    const tr = document.createElement('tr');
    tr.id = 'off-row-' + file.id;
    tr.className = 'hover:bg-gray-50 transition-colors';
    tr.innerHTML = `
      <td class="px-3 py-2">
        <div class="flex items-center gap-2">
          <i data-lucide="file-audio" class="w-4 h-4 text-blue-500 flex-shrink-0"></i>
          <span class="font-medium text-gray-700 truncate max-w-[160px]" title="${file.name}">${file.name}</span>
        </div>
      </td>
      <td class="px-3 py-2 text-gray-500">${formatSize(file.size)}</td>
      <td class="px-3 py-2" id="off-status-${file.id}">${getStatusBadge(file.status)}</td>
      <td class="px-3 py-2">
        <div class="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div id="off-progress-${file.id}" class="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style="width: 0%"></div>
        </div>
        <span id="off-pct-${file.id}" class="text-[10px] text-gray-400 mt-0.5 inline-block">0%</span>
      </td>
      <td class="px-3 py-2 text-right">
        <button id="off-view-${file.id}" class="hidden text-blue-600 hover:text-blue-700 text-xs font-medium">查看</button>
      </td>
    `;
    return tr;
  }

  function addFiles(fileList) {
    const tbody = document.getElementById('off-file-tbody');
    const empty = tbody.querySelector('#off-empty-row');
    if (empty) empty.remove();

    Array.from(fileList).forEach(f => {
      const fileObj = {
        id: fileIdCounter++,
        name: f.name,
        size: f.size,
        status: 'pending',
        progress: 0,
        result: generateMockResult(f.name)
      };
      files.push(fileObj);
      const row = createFileRow(fileObj);
      tbody.appendChild(row);
      simulateProgress(fileObj);
    });

    if (window.lucide) lucide.createIcons();
  }

  function generateMockResult(name) {
    const speakers = ['发言人A', '发言人B', '发言人C'];
    let result = `[${name}] 转写结果\n\n`;
    const lines = [
      { s: 0, t: '大家好，今天的会议现在开始。' },
      { s: 1, t: '首先我们来回顾一下上个月的销售数据。' },
      { s: 0, t: '上个月的整体业绩超出了预期，同比增长了15%。' },
      { s: 2, t: '这个增长主要来自于新产品的推动。' },
      { s: 1, t: '我们需要继续保持这个势头，同时关注客户反馈。' },
      { s: 0, t: '接下来讨论一下下个季度的目标。' }
    ];
    lines.forEach((l, i) => {
      result += `[00:${String(i * 2 + 1).padStart(2, '0')}] ${speakers[l.s]}：${l.t}\n`;
    });
    return result;
  }

  function simulateProgress(file) {
    file.status = 'uploading';
    updateFileRow(file);

    let uploadProgress = 0;
    const uploadTimer = setInterval(() => {
      uploadProgress += Math.random() * 15 + 5;
      if (uploadProgress >= 100) {
        uploadProgress = 100;
        clearInterval(uploadTimer);
        file.status = 'transcribing';
        file.progress = 0;
        updateFileRow(file);
        startTranscribe(file);
      } else {
        file.progress = uploadProgress;
        updateFileRow(file);
      }
    }, 400);
  }

  function startTranscribe(file) {
    let tProgress = 0;
    const tTimer = setInterval(() => {
      tProgress += Math.random() * 10 + 3;
      if (tProgress >= 100) {
        tProgress = 100;
        clearInterval(tTimer);
        file.status = 'done';
        file.progress = 100;
        updateFileRow(file);
        if (window.App && App.showToast) App.showToast(`"${file.name}" 转写完成`, 'success');
      } else {
        file.progress = tProgress;
        updateFileRow(file);
      }
    }, 600);
  }

  function updateFileRow(file) {
    const statusEl = document.getElementById('off-status-' + file.id);
    const progressEl = document.getElementById('off-progress-' + file.id);
    const pctEl = document.getElementById('off-pct-' + file.id);
    const viewBtn = document.getElementById('off-view-' + file.id);

    if (statusEl) statusEl.innerHTML = getStatusBadge(file.status);
    if (progressEl) progressEl.style.width = file.progress + '%';
    if (pctEl) pctEl.textContent = Math.round(file.progress) + '%';
    if (viewBtn) {
      if (file.status === 'done') {
        viewBtn.classList.remove('hidden');
      } else {
        viewBtn.classList.add('hidden');
      }
    }

    if (file.status === 'done' && progressEl) {
      progressEl.classList.remove('bg-blue-600');
      progressEl.classList.add('bg-emerald-500');
    }
  }

  function showResult(file) {
    const modal = document.getElementById('off-modal');
    const title = document.getElementById('off-modal-title');
    const body = document.getElementById('off-modal-body');
    title.textContent = file.name + ' - 转写结果';

    // 将纯文本转为带说话人标签的HTML
    const lines = file.result.split('\n').filter(l => l.trim());
    let html = '';
    lines.forEach(line => {
      if (line.startsWith('[') && line.includes(']')) {
        const match = line.match(/^\[(.+?)\]\s*(.+?)：(.+)$/);
        if (match) {
          html += `<div class="flex gap-2"><span class="text-blue-600 font-medium whitespace-nowrap">[${match[1]}] ${match[2]}</span><span class="text-gray-700">${match[3]}</span></div>`;
        } else {
          html += `<div class="text-gray-500 text-xs font-medium mt-2">${line}</div>`;
        }
      } else {
        html += `<div class="text-gray-700">${line}</div>`;
      }
    });
    body.innerHTML = html;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function hideResult() {
    const modal = document.getElementById('off-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  function bindEvents() {
    const dropzone = document.getElementById('off-dropzone');
    const fileInput = document.getElementById('off-file-input');

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('bg-blue-100', 'border-blue-500');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('bg-blue-100', 'border-blue-500');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('bg-blue-100', 'border-blue-500');
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) addFiles(e.target.files);
      fileInput.value = '';
    });

    document.getElementById('off-modal-close').addEventListener('click', hideResult);
    document.getElementById('off-modal').addEventListener('click', (e) => {
      if (e.target.id === 'off-modal') hideResult();
    });

    document.getElementById('off-modal-copy').addEventListener('click', () => {
      const text = document.getElementById('off-modal-body').innerText;
      navigator.clipboard.writeText(text).then(() => {
        if (window.App && App.showToast) App.showToast('已复制到剪贴板', 'success');
      });
    });

    document.getElementById('off-modal-export').addEventListener('click', () => {
      if (window.App && App.showToast) App.showToast('导出功能开发中', 'info');
    });

    // 事件委托：查看按钮
    document.getElementById('off-file-tbody').addEventListener('click', (e) => {
      const btn = e.target.closest('button[id^="off-view-"]');
      if (!btn) return;
      const id = parseInt(btn.id.replace('off-view-', ''), 10);
      const file = files.find(f => f.id === id);
      if (file) showResult(file);
    });
  }

  function init() {
    bindEvents();
    if (window.lucide) lucide.createIcons();
  }

  window.OfflineModule = { render, init };
})();
